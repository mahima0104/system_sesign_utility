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
// Database Types
import { databaseTypes } from './database-types';
import { databases } from './databases';
import { sqlVsNoSQL } from './sql-vs-nosql';
import { relationalDatabases } from './relational-databases';
import { documentDatabases } from './document-databases';
import { keyValueStores } from './key-value-stores';
import { wideColumnDatabases } from './wide-column-databases';
import { graphDatabases } from './graph-databases';
import { timeSeriesDatabases } from './time-series-databases';
import { vectorDatabases } from './vector-databases';
// Database Scaling
import { databaseIndexing } from './database-indexing';
import { queryOptimization } from './query-optimization';
import { readReplicas } from './read-replicas';
import { connectionPooling } from './connection-pooling';
import { databaseSharding } from './database-sharding';
import { verticalHorizontalPartitioning } from './vertical-horizontal-partitioning';
import { databaseCompression } from './database-compression';
// Communication Patterns
import { longPolling } from './long-polling';
import { websockets } from './websockets';
import { serverSentEvents } from './server-sent-events';
import { webhooks } from './webhooks';
import { webrtc } from './webrtc';
import { syncVsAsync } from './sync-vs-async';
import { messageQueues } from './message-queues';
import { pubSub } from './pub-sub';
import { changeDataCapture } from './change-data-capture';
import { deliverySemantics } from './delivery-semantics';
import { deadLetterQueues } from './dead-letter-queues';
// Caching
import { caching } from './caching';
import { whatIsCaching } from './what-is-caching';
import { cacheAsidePattern } from './cache-aside-pattern';
import { readThroughWriteThroughCache } from './read-through-write-through-cache';
import { writeBehindCache } from './write-behind-cache';
import { cachingStrategies } from './caching-strategies';
import { cacheEvictionPolicies } from './cache-eviction-policies';
import { contentDeliveryNetworkCdn } from './content-delivery-network-cdn';
import { distributedCaching } from './distributed-caching';
import { cacheInvalidation } from './cache-invalidation';
import { cacheStampede } from './cache-stampede';
import { cacheWarming } from './cache-warming';

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
  // Database Types
  databaseTypes,
  databases,
  sqlVsNoSQL,
  relationalDatabases,
  documentDatabases,
  keyValueStores,
  wideColumnDatabases,
  graphDatabases,
  timeSeriesDatabases,
  vectorDatabases,
  // Database Scaling
  databaseIndexing,
  queryOptimization,
  readReplicas,
  connectionPooling,
  databaseSharding,
  verticalHorizontalPartitioning,
  databaseCompression,
  // Communication Patterns
  longPolling,
  websockets,
  serverSentEvents,
  webhooks,
  webrtc,
  syncVsAsync,
  messageQueues,
  pubSub,
  changeDataCapture,
  deliverySemantics,
  deadLetterQueues,
  // Caching
  caching,
  whatIsCaching,
  cacheAsidePattern,
  readThroughWriteThroughCache,
  writeBehindCache,
  cachingStrategies,
  cacheEvictionPolicies,
  contentDeliveryNetworkCdn,
  distributedCaching,
  cacheInvalidation,
  cacheStampede,
  cacheWarming,
];

export const getConceptDeepDive = (moduleId: string): ConceptDeepDive | undefined =>
  conceptDeepDives.find((c) => c.moduleId === moduleId);
