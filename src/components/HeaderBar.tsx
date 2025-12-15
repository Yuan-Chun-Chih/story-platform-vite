// src/components/HeaderBar.tsx
import { LogIn, LogOut, Plus, Sparkles, Edit2, User as UserIcon, BookOpen } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface HeaderBarProps {
  user: FirebaseUser | null;
  view: 'home' | 'story';
  isEditingName: boolean;
  tempName: string;
  isAuthLoading?: boolean;
  onTempNameChange: (value: string) => void;
  onUpdateName: () => void;
  onStartEditName: () => void;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onCreateStory: () => void;
  onNavigateHome: () => void;
}

const HeaderBar = ({
  user,
  view,
  isEditingName,
  tempName,
  isAuthLoading = false,
  onTempNameChange,
  onUpdateName,
  onStartEditName,
  onGoogleLogin,
  onLogout,
  onCreateStory,
  onNavigateHome,
}: HeaderBarProps) => (
  // 將原本的 div 改為 header 並加入 sticky 效果
  <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      
      {/* 網站導覽 ID: tour-logo */}
      <div 
        id="tour-logo"
        className="flex items-center gap-2 font-bold text-xl cursor-pointer" 
        onClick={onNavigateHome}
      >
        {/* 新增 Logo 視覺元素 */}
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <BookOpen size={20} className="text-white"/>
        </div>
        <span className="bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
          Co-Weave
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* 網站導覽 ID: tour-user (包住使用者狀態和登入按鈕) */}
        <div id="tour-user" className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {isEditingName ? (
              <input 
                autoFocus
                className="bg-white/10 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={tempName}
                onChange={e => onTempNameChange(e.target.value)}
                onBlur={onUpdateName}
                onKeyDown={e => e.key === 'Enter' && onUpdateName()}
              />
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={onStartEditName}>
                <span className="text-sm font-medium">{user?.displayName || '匿名'}</span>
                <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"/>
              </div>
            )}
            {user?.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="User avatar"/> : <UserIcon className="w-8 h-8 p-1 bg-white/10 rounded-full"/>}
          </div>
          
          {user?.isAnonymous ? (
            <button 
              onClick={onGoogleLogin} 
              disabled={isAuthLoading}
              className="text-xs bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold flex gap-1 items-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn size={12}/> {isAuthLoading ? '登入中…' : 'Google'}
            </button>
          ) : (
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-full"><LogOut size={16}/></button>
          )}
        </div>
        
        {/* 網站導覽 ID: tour-create */}
        {view === 'home' && (
          <button 
            id="tour-create"
            onClick={onCreateStory} 
            className="bg-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-500 transition-colors"
          >
            <Plus size={20}/>
          </button>
        )}
      </div>
    </div>
  </header>
);

export default HeaderBar;