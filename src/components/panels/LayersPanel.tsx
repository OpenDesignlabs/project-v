import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import {
    ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock,
    Box, Type, Image as ImageIcon, Layout, Grid, Square,
    MousePointer2, Frame, Monitor, Folder
} from 'lucide-react';
import { cn } from '../../lib/utils';

// --- ICON MAPPING ---
const getIconForType = (type: string) => {
    switch (type) {
        case 'page': return Folder;
        case 'webpage': return Monitor;
        case 'canvas': return Frame;
        case 'section': return Layout;
        case 'container': return Box;
        case 'grid': return Grid;
        case 'text': return Type;
        case 'heading': return Type;
        case 'button': return Square;
        case 'image': return ImageIcon;
        default: return MousePointer2;
    }
};

interface LayerItemProps {
    nodeId: string;
    depth?: number;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, targetId: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({ nodeId, depth = 0, onDragStart, onDragOver, onDrop }) => {
    const { elements, selectedId, setSelectedId, updateProject, setHoveredId } = useEditor();
    const [isExpanded, setIsExpanded] = useState(true);
    const node = elements[nodeId];

    if (!node) return null;

    const Icon = getIconForType(node.type);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === nodeId;

    // Toggle Visibility
    const toggleHidden = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateProject({ ...elements, [nodeId]: { ...node, hidden: !node.hidden } });
    };

    // Toggle Lock
    const toggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateProject({ ...elements, [nodeId]: { ...node, locked: !node.locked } });
    };

    return (
        <div className="flex flex-col select-none">
            <div
                draggable={!node.locked}
                onDragStart={(e) => onDragStart(e, nodeId)}
                onDragOver={(e) => onDragOver(e, nodeId)}
                onDrop={(e) => onDrop(e, nodeId)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(nodeId); }}
                onMouseEnter={() => setHoveredId(nodeId)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors border-l-2 border-transparent group relative",
                    isSelected ? "bg-[#007acc]/20 border-[#007acc]" : "hover:bg-[#3e3e42]",
                    node.hidden && "opacity-50"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {/* Expand Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className={cn(
                        "p-0.5 rounded hover:bg-white/10 text-[#858585] transition-colors",
                        !hasChildren && "invisible"
                    )}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {/* Node Icon */}
                <Icon size={14} className={cn("shrink-0", isSelected ? "text-[#007acc]" : "text-[#cccccc]")} />

                {/* Node Name */}
                <span className="text-xs text-[#cccccc] truncate flex-1 font-medium">
                    {node.name}
                </span>

                {/* Quick Actions (Hover Only) */}
                <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", (node.hidden || node.locked) && "opacity-100")}>
                    <button onClick={toggleLock} className={cn("p-1 hover:text-white", node.locked ? "text-red-400" : "text-[#666]")}>
                        {node.locked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                    <button onClick={toggleHidden} className={cn("p-1 hover:text-white", node.hidden ? "text-[#666]" : "text-[#666]")}>
                        {node.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                </div>
            </div>

            {/* Children Recursive Render */}
            {hasChildren && isExpanded && (
                <div className="flex flex-col">
                    {node.children?.map(childId => (
                        <LayerItem
                            key={childId}
                            nodeId={childId}
                            depth={depth + 1}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const LayersPanel = () => {
    const { elements, activePageId, updateProject } = useEditor();
    const page = elements[activePageId];

    // --- REORDER LOGIC ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('nodeId', id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent, _targetId: string) => {
        e.preventDefault(); // Allow drop
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('nodeId');

        if (draggedId === targetId) return; // Can't drop on self
        if (!draggedId || !elements[draggedId] || !elements[targetId]) return;

        // 1. Find Parents
        const findParent = (id: string): string | null => {
            return Object.keys(elements).find(k => elements[k].children?.includes(id)) || null;
        };

        const oldParentId = findParent(draggedId);
        if (!oldParentId) return;

        // 2. Logic: If dropped ON a container, move INSIDE. If dropped ON a leaf, move NEXT TO.
        const targetNode = elements[targetId];
        const isContainer = ['page', 'webpage', 'canvas', 'section', 'container', 'grid'].includes(targetNode.type);

        const newElements = { ...elements };

        // Remove from old parent
        newElements[oldParentId].children = newElements[oldParentId].children?.filter(c => c !== draggedId) || [];

        if (isContainer) {
            // Move INSIDE target (Template inside Template)
            newElements[targetId].children = [draggedId, ...(newElements[targetId].children || [])];
        } else {
            // Move NEXT TO target (Component next to Component)
            const newParentId = findParent(targetId);
            if (newParentId) {
                const siblings = newElements[newParentId].children || [];
                const targetIndex = siblings.indexOf(targetId);
                siblings.splice(targetIndex + 1, 0, draggedId);
                newElements[newParentId].children = siblings;
            } else {
                // Fallback to old parent if logic fails
                newElements[oldParentId].children?.push(draggedId);
            }
        }

        updateProject(newElements);
    };

    if (!page) return <div className="p-4 text-xs text-[#666]">No active page</div>;

    return (
        <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
            <div className="p-4 border-b border-[#3f3f46]">
                <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Box size={14} className="text-[#007acc]" /> Layers
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                {page.children?.length === 0 ? (
                    <div className="text-center py-10 text-[#666] text-xs px-6">
                        No elements on this page.<br />Drag blocks from the + menu.
                    </div>
                ) : (
                    page.children?.map(childId => (
                        <LayerItem
                            key={childId}
                            nodeId={childId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
