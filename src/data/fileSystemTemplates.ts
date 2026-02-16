import type { FileSystemTree } from '@webcontainer/api';

// --- 1. UTILS ---
const UTILS_CODE = `
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
`;

// --- 2. MARKETPLACE COMPONENT SOURCE CODE ---

const HERO_GEOMETRIC_CODE = `
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function HeroGeometric({ badge = "KOKONUT UI", title1 = "Elevate Your", title2 = "Digital Vision", style }: any) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]" style={style}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-[100px]" />
            <div className="absolute right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-[80px]" />
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12">
                <span className="text-sm text-white/60 tracking-wide">{badge}</span>
             </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">{title1}</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">{title2}</span>
            </h1>
        </div>
    </div>
  );
}
`;

const FEATURE_HOVER_CODE = `
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import * as Lucide from "lucide-react";

export default function FeatureHover({
  title = "Smart Hover",
  description = "Interactive cards that respond to your cursor.",
  icon = "Sparkles",
  style,
  className
}: any) {
  const Icon = Lucide[icon] || Lucide.Sparkles;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "group relative p-8 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden cursor-pointer backdrop-blur-sm",
        className
      )}
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-300 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300">
          <Icon size={24} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
        
        <p className="text-zinc-400 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
`;

const GEOMETRIC_SHAPES_CODE = `
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function GeometricShapes({ style, className }: any) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden min-h-[300px] bg-slate-950", className)} style={style}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 border border-slate-700/30 rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-slate-600/20 rounded-full border-dashed"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
    </div>
  );
}
`;

// --- 3. SMART UNIVERSAL RENDERER (App.tsx) ---
const RENDERER_CODE = `
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import HeroGeometric from './components/marketplace/HeroGeometric';
import FeatureHover from './components/marketplace/FeatureHover';
import GeometricShapes from './components/marketplace/GeometricShapes';

const getMotionProps = (props) => {
  const motionProps = {};
  
  if (props.hoverEffect && props.hoverEffect !== 'none') {
      switch(props.hoverEffect) {
          case 'lift': 
              motionProps.whileHover = { y: -5 }; 
              break;
          case 'scale': 
              motionProps.whileHover = { scale: 1.05 }; 
              break;
          case 'glow': 
              motionProps.whileHover = { boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)" }; 
              break;
          case 'border':
              motionProps.whileHover = { borderColor: "#3b82f6", borderWidth: "1px", borderStyle: "solid" };
              break;
          case 'opacity':
              motionProps.whileHover = { opacity: 0.7 };
              break;
      }
      motionProps.transition = { type: "spring", stiffness: 300, damping: 20 };
  }

  if (props.animation && props.animation !== 'none') {
      const duration = parseFloat(props.animationDuration || '0.5');
      const delay = parseFloat(props.animationDelay || '0');
      
      motionProps.transition = { duration, delay, ease: "easeOut" };
      
      switch(props.animation) {
          case 'fade': 
              motionProps.initial = { opacity: 0 }; 
              motionProps.animate = { opacity: 1 }; 
              break;
          case 'slide-up': 
              motionProps.initial = { opacity: 0, y: 30 }; 
              motionProps.animate = { opacity: 1, y: 0 }; 
              break;
          case 'slide-left': 
              motionProps.initial = { opacity: 0, x: -30 }; 
              motionProps.animate = { opacity: 1, x: 0 }; 
              break;
          case 'scale-in': 
              motionProps.initial = { opacity: 0, scale: 0.8 }; 
              motionProps.animate = { opacity: 1, scale: 1 }; 
              break;
      }
  }

  return motionProps;
};

const resolveComponent = (type, props) => {
  if (type === 'hero_geometric') return <HeroGeometric {...props} />;
  if (type === 'feature_hover') return <FeatureHover {...props} />;
  if (type === 'geometric_shapes') return <GeometricShapes {...props} />;
  
  if (type === 'icon') { 
      const Icon = Lucide[props.iconName || props.icon] || Lucide.HelpCircle; 
      return <motion.div style={{ display: 'inline-flex' }} {...props}><Icon size={props.iconSize || 24} /></motion.div>; 
  }
  
  if (['container', 'section', 'div', 'card', 'stack_v', 'stack_h', 'grid', 'flex', 'webpage', 'canvas'].includes(type)) {
      return <motion.div {...props} />;
  }

  if (type === 'text') return <motion.p {...props} />;
  if (type === 'heading') return <motion.h1 {...props} />;
  if (type === 'image') return <motion.img {...props} />;
  if (type === 'button') return <motion.button {...props} />;
  if (type === 'input') return <motion.input {...props} />;
  
  return <motion.div {...props} />;
};

const RenderNode = ({ nodeId, nodes, isRootFrame = false }) => {
  const node = nodes[nodeId];
  if (!node) return null;

  const isLeaf = ['image', 'input', 'icon', 'hero_geometric', 'feature_hover', 'geometric_shapes'].includes(node.type);
  
  let children = null;
  if (node.children && node.children.length > 0 && !isLeaf) {
      children = node.children.map(cid => <RenderNode key={cid} nodeId={cid} nodes={nodes} />);
  }

  const { style, className, ...rest } = node.props || {};
  let finalStyle = { ...style };
  
  if (isRootFrame || node.type === 'webpage') {
      finalStyle = {
          ...finalStyle,
          position: 'relative',
          top: 'auto',
          left: 'auto',
          width: '100%',
          height: 'auto',
          minHeight: '100vh',
          transform: 'none',
          boxShadow: 'none',
          border: 'none',
      };
  }

  const motionProps = getMotionProps(node.props);

  const finalClass = twMerge(clsx(className));
  
  const finalProps = { 
    style: finalStyle, 
    className: finalClass,
    ...rest, 
    ...node.props,
    ...motionProps,
    src: node.src,
    text: node.text,
    href: node.href,
    placeholder: node.placeholder,
    iconName: node.icon
  };

  const element = resolveComponent(node.type, finalProps);

  if (node.props?.linkTo) {
      return <Link to={node.props.linkTo} className="contents">{isLeaf ? element : React.cloneElement(element, {}, children)}</Link>;
  }

  if (isLeaf) return element;
  return React.cloneElement(element, {}, node.content || children);
};

const PageRenderer = ({ pageId, nodes }) => {
    const pageNode = nodes[pageId];
    if (!pageNode) return null;

    let rootFrameId = null;
    if (pageNode.children) {
        rootFrameId = pageNode.children.find(cid => nodes[cid]?.type === 'webpage');
        if (!rootFrameId && pageNode.children.length > 0) rootFrameId = pageNode.children[0];
    }

    if (!rootFrameId) return <div className="p-10 text-center text-slate-400">Empty Page</div>;
    return <RenderNode nodeId={rootFrameId} nodes={nodes} isRootFrame={true} />;
};

const DataLoader = () => {
    const [data, setData] = useState(null);
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch('/src/data/project.json?t=' + Date.now());
                if(res.ok) setData(await res.json());
            } catch(e) { console.error(e); }
        };
        fetchProject();
        const interval = setInterval(fetchProject, 500); 
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="flex h-screen items-center justify-center text-slate-500 bg-white">Loading Preview...</div>;
    const { pages, elements } = data;
    
    return (
        <Routes>
            {pages.map(p => (
                <Route key={p.id} path={p.slug} element={
                    <div className="min-h-screen bg-white">
                        <PageRenderer pageId={p.rootId} nodes={elements} />
                    </div>
                } />
            ))}
            <Route path="*" element={<div className="p-10 text-center">404</div>} />
        </Routes>
    );
};

export default function App() {
  return <BrowserRouter><DataLoader /></BrowserRouter>;
}
`;

