import { useEffect, useState } from 'react';
import { X, Keyboard, Command, ArrowUp, ArrowDown } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Búsqueda global' },
  { keys: ['?'], desc: 'Ayuda de atajos' },
  { keys: ['Esc'], desc: 'Cerrar modales / búsqueda' },
  { keys: ['↑', '↓'], desc: 'Navegar resultados' },
  { keys: ['↵'], desc: 'Abrir seleccionado' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <Keyboard className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Atajos de Teclado</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Navegación rápida del CRM</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <span key={j} className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700">
                    {key === '⌘' ? <Command className="w-3 h-3" /> : key === '↑' ? <ArrowUp className="w-3 h-3" /> : key === '↓' ? <ArrowDown className="w-3 h-3" /> : key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">Presiona <kbd className="text-[11px] font-mono font-medium bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">?</kbd> en cualquier momento para abrir esta ayuda</p>
        </div>
      </div>
    </div>
  );
}
