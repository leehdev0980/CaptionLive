export interface Participant {
  id: string;
  name: string;
  initials: string;
  role: "host" | "speaker" | "listener";
  color: string;
}

export interface CaptionLine {
  id: string;
  speakerId: string;
  text: string;
  timestamp: string;
  confidence: number;
}

export interface Session {
  id: string;
  title: string;
  status: "live" | "scheduled" | "ended";
  startedAt: string;
  durationMinutes: number;
  participantCount: number;
  wordCount: number;
  language: string;
  host: string;
}

export const participants: Participant[] = [
  {
    id: "u1",
    name: "Alex Muiruri",
    initials: "AM",
    role: "host",
    color: "oklch(0.82 0.22 152)",
  },
  {
    id: "u2",
    name: "Sam Oyuuh",
    initials: "SO",
    role: "speaker",
    color: "oklch(0.72 0.18 260)",
  },
  {
    id: "u3",
    name: "Priya Nair",
    initials: "PN",
    role: "speaker",
    color: "oklch(0.75 0.2 30)",
  },
  {
    id: "u4",
    name: "Diego Rojas",
    initials: "DR",
    role: "listener",
    color: "oklch(0.7 0.18 320)",
  },
  {
    id: "u5",
    name: "Wanjiku K.",
    initials: "WK",
    role: "listener",
    color: "oklch(0.78 0.16 190)",
  },
];

export const demoCaptions: CaptionLine[] = [
  {
    id: "c1",
    speakerId: "u1",
    text: "Alright everyone, welcome to today's product review. We'll walk through the Q3 roadmap and then open the floor for questions.",
    timestamp: "00:00:04",
    confidence: 0.98,
  },
  {
    id: "c2",
    speakerId: "u2",
    text: "Thanks Alex. Before we dive in — is the transcript being shared with the engineering channel automatically?",
    timestamp: "00:00:19",
    confidence: 0.96,
  },
  {
    id: "c3",
    speakerId: "u1",
    text: "Yes, it's mirrored in real time. Anyone with the session link sees the same stream you're seeing now.",
    timestamp: "00:00:31",
    confidence: 0.99,
  },
  {
    id: "c4",
    speakerId: "u3",
    text: "Great. I'd like to flag that our latency numbers came in under 900 milliseconds end to end across the last three test runs.",
    timestamp: "00:00:47",
    confidence: 0.94,
  },
  {
    id: "c5",
    speakerId: "u2",
    text: "That's a solid improvement. What model size are we running on the Whisper micro-service right now?",
    timestamp: "00:01:02",
    confidence: 0.97,
  },
  {
    id: "c6",
    speakerId: "u3",
    text: "Small English for the live path, and Medium multilingual for the archive re-transcription pass.",
    timestamp: "00:01:14",
    confidence: 0.95,
  },
];

export const upcomingLine =
  "Perfect. Let's move on to accessibility — I want to make sure the caption font scaling ships in the next release.";

export const sessions: Session[] = [
  {
    id: "s-01H",
    title: "Q3 Product Review",
    status: "live",
    startedAt: "Today · 10:04",
    durationMinutes: 22,
    participantCount: 12,
    wordCount: 3184,
    language: "English",
    host: "Alex Muiruri",
  },
  {
    id: "s-02H",
    title: "Engineering Standup",
    status: "scheduled",
    startedAt: "Today · 14:00",
    durationMinutes: 0,
    participantCount: 8,
    wordCount: 0,
    language: "English",
    host: "Priya Nair",
  },
  {
    id: "s-03H",
    title: "CS Faculty Seminar — Distributed Systems",
    status: "ended",
    startedAt: "Yesterday · 09:00",
    durationMinutes: 74,
    participantCount: 38,
    wordCount: 11402,
    language: "English",
    host: "Dr. Jane Smith",
  },
  {
    id: "s-04H",
    title: "Design Critique — Caption Overlay",
    status: "ended",
    startedAt: "Mon · 16:30",
    durationMinutes: 45,
    participantCount: 6,
    wordCount: 6710,
    language: "English",
    host: "Sam Oyuuh",
  },
  {
    id: "s-05H",
    title: "Multilingual QA Session",
    status: "ended",
    startedAt: "Sun · 11:15",
    durationMinutes: 58,
    participantCount: 14,
    wordCount: 8930,
    language: "Swahili · English",
    host: "Wanjiku K.",
  },
];

export function getParticipant(id: string) {
  return participants.find((p) => p.id === id) ?? participants[0];
}

export function getSession(id: string) {
  return sessions.find((s) => s.id === id);
}
