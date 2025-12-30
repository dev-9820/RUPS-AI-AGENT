import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-4 bg-gray-100 rounded-2xl rounded-tl-none max-w-[100px] border border-gray-200">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
  </div>
);

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const initSession = async () => {
      const storedSession = localStorage.getItem('spur_session_id');
      if (storedSession) {
        setSessionId(storedSession);
        await fetchHistory(storedSession);
      } else {
        await createSession();
      }
    };
    initSession();
  }, []);

  const createSession = async () => {
    try {
      const res = await axios.post(`${API_URL}/session`);
      localStorage.setItem('spur_session_id', res.data.sessionId);
      setSessionId(res.data.sessionId);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/chat/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isTyping) return;

    const userText = input.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: userText, createdAt: new Date().toISOString() }]);
    setInput('');
    setIsTyping(true); // Start animation

    try {
      const res = await axios.post(`${API_URL}/chat/message`, {
        sessionId,
        message: userText
      });

      const reply = res.data.reply;

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: reply,
        createdAt: new Date().toISOString()
      }]);

    } catch (err) {
      console.error("Send error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "⚠️ Failed to send message. Please check your connection." 
      }]);
    } finally {
      setIsTyping(false); // Stop animation
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <div className="w-full max-w-lg bg-white md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100vh] md:h-[850px] border border-slate-200">
        
        <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 shadow-sm z-10 sticky top-0">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight">Rups AI Support</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-500 font-medium">Online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth">
          
          {messages.length === 0 && (
             <div className="text-center text-slate-400 text-sm mt-20 opacity-80">
               <div className="mb-4 flex justify-center">
                 <Bot size={48} strokeWidth={1.5} />
               </div>
               <p>👋 Hello! I'm your AI assistant.</p>
               <p>Ask me about shipping, returns, or policies.</p>
             </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={idx} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex max-w-[85%] md:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-auto shadow-sm
                    ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-600 text-white'}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className={`px-4 py-3 shadow-sm text-sm leading-relaxed
                    ${isUser 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-none'
                    }`}>
                    <div 
                       className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:p-2 prose-pre:rounded"
                    >
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p className={isUser ? "text-indigo-50" : "text-slate-700"} {...props} />,
                          a: ({node, ...props}) => <a className="underline font-bold" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex w-full justify-start animate-in fade-in duration-300">
               <div className="flex gap-2 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center mt-auto shadow-sm">
                    <Bot size={16} />
                 </div>
                 <TypingIndicator />
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
              disabled={isTyping}
              placeholder={isTyping ? "Agent is processing..." : "Type your message..."}
              className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
            
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className={`absolute right-2 p-2 rounded-full transition-all duration-200
                ${!input.trim() || isTyping 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                }`}
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-300 font-medium tracking-wide">POWERED BY SPUR AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;