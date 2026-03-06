import { Group, ValidationIssue } from './types';
import { hasBloodlust } from '@/data/wow';

export function validateGroup(group: Group): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { players } = group;

  const tanks = players.filter((p) => p.role === 'tank');
  const healers = players.filter((p) => p.role === 'healer');
  const dps = players.filter((p) => p.role === 'dps');

  if (tanks.length === 0) issues.push({ severity: 'error', message: 'No Tank' });
  if (tanks.length > 1) issues.push({ severity: 'error', message: 'Too many Tanks' });
  if (healers.length === 0) issues.push({ severity: 'error', message: 'No Healer' });
  if (healers.length > 1) issues.push({ severity: 'error', message: 'Too many Healers' });
  if (dps.length > 3) issues.push({ severity: 'error', message: 'Too many DPS' });
  if (dps.length < 3) issues.push({ severity: 'warning', message: 'Missing DPS' });
  if (players.length < 5) issues.push({ severity: 'warning', message: 'Incomplete group' });
  if (!hasBloodlust(players)) issues.push({ severity: 'info', message: 'No Bloodlust' });

  return issues;
}
