# RepoGraph

RepoGraph is a modern, interactive web application designed to analyze GitHub repositories, map their code dependencies, visualize them as interactive graphs, and enable conversational code intelligence via an AI-powered chatbot. It features a stunning glassmorphic UI, robust user authentication, credit-based usage tracking, and multi-model LLM integration (Gemini and OpenAI).

---

## 📷 Screenshots

### Interactive Dependency Graph & AI Chat
![RepoGraph Dashboard and Chat Assistant](assets/dashboard-chat.png)

### File Analysis & Code Explorer
![RepoGraph File Inspection Detail View](assets/file-details.png)

---

## 🚀 Key Features

*   **Repository Visualizer & Dependency Graphs**: Parses cloned repositories to extract imported modules and construct an interactive graphical dependency network using **Mermaid.js**.
*   **AI-Powered Codebase Overview**: Generates clean, high-level architectural summaries and component details for any repository.
*   **Deep RAG Chat Integration**: Chat with your codebase! Ask complex questions about implementation details, module relationships, or code location, with the option to click reference links in chat to auto-highlight nodes in the graph.
*   **Dual LLM Provider Support**: Fully supports **Google Gemini (Gemini 3.5 Flash)** and **OpenAI (GPT-4o-mini)**. Custom API keys can be supplied via settings or configuration variables.
*   **User Accounts & Billing Simulation**: Register and log in to track analyzed repositories, manage user credits, and simulate credit purchases.
*   **Offline Fallback Capability**: Functions dynamically even when MongoDB is disconnected by falling back to local storage and in-memory caches.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React](https://react.dev/) (bootstrapped with [Vite](https://vite.dev/))
*   **Styling**: Modern, premium dark-mode theme utilizing Vanilla CSS variables and Glassmorphism.
*   **Visualization**: [Mermaid.js](https://mermaid.js.org/) for rendering interactive dependency graphs.
*   **Icons**: [Lucide React](https://lucide.dev/) for high-quality SVG iconography.

### Backend
*   **Server**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (ES Modules)
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) (with robust in-memory fallbacks when offline)
*   **AI Integration**: [LangChain](https://js.langchain.com/) orchestrating Retrieval-Augmented Generation (RAG) and architectural overview summaries.
*   **Auth**: Secure password hashing with `bcryptjs` and session tokens using `jsonwebtoken` (JWT).

---

## 📁 Repository Structure

```text
repograph/
├── client/                 # React/Vite Frontend Application
│   ├── src/
│   │   ├── components/     # UI components (ChatBot, Sidebar, InteractiveGraph, etc.)
│   │   ├── hooks/          # Custom react hooks (API layer, theme switcher)
│   │   ├── pages/          # Layout pages (Dashboard, Auth, Marketing, Landing)
│   │   └── App.jsx         # Root layout and state orchestrator
│   └── package.json
├── server/                 # Node.js/Express Backend Server
│   ├── src/
│   │   ├── config/         # App & DB configuration
│   │   ├── controllers/    # Request handlers (auth, repos, chats)
│   │   ├── models/         # Mongoose Schemas (User, Job, Repository, FileNode)
│   │   ├── routes/         # Express API endpoints
│   │   └── utils/          # Parser, Git, LangChain helpers, Job worker, Fallback DB
│   └── package.json
├── docker-compose.yml      # Orchestrates multi-container services
├── package.json            # Monorepo/Workspace runner
└── README.md               # Documentation
```

---

## ⚙️ Prerequisites

*   **Node.js**: v18 or higher
*   **npm**: v9 or higher
*   **MongoDB**: An active MongoDB local instance or a remote Atlas connection string (optional; has in-memory fallback support if database is unavailable)
*   **Docker**: Required only for containerized deployments (Docker Compose)

---

## 🔧 Local Development Setup

Follow these steps to run RepoGraph on your local machine:

### 1. Install Dependencies
Run the install script from the project root to install packages across the workspace, server, and client:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` in the root directory to `.env` (or create one in the `server` directory) and populate your credentials:
```bash
# ── Server Configuration
PORT=5001

# ── Database Configuration
# Leave blank to use the secure container-local MongoDB service automatically,
# or specify a MongoDB Atlas connection string.
MONGODB_URI=mongodb://localhost:27017/repograph

# ── AI Model Configuration
LLM_PROVIDER=google
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional: custom model version overrides
GEMINI_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Run Dev Server
Launch both the backend server and frontend client concurrently:
```bash
npm run dev
```

*   **Frontend client**: will run at `http://localhost:5173`
*   **Backend server**: will run at `http://localhost:5001`

---

## 🐳 Docker Deployment

To build and run the entire stack (React client served via Nginx and the Node Express server) in isolated containers:

### 1. Build and Start Containers
```bash
docker-compose up --build
```

### 2. Access the Application
*   **Frontend Application**: `http://localhost` (Port 80)
*   **Backend API Service**: `http://localhost:5001`

---

## 🧬 How Repository Analysis Works

1.  **Clone**: The application performs a shallow clone of the user's requested repository branch to a temporary path on the server.
2.  **Parse**: It recursively scans directory files, analyzing import patterns (`import` / `require`) to establish dependency edges, calculate lines of code (LOC), and catalog language percentages.
3.  **Summarize**: LangChain generates context-aware summaries of every file's role and constructs a high-level system-wide architectural overview.
4.  **Vectorize**: The repository codebase metadata is indexed into an in-memory LangChain vector store to enable semantic search and RAG capabilities.
5.  **Interactive Chat**: Users query the chatbot, which queries the indexed vector store for context to provide precise, structured answers about the code architecture.
