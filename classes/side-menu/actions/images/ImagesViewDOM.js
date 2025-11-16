class ImagesViewDOM {
    generateElements = () => {
      const parser = new DOMParser();
      const stringDOM = parser.parseFromString(this.getStringElements(), 'text/html');
      const container = stringDOM.querySelector('.action-images-container');
      return container;
    }

    getStringElements = () => {
      const stringElements = `
          <div class="action-images-container">
              <h3>图片</h3>
              <label for="action-images-importer" class="action-import-images-button">
              <div class="action-images-svg-container">
                <svg class="action-images-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
              </div>
              <div class="action-images-text-container">
                <p>添加图片</p>
              </div>
              </label>
              <input type="file" id="action-images-importer" class="action-images-importer" name="action-images-importer" multiple>
              <div class="action-images"></div>
          </div>
          `;

      return stringElements;
    }

    createImageDOM = async (imageBASE) => {
      const image = await this.createImage(imageBASE);
      const imageContainer = this.createImageContainer();
      imageContainer.appendChild(image);
      // show date if available
      const exifDate = image.getAttribute('exif-date');
      if ( exifDate ) {
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('image-note-overlay');
        dateDiv.style.color = 'white';
        dateDiv.textContent = exifDate;
        imageContainer.appendChild(dateDiv);
      }
      return imageContainer;
    }

    createImage = async (imageBASE) => {
      const image = document.createElement('img');
      image.setAttribute('alt', 'image');
      
      // extract EXIF data and save in DOM
      try {
        if (typeof ExifReader !== 'undefined') {
          const arrayBuffer = this.dataURLToArrayBuffer(imageBASE);
          const tags = ExifReader.load(arrayBuffer);
          let date = tags.DateTimeOriginal?.description || tags.DateTime?.description || '';
          if (date && date.length > 10)
            date = date.substr(0, 10).replace(/:/g, '.');
          image.setAttribute('exif-date', date);

          // now get localtion
          const gpsLat = tags.GPSLatitude;
          if (gpsLat) {
            image.setAttribute('exif-lat', gpsLat.description);
          }
          const gpsLon = tags.GPSLongitude;
          if (gpsLon) {
            image.setAttribute('exif-lon', gpsLon.description);
          }
        }
      } catch (err) {
        console.warn('Failed to parse EXIF:', err);
      }
      // image.style.width = '100px';
      // image.style.height = '200px';

      // convert to JPEG if it is a HEIC image
      if (imageBASE.startsWith('data:image/heic') || imageBASE.startsWith('data:image/heif')) {
        try {
          const blob = await fetch(imageBASE).then(res => res.blob());
          const convertedBlob = await heic2any({ blob: blob, toType: "image/jpeg", quality: 0.9 });
          imageBASE = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(convertedBlob);
          });
        } catch (err) {
          console.error('Failed to convert HEIC image:', err);
        }
      }
      image.setAttribute('src', imageBASE);

      return image;
    }

    dataURLToArrayBuffer = (dataURL) => {
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


    createImageContainer = () => {
      const container = document.createElement('div');
      container.classList.add('action-image-container');
      const destroyContainerButton = this.createDestropContainerButton();
      container.appendChild(destroyContainerButton);
      return container;
    }

    createDestropContainerButton = () => {
      const stringWithDomElements = `
      <div class="action-image-container-delete">
        <svg class="action-image-container-delete-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
      </div>
      `;

      const parser = new DOMParser();
      const stringDOM = parser.parseFromString(stringWithDomElements, 'text/html');
      const container = stringDOM.querySelector('.action-image-container-delete');
      return container;
    }
}
