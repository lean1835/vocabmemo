import { Document, Types } from "mongoose";

export interface IVocabExample {
  sentence: string;
  translation: string;
}

export interface IVocabulary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  originalInput: string;
  correctedWord: string;
  pronunciation?: string; // Trường cũ làm fallback
  pronunciationUK: string;
  pronunciationUS: string;
  partOfSpeech: string;
  meaningVi: string;
  meaningEn: string;
  examples: IVocabExample[];
  synonyms: string[];
  level: string;
  category: string;
  source: string;
  tags: string[];
  imageUrl: string;
  isDifficult?: boolean;
  isAnalyzing?: boolean;
  createdAt: Date;
}

export interface IVocabCache extends Document {
  _id: Types.ObjectId;
  originalInput: string;
  correctedWord: string;
  pronunciationUK: string;
  pronunciationUS: string;
  partOfSpeech: string;
  meaningVi: string;
  meaningEn: string;
  examples: IVocabExample[];
  synonyms: string[];
  level: string;
  category: string;
  tags: string[];
  imageUrl: string;
  createdAt: Date;
}
