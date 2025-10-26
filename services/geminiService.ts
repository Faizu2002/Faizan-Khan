
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits an image using a text prompt with the Gemini 2.5 Flash Image model.
 * @param base64ImageData The base64 encoded image data (without the data URL prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/png').
 * @param prompt The text prompt describing the desired edits.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const editImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    // This fallback handles cases where the API might not return an image
    // due to safety policies or if the prompt is misunderstood.
    throw new Error("No image data was returned from the API. The prompt may have violated safety policies.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Re-throw a more user-friendly error
    throw new Error("An error occurred while communicating with the Gemini API.");
  }
};
