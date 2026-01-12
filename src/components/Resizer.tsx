import { useEditor } from '../context/EditorContext';

interface ResizerProps {
    elementId: string;
}

export const Resizer: React.FC<ResizerProps> = ({ elementId }) => {
    const { elements, setInteraction, zoom } = useEditor();

    // Safety check
    if (!elements[elementId]) return null;

    const startResize = (e: React.PointerEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        // 1. POINTER CAPTURE: Keeps the mouse 'locked' to this element even if you drag off-screen
        e.currentTarget.setPointerCapture(e.pointerId);

        // 2. TRUE DIMENSION CALCULATION: 
        // Always read from the DOM to get the visual size, not the internal state.
        // This fixes the "Shrinking" bug for items with 'width: 100%' or Tailwind classes.
        const parent = e.currentTarget.parentElement;
        if (!parent) return;

        const domRect = parent.getBoundingClientRect();

        // Convert screen pixels to internal canvas units
        const rect = {
            left: parseFloat(String(elements[elementId].props.style?.left || '0')),
            top: parseFloat(String(elements[elementId].props.style?.top || '0')),
            width: domRect.width / zoom,
            height: domRect.height / zoom
        };

        setInteraction({
            type: 'RESIZE',
            itemId: elementId,
            startX: e.clientX,
            startY: e.clientY,
            startRect: rect,
            handle
        });
    };

    const handleStyle = "absolute w-2.5 h-2.5 bg-white border border-blue-600 rounded-full z-50 shadow-[0_0_2px_rgba(0,0,0,0.2)] hover:scale-125 transition-transform";

    return (
        <>
            {/* Corners */}
            <div className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onPointerDown={(e) => startResize(e, 'se')} />
            <div className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onPointerDown={(e) => startResize(e, 'sw')} />
            <div className={`${handleStyle} -top-1.5 -right-1.5 cursor-nesw-resize`} onPointerDown={(e) => startResize(e, 'ne')} />
            <div className={`${handleStyle} -top-1.5 -left-1.5 cursor-nwse-resize`} onPointerDown={(e) => startResize(e, 'nw')} />

            {/* Edges */}
            <div className={`${handleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => startResize(e, 'e')} />
            <div className={`${handleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => startResize(e, 'w')} />
            <div className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(e) => startResize(e, 's')} />
            <div className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`} onPointerDown={(e) => startResize(e, 'n')} />
        </>
    );
};
