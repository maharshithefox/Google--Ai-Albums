/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Project, ExportFormat, ColorProfile, ExportSettings, NumberingStyle } from "../types";
import { PRINT_LABS } from "../data";
import { ShieldCheck, Download, Printer, Settings, Check, Loader2, Sparkles, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExportPanelProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
}

export default function ExportPanel({ project, onUpdateProject, onBack }: ExportPanelProps) {
  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStage, setCompileStage] = useState("");
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const settings = project.exportSettings;

  const updateSetting = (key: keyof ExportSettings, value: any) => {
    const nextSettings = { ...settings, [key]: value };
    onUpdateProject({
      ...project,
      exportSettings: nextSettings
    });
  };

  const applyLabPreset = (labId: string) => {
    const lab = PRINT_LABS.find(l => l.id === labId);
    if (!lab) return;

    onUpdateProject({
      ...project,
      printCompany: lab.name,
      exportSettings: {
        ...settings,
        format: lab.format,
        colorProfile: lab.colorProfile,
        dpi: lab.dpi,
        bleed: lab.bleed,
        safeMargin: lab.safeMargin
      }
    });
  };

  const handleStartCompilation = () => {
    setCompiling(true);
    setExportComplete(false);
    setCompileProgress(5);
    setCompileStage("Validating bleed thresholds and color spaces...");

    setTimeout(() => {
      setCompileProgress(25);
      setCompileStage("Rasterizing vector spread layers at 300 DPI...");
    }, 1000);

    setTimeout(() => {
      setCompileProgress(50);
      setCompileStage(`Translating color channels to ${settings.colorProfile} profile...`);
    }, 2200);

    setTimeout(() => {
      setCompileProgress(75);
      setCompileStage("Assembling high-res spreads with dynamic safe bleed lines & crop guides...");
    }, 3400);

    setTimeout(() => {
      setCompileProgress(95);
      setCompileStage("Packaging print assets into archive container...");
    }, 4400);

    setTimeout(() => {
      setCompiling(false);
      setExportComplete(true);
      setCompileProgress(100);
      setCompileStage("Finished! Production bundle assembled.");
      setDownloadUrl("wedding_album_studio_print_ready.zip");
    }, 5000);
  };

  return (
    <div className="w-full text-white max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center pb-6 border-b border-white/10">
        <div>
          <h2 className="font-sans text-2xl font-light text-white flex items-center gap-2">
            <Printer className="text-white w-6 h-6" /> Print & Compile Studio
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Produce verified, high-resolution CMYK bundles ready for premium print labs.
          </p>
        </div>

        <button
          onClick={onBack}
          className="text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition font-semibold"
        >
          Return to Canvas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMPILER CONFIGURATION PARAMETERS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* QUICK PRINT LAB MATCHERS */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">
              1. Print Lab Profile Presets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRINT_LABS.map(lab => {
                const isActive = project.printCompany === lab.name;
                return (
                  <div
                    key={lab.id}
                    onClick={() => applyLabPreset(lab.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                      isActive ? "bg-white/10 border-white text-white" : "bg-[#111] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white">{lab.name}</h4>
                      <p className="text-[10px] font-mono text-white/45 mt-1">
                        Format: {lab.format} // {lab.colorProfile}
                      </p>
                    </div>
                    {isActive && <Check className="text-white w-4.5 h-4.5 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADVANCED RENDER SETTINGS */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">
              2. Render Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60">Output Format</label>
                <select
                  value={settings.format}
                  onChange={(e) => updateSetting("format", e.target.value as ExportFormat)}
                  className="w-full bg-[#030303] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value={ExportFormat.PDF}>{ExportFormat.PDF} (Multipage Bundle)</option>
                  <option value={ExportFormat.JPG}>{ExportFormat.JPG} (Lossy Spreads)</option>
                  <option value={ExportFormat.PNG}>{ExportFormat.PNG} (Lossless Spreads)</option>
                  <option value={ExportFormat.TIFF}>{ExportFormat.TIFF} (Archival Uncompressed)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60">Color Target Space</label>
                <select
                  value={settings.colorProfile}
                  onChange={(e) => updateSetting("colorProfile", e.target.value as ColorProfile)}
                  className="w-full bg-[#030303] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value={ColorProfile.CMYK_FOGRA39}>{ColorProfile.CMYK_FOGRA39} (EU Standard)</option>
                  <option value={ColorProfile.CMYK_SWOP}>{ColorProfile.CMYK_SWOP} (US Web Standard)</option>
                  <option value={ColorProfile.SRGB}>{ColorProfile.SRGB} (Digital / sRGB)</option>
                  <option value={ColorProfile.ADOBE_RGB}>{ColorProfile.ADOBE_RGB} (Fine Art / Adobe RGB)</option>
                  <option value={ColorProfile.JAPAN_COLOR}>{ColorProfile.JAPAN_COLOR} (Asia Standard)</option>
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60">Compile DPI</label>
                <select
                  value={settings.dpi}
                  onChange={(e) => updateSetting("dpi", Number(e.target.value))}
                  className="w-full bg-[#030303] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value={150}>150 DPI (Draft Proof)</option>
                  <option value={300}>300 DPI (High-Res Standard)</option>
                  <option value={600}>600 DPI (Ultra Fine Art)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60">Crop Margin Bleed (mm)</label>
                <input
                  type="number"
                  value={settings.bleed}
                  onChange={(e) => updateSetting("bleed", Number(e.target.value))}
                  className="w-full bg-[#030303] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-white/60">Page Number Design</label>
                <select
                  value={settings.numberingStyle}
                  onChange={(e) => updateSetting("numberingStyle", e.target.value as NumberingStyle)}
                  className="w-full bg-[#030303] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value={NumberingStyle.NONE}>{NumberingStyle.NONE}</option>
                  <option value={NumberingStyle.ARABIC}>{NumberingStyle.ARABIC}</option>
                  <option value={NumberingStyle.ROMAN}>{NumberingStyle.ROMAN}</option>
                </select>
              </div>

            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.includeCropMarks}
                  onChange={(e) => updateSetting("includeCropMarks", e.target.checked)}
                  className="rounded bg-[#030303] border-white/10 text-white focus:ring-0"
                />
                Include crop ticks and registration lines
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION BLOCK & COMPILE SIMULATOR */}
        <div className="space-y-6">
          
          {/* PIPELINE PRE-FLIGHT CHECKS */}
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 border-b border-white/10 pb-2">
              <ShieldCheck className="text-white w-4 h-4" /> Pre-flight Verification
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-white/70">
                <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white/95">Resolution Standard</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">All image sources exceed 300 DPI bounds.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-white/70">
                <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white/95">Safety Margins Check</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">No face-bounding coordinates cut guidelines.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-white/70">
                <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white/95">Bleed Boundaries</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">Middle fold spacing is correctly calculated.</p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN COMPILE TRIGGER */}
          <div className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
              <Sparkles className="text-white w-6 h-6" />
            </div>

            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-white">Assemble Wedding Bundle</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Synthesize your pages. Vector structures will be flattened, cropped, color-translated, and compressed into production formats.
            </p>

            <button
              onClick={handleStartCompilation}
              disabled={compiling}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-white/90 text-black font-sans text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              {compiling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Compiling...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Start Compile Run
                </>
              )}
            </button>
          </div>

          {/* SIMULATED PROGRESS DRAWER */}
          <AnimatePresence>
            {compiling && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest font-bold">COMPILING WORKSPACE</span>
                  <span className="font-mono text-[10px] text-white font-bold">{compileProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-white h-full"
                    animate={{ width: `${compileProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-white/40 italic font-mono truncate">{compileStage}</p>
              </motion.div>
            )}

            {exportComplete && downloadUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0A0A0A] border border-emerald-500/30 p-5 rounded-2xl bg-emerald-950/5 space-y-3 text-center"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Check className="text-emerald-400 w-4.5 h-4.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Bundle Ready for Print</h4>
                <p className="text-[10px] text-white/50">
                  Multipage spread compiled successfully. All crop tick matrices conform to print presets.
                </p>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Download Simulated: high-resolution print files are successfully packaged and saved!");
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" /> Download Production ZIP
                </a>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
