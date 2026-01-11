import {
    Frame, Box, Type, Square, FormInput, Image as ImageIcon,
    Grid as GridIcon, Repeat, Star
} from 'lucide-react';
import type { ComponentConfig, VectraProject } from '../types';

export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
    canvas: {
        icon: Frame,
        label: 'Artboard',
        defaultProps: { className: 'w-full h-96 bg-white border border-slate-200 relative overflow-hidden rounded' }
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
        name: 'Home',
        children: ['main-canvas'],
        props: { className: 'w-full min-h-full flex flex-col items-center justify-center p-8 bg-slate-100' }
    },
    'main-canvas': {
        id: 'main-canvas',
        type: 'canvas',
        name: 'Artboard',
        children: ['welcome-card'],
        props: {
            className: 'w-[800px] h-[600px] bg-white rounded-lg border border-slate-200 relative overflow-hidden shadow-2xl',
            style: {}
        }
    },
    'welcome-card': {
        id: 'welcome-card',
        type: 'container',
        name: 'Welcome Card',
        children: ['welcome-title', 'welcome-desc', 'welcome-tip'],
        props: {
            className: 'p-8 bg-gradient-to-br from-white to-blue-50 border border-slate-200 rounded-xl shadow-lg flex flex-col gap-4 hover:shadow-xl transition-shadow',
            style: { position: 'absolute', left: '240px', top: '180px', width: '320px' }
        }
    },
    'welcome-title': {
        id: 'welcome-title',
        type: 'text',
        name: 'Heading',
        content: '🎨 Vectra 5.0',
        props: { className: 'text-2xl font-black text-slate-900 tracking-tight' }
    },
    'welcome-desc': {
        id: 'welcome-desc',
        type: 'text',
        name: 'Description',
        content: 'Your visual design builder is ready. Drag components from the left sidebar onto the canvas to start creating.',
        props: { className: 'text-sm text-slate-600 leading-relaxed' }
    },
    'welcome-tip': {
        id: 'welcome-tip',
        type: 'button',
        name: 'CTA Button',
        content: 'Try dragging me! →',
        props: { className: 'mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm' }
    }
};
