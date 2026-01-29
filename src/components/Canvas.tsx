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

    // --- 1. PAN & ZOOM CONTROLS ---
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            if (previewMode) return;
            e.preventDefault();

            if (e.ctrlKey || e.metaKey) {
                // ZOOM: Pinch or Ctrl+Wheel
                const delta = -e.deltaY;
                const factor = 0.002;
                const newZoom = Math.min(Math.max(zoom + delta * factor, 0.1), 3);
                setZoom(newZoom);
            } else {
                // PAN: Regular Wheel
                setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };

        const canvasEl = canvasRef.current;
        if (canvasEl) canvasEl.addEventListener('wheel', onWheel, { passive: false });
        return () => canvasEl?.removeEventListener('wheel', onWheel);
    }, [zoom, previewMode, setZoom, setPan]);

    // --- 2. KEYBOARD CONTROLS (Space to Pan) ---
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !previewMode) {
                setSpacePressed(true);
                setIsPanning(true);
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [previewMode, setIsPanning]);

    // --- 3. GLOBAL POINTER MOVEMENT ---
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            if (isPanning) {
                setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            }
            if (interaction) {
                handleInteractionMove(e);
            }
        };

        const onPointerUp = () => {
            if (interaction) setInteraction(null);
            if (!spacePressed) setIsPanning(false);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [isPanning, interaction, handleInteractionMove, setPan, setInteraction, spacePressed, setIsPanning]);

    // --- 4. DROP LOGIC (World Coordinates) ---
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragData || previewMode) return;

        // Calculate Mouse Position in "World Space"
        // (Screen - PanOffset) / ZoomScale
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        // Instantiate
        let newNodes: Record<string, any> = {};
        let rootId = '';
        let w = 0, h = 0;

        if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (!tpl) return;
            const res = instantiateTemplate(tpl.rootId, tpl.nodes);
            newNodes = res.newNodes;
            rootId = res.rootId;
            w = parseFloat(String(newNodes[rootId].props.style?.width || '0'));
            h = parseFloat(String(newNodes[rootId].props.style?.height || '0'));
        } else if (dragData.type === 'NEW') {
            const conf = COMPONENT_TYPES[dragData.payload];
            if (!conf) return;
            rootId = `el-${Date.now()}`;
            // Defaults
            w = dragData.payload === 'webpage' ? 1200 : dragData.payload === 'button' ? 120 : 200;
            h = dragData.payload === 'webpage' ? 800 : dragData.payload === 'button' ? 40 : 200;

            newNodes[rootId] = {
                id: rootId, type: dragData.payload, name: conf.label,
                children: [], props: { ...conf.defaultProps, style: { ...conf.defaultProps?.style, width: `${w}px`, height: `${h}px` } },
                content: conf.defaultContent, src: conf.src
            };
        }

        // Center on Mouse
        if (newNodes[rootId]) {
            newNodes[rootId].props.style = {
                ...newNodes[rootId].props.style,
                position: 'absolute',
                left: `${Math.round(worldX - w / 2)}px`,
                top: `${Math.round(worldY - h / 2)}px`
            };
        }

        const newProject = { ...elements, ...newNodes };
        // Add to active page
        if (newProject[activePageId]) {
            newProject[activePageId].children = [...(newProject[activePageId].children || []), rootId];
        }
        updateProject(newProject);
        setDragData(null);
        setSelectedId(rootId);
    };

    return (
        <div
            ref={canvasRef}
            className="flex-1 bg-[#1e1e1e] relative overflow-hidden cursor-default flex items-center justify-center"
            style={{ cursor: isPanning || spacePressed ? 'grab' : 'default' }}
            onMouseDown={() => setSelectedId(null)}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {/* THE WORLD LAYER (Transforms with Pan/Zoom) */}
            <div
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {/* Render the Active Page (which contains Frames) */}
                <RenderNode elementId={activePageId} />

                {/* Guides Overlay */}
                {!previewMode && guides.map((g, i) => (
                    <div key={i} className="absolute bg-red-500 z-[9999]"
                        style={{
                            left: g.orientation === 'vertical' ? g.pos : g.start,
                            top: g.orientation === 'vertical' ? g.start : g.pos,
                            width: g.orientation === 'vertical' ? '1px' : (g.end - g.start),
                            height: g.orientation === 'vertical' ? (g.end - g.start) : '1px'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
