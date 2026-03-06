export interface Dungeon {
  name: string;
  category: 'midnight' | 'season1';
}

export const DUNGEONS: Dungeon[] = [
  // New Midnight Dungeons
  { name: "Den of Nalorakk",      category: 'midnight' },
  { name: "Maisara Caverns",      category: 'midnight' },
  { name: "Magister's Terrace",   category: 'midnight' },
  { name: "Nexus Point Xenas",    category: 'midnight' },
  { name: "Murder Row",           category: 'midnight' },
  { name: "The Blinding Vale",    category: 'midnight' },
  { name: "Windrunner Spire",     category: 'midnight' },
  { name: "Voidscar Arena",       category: 'midnight' },

  // Mythic+ Season 1
  { name: "Algeth'ar Academy",    category: 'season1' },
  { name: "Pit of Saron",         category: 'season1' },
  { name: "Seat of the Triumvirate", category: 'season1' },
  { name: "Skyreach",             category: 'season1' },
];

// Season 1 includes some Midnight dungeons too; deduplicate for display
export const MIDNIGHT_DUNGEONS = DUNGEONS.filter((d) => d.category === 'midnight');
export const SEASON1_DUNGEONS  = DUNGEONS.filter((d) => d.category === 'season1');

// All season 1 entries (including shared midnight ones)
export const SEASON1_ALL_NAMES = new Set([
  "Magister's Terrace",
  "Maisara Caverns",
  "Nexus Point Xenas",
  "Windrunner Spire",
  "Algeth'ar Academy",
  "Pit of Saron",
  "Seat of the Triumvirate",
  "Skyreach",
]);
