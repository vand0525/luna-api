// generate
export const LENGTHS = ['short', 'medium', 'long'] as const;

// generate request dto [stories/generate]
export interface GenerateRequest {
  topic: string;
  mood: string;
  length: typeof LENGTHS[number];
}

// generate response dto [stories/generate]
export interface GenerateResponse {
  id: string;
  title: string;
  story: string;
  audioUrl: string;
  durationSeconds: number;
}