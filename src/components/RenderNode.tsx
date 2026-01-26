import React, { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { instantiateTemplate } from '../utils/templateUtils';
import { Resizer } from './Resizer';
import { CodeRenderer } from './CodeRenderer';
import { cn } from '../lib/utils';
import { getIconByName } from '../data/iconRegistry';
import { Image as ImageIcon, MousePointer2, AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Grid3X3, Plus } from 'lucide-react';

interface RenderNodeProps {
    elementId: string;
    isMobileMirror?: boolean;
}

export const RenderNode: React.FC<RenderNodeProps> = ({ elementId, isMobileMirror = false }) => {
    const {
        elements, selectedId, setSelectedId, hoveredId, setHoveredId,
        previewMode, dragData, setDragData, updateProject,
        setInteraction, interaction, zoom, activeTool, setActiveTool,
        runAction, viewMode,
        componentRegistry, // Dynamic registry from context
        setActivePanel // NEW: To open sidebar on empty container click
    } = useEditor();

    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    // --- 4. UNIVERSAL DRAG OVER LOGIC (FIXED) ---
    const handleDragOver = (e: React.DragEvent, isMirrorContext = false) => {
        const element = isMirrorContext ? elements['main-frame-mobile'] : elements[elementId];
        if (!element) return;

        const isContainer = ['container', 'page', 'grid', 'canvas', 'webpage', 'app', 'section'].includes(element.type);
        if (!dragData || !isContainer || element.locked || previewMode) return;
        e.preventDefault(); e.stopPropagation();

        // FIX: Always show line logic for ANY container, regardless of layout mode
        const targetChildren = isMirrorContext ? (elements['main-frame-desktop']?.children || []) : (element.children || []);

        let index = targetChildren.length;
        const y = e.clientY;

        // Find split point
        for (let i = 0; i < targetChildren.length; i++) {
            const childId = targetChildren[i];
            const domId = isMirrorContext ? `${childId}-mobile` : childId;
            const childEl = document.getElementById(domId);

            if (childEl) {
                const rect = childEl.getBoundingClientRect();
                const middle = rect.top + (rect.height / 2);
                if (y < middle) { index = i; break; }
            }
        }

        const targetId = isMirrorContext ? 'main-frame-mobile' : elementId;

        if (dragData.dropIndex !== index || dragData.dropParentId !== targetId) {
            setDragData({ ...dragData, dropIndex: index, dropParentId: targetId });
        }
    };

    const handleDrop = (e: React.DragEvent, isMirrorContext = false) => {
        e.stopPropagation(); e.preventDefault();

        const element = isMirrorContext ? elements['main-frame-mobile'] : elements[elementId];
        if (!element) return;

        const isContainer = ['container', 'page', 'grid', 'canvas', 'webpage', 'app', 'section'].includes(element.type);
        if (!dragData || !isContainer || element.locked || previewMode) return;

        const actualParentId = isMirrorContext ? 'main-frame-desktop' : elementId;
        const insertIndex = (dragData.dropParentId === (isMirrorContext ? 'main-frame-mobile' : elementId) && dragData.dropIndex !== undefined)
            ? dragData.dropIndex
            : (elements[actualParentId]?.children?.length || 0);

        let newNodes: Record<string, any> = {}; let newRootId = '';
        const rect = nodeRef.current?.getBoundingClientRect();
        const dropX = rect ? (e.clientX - rect.left) / zoom : 0;
        const dropY = rect ? (e.clientY - rect.top) / zoom : 0;

        if (dragData.type === 'NEW') {
            newRootId = `el-${Date.now()}`; const config = componentRegistry[dragData.payload];
            if (config) {
                let defaultWidth = '150px'; let defaultHeight = 'auto';
                if (dragData.payload === 'button') defaultWidth = '120px';

                // If mirroring or flex, use relative. If canvas, use absolute.
                const isStacking = element.props.layoutMode === 'flex' || isMirrorContext;
                const style = isStacking
                    ? { position: 'relative', width: '100%', height: 'auto' }
                    : { position: 'absolute', left: `${Math.round(dropX / 10) * 10}px`, top: `${Math.round(dropY / 10) * 10}px`, width: defaultWidth, height: defaultHeight };

                newNodes[newRootId] = { id: newRootId, type: dragData.payload, name: config.label, content: config.defaultContent, src: config.src, children: [], props: { ...config.defaultProps, layoutMode: dragData.payload === 'container' ? 'flex' : undefined, style: { ...(config.defaultProps?.style || {}), ...style } } };
            }
        } else if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (tpl) {
                const res = instantiateTemplate(tpl.rootId, tpl.nodes);
                newNodes = res.newNodes;
                newRootId = res.rootId;
                if (newNodes[newRootId]?.props) {
                    newNodes[newRootId].props.style = {
                        ...(newNodes[newRootId].props.style || {}),
                        position: isMirrorContext ? 'relative' : 'absolute',
                        left: isMirrorContext ? 'auto' : `${dropX}px`,
                        top: isMirrorContext ? 'auto' : `${dropY}px`
                    };
                }
            }
        }

        if (newRootId) {
            const updatedProject = { ...elements, ...newNodes };
            const currentChildren = [...(updatedProject[actualParentId].children || [])];

            // Insert at Calculated Index
            currentChildren.splice(insertIndex, 0, newRootId);

            updatedProject[actualParentId] = { ...updatedProject[actualParentId], children: currentChildren };
            updateProject(updatedProject);
            setSelectedId(newRootId);
        }
        setDragData(null);
    };

    // --- 1. MIRROR LOGIC (Maintains Mobile Stack) ---
    if (elementId === 'main-frame-mobile' && !isMobileMirror) {
        const desktopFrame = elements['main-frame-desktop'];
        const mobileFrame = elements['main-frame-mobile'];
        if (!desktopFrame || !mobileFrame) return null;

        return (
            <div
                ref={nodeRef}
                className={cn(mobileFrame.props.className, "flex flex-col gap-4 p-4")}
                style={{ ...mobileFrame.props.style, display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '844px' }}
                onDragOver={(e) => handleDragOver(e, true)}
                onDrop={(e) => handleDrop(e, true)}
            >
                {!previewMode && <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-br border-b border-r border-slate-200 pointer-events-none z-10 font-medium">Mobile Mirror</div>}

                {desktopFrame.children?.map((childId, i) => (
                    <React.Fragment key={`${childId}-mobile`}>
                        {/* Always show line on mirror */}
                        {dragData?.dropParentId === 'main-frame-mobile' && dragData.dropIndex === i && (
                            <div className="h-1 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none transition-all" />
                        )}
                        <RenderNode elementId={childId} isMobileMirror={true} />
                    </React.Fragment>
                ))}
                {dragData?.dropParentId === 'main-frame-mobile' && dragData.dropIndex === (desktopFrame.children?.length || 0) && (
                    <div className="h-1 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none transition-all" />
                )}
            </div>
        );
    }

    const element = elements[elementId];

    if (!element) return null;
    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;
    const isArtboard = element.type === 'canvas' || element.type === 'webpage';
    const isContainer = ['container', 'page', 'grid', 'canvas', 'webpage', 'app', 'section', 'stack_v', 'stack_h'].includes(element.type);
    const isImage = element.type === 'image';
    const isLocked = element.locked;
    const isAbsolute = element.props.style?.position === 'absolute';
    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;
    const isParentFlex = parent ? (parent.props.layoutMode === 'flex' || isMobileMirror) : false;
    const canMove = !isMobileMirror && !isParentFlex && isAbsolute && activeTool === 'select';

    // --- 2. LAYOUT STYLES ---
    let className = element.props.className || '';
    let finalStyle: React.CSSProperties = { ...element.props.style };

    if (isMobileMirror) {
        finalStyle.position = 'relative';
        finalStyle.left = 'auto'; finalStyle.top = 'auto'; finalStyle.transform = 'none';
        finalStyle.width = '100%'; finalStyle.height = 'auto';
        if (className.includes('flex-row')) className = className.replace('flex-row', 'flex-col');
        className = cn(className, "max-w-full shrink-0");
    }

    if (previewMode && element.events?.onClick) { className += ' cursor-pointer'; }

    // --- 3. SKELETON MODE (GEOMETRY SAFE - Uses outline instead of border) ---
    const activeSkeleton = viewMode === 'skeleton' && !previewMode && !isArtboard;
    if (activeSkeleton) {
        // Reset visual effects that might interfere
        finalStyle.boxShadow = 'none';
        finalStyle.backgroundImage = 'none';

        if (isContainer) {
            // FIX: Use OUTLINE instead of BORDER to prevent layout shifts
            // Outline draws "above" the layout, so 0px vs 1px doesn't change content size
            finalStyle.outline = '1px dashed #94a3b8';
            finalStyle.outlineOffset = '-1px'; // Draw inside so it doesn't bleed out

            // Hide the original border color but KEEP border-width if it exists
            // This ensures we don't collapse space if design depended on a border
            finalStyle.borderColor = 'transparent';

            // Light background for visibility
            finalStyle.backgroundColor = 'rgba(241, 245, 249, 0.2)';
        } else {
            // Leaf Nodes (Buttons/Text) - keep as placeholder bars
            finalStyle.backgroundColor = '#e2e8f0';
            finalStyle.color = 'transparent';
            finalStyle.borderRadius = '4px';
            className += ' animate-pulse';
        }
    } else if (isArtboard && !previewMode) {
        className = cn(className, "bg-white shadow-2xl border border-slate-300 overflow-hidden ring-1 ring-black/5");
        finalStyle.backgroundColor = '#ffffff';
        finalStyle.overflow = 'hidden';
    }

    // --- WIREFRAME OVERLAYS ---
    const renderWireframeOverlay = () => {
        if (!activeSkeleton) return null;

        if (isContainer) {
            const isFlex = className.includes('flex');
            const isGrid = className.includes('grid');
            const isRow = className.includes('flex-row');

            if (!isFlex && !isGrid) return null;

            return (
                <div className="absolute top-0 right-0 p-1 pointer-events-none opacity-50">
                    <div className="bg-slate-200 text-slate-500 text-[8px] px-1 rounded flex items-center gap-1">
                        {isGrid && <><Grid3X3 size={8} /> GRID</>}
                        {isFlex && isRow && <><AlignHorizontalSpaceAround size={8} /> ROW</>}
                        {isFlex && !isRow && <><AlignVerticalSpaceAround size={8} /> COL</>}
                    </div>
                </div>
            );
        }

        if (isImage) {
            return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 text-slate-500">
                    <ImageIcon size={24} strokeWidth={1.5} />
                </div>
            );
        }

        if (element.type === 'button') {
            return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 text-slate-500 border border-slate-400 rounded">
                    <MousePointer2 size={16} strokeWidth={1.5} />
                </div>
            );
        }
        return null;
    };

    // --- STANDARD HANDLERS ---
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        if (previewMode) { if (element.events?.onClick) runAction(element.events.onClick); return; }
        if (isLocked) return;
        setSelectedId(elementId);
        if (activeTool === 'type' && (element.type === 'text' || element.type === 'button')) { setIsEditing(true); return; }
        if (['page', 'app', 'canvas', 'webpage'].includes(element.type)) return;
        if (!canMove) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        let currentWidth = 0, currentHeight = 0;
        if (nodeRef.current) { const rect = nodeRef.current.getBoundingClientRect(); currentWidth = rect.width / zoom; currentHeight = rect.height / zoom; }
        const style = element.props.style || {};
        setInteraction({ type: 'MOVE', itemId: elementId, startX: e.clientX, startY: e.clientY, startRect: { left: parseFloat(style.left?.toString() || '0'), top: parseFloat(style.top?.toString() || '0'), width: currentWidth, height: currentHeight } });
    };

    const handleDoubleClick = (e: React.MouseEvent) => { e.stopPropagation(); if (!previewMode && (element.type === 'text' || element.type === 'button')) { setIsEditing(true); setActiveTool('type'); } };
    const handlePointerOver = (e: React.PointerEvent) => { if (previewMode || dragData) return; e.stopPropagation(); setHoveredId(elementId); };
    const handlePointerOut = () => { if (previewMode) return; };
    const handleContentEdit = (e: React.FormEvent<HTMLDivElement>) => { const newContent = e.currentTarget.innerText; const newElements = { ...elements }; newElements[elementId] = { ...newElements[elementId], content: newContent }; updateProject(newElements); };
    const handleKeyDown = (e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); setActiveTool('select'); } };

    // --- NEW: IN-FRAME ADD BUTTON ---
    const renderEmptyState = () => {
        // Only show if: It's a container, not an artboard, has no children, and not in preview
        if (
            isContainer &&
            !isArtboard &&
            (!element.children || element.children.length === 0) &&
            !previewMode &&
            !element.props['data-custom-code']
        ) {
            return (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        // 1. Select the container
                        setSelectedId(elementId);
                        // 2. Open the "Add" Panel in Sidebar
                        setActivePanel('add');
                    }}
                    className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group p-4"
                >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 shadow-sm transition-all">
                        <Plus size={16} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600">
                        Add element
                    </span>
                </div>
            );
        }
        return null;
    };

    // --- RENDER CONTENT ---
    let content = null;
    const showEditable = isEditing;

    // NEW: Handle Custom Imported Code Components with LIVE RENDERING
    if (element.props['data-custom-code']) {
        content = (
            <div className="w-full h-full relative group">
                {/* The Real Component - Live Rendered */}
                <div className="w-full h-full overflow-hidden pointer-events-none">
                    <CodeRenderer code={element.props['data-custom-code']} />
                </div>

                {/* Overlay to allow selecting the component in design mode */}
                <div className="absolute inset-0 z-10" />

                {/* "Code" Badge - visible on hover */}
                {!previewMode && (
                    <div className="absolute bottom-1 right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        TSX
                    </div>
                )}
            </div>
        );
    }
    else if (element.type === 'text' || element.type === 'button') { content = element.content; }
    else if (element.type === 'input') { content = <input className="w-full h-full bg-transparent outline-none pointer-events-none" placeholder={element.props.placeholder} readOnly />; }
    else if (element.type === 'image') { const imgStyle = activeSkeleton ? { opacity: 0 } : {}; content = <img className="w-full h-full object-cover pointer-events-none" style={imgStyle} src={element.src || 'https://via.placeholder.com/150'} alt="" draggable={false} />; }
    else if (element.type === 'icon') { const IconCmp = getIconByName(element.props.iconName || 'Star'); content = <div className="w-full h-full flex items-center justify-center"><IconCmp size={element.props.iconSize || 24} className={element.props.iconClassName || ''} /></div>; }
    else {
        content = (
            <>
                {(element.type === 'canvas' || element.type === 'webpage') && !previewMode && !isMobileMirror && (
                    <div className="absolute top-0 left-0 bg-white text-slate-500 text-[10px] px-2 py-0.5 rounded-br border-b border-r border-slate-200 pointer-events-none z-10 font-medium">{element.name}</div>
                )}

                {/* RENDER CHILDREN + UNIVERSAL BLUE LINES */}
                {element.children?.map((childId, i) => (
                    <React.Fragment key={isMobileMirror ? `${childId}-mobile` : childId}>
                        {/* FIX: Removed 'layoutMode' restriction. Lines appear everywhere now. */}
                        {dragData?.dropParentId === elementId && dragData.dropIndex === i && (
                            <div className="h-1 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none transition-all" />
                        )}
                        <RenderNode elementId={childId} isMobileMirror={isMobileMirror} />
                    </React.Fragment>
                ))}

                {/* FIX: Render the Add Button if empty */}
                {renderEmptyState()}

                {/* BOTTOM LINE */}
                {dragData?.dropParentId === elementId && dragData.dropIndex === (element.children?.length || 0) && (
                    <div className="h-1 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none transition-all" />
                )}
            </>
        );
    }

    return (
        <div
            ref={nodeRef}
            id={isMobileMirror ? `${element.props.id || elementId}-mobile` : (element.props.id || elementId)}
            contentEditable={showEditable && !activeSkeleton}
            suppressContentEditableWarning={true}
            onBlur={(e) => { if (showEditable) { setIsEditing(false); handleContentEdit(e); setActiveTool('select'); } }}
            onKeyDown={showEditable ? handleKeyDown : undefined}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onDrop={(e) => handleDrop(e, isMobileMirror)}
            onDragOver={(e) => handleDragOver(e, isMobileMirror)}
            className={cn(
                className,
                'relative transition-all duration-150 ease-out',
                isSelected && !interaction && !isEditing && 'outline outline-2 outline-blue-500 z-50',
                // FIX: Stronger blue hover outline (outline-2)
                isHovered && !isSelected && 'outline outline-2 outline-blue-500 z-40',
                isLocked && !previewMode && 'opacity-70 cursor-not-allowed',
                element.props.layoutMode === 'flex' && !isMobileMirror ? 'flex gap-2 min-h-[50px]' : '',
                activeTool === 'type' && !isEditing && (element.type === 'text' || element.type === 'button') && !activeSkeleton && 'cursor-text hover:outline hover:outline-1 hover:outline-blue-300'
            )}
            style={finalStyle}
        >
            {renderWireframeOverlay()}
            {isSelected && !previewMode && !isEditing && (
                <div className="absolute -top-[22px] left-[-2px] bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t-sm pointer-events-none whitespace-nowrap z-[60] font-medium shadow-sm">{element.name}</div>
            )}
            {isSelected && !previewMode && canMove && !isLocked && !isEditing && <Resizer elementId={elementId} />}
            {content}
        </div>
    );
};
