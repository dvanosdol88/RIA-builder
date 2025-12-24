import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, X, Bot, Loader2, Settings, Database, Trash2, Plus } from 'lucide-react';
import { useIdeaStore } from '../ideaStore';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface CanonDoc {
    id: string;
    title: string;
    content: string;
}

const GeminiSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ideas } = useIdeaStore();

    // --- VIEW STATE ---
    // 'chat' = Main Interface
    // 'canon' = Knowledge Base (Master Index, etc.)
    // 'settings' = User Profile & Constraints
    const [activeView, setActiveView] = useState<'chat' | 'settings' | 'canon'>('chat');

    // --- CHAT STATE ---
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'model', text: "Hello David! I am aligned with your Master Index and constraints. How shall we proceed?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- SETTINGS STATE (With "Do Not Use" Defaults) ---
    const [userContext, setUserContext] = useState(
        "I am David, a CFA & CFP professional. I prefer concise, technical answers. I am building a technology-first RIA."
    );
    const [projectConstraints, setProjectConstraints] = useState(
        `Budget: Low-cost/Bootstrapped.
Timeline: Launch in 3 months.
Location: Connecticut.
Key Tech: Wealthbox, Altruist.

STRICT RESTRICTIONS (DO NOT USE/SUGGEST):
- Vendors: Advyzon, FP Alpha, Salesforce.
- Tools: Notion, Figma.`
    );

    // --- KNOWLEDGE BASE (CANON) STATE ---
    // Initialize with a placeholder Master Index
    const [canonDocs, setCanonDocs] = useState<CanonDoc[]>([
        { id: '1', title: 'Master Index', content: '1. Compliance First.\n2. Tech-enabled workflows.\n3. Low overhead.' }
    ]);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocContent, setNewDocContent] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeView === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeView]);

    // --- CANON MANAGEMENT HELPERS ---
    const addDoc = () => {
        if (!newDocTitle.trim() || !newDocContent.trim()) return;
        setCanonDocs(prev => [...prev, { id: crypto.randomUUID(), title: newDocTitle, content: newDocContent }]);
        setNewDocTitle('');
        setNewDocContent('');
    };

    const deleteDoc = (id: string) => {
        setCanonDocs(prev => prev.filter(d => d.id !== id));
    };

    // --- MAIN LOGIC ---
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            // 1. Prepare Board Context (Dynamic from Store)
            const ideaContext = ideas.map(i =>
                `- [${i.category}]: ${i.text}`
            ).join('\n');

            const today = new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            // 2. Prepare Canon Context (The Constitution)
            const canonContext = canonDocs.map(doc =>
                `DOCUMENT: ${doc.title.toUpperCase()}\nCONTENT:\n${doc.content}\n---`
            ).join('\n');

            // 3. Construct the System Instruction
            const systemInstruction = `
            Role: You are the Guardian of the RIA Project. You are an expert Consultant.

            CRITICAL INSTRUCTIONS:
            1. You possess a set of "Canonical Documents". These are the Single Source of Truth.
            2. If the user's Board State or Query contradicts the Canon, you must gently correct them.
            3. ADHERE STRICTLY to the Project Constraints. Do not suggest vendors on the restriction list.

            --- THE CANON (IMMUTABLE TRUTH) ---
            ${canonContext}
            -----------------------------------

            CONTEXT:
            - Date: ${today}
            - User: ${userContext}
            - Constraints & Restrictions: ${projectConstraints}

            CURRENT BOARD STATE (Working Drafts):
            ${ideaContext}
            `;

            // 4. Prepare History (Memory)
            const historyContents = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                }));

            // 5. Execute API Call
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                config: {
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                },
                contents: [
                    ...historyContents,
                    { role: 'user', parts: [{ text: userMsg.text }] }
                ]
            });

            const responseText = response.text() || "I couldn't generate a response.";

            const modelMsg: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                text: responseText
            };
            setMessages(prev => [...prev, modelMsg]);

        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'model',
                text: "Connection error. Please check your API key."
            }]);
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

                {/* View Toggles */}
                <div className="flex gap-1 bg-gray-200 rounded p-1">
                    <button
                        onClick={() => setActiveView('chat')}
                        className={`p-1.5 rounded transition-all ${activeView === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Chat"
                    >
                        <Bot size={16} />
                    </button>
                    <button
                        onClick={() => setActiveView('canon')}
                        className={`p-1.5 rounded transition-all ${activeView === 'canon' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Knowledge Base (Canon)"
                    >
                        <Database size={16} />
                    </button>
                    <button
                        onClick={() => setActiveView('settings')}
                        className={`p-1.5 rounded transition-all ${activeView === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>

                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 ml-2">
                    <X size={20} />
                </button>
            </div>

            {/* --- VIEW: CHAT --- */}
            {activeView === 'chat' && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
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
                                    <span className="text-xs text-gray-500">Aligning with Canon...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask for advice..."
                                disabled={isLoading}
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
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
                </>
            )}

            {/* --- VIEW: CANON (KNOWLEDGE BASE) --- */}
            {activeView === 'canon' && (
                <div className="flex-1 p-4 bg-gray-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Canonical Documents</h3>
                    <p className="text-xs text-gray-500 mb-4">The AI will strictly align all advice with these documents.</p>

                    {/* List of Docs */}
                    <div className="space-y-3 mb-6">
                        {canonDocs.map(doc => (
                            <div key={doc.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-indigo-700 text-sm">{doc.title}</span>
                                    <button onClick={() => deleteDoc(doc.id)} className="text-gray-300 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-3 font-mono bg-gray-50 p-1 rounded">
                                    {doc.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add New Doc */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                        <div className="text-xs font-bold text-indigo-600 uppercase mb-2">Add New Document</div>
                        <input
                            className="w-full mb-2 p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none"
                            placeholder="Title (e.g. Master Index)"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full h-32 p-2 text-sm border border-gray-300 rounded focus:border-indigo-500 outline-none resize-none mb-2 font-mono text-xs"
                            placeholder="Paste full text here..."
                            value={newDocContent}
                            onChange={(e) => setNewDocContent(e.target.value)}
                        />
                        <button
                            onClick={addDoc}
                            disabled={!newDocTitle || !newDocContent}
                            className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={16} /> Add to Knowledge Base
                        </button>
                    </div>
                </div>
            )}

            {/* --- VIEW: SETTINGS --- */}
            {activeView === 'settings' && (
                <div className="flex-1 p-4 space-y-6 overflow-y-auto bg-gray-50 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">Consultant Configuration</h3>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            Who are you? (Context)
                        </label>
                        <textarea
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            Project Rules & Restrictions
                        </label>
                        <textarea
                            value={projectConstraints}
                            onChange={(e) => setProjectConstraints(e.target.value)}
                            className="w-full h-48 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Add "Do Not Use" lists here to prevent Gemini from suggesting restricted vendors or tools.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setActiveView('chat')}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
                        >
                            Return to Chat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeminiSidebar;
