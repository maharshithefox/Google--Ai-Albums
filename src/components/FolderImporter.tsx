/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Folder, ImageMetadata, PersonCluster } from "../types";
import { STOCK_IMAGES, DEFAULT_FOLDERS } from "../data";
import { FolderPlus, Image as ImageIcon, Sparkles, User, RefreshCw, Layers, Check, Trash2, Filter, Grid, ShieldAlert, BadgeCheck, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FolderImporterProps {
  folders: Folder[];
  images: ImageMetadata[];
  people: PersonCluster[];
  onUpdateFolders: (folders: Folder[]) => void;
  onUpdateImages: (images: ImageMetadata[]) => void;
  onUpdatePeople: (people: PersonCluster[]) => void;
  onNext: () => void;
}

export default function FolderImporter({
  folders,
  images,
  people,
  onUpdateFolders,
  onUpdateImages,
  onUpdatePeople,
  onNext
}: FolderImporterProps) {
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [activePersonFilter, setActivePersonFilter] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const [showMetadataId, setShowMetadataId] = useState<string | null>(null);

  // Initialize folders and assets if empty
  const handleAutoLoadAssets = () => {
    setAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStage("Initializing parallel image pipelines...");

    setTimeout(() => {
      setAnalysisProgress(20);
      setAnalysisStage("Decoding RAW EXIF headers & camera matrices...");
    }, 800);

    setTimeout(() => {
      setAnalysisProgress(45);
      setAnalysisStage("Calculating Laplacian variance (Sharpness & Blur penalty)...");
    }, 1800);

    setTimeout(() => {
      setAnalysisProgress(70);
      setAnalysisStage("Analyzing emotional vectors (Smile detection & Closed Eyes filter)...");
    }, 2800);

    setTimeout(() => {
      setAnalysisProgress(90);
      setAnalysisStage("Running InsightFace clustering & parent identity mapping...");
    }, 3800);

    setTimeout(() => {
      // Load static data
      onUpdateFolders(DEFAULT_FOLDERS);
      onUpdateImages(STOCK_IMAGES);
      
      const simulatedPeople: PersonCluster[] = [
        { id: "p_bride", name: "Ananya", role: "Bride", thumbnailUrl: STOCK_IMAGES[0].url, isCustomNamed: true },
        { id: "p_groom", name: "Rahul", role: "Groom", thumbnailUrl: STOCK_IMAGES[1].url, isCustomNamed: true },
        { id: "p_father_b", name: "Srinivas (Father)", role: "Father of Bride", thumbnailUrl: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=150&q=80", isCustomNamed: true },
        { id: "p_friends", name: "Bridesmaids Team", role: "VIP Guest", thumbnailUrl: STOCK_IMAGES[6].url, isCustomNamed: true }
      ];
      onUpdatePeople(simulatedPeople);

      setAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage("");
    }, 4500);
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: "f_" + Date.now(),
      name: newFolderName.trim(),
      isSystem: false,
      color: "#171717"
    };

    onUpdateFolders([...folders, newFolder]);
    setNewFolderName("");
  };

  const handleDeleteFolder = (id: string) => {
    onUpdateFolders(folders.filter(f => f.id !== id));
    if (activeFolderId === id) setActiveFolderId("all");
    // Remap images in deleted folder to bride portraits
    onUpdateImages(images.map(img => img.folderId === id ? { ...img, folderId: folders[0]?.id || "f_bride" } : img));
  };

  const handleUpdateImageFolder = (imgId: string, folderId: string) => {
    onUpdateImages(images.map(img => img.id === imgId ? { ...img, folderId } : img));
  };

  const handleToggleFaceCluster = (imgId: string, personId: string) => {
    // Toggle simulated face mapping in photo
    onUpdateImages(images.map(img => {
      if (img.id === imgId) {
        const hasPerson = img.faces.some(f => f.personId === personId);
        const updatedFaces = hasPerson 
          ? img.faces.filter(f => f.personId !== personId)
          : [...img.faces, { id: "face_" + Date.now(), boundingBox: { x: 0.3, y: 0.2, w: 0.4, h: 0.4 }, personId, confidence: 0.98 }];
        
        return {
          ...img,
          facesCount: updatedFaces.length,
          faces: updatedFaces
        };
      }
      return img;
    }));
  };

  // Filters
  const filteredImages = images.filter(img => {
    const matchesFolder = activeFolderId === "all" || img.folderId === activeFolderId;
    
    // Simulate person matches for testing filters
    let matchesPerson = true;
    if (activePersonFilter !== "all") {
      if (activePersonFilter === "bride") {
        matchesPerson = img.id === "img_bride_1" || img.id === "img_couple_1" || img.id === "img_couple_walk";
      } else if (activePersonFilter === "groom") {
        matchesPerson = img.id === "img_groom_1" || img.id === "img_couple_1" || img.id === "img_couple_walk";
      } else if (activePersonFilter === "friends") {
        matchesPerson = img.id === "img_friends_1" || img.id === "img_haldi_1";
      }
    }

    return matchesFolder && matchesPerson;
  });

  return (
    <div className="w-full text-white">
      {/* BANNER IF EMPTY */}
      {images.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-white/10 max-w-3xl mx-auto p-12 rounded-2xl text-center space-y-6 my-12 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto">
            <Sparkles className="text-white w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-sans text-2xl font-light">Onboard Studio Wedding Folder</h2>
            <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
              Import organized photography folders. Our localized Vision AI will index EXIF bounds, cluster face geometry, flag closed eyes, and compute photo priority ranks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleAutoLoadAssets}
              disabled={analyzing}
              className="px-6 py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/95 transition flex items-center gap-2 shadow-xl disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing Assets...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Simulate Premium Studio Assets
                </>
              )}
            </button>
          </div>

          {/* AI Progress Indicators */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto space-y-3 pt-4 border-t border-white/10"
              >
                <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-white h-full"
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                  <span className="text-white/60">{analysisStage}</span>
                  <span>{analysisProgress}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ASSETS MANAGER INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR: FOLDERS AND PEOPLE FILTER */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* FOLDERS LIST */}
            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Folders</span>
                <span className="text-[10px] font-mono text-white/40">{folders.length} tags</span>
              </div>

              {/* Folder Selector List */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                <button
                  onClick={() => setActiveFolderId("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex justify-between items-center ${
                    activeFolderId === "all" ? "bg-white text-black font-semibold" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> All Uploads</span>
                  <span className="font-mono text-[10px]">{images.length}</span>
                </button>

                {folders.map(folder => (
                  <div key={folder.id} className="group relative flex items-center justify-between">
                    <button
                      onClick={() => setActiveFolderId(folder.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex justify-between items-center ${
                        activeFolderId === folder.id ? "bg-white text-black font-semibold" : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <span className="truncate pr-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
                        {folder.name}
                      </span>
                      <span className="font-mono text-[10px] text-white/40 group-hover:text-white/80 shrink-0">
                        {images.filter(img => img.folderId === folder.id).length}
                      </span>
                    </button>
                    {!folder.isSystem && (
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="absolute right-8 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom folder form */}
              <form onSubmit={handleAddFolder} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="New Custom Tag..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-white hover:bg-white/90 text-black rounded-lg transition"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* PEOPLE CLUSTERING MATRIX */}
            <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Face Clustering</span>
                <span className="text-[9px] font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded border border-white/20 font-bold">Active</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                <div
                  onClick={() => setActivePersonFilter("all")}
                  className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-center gap-2.5 ${
                    activePersonFilter === "all" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold">Show All Faces</h4>
                    <p className="text-[9px] text-white/40">No individual filter</p>
                  </div>
                </div>

                {people.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.id === "p_bride") setActivePersonFilter("bride");
                      else if (p.id === "p_groom") setActivePersonFilter("groom");
                      else if (p.id === "p_friends") setActivePersonFilter("friends");
                      else setActivePersonFilter("all");
                    }}
                    className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-center gap-2.5 ${
                      (p.id === "p_bride" && activePersonFilter === "bride") ||
                      (p.id === "p_groom" && activePersonFilter === "groom") ||
                      (p.id === "p_friends" && activePersonFilter === "friends")
                        ? "bg-white/10 border border-white/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <img src={p.thumbnailUrl} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" />
                    <div>
                      <h4 className="text-[11px] font-semibold text-white/90">{p.name}</h4>
                      <p className="text-[9px] text-white/60 font-mono font-bold">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onNext}
              className="w-full py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/90 transition shadow-xl text-center flex items-center justify-center gap-2"
            >
              Configure Album Canvas <Sparkles className="w-4 h-4 fill-black/10" />
            </button>
          </div>

          {/* MAIN COLUMN: IMAGES GRID & PHOTO SCORING DETAILS */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-sans text-xl font-light text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-white/70" /> Wedding Assets
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Showing {filteredImages.length} analyzed photographs in active directory.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filters:
                </span>
                <span className="text-[10px] font-mono text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/20 font-bold">
                  Folder: {activeFolderId === "all" ? "All" : folders.find(f=>f.id === activeFolderId)?.name}
                </span>
              </div>
            </div>

            {/* PHOTOS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImages.map(img => (
                <div
                  key={img.id}
                  className="group relative bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition flex flex-col justify-between"
                >
                  {/* Photo Thumbnail */}
                  <div className="aspect-square relative overflow-hidden bg-black">
                    <img
                      src={img.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Quality score badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        img.overallScore > 95 ? "bg-white text-black" : "bg-black/80 text-white/90 border border-white/15"
                      }`}>
                        {img.overallScore} <Sparkles className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    {/* Exif summary on hover */}
                    <div className="absolute inset-0 bg-black/80 p-3 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-between text-[10px] font-mono">
                      <div>
                        <h4 className="text-white/40 uppercase tracking-widest text-[8px] mb-1">RAW IMAGE METADATA</h4>
                        <p className="text-white font-semibold truncate">{img.fileName}</p>
                        <p className="text-white/60 mt-1">Resolution: {img.width}×{img.height}</p>
                        <p className="text-white/60">Orientation: {img.orientation}</p>
                        <p className="text-white/90 mt-2">Sharpness: {img.sharpness}%</p>
                        <p className="text-emerald-400">Smile Score: {img.smileScore}%</p>
                        <p className="text-white/60">Faces: {img.facesCount}</p>
                        <p className="text-white/60 mt-1 italic">"{img.emotion}"</p>
                      </div>

                      {/* Dropdown to change Folder tags */}
                      <div className="pt-2 border-t border-white/10">
                        <label className="text-[8px] text-white/40 block mb-1">FOLDER PATH</label>
                        <select
                          value={img.folderId}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateImageFolder(img.id, e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded text-[9px] text-white px-1 py-0.5 focus:outline-none"
                        >
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Warning alerts */}
                    {img.isClosedEyes && (
                      <div className="absolute bottom-2 left-2 bg-red-500/90 text-white text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" /> Closed Eyes Detected
                      </div>
                    )}
                  </div>

                  {/* Caption details footer */}
                  <div className="p-3 bg-[#0A0A0A] border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] text-white/50 truncate max-w-[100px]">{img.fileName}</span>
                    <span className="text-[9px] font-mono text-white/80 bg-white/10 border border-white/20 px-1.5 rounded font-bold">
                      {folders.find(f => f.id === img.folderId)?.name.split(" ")[0] || "Portraits"}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
