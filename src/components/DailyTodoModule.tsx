import React, { useState } from 'react';
import { DailyTodo, Bike, ServiceRequest } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, CheckCircle2, Circle, Trash2, ArrowLeft, Bike as BikeIcon, Users, Clock, Wrench } from 'lucide-react';

interface DailyTodoModuleProps {
  todos: DailyTodo[];
  addTodo: (text: string, linkedBikeId?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  bikes: Bike[];
  onNavigateBack: () => void;
  onNavigateToBike: (bikeId: string) => void;
  addLog: (message: string, module: 'tracking' | 'workshop' | 'stopwatch' | 'system', revertAction?: any) => void;
  serviceRequests: ServiceRequest[];
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'userId'>) => void;
  updateServiceRequest: (id: string, updates: Partial<ServiceRequest>) => void;
  deleteServiceRequest: (id: string) => void;
}

export function DailyTodoModule({ 
  todos, addTodo, toggleTodo, deleteTodo, bikes, onNavigateBack, onNavigateToBike, addLog,
  serviceRequests, addServiceRequest, updateServiceRequest, deleteServiceRequest
}: DailyTodoModuleProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const [showBikeSuggestions, setShowBikeSuggestions] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | undefined>(undefined);

  // Service Manager State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceIssue, setNewServiceIssue] = useState('');
  const [newServiceDropoff, setNewServiceDropoff] = useState('');

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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('\n') || pastedText.includes('\\')) {
      e.preventDefault();
      
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      
      const textBefore = newTodoText.substring(0, start);
      const textAfter = newTodoText.substring(end);
      
      const fullText = textBefore + pastedText + textAfter;
      const lines = fullText.split(/[\n\\]/).map(line => line.trim()).filter(line => line !== '');
      
      if (lines.length > 0) {
        lines.forEach(line => {
          addTodo(line, selectedBikeId);
        });
        setNewTodoText('');
        setShowBikeSuggestions(false);
      }
    }
  };

  const handleAddServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceIssue.trim()) return;
    
    addServiceRequest({
      name: newServiceName,
      issue: newServiceIssue,
      dropoffTime: newServiceDropoff,
      status: 'Ausstehend'
    });
    
    setNewServiceName('');
    setNewServiceIssue('');
    setNewServiceDropoff('');
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
                onPaste={handlePaste}
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

      {/* Service Manager */}
      <div className="flex items-center space-x-4 mt-8 mb-4">
        <Users className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Service Manager</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neue Anfrage</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddServiceRequest} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Name (z.B. Nachbar Müller)"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              required
            />
            <Input
              placeholder="Anliegen (z.B. Platter Reifen)"
              value={newServiceIssue}
              onChange={(e) => setNewServiceIssue(e.target.value)}
              required
            />
            <Input
              placeholder="Bring-Zeit (z.B. Heute 18:00)"
              value={newServiceDropoff}
              onChange={(e) => setNewServiceDropoff(e.target.value)}
            />
            <Button type="submit" className="w-full">
              <Plus className="w-5 h-5 mr-1" /> Eintragen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktuelle Service-Aufträge ({serviceRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRequests.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Keine aktiven Service-Anfragen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Status</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Anliegen</th>
                    <th className="px-4 py-3">Bring-Zeit</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <select
                          value={request.status}
                          onChange={(e) => updateServiceRequest(request.id, { status: e.target.value as ServiceRequest['status'] })}
                          className={`bg-slate-900 border border-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2 ${
                            request.status === 'Fertig' ? 'text-emerald-500' : 
                            request.status === 'In Bearbeitung' ? 'text-orange-500' : 
                            request.status === 'Abgeholt' ? 'text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <option value="Ausstehend">Ausstehend</option>
                          <option value="Angenommen">Angenommen</option>
                          <option value="In Bearbeitung">In Bearbeitung</option>
                          <option value="Fertig">Fertig</option>
                          <option value="Abgeholt">Abgeholt</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">{request.name}</td>
                      <td className="px-4 py-3 text-slate-300">{request.issue}</td>
                      <td className="px-4 py-3 text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {request.dropoffTime || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => deleteServiceRequest(request.id)} 
                          className="text-slate-500 hover:text-red-500 p-2"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
