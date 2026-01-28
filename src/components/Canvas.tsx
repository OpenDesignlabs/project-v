import React, { useEffect, useState, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { RenderNode } from './RenderNode';
import { COMPONENT_TYPES } from '../data/constants';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';

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

    // --- FIX: NATIVE ZOOM HANDLER (Bypasses Browser's Page Zoom) ---
    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const onWheel = (e: WheelEvent) => {
            if (previewMode) return;

            // Check if user is pinching (trackpad) or using Ctrl+Scroll (mouse)
            if (e.ctrlKey || e.metaKey) {
                // CRITICAL: This stops the browser from zooming the whole page
                e.preventDefault();
                e.stopPropagation();

                const delta = -e.deltaY;
                // Adjust sensitivity (smaller = smoother zoom)
                const zoomFactor = 0.002;

                setZoom(prevZoom => {
                    const newZoom = Math.min(Math.max(prevZoom + delta * zoomFactor, 0.1), 3);
                    return newZoom;
                });
            } else {
                // Normal Scroll -> Pan the Canvas
                e.preventDefault(); // Prevents browser "swipe back" navigation
                setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };

        // Add listener with passive: false to allow preventDefault()
        canvasEl.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            canvasEl.removeEventListener('wheel', onWheel);
        };
    }, [setZoom, setPan, previewMode]);

    // Standard Pointer & Keyboard Handlers

    const handleMouseDown = (e: React.MouseEvent) => {
        if (previewMode) return;
        if (e.button === 1 || spacePressed) { e.preventDefault(); setIsPanning(true); return; }
        if (e.target === e.currentTarget) { setSelectedId(null); }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragData || previewMode) return;

        const worldX = (e.clientX - pan.x) / zoom;
        const worldY = (e.clientY - pan.y) / zoom;
        const x = Math.round(worldX / 10) * 10;
        const y = Math.round(worldY / 10) * 10;

        let newNodes: Record<string, any> = {};
        let newRootId = '';

        // CASE A: It's a Template (Hero, Pricing, Navbar, etc.)
        if (dragData.type === 'TEMPLATE') {
            const template = TEMPLATES[dragData.payload];
            if (!template) { setDragData(null); return; }

            const { rootId, newNodes: instantiatedNodes } = instantiateTemplate(template.rootId, template.nodes);

            newRootId = rootId;
            newNodes = instantiatedNodes;

            // Apply Drop Position to the Root of the template
            if (newNodes[newRootId]?.props) {
                newNodes[newRootId].props.style = {
                    ...newNodes[newRootId].props.style,
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`
                };
            }
        }
        // CASE B: It's a Simple Component (Button, Text, etc.)
        else if (dragData.type === 'NEW') {
            const config = COMPONENT_TYPES[dragData.payload];
            if (!config) { setDragData(null); return; }

            newRootId = `el-${Date.now()}`;

            // Default Dimensions based on type
            let defaultWidth = '200px';
            let defaultHeight = '150px';
            if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
            else if (dragData.payload === 'webpage') { defaultWidth = '1440px'; defaultHeight = '2000px'; }
            else if (dragData.payload === 'button') { defaultWidth = '120px'; defaultHeight = '40px'; }
            else if (dragData.payload === 'text' || dragData.payload === 'heading' || dragData.payload === 'link') { defaultWidth = 'auto'; defaultHeight = 'auto'; }
            else if (dragData.payload === 'container') { defaultWidth = '300px'; defaultHeight = '200px'; }
            else if (dragData.payload === 'image') { defaultWidth = '400px'; defaultHeight = '300px'; }

            newNodes[newRootId] = {
                id: newRootId,
                type: dragData.payload,
                name: config.label,
                content: config.defaultContent,
                src: config.src,
                children: [],
                props: {
                    ...config.defaultProps,
                    layoutMode: ['container', 'stack_v', 'stack_h'].includes(dragData.payload) ? 'flex' : undefined,
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
        } else {
            setDragData(null);
            return;
        }

        // Update State
        const updatedProject = { ...elements, ...newNodes };

        // Attach to Active Page
        if (updatedProject[activePageId]) {
            updatedProject[activePageId] = {
                ...updatedProject[activePageId],
                children: [...(updatedProject[activePageId].children || []), newRootId]
            };
        }

        updateProject(updatedProject);
        setSelectedId(newRootId);
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
            ref={canvasRef}
            className={`flex-1 bg-[#d7dae0] relative flex flex-col ${previewMode ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
            onDrop={handleGlobalDrop}
            onDragOver={handleDragOver}
        >
            {/* Toolbar removed per user request */}

            {/* Zoom controls removed - use Ctrl+Scroll or pinch to zoom */}

            <div
                className="flex-1 relative min-h-full"
                style={{ cursor: !previewMode && (spacePressed || isPanning) ? 'grab' : interaction ? 'grabbing' : 'default' }}
                onMouseDown={handleMouseDown}
            >
                {/* Grid Removed per user request */}
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
