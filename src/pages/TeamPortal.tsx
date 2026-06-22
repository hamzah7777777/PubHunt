import { useRef, useState } from 'react';
import { ArrowLeft, Award, Camera, Gamepad2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { compressImage } from '../lib/imageCompression';
import type { TeamSession } from '../types';

interface Props {
  session: TeamSession;
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  tbc: 'Team Name TBC',
  withdrawn: 'Withdrawn',
};

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const TARGET_PHOTO_BYTES = 2 * 1024 * 1024;

export default function TeamPortal({ session, onLogout }: Props) {
  const captain = session.participants.find(p => p.role === 'captain');
  const members = session.participants.filter(p => p.role !== 'captain');

  const [photoUrl, setPhotoUrl] = useState(session.team_photo_url);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    console.log('[Photo Upload] File selected:', { name: file.name, size: file.size, type: file.type });

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setPhotoError('Image is too large (max 20MB).');
      return;
    }

    setUploading(true);
    setPhotoError('');
    setUploadProgress(2);
    setUploadLabel('COMPRESSING…');

    let compressed: Blob;
    try {
      compressed = await compressImage(file, TARGET_PHOTO_BYTES, fraction => {
        setUploadProgress(Math.min(70, Math.round(fraction * 70)));
      });
    } catch {
      setUploading(false);
      sfx.playError();
      setPhotoError('Could not process image. Please try a different photo.');
      return;
    }

    setUploadLabel('UPLOADING…');
    const progressTimer = window.setInterval(() => {
      setUploadProgress(p => (p < 92 ? p + 2 : p));
    }, 150);

    const path = `${session.team_id}/team.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('team-photos')
      .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });

    window.clearInterval(progressTimer);

    if (uploadError) {
      setUploading(false);
      sfx.playError();
      console.error('[Photo Upload] Storage upload failed:', uploadError);
      setPhotoError('Upload failed. Please try again.');
      return;
    }

    console.log('[Photo Upload] Storage upload successful');

    const { data: publicUrlData } = supabase.storage.from('team-photos').getPublicUrl(path);
    const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: rpcError } = await supabase.rpc('set_team_photo', {
      p_team_id: session.team_id,
      p_photo_url: newUrl,
    });

    if (rpcError) {
      setUploading(false);
      sfx.playError();
      console.error('[Photo Upload] RPC call failed:', rpcError);
      setPhotoError('Could not save photo. Please try again.');
      return;
    }

    setUploadProgress(100);
    setUploadLabel('DONE!');
    sfx.playPowerUp();
    setPhotoUrl(newUrl);
    window.setTimeout(() => setUploading(false), 400);
  };

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="team-portal-logout-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onLogout}>
        <ArrowLeft size={16} /> Log out
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">{STATUS_LABEL[session.status] || session.status}</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>{session.team_name}</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Gamepad2 size={18} />
          <span>{session.game_theme}</span>
        </div>
      </div>

      <div className="panel text-center">
        <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
          <Camera size={20} style={{ color: 'var(--brand)' }} />
          <h3 style={{ marginBottom: 0 }}>Team Photo</h3>
        </div>

        {photoUrl && (
          <img
            src={photoUrl}
            alt={`${session.team_name} team photo`}
            style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--radius-base)', border: '2px solid var(--border-default)', marginBottom: 16 }}
          />
        )}

        {photoError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>{photoError}</span>
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <span className="game-loadbar-label">{uploadLabel} {uploadProgress}%</span>
            <div className="game-loadbar">
              <div className="game-loadbar-track">
                <div className="game-loadbar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoSelect}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            id="team-portal-camera-photo-btn"
            className="btn btn-secondary"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={16} /> Take Photo
          </button>
          <button
            type="button"
            id="team-portal-upload-photo-btn"
            className="btn btn-primary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} /> {uploading ? 'Working…' : photoUrl ? 'Replace Photo' : 'Upload Team Photo'}
          </button>
        </div>
      </div>

      {captain && (
        <div className="panel panel-tertiary">
          <span className="kicker">Team Captain</span>
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <h3 style={{ marginBottom: 0 }}>{captain.full_name}</h3>
            <span className={`badge ${captain.is_internal ? 'badge-success' : 'badge-brand'}`}>
              {captain.is_internal ? 'Internal' : 'External'}
            </span>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
          <Users size={20} style={{ color: 'var(--brand)' }} />
          <h3 style={{ marginBottom: 0 }}>Team Members ({members.length})</h3>
        </div>

        <div className="flex flex-col gap-12">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
              <span>{m.full_name}</span>
              <span className={`badge ${m.is_internal ? 'badge-success' : 'badge-brand'}`}>
                {m.is_internal ? 'Internal' : 'External'}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p style={{ color: 'var(--color-body-subtle)' }}>No other members listed yet.</p>
          )}
        </div>
      </div>

      <div className="panel panel-secondary flex items-center gap-12">
        <Award size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <p style={{ marginBottom: 0, fontSize: 15 }}>
          Got a change to your lineup or fancy dress theme? Ask your captain to message Chris Duncan, Lily Price or Jodie Calvert on Teams.
        </p>
      </div>
    </div>
  );
}
