import { v4 as uuidv4 } from 'uuid';
import { Player, Group } from './types';
import { hasBloodlust } from '@/data/wow';

interface AlgorithmOptions {
  history: string[]; // sorted "idA:idB" pairs
  historyPenalty?: number; // 0–1, default 0.3
  iterations?: number; // random restarts, default 600
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function historyKey(a: Player, b: Player): string {
  return [a.id, b.id].sort().join(':');
}

function scoreGroups(
  groups: Player[][],
  rosterAvgIlvl: number,
  rosterAvgRating: number,
  history: Set<string>,
  historyPenalty: number,
): number {
  let total = 0;

  for (const group of groups) {
    const groupAvgIlvl = avg(group.map((p) => p.ilvl));
    const groupAvgRating = avg(group.map((p) => p.rating));

    const ilvlScore = 1 - Math.abs(groupAvgIlvl - rosterAvgIlvl) / (rosterAvgIlvl || 1);
    const ratingScore = 1 - Math.abs(groupAvgRating - rosterAvgRating) / (rosterAvgRating || 1);

    let historyCount = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (history.has(historyKey(group[i], group[j]))) historyCount++;
      }
    }
    const maxPairs = (group.length * (group.length - 1)) / 2;
    const historyScore = 1 - (historyCount / (maxPairs || 1)) * historyPenalty;

    const blBonus = hasBloodlust(group) ? 0.1 : 0;

    total += (ilvlScore + ratingScore) / 2 + historyScore + blBonus;
  }

  return total;
}

function assignBloodlust(groups: Player[][]): void {
  const blGroupIdx = groups.findIndex((g) => hasBloodlust(g));
  if (blGroupIdx > 0) {
    [groups[0], groups[blGroupIdx]] = [groups[blGroupIdx], groups[0]];
  }
}

function partitionByRole(players: Player[]): { tanks: Player[]; healers: Player[]; dps: Player[] } {
  const tanks: Player[] = [];
  const healers: Player[] = [];
  const dps: Player[] = [];

  for (const p of players) {
    if (p.role === 'tank') tanks.push(p);
    else if (p.role === 'healer') healers.push(p);
    else dps.push(p);
  }

  return { tanks, healers, dps };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one candidate grouping.
 * Distributes tanks and healers 1-per-group where available,
 * then fills remaining slots with DPS. Never returns null.
 */
function buildGroupsOnce(
  tanks: Player[],
  healers: Player[],
  dps: Player[],
  groupCount: number,
): Player[][] {
  const t = shuffle(tanks);
  const h = shuffle(healers);
  const d = shuffle(dps);

  const groups: Player[][] = Array.from({ length: groupCount }, () => []);

  // Assign 1 tank per group (as many as available)
  for (let i = 0; i < t.length; i++) {
    groups[i % groupCount].push(t[i]);
  }

  // Assign 1 healer per group (as many as available)
  for (let i = 0; i < h.length; i++) {
    groups[i % groupCount].push(h[i]);
  }

  // Fill remaining slots with DPS (each group gets up to 5 total players)
  let dpsIdx = 0;
  for (let i = 0; i < groupCount && dpsIdx < d.length; i++) {
    const slotsAvailable = 5 - groups[i].length;
    for (let s = 0; s < slotsAvailable && dpsIdx < d.length; s++) {
      groups[i].push(d[dpsIdx++]);
    }
  }

  return groups;
}

export function generateGroups(
  players: Player[],
  options: AlgorithmOptions,
): { groups: Group[]; bench: Player[] } {
  const { history, historyPenalty = 0.3, iterations = 600 } = options;
  const historySet = new Set(history);

  const groupCount = Math.floor(players.length / 5);

  if (groupCount === 0) {
    return { groups: [], bench: players };
  }

  const { tanks, healers, dps } = partitionByRole(players);

  const allTanks = [...tanks];
  const allHealers = [...healers];
  const allDps = [...dps];

  // Shuffle each pool before slicing so bench players rotate fairly
  const activeTanks = shuffle(allTanks).slice(0, groupCount);
  const activeHealers = shuffle(allHealers).slice(0, groupCount);

  // DPS fills all remaining slots across all groups
  const dpsSlots = groupCount * 5 - activeTanks.length - activeHealers.length;
  const activeDps = shuffle(allDps).slice(0, dpsSlots);

  const activeIds = new Set([
    ...activeTanks.map((p) => p.id),
    ...activeHealers.map((p) => p.id),
    ...activeDps.map((p) => p.id),
  ]);
  const bench = players.filter((p) => !activeIds.has(p.id));

  const allActive = [...activeTanks, ...activeHealers, ...activeDps];
  const rosterAvgIlvl = avg(allActive.map((p) => p.ilvl));
  const rosterAvgRating = avg(allActive.map((p) => p.rating));

  let bestScore = -Infinity;
  let bestGroups: Player[][] = buildGroupsOnce(activeTanks, activeHealers, activeDps, groupCount);

  for (let i = 0; i < iterations; i++) {
    const candidate = buildGroupsOnce(activeTanks, activeHealers, activeDps, groupCount);
    const score = scoreGroups(candidate, rosterAvgIlvl, rosterAvgRating, historySet, historyPenalty);
    if (score > bestScore) {
      bestScore = score;
      bestGroups = candidate;
    }
  }

  assignBloodlust(bestGroups);

  const groups: Group[] = bestGroups.map((groupPlayers) => ({
    id: uuidv4(),
    players: groupPlayers,
  }));

  return { groups, bench };
}

export function pairsFromGroups(groups: Group[]): string[] {
  const pairs: string[] = [];
  for (const group of groups) {
    const { players } = group;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push([players[i].id, players[j].id].sort().join(':'));
      }
    }
  }
  return pairs;
}
