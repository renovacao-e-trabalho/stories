const canvasContainer = document.getElementById('canvas-container');
const chooseFileBtn = document.getElementById('choose-file');
const fileInput = document.getElementById('file-input');
const downloadButton = document.getElementById('download');
const frameSwitch = document.querySelectorAll('input[name="frameOption"]');

let stage, sampleLayer, photoLayer, frameLayer, overlayLayer;
let photo, transformer;
let lastDistance = 0;

// Objetos de moldura pré-carregados
let frameVotanteImg, frameApoiadorImg;

// Criar notificação responsiva
const notification = document.createElement('div');
notification.style.position = 'fixed';
notification.style.bottom = '20px';
notification.style.left = '50%';
notification.style.transform = 'translateX(-50%)';
notification.style.backgroundColor = '#8bd96c';
notification.style.color = '#0030b5';
notification.style.borderRadius = '10px';
notification.style.fontWeight = '600';
notification.style.fontFamily = 'Montserrat, sans-serif';
notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
notification.style.display = 'none';
notification.style.zIndex = '9999';
notification.style.minWidth = '250px';
notification.style.maxWidth = '90%';
notification.style.textAlign = 'center';
notification.style.wordWrap = 'break-word';

// Ajustar padding e font-size conforme tamanho da tela
const adjustNotificationStyle = () => {
  if (window.innerWidth <= 480) { // celular
    notification.style.padding = '20px 15px';
    notification.style.fontSize = '1rem';
  } else { // desktop
    notification.style.padding = '15px 25px';
    notification.style.fontSize = '1rem';
  }
};
adjustNotificationStyle();
window.addEventListener('resize', adjustNotificationStyle);

document.body.appendChild(notification);

// Função para mostrar notificação
const showNotification = (msg, duration = 5000) => {
  notification.textContent = msg;
  notification.style.display = 'block';
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 400);
  }, duration);
};

// Inicialização do canvas
const initCanvas = () => {
  const containerSize = canvasContainer.offsetWidth;

  stage = new Konva.Stage({
    container: 'canvas-container',
    width: containerSize,
    height: containerSize
  });

  // Sample layer (fundo)
  sampleLayer = new Konva.Layer();
  stage.add(sampleLayer);
  const sample = new Image();
  sample.src = 'sample.png';
  sample.onload = () => {
    const sampleImg = new Konva.Image({
      x: 0,
      y: 0,
      image: sample,
      width: stage.width(),
      height: stage.height(),
      listening: false
    });
    sampleLayer.add(sampleImg);
    sampleLayer.draw();
  };

  // Photo layer (foto do usuário)
  photoLayer = new Konva.Layer();
  stage.add(photoLayer);

  transformer = new Konva.Transformer({
    nodes: [],
    rotateEnabled: false,
    enabledAnchors: ['top-left','top-right','bottom-left','bottom-right']
  });
  photoLayer.add(transformer);

  // Frame layer
  frameLayer = new Konva.Layer();
  stage.add(frameLayer);

  // Pré-carregar molduras
  const votanteImg = new Image();
  votanteImg.src = 'Twibbon-Eu-Voto2.png';
  votanteImg.onload = () => {
    frameVotanteImg = new Konva.Image({
      x: 0,
      y: 0,
      image: votanteImg,
      width: stage.width(),
      height: stage.height(),
      visible: true,
      listening: false
    });
    frameLayer.add(frameVotanteImg);
    frameLayer.draw();
  };

  const apoiadorImg = new Image();
  apoiadorImg.src = 'Twibbon-Eu-Apoio2.png';
  apoiadorImg.onload = () => {
    frameApoiadorImg = new Konva.Image({
      x: 0,
      y: 0,
      image: apoiadorImg,
      width: stage.width(),
      height: stage.height(),
      visible: false,
      listening: false
    });
    frameLayer.add(frameApoiadorImg);
    frameLayer.draw();
  };

  // Overlay layer
  overlayLayer = new Konva.Layer();
  stage.add(overlayLayer);
  const overlayStatic = new Image();
  overlayStatic.src = 'overlay.png';
  overlayStatic.onload = () => {
    const overlayImg = new Konva.Image({
      x: 0,
      y: 0,
      image: overlayStatic,
      width: stage.width(),
      height: stage.height(),
      listening: false
    });
    overlayLayer.add(overlayImg);
    overlayLayer.draw();
  };

  // Zoom com scroll
  stage.on('wheel', (e) => {
    if (!photo) return;
    e.evt.preventDefault();
    const oldScale = photo.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
    photo.scaleX(photo.scaleX() * direction);
    photo.scaleY(photo.scaleY() * direction);
    const mousePointTo = {
      x: (pointer.x - photo.x()) / oldScale,
      y: (pointer.y - photo.y()) / oldScale
    };
    photo.x(pointer.x - mousePointTo.x * photo.scaleX());
    photo.y(pointer.y - mousePointTo.y * photo.scaleY());
    photoLayer.draw();
  });
};

// Switch de moldura
frameSwitch.forEach(input => {
  input.addEventListener('change', () => {
    if (input.value === 'votante') {
      if(frameVotanteImg) frameVotanteImg.visible(true);
      if(frameApoiadorImg) frameApoiadorImg.visible(false);
    } else {
      if(frameVotanteImg) frameVotanteImg.visible(false);
      if(frameApoiadorImg) frameApoiadorImg.visible(true);
    }
    frameLayer.draw();
  });
});

