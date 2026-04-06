/**
 * Compress and resize an image file to a base64 JPEG string.
 *
 * @param {File} file        – image File from an <input type="file">
 * @param {number} maxSize   – target pixel dimension
 * @param {object} [opts]
 * @param {boolean} [opts.crop=false]   – true: square center-crop to maxSize×maxSize
 *                                        false: proportional scale so longest side ≤ maxSize
 * @param {number}  [opts.quality=0.85] – JPEG quality (0–1)
 * @returns {Promise<string>} base64 data-URL (image/jpeg)
 */
export function compressImage(file, maxSize, { crop = false, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (crop) {
          // Square center-crop (avatar pattern)
          canvas.width = maxSize;
          canvas.height = maxSize;
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize);
        } else {
          // Proportional scale (share-card pattern)
          let w = img.width, h = img.height;
          if (w > maxSize || h > maxSize) {
            const scale = maxSize / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
        }

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}
