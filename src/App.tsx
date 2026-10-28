import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  BookOpen,
  Settings,
  Award,
  ShoppingBag,
  Hammer,
  ArrowUpCircle,
  Map as MapIcon,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Recycle,
  Leaf,
  ChevronRight,
  X,
  HelpCircle,
  Sun,
  AlertCircle,
  MousePointer,
  Move
} from 'lucide-react';

// Polyfill Canvas roundRect for older browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | number[]
  ) {
    let r = 0;
    if (typeof radii === 'number') {
      r = radii;
    } else if (Array.isArray(radii) && radii.length > 0) {
      r = radii[0];
    }
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ==========================================
// 1. BRAND GUIDELINES & CONSTANTS
// ==========================================
const BRAND = {
  darkGreen: '#163824',
  leafGreen: '#5A9A3B',
  limeGreen: '#8CC63F',
  yellow: '#FBC02D',
  orange: '#F59E0B',
  brown: '#8D5B34',
  cream: '#F7F4EB',
};

type WasteCategory = 'organik' | 'anorganik';
type SubBinType = 'organik' | 'plastik' | 'kertas' | 'logam';

interface WasteCatalogItem {
  id: string;
  name: string;
  category: WasteCategory;
  subBin: SubBinType;
  icon: string;
  color: string;
  decomposeTime: string;
  eduFact: string;
  pointsOnCollect: number;
  pointsOnSort: number;
}

interface RecipeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  ingredients: {
    organik?: number;
    plastik?: number;
    kertas?: number;
    logam?: number;
  };
  sellPrice: number;
  craftPoints: number;
  eduBenefit: string;
}

interface WorldTrash {
  uid: string;
  itemId: string;
  x: number;
  y: number;
  areaId: number;
  bobOffset: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface UpgradeState {
  sackLevel: number;
  broomLevel: number;
  bootsLevel: number;
  machineLevel: number;
}

interface SortedMaterials {
  organik: number;
  plastik: number;
  kertas: number;
  logam: number;
}

// ==========================================
// 2. GDD DATA: WASTE ITEMS, RECIPES, BADGES
// ==========================================
const WASTE_DATABASE: Record<string, WasteCatalogItem> = {
  daun_kering: {
    id: 'daun_kering',
    name: 'Daun & Ranting Kering',
    category: 'organik',
    subBin: 'organik',
    icon: '🍂',
    color: '#65A30D',
    decomposeTime: '1 - 3 Bulan',
    eduFact: 'Daun kering kaya akan unsur karbon (C) yang sangat baik sebagai bahan dasar pupuk kompos organik.',
    pointsOnCollect: 5,
    pointsOnSort: 10,
  },
  sisa_buah: {
    id: 'sisa_buah',
    name: 'Kulit Pisang & Sisa Buah',
    category: 'organik',
    subBin: 'organik',
    icon: '🍌',
    color: '#84CC16',
    decomposeTime: '2 - 5 Minggu',
    eduFact: 'Sampah sisa buah dan sayur merupakan sampah organik basah yang mempercepat proses fermentasi kompos.',
    pointsOnCollect: 5,
    pointsOnSort: 10,
  },
  botol_plastik: {
    id: 'botol_plastik',
    name: 'Botol Plastik Bekas',
    category: 'anorganik',
    subBin: 'plastik',
    icon: '🧴',
    color: '#3B82F6',
    decomposeTime: '450 Tahun',
    eduFact: 'Botol plastik PET sangat sulit terurai di alam, namun 100% dapat didaur ulang menjadi pot tanaman, serat tekstil, atau eco-brick.',
    pointsOnCollect: 6,
    pointsOnSort: 12,
  },
  kertas_kardus: {
    id: 'kertas_kardus',
    name: 'Sampah Kertas & Kardus',
    category: 'anorganik',
    subBin: 'kertas',
    icon: '📦',
    color: '#EAB308',
    decomposeTime: '2 - 6 Bulan',
    eduFact: 'Mendaur ulang 1 ton kertas dapat menyelamatkan hingga 17 pohon dewasa dan menghemat ribuan liter air.',
    pointsOnCollect: 6,
    pointsOnSort: 12,
  },
  kaleng_logam: {
    id: 'kaleng_logam',
    name: 'Kaleng Logam Bekas',
    category: 'anorganik',
    subBin: 'logam',
    icon: '🥫',
    color: '#EF4444',
    decomposeTime: '80 - 200 Tahun',
    eduFact: 'Aluminium dan kaleng logam dapat dilebur dan didaur ulang berulang kali tanpa mengurangi kekuatannya.',
    pointsOnCollect: 8,
    pointsOnSort: 15,
  },
};

const CRAFTING_RECIPES: RecipeItem[] = [
  {
    id: 'pupuk_kompos',
    name: 'Pupuk Kompos Subur',
    description: 'Pupuk alami kaya nutrisi hasil fermentasi sampah daun dan sisa buah organik.',
    icon: '🌱',
    ingredients: { organik: 3 },
    sellPrice: 45,
    craftPoints: 25,
    eduBenefit: 'Mengembalikan kesuburan tanah di Kebun Kompos tanpa bahan kimia sintetis.',
  },
  {
    id: 'pot_tanaman',
    name: 'Pot Tanaman Eco-Plastik',
    description: 'Pot tanaman cantik dan tahan lama dari olahan botol plastik beserta media kompos.',
    icon: '🪴',
    ingredients: { plastik: 2, organik: 1 },
    sellPrice: 70,
    craftPoints: 35,
    eduBenefit: 'Mengurangi limbah botol plastik di sungai sekaligus menghijaukan pekarangan rumah.',
  },
  {
    id: 'tas_daur_ulang',
    name: 'Tas Belanja Eco-Craft',
    description: 'Tas serbaguna ramah lingkungan dari serat plastik daur ulang dan penguat karton.',
    icon: '👜',
    ingredients: { plastik: 2, kertas: 2 },
    sellPrice: 95,
    craftPoints: 50,
    eduBenefit: 'Menggantikan ratusan kantong plastik sekali pakai saat berbelanja.',
  },
  {
    id: 'lampu_hias',
    name: 'Lentera Hias Daur Ulang',
    description: 'Kerajinan lampu meja artistik berbahan kaleng logam dan kap botol plastik.',
    icon: '🏮',
    ingredients: { logam: 2, plastik: 1 },
    sellPrice: 125,
    craftPoints: 65,
    eduBenefit: 'Mengubah limbah keras anorganik menjadi dekorasi bernilai ekonomi tinggi.',
  },
  {
    id: 'bangku_ecobrick',
    name: 'Bangku Taman Eco-Brick',
    description: 'Furnitur taman kokoh dari padatan botol plastik, rangka kaleng, dan lapisan karton.',
    icon: '🪑',
    ingredients: { plastik: 3, logam: 2, kertas: 2 },
    sellPrice: 220,
    craftPoints: 110,
    eduBenefit: 'Menyerap banyak sampah anorganik sekaligus menjadi fasilitas ruang publik.',
  },
];

const BADGE_TIERS = [
  { level: 1, title: 'Pemula Peduli', minPoints: 0, icon: '🌱', color: '#84CC16' },
  { level: 2, title: 'Perintis Hijau', minPoints: 100, icon: '🌿', color: '#22C55E' },
  { level: 3, title: 'Penjaga Lingkungan', minPoints: 250, icon: '🌳', color: '#10B981' },
  { level: 4, title: 'Ahli Daur Ulang', minPoints: 500, icon: '♻️', color: '#F59E0B' },
  { level: 5, title: 'Pahlawan Bumi Cycle Craft', minPoints: 900, icon: '👑', color: '#EAB308' },
];

const AREAS_CONFIG = [
  {
    id: 1,
    name: 'Area 1: Jalan & Pusat Desa',
    description: 'Pusat aktivitas pengolahan sampah, Toko, dan jalanan sekitar desa.',
    targetSorted: 0,
    nextTarget: 8,
    bounds: { x: 0, y: 0, w: 1250, h: 900 },
  },
  {
    id: 2,
    name: 'Area 2: Taman Kota Asri',
    description: 'Area taman terbuka hijau yang banyak dikotori sampah pengunjung.',
    targetSorted: 8,
    nextTarget: 18,
    bounds: { x: 1250, y: 0, w: 750, h: 900 },
  },
  {
    id: 3,
    name: 'Area 3: Tepi Sungai Jernih',
    description: 'Bantaran sungai dan jembatan kayu tempat sampah plastik & kaleng sering menumpuk.',
    targetSorted: 18,
    nextTarget: 30,
    bounds: { x: 0, y: 900, w: 2000, h: 500 },
  },
];

// World Interactive Stations (Matches Eco Village Recycling Hub layout)
const STATIONS = {
  sorting: {
    id: 'sorting',
    name: 'Tempat Pemilahan Sampah',
    subtitle: 'Pilah Organik & Anorganik',
    x: 430,
    y: 350,
    w: 220,
    h: 95,
    interactRadius: 150,
  },
  crafting: {
    id: 'crafting',
    name: 'Workshop & Pusat Daur Ulang',
    subtitle: 'Olah Sampah Jadi Produk',
    x: 920,
    y: 230,
    w: 220,
    h: 130,
    interactRadius: 155,
  },
  shop: {
    id: 'shop',
    name: 'Toko Daur Ulang',
    subtitle: 'Jual Produk & Dapatkan Koin',
    x: 980,
    y: 470,
    w: 170,
    h: 120,
    interactRadius: 145,
  },
  upgrade: {
    id: 'upgrade',
    name: 'Kebun Kompos & Pos Upgrade',
    subtitle: 'Tingkatkan Alat Anto',
    x: 490,
    y: 670,
    w: 190,
    h: 115,
    interactRadius: 145,
  },
};

// Solid Colliders (Buildings & River water except bridges)
const SOLID_COLLIDERS = [
  // Pusat Daur Ulang Building roof/body
  { x: 250, y: 170, w: 380, h: 175 },
  // Workshop Building body
  { x: 880, y: 140, w: 270, h: 165 },
  // Toko Building body
  { x: 955, y: 410, w: 195, h: 130 },
  // Kebun Kompos fenced bed
  { x: 455, y: 645, w: 225, h: 115 },
];

// ==========================================
// 3. WEB AUDIO SYNTHESIZER (NO EXTERNAL ASSETS NEEDED)
// ==========================================
class SoundEffects {
  ctx: AudioContext | null = null;
  enabled: boolean = true;
  volume: number = 0.4;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  play(type: 'pickup' | 'sweep' | 'sort_ok' | 'sort_err' | 'craft' | 'coin' | 'unlock' | 'click') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const v = this.volume;

