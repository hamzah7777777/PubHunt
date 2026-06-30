import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Event } from './types';

export function useEvent(slug: string) {
  const [event, setEvent] = useState<Event | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('events')
      .select('id, slug, name, created_at')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => setEvent(data));
  }, [slug]);

  if (!slug) return null;
  return event;
}
