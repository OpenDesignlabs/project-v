import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { VectraProject, DragData, InteractionState, Guide, Asset, GlobalStyles, EditorTool } from '../types';
import { INITIAL_DATA } from '../data/constants';

interface EditorContextType {
    elements: VectraProject;
    setElements: React.Dispatch<React.SetStateAction<VectraProject>>;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    hoveredId: string | null;
    setHoveredId: (id: string | null) => void;
    activePageId: string;
    setActivePageId: (id: string) => void;
    previewMode: boolean;
    setPreviewMode: (mode: boolean) => void;
    activeTool: EditorTool;
    setActiveTool: (tool: EditorTool) => void;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    isPanning: boolean;
    setIsPanning: (isPanning: boolean) => void;
    dragData: DragData | null;
    setDragData: (data: DragData | null) => void;
    interaction: InteractionState | null;
    setInteraction: React.Dispatch<React.SetStateAction<InteractionState | null>>;
    handleInteractionMove: (e: PointerEvent) => void;
    guides: Guide[];
    assets: Asset[];
    addAsset: (file: File) => void;
    globalStyles: GlobalStyles;
    setGlobalStyles: React.Dispatch<React.SetStateAction<GlobalStyles>>;
    addPage: (name: string) => void;
    deletePage: (id: string) => void;
    updateProject: (newElements: VectraProject) => void;
    deleteElement: (id: string) => void;
    history: { undo: () => void; redo: () => void };
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State
    const [elements, setElements] = useState<VectraProject>(() => {
        try { return JSON.parse(localStorage.getItem('vectra_design_v50') || 'null') || INITIAL_DATA; } catch { return INITIAL_DATA; }
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [activePageId, setActivePageId] = useState('page-home');
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTool, setActiveTool] = useState<EditorTool>('select');

    const [dragData, setDragData] = useState<DragData | null>(null);
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    const [zoom, setZoom] = useState(0.8);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    // History
    const [historyStack, setHistoryStack] = useState<VectraProject[]>([INITIAL_DATA]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [guides, setGuides] = useState<Guide[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [globalStyles, setGlobalStyles] = useState<GlobalStyles>({
        colors: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b', dark: '#1e293b' },
        fonts: {}
    });

    // Persistence
    useEffect(() => {
        const timer = setTimeout(() => localStorage.setItem('vectra_design_v50', JSON.stringify(elements)), 1000);
        return () => clearTimeout(timer);
    }, [elements]);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(globalStyles.colors).forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
    }, [globalStyles]);

    const addAsset = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => setAssets(prev => [...prev, { id: `asset-${Date.now()}`, type: 'image', url: e.target?.result as string, name: file.name }]);
        reader.readAsDataURL(file);
    };

    const addPage = (name: string) => {
        const pageId = `page-${Date.now()}`;
        const canvasId = `canvas-${Date.now()}`;
        const newElements = { ...elements };

        newElements[pageId] = { id: pageId, type: 'page', name: name, children: [canvasId], props: { className: 'w-full min-h-full flex flex-col items-center justify-center p-8 bg-slate-100' } };
        newElements[canvasId] = { id: canvasId, type: 'canvas', name: 'Artboard', children: [], props: { className: 'w-[800px] h-[600px] bg-white rounded-lg border border-slate-200 relative overflow-hidden shadow-2xl' } };

        if (newElements['application-root']) {
            newElements['application-root'] = {
                ...newElements['application-root'],
                children: [...(newElements['application-root'].children || []), pageId]
            };
        }

        updateProject(newElements);
        setActivePageId(pageId);
    };

    const deletePage = (id: string) => {
        if (id === 'page-home') return;
        const newElements = { ...elements };

        if (newElements['application-root']) {
            newElements['application-root'] = {
                ...newElements['application-root'],
                children: newElements['application-root'].children?.filter(cid => cid !== id)
            };
        }

        delete newElements[id];
        updateProject(newElements);
        setActivePageId('page-home');
    };

