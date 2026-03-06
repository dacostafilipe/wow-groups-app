'use client';

import { useState } from 'react';
import { Player, WowClass } from '@/lib/types';
import { parseRosterText } from '@/lib/parser';
import { CLASS_COLORS, getRoleFromSpec, SPECS_BY_CLASS } from '@/data/wow';

function displayName(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').trim();
}

const CLASSES: WowClass[] = [
  'DeathKnight', 'DemonHunter', 'Druid', 'Evoker', 'Hunter',
  'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior',
];

interface Props {
  onConfirm: (players: Player[]) => void;
}

export default function ImportScreen({ onConfirm }: Props) {
  const [text, setText] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [errors, setErrors] = useState<Array<{ line: number; raw: string; reason: string }>>([]);
  const [parsed, setParsed] = useState(false);

  function handleParse() {
    const result = parseRosterText(text);
    setPlayers(result.players);
    setErrors(result.errors);
    setParsed(true);
  }

  function updatePlayer(id: string, field: keyof Player, value: string | number) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'class') {
          // Reset spec to first valid spec for the new class
          updated.spec = SPECS_BY_CLASS[updated.class][0];
        }
        if (field === 'class' || field === 'spec') {
          updated.role = getRoleFromSpec(updated.class, updated.spec);
        }
        return updated;
      })
    );
  }

  const EXAMPLE = `Arthas|DeathKnight|Blood|623|2840
Thrall|Shaman|Restoration|618|2210
Sylvanas|Hunter|Marksmanship|620|3100
Jaina|Mage|Frost|621|2950
Anduin|Priest|Holy|615|1800
Varian|Warrior|Protection|619|2400
Illidan|DemonHunter|Havoc|622|3050
Malfurion|Druid|Balance|617|2650
Khadgar|Mage|Arcane|616|2300
Uther|Paladin|Holy|618|2100
Gul'dan|Warlock|Destruction|614|1950
Chen|Monk|Windwalker|620|2750
Ner'zhul|Shaman|Elemental|613|1700
Tyrande|Priest|Discipline|621|2850
Garrosh|Warrior|Arms|616|2500`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-display font-semibold mb-2"
            style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
          >
            wow-groups
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Mythic+ Dungeon Group Organizer
          </p>
        </div>

        {!parsed ? (
          /* Import step */
          <div
            className="rounded-md p-6"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'inset 0 1px 0 rgba(200,168,75,0.08)',
            }}
          >
            <h2
              className="text-lg font-display mb-4"
              style={{
                color: 'var(--gold-primary)',
                fontFamily: 'var(--font-cinzel), serif',
                borderBottom: '1px solid var(--gold-dim)',
                paddingBottom: '0.5rem',
              }}
            >
              Import Roster
            </h2>

            <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              Paste your addon output below. One player per line:
              <code
                className="ml-2 px-2 py-0.5 rounded text-xs"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                Name|Class|Spec|ilvl|rating
              </code>
            </p>

            <textarea
              className="w-full rounded-md p-3 text-sm font-mono resize-none focus:outline-none"
              rows={14}
              placeholder={EXAMPLE}
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                caretColor: 'var(--gold-primary)',
              }}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleParse}
                disabled={!text.trim()}
                className="px-6 py-2 rounded-md text-sm font-display font-semibold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
                  color: '#0a0b0d',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-cinzel), serif',
                }}
              >
                Parse Roster
              </button>
              <button
                onClick={() => setText(EXAMPLE)}
                className="px-4 py-2 rounded-md text-sm transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--gold-dim)',
                  color: 'var(--gold-primary)',
                }}
              >
                Load Example
              </button>
            </div>
          </div>
        ) : (
          /* Preview / edit step */
          <div
            className="rounded-md p-6"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'inset 0 1px 0 rgba(200,168,75,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--gold-dim)', paddingBottom: '0.5rem' }}>
              <h2
                className="text-lg font-display"
                style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
              >
                Review Roster — {players.length} players
              </h2>
              <button
                onClick={() => setParsed(false)}
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Back
              </button>
            </div>

            {errors.length > 0 && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{ background: '#1a0a0a', border: '1px solid var(--error)', color: '#f87171' }}>
                <strong>Parse errors ({errors.length}):</strong>
                <ul className="mt-1 space-y-1">
                  {errors.map((e) => (
                    <li key={e.line}>Line {e.line}: {e.reason} — <code className="opacity-70">{e.raw}</code></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="text-left py-2 pr-3 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Name</th>
                    <th className="text-left py-2 pr-3 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Class</th>
                    <th className="text-left py-2 pr-3 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Spec</th>
                    <th className="text-left py-2 pr-3 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Role</th>
                    <th className="text-left py-2 pr-3 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>ilvl</th>
                    <th className="text-left py-2 font-normal font-display" style={{ fontFamily: 'var(--font-cinzel), serif' }}>M+ Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td className="py-2 pr-3">
                        <span style={{ color: CLASS_COLORS[p.class], fontFamily: 'var(--font-cinzel), serif' }} className="text-sm">
                          {p.name}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={p.class}
                          onChange={(e) => updatePlayer(p.id, 'class', e.target.value)}
                          className="text-sm rounded px-1 py-0.5"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: CLASS_COLORS[p.class] }}
                        >
                          {CLASSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={SPECS_BY_CLASS[p.class].includes(p.spec) ? p.spec : SPECS_BY_CLASS[p.class][0]}
                          onChange={(e) => updatePlayer(p.id, 'spec', e.target.value)}
                          className="text-sm rounded px-1 py-0.5"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        >
                          {SPECS_BY_CLASS[p.class].map((s) => (
                            <option key={s} value={s}>{displayName(s)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="capitalize text-xs px-2 py-0.5 rounded" style={{
                          background: p.role === 'tank' ? '#1a3a5c' : p.role === 'healer' ? '#1a3a1a' : '#3a1a1a',
                          color: p.role === 'tank' ? '#60a5fa' : p.role === 'healer' ? '#4ade80' : '#f87171',
                          border: `1px solid ${p.role === 'tank' ? '#2563eb44' : p.role === 'healer' ? '#16a34a44' : '#dc262644'}`,
                        }}>
                          {p.role}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={p.ilvl}
                          onChange={(e) => updatePlayer(p.id, 'ilvl', parseInt(e.target.value) || 0)}
                          className="text-sm rounded px-2 py-0.5 w-16"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          value={p.rating}
                          onChange={(e) => updatePlayer(p.id, 'rating', parseInt(e.target.value) || 0)}
                          className="text-sm rounded px-2 py-0.5 w-20"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => onConfirm(players)}
                disabled={players.length === 0}
                className="px-6 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
                  color: '#0a0b0d',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                  fontFamily: 'var(--font-cinzel), serif',
                }}
              >
                Generate Groups →
              </button>
              <span className="self-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {Math.floor(players.length / 5)} groups · {players.length % 5} bench
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
