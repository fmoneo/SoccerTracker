'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, X, Check } from 'lucide-react';
import { EventType, TeamId } from '../lib/types';

interface QuickPlayerModalProps {
  isOpen: boolean;
  teamId: TeamId | null;
  teamName: string;
  eventType: EventType | null;
  onClose: () => void;
  onConfirm: (playerNumber: string) => void;
}

const COMMON_NUMBERS = [
  '1', '2', '3', '4', '5', '6',
  '7', '8', '9', '10', '11', '12',
  '14', '17', '19', '20', '21', '23'
];

export const QuickPlayerModal: React.FC<QuickPlayerModalProps> = ({
  isOpen,
  teamId,
  teamName,
  eventType,
  onClose,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [customNum, setCustomNum] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setCustomNum('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isInside) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [isOpen, onClose]);

  const handleSelect = (num: string) => {
    onConfirm(num ? `#${num}` : '');
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNum.trim()) {
      handleSelect(customNum.trim().replace(/^#/, ''));
    } else {
      handleSelect('');
    }
  };

  if (!isOpen || !teamId || !eventType) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="player-tag-title"
    >
      <div className="modal-content-box" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title" id="player-tag-title">
            <User size={20} color="#06b6d4" />
            <span>Tag Player Number</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close player tag modal"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Select or enter jersey number for {teamName} ({eventType.replace(/_/g, ' ')}):
        </p>

        {/* Quick Numbers Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px',
            margin: '6px 0',
          }}
        >
          {COMMON_NUMBERS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleSelect(num)}
              style={{
                padding: '12px 4px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              #{num}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Other jersey # or name"
            value={customNum}
            onChange={(e) => setCustomNum(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            className="modal-btn primary"
            style={{ minWidth: '80px', padding: '10px' }}
          >
            <Check size={16} />
            <span>OK</span>
          </button>
        </form>

        <button
          type="button"
          className="modal-btn secondary"
          style={{ width: '100%', marginTop: '4px' }}
          onClick={() => handleSelect('')}
        >
          Skip / Log Without Player #
        </button>
      </div>
    </dialog>
  );
};
