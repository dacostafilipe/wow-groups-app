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
  fallbackRole?: Role;
  ilvl: number;
  rating: number;
}

export interface Group {
  id: string;
  players: Player[];
}

export interface Session {
  players: Player[];
  groups: Group[];
  bench: Player[];
  runCount: number;
  // history: set of sorted "playerA:playerB" pairs that have played together
  history: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
}
