# AI Smart Assistant

**Ask. Learn. Code. Create. Search. Analyze.**

A full-stack, production-ready AI assistant platform built on the MERN stack. Built as a complete semester/portfolio project — AI chat, voice input/output, PDF & image understanding, web search, user-controlled AI memory, study mode, coding mode, resume builder, report generator, Hindi/English/Hinglish support, PWA/mobile support, and an admin dashboard.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React, React Markdown |
| Backend | Node.js, Express.js, Mongoose, JWT, bcryptjs, Multer, Helmet, express-rate-limit |
| Database | MongoDB (local or Atlas) |
| AI | Anthropic Claude API (swappable for any OpenAI-compatible endpoint in `backend/services/aiService.js`) |
| Search | Configurable web-search API (Tavily by default, swappable in `backend/services/searchService.js`) |
| Voice | Browser Web Speech API (SpeechRecognition + SpeechSynthesis) — no extra service needed |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

## 2. Project Structure

```
ai-smart-assistant/
├── backend/
│   ├── config/db.js
│   ├── models/          User, Chat, Message, Document, Memory, Resume, Report, Usage
│   ├── middleware/       auth.js, errorHandler.js, upload.js
│   ├── controllers/      auth, chat, memory, document, study, code, search, resume, report, admin
│   ├── routes/           one file per controller
│   ├── services/         aiService.js, pdfService.js, searchService.js
│   └── server.js
└── frontend/
    ├── public/            manifest icons
    └── src/
        ├── pages/         Login, Register, Chat, Study, Code, Documents, Search, Resume, Reports, Memory, Settings, Admin
        ├── components/    Layout, MarkdownView
        ├── context/       AuthContext
        ├── services/      api.js (axios instance)
        └── hooks.js       useVoiceInput, useVoiceOutput
```

## 3. Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod` or a free MongoDB Atlas cluster)
- An Anthropic API key (console.anthropic.com) — or any OpenAI-compatible key, with a small edit to `aiService.js`
- (Optional) A web-search API key — e.g. Tavily — for the Search module

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MONGO_URI, JWT_SECRET, AI_API_KEY, etc.
npm run dev        # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit VITE_API_URL if your backend isn't on localhost:5000
npm run dev         # starts on http://localhost:5173
```

Open `http://localhost:5173`, register an account, and start using the app.

### Making yourself an admin

The first registered user is a normal `user`. To unlock the Admin Dashboard, promote yourself directly in MongoDB:

```js
// in mongosh, connected to your database
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## 4. Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ai-smart-assistant
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
AI_API_KEY=your_anthropic_api_key
AI_MODEL=claude-sonnet-4-5
SEARCH_API_KEY=your_search_api_key
SEARCH_API_URL=https://api.tavily.com/search
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## 5. API Overview

All routes are prefixed with `/api` and (except auth) require `Authorization: Bearer <token>`.

| Module | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me` |
| Chat | `GET/POST /chats`, `GET/POST /chats/:id/messages`, `POST /chats/:id/regenerate`, `DELETE /chats/:id` |
| Memory | `GET/POST /memory`, `PATCH /memory/:id`, `DELETE /memory/:id`, `PATCH /memory/toggle` |
| Documents | `POST /documents/upload`, `POST /documents/:id/ask`, `POST /documents/:id/summarize`, `POST /documents/analyze-image` |
| Study | `POST /study/generate` |
| Coding | `POST /code/assist` |
| Search | `POST /search` |
| Resume | `GET/POST /resume`, `POST /resume/:id/generate` |
| Reports | `POST /reports/generate`, `GET /reports` |
| Admin | `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/usage` |

## 6. Testing Checklist

- [ ] Register + login, protected routes redirect to `/login` when logged out
- [ ] Send a chat message, confirm streaming-style reply, regenerate, copy, delete, pin a chat
- [ ] Mic button requests permission and transcribes speech into the input box
- [ ] Speaker icon on an AI reply reads it aloud; pause/stop works
- [ ] Upload a PDF, ask a grounded question, confirm the answer cites only document content
- [ ] Upload an image, ask a question, confirm vision analysis
- [ ] Generate MCQs/notes/flashcards in Study Mode
- [ ] Generate/debug/explain/optimize code in Coding Mode
- [ ] Run a web search, confirm real source links are shown
- [ ] Add, edit, disable, and delete a memory entry; toggle memory off and confirm chat ignores it
- [ ] Build a resume, generate AI summary + cover letter, save
- [ ] Generate a report, export as Markdown
- [ ] Promote a user to admin in MongoDB, confirm the Admin Dashboard shows stats and usage
- [ ] Install as a PWA on mobile (Add to Home Screen) and confirm it opens standalone

## 7. Deployment

**Backend → Render**
1. Push `backend/` to a GitHub repo (or the root, with Render's root directory set to `backend`).
2. New Web Service → connect repo → build command `npm install`, start command `npm start`.
3. Add all `backend/.env` variables in Render's Environment tab. Set `CLIENT_URL` to your deployed frontend URL.

**Frontend → Vercel**
1. Import the repo, set root directory to `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Add `VITE_API_URL` pointing at your Render backend's `/api` URL.

**Database → MongoDB Atlas**
1. Create a free M0 cluster, add a database user, allow network access from Render (or `0.0.0.0/0` for simplicity).
2. Copy the connection string into `MONGO_URI`.

## 8. Notes on Scope

This is a complete, functioning implementation of every core module in the spec (auth, AI chat with memory, voice I/O, PDF chat, image understanding, web search, study mode, coding mode, resume builder, report generator, multi-language responses, PWA, admin dashboard). A few things worth knowing for a viva/demo:

- **AI provider**: wired to the Anthropic Claude API by default. Swap the client in `aiService.js` if your institution requires OpenAI specifically — the rest of the app is provider-agnostic.
- **Document retrieval** uses a lightweight keyword-overlap scorer instead of a vector database, which keeps the project dependency-free and easy to explain in a viva, but is less precise than embeddings on very large documents.
- **Voice** uses the browser's built-in Web Speech API (no paid service, works offline for playback) — it's not supported in every browser (notably not fully in Firefox), so the mic button hides itself gracefully when unsupported.
- **Rate limiting** is set generously for demo purposes; tighten `backend/server.js` limiter values for production.
