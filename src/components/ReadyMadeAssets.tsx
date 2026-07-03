import React, { useState } from "react";
import { 
  Video, Music, Camera, Palette, Type, Globe, Layout, 
  Briefcase, Boxes, Smartphone, ShoppingBag, Eye, 
  ArrowDownToLine, Coins, Search, CheckCircle, Sparkles, Star, Loader2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Asset {
  id: string;
  name: string;
  category: string;
  desc: string;
  cost: number;
  tags: string[];
  thumbnail: string;
  isWeddingSpecial?: boolean;
}

interface ReadyMadeAssetsProps {
  credits: number;
  onDeductCredits: (amount: number) => boolean;
  unlockedAssetIds: string[];
  onUnlockAsset: (id: string) => void;
}

export default function ReadyMadeAssets({ credits, onDeductCredits, unlockedAssetIds, onUnlockAsset }: ReadyMadeAssetsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activePreviewAsset, setActivePreviewAsset] = useState<Asset | null>(null);
  
  // Categories & icons mapper
  const categories = [
    { id: "all", name: "All Assets", icon: ShoppingBag },
    { id: "wedding", name: "💍 Wedding Specials", icon: Star },
    { id: "video", name: "🎬 Video Editing", icon: Video },
    { id: "audio", name: "🎵 Audio & Music", icon: Music },
    { id: "photography", name: "📷 Photography", icon: Camera },
    { id: "design", name: "🎨 Graphic Design", icon: Palette },
    { id: "fonts", name: "✍️ Fonts & Calligraphy", icon: Type },
    { id: "web", name: "🌐 Web Dev Themes", icon: Globe },
    { id: "wordpress", name: "💻 CMS & WordPress", icon: Layout },
    { id: "business", name: "📊 Business & Pitch Decks", icon: Briefcase },
    { id: "3d", name: "🎭 3D Models & Assets", icon: Boxes },
    { id: "social", name: "📱 Reels & Social Media", icon: Smartphone },
    { id: "ai", name: "🤖 AI Creative Tools", icon: Sparkles },
  ];

  const assetsList: Asset[] = [
    // --- 💍 Wedding Specials ---
    {
      id: "wed_01",
      name: "Cinematic Shehnai & Sitar Orchestral Soundtrack",
      category: "wedding",
      desc: "Perfect background wedding score for teaser trails or openers. Includes royalty-free stems.",
      cost: 15,
      tags: ["Cinematic wedding music", "South Indian", "Instrumental", "Audio"],
      thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },
    {
      id: "wed_02",
      name: "South Indian Royal Temple Slideshow Template",
      category: "wedding",
      desc: "Warm brassy tones, floral margins, and bento slideshow preset for After Effects or Premiere.",
      cost: 25,
      tags: ["South Indian wedding slideshow templates", "Gold luxury", "Teaser templates", "Video"],
      thumbnail: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },
    {
      id: "wed_03",
      name: "Luxury Leather Bound Wedding Album Mockups (PSD)",
      category: "wedding",
      desc: "Pre-rendered smart object layouts to pitch finalized physical album bounds to families.",
      cost: 10,
      tags: ["Album mockups", "PSD", "Graphic Design"],
      thumbnail: "https://images.unsplash.com/photo-1544924222-35298d690374?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },
    {
      id: "wed_04",
      name: "Mandap Bokeh Overlay & Particle Effects Pack",
      category: "wedding",
      desc: "Gold particle overlays, lens flares, light leaks, and royal bokeh sparkles to enrich any background.",
      cost: 15,
      tags: ["Particle effects", "Bokeh overlays", "Lens flares", "Light leaks"],
      thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },
    {
      id: "wed_05",
      name: "Elegant Calligraphy Font Bundle - Royal Gold Style",
      category: "wedding",
      desc: "Premium OTF calligraphy fonts perfect for invitation headers and title margins.",
      cost: 8,
      tags: ["Gold luxury fonts", "Wedding calligraphy fonts", "Fonts"],
      thumbnail: "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },
    {
      id: "wed_06",
      name: "Indian Wedding Vector Mandap & Floral Ornaments",
      category: "wedding",
      desc: "High-resolution vector assets featuring marigold garlands, royal arches, and geometric designs.",
      cost: 12,
      tags: ["Floral elements", "Mandap backgrounds", "Royal wedding graphics", "Graphic Design"],
      thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=300",
      isWeddingSpecial: true
    },

    // --- Video Editing ---
    {
      id: "vid_01",
      name: "Cinematic LUTs Pack (35 Hollywood Grades)",
      category: "video",
      desc: "High fidelity color lookup tables (.cube) calibrated for SLOG, D-Log, and Rec709 wedding tracks.",
      cost: 15,
      tags: ["Cinematic LUTs", "Transitions", "Premiere Pro", "DaVinci Resolve"],
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300"
    },
    {
      id: "vid_02",
      name: "Drone Shot B-Rolls: Indian Countryside & Luxury Venues",
      category: "video",
      desc: "4K cinematic footage of royal palaces, backwaters, and pristine outdoor setups.",
      cost: 20,
      tags: ["Drone shots", "Stock videos & cinematic footage", "Video"],
      thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=300"
    },

    // --- Audio ---
    {
      id: "aud_01",
      name: "Ultimate Wedding Sound Effects (Whooshes, Transitions & UI)",
      category: "audio",
      desc: "Cinematic atmosphere builders, soft wind chimes, whooshes, and traditional dhol hits.",
      cost: 10,
      tags: ["Sound effects", "Wedding music", "Whooshes", "Dhol"],
      thumbnail: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=300"
    },

    // --- Photography ---
    {
      id: "pho_01",
      name: "Sky Replacement Pack - Golden Hour & Starry Nights",
      category: "photography",
      desc: "Ultra-res 8K sky backgrounds to dramatically transform flat wedding portraits.",
      cost: 10,
      tags: ["Sky replacements", "Backgrounds", "Textures", "Photography"],
      thumbnail: "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=300"
    },

    // --- Graphic Design ---
    {
      id: "gph_01",
      name: "Royal Invitation PSD Layouts with Gold Foiling Profiles",
      category: "design",
      desc: "Exquisite layered Photoshop files ready for customizable typography print alignment.",
      cost: 14,
      tags: ["Wedding invitations", "PSD templates", "Graphic Design"],
      thumbnail: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=300"
    },

    // --- Fonts ---
    {
      id: "fnt_01",
      name: "Swiss Sans-Serif & Modernist Display Typeface",
      category: "fonts",
      desc: "An elegant display font family featuring pristine tracking, ideal for corporate or minimal logs.",
      cost: 8,
      tags: ["Premium fonts", "Sans-serif fonts", "Display fonts"],
      thumbnail: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=300"
    },

    // --- Web Development ---
    {
      id: "web_01",
      name: "React + Tailwind Studio Booking Hub Template",
      category: "web",
      desc: "Next-gen single page portfolio layout featuring responsive client reservation fields.",
      cost: 25,
      tags: ["React templates", "Tailwind CSS templates", "Landing pages"],
      thumbnail: "https://images.unsplash.com/photo-1541462608141-2ff030de4a40?auto=format&fit=crop&q=80&w=300"
    },

    // --- WordPress ---
    {
      id: "wp_01",
      name: "Symphony Photography Elementor Kit",
      category: "wordpress",
      desc: "Pre-configured landing panels, dark portfolios, and high density media grids.",
      cost: 20,
      tags: ["Elementor kits", "WordPress themes"],
      thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=300"
    },

    // --- Business ---
    {
      id: "bus_01",
      name: "Studio Pitch Deck & Cinematic Proposal Slides",
      category: "business",
      desc: "Sleek pitch layouts in PowerPoint & Keynote configurations with pre-arranged vector sheets.",
      cost: 12,
      tags: ["PowerPoint templates", "Pitch decks", "Keynote templates"],
      thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=300"
    },

    // --- 3D Assets ---
    {
      id: "asset_3d_01",
      name: "Royal Mandap Arch 3D Model (.obj / .fbx)",
      category: "3d",
      desc: "Pristine polygon layouts of detailed wooden arches and gold pillars for set design previews.",
      cost: 15,
      tags: ["3D models", "Textures", "Product renders"],
      thumbnail: "https://images.unsplash.com/photo-1512418490979-92798cec1380?auto=format&fit=crop&q=80&w=300"
    },

    // --- Social Media ---
    {
      id: "soc_01",
      name: "Cinematic Reels & Shorts Multi-Grid Templates",
      category: "social",
      desc: "Dynamic slide clips synced to high tempo beats. Prepopulated in Premiere & CapCut styles.",
      cost: 10,
      tags: ["Reels templates", "TikTok templates", "Instagram packs"],
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=300"
    },

    // --- AI Tools ---
    {
      id: "ai_01",
      name: "AI Smart Skin Retoucher Configuration",
      category: "ai",
      desc: "Intelligent Neural engine parameters designed to batch remove blemishes, retaining skin details.",
      cost: 30,
      tags: ["AI Tools", "Photo editing", "Smart skin"],
      thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=300"
    }
  ];

  const filteredAssets = assetsList.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "wedding") return asset.isWeddingSpecial && matchesSearch;
    return asset.category === activeTab && matchesSearch;
  });

  const handlePurchase = (asset: Asset) => {
    if (unlockedAssetIds.includes(asset.id)) return;
    
    const success = onDeductCredits(asset.cost);
    if (success) {
      onUnlockAsset(asset.id);
    } else {
      alert(`Insufficient Credits! This asset requires ${asset.cost} credits, but you only have ${credits} credits left. Please purchase additional credits.`);
    }
  };

  const handleDownloadSimulation = (id: string) => {
    setDownloadingId(id);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingId(null);
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="relative bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20 font-bold flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Creative Assets Engine
            </span>
            <span className="text-[10px] font-mono text-white/40">Powered by Onboard Creative Cloud Sync</span>
          </div>
          <h1 className="font-sans text-2xl font-light tracking-tight text-white">
            Ready Made Creative Assets
          </h1>
          <p className="text-xs text-white/50 leading-relaxed">
            Acquire premium templates, high-fidelity drone B-rolls, raw wedding invitation files, and luxury gold script typefaces. Unlock any package securely using your active studio credits.
          </p>
        </div>

        {/* Sync Credits State */}
        <div className="bg-[#111] border border-white/10 p-4.5 rounded-xl shrink-0 flex items-center gap-4 w-full md:w-auto">
          <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-white/40 block">Your Credits</span>
            <span className="text-lg font-sans font-extrabold text-white">{credits} CREDITS</span>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH & REELS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets (e.g. gold font, cinematic sound, drone)..."
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition font-mono"
          />
        </div>

        {/* Live count */}
        <div className="text-xs font-mono text-white/40 flex items-center gap-2">
          <span>Found {filteredAssets.length} templates matching criteria</span>
        </div>
      </div>

      {/* CATEGORIES BUTTON RAILS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
        {categories.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* WEDDING HIGHLIGHT BANNER */}
      {activeTab === "all" && !searchQuery && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-950/20 to-neutral-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Premium Traditional Wedding Specialties
            </span>
            <h3 className="font-sans text-base font-semibold text-white">💍 Wedding Business Essentials Portfolio</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              We tailored a specific category for Indian &amp; South Indian wedding cover designs: South Indian mandap arches, gold cinematic LUT overlay, family photo slideshow folders, and traditional dhol orchestral audio stems.
            </p>
            <button
              onClick={() => setActiveTab("wedding")}
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold font-mono flex items-center gap-1.5 transition-all mt-2"
            >
              Examine Wedding Collection <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* MAIN ASSETS GRID */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-[#0A0A0A] border border-white/5 rounded-2xl space-y-3">
          <ShoppingBag className="w-8 h-8 text-white/20 mx-auto" />
          <h4 className="text-xs font-semibold text-white/80">No templates found</h4>
          <p className="text-[11px] text-white/40 max-w-xs mx-auto">Try refining your search keyword or switching category tabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const isUnlocked = unlockedAssetIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className="group bg-[#0A0A0A] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-md"
              >
                {/* Thumbnail Header */}
                <div className="aspect-video w-full relative bg-neutral-900 border-b border-white/10 overflow-hidden">
                  <img
                    src={asset.thumbnail}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    alt={asset.name}
                    referrerPolicy="no-referrer"
                  />
                  {asset.isWeddingSpecial && (
                    <span className="absolute top-2.5 left-2.5 bg-amber-500/90 text-black font-sans font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-400">
                      Wedding Elite
                    </span>
                  )}
                  
                  <span className="absolute top-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white/80 border border-white/15">
                    {categories.find(c => c.id === asset.category)?.name.split(" ")[1] || asset.category.toUpperCase()}
                  </span>
                </div>

                {/* Description Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-sans text-xs font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                      {asset.name}
                    </h4>
                    <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                      {asset.desc}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    {isUnlocked ? (
                      <div className="w-full space-y-2">
                        {downloadingId === asset.id ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" /> Unzipping...
                              </span>
                              <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                              <div style={{ width: `${downloadProgress}%` }} className="h-full bg-emerald-400 transition-all duration-150" />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadSimulation(asset.id)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" /> Download Archive Package
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-white font-mono">{asset.cost} credits</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActivePreviewAsset(asset)}
                            className="p-2 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition"
                            title="Preview Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePurchase(asset)}
                            className="px-4 py-2 bg-white hover:bg-white/90 text-black font-bold text-xs rounded-xl transition font-mono shadow-md"
                          >
                            Unlock Asset
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PREVIEW DETAIL DIALOG MODAL */}
      <AnimatePresence>
        {activePreviewAsset && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider block mb-1">Asset Inspector</span>
                  <h3 className="font-sans text-sm font-semibold text-white">{activePreviewAsset.name}</h3>
                </div>
                <button
                  onClick={() => setActivePreviewAsset(null)}
                  className="text-white/40 hover:text-white text-xs transition"
                >
                  Close Preview
                </button>
              </div>

              {/* Layout detail */}
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 relative">
                <img
                  src={activePreviewAsset.thumbnail}
                  className="w-full h-full object-cover"
                  alt={activePreviewAsset.name}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase block">Product Description</span>
                  <p className="text-xs text-white/70 leading-relaxed">{activePreviewAsset.desc}</p>
                </div>

                <div className="p-4.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <span className="text-[10px] font-mono text-white/40 uppercase block">Licensing &amp; Delivery</span>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono text-white/60">
                    <div>
                      <span className="text-[9px] text-white/30 block">Usage Rights:</span>
                      <span className="text-white">Commercial Royalty-Free</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/30 block">Delivery:</span>
                      <span className="text-white">Instant ZIP Archive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white font-mono">{activePreviewAsset.cost} Studio Credits</span>
                </div>

                <button
                  onClick={() => {
                    handlePurchase(activePreviewAsset);
                    setActivePreviewAsset(null);
                  }}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl transition"
                >
                  Unlock Template Package
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
