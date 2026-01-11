import { useEditor } from '../context/EditorContext';
import { Trash2, Lock, Unlock, Eye, EyeOff, Layout, MousePointerClick, ArrowDown, ArrowRight, Settings, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAvailableIconNames } from '../data/iconRegistry';

export const RightSidebar = () => {
    const { elements, selectedId, updateProject, deleteElement, previewMode, globalStyles, setGlobalStyles } = useEditor();
    const selectedElement = selectedId ? elements[selectedId] : null;

    if (previewMode) return null;

    const handlePropChange = (key: string, value: any) => {
        if (!selectedId || !selectedElement) return;

        // CRITICAL FIX: Deep Copy the specific node to avoid mutating history
        const newElements = { ...elements };
        const newNode = { ...newElements[selectedId] };

        if (['content', 'src', 'locked', 'hidden'].includes(key)) {
            (newNode as any)[key] = value;
        } else {
            newNode.props = { ...newNode.props, [key]: value };
        }

        newElements[selectedId] = newNode;
        updateProject(newElements);
    };

    // --- GLOBAL SETTINGS VIEW (No Selection) ---
    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 h-full p-5 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg"><Settings size={18} className="text-slate-600" /></div>
                    <span className="font-bold text-slate-900">Project Settings</span>
                </div>

                {/* Global Colors */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette size={12} /> Global Palette
                    </label>
                    <div className="space-y-3">
                        {Object.entries(globalStyles.colors).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded border border-slate-200 shadow-sm" style={{ backgroundColor: value }} />
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-slate-700 capitalize">{key}</div>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => setGlobalStyles(prev => ({ ...prev, colors: { ...prev.colors, [key]: e.target.value } }))}
                                        className="w-full text-[10px] text-slate-500 bg-transparent outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- ELEMENT SETTINGS VIEW ---
    const toggleLock = () => handlePropChange('locked', !selectedElement?.locked);
    const toggleHidden = () => handlePropChange('hidden', !selectedElement?.hidden);

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar shadow-xl z-20 h-full">
            <div className="p-5 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-lg text-slate-900 truncate max-w-[180px]">{selectedElement.name}</div>
                        <div className="text-xs text-slate-400">{selectedElement.type}</div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={toggleLock} className={cn("p-2 rounded", selectedElement.locked ? "bg-amber-100 text-amber-600" : "hover:bg-slate-100 text-slate-400")}>{selectedElement.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                        <button onClick={toggleHidden} className={cn("p-2 rounded", selectedElement.hidden ? "bg-purple-100 text-purple-600" : "hover:bg-slate-100 text-slate-400")}>{selectedElement.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                        <button onClick={() => deleteElement(selectedId!)} className="p-2 rounded text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                </div>

                {/* Layout Control */}
                {['container', 'canvas', 'page'].includes(selectedElement.type) && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Layout size={12} /> Layout Mode</label>
                        <div className="flex gap-2">
                            <button onClick={() => handlePropChange('layoutMode', 'canvas')} className={cn("flex-1 py-1.5 text-xs font-medium rounded shadow-sm border", (!selectedElement.props.layoutMode || selectedElement.props.layoutMode === 'canvas') ? "bg-white text-blue-600 border-blue-200" : "bg-slate-100 text-slate-500 border-transparent")}>Freeform</button>
                            <button onClick={() => handlePropChange('layoutMode', 'flex')} className={cn("flex-1 py-1.5 text-xs font-medium rounded shadow-sm border", selectedElement.props.layoutMode === 'flex' ? "bg-white text-blue-600 border-blue-200" : "bg-slate-100 text-slate-500 border-transparent")}>Auto Layout</button>
                        </div>
                        {selectedElement.props.layoutMode === 'flex' && (
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => handlePropChange('className', `${(selectedElement.props.className || '').replace(/flex-row|flex-col/g, '').trim()} flex-col`)} className="flex-1 py-1 bg-white border text-slate-600 text-[10px] rounded flex items-center justify-center gap-1 hover:border-blue-400"><ArrowDown size={10} /> Vertical</button>
                                <button onClick={() => handlePropChange('className', `${(selectedElement.props.className || '').replace(/flex-row|flex-col/g, '').trim()} flex-row`)} className="flex-1 py-1 bg-white border text-slate-600 text-[10px] rounded flex items-center justify-center gap-1 hover:border-blue-400"><ArrowRight size={10} /> Horizontal</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Interactions */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><MousePointerClick size={12} /> Interactions</label>
                    <select className="w-full text-xs p-2 border rounded bg-white outline-none" value={selectedElement.events?.onClick?.payload || 'none'} onChange={(e) => {
                        const newElements = { ...elements };
                        const newNode = { ...newElements[selectedId!] };
                        if (!newNode.events) newNode.events = {};
                        if (e.target.value === 'none') delete newNode.events.onClick;
                        else newNode.events.onClick = { type: 'NAVIGATE', payload: e.target.value };
                        newElements[selectedId!] = newNode;
                        updateProject(newElements);
                    }}>
                        <option value="none">No Action</option>
                        <option value="/pricing">Go to Pricing</option>
                        <option value="/login">Go to Login</option>
                        <option value="/about">Go to About</option>
                    </select>
                </div>

                {/* Text Content */}
                {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Text Content</label><input className="w-full bg-slate-50 border px-3 py-2 text-sm rounded-lg" value={selectedElement.content || ''} onChange={(e) => handlePropChange('content', e.target.value)} /></div>
                )}

                {/* Image Source */}
                {selectedElement.type === 'image' && (
                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Image URL</label><input className="w-full bg-slate-50 border px-3 py-2 text-sm rounded-lg" value={selectedElement.src || ''} onChange={(e) => handlePropChange('src', e.target.value)} /></div>
                )}

                {/* Input Placeholder */}
                {selectedElement.type === 'input' && (
                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Placeholder</label><input className="w-full bg-slate-50 border px-3 py-2 text-sm rounded-lg" value={selectedElement.props.placeholder || ''} onChange={(e) => handlePropChange('placeholder', e.target.value)} /></div>
                )}

                {/* Icon Picker */}
                {selectedElement.type === 'icon' && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Icon</label>
                        <select className="w-full bg-slate-50 border px-3 py-2 text-sm rounded-lg" value={selectedElement.props.iconName || 'Star'} onChange={(e) => handlePropChange('iconName', e.target.value)}>
                            {getAvailableIconNames().map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                )}

                {/* Tailwind Editor */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tailwind Classes</label>
                    <textarea className="w-full h-28 bg-slate-900 text-green-400 text-xs p-3 rounded-lg font-mono resize-none custom-scrollbar" value={selectedElement.props.className || ''} onChange={(e) => handlePropChange('className', e.target.value)} />
                </div>

                {/* Quick Styles */}
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Styles</div>
                    <div className="flex flex-wrap gap-2">
                        {['rounded-lg', 'shadow-lg', 'border', 'p-4', 'font-bold', 'bg-blue-500', 'text-white'].map(cls => (
                            <button
                                key={cls}
                                onClick={() => {
                                    const current = selectedElement.props.className || '';
                                    const newClass = current.includes(cls) ? current.replace(cls, '').replace(/\s+/g, ' ').trim() : `${current} ${cls}`.trim();
                                    handlePropChange('className', newClass);
                                }}
                                className={cn("px-2 py-1 text-[10px] rounded border transition-all", selectedElement.props.className?.includes(cls) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
