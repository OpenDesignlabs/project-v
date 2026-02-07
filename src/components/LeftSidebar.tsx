import { useRef, useState, Suspense, lazy } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import {
    Plus, Layers, File, Image as ImageIcon,
    Search, X, Type, Layout, FormInput, Puzzle, Upload,
    ChevronRight, Loader2, Clock, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { processImportedCode, generateComponentId } from '../utils/importHelpers';

const LayersPanel = lazy(() => import('./panels/LayersPanel').then(m => ({ default: m.LayersPanel })));

type DrawerTab = 'recent' | 'basic' | 'layout' | 'forms' | 'media' | 'templates';

const CATEGORIES: { id: DrawerTab; label: string; icon: any }[] = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'basic', label: 'Basic', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'forms', label: 'Forms', icon: FormInput },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'templates', label: 'Templates', icon: Puzzle },
];

// Mock Unsplash Data
const STOCK_PHOTOS = [
    { id: '1', url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=300&q=80', alt: 'Mountain' },
    { id: '2', url: 'https://images.unsplash.com/photo-1682687221038-404670e01d46?auto=format&fit=crop&w=300&q=80', alt: 'Ocean' },
    { id: '3', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=300&q=80', alt: 'Camera' },
    { id: '4', url: 'https://images.unsplash.com/photo-1518173946687-a4c88928d9fd?auto=format&fit=crop&w=300&q=80', alt: 'Forest' },
    { id: '5', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=300&q=80', alt: 'Abstract' },
    { id: '6', url: 'https://images.unsplash.com/photo-1454117096348-e4abbe58df0e?auto=format&fit=crop&w=300&q=80', alt: 'Work' },
];

export const LeftSidebar = () => {
    const {
        activePanel, setActivePanel, setDragData,
        previewMode, componentRegistry, registerComponent,
        recentComponents, addRecentComponent,
        pages, addPage, deletePage, switchPage, realPageId
    } = useEditor();

    const [activeCat, setActiveCat] = useState<DrawerTab>('basic');
    const [search, setSearch] = useState('');
    const [assetSearch, setAssetSearch] = useState('');
    const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (previewMode) return null;

    const togglePanel = (panel: typeof activePanel) => {
        setActivePanel((prev: typeof activePanel) => prev === panel ? null : panel);
    };

    // --- COMPONENT FILTERING ---
    const filteredComponents = activeCat === 'recent'
        ? recentComponents.map(id => [id, componentRegistry[id]]).filter(x => x[1]) as [string, any][]
        : activeCat !== 'templates'
            ? Object.entries(componentRegistry)
                .filter(([_type, config]) => {
                    const configAny = config as any;
                    const matchesSearch = configAny.label.toLowerCase().includes(search.toLowerCase());
                    const matchesCategory = search ? true : configAny.category === activeCat;
                    return matchesSearch && matchesCategory;
                })
            : [];

    const filteredTemplates = activeCat === 'templates' || search
        ? Object.entries(TEMPLATES)
            .filter(([, tpl]) => {
                const tplAny = tpl as any;
                if (!search) return activeCat === 'templates';
                return tplAny.name.toLowerCase().includes(search.toLowerCase());
            })
        : [];

    const searchUnsplash = async (query: string) => {
        if (!query.trim()) {
            setUnsplashImages([]);
            return;
        }

        setIsLoadingAssets(true);
        try {
            // Use key from .env (Vite)
            const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';

            const response = await fetch(
                `https://api.unsplash.com/search/photos?page=1&query=${query}&per_page=20&client_id=${ACCESS_KEY}`
            );

            const data = await response.json();

            if (data.results) {
                const mappedImages = data.results.map((img: any) => ({
                    id: img.id,
                    url: img.urls.small,
                    alt: img.alt_description || 'Unsplash Image'
                }));
                setUnsplashImages(mappedImages);
            }
        } catch (error) {
            console.error("Unsplash API Error:", error);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    const displayAssets = unsplashImages.length > 0
        ? unsplashImages
        : STOCK_PHOTOS.filter(p => p.alt.toLowerCase().includes(assetSearch.toLowerCase()));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const config = processImportedCode(content, file.name);
            const newId = generateComponentId(config.label);
            registerComponent(newId, config);
        };
        reader.readAsText(file);
    };

    return (
        <div className="w-[60px] h-full flex flex-col border-r border-[#3f3f46] bg-[#333333] relative z-50">
            {/* MAIN RAIL */}
            <div className="flex flex-col items-center py-4 gap-4 h-full bg-[#333333] z-50 relative">
                <NavButton icon={Plus} active={activePanel === 'add'} onClick={() => togglePanel('add')} tooltip="Insert" />
                <div className="w-8 h-[1px] bg-[#4f4f4f] my-1" />
                <NavButton icon={Layers} active={activePanel === 'layers'} onClick={() => togglePanel('layers')} tooltip="Layers" />
                <NavButton icon={ImageIcon} active={activePanel === 'assets'} onClick={() => togglePanel('assets')} tooltip="Assets" />
                <NavButton icon={File} active={activePanel === 'pages'} onClick={() => togglePanel('pages')} tooltip="Pages" />
            </div>

            {/* --- 1. INSERT DRAWER --- */}
            {activePanel === 'add' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[420px] bg-[#252526] border-r border-[#3f3f46] shadow-2xl z-40 flex text-[#cccccc]">
                    {/* Categories */}
                    <div className="w-16 bg-[#2d2d2d] border-r border-[#3f3f46] flex flex-col items-center py-4 gap-1 overflow-y-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                                className={cn(
                                    "p-2 rounded-lg transition-all flex flex-col items-center gap-1 w-14 group",
                                    activeCat === cat.id ? "bg-[#37373d] text-white border border-[#3e3e42] shadow-sm" : "text-[#999999] hover:text-white hover:bg-[#333333]"
                                )}
                            >
                                <cat.icon size={18} strokeWidth={activeCat === cat.id ? 2 : 1.5} />
                                <span className="text-[9px] font-semibold leading-tight text-center">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#252526]">
                        {/* Search */}
                        <div className="px-4 py-3 border-b border-[#3f3f46] bg-[#2d2d2d]">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-2.5 text-[#999999]" />
                                <input
                                    type="text" placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 bg-[#3c3c3c] border border-transparent rounded text-xs text-white placeholder-[#999999] outline-none focus:ring-1 focus:ring-[#007acc]"
                                    value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {/* Empty Recent State */}
                            {activeCat === 'recent' && filteredComponents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Clock size={32} className="text-[#555] mb-3" />
                                    <div className="text-sm text-[#888] mb-1">No recent components</div>
                                    <div className="text-xs text-[#555]">Components you use will appear here</div>
                                </div>
                            )}

                            {/* Components Grid */}
                            {filteredComponents.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {filteredComponents.map(([type, config]) => (
                                        <div
                                            key={type}
                                            draggable
                                            onDragStart={(e) => {
                                                // --- FIX: ENABLE NATIVE DRAG ---
                                                e.dataTransfer.setData('text/plain', type);
                                                e.dataTransfer.effectAllowed = 'copy';

                                                setDragData({ type: 'NEW', payload: type });
                                                addRecentComponent(type);
                                            }}
                                            className="group flex flex-col items-center justify-center p-3 bg-[#2d2d2d] border border-[#3e3e42] rounded-lg cursor-grab hover:border-[#007acc] hover:bg-[#323236] text-center shadow-sm"
                                        >
                                            <div className="w-9 h-9 flex items-center justify-center bg-[#38383e] border border-[#45454a] rounded mb-2 text-[#cccccc] group-hover:text-white">
                                                {config.icon && <config.icon size={18} strokeWidth={1.5} />}
                                            </div>
                                            <span className="text-[11px] font-medium text-[#bbbbbb] group-hover:text-white">{config.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Grouped Templates (Sub-sections) */}
                            {activeCat === 'templates' && (() => {
                                const templateGroups = filteredTemplates.reduce((acc, [key, tpl]) => {
                                    const cat = (tpl as any).category || 'Other';
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push({ key, ...tpl } as any);
                                    return acc;
                                }, {} as Record<string, any[]>);

                                const sortedCategories = Object.keys(templateGroups).sort();

                                return (
                                    <div className="flex flex-col gap-6">
                                        {sortedCategories.map(cat => (
                                            <div key={cat} className="animate-in slide-in-from-left-2 duration-300">
                                                <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-2 px-1 flex items-center justify-between group/cat">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1 h-3 rounded-full bg-[#007acc]" />
                                                        {cat}
                                                    </div>
                                                </h3>
                                                <div className="flex flex-col gap-2">
                                                    {templateGroups[cat].map((tpl) => (
                                                        <div key={tpl.key} className="group/item relative">
                                                            <div
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData('text/plain', tpl.key);
                                                                    e.dataTransfer.effectAllowed = 'copy';
                                                                    setDragData({ type: 'TEMPLATE', payload: tpl.key });
                                                                }}
                                                                className="flex items-center gap-3 p-3 bg-[#2d2d2d] border border-[#3e3e42] rounded-lg cursor-grab hover:border-[#007acc] hover:bg-[#323236] transition-all"
                                                            >
                                                                <div className="w-10 h-10 rounded bg-[#38383e] flex items-center justify-center text-[#cccccc]">
                                                                    {tpl.icon && <tpl.icon size={18} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-semibold text-[#cccccc] truncate">{tpl.name}</div>
                                                                </div>
                                                                <ChevronRight size={16} className="text-[#666] opacity-0 group-hover/item:opacity-100" />
                                                            </div>

                                                            {/* Preview Tooltip */}
                                                            <div className="absolute left-[105%] top-0 w-[240px] bg-[#252526] border border-[#3f3f46] rounded-xl shadow-2xl p-3 z-50 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity duration-200">
                                                                <div className="w-full aspect-video bg-[#1e1e1e] rounded-md mb-2 flex items-center justify-center text-[#444] border border-[#333]">
                                                                    {tpl.icon && <tpl.icon size={48} strokeWidth={1} />}
                                                                </div>
                                                                <div className="text-xs font-bold text-white mb-1">{tpl.name}</div>
                                                                <div className="text-[10px] text-[#888] leading-tight">Drag this pre-configured {cat.toLowerCase()} section.</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {sortedCategories.length === 0 && (
                                            <div className="text-center py-12 text-[#666] text-xs">No templates matches your search.</div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-3 border-t border-[#3f3f46] bg-[#222222]">
                            <label className="flex items-center justify-center gap-2 text-xs text-[#007acc] cursor-pointer hover:bg-[#007acc]/10 rounded py-2 border border-dashed border-[#007acc]/30">
                                <Upload size={14} /> <span>Import Component</span>
                                <input ref={fileInputRef} type="file" accept=".tsx,.jsx,.js" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. RICH ASSETS PANEL --- */}
            {activePanel === 'assets' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[300px] bg-[#252526] border-r border-[#3f3f46] shadow-xl z-40 flex flex-col">
                    <div className="p-4 border-b border-[#3f3f46] flex items-center justify-between">
                        <h2 className="font-bold text-[#cccccc] text-xs uppercase tracking-wide">Assets</h2>
                        <button onClick={() => setActivePanel(null)} className="text-[#999] hover:text-white"><X size={16} /></button>
                    </div>
                    <div className="p-3 border-b border-[#3f3f46] bg-[#2d2d2d]">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-[#999999]" />
                            <input
                                type="text" placeholder="Search Unsplash (Enter)..."
                                className="w-full pl-9 pr-3 py-2 bg-[#3c3c3c] border border-transparent rounded text-xs text-white placeholder-[#999999] outline-none focus:ring-1 focus:ring-[#007acc]"
                                value={assetSearch}
                                onChange={(e) => setAssetSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(assetSearch)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {isLoadingAssets ? (
                            <div className="flex items-center justify-center h-20 text-[#666] text-xs">
                                <Loader2 className="animate-spin mr-2" size={16} /> Fetching...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {displayAssets.map(photo => (
                                    <div
                                        key={photo.id}
                                        draggable
                                        onDragStart={(e) => {
                                            // --- FIX: ENABLE NATIVE DRAG ---
                                            e.dataTransfer.setData('text/plain', photo.url);
                                            e.dataTransfer.effectAllowed = 'copy';
                                            setDragData({ type: 'ASSET_IMAGE', payload: photo.url });
                                        }}
                                        className="group relative aspect-square rounded overflow-hidden cursor-grab hover:ring-2 hover:ring-[#007acc] bg-[#1e1e1e]"
                                    >
                                        <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-[8px] text-white opacity-0 group-hover:opacity-100 truncate px-2">
                                            {photo.alt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {displayAssets.length === 0 && !isLoadingAssets && (
                            <div className="mt-8 text-center text-[#666] text-xs">
                                No images found.
                            </div>
                        )}

                        <div className="mt-4 text-[10px] text-center text-[#666]">
                            Powered by Unsplash API
                        </div>
                    </div>
                </div>
            )}

            {/* LAYERS PANEL */}
            {activePanel === 'layers' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[300px] bg-[#252526] border-r border-[#3f3f46] shadow-xl z-40 flex flex-col">
                    <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin text-[#666]" /></div>}>
                        <LayersPanel />
                    </Suspense>
                </div>
            )}

            {/* PAGES PANEL */}
            {activePanel === 'pages' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[300px] bg-[#252526] border-r border-[#3f3f46] shadow-xl z-40 flex flex-col">
                    <div className="p-4 border-b border-[#3f3f46] flex items-center justify-between">
                        <h2 className="font-bold text-[#cccccc] text-xs uppercase tracking-wide">Pages</h2>
                        <button
                            onClick={() => {
                                const name = prompt("Page Name:", "About");
                                if (name) addPage(name, `/${name.toLowerCase().replace(/\s+/g, '-')}`);
                            }}
                            className="text-white hover:bg-[#007acc] p-1.5 rounded transition-colors"
                            title="Add Page"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {pages.map(page => (
                            <div
                                key={page.id}
                                onClick={() => switchPage(page.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 cursor-pointer border-b border-[#333] hover:bg-[#2a2d2e] transition-colors",
                                    realPageId === page.id ? "bg-[#37373d] border-l-2 border-l-[#007acc]" : ""
                                )}
                            >
                                <File size={14} className="text-[#999] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white truncate">{page.name}</div>
                                    <div className="text-[10px] text-[#666]">{page.slug}</div>
                                </div>
                                {pages.length > 1 && page.id !== 'page-home' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete page "${page.name}"?`)) deletePage(page.id);
                                        }}
                                        className="text-[#666] hover:text-red-500 transition-colors p-1"
                                        title="Delete Page"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-[#3f3f46] text-[10px] text-[#666] text-center">
                        {pages.length} page{pages.length !== 1 ? 's' : ''}
                    </div>
                </div>
            )}
        </div>
    );
};

const NavButton = ({ icon: Icon, active, onClick, tooltip }: { icon: any; active: boolean; onClick: () => void; tooltip: string }) => (
    <button onClick={onClick} className={cn("w-10 h-10 rounded flex items-center justify-center transition-all duration-100 relative group", active ? "text-white opacity-100 border-l-2 border-[#007acc] bg-[#252526]" : "text-[#999999] opacity-70 hover:opacity-100 hover:text-white")}>
        <Icon size={22} strokeWidth={1.5} />
        {tooltip && <span className="absolute left-full ml-3 px-2 py-1 bg-[#252526] text-white text-[10px] rounded border border-[#3f3f46] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] shadow-md">{tooltip}</span>}
    </button>
);
