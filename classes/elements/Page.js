class Page {
  static cityCache = {}; // <-- shared cache for all Page instances
  constructor(width, height, backgroundImage) {
    this.element = document.createElement(`div`);
    this.element.classList.add(`page`);
    this.element.classList.add(`size-fill-parent`);
    this.element.classList.add(`page`);
    this.width = width;
    this.height = height;
    this.backgroundImage = backgroundImage;
    this.images = [];
    this.textBoxes = [];
    this.visible = false;

    this.observeConfig = { childList: true, subtree: true };
    this.mutationObserver = new MutationObserver(this.deleteRemovedTextOrImageFromStorage);
    this.startPageObservation();
  }

  startPageObservation = () => {
    this.mutationObserver.observe(this.element, this.observeConfig);
  }

  deleteRemovedTextOrImageFromStorage = () => {
    this.images = this.images.filter((img) => {
      if (this.element.contains(img.element)) {
        return img;
      }
    });

    this.textBoxes = this.textBoxes.filter((text) => {
      if (this.element.contains(text.element)) {
        return text;
      }
    });
  }

  // #region Getters and setters
  set visible(value) {
    this.Visible = value;

    if (this.Visible == true) {
      this.element.style.setProperty(`display`, `block`);
    }
    else if (this.Visible == false) {
      this.element.style.setProperty(`display`, `none`);
    }
  }

  get width() {
    return this.Width;
  }

  set width(value) {
    this.Width = value;
    this.element.style.setProperty(`min-width`, `${value}px`);
  }

  get height() {
    return this.Height;
  }

  set height(value) {
    this.Height = value;
    this.element.style.setProperty(`min-height`, `${value}px`);
  }

  get backgroundImage() {
    return this.BackgroundImage;
  }

  set backgroundImage(value) {
    this.BackgroundImage = value;
    this.element.style.setProperty(`background-image`, `url(` + value + `)`);
  }
  // #endregion

  addTextBox(width, height) {
    const zIndex = parseInt(this.getMaxZIndex()) + 1;
    let newTextBox = new TextBox(width || 300, height || 50, zIndex);
    this.textBoxes.push(newTextBox);
    this.element.appendChild(newTextBox.element);
  }

  addImage(base64Image) {
    const image = new Image();

    image.onload = async () => {
      const initialWidth = image.width;
      const initialHeight = image.height;

      const zIndex = parseInt(this.getMaxZIndex()) + 1;
      const imageSize = this.getMaxDimensions(initialWidth, initialHeight);
      const width = imageSize.width;
      const height = imageSize.height;

      let newImage = new PhotobookImage(base64Image, width, height, zIndex);
      newImage.left = (this.width - width)/2
      newImage.top = (this.height - height)/2
      this.images.push(newImage);
      this.element.appendChild(newImage.element);

      // get EXIF data and add text box with it
      const dataURLToArrayBuffer = (dataURL) => {
        const base64 = dataURL.split(',')[1] || '';
        const binaryString = atob(base64);
        const len = binaryString.length;
        const buffer = new ArrayBuffer(len);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < len; i++) {
          view[i] = binaryString.charCodeAt(i);
        }
        return buffer;
      };

      async function getCityName(lat, lon) {
        // Round coordinates to for more effective caching
        // roughtly to 2 decimal places (~1km)
        lat = Math.round(lat * 100) / 100;
        lon = Math.round(lon * 100) / 100;

        const key = `${lat},${lon}`;
        // If a request is already in progress, return the same Promise
        if (Page.cityCache[key]) {
          // If it's a string, it's already resolved; if it's a Promise, it's in progress
          if (typeof Page.cityCache[key] === 'string')
            return Page.cityCache[key];
          return await Page.cityCache[key];
        }
        // Store the Promise in cache
        Page.cityCache[key] = (async () => {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
          const response = await fetch(url, { headers: { 'User-Agent': 'YourAppName/1.0' } });
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
          Page.cityCache[key] = city; // Replace Promise with resolved value
          return city;
        })();
        return await Page.cityCache[key];

      };

      let desc = '';
      try {
        if (typeof ExifReader !== 'undefined') {
          const arrayBuffer = dataURLToArrayBuffer(base64Image);
          const tags = ExifReader.load(arrayBuffer);
          const date = tags.DateTimeOriginal?.description || tags.DateTime?.description || '';
          if (date && date.length > 10)
            desc = date.substr(0, 10).replace(/:/g, '.');
          // now get localtion
          const gpsLat = tags.GPSLatitude;
          const gpsLon = tags.GPSLongitude;
          if (gpsLat && gpsLon) {
            const lat = gpsLat.description;
            const lon = gpsLon.description;
            const city = await getCityName(lat,lon);
            desc = city + " " + desc;
          }
        }
      } catch (err) {
        console.warn('Failed to parse EXIF:', err);
      }

      let newTextBox = new TextBox( newImage.width, 40, zIndex + 1);
      Object.assign(newTextBox, {
        left: newImage.left,
        top: newImage.top + height - 30,
        text: desc,
        fontSize: 9,
        textAlign: 'right',
        backgroundColor: 'transparent',
        textColor: 'white'
      });
      newTextBox.textBox.style.textShadow = `1px 1px 0 #000`;
      this.textBoxes.push(newTextBox);
      this.element.appendChild(newTextBox.element);
    }

    image.src = base64Image;
  }

  getMaxZIndex() {
    let maxIndex = 0;

    this.textBoxes.forEach(textbox => {
      const zIndex = textbox.zIndex;
      if (zIndex > maxIndex) {
        maxIndex = zIndex;
      }
    });

    this.images.forEach(textbox => {
      const zIndex = textbox.zIndex;
      if (zIndex > maxIndex) {
        maxIndex = zIndex;
      }
    });

    return maxIndex;
  }

  getMaxDimensions(initialWidth, initialHeight) {
    const proportions = initialWidth / initialHeight;
    const widthCheck = this.width - initialWidth;
    const heightCheck = this.height - initialHeight;
    let width;
    let height;

    if (widthCheck < heightCheck) {
      width = this.width * 0.8;
      height = width / proportions;
    } else {
      height = this.height * 0.8;
      width = height * proportions;
    }

    return { 'width': width, 'height': height }
  };
}
