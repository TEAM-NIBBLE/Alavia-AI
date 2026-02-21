export type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig';

export type AuthMode = 'guest' | 'user';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintCategory =
  | 'fever'
  | 'breathing'
  | 'chest_pain'
  | 'stomach_pain'
  | 'injury'
  | 'allergy_rash'
  | 'child_symptoms'
  | 'general';

export type TriageAnswerValue = string | number | boolean;

export interface TriageAnswer {
  key: string;
  value: TriageAnswerValue;
  askedAt: string;
}

export interface TriageQuestionOption {
  label: string;
  value: string | number | boolean;
}

export interface TriageQuestion {
  id: string;
  textKey: string;
  options: TriageQuestionOption[];
}

export interface SeverityResult {
  level: Severity;
  reason: string;
  firstAid: string[];
  avoid: string[];
  timing: 'now' | 'soon' | 'monitor';
}

export interface SessionSummary {
  id: string;
  createdAt: string;
  language: LanguageCode;
  transcript: string;
  category: ComplaintCategory;
  answers: TriageAnswer[];
  severity: SeverityResult;
  nextStep: string;
  hospitals: string[];
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  specialties: ComplaintCategory[];
  emergencyCapable: boolean;
  type: 'public' | 'private';
  phone: string;
}

export interface PermissionState {
  microphone: PermissionStatus;
  location: PermissionStatus;
}

export type PermissionStatus = 'unknown' | 'granted' | 'denied';

