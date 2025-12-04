const AuroraBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-900">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
    <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-blue-500/30 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen" />
    <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-teal-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen" />
  </div>
);

export default AuroraBackground;
