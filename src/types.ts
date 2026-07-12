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
  route: string;
  participants: Participant[];
  // The PIN the team logged in with. Optional: sessions saved before this
  // field existed won't have it until the team next logs in.
  pin?: string;
}

// Facebook photo/video challenge: marked from the Facebook group, no
// in-app submission. null = not checked, true/false = uploaded or not.
export interface FacebookMark {
  id: string;
  team_id: string;
  team_photo: boolean | null;
  selection_video: boolean | null;
  scene_video: boolean | null;
}

export interface AdminTeam {
  id: string;
  name: string;
  game_theme: string;
  pin: string;
  status: string;
  route: string;
  // Admin-uploaded cover image; null falls back to the theme-based cover.
  cover_url: string | null;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  team_id: string;
  quiz_number: number;
  question_number: number;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface PhotoAnswer {
  id: string;
  team_id: string;
  photo_number: number;
  character_answer: string;
  game_answer: string;
  character_correct: boolean | null;
  game_correct: boolean | null;
  submitted_at: string;
}

export interface AnagramAnswer {
  id: string;
  team_id: string;
  anagram_number: number;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface ConsoleAnswer {
  id: string;
  team_id: string;
  console_number: number;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface BrainTrainingAnswer {
  id: string;
  team_id: string;
  question_number: number;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface MissingVowelsAnswer {
  id: string;
  team_id: string;
  puzzle_number: number;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface TeamClashAnswer {
  id: string;
  team_id: string;
  target_team_id: string;
  answer: string;
  is_correct: boolean | null;
  submitted_at: string;
}

export interface AdminParticipant {
  id: string;
  team_id: string;
  full_name: string;
  is_internal: boolean;
  role: 'captain' | 'participant';
  row_order: number;
}
