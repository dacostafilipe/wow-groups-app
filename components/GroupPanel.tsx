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
  onRemovePlayer: (id: string) => void;
  onEditPlayer: (id: string) => void;
}

const BUFF_ICONS: Partial<Record<BuffName, { src: string; title: string }>> = {
  Bloodlust: { src: '/icons/buffs/bloodlust.jpg', title: 'Bloodlust / Heroism' },
  CombatRez: { src: '/icons/buffs/battlerez.jpg', title: 'Combat Resurrection' },
};

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export default function GroupPanel({ group, index, onRemovePlayer, onEditPlayer }: Props) {
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
          {(Object.entries(BUFF_ICONS) as [BuffName, { src: string; title: string }][]).map(([b, icon]) => {
            const present = buffs.includes(b);
            return (
              <img
                key={b}
                src={icon.src}
                alt={icon.title}
                title={present ? icon.title : `Missing: ${icon.title}`}
                width={22}
                height={22}
                className="rounded-sm"
                style={{ filter: present ? 'none' : 'grayscale(1) opacity(0.35)' }}
              />
            );
          })}
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
            <PlayerCard key={player.id} player={player} onRemove={() => onRemovePlayer(player.id)} onEdit={() => onEditPlayer(player.id)} />
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