// Export for dynamic sync
export { RENDERER_CODE };

// --- 4. FILE SYSTEM STRUCTURE ---
export const VITE_REACT_TEMPLATE: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: "vectra-app",
        type: "module",
        scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.263.1",
          "framer-motion": "^10.16.4",
          "clsx": "^2.0.0",
          "tailwind-merge": "^1.14.0",
          "react-router-dom": "^6.14.1"
        },
        devDependencies: {
          "@vitejs/plugin-react-swc": "^3.3.2",
          "tailwindcss": "^3.3.3",
          "vite": "^4.4.5",
          "autoprefixer": "^10.4.14",
          "postcss": "^8.4.27"
        }
      }, null, 2)
    }
  },
  'vite.config.ts': {
    file: { contents: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react-swc'; export default defineConfig({ plugins: [react()] });` }
  },
  'tailwind.config.js': {
    file: { contents: `export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./src/tailwind-gen.js"], theme: { extend: {} }, plugins: [] }` }
  },
  'postcss.config.js': {
    file: { contents: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }` }
  },
  'index.html': {
    file: { contents: `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Vectra</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>` }
  },
  'src': {
    directory: {
      'lib': { directory: { 'utils.ts': { file: { contents: UTILS_CODE } } } },
      'components': {
        directory: {
          'marketplace': {
            directory: {
              'HeroGeometric.tsx': { file: { contents: HERO_GEOMETRIC_CODE } },
              'FeatureHover.tsx': { file: { contents: FEATURE_HOVER_CODE } },
              'GeometricShapes.tsx': { file: { contents: GEOMETRIC_SHAPES_CODE } }
            }
          }
        }
      },
      'main.tsx': {
        file: { contents: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);` }
      },
      'index.css': {
        file: { contents: `@tailwind base; @tailwind components; @tailwind utilities;` }
      },
      'App.tsx': { file: { contents: RENDERER_CODE } },
      'data': { directory: { 'project.json': { file: { contents: `{"pages":[], "elements":{}}` } } } },
      'tailwind-gen.js': { file: { contents: '// Auto-generated' } }
    }
  }
};
