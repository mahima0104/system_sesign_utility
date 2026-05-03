import type { DesignPattern } from '../../types';
import { creationalPatterns } from './creational';
import { structuralPatterns } from './structural';
import { behavioralPatterns } from './behavioral';

export const patterns: DesignPattern[] = [
  ...creationalPatterns,
  ...structuralPatterns,
  ...behavioralPatterns,
];

export const getPattern = (id: string) => patterns.find((p) => p.id === id);

export const getPatternsByCategory = (): Record<string, DesignPattern[]> => {
  return patterns.reduce<Record<string, DesignPattern[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});
};

export const PATTERN_CATEGORY_ORDER = ['Creational', 'Structural', 'Behavioral'] as const;

export const PATTERN_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Creational:
    'Patterns about object creation — how objects are instantiated, configured, and assembled.',
  Structural:
    'Patterns about composition — how classes and objects are combined to form larger structures.',
  Behavioral:
    'Patterns about communication — how objects interact, distribute responsibility, and pass messages.',
};
