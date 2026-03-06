'use client';

import { useState, useMemo } from 'react';
import { Dungeon, DUNGEONS, SEASON1_ALL_NAMES } from '@/data/dungeons';

interface Props {
  onConfirm: (dungeon: string) => void;
  onCancel: () => void;
  usedDungeons: Set<string>;
}

type Tab = 'all' | 'season1';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

function DungeonCard({
  dungeon,
  lang,
  selected,
  used,
  onClick,
}: {
  dungeon: Dungeon;
  lang: string;
  selected: boolean;
  used: boolean;
  onClick: () => void;
}) {
  const borderColor = selected ? 'var(--gold-primary)' : used ? '#16a34a' : 'var(--border-subtle)';
  const translation = lang !== 'en' ? dungeon.translations?.[lang] : undefined;

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start p-3 rounded-md text-left transition-all"
      style={{
        background: selected ? 'rgba(200,168,75,0.14)' : 'var(--bg-elevated)',
        border: `1px solid ${borderColor}`,
        boxShadow: selected ? 'inset 0 1px 0 rgba(200,168,75,0.12)' : 'none',
      }}
    >
      {/* Primary name */}
      <span
        className="text-sm leading-snug"
        style={{
          color: selected ? 'var(--gold-primary)' : 'var(--text-primary)',
          fontWeight: selected ? 600 : 400,
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        }}
      >
        {translation ?? dungeon.name}
      </span>

      {/* Original English name when a translation is shown */}
      {translation && (
        <span
          className="text-xs mt-0.5 leading-snug"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-inter), system-ui, sans-serif',
          }}
        >
          {dungeon.name}
        </span>
      )}

      {/* Corner indicator: green checkmark for already-run dungeons */}
      {used && !selected && (
        <span
          className="absolute top-2 right-2 text-xs"
          style={{ color: '#4ade80' }}
        >
          ✓
        </span>
      )}
    </button>
  );
}

export default function DungeonSelectModal({ onConfirm, onCancel, usedDungeons }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('en');

  const visibleDungeons = useMemo(() => {
    const base = tab === 'season1'
      ? DUNGEONS.filter((d) => SEASON1_ALL_NAMES.has(d.name))
      : DUNGEONS;
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((d) => {
      const translation = d.translations?.[lang] ?? '';
      return d.name.toLowerCase().includes(q) || translation.toLowerCase().includes(q);
    });
  }, [tab, search, lang]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all',     label: 'All Midnight' },
    { id: 'season1', label: 'Season 1' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="rounded-md w-full max-w-2xl flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-dim)',
          boxShadow: '0 0 60px rgba(200,168,75,0.15)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
            >
              Select Dungeon
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Choose the dungeon your groups will run
            </p>
          </div>
          <button onClick={onCancel} className="text-lg leading-none" style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {/* Tabs + search + language */}
        <div className="px-5 pt-3 pb-2 flex gap-3">
          <div className="flex gap-1 p-1 rounded-md" style={{ background: 'var(--bg-elevated)' }}>
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: tab === id ? 'var(--gold-dim)' : 'transparent',
                  color: tab === id ? '#0a0b0d' : 'var(--text-muted)',
                  fontFamily: 'var(--font-cinzel), serif',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="flex-1 px-3 py-1.5 rounded-md text-sm focus:outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              caretColor: 'var(--gold-primary)',
            }}
          />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-2 py-1.5 rounded-md text-xs focus:outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="px-5 pb-2 flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#4ade80' }}>✓</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Already selected in a previous run
          </span>
        </div>

        {/* Dungeon grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {visibleDungeons.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              No dungeons match your search.
            </p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {visibleDungeons.map((dungeon) => (
                <DungeonCard
                  key={dungeon.name}
                  dungeon={dungeon}
                  lang={lang}
                  selected={selected === dungeon.name}
                  used={usedDungeons.has(dungeon.name)}
                  onClick={() => setSelected(dungeon.name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {selected
              ? <strong style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>{selected}</strong>
              : 'No dungeon selected'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-md text-sm"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected}
              className="px-5 py-1.5 rounded-md text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
                color: '#0a0b0d',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                fontFamily: 'var(--font-cinzel), serif',
              }}
            >
              Start Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
