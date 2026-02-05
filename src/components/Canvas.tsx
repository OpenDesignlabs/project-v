import React, { useEffect, useState, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { RenderNode } from './RenderNode';
import { ContainerPreview } from './ContainerPreview';
import { TEMPLATES } from '../data/templates';

export const Canvas = () => {
    const {
        activePageId, zoom, setZoom, pan, setPan,
        previewMode, setSelectedId, isPanning, setIsPanning,
        interaction, setInteraction, handleInteractionMove,
        guides, dragData, setDragData, elements, updateProject,
        instantiateTemplate, componentRegistry // <--- USE REGISTRY
    } = useEditor();

    const canvasRef = useRef<HTMLDivElement>(null);
    const [spacePressed, setSpacePressed] = useState(false);

    // --- 1. EDITOR CONTROLS ---
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (previewMode) return;
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const delta = -e.deltaY;
                const newZoom = Math.min(Math.max(zoom + delta * 0.002, 0.1), 3);
                setZoom(newZoom);
            } else {
                setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };
        const el = canvasRef.current;
        if (el) el.addEventListener('wheel', onWheel, { passive: false });
        return () => el?.removeEventListener('wheel', onWheel);
    }, [zoom, previewMode, setZoom, setPan]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !previewMode) { setSpacePressed(true); setIsPanning(true); }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') { setSpacePressed(false); setIsPanning(false); }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, [previewMode, setIsPanning]);

    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (isPanning && !previewMode) setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
            if (interaction) handleInteractionMove(e);
        };
        const onUp = () => { if (interaction) setInteraction(null); if (!spacePressed) setIsPanning(false); };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    }, [isPanning, interaction, handleInteractionMove, setPan, setInteraction, spacePressed, previewMode]);

    // --- 2. DROP LOGIC ---
    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragData || previewMode) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const worldX = (e.clientX - rect.left - pan.x) / zoom;
        const worldY = (e.clientY - rect.top - pan.y) / zoom;

        let newNodes: Record<string, any> = {};
        let newRootId = '';
        let w = 0, h = 0;

        if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (!tpl) return;
            const res = instantiateTemplate(tpl.rootId, tpl.nodes);
            newNodes = res.newNodes; newRootId = res.rootId;
            w = parseFloat(String(newNodes[newRootId].props.style?.width || 0));
            h = parseFloat(String(newNodes[newRootId].props.style?.height || 0));
        } else if (dragData.type === 'NEW') {
            const conf = componentRegistry[dragData.payload]; // FIX: Use registry
            if (!conf) return;
            newRootId = `el-${Date.now()}`;
            w = dragData.payload === 'webpage' ? 1200 : 200;
            h = dragData.payload === 'webpage' ? 800 : 100;
            newNodes[newRootId] = {
                id: newRootId, type: dragData.payload, name: conf.label, children: [],
                props: { ...conf.defaultProps, style: { ...conf.defaultProps?.style, width: `${w}px`, height: `${h}px` } },
                content: conf.defaultContent, src: conf.src
            };
        }

        if (newNodes[newRootId]) {
            newNodes[newRootId].props.style = {
                ...newNodes[newRootId].props.style,
                position: 'absolute',
                left: `${Math.round(worldX - w / 2)}px`,
                top: `${Math.round(worldY - h / 2)}px`
            };
        }

        const newProject = { ...elements, ...newNodes };
        if (newProject[activePageId]) newProject[activePageId].children = [...(newProject[activePageId].children || []), newRootId];
        updateProject(newProject);
        setDragData(null);
        setSelectedId(newRootId);
    };

    return (
        <div
            ref={canvasRef}
            className="flex-1 bg-[#1e1e1e] relative overflow-hidden cursor-default select-none"
            style={{ cursor: isPanning || spacePressed ? 'grab' : 'default' }}
            onMouseDown={() => setSelectedId(null)}
            onDrop={handleGlobalDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {/* CONTENT LAYER */}
            {previewMode ? (
                // FULL SCREEN OVERLAY
                <div className="absolute inset-0 z-[100] bg-black">
                    <ContainerPreview />
                </div>
            ) : (
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: '100%', height: '100%'
                    }}
                >
                    <RenderNode elementId={activePageId} key={`editor-${activePageId}`} />
                    {guides.map((g, i) => (
                        <div key={i} className="absolute bg-red-500 z-[9999]" style={{
                            left: g.orientation === 'vertical' ? g.pos : g.start,
                            top: g.orientation === 'vertical' ? g.start : g.pos,
                            width: g.orientation === 'vertical' ? '1px' : (g.end - g.start),
                            height: g.orientation === 'vertical' ? (g.end - g.start) : '1px'
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
};


