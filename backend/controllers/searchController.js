const { recordUsage } = require("../services/usageService");
const { webSearch } = require("../services/searchService");
const aiService = require("../services/aiService");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

// POST /api/search  { query }
exports.search = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (typeof query !== "string" || !query.trim() || query.length > 500) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const results = await webSearch(query, 5);
    if (!results.length) {
      return res.status(502).json({ success: false, message: "The search provider did not return any usable results. Try a different query." });
    }

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

    await recordUsage(req.user._id, "web_search", { query });

    // Save automatically to Chat History
    try {
      const chatTitle = `[Search] ${query}`.slice(0, 60);
      const chat = await Chat.create({
        user: req.user._id,
        title: chatTitle,
        mode: "chat"
      });
      await Message.create([
        {
          chat: chat._id,
          user: req.user._id,
          role: "user",
          content: query,
          isWebSearch: true
        },
        {
          chat: chat._id,
          user: req.user._id,
          role: "assistant",
          content: answer,
          sources: results,
          isWebSearch: true
        }
      ]);
    } catch (saveErr) {
      console.error("Failed to save search chat history:", saveErr);
    }

    res.json({ success: true, answer, sources: results });
  } catch (err) {
    next(err);
  }
};
