# GitHub Dependency and Collaboration Visualizer

This fullstack web application visualizes two aspects of a GitHub repository:

- Internal file/module dependencies (based on import statements)
- Contributor collaboration networks (based on pull request reviews)

Users can enter any public GitHub repository (e.g., `vercel/next.js`) and view an animated, interactive graph of either type. The project is optimized for interactivity, modern frontend development, and portfolio visibility.

---

## Features

### Code Dependency Graph

- Parses `.js`, `.ts`, `.tsx`, `.jsx`, `.c`, `.cpp`, `.h`, `.go`, `.py` files
- Detects internal imports using regex-based parsing
- Renders dependency graphs using React Flow and Dagre layout
- Clickable nodes link directly to files on GitHub
- Includes zoom, pan, minimap toggle, fullscreen mode, and dark mode

### Contributor Graph

- Displays pull request author-reviewer relationships as a directed graph
- Custom contributor nodes show avatar and username
- Contributor data retrieved from GitHub’s GraphQL API
- Switch between code and contributor views instantly with animated transitions

---

## Tech Stack

| Layer       | Technologies Used                                  |
|------------|-----------------------------------------------------|
| Framework  | Next.js 14 (App Router), TypeScript                 |
| Frontend   | React 18, Tailwind CSS, React Flow, Framer Motion   |
| Backend    | Next.js API routes                                  |
| Data       | GitHub REST API, GitHub GraphQL API                 |
| Layout     | Dagre (for DAG-style node layout)                   |
| Deployment | Vercel (planned)                                    |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (preferred) or npm
- GitHub personal access token (to avoid rate limits)

### Setup

```bash
git clone https://github.com/your-username/github-visualizer.git
cd github-visualizer
yarn install
cp .env.local.example .env.local
