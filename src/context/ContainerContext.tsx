import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';

interface FileSystem {
    [key: string]: { file: { contents: string } } | { directory: FileSystem };
}

interface ContainerContextType {
    instance: WebContainer | null;
    status: 'booting' | 'ready' | 'installing' | 'running' | 'error';
    terminalOutput: string[];
    url: string | null;
    writeFile: (path: string, content: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
    installDependencies: () => Promise<void>;
    startDevServer: () => Promise<void>;
}

const ContainerContext = createContext<ContainerContextType | undefined>(undefined);

// --- INITIAL VITE + REACT TEMPLATE ---
// This mimics the result of 'npm create vite@latest'
const INITIAL_PROJECT: FileSystem = {
    'package.json': {
        file: {
            contents: JSON.stringify({
                name: "vectra-app",
                private: true,
                version: "0.0.0",
                type: "module",
                scripts: {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                },
                dependencies: {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "lucide-react": "^0.263.1"
                },
                devDependencies: {
                    "@types/react": "^18.2.15",
                    "@types/react-dom": "^18.2.7",
                    "@vitejs/plugin-react": "^4.0.3",
                    "vite": "^4.4.5",
                    "autoprefixer": "^10.4.14",
                    "postcss": "^8.4.27",
                    "tailwindcss": "^3.3.3"
                }
            }, null, 2)
        }
    },
    'index.html': {
        file: {
            contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vectra App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        }
    },
    'vite.config.js': {
        file: {
            contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})`
        }
    },
    'tailwind.config.js': {
        file: {
            contents: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
        }
    },
    'postcss.config.js': {
        file: {
            contents: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        }
    },
    'src': {
        directory: {
            'main.tsx': {
                file: {
                    contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
                }
            },
            'index.css': {
                file: { contents: `@tailwind base;\n@tailwind components;\n@tailwind utilities;` }
            },
            'App.tsx': {
                file: {
                    contents: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
       {/* VECTRA_INJECTION_POINT */}
       <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Ready to Build</h1>
            <p className="text-gray-500">Drag components here to start.</p>
          </div>
       </div>
    </div>
  )
}`
                }
            },
            'components': { directory: {} } // Start with empty components folder
        }
    }
};

export const ContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [instance, setInstance] = useState<WebContainer | null>(null);
    const [status, setStatus] = useState<'booting' | 'ready' | 'installing' | 'running' | 'error'>('booting');
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [url, setUrl] = useState<string | null>(null);
    const booted = useRef(false);

    const log = useCallback((msg: string) => {
        setTerminalOutput(prev => [...prev.slice(-100), msg]); // Keep last 100 lines
    }, []);

    // 1. BOOT CONTAINER ON MOUNT
    useEffect(() => {
        if (booted.current) return;
        booted.current = true;

        async function boot() {
            try {
                log("⚡ System: Booting WebContainer...");
                const webcontainer = await WebContainer.boot();
                setInstance(webcontainer);

                log("📁 System: Mounting File System...");
                await webcontainer.mount(INITIAL_PROJECT);

                setStatus('ready');
                log("✅ System: Ready. Click 'Install & Run' to start dev server.");
            } catch (e) {
                console.error("Boot failed:", e);
                log(`❌ Error: ${e instanceof Error ? e.message : 'Unknown boot error'}`);
                setStatus('error');
            }
        }
        boot();
    }, [log]);

    // --- HELPERS ---

    const writeFile = useCallback(async (path: string, content: string) => {
        if (!instance) return;
        await instance.fs.writeFile(path, content);
        log(`📝 Wrote: ${path}`);
    }, [instance, log]);

    const readFile = useCallback(async (path: string) => {
        if (!instance) return "";
        const bytes = await instance.fs.readFile(path);
        return new TextDecoder().decode(bytes);
    }, [instance]);

    // 2. INSTALL DEPENDENCIES
    const installDependencies = useCallback(async () => {
        if (!instance) return;
        setStatus('installing');
        log("> npm install");

        const process = await instance.spawn('npm', ['install']);

        process.output.pipeTo(new WritableStream({
            write(data) { log(data); }
        }));

        const exitCode = await process.exit;
        if (exitCode === 0) {
            log("✅ Dependencies installed successfully.");
        } else {
            log(`❌ npm install failed with code ${exitCode}`);
            setStatus('error');
        }
    }, [instance, log]);

    // 3. START DEV SERVER
    const startDevServer = useCallback(async () => {
        if (!instance) return;
        setStatus('running');
        log("> npm run dev");

        const process = await instance.spawn('npm', ['run', 'dev']);

        process.output.pipeTo(new WritableStream({
            write(data) { log(data); }
        }));

        instance.on('server-ready', (_port, serverUrl) => {
            log(`🚀 Server ready at ${serverUrl}`);
            setUrl(serverUrl);
        });
    }, [instance, log]);

    return (
        <ContainerContext.Provider value={{
            instance, status, terminalOutput, url,
            writeFile, readFile, installDependencies, startDevServer
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
