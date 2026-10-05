const Usage = require("../models/Usage");
const { webSearch } = require("../services/searchService");
const aiService = require("../services/aiService");

// POST /api/search  { query }
exports.search = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const results = await webSearch(query, 5);

    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
      .join("\n\n");

    const answer = await aiService.complete(
      [
        {
          role: "user",
          content: `Search results for "${query}":\n\n${context}\n\nUsing only the information above, write a concise, well-organized answer to the query. Reference sources by number like [1].`,
        },
      ],
      {
        system: "You answer questions using provided web search results only. Never fabricate sources or facts not present in the results.",
        language: req.user.preferredLanguage,
      }
    );

    await Usage.create({ user: req.user._id, action: "web_search", meta: { query } });
    res.json({ success: true, answer, sources: results });
  } catch (err) {
    next(err);
  }
};
