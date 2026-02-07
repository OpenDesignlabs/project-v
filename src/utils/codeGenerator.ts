import type { VectraProject, VectraNode, Page } from '../types';

// Registry for Special Components (Smart & Marketplace)
const SPECIAL_COMPONENTS: Record<string, { name: string; path: string; isDefault?: boolean }> = {
    // Smart Components
    'accordion': { name: 'SmartAccordion', path: './SmartComponents' },
    'carousel': { name: 'SmartCarousel', path: './SmartComponents' },
    'table': { name: 'SmartTable', path: './SmartComponents' },

    // Marketplace Components
    'hero_geometric': { name: 'HeroGeometric', path: './HeroGeometric' },
    'feature_hover': { name: 'FeaturesSectionWithHoverEffects', path: './FeatureHover' },
    'geometric_bg': { name: 'GeometricShapesBackground', path: './GeometricShapes' },
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try { await navigator.clipboard.writeText(text); return true; } catch (err) { console.error('Failed to copy: ', err); return false; }
};

// Helper: Generate Framer Motion props string
const getMotionProps = (node: VectraNode): string => {
    const props: string[] = [];

    // 1. Hover Effects
    if (node.props.hoverEffect && node.props.hoverEffect !== 'none') {
        if (node.props.hoverEffect === 'scale') props.push('whileHover={{ scale: 1.05 }}');
        if (node.props.hoverEffect === 'lift') props.push('whileHover={{ y: -8 }}');
        if (node.props.hoverEffect === 'glow') props.push('whileHover={{ boxShadow: "0 10px 40px -10px rgba(0,122,204,0.5)" }}');
        if (node.props.hoverEffect === 'border') props.push('whileHover={{ borderColor: "#007acc" }}');
        if (node.props.hoverEffect === 'opacity') props.push('whileHover={{ opacity: 0.7 }}');
    }

    // 2. Entry Animations
    if (node.props.animation && node.props.animation !== 'none') {
        if (node.props.animation === 'fade') {
            props.push('initial={{ opacity: 0 }}');
            props.push('animate={{ opacity: 1 }}');
        }
        if (node.props.animation === 'slide-up') {
            props.push('initial={{ opacity: 0, y: 20 }}');
            props.push('animate={{ opacity: 1, y: 0 }}');
        }
        if (node.props.animation === 'slide-left') {
            props.push('initial={{ opacity: 0, x: -20 }}');
            props.push('animate={{ opacity: 1, x: 0 }}');
        }
        if (node.props.animation === 'scale-in') {
            props.push('initial={{ opacity: 0, scale: 0.9 }}');
            props.push('animate={{ opacity: 1, scale: 1 }}');
        }
    }

    // Add smooth transition if we have any motion props
    if (props.length > 0) {
        const duration = node.props.animationDuration !== undefined ? node.props.animationDuration : 0.3;
        const delay = node.props.animationDelay !== undefined ? node.props.animationDelay : 0;
        props.push(`transition={{ duration: ${duration}, delay: ${delay}, ease: "easeOut" }}`);
    }

    return props.join(' ');
};

// Check if node needs motion wrapper
const needsMotion = (node: VectraNode): boolean => {
    return (
        (node.props.hoverEffect && node.props.hoverEffect !== 'none') ||
        (node.props.animation && node.props.animation !== 'none')
    );
};

