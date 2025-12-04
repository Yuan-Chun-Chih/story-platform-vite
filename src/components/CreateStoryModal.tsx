import { ChevronDown, Image as ImageIcon, Loader2, Wand2, X } from 'lucide-react';
import GlassCard from './GlassCard';

interface CreateStoryModalProps {
  open: boolean;
  title: string;
  summary: string;
  genre: string;
  coverUrl: string | null;
  genres: string[];
  isGeneratingCover: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onChangeTitle: (value: string) => void;
  onChangeSummary: (value: string) => void;
  onChangeGenre: (value: string) => void;
  onGenerateCover: () => void;
}

const CreateStoryModal = ({
  open,
  title,
  summary,
  genre,
  coverUrl,
  genres,
  isGeneratingCover,
  onClose,
  onConfirm,
  onChangeTitle,
  onChangeSummary,
  onChangeGenre,
  onGenerateCover,
}: CreateStoryModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md p-6 bg-slate-900/90 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">建立新故事</h3>
          <button onClick={onClose} aria-label="Close create story modal">
            <X size={20} />
          </button>
        </div>

        <input
          className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 mb-4 text-white"
          placeholder="輸入標題"
          value={title}
          onChange={e => onChangeTitle(e.target.value)}
        />

        <div className="relative mb-4">
          <select
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 text-white appearance-none"
            value={genre}
            onChange={e => onChangeGenre(e.target.value)}
          >
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-3 text-slate-400 pointer-events-none" size={16}/>
        </div>

        <textarea
          className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-3 mb-4 text-white h-24"
          placeholder="輸入概要"
          value={summary}
          onChange={e => onChangeSummary(e.target.value)}
        />
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-400">封面預覽</span>
            <button onClick={onGenerateCover} disabled={isGeneratingCover} className="text-xs text-purple-300 flex items-center gap-1">
              {isGeneratingCover ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} AI 產生
            </button>
          </div>
          <div className="h-48 bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
            {coverUrl ? <img src={coverUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-600" />}
          </div>
        </div>
        
        <button onClick={onConfirm} className="w-full bg-purple-600 py-2 rounded text-white font-bold hover:bg-purple-500">建立故事</button>
      </GlassCard>
    </div>
  );
};

export default CreateStoryModal;
