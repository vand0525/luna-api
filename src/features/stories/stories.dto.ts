// generate
export const LENGTHS = ['short', 'medium', 'long'] as const;

export interface GeneratePrompt {
  topic: string;
  mood: string;
  length: typeof LENGTHS[number];
}