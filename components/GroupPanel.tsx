'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Group } from '@/lib/types';
import { validateGroup } from '@/lib/validation';
import { getGroupBuffs, BuffName } from '@/data/wow';
import PlayerCard from './PlayerCard';

interface Props {
  group: Group;
  index: number;
}

const BUFF_LABELS: Record<BuffName, { label: string; title: string }> = {
  Bloodlust: { label: 'BL', title: 'Bloodlust / Heroism' },
  CombatRez: { label: 'CR', title: 'Combat Resurrection' },
  BattleShout: { label: 'BS', title: 'Battle Shout' },
  PowerInfusion: { label: 'PI', title: 'Power Infusion' },
};

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function GroupPanel({ group, index }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  const issues = validateGroup(group);
  const buffs = getGroupBuffs(group.players);

  const hasError = issues.some((i) => i.severity === 'error');
  const hasWarning = issues.some((i) => i.severity === 'warning');

  const borderColor = hasError
    ? 'var(--error)'
    : hasWarning
    ? 'var(--warning)'
    : isOver
    ? 'var(--gold-primary)'
    : 'var(--border-subtle)';

  const avgIlvl = avg(group.players.map((p) => p.ilvl));
  const avgRating = avg(group.players.map((p) => p.rating));

  return (
    <div
      ref={setNodeRef}
      className="rounded-md flex flex-col transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${borderColor}`,
        boxShadow: isOver
          ? `0 0 0 1px var(--gold-primary), inset 0 1px 0 rgba(200,168,75,0.12)`
          : 'inset 0 1px 0 rgba(200,168,75,0.06)',
        minHeight: '320px',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--gold-dim)' }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
        >
          Group {index + 1}
        </h3>
        <div className="flex gap-1">
          {buffs.map((b) => (
            <span
              key={b}
              title={BUFF_LABELS[b].title}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--gold-dim)',
                color: 'var(--gold-primary)',
                fontSize: '0.65rem',
              }}
            >
              {BUFF_LABELS[b].label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div
        className="px-3 py-1.5 flex gap-4 text-xs"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span>avg ilvl <strong style={{ color: 'var(--text-primary)' }}>{avgIlvl}</strong></span>
        <span>avg M+ <strong style={{ color: 'var(--text-primary)' }}>{avgRating > 0 ? avgRating.toLocaleString() : '—'}</strong></span>
        <span>{group.players.length}/5</span>
      </div>

      {/* Validation issues */}
      {issues.filter((i) => i.severity !== 'info').length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1">
          {issues
            .filter((i) => i.severity !== 'info')
            .map((issue) => (
              <span
                key={issue.message}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: issue.severity === 'error' ? '#2a0a0a' : '#2a1a00',
                  border: `1px solid ${issue.severity === 'error' ? 'var(--error)' : 'var(--warning)'}`,
                  color: issue.severity === 'error' ? '#f87171' : '#fbbf24',
                  fontSize: '0.65rem',
                }}
              >
                {issue.severity === 'error' ? '✕' : '⚠'} {issue.message}
              </span>
            ))}
        </div>
      )}

      {/* Player cards */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        <SortableContext
          items={group.players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </SortableContext>

        {group.players.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center text-sm rounded"
            style={{
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-subtle)',
              minHeight: '80px',
            }}
          >
            Drop players here
          </div>
        )}
      </div>
    </div>
  );
}
