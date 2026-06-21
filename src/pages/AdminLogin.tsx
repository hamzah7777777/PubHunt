import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: Props) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: isValid, error: rpcError } = await supabase.rpc('verify_admin_passphrase', {
      p_passphrase: passphrase,
    });

    if (rpcError || !isValid) {
      setLoading(false);
      sfx.playError();
      setError('You Shall not Pass!');
      return;
    }

    const { error: authError } = await supabase.auth.signInAnonymously();

    setLoading(false);

    if (authError) {
      sfx.playError();
      setError(authError.message);
      return;
    }

    sfx.playPowerUp();
    onLogin();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="admin-login-back-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="panel panel-dark">
        <span className="kicker kicker-white">Host Access</span>
        <h2 style={{ color: 'var(--color-white)', marginBottom: 16 }}>Admin Login</h2>

        <label className="game-label" htmlFor="admin-passphrase" style={{ color: 'rgba(255,255,255,0.85)' }}>Passphrase</label>
        <input
          id="admin-passphrase"
          type="password"
          className="game-input"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          required
          autoFocus
        />
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      <button id="admin-login-submit-btn" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? 'Checking…' : 'Sign In'}
      </button>
    </form>
  );
}
