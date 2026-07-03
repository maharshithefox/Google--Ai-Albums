/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Project, Unit, ColorProfile, ExportFormat, CustomSize, PageType, NumberingStyle } from "../types";
import { BUILTIN_ALBUM_SIZES, PRINT_LABS } from "../data";
import { Sparkles, ArrowRight, Save, Plus, HelpCircle, Check, Info } from "lucide-react";

interface ProjectCreatorProps {
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}

export default function ProjectCreator({ onProjectCreated, onCancel }: ProjectCreatorProps) {
  // Client & Event State
  const [weddingName, setWeddingName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [eventDate, setEventDate] = useState("2026-07-02");
  const [designerName, setDesignerName] = useState("Lead Studio Designer");
  const [notes, setNotes] = useState("");

  // Size Preset State
  const [selectedSizeName, setSelectedSizeName] = useState(BUILTIN_ALBUM_SIZES[0].name);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizesList, setCustomSizesList] = useState<CustomSize[]>([]);

  // Custom Size Fields
  const [customName, setCustomName] = useState("Premium Custom Layout");
  const [customWidth, setCustomWidth] = useState(36);
  const [customHeight, setCustomHeight] = useState(12);
  const [customUnit, setCustomUnit] = useState<Unit>(Unit.INCHES);
  const [customDpi, setCustomDpi] = useState(300);
  const [customBleed, setCustomBleed] = useState(3); // mm
  const [customSafeMargin, setCustomSafeMargin] = useState(10); // mm
  const [customSpine, setCustomSpine] = useState(0); // mm
  const [customFold, setCustomFold] = useState(0); // mm

  // Print Lab state
  const [selectedLabId, setSelectedLabId] = useState(PRINT_LABS[0].id);
  const [albumTheme, setAlbumTheme] = useState("luxury_dark");

  // Load custom sizes on mount
  useEffect(() => {
    const stored = localStorage.getItem("studio_custom_album_sizes");
    if (stored) {
      try {
        setCustomSizesList(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveCustomSize = () => {
    const newSize: CustomSize = {
      id: "cs_" + Date.now(),
      name: customName,
      width: customWidth,
      height: customHeight,
      unit: customUnit,
      dpi: customDpi,
      bleed: customBleed,
      safeMargin: customSafeMargin,
      spineWidth: customSpine,
      foldMargin: customFold
    };

    const updatedList = [...customSizesList, newSize];
    setCustomSizesList(updatedList);
    localStorage.setItem("studio_custom_album_sizes", JSON.stringify(updatedList));
    setSelectedSizeName(newSize.name);
    setIsCustomSize(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSize: any;

    const savedCustom = customSizesList.find(s => s.name === selectedSizeName);
    if (savedCustom) {
      finalSize = {
        name: savedCustom.name,
        width: savedCustom.width,
        height: savedCustom.height,
        unit: savedCustom.unit,
        dpi: savedCustom.dpi,
        bleed: savedCustom.bleed,
        safeMargin: savedCustom.safeMargin,
        spineWidth: savedCustom.spineWidth,
        foldMargin: savedCustom.foldMargin
      };
    } else {
      const builtin = BUILTIN_ALBUM_SIZES.find(b => b.name === selectedSizeName);
      if (builtin) {
        finalSize = {
          name: builtin.name,
          width: builtin.width,
          height: builtin.height,
          unit: builtin.unit,
          dpi: builtin.dpi,
          bleed: builtin.bleed,
          safeMargin: builtin.safeMargin,
          spineWidth: 0,
          foldMargin: 0
        };
      } else {
        // Fallback custom dimensions directly
        finalSize = {
          name: customName,
          width: customWidth,
          height: customHeight,
          unit: customUnit,
          dpi: customDpi,
          bleed: customBleed,
          safeMargin: customSafeMargin,
          spineWidth: customSpine,
          foldMargin: customFold
        };
      }
    }

    const selectedLab = PRINT_LABS.find(l => l.id === selectedLabId) || PRINT_LABS[0];

    const newProject: Project = {
      id: "proj_" + Date.now(),
      name: weddingName || `${brideName} & ${groomName}'s Royal Wedding`,
      brideName,
      groomName,
      eventDate,
      designerName,
      printCompany: selectedLab.name,
      notes,
      albumSize: finalSize,
      sheetsCount: 15, // Default start
      themeId: albumTheme,
      folders: [], // Starts empty, to import later
      images: [], // Starts empty
      people: [], // Starts empty
      spreads: Array.from({ length: 15 }, (_, i) => ({
        id: `spread_${i}`,
        pageIndex: i,
        pageType: i === 0 ? PageType.COVER : PageType.DOUBLE_SPREAD,
        title: i === 0 ? "The Wedding Album" : `Spread ${i}`,
        bgType: "color",
        bgColor: "#0C0C0C",
        imageLayers: [],
        textLayers: i === 0 ? [
          {
            id: `text_cover_title`,
            text: `${brideName.toUpperCase()} & ${groomName.toUpperCase()}`,
            x: 10,
            y: 40,
            w: 80,
            h: 10,
            rotation: 0,
            fontSize: 32,
            fontFamily: "Playfair Display",
            fontWeight: "normal",
            color: "#D4AF37",
            alignment: "center",
            opacity: 1,
            zIndex: 1
          },
          {
            id: `text_cover_sub`,
            text: `THE CELEBRATION BOOK  //  ${eventDate.split("-")[0]}`,
            x: 10,
            y: 52,
            w: 80,
            h: 5,
            rotation: 0,
            fontSize: 11,
            fontFamily: "Space Grotesk",
            fontWeight: "normal",
            color: "#FFFFFF",
            alignment: "center",
            opacity: 0.6,
            zIndex: 2
          }
        ] : []
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exportSettings: {
        format: selectedLab.format,
        dpi: finalSize.dpi,
        colorProfile: selectedLab.colorProfile,
        bleed: finalSize.bleed,
        safeMargin: finalSize.safeMargin,
        includeCropMarks: true,
        includePageNumbers: false,
        numberingStyle: NumberingStyle.NONE
      }
    };

    onProjectCreated(newProject);
  };

  return (
    <div className="w-full text-white max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h2 className="font-sans text-3xl font-light tracking-tight text-white flex items-center gap-2">
          Create New Project
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Configure client parameters, custom paper sheets, and export tolerances.
        </p>
      </div>

      <form onSubmit={handleCreateProject} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CLIENT & DESIGNER DATA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">
              1. Client & Event Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Bride Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ananya"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Groom Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rahul"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Wedding Name (Folder Brand)</label>
                <input
                  type="text"
                  placeholder="e.g., Ananya & Rahul Wedding"
                  value={weddingName}
                  onChange={(e) => setWeddingName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Studio Lead Designer</label>
                <input
                  type="text"
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Print Partner Lab Preset</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-white/30 transition text-white"
                >
                  {PRINT_LABS.map(lab => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.brand})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Studio Composition Notes</label>
              <textarea
                placeholder="e.g., Focus primarily on gold jewelry details, royal palace backgrounds, and emotional reactions."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 transition text-white"
              />
            </div>
          </div>

          {/* DYNAMIC CUSTOM ALBUM CREATION COMPONENT */}
          {isCustomSize ? (
            <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Define Custom Album Sheet
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCustomSize(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Cancel Custom
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Profile Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Dimensions Unit</label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as Unit)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value={Unit.INCHES}>Inches (USA / UK)</option>
                    <option value={Unit.MM}>Millimeters (EU)</option>
                    <option value={Unit.CM}>Centimeters</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Render DPI</label>
                  <select
                    value={customDpi}
                    onChange={(e) => setCustomDpi(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value={150}>150 DPI (Preview)</option>
                    <option value={300}>300 DPI (Standard Print)</option>
                    <option value={600}>600 DPI (Fine Art Archival)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Page Width</label>
                  <input
                    type="number"
                    step="any"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Page Height</label>
                  <input
                    type="number"
                    step="any"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Print Bleed (mm)</label>
                  <input
                    type="number"
                    value={customBleed}
                    onChange={(e) => setCustomBleed(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Safe Area Margin (mm)</label>
                  <input
                    type="number"
                    value={customSafeMargin}
                    onChange={(e) => setCustomSafeMargin(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Middle Spine fold width (mm)</label>
                  <input
                    type="number"
                    value={customSpine}
                    onChange={(e) => setCustomSpine(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-bold">Inside fold foldback margin (mm)</label>
                  <input
                    type="number"
                    value={customFold}
                    onChange={(e) => setCustomFold(Number(e.target.value))}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveCustomSize}
                  className="flex items-center gap-1.5 px-5 py-2 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/90 transition shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" /> Save Custom Preset
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN: DIMENSIONS & CONFIG SELECTIONS */}
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
                2. Album Dimension Preset
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomSize(true)}
                className="text-xs text-white hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Custom
              </button>
            </div>

            {/* Sizes Radio List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
              {/* Custom saved sizes first */}
              {customSizesList.map(size => (
                <div
                  key={size.id}
                  onClick={() => setSelectedSizeName(size.name)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex justify-between items-center ${
                    selectedSizeName === size.name
                      ? "bg-white/5 border-white"
                      : "bg-[#111] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white/90">{size.name}</h4>
                    <p className="text-[10px] font-mono text-white/50 mt-1">
                      {size.width}×{size.height} {size.unit} // Custom Saved
                    </p>
                  </div>
                  {selectedSizeName === size.name && (
                    <Check className="text-white w-4 h-4 shrink-0" />
                  )}
                </div>
              ))}

              {/* Built-in Sizes */}
              {BUILTIN_ALBUM_SIZES.map(size => (
                <div
                  key={size.name}
                  onClick={() => setSelectedSizeName(size.name)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex justify-between items-center ${
                    selectedSizeName === size.name
                      ? "bg-white/5 border-white"
                      : "bg-[#111] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white/90">{size.name}</h4>
                    <p className="text-[10px] font-mono text-white/50 mt-1">
                      {size.width}×{size.height} {size.unit} // Bleed: {size.bleed}mm // {size.dpi}DPI
                    </p>
                  </div>
                  {selectedSizeName === size.name && (
                    <Check className="text-white w-4 h-4 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLOR AND STYLING SCHEME */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">
              3. Visual Styling Concept
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setAlbumTheme("luxury_dark")}
                className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                  albumTheme === "luxury_dark" ? "bg-white/5 border-white" : "bg-[#111] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-black border border-white/20 mx-auto mb-1.5" />
                <span className="text-[10px] font-medium text-white/80">Pure Luxury Black</span>
              </div>

              <div
                onClick={() => setAlbumTheme("ivory_light")}
                className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                  albumTheme === "ivory_light" ? "bg-white/5 border-white" : "bg-[#111] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#FDFBF7] border border-white/10 mx-auto mb-1.5" />
                <span className="text-[10px] font-medium text-white/80">Editorial Cream</span>
              </div>

              <div
                onClick={() => setAlbumTheme("temple_gold")}
                className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                  albumTheme === "temple_gold" ? "bg-white/5 border-white" : "bg-[#111] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#1A1105] border border-white/20 mx-auto mb-1.5" />
                <span className="text-[10px] font-medium text-white/80">Sandalwood Gold</span>
              </div>

              <div
                onClick={() => setAlbumTheme("royal_indigo")}
                className={`p-3 rounded-xl border cursor-pointer text-center transition ${
                  albumTheme === "royal_indigo" ? "bg-white/5 border-white" : "bg-[#111] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#050B14] border border-white/20 mx-auto mb-1.5" />
                <span className="text-[10px] font-medium text-white/80">Imperial Indigo</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={!brideName || !groomName}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/95 transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initialize Album Studio <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center py-2 text-xs text-white/40 hover:text-white transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
