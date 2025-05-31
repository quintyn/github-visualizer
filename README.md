# GitHub Dependency & Collaboration Visualizer

Visualize internal file dependencies and contributor networks from any public GitHub repository.

[Try the Live Demo](https://github-visualizer-unes-git-main-quintyns-projects-e3d867d4.vercel.app/)

---

## What It Does

Enter any public GitHub repository (e.g., `vercel/next.js`) and visualize:

- Internal file and module dependencies  
  (based on import, require, or include statements)

- Contributor collaboration networks  
  (based on pull request review interactions)

---

## Features

### Code Dependency Graph

- Parses `.js`, `.ts`, `.tsx`, `.jsx`, `.c`, `.cpp`, `.h`, `.go`, `.py` files
- Detects internal imports using lightweight regex parsing
- Graph layout powered by React Flow and Dagre
- Clickable nodes open the corresponding GitHub source file
- Zoom, pan, minimap, fullscreen, and dark mode support

### Contributor Network Graph

- Displays pull request author-reviewer relationships
- Contributor nodes include GitHub avatars and usernames
- Uses GitHub’s GraphQL API for contributor data
- Animated toggle between dependency and contributor views

---

## Tech Stack

| Layer       | Technologies Used                                  |
|-------------|-----------------------------------------------------|
| Framework   | Next.js 14 (App Router), TypeScript                 |
| Frontend    | React 18, Tailwind CSS, React Flow, Framer Motion   |
| Backend     | Next.js API routes                                  |
| Data        | GitHub REST API, GitHub GraphQL API                 |
| Graph Layout| Dagre                                               |
| Deployment  | Vercel (Live)                                       |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Yarn or npm
- GitHub personal access token (to avoid API rate limits)

### Setup

```bash
git clone https://github.com/quintyn/github-visualizer.git
cd github-visualizer
yarn install
cp .env.local.example .env.local
# Add your GitHub token to .env.local
yarn dev
```
---

## Screenshots

---

## Roadmap
- Add search and filtering options
- Export graph as SVG or PNG
- Token-based support for private repositories
- Additional theming and visual customization

---

## License
- MIT License

---

## Author
Developed by Quintyn Adams. Feedback and contributions are welcome.

---

