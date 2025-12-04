import { LogIn, LogOut, Plus, Sparkles, Edit2, User as UserIcon } from 'lucide-react';
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
  <div className="relative z-10 container mx-auto px-4 py-4 flex justify-between items-center">
    <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
      <Sparkles className="text-yellow-400"/>
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">Co-Weave</h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center gap-2">
        {isEditingName ? (
          <input 
            autoFocus
            className="bg-white/10 rounded px-2 py-1 text-sm w-32"
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
        {user?.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full"/> : <UserIcon className="w-8 h-8 p-1 bg-white/10 rounded-full"/>}
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
      
      {view === 'home' && (
        <button onClick={onCreateStory} className="bg-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-500"><Plus size={20}/></button>
      )}
    </div>
  </div>
);

export default HeaderBar;
