import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { X, Send, Zap, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function simpleMarkdown(t: string): string {
  let s = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/### (.+)/g, '<h3 class="text-base font-bold text-primary-300 mt-4 mb-2">$1</h3>');
  s = s.replace(/## (.+)/g, '<h2 class="text-lg font-bold text-primary-300 mt-5 mb-2">$1</h2>');
  s = s.replace(/# (.+)/g, '<h1 class="text-xl font-bold text-primary-300 mt-5 mb-3">$1</h1>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em class="italic text-gray-200">$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code class="bg-white/10 text-primary-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre class="bg-black/40 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-green-300"><code>${c.trim()}</code></pre>`);
  s = s.replace(/^- (.+)/gm, '<li class="text-gray-200 ml-4 list-disc">$1</li>');
  s = s.replace(/(\d+)\. (.+)/g, '<li class="text-gray-200 ml-4 list-decimal">$1. $2</li>');
  s = s.replace(/\n\n/g, '<div class="h-2"></div>');
  s = s.replace(/\n/g, '<br/>');
  return s;
}

const WELCOME = `¡Hola! Soy tu **Asistente IA de HVAC-R CRM** ❄️

Puedo ayudarte con:

- **Catálogo de precios** — buscar, analizar, modificar items
- **Base de datos** — consultar clientes, equipos, tickets, cotizaciones
- **Archivos del proyecto** — leer, crear, modificar cualquier archivo
- **Ejecutar comandos** — correr scripts, npm, git, etc.
- **Reportes y análisis** — generar reportes, estadísticas, predicciones

¿Qué necesitas?`;

// ─── SVG Snowflake Character ──────────────────────────────────────────

interface CharProps {
  armL: number; armR: number; legL: number; legR: number;
  blink: boolean; thinking: boolean; s: number;
}

function Char({ armL, armR, legL, legR, blink, thinking, s }: CharProps) {
  const c = s / 2;
  const slX = c - s * 0.18, slY = c - s * 0.1;
  const srX = c + s * 0.18, srY = c - s * 0.1;
  const hlX = slX - Math.sin(armL) * s * 0.25, hlY = slY + Math.cos(armL) * s * 0.25;
  const hrX = srX - Math.sin(armR) * s * 0.25, hrY = srY + Math.cos(armR) * s * 0.25;
  const hpLx = c - s * 0.08, hpLy = c + s * 0.2;
  const hpRx = c + s * 0.08, hpRy = c + s * 0.2;
  const fLx = hpLx - Math.sin(legL) * s * 0.2, fLy = hpLy + Math.cos(legL) * s * 0.2;
  const fRx = hpRx - Math.sin(legR) * s * 0.2, fRy = hpRy + Math.cos(legR) * s * 0.2;
  const hh = s * 0.025; // hand/finger size

  const hex = (r: number) => {
    const p: string[] = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; p.push(`${c + r * Math.cos(a)},${c + r * Math.sin(a)}`); }
    return p.join(' ');
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <defs>
        <radialGradient id="bg" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#f0f9ff" /><stop offset="100%" stopColor="#bae6fd" />
        </radialGradient>
        <radialGradient id="gl" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.25)" /><stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </radialGradient>
        <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(56,189,248,0.3)" /></filter>
      </defs>
      <circle cx={c} cy={c} r={s * 0.45} fill="url(#gl)" />
      {/* Legs */}
      <line x1={hpLx} y1={hpLy} x2={fLx} y2={fLy} stroke="#38bdf8" strokeWidth={s * 0.035} strokeLinecap="round" />
      <line x1={hpRx} y1={hpRy} x2={fRx} y2={fRy} stroke="#38bdf8" strokeWidth={s * 0.035} strokeLinecap="round" />
      <circle cx={fLx} cy={fLy} r={s * 0.04} fill="#7dd3fc" />
      <circle cx={fRx} cy={fRy} r={s * 0.04} fill="#7dd3fc" />
      {/* Left toes */}
      <circle cx={fLx - s * 0.025} cy={fLy - s * 0.015} r={s * 0.015} fill="#bae6fd" />
      <circle cx={fLx + s * 0.025} cy={fLy - s * 0.015} r={s * 0.015} fill="#bae6fd" />
      {/* Right toes */}
      <circle cx={fRx - s * 0.025} cy={fRy - s * 0.015} r={s * 0.015} fill="#bae6fd" />
      <circle cx={fRx + s * 0.025} cy={fRy - s * 0.015} r={s * 0.015} fill="#bae6fd" />
      {/* Arms */}
      <line x1={slX} y1={slY} x2={hlX} y2={hlY} stroke="#38bdf8" strokeWidth={s * 0.03} strokeLinecap="round" />
      <line x1={srX} y1={srY} x2={hrX} y2={hrY} stroke="#38bdf8" strokeWidth={s * 0.03} strokeLinecap="round" />
      <circle cx={hlX} cy={hlY} r={s * 0.035} fill="#7dd3fc" />
      <circle cx={hrX} cy={hrY} r={s * 0.035} fill="#7dd3fc" />
      {/* Left fingers */}
      <line x1={hlX} y1={hlY} x2={hlX - hh * 1.2} y2={hlY - hh * 1.2} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      <line x1={hlX} y1={hlY} x2={hlX} y2={hlY - hh * 1.6} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      <line x1={hlX} y1={hlY} x2={hlX + hh * 1.2} y2={hlY - hh * 1.2} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      {/* Right fingers */}
      <line x1={hrX} y1={hrY} x2={hrX - hh * 1.2} y2={hrY - hh * 1.2} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      <line x1={hrX} y1={hrY} x2={hrX} y2={hrY - hh * 1.6} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      <line x1={hrX} y1={hrY} x2={hrX + hh * 1.2} y2={hrY - hh * 1.2} stroke="#7dd3fc" strokeWidth={s * 0.02} strokeLinecap="round" />
      {/* Body */}
      <g filter="url(#sh)">
        <polygon points={hex(s * 0.28)} fill="url(#bg)" stroke="#7dd3fc" strokeWidth={s * 0.02} />
        <line x1={c - s * 0.15} y1={c} x2={c + s * 0.15} y2={c} stroke="#bae6fd" strokeWidth={s * 0.015} strokeLinecap="round" />
        <line x1={c - s * 0.1} y1={c - s * 0.15} x2={c + s * 0.1} y2={c + s * 0.15} stroke="#bae6fd" strokeWidth={s * 0.015} strokeLinecap="round" />
        <line x1={c - s * 0.1} y1={c + s * 0.15} x2={c + s * 0.1} y2={c - s * 0.15} stroke="#bae6fd" strokeWidth={s * 0.015} strokeLinecap="round" />
        <circle cx={c - s * 0.12} cy={c} r={s * 0.02} fill="#7dd3fc" opacity={0.6} />
        <circle cx={c + s * 0.12} cy={c} r={s * 0.02} fill="#7dd3fc" opacity={0.6} />
        <circle cx={c} cy={c - s * 0.12} r={s * 0.02} fill="#7dd3fc" opacity={0.6} />
        <circle cx={c} cy={c + s * 0.12} r={s * 0.02} fill="#7dd3fc" opacity={0.6} />
      </g>
      {/* Cheeks */}
      <circle cx={c - s * 0.1} cy={c + s * 0.04} r={s * 0.045} fill="#fecdd3" opacity={0.6} />
      <circle cx={c + s * 0.1} cy={c + s * 0.04} r={s * 0.045} fill="#fecdd3" opacity={0.6} />
      {/* Eyes */}
      {blink ? (
        <line x1={c - s * 0.09} y1={c - s * 0.04} x2={c - s * 0.05} y2={c - s * 0.04} stroke="#0c4a6e" strokeWidth={s * 0.025} strokeLinecap="round" />
      ) : (
        <ellipse cx={c - s * 0.07} cy={c - s * 0.04} rx={s * 0.03} ry={s * 0.035} fill="#0c4a6e" />
      )}
      {blink ? (
        <line x1={c + s * 0.05} y1={c - s * 0.04} x2={c + s * 0.09} y2={c - s * 0.04} stroke="#0c4a6e" strokeWidth={s * 0.025} strokeLinecap="round" />
      ) : (
        <ellipse cx={c + s * 0.07} cy={c - s * 0.04} rx={s * 0.03} ry={s * 0.035} fill="#0c4a6e" />
      )}
      {!blink && <><circle cx={c - s * 0.055} cy={c - s * 0.055} r={s * 0.012} fill="white" opacity={0.8} /><circle cx={c + s * 0.085} cy={c - s * 0.055} r={s * 0.012} fill="white" opacity={0.8} /></>}
      {/* Smile */}
      <motion.path
        d={thinking ? `M ${c - s * 0.05} ${c + s * 0.06} Q ${c} ${c + s * 0.13} ${c + s * 0.05} ${c + s * 0.06}` : `M ${c - s * 0.06} ${c + s * 0.08} Q ${c} ${c + s * 0.15} ${c + s * 0.06} ${c + s * 0.08}`}
        stroke="#0369a1" strokeWidth={s * 0.02} strokeLinecap="round" fill="none"
        animate={thinking ? { d: `M ${c - s * 0.05} ${c + s * 0.06} Q ${c} ${c + s * 0.13} ${c + s * 0.05} ${c + s * 0.06}` } : { d: `M ${c - s * 0.06} ${c + s * 0.08} Q ${c} ${c + s * 0.15} ${c + s * 0.06} ${c + s * 0.08}` }}
        transition={{ duration: 0.3 }}
      />
      {/* Ice crown */}
      <g opacity={0.5}>
        <line x1={c - s * 0.05} y1={c - s * 0.25} x2={c + s * 0.05} y2={c - s * 0.25} stroke="#7dd3fc" strokeWidth={s * 0.015} strokeLinecap="round" />
        <line x1={c} y1={c - s * 0.28} x2={c} y2={c - s * 0.22} stroke="#7dd3fc" strokeWidth={s * 0.015} strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── Physics limb hook ───────────────────────────────────────────────

function useLimbs() {
  const rawArmL = useMotionValue(0);
  const rawArmR = useMotionValue(0);
  const rawLegL = useMotionValue(0);
  const rawLegR = useMotionValue(0);

  const armL = useSpring(rawArmL, { stiffness: 100, damping: 8, mass: 0.5 });
  const armR = useSpring(rawArmR, { stiffness: 100, damping: 8, mass: 0.5 });
  const legL = useSpring(rawLegL, { stiffness: 80, damping: 10, mass: 0.4 });
  const legR = useSpring(rawLegR, { stiffness: 80, damping: 10, mass: 0.4 });

  const velRef = useRef({ vx: 0, vy: 0 });
  const idleRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      idleRef.current += dt;

      const { vx, vy } = velRef.current;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const idle = Math.sin(idleRef.current * 0.8) * 0.08;
      const swing = -vx * 0.006;
      const sway = vy * 0.004;
      const walk = speed * 0.003 * Math.sin(idleRef.current * 4);

      rawArmL.set(swing + sway + idle);
      rawArmR.set(-swing - sway - idle);
      rawLegL.set(swing * 0.5 + sway * 0.4 + idle * 0.3 + walk);
      rawLegR.set(-swing * 0.5 - sway * 0.4 - idle * 0.3 + walk);

      velRef.current.vx *= 0.98;
      velRef.current.vy *= 0.98;

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rawArmL, rawArmR, rawLegL, rawLegR]);

  return { armL, armR, legL, legR, velRef };
}

// ─── Main Component ──────────────────────────────────────────────────

export default function AiAssistant() {
  const { user } = useAuth();

  // Force unregister PWA service worker to always get fresh assets
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const r of regs) r.unregister();
      });
    }
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [blink, setBlink] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [thinking, setThinking] = useState(false);

  const msgsEnd = useRef<HTMLDivElement>(null);
  const inpRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { armL, armR, legL, legR, velRef } = useLimbs();

  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0, t: 0 });
  const lastMove = useRef({ x: 0, y: 0, t: 0 });
  const pointerDown = useRef(false);
  const hasMoved = useRef(false);

  // Blink timer
  useEffect(() => {
    const int = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(int);
  }, []);

  const scrolldown = useCallback(() => msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scrolldown(); }, [messages, streaming, scrolldown]);
  useEffect(() => { if (isOpen && inpRef.current) inpRef.current.focus(); }, [isOpen]);

  // ─── Drag ──────────────────────────────────────────────────────────

  const onDown = useCallback((e: React.PointerEvent) => {
    pointerDown.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, t: Date.now() };
    lastMove.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, [pos]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      hasMoved.current = true;
      setDragging(true);
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py - dy });

      const idt = Math.max(1, Date.now() - lastMove.current.t);
      velRef.current.vx = (e.clientX - lastMove.current.x) / idt * 16;
      velRef.current.vy = (e.clientY - lastMove.current.y) / idt * 16;
      lastMove.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  }, [velRef]);

  const onUp = useCallback(() => {
    pointerDown.current = false;
    setDragging(false);
    if (!hasMoved.current) {
      setIsOpen(true);
    }
  }, []);

  // ─── Chat ──────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput('');
    setThinking(true);
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setIsLoading(true);
    setStreaming('');

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const tok = localStorage.getItem('token');
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ message: msg, history: messages.map(m => ({ role: m.role, content: m.content })) }),
        signal: ac.signal,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); setStreaming(`**Error:** ${e.error}`); return; }
      const r = res.body?.getReader(); if (!r) return;
      const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await r.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        for (const ln of buf.split('\n')) {
          if (!ln.startsWith('data: ')) continue;
          const d = ln.slice(6).trim(); if (!d) continue;
          try { const p = JSON.parse(d); if (p.done) { setMessages(pv => [...pv, { role: 'assistant', content: p.fullContent }]); setStreaming(''); } else if (p.content) setStreaming(pr => pr + p.content); else if (p.error) setStreaming(`**Error:** ${p.error}`); } catch {}
        }
        buf = '';
      }
    } catch (err: any) { if (err.name !== 'AbortError') setStreaming(`**Error de conexión:** ${err.message}`); }
    finally { setIsLoading(false); setThinking(false); abortRef.current = null; }
  }, [input, isLoading, messages]);

  const stop = () => {
    abortRef.current?.abort();
    if (streaming) { setMessages(p => [...p, { role: 'assistant', content: streaming }]); setStreaming(''); }
    setIsLoading(false); setThinking(false);
  };

  const clear = () => { setMessages([{ role: 'assistant', content: WELCOME }]); setStreaming(''); };
  const keyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  if (user?.role !== 'ADMIN') return null;

  const as = 80; // avatar size
  const thinkingAnim = thinking || (isLoading && !streaming);

  return (
    <>
      {/* Floating Avatar */}
      {!isOpen && (
        <div
          className="fixed z-[9999] select-none"
          style={{ bottom: 24 + pos.y, right: 24 - pos.x, touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <motion.div
            className="relative"
            animate={dragging ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <motion.div
              animate={dragging ? { y: 0 } : { y: [0, -5, 0] }}
              transition={dragging ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Char armL={armL.get()} armR={armR.get()} legL={legL.get()} legR={legR.get()} blink={blink} thinking={thinkingAnim} s={as} />
            </motion.div>

            {/* Glow */}
            <div className="absolute inset-0 rounded-full opacity-30 blur-xl pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)',
              animation: thinkingAnim ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />

            {/* Thinking dots */}
            {thinkingAnim && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg z-[9999] flex flex-col bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#0b1120] border-l border-white/10 shadow-2xl shadow-primary-900/20"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                    <Char armL={0.1} armR={-0.1} legL={0.05} legR={-0.05} blink={false} thinking={false} s={40} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-white leading-tight">Asistente IA ❄️</h2>
                    <p className="text-[11px] text-gray-500">ADMIN • HVAC-R CRM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={clear} className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"><Zap className="w-4 h-4" /></button>
                  <button onClick={() => setMinimized(!minimized)} className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors">
                    <ChevronDown className={`w-4 h-4 transition-transform ${minimized ? '' : 'rotate-180'}`} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {!minimized && (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-sky-500/10"><Sparkles className="w-4 h-4 text-sky-300" /></div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-md' : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-md'}`}
                          dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }} />
                      </div>
                    ))}
                    {streaming && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-sky-500/10"><Sparkles className="w-4 h-4 text-sky-300" /></div>
                        <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white/5 text-gray-200 border border-white/5 rounded-tl-md">
                          <span dangerouslySetInnerHTML={{ __html: simpleMarkdown(streaming) }} />
                          <span className="inline-block w-2 h-4 bg-sky-400 ml-0.5 animate-pulse rounded-sm" />
                        </div>
                      </div>
                    )}
                    {isLoading && !streaming && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-sky-500/10"><Sparkles className="w-4 h-4 text-sky-300" /></div>
                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 border border-white/5 rounded-tl-md flex gap-1.5">
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={msgsEnd} />
                  </div>

                  <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-3 py-1.5 focus-within:border-sky-500/50 focus-within:bg-white/10 transition-all">
                      <input ref={inpRef} type="text" value={input}
                        onChange={e => setInput(e.target.value)} onKeyDown={keyDown}
                        placeholder="Escribe lo que necesites..."
                        className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none py-1.5" disabled={isLoading} />
                      {isLoading ? (
                        <button onClick={stop} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={send} disabled={!input.trim()}
                          className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">Enter para enviar</p>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
