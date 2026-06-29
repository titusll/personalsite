import { NextResponse } from "next/server";
import { getSongList } from "@/lib/puzzles";

/**
 * GET /api/songs
 * The autocomplete pool: every song's title + artist, sorted.
 * Exposes the *pool* of possible answers but not *which* is today's —
 * the same trade-off Wordle makes by shipping its full word list.
 */
export function GET() {
  return NextResponse.json(getSongList());
}
