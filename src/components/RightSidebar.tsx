import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import {
    Trash2, Lock, Eye, Layout, MousePointerClick,
    Settings, Palette, Smartphone, Box,
    AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    ArrowRight, ArrowDown, Maximize2, Minimize2, Move, Globe, Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getAvailableIconNames } from '../data/iconRegistry';
import { COMPONENT_TYPES } from '../data/constants';

export const RightSidebar = () => {
    const { elements, selectedId, updateProject, deleteElement, previewMode, globalStyles, setGlobalStyles, setDragData, activePageId } = useEditor();
    const [activeTab, setActiveTab] = useState<'design' | 'props' | 'actions'>('design');
    const selectedElement = selectedId ? elements[selectedId] : null;

    if (previewMode) return null;

    // --- HELPERS ---
    const getClassValue = (prefix: string): string => {
        if (!selectedElement?.props.className) return '';
        const classes = selectedElement.props.className.split(' ');
        const found = classes.find(c => c.startsWith(prefix) && c !== prefix);
        if (found) return found.replace(prefix, '');
        return '';
    };

    const updateClass = (prefix: string, value: string) => {
        if (!selectedId || !selectedElement) return;
        let classList = (selectedElement.props.className || '').split(' ').filter(c => c.trim() && (!c.startsWith(prefix) || c === prefix));
        if (value && value !== '0') classList.push(`${prefix}${value}`);
        const newElements = { ...elements };
        newElements[selectedId] = { ...selectedElement, props: { ...selectedElement.props, className: classList.join(' ').trim() } };
        updateProject(newElements);
    };

    const hasClass = (cls: string) => (selectedElement?.props.className || '').includes(cls);

    const handlePropChange = (key: string, value: any) => {
        if (!selectedId || !selectedElement) return;
        const newElements = { ...elements };
        const newNode = { ...newElements[selectedId] };
        if (['content', 'src', 'locked', 'hidden'].includes(key)) (newNode as any)[key] = value;
        else newNode.props = { ...newNode.props, [key]: value };
        newElements[selectedId] = newNode;
        updateProject(newElements);
    };

    const handleDragStart = (_e: React.DragEvent, type: string, payload: string) => {
        setDragData({ type: type as any, payload });
    };

    // --- Get all pages for action dropdown ---
    const allPages = elements['application-root']?.children?.map(pageId => ({
        id: pageId,
        name: elements[pageId]?.name || pageId
    })) || [];

    // --- GLOBAL SETTINGS ---
    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 h-full p-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Settings size={16} /> Global Settings
                    </div>
                </div>
                <div className="p-5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette size={12} /> Theme Colors
                    </label>
                    <div className="space-y-3">
                        {Object.entries(globalStyles.colors).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded border border-slate-200 shadow-sm" style={{ backgroundColor: value }} />
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-slate-700 capitalize">{key}</div>
                                    <input type="text" value={value} onChange={(e) => setGlobalStyles(prev => ({ ...prev, colors: { ...prev.colors, [key]: e.target.value } }))} className="w-full text-[10px] text-slate-500 bg-transparent outline-none border-b border-transparent focus:border-blue-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Box size={12} /> Add Component</label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(COMPONENT_TYPES).filter(([k]) => !['canvas', 'webpage'].includes(k)).map(([type, config]) => (
                            <div key={type} draggable onDragStart={(e) => handleDragStart(e, 'NEW', type)} className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all">
                                <config.icon size={16} className="text-slate-500 mb-1" /><span className="text-[9px] font-medium text-slate-600 truncate w-full text-center">{config.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- ELEMENT SETTINGS ---
    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                    <div className="font-bold text-sm text-slate-900 truncate max-w-[150px]">{selectedElement.name}</div>
                    <div className="text-[10px] text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">{selectedElement.type}</div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => handlePropChange('locked', !selectedElement.locked)} className={cn("p-1.5 rounded transition-colors", selectedElement.locked ? "bg-amber-100 text-amber-600" : "hover:bg-slate-200 text-slate-400")}><Lock size={14} /></button>
                    <button onClick={() => handlePropChange('hidden', !selectedElement.hidden)} className={cn("p-1.5 rounded transition-colors", selectedElement.hidden ? "bg-purple-100 text-purple-600" : "hover:bg-slate-200 text-slate-400")}><Eye size={14} /></button>
                    <button onClick={() => deleteElement(selectedId!)} className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                <button onClick={() => setActiveTab('design')} className={cn("flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5", activeTab === 'design' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}><Layout size={14} /> Design</button>
                <button onClick={() => setActiveTab('props')} className={cn("flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5", activeTab === 'props' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}><Settings size={14} /> Props</button>
                <button onClick={() => setActiveTab('actions')} className={cn("flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5", activeTab === 'actions' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}><MousePointerClick size={14} /> Logic</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                {/* --- TAB: DESIGN --- */}
                {activeTab === 'design' && (
                    <>
                        {/* Layout Controls */}
                        {['container', 'canvas', 'webpage', 'page'].includes(selectedElement.type) && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Layout</label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button onClick={() => handlePropChange('layoutMode', 'canvas')} className={cn("px-3 py-1 text-[10px] font-medium rounded-md transition-all", (!selectedElement.props.layoutMode || selectedElement.props.layoutMode === 'canvas') ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700")}>Free</button>
                                        <button onClick={() => handlePropChange('layoutMode', 'flex')} className={cn("px-3 py-1 text-[10px] font-medium rounded-md transition-all", selectedElement.props.layoutMode === 'flex' ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700")}>Auto</button>
                                    </div>
                                </div>

                                {selectedElement.props.layoutMode === 'flex' && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 bg-white border border-slate-200 rounded p-0.5">
                                                <button onClick={() => updateClass('flex-', 'row')} className={cn("p-1.5 rounded", hasClass('flex-row') ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="Row"><ArrowRight size={14} /></button>
                                                <button onClick={() => updateClass('flex-', 'col')} className={cn("p-1.5 rounded", hasClass('flex-col') ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600")} title="Column"><ArrowDown size={14} /></button>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1">
                                                <span className="text-[10px] text-slate-400 font-medium">Gap</span>
                                                <input className="w-8 text-xs text-right outline-none text-slate-700 bg-transparent" value={getClassValue('gap-')} onChange={(e) => updateClass('gap-', e.target.value)} placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button onClick={() => updateClass('justify-', 'start')} className={cn("p-1.5 border rounded transition-all", hasClass('justify-start') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignVerticalJustifyStart size={14} className="mx-auto" /></button>
                                            <button onClick={() => updateClass('justify-', 'center')} className={cn("p-1.5 border rounded transition-all", hasClass('justify-center') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignVerticalJustifyCenter size={14} className="mx-auto" /></button>
                                            <button onClick={() => updateClass('justify-', 'between')} className={cn("p-1.5 border rounded transition-all", hasClass('justify-between') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignVerticalJustifyEnd size={14} className="mx-auto" /></button>
                                            <button onClick={() => updateClass('items-', 'start')} className={cn("p-1.5 border rounded transition-all", hasClass('items-start') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignHorizontalJustifyStart size={14} className="mx-auto" /></button>
                                            <button onClick={() => updateClass('items-', 'center')} className={cn("p-1.5 border rounded transition-all", hasClass('items-center') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignHorizontalJustifyCenter size={14} className="mx-auto" /></button>
                                            <button onClick={() => updateClass('items-', 'end')} className={cn("p-1.5 border rounded transition-all", hasClass('items-end') ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-600")}><AlignHorizontalJustifyEnd size={14} className="mx-auto" /></button>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                            <div className="flex items-center gap-1.5"><Smartphone size={14} className="text-slate-400" /><span className="text-[10px] text-slate-600 font-medium">Stack on Mobile</span></div>
                                            <button onClick={() => handlePropChange('stackOnMobile', !selectedElement.props.stackOnMobile)} className={cn("w-8 h-4 rounded-full transition-colors relative", selectedElement.props.stackOnMobile ? "bg-blue-600" : "bg-slate-300")}>
                                                <div className={cn("w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all", selectedElement.props.stackOnMobile ? "left-4" : "left-0.5")} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Box Model */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Spacing</label>
                            <div className="relative w-full h-36 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center">
                                <span className="absolute top-1.5 left-2 text-[8px] text-orange-400 font-bold uppercase">Margin</span>
                                <input className="absolute top-2 left-1/2 -translate-x-1/2 w-8 text-center bg-white/80 border border-orange-200 rounded text-[10px] outline-none focus:border-orange-400 text-orange-600" placeholder="-" value={getClassValue('mt-')} onChange={(e) => updateClass('mt-', e.target.value)} />
                                <input className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 text-center bg-white/80 border border-orange-200 rounded text-[10px] outline-none focus:border-orange-400 text-orange-600" placeholder="-" value={getClassValue('mb-')} onChange={(e) => updateClass('mb-', e.target.value)} />
                                <input className="absolute left-2 top-1/2 -translate-y-1/2 w-6 text-center bg-white/80 border border-orange-200 rounded text-[10px] outline-none focus:border-orange-400 text-orange-600" placeholder="-" value={getClassValue('ml-')} onChange={(e) => updateClass('ml-', e.target.value)} />
                                <input className="absolute right-2 top-1/2 -translate-y-1/2 w-6 text-center bg-white/80 border border-orange-200 rounded text-[10px] outline-none focus:border-orange-400 text-orange-600" placeholder="-" value={getClassValue('mr-')} onChange={(e) => updateClass('mr-', e.target.value)} />
                                <div className="relative w-3/5 h-3/5 bg-green-50 border-2 border-dashed border-green-300 rounded flex items-center justify-center">
                                    <span className="absolute top-0.5 left-1.5 text-[8px] text-green-500 font-bold uppercase">Padding</span>
                                    <input className="absolute top-1 left-1/2 -translate-x-1/2 w-7 text-center bg-white border border-green-300 rounded text-[10px] font-medium outline-none focus:border-green-500 text-green-600" placeholder="0" value={getClassValue('pt-') || getClassValue('p-') || getClassValue('py-')} onChange={(e) => updateClass('pt-', e.target.value)} />
                                    <input className="absolute bottom-1 left-1/2 -translate-x-1/2 w-7 text-center bg-white border border-green-300 rounded text-[10px] font-medium outline-none focus:border-green-500 text-green-600" placeholder="0" value={getClassValue('pb-') || getClassValue('p-') || getClassValue('py-')} onChange={(e) => updateClass('pb-', e.target.value)} />
                                    <input className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 text-center bg-white border border-green-300 rounded text-[10px] font-medium outline-none focus:border-green-500 text-green-600" placeholder="0" value={getClassValue('pl-') || getClassValue('p-') || getClassValue('px-')} onChange={(e) => updateClass('pl-', e.target.value)} />
                                    <input className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 text-center bg-white border border-green-300 rounded text-[10px] font-medium outline-none focus:border-green-500 text-green-600" placeholder="0" value={getClassValue('pr-') || getClassValue('p-') || getClassValue('px-')} onChange={(e) => updateClass('pr-', e.target.value)} />
                                    <div className="w-6 h-6 bg-blue-100 rounded border border-blue-200 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /></div>
                                </div>
                            </div>
                        </div>

                        {/* Sizing */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sizing</label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 w-10">Width</span>
                                <div className="flex-1 grid grid-cols-3 gap-1">
                                    <button onClick={() => updateClass('w-', 'fit')} className={cn("p-1.5 border rounded text-[10px] flex flex-col items-center gap-0.5 transition-all", hasClass('w-fit') ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300")}><Minimize2 size={12} /><span className="text-[8px]">Hug</span></button>
                                    <button onClick={() => updateClass('w-', 'full')} className={cn("p-1.5 border rounded text-[10px] flex flex-col items-center gap-0.5 transition-all", hasClass('w-full') ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300")}><Maximize2 size={12} /><span className="text-[8px]">Fill</span></button>
                                    <button onClick={() => updateClass('w-', '64')} className={cn("p-1.5 border rounded text-[10px] flex flex-col items-center gap-0.5 transition-all", hasClass('w-64') ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300")}><Move size={12} /><span className="text-[8px]">Fixed</span></button>
                                </div>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decoration</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ l: 'Rounded', c: 'rounded-lg' }, { l: 'Shadow', c: 'shadow-md' }, { l: 'Border', c: 'border border-slate-200' }, { l: 'White', c: 'bg-white' }, { l: 'Blue', c: 'bg-blue-600 text-white' }, { l: 'Dark', c: 'bg-slate-900 text-white' }].map(opt => (
                                    <button key={opt.l} onClick={() => { const current = selectedElement.props.className || ''; const newClass = current.includes(opt.c) ? current.replace(opt.c, '').trim() : `${current} ${opt.c}`; handlePropChange('className', newClass.replace(/\s+/g, ' ')); }} className={cn("py-1.5 text-[10px] rounded border bg-white transition-all", selectedElement.props.className?.includes(opt.c) ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:border-blue-300")}>{opt.l}</button>
                                ))}
                            </div>
                        </div>

                        {/* Tailwind */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">Tailwind <span className="text-[10px] font-normal text-slate-400">Advanced</span></label>
                            <textarea className="w-full h-20 bg-slate-900 text-green-400 text-xs p-3 rounded-lg font-mono resize-none focus:ring-2 focus:ring-blue-500 outline-none" value={selectedElement.props.className || ''} onChange={(e) => handlePropChange('className', e.target.value)} placeholder="e.g. bg-red-500 p-4" />
                        </div>
                    </>
                )}

                {/* --- TAB: PROPS --- */}
                {activeTab === 'props' && (
                    <div className="space-y-4">

                        {/* Custom ID / Anchor Input */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Hash size={12} /> Element ID (Anchor)
                            </label>
                            <input
                                className="w-full bg-white border border-slate-200 px-3 py-2 text-xs rounded-md outline-none focus:border-blue-500 font-mono text-slate-600"
                                placeholder="e.g. features-section"
                                value={selectedElement.props.id || ''}
                                onChange={(e) => handlePropChange('id', e.target.value)}
                            />
                            <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                                Use this ID to scroll to this element via "Scroll To" interaction.
                            </p>
                        </div>

                        {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Content</label><textarea className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-sm rounded-lg min-h-[80px]" value={selectedElement.content || ''} onChange={(e) => handlePropChange('content', e.target.value)} /></div>
                        )}
                        {selectedElement.type === 'image' && (
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Image URL</label><input className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-sm rounded-lg" value={selectedElement.src || ''} onChange={(e) => handlePropChange('src', e.target.value)} /></div>
                        )}
                        {selectedElement.type === 'input' && (
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Placeholder</label><input className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-sm rounded-lg" value={selectedElement.props.placeholder || ''} onChange={(e) => handlePropChange('placeholder', e.target.value)} /></div>
                        )}
                        {selectedElement.type === 'icon' && (
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Icon</label><select className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-sm rounded-lg" value={selectedElement.props.iconName || 'Star'} onChange={(e) => handlePropChange('iconName', e.target.value)}>{getAvailableIconNames().map(name => <option key={name} value={name}>{name}</option>)}</select></div>
                        )}
                        {!['text', 'button', 'image', 'input', 'icon'].includes(selectedElement.type) && (
                            <div className="text-center py-8 text-slate-400 text-sm">No editable properties</div>
                        )}
                    </div>
                )}

                {/* --- TAB: ACTIONS --- */}
                {activeTab === 'actions' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><MousePointerClick size={14} /> On Click Event</label>

                            {/* Action Type Selector */}
                            <select
                                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white outline-none"
                                value={selectedElement.events?.onClick?.type || 'none'}
                                onChange={(e) => {
                                    const type = e.target.value;
                                    const newEl = { ...selectedElement };
                                    if (type === 'none') {
                                        if (newEl.events) delete newEl.events.onClick;
                                    } else {
                                        if (!newEl.events) newEl.events = {};
                                        newEl.events.onClick = { type: type as any, payload: '' };
                                    }
                                    updateProject({ ...elements, [selectedId!]: newEl });
                                }}
                            >
                                <option value="none">-- No Action --</option>
                                <option value="NAVIGATE">Navigate To Page</option>
                                <option value="SCROLL_TO">Scroll To Section</option>
                                <option value="TOGGLE_VISIBILITY">Show/Hide Element</option>
                            </select>

                            {/* DYNAMIC INPUTS BASED ON ACTION TYPE */}
                            {selectedElement.events?.onClick?.type === 'NAVIGATE' && (
                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Destination</label>

                                    {/* Page Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-600"><Layout size={12} /> Page in Project</div>
                                        <select
                                            className="w-full text-xs p-2 border border-slate-200 rounded bg-white outline-none"
                                            value={allPages.find(p => p.id === selectedElement.events?.onClick?.payload) ? selectedElement.events.onClick.payload : ''}
                                            onChange={(e) => {
                                                const newEl = { ...selectedElement, events: { ...selectedElement.events, onClick: { type: 'NAVIGATE' as const, payload: e.target.value } } };
                                                updateProject({ ...elements, [selectedId!]: newEl });
                                            }}
                                        >
                                            <option value="">Select Page...</option>
                                            {allPages.map(page => (
                                                <option key={page.id} value={page.id}>{page.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 my-2 text-[10px] text-slate-400 font-medium before:h-px before:bg-slate-200 before:flex-1 after:h-px after:bg-slate-200 after:flex-1">OR</div>

                                    {/* External URL */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-600"><Globe size={12} /> External URL</div>
                                        <input
                                            className="w-full text-xs p-2 border border-slate-200 rounded bg-white outline-none placeholder:text-slate-300"
                                            placeholder="https://google.com"
                                            value={selectedElement.events?.onClick?.payload?.startsWith('http') ? selectedElement.events.onClick.payload : ''}
                                            onChange={(e) => {
                                                const newEl = { ...selectedElement, events: { ...selectedElement.events, onClick: { type: 'NAVIGATE' as const, payload: e.target.value } } };
                                                updateProject({ ...elements, [selectedId!]: newEl });
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {(selectedElement.events?.onClick?.type === 'TOGGLE_VISIBILITY' || selectedElement.events?.onClick?.type === 'SCROLL_TO') && (
                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                                        {selectedElement.events.onClick.type === 'TOGGLE_VISIBILITY' ? 'Element to Toggle' : 'Scroll Target'}
                                    </label>
                                    <select
                                        className="w-full text-xs p-2 border border-slate-200 rounded bg-white outline-none"
                                        value={selectedElement.events.onClick.payload}
                                        onChange={(e) => {
                                            const newEl = { ...selectedElement, events: { ...selectedElement.events, onClick: { ...selectedElement.events!.onClick!, payload: e.target.value } } };
                                            updateProject({ ...elements, [selectedId!]: newEl });
                                        }}
                                    >
                                        <option value="">Select Element...</option>
                                        {elements[activePageId]?.children?.flatMap(frameId =>
                                            elements[frameId]?.children?.map(childId => (
                                                <option key={childId} value={childId}>
                                                    {elements[childId]?.name} ({elements[childId]?.type})
                                                </option>
                                            )) || []
                                        )}
                                    </select>
                                    <div className="text-[9px] text-slate-400">
                                        {selectedElement.events.onClick.type === 'TOGGLE_VISIBILITY'
                                            ? 'Select an element to show/hide when clicked.'
                                            : 'Select an element to scroll to when clicked.'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedElement.events?.onClick && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="text-[10px] font-bold text-green-700 uppercase mb-1">Active Action</div>
                                <div className="text-xs text-green-600 font-mono break-all">
                                    {selectedElement.events.onClick.type}: {selectedElement.events.onClick.payload || '(no target)'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
