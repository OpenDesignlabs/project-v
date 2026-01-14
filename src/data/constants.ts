import {
    Frame, Box, Type, Square, FormInput, Image as ImageIcon,
    Grid as GridIcon, Repeat, Star
} from 'lucide-react';
import type { ComponentConfig, VectraProject } from '../types';

export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
    canvas: {
        icon: Frame,
        label: 'Frame',
        defaultProps: {
            className: 'bg-white border border-slate-200 relative overflow-hidden shadow-sm',
            style: { width: '800px', height: '600px', position: 'absolute', backgroundColor: '#ffffff' }
        }
    },
    container: {
        icon: Box,
        label: 'Container',
        defaultProps: { className: 'p-4 flex flex-col gap-2 min-h-[100px] border border-dashed border-slate-300 rounded bg-slate-50' }
    },
    text: {
        icon: Type,
        label: 'Text',
        defaultProps: { className: 'text-slate-800 text-base' },
        defaultContent: 'Text Block'
    },
    button: {
        icon: Square,
        label: 'Button',
        defaultProps: { className: 'px-4 py-2 bg-blue-600 text-white rounded shadow-lg flex items-center justify-center font-medium' },
        defaultContent: 'Button'
    },
    input: {
        icon: FormInput,
        label: 'Input',
        defaultProps: { className: 'w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500', placeholder: 'Enter text...' },
        defaultContent: ''
    },
    image: {
        icon: ImageIcon,
        label: 'Image',
        defaultProps: { className: 'bg-slate-200 object-cover rounded overflow-hidden' },
        src: 'https://via.placeholder.com/150'
    },
    icon: {
        icon: Star,
        label: 'Icon',
        defaultProps: { className: 'flex items-center justify-center', iconName: 'Star', iconSize: 24 }
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
        id: 'application-root',
        type: 'app',
        name: 'Vectra Project',
        children: ['page-home'],
        props: {}
    },
    'page-home': {
        id: 'page-home',
        type: 'page',
        name: 'Infinite Canvas',
        children: ['main-frame'],
        props: {
            layoutMode: 'canvas',
            className: 'w-full h-full relative'
        }
    },
    'main-frame': {
        id: 'main-frame',
        type: 'canvas',
        name: 'Desktop',
        children: ['welcome-card'],
        props: {
            className: 'bg-white border border-slate-200 shadow-xl relative overflow-hidden',
            style: { position: 'absolute', left: '100px', top: '100px', width: '800px', height: '600px', backgroundColor: '#ffffff' }
        }
    },
    'welcome-card': {
        id: 'welcome-card',
        type: 'container',
        name: 'Welcome Card',
        children: ['welcome-title', 'welcome-desc'],
        props: {
            className: 'p-8 bg-slate-50 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4',
            style: { position: 'absolute', left: '200px', top: '200px', width: '320px' }
        }
    },
    'welcome-title': {
        id: 'welcome-title',
        type: 'text',
        name: 'Title',
        content: '🎨 Infinite Canvas',
        props: { className: 'text-2xl font-bold' }
    },
    'welcome-desc': {
        id: 'welcome-desc',
        type: 'text',
        name: 'Desc',
        content: 'Drag the Frame tool to create Artboards anywhere.',
        props: { className: 'text-sm text-slate-500' }
    }
};
