import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { VectraProject, DragData, InteractionState, Guide, Asset, GlobalStyles, EditorTool, DeviceType, ActionType, ViewMode, ComponentConfig } from '../types';
import { INITIAL_DATA, COMPONENT_TYPES, STORAGE_KEY } from '../data/constants';
import { instantiateTemplate as instantiateTemplateTS } from '../utils/templateUtils';

// --- RUST ENGINE LOADER ---
let wasmModule: any = null;

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
    isInsertDrawerOpen: boolean;
    toggleInsertDrawer: () => void;
    activePanel: SidebarPanel;
    setActivePanel: React.Dispatch<React.SetStateAction<SidebarPanel>>;
    togglePanel: (panel: SidebarPanel) => void;
    componentRegistry: Record<string, ComponentConfig>;
    registerComponent: (id: string, config: ComponentConfig) => void;
    instantiateTemplate: (rootId: string, nodes: VectraProject) => { newNodes: VectraProject; rootId: string };
    recentComponents: string[];
    addRecentComponent: (id: string) => void;
}

const EditorContext = createContext<ExtendedEditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [elements, setElements] = useState<VectraProject>(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || INITIAL_DATA; }
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

    // --- REPLACED JS HISTORY WITH RUST MANAGER ---
    const historyManagerRef = useRef<any>(null);
    // Fallback JS history for when WASM isn't ready
    const [historyStack, setHistoryStack] = useState<VectraProject[]>([INITIAL_DATA]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [guides, setGuides] = useState<Guide[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [globalStyles, setGlobalStyles] = useState<GlobalStyles>({
        colors: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b', dark: '#1e293b' },
        fonts: {}
    });
    const [isInsertDrawerOpen, setIsInsertDrawerOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<SidebarPanel>(null);
    const [componentRegistry, setComponentRegistry] = useState<Record<string, ComponentConfig>>(COMPONENT_TYPES);
    const [recentComponents, setRecentComponents] = useState<string[]>([]);

    const addRecentComponent = useCallback((id: string) => {
        setRecentComponents(prev => {
            const filtered = prev.filter(item => item !== id);
            return [id, ...filtered].slice(0, 8);
        });
    }, []);

    // --- INITIALIZE RUST ENGINE ---
    useEffect(() => {
        const initWasm = async () => {
            try {
                const wasm = await import('../../vectra-engine/pkg/vectra_engine.js');
                await wasm.default();
                wasmModule = wasm;

                // Expose globally for Header.tsx code generation
                (window as any).vectraWasm = wasm;

                // Initialize HistoryManager with current state
                const initialState = localStorage.getItem(STORAGE_KEY) || JSON.stringify(INITIAL_DATA);
                historyManagerRef.current = new wasm.HistoryManager(initialState);

                console.log("Vectra Engine (Rust): Ready - All 4 Priorities Active");
            } catch (err) {
                console.warn("Vectra Engine (Rust): Not found. Falling back to TypeScript.", err);
            }
        };
        initWasm();
    }, []);

    const toggleInsertDrawer = useCallback(() => {
        setIsInsertDrawerOpen(prev => !prev);
        setActivePanel(prev => prev === 'add' ? null : 'add');
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(elements)), 1000);
        return () => clearTimeout(timer);
    }, [elements]);

    const togglePanel = useCallback((panel: SidebarPanel) => {
        setActivePanel(prev => prev === panel ? null : panel);
        if (panel === 'add') setIsInsertDrawerOpen(prev => !prev);
    }, []);

    const registerComponent = useCallback((id: string, config: ComponentConfig) => {
        setComponentRegistry(prev => ({ ...prev, [id]: config }));
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(globalStyles.colors).forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
    }, [globalStyles]);

    // --- UPDATE PROJECT (HYBRID HISTORY) ---
    const updateProject = useCallback((newElements: VectraProject) => {
        setElements(newElements);

        if (historyManagerRef.current) {
            // RUST PATH: Push compressed string to WASM memory
            historyManagerRef.current.push_state(JSON.stringify(newElements));
        } else {
            // FALLBACK JS PATH
            setHistoryStack(prev => {
                const newHistory = prev.slice(0, historyIndex + 1);
                if (newHistory.length >= 50) newHistory.shift();
                newHistory.push(newElements);
                return newHistory;
            });
            setHistoryIndex(prev => Math.min(prev + 1, 49));
        }
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
        if ('action' in act) {
            if (act.action === 'link' && act.value) window.open(act.value, '_blank');
            else if (act.action === 'scroll' && act.value) document.getElementById(act.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if (act.type === 'NAVIGATE') {
            if (act.payload.startsWith('http')) { window.open(act.payload, '_blank'); return; }
            if (elements[act.payload]) { setActivePageId(act.payload); setPan({ x: 0, y: 0 }); }
        } else if (act.type === 'SCROLL_TO') document.getElementById(act.payload)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else if (act.type === 'TOGGLE_VISIBILITY') {
            const targetId = act.payload;
            if (elements[targetId]) setElements(prev => ({ ...prev, [targetId]: { ...prev[targetId], hidden: !prev[targetId].hidden } }));
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
        if (newElements['application-root']) newElements['application-root'] = { ...newElements['application-root'], children: [...(newElements['application-root'].children || []), pageId] };
        updateProject(newElements);
        setActivePageId(pageId);
    };

    const deletePage = (id: string) => {
        if (id === 'page-home') return;
        const newElements = { ...elements };
        if (newElements['application-root']) newElements['application-root'] = { ...newElements['application-root'], children: newElements['application-root'].children?.filter(cid => cid !== id) };
        delete newElements[id];
        updateProject(newElements);
        setActivePageId('page-home');
    };

    // --- HYBRID UNDO/REDO (RUST + TS) ---
    const undo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.can_undo()) {
            // RUST PATH: Retrieve compressed state from WASM memory
            const prevStateJson = historyManagerRef.current.undo();
            if (prevStateJson) {
                const prevState = JSON.parse(prevStateJson);
                setElements(prevState);
            }
        } else if (historyIndex > 0) {
            // FALLBACK JS PATH
            setHistoryIndex(p => p - 1);
            setElements(historyStack[historyIndex - 1]);
        }
    }, [historyIndex, historyStack]);

    const redo = useCallback(() => {
        if (historyManagerRef.current && historyManagerRef.current.can_redo()) {
            // RUST PATH
            const nextStateJson = historyManagerRef.current.redo();
            if (nextStateJson) {
                const nextState = JSON.parse(nextStateJson);
                setElements(nextState);
            }
        } else if (historyIndex < historyStack.length - 1) {
            // FALLBACK JS PATH
            setHistoryIndex(p => p + 1);
            setElements(historyStack[historyIndex + 1]);
        }
    }, [historyIndex, historyStack]);

    // --- HYBRID DELETE (RUST + TS) ---
    const deleteElement = useCallback((id: string) => {
        if (['application-root', 'page-home', 'main-canvas'].includes(id)) return;

        if (wasmModule) {
            try {
                const newElements = wasmModule.delete_node(elements, id);
                updateProject(newElements);
                setSelectedId(null);
                return;
            } catch (e) {
                console.error("Rust delete failed, falling back to JS", e);
            }
        }

        // TS FALLBACK PATH
        const newElements = JSON.parse(JSON.stringify(elements));
        Object.keys(newElements).forEach(key => {
            if (newElements[key].children) {
                newElements[key].children = newElements[key].children.filter((cid: string) => cid !== id);
            }
        });
        delete newElements[id];
        updateProject(newElements);
        setSelectedId(null);
    }, [elements, updateProject]);

    // --- HYBRID TEMPLATE INSTANTIATION (RUST + TS) ---
    const instantiateTemplate = useCallback((rootId: string, nodes: VectraProject): { newNodes: VectraProject; rootId: string } => {
        if (wasmModule) {
            try {
                const result = wasmModule.instantiate_template(nodes, rootId);
                return { newNodes: result.new_nodes, rootId: result.root_id };
            } catch (e) {
                console.error("Rust template failed, falling back to JS", e);
            }
        }
        return instantiateTemplateTS(rootId, nodes);
    }, []);

    // --- HYBRID INTERACTION ENGINE (RUST INTEGRATED) ---
    const handleInteractionMove = useCallback((e: PointerEvent) => {
        if (!interaction) return;
        const { type, itemId, startX, startY, startRect, handle } = interaction;

        const currentStartX = startX || 0;
        const currentStartY = startY || 0;
        const deltaX = (e.clientX - currentStartX) / zoom;
        const deltaY = (e.clientY - currentStartY) / zoom;
        const THRESHOLD = 5;

        let newRect = startRect ? { ...startRect } : { left: 0, top: 0, width: 0, height: 0 };
        let newGuides: Guide[] = [];

        if (type === 'MOVE') {
            const parentId = Object.keys(elements).find(k => elements[k].children?.includes(itemId));
            const parent = parentId ? elements[parentId] : null;
            const siblings = parentId ? elements[parentId].children || [] : [];

            const candidates = siblings
                .filter(id => id !== itemId)
                .map(id => {
                    const el = elements[id];
                    return {
                        id: id,
                        x: parseFloat(String(el.props.style?.left || 0)),
                        y: parseFloat(String(el.props.style?.top || 0)),
                        w: parseFloat(String(el.props.style?.width || 0)),
                        h: parseFloat(String(el.props.style?.height || 0)),
                    };
                });

            if (parent && (parent.type === 'canvas' || parent.type === 'webpage')) {
                candidates.push({
                    id: 'parent',
                    x: 0, y: 0,
                    w: parseFloat(String(parent.props.style?.width || 0)),
                    h: parseFloat(String(parent.props.style?.height || 0))
                });
            }

            const targetRect = {
                id: itemId,
                x: startRect?.left || 0,
                y: startRect?.top || 0,
                w: startRect?.width || 0,
                h: startRect?.height || 0
            };

            if (wasmModule) {
                const result = wasmModule.calculate_snapping(targetRect, candidates, deltaX, deltaY, THRESHOLD);
                newRect.left = result.x;
                newRect.top = result.y;
                newGuides = result.guides;
            } else {
                let proposedLeft = targetRect.x + deltaX;
                let proposedTop = targetRect.y + deltaY;
                let snappedX = false, snappedY = false;

                for (const sib of candidates) {
                    if (!snappedX) {
                        const xPoints = [sib.x, sib.x + sib.w / 2, sib.x + sib.w];
                        const myXPoints = [proposedLeft, proposedLeft + targetRect.w / 2, proposedLeft + targetRect.w];
                        for (const my of myXPoints) {
                            for (const s of xPoints) {
                                if (Math.abs(my - s) < THRESHOLD) {
                                    proposedLeft += s - my;
                                    snappedX = true;
                                    newGuides.push({ orientation: 'vertical', pos: s, start: Math.min(proposedTop, sib.y), end: Math.max(proposedTop + targetRect.h, sib.y + sib.h), type: 'align' });
                                    break;
                                }
                            }
                            if (snappedX) break;
                        }
                    }
                    if (!snappedY) {
                        const yPoints = [sib.y, sib.y + sib.h / 2, sib.y + sib.h];
                        const myYPoints = [proposedTop, proposedTop + targetRect.h / 2, proposedTop + targetRect.h];
                        for (const my of myYPoints) {
                            for (const s of yPoints) {
                                if (Math.abs(my - s) < THRESHOLD) {
                                    proposedTop += s - my;
                                    snappedY = true;
                                    newGuides.push({ orientation: 'horizontal', pos: s, start: Math.min(proposedLeft, sib.x), end: Math.max(proposedLeft + targetRect.w, sib.x + sib.w), type: 'align' });
                                    break;
                                }
                            }
                            if (snappedY) break;
                        }
                    }
                    if (snappedX && snappedY) break;
                }

                newRect.left = proposedLeft;
                newRect.top = proposedTop;
            }

        } else if (type === 'RESIZE' && handle && startRect) {
            if (handle.includes('e')) newRect.width = Math.max(20, startRect.width + deltaX);
            if (handle.includes('w')) { newRect.width = Math.max(20, startRect.width - deltaX); newRect.left = startRect.left + deltaX; }
            if (handle.includes('s')) newRect.height = Math.max(20, startRect.height + deltaY);
            if (handle.includes('n')) { newRect.height = Math.max(20, startRect.height - deltaY); newRect.top = startRect.top + deltaY; }
        }

        setGuides(newGuides);

        setElements(prev => {
            const currentElement = prev[itemId];
            if (!currentElement) return prev;

            const nextStyle: React.CSSProperties = {
                ...currentElement.props.style,
                position: 'absolute',
                left: `${newRect.left}px`,
                top: `${newRect.top}px`
            };

            if (type === 'RESIZE') {
                const cls = currentElement.props.className || '';
                if (!cls.includes('w-full')) nextStyle.width = `${newRect.width}px`;
                if (!cls.includes('h-full')) nextStyle.height = `${newRect.height}px`;
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
            history: { undo, redo }, runAction, viewMode, setViewMode,
            isInsertDrawerOpen, toggleInsertDrawer, activePanel, setActivePanel, togglePanel,
            componentRegistry, registerComponent, instantiateTemplate,
            recentComponents, addRecentComponent
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
