import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';
import { Resizer } from './Resizer';
import { cn } from '../lib/utils';
import { GeometricShapesBackground } from './marketplace/GeometricShapes';
import { FeaturesSectionWithHoverEffects } from './marketplace/FeatureHover';
import { HeroGeometric } from './marketplace/HeroGeometric';
import { Plus } from 'lucide-react';

interface RenderNodeProps { elementId: string; isMobileMirror?: boolean; }

export const RenderNode: React.FC<RenderNodeProps> = ({ elementId, isMobileMirror = false }) => {
    const {
        elements, selectedId, setSelectedId, hoveredId, setHoveredId,
        previewMode, dragData, setDragData, updateProject,
        interaction, setInteraction, zoom, activeTool, setActivePanel
    } = useEditor();

    const element = elements[elementId];
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Physics State
    const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

    if (!element) return null;

    // --- PREVIEW MODE LOGIC ---
    // 1. Hide Mobile Frame in Desktop Preview (Canvas type = Mobile Frame)
    if (previewMode && element.type === 'canvas') return null;

    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;
    const isContainer = ['container', 'page', 'section', 'canvas', 'webpage', 'app', 'grid'].includes(element.type);

    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;

    // Layout Context
    const isParentCanvas = parent ? (parent.props.layoutMode === 'canvas') : false;
    const isArtboard = element.type === 'canvas' || element.type === 'webpage';
    const canMove = !element.locked && activeTool === 'select' && isParentCanvas && !isArtboard && !isMobileMirror;

    // --- INTERACTION HANDLERS ---
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

            dragStart.current = { x: e.clientX, y: e.clientY, left: currentLeft, top: currentTop };
            setInteraction({ type: 'MOVE', itemId: elementId });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (interaction?.type === 'MOVE' && interaction.itemId === elementId) {
            e.stopPropagation();
            const deltaX = (e.clientX - dragStart.current.x) / zoom;
            const deltaY = (e.clientY - dragStart.current.y) / zoom;

            let newLeft = dragStart.current.left + deltaX;
            let newTop = dragStart.current.top + deltaY;

            // Boundary Clamp (Prevents dragging outside parent)
            const parentEl = nodeRef.current?.parentElement;
            if (parentEl && nodeRef.current) {
                const pWidth = parentEl.offsetWidth;
                const pHeight = parentEl.offsetHeight;
                const elWidth = nodeRef.current.offsetWidth;
                const elHeight = nodeRef.current.offsetHeight;

                if (pWidth > 0 && pHeight > 0) {
                    newLeft = Math.max(0, Math.min(newLeft, pWidth - elWidth));
                    newTop = Math.max(0, Math.min(newTop, pHeight - elHeight));
                }
            }

            const newElements = { ...elements };
            newElements[elementId].props.style = {
                ...newElements[elementId].props.style,
                left: `${Math.round(newLeft)}px`,
                top: `${Math.round(newTop)}px`,
                position: 'absolute'
            };
            updateProject(newElements);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (interaction?.itemId === elementId) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setInteraction(null);
        }
    };

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

                // Auto-Expand Artboard
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

    // --- STYLE PROCESSING (THE CRITICAL FIX) ---
    let finalStyle: React.CSSProperties = { ...element.props.style };
    let finalClass = element.props.className || '';

    // RULE 1: Artboards (Desktop Frame)
    if (isArtboard) {
        finalStyle.display = 'block';
        finalStyle.overflow = 'hidden';
        finalStyle.backgroundColor = finalStyle.backgroundColor || '#ffffff';
        finalClass = cn(finalClass, 'shadow-xl ring-1 ring-black/10');

        // PREVIEW FIX: Center horizontally, remove absolute positioning
        if (previewMode && element.type === 'webpage') {
            finalStyle.position = 'relative';
            finalStyle.left = 'auto';
            finalStyle.top = 'auto';
            finalStyle.transform = 'none';
            finalStyle.margin = '0 auto'; // <--- CENTERS THE WEBSITE
            finalStyle.minHeight = '100vh';
            finalClass = cn(finalClass, '!shadow-none !ring-0');
        } else {
            // EDITOR MODE: Must be absolute to move around
            finalStyle.position = 'absolute';
        }
    }

    // RULE 2: Children (Items inside Artboards)
    // FIX: Added !isArtboard to stop this block from resetting the Frame's position
    if (isParentCanvas && !isMobileMirror && !isArtboard) {
        finalStyle.position = 'absolute';
        finalStyle.left = finalStyle.left || '0px';
        finalStyle.top = finalStyle.top || '0px';
        finalClass = finalClass.replace(/relative|fixed|sticky/g, '');
    }

    if (isMobileMirror) {
        finalStyle = { ...finalStyle, position: 'relative', left: 'auto', top: 'auto', width: '100%', height: 'auto' };
    }

    // --- CONTENT RENDER ---
    let content = null;
    if (element.type === 'geometric_bg') content = <GeometricShapesBackground />;
    else if (element.type === 'feature_hover') content = <FeaturesSectionWithHoverEffects {...(element.props as any)} />;
    else if (element.type === 'hero_geometric') content = <HeroGeometric {...(element.props as any)} />;
    else if (element.type === 'hero_modern') {
        content = (
            <>
                {element.children?.map(childId => (
                    <RenderNode key={isMobileMirror ? `${childId}-mobile` : childId} elementId={childId} isMobileMirror={isMobileMirror} />
                ))}
            </>
        );
    }
    else if (element.type === 'text' || element.type === 'button' || element.type === 'heading') content = element.content;
    else if (element.type === 'image') content = <img className="w-full h-full object-cover pointer-events-none" src={element.src} alt="" />;
    else {
        content = (
            <>
                {(element.type === 'canvas' || element.type === 'webpage') && !previewMode && !isMobileMirror && (
                    <div className="absolute top-0 left-0 bg-white text-slate-500 text-[10px] px-2 py-0.5 rounded-br border-b border-r border-slate-200 pointer-events-none z-10 font-medium">
                        {element.name}
                    </div>
                )}
                {element.children?.map(childId => (
                    <RenderNode key={isMobileMirror ? `${childId}-mobile` : childId} elementId={childId} isMobileMirror={isMobileMirror} />
                ))}
                {isContainer && !isArtboard && !element.children?.length && !previewMode && !element.props['data-custom-code'] && (
                    <div
                        onClick={(e) => { e.stopPropagation(); setSelectedId(elementId); setActivePanel('add'); }}
                        className="w-full h-full min-h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-300/50 rounded hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                    >
                        <Plus size={16} className="text-neutral-400 group-hover:text-blue-500" />
                    </div>
                )}
            </>
        );
    }

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
                canMove ? 'cursor-move' : '',
                isArtboard ? 'bg-white' : ''
            )}
            style={finalStyle}
            onPointerOver={(e) => { if (previewMode || dragData) return; e.stopPropagation(); setHoveredId(elementId); }}
            onPointerOut={() => { if (!previewMode) setHoveredId(null); }}
        >
            {isSelected && !isMobileMirror && !isEditing && !element.locked && (isParentCanvas || isArtboard) && !previewMode && (
                <Resizer elementId={elementId} />
            )}
            {content}
        </div>
    );
};