// Escolher arquivo
chooseFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

// Upload da foto
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;
    img.onload = () => {
      const containerSize = stage.width();
      const scaleX = containerSize / img.width;
      const scaleY = containerSize / img.height;
      const finalScale = Math.max(scaleX, scaleY);
      const finalWidth = img.width * finalScale;
      const finalHeight = img.height * finalScale;
      const finalX = (containerSize - finalWidth)/2;
      const finalY = (containerSize - finalHeight)/2;

      sampleLayer.destroyChildren();
      sampleLayer.draw();

      if(!photo){
        photo = new Konva.Image({
          x: finalX,
          y: finalY,
          image: img,
          width: finalWidth,
          height: finalHeight,
          draggable: true,
          scaleX: 0,
          scaleY: 0
        });
        photoLayer.add(photo);
        transformer.nodes([photo]);
      } else {
        photo.image(img);
        photo.setAttrs({x: finalX, y: finalY, width: finalWidth, height: finalHeight, scaleX:0, scaleY:0});
      }

      const tween = new Konva.Tween({node:photo, duration:0.5, scaleX:1, scaleY:1, easing:Konva.Easings.EaseInOut});
      tween.play();

      overlayLayer.moveToTop();
      frameLayer.draw();
      photoLayer.draw();

      chooseFileBtn.textContent = 'Escolher outra foto';
      downloadButton.style.display = 'inline-block';
    };
  };
  reader.readAsDataURL(file);
});

// Pinch-to-zoom celular
canvasContainer.addEventListener('touchmove', (e) => {
  if (!photo || e.touches.length !== 2) return;
  e.preventDefault();
  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  const distance = Math.sqrt(dx*dx + dy*dy);
  if(lastDistance){
    const scaleChange = distance/lastDistance;
    photo.scaleX(photo.scaleX()*scaleChange);
    photo.scaleY(photo.scaleY()*scaleChange);
    const centerX = (touch1.clientX+touch2.clientX)/2 - canvasContainer.getBoundingClientRect().left;
    const centerY = (touch1.clientY+touch2.clientY)/2 - canvasContainer.getBoundingClientRect().top;
    const oldScale = photo.scaleX()/scaleChange;
    photo.x(centerX - (centerX - photo.x())*(photo.scaleX()/oldScale));
    photo.y(centerY - (centerY - photo.y())*(photo.scaleY()/oldScale));
  }
  lastDistance = distance;
  overlayLayer.moveToTop();
  photoLayer.draw();
});
canvasContainer.addEventListener('touchend', (e)=>{if(e.touches.length<2) lastDistance=0;});

// Download JPG 100% e mostrar notificação
downloadButton.addEventListener('click', () => {
  if(!photo) return;
  const downloadSize = 800;
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = downloadSize;
  mergedCanvas.height = downloadSize;
  const ctx = mergedCanvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,downloadSize,downloadSize);

  const scaleX = photo.width()*photo.scaleX()/stage.width();
  const scaleY = photo.height()*photo.scaleY()/stage.height();
  const posX = photo.x()/stage.width()*downloadSize;
  const posY = photo.y()/stage.height()*downloadSize;
  ctx.drawImage(photo.getImage(), posX, posY, scaleX*downloadSize, scaleY*downloadSize);

  if(frameVotanteImg && frameVotanteImg.visible()) ctx.drawImage(frameVotanteImg.image(), 0, 0, downloadSize, downloadSize);
  if(frameApoiadorImg && frameApoiadorImg.visible()) ctx.drawImage(frameApoiadorImg.image(), 0, 0, downloadSize, downloadSize);

  const dataURL = mergedCanvas.toDataURL('image/jpeg',1.0);
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'foto_com_moldura.jpg';
  a.click();

  // Notificação responsiva
  showNotification('Foto baixada com sucesso! Compartilhe com os amigos!', 10000);
});

// Redimensionamento responsivo
window.addEventListener('resize', () => {
  const newSize = canvasContainer.offsetWidth;
  stage.width(newSize);
  stage.height(newSize);

  if(frameVotanteImg) {frameVotanteImg.width(newSize); frameVotanteImg.height(newSize);}
  if(frameApoiadorImg) {frameApoiadorImg.width(newSize); frameApoiadorImg.height(newSize);}
  if(overlayLayer) overlayLayer.getChildren().forEach(img=>{img.width(newSize); img.height(newSize);});
  if(photo) {
    const scale = Math.max(newSize/photo.getImage().width,newSize/photo.getImage().height);
    photo.setAttrs({
      x:(newSize-photo.getImage().width*scale)/2,
      y:(newSize-photo.getImage().height*scale)/2,
      width:photo.getImage().width*scale,
      height:photo.getImage().height*scale,
      scaleX:1,
      scaleY:1
    });
  }

  if(sampleLayer) sampleLayer.getChildren().forEach(img=>{img.width(newSize); img.height(newSize);});
  overlayLayer.moveToTop();
  frameLayer.draw();
  photoLayer.draw();
});

initCanvas();
