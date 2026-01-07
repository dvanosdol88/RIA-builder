<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RIA Builder

A practice management and workflow tool for Registered Investment Advisors (RIAs). RIA Builder helps organize and streamline key business areas including prospect experience, client operations, compliance, and growth initiatives.

## Features

- **Idea Management** — Capture, organize, and track ideas across different business categories
- **Kanban Workflows** — Move items through customizable stages (Backlog → In Progress → Done)
- **AI Assistant** — Integrated Gemini-powered sidebar for contextual help and insights
- **Capacity Calculator** — Tools for advisor capacity planning and analysis
- **Firebase Persistence** — Real-time data sync across sessions

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore)
- **AI Integration:** Google Gemini API
- **Build Tool:** Vite

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env](.env) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## Deployment

Live at: [ria-builder.vercel.app](https://ria-builder.vercel.app)

## Architecture

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation and development guidelines.
