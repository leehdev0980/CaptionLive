export type Caption = {
  captionId: string | null;
  sessionId: string | null;
  timestamp: string;
  language: string;
  text: string;
  confidence: number | null;
  speakerId: string | null;
  kind: "partial" | "confirmed";
  noAudio: boolean;
  translationError: boolean;
  speakerName: string | null;
  speakerColor: string | null;
};