export const generateCode = (elements: VectraProject, rootId: string): string => {

    // Helper: Generate clean style object
    const getCleanStyle = (node: VectraNode, parent: VectraNode | null): string => {
        const style = { ...node.props.style };

        // Remove positioning for flex children
        if (parent?.props.layoutMode === 'flex') {
            delete style.position; delete style.left; delete style.top; delete style.transform;
        }

        // Remove empty values and internal animation triggers
        Object.keys(style).forEach(key => {
            const k = key as keyof React.CSSProperties;
            if (style[k] === undefined || style[k] === '' || style[k] === null) {
                delete style[k];
            }
            // Remove internal animation state
            if (key === 'animationName' || key.startsWith('--')) {
                delete (style as any)[key];
            }
        });

        const entries = Object.entries(style).map(([k, v]) => {
            const value = typeof v === 'number' ? v : `"${v}"`;
            return `${k}: ${value}`;
        });

        if (entries.length === 0) return '';
        return ` style={{ ${entries.join(', ')} }}`;
    };

    // Helper: Generate Props string
    const getPropsString = (node: VectraNode, parent: VectraNode | null) => {
        let classes = node.props.className || '';

        // Flex Layout Logic
        if (node.props.layoutMode === 'flex') {
            if (!classes.includes('flex')) classes = `flex ${classes}`;
            if (node.props.stackOnMobile) {
                if (classes.includes('flex-row')) classes = classes.replace('flex-row', 'flex-col md:flex-row');
                else if (!classes.includes('flex-col')) classes += ' flex-col md:flex-row';
            }
        }

        const classNameProp = classes ? ` className="${classes.trim()}"` : '';
        const styleProp = getCleanStyle(node, parent);

        return `${classNameProp}${styleProp}`;
    };

    // Track if we need framer-motion import
    let hasMotion = false;

    // Recursive Generator
    const generateNode = (nodeId: string, indent: number, parentId: string | null): string => {
        const node = elements[nodeId];
        if (!node || node.hidden) return '';

        const parent = parentId ? elements[parentId] : null;
        const spaces = '  '.repeat(indent);
        const propsStr = getPropsString(node, parent);

        // Check for motion requirement
        const isMotion = needsMotion(node);
        if (isMotion) hasMotion = true;
        const motionPropsStr = isMotion ? ` ${getMotionProps(node)}` : '';

        // 1. Handle Special Components (Smart/Marketplace)
        if (SPECIAL_COMPONENTS[node.type]) {
            const compName = SPECIAL_COMPONENTS[node.type].name;
            // Pass all props for smart components
            return `${spaces}<${compName} {...${JSON.stringify(node.props)}} />\n`;
        }

        // 2. Handle Standard Elements with Motion support
        if (node.type === 'text') {
            const tag = isMotion ? 'motion.p' : 'p';
            return `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || ''}</${tag}>\n`;
        }
        if (node.type === 'heading') {
            const tag = isMotion ? 'motion.h1' : 'h1';
            return `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || ''}</${tag}>\n`;
        }
        if (node.type === 'button') {
            const tag = isMotion ? 'motion.button' : 'button';
            return `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || 'Button'}</${tag}>\n`;
        }
        if (node.type === 'link') {
            const tag = isMotion ? 'motion.a' : 'a';
            const href = node.props.href ? ` href="${node.props.href}"` : '';
            return `${spaces}<${tag}${href}${propsStr}${motionPropsStr}>${node.content || 'Link'}</${tag}>\n`;
        }

        if (node.type === 'image') {
            const src = node.src || 'https://via.placeholder.com/150';
            const tag = isMotion ? 'motion.img' : 'img';
            return `${spaces}<${tag} src="${src}" alt="${node.name}"${propsStr}${motionPropsStr} />\n`;
        }

        if (node.type === 'input') {
            const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : '';
            const tag = isMotion ? 'motion.input' : 'input';
            return `${spaces}<${tag} type="text"${propsStr}${placeholder}${motionPropsStr} />\n`;
        }

        if (node.type === 'checkbox') {
            return `${spaces}<input type="checkbox"${propsStr} />\n`;
        }

        if (node.type === 'video') {
            const src = node.src || '';
            return `${spaces}<video src="${src}"${propsStr} controls />\n`;
        }

        if (node.type === 'icon') {
            const name = node.props.iconName || 'Star';
            return `${spaces}<${name} size={${node.props.iconSize || 24}}${propsStr} />\n`;
        }

        // 3. Handle Containers with Motion support
        const hasChildren = node.children && node.children.length > 0;
        let tag = (node.type === 'canvas' || node.type === 'webpage') ? 'main' : 'div';
        if (node.type === 'section') tag = 'section';
        if (node.type === 'card') tag = 'div';

        // Apply motion prefix if needed
        if (isMotion) tag = `motion.${tag}`;

        if (!hasChildren) return `${spaces}<${tag}${propsStr}${motionPropsStr} />\n`;

        const childrenCode = node.children!
            .map(childId => generateNode(childId, indent + 1, nodeId))
            .join('');

        return `${spaces}<${tag}${propsStr}${motionPropsStr}>\n${childrenCode}${spaces}</${tag}>\n`;
    };

    // --- MAIN EXECUTION ---
    let exportRootId = rootId;
    const rootNode = elements[rootId];
    if (rootNode?.type === 'page' && rootNode.children?.[0]) {
        exportRootId = rootNode.children[0];
    }

    // Collect Imports
    const iconImports = new Set<string>();
    const specialImports = new Map<string, Set<string>>(); // path -> components

    const collectImports = (id: string) => {
        const n = elements[id];
        if (!n) return;

        // Check for motion
        if (needsMotion(n)) hasMotion = true;

        // Icons
        if (n.type === 'icon' && n.props.iconName) iconImports.add(n.props.iconName);

        // Special Components
        if (SPECIAL_COMPONENTS[n.type]) {
            const { name, path } = SPECIAL_COMPONENTS[n.type];
            if (!specialImports.has(path)) specialImports.set(path, new Set());
            specialImports.get(path)!.add(name);
        }

        n.children?.forEach(collectImports);
    };
    collectImports(exportRootId);

    // Build Import Strings
    let importsStr = "import React from 'react';\n";

    // Framer Motion Import (only if needed)
    if (hasMotion) {
        importsStr += "import { motion } from 'framer-motion';\n";
    }

    // Lucide Imports
    if (iconImports.size > 0) {
        importsStr += `import { ${Array.from(iconImports).join(', ')} } from 'lucide-react';\n`;
    }

    // Special Component Imports
    specialImports.forEach((names, path) => {
        importsStr += `import { ${Array.from(names).join(', ')} } from '${path}';\n`;
    });

    const componentName = elements[exportRootId]?.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyComponent';

    return `${importsStr}
export default function ${componentName}() {
  return (
${generateNode(exportRootId, 2, null)}  );
}`;
};

