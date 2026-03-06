'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Player } from '@/lib/types';
import PlayerCard from './PlayerCard';

const BENCH_ID = 'bench';

interface Props {
  players: Player[];
}

export default function BenchPanel({ players }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: BENCH_ID });

  return (
    <div
      ref={setNodeRef}
      className="rounded-md flex flex-col transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
        boxShadow: isOver
          ? '0 0 0 1px var(--gold-primary), inset 0 1px 0 rgba(200,168,75,0.12)'
          : 'inset 0 1px 0 rgba(200,168,75,0.06)',
        width: '200px',
        minWidth: '200px',
        minHeight: '200px',
      }}
    >
      <div
        className="px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--gold-dim)' }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
        >
          Bench
          {players.length > 0 && (
            <span
              className="ml-2 text-xs font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              {players.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-2 flex flex-col gap-1.5 flex-1">
        <SortableContext
          items={players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </SortableContext>

        {players.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center text-xs text-center p-3 rounded"
            style={{
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-subtle)',
              minHeight: '60px',
            }}
          >
            Extra players appear here
          </div>
        )}
      </div>
    </div>
  );
}
