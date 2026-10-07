const { recordUsage } = require("../services/usageService");
const { generateImage } = require("../services/imageGenerationService");

exports.generateImage = async (req, res, next) => {
  try {
    const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ success: false, message: "Describe the image you want to create." });
    if (prompt.length > 1500) return res.status(400).json({ success: false, message: "Image description must be 1500 characters or fewer." });

    const image = await generateImage(prompt, req.body.aspectRatio);
    await recordUsage(req.user._id, "image_generation");
    res.json({ success: true, image });
  } catch (err) {
    const providerMessage = String(err.message || "");
    if (err.status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(providerMessage)) {
      return res.status(429).json({
        success: false,
        code: "IMAGE_QUOTA_UNAVAILABLE",
        message: "Google AI image generation is unavailable because this project has no image quota. Enable Gemini API billing or use a project with image generation enabled, then try again.",
      });
    }
    if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(providerMessage)) {
      return res.status(503).json({
        success: false,
        code: "IMAGE_API_ACCESS_UNAVAILABLE",
        message: "This Google AI key does not have access to image generation. Check the key and model access in Google AI Studio.",
      });
    }
    next(err);
  }
};
