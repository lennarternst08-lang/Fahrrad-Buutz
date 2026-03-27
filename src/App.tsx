import React, { useState, useEffect, useCallback } from 'react';
import { TrackingModule } from './components/TrackingModule';
import { WorkshopModule } from './components/WorkshopModule';
import { DailyTodoModule } from './components/DailyTodoModule';
import { Bike, DailyTodo, Log } from './types';
import { BarChart3, Wrench, CheckSquare, Download, FileText, Image, User, X } from 'lucide-react';

// Mock Data
const initialBikes: Bike[] = [
  {
    id: 'b1',
    name: 'Winora Holiday',
    status: 'Verkauft',
    purchasePrice: 50,
    purchaseDate: '2025-09-30',
    sellingPrice: 160,
    saleDate: '2025-10-14',
    targetSellingPrice: 160,
    timeSpentSeconds: 3 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e1', description: 'Material', amount: 4, date: '2025-10-05' }],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b2',
    name: 'GIANT Terrago',
    status: 'Verkauft',
    purchasePrice: 15,
    purchaseDate: '2025-10-07',
    sellingPrice: 30,
    saleDate: '2025-10-17',
    targetSellingPrice: 30,
    timeSpentSeconds: 3 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'war komplett kaputt, Schaltung, Lagerschaden -> Keine kaputten Bastler räder mehr kaufen.',
    photos: [],
  },
  {
    id: 'b3',
    name: 'Platzhalter für november',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2025-11-01',
    sellingPrice: 0,
    saleDate: '2025-11-01',
    targetSellingPrice: 0,
    timeSpentSeconds: 0,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Platzhalter für november',
    photos: [],
  },
  {
    id: 'b4',
    name: 'KCT 02.15',
    status: 'Verkauft',
    purchasePrice: 50,
    purchaseDate: '2025-12-07',
    sellingPrice: 185,
    saleDate: '2026-01-25',
    targetSellingPrice: 185,
    timeSpentSeconds: 9.5 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e4', description: 'Material', amount: 7.98, date: '2025-12-20' }],
    checklist: [],
    notes: 'ABUS Schloss gabs dazu, neue Bremsbeläge, neue Bremszüge, lager neu geffettet + neue Lagerkugeln, poliert + gereinigt, Shimano Deore XT',
    photos: [],
  },
  {
    id: 'b5',
    name: 'Adler 28 Zoll Herrenfahrrad',
    status: 'Verkauft',
    purchasePrice: 100,
    purchaseDate: '2025-12-16',
    sellingPrice: 200,
    saleDate: '2025-12-22',
    targetSellingPrice: 200,
    timeSpentSeconds: 2 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b6',
    name: 'Hercules Damenfahrrad 26 Zoll',
    status: 'Verkauft',
    purchasePrice: 25,
    purchaseDate: '2025-12-29',
    sellingPrice: 120,
    saleDate: '2026-03-14',
    targetSellingPrice: 120,
    timeSpentSeconds: 7 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e6', description: 'Material', amount: 48.39, date: '2026-01-15' }],
    checklist: [],
    notes: 'neue Weißwandreifen, neues Felgenband, neue Schläuche, poliert + gereinigt',
    photos: [],
  },
  {
    id: 'b7',
    name: 'Vintage Rennrad 28 Zoll',
    status: 'Verkauft',
    purchasePrice: 70,
    purchaseDate: '2026-01-15',
    sellingPrice: 100,
    saleDate: '2026-02-21',
    targetSellingPrice: 100,
    timeSpentSeconds: 2 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Weiterverkauf ohne groß Aufwand, ist auf ebay nicht wirklich weggegangen, daher "100€ und du holst es heute exit" bei 120€ auf ebay ohne wirkliche anfragen.',
    photos: [],
  },
  {
    id: 'b8',
    name: 'Bergamont 28 Zoll Balami N7',
    status: 'Verkauft',
    purchasePrice: 40,
    purchaseDate: '2026-01-19',
    sellingPrice: 160,
    saleDate: '2026-01-29',
    targetSellingPrice: 160,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Bilder auf dem Weg nach Hause gemacht, easy money',
    photos: [],
  },
  {
    id: 'b9',
    name: 'Fashion Line Fahrrad mit Tiefeneinstieg',
    status: 'Verkauft',
    purchasePrice: 2,
    purchaseDate: '2026-02-05',
    sellingPrice: 70,
    saleDate: '2026-02-06',
    targetSellingPrice: 70,
    timeSpentSeconds: 0.33 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Geschenkt bekommen Anna Lena 1/2, 4€ für Schlauch ausgegeben',
    photos: [],
  },
  {
    id: 'b10',
    name: 'Hercules palladio blau 28 Zoll',
    status: 'Verkauft',
    purchasePrice: 15,
    purchaseDate: '2026-02-10',
    sellingPrice: 65,
    saleDate: '2026-02-16',
    targetSellingPrice: 65,
    timeSpentSeconds: 2.5 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Arbeitszeit = hauptsächlich wegzeit. Oma verwechselte Fahrräder, kauf war Notlösung um nach hause zu kommen, Pegasus hellblau für 40 ausgehandelt und probegefahren -> fremdverschulden. inkl. 2 schlösser (1 kabel, 1 gliederschloss)',
    photos: [],
  },
  {
    id: 'b11',
    name: 'Hercules Vintage Rennrad',
    status: 'Verkauft',
    purchasePrice: 55,
    purchaseDate: '2026-02-11',
    sellingPrice: 160,
    saleDate: '2026-02-16',
    targetSellingPrice: 160,
    timeSpentSeconds: 4.3 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e11', description: 'Material', amount: 20.15, date: '2026-02-13' }],
    checklist: [],
    notes: 'Fahrradkarte, platten, rostiges Oberrohr. Rahmen ansonten ok, strategie: aufwenig flip, rahmen polieren & versiegeln, rost als patina verkaufen. Neu: Griffband, Schlauch, Anmerkung',
    photos: [],
  },
  {
    id: 'b12',
    name: 'Elops Decathlon Fahrrad comfort',
    status: 'Verkauft',
    purchasePrice: 50,
    purchaseDate: '2026-02-12',
    sellingPrice: 175,
    saleDate: '2026-03-01',
    targetSellingPrice: 175,
    timeSpentSeconds: 5 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e12', description: 'Material', amount: 28, date: '2026-02-20' }],
    checklist: [],
    notes: '1,5h der Arbeitszeit in Mittagspause der Schule - zeit effektiv genutzt, kein realer Zeitverlust. Zahnkranz rostig, alle teile die rosten können rostig. reifen dreckig aber halten luft. -> Reinigung. Material: Neue Kette, neuer Zahnkranz, Viele Teile USR gereinigt',
    photos: [],
  },
  {
    id: 'b13',
    name: 'Kreidler RT',
    status: 'Verkauft',
    purchasePrice: 125,
    purchaseDate: '2026-02-13',
    sellingPrice: 120,
    saleDate: '2026-03-14',
    targetSellingPrice: 120,
    timeSpentSeconds: 2 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Schloss, Federgabel fest, umwerfer vorne einstelle',
    photos: [],
  },
  {
    id: 'b14',
    name: 'Peugot Bastlerrad Anna Lena',
    status: 'Verkauft',
    purchasePrice: 2,
    purchaseDate: '2026-02-21',
    sellingPrice: 10,
    saleDate: '2026-02-21',
    targetSellingPrice: 10,
    timeSpentSeconds: 0.16 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'von Anna Lena, einfach weg das Ding',
    photos: [],
  },
  {
    id: 'b15',
    name: 'Pegasus Solero SL 50cm RH',
    status: 'Verkauft',
    purchasePrice: 20,
    purchaseDate: '2026-02-21',
    sellingPrice: 55,
    saleDate: '2026-02-26',
    targetSellingPrice: 55,
    timeSpentSeconds: 1.5 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e15', description: 'Material', amount: 9.60, date: '2026-02-23' }],
    checklist: [],
    notes: 'Schlauch neu, dreckig, Sattel kaputt, Licht mit Panzertape',
    photos: [],
  },
  {
    id: 'b16',
    name: 'Haibike Seet 7',
    status: 'Verkauft',
    purchasePrice: 260,
    purchaseDate: '2026-02-24',
    sellingPrice: 360,
    saleDate: '2026-03-22',
    targetSellingPrice: 360,
    timeSpentSeconds: 0.25 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'mit abholung, NAGELNEU BANGER INSTANT RESELL, Glück beim Kauf',
    photos: [],
  },
  {
    id: 'b17',
    name: 'Scott Sportster 28 Zoll mit Scheibenbremsen',
    status: 'Verkauft',
    purchasePrice: 70,
    purchaseDate: '2026-02-28',
    sellingPrice: 225,
    saleDate: '2026-03-05',
    targetSellingPrice: 225,
    timeSpentSeconds: 3.1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b18',
    name: 'Infrastruktur Feburar',
    status: 'Zu reparieren',
    purchasePrice: 63,
    purchaseDate: '2026-02-28',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: null,
    timeSpentSeconds: 0,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Kassettenabzieher, Ultraschallreiniger, Werkzeugwand',
    photos: [],
  },
  {
    id: 'b19',
    name: 'Infrastruktur März',
    status: 'Zu reparieren',
    purchasePrice: 149.90,
    purchaseDate: '2026-03-02',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: null,
    timeSpentSeconds: 0,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '5 Bremsenreiniger, 6 Paar Handschuhe, Stativstrahler mit 1900 Lumen, Deckenfeuchtraumlampe, WD40, Silikonspray, Kettenöl Dry Lube 1200ml, Nitril Chemikalienhandschuhe, Stahlwolle, Scheibenbremsen Einstell und Richtwerkzeug, Druckreiniger Parkside, Ultrtraschallreiniger Reinigerkonzentrat',
    photos: [],
  },
  {
    id: 'b20',
    name: 'Rennrad mit Shimano 600er',
    status: 'Inseriert',
    purchasePrice: 130,
    purchaseDate: '2026-03-10',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 158,
    timeSpentSeconds: 2 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'auf eBay',
    photos: [],
  },
  {
    id: 'b21',
    name: 'Fashion Line Damenrad ohne Schaltzug',
    status: 'Zu reparieren',
    purchasePrice: 30,
    purchaseDate: '2026-03-12',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 81.50,
    timeSpentSeconds: 3.25 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e21', description: 'Material', amount: 6, date: '2026-03-15' }],
    checklist: [],
    notes: 'Schaltzug der Schaltung nicht vorhanden, Sturmey Archer Ersatz kabelverankerung bestellt. Dreckig, Fehlkauf (war als Defekt mit Platten deklariert, Schaltung nicht aufgefallen)',
    photos: [],
  },
  {
    id: 'b22',
    name: 'nebenan, Christina, 2 Räder',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2026-03-12',
    sellingPrice: 60,
    saleDate: '2026-03-22',
    targetSellingPrice: 60,
    timeSpentSeconds: 1.5 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e22', description: 'Material', amount: 8, date: '2026-03-15' }],
    checklist: [],
    notes: '2 Fahrräder',
    photos: [],
  },
  {
    id: 'b23',
    name: 'Fahrrad von Nachbar',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2026-03-15',
    sellingPrice: 40,
    saleDate: '2026-03-21',
    targetSellingPrice: 40,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Geschenkt bekommen',
    photos: [],
  },
  {
    id: 'b24',
    name: 'Decathlon Triban RC100',
    status: 'Verkauft',
    purchasePrice: 150,
    purchaseDate: '2026-03-16',
    sellingPrice: 200,
    saleDate: '2026-03-20',
    targetSellingPrice: 200,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'An Freund verkauft, Abholung dauerte 45 min, 15 min putzen',
    photos: [],
  },
  {
    id: 'b25',
    name: 'Winora Damenfahrrad',
    status: 'Verkauft',
    purchasePrice: 70,
    purchaseDate: '2026-03-16',
    sellingPrice: 130,
    saleDate: '2026-03-22',
    targetSellingPrice: 130,
    timeSpentSeconds: 2 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Abholung Dauer 1h15 min, Rahmen gewaschen & poliert.',
    photos: [],
  },
  {
    id: 'b26',
    name: 'nebenan Anna-Lena',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2026-03-20',
    sellingPrice: 20,
    saleDate: '2026-03-20',
    targetSellingPrice: 20,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e26', description: 'Material', amount: 5, date: '2026-03-20' }],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b27',
    name: 'Damenfahrrad mit 2 Körben',
    status: 'Inseriert',
    purchasePrice: 50,
    purchaseDate: '2026-03-22',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 100.12,
    timeSpentSeconds: 3.58 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'auf eBay',
    photos: [],
  },
  {
    id: 'b28',
    name: 'VSF Fahrradmanufaktur T50',
    status: 'Zu reparieren',
    purchasePrice: 120,
    purchaseDate: '2026-03-23',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 137.50,
    timeSpentSeconds: 1.25 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b29',
    name: 'Pegasus mit Deore XT',
    status: 'Verkauft',
    purchasePrice: 20,
    purchaseDate: '2026-03-23',
    sellingPrice: 50,
    saleDate: '2026-03-24',
    targetSellingPrice: 50,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b30',
    name: 'Stevens Rider 28 Zoll',
    status: 'Zu reparieren',
    purchasePrice: 150,
    purchaseDate: '2026-03-23',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 152.24,
    timeSpentSeconds: 0.16 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Wurde geliefert für 20€ Aufpreis (auf 130 gehandelt, 150 gezahlt), keine Schutzbleche, Rad vorne hat Spiel (Nabendynamo, Federgabel quitscht. keine Konusschrauben direkt in Sicht)',
    photos: [],
  },
  {
    id: 'b31',
    name: 'nebenan Volker',
    status: 'Zu reparieren',
    purchasePrice: 0,
    purchaseDate: '2026-03-23',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 50,
    timeSpentSeconds: 0,
    lastModified: Date.now(),
    expenses: [{ id: 'e31', description: 'Material', amount: 52.12, date: '2026-03-24' }],
    checklist: [],
    notes: 'Bremsbeläge, Kassette USR, Kette neu',
    photos: [],
  },
  {
    id: 'b32',
    name: 'nebenan Nina',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2026-03-24',
    sellingPrice: 20,
    saleDate: '2026-03-24',
    targetSellingPrice: 20,
    timeSpentSeconds: 0.33 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Schaltung Einstellen',
    photos: [],
  },
  {
    id: 'b33',
    name: 'nebenan Beate',
    status: 'Verkauft',
    purchasePrice: 0,
    purchaseDate: '2026-03-24',
    sellingPrice: 20,
    saleDate: '2026-03-24',
    targetSellingPrice: 20,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: 'Putzen, Reputation: versäumter Termin, daher unaufgeforderte politur',
    photos: [],
  },
  {
    id: 'b34',
    name: 'nebenan Alexandra',
    status: 'Zu reparieren',
    purchasePrice: 0,
    purchaseDate: '2026-03-25',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: null,
    timeSpentSeconds: 0.3 * 3600,
    lastModified: Date.now(),
    expenses: [{ id: 'e34', description: 'Material', amount: 4.20, date: '2026-03-25' }],
    checklist: [],
    notes: 'noch nicht abgeholt, generalüberholung',
    photos: [],
  },
  {
    id: 'b35',
    name: 'nebenan Jan',
    status: 'Zu reparieren',
    purchasePrice: 0,
    purchaseDate: '2026-03-25',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: null,
    timeSpentSeconds: 0,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  },
  {
    id: 'b36',
    name: 'Cube MTB mit Deore XT',
    status: 'Zu reparieren',
    purchasePrice: 130,
    purchaseDate: '2026-03-25',
    sellingPrice: null,
    saleDate: null,
    targetSellingPrice: 144,
    timeSpentSeconds: 1 * 3600,
    lastModified: Date.now(),
    expenses: [],
    checklist: [],
    notes: '',
    photos: [],
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'workshop' | 'daily'>('tracking');
  const [trackingScrollPos, setTrackingScrollPos] = useState(0);
  const [isTiedCapitalExpanded, setIsTiedCapitalExpanded] = useState(false);
  
  const handleTabChange = (tab: 'tracking' | 'workshop' | 'daily') => {
    if (activeTab === 'tracking') {
      setTrackingScrollPos(window.scrollY);
    }
    setActiveTab(tab);
  };
  
  // Load from local storage or use initial data
  const [bikes, setBikes] = useState<Bike[]>(() => {
    const saved = localStorage.getItem('flipbike_bikes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse bikes from local storage', e);
      }
    }
    return initialBikes;
  });

  const [dailyTodos, setDailyTodos] = useState<DailyTodo[]>(() => {
    const saved = localStorage.getItem('flipbike_todos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse todos from local storage', e);
      }
    }
    return [];
  });

  const [activeWorkshopBikeId, setActiveWorkshopBikeId] = useState<string | null>(() => {
    return localStorage.getItem('flipbike_active_workshop_id');
  });

  const [logs, setLogs] = useState<Log[]>(() => {
    const saved = localStorage.getItem('flipbike_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse logs from local storage', e);
      }
    }
    return [];
  });

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem('flipbike_bikes', JSON.stringify(bikes));
  }, [bikes]);

  useEffect(() => {
    localStorage.setItem('flipbike_todos', JSON.stringify(dailyTodos));
  }, [dailyTodos]);

  useEffect(() => {
    if (activeWorkshopBikeId) {
      localStorage.setItem('flipbike_active_workshop_id', activeWorkshopBikeId);
    } else {
      localStorage.removeItem('flipbike_active_workshop_id');
    }
  }, [activeWorkshopBikeId]);

  useEffect(() => {
    localStorage.setItem('flipbike_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = useCallback((message: string, revertAction?: Log['revertAction']) => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), message, revertAction }, ...prev].slice(0, 200));
  }, []);

  const updateBike = useCallback((id: string, updates: Partial<Bike>) => {
    const bike = bikes.find(b => b.id === id);
    if (bike) {
      const oldValues: Partial<Bike> = {};
      let shouldLog = false;
      let message = '';

      if (updates.status && updates.status !== bike.status) {
        oldValues.status = bike.status;
        message = `Status geändert für "${bike.name}": ${bike.status} -> ${updates.status}`;
        shouldLog = true;
      } else if (updates.name && updates.name !== bike.name) {
        oldValues.name = bike.name;
        message = `Fahrrad umbenannt: "${bike.name}" -> "${updates.name}"`;
        shouldLog = true;
      }

      if (shouldLog) {
        addLog(message, { type: 'update', data: { id, oldValues } });
      }
    }
    setBikes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates, lastModified: Date.now() } : b)));
  }, [addLog, bikes]);

  const deleteBike = useCallback((id: string) => {
    const bike = bikes.find(b => b.id === id);
    if (bike) {
      addLog(`Fahrrad gelöscht: "${bike.name}"`, { type: 'delete', data: { ...bike } });
    }
    setBikes((prev) => prev.filter((b) => b.id !== id));
    if (activeWorkshopBikeId === id) {
      setActiveWorkshopBikeId(null);
    }
  }, [addLog, bikes, activeWorkshopBikeId]);

  const addBike = useCallback((newBikeData: Partial<Bike>) => {
    const newBike: Bike = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBikeData.name || 'Neues Fahrrad',
      status: newBikeData.status || 'Zu reparieren',
      purchasePrice: newBikeData.purchasePrice || 0,
      purchaseDate: newBikeData.purchaseDate || new Date().toISOString().split('T')[0],
      sellingPrice: newBikeData.sellingPrice || null,
      saleDate: newBikeData.saleDate || null,
      targetSellingPrice: newBikeData.targetSellingPrice || null,
      timeSpentSeconds: 0,
      lastModified: Date.now(),
      expenses: [],
      checklist: [],
      notes: newBikeData.notes || '',
      photos: [],
    };
    setBikes([newBike, ...bikes]);
    addLog(`Fahrrad hinzugefügt: "${newBike.name}"`, { type: 'add', data: newBike.id });
  }, [addLog, bikes]);

  const revertLogAction = (logId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log || !log.revertAction) return;

    const { type, data } = log.revertAction;

    if (type === 'add') {
      // Revert add: delete the bike
      setBikes(prev => prev.filter(b => b.id !== data));
    } else if (type === 'delete') {
      // Revert delete: restore the bike
      setBikes(prev => [data, ...prev]);
    } else if (type === 'update') {
      // Revert update: restore specific fields
      setBikes(prev => prev.map(b => b.id === data.id ? { ...b, ...data.oldValues } : b));
    }

    // Remove the log entry or mark it as reverted
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  const navigateToWorkshopBike = (bikeId: string) => {
    setActiveWorkshopBikeId(bikeId);
    handleTabChange('workshop');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Status', 'Einkaufspreis', 'Einkaufsdatum', 'Ziel VK', 'Verkaufspreis', 'Verkaufsdatum', 'Zeit (h)', 'Kosten Material'];
    const rows = bikes.map(b => {
      const expenses = b.expenses.reduce((sum, e) => sum + e.amount, 0);
      return [
        b.id,
        `"${b.name}"`,
        b.status,
        b.purchasePrice,
        b.purchaseDate,
        b.targetSellingPrice || '',
        b.sellingPrice || '',
        b.saleDate || '',
        (b.timeSpentSeconds / 3600).toFixed(2),
        expenses
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flipbike_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsProfileMenuOpen(false);
  };

  const downloadCharts = () => {
    const canvases = document.querySelectorAll('canvas');
    if (canvases.length === 0) {
      alert('Keine Diagramme gefunden. Bitte wechsle zum Tracking-Tab.');
      return;
    }
    canvases.forEach((canvas, index) => {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flipbike_chart_${index + 1}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      {/* Top Navigation (Desktop) */}
      <nav className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">Flip<span className="text-orange-500">Bike</span></span>
        </div>
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => handleTabChange('tracking')}
            className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'tracking'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            TRACKING
          </button>
          <button
            onClick={() => handleTabChange('workshop')}
            className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'workshop'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4 mr-2" />
            WERKSTATT
          </button>
          <button
            onClick={() => handleTabChange('daily')}
            className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'daily'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            DAILY TO-DO
          </button>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-700 transition-colors"
          >
            ME
          </button>
          
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-2 space-y-1">
                <button 
                  onClick={() => { setIsLogsModalOpen(true); setIsProfileMenuOpen(false); }}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Aktivitäts-Logs
                </button>
                <button 
                  onClick={exportCSV}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Als CSV exportieren
                </button>
                <button 
                  onClick={downloadCharts}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Diagramme herunterladen
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:py-8 md:pb-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-100">Flip<span className="text-orange-500">Bike</span></span>
          </div>
          <button
            onClick={() => handleTabChange('tracking')}
            className={`p-2 rounded-lg ${activeTab === 'tracking' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-700 transition-colors"
            >
              ME
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => { setIsLogsModalOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Aktivitäts-Logs
                  </button>
                  <button 
                    onClick={exportCSV}
                    className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Als CSV exportieren
                  </button>
                  <button 
                    onClick={downloadCharts}
                    className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Diagramme herunterladen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`animate-in fade-in duration-500 ${activeTab === 'tracking' && trackingScrollPos > 0 ? '' : 'slide-in-from-bottom-4'}`}>
          {activeTab === 'tracking' ? (
            <TrackingModule 
              bikes={bikes} 
              updateBike={updateBike} 
              addBike={addBike} 
              deleteBike={deleteBike} 
              onNavigateToWorkshop={(id) => {
                setActiveWorkshopBikeId(id);
                handleTabChange('workshop');
              }}
              initialScrollPos={trackingScrollPos}
              isTiedCapitalExpanded={isTiedCapitalExpanded}
              setIsTiedCapitalExpanded={setIsTiedCapitalExpanded}
            />
          ) : activeTab === 'workshop' ? (
            <WorkshopModule 
              bikes={bikes} 
              updateBike={updateBike} 
              activeBikeId={activeWorkshopBikeId}
              setActiveBikeId={setActiveWorkshopBikeId}
            />
          ) : (
            <DailyTodoModule 
              todos={dailyTodos} 
              setTodos={setDailyTodos} 
              bikes={bikes} 
              onNavigateBack={() => handleTabChange('workshop')}
              onNavigateToBike={navigateToWorkshopBike}
            />
          )}
        </div>
      </main>

      {/* Logs Modal */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-500" />
                Aktivitäts-Logs
              </h2>
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Keine Logs vorhanden.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">
                        {new Date(log.timestamp).toLocaleString('de-DE')}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-300">
                          {log.message}
                        </div>
                        {log.revertAction && (
                          <button 
                            onClick={() => revertLogAction(log.id)}
                            className="text-xs font-medium text-orange-500 hover:text-orange-400 px-2 py-1 rounded hover:bg-orange-500/10 transition-colors flex items-center"
                          >
                            Rückgängig
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
          <button
            onClick={() => handleTabChange('tracking')}
            className={`flex flex-col items-center justify-center w-full py-3 rounded-xl transition-colors ${
              activeTab === 'tracking' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BarChart3 className={`w-6 h-6 mb-1 ${activeTab === 'tracking' ? 'fill-orange-500/20' : ''}`} />
            <span className="text-[10px] font-bold tracking-wider">TRACKING</span>
          </button>
          <button
            onClick={() => handleTabChange('workshop')}
            className={`flex flex-col items-center justify-center w-full py-3 rounded-xl transition-colors ${
              activeTab === 'workshop' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wrench className={`w-6 h-6 mb-1 ${activeTab === 'workshop' ? 'fill-orange-500/20' : ''}`} />
            <span className="text-[10px] font-bold tracking-wider">WERKSTATT</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
