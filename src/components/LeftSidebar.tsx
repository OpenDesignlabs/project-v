import { useRef, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import {
    Plus, Layers, File, Image as ImageIcon, Settings,
    Search, X, Type, Layout, FormInput, CreditCard, Puzzle, Upload, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { processImportedCode, generateComponentId } from '../utils/importHelpers';

type DrawerTab = 'basic' | 'layout' | 'forms' | 'media' | 'sections' | 'templates';

const CATEGORIES: { id: DrawerTab; label: string; icon: typeof Type }[] = [
    { id: 'basic', label: 'Basic', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'forms', label: 'Forms', icon: FormInput },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'sections', label: 'Sections', icon: CreditCard },
    { id: 'templates', label: 'Templates', icon: Puzzle },
];

const HIDDEN_TYPES = ['canvas', 'webpage'];

export const LeftSidebar = () => {
    const {
        activePanel, setActivePanel, setDragData,
        previewMode, componentRegistry, registerComponent
    } = useEditor();

    const [activeCat, setActiveCat] = useState<DrawerTab>('basic');
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (previewMode) return null;

    const togglePanel = (panel: typeof activePanel) => {
        setActivePanel((prev: typeof activePanel) => prev === panel ? null : panel);
    };

    // Filter Logic
    const filteredComponents = activeCat !== 'templates'
        ? Object.entries(componentRegistry)
            .filter(([type]) => !HIDDEN_TYPES.includes(type))
            .filter(([, config]) => {
                const matchesSearch = config.label.toLowerCase().includes(search.toLowerCase());
                const matchesCategory = search ? true : config.category === activeCat;
                return matchesSearch && matchesCategory;
            })
        : [];

    const filteredTemplates = activeCat === 'templates' || search
        ? Object.entries(TEMPLATES)
            .filter(([, tpl]) => {
                if (!search) return activeCat === 'templates';
                return tpl.name.toLowerCase().includes(search.toLowerCase());
            })
        : [];

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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        // ROOT: Dark Sidebar Background
        <div className="w-[60px] h-full flex flex-col border-r border-[#3f3f46] bg-[#333333] relative z-50">

            {/* 1. THE MAIN RAIL (Activity Bar Style) */}
            <div className="flex flex-col items-center py-4 gap-4 h-full bg-[#333333] z-50 relative">
                <NavButton
                    icon={Plus}
                    active={activePanel === 'add'}
                    onClick={() => togglePanel('add')}
                    tooltip="Insert Elements"
                />
                <div className="w-8 h-[1px] bg-[#4f4f4f] my-1" />
                <NavButton icon={Layers} active={activePanel === 'layers'} onClick={() => togglePanel('layers')} tooltip="Layers" />
                <NavButton icon={File} active={activePanel === 'pages'} onClick={() => togglePanel('pages')} tooltip="Pages" />
                <NavButton icon={ImageIcon} active={activePanel === 'assets'} onClick={() => togglePanel('assets')} tooltip="Assets" />

                <div className="mt-auto">
                    <NavButton icon={Settings} active={activePanel === 'settings'} onClick={() => togglePanel('settings')} tooltip="Settings" />
                </div>
            </div>

            {/* 2. THE DRAWER (Floating Multi-Layered Overlay) */}
            {activePanel === 'add' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[420px] bg-[#252526] border-r border-[#3f3f46] shadow-2xl z-40 flex text-[#cccccc]">

                    {/* A. Sub-Category Rail (Left Strip of Drawer) */}
                    <div className="w-16 bg-[#2d2d2d] border-r border-[#3f3f46] flex flex-col items-center py-4 gap-1 overflow-y-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                                className={cn(
                                    "p-2 rounded-lg transition-all flex flex-col items-center gap-1 w-14 group",
                                    activeCat === cat.id && !search ? "bg-[#37373d] text-white border border-[#3e3e42] shadow-sm" : "text-[#999999] hover:text-white hover:bg-[#333333]"
                                )}
                            >
                                <cat.icon size={18} strokeWidth={activeCat === cat.id ? 2 : 1.5} />
                                <span className="text-[9px] font-semibold leading-tight">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* B. Content Panel (Right Side of Drawer) */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#252526]">
                        {/* Header */}
                        <div className="p-4 border-b border-[#3f3f46] flex items-center justify-between">
                            <h2 className="font-bold text-[#cccccc] text-xs uppercase tracking-wide">
                                {search ? 'Search Results' : CATEGORIES.find(c => c.id === activeCat)?.label}
                            </h2>
                            <button onClick={() => setActivePanel(null)} className="text-[#999999] hover:text-white transition-colors p-1 rounded hover:bg-[#37373d]">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="px-4 py-3 border-b border-[#3f3f46] bg-[#2d2d2d]">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-2.5 text-[#999999]" />
                                <input
                                    type="text"
                                    placeholder="Search components..."
                                    className="w-full pl-9 pr-3 py-2 bg-[#3c3c3c] border border-transparent rounded-sm text-xs text-white placeholder-[#999999] outline-none focus:ring-1 focus:ring-[#007acc] transition-all font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                            {/* Component Grid */}
                            {filteredComponents.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {filteredComponents.map(([type, config]) => (
                                        <div
                                            key={type}
                                            draggable
                                            onDragStart={() => setDragData({ type: 'NEW', payload: type })}
                                            className="group flex flex-col items-center justify-center p-4 bg-[#2d2d2d] border border-[#3e3e42] rounded-md cursor-grab hover:border-[#007acc] hover:bg-[#37373d] transition-all active:cursor-grabbing text-center"
                                        >
                                            <div className="w-10 h-10 flex items-center justify-center bg-[#333333] border border-[#3f3f46] rounded mb-3 text-[#cccccc] group-hover:text-white transition-colors">
                                                {config.icon && <config.icon size={20} strokeWidth={1.5} />}
                                            </div>
                                            <span className="text-[11px] font-medium text-[#cccccc] group-hover:text-white transition-colors">
                                                {config.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Template List */}
                            {filteredTemplates.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {filteredTemplates.map(([key, tpl]) => (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={() => setDragData({ type: 'TEMPLATE', payload: key })}
                                            className="group flex items-center gap-4 p-3 bg-[#2d2d2d] border border-[#3e3e42] rounded-md cursor-grab hover:border-[#007acc] hover:bg-[#37373d] transition-all active:cursor-grabbing"
                                        >
                                            <div className="w-12 h-12 rounded bg-[#333333] border border-[#3f3f46] flex items-center justify-center text-[#cccccc] group-hover:text-white shrink-0">
                                                {tpl.icon && <tpl.icon size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[#cccccc] group-hover:text-white truncate">{tpl.name}</div>
                                                <div className="text-[10px] text-[#999999]">{tpl.category}</div>
                                            </div>
                                            <ChevronRight size={16} className="text-[#666666] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredComponents.length === 0 && filteredTemplates.length === 0 && (
                                <div className="text-center py-20 text-[#666666]">
                                    <Search size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xs">No results found for "{search}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (Import Component) */}
                        <div className="p-3 border-t border-[#3f3f46] bg-[#222222]">
                            <label className="flex items-center justify-center gap-2 text-xs text-[#007acc] cursor-pointer hover:text-white hover:bg-[#007acc]/20 rounded py-2 transition-all font-bold border border-transparent hover:border-[#007acc]/50">
                                <Upload size={14} />
                                <span>Import React Component</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".tsx,.jsx,.js"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Placeholder for other panels (Layers etc) */}
            {activePanel && activePanel !== 'add' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[300px] bg-[#252526] border-r border-[#3f3f46] shadow-xl z-40 p-6 flex flex-col text-[#cccccc]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold capitalize text-[#cccccc]">{activePanel}</h2>
                        <button onClick={() => setActivePanel(null)} className="text-[#999999] hover:text-white"><X size={16} /></button>
                    </div>
                    <p className="text-sm text-[#999999]">Panel content goes here.</p>
                </div>
            )}
        </div>
    );
};

// Helper for Rail Buttons (Dark Mode)
const NavButton = ({ icon: Icon, active, onClick, tooltip }: {
    icon: any;
    active: boolean;
    onClick: () => void;
    tooltip?: string;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-10 h-10 rounded flex items-center justify-center transition-all duration-100 relative group",
            active
                ? "text-white opacity-100 border-l-2 border-[#007acc] bg-[#252526]" // Active
                : "text-[#999999] opacity-70 hover:opacity-100 hover:text-white"
        )}
    >
        <Icon size={22} strokeWidth={1.5} />
        {/* Tooltip on Hover */}
        {tooltip && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-[#252526] text-white text-[10px] rounded border border-[#3f3f46] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] shadow-md">
                {tooltip}
            </span>
        )}
    </button>
);
