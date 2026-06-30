import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEvent } from '../lib/useEvent';
import { CLUB } from '../lib/club';
import { getEventSlug } from '../lib/urls';
import { Button, Card, ErrorText, FieldLabel, Input } from '../components/ui';

export default function JoinPage() {
  const slug = getEventSlug();
  const event = useEvent(slug);

  if (event === undefined) return null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center gap-1 border-b border-neutral-100 pb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-900">
            Toastmasters International
          </p>
          <p className="text-lg font-semibold text-neutral-900">{CLUB.name}</p>
          <p className="text-xs text-neutral-400">
            Club {CLUB.clubNumber} &middot; Area {CLUB.area}
          </p>
        </div>

        {event === null ? (
          <p className="pt-5 text-center text-sm text-neutral-500">
            This sign-up link isn&apos;t valid. Please check with your host.
          </p>
        ) : (
          <SignupForm eventId={event.id} eventName={event.name} />
        )}

        <div className="mt-6 border-t border-neutral-100 pt-4 text-center text-xs text-neutral-400">
          <p>{CLUB.meetingTimes}</p>
          {CLUB.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Card>
    </main>
  );
}

function SignupForm({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'joined' | 'already'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from('signups')
      .insert({ event_id: eventId, email: email.trim().toLowerCase() });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        setStatus('already');
        return;
      }
      setError('Something went wrong, please try again.');
      return;
    }
    setStatus('joined');
  }

  if (status === 'joined' || status === 'already') {
    return (
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <span className="text-3xl">✓</span>
        <p className="font-medium text-neutral-900">
          {status === 'joined' ? "You're on the list!" : "You're already on the list!"}
        </p>
        <p className="text-sm text-neutral-500">
          Thanks for visiting {eventName}. We&apos;ll keep you posted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-5">
      <p className="text-sm text-neutral-500">
        Thanks for visiting! Leave your email below to stay in touch with{' '}
        {CLUB.name}.
      </p>
      <p className="text-center text-lg font-bold text-red-600">
        Please use your work email!
      </p>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Email address</FieldLabel>
        <Input
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Join mailing list'}
      </Button>
    </form>
  );
}
