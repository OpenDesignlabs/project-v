import { useContainer } from '../context/ContainerContext';
import { Loader2, Terminal, AlertCircle } from 'lucide-react';

export const ContainerPreview = () => {
    const { url, status, terminalOutput } = useContainer();

    // 1. LOADING STATES
    if (['booting', 'mounting', 'installing', 'starting_server'].includes(status)) {
        let statusText = 'Initializing...';
        if (status === 'booting') statusText = 'Booting Container...';
        else if (status === 'mounting') statusText = 'Setup Project Files...';
        else if (status === 'installing') statusText = 'Installing Dependencies...';
        else if (status === 'starting_server') statusText = 'Starting Dev Server...';

        return (
            <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center text-slate-400 font-mono text-xs p-4">
                <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
                <div className="mb-2 uppercase tracking-widest font-bold">{statusText}</div>
                <div className="w-full max-w-[400px] h-[200px] bg-black/50 rounded p-2 overflow-hidden border border-[#333] relative">
                    <div className="absolute top-0 left-0 w-full px-2 py-1 bg-[#252526] border-b border-[#333] flex items-center gap-2">
                        <Terminal size={10} /> <span>Terminal</span>
                    </div>
                    <div className="mt-6 flex flex-col justify-end h-full text-[10px] leading-tight">
                        {terminalOutput.slice(-8).map((line, i) => (
                            <div key={i} className="truncate opacity-70 whitespace-pre-wrap">{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center text-red-400">
                <AlertCircle size={32} className="mb-2" />
                <div className="text-sm font-bold">Container Failed</div>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#333] rounded hover:bg-[#444] text-white text-xs">Reload Editor</button>
            </div>
        );
    }

    if (status === 'ready' && !url) {
        return (
            <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center">
                <div className="text-sm font-bold text-slate-400">Waiting for server...</div>
            </div>
        );
    }

    // 2. FULL SCREEN PREVIEW (No Toolbar, No Frame)
    return (
        <div className="w-full h-full bg-[#09090b] relative flex flex-col">
            <iframe
                src={url!}
                className="w-full h-full border-none bg-white"
                title="Preview"
                allow="cross-origin-isolated"
            />
            {/* Minimal Status Badge */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 text-green-400 text-[10px] rounded-full font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl z-50 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Preview
            </div>
        </div>
    );
};
