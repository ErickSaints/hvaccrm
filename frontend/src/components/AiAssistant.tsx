import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Brain, Zap, ChevronDown, Bot } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function simpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/### (.+)/g, '<h3 class="text-base font-bold text-primary-300 mt-4 mb-2">$1</h3>');
  html = html.replace(/## (.+)/g, '<h2 class="text-lg font-bold text-primary-300 mt-5 mb-2">$1</h2>');
  html = html.replace(/# (.+)/g, '<h1 class="text-xl font-bold text-primary-300 mt-5 mb-3">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-200">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-white/10 text-primary-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="bg-black/40 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-green-300"><code>${code.trim()}</code></pre>`
  );
  html = html.replace(/^- (.+)/gm, '<li class="text-gray-200 ml-4 list-disc">$1</li>');
  html = html.replace(/(\d+)\. (.+)/g, '<li class="text-gray-200 ml-4 list-decimal">$1. $2</li>');
  html = html.replace(/\n\n/g, '<div class="h-2"></div>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

const WELCOME_MESSAGE = `¡Hola! Soy tu **Asistente IA de HVAC-R CRM**. 🤖

Puedo ayudarte con:

- **Catálogo de precios** — buscar, analizar, modificar items
- **Base de datos** — consultar clientes, equipos, tickets, cotizaciones
- **Archivos del proyecto** — leer, crear, modificar cualquier archivo
- **Ejecutar comandos** — correr scripts, npm, git, etc.
- **Reportes y análisis** — generar reportes, estadísticas, predicciones

¿Qué necesitas?`;

export default function AiAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    setStreamingContent('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error de conexión' }));
        setStreamingContent(`**Error:** ${err.error || 'Error del servidor'}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.done) {
              setMessages(prev => [...prev, { role: 'assistant', content: parsed.fullContent }]);
              setStreamingContent('');
            } else if (parsed.content) {
              setStreamingContent(prev => prev + parsed.content);
            } else if (parsed.error) {
              setStreamingContent(`**Error:** ${parsed.error}`);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStreamingContent(`**Error de conexión:** ${err.message}`);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    if (streamingContent) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingContent }]);
      setStreamingContent('');
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    setStreamingContent('');
  };

  if (user?.role !== 'ADMIN') return null;

  const avatarVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 0 20px rgba(99,102,241,0.3)',
    },
    hover: {
      scale: 1.1,
      boxShadow: '0 0 40px rgba(99,102,241,0.6)',
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <>
      {/* Floating Avatar */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <motion.button
            onClick={() => setIsOpen(true)}
            variants={avatarVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className="relative group"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-full flex items-center justify-center cursor-pointer shadow-2xl shadow-primary-500/30">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full opacity-20 blur-xl animate-pulse-slow" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-gray-200 text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Asistente IA
            </span>
          </motion.button>
        </div>
      )}

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg z-[9999] flex flex-col bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#0b1120] border-l border-white/10 shadow-2xl shadow-primary-900/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-white leading-tight">Asistente IA</h2>
                    <p className="text-[11px] text-gray-500">ADMIN • HVAC-R CRM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors text-xs"
                    title="Limpiar conversación"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? '' : 'rotate-180'}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/10">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary-600 text-white rounded-tr-md'
                              : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-md'
                          }`}
                          dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }}
                        />
                      </div>
                    ))}

                    {/* Streaming message */}
                    {streamingContent && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/10">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white/5 text-gray-200 border border-white/5 rounded-tl-md">
                          <span dangerouslySetInnerHTML={{ __html: simpleMarkdown(streamingContent) }} />
                          <span className="inline-block w-2 h-4 bg-primary-400 ml-0.5 animate-pulse rounded-sm" />
                        </div>
                      </div>
                    )}

                    {isLoading && !streamingContent && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/10">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 border border-white/5 rounded-tl-md">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-3 py-1.5 focus-within:border-primary-500/50 focus-within:bg-white/10 transition-all">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe lo que necesites..."
                        className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none py-1.5"
                        disabled={isLoading}
                      />
                      {isLoading ? (
                        <button
                          onClick={handleStop}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Detener"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSend}
                          disabled={!input.trim()}
                          className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                      Enter para enviar • Las respuestas pueden tardar unos segundos
                    </p>
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
