import {
    Type, Square, Box, Layout, Grid, Image as ImageIcon, Video,
    FormInput, CheckSquare, List, Link, Frame, Columns, AlignCenter, CreditCard, Globe, Monitor,
    Sparkles, Zap
} from 'lucide-react';
import type { ComponentConfig, VectraProject } from '../types';

export const COMPONENT_TYPES: Record<string, ComponentConfig> = {
    // --- BASIC ---
    text: {
        icon: Type, label: 'Text', category: 'basic',
        defaultProps: { className: 'text-slate-800 text-base' }, defaultContent: 'Type something...'
    },
    heading: {
        icon: Type, label: 'Heading', category: 'basic',
        defaultProps: { className: 'text-slate-900 text-3xl font-bold mb-4' }, defaultContent: 'Big Heading'
    },
    button: {
        icon: Square, label: 'Button', category: 'basic',
        defaultProps: { className: 'px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-medium transition-all active:scale-95' }, defaultContent: 'Click Me'
    },
    link: {
        icon: Link, label: 'Link', category: 'basic',
        defaultProps: { className: 'text-blue-600 hover:underline cursor-pointer' }, defaultContent: 'Read more'
    },

    // --- LAYOUT ---
    container: {
        icon: Box, label: 'Container', category: 'layout',
        defaultProps: { className: 'p-6 border border-dashed border-slate-300 rounded bg-slate-50/50 min-h-[100px] flex flex-col gap-4' }
    },
    stack_v: {
        icon: List, label: 'Vertical Stack', category: 'layout',
        defaultProps: { className: 'flex flex-col gap-4 p-4 min-h-[50px]', layoutMode: 'flex', stackOnMobile: true }
    },
    stack_h: {
        icon: Columns, label: 'Horizontal Stack', category: 'layout',
        defaultProps: { className: 'flex flex-row gap-4 p-4 min-h-[50px] items-center', layoutMode: 'flex', stackOnMobile: true }
    },
    grid: {
        icon: Grid, label: 'Grid', category: 'layout',
        defaultProps: { className: 'grid grid-cols-2 gap-4 p-4 w-full' }
    },
    section: {
        icon: Layout, label: 'Section', category: 'layout',
        defaultProps: { className: 'w-full py-16 px-8 bg-white' }
    },

    // --- FORMS ---
    input: {
        icon: FormInput, label: 'Input Field', category: 'forms',
        defaultProps: { className: 'w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none', placeholder: 'Enter text...' }
    },
    checkbox: {
        icon: CheckSquare, label: 'Checkbox', category: 'forms',
        defaultProps: { className: 'w-5 h-5 text-blue-600 rounded focus:ring-blue-500' }
    },

    // --- MEDIA ---
    image: {
        icon: ImageIcon, label: 'Image', category: 'media',
        defaultProps: { className: 'w-full h-64 object-cover rounded-xl bg-slate-100' }, src: 'https://via.placeholder.com/400x300'
    },
    video: {
        icon: Video, label: 'Video', category: 'media',
        defaultProps: { className: 'w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white' }, defaultContent: 'Video Placeholder'
    },

    // --- MARKETPLACE (New Category) ---
    hero_geometric: {
        icon: Sparkles,
        label: 'Geometric Hero',
        category: 'sections',
        defaultProps: {},
        defaultContent: ''
    },
    feature_hover: {
        icon: Zap,
        label: 'Hover Features',
        category: 'sections',
        defaultProps: {
            className: 'w-full relative bg-white',
            layoutMode: 'canvas'
        },
        defaultContent: ''
    },

    // --- SECTIONS (Pre-built) ---
    hero: {
        icon: AlignCenter, label: 'Hero Section', category: 'sections',
        defaultProps: { className: 'w-full py-20 bg-slate-900 text-center flex flex-col items-center gap-6' }
    },
    pricing: {
        icon: CreditCard, label: 'Pricing Card', category: 'sections',
        defaultProps: { className: 'p-8 border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all bg-white flex flex-col gap-4 max-w-sm' }
    },
    navbar: {
        icon: Globe, label: 'Navbar', category: 'sections',
        defaultProps: { className: 'w-full px-8 py-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50' }
    },

    // --- ARTBOARDS ---
    canvas: {
        icon: Frame, label: 'Artboard', category: 'layout',
        defaultProps: {
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5 min-h-[600px]',
            style: { width: '800px', height: '600px', position: 'absolute', backgroundColor: '#F2F3F5' }
        }
    },
    webpage: {
        icon: Monitor, label: 'Web Page', category: 'layout',
        defaultProps: {
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5 min-h-[800px]',
            style: { width: '1100px', height: '1200px', position: 'absolute', backgroundColor: '#F2F3F5' }
        }
    },
};

export const INITIAL_DATA: VectraProject = {
    'application-root': { id: 'application-root', type: 'app', name: 'Vectra Project', children: ['page-home'], props: {} },
    'page-home': { id: 'page-home', type: 'page', name: 'Home', children: ['main-frame-desktop', 'main-frame-mobile'], props: { layoutMode: 'canvas', className: 'w-full h-full relative' } },

    // FRAME 1: DESKTOP
    'main-frame-desktop': {
        id: 'main-frame-desktop',
        type: 'webpage',
        name: 'Desktop View',
        children: [],
        props: {
            showLayoutGrid: false,
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5',
            // Positioned at X: 100, Width: 1100
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
            className: 'bg-[#F2F3F5] border border-slate-300 shadow-2xl relative overflow-hidden ring-1 ring-black/5',
            // Positioned at X: 1300 (100 + 1100 + gap 100), Width: 390 (iPhone)
            style: { position: 'absolute', left: '1300px', top: '60px', width: '390px', height: '844px', backgroundColor: '#F2F3F5' }
        }
    }
};
