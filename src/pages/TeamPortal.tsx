import { useRef, useState } from 'react';
import { ArrowLeft, Award, Camera, Gamepad2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { compressImage } from '../lib/imageCompression';
import type { TeamSession } from '../types';

interface Props {
  session: TeamSession;
  onLogout: () => void;
  onStartGame: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  tbc: 'Team Name TBC',
  withdrawn: 'Withdrawn',
};

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const TARGET_PHOTO_BYTES = 2 * 1024 * 1024;

export default function TeamPortal({ session, onLogout, onStartGame }: Props) {
  const captain = session.participants.find(p => p.role === 'captain');
  const members = session.participants.filter(p => p.role !== 'captain');
  const totalMembers = members.length + (captain ? 1 : 0);

  const [photoUrl, setPhotoUrl] = useState(session.team_photo_url);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
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
          {!photoUrl && (
            <button
              type="button"
              id="team-portal-camera-photo-btn"
              className="btn btn-secondary"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={16} /> Take Photo
            </button>
          )}
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

      <div className="panel">
        <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
          <Users size={20} style={{ color: 'var(--brand)' }} />
          <h3 style={{ marginBottom: 0 }}>Team Members ({totalMembers})</h3>
        </div>

        <div className="flex flex-col gap-12">
          {captain && (
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
              <span>{captain.full_name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-warning">Captain</span>
                <span className={`badge ${captain.is_internal ? 'badge-success' : 'badge-brand'}`} style={{ marginLeft: 8 }}>
                  {captain.is_internal ? 'Internal' : 'External'}
                </span>
              </div>
            </div>
          )}
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

      <div className="panel panel-secondary">
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%' }}
          onClick={() => setShowInstructions(prev => !prev)}
        >
          Instructions
        </button>

        {showInstructions && (
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <h3 style={{ marginBottom: 12 }}>Instructions (Please read carefully if this is your first time!)</h3>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.75 }}>
              <li>Follow the clues to visit each pub in order, and then head to the final venue (wristbands needed)</li>
              <li>Complete the en-route challenges</li>
              <li>Answer Questions about the starting venue and each pub you visit</li>
              <li>Complete the video game quiz (Five Rounds), including finding out the names of all the other teams and writing them next to the correct picture.</li>
              <li>Remember to EAT along the way.</li>
              <li>Enjoy yourself (within reason)</li>
              <li>You'll visit three pubs in total, then the final venue where there will be a disco and you can hand in your quiz</li>
              <li>We have private hire of the venue from 10pm and access is with a pubhunt wristband only.</li>
            </ol>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        style={{
          background: '#44b649',
          borderColor: '#2f7f31',
          color: '#f6fffb',
          minHeight: 60,
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
        }}
        onClick={onStartGame}
      >
        START GAME
      </button>

      <div className="panel panel-secondary flex items-center gap-12">
        <Award size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <p style={{ marginBottom: 0, fontSize: 15 }}>
          Got a change to your lineup or fancy dress theme? Ask your captain to message Chris Duncan, Lily Price or Jodie Calvert on Teams.
        </p>
      </div>
    </div>
  );
}
