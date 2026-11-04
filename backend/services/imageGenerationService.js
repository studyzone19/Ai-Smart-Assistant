const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "16:9", "9:16"]);

const QUALITY_BOOSTERS = {
  photo: "photorealistic 8k uhd, high dynamic range, sharp focus, hyper-detailed skin and hair texture, cinematic studio lighting, shot on 35mm lens, masterpiece photography",
  anime: "masterpiece anime artwork, vibrant colors, crisp clean lines, detailed character design, Makoto Shinkai aesthetic, 8k wallpaper illustration",
  "3d": "octane 3D render, Unreal Engine 5, ray tracing, volumetric lighting, detailed textures, sharp geometry, 8k render, masterpiece",
  cyberpunk: "cyberpunk aesthetic, neon glow, moody futuristic cityscape, high detail reflections, volumetric lighting, cinematic atmosphere, 8k sharp",
  digital: "digital concept art, trending on ArtStation, vivid colors, rich lighting, intricate composition, fantasy masterpiece, sharp detail",
  default: "ultra-detailed, masterpiece, crisp focus, 8k uhd, professional quality, high fidelity, vibrant clean composition",
};

const MODEL_MAP = {
  photo: "flux-realism",
  anime: "flux-anime",
  "3d": "flux-3d",
  cyberpunk: "flux",
  digital: "flux",
  default: "flux",
};

async function fetchImageBuffer(url, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Pollinations HTTP ${res.status}: ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
  } finally {
    clearTimeout(timer);
  }
}

async function generateImage(prompt, aspectRatio = "1:1", style = "default", enhance = true) {
  const chosenRatio = ALLOWED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : "1:1";
  let width = 1024;
  let height = 1024;

  if (chosenRatio === "16:9") {
    width = 1280;
    height = 720;
  } else if (chosenRatio === "9:16") {
    width = 720;
    height = 1280;
  }

  const chosenStyle = (style in MODEL_MAP) ? style : "default";
  const booster = QUALITY_BOOSTERS[chosenStyle] || QUALITY_BOOSTERS.default;
  const primaryModel = MODEL_MAP[chosenStyle] || "flux";

  // Build high-clarity enriched prompt
  const trimmed = prompt.trim();
  const fullPrompt = `${trimmed}, ${booster}`;
  const seed = Math.floor(Math.random() * 9999999);

  // Try primary model (flux / flux-realism / flux-anime / flux-3d)
  const primaryUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=${primaryModel}&width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=${enhance ? "true" : "false"}&private=true`;

  try {
    const buffer = await fetchImageBuffer(primaryUrl);
    return {
      mimeType: "image/jpeg",
      data: buffer.toString("base64"),
      provider: `pollinations-${primaryModel}`,
    };
  } catch (err) {
    console.warn(`Primary model ${primaryModel} failed (${err.message}), trying standard flux fallback...`);
    // Fallback to standard flux
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true`;
    try {
      const buffer = await fetchImageBuffer(fallbackUrl, 30000);
      return {
        mimeType: "image/jpeg",
        data: buffer.toString("base64"),
        provider: "pollinations-flux",
      };
    } catch (fallbackErr) {
      // Last resort: turbo
      console.warn("Flux fallback failed, trying turbo...", fallbackErr.message);
      const turboUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(trimmed)}?model=turbo&width=${width}&height=${height}&nologo=true`;
      const buffer = await fetchImageBuffer(turboUrl, 25000);
      return {
        mimeType: "image/jpeg",
        data: buffer.toString("base64"),
        provider: "pollinations-turbo",
      };
    }
  }
}

module.exports = { generateImage };