// ==========================================================
// MULTI-PAGE CODE GENERATION
// ==========================================================

/**
 * Generate a single page component for React Router
 */
export const generatePageCode = (elements: VectraProject, rootId: string, componentName: string): string => {
    const rootNode = elements[rootId];

    // SAFETY: If page doesn't exist, return a valid fallback component
    if (!rootNode) {
        return `import React from 'react';

export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400">Page not found: ${rootId}</p>
    </div>
  );
}
`;
    }

    // Navigate to the actual content root:
    // Page -> Canvas/Webpage (frame) -> Children
    let contentRootId = rootId;

    // If this is a 'page' node, get its first child (the canvas/frame)
    if (rootNode.type === 'page' && rootNode.children?.[0]) {
        contentRootId = rootNode.children[0];
    }

    const contentRoot = elements[contentRootId];

    // Track imports
    let hasMotion = false;
    let hasLink = false;
    const iconImports = new Set<string>();
    const specialImports = new Map<string, Set<string>>();

    // Helper functions
    const getCleanStyle = (node: VectraNode, parent: VectraNode | null): string => {
        const style = { ...node.props.style };
        if (parent?.props.layoutMode === 'flex') {
            delete style.position; delete style.left; delete style.top; delete style.transform;
        }
        Object.keys(style).forEach(key => {
            const k = key as keyof React.CSSProperties;
            if (style[k] === undefined || style[k] === '' || style[k] === null) delete style[k];
            if (key === 'animationName' || key.startsWith('--')) delete (style as any)[key];
        });
        const entries = Object.entries(style).map(([k, v]) => {
            const value = typeof v === 'number' ? v : `"${v}"`;
            return `${k}: ${value}`;
        });
        if (entries.length === 0) return '';
        return ` style={{ ${entries.join(', ')} }}`;
    };

    const getPropsString = (node: VectraNode, parent: VectraNode | null) => {
        let classes = node.props.className || '';
        if (node.props.layoutMode === 'flex') {
            if (!classes.includes('flex')) classes = `flex ${classes}`;
            if (node.props.stackOnMobile) {
                if (classes.includes('flex-row')) classes = classes.replace('flex-row', 'flex-col md:flex-row');
                else if (!classes.includes('flex-col')) classes += ' flex-col md:flex-row';
            }
        }
        const classNameProp = classes ? ` className="${classes.trim()}"` : '';
        const styleProp = getCleanStyle(node, parent);
        return `${classNameProp}${styleProp}`;
    };

    const getMotionProps = (node: VectraNode): string => {
        const props: string[] = [];
        if (node.props.hoverEffect && node.props.hoverEffect !== 'none') {
            if (node.props.hoverEffect === 'scale') props.push('whileHover={{ scale: 1.05 }}');
            if (node.props.hoverEffect === 'lift') props.push('whileHover={{ y: -8 }}');
            if (node.props.hoverEffect === 'glow') props.push('whileHover={{ boxShadow: "0 10px 40px -10px rgba(0,122,204,0.5)" }}');
        }
        if (node.props.animation && node.props.animation !== 'none') {
            if (node.props.animation === 'fade') { props.push('initial={{ opacity: 0 }}'); props.push('animate={{ opacity: 1 }}'); }
            if (node.props.animation === 'slide-up') { props.push('initial={{ opacity: 0, y: 20 }}'); props.push('animate={{ opacity: 1, y: 0 }}'); }
        }
        if (props.length > 0) {
            const duration = node.props.animationDuration !== undefined ? node.props.animationDuration : 0.3;
            props.push(`transition={{ duration: ${duration}, ease: "easeOut" }}`);
        }
        return props.join(' ');
    };

    const needsMotionCheck = (node: VectraNode): boolean => {
        return (node.props.hoverEffect && node.props.hoverEffect !== 'none') ||
            (node.props.animation && node.props.animation !== 'none');
    };

    const generateNode = (nodeId: string, indent: number, parentId: string | null): string => {
        const node = elements[nodeId];
        if (!node || node.hidden) return '';

        const parent = parentId ? elements[parentId] : null;
        const spaces = '  '.repeat(indent);
        const propsStr = getPropsString(node, parent);
        const isMotion = needsMotionCheck(node);
        if (isMotion) hasMotion = true;
        const motionPropsStr = isMotion ? ` ${getMotionProps(node)}` : '';

        // Check for Link/Navigation
        const linkTo = node.props.linkTo;
        if (linkTo) hasLink = true;

        // Generate element code
        let elementCode = '';

        if (SPECIAL_COMPONENTS[node.type]) {
            const compName = SPECIAL_COMPONENTS[node.type].name;
            elementCode = `${spaces}<${compName} {...${JSON.stringify(node.props)}} />\n`;
            const { name, path } = SPECIAL_COMPONENTS[node.type];
            if (!specialImports.has(path)) specialImports.set(path, new Set());
            specialImports.get(path)!.add(name);
        } else if (node.type === 'text') {
            const tag = isMotion ? 'motion.p' : 'p';
            elementCode = `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || ''}</${tag}>\n`;
        } else if (node.type === 'heading') {
            const tag = isMotion ? 'motion.h1' : 'h1';
            elementCode = `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || ''}</${tag}>\n`;
        } else if (node.type === 'button') {
            const tag = isMotion ? 'motion.button' : 'button';
            elementCode = `${spaces}<${tag}${propsStr}${motionPropsStr}>${node.content || 'Button'}</${tag}>\n`;
        } else if (node.type === 'image') {
            const src = node.src || 'https://via.placeholder.com/150';
            const tag = isMotion ? 'motion.img' : 'img';
            elementCode = `${spaces}<${tag} src="${src}" alt="${node.name}"${propsStr}${motionPropsStr} />\n`;
        } else if (node.type === 'input') {
            const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : '';
            elementCode = `${spaces}<input type="text"${propsStr}${placeholder} />\n`;
        } else if (node.type === 'icon' && node.props.iconName) {
            iconImports.add(node.props.iconName);
            elementCode = `${spaces}<${node.props.iconName} size={${node.props.iconSize || 24}}${propsStr} />\n`;
        } else {
            // Container types (div, section, canvas, webpage, etc.)
            const hasChildren = node.children && node.children.length > 0;
            let tag = 'div';
            if (node.type === 'canvas' || node.type === 'webpage') tag = 'div';
            if (node.type === 'section') tag = 'section';
            if (isMotion) tag = `motion.${tag}`;

            if (!hasChildren) {
                elementCode = `${spaces}<${tag}${propsStr}${motionPropsStr} />\n`;
            } else {
                const childrenCode = node.children!.map(childId => generateNode(childId, indent + 1, nodeId)).join('');
                elementCode = `${spaces}<${tag}${propsStr}${motionPropsStr}>\n${childrenCode}${spaces}</${tag}>\n`;
            }
        }

        // Wrap in Link if linkTo is set
        if (linkTo) {
            return `${spaces}<Link to="${linkTo}" className="contents">\n${elementCode}${spaces}</Link>\n`;
        }

        return elementCode;
    };

    // Generate content from the canvas's CHILDREN, not the canvas itself
    // (The canvas is just a design-time container, we want its contents)
    let content = '';
    if (contentRoot && contentRoot.children && contentRoot.children.length > 0) {
        content = contentRoot.children.map(childId => generateNode(childId, 3, contentRootId)).join('');
    }

    // If page is empty, add a placeholder
    if (!content.trim()) {
        content = '      {/* Empty page - add elements in the editor */}\n';
    }

    // Build imports
    let importsStr = "import React from 'react';\n";
    if (hasLink) importsStr += "import { Link } from 'react-router-dom';\n";
    if (hasMotion) importsStr += "import { motion } from 'framer-motion';\n";
    if (iconImports.size > 0) importsStr += `import { ${Array.from(iconImports).join(', ')} } from 'lucide-react';\n`;
    specialImports.forEach((names, path) => {
        importsStr += `import { ${Array.from(names).join(', ')} } from '${path}';\n`;
    });

    return `${importsStr}
export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen bg-white relative overflow-x-hidden">
${content}    </div>
  );
}
`;
};


/**
 * Generate the main App.tsx with React Router
 */
export const generateRouterApp = (pages: Page[]): string => {
    const imports = pages.map(p => {
        const componentName = p.name.replace(/[^a-zA-Z0-9]/g, '');
        return `import ${componentName} from './pages/${componentName}';`;
    }).join('\n');

    const routes = pages.map(p => {
        const componentName = p.name.replace(/[^a-zA-Z0-9]/g, '');
        return `        <Route path="${p.slug}" element={<${componentName} />} />`;
    }).join('\n');

    return `import React from 'react';
import { Routes, Route } from 'react-router-dom';
${imports}

export default function App() {
  return (
    <Routes>
${routes}
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-xl text-gray-500">404 - Page Not Found</div>} />
    </Routes>
  );
}
`;
};
