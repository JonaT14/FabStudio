import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Printer, Zap, Layers, Package, Wrench, QrCode,
  AlertTriangle, CheckCircle2, Clock, Plus, Search,
  RefreshCw, Play, Pause,
  Sparkles, Box, Droplet,
  Scan, Check, X, Flame, Cpu, Download,
  Disc, Cloud, Upload, ExternalLink, Link2, MinusCircle, PlusCircle, Library,
  Wifi, Calculator, Kanban, ClipboardCheck, Map, Power, Camera, Thermometer,
  DollarSign, TrendingUp, ShieldAlert, ArrowRight, Eye, Sliders, Activity
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const GOOGLE_DRIVE_FOLDER_ID = '13rKelLC7tY2SDjm-Ry0sPD_-cRoavn_i';

// --- OFFICIAL BAMBU LAB SPOOL CATALOG (5-DIGIT CODES, HEX, BARCODES) ---
const INITIAL_BAMBU_CATALOG = [
  // --- PLA BASIC ---
  { id: '10100', code: '10100', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Jade White (Blanc)', hex: '#FFFFFF', temp: '190-230°C', qty: 2, opened: 1, barcodes: ['10100', '6975337030001'] },
  { id: '10101', code: '10101', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Black (Noir)', hex: '#18181B', temp: '190-230°C', qty: 3, opened: 1, barcodes: ['10101', '6975337030018'] },
  { id: '10102', code: '10102', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Silver (Argent)', hex: '#A1A1AA', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10102'] },
  { id: '10103', code: '10103', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Gray (Gris)', hex: '#71717A', temp: '190-230°C', qty: 1, opened: 0, barcodes: ['10103'] },
  { id: '10200', code: '10200', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Red (Rouge)', hex: '#DC2626', temp: '190-230°C', qty: 1, opened: 0, barcodes: ['10200'] },
  { id: '10300', code: '10300', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Orange', hex: '#F97316', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10300'] },
  { id: '10400', code: '10400', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Yellow (Jaune)', hex: '#FACC15', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10400'] },
  { id: '10501', code: '10501', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Bambu Green (Vert Bambu)', hex: '#00AE42', temp: '190-230°C', qty: 1, opened: 1, barcodes: ['10501'] },
  { id: '10502', code: '10502', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Mistletoe Green (Vert Sapin)', hex: '#166534', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10502'] },
  { id: '10601', code: '10601', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Blue (Bleu)', hex: '#2563EB', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10601'] },
  { id: '10603', code: '10603', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Cyan', hex: '#06B6D4', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10603'] },
  { id: '10700', code: '10700', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Purple (Violet)', hex: '#7C3AED', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10700'] },
  { id: '10800', code: '10800', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Brown (Marron)', hex: '#78350F', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10800'] },
  { id: '10203', code: '10203', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Pink (Rose)', hex: '#EC4899', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10203'] },
  { id: '10401', code: '10401', brand: 'Bambu Lab', category: 'PLA Basic', name: 'Gold (Or)', hex: '#CA8A04', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['10401'] },

  // --- PLA MATTE ---
  { id: '11100', code: '11100', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Ivory White (Blanc Ivoire Mat)', hex: '#FAF8F5', temp: '190-230°C', qty: 1, opened: 0, barcodes: ['11100'] },
  { id: '11101', code: '11101', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Charcoal (Noir Charbon Mat)', hex: '#27272A', temp: '190-230°C', qty: 2, opened: 1, barcodes: ['11101'] },
  { id: '11102', code: '11102', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Ash Gray (Gris Cendré Mat)', hex: '#9CA3AF', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11102'] },
  { id: '11200', code: '11200', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Scarlet Red (Rouge Écarlate Mat)', hex: '#EF4444', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11200'] },
  { id: '11300', code: '11300', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Mandarin Orange (Orange Mat)', hex: '#FB923C', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11300'] },
  { id: '11400', code: '11400', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Lemon Yellow (Jaune Citron Mat)', hex: '#FDE047', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11400'] },
  { id: '11500', code: '11500', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Grass Green (Vert Prairie Mat)', hex: '#4ADE80', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11500'] },
  { id: '11600', code: '11600', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Marine Blue (Bleu Marine Mat)', hex: '#3B82F6', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11600'] },
  { id: '11800', code: '11800', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Latte Brown (Beige Latte Mat)', hex: '#D6B89A', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11800'] },
  { id: '11801', code: '11801', brand: 'Bambu Lab', category: 'PLA Matte', name: 'Dark Brown (Brun Foncé Mat)', hex: '#5C4033', temp: '190-230°C', qty: 0, opened: 0, barcodes: ['11801'] },

  // --- PETG HF ---
  { id: '33100', code: '33100', brand: 'Bambu Lab', category: 'PETG HF', name: 'White (Blanc PETG HF)', hex: '#F8FAFC', temp: '230-260°C', qty: 1, opened: 0, barcodes: ['33100'] },
  { id: '33101', code: '33101', brand: 'Bambu Lab', category: 'PETG HF', name: 'Black (Noir PETG HF)', hex: '#09090B', temp: '230-260°C', qty: 1, opened: 0, barcodes: ['33101'] },
  { id: '33102', code: '33102', brand: 'Bambu Lab', category: 'PETG HF', name: 'Gray (Gris PETG HF)', hex: '#64748B', temp: '230-260°C', qty: 0, opened: 0, barcodes: ['33102'] },
  { id: '33200', code: '33200', brand: 'Bambu Lab', category: 'PETG HF', name: 'Red (Rouge PETG HF)', hex: '#DC2626', temp: '230-260°C', qty: 0, opened: 0, barcodes: ['33200'] },
  { id: '33600', code: '33600', brand: 'Bambu Lab', category: 'PETG HF', name: 'Blue (Bleu PETG HF)', hex: '#1D4ED8', temp: '230-260°C', qty: 0, opened: 0, barcodes: ['33600'] },

  // --- ABS / ASA ---
  { id: '40100', code: '40100', brand: 'Bambu Lab', category: 'ABS / ASA', name: 'ABS White (Blanc)', hex: '#F1F5F9', temp: '240-270°C', qty: 0, opened: 0, barcodes: ['40100'] },
  { id: '40101', code: '40101', brand: 'Bambu Lab', category: 'ABS / ASA', name: 'ABS Black (Noir)', hex: '#171717', temp: '240-270°C', qty: 0, opened: 0, barcodes: ['40101'] },
  { id: '45100', code: '45100', brand: 'Bambu Lab', category: 'ABS / ASA', name: 'ASA White (Blanc)', hex: '#F8FAFC', temp: '240-280°C', qty: 0, opened: 0, barcodes: ['45100'] },
  { id: '45101', code: '45101', brand: 'Bambu Lab', category: 'ABS / ASA', name: 'ASA Black (Noir)', hex: '#1E293B', temp: '240-280°C', qty: 0, opened: 0, barcodes: ['45101'] },

  // --- TPU & TECHNIQUES (PAHT-CF, PLA-CF, PETG-CF) ---
  { id: '53101', code: '53101', brand: 'Bambu Lab', category: 'TPU / Technique', name: 'TPU 95A HF Black (Noir Souple)', hex: '#262626', temp: '220-240°C', qty: 0, opened: 0, barcodes: ['53101'] },
  { id: '14101', code: '14101', brand: 'Bambu Lab', category: 'TPU / Technique', name: 'PLA-CF Black (Carbone)', hex: '#27272A', temp: '210-240°C', qty: 0, opened: 0, barcodes: ['14101'] },
  { id: '60101', code: '60101', brand: 'Bambu Lab', category: 'TPU / Technique', name: 'PAHT-CF (Nylon Carbone)', hex: '#18181B', temp: '260-290°C', qty: 1, opened: 1, barcodes: ['60101'] }
];

// --- 4/ KANBAN INITIAL TASKS (PRINT & CUT QUEUE) ---
const INITIAL_KANBAN_TASKS = [
  {
    id: 'KAN-101',
    title: 'Boîtier Électronique PAHT-CF (x12)',
    client: 'TechLab Industrie',
    stage: 'printing',
    priority: 'Haute',
    assignedMachine: 'Bambu Lab X1C',
    fileType: '.3mf',
    estTime: '4h 20m',
    material: 'PAHT-CF Noir (#60101)',
    recommendedReason: 'Enceinte fermée + Buse Acier Trempé requise'
  },
  {
    id: 'KAN-102',
    title: 'Trophées Acrylique + Relief UV 3D (x20)',
    client: 'Studio Архитектура',
    stage: 'ready',
    priority: 'Haute',
    assignedMachine: 'eufyMake E1/E2',
    fileType: '.eufy',
    estTime: '2h 15m',
    material: 'Acrylique 3mm + UV CMYK+W+V',
    recommendedReason: 'Mode Texture 3D 1.5mm + Curing LED UV'
  },
  {
    id: 'KAN-103',
    title: '50x Sous-bocks Bouleau Gravés & Découpés',
    client: 'Brasserie Normande',
    stage: 'backlog',
    priority: 'Normale',
    assignedMachine: 'xTool M2',
    fileType: '.xcs',
    estTime: '1h 40m',
    material: 'Bouleau 3mm + Inkjet',
    recommendedReason: 'Combo Inkjet Couleur + Découpe Laser 20W'
  },
  {
    id: 'KAN-104',
    title: 'Porte-clés Logo Série 50',
    client: 'Boutique Interne',
    stage: 'postproc',
    priority: 'Basse',
    assignedMachine: 'Bambu Lab A1',
    fileType: '.3mf',
    estTime: '1h 50m',
    material: 'PLA Basic Cyan & Blanc',
    recommendedReason: 'AMS Lite 4 couleurs rapide'
  },
  {
    id: 'KAN-105',
    title: 'Prototypes Engrenages ASA',
    client: 'MécaNormandie',
    stage: 'done',
    priority: 'Normale',
    assignedMachine: 'Bambu Lab P1S',
    fileType: '.3mf',
    estTime: '3h 10m',
    material: 'ASA Gris Orage',
    recommendedReason: 'Chambre fermée anti-warping ASA'
  }
];

// --- 5/ INITIAL PRINT LOG & FAILURE ANALYSIS ---
const INITIAL_PRINT_LOGS = [
  {
    id: 'LOG-01',
    date: 'Aujourd’hui, 14:20',
    projectName: 'Support Capteur Haute Température',
    machine: 'Bambu Lab X1C',
    material: 'Bambu PAHT-CF (#60101)',
    outcome: 'Succès',
    score: '9.8/10',
    failureCause: null,
    validatedRecipe: 'Buse 290°C • Bed 100°C PEI Texturé + Colle liquide • Vitesse max 120mm/s • Séchage bobine 12h à 80°C',
    notes: 'Aucun stringing, adhérence inter-couche parfaite.',
    swatchHex: '#18181b'
  },
  {
    id: 'LOG-02',
    date: 'Hier, 18:45',
    projectName: 'Plaque Signalétique Relief 2mm',
    machine: 'eufyMake E1/E2 UV',
    material: 'Acrylique Noir + Encre UV W+V',
    outcome: 'Échec Partiel',
    score: '4.5/10',
    failureCause: 'Buse Blanc (W) légèrement obstruée + manque de promoteur adhérence',
    validatedRecipe: 'Agiter cartouche W 2 min + Purge Capping + Dégraissage IPA + Primer Acrylique UV',
    notes: 'Relancé après purge : résultat impeccable au 2e essai.',
    swatchHex: '#a855f7'
  },
  {
    id: 'LOG-03',
    date: 'Il y a 2 jours',
    projectName: 'Coffret Bois Découpé + Impression Couleur',
    machine: 'xTool M2 (20W + Inkjet)',
    material: 'Contreplaqué Bouleau 3mm',
    outcome: 'Succès',
    score: '9.5/10',
    failureCause: null,
    validatedRecipe: 'Passe 1 : Inkjet 600dpi • Passe 2 : Laser 20W 100% / 10 mm/s / Air Assist 100% / Masking tape léger',
    notes: 'Zéro trace de fumée sur l’impression jet d’encre.',
    swatchHex: '#d97706'
  }
];

// --- 6/ DIGITAL TWIN SMART PLUGS & POSITIONS ---
const INITIAL_SMART_PLUGS = {
  'bambu-x1c': { plugName: 'Shelly Plug S #1 (X1C)', isOn: true, watts: 315, kwhToday: 2.84, zone: 'Îlot Impression 3D CoreXY', x: 14, y: 22 },
  'bambu-p1s': { plugName: 'Shelly Plug S #2 (P1S)', isOn: true, watts: 42, kwhToday: 1.45, zone: 'Îlot Impression 3D CoreXY', x: 42, y: 22 },
  'bambu-a1':  { plugName: 'Tapo P115 #3 (A1)', isOn: true, watts: 195, kwhToday: 1.12, zone: 'Établi Rapide PLA/PETG', x: 70, y: 22 },
  'xtool-m2':  { plugName: 'Shelly Plug S #4 (xTool + Extracteur)', isOn: true, watts: 68, kwhToday: 0.95, zone: 'Zone Laser & Aspiration', x: 24, y: 64 },
  'eufy-e1':   { plugName: 'Tapo P115 #5 (eufyMake UV)', isOn: true, watts: 85, kwhToday: 0.78, zone: 'Studio Impression UV Relief', x: 62, y: 64 }
};

// --- INITIAL MOCK DATA FOR THE USER'S EXACT HARDWARE ---
const INITIAL_MACHINES = [
  {
    id: 'bambu-x1c',
    name: 'Bambu Lab X1 Carbon',
    shortName: 'X1C',
    category: 'FDM CoreXY + Lidar',
    status: 'Impression',
    currentJob: 'Boîtier_Electronique_PAHT-CF.3mf',
    progress: 68,
    eta: '42 min',
    hours: 842,
    nozzle: '0.4mm Acier Trempé',
    plate: 'Textured PEI Plate',
    amsHumidity: 18,
    amsSlots: [
      { slot: 'A1', type: 'PLA Matte', colorName: 'Charcoal', hex: '#27272a', remain: 82 },
      { slot: 'A2', type: 'PETG HF', colorName: 'Blanc', hex: '#f8fafc', remain: 45 },
      { slot: 'A3', type: 'PAHT-CF', colorName: 'Carbone Noir', hex: '#18181b', remain: 60 },
      { slot: 'A4', type: 'Support PLA', colorName: 'Naturel', hex: '#fef3c7', remain: 90 }
    ]
  },
  {
    id: 'bambu-p1s',
    name: 'Bambu Lab P1S Combo',
    shortName: 'P1S',
    category: 'FDM CoreXY Enceinte',
    status: 'Prête',
    currentJob: 'En attente de scan QR...',
    progress: 0,
    eta: '--',
    hours: 518,
    nozzle: '0.4mm Inox',
    plate: 'Cool Plate / PEI',
    amsHumidity: 24,
    amsSlots: [
      { slot: 'B1', type: 'PLA Basic', colorName: 'Vert Bambu', hex: '#10b981', remain: 95 },
      { slot: 'B2', type: 'PLA Silk', colorName: 'Or Royal', hex: '#eab308', remain: 30 },
      { slot: 'B3', type: 'ASA', colorName: 'Gris Orage', hex: '#64748b', remain: 75 },
      { slot: 'B4', type: 'PLA Matte', colorName: 'Rouge', hex: '#ef4444', remain: 15 }
    ]
  },
  {
    id: 'bambu-a1',
    name: 'Bambu Lab A1 + AMS Lite',
    shortName: 'A1',
    category: 'FDM Bedslinger Rapide',
    status: 'Impression',
    currentJob: 'Porte_Cles_Logo_Serie50.3mf',
    progress: 91,
    eta: '8 min',
    hours: 310,
    nozzle: '0.4mm Quick-Swap Inox',
    plate: 'Textured PEI A1',
    amsHumidity: null,
    amsSlots: [
      { slot: 'L1', type: 'PLA Basic', colorName: 'Bleu Cyan', hex: '#06b6d4', remain: 50 },
      { slot: 'L2', type: 'PLA Basic', colorName: 'Blanc Jade', hex: '#ffffff', remain: 88 },
      { slot: 'L3', type: 'PLA Matte', colorName: ' Jaune Citron', hex: '#facc15', remain: 40 },
      { slot: 'L4', type: 'PLA Basic', colorName: 'Noir', hex: '#09090b', remain: 70 }
    ]
  },
  {
    id: 'xtool-m2',
    name: 'xTool M2 (Laser 20W + Lame + Inkjet)',
    shortName: 'xTool M2',
    category: 'Hybride Laser Diode 20W & Impression',
    status: 'Prête',
    currentJob: 'Prête pour gravure/découpe',
    progress: 0,
    eta: '--',
    hours: 194,
    moduleInstalled: 'Tête Laser Diode 20W + Module Encre',
    airAssist: 'Auto (Actif)',
    inkLevel: 64,
    lensState: 'Propre (Contrôlée il y a 6h)'
  },
  {
    id: 'eufy-e1',
    name: 'eufyMake E1 / E2 UV Printer',
    shortName: 'eufyMake UV',
    category: 'Imprimante UV Texture 3D & Relief',
    status: 'Maintenance Requise',
    currentJob: 'Vérification buses UV avant tirage',
    progress: 0,
    eta: '--',
    hours: 126,
    uvLampHealth: 96,
    channels: [
      { code: 'C', name: 'Cyan UV', hex: '#06b6d4', level: 78 },
      { code: 'M', name: 'Magenta UV', hex: '#ec4899', level: 65 },
      { code: 'Y', name: 'Jaune UV', hex: '#eab308', level: 82 },
      { code: 'K', name: 'Noir UV', hex: '#18181b', level: 54 },
      { code: 'W', name: 'Blanc Relief 3D', hex: '#f8fafc', level: 19 },
      { code: 'V', name: 'Vernis Gloss UV', hex: '#a855f7', level: 24 }
    ]
  }
];

const INITIAL_INVENTORY = [
  // Encres & Consommables xTool M2 + eufyMake E1
  {
    id: 'inv-1',
    name: 'Cartouche UV Blanc (W) - eufyMake E1',
    category: 'Encre UV & Jet',
    subType: 'UV White (Relief)',
    brand: 'eufyMake',
    colorHex: '#f8fafc',
    machineCompat: ['eufyMake E1'],
    stock: 19,
    maxCap: 100,
    unit: '%',
    spoolsCount: 0,
    alertAt: 25,
    location: 'Machine eufyMake E1',
    notes: 'Utilisé en forte quantité pour les textures 3D'
  },
  {
    id: 'inv-2',
    name: 'Cartouche UV Vernis (V) - eufyMake E1',
    category: 'Encre UV & Jet',
    subType: 'UV Gloss Varnish',
    brand: 'eufyMake',
    colorHex: '#a855f7',
    machineCompat: ['eufyMake E1'],
    stock: 24,
    maxCap: 100,
    unit: '%',
    spoolsCount: 1,
    alertAt: 25,
    location: 'Armoire Chimie UV',
    notes: '1 cartouche neuve d’avance'
  },
  {
    id: 'inv-3',
    name: 'Cartouche Tête d’impression Couleur xTool',
    category: 'Encre UV & Jet',
    subType: 'CMYK Inkjet',
    brand: 'xTool',
    colorHex: '#ec4899',
    machineCompat: ['xTool M2'],
    stock: 64,
    maxCap: 100,
    unit: '%',
    spoolsCount: 1,
    alertAt: 20,
    location: 'Tiroir xTool M2',
    notes: 'Toujours remettre le capuchon silicone après usage'
  },

  // Supports Laser & UV
  {
    id: 'inv-4',
    name: 'Contreplaqué Bouleau 3mm (300x300mm)',
    category: 'Supports Laser & UV',
    subType: 'Bois Découpe',
    brand: 'xTool Selected',
    colorHex: '#d97706',
    machineCompat: ['xTool M2'],
    stock: 14,
    maxCap: 50,
    unit: 'plaques',
    spoolsCount: 14,
    alertAt: 10,
    location: 'Rack Bois B1',
    notes: 'Découpe 20W : 100% puissance / 10 mm/s / 1 passe'
  },
  {
    id: 'inv-5',
    name: 'Acrylique Noir Opaque 3mm (Cast)',
    category: 'Supports Laser & UV',
    subType: 'Acrylique',
    brand: ' LaserGrade',
    colorHex: '#18181b',
    machineCompat: ['xTool M2', 'eufyMake E1'],
    stock: 4,
    maxCap: 20,
    unit: 'plaques',
    spoolsCount: 4,
    alertAt: 5,
    location: 'Rack Acrylique A2',
    notes: 'Compatible découpe diode 20W ET impression directe eufyMake E1'
  },
  {
    id: 'inv-6',
    name: 'Dessous de verre Ardoise Naturelle (x4)',
    category: 'Supports Laser & UV',
    subType: 'Ardoise',
    brand: 'Atelier',
    colorHex: '#475569',
    machineCompat: ['xTool M2', 'eufyMake E1'],
    stock: 28,
    maxCap: 60,
    unit: 'pièces',
    spoolsCount: 28,
    alertAt: 12,
    location: 'Bac Ardoise',
    notes: 'Superbe rendu en gravure laser ou impression UV relief'
  },

  // Pièces de remplacement & Entretien
  {
    id: 'inv-7',
    name: 'Hotend Complet 0.4mm Acier Trempé (X1C/P1S)',
    category: 'Pièces & Entretien',
    subType: 'Buse / Hotend',
    brand: 'Bambu Lab',
    colorHex: '#3b82f6',
    machineCompat: ['X1C', 'P1S'],
    stock: 2,
    maxCap: 4,
    unit: 'pièces',
    spoolsCount: 2,
    alertAt: 1,
    location: 'Boîte Spare Bambu #1',
    notes: 'Assemblé avec ventilateur et thermistance'
  },
  {
    id: 'inv-7b',
    name: 'Plateau Textured PEI Plate Gold (X1C / P1S / A1)',
    category: 'Pièces & Entretien',
    subType: 'Plateau PEI',
    brand: 'Bambu Lab',
    colorHex: '#eab308',
    machineCompat: ['X1C', 'P1S', 'A1'],
    stock: 3,
    maxCap: 5,
    unit: 'plateaux',
    spoolsCount: 3,
    alertAt: 1,
    location: 'Rack Plateaux Magnétiques',
    notes: 'Laver à l’eau chaude + liquide vaisselle sans parfum'
  },
  {
    id: 'inv-8',
    name: 'Buse Quick-Swap 0.4mm Acier Trempé (Série A1)',
    category: 'Pièces & Entretien',
    subType: 'Buse A1',
    brand: 'Bambu Lab',
    colorHex: '#06b6d4',
    machineCompat: ['A1'],
    stock: 1,
    maxCap: 4,
    unit: 'pièces',
    spoolsCount: 1,
    alertAt: 1,
    location: 'Boîte Spare Bambu #2',
    notes: 'Changement magnétique sans outil'
  },
  {
    id: 'inv-9',
    name: 'Coupe-filament (Cutter Blade) + Essuyeur Silicone',
    category: 'Pièces & Entretien',
    subType: 'Consommable Tête',
    brand: 'Bambu Lab',
    colorHex: '#64748b',
    machineCompat: ['X1C', 'P1S', 'A1'],
    stock: 6,
    maxCap: 10,
    unit: 'kits',
    spoolsCount: 6,
    alertAt: 2,
    location: 'Boîte Spare Bambu #1',
    notes: 'Remplacer dès que l’AMS signale une erreur de coupe'
  },
  {
    id: 'inv-10',
    name: 'Fenêtre Protectrice / Lentille Laser 20W xTool',
    category: 'Pièces & Entretien',
    subType: 'Optique Laser',
    brand: 'xTool',
    colorHex: '#f59e0b',
    machineCompat: ['xTool M2'],
    stock: 3,
    maxCap: 5,
    unit: 'lentilles',
    spoolsCount: 3,
    alertAt: 1,
    location: 'Coffret Optique Laser',
    notes: 'À changer si trace de brûlure persistante après IPA'
  },
  {
    id: 'inv-11',
    name: 'Liquide de Nettoyage & Purge UV + Bâtonnets Mousse',
    category: 'Pièces & Entretien',
    subType: 'Maintenance UV',
    brand: 'eufyMake',
    colorHex: '#a855f7',
    machineCompat: ['eufyMake E1'],
    stock: 1,
    maxCap: 3,
    unit: 'flacons',
    spoolsCount: 1,
    alertAt: 1,
    location: 'Armoire Chimie UV',
    notes: 'Pour nettoyage station de capping et tour de tête UV'
  },
  {
    id: 'inv-12',
    name: 'Sachets Dessiccant Silice Régénérable (AMS)',
    category: 'Pièces & Entretien',
    subType: 'Séchage Filament',
    brand: 'Atelier',
    colorHex: '#f97316',
    machineCompat: ['X1C', 'P1S'],
    stock: 8,
    maxCap: 12,
    unit: 'sachets',
    spoolsCount: 8,
    alertAt: 4,
    location: 'Boîte Hermétique Orange',
    notes: 'Régénérer au déshydrateur à 70°C pendant 3h'
  }
];

const INITIAL_MAINTENANCE = [
  {
    id: 'maint-1',
    machine: 'Bambu Lab X1C',
    badgeColor: 'emerald',
    title: 'Nettoyage des tiges carbone X (Alcool IPA 99%)',
    warning: 'INTERDIT DE GRAISSER les tiges carbone ! Uniquement chiffon microfibre + IPA.',
    intervalHours: 150,
    hoursSinceLast: 142,
    lastDone: 'Il y a 18 jours',
    requiredPart: 'Alcool Isopropylique IPA 99%'
  },
  {
    id: 'maint-2',
    machine: 'Bambu Lab P1S',
    badgeColor: 'teal',
    title: 'Lubrification des 3 vis trapézoïdales axe Z',
    warning: 'Nettoyer les anciens résidus avant d’appliquer la graisse PTFE blanche.',
    intervalHours: 200,
    hoursSinceLast: 195,
    lastDone: 'Il y a 1 mois',
    requiredPart: 'Graisse Synthétique PTFE'
  },
  {
    id: 'maint-3',
    machine: 'Bambu Lab A1',
    badgeColor: 'cyan',
    title: 'Graissage de l’axe Z + Huilage rail Y & serrage buse',
    warning: 'Graisser les vis Z et vérifier les 3 vis arrière du bloc chauffant A1.',
    intervalHours: 120,
    hoursSinceLast: 108,
    lastDone: 'Il y a 9 jours',
    requiredPart: 'Graisse PTFE + Huile Super Lube'
  },
  {
    id: 'maint-4',
    machine: 'xTool M2 (20W + Inkjet)',
    badgeColor: 'amber',
    title: 'Nettoyage lentille laser 20W, buse Air Assist & grille',
    warning: 'La fumée de découpe bois encrasse l’optique et fait perdre jusqu’à 30% de puissance.',
    intervalHours: 25,
    hoursSinceLast: 24,
    lastDone: 'Il y a 4 jours',
    requiredPart: 'Cotons-tiges optiques + IPA'
  },
  {
    id: 'maint-5',
    machine: 'eufyMake E1 UV',
    badgeColor: 'purple',
    title: 'Agitation cartouche Encre Blanche (W) & Purge Capping',
    warning: 'Le dioxyde de titane de l’encre blanche UV sédimente si non brassé régulièrement.',
    intervalHours: 24,
    hoursSinceLast: 26,
    lastDone: 'Hier matin',
    requiredPart: 'Liquide de nettoyage UV + Gants'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'CMD-2026-104',
    client: 'Studio Архитектура / K. Moreau',
    productName: '20x Trophées Acrylique Découpés + Relief UV Couleur + Socle 3D',
    dueDate: 'Demain 14:00',
    priority: 'Haute',
    targetMachine: 'eufyMake E1',
    secondaryMachines: ['xTool M2', 'Bambu Lab X1C'],
    materialSpec: 'Acrylique Noir 3mm + UV Blanc/Vernis + Socle PLA Matte Charcoal',
    fileName: 'Trophee_Relief_UV_v3.eufy',
    presetParams: 'Mode Relief 3D (1.5mm) • CMYK+W+V • Curing UV 100%',
    status: 'Prêt à flasher'
  },
  {
    id: 'CMD-2026-105',
    client: 'Brasserie Normande',
    productName: '50x Sous-bocks Contreplaqué Gravés & Imprimés',
    dueDate: 'Jeudi',
    priority: 'Normale',
    targetMachine: 'xTool M2',
    secondaryMachines: [],
    materialSpec: 'Contreplaqué Bouleau 3mm + Module Inkjet + Laser 20W',
    fileName: 'SousBocks_Brasserie_50x.xcs',
    presetParams: 'Inkjet Couleur 600dpi puis Découpe 20W (100% / 10mm/s)',
    status: 'En file d’attente'
  },
  {
    id: 'CMD-2026-106',
    client: 'TechLab Industrie',
    productName: '12x Supports Capteurs Haute Température',
    dueDate: 'Vendredi',
    priority: 'Haute',
    targetMachine: 'Bambu Lab X1C',
    secondaryMachines: ['Bambu Lab P1S'],
    materialSpec: 'Bambu PAHT-CF (Slot A3) • Buse 0.4mm Trempée',
    fileName: 'Support_Capteur_PAHT_x12.3mf',
    presetParams: 'Buse 290°C • Plateau 100°C • Enceinte fermée • 4 périmètres',
    status: 'En cours (68%)'
  }
];

// --- HELPER: DETERMINISTIC SVG QR CODE GENERATOR ---
function QRCodePattern({ value, size = 128 }) {
  const gridSize = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    let seed = Math.abs(hash);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= gridSize - 8;
        const inBottomLeft = r >= gridSize - 8 && c < 8;
        if (!inTopLeft && !inTopRight && !inBottomLeft) {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          matrix[r][c] = (seed & 3) !== 0;
        }
      }
    }
    return matrix;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className="bg-white p-2 rounded-lg shadow-inner border border-zinc-200"
      shapeRendering="crispEdges"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#09090b" /> : null
        )
      )}
    </svg>
  );
}

export default function FabStudioOS() {
  const [activeTab, setActiveTab] = useState('bambu-spools');
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [maintenance, setMaintenance] = useState(INITIAL_MAINTENANCE);
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  // --- BAMBU LAB SPOOL MODULE STATES ---
  const [bambuCatalog, setBambuCatalog] = useState(INITIAL_BAMBU_CATALOG);
  const [spoolViewTab, setSpoolViewTab] = useState('stock');
  const [spoolMaterialFilter, setSpoolMaterialFilter] = useState('ALL');
  const [spoolSearch, setSpoolSearch] = useState('');
  const [spoolScannerModal, setSpoolScannerModal] = useState(false);
  const [spoolScannerMode, setSpoolScannerMode] = useState('IN');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [pendingBarcode, setPendingBarcode] = useState(null);
  const [selectedAssignFilamentId, setSelectedAssignFilamentId] = useState(INITIAL_BAMBU_CATALOG[0].id);
  const [showCustomSpoolModal, setShowCustomSpoolModal] = useState(false);
  const [customSpoolForm, setCustomSpoolForm] = useState({
    category: 'PLA Basic',
    name: '',
    hex: '#00AE42',
    code: ''
  });

  // --- CLOUD & GOOGLE DRIVE SYNC STATES ---
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [gasWebhookUrl, setGasWebhookUrl] = useState('');
  const [cloudStatus, setCloudStatus] = useState({ state: 'connecting', label: 'Connexion...' });
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const dbRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const qrScannerInstanceRef = useRef(null);

  // Filters & UI states
  const [invCategory, setInvCategory] = useState('Tous');
  const [invSearch, setInvSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(INITIAL_ORDERS[0]);
  const [scannerModalOrder, setScannerModalOrder] = useState(null);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [toast, setToast] = useState(null);

  // Modals for adding items/orders
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Encre UV & Jet',
    subType: 'UV Ink',
    brand: 'eufyMake',
    colorHex: '#10b981',
    stock: 100,
    maxCap: 100,
    unit: '%',
    spoolsCount: 1,
    alertAt: 25,
    machineCompat: 'eufyMake E1',
    location: 'Armoire Chimie UV',
    notes: ''
  });

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    client: '',
    productName: '',
    targetMachine: 'Bambu Lab X1C',
    materialSpec: 'PLA Matte Noir • Buse 0.4mm',
    fileName: 'Piece_Client_v1.3mf',
    presetParams: '0.20mm Standard • 15% Gyroid • PEI Texturé',
    priority: 'Normale',
    dueDate: 'Demain 17:00'
  });

  // Smart Param Advisor State
  const [advisorMachine, setAdvisorMachine] = useState('xTool M2');
  const [advisorMaterial, setAdvisorMaterial] = useState('Contreplaqué Bouleau 3mm');

  // --- NEW MODULE 1: LIVE CLOUD / LAN / MQTT CONNECTION STATES ---
  const [liveTelemetryActive, setLiveTelemetryActive] = useState(true);
  const [liveConnections, setLiveConnections] = useState({
    bambuCloud: { connected: true, mode: 'Bambu Cloud + LAN MQTT', account: 'atelier@bambulab.eu', latency: '24 ms', amsSync: 'RFID Temps Réel Actif' },
    xtoolLink: { connected: true, mode: 'xTool Creative Space Wi-Fi', ip: '192.168.1.48', airAssist: 'Auto 100%', purifier: 'Actif' },
    eufyLink: { connected: true, mode: 'eufyMake Studio Cloud (E1/E2)', ip: '192.168.1.52', uvCuring: 'LED Dual-UV OK', autoClean: 'Programmé (12h)' }
  });
  const [liveTemps, setLiveTemps] = useState({
    'bambu-x1c': { nozzle: 288, targetNozzle: 290, bed: 100, chamber: 52 },
    'bambu-p1s': { nozzle: 24, targetNozzle: 0, bed: 25, chamber: 26 },
    'bambu-a1':  { nozzle: 220, targetNozzle: 220, bed: 60, chamber: null }
  });

  // --- NEW MODULE 2: FORGECALC-INSPIRED COST & PRICING CALCULATOR ---
  const [calcForm, setCalcForm] = useState({
    projectName: 'Trophée Sur-Mesure / Pièce Série',
    processType: '3d', // '3d', 'laser', 'uv', 'hybrid'
    selectedMachineId: 'bambu-x1c',
    selectedSpoolId: '10101',
    filamentPricePerKg: 24.99,
    weightGrams: 145,
    wasteFactorPct: 8, // purge AMS / supports
    uvInkMl: 4.5,
    uvInkCostPerMl: 0.85,
    sheetMaterialCost: 3.50,
    printHours: 3.5,
    powerWatts: 310,
    elecRateKwh: 0.2516, // Tarif EDF France moyen
    machinePurchasePrice: 1499,
    machineLifespanHours: 4000,
    prepMinutes: 15,
    postProcMinutes: 10,
    hourlyLaborRate: 35,
    failureRatePct: 5,
    packagingCost: 1.50,
    marginMultiplier: 2.5,
    vatPct: 20,
    quantity: 10
  });

  // --- NEW MODULE 4: KANBAN QUEUE STATE ---
  const [kanbanTasks, setKanbanTasks] = useState(INITIAL_KANBAN_TASKS);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [showNewKanbanModal, setShowNewKanbanModal] = useState(false);
  const [newKanbanForm, setNewKanbanForm] = useState({
    title: '',
    client: '',
    priority: 'Normale',
    assignedMachine: 'Bambu Lab X1C',
    fileType: '.3mf',
    estTime: '2h 00m',
    material: 'PLA Basic Noir'
  });

  // --- NEW MODULE 5: PRINT LOG & QUALITY JOURNAL STATE ---
  const [printLogs, setPrintLogs] = useState(INITIAL_PRINT_LOGS);
  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [newLogForm, setNewLogForm] = useState({
    projectName: '',
    machine: 'Bambu Lab X1C',
    material: 'PLA Matte Charcoal',
    outcome: 'Succès',
    score: '9.5/10',
    failureCause: '',
    validatedRecipe: '',
    notes: ''
  });

  // --- NEW MODULE 6: DIGITAL TWIN & SMART PLUGS STATE ---
  const [smartPlugs, setSmartPlugs] = useState(INITIAL_SMART_PLUGS);
  const [selectedTwinMachineId, setSelectedTwinMachineId] = useState('bambu-x1c');

  // Live telemetry micro-fluctuation effect
  useEffect(() => {
    if (!liveTelemetryActive) return;
    const interval = setInterval(() => {
      setLiveTemps(prev => ({
        ...prev,
        'bambu-x1c': {
          ...prev['bambu-x1c'],
          nozzle: 289 + Math.round(Math.random() * 2)
        },
        'bambu-a1': {
          ...prev['bambu-a1'],
          nozzle: 219 + Math.round(Math.random() * 2)
        }
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [liveTelemetryActive]);

  // ForgeCalc Computed Breakdown
  const forgeCalcBreakdown = useMemo(() => {
    const effectiveWeight = calcForm.weightGrams * (1 + calcForm.wasteFactorPct / 100);
    const filamentCost = (effectiveWeight / 1000) * calcForm.filamentPricePerKg;
    const uvCost = (calcForm.processType === 'uv' || calcForm.processType === 'hybrid')
      ? calcForm.uvInkMl * calcForm.uvInkCostPerMl
      : 0;
    const sheetCost = (calcForm.processType === 'laser' || calcForm.processType === 'uv' || calcForm.processType === 'hybrid')
      ? Number(calcForm.sheetMaterialCost)
      : 0;
    const rawMaterialTotal = filamentCost + uvCost + sheetCost;

    const energyKwh = (calcForm.powerWatts / 1000) * calcForm.printHours;
    const electricityCost = energyKwh * calcForm.elecRateKwh;
    const depreciationCost = (calcForm.machinePurchasePrice / Math.max(1, calcForm.machineLifespanHours)) * calcForm.printHours;
    const machineTotal = electricityCost + depreciationCost;

    const totalLaborHours = (Number(calcForm.prepMinutes) + Number(calcForm.postProcMinutes)) / 60;
    const laborCost = totalLaborHours * calcForm.hourlyLaborRate;

    const subtotal = rawMaterialTotal + machineTotal + laborCost + Number(calcForm.packagingCost);
    const failureBuffer = subtotal * (calcForm.failureRatePct / 100);
    const unitCostRevient = subtotal + failureBuffer;

    const unitPriceHT = unitCostRevient * calcForm.marginMultiplier;
    const unitPriceTTC = unitPriceHT * (1 + calcForm.vatPct / 100);
    const netProfitPerUnit = unitPriceHT - unitCostRevient;

    return {
      effectiveWeight: effectiveWeight.toFixed(1),
      rawMaterialTotal: rawMaterialTotal.toFixed(2),
      electricityCost: electricityCost.toFixed(2),
      depreciationCost: depreciationCost.toFixed(2),
      machineTotal: machineTotal.toFixed(2),
      laborCost: laborCost.toFixed(2),
      failureBuffer: failureBuffer.toFixed(2),
      unitCostRevient: unitCostRevient.toFixed(2),
      unitPriceHT: unitPriceHT.toFixed(2),
      unitPriceTTC: unitPriceTTC.toFixed(2),
      netProfitPerUnit: netProfitPerUnit.toFixed(2),
      batchTotalHT: (unitPriceHT * calcForm.quantity).toFixed(2),
      batchTotalTTC: (unitPriceTTC * calcForm.quantity).toFixed(2),
      batchProfit: (netProfitPerUnit * calcForm.quantity).toFixed(2)
    };
  }, [calcForm]);

  // Toggle Smart Plug Power in Digital Twin
  const toggleSmartPlug = (machineId) => {
    setSmartPlugs(prev => {
      const current = prev[machineId];
      const nextState = !current.isOn;
      triggerToast(
        `${current.plugName} : Alimentation ${nextState ? 'ACTIVÉE (ON)' : 'COUPÉE (OFF)'}`,
        nextState ? 'success' : 'error'
      );
      return {
        ...prev,
        [machineId]: {
          ...current,
          isOn: nextState,
          watts: nextState ? (machineId === 'bambu-x1c' ? 315 : 65) : 0
        }
      };
    });
  };

  // Move Kanban Card
  const moveKanbanTask = (taskId, newStage) => {
    setKanbanTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, stage: newStage } : t))
    );
    triggerToast('File de production Kanban mise à jour');
  };

  const handleCreateKanbanTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: `KAN-${Math.floor(200 + Math.random() * 799)}`,
      ...newKanbanForm,
      stage: 'backlog',
      recommendedReason: 'Assigné selon disponibilité parc'
    };
    setKanbanTasks([newTask, ...kanbanTasks]);
    setShowNewKanbanModal(false);
    triggerToast(`Projet "${newTask.title}" ajouté au Kanban`);
  };

  const handleCreatePrintLog = (e) => {
    e.preventDefault();
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      date: "Aujourd'hui",
      ...newLogForm,
      swatchHex: newLogForm.outcome === 'Succès' ? '#10b981' : '#f43f5e'
    };
    setPrintLogs([newLog, ...printLogs]);
    setShowNewLogModal(false);
    triggerToast('Entrée ajoutée au Journal Qualité & Print Log');
  };

  const triggerToast = (message, type = 'success', customHex = null) => {
    setToast({ message, type, customHex });
    setTimeout(() => setToast(null), 3500);
  };

  // --- INITIALIZE FIREBASE CLOUD SYNC + GOOGLE DRIVE FOLDER LINK ---
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const initFirebaseSync = async () => {
      try {
        if (typeof __firebase_config === 'undefined') {
          setCloudStatus({ state: 'local', label: 'Prêt (Drive)' });
          return;
        }
        const firebaseConfig = JSON.parse(__firebase_config);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'bambu-spool-manager';
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        dbRef.current = { db, appId };

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
        });

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const stockDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'bambu_drive_inventory', GOOGLE_DRIVE_FOLDER_ID);

        unsubscribeSnapshot = onSnapshot(
          stockDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              isRemoteUpdateRef.current = true;
              if (data.catalogJson) {
                try {
                  const parsed = JSON.parse(data.catalogJson);
                  if (Array.isArray(parsed)) setBambuCatalog(parsed);
                } catch (e) {}
              }
              if (data.gasWebhookUrl !== undefined) {
                setGasWebhookUrl(data.gasWebhookUrl);
              }
              if (data.updatedAt) {
                const timeStr = new Date(data.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                setLastSyncTime(`Synchro Cloud à ${timeStr}`);
              }
              isRemoteUpdateRef.current = false;
              setCloudStatus({ state: 'online', label: 'Synchro Active' });
            } else {
              setCloudStatus({ state: 'online', label: 'Synchro Active' });
            }
          },
          (err) => {
            console.error('Erreur de synchronisation Cloud :', err);
            setCloudStatus({ state: 'local', label: 'Mode Drive' });
          }
        );
      } catch (err) {
        console.error('Init Cloud :', err);
        setCloudStatus({ state: 'local', label: 'Prêt (Drive)' });
      }
    };

    initFirebaseSync();
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Save catalog to Cloud & Google Drive Webhook
  const pushSpoolCatalogToCloudAndDrive = async (updatedCatalog, customWebhook = gasWebhookUrl, manualFeedback = false) => {
    if (isRemoteUpdateRef.current) return;
    setCloudStatus({ state: 'syncing', label: 'Sauvegarde...' });

    const nowIso = new Date().toISOString();
    const payload = {
      driveFolderId: GOOGLE_DRIVE_FOLDER_ID,
      updatedAt: nowIso,
      updatedBy: firebaseUser ? firebaseUser.uid : 'atelier-user',
      gasWebhookUrl: customWebhook || '',
      catalogJson: JSON.stringify(updatedCatalog)
    };

    try {
      if (firebaseUser && dbRef.current) {
        const { db, appId } = dbRef.current;
        const stockDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'bambu_drive_inventory', GOOGLE_DRIVE_FOLDER_ID);
        await setDoc(stockDocRef, payload);
      }

      if (customWebhook) {
        await fetch(customWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            folderId: GOOGLE_DRIVE_FOLDER_ID,
            updatedAt: nowIso,
            stockOnly: updatedCatalog.filter(i => i.qty > 0),
            fullCatalog: updatedCatalog
          })
        });
      }

      const timeStr = new Date(nowIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Synchro Cloud à ${timeStr}`);
      setCloudStatus({ state: 'online', label: 'Sauvegardé' });

      if (manualFeedback) {
        triggerToast('Stock sauvegardé dans le Cloud et envoyé vers Google Drive !');
      }
    } catch (e) {
      console.error('Erreur sauvegarde Cloud/Drive :', e);
      setCloudStatus({ state: 'local', label: 'Mode Local' });
    }
  };

  // --- IPHONE CAMERA BARCODE / QR SCANNER (HTML5-QRCODE DYNAMIC LOADER) ---
  useEffect(() => {
    if (!spoolScannerModal) {
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current.stop().then(() => {
          qrScannerInstanceRef.current.clear();
          qrScannerInstanceRef.current = null;
        }).catch(() => {
          qrScannerInstanceRef.current = null;
        });
      }
      return;
    }

    let isMounted = true;

    const launchCamera = () => {
      if (!isMounted || !window.Html5Qrcode) return;
      try {
        const scanner = new window.Html5Qrcode('bambu-iphone-reader');
        qrScannerInstanceRef.current = scanner;
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 120 } },
          (decodedText) => {
            handleProcessScannedSpoolCode(decodedText);
          },
          () => {}
        ).catch(() => {});
      } catch (e) {}
    };

    if (window.Html5Qrcode) {
      setTimeout(launchCamera, 150);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      script.onload = () => setTimeout(launchCamera, 150);
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current.stop().catch(() => {});
        qrScannerInstanceRef.current = null;
      }
    };
  }, [spoolScannerModal]);

  // Adjust Bambu Spool Stock (+1 / -1)
  const adjustBambuSpoolQty = (id, delta) => {
    const target = bambuCatalog.find(f => f.id === id);
    if (!target) return;

    if (delta < 0 && target.qty <= 0) {
      triggerToast(`Aucune bobine de ${target.name} en stock !`, 'error', '#F43F5E');
      return;
    }

    const updated = bambuCatalog.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    });

    setBambuCatalog(updated);
    const newQty = Math.max(0, target.qty + delta);

    if (delta > 0) {
      triggerToast(`+1 ${target.category} ${target.name} (Stock : ${newQty})`, 'success', target.hex);
    } else {
      triggerToast(`-1 ${target.category} ${target.name} retirée (Reste : ${newQty})`, 'success', '#F43F5E');
    }

    pushSpoolCatalogToCloudAndDrive(updated);
  };

  // Process barcode or 5-digit Bambu code
  const handleProcessScannedSpoolCode = (rawCode) => {
    const cleanCode = String(rawCode || '').trim();
    if (!cleanCode) return;

    const found = bambuCatalog.find(item =>
      item.code === cleanCode ||
      item.barcodes.includes(cleanCode) ||
      cleanCode.includes(item.code)
    );

    if (found) {
      const delta = spoolScannerMode === 'IN' ? 1 : -1;
      adjustBambuSpoolQty(found.id, delta);
      setSpoolScannerModal(false);
      setManualBarcodeInput('');
    } else {
      setSpoolScannerModal(false);
      setManualBarcodeInput('');
      setPendingBarcode(cleanCode);
      setSelectedAssignFilamentId(bambuCatalog[0]?.id || '10100');
    }
  };

  // Confirm associating a new EAN barcode to an existing Bambu spool
  const handleConfirmBarcodeAssignment = () => {
    if (!pendingBarcode) return;
    const delta = spoolScannerMode === 'IN' ? 1 : -1;
    const target = bambuCatalog.find(f => f.id === selectedAssignFilamentId);

    const updated = bambuCatalog.map(item => {
      if (item.id === selectedAssignFilamentId) {
        const nextBarcodes = item.barcodes.includes(pendingBarcode)
          ? item.barcodes
          : [...item.barcodes, pendingBarcode];
        return {
          ...item,
          barcodes: nextBarcodes,
          qty: Math.max(0, item.qty + delta)
        };
      }
      return item;
    });

    setBambuCatalog(updated);
    setPendingBarcode(null);
    if (target) {
      triggerToast(`Code ${pendingBarcode} associé à ${target.name} (${delta > 0 ? '+1' : '-1'})`, 'success', target.hex);
    }
    pushSpoolCatalogToCloudAndDrive(updated);
  };

  // Create custom spool reference
  const handleSaveCustomSpool = (e) => {
    e.preventDefault();
    const code = customSpoolForm.code.trim() || String(Math.floor(90000 + Math.random() * 9999));
    const name = customSpoolForm.name.trim() || 'Couleur Perso';
    const newSpool = {
      id: 'cust_' + Date.now(),
      code,
      brand: 'Custom',
      category: customSpoolForm.category.trim() || 'PLA Basic',
      name,
      hex: customSpoolForm.hex || '#00AE42',
      temp: '200-230°C',
      qty: 1,
      opened: 0,
      barcodes: [code]
    };

    const updated = [newSpool, ...bambuCatalog];
    setBambuCatalog(updated);
    setShowCustomSpoolModal(false);
    setSpoolViewTab('stock');
    setCustomSpoolForm({ category: 'PLA Basic', name: '', hex: '#00AE42', code: '' });
    triggerToast(`Référence ${name} créée et ajoutée (+1)`, 'success', newSpool.hex);
    pushSpoolCatalogToCloudAndDrive(updated);
  };

  // Download JSON backup for Google Drive
  const handleDownloadDriveJson = () => {
    const payload = {
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      updatedAt: new Date().toISOString(),
      catalog: bambuCatalog
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_filaments_bambu.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Fichier stock_filaments_bambu.json téléchargé pour Google Drive !');
  };

  // Import JSON backup from Google Drive
  const handleImportDriveJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        let importedCatalog = null;
        if (Array.isArray(parsed)) {
          importedCatalog = parsed;
        } else if (parsed && Array.isArray(parsed.catalog)) {
          importedCatalog = parsed.catalog;
        } else if (parsed && Array.isArray(parsed.fullCatalog)) {
          importedCatalog = parsed.fullCatalog;
        }
        if (importedCatalog) {
          setBambuCatalog(importedCatalog);
          pushSpoolCatalogToCloudAndDrive(importedCatalog, gasWebhookUrl, true);
          setShowDriveModal(false);
        }
      } catch (err) {
        triggerToast('Fichier JSON invalide', 'error', '#F43F5E');
      }
    };
    reader.readAsText(file);
  };

  const copyGasScriptToClipboard = () => {
    const scriptText = `const FOLDER_ID = "${GOOGLE_DRIVE_FOLDER_ID}";
const FILE_NAME = "stock_filaments_bambu.json";

function doPost(e) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);
  const content = e.postData.contents;
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(FILE_NAME, content, MimeType.PLAIN_TEXT);
  }
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    return ContentService.createTextOutput(files.next().getBlob().getDataAsString())
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
}`;
    const textarea = document.createElement('textarea');
    textarea.value = scriptText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    triggerToast('Script Google Drive copié dans le presse-papier !');
  };

  // Computed Bambu Spool statistics & filtered list
  const totalBambuSpools = useMemo(() => bambuCatalog.reduce((acc, item) => acc + item.qty, 0), [bambuCatalog]);
  const uniqueInStockBambuRefs = useMemo(() => bambuCatalog.filter(item => item.qty > 0).length, [bambuCatalog]);

  const filteredBambuSpools = useMemo(() => {
    const q = spoolSearch.trim().toLowerCase();
    return bambuCatalog.filter(item => {
      if (spoolViewTab === 'stock' && item.qty <= 0 && q === '') return false;
      if (spoolMaterialFilter !== 'ALL' && item.category !== spoolMaterialFilter) return false;
      if (q !== '') {
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchBarcode = item.barcodes.some(b => b.toLowerCase().includes(q));
        return matchName || matchCat || matchCode || matchBarcode;
      }
      return true;
    });
  }, [bambuCatalog, spoolViewTab, spoolMaterialFilter, spoolSearch]);

  // Computed KPIs
  const lowStockItems = useMemo(() => inventory.filter(i => i.stock <= i.alertAt), [inventory]);
  const urgentMaintenance = useMemo(
    () => maintenance.filter(m => m.hoursSinceLast / m.intervalHours >= 0.85),
    [maintenance]
  );

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchCat = invCategory === 'Tous' || item.category === invCategory;
      const matchSearch =
        item.name.toLowerCase().includes(invSearch.toLowerCase()) ||
        item.subType.toLowerCase().includes(invSearch.toLowerCase()) ||
        item.machineCompat.join(' ').toLowerCase().includes(invSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventory, invCategory, invSearch]);

  // Adjust Inventory Stock
  const adjustStock = (id, delta) => {
    setInventory(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextStock = Math.max(0, item.stock + delta);
          return { ...item, stock: nextStock };
        }
        return item;
      })
    );
    triggerToast('Stock mis à jour avec succès');
  };

  // Complete Maintenance Task
  const completeMaintenance = (id) => {
    setMaintenance(prev =>
      prev.map(task => {
        if (task.id === id) {
          return {
            ...task,
            hoursSinceLast: 0,
            lastDone: "Aujourd'hui (Validé)"
          };
        }
        return task;
      })
    );
    triggerToast('Maintenance validée ! Compteur horaire remis à zéro.');
  };

  // Simulate QR Scan -> Direct Machine Dispatch
  const handleSimulateQrDispatch = (order) => {
    setScannerModalOrder(order);
    setDispatchProgress(15);
    setTimeout(() => setDispatchProgress(60), 500);
    setTimeout(() => setDispatchProgress(100), 1100);
  };

  const confirmSendToMachine = () => {
    if (!scannerModalOrder) return;
    setMachines(prev =>
      prev.map(m => {
        if (
          m.name.toLowerCase().includes(scannerModalOrder.targetMachine.toLowerCase()) ||
          scannerModalOrder.targetMachine.toLowerCase().includes(m.shortName.toLowerCase())
        ) {
          return {
            ...m,
            status: 'Impression',
            currentJob: scannerModalOrder.fileName,
            progress: 5,
            eta: 'Calcul...'
          };
        }
        return m;
      })
    );
    setOrders(prev =>
      prev.map(o => (o.id === scannerModalOrder.id ? { ...o, status: 'Envoyé Machine (Actif)' } : o))
    );
    triggerToast(`Job "${scannerModalOrder.fileName}" envoyé directement sur ${scannerModalOrder.targetMachine} !`);
    setScannerModalOrder(null);
    setDispatchProgress(0);
  };

  const handleAddInventoryItem = (e) => {
    e.preventDefault();
    const newItem = {
      id: `inv-${Date.now()}`,
      ...newItemForm,
      stock: Number(newItemForm.stock),
      maxCap: Number(newItemForm.maxCap),
      spoolsCount: Number(newItemForm.spoolsCount),
      alertAt: Number(newItemForm.alertAt),
      machineCompat: newItemForm.machineCompat.split(',').map(s => s.trim())
    };
    setInventory([newItem, ...inventory]);
    setShowNewItemModal(false);
    triggerToast(`"${newItem.name}" ajouté à l'inventaire`);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `CMD-2026-${Math.floor(110 + Math.random() * 890)}`,
      ...newOrderForm,
      secondaryMachines: [],
      status: 'Prêt à flasher'
    };
    setOrders([newOrder, ...orders]);
    setSelectedOrder(newOrder);
    setShowNewOrderModal(false);
    triggerToast(`Étiquette QR générée pour ${newOrder.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* FLOATING TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white shadow-2xl">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: toast.customHex || (toast.type === 'error' ? '#f43f5e' : '#10b981') }}
          />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-zinc-900/90 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-purple-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Layers className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight text-white">FabStudio OS</h1>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    v3.5
                  </span>
                </div>
                <p className="text-xs text-zinc-400">3D • Laser 20W • UV E1</p>
              </div>
            </div>
          </div>

          {/* Quick Fleet Status Bar */}
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>État du Parc (5 Machines)</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> En ligne
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {machines.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveTab('dashboard')}
                  title={`${m.name} : ${m.status}`}
                  className={`px-1.5 py-1.5 rounded-lg text-center border text-[10px] font-semibold transition ${
                    m.status === 'Impression'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : m.status === 'Maintenance Requise'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="truncate">{m.shortName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 flex md:flex-col overflow-x-auto">
            {[
              { id: 'digital-twin', label: 'Digital Twin & Prises', icon: Map, badge: '5 Postes', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
              { id: 'live-connect', label: 'Connexion Cloud & AMS', icon: Wifi, badge: 'Direct', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
              { id: 'dashboard', label: 'Parc & Télémétrie', icon: Cpu, badge: 'Live' },
              { id: 'bambu-spools', label: 'Bobines Bambu & Scan', icon: Disc, badge: `${totalBambuSpools} bobines`, badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
              { id: 'forgecalc', label: 'Calculateur Coûts (ForgeCalc)', icon: Calculator, badge: 'Devis €', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
              { id: 'kanban', label: 'Kanban Print & Cut Queue', icon: Kanban, badge: `${kanbanTasks.length} jobs` },
              { id: 'maintenance', label: 'Maintenance Prédictive & PEI', icon: Wrench, badge: urgentMaintenance.length > 0 ? urgentMaintenance.length : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
              { id: 'print-log', label: 'Journal Qualité & Échecs', icon: ClipboardCheck, badge: `${printLogs.length} logs` },
              { id: 'inventory', label: 'Consommables & UV', icon: Package, badge: lowStockItems.length > 0 ? `${lowStockItems.length} bas` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
              { id: 'orders', label: 'Commandes & QR Scan', icon: QrCode, badge: orders.length },
              { id: 'copilot', label: 'Assistant Réglages IA', icon: Sparkles, badge: 'Gemini' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap w-full ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        tab.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Alert Card */}
        <div className="hidden md:block p-4 m-3 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Rappel Critique Atelier</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong>eufyMake E1 :</strong> Encre Blanche UV à <strong>19%</strong>. Pensez à agiter la cartouche W avant votre prochain print relief.
          </p>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="mt-3 w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition flex items-center justify-center gap-1"
          >
            Voir les 3 rappels <Play className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-7 space-y-6">
        {/* Top Summary Bar */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'digital-twin' && "Vue Digital Twin de l'Atelier & Pilotage Prises Connectées"}
              {activeTab === 'live-connect' && 'Passerelle Directe : Bambu Lab Cloud + AMS • xTool M2 • eufyMake E1/E2'}
              {activeTab === 'dashboard' && 'Centre de Contrôle Multi-Machines'}
              {activeTab === 'bambu-spools' && 'Stock Filaments Bambu Lab • Scan iPhone (+1 / -1) & Google Drive'}
              {activeTab === 'forgecalc' && 'Calculateur de Coûts & Rentabilité (Style ForgeCalc 3D / Laser / UV)'}
              {activeTab === 'kanban' && 'Kanban de Planification (Print & Cut Queue Multi-Machines)'}
              {activeTab === 'inventory' && 'Gestion des Consommables, Encres UV, Supports Laser & Pièces'}
              {activeTab === 'maintenance' && 'Maintenance Prédictive & Stock Buses / Hotends / Plateaux PEI'}
              {activeTab === 'print-log' && 'Journal Qualité, Recettes Validées & Analyse des Échecs'}
              {activeTab === 'orders' && 'Studio Étiquettes QR & Routage Direct vers Imprimantes'}
              {activeTab === 'copilot' && 'Ingénieur IA Atelier (Bambu Lab • xTool M2 • eufyMake E1/E2)'}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Parc synchronisé : <span className="text-zinc-200 font-medium">X1C • P1S • A1 • xTool M2 20W • eufyMake E1/E2</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Cloud & Google Drive Status Pill */}
            <button
              onClick={() => setShowDriveModal(true)}
              className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 transition"
              title="Configurer / Synchroniser Google Drive"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                cloudStatus.state === 'online' ? 'bg-emerald-400' :
                cloudStatus.state === 'syncing' ? 'bg-sky-400 animate-ping' : 'bg-amber-400 animate-pulse'
              }`} />
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-zinc-400">Cloud & Drive</span>
                <span className="text-xs font-bold text-white">{cloudStatus.label}</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('bambu-spools');
                setSpoolScannerMode('IN');
                setSpoolScannerModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition"
            >
              <Scan className="w-4 h-4 text-emerald-400" /> Scanner Boîte Bambu (+1/-1)
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setShowNewOrderModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <QrCode className="w-4 h-4" /> Nouvelle Étiquette Commande
            </button>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* NEW TAB 6: DIGITAL TWIN 2D INTERACTIVE WORKSHOP MAP & SMART PLUGS    */}
        {/* ===================================================================== */}
        {activeTab === 'digital-twin' && (
          <div className="space-y-6">
            {/* Global Energy & Smart Plugs Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Puissance Instantanée Atelier</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {Object.values(smartPlugs).reduce((acc, p) => acc + p.watts, 0)} W
                  </div>
                  <span className="text-[11px] text-zinc-400">5 prises connectées actives</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Consommation Jour (Cumulée)</span>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {Object.values(smartPlugs).reduce((acc, p) => acc + p.kwhToday, 0).toFixed(2)} kWh
                  </div>
                  <span className="text-[11px] text-amber-400">
                    ≈ {(Object.values(smartPlugs).reduce((acc, p) => acc + p.kwhToday, 0) * 0.2516).toFixed(2)} € aujourd'hui
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Hygrométrie Moyenne AMS</span>
                  <div className="text-2xl font-extrabold text-cyan-400 mt-1">21 % RH</div>
                  <span className="text-[11px] text-zinc-400">Dessiccant Silice OK (X1C & P1S)</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Droplet className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Sécurité & Extraction Fumées</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">Nominale</div>
                  <span className="text-[11px] text-zinc-400">Air Assist + Filtration UV actifs</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Interactive 2D Floorplan + Selected Station Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: 2D Digital Twin Floorplan */}
              <div className="lg:col-span-8 rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Plan Interactif Temps Réel (Digital Twin 2D)
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Cliquez sur un poste pour inspecter la machine ou couper sa prise connectée
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> En production
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> En veille (Prête)
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Maintenance
                    </span>
                  </div>
                </div>

                {/* Blueprint Grid Canvas */}
                <div
                  className="relative w-full h-[420px] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden p-4"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(63,63,70,0.45) 1px, transparent 1px)',
                    backgroundSize: '22px 22px'
                  }}
                >
                  {/* Zone Labels on Floorplan */}
                  <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900/90 px-2.5 py-1 rounded-md border border-zinc-800">
                    Zone A • Îlot Impression 3D FDM (Bambu Lab X1C, P1S, A1)
                  </div>
                  <div className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-widest text-amber-500/80 bg-zinc-900/90 px-2.5 py-1 rounded-md border border-zinc-800">
                    Zone B • Découpe Laser 20W & Gravure (xTool M2)
                  </div>
                  <div className="absolute bottom-3 right-4 text-[10px] font-bold uppercase tracking-widest text-purple-400/80 bg-zinc-900/90 px-2.5 py-1 rounded-md border border-zinc-800">
                    Zone C • Studio UV Relief & Curing (eufyMake E1/E2)
                  </div>

                  {/* Interactive Machine Nodes */}
                  {machines.map((m) => {
                    const plug = smartPlugs[m.id];
                    const isSelected = selectedTwinMachineId === m.id;
                    const isPrinting = m.status === 'Impression';
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedTwinMachineId(m.id)}
                        style={{ left: `${plug.x}%`, top: `${plug.y}%` }}
                        className={`absolute w-44 sm:w-52 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                          !plug.isOn
                            ? 'bg-zinc-900/60 border-zinc-800 opacity-50'
                            : isSelected
                            ? 'bg-zinc-900 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xl scale-[1.03]'
                            : 'bg-zinc-900/95 border-zinc-700 hover:border-zinc-500 shadow-lg'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                !plug.isOn
                                  ? 'bg-zinc-600'
                                  : isPrinting
                                  ? 'bg-emerald-400 animate-ping'
                                  : m.status === 'Maintenance Requise'
                                  ? 'bg-purple-400'
                                  : 'bg-sky-400'
                              }`}
                            />
                            <span className="text-xs font-extrabold text-white">{m.shortName}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800">
                            {plug.watts}W
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-400 truncate">{m.currentJob}</div>

                        {m.progress > 0 && plug.isOn && (
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${m.progress}%` }}
                            />
                          </div>
                        )}

                        <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400">{plug.isOn ? m.status : 'Hors Tension'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSmartPlug(m.id);
                            }}
                            className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                              plug.isOn
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            <Power className="w-2.5 h-2.5" /> {plug.isOn ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Station Inspector & Smart Plug Controller */}
              <div className="lg:col-span-4 rounded-3xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                {(() => {
                  const machine = machines.find(m => m.id === selectedTwinMachineId) || machines[0];
                  const plug = smartPlugs[machine.id];
                  const temps = liveTemps[machine.id];
                  return (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                              Poste Sélectionné
                            </span>
                            <h3 className="text-lg font-bold text-white mt-0.5">{machine.name}</h3>
                            <p className="text-xs text-zinc-400">{plug.zone}</p>
                          </div>
                          <button
                            onClick={() => toggleSmartPlug(machine.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                              plug.isOn
                                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                            {plug.isOn ? 'Prise ON' : 'Prise OFF'}
                          </button>
                        </div>

                        {/* Smart Plug Telemetry Box */}
                        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>🔌 {plug.plugName}</span>
                            <span className="text-emerald-400 font-mono">{plug.watts} W</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Conso Jour</span>
                              <span className="font-bold text-white">{plug.kwhToday} kWh</span>
                            </div>
                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 block">Coût Estimé</span>
                              <span className="font-bold text-amber-400">
                                {(plug.kwhToday * 0.2516).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Temperatures if 3D Printer */}
                        {temps && (
                          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                            <span className="text-[11px] font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                              <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Télémétrie Thermique Temps Réel
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                <span className="text-[10px] text-zinc-400 block">Buse</span>
                                <span className="text-xs font-bold text-rose-400">{temps.nozzle}°C</span>
                              </div>
                              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                <span className="text-[10px] text-zinc-400 block">Plateau PEI</span>
                                <span className="text-xs font-bold text-amber-400">{temps.bed}°C</span>
                              </div>
                              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                <span className="text-[10px] text-zinc-400 block">Chambre</span>
                                <span className="text-xs font-bold text-cyan-400">
                                  {temps.chamber ? `${temps.chamber}°C` : 'Ouverte'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AMS or UV Channels summary */}
                        {machine.amsSlots && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase text-zinc-400">
                              Slots {machine.shortName === 'A1' ? 'AMS Lite' : 'AMS'} Connectés
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {machine.amsSlots.map(s => (
                                <div key={s.slot} className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: s.hex }} />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold text-white truncate">{s.slot} • {s.type}</div>
                                    <div className="text-[10px] text-zinc-400">{s.remain}% restant</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex gap-2">
                        <button
                          onClick={() => setActiveTab('live-connect')}
                          className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white"
                        >
                          Paramètres Cloud/LAN
                        </button>
                        <button
                          onClick={() => setActiveTab('kanban')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950"
                        >
                          Assigner un Job
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NEW TAB 1: LIVE CLOUD & LAN CONNECTION (BAMBU CLOUD/AMS, XTOOL, EUFY) */}
        {/* ===================================================================== */}
        {activeTab === 'live-connect' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-purple-950/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Hub de Télémétrie Unifié : Bambu Lab Cloud + AMS • xTool Creative Space • eufyMake E1/E2
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Synchronise automatiquement les bobines lues par les puces RFID de l'AMS avec votre stock Bambu Lab.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerToast('Synchronisation RFID AMS + Niveaux UV eufyMake effectuée !');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" /> Forcer Synchro AMS & Capteurs
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. BAMBU LAB CLOUD & AMS BRIDGE */}
              <div className="rounded-2xl bg-zinc-900 border border-emerald-500/30 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Connecté • MQTT + Cloud
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{liveConnections.bambuCloud.latency}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">Bambu Lab Cloud & AMS (X1C • P1S • A1)</h4>
                  <p className="text-xs text-zinc-400">
                    Lecture en direct des 12 emplacements AMS (4x X1C, 4x P1S, 4x AMS Lite A1), températures, caméra chamber et hygrométrie.
                  </p>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Compte Bambu Cloud :</span>
                      <span className="font-semibold text-white">{liveConnections.bambuCloud.account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Protocole :</span>
                      <span className="text-emerald-400 font-semibold">{liveConnections.bambuCloud.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Puces RFID AMS :</span>
                      <span className="text-cyan-400 font-semibold">12 / 12 Bobines détectées</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => triggerToast('12 bobines AMS synchronisées avec le stock Bambu Lab !')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Déduire l'usure AMS du Stock Bobines
                </button>
              </div>

              {/* 2. XTOOL M2 (20W + INKJET) BRIDGE */}
              <div className="rounded-2xl bg-zinc-900 border border-amber-500/30 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Connecté • Wi-Fi Local
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{liveConnections.xtoolLink.ip}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">xTool M2 (Laser 20W + Tête Inkjet)</h4>
                  <p className="text-xs text-zinc-400">
                    Remontée de l'état de la lentille laser 20W, niveau de la cartouche jet d'encre CMYK et pilotage automatique de l'Air Assist.
                  </p>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Module Détecté :</span>
                      <span className="font-semibold text-white">Diode 20W + Module Encre</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Niveau Cartouche Encre :</span>
                      <span className="text-amber-400 font-bold">64 %</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Air Assist & Purificateur :</span>
                      <span className="text-emerald-400 font-semibold">{liveConnections.xtoolLink.airAssist}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => triggerToast('Test Air Assist & Pointeur Laser xTool M2 envoyé !')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition"
                >
                  Tester Connexion & Air Assist xTool
                </button>
              </div>

              {/* 3. EUFYMAKE E1 / E2 UV PRINTER BRIDGE */}
              <div className="rounded-2xl bg-zinc-900 border border-purple-500/30 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Connecté • eufyMake Cloud
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{liveConnections.eufyLink.ip}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">eufyMake E1 / E2 UV Texture Printer</h4>
                  <p className="text-xs text-zinc-400">
                    Surveillance en direct des 6 canaux UV (CMYK + Blanc Relief W + Vernis Gloss V), santé lampe LED UV et cycles d'auto-nettoyage.
                  </p>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Alerte Canal Blanc (W) :</span>
                      <span className="font-bold text-rose-400">19 % (Agitation requise)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Canal Vernis Gloss (V) :</span>
                      <span className="text-amber-400 font-bold">24 %</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Capping Station Auto :</span>
                      <span className="text-emerald-400 font-semibold">{liveConnections.eufyLink.autoClean}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => triggerToast('Cycle de micro-brassage Encre Blanche (W) lancé sur eufyMake !')}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                >
                  Lancer Brassage Blanc (W) & Check Buses
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NEW TAB 2: FORGECALC-INSPIRED COST & PRICING CALCULATOR               */}
        {/* ===================================================================== */}
        {activeTab === 'forgecalc' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Inputs Form */}
            <div className="lg:col-span-7 rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Inspiré de ForgeCalc.app • Multi-Procédés
                  </span>
                  <h3 className="text-lg font-bold text-white">Paramètres du Projet & Coûts Réels Atelier</h3>
                </div>
                <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  {[
                    { id: '3d', label: '3D Bambu' },
                    { id: 'laser', label: 'Laser xTool' },
                    { id: 'uv', label: 'UV eufyMake' },
                    { id: 'hybrid', label: 'Hybride Complet' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setCalcForm({ ...calcForm, processType: mode.id })}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                        calcForm.processType === mode.id
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-zinc-400 block mb-1 font-semibold">Nom de la pièce / commande</label>
                  <input
                    type="text"
                    value={calcForm.projectName}
                    onChange={e => setCalcForm({ ...calcForm, projectName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  />
                </div>

                {/* Filament / Material Selection */}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Bobine Bambu Lab (Stock)</label>
                  <select
                    value={calcForm.selectedSpoolId}
                    onChange={e => setCalcForm({ ...calcForm, selectedSpoolId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    {bambuCatalog.map(s => (
                      <option key={s.id} value={s.id}>
                        #{s.code} • {s.category} {s.name} ({s.qty} en stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Prix Bobine 1kg (€ TTC)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcForm.filamentPricePerKg}
                    onChange={e => setCalcForm({ ...calcForm, filamentPricePerKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Poids Slicer (grammes)</label>
                  <input
                    type="number"
                    value={calcForm.weightGrams}
                    onChange={e => setCalcForm({ ...calcForm, weightGrams: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Perte Purge AMS / Supports (%)</label>
                  <input
                    type="number"
                    value={calcForm.wasteFactorPct}
                    onChange={e => setCalcForm({ ...calcForm, wasteFactorPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                {/* UV Ink & Sheet Material inputs */}
                {(calcForm.processType === 'uv' || calcForm.processType === 'hybrid') && (
                  <>
                    <div>
                      <label className="text-purple-300 block mb-1 font-semibold">Volume Encre UV + Blanc/Vernis (ml)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calcForm.uvInkMl}
                        onChange={e => setCalcForm({ ...calcForm, uvInkMl: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-purple-500/40 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-purple-300 block mb-1 font-semibold">Coût Encre UV (€ / ml)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={calcForm.uvInkCostPerMl}
                        onChange={e => setCalcForm({ ...calcForm, uvInkCostPerMl: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-purple-500/40 text-white"
                      />
                    </div>
                  </>
                )}

                {(calcForm.processType === 'laser' || calcForm.processType === 'uv' || calcForm.processType === 'hybrid') && (
                  <div className="sm:col-span-2">
                    <label className="text-amber-300 block mb-1 font-semibold">
                      Coût Plaque Support (Bois, Acrylique, Ardoise) par pièce (€)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      value={calcForm.sheetMaterialCost}
                      onChange={e => setCalcForm({ ...calcForm, sheetMaterialCost: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-amber-500/40 text-white"
                    />
                  </div>
                )}

                {/* Machine Time & Energy */}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Temps Machine Total (Heures)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={calcForm.printHours}
                    onChange={e => setCalcForm({ ...calcForm, printHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Conso Moyenne Machine (Watts)</label>
                  <input
                    type="number"
                    value={calcForm.powerWatts}
                    onChange={e => setCalcForm({ ...calcForm, powerWatts: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                {/* Labor & Margin */}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Main d'œuvre Prépa + Finition (min)</label>
                  <input
                    type="number"
                    value={calcForm.prepMinutes}
                    onChange={e => setCalcForm({ ...calcForm, prepMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Taux Horaire Atelier (€ / h)</label>
                  <input
                    type="number"
                    value={calcForm.hourlyLaborRate}
                    onChange={e => setCalcForm({ ...calcForm, hourlyLaborRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Coefficient de Marge Commerciale (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcForm.marginMultiplier}
                    onChange={e => setCalcForm({ ...calcForm, marginMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Quantité de pièces dans la série</label>
                  <input
                    type="number"
                    min="1"
                    value={calcForm.quantity}
                    onChange={e => setCalcForm({ ...calcForm, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Right: Live ForgeCalc Financial Breakdown */}
            <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 flex flex-col justify-between space-y-5 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Synthèse de Rentabilité
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Marge x{calcForm.marginMultiplier} • Risque {calcForm.failureRatePct}%
                  </span>
                </div>

                {/* Big Price Display */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Coût de Revient Unitaire</span>
                    <div className="text-2xl font-extrabold text-white mt-0.5">
                      {forgeCalcBreakdown.unitCostRevient} € <span className="text-xs font-normal text-zinc-500">HT</span>
                    </div>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <span className="text-[11px] text-emerald-400 font-semibold block">Prix de Vente Conseillé</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                      {forgeCalcBreakdown.unitPriceTTC} € <span className="text-xs font-normal text-zinc-300">TTC</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">({forgeCalcBreakdown.unitPriceHT} € HT / unité)</span>
                  </div>
                </div>

                {/* Cost Lines */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Matière 1ère ({forgeCalcBreakdown.effectiveWeight}g purge incluse + UV/Support)</span>
                    <span className="font-bold text-white">{forgeCalcBreakdown.rawMaterialTotal} €</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Électricité ({calcForm.printHours}h @ {calcForm.powerWatts}W)</span>
                    <span className="font-bold text-amber-300">{forgeCalcBreakdown.electricityCost} €</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Amortissement Machine & Usure Buse/Optique</span>
                    <span className="font-bold text-white">{forgeCalcBreakdown.depreciationCost} €</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Main d'œuvre Opérateur ({calcForm.prepMinutes + calcForm.postProcMinutes} min)</span>
                    <span className="font-bold text-sky-300">{forgeCalcBreakdown.laborCost} €</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                    <span className="text-zinc-400">Provision Taux d'Échec ({calcForm.failureRatePct}%) & Emballage</span>
                    <span className="font-bold text-rose-300">
                      {(Number(forgeCalcBreakdown.failureBuffer) + Number(calcForm.packagingCost)).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Total Batch Box */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="flex justify-between text-xs text-emerald-200">
                    <span>Total Devis Série ({calcForm.quantity} pièces TTC) :</span>
                    <span className="text-base font-black text-white">{forgeCalcBreakdown.batchTotalTTC} € TTC</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-300">
                    <span>Bénéfice Net Atelier sur la commande :</span>
                    <span className="font-extrabold">+{forgeCalcBreakdown.batchProfit} € net</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const newOrder = {
                    id: `CMD-2026-${Math.floor(110 + Math.random() * 890)}`,
                    client: 'Devis ForgeCalc',
                    productName: `${calcForm.quantity}x ${calcForm.projectName} (${forgeCalcBreakdown.batchTotalTTC}€ TTC)`,
                    targetMachine: 'Bambu Lab X1C',
                    secondaryMachines: [],
                    materialSpec: `${calcForm.weightGrams}g • Coût revient ${forgeCalcBreakdown.unitCostRevient}€`,
                    fileName: 'Projet_Devis_ForgeCalc.3mf',
                    presetParams: `Devis validé : ${forgeCalcBreakdown.unitPriceTTC}€ TTC/u`,
                    dueDate: 'Cette semaine',
                    priority: 'Haute',
                    status: 'Prêt à flasher'
                  };
                  setOrders([newOrder, ...orders]);
                  setSelectedOrder(newOrder);
                  setActiveTab('orders');
                  triggerToast('Devis transformé en Commande avec Étiquette QR !');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <QrCode className="w-4 h-4" /> Convertir ce Devis en Commande + Étiquette QR
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NEW TAB 4: KANBAN PRINT & CUT QUEUE (DRAG & DROP SCHEDULER)           */}
        {/* ===================================================================== */}
        {activeTab === 'kanban' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Ordonnancement Visuel Multi-Machines (Glisser-Déposer ou Bouton Rapide)
                </h3>
                <p className="text-xs text-zinc-400">
                  Chaque carte indique la machine recommandée selon le matériau (PAHT-CF → X1C, Découpe + Encre → xTool M2, Relief UV → eufyMake).
                </p>
              </div>
              <button
                onClick={() => setShowNewKanbanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Nouveau Job Kanban
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {[
                { id: 'backlog', title: '1. À Préparer / Slicer', color: 'border-zinc-700' },
                { id: 'ready', title: '2. Prêt à Lancer', color: 'border-sky-500/40' },
                { id: 'printing', title: '3. En Production', color: 'border-emerald-500/50' },
                { id: 'postproc', title: '4. Finition / Curing UV', color: 'border-purple-500/40' },
                { id: 'done', title: '5. Terminé & Livré', color: 'border-teal-500/40' }
              ].map((col, colIdx, allCols) => {
                const colTasks = kanbanTasks.filter(t => t.stage === col.id);
                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedTaskId) {
                        moveKanbanTask(draggedTaskId, col.id);
                        setDraggedTaskId(null);
                      }
                    }}
                    className={`rounded-2xl bg-zinc-900/70 border ${col.color} p-3 flex flex-col gap-3 min-h-[420px]`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-xs font-extrabold text-white">{col.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {colTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedTaskId(task.id)}
                          className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing space-y-2 shadow"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono text-zinc-400">{task.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              task.priority === 'Haute'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white leading-snug">{task.title}</h4>
                          <p className="text-[11px] text-zinc-400">{task.client}</p>

                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/90 space-y-1">
                            <div className="text-[10px] font-bold text-emerald-400 flex items-center justify-between">
                              <span>🎯 {task.assignedMachine}</span>
                              <span>⏱ {task.estTime}</span>
                            </div>
                            <div className="text-[10px] text-zinc-300 truncate">{task.material}</div>
                            <div className="text-[9px] text-zinc-500 italic">{task.recommendedReason}</div>
                          </div>

                          {/* Quick Stage Progression Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            {colIdx > 0 ? (
                              <button
                                onClick={() => moveKanbanTask(task.id, allCols[colIdx - 1].id)}
                                className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              >
                                ← Reculer
                              </button>
                            ) : <span />}
                            {colIdx < allCols.length - 1 && (
                              <button
                                onClick={() => moveKanbanTask(task.id, allCols[colIdx + 1].id)}
                                className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1"
                              >
                                Avancer <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* NEW TAB 5: PRINT LOG, QUALITY JOURNAL & FAILURE ANALYSIS              */}
        {/* ===================================================================== */}
        {activeTab === 'print-log' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Carnet de Bord Qualité, Recettes Certifiées & Analyse des Échecs (Print & Cut Log)
                </h3>
                <p className="text-xs text-zinc-400">
                  Consignez les paramètres exacts qui ont fonctionné ou les causes d'échec pour fiabiliser vos futurs tirages.
                </p>
              </div>
              <button
                onClick={() => setShowNewLogModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Camera className="w-4 h-4" /> Consigner un Print / Tirage
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {printLogs.map(log => {
                const isSuccess = log.outcome === 'Succès';
                return (
                  <div
                    key={log.id}
                    className={`rounded-2xl bg-zinc-900 border p-5 flex flex-col justify-between space-y-4 ${
                      isSuccess ? 'border-zinc-800' : 'border-rose-500/40 bg-rose-950/10'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-400">{log.id} • {log.date}</span>
                          <h4 className="text-base font-bold text-white mt-0.5">{log.projectName}</h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {log.outcome} ({log.score})
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-300 font-semibold">
                          {log.machine}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                          {log.material}
                        </span>
                      </div>

                      {log.failureCause && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                          <strong>Diagnostic Échec :</strong> {log.failureCause}
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                        <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                          Recette / Réglages Validés :
                        </span>
                        <p className="text-zinc-200 font-medium leading-relaxed">{log.validatedRecipe}</p>
                      </div>

                      <p className="text-xs text-zinc-400 italic">"{log.notes}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: BAMBU LAB OFFICIAL SPOOL INVENTORY, IPHONE BARCODE SCANNER & GOOGLE DRIVE */}
        {activeTab === 'bambu-spools' && (
          <div className="space-y-6">
            {/* Quick Counters & iPhone Scan Action Cards (+1 / -1) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Scan Arrival (+1) */}
              <button
                onClick={() => {
                  setSpoolScannerMode('IN');
                  setSpoolScannerModal(true);
                }}
                className="md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-left shadow-lg shadow-emerald-950/50 border border-emerald-400/30 active:scale-[0.98] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 text-white">
                    <Scan className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/25 text-emerald-100">
                    +1 Stock
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">Scanner Arrivée (iPhone)</h3>
                  <p className="text-xs text-emerald-100/80">Boîte neuve reçue — Code 5 chiffres ou EAN</p>
                </div>
              </button>

              {/* Scan Empty Spool (-1) */}
              <button
                onClick={() => {
                  setSpoolScannerMode('OUT');
                  setSpoolScannerModal(true);
                }}
                className="md:col-span-4 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-4 text-left shadow-lg shadow-rose-950/50 border border-rose-400/30 active:scale-[0.98] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 text-white">
                    <MinusCircle className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/25 text-rose-100">
                    -1 Stock
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">Bobine Finie</h3>
                  <p className="text-xs text-rose-100/80">Scanner ou retirer une bobine terminée</p>
                </div>
              </button>

              {/* Stock Stats & Drive Summary Card */}
              <div className="md:col-span-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Total en Stock</span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-0.5">{totalBambuSpools} <span className="text-sm font-semibold text-zinc-300">bobines</span></div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Références actives</span>
                    <div className="text-xl font-bold text-white mt-0.5">{uniqueInStockBambuRefs} / {bambuCatalog.length}</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 truncate">
                    Drive : <code className="text-zinc-200 font-mono">{GOOGLE_DRIVE_FOLDER_ID.slice(0, 12)}...</code>
                  </span>
                  <button
                    onClick={() => setShowDriveModal(true)}
                    className="text-sky-400 hover:underline font-semibold shrink-0"
                  >
                    Options Drive
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Official Bambu Lab Catalog Switcher */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setSpoolViewTab('stock')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      spoolViewTab === 'stock'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    <span>Mon Stock</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/30">{totalBambuSpools}</span>
                  </button>

                  <button
                    onClick={() => setSpoolViewTab('catalog')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      spoolViewTab === 'catalog'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    <span>Catalogue Officiel Bambu Lab</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-800 text-zinc-200">{bambuCatalog.length}</span>
                  </button>
                </div>

                {/* Instant Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spoolSearch}
                    onChange={e => setSpoolSearch(e.target.value)}
                    placeholder="Rechercher couleur, PLA, Matte, code Bambu (ex: 10100, Noir, Jade)..."
                    className="w-full pl-10 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  {spoolSearch && (
                    <button
                      onClick={() => setSpoolSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Material Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'Tous les matériaux' },
                  { id: 'PLA Basic', label: 'PLA Basic' },
                  { id: 'PLA Matte', label: 'PLA Matte' },
                  { id: 'PETG HF', label: 'PETG HF' },
                  { id: 'ABS / ASA', label: 'ABS / ASA' },
                  { id: 'TPU / Technique', label: 'TPU / CF / Nylon' },
                ].map(mat => (
                  <button
                    key={mat.id}
                    onClick={() => setSpoolMaterialFilter(mat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      spoolMaterialFilter === mat.id
                        ? 'bg-zinc-700 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spools Grid */}
            {filteredBambuSpools.length === 0 ? (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Aucune bobine trouvée dans cette vue</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Passez sur l'onglet <span className="text-emerald-400 font-semibold">Catalogue Officiel Bambu Lab</span> pour voir toutes les références existantes et les ajouter en 1 clic, ou scannez une boîte.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setSpoolViewTab('catalog')}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
                  >
                    Voir tout le catalogue Bambu Lab
                  </button>
                  <button
                    onClick={() => setShowCustomSpoolModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition"
                  >
                    + Créer une bobine perso
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredBambuSpools.map(item => {
                  const isOut = item.qty === 0;
                  return (
                    <div
                      key={item.id}
                      className={`bg-zinc-900 border ${
                        item.qty > 0 ? 'border-zinc-800' : 'border-zinc-800/50 opacity-80'
                      } rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-zinc-700 transition shadow-lg`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Visual Spool Color Swatch */}
                        <div
                          className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/15 shadow-inner"
                          style={{ backgroundColor: item.hex }}
                        >
                          <div className="w-4 h-4 rounded-full bg-zinc-900 border border-white/20" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {item.category}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">#{item.code}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white truncate mt-1" title={item.name}>
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Buse : {item.temp}</p>
                        </div>

                        {/* Stock Badge */}
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-xl text-sm font-extrabold ${
                            item.qty > 0
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {item.qty}
                          </span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5">en stock</span>
                        </div>
                      </div>

                      {/* +1 / -1 Action Buttons */}
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => adjustBambuSpoolQty(item.id, -1)}
                          disabled={isOut}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            isOut
                              ? 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 active:scale-95'
                          }`}
                        >
                          <MinusCircle className="w-4 h-4" />
                          <span>Bobine finie (-1)</span>
                        </button>

                        <button
                          onClick={() => adjustBambuSpoolQty(item.id, 1)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Ajouter (+1)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Google Drive Sync Footer Bar */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  Sauvegarde Cloud & Dossier Google Drive Connecté
                </h4>
                <p className="text-xs text-zinc-400">
                  Dossier cible : <span className="font-mono text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">{GOOGLE_DRIVE_FOLDER_ID}</span>
                  {lastSyncTime && <span className="ml-2 text-zinc-400">• {lastSyncTime}</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => pushSpoolCatalogToCloudAndDrive(bambuCatalog, gasWebhookUrl, true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Upload className="w-4 h-4" />
                  Sauvegarder sur Drive
                </button>
                <button
                  onClick={() => setShowDriveModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-sky-400 flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                >
                  <Cloud className="w-4 h-4" />
                  Options Google Drive
                </button>
                <button
                  onClick={() => setShowCustomSpoolModal(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 border border-zinc-700 transition"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Autre Bobine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD & FLEET TELEMETRY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Machines Actives</span>
                  <div className="text-2xl font-bold text-white mt-1">2 / 5 en prod</div>
                  <span className="text-[11px] text-emerald-400">X1C (68%) • A1 (91%)</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Printer className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Bobines Bambu en Stock</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{totalBambuSpools} bobines</div>
                  <span className="text-[11px] text-zinc-400">{uniqueInStockBambuRefs} couleurs disponibles</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Disc className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Maintenances à Prévoir</span>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{urgentMaintenance.length} rappels</div>
                  <span className="text-[11px] text-zinc-400">Tiges X1C • Vis P1S • Purge UV</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Commandes QR Prêtes</span>
                  <div className="text-2xl font-bold text-purple-400 mt-1">{orders.length} fiches</div>
                  <span className="text-[11px] text-zinc-400">Scan direct vers machine</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Section 1: Bambu Lab 3D Printers Fleet (X1C, P1S, A1) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Flotte Impression 3D Bambu Lab (AMS & AMS Lite)
                </h3>
                <span className="text-xs text-zinc-400">Synchronisation RFID Bobines</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {machines.slice(0, 3).map(printer => (
                  <div
                    key={printer.id}
                    className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                            {printer.category}
                          </span>
                          <h4 className="text-lg font-bold text-white">{printer.name}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            printer.status === 'Impression'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {printer.status}
                        </span>
                      </div>

                      {/* Hardware config */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
                        <span className="px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800">
                          Buse : <strong>{printer.nozzle}</strong>
                        </span>
                        <span className="px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800">
                          ⏱ {printer.hours} h
                        </span>
                        {printer.amsHumidity !== null && (
                          <span className="px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-cyan-300">
                            💧 AMS {printer.amsHumidity}%
                          </span>
                        )}
                      </div>

                      {/* Job Progress */}
                      <div className="mt-4 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-zinc-300 font-medium truncate max-w-[180px]">
                            {printer.currentJob}
                          </span>
                          <span className="text-emerald-400 font-bold">{printer.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${printer.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5">
                          <span>Plateau : {printer.plate}</span>
                          <span>Reste : {printer.eta}</span>
                        </div>
                      </div>

                      {/* AMS 4 Slots Visualizer */}
                      <div className="mt-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                          Bobines Chargées ({printer.shortName === 'A1' ? 'AMS Lite' : 'AMS'})
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {printer.amsSlots.map(slot => (
                            <div
                              key={slot.slot}
                              className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center text-center"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                                  style={{ backgroundColor: slot.hex }}
                                />
                                <span className="text-[10px] font-bold text-zinc-300">{slot.slot}</span>
                              </div>
                              <div className="text-[10px] font-semibold text-white truncate w-full">
                                {slot.type}
                              </div>
                              <div className="w-full h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    slot.remain <= 20 ? 'bg-rose-500' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${slot.remain}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-zinc-400 mt-0.5">{slot.remain}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: xTool M2 (Laser 20W + Inkjet) & eufyMake E1 UV Printer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* xTool M2 Card */}
              {machines.slice(3, 4).map(xtool => (
                <div
                  key={xtool.id}
                  className="rounded-2xl bg-zinc-900/90 border border-amber-500/20 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" /> {xtool.category}
                        </span>
                        <h4 className="text-lg font-bold text-white mt-0.5">{xtool.name}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {xtool.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                        <span className="text-[11px] text-zinc-400">Module Actif</span>
                        <div className="text-xs font-bold text-white mt-0.5">Diode 20W + Inkjet</div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                        <span className="text-[11px] text-zinc-400">Niveau Encre Jet</span>
                        <div className="text-xs font-bold text-amber-400 mt-0.5">{xtool.inkLevel}% restant</div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-zinc-400">État Lentille 20W</span>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">{xtool.lensState}</div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
                      <span>
                        <strong>Astuce hybride :</strong> Imprimez d'abord avec la tête Inkjet avant d'activer la découpe Laser 20W.
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* eufyMake E1 UV Printer Card */}
              {machines.slice(4, 5).map(eufy => (
                <div
                  key={eufy.id}
                  className="rounded-2xl bg-zinc-900/90 border border-purple-500/30 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5" /> {eufy.category}
                        </span>
                        <h4 className="text-lg font-bold text-white mt-0.5">{eufy.name}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {eufy.status}
                      </span>
                    </div>

                    {/* 6 UV Ink Channels (CMYK + White + Varnish) */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-semibold uppercase mb-2">
                        <span>Canaux Encre UV (CMYK + Blanc Relief + Vernis)</span>
                        <span>Lampe UV LED : {eufy.uvLampHealth}%</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {eufy.channels.map(ch => (
                          <div
                            key={ch.code}
                            className={`p-2 rounded-xl bg-zinc-950 border ${
                              ch.level <= 25 ? 'border-rose-500/60' : 'border-zinc-800'
                            } flex flex-col items-center`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 mb-1"
                              style={{ backgroundColor: ch.hex }}
                            />
                            <span className="text-xs font-bold text-white">{ch.code}</span>
                            <div className="w-full h-12 bg-zinc-900 rounded-md my-1.5 p-0.5 flex items-end overflow-hidden border border-zinc-800">
                              <div
                                className={`w-full rounded-sm ${
                                  ch.level <= 25 ? 'bg-rose-500' : 'bg-purple-400'
                                }`}
                                style={{ height: `${ch.level}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                ch.level <= 25 ? 'text-rose-400' : 'text-zinc-300'
                              }`}
                            >
                              {ch.level}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY (UV INKS, LASER MATERIALS, SPARE PARTS) */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <div className="flex flex-wrap gap-1.5">
                {['Tous', 'Encre UV & Jet', 'Supports Laser & UV', 'Pièces & Entretien'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInvCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      invCategory === cat
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invSearch}
                    onChange={e => setInvSearch(e.target.value)}
                    placeholder="Rechercher buse, encre UV, bois..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => setShowNewItemModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredInventory.map(item => {
                const isLow = item.stock <= item.alertAt;
                const pct = Math.min(100, Math.round((item.stock / item.maxCap) * 100));
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl bg-zinc-900/90 border p-4 flex flex-col justify-between transition ${
                      isLow ? 'border-amber-500/50 bg-amber-950/10' : 'border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-inner"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              {item.category} • {item.subType}
                            </span>
                            <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
                          </div>
                        </div>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Stock Bas
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.machineCompat.map(m => (
                          <span
                            key={m}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                          >
                            {m}
                          </span>
                        ))}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-emerald-300">
                          📍 {item.location}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Quantité disponible</span>
                          <span className="font-bold text-white">
                            {item.stock} {item.unit}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-zinc-400 mt-2 italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => adjustStock(item.id, -1)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition"
                      >
                        -1 {item.unit}
                      </button>
                      <button
                        onClick={() => adjustStock(item.id, 1)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition"
                      >
                        +1 {item.unit}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PREVENTIVE MAINTENANCE & SPARE PARTS (NOZZLES, HOTENDS, PEI PLATES) */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            {/* Predictive Spare Parts Quick Inventory Strip (Buses, Hotends, Plateaux PEI, Optiques) */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Stock Critique d'Usure : Buses, Hotends, Plateaux PEI & Lentilles Laser
                </h3>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs text-sky-400 hover:underline font-semibold"
                >
                  Gérer tout l'inventaire →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {inventory
                  .filter(i => i.category === 'Pièces & Entretien')
                  .slice(0, 4)
                  .map(part => (
                    <div key={part.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">{part.subType}</span>
                        <div className="text-xs font-bold text-white truncate" title={part.name}>{part.name}</div>
                        <span className="text-[10px] text-zinc-400">{part.machineCompat.join(' • ')}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          part.stock <= part.alertAt
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {part.stock} {part.unit}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-purple-950/40 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Protocole Officiel Constructeurs (Bambu Wiki • xTool • eufyMake)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Les rappels sont calculés selon les heures réelles de fonctionnement de chaque machine.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {maintenance.map(task => {
                const ratio = Math.min(100, Math.round((task.hoursSinceLast / task.intervalHours) * 100));
                const isUrgent = ratio >= 85;
                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl bg-zinc-900/90 border flex flex-col justify-between gap-4 ${
                      isUrgent ? 'border-rose-500/50' : 'border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            {task.machine}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">{task.title}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {task.hoursSinceLast}h / {task.intervalHours}h
                        </span>
                      </div>

                      <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-amber-200/90 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{task.warning}</span>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>Usure depuis le dernier entretien ({task.lastDone})</span>
                          <span className="font-bold text-white">{ratio}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isUrgent ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400">
                        Matériel requis : <strong className="text-zinc-200">{task.requiredPart}</strong>
                      </span>
                      <button
                        onClick={() => completeMaintenance(task.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                      >
                        <Check className="w-4 h-4" /> Fait aujourd'hui
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS, QR CODE LABEL PRINTER & DIRECT SCAN-TO-MACHINE */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: Orders Queue */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Commandes Atelier & Fiches Suiveuses QR
                </h3>
                <button
                  onClick={() => setShowNewOrderModal(true)}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Créer une commande
                </button>
              </div>

              {orders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">
                            {order.id}
                          </span>
                          <span className="text-xs text-zinc-400">• {order.client}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{order.productName}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                        🎯 Cible : {order.targetMachine}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                        📄 {order.fileName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-300">
                        ⏰ {order.dueDate}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 truncate max-w-[60%]">{order.materialSpec}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSimulateQrDispatch(order);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5"
                      >
                        <Scan className="w-3.5 h-3.5" /> Tester Scan & Envoyer Machine
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right column: Live Thermal Label Preview & Print */}
            <div className="lg:col-span-5">
              {selectedOrder && (
                <div className="sticky top-6 rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Aperçu Étiquette Thermique (100x60mm)
                      </span>
                      <h4 className="text-base font-bold text-white">Prête pour impression & scan</h4>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Printer className="w-4 h-4" /> Imprimer Étiquette
                    </button>
                  </div>

                  {/* THERMAL LABEL VISUAL CARD */}
                  <div className="bg-white text-zinc-950 rounded-xl p-4 shadow-xl border-2 border-dashed border-zinc-300">
                    <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-2 mb-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          FABSTUDIO OS • SMART DISPATCH
                        </div>
                        <div className="text-lg font-black tracking-tight">{selectedOrder.id}</div>
                        <div className="text-xs font-bold text-zinc-700">{selectedOrder.client}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-black uppercase">
                          {selectedOrder.targetMachine}
                        </span>
                        <div className="text-[10px] font-bold text-zinc-600 mt-1">
                          Échéance : {selectedOrder.dueDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <QRCodePattern
                        value={`FABSTUDIO|${selectedOrder.id}|${selectedOrder.targetMachine}|${selectedOrder.fileName}`}
                        size={112}
                      />
                      <div className="flex-1 space-y-1.5 text-xs">
                        <div className="font-extrabold text-sm leading-snug">
                          {selectedOrder.productName}
                        </div>
                        <div>
                          <span className="font-bold text-zinc-600">Fichier : </span>
                          <code className="font-mono bg-zinc-100 px-1 rounded text-[11px]">
                            {selectedOrder.fileName}
                          </code>
                        </div>
                        <div>
                          <span className="font-bold text-zinc-600">Matériau : </span>
                          <span>{selectedOrder.materialSpec}</span>
                        </div>
                        <div className="text-[11px] bg-zinc-100 p-1.5 rounded border border-zinc-300 font-semibold">
                          ⚙️ {selectedOrder.presetParams}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-300 flex items-center justify-between text-[10px] font-bold text-zinc-500">
                      <span>SCANNER CE QR POUR CHARGER LA MACHINE</span>
                      <span>URI: fabstudio://run/{selectedOrder.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSimulateQrDispatch(selectedOrder)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Scan className="w-4 h-4" /> Simuler le Scan du QR Code vers {selectedOrder.targetMachine}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SMART MATERIAL & MACHINE PARAMETER ADVISOR */}
        {activeTab === 'copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Calculateur de Paramètres Certifiés
              </div>
              <h3 className="text-lg font-bold text-white">Sélectionnez votre Machine & Support</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Machine de votre atelier</label>
                  <select
                    value={advisorMachine}
                    onChange={e => setAdvisorMachine(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  >
                    <option value="Bambu Lab X1C">Bambu Lab X1C (CoreXY + Lidar)</option>
                    <option value="Bambu Lab P1S">Bambu Lab P1S (CoreXY Fermée)</option>
                    <option value="Bambu Lab A1">Bambu Lab A1 (Bedslinger)</option>
                    <option value="xTool M2">xTool M2 (Laser 20W + Inkjet)</option>
                    <option value="eufyMake E1">eufyMake E1 (Imprimante UV Relief)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Opération / Matériau</label>
                  <select
                    value={advisorMaterial}
                    onChange={e => setAdvisorMaterial(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white"
                  >
                    <option value="Contreplaqué Bouleau 3mm">Contreplaqué Bouleau 3mm (Découpe + Encre)</option>
                    <option value="Acrylique Noir 3mm">Acrylique Noir Opaque 3mm</option>
                    <option value="PAHT-CF (Nylon Carbone)">Bambu PAHT-CF (Nylon Fibre Carbone)</option>
                    <option value="PLA Matte / Basic">Bambu PLA Matte / Basic Haute Vitesse</option>
                    <option value="Texture UV Relief 3D">Impression UV Relief 3D (CMYK + Blanc + Vernis)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase text-purple-400">Fiche Technique Recommandée</span>
                  <h4 className="text-xl font-bold text-white">
                    {advisorMachine} × {advisorMaterial}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Profil Validé Atelier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Paramètre Principal</span>
                  <div className="text-sm font-bold text-white mt-1">
                    {advisorMachine === 'xTool M2'
                      ? 'Laser 20W : 100% Pwr • 10 mm/s'
                      : advisorMachine === 'eufyMake E1'
                      ? '2 passes Blanc W + CMYK + Vernis'
                      : 'Buse 220-290°C • Bed 60-100°C'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Préparation Support</span>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {advisorMachine === 'eufyMake E1'
                      ? 'Dégraissage IPA + Promoteur Adhérence'
                      : advisorMachine === 'xTool M2'
                      ? 'Focus Auto + Air Assist 100%'
                      : 'Plateau PEI Texturé propre'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Point de vigilance</span>
                  <div className="text-sm font-bold text-amber-400 mt-1">
                    {advisorMachine === 'Bambu Lab A1'
                      ? 'Éviter ABS/PAHT sur A1 ouverte (utiliser X1C)'
                      : 'Vérifier propreté optique / buse avant lancement'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: QR SCANNER -> DIRECT MACHINE DISPATCH */}
      {scannerModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Scan className="w-5 h-5" /> Lecture QR Code Détectée
              </div>
              <button
                onClick={() => setScannerModalOrder(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Commande :</span>
                <span className="font-mono font-bold text-white">{scannerModalOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Machine cible :</span>
                <span className="font-bold text-emerald-400">{scannerModalOrder.targetMachine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fichier de fabrication :</span>
                <span className="font-mono text-zinc-200">{scannerModalOrder.fileName}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 text-zinc-300">
                <strong>Préréglages transmis :</strong> {scannerModalOrder.presetParams}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Préparation du transfert réseau local...</span>
                <span className="text-emerald-400 font-bold">{dispatchProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${dispatchProgress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setScannerModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmSendToMachine}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4" /> Lancer sur {scannerModalOrder.targetMachine}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW INVENTORY ITEM */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddInventoryItem}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Ajouter un Consommable ou une Pièce</h3>
              <button type="button" onClick={() => setShowNewItemModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Nom de la référence</label>
                <input
                  required
                  type="text"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="Ex: Cartouche UV Cyan eufyMake E1"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Catégorie</label>
                <select
                  value={newItemForm.category}
                  onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="Encre UV & Jet">Encre UV & Jet</option>
                  <option value="Supports Laser & UV">Supports Laser & UV</option>
                  <option value="Pièces & Entretien">Pièces & Entretien</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Sous-type</label>
                <input
                  type="text"
                  value={newItemForm.subType}
                  onChange={e => setNewItemForm({ ...newItemForm, subType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Quantité actuelle</label>
                <input
                  type="number"
                  value={newItemForm.stock}
                  onChange={e => setNewItemForm({ ...newItemForm, stock: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Unité (%, pièces, plaques)</label>
                <input
                  type="text"
                  value={newItemForm.unit}
                  onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Machines compatibles (séparées par virgule)</label>
                <input
                  type="text"
                  value={newItemForm.machineCompat}
                  onChange={e => setNewItemForm({ ...newItemForm, machineCompat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
              >
                Enregistrer au Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CREATE NEW ORDER & QR LABEL */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOrder}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nouvelle Commande & Étiquette QR</h3>
              <button type="button" onClick={() => setShowNewOrderModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Client</label>
                <input
                  required
                  type="text"
                  value={newOrderForm.client}
                  onChange={e => setNewOrderForm({ ...newOrderForm, client: e.target.value })}
                  placeholder="Ex: Atelier Design"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Machine Cible</label>
                <select
                  value={newOrderForm.targetMachine}
                  onChange={e => setNewOrderForm({ ...newOrderForm, targetMachine: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                  <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                  <option value="Bambu Lab A1">Bambu Lab A1</option>
                  <option value="xTool M2">xTool M2 (20W + Inkjet)</option>
                  <option value="eufyMake E1">eufyMake E1 UV</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Description Produit / Série</label>
                <input
                  required
                  type="text"
                  value={newOrderForm.productName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, productName: e.target.value })}
                  placeholder="Ex: 30x Plaques Signalétiques UV + Découpe Laser"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Fichier (.3mf, .xcs, .eufy)</label>
                <input
                  type="text"
                  value={newOrderForm.fileName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, fileName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Échéance</label>
                <input
                  type="text"
                  value={newOrderForm.dueDate}
                  onChange={e => setNewOrderForm({ ...newOrderForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Matériau & Bobine</label>
                <input
                  type="text"
                  value={newOrderForm.materialSpec}
                  onChange={e => setNewOrderForm({ ...newOrderForm, materialSpec: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" /> Générer l'Étiquette QR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: IPHONE CAMERA BARCODE / QR SCANNER FOR BAMBU SPOOLS */}
      {spoolScannerModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${
                  spoolScannerMode === 'IN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {spoolScannerMode === 'IN' ? 'ENTRÉE STOCK (+1)' : 'SORTIE STOCK (-1)'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {spoolScannerMode === 'IN' ? 'Scanner une boîte reçue' : 'Scanner une bobine finie'}
                </h3>
              </div>
              <button
                onClick={() => setSpoolScannerModal(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                onClick={() => setSpoolScannerMode('IN')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  spoolScannerMode === 'IN' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                +1 Arrivée Boîte
              </button>
              <button
                onClick={() => setSpoolScannerMode('OUT')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  spoolScannerMode === 'OUT' ? 'bg-rose-600 text-white' : 'text-zinc-400'
                }`}
              >
                -1 Bobine Finie
              </button>
            </div>

            {/* iPhone Camera Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-60 mx-auto border border-zinc-800 flex items-center justify-center">
              <div id="bambu-iphone-reader" className="w-full h-full" />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-4">
                <span className="text-[11px] bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-zinc-200 border border-white/10">
                  Visez le code-barres de la boîte Bambu Lab
                </span>
                <div className="w-48 h-24 border-2 border-emerald-400/80 rounded-xl animate-pulse" />
                <span className="text-[10px] text-zinc-400 bg-black/60 px-2 py-0.5 rounded">
                  Compatible EAN / Code 5 chiffres / QR
                </span>
              </div>
            </div>

            {/* Manual Code or Barcode Input */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-zinc-400">
                Ou tapez le code Bambu Lab (ex: <span className="text-zinc-200 font-mono">10100</span> Blanc, <span className="text-zinc-200 font-mono">10101</span> Noir) :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcodeInput}
                  onChange={e => setManualBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleProcessScannedSpoolCode(manualBarcodeInput)}
                  placeholder="Code 5 chiffres (ex: 10100) ou EAN..."
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleProcessScannedSpoolCode(manualBarcodeInput)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Valider
                </button>
              </div>
            </div>

            {/* Quick Simulation Pills */}
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="block text-[11px] text-zinc-400 mb-2">Simuler un scan d'étiquette Bambu Lab :</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleProcessScannedSpoolCode('10100')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  PLA Jade White (10100)
                </button>
                <button
                  onClick={() => handleProcessScannedSpoolCode('10101')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  PLA Black (10101)
                </button>
                <button
                  onClick={() => handleProcessScannedSpoolCode('11101')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  Matte Charcoal (11101)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ASSIGN UNKNOWN BARCODE TO A BAMBU FILAMENT */}
      {pendingBarcode && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-amber-400" />
                Nouveau code-barres détecté
              </h3>
              <button
                onClick={() => setPendingBarcode(null)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Le code <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{pendingBarcode}</span> n'est pas encore relié à une couleur. Choisissez la bobine correspondante une seule fois : elle sera reconnue automatiquement à chaque futur scan !
            </p>
            <div>
              <select
                value={selectedAssignFilamentId}
                onChange={e => setSelectedAssignFilamentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {bambuCatalog.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.category} — {item.name} (#{item.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingBarcode(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmBarcodeAssignment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
              >
                Associer et Appliquer ({spoolScannerMode === 'IN' ? '+1' : '-1'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: GOOGLE DRIVE & CLOUD SYNC CONFIGURATION */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Synchronisation Google Drive</h3>
                  <p className="text-[11px] text-zinc-400">
                    Dossier ID : <span className="font-mono text-zinc-300">{GOOGLE_DRIVE_FOLDER_ID}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Sauvegarde Cloud Temps Réel Active
                </div>
                <p className="text-[11px] text-zinc-300">
                  Chaque scan (+1 / -1) sur votre iPhone est automatiquement synchronisé avec votre atelier.
                </p>
              </div>
              <a
                href={`https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                Ouvrir Drive
              </a>
            </div>

            {/* Apps Script Webhook Bridge */}
            <div className="space-y-2 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-white">
                1. Écriture automatique dans votre dossier Google Drive (Passerelle Apps Script)
              </label>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Pour que l'application écrive automatiquement le fichier <code className="text-emerald-400">stock_filaments_bambu.json</code> dans votre dossier Google Drive à chaque scan, collez l'URL Web App de votre script Google :
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={gasWebhookUrl}
                  onChange={e => setGasWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => pushSpoolCatalogToCloudAndDrive(bambuCatalog, gasWebhookUrl, true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Enregistrer
                </button>
              </div>

              <details className="pt-1">
                <summary className="text-[11px] font-semibold text-sky-400 cursor-pointer hover:underline">
                  Afficher et copier le code Google Apps Script (pré-configuré avec votre dossier)
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-[10px] font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-emerald-300 overflow-x-auto">
{`const FOLDER_ID = "${GOOGLE_DRIVE_FOLDER_ID}";
const FILE_NAME = "stock_filaments_bambu.json";

function doPost(e) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);
  const content = e.postData.contents;
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(FILE_NAME, content, MimeType.PLAIN_TEXT);
  }
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                  <button
                    type="button"
                    onClick={copyGasScriptToClipboard}
                    className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700"
                  >
                    Copier le script Google Drive
                  </button>
                </div>
              </details>
            </div>

            {/* Direct JSON Export / Import */}
            <div className="space-y-2 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-white">
                2. Fichier de sauvegarde directe (iPhone / Mac / PC)
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadDriveJson}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 border border-zinc-700"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Télécharger JSON
                </button>
                <label className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer">
                  <Upload className="w-4 h-4 text-sky-400" />
                  Charger depuis Drive
                  <input type="file" accept=".json" onChange={handleImportDriveJson} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD CUSTOM SPOOL REFERENCE */}
      {showCustomSpoolModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomSpool}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Ajouter une bobine personnalisée</h3>
              <button
                type="button"
                onClick={() => setShowCustomSpoolModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Marque & Type (ex: PLA Basic, Sunlu PETG...)</label>
                <input
                  type="text"
                  value={customSpoolForm.category}
                  onChange={e => setCustomSpoolForm({ ...customSpoolForm, category: e.target.value })}
                  placeholder="PLA Basic"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nom de la couleur</label>
                <input
                  type="text"
                  required
                  value={customSpoolForm.name}
                  onChange={e => setCustomSpoolForm({ ...customSpoolForm, name: e.target.value })}
                  placeholder="Ex: Bleu Galaxie"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Couleur visuelle</label>
                  <input
                    type="color"
                    value={customSpoolForm.hex}
                    onChange={e => setCustomSpoolForm({ ...customSpoolForm, hex: e.target.value })}
                    className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Code / Code-barres</label>
                  <input
                    type="text"
                    value={customSpoolForm.code}
                    onChange={e => setCustomSpoolForm({ ...customSpoolForm, code: e.target.value })}
                    placeholder="Ex: 99101"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomSpoolModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
              >
                Créer et Ajouter +1
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 8: ADD KANBAN TASK */}
      {showNewKanbanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateKanbanTask}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Ajouter un Projet au Kanban</h3>
              <button type="button" onClick={() => setShowNewKanbanModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Titre du job</label>
                <input
                  required
                  type="text"
                  value={newKanbanForm.title}
                  onChange={e => setNewKanbanForm({ ...newKanbanForm, title: e.target.value })}
                  placeholder="Ex: 25x Faces Avant Gravées Laser"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Client</label>
                <input
                  required
                  type="text"
                  value={newKanbanForm.client}
                  onChange={e => setNewKanbanForm({ ...newKanbanForm, client: e.target.value })}
                  placeholder="Ex: Studio Design"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Machine assignée</label>
                  <select
                    value={newKanbanForm.assignedMachine}
                    onChange={e => setNewKanbanForm({ ...newKanbanForm, assignedMachine: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                    <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                    <option value="Bambu Lab A1">Bambu Lab A1</option>
                    <option value="xTool M2">xTool M2</option>
                    <option value="eufyMake E1/E2">eufyMake E1/E2</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Temps estimé</label>
                  <input
                    type="text"
                    value={newKanbanForm.estTime}
                    onChange={e => setNewKanbanForm({ ...newKanbanForm, estTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewKanbanModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
              >
                Ajouter à la File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 9: ADD PRINT QUALITY LOG */}
      {showNewLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePrintLog}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Consigner un Print / Tirage (Journal Qualité)</h3>
              <button type="button" onClick={() => setShowNewLogModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Nom de la pièce / projet</label>
                <input
                  required
                  type="text"
                  value={newLogForm.projectName}
                  onChange={e => setNewLogForm({ ...newLogForm, projectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Machine</label>
                <select
                  value={newLogForm.machine}
                  onChange={e => setNewLogForm({ ...newLogForm, machine: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                  <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                  <option value="Bambu Lab A1">Bambu Lab A1</option>
                  <option value="xTool M2 (20W + Inkjet)">xTool M2 (20W + Inkjet)</option>
                  <option value="eufyMake E1/E2 UV">eufyMake E1/E2 UV</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Résultat</label>
                <select
                  value={newLogForm.outcome}
                  onChange={e => setNewLogForm({ ...newLogForm, outcome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                >
                  <option value="Succès">Succès</option>
                  <option value="Échec Partiel">Échec Partiel</option>
                  <option value="Échec">Échec</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1">Recette & Réglages validés (Températures, vitesses, passes UV/Laser)</label>
                <input
                  required
                  type="text"
                  value={newLogForm.validatedRecipe}
                  onChange={e => setNewLogForm({ ...newLogForm, validatedRecipe: e.target.value })}
                  placeholder="Ex: Buse 220°C • Bed 60°C PEI • Gyroid 15%"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>
              {newLogForm.outcome !== 'Succès' && (
                <div className="sm:col-span-2">
                  <label className="text-rose-400 block mb-1">Cause de l'échec identifiée</label>
                  <input
                    type="text"
                    value={newLogForm.failureCause}
                    onChange={e => setNewLogForm({ ...newLogForm, failureCause: e.target.value })}
                    placeholder="Ex: Détachement premier layer / buse encrassée"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-rose-500/40 text-white"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewLogModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
              >
                Enregistrer au Journal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}