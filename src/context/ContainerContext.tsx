import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { VITE_REACT_TEMPLATE } from '../data/fileSystemTemplates';

// Global singleton to prevent double-boot
let bootPromise: Promise<WebContainer> | null = null;

// Define more granular statuses for the loading screen
export type ContainerStatus = 'booting' | 'mounting' | 'installing' | 'starting_server' | 'ready' | 'error';

interface ContainerContextType {
    instance: WebContainer | null;
    status: ContainerStatus;
    terminalOutput: string[];
    url: string | null;
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

export const ContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [instance, setInstance] = useState<WebContainer | null>(null);
    const [status, setStatus] = useState<ContainerStatus>('booting');
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [url, setUrl] = useState<string | null>(null);

    const log = useCallback((msg: string) => {
        setTerminalOutput(prev => [...prev.slice(-100), msg]);
    }, []);

    // --- THE AUTOMATED STARTUP SEQUENCE ---
    useEffect(() => {
        if (instance || status === 'ready' || status === 'error') return;

        async function runFullStartupSequence() {
            try {
                // === STEP 1: BOOT KERNEL ===
                log("⚡ System: Initializing WebContainer Kernel...");
                if (!bootPromise) bootPromise = WebContainer.boot();
                const webcontainer = await bootPromise;
                setInstance(webcontainer);

                // === STEP 2: MOUNT FILES ===
                setStatus('mounting');
                log("📁 System: Mounting template files...");
                await webcontainer.mount(VITE_REACT_TEMPLATE);

                // === STEP 3: INSTALL DEPENDENCIES ===
                setStatus('installing');
                log("> pnpm install (This may take a moment...)");
                const installProcess = await webcontainer.spawn('pnpm', ['install']);

                // Use a WritableStream to log output
                installProcess.output.pipeTo(new WritableStream({
                    write(data) { log(data); }
                }));

                const installExitCode = await installProcess.exit;
                if (installExitCode !== 0) {
                    log("⚠️ Install failed due to network restrictions. Attempting to run with CDN fallbacks...");
                } else {
                    log("✅ Dependencies installed.");
                }

                // === STEP 4: START DEV SERVER ===
                setStatus('starting_server');
                log("> pnpm run dev");
                const devProcess = await webcontainer.spawn('pnpm', ['run', 'dev']);

                devProcess.output.pipeTo(new WritableStream({
                    write(data) { log(data); }
                }));

                // === STEP 5: WAIT FOR SERVER READY ===
                log("⏳ Waiting for server to listen...");
                webcontainer.on('server-ready', (_, serverUrl) => {
                    log(`🚀 Server ready at ${serverUrl}`);
                    setUrl(serverUrl);
                    // FINAL STATE: Only now do we show the editor
                    setStatus('ready');
                });

            } catch (e) {
                console.error("Startup failed:", e);
                log(`❌ Critical Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
                setStatus('error');
            }
        }

        runFullStartupSequence();
    }, [instance, log, status]);

    const writeFile = useCallback(async (path: string, content: string) => {
        if (!instance) return;
        await instance.fs.writeFile(path, content);
    }, [instance]);

    const readFile = useCallback(async (path: string) => {
        if (!instance) return "";
        const bytes = await instance.fs.readFile(path);
        return new TextDecoder().decode(bytes);
    }, [instance]);

    return (
        <ContainerContext.Provider value={{
            instance, status, terminalOutput, url,
            writeFile, readFile
        }}>
            {children}
        </ContainerContext.Provider>
    );
};

export const useContainer = () => {
    const context = useContext(ContainerContext);
    if (!context) throw new Error("useContainer must be used within ContainerProvider");
    return context;
};
