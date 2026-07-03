/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Project, AlbumSpread, ImageLayer, TextLayer, PageType, Unit, LayoutTheme } from "../types";
import { SAMPLE_SHEETS } from "../data";
import { ChevronLeft, ChevronRight, Plus, Trash2, ZoomIn, ZoomOut, ArrowUp, ArrowDown, Type, Image as ImageIcon, Sparkles, Wand2, RefreshCw, Layers, Check, Palette, Save, Undo, Redo, Info, Grid } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AlbumEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
  credits: number;
  onDeductCredits?: (amount: number) => boolean;
  onNavigateToBilling?: () => void;
}

export default function AlbumEditor({ project, onUpdateProject, onBack, credits, onDeductCredits, onNavigateToBilling }: AlbumEditorProps) {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(1); // Start on first double spread (usually page 1)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerType, setSelectedLayerType] = useState<"image" | "text" | null>(null);
  const [zoomLevel, setZoomLevel] = useState(75); // 50% - 150%
  const [showGuides, setShowGuides] = useState(true);
  
  // Credit limit checks states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditNoticeMsg, setCreditNoticeMsg] = useState("");
  
  // Undo/Redo history tracking buffers
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  // Drag and drop / resize mouse metrics
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // "nw", "ne", "sw", "se"
  const dragStartPos = useRef({ x: 0, y: 0 });
  const layerStartPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const activeSpread = project.spreads[currentSpreadIndex] || project.spreads[0];

  // Record history when project changes
  const saveStateToHistory = (newProject: Project) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    setHistory([...updatedHistory, newProject]);
    setHistoryIndex(updatedHistory.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onUpdateProject(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onUpdateProject(history[historyIndex + 1]);
    }
  };

  // 1. ADD PHOTOS TO THE SPREAD
  const handleAddPhotoToSpread = (imgId: string) => {
    const imageMeta = project.images.find(img => img.id === imgId);
    if (!imageMeta) return;

    // Calculate elegant initial dimensions based on orientation
    const w = imageMeta.orientation === "portrait" ? 25 : 40;
    const h = imageMeta.orientation === "portrait" ? 55 : 40;

    const newLayer: ImageLayer = {
      id: "layer_img_" + Date.now(),
      imageId: imgId,
      x: 10 + (activeSpread.imageLayers.length * 5),
      y: 20 + (activeSpread.imageLayers.length * 3),
      w,
      h,
      rotation: 0,
      opacity: 1,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 0,
      shadowBlur: 10,
      shadowColor: "rgba(0,0,0,0.4)",
      isHero: activeSpread.imageLayers.length === 0,
      cropX: 0,
      cropY: 0,
      cropW: 1,
      cropH: 1,
      zIndex: activeSpread.imageLayers.length + 1
    };

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        return {
          ...spread,
          imageLayers: [...spread.imageLayers, newLayer]
        };
      }
      return spread;
    });

    const nextProject = { ...project, spreads: updatedSpreads, updatedAt: new Date().toISOString() };
    onUpdateProject(nextProject);
    saveStateToHistory(nextProject);
    setSelectedLayerId(newLayer.id);
    setSelectedLayerType("image");
  };

  // 2. ADD TEXT LAYER
  const handleAddText = () => {
    const newText: TextLayer = {
      id: "layer_txt_" + Date.now(),
      text: "OUR GOLDEN CELEBRATION",
      x: 20,
      y: 80,
      w: 60,
      h: 8,
      rotation: 0,
      fontSize: 16,
      fontFamily: "Space Grotesk",
      fontWeight: "500",
      color: "#FFFFFF",
      alignment: "center",
      opacity: 1,
      zIndex: activeSpread.imageLayers.length + activeSpread.textLayers.length + 1
    };

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        return {
          ...spread,
          textLayers: [...spread.textLayers, newText]
        };
      }
      return spread;
    });

    const nextProject = { ...project, spreads: updatedSpreads, updatedAt: new Date().toISOString() };
    onUpdateProject(nextProject);
    saveStateToHistory(nextProject);
    setSelectedLayerId(newText.id);
    setSelectedLayerType("text");
  };

  // 3. REMOVE SELECTED LAYER
  const handleDeleteSelected = () => {
    if (!selectedLayerId) return;

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        return {
          ...spread,
          imageLayers: spread.imageLayers.filter(l => l.id !== selectedLayerId),
          textLayers: spread.textLayers.filter(l => l.id !== selectedLayerId)
        };
      }
      return spread;
    });

    const nextProject = { ...project, spreads: updatedSpreads };
    onUpdateProject(nextProject);
    saveStateToHistory(nextProject);
    setSelectedLayerId(null);
    setSelectedLayerType(null);
  };

  // 4. PRESETS SELECTION
  const handleApplyPresetLayout = (preset: typeof SAMPLE_SHEETS[0]) => {
    if (project.images.length === 0) return;

    // Deduct 10 credits for sheet designing
    if (onDeductCredits) {
      const success = onDeductCredits(10);
      if (!success) {
        setShowCreditModal(true);
        return;
      }
      setCreditNoticeMsg("Deducted 10 Credits for applying bento preset design layout.");
      setTimeout(() => setCreditNoticeMsg(""), 4000);
    }

    // Grab images from project to occupy preset spots
    const availableImages = project.images.slice(0, preset.photosCount);
    if (availableImages.length === 0) return;

    const newImageLayers: ImageLayer[] = preset.images.map((imgPos, idx) => {
      const imgMeta = availableImages[idx % availableImages.length];
      return {
        id: `layer_preset_${idx}_${Date.now()}`,
        imageId: imgMeta.id,
        x: imgPos.x,
        y: imgPos.y,
        w: imgPos.w,
        h: imgPos.h,
        rotation: imgPos.rot || 0,
        opacity: 1,
        borderWidth: imgPos.isHero ? 2 : 1,
        borderColor: imgPos.isHero ? "#FFFFFF" : "#555555",
        borderRadius: 0,
        shadowBlur: 15,
        shadowColor: "rgba(0,0,0,0.5)",
        isHero: imgPos.isHero,
        cropX: 0,
        cropY: 0,
        cropW: 1,
        cropH: 1,
        zIndex: idx + 1
      };
    });

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        return {
          ...spread,
          bgType: preset.bgType as any,
          bgColor: preset.bgColor,
          imageLayers: newImageLayers,
          textLayers: [
            {
              id: `txt_caption_${Date.now()}`,
              text: preset.name.toUpperCase(),
              x: 10,
              y: 8,
              w: 80,
              h: 5,
              rotation: 0,
              fontSize: 14,
              fontFamily: "Space Grotesk",
              fontWeight: "normal",
              color: "#FFFFFF",
              alignment: "center" as const,
              opacity: 0.6,
              zIndex: 10
            }
          ]
        };
      }
      return spread;
    });

    const nextProject = { ...project, spreads: updatedSpreads };
    onUpdateProject(nextProject);
    saveStateToHistory(nextProject);
  };

  // 5. CALL AI TO DIRECT GENERATE LAYOUT VIA EXPRESS ENDPOINT
  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;

    // Deduct 10 credits for AI sheet designing
    if (onDeductCredits) {
      const success = onDeductCredits(10);
      if (!success) {
        setShowCreditModal(true);
        return;
      }
    }

    setAiGenerating(true);
    setAiSuccessMsg("");

    try {
      const activeMeta = activeSpread.imageLayers.map(l => {
        const fullImg = project.images.find(img => img.id === l.imageId);
        return {
          id: l.imageId,
          aspectRatio: fullImg?.aspectRatio || 1.5,
          orientation: fullImg?.orientation || "landscape",
          overallScore: fullImg?.overallScore || 80
        };
      });

      // Default load project images if layers are empty
      const imagesToProcess = activeMeta.length > 0 
        ? activeMeta 
        : project.images.slice(0, 4).map(img => ({
            id: img.id,
            aspectRatio: img.aspectRatio,
            orientation: img.orientation,
            overallScore: img.overallScore
          }));

      const res = await fetch("/api/ai/suggest-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          images: imagesToProcess,
          layoutTheme: {
            bgColor: activeSpread.bgColor
          },
          albumSize: project.albumSize,
          pageType: activeSpread.pageType
        })
      });

      const data = await res.json();
      if (data.success && data.layout) {
        const aiLayout = data.layout;

        const newImageLayers: ImageLayer[] = aiLayout.images.map((aiImg: any, idx: number) => {
          // Find original or map from processed list
          const imageId = aiImg.id || imagesToProcess[idx % imagesToProcess.length].id;
          return {
            id: `layer_ai_${idx}_${Date.now()}`,
            imageId: imageId,
            x: aiImg.x,
            y: aiImg.y,
            w: aiImg.w,
            h: aiImg.h,
            rotation: aiImg.rotation || 0,
            opacity: aiImg.opacity || 1,
            borderWidth: aiImg.borderWidth || 1,
            borderColor: aiImg.borderColor || "#FFFFFF",
            borderRadius: aiImg.borderRadius || 0,
            shadowBlur: aiImg.shadowBlur || 10,
            shadowColor: aiImg.shadowColor || "rgba(0,0,0,0.4)",
            isHero: aiImg.isHero || false,
            cropX: 0,
            cropY: 0,
            cropW: 1,
            cropH: 1,
            zIndex: idx + 1
          };
        });

        const updatedSpreads = project.spreads.map((spread, i) => {
          if (i === currentSpreadIndex) {
            return {
              ...spread,
              bgColor: aiLayout.bgColor,
              bgType: aiLayout.bgType || "color",
              title: aiLayout.layoutTitle || spread.title,
              imageLayers: newImageLayers,
              textLayers: aiLayout.textElement ? [
                {
                  id: `layer_ai_txt_${Date.now()}`,
                  text: aiLayout.textElement.text,
                  x: aiLayout.textElement.x,
                  y: aiLayout.textElement.y,
                  w: aiLayout.textElement.w,
                  h: aiLayout.textElement.h,
                  rotation: 0,
                  fontSize: aiLayout.textElement.fontSize || 16,
                  fontFamily: aiLayout.textElement.fontFamily || "Playfair Display",
                  fontWeight: "normal",
                  color: "#FFFFFF",
                  alignment: aiLayout.textElement.alignment || "center",
                  opacity: 1,
                  zIndex: 20
                }
              ] : []
            };
          }
          return spread;
        });

        const nextProject = { ...project, spreads: updatedSpreads };
        onUpdateProject(nextProject);
        saveStateToHistory(nextProject);
        setAiSuccessMsg(`Layout successfully generated using Google Gemini (${data.engine})!`);
        setAiPrompt("");
      }
    } catch (e) {
      console.error("Layout generation failure:", e);
    } finally {
      setAiGenerating(false);
    }
  };

  // 6. CANVAS INTERACTIONS (DRAGGING & RESIZING)
  const handlePointerDown = (e: React.MouseEvent, layerId: string, type: "image" | "text", resizeHandle: string | null = null) => {
    e.stopPropagation();
    setSelectedLayerId(layerId);
    setSelectedLayerType(type);

    const layer = type === "image"
      ? activeSpread.imageLayers.find(l => l.id === layerId)
      : activeSpread.textLayers.find(l => l.id === layerId);

    if (!layer || !canvasRef.current) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    layerStartPos.current = { x: layer.x, y: layer.y, w: layer.w, h: layer.h };

    if (resizeHandle) {
      setIsResizing(resizeHandle);
    } else {
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !selectedLayerId || !canvasRef.current) return;

    const bounds = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.current.x) / bounds.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.current.y) / bounds.height) * 100;

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        if (selectedLayerType === "image") {
          const layers = spread.imageLayers.map(l => {
            if (l.id === selectedLayerId) {
              if (isResizing) {
                // Multi sizers ratios calculations
                let newW = layerStartPos.current.w;
                let newH = layerStartPos.current.h;
                let newX = layerStartPos.current.x;
                let newY = layerStartPos.current.y;

                if (isResizing.includes("e")) newW = Math.max(5, layerStartPos.current.w + deltaX);
                if (isResizing.includes("s")) newH = Math.max(5, layerStartPos.current.h + deltaY);
                if (isResizing.includes("w")) {
                  const proposedW = layerStartPos.current.w - deltaX;
                  if (proposedW > 5) {
                    newW = proposedW;
                    newX = layerStartPos.current.x + deltaX;
                  }
                }
                if (isResizing.includes("n")) {
                  const proposedH = layerStartPos.current.h - deltaY;
                  if (proposedH > 5) {
                    newH = proposedH;
                    newY = layerStartPos.current.y + deltaY;
                  }
                }

                // Snap to guides (e.g. alignment grids)
                if (showGuides) {
                  if (Math.abs(newX - project.albumSize.safeMargin) < 1.5) newX = project.albumSize.safeMargin;
                  if (Math.abs((newX + newW) - (100 - project.albumSize.safeMargin)) < 1.5) {
                    newW = (100 - project.albumSize.safeMargin) - newX;
                  }
                }

                return { ...l, x: newX, y: newY, w: newW, h: newH };
              } else {
                // Standard Translation
                let newX = layerStartPos.current.x + deltaX;
                let newY = layerStartPos.current.y + deltaY;

                // Snap bounding boxes
                if (showGuides) {
                  if (Math.abs(newX - 50) < 1.5) newX = 50 - l.w / 2; // Snap to middle fold gutter
                }

                return { ...l, x: Math.max(0, Math.min(100 - l.w, newX)), y: Math.max(0, Math.min(100 - l.h, newY)) };
              }
            }
            return l;
          });
          return { ...spread, imageLayers: layers };
        } else {
          // Text Layer translation
          const layers = spread.textLayers.map(l => {
            if (l.id === selectedLayerId) {
              return {
                ...l,
                x: Math.max(0, Math.min(100 - l.w, layerStartPos.current.x + deltaX)),
                y: Math.max(0, Math.min(100 - l.h, layerStartPos.current.y + deltaY))
              };
            }
            return l;
          });
          return { ...spread, textLayers: layers };
        }
      }
      return spread;
    });

    onUpdateProject({ ...project, spreads: updatedSpreads });
  };

  const handlePointerUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(null);
      saveStateToHistory(project);
    }
  };

  const updateSelectedLayerStyle = (key: string, value: any) => {
    if (!selectedLayerId) return;

    const updatedSpreads = project.spreads.map((spread, i) => {
      if (i === currentSpreadIndex) {
        if (selectedLayerType === "image") {
          return {
            ...spread,
            imageLayers: spread.imageLayers.map(l => l.id === selectedLayerId ? { ...l, [key]: value } : l)
          };
        } else {
          return {
            ...spread,
            textLayers: spread.textLayers.map(l => l.id === selectedLayerId ? { ...l, [key]: value } : l)
          };
        }
      }
      return spread;
    });

    const nextProject = { ...project, spreads: updatedSpreads };
    onUpdateProject(nextProject);
  };

  const activeImageLayer = selectedLayerType === "image" 
    ? activeSpread.imageLayers.find(l => l.id === selectedLayerId) 
    : null;
  const activeTextLayer = selectedLayerType === "text" 
    ? activeSpread.textLayers.find(l => l.id === selectedLayerId) 
    : null;

  return (
    <div className="w-full text-white min-h-[calc(100vh-180px)] flex flex-col xl:flex-row gap-6 select-none" onPointerUp={handlePointerUp}>
      
      {/* LEFT COLUMN: SOURCE WORKSPACE GALLERY & PRESETS */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
        
        {/* MEDIA DOCK: DRAG PHOTOS INTO CANVAS */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex flex-col h-[320px]">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Project Assets</span>
            <span className="text-[10px] font-mono text-white/40">{project.images.length} available</span>
          </div>
 
          <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
            {project.images.map(img => {
              const isUsed = activeSpread.imageLayers.some(l => l.imageId === img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => handleAddPhotoToSpread(img.id)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition cursor-pointer bg-black"
                >
                  <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  {isUsed && (
                    <div className="absolute top-1 right-1 bg-white text-black p-0.5 rounded-full z-10">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[8px] font-mono truncate text-center">
                    Score: {img.overallScore}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* LAYOUT TEMPLATES */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex flex-col h-[280px]">
          <div className="pb-2 border-b border-white/10 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Layout Presets</span>
          </div>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {SAMPLE_SHEETS.map(preset => (
              <div
                key={preset.id}
                onClick={() => handleApplyPresetLayout(preset)}
                className="p-3 rounded-xl border border-white/5 bg-[#111] hover:border-white/20 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white/90">{preset.name}</h4>
                  <p className="text-[10px] text-white/50 font-mono mt-0.5 font-bold">{preset.photosCount} Photos // {preset.style}</p>
                </div>
                <Grid className="w-4 h-4 text-white/40 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: PANORAMIC CANVAS SHEET WORKSPACE */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* CANVAS COMMAND CONTROLS */}
        <div className="bg-[#0A0A0A] border border-white/10 px-6 py-3 rounded-xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-xs text-white/50 hover:text-white transition flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="h-4 w-px bg-white/10" />
            <h3 className="text-xs font-bold tracking-widest font-mono">
              SPREAD {currentSpreadIndex + 1} OF {project.spreads.length}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))} className="p-1.5 hover:bg-white/5 rounded text-white/60">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-white/60 w-10 text-center font-bold">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-1.5 hover:bg-white/5 rounded text-white/60">
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-2" />

            {/* Guides Toggle */}
            <button
              onClick={() => setShowGuides(!showGuides)}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition ${
                showGuides ? "bg-white/10 text-white border border-white/20 font-bold" : "bg-white/5 text-white/60"
              }`}
            >
              {showGuides ? "Guides Active" : "Guides Hidden"}
            </button>

            <div className="h-4 w-px bg-white/10 mx-2" />

            {/* History buffer triggers */}
            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-white/5 rounded text-white/60 disabled:opacity-30">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-white/5 rounded text-white/60 disabled:opacity-30">
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ACTIVE CANVAS SHEET CONTAINER */}
        <div 
          className="flex-1 bg-[#020202] rounded-3xl border border-white/5 overflow-hidden p-8 flex items-center justify-center min-h-[480px] relative"
          onPointerMove={handlePointerMove}
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />

          {/* SPREAD RATIO CANVAS CONTAINER */}
          <div
            ref={canvasRef}
            style={{
              width: `${(project.albumSize.width / project.albumSize.height) * 160 * (zoomLevel / 100)}px`,
              height: `${160 * (zoomLevel / 100)}px`,
              backgroundColor: activeSpread.bgColor,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)"
            }}
            className="relative select-none border border-white/10 transition-all duration-150 overflow-hidden"
          >
            {/* PRINT GUIDELINES (RED BLEED & SAFE BOUNDS) */}
            {showGuides && (
              <>
                {/* Outer bleed line (red border) */}
                <div className="absolute inset-0 border border-red-500/30 pointer-events-none" />
                
                {/* Safe Margins guides */}
                <div
                  style={{
                    top: `${project.albumSize.safeMargin}%`,
                    bottom: `${project.albumSize.safeMargin}%`,
                    left: `${project.albumSize.safeMargin}%`,
                    right: `${project.albumSize.safeMargin}%`
                  }}
                  className="absolute border border-amber-500/20 pointer-events-none border-dashed"
                />

                {/* Middle gutter fold line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-white/20 pointer-events-none z-20" />
              </>
            )}

            {/* RENDER DYNAMIC IMAGE LAYERS */}
            {activeSpread.imageLayers.map(layer => {
              const imgMeta = project.images.find(img => img.id === layer.imageId);
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => handlePointerDown(e, layer.id, "image")}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.w}%`,
                    height: `${layer.h}%`,
                    zIndex: layer.zIndex,
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    border: `${layer.borderWidth}px solid ${layer.borderColor}`,
                    boxShadow: `0 ${layer.shadowBlur}px ${layer.shadowBlur * 2}px ${layer.shadowColor}`,
                    borderRadius: `${layer.borderRadius}px`
                  }}
                  className={`absolute group cursor-move select-none overflow-hidden ${
                    isSelected ? "outline-2 outline-white" : ""
                  }`}
                >
                  {imgMeta && (
                    <img
                      src={imgMeta.url}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )}
 
                  {/* ROTATION & SELECTION OUTLINE SELECTION BOX */}
                  {isSelected && (
                    <>
                      {/* NW handle */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, layer.id, "image", "nw")}
                        className="absolute top-0 left-0 w-3 h-3 bg-white border border-black cursor-nwse-resize z-50 rounded-full"
                      />
                      {/* NE handle */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, layer.id, "image", "ne")}
                        className="absolute top-0 right-0 w-3 h-3 bg-white border border-black cursor-nesw-resize z-50 rounded-full"
                      />
                      {/* SW handle */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, layer.id, "image", "sw")}
                        className="absolute bottom-0 left-0 w-3 h-3 bg-white border border-black cursor-nesw-resize z-50 rounded-full"
                      />
                      {/* SE handle */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, layer.id, "image", "se")}
                        className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-black cursor-nwse-resize z-50 rounded-full"
                      />
                    </>
                  )}
                </div>
              );
            })}

            {/* RENDER TEXT LAYERS */}
            {activeSpread.textLayers.map(layer => {
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => handlePointerDown(e, layer.id, "text")}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.w}%`,
                    height: `${layer.h}%`,
                    fontSize: `${layer.fontSize}px`,
                    fontFamily: layer.fontFamily,
                    color: layer.color,
                    zIndex: layer.zIndex,
                    opacity: layer.opacity,
                    textAlign: layer.alignment as any
                  }}
                  className={`absolute cursor-text tracking-widest leading-none ${
                    isSelected ? "outline-1 outline-dashed outline-white" : ""
                  }`}
                >
                  {layer.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* SHEET NAVIGATIONS bar */}
        <div className="flex justify-between items-center bg-[#070707] p-3 rounded-xl border border-white/5">
          <button
            onClick={() => setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1))}
            disabled={currentSpreadIndex === 0}
            className="px-4 py-2 bg-white/5 border border-white/5 text-xs rounded-lg hover:bg-white/10 transition disabled:opacity-30"
          >
            ← Previous Spread
          </button>

          <span className="text-xs font-mono text-white/50">
            Page {currentSpreadIndex * 2} - {currentSpreadIndex * 2 + 1}
          </span>

          <button
            onClick={() => setCurrentSpreadIndex(Math.min(project.spreads.length - 1, currentSpreadIndex + 1))}
            disabled={currentSpreadIndex === project.spreads.length - 1}
            className="px-4 py-2 bg-white/5 border border-white/5 text-xs rounded-lg hover:bg-white/10 transition disabled:opacity-30"
          >
            Next Spread →
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILED STYLE CONTROLLER & AI COMPANION */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
        
        {/* ELEMENT PROPERTY STYLE CONTROLLER */}
        {selectedLayerId && (
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">Style Inspector</span>
              <button onClick={() => setSelectedLayerId(null)} className="text-white/40 hover:text-white"><Trash2 className="w-4 h-4 text-red-500 hover:scale-105 transition" onClick={handleDeleteSelected} /></button>
            </div>

            {/* If selected layer is Image */}
            {activeImageLayer && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Border Thickness</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={activeImageLayer.borderWidth}
                    onChange={(e) => updateSelectedLayerStyle("borderWidth", Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Border Color</label>
                  <div className="flex gap-1.5">
                    {["#FFFFFF", "#000000", "#1A1105", "#050B14", "#888888"].map(c => (
                      <div
                        key={c}
                        onClick={() => updateSelectedLayerStyle("borderColor", c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded border cursor-pointer ${activeImageLayer.borderColor === c ? "scale-110 border-white" : "border-white/10"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Corners (Roundness)</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={activeImageLayer.borderRadius}
                    onChange={(e) => updateSelectedLayerStyle("borderRadius", Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Layer Opacity</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={activeImageLayer.opacity * 100}
                    onChange={(e) => updateSelectedLayerStyle("opacity", Number(e.target.value) / 100)}
                    className="w-full accent-white"
                  />
                </div>
              </div>
            )}

            {/* If selected layer is Text */}
            {activeTextLayer && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Caption Text Content</label>
                  <input
                    type="text"
                    value={activeTextLayer.text}
                    onChange={(e) => updateSelectedLayerStyle("text", e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Font Size</label>
                  <input
                    type="number"
                    value={activeTextLayer.fontSize}
                    onChange={(e) => updateSelectedLayerStyle("fontSize", Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white/20 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Font Family</label>
                  <select
                    value={activeTextLayer.fontFamily}
                    onChange={(e) => updateSelectedLayerStyle("fontFamily", e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded text-xs px-2 py-1 text-white focus:outline-none focus:border-white/20 transition"
                  >
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Space Grotesk">Space Grotesk (Modern)</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/50">Alignment</label>
                  <div className="grid grid-cols-3 gap-1">
                    {["left", "center", "right"].map(align => (
                      <button
                        key={align}
                        onClick={() => updateSelectedLayerStyle("alignment", align)}
                        className={`py-1 rounded text-[10px] font-mono uppercase border transition ${
                          activeTextLayer.alignment === align ? "bg-white text-black border-white" : "border-white/10 hover:bg-white/5 text-white/60"
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLOATING CHAT-BASED AI COMPANION (NLP EDITING) */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4 flex flex-col justify-between h-[300px]">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-white" /> AI Layout Assistant
              </span>
              <span className="text-[8px] font-mono text-white/80 bg-white/10 px-1.5 py-0.5 rounded border border-white/20 font-bold">Gemini 2.5</span>
            </div>
            
            <p className="text-[10px] text-white/60 leading-relaxed mt-2">
              Instruct the AI to instantly calculate balance. Try: "Make this page more luxurious", "Place bride on the left, groom on the right", or "Create a bento layout with dynamic margins".
            </p>
          </div>

          <div className="space-y-3">
            {aiSuccessMsg && (
              <div className="p-2.5 bg-white/5 border border-white/10 text-[10px] text-white/90 rounded-lg">
                {aiSuccessMsg}
              </div>
            )}

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Instruct layout AI..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition"
              />
              <button
                onClick={handleAskAI}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="p-2 bg-white hover:bg-white/90 text-black rounded-xl transition shrink-0 disabled:opacity-40"
              >
                {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* QUICK GENERAL ACTIONS */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-3">
          <button
            onClick={handleAddText}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-white/10 hover:bg-white/5 text-xs rounded-xl text-white/80 hover:text-white transition font-semibold"
          >
            <Type className="w-4 h-4 text-white" /> Add Caption Text
          </button>
        </div>

      </div>

      {/* FLOATING TOASTS AND OVERLAYS */}
      <AnimatePresence>
        {creditNoticeMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] border border-emerald-500/30 text-emerald-400 font-mono text-[11px] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {creditNoticeMsg}
          </motion.div>
        )}

        {showCreditModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 max-w-sm w-full rounded-2xl p-6 text-center space-y-6"
            >
              <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mx-auto">
                <Grid className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Insufficient Studio Credits</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Designing layouts consumes <span className="text-white font-mono font-bold">10 credits</span> per sheet. Your current balance is <span className="text-amber-400 font-mono font-bold">{credits}</span> credits.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-white/40 leading-snug text-left font-mono">
                💡 Standard studio package top-up is ₹2 per credit. You can purchase credits instantly with simulated UPI.
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    if (onNavigateToBilling) onNavigateToBilling();
                  }}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl uppercase tracking-wider font-mono transition"
                >
                  Buy Credits Shop
                </button>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
