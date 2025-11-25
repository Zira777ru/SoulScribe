
export type Language = 'ru' | 'en';

export type PrayerStyle = 'modern' | 'classic' | 'short';

export type Denomination = 'general' | 'orthodox' | 'catholic' | 'protestant';

export type SocialTemplate = 'minimal' | 'atmospheric' | 'classic';

export interface PrayerResponse {
  title: string;
  prayer: string;
  verse: string;
  reference: string;
}

export interface PrayerEntry extends PrayerResponse {
  id: string;
  timestamp: number;
  userInput: string;
  language: Language;
  style: PrayerStyle;
  denomination: Denomination;
  status: 'active' | 'answered';
  answerDate?: number;
  answerNote?: string;
  // Tracking
  initialMood?: string; // Emoji/Label e.g. "😰 Anxiety"
  reliefLevel?: 'none' | 'little' | 'much'; // Post-prayer feedback
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export type Screen = 'login' | 'generator' | 'diary';
