import type { VectraProject } from '../types';
import { Navigation, Sparkles, Megaphone, MessageSquare, Layout, CreditCard, GalleryHorizontal, ListOrdered, User, type LucideIcon } from 'lucide-react';

interface TemplateConfig {
    rootId: string;
    nodes: VectraProject;
    name: string;
    category: string;
    icon: LucideIcon;
}

export const TEMPLATES: Record<string, TemplateConfig> = {

    // --- 1. MODERN HERO ---
    hero_modern: {
        name: 'Modern Hero',
        category: 'Sections',
        icon: Sparkles,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Hero Section',
                children: ['bg', 'badge', 'h1', 'p1', 'btn1', 'btn2', 'img'],
                props: {
                    className: 'bg-white overflow-hidden',
                    layoutMode: 'canvas',
                    style: { position: 'absolute', width: '1200px', height: '700px', left: '0px', top: '0px' }
                }
            },
            'bg': {
                id: 'bg', type: 'container', name: 'Background', children: [],
                locked: true,
                props: {
                    className: 'bg-gradient-to-tr from-blue-50 to-purple-50 opacity-80 pointer-events-none',
                    style: { position: 'absolute', width: '100%', height: '100%', left: '0px', top: '0px', zIndex: 0 }
                }
            },
            'badge': { id: 'badge', type: 'button', name: 'Badge', props: { className: 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] font-bold uppercase tracking-wider', style: { position: 'absolute', left: '50px', top: '150px', width: '120px', height: '28px', zIndex: 10 } }, content: 'NEW FEATURE' },
            'h1': { id: 'h1', type: 'heading', name: 'Headline', props: { className: 'text-6xl font-black text-slate-900 leading-tight tracking-tight', style: { position: 'absolute', left: '50px', top: '200px', width: '600px', height: '160px', zIndex: 10 } }, content: 'Build Faster with Vectra.' },
            'p1': { id: 'p1', type: 'text', name: 'Subtitle', props: { className: 'text-lg text-slate-500 font-medium leading-relaxed', style: { position: 'absolute', left: '50px', top: '380px', width: '500px', height: '80px', zIndex: 10 } }, content: 'The visual builder that generates clean, production-ready React code.' },
            'btn1': { id: 'btn1', type: 'button', name: 'Primary Button', props: { className: 'px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg', style: { position: 'absolute', left: '50px', top: '480px', width: '160px', height: '50px', zIndex: 20 } }, content: 'Start Building' },
            'btn2': { id: 'btn2', type: 'button', name: 'Secondary Button', props: { className: 'px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50', style: { position: 'absolute', left: '230px', top: '480px', width: '160px', height: '50px', zIndex: 20 } }, content: 'Documentation' },
            'img': { id: 'img', type: 'image', name: 'Hero Image', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', props: { className: 'rounded-2xl shadow-2xl object-cover', style: { position: 'absolute', left: '700px', top: '100px', width: '450px', height: '500px', zIndex: 5 } } }
        }
    },

    // --- 2. FEATURE CARD ---
    feature_card: {
        name: 'Feature Card',
        category: 'Cards',
        icon: CreditCard,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'card', name: 'Feature Card', children: ['icon', 'title', 'desc'],
                props: { className: 'bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3', layoutMode: 'canvas', style: { width: '300px', height: '200px', position: 'absolute' } }
            },
            'icon': { id: 'icon', type: 'button', name: 'Icon Wrapper', content: '★', props: { className: 'w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold', style: { position: 'absolute', left: '24px', top: '24px', width: '40px', height: '40px' } } },
            'title': { id: 'title', type: 'text', name: 'Title', content: 'Smart Feature', props: { className: 'text-lg font-bold text-slate-900', style: { position: 'absolute', left: '24px', top: '80px', width: '200px', height: '24px' } } },
            'desc': { id: 'desc', type: 'text', name: 'Description', content: 'This is a fully composed card template made of basic blocks.', props: { className: 'text-sm text-slate-500 leading-relaxed', style: { position: 'absolute', left: '24px', top: '110px', width: '250px', height: '60px' } } }
        }
    },

    // --- 3. ACCORDION TEMPLATE ---
    accordion_section: {
        name: 'FAQ Accordion',
        category: 'Sections',
        icon: ListOrdered,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'accordion', name: 'FAQ Accordion', children: [],
                props: { className: 'w-[500px]', layoutMode: 'canvas', style: { position: 'absolute', width: '500px', height: 'auto' } }
            }
        }
    },

    // --- 4. CAROUSEL TEMPLATE ---
    carousel_widget: {
        name: 'Image Carousel',
        category: 'Media',
        icon: GalleryHorizontal,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'carousel', name: 'Carousel', children: [],
                props: { className: 'w-[600px] h-[350px] shadow-xl', layoutMode: 'canvas', style: { position: 'absolute', width: '600px', height: '350px' } }
            }
        }
    },

    // --- 5. PROFILE CARD ---
    profile_card: {
        name: 'Profile Card',
        category: 'Cards',
        icon: User,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Profile', children: ['img', 'name', 'role'],
                props: { className: 'bg-white p-4 rounded-2xl shadow border border-slate-100 flex items-center gap-4', layoutMode: 'canvas', style: { width: '320px', height: '100px', position: 'absolute' } }
            },
            'img': { id: 'img', type: 'image', name: 'Avatar', src: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', props: { className: 'w-16 h-16 rounded-full object-cover', style: { position: 'absolute', left: '20px', top: '18px', width: '64px', height: '64px' } } },
            'name': { id: 'name', type: 'text', name: 'Name', content: 'Alex Rivera', props: { className: 'text-base font-bold text-slate-900', style: { position: 'absolute', left: '100px', top: '28px', width: '150px', height: '20px' } } },
            'role': { id: 'role', type: 'text', name: 'Role', content: 'Product Designer', props: { className: 'text-xs font-medium text-slate-500', style: { position: 'absolute', left: '100px', top: '50px', width: '150px', height: '16px' } } }
        }
    },

    // --- 6. ANNOUNCEMENT BAR ---
    announcement: {
        name: 'Announcement Bar',
        category: 'Navigation',
        icon: Megaphone,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Announcement', children: ['text', 'btn'],
                props: { className: 'bg-indigo-600 shadow-sm', layoutMode: 'canvas', style: { position: 'absolute', width: '1000px', height: '40px', left: '0px', top: '0px' } }
            },
            'text': { id: 'text', type: 'text', name: 'Message', props: { className: 'text-xs font-medium text-white', style: { position: 'absolute', left: '30px', top: '12px', width: '400px', height: '20px', zIndex: 10 } }, content: '🚀 We just launched Vectra 2.0! Check out the new features.' },
            'btn': { id: 'btn', type: 'button', name: 'Action', props: { className: 'px-3 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold hover:bg-white/30', style: { position: 'absolute', left: '900px', top: '8px', width: '80px', height: '24px', zIndex: 10 } }, content: 'Learn More' }
        }
    },

    // --- 7. NAVBAR ---
    navbar: {
        name: 'SaaS Navbar',
        category: 'Navigation',
        icon: Navigation,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Navbar', children: ['logo', 'l1', 'l2', 'l3', 'cta'],
                props: { className: 'bg-white border-b border-slate-100 shadow-sm', layoutMode: 'canvas', style: { position: 'absolute', width: '1200px', height: '80px', left: '0px', top: '0px' } }
            },
            'logo': { id: 'logo', type: 'heading', name: 'Logo', props: { className: 'text-2xl font-black text-slate-900 tracking-tighter', style: { position: 'absolute', left: '40px', top: '24px', width: '100px', height: '32px' } }, content: 'VECTRA' },
            'l1': { id: 'l1', type: 'text', name: 'Link 1', content: 'Features', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '400px', top: '30px', width: '80px', height: '20px' } } },
            'l2': { id: 'l2', type: 'text', name: 'Link 2', content: 'Pricing', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '500px', top: '30px', width: '80px', height: '20px' } } },
            'l3': { id: 'l3', type: 'text', name: 'Link 3', content: 'Resources', props: { className: 'text-sm font-medium text-slate-600 hover:text-blue-600', style: { position: 'absolute', left: '600px', top: '30px', width: '80px', height: '20px' } } },
            'cta': { id: 'cta', type: 'button', name: 'Login', props: { className: 'px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800', style: { position: 'absolute', left: '1060px', top: '20px', width: '100px', height: '40px' } }, content: 'Sign In' }
        }
    },

    // --- 8. TESTIMONIAL ---
    testimonial: {
        name: 'Testimonial',
        category: 'Cards',
        icon: MessageSquare,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Testimonial', children: ['quote', 'avatar', 'name', 'role'],
                props: { className: 'bg-white border border-slate-200 rounded-xl shadow-lg p-6', layoutMode: 'canvas', style: { position: 'absolute', width: '400px', height: '240px', left: '0px', top: '0px' } }
            },
            'quote': { id: 'quote', type: 'text', name: 'Quote', props: { className: 'text-lg font-medium text-slate-700 italic leading-relaxed', style: { position: 'absolute', left: '30px', top: '30px', width: '340px', height: '100px' } }, content: '"Vectra completely changed how we design. The code output is literally production-ready."' },
            'avatar': { id: 'avatar', type: 'image', name: 'Avatar', src: 'https://i.pravatar.cc/150?img=32', props: { className: 'rounded-full border-2 border-white shadow-md', style: { position: 'absolute', left: '30px', top: '162px', width: '48px', height: '48px' } } },
            'name': { id: 'name', type: 'text', name: 'Author Name', props: { className: 'text-sm font-bold text-slate-900', style: { position: 'absolute', left: '90px', top: '165px', width: '200px', height: '20px' } }, content: 'Sarah Jenkins' },
            'role': { id: 'role', type: 'text', name: 'Author Role', props: { className: 'text-xs font-medium text-slate-500', style: { position: 'absolute', left: '90px', top: '185px', width: '200px', height: '16px' } }, content: 'CTO at TechFlow' }
        }
    },

    // --- 9. FOOTER ---
    footer: {
        name: 'Simple Footer',
        category: 'Sections',
        icon: Layout,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'section', name: 'Footer', children: ['copy', 'l1', 'l2', 'l3'],
                props: { className: 'bg-slate-50 border-t border-slate-200', layoutMode: 'canvas', style: { position: 'absolute', width: '1200px', height: '100px', left: '0px', top: '0px' } }
            },
            'copy': { id: 'copy', type: 'text', name: 'Copyright', props: { className: 'text-sm text-slate-400', style: { position: 'absolute', left: '40px', top: '40px', width: '200px', height: '20px' } }, content: '© 2026 Vectra Inc.' },
            'l1': { id: 'l1', type: 'text', name: 'Privacy Link', content: 'Privacy', props: { className: 'text-sm text-slate-500 hover:text-slate-900', style: { position: 'absolute', left: '940px', top: '40px', width: '60px', height: '20px' } } },
            'l2': { id: 'l2', type: 'text', name: 'Terms Link', content: 'Terms', props: { className: 'text-sm text-slate-500 hover:text-slate-900', style: { position: 'absolute', left: '1020px', top: '40px', width: '60px', height: '20px' } } },
            'l3': { id: 'l3', type: 'text', name: 'Status Link', content: 'Status', props: { className: 'text-sm text-slate-500 hover:text-slate-900', style: { position: 'absolute', left: '1100px', top: '40px', width: '60px', height: '20px' } } }
        }
    }
};
