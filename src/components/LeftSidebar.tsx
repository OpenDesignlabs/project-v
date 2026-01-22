import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { COMPONENT_TYPES } from '../data/constants';
import { TEMPLATES } from '../data/templates';
import {
    Layers, ChevronRight, ChevronDown,
    FileText, Plus, Image as ImageIcon, Trash2
} from 'lucide-react';

export const LeftSidebar = () => {
    const {
        elements, activePageId, setActivePageId, addPage,
        deletePage, setSelectedId, selectedId, setDragData,
        previewMode, assets, addAsset
    } = useEditor();

    // Default to 'add' tab for quick access
    const [tab, setTab] = useState<'add' | 'pages' | 'layers' | 'assets'>('add');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([activePageId]));

    const handleDragStart = (_e: React.DragEvent, type: string, payload: string) => {
        setDragData({ type: type as any, payload });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) addAsset(e.target.files[0]);
    };

    const toggleExpand = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const TreeItem = ({ id, depth }: { id: string; depth: number }) => {
        const el = elements[id];
        if (!el) return null;
        const hasChildren = el.children && el.children.length > 0;
        const isSelected = selectedId === id;

        return (
            <div className="flex flex-col select-none">
                <div
                    className={`flex items-center gap-1 py-1 px-2 text-xs cursor-pointer border-l-2 transition-colors ${isSelected ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' : 'border-transparent hover:bg-slate-50 text-slate-600'}`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setSelectedId(id)}
                >
                    {hasChildren ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(id); }} className="p-0.5 hover:bg-slate-200 rounded text-slate-400">
                            {expandedNodes.has(id) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                    ) : <span className="w-3" />}
                    <span className="truncate flex-1">{el.name}</span>
                </div>
                {hasChildren && expandedNodes.has(id) && el.children?.map(child => <TreeItem key={child} id={child} depth={depth + 1} />)}
            </div>
        );
    };

    if (previewMode) return null;

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 h-full">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-100">
                <button onClick={() => setTab('add')} className={`flex-1 p-3 flex justify-center border-b-2 transition-colors ${tab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Add Elements"><Plus size={18} /></button>
                <button onClick={() => setTab('layers')} className={`flex-1 p-3 flex justify-center border-b-2 transition-colors ${tab === 'layers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Layers"><Layers size={18} /></button>
                <button onClick={() => setTab('pages')} className={`flex-1 p-3 flex justify-center border-b-2 transition-colors ${tab === 'pages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Pages"><FileText size={18} /></button>
                <button onClick={() => setTab('assets')} className={`flex-1 p-3 flex justify-center border-b-2 transition-colors ${tab === 'assets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Assets"><ImageIcon size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f9fafb]">

                {/* --- TAB: ADD ELEMENTS (Clean Grid) --- */}
                {tab === 'add' && (
                    <div className="p-4 flex flex-col gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Basic</div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(COMPONENT_TYPES).filter(([k]) => !['canvas', 'webpage'].includes(k)).map(([type, config]) => (
                                    <div
                                        key={type}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'NEW', type)}
                                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded hover:border-blue-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group"
                                    >
                                        <config.icon size={20} className="text-slate-500 group-hover:text-blue-600 mb-2" />
                                        <span className="text-[10px] font-medium text-slate-600">{config.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Sections</div>
                            <div className="flex flex-col gap-2">
                                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                                    <div
                                        key={key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'TEMPLATE', key)}
                                        className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded hover:border-blue-400 cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="p-1.5 bg-slate-50 rounded text-slate-500"><tpl.icon size={14} /></div>
                                        <span className="text-xs text-slate-700 font-medium">{tpl.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: LAYERS --- */}
                {tab === 'layers' && (
                    <div className="py-2">
                        <TreeItem id={activePageId} depth={0} />
                    </div>
                )}

                {/* --- TAB: PAGES --- */}
                {tab === 'pages' && (
                    <div className="p-3 flex flex-col gap-2">
                        <button onClick={() => addPage(`Page ${Date.now().toString().slice(-4)}`)} className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                            <Plus size={14} /> New Page
                        </button>
                        {elements['application-root']?.children?.map(pageId => (
                            <div key={pageId} onClick={() => setActivePageId(pageId)} className={`flex items-center justify-between p-2 rounded cursor-pointer ${activePageId === pageId ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}>
                                <span className="text-sm font-medium">{elements[pageId].name}</span>
                                {pageId !== 'page-home' && <button onClick={(e) => { e.stopPropagation(); deletePage(pageId); }} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>}
                            </div>
                        ))}
                    </div>
                )}

                {/* --- TAB: ASSETS --- */}
                {tab === 'assets' && (
                    <div className="p-4">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 mb-4">
                            <div className="flex flex-col items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                                <p className="text-[10px] text-slate-500">Upload Image</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {assets.map(asset => (
                                <div key={asset.id} className="aspect-square bg-slate-100 rounded border border-slate-200 overflow-hidden cursor-pointer" onClick={() => navigator.clipboard.writeText(asset.url)}>
                                    <img src={asset.url} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
