# Vectra Editor - Complete Project Knowledge Base
## Created: 2026-01-28

This document contains a **COMPLETE** and detailed record of all development work, design decisions, code implementations, and technical specifications for the Vectra visual editor project.

---

# TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Complete Type Definitions](#complete-type-definitions)
3. [App Entry Point](#app-entry-point)
4. [EditorContext - Complete State Management](#editorcontext---complete-state-management)
5. [Canvas Component - Viewport & Interactions](#canvas-component---viewport--interactions)
6. [RenderNode - Element Rendering](#rendernode---element-rendering)
7. [Core Architecture](#core-architecture)
8. [Component System](#component-system)
9. [Template System](#template-system)
10. [Drag & Drop Engine](#drag--drop-engine)
11. [Snapping Engine](#snapping-engine)
12. [Layout Fixes (Critical Session)](#layout-fixes)
13. [All UI Components](#all-ui-components)
14. [Marketplace Components](#marketplace-components)
15. [Utility Functions](#utility-functions)
16. [Styling System](#styling-system)
17. [Keyboard Shortcuts](#keyboard-shortcuts)
18. [State Flow Diagram](#state-flow-diagram)
19. [File Reference Guide](#file-reference-guide)
20. [Common Issues & Fixes](#common-issues--fixes)
21. [Version History](#version-history)
3. [Phase 1: Initial Setup & Foundation](#phase-1-initial-setup--foundation)
4. [Phase 2: Component System](#phase-2-component-system)
5. [Phase 3: Drag & Drop Engine](#phase-3-drag--drop-engine)
6. [Phase 4: Layout Fixes (Critical Bugfix Session)](#phase-4-layout-fixes)
7. [Phase 5: UI Refinements](#phase-5-ui-refinements)
8. [Key Technical Solutions](#key-technical-solutions)
9. [File Reference Guide](#file-reference-guide)
10. [Common Issues & Fixes](#common-issues--fixes)

---

# PROJECT OVERVIEW

**Vectra** is a visual web design editor built with React and TypeScript. It allows users to:
- Create freeform layouts using drag-and-drop
- Add and customize UI components (buttons, text, images, etc.)
- Use pre-built templates from a marketplace
- Preview designs in real-time
- Export clean React/HTML code

## Tech Stack
- **Framework**: React 18+ with TypeScript
- **Bundler**: Vite 7.x
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

# CORE ARCHITECTURE

## Data Model (`src/types/index.ts`)

The editor uses a **flat node graph** stored in a `VectraProject` object:

```typescript
type VectraProject = Record<string, VectraElement>;

interface VectraElement {
    id: string;
    type: string;           // 'text', 'button', 'container', 'canvas', etc.
    name: string;
    children?: string[];    // IDs of child elements
    props: {
        className?: string;
        style?: React.CSSProperties;
        layoutMode?: 'canvas' | 'flex';
        // ... other props
    };
    content?: string;
    locked?: boolean;
    hidden?: boolean;
}
```

## Hybrid Layout System

Vectra uses a **Hybrid Layout Architecture**:

| Mode | Behavior | Use Case |
|------|----------|----------|
| `canvas` | Children are absolutely positioned | Artboards, design surfaces |
| `flex` | Children flow in flexbox | Stacks, responsive layouts |

The `layoutMode` property on a container determines how its children are positioned.

## Element Hierarchy

```
application-root (app)
└── page-home (page)
    ├── main-frame-desktop (webpage) [layoutMode: 'canvas']
    │   └── ... absolutely positioned children
    └── main-frame-mobile (canvas) [layoutMode: 'canvas']
        └── ... absolutely positioned children
```

---

# PHASE 1: INITIAL SETUP & FOUNDATION

## Project Initialization
- Created React + TypeScript project using Vite
- Configured TailwindCSS with custom color palette
- Set up file structure:
  ```
  src/
  ├── components/     # React components
  ├── context/        # EditorContext (global state)
  ├── data/           # Constants, templates
  ├── types/          # TypeScript definitions
  ├── utils/          # Helper functions
  └── lib/            # Shared utilities (cn, etc.)
  ```

## Editor Context (`src/context/EditorContext.tsx`)

Central state management for:
- `elements`: The VectraProject node graph
- `selectedId`: Currently selected element
- `hoveredId`: Element under cursor
- `activePageId`: Current page being edited
- `zoom`, `pan`: Canvas viewport state
- `activeTool`: Current editing tool ('select', 'type', etc.)
- `dragData`: Data being dragged (for templates/components)
- `interaction`: Current interaction state (MOVE, RESIZE, etc.)

### localStorage Persistence

```typescript
export const STORAGE_KEY = 'vectra_design_v56';

// On load:
const [elements, setElements] = useState<VectraProject>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || INITIAL_DATA; }
    catch { return INITIAL_DATA; }
});

// Auto-save (debounced):
useEffect(() => {
    const timer = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(elements)), 1000);
    return () => clearTimeout(timer);
}, [elements]);
```

---

# PHASE 2: COMPONENT SYSTEM

## Component Registry (`src/data/constants.ts`)

Components are defined in a registry with default props:

```typescript
export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
    text: {
        icon: Type,
        label: 'Text',
        category: 'basic',
        defaultProps: { className: 'text-slate-800 text-base' },
        defaultContent: 'Type something...'
    },
    button: {
        icon: Square,
        label: 'Button',
        category: 'basic',
        defaultProps: { className: 'px-5 py-2.5 bg-blue-600 text-white rounded-lg ...' },
        defaultContent: 'Click Me'
    },
    // ... more components
};
```

## Template System (`src/data/templates.ts`)

Pre-built templates with nested nodes:

```typescript
export const TEMPLATES: Record<string, TemplateConfig> = {
    hero_geometric: {
        name: 'Geometric Hero',
        category: 'Sections',
        icon: Sparkles,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Geometric Hero',
                children: ['bg-visual', 'badge', 'h1', 'p1', 'btn1', 'btn2'],
                props: {
                    className: 'bg-[#030303] overflow-hidden rounded-xl',
                    layoutMode: 'canvas',
                    style: { position: 'absolute', width: '1000px', height: '600px' }
                }
            },
            // ... child nodes
        }
    }
};
```

### Template Instantiation (`src/utils/templateUtils.ts`)

Templates are cloned with unique IDs when dropped:

```typescript
export function instantiateTemplate(rootId: string, nodes: VectraProject) {
    const idMap: Record<string, string> = {};
    const newNodes: VectraProject = {};

    // Generate new IDs
    Object.keys(nodes).forEach(oldId => {
        idMap[oldId] = `${oldId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    });

    // Clone nodes with new IDs
    Object.entries(nodes).forEach(([oldId, node]) => {
        const newId = idMap[oldId];
        newNodes[newId] = {
            ...node,
            id: newId,
            children: node.children?.map(cid => idMap[cid])
        };
    });

    return { newNodes, rootId: idMap[rootId] };
}
```

---

# PHASE 3: DRAG & DROP ENGINE

## RenderNode Component (`src/components/RenderNode.tsx`)

The core rendering and interaction component.

### Zero-Jitter Drag Physics

Uses vector math for smooth dragging:

```typescript
const dragVector = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

const handlePointerDown = (e: React.PointerEvent) => {
    if (canMove) {
        e.currentTarget.setPointerCapture(e.pointerId);
        const style = element.props.style || {};
        
        dragVector.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: parseFloat(style.left?.toString() || '0'),
            initialTop: parseFloat(style.top?.toString() || '0')
        };
        setInteraction({ type: 'MOVE', itemId: elementId });
    }
};

const handlePointerMove = (e: React.PointerEvent) => {
    if (interaction?.type === 'MOVE' && interaction.itemId === elementId) {
        const safeZoom = zoom || 1;
        const deltaX = (e.clientX - dragVector.current.startX) / safeZoom;
        const deltaY = (e.clientY - dragVector.current.startY) / safeZoom;

        const newLeft = dragVector.current.initialLeft + deltaX;
        const newTop = dragVector.current.initialTop + deltaY;

        updateProject({
            ...elements,
            [elementId]: {
                ...elements[elementId],
                props: {
                    ...elements[elementId].props,
                    style: {
                        ...elements[elementId].props.style,
                        left: `${Math.round(newLeft)}px`,
                        top: `${Math.round(newTop)}px`
                    }
                }
            }
        });
    }
};
```

**Formula**: `New Position = Start Position + (Current Mouse - Start Mouse) / Zoom`

### Template Drop Handler

```typescript
const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (!dragData || !isContainer || element.locked || previewMode) return;

    const rect = nodeRef.current?.getBoundingClientRect();
    const safeZoom = zoom || 1;
    const dropX = rect ? (e.clientX - rect.left) / safeZoom : 0;
    const dropY = rect ? (e.clientY - rect.top) / safeZoom : 0;

    if (dragData.type === 'TEMPLATE') {
        const tpl = TEMPLATES[dragData.payload];
        if (tpl) {
            const { newNodes, rootId } = instantiateTemplate(tpl.rootId, tpl.nodes);

            // CRITICAL: Initialize style object if missing
            if (!newNodes[rootId].props.style) newNodes[rootId].props.style = {};

            // Force absolute position at drop coordinates
            newNodes[rootId].props.style.position = 'absolute';
            newNodes[rootId].props.style.left = `${Math.round(dropX)}px`;
            newNodes[rootId].props.style.top = `${Math.round(dropY)}px`;

            const updatedProject = { ...elements, ...newNodes };
            updatedProject[elementId].children = [...(updatedProject[elementId].children || []), rootId];
            updateProject(updatedProject);
            setSelectedId(rootId);
        }
    }
    setDragData(null);
};
```

---

# PHASE 4: LAYOUT FIXES

## The Stacking Bug (Critical Issue)

**Problem**: Elements dropped onto the canvas were stacking vertically instead of being placed at drop coordinates.

**Root Causes**:
1. Tailwind classes (`relative`, `flex`, `w-full`) in `className` were overriding inline `style={{ position: 'absolute' }}`
2. Parent containers had flexbox classes causing children to flow
3. Stale localStorage data with corrupted layout settings
4. Reset button targeting wrong localStorage key

## The Solution: Strict CSS Enforcement

```typescript
// --- CSS PROCESSING (STRICT MODE) ---
let finalStyle: React.CSSProperties = { ...element.props.style };

// BANNED CLASSES: Anything that affects layout flow
const BANNED_CLASSES = ['w-full', 'h-full', 'relative', 'static', 'fixed', 'flex-1', 'justify-center', 'items-center', 'm-auto', 'mx-auto', 'my-auto'];

let classList = (element.props.className || '').split(' ');

// If parent is canvas, child MUST be absolute
if (isParentCanvas && !isMobileMirror) {
    finalStyle.position = 'absolute';
    if (finalStyle.left === undefined) finalStyle.left = '0px';
    if (finalStyle.top === undefined) finalStyle.top = '0px';
    
    // Remove layout blockers
    classList = classList.filter(c => !BANNED_CLASSES.includes(c));
}

// Canvas containers cannot be flex
if (element.props.layoutMode === 'canvas') {
    finalStyle.display = 'block';
    classList = classList.filter(c => !c.startsWith('flex') && !c.startsWith('grid') && !c.startsWith('gap-'));
}

let finalClass = classList.join(' ');
```

## Template Cleanup

Removed conflicting classes from all templates:
- ❌ `relative` → causes position override
- ❌ `w-full` → causes full-width stretch
- ❌ `flex` on canvas containers → causes stacking

All templates now have explicit absolute positioning:
```typescript
style: { position: 'absolute', width: '1000px', height: '600px', left: '0px', top: '0px' }
```

---

# PHASE 5: UI REFINEMENTS

## Floating Toolbar

A bottom-center toolbar with core tools:
- Select Tool
- Edit Tool (inline text editing)
- Components Drawer toggle

## View Modes

| Mode | Behavior |
|------|----------|
| `visual` | Full design with colors/images |
| `skeleton` | Wireframe outline view |

## Preview Mode

- Disables all editing interactions
- Elements respond to click events
- Simulates live website behavior

---

# KEY TECHNICAL SOLUTIONS

## 1. Centralized Storage Key

```typescript
// src/data/constants.ts
export const STORAGE_KEY = 'vectra_design_v56';
```

Imported by EditorContext and Header for consistency.

## 2. Factory Reset

To force a clean slate:
1. Bump `STORAGE_KEY` version number
2. Rebuild and refresh browser
3. Old data is ignored, `INITIAL_DATA` loads

## 3. Zoom-Aware Dragging

All position calculations divide by zoom factor:
```typescript
const deltaX = (e.clientX - startX) / zoom;
```

## 4. Pointer Capture

Using `setPointerCapture` ensures drag continues even if cursor leaves element:
```typescript
e.currentTarget.setPointerCapture(e.pointerId);
// ... on release:
e.currentTarget.releasePointerCapture(e.pointerId);
```

---

# FILE REFERENCE GUIDE

| File | Description |
|------|-------------|
| `src/context/EditorContext.tsx` | Global state management |
| `src/components/RenderNode.tsx` | Element rendering & drag logic |
| `src/components/Canvas.tsx` | Main canvas viewport |
| `src/components/Header.tsx` | Top toolbar (Undo/Redo, Preview, Export) |
| `src/components/LeftSidebar.tsx` | Layers panel, pages panel |
| `src/components/RightSidebar.tsx` | Properties panel |
| `src/components/InsertDrawer.tsx` | Component/template picker |
| `src/components/Resizer.tsx` | Resize handles for selected elements |
| `src/data/constants.ts` | Component registry, initial data, storage key |
| `src/data/templates.ts` | Pre-built template definitions |
| `src/utils/templateUtils.ts` | Template instantiation logic |
| `src/utils/codeGenerator.ts` | Export to React code |
| `src/types/index.ts` | TypeScript interfaces |

---

# COMMON ISSUES & FIXES

## Issue: Elements stacking instead of free positioning
**Fix**: Clear localStorage or bump `STORAGE_KEY` version

## Issue: Drag is jittery or offset
**Fix**: Ensure zoom is accounted for in position calculations

## Issue: Template not appearing at drop location
**Fix**: Check that `style.position = 'absolute'` is set in drop handler

## Issue: Reset button not working
**Fix**: Ensure Header.tsx imports and uses `STORAGE_KEY` constant

## Issue: CSS classes overriding inline styles
**Fix**: Filter out banned classes in RenderNode CSS processing

---

# FUTURE ROADMAP

1. **Smart Snapping**: Alignment guides when dragging
2. **Responsive Breakpoints**: Define styles per device size
3. **Real-time Collaboration**: Multi-user editing
4. **Plugin System**: Custom component marketplace
5. **Version History**: Undo tree with branching
6. **CSS-in-JS Migration**: Avoid Tailwind class conflicts

---

---

# ADDITIONAL COMPONENTS (DETAILED)

## Canvas Component (`src/components/Canvas.tsx`)

The main viewport container that renders the design canvas.

**Key Features:**
- Infinite canvas with pan and zoom
- Renders all pages and artboards
- Handles viewport transformations
- Background grid pattern
- Drop zone for templates

**Viewport Transform:**
```typescript
style={{
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: '0 0'
}}
```

**Zoom Controls:**
- Mouse wheel: Zoom in/out
- Keyboard: `Ctrl/Cmd + =` (zoom in), `Ctrl/Cmd + -` (zoom out)
- Zoom range: 0.1x to 3x

---

## LeftSidebar Component (`src/components/LeftSidebar.tsx`)

Left panel containing navigation and layer management.

**Panels:**
1. **Pages Panel** (`activePanel === 'pages'`)
   - List of all pages in project
   - Add new page button
   - Page selection/switching
   - Delete page (except home)

2. **Layers Panel** (`activePanel === 'layers'`)
   - Hierarchical tree view of elements
   - Drag to reorder elements
   - Toggle visibility (eye icon)
   - Toggle lock (lock icon)
   - Click to select element

**Layer Tree Rendering:**
```typescript
const renderLayerItem = (elementId: string, depth: number = 0) => {
    const element = elements[elementId];
    return (
        <div style={{ paddingLeft: `${depth * 16}px` }}>
            {/* Element row with name, icons */}
            {element.children?.map(childId => renderLayerItem(childId, depth + 1))}
        </div>
    );
};
```

---

## RightSidebar Component (`src/components/RightSidebar.tsx`)

Properties panel for the selected element.

**Sections:**
1. **Element Info** - Type, ID, name
2. **Position & Size** - X, Y, Width, Height inputs
3. **Layout Mode** - Canvas/Flex toggle
4. **Styling**
   - Background color picker
   - Border controls
   - Border radius
   - Padding/Margin
   - Typography (for text elements)
5. **Interactions** - Click actions, links
6. **Advanced** - Custom CSS class input

**Property Update Pattern:**
```typescript
const updateProperty = (path: string, value: any) => {
    const updated = { ...elements };
    set(updated[selectedId], path, value); // lodash set
    updateProject(updated);
};
```

---

## InsertDrawer Component (`src/components/InsertDrawer.tsx`)

Slide-out panel for adding components and templates.

**Structure:**
- **Tabs**: Components | Templates
- **Categories**: Basic, Layout, Forms, Media, Sections
- **Search**: Filter by name
- **Drag Items**: Start drag with `setDragData`

**Drag Start:**
```typescript
const handleDragStart = (type: 'COMPONENT' | 'TEMPLATE', payload: string) => {
    setDragData({ type, payload });
};
```

---

## ImportModal Component (`src/components/ImportModal.tsx`)

Modal for importing external designs.

**Import Sources:**
- Paste HTML code
- Upload JSON project file
- Import from URL (future)

**HTML Parser** (`src/utils/importHelpers.ts`):
```typescript
export function parseHtmlToNodes(html: string): VectraProject {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Recursively convert DOM to VectraElement nodes
}
```

---

## CodeRenderer Component (`src/components/CodeRenderer.tsx`)

Syntax-highlighted code display for export preview.

**Features:**
- Line numbers
- Syntax highlighting (basic)
- Copy to clipboard button
- Download as file

---

## Resizer Component (`src/components/Resizer.tsx`)

Resize handles for the selected element.

**Handle Positions:**
- Corners: `nw`, `ne`, `sw`, `se` (proportional resize)
- Edges: `n`, `s`, `e`, `w` (single-axis resize)

**Resize Logic:**
```typescript
const handleResize = (e: PointerEvent, handle: string) => {
    const deltaX = (e.clientX - startX) / zoom;
    const deltaY = (e.clientY - startY) / zoom;
    
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newLeft = initialLeft;
    let newTop = initialTop;
    
    if (handle.includes('e')) newWidth += deltaX;
    if (handle.includes('w')) { newWidth -= deltaX; newLeft += deltaX; }
    if (handle.includes('s')) newHeight += deltaY;
    if (handle.includes('n')) { newHeight -= deltaY; newTop += deltaY; }
    
    // Apply constraints (min size, etc.)
    // Update element style
};
```

---

# MARKETPLACE COMPONENTS

Custom animated/interactive components available in the template library.

## GeometricShapesBackground (`src/components/marketplace/GeometricShapes.tsx`)

Animated floating geometric shapes background.

**Features:**
- SVG-based shapes (circles, triangles, squares)
- CSS animations for floating effect
- Gradient overlays
- `pointer-events: none` for click-through

---

## FeaturesSectionWithHoverEffects (`src/components/marketplace/FeatureHover.tsx`)

Interactive feature grid with hover animations.

**Features:**
- Grid layout of feature cards
- Framer Motion hover animations
- Icon + title + description
- Gradient borders on hover

---

## HeroGeometric (`src/components/marketplace/HeroGeometric.tsx`)

Complete hero section template with geometric styling.

**Includes:**
- Animated background
- Badge/pill
- Large heading with gradient text
- Subtitle
- CTA buttons

---

# UTILITY FUNCTIONS

## codeGenerator.ts

Exports the design as clean React code.

```typescript
export function generateCode(elements: VectraProject, pageId: string): string {
    const page = elements[pageId];
    // Recursively generate JSX for each element
    // Convert inline styles to Tailwind classes where possible
    // Format with proper indentation
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
```

---

## templateUtils.ts

Template instantiation with unique IDs.

```typescript
export function instantiateTemplate(rootId: string, nodes: VectraProject) {
    const idMap: Record<string, string> = {};
    const newNodes: VectraProject = {};

    // Generate unique IDs
    Object.keys(nodes).forEach(oldId => {
        idMap[oldId] = `${oldId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    });

    // Clone with new IDs and updated children references
    Object.entries(nodes).forEach(([oldId, node]) => {
        const newId = idMap[oldId];
        newNodes[newId] = {
            ...structuredClone(node),
            id: newId,
            children: node.children?.map(cid => idMap[cid])
        };
    });

    return { newNodes, rootId: idMap[rootId] };
}
```

---

## importHelpers.ts

Utilities for importing external content.

**Functions:**
- `parseHtmlToNodes()` - Convert HTML string to VectraProject
- `validateImportedProject()` - Validate JSON structure
- `mergeProjects()` - Combine imported nodes with existing project

---

# STYLING SYSTEM

## Global Styles (`src/index.css`)

TailwindCSS base + custom utilities:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #1e1e1e; }
::-webkit-scrollbar-thumb { background: #3e3e42; border-radius: 4px; }

/* Editor-specific overrides */
.editor-canvas { /* ... */ }

/* Animation keyframes */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 0.2s ease-out; }
```

---

## cn() Utility (`src/lib/utils.ts`)

Tailwind class merging utility:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

---

# KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy element |
| `Ctrl/Cmd + V` | Paste element |
| `Ctrl/Cmd + D` | Duplicate element |
| `Escape` | Deselect / Close modal |
| `Space + Drag` | Pan canvas |
| `Ctrl/Cmd + 0` | Reset zoom to 100% |
| `Ctrl/Cmd + =` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |

---

# STATE FLOW DIAGRAM

```
User Action
    │
    ▼
┌─────────────────┐
│  Event Handler  │ (RenderNode, Canvas, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EditorContext  │ (setElements, updateProject)
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   React State   │  │  localStorage   │
│   (elements)    │  │  (auto-save)    │
└────────┬────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Re-render     │
│   (RenderNode)  │
└─────────────────┘
```

---

# TESTING GUIDELINES

## Manual Testing Checklist

### Drag & Drop
- [ ] Drag template from drawer → drops at cursor position
- [ ] Drag existing element → moves smoothly
- [ ] Zoom in → drag still works correctly
- [ ] Zoom out → drag still works correctly

### Layout
- [ ] Elements don't stack vertically
- [ ] Absolute positioning is maintained after refresh
- [ ] Reset button clears all data

### UI Panels
- [ ] Left sidebar panels switch correctly
- [ ] Right sidebar shows properties for selected element
- [ ] Property changes update element in real-time

### Export
- [ ] Code generation produces valid JSX
- [ ] Copy to clipboard works

---

# VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| v50 | Initial | First localStorage version |
| v51-v54 | Iterations | Layout bug attempts |
| v55 | 2026-01-28 | Fixed CSS class conflicts |
| v56 | 2026-01-28 | Finalized layout fixes, centralized STORAGE_KEY |

---

# COMPLETE TYPE DEFINITIONS (`src/types/index.ts`)

```typescript
import type { LucideIcon } from 'lucide-react';

// Action types for element interactions
export type ActionType =
    | { type: 'NAVIGATE'; payload: string }
    | { type: 'OPEN_MODAL'; payload: string }
    | { type: 'SCROLL_TO'; payload: string }
    | { type: 'TOGGLE_VISIBILITY'; payload: string }
    // New Interaction Builder Types
    | { action: 'link'; value: string }
    | { action: 'scroll'; value: string }
    | { action: 'navigate'; value: string };

// Global design tokens
export interface GlobalStyles {
    colors: Record<string, string>;
    fonts: Record<string, string>;
}

// Uploaded assets
export interface Asset {
    id: string;
    type: 'image';
    url: string;
    name: string;
}

// The core element node definition
export interface VectraNode {
    id: string;
    type: string;
    name: string;
    content?: string;
    children?: string[];
    src?: string;
    locked?: boolean;
    hidden?: boolean;
    events?: { onClick?: ActionType; };
    props: {
        className?: string;
        style?: React.CSSProperties;
        layoutMode?: 'canvas' | 'flex';
        stackOnMobile?: boolean;
        placeholder?: string;
        iconName?: string;
        iconSize?: number;
        iconClassName?: string;
        id?: string;
        [key: string]: any;
    };
}

// The complete project is a flat map of ID -> Node
export type VectraProject = Record<string, VectraNode>;

// Snap guides for alignment
export interface Guide {
    orientation: 'horizontal' | 'vertical';
    pos: number;
    start: number;
    end: number;
    label?: string;
    type: 'align' | 'gap';
}

// Component categories for the insert drawer
export type ComponentCategory = 'basic' | 'layout' | 'forms' | 'media' | 'sections';

// Component configuration for the registry
export interface ComponentConfig {
    icon: LucideIcon;
    label: string;
    category: ComponentCategory;
    defaultProps: any;
    defaultContent?: string;
    src?: string;
}

// Drag payload for components/templates
export interface DragData {
    type: 'NEW' | 'TEMPLATE' | 'ASSET';
    payload: string;
    dropIndex?: number;
    dropParentId?: string;
}

// Current interaction state (move/resize)
export interface InteractionState {
    type: 'MOVE' | 'RESIZE';
    itemId: string;
    startX?: number;
    startY?: number;
    startRect?: { left: number; top: number; width: number; height: number };
    handle?: string;
}

// Editor tools
export type EditorTool = 'select' | 'hand' | 'type';
export type DeviceType = 'desktop' | 'mobile';
export type ViewMode = 'visual' | 'skeleton';
```

---

# APP ENTRY POINT (`src/App.tsx`)

## Lazy Loading Implementation

The app uses React.lazy() for code splitting major chunks:

```typescript
import { Suspense, lazy, useEffect, useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Loader2 } from 'lucide-react';
import { ImportModal } from './components/ImportModal';

// 1. LAZY LOAD MAJOR CHUNKS (Split JS Bundle)
const Header = lazy(() => import('./components/Header').then(module => ({ default: module.Header })));
const LeftSidebar = lazy(() => import('./components/LeftSidebar').then(module => ({ default: module.LeftSidebar })));
const RightSidebar = lazy(() => import('./components/RightSidebar').then(module => ({ default: module.RightSidebar })));
const Canvas = lazy(() => import('./components/Canvas').then(module => ({ default: module.Canvas })));

// 2. LOADING SCREEN (Shown instantly)
const LoadingScreen = () => (
  <div className="w-full h-screen bg-[#1e1e1e] flex flex-col items-center justify-center text-[#999999] gap-3">
    <Loader2 size={32} className="animate-spin text-[#007acc]" />
    <span className="text-xs font-mono uppercase tracking-wider">Initializing Vectra Engine...</span>
  </div>
);
```

## Keyboard Shortcuts Implementation

```typescript
const EditorLayout = () => {
  const { history, deleteElement, selectedId, setSelectedId, toggleInsertDrawer, setActivePanel } = useEditor();
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // 1. Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        if (selectedId && !['application-root', 'page-home', 'main-frame', 'main-frame-desktop', 'main-frame-mobile'].includes(selectedId)) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }

      // 2. Undo (Ctrl+Z / Cmd+Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      }

      // 3. Redo (Ctrl+Shift+Z / Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        history.redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        history.redo();
      }

      // 4. Escape (Deselect or close modals)
      if (e.key === 'Escape') {
        if (isImportOpen) {
          setIsImportOpen(false);
        } else {
          setSelectedId(null);
        }
      }

      // 5. I key (Toggle Insert Panel)
      if (e.key === 'i' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActivePanel(prev => prev === 'add' ? null : 'add');
      }

      // 6. Ctrl+I / Cmd+I (Open Import Modal)
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !isTyping) {
        e.preventDefault();
        setIsImportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, deleteElement, selectedId, setSelectedId, toggleInsertDrawer, isImportOpen]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#1e1e1e] overflow-hidden select-none font-sans">
      <Suspense fallback={<LoadingScreen />}>
        <Header />
        <div className="flex-1 flex overflow-hidden relative">
          <LeftSidebar />
          <Canvas />
          <RightSidebar />
        </div>
      </Suspense>
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} />}
    </div>
  );
};

const App = () => (
  <EditorProvider>
    <EditorLayout />
  </EditorProvider>
);

export default App;
```

---

# EDITORCONTEXT - COMPLETE STATE MANAGEMENT

## All State Variables

```typescript
// Core Project Data
const [elements, setElements] = useState<VectraProject>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || INITIAL_DATA; }
    catch { return INITIAL_DATA; }
});

// Selection State
const [selectedId, setSelectedId] = useState<string | null>(null);
const [hoveredId, setHoveredId] = useState<string | null>(null);

// Page Navigation
const [activePageId, setActivePageId] = useState('page-home');

// Mode Toggles
const [previewMode, setPreviewMode] = useState(false);
const [viewMode, setViewMode] = useState<ViewMode>('visual');

// Tools
const [activeTool, setActiveTool] = useState<EditorTool>('select');
const [device, setDeviceState] = useState<DeviceType>('desktop');

// Drag & Drop
const [dragData, setDragData] = useState<DragData | null>(null);
const [interaction, setInteraction] = useState<InteractionState | null>(null);

// Viewport
const [zoom, setZoom] = useState(0.5);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);

// History (Undo/Redo)
const [historyStack, setHistoryStack] = useState<VectraProject[]>([INITIAL_DATA]);
const [historyIndex, setHistoryIndex] = useState(0);

// Alignment Guides
const [guides, setGuides] = useState<Guide[]>([]);

// Assets Library
const [assets, setAssets] = useState<Asset[]>([]);

// Design Tokens
const [globalStyles, setGlobalStyles] = useState<GlobalStyles>({
    colors: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b', dark: '#1e293b' },
    fonts: {}
});

// Sidebar Panel State
const [activePanel, setActivePanel] = useState<SidebarPanel>(null);

// Dynamic Component Registry
const [componentRegistry, setComponentRegistry] = useState<Record<string, ComponentConfig>>(COMPONENT_TYPES);
```

## All Functions Provided

```typescript
// Update project with history tracking
const updateProject = useCallback((newElements: VectraProject) => {
    setElements(newElements);
    setHistoryStack(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        if (newHistory.length >= 50) newHistory.shift();
        newHistory.push(newElements);
        return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
}, [historyIndex]);

// Undo
const undo = useCallback(() => {
    if (historyIndex > 0) { 
        setHistoryIndex(p => p - 1); 
        setElements(historyStack[historyIndex - 1]); 
    }
}, [historyIndex, historyStack]);

// Redo
const redo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) { 
        setHistoryIndex(p => p + 1); 
        setElements(historyStack[historyIndex + 1]); 
    }
}, [historyIndex, historyStack]);

// Delete element
const deleteElement = useCallback((id: string) => {
    if (['application-root', 'page-home', 'main-canvas'].includes(id)) return;
    const newElements = JSON.parse(JSON.stringify(elements));
    Object.keys(newElements).forEach(key => {
        if (newElements[key].children) 
            newElements[key].children = newElements[key].children.filter((cid: string) => cid !== id);
    });
    delete newElements[id];
    updateProject(newElements);
    setSelectedId(null);
}, [elements, updateProject]);

// Add page
const addPage = (name: string) => {
    const pageId = `page-${Date.now()}`;
    const canvasId = `canvas-${Date.now()}`;
    const newElements = { ...elements };
    newElements[pageId] = { 
        id: pageId, type: 'page', name: name, children: [canvasId], 
        props: { layoutMode: 'canvas', className: 'w-full h-full relative' } 
    };
    newElements[canvasId] = { 
        id: canvasId, type: 'canvas', name: 'Artboard 1', children: [], 
        props: { 
            className: 'bg-white shadow-xl relative overflow-hidden', 
            style: { position: 'absolute', left: '100px', top: '100px', width: '1440px', height: '1024px' } 
        } 
    };
    if (newElements['application-root']) {
        newElements['application-root'].children = [...(newElements['application-root'].children || []), pageId];
    }
    updateProject(newElements);
    setActivePageId(pageId);
};

// Delete page
const deletePage = (id: string) => {
    if (id === 'page-home') return;
    const newElements = { ...elements };
    if (newElements['application-root']) {
        newElements['application-root'].children = newElements['application-root'].children?.filter(cid => cid !== id);
    }
    delete newElements[id];
    updateProject(newElements);
    setActivePageId('page-home');
};

// Run interaction action (clicks, links, etc.)
const runAction = useCallback((act: ActionType) => {
    if ('action' in act) {
        if (act.action === 'link' && act.value) {
            window.open(act.value, '_blank');
        } else if (act.action === 'scroll' && act.value) {
            document.getElementById(act.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    if (act.type === 'NAVIGATE') {
        if (act.payload.startsWith('http')) { window.open(act.payload, '_blank'); return; }
        if (elements[act.payload]) { setActivePageId(act.payload); setPan({ x: 0, y: 0 }); }
    } else if (act.type === 'SCROLL_TO') {
        document.getElementById(act.payload)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (act.type === 'TOGGLE_VISIBILITY') {
        const targetId = act.payload;
        if (elements[targetId]) {
            setElements(prev => ({
                ...prev,
                [targetId]: { ...prev[targetId], hidden: !prev[targetId].hidden }
            }));
        }
    }
}, [elements]);

// Add asset (image upload)
const addAsset = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setAssets(prev => [...prev, { 
        id: `asset-${Date.now()}`, type: 'image', url: e.target?.result as string, name: file.name 
    }]);
    reader.readAsDataURL(file);
};

// Toggle sidebar panels
const togglePanel = useCallback((panel: SidebarPanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
}, []);

// Register custom component at runtime
const registerComponent = useCallback((id: string, config: ComponentConfig) => {
    setComponentRegistry(prev => {
        if (prev[id]) console.warn(`Component ${id} already exists. Overwriting.`);
        return { ...prev, [id]: config };
    });
}, []);
```

---

# CANVAS COMPONENT - VIEWPORT & INTERACTIONS

## Wheel/Zoom Handler (Native, Bypasses Browser Zoom)

```typescript
useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const onWheel = (e: WheelEvent) => {
        if (previewMode) return;

        // Check if user is pinching (trackpad) or using Ctrl+Scroll (mouse)
        if (e.ctrlKey || e.metaKey) {
            // CRITICAL: This stops the browser from zooming the whole page
            e.preventDefault();
            e.stopPropagation();

            const delta = -e.deltaY;
            const zoomFactor = 0.002; // Smaller = smoother zoom

            setZoom(prevZoom => {
                const newZoom = Math.min(Math.max(prevZoom + delta * zoomFactor, 0.1), 3);
                return newZoom;
            });
        } else {
            // Normal Scroll -> Pan the Canvas
            e.preventDefault(); // Prevents browser "swipe back" navigation
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // Add listener with passive: false to allow preventDefault()
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', onWheel);
}, [setZoom, setPan, previewMode]);
```

## Global Drop Handler for Templates

```typescript
const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragData || previewMode) return;

    // Convert screen coords to world coords
    const worldX = (e.clientX - pan.x) / zoom;
    const worldY = (e.clientY - pan.y) / zoom;
    const x = Math.round(worldX / 10) * 10; // Snap to 10px grid
    const y = Math.round(worldY / 10) * 10;

    let newNodes: Record<string, any> = {};
    let newRootId = '';

    // CASE A: It's a Template
    if (dragData.type === 'TEMPLATE') {
        const template = TEMPLATES[dragData.payload];
        if (!template) { setDragData(null); return; }

        const { rootId, newNodes: instantiatedNodes } = instantiateTemplate(template.rootId, template.nodes);
        newRootId = rootId;
        newNodes = instantiatedNodes;

        // Apply Drop Position
        if (newNodes[newRootId]?.props) {
            newNodes[newRootId].props.style = {
                ...newNodes[newRootId].props.style,
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`
            };
        }
    }
    // CASE B: It's a Simple Component
    else if (dragData.type === 'NEW') {
        const config = COMPONENT_TYPES[dragData.payload];
        if (!config) { setDragData(null); return; }

        newRootId = `el-${Date.now()}`;

        // Default Dimensions based on type
        let defaultWidth = '200px';
        let defaultHeight = '150px';
        if (dragData.payload === 'canvas') { defaultWidth = '800px'; defaultHeight = '600px'; }
        else if (dragData.payload === 'webpage') { defaultWidth = '1440px'; defaultHeight = '2000px'; }
        else if (dragData.payload === 'button') { defaultWidth = '120px'; defaultHeight = '40px'; }
        else if (['text', 'heading', 'link'].includes(dragData.payload)) { defaultWidth = 'auto'; defaultHeight = 'auto'; }

        newNodes[newRootId] = {
            id: newRootId,
            type: dragData.payload,
            name: config.label,
            content: config.defaultContent,
            children: [],
            props: {
                ...config.defaultProps,
                style: {
                    ...(config.defaultProps?.style || {}),
                    position: 'absolute',
                    left: `${x}px`, top: `${y}px`,
                    width: defaultWidth, height: defaultHeight
                }
            }
        };
    }

    // Update State
    const updatedProject = { ...elements, ...newNodes };
    if (updatedProject[activePageId]) {
        updatedProject[activePageId].children = [...(updatedProject[activePageId].children || []), newRootId];
    }
    updateProject(updatedProject);
    setSelectedId(newRootId);
    setDragData(null);
};
```

---

# SNAPPING ENGINE (COMPLETE IMPLEMENTATION)

Located in `EditorContext.tsx`, the `handleInteractionMove` function:

```typescript
const handleInteractionMove = useCallback((e: PointerEvent) => {
    if (!interaction) return;
    const { type, itemId, startX, startY, startRect, handle } = interaction;

    const currentStartX = startX || 0;
    const currentStartY = startY || 0;
    const deltaX = (e.clientX - currentStartX) / zoom;
    const deltaY = (e.clientY - currentStartY) / zoom;
    const THRESHOLD = 5; // Snap threshold in pixels

    const newRect = startRect ? { ...startRect } : { left: 0, top: 0, width: 0, height: 0 };
    let newGuides: Guide[] = [];

    // Find siblings to snap against
    const parentId = Object.keys(elements).find(k => elements[k].children?.includes(itemId));
    const parent = parentId ? elements[parentId] : null;
    const siblings = parentId ? elements[parentId].children || [] : [];
    const snapTargets = siblings
        .filter(id => id !== itemId)
        .map(id => elements[id])
        .filter(el => el && !el.hidden && el.props.style?.position === 'absolute');

    // Add parent bounds as snap target
    if (parent && ['canvas', 'webpage', 'container'].includes(parent.type)) {
        const pWidth = parseFloat(String(parent.props.style?.width || '0'));
        const pHeight = parseFloat(String(parent.props.style?.height || '0'));
        snapTargets.push({
            id: parentId!, type: parent.type, name: 'Parent',
            props: { style: { left: 0, top: 0, width: pWidth, height: pHeight, position: 'absolute' } }
        } as any);
    }

    if (type === 'MOVE') {
        let proposedLeft = (startRect?.left || 0) + deltaX;
        let proposedTop = (startRect?.top || 0) + deltaY;
        const w = startRect?.width || 0;
        const h = startRect?.height || 0;
        let snappedX = false, snappedY = false;

        // X-axis snap points: left edge, center, right edge
        const myX = [
            { val: proposedLeft, snapType: 'start' },
            { val: proposedLeft + w / 2, snapType: 'center' },
            { val: proposedLeft + w, snapType: 'end' }
        ];

        // Check X snapping against all targets
        for (const target of snapTargets) {
            if (snappedX) break;
            const tX = parseFloat(String(target.props.style?.left || 0));
            const tW = parseFloat(String(target.props.style?.width || 0));
            const tY = parseFloat(String(target.props.style?.top || 0));
            const tH = parseFloat(String(target.props.style?.height || 0));

            const targetPoints = [
                { val: tX, snapType: 'start' },
                { val: tX + tW / 2, snapType: 'center' },
                { val: tX + tW, snapType: 'end' }
            ];

            for (const mp of myX) {
                if (snappedX) break;
                for (const tp of targetPoints) {
                    if (Math.abs(mp.val - tp.val) < THRESHOLD) {
                        proposedLeft += (tp.val - mp.val);
                        snappedX = true;
                        const minY = Math.min(proposedTop, tY);
                        const maxY = Math.max(proposedTop + h, tY + tH);
                        newGuides.push({ orientation: 'vertical', pos: tp.val, start: minY, end: maxY, type: 'align' });
                        break;
                    }
                }
            }
        }

        // Y-axis snap points
        const myY = [
            { val: proposedTop, snapType: 'start' },
            { val: proposedTop + h / 2, snapType: 'center' },
            { val: proposedTop + h, snapType: 'end' }
        ];

        // Check Y snapping
        for (const target of snapTargets) {
            if (snappedY) break;
            const tY = parseFloat(String(target.props.style?.top || 0));
            const tH = parseFloat(String(target.props.style?.height || 0));
            const tX = parseFloat(String(target.props.style?.left || 0));
            const tW = parseFloat(String(target.props.style?.width || 0));

            const targetPoints = [
                { val: tY, snapType: 'start' },
                { val: tY + tH / 2, snapType: 'center' },
                { val: tY + tH, snapType: 'end' }
            ];

            for (const mp of myY) {
                if (snappedY) break;
                for (const tp of targetPoints) {
                    if (Math.abs(mp.val - tp.val) < THRESHOLD) {
                        proposedTop += (tp.val - mp.val);
                        snappedY = true;
                        const minX = Math.min(proposedLeft, tX);
                        const maxX = Math.max(proposedLeft + w, tX + tW);
                        newGuides.push({ orientation: 'horizontal', pos: tp.val, start: minX, end: maxX, type: 'align' });
                        break;
                    }
                }
            }
        }

        // Clamp to parent bounds
        if (parent && ['canvas', 'webpage', 'container'].includes(parent.type)) {
            const pW = parseFloat(String(parent.props.style?.width || 0));
            const pH = parseFloat(String(parent.props.style?.height || 0));
            newRect.left = Math.max(0, Math.min(proposedLeft, pW - w));
            newRect.top = Math.max(0, Math.min(proposedTop, pH - h));
        } else {
            newRect.left = snappedX ? proposedLeft : Math.round(proposedLeft);
            newRect.top = snappedY ? proposedTop : Math.round(proposedTop);
        }

    } else if (type === 'RESIZE' && handle && startRect) {
        // Resize logic
        if (handle.includes('e')) newRect.width = Math.max(20, startRect.width + deltaX);
        if (handle.includes('w')) { newRect.width = Math.max(20, startRect.width - deltaX); newRect.left = startRect.left + deltaX; }
        if (handle.includes('s')) newRect.height = Math.max(20, startRect.height + deltaY);
        if (handle.includes('n')) { newRect.height = Math.max(20, startRect.height - deltaY); newRect.top = startRect.top + deltaY; }
    }

    setGuides(newGuides);

    // Apply changes
    setElements(prev => {
        const currentElement = prev[itemId];
        if (!currentElement) return prev;

        const nextStyle: React.CSSProperties = {
            ...currentElement.props.style,
            position: 'absolute',
            left: `${newRect.left}px`,
            top: `${newRect.top}px`
        };

        if (type === 'RESIZE') {
            nextStyle.width = `${newRect.width}px`;
            nextStyle.height = `${newRect.height}px`;
        }

        return { ...prev, [itemId]: { ...prev[itemId], props: { ...prev[itemId].props, style: nextStyle } } };
    });
}, [interaction, zoom, elements]);
```

---

# COMPLETE KEYBOARD SHORTCUTS TABLE

| Shortcut | Action | Implementation Location |
|----------|--------|------------------------|
| `Delete` / `Backspace` | Delete selected element | `App.tsx` → `handleKeyDown` |
| `Ctrl/Cmd + Z` | Undo | `App.tsx` → `history.undo()` |
| `Ctrl/Cmd + Shift + Z` | Redo | `App.tsx` → `history.redo()` |
| `Ctrl/Cmd + Y` | Redo (alternative) | `App.tsx` → `history.redo()` |
| `Escape` | Deselect / Close modal | `App.tsx` → `setSelectedId(null)` |
| `I` | Toggle Insert Panel | `App.tsx` → `setActivePanel('add')` |
| `Ctrl/Cmd + I` | Open Import Modal | `App.tsx` → `setIsImportOpen(true)` |
| `Space + Drag` | Pan canvas | `Canvas.tsx` → `spacePressed` state |
| `Ctrl/Cmd + Scroll` | Zoom in/out | `Canvas.tsx` → wheel handler |
| `Middle Mouse + Drag` | Pan canvas | `Canvas.tsx` → `e.button === 1` |

---

# COMPLETE HEADER COMPONENT (`src/components/Header.tsx`)

## Reset Handler

```typescript
const handleReset = () => {
    if (confirm('Reset project to default? This will clear all changes.')) {
        setElements(INITIAL_DATA);
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
};
```

## Code Generation & Export

```typescript
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
```

---

# INITIAL DATA STRUCTURE (`src/data/constants.ts`)

```typescript
export const INITIAL_DATA: VectraProject = {
    'application-root': { 
        id: 'application-root', type: 'app', name: 'Vectra Project', 
        children: ['page-home'], props: {} 
    },
    'page-home': { 
        id: 'page-home', type: 'page', name: 'Home', 
        children: ['main-frame-desktop', 'main-frame-mobile'], 
        props: { layoutMode: 'canvas', className: 'w-full h-full relative' } 
    },

    // FRAME 1: DESKTOP
    'main-frame-desktop': {
        id: 'main-frame-desktop',
        type: 'webpage',
        name: 'Desktop View',
        children: [],
        props: {
            showLayoutGrid: false,
            layoutMode: 'canvas',
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5',
            style: { position: 'absolute', left: '100px', top: '60px', width: '1100px', height: '1200px', backgroundColor: '#F2F3F5' }
        }
    },

    // FRAME 2: MOBILE (iPhone)
    'main-frame-mobile': {
        id: 'main-frame-mobile',
        type: 'canvas',
        name: 'Mobile View',
        children: [],
        props: {
            showLayoutGrid: false,
            layoutMode: 'canvas',
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5',
            style: { position: 'absolute', left: '1300px', top: '60px', width: '390px', height: '844px', backgroundColor: '#F2F3F5' }
        }
    }
};
```

---

*Last Updated: 2026-01-28*
*Maintained by: Vectra Development Team*
*Document Version: COMPLETE*
