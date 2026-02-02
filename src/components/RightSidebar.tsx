import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { Section, Row, NumberInput, ColorInput, ToggleGroup, BoxModel, TextInput, SelectInput } from './ui/PremiumInputs';
import {
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Grid, Box, Maximize, Lock, Eye,
    Type, ArrowRight, ArrowDown, Image as ImageIcon, PaintBucket, RotateCw, Layers, MousePointer2,
    Hand, Settings, Layout, Hash, Type as TypeIcon,
    MoveHorizontal, MoveVertical
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- SUB-COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Layout; label: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all",
            active ? "border-[#007acc] text-white bg-[#1e1e1e]" : "border-transparent text-[#666] hover:text-[#999] hover:bg-[#252526]"
        )}
    >
        <Icon size={14} />
        {label}
    </button>
);

const ProjectSettings = () => {
    const { globalStyles, setGlobalStyles } = useEditor();

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            <div className="p-4 border-b border-[#252526]">
                <h2 className="text-xs font-bold text-[#cccccc] uppercase tracking-wider flex items-center gap-2">
                    <Settings size={14} className="text-[#007acc]" /> Project Settings
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <Section title="Global Appearance">
                    <Row label="Background">
                        <ColorInput
                            value={globalStyles?.colors?.dark || '#1e1e1e'}
                            onChange={(v) => setGlobalStyles((prev: typeof globalStyles) => ({ ...prev, colors: { ...prev?.colors, dark: v } }))}
                        />
                    </Row>
                    <Row label="Primary">
                        <ColorInput
                            value={globalStyles?.colors?.primary || '#007acc'}
                            onChange={(v) => setGlobalStyles((prev: typeof globalStyles) => ({ ...prev, colors: { ...prev?.colors, primary: v } }))}
                        />
                    </Row>
                </Section>

                <Section title="Typography">
                    <Row label="Base Font">
                        <SelectInput
                            value={globalStyles?.fonts?.body || 'Inter'}
                            onChange={(v: string) => setGlobalStyles((prev: typeof globalStyles) => ({ ...prev, fonts: { ...prev?.fonts, body: v } }))}
                            options={[
                                { value: 'Inter', label: 'Inter' },
                                { value: 'Roboto', label: 'Roboto' },
                                { value: 'Open Sans', label: 'Open Sans' },
                                { value: 'Playfair Display', label: 'Playfair' },
                                { value: 'monospace', label: 'Monospace' },
                            ]}
                        />
                    </Row>
                </Section>

                <Section title="Editor">
                    <div className="p-3 bg-[#252526] rounded border border-[#3e3e42] space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#ccc]">
                            <span>Snap to Grid</span>
                            <div className="w-8 h-4 bg-[#007acc] rounded-full relative cursor-pointer">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <Row label="Grid Size">
                            <NumberInput value={8} onChange={() => { }} />
                        </Row>
                    </div>
                </Section>
            </div>
            <div className="p-4 border-t border-[#252526] text-[10px] text-[#555] text-center">
                Vectra Engine v1.0.0
            </div>
        </div>
    );
};

