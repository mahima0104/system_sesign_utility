import type { ConceptDeepDive } from '../../types';
import { whatIsSystemDesign } from './what-is-system-design';
import { scalability } from './scalability';
import { availability } from './availability';
import { reliability } from './reliability';
import { spof } from './spof';
import { latencyVsThroughput } from './latency-vs-throughput';
import { consistentHashing } from './consistent-hashing';
import { capTheorem } from './cap-theorem';
import { consistencyModels } from './consistency-models';
import { clientServerArchitecture } from './client-server-architecture';
import { monolithicArchitecture } from './monolithic-architecture';
import { eventDrivenArchitecture } from './event-driven-architecture';
import { cors } from './cors';
import { serverlessArchitecture } from './serverless-architecture';
import { apiDeepDives } from './api-fundamentals';
// Database Scaling
import { databaseIndexing } from './database-indexing';
import { queryOptimization } from './query-optimization';
import { readReplicas } from './read-replicas';
import { connectionPooling } from './connection-pooling';
import { databaseSharding } from './database-sharding';
import { verticalHorizontalPartitioning } from './vertical-horizontal-partitioning';
import { databaseCompression } from './database-compression';

export const conceptDeepDives: ConceptDeepDive[] = [
  whatIsSystemDesign,
  scalability,
  availability,
  reliability,
  spof,
  latencyVsThroughput,
  consistentHashing,
  capTheorem,
  consistencyModels,
  clientServerArchitecture,
  monolithicArchitecture,
  eventDrivenArchitecture,
  cors,
  serverlessArchitecture,
  ...apiDeepDives,
  // Database Scaling
  databaseIndexing,
  queryOptimization,
  readReplicas,
  connectionPooling,
  databaseSharding,
  verticalHorizontalPartitioning,
  databaseCompression,
];

export const getConceptDeepDive = (moduleId: string): ConceptDeepDive | undefined =>
  conceptDeepDives.find((c) => c.moduleId === moduleId);
