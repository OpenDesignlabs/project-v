import { useEditor } from '../context/EditorContext';

interface ResizerProps {
    elementId: string;
}

export const Resizer: React.FC<ResizerProps> = ({ elementId }) => {
    const { elements, setInteraction } = useEditor();
    const element = elements[elementId];

    const startResize = (e: React.PointerEvent, handle: string) => {
        e.stopPropagation();
        const rect = {
            left: parseFloat(String(element.props.style?.left || '0')),
            top: parseFloat(String(element.props.style?.top || '0')),
            width: parseFloat(String(element.props.style?.width || '100')),
            height: parseFloat(String(element.props.style?.height || '50'))
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

    const handleStyle = "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-50 shadow-sm";

    return (
        <>
            {/* Corner handles */}
            <div
                className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`}
                onPointerDown={(e) => startResize(e, 'se')}
            />
            <div
                className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`}
                onPointerDown={(e) => startResize(e, 'sw')}
            />
            <div
                className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`}
                onPointerDown={(e) => startResize(e, 'ne')}
            />
            <div
                className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`}
                onPointerDown={(e) => startResize(e, 'nw')}
            />
            {/* Edge handles */}
            <div
                className={`${handleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`}
                onPointerDown={(e) => startResize(e, 'e')}
            />
            <div
                className={`${handleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`}
                onPointerDown={(e) => startResize(e, 'w')}
            />
            <div
                className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`}
                onPointerDown={(e) => startResize(e, 's')}
            />
            <div
                className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
                onPointerDown={(e) => startResize(e, 'n')}
            />
        </>
    );
};
