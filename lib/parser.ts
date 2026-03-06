import { v4 as uuidv4 } from 'uuid';
import { Player, WowClass } from './types';
import { getRoleFromSpec } from '@/data/wow';

export interface ParseResult {
  players: Player[];
  errors: Array<{ line: number; raw: string; reason: string }>;
}

const VALID_CLASSES: WowClass[] = [
  'DeathKnight',
  'DemonHunter',
  'Druid',
  'Evoker',
  'Hunter',
  'Mage',
  'Monk',
  'Paladin',
  'Priest',
  'Rogue',
  'Shaman',
  'Warlock',
  'Warrior',
];

export function parseRosterText(text: string): ParseResult {
  const players: Player[] = [];
  const errors: ParseResult['errors'] = [];

  const lines = text.split('\n');

  lines.forEach((raw, idx) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const parts = trimmed.split('|');
    if (parts.length < 5) {
      errors.push({ line: idx + 1, raw: trimmed, reason: 'Expected 5 fields: Name|Class|Spec|ilvl|rating' });
      return;
    }

    const [name, className, specName, ilvlStr, ratingStr] = parts.map((p) => p.trim());

    if (!name) {
      errors.push({ line: idx + 1, raw: trimmed, reason: 'Name is empty' });
      return;
    }

    if (!VALID_CLASSES.includes(className as WowClass)) {
      errors.push({ line: idx + 1, raw: trimmed, reason: `Unknown class: "${className}"` });
      return;
    }

    const ilvl = parseInt(ilvlStr, 10);
    if (isNaN(ilvl)) {
      errors.push({ line: idx + 1, raw: trimmed, reason: `Invalid ilvl: "${ilvlStr}"` });
      return;
    }

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating)) {
      errors.push({ line: idx + 1, raw: trimmed, reason: `Invalid rating: "${ratingStr}"` });
      return;
    }

    const wowClass = className as WowClass;
    const role = getRoleFromSpec(wowClass, specName);

    players.push({
      id: uuidv4(),
      name,
      class: wowClass,
      spec: specName,
      role,
      ilvl,
      rating,
    });
  });

  return { players, errors };
}
