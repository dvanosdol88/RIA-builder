import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Loader2,
  Settings,
  Database,
  Trash2,
  Plus,
  Mic,
  MicOff,
  Save,
} from 'lucide-react';
import {
  useIdeaStore,
  Category,
  CATEGORY_STRUCTURE,
  Stage,
} from '../ideaStore';
import { useConsultantStore } from '../consultantStore';
import { useDocumentStore } from '../documentStore';
import { calculatorAPI } from '../services/calculatorService';
import * as firebaseService from '../services/firebaseService';
import { CHECKLIST_PAGES } from './PreLaunchChecklistView';
import { extractText } from '../utils/documentTextExtractor';

// Map human-readable category names to our Category codes
const CATEGORY_MAP: Record<string, Category> = {
  'prospect experience': 'A',
  prospect: 'A',
  marketing: 'A',
  'marketing and onboarding': 'A',
  'client experience': 'B',
  client: 'B',
  'advisor experience': 'F',
  advisor: 'F',
  'tech stack': 'C',
  tech: 'C',
  vendors: 'C',
  compliance: 'D',
  roadmap: 'E',
  growth: 'E',
  a: 'A',
  b: 'B',
  f: 'F',
  c: 'C',
  d: 'D',
  e: 'E',
};

// --- GEMINI FUNCTION CALLING TOOL DEFINITION ---
const createCardTool = {
  name: 'create_card',
  description:
    'Creates a new card on the project board. Use this when the user asks to create, add, or generate cards/ideas/items.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The card title/text describing the task or idea',
      },
      category: {
        type: Type.STRING,
        description:
          "The pillar/category. Must be one of: 'Prospect Experience', 'Client Experience', 'Advisor Experience', 'Tech Stack', 'Compliance', 'Roadmap'",
      },
      subcategory: {
        type: Type.STRING,
        description:
          'The section within the category. For Prospect Experience: Landing Page, Postcards, Fee Calculator, Messaging. For Client Experience: Onboarding, First Meeting, Year 1, Portal Design. For Advisor Experience: Client Management, Calendar Management, Advisor Digital Twin, Investment Process, Investment Research, Investment Technology, Client Meetings and Notes, Client Communications. For Tech Stack: Wealthbox, RightCapital, Automation, Data Flows. For Compliance: Asset Allocation, Models, ADV Filings, Policies. For Roadmap: Goals, Milestones, Future Features, Experiments.',
      },
      stage: {
        type: Type.STRING,
        description: "The workflow stage. Default is 'workshopping'",
        enum: ['workshopping', 'ready_to_go', 'current_best'],
      },
      cardType: {
        type: Type.STRING,
        description: "Whether this is an idea or a question. Default is 'idea'",
        enum: ['idea', 'question'],
      },
    },
    required: ['text', 'category', 'subcategory'],
  },
};

const updateCardTool = {
  name: 'update_card',
  description:
    'Updates an existing card. Use this to change the title, goal, or stage of a card. You MUST use the exact ID provided in the context.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: 'The exact ID of the card to update.',
      },
      text: {
        type: Type.STRING,
        description: 'New title for the card (optional).',
      },
      goal: {
        type: Type.STRING,
        description: 'New goal/description for the card (optional).',
      },
      stage: {
        type: Type.STRING,
        description: "New stage ('workshopping', 'ready_to_go', 'current_best', 'archived') (optional).",
        enum: ['workshopping', 'ready_to_go', 'current_best', 'archived'],
      },
    },
    required: ['id'],
  },
};

const readDocumentTool = {
  name: 'read_document',
  description:
    'Reads the full text content of a specific document. Use this when you need to answer questions based on the detailed content of a file listed in "AVAILABLE DOCUMENTS".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filename: {
        type: Type.STRING,
        description:
          'The exact filename of the document to read (as listed in AVAILABLE DOCUMENTS).',
      },
    },
    required: ['filename'],
  },
};

