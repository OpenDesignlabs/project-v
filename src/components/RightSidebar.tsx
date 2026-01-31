import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { Section, Row, NumberInput, ColorInput, ToggleGroup, BoxModel, TextInput, SelectInput } from './ui/PremiumInputs';
import {
    AlignLeft, AlignCenter, AlignRight,
    Grid, Box, Maximize, Lock, Eye,
    Type, ArrowRight, ArrowDown, Image as ImageIcon, PaintBucket, RotateCw, Layers, MousePointer2
} from 'lucide-react';
import { cn } from '../lib/utils';

export const RightSidebar = () => {
    // FIX: Added previewMode to destructuring
    const { elements, selectedId, updateProject, previewMode } = useEditor();
    const element = selectedId ? elements[selectedId] : null;
    const [bgMode, setBgMode] = useState<'color' | 'image'>('color');

    // NEW: Animation Scope State ('single' = Selected Element, 'all' = All siblings in Frame)
    const [animScope, setAnimScope] = useState<'single' | 'all'>('single');

    // FIX: Hide sidebar completely in Preview Mode
    if (previewMode) return null;

    if (!element) {
        return (
            <div className="w-[280px] bg-[#1e1e1e] border-l border-[#252526] h-full flex flex-col items-center justify-center text-[#666]">
                <p className="text-xs">Select an element to edit</p>
            </div>
        );
    }

    const updateStyle = (key: string, value: any) => {
        const newElements = { ...elements };
        const unitlessKeys = ['fontWeight', 'opacity', 'zIndex', 'flexGrow', 'scale', 'lineHeight'];
        const finalValue = (typeof value === 'number' && !unitlessKeys.includes(key)) ? `${value}px` : value;

        // 1. DETERMINE TARGETS
        let targetIds = [element.id]; // Default: Just the selected element

        if (animScope === 'all' && key.startsWith('animation')) {
            // Find the Parent Frame (Artboard)
            const parentId = Object.keys(elements).find(k => elements[k].children?.includes(element.id));
            if (parentId) {
                const parent = elements[parentId];
                // If parent is an Artboard/Page, target ALL its children (The templates/sections)
                if (parent.type === 'webpage' || parent.type === 'canvas' || parent.type === 'page') {
                    targetIds = parent.children || [];
                }
            }
        }

        // 2. BATCH UPDATE
        targetIds.forEach(id => {
            const currentStyle = newElements[id].props.style || {};

            // Auto-set Animation defaults if selecting a type
            let mergeStyle = {};
            if (key === 'animationName' && value !== 'none' && !currentStyle.animationDuration) {
                mergeStyle = {
                    animationDuration: '0.5s',
                    animationFillMode: 'both'
                };
            }

            newElements[id].props.style = {
                ...currentStyle,
                [key]: finalValue,
                ...mergeStyle
            };
        });

        updateProject(newElements);
    };

    // FORCE REPLAY FUNCTION (Works with Scope)
    const replayAnimation = () => {
        updateStyle('--anim-trigger', Date.now());
    };

    const updateProp = (key: string, value: any) => {
        const newElements = { ...elements };
        newElements[element.id].props = { ...newElements[element.id].props, [key]: value };
        updateProject(newElements);
    };

    const style = element.props.style || {};
    const getVal = (val: any, fallback: any = 0) => parseInt(String(val || fallback).replace('px', ''));
    const handleBoxModelChange = (field: string, value: string) => updateStyle(field, parseInt(value) || 0);

    return (
        <div className="w-[280px] bg-[#1e1e1e] border-l border-[#252526] h-full flex flex-col overflow-y-auto custom-scrollbar">

            {/* IDENTITY HEADER */}
            <div className="p-3 border-b border-[#252526] bg-[#1e1e1e] sticky top-0 z-20">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-[#007acc] text-white px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                        {element.type === 'text' ? <Type size={10} /> : <Box size={10} />}
                        {element.type}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, locked: !element.locked } })} className={cn("p-1 rounded hover:bg-[#333]", element.locked ? "text-red-400" : "text-[#666]")}><Lock size={12} /></button>
                        <button onClick={() => updateProject({ ...elements, [element.id]: { ...element, hidden: !element.hidden } })} className={cn("p-1 rounded hover:bg-[#333]", element.hidden ? "text-[#666]" : "text-[#ccc]")}><Eye size={12} /></button>
                    </div>
                </div>
                <input
                    value={element.name}
                    onChange={(e) => updateProject({ ...elements, [element.id]: { ...element, name: e.target.value } })}
                    className="w-full bg-transparent text-sm font-bold text-white focus:bg-[#252526] px-1 rounded outline-none border border-transparent focus:border-[#007acc] transition-all"
                />
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
                {element.props.layoutMode === 'flex' && (
                    <div className="mt-2 space-y-2 p-2 bg-[#252526] rounded border border-[#3e3e42]">
                        <Row label="Dir">
                            <ToggleGroup value={style.flexDirection || 'row'} onChange={(v: string) => updateStyle('flexDirection', v)}
                                options={[{ value: 'row', icon: <ArrowRight size={12} /> }, { value: 'column', icon: <ArrowDown size={12} /> }]}
                            />
                        </Row>
                        <Row label="Align">
                            <ToggleGroup value={style.alignItems || 'stretch'} onChange={(v: string) => updateStyle('alignItems', v)}
                                options={[{ value: 'flex-start', icon: <AlignLeft size={12} className="-rotate-90" /> }, { value: 'center', icon: <AlignCenter size={12} className="-rotate-90" /> }, { value: 'flex-end', icon: <AlignRight size={12} className="-rotate-90" /> }]}
                            />
                        </Row>
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

            {/* ANIMATION */}
            <Section title="Animation">
                <div className="space-y-3">
                    {/* SCOPE TOGGLE: Apply to One or All */}
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
                            {/* REPLAY BUTTON */}
                            <button
                                onClick={replayAnimation}
                                className="p-1 bg-[#333] border border-[#3e3e42] rounded hover:bg-[#444] text-[#ccc] hover:text-white transition-colors"
                                title="Replay Animation"
                            >
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
                            <Row label="Ease">
                                <SelectInput
                                    value={style.animationTimingFunction || 'ease'} onChange={(v: string) => updateStyle('animationTimingFunction', v)}
                                    options={[{ value: 'ease', label: 'Ease' }, { value: 'linear', label: 'Linear' }, { value: 'ease-in-out', label: 'Smooth' }, { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Spring' }]}
                                />
                            </Row>
                        </>
                    )}
                </div>
            </Section>

            {/* TRANSFORM */}
            <Section title="Transform">
                <Row label="Opacity"><input type="range" min="0" max="1" step="0.01" value={style.opacity !== undefined ? style.opacity : 1} onChange={(e) => updateStyle('opacity', e.target.value)} className="w-full h-1 bg-[#3e3e42] rounded-lg accent-[#007acc]" /></Row>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <NumberInput label="Rotate" value={getVal(style.rotate, 0)} onChange={(v: number) => updateStyle('rotate', `${v}deg`)} />
                    <NumberInput label="Scale" value={Number(style.scale) || 1} onChange={(v: number) => updateStyle('scale', v)} step={0.1} />
                </div>
                <div className="mt-2"><Row label="Z-Index"><NumberInput value={getVal(style.zIndex, 0)} onChange={(v: number) => updateStyle('zIndex', v)} /></Row></div>
            </Section>

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

            {/* TYPOGRAPHY */}
            {['text', 'button', 'heading'].includes(element.type) && (
                <Section title="Typography">
                    <Row label="Size"><NumberInput value={getVal(style.fontSize, 16)} onChange={(v: number) => updateStyle('fontSize', v)} /></Row>
                    <Row label="Weight"><NumberInput value={getVal(style.fontWeight, 400)} onChange={(v: number) => updateStyle('fontWeight', v)} step={100} min={100} max={900} /></Row>
                    <Row label="Color"><ColorInput value={style.color || '#000000'} onChange={(v) => updateStyle('color', v)} /></Row>
                    <Row label="Align">
                        <ToggleGroup value={style.textAlign || 'left'} onChange={(v: string) => updateStyle('textAlign', v)} options={[{ value: 'left', icon: <AlignLeft size={12} /> }, { value: 'center', icon: <AlignCenter size={12} /> }, { value: 'right', icon: <AlignRight size={12} /> }]} />
                    </Row>
                </Section>
            )}

            {/* BORDERS */}
            <Section title="Borders">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <NumberInput label="Radius" value={getVal(style.borderRadius)} onChange={(v: number) => updateStyle('borderRadius', v)} />
                    <NumberInput label="Width" value={getVal(style.borderWidth)} onChange={(v: number) => updateStyle('borderWidth', v)} />
                </div>
                <Row label="Color"><ColorInput value={style.borderColor || 'transparent'} onChange={(v) => updateStyle('borderColor', v)} /></Row>
            </Section>
        </div>
    );
};
