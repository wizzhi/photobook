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

  async addImage(img) {
    const base64Image = img.src
    const image = new Image();

    image.onload = async () => {
      const initialWidth = image.width;
      const initialHeight = image.height;

      const zIndex = parseInt(this.getMaxZIndex()) + 1;
      const imgRect = this.getMaxRect(initialWidth, initialHeight);
      let newImage = new PhotobookImage(base64Image, imgRect.width, imgRect.height, zIndex);
      newImage.left = imgRect.left;
      newImage.top = imgRect.top;
      this.images.push(newImage);
      this.element.appendChild(newImage.element);

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
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
            const response = await fetch(url, { headers: { 'User-Agent': 'YourAppName/1.0' } });
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
            Page.cityCache[key] = city; // Replace Promise with resolved value
            return city;
          } catch (err) {
            console.error('Error fetching city name:', err);
            Page.cityCache[key] = ''; // Replace Promise with empty string on error
            return '';
          }
        })();
        return await Page.cityCache[key];

      };

      // get EXIF from DOM and covert to description
      let desc = '';
      const date = img.getAttribute('exif-date');
      if ( date ) {
        desc = date;
      }
      const lat = img.getAttribute('exif-lat');
      const lon = img.getAttribute('exif-lon');
      if ( lat && lon ) {
        const city = await getCityName(lat, lon);
        desc = city + " " + desc;
      }

      let newTextBox = new TextBox( newImage.width, 40, zIndex + 1);
      Object.assign(newTextBox, {
        left: newImage.left,
        top: newImage.top + imgRect.height - 30,
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

  getMaxRect(imgWidth, imgHeight) {
    const proportions = imgWidth / imgHeight;
    const occupied = this.images.map(img => ({
      left: img.left,
      top: img.top,
      right: img.left + img.width,
      bottom: img.top + img.height
    }));

    // Collect all possible vertical and horizontal edges
    const page_margin = 20;
    const page_L = page_margin,
          page_R = this.width - page_margin,
          page_T = page_margin,
          page_B = this.height - page_margin;
    let xEdges = [ page_L, page_R];
    let yEdges = [ page_T, page_B];
    occupied.forEach(rect => {
      xEdges.push(rect.left, rect.right);
      yEdges.push(rect.top, rect.bottom);
    });

    // Remove duplicates and sort
    xEdges = [...new Set(xEdges)].sort((a, b) => a - b);
    yEdges = [...new Set(yEdges)].sort((a, b) => a - b);

    let bestRect = null;
    let maxArea = 0;

    // Sweep through all possible rectangles
    for (let i = 0; i < xEdges.length - 1; i++) {
      for (let j = 0; j < yEdges.length - 1; j++) {
        const left = xEdges[i];
        const top = yEdges[j];
        const right = xEdges[i + 1];
        const bottom = yEdges[j + 1];
        let width = right - left;
        let height = bottom - top;

        // Fit the aspect ratio
        if (width / height > proportions) {
          width = height * proportions;
        } else {
          height = width / proportions;
        }

        // Skip too small
        if (width < 30 || height < 30) continue;

        // Check if rectangle overlaps any occupied
        const candidate = { left, top, right: left + width, bottom: top + height };
        const overlaps = occupied.some(rect =>
          !(candidate.right <= rect.left ||
            candidate.left >= rect.right ||
            candidate.bottom <= rect.top ||
            candidate.top >= rect.bottom)
        );
        if (!overlaps) {
          const area = width * height;
          if (area > maxArea) {
            maxArea = area;
            bestRect = { width, height, left, top };
          }
        }
      }
    }

    // Fallback: center if no space found
    if (!bestRect) {
      let width = this.width * 0.8;
      let height = width / proportions;
      if (height > this.height * 0.8) {
        height = this.height * 0.8;
        width = height * proportions;
      }
      return { width, height, left: (this.width-width)/2, top: (this.height - height) / 2 };
    }
    return bestRect;
  }

}
