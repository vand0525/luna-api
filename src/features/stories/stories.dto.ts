// generate
export const LENGTHS = ['short', 'medium', 'long'] as const;
export const NARRATOR_TYPES = ['adaptive', 'default', 'warm', 'soft', 'deep'] as const;

// generate request dto [stories/generate]
export interface GenerateRequest {
  topic: string;
  mood: string;
  narratorType:  typeof NARRATOR_TYPES[number];
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