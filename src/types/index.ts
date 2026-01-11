import type { LucideIcon } from 'lucide-react';

// --- LOGIC SYSTEM ---
export type ActionType =
    | { type: 'NAVIGATE'; payload: string }
    | { type: 'OPEN_MODAL'; payload: string }
    | { type: 'SCROLL_TO'; payload: string };

export interface GlobalStyles {
    colors: Record<string, string>;
    fonts: Record<string, string>;
}

export interface Asset {
    id: string;
    type: 'image';
    url: string;
    name: string;
}

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
        placeholder?: string;
        iconName?: string;
        iconSize?: number;
        iconClassName?: string;
        [key: string]: any;
    };
}

export type VectraProject = Record<string, VectraNode>;

export interface Guide {
    type: 'horizontal' | 'vertical';
    pos: number;
}

export interface ComponentConfig {
    icon: LucideIcon;
    label: string;
    defaultProps: any;
    defaultContent?: string;
    src?: string;
}

export interface DragData {
    type: 'NEW' | 'TEMPLATE' | 'ASSET';
    payload: string;
}

export interface InteractionState {
    type: 'MOVE' | 'RESIZE';
    itemId: string;
    startX: number;
    startY: number;
    startRect: { left: number; top: number; width: number; height: number };
    handle?: string;
}

export type EditorTool = 'select' | 'hand' | 'type';
