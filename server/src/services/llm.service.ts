import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are a helpful customer support agent for 'Rups', a fictional e-commerce store.
Your tone is friendly, concise, and professional.

KNOWLEDGE BASE:
- Shipping: We ship to Across India except few tier 3 cities. Free shipping on orders over Rs999. Standard shipping takes 3-5 business days.
- Returns: 30-day return policy for unused items in original packaging. Customer pays return shipping unless the item is defective.
- Support Hours: Mon-Fri, 9 AM - 5 PM IST.
- Contact: support@rupsmart.com.

RULES:
- If you don't know the answer based on the knowledge base, politely ask the user to contact email support.
- Do not make up facts.
- Keep answers under 3-4 sentences if possible.
`;

let genAI: GoogleGenerativeAI | null = null;

const getModel = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please check your .env file.");
    }
    console.log("API Key loaded:", `${apiKey.substring(0, 10)}...`);
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

export const generateReply = async (history: { role: string; parts: string }[], newMessage: string) => {
  try {
    const model = getModel();
    // chat with history appended
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'client' ? 'user' : 'model',
        parts: [{ text: msg.parts }]
      })),
      generationConfig: {
        maxOutputTokens: 300, // cost control
      },
    });
    
    const result = await chat.sendMessage(`${SYSTEM_PROMPT}\n\nUser Question: ${newMessage}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error("Failed to generate response from AI.");
  }
};