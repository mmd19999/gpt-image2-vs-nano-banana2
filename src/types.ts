export type Category = 'fotogercekcilik' | 'yazi' | 'tasarim' | 'karakter' | 'superguc' | 'elyazisi';

export type AspectRatio = '1:1' | '3:4' | '4:3' | '3:2' | '2:3' | '16:9';

export type VoteChoice = 'gpt' | 'banana' | 'tie' | 'skip';

export interface Matchup {
  id: number;
  category: Category;
  aspectRatio: AspectRatio;
  prompt: string;
  references?: string[];
  gpt: string;
  banana: string;
  gptMissing?: boolean;
  bananaMissing?: boolean;
}

export interface MatchupStats {
  gpt: number;
  banana: number;
  tie: number;
  skip: number;
}

export interface LeaderboardData {
  totals: MatchupStats;
  byCategory: Record<Category, MatchupStats>;
  byMatchup: Record<string, MatchupStats>;
  totalVotes: number;
}

export interface UserVote {
  matchupId: number;
  choice: VoteChoice;
  position: { gpt: 'left' | 'right'; banana: 'left' | 'right' };
}
