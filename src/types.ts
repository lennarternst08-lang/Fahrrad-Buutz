export type BikeStatus = 'Zu reparieren' | 'Inseriert' | 'Verkauft' | 'Infrastruktur';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Bike {
  id: string;
  name: string;
  status: BikeStatus;
  purchasePrice: number;
  purchaseDate: string;
  sellingPrice: number | null;
  saleDate: string | null;
  targetSellingPrice: number | null;
  timeSpentSeconds: number;
  startTime?: number; // For offline stopwatch tracking
  lastModified: number; // For sorting in workshop
  expenses: Expense[];
  checklist: ChecklistItem[];
  notes: string;
  photos: string[];
}

export interface DailyTodo {
  id: string;
  text: string;
  completed: boolean;
  linkedBikeId?: string;
}

export interface Log {
  id: string;
  timestamp: number;
  message: string;
  revertAction?: {
    type: 'add' | 'delete' | 'update';
    data: any;
  };
}