export const RightSidebar = () => {
    const { elements, selectedId, updateProject, previewMode } = useEditor();
    const [activeTab, setActiveTab] = useState<'design' | 'interact' | 'settings'>('design');
    const [bgMode, setBgMode] = useState<'color' | 'image'>('color');
    const [animScope, setAnimScope] = useState<'single' | 'all'>('single');

    if (previewMode) return null;

    const element = selectedId ? elements[selectedId] : null;

    // --- EMPTY STATE -> PROJECT SETTINGS ---
    if (!element) {
        return (
            <div className="w-[280px] bg-[#1e1e1e] border-l border-[#252526] h-full flex flex-col">
                <ProjectSettings />
            </div>
        );
    }

    // --- HELPERS ---
    const updateStyle = (key: string, value: any) => {
        const newElements = { ...elements };
        const unitlessKeys = ['fontWeight', 'opacity', 'zIndex', 'flexGrow', 'scale', 'lineHeight'];
        const finalValue = (typeof value === 'number' && !unitlessKeys.includes(key)) ? `${value}px` : value;

        let targetIds = [element.id];

        if (animScope === 'all' && key.startsWith('animation')) {
            const parentId = Object.keys(elements).find(k => elements[k].children?.includes(element.id));
            if (parentId) {
                const parent = elements[parentId];
                if (['webpage', 'canvas', 'page'].includes(parent.type)) {
                    targetIds = parent.children || [];
                }
            }
        }

        targetIds.forEach(id => {
            const currentStyle = newElements[id].props.style || {};
            let mergeStyle = {};
            if (key === 'animationName' && value !== 'none' && !currentStyle.animationDuration) {
                mergeStyle = { animationDuration: '0.5s', animationFillMode: 'both' };
            }
            newElements[id].props.style = { ...currentStyle, [key]: finalValue, ...mergeStyle };
        });

        updateProject(newElements);
    };

    const updateProp = (key: string, value: any) => {
        const newElements = { ...elements };
        newElements[element.id].props = { ...newElements[element.id].props, [key]: value };
        updateProject(newElements);
    };

    const style = element.props.style || {};
    const props = element.props || {};
    const getVal = (val: any, fallback: any = 0) => parseInt(String(val || fallback).replace('px', ''));
    const handleBoxModelChange = (field: string, value: string) => updateStyle(field, parseInt(value) || 0);

    return (
        <div className="w-[280px] bg-[#1e1e1e] border-l border-[#252526] h-full flex flex-col">

            {/* IDENTITY HEADER */}
            <div className="p-3 border-b border-[#252526] bg-[#1e1e1e]">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-[#007acc] text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-1 truncate max-w-[120px]">
                        {element.type === 'text' ? <Type size={10} /> : <Box size={10} />}
                        {element.type}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, locked: !element.locked } })} className={cn("p-1 rounded hover:bg-[#333]", element.locked ? "text-red-400" : "text-[#666]")}><Lock size={12} /></button>
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, hidden: !element.hidden } })} className={cn("p-1 rounded hover:bg-[#333]", element.hidden ? "text-[#666]" : "text-[#ccc]")}><Eye size={12} /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        value={element.name}
                        onChange={(e) => updateProject({ ...elements, [element.id]: { ...element, name: e.target.value } })}
                        className="w-full bg-transparent text-sm font-bold text-white focus:bg-[#252526] px-1 rounded outline-none border border-transparent focus:border-[#007acc] transition-all"
                    />
                </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-[#252526] bg-[#1e1e1e]">
                <TabButton active={activeTab === 'design'} onClick={() => setActiveTab('design')} icon={Layout} label="Design" />
                <TabButton active={activeTab === 'interact'} onClick={() => setActiveTab('interact')} icon={MousePointer2} label="Interact" />
                <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Settings" />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* --- TAB: DESIGN --- */}
                {activeTab === 'design' && (
                    <>
                        {/* TAILWIND CLASS EDITOR */}
                        <div className="p-3 border-b border-[#252526]">
                            <Row label="Classes">
                                <TextInput
                                    value={props.className || ''}
                                    onChange={(v: string) => updateProp('className', v)}
                                    placeholder="p-4 bg-blue-500..."
                                    icon={Hash}
                                />
                            </Row>
                        </div>

                        {/* LAYOUT */}
                        <Section title="Layout">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <NumberInput label="W" value={getVal(style.width, 'auto')} onChange={(v: any) => updateStyle('width', v)} />
                                <NumberInput label="H" value={getVal(style.height, 'auto')} onChange={(v: any) => updateStyle('height', v)} />
                            </div>
                            {element.props.style?.position === 'absolute' && (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <NumberInput label="X" value={getVal(style.left)} onChange={(v: any) => updateStyle('left', v)} />
                                    <NumberInput label="Y" value={getVal(style.top)} onChange={(v: any) => updateStyle('top', v)} />
                                </div>
                            )}

                            <div className="h-px bg-[#2a2a2c] my-3" />

                            <Row label="Display">
                                <ToggleGroup
                                    value={element.props.layoutMode || 'canvas'} onChange={(v: any) => updateProp('layoutMode', v)}
                                    options={[{ value: 'canvas', icon: <Maximize size={12} /> }, { value: 'flex', icon: <Box size={12} /> }, { value: 'grid', icon: <Grid size={12} /> }]}
                                />
                            </Row>

                            {/* VISUAL FLEX CONTROLS */}
                            {element.props.layoutMode === 'flex' && (
                                <div className="mt-2 space-y-2 p-2 bg-[#252526] rounded border border-[#3e3e42]">
                                    <Row label="Direction">
                                        <ToggleGroup value={style.flexDirection || 'row'} onChange={(v: string) => updateStyle('flexDirection', v)}
                                            options={[{ value: 'row', icon: <ArrowRight size={12} /> }, { value: 'column', icon: <ArrowDown size={12} /> }]}
                                        />
                                    </Row>

                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="text-[9px] text-[#666] mb-1 block">JUSTIFY</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateStyle('justifyContent', opt)}
                                                        className={cn(
                                                            "h-6 rounded bg-[#333] hover:bg-[#444] flex items-center justify-center transition-colors",
                                                            style.justifyContent === opt && "bg-[#007acc] text-white hover:bg-[#007acc]"
                                                        )}
                                                        title={opt}
                                                    >
                                                        {opt === 'center' ? <AlignCenter size={10} /> : opt === 'space-between' ? <MoveHorizontal size={10} /> : <AlignLeft size={10} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-[#666] mb-1 block">ALIGN</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {['flex-start', 'center', 'flex-end', 'stretch', 'baseline'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateStyle('alignItems', opt)}
                                                        className={cn(
                                                            "h-6 rounded bg-[#333] hover:bg-[#444] flex items-center justify-center transition-colors",
                                                            style.alignItems === opt && "bg-[#007acc] text-white hover:bg-[#007acc]"
                                                        )}
                                                        title={opt}
                                                    >
                                                        {opt === 'stretch' ? <MoveVertical size={10} /> : opt === 'center' ? <AlignCenter size={10} className="rotate-90" /> : <AlignLeft size={10} className="rotate-90" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Row label="Gap"><NumberInput value={getVal(style.gap, 0)} onChange={(v: number) => updateStyle('gap', v)} /></Row>
                                </div>
                            )}

                            <div className="mt-4 mb-2">
                                <BoxModel
                                    margin={{ top: getVal(style.marginTop), right: getVal(style.marginRight), bottom: getVal(style.marginBottom), left: getVal(style.marginLeft) }}
                                    padding={{ top: getVal(style.paddingTop), right: getVal(style.paddingRight), bottom: getVal(style.paddingBottom), left: getVal(style.paddingLeft) }}
                                    onChange={handleBoxModelChange}
                                />
                            </div>
                        </Section>

                        {/* TYPOGRAPHY */}
                        {['text', 'button', 'heading', 'link'].includes(element.type) && (
                            <Section title="Typography">
                                <div className="space-y-2">
                                    <Row label="Font">
                                        <SelectInput
                                            value={style.fontFamily || 'Inter'}
                                            onChange={(v: string) => updateStyle('fontFamily', v)}
                                            options={[
                                                { value: 'Inter', label: 'Inter' },
                                                { value: 'Roboto', label: 'Roboto' },
                                                { value: 'Open Sans', label: 'Open Sans' },
                                                { value: 'serif', label: 'Serif' },
                                                { value: 'monospace', label: 'Mono' }
                                            ]}
                                        />
                                    </Row>
                                    <div className="grid grid-cols-2 gap-2">
                                        <NumberInput label="Size" value={getVal(style.fontSize, 16)} onChange={(v: number) => updateStyle('fontSize', v)} />
                                        <NumberInput label="Weight" value={getVal(style.fontWeight, 400)} onChange={(v: number) => updateStyle('fontWeight', v)} step={100} min={100} max={900} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <NumberInput label="Height" value={parseFloat(String(style.lineHeight || '1.5'))} onChange={(v: number) => updateStyle('lineHeight', v)} step={0.1} />
                                        <NumberInput label="Letter" value={parseFloat(String(style.letterSpacing || '0'))} onChange={(v: number) => updateStyle('letterSpacing', `${v}px`)} step={0.5} />
                                    </div>
                                    <Row label="Color"><ColorInput value={style.color || '#000000'} onChange={(v) => updateStyle('color', v)} /></Row>
                                    <Row label="Align">
                                        <ToggleGroup value={style.textAlign || 'left'} onChange={(v: string) => updateStyle('textAlign', v)} options={[{ value: 'left', icon: <AlignLeft size={12} /> }, { value: 'center', icon: <AlignCenter size={12} /> }, { value: 'right', icon: <AlignRight size={12} /> }, { value: 'justify', icon: <AlignJustify size={12} /> }]} />
                                    </Row>
                                    <Row label="Case">
                                        <ToggleGroup value={style.textTransform || 'none'} onChange={(v: string) => updateStyle('textTransform', v)} options={[{ value: 'none', icon: <TypeIcon size={12} /> }, { value: 'uppercase', icon: <span className="text-[8px] font-bold">AA</span> }, { value: 'lowercase', icon: <span className="text-[8px] font-bold">aa</span> }, { value: 'capitalize', icon: <span className="text-[8px] font-bold">Aa</span> }]} />
                                    </Row>
                                </div>
                            </Section>
                        )}

                        {/* FILLS */}
                        <Section title="Fills">
                            <div className="flex bg-[#252526] p-0.5 rounded border border-[#3e3e42] mb-3">
                                <button onClick={() => setBgMode('color')} className={cn("flex-1 py-1 rounded text-[10px] font-medium transition-all", bgMode === 'color' ? "bg-[#3e3e42] text-white" : "text-[#858585]")}><PaintBucket size={10} className="inline mr-1" />Color</button>
                                <button onClick={() => setBgMode('image')} className={cn("flex-1 py-1 rounded text-[10px] font-medium transition-all", bgMode === 'image' ? "bg-[#3e3e42] text-white" : "text-[#858585]")}><ImageIcon size={10} className="inline mr-1" />Image</button>
                            </div>
                            {bgMode === 'color' ? (
                                <ColorInput value={style.backgroundColor || 'transparent'} onChange={(v) => { updateStyle('backgroundColor', v); updateStyle('backgroundImage', 'none'); }} />
                            ) : (
                                <div className="space-y-2">
                                    <TextInput value={style.backgroundImage?.replace('url(', '').replace(')', '') || ''} onChange={(v: string) => { updateStyle('backgroundImage', `url(${v})`); updateStyle('backgroundSize', 'cover'); updateStyle('backgroundPosition', 'center'); updateStyle('backgroundColor', 'transparent'); }} placeholder="Image URL..." icon={ImageIcon} />
                                    <Row label="Size"><SelectInput value={style.backgroundSize || 'cover'} onChange={(v: string) => updateStyle('backgroundSize', v)} options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Auto' }]} /></Row>
                                </div>
                            )}
                        </Section>

                        {/* BORDERS */}
                        <Section title="Borders">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <NumberInput label="Radius" value={getVal(style.borderRadius)} onChange={(v: number) => updateStyle('borderRadius', v)} />
                                <NumberInput label="Width" value={getVal(style.borderWidth)} onChange={(v: number) => updateStyle('borderWidth', v)} />
                            </div>
                            <Row label="Color"><ColorInput value={style.borderColor || 'transparent'} onChange={(v) => updateStyle('borderColor', v)} /></Row>
                        </Section>

                        {/* TRANSFORM */}
                        <Section title="Effects & Transform">
                            <Row label="Opacity"><input type="range" min="0" max="1" step="0.01" value={style.opacity !== undefined ? style.opacity : 1} onChange={(e) => updateStyle('opacity', e.target.value)} className="w-full h-1 bg-[#3e3e42] rounded-lg accent-[#007acc]" /></Row>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <NumberInput label="Rotate" value={getVal(style.rotate, 0)} onChange={(v: number) => updateStyle('rotate', `${v}deg`)} />
                                <NumberInput label="Scale" value={Number(style.scale) || 1} onChange={(v: number) => updateStyle('scale', v)} step={0.1} />
                            </div>
                            <div className="mt-2"><Row label="Z-Index"><NumberInput value={getVal(style.zIndex, 0)} onChange={(v: number) => updateStyle('zIndex', v)} /></Row></div>
                        </Section>
                    </>
                )}

                {/* --- TAB: INTERACT --- */}
                {activeTab === 'interact' && (
                    <>
                        <Section title="Animation">
                            <div className="space-y-3">
                                <Row label="Apply To">
                                    <ToggleGroup
                                        value={animScope}
                                        onChange={setAnimScope}
                                        options={[
                                            { value: 'single', icon: <MousePointer2 size={12} />, label: 'Selected' },
                                            { value: 'all', icon: <Layers size={12} />, label: 'All in Frame' },
                                        ]}
                                    />
                                </Row>
                                <Row label="Type">
                                    <div className="flex gap-2 w-full">
                                        <SelectInput
                                            value={style.animationName || 'none'}
                                            onChange={(v: string) => updateStyle('animationName', v)}
                                            options={[
                                                { value: 'none', label: 'None' },
                                                { value: 'fade-in', label: 'Fade In' },
                                                { value: 'slide-up', label: 'Slide Up' },
                                                { value: 'scale-up', label: 'Scale Up' },
                                                { value: 'bounce', label: 'Bounce' },
                                            ]}
                                        />
                                        <button onClick={() => updateStyle('--anim-trigger', Date.now())} className="p-1 bg-[#333] border border-[#3e3e42] rounded hover:bg-[#444] text-[#ccc] hover:text-white transition-colors" title="Replay">
                                            <RotateCw size={12} />
                                        </button>
                                    </div>
                                </Row>
                                {style.animationName && style.animationName !== 'none' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <NumberInput label="Dur (s)" value={parseFloat(style.animationDuration || '0.3')} onChange={(v: number) => updateStyle('animationDuration', `${v}s`)} step={0.1} />
                                            <NumberInput label="Dly (s)" value={parseFloat(style.animationDelay || '0')} onChange={(v: number) => updateStyle('animationDelay', `${v}s`)} step={0.1} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Section>

                        <Section title="Hover Effects">
                            <div className="space-y-3">
                                <Row label="Effect">
                                    <SelectInput
                                        value={props.hoverEffect || 'none'}
                                        onChange={(v: string) => updateProp('hoverEffect', v)}
                                        options={[
                                            { value: 'none', label: 'None' },
                                            { value: 'lift', label: 'Lift Up' },
                                            { value: 'scale', label: 'Scale Up' },
                                            { value: 'glow', label: 'Glow' },
                                            { value: 'border', label: 'Blue Border' },
                                            { value: 'opacity', label: 'Dim Opacity' }
                                        ]}
                                    />
                                </Row>
                                {props.hoverEffect && props.hoverEffect !== 'none' && (
                                    <div className="text-[10px] text-[#666] bg-[#252526] p-2 rounded border border-[#3e3e42] flex items-start gap-2">
                                        <Hand size={12} className="mt-0.5" />
                                        <span>Effect plays when user hovers over this element.</span>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section title="Actions">
                            <div className="p-4 text-center text-xs text-[#666]">
                                Click actions (Link, Scroll, Modal) coming soon.
                            </div>
                        </Section>
                    </>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === 'settings' && (
                    <>
                        <Section title="Metadata">
                            <Row label="ID">
                                <TextInput
                                    value={element.id}
                                    onChange={() => { }}
                                    icon={Hash}
                                />
                            </Row>
                            <div className="mt-2 text-[10px] text-[#555]">
                                Unique identifier used for code generation.
                            </div>
                        </Section>

                        <Section title="Custom Attributes">
                            <div className="p-4 text-center text-xs text-[#666]">
                                ARIA labels and data attributes configuration coming soon.
                            </div>
                        </Section>
                    </>
                )}

            </div>
        </div>
    );
};
