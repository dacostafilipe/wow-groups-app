export type Role = 'tank' | 'healer' | 'dps';

export type WowClass =
  | 'DeathKnight'
  | 'DemonHunter'
  | 'Druid'
  | 'Evoker'
  | 'Hunter'
  | 'Mage'
  | 'Monk'
  | 'Paladin'
  | 'Priest'
  | 'Rogue'
  | 'Shaman'
  | 'Warlock'
  | 'Warrior';

export interface Player {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  role: Role;
  ilvl: number;
  rating: number;
}

export interface Group {
  id: string;
  players: Player[];
}

export type ActivityEventType = 'run_started' | 'reshuffled';

export interface ActivityEvent {
  type: ActivityEventType;
  runCount: number;
  timestamp: number; // Date.now()
  dungeon?: string;  // set when type === 'run_started'
}

export interface Session {
  players: Player[];
  groups: Group[];
  bench: Player[];
  runCount: number;
  history: string[];
  activityLog: ActivityEvent[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
}
