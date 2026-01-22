import React, { useEffect, useState, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { RenderNode } from './RenderNode';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { COMPONENT_TYPES } from '../data/constants';

export const Canvas = () => {
    const {
        activePageId, zoom, setZoom, pan, setPan,
        previewMode, setSelectedId, isPanning, setIsPanning,
        interaction, setInteraction, handleInteractionMove,
        guides, dragData, setDragData, elements, updateProject
    } = useEditor();

    const canvasRef = useRef<HTMLDivElement>(null);
    const [spacePressed, setSpacePressed] = useState(false);

    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (interaction) handleInteractionMove(e);
            if (isPanning) { setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); }
        };
        const onUp = () => { if (interaction) setInteraction(null); if (isPanning) setIsPanning(false); };
        const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat && !isPanning && !previewMode) { e.preventDefault(); setSpacePressed(true); } };
        const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpacePressed(false); setIsPanning(false); } };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [interaction, handleInteractionMove, setInteraction, isPanning, setIsPanning, setPan, previewMode]);

    const handleWheel = (e: React.WheelEvent) => {
        if (previewMode) return;
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            const newZoom = Math.min(Math.max(zoom + delta * 0.05 * 0.01, 0.1), 3);
            setZoom(newZoom);
        } else {
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (previewMode) return;
        if (e.button === 1 || spacePressed) { e.preventDefault(); setIsPanning(true); return; }
        if (e.target === e.currentTarget) { setSelectedId(null); }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragData || dragData.type !== 'NEW' || previewMode) return;

        const worldX = (e.clientX - pan.x) / zoom;
        const worldY = (e.clientY - pan.y) / zoom;
        const x = Math.round(worldX / 10) * 10;
        const y = Math.round(worldY / 10) * 10;

        const newId = `el-${Date.now()}`;
        const config = COMPONENT_TYPES[dragData.payload];
        if (!config) { setDragData(null); return; }

        let defaultWidth = '200px';
        let defaultHeight = '150px';
        if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
        else if (dragData.payload === 'webpage') { defaultWidth = '1440px'; defaultHeight = '2000px'; }
        else if (dragData.payload === 'button') { defaultWidth = '120px'; defaultHeight = '40px'; }

        const newNode = {
            id: newId,
            type: dragData.payload,
            name: config.label,
            content: config.defaultContent,
            src: config.src,
            children: [],
            props: {
                ...config.defaultProps,
                layoutMode: dragData.payload === 'container' ? 'flex' : undefined,
                style: { ...(config.defaultProps?.style || {}), position: 'absolute', left: `${x}px`, top: `${y}px`, width: defaultWidth, height: defaultHeight }
            }
        };

        const newElements = { ...elements, [newId]: newNode };
        if (newElements[activePageId]) {
            newElements[activePageId] = { ...newElements[activePageId], children: [...(newElements[activePageId].children || []), newId] };
        }

        updateProject(newElements);
        setSelectedId(newId);
        setDragData(null);
    };

    // Calculate Transform based on Mode
    const canvasStyle = previewMode
        ? {
            width: '100%',
            height: '100%',
            position: 'relative' as const,
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '20px',
            paddingBottom: '100px'
        }
        : {
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute' as const,
            top: 0,
            left: 0,
            pointerEvents: (isPanning || spacePressed ? 'none' : 'auto') as any
        };

    return (
        <div
            className={`flex-1 bg-slate-100 relative flex flex-col ${previewMode ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
            onWheel={handleWheel}
            onDrop={handleGlobalDrop}
            onDragOver={handleDragOver}
        >
            {!previewMode && <Toolbar />}

            {!previewMode && (
                <div className="absolute top-5 left-5 bg-white rounded-full px-1.5 py-1 flex items-center gap-0.5 z-50 shadow-lg border border-slate-100">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"><ZoomOut size={14} /></button>
                    <span className="text-[10px] font-medium w-10 text-center text-slate-700">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-600 transition-colors"><ZoomIn size={14} /></button>
                    <button onClick={() => { setZoom(0.8); setPan({ x: 0, y: 0 }); }} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-600 border-l border-slate-100 ml-0.5 transition-colors" title="Reset View"><Maximize size={14} /></button>
                </div>
            )}

            <div
                ref={canvasRef}
                className="flex-1 relative min-h-full"
                style={{ cursor: !previewMode && (spacePressed || isPanning) ? 'grab' : interaction ? 'grabbing' : 'default' }}
                onMouseDown={handleMouseDown}
            >
                {/* Grid only in Edit Mode */}
                {!previewMode && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                            backgroundPosition: `${pan.x}px ${pan.y}px`,
                            opacity: 0.2
                        }}
                    />
                )}

                <div style={canvasStyle}>
                    <RenderNode elementId={activePageId} />

                    {/* SMART SEGMENT GUIDES */}
                    {!previewMode && guides.map((guide, i) => {
                        const isVertical = guide.orientation === 'vertical';
                        const length = guide.end - guide.start;

                        return (
                            <React.Fragment key={i}>
                                {/* The Main Line Segment */}
                                <div
                                    className="absolute z-[9999] pointer-events-none"
                                    style={{
                                        backgroundColor: '#ef4444', // Figma Red
                                        left: isVertical ? `${guide.pos}px` : `${guide.start}px`,
                                        top: isVertical ? `${guide.start}px` : `${guide.pos}px`,
                                        width: isVertical ? '1px' : `${length}px`,
                                        height: isVertical ? `${length}px` : '1px',
                                        boxShadow: '0 0 3px rgba(239, 68, 68, 0.5)'
                                    }}
                                />

                                {/* End Caps (Start) */}
                                <div
                                    className="absolute w-1.5 h-1.5 border border-red-500 rounded-full bg-white z-[10000] pointer-events-none"
                                    style={{
                                        left: isVertical ? `${guide.pos - 2.5}px` : `${guide.start - 2.5}px`,
                                        top: isVertical ? `${guide.start - 2.5}px` : `${guide.pos - 2.5}px`
                                    }}
                                />

                                {/* End Caps (End) */}
                                <div
                                    className="absolute w-1.5 h-1.5 border border-red-500 rounded-full bg-white z-[10000] pointer-events-none"
                                    style={{
                                        left: isVertical ? `${guide.pos - 2.5}px` : `${guide.end - 2.5}px`,
                                        top: isVertical ? `${guide.end - 2.5}px` : `${guide.pos - 2.5}px`
                                    }}
                                />
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
