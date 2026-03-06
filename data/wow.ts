import { Role, WowClass } from '@/lib/types';

export const CLASS_COLORS: Record<WowClass, string> = {
  DeathKnight: '#C41E3A',
  DemonHunter: '#A330C9',
  Druid: '#FF7C0A',
  Evoker: '#33937F',
  Hunter: '#AAD372',
  Mage: '#3FC7EB',
  Monk: '#00FF98',
  Paladin: '#F48CBA',
  Priest: '#FFFFFF',
  Rogue: '#FFF468',
  Shaman: '#0070DD',
  Warlock: '#8788EE',
  Warrior: '#C69B3A',
};

// Maps "ClassName:SpecName" → role
const SPEC_ROLES: Record<string, Role> = {
  // Death Knight
  'DeathKnight:Blood': 'tank',
  'DeathKnight:Frost': 'dps',
  'DeathKnight:Unholy': 'dps',
  // Demon Hunter
  'DemonHunter:Havoc': 'dps',
  'DemonHunter:Vengeance': 'tank',
  // Druid
  'Druid:Balance': 'dps',
  'Druid:Feral': 'dps',
  'Druid:Guardian': 'tank',
  'Druid:Restoration': 'healer',
  // Evoker
  'Evoker:Devastation': 'dps',
  'Evoker:Augmentation': 'dps',
  'Evoker:Preservation': 'healer',
  // Hunter
  'Hunter:BeastMastery': 'dps',
  'Hunter:Marksmanship': 'dps',
  'Hunter:Survival': 'dps',
  // Mage
  'Mage:Arcane': 'dps',
  'Mage:Fire': 'dps',
  'Mage:Frost': 'dps',
  // Monk
  'Monk:Brewmaster': 'tank',
  'Monk:Mistweaver': 'healer',
  'Monk:Windwalker': 'dps',
  // Paladin
  'Paladin:Holy': 'healer',
  'Paladin:Protection': 'tank',
  'Paladin:Retribution': 'dps',
  // Priest
  'Priest:Discipline': 'healer',
  'Priest:Holy': 'healer',
  'Priest:Shadow': 'dps',
  // Rogue
  'Rogue:Assassination': 'dps',
  'Rogue:Outlaw': 'dps',
  'Rogue:Subtlety': 'dps',
  // Shaman
  'Shaman:Elemental': 'dps',
  'Shaman:Enhancement': 'dps',
  'Shaman:Restoration': 'healer',
  // Warlock
  'Warlock:Affliction': 'dps',
  'Warlock:Demonology': 'dps',
  'Warlock:Destruction': 'dps',
  // Warrior
  'Warrior:Arms': 'dps',
  'Warrior:Fury': 'dps',
  'Warrior:Protection': 'tank',
};

export function getRoleFromSpec(className: WowClass, specName: string): Role {
  const key = `${className}:${specName}`;
  return SPEC_ROLES[key] ?? 'dps';
}

// Bloodlust providers: class:spec combos
export const BLOODLUST_PROVIDERS: Array<{ class: WowClass; spec?: string }> = [
  { class: 'Shaman' }, // all shaman specs
  { class: 'Mage' },
  { class: 'Hunter' },
];

export const COMBAT_REZ_PROVIDERS: WowClass[] = ['Druid', 'DeathKnight', 'Warlock', 'Paladin'];

export type BuffName = 'Bloodlust' | 'CombatRez';

export function hasBloodlust(players: { class: WowClass; spec: string }[]): boolean {
  return players.some((p) =>
    BLOODLUST_PROVIDERS.some(
      (bp) => bp.class === p.class && (bp.spec === undefined || bp.spec === p.spec)
    )
  );
}

export function getGroupBuffs(players: { class: WowClass; spec: string }[]): BuffName[] {
  const buffs: BuffName[] = [];
  if (hasBloodlust(players)) buffs.push('Bloodlust');
  if (players.some((p) => COMBAT_REZ_PROVIDERS.includes(p.class))) buffs.push('CombatRez');
  return buffs;
}

export const SPECS_BY_CLASS: Record<WowClass, string[]> = {
  DeathKnight: ['Blood', 'Frost', 'Unholy'],
  DemonHunter: ['Havoc', 'Vengeance'],
  Druid:       ['Balance', 'Feral', 'Guardian', 'Restoration'],
  Evoker:      ['Devastation', 'Augmentation', 'Preservation'],
  Hunter:      ['BeastMastery', 'Marksmanship', 'Survival'],
  Mage:        ['Arcane', 'Fire', 'Frost'],
  Monk:        ['Brewmaster', 'Mistweaver', 'Windwalker'],
  Paladin:     ['Holy', 'Protection', 'Retribution'],
  Priest:      ['Discipline', 'Holy', 'Shadow'],
  Rogue:       ['Assassination', 'Outlaw', 'Subtlety'],
  Shaman:      ['Elemental', 'Enhancement', 'Restoration'],
  Warlock:     ['Affliction', 'Demonology', 'Destruction'],
  Warrior:     ['Arms', 'Fury', 'Protection'],
};

export function classSlug(className: WowClass): string {
  return className.toLowerCase().replace(/\s/g, '');
}

export function specSlug(className: WowClass, specName: string): string {
  const spec = specName.toLowerCase().replace(/\s/g, '');
  const cls = className.toLowerCase().replace(/\s/g, '');
  // Specs that exist on multiple classes need disambiguation
  const AMBIGUOUS = ['frost', 'protection', 'holy', 'restoration'];
  if (AMBIGUOUS.includes(spec)) return `${spec}-${cls}`;
  return spec;
}
