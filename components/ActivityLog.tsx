'use client';

import { useState } from 'react';
import { ActivityEvent } from '@/lib/types';

interface Props {
  events: ActivityEvent[];
}

const EVENT_LABELS: Record<ActivityEvent['type'], string> = {
  run_started: 'Run started',
  reshuffled:  'Groups reshuffled',
};

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  run_started: 'var(--gold-primary)',
  reshuffled:  '#60a5fa',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLog({ events }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-md overflow-hidden transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'inset 0 1px 0 rgba(200,168,75,0.06)',
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ borderBottom: open ? '1px solid var(--gold-dim)' : 'none' }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
        >
          Activity Log
        </span>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            >
              {events.length}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Events list */}
      {open && (
        <div className="max-h-64 overflow-y-auto">
          {events.length === 0 ? (
            <p className="px-3 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              No activity yet. Press Start Run to begin.
            </p>
          ) : (
            <ul>
              {[...events].reverse().map((e, i) => (
                <li
                  key={i}
                  className="px-3 py-2 text-xs"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {/* Row 1: dot + label + run# + time */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: EVENT_COLORS[e.type] }}
                      />
                      <span style={{ color: EVENT_COLORS[e.type] }}>
                        {EVENT_LABELS[e.type]}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>#{e.runCount}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatTime(e.timestamp)}
                    </span>
                  </div>
                  {/* Row 2: dungeon name */}
                  {e.dungeon && (
                    <div className="mt-1 pl-3 truncate" style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif', fontSize: '0.7rem' }}>
                      {e.dungeon}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
