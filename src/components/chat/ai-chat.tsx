'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Mic, X, Send, Square, Loader2 } from 'lucide-react';

type Message = { id: string; role: 'user' | 'assistant'; content: string; toolInvocations?: any[] };

export function AiChat({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (inputStr: string) => {
    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: inputStr };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      });
      
      if (!res.ok) {
        throw new Error(`Errore del server: ${res.status}`);
      }
      
      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || 'Operazione completata.',
        toolInvocations: data.toolCalls?.map((tc: any) => ({
          toolCallId: tc.toolCallId || tc.id,
          toolName: tc.toolName || tc.function?.name || 'tool',
        }))
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      if (data.text) {
        speak(data.text);
      } else {
        speak('Operazione completata.');
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput('');
    sendMessage(currentInput);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'it-IT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        sendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      const voices = window.speechSynthesis.getVoices();
      const italianVoice = voices.find(v => v.lang.startsWith('it'));
      if (italianVoice) {
        utterance.voice = italianVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 p-1.5 pr-4 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        aria-label="Apri Kairon AI"
      >
        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ai-orb-glow">
          <Bot size={22} />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-extrabold leading-none">Kairon AI</p>
          <p className="text-xs text-indigo-200 leading-tight mt-0.5">Assistente Vocale</p>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-elevated w-full sm:w-[430px] h-[85vh] sm:h-[580px] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-indigo-500/30">
            <div
              className="p-4 bg-gradient-to-r from-indigo-600/25 to-purple-600/25 border-b flex justify-between items-center"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl shadow">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                    Kairon AI Copilot
                  </h3>
                  <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Connesso al tuo DB
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                }}
                className="p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center mt-10 px-4" style={{ color: 'var(--text-secondary)' }}>
                  <Bot size={44} className="mx-auto mb-3 opacity-30 text-indigo-400" />
                  <p className="text-sm font-medium">
                    Ciao {userName}, chiedimi a voce o via testo di aggiungere, modificare o mostrare i tuoi task!
                  </p>
                </div>
              )}
              
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-md' 
                        : 'glass-surface rounded-tl-sm'
                    }`}
                  >
                    <div>{m.content}</div>
                    {m.toolInvocations?.map((toolInvocation: any, i: number) => (
                      <div key={i} className="mt-2 text-xs italic glass-surface p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                        ⚡ Esecuzione azione: {toolInvocation.toolName}...
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {error && (
                <div className="text-center text-rose-400 text-xs mt-2 bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-xl">
                  Errore di connessione: {error.message}
                </div>
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-surface rounded-2xl rounded-tl-sm p-3 flex gap-2 items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 size={16} className="animate-spin text-indigo-400" /> Kairon sta pensando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-xl flex-shrink-0 transition-colors cursor-pointer ${
                    isListening 
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30' 
                      : 'glass-surface hover:bg-indigo-500/20 text-indigo-400'
                  }`}
                  disabled={isLoading}
                >
                  {isListening ? <Square size={18} /> : <Mic size={18} />}
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={isListening ? '🎙️ In ascolto...' : 'Scrivi o parla a Kairon AI...'}
                  className="flex-1 kairon-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isListening || isLoading}
                />
                
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex-shrink-0 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
