import React, { useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { RenderNode } from './RenderNode';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Toolbar } from './Toolbar';

export const Canvas = () => {
    const {
        activePageId, zoom, setZoom, pan, setPan,
        previewMode, setSelectedId, isPanning,
        interaction, setInteraction, handleInteractionMove,
        guides
    } = useEditor();

    // 1. GLOBAL EVENT LISTENERS
    // Switched to Pointer Events for better capture support
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (interaction) handleInteractionMove(e);
        };
        const onUp = () => {
            if (interaction) setInteraction(null);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, [interaction, handleInteractionMove, setInteraction]);

    // 2. BACKGROUND CLICK
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !previewMode && !isPanning) {
            setSelectedId(null);
        }
    };

    return (
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
            <Toolbar />

            {!previewMode && (
                <div className="absolute top-6 left-6 bg-white rounded-full p-1.5 flex gap-1 z-50 shadow-lg border border-slate-100">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"><ZoomOut size={16} /></button>
                    <span className="text-xs flex items-center px-2 font-medium w-12 justify-center text-slate-700">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"><ZoomIn size={16} /></button>
                    <button onClick={() => { setZoom(0.8); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-50 rounded-full text-slate-600 border-l border-slate-100 ml-1 transition-colors"><Maximize size={16} /></button>
                </div>
            )}

            <div
                className="flex-1 overflow-hidden relative"
                style={{ cursor: isPanning ? 'grabbing' : interaction ? 'grabbing' : 'default' }}
                onMouseDown={handleBackgroundClick}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: previewMode ? 0 : 0.2 }} />

                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: isPanning ? 'none' : 'auto'
                    }}
                >
                    <div className="relative">
                        <RenderNode elementId={activePageId} />
                        {!previewMode && guides.map((guide, i) => (
                            <div
                                key={i}
                                className="absolute bg-red-500 z-[9999] pointer-events-none"
                                style={{
                                    left: guide.type === 'vertical' ? `${guide.pos}px` : '-100vw',
                                    top: guide.type === 'horizontal' ? `${guide.pos}px` : '-100vw',
                                    width: guide.type === 'vertical' ? '1px' : '200vw',
                                    height: guide.type === 'horizontal' ? '1px' : '200vw',
                                    position: 'absolute'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
