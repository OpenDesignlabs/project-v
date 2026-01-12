import type { VectraProject } from '../types';
import { CreditCard, Layout, Star, Users, Mail, Laptop, LayoutDashboard, Briefcase, Zap } from 'lucide-react';

export interface TemplateDefinition {
    name: string;
    category: string;
    icon: any;
    rootId: string;
    nodes: VectraProject;
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
    'pricing-card': {
        name: 'Pricing Card',
        category: 'Components',
        icon: CreditCard,
        rootId: 'root',
        nodes: {
            'root': {
                id: 'root', type: 'container', name: 'Pricing Card',
                children: ['t-title', 't-price', 't-features', 't-btn'],
                props: { layoutMode: 'flex', className: 'p-8 bg-white border border-slate-200 rounded-2xl shadow-xl w-72 flex flex-col gap-4 hover:border-blue-500 transition-colors' }
            },
            't-title': {
                id: 't-title', type: 'text', name: 'Plan Name', content: 'Pro Plan',
                props: { className: 'text-sm font-bold text-blue-600 uppercase tracking-wider' }
            },
            't-price': {
                id: 't-price', type: 'text', name: 'Price', content: '$29/mo',
                props: { className: 'text-4xl font-black text-slate-900' }
            },
            't-features': {
                id: 't-features', type: 'text', name: 'Features', content: '✓ Unlimited projects\n✓ Priority support\n✓ Advanced analytics',
                props: { className: 'text-sm text-slate-500 whitespace-pre-line' }
            },
            't-btn': {
                id: 't-btn', type: 'button', name: 'Subscribe Button', content: 'Get Started →',
                props: { className: 'w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors' }
            }
        }
    },

    'hero-section': {
        name: 'SaaS Hero',
        category: 'Sections',
        icon: Laptop,
        rootId: 'hero-root',
        nodes: {
            'hero-root': {
                id: 'hero-root', type: 'container', name: 'Hero Section',
                children: ['hero-content'],
                props: { layoutMode: 'flex', className: 'w-full py-20 px-8 flex justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl' }
            },
            'hero-content': {
                id: 'hero-content', type: 'container', name: 'Content',
                children: ['hero-badge', 'hero-title', 'hero-subtitle', 'hero-buttons'],
                props: { layoutMode: 'flex', className: 'text-center max-w-3xl flex flex-col items-center gap-6' }
            },
            'hero-badge': {
                id: 'hero-badge', type: 'text', name: 'Badge', content: '🚀 New Release',
                props: { className: 'px-4 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full' }
            },
            'hero-title': {
                id: 'hero-title', type: 'text', name: 'Hero Title', content: 'Ship faster.\nBuild better.',
                props: { className: 'text-5xl font-extrabold text-white tracking-tight leading-tight whitespace-pre-line' }
            },
            'hero-subtitle': {
                id: 'hero-subtitle', type: 'text', name: 'Hero Subtitle', content: 'The visual builder for developers who value speed and quality.',
                props: { className: 'text-xl text-slate-400 max-w-xl' }
            },
            'hero-buttons': {
                id: 'hero-buttons', type: 'container', name: 'Buttons',
                children: ['hero-cta', 'hero-secondary'],
                props: { layoutMode: 'flex', className: 'flex gap-4 mt-4' }
            },
            'hero-cta': {
                id: 'hero-cta', type: 'button', name: 'CTA', content: 'Start Building Free',
                props: { className: 'px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all' }
            },
            'hero-secondary': {
                id: 'hero-secondary', type: 'button', name: 'Secondary', content: 'Watch Demo',
                props: { className: 'px-8 py-4 bg-white/10 text-white text-lg font-medium rounded-full hover:bg-white/20 transition-all' }
            }
        }
    },

