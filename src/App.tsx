import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { resizeImage } from './utils/image';
import { pcmToWav } from './utils/audio';
import type { AIReview, Contribution, Story } from './types';
import AuroraBackground from './components/AuroraBackground';
import CreateStoryModal from './components/CreateStoryModal';
import HeaderBar from './components/HeaderBar';
import HomeView from './components/HomeView';
import StoryView from './components/StoryView';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState<'home' | 'story'>('home');
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
  const [isAuthLoading, setIsAuthLoading] = useState(false);

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
      } catch (error) {
        console.error("Auth initialization error:", error);
        try {
          await signInAnonymously(authInstance);
        } catch (anonError) {
          console.error("Anonymous auth fallback failed:", anonError);
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

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'stories'));
    return onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      fetchedStories.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setStories(fetchedStories);
    }, (err) => console.error("Story fetch error:", err));
  }, [user]);

  useEffect(() => {
    if (!user || !currentStory || !db) return;
    const q = query(collection(db, 'contributions'));
    return onSnapshot(q, (snapshot) => {
      const allContribs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution));
      const filtered = allContribs.filter(c => c.storyId === currentStory.id);
      setContributions(filtered);
    }, (err) => console.error("Contributions error:", err));
  }, [user, currentStory]);

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

  const handleSpeak = async (text: string, nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!GEMINI_API_KEY) {
      alert("請在環境變數中填入 GEMINI_API_KEY 才能使用語音播放");
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
          }
        })
      });
      if (!response.ok) throw new Error(`TTS Error: ${response.status}`);
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
      alert("語音播放失敗");
      setPlayingNodeId(null);
    } finally {
      setIsSpeakingLoading(false);
    }
  };

  const handleShare = () => {
    if (!currentStory) return;
    const text = `我正在 Co-Weave 共同創作！\n故事：${currentStory.title}\n\n快來一起寫下後續吧！`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      alert(`Google 登入失敗：請確認 Firebase authDomain 有設定並已在 Authorized domains，詳情：${error.message}`);
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
      await addDoc(collection(db, 'stories'), {
        title: newStoryTitle.trim(),
        authorId: user.uid,
        authorName,
        createdAt: serverTimestamp(),
        status: 'ongoing',
        summary: newStorySummary.trim(),
        genre: newStoryGenre,
        coverUrl: newStoryCover || null
      });
      setShowCreateModal(false);
    } catch (e) {
      console.error("Create Story Error:", e);
      alert("建立故事失敗：請檢查 Firebase Rules");
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
      alert("送出分支失敗");
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
      setInspiration(text.split('\n').filter((l: string) => l.trim()).slice(0, 3));
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
        view={view}
        isEditingName={isEditingName}
        tempName={tempName}
        isAuthLoading={isAuthLoading}
        onTempNameChange={setTempName}
        onUpdateName={handleUpdateName}
        onStartEditName={() => setIsEditingName(true)}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onCreateStory={handleCreateStoryClick}
        onNavigateHome={() => { setView('home'); setCurrentStory(null); setCurrentPath([]); setCurrentNodeId(null); stopAudio(); }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {view === 'home' ? (
          <HomeView 
            stories={stories} 
            user={user}
            isAuthLoading={isAuthLoading}
            onGoogleLogin={handleGoogleLogin}
            onSelectStory={(story) => { setCurrentStory(story); setView('story'); setCurrentPath([]); setCurrentNodeId(null); }} 
          />
        ) : (
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
            onBack={() => { setView('home'); setCurrentStory(null); setCurrentPath([]); setCurrentNodeId(null); stopAudio(); }}
            onShare={handleShare}
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
        )}
      </div>
    </div>
  );
}
