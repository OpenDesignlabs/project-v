import { useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from './components/Canvas';

// EditorLayout uses the context for keyboard shortcuts
const EditorLayout = () => {
  const { history, deleteElement, selectedId, setSelectedId } = useEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // 1. Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        if (selectedId && !['application-root', 'page-home', 'main-canvas'].includes(selectedId)) {
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

      // 4. Escape (Deselect)
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, deleteElement, selectedId, setSelectedId]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <Canvas />
        <RightSidebar />
      </div>
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
