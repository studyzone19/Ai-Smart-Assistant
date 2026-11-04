const { GoogleGenAI } = require("@google/genai");

const IMAGE_MODEL = "gemini-3.1-flash-lite-image";
const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16"]);

async function generateViaPollinations(prompt, aspectRatio = "1:1") {
  let width = 1024;
  let height = 1024;
  if (aspectRatio === "16:9") {
    width = 1280;
    height = 720;
  } else if (aspectRatio === "9:16") {
    width = 720;
    height = 1280;
  }
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fallback image service error: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  return {
    mimeType: "image/jpeg",
    data: Buffer.from(buffer).toString("base64"),
    provider: "pollinations",
  };
}

async function generateImage(prompt, aspectRatio = "1:1") {
  const chosenRatio = ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : "1:1";

  // If Gemini key is available, try Gemini image generation first
  if (process.env.AI_API_KEY?.trim() && !/^(your_|replace_with|placeholder)/i.test(process.env.AI_API_KEY.trim())) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: prompt,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: chosenRatio,
            imageSize: "1K",
          },
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        return {
          mimeType: imagePart.inlineData.mimeType || "image/png",
          data: imagePart.inlineData.data,
          provider: "gemini",
        };
      }
    } catch (err) {
      console.warn("Gemini image generation unavailable, falling back to Pollinations AI:", err.message);
    }
  }

  // Fallback to Pollinations AI (always available, free, high quality)
  return await generateViaPollinations(prompt, chosenRatio);
}

module.exports = { generateImage };
