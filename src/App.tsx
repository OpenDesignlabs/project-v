import { useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from './components/Canvas';
import { ImportModal } from './components/ImportModal';

// EditorLayout uses the context for keyboard shortcuts
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
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar />
        <Canvas />
        <RightSidebar />
      </div>

      {/* Import Modal */}
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} />}
    </div>
  );
};

function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}

export default App;
