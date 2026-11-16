import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import RajasthanRoyalsLogo from './RajasthanRoyalsLogo.jsx';
import { sampleScoutQA } from '../data/cricketData.js';

export default function ScoutChatWidget({ isOpen, setIsOpen, externalPrompt, onClearExternalPrompt }) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'scout',
      role: 'agent',
      text: 'Welcome to the SupeRR Selector V14 Run-Expectancy WP Leverage Consensus Engine. I am your AI Scouting Assistant. Ask me about our top consensus-ranked batters like Phil Salt (+11.38), Jos Buttler (+8.21), Tim David (+8.10), or bowlers like Sunil Narine (+22.54) and Adam Zampa (+15.42)!',
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle external prompts triggered from player modal or header
  useEffect(() => {
    if (externalPrompt) {
      setIsOpen(true);
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const quickQuestions = [
    "Tell me about the All-Rounder MVPs",
    "How does Empirical Bayes Shrinkage work?",
    "Why evaluate per 100 Balls?",
    "Why is Phil Salt ranked #1 Batter?",
    "Explain Win-Probability Leverage",
    "How are bowlers ranked under V14?"
  ];

  // Helper to generate domain-authentic response
  const generateScoutResponse = async (userQuery) => {
    const qLower = userQuery.toLowerCase();

    // Try live server API first if available
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, messages })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) return data.reply;
      }
    } catch (err) {
      console.log('Using local Scout ML intelligence engine:', err);
    }

    if (qLower.includes('cluster') || qLower.includes('role') || qLower.includes('archetype') || qLower.includes('phase')) {
      return `Our V14 engine assigns **Data-Driven Phase Roles** based on where players face or bowl high-leverage deliveries:\n\n• **Powerplay** (e.g. Phil Salt, Jos Buttler, Taskin Ahmed)\n  Early breakthrough strikes and boundary explosion against fielding restrictions.\n\n• **Middle Overs** (e.g. Suryakumar Yadav, Heinrich Klaasen, Sunil Narine, Mohammad Nawaz)\n  Spin choke, rotation, and boundary generation through overs 7–15.\n\n• **Death Overs** (e.g. Tim David, Rinku Singh, Jasprit Bumrah)\n  High-intensity execution in overs 16–20 under peak win probability volatility.`;
    }

    if (qLower.includes('replacement') || qLower.includes('runsadded') || qLower.includes('runssaved') || qLower.includes('value over') || qLower.includes('rate')) {
      return `**Value Over Replacement (Runs added & saved per 100 pressure balls vs the average eligible player)** establishes an objective baseline:\n\n1. For every legal delivery, we calculate the historical run expectancy and win probability shifts (196,343 deliveries analyzed).\n2. Empirical Bayes Shrinkage normalizes raw rates toward the global baseline to prevent small-sample distortion.\n3. **Phil Salt** leads all batters with **+11.38 Pressure Rating**, while **Sunil Narine** leads all bowlers with **+22.54 Pressure Rating**!`;
    }

    if (qLower.includes('klaasen') || qLower.includes('heinrich') || qLower.includes('#1 batter')) {
      return `**Heinrich Klaasen** ranks in the top batters with **+10.69 Expected Rank** (P(Top 10): 57.8%, Rating CI: [4.3, 29.7], Bootstrap Rank CI: [1.0, 10.0], Delta: +7.8, Delta CI: [0.5, 31.3]).\n\n• **Confidence**: P(Top 10): 57.8% across 233 balls in 27 innings.\n• **Role**: Middle Overs Aggressor converting high win-probability leverage states with elite boundary execution.`;
    }

    if (qLower.includes('abhishek') || qLower.includes('sharma')) {
      return `**Abhishek Sharma** ranks in the top batters with **+12.31 Expected Rank** (P(Top 10): 51.1%, Rating CI: [2.5, 27.6], Bootstrap Rank CI: [1.0, 15.0], Delta: Indistinguishable from noise).\n\n• **Confidence**: P(Top 10): 51.1% across 350 balls in 44 innings.\n• **Role**: Powerplay Aggressor who capitalizes on fielding restrictions under intense match pressure.`;
    }

    if (qLower.includes('narine') || qLower.includes('sunil') || qLower.includes('#1 bowler')) {
      return `**Sunil Narine** ranks **#1 Bowler** with **+22.54 Pressure Rating** (Expected Rank: 3.8, Rating CI: [11.1, 34.0], Bootstrap Rank CI: [1.0, 10.0], Delta: Indistinguishable from noise).\n\n• **Confidence**: P(Top 10): 93.2% across 285 balls in 31 innings.\n• **Role**: Middle Overs Enforcer creating choking run-suppression under maximum win-probability leverage.`;
    }

    if (qLower.includes('salt') || qLower.includes('phil') || qLower.includes('#1 batter')) {
      return `**Phil Salt** ranks **#1 Batter** with **+11.38 Pressure Rating** (Expected Rank: 8.3, Rating CI: [-3.1, 25.9], Bootstrap Rank CI: [1.0, 15.0], Delta: Indistinguishable from noise, P(Top 10): 70.2%).`;
    }

    if (qLower.includes('rrr') || qLower.includes('threshold') || qLower.includes('leverage') || qLower.includes('wp')) {
      return `Our **Win-Probability Leverage Engine** identifies high-leverage deliveries across 196,343 deliveries analyzed:\n\n1. **Leverage Index (LI)**: Measures how much the match outcome hangs on a specific delivery ($$|WP_{next} - WP_{current}|$$).\n2. **Run-Expectancy (RE24)**: Evaluates terminal run shifts to credit batters and bowlers on an identical run scale.\n3. **Fair Baseline**: Evaluates performance per 100 balls relative to the average eligible player, with Empirical Bayes Shrinkage applied.`;
    }

    return `According to our **SupeRR Selector V14 Run-Expectancy WP Leverage Consensus Engine**, each match delivery is evaluated through win probability shifts and leverage indices. \n\nFor the Rajasthan Royals squad composition, balancing **Phil Salt**'s and **Abhishek Sharma**'s batting leverage with **Sunil Narine**'s and **Adam Zampa**'s bowling containment yields optimal clutch stability in volatile matches.`;
  };

  const handleSendMessage = (textOrEvent) => {
    let query = '';
    if (typeof textOrEvent === 'string') {
      query = textOrEvent.trim();
    } else if (textOrEvent && typeof textOrEvent.preventDefault === 'function') {
      textOrEvent.preventDefault();
      query = inputValue.trim();
    } else {
      query = inputValue.trim();
    }

    if (!query) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      const botText = await generateScoutResponse(query);
      const botMessage = {
        id: `scout-${Date.now()}`,
        sender: 'scout',
        role: 'agent',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Trigger Button (48px round icon button with tooltip at 16px offset) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40 group">
          {/* Tooltip at 16px offset */}
          <div className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#050D2B] text-white text-xs font-display uppercase tracking-wider font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/15">
            Ask Scout
          </div>

          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-[#EA1A85] text-white shadow-xl shadow-[#EA1A85]/35 hover:bg-[#C4106C] transition-all border border-white/25 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            aria-label="Ask Scout"
            title="Ask Scout"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </motion.button>
        </div>
      )}

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 rounded-3xl bg-white text-[#050D2B] shadow-2xl flex flex-col border border-white/20 overflow-hidden ${
              isExpanded 
                ? 'w-[94vw] sm:w-[680px] h-[85vh]' 
                : 'w-[92vw] sm:w-[420px] h-[560px]'
            }`}
          >
            {/* Header: Navy with Pink Accent Line */}
            <div className="bg-[#050D2B] text-white p-4 border-b-2 border-b-[#EA1A85] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EA1A85] flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-display uppercase tracking-wider font-bold text-white flex items-center gap-1.5 leading-none">
                    SupeRR Scout
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#EA1A85] text-white font-bold">
                      V14 ML
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-sans mt-0.5">
                    Rajasthan Royals AI Scouting Assistant
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-[#EA1A85]"
                  title="Close Scout"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Strip */}
            <div className="px-3 py-2 bg-[#F4F6FB] border-b border-slate-200 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar shrink-0">
              <span className="text-[10px] font-display uppercase font-bold text-slate-500 shrink-0">
                Quick:
              </span>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[#050D2B] hover:border-[#EA1A85] hover:text-[#EA1A85] text-[11px] font-medium transition-all shadow-xs"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
              {messages.map((msg) => {
                const isScout = msg.sender === 'scout' || msg.role === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isScout ? 'justify-start' : 'justify-end'}`}
                  >
                    {isScout && (
                      <div className="w-7 h-7 rounded-full bg-[#EA1A85] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isScout
                          ? 'bg-white border border-slate-200 text-[#050D2B] shadow-xs'
                          : 'bg-[#EA1A85] text-white shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line font-sans">
                        {msg.text}
                      </div>
                      <div
                        className={`text-[9px] mt-1.5 font-mono text-right ${
                          isScout ? 'text-slate-400' : 'text-pink-100'
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>

                    {!isScout && (
                      <div className="w-7 h-7 rounded-full bg-[#050D2B] flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-500 text-xs pl-9">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA1A85] animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA1A85] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA1A85] animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="font-mono text-[11px]">Scout analyzing match data...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about Zadran, death bowling, or methodology..."
                className="flex-1 px-3.5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-[#050D2B] placeholder-slate-400 focus:outline-none focus:border-[#EA1A85] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-[#EA1A85] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#C4106C] active:scale-95 transition-all shadow-sm shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
