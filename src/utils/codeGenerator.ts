import type { VectraProject, VectraNode } from '../types';

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

export const generateCode = (elements: VectraProject, rootId: string): string => {

    // Helper: Generate clean style object
    const getCleanStyle = (node: VectraNode, parent: VectraNode | null): string => {
        const style = { ...node.props.style };

        // Remove positioning for flex children
        if (parent?.props.layoutMode === 'flex') {
            delete style.position; delete style.left; delete style.top; delete style.transform;
        }

        // Remove empty values
        Object.keys(style).forEach(key => {
            const k = key as keyof React.CSSProperties;
            if (style[k] === undefined || style[k] === '' || style[k] === null) {
                delete style[k];
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

    // Recursive Generator
    const generateNode = (nodeId: string, indent: number, parentId: string | null): string => {
        const node = elements[nodeId];
        if (!node || node.hidden) return '';

        const parent = parentId ? elements[parentId] : null;
        const spaces = '  '.repeat(indent);
        const propsStr = getPropsString(node, parent);

        // 1. Handle Special Components (Smart/Marketplace)
        if (SPECIAL_COMPONENTS[node.type]) {
            const compName = SPECIAL_COMPONENTS[node.type].name;
            // Pass all props for smart components
            return `${spaces}<${compName} {...${JSON.stringify(node.props)}} />\n`;
        }

        // 2. Handle Standard Elements
        if (node.type === 'text') return `${spaces}<p${propsStr}>${node.content || ''}</p>\n`;
        if (node.type === 'heading') return `${spaces}<h1${propsStr}>${node.content || ''}</h1>\n`;
        if (node.type === 'button') return `${spaces}<button${propsStr}>${node.content || 'Button'}</button>\n`;

        if (node.type === 'image') {
            const src = node.src || 'https://via.placeholder.com/150';
            return `${spaces}<img src="${src}" alt="${node.name}"${propsStr} />\n`;
        }

        if (node.type === 'input') {
            const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : '';
            return `${spaces}<input type="text"${propsStr}${placeholder} />\n`;
        }

        if (node.type === 'icon') {
            const name = node.props.iconName || 'Star';
            return `${spaces}<${name} size={${node.props.iconSize || 24}}${propsStr} />\n`;
        }

        // 3. Handle Containers
        const hasChildren = node.children && node.children.length > 0;
        const tag = (node.type === 'canvas' || node.type === 'webpage') ? 'main' : 'div';

        if (!hasChildren) return `${spaces}<${tag}${propsStr} />\n`;

        const childrenCode = node.children!
            .map(childId => generateNode(childId, indent + 1, nodeId))
            .join('');

        return `${spaces}<${tag}${propsStr}>\n${childrenCode}${spaces}</${tag}>\n`;
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
