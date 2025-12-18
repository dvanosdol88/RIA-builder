import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, X, Bot, Loader2, BookOpen } from 'lucide-react';
import { useIdeaStore } from '../ideaStore';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const GeminiSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ideas } = useIdeaStore();
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'model', text: "Hello! I'm your RIA construction assistant. I can help you refine your ideas, suggest operational improvements, or draft marketing copy. How can I help today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct context from current ideas
            const ideaContext = ideas.map(i => 
                `- [${i.category}] (${i.type}): ${i.text} ${i.refined ? '(Refined)' : ''}`
            ).join('\n');

            const systemPrompt = `You are an expert consultant specializing in building Registered Investment Advisor (RIA) firms. 
            You have deep knowledge of SEC compliance, wealth management technology (Wealthbox, Redtail, Orion, etc.), marketing for financial advisors, and operational best practices.
            
            Current Board State:
            ${ideaContext}

            User Query: ${userMsg.text}

            Provide concise, actionable advice. If the user asks about the board, refer to the Current Board State.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: systemPrompt,
            });

            const modelMsg: Message = { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: response.text || "I couldn't generate a response. Please try again." 
            };
            setMessages(prev => [...prev, modelMsg]);
        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages(prev => [...prev, { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: "Sorry, I encountered an error connecting to Gemini. Please check your API key." 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeBoard = async () => {
        if (isLoading) return;
        const prompt = "Analyze my current board. What key areas am I missing for a launch? Are there any contradictions in my tech stack choices?";
        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: "Analyze my board." };
        setMessages(prev => [...prev, userMsg]);
        setInput(''); 
        setIsLoading(true);

        // We re-use the logic but with a specific prompt
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const ideaContext = ideas.map(i => 
                `- [${i.category}] (${i.type}): ${i.text}`
            ).join('\n');

             const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Context: ${ideaContext}\n\nTask: ${prompt}`,
            });

            const modelMsg: Message = { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: response.text || "Analysis failed." 
            };
            setMessages(prev => [...prev, modelMsg]);

        } catch (error) {
             setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: "Error during analysis." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-96 fixed right-0 top-0 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-700 font-bold">
                    <Sparkles size={20} />
                    <span>Gemini Consultant</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                        }`}>
                            {msg.role === 'model' && <Bot size={16} className="mb-1 text-indigo-500" />}
                            <div className="whitespace-pre-wrap markdown-body">{msg.text}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                            <span className="text-xs text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length < 3 && (
                <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto">
                    <button 
                        onClick={handleAnalyzeBoard}
                        className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 whitespace-nowrap flex items-center gap-1 transition-colors"
                    >
                        <BookOpen size={12} /> Analyze Board
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for advice..."
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeminiSidebar;