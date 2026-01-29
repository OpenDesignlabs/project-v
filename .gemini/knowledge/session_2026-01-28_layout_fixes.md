# Vectra Editor: Layout Stacking & Drag Fixes - Session Summary
## Date: 2026-01-28

---

## Problem Statement

The Vectra design editor was experiencing critical layout issues:
1. **Stacking Behavior**: Elements dragged onto the canvas were stacking vertically like a list instead of being placed at their drop coordinates.
2. **Jittery Dragging**: Moving elements caused them to jump or shake instead of smoothly following the cursor.
3. **Static Positioning**: Templates were ignoring `position: absolute` and behaving as `relative` or `static`.
4. **Reset Button Broken**: The factory reset button was targeting an outdated localStorage key.

---

## Root Causes Identified

### 1. CSS Class Conflicts
Tailwind utility classes in element `className` props (e.g., `relative`, `flex`, `w-full`, `h-full`) were **overriding** the inline `style={{ position: 'absolute' }}` set by the drag engine.

### 2. Flexbox Layout Context
Parent containers with `layoutMode: 'canvas'` still had `flex` classes applied, causing children to stack in a Flexbox flow instead of being absolutely positioned.

### 3. Stale localStorage Data
Old project data saved under previous localStorage keys (e.g., `v50`, `v51`) contained corrupted layout settings that persisted across sessions.

### 4. Hardcoded Storage Key Mismatch
The "Reset" button in `Header.tsx` was deleting `vectra_design_v50`, while the app was actually using `vectra_design_v55` or `v56`.

---

## Solutions Implemented

### 1. Centralized Storage Key (`src/data/constants.ts`)

Created a single source of truth for the localStorage key:

```typescript
export const STORAGE_KEY = 'vectra_design_v56';
```

This is now imported and used by:
- `EditorContext.tsx` (for load/save)
- `Header.tsx` (for reset)

Bumping the version number (e.g., `v55` → `v56`) forces a "Factory Reset" by invalidating old cached data.

---

### 2. Strict CSS Enforcement (`src/components/RenderNode.tsx`)

Implemented a "Banned Classes" filter that strips conflicting layout utilities:

```typescript
const BANNED_CLASSES = ['w-full', 'h-full', 'relative', 'static', 'fixed', 'flex-1', 'justify-center', 'items-center', 'm-auto', 'mx-auto', 'my-auto'];

let classList = (element.props.className || '').split(' ');

if (isParentCanvas && !isMobileMirror) {
    finalStyle.position = 'absolute';
    if (finalStyle.left === undefined) finalStyle.left = '0px';
    if (finalStyle.top === undefined) finalStyle.top = '0px';
    
    // Remove layout blockers
    classList = classList.filter(c => !BANNED_CLASSES.includes(c));
}

if (element.props.layoutMode === 'canvas') {
    finalStyle.display = 'block';
    classList = classList.filter(c => !c.startsWith('flex') && !c.startsWith('grid') && !c.startsWith('gap-'));
}
```

**Key Design Decision**: Inline styles from the editor MUST take precedence over Tailwind classes for layout-critical properties.

---

### 3. Fixed Template Defaults (`src/data/templates.ts`)

All templates now include explicit absolute positioning in their root node:

```typescript
'root': {
    id: 'root', type: 'section', name: 'Geometric Hero',
    children: [...],
    props: {
        className: 'bg-[#030303] overflow-hidden rounded-xl', // NO 'relative' or 'w-full'
        layoutMode: 'canvas',
        style: { position: 'absolute', width: '1000px', height: '600px', left: '0px', top: '0px' }
    }
}
```

**Key Design Decision**: Conflicting classes (`relative`, `w-full`) are **banned** from template root definitions.

---

### 4. Drop Handler Fix (`src/components/RenderNode.tsx`)

The drop handler now explicitly initializes the `style` object before setting position:

```typescript
if (!newNodes[rootId].props.style) newNodes[rootId].props.style = {};
newNodes[rootId].props.style.position = 'absolute';
newNodes[rootId].props.style.left = `${Math.round(dropX)}px`;
newNodes[rootId].props.style.top = `${Math.round(dropY)}px`;
```

This prevents a crash when templates are dropped that don't have an initial `style` prop.

---

### 5. Zero-Jitter Drag Physics (`src/components/RenderNode.tsx`)

The drag engine uses "Vector Physics" to calculate position:

```typescript
const dragVector = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

// On drag start:
dragVector.current = {
    startX: e.clientX,
    startY: e.clientY,
    initialLeft: parseFloat(style.left || '0'),
    initialTop: parseFloat(style.top || '0')
};

// On move:
const deltaX = (e.clientX - dragVector.current.startX) / safeZoom;
const deltaY = (e.clientY - dragVector.current.startY) / safeZoom;
const newLeft = dragVector.current.initialLeft + deltaX;
const newTop = dragVector.current.initialTop + deltaY;
```

**Formula**: `New Position = Start Position + (Current Mouse - Start Mouse) / Zoom`

This ensures smooth, 1:1 dragging at any zoom level.

---

## Key Files Modified

| File | Purpose |
|------|---------|
| `src/data/constants.ts` | Added `STORAGE_KEY` constant |
| `src/context/EditorContext.tsx` | Uses `STORAGE_KEY` for load/save |
| `src/components/Header.tsx` | Uses `STORAGE_KEY` for reset |
| `src/components/RenderNode.tsx` | CSS enforcement, drag physics, drop handler |
| `src/data/templates.ts` | Clean template definitions with explicit absolute positioning |

---

## How to Force a Data Reset

If layout issues persist:

1. **Option A**: Click the **"Reset"** button in the top toolbar (now works correctly).
2. **Option B**: Open browser DevTools → Application → Local Storage → Delete `vectra_design_v56`.
3. **Option C**: Bump `STORAGE_KEY` in `constants.ts` to a new version (e.g., `v57`) and rebuild.

---

## Architecture Notes

### Hybrid Layout System

Vectra uses a "Hybrid" layout architecture:
- **Canvas Mode** (`layoutMode: 'canvas'`): Children are absolutely positioned. Used for artboards and design surfaces.
- **Flex Mode** (`layoutMode: 'flex'`): Children flow in a flexbox. Used for stacks and responsive layouts.

The `RenderNode` component detects the parent's `layoutMode` and enforces the correct CSS rules on children.

### Element Hierarchy

```
application-root (app)
└── page-home (page)
    ├── main-frame-desktop (webpage) [Canvas Mode]
    │   └── ... child elements are ABSOLUTE
    └── main-frame-mobile (canvas) [Canvas Mode]
        └── ... child elements are ABSOLUTE
```

---

## Testing Checklist

After making layout changes, verify:
- [ ] Drag "Feature Grid" onto canvas → Should NOT stack
- [ ] Drag "Pricing Card" next to "Feature Grid" → Should overlap/layer freely
- [ ] Drag child elements inside a template → Should move smoothly
- [ ] Click "Reset" → Page reloads with clean default state
- [ ] Zoom in/out → Drag still works correctly

---

## Future Improvements

1. **CSS-in-JS Consideration**: Move critical layout styles to CSS Modules or styled-components to avoid Tailwind class conflicts.
2. **Layout Mode Indicator**: Add a visual badge showing whether a container is in "Canvas" or "Flex" mode.
3. **Snapping System**: Implement a smart snapping grid for precise alignment during drag.

---

*This knowledge file was generated from a debugging session on 2026-01-28.*
