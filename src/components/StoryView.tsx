import React from 'react';
import { ArrowLeft, Bot, Check, ChevronRight, Crown, Download, Feather, GitBranch, Heart, Loader2, Share2, Sparkles, StopCircle, Volume2, Dices } from 'lucide-react';
import GlassCard from './GlassCard';
import type { AIReview, Contribution, Story } from '../types';

interface StoryViewProps {
  currentStory: Story | null;
  currentPath: Contribution[];
  currentBranches: Contribution[];
  aiRanking: AIReview[] | null;
  isRanking: boolean;
  isWriting: boolean;
  newContent: string;
  newTags: { characters: string; location: string; time: string };
  inspiration: string[];
  isGenerating: boolean;
  playingNodeId: string | null;
  isSpeakingLoading: boolean;
  copied: boolean;
  onBack: () => void;
  onShare: () => void;
  onExport: () => void;
  onNavigateUp: (index: number) => void;
  onNavigateToNode: (node: Contribution) => void;
  onToggleWriting: (value: boolean) => void;
  onChangeContent: (value: string) => void;
  onChangeTags: (value: { characters: string; location: string; time: string }) => void;
  onGenerateInspiration: () => void;
  onSubmitContribution: () => void;
  onGenerateRanking: () => void;
  onLike: (contribution: Contribution, e: React.MouseEvent) => void;
  onSpeak: (text: string, nodeId: string, e?: React.MouseEvent) => void;
}

