/**
 * wikipediaService.js
 * Fetches real, high-resolution authentic photographs and summaries from Wikipedia / Wikimedia Commons.
 * Used for real-world monuments, celebrities, animals, plants, science, countries, and objects.
 */

const HEADERS = {
  "User-Agent": "RamAI-Assistant/1.0 (https://ramai.app; support@ramai.app)",
  Accept: "application/json",
};

/**
 * Searches Wikipedia for an authentic photograph and summary
 * @param {string} query
 * @returns {Promise<{ title: string, image: string, extract: string, url: string } | null>}
 */
async function getWikipediaMedia(query) {
  if (!query || typeof query !== "string") return null;

  // Clean prompt of common filler keywords
  const cleaned = query
    .replace(/^(show\s+me\s+(an?\s+)?|give\s+me\s+(an?\s+)?|tell\s+me\s+about\s+|what\s+is\s+|who\s+is\s+|generate\s+(an?\s+)?)/gi, "")
    .replace(/\b(ki\s+photo|ki\s+image|ki\s+tasveer|ka\s+photo|ka\s+image|ke\s+photo)\b/gi, "")
    .replace(/\b(image|photo|picture|photos|images|pictures|wallpaper|pic|pics)\b/gi, "")
    .replace(/\b(dikhao|dikhaye|banao|bana|chahiye|overview|details|kaisa\s+dikhta\s+hai)\b/gi, "")
    .replace(/\b(of|for|about|a|an|the|ki|ka|ke|ko)\b/gi, "")
    .replace(/[?!,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 2) return null;

  try {
    // 1. Search for closest matching Wikipedia article
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleaned)}&limit=3&namespace=0&format=json`;
    const searchRes = await fetch(searchUrl, { headers: HEADERS });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    const titles = Array.isArray(searchData[1]) ? searchData[1] : [];
    if (!titles.length) return null;

    const matchedTitle = titles[0];
    const articleUrl = searchData[3]?.[0] || `https://en.wikipedia.org/wiki/${encodeURIComponent(matchedTitle)}`;

    // 2. Query page image (1280px high-res thumbnail) and intro extract
    const queryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(matchedTitle)}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=1280&format=json`;
    const queryRes = await fetch(queryUrl, { headers: HEADERS });
    if (!queryRes.ok) return null;
    const queryData = await queryRes.json();

    const pages = queryData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || page.missing || !page.thumbnail?.source) {
      // Check second title if available
      if (titles.length > 1) {
        const fallbackTitle = titles[1];
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fallbackTitle)}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=1280&format=json`;
        const fbRes = await fetch(fbUrl, { headers: HEADERS });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const fbPage = Object.values(fbData.query?.pages || {})[0];
          if (fbPage?.thumbnail?.source) {
            return {
              title: fbPage.title,
              image: fbPage.thumbnail.source,
              extract: fbPage.extract || "",
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(fbPage.title)}`,
              source: "Wikipedia",
            };
          }
        }
      }
      return null;
    }

    return {
      title: page.title,
      image: page.thumbnail.source,
      extract: page.extract || "",
      url: articleUrl,
      source: "Wikipedia",
    };
  } catch (err) {
    console.warn("Wikipedia fetch failed:", err.message);
    return null;
  }
}

module.exports = { getWikipediaMedia };
