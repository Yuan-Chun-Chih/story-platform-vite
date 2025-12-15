// src/components/HomeView.tsx
import { useState, useMemo } from 'react';
import { BookOpen, Clock, LogIn, Tag, User as UserIcon, Loader2, Search, Filter, X } from 'lucide-react';
import GlassCard from './GlassCard';
import type { Story } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { STORY_GENRES } from '../lib/constants';

interface HomeViewProps {
  stories: Story[];
  user: FirebaseUser | null;
  isAuthLoading?: boolean;
  onGoogleLogin: () => void;
  onSelectStory: (story: Story) => void;
}

const HomeView = ({ stories, user, isAuthLoading = false, onGoogleLogin, onSelectStory }: HomeViewProps) => {
  // 搜尋與過濾的 State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全部');

  // 過濾邏輯
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      // 1. 關鍵字比對 (不分大小寫，搜尋標題或大綱)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        story.title.toLowerCase().includes(searchLower) || 
        story.summary.toLowerCase().includes(searchLower);

      // 2. 類型比對
      const matchesGenre = selectedGenre === '全部' || story.genre === selectedGenre;

      return matchesSearch && matchesGenre;
    });
  }, [stories, searchTerm, selectedGenre]);

  return (
    <div className="grid gap-6">
      {(user?.isAnonymous || !user) && (
        <GlassCard className="p-4 flex items-center justify-between bg-white/5 border-white/10">
          <div>
            <h2 className="text-lg font-bold">使用 Google 登入以保存創作</h2>
            <p className="text-sm text-slate-300">同步暱稱/頭像，貢獻更易追蹤，也更安全。</p>
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

      {/* 搜尋工具列 - 網站導覽 ID: tour-search */}
      <div id="tour-search" className="flex flex-col md:flex-row gap-4 sticky top-20 z-20 backdrop-blur-md rounded-xl">
        {/* 搜尋框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋標題或關鍵字..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 類型下拉選單 */}
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-10 pr-8 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="全部">所有類型</option>
            {STORY_GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {/* 自訂下拉箭頭 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 故事列表 - 網站導覽 ID: tour-story-list */}
      <div id="tour-story-list" className="grid gap-6">
        {filteredStories.map(story => (
          <GlassCard 
            key={story.id} 
            className="flex flex-col md:flex-row h-full md:h-48 cursor-pointer group" 
            onClick={() => onSelectStory(story)}
          >
            <div className="w-full md:w-48 h-32 md:h-full bg-slate-800 shrink-0 relative overflow-hidden">
              {story.coverUrl ? (
                <img src={story.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.title}/>
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
                <span><Clock size={12} className="inline mr-1"/>{story.createdAt?.toDate ? story.createdAt.toDate().toLocaleDateString() : '剛剛'}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 空狀態顯示 */}
      {stories.length > 0 && filteredStories.length === 0 && (
        <div className="text-center py-20 opacity-50 flex flex-col items-center">
          <Search size={48} className="mb-4 opacity-20"/>
          <p>找不到符合「{searchTerm}」或選定類型的故事</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedGenre('全部'); }}
            className="text-purple-400 text-sm mt-2 hover:underline"
          >
            清除搜尋條件
          </button>
        </div>
      )}
      
      {stories.length === 0 && <div className="text-center py-20 opacity-50">還沒有故事，點擊 + 開始創作吧！</div>}
    </div>
  );
};

export default HomeView;