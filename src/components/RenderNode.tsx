import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { COMPONENT_TYPES } from '../data/constants';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';
import { Resizer } from './Resizer';
import { cn } from '../lib/utils';
import { getIconByName } from '../data/iconRegistry';

interface RenderNodeProps { elementId: string; }

export const RenderNode: React.FC<RenderNodeProps> = ({ elementId }) => {
    const {
        elements, selectedId, setSelectedId, hoveredId, setHoveredId,
        previewMode, dragData, setDragData, updateProject,
        setInteraction, interaction, zoom, activeTool, setActiveTool, device,
        runAction, viewMode
    } = useEditor();

    const element = elements[elementId];
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    if (!element) return null;
    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;

    // Identity Checks
    const isArtboard = element.type === 'canvas' || element.type === 'webpage';
    const isContainer = ['container', 'page', 'grid', 'canvas', 'webpage', 'app'].includes(element.type);
    const isImage = element.type === 'image';

    const isLocked = element.locked;
    const isAbsolute = element.props.style?.position === 'absolute';
    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;
    const isParentFlex = parent?.props.layoutMode === 'flex';
    const canMove = !isParentFlex && isAbsolute && activeTool === 'select';

    // --- 1. BASE CLASS PROCESSING ---
    let className = element.props.className || '';

    // Smart Stacking Logic (Always Apply)
    if (element.props.layoutMode === 'flex' && element.props.stackOnMobile) {
        if (device === 'mobile') {
            className = className.replace(/flex-row/g, '').replace(/flex-col/g, '').trim() + ' flex-col';
        } else {
            if (!className.includes('flex-col')) className = className.replace('flex-row', '').trim() + ' flex-row';
        }
    }

    if (previewMode && element.events?.onClick) { className += ' cursor-pointer'; }

    // --- 2. SKELETON MODE LOGIC (GEOMETRY PRESERVATION FIX) ---
    // Instead of filtering classes, we OVERRIDE visuals with inline styles.
    // This guarantees the layout engine behaves EXACTLY the same in both modes.

    const activeSkeleton = viewMode === 'skeleton' && !previewMode && !isArtboard;
    let finalStyle: React.CSSProperties = { ...element.props.style };

    if (activeSkeleton) {
        // A. RESET VISUALS (Without changing layout)
        finalStyle.boxShadow = 'none';
        finalStyle.backgroundImage = 'none';

        // B. APPLY SKELETON LOOK
        if (isContainer) {
            // Containers: Transparent background, Dashed Border
            finalStyle.backgroundColor = 'rgba(241, 245, 249, 0.4)'; // Subtle grey fill
            finalStyle.borderStyle = 'dashed';
            finalStyle.borderWidth = '1px';
            finalStyle.borderColor = '#cbd5e1'; // slate-300

            // IMPORTANT: Do NOT force overflow-hidden here. 
            // If the user designed it to overflow, let it overflow in skeleton too.
        }
        else {
            // Content (Text/Button/Icon): Solid Blocks
            finalStyle.backgroundColor = '#cbd5e1'; // Solid grey block
            finalStyle.color = 'transparent'; // Hide text content but keep its size
            finalStyle.border = 'none';
            finalStyle.borderRadius = '4px'; // Slight rounding for better look

            // Special case for Images in Skeleton:
            // We want to see the box, but not the picture.
            if (isImage) {
                // The <img> tag logic below handles the src opacity
            }
        }
    }
    else if (isArtboard && !previewMode) {
        // Strict Artboard Styling (Design Mode & Layout Mode)
        className = cn(className, "bg-white shadow-2xl border border-slate-300 overflow-hidden ring-1 ring-black/5");
        finalStyle.backgroundColor = '#ffffff';
        finalStyle.backgroundImage = 'none';
        finalStyle.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    }

    // --- HANDLERS ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        if (previewMode) { if (element.events?.onClick) runAction(element.events.onClick); return; }
        if (isLocked) return;
        setSelectedId(elementId);
        if (activeTool === 'type' && (element.type === 'text' || element.type === 'button')) { setIsEditing(true); return; }
        if (['page', 'app'].includes(element.type)) return;
        if (!canMove) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        let currentWidth = 0, currentHeight = 0;
        if (nodeRef.current) { const rect = nodeRef.current.getBoundingClientRect(); currentWidth = rect.width / zoom; currentHeight = rect.height / zoom; }
        const style = element.props.style || {};
        setInteraction({ type: 'MOVE', itemId: elementId, startX: e.clientX, startY: e.clientY, startRect: { left: parseFloat(style.left?.toString() || '0'), top: parseFloat(style.top?.toString() || '0'), width: currentWidth, height: currentHeight } });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!previewMode && (element.type === 'text' || element.type === 'button')) { setIsEditing(true); setActiveTool('type'); }
    };

    const handlePointerOver = (e: React.PointerEvent) => { if (previewMode || dragData) return; e.stopPropagation(); setHoveredId(elementId); };
    const handlePointerOut = () => { if (previewMode) return; };
    const handleContentEdit = (e: React.FormEvent<HTMLDivElement>) => { const newContent = e.currentTarget.innerText; const newElements = { ...elements }; newElements[elementId] = { ...newElements[elementId], content: newContent }; updateProject(newElements); };
    const handleKeyDown = (e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); setActiveTool('select'); } };

    const handleDrop = (e: React.DragEvent) => {
        if (element.type === 'page' && (dragData?.payload === 'canvas' || dragData?.payload === 'webpage')) return;
        e.stopPropagation(); e.preventDefault();
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        if (!dragData || !isContainer || isLocked || previewMode) return;
        let newStyle: React.CSSProperties = {};
        if (element.props.layoutMode === 'flex') { newStyle = { position: 'relative', width: '100%', height: 'auto' }; }
        else {
            const rect = nodeRef.current?.getBoundingClientRect();
            if (!rect) return;
            const rawX = (e.clientX - rect.left) / zoom;
            const rawY = (e.clientY - rect.top) / zoom;
            newStyle = { position: 'absolute', left: `${Math.round(rawX / 10) * 10}px`, top: `${Math.round(rawY / 10) * 10}px` };
        }
        let newNodes: Record<string, any> = {}; let newRootId = '';
        if (dragData.type === 'NEW') {
            newRootId = `el-${Date.now()}`; const config = COMPONENT_TYPES[dragData.payload];
            if (config) {
                let defaultWidth = '150px'; let defaultHeight = 'auto';
                if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
                else if (dragData.payload === 'webpage') { defaultWidth = '1440px'; defaultHeight = '2000px'; }
                else if (dragData.payload === 'button') { defaultWidth = '120px'; defaultHeight = '40px'; }
                newNodes[newRootId] = { id: newRootId, type: dragData.payload, name: config.label, content: config.defaultContent, src: config.src, children: [], props: { ...config.defaultProps, layoutMode: dragData.payload === 'container' ? 'flex' : undefined, style: { ...(config.defaultProps?.style || {}), ...newStyle, width: defaultWidth, height: defaultHeight } } };
            }
        } else if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (tpl) { const res = instantiateTemplate(tpl.rootId, tpl.nodes); newNodes = res.newNodes; newRootId = res.rootId; if (newNodes[newRootId]?.props) newNodes[newRootId].props.style = { ...(newNodes[newRootId].props.style || {}), ...newStyle }; }
        }
        if (newRootId) { const updatedProject = { ...elements, ...newNodes }; updatedProject[elementId] = { ...updatedProject[elementId], children: [...(updatedProject[elementId].children || []), newRootId] }; updateProject(updatedProject); setSelectedId(newRootId); }
        setDragData(null);
    };

    // --- RENDER CONTENT ---
    let content = null;
    const showEditable = isEditing;

    if (element.type === 'text' || element.type === 'button') {
        content = element.content;
    }
    else if (element.type === 'input') {
        content = <input className="w-full h-full bg-transparent outline-none pointer-events-none" placeholder={element.props.placeholder} readOnly />;
    }
    else if (element.type === 'image') {
        // In skeleton mode, set image opacity to 0 so we just see the grey block
        const imgStyle = activeSkeleton ? { opacity: 0 } : {};
        content = <img className="w-full h-full object-cover pointer-events-none" style={imgStyle} src={element.src || 'https://via.placeholder.com/150'} alt="" draggable={false} />;
    }
    else if (element.type === 'icon') {
        const IconCmp = getIconByName(element.props.iconName || 'Star');
        // If Skeleton, Icon is hidden (color: transparent handled in finalStyle), background is grey
        content = <div className="w-full h-full flex items-center justify-center"><IconCmp size={element.props.iconSize || 24} className={element.props.iconClassName || ''} /></div>;
    } else {
        content = (
            <>
                {(element.type === 'canvas' || element.type === 'webpage') && !previewMode && (
                    <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-br border-b border-r border-slate-200 pointer-events-none z-10 font-medium">{element.name}</div>
                )}
                {element.children?.map(childId => <RenderNode key={childId} elementId={childId} />)}
            </>
        );
    }

    return (
        <div
            ref={nodeRef}
            id={element.props.id || elementId}
            contentEditable={showEditable && !activeSkeleton}
            suppressContentEditableWarning={true}
            onBlur={(e) => { if (showEditable) { setIsEditing(false); handleContentEdit(e); setActiveTool('select'); } }}
            onKeyDown={showEditable ? handleKeyDown : undefined}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onDrop={handleDrop}
            onDragOver={(e) => { if (isContainer && !previewMode && !isLocked) { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 0 0 2px #3b82f6'; } }}
            onDragLeave={(e) => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
            className={cn(
                className, // ORIGINAL CLASSES ARE KEPT intact for layout
                'relative transition-all duration-150 ease-out',
                isSelected && !interaction && !isEditing && 'outline outline-2 outline-blue-500 z-50',
                isHovered && !isSelected && 'outline outline-1 outline-blue-400 z-40',
                isLocked && !previewMode && 'opacity-70 cursor-not-allowed',
                element.props.layoutMode === 'flex' ? 'flex gap-2 min-h-[50px]' : '',
                activeTool === 'type' && !isEditing && (element.type === 'text' || element.type === 'button') && !activeSkeleton && 'cursor-text hover:outline hover:outline-1 hover:outline-blue-300'
            )}
            style={finalStyle} // Visuals are overridden here
        >
            {isSelected && !previewMode && !isEditing && (
                <div className="absolute -top-[22px] left-[-2px] bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t-sm pointer-events-none whitespace-nowrap z-[60] font-medium shadow-sm">{element.name}</div>
            )}
            {isSelected && !previewMode && canMove && !isLocked && !isEditing && <Resizer elementId={elementId} />}
            {content}
        </div>
    );
};
