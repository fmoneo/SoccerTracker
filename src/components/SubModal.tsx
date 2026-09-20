'use client';

import React from 'react';
import { ArrowLeftRight, X, Check } from 'lucide-react';
import { TeamId } from '../lib/types';

interface SubModalProps {
  isOpen: boolean;
  teamId: TeamId | null;
  teamName: string;
  onClose: () => void;
  onSubmitSub: (teamId: TeamId, subIn: string, subOut: string) => void;
}

export const SubModal: React.FC<SubModalProps> = ({
  isOpen,
  teamId,
  teamName,
  onClose,
  onSubmitSub,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [subOut, setSubOut] = React.useState('');
  const [subIn, setSubIn] = React.useState('');

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setSubOut('');
      setSubIn('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;
    onSubmitSub(teamId, subIn.trim() || 'Sub In', subOut.trim() || 'Sub Out');
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="sub-dialog-title"
    >
      <div className="modal-content-box" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title" id="sub-dialog-title">
            <ArrowLeftRight size={20} color="#a855f7" />
            <span>Substitution ({teamName})</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close substitution modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Player Coming OFF (Out):
            </label>
            <input
              type="text"
              placeholder="e.g. #9 Smith"
              value={subOut}
              onChange={(e) => setSubOut(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Player Coming ON (In):
            </label>
            <input
              type="text"
              placeholder="e.g. #14 Davis"
              value={subIn}
              onChange={(e) => setSubIn(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              className="modal-btn primary"
              style={{ flex: 1 }}
            >
              <Check size={16} />
              <span>Record Sub</span>
            </button>
            <button
              type="button"
              className="modal-btn secondary"
              onClick={() => {
                if (teamId) onSubmitSub(teamId, 'Player In', 'Player Out');
                onClose();
              }}
            >
              Quick Log
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
