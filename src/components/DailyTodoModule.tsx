import React, { useState } from 'react';
import { DailyTodo, Bike } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, CheckCircle2, Circle, Trash2, ArrowLeft, Bike as BikeIcon } from 'lucide-react';

interface DailyTodoModuleProps {
  todos: DailyTodo[];
  addTodo: (text: string, linkedBikeId?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  bikes: Bike[];
  onNavigateBack: () => void;
  onNavigateToBike: (bikeId: string) => void;
  addLog: (message: string, module: 'tracking' | 'workshop' | 'stopwatch' | 'system', revertAction?: any) => void;
}

export function DailyTodoModule({ todos, addTodo, toggleTodo, deleteTodo, bikes, onNavigateBack, onNavigateToBike, addLog }: DailyTodoModuleProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const [showBikeSuggestions, setShowBikeSuggestions] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | undefined>(undefined);

  // Filter bikes that are not sold
  const activeBikes = bikes.filter(b => b.status !== 'Verkauft');

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTodoText.trim()) return;
    addTodo(newTodoText, selectedBikeId);
    setNewTodoText('');
    setSelectedBikeId(undefined);
    setShowBikeSuggestions(false);
  };

  const handleToggleTodo = (id: string) => {
    toggleTodo(id);
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo(id);
  };

  // Auto-suggest bike based on text input
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewTodoText(text);
    
    if (text.length > 2) {
      const match = activeBikes.find(b => b.name.toLowerCase().includes(text.toLowerCase()));
      if (match && !selectedBikeId) {
        setShowBikeSuggestions(true);
      } else {
        setShowBikeSuggestions(false);
      }
    } else {
      setShowBikeSuggestions(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-bold">Daily To-Do</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Aufgabe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Was steht heute an? (z.B. Cube putzen)"
                value={newTodoText}
                onChange={handleTextChange}
                className="flex-1"
              />
              <Button type="submit">
                <Plus className="w-5 h-5 mr-1" /> Hinzufügen
              </Button>
            </div>
            
            {showBikeSuggestions && (
              <div className="p-3 bg-slate-800 rounded-md border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Fahrrad verknüpfen?</p>
                <div className="flex flex-wrap gap-2">
                  {activeBikes.filter(b => b.name.toLowerCase().includes(newTodoText.toLowerCase())).map(bike => (
                    <button
                      key={bike.id}
                      type="button"
                      onClick={() => {
                        setSelectedBikeId(bike.id);
                        setShowBikeSuggestions(false);
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-200 flex items-center"
                    >
                      <BikeIcon className="w-3 h-3 mr-1" />
                      {bike.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedBikeId && (
              <div className="flex items-center text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-md w-fit">
                <BikeIcon className="w-4 h-4 mr-2" />
                Verknüpft: {bikes.find(b => b.id === selectedBikeId)?.name}
                <button 
                  type="button"
                  onClick={() => setSelectedBikeId(undefined)}
                  className="ml-2 text-slate-400 hover:text-slate-200"
                >
                  &times;
                </button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aufgaben ({todos.filter(t => !t.completed).length} offen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Keine Aufgaben für heute. Zeit zum Schrauben!</p>
            ) : (
              todos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    todo.completed ? 'bg-slate-800/30 border-slate-800/50' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <button onClick={() => handleToggleTodo(todo.id)} className="text-slate-400 hover:text-orange-500 transition-colors">
                      {todo.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex flex-col">
                      <span className={`text-sm md:text-base ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {todo.text}
                      </span>
                      {todo.linkedBikeId && (
                        <button 
                          onClick={() => onNavigateToBike(todo.linkedBikeId!)}
                          className="text-xs text-orange-500 hover:underline flex items-center mt-1 w-fit"
                        >
                          <BikeIcon className="w-3 h-3 mr-1" />
                          {bikes.find(b => b.id === todo.linkedBikeId)?.name || 'Unbekanntes Rad'}
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTodo(todo.id)} className="text-slate-500 hover:text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
