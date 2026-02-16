import { useState, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { Wand2, Loader2, Zap, Layout } from 'lucide-react';
import { TEMPLATES } from '../data/templates';

// --- MOCK AI ENGINE ---
// Maps keywords to component templates or styles
const MOCK_AI_RESPONSES = [
    {
        keywords: ['pricing', 'price', 'plan', 'subscription'],
        label: 'Pricing Table Section',
        desc: 'Generates a 3-tier pricing card layout',
        action: 'TEMPLATE',
        payload: 'pricing_tables'
    },
    {
        keywords: ['hero', 'header', 'banner', 'intro'],
        label: 'Hero Section',
        desc: 'Generates a full-width hero with title & CTA',
        action: 'TEMPLATE',
        payload: 'hero_saas'
    },
    {
        keywords: ['feature', 'grid', 'benefit'],
        label: 'Feature Grid',
        desc: 'Showcase your features in a grid',
        action: 'TEMPLATE',
        payload: 'features_grid'
    },
    {
        keywords: ['button', 'btn', 'cta'],
        label: 'Call to Action Button',
        desc: 'Primary button with hover effects',
        action: 'NEW',
        payload: 'button'
    },
    {
        keywords: ['image', 'img', 'pic', 'photo'],
        label: 'Placeholder Image',
        desc: '400x300 placeholder image',
        action: 'NEW',
        payload: 'image'
    },
    {
        keywords: ['text', 'paragraph', 'lorem'],
        label: 'Text Block',
        desc: 'Lorem ipsum text paragraph',
        action: 'NEW',
        payload: 'text'
    }
];

export const MagicBar = () => {
    const {
        isMagicBarOpen, setMagicBarOpen,
        elements, selectedId, instantiateTemplate, componentRegistry, updateProject
    } = useEditor();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle with Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setMagicBarOpen((prev: boolean) => !prev);
            }
            if (e.key === 'Escape') setMagicBarOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setMagicBarOpen]);

    useEffect(() => {
        if (isMagicBarOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
        }
    }, [isMagicBarOpen]);

    // "AI" Processing Logic
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(() => {
            const q = query.toLowerCase();
            // Simple keyword matching (Simulates NLP)
            const matches = MOCK_AI_RESPONSES.filter(item =>
                item.keywords.some(k => q.includes(k)) || item.label.toLowerCase().includes(q)
            );
            setResults(matches);
        }, 150);

        return () => clearTimeout(timeout);
    }, [query]);

    const executeCommand = (item: any) => {
        setIsProcessing(true);

        // Simulate "Thinking" time
        setTimeout(() => {
            // 1. Instantiate Logic
            let newNodes: any = {};
            let rootId = '';

            if (item.action === 'TEMPLATE') {
                const tpl = TEMPLATES[item.payload];
                if (tpl) {
                    const res = instantiateTemplate(tpl.rootId, tpl.nodes);
                    newNodes = res.newNodes;
                    rootId = res.rootId;
                }
            } else if (item.action === 'NEW') {
                const conf = componentRegistry[item.payload];
                if (conf) {
                    rootId = `gen-${Date.now()}`;
                    newNodes = {
                        [rootId]: {
                            id: rootId, type: item.payload, name: conf.label, children: [],
                            props: { ...conf.defaultProps, style: { position: 'relative' } },
                            content: conf.defaultContent
                        }
                    };
                }
            }

            // 2. Injection Logic (Auto-Find parent)
            if (rootId && Object.keys(newNodes).length > 0) {
                const newElements = { ...elements, ...newNodes };

                // Find a valid parent container
                let parentId = selectedId;
                if (!parentId || !newElements[parentId]?.children) {
                    // Find first available canvas/container
                    parentId = Object.keys(newElements).find(k =>
                        (newElements[k].type === 'canvas' || newElements[k].type === 'container' || newElements[k].type === 'webpage') &&
                        !newElements[k].locked
                    ) || null;
                }

                if (parentId) {
                    newElements[parentId] = {
                        ...newElements[parentId],
                        children: [...(newElements[parentId].children || []), rootId]
                    };
                    updateProject(newElements);
                    setMagicBarOpen(false);
                } else {
                    alert("No valid container found to inject component.");
                }
            }

            setIsProcessing(false);
        }, 600);
    };

    if (!isMagicBarOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm transition-all">
            <div className="w-[600px] bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Input Area */}
                <div className="flex items-center p-4 border-b border-[#333] gap-3">
                    {isProcessing ? <Loader2 className="animate-spin text-[#3b82f6]" size={24} /> : <Wand2 className="text-[#3b82f6]" size={24} />}
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask AI to build something (e.g., 'Pricing Table', 'Hero')..."
                        className="flex-1 bg-transparent text-lg text-white outline-none placeholder-[#555] font-sans"
                    />
                    <div className="text-[10px] text-[#555] font-mono border border-[#333] px-2 py-1 rounded">ESC</div>
                </div>

                {/* Results Area */}
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                    {results.length === 0 && query && !isProcessing && (
                        <div className="p-8 text-center text-[#555] text-sm">
                            No smart templates found for <span className="text-white">"{query}"</span>. <br /> Try <span className="text-[#3b82f6]">"Hero"</span>, <span className="text-[#3b82f6]">"Pricing"</span>, or <span className="text-[#3b82f6]">"Button"</span>.
                        </div>
                    )}

                    {results.length === 0 && !query && (
                        <div className="p-4">
                            <div className="text-[10px] font-bold text-[#555] uppercase mb-3 tracking-widest pl-2">Suggested Commands</div>
                            <div className="grid grid-cols-2 gap-2">
                                {MOCK_AI_RESPONSES.slice(0, 4).map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(item.keywords[0])}
                                        className="text-left p-3 hover:bg-[#2a2a2c] rounded-lg border border-transparent hover:border-[#333] transition-all group"
                                    >
                                        <div className="text-xs text-[#ccc] font-bold group-hover:text-[#3b82f6] transition-colors">{item.label}</div>
                                        <div className="text-[10px] text-[#666] mt-1">{item.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        {results.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => executeCommand(item)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-[#3b82f6]/10 border border-transparent hover:border-[#3b82f6]/30 rounded-lg group transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#2a2a2c] flex items-center justify-center text-[#888] group-hover:text-[#3b82f6] group-hover:bg-[#3b82f6]/20 transition-all">
                                    {item.action === 'TEMPLATE' ? <Layout size={18} /> : <Zap size={18} />}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-bold text-white group-hover:text-[#3b82f6] transition-colors">{item.label}</div>
                                    <div className="text-xs text-[#666] mt-0.5">{item.desc}</div>
                                </div>
                                <div className="text-[10px] text-[#444] group-hover:text-[#3b82f6] font-mono opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 pr-2">
                                    ⏎ <span className="text-[8px] uppercase">Enter</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#333] bg-[#252526] flex justify-between items-center text-[10px] text-[#555] font-sans font-medium px-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Vectra AI Engine (Architect Edition)
                    </div>
                    <span>Press ⌘K to Toggle Anytime</span>
                </div>
            </div>
        </div>
    );
};
