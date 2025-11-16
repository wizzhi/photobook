class ImagesView extends EventEmitter {
  constructor() {
    super();
    this.imagesViewDOM = new ImagesViewDOM();
    this.container = null;
    this.init();
  }

  init = () => {
    this.generateDOM();
    this.addInputFileListener();
  }

  generateDOM = () => {
    const container = this.imagesViewDOM.generateElements();
//    container.querySelector('h3').innerHTML = '图片';
    this.container = container;
  }

  addInputFileListener = () => {
    const input = this.container.querySelector('.action-images-importer');
    input.addEventListener('change', this.createImages);
  }

  createImages = async () => {
  const input = this.container.querySelector('.action-images-importer');
  for (const file of Array.from(input.files)) {
    await new Promise((resolve) => {
      const render = new FileReader();
      render.addEventListener('load', async (e) => {
        await this.createImageDOMAndAddItToContainer(e);
        // Yield control to the browser so UI updates
        setTimeout(resolve, 0);
      });
      render.readAsDataURL(file);
    });
  }}

  createImageDOMAndAddItToContainer = async (e) => {
    const image = await this.imagesViewDOM.createImageDOM(e.target.result);
    const imagesContainer = this.container.querySelector('.action-images');
    const imagesContainerDestroyButton = image.querySelector('.action-image-container-delete');
    imagesContainer.addEventListener('click', this.userClickedOnImage);
    imagesContainerDestroyButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      imagesContainer.removeChild(image);
    });
    // if it is empty
    if (!imagesContainer.children.length) {
      imagesContainer.appendChild(image);
      return;
    }
    let date_current_img = (image.children[1]?.getAttribute('exif-date')) || '';
    // before first image older than current image
    for (let child of imagesContainer.children) {
      let date_child = (child.children[1]?.getAttribute('exif-date')) || '';
      if ( date_child > date_current_img) {
        imagesContainer.insertBefore(image, child);
        return;
      }
    }
    // current image is the oldest, add to the end
    imagesContainer.appendChild(image);
  }

  userClickedOnImage = (e) => {
    //this.emit('imageClicked', e.target.src);
    this.emit('imageClicked', e.target);
  }

  activate = () => {
    actionsContainer.appendChild(this.container);
  }

  disable = () => {
    this.container.remove();
  }
}
