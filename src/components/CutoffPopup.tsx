import { PartyPopper, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

// Shown when the 11:30pm submission cutoff has passed — automatically at
// the cutoff moment, and again whenever a team tries to submit an answer.
export default function CutoffPopup({ onClose }: Props) {
  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div
        className="game-modal panel panel-secondary text-center"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm game-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <PartyPopper size={40} style={{ color: 'var(--fg-purple-strong)', margin: '8px auto 12px', display: 'block' }} />
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>THANK YOU FOR PLAYING!</h2>
        <p style={{ color: 'var(--fg-purple-strong)', fontWeight: 600, marginBottom: 12 }}>
          11:30pm was the cut off, so answers can no longer be submitted.
        </p>
        <p style={{ color: 'var(--color-body-subtle)', marginBottom: 16 }}>
          You can still explore the site and look back over everything your team answered. Any
          questions? Tap Support at the top to message us on WhatsApp.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Cheers!
        </button>
      </div>
    </div>
  );
}
