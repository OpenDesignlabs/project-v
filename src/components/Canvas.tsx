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

    // 1. GLOBAL EVENT LISTENERS
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (interaction) handleInteractionMove(e);

            if (isPanning) {
                setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            }
        };

        const onUp = () => {
            if (interaction) setInteraction(null);
            if (isPanning) setIsPanning(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !isPanning) {
                e.preventDefault();
                setSpacePressed(true);
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { setSpacePressed(false); setIsPanning(false); }
        };

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
    }, [interaction, handleInteractionMove, setInteraction, isPanning, setIsPanning, setPan]);

    // 2. INFINITE SCROLL & ZOOM
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            const scaleFactor = 0.05;
            const newZoom = Math.min(Math.max(zoom + delta * scaleFactor * 0.01, 0.1), 3);
            setZoom(newZoom);
        } else {
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || spacePressed) {
            e.preventDefault();
            setIsPanning(true);
            return;
        }
        if (e.target === e.currentTarget && !previewMode) {
            setSelectedId(null);
        }
    };

    // 3. GLOBAL DROP HANDLER (For Infinite Canvas placement)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragData || dragData.type !== 'NEW' || previewMode) return;

        // Calculate World Coordinates: (Screen - Pan) / Zoom
        // This places the item exactly where the mouse is in the infinite space
        const worldX = (e.clientX - pan.x) / zoom;
        const worldY = (e.clientY - pan.y) / zoom;

        // Snap to grid (10px)
        const x = Math.round(worldX / 10) * 10;
        const y = Math.round(worldY / 10) * 10;

        const newId = `el-${Date.now()}`;
        const config = COMPONENT_TYPES[dragData.payload];
        if (!config) { setDragData(null); return; }

        // Default sizes
        let defaultWidth = '200px';
        let defaultHeight = '150px';
        if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
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
                style: {
                    ...(config.defaultProps?.style || {}),
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: defaultWidth,
                    height: defaultHeight
                }
            }
        };

        const newElements = { ...elements, [newId]: newNode };

        // Add to Active Page
        if (newElements[activePageId]) {
            newElements[activePageId] = {
                ...newElements[activePageId],
                children: [...(newElements[activePageId].children || []), newId]
            };
        }

        updateProject(newElements);
        setSelectedId(newId);
        setDragData(null);
    };

    return (
        <div
            className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col"
            onWheel={handleWheel}
            onDrop={handleGlobalDrop}
            onDragOver={handleDragOver}
        >
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
                ref={canvasRef}
                className="flex-1 overflow-hidden relative"
                style={{ cursor: spacePressed || isPanning ? 'grab' : interaction ? 'grabbing' : 'default' }}
                onMouseDown={handleMouseDown}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`,
                        opacity: previewMode ? 0 : 0.2
                    }}
                />

                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: isPanning || spacePressed ? 'none' : 'auto'
                    }}
                >
                    <RenderNode elementId={activePageId} />

                    {/* Smart Guides */}
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
    );
};