    'navbar': {
        name: 'Navbar',
        category: 'Navigation',
        icon: Layout,
        rootId: 'nav-root',
        nodes: {
            'nav-root': {
                id: 'nav-root', type: 'container', name: 'Navbar',
                children: ['nav-logo', 'nav-links', 'nav-btn'],
                props: { layoutMode: 'flex', className: 'w-full h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm' }
            },
            'nav-logo': {
                id: 'nav-logo', type: 'text', name: 'Logo', content: '⚡ VECTRA',
                props: { className: 'font-black text-xl text-slate-900' }
            },
            'nav-links': {
                id: 'nav-links', type: 'container', name: 'Links',
                children: ['nav-l1', 'nav-l2', 'nav-l3'],
                props: { layoutMode: 'flex', className: 'flex gap-8' }
            },
            'nav-l1': {
                id: 'nav-l1', type: 'text', name: 'Link 1', content: 'Features',
                props: { className: 'text-sm text-slate-600 font-medium hover:text-blue-600 cursor-pointer transition-colors' }
            },
            'nav-l2': {
                id: 'nav-l2', type: 'text', name: 'Link 2', content: 'Pricing',
                props: { className: 'text-sm text-slate-600 font-medium hover:text-blue-600 cursor-pointer transition-colors' }
            },
            'nav-l3': {
                id: 'nav-l3', type: 'text', name: 'Link 3', content: 'About',
                props: { className: 'text-sm text-slate-600 font-medium hover:text-blue-600 cursor-pointer transition-colors' }
            },
            'nav-btn': {
                id: 'nav-btn', type: 'button', name: 'Sign In', content: 'Sign In',
                props: { className: 'px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors' }
            }
        }
    },

    'dashboard-sidebar': {
        name: 'Admin Sidebar',
        category: 'Navigation',
        icon: LayoutDashboard,
        rootId: 'db-root',
        nodes: {
            'db-root': {
                id: 'db-root', type: 'container', name: 'Sidebar',
                children: ['db-logo', 'db-nav', 'db-footer'],
                props: { layoutMode: 'flex', className: 'w-64 min-h-[400px] bg-slate-900 text-white p-6 flex flex-col gap-6 rounded-xl' }
            },
            'db-logo': {
                id: 'db-logo', type: 'text', name: 'Logo', content: '⬡ DASHBOARD',
                props: { className: 'text-xl font-black text-white tracking-wider' }
            },
            'db-nav': {
                id: 'db-nav', type: 'container', name: 'Navigation',
                children: ['db-l1', 'db-l2', 'db-l3', 'db-l4'],
                props: { layoutMode: 'flex', className: 'flex flex-col gap-1 flex-1' }
            },
            'db-l1': {
                id: 'db-l1', type: 'text', name: 'Link 1', content: '📊 Overview',
                props: { className: 'p-3 bg-blue-600 rounded-lg text-sm font-medium cursor-pointer' }
            },
            'db-l2': {
                id: 'db-l2', type: 'text', name: 'Link 2', content: '📈 Analytics',
                props: { className: 'p-3 hover:bg-slate-800 rounded-lg text-sm font-medium text-slate-400 cursor-pointer transition-colors' }
            },
            'db-l3': {
                id: 'db-l3', type: 'text', name: 'Link 3', content: '👥 Customers',
                props: { className: 'p-3 hover:bg-slate-800 rounded-lg text-sm font-medium text-slate-400 cursor-pointer transition-colors' }
            },
            'db-l4': {
                id: 'db-l4', type: 'text', name: 'Link 4', content: '⚙️ Settings',
                props: { className: 'p-3 hover:bg-slate-800 rounded-lg text-sm font-medium text-slate-400 cursor-pointer transition-colors' }
            },
            'db-footer': {
                id: 'db-footer', type: 'text', name: 'Footer', content: 'v2.4.0',
                props: { className: 'text-xs text-slate-600' }
            }
        }
    },

    'testimonial-card': {
        name: 'Testimonial',
        category: 'Components',
        icon: Star,
        rootId: 'test-root',
        nodes: {
            'test-root': {
                id: 'test-root', type: 'container', name: 'Testimonial Card',
                children: ['test-stars', 'test-quote', 'test-author'],
                props: { layoutMode: 'flex', className: 'p-6 bg-white border border-slate-200 rounded-xl w-80 shadow-lg hover:shadow-xl transition-shadow' }
            },
            'test-stars': {
                id: 'test-stars', type: 'text', name: 'Stars', content: '★★★★★',
                props: { className: 'text-yellow-400 text-lg mb-2' }
            },
            'test-quote': {
                id: 'test-quote', type: 'text', name: 'Quote', content: '"This tool has completely transformed how we design. The speed and quality are unmatched!"',
                props: { className: 'text-slate-700 italic mb-4 leading-relaxed' }
            },
            'test-author': {
                id: 'test-author', type: 'text', name: 'Author', content: '— Sarah Johnson, Lead Designer at Stripe',
                props: { className: 'text-sm font-semibold text-slate-900' }
            }
        }
    },

