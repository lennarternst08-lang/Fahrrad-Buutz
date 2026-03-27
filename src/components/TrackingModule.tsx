import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Bike, BikeStatus } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Clock, Wallet, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Trash2, Edit2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  format, subDays, subWeeks, subMonths, subYears, 
  isSameDay, isSameWeek, isSameMonth, isSameYear, 
  parseISO, endOfDay, endOfWeek, endOfMonth, endOfYear,
  differenceInDays
} from 'date-fns';
import { de } from 'date-fns/locale';

const pointLabelsPlugin = {
  id: 'pointLabels',
  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 10px Inter';
    ctx.fillStyle = '#94a3b8';

    data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((element: any, index: number) => {
        const value = dataset.data[index];
        if (value !== 0 && value !== null && value !== undefined) {
          const formattedValue = typeof value === 'number' ? Math.round(value).toString() : value;
          ctx.fillText(formattedValue, element.x, element.y - 8);
        }
      });
    });
    ctx.restore();
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  pointLabelsPlugin
);

interface TrackingModuleProps {
  bikes: Bike[];
  updateBike: (id: string, updates: Partial<Bike>) => void;
  addBike: (bike: Partial<Bike>) => void;
  deleteBike: (id: string) => void;
  onNavigateToWorkshop: (id: string) => void;
  initialScrollPos?: number;
  isTiedCapitalExpanded: boolean;
  setIsTiedCapitalExpanded: (expanded: boolean) => void;
}

