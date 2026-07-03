/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, SkipForward, X, Search, Keyboard, HelpCircle, BookOpen, GraduationCap, Video, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VIDEO_TUTORIALS, VideoTutorial } from "../data";

interface LearningCenterProps {
  onClose?: () => void;
  autoPlayWelcome?: boolean;
}

export default function LearningCenter({ onClose, autoPlayWelcome = false }: LearningCenterProps) {
  const [activeTab, setActiveTab] = useState<"tutorials" | "shortcuts" | "guides">("tutorials");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(autoPlayWelcome);

  // Auto-play the first welcome video if requested
  useEffect(() => {
    if (autoPlayWelcome) {
      const welcomeTutorial = VIDEO_TUTORIALS[0];
      setSelectedVideo(welcomeTutorial);
    }
  }, [autoPlayWelcome]);

  const filteredTutorials = VIDEO_TUTORIALS.filter(
    (v) =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const keyboardShortcuts = [
    { key: "V", desc: "Select Tool / Pointer" },
    { key: "H", desc: "Hand / Pan Tool" },
    { key: "T", desc: "Add Luxury Text Block" },
    { key: "⌘ + Z", desc: "Undo last alignment or design action" },
    { key: "⌘ + Shift + Z", desc: "Redo action" },
    { key: "Delete / Backspace", desc: "Remove selected image layer" },
    { key: "L", desc: "Auto-trigger Smart AI layout on selected spread" },
    { key: "Arrow Keys", desc: "Nudge active layer by 1 pixel (Shift for 10px)" },
    { key: "⌘ + Mouse Scroll", desc: "Smooth zoom canvas" },
    { key: "Esc", desc: "Deselect active item" },
  ];

  const guideChapters = [
    {
      title: "1. The Storyboard Concept",
      content: "The Storyboard is chronological. Keep family photos grouped, partition ceremonies like Haldi or Mehendi into distinct spreads, and dedicate double-spread panoramic layouts exclusively to high-scoring portraits of the Couple."
    },
    {
      title: "2. The Golden Ratio in Album Design",
      content: "A master designer uses negative space as a first-class element. Never pack pages fully. Position supporting images at 1/3 scale of the main Hero photograph. Use thin white borders or deep shadows to separate layers from royal textured backgrounds."
    },
    {
      title: "3. Safe Areas and Bleed Alignment",
      content: "Always respect the red bleed margin (default 3mm) and the golden safe area margin. Place critical items (like faces and text captions) inside the inner guide. In our vector canvas editor, elements will snap to these print boundaries automatically."
    }
  ];

  return (
    <div className="w-full text-white">
      {/* Autoplay Welcome Modal */}
      <AnimatePresence>
        {showWelcomeVideo && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020202]/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-panel-gold max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl bg-[#090909]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0d0d0d]">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-[#D4AF37] w-6 h-6" />
                  <span className="font-modern font-semibold tracking-wide text-sm text-[#D4AF37]">
                    STUDIO LAUNCH: WELCOME TUTORIAL
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowWelcomeVideo(false)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs text-white/60 hover:text-white transition bg-white/5 rounded-full"
                  >
                    <SkipForward className="w-3 h-3" /> Skip Introduction
                  </button>
                </div>
              </div>

              {/* Video Simulation Box */}
              <div className="aspect-video w-full bg-black relative flex flex-col items-center justify-center border-b border-white/5">
                {/* Simulated Player Background with ambient animation */}
                <div className="absolute inset-0 bg-radial from-amber-950/20 to-black opacity-60"></div>
                
                {/* Decorative golden film guide lines */}
                <div className="absolute top-4 left-4 text-[10px] font-mono text-white/30 tracking-widest">
                  ALBUM STUDIO PRO // PLAYING
                </div>
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/30">
                  {selectedVideo.duration} // CC // 1080P
                </div>

                {/* Animated Pulsing Waveform circle */}
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center border-2 border-[#D4AF37]/40 bg-[#D4AF37]/5 animate-pulse-gold">
                  <Play className="text-[#D4AF37] w-10 h-10 fill-[#D4AF37]" />
                </div>

                <div className="mt-6 text-center max-w-lg px-4 z-10">
                  <h3 className="font-display text-xl text-white font-medium mb-2">{selectedVideo.title}</h3>
                  <p className="text-xs text-white/60 line-clamp-2">{selectedVideo.desc}</p>
                </div>

                {/* Interactive Simulation Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-[#D4AF37] h-full"
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/50 shrink-0">12s / 2:45</span>
                </div>
              </div>

              {/* Steps overview */}
              <div className="p-6 bg-[#080808] grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5">
                {selectedVideo.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-white/90">Step {idx + 1}</h4>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">{step}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="p-4 bg-[#0d0d0d] border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowWelcomeVideo(false)}
                  className="px-6 py-2 bg-white text-black font-modern text-xs font-medium rounded-lg hover:bg-white/90 transition shadow-lg"
                >
                  Enter Studio Workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Learning Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <h2 className="font-display text-2xl text-white font-medium flex items-center gap-2">
            <GraduationCap className="text-[#D4AF37] w-6 h-6" /> Learning Center
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Master the fine art of professional wedding album composition and AI tools.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("tutorials")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-modern rounded-md transition ${
              activeTab === "tutorials" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Video Lessons
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-modern rounded-md transition ${
              activeTab === "guides" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Professional Guides
          </button>
          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-modern rounded-md transition ${
              activeTab === "shortcuts" ? "bg-white text-black font-medium" : "text-white/60 hover:text-white"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Studio Shortcuts
          </button>
        </div>
      </div>

      {/* TAB CONTENT: VIDEO TUTORIALS */}
      {activeTab === "tutorials" && (
        <div>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search tutorials by feature, skill, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTutorials.map((tut) => (
              <div
                key={tut.id}
                onClick={() => {
                  setSelectedVideo(tut);
                  setShowWelcomeVideo(true);
                }}
                className="group cursor-pointer glass-panel p-5 rounded-xl hover:border-white/20 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                      {tut.category}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{tut.duration}</span>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-white group-hover:text-[#D4AF37] transition mb-1.5">
                    {tut.title}
                  </h3>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                    {tut.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-white/80 group-hover:text-white font-medium">
                  <Play className="w-3.5 h-3.5 fill-white/10 text-white/80" /> Watch Lesson
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: GUIDES */}
      {activeTab === "guides" && (
        <div className="space-y-6">
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 rounded-xl flex gap-3">
            <Sparkles className="text-[#D4AF37] w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-xs font-semibold text-[#D4AF37]">The Luxury Wedding Composition Standard</h3>
              <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">
                Our AI operates strictly under high-contrast, editorial guidelines. We strongly recommend dedicating single pages to portraits with deep shadows, and reserving double layouts for symmetric storytelling.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {guideChapters.map((ch, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl">
                <h3 className="font-display text-sm font-semibold text-white/95 mb-2">{ch.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{ch.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SHORTCUTS */}
      {activeTab === "shortcuts" && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-[#0D0D0D] flex items-center gap-2">
            <Keyboard className="text-white/60 w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">Photoshop & Canvas Shortcuts</h3>
          </div>
          <div className="divide-y divide-white/5">
            {keyboardShortcuts.map((sc, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-white/5 transition">
                <span className="text-xs text-white/60">{sc.desc}</span>
                <kbd className="bg-[#020202] text-[10px] font-mono text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-md shadow">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
