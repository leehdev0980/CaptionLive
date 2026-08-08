import type { Caption } from "./types";

export const CAPTION_HUB_URL: string;

export type SessionStatus = "live" | "scheduled" | "ended";

export type SessionDto = {
  sessionId: string;
  title: string;
  status?: string;
  startedAt?: string;
  durationMinutes?: number;
  participantCount?: number;
  wordCount?: number;
  language?: string;
  host?: string;
};

export function fetchSessionCaptions(
  sessionId: string,
  options?: { signal?: AbortSignal },
): Promise<Caption[]>;

export function fetchSessions(
  limit?: number,
  options?: { signal?: AbortSignal },
): Promise<SessionDto[]>;

export function uploadAudioChunk(args: {
  audioBlob: Blob;
  sessionId: string;
  sessionTitle?: string;
  chunkId: number;
}): Promise<unknown>;

export function normalizeCaption(payload: unknown): Caption | null;
