import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, TicketCheck, ClipboardList, FileText, Wrench, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface SearchResults {
  customers: Array<{ id: number; contactName: string; companyName?: string; email?: string; phone?: string; city?: string }>;
  tickets: Array<{ id: number; title: string; level: string; status: string; customer?: { contactName?: string; companyName?: string } }>;
  orders: Array<{ id: number; number: string; description?: string; status: string; customer?: { contactName?: string; companyName?: string } }>;
  quotations: Array<{ id: number; number: string; title?: string; status: string; customer?: { contactName?: string; companyName?: string } }>;
  equipment: Array<{ id: number; type: string; brand?: string; model?: string; customer?: { contactName?: string; companyName?: string } }>;
  policies: Array<{ id: number; name: string; number: string; status: string; customer?: { contactName?: string; companyName?: string } }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch { /* ignore */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = results
    ? results.customers.length + results.tickets.length + results.orders.length + results.quotations.length + results.equipment.length + results.policies.length
    : 0;

  function goTo(path: string) {
    onClose();
    navigate(path);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, tickets, órdenes, cotizaciones..."
            className="flex-1 text-base outline-none placeholder:text-gray-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />}
          <button onClick={onClose} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            ESC
          </button>
        </div>

        {query.length >= 2 && !loading && results && totalResults === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin resultados para "{query}"</p>
        )}

        {results && totalResults > 0 && (
          <div className="max-h-96 overflow-y-auto p-2 space-y-0.5">
            {results.customers.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Clientes</p>
                {results.customers.map((c) => (
                  <button key={`c-${c.id}`} onClick={() => goTo(`/customers/${c.id}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <Users className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.contactName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.companyName || c.email || c.phone}</p>
                    </div>
                    {c.city && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{c.city}</span>}
                  </button>
                ))}
              </>
            )}
            {results.tickets.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Tickets</p>
                {results.tickets.map((t) => (
                  <button key={`t-${t.id}`} onClick={() => goTo(`/tickets/${t.id}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <TicketCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.customer?.contactName || t.customer?.companyName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.level === 'EMERGENCIA' ? 'bg-red-100 text-red-700' :
                      t.level === 'ATENCION' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{t.level}</span>
                  </button>
                ))}
              </>
            )}
            {results.orders.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Órdenes de Servicio</p>
                {results.orders.map((o) => (
                  <button key={`o-${o.id}`} onClick={() => goTo(`/service-orders/${o.id}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <ClipboardList className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{o.number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.description || o.customer?.contactName}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.quotations.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Cotizaciones</p>
                {results.quotations.map((q) => (
                  <button key={`q-${q.id}`} onClick={() => goTo(`/quotations/${q.id}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{q.number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{q.title || q.customer?.contactName}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.equipment.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Equipos</p>
                {results.equipment.map((e) => (
                  <button key={`e-${e.id}`} onClick={() => goTo(`/equipment`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <Wrench className="w-4 h-4 text-cyan-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{e.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{e.brand} {e.model} — {e.customer?.companyName || e.customer?.contactName}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.policies.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-2 pb-1">Pólizas</p>
                {results.policies.map((p) => (
                  <button key={`p-${p.id}`} onClick={() => goTo(`/policies/${p.id}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
                    <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.number}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-4">
          <span>↑↓ Navegar</span>
          <span>↵ Abrir</span>
          <span>Esc Cerrar</span>
        </div>
      </div>
    </div>
  );
}
