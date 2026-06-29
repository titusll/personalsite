import puzzlesData from "@/data/puzzles.json";

export const MAX_GUESSES = 6;

export type Puzzle = {
  id: string;
  title: string;
  artist: string;
  lines: string[];
  acceptedAnswers: string[];
};

export const puzzles: Puzzle[] = puzzlesData as Puzzle[];

/**
 * Normalise a string for fuzzy answer matching:
 * lowercase, strip punctuation, collapse whitespace.
 * Used on BOTH the player's guess and the accepted answers so that
 * "My Own Summer!" matches "my own summer".
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, "") // drop punctuation/symbols
    .replace(/\s+/g, " ")
    .trim();
}

/** True if the guess matches any accepted answer for the puzzle. */
export function isCorrectGuess(puzzle: Puzzle, guess: string): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return puzzle.acceptedAnswers.some((a) => normalize(a) === g);
}

/** The autocomplete pool — exposes the song list but not which is today's. */
export function getSongList(): { title: string; artist: string }[] {
  return puzzles
    .map((p) => ({ title: p.title, artist: p.artist }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
