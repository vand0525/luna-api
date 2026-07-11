import * as DTO from "./stories.dto";
import * as TYPES from "./stories.types";
import * as gemini from "../../shared/gemini.service";

// Story beats
export async function outliner(
  request: DTO.GenerateRequest
): Promise<TYPES.StoryOutline> {
  const systemInstruction = `
    You are a fiction story outliner.

    Create a clear sequence of story beats for a soothing bedtime story
    intended for adults.

    Avoid childish themes, excessive conflict, disturbing content, and
    mature or sexual content.
  `;

  const contents = `
    Topic: ${request.topic}
    Mood: ${request.mood}
    Length: ${request.length}
  `;

  return gemini.completion<TYPES.StoryOutline>(systemInstruction, contents, {
    type: "object",
    properties: {
      beats: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["beats"],
    additionalProperties: false,
  });
}

// Characters
export async function characterDesigner(
  request: DTO.GenerateRequest,
  outline: TYPES.StoryOutline
): Promise<TYPES.CharacterPlan> {
  const systemInstruction = `
    You are a fiction character designer.

    Create a small cast of believable characters suited to a calming
    bedtime story for adults.

    Each character description should include their name, role,
    personality, and relevance to the supplied outline.
  `;

  const contents = `
    Topic: ${request.topic}
    Mood: ${request.mood}

    Story outline:
    ${JSON.stringify(outline.beats)}
  `;

  return gemini.completion<TYPES.CharacterPlan>(systemInstruction, contents, {
    type: "object",
    properties: {
      characters: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["characters"],
    additionalProperties: false,
  });
}

// Setting
export async function settingDesigner(
  request: DTO.GenerateRequest,
  outline: TYPES.StoryOutline
): Promise<TYPES.SettingPlan> {
  const systemInstruction = `
    You are a fiction setting designer.

    Create an immersive and calming setting for a bedtime story intended
    for adults.

    Include useful environmental, atmospheric, and sensory details that
    support the supplied mood and outline.
  `;

  const contents = `
    Topic: ${request.topic}
    Mood: ${request.mood}

    Story outline:
    ${JSON.stringify(outline.beats)}
  `;

  return gemini.completion<TYPES.SettingPlan>(systemInstruction, contents, {
    type: "object",
    properties: {
      setting: {
        type: "string",
      },
    },
    required: ["setting"],
    additionalProperties: false,
  });
}

// Final writer
export async function finalWriter(
  request: DTO.GenerateRequest,
  outline: TYPES.StoryOutline,
  characters: TYPES.CharacterPlan,
  setting: TYPES.SettingPlan
): Promise<TYPES.StoryGeneration> {
  const systemInstruction = `
    You are an expert fiction writer.

    Write a soothing bedtime story intended for adults.
    Use gentle, immersive language without sounding childish.
    Avoid mature, sexual, graphic, frightening, or highly stressful content.

    Follow the supplied outline, characters, setting, mood, and requested
    length. Return a concise title and the complete story.
  `;

  const contents = `
    Topic: ${request.topic}
    Mood: ${request.mood}
    Length: ${request.length}

    Outline:
    ${JSON.stringify(outline.beats)}

    Characters:
    ${JSON.stringify(characters.characters)}

    Setting:
    ${setting.setting}
  `;

  return gemini.completion<TYPES.StoryGeneration>(systemInstruction, contents, {
    type: "object",
    properties: {
      title: {
        type: "string",
      },
      story: {
        type: "string",
      },
    },
    required: ["title", "story"],
    additionalProperties: false,
  });
}

// Tone annotations
export async function toneAnnotator(
  request: DTO.GenerateRequest,
  story: TYPES.StoryGeneration
): Promise<TYPES.StoryGeneration> {
  const systemInstruction = `
    You are a narration editor preparing text for ElevenLabs v3.

    Preserve the story's title, plot, meaning, and overall wording.
    Improve spoken pacing through punctuation, paragraph breaks, and sentence rhythm.

    You may add restrained ElevenLabs v3 audio tags in square brackets where they
    clearly improve delivery.

    Prefer tags such as:
    [whispers]
    [sigh]
    [sighs]
    [laughs]
    [gasps]
    [exhales]
    [curious]
    [excited]
    [tired]
    [awe]
    [dramatic tone]

    Do not invent long or overly specific tags.
    Do not add sound effects.
    Do not overuse tags.
    Use no more than one tag every 2 to 4 paragraphs.
    Do not substantially rewrite the story.
  `;

  const contents = `
    Requested mood: ${request.mood}
    Title: ${story.title}
    Story: ${story.story}
  `;

  return gemini.completion<TYPES.StoryGeneration>(systemInstruction, contents, {
    type: "object",
    properties: {
      title: {
        type: "string",
      },
      story: {
        type: "string",
      },
    },
    required: ["title", "story"],
    additionalProperties: false,
  });
}
