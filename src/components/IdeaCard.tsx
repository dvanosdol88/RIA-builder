import React, { useState } from 'react';
import { Idea, useIdeaStore, Stage } from '../ideaStore';
import {
  Trash2,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
}

const STAGE_LABELS: Record<Stage, string> = {
  current_best: 'Current Best',
  workshopping: 'Workshopping',
  ready_to_go: 'Ready to Go',
  archived: 'Archived',
};

const IdeaCard: React.FC<IdeaCardProps> = ({ idea }) => {
  const { removeIdea, addNote, updateIdea, setIdeaStage } = useIdeaStore();
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

  const hasAttachments =
    (idea.images && idea.images.length > 0) ||
    (idea.linkedDocuments && idea.linkedDocuments.length > 0);

  const availableStages: Stage[] = (Object.keys(STAGE_LABELS) as Stage[]).filter(
    (stage) => stage !== idea.stage && stage !== 'archived'
  );

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 h-full flex flex-col ${idea.type === 'question' ? 'border-orange-400' : 'border-blue-500'}`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
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
          <p className="text-gray-800 font-medium leading-tight mb-2">{idea.text}</p>
          
          {/* Goal Preview */}
          {idea.goal && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Goal</p>
              <p className="text-xs text-gray-600 line-clamp-2">{idea.goal}</p>
            </div>
          )}

          {/* Notes Preview */}
          {idea.notes && idea.notes.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Latest Note</p>
              <p className="text-xs text-gray-600 line-clamp-2">{idea.notes[0].text}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => removeIdea(idea.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
           {hasAttachments && (
            <div className="text-gray-400 flex items-center" title="Has attachments">
              {idea.images && idea.images.length > 0 ? <ImageIcon size={14} /> : <Paperclip size={14} />}
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
          >
            <MessageSquare size={14} />
            {idea.notes.length}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 bg-gray-50 p-3 rounded text-sm animate-fade-in border-t border-gray-100">
          <ul className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {idea.notes.length === 0 && (
              <li className="text-gray-400 italic text-xs">No notes yet.</li>
            )}
            {idea.notes.map((note) => (
              <li
                key={note.id}
                className="text-gray-700 border-b border-gray-200 pb-1 last:border-0 text-xs"
              >
                {note.text}
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
            >
              <Plus size={14} />
            </button>
          </form>

          {/* Actions Section */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Actions</p>
            
            <button
              onClick={toggleRefined}
              className={`w-full text-xs flex items-center justify-center gap-1 px-2 py-1.5 rounded border transition-colors ${
                idea.refined 
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={14} />
              {idea.refined ? 'Marked as Done' : 'Mark as Done'}
            </button>

            {availableStages.map((stage) => (
               <button
                  key={stage}
                  onClick={() => setIdeaStage(idea.id, stage)}
                  className="w-full text-xs flex items-center justify-center gap-1 px-2 py-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <ArrowRight size={14} />
                  Move to {STAGE_LABELS[stage]}
                </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaCard;
