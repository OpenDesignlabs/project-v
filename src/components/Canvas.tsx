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

    useEffect(() => {
        const onMove = (e: MouseEvent) => { if (interaction) handleInteractionMove(e); };
        const onUp = () => { if (interaction) setInteraction(null); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [interaction, handleInteractionMove, setInteraction]);

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !previewMode && !isPanning) {
            setSelectedId(null);
        }
    };

    return (
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">

            {/* FLOATING TOOLBAR */}
            <Toolbar />

            {/* Zoom Controls */}
            {!previewMode && (
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 z-50 shadow-xl border border-white/50">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ZoomOut size={16} /></button>
                    <span className="text-xs flex items-center px-2 font-bold w-12 justify-center text-slate-700">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ZoomIn size={16} /></button>
                    <button onClick={() => { setZoom(0.8); setPan({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 border-l border-slate-100 ml-1 transition-colors" title="Reset"><Maximize size={16} /></button>
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
                                className="absolute bg-blue-500 z-[9999] pointer-events-none"
                                style={{
                                    left: guide.type === 'vertical' ? `${guide.pos}px` : '-100vw',
                                    top: guide.type === 'horizontal' ? `${guide.pos}px` : '-100vw',
                                    width: guide.type === 'vertical' ? '1px' : '200vw',
                                    height: guide.type === 'horizontal' ? '1px' : '200vw',
                                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
