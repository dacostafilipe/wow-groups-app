'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Player, WowClass } from '@/lib/types';
import { SPECS_BY_CLASS, getRoleFromSpec } from '@/data/wow';

const WOW_CLASSES: WowClass[] = [
  'DeathKnight', 'DemonHunter', 'Druid', 'Evoker', 'Hunter',
  'Mage', 'Monk', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior',
];

// "DeathKnight" → "Death Knight", "BeastMastery" → "Beast Mastery"
function displayName(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').trim();
}

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  caretColor: 'var(--gold-primary)',
} as const;

interface Props {
  onConfirm: (player: Player) => void;
  onCancel: () => void;
}

export default function AddPlayerModal({ onConfirm, onCancel }: Props) {
  const [name, setName]     = useState('');
  const [cls, setCls]       = useState<WowClass>('Warrior');
  const [spec, setSpec]     = useState(SPECS_BY_CLASS['Warrior'][0]);
  const [ilvl, setIlvl]     = useState('');
  const [rating, setRating] = useState('');

  function handleClassChange(newCls: WowClass) {
    setCls(newCls);
    setSpec(SPECS_BY_CLASS[newCls][0]);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onConfirm({
      id: uuidv4(),
      name: name.trim(),
      class: cls,
      spec,
      role: getRoleFromSpec(cls, spec),
      ilvl: parseInt(ilvl) || 0,
      rating: parseInt(rating) || 0,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="rounded-md w-full max-w-sm flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-dim)',
          boxShadow: '0 0 60px rgba(200,168,75,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
          >
            Add Player
          </h2>
          <button onClick={onCancel} className="text-lg leading-none" style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          {/* Class */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Class</label>
            <select
              value={cls}
              onChange={(e) => handleClassChange(e.target.value as WowClass)}
              className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none"
              style={inputStyle}
            >
              {WOW_CLASSES.map((c) => (
                <option key={c} value={c}>{displayName(c)}</option>
              ))}
            </select>
          </div>

          {/* Spec */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Spec</label>
            <select
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none"
              style={inputStyle}
            >
              {SPECS_BY_CLASS[cls].map((s) => (
                <option key={s} value={s}>{displayName(s)}</option>
              ))}
            </select>
          </div>

          {/* iLvl + Rating */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Item Level <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                type="number"
                value={ilvl}
                placeholder="0"
                onChange={(e) => setIlvl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>M+ Rating <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                type="number"
                value={rating}
                placeholder="0"
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex justify-end gap-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-1.5 rounded-md text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
              color: '#0a0b0d',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            Add Player
          </button>
        </div>
      </div>
    </div>
  );
}