const StoryView = ({
  currentStory,
  currentPath,
  currentBranches,
  aiRanking,
  isRanking,
  isWriting,
  newContent,
  newTags,
  inspiration,
  isGenerating,
  playingNodeId,
  isSpeakingLoading,
  copied,
  onBack,
  onShare,
  onExport,
  onNavigateUp,
  onNavigateToNode,
  onToggleWriting,
  onChangeContent,
  onChangeTags,
  onGenerateInspiration,
  onSubmitContribution,
  onGenerateRanking,
  onLike,
  onSpeak,
}: StoryViewProps) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> 返回</button>
      <div className="flex gap-2">
        <button onClick={onShare} className="p-2 bg-white/5 rounded-full hover:bg-white/10">{copied ? <Check size={16} className="text-green-400"/> : <Share2 size={16}/>}</button>
        <button onClick={onExport} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><Download size={16}/></button>
      </div>
    </div>

    <div className="space-y-4 mb-8">
      <div className="bg-white/5 p-4 rounded-lg border-l-4 border-yellow-500 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onNavigateUp(-1)}>
        <div className="flex justify-between">
          <h3 className="font-bold text-yellow-400 mb-2 text-sm">起點</h3>
          <button onClick={(e) => onSpeak(currentStory?.summary || '', 'summary', e)}>
            {playingNodeId === 'summary' ? (
              isSpeakingLoading ? <Loader2 size={14} className="animate-spin"/> : <StopCircle size={14}/>
            ) : (
              <Volume2 size={14} className="opacity-50 hover:opacity-100"/>
            )}
          </button>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{currentStory?.summary}</p>
      </div>
      {currentPath.map((node, idx) => (
        <div 
          key={node.id} 
          className="bg-white/5 p-4 rounded-lg border-l-4 border-slate-600 hover:border-purple-500 transition-colors cursor-pointer relative pl-8 ml-4" 
          onClick={() => onNavigateUp(idx)}
        >
          <div className="absolute left-[-22px] top-0 bottom-0 w-0.5 bg-slate-700"/>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">作者 {node.authorName}</span>
            <button onClick={(e) => onSpeak(node.content, node.id, e)}>
              {playingNodeId === node.id ? (
                isSpeakingLoading ? <Loader2 size={14} className="animate-spin"/> : <StopCircle size={14}/>
              ) : (
                <Volume2 size={14} className="opacity-50 hover:opacity-100"/>
              )}
            </button>
          </div>
          <p className="text-slate-200 leading-relaxed">{node.content}</p>
        </div>
      ))}
    </div>

    <div className="border-t border-white/10 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center gap-2"><GitBranch size={18} className="text-purple-400"/> 分支路線</h3>
        {currentBranches.length > 1 && (
          <button 
            onClick={onGenerateRanking} 
            disabled={isRanking} 
            className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded flex items-center gap-1 border border-indigo-500/30 hover:bg-indigo-500/30"
          >
            {isRanking ? <Loader2 size={12} className="animate-spin"/> : <Bot size={12}/>} AI 排名
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {!isWriting ? (
          <button 
            onClick={() => onToggleWriting(true)} 
            className="h-full min-h-[150px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all gap-2"
          >
            <Feather size={24}/> <span>開始撰寫</span>
          </button>
        ) : (
          <GlassCard className="p-4 border-purple-500/30">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-purple-300">撰寫分支</span>
              <button onClick={onGenerateInspiration} disabled={isGenerating} className="text-xs text-purple-400 flex items-center gap-1 hover:text-purple-200">
                {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Dices size={12}/>} 靈感
              </button>
            </div>
            {inspiration.length > 0 && (
              <div className="text-xs bg-purple-900/30 p-2 rounded mb-2 text-purple-200">
                {inspiration.map((idea, idx) => <div key={idx}>• {idea}</div>)}
              </div>
            )}
            <textarea
              className="w-full bg-black/20 rounded p-2 text-sm text-white h-24 mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="寫下你的段落..."
              value={newContent}
              onChange={e => onChangeContent(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input 
                type="text" 
                placeholder="角色 (逗號分隔)" 
                className="bg-black/20 rounded px-2 py-1 text-xs border border-white/10 focus:outline-none focus:border-purple-400"
                value={newTags.characters}
                onChange={e => onChangeTags({ ...newTags, characters: e.target.value })}
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="場景" 
                  className="w-1/2 bg-black/20 rounded px-2 py-1 text-xs border border-white/10 focus:outline-none focus:border-purple-400"
                  value={newTags.location}
                  onChange={e => onChangeTags({ ...newTags, location: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="時間" 
                  className="w-1/2 bg-black/20 rounded px-2 py-1 text-xs border border-white/10 focus:outline-none focus:border-purple-400"
                  value={newTags.time}
                  onChange={e => onChangeTags({ ...newTags, time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => onToggleWriting(false)} className="text-xs px-3 py-1 text-slate-400 hover:text-white">取消</button>
              <button onClick={onSubmitContribution} className="text-xs bg-purple-600 px-3 py-1 rounded text-white hover:bg-purple-500">送出</button>
            </div>
          </GlassCard>
        )}

        {currentBranches.map(branch => {
          const rank = aiRanking?.find(r => r.id === branch.id);
          return (
            <GlassCard 
              key={branch.id} 
              className="p-4 flex flex-col cursor-pointer group hover:-translate-y-1" 
              onClick={() => onNavigateToNode(branch)} 
              active={branch.isCanon}
            >
              <div className="flex justify-between mb-2 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  {branch.authorPhoto ? <img src={branch.authorPhoto} className="w-4 h-4 rounded-full"/> : null}
                  {branch.authorName}
                </div>
                {branch.isCanon && <span className="text-yellow-400 flex items-center gap-1"><Crown size={10}/> 主線</span>}
              </div>
              <p className="text-sm text-slate-200 mb-3 line-clamp-3 flex-1">{branch.content}</p>
              
              {rank && (
                <div className="mb-2 bg-indigo-500/10 p-2 rounded border border-indigo-500/20 text-xs">
                  <div className="text-indigo-300 font-bold mb-1 flex items-center gap-1"><Sparkles size={10}/> AI 推薦 #{rank.rank}</div>
                  <p className="text-indigo-200/70">{rank.reason}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-auto">
                <div className="flex gap-2">
                  <button onClick={(e) => onLike(branch, e)} className={`flex items-center gap-1 text-xs ${branch.likes > 0 ? 'text-pink-400' : 'text-slate-500 hover:text-pink-400'}`}>
                    <Heart size={14} fill={branch.likes > 0 ? "currentColor" : "none"}/> {branch.likes}
                  </button>
                  <button onClick={(e) => onSpeak(branch.content, branch.id, e)} className="text-slate-500 hover:text-purple-400">
                    {playingNodeId === branch.id ? (
                      isSpeakingLoading ? <Loader2 size={14} className="animate-spin"/> : <StopCircle size={14}/>
                    ) : (
                      <Volume2 size={14}/>
                    )}
                  </button>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-white"/>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  </div>
);

export default StoryView;
