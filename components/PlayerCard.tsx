'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '@/lib/types';
import { CLASS_COLORS, classSlug, specSlug } from '@/data/wow';

interface Props {
  player: Player;
  isDragging?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}

function RoleIcon({ role }: { role: Player['role'] }) {
  return (
    <img
      src={`/icons/roles/${role}.png`}
      alt={role}
      width={30}
      height={30}
      title={role.charAt(0).toUpperCase() + role.slice(1)}
      style={{ flexShrink: 0 }}
    />
  );
}

export default function PlayerCard({ player, isDragging, onRemove, onEdit }: Props) {
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
      className="group rounded-md select-none cursor-grab active:cursor-grabbing"
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
        <div className="px-2.5 py-2 relative">
          {/* Action buttons (edit + remove), revealed on hover */}
          {(onEdit || onRemove) && (
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  title="Edit player"
                  className="w-6 h-6 flex items-center justify-center rounded text-sm leading-none hover:brightness-125 active:brightness-75"
                  style={{ color: 'var(--text-primary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  ✎
                </button>
              )}
              {onRemove && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  title="Remove player"
                  className="w-6 h-6 flex items-center justify-center rounded text-sm leading-none hover:brightness-125 active:brightness-75"
                  style={{ color: '#f87171', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {/* Top row: name + role icon */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div
              className="leading-tight truncate"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-inter), system-ui, sans-serif', fontWeight: 500, fontSize: '1.20rem' }}
            >
              {player.name}
            </div>
            <RoleIcon role={player.role} />
          </div>

          {/* Spec */}
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {player.spec}
          </div>

          {/* Stats + class/spec icons */}
          <div className="flex items-end justify-between mt-2">
            <div className="flex gap-3">
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
            <div className="flex items-center gap-1">
              <img
                src={`/icons/classes/${classSlug(player.class)}.jpg`}
                alt={player.class}
                width={30}
                height={30}
                className="rounded-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <img
                src={`/icons/specs/${specSlug(player.class, player.spec)}.jpg`}
                alt={player.spec}
                width={30}
                height={30}
                className="rounded-sm opacity-80"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
