import { Suspense, lazy, useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { ContainerProvider } from './context/ContainerContext';

// 1. LAZY LOAD CHUNKS
const Header = lazy(() => import('./components/Header').then(module => ({ default: module.Header })));
const LeftSidebar = lazy(() => import('./components/LeftSidebar').then(module => ({ default: module.LeftSidebar })));
const RightSidebar = lazy(() => import('./components/RightSidebar').then(module => ({ default: module.RightSidebar })));
const Canvas = lazy(() => import('./components/Canvas').then(module => ({ default: module.Canvas })));
const ImportModal = lazy(() => import('./components/ImportModal').then(module => ({ default: module.ImportModal })));

// --- ANIMATED LOGO COMPONENT ---
const VectraAnimatedLogo = () => (
  <svg width="120" height="120" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[logo-float_3s_ease-in-out_infinite]">
    <svg x="6" y="6" width="28" height="28" viewBox="0 0 24 24">
      {/* 1. Left Leg (Dashed) - Flowing Animation */}
      <path
        d="m5 6 7 14"
        stroke="#a5b4fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
        className="animate-[dash-flow_1s_linear_infinite]"
      />

      {/* 2. Right Leg (Solid) - Drawing Animation */}
      <path
        d="m12 20 7-14"
        stroke="#a5b4fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="24"
        strokeDashoffset="24"
        className="animate-[draw-path_2s_ease-out_infinite]"
      />

      {/* 3. Dots - Pop In Sequence */}
      <circle
        cx="5" cy="6" r="1.5" fill="#a5b4fc"
        className="animate-[pop-in_2s_ease-in-out_infinite]"
        style={{ animationDelay: '0s', transformOrigin: 'center' }}
      />
      <circle
        cx="19" cy="6" r="1.5" fill="#a5b4fc"
        className="animate-[pop-in_2s_ease-in-out_infinite]"
        style={{ animationDelay: '0.3s', transformOrigin: 'center' }}
      />

      {/* 4. Center Anchor - Pulse */}
      <path
        fill="#a5b4fc" d="M10.5 18.5h3v3h-3z"
        className="animate-pulse"
      />
    </svg>
  </svg>
);

// --- LOADING SCREEN ---
const LoadingScreen = () => (
  <div className="w-full h-screen bg-[#0f0f11] flex flex-col items-center justify-center gap-8 z-[9999] relative overflow-hidden">
    {/* Background Glow */}
    <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" />

    {/* Logo */}
    <div className="relative z-10 drop-shadow-[0_0_15px_rgba(165,180,252,0.3)]">
      <VectraAnimatedLogo />
    </div>

    {/* Loading Bar */}
    <div className="flex flex-col items-center gap-3 z-10">
      <div className="w-32 h-1 bg-[#252526] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full" />
      </div>
      <span className="text-[10px] font-bold text-indigo-300/50 tracking-[0.3em] uppercase">
        Vectra Engine
      </span>
    </div>
  </div>
);

const EditorLayout = () => {
  const { history, deleteElement, selectedId, setSelectedId, setActivePanel } = useEditor();
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        if (selectedId && !['application-root', 'page-home', 'main-frame', 'main-frame-desktop', 'main-frame-mobile'].includes(selectedId)) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) history.redo(); else history.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        history.redo();
      }

      if (e.key === 'Escape') {
        if (isImportOpen) setIsImportOpen(false);
        else setSelectedId(null);
      }

      if (e.key === 'i' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActivePanel(prev => prev === 'add' ? null : 'add');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !isTyping) {
        e.preventDefault();
        setIsImportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, deleteElement, selectedId, setSelectedId, isImportOpen]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#1e1e1e] overflow-hidden select-none font-sans">
      <Suspense fallback={<LoadingScreen />}>
        <Header />
        <div className="flex-1 flex overflow-hidden relative">
          <LeftSidebar />
          <Canvas />
          <RightSidebar />
        </div>
      </Suspense>

      {isImportOpen && (
        <Suspense fallback={null}>
          <ImportModal onClose={() => setIsImportOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

const App = () => {
  return (
    <EditorProvider>
      <ContainerProvider>
        <EditorLayout />
      </ContainerProvider>
    </EditorProvider>
  );
};

export default App;

