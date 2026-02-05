import { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { useContainer } from '../context/ContainerContext';
import { generateAppTsx, sanitizeFilename } from '../utils/fileSystem';
import { generateCode } from '../utils/codeGenerator';

// STATIC CONTENT FOR LIBRARY FILES
const COMPONENT_FILES = {
    'src/components/SmartComponents.tsx': `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';

export const SmartAccordion = ({ items = [] }: any) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    return (
        <div className="w-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
            {(items.length > 0 ? items : [{title: 'Accordion Item', content: 'Content goes here'}]).map((item: any, i: number) => (
                <div key={i} className="border-b border-zinc-800 last:border-0">
                    <button 
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                        <span className="font-medium text-zinc-200">{item.title}</span>
                        <ChevronDown className={\`text-zinc-500 transition-transform \${openIndex === i ? 'rotate-180' : ''}\`} size={16} />
                    </button>
                    {openIndex === i && (
                        <div className="px-4 py-3 text-sm text-zinc-400 bg-black/20 animate-in slide-in-from-top-1">
                            {item.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const SmartCarousel = () => <div className="p-8 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl text-center text-zinc-500">Carousel Component</div>;
export const SmartTable = () => <div className="p-8 bg-zinc-900 border border-dashed border-zinc-700 rounded-xl text-center text-zinc-500">Table Component</div>;
`,
    'src/components/HeroGeometric.tsx': `
import React from "react";
export const HeroGeometric = () => (
    <div className="relative min-h-[600px] w-full flex items-center justify-center bg-[#030303] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10" />
        <div className="relative z-10 text-center px-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">Design at the speed of thought</h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">Vectra combines visual precision with production-ready code generation.</p>
            <div className="flex items-center justify-center gap-4">
                <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all">Get Started</button>
                <button className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all">Documentation</button>
            </div>
        </div>
    </div>
);
`,
    'src/components/FeatureHover.tsx': `
import React from 'react';
export const FeaturesSectionWithHoverEffects = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 bg-black">
        {[1,2,3].map(i => (
            <div key={i} className="group p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Feature {i}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">Experience a new standard of performance and reliability in your workflow.</p>
            </div>
        ))}
    </div>
);
`,
    'src/components/GeometricShapes.tsx': `
import React from 'react';
export const GeometricShapesBackground = () => <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">Geometric Shapes Background</div>;
`
};

export const useFileSync = () => {
    const { elements, interaction } = useEditor();
    const { writeFile, status } = useContainer();
    const lastSyncedRef = useRef<string>("");
    const librariesWrittenRef = useRef(false);

    useEffect(() => {
        // We ensure status is ready before writing libraries or syncing
        if (status !== 'ready') return;

        // 1. Write Library Files ONCE (dependency injection)
        if (!librariesWrittenRef.current) {
            const writeLibs = async () => {
                try {
                    for (const [path, content] of Object.entries(COMPONENT_FILES)) {
                        await writeFile(path, content);
                    }
                    librariesWrittenRef.current = true;
                    console.log("[Vectra] Library components initialized in WebContainer.");
                } catch (e) {
                    console.error("[Vectra] Failed to write initial libraries:", e);
                }
            };
            writeLibs();
        }

        if (interaction?.type === 'MOVE' || interaction?.type === 'RESIZE') return;

        const sync = async () => {
            const currentString = JSON.stringify(elements);
            if (currentString === lastSyncedRef.current) return;

            try {
                const rootIds = elements['page-home']?.children || [];

                // A. Sync individual components
                for (const rootId of rootIds) {
                    const node = elements[rootId];
                    if (!node) continue;

                    const code = generateCode(elements, rootId);
                    const fileName = sanitizeFilename(node.name);
                    await writeFile(`src/components/${fileName}.tsx`, code);
                }

                // B. Sync App Structure
                const appTsx = generateAppTsx(elements, 'page-home');
                await writeFile('src/App.tsx', appTsx);

                lastSyncedRef.current = currentString;
                console.log("[Vectra] Sync: Project structure updated.");
            } catch (e) {
                console.error("[Vectra] Sync failed:", e);
            }
        };

        const timer = setTimeout(sync, 500);
        return () => clearTimeout(timer);

    }, [elements, interaction, status, writeFile]);
};
