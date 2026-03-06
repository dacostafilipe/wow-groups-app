'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '@/lib/types';
import { CLASS_COLORS, classSlug, specSlug } from '@/data/wow';

interface Props {
  player: Player;
  isDragging?: boolean;
}

function RoleIcon({ role, color }: { role: Player['role']; color: string }) {
  if (role === 'tank') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    );
  }
  if (role === 'healer') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
      </svg>
    );
  }
  // dps
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
    </svg>
  );
}

export default function PlayerCard({ player, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, active } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const classColor = CLASS_COLORS[player.class];
  const isActive = active?.id === player.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-md select-none cursor-grab active:cursor-grabbing"
      data-dragging={isActive || isDragging}
    >
      <div
        className="rounded-md overflow-hidden transition-all"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${classColor}`,
          opacity: isActive ? 0.5 : 1,
          boxShadow: isActive ? `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${classColor}44` : 'none',
        }}
      >
        <div className="px-2.5 py-2">
          {/* Top row: icons + role */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {/* Class icon */}
              <img
                src={`/icons/classes/${classSlug(player.class)}.jpg`}
                alt={player.class}
                width={20}
                height={20}
                className="rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Spec icon */}
              <img
                src={`/icons/specs/${specSlug(player.class, player.spec)}.jpg`}
                alt={player.spec}
                width={16}
                height={16}
                className="rounded-sm opacity-80"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <RoleIcon role={player.role} color={classColor} />
          </div>

          {/* Name */}
          <div
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-cinzel), serif' }}
          >
            {player.name}
          </div>

          {/* Spec */}
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {player.spec}
            {player.fallbackRole && (
              <span className="ml-1 opacity-60">/ {player.fallbackRole}</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-2">
            <div className="flex flex-col">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>ilvl</span>
              <span className="text-sm font-medium" style={{ color: classColor }}>
                {player.ilvl}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>M+</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {player.rating > 0 ? player.rating.toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
