# Gratitude — AI Mental Health Safety Research App

## Overview

This app was built as the technical foundation for my senior capstone at Minerva University, researching context blindness in AI mental health applications. The core question: can AI systems recognize when positive emotional expressions actually mask psychological distress in vulnerable populations?

The gratitude journaling format was chosen deliberately. Its positive-by-design nature makes it the hardest environment to catch context blindness, which makes it the ideal testing ground.

This is not a consumer product. It is a research tool built to look and feel like one.

---

## Demo

[Watch the code walkthrough and live demo on Loom](https://www.loom.com/share/d3bf50b7f57d400a9abd6efe94d23e16) 

---

## Architecture

Two servers run simultaneously:

```
Next.js (port 3000)        Flask (port 5001)
──────────────────         ─────────────────
UI pages                   Auth (JWT)
Components                 Database (SQLite)
flask-client.ts  ───────>  Entries API
                           Stress Relief API
                           Crisis Detection
                           Safety Layer
```

The Next.js app is purely a frontend. All data handling lives in Flask.

**Backend file structure:**
```
backend/
  app.py           Flask init, config, blueprint registration
  extensions.py    Shared db instance
  models.py        User, Entry, StressQuery models
  auth.py          JWT helpers, token_required decorator, auth routes
  safety.py        Crisis detection and cosine similarity
  routes/
    entries.py     Journal entry routes
    stress.py      Stress relief routes
```

---

## Setup and Running

### Prerequisites
- Python 3.9+
- Node.js and Yarn
- An OpenAI API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
OPENAI_API_KEY=your_key_here
SECRET_KEY=any_random_string
```

Then run:
```bash
python app.py
```

Flask starts on `http://localhost:5001`. The SQLite database is created automatically on first run.

### Frontend

From the project root:
```bash
yarn
yarn dev
```

Next.js starts on `http://localhost:3000`.

Both servers must be running at the same time for the app to work.

---

## Features

**Gratitude Journaling**
Write and save daily gratitude entries. Entries are stored in a local SQLite database and only accessible to the authenticated user.

**AI Stress Relief**
Submit a stressor and the app finds your most semantically relevant past gratitude entries using OpenAI embeddings and cosine similarity. Those entries are passed to GPT-3.5-turbo as context to generate a personalized reflection.

**Crisis Detection**
Every entry and every stressor is evaluated by GPT-4 before any AI response is generated or any content is saved. If crisis content is detected, the app returns category-specific crisis resources and does not save the content to the database.

**Interaction History**
All stress relief interactions are logged for research analysis, including which gratitude entries were retrieved and their similarity scores.

**Entry Visualization**
A bar chart shows entry frequency over the last 7 days.

---

## Safety System

The safety layer runs in two places:

1. **On journal entry submission** — before saving to the database
2. **On stress relief input** — before generating any AI response

GPT-4 evaluates content against four crisis categories: suicide, self-harm, abuse, and psychosis. If flagged, the system returns a modal with appropriate professional resources. The content is never saved and the AI never generates a response to crisis-level input.

The stress relief AI prompt also includes a context blindness check as a secondary layer, implemented as a mandatory three-step sequential instruction. This was the primary research contribution of the project: testing whether AI systems can detect when positive emotional framing masks psychological distress.

---

## Limitations

This app is a research testing environment, not a production product. 
---

## Research Context

This app was built as part of a capstone on context blindness in AI mental health applications at Minerva University. The full framework, testing methodology, clinical persona development, and findings are documented in the capstone paper.

If you want to know more about the research, feel free to reach out at linaelatik@gmail.com.

---

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Flask, SQLAlchemy, SQLite
- **AI:** OpenAI GPT-4 (safety), GPT-3.5-turbo (reflections), text-embedding-ada-002 (semantic search)
- **Auth:** JWT with 30-day expiration, SHA256 password hashing