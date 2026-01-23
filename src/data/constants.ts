import {
    Frame, Box, Type, Square, FormInput, Image as ImageIcon,
    Grid as GridIcon, Repeat, Star, Monitor
} from 'lucide-react';
import type { ComponentConfig, VectraProject } from '../types';

export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
    canvas: {
        icon: Frame,
        label: 'Artboard',
        defaultProps: {
            // FIX: Added min-h for guaranteed visibility
            className: 'bg-white border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5 min-h-[600px]',
            style: { width: '800px', height: '600px', position: 'absolute', backgroundColor: '#ffffff' }
        }
    },
    webpage: {
        icon: Monitor,
        label: 'Web Page',
        defaultProps: {
            // FIX: Added min-h for guaranteed visibility
            className: 'bg-white border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5 min-h-[800px]',
            style: { width: '1440px', height: '1200px', position: 'absolute', backgroundColor: '#ffffff' }
        }
    },
    container: {
        icon: Box,
        label: 'Container',
        defaultProps: { className: 'p-4 flex flex-col gap-2 min-h-[100px] border border-dashed border-slate-300 rounded bg-slate-50/50 hover:bg-slate-50 transition-colors' }
    },
    text: {
        icon: Type,
        label: 'Text',
        defaultProps: { className: 'text-slate-800 text-base leading-relaxed' },
        defaultContent: 'Text Block'
    },
    button: {
        icon: Square,
        label: 'Button',
        defaultProps: { className: 'px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 flex items-center justify-center font-medium transition-all' },
        defaultContent: 'Button'
    },
    input: {
        icon: FormInput,
        label: 'Input',
        defaultProps: { className: 'w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all', placeholder: 'Enter text...' },
        defaultContent: ''
    },
    image: {
        icon: ImageIcon,
        label: 'Image',
        defaultProps: { className: 'bg-slate-100 object-cover rounded overflow-hidden border border-slate-200' },
        src: 'https://via.placeholder.com/300x200'
    },
    icon: {
        icon: Star,
        label: 'Icon',
        defaultProps: { className: 'flex items-center justify-center text-slate-600', iconName: 'Star', iconSize: 24 }
    },
    grid: {
        icon: GridIcon,
        label: 'Grid',
        defaultProps: { className: 'grid grid-cols-2 gap-4 p-2 w-full' }
    },
    repeater: {
        icon: Repeat,
        label: 'Repeater',
        defaultProps: { className: 'flex flex-col gap-2 p-2 border border-blue-200 bg-blue-50 w-full' }
    },
};

export const INITIAL_DATA: VectraProject = {
    'application-root': {
        id: 'application-root', type: 'app', name: 'Vectra Project', children: ['page-home'], props: {}
    },
    'page-home': {
        id: 'page-home',
        type: 'page',
        name: 'Home',
        children: ['main-frame'],
        props: { layoutMode: 'canvas', className: 'w-full h-full relative' }
    },
    'main-frame': {
        id: 'main-frame',
        type: 'webpage',
        name: 'Desktop View',
        children: [],
        props: {
            showLayoutGrid: false,
            // FIX: Explicit classes for guaranteed visibility
            className: 'bg-white border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5',
            // FIX: Inline background color as fallback
            style: { position: 'absolute', left: '100px', top: '60px', width: '1440px', height: '1200px', backgroundColor: '#ffffff' }
        }
    }
};
