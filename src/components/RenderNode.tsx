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
        setInteraction, interaction, zoom, activeTool
    } = useEditor();

    const element = elements[elementId];
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    if (!element) return null;
    if (element.hidden && !previewMode) return <div className="hidden" />;
    if (element.hidden && previewMode) return null;

    const isSelected = selectedId === elementId && !previewMode;
    const isHovered = hoveredId === elementId && !isSelected && !previewMode && !dragData;
    const isContainer = ['container', 'page', 'grid', 'canvas', 'app'].includes(element.type);
    const isLocked = element.locked;
    const isAbsolute = element.props.style?.position === 'absolute';

    const parentId = Object.keys(elements).find(key => elements[key].children?.includes(elementId));
    const parent = parentId ? elements[parentId] : null;
    const isParentFlex = parent?.props.layoutMode === 'flex';
    const canMove = !isParentFlex && isAbsolute && activeTool === 'select';

    // --- HANDLERS ---

    const handlePointerDown = (e: React.PointerEvent) => {
        // 1. Stop propagation to prevent selecting the Page behind the Frame
        e.stopPropagation();

        if (isLocked || previewMode) {
            if (previewMode && element.events?.onClick && element.events.onClick.type === 'NAVIGATE') alert(`Navigating to: ${element.events.onClick.payload}`);
            return;
        }

        setSelectedId(elementId);

        if (activeTool === 'type' && (element.type === 'text' || element.type === 'button')) {
            setIsEditing(true);
            return;
        }

        // 2. CRITICAL FIX: Allow 'canvas' (Frames) to be moved, but lock 'page' and 'app'
        if (['page', 'app'].includes(element.type)) return;

        // 3. Ensure we can move it
        if (!canMove) return;

        e.currentTarget.setPointerCapture(e.pointerId);

        let currentWidth = 0, currentHeight = 0;
        if (nodeRef.current) {
            const rect = nodeRef.current.getBoundingClientRect();
            currentWidth = rect.width / zoom;
            currentHeight = rect.height / zoom;
        }

        const style = element.props.style || {};
        setInteraction({
            type: 'MOVE', itemId: elementId, startX: e.clientX, startY: e.clientY,
            startRect: {
                left: parseFloat(style.left?.toString() || '0'),
                top: parseFloat(style.top?.toString() || '0'),
                width: currentWidth,
                height: currentHeight
            }
        });
    };

    const handlePointerOver = (e: React.PointerEvent) => {
        if (previewMode || dragData) return;
        e.stopPropagation();
        setHoveredId(elementId);
    };

    const handlePointerOut = () => { if (previewMode) return; };

    const handleContentEdit = (e: React.FormEvent<HTMLDivElement>) => {
        const newContent = e.currentTarget.innerText;
        const newElements = { ...elements };
        newElements[elementId] = { ...newElements[elementId], content: newContent };
        updateProject(newElements);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
    };

    const handleDrop = (e: React.DragEvent) => {
        // Allow dropping Frames onto the Page (bubbling up to Canvas)
        if (element.type === 'page' && dragData?.payload === 'canvas') return;

        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-inset', 'bg-blue-50/30');
        if (!dragData || !isContainer || isLocked || previewMode) return;

        let newStyle: React.CSSProperties = {};
        if (element.props.layoutMode === 'flex') {
            newStyle = { position: 'relative', width: '100%', height: 'auto' };
        } else {
            const rect = nodeRef.current?.getBoundingClientRect();
            if (!rect) return;
            const rawX = (e.clientX - rect.left) / zoom;
            const rawY = (e.clientY - rect.top) / zoom;
            newStyle = { position: 'absolute', left: `${Math.round(rawX / 10) * 10}px`, top: `${Math.round(rawY / 10) * 10}px` };
        }

        let newNodes: Record<string, any> = {};
        let newRootId = '';
        if (dragData.type === 'NEW') {
            newRootId = `el-${Date.now()}`;
            const config = COMPONENT_TYPES[dragData.payload];
            if (config) {
                let defaultWidth = '150px';
                let defaultHeight = 'auto';
                if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
                else if (dragData.payload === 'container') { defaultWidth = '200px'; defaultHeight = '150px'; }
                else if (dragData.payload === 'button') { defaultWidth = '120px'; defaultHeight = '40px'; }

                newNodes[newRootId] = {
                    id: newRootId, type: dragData.payload, name: config.label, content: config.defaultContent, src: config.src, children: [],
                    props: {
                        ...config.defaultProps,
                        layoutMode: dragData.payload === 'container' ? 'flex' : undefined,
                        style: { ...(config.defaultProps?.style || {}), ...newStyle, width: defaultWidth, height: defaultHeight }
                    }
                };
            }
        } else if (dragData.type === 'TEMPLATE') {
            const tpl = TEMPLATES[dragData.payload];
            if (tpl) {
                const res = instantiateTemplate(tpl.rootId, tpl.nodes);
                newNodes = res.newNodes; newRootId = res.rootId;
                if (newNodes[newRootId]?.props) newNodes[newRootId].props.style = { ...(newNodes[newRootId].props.style || {}), ...newStyle };
            }
        }

        if (newRootId) {
            const updatedProject = { ...elements, ...newNodes };
            updatedProject[elementId] = { ...updatedProject[elementId], children: [...(updatedProject[elementId].children || []), newRootId] };
            updateProject(updatedProject);
            setSelectedId(newRootId);
        }
        setDragData(null);
    };

    // --- RENDER ---
    let content = null;
    const showEditable = isEditing && activeTool === 'type';

    if (element.type === 'text' || element.type === 'button') {
        content = element.content;
    } else if (element.type === 'input') {
        content = <input className="w-full h-full bg-transparent outline-none pointer-events-none" placeholder={element.props.placeholder} readOnly />;
    } else if (element.type === 'image') {
        content = <img className="w-full h-full object-cover pointer-events-none" src={element.src || 'https://via.placeholder.com/150'} alt="" draggable={false} />;
    } else if (element.type === 'icon') {
        const IconCmp = getIconByName(element.props.iconName || 'Star');
        content = <div className="w-full h-full flex items-center justify-center"><IconCmp size={element.props.iconSize || 24} className={element.props.iconClassName || 'text-slate-700'} /></div>;
    } else {
        content = (
            <>
                {/* Frame Label */}
                {element.type === 'canvas' && !previewMode && (
                    <div className="absolute top-0 left-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-br border-b border-r border-slate-200 pointer-events-none z-10 font-medium">
                        {element.name}
                    </div>
                )}
                {element.children?.map(childId => <RenderNode key={childId} elementId={childId} />)}
            </>
        );
    }

    return (
        <div
            ref={nodeRef}
            contentEditable={showEditable}
            suppressContentEditableWarning={true}
            onBlur={(e) => { if (showEditable) { setIsEditing(false); handleContentEdit(e); } }}
            onKeyDown={showEditable ? handleKeyDown : undefined}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onDrop={handleDrop}
            onDragOver={(e) => { if (isContainer && !previewMode && !isLocked) { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'ring-inset', 'bg-blue-50/30'); } }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-inset', 'bg-blue-50/30')}
            className={cn(
                element.props.className,
                'relative transition-all duration-75',
                isSelected && !interaction && !isEditing && 'ring-2 ring-blue-500 z-50',
                isHovered && !isSelected && 'ring-1 ring-blue-400/50 z-40',
                isLocked && !previewMode && 'opacity-70 cursor-not-allowed',
                element.props.layoutMode === 'flex' ? 'flex flex-col gap-2 min-h-[50px]' : '',
                isEditing ? 'cursor-text ring-2 ring-blue-400 ring-offset-2 outline-none z-[100]' : '',
                activeTool === 'type' && !isEditing && (element.type === 'text' || element.type === 'button') && 'cursor-text hover:ring-1 hover:ring-blue-300'
            )}
            style={element.props.style}
        >
            {isSelected && !previewMode && !isEditing && (
                <div className="absolute -top-[22px] left-[-2px] bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t-sm pointer-events-none whitespace-nowrap z-[60] font-medium shadow-sm">
                    {element.name}
                </div>
            )}
            {isSelected && !previewMode && canMove && !isLocked && !isEditing && <Resizer elementId={elementId} />}
            {content}
        </div>
    );
};
