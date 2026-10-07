/**
 * searchService.js
 * Thin wrapper around a configurable web-search API (e.g. Tavily, Serper,
 * Brave Search). Returns normalized { title, url, snippet } results.
 * Never fabricates sources — if the API call fails, it throws, and the
 * controller is responsible for surfacing that to the client honestly.
 */
const axios = require("axios");

async function webSearch(query, limit = 5) {
  const apiUrl = process.env.SEARCH_API_URL?.trim();
  const apiKey = process.env.SEARCH_API_KEY?.trim();
  if (!apiUrl || !apiKey || /^(your_|replace_with|placeholder)/i.test(apiKey)) {
    const error = new Error("Live search is not configured yet. Add a valid Tavily API key as SEARCH_API_KEY in backend/.env, then restart the backend.");
    error.statusCode = 503;
    throw error;
  }

  // Default implementation targets Tavily's API shape.
  // Adjust the request/response mapping if you use a different provider.
  let data;
  try {
    ({ data } = await axios.post(
      apiUrl,
      { api_key: apiKey, query, max_results: limit },
      { timeout: 10000 }
    ));
  } catch (cause) {
    const status = cause.response?.status;
    const message = status === 401 || status === 403
      ? "The search provider rejected SEARCH_API_KEY. Check that backend/.env contains a valid Tavily API key, then restart the backend."
      : cause.code === "ECONNABORTED"
        ? "The search provider took too long to respond. Please try again."
        : "Could not reach the search provider. Check the backend connection and SEARCH_API_URL.";
    const error = new Error(message);
    error.statusCode = status === 401 || status === 403 ? 503 : status === 429 ? 429 : 502;
    throw error;
  }

  const results = (Array.isArray(data.results) ? data.results : []).flatMap((result) => {
    try {
      const url = new URL(result.url);
      if (!['http:', 'https:'].includes(url.protocol)) return [];
      return [{
        title: String(result.title || url.hostname).slice(0, 200),
        url: url.toString(),
        snippet: String(result.content || result.snippet || "").slice(0, 1200),
      }];
    } catch {
      return [];
    }
  }).slice(0, limit);

  return results;
}

module.exports = { webSearch };
