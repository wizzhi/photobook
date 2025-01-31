// #region Functions definitions
const initializePhotobook = () => {
  photobook = new Photobook(dimensions.width, dimensions.height);
  const page = photobook.element;

  const nav = new Nav(photobook);

  projectNameInput.addEventListener(`change`, () => {
    if (projectNameInput.value === ``) {
      projectNameInput.value = `我的新相册`;
    }

    photobook.name = projectNameInput.value;
    console.log(photobook);
  });

  // START Kamil
  const sideMenuController = new SideMenuController();

  sideMenuController.on('file', (action) => {
    switch (action) {
      case 'new': {
        showNewProjectDialog();
        break;
      }

      case 'wizard': {
        photoImportWizard();
        break;
      }

      case 'pdf': {
        photobook.exportToPDF();
        break;
      }

      case 'html': {
        photobook.exportToHTML();
        break;
      }

      case 'pptx': {
        photobook.exportToPPTX();
        break;
      }

      case 'page': {
        photobook.addPage();
        break;
      }

      case 'delete': {
        photobook.deleteActivePage();
        nav.disableOrActivateButton();
        break;
      }

      default: {
        console.log('Unknown command');
      }
    }
  });

  sideMenuController.on('createImage', (imgBase64) => {
    photobook.addImageToActivePage(imgBase64);
  });

  sideMenuController.on('createSticker', (stickerBase64) => {
    photobook.addImageToActivePage(stickerBase64);
  });

  sideMenuController.on('createText', () => {
    photobook.addTextBoxToActivePage();
  });

  sideMenuController.on('background', (background) => {
    photobook.changeActivePageBackground(background);
  });
  // END Kamil
};

function getMaxDimensions() {
  const proportions = 595 / 842;
  const headerHeight = document.querySelector('header').offsetHeight;
  const maxHeight = document.querySelector('.content').offsetHeight - headerHeight;
  const maxWidth = document.querySelector('.content').offsetWidth;
  const widthCheck = maxWidth - 595;
  const heightCheck = maxHeight - 842;
  let width;
  let height;

  if (widthCheck < heightCheck) {
    width = maxWidth * 0.9;
    height = width / proportions;
  } else {
    height = maxHeight * 0.9;
    width = height * proportions;
  }

  return { 'width': width, 'height': height };
}

function showNewProjectDialog() {
  const prompt = new NewProjectDialog();
  const container = document.querySelector(`div.container`);
  container.appendChild(prompt.element);
}

function photoImportWizard() {
  const container = document.querySelector(`div.container`);
  const input = container.querySelector('.action-file-wizard');
  input.addEventListener('change', this.photoSelected);
}

function photoSelected(){
  const container = document.querySelector(`div.container`);
  const input = container.querySelector('.action-file-wizard');
  Array.from(input.files).forEach(file => {
    const render = new FileReader();
    render.addEventListener('load', (e)=>{
      photobook.addImageToActivePage(e.target.result);
      photobook.addTextBoxToActivePage()
    });
    render.readAsDataURL(file);

    EXIF.getData(file, function() {
      t = EXIF.getTag(file,"DateTimeOriginal");
      if( t && t.length >10 )
        s = t.substr(0,10);
      t = EXIF.getTag(file,"Model");
      t2 = EXIF.getTag(file,"Make");
      if( t.indexOf(t2) < 0 ){
        // ignore "NIKON CORPORATION" 
        if( t2.indexOf("NIKON") < 0 )
          t = t2 + " " + t;
      }
      if( t && t.length >1 )
        s +=  " ["+t+"]"
      t = EXIF.getTag(file,"FNumber")
      if( t )
        s +=  " F"+t
      t = EXIF.getTag(file,"ExposureTime")
      if( t )
        s +=  " "+t.numerator+"/"+t.denominator+"s"
      t = EXIF.getTag(file,"ISOSpeedRatings")
      if( t )
        s +=  " ISO"+t
      alert(s)
      //alert(EXIF.pretty(file));
    });


  });
}


// #endregion

dimensions = getMaxDimensions();
const projectNameInput = document.querySelector(`#project-name`);
let photobook;
initializePhotobook();
