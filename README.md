# 🎬 ReelGenius

ReelGenius is a production-grade AI-powered SaaS platform designed to assist Instagram creators in analyzing profiles, planning weekly/monthly content strategies, generating scripts, designing visual cover blueprints, and tracking content items through a 7-stage Kanban pipeline.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: JavaScript (ES2024)
*   **Styling & UI**: Tailwind CSS v4, shadcn/ui, Framer Motion
*   **Database**: MongoDB Atlas + Mongoose
*   **State Management**: Zustand
*   **AI Engine**: Google Gemini API (`@google/genai` v2 SDK)
*   **Auth**: Auth.js v5 (Credentials Provider)

---

## 📁 Folder Structure

```
reelgenius/
├── src/
│   ├── app/                    # Next.js App Router Segment layouts & API routes
│   │   ├── (auth)/             # Login and Register pages route grouping
│   │   ├── dashboard/          # Authenticated creator hubs (analyzer, strategy, tracker)
│   │   └── api/                # Serverless controllers & rate-limited AI endpoints
│   ├── components/             # Modular React rendering components
│   │   ├── ui/                 # Core styling primitives (buttons, inputs)
│   │   ├── shared/             # App-wide widgets (EmptyState, PageHeader)
│   │   └── layout/             # Structure shells (Sidebar, Header)
│   ├── lib/                    # Shared helper hooks, stores, and service engines
│   │   ├── instagram/          # Service factory adapters (Mock/RapidAPI)
│   │   ├── prompts/            # Isolated Gemini LLM prompts templates
│   │   └── validations/        # Unified Zod data-integrity validation rules
│   └── models/                 # Mongoose collection declarations
└── public/                     # Static media payloads
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository, navigate to the folder, and install packages:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and populate the keys:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
Start the local server with Turbopack:
```bash
npm run dev
```
Open `http://localhost:3000` to preview.

---

## 🔒 V1 Scope Boundaries

Features explicitly completed in V1:
*   Standard Credentials Registration & Login
*   Mock Instagram profile retrieval adapter
*   Gemini AI Content Strategy & Script generators
*   Embed Cover Design Layouts
*   7-Stage Content Pipeline Board (Kanban drag-and-drop)

Features deferred to V2:
*   AI Interactive Chat console
*   OAuth logins (Google/GitHub)
*   Midjourney/DALL-E image generators
*   Database-backed creator metrics panel

---

## 🔒 V1 Deployment Constraint

NIVO V1 currently relies on process-local concurrency locks for quota-critical AI/scraping workflows.
Initial V1 deployment must run as a persistent single application instance/process.
Serverless, horizontally scaled, clustered, or multi-instance execution requires concurrency-control re-evaluation before deployment.
