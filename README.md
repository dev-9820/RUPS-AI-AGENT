# Rups AI Support Agent
A robust, full-stack AI customer support widget built for the Spur Founding Engineer assignment. This application simulates a real-time support agent for an e-commerce store ("Rups"), capable of answering questions about shipping, returns, and policies using the Google Gemini 2.5 Flash model.

## 🚀 Quick Start (Run Locally)
This project uses a monorepo structure. You will need Node.js (v18+) and a Google Gemini API Key.

### Backend Setup
The backend runs on Express, TypeScript, and Prisma (SQLite).


- Create .env file 
- OR manually create .env and add:
```
GEMINI_API_KEY="your_google_api_key_here"
```

- Navigate to server
- Install dependencies
- Start the Server
```
cd server
npm install
npm run dev
```
### Frontend Setup
The frontend is a React + Vite app.\

- Create .env file in client
```
VITE_API_URL=http://localhost:3000/api
```

- Open a new terminal and navigate to client
- Install dependencies
- Start Frontend
```
cd client
npm install
npm run dev
```

## 🛠️ Architecture Overview
The system follows a clean, separated client-server architecture designed for extensibility.

The Backend is built on Node with TypeScrip and Gemini Flash model for LLM.
The Frontend is built with React & Vite.

There are just 2 models for backend, Messages & Sessions
In frontend, It simply stores the session in the localstorage, and checks for one on page load, if already present, fetches the messages from that Session, 
if not present, creates a new one.

I used React Hooks majorly like useRef for smooth scroll to the bottom, and useStates for Loading States, Typing indicators.

## 🧠 LLM Integration & Prompting

Provider used is  Google Gemini 2.5 Flash.
for its fast inference speed (low latency is critical for chat) and a free tier for development.

- Prompt Engineering
I used a System Prompt Injection strategy. The AI is grounded with a hardcoded knowledge base in the SYSTEM_PROMPT constant.

The Prompt Structure:
- Persona: "You are a helpful customer support agent..."
- Knowledge Base: Hard facts about shipping, returns, and hours.
- Guardrails: "If you don't know, ask user to email support." (Prevents hallucinations).
- Tone Constraints: "Keep answers under 3-4 sentences."

### Context Management
The backend fetches the last 10 messages from the SQL database and appends them to the API call. 
This allows the user to have a multi-turn conversation (e.g., "What is the return policy?" -> "Does that apply to sale items?").

## ⚖️ Design Decisions & Trade-offs

- Synchronous vs. Asynchronous (The Pivot)
I initially implemented a Redis Queue with a Bullmq worker to handle LLM requests asynchronously, to scale LLM workloads to handle bursts.
I encountered significant network friction (Firewall/Proxy ETIMEDOUT issues) when bridging local dev environments with cloud Redis providers on the free tier.

Final Decision: To ensure the assignment is robust and runnable for the reviewer without complex Docker networking, I simplified to a Synchronous REST API.
Trade-off: We lose burst handling capability, but gain deployment simplicity and reliability for a single-user demo.

### If I had more time...
I would:
1. Re-introduce Redis: Bring back the Job Queue for rate limiting and decoupling the heavy LLM processing from the HTTP layer

2. RAG (Retrieval Augmented Generation): Instead of hardcoding the Knowledge Base in the prompt, I would store policies in a Vector Database (like Pinecone or pgvector) and retrieve only relevant context. This allows the knowledge base to grow infinitely

3. WebSockets: Switch from HTTP POST to Socket.io for real-time streaming of the AI response (typing effect character bycharacter)
