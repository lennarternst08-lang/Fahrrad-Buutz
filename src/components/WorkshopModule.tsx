import React, { useState, useEffect, useRef } from 'react';
import { Bike, Expense, ChecklistItem, WorkLog } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatTime, formatCurrency } from '../lib/utils';
import { Play, Pause, RotateCcw, Plus, Camera, CheckSquare, Wrench, Trash2, CheckCircle2, Circle, Undo2, Search, Eye, X, Clock } from 'lucide-react';

interface WorkshopModuleProps {
  bikes: Bike[];
  updateBike: (id: string, updates: Partial<Bike>) => void;
  activeBikeId: string | null;
  setActiveBikeId: (id: string | null) => void;
  addLog: (message: string, module: 'tracking' | 'workshop' | 'stopwatch' | 'system', revertAction?: any) => void;
}

export function WorkshopModule({ bikes, updateBike, activeBikeId, setActiveBikeId, addLog }: WorkshopModuleProps) {
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
  const [lastResetTime, setLastResetTime] = useState<{ time: number, workLogs: WorkLog[] } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expense state
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Checklist state
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Notes state
  const [notes, setNotes] = useState(activeBike?.notes || '');

  // Photo preview state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync time when active bike changes or on mount
  useEffect(() => {
    const syncTimer = () => {
      if (activeBike) {
        let currentTime = activeBike.timeSpentSeconds || 0;
        let running = false;
        
        try {
          // Check local storage first for a more up-to-date "active" timer (in case of offline/background)
          const localTimerJson = localStorage.getItem('flipbike_active_timer');
          if (localTimerJson) {
            const localTimer = JSON.parse(localTimerJson);
            if (localTimer && localTimer.bikeId === activeBike.id) {
              const elapsedSeconds = Math.floor((Date.now() - localTimer.startTime) / 1000);
              currentTime = (localTimer.initialTime || 0) + elapsedSeconds;
              running = true;
            }
          } else if (activeBike.startTime) {
            // Fallback to DB startTime if no local timer exists
            const elapsedSeconds = Math.floor((Date.now() - activeBike.startTime) / 1000);
            currentTime += elapsedSeconds;
            running = true;
          }
        } catch (e) {
          console.error("Error syncing timer from localStorage:", e);
          localStorage.removeItem('flipbike_active_timer');
        }
        
        setTime(currentTime);
        setNotes(activeBike.notes || '');
        setIsRunning(running);
      }
    };

    syncTimer();

    // Handle visibility change (e.g. returning from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeBikeId, activeBike?.timeSpentSeconds, activeBike?.startTime]);

  // Timer logic (UI only)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        // Recalculate from start time to avoid drift and background issues
        if (activeBike) {
          const localTimerJson = localStorage.getItem('flipbike_active_timer');
          if (localTimerJson) {
            const localTimer = JSON.parse(localTimerJson);
            const elapsedSeconds = Math.floor((Date.now() - localTimer.startTime) / 1000);
            setTime(localTimer.initialTime + elapsedSeconds);
          } else if (activeBike.startTime) {
            const elapsedSeconds = Math.floor((Date.now() - activeBike.startTime) / 1000);
            setTime(activeBike.timeSpentSeconds + elapsedSeconds);
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activeBikeId, activeBike?.startTime]);

  const toggleTimer = () => {
    if (!activeBike) return;
    
    if (isRunning) {
      // Stop timer
      setIsRunning(false);
      const now = Date.now();
      
      // Get the actual elapsed time from the start timestamp
      let elapsed = 0;
      let totalTime = time;
      
      const localTimerJson = localStorage.getItem('flipbike_active_timer');
      if (localTimerJson) {
        const localTimer = JSON.parse(localTimerJson);
        elapsed = Math.floor((now - localTimer.startTime) / 1000);
        totalTime = localTimer.initialTime + elapsed;
      } else if (activeBike.startTime) {
        elapsed = Math.floor((now - activeBike.startTime) / 1000);
        totalTime = activeBike.timeSpentSeconds + elapsed;
      }

      const newWorkLog: WorkLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        durationSeconds: elapsed
      };

      // Clear local timer immediately
      localStorage.removeItem('flipbike_active_timer');

      try {
        updateBike(activeBike.id, { 
          timeSpentSeconds: totalTime,
          startTime: null,
          workLogs: [...(activeBike.workLogs || []), newWorkLog]
        });
        
        const startStr = activeBike.startTime ? new Date(activeBike.startTime).toLocaleTimeString('de-DE') : 'unbekannt';
        addLog(`Stoppuhr gestoppt für "${activeBike.name}". Gestartet um ${startStr}. Dauer: ${formatTime(elapsed)}.`, 'stopwatch');
      } catch (error) {
        console.error("Failed to stop timer in DB:", error);
        // Persistence is enabled, so Firestore will handle the sync when online.
        // But we already updated the local state via updateBike (if it's optimistic).
      }
    } else {
      // Start timer
      setIsRunning(true);
      const now = Date.now();
      
      // Store in local storage for background/offline survival
      localStorage.setItem('flipbike_active_timer', JSON.stringify({
        bikeId: activeBike.id,
        startTime: now,
        initialTime: activeBike.timeSpentSeconds
      }));

      try {
        updateBike(activeBike.id, {
          startTime: now
        });
        addLog(`Stoppuhr gestartet für "${activeBike.name}" um ${new Date(now).toLocaleTimeString('de-DE')}.`, 'stopwatch');
      } catch (error) {
        console.error("Failed to start timer in DB:", error);
      }
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
      date: new Date().toISOString(),
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
      const diff = newTime - currentTime;
      
      let updatedWorkLogs = [...(activeBike.workLogs || [])];
      
      if (diff !== 0) {
        if (diff < 0) {
          // Reduce from the last workLog(s)
          let remainingDiff = Math.abs(diff);
          for (let i = updatedWorkLogs.length - 1; i >= 0; i--) {
            if (updatedWorkLogs[i].durationSeconds >= remainingDiff) {
              updatedWorkLogs[i] = { ...updatedWorkLogs[i], durationSeconds: updatedWorkLogs[i].durationSeconds - remainingDiff };
              remainingDiff = 0;
              break;
            } else {
              remainingDiff -= updatedWorkLogs[i].durationSeconds;
              updatedWorkLogs[i] = { ...updatedWorkLogs[i], durationSeconds: 0 };
            }
          }
          // Filter out 0 duration logs
          updatedWorkLogs = updatedWorkLogs.filter(log => log.durationSeconds > 0);
        } else {
          // Add a new workLog for the added time
          updatedWorkLogs.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            durationSeconds: diff
          });
        }
      }

      updateBike(activeBike.id, { 
        timeSpentSeconds: newTime,
        workLogs: updatedWorkLogs,
        ...(isRunning ? { startTime: Date.now() } : {})
      });
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

  const handleChecklistPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n') || pastedText.includes('\\')) {
      e.preventDefault();
      
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      
      const textBefore = newChecklistItem.substring(0, start);
      const textAfter = newChecklistItem.substring(end);
      
      const fullText = textBefore + pastedText + textAfter;
      const lines = fullText.split(/[\n\\]/).map(line => line.trim()).filter(line => line !== '');
      
      if (lines.length > 0 && activeBike) {
        const newItems: ChecklistItem[] = lines.map(line => ({
          id: Math.random().toString(36).substr(2, 9),
          text: line,
          completed: false,
        }));
        
        updateBike(activeBike.id, {
          checklist: [...(activeBike.checklist || []), ...newItems],
        });
        
        setNewChecklistItem('');
      }
    }
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
    
    const files = Array.from(e.target.files) as File[];
    const newPhotos: string[] = [];
    let processedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        newPhotos.push(base64String);
        processedCount++;

        if (processedCount === files.length) {
          updateBike(activeBike.id, {
            photos: [...(activeBike.photos || []), ...newPhotos]
          });
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (index: number) => {
    if (!activeBike) return;
    const updatedPhotos = [...(activeBike.photos || [])];
    updatedPhotos.splice(index, 1);
    updateBike(activeBike.id, { photos: updatedPhotos });
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
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Stoppuhr
              </CardTitle>
              <div className="flex items-center space-x-2">
                {!isOnline && (
                  <span className="flex items-center text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5 animate-pulse" />
                    Offline Modus
                  </span>
                )}
                {isOnline && (
                  <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5" />
                    Synchronisiert
                  </span>
                )}
              </div>
            </CardHeader>
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
                      setLastResetTime({ time: prev, workLogs: activeBike.workLogs || [] });
                      updateBike(activeBike.id, { 
                        timeSpentSeconds: 0,
                        workLogs: [],
                        ...(isRunning ? { startTime: Date.now() } : {})
                      });
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
                      setTime(lastResetTime.time);
                      updateBike(activeBike.id, { 
                        timeSpentSeconds: lastResetTime.time,
                        workLogs: lastResetTime.workLogs,
                        ...(isRunning ? { startTime: Date.now() } : {})
                      });
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

              {/* Work Logs List */}
              <div className="w-full mt-8 border-t border-slate-800 pt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Arbeits-Protokoll</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {isRunning && activeBike.startTime && (
                    <div className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-sm text-orange-400">
                          Stoppuhr um {new Date(activeBike.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} gestartet
                        </span>
                      </div>
                      <span className="text-xs text-orange-500/70 italic">nicht synchronisiert</span>
                    </div>
                  )}
                  {(!activeBike.workLogs || activeBike.workLogs.length === 0) && !isRunning ? (
                    <p className="text-sm text-slate-500 text-center py-2">Noch keine Zeiten erfasst</p>
                  ) : (
                    [...(activeBike.workLogs || [])].reverse().map(log => (
                      <div key={log.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors group">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-300">
                            {new Date(log.timestamp).toLocaleDateString('de-DE')} {new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-mono text-slate-400">
                            {formatTime(log.durationSeconds)}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm('Möchtest du diesen Eintrag wirklich löschen? Die Zeit wird von der Gesamtzeit abgezogen.')) {
                                const updatedWorkLogs = activeBike.workLogs!.filter(l => l.id !== log.id);
                                updateBike(activeBike.id, {
                                  workLogs: updatedWorkLogs,
                                  timeSpentSeconds: Math.max(0, activeBike.timeSpentSeconds - log.durationSeconds)
                                });
                                // Update local time state if not running
                                if (!isRunning) {
                                  setTime(Math.max(0, activeBike.timeSpentSeconds - log.durationSeconds));
                                }
                              }
                            }}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eintrag löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                  onPaste={handleChecklistPaste}
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
                  <div key={exp.id} className="flex flex-col p-2 rounded bg-slate-800/50 text-sm group">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 truncate pr-2 font-medium">{exp.description}</span>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-100 whitespace-nowrap">{formatCurrency(exp.amount)}</span>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-slate-500 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(exp.date).toLocaleString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                multiple
              />
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button 
                  variant="outline" 
                  className="border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 h-24 flex-col gap-2"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture');
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Upload</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 h-24 flex-col gap-2"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment');
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Kamera</span>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {activeBike.photos.map((url, i) => (
                  <div key={i} className="group relative aspect-square rounded-md bg-slate-800 overflow-hidden border border-slate-700">
                    <img 
                      src={url} 
                      alt={`Bike photo ${i+1}`} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer" 
                      onClick={() => setSelectedPhoto(url)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedPhoto(url)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePhoto(i)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Preview Modal */}
          {selectedPhoto && (
            <div 
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8"
              onClick={() => setSelectedPhoto(null)}
            >
              <button 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={selectedPhoto} 
                alt="Vorschau" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

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
