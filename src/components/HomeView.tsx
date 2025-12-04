import { BookOpen, Clock, LogIn, Tag, User as UserIcon, Loader2 } from 'lucide-react';
import GlassCard from './GlassCard';
import type { Story } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

interface HomeViewProps {
  stories: Story[];
  user: FirebaseUser | null;
  isAuthLoading?: boolean;
  onGoogleLogin: () => void;
  onSelectStory: (story: Story) => void;
}

const HomeView = ({ stories, user, isAuthLoading = false, onGoogleLogin, onSelectStory }: HomeViewProps) => (
  <div className="grid gap-6">
    {(user?.isAnonymous || !user) && (
      <GlassCard className="p-4 flex items-center justify-between bg-white/5 border-white/10">
        <div>
          <h2 className="text-lg font-bold">使用 Google 登入以保存創作</h2>
          <p className="text-sm text-slate-300">同步你的暱稱與頭像，作品可跨裝置保留。</p>
        </div>
        <button 
          onClick={onGoogleLogin} 
          disabled={isAuthLoading} 
          className="bg-white text-slate-900 px-3 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAuthLoading ? <Loader2 size={16} className="animate-spin"/> : <LogIn size={16}/>}
          {isAuthLoading ? '登入中…' : '用 Google 登入'}
        </button>
      </GlassCard>
    )}

    {stories.map(story => (
      <GlassCard 
        key={story.id} 
        className="flex flex-col md:flex-row h-full md:h-48 cursor-pointer group" 
        onClick={() => onSelectStory(story)}
      >
        <div className="w-full md:w-48 h-32 md:h-full bg-slate-800 shrink-0 relative overflow-hidden">
          {story.coverUrl ? (
            <img src={story.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600"><BookOpen/></div>
          )}
          {story.genre && (
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] backdrop-blur-sm">
              <Tag size={10} className="inline mr-1"/>{story.genre.split(' ')[0]}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h2 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors">{story.title}</h2>
          <p className="text-slate-300 text-sm line-clamp-3 mb-4 flex-1">{story.summary}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
            <span><UserIcon size={12} className="inline mr-1"/>{story.authorName}</span>
            <span><Clock size={12} className="inline mr-1"/>{story.createdAt?.toDate().toLocaleDateString()}</span>
          </div>
        </div>
      </GlassCard>
    ))}
    {stories.length === 0 && <div className="text-center py-20 opacity-50">還沒有故事，點擊 + 開始創作吧！</div>}
  </div>
);

export default HomeView;
