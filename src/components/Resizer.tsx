import { useEditor } from '../context/EditorContext';

interface ResizerProps {
    elementId: string;
}

export const Resizer: React.FC<ResizerProps> = ({ elementId }) => {
    const { elements, setInteraction, zoom } = useEditor();
    const element = elements[elementId];

    if (!element) return null;

    // --- SMART CONSTRAINT ANALYSIS ---
    const classes = element.props.className || '';

    // Check horizontal constraints (Width locked = no horizontal resize)
    const isWidthLocked = classes.includes('w-full') || classes.includes('w-fit') || classes.includes('w-screen') || classes.includes('flex-1');

    // Check vertical constraints (Height locked = no vertical resize)
    const isHeightLocked = classes.includes('h-full') || classes.includes('h-fit') || classes.includes('h-screen');

    const startResize = (e: React.PointerEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        e.currentTarget.setPointerCapture(e.pointerId);

        const parent = e.currentTarget.parentElement;
        if (!parent) return;

        const domRect = parent.getBoundingClientRect();

        const rect = {
            left: parseFloat(String(element.props.style?.left || '0')),
            top: parseFloat(String(element.props.style?.top || '0')),
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

    // Visual Style for Handles
    const handleStyle = "absolute w-2.5 h-2.5 bg-white border border-blue-600 rounded-full z-50 shadow-[0_0_2px_rgba(0,0,0,0.2)] hover:scale-125 transition-transform hover:bg-blue-50";

    return (
        <>
            {/* --- CORNERS (Only if BOTH dimensions are free) --- */}
            {!isWidthLocked && !isHeightLocked && (
                <>
                    <div className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onPointerDown={(e) => startResize(e, 'se')} />
                    <div className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onPointerDown={(e) => startResize(e, 'sw')} />
                    <div className={`${handleStyle} -top-1.5 -right-1.5 cursor-nesw-resize`} onPointerDown={(e) => startResize(e, 'ne')} />
                    <div className={`${handleStyle} -top-1.5 -left-1.5 cursor-nwse-resize`} onPointerDown={(e) => startResize(e, 'nw')} />
                </>
            )}

            {/* --- EDGES (Conditional) --- */}

            {/* Width Handles (Only if width is NOT locked) */}
            {!isWidthLocked && (
                <>
                    <div className={`${handleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => startResize(e, 'e')} />
                    <div className={`${handleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize`} onPointerDown={(e) => startResize(e, 'w')} />
                </>
            )}

            {/* Height Handles (Only if height is NOT locked) */}
            {!isHeightLocked && (
                <>
                    <div className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize`} onPointerDown={(e) => startResize(e, 's')} />
                    <div className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`} onPointerDown={(e) => startResize(e, 'n')} />
                </>
            )}
        </>
    );
};
