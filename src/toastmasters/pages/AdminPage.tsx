import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { makeSlug } from '../lib/slug';
import { downloadTextFile } from '../lib/download';
import { displayUrl, joinUrl } from '../lib/urls';
import {
  Brand,
  Button,
  Card,
  ErrorText,
  FieldLabel,
  Input,
} from '../components/ui';

type EventRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) return null;
  return session ? <AdminDashboard /> : <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setSubmitting(false);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-1 flex flex-col items-center gap-2 text-center">
            <Brand />
            <p className="text-sm text-neutral-500">Sign in to manage events</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

function AdminDashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id, slug, name, created_at')
        .order('created_at', { ascending: false });
      const list = data ?? [];
      setEvents(list);
      setLoading(false);

      const entries = await Promise.all(
        list.map(async (event) => {
          const { count } = await supabase
            .from('signups')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          return [event.id, count ?? 0] as const;
        }),
      );
      setCounts(Object.fromEntries(entries));
    })();
  }, []);

  function handleCreated(event: EventRow) {
    setEvents((prev) => [event, ...prev]);
    setCounts((prev) => ({ ...prev, [event.id]: 0 }));
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <Brand />
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      <CreateEventForm onCreated={handleCreated} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-neutral-500">Events</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No events yet — create one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  count={counts[event.id] ?? 0}
                  onDeleted={() => handleDeleted(event.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function CreateEventForm({ onCreated }: { onCreated: (event: EventRow) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase
      .from('events')
      .insert({ slug: makeSlug(name), name })
      .select('id, slug, name, created_at')
      .single();
    if (error || !data) {
      setError(error?.message ?? 'Failed to create event');
    } else {
      setName('');
      onCreated(data);
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="font-medium text-neutral-900">New event</h2>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Event name</FieldLabel>
          <Input
            placeholder="e.g. 9 July 2026 Meeting"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? 'Creating...' : 'Create event'}
        </Button>
      </form>
    </Card>
  );
}

function EventCard({
  event,
  count,
  onDeleted,
}: {
  event: EventRow;
  count: number;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(joinUrl(event.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleExport() {
    setExporting(true);
    const { data, error } = await supabase
      .from('signups')
      .select('email')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });
    setExporting(false);
    if (error || !data) {
      window.alert('Could not export emails, please try again.');
      return;
    }
    downloadTextFile(
      `${event.slug}-emails.txt`,
      data.map((row) => row.email),
    );
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete the event "${event.name}"? This removes its QR link and all ${count} collected email(s) permanently.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', event.id);
    if (error) {
      window.alert('Could not delete event, please try again.');
      setDeleting(false);
      return;
    }
    onDeleted();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">{event.name}</p>
          <p className="text-sm text-neutral-500">
            {count} signup{count === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={displayUrl(event.slug)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Display QR</Button>
          </a>
          <Button variant="secondary" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy join link'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export emails (.txt)'}
          </Button>
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
