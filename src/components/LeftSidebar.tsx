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
        <div className="w-[60px] h-full flex flex-col border-r border-slate-200 bg-white relative z-50">

            {/* 1. THE MAIN RAIL (Static Icons) */}
            <div className="flex flex-col items-center py-4 gap-4 h-full bg-white z-50 relative">
                <NavButton
                    icon={Plus}
                    active={activePanel === 'add'}
                    onClick={() => togglePanel('add')}
                    color="blue"
                    tooltip="Insert Elements"
                />
                <div className="w-8 h-[1px] bg-slate-200 my-1" />
                <NavButton icon={Layers} active={activePanel === 'layers'} onClick={() => togglePanel('layers')} tooltip="Layers" />
                <NavButton icon={File} active={activePanel === 'pages'} onClick={() => togglePanel('pages')} tooltip="Pages" />
                <NavButton icon={ImageIcon} active={activePanel === 'assets'} onClick={() => togglePanel('assets')} tooltip="Assets" />

                <div className="mt-auto">
                    <NavButton icon={Settings} active={activePanel === 'settings'} onClick={() => togglePanel('settings')} tooltip="Settings" />
                </div>
            </div>

            {/* 2. THE DRAWER (Floating Multi-Layered Overlay) */}
            {activePanel === 'add' && (
                <div className="absolute left-[60px] top-0 bottom-0 w-[420px] bg-white border-r border-slate-200 shadow-2xl animate-in slide-in-from-left-2 duration-200 z-40 flex">

                    {/* A. Sub-Category Rail (Left Strip of Drawer) - Matching Image 1 */}
                    <div className="w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-4 gap-1 overflow-y-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                                className={cn(
                                    "p-2 rounded-xl transition-all flex flex-col items-center gap-1 w-14 group",
                                    activeCat === cat.id && !search ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                )}
                            >
                                <cat.icon size={18} strokeWidth={activeCat === cat.id ? 2 : 1.5} />
                                <span className="text-[9px] font-semibold leading-tight">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* B. Content Panel (Right Side of Drawer) */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 text-sm">
                                {search ? 'Search Results' : CATEGORIES.find(c => c.id === activeCat)?.label}
                            </h2>
                            <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search components & templates..."
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                            {/* Component Grid (Matches Image 2 Style) */}
                            {filteredComponents.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {filteredComponents.map(([type, config]) => (
                                        <div
                                            key={type}
                                            draggable
                                            onDragStart={() => setDragData({ type: 'NEW', payload: type })}
                                            className="group flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-blue-500 hover:shadow-lg transition-all active:cursor-grabbing text-center"
                                        >
                                            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl mb-3 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                                {config.icon && <config.icon size={26} strokeWidth={1.5} />}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                                                {config.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Template List (Matches Image 1 Style) */}
                            {filteredTemplates.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {filteredTemplates.map(([key, tpl]) => (
                                        <div
                                            key={key}
                                            draggable
                                            onDragStart={() => setDragData({ type: 'TEMPLATE', payload: key })}
                                            className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-grab hover:border-blue-500 hover:shadow-xl transition-all active:cursor-grabbing"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                                                {tpl.icon && <tpl.icon size={26} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-bold text-slate-800 group-hover:text-blue-700 truncate">{tpl.name}</div>
                                                <div className="text-[11px] text-slate-400 font-medium">{tpl.category} • Drag to insert</div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredComponents.length === 0 && filteredTemplates.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <Search size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm">No results found for "{search}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer (Import Component) - Matching Image 1/2 */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <label className="flex items-center justify-center gap-2 text-xs text-blue-600 cursor-pointer hover:text-blue-700 hover:bg-blue-50 rounded-xl py-2.5 transition-all font-bold border border-transparent hover:border-blue-100">
                                <Upload size={16} />
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
                <div className="absolute left-[60px] top-0 bottom-0 w-[300px] bg-white border-r border-slate-200 shadow-xl z-40 p-6 flex flex-col animate-in slide-in-from-left-2 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold capitalize text-slate-800">{activePanel}</h2>
                        <button onClick={() => setActivePanel(null)}><X size={16} /></button>
                    </div>
                    <p className="text-sm text-slate-500">Panel content goes here.</p>
                </div>
            )}
        </div>
    );
};

// Helper for Rail Buttons
const NavButton = ({ icon: Icon, active, onClick, color = 'slate', tooltip }: {
    icon: any;
    active: boolean;
    onClick: () => void;
    color?: 'slate' | 'blue';
    tooltip?: string;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group",
            active
                ? (color === 'blue' ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-2 ring-blue-100" : "bg-slate-100 text-slate-900")
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        )}
    >
        <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
        {/* Tooltip on Hover */}
        {tooltip && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] shadow-md font-bold">
                {tooltip}
            </span>
        )}
    </button>
);
