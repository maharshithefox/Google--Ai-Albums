/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Unit, PageType, ColorProfile, ExportFormat, NumberingStyle, Folder, ImageMetadata, PersonCluster, AlbumSpread, PrintLabPreset } from "./types";

// Stock images for high-end luxury visual appeal
export const STOCK_IMAGES: ImageMetadata[] = [
  {
    id: "img_bride_1",
    fileName: "Ananya_Bridal_Portraits_01.jpg",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    folderId: "f_bride",
    width: 2000,
    height: 3000,
    aspectRatio: 0.67,
    orientation: "portrait" as const,
    sharpness: 96,
    lighting: 94,
    contrast: 90,
    blurScore: 4,
    isClosedEyes: false,
    smileScore: 88,
    isDuplicate: false,
    facesCount: 1,
    faces: [],
    emotion: "Radiant Joy",
    overallScore: 95,
  },
  {
    id: "img_groom_1",
    fileName: "Rahul_Groom_Prep_05.jpg",
    url: "https://images.unsplash.com/photo-1550005809-91ad75fb3142?auto=format&fit=crop&w=800&q=80",
    folderId: "f_groom",
    width: 2000,
    height: 3000,
    aspectRatio: 0.67,
    orientation: "portrait" as const,
    sharpness: 92,
    lighting: 89,
    contrast: 85,
    blurScore: 6,
    isClosedEyes: false,
    smileScore: 72,
    isDuplicate: false,
    facesCount: 1,
    faces: [],
    emotion: "Sophisticated Calm",
    overallScore: 90,
  },
  {
    id: "img_couple_1",
    fileName: "Palace_Mandapam_Sunset_Hero.jpg",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    folderId: "f_couple",
    width: 3600,
    height: 2400,
    aspectRatio: 1.5,
    orientation: "landscape" as const,
    sharpness: 98,
    lighting: 97,
    contrast: 95,
    blurScore: 2,
    isClosedEyes: false,
    smileScore: 95,
    isDuplicate: false,
    facesCount: 2,
    faces: [],
    emotion: "Pure Romance",
    overallScore: 99,
  },
  {
    id: "img_haldi_1",
    fileName: "Traditional_Haldi_Splashes.jpg",
    url: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=800&q=80",
    folderId: "f_ceremony",
    width: 3000,
    height: 2000,
    aspectRatio: 1.5,
    orientation: "landscape" as const,
    sharpness: 89,
    lighting: 92,
    contrast: 88,
    blurScore: 8,
    isClosedEyes: false,
    smileScore: 98,
    isDuplicate: false,
    facesCount: 4,
    faces: [],
    emotion: "Overwhelming Laughter",
    overallScore: 92,
  },
  {
    id: "img_rings",
    fileName: "Diamond_Rings_Macro_Detail.jpg",
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80",
    folderId: "f_ceremony",
    width: 3000,
    height: 2000,
    aspectRatio: 1.5,
    orientation: "landscape" as const,
    sharpness: 99,
    lighting: 95,
    contrast: 92,
    blurScore: 1,
    isClosedEyes: false,
    smileScore: 0,
    isDuplicate: false,
    facesCount: 0,
    faces: [],
    emotion: "Still Life Elegance",
    overallScore: 96,
  },
  {
    id: "img_reception_1",
    fileName: "Grand_Reception_Decorations.jpg",
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
    folderId: "f_reception",
    width: 3000,
    height: 2000,
    aspectRatio: 1.5,
    orientation: "landscape" as const,
    sharpness: 94,
    lighting: 96,
    contrast: 90,
    blurScore: 3,
    isClosedEyes: false,
    smileScore: 0,
    isDuplicate: false,
    facesCount: 0,
    faces: [],
    emotion: "Majestic Grandeur",
    overallScore: 94,
  },
  {
    id: "img_friends_1",
    fileName: "Bridal_Bridesmaids_Cheer.jpg",
    url: "https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80",
    folderId: "f_friends",
    width: 3000,
    height: 2000,
    aspectRatio: 1.5,
    orientation: "landscape" as const,
    sharpness: 90,
    lighting: 91,
    contrast: 85,
    blurScore: 7,
    isClosedEyes: false,
    smileScore: 96,
    isDuplicate: false,
    facesCount: 6,
    faces: [],
    emotion: "Dynamic Fun",
    overallScore: 91,
  },
  {
    id: "img_couple_walk",
    fileName: "Sunset_Lawn_Hand_In_Hand.jpg",
    url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=800&q=80",
    folderId: "f_couple",
    width: 2000,
    height: 3000,
    aspectRatio: 0.67,
    orientation: "portrait" as const,
    sharpness: 95,
    lighting: 98,
    contrast: 94,
    blurScore: 3,
    isClosedEyes: false,
    smileScore: 82,
    isDuplicate: false,
    facesCount: 2,
    faces: [],
    emotion: "Serene Romance",
    overallScore: 97,
  }
];

// System folders
export const DEFAULT_FOLDERS: Folder[] = [
  { id: "f_bride", name: "Bride Portraits", isSystem: true, color: "#171717" },
  { id: "f_groom", name: "Groom Portraits", isSystem: true, color: "#171717" },
  { id: "f_couple", name: "Couple Portraits", isSystem: true, color: "#D4AF37" },
  { id: "f_ceremony", name: "Ceremony & Mandap", isSystem: true, color: "#171717" },
  { id: "f_reception", name: "Reception", isSystem: true, color: "#171717" },
  { id: "f_friends", name: "Friends & Guests", isSystem: true, color: "#171717" },
  { id: "f_family", name: "Families", isSystem: true, color: "#171717" }
];

// Standard professional album size options
export const BUILTIN_ALBUM_SIZES = [
  // Panorama
  { name: "12 × 36 Panorama", width: 36, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10 },
  { name: "12 × 30 Panorama", width: 30, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10 },
  { name: "10 × 30 Panorama", width: 30, height: 10, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10 },
  { name: "10 × 20 Panorama", width: 20, height: 10, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10 },
  { name: "12 × 24 Panorama", width: 24, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10 },
  // Portrait
  { name: "12 × 18 Portrait", width: 18, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  { name: "10 × 15 Portrait", width: 15, height: 10, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  { name: "8 × 12 Portrait", width: 12, height: 8, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  // Square
  { name: "Square 12 × 12", width: 12, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  { name: "Square 10 × 10", width: 10, height: 10, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  { name: "Square 8 × 8", width: 8, height: 8, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  // Paper
  { name: "A3 Premium", width: 16.5, height: 11.7, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 },
  { name: "A4 Portfolio", width: 11.7, height: 8.3, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5 }
];

// Preconfigured Print Labs
export const PRINT_LABS: PrintLabPreset[] = [
  { id: "lab_1", name: "Premium Album Printing Co.", brand: "Symphony Labs", width: 36, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10, colorProfile: ColorProfile.CMYK_FOGRA39, format: ExportFormat.PDF },
  { id: "lab_2", name: "Millers Professional Imaging", brand: "Millers", width: 12, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5, colorProfile: ColorProfile.SRGB, format: ExportFormat.JPG },
  { id: "lab_3", name: "White House Custom Colour", brand: "WHCC", width: 18, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 5, colorProfile: ColorProfile.ADOBE_RGB, format: ExportFormat.TIFF },
  { id: "lab_4", name: "Tokyo Fine Art Printing", brand: "Tokyo Print", width: 30, height: 12, unit: Unit.INCHES, dpi: 300, bleed: 3, safeMargin: 10, colorProfile: ColorProfile.JAPAN_COLOR, format: ExportFormat.PDF }
];

// Sample Sheets Layout Examples
export interface SampleSheet {
  id: string;
  name: string;
  photosCount: number;
  layoutType: string;
  style: string;
  bgType: "color" | "royal" | "minimal";
  bgColor: string;
  images: { x: number; y: number; w: number; h: number; isHero: boolean; rot?: number }[];
}

export const SAMPLE_SHEETS: SampleSheet[] = [
  {
    id: "sheet_1_hero",
    name: "1-Image Royal Hero Layout",
    photosCount: 1,
    layoutType: "Hero Center",
    style: "Royal Gold Accent",
    bgType: "royal",
    bgColor: "#090909",
    images: [{ x: 25, y: 12, w: 50, h: 76, isHero: true }]
  },
  {
    id: "sheet_2_twin",
    name: "2-Image Classic Twin Spread",
    photosCount: 2,
    layoutType: "Twin Columns",
    style: "Symmetric Minimalist",
    bgType: "minimal",
    bgColor: "#020202",
    images: [
      { x: 8, y: 15, w: 40, h: 70, isHero: true },
      { x: 52, y: 15, w: 40, h: 70, isHero: false }
    ]
  },
  {
    id: "sheet_3_asymmetric",
    name: "3-Image Asymmetric Narrative",
    photosCount: 3,
    layoutType: "Hero Left, Supporting Stack Right",
    style: "Editorial Premium",
    bgType: "color",
    bgColor: "#0F0F0F",
    images: [
      { x: 8, y: 16, w: 46, h: 68, isHero: true },
      { x: 58, y: 16, w: 34, h: 32, isHero: false },
      { x: 58, y: 52, w: 34, h: 32, isHero: false }
    ]
  },
  {
    id: "sheet_4_bento",
    name: "4-Image Bento Grid Layout",
    photosCount: 4,
    layoutType: "Structured Quadrant",
    style: "Modern Architectural",
    bgType: "minimal",
    bgColor: "#020202",
    images: [
      { x: 8, y: 15, w: 41, h: 32, isHero: true },
      { x: 51, y: 15, w: 41, h: 32, isHero: false },
      { x: 8, y: 51, w: 41, h: 32, isHero: false },
      { x: 51, y: 51, w: 41, h: 32, isHero: false }
    ]
  },
  {
    id: "sheet_5_collage",
    name: "5-Image Editorial Collage",
    photosCount: 5,
    layoutType: "Asymmetric Bento",
    style: "Dynamic Narrative",
    bgType: "royal",
    bgColor: "#060606",
    images: [
      { x: 6, y: 15, w: 34, h: 70, isHero: true },
      { x: 43, y: 15, w: 25, h: 33, isHero: false },
      { x: 71, y: 15, w: 23, h: 33, isHero: false },
      { x: 43, y: 52, w: 25, h: 33, isHero: false },
      { x: 71, y: 52, w: 23, h: 33, isHero: false }
    ]
  },
  {
    id: "sheet_whitespace",
    name: "Luxury Generous White Space",
    photosCount: 2,
    layoutType: "Asymmetric Floating",
    style: "Timeless Minimal",
    bgType: "minimal",
    bgColor: "#000000",
    images: [
      { x: 15, y: 22, w: 28, h: 56, isHero: true },
      { x: 55, y: 28, w: 30, h: 44, isHero: false }
    ]
  }
];

// Preconfigured Professional Sample Albums
export interface SampleAlbum {
  id: string;
  title: string;
  subtitle: string;
  category: "Traditional Wedding" | "Regional Celebration" | "Portrait Portfolio" | "Family Milestone";
  size: string;
  theme: string;
  coverUrl: string;
  spreadsCount: number;
}

export const SAMPLE_ALBUMS: SampleAlbum[] = [
  {
    id: "sa_luxury",
    title: "Luxury Palace Royal Wedding",
    subtitle: "Bengaluru Palace Royal Spread",
    category: "Traditional Wedding",
    size: "12 × 36 Panorama",
    theme: "Dark Gold Luxury",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 12
  },
  {
    id: "sa_karnataka",
    title: "Karnataka Traditional Wedding",
    subtitle: "Heritage Vokkaliga & Lingayat Rites",
    category: "Regional Celebration",
    size: "12 × 30 Panorama",
    theme: "Temple Vermilion & Cream",
    coverUrl: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 15
  },
  {
    id: "sa_mysore",
    title: "Mysore Palace Heritage Style",
    subtitle: "Pure Silk & Gold Brocade Rites",
    category: "Regional Celebration",
    size: "12 × 36 Panorama",
    theme: "Royal Indigo & Sandalwood",
    coverUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 10
  },
  {
    id: "sa_coorg",
    title: "Kodava (Coorg) Wedding Portrait",
    subtitle: "Timeless Traditional Coorgi Drapes",
    category: "Regional Celebration",
    size: "10 × 30 Panorama",
    theme: "Forest Velvet Green & Gold",
    coverUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 8
  },
  {
    id: "sa_christian",
    title: "Christian Minimalist White Romance",
    subtitle: "Clean Lines & Monochromatic Spreads",
    category: "Traditional Wedding",
    size: "Square 12 × 12",
    theme: "Ivory & Charcoal Black",
    coverUrl: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 14
  },
  {
    id: "sa_baby",
    title: "Baby's First Solstice Book",
    subtitle: "Whimsical Milestones & Playful Frames",
    category: "Family Milestone",
    size: "Square 10 × 10",
    theme: "Soft Pastel Slate",
    coverUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=400&q=80",
    spreadsCount: 6
  }
];

// Tutorial Metadata list
export interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  category: "Getting Started" | "Designing" | "AI Tools" | "Exporting";
  desc: string;
  youtubeId?: string;
  steps: string[];
}

export const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: "tut_1",
    title: "First Steps: Creating Projects & Folders",
    duration: "2:45 mins",
    category: "Getting Started",
    desc: "Learn how to establish custom album sizes, define margins, and organize your source wedding folders.",
    steps: [
      "Click 'Create Project' on the main dashboard",
      "Set your client bride & groom names, custom size and bleed settings",
      "Drag and drop photo directories into designated system folders"
    ]
  },
  {
    id: "tut_2",
    title: "Smart AI Layout Auto-Generation",
    duration: "4:15 mins",
    category: "AI Tools",
    desc: "Harness the power of our localized scoring and storytelling engine to generate 15+ pages instantly.",
    steps: [
      "Select your favorite photos from your newly imported folders",
      "Click 'AI Auto Layout' in the editor panel",
      "Watch the layout engine select high-scoring hero images, align aspects, and balance whitespace."
    ]
  },
  {
    id: "tut_3",
    title: "Direct Interactive Canvas Editing",
    duration: "5:30 mins",
    category: "Designing",
    desc: "Master Canva-like layout tools: manual cropping, resizing, layering order, custom margins, and snapping.",
    steps: [
      "Double click any photo on the canvas to crop/pan (face-safe centering)",
      "Hold Shift to maintain proportional scaling while dragging borders",
      "Adjust border widths, drop gold shadows, and position custom luxury font captions."
    ]
  },
  {
    id: "tut_4",
    title: "Exporting High-Res PDF/CMYK Files",
    duration: "3:10 mins",
    category: "Exporting",
    desc: "Configuring print presets for WHCC, Millers, or custom print companies with automatic bleed marks.",
    steps: [
      "Select your print company profile from our built-in Lab list",
      "Configure DPI output (300 vs 600) and CMYK/FOGRA39 color profiles",
      "Hit 'Generate Print Ready Files' to bundle JPGs or multipage PDFs with exact crop guides."
    ]
  }
];
