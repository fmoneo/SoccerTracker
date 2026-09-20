'use client';

import React from 'react';
import { Copy, Share2, Download, X, Check, FileJson } from 'lucide-react';
import { Match, MatchEvent } from '../lib/types';
import { buildExportPayload } from '../lib/stats';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  events: MatchEvent[];
  onShowToast: (message: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  match,
  events,
  onShowToast,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [canShare, setCanShare] = React.useState(false);

  const payload = React.useMemo(() => {
    return buildExportPayload(match, events);
  }, [match, events]);

  const jsonString = React.useMemo(() => {
    return JSON.stringify(payload, null, 2);
  }, [payload]);

  // Check Web Share API capability
  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator) {
      setCanShare(true);
    }
  }, []);

  // Modal open / close synchronization & light-dismiss fallback
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }

    // Fallback for light-dismiss on browsers lacking closedby support
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

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [isOpen, onClose]);

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      onShowToast('Match JSON copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      onShowToast('Could not copy to clipboard');
    }
  };

  // Handle Share via Device (Web Share API)
  const handleShare = async () => {
    const shareTitle = `Match Report: ${match.homeTeam.name} (${payload.summary.home.goals}) vs ${match.awayTeam.name} (${payload.summary.away.goals})`;
    const shareData = {
      title: shareTitle,
      text: jsonString,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onShowToast('Shared successfully!');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Error sharing match:', err);
          onShowToast('Sharing was cancelled or failed');
        }
      }
    } else {
      // Fallback if not supported
      handleCopy();
      onShowToast('Web Share API not supported on this device. Copied JSON instead!');
    }
  };

  // Handle Download JSON File
  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const filename = `match_${match.homeTeam.name}_vs_${match.awayTeam.name}_${new Date().toISOString().slice(0, 10)}.json`
        .toLowerCase()
        .replace(/\s+/g, '_');
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      onShowToast('JSON file downloaded!');
    } catch (err) {
      console.error('Download error:', err);
      onShowToast('Failed to download JSON');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="export-dialog-title"
    >
      <div className="modal-content-box">
        <div className="modal-header">
          <div className="modal-title" id="export-dialog-title">
            <FileJson size={22} color="#06b6d4" />
            <span>Match Log Export</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close export modal"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Clean structured JSON representation of the match, including real-time timestamps,
          match minutes, team statistics, and all chronological events.
        </p>

        {/* JSON Preview Box */}
        <pre className="json-preview-container" tabIndex={0} aria-label="JSON Output">
          <code>{jsonString}</code>
        </pre>

        {/* Actions Row */}
        <div className="modal-actions-row">
          <button
            type="button"
            className="modal-btn primary"
            onClick={handleCopy}
            title="Copy formatted JSON to system clipboard"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            type="button"
            className="modal-btn share"
            onClick={handleShare}
            title={canShare ? 'Share JSON via messaging, email, or AirDrop' : 'Share via Device (Web Share API)'}
          >
            <Share2 size={18} />
            <span>Share via Device</span>
          </button>

          <button
            type="button"
            className="modal-btn secondary"
            onClick={handleDownload}
            title="Save JSON file to device"
          >
            <Download size={18} />
            <span>Download .json</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
