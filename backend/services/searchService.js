/**
 * searchService.js
 * Thin wrapper around a configurable web-search API (e.g. Tavily, Serper,
 * Brave Search). Returns normalized { title, url, snippet } results.
 * Never fabricates sources — if the API call fails, it throws, and the
 * controller is responsible for surfacing that to the client honestly.
 */
const axios = require("axios");

async function webSearch(query, limit = 5) {
  if (!process.env.SEARCH_API_URL || !process.env.SEARCH_API_KEY) {
    throw new Error("Web search is not configured. Set SEARCH_API_URL and SEARCH_API_KEY in .env");
  }

  // Default implementation targets Tavily's API shape.
  // Adjust the request/response mapping if you use a different provider.
  const { data } = await axios.post(
    process.env.SEARCH_API_URL,
    {
      api_key: process.env.SEARCH_API_KEY,
      query,
      max_results: limit,
    },
    { timeout: 10000 }
  );

  const results = (data.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content || r.snippet || "",
  }));

  return results;
}

module.exports = { webSearch };
