import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { Switch, DraggableLabel, ColorPicker } from './ui/PremiumInputs';
import {
    Layout, Type, Palette, MousePointer2, Zap,
    Link as LinkIcon, Hash, Lock, Unlock, Eye, EyeOff,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Box, Maximize, Trash2, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- TABS COMPONENT (Dark Mode) ---
const Tabs = ({ active, onChange }: { active: string, onChange: (v: string) => void }) => (
    <div className="flex p-1 mx-4 mt-4 bg-[#252526] rounded-md border border-[#3e3e42]">
        <button
            onClick={() => onChange('design')}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-semibold rounded-sm transition-all relative",
                active === 'design'
                    ? "text-white after:absolute after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#007acc]"
                    : "text-[#858585] hover:text-white"
            )}
        >
            <Palette size={14} /> Design
        </button>
        <button
            onClick={() => onChange('interact')}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-semibold rounded-sm transition-all relative",
                active === 'interact'
                    ? "text-[#4fc1ff] after:absolute after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#007acc]"
                    : "text-[#858585] hover:text-white"
            )}
        >
            <Zap size={14} /> Prototype
        </button>
    </div>
);

// --- REUSABLE HELPERS (Dark Mode) ---
const Section = ({ title, icon: Icon, children, defaultOpen = true }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#252526] last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 hover:bg-[#3e3e42] transition-colors group">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#cccccc] uppercase tracking-wide">
                    <Icon size={14} className="text-[#858585] group-hover:text-white" /> {title}
                </div>
            </button>
            {isOpen && <div className="px-3 pb-4 space-y-3">{children}</div>}
        </div>
    );
};

