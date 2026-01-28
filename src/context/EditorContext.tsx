import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { VectraProject, DragData, InteractionState, Guide, Asset, GlobalStyles, EditorTool, DeviceType, ActionType, ViewMode, ComponentConfig } from '../types';
import { INITIAL_DATA, COMPONENT_TYPES } from '../data/constants';

// Sidebar Panel Types
export type SidebarPanel = 'add' | 'layers' | 'pages' | 'assets' | 'settings' | null;

interface ExtendedEditorContextType {
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
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    device: DeviceType;
    setDevice: (device: DeviceType) => void;
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
    runAction: (action: ActionType) => void;
    // Insert Drawer State (Legacy - for backward compat)
    isInsertDrawerOpen: boolean;
    toggleInsertDrawer: () => void;
    // NEW: Sidebar Panel System
    activePanel: SidebarPanel;
    setActivePanel: React.Dispatch<React.SetStateAction<SidebarPanel>>;
    togglePanel: (panel: SidebarPanel) => void;
    // Dynamic Component Registry
    componentRegistry: Record<string, ComponentConfig>;
    registerComponent: (id: string, config: ComponentConfig) => void;
}

const EditorContext = createContext<ExtendedEditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [elements, setElements] = useState<VectraProject>(() => {
        try { return JSON.parse(localStorage.getItem('vectra_design_v50') || 'null') || INITIAL_DATA; }
        catch { return INITIAL_DATA; }
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [activePageId, setActivePageId] = useState('page-home');
    const [previewMode, setPreviewMode] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('visual');
    const [activeTool, setActiveTool] = useState<EditorTool>('select');
    const [device, setDeviceState] = useState<DeviceType>('desktop');
    const [dragData, setDragData] = useState<DragData | null>(null);
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    const [zoom, setZoom] = useState(0.5);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [historyStack, setHistoryStack] = useState<VectraProject[]>([INITIAL_DATA]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [guides, setGuides] = useState<Guide[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [globalStyles, setGlobalStyles] = useState<GlobalStyles>({
        colors: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b', dark: '#1e293b' },
        fonts: {}
    });
    // Insert Drawer State (Legacy)
    const [isInsertDrawerOpen, setIsInsertDrawerOpen] = useState(false);

    // NEW: Sidebar Panel State
    const [activePanel, setActivePanel] = useState<SidebarPanel>(null);

    // Dynamic Component Registry - starts with default components
    const [componentRegistry, setComponentRegistry] = useState<Record<string, ComponentConfig>>(COMPONENT_TYPES);

    const toggleInsertDrawer = useCallback(() => {
        setIsInsertDrawerOpen(prev => !prev);
        // Sync with new panel system
        setActivePanel(prev => prev === 'add' ? null : 'add');
    }, []);

    // Toggle panel - if same panel, close it
    const togglePanel = useCallback((panel: SidebarPanel) => {
        setActivePanel(prev => prev === panel ? null : panel);
        // Sync legacy state
        if (panel === 'add') {
            setIsInsertDrawerOpen(prev => !prev);
        }
    }, []);

    // Register new components at runtime
    const registerComponent = useCallback((id: string, config: ComponentConfig) => {
        setComponentRegistry(prev => {
            if (prev[id]) {
                console.warn(`Component ${id} already exists. Overwriting.`);
            }
            return { ...prev, [id]: config };
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => localStorage.setItem('vectra_design_v50', JSON.stringify(elements)), 1000);
        return () => clearTimeout(timer);
    }, [elements]);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(globalStyles.colors).forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
    }, [globalStyles]);

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

    const setDevice = (newDevice: DeviceType) => {
        setDeviceState(newDevice);
        const activePage = elements[activePageId];
        if (!activePage?.children?.[0]) return;
        const frameId = activePage.children[0];
        const frame = elements[frameId];
        if (frame && (frame.type === 'canvas' || frame.type === 'webpage')) {
            const newElements = { ...elements };
            const newStyle = { ...frame.props.style };
            if (newDevice === 'mobile') { newStyle.width = '390px'; }
            else { newStyle.width = frame.type === 'webpage' ? '1440px' : '800px'; }
            newElements[frameId] = { ...frame, props: { ...frame.props, style: newStyle } };
            updateProject(newElements);
            if (newDevice === 'mobile') setZoom(1); else setZoom(0.8);
        }
    };

    const runAction = useCallback((act: ActionType) => {
        // Handle new Interaction Builder types
        if ('action' in act) {
            if (act.action === 'link' && act.value) {
                window.open(act.value, '_blank');
            } else if (act.action === 'scroll' && act.value) {
                document.getElementById(act.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        // Handle legacy types
        if (act.type === 'NAVIGATE') {
            if (act.payload.startsWith('http')) { window.open(act.payload, '_blank'); return; }
            if (elements[act.payload]) { setActivePageId(act.payload); setPan({ x: 0, y: 0 }); }
        } else if (act.type === 'SCROLL_TO') {
            document.getElementById(act.payload)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (act.type === 'TOGGLE_VISIBILITY') {
            const targetId = act.payload;
            if (elements[targetId]) {
                setElements(prev => ({
                    ...prev,
                    [targetId]: { ...prev[targetId], hidden: !prev[targetId].hidden }
                }));
            }
        }
    }, [elements, setActivePageId]);

    const addAsset = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => setAssets(prev => [...prev, { id: `asset-${Date.now()}`, type: 'image', url: e.target?.result as string, name: file.name }]);
        reader.readAsDataURL(file);
    };

    const addPage = (name: string) => {
        const pageId = `page-${Date.now()}`;
        const canvasId = `canvas-${Date.now()}`;
        const newElements = { ...elements };
        newElements[pageId] = { id: pageId, type: 'page', name: name, children: [canvasId], props: { layoutMode: 'canvas', className: 'w-full h-full relative', style: { width: '100%', height: '100%' } } };
        newElements[canvasId] = { id: canvasId, type: 'canvas', name: 'Artboard 1', children: [], props: { className: 'bg-white shadow-xl relative overflow-hidden', style: { position: 'absolute', left: '100px', top: '100px', width: '1440px', height: '1024px' } } };
        if (newElements['application-root']) {
            newElements['application-root'] = { ...newElements['application-root'], children: [...(newElements['application-root'].children || []), pageId] };
        }
        updateProject(newElements);
        setActivePageId(pageId);
    };

    const deletePage = (id: string) => {
        if (id === 'page-home') return;
        const newElements = { ...elements };
        if (newElements['application-root']) {
            newElements['application-root'] = { ...newElements['application-root'], children: newElements['application-root'].children?.filter(cid => cid !== id) };
        }
        delete newElements[id];
        updateProject(newElements);
        setActivePageId('page-home');
    };

    const undo = useCallback(() => {
        if (historyIndex > 0) { setHistoryIndex(p => p - 1); setElements(historyStack[historyIndex - 1]); }
    }, [historyIndex, historyStack]);

    const redo = useCallback(() => {
        if (historyIndex < historyStack.length - 1) { setHistoryIndex(p => p + 1); setElements(historyStack[historyIndex + 1]); }
    }, [historyIndex, historyStack]);

    const deleteElement = useCallback((id: string) => {
        if (['application-root', 'page-home', 'main-canvas'].includes(id)) return;
        const newElements = JSON.parse(JSON.stringify(elements));
        Object.keys(newElements).forEach(key => {
            if (newElements[key].children) newElements[key].children = newElements[key].children.filter((cid: string) => cid !== id);
        });
        delete newElements[id];
        updateProject(newElements);
        setSelectedId(null);
    }, [elements, updateProject]);

    // --- PRO SNAPPING ENGINE ---
    const handleInteractionMove = useCallback((e: PointerEvent) => {
        if (!interaction) return;
        const { type, itemId, startX, startY, startRect, handle } = interaction;

        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;
        const THRESHOLD = 5;

        const newRect = { ...startRect };
        let newGuides: Guide[] = [];

        const parentId = Object.keys(elements).find(k => elements[k].children?.includes(itemId));
        const parent = parentId ? elements[parentId] : null;
        const siblings = parentId ? elements[parentId].children || [] : [];
        const snapTargets = siblings
            .filter(id => id !== itemId)
            .map(id => elements[id])
            .filter(el => el && !el.hidden && el.props.style?.position === 'absolute');

        if (parent && (parent.type === 'canvas' || parent.type === 'webpage' || parent.type === 'container')) {
            const pWidth = parseFloat(String(parent.props.style?.width || '0'));
            const pHeight = parseFloat(String(parent.props.style?.height || '0'));
            snapTargets.push({
                id: parentId!, type: parent.type, name: 'Parent',
                props: { style: { left: 0, top: 0, width: pWidth, height: pHeight, position: 'absolute' } }
            } as any);
        }

        if (type === 'MOVE') {
            let proposedLeft = startRect.left + deltaX;
            let proposedTop = startRect.top + deltaY;
            const w = startRect.width;
            const h = startRect.height;
            let snappedX = false, snappedY = false;

            const myX = [
                { val: proposedLeft, snapType: 'start' },
                { val: proposedLeft + w / 2, snapType: 'center' },
                { val: proposedLeft + w, snapType: 'end' }
            ];

            for (const target of snapTargets) {
                if (snappedX) break;
                const tX = parseFloat(String(target.props.style?.left || 0));
                const tW = parseFloat(String(target.props.style?.width || 0));
                const tY = parseFloat(String(target.props.style?.top || 0));
                const tH = parseFloat(String(target.props.style?.height || 0));

                const targetPoints = [
                    { val: tX, snapType: 'start' },
                    { val: tX + tW / 2, snapType: 'center' },
                    { val: tX + tW, snapType: 'end' }
                ];

                for (const mp of myX) {
                    if (snappedX) break;
                    for (const tp of targetPoints) {
                        if (Math.abs(mp.val - tp.val) < THRESHOLD) {
                            proposedLeft += (tp.val - mp.val);
                            snappedX = true;
                            const minY = Math.min(proposedTop, tY);
                            const maxY = Math.max(proposedTop + h, tY + tH);
                            newGuides.push({ orientation: 'vertical', pos: tp.val, start: minY, end: maxY, type: 'align' });
                            break;
                        }
                    }
                }
            }

            const myY = [
                { val: proposedTop, snapType: 'start' },
                { val: proposedTop + h / 2, snapType: 'center' },
                { val: proposedTop + h, snapType: 'end' }
            ];

            for (const target of snapTargets) {
                if (snappedY) break;
                const tY = parseFloat(String(target.props.style?.top || 0));
                const tH = parseFloat(String(target.props.style?.height || 0));
                const tX = parseFloat(String(target.props.style?.left || 0));
                const tW = parseFloat(String(target.props.style?.width || 0));

                const targetPoints = [
                    { val: tY, snapType: 'start' },
                    { val: tY + tH / 2, snapType: 'center' },
                    { val: tY + tH, snapType: 'end' }
                ];

                for (const mp of myY) {
                    if (snappedY) break;
                    for (const tp of targetPoints) {
                        if (Math.abs(mp.val - tp.val) < THRESHOLD) {
                            proposedTop += (tp.val - mp.val);
                            snappedY = true;
                            const minX = Math.min(proposedLeft, tX);
                            const maxX = Math.max(proposedLeft + w, tX + tW);
                            newGuides.push({ orientation: 'horizontal', pos: tp.val, start: minX, end: maxX, type: 'align' });
                            break;
                        }
                    }
                }
            }

            if (parent && (parent.type === 'canvas' || parent.type === 'webpage' || parent.type === 'container')) {
                const pW = parseFloat(String(parent.props.style?.width || 0));
                const pH = parseFloat(String(parent.props.style?.height || 0));
                newRect.left = Math.max(0, Math.min(snappedX ? proposedLeft : Math.round(proposedLeft), pW - w));
                newRect.top = Math.max(0, Math.min(snappedY ? proposedTop : Math.round(proposedTop), pH - h));
            } else {
                newRect.left = snappedX ? proposedLeft : Math.round(proposedLeft);
                newRect.top = snappedY ? proposedTop : Math.round(proposedTop);
            }

        } else if (type === 'RESIZE' && handle) {
            if (handle.includes('e')) newRect.width = Math.max(20, startRect.width + deltaX);
            if (handle.includes('w')) { newRect.width = Math.max(20, startRect.width - deltaX); newRect.left = startRect.left + deltaX; }
            if (handle.includes('s')) newRect.height = Math.max(20, startRect.height + deltaY);
            if (handle.includes('n')) { newRect.height = Math.max(20, startRect.height - deltaY); newRect.top = startRect.top + deltaY; }
        }

        setGuides(newGuides);

        setElements(prev => {
            const currentElement = prev[itemId];
            if (!currentElement) return prev;
            const currentStyle = currentElement.props.style || {};
            const currentClasses = currentElement.props.className || '';

            const nextStyle: React.CSSProperties = {
                ...currentStyle,
                position: 'absolute',
                left: `${newRect.left}px`,
                top: `${newRect.top}px`
            };

            if (type === 'RESIZE') {
                if (!currentClasses.includes('w-full') && !currentClasses.includes('w-fit')) nextStyle.width = `${newRect.width}px`;
                if (!currentClasses.includes('h-full') && !currentClasses.includes('h-fit')) nextStyle.height = `${newRect.height}px`;
            }

            return { ...prev, [itemId]: { ...prev[itemId], props: { ...prev[itemId].props, style: nextStyle } } };
        });
    }, [interaction, zoom, elements]);

    useEffect(() => { if (!interaction) setGuides([]); }, [interaction]);

    return (
        <EditorContext.Provider value={{
            elements, setElements, selectedId, setSelectedId, hoveredId, setHoveredId,
            activePageId, setActivePageId, previewMode, setPreviewMode, activeTool, setActiveTool,
            device, setDevice, dragData, setDragData, zoom, setZoom, pan, setPan, isPanning, setIsPanning,
            interaction, setInteraction, handleInteractionMove, guides, assets, addAsset,
            globalStyles, setGlobalStyles, addPage, deletePage, updateProject, deleteElement,
            history: { undo, redo }, runAction,
            viewMode, setViewMode,
            isInsertDrawerOpen, toggleInsertDrawer,
            activePanel, setActivePanel, togglePanel,
            componentRegistry, registerComponent
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