export function TrackingModule({ 
  bikes, 
  updateBike, 
  addBike, 
  deleteBike, 
  onNavigateToWorkshop, 
  initialScrollPos,
  isTiedCapitalExpanded,
  setIsTiedCapitalExpanded
}: TrackingModuleProps) {
  const [filterStatus, setFilterStatus] = useState<BikeStatus | 'Alle'>('Alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const [tableViewMode, setTableViewMode] = useState<'quick' | 'expanded'>(() => {
    const saved = localStorage.getItem('flipbike_tableViewMode');
    if (saved === 'quick' || saved === 'expanded') return saved;
    return window.innerWidth < 768 ? 'quick' : 'expanded';
  });

  React.useEffect(() => {
    localStorage.setItem('flipbike_tableViewMode', tableViewMode);
  }, [tableViewMode]);

  type SortField = 'name' | 'status' | 'purchaseDate' | 'purchasePrice' | 'expenses' | 'timeSpentSeconds' | 'targetSellingPrice' | 'saleDate' | 'sellingPrice' | 'hourlyWage' | 'profit' | 'velocity';
  const [sortField, setSortField] = useState<SortField>(() => {
    return window.innerWidth < 768 ? 'status' : 'purchaseDate';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return window.innerWidth < 768 ? 'asc' : 'desc';
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameBikeId, setRenameBikeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editTimeBikeId, setEditTimeBikeId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  
  const [newBikeData, setNewBikeData] = useState<Partial<Bike>>({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    targetSellingPrice: 0,
    status: 'Zu reparieren'
  });

  const [isReady, setIsReady] = useState(!initialScrollPos);

  React.useLayoutEffect(() => {
    if (initialScrollPos) {
      window.scrollTo(0, initialScrollPos);
      // Small delay to ensure browser has processed the scroll before showing content
      const timer = setTimeout(() => setIsReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [initialScrollPos]);

  const handleAddBikeSubmit = () => {
    if (!newBikeData.name) return;
    addBike(newBikeData);
    setIsAddModalOpen(false);
    setNewBikeData({
      name: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      targetSellingPrice: 0,
      status: 'Zu reparieren'
    });
  };

  // Calculate KPIs
  const soldBikes = bikes.filter((b) => b.status === 'Verkauft');
  
  const totalUmsatz = soldBikes.reduce((acc, bike) => acc + (bike.sellingPrice || 0), 0);

  // Gesamtgewinn = Cashflow (Alle Einnahmen - Alle Ausgaben)
  const totalProfit = bikes.reduce((acc, bike) => {
    const expenses = bike.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    let bikeFlow = -bike.purchasePrice - expenses;
    if (bike.status === 'Verkauft') {
      bikeFlow += (bike.sellingPrice || 0);
    }
    return acc + bikeFlow;
  }, 0);

  // Stundenlohn = Nur für verkaufte Fahrräder (Gewinn der verkauften / Zeit der verkauften)
  const soldBikesProfit = soldBikes.reduce((acc, bike) => {
    const expenses = bike.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return acc + ((bike.sellingPrice || 0) - bike.purchasePrice - expenses);
  }, 0);

  const totalTimeSeconds = soldBikes.reduce((acc, bike) => acc + bike.timeSpentSeconds, 0);
  const avgHourlyWage = totalTimeSeconds > 0 
    ? soldBikesProfit / (totalTimeSeconds / 3600) 
    : 0;

  const activeBikesWithCapital = bikes
    .filter(b => b.status !== 'Verkauft')
    .map(bike => {
      const expenses = bike.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return { ...bike, tiedCapital: bike.purchasePrice + expenses };
    })
    .sort((a, b) => b.tiedCapital - a.tiedCapital);

  const tiedCapital = activeBikesWithCapital.reduce((acc, bike) => acc + bike.tiedCapital, 0);

  // --- Chart Calculations ---
  const getPeriods = (tf: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    switch (tf) {
      case 'day': return Array.from({ length: 14 }).map((_, i) => subDays(now, 13 - i));
      case 'week': return Array.from({ length: 12 }).map((_, i) => subWeeks(now, 11 - i));
      case 'month': return Array.from({ length: 6 }).map((_, i) => subMonths(now, 5 - i));
      case 'year': return Array.from({ length: 12 }).map((_, i) => subMonths(now, 11 - i));
    }
  };

  const isSamePeriod = (date1: Date, date2: Date, tf: 'day' | 'week' | 'month' | 'year') => {
    switch (tf) {
      case 'day': return isSameDay(date1, date2);
      case 'week': return isSameWeek(date1, date2, { weekStartsOn: 1 });
      case 'month': return isSameMonth(date1, date2);
      case 'year': return isSameMonth(date1, date2);
    }
  };

  const formatPeriod = (date: Date, tf: 'day' | 'week' | 'month' | 'year') => {
    switch (tf) {
      case 'day': return format(date, 'dd.MM', { locale: de });
      case 'week': return `${format(date, 'dd.MM', { locale: de })} - ${format(endOfWeek(date, { weekStartsOn: 1 }), 'dd.MM', { locale: de })}`;
      case 'month': return format(date, 'MMM yy', { locale: de });
      case 'year': return format(date, 'MMM yy', { locale: de });
    }
  };

  const getEndOfPeriod = (date: Date, tf: 'day' | 'week' | 'month' | 'year') => {
    switch (tf) {
      case 'day': return endOfDay(date);
      case 'week': return endOfWeek(date, { weekStartsOn: 1 });
      case 'month': return endOfMonth(date);
      case 'year': return endOfMonth(date);
    }
  };

  const periods = getPeriods(timeframe); // Oldest to newest
  const labels = periods.map(p => formatPeriod(p, timeframe));

  const investData = periods.map(period => {
    let invest = 0;
    bikes.forEach(bike => {
      if (bike.purchaseDate && isSamePeriod(parseISO(bike.purchaseDate), period, timeframe)) {
        invest += bike.purchasePrice;
      }
      bike.expenses.forEach(exp => {
        if (exp.date && isSamePeriod(parseISO(exp.date), period, timeframe)) {
          invest += exp.amount;
        }
      });
    });
    return invest;
  });

  const umsatzData = periods.map(period => {
    let umsatz = 0;
    bikes.forEach(bike => {
      if (bike.saleDate && isSamePeriod(parseISO(bike.saleDate), period, timeframe)) {
        umsatz += (bike.sellingPrice || 0);
      }
    });
    return umsatz;
  });

  const gewinnData = umsatzData.map((umsatz, i) => umsatz - investData[i]);

  const gesamtGewinnData = periods.map(period => {
    const end = getEndOfPeriod(period, timeframe);
    let profit = 0;
    bikes.forEach(bike => {
      if (bike.purchaseDate && parseISO(bike.purchaseDate) <= end) {
        profit -= bike.purchasePrice;
      }
      bike.expenses.forEach(exp => {
        if (exp.date && parseISO(exp.date) <= end) {
          profit -= exp.amount;
        }
      });
      if (bike.status === 'Verkauft' && bike.saleDate && parseISO(bike.saleDate) <= end) {
        profit += (bike.sellingPrice || 0);
      }
    });
    return profit;
  });

  const stundenlohnData = periods.map(period => {
    let periodProfit = 0;
    let periodTime = 0;
    
    bikes.forEach(bike => {
      if (bike.status !== 'Verkauft' || !bike.saleDate) return;
      
      const effectiveDate = parseISO(bike.saleDate);
      if (isSamePeriod(effectiveDate, period, timeframe)) {
        const expenses = bike.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const profit = (bike.sellingPrice || 0) - bike.purchasePrice - expenses;
        
        periodProfit += profit;
        periodTime += bike.timeSpentSeconds;
      }
    });
    
    return periodTime > 0 ? periodProfit / (periodTime / 3600) : 0;
  });

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true,
        position: 'top' as const,
        labels: { color: '#cbd5e1', boxWidth: 12, padding: 10 }
      } 
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.1)' }, 
        ticks: { color: '#94a3b8' },
        grace: '10%'
      },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  const stundenlohnChartData = {
    labels,
    datasets: [{
      label: 'Stundenlohn (€/h)',
      data: stundenlohnData,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1,
      fill: false,
    }]
  };

  const gesamtGewinnChartData = {
    labels,
    datasets: [{
      label: 'Gesamtgewinn (€)',
      data: gesamtGewinnData,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1,
      fill: false,
    }]
  };

  const gewinnPeriodeChartData = {
    labels,
    datasets: [{
      label: `Gewinn / ${timeframe === 'day' ? 'Tag' : timeframe === 'week' ? 'Woche' : timeframe === 'month' ? 'Monat' : 'Jahr'}`,
      data: gewinnData,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1,
      fill: false,
    }]
  };

  const investUmsatzChartData = {
    labels,
    datasets: [
      {
        label: 'Invest / Periode',
        data: investData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Umsatz / Periode',
        data: umsatzData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.1,
        fill: true,
      }
    ]
  };

  // Filter and sort bikes for inventory
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline-block" /> : <ArrowDown className="w-3 h-3 ml-1 inline-block" />;
  };

  const filteredBikes = bikes
    .filter(b => filterStatus === 'Alle' || b.status === filterStatus)
    .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      const expensesA = a.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const expensesB = b.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const profitA = a.status === 'Verkauft' ? (a.sellingPrice || 0) - a.purchasePrice - expensesA : -Infinity;
      const profitB = b.status === 'Verkauft' ? (b.sellingPrice || 0) - b.purchasePrice - expensesB : -Infinity;

      const hourlyWageA = a.status === 'Verkauft' && a.sellingPrice && a.timeSpentSeconds > 0 ? profitA / (a.timeSpentSeconds / 3600) : -Infinity;
      const hourlyWageB = b.status === 'Verkauft' && b.sellingPrice && b.timeSpentSeconds > 0 ? profitB / (b.timeSpentSeconds / 3600) : -Infinity;

      const velocityA = a.saleDate ? differenceInDays(parseISO(a.saleDate), parseISO(a.purchaseDate)) : (sortDirection === 'asc' ? Infinity : -Infinity);
      const velocityB = b.saleDate ? differenceInDays(parseISO(b.saleDate), parseISO(b.purchaseDate)) : (sortDirection === 'asc' ? Infinity : -Infinity);

      switch (sortField) {
        case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case 'status': 
          const statusOrder = { 'Zu reparieren': 1, 'Inseriert': 2, 'Verkauft': 3, 'Infrastruktur': 4 };
          valA = statusOrder[a.status]; 
          valB = statusOrder[b.status]; 
          break;
        case 'purchaseDate': valA = new Date(a.purchaseDate).getTime(); valB = new Date(b.purchaseDate).getTime(); break;
        case 'purchasePrice': valA = a.purchasePrice; valB = b.purchasePrice; break;
        case 'expenses': valA = expensesA; valB = expensesB; break;
        case 'timeSpentSeconds': valA = a.timeSpentSeconds; valB = b.timeSpentSeconds; break;
        case 'targetSellingPrice': valA = a.targetSellingPrice || 0; valB = b.targetSellingPrice || 0; break;
        case 'saleDate': valA = a.saleDate ? new Date(a.saleDate).getTime() : 0; valB = b.saleDate ? new Date(b.saleDate).getTime() : 0; break;
        case 'sellingPrice': valA = a.sellingPrice || 0; valB = b.sellingPrice || 0; break;
        case 'hourlyWage': valA = hourlyWageA; valB = hourlyWageB; break;
        case 'profit': valA = profitA; valB = profitB; break;
        case 'velocity': valA = velocityA; valB = velocityB; break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className={`space-y-6 pb-20 md:pb-0 transition-opacity ${isReady ? 'duration-300 opacity-100' : 'duration-0 opacity-0'}`}>
      {/* Inventory List (Moved to top) */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-4 sticky top-0 z-30 bg-slate-900 border-b border-slate-800 rounded-t-xl">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl">Inventar</CardTitle>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="h-8">
              <Plus className="w-4 h-4 mr-1" /> Neu
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 mr-2">
              <button
                onClick={() => setTableViewMode('quick')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tableViewMode === 'quick' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Schnellansicht
              </button>
              <button
                onClick={() => setTableViewMode('expanded')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tableViewMode === 'expanded' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Erweitert
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Suchen..."
                className="pl-9 w-full sm:w-48 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="Alle">Alle Status</option>
              <option value="Zu reparieren">Zu reparieren</option>
              <option value="Inseriert">Inseriert</option>
              <option value="Verkauft">Verkauft</option>
              <option value="Infrastruktur">Infrastruktur</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300 min-w-[800px]">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                <tr>
                  <th className="px-2 py-3 rounded-tl-lg cursor-pointer hover:bg-slate-700/50 sticky left-0 z-20 bg-slate-800 border-r border-slate-700/50 max-w-[120px] md:max-w-none" onClick={() => handleSort('name')}>Fahrrad <SortIcon field="name" /></th>
                  <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('status')}>Status <SortIcon field="status" /></th>
                  <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('purchaseDate')}>Ankauf <SortIcon field="purchaseDate" /></th>
                  <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('purchasePrice')}>EK (€) <SortIcon field="purchasePrice" /></th>
                  {tableViewMode === 'expanded' && <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('expenses')}>Material (€) <SortIcon field="expenses" /></th>}
                  {tableViewMode === 'expanded' && <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('timeSpentSeconds')}>Stunden <SortIcon field="timeSpentSeconds" /></th>}
                  {tableViewMode === 'expanded' && <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('targetSellingPrice')}>Ziel VK (€) <SortIcon field="targetSellingPrice" /></th>}
                  <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('saleDate')}>Verkauf <SortIcon field="saleDate" /></th>
                  {tableViewMode === 'expanded' && <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('velocity')}>Dauer <SortIcon field="velocity" /></th>}
                  <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('sellingPrice')}>VK (€) <SortIcon field="sellingPrice" /></th>
                  {tableViewMode === 'expanded' && <th className="px-3 py-3 cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('hourlyWage')}>Stundenlohn <SortIcon field="hourlyWage" /></th>}
                  <th className="px-3 py-3 rounded-tr-lg cursor-pointer hover:bg-slate-700/50" onClick={() => handleSort('profit')}>Profit <SortIcon field="profit" /></th>
                </tr>
              </thead>
              <tbody>
                {filteredBikes.map((bike) => {
                  const expenses = bike.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                  const profit = bike.status === 'Verkauft' 
                    ? (bike.sellingPrice || 0) - bike.purchasePrice - expenses
                    : bike.status === 'Infrastruktur'
                      ? -(bike.purchasePrice + expenses)
                      : null;
                  
                  const targetProfit = (bike.sellingPrice || bike.targetSellingPrice || 0) - bike.purchasePrice - expenses;
                  const hourlyWage = bike.sellingPrice && bike.timeSpentSeconds > 0 
                    ? targetProfit / (bike.timeSpentSeconds / 3600) 
                    : null;
                  
                  const isBigWin = (hourlyWage && hourlyWage >= 50) || (profit && profit >= 200) || (bike.sellingPrice && bike.sellingPrice >= 500);

                  return (
                    <tr key={bike.id} className={`group border-b border-slate-800 transition-colors ${
                      isBigWin
                        ? 'bg-yellow-500/5 hover:bg-yellow-500/10' 
                        : 'hover:bg-slate-800/30'
                    }`}>
                      <td className={`px-2 py-2 sticky left-0 z-10 transition-colors border-r border-slate-700/50 max-w-[120px] md:max-w-none ${
                        isBigWin 
                          ? 'bg-slate-900 group-hover:bg-slate-800/80 shadow-[inset_4px_0_0_rgba(234,179,8,0.5)]' 
                          : 'bg-slate-900 group-hover:bg-slate-800/80'
                      }`}>
                        <div className="flex items-center space-x-1 relative w-full">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === bike.id ? null : bike.id)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === bike.id && (
                            <>
                              <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)}></div>
                              <div className="absolute left-0 top-8 z-10 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1">
                                <button 
                                  onClick={() => { setRenameBikeId(bike.id); setRenameValue(bike.name); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center"
                                >
                                  <Edit2 className="w-3 h-3 mr-2" /> Umbenennen
                                </button>
                                <button 
                                  onClick={() => { if(window.confirm('Fahrrad löschen?')) deleteBike(bike.id); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center"
                                >
                                  <Trash2 className="w-3 h-3 mr-2" /> Löschen
                                </button>
                              </div>
                            </>
                          )}
                          <button 
                            onClick={() => onNavigateToWorkshop(bike.id)}
                            className="font-medium text-slate-200 hover:text-orange-400 transition-colors text-left flex items-start truncate md:whitespace-nowrap md:overflow-visible"
                            title={bike.name}
                          >
                            <span className="truncate whitespace-normal text-xs md:text-sm md:whitespace-nowrap leading-tight line-clamp-2 md:line-clamp-none">{bike.name}</span>
                            {isBigWin && (
                              <Star className="w-3 h-3 ml-1 mt-0.5 shrink-0 text-yellow-500 fill-yellow-500" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={bike.status}
                          onChange={(e) => updateBike(bike.id, { status: e.target.value as BikeStatus })}
                          className={`h-8 px-2 rounded-md text-xs font-medium border-none focus:ring-2 focus:ring-orange-500 outline-none ${
                            bike.status === 'Zu reparieren' ? 'bg-red-500/20 text-red-400' :
                            bike.status === 'Inseriert' ? 'bg-blue-500/20 text-blue-400' :
                            bike.status === 'Verkauft' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          <option value="Zu reparieren" className="bg-slate-800 text-slate-200">Zu reparieren</option>
                          <option value="Inseriert" className="bg-slate-800 text-slate-200">Inseriert</option>
                          <option value="Verkauft" className="bg-slate-800 text-slate-200">Verkauft</option>
                          <option value="Infrastruktur" className="bg-slate-800 text-slate-200">Infrastruktur</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative w-32 h-8">
                          <Input 
                            type={bike.purchaseDate ? "date" : "text"}
                            value={bike.purchaseDate || ''} 
                            onChange={(e) => updateBike(bike.id, { purchaseDate: e.target.value })}
                            onFocus={(e) => {
                              e.target.type = "date";
                              try { (e.target as any).showPicker(); } catch (err) {}
                            }}
                            onBlur={(e) => {
                              if (!e.target.value) e.target.type = "text";
                            }}
                            placeholder="-"
                            className="absolute inset-0 h-full w-full bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-800 px-2 text-xs z-10"
                          />
                          {!bike.purchaseDate && (
                            <div 
                              className="absolute inset-0 z-20 cursor-pointer" 
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input) {
                                  input.focus();
                                }
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Input 
                          type="number"
                          value={bike.purchasePrice} 
                          onChange={(e) => updateBike(bike.id, { purchasePrice: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-20 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-800 px-2"
                        />
                      </td>
                      {tableViewMode === 'expanded' && (
                        <td className="px-3 py-2">
                          <span className="text-slate-300 px-2">{formatCurrency(expenses)}</span>
                        </td>
                      )}
                      {tableViewMode === 'expanded' && (
                        <td className="px-3 py-2">
                          <button 
                            onClick={() => {
                              setEditTimeBikeId(bike.id);
                              setEditHours(Math.floor(bike.timeSpentSeconds / 3600));
                              setEditMinutes(Math.floor((bike.timeSpentSeconds % 3600) / 60));
                            }}
                            className="text-slate-300 px-2 hover:text-orange-400 transition-colors"
                          >
                            {(bike.timeSpentSeconds / 3600).toFixed(1)}h
                          </button>
                        </td>
                      )}
                      {tableViewMode === 'expanded' && (
                        <td className="px-3 py-2">
                          <Input 
                            type="number"
                            value={bike.targetSellingPrice || ''} 
                            onChange={(e) => updateBike(bike.id, { targetSellingPrice: parseFloat(e.target.value) || null })}
                            className="h-8 w-20 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-800 px-2"
                            placeholder="-"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="relative w-32 h-8">
                          <Input 
                            type={bike.saleDate ? "date" : "text"}
                            value={bike.saleDate || ''} 
                            onChange={(e) => updateBike(bike.id, { saleDate: e.target.value || null })}
                            onFocus={(e) => {
                              e.target.type = "date";
                              try { (e.target as any).showPicker(); } catch (err) {}
                            }}
                            onBlur={(e) => {
                              if (!e.target.value) e.target.type = "text";
                            }}
                            placeholder="-"
                            className="absolute inset-0 h-full w-full bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-800 px-2 text-xs z-10"
                          />
                          {!bike.saleDate && (
                            <div 
                              className="absolute inset-0 z-20 cursor-pointer" 
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input) {
                                  input.focus();
                                }
                              }}
                            />
                          )}
                        </div>
                      </td>
                      {tableViewMode === 'expanded' && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-slate-300 px-2">
                            {bike.saleDate ? `${differenceInDays(parseISO(bike.saleDate), parseISO(bike.purchaseDate))} d` : '-'}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <Input 
                          type="number"
                          value={bike.sellingPrice || ''} 
                          onChange={(e) => updateBike(bike.id, { sellingPrice: parseFloat(e.target.value) || null })}
                          className={`h-8 w-20 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-800 px-2 font-medium ${
                            hourlyWage !== null 
                              ? hourlyWage >= 15 
                                ? 'text-emerald-400' 
                                : 'text-red-400'
                              : ''
                          }`}
                          placeholder="-"
                        />
                      </td>
                      {tableViewMode === 'expanded' && (
                        <td className={`px-3 py-2 font-medium ${
                          hourlyWage !== null 
                            ? hourlyWage >= 15 
                              ? 'text-emerald-400' 
                              : 'text-red-400' 
                            : 'text-slate-400'
                        }`}>
                          {hourlyWage !== null ? `${formatCurrency(hourlyWage)}/h` : '-'}
                        </td>
                      )}
                      <td className={`px-3 py-2 font-medium ${profit && profit > 0 ? 'text-emerald-400' : profit && profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {profit !== null ? formatCurrency(profit) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Gesamtumsatz</p>
              <h3 className="text-2xl font-bold text-slate-100">{formatCurrency(totalUmsatz)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-500/20 rounded-lg text-orange-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Gesamtgewinn</p>
              <h3 className="text-2xl font-bold text-slate-100">{formatCurrency(totalProfit)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Ø Stundenlohn</p>
              <h3 className="text-2xl font-bold text-slate-100">{formatCurrency(avgHourlyWage)}/h</h3>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsTiedCapitalExpanded(!isTiedCapitalExpanded)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Gebundenes Kapital</p>
                  <h3 className="text-2xl font-bold text-slate-100">{formatCurrency(tiedCapital)}</h3>
                </div>
              </div>
              {isTiedCapitalExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </div>
            
            {isTiedCapitalExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-1">
                {activeBikesWithCapital.map(bike => (
                  <div 
                    key={bike.id} 
                    className="flex justify-between items-center text-sm hover:bg-slate-700/50 p-2 -mx-2 rounded cursor-pointer transition-colors group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToWorkshop(bike.id);
                    }}
                  >
                    <span className="text-slate-300 truncate pr-2 group-hover:text-blue-400 transition-colors">{bike.name}</span>
                    <span className="text-slate-100 font-medium whitespace-nowrap">{formatCurrency(bike.tiedCapital)}</span>
                  </div>
                ))}
                {activeBikesWithCapital.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">Kein gebundenes Kapital.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold">Auswertung</h2>
          <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
            {(['day', 'week', 'month', 'year'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  timeframe === tf ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'day' ? 'Tage' : tf === 'week' ? 'Wochen' : tf === 'month' ? 'Monate' : 'Jahre'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-200 text-center">Stundenlohn</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[250px]">
                <Line data={stundenlohnChartData} options={commonOptions} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-200 text-center">Gesamtgewinn</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[250px]">
                <Line data={gesamtGewinnChartData} options={commonOptions} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-200 text-center">
                Gewinn / {timeframe === 'day' ? 'Tag' : timeframe === 'week' ? 'Woche' : timeframe === 'month' ? 'Monat' : 'Jahr'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[250px]">
                <Line data={gewinnPeriodeChartData} options={commonOptions} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-200 text-center">
                Invest / Umsatz
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[250px]">
                <Line data={investUmsatzChartData} options={commonOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Bike Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <CardHeader>
              <CardTitle>Neues Fahrrad hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Name / Modell</label>
                <Input 
                  placeholder="z.B. Trek Marlin 7" 
                  value={newBikeData.name}
                  onChange={(e) => setNewBikeData({...newBikeData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Einkaufspreis (€)</label>
                  <Input 
                    type="number"
                    value={newBikeData.purchasePrice || ''}
                    onChange={(e) => setNewBikeData({...newBikeData, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Ziel VK (€)</label>
                  <Input 
                    type="number"
                    value={newBikeData.targetSellingPrice || ''}
                    onChange={(e) => setNewBikeData({...newBikeData, targetSellingPrice: parseFloat(e.target.value) || 0})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Einkaufsdatum</label>
                <div className="relative">
                  <Input 
                    type={newBikeData.purchaseDate ? "date" : "text"}
                    value={newBikeData.purchaseDate || ''}
                    onChange={(e) => setNewBikeData({...newBikeData, purchaseDate: e.target.value})}
                    onFocus={(e) => {
                      e.target.type = "date";
                      try { (e.target as any).showPicker(); } catch (err) {}
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    placeholder="-"
                    className="bg-slate-800 border-slate-700 relative z-10"
                  />
                  {!newBikeData.purchaseDate && (
                    <div 
                      className="absolute inset-0 z-20 cursor-pointer" 
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input) {
                          input.focus();
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleAddBikeSubmit} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Edit Time Modal */}
      {editTimeBikeId && (
        <div className="fixed inset-0 z-50 flex justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <CardHeader>
              <CardTitle>Zeit anpassen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Stunden</label>
                  <Input 
                    type="number"
                    value={editHours}
                    onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Minuten</label>
                  <Input 
                    type="number"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Oder Gesamtminuten</label>
                <Input 
                  type="number"
                  placeholder="Gesamtminuten..."
                  onChange={(e) => {
                    const totalMins = parseInt(e.target.value) || 0;
                    setEditHours(Math.floor(totalMins / 60));
                    setEditMinutes(totalMins % 60);
                  }}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="text-xs text-slate-500 italic">
                Entspricht {(editHours + editMinutes / 60).toFixed(2)} Dezimalstunden
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setEditTimeBikeId(null)}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={() => {
                    const totalSeconds = (editHours * 3600) + (editMinutes * 60);
                    updateBike(editTimeBikeId, { timeSpentSeconds: totalSeconds });
                    setEditTimeBikeId(null);
                  }} 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Rename Bike Modal */}
      {renameBikeId && (
        <div className="fixed inset-0 z-50 flex justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <CardHeader>
              <CardTitle>Fahrrad umbenennen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Neuer Name</label>
                <Input 
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim()) {
                      updateBike(renameBikeId, { name: renameValue.trim() });
                      setRenameBikeId(null);
                    }
                  }}
                  className="bg-slate-800 border-slate-700"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setRenameBikeId(null)}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={() => {
                    if (renameValue.trim()) {
                      updateBike(renameBikeId, { name: renameValue.trim() });
                      setRenameBikeId(null);
                    }
                  }} 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
