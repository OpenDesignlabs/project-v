import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { MousePointer2, Type, Plus, X } from 'lucide-react';
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

            {/* COLLAPSIBLE COMPONENT DRAWER */}
            {isComponentsOpen && (
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 w-[420px] mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Components</span>
                        <button onClick={() => setIsComponentsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(COMPONENT_TYPES).map(([type, config]) => (
                            <div
                                key={type}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'NEW', type)}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all group border border-transparent hover:border-blue-200"
                            >
                                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:border-blue-300 group-hover:shadow-md group-hover:text-blue-600 text-slate-500 transition-all">
                                    <config.icon size={18} />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 group-hover:text-blue-700 truncate w-full text-center">{config.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN DOCK */}
            <div className="flex items-center gap-1 p-1.5 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700/50">

                {/* SELECT TOOL */}
                <button
                    onClick={() => { setActiveTool('select'); setIsComponentsOpen(false); }}
                    className={cn(
                        "p-3 rounded-xl transition-all flex items-center gap-2",
                        activeTool === 'select' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "hover:bg-white/10 text-slate-300"
                    )}
                    title="Select & Move (V)"
                >
                    <MousePointer2 size={18} />
                </button>

                {/* EDIT TOOL (Inline Text) */}
                <button
                    onClick={() => { setActiveTool('type'); setIsComponentsOpen(false); }}
                    className={cn(
                        "p-3 rounded-xl transition-all flex items-center gap-2",
                        activeTool === 'type' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "hover:bg-white/10 text-slate-300"
                    )}
                    title="Edit Text (T)"
                >
                    <Type size={18} />
                </button>

                <div className="w-px h-7 bg-white/20 mx-1" />

                {/* COMPONENTS TOGGLE */}
                <button
                    onClick={() => setIsComponentsOpen(!isComponentsOpen)}
                    className={cn(
                        "p-3 rounded-xl transition-all flex items-center gap-2 pr-5",
                        isComponentsOpen ? "bg-white text-slate-900 shadow-lg" : "hover:bg-white/10 text-slate-300"
                    )}
                >
                    <div className={cn("transition-transform duration-300", isComponentsOpen ? "rotate-45" : "")}>
                        <Plus size={18} />
                    </div>
                    <span className="text-xs font-bold">Add</span>
                </button>
            </div>
        </div>
    );
};
