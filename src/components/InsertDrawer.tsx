import { useState, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { X, Search, Type, FormInput, Image, Layout, CreditCard, Puzzle, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { processImportedCode, generateComponentId } from '../utils/importHelpers';
import type { ComponentCategory } from '../types';

type DrawerTab = ComponentCategory | 'templates';

const CATEGORIES: { id: DrawerTab; label: string; icon: typeof Type }[] = [
    { id: 'basic', label: 'Basic', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'forms', label: 'Forms', icon: FormInput },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'sections', label: 'Sections', icon: CreditCard },
    { id: 'templates', label: 'Templates', icon: Puzzle },
];

// Components to hide from the insert menu (artboards)
const HIDDEN_TYPES = ['canvas', 'webpage'];

export const InsertDrawer = () => {
    const { isInsertDrawerOpen, toggleInsertDrawer, setDragData, componentRegistry, registerComponent } = useEditor();
    const [activeCat, setActiveCat] = useState<DrawerTab>('basic');
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isInsertDrawerOpen) return null;

    // Filter Components - now uses dynamic registry
    const filteredComponents = activeCat !== 'templates'
        ? Object.entries(componentRegistry)
            .filter(([type]) => !HIDDEN_TYPES.includes(type))
            .filter(([, config]) => {
                const matchesSearch = config.label.toLowerCase().includes(search.toLowerCase());
                const matchesCategory = search ? true : config.category === activeCat;
                return matchesSearch && matchesCategory;
            })
        : [];

    // Filter Templates
    const filteredTemplates = activeCat === 'templates' || search
        ? Object.entries(TEMPLATES)
            .filter(([, tpl]) => {
                if (!search) return activeCat === 'templates';
                return tpl.name.toLowerCase().includes(search.toLowerCase());
            })
        : [];

    const handleDragStartComponent = (_e: React.DragEvent, type: string) => {
        setDragData({ type: 'NEW', payload: type });
    };

    const handleDragStartTemplate = (_e: React.DragEvent, templateKey: string) => {
        setDragData({ type: 'TEMPLATE', payload: templateKey });
    };

    const hasResults = filteredComponents.length > 0 || filteredTemplates.length > 0;

    // Handle file import
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const config = processImportedCode(content, file.name);
            const newId = generateComponentId(config.label);
            registerComponent(newId, config);
            alert(`✅ Imported "${file.name}"!\n\nYou can now find it in the Basic category.`);
        };
        reader.readAsText(file);

        // Reset input so same file can be imported again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed top-12 left-14 bottom-0 w-[400px] bg-white shadow-2xl z-[100] flex border-r border-slate-200 animate-in slide-in-from-left-5 duration-200">

            {/* 1. Category Rail (Left Strip) */}
            <div className="w-14 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-3 gap-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveCat(cat.id); setSearch(''); }}
                        className={cn(
                            "p-2 rounded-lg transition-all flex flex-col items-center gap-0.5 w-12",
                            activeCat === cat.id && !search ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        )}
                        title={cat.label}
                    >
                        <cat.icon size={16} strokeWidth={1.5} />
                        <span className="text-[8px] font-medium leading-tight">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* 2. Main Content (Right Panel) */}
            <div className="flex-1 flex flex-col bg-white">

                {/* Header & Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-sm text-slate-800">
                            {search ? 'Search Results' : CATEGORIES.find(c => c.id === activeCat)?.label}
                        </h2>
                        <button onClick={toggleInsertDrawer} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500 transition-all"
                            placeholder="Search components & templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                    {/* Components Section */}
                    {filteredComponents.length > 0 && (
                        <>
                            {search && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Components</div>}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {filteredComponents.map(([type, config]) => (
                                    <div
                                        key={type}
                                        draggable
                                        onDragStart={(e) => handleDragStartComponent(e, type)}
                                        className="group flex flex-col items-start gap-2 p-3 rounded-lg border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing bg-slate-50/50 hover:bg-white"
                                    >
                                        <div className="p-2 bg-white rounded-md border border-slate-200 group-hover:border-blue-200 text-slate-500 group-hover:text-blue-600 transition-colors">
                                            <config.icon size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">{config.label}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Drag to insert</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Templates Section */}
                    {filteredTemplates.length > 0 && (
                        <>
                            {search && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Templates</div>}
                            <div className="grid grid-cols-1 gap-3">
                                {filteredTemplates.map(([key, tpl]) => (
                                    <div
                                        key={key}
                                        draggable
                                        onDragStart={(e) => handleDragStartTemplate(e, key)}
                                        className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing bg-slate-50/50 hover:bg-white"
                                    >
                                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                                            <tpl.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{tpl.name}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{tpl.category} • Drag to insert</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!hasResults && (
                        <div className="text-center py-10 text-slate-400 text-xs">
                            No components found.
                        </div>
                    )}
                </div>

                {/* Import Component Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                    <label className="flex items-center justify-center gap-2 text-xs text-blue-600 cursor-pointer hover:text-blue-700 hover:bg-blue-50 rounded-lg py-2 transition-colors">
                        <Upload size={14} />
                        <span className="font-medium">Import React Component</span>
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
    );
};
