'use client';

import { useState, useEffect } from 'react';
import { Session, Player } from '@/lib/types';
import { loadSession, saveSession, clearSession, emptySession } from '@/lib/session';
import { generateGroups } from '@/lib/algorithm';
import ImportScreen from '@/components/ImportScreen';
import GroupsScreen from '@/components/GroupsScreen';

type Screen = 'import' | 'groups';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('import');
  const [session, setSession] = useState<Session>(emptySession());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.players.length > 0) {
      setSession(saved);
      setScreen('groups');
    }
    setHydrated(true);
  }, []);

  function handleConfirmRoster(players: Player[]) {
    const { groups, bench } = generateGroups(players, { history: [] });
    const newSession: Session = {
      ...emptySession(),
      players,
      groups,
      bench,
    };
    setSession(newSession);
    saveSession(newSession);
    setScreen('groups');
  }

  function handleSessionChange(updated: Session) {
    setSession(updated);
    saveSession(updated);
  }

  function handleReset() {
    clearSession();
    setSession(emptySession());
    setScreen('import');
  }

  if (!hydrated) return null;

  if (screen === 'import') {
    return <ImportScreen onConfirm={handleConfirmRoster} />;
  }

  return (
    <GroupsScreen
      session={session}
      onSessionChange={handleSessionChange}
      onReset={handleReset}
    />
  );
}
