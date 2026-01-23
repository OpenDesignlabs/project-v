import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { generateCode, copyToClipboard } from '../utils/codeGenerator';
import { INITIAL_DATA } from '../data/constants';
import {
    Play, Undo, Redo, Code,
    Monitor, Smartphone, Tablet, ChevronDown, Check, X, Copy,
    Layers, Palette, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Header = () => {
    const { history, previewMode, setPreviewMode, elements, setElements, activePageId, device, setDevice, setSelectedId, viewMode, setViewMode } = useEditor();
    const [showCode, setShowCode] = useState(false);
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        const generated = generateCode(elements, activePageId);
        setCode(generated);
        setShowCode(true);
        setCopied(false);
    };

    const handleCopy = async () => {
        const success = await copyToClipboard(code);
        if (success) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    const togglePreview = () => {
        if (!previewMode) setSelectedId(null);
        setPreviewMode(!previewMode);
    };

    const handleReset = () => {
        if (confirm('Reset project to default? This will clear all changes.')) {
            setElements(INITIAL_DATA);
            localStorage.removeItem('vectra_design_v50');
            window.location.reload();
        }
    };

    return (
        <>
            <div className="h-12 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-3 shrink-0 z-50 text-white">

                {/* LEFT: Branding & Reset */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors">
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center text-[10px] font-bold shadow-lg shadow-blue-900/50">V</div>
                        <ChevronDown size={12} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xs font-medium text-gray-200">Vectra Project</span>
                        <span className="text-[9px] text-gray-500">Auto-saved</span>
                    </div>
                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 hover:bg-red-900/20 rounded transition-colors"
                        title="Reset to factory settings"
                    >
                        <RotateCcw size={10} /> Reset
                    </button>
                </div>

                {/* CENTER: View Mode + Device Switcher */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">

                    {/* View Mode Switcher (Layout vs Design) */}
                    <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/5">
                        <button
                            onClick={() => setViewMode('skeleton')}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                                viewMode === 'skeleton' ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Layers size={12} /> Layout
                        </button>
                        <button
                            onClick={() => setViewMode('visual')}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-all",
                                viewMode === 'visual' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Palette size={12} /> Design
                        </button>
                    </div>

                    {/* Device Switcher */}
                    <div className="flex items-center bg-black/30 rounded-md p-0.5 border border-white/5">
                        <button
                            onClick={() => setDevice('desktop')}
                            className={cn("p-1.5 rounded transition-all", device === 'desktop' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
                            title="Desktop (1440px)"
                        >
                            <Monitor size={14} />
                        </button>
                        <button className="p-1.5 text-gray-600 cursor-not-allowed" title="Tablet (Coming Soon)">
                            <Tablet size={14} />
                        </button>
                        <button
                            onClick={() => setDevice('mobile')}
                            className={cn("p-1.5 rounded transition-all", device === 'mobile' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
                            title="Mobile (390px)"
                        >
                            <Smartphone size={14} />
                        </button>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center text-gray-400">
                        <button onClick={history.undo} className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors" title="Undo"><Undo size={14} /></button>
                        <button onClick={history.redo} className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors" title="Redo"><Redo size={14} /></button>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <button onClick={handleGenerate} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors" title="Export Code">
                        <Code size={16} />
                    </button>

                    <button
                        onClick={togglePreview}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-all border",
                            previewMode
                                ? 'bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(22,163,74,0.4)]'
                                : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-sm'
                        )}
                    >
                        <Play size={10} fill="currentColor" />
                        {previewMode ? 'Running' : 'Preview'}
                    </button>
                </div>
            </div>

            {/* Code Modal */}
            {showCode && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1e1e1e] w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[#333]">
                        <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#252526]">
                            <span className="font-medium text-gray-200 flex items-center gap-2">
                                <Code size={16} className="text-blue-500" /> Generated React Code
                            </span>
                            <div className="flex gap-2">
                                <button onClick={handleCopy} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors">
                                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button onClick={() => setShowCode(false)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                                    <X size={18} className="text-gray-400 hover:text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-[#1e1e1e]">
                            <pre className="text-[13px] font-mono text-blue-100 leading-relaxed whitespace-pre-wrap"><code>{code}</code></pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
