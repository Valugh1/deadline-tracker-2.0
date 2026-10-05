'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Mic, X, Send, Square, Loader2 } from 'lucide-react';

export function AiChat({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, status, sendMessage } = useChat({
    // @ts-ignore - API exists in legacy implementations
    api: '/api/chat',
    onFinish: (message: any) => {
      if (message && message.content) {
        speak(message.content);
      }
    },
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage({ content: input, role: 'user' } as any);
    setInput('');
  };
  
  const append = (msg: any) => {
    sendMessage(msg);
  };

  // Saluto iniziale (opzionale: solo la prima volta che apre la chat)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = `Ciao ${userName}, come posso aiutarti?`;
      speak(greeting);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Speech Recognition (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'it-IT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        
        // Invia automaticamente il form dopo aver ascoltato
        // Usiamo append per simulare l'invio
        append({
          role: 'user',
          content: transcript,
        });
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
  }, [append, setInput]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Ferma eventuale audio in riproduzione prima di ascoltare
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Ferma eventuali riproduzioni precedenti
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      
      // Prova a trovare una voce italiana
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
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-40"
        aria-label="Apri Kairon AI"
      >
        <Bot size={28} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 w-full sm:w-[450px] h-[85vh] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-full">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-slate-100 font-semibold text-lg">Kairon AI</h3>
                  <p className="text-slate-400 text-xs">Connesso al tuo DB</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                }}
                className="text-slate-400 hover:text-white p-2"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 mt-10">
                  <Bot size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Ciao {userName}, chiedimi di aggiungere, modificare o mostrare i tuoi task!</p>
                </div>
              )}
              
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                    }`}
                  >
                    {/* Visualizza i tool calls o il testo */}
                    {(m as any).parts ? (
                      (m as any).parts.map((part: any, i: number) => (
                        <div key={i}>
                          {part.type === 'text' && part.text}
                          {part.type === 'tool-invocation' && (
                            <div className="mt-2 text-xs text-slate-400 italic bg-slate-900/50 p-2 rounded">
                              Esecuzione azione: {part.toolInvocation.toolName}...
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <>{(m as any).content}</>
                    )}
                    {(m as any).toolInvocations?.map((toolInvocation: any) => {
                      const toolCallId = toolInvocation.toolCallId;
                      // const state = toolInvocation.state;
                      
                      return (
                        <div key={toolCallId} className="mt-2 text-xs text-slate-400 italic bg-slate-900/50 p-2 rounded">
                          Esecuzione azione: {toolInvocation.toolName}...
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-tl-sm p-3 flex gap-2 items-center">
                    <Loader2 size={16} className="animate-spin" /> Kairon sta pensando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-full flex-shrink-0 transition-colors ${
                    isListening 
                      ? 'bg-red-500/20 text-red-500 animate-pulse' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  {isListening ? <Square size={20} /> : <Mic size={20} />}
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={isListening ? "In ascolto..." : "Scrivi un messaggio..."}
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  disabled={isListening || isLoading}
                />
                
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-full flex-shrink-0 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
