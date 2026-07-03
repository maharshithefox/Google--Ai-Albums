/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Project, Folder, ImageMetadata, PersonCluster } from "./types";
import Dashboard from "./components/Dashboard";
import ProjectCreator from "./components/ProjectCreator";
import FolderImporter from "./components/FolderImporter";
import AlbumEditor from "./components/AlbumEditor";
import ExportPanel from "./components/ExportPanel";
import LearningCenter from "./components/LearningCenter";
import AuthScreen from "./components/AuthScreen";
import BillingShop from "./components/BillingShop";
import ReadyMadeAssets from "./components/ReadyMadeAssets";
import { auth, signOut, onAuthStateChanged, db } from "./lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { Sparkles, Settings, BookOpen, User, HelpCircle, BadgeCheck, Play, Layers, ArrowLeft, Home, LogOut, RefreshCw, Coins, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ScreenState = "dashboard" | "creator" | "importer" | "editor" | "exporter" | "learning" | "billing" | "assets";

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("dashboard");
  const [screenHistory, setScreenHistory] = useState<ScreenState[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [user, setUser] = useState<{ email: string; displayName: string; photoURL?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Studio Credits & Marketplace states
  const [credits, setCredits] = useState<number>(() => {
    const cached = localStorage.getItem("studio_credits_v1");
    return cached ? parseInt(cached) : 120; // Default starts with generous 120 credits
  });

  const [unlockedAssetIds, setUnlockedAssetIds] = useState<string[]>(() => {
    const cached = localStorage.getItem("studio_unlocked_assets_v1");
    if (cached) {
      try { return JSON.parse(cached); } catch { return []; }
    }
    return [];
  });

  const handleAddCredits = async (amount: number) => {
    const next = credits + amount;
    setCredits(next);
    localStorage.setItem("studio_credits_v1", String(next));
    if (user?.email) {
      try {
        const profileRef = doc(db, "user_profiles", user.email);
        await setDoc(profileRef, {
          credits: next,
          email: user.email,
          displayName: user.displayName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error writing credits to Firestore:", err);
      }
    }
  };

  const handleDeductCredits = (amount: number): boolean => {
    if (credits >= amount) {
      const next = credits - amount;
      setCredits(next);
      localStorage.setItem("studio_credits_v1", String(next));
      if (user?.email) {
        const profileRef = doc(db, "user_profiles", user.email);
        setDoc(profileRef, {
          credits: next,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.error("Error writing deducted credits:", err));
      }
      return true;
    }
    return false;
  };

  const handleUnlockAsset = (id: string) => {
    const next = [...unlockedAssetIds, id];
    setUnlockedAssetIds(next);
    localStorage.setItem("studio_unlocked_assets_v1", JSON.stringify(next));
  };

  // Sync credits with Firestore user profile
  useEffect(() => {
    if (!user?.email) return;

    const profileRef = doc(db, "user_profiles", user.email);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.credits === "number") {
          setCredits(data.credits);
          localStorage.setItem("studio_credits_v1", String(data.credits));
        }
      } else {
        // Initialize user profile document
        setDoc(profileRef, {
          credits: credits,
          email: user.email,
          displayName: user.displayName,
          updatedAt: new Date().toISOString()
        }).catch(err => console.error("Error creating user profile:", err));
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  // Sync Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          photoURL: firebaseUser.photoURL || undefined
        });
      } else {
        // Fallback check: check if there's a stored sandbox session in localStorage
        const cachedUser = localStorage.getItem("sandbox_user");
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (u: { email: string; displayName: string; photoURL?: string }) => {
    setUser(u);
    // Persist sandbox session just in case popups fail or page refreshes
    localStorage.setItem("sandbox_user", JSON.stringify(u));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase Signout Error:", e);
    }
    setUser(null);
    localStorage.removeItem("sandbox_user");
    setScreen("dashboard");
    setScreenHistory([]);
  };
  
  // Auxiliary settings modals
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Load custom projects on initialization
  useEffect(() => {
    const stored = localStorage.getItem("studio_projects_v2");
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse projects:", e);
      }
    }
  }, []);

  // Prevent landing on active project screens without an active project
  useEffect(() => {
    if (!activeProject && ["importer", "editor", "exporter"].includes(screen)) {
      setScreen("dashboard");
    }
  }, [activeProject, screen]);

  const saveProjects = (updatedList: Project[]) => {
    setProjects(updatedList);
    localStorage.setItem("studio_projects_v2", JSON.stringify(updatedList));
  };

  const navigate = (newScreen: ScreenState) => {
    if (newScreen !== screen) {
      setScreenHistory((prev) => [...prev, screen]);
      setScreen(newScreen);
    }
  };

  const handleGoBack = () => {
    if (screenHistory.length > 0) {
      const newHistory = [...screenHistory];
      const prevScreen = newHistory.pop()!;
      setScreenHistory(newHistory);
      setScreen(prevScreen);
    } else {
      // Logical fallback if history is empty
      if (screen === "creator") setScreen("dashboard");
      else if (screen === "importer") setScreen("dashboard");
      else if (screen === "editor") setScreen("importer");
      else if (screen === "exporter") setScreen("editor");
      else setScreen("dashboard");
    }
  };

  const handleGoHome = () => {
    navigate("dashboard");
  };

  const handleCreateNewProject = () => {
    navigate("creator");
  };

  const handleProjectCreated = (newProject: Project) => {
    const updated = [newProject, ...projects];
    saveProjects(updated);
    setActiveProject(newProject);
    navigate("importer");
  };

  const handleOpenProject = (proj: Project) => {
    setActiveProject(proj);
    navigate("editor");
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setActiveProject(updatedProj);
    const updatedList = projects.map(p => p.id === updatedProj.id ? updatedProj : p);
    saveProjects(updatedList);
  };

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex bg-[#020202] justify-center items-center">
        <RefreshCw className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#020202] font-sans text-white overflow-hidden select-none">
      
      {/* TOP LIVE NEWS & SPECIAL OFFERS MARQUEE BANNER */}
      <div className="bg-gradient-to-r from-purple-950/40 via-black to-purple-950/40 border-b border-purple-500/20 py-2 px-6 flex items-center justify-between gap-6 z-50 text-xs shrink-0 select-none overflow-hidden h-9">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-mono text-[9px] font-extrabold tracking-widest text-red-400 uppercase bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
            LIVE NEWS
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-marquee whitespace-nowrap text-[11px] font-mono font-medium text-white/85">
            🔥 SPECIAL OFFER: Apply secret coupons in the Billing Shop to load massive free layout credits! &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; ⚡ AUTOMATION RULE: UPI AutoPay Standing Instructions are now active for direct-to-bank studio settlements! &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; 🎁 SPECIAL DISCOUNT: First-time users get +120 COMPLIMENTARY CREDITS instantly upon registering! &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; 🚀 PRODUCTION UPGRADE: DPI 300 print-ready PDF layout generator fully optimized for commercial print labs.
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
            SPECIAL OFFERS
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SLEEK SIDEBAR */}
        <aside className="w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col p-6 gap-8 shrink-0">
        {/* Logo/Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("dashboard")}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-white to-gray-600 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <div className="leading-tight">
            <span className="block text-xs font-bold tracking-widest text-white/40 uppercase">Studio Pro</span>
            <span className="block font-semibold text-sm tracking-tight text-white">GOOGLE AI STUDIO</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-bold">Management</div>
          
          <button
            onClick={() => navigate("dashboard")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              screen === "dashboard"
                ? "bg-white/10 border border-white/25 text-white"
                : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={handleCreateNewProject}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              screen === "creator"
                ? "bg-white/10 border border-white/25 text-white"
                : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            Create Project
          </button>

          <div className="text-[10px] uppercase tracking-widest text-white/30 mt-6 mb-2 font-bold">Premium Extras</div>

          <button
            onClick={() => navigate("assets")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              screen === "assets"
                ? "bg-white/10 border border-white/25 text-white"
                : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-emerald-400" />
            Ready Made Assets
          </button>

          <button
            onClick={() => navigate("billing")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
              screen === "billing"
                ? "bg-white/10 border border-white/25 text-white"
                : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4 shrink-0 text-amber-400" />
            Credits &amp; Billing
          </button>

          {/* Active project steps */}
          {activeProject && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-6 mb-2 font-bold truncate">
                Active: {activeProject.name.split(" ")[0]}
              </div>

              <button
                onClick={() => navigate("importer")}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  screen === "importer"
                    ? "bg-white/10 border border-white/25 text-white"
                    : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                Media Importer
              </button>

              <button
                onClick={() => navigate("editor")}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  screen === "editor"
                    ? "bg-white/10 border border-white/25 text-white"
                    : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                Layout Canvas
              </button>

              <button
                onClick={() => navigate("exporter")}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  screen === "exporter"
                    ? "bg-white/10 border border-white/25 text-white"
                    : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                Export Suite
              </button>
            </>
          )}

          <div className="text-[10px] uppercase tracking-widest text-white/30 mt-6 mb-2 font-bold">Resources</div>
          
          <button
            onClick={() => setShowLearningModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 border border-transparent text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs font-semibold text-left transition-all"
          >
            Tutorial Hub
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 border border-transparent text-white/60 hover:bg-white/5 hover:text-white rounded-lg text-xs font-semibold text-left transition-all"
          >
            Print Lab Config
          </button>
        </nav>

        {/* User profile block */}
        <div className="pt-5 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-2">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                referrerPolicy="no-referrer" 
                className="w-8 h-8 rounded-full object-cover border border-white/25 shrink-0" 
                alt={user.displayName}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/25 flex items-center justify-center font-mono text-[10px] text-white/80 font-bold shrink-0">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : "US"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user.displayName}</div>
              <div className="text-[10px] text-white/40 truncate">{user.email}</div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-[11px] font-mono font-bold text-white/60 hover:text-white transition-all uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT PANEL */}
      <main className="flex-1 flex flex-col bg-[#020202] overflow-hidden">
        
        {/* TOP COMPLIANT HEADER */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-[#020202]/50 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-5">
            {/* Nav Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoBack}
                disabled={screen === "dashboard" && screenHistory.length === 0}
                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoHome}
                disabled={screen === "dashboard"}
                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition text-white/80 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="Go to Dashboard (Home)"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <h1 className="text-lg font-light tracking-tight text-white">
              Album Designer{" "}
              <span className="text-white/40 font-extralight">
                / {screen === "dashboard" && "Dashboard"}
                {screen === "creator" && "Create Project"}
                {screen === "importer" && `Media Importer - ${activeProject?.name}`}
                {screen === "editor" && `Canvas Editor - ${activeProject?.name}`}
                {screen === "exporter" && `Export & Print - ${activeProject?.name}`}
                {screen === "billing" && "Credits & Studio Top-up"}
                {screen === "assets" && "Ready Made Creative Assets"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Clickable Credits Balance badge */}
            <button
              onClick={() => navigate("billing")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs rounded-full font-mono font-bold transition shadow-md"
              title="Studio Credits Balance. Click to purchase additional credits."
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{credits} CREDITS</span>
            </button>

            {screen !== "creator" && (
              <button
                onClick={handleCreateNewProject}
                className="px-4 py-2 bg-white hover:bg-white/90 text-black text-[11px] font-bold rounded-full tracking-tighter uppercase transition duration-300"
              >
                + Create New Project
              </button>
            )}

            <button
              onClick={() => setShowConfigModal(true)}
              className="w-10 h-10 rounded-full border border-white/10 hover:border-white/25 flex items-center justify-center transition"
            >
              <Settings className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA (Scrollable, padded, beautiful layout spacing) */}
        <div className="p-10 space-y-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {screen === "dashboard" && (
                <Dashboard
                  projects={projects}
                  onCreateNewProject={handleCreateNewProject}
                  onOpenProject={handleOpenProject}
                  onOpenLearningCenter={() => setShowLearningModal(true)}
                />
              )}

              {screen === "creator" && (
                <ProjectCreator
                  onProjectCreated={handleProjectCreated}
                  onCancel={() => navigate("dashboard")}
                />
              )}

              {screen === "importer" && activeProject && (
                <FolderImporter
                  folders={activeProject.folders}
                  images={activeProject.images}
                  people={activeProject.people}
                  onUpdateFolders={(f) => handleUpdateProject({ ...activeProject, folders: f })}
                  onUpdateImages={(i) => handleUpdateProject({ ...activeProject, images: i })}
                  onUpdatePeople={(p) => handleUpdateProject({ ...activeProject, people: p })}
                  onNext={() => navigate("editor")}
                />
              )}

              {screen === "editor" && activeProject && (
                <AlbumEditor
                  project={activeProject}
                  onUpdateProject={handleUpdateProject}
                  onBack={() => navigate("exporter")}
                  credits={credits}
                  onDeductCredits={handleDeductCredits}
                  onNavigateToBilling={() => navigate("billing")}
                />
              )}

              {screen === "exporter" && activeProject && (
                <ExportPanel
                  project={activeProject}
                  onUpdateProject={handleUpdateProject}
                  onBack={() => navigate("editor")}
                />
              )}

              {screen === "billing" && (
                <BillingShop
                  credits={credits}
                  onAddCredits={handleAddCredits}
                  user={user}
                />
              )}

              {screen === "assets" && (
                <ReadyMadeAssets
                  credits={credits}
                  onDeductCredits={handleDeductCredits}
                  unlockedAssetIds={unlockedAssetIds}
                  onUnlockAsset={handleUnlockAsset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM METADATA BAR */}
        <footer className="p-6 border-t border-white/10 bg-[#0A0A0A] flex justify-between items-center text-[10px] text-white/40 tracking-wider font-bold shrink-0 font-mono">
          <div className="flex gap-8">
            <span>DPI: 300 (PRINT-READY)</span>
            <span>EXPORT FORMAT: TIFF / CMYK</span>
            <span>SAFE MARGIN: 10MM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> SYSTEM ONLINE
          </div>
        </footer>

      </main>

      {/* AUXILIARY DIALOGS */}
      <AnimatePresence>
        {showLearningModal && (
          <LearningCenter onClose={() => setShowLearningModal(false)} />
        )}

        {showConfigModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 max-w-md w-full rounded-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Studio Configurations</span>
                <button onClick={() => setShowConfigModal(false)} className="text-white/40 hover:text-white text-xs">Close</button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <h4 className="text-xs font-semibold text-[#D4AF37]">GPU Performance Optimization</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Local GPU acceleration is active via browser WebGL filters. Canvas zooms and canvas translation operations will utilize hardware raster units.
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <h4 className="text-xs font-semibold text-white">Local Offline Cache status</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Custom canvas metrics and saved dimensions profiles are synchronized to browser Cache partitions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2 bg-white text-black font-semibold rounded-lg text-xs hover:bg-white/90 transition"
              >
                Accept Settings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