    'team-card': {
        name: 'Team Member',
        category: 'Components',
        icon: Users,
        rootId: 'team-root',
        nodes: {
            'team-root': {
                id: 'team-root', type: 'container', name: 'Team Card',
                children: ['team-avatar', 'team-name', 'team-role', 'team-social'],
                props: { layoutMode: 'flex', className: 'p-6 bg-white border border-slate-200 rounded-xl w-56 flex flex-col items-center text-center shadow-lg hover:border-blue-500 transition-colors' }
            },
            'team-avatar': {
                id: 'team-avatar', type: 'container', name: 'Avatar',
                children: [],
                props: { className: 'w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-4' }
            },
            'team-name': {
                id: 'team-name', type: 'text', name: 'Name', content: 'Alex Chen',
                props: { className: 'font-bold text-lg text-slate-900' }
            },
            'team-role': {
                id: 'team-role', type: 'text', name: 'Role', content: 'Senior Engineer',
                props: { className: 'text-sm text-slate-500 mb-4' }
            },
            'team-social': {
                id: 'team-social', type: 'text', name: 'Social', content: '🐦  💼  🔗',
                props: { className: 'text-lg text-slate-400' }
            }
        }
    },

    'contact-form': {
        name: 'Contact Form',
        category: 'Forms',
        icon: Mail,
        rootId: 'form-root',
        nodes: {
            'form-root': {
                id: 'form-root', type: 'container', name: 'Contact Form',
                children: ['form-title', 'form-desc', 'form-email', 'form-message', 'form-submit'],
                props: { layoutMode: 'flex', className: 'p-8 bg-white border border-slate-200 rounded-xl w-96 flex flex-col gap-4 shadow-xl' }
            },
            'form-title': {
                id: 'form-title', type: 'text', name: 'Form Title', content: 'Get in Touch',
                props: { className: 'text-2xl font-bold text-slate-900' }
            },
            'form-desc': {
                id: 'form-desc', type: 'text', name: 'Description', content: 'We\'d love to hear from you. Send us a message!',
                props: { className: 'text-sm text-slate-500 mb-2' }
            },
            'form-email': {
                id: 'form-email', type: 'input', name: 'Email Input',
                props: { className: 'w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 transition-colors', placeholder: 'Your email address' }
            },
            'form-message': {
                id: 'form-message', type: 'input', name: 'Message Input',
                props: { className: 'w-full px-4 py-3 border border-slate-300 rounded-lg h-32 focus:border-blue-500 transition-colors', placeholder: 'Your message...' }
            },
            'form-submit': {
                id: 'form-submit', type: 'button', name: 'Submit Button', content: 'Send Message →',
                props: { className: 'w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors' }
            }
        }
    },

    'feature-card': {
        name: 'Feature Card',
        category: 'Components',
        icon: Zap,
        rootId: 'feat-root',
        nodes: {
            'feat-root': {
                id: 'feat-root', type: 'container', name: 'Feature Card',
                children: ['feat-icon', 'feat-title', 'feat-desc'],
                props: { layoutMode: 'flex', className: 'p-6 bg-white border border-slate-200 rounded-xl w-72 flex flex-col gap-3 hover:border-blue-500 hover:shadow-lg transition-all' }
            },
            'feat-icon': {
                id: 'feat-icon', type: 'container', name: 'Icon',
                children: [],
                props: { className: 'w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl' }
            },
            'feat-title': {
                id: 'feat-title', type: 'text', name: 'Title', content: 'Lightning Fast',
                props: { className: 'text-lg font-bold text-slate-900' }
            },
            'feat-desc': {
                id: 'feat-desc', type: 'text', name: 'Description', content: 'Build and iterate on designs at the speed of thought with our optimized engine.',
                props: { className: 'text-sm text-slate-500 leading-relaxed' }
            }
        }
    },

    'stats-card': {
        name: 'Stats Card',
        category: 'Components',
        icon: Briefcase,
        rootId: 'stats-root',
        nodes: {
            'stats-root': {
                id: 'stats-root', type: 'container', name: 'Stats Card',
                children: ['stats-value', 'stats-label', 'stats-change'],
                props: { layoutMode: 'flex', className: 'p-6 bg-white border border-slate-200 rounded-xl w-48 flex flex-col shadow-lg' }
            },
            'stats-value': {
                id: 'stats-value', type: 'text', name: 'Value', content: '$12.4k',
                props: { className: 'text-3xl font-black text-slate-900' }
            },
            'stats-label': {
                id: 'stats-label', type: 'text', name: 'Label', content: 'Revenue',
                props: { className: 'text-sm text-slate-500' }
            },
            'stats-change': {
                id: 'stats-change', type: 'text', name: 'Change', content: '↑ 12.5%',
                props: { className: 'text-sm font-bold text-green-600 mt-2' }
            }
        }
    }
};
