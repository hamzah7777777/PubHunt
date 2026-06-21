export interface Participant {
  id: string;
  full_name: string;
  is_internal: boolean;
  role: 'captain' | 'participant';
}

export interface TeamSession {
  team_id: string;
  team_name: string;
  game_theme: string;
  status: string;
  participants: Participant[];
}

export interface AdminTeam {
  id: string;
  name: string;
  game_theme: string;
  pin: string;
  status: string;
  created_at: string;
}

export interface AdminParticipant {
  id: string;
  team_id: string;
  full_name: string;
  is_internal: boolean;
  role: 'captain' | 'participant';
  row_order: number;
}
