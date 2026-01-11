import { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { generateCode, copyToClipboard } from '../utils/codeGenerator';
import {
    LayoutDashboard, Play, Undo, Redo, Code,
    PenTool, X, Copy, Check
} from 'lucide-react';

export const Header = () => {
    const { history, previewMode, setPreviewMode, elements, activePageId } = useEditor();
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
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <LayoutDashboard size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 leading-none">Vectra</span>
                        <span className="text-[10px] text-slate-500 font-medium">v5.0 Stable</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={history.undo}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={16} />
                    </button>
                    <button
                        onClick={history.redo}
                        className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={16} />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-2" />

                    <button
                        onClick={handleGenerate}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                    >
                        <Code size={14} />
                        <span>Export</span>
                    </button>

                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ml-2 ${previewMode
                                ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        {previewMode ? <PenTool size={12} /> : <Play size={12} />}
                        {previewMode ? 'Edit Mode' : 'Preview'}
                    </button>
                </div>
            </div>

            {/* Code Export Modal */}
            {showCode && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2">
                                <Code className="text-blue-600" size={20} />
                                <span className="font-bold text-slate-800">React Export</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                                <button
                                    onClick={() => setShowCode(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Code Content */}
                        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6 custom-scrollbar">
                            <pre className="text-sm font-mono text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                                <code>{code}</code>
                            </pre>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
                            💡 Tip: This code uses Tailwind CSS classes. Ensure Tailwind is configured in your project.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
