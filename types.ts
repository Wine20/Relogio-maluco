// Fix: Define the types used throughout the application.
export interface Player {
  id: string;
  name: string;
  betTime: string; // "HH:mm"
  betAmount: number;
  isHuman: boolean;
}

export interface Winner {
  player: Player;
  difference: number; // in minutes
}

export enum GameStatus {
  Waiting = 'WAITING',
  Running = 'RUNNING',
  Finished = 'FINISHED',
}

export interface User {
    name: string;
    email: string;
    phone: string;
    balance: number;
}

export interface BetHistoryEntry {
    id: string;
    timestamp: string;
    betTime: string;
    betAmount: number;
    winningTime: string;
    outcome: 'win' | 'loss';
    prize: number;
}