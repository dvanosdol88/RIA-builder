<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RIA Builder

A practice management and workflow tool for Registered Investment Advisors (RIAs). RIA Builder helps organize and streamline key business areas including prospect experience, client operations, compliance, and growth initiatives.

## Features

- **Idea Management** — Capture, organize, and track ideas across different business categories
- **Kanban Workflows** — Move items through customizable stages (Backlog → In Progress → Done)
- **AI Assistant (GenConsult)** — Integrated Gemini-powered sidebar that acts as an expert consultant.
  - **Context Aware:** Understands your "Canonical Documents" (Constitution) and project constraints.
  - **Autonomous Actions:** Can read, create, and list files in your Google Drive.
- **Google Integration** — Sign in with Google to access your Drive files directly within the app.
- **Capacity Calculator** — Tools for advisor capacity planning and analysis.
- **Firebase Persistence** — Real-time data sync for ideas, settings, and memory.

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore & Auth)
- **AI Integration:** Google Gemini API (via Google GenAI SDK)
- **Build Tool:** Vite

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Firebase Setup:**
   - Ensure your Firebase project (`mg-dashboard-ee066`) has **Google Sign-In** enabled in the [Authentication Console](https://console.firebase.google.com/).
   - Add your local development URL (e.g., `http://localhost:3000`) to the **Authorized Domains** in Firebase Auth settings.

4. **Run the app:**
   ```bash
   npm run dev
   ```

## AI Capabilities

The **GenConsult** AI agent in the sidebar is equipped with advanced tools:
- **`read_google_doc`**: Reads content from your Google Drive files to answer questions.
- **`create_google_doc`**: Generates new documents (plans, summaries, drafts) and saves them to your Drive.
- **`list_drive_files`**: Browses your Drive to find relevant information.
- **`create_card` / `update_card`**: Manages the project board directly.

## Testing

- **Lint:** `npm run lint`
- **E2E (Playwright):** `npm run test:e2e`

## Deployment

Live at: [ria-builder.vercel.app](https://ria-builder.vercel.app)

## Architecture

See [GEMINI.md](GEMINI.md) or [CLAUDE.md](CLAUDE.md) for detailed architecture documentation and development guidelines.