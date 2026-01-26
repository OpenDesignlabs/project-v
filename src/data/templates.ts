import type { VectraProject } from '../types';
import { Layout, CreditCard, Navigation, MessageSquare, type LucideIcon } from 'lucide-react';

interface TemplateConfig {
    rootId: string;
    nodes: VectraProject;
    name: string;
    category: string;
    icon: LucideIcon;
}

export const TEMPLATES: Record<string, TemplateConfig> = {
    // --- 1. MODERN SAAS HERO (Fixed & Polished) ---
    hero: {
        name: 'SaaS Hero',
        category: 'Sections',
        icon: Layout,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Hero Section', children: ['bg-pattern', 'badge', 'h1', 'p1', 'btn-group'],
                props: {
                    // FIX: 'relative' ensures children position inside THIS box, not the page.
                    className: 'w-full h-[700px] relative bg-white overflow-hidden border-b border-slate-100 group',
                    layoutMode: 'canvas',
                    style: { position: 'relative' }
                }
            },
            // NEW: Background Grid Pattern for Pro Feel
            'bg-pattern': {
                id: 'bg-pattern', type: 'container', name: 'Background Grid', children: [],
                props: {
                    className: 'absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 pointer-events-none',
                    style: { width: '100%', height: '100%', zIndex: 0 }
                }
            },
            'badge': {
                id: 'badge', type: 'button', name: 'Badge',
                props: {
                    className: 'px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm',
                    style: { position: 'absolute', left: '50%', top: '80px', transform: 'translateX(-50%)', zIndex: 10, width: 'auto', height: 'auto' }
                },
                content: '✨ New Version 2.0'
            },
            'h1': {
                id: 'h1', type: 'heading', name: 'Headline',
                props: {
                    className: 'text-7xl font-extrabold text-slate-900 text-center leading-[1.1] tracking-tight',
                    style: { position: 'absolute', left: '50%', top: '140px', transform: 'translateX(-50%)', width: '900px', zIndex: 10 }
                },
                content: 'Ship your startup faster.'
            },
            'p1': {
                id: 'p1', type: 'text', name: 'Subtext',
                props: {
                    className: 'text-xl text-slate-500 text-center leading-relaxed max-w-2xl',
                    style: { position: 'absolute', left: '50%', top: '320px', transform: 'translateX(-50%)', width: '600px', zIndex: 10 }
                },
                content: 'The visual builder for developers. Export clean, production-ready React code in seconds, not hours.'
            },
            // Grouping buttons visually (though they are separate nodes)
            'btn-group': {
                id: 'btn-group', type: 'container', name: 'Button Group', children: ['btn1', 'btn2'],
                props: {
                    // Invisible container to hold buttons together if needed, or just visual grouping
                    className: 'pointer-events-none',
                    style: { position: 'absolute', left: '50%', top: '420px', transform: 'translateX(-50%)', width: '340px', height: '60px', zIndex: 20 }
                }
            },
            'btn1': {
                id: 'btn1', type: 'button', name: 'Primary Button',
                props: {
                    className: 'px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-lg shadow-lg shadow-blue-600/20 transition-all active:scale-95 pointer-events-auto',
                    style: { position: 'absolute', left: '0px', top: '0px', width: '160px', height: '56px' }
                },
                content: 'Get Started'
            },
            'btn2': {
                id: 'btn2', type: 'button', name: 'Secondary Button',
                props: {
                    className: 'px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-semibold text-lg shadow-sm transition-all active:scale-95 pointer-events-auto',
                    style: { position: 'absolute', right: '0px', top: '0px', width: '160px', height: '56px' }
                },
                content: 'View Demo'
            }
        }
    },

    // --- 2. PREMIUM PRICING CARD (Fixed Borders) ---
    pricing: {
        name: 'Pricing Card',
        category: 'Cards',
        icon: CreditCard,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Pricing Card', children: ['badge', 'plan-name', 'price', 'desc', 'sep', 'f1', 'f2', 'f3', 'btn'],
                props: {
                    // FIX: overflow-hidden ensures child elements don't bleed out
                    className: 'bg-white border border-slate-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group',
                    layoutMode: 'canvas',
                    style: { width: '360px', height: '520px', backgroundColor: '#ffffff', position: 'relative' }
                }
            },
            'badge': {
                id: 'badge', type: 'text', name: 'Popular Badge',
                props: {
                    className: 'bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm',
                    style: { position: 'absolute', right: '24px', top: '24px', width: 'auto' }
                },
                content: 'POPULAR'
            },
            'plan-name': {
                id: 'plan-name', type: 'text', name: 'Plan Name',
                props: {
                    className: 'text-sm font-bold text-slate-500 uppercase tracking-wide',
                    style: { position: 'absolute', left: '32px', top: '32px', width: 'auto' }
                },
                content: 'Pro Plan'
            },
            'price': {
                id: 'price', type: 'heading', name: 'Price',
                props: {
                    className: 'text-5xl font-extrabold text-slate-900 tracking-tight',
                    style: { position: 'absolute', left: '32px', top: '65px', width: 'auto' }
                },
                content: '$49'
            },
            'desc': {
                id: 'desc', type: 'text', name: 'Description',
                props: {
                    className: 'text-sm text-slate-400 font-medium',
                    style: { position: 'absolute', left: '130px', top: '88px', width: 'auto' }
                },
                content: '/ month'
            },
            'sep': {
                id: 'sep', type: 'container', name: 'Separator', children: [],
                props: {
                    className: 'bg-slate-100',
                    style: { position: 'absolute', left: '32px', top: '140px', width: '296px', height: '1px' }
                }
            },
            'f1': {
                id: 'f1', type: 'text', name: 'Feature 1',
                props: { className: 'text-slate-600 text-sm font-medium', style: { position: 'absolute', left: '32px', top: '170px', width: '280px' } },
                content: '✓  Unlimited Projects'
            },
            'f2': {
                id: 'f2', type: 'text', name: 'Feature 2',
                props: { className: 'text-slate-600 text-sm font-medium', style: { position: 'absolute', left: '32px', top: '210px', width: '280px' } },
                content: '✓  Priority 24/7 Support'
            },
            'f3': {
                id: 'f3', type: 'text', name: 'Feature 3',
                props: { className: 'text-slate-600 text-sm font-medium', style: { position: 'absolute', left: '32px', top: '250px', width: '280px' } },
                content: '✓  Advanced Analytics'
            },
            'btn': {
                id: 'btn', type: 'button', name: 'Buy Button',
                props: {
                    className: 'w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95',
                    style: { position: 'absolute', left: '32px', bottom: '32px', width: '296px', height: '50px' }
                },
                content: 'Get Started'
            }
        }
    },

    // --- 3. GLASS NAVBAR (Fixed Z-Index) ---
    navbar: {
        name: 'Navigation Bar',
        category: 'Navigation',
        icon: Navigation,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Navbar', children: ['logo', 'l1', 'l2', 'l3', 'cta'],
                props: {
                    // Z-Index 50 ensures it stays on top of Hero content
                    className: 'w-full h-[80px] bg-white/80 backdrop-blur-md border-b border-slate-200 z-50',
                    layoutMode: 'canvas',
                    style: { position: 'relative' }
                }
            },
            'logo': {
                id: 'logo', type: 'text', name: 'Logo',
                props: {
                    className: 'text-xl font-black text-slate-900 tracking-tighter',
                    style: { position: 'absolute', left: '40px', top: '26px' }
                },
                content: '⚡ VECTRA'
            },
            'l1': {
                id: 'l1', type: 'link', name: 'Link 1',
                props: { className: 'text-sm font-semibold text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '50%', top: '30px', transform: 'translateX(-120px)' } },
                content: 'Product'
            },
            'l2': {
                id: 'l2', type: 'link', name: 'Link 2',
                props: { className: 'text-sm font-semibold text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '50%', top: '30px', transform: 'translateX(0px)' } },
                content: 'Solutions'
            },
            'l3': {
                id: 'l3', type: 'link', name: 'Link 3',
                props: { className: 'text-sm font-semibold text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '50%', top: '30px', transform: 'translateX(120px)' } },
                content: 'Pricing'
            },
            'cta': {
                id: 'cta', type: 'button', name: 'Nav Button',
                props: {
                    className: 'px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all',
                    style: { position: 'absolute', right: '40px', top: '20px', height: '40px' }
                },
                content: 'Sign In'
            }
        }
    },

    // --- 4. TESTIMONIAL ---
    testimonial: {
        name: 'Testimonial Card',
        category: 'Cards',
        icon: MessageSquare,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Testimonial', children: ['quote', 'author', 'role'],
                props: {
                    className: 'bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative',
                    layoutMode: 'canvas',
                    style: { width: '400px', height: '220px', backgroundColor: '#ffffff', position: 'relative' }
                }
            },
            'quote': {
                id: 'quote', type: 'text', name: 'Quote',
                props: {
                    className: 'text-lg text-slate-700 italic leading-relaxed',
                    style: { position: 'absolute', left: '32px', top: '32px', width: '336px' }
                },
                content: '"Vectra completely changed how we build landing pages. It\'s exactly the tool I\'ve been waiting for."'
            },
            'author': {
                id: 'author', type: 'text', name: 'Author Name',
                props: {
                    className: 'font-bold text-slate-900',
                    style: { position: 'absolute', left: '32px', bottom: '50px' }
                },
                content: 'Sarah Jenkins'
            },
            'role': {
                id: 'role', type: 'text', name: 'Author Role',
                props: {
                    className: 'text-sm text-slate-500',
                    style: { position: 'absolute', left: '32px', bottom: '30px' }
                },
                content: 'CTO at TechFlow'
            }
        }
    }
};