      if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
        gain.gain.setValueAtTime(v * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'sweep') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(v * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'sort_ok') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(v * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'sort_err') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.12);
        gain.gain.setValueAtTime(v * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'craft') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(v * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(v * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'unlock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(392, now);
        osc.frequency.setValueAtTime(523.25, now + 0.12);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        osc.frequency.setValueAtTime(783.99, now + 0.36);
        gain.gain.setValueAtTime(v * 0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(v * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {
      // Ignore audio errors on restricted browsers
    }
  }
}

const sfx = new SoundEffects();

// ==========================================
// 4. BRAND SVG LOGO & ANTO AVATAR COMPONENTS
// ==========================================
export const CycleCraftLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; showTagline?: boolean }> = ({
  size = 'lg',
  showTagline = true,
}) => {
  const scale = size === 'lg' ? 1 : size === 'md' ? 0.68 : 0.42;
  return (
    <div className="flex flex-col items-center select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
      <svg width="460" height="210" viewBox="0 0 460 210" className="drop-shadow-[0_8px_16px_rgba(22,56,36,0.45)]">
        <defs>
          <linearGradient id="cycleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="55%" stopColor="#8CC63F" />
            <stop offset="100%" stopColor="#5A9A3B" />
          </linearGradient>
          <linearGradient id="craftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Decorative Left Leaves */}
        <g transform="translate(28, 70) rotate(-25)">
          <path d="M0,30 C15,0 55,0 70,30 C55,60 15,60 0,30 Z" fill="#5A9A3B" stroke="#163824" strokeWidth="8" />
          <path d="M12,30 Q35,28 58,30" stroke="#163824" strokeWidth="4" fill="none" />
        </g>
        <g transform="translate(20, 112) rotate(-5)">
          <path d="M0,25 C15,0 50,0 65,25 C50,50 15,50 0,25 Z" fill="#8CC63F" stroke="#163824" strokeWidth="8" />
          <path d="M10,25 Q32,23 52,25" stroke="#163824" strokeWidth="4" fill="none" />
        </g>

        {/* Decorative Right Leaves */}
        <g transform="translate(365, 58) rotate(25)">
          <path d="M0,28 C15,0 55,0 70,28 C55,56 15,56 0,28 Z" fill="#8CC63F" stroke="#163824" strokeWidth="8" />
          <path d="M12,28 Q35,26 58,28" stroke="#163824" strokeWidth="4" fill="none" />
        </g>
        <g transform="translate(372, 105) rotate(8)">
          <path d="M0,24 C15,0 48,0 62,24 C48,48 15,48 0,24 Z" fill="#5A9A3B" stroke="#163824" strokeWidth="8" />
        </g>

        {/* Thick Dark Green Backdrop Outline for "Cycle" */}
        <text
          x="230"
          y="95"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Nunito', 'Rounded Mplus 1c', sans-serif"
          fontWeight="900"
          fontSize="86"
          letterSpacing="1"
          stroke="#163824"
          strokeWidth="24"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="#163824"
        >
          Cycle
        </text>
        {/* Main Fill for "Cycle" */}
        <text
          x="230"
          y="95"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Nunito', 'Rounded Mplus 1c', sans-serif"
          fontWeight="900"
          fontSize="86"
          letterSpacing="1"
          fill="url(#cycleGrad)"
        >
          Cycle
        </text>

        {/* Thick Dark Green Backdrop Outline for "Craft" */}
        <text
          x="235"
          y="172"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Nunito', 'Rounded Mplus 1c', sans-serif"
          fontWeight="900"
          fontSize="88"
          letterSpacing="1"
          stroke="#163824"
          strokeWidth="24"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="#163824"
        >
          Craft
        </text>
        {/* Main Fill for "Craft" */}
        <text
          x="235"
          y="172"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Nunito', 'Rounded Mplus 1c', sans-serif"
          fontWeight="900"
          fontSize="88"
          letterSpacing="1"
          fill="url(#craftGrad)"
        >
          Craft
        </text>

        {/* Recycling Emblem inside the "C" of Craft */}
        <g transform="translate(106, 134) scale(0.75)">
          <circle cx="20" cy="20" r="16" fill="#163824" />
          <text x="20" y="28" textAnchor="middle" fontSize="24" fill="#FFFFFF">
            ♻
          </text>
        </g>
      </svg>

      {showTagline && (
        <div
          className="mt-1 px-5 py-1.5 rounded-full font-extrabold text-sm md:text-base tracking-wide shadow-md border-2"
          style={{
            backgroundColor: BRAND.cream,
            color: BRAND.darkGreen,
            borderColor: BRAND.darkGreen,
          }}
        >
          — Dari Sampah, Jadi Manfaat —
        </div>
      )}
    </div>
  );
};

// Character Portrait SVG matching Anto in GDD
export const AntoPortrait: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" className="rounded-full bg-[#DCECCB] border-2 border-[#163824] shrink-0">
    {/* Background circle */}
    <circle cx="40" cy="40" r="38" fill="#B5E292" />
    {/* Shoulders / Olive Worker Shirt with yellow reflective stripe */}
    <path d="M14,78 C16,58 64,58 66,78 Z" fill="#5C6B3C" stroke="#163824" strokeWidth="3" />
    <path d="M20,70 L60,70" stroke="#FDE047" strokeWidth="4" />
    {/* Neck & Face */}
    <rect x="33" y="48" width="14" height="12" rx="4" fill="#F3C19D" />
    <circle cx="40" cy="38" r="17" fill="#FAD2B8" stroke="#163824" strokeWidth="2.5" />
    {/* Dark Brown Hair */}
    <path d="M22,34 C22,22 58,22 58,34 C54,28 45,28 40,31 C34,27 26,29 22,34 Z" fill="#3E2723" />
    {/* Big cheerful eyes & smile */}
    <circle cx="33" cy="39" r="3" fill="#163824" />
    <circle cx="47" cy="39" r="3" fill="#163824" />
    <circle cx="34" cy="38" r="1" fill="#FFFFFF" />
    <circle cx="48" cy="38" r="1" fill="#FFFFFF" />
    <path d="M35,46 Q40,51 45,46" stroke="#163824" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Olive Worker Cap with Recycle Logo */}
    <path d="M21,29 C22,13 58,13 59,29 Z" fill="#6E7D47" stroke="#163824" strokeWidth="2.5" />
    <path d="M28,17 C35,14 45,14 50,17 L50,27 L28,27 Z" fill="#F3E5AB" opacity="0.9" />
    <path d="M19,28 Q40,23 64,29 Q52,33 19,28 Z" fill="#526032" stroke="#163824" strokeWidth="2.5" />
    <text x="39" y="25" textAnchor="middle" fontSize="9" fill="#163824" fontWeight="bold">
      ♻
    </text>
  </svg>
);

// ==========================================
// 5. MAIN APPLICATION COMPONENT
// ==========================================
export function App() {
  // Navigation Screen State
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [activeModal, setActiveModal] = useState<
    null | 'sorting' | 'crafting' | 'shop' | 'upgrade' | 'catalog' | 'map' | 'settings' | 'controls' | 'summary'
  >(null);

  // Player Profile & Persistent Game State
  const [playerName, setPlayerName] = useState<string>('Anto');
  const [points, setPoints] = useState<number>(0);
  const [coins, setCoins] = useState<number>(50);
  const [rawBag, setRawBag] = useState<string[]>([]); // Array of waste item IDs currently in Anto's sack
  const [sortedMat, setSortedMat] = useState<SortedMaterials>({
    organik: 2,
    plastik: 1,
    kertas: 1,
    logam: 0,
  });
  const [craftedInventory, setCraftedInventory] = useState<Record<string, number>>({});
  const [discoveredWaste, setDiscoveredWaste] = useState<string[]>(['daun_kering', 'botol_plastik']);
  const [discoveredProducts, setDiscoveredProducts] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeState>({
    sackLevel: 1,
    broomLevel: 1,
    bootsLevel: 1,
    machineLevel: 1,
  });
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalSorted: 0,
    totalCrafted: 0,
    totalSold: 0,
    organicCollected: 0,
    plasticCollected: 0,
  });

  // Audio Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);

  // Notification Toast & Educational Banner
  const [toast, setToast] = useState<{ text: string; subtext?: string; type: 'success' | 'info' | 'warn' } | null>(null);
  const [sortingFeedback, setSortingFeedback] = useState<{
    correct: boolean;
    title: string;
    detail: string;
  } | null>(null);
  const [draggedBagIndex, setDraggedBagIndex] = useState<number | null>(null);
  const [selectedBagIndex, setSelectedBagIndex] = useState<number | null>(0);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);

  // Real-time World & Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef({
    x: 640,
    y: 470,
    dir: 'down' as 'up' | 'down' | 'left' | 'right',
    isMoving: false,
    walkFrame: 0,
    sweepTimer: 0,
    targetX: null as number | null,
    targetY: null as number | null,
  });
  const keysRef = useRef<Record<string, boolean>>({});
  const worldTrashRef = useRef<WorldTrash[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nearbyPromptRef = useRef<{
    type: 'trash' | 'station';
    id: string;
    label: string;
    sublabel: string;
    x: number;
    y: number;
  } | null>(null);
  const [nearbyUI, setNearbyUI] = useState<{
    type: 'trash' | 'station';
    id: string;
    label: string;
    sublabel: string;
  } | null>(null);

  // Derived gameplay calculations
  const maxSackCapacity = 6 + upgrades.sackLevel * 4; // Lv1: 10, Lv2: 14, Lv3: 18, Lv4: 22
  const pickupRadius = 58 + (upgrades.broomLevel - 1) * 18;
  const moveSpeed = 3.3 + (upgrades.bootsLevel - 1) * 0.65;
  const sellBonusMultiplier = 1 + (upgrades.machineLevel - 1) * 0.25;

  const unlockedAreaLevel = stats.totalSorted >= 18 ? 3 : stats.totalSorted >= 8 ? 2 : 1;

  const currentBadge =
    [...BADGE_TIERS].reverse().find((b) => points >= b.minPoints) || BADGE_TIERS[0];
  const nextBadge =
    BADGE_TIERS.find((b) => b.minPoints > points) || BADGE_TIERS[BADGE_TIERS.length - 1];

  // Show helper toast
  const triggerToast = useCallback((text: string, subtext?: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ text, subtext, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(t);
  }, [toast]);

  // Add Floating Canvas Text
  const addFloatingText = useCallback((x: number, y: number, text: string, color = '#FDE047') => {
    floatingTextsRef.current.push({
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  }, []);

  // ==========================================
  // 6. SAVE & LOAD SYSTEM (LOCAL STORAGE)
  // ==========================================
  const SAVE_KEY = 'cycle_craft_prototype_save_v1';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        setHasSaveData(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveGameToStorage = useCallback(() => {
    try {
      const payload = {
        playerName,
        points,
        coins,
        rawBag,
        sortedMat,
        craftedInventory,
        discoveredWaste,
        discoveredProducts,
        upgrades,
        stats,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      setHasSaveData(true);
    } catch {
      // Ignore quota errors
    }
  }, [
    playerName,
    points,
    coins,
    rawBag,
    sortedMat,
    craftedInventory,
    discoveredWaste,
    discoveredProducts,
    upgrades,
    stats,
  ]);

  // Auto-save whenever state updates during gameplay
  useEffect(() => {
    if (screen === 'game') {
      saveGameToStorage();
    }
  }, [screen, points, coins, rawBag, sortedMat, craftedInventory, upgrades, stats, saveGameToStorage]);

  const loadGameFromStorage = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.playerName) setPlayerName(data.playerName);
        if (typeof data.points === 'number') setPoints(data.points);
        if (typeof data.coins === 'number') setCoins(data.coins);
        if (Array.isArray(data.rawBag)) setRawBag(data.rawBag);
        if (data.sortedMat) setSortedMat(data.sortedMat);
        if (data.craftedInventory) setCraftedInventory(data.craftedInventory);
        if (Array.isArray(data.discoveredWaste)) setDiscoveredWaste(data.discoveredWaste);
        if (Array.isArray(data.discoveredProducts)) setDiscoveredProducts(data.discoveredProducts);
        if (data.upgrades) setUpgrades(data.upgrades);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // Ignore parse errors
    }
  };

  // Spawn initial trash across the 3 areas
  const spawnInitialTrash = useCallback(() => {
    const items: WorldTrash[] = [];
    const area1Pool = ['daun_kering', 'sisa_buah', 'botol_plastik', 'kertas_kardus'];
    const area2Pool = ['daun_kering', 'sisa_buah', 'botol_plastik', 'kertas_kardus', 'kaleng_logam'];
    const area3Pool = ['botol_plastik', 'kaleng_logam', 'kertas_kardus', 'sisa_buah'];

    // Area 1 safe spawn positions around village paths
    const area1Coords = [
      { x: 310, y: 500 },
      { x: 560, y: 470 },
      { x: 750, y: 360 },
      { x: 820, y: 550 },
      { x: 660, y: 260 },
      { x: 360, y: 610 },
      { x: 780, y: 690 },
      { x: 590, y: 560 },
      { x: 870, y: 390 },
      { x: 430, y: 520 },
    ];
    area1Coords.forEach((pt, idx) => {
      items.push({
        uid: `a1-${idx}-${Date.now()}`,
        itemId: area1Pool[idx % area1Pool.length],
        x: pt.x,
        y: pt.y,
        areaId: 1,
        bobOffset: Math.random() * Math.PI * 2,
      });
    });

    // Area 2 (Taman Kota - East)
    for (let i = 0; i < 12; i++) {
      items.push({
        uid: `a2-${i}-${Date.now()}`,
        itemId: area2Pool[i % area2Pool.length],
        x: 1330 + (i % 4) * 145 + Math.random() * 35,
        y: 180 + Math.floor(i / 4) * 230 + Math.random() * 40,
        areaId: 2,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }

    // Area 3 (Tepi Sungai - South)
    for (let i = 0; i < 12; i++) {
      items.push({
        uid: `a3-${i}-${Date.now()}`,
        itemId: area3Pool[i % area3Pool.length],
        x: 240 + i * 135 + Math.random() * 25,
        y: 980 + (i % 2) * 165 + Math.random() * 30,
        areaId: 3,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }

    worldTrashRef.current = items;
  }, []);

  useEffect(() => {
    spawnInitialTrash();
  }, [spawnInitialTrash]);

  // Periodic respawn of trash so the world stays alive
  useEffect(() => {
    if (screen !== 'game') return;
    const interval = setInterval(() => {
      const current = worldTrashRef.current;
      const area1Count = current.filter((t) => t.areaId === 1).length;
      if (area1Count < 6) {
        const pool = ['daun_kering', 'sisa_buah', 'botol_plastik', 'kertas_kardus', 'kaleng_logam'];
        const itemId = pool[Math.floor(Math.random() * pool.length)];
        worldTrashRef.current.push({
          uid: `respawn-a1-${Date.now()}`,
          itemId,
          x: 340 + Math.random() * 520,
          y: 360 + Math.random() * 260,
          areaId: 1,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
      if (unlockedAreaLevel >= 2 && current.filter((t) => t.areaId === 2).length < 7) {
        const pool = ['daun_kering', 'sisa_buah', 'botol_plastik', 'kertas_kardus', 'kaleng_logam'];
        worldTrashRef.current.push({
          uid: `respawn-a2-${Date.now()}`,
          itemId: pool[Math.floor(Math.random() * pool.length)],
          x: 1320 + Math.random() * 520,
          y: 180 + Math.random() * 580,
          areaId: 2,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
      if (unlockedAreaLevel >= 3 && current.filter((t) => t.areaId === 3).length < 7) {
        const pool = ['botol_plastik', 'kaleng_logam', 'kertas_kardus', 'sisa_buah'];
        worldTrashRef.current.push({
          uid: `respawn-a3-${Date.now()}`,
          itemId: pool[Math.floor(Math.random() * pool.length)],
          x: 260 + Math.random() * 1450,
          y: 970 + Math.random() * 280,
          areaId: 3,
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [screen, unlockedAreaLevel]);

  // ==========================================
  // 7. CORE GAMEPLAY ACTIONS (COLLECT, SORT, CRAFT, SELL, UPGRADE)
  // ==========================================
  const collectTrashInstance = useCallback(
    (trashUid: string) => {
      if (rawBag.length >= maxSackCapacity) {
        sfx.play('sort_err');
        triggerToast(
          'Karung Sampah Penuh!',
          'Pilah sampah di Tempat Pemilahan atau tingkatkan kapasitas Karung di Pos Upgrade.',
          'warn'
        );
        return;
      }

      const idx = worldTrashRef.current.findIndex((t) => t.uid === trashUid);
      if (idx === -1) return;

      const target = worldTrashRef.current[idx];
      const meta = WASTE_DATABASE[target.itemId];
      if (!meta) return;

      // Remove from world
      worldTrashRef.current.splice(idx, 1);

      // Animate Anto's Sapu Lidi sweep
      playerRef.current.sweepTimer = 18;
      sfx.play('sweep');
      setTimeout(() => sfx.play('pickup'), 60);

      // Update inventory, points, catalog & stats
      setRawBag((prev) => [...prev, target.itemId]);
      setPoints((prev) => prev + meta.pointsOnCollect);
      setDiscoveredWaste((prev) => (prev.includes(target.itemId) ? prev : [...prev, target.itemId]));
      setStats((prev) => ({
        ...prev,
        totalCollected: prev.totalCollected + 1,
        organicCollected: meta.category === 'organik' ? prev.organicCollected + 1 : prev.organicCollected,
        plasticCollected: meta.subBin === 'plastik' ? prev.plasticCollected + 1 : prev.plasticCollected,
      }));

      addFloatingText(target.x, target.y - 15, `${meta.icon} +1 ${meta.name} (+${meta.pointsOnCollect} Poin)`, '#A3E635');
    },
    [rawBag.length, maxSackCapacity, addFloatingText, triggerToast]
  );

  // Sorting Trash Action
  const handleSortWasteItem = (bagIndex: number, targetCategory: WasteCategory, targetSubBin?: SubBinType) => {
    const itemId = rawBag[bagIndex];
    if (!itemId) return;
    const meta = WASTE_DATABASE[itemId];
    if (!meta) return;

    const isCategoryMatch = meta.category === targetCategory;
    const isSubBinMatch = targetSubBin ? meta.subBin === targetSubBin : true;

    if (isCategoryMatch && isSubBinMatch) {
      sfx.play('sort_ok');
      const prevSortedTotal = stats.totalSorted;
      const newSortedTotal = prevSortedTotal + 1;

      // Remove from rawBag
      setRawBag((prev) => prev.filter((_, i) => i !== bagIndex));
      setSelectedBagIndex(0);

      // Add to sorted materials for crafting
      setSortedMat((prev) => ({
        ...prev,
        [meta.subBin]: prev[meta.subBin] + 1,
      }));

      setPoints((prev) => prev + meta.pointsOnSort);
      setStats((prev) => ({
        ...prev,
        totalSorted: prev.totalSorted + 1,
      }));

      setSortingFeedback({
        correct: true,
        title: `Tepat Sekali! +${meta.pointsOnSort} Poin`,
        detail: `${meta.icon} ${meta.name} adalah sampah ${meta.category.toUpperCase()}. ${meta.eduFact}`,
      });

      // Check if new area unlocked!
      if ((prevSortedTotal < 8 && newSortedTotal >= 8) || (prevSortedTotal < 18 && newSortedTotal >= 18)) {
        setTimeout(() => {
          sfx.play('unlock');
          triggerToast(
            newSortedTotal >= 18 ? '🎉 Area 3: Tepi Sungai Terbuka!' : '🎉 Area 2: Taman Kota Terbuka!',
            'Target pemilahan sampah tercapai! Jelajahi area baru di peta.',
            'success'
          );
        }, 300);
      }
    } else {
      sfx.play('sort_err');
      setSortingFeedback({
        correct: false,
        title: 'Kurang Tepat! Coba Lagi Yuk',
        detail: `${meta.icon} ${meta.name} termasuk kategori ${meta.category.toUpperCase()} (Tong ${meta.subBin.toUpperCase()}). Waktu urai: ${meta.decomposeTime}.`,
      });
    }
  };

  const handleCraftProduct = (recipe: RecipeItem) => {
    const req = recipe.ingredients;
    if (
      (req.organik && sortedMat.organik < req.organik) ||
      (req.plastik && sortedMat.plastik < req.plastik) ||
      (req.kertas && sortedMat.kertas < req.kertas) ||
      (req.logam && sortedMat.logam < req.logam)
    ) {
      sfx.play('sort_err');
      triggerToast('Bahan Terpilah Belum Cukup!', 'Kumpulkan dan pilah lebih banyak sampah terlebih dahulu.', 'warn');
      return;
    }

    sfx.play('craft');
    setSortedMat((prev) => ({
      organik: prev.organik - (req.organik || 0),
      plastik: prev.plastik - (req.plastik || 0),
      kertas: prev.kertas - (req.kertas || 0),
      logam: prev.logam - (req.logam || 0),
    }));

    const earnedPoints = Math.round(recipe.craftPoints * sellBonusMultiplier);
    setCraftedInventory((prev) => ({
      ...prev,
      [recipe.id]: (prev[recipe.id] || 0) + 1,
    }));
    setPoints((prev) => prev + earnedPoints);
    setDiscoveredProducts((prev) => (prev.includes(recipe.id) ? prev : [...prev, recipe.id]));
    setStats((prev) => ({
      ...prev,
      totalCrafted: prev.totalCrafted + 1,
    }));

    addFloatingText(
      playerRef.current.x,
      playerRef.current.y - 30,
      `${recipe.icon} Berhasil Dibuat! (+${earnedPoints} Poin)`,
      '#FDE047'
    );
    triggerToast(
      `Berhasil Membuat ${recipe.name}!`,
      `+${earnedPoints} Poin. Produk tersimpan di tas dan tercatat di Katalog Koleksi.`,
      'success'
    );
  };

  const handleSellProduct = (recipe: RecipeItem) => {
    const count = craftedInventory[recipe.id] || 0;
    if (count <= 0) return;

    const finalPrice = Math.round(recipe.sellPrice * sellBonusMultiplier);
    sfx.play('coin');
    setCraftedInventory((prev) => ({
      ...prev,
      [recipe.id]: prev[recipe.id] - 1,
    }));
    setCoins((prev) => prev + finalPrice);
    setStats((prev) => ({
      ...prev,
      totalSold: prev.totalSold + 1,
    }));

    addFloatingText(playerRef.current.x, playerRef.current.y - 30, `+${finalPrice} Koin 💰`, '#FBC02D');
    triggerToast(`Produk Terjual: +${finalPrice} Koin!`, `Gunakan koin untuk meningkatkan peralatan Anto.`, 'success');
  };

  const handleSellAllProducts = () => {
    let totalEarned = 0;
    let soldCount = 0;
    CRAFTING_RECIPES.forEach((r) => {
      const qty = craftedInventory[r.id] || 0;
      if (qty > 0) {
        totalEarned += qty * Math.round(r.sellPrice * sellBonusMultiplier);
        soldCount += qty;
      }
    });
    if (soldCount === 0) return;

    sfx.play('coin');
    setCraftedInventory({});
    setCoins((prev) => prev + totalEarned);
    setStats((prev) => ({
      ...prev,
      totalSold: prev.totalSold + soldCount,
    }));
    triggerToast(`Semua Produk Terjual (+${totalEarned} Koin)!`, `${soldCount} produk daur ulang berhasil dijual.`, 'success');
  };

  const handleBuyUpgrade = (key: keyof UpgradeState, cost: number, label: string) => {
    if (upgrades[key] >= 4) return;
    if (coins < cost) {
      sfx.play('sort_err');
      triggerToast('Koin Belum Cukup!', 'Jual produk hasil daur ulang di Toko untuk mendapatkan Koin.', 'warn');
      return;
    }
    sfx.play('unlock');
    setCoins((prev) => prev - cost);
    setUpgrades((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
    triggerToast(`${label} Meningkat ke Lv.${upgrades[key] + 1}!`, 'Peralatan Anto kini makin efektif.', 'success');
  };

  // Interact key / button handler
  const triggerNearestInteraction = useCallback(() => {
    const prompt = nearbyPromptRef.current;
    if (!prompt) return;

    if (prompt.type === 'trash') {
      collectTrashInstance(prompt.id);
    } else if (prompt.type === 'station') {
      sfx.play('click');
      if (prompt.id === 'sorting') {
        setSortingFeedback(null);
        setActiveModal('sorting');
      } else if (prompt.id === 'crafting') {
        setActiveModal('crafting');
      } else if (prompt.id === 'shop') {
        setActiveModal('shop');
      } else if (prompt.id === 'upgrade') {
        setActiveModal('upgrade');
      }
    }
  }, [collectTrashInstance]);

  // ==========================================
  // 8. KEYBOARD INPUT & 2D CANVAS GAME LOOP
  // ==========================================
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (screen !== 'game') return;

      if (k === 'escape') {
        setActiveModal((prev) => (prev ? null : 'settings'));
      } else if ((k === 'e' || k === ' ') && !activeModal) {
        e.preventDefault();
        triggerNearestInteraction();
      } else if (k === 'p' || k === 'i') {
        setSortingFeedback(null);
        setActiveModal((prev) => (prev === 'sorting' ? null : 'sorting'));
      } else if (k === 'c') {
        setActiveModal((prev) => (prev === 'crafting' ? null : 'crafting'));
      } else if (k === 'k') {
        setActiveModal((prev) => (prev === 'catalog' ? null : 'catalog'));
      } else if (k === 'm') {
        setActiveModal((prev) => (prev === 'map' ? null : 'map'));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen, activeModal, triggerNearestInteraction]);

  // Check collision for a candidate player coordinate
  const isPositionBlocked = useCallback(
    (nx: number, ny: number): boolean => {
      if (nx < 60 || ny < 90 || nx > 1940 || ny > 1340) return true;
      if (unlockedAreaLevel < 2 && nx > 1225) return true;
      if (unlockedAreaLevel < 3 && ny > 880) return true;

      // River Channel except Bridge
      if (ny > 860 && ny < 940) {
        const onSouthBridge = nx >= 670 && nx <= 830;
        if (!onSouthBridge) return true;
      }

      // Building Colliders
      for (const box of SOLID_COLLIDERS) {
        if (nx > box.x - 18 && nx < box.x + box.w + 18 && ny > box.y - 12 && ny < box.y + box.h + 18) {
          return true;
        }
      }

      return false;
    },
    [unlockedAreaLevel]
  );

  // Main 60FPS Canvas Rendering & Physics Loop
  useEffect(() => {
    if (screen !== 'game') return;
    let animId: number;
    let tick = 0;

    const renderLoop = () => {
      tick++;
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match canvas internal resolution to display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const p = playerRef.current;

      // 1. UPDATE PLAYER MOVEMENT (if no modal open)
      if (!activeModal) {
        let dx = 0;
        let dy = 0;
        const keys = keysRef.current;

        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Cancel click-to-move if keyboard used
        if (dx !== 0 || dy !== 0) {
          p.targetX = null;
          p.targetY = null;
        } else if (p.targetX !== null && p.targetY !== null) {
          const tdx = p.targetX - p.x;
          const tdy = p.targetY - p.y;
          const dist = Math.hypot(tdx, tdy);
          if (dist > 8) {
            dx = tdx / dist;
            dy = tdy / dist;
          } else {
            p.targetX = null;
            p.targetY = null;
          }
        }

        // Normalize diagonal velocity
        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          dx = (dx / len) * moveSpeed;
          dy = (dy / len) * moveSpeed;

          if (Math.abs(dx) > Math.abs(dy)) {
            p.dir = dx > 0 ? 'right' : 'left';
          } else {
            p.dir = dy > 0 ? 'down' : 'up';
          }

          if (!isPositionBlocked(p.x + dx, p.y)) p.x += dx;
          if (!isPositionBlocked(p.x, p.y + dy)) p.y += dy;

          p.isMoving = true;
          p.walkFrame += 0.22;
        } else {
          p.isMoving = false;
        }
      } else {
        p.isMoving = false;
      }

      if (p.sweepTimer > 0) p.sweepTimer--;

      // 2. DETECT NEAREST INTERACTABLE (TRASH OR FACILITY)
      let foundPrompt: typeof nearbyPromptRef.current = null;
      let minTrashDist = pickupRadius;

      for (const t of worldTrashRef.current) {
        const d = Math.hypot(t.x - p.x, t.y - p.y);
        if (d < minTrashDist) {
          minTrashDist = d;
          const meta = WASTE_DATABASE[t.itemId];
          foundPrompt = {
            type: 'trash',
            id: t.uid,
            label: `Ambil ${meta?.name || 'Sampah'}`,
            sublabel: `Tekan [E] atau Klik (${meta?.category.toUpperCase()})`,
            x: t.x,
            y: t.y,
          };
        }
      }

      if (!foundPrompt) {
        Object.values(STATIONS).forEach((st) => {
          const cx = st.x + st.w / 2;
          const cy = st.y + st.h / 2;
          const d = Math.hypot(cx - p.x, cy - p.y);
          if (d < st.interactRadius) {
            foundPrompt = {
              type: 'station',
              id: st.id,
              label: st.name,
              sublabel: `Tekan [E] atau Klik — ${st.subtitle}`,
              x: cx,
              y: st.y,
            };
          }
        });
      }

      if (
        foundPrompt?.id !== nearbyPromptRef.current?.id ||
        foundPrompt?.type !== nearbyPromptRef.current?.type
      ) {
        nearbyPromptRef.current = foundPrompt;
        setNearbyUI(
          foundPrompt
            ? {
                type: foundPrompt.type,
                id: foundPrompt.id,
                label: foundPrompt.label,
                sublabel: foundPrompt.sublabel,
              }
            : null
        );
      } else {
        nearbyPromptRef.current = foundPrompt;
      }

      // 3. CAMERA TRANSFORM (Smoothly center on Anto)
      const camX = Math.max(0, Math.min(2000 - canvas.width, p.x - canvas.width / 2));
      const camY = Math.max(0, Math.min(1400 - canvas.height, p.y - canvas.height / 2));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(-camX, -camY);

      // ==========================================
      // 4. DRAW 2D TOP-DOWN WORLD
      // ==========================================
      // Base Grass
      ctx.fillStyle = '#7CB342';
      ctx.fillRect(0, 0, 2000, 1400);

      // Subtle grass texture patches
      ctx.fillStyle = '#689F38';
      for (let gx = 80; gx < 1950; gx += 180) {
        for (let gy = 80; gy < 1350; gy += 160) {
          ctx.beginPath();
          ctx.ellipse(gx + ((gy % 3) * 30), gy, 45, 22, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Area 2 (Taman Kota) Ornamental Lawn Flooring
      ctx.fillStyle = '#8BC34A';
      ctx.fillRect(1260, 60, 680, 790);

      // Central Village Dirt / Cobble Courtyards & Paths
      ctx.fillStyle = '#E6C699';
      ctx.beginPath();
      ctx.roundRect(280, 320, 860, 420, 45);
      ctx.fill();
      // Path to Area 2 (East)
      ctx.fillRect(1100, 450, 650, 110);
      // Path to Area 3 (South Bridge)
      ctx.fillRect(685, 700, 130, 360);

      // Dirt path inner border shading
      ctx.strokeStyle = '#C8A474';
      ctx.lineWidth = 5;
      ctx.strokeRect(285, 325, 850, 410);

      // River Channel along South (Area 3 Transition)
      ctx.fillStyle = '#29B6F6';
      ctx.fillRect(0, 865, 2000, 75);
      // Animated water ripples
      ctx.strokeStyle = '#B3E5FC';
      ctx.lineWidth = 2.5;
      for (let wx = 40; wx < 1960; wx += 110) {
        const waveX = wx + Math.sin(tick * 0.04 + wx) * 12;
        ctx.beginPath();
        ctx.moveTo(waveX, 890);
        ctx.lineTo(waveX + 38, 890);
        ctx.moveTo(waveX + 20, 918);
        ctx.lineTo(waveX + 55, 918);
        ctx.stroke();
      }
      // Stone Riverbanks
      ctx.fillStyle = '#78909C';
      ctx.fillRect(0, 855, 2000, 12);
      ctx.fillRect(0, 938, 2000, 12);

      // Wooden Bridge over River to Area 3
      ctx.fillStyle = '#A1662F';
      ctx.fillRect(675, 848, 150, 110);
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 4;
      ctx.strokeRect(675, 848, 150, 110);
      for (let by = 858; by < 955; by += 16) {
        ctx.beginPath();
        ctx.moveTo(675, by);
        ctx.lineTo(825, by);
        ctx.stroke();
      }

      // ==========================================
      // 5. DRAW BUILDINGS & FACILITIES
      // ==========================================
      // A. PUSAT DAUR ULANG
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(258, 182, 385, 175);
      ctx.fillStyle = '#E8EFE6';
      ctx.strokeStyle = '#163824';
      ctx.lineWidth = 4;
      ctx.fillRect(250, 170, 380, 170);
      ctx.strokeRect(250, 170, 380, 170);
      // Striped Green Roof
      ctx.fillStyle = '#43A047';
      ctx.fillRect(240, 145, 400, 58);
      ctx.strokeRect(240, 145, 400, 58);
      // Signboard "PUSAT DAUR ULANG"
      ctx.fillStyle = '#8CC63F';
      ctx.fillRect(315, 118, 250, 38);
      ctx.strokeRect(315, 118, 250, 38);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♻ PUSAT DAUR ULANG', 440, 143);

      // 4 Iconic Colored Sorting Bins
      const bins = [
        { label: 'Organik', color: '#689F38', lid: '#8BC34A', icon: '🍃', x: 375 },
        { label: 'Plastik', color: '#1E88E5', lid: '#42A5F5', icon: '🧴', x: 435 },
        { label: 'Kertas', color: '#FBC02D', lid: '#FFF176', icon: '📄', x: 495 },
        { label: 'Logam', color: '#E53935', lid: '#EF5350', icon: '🥫', x: 555 },
      ];
      bins.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, 340, 48, 62);
        ctx.strokeStyle = '#163824';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(b.x, 340, 48, 62);
        ctx.fillStyle = b.lid;
        ctx.fillRect(b.x - 3, 332, 54, 12);
        ctx.strokeRect(b.x - 3, 332, 54, 12);
        ctx.font = '16px sans-serif';
        ctx.fillText(b.icon, b.x + 24, 368);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(b.label, b.x + 24, 392);
      });
      ctx.restore();

      // B. WORKSHOP CRAFTING
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(890, 150, 270, 165);
      ctx.fillStyle = '#A1662F';
      ctx.strokeStyle = '#163824';
      ctx.lineWidth = 4;
      ctx.fillRect(880, 140, 270, 165);
      ctx.strokeRect(880, 140, 270, 165);
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(868, 120, 294, 48);
      ctx.strokeRect(868, 120, 294, 48);
      ctx.fillStyle = '#F5CBA7';
      ctx.fillRect(940, 104, 150, 34);
      ctx.strokeRect(940, 104, 150, 34);
      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛠️ WORKSHOP', 1015, 127);
      ctx.fillStyle = '#D7CCC8';
      ctx.fillRect(925, 245, 180, 42);
      ctx.strokeRect(925, 245, 180, 42);
      ctx.font = '20px sans-serif';
      ctx.fillText('⚙️ 🪴 👜 🪑', 1015, 273);
      ctx.restore();

      // C. TOKO PENJUALAN
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(965, 420, 195, 130);
      ctx.fillStyle = '#B87B43';
      ctx.strokeStyle = '#163824';
      ctx.lineWidth = 3.5;
      ctx.fillRect(955, 410, 195, 130);
      ctx.strokeRect(955, 410, 195, 130);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#29B6F6' : '#FFFFFF';
        ctx.fillRect(948 + i * 34, 392, 34, 36);
        ctx.strokeRect(948 + i * 34, 392, 34, 36);
      }
      ctx.fillStyle = '#8D5B34';
      ctx.fillRect(995, 362, 115, 32);
      ctx.strokeRect(995, 362, 115, 32);
      ctx.fillStyle = '#FFF8E7';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏪 TOKO', 1052, 384);
      ctx.restore();

      // D. KEBUN KOMPOS & POS UPGRADE
      ctx.save();
      ctx.fillStyle = '#6D4C41';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 4;
      ctx.fillRect(455, 645, 225, 115);
      ctx.strokeRect(455, 645, 225, 115);
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      for (let gx = 485; gx <= 650; gx += 52) {
        ctx.fillText('🌱', gx, 685);
        ctx.fillText('🌿', gx, 735);
      }
      ctx.fillStyle = '#C8A474';
      ctx.fillRect(480, 614, 175, 30);
      ctx.strokeRect(480, 614, 175, 30);
      ctx.fillStyle = '#163824';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('🌱 KEBUN & UPGRADE', 567, 634);
      ctx.restore();

      // E. LOCKED / UNLOCKED GATES
      ctx.save();
      ctx.textAlign = 'center';
      if (unlockedAreaLevel < 2) {
        ctx.fillStyle = 'rgba(22, 56, 36, 0.78)';
        ctx.fillRect(1225, 430, 36, 150);
        ctx.fillStyle = '#FBC02D';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🔒 TAMAN KOTA (Pilah 8 Sampah)', 1225, 415);
      } else {
        ctx.fillStyle = '#5A9A3B';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🌳 TAMAN KOTA TERBUKA →', 1235, 440);
      }

      if (unlockedAreaLevel < 3) {
        ctx.fillStyle = 'rgba(22, 56, 36, 0.82)';
        ctx.fillRect(675, 880, 150, 35);
        ctx.fillStyle = '#FBC02D';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🔒 TEPI SUNGAI (Pilah 18 Sampah)', 750, 870);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🌊 TEPI SUNGAI ↓', 750, 840);
      }
      ctx.restore();

      // Decorative Trees
      const treePositions = [
        { x: 140, y: 180 },
        { x: 160, y: 420 },
        { x: 190, y: 720 },
        { x: 740, y: 150 },
        { x: 1290, y: 130 },
        { x: 1560, y: 140 },
        { x: 1820, y: 200 },
        { x: 1840, y: 550 },
        { x: 1620, y: 760 },
      ];
      treePositions.forEach((tr) => {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(tr.x, tr.y + 28, 36, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(tr.x - 8, tr.y, 16, 28);
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.arc(tr.x, tr.y - 12, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.arc(tr.x - 8, tr.y - 20, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      // ==========================================
      // 6. DRAW WORLD TRASH ITEMS
      // ==========================================
      worldTrashRef.current.forEach((item) => {
        const meta = WASTE_DATABASE[item.itemId];
        if (!meta) return;
        const bobY = Math.sin(tick * 0.07 + item.bobOffset) * 3.5;
        const isHighlighted = nearbyPromptRef.current?.id === item.uid;

        ctx.save();
        ctx.beginPath();
        ctx.arc(item.x, item.y, isHighlighted ? 24 : 18, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted ? 'rgba(251, 192, 45, 0.45)' : 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
        ctx.lineWidth = isHighlighted ? 3 : 1.5;
        ctx.strokeStyle = isHighlighted ? '#FBC02D' : meta.color;
        ctx.stroke();

        ctx.font = isHighlighted ? '26px sans-serif' : '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.icon, item.x, item.y + bobY);
        ctx.restore();
      });

      // ==========================================
      // 7. DRAW CHARACTER "ANTO"
      // ==========================================
      ctx.save();
      const legSwing = p.isMoving ? Math.sin(p.walkFrame) * 6 : 0;

      // Pickup Range Ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, pickupRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(140, 198, 63, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ground Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 22, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Patched Sack on Back
      const sackScale = 1 + (rawBag.length / maxSackCapacity) * 0.35;
      const sackOffsetX = p.dir === 'left' ? 12 : p.dir === 'right' ? -12 : 0;
      ctx.save();
      ctx.translate(p.x + sackOffsetX, p.y - 6);
      ctx.scale(sackScale, sackScale);
      ctx.fillStyle = '#A67B5B';
      ctx.strokeStyle = '#163824';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(-6, -4, 7, 7);
      ctx.restore();

      // Boots
      ctx.fillStyle = '#4E342E';
      ctx.strokeStyle = '#163824';
      ctx.lineWidth = 2;
      ctx.fillRect(p.x - 10, p.y + 10 + legSwing * 0.5, 8, 11);
      ctx.strokeRect(p.x - 10, p.y + 10 + legSwing * 0.5, 8, 11);
      ctx.fillRect(p.x + 2, p.y + 10 - legSwing * 0.5, 8, 11);
      ctx.strokeRect(p.x + 2, p.y + 10 - legSwing * 0.5, 8, 11);

      // Uniform Torso
      ctx.fillStyle = '#5C6B3C';
      ctx.beginPath();
      ctx.roundRect(p.x - 12, p.y - 12, 24, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Yellow Safety Stripe
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(p.x - 11, p.y + 1, 22, 3.5);

      // Head & Face
      ctx.fillStyle = '#FAD2B8';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 21, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (p.dir !== 'up') {
        const eyeOffset = p.dir === 'left' ? -3 : p.dir === 'right' ? 3 : 0;
        ctx.fillStyle = '#163824';
        ctx.beginPath();
        ctx.arc(p.x - 4 + eyeOffset, p.y - 21, 1.8, 0, Math.PI * 2);
        ctx.arc(p.x + 4 + eyeOffset, p.y - 21, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cap
      ctx.fillStyle = '#6E7D47';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 25, 12.5, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#526032';
      ctx.fillRect(p.x - 12, p.y - 26, 24, 4);

      // Broom in Right Hand
      ctx.save();
      const sweepAngle = p.sweepTimer > 0 ? Math.sin(p.sweepTimer * 0.6) * 0.8 : legSwing * 0.04;
      ctx.translate(p.x + 12, p.y - 2);
      ctx.rotate(sweepAngle);
      ctx.strokeStyle = '#8D5B34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 16);
      ctx.stroke();
      ctx.fillStyle = '#D4AC6E';
      ctx.beginPath();
      ctx.moveTo(4, 14);
      ctx.lineTo(15, 14);
      ctx.lineTo(18, 25);
      ctx.lineTo(1, 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // ==========================================
      // 8. INTERACTION PROMPT & FLOATING TEXTS
      // ==========================================
      if (nearbyPromptRef.current && !activeModal) {
        const pr = nearbyPromptRef.current;
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        const textWidth = Math.max(ctx.measureText(pr.label).width, ctx.measureText(pr.sublabel).width) + 28;
        const bx = pr.x - textWidth / 2;
        const by = pr.y - 64;

        ctx.fillStyle = 'rgba(22, 56, 36, 0.92)';
        ctx.strokeStyle = '#8CC63F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, textWidth, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047';
        ctx.textAlign = 'center';
        ctx.fillText(pr.label, pr.x, by + 17);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px sans-serif';
        ctx.fillText(pr.sublabel, pr.x, by + 33);
        ctx.restore();
      }

      // Update & Draw Floating Feedback Particles
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.018;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#163824';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [screen, activeModal, moveSpeed, pickupRadius, maxSackCapacity, rawBag.length, unlockedAreaLevel, isPositionBlocked]);

  // Handle Canvas Click / Touch Coordinates
  const processCanvasInteraction = (clientX: number, clientY: number) => {
    if (activeModal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const p = playerRef.current;
    const camX = Math.max(0, Math.min(2000 - canvas.width, p.x - canvas.width / 2));
    const camY = Math.max(0, Math.min(1400 - canvas.height, p.y - canvas.height / 2));

    const worldX = clickX + camX;
    const worldY = clickY + camY;

    // 1. Check if user clicked directly on a nearby trash item
    for (const t of worldTrashRef.current) {
      if (Math.hypot(t.x - worldX, t.y - worldY) < 34) {
        if (Math.hypot(t.x - p.x, t.y - p.y) <= pickupRadius + 25) {
          collectTrashInstance(t.uid);
          return;
        } else {
          p.targetX = t.x;
          p.targetY = t.y;
          return;
        }
      }
    }

    // 2. Check if user clicked on a station building
    for (const st of Object.values(STATIONS)) {
      if (worldX >= st.x && worldX <= st.x + st.w && worldY >= st.y - 40 && worldY <= st.y + st.h) {
        const cx = st.x + st.w / 2;
        const cy = st.y + st.h / 2;
        if (Math.hypot(cx - p.x, cy - p.y) <= st.interactRadius + 20) {
          sfx.play('click');
          if (st.id === 'sorting') setActiveModal('sorting');
          if (st.id === 'crafting') setActiveModal('crafting');
          if (st.id === 'shop') setActiveModal('shop');
          if (st.id === 'upgrade') setActiveModal('upgrade');
          return;
        } else {
          p.targetX = cx;
          p.targetY = st.y + st.h + 15;
          return;
        }
      }
    }

    // 3. Otherwise walk to clicked point
    p.targetX = worldX;
    p.targetY = worldY;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    processCanvasInteraction(e.clientX, e.clientY);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      processCanvasInteraction(touch.clientX, touch.clientY);
    }
  };

  // Start New Game or Continue
  const handleStartNewGame = () => {
    sfx.play('click');
    setPoints(0);
    setCoins(50);
    setRawBag([]);
    setSortedMat({ organik: 2, plastik: 1, kertas: 1, logam: 0 });
    setCraftedInventory({});
    setDiscoveredWaste(['daun_kering', 'botol_plastik']);
    setDiscoveredProducts([]);
    setUpgrades({ sackLevel: 1, broomLevel: 1, bootsLevel: 1, machineLevel: 1 });
    setStats({
      totalCollected: 0,
      totalSorted: 0,
      totalCrafted: 0,
      totalSold: 0,
      organicCollected: 0,
      plasticCollected: 0,
    });
    playerRef.current.x = 640;
    playerRef.current.y = 470;
    spawnInitialTrash();
    setScreen('game');
    triggerToast(
      'Selamat Datang di Desa Cycle Craft!',
      'Gunakan WASD atau Klik untuk mengumpulkan sampah bersama Anto.',
      'info'
    );
  };

  const handleContinueGame = () => {
    sfx.play('click');
    loadGameFromStorage();
    setScreen('game');
  };

  // ==========================================
  // 9. HOME SCREEN RENDER
  // ==========================================
  if (screen === 'home') {
    return (
      <div className="relative w-full h-screen overflow-hidden select-none flex flex-col justify-between bg-gradient-to-b from-[#38BDF8] via-[#BAE6FD] to-[#8CC63F]">
        {/* Scenic Illustrated Background */}
        <svg
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="#FFFFFF" opacity="0.85">
            <ellipse cx="280" cy="150" rx="95" ry="35" />
            <ellipse cx="330" cy="140" rx="70" ry="42" />
            <ellipse cx="1080" cy="130" rx="110" ry="38" />
            <ellipse cx="1140" cy="115" rx="80" ry="45" />
          </g>
          <path d="M0,520 L240,260 L490,480 L780,290 L1120,490 L1360,300 L1440,420 L1440,900 L0,900 Z" fill="#64B5F6" opacity="0.45" />
          <path d="M0,560 L180,380 L420,520 L890,360 L1240,530 L1440,450 L1440,900 L0,900 Z" fill="#81C784" />
          <path d="M0,620 Q380,520 740,630 T1440,590 L1440,900 L0,900 Z" fill="#689F38" />
          <path d="M590,580 Q480,680 540,780 T460,900 L760,900 Q790,760 690,670 Z" fill="#29B6F6" />
          <path d="M0,740 Q720,690 1440,750 L1440,900 L0,900 Z" fill="#558B2F" />
        </svg>

        {/* Top Bar: Left Signboard & Right Gameplay Loop Diagram */}
        <div className="relative z-10 flex flex-wrap items-start justify-between px-6 pt-5 gap-4">
          <div
            className="hidden md:flex flex-col items-center p-4 rounded-2xl border-4 shadow-xl max-w-[210px] transform -rotate-2"
            style={{ backgroundColor: '#5D4037', borderColor: '#3E2723', color: '#F7F4EB' }}
          >
            <div className="w-full border-2 border-[#8D5B34] rounded-xl p-3 text-center space-y-1 bg-[#4E342E]">
              <p className="font-bold text-lg text-[#FDE047] tracking-wide">Pilah</p>
              <p className="font-bold text-lg text-[#A3E635] tracking-wide">Olah</p>
              <p className="font-bold text-lg text-white">Buat Jadi Produk</p>
              <p className="font-bold text-lg text-[#FBC02D]">Bernilai</p>
              <div className="pt-1 text-xl">🌱</div>
            </div>
          </div>

          <div className="ml-auto bg-white/90 backdrop-blur-md border-2 border-[#163824] rounded-2xl p-3 shadow-lg flex flex-wrap items-center gap-2">
            {[
              { icon: '🧹', label: 'Kumpulkan', bg: '#DCFCE7' },
              { icon: '🗑️', label: 'Pilah', bg: '#DBEAFE' },
              { icon: '⚙️', label: 'Olah', bg: '#FEF9C3' },
              { icon: '🪴', label: 'Jadi Produk', bg: '#F3E8FF' },
              { icon: '🪙', label: 'Dapatkan Poin', bg: '#FFEDD5' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center px-2 py-1 rounded-xl border border-[#163824]/20" style={{ backgroundColor: step.bg }}>
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-[11px] font-extrabold text-[#163824] mt-0.5">{step.label}</span>
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-[#5A9A3B] shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Center Hero Section: Logo, Anto, Main Menu */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 my-auto">
          <CycleCraftLogo size="lg" showTagline={true} />

          {/* Character Card */}
          <div className="mt-5 flex items-center gap-3.5 bg-[#163824]/90 text-white px-5 py-2.5 rounded-full border-2 border-[#8CC63F] shadow-lg">
            <AntoPortrait size={46} />
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider text-[#A3E635] font-bold">Karakter Utama • GDD</div>
              <div className="text-sm font-bold">Antonius Columbus (Anto) — Pahlawan Daur Ulang</div>
            </div>
          </div>

          {/* Main Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5 max-w-2xl">
            <button
              onClick={handleStartNewGame}
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl font-black text-lg text-[#163824] bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border-4 border-[#163824] shadow-[0_6px_0_#163824] hover:translate-y-0.5 hover:shadow-[0_4px_0_#163824] active:translate-y-1 transition-all cursor-pointer"
            >
              <Play className="w-6 h-6 fill-[#163824]" />
              {hasSaveData ? 'Main Baru (New Game)' : 'Mulai Bermain (Start Game)'}
            </button>

            {hasSaveData && (
              <button
                onClick={handleContinueGame}
                className="flex items-center gap-2.5 px-6 py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-b from-[#8CC63F] to-[#5A9A3B] border-4 border-[#163824] shadow-[0_6px_0_#163824] hover:translate-y-0.5 hover:shadow-[0_4px_0_#163824] transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                Lanjutkan (Continue)
              </button>
            )}

            <button
              onClick={() => {
                sfx.play('click');
                setActiveModal('catalog');
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-base text-[#163824] bg-[#F7F4EB] border-4 border-[#163824] shadow-[0_5px_0_#163824] hover:bg-white transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-[#5A9A3B]" />
              Katalog Edukatif
            </button>

            <button
              onClick={() => {
                sfx.play('click');
                setActiveModal('controls');
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-base text-[#163824] bg-[#F7F4EB] border-4 border-[#163824] shadow-[0_5px_0_#163824] hover:bg-white transition-all cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 text-[#F59E0B]" />
              Panduan & Kontrol
            </button>

            <button
              onClick={() => {
                sfx.play('click');
                setActiveModal('settings');
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-base text-[#163824] bg-[#F7F4EB] border-4 border-[#163824] shadow-[0_5px_0_#163824] hover:bg-white transition-all cursor-pointer"
            >
              <Settings className="w-5 h-5 text-[#163824]" />
              Pengaturan
            </button>
          </div>
        </div>

        {/* Bottom Scenic Decor */}
        <div className="relative z-10 flex items-end justify-between px-6 pb-4 pointer-events-none">
          <div className="flex items-end gap-2">
            {[
              { name: 'ORGANIK', bg: '#689F38', icon: '🍃' },
              { name: 'PLASTIK', bg: '#1E88E5', icon: '🧴' },
              { name: 'KERTAS', bg: '#FBC02D', icon: '📦' },
              { name: 'LAINNYA', bg: '#E53935', icon: '🥫' },
            ].map((b) => (
              <div
                key={b.name}
                className="w-16 md:w-20 h-20 md:h-24 rounded-t-xl border-3 border-[#163824] flex flex-col items-center justify-center text-white font-black shadow-md"
                style={{ backgroundColor: b.bg }}
              >
                <span className="text-xl">{b.icon}</span>
                <span className="text-[10px] tracking-tighter mt-1">{b.name}</span>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 bg-[#4E342E] text-[#F7F4EB] px-4 py-2.5 rounded-2xl border-3 border-[#163824] shadow-lg">
            <span className="text-2xl">👜 🪴 🪑</span>
            <div className="text-xs font-bold leading-tight">
              <div className="text-[#FDE047]">Produk Daur Ulang</div>
              <div>Lebih Baik untuk Bumi</div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {activeModal && renderActiveModal()}
      </div>
    );
  }

  // ==========================================
  // 10. MODAL DIALOG RENDERER
  // ==========================================
  function renderActiveModal() {
    if (!activeModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 shadow-2xl p-6"
          style={{ backgroundColor: BRAND.cream, borderColor: BRAND.darkGreen, color: BRAND.darkGreen }}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sfx.play('click');
              setActiveModal(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#163824] text-white flex items-center justify-center hover:bg-[#5A9A3B] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* MODAL 1: PEMILAHAN SAMPAH */}
          {activeModal === 'sorting' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-2xl bg-[#8CC63F] text-[#163824] border-2 border-[#163824]">
                  <Recycle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Tempat Pemilahan Sampah (Tas & Pilah)</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Seret (Drag & Drop) atau klik sampah dari Karung Anto ke kategori tong yang tepat!
                  </p>
                </div>
              </div>

              {/* Feedback Banner */}
              {sortingFeedback && (
                <div
                  className={`my-3 p-3.5 rounded-2xl border-2 flex items-start gap-3 ${
                    sortingFeedback.correct
                      ? 'bg-lime-100 border-[#5A9A3B] text-[#163824]'
                      : 'bg-amber-100 border-[#F59E0B] text-amber-950'
                  }`}
                >
                  {sortingFeedback.correct ? (
                    <CheckCircle2 className="w-6 h-6 text-[#5A9A3B] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-[#F59E0B] shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <div className="font-black">{sortingFeedback.title}</div>
                    <div>{sortingFeedback.detail}</div>
                  </div>
                </div>
              )}

              {/* Raw Trash in Sack */}
              <div className="mt-4 bg-white p-4 rounded-2xl border-2 border-[#163824]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm">
                    🎒 Isi Karung Sampah Belum Dipilah ({rawBag.length} / {maxSackCapacity})
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    Pilih item lalu klik tong di bawah, atau seret langsung
                  </span>
                </div>

                {rawBag.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 font-semibold">
                    Karung sampahmu kosong! Keluar dan kumpulkan sampah yang tersebar di jalanan, taman, atau sungai.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {rawBag.map((itemId, idx) => {
                      const meta = WASTE_DATABASE[itemId];
                      if (!meta) return null;
                      const isSelected = selectedBagIndex === idx;
                      return (
                        <div
                          key={`${itemId}-${idx}`}
                          draggable
                          onDragStart={() => {
                            setDraggedBagIndex(idx);
                            setSelectedBagIndex(idx);
                          }}
                          onClick={() => setSelectedBagIndex(idx)}
                          className={`px-3.5 py-2.5 rounded-xl border-2 flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all ${
                            isSelected
                              ? 'bg-[#FEF9C3] border-[#163824] ring-3 ring-[#8CC63F] scale-105'
                              : 'bg-stone-50 border-stone-300 hover:border-[#163824]'
                          }`}
                        >
                          <span className="text-2xl">{meta.icon}</span>
                          <div className="text-left">
                            <div className="text-xs font-black">{meta.name}</div>
                            <div className="text-[10px] text-stone-500">Klik / Seret ke Tong</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drop Target Bins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Organik */}
                <div className="p-4 rounded-2xl bg-[#ECFCCB] border-3 border-[#5A9A3B] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#5A9A3B] text-white text-xs font-black uppercase">
                        Kategori GDD: Sampah Organik
                      </span>
                      <span className="text-xs font-bold text-[#163824]">Terpilah: {sortedMat.organik}</span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1.5">
                      Sampah alami yang mudah terurai (daun kering, ranting, sisa buah/sayur) untuk bahan kompos.
                    </p>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedBagIndex !== null) {
                        handleSortWasteItem(draggedBagIndex, 'organik', 'organik');
                        setDraggedBagIndex(null);
                      }
                    }}
                    onClick={() => {
                      if (selectedBagIndex !== null && rawBag[selectedBagIndex]) {
                        handleSortWasteItem(selectedBagIndex, 'organik', 'organik');
                      }
                    }}
                    className="mt-3 p-4 rounded-2xl bg-[#689F38] hover:bg-[#558B2F] text-white border-3 border-[#163824] flex items-center justify-center gap-3 cursor-pointer transition-transform active:scale-95 shadow-md"
                  >
                    <span className="text-3xl">🍃</span>
                    <div className="text-left">
                      <div className="font-black text-base">TONG ORGANIK (HIJAU)</div>
                      <div className="text-xs opacity-90">Klik atau Lepaskan Sampah Organik di Sini</div>
                    </div>
                  </div>
                </div>

                {/* Anorganik */}
                <div className="p-4 rounded-2xl bg-[#DBEAFE] border-3 border-[#1E88E5] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#1E88E5] text-white text-xs font-black uppercase">
                        Kategori GDD: Sampah Anorganik
                      </span>
                      <span className="text-xs font-bold text-[#163824]">
                        Total: {sortedMat.plastik + sortedMat.kertas + sortedMat.logam}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1.5">
                      Sampah buatan/non-hayati yang sulit terurai namun bisa didaur ulang menjadi produk kerajinan.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { sub: 'plastik' as SubBinType, label: 'PLASTIK', bg: '#1E88E5', icon: '🧴', count: sortedMat.plastik },
                      { sub: 'kertas' as SubBinType, label: 'KERTAS', bg: '#EAB308', icon: '📦', count: sortedMat.kertas },
                      { sub: 'logam' as SubBinType, label: 'LOGAM', bg: '#E53935', icon: '🥫', count: sortedMat.logam },
                    ].map((b) => (
                      <div
                        key={b.sub}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedBagIndex !== null) {
                            handleSortWasteItem(draggedBagIndex, 'anorganik', b.sub);
                            setDraggedBagIndex(null);
                          }
                        }}
                        onClick={() => {
                          if (selectedBagIndex !== null && rawBag[selectedBagIndex]) {
                            handleSortWasteItem(selectedBagIndex, 'anorganik', b.sub);
                          }
                        }}
                        style={{ backgroundColor: b.bg }}
                        className="p-2.5 rounded-xl text-white border-2 border-[#163824] flex flex-col items-center justify-center cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-sm"
                      >
                        <span className="text-2xl">{b.icon}</span>
                        <span className="font-black text-xs mt-1">{b.label}</span>
                        <span className="text-[10px] bg-black/25 px-2 py-0.5 rounded-full mt-0.5">
                          Stok: {b.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: PUSAT PENGOLAHAN / CRAFTING */}
          {activeModal === 'crafting' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-2xl bg-[#FBC02D] text-[#163824] border-2 border-[#163824]">
                  <Hammer className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Workshop & Pusat Pengolahan (Crafting)</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Olah bahan sampah yang sudah dipilah menjadi produk daur ulang bernilai jual tinggi!
                  </p>
                </div>
              </div>

              {/* Current Sorted Materials Bar */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border-2 border-[#163824] mb-4">
                <span className="text-xs font-black uppercase text-stone-500">Bahan Terpilah Tersedia:</span>
                <span className="px-3 py-1 rounded-full bg-lime-100 border border-[#5A9A3B] text-xs font-extrabold">
                  🍃 Organik: {sortedMat.organik}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 border border-blue-500 text-xs font-extrabold">
                  🧴 Plastik: {sortedMat.plastik}
                </span>
                <span className="px-3 py-1 rounded-full bg-yellow-100 border border-yellow-500 text-xs font-extrabold">
                  📦 Kertas: {sortedMat.kertas}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-100 border border-red-500 text-xs font-extrabold">
                  🥫 Logam: {sortedMat.logam}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CRAFTING_RECIPES.map((recipe) => {
                  const req = recipe.ingredients;
                  const canCraft =
                    (!req.organik || sortedMat.organik >= req.organik) &&
                    (!req.plastik || sortedMat.plastik >= req.plastik) &&
                    (!req.kertas || sortedMat.kertas >= req.kertas) &&
                    (!req.logam || sortedMat.logam >= req.logam);

                  const owned = craftedInventory[recipe.id] || 0;

                  return (
                    <div
                      key={recipe.id}
                      className="p-4 rounded-2xl bg-white border-2 border-[#163824] flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl bg-[#F7F4EB] p-2 rounded-xl border border-stone-300">
                              {recipe.icon}
                            </span>
                            <div>
                              <h3 className="font-black text-base">{recipe.name}</h3>
                              <span className="text-xs font-bold text-[#5A9A3B]">
                                Nilai Jual: {Math.round(recipe.sellPrice * sellBonusMultiplier)} Koin • +
                                {Math.round(recipe.craftPoints * sellBonusMultiplier)} Poin
                              </span>
                            </div>
                          </div>
                          {owned > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#8CC63F] text-[#163824] text-xs font-black">
                              Dimiliki: {owned}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-600 mt-2">{recipe.description}</p>

                        {/* Ingredients list */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {req.organik && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                sortedMat.organik >= req.organik
                                  ? 'bg-lime-100 text-lime-900'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              🍃 Organik: {sortedMat.organik}/{req.organik}
                            </span>
                          )}
                          {req.plastik && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                sortedMat.plastik >= req.plastik
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              🧴 Plastik: {sortedMat.plastik}/{req.plastik}
                            </span>
                          )}
                          {req.kertas && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                sortedMat.kertas >= req.kertas
                                  ? 'bg-yellow-100 text-yellow-900'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              📦 Kertas: {sortedMat.kertas}/{req.kertas}
                            </span>
                          )}
                          {req.logam && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                sortedMat.logam >= req.logam ? 'bg-red-100 text-red-900' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              🥫 Logam: {sortedMat.logam}/{req.logam}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCraftProduct(recipe)}
                        disabled={!canCraft}
                        className={`mt-3 w-full py-2.5 rounded-xl font-black text-sm border-2 border-[#163824] transition-all cursor-pointer ${
                          canCraft
                            ? 'bg-[#8CC63F] hover:bg-[#5A9A3B] text-[#163824] hover:text-white shadow-[0_3px_0_#163824]'
                            : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                        }`}
                      >
                        {canCraft ? '⚙️ Olah & Buat Produk' : 'Bahan Belum Cukup'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 3: TOKO PENJUALAN */}
          {activeModal === 'shop' && (
            <div>
              <div className="flex items-center justify-between mb-4 pr-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#38BDF8] text-[#163824] border-2 border-[#163824]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Toko Produk Daur Ulang</h2>
                    <p className="text-sm font-medium text-stone-600">
                      Jual hasil kerajinan daur ulangmu untuk memperoleh Koin!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSellAllProducts}
                  className="px-4 py-2 rounded-xl bg-[#FBC02D] hover:bg-[#F59E0B] text-[#163824] font-black text-xs border-2 border-[#163824] shadow-sm cursor-pointer"
                >
                  💰 Jual Semua Produk
                </button>
              </div>

              <div className="space-y-2.5">
                {CRAFTING_RECIPES.map((r) => {
                  const qty = craftedInventory[r.id] || 0;
                  const price = Math.round(r.sellPrice * sellBonusMultiplier);
                  return (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl bg-white border-2 border-[#163824] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{r.icon}</span>
                        <div>
                          <div className="font-black text-base">{r.name}</div>
                          <div className="text-xs text-stone-500">
                            Harga Jual: <strong className="text-[#8D5B34]">{price} Koin</strong> / unit • Stok di Tas:{' '}
                            <strong>{qty}</strong>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSellProduct(r)}
                        disabled={qty <= 0}
                        className={`px-5 py-2 rounded-xl font-black text-sm border-2 border-[#163824] cursor-pointer ${
                          qty > 0
                            ? 'bg-[#FDE047] hover:bg-[#FBC02D] text-[#163824] shadow-[0_3px_0_#163824]'
                            : 'bg-stone-100 text-stone-400 border-stone-300 cursor-not-allowed'
                        }`}
                      >
                        Jual (+{price} 🪙)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 4: UPGRADE PERALATAN */}
          {activeModal === 'upgrade' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#8CC63F] text-[#163824] border-2 border-[#163824]">
                  <ArrowUpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Peningkatan Peralatan & Fasilitas (Upgrade)</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Gunakan Koin hasil penjualan produk untuk meningkatkan peralatan kerja Anto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    key: 'sackLevel' as keyof UpgradeState,
                    name: 'Karung Sampah Anto',
                    icon: '🎒',
                    desc: `Meningkatkan kapasitas angkut sampah mentah (${maxSackCapacity} -> ${maxSackCapacity + 4} slot).`,
                    cost: upgrades.sackLevel * 55,
                  },
                  {
                    key: 'broomLevel' as keyof UpgradeState,
                    name: 'Sapu Lidi Super',
                    icon: '🧹',
                    desc: 'Memperluas radius jangkauan sapu saat mengambil sampah di jalanan.',
                    cost: upgrades.broomLevel * 65,
                  },
                  {
                    key: 'bootsLevel' as keyof UpgradeState,
                    name: 'Sepatu Bot Lapangan',
                    icon: '🥾',
                    desc: 'Meningkatkan kecepatan gerak Anto saat menjelajahi jalan, taman, dan sungai.',
                    cost: upgrades.bootsLevel * 60,
                  },
                  {
                    key: 'machineLevel' as keyof UpgradeState,
                    name: 'Mesin Pengolah Efisien',
                    icon: '⚙️',
                    desc: 'Meningkatkan nilai jual koin & bonus poin produk daur ulang sebesar +25%.',
                    cost: upgrades.machineLevel * 85,
                  },
                ].map((up) => {
                  const lvl = upgrades[up.key];
                  const isMax = lvl >= 4;
                  return (
                    <div
                      key={up.key}
                      className="p-4 rounded-2xl bg-white border-2 border-[#163824] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-3xl">{up.icon}</span>
                            <div>
                              <h3 className="font-black text-base">{up.name}</h3>
                              <span className="text-xs font-extrabold text-[#5A9A3B]">Level Saat Ini: Lv.{lvl} / 4</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-stone-600 mt-2">{up.desc}</p>
                      </div>

                      <button
                        onClick={() => handleBuyUpgrade(up.key, up.cost, up.name)}
                        disabled={isMax || coins < up.cost}
                        className={`mt-3 w-full py-2.5 rounded-xl font-black text-sm border-2 border-[#163824] cursor-pointer ${
                          isMax
                            ? 'bg-lime-200 text-[#163824] cursor-default'
                            : coins >= up.cost
                            ? 'bg-[#FBC02D] hover:bg-[#F59E0B] text-[#163824] shadow-[0_3px_0_#163824]'
                            : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? '✓ Level Maksimal' : `Tingkatkan (${up.cost} 🪙)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 5: KATALOG EDUKATIF */}
          {activeModal === 'catalog' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#5A9A3B] text-white border-2 border-[#163824]">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Katalog Edukatif Sampah & Daur Ulang</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Ensiklopedia jenis sampah beserta waktu urai dan fakta pelestarian lingkungan (GDD Bab 3.1 & 9.2).
                  </p>
                </div>
              </div>

              <h3 className="font-black text-sm uppercase tracking-wider text-[#5A9A3B] mb-2">
                1. Koleksi Jenis Sampah ({discoveredWaste.length} / {Object.keys(WASTE_DATABASE).length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                {Object.values(WASTE_DATABASE).map((w) => {
                  const unlocked = discoveredWaste.includes(w.id);
                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-2xl border-2 ${
                        unlocked ? 'bg-white border-[#163824]' : 'bg-stone-200/70 border-stone-300 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{unlocked ? w.icon : '❓'}</span>
                        <div>
                          <div className="font-black text-sm">
                            {unlocked ? w.name : 'Sampah Belum Ditemukan'}
                          </div>
                          <div className="text-xs font-bold text-[#5A9A3B]">
                            Kategori: {w.category.toUpperCase()} • Waktu Urai: {w.decomposeTime}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 mt-2">
                        {unlocked ? w.eduFact : 'Kumpulkan sampah ini di dunia permainan untuk membuka fakta edukasinya.'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-black text-sm uppercase tracking-wider text-[#8D5B34] mb-2">
                2. Koleksi Produk Hasil Daur Ulang ({discoveredProducts.length} / {CRAFTING_RECIPES.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CRAFTING_RECIPES.map((r) => {
                  const unlocked = discoveredProducts.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl border-2 ${
                        unlocked ? 'bg-white border-[#163824]' : 'bg-stone-200/70 border-stone-300 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{unlocked ? r.icon : '🔒'}</span>
                        <div>
                          <div className="font-black text-sm">{unlocked ? r.name : 'Resep Belum Dibuat'}</div>
                          <div className="text-xs font-bold text-[#F59E0B]">Nilai Jual Dasar: {r.sellPrice} Koin</div>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 mt-2">
                        {unlocked ? r.eduBenefit : 'Buat produk ini di Workshop untuk mencatatnya ke dalam buku koleksi.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 6: PRESTASI & BADGE */}
          {activeModal === 'summary' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#FBC02D] text-[#163824] border-2 border-[#163824]">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Profil Pemain, Badge & Prestasi</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Rekam jejak kontribusi {playerName} dalam membersihkan dan mendaur ulang sampah desa.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#163824] text-white flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <AntoPortrait size={60} />
                  <div>
                    <div className="text-xs text-[#A3E635] font-bold uppercase">Badge Pencapaian Saat Ini</div>
                    <div className="text-xl font-black flex items-center gap-2">
                      <span>{currentBadge.icon}</span>
                      <span>
                        Lv.{currentBadge.level} — {currentBadge.title}
                      </span>
                    </div>
                    <div className="text-xs text-stone-300 mt-0.5">
                      Total Poin: <strong>{points} Poin</strong> • Koin Dimiliki: <strong>{coins} Koin</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Sampah Dikumpulkan', val: stats.totalCollected, icon: '🧹' },
                  { label: 'Sampah Dipilah', val: stats.totalSorted, icon: '♻️' },
                  { label: 'Produk Dibuat', val: stats.totalCrafted, icon: '🛠️' },
                  { label: 'Produk Terjual', val: stats.totalSold, icon: '🪙' },
                ].map((st) => (
                  <div key={st.label} className="p-3 rounded-2xl bg-white border-2 border-[#163824] text-center">
                    <div className="text-2xl">{st.icon}</div>
                    <div className="text-2xl font-black mt-1">{st.val}</div>
                    <div className="text-xs font-bold text-stone-500">{st.label}</div>
                  </div>
                ))}
              </div>

              <h3 className="font-black text-sm uppercase text-stone-600 mb-2">Tingkatan Badge Cycle Craft:</h3>
              <div className="space-y-2">
                {BADGE_TIERS.map((b) => {
                  const achieved = points >= b.minPoints;
                  return (
                    <div
                      key={b.level}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                        achieved ? 'bg-lime-50 border-[#5A9A3B]' : 'bg-stone-100 border-stone-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{b.icon}</span>
                        <div>
                          <div className="font-black text-sm">
                            Lv.{b.level} — {b.title}
                          </div>
                          <div className="text-xs text-stone-500">Syarat: {b.minPoints} Poin</div>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white border">
                        {achieved ? '✓ Tercapai' : '🔒 Terkunci'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 7: PETA AREA */}
          {activeModal === 'map' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#8CC63F] text-[#163824] border-2 border-[#163824]">
                  <MapIcon className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Peta Eksplorasi & Level Area</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Selesaikan target pemilahan sampah untuk membuka seluruh wilayah permainan!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {AREAS_CONFIG.map((area) => {
                  const isUnlocked = unlockedAreaLevel >= area.id;
                  return (
                    <div
                      key={area.id}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                        isUnlocked ? 'bg-white border-[#163824]' : 'bg-stone-200 border-stone-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base">{area.name}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                              isUnlocked ? 'bg-lime-200 text-[#163824]' : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {isUnlocked ? '✓ Terbuka' : `🔒 Butuh ${area.targetSorted} Sampah Terpilah`}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">{area.description}</p>
                      </div>

                      {isUnlocked && screen === 'game' && (
                        <button
                          onClick={() => {
                            if (area.id === 1) {
                              playerRef.current.x = 640;
                              playerRef.current.y = 470;
                            } else if (area.id === 2) {
                              playerRef.current.x = 1480;
                              playerRef.current.y = 470;
                            } else if (area.id === 3) {
                              playerRef.current.x = 750;
                              playerRef.current.y = 1040;
                            }
                            playerRef.current.targetX = null;
                            playerRef.current.targetY = null;
                            setActiveModal(null);
                            sfx.play('click');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#8CC63F] hover:bg-[#5A9A3B] text-[#163824] font-black text-xs border-2 border-[#163824] shrink-0 cursor-pointer"
                        >
                          📍 Kunjungi Area
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODAL 8: PANDUAN & KONTROL */}
          {activeModal === 'controls' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#FBC02D] text-[#163824] border-2 border-[#163824]">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Panduan Bermain & Kontrol (GDD Bab 9.3)</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Dirancang agar nyaman dimainkan menggunakan Keyboard maupun Mouse / Sentuhan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border-2 border-[#163824] space-y-2">
                  <div className="font-black text-base flex items-center gap-2">
                    <Move className="w-5 h-5 text-[#5A9A3B]" /> Kontrol Keyboard
                  </div>
                  <ul className="text-xs space-y-2 text-stone-700">
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">W / A / S / D</strong> atau{' '}
                      <strong>Panah</strong>: Menggerakkan Anto.
                    </li>
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">E</strong> atau{' '}
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">Spasi</strong>: Mengambil sampah terdekat /
                      interaksi fasilitas.
                    </li>
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">P</strong> atau{' '}
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">I</strong>: Membuka Tas & Pemilahan Sampah.
                    </li>
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">C</strong>: Membuka menu Crafting.
                    </li>
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">K</strong>: Membuka Katalog Edukatif.
                    </li>
                    <li>
                      <strong className="px-2 py-0.5 bg-stone-200 rounded">Esc</strong>: Membuka Pengaturan / Jeda.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-[#163824] space-y-2">
                  <div className="font-black text-base flex items-center gap-2">
                    <MousePointer className="w-5 h-5 text-[#F59E0B]" /> Kontrol Mouse & Interaksi
                  </div>
                  <ul className="text-xs space-y-2 text-stone-700">
                    <li>
                      <strong>Klik Kiri di Tanah:</strong> Anto berjalan menuju titik tersebut.
                    </li>
                    <li>
                      <strong>Klik Kiri pada Sampah / Bangunan:</strong> Mengambil sampah atau membuka fasilitas.
                    </li>
                    <li>
                      <strong>Drag & Drop Pemilahan:</strong> Seret item sampah dari karung ke Tong Organik atau
                      Anorganik.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 9: PENGATURAN */}
          {activeModal === 'settings' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-[#163824] text-white border-2 border-[#163824]">
                  <Settings className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Pengaturan Permainan (Settings)</h2>
                  <p className="text-sm font-medium text-stone-600">
                    Sesuaikan nama pemain, efek suara, atau kembali ke layar utama.
                  </p>
                </div>
              </div>

              <div className="space-y-4 bg-white p-4 rounded-2xl border-2 border-[#163824]">
                <div>
                  <label className="block text-xs font-black uppercase text-stone-600 mb-1">
                    Nama Karakter di HUD (Default: Anto / Rifai)
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={18}
                    className="w-full px-3.5 py-2 rounded-xl border-2 border-[#163824] font-bold text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-sm">Efek Suara Interaktif (Web Audio Synthesizer)</div>
                    <div className="text-xs text-stone-500">Suara sapu lidi, pop sampah, crafting, dan koin</div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      sfx.enabled = next;
                    }}
                    className={`px-4 py-2 rounded-xl font-black text-xs border-2 border-[#163824] flex items-center gap-2 cursor-pointer ${
                      soundEnabled ? 'bg-[#8CC63F] text-[#163824]' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {soundEnabled ? 'Aktif' : 'Mati'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-stone-600 mb-1">
                    Volume Suara ({Math.round(soundVolume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSoundVolume(v);
                      sfx.volume = v;
                    }}
                    className="w-full accent-[#5A9A3B]"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-3">
                {screen === 'game' && (
                  <button
                    onClick={() => {
                      saveGameToStorage();
                      setActiveModal(null);
                      setScreen('home');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-[#163824] font-black text-sm border-2 border-[#163824] cursor-pointer"
                  >
                    🏠 Simpan & Ke Menu Utama
                  </button>
                )}

                <button
                  onClick={() => {
                    localStorage.removeItem(SAVE_KEY);
                    setHasSaveData(false);
                    handleStartNewGame();
                    setActiveModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-black text-sm border-2 border-red-800 cursor-pointer"
                >
                  🗑️ Reset Data Progres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 11. IN-GAME HUD & PLAYABLE VIEWPORT
  // ==========================================
  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#163824]">
      {/* 2D Game World Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasTouch}
        className="w-full h-full block cursor-crosshair"
      />

      {/* TOP-LEFT HUD: CHARACTER PORTRAIT, LEVEL, COINS & ECO POINTS */}
      <div className="fixed top-3 left-3 z-20 flex flex-wrap items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-3 bg-[#163824]/95 text-white pr-4 pl-2 py-1.5 rounded-full border-2 border-[#8CC63F] shadow-xl">
          <AntoPortrait size={52} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base leading-none">{playerName}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#8CC63F] text-[#163824] font-black">
                Lv.{currentBadge.level}
              </span>
            </div>
            <div className="text-[11px] text-[#A3E635] font-bold mt-0.5">{currentBadge.title}</div>
            <div className="w-36 h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/20 mt-1 relative">
              <div
                className="h-full bg-gradient-to-r from-[#5A9A3B] to-[#A3E635] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((points / nextBadge.minPoints) * 100))}%`,
                }}
              />
              <span className="absolute inset-0 text-[9px] font-black flex items-center justify-center text-white drop-shadow">
                {points} / {nextBadge.minPoints} Poin
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#163824]/95 text-white px-4 py-2 rounded-full border-2 border-[#FBC02D] shadow-lg">
          <span className="w-6 h-6 rounded-full bg-[#FBC02D] text-[#163824] flex items-center justify-center font-black text-xs">
            ★
          </span>
          <span className="font-black text-base text-[#FDE047]">{coins.toLocaleString('id-ID')}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#163824]/95 text-white px-4 py-2 rounded-full border-2 border-[#5A9A3B] shadow-lg">
          <Leaf className="w-5 h-5 text-[#8CC63F] fill-[#8CC63F]" />
          <span className="font-black text-sm">
            {stats.totalSorted} <span className="text-xs font-normal text-stone-300">Terpilah</span>
          </span>
        </div>
      </div>

      {/* LEFT VERTICAL SIDEBAR BUTTONS */}
      <div className="fixed left-3 top-24 z-20 flex flex-col gap-2.5 pointer-events-auto">
        {[
          {
            id: 'sorting' as const,
            label: 'Tas & Pilah',
            icon: '🎒',
            badge: rawBag.length > 0 ? `${rawBag.length}/${maxSackCapacity}` : undefined,
          },
          { id: 'map' as const, label: 'Peta Area', icon: '🗺️', badge: `Area ${unlockedAreaLevel}` },
          { id: 'catalog' as const, label: 'Katalog', icon: '📖' },
          { id: 'controls' as const, label: 'Kontrol', icon: '🎮' },
          { id: 'settings' as const, label: 'Pengaturan', icon: '⚙️' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => {
              sfx.play('click');
              setActiveModal(btn.id);
            }}
            className="relative group w-16 py-2 rounded-2xl bg-[#163824]/90 hover:bg-[#5A9A3B] text-white border-2 border-[#8CC63F]/60 flex flex-col items-center justify-center shadow-lg transition-all cursor-pointer"
          >
            <span className="text-xl">{btn.icon}</span>
            <span className="text-[10px] font-extrabold mt-0.5">{btn.label}</span>
            {btn.badge && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-[#163824] font-black text-[9px] border border-[#163824]">
                {btn.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TOP-RIGHT HUD: CIRCULAR MINIMAP & DAILY QUESTS PANEL */}
      <div className="fixed top-3 right-3 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Circular Radar Minimap */}
        <div
          onClick={() => setActiveModal('map')}
          title="Klik untuk membuka Peta Area"
          className="relative w-28 h-28 rounded-full bg-[#689F38] border-4 border-[#163824] shadow-xl overflow-hidden cursor-pointer"
        >
          <span className="absolute top-0.5 left-1/2 -translate-x-1/2 z-10 bg-[#163824] text-white text-[9px] font-black px-1.5 rounded-full">
            N
          </span>
          <div className="absolute left-0 right-0 bottom-6 h-2 bg-[#29B6F6]" />
          <div className="absolute left-4 top-6 w-12 h-8 rounded bg-[#E6C699]" />
          <div
            className="absolute w-3 h-3 rounded-full bg-[#FDE047] border-2 border-[#163824] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(playerRef.current.x / 2000) * 100}%`,
              top: `${(playerRef.current.y / 1400) * 100}%`,
            }}
          />
        </div>

        {/* Tugas Hari Ini */}
        <div className="w-64 bg-[#163824]/92 backdrop-blur-xs text-white rounded-2xl border-2 border-[#8CC63F]/70 p-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-black text-xs text-[#FDE047]">
              <Sparkles className="w-4 h-4" />
              <span>Tugas Hari Ini & Target Area</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🧴</span>
                <span>Kumpulkan 5 sampah plastik</span>
              </div>
              <span
                className={`font-black ${
                  stats.plasticCollected >= 5 ? 'text-[#A3E635]' : 'text-stone-300'
                }`}
              >
                {Math.min(5, stats.plasticCollected)}/5
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🍃</span>
                <span>Kumpulkan 5 sampah organik</span>
              </div>
              <span
                className={`font-black ${
                  stats.organicCollected >= 5 ? 'text-[#A3E635]' : 'text-stone-300'
                }`}
              >
                {Math.min(5, stats.organicCollected)}/5
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Buat 1 produk daur ulang</span>
              </div>
              <span
                className={`font-black ${
                  stats.totalCrafted >= 1 ? 'text-[#A3E635]' : 'text-stone-300'
                }`}
              >
                {Math.min(1, stats.totalCrafted)}/1
              </span>
            </div>

            {/* Area Target */}
            <div className="pt-2 border-t border-white/15">
              <div className="flex justify-between text-[11px] font-bold text-[#A3E635] mb-1">
                <span>
                  {unlockedAreaLevel === 1
                    ? 'Target Buka Area 2 (Taman):'
                    : unlockedAreaLevel === 2
                    ? 'Target Buka Area 3 (Sungai):'
                    : 'Semua Area Terbuka!'}
                </span>
                <span>
                  {unlockedAreaLevel === 1
                    ? `${stats.totalSorted}/8 Pilah`
                    : unlockedAreaLevel === 2
                    ? `${stats.totalSorted}/18 Pilah`
                    : '✓ Selesai'}
                </span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FBC02D] transition-all"
                  style={{
                    width: `${
                      unlockedAreaLevel === 1
                        ? Math.min(100, (stats.totalSorted / 8) * 100)
                        : unlockedAreaLevel === 2
                        ? Math.min(100, (stats.totalSorted / 18) * 100)
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING INTERACTION ACTION BUTTON */}
      {nearbyUI && !activeModal && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={triggerNearestInteraction}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#FBC02D] hover:bg-[#F59E0B] text-[#163824] font-black text-sm border-3 border-[#163824] shadow-[0_5px_0_#163824] animate-bounce cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>{nearbyUI.label} [Tekan E / Klik]</span>
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className={`px-5 py-3 rounded-2xl border-3 shadow-2xl flex items-center gap-3 ${
              toast.type === 'warn'
                ? 'bg-amber-100 border-[#163824] text-amber-950'
                : 'bg-[#163824] border-[#8CC63F] text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 text-[#FDE047] shrink-0" />
            <div>
              <div className="font-black text-sm">{toast.text}</div>
              {toast.subtext && <div className="text-xs opacity-90">{toast.subtext}</div>}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM HUD BAR */}
      <div className="fixed bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
        {/* Bottom-Left: Weather & Day */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 bg-[#163824]/95 text-white px-4 py-2.5 rounded-2xl border-2 border-[#8CC63F]/60 shadow-xl">
          <Sun className="w-8 h-8 text-[#FBC02D] fill-[#FBC02D]" />
          <div>
            <div className="font-black text-xs text-[#A3E635]">
              {AREAS_CONFIG[unlockedAreaLevel - 1]?.name}
            </div>
            <div className="text-[11px] text-stone-300">
              Cuaca Cerah • Kontrol: <strong>WASD</strong> / <strong>Klik</strong> • Interaksi: <strong>E</strong>
            </div>
          </div>
        </div>

        {/* Bottom-Center: Inventory Hotbar */}
        <div className="pointer-events-auto mx-auto flex items-center gap-2 bg-[#163824]/95 p-2 rounded-2xl border-2 border-[#8CC63F]/80 shadow-2xl">
          <button
            onClick={() => {
              sfx.play('click');
              setActiveModal('sorting');
            }}
            title="Klik untuk memilah isi Karung Sampah"
            className="relative w-14 h-14 rounded-xl bg-[#F7F4EB] hover:bg-[#FEF9C3] border-2 border-[#163824] flex flex-col items-center justify-center cursor-pointer"
          >
            <span className="text-xl">🎒</span>
            <span className="text-[9px] font-black text-[#163824]">Karung</span>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-[#163824] font-black text-[10px] border border-[#163824]">
              {rawBag.length}/{maxSackCapacity}
            </span>
          </button>

          {[
            { label: 'Organik', icon: '🍃', count: sortedMat.organik },
            { label: 'Plastik', icon: '🧴', count: sortedMat.plastik },
            { label: 'Kertas', icon: '📦', count: sortedMat.kertas },
            { label: 'Logam', icon: '🥫', count: sortedMat.logam },
          ].map((slot) => (
            <div
              key={slot.label}
              onClick={() => setActiveModal('crafting')}
              title={`${slot.label} Terpilah (Siap diolah di Crafting)`}
              className="relative w-13 h-14 rounded-xl bg-[#F7F4EB] border-2 border-[#163824] flex flex-col items-center justify-center cursor-pointer hover:bg-white"
            >
              <span className="text-xl">{slot.icon}</span>
              <span className="text-[9px] font-extrabold text-stone-700">{slot.label}</span>
              <span className="absolute bottom-0.5 right-1 font-black text-[11px] text-[#163824]">
                {slot.count}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom-Right: 4 Primary Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {[
            { id: 'crafting' as const, label: 'Crafting', icon: '🛠️' },
            {
              id: 'shop' as const,
              label: 'Produk',
              icon: '📦',
              badge: Object.values(craftedInventory).reduce((a, b) => a + b, 0) || undefined,
            },
            { id: 'upgrade' as const, label: 'Upgrade', icon: '⬆️' },
            { id: 'summary' as const, label: 'Prestasi', icon: '🏆' },
          ].map((act) => (
            <button
              key={act.id}
              onClick={() => {
                sfx.play('click');
                setActiveModal(act.id);
              }}
              className="relative w-16 h-16 rounded-2xl bg-[#163824]/95 hover:bg-[#5A9A3B] text-white border-2 border-[#8CC63F] flex flex-col items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-2xl">{act.icon}</span>
              <span className="text-[10px] font-black mt-0.5">{act.label}</span>
              {act.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FBC02D] text-[#163824] font-black text-xs flex items-center justify-center border border-[#163824]">
                  {act.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Modal Overlay */}
      {activeModal && renderActiveModal()}
    </div>
  );
}

export default App;
