export const GOOGLE_DRIVE_FOLDER_ID = '13rKelLC7tY2SDjm-Ry0sPD_-cRoavn_i';

export interface BambuSpool {
  id: string;
  code: string;
  brand: string;
  category: string;
  name: string;
  hex: string;
  temp: string;
  qty: number;
  opened: number;
  barcodes: string[];
}

export interface KanbanTask {
  id: string;
  title: string;
  client: string;
  stage: 'backlog' | 'ready' | 'printing' | 'postproc' | 'done';
  priority: 'Haute' | 'Normale' | 'Basse';
  assignedMachine: string;
  fileType: string;
  estTime: string;
  material: string;
  recommendedReason: string;
}

export interface PrintLogEntry {
  id: string;
  date: string;
  projectName: string;
  machine: string;
  material: string;
  outcome: 'Succès' | 'Échec Partiel' | 'Échec';
  score: string;
  failureCause: string | null;
  validatedRecipe: string;
  notes: string;
  swatchHex: string;
}

export interface SmartPlugInfo {
  plugName: string;
  isOn: boolean;
  watts: number;
  kwhToday: number;
  zone: string;
  x: number;
  y: number;
}

export interface AmsSlot {
  slot: string;
  type: string;
  colorName: string;
  hex: string;
  remain: number;
}

export interface UvChannel {
  code: string;
  name: string;
  hex: string;
  level: number;
}

export interface WorkshopMachine {
  id: string;
  name: string;
  shortName: string;
  category: string;
  status: 'Impression' | 'Prête' | 'Maintenance Requise';
  currentJob: string;
  progress: number;
  eta: string;
  hours: number;
  nozzle?: string;
  plate?: string;
  amsHumidity?: number | null;
  amsSlots?: AmsSlot[];
  moduleInstalled?: string;
  airAssist?: string;
  inkLevel?: number;
  lensState?: string;
  uvLampHealth?: number;
  channels?: UvChannel[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  subType: string;
  brand: string;
  colorHex: string;
  machineCompat: string[];
  stock: number;
  maxCap: number;
  unit: string;
  spoolsCount: number;
  alertAt: number;
  location: string;
  notes: string;
}

export interface MaintenanceTask {
  id: string;
  machine: string;
  badgeColor: string;
  title: string;
  warning: string;
  intervalHours: number;
  hoursSinceLast: number;
  lastDone: string;
  requiredPart: string;
}

export interface WorkshopOrder {
  id: string;
  client: string;
  productName: string;
  dueDate: string;
  priority: string;
  targetMachine: string;
  secondaryMachines: string[];
  materialSpec: string;
  fileName: string;
  presetParams: string;
  status: string;
}

export const INITIAL_BAMBU_CATALOG: BambuSpool[] = [
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

export const INITIAL_KANBAN_TASKS: KanbanTask[] = [
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

export const INITIAL_PRINT_LOGS: PrintLogEntry[] = [
  {
    id: 'LOG-01',
    date: 'Aujourd’hui, 14:20',
    projectName: 'Support Capteur Haute Température',
    machine: 'Bambu Lab X1C',
    material: 'Bambu PAHT-CF (#60101)',
    outcome: 'Succès',
    score: '9.8/10',
    failureCause: null,
    validatedRecipe: 'Buse 290°C · Bed 100°C PEI Texturé + Colle liquide · Vitesse max 120mm/s · Séchage bobine 12h à 80°C',
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
    validatedRecipe: 'Passe 1 : Inkjet 600dpi · Passe 2 : Laser 20W 100% / 10 mm/s / Air Assist 100% / Masking tape léger',
    notes: 'Zéro trace de fumée sur l’impression jet d’encre.',
    swatchHex: '#d97706'
  }
];

export const INITIAL_SMART_PLUGS: Record<string, SmartPlugInfo> = {
  'bambu-x1c': { plugName: 'Shelly Plug S #1 (X1C)', isOn: true, watts: 315, kwhToday: 2.84, zone: 'Îlot Impression 3D CoreXY', x: 10, y: 18 },
  'bambu-p1s': { plugName: 'Shelly Plug S #2 (P1S)', isOn: true, watts: 42, kwhToday: 1.45, zone: 'Îlot Impression 3D CoreXY', x: 41, y: 18 },
  'bambu-a1':  { plugName: 'Tapo P115 #3 (A1)', isOn: true, watts: 195, kwhToday: 1.12, zone: 'Établi Rapide PLA/PETG', x: 71, y: 18 },
  'xtool-m2':  { plugName: 'Shelly Plug S #4 (xTool + Extracteur)', isOn: true, watts: 68, kwhToday: 0.95, zone: 'Zone Laser & Aspiration', x: 20, y: 60 },
  'eufy-e1':   { plugName: 'Tapo P115 #5 (eufyMake UV)', isOn: true, watts: 85, kwhToday: 0.78, zone: 'Studio Impression UV Relief', x: 60, y: 60 }
};

export const INITIAL_MACHINES: WorkshopMachine[] = [
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
      { slot: 'L3', type: 'PLA Matte', colorName: 'Jaune Citron', hex: '#facc15', remain: 40 },
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

export const INITIAL_INVENTORY: InventoryItem[] = [
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
    brand: 'LaserGrade',
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

export const INITIAL_MAINTENANCE: MaintenanceTask[] = [
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

export const INITIAL_ORDERS: WorkshopOrder[] = [
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
    presetParams: 'Mode Relief 3D (1.5mm) · CMYK+W+V · Curing UV 100%',
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
    materialSpec: 'Bambu PAHT-CF (Slot A3) · Buse 0.4mm Trempée',
    fileName: 'Support_Capteur_PAHT_x12.3mf',
    presetParams: 'Buse 290°C · Plateau 100°C · Enceinte fermée · 4 périmètres',
    status: 'En cours (68%)'
  }
];
