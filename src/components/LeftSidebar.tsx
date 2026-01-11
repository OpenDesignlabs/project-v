import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { TEMPLATES } from '../data/templates';
import { LayoutTemplate, Layers, ChevronRight, ChevronDown, FileText, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';

export const LeftSidebar = () => {
    const { elements, activePageId, setActivePageId, addPage, deletePage, setSelectedId, selectedId, setDragData, previewMode, assets, addAsset } = useEditor();

    // Removed 'components' - now in floating toolbar
    const [tab, setTab] = useState<'pages' | 'tree' | 'assets' | 'templates'>('pages');
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
        const isExpanded = expandedNodes.has(id);
        const isSelected = selectedId === id;

        return (
            <div className="flex flex-col select-none">
                <div
                    className={`flex items-center gap-1 py-1.5 px-2 text-xs cursor-pointer rounded transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setSelectedId(id)}
                >
                    {hasChildren ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(id); }} className="p-0.5 hover:bg-slate-200 rounded">
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                    ) : <span className="w-4" />}
                    <span className="truncate flex-1">{el.name}</span>
                    <span className="text-[10px] text-slate-400">{el.type}</span>
                </div>
                {hasChildren && isExpanded && el.children?.map(child => <TreeItem key={child} id={child} depth={depth + 1} />)}
            </div>
        );
    };

    if (previewMode) return null;

    return (
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 h-full">
            <div className="flex border-b border-slate-100 shrink-0">
                <button onClick={() => setTab('pages')} className={`flex-1 p-3 flex justify-center transition-colors ${tab === 'pages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Pages"><FileText size={18} /></button>
                <button onClick={() => setTab('templates')} className={`flex-1 p-3 flex justify-center transition-colors ${tab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Templates"><LayoutTemplate size={18} /></button>
                <button onClick={() => setTab('assets')} className={`flex-1 p-3 flex justify-center transition-colors ${tab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Assets"><ImageIcon size={18} /></button>
                <button onClick={() => setTab('tree')} className={`flex-1 p-3 flex justify-center transition-colors ${tab === 'tree' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Layers"><Layers size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* PAGES TAB */}
                {tab === 'pages' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pages</span>
                            <button onClick={() => addPage(`Page ${Date.now().toString().slice(-4)}`)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Plus size={14} /></button>
                        </div>
                        {elements['application-root']?.children?.map(pageId => {
                            const page = elements[pageId];
                            if (!page) return null;
                            const isActive = activePageId === pageId;
                            return (
                                <div
                                    key={pageId}
                                    onClick={() => setActivePageId(pageId)}
                                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'hover:bg-slate-50 text-slate-700 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                                        <span className="text-sm font-medium">{page.name}</span>
                                    </div>
                                    {pageId !== 'page-home' && (
                                        <button onClick={(e) => { e.stopPropagation(); deletePage(pageId); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={12} /></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TEMPLATES TAB */}
                {tab === 'templates' && (
                    <div className="flex flex-col gap-3">
                        {Object.entries(TEMPLATES).map(([key, tpl]) => (
                            <div
                                key={key}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'TEMPLATE', key)}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-400 hover:shadow-lg cursor-grab active:cursor-grabbing transition-all group"
                            >
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                    <tpl.icon size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{tpl.name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">{tpl.category}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ASSETS TAB */}
                {tab === 'assets' && (
                    <div>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all mb-4 group">
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-xs font-medium text-slate-600">Click to upload</p>
                                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {assets.map(asset => (
                                <div key={asset.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-all" onClick={() => navigator.clipboard.writeText(asset.url)}>
                                    <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">Copy URL</div>
                                </div>
                            ))}
                            {assets.length === 0 && (
                                <div className="col-span-2 py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                                    <ImageIcon size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] text-slate-400 font-medium">No assets uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TREE TAB */}
                {tab === 'tree' && (
                    <div className="flex flex-col border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                        <TreeItem id={activePageId} depth={0} />
                    </div>
                )}
            </div>
        </div>
    );
};