const listSummariesTool = {
  name: 'list_summaries',
  description:
    'Retrieves and displays a list of past conversation summaries from the memory. Use this when the user asks to see what they talked about previously, asks for a recap, or wants to see the history/summaries.',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No parameters needed
  },
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const GeminiSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { ideas, addIdea, updateIdea } = useIdeaStore();
  const { documents, loadDocuments } = useDocumentStore();

  // --- PERSISTED STATE (from Zustand + Firebase) ---
  const {
    canonDocs,
    isCanonLoading,
    addCanonDoc,
    deleteCanonDoc,
    userContext,
    projectConstraints,
    isSettingsLoading,
    saveSettings,
    loadAll,
  } = useConsultantStore();

  // --- VIEW STATE ---
  const [activeView, setActiveView] = useState<'chat' | 'settings' | 'canon'>(
    'chat'
  );
  
  // --- EXTERNAL DATA STATE ---
  const [checklistStatus, setChecklistStatus] = useState<Record<string, string>>({});
  const [calculatorData, setCalculatorData] = useState<any>(null);
  const [recentSummaries, setRecentSummaries] = useState<firebaseService.ConversationSummary[]>([]);


  // --- CHAT STATE (Local only - not persisted) ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello David! I am aligned with your Master Index and constraints. How shall we proceed?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConversationModeActive, setIsConversationModeActive] =
    useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- LOCAL SETTINGS FORM STATE (for editing before save) ---
  const [editUserContext, setEditUserContext] = useState(userContext);
  const [editProjectConstraints, setEditProjectConstraints] =
    useState(projectConstraints);

  // --- NEW DOC FORM STATE ---
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  // --- EFFECTS ---

  // Load data from Firebase on mount
  useEffect(() => {
    loadAll();
    loadDocuments();
    
    // Load external data sources (Checklist & Calculator)
    const loadExternalData = async () => {
        try {
            // 1. Load Checklist
            const states = await firebaseService.getChecklistStates();
            setChecklistStatus(states);
            
            // 2. Load Calculator
            const calcData = await calculatorAPI.get();
            if (calcData) setCalculatorData(calcData);

            // 3. Load Recent Summaries
            const summaries = await firebaseService.getRecentConversationSummaries();
            setRecentSummaries(summaries);
        } catch (err) {
            console.error("Failed to load external agent context:", err);
        }
    };
    loadExternalData();
  }, [loadAll]);

  // Sync local form state when store values change (after load)
  useEffect(() => {
    setEditUserContext(userContext);
    setEditProjectConstraints(projectConstraints);
  }, [userContext, projectConstraints]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeView]);

  useEffect(() => {
    if (
      isConversationModeActive &&
      !isRecording &&
      !isLoading &&
      !isSpeaking
    ) {
      startRecording();
    }

    return () => {
      if (!isConversationModeActive) {
        stopRecording();
        window.speechSynthesis.cancel();
      }
    };
  }, [isConversationModeActive, isLoading, isSpeaking]);

  // --- VOICE CHAT (WHISPER) ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        if (audioBlob.size > 1000) {
          // Only transcribe if it's not a tiny accidental click
          await handleTranscribe(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);

      // Auto-stop after 5 seconds of silence or fixed duration for this prototype
      // In a real app, you'd use a VAD (Voice Activity Detection) library
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
    } catch (err) {
      console.error('Mic Error:', err);
      setIsConversationModeActive(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');

      // Replace with your actual deployed function URL or local emulator URL
      const functionUrl =
        import.meta.env.VITE_TRANSCRIBE_URL ||
        'https://us-central1-mg-dashboard-ee066.cloudfunctions.net/transcribeAudio';

      const response = await fetch(functionUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.text) {
        setInput(data.text);
        // Automatically send the transcribed text
        handleSend(data.text);
      }
    } catch (error: any) {
      console.error('Transcription error full details:', error);
      // Fallback for user UI if possible
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConversationMode = () => {
    setIsConversationModeActive((prev) => !prev);
    if (isConversationModeActive) {
      stopRecording();
      window.speechSynthesis.cancel();
      setIsRecording(false);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Try to get API key from multiple sources
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        const missingKeyMsg = 'Configuration Error: Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.';
        console.error(missingKeyMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'model',
            text: missingKeyMsg,
          },
        ]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      // 1. Prepare Board Context (Dynamic from Store)
      const ideaContext = ideas
        .map((i) => `- [ID: ${i.id}] [${i.category}]: ${i.text}`)
        .join('\n');

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // 2. Prepare Canon Context (The Constitution) - FROM FIREBASE
      const canonContext = canonDocs
        .map(
          (doc) =>
            `DOCUMENT: ${doc.title.toUpperCase()}\nCONTENT:\n${doc.content}\n---`
        )
        .join('\n');

      // 3. Construct the System Instruction (using persisted settings)
      
      // Format Documents Context
      const documentsContext = documents.length > 0 
        ? documents.map(doc => {
            const tags = doc.tags && doc.tags.length > 0 ? ` [Tags: ${doc.tags.join(', ')}]` : '';
            const summary = doc.summary ? `\nSummary: ${doc.summary}` : '';
            return `- ${doc.filename}${tags}${summary}`;
        }).join('\n')
        : 'No uploaded documents available.';

      // Format Checklist Context
      const checklistContext = CHECKLIST_PAGES.map(page => {
          const items = page.items.map(item => {
              const status = checklistStatus[item.id] || 'not_started';
              return `  - [${status.toUpperCase().replace('_', ' ')}] ${item.text} (${item.timeframe})`;
          }).join('\n');
          return `${page.name}:\n${items}`;
      }).join('\n\n');

      // Format Calculator Context
      const calculatorContext = calculatorData 
        ? `
          - Clients: ${calculatorData.numClients}
          - Meetings/Client/Year: ${calculatorData.meetingsPerClient}
          - Meeting Duration: ${calculatorData.minutesPerMeeting} mins
          - Work Hours/Day: ${calculatorData.hoursPerDay}
          - Work Days/Week: ${calculatorData.workDaysPerWeek}
          - Vacation Weeks: ${52 - calculatorData.weeksPerYear}
          - Notes: ${calculatorData.notes || 'None'}
          `
        : 'No calculator data available.';

      // Format Past Context
      const pastContext = recentSummaries.length > 0 
        ? recentSummaries.slice().reverse().map(s => { // Reverse to show chronological order
            const date = new Date(s.timestamp).toLocaleDateString();
            return `SESSION [${date}]: ${s.summary}\nDECISIONS: ${s.keyDecisions.join(', ')}`;
        }).join('\n\n')
        : 'No previous session context.';

      const systemInstruction = `
            Role: You are GenConsult, the Guardian of the RIA Project. You are an expert Consultant.

            CRITICAL INSTRUCTIONS:
            1. You possess a set of "Canonical Documents". These are the Single Source of Truth.
            2. If the user's Board State or Query contradicts the Canon, you must gently correct them.
            3. ADHERE STRICTLY to the Project Constraints. Do not suggest vendors on the restriction list.
            4. When the user asks to create cards, add ideas, or generate items for the board, USE THE create_card FUNCTION to add them. You can call it multiple times to create multiple cards.
            5. You can read the full text of any document listed in "AVAILABLE DOCUMENTS" using the read_document tool. Use this to provide detailed answers based on file content.
            6. You can update existing cards (title, goal, stage) using the update_card tool. Use the ID from the "Board State" to target the correct card.

            --- THE CANON (IMMUTABLE TRUTH) ---
            ${canonContext}
            -----------------------------------
            
            --- PROJECT METRICS (CAPACITY CALCULATOR) ---
            ${calculatorContext}
            ---------------------------------------------

            --- AVAILABLE DOCUMENTS (FILESYSTEM) ---
            ${documentsContext}
            ----------------------------------------

            --- EXECUTION PLAN STATUS (PRE-LAUNCH CHECKLIST) ---
            ${checklistContext}
            ----------------------------------------------------

            --- PREVIOUS SESSION MEMORY (ROLLING SUMMARIES) ---
            ${pastContext}
            ---------------------------------------------------

            CONTEXT:
            - Date: ${today}
            - User: ${userContext}
            - Constraints & Restrictions: ${projectConstraints}

            CURRENT BOARD STATE (Working Drafts):
            ${ideaContext}
            `;

      // 4. Prepare History (Memory) - local messages only
      const historyContents = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      // 5. Execute API Call with Function Calling Tools
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [
            { functionDeclarations: [createCardTool, listSummariesTool, readDocumentTool, updateCardTool] },
          ],
        },
        contents: [
          ...historyContents,
          { role: 'user', parts: [{ text: userMsg.text }] },
        ],
      });

      // 6. Process the response - check for function calls
      const createdCards: string[] = [];
      let summaryListResponse = '';
      let documentContentResponse = '';
      let hasTextResponse = false;
      let textResponse = '';

      // Access the response candidates
      const candidates = result.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];

        for (const part of parts) {
          // Check if this part is a function call
          if (part.functionCall) {
            const { name, args } = part.functionCall;

            if (name === 'read_document' && args) {
              const { filename } = args as { filename: string };
              const safeFilename = filename || '';
              const docMeta = documents.find(
                (d) => d.filename?.toLowerCase() === safeFilename.toLowerCase()
              );

              if (docMeta) {
                try {
                  const response = await fetch(docMeta.storageUrl);
                  const blob = await response.blob();
                  const file = new File([blob], docMeta.filename, {
                    type: blob.type,
                  });
                  const extractedText = await extractText(file);
                  documentContentResponse = `### 📄 Content of "${safeFilename}"\n\n${extractedText}\n\n---\n(End of document)`;
                } catch (err) {
                  console.error('Failed to read document:', err);
                  documentContentResponse = `Error: Failed to read content of "${safeFilename}".`;
                }
              } else {
                documentContentResponse = `Error: Document "${safeFilename}" not found.`;
              }
            }

            if (name === 'list_summaries') {
                // Execute list_summaries
                const summaries = recentSummaries; // Already loaded in state
                if (summaries.length === 0) {
                    summaryListResponse = "No previous conversation summaries found.";
                } else {
                    summaryListResponse = "### 📜 Past Conversation Summaries\n\n" + 
                        summaries.slice().reverse().map(s => {
                            const date = new Date(s.timestamp).toLocaleDateString();
                            const time = new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            return `**[${date} ${time}]**\n${s.summary}\n*Decisions: ${s.keyDecisions.join(', ')}*`;
                        }).join('\n\n---\n\n');
                }
            }

            if (name === 'update_card' && args) {
              const updateArgs = args as {
                id: string;
                text?: string;
                goal?: string;
                stage?: string;
              };

              if (updateArgs.id) {
                const updates: any = {};
                if (updateArgs.text) updates.text = updateArgs.text;
                if (updateArgs.goal) updates.goal = updateArgs.goal;
                if (updateArgs.stage) updates.stage = updateArgs.stage;

                await updateIdea(updateArgs.id, updates);
                createdCards.push(`• Updated card [ID: ${updateArgs.id}]`);
              }
            }

            if (name === 'create_card' && args) {
              // Execute the create_card function
              const cardArgs = args as {
                text: string;
                category: string;
                subcategory: string;
                stage?: string;
                cardType?: string;
              };

              // Map category name to code
              const safeCategory = cardArgs.category || 'Client Experience';
              const categoryCode =
                CATEGORY_MAP[safeCategory.toLowerCase()] || 'B';

              // Validate subcategory (extract page names from PageDefinition objects)
              const validSubcategoryNames = CATEGORY_STRUCTURE[
                categoryCode
              ].pages.map((p) => p.name);
              const subcategory = validSubcategoryNames.includes(
                cardArgs.subcategory
              )
                ? cardArgs.subcategory
                : validSubcategoryNames[0];

              // Map stage
              const stageMap: Record<string, Stage> = {
                workshopping: 'workshopping',
                ready_to_go: 'ready_to_go',
                current_best: 'current_best',
              };
              const stage =
                stageMap[cardArgs.stage || 'workshopping'] || 'workshopping';

              await addIdea({
                text: cardArgs.text,
                category: categoryCode,
                subcategory: subcategory,
                stage: stage,
                type: (cardArgs.cardType as 'idea' | 'question') || 'idea',
                goal: '',
                images: [],
                notes: [],
                linkedDocuments: [],
              });

              createdCards.push(
                `• ${cardArgs.text} → ${CATEGORY_STRUCTURE[categoryCode].label} / ${subcategory}`
              );
            }
          }

          // Check if this part is text
          if (part.text) {
            hasTextResponse = true;
            textResponse += part.text;
          }
        }
      }

      // 7. Build the response message
      let finalMessage = '';

      if (documentContentResponse) {
        finalMessage = documentContentResponse;
        if (hasTextResponse && textResponse.trim()) {
           finalMessage += `\n\n${textResponse}`;
        }
      } else if (summaryListResponse) {
          finalMessage = summaryListResponse;
           if (hasTextResponse && textResponse.trim()) {
              finalMessage += `\n\n${textResponse}`;
           }
      } else if (createdCards.length > 0) {
        finalMessage = `✅ Created ${createdCards.length} card${createdCards.length > 1 ? 's' : ''} on your board:\n\n${createdCards.join('\n')}`;
        if (hasTextResponse && textResponse.trim()) {
          finalMessage += `\n\n${textResponse}`;
        }
      } else if (hasTextResponse) {
        finalMessage = textResponse;
      } else {
        finalMessage = "I couldn't generate a response.";
      }

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: finalMessage,
      };
      setMessages((prev) => [...prev, modelMsg]);

      // Speak the response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(finalMessage);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error: any) {
      console.error('Gemini Error:', error);
      const errorMsg = `Connection error: ${error.message || 'Please check your API key and network connection.'}`;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          text: errorMsg,
        },
      ]);
      // Speak the error
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(errorMsg);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (messages.length <= 1) return; // Don't summarize empty sessions (just welcome msg)
    
    setIsLoading(true);
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey });
        
        // Construct the prompt for summarization
        const conversationText = messages
            .filter(m => m.id !== 'welcome')
            .map(m => `${m.role.toUpperCase()}: ${m.text}`)
            .join('\n\n');

        const summaryPrompt = `
        Analyze the following conversation history.
        1. Write a concise paragraph summary of what was discussed, focusing on user intent and business context.
        2. Extract a list of any key decisions made or specific preferences stated by the user.

        Return ONLY a JSON object with this shape:
        {
          "summary": "string",
          "keyDecisions": ["string"]
        }

        Conversation History:
        ${conversationText}
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: summaryPrompt }] }],
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        // Simple cleanup if md blocks are present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const summaryData = JSON.parse(jsonStr);

        // Save to Firebase
        await firebaseService.saveConversationSummary({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            summary: summaryData.summary || "No summary generated.",
            keyDecisions: summaryData.keyDecisions || []
        });

        // Clear local state
        setMessages([{
            id: 'welcome',
            role: 'model',
            text: 'Session saved and memory updated. Starting fresh context.'
        }]);

        // Refresh summaries
        const newSummaries = await firebaseService.getRecentConversationSummaries();
        setRecentSummaries(newSummaries);

    } catch (error) {
        console.error("Failed to summarize session:", error);
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            text: 'Failed to save session summary. Please try again.'
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  // --- LOADING STATE ---
  const isDataLoading = isCanonLoading || isSettingsLoading;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-96 fixed right-0 top-0 z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <Sparkles size={20} />
          <span>GenConsult</span>
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

        <div className="flex items-center gap-1">
            <button
              onClick={handleEndSession}
              disabled={isLoading || messages.length <= 1}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors disabled:opacity-30"
              title="Save & Clear Session Memory"
            >
              <Save size={18} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 ml-1"
            >
              <X size={20} />
            </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isDataLoading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2
              size={24}
              className="animate-spin text-indigo-500 mx-auto mb-2"
            />
            <p className="text-sm text-gray-500">Loading Knowledge Base...</p>
          </div>
        </div>
      )}

      {/* --- VIEW: CHAT --- */}
      {!isDataLoading && activeView === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'model' && (
                    <Bot size={16} className="mb-1 text-indigo-500" />
                  )}
                  <div className="whitespace-pre-wrap markdown-body">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  <span className="text-xs text-gray-500">
                    Aligning with Canon...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  isConversationModeActive
                    ? isRecording
                      ? 'Listening...'
                      : isSpeaking
                        ? 'Gemini is speaking...'
                        : 'Starting...'
                    : 'Ask for advice...'
                }
                disabled={isLoading || isConversationModeActive}
                className="w-full pl-4 pr-20 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm disabled:bg-gray-100"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  onClick={handleToggleConversationMode}
                  disabled={isLoading}
                  className={`p-1.5 rounded-md transition-colors ${
                    isConversationModeActive
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'text-gray-500 hover:text-indigo-600'
                  } border-2 border-red-500 bg-red-200`}
                  title={
                    isConversationModeActive
                      ? 'Stop Conversation'
                      : 'Start Conversation'
                  }
                >
                  {isConversationModeActive ? (
                    <MicOff size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                </button>
                <button
                  onClick={handleSend}
                  disabled={
                    !input.trim() || isLoading || isConversationModeActive
                  }
                  className="ml-1 p-1.5 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- VIEW: CANON (KNOWLEDGE BASE) --- */}
      {!isDataLoading && activeView === 'canon' && (
        <div className="flex-1 p-4 bg-gray-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2">
            Canonical Documents
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            The AI will strictly align all advice with these documents. Changes
            are saved automatically.
          </p>

          {/* List of Docs */}
          <div className="space-y-3 mb-6">
            {canonDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-700 text-sm">
                    {doc.title}
                  </span>
                  <button
                    onClick={() => deleteCanonDoc(doc.id)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-xs text-gray-600 line-clamp-3 font-mono bg-gray-50 p-1 rounded">
                  {doc.content}
                </div>
              </div>
            ))}
            {canonDocs.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                No documents yet. Add your Master Index below.
              </p>
            )}
          </div>

          {/* Add New Doc */}
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
            <div className="text-xs font-bold text-indigo-600 uppercase mb-2">
              Add New Document
            </div>
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
              onClick={handleAddDoc}
              disabled={!newDocTitle || !newDocContent}
              className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} /> Add to Knowledge Base
            </button>
          </div>
        </div>
      )}

      {/* --- VIEW: SETTINGS --- */}
      {!isDataLoading && activeView === 'settings' && (
        <div className="flex-1 p-4 space-y-6 overflow-y-auto bg-gray-50 animate-in fade-in zoom-in-95 duration-200">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">
              Consultant Configuration
            </h3>

            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Who are you? (Context)
            </label>
            <textarea
              value={editUserContext}
              onChange={(e) => setEditUserContext(e.target.value)}
              className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Project Rules & Restrictions
            </label>
            <textarea
              value={editProjectConstraints}
              onChange={(e) => setEditProjectConstraints(e.target.value)}
              className="w-full h-48 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Add "Do Not Use" lists here to prevent Gemini from suggesting
              restricted vendors or tools.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiSidebar;