    // Updated Handler for PointerEvent
    const handleInteractionMove = useCallback((e: PointerEvent) => {
        if (!interaction) return;
        const { type, itemId, startX, startY, startRect, handle } = interaction;

        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        const newRect = { ...startRect };
        let newGuides: Guide[] = [];

        // Identify snap targets (siblings)
        const parentId = Object.keys(elements).find(k => elements[k].children?.includes(itemId));
        const siblings = parentId ? elements[parentId].children || [] : [];
        const snapTargets = siblings
            .filter(id => id !== itemId)
            .map(id => elements[id])
            .filter(el => el && !el.hidden && el.props.style?.position === 'absolute');

        const THRESHOLD = 5;

        // --- MOVE LOGIC ---
        if (type === 'MOVE') {
            let proposedLeft = startRect.left + deltaX;
            let proposedTop = startRect.top + deltaY;
            let snappedX = false;
            let snappedY = false;

            // X-Axis Snap (Left, Right, Center)
            for (const target of snapTargets) {
                const tLeft = parseFloat(String(target.props.style?.left || 0));
                const tWidth = parseFloat(String(target.props.style?.width || 0));
                const tRight = tLeft + tWidth;
                const tCenter = tLeft + tWidth / 2;

                const myWidth = startRect.width;
                const myRight = proposedLeft + myWidth;
                const myCenterX = proposedLeft + myWidth / 2;

                if (Math.abs(proposedLeft - tLeft) < THRESHOLD) { proposedLeft = tLeft; snappedX = true; newGuides.push({ type: 'vertical', pos: tLeft }); }
                else if (Math.abs(proposedLeft - tRight) < THRESHOLD) { proposedLeft = tRight; snappedX = true; newGuides.push({ type: 'vertical', pos: tRight }); }
                else if (Math.abs(myRight - tLeft) < THRESHOLD) { proposedLeft = tLeft - myWidth; snappedX = true; newGuides.push({ type: 'vertical', pos: tLeft }); }
                else if (Math.abs(myRight - tRight) < THRESHOLD) { proposedLeft = tRight - myWidth; snappedX = true; newGuides.push({ type: 'vertical', pos: tRight }); }
                else if (Math.abs(myCenterX - tCenter) < THRESHOLD) { proposedLeft = tCenter - myWidth / 2; snappedX = true; newGuides.push({ type: 'vertical', pos: tCenter }); }

                if (snappedX) break;
            }

            // Y-Axis Snap
            for (const target of snapTargets) {
                const tTop = parseFloat(String(target.props.style?.top || 0));
                const tHeight = parseFloat(String(target.props.style?.height || 0));
                const tBottom = tTop + tHeight;
                const tCenter = tTop + tHeight / 2;

                const myHeight = startRect.height;
                const myBottom = proposedTop + myHeight;
                const myCenterY = proposedTop + myHeight / 2;

                if (Math.abs(proposedTop - tTop) < THRESHOLD) { proposedTop = tTop; snappedY = true; newGuides.push({ type: 'horizontal', pos: tTop }); }
                else if (Math.abs(proposedTop - tBottom) < THRESHOLD) { proposedTop = tBottom; snappedY = true; newGuides.push({ type: 'horizontal', pos: tBottom }); }
                else if (Math.abs(myBottom - tTop) < THRESHOLD) { proposedTop = tTop - myHeight; snappedY = true; newGuides.push({ type: 'horizontal', pos: tTop }); }
                else if (Math.abs(myBottom - tBottom) < THRESHOLD) { proposedTop = tBottom - myHeight; snappedY = true; newGuides.push({ type: 'horizontal', pos: tBottom }); }
                else if (Math.abs(myCenterY - tCenter) < THRESHOLD) { proposedTop = tCenter - myHeight / 2; snappedY = true; newGuides.push({ type: 'horizontal', pos: tCenter }); }

                if (snappedY) break;
            }

            if (!snappedX) newRect.left = Math.round(proposedLeft / 10) * 10; else newRect.left = proposedLeft;
            if (!snappedY) newRect.top = Math.round(proposedTop / 10) * 10; else newRect.top = proposedTop;

            // --- RESIZE LOGIC WITH SNAP ---
        } else if (type === 'RESIZE' && handle) {

            const snapValue = (val: number, isVertical: boolean): number | null => {
                for (const target of snapTargets) {
                    const tLeft = parseFloat(String(target.props.style?.left || 0));
                    const tTop = parseFloat(String(target.props.style?.top || 0));
                    const tWidth = parseFloat(String(target.props.style?.width || 0));
                    const tHeight = parseFloat(String(target.props.style?.height || 0));

                    const targets = isVertical
                        ? [tLeft, tLeft + tWidth]
                        : [tTop, tTop + tHeight];

                    for (const t of targets) {
                        if (Math.abs(val - t) < THRESHOLD) {
                            newGuides.push({ type: isVertical ? 'vertical' : 'horizontal', pos: t });
                            return t;
                        }
                    }
                }
                return null;
            };

            if (handle.includes('e')) {
                let newWidth = Math.max(20, startRect.width + deltaX);
                const proposedRight = startRect.left + newWidth;
                const snappedRight = snapValue(proposedRight, true);
                if (snappedRight !== null) newWidth = snappedRight - startRect.left;
                newRect.width = newWidth;
            }
            if (handle.includes('w')) {
                let proposedLeft = startRect.left + deltaX;
                const snappedLeft = snapValue(proposedLeft, true);
                if (snappedLeft !== null) proposedLeft = snappedLeft;

                const widthChange = startRect.left - proposedLeft;
                newRect.width = Math.max(20, startRect.width + widthChange);
                newRect.left = proposedLeft;
            }

            if (handle.includes('s')) {
                let newHeight = Math.max(20, startRect.height + deltaY);
                const proposedBottom = startRect.top + newHeight;
                const snappedBottom = snapValue(proposedBottom, false);
                if (snappedBottom !== null) newHeight = snappedBottom - startRect.top;
                newRect.height = newHeight;
            }
            if (handle.includes('n')) {
                let proposedTop = startRect.top + deltaY;
                const snappedTop = snapValue(proposedTop, false);
                if (snappedTop !== null) proposedTop = snappedTop;

                const heightChange = startRect.top - proposedTop;
                newRect.height = Math.max(20, startRect.height + heightChange);
                newRect.top = proposedTop;
            }
        }

        setGuides(newGuides);

        setElements(prev => {
            const currentStyle = prev[itemId].props.style || {};
            const nextStyle: React.CSSProperties = {
                ...currentStyle,
                position: 'absolute',
                left: `${newRect.left}px`,
                top: `${newRect.top}px`
            };

            if (type === 'RESIZE') {
                nextStyle.width = `${newRect.width}px`;
                nextStyle.height = `${newRect.height}px`;
            }

            return {
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    props: {
                        ...prev[itemId].props,
                        style: nextStyle
                    }
                }
            };
        });
    }, [interaction, zoom, elements]);

    useEffect(() => { if (!interaction) setGuides([]); }, [interaction]);

    // History & Update Logic
    const updateProject = useCallback((newElements: VectraProject) => {
        setElements(newElements);
        setHistoryStack(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            if (newHistory.length >= 50) newHistory.shift();
            newHistory.push(newElements);
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setElements(historyStack[historyIndex - 1]);
        }
    }, [historyIndex, historyStack]);

    const redo = useCallback(() => {
        if (historyIndex < historyStack.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setElements(historyStack[historyIndex + 1]);
        }
    }, [historyIndex, historyStack]);

    const deleteElement = useCallback((id: string) => {
        if (['application-root', 'page-home', 'main-canvas'].includes(id)) return;
        const newElements = JSON.parse(JSON.stringify(elements));
        Object.keys(newElements).forEach(key => {
            if (newElements[key].children?.includes(id)) {
                newElements[key].children = newElements[key].children.filter((cid: string) => cid !== id);
            }
        });
        delete newElements[id];
        updateProject(newElements);
        setSelectedId(null);
    }, [elements, updateProject]);

    return (
        <EditorContext.Provider value={{
            elements, setElements, selectedId, setSelectedId, hoveredId, setHoveredId,
            activePageId, setActivePageId, previewMode, setPreviewMode, activeTool, setActiveTool,
            dragData, setDragData, zoom, setZoom, pan, setPan, isPanning, setIsPanning,
            interaction, setInteraction, handleInteractionMove, guides, assets, addAsset,
            globalStyles, setGlobalStyles, addPage, deletePage, updateProject, deleteElement,
            history: { undo, redo }
        }}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) throw new Error('useEditor must be used within an EditorProvider');
    return context;
};
