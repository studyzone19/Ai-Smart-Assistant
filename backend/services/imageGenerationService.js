const { GoogleGenAI } = require("@google/genai");

const IMAGE_MODEL = "gemini-3.1-flash-lite-image";
const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16"]);

async function generateImage(prompt, aspectRatio = "1:1") {
  if (!process.env.AI_API_KEY?.trim() || /^(your_|replace_with|placeholder)/i.test(process.env.AI_API_KEY.trim())) {
    const error = new Error("Image generation is not configured. Add a Google AI API key to the backend environment.");
    error.statusCode = 503;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : "1:1",
        imageSize: "1K",
      },
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
  if (!imagePart) {
    const error = new Error("The image model did not return an image. Try a different description.");
    error.statusCode = 502;
    throw error;
  }

  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    data: imagePart.inlineData.data,
  };
}

module.exports = { generateImage };
