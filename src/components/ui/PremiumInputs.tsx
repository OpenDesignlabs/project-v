import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ChevronDown, Pipette } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- 1. IOS-STYLE SWITCH ---
export const Switch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={cn(
            "w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            checked ? "bg-blue-600" : "bg-slate-300"
        )}
    >
        <div className={cn(
            "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
        )} />
    </button>
);

// --- 2. DRAGGABLE LABEL SLIDER ---
// Mimics tools where dragging the label "Opacity" changes the value.
export const DraggableLabel = ({ label, value, onChange, min = 0, max = 100 }: any) => {
    const startX = useRef<number>(0);
    const startVal = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        startX.current = e.clientX;
        startVal.current = typeof value === 'number' ? value : 0;
        document.body.style.cursor = 'ew-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX.current;
        const newValue = Math.min(Math.max(startVal.current + delta, min), max);
        onChange(newValue);
    };

    const handleMouseUp = () => {
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="flex items-center justify-between group cursor-ew-resize select-none" onMouseDown={handleMouseDown}>
            {/* Lighter Text for Label */}
            <span className="text-[10px] font-medium text-[#999999] group-hover:text-[#007acc] transition-colors cursor-ew-resize">
                {label}
            </span>
            {/* Darker Value Text */}
            <div className="text-xs text-[#cccccc] font-mono hover:text-white transition-colors">{Math.round(value)}</div>
        </div>
    );
};

// --- 3. PREMIUM COLOR POPOVER ---
export const ColorPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                // Dark Input Style
                className="flex items-center gap-2 w-full bg-[#252526] border border-[#3e3e42] rounded px-2 py-1 hover:border-[#555] transition-colors group"
            >
                <div className="w-4 h-4 rounded-full border border-[#444]" style={{ backgroundColor: value }} />
                <span className="text-xs text-[#cccccc] font-mono flex-1 text-left">{value || 'None'}</span>
                <ChevronDown size={12} className="text-[#858585] group-hover:text-white" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-[#252526] border border-[#3e3e42] rounded-xl shadow-2xl p-3 w-[200px] animate-in fade-in zoom-in-95 duration-100">
                    <HexColorPicker color={value} onChange={onChange} style={{ width: '100%', height: '120px' }} />
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-[#333333] rounded px-2 py-1 text-xs text-[#cccccc] font-mono uppercase border border-[#3e3e42]">
                            {value}
                        </div>
                        <button className="p-1.5 bg-[#333333] hover:bg-[#3e3e42] rounded text-[#cccccc]">
                            <Pipette size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
