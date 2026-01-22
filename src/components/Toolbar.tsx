import React from 'react';
import { useEditor } from '../context/EditorContext';
import { MousePointer2, Type, Frame, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

export const Toolbar = () => {
    const { activeTool, setActiveTool, setDragData, previewMode } = useEditor();

    if (previewMode) return null;

    const handleDragStart = (_e: React.DragEvent, type: string, payload: string) => {
        setDragData({ type: type as any, payload });
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-slate-900/90 backdrop-blur-md text-white rounded-full shadow-2xl border border-slate-700/50 z-[100]">
            {/* 1. SELECT TOOL */}
            <button
                onClick={() => setActiveTool('select')}
                className={cn("p-2.5 rounded-full transition-all flex items-center gap-2", activeTool === 'select' ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/10 text-slate-300")}
                title="Select & Move (V)"
            >
                <MousePointer2 size={18} />
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* 2. FRAME TOOL */}
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'NEW', 'canvas')}
                className={cn("p-2.5 rounded-full transition-all flex items-center gap-2 cursor-grab hover:bg-white/10 text-slate-300")}
                title="Drag Artboard (F)"
            >
                <Frame size={18} />
            </div>

            {/* 3. WEBPAGE TOOL */}
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'NEW', 'webpage')}
                className={cn("p-2.5 rounded-full transition-all flex items-center gap-2 cursor-grab hover:bg-white/10 text-slate-300")}
                title="Drag Web Page (W)"
            >
                <Monitor size={18} />
            </div>

            {/* 4. TEXT TOOL */}
            <button
                onClick={() => setActiveTool('type')}
                className={cn("p-2.5 rounded-full transition-all flex items-center gap-2", activeTool === 'type' ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/10 text-slate-300")}
                title="Text (T)"
            >
                <Type size={18} />
            </button>
        </div>
    );
};
