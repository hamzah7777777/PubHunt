export type Event = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

export type Signup = {
  id: string;
  event_id: string;
  email: string;
  created_at: string;
};
