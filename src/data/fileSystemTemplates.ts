export interface FileSystem {
  [key: string]: { file: { contents: string } } | { directory: FileSystem };
}

export const VITE_REACT_TEMPLATE: FileSystem = {
  // 1. .npmrc (Optimized for speed & stability)
  '.npmrc': {
    file: {
      contents: [
        'registry=https://registry.npmmirror.com/',
        'strict-ssl=false',
        'fetch-retries=5',
        'fetch-retry-factor=2',
        'fetch-retry-mintimeout=10000',
        'fetch-retry-maxtimeout=60000',
        'shamefully-hoist=true' // SPEED HACK: Flat node_modules installs faster
      ].join('\n')
    }
  },

  // 2. TAILWIND CONFIG
  'tailwind.config.js': {
    file: {
      contents: `
              /** @type {import('tailwindcss').Config} */
              export default {
                content: [
                  "./index.html",
                  "./src/**/*.{js,ts,jsx,tsx}",
                ],
                theme: {
                  extend: {},
                },
                plugins: [],
              }
            `
    }
  },

  // 3. POSTCSS CONFIG
  'postcss.config.js': {
    file: {
      contents: `
              export default {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              }
            `
    }
  },

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
          "lucide-react": "^0.263.1",
          "clsx": "^2.0.0",
          "tailwind-merge": "^1.14.0",
          "framer-motion": "^10.16.4",
          "react-router-dom": "^6.14.1"
        },
        devDependencies: {
          "@types/react": "^18.2.15",
          "@types/react-dom": "^18.2.7",
          // --- SPEED HACK: SWC PLUGIN ---
          "@vitejs/plugin-react-swc": "^3.3.2",
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
      contents: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vectra App</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            }
          }
        }
      }
    </script>
    <style>
      body { font-family: 'Inter', sans-serif; }
    </style>
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
      // --- SPEED HACK: USE SWC PLUGIN ---
      contents: `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

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
  'src': {
    directory: {
      'main.tsx': {
        file: {
          contents: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)`
        }
      },
      'index.css': {
        file: { contents: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml, body, #root {\n  height: 100%;\n  width: 100%;\n  margin: 0;\n  background: #fff;\n}` }
      },
      'App.tsx': {
        file: {
          contents: `
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-x-hidden">
       {/* VECTRA_INJECTION_POINT */}
       <div className="flex flex-col items-center justify-center h-screen border-2 border-dashed border-slate-200 m-4 rounded-xl">
          <h1 className="text-2xl font-bold text-slate-400">Drag components here</h1>
       </div>
    </div>
  )
}`
        }
      },
      'components': { directory: {} },
      'pages': { directory: {} },
      'assets': { directory: {} }
    }
  }
};
