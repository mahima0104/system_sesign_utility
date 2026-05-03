import type { ConceptDeepDive } from '../../types';
import { scalability } from './scalability';
import { availability } from './availability';
import { reliability } from './reliability';
import { spof } from './spof';
import { latencyVsThroughput } from './latency-vs-throughput';
import { consistentHashing } from './consistent-hashing';
import { capTheorem } from './cap-theorem';
import { consistencyModels } from './consistency-models';

export const conceptDeepDives: ConceptDeepDive[] = [
  scalability,
  availability,
  reliability,
  spof,
  latencyVsThroughput,
  consistentHashing,
  capTheorem,
  consistencyModels,
];

export const getConceptDeepDive = (moduleId: string): ConceptDeepDive | undefined =>
  conceptDeepDives.find((c) => c.moduleId === moduleId);
