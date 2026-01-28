import { Suspense, lazy, useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Loader2 } from 'lucide-react';
import { ImportModal } from './components/ImportModal';

// 1. LAZY LOAD MAJOR CHUNKS (Split JS Bundle)
const Header = lazy(() => import('./components/Header').then(module => ({ default: module.Header })));
const LeftSidebar = lazy(() => import('./components/LeftSidebar').then(module => ({ default: module.LeftSidebar })));
const RightSidebar = lazy(() => import('./components/RightSidebar').then(module => ({ default: module.RightSidebar })));
const Canvas = lazy(() => import('./components/Canvas').then(module => ({ default: module.Canvas })));

// 2. LOADING SCREEN (Shown instanty)
const LoadingScreen = () => (
  <div className="w-full h-screen bg-[#1e1e1e] flex flex-col items-center justify-center text-[#999999] gap-3">
    <Loader2 size={32} className="animate-spin text-[#007acc]" />
    <span className="text-xs font-mono uppercase tracking-wider">Initializing Vectra Engine...</span>
  </div>
);

// EditorLayout contains the keyboard shortcuts logic that relies on useEditor()
const EditorLayout = () => {
  const { history, deleteElement, selectedId, setSelectedId, toggleInsertDrawer, setActivePanel } = useEditor();
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // 1. Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        if (selectedId && !['application-root', 'page-home', 'main-frame', 'main-frame-desktop', 'main-frame-mobile'].includes(selectedId)) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }

      // 2. Undo (Ctrl+Z / Cmd+Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      }

      // 3. Redo (Ctrl+Shift+Z / Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        history.redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        history.redo();
      }

      // 4. Escape (Deselect or close modals)
      if (e.key === 'Escape') {
        if (isImportOpen) {
          setIsImportOpen(false);
        } else {
          setSelectedId(null);
        }
      }

      // 5. I key (Toggle Insert Panel)
      if (e.key === 'i' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActivePanel(prev => prev === 'add' ? null : 'add');
      }

      // 6. Ctrl+I / Cmd+I (Open Import Modal)
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !isTyping) {
        e.preventDefault();
        setIsImportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, deleteElement, selectedId, setSelectedId, toggleInsertDrawer, isImportOpen]);

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

      {/* Import Modal */}
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} />}
    </div>
  );
};

const App = () => {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
};

export default App;
