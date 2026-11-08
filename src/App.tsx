import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Printer, Zap, Layers, Package, Wrench, QrCode,
  AlertTriangle, CheckCircle2, Plus, Search,
  RefreshCw, Play, Sparkles, Box, Droplet,
  Scan, Check, X, Flame, Cpu, Download,
  Disc, Cloud, Upload, ExternalLink, Link2, MinusCircle, PlusCircle, Library,
  Wifi, Calculator, Kanban, ClipboardCheck, Map, Power, Camera, Thermometer,
  ShieldAlert, ArrowRight, Activity, Sun, Moon, Command
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  GOOGLE_DRIVE_FOLDER_ID,
  INITIAL_BAMBU_CATALOG,
  INITIAL_KANBAN_TASKS,
  INITIAL_PRINT_LOGS,
  INITIAL_SMART_PLUGS,
  INITIAL_MACHINES,
  INITIAL_INVENTORY,
  INITIAL_MAINTENANCE,
  INITIAL_ORDERS,
  BambuSpool,
  KanbanTask,
  PrintLogEntry,
  SmartPlugInfo,
  WorkshopMachine,
  InventoryItem,
  MaintenanceTask,
  WorkshopOrder
} from './data/workshopData';
import {
  QRCodePattern,
  SpoolVisualizerSVG,
  CostDistributionBar
} from './components/VisualWidgets';

