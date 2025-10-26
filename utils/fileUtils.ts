
/**
 * Converts a File object to a base64 data URL.
 * @param file The file to convert.
 * @returns A promise that resolves with an object containing the data URL and MIME type.
 */
export const fileToBase64 = (
  file: File
): Promise<{ dataUrl: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({
          dataUrl: reader.result,
          mimeType: file.type,
        });
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
