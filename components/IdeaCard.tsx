import React, { useState } from 'react';
import { Idea, useIdeaStore } from '../ideaStore';
import { Trash2, MessageSquare, CheckCircle, HelpCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface IdeaCardProps {
    idea: Idea;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
    const { removeIdea, addNote, updateIdea } = useIdeaStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteInput, setNoteInput] = useState('');

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteInput.trim()) return;
        addNote(idea.id, noteInput);
        setNoteInput('');
    };

    const toggleRefined = () => {
        updateIdea(idea.id, { refined: !idea.refined });
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md ${idea.type === 'question' ? 'border-orange-400' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {idea.type === 'question' ? (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <HelpCircle size={12} /> Question
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Idea
                            </span>
                        )}
                        {idea.refined && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle size={12} /> Refined
                            </span>
                        )}
                    </div>
                    <p className="text-gray-800 font-medium leading-tight">{idea.text}</p>
                </div>
                <button 
                    onClick={() => removeIdea(idea.id)} 
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex gap-2">
                     <button 
                        onClick={toggleRefined}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${idea.refined ? 'text-green-600' : 'text-gray-500'}`}
                    >
                        <CheckCircle size={14} />
                        {idea.refined ? 'Done' : 'Mark Done'}
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                >
                    <MessageSquare size={14} />
                    {idea.notes.length} Notes
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm animate-fade-in">
                    <ul className="space-y-2 mb-3">
                        {idea.notes.length === 0 && <li className="text-gray-400 italic text-xs">No notes yet.</li>}
                        {idea.notes.map(note => (
                            <li key={note.id} className="text-gray-700 border-b border-gray-200 pb-1 last:border-0">
                                {note.text}
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleAddNote} className="flex gap-2">
                        <input
                            type="text"
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                        />
                        <button 
                            type="submit"
                            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                        >
                            <Plus size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default IdeaCard;