/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Unit {
  INCHES = "Inches",
  MM = "Millimeters",
  CM = "Centimeters"
}

export enum PageType {
  SINGLE_PAGE = "Single Page",
  DOUBLE_SPREAD = "Double Spread",
  COVER = "Cover",
  BACK_COVER = "Back Cover",
  INSIDE_COVER = "Inside Cover",
  FULL_SPREAD = "Full Spread"
}

export enum ColorProfile {
  SRGB = "sRGB",
  ADOBE_RGB = "Adobe RGB",
  CMYK_FOGRA39 = "CMYK (FOGRA39)",
  CMYK_SWOP = "CMYK (US Web Coated SWOP)",
  JAPAN_COLOR = "Japan Color"
}

export enum ExportFormat {
  JPG = "High Resolution JPG",
  PNG = "Lossless PNG",
  PDF = "Print Ready PDF",
  TIFF = "Archival TIFF"
}

export enum NumberingStyle {
  ARABIC = "Arabic (1, 2, 3)",
  ROMAN = "Roman (I, II, III)",
  NONE = "Hidden"
}

export interface CustomSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: Unit;
  dpi: number;
  bleed: number;
  safeMargin: number;
  spineWidth: number;
  foldMargin: number;
}

export interface PrintLabPreset {
  id: string;
  name: string;
  brand: string;
  width: number;
  height: number;
  unit: Unit;
  dpi: number;
  bleed: number;
  safeMargin: number;
  colorProfile: ColorProfile;
  format: ExportFormat;
}

export interface ImageMetadata {
  id: string;
  fileName: string;
  url: string; // Blob or Data URL
  folderId: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "landscape" | "portrait" | "square";
  // EXIF
  cameraModel?: string;
  lensModel?: string;
  dateTimeOriginal?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  // AI Metrics
  sharpness: number; // 0-100
  lighting: number; // 0-100
  contrast: number; // 0-100
  blurScore: number; // 0-100 (lower is better/sharper)
  isClosedEyes: boolean;
  smileScore: number; // 0-100
  isDuplicate: boolean;
  facesCount: number;
  faces: FaceMetadata[];
  emotion: string; // Joy, Serene, Tears of Joy, Neutral, etc.
  overallScore: number; // 0-100, calculated by AI Photo Ranker
}

export interface FaceMetadata {
  id: string;
  boundingBox: { x: number; y: number; w: number; h: number }; // Relative 0-1
  personId?: string; // Links to PersonCluster
  confidence: number;
  gender?: "male" | "female" | "unknown";
  age?: number;
}

export interface PersonCluster {
  id: string;
  name: string;
  role: "Bride" | "Groom" | "Father of Bride" | "Mother of Bride" | "Father of Groom" | "Mother of Groom" | "Grandparent" | "VIP Guest" | "Child" | "Friend" | "Other";
  thumbnailUrl: string;
  isCustomNamed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  isSystem: boolean;
  color: string;
}

export interface LayoutTheme {
  id: string;
  name: string;
  bgType: "color" | "texture" | "floral" | "royal" | "traditional";
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowBlur: number;
  spacing: number; // gap between images
  textColor: string;
  fontFamily: string;
}

export interface ImageLayer {
  id: string;
  imageId: string; // References ImageMetadata
  x: number; // percentage (0-100) or absolute pixels (based on parent space)
  y: number;
  w: number;
  h: number;
  rotation: number; // degrees
  opacity: number; // 0-1
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  isHero: boolean;
  cropX: number; // Relative offset x
  cropY: number; // Relative offset y
  cropW: number; // Relative width
  cropH: number; // Relative height
  zIndex: number;
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  alignment: "left" | "center" | "right";
  opacity: number;
  zIndex: number;
}

export interface AlbumSpread {
  id: string;
  pageIndex: number; // 0-indexed
  pageType: PageType;
  title: string;
  backgroundUrl?: string; // custom upload or preset texture
  bgType: "color" | "gradient" | "texture" | "floral" | "royal";
  bgColor: string;
  bgGradient?: string;
  imageLayers: ImageLayer[];
  textLayers: TextLayer[];
  aiPromptLogs?: string[];
}

export interface ExportSettings {
  format: ExportFormat;
  dpi: number;
  colorProfile: ColorProfile;
  bleed: number;
  safeMargin: number;
  includeCropMarks: boolean;
  includePageNumbers: boolean;
  numberingStyle: NumberingStyle;
}

export interface Project {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  designerName: string;
  printCompany: string;
  notes: string;
  albumSize: {
    name: string;
    width: number;
    height: number;
    unit: Unit;
    dpi: number;
    bleed: number;
    safeMargin: number;
    spineWidth: number;
    foldMargin: number;
  };
  sheetsCount: number;
  themeId: string;
  folders: Folder[];
  images: ImageMetadata[];
  people: PersonCluster[];
  spreads: AlbumSpread[];
  createdAt: string;
  updatedAt: string;
  exportSettings: ExportSettings;
}
