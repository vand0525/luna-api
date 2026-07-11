import * as DTO from './stories.dto';
import { BadRequestError } from '../../middleware/errors'

// helpers
function typeValidator(field: string, value: unknown, type: string): void {
  if (typeof value !== type) {
    throw new BadRequestError(`${field} must be a ${type}`);
  }
}

function lengthValidator(field: string, str: string, min: number, max: number): void {
  if (str.trim().length < min) throw new BadRequestError(`${field} must have more than ${min} characters`);
  if (str.trim().length > max) throw new BadRequestError(`${field} must have less than ${max} characters`);
}

function enumValidator(field: string, value: string, values: readonly string[]): void {
  if (!values.includes(value)) throw new BadRequestError(`${field} must be one of: ${values.join(", ")}`)
}

// generate
export function generate(body: any): DTO.GenerateRequest {
  const {topic, mood, narratorType, length} = body;

  // topic
  typeValidator('topic', topic, 'string');
  lengthValidator('topic', topic, 3, 100);
  
  // mood
  typeValidator('mood', mood, 'string');
  lengthValidator('mood', mood, 3, 50);

  // narrator type
  typeValidator("narratorType", narratorType, "string");
  enumValidator("narratorType", narratorType, DTO.NARRATOR_TYPES);

  // length
  typeValidator("length", length, "string");
  enumValidator("length", length, DTO.LENGTHS);

  return {
    topic: topic.trim(),
    mood: mood.trim(),
    narratorType,
    length
  }
}