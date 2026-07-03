/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, CustomSize, Unit, PageType, ExportFormat, ColorProfile, NumberingStyle } from "../types";
import { SAMPLE_ALBUMS, SAMPLE_SHEETS, SAMPLE_SHEETS as sheetPresets, STOCK_IMAGES, DEFAULT_FOLDERS } from "../data";
import { Plus, FolderOpen, Image as ImageIcon, Sparkles, BookOpen, Clock, Settings, User, Printer, Play, HelpCircle, BadgeCheck, Grid, Layers, ExternalLink } from "lucide-react";
import LearningCenter from "./LearningCenter";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  projects: Project[];
  onCreateNewProject: () => void;
  onOpenProject: (proj: Project) => void;
  onOpenLearningCenter: () => void;
}

export default function Dashboard({ projects, onCreateNewProject, onOpenProject, onOpenLearningCenter }: DashboardProps) {
  const [activeSheetPreview, setActiveSheetPreview] = useState<typeof SAMPLE_SHEETS[0] | null>(null);

  // Auto load a sample project to demonstrate premium capability instantly
  const handleLoadSampleProject = (albumTitle: string) => {
    // Construct a complete pre-designed project based on sample selections
    const sampleProject: Project = {
      id: "proj_sample_" + Date.now(),
      name: `${albumTitle} (Inspiration Sample)`,
      brideName: "Ananya",
      groomName: "Rahul",
      eventDate: "2026-07-02",
      designerName: "Senior Studio Lead",
      printCompany: "Symphony Labs",
      notes: "Sample project generated for inspiration. Showcases bento-grids, margins, and face clusters.",
      albumSize: {
        name: "12 × 36 Panorama",
        width: 36,
        height: 12,
        unit: Unit.INCHES,
        dpi: 300,
        bleed: 3,
        safeMargin: 10,
        spineWidth: 0,
        foldMargin: 0
      },
      sheetsCount: 8,
      themeId: "luxury_dark",
      folders: DEFAULT_FOLDERS,
      images: STOCK_IMAGES,
      people: [
        { id: "p_bride", name: "Ananya", role: "Bride", thumbnailUrl: STOCK_IMAGES[0].url, isCustomNamed: true },
        { id: "p_groom", name: "Rahul", role: "Groom", thumbnailUrl: STOCK_IMAGES[1].url, isCustomNamed: true },
        { id: "p_friends", name: "Bridesmaids Team", role: "VIP Guest", thumbnailUrl: STOCK_IMAGES[6].url, isCustomNamed: true }
      ],
      spreads: Array.from({ length: 8 }, (_, i) => {
        // Pre-populate sheet designs for beautiful initial views
        const preset = sheetPresets[i % sheetPresets.length];
        const spreadImages = STOCK_IMAGES.slice(0, preset.photosCount).map((img, idx) => {
          const pos = preset.images[idx % preset.images.length];
          return {
            id: `layer_sa_img_${idx}_${i}`,
            imageId: img.id,
            x: pos.x,
            y: pos.y,
            w: pos.w,
            h: pos.h,
            rotation: 0,
            opacity: 1,
            borderWidth: pos.isHero ? 2 : 1,
            borderColor: pos.isHero ? "#D4AF37" : "#FFFFFF",
            borderRadius: 0,
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.4)",
            isHero: pos.isHero,
            cropX: 0,
            cropY: 0,
            cropW: 1,
            cropH: 1,
            zIndex: idx + 1
          };
        });

        return {
          id: `spread_sample_${i}`,
          pageIndex: i,
          pageType: PageType.DOUBLE_SPREAD,
          title: preset.name,
          bgType: "color",
          bgColor: "#090909",
          imageLayers: spreadImages,
          textLayers: [
            {
              id: `layer_sa_txt_${i}`,
              text: i === 0 ? "T H E  P E R F E C T  D A Y" : "C E L E B R A T I O N S",
              x: 10,
              y: 86,
              w: 80,
              h: 6,
              rotation: 0,
              fontSize: 14,
              fontFamily: "Space Grotesk",
              fontWeight: "normal",
              color: "#D4AF37",
              alignment: "center",
              opacity: 0.8,
              zIndex: 10
            }
          ]
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exportSettings: {
        format: ExportFormat.PDF,
        dpi: 300,
        colorProfile: ColorProfile.CMYK_FOGRA39,
        bleed: 3,
        safeMargin: 10,
        includeCropMarks: true,
        includePageNumbers: false,
        numberingStyle: NumberingStyle.NONE
      }
    };

    onOpenProject(sampleProject);
  };

  return (
    <div className="w-full text-white space-y-12">
      
      {/* 1. HERO STUDIO PRO WELCOME HEADER */}
      <div className="relative bg-[#0A0A0A] border border-white/10 p-8 md:p-12 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 font-bold">
              Designed for Premium Studios
            </span>
          </div>

          <h1 className="font-sans text-3xl md:text-4xl font-light tracking-tight leading-none text-white">
            Wedding Album Designing
          </h1>
          <p className="text-xs text-white/50 leading-relaxed max-w-md">
            Automatically arrange premium wedding layouts, index EXIF matrices, score compositions, and maintain consistent client face identities seamlessly.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onCreateNewProject}
              className="px-5 py-2.5 bg-white hover:bg-white/90 text-black font-semibold text-xs rounded-full transition shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Project
            </button>
            <button
              onClick={onOpenLearningCenter}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white rounded-full hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-white/60" /> Open Tutorial Hub
            </button>
          </div>
        </div>

        {/* Studio Status Monitor Box */}
        <div className="bg-[#111] border border-white/10 p-5 rounded-2xl w-full md:w-64 space-y-3.5 shrink-0">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold">Studio Engine</span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">AI Layout Engine</span>
              <span className="font-mono text-[10px] text-white/80 font-bold">Gemini Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Face Classifier</span>
              <span className="font-mono text-[10px] text-white/60">InsightFace V3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Print Output</span>
              <span className="font-mono text-[10px] text-white/60">300 DPI CMYK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RECENT PROJECTS SECTION */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Client Projects</h3>
            <span className="text-[10px] font-mono text-white/40 font-bold">{projects.length} active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(proj => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="group p-5 bg-[#0A0A0A] border border-white/10 hover:border-white/20 rounded-2xl cursor-pointer transition flex justify-between items-center hover:bg-white/5"
              >
                <div className="space-y-1.5 truncate pr-4">
                  <h4 className="font-sans text-sm font-semibold text-white/90 group-hover:text-white transition truncate">
                    {proj.name}
                  </h4>
                  <p className="text-[10px] font-mono text-white/40">
                    Size: {proj.albumSize.name}  //  {proj.eventDate}
                  </p>
                </div>
                <FolderOpen className="w-5 h-5 text-white/30 group-hover:text-white transition shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROFESSIONAL SAMPLE ALBUMS SECTION */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Sample Inspired Album Spreads</h3>
          <p className="text-[11px] text-white/40 mt-1">Prepopulated portfolio templates demonstrating regional rites and bento layouts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_ALBUMS.map(album => (
            <div
              key={album.id}
              onClick={() => handleLoadSampleProject(album.title)}
              className="group cursor-pointer bg-[#0A0A0A] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition flex flex-col justify-between"
            >
              <div className="aspect-video w-full relative overflow-hidden bg-black border-b border-white/10">
                <img
                  src={album.coverUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 right-2.5 bg-black/85 px-2.5 py-0.5 rounded text-[10px] font-mono text-white/80 border border-white/10">
                  {album.size}
                </div>
              </div>

              <div className="p-5 space-y-3 bg-[#0A0A0A]">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 font-bold">{album.category}</span>
                  <h4 className="font-sans text-sm font-semibold text-white group-hover:text-white transition">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-white/50">{album.subtitle}</p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-white/10 text-[10px] font-mono text-white/40">
                  <span>Theme: {album.theme}</span>
                  <span className="text-white hover:underline flex items-center gap-0.5 font-medium">
                    Inspect Spreads <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SAMPLE SHEETS GRID EXHIBITIONS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Bento Grid & Whitespace Canvas Presets</h3>
          <p className="text-[11px] text-white/40 mt-1">Symmetric layout templates ready for automatic photo-fill.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SAMPLE_SHEETS.map(sheet => (
            <div
              key={sheet.id}
              onClick={() => setActiveSheetPreview(sheet)}
              className="group cursor-pointer bg-[#0A0A0A] border border-white/10 hover:border-white/20 p-4 rounded-xl transition text-center space-y-3 flex flex-col justify-between"
            >
              <div className="aspect-square w-full bg-[#111] rounded-lg border border-white/10 relative flex items-center justify-center overflow-hidden">
                {/* Simulated layout block preview */}
                <div className="absolute inset-2 grid grid-cols-2 gap-1 opacity-50">
                  {Array.from({ length: Math.min(4, sheet.photosCount) }).map((_, idx) => (
                    <div key={idx} className="bg-white/10 rounded border border-white/5" />
                  ))}
                </div>
                <span className="text-xl font-sans font-bold text-white/80 group-hover:scale-110 transition">
                  {sheet.photosCount}
                </span>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-white/90 truncate">{sheet.name}</h4>
                <p className="text-[9px] font-mono text-white/40 mt-0.5">{sheet.layoutType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAMPLE SHEET INSPECTOR MODAL */}
      <AnimatePresence>
        {activeSheetPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveSheetPreview(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-sans text-base font-semibold text-white">{activeSheetPreview.name}</h3>
                  <p className="text-xs text-white/50">{activeSheetPreview.style} // {activeSheetPreview.layoutType}</p>
                </div>
                <button
                  onClick={() => setActiveSheetPreview(null)}
                  className="p-1 text-white/40 hover:text-white transition"
                >
                  Close Preview
                </button>
              </div>

              {/* Simulated Layout container canvas */}
              <div
                style={{ backgroundColor: activeSheetPreview.bgColor }}
                className="aspect-video w-full border border-white/10 rounded-xl relative overflow-hidden shadow-lg p-6"
              >
                {activeSheetPreview.images.map((pos, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${pos.w}%`,
                      height: `${pos.h}%`,
                      border: pos.isHero ? "1.5px solid white" : "1px solid rgba(255,255,255,0.4)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)"
                    }}
                    className="absolute rounded flex items-center justify-center"
                  >
                    <span className="text-[10px] font-mono text-white/40">
                      {pos.isHero ? "HERO IMAGE" : `PHOTO ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Specs footer */}
              <div className="p-4 bg-[#111] rounded-xl flex justify-between items-center text-xs font-mono text-white/50">
                <span>Photos Count: {activeSheetPreview.photosCount}</span>
                <span>Aspect: Double Landscape (Panoramic)</span>
                <button
                  onClick={() => {
                    setActiveSheetPreview(null);
                    onCreateNewProject();
                  }}
                  className="px-4 py-1.5 bg-white hover:bg-white/90 text-black font-bold rounded-full transition text-xs"
                >
                  Apply in Studio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
