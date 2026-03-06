'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Session, Player } from '@/lib/types';
import { generateGroups, pairsFromGroups } from '@/lib/algorithm';
import { saveSession } from '@/lib/session';
import GroupPanel from './GroupPanel';
import BenchPanel from './BenchPanel';
import PlayerCard from './PlayerCard';

const BENCH_ID = 'bench';

interface Props {
  session: Session;
  onSessionChange: (s: Session) => void;
  onReset: () => void;
}

function findContainer(session: Session, playerId: string): string | null {
  for (const g of session.groups) {
    if (g.players.find((p) => p.id === playerId)) return g.id;
  }
  if (session.bench.find((p) => p.id === playerId)) return BENCH_ID;
  return null;
}

function getPlayersForContainer(session: Session, containerId: string): Player[] {
  if (containerId === BENCH_ID) return session.bench;
  return session.groups.find((g) => g.id === containerId)?.players ?? [];
}

export default function GroupsScreen({ session, onSessionChange, onReset }: Props) {
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const all = [...session.groups.flatMap((g) => g.players), ...session.bench];
    setActivePlayer(all.find((p) => p.id === id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(session, activeId);
    if (!activeContainer) return;

    // Determine target container
    let overContainer = findContainer(session, overId);
    if (!overContainer) {
      // Dropped onto a container droppable directly
      overContainer = overId;
    }

    if (activeContainer === overContainer) return;

    const activeItems = getPlayersForContainer(session, activeContainer);
    const overItems = getPlayersForContainer(session, overContainer);

    const activeIndex = activeItems.findIndex((p) => p.id === activeId);
    const overIndex = overItems.findIndex((p) => p.id === overId);
    const newIndex = overIndex >= 0 ? overIndex : overItems.length;

    const newSession = movePlayer(session, activeId, activeContainer, overContainer, activeIndex, newIndex);
    onSessionChange(newSession);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePlayer(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(session, activeId);
    if (!activeContainer) return;

    let overContainer = findContainer(session, overId);
    if (!overContainer) overContainer = overId;

    if (activeContainer === overContainer) {
      // Reorder within same container
      const items = getPlayersForContainer(session, activeContainer);
      const oldIndex = items.findIndex((p) => p.id === activeId);
      const newIndex = items.findIndex((p) => p.id === overId);
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(items, oldIndex, newIndex);
      const newSession = setContainerPlayers(session, activeContainer, reordered);
      onSessionChange(newSession);
      return;
    }

    // Cross-container move already handled in dragOver; just persist
    saveSession(session);
  }

  function movePlayer(
    s: Session,
    _playerId: string,
    from: string,
    to: string,
    fromIndex: number,
    toIndex: number,
  ): Session {
    const fromItems = [...getPlayersForContainer(s, from)];
    const toItems = [...getPlayersForContainer(s, to)];

    const [moved] = fromItems.splice(fromIndex, 1);
    toItems.splice(toIndex, 0, moved);

    let result = setContainerPlayers(s, from, fromItems);
    result = setContainerPlayers(result, to, toItems);
    return result;
  }

  function setContainerPlayers(s: Session, containerId: string, players: Player[]): Session {
    if (containerId === BENCH_ID) {
      return { ...s, bench: players };
    }
    return {
      ...s,
      groups: s.groups.map((g) =>
        g.id === containerId ? { ...g, players } : g
      ),
    };
  }

  function handleStartRun() {
    const newPairs = pairsFromGroups(session.groups);
    const history = [...new Set([...session.history, ...newPairs])];
    const updated: Session = { ...session, history, runCount: session.runCount + 1 };
    onSessionChange(updated);
    saveSession(updated);
  }

  function handleReshuffle() {
    const { groups, bench } = generateGroups(session.players, {
      history: session.history,
    });
    const updated: Session = { ...session, groups, bench };
    onSessionChange(updated);
    saveSession(updated);
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(10,11,13,0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-semibold"
            style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}
          >
            wow-groups
          </h1>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
            Run #{session.runCount}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {session.players.length} players
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReshuffle}
            className="px-4 py-1.5 rounded-md text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid var(--gold-dim)',
              color: 'var(--gold-primary)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            Reshuffle
          </button>
          <button
            onClick={handleStartRun}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
              color: '#0a0b0d',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            Start Run
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-1.5 rounded-md text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid #5a1e1e',
              color: '#a05050',
              fontFamily: 'var(--font-cinzel), serif',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--error)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#5a1e1e';
              (e.currentTarget as HTMLButtonElement).style.color = '#a05050';
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4 overflow-x-auto items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Groups grid */}
          <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {session.groups.map((group, i) => (
              <GroupPanel key={group.id} group={group} index={i} />
            ))}
          </div>

          {/* Bench sidebar */}
          <div className="flex-shrink-0">
            <BenchPanel players={session.bench} />
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activePlayer && (
              <div style={{ width: '196px', opacity: 0.95 }}>
                <PlayerCard player={activePlayer} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-md p-6 max-w-sm w-full mx-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--error)',
              boxShadow: '0 0 40px rgba(196,30,58,0.3)',
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-cinzel), serif' }}>
              Reset Session?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              This will clear all groups, players, and run history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
                className="px-4 py-2 rounded-md text-sm font-semibold"
                style={{ background: 'var(--error)', color: '#fff', fontFamily: 'var(--font-cinzel), serif' }}
              >
                Reset Session
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-md text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
