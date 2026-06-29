import { NextRequest, NextResponse } from "next/server";
import { getTodaysPuzzle } from "@/lib/daily";
import { isCorrectGuess, MAX_GUESSES } from "@/lib/puzzles";

export const dynamic = "force-dynamic";

/**
 * POST /api/guess  body: { guess: string, guessNumber: number }
 * Validates the guess server-side. The answer is returned ONLY when the
 * game is over (correct guess, or the final guess used) — this is what
 * keeps the answer out of the page source until the player is done.
 */
export async function POST(req: NextRequest) {
  const { puzzle } = getTodaysPuzzle();

  let body: { guess?: string; guessNumber?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const guess = typeof body.guess === "string" ? body.guess : "";
  const guessNumber = Number(body.guessNumber) || 0;

  const correct = isCorrectGuess(puzzle, guess);
  const outOfTries = guessNumber >= MAX_GUESSES;
  const gameOver = correct || outOfTries;

  return NextResponse.json({
    correct,
    gameOver,
    ...(gameOver
      ? { answer: { title: puzzle.title, artist: puzzle.artist } }
      : {}),
  });
}
