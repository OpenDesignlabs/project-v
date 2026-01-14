import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { MousePointer2, Type, Plus, X, Frame } from 'lucide-react';
import { COMPONENT_TYPES } from '../data/constants';
import { cn } from '../lib/utils';

export const Toolbar = () => {
    const { activeTool, setActiveTool, setDragData, previewMode } = useEditor();
    const [isComponentsOpen, setIsComponentsOpen] = useState(false);

    if (previewMode) return null;

    const handleDragStart = (_e: React.DragEvent, type: string, payload: string) => {
        setDragData({ type: type as any, payload });
        setIsComponentsOpen(false);
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[100]">

            {/* Component Drawer */}
            {isComponentsOpen && (
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 w-[400px] mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elements</span>
                        <button onClick={() => setIsComponentsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(COMPONENT_TYPES).filter(([k]) => k !== 'canvas').map(([type, config]) => (
                            <div
                                key={type}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'NEW', type)}
                                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100/80 cursor-grab active:cursor-grabbing transition-colors group"
                            >
                                <div className="p-2 bg-white rounded-md shadow-sm border border-slate-100 group-hover:border-blue-300 group-hover:text-blue-600 text-slate-500">
                                    <config.icon size={18} />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center">{config.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Dock */}
            <div className="flex items-center gap-1 p-1.5 bg-slate-900/90 backdrop-blur-md text-white rounded-full shadow-2xl border border-slate-700/50">
                <button onClick={() => { setActiveTool('select'); setIsComponentsOpen(false); }} className={cn("p-2.5 rounded-full transition-all flex items-center gap-2", activeTool === 'select' ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/10 text-slate-300")} title="Select (V)">
                    <MousePointer2 size={18} />
                </button>

                {/* Frame Tool - Explicit 'canvas' payload */}
                <div draggable onDragStart={(e) => handleDragStart(e, 'NEW', 'canvas')} className={cn("p-2.5 rounded-full transition-all flex items-center gap-2 cursor-grab hover:bg-white/10 text-slate-300")} title="Drag Frame (F)">
                    <Frame size={18} />
                </div>

                <button onClick={() => { setActiveTool('type'); setIsComponentsOpen(false); }} className={cn("p-2.5 rounded-full transition-all flex items-center gap-2", activeTool === 'type' ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/10 text-slate-300")} title="Text (T)">
                    <Type size={18} />
                </button>

                <div className="w-px h-6 bg-white/20 mx-1" />

                <button onClick={() => setIsComponentsOpen(!isComponentsOpen)} className={cn("p-2.5 rounded-full transition-all flex items-center gap-2 pr-4", isComponentsOpen ? "bg-white text-slate-900 shadow-lg" : "hover:bg-white/10 text-slate-300")}>
                    <div className={cn("transition-transform duration-300", isComponentsOpen ? "rotate-45" : "")}><Plus size={18} /></div>
                    <span className="text-xs font-bold">Add</span>
                </button>
            </div>
        </div>
    );
};
