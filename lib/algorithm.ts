import { v4 as uuidv4 } from 'uuid';
import { Player, Group } from './types';
import { hasBloodlust } from '@/data/wow';

interface AlgorithmOptions {
  history: string[]; // sorted "idA:idB" pairs
  historyPenalty?: number; // 0–1, default 0.3
  iterations?: number; // random restarts, default 500
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
    const ilvls = group.map((p) => p.ilvl);
    const ratings = group.map((p) => p.rating);

    const groupAvgIlvl = avg(ilvls);
    const groupAvgRating = avg(ratings);

    // Deviation from roster average (lower is better; invert to score)
    const ilvlScore = 1 - Math.abs(groupAvgIlvl - rosterAvgIlvl) / (rosterAvgIlvl || 1);
    const ratingScore = 1 - Math.abs(groupAvgRating - rosterAvgRating) / (rosterAvgRating || 1);

    // History penalty
    let historyCount = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (history.has(historyKey(group[i], group[j]))) historyCount++;
      }
    }
    const maxPairs = (group.length * (group.length - 1)) / 2;
    const historyScore = 1 - (historyCount / (maxPairs || 1)) * historyPenalty;

    // Buff bonus
    const blBonus = hasBloodlust(group) ? 0.1 : 0;

    total += (ilvlScore + ratingScore) / 2 + historyScore + blBonus;
  }

  return total;
}

function assignBloodlust(groups: Player[][]): void {
  // Find groups with BL and groups without; try to ensure group[0] has BL
  const blGroupIdx = groups.findIndex((g) => hasBloodlust(g));
  if (blGroupIdx > 0) {
    // Swap so the BL group is first (group 1 gets priority)
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

function buildGroupsOnce(
  tanks: Player[],
  healers: Player[],
  dpsPlayers: Player[],
  groupCount: number,
): Player[][] | null {
  const t = shuffle(tanks);
  const h = shuffle(healers);
  const d = shuffle(dpsPlayers);

  if (t.length < groupCount || h.length < groupCount) return null;

  const groups: Player[][] = Array.from({ length: groupCount }, () => []);

  // Assign 1 tank and 1 healer per group
  for (let i = 0; i < groupCount; i++) {
    groups[i].push(t[i]);
    groups[i].push(h[i]);
  }

  // Distribute DPS across groups (3 per group), round-robin shuffled
  const dpsNeeded = groupCount * 3;
  const dpsPool = d.slice(0, dpsNeeded);
  for (let i = 0; i < dpsPool.length; i++) {
    groups[i % groupCount].push(dpsPool[i]);
  }

  return groups;
}

export function generateGroups(players: Player[], options: AlgorithmOptions): { groups: Group[]; bench: Player[] } {
  const { history, historyPenalty = 0.3, iterations = 600 } = options;
  const historySet = new Set(history);

  const groupCount = Math.floor(players.length / 5);

  if (groupCount === 0) {
    return { groups: [], bench: players };
  }

  const { tanks, healers, dps } = partitionByRole(players);

  // Handle fallback roles: move players to their fallback pool if needed
  const allDps = [...dps];
  const allTanks = [...tanks];
  const allHealers = [...healers];

  // Ensure we have enough tanks and healers; fill from fallback
  while (allTanks.length < groupCount) {
    const fb = allDps.findIndex((p) => p.fallbackRole === 'tank');
    if (fb === -1) break;
    allTanks.push(...allDps.splice(fb, 1));
  }
  while (allHealers.length < groupCount) {
    const fb = allDps.findIndex((p) => p.fallbackRole === 'healer');
    if (fb === -1) break;
    allHealers.push(...allDps.splice(fb, 1));
  }

  // Players that can't fit are benched
  const activePlayers = [
    ...allTanks.slice(0, groupCount),
    ...allHealers.slice(0, groupCount),
    ...allDps.slice(0, groupCount * 3),
  ];
  const bench: Player[] = [
    ...players.filter((p) => !activePlayers.find((a) => a.id === p.id)),
  ];

  const rosterAvgIlvl = avg(activePlayers.map((p) => p.ilvl));
  const rosterAvgRating = avg(activePlayers.map((p) => p.rating));

  let bestScore = -Infinity;
  let bestGroups: Player[][] | null = null;

  const useTanks = allTanks.slice(0, groupCount);
  const useHealers = allHealers.slice(0, groupCount);
  const useDps = allDps.slice(0, groupCount * 3);

  for (let i = 0; i < iterations; i++) {
    const candidate = buildGroupsOnce(useTanks, useHealers, useDps, groupCount);
    if (!candidate) continue;

    const score = scoreGroups(candidate, rosterAvgIlvl, rosterAvgRating, historySet, historyPenalty);
    if (score > bestScore) {
      bestScore = score;
      bestGroups = candidate;
    }
  }

  if (!bestGroups) {
    // Fallback: just divide naively
    bestGroups = Array.from({ length: groupCount }, (_, i) =>
      activePlayers.slice(i * 5, i * 5 + 5)
    );
  }

  assignBloodlust(bestGroups);

  const groups: Group[] = bestGroups.map((players) => ({
    id: uuidv4(),
    players,
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
