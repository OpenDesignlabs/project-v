import React, { useMemo } from 'react';
import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';

interface CodeRendererProps {
    code: string;
}

/**
 * CodeRenderer - Live compiles and renders React/JSX/TSX code
 * Uses @babel/standalone with TypeScript support to transpile in the browser
 */
export const CodeRenderer: React.FC<CodeRendererProps> = ({ code }) => {
    const Component = useMemo(() => {
        if (!code) return null;

        try {
            // 1. Clean the code: Remove 'import' statements (Browser can't handle them directly)
            let cleanCode = code
                .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '')  // Remove ES6 imports
                .replace(/import\s+['"][^'"]+['"];?/g, '')            // Remove side-effect imports
                .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '') // Remove named imports
                .replace(/import\s+type\s+.*?;/g, '') // Remove type-only imports
                .trim();

            // 2. Handle different export patterns
            let functionalCode = cleanCode;

            // Handle: export default function ComponentName()
            if (/export\s+default\s+function\s+(\w+)/.test(functionalCode)) {
                functionalCode = functionalCode.replace(/export\s+default\s+function\s+(\w+)/, 'function $1');
                const match = cleanCode.match(/export\s+default\s+function\s+(\w+)/);
                if (match) {
                    functionalCode += `; return ${match[1]};`;
                }
            }
            // Handle: export default () => or export default (props) =>
            else if (/export\s+default\s+\(/.test(functionalCode)) {
                functionalCode = functionalCode.replace('export default', 'const DefaultComponent =');
                functionalCode += '; return DefaultComponent;';
            }
            // Handle: export default ComponentName (reference)
            else if (/export\s+default\s+(\w+)\s*;?$/.test(functionalCode)) {
                const match = functionalCode.match(/export\s+default\s+(\w+)\s*;?$/);
                if (match) {
                    functionalCode = functionalCode.replace(/export\s+default\s+\w+\s*;?$/, '');
                    functionalCode += `; return ${match[1]};`;
                }
            }
            // Handle: const ComponentName = ... then export { ComponentName }
            else if (/export\s*\{/.test(functionalCode)) {
                const exportMatch = functionalCode.match(/export\s*\{\s*(\w+)/);
                functionalCode = functionalCode.replace(/export\s*\{[^}]*\}\s*;?/, '');
                if (exportMatch) {
                    functionalCode += `; return ${exportMatch[1]};`;
                }
            }
            // Handle: export const ComponentName = 
            else if (/export\s+const\s+(\w+)\s*=/.test(functionalCode)) {
                const match = functionalCode.match(/export\s+const\s+(\w+)\s*=/);
                functionalCode = functionalCode.replace('export const', 'const');
                if (match) {
                    functionalCode += `; return ${match[1]};`;
                }
            }
            // Handle: export function ComponentName
            else if (/export\s+function\s+(\w+)/.test(functionalCode)) {
                const match = functionalCode.match(/export\s+function\s+(\w+)/);
                functionalCode = functionalCode.replace('export function', 'function');
                if (match) {
                    functionalCode += `; return ${match[1]};`;
                }
            }
            // Fallback: Try to find any function definition
            else {
                const funcMatch = functionalCode.match(/function\s+(\w+)\s*\(/);
                const constMatch = functionalCode.match(/const\s+(\w+)\s*=\s*\(/);
                const name = funcMatch?.[1] || constMatch?.[1];
                if (name) {
                    functionalCode += `; return ${name};`;
                }
            }

            // 3. Transpile JSX/TSX -> JS using Babel with TypeScript support
            const transpiled = Babel.transform(functionalCode, {
                presets: ['react', 'env', 'typescript'], // TypeScript support added!
                filename: 'file.tsx' // Important: tells Babel this is TSX
            }).code;

            if (!transpiled) {
                throw new Error('Babel transpilation failed');
            }

            // 4. Create the Function
            // We inject React and common libraries into the execution scope
            const func = new Function(
                'React',
                'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef',
                'lucide',
                transpiled
            );

            // 5. Execute and get the component
            const Result = func(
                React,
                React.useState,
                React.useEffect,
                React.useMemo,
                React.useCallback,
                React.useRef,
                LucideIcons
            );

            return Result;

        } catch (err) {
            console.error("Component Compilation Error:", err);

            // Return an error component
            return () => (
                <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center p-3 bg-red-50 border-2 border-dashed border-red-300 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-red-600 mb-1">Render Error</span>
                    <span className="text-[9px] text-red-500 text-center leading-tight max-w-full overflow-hidden px-2">
                        {err instanceof Error ? err.message.slice(0, 80) : 'Unknown error'}
                    </span>
                </div>
            );
        }
    }, [code]);

    if (!Component) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No component
            </div>
        );
    }

    // Render the compiled component with error boundary wrapper
    try {
        return <Component />;
    } catch (renderErr) {
        console.error("Runtime render error:", renderErr);
        return (
            <div className="w-full h-full flex items-center justify-center p-2 bg-amber-50 border border-amber-200 rounded text-amber-600 text-xs">
                Runtime error
            </div>
        );
    }
};
