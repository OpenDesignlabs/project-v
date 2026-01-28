import type { VectraProject } from '../types';
import { CreditCard, Navigation, Sparkles, type LucideIcon } from 'lucide-react';

interface TemplateConfig {
    rootId: string;
    nodes: VectraProject;
    name: string;
    category: string;
    icon: LucideIcon;
}

export const TEMPLATES: Record<string, TemplateConfig> = {
    // --- 1. GEOMETRIC HERO (Hybrid) ---
    // Uses the Framer Motion background + Native Editable Text
    hero_geometric: {
        name: 'Geometric Hero',
        category: 'Sections',
        icon: Sparkles,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Geometric Hero',
                children: ['bg-visual', 'badge', 'h1', 'p1', 'btn-group'],
                props: {
                    className: 'w-[1000px] h-[600px] relative bg-[#0a0a0a] overflow-hidden rounded-xl shadow-2xl',
                    layoutMode: 'canvas' // Enables dragging children
                }
            },
            'bg-visual': {
                id: 'bg-visual', type: 'geometric_bg', name: 'Animation', children: [],
                locked: true, // User cannot drag the background
                props: {
                    className: 'absolute inset-0 pointer-events-none',
                    style: { width: '100%', height: '100%', zIndex: 0 }
                }
            },
            'badge': {
                id: 'badge', type: 'button', name: 'Badge',
                props: {
                    className: 'px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-medium text-white/80 uppercase tracking-widest backdrop-blur-md hover:bg-white/10 transition-colors',
                    style: { position: 'absolute', left: '50%', top: '120px', transform: 'translateX(-50%)', zIndex: 10, width: 'auto' }
                },
                content: '✨ VECTRA 2.0'
            },
            'h1': {
                id: 'h1', type: 'heading', name: 'Title',
                props: {
                    className: 'text-7xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 leading-tight',
                    style: { position: 'absolute', left: '50%', top: '180px', transform: 'translateX(-50%)', width: '800px', zIndex: 10 }
                },
                content: 'Design at the Speed of Thought.'
            },
            'p1': {
                id: 'p1', type: 'text', name: 'Subtitle',
                props: {
                    className: 'text-lg text-center text-neutral-400 font-light leading-relaxed',
                    style: { position: 'absolute', left: '50%', top: '360px', transform: 'translateX(-50%)', width: '500px', zIndex: 10 }
                },
                content: 'The visual builder for developers. Export clean, production-ready React code in seconds.'
            },
            'btn-group': {
                id: 'btn-group', type: 'container', name: 'Buttons', children: ['btn1', 'btn2'],
                props: {
                    className: 'flex gap-4 items-center justify-center',
                    layoutMode: 'flex', // Buttons stay together
                    style: { position: 'absolute', left: '50%', top: '460px', transform: 'translateX(-50%)', width: 'auto', height: 'auto', zIndex: 10 }
                }
            },
            'btn1': {
                id: 'btn1', type: 'button', name: 'Primary',
                props: { className: 'px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 shadow-lg shadow-blue-500/20' },
                content: 'Get Started'
            },
            'btn2': {
                id: 'btn2', type: 'button', name: 'Secondary',
                props: { className: 'px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10' },
                content: 'Documentation'
            }
        }
    },

    // --- 2. PRICING CARD (Clean & Modern) ---
    pricing: {
        name: 'Pricing Card',
        category: 'Cards',
        icon: CreditCard,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Pricing Card', children: ['badge', 'tier', 'price', 'features', 'btn'],
                props: {
                    className: 'w-[320px] h-[480px] bg-white rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden group hover:border-blue-500 transition-colors',
                    layoutMode: 'canvas'
                }
            },
            'badge': {
                id: 'badge', type: 'button', name: 'Popular',
                props: {
                    className: 'px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full shadow-sm',
                    style: { position: 'absolute', right: '20px', top: '20px', zIndex: 10 }
                },
                content: 'MOST POPULAR'
            },
            'tier': {
                id: 'tier', type: 'text', name: 'Tier Name',
                props: { className: 'text-sm font-bold text-slate-500 uppercase tracking-wider', style: { position: 'absolute', left: '30px', top: '30px' } },
                content: 'PRO PLAN'
            },
            'price': {
                id: 'price', type: 'heading', name: 'Price',
                props: { className: 'text-5xl font-black text-slate-900', style: { position: 'absolute', left: '30px', top: '60px' } },
                content: '$49'
            },
            'features': {
                id: 'features', type: 'container', name: 'Feature List', children: ['f1', 'f2', 'f3'],
                props: {
                    className: 'flex flex-col gap-3', layoutMode: 'flex',
                    style: { position: 'absolute', left: '30px', top: '140px', width: '260px' }
                }
            },
            'f1': { id: 'f1', type: 'text', name: 'Feature 1', content: '✓ Unlimited Projects', props: { className: 'text-sm text-slate-600' } },
            'f2': { id: 'f2', type: 'text', name: 'Feature 2', content: '✓ Priority Support', props: { className: 'text-sm text-slate-600' } },
            'f3': { id: 'f3', type: 'text', name: 'Feature 3', content: '✓ Analytics Dashboard', props: { className: 'text-sm text-slate-600' } },
            'btn': {
                id: 'btn', type: 'button', name: 'Subscribe',
                props: {
                    className: 'w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all',
                    style: { position: 'absolute', left: '20px', bottom: '20px', width: '280px' }
                },
                content: 'Choose Plan'
            }
        }
    },

    // --- 3. SAAS NAV (Glassmorphism) ---
    navbar: {
        name: 'Navigation Bar',
        category: 'Navigation',
        icon: Navigation,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Navbar', children: ['logo', 'links', 'cta'],
                props: {
                    className: 'w-[1000px] h-[70px] bg-white/80 backdrop-blur-md border border-white/20 rounded-full shadow-sm flex items-center px-8 justify-between relative',
                    layoutMode: 'canvas' // Keeping it canvas for precision, or could be Flex
                }
            },
            'logo': {
                id: 'logo', type: 'heading', name: 'Logo',
                props: { className: 'text-xl font-black text-slate-900 tracking-tighter', style: { position: 'absolute', left: '30px', top: '22px' } },
                content: 'VECTRA'
            },
            'links': {
                id: 'links', type: 'container', name: 'Links', children: ['l1', 'l2', 'l3'],
                props: {
                    className: 'flex gap-6', layoutMode: 'flex',
                    style: { position: 'absolute', left: '50%', top: '25px', transform: 'translateX(-50%)' }
                }
            },
            'l1': { id: 'l1', type: 'text', name: 'Link 1', content: 'Product', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600 cursor-pointer' } },
            'l2': { id: 'l2', type: 'text', name: 'Link 2', content: 'Solutions', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600 cursor-pointer' } },
            'l3': { id: 'l3', type: 'text', name: 'Link 3', content: 'Pricing', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600 cursor-pointer' } },
            'cta': {
                id: 'cta', type: 'button', name: 'Sign In',
                props: {
                    className: 'px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800',
                    style: { position: 'absolute', right: '10px', top: '15px' }
                },
                content: 'Sign In'
            }
        }
    }
};
