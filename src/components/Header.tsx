'use client';

import React from 'react';
import { Activity, Share2, RotateCcw, Volume2, VolumeX, PlusCircle } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../lib/sound';

interface HeaderProps {
  eventCount: number;
  canUndo: boolean;
  onUndo: () => void;
  onNewMatch: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventCount,
  canUndo,
  onUndo,
  onNewMatch,
  onOpenExport,
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  React.useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  return (
    <header className="top-header" role="banner">
      <div className="brand-section">
        <div className="brand-logo" aria-hidden="true">
          <Activity size={20} />
        </div>
        <div className="brand-text-col">
          <h1 className="brand-title">PITCHPULSE</h1>
          <span className="brand-subtitle">Match Tracker</span>
        </div>

        <div className="sync-status" title="Every button press automatically persists to IndexedDB">
          <span className="pulse-dot" aria-hidden="true" />
          <span className="sync-status-text">IDB {eventCount}</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-btn icon-only"
          onClick={toggleSound}
          title={soundOn ? 'Mute audio cues' : 'Enable audio cues'}
          aria-label={soundOn ? 'Mute audio' : 'Enable audio'}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          type="button"
          className="header-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last recorded event"
          aria-label="Undo last event"
        >
          <RotateCcw size={15} />
          <span className="btn-label-responsive">Undo</span>
        </button>

        <button
          type="button"
          className="header-btn icon-only"
          onClick={onNewMatch}
          title="Start fresh match tracking session"
          aria-label="New match"
        >
          <PlusCircle size={16} />
        </button>

        <button
          type="button"
          className="header-btn primary"
          onClick={onOpenExport}
          title="Export JSON and Share via Device"
          aria-label="Export match data"
        >
          <Share2 size={15} />
          <span className="btn-label-responsive">Export</span>
        </button>
      </div>
    </header>
  );
};
