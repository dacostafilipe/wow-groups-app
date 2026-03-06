export interface Dungeon {
  name: string;
  category: 'midnight' | 'season1';
  inSeason1?: boolean; // midnight dungeons also featured in Season 1
  translations?: Record<string, string>; // ISO language code → localized name
}

export const DUNGEONS: Dungeon[] = [
  // New Midnight Dungeons
  {
    name: "Den of Nalorakk",
    category: 'midnight',
    translations: { fr: "Antre de Nalorakk" },
  },
  {
    name: "Maisara Caverns",
    category: 'midnight',
    inSeason1: true,
    translations: { fr: "Cavernes de Maisara" },
  },
  {
    name: "Magister's Terrace",
    category: 'midnight',
    inSeason1: true,
    translations: { fr: "Terrasse des Magistères" },
  },
  {
    name: "Nexus Point Xenas",
    category: 'midnight',
    inSeason1: true,
    translations: { fr: "Point-nexus Xenas" },
  },
  {
    name: "Murder Row",
    category: 'midnight',
    translations: { fr: "Allée du meurtre" },
  },
  {
    name: "The Blinding Vale",
    category: 'midnight',
    translations: { fr: "Le val Aveuglant" },
  },
  {
    name: "Windrunner Spire",
    category: 'midnight',
    inSeason1: true,
    translations: { fr: "Flèche de Coursevent" },
  },
  {
    name: "Voidscar Arena",
    category: 'midnight',
    translations: { fr: "Arène de la Cicatrice du Vide" },
  },

  // Mythic+ Season 1 returning dungeons
  {
    name: "Algeth'ar Academy",
    category: 'season1',
    translations: { fr: "Académie d’Algeth’ar" },
  },
  {
    name: "Pit of Saron",
    category: 'season1',
    translations: { fr: "Fosse de Saron" },
  },
  {
    name: "Seat of the Triumvirate",
    category: 'season1',
    translations: { fr: "Siège du triumvirat" },
  },
  {
    name: "Skyreach",
    category: 'season1',
    translations: { fr: "Orée-du-Ciel" },
  },
];


// Season 1 pool: returning dungeons + the midnight dungeons flagged for S1
export const SEASON1_ALL_NAMES = new Set(
  DUNGEONS.filter((d) => d.category === 'season1' || d.inSeason1).map((d) => d.name)
);