declare global {
  interface Window {
    Html5Qrcode?: any;
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

const STORAGE_KEYS = {
  THEME: 'fabstudio_theme_v4',
  CATALOG: 'fabstudio_bambu_catalog_v4',
  INVENTORY: 'fabstudio_inventory_v4',
  MAINTENANCE: 'fabstudio_maintenance_v4',
  ORDERS: 'fabstudio_orders_v4',
  KANBAN: 'fabstudio_kanban_v4',
  LOGS: 'fabstudio_print_logs_v4',
  PLUGS: 'fabstudio_smart_plugs_v4',
  WEBHOOK: 'fabstudio_gas_webhook_v4'
};

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const NAV_GROUPS = [
  {
    groupTitle: '01. Pilotage & Temps Réel',
    items: [
      { id: 'digital-twin', label: 'Digital Twin & Prises', icon: Map },
      { id: 'live-connect', label: 'Passerelle Cloud & AMS', icon: Wifi },
      { id: 'dashboard', label: 'Parc & Télémétrie', icon: Cpu }
    ]
  },
  {
    groupTitle: '02. Stocks & Filaments',
    items: [
      { id: 'bambu-spools', label: 'Bobines Bambu & Scan', icon: Disc },
      { id: 'inventory', label: 'Consommables & UV', icon: Package }
    ]
  },
  {
    groupTitle: '03. Production & Devis',
    items: [
      { id: 'kanban', label: 'Kanban Print & Cut', icon: Kanban },
      { id: 'forgecalc', label: 'Calculateur ForgeCalc', icon: Calculator },
      { id: 'orders', label: 'Commandes & QR Scan', icon: QrCode }
    ]
  },
  {
    groupTitle: '04. Qualité & Maintenance',
    items: [
      { id: 'maintenance', label: 'Maintenance & PEI', icon: Wrench },
      { id: 'print-log', label: 'Journal Qualité & Échecs', icon: ClipboardCheck },
      { id: 'copilot', label: 'Ingénieur Paramètres IA', icon: Sparkles }
    ]
  }
];

const TAB_META: Record<string, { group: string; title: string; subtitle: string }> = {
  'digital-twin': {
    group: 'Pilotage & Temps Réel',
    title: 'Digital Twin 2D & Pilotage Prises Connectées',
    subtitle: 'Topologie énergétique en direct des 5 îlots de production (Shelly Plug S & Tapo P115)'
  },
  'live-connect': {
    group: 'Pilotage & Temps Réel',
    title: 'Passerelle Cloud & LAN Unifiée',
    subtitle: 'Synchronisation MQTT Bambu Lab + 12 slots AMS RFID · xTool Creative Space · eufyMake Studio'
  },
  'dashboard': {
    group: 'Pilotage & Temps Réel',
    title: 'Centre de Contrôle Multi-Machines',
    subtitle: 'Télémétrie du parc : Bambu Lab X1C, P1S, A1 · Laser xTool M2 20W · Imprimante UV eufyMake E1/E2'
  },
  'bambu-spools': {
    group: 'Stocks & Filaments',
    title: 'Stock Filaments Bambu Lab & Scan iPhone',
    subtitle: 'Catalogue officiel 5 chiffres, lecture code-barres caméra (+1 / -1) et sauvegarde Google Drive'
  },
  'inventory': {
    group: 'Stocks & Filaments',
    title: 'Consommables, Encres UV, Supports Laser & Pièces',
    subtitle: 'Suivi des cartouches UV CMYK+W+V, plaques bouleau/acrylique, buses acier trempé et plateaux PEI'
  },
  'kanban': {
    group: 'Production & Devis',
    title: 'Kanban Print & Cut Queue',
    subtitle: 'Ordonnancement visuel multi-procédés avec affectation optimale par matériau'
  },
  'forgecalc': {
    group: 'Production & Devis',
    title: 'Calculateur de Coûts & Rentabilité ForgeCalc',
    subtitle: 'Chiffrage analytique précis : filament + purge AMS, encre UV au ml, électricité, amortissement et marge'
  },
  'orders': {
    group: 'Production & Devis',
    title: 'Studio Étiquettes Thermiques QR & Routage',
    subtitle: 'Génération de fiches suiveuses 100×60mm et déclenchement direct sur les machines'
  },
  'maintenance': {
    group: 'Qualité & Maintenance',
    title: 'Maintenance Prédictive & Pièces d’Usure',
    subtitle: 'Compteurs horaires constructeurs (Bambu Wiki · xTool · eufyMake) et réserve hotends/PEI'
  },
  'print-log': {
    group: 'Qualité & Maintenance',
    title: 'Journal Qualité, Recettes & Analyse d’Échecs',
    subtitle: 'Base de connaissances des profils validés en atelier et diagnostics post-mortem'
  },
  'copilot': {
    group: 'Qualité & Maintenance',
    title: 'Matrice de Paramètres Certifiés Atelier',
    subtitle: 'Préréglages éprouvés par couple Machine × Matériau (Températures, vitesses, passes UV et puissance laser)'
  }
};

export default function App() {
  // --- THEME STATE ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => loadPersisted(STORAGE_KEYS.THEME, true));

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.className = 'bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-zinc-950';
    } else {
      root.classList.remove('dark');
      document.body.className = 'bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white';
    }
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // --- NAVIGATION & COMMAND PALETTE ---
  const [activeTab, setActiveTab] = useState<string>('bambu-spools');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');

  // --- CORE WORKSHOP DATA (PERSISTED IN LOCALSTORAGE) ---
  const [machines, setMachines] = useState<WorkshopMachine[]>(INITIAL_MACHINES);
  const [bambuCatalog, setBambuCatalog] = useState<BambuSpool[]>(() =>
    loadPersisted(STORAGE_KEYS.CATALOG, INITIAL_BAMBU_CATALOG)
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadPersisted(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY)
  );
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>(() =>
    loadPersisted(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE)
  );
  const [orders, setOrders] = useState<WorkshopOrder[]>(() =>
    loadPersisted(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(() =>
    loadPersisted(STORAGE_KEYS.KANBAN, INITIAL_KANBAN_TASKS)
  );
  const [printLogs, setPrintLogs] = useState<PrintLogEntry[]>(() =>
    loadPersisted(STORAGE_KEYS.LOGS, INITIAL_PRINT_LOGS)
  );
  const [smartPlugs, setSmartPlugs] = useState<Record<string, SmartPlugInfo>>(() =>
    loadPersisted(STORAGE_KEYS.PLUGS, INITIAL_SMART_PLUGS)
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(bambuCatalog));
  }, [bambuCatalog]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenance));
  }, [maintenance]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KANBAN, JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(printLogs));
  }, [printLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLUGS, JSON.stringify(smartPlugs));
  }, [smartPlugs]);

  // --- BAMBU LAB SPOOL MODULE STATES ---
  const [spoolViewTab, setSpoolViewTab] = useState<'stock' | 'catalog'>('stock');
  const [spoolMaterialFilter, setSpoolMaterialFilter] = useState<string>('ALL');
  const [spoolSearch, setSpoolSearch] = useState<string>('');
  const [spoolScannerModal, setSpoolScannerModal] = useState<boolean>(false);
  const [spoolScannerMode, setSpoolScannerMode] = useState<'IN' | 'OUT'>('IN');
  const [manualBarcodeInput, setManualBarcodeInput] = useState<string>('');
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [selectedAssignFilamentId, setSelectedAssignFilamentId] = useState<string>(INITIAL_BAMBU_CATALOG[0].id);
  const [showCustomSpoolModal, setShowCustomSpoolModal] = useState<boolean>(false);
  const [customSpoolForm, setCustomSpoolForm] = useState({
    category: 'PLA Basic',
    name: '',
    hex: '#00AE42',
    code: ''
  });

  // --- CLOUD & GOOGLE DRIVE SYNC STATES ---
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [gasWebhookUrl, setGasWebhookUrl] = useState<string>(() => loadPersisted(STORAGE_KEYS.WEBHOOK, ''));
  const [cloudStatus, setCloudStatus] = useState<{ state: string; label: string }>({
    state: 'connecting',
    label: 'Synchro Prête'
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>('Sauvegarde locale active');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const dbRef = useRef<{ db: any; appId: string } | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const qrScannerInstanceRef = useRef<any>(null);

  // --- FILTERS & UI STATES ---
  const [invCategory, setInvCategory] = useState<string>('Tous');
  const [invSearch, setInvSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<WorkshopOrder>(orders[0] || INITIAL_ORDERS[0]);
  const [scannerModalOrder, setScannerModalOrder] = useState<WorkshopOrder | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: string; customHex: string | null } | null>(null);

  // Modals for adding items/orders
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
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

  const [showNewOrderModal, setShowNewOrderModal] = useState<boolean>(false);
  const [newOrderForm, setNewOrderForm] = useState({
    client: '',
    productName: '',
    targetMachine: 'Bambu Lab X1C',
    materialSpec: 'PLA Matte Noir · Buse 0.4mm',
    fileName: 'Piece_Client_v1.3mf',
    presetParams: '0.20mm Standard · 15% Gyroid · PEI Texturé',
    priority: 'Normale',
    dueDate: 'Demain 17:00'
  });

  // Smart Param Advisor State
  const [advisorMachine, setAdvisorMachine] = useState<string>('xTool M2');
  const [advisorMaterial, setAdvisorMaterial] = useState<string>('Contreplaqué Bouleau 3mm');

  // --- LIVE CLOUD / LAN / MQTT CONNECTION STATES ---
  const [liveTelemetryActive, setLiveTelemetryActive] = useState<boolean>(true);
  const [liveConnections] = useState({
    bambuCloud: {
      connected: true,
      mode: 'Bambu Cloud + LAN MQTT',
      account: 'atelier@bambulab.eu',
      latency: '24 ms',
      amsSync: 'RFID Temps Réel Actif'
    },
    xtoolLink: {
      connected: true,
      mode: 'xTool Creative Space Wi-Fi',
      ip: '192.168.1.48',
      airAssist: 'Auto 100%',
      purifier: 'Actif'
    },
    eufyLink: {
      connected: true,
      mode: 'eufyMake Studio Cloud (E1/E2)',
      ip: '192.168.1.52',
      uvCuring: 'LED Dual-UV OK',
      autoClean: 'Programmé (12h)'
    }
  });
  const [liveTemps, setLiveTemps] = useState<
    Record<string, { nozzle: number; targetNozzle: number; bed: number; chamber: number | null }>
  >({
    'bambu-x1c': { nozzle: 288, targetNozzle: 290, bed: 100, chamber: 52 },
    'bambu-p1s': { nozzle: 24, targetNozzle: 0, bed: 25, chamber: 26 },
    'bambu-a1': { nozzle: 220, targetNozzle: 220, bed: 60, chamber: null }
  });

  // --- FORGECALC COST & PRICING CALCULATOR ---
  const [calcForm, setCalcForm] = useState({
    projectName: 'Trophée Sur-Mesure / Pièce Série',
    processType: '3d',
    selectedMachineId: 'bambu-x1c',
    selectedSpoolId: '10101',
    filamentPricePerKg: 24.99,
    weightGrams: 145,
    wasteFactorPct: 8,
    uvInkMl: 4.5,
    uvInkCostPerMl: 0.85,
    sheetMaterialCost: 3.5,
    printHours: 3.5,
    powerWatts: 310,
    elecRateKwh: 0.2516,
    machinePurchasePrice: 1499,
    machineLifespanHours: 4000,
    prepMinutes: 15,
    postProcMinutes: 10,
    hourlyLaborRate: 35,
    failureRatePct: 5,
    packagingCost: 1.5,
    marginMultiplier: 2.5,
    vatPct: 20,
    quantity: 10
  });

  // --- KANBAN QUEUE STATE ---
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showNewKanbanModal, setShowNewKanbanModal] = useState<boolean>(false);
  const [newKanbanForm, setNewKanbanForm] = useState({
    title: '',
    client: '',
    priority: 'Normale' as 'Haute' | 'Normale' | 'Basse',
    assignedMachine: 'Bambu Lab X1C',
    fileType: '.3mf',
    estTime: '2h 00m',
    material: 'PLA Basic Noir'
  });

  // --- PRINT LOG & QUALITY JOURNAL STATE ---
  const [showNewLogModal, setShowNewLogModal] = useState<boolean>(false);
  const [newLogForm, setNewLogForm] = useState({
    projectName: '',
    machine: 'Bambu Lab X1C',
    material: 'PLA Matte Charcoal',
    outcome: 'Succès' as 'Succès' | 'Échec Partiel' | 'Échec',
    score: '9.5/10',
    failureCause: '',
    validatedRecipe: '',
    notes: ''
  });

  // --- DIGITAL TWIN SELECTED MACHINE ---
  const [selectedTwinMachineId, setSelectedTwinMachineId] = useState<string>('bambu-x1c');

  // --- KEYBOARD SHORTCUT FOR COMMAND PALETTE (Cmd+K / Ctrl+K) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
    const uvCost =
      calcForm.processType === 'uv' || calcForm.processType === 'hybrid'
        ? calcForm.uvInkMl * calcForm.uvInkCostPerMl
        : 0;
    const sheetCost =
      calcForm.processType === 'laser' || calcForm.processType === 'uv' || calcForm.processType === 'hybrid'
        ? Number(calcForm.sheetMaterialCost)
        : 0;
    const rawMaterialTotal = filamentCost + uvCost + sheetCost;

    const energyKwh = (calcForm.powerWatts / 1000) * calcForm.printHours;
    const electricityCost = energyKwh * calcForm.elecRateKwh;
    const depreciationCost =
      (calcForm.machinePurchasePrice / Math.max(1, calcForm.machineLifespanHours)) * calcForm.printHours;
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
      rawMaterialNum: rawMaterialTotal,
      machineNum: machineTotal,
      laborNum: laborCost,
      bufferNum: failureBuffer + Number(calcForm.packagingCost),
      profitNum: Math.max(0, netProfitPerUnit),
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

  const triggerToast = (message: string, type = 'success', customHex: string | null = null) => {
    setToast({ message, type, customHex });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle Smart Plug Power in Digital Twin
  const toggleSmartPlug = (machineId: string) => {
    setSmartPlugs(prev => {
      const current = prev[machineId];
      if (!current) return prev;
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
          watts: nextState ? (machineId === 'bambu-x1c' ? 315 : machineId === 'bambu-a1' ? 195 : 68) : 0
        }
      };
    });
  };

  // Move Kanban Card
  const moveKanbanTask = (taskId: string, newStage: KanbanTask['stage']) => {
    setKanbanTasks(prev => prev.map(t => (t.id === taskId ? { ...t, stage: newStage } : t)));
    triggerToast('File de production Kanban mise à jour');
  };

  const handleCreateKanbanTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: KanbanTask = {
      id: `KAN-${Math.floor(200 + Math.random() * 799)}`,
      ...newKanbanForm,
      stage: 'backlog',
      recommendedReason: 'Assigné selon disponibilité parc'
    };
    setKanbanTasks([newTask, ...kanbanTasks]);
    setShowNewKanbanModal(false);
    setNewKanbanForm({
      title: '',
      client: '',
      priority: 'Normale',
      assignedMachine: 'Bambu Lab X1C',
      fileType: '.3mf',
      estTime: '2h 00m',
      material: 'PLA Basic Noir'
    });
    triggerToast(`Projet "${newTask.title}" ajouté au Kanban`);
  };

  const handleCreatePrintLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: PrintLogEntry = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      date: "Aujourd'hui",
      ...newLogForm,
      failureCause: newLogForm.outcome === 'Succès' ? null : newLogForm.failureCause || 'À préciser',
      swatchHex: newLogForm.outcome === 'Succès' ? '#10b981' : '#f43f5e'
    };
    setPrintLogs([newLog, ...printLogs]);
    setShowNewLogModal(false);
    triggerToast('Entrée ajoutée au Journal Qualité & Print Log');
  };

  // --- INITIALIZE FIREBASE CLOUD SYNC + GOOGLE DRIVE FOLDER LINK ---
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const initFirebaseSync = async () => {
      try {
        if (typeof window.__firebase_config === 'undefined') {
          setCloudStatus({ state: 'local', label: 'Drive & Local' });
          return;
        }
        const firebaseConfig = JSON.parse(window.__firebase_config);
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'bambu-spool-manager';
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        dbRef.current = { db, appId };

        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, user => {
          setFirebaseUser(user);
        });

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const stockDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bambu_drive_inventory',
          GOOGLE_DRIVE_FOLDER_ID
        );

        unsubscribeSnapshot = onSnapshot(
          stockDocRef,
          snapshot => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              isRemoteUpdateRef.current = true;
              if (data.catalogJson) {
                try {
                  const parsed = JSON.parse(data.catalogJson);
                  if (Array.isArray(parsed)) setBambuCatalog(parsed);
                } catch {}
              }
              if (data.gasWebhookUrl !== undefined) {
                setGasWebhookUrl(data.gasWebhookUrl);
              }
              if (data.updatedAt) {
                const timeStr = new Date(data.updatedAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                setLastSyncTime(`Synchro Cloud à ${timeStr}`);
              }
              isRemoteUpdateRef.current = false;
              setCloudStatus({ state: 'online', label: 'Synchro Active' });
            } else {
              setCloudStatus({ state: 'online', label: 'Synchro Active' });
            }
          },
          () => {
            setCloudStatus({ state: 'local', label: 'Drive & Local' });
          }
        );
      } catch {
        setCloudStatus({ state: 'local', label: 'Drive & Local' });
      }
    };

    initFirebaseSync();
    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Save catalog to Cloud & Google Drive Webhook
  const pushSpoolCatalogToCloudAndDrive = async (
    updatedCatalog: BambuSpool[],
    customWebhook = gasWebhookUrl,
    manualFeedback = false
  ) => {
    if (isRemoteUpdateRef.current) return;
    setCloudStatus({ state: 'syncing', label: 'Sauvegarde...' });
    localStorage.setItem(STORAGE_KEYS.WEBHOOK, JSON.stringify(customWebhook || ''));

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
        const stockDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'bambu_drive_inventory',
          GOOGLE_DRIVE_FOLDER_ID
        );
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
      setLastSyncTime(`Synchro à ${timeStr}`);
      setCloudStatus({ state: 'online', label: 'Sauvegardé' });

      if (manualFeedback) {
        triggerToast('Stock sauvegardé localement et synchronisé vers Google Drive !');
      }
    } catch {
      setCloudStatus({ state: 'local', label: 'Sauvegardé (Local)' });
    }
  };

  // --- IPHONE CAMERA BARCODE / QR SCANNER (HTML5-QRCODE DYNAMIC LOADER) ---
  useEffect(() => {
    if (!spoolScannerModal) {
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current
          .stop()
          .then(() => {
            qrScannerInstanceRef.current.clear();
            qrScannerInstanceRef.current = null;
          })
          .catch(() => {
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
        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 120 } },
            (decodedText: string) => {
              handleProcessScannedSpoolCode(decodedText);
            },
            () => {}
          )
          .catch(() => {});
      } catch {}
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
  const adjustBambuSpoolQty = (id: string, delta: number) => {
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
  const handleProcessScannedSpoolCode = (rawCode: string) => {
    const cleanCode = String(rawCode || '').trim();
    if (!cleanCode) return;

    const found = bambuCatalog.find(
      item =>
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
      triggerToast(
        `Code ${pendingBarcode} associé à ${target.name} (${delta > 0 ? '+1' : '-1'})`,
        'success',
        target.hex
      );
    }
    pushSpoolCatalogToCloudAndDrive(updated);
  };

  // Create custom spool reference
  const handleSaveCustomSpool = (e: React.FormEvent) => {
    e.preventDefault();
    const code = customSpoolForm.code.trim() || String(Math.floor(90000 + Math.random() * 9999));
    const name = customSpoolForm.name.trim() || 'Couleur Perso';
    const newSpool: BambuSpool = {
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
  const handleImportDriveJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const parsed = JSON.parse(result);
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
      } catch {
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
    navigator.clipboard?.writeText(scriptText).catch(() => {});
    triggerToast('Script Google Drive copié dans le presse-papier !');
  };

  // Computed Bambu Spool statistics & filtered list
  const totalBambuSpools = useMemo(
    () => bambuCatalog.reduce((acc, item) => acc + item.qty, 0),
    [bambuCatalog]
  );
  const uniqueInStockBambuRefs = useMemo(
    () => bambuCatalog.filter(item => item.qty > 0).length,
    [bambuCatalog]
  );

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
  const adjustStock = (id: string, delta: number) => {
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
  const completeMaintenance = (id: string) => {
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
  const handleSimulateQrDispatch = (order: WorkshopOrder) => {
    setScannerModalOrder(order);
    setDispatchProgress(15);
    setTimeout(() => setDispatchProgress(60), 450);
    setTimeout(() => setDispatchProgress(100), 950);
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
    triggerToast(
      `Job "${scannerModalOrder.fileName}" envoyé directement sur ${scannerModalOrder.targetMachine} !`
    );
    setScannerModalOrder(null);
    setDispatchProgress(0);
  };

  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
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

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: WorkshopOrder = {
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

  // Command Palette filtered results
  const commandSpoolMatches = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return bambuCatalog.filter(s => s.qty > 0).slice(0, 5);
    return bambuCatalog
      .filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [bambuCatalog, commandQuery]);

  const currentMeta = TAB_META[activeTab] || TAB_META['bambu-spools'];

  const getTabCountIndicator = (tabId: string): string | null => {
    if (tabId === 'bambu-spools') return `${totalBambuSpools}`;
    if (tabId === 'kanban') return `${kanbanTasks.length}`;
    if (tabId === 'maintenance' && urgentMaintenance.length > 0) return `${urgentMaintenance.length}!`;
    if (tabId === 'inventory' && lowStockItems.length > 0) return `${lowStockItems.length}`;
    if (tabId === 'orders') return `${orders.length}`;
    if (tabId === 'print-log') return `${printLogs.length}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row font-sans transition-colors duration-150">
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white shadow-xl">
          <span
            className="w-3 h-3 rounded-sm shrink-0 border border-black/10 dark:border-white/20"
            style={{ backgroundColor: toast.customHex || (toast.type === 'error' ? '#f43f5e' : '#10b981') }}
          />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION (268px DESKTOP WORKSPACE CANVAS) */}
      <aside className="w-full md:w-[268px] bg-white dark:bg-zinc-900/95 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Identity Lockup */}
          <div className="h-16 px-5 border-b border-slate-200 dark:border-zinc-800/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white block truncate">
                  FabStudio OS
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
                  3D · Laser 20W · UV E1
                </span>
              </div>
            </div>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Recherche & Actions rapides (⌘K)"
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[11px] font-mono text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Command className="w-3 h-3" /> K
            </button>
          </div>

          {/* Compact 5-Machine Fleet Telemetry Strip */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
              <span className="font-medium">Parc 5 Machines</span>
              <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {Object.values(smartPlugs).reduce((acc, p) => acc + p.watts, 0)} W
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {machines.map(m => {
                const isPrinting = m.status === 'Impression';
                const isMaint = m.status === 'Maintenance Requise';
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedTwinMachineId(m.id);
                      setActiveTab('digital-twin');
                    }}
                    title={`${m.name} — ${m.status}`}
                    className={`py-1.5 px-1 rounded-md text-center border text-[10px] font-mono font-semibold transition-colors whitespace-nowrap truncate ${
                      isPrinting
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : isMaint
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {m.shortName.replace('eufyMake UV', 'E1 UV').replace('xTool M2', 'M2')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Horizontal Nav Bar */}
          <nav className="flex md:hidden overflow-x-auto p-2 gap-1 border-b border-slate-200 dark:border-zinc-800">
            {NAV_GROUPS.flatMap(g => g.items).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Grouped Navigation */}
          <nav className="hidden md:block p-3 space-y-5">
            {NAV_GROUPS.map(group => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-2.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 tracking-tight">
                  {group.groupTitle}
                </div>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const countText = getTabCountIndicator(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-600/12 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {countText && (
                          <span
                            className={`text-[11px] font-mono tabular-nums ${
                              item.id === 'maintenance'
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : isActive
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          >
                            {countText}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Workshop Alert Panel */}
        <div className="hidden md:block p-3.5 m-3 rounded-xl bg-slate-100/80 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Point de vigilance UV
            </span>
            <span className="font-mono tabular-nums">19%</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
            <strong>eufyMake E1 :</strong> Canal Blanc Relief (W) bas. Agiter la cartouche 2 min avant tirage texture.
          </p>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-800 dark:text-zinc-200 transition-colors flex items-center justify-between"
          >
            <span>Protocole de purge</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER (STRICT 3-ZONE SAAS DASHBOARD CONTRACT) */}
        <header className="h-16 px-4 md:px-7 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/90 flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Zone 1: Contextual Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-400 dark:text-zinc-500 hidden sm:inline whitespace-nowrap">
              {currentMeta.group}
            </span>
            <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">/</span>
            <span className="font-display font-bold text-slate-900 dark:text-white truncate">
              {currentMeta.title}
            </span>
          </div>

          {/* Zone 2: Quick Search / Command Palette Trigger & Cloud Sync Indicator */}
          <div className="hidden xl:flex items-center gap-3">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-72 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-between whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Rechercher bobine, machine, action...</span>
              </span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setShowDriveModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-950 hover:bg-slate-200/70 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              title="Synchronisation Google Drive & Sauvegarde JSON"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{cloudStatus.label}</span>
            </button>
          </div>

          {/* Zone 3: Primary Actions & Theme Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors"
              title={isDarkMode ? 'Passer en Mode Clair Atelier' : 'Passer en Mode Sombre Industriel'}
              aria-label="Basculer le thème clair ou sombre"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setActiveTab('bambu-spools');
                setSpoolScannerMode('IN');
                setSpoolScannerModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 dark:border-zinc-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Scan className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scanner Boîte (+1/-1)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setShowNewOrderModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Étiquette QR</span>
            </button>
          </div>
        </header>

        {/* SUBHEADER CONTEXT BAR */}
        <div className="px-4 md:px-7 py-4 border-b border-slate-200/80 dark:border-zinc-900 bg-white/40 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-slate-600 dark:text-zinc-400">{currentMeta.subtitle}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 font-mono tabular-nums whitespace-nowrap">
            <span>Stock : {totalBambuSpools} bobines</span>
            <span>·</span>
            <span>Drive : {GOOGLE_DRIVE_FOLDER_ID.slice(0, 8)}…</span>
            <button
              onClick={() => setShowDriveModal(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-sans font-medium"
            >
              Configurer Drive
            </button>
          </div>
        </div>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 p-4 md:p-7 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* ===================================================================== */}
          {/* TAB 1: DIGITAL TWIN 2D INTERACTIVE WORKSHOP MAP & SMART PLUGS         */}
          {/* ===================================================================== */}
          {activeTab === 'digital-twin' && (
            <div className="space-y-6">
              {/* Top Telemetry Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Puissance Instantanée Atelier</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                      {Object.values(smartPlugs).reduce((acc, p) => acc + p.watts, 0)} W
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {Object.values(smartPlugs).filter(p => p.isOn).length} / 5 prises sous tension
                    </span>
                  </div>
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Consommation Cumulée Jour</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      {Object.values(smartPlugs)
                        .reduce((acc, p) => acc + p.kwhToday, 0)
                        .toFixed(2)}{' '}
                      kWh
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      ≈ {(Object.values(smartPlugs).reduce((acc, p) => acc + p.kwhToday, 0) * 0.2516).toFixed(2)} € TTC (Tarif EDF)
                    </span>
                  </div>
                  <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Hygrométrie Moyenne AMS</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-1">
                      21 % RH
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Silice active · X1C (18%) · P1S (24%)
                    </span>
                  </div>
                  <Droplet className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Extraction & Filtration UV/Laser</span>
                    <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Nominale
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Air Assist 100% · Curing LED OK
                    </span>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                </div>
              </div>

              {/* Interactive 2D Floorplan + Selected Station Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: 2D Architectural Digital Twin Canvas */}
                <div className="lg:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        Plan Interactif de l’Atelier · Cliquez sur un îlot pour piloter son alimentation
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Production
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-sky-500" /> Prête
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-xs bg-amber-500" /> Maintenance
                      </span>
                    </div>
                  </div>

                  {/* Interactive Floorplan Blueprint */}
                  <div
                    className="relative w-full h-[430px] rounded-xl bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 overflow-hidden p-4 select-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  >
                    {/* Architectural SVG Overlay: Zones & Power Bus */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 800 430"
                      preserveAspectRatio="none"
                    >
                      {/* Zone A Boundary */}
                      <rect
                        x="24"
                        y="20"
                        width="752"
                        height="195"
                        rx="12"
                        fill="rgba(16, 185, 129, 0.03)"
                        stroke="rgba(16, 185, 129, 0.22)"
                        strokeDasharray="6 4"
                      />
                      {/* Zone B Boundary */}
                      <rect
                        x="24"
                        y="232"
                        width="365"
                        height="178"
                        rx="12"
                        fill="rgba(245, 158, 11, 0.03)"
                        stroke="rgba(245, 158, 11, 0.22)"
                        strokeDasharray="6 4"
                      />
                      {/* Zone C Boundary */}
                      <rect
                        x="411"
                        y="232"
                        width="365"
                        height="178"
                        rx="12"
                        fill="rgba(168, 85, 247, 0.03)"
                        stroke="rgba(168, 85, 247, 0.22)"
                        strokeDasharray="6 4"
                      />
                    </svg>

                    {/* Zone Headers */}
                    <div className="absolute top-4 left-6 text-[11px] font-mono text-emerald-400/90 tracking-tight">
                      ZONE A · ÎLOT IMPRESSION 3D COREXY & AMS (BAMBU LAB X1C · P1S · A1)
                    </div>
                    <div className="absolute top-[244px] left-6 text-[11px] font-mono text-amber-400/90 tracking-tight">
                      ZONE B · DÉCOUPE LASER 20W & EXTRACTION
                    </div>
                    <div className="absolute top-[244px] left-[53%] text-[11px] font-mono text-purple-400/90 tracking-tight">
                      ZONE C · STUDIO IMPRESSION UV RELIEF & CURING
                    </div>

                    {/* Interactive Machine Nodes */}
                    {machines.map(m => {
                      const plug = smartPlugs[m.id] || INITIAL_SMART_PLUGS[m.id];
                      const isSelected = selectedTwinMachineId === m.id;
                      const isPrinting = m.status === 'Impression';
                      const isMaint = m.status === 'Maintenance Requise';
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedTwinMachineId(m.id)}
                          style={{ left: `${plug.x}%`, top: `${plug.y}%` }}
                          className={`absolute w-44 sm:w-52 p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                            !plug.isOn
                              ? 'bg-zinc-900/60 border-zinc-800 opacity-50'
                              : isSelected
                              ? 'bg-zinc-900 border-emerald-400 ring-2 ring-emerald-400/25 shadow-lg'
                              : 'bg-zinc-900/95 border-zinc-700/90 hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-xs shrink-0 ${
                                  !plug.isOn
                                    ? 'bg-zinc-600'
                                    : isPrinting
                                    ? 'bg-emerald-400'
                                    : isMaint
                                    ? 'bg-amber-400'
                                    : 'bg-sky-400'
                                }`}
                              />
                              <span className="text-xs font-display font-bold text-white truncate">
                                {m.shortName}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-emerald-400">
                              {plug.watts}W
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-400 truncate">{m.currentJob}</div>

                          {m.progress > 0 && plug.isOn && (
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${m.progress}%` }}
                              />
                            </div>
                          )}

                          <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400 truncate">
                              {plug.isOn ? m.status : 'Hors Tension'}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleSmartPlug(m.id);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors ${
                                plug.isOn
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
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

                {/* Right: Selected Machine & Smart Plug Inspector */}
                <div className="lg:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-5">
                  {(() => {
                    const machine = machines.find(m => m.id === selectedTwinMachineId) || machines[0];
                    const plug = smartPlugs[machine.id] || INITIAL_SMART_PLUGS[machine.id];
                    const temps = liveTemps[machine.id];
                    return (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
                            <div>
                              <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                                {plug.zone}
                              </span>
                              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                                {machine.name}
                              </h3>
                            </div>
                            <button
                              onClick={() => toggleSmartPlug(machine.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                                plug.isOn
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {plug.isOn ? 'Prise ON' : 'Prise OFF'}
                            </button>
                          </div>

                          {/* Smart Plug Metrics */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-zinc-400">{plug.plugName}</span>
                              <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                                {plug.watts} W actifs
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                                  Énergie Jour
                                </span>
                                <span className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                  {plug.kwhToday} kWh
                                </span>
                              </div>
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                                  Coût Jour
                                </span>
                                <span className="text-sm font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                                  {(plug.kwhToday * 0.2516).toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Live Temperatures for 3D Printers */}
                          {temps && (
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                                Télémétrie Thermique
                              </span>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                                    Buse
                                  </span>
                                  <span className="text-xs font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                                    {temps.nozzle}°C
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                                    Plateau PEI
                                  </span>
                                  <span className="text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                                    {temps.bed}°C
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                                    Chambre
                                  </span>
                                  <span className="text-xs font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400">
                                    {temps.chamber ? `${temps.chamber}°C` : 'Ouverte'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* AMS Slots or UV Channels */}
                          {machine.amsSlots && (
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block">
                                Bobines chargées ({machine.shortName === 'A1' ? 'AMS Lite' : 'AMS RFID'})
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {machine.amsSlots.map(s => (
                                  <div
                                    key={s.slot}
                                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5"
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shrink-0"
                                      style={{ backgroundColor: s.hex }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {s.slot} · {s.type}
                                      </div>
                                      <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-zinc-400">
                                        {s.remain}% restant
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {machine.channels && (
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block">
                                Canaux UV (CMYK + Blanc W + Vernis V)
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                {machine.channels.map(ch => (
                                  <div
                                    key={ch.code}
                                    className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
                                  >
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {ch.code}
                                    </span>
                                    <span
                                      className={`text-xs font-mono tabular-nums font-semibold ${
                                        ch.level <= 25
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : 'text-slate-600 dark:text-zinc-300'
                                      }`}
                                    >
                                      {ch.level}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex gap-2">
                          <button
                            onClick={() => setActiveTab('live-connect')}
                            className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-white transition-colors whitespace-nowrap"
                          >
                            Réseau Cloud/LAN
                          </button>
                          <button
                            onClick={() => setActiveTab('kanban')}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                          >
                            File Kanban
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
          {/* TAB 2: LIVE CLOUD & LAN CONNECTION (BAMBU CLOUD/AMS, XTOOL, EUFY)     */}
          {/* ===================================================================== */}
          {activeTab === 'live-connect' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                    Synchronisation Matérielle Temps Réel (MQTT · Wi-Fi Local · Cloud)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Lecture directe des puces RFID sur les 12 emplacements AMS, télémétrie optique xTool M2 et niveaux d’encre UV eufyMake.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setLiveTelemetryActive(!liveTelemetryActive)}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors whitespace-nowrap"
                  >
                    {liveTelemetryActive ? 'Pause Télémétrie' : 'Reprendre Télémétrie'}
                  </button>
                  <button
                    onClick={() =>
                      triggerToast('Synchronisation RFID AMS + Niveaux UV eufyMake effectuée !')
                    }
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Forcer Synchro AMS & Capteurs
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. BAMBU LAB CLOUD & AMS BRIDGE */}
                <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Connecté · MQTT + Cloud
                      </span>
                      <span className="font-mono tabular-nums">{liveConnections.bambuCloud.latency}</span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                      Bambu Lab Cloud & AMS (X1C · P1S · A1)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Remontée en direct des 12 emplacements AMS (4x X1C, 4x P1S, 4x AMS Lite A1), températures buses/plateaux et hygrométrie.
                    </p>

                    <div className="pt-2 divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Compte Bambu :</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {liveConnections.bambuCloud.account}
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Protocole :</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {liveConnections.bambuCloud.mode}
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Puces RFID AMS :</span>
                        <span className="font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                          12 / 12 Bobines détectées
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast('12 bobines AMS synchronisées avec le stock Bambu Lab !')
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                  >
                    Déduire l’usure AMS du Stock Bobines
                  </button>
                </div>

                {/* 2. XTOOL M2 (20W + INKJET) BRIDGE */}
                <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Connecté · Wi-Fi Local
                      </span>
                      <span className="font-mono tabular-nums">{liveConnections.xtoolLink.ip}</span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                      xTool M2 (Laser 20W + Tête Inkjet)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Surveillance de l’état optique de la lentille laser 20W, niveau de la cartouche jet d’encre CMYK et pilotage Air Assist.
                    </p>

                    <div className="pt-2 divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Module Détecté :</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          Diode 20W + Module Encre
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Niveau Cartouche Encre :</span>
                        <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                          64 %
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Air Assist & Purificateur :</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {liveConnections.xtoolLink.airAssist}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast('Test Air Assist & Pointeur Laser xTool M2 envoyé !')
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
                  >
                    Tester Connexion & Air Assist xTool
                  </button>
                </div>

                {/* 3. EUFYMAKE E1 / E2 UV PRINTER BRIDGE */}
                <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Connecté · eufyMake Cloud
                      </span>
                      <span className="font-mono tabular-nums">{liveConnections.eufyLink.ip}</span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                      eufyMake E1 / E2 UV Texture Printer
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Monitoring des 6 canaux UV (CMYK + Blanc Relief W + Vernis Gloss V), santé lampe LED UV et cycles d’auto-nettoyage.
                    </p>

                    <div className="pt-2 divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Alerte Canal Blanc (W) :</span>
                        <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                          19 % (Agitation requise)
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Canal Vernis Gloss (V) :</span>
                        <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                          24 %
                        </span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Capping Station Auto :</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {liveConnections.eufyLink.autoClean}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      triggerToast('Cycle de micro-brassage Encre Blanche (W) lancé sur eufyMake !')
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                  >
                    Lancer Brassage Blanc (W) & Check Buses
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: DASHBOARD & FLEET TELEMETRY                                    */}
          {/* ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Machines en Production</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      2 / 5
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      X1C (68%) · A1 (91%)
                    </span>
                  </div>
                  <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Bobines Bambu en Stock</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                      {totalBambuSpools}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {uniqueInStockBambuRefs} références actives
                    </span>
                  </div>
                  <Disc className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Maintenances Préventives</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                      {urgentMaintenance.length}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tiges X1C · Vis P1S · Purge UV
                    </span>
                  </div>
                  <Wrench className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Commandes QR Prêtes</span>
                    <div className="text-2xl font-display font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1">
                      {orders.length}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Scan direct vers machine
                    </span>
                  </div>
                  <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              {/* Section 1: Bambu Lab 3D Printers Fleet (X1C, P1S, A1) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                    01. Flotte Impression 3D Bambu Lab (AMS & AMS Lite)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    Synchronisation RFID Bobines
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {machines.slice(0, 3).map(printer => (
                    <div
                      key={printer.id}
                      className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs text-slate-500 dark:text-zinc-400">
                              {printer.category} · {printer.hours} h
                            </div>
                            <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                              {printer.name}
                            </h4>
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              printer.status === 'Impression'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            {printer.status}
                          </span>
                        </div>

                        {/* Unboxed clean metadata line */}
                        <div className="text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Buse : <strong className="text-slate-900 dark:text-zinc-200">{printer.nozzle}</strong></span>
                          <span>·</span>
                          <span>{printer.plate}</span>
                          {printer.amsHumidity !== null && (
                            <>
                              <span>·</span>
                              <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                                AMS {printer.amsHumidity}% RH
                              </span>
                            </>
                          )}
                        </div>

                        {/* Job Progress */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 dark:text-zinc-300 font-medium truncate max-w-[200px]">
                              {printer.currentJob}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {printer.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${printer.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                            <span>Échéance estimée</span>
                            <span>Reste : {printer.eta}</span>
                          </div>
                        </div>

                        {/* AMS 4 Slots Visualizer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                          <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-2">
                            Bobines Chargées ({printer.shortName === 'A1' ? 'AMS Lite' : 'AMS'})
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {printer.amsSlots?.map(slot => (
                              <div
                                key={slot.slot}
                                className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex flex-col items-center text-center"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/15 dark:border-white/20 shrink-0"
                                    style={{ backgroundColor: slot.hex }}
                                  />
                                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">
                                    {slot.slot}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-slate-900 dark:text-white truncate w-full">
                                  {slot.type}
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      slot.remain <= 20 ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${slot.remain}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-zinc-400 mt-0.5">
                                  {slot.remain}%
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

              {/* Section 2: xTool M2 (Laser 20W + Inkjet) & eufyMake E1 UV Printer */}
              <div className="space-y-3">
                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                  02. Pôle Découpe Laser 20W & Impression UV Relief 3D
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* xTool M2 Card */}
                  {machines.slice(3, 4).map(xtool => (
                    <div
                      key={xtool.id}
                      className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              {xtool.category} · {xtool.hours} h
                            </span>
                            <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                              {xtool.name}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {xtool.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                              Module Actif
                            </span>
                            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                              Diode 20W + Inkjet
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                              Encre Jet CMYK
                            </span>
                            <div className="text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {xtool.inkLevel}% restant
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                              Optique 20W
                            </span>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              Propre (6h)
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                          <strong className="text-slate-900 dark:text-zinc-200">Séquence hybride :</strong> Toujours exécuter la passe Inkjet 600dpi avant la découpe Laser 20W (Air Assist 100%).
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* eufyMake E1 UV Printer Card */}
                  {machines.slice(4, 5).map(eufy => (
                    <div
                      key={eufy.id}
                      className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              {eufy.category} · Lampe UV {eufy.uvLampHealth}%
                            </span>
                            <h4 className="text-lg font-display font-bold text-slate-900 dark:text-white mt-0.5">
                              {eufy.name}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            {eufy.status}
                          </span>
                        </div>

                        {/* 6 UV Ink Channels (CMYK + White + Varnish) */}
                        <div className="mt-4">
                          <div className="grid grid-cols-6 gap-2">
                            {eufy.channels?.map(ch => (
                              <div
                                key={ch.code}
                                className={`p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border ${
                                  ch.level <= 25
                                    ? 'border-rose-500/60'
                                    : 'border-slate-200 dark:border-zinc-800'
                                } flex flex-col items-center`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 mb-1"
                                  style={{ backgroundColor: ch.hex }}
                                />
                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                  {ch.code}
                                </span>
                                <div className="w-full h-11 bg-slate-200 dark:bg-zinc-900 rounded-xs my-1.5 p-0.5 flex items-end overflow-hidden">
                                  <div
                                    className={`w-full rounded-xs ${
                                      ch.level <= 25 ? 'bg-rose-500' : 'bg-purple-500'
                                    }`}
                                    style={{ height: `${ch.level}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] font-mono tabular-nums font-bold ${
                                    ch.level <= 25
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-slate-600 dark:text-zinc-300'
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
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: BAMBU LAB OFFICIAL SPOOL INVENTORY, IPHONE SCANNER & DRIVE     */}
          {/* ===================================================================== */}
          {activeTab === 'bambu-spools' && (
            <div className="space-y-6">
              {/* Quick Counters & iPhone Scan Action Cards (+1 / -1) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <button
                  onClick={() => {
                    setSpoolScannerMode('IN');
                    setSpoolScannerModal(true);
                  }}
                  className="md:col-span-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 p-4 text-left text-white transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <Scan className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold">+1 ENTRÉE STOCK</span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base font-display font-bold">Scanner Arrivée (iPhone)</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Boîte neuve reçue · Code 5 chiffres ou EAN
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSpoolScannerMode('OUT');
                    setSpoolScannerModal(true);
                  }}
                  className="md:col-span-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 p-4 text-left transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <MinusCircle className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      -1 SORTIE STOCK
                    </span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                      Déclarer Bobine Finie
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Scanner ou retirer une bobine terminée du stock
                    </p>
                  </div>
                </button>

                <div className="md:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">Total en Stock</span>
                      <div className="text-3xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {totalBambuSpools}{' '}
                        <span className="text-xs font-sans font-normal text-slate-500 dark:text-zinc-400">
                          bobines
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-zinc-400">Références</span>
                      <div className="text-xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                        {uniqueInStockBambuRefs} / {bambuCatalog.length}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 truncate">{lastSyncTime}</span>
                    <button
                      onClick={() => setShowCustomSpoolModal(true)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold shrink-0"
                    >
                      + Référence perso
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  {/* Interactive Segmented Control */}
                  <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                    <button
                      onClick={() => setSpoolViewTab('stock')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                        spoolViewTab === 'stock'
                          ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mon Stock ({totalBambuSpools})</span>
                    </button>

                    <button
                      onClick={() => setSpoolViewTab('catalog')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                        spoolViewTab === 'catalog'
                          ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Library className="w-3.5 h-3.5 text-sky-500" />
                      <span>Catalogue Officiel Bambu ({bambuCatalog.length})</span>
                    </button>
                  </div>

                  {/* Instant Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={spoolSearch}
                      onChange={e => setSpoolSearch(e.target.value)}
                      placeholder="Filtrer par couleur, PLA, Matte, code 5 chiffres (ex: 10100, Noir, Jade)..."
                      className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    {spoolSearch && (
                      <button
                        onClick={() => setSpoolSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Material Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                  {[
                    { id: 'ALL', label: 'Tous les matériaux' },
                    { id: 'PLA Basic', label: 'PLA Basic' },
                    { id: 'PLA Matte', label: 'PLA Matte' },
                    { id: 'PETG HF', label: 'PETG HF' },
                    { id: 'ABS / ASA', label: 'ABS / ASA' },
                    { id: 'TPU / Technique', label: 'TPU / CF / Nylon' }
                  ].map(mat => (
                    <button
                      key={mat.id}
                      onClick={() => setSpoolMaterialFilter(mat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        spoolMaterialFilter === mat.id
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spools Grid */}
              {filteredBambuSpools.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                      Aucune bobine trouvée dans cette sélection
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                      Basculez sur le Catalogue Officiel Bambu Lab pour afficher les 35+ références et les ajouter en 1 clic.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSpoolViewTab('catalog');
                        setSpoolMaterialFilter('ALL');
                        setSpoolSearch('');
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                    >
                      Voir tout le catalogue Bambu Lab
                    </button>
                    <button
                      onClick={() => setShowCustomSpoolModal(true)}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors"
                    >
                      + Créer une bobine perso
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBambuSpools.map(item => {
                    const isOut = item.qty === 0;
                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-zinc-900 border ${
                          item.qty > 0
                            ? 'border-slate-200 dark:border-zinc-800'
                            : 'border-slate-200/60 dark:border-zinc-800/50 opacity-75'
                        } rounded-xl p-4 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors`}
                      >
                        <div className="flex items-start gap-3.5">
                          <SpoolVisualizerSVG hex={item.hex} isOut={isOut} size={50} />

                          <div className="flex-1 min-w-0">
                            {/* Clean unboxed metadata with middle dots */}
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                              <span className="font-medium text-slate-700 dark:text-zinc-300">
                                {item.category}
                              </span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">#{item.code}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{item.temp}</span>
                            </div>
                            <h3
                              className="text-sm font-display font-bold text-slate-900 dark:text-white truncate mt-1"
                              title={item.name}
                            >
                              {item.name}
                            </h3>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xl font-display font-bold font-mono tabular-nums ${
                                item.qty > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-400 dark:text-zinc-600'
                              }`}
                            >
                              {item.qty}
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-zinc-500">
                              bobines
                            </span>
                          </div>
                        </div>

                        {/* +1 / -1 Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => adjustBambuSpoolQty(item.id, -1)}
                            disabled={isOut}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                              isOut
                                ? 'bg-slate-100 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>Retirer (-1)</span>
                          </button>

                          <button
                            onClick={() => adjustBambuSpoolQty(item.id, 1)}
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Ajouter (+1)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: FORGECALC COST & PRICING CALCULATOR                            */}
          {/* ===================================================================== */}
          {activeTab === 'forgecalc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Inputs Form */}
              <div className="lg:col-span-7 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                      Paramètres Analytiques du Projet
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      Sélectionnez le procédé et renseignez les métriques du slicer
                    </span>
                  </div>
                  <div className="flex gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs">
                    {[
                      { id: '3d', label: '3D Bambu' },
                      { id: 'laser', label: 'Laser xTool' },
                      { id: 'uv', label: 'UV eufyMake' },
                      { id: 'hybrid', label: 'Hybride' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setCalcForm({ ...calcForm, processType: mode.id })}
                        className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                          calcForm.processType === mode.id
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Désignation de la pièce ou série
                    </label>
                    <input
                      type="text"
                      value={calcForm.projectName}
                      onChange={e => setCalcForm({ ...calcForm, projectName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Bobine Bambu Lab associée
                    </label>
                    <select
                      value={calcForm.selectedSpoolId}
                      onChange={e => setCalcForm({ ...calcForm, selectedSpoolId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                    >
                      {bambuCatalog.map(s => (
                        <option key={s.id} value={s.id}>
                          #{s.code} · {s.category} {s.name} ({s.qty} en stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Prix Bobine 1 kg (€ TTC)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcForm.filamentPricePerKg}
                      onChange={e =>
                        setCalcForm({ ...calcForm, filamentPricePerKg: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Poids Slicer (grammes)
                    </label>
                    <input
                      type="number"
                      value={calcForm.weightGrams}
                      onChange={e => setCalcForm({ ...calcForm, weightGrams: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Purge AMS / Supports (%)
                    </label>
                    <input
                      type="number"
                      value={calcForm.wasteFactorPct}
                      onChange={e =>
                        setCalcForm({ ...calcForm, wasteFactorPct: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  {(calcForm.processType === 'uv' || calcForm.processType === 'hybrid') && (
                    <>
                      <div>
                        <label className="text-purple-600 dark:text-purple-400 block mb-1 font-medium">
                          Volume Encre UV CMYK+W+V (ml)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={calcForm.uvInkMl}
                          onChange={e => setCalcForm({ ...calcForm, uvInkMl: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-purple-500/40 font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-purple-600 dark:text-purple-400 block mb-1 font-medium">
                          Coût Encre UV (€ / ml)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={calcForm.uvInkCostPerMl}
                          onChange={e =>
                            setCalcForm({ ...calcForm, uvInkCostPerMl: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-purple-500/40 font-mono tabular-nums text-slate-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {(calcForm.processType === 'laser' ||
                    calcForm.processType === 'uv' ||
                    calcForm.processType === 'hybrid') && (
                    <div className="sm:col-span-2">
                      <label className="text-amber-600 dark:text-amber-400 block mb-1 font-medium">
                        Coût Plaque Support (Bois, Acrylique, Ardoise) par pièce (€)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={calcForm.sheetMaterialCost}
                        onChange={e =>
                          setCalcForm({ ...calcForm, sheetMaterialCost: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-amber-500/40 font-mono tabular-nums text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Temps Machine Total (Heures)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      value={calcForm.printHours}
                      onChange={e => setCalcForm({ ...calcForm, printHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Puissance Moyenne (Watts)
                    </label>
                    <input
                      type="number"
                      value={calcForm.powerWatts}
                      onChange={e => setCalcForm({ ...calcForm, powerWatts: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Main d’œuvre Prépa + Finition (min)
                    </label>
                    <input
                      type="number"
                      value={calcForm.prepMinutes}
                      onChange={e => setCalcForm({ ...calcForm, prepMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Taux Horaire Opérateur (€ / h)
                    </label>
                    <input
                      type="number"
                      value={calcForm.hourlyLaborRate}
                      onChange={e =>
                        setCalcForm({ ...calcForm, hourlyLaborRate: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Coefficient de Marge (x)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcForm.marginMultiplier}
                      onChange={e =>
                        setCalcForm({ ...calcForm, marginMultiplier: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-emerald-500/50 font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Quantité de la série
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={calcForm.quantity}
                      onChange={e =>
                        setCalcForm({ ...calcForm, quantity: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono tabular-nums font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live ForgeCalc Financial Breakdown */}
              <div className="lg:col-span-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Synthèse Financière Unitaire & Série
                    </span>
                    <span className="font-mono tabular-nums">
                      Marge x{calcForm.marginMultiplier} · Risque {calcForm.failureRatePct}%
                    </span>
                  </div>

                  {/* Key Unit Figures */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                        Coût de Revient Unitaire
                      </span>
                      <div className="text-2xl font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                        {forgeCalcBreakdown.unitCostRevient} €{' '}
                        <span className="text-xs font-sans font-normal text-slate-500">HT</span>
                      </div>
                    </div>
                    <div className="border-l border-slate-200 dark:border-zinc-800 pl-4">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                        Prix de Vente Conseillé
                      </span>
                      <div className="text-2xl font-display font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        {forgeCalcBreakdown.unitPriceTTC} €{' '}
                        <span className="text-xs font-sans font-normal text-slate-500">TTC</span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-zinc-400">
                        {forgeCalcBreakdown.unitPriceHT} € HT / unité
                      </span>
                    </div>
                  </div>

                  {/* Visual Stacked Cost Bar */}
                  <CostDistributionBar
                    material={forgeCalcBreakdown.rawMaterialNum}
                    machine={forgeCalcBreakdown.machineNum}
                    labor={forgeCalcBreakdown.laborNum}
                    buffer={forgeCalcBreakdown.bufferNum}
                    profit={forgeCalcBreakdown.profitNum}
                  />

                  {/* Cost Ledger Rows */}
                  <div className="divide-y divide-slate-200 dark:divide-zinc-800/80 text-xs">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600 dark:text-zinc-400">
                        Matière 1ère ({forgeCalcBreakdown.effectiveWeight}g purge incluse + UV/Support)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {forgeCalcBreakdown.rawMaterialTotal} €
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600 dark:text-zinc-400">
                        Électricité ({calcForm.printHours}h @ {calcForm.powerWatts}W)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {forgeCalcBreakdown.electricityCost} €
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600 dark:text-zinc-400">
                        Amortissement Machine & Usure Buse/Optique
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {forgeCalcBreakdown.depreciationCost} €
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600 dark:text-zinc-400">
                        Main d’œuvre Opérateur ({calcForm.prepMinutes + calcForm.postProcMinutes} min)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-purple-600 dark:text-purple-400">
                        {forgeCalcBreakdown.laborCost} €
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600 dark:text-zinc-400">
                        Provision Taux d’Échec ({calcForm.failureRatePct}%) & Emballage
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                        {(Number(forgeCalcBreakdown.failureBuffer) + Number(calcForm.packagingCost)).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Total Batch Summary */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-700 dark:text-emerald-200 font-medium">
                        Total Devis Série ({calcForm.quantity} pièces TTC) :
                      </span>
                      <span className="text-lg font-display font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {forgeCalcBreakdown.batchTotalTTC} € TTC
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-300">
                      <span>Bénéfice Net Atelier sur la série :</span>
                      <span className="font-mono tabular-nums font-bold">
                        +{forgeCalcBreakdown.batchProfit} € net
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const newOrder: WorkshopOrder = {
                      id: `CMD-2026-${Math.floor(110 + Math.random() * 890)}`,
                      client: 'Devis ForgeCalc',
                      productName: `${calcForm.quantity}x ${calcForm.projectName} (${forgeCalcBreakdown.batchTotalTTC}€ TTC)`,
                      targetMachine: 'Bambu Lab X1C',
                      secondaryMachines: [],
                      materialSpec: `${calcForm.weightGrams}g · Coût revient ${forgeCalcBreakdown.unitCostRevient}€`,
                      fileName: 'Projet_Devis_ForgeCalc.3mf',
                      presetParams: `Devis validé : ${forgeCalcBreakdown.unitPriceTTC}€ TTC/u`,
                      dueDate: 'Cette semaine',
                      priority: 'Haute',
                      status: 'Prêt à flasher'
                    };
                    setOrders([newOrder, ...orders]);
                    setSelectedOrder(newOrder);
                    setActiveTab('orders');
                    triggerToast('Devis converti en Commande avec Étiquette QR !');
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <QrCode className="w-4 h-4" /> Convertir ce Devis en Commande + Étiquette QR
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 6: KANBAN PRINT & CUT QUEUE                                       */}
          {/* ===================================================================== */}
          {activeTab === 'kanban' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                    Ordonnancement Visuel Multi-Machines (Glisser-Déposer ou Progression Rapide)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Affectation intelligente : PAHT-CF → X1C · Découpe + Encre → xTool M2 · Relief UV → eufyMake E1
                  </p>
                </div>
                <button
                  onClick={() => setShowNewKanbanModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Nouveau Job Kanban
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {[
                  { id: 'backlog' as const, title: '01. À Préparer' },
                  { id: 'ready' as const, title: '02. Prêt à Lancer' },
                  { id: 'printing' as const, title: '03. En Production' },
                  { id: 'postproc' as const, title: '04. Finition & UV' },
                  { id: 'done' as const, title: '05. Terminé' }
                ].map((col, colIdx, allCols) => {
                  const colTasks = kanbanTasks.filter(t => t.stage === col.id);
                  return (
                    <div
                      key={col.id}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (draggedTaskId) {
                          moveKanbanTask(draggedTaskId, col.id);
                          setDraggedTaskId(null);
                        }
                      }}
                      className="rounded-xl bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 p-3 flex flex-col gap-3 min-h-[420px]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                        <span className="text-xs font-display font-bold text-slate-900 dark:text-white">
                          {col.title}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-zinc-400">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colTasks.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 cursor-grab active:cursor-grabbing space-y-2"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                              <span className="font-mono">{task.id}</span>
                              <span
                                className={`font-semibold ${
                                  task.priority === 'Haute'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-500 dark:text-zinc-400'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            <h4 className="text-xs font-display font-bold text-slate-900 dark:text-white leading-snug">
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400">{task.client}</p>

                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 space-y-1 text-[11px]">
                              <div className="flex items-center justify-between font-medium text-emerald-600 dark:text-emerald-400">
                                <span>{task.assignedMachine}</span>
                                <span className="font-mono tabular-nums">{task.estTime}</span>
                              </div>
                              <div className="text-slate-600 dark:text-zinc-300 truncate">
                                {task.material}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                                {task.recommendedReason}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              {colIdx > 0 ? (
                                <button
                                  onClick={() => moveKanbanTask(task.id, allCols[colIdx - 1].id)}
                                  className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                                >
                                  ← Reculer
                                </button>
                              ) : (
                                <span />
                              )}
                              {colIdx < allCols.length - 1 && (
                                <button
                                  onClick={() => moveKanbanTask(task.id, allCols[colIdx + 1].id)}
                                  className="text-[11px] px-2.5 py-1 rounded bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1"
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
          {/* TAB 7: INVENTORY (UV INKS, LASER MATERIALS, SPARE PARTS)              */}
          {/* ===================================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-1.5">
                  {['Tous', 'Encre UV & Jet', 'Supports Laser & UV', 'Pièces & Entretien'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setInvCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        invCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invSearch}
                      onChange={e => setInvSearch(e.target.value)}
                      placeholder="Rechercher buse, encre UV, bois..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewItemModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
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
                      className={`rounded-xl bg-white dark:bg-zinc-900 border p-4 flex flex-col justify-between transition-colors ${
                        isLow
                          ? 'border-amber-500/60'
                          : 'border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span
                              className="w-4 h-4 rounded-sm border border-black/15 dark:border-white/20 shrink-0 mt-0.5"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <div>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                {item.category} · {item.subType}
                              </span>
                              <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                                {item.name}
                              </h4>
                            </div>
                          </div>
                          {isLow && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                              Stock Bas
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2.5">
                          <span>Machines : {item.machineCompat.join(', ')}</span>
                          <span> · </span>
                          <span className="text-emerald-600 dark:text-emerald-400">{item.location}</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 dark:text-zinc-400">Disponibilité</span>
                            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {item.stock} {item.unit}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLow ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => adjustStock(item.id, -1)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-mono font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
                        >
                          -1 {item.unit}
                        </button>
                        <button
                          onClick={() => adjustStock(item.id, 1)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
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

          {/* ===================================================================== */}
          {/* TAB 8: PREVENTIVE MAINTENANCE & SPARE PARTS                           */}
          {/* ===================================================================== */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              {/* Predictive Spare Parts Strip */}
              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-display font-bold text-slate-900 dark:text-white">
                    Pièces Critiques en Réserve (Buses Acier Trempé, Plateaux PEI & Optiques Laser)
                  </h3>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Voir tout l’inventaire →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {inventory
                    .filter(i => i.category === 'Pièces & Entretien')
                    .slice(0, 4)
                    .map(part => (
                      <div
                        key={part.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                            {part.subType} · {part.machineCompat.join('/')}
                          </span>
                          <div
                            className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5"
                            title={part.name}
                          >
                            {part.name}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-mono tabular-nums font-bold shrink-0 ${
                            part.stock <= part.alertAt
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {part.stock} {part.unit}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {maintenance.map(task => {
                  const ratio = Math.min(
                    100,
                    Math.round((task.hoursSinceLast / task.intervalHours) * 100)
                  );
                  const isUrgent = ratio >= 85;
                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-xl bg-white dark:bg-zinc-900 border flex flex-col justify-between gap-4 ${
                        isUrgent
                          ? 'border-rose-500/60'
                          : 'border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {task.machine} · Dernier : {task.lastDone}
                            </span>
                            <h4 className="text-base font-display font-bold text-slate-900 dark:text-white mt-0.5">
                              {task.title}
                            </h4>
                          </div>
                          <span
                            className={`text-xs font-mono tabular-nums font-bold shrink-0 ${
                              isUrgent
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {task.hoursSinceLast}h / {task.intervalHours}h
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{task.warning}</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                            <span>Progression du cycle d’usure</span>
                            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                              {ratio}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isUrgent ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                          Requis : <strong className="text-slate-900 dark:text-zinc-200">{task.requiredPart}</strong>
                        </span>
                        <button
                          onClick={() => completeMaintenance(task.id)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" /> Valider l’entretien
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 9: PRINT LOG, QUALITY JOURNAL & FAILURE ANALYSIS                  */}
          {/* ===================================================================== */}
          {activeTab === 'print-log' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                    Carnet de Bord Qualité, Recettes Certifiées & Diagnostics d’Échecs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Historique traçable des paramètres validés en production sur vos 5 machines.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewLogModal(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" /> Consigner un Tirage
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {printLogs.map(log => {
                  const isSuccess = log.outcome === 'Succès';
                  return (
                    <div
                      key={log.id}
                      className={`rounded-xl bg-white dark:bg-zinc-900 border p-5 flex flex-col justify-between space-y-4 ${
                        isSuccess
                          ? 'border-slate-200 dark:border-zinc-800'
                          : 'border-rose-500/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                              {log.id} · {log.date}
                            </span>
                            <h4 className="text-base font-display font-bold text-slate-900 dark:text-white mt-0.5">
                              {log.projectName}
                            </h4>
                          </div>
                          <span
                            className={`text-xs font-mono tabular-nums font-bold shrink-0 ${
                              isSuccess
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {log.outcome} · {log.score}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-zinc-400">
                          <strong className="text-slate-800 dark:text-zinc-200">{log.machine}</strong>
                          <span> · </span>
                          <span>{log.material}</span>
                        </div>

                        {log.failureCause && (
                          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-200">
                            <strong>Cause identifiée :</strong> {log.failureCause}
                          </div>
                        )}

                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                            Recette Validée :
                          </span>
                          <p className="text-slate-700 dark:text-zinc-200 leading-relaxed">
                            {log.validatedRecipe}
                          </p>
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                            « {log.notes} »
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 10: ORDERS, QR CODE LABEL PRINTER & DIRECT SCAN-TO-MACHINE        */}
          {/* ===================================================================== */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left column: Orders Queue */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                    File des Commandes & Fiches Suiveuses QR
                  </h3>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
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
                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-white/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {order.id}
                            </span>
                            <span>·</span>
                            <span>{order.client}</span>
                            <span>·</span>
                            <span>Échéance : {order.dueDate}</span>
                          </div>
                          <h4 className="text-base font-display font-bold text-slate-900 dark:text-white mt-1">
                            {order.productName}
                          </h4>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 shrink-0">
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>
                          Machine : <strong className="text-slate-900 dark:text-white">{order.targetMachine}</strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono">{order.fileName}</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                          {order.materialSpec}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSimulateQrDispatch(order);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                        >
                          <Scan className="w-3.5 h-3.5" /> Flasher vers Machine
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right column: Live Thermal Label Preview & Print */}
              <div className="lg:col-span-5">
                {selectedOrder && (
                  <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                          Format Thermique Standard 100×60mm
                        </span>
                        <h4 className="text-base font-display font-bold text-slate-900 dark:text-white">
                          Aperçu Étiquette Suiveuse
                        </h4>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimer
                      </button>
                    </div>

                    {/* THERMAL LABEL VISUAL CARD */}
                    <div
                      id="thermal-label-print-zone"
                      className="bg-white text-zinc-950 rounded-xl p-4 border-2 border-dashed border-zinc-300"
                    >
                      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-2 mb-3">
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                            FABSTUDIO OS · DISPATCH
                          </div>
                          <div className="text-lg font-mono font-bold tracking-tight">
                            {selectedOrder.id}
                          </div>
                          <div className="text-xs font-semibold text-zinc-700">
                            {selectedOrder.client}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono font-bold uppercase">
                            {selectedOrder.targetMachine}
                          </span>
                          <div className="text-[10px] font-mono text-zinc-600 mt-1">
                            Échéance : {selectedOrder.dueDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <QRCodePattern
                          value={`FABSTUDIO|${selectedOrder.id}|${selectedOrder.targetMachine}|${selectedOrder.fileName}`}
                          size={108}
                        />
                        <div className="flex-1 space-y-1.5 text-xs min-w-0">
                          <div className="font-bold text-sm leading-snug">
                            {selectedOrder.productName}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-zinc-600">Fichier : </span>
                            <code className="font-mono bg-zinc-100 px-1 rounded text-[11px]">
                              {selectedOrder.fileName}
                            </code>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-600">Matériau : </span>
                            <span>{selectedOrder.materialSpec}</span>
                          </div>
                          <div className="text-[11px] bg-zinc-100 p-1.5 rounded border border-zinc-300 font-medium">
                            {selectedOrder.presetParams}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-300 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>SCANNER POUR CHARGER LA MACHINE</span>
                        <span>fabstudio://run/{selectedOrder.id}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulateQrDispatch(selectedOrder)}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Scan className="w-4 h-4" /> Simuler le Scan du QR Code vers{' '}
                      {selectedOrder.targetMachine}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 11: SMART MATERIAL & MACHINE PARAMETER ADVISOR                    */}
          {/* ===================================================================== */}
          {activeTab === 'copilot' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 space-y-4">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                  Sélecteur Couple Machine × Matériau
                </span>
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                  Configurez votre Tirage
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Machine de l’atelier
                    </label>
                    <select
                      value={advisorMachine}
                      onChange={e => setAdvisorMachine(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Bambu Lab X1C">Bambu Lab X1C (CoreXY + Lidar)</option>
                      <option value="Bambu Lab P1S">Bambu Lab P1S (CoreXY Fermée)</option>
                      <option value="Bambu Lab A1">Bambu Lab A1 (Bedslinger)</option>
                      <option value="xTool M2">xTool M2 (Laser 20W + Inkjet)</option>
                      <option value="eufyMake E1">eufyMake E1 (Imprimante UV Relief)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-zinc-400 block mb-1 font-medium">
                      Opération / Support
                    </label>
                    <select
                      value={advisorMaterial}
                      onChange={e => setAdvisorMaterial(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Contreplaqué Bouleau 3mm">
                        Contreplaqué Bouleau 3mm (Découpe + Encre)
                      </option>
                      <option value="Acrylique Noir 3mm">Acrylique Noir Opaque 3mm</option>
                      <option value="PAHT-CF (Nylon Carbone)">
                        Bambu PAHT-CF (Nylon Fibre Carbone)
                      </option>
                      <option value="PLA Matte / Basic">
                        Bambu PLA Matte / Basic Haute Vitesse
                      </option>
                      <option value="Texture UV Relief 3D">
                        Impression UV Relief 3D (CMYK + Blanc + Vernis)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                      Profil Technique Validé Atelier
                    </span>
                    <h4 className="text-xl font-display font-bold text-slate-900 dark:text-white mt-0.5">
                      {advisorMachine} × {advisorMaterial}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Certifié Production
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                      Paramètre Principal
                    </span>
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1.5">
                      {advisorMachine === 'xTool M2'
                        ? 'Laser 20W : 100% Pwr · 10 mm/s'
                        : advisorMachine === 'eufyMake E1'
                        ? '2 passes Blanc W + CMYK + Vernis'
                        : advisorMaterial.includes('PAHT')
                        ? 'Buse 290°C · Bed 100°C · 100 mm/s'
                        : 'Buse 220°C · Bed 60°C · 250 mm/s'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                      Préparation Support
                    </span>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                      {advisorMachine === 'eufyMake E1'
                        ? 'Dégraissage IPA + Primer UV'
                        : advisorMachine === 'xTool M2'
                        ? 'Focus Auto + Air Assist 100%'
                        : 'Plateau PEI Texturé lavé IPA'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">
                      Point de Vigilance
                    </span>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1.5">
                      {advisorMachine === 'Bambu Lab A1' && advisorMaterial.includes('PAHT')
                        ? 'Incompatible A1 ouverte → Basculer sur X1C'
                        : 'Contrôler buse / lentille avant lancement'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* COMMAND PALETTE MODAL (Cmd+K / Ctrl+K)                                */}
      {/* ===================================================================== */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                placeholder="Tapez un code Bambu (10100), une couleur, une machine ou une vue..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
              {/* Quick Spool Actions */}
              <div>
                <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                  Bobines Bambu Lab (Ajustement direct +1 / -1)
                </div>
                <div className="space-y-1">
                  {commandSpoolMatches.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/70"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shrink-0"
                          style={{ backgroundColor: s.hex }}
                        />
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {s.category} · {s.name}
                        </span>
                        <span className="font-mono text-slate-400">#{s.code}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mr-2">
                          {s.qty} en stock
                        </span>
                        <button
                          onClick={() => adjustBambuSpoolQty(s.id, -1)}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-zinc-800 hover:bg-rose-500/20 text-slate-700 dark:text-zinc-300 font-mono font-bold"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustBambuSpoolQty(s.id, 1)}
                          className="px-2 py-1 rounded bg-emerald-600 text-white font-mono font-bold"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation */}
              <div>
                <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                  Aller au Module
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {NAV_GROUPS.flatMap(g => g.items).map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setCommandPaletteOpen(false);
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-left text-slate-700 dark:text-zinc-200 font-medium"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: QR SCANNER -> DIRECT MACHINE DISPATCH */}
      {scannerModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-display font-bold text-sm">
                <Scan className="w-5 h-5" /> Lecture QR Code Détectée
              </div>
              <button
                onClick={() => setScannerModalOrder(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Commande :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {scannerModalOrder.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Machine cible :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {scannerModalOrder.targetMachine}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Fichier de fabrication :</span>
                <span className="font-mono text-slate-800 dark:text-zinc-200">
                  {scannerModalOrder.fileName}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300">
                <strong>Préréglages transmis :</strong> {scannerModalOrder.presetParams}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-zinc-400">
                  Préparation du transfert réseau local...
                </span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                  {dispatchProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${dispatchProgress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setScannerModalOrder(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmSendToMachine}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4" /> Lancer sur {scannerModalOrder.targetMachine}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW INVENTORY ITEM */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddInventoryItem}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Ajouter un Consommable ou une Pièce
              </h3>
              <button type="button" onClick={() => setShowNewItemModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Nom de la référence
                </label>
                <input
                  required
                  type="text"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="Ex: Cartouche UV Cyan eufyMake E1"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Catégorie</label>
                <select
                  value={newItemForm.category}
                  onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="Encre UV & Jet">Encre UV & Jet</option>
                  <option value="Supports Laser & UV">Supports Laser & UV</option>
                  <option value="Pièces & Entretien">Pièces & Entretien</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Sous-type</label>
                <input
                  type="text"
                  value={newItemForm.subType}
                  onChange={e => setNewItemForm({ ...newItemForm, subType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Quantité actuelle
                </label>
                <input
                  type="number"
                  value={newItemForm.stock}
                  onChange={e => setNewItemForm({ ...newItemForm, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Unité (%, pièces, plaques)
                </label>
                <input
                  type="text"
                  value={newItemForm.unit}
                  onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Machines compatibles (séparées par virgule)
                </label>
                <input
                  type="text"
                  value={newItemForm.machineCompat}
                  onChange={e => setNewItemForm({ ...newItemForm, machineCompat: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Enregistrer au Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CREATE NEW ORDER & QR LABEL */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOrder}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Nouvelle Commande & Étiquette QR
              </h3>
              <button type="button" onClick={() => setShowNewOrderModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Client</label>
                <input
                  required
                  type="text"
                  value={newOrderForm.client}
                  onChange={e => setNewOrderForm({ ...newOrderForm, client: e.target.value })}
                  placeholder="Ex: Atelier Design"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Machine Cible</label>
                <select
                  value={newOrderForm.targetMachine}
                  onChange={e => setNewOrderForm({ ...newOrderForm, targetMachine: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                  <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                  <option value="Bambu Lab A1">Bambu Lab A1</option>
                  <option value="xTool M2">xTool M2 (20W + Inkjet)</option>
                  <option value="eufyMake E1">eufyMake E1 UV</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Description Produit / Série
                </label>
                <input
                  required
                  type="text"
                  value={newOrderForm.productName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, productName: e.target.value })}
                  placeholder="Ex: 30x Plaques Signalétiques UV + Découpe Laser"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Fichier (.3mf, .xcs, .eufy)
                </label>
                <input
                  type="text"
                  value={newOrderForm.fileName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, fileName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Échéance</label>
                <input
                  type="text"
                  value={newOrderForm.dueDate}
                  onChange={e => setNewOrderForm({ ...newOrderForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Matériau & Bobine
                </label>
                <input
                  type="text"
                  value={newOrderForm.materialSpec}
                  onChange={e => setNewOrderForm({ ...newOrderForm, materialSpec: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" /> Générer l’Étiquette QR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: IPHONE CAMERA BARCODE / QR SCANNER FOR BAMBU SPOOLS */}
      {spoolScannerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`text-xs font-mono font-bold ${
                    spoolScannerMode === 'IN'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {spoolScannerMode === 'IN' ? 'ENTRÉE STOCK (+1)' : 'SORTIE STOCK (-1)'}
                </span>
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                  {spoolScannerMode === 'IN'
                    ? 'Scanner une boîte Bambu reçue'
                    : 'Scanner une bobine terminée'}
                </h3>
              </div>
              <button
                onClick={() => setSpoolScannerModal(false)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setSpoolScannerMode('IN')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  spoolScannerMode === 'IN'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                +1 Arrivée Boîte
              </button>
              <button
                onClick={() => setSpoolScannerMode('OUT')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  spoolScannerMode === 'OUT'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                -1 Bobine Finie
              </button>
            </div>

            {/* iPhone Camera Viewport */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-h-56 mx-auto border border-zinc-800 flex items-center justify-center">
              <div id="bambu-iphone-reader" className="w-full h-full" />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-3">
                <span className="text-[11px] bg-black/65 px-2.5 py-1 rounded text-zinc-200">
                  Visez le code-barres de la boîte Bambu Lab
                </span>
                <div className="w-44 h-20 border-2 border-emerald-400/80 rounded-lg" />
                <span className="text-[10px] font-mono text-zinc-400 bg-black/65 px-2 py-0.5 rounded">
                  EAN-13 · Code 5 chiffres · QR
                </span>
              </div>
            </div>

            {/* Manual Code or Barcode Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Ou saisissez le code Bambu Lab (ex: <span className="font-mono">10100</span> Blanc,{' '}
                <span className="font-mono">10101</span> Noir) :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcodeInput}
                  onChange={e => setManualBarcodeInput(e.target.value)}
                  onKeyDown={e =>
                    e.key === 'Enter' && handleProcessScannedSpoolCode(manualBarcodeInput)
                  }
                  placeholder="Code 5 chiffres (ex: 10100) ou EAN..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleProcessScannedSpoolCode(manualBarcodeInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>

            {/* Quick Simulation Buttons */}
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
              <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
                Simuler un scan d’étiquette Bambu Lab :
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleProcessScannedSpoolCode('10100')}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                >
                  Jade White (10100)
                </button>
                <button
                  onClick={() => handleProcessScannedSpoolCode('10101')}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
                >
                  Black (10101)
                </button>
                <button
                  onClick={() => handleProcessScannedSpoolCode('11101')}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-amber-500" />
                Nouveau code-barres détecté
              </h3>
              <button
                onClick={() => setPendingBarcode(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              Le code{' '}
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {pendingBarcode}
              </span>{' '}
              n’est pas encore associé. Sélectionnez la bobine correspondante : elle sera reconnue automatiquement aux prochains scans.
            </p>
            <div>
              <select
                value={selectedAssignFilamentId}
                onChange={e => setSelectedAssignFilamentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white"
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
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmBarcodeAssignment}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Associer et Appliquer ({spoolScannerMode === 'IN' ? '+1' : '-1'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: GOOGLE DRIVE & CLOUD SYNC CONFIGURATION */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                    Synchronisation Google Drive & Sauvegarde
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    Dossier ID : {GOOGLE_DRIVE_FOLDER_ID}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Persistance Locale + Cloud Active
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-300">
                  Chaque scan (+1 / -1) est sauvegardé instantanément et prêt pour Google Drive.
                </p>
              </div>
              <a
                href={`https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                Ouvrir Drive
              </a>
            </div>

            {/* Apps Script Webhook Bridge */}
            <div className="space-y-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                01. Écriture automatique dans Google Drive (Passerelle Apps Script)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Collez l’URL Web App de votre script Google pour mettre à jour automatiquement{' '}
                <code className="font-mono text-emerald-600 dark:text-emerald-400">
                  stock_filaments_bambu.json
                </code>{' '}
                à chaque scan :
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={gasWebhookUrl}
                  onChange={e => setGasWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => pushSpoolCatalogToCloudAndDrive(bambuCatalog, gasWebhookUrl, true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>

              <details className="pt-1">
                <summary className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                  Afficher et copier le code Google Apps Script
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-[10px] font-mono bg-slate-900 text-emerald-300 p-2.5 rounded-lg overflow-x-auto">
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
                    className="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200"
                  >
                    Copier le script Google Drive
                  </button>
                </div>
              </details>
            </div>

            {/* Direct JSON Export / Import */}
            <div className="space-y-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                02. Export / Import JSON Direct
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadDriveJson}
                  className="py-2 px-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 border border-slate-200 dark:border-zinc-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  Télécharger JSON
                </button>
                <label className="py-2 px-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 border border-slate-200 dark:border-zinc-700 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-sky-500" />
                  Importer JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDriveJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD CUSTOM SPOOL REFERENCE */}
      {showCustomSpoolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomSpool}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Ajouter une bobine personnalisée
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomSpoolModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1">
                  Famille de matériau (ex: PLA Basic, PETG HF...)
                </label>
                <input
                  type="text"
                  value={customSpoolForm.category}
                  onChange={e =>
                    setCustomSpoolForm({ ...customSpoolForm, category: e.target.value })
                  }
                  placeholder="PLA Basic"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1">
                  Nom de la couleur
                </label>
                <input
                  type="text"
                  required
                  value={customSpoolForm.name}
                  onChange={e => setCustomSpoolForm({ ...customSpoolForm, name: e.target.value })}
                  placeholder="Ex: Bleu Galaxie"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1">
                    Teinte visuelle
                  </label>
                  <input
                    type="color"
                    value={customSpoolForm.hex}
                    onChange={e => setCustomSpoolForm({ ...customSpoolForm, hex: e.target.value })}
                    className="w-full h-10 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1">
                    Code / Code-barres
                  </label>
                  <input
                    type="text"
                    value={customSpoolForm.code}
                    onChange={e => setCustomSpoolForm({ ...customSpoolForm, code: e.target.value })}
                    placeholder="Ex: 99101"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomSpoolModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Créer et Ajouter +1
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 8: ADD KANBAN TASK */}
      {showNewKanbanModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateKanbanTask}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Ajouter un Projet au Kanban
              </h3>
              <button type="button" onClick={() => setShowNewKanbanModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Titre du job</label>
                <input
                  required
                  type="text"
                  value={newKanbanForm.title}
                  onChange={e => setNewKanbanForm({ ...newKanbanForm, title: e.target.value })}
                  placeholder="Ex: 25x Faces Avant Gravées Laser"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Client</label>
                <input
                  required
                  type="text"
                  value={newKanbanForm.client}
                  onChange={e => setNewKanbanForm({ ...newKanbanForm, client: e.target.value })}
                  placeholder="Ex: Studio Design"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                    Machine assignée
                  </label>
                  <select
                    value={newKanbanForm.assignedMachine}
                    onChange={e =>
                      setNewKanbanForm({ ...newKanbanForm, assignedMachine: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                  >
                    <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                    <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                    <option value="Bambu Lab A1">Bambu Lab A1</option>
                    <option value="xTool M2">xTool M2</option>
                    <option value="eufyMake E1/E2">eufyMake E1/E2</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                    Temps estimé
                  </label>
                  <input
                    type="text"
                    value={newKanbanForm.estTime}
                    onChange={e => setNewKanbanForm({ ...newKanbanForm, estTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewKanbanModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Ajouter à la File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 9: ADD PRINT QUALITY LOG */}
      {showNewLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePrintLog}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Consigner un Tirage (Journal Qualité)
              </h3>
              <button type="button" onClick={() => setShowNewLogModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Nom de la pièce / projet
                </label>
                <input
                  required
                  type="text"
                  value={newLogForm.projectName}
                  onChange={e => setNewLogForm({ ...newLogForm, projectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Machine</label>
                <select
                  value={newLogForm.machine}
                  onChange={e => setNewLogForm({ ...newLogForm, machine: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                  <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                  <option value="Bambu Lab A1">Bambu Lab A1</option>
                  <option value="xTool M2 (20W + Inkjet)">xTool M2 (20W + Inkjet)</option>
                  <option value="eufyMake E1/E2 UV">eufyMake E1/E2 UV</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">Résultat</label>
                <select
                  value={newLogForm.outcome}
                  onChange={e =>
                    setNewLogForm({
                      ...newLogForm,
                      outcome: e.target.value as 'Succès' | 'Échec Partiel' | 'Échec'
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="Succès">Succès</option>
                  <option value="Échec Partiel">Échec Partiel</option>
                  <option value="Échec">Échec</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-600 dark:text-zinc-400 block mb-1">
                  Recette & Réglages validés (Températures, vitesses, passes UV/Laser)
                </label>
                <input
                  required
                  type="text"
                  value={newLogForm.validatedRecipe}
                  onChange={e => setNewLogForm({ ...newLogForm, validatedRecipe: e.target.value })}
                  placeholder="Ex: Buse 220°C · Bed 60°C PEI · Gyroid 15%"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              {newLogForm.outcome !== 'Succès' && (
                <div className="sm:col-span-2">
                  <label className="text-rose-600 dark:text-rose-400 block mb-1">
                    Cause de l’échec identifiée
                  </label>
                  <input
                    type="text"
                    value={newLogForm.failureCause}
                    onChange={e => setNewLogForm({ ...newLogForm, failureCause: e.target.value })}
                    placeholder="Ex: Détachement premier layer / buse encrassée"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-rose-500/40 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewLogModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
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
