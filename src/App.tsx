// src/App.tsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  signInWithCustomToken,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  doc,
  increment,
  runTransaction
} from 'firebase/firestore';

import { auth, db } from './lib/firebase';
import { CANON_THRESHOLD, GEMINI_API_KEY, STORY_GENRES } from './lib/constants';
import { resizeImage, uploadBase64Image } from './utils/image';
import { pcmToWav } from './utils/audio';
import type { AIReview, Contribution, Story } from './types';
import AuroraBackground from './components/AuroraBackground';
import CreateStoryModal from './components/CreateStoryModal';
import HeaderBar from './components/HeaderBar';
// [新增] 引入導覽 Hook
import { useTour } from './hooks/useTour';

const HomeView = React.lazy(() => import('./components/HomeView'));
const StoryView = React.lazy(() => import('./components/StoryView'));

// [新增] 路由輔助元件：負責從網址讀取 ID 並同步資料
const StoryRouteHandler = ({ 
  stories, 
  onFound 
}: { 
  stories: Story[], 
  onFound: (s: Story) => void 
}) => {
  const { storyId } = useParams();
  
  useEffect(() => {
    if (storyId && stories.length > 0) {
      const target = stories.find(s => s.id === storyId);
      if (target) {
        onFound(target);
      }
    }
  }, [storyId, stories, onFound]);

  return null;
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  // [修改] 使用 Router Hook 取代原本的 view state
  const navigate = useNavigate();
  const location = useLocation();

  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [currentPath, setCurrentPath] = useState<Contribution[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStorySummary, setNewStorySummary] = useState('');
  const [newStoryGenre, setNewStoryGenre] = useState(STORY_GENRES[0]);
  const [newStoryCover, setNewStoryCover] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState({ characters: '', location: '', time: '' });

  const [isGenerating, setIsGenerating] = useState(false);
  const [inspiration, setInspiration] = useState<string[]>([]);
  const [aiRanking, setAiRanking] = useState<AIReview[] | null>(null);
  const [isRanking, setIsRanking] = useState(false);

  const [playingNodeId, setPlayingNodeId] = useState<string | null>(null);
  const [isSpeakingLoading, setIsSpeakingLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // [新增] 啟用網站導覽 (只會在首頁且第一次訪問時觸發)
  useTour();

  // [新增] 監聽路由變化，如果回到首頁，就清空目前的故事狀態
  useEffect(() => {
    if (location.pathname === '/') {
      setCurrentStory(null);
      setCurrentPath([]);
      setCurrentNodeId(null);
      stopAudio();
    }
  }, [location.pathname]);

  // 初始化 Auth (包含錯誤處理修正)
  useEffect(() => {
    if (!auth) return;
    const authInstance = auth;
    const initialToken = (window as any).__initial_auth_token;

    const initAuth = async () => {
      try {
        if (initialToken) {
          await signInWithCustomToken(authInstance, initialToken);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        // [新增] 針對 admin-restricted-operation 顯示明確提示
        if (error.code === 'auth/admin-restricted-operation') {
          alert("設定錯誤：請至 Firebase Console > Authentication > Sign-in method 開啟「匿名 (Anonymous)」登入功能。");
        } else {
          try {
            await signInAnonymously(authInstance);
          } catch (anonError) {
            console.error("Anonymous auth fallback failed:", anonError);
          }
        }
      }
    };

    initAuth();
    return onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      if (u && !u.displayName) {
        setTempName("匿名" + u.uid.slice(0, 4));
      } else if (u?.displayName) {
        setTempName(u.displayName);
      }
    });
  }, []);

  // 監聽 Stories
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'stories'));
    return onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      fetchedStories.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setStories(fetchedStories);
    }, (err) => console.error("Story fetch error:", err));
  }, [user]);

  // 監聽 Contributions
  useEffect(() => {
    if (!user || !currentStory || !db) return;
    const q = query(collection(db, 'contributions'));
    return onSnapshot(q, (snapshot) => {
      const allContribs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
      const filtered = allContribs.filter(c => c.storyId === currentStory.id);
      setContributions(filtered);
    }, (err) => console.error("Contributions error:", err));
  }, [user, currentStory]);

  // 清理 Audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const currentBranches = useMemo(() => (
    contributions.filter(c => c.parentId === currentNodeId).sort((a, b) => b.likes - a.likes)
  ), [contributions, currentNodeId]);

  const navigateToNode = (node: Contribution) => {
    setCurrentPath(prev => [...prev, node]);
    setCurrentNodeId(node.id);
    setAiRanking(null);
    setInspiration([]);
    setIsWriting(false);
    stopAudio();
  };

  const navigateUp = (index: number) => {
    stopAudio();
    if (index === -1) {
      setCurrentPath([]);
      setCurrentNodeId(null);
    } else {
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      setCurrentNodeId(newPath[newPath.length - 1].id);
    }
    setAiRanking(null);
    setIsWriting(false);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingNodeId(null);
  };

  // [修改] TTS 語音播放修復
  const handleSpeak = async (text: string, nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!GEMINI_API_KEY) {
      alert("請在環境變數中填入 GEMINI_API_KEY 才能使用語音播放");
      return;
    }

    // [新增] 防止空字串導致 400 錯誤
    if (!text || text.trim() === '') {
      console.warn("TTS: 輸入文字為空，略過請求");
      return;
    }

    if (playingNodeId === nodeId) {
      stopAudio();
      return;
    }
    stopAudio();
    setPlayingNodeId(nodeId);
    setIsSpeakingLoading(true);

    try {
      // 建議使用 'gemini-2.0-flash-exp' 或確認您的 Key 支援 'gemini-2.5-flash-preview-tts'
      const modelName = 'gemini-2.0-flash-exp'; 
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { 
                  voiceName: "Aoede" 
                } 
              } 
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", errorData);
        throw new Error(`TTS Error: ${response.status}`);
      }
      
      const data = await response.json();
      const audioContent = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioContent) {
        const wavUrl = pcmToWav(audioContent, 24000);
        const audio = new Audio(wavUrl);
        audio.onended = () => setPlayingNodeId(null);
        audio.onerror = (err) => { console.error("Audio Playback Error", err); setPlayingNodeId(null); };
        await audio.play();
        audioRef.current = audio;
      }
    } catch (error) {
      console.error("TTS Failed", error);
      alert("語音播放失敗，請檢查 API Key 或額度");
      setPlayingNodeId(null);
    } finally {
      setIsSpeakingLoading(false);
    }
  };

  const handleShare = () => {
    if (!currentStory) return;
    // [修改] 複製當前網址
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    // [修改] 複製當前網址
    navigator.clipboard.writeText(window.location.href);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleExportStory = () => {
    if (!currentStory) return;
    let content = `標題：${currentStory.title}\n類別：${currentStory.genre || '未分類'}\n作者：${currentStory.authorName}\n------------------------\n\n【開頭】\n${currentStory.summary}\n\n`;
    currentPath.forEach((node, index) => {
      content += `【第 ${index + 1} 段】（${node.authorName} 撰寫）\n${node.content}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStory.title}_story.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google login failed", error);
      alert(`Google 登入失敗：請確認 Firebase authDomain 設定正確。詳情：${error.message}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    setIsAuthLoading(true);
    try {
      await signOut(auth);
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !tempName.trim()) return;
    try {
      await updateProfile(user, { displayName: tempName });
      setUser(auth?.currentUser ?? null);
      setIsEditingName(false);
    } catch (e) {
      console.error("Update profile failed", e);
      alert("更新暱稱失敗");
    }
  };

  const handleCreateStoryClick = () => {
    if (!user) {
      alert("請登入後再開始創作");
      return;
    }
    setNewStoryTitle('');
    setNewStorySummary('');
    setNewStoryGenre(STORY_GENRES[0]);
    setNewStoryCover(null);
    setShowCreateModal(true);
  };

  const handleConfirmCreateStory = async () => {
    if (!user || !newStoryTitle.trim() || !newStorySummary.trim() || !db) return;
    const authorName = user.displayName || "匿名" + user.uid.slice(0, 4);
    
    try {
      let finalCoverUrl = null;

      if (newStoryCover) {
        const storagePath = `covers/${user.uid}`;
        try {
          finalCoverUrl = await uploadBase64Image(newStoryCover, storagePath);
        } catch (uploadError) {
          console.error("封面圖片上傳失敗:", uploadError);
          alert("封面圖片上傳失敗，將建立無封面故事。");
        }
      }

      const docRef = await addDoc(collection(db, 'stories'), {
        title: newStoryTitle.trim(),
        authorId: user.uid,
        authorName,
        createdAt: serverTimestamp(),
        status: 'ongoing',
        summary: newStorySummary.trim(),
        genre: newStoryGenre,
        coverUrl: finalCoverUrl
      });

      setShowCreateModal(false);
      setNewStoryTitle('');
      setNewStorySummary('');
      setNewStoryGenre(STORY_GENRES[0]);
      setNewStoryCover(null);

      // [新增] 建立後直接導向新故事頁面
      navigate(`/story/${docRef.id}`);

    } catch (e) {
      console.error("Create Story Error:", e);
      alert("建立故事失敗：請檢查 Console 與 Firebase Rules");
    }
  };

  const handleSubmitContribution = async () => {
    if (!user || !currentStory || !newContent.trim() || !db) return;
    setIsWriting(false);
    try {
      await addDoc(collection(db, 'contributions'), {
        storyId: currentStory.id,
        parentId: currentNodeId,
        content: newContent,
        authorId: user.uid,
        authorName: user.displayName || "匿名",
        authorPhoto: user.photoURL || null,
        likes: 0,
        isCanon: false,
        tags: {
          characters: newTags.characters.split(',').filter(Boolean),
          location: newTags.location,
          time: newTags.time
        },
        createdAt: serverTimestamp()
      });
      setNewContent('');
      setNewTags({ characters: '', location: '', time: '' });
      setInspiration([]);
    } catch (e) {
      console.error("Submit Contribution Error:", e);
      alert("送出分支失敗 (請檢查 Console 確認是否為權限問題)");
    }
  };

  const handleLike = async (contribution: Contribution, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !db) return;
    const ref = doc(db, 'contributions', contribution.id);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(ref);
      if (!sfDoc.exists()) return;
      const newLikes = (sfDoc.data().likes || 0) + 1;
      transaction.update(ref, { 
        likes: increment(1),
        isCanon: newLikes >= CANON_THRESHOLD 
      });
    });
  };

  const generateInspiration = async () => {
    if (!GEMINI_API_KEY) return alert("請填入 API Key");
    setIsGenerating(true);
    try {
      const context = currentPath.length > 0 ? currentPath[currentPath.length - 1].content : currentStory?.summary;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `提供基於以下內容的 3 個延伸靈感：${context}` }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const normalized = text.replace(/\r\n/g, '\n');
      const partsByHeading = normalized
        .split(/^##\s*靈感[一二三]/m)
        .slice(1)
        .map((p: string) => p.trim())
        .filter(Boolean);
      let ideas: string[] = [];

      if (partsByHeading.length) {
        ideas = partsByHeading
          .map((p: string) => p.split(/\n{2,}|\n[-•#]/)[0].trim())
          .filter(Boolean)
          .slice(0, 3);
      } else {
        ideas = normalized
          .split('\n')
          .map((l: string) => l.replace(/^#+/, '').replace(/^[•\-\s]+/, '').trim())
          .filter((l: string) => l && l !== '---' && !/延伸出的\s*3\s*個靈感方向/i.test(l))
          .slice(0, 3);
      }
      setInspiration(ideas);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRanking = async () => {
    if (!GEMINI_API_KEY) return alert("請填入 API Key");
    setIsRanking(true);
    try {
      const branchesText = currentBranches.map(b => `ID: ${b.id}\n${b.content}`).join('\n---\n');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `根據創意、節奏與可持續性，評分以下分支，回傳 JSON 陣列(含 id, rank, reason)：\n${branchesText}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      setAiRanking(JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text));
    } catch (error) {
      console.error(error);
    } finally {
      setIsRanking(false);
    }
  };

  const generateCoverImage = async () => {
    if (!GEMINI_API_KEY) return alert("請填入 API Key");
    setIsGeneratingCover(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Book cover for "${newStoryTitle}", ${newStoryGenre}, ${newStorySummary}, no text` }] }],
          generationConfig: { responseModalities: ["IMAGE"] }
        })
      });
      const data = await response.json();
      const imgData = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (imgData) {
        const resized = await resizeImage(`data:${imgData.mimeType};base64,${imgData.data}`);
        setNewStoryCover(resized);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans relative flex flex-col">
      <AuroraBackground />

      <CreateStoryModal 
        open={showCreateModal}
        title={newStoryTitle}
        summary={newStorySummary}
        genre={newStoryGenre}
        coverUrl={newStoryCover}
        genres={STORY_GENRES}
        isGeneratingCover={isGeneratingCover}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleConfirmCreateStory}
        onChangeTitle={setNewStoryTitle}
        onChangeSummary={setNewStorySummary}
        onChangeGenre={setNewStoryGenre}
        onGenerateCover={generateCoverImage}
      />

      <HeaderBar 
        user={user}
        view={location.pathname === '/' ? 'home' : 'story'}
        isEditingName={isEditingName}
        tempName={tempName}
        isAuthLoading={isAuthLoading}
        onTempNameChange={setTempName}
        onUpdateName={handleUpdateName}
        onStartEditName={() => setIsEditingName(true)}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onCreateStory={handleCreateStoryClick}
        onNavigateHome={() => navigate('/')}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        <Suspense fallback={<div className="text-slate-400">載入中...</div>}>
          <Routes>
            <Route path="/" element={
              <HomeView 
                stories={stories} 
                user={user}
                isAuthLoading={isAuthLoading}
                onGoogleLogin={handleGoogleLogin}
                onSelectStory={(story) => navigate(`/story/${story.id}`)} 
              />
            } />

            <Route path="/story/:storyId" element={
              <>
                <StoryRouteHandler stories={stories} onFound={setCurrentStory} />
                
                {currentStory ? (
                  <StoryView
                    currentStory={currentStory}
                    currentPath={currentPath}
                    currentBranches={currentBranches}
                    aiRanking={aiRanking}
                    isRanking={isRanking}
                    isWriting={isWriting}
                    newContent={newContent}
                    newTags={newTags}
                    inspiration={inspiration}
                    isGenerating={isGenerating}
                    playingNodeId={playingNodeId}
                    isSpeakingLoading={isSpeakingLoading}
                    copied={copied}
                    inviteCopied={inviteCopied}
                    user={user}
                    onBack={() => navigate('/')}
                    onShare={handleShare}
                    onCopyInvite={handleCopyInviteLink}
                    onExport={handleExportStory}
                    onNavigateUp={navigateUp}
                    onNavigateToNode={navigateToNode}
                    onToggleWriting={setIsWriting}
                    onChangeContent={setNewContent}
                    onChangeTags={setNewTags}
                    onGenerateInspiration={generateInspiration}
                    onSubmitContribution={handleSubmitContribution}
                    onGenerateRanking={generateRanking}
                    onLike={handleLike}
                    onSpeak={handleSpeak}
                  />
                ) : (
                   <div className="flex items-center justify-center py-20">
                     <div className="text-slate-400 animate-pulse">正在讀取故事卷軸...</div>
                   </div>
                )}
              </>
            } />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}