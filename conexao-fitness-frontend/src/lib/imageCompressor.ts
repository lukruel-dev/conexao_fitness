/**
 * Utilitário de compressão de imagens no cliente.
 * Redimensiona e comprime imagens de câmeras/celulares para economizar dados e acelerar uploads.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Mantém a proporção redimensionando para o limite máximo
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback para arquivo original
          resolve({ file, dataUrl: String(readerEvent.target?.result || "") });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Converte dataUrl de volta para File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, dataUrl });
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve({ file: compressedFile, dataUrl });
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        // Fallback
        resolve({ file, dataUrl: String(readerEvent.target?.result || "") });
      };

      img.src = String(readerEvent.target?.result);
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
