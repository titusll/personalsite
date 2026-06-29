import { puzzles, type Puzzle } from "@/lib/puzzles";

/** Fixed "day zero". Day index counts whole days since this UTC midnight. */
const EPOCH = Date.UTC(2026, 0, 1); // 2026-01-01T00:00:00Z
const MS_PER_DAY = 86_400_000;

/**
 * Whole days elapsed since EPOCH, in UTC.
 * Same value for every visitor on a given UTC date → same daily puzzle.
 * (Trade-off: rollover is midnight UTC, not the player's local midnight.)
 */
export function getDayIndex(now: number = Date.now()): number {
  return Math.floor((now - EPOCH) / MS_PER_DAY);
}

export type TodaysPuzzle = {
  puzzle: Puzzle;
  /** 1-based number shown to the player (e.g. "Puzzle #181"). */
  puzzleNumber: number;
  /** ISO date (UTC) the puzzle is for. */
  date: string;
};

/** Resolve which puzzle is "today's", wrapping around the list with %. */
export function getTodaysPuzzle(now: number = Date.now()): TodaysPuzzle {
  const dayIndex = getDayIndex(now);
  const puzzle = puzzles[((dayIndex % puzzles.length) + puzzles.length) % puzzles.length];
  return {
    puzzle,
    puzzleNumber: dayIndex + 1,
    date: new Date(now).toISOString().slice(0, 10),
  };
}
