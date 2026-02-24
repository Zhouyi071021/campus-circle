/**
 * 压缩图片
 * @param {File} file 原始图片文件
 * @param {Object} options 配置 { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} 压缩后的 File 对象
 */
export function compressImage(file, { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'webp' } = {}) {
  return new Promise((resolve, reject) => {
    // 检测是否支持 WebP
    const supportWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    const outputFormat = supportWebP && format === 'webp' ? 'image/webp' : 'image/jpeg';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.floor((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.floor((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputFormat,
          quality
        );
      };
    };
  });
}