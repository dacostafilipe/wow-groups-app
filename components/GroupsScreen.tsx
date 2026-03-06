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
import { Session, Player, ActivityEvent } from '@/lib/types';
import { generateGroups, pairsFromGroups } from '@/lib/algorithm';
import { saveSession } from '@/lib/session';
import { DUNGEONS } from '@/data/dungeons';
import GroupPanel from './GroupPanel';
import BenchPanel from './BenchPanel';
import PlayerCard from './PlayerCard';
import ActivityLog from './ActivityLog';
import DungeonSelectModal from './DungeonSelectModal';
import AddPlayerModal from './AddPlayerModal';
import EditPlayerModal from './EditPlayerModal';

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
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [runStarted, setRunStarted] = useState(false);
  const [currentDungeon, setCurrentDungeon] = useState<string | null>(null);
  const [showDungeonTranslations, setShowDungeonTranslations] = useState(false);
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);

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

  function handleRemovePlayer(playerId: string) {
    setConfirmRemoveId(playerId);
  }

  function confirmRemovePlayer() {
    if (!confirmRemoveId) return;
    const updated: Session = {
      ...session,
      players: session.players.filter((p) => p.id !== confirmRemoveId),
      groups: session.groups.map((g) => ({
        ...g,
        players: g.players.filter((p) => p.id !== confirmRemoveId),
      })),
      bench: session.bench.filter((p) => p.id !== confirmRemoveId),
    };
    onSessionChange(updated);
    saveSession(updated);
    setConfirmRemoveId(null);
  }

  function handleEditPlayer(playerId: string) {
    setEditPlayerId(playerId);
  }

  function handleEditConfirm(updated: Player) {
    function replaceInList(list: Player[]) {
      return list.map((p) => p.id === updated.id ? updated : p);
    }
    const updatedSession: Session = {
      ...session,
      players: replaceInList(session.players),
      groups: session.groups.map((g) => ({ ...g, players: replaceInList(g.players) })),
      bench: replaceInList(session.bench),
    };
    onSessionChange(updatedSession);
    saveSession(updatedSession);
    setEditPlayerId(null);
  }

  function handleAddPlayer(player: Player) {
    const updated: Session = {
      ...session,
      players: [...session.players, player],
      bench: [...session.bench, player],
    };
    onSessionChange(updated);
    saveSession(updated);
    setShowAddPlayer(false);
  }

  function handleStartRun() {
    setShowDungeonModal(true);
  }

  function handleDungeonConfirm(dungeon: string) {
    setShowDungeonModal(false);
    const newPairs = pairsFromGroups(session.groups);
    const history = [...new Set([...session.history, ...newPairs])];
    const newRun = session.runCount + 1;
    const event: ActivityEvent = { type: 'run_started', runCount: newRun, timestamp: Date.now(), dungeon };
    const updated: Session = {
      ...session,
      history,
      runCount: newRun,
      activityLog: [...(session.activityLog ?? []), event],
    };
    onSessionChange(updated);
    saveSession(updated);
    setRunStarted(true);
    setCurrentDungeon(dungeon);
    setShowDungeonTranslations(false);
  }

  function handleReshuffle() {
    const newPairs = pairsFromGroups(session.groups);
    const history = [...new Set([...session.history, ...newPairs])];
    const allPlayers = [...session.groups.flatMap((g) => g.players), ...session.bench];
    const { groups, bench } = generateGroups(allPlayers, { history });
    const newRun = session.runCount + 1;
    const event: ActivityEvent = { type: 'reshuffled', runCount: newRun, timestamp: Date.now() };
    const updated: Session = {
      ...session,
      history,
      groups,
      bench,
      runCount: newRun,
      activityLog: [...(session.activityLog ?? []), event],
    };
    onSessionChange(updated);
    saveSession(updated);
    setRunStarted(false);
    setCurrentDungeon(null);
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Top bar */}
      <div
        className="relative flex items-center justify-between px-6 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(10,11,13,0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {currentDungeon && (() => {
          const dungeonData = DUNGEONS.find((d) => d.name === currentDungeon);
          const translations = dungeonData?.translations ?? {};
          const translationEntries = Object.entries(translations);
          return (
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.05em' }}>
                current run
              </span>
              <button
                onClick={() => translationEntries.length > 0 && setShowDungeonTranslations((v) => !v)}
                className="text-sm font-semibold transition-opacity"
                style={{
                  color: 'var(--gold-primary)',
                  fontFamily: 'var(--font-cinzel), serif',
                  cursor: translationEntries.length > 0 ? 'pointer' : 'default',
                }}
              >
                {currentDungeon}
              </button>

              {showDungeonTranslations && translationEntries.length > 0 && (
                <div
                  className="absolute top-full mt-1 rounded-md px-3 py-2 flex flex-col gap-1 z-30"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--gold-dim)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    minWidth: '160px',
                  }}
                >
                  {translationEntries.map(([lang, name]) => (
                    <div key={lang} className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', width: '1.5rem', flexShrink: 0 }}>
                        {lang}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
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
            onClick={() => setShowAddPlayer(true)}
            disabled={runStarted}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-125 active:brightness-75 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            + Add Player
          </button>
          <button
            onClick={handleReshuffle}
            disabled={runStarted}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-125 active:brightness-75 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
            style={{
              background: 'linear-gradient(180deg, var(--gold-dim) 0%, #6b5422 100%)',
              color: '#0a0b0d',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            Reshuffle
          </button>
          <button
            onClick={runStarted ? () => { setRunStarted(false); setCurrentDungeon(null); setShowDungeonTranslations(false); } : handleStartRun}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-125 active:brightness-75 active:scale-[0.97]"
            style={{
              background: runStarted
                ? 'linear-gradient(180deg, #6b2222 0%, #4a1818 100%)'
                : 'linear-gradient(180deg, var(--gold-primary) 0%, var(--gold-dim) 100%)',
              color: runStarted ? '#f87171' : '#0a0b0d',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
              fontFamily: 'var(--font-cinzel), serif',
            }}
          >
            {runStarted ? 'End Run' : 'Start Run'}
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all hover:brightness-125 active:brightness-75 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #7a2020 0%, #561616 100%)',
              color: '#fca5a5',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              fontFamily: 'var(--font-cinzel), serif',
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
              <GroupPanel key={group.id} group={group} index={i} onRemovePlayer={handleRemovePlayer} onEditPlayer={handleEditPlayer} />
            ))}
          </div>

          {/* Right sidebar: bench + activity log */}
          <div className="flex-shrink-0 flex flex-col gap-3" style={{ width: '200px' }}>
            <BenchPanel players={session.bench} onRemovePlayer={handleRemovePlayer} onEditPlayer={handleEditPlayer} />
            <ActivityLog events={session.activityLog ?? []} />
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

      {/* Remove player confirmation */}
      {confirmRemoveId && (() => {
        const player = [...session.groups.flatMap((g) => g.players), ...session.bench]
          .find((p) => p.id === confirmRemoveId);
        return (
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
                Remove Player?
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                {player ? (
                  <><strong style={{ color: 'var(--text-primary)' }}>{player.name}</strong> will be removed from the session.</>
                ) : 'This player will be removed from the session.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmRemovePlayer}
                  className="px-4 py-2 rounded-md text-sm font-semibold"
                  style={{ background: 'var(--error)', color: '#fff', fontFamily: 'var(--font-cinzel), serif' }}
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmRemoveId(null)}
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit player modal */}
      {editPlayerId && (() => {
        const player = [...session.groups.flatMap((g) => g.players), ...session.bench]
          .find((p) => p.id === editPlayerId);
        return player ? (
          <EditPlayerModal
            player={player}
            onConfirm={handleEditConfirm}
            onCancel={() => setEditPlayerId(null)}
          />
        ) : null;
      })()}

      {/* Add player modal */}
      {showAddPlayer && (
        <AddPlayerModal
          onConfirm={handleAddPlayer}
          onCancel={() => setShowAddPlayer(false)}
        />
      )}

      {/* Dungeon select modal */}
      {showDungeonModal && (
        <DungeonSelectModal
          onConfirm={handleDungeonConfirm}
          onCancel={() => setShowDungeonModal(false)}
          usedDungeons={new Set(
            (session.activityLog ?? [])
              .filter((e) => e.type === 'run_started' && e.dungeon)
              .map((e) => e.dungeon!)
          )}
        />
      )}

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
