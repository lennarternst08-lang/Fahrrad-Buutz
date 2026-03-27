import React, { useState, useEffect, useRef } from 'react';
import { Bike, Expense, ChecklistItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatTime, formatCurrency } from '../lib/utils';
import { Play, Pause, RotateCcw, Plus, Camera, CheckSquare, Wrench, Trash2, CheckCircle2, Circle, Undo2, Search } from 'lucide-react';

interface WorkshopModuleProps {
  bikes: Bike[];
  updateBike: (id: string, updates: Partial<Bike>) => void;
  activeBikeId: string | null;
  setActiveBikeId: (id: string | null) => void;
}

export function WorkshopModule({ bikes, updateBike, activeBikeId, setActiveBikeId }: WorkshopModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeProjects = bikes
    .filter((b) => b.status === 'Zu reparieren')
    .sort((a, b) => {
      // Primary: Purchase Date (Newest first)
      const dateA = a.purchaseDate || '';
      const dateB = b.purchaseDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      
      // Secondary: Last Modified (Newest first)
      return (b.lastModified || 0) - (a.lastModified || 0);
    });

  const filteredProjects = activeProjects.filter(bike => 
    bike.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  useEffect(() => {
    if (!activeBikeId && filteredProjects.length > 0) {
      setActiveBikeId(filteredProjects[0].id);
    }
  }, [filteredProjects, activeBikeId, setActiveBikeId]);

  const activeBike = bikes.find((b) => b.id === activeBikeId);

  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [manualTime, setManualTime] = useState('');
  const [lastResetTime, setLastResetTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expense state
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Checklist state
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Notes state
  const [notes, setNotes] = useState(activeBike?.notes || '');

  // Sync time when active bike changes
  useEffect(() => {
    if (activeBike) {
      let currentTime = activeBike.timeSpentSeconds;
      let running = false;
      
      if (activeBike.startTime) {
        // Calculate elapsed time since it was started
        const elapsedSeconds = Math.floor((Date.now() - activeBike.startTime) / 1000);
        currentTime += elapsedSeconds;
        running = true;
      }
      
      setTime(currentTime);
      setNotes(activeBike.notes);
      setIsRunning(running);
    }
  }, [activeBikeId, activeBike?.timeSpentSeconds, activeBike?.startTime]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          // Save to parent state every 30 seconds to prevent data loss
          if (newTime % 30 === 0 && activeBikeId) {
            updateBike(activeBikeId, { timeSpentSeconds: newTime });
          }
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeBikeId, updateBike]);

  const toggleTimer = () => {
    if (!activeBike) return;
    
    if (isRunning) {
      // Stop timer
      setIsRunning(false);
      setTime((currentTime) => {
        updateBike(activeBike.id, { 
          timeSpentSeconds: currentTime,
          startTime: undefined 
        });
        return currentTime;
      });
    } else {
      // Start timer
      setIsRunning(true);
      updateBike(activeBike.id, {
        startTime: Date.now()
      });
    }
  };

  // Sync notes to DB on blur or change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (activeBike) {
      updateBike(activeBike.id, { notes: e.target.value });
    }
  };

  const handleAddExpense = () => {
    if (!activeBike || !expenseDesc || !expenseAmount) return;
    const amount = parseFloat(expenseAmount.replace(',', '.'));
    if (isNaN(amount)) return;

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: expenseDesc,
      amount,
      date: new Date().toISOString().split('T')[0],
    };

    updateBike(activeBike.id, {
      expenses: [...activeBike.expenses, newExpense],
    });
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeBike) return;
    const updatedExpenses = activeBike.expenses.filter(exp => exp.id !== expenseId);
    updateBike(activeBike.id, { expenses: updatedExpenses });
  };

  const handleManualTimeAdjust = () => {
    if (!activeBike || !manualTime) return;
    const minutes = parseInt(manualTime, 10);
    if (isNaN(minutes)) return;
    
    setTime((currentTime) => {
      const newTime = Math.max(0, currentTime + minutes * 60);
      updateBike(activeBike.id, { timeSpentSeconds: newTime });
      return newTime;
    });
    setManualTime('');
  };

  const handleAddChecklistItem = () => {
    if (!activeBike || !newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem,
      completed: false,
    };
    updateBike(activeBike.id, {
      checklist: [...(activeBike.checklist || []), newItem],
    });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!activeBike) return;
    const updatedChecklist = activeBike.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateBike(activeBike.id, { checklist: updatedChecklist });
  };

  const deleteChecklistItem = (itemId: string) => {
    if (!activeBike) return;
    const updatedChecklist = activeBike.checklist.filter(item => item.id !== itemId);
    updateBike(activeBike.id, { checklist: updatedChecklist });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeBike || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateBike(activeBike.id, {
        photos: [...(activeBike.photos || []), base64String]
      });
    };
    
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!activeBike) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Wrench className="w-12 h-12 mb-4 opacity-50" />
        <p>Keine aktiven Projekte in der Werkstatt.</p>
      </div>
    );
  }

  const totalExpenses = activeBike.expenses.reduce((sum, e) => sum + e.amount, 0);
  const targetProfit = activeBike.targetSellingPrice 
    ? activeBike.targetSellingPrice - activeBike.purchasePrice - totalExpenses 
    : 0;
  const currentHourlyWage = time > 0 && targetProfit > 0 
    ? targetProfit / (time / 3600) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Search and Quick-Switch Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Projekt suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 focus:ring-orange-500/50"
          />
        </div>

        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar space-x-2">
          {filteredProjects.map((bike) => (
            <button
              key={bike.id}
              onClick={() => setActiveBikeId(bike.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeBikeId === bike.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {bike.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workspace Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stopwatch Module */}
          <Card className="border-orange-500/20 bg-gradient-to-b from-slate-900 to-slate-900/50">
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className="text-6xl md:text-8xl font-mono font-bold text-slate-100 tracking-tighter mb-8 tabular-nums">
                {formatTime(time)}
              </div>
              <div className="flex items-center space-x-4 mb-8">
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full border-slate-700 hover:bg-slate-800"
                  onClick={() => {
                    setTime((prev) => {
                      setLastResetTime(prev);
                      updateBike(activeBike.id, { timeSpentSeconds: 0 });
                      return 0;
                    });
                  }}
                  title="Zurücksetzen"
                >
                  <RotateCcw className="w-6 h-6 text-slate-400" />
                </Button>
                <Button
                  size="icon"
                  className={`w-20 h-20 rounded-full shadow-lg transition-transform active:scale-95 ${
                    isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  onClick={toggleTimer}
                >
                  {isRunning ? (
                    <Pause className="w-8 h-8 text-white fill-current" />
                  ) : (
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  )}
                </Button>
                {lastResetTime !== null ? (
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-14 h-14 rounded-full border-orange-500/50 hover:bg-orange-500/10 text-orange-400"
                    onClick={() => {
                      setTime(lastResetTime);
                      updateBike(activeBike.id, { timeSpentSeconds: lastResetTime });
                      setLastResetTime(null);
                    }}
                    title="Rückgängig machen"
                  >
                    <Undo2 className="w-6 h-6" />
                  </Button>
                ) : (
                  <div className="w-14 h-14" />
                )}
              </div>
              
              <div className="flex items-center space-x-2 w-full max-w-xs">
                <Input
                  type="number"
                  placeholder="+/- Min"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="text-center"
                />
                <Button variant="secondary" onClick={handleManualTimeAdjust}>
                  Korr.
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <CheckSquare className="w-5 h-5 mr-2 text-orange-500" />
                Checkliste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Neuer Punkt..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleAddChecklistItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {activeBike.checklist?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 group">
                    <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => toggleChecklistItem(item.id)}>
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.text}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteChecklistItem(item.id)}
                      className="text-slate-500 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* To-Do / Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Notizen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-md p-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Zusätzliche Notizen..."
                value={notes}
                onChange={handleNotesChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Material Costs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Materialkosten</span>
                <span className="text-orange-500 font-bold">
                  {formatCurrency(totalExpenses)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Teil (z.B. Kassette)"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="€"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-20"
                />
                <Button size="icon" onClick={handleAddExpense}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {activeBike.expenses.map((exp) => (
                  <div key={exp.id} className="flex justify-between items-center p-2 rounded bg-slate-800/50 text-sm group">
                    <span className="text-slate-300 truncate pr-2">{exp.description}</span>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-slate-200 whitespace-nowrap">{formatCurrency(exp.amount)}</span>
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-500 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {activeBike.expenses.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">Noch keine Ausgaben erfasst.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Camera / Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Camera className="w-5 h-5 mr-2 text-orange-500" />
                Fotos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
              />
              <Button 
                variant="outline" 
                className="w-full mb-4 border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Foto hinzufügen
              </Button>
              <div className="grid grid-cols-3 gap-2">
                {activeBike.photos.map((url, i) => (
                  <div key={i} className="aspect-square rounded-md bg-slate-800 overflow-hidden border border-slate-700">
                    <img src={url} alt={`Bike photo ${i+1}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats (Small Footer) */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 text-sm space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Ankaufspreis:</span>
              <span className="text-slate-200">{formatCurrency(activeBike.purchasePrice)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Bisherige Stunden:</span>
              <span className="text-slate-200">{(time / 3600).toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Angepeilter VK:</span>
              <span className="text-slate-200">{activeBike.targetSellingPrice ? formatCurrency(activeBike.targetSellingPrice) : '-'}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between font-medium">
              <span className="text-slate-300">Aktueller Stundenlohn:</span>
              <span className={currentHourlyWage > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                {currentHourlyWage > 0 ? `${formatCurrency(currentHourlyWage)}/h` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
