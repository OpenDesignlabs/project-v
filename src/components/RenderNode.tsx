import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';
import { Resizer } from './Resizer';
import { cn } from '../lib/utils';
import { GeometricShapesBackground } from './marketplace/GeometricShapes';
import { FeaturesSectionWithHoverEffects } from './marketplace/FeatureHover';
import { HeroGeometric } from './marketplace/HeroGeometric';

interface RenderNodeProps { elementId: string; isMobileMirror?: boolean; }

export const RenderNode: React.FC<RenderNodeProps> = ({ elementId, isMobileMirror = false }) => {
    const {
        elements, selectedId, setSelectedId, hoveredId, setHoveredId,
        previewMode, dragData, setDragData, updateProject,
        interaction, setInteraction, zoom, activeTool
    } = useEditor();

    const element = elements[elementId];
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Physics State
    const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

    if (!element) return null;
    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;
    
    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;
    const isParentCanvas = parent ? (parent.props.layoutMode === 'canvas') : false;
    const isArtboard = element.type === 'canvas' || element.type === 'webpage';
    const canMove = !element.locked && activeTool === 'select' && isParentCanvas && !isArtboard && !isMobileMirror;

    // --- POINTER HANDLERS ---
    const handlePointerDown = (e: React.PointerEvent) => {
        if (previewMode) return;
        if (activeTool === 'select') e.preventDefault();

        if (!element.locked) e.stopPropagation();

        if (!element.locked) setSelectedId(elementId);

        if (activeTool === 'type' && ['text', 'button', 'heading'].includes(element.type)) {
            setIsEditing(true); return;
        }

        if (canMove && nodeRef.current) {
            e.currentTarget.setPointerCapture(e.pointerId);
            e.stopPropagation();

            const style = element.props.style || {};
            const currentLeft = parseFloat(String(style.left || 0));
            const currentTop = parseFloat(String(style.top || 0));

            dragStart.current = {
                x: e.clientX,
                y: e.clientY,
                left: currentLeft,
                top: currentTop
            };

            setInteraction({ type: 'MOVE', itemId: elementId });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (interaction?.type === 'MOVE' && interaction.itemId === elementId) {
            e.stopPropagation();

            // 1. Calculate Raw New Position
            const deltaX = (e.clientX - dragStart.current.x) / zoom;
            const deltaY = (e.clientY - dragStart.current.y) / zoom;

            let newLeft = dragStart.current.left + deltaX;
            let newTop = dragStart.current.top + deltaY;

            // 2. BOUNDARY CLAMP (Collision Detection)
            // Get dimensions of the Parent and the Element itself
            const parentEl = nodeRef.current?.parentElement;
            if (parentEl && nodeRef.current) {
                const pWidth = parentEl.offsetWidth;
                const pHeight = parentEl.offsetHeight;
                const elWidth = nodeRef.current.offsetWidth;
                const elHeight = nodeRef.current.offsetHeight;

                // Clamp X: Cannot go below 0 or above (ParentWidth - ElementWidth)
                const maxLeft = Math.max(0, pWidth - elWidth);
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));

                // Clamp Y: Cannot go below 0 or above (ParentHeight - ElementHeight)
                const maxTop = Math.max(0, pHeight - elHeight);
                newTop = Math.max(0, Math.min(newTop, maxTop));
            }

            const newElements = { ...elements };
            const newStyle = { ...newElements[elementId].props.style };

            // Cleanup conflicting props
            if ('right' in newStyle) delete newStyle.right;
            if ('bottom' in newStyle) delete newStyle.bottom;

            // Apply Clamped Position
            newStyle.left = `${Math.round(newLeft)}px`;
            newStyle.top = `${Math.round(newTop)}px`;
            newStyle.position = 'absolute';

            newElements[elementId].props.style = newStyle;
            updateProject(newElements);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (interaction?.itemId === elementId) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setInteraction(null);
        }
    };

    // --- DROP LOGIC ---
    const handleDrop = (e: React.DragEvent) => {
        e.stopPropagation(); e.preventDefault();
        if (!dragData || (!isArtboard && !element.props.layoutMode) || element.locked || previewMode) return;

        const rect = nodeRef.current?.getBoundingClientRect();
        if (!rect) return;

        const dropX = (e.clientX - rect.left) / zoom;
        const dropY = (e.clientY - rect.top) / zoom;

        if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (tpl) {
                const { newNodes, rootId } = instantiateTemplate(tpl.rootId, tpl.nodes);

                const w = parseFloat(String(newNodes[rootId].props.style?.width || 0));
                const h = parseFloat(String(newNodes[rootId].props.style?.height || 0));

                newNodes[rootId].props.style = {
                    ...newNodes[rootId].props.style,
                    position: 'absolute',
                    left: `${Math.round(dropX - w / 2)}px`,
                    top: `${Math.round(dropY - h / 2)}px`
                };

                // Auto-Expand if dropping at bottom (Long Scroll feature)
                if (isArtboard) {
                    const currentH = parseFloat(String(element.props.style?.height || rect.height / zoom));
                    const bottomEdge = (dropY - h / 2) + h + 100; // +100px buffer
                    if (bottomEdge > currentH) {
                        const newElements = { ...elements, ...newNodes };
                        if (!newElements[elementId].props.style) newElements[elementId].props.style = {};
                        newElements[elementId].props.style.height = `${bottomEdge}px`;
                        newElements[elementId].children = [...(newElements[elementId].children || []), rootId];
                        updateProject(newElements);
                        setSelectedId(rootId);
                        setDragData(null);
                        return;
                    }
                }

                const newElements = { ...elements, ...newNodes };
                newElements[elementId].children = [...(newElements[elementId].children || []), rootId];
                updateProject(newElements);
                setSelectedId(rootId);
            }
        }
        setDragData(null);
    };

    // --- STYLE SANITIZATION ---
    let finalStyle: React.CSSProperties = { ...element.props.style };
    let finalClass = element.props.className || '';

    // RULE 1: Artboards are Hard Boundaries
    if (isArtboard) {
        finalStyle.display = 'block';
        finalStyle.position = 'absolute';
        finalStyle.overflow = 'hidden'; // HARD BOUNDARY
        finalStyle.backgroundColor = finalStyle.backgroundColor || '#f2f0ef';
        finalClass = cn(finalClass, 'shadow-xl ring-1 ring-black/10');
    }

    // RULE 2: Children of Canvas/Artboard are Absolute
    if (isParentCanvas && !isMobileMirror) {
        finalStyle.position = 'absolute';
        finalStyle.left = finalStyle.left || '0px';
        finalStyle.top = finalStyle.top || '0px';
        finalClass = finalClass.replace(/relative|fixed|sticky/g, '');
    }

    if (isMobileMirror) {
        finalStyle = { ...finalStyle, position: 'relative', left: 'auto', top: 'auto', width: '100%', height: 'auto' };
    }

    // Render Children
    const renderChildren = () => (
        <>
            {element.children?.map(childId => (
                <RenderNode key={isMobileMirror ? `${childId}-mobile` : childId} elementId={childId} isMobileMirror={isMobileMirror} />
            ))}
        </>
    );

    // Content Switching
    let content = null;
    if (element.type === 'geometric_bg') content = <GeometricShapesBackground />;
    else if (element.type === 'feature_hover') content = <FeaturesSectionWithHoverEffects {...(element.props as any)} />;
    else if (element.type === 'hero_geometric') content = <HeroGeometric {...(element.props as any)} />;
    else if (element.type === 'hero_modern') content = renderChildren();
    else if (element.type === 'text' || element.type === 'button' || element.type === 'heading') content = element.content;
    else if (element.type === 'image') content = <img className="w-full h-full object-cover pointer-events-none" src={element.src} alt="" />;
    else content = renderChildren();

    return (
        <div
            ref={nodeRef}
            id={isMobileMirror ? `${element.props.id}-mobile` : element.id}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => { if (isEditing) { setIsEditing(false); updateProject({ ...elements, [elementId]: { ...elements[elementId], content: e.currentTarget.innerText } }); } }}
            className={cn(
                finalClass,
                'box-border',
                isSelected && !isMobileMirror && !isEditing && 'outline outline-2 outline-blue-500 z-50',
                isHovered && !isSelected && !isMobileMirror && 'outline outline-2 outline-blue-500 z-40',
                canMove ? 'cursor-move' : ''
            )}
            style={finalStyle}
            onPointerOver={(e) => { if (previewMode) return; e.stopPropagation(); setHoveredId(elementId); }}
            onPointerOut={() => { if (!previewMode) setHoveredId(null); }}
        >
            {/* RESIZER for Artboards (Long Scroll) & Selected Items */}
            {isSelected && !isMobileMirror && !isEditing && !element.locked && (isParentCanvas || isArtboard) && (
                <Resizer elementId={elementId} />
            )}

            {/* ARTBOARD LABEL */}
            {isArtboard && !previewMode && !isMobileMirror && (
                <div className="absolute -top-6 left-0 text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
                    {element.name} ({parseInt(String(finalStyle.width))} x {parseInt(String(finalStyle.height))})
                </div>
            )}

            {content}
        </div>
    );
};