const Row = ({ label, children }: any) => (
    <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-medium text-[#999999] w-16 shrink-0 truncate">{label}</label>
        <div className="flex-1 flex items-center justify-end gap-2">{children}</div>
    </div>
);

// --- MAIN COMPONENT ---
export const RightSidebar = () => {
    const { elements, selectedId, updateProject } = useEditor();
    const [activeTab, setActiveTab] = useState('design');

    const element = selectedId ? elements[selectedId] : null;

    // --- UPDATERS ---
    const updateProp = (path: string, value: any) => {
        if (!selectedId) return;
        const newElements = { ...elements };
        const keys = path.split('.');
        let current = newElements[selectedId].props;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        updateProject(newElements);
    };

    const updateEvent = (type: string, action: any) => {
        if (!selectedId) return;
        const newElements = { ...elements };
        if (!newElements[selectedId].events) newElements[selectedId].events = {};

        if (action === null) {
            delete (newElements[selectedId].events as any)[type];
        } else {
            (newElements[selectedId].events as any)[type] = action;
        }
        updateProject(newElements);
    };

    // --- EMPTY STATE ---
    if (!element) {
        return (
            <div className="w-[280px] bg-[#333333] border-l border-[#252526] h-full flex flex-col text-[#cccccc]">
                <div className="p-4 border-b border-[#252526] bg-[#333333]">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <Globe size={16} className="text-[#007acc]" /> Project Settings
                    </h2>
                </div>
                <div className="p-4 text-center">
                    <div className="p-4 border border-dashed border-[#444] rounded-lg bg-[#252526]">
                        <span className="text-xs text-[#888]">Select an element to edit</span>
                    </div>
                </div>
            </div>
        );
    }

    const style = element.props.style || {};
    const isFlex = element.props.layoutMode === 'flex';
    const onClickEvent = element.events?.onClick;

    return (
        <div className="w-[280px] bg-[#333333] border-l border-[#252526] h-full flex flex-col overflow-y-auto custom-scrollbar text-[#cccccc]">

            {/* HEADER */}
            <div className="p-4 border-b border-[#252526] bg-[#333333] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#3c3c3c] text-[#cccccc] px-2 py-0.5 rounded uppercase tracking-wider border border-[#555]">
                            {element.type}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, locked: !element.locked } })} className={cn("p-1.5 rounded hover:bg-[#3e3e42] transition-colors", element.locked ? "text-red-400" : "text-[#858585]")}>
                            {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, hidden: !element.hidden } })} className={cn("p-1.5 rounded hover:bg-[#3e3e42] transition-colors", element.hidden ? "text-[#858585]" : "text-[#007acc]")}>
                            {element.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>
                <input
                    type="text" value={element.name}
                    onChange={(e) => updateProject({ ...elements, [element.id]: { ...element, name: e.target.value } })}
                    className="w-full text-sm font-bold text-white bg-transparent outline-none border-b border-transparent hover:border-[#555] focus:border-[#007acc] transition-all pb-2 placeholder-[#555]"
                    placeholder="Element Name"
                />

                {/* TABS SWITCHER */}
                <div className="pb-2">
                    <Tabs active={activeTab} onChange={setActiveTab} />
                </div>
            </div>

            {/* TAB CONTENT: DESIGN */}
            {activeTab === 'design' && (
                <div>

                    {/* 1. LAYOUT */}
                    <Section title="Layout" icon={Layout}>
                        <Row label="Mode">
                            <div className="flex bg-[#252526] p-0.5 rounded-md w-full border border-[#3e3e42] overflow-hidden">
                                <button onClick={() => updateProp('layoutMode', 'canvas')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium py-1 rounded-sm transition-all", !isFlex ? "bg-[#3e3e42] text-white shadow-sm" : "text-[#858585] hover:text-[#cccccc]")}>
                                    <Maximize size={12} /> Canvas
                                </button>
                                <button onClick={() => updateProp('layoutMode', 'flex')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium py-1 rounded-sm transition-all", isFlex ? "bg-[#3e3e42] text-white shadow-sm" : "text-[#858585] hover:text-[#cccccc]")}>
                                    <Box size={12} /> Auto
                                </button>
                            </div>
                        </Row>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 pt-2">
                            <DraggableLabel label="W" value={parseInt(style.width?.toString() || '0') || 'Auto'} onChange={(v: number) => updateProp('style.width', `${v}px`)} />
                            <DraggableLabel label="H" value={parseInt(style.height?.toString() || '0') || 'Auto'} onChange={(v: number) => updateProp('style.height', `${v}px`)} />

                            {!isFlex && (
                                <>
                                    <DraggableLabel label="X" value={parseInt(style.left?.toString() || '0') || 0} onChange={(v: number) => updateProp('style.left', `${v}px`)} />
                                    <DraggableLabel label="Y" value={parseInt(style.top?.toString() || '0') || 0} onChange={(v: number) => updateProp('style.top', `${v}px`)} />
                                </>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#3e3e42] grid grid-cols-2 gap-2">
                            <DraggableLabel label="Radius" value={parseInt(style.borderRadius?.toString() || '0') || 0} onChange={(v: number) => updateProp('style.borderRadius', `${v}px`)} min={0} max={100} />
                            <DraggableLabel label="Padding" value={parseInt(style.padding?.toString() || '0') || 0} onChange={(v: number) => updateProp('style.padding', `${v}px`)} min={0} max={100} />
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#3e3e42] flex items-center justify-between px-1">
                            <span className="text-[10px] font-medium text-[#999999]">Clip Content</span>
                            <Switch
                                checked={style.overflow === 'hidden'}
                                onChange={(checked: boolean) => updateProp('style.overflow', checked ? 'hidden' : 'visible')}
                            />
                        </div>
                    </Section>

                    {/* 2. APPEARANCE */}
                    <Section title="Appearance" icon={Palette}>
                        <Row label="Fill">
                            <ColorPicker value={style.backgroundColor || ''} onChange={(v) => updateProp('style.backgroundColor', v)} />
                        </Row>
                        <div className="pt-3">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[10px] font-medium text-[#999999]">Opacity</span>
                                <span className="text-[10px] font-mono text-[#cccccc]">{Math.round(Number(style.opacity || 1) * 100)}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={style.opacity !== undefined ? style.opacity : 1}
                                onChange={(e) => updateProp('style.opacity', e.target.value)}
                                className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-[#007acc]"
                            />
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#3e3e42]">
                            <Row label="Border">
                                <div className="flex gap-2 w-full">
                                    <div className="w-16"><DraggableLabel label="W" value={parseInt(style.borderWidth?.toString() || '0') || 0} onChange={(v: number) => updateProp('style.borderWidth', `${v}px`)} min={0} max={20} /></div>
                                    <div className="flex-1"><ColorPicker value={style.borderColor || ''} onChange={(v) => updateProp('style.borderColor', v)} /></div>
                                </div>
                            </Row>
                        </div>
                    </Section>

                    {/* 3. TYPOGRAPHY */}
                    {(element.type === 'text' || element.type === 'button' || element.type === 'heading') && (
                        <Section title="Typography" icon={Type}>
                            <Row label="Content">
                                <input
                                    value={element.content || ''}
                                    onChange={(e) => updateProject({ ...elements, [element.id]: { ...element, content: e.target.value } })}
                                    className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded-sm px-2 py-1 text-xs outline-none focus:border-[#007acc] text-white transition-all placeholder-[#666]"
                                />
                            </Row>
                            <Row label="Color">
                                <ColorPicker value={style.color || ''} onChange={(v) => updateProp('style.color', v)} />
                            </Row>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <DraggableLabel label="Size" value={parseInt(style.fontSize?.toString() || '16') || 16} onChange={(v: number) => updateProp('style.fontSize', `${v}px`)} min={8} max={120} />
                                <DraggableLabel label="Weight" value={parseInt(style.fontWeight?.toString() || '400') || 400} onChange={(v: number) => updateProp('style.fontWeight', v)} min={100} max={900} />
                            </div>
                            <div className="mt-3 flex justify-between bg-[#252526] p-1 rounded-sm border border-[#3e3e42]">
                                {['left', 'center', 'right', 'justify'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => updateProp('style.textAlign', align)}
                                        className={cn("p-1.5 rounded-sm transition-colors hover:bg-[#333333]", style.textAlign === align ? "bg-[#333333] text-white" : "text-[#858585]")}
                                    >
                                        {align === 'left' && <AlignLeft size={14} />}
                                        {align === 'center' && <AlignCenter size={14} />}
                                        {align === 'right' && <AlignRight size={14} />}
                                        {align === 'justify' && <AlignJustify size={14} />}
                                    </button>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            )}

            {/* TAB CONTENT: PROTOTYPE (INTERACTIONS) */}
            {activeTab === 'interact' && (
                <div>
                    <Section title="Interactions" icon={MousePointer2}>
                        <div className="space-y-4">

                            {/* ON CLICK TRIGGER */}
                            <div className="bg-[#252526] border border-[#3e3e42] rounded-md p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-[#cccccc] flex items-center gap-1.5">
                                        <Zap size={14} className="text-amber-500" /> On Click
                                    </span>
                                    {onClickEvent && (
                                        <button onClick={() => updateEvent('onClick', null)} className="text-[#666] hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* ACTION SELECTOR */}
                                <select
                                    value={(onClickEvent as any)?.action || 'none'}
                                    onChange={(e) => updateEvent('onClick', { action: e.target.value, value: '' })}
                                    className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded-sm px-2 py-1.5 text-xs text-white outline-none focus:border-[#007acc] mb-2"
                                >
                                    <option value="none">No Action</option>
                                    <option value="link">Open URL</option>
                                    <option value="scroll">Scroll to Section</option>
                                </select>

                                {/* ACTION DETAILS */}
                                {(onClickEvent as any)?.action === 'link' && (
                                    <div className="animate-in slide-in-from-top-1">
                                        <div className="flex items-center gap-2 bg-[#3c3c3c] border border-[#3e3e42] rounded-sm px-2 py-1.5 focus-within:border-[#007acc]">
                                            <LinkIcon size={12} className="text-[#999]" />
                                            <input
                                                placeholder="https://google.com"
                                                value={(onClickEvent as any)?.value || ''}
                                                onChange={(e) => updateEvent('onClick', { ...onClickEvent, value: e.target.value })}
                                                className="w-full text-xs bg-transparent text-white outline-none placeholder-[#666]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(onClickEvent as any)?.action === 'scroll' && (
                                    <div className="animate-in slide-in-from-top-1">
                                        <div className="flex items-center gap-2 bg-[#3c3c3c] border border-[#3e3e42] rounded-sm px-2 py-1.5 focus-within:border-[#007acc]">
                                            <Hash size={12} className="text-[#999]" />
                                            <input
                                                placeholder="section-id"
                                                value={(onClickEvent as any)?.value || ''}
                                                onChange={(e) => updateEvent('onClick', { ...onClickEvent, value: e.target.value })}
                                                className="w-full text-xs bg-transparent text-white outline-none placeholder-[#666]"
                                            />
                                        </div>
                                        <div className="mt-2 text-[10px] text-[#777]">
                                            Tip: Use the ID of any section on your page.
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </Section>

                    <div className="p-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#3e3e42] rounded-xl bg-[#252526] text-[#555]">
                            <MousePointer2 size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium">Select an element to add interactions</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
