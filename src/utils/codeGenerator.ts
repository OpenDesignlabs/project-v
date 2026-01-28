import type { VectraProject, VectraNode } from '../types';

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try { await navigator.clipboard.writeText(text); return true; } catch (err) { console.error('Failed to copy: ', err); return false; }
};

export const generateCode = (elements: VectraProject, rootId: string): string => {

    const getCleanStyle = (node: VectraNode, parent: VectraNode | null): string => {
        const style = { ...node.props.style };
        if (parent?.props.layoutMode === 'flex') {
            delete style.position; delete style.left; delete style.top; delete style.transform;
        }
        Object.keys(style).forEach(key => {
            if (style[key as keyof React.CSSProperties] === undefined || style[key as keyof React.CSSProperties] === '' || style[key as keyof React.CSSProperties] === null) {
                delete style[key as keyof React.CSSProperties];
            }
        });
        const entries = Object.entries(style).map(([k, v]) => {
            const value = typeof v === 'number' ? v : `"${v}"`;
            return `${k}: ${value}`;
        });
        if (entries.length === 0) return '';
        return ` style={{ ${entries.join(', ')} }}`;
    };

    const generateNode = (nodeId: string, indent: number, parentId: string | null): string => {
        const node = elements[nodeId];
        if (!node || node.hidden) return '';

        const parent = parentId ? elements[parentId] : null;
        const spaces = '  '.repeat(indent);

        let classes = node.props.className || '';

        if (node.props.layoutMode === 'flex') {
            if (!classes.includes('flex')) classes = `flex ${classes}`;

            // SMART STACKING EXPORT LOGIC
            if (node.props.stackOnMobile) {
                // If it has flex-row, replace it with responsive classes
                if (classes.includes('flex-row')) {
                    classes = classes.replace('flex-row', 'flex-col md:flex-row');
                } else if (!classes.includes('flex-col')) {
                    // Default to col on mobile, row on desktop if neither specified
                    classes += ' flex-col md:flex-row';
                }
            }
        }

        const classNameProp = classes ? ` className="${classes.trim()}"` : '';
        const styleProp = getCleanStyle(node, parent);

        if (node.type === 'text') return `${spaces}<p${classNameProp}${styleProp}>${node.content}</p>\n`;
        if (node.type === 'button') {
            let onClick = '';
            if (node.events?.onClick) {
                const evt = node.events.onClick;
                const actionLabel = 'action' in evt ? evt.action : evt.type;
                onClick = ` onClick={() => console.log('Action: ${actionLabel}')}`;
            }
            return `${spaces}<button${classNameProp}${styleProp}${onClick}>${node.content}</button>\n`;
        }
        if (node.type === 'image') {
            const src = node.src || 'https://via.placeholder.com/150';
            return `${spaces}<img src="${src}" alt="${node.name}"${classNameProp}${styleProp} />\n`;
        }
        if (node.type === 'input') {
            const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : '';
            return `${spaces}<input type="text"${classNameProp}${placeholder}${styleProp} />\n`;
        }
        if (node.type === 'icon') {
            const name = node.props.iconName || 'Star';
            return `${spaces}<${name} size={${node.props.iconSize || 24}}${classNameProp}${styleProp} />\n`;
        }

        const hasChildren = node.children && node.children.length > 0;
        const tag = (node.type === 'canvas' || node.type === 'webpage') ? 'main' : 'div';

        if (!hasChildren) return `${spaces}<${tag}${classNameProp}${styleProp} />\n`;

        const childrenCode = node.children!
            .map(childId => generateNode(childId, indent + 1, nodeId))
            .join('');

        return `${spaces}<${tag}${classNameProp}${styleProp}>\n${childrenCode}${spaces}</${tag}>\n`;
    };

    let exportRootId = rootId;
    const rootNode = elements[rootId];
    if (rootNode?.type === 'page' && rootNode.children?.[0]) {
        exportRootId = rootNode.children[0];
    }

    const iconImports = new Set<string>();
    const collectImports = (id: string) => {
        const n = elements[id];
        if (!n) return;
        if (n.type === 'icon' && n.props.iconName) iconImports.add(n.props.iconName);
        n.children?.forEach(collectImports);
    };
    collectImports(exportRootId);

    const iconImportStr = iconImports.size > 0 ? `import { ${Array.from(iconImports).join(', ')} } from 'lucide-react';\n` : '';
    const componentName = elements[exportRootId]?.name.replace(/[^a-zA-Z0-9]/g, '') || 'MyComponent';

    return `import React from 'react';
${iconImportStr}
export default function ${componentName}() {
  return (
${generateNode(exportRootId, 2, null)}  );
}`;
};
