import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';
import { Resizer } from './Resizer';
import { cn } from '../lib/utils';
import { GeometricShapesBackground } from './marketplace/GeometricShapes';
import { FeaturesSectionWithHoverEffects } from './marketplace/FeatureHover';
import { Plus } from 'lucide-react';

interface RenderNodeProps { elementId: string; isMobileMirror?: boolean; }

export const RenderNode: React.FC<RenderNodeProps> = ({ elementId, isMobileMirror = false }) => {
    const {
        elements, selectedId, setSelectedId, hoveredId,
        previewMode, dragData, setDragData, updateProject,
        interaction, setInteraction, zoom, activeTool,
        setActivePanel, viewMode
    } = useEditor();

    const element = elements[elementId];
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    // --- SAFETY CHECKS ---
    if (!element) return null;
    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;
    const isContainer = ['container', 'page', 'section', 'canvas', 'webpage'].includes(element.type);
    const isLocked = element.locked;

    // Check if parent allows absolute movement (Canvas Mode)
    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;
    const isParentCanvas = parent ? (parent.props.layoutMode === 'canvas') : false;

    // Only allow move if: Not locked, Tool is Select, Parent is Canvas, Not Mobile Mirror
    const canMove = !isLocked && activeTool === 'select' && isParentCanvas && !isMobileMirror;

    // --- 1. PHYSICS ENGINE (The Glitch Fix) ---
    // Instead of doing logic in 'handlePointerDown', we handle the MOVE phase here for smoothness
    const handlePointerDown = (e: React.PointerEvent) => {
        if (previewMode) { if (element.events?.onClick) alert(`Action: ${JSON.stringify(element.events.onClick)}`); return; }
        e.stopPropagation();

        // 1. Select
        setSelectedId(elementId);

        // 2. Edit Text Check
        if (activeTool === 'type' && (element.type === 'text' || element.type === 'button' || element.type === 'heading')) {
            setIsEditing(true);
            return;
        }

        // 3. Move Logic
        if (canMove) {
            e.currentTarget.setPointerCapture(e.pointerId);
            setInteraction({
                type: 'MOVE',
                itemId: elementId,
                // We don't need startX/Y for Delta logic, just the ID
                startX: e.clientX,
                startY: e.clientY,
                startRect: { left: 0, top: 0, width: 0, height: 0 } // Unused in delta mode
            });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (interaction?.type === 'MOVE' && interaction.itemId === elementId) {
            e.stopPropagation();

            // DELTA MATH: Calculate exact pixel difference adjusted for zoom
            const deltaX = e.movementX / zoom;
            const deltaY = e.movementY / zoom;

            if (deltaX === 0 && deltaY === 0) return;

            // Update State Directly
            const newElements = { ...elements };
            const currentStyle = newElements[elementId].props.style || {};

            // Parse current positions (default to 0 if missing)
            const currentLeft = parseFloat(currentStyle.left?.toString() || '0');
            const currentTop = parseFloat(currentStyle.top?.toString() || '0');

            newElements[elementId].props.style = {
                ...currentStyle,
                left: `${currentLeft + deltaX}px`,
                top: `${currentTop + deltaY}px`
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

    // --- 2. STYLE PROCESSING ---
    let className = element.props.className || '';
    let finalStyle: React.CSSProperties = { ...element.props.style };

    // MIRROR LOGIC
    if (isMobileMirror) {
        finalStyle.position = 'relative';
        finalStyle.left = 'auto'; finalStyle.top = 'auto'; finalStyle.transform = 'none';
        finalStyle.width = '100%'; finalStyle.height = 'auto';
        if (className.includes('flex-row')) className = className.replace('flex-row', 'flex-col');
        className = cn(className, "max-w-full shrink-0");
    }

    // SKELETON / WIREFRAME MODE
    if (viewMode === 'skeleton' && !previewMode) {
        finalStyle.backgroundImage = 'none';
        finalStyle.boxShadow = 'none';
        if (isContainer) {
            finalStyle.outline = '1px dashed #94a3b8';
            finalStyle.outlineOffset = '-1px';
            finalStyle.borderColor = 'transparent';
            finalStyle.backgroundColor = 'rgba(241, 245, 249, 0.1)';
        } else {
            finalStyle.backgroundColor = '#e2e8f0';
            finalStyle.color = 'transparent';
            finalStyle.borderRadius = '2px';
        }
    }

    // --- 3. DROP LOGIC (For Templates) ---
    const handleDrop = (e: React.DragEvent) => {
        e.stopPropagation(); e.preventDefault();
        if (!dragData || !isContainer || isLocked || previewMode) return;

        // Calculate Drop Position Relative to Parent
        const rect = nodeRef.current?.getBoundingClientRect();
        const dropX = rect ? (e.clientX - rect.left) / zoom : 0;
        const dropY = rect ? (e.clientY - rect.top) / zoom : 0;

        // TEMPLATE INSTANTIATION
        if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (tpl) {
                const { newNodes, rootId } = instantiateTemplate(tpl.rootId, tpl.nodes);

                // Position the Root of the template at mouse cursor
                if (newNodes[rootId].props.style) {
                    newNodes[rootId].props.style.position = 'absolute';
                    newNodes[rootId].props.style.left = `${Math.round(dropX)}px`;
                    newNodes[rootId].props.style.top = `${Math.round(dropY)}px`;
                }

                const updatedProject = { ...elements, ...newNodes };
                updatedProject[elementId] = {
                    ...updatedProject[elementId],
                    children: [...(updatedProject[elementId].children || []), rootId]
                };
                updateProject(updatedProject);
                setSelectedId(rootId);
            }
        }
        setDragData(null);
    };

    // --- 4. RENDERERS ---
    let content = null;

    // HYBRID COMPONENT RENDERER
    if (element.type === 'geometric_bg') content = <GeometricShapesBackground />;
    else if (element.type === 'feature_hover') content = <FeaturesSectionWithHoverEffects />;
    else if (element.type === 'text' || element.type === 'button' || element.type === 'heading') content = element.content;
    else if (element.type === 'image') content = <img className="w-full h-full object-cover pointer-events-none" src={element.src} alt="" />;
    else {
        // Container Renderer
        content = (
            <>
                {element.children?.map(childId => (
                    <RenderNode key={isMobileMirror ? `${childId}-mobile` : childId} elementId={childId} isMobileMirror={isMobileMirror} />
                ))}
                {/* Empty State Add Button */}
                {isContainer && !element.children?.length && !previewMode && !element.props['data-custom-code'] && (
                    <div
                        onClick={(e) => { e.stopPropagation(); setSelectedId(elementId); setActivePanel('add'); }}
                        className="w-full h-full min-h-[60px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-200/50 rounded hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                    >
                        <Plus size={16} className="text-slate-400 group-hover:text-blue-500" />
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
                className,
                'relative box-border', // Crucial for layout
                isSelected && !isMobileMirror && !isEditing && 'outline outline-2 outline-blue-500 z-50', // Selection Ring
                isHovered && !isSelected && !isMobileMirror && 'outline outline-1 outline-blue-400 z-40', // Hover Ring
                isLocked && !previewMode && 'opacity-80 grayscale-[0.5]', // Visual Lock Indicator
                activeTool === 'type' && !isEditing && (element.type === 'text' || element.type === 'heading') && 'cursor-text hover:bg-blue-50/20'
            )}
            style={finalStyle}
        >
            {isSelected && !isMobileMirror && !isEditing && !isLocked && isParentCanvas && (
                <Resizer elementId={elementId} />
            )}
            {content}
        </div>
    );
};
