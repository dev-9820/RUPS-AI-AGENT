import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateReply } from './src/services/llm.service.js';

dotenv.config();
const app = express();
const prisma = new PrismaClient();


app.use(cors());
app.use(express.json());

// 1. Get Chat History
app.get('/api/chat/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

// create session
app.post('/api/session', async (req, res) => {
  const session = await prisma.session.create({ data: {} });
  res.json({ sessionId: session.id });
});

// send message
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message and Session ID required" });
    }

    // A. Check persistence
    let session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      session = await prisma.session.create({ data: { id: sessionId } });
    }

    // B. Save User Message
    await prisma.message.create({
      data: { sessionId, role: 'user', content: message }
    });

    // C. Fetch History (Limit context window for cost/performance)
    const history = await prisma.message.findMany({
      where: { sessionId },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    // Format for Gemini Service
    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'client' : 'model',
      parts: h.content
    }));

    // D. Call LLM
    const aiResponse = await generateReply(formattedHistory, message);

    // E. Save AI Response
    const savedAiMsg = await prisma.message.create({
      data: { sessionId, role: 'model', content: aiResponse }
    });

    res.json({ reply: aiResponse, messageId: savedAiMsg.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));