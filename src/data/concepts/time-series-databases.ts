import type { ConceptDeepDive } from '../../types';

export const timeSeriesDatabases: ConceptDeepDive = {
  moduleId: 'time-series-databases',
  tagline: 'When every data point is a heartbeat — and you have billions of them',

  introduction: {
    layman:
      'A time-series database is optimised for one specific type of data: measurements that change over time and are always associated with a timestamp. ' +
      'CPU usage every 10 seconds. Stock prices every millisecond. A patient\'s heart rate every minute. Temperature from 10,000 IoT sensors. ' +
      'These are not just regular rows — they are streams of time-stamped measurements. ' +
      'Time-series databases store this data with extreme efficiency (10-100× compression vs relational DBs), answer time-range queries in milliseconds, ' +
      'and automatically aggregate, downsample, and archive old data. ' +
      'InfluxDB, Prometheus, TimescaleDB, and Victoria Metrics are the major players.',
    analogy:
      'Imagine recording the temperature in your city every second for 10 years. ' +
      'That is 315 million data points — just for one sensor. ' +
      'A relational database would store these as 315M rows in a table. ' +
      'Querying "average temperature last month, by day" would scan millions of rows. ' +
      'A time-series database stores these 315M points using delta encoding (storing differences instead of absolute values: 22°C, +0.1, -0.2, +0.1...) ' +
      'and organises them in time-sorted chunks. ' +
      'The same query — "average temperature by day" — scans only the relevant time chunk and returns in milliseconds.',
    whyMatters:
      'Every production system at scale emits metrics: request rates, error counts, latency percentiles, CPU, memory, disk. ' +
      'Storing these in a general-purpose database is inefficient and expensive. ' +
      'In system design interviews, "design a monitoring system like Datadog" or "design the analytics backend for IoT" always involves a time-series database. ' +
      'Understanding the data model, compression, downsampling, and retention policies is expected at senior level.',
  },

  subTopics: [
    {
      title: 'Time-Series Data Model',
      icon: '📊',
      layman:
        'Time-series databases organise data around three concepts: ' +
        'the metric name (what you are measuring), tags (who or what is being measured), and fields (the actual values). ' +
        '"CPU usage of web-server-01 in us-east-1 at 14:30:00 was 87.3%" — metric=cpu_usage, tags={host="web-01", region="us-east-1"}, field=87.3, timestamp=14:30:00.',
      technical:
        'InfluxDB data model (Line Protocol):\n' +
        'measurement,tag1=val1,tag2=val2 field1=v1,field2=v2 timestamp\n\n' +
        'Example:\n' +
        'cpu_usage,host=web-01,region=us-east cpu=87.3,mem=62.1 1716000000000000000\n' +
        'http_requests,host=web-01,status=200 count=1523,p99_ms=45.2 1716000000000000000\n' +
        'http_requests,host=web-01,status=500 count=3,p99_ms=3200 1716000000000000000\n\n' +
        'Components:\n' +
        '- Measurement: like a table name (cpu_usage, http_requests)\n' +
        '- Tags: indexed metadata for filtering and grouping (host, region, status)\n' +
        '  Tags are strings, indexed, stored in-memory for fast filtering\n' +
        '- Fields: the actual numeric/string values (cpu, count, p99_ms)\n' +
        '  Fields are not indexed (query by tag, compute on field values)\n' +
        '- Timestamp: nanosecond precision (Unix nanoseconds)\n\n' +
        'Prometheus data model:\n' +
        'metric_name{label1="val1",label2="val2"} value timestamp\n' +
        'http_requests_total{method="POST",handler="/api/users",status="200"} 2345 1716000000\n\n' +
        'TimescaleDB (PostgreSQL extension):\n' +
        '- Regular PostgreSQL table with a timestamp column\n' +
        '- Automatically partitioned by time chunks (7-day chunks by default)\n' +
        '- Full SQL support: SELECT AVG(cpu) FROM metrics WHERE time > NOW() - INTERVAL \'1 hour\'\n' +
        '- Continuous aggregates: precomputed rollups updated as new data arrives',
      example:
        'Designing the data model for an IoT fleet monitoring system:\n\n' +
        '// Scenario: 10,000 trucks, each sending GPS + engine data every 30 seconds\n' +
        '// = 10,000 × 2 metrics/sec = 20,000 data points per second\n\n' +
        '// InfluxDB design:\n' +
        '// Measurement: truck_telemetry\n' +
        '// Tags (indexed, used in WHERE): truck_id, fleet_id, region, driver_id\n' +
        '// Fields (numeric values): lat, lng, speed_kmh, engine_temp_c, fuel_pct\n\n' +
        'truck_telemetry,truck_id=T001,fleet_id=F07,region=midwest \\\n' +
        '  lat=41.878,lng=-87.629,speed=72.5,engine_temp=88.3,fuel=67.2 \\\n' +
        '  1716000030000000000\n\n' +
        '// Query: average speed of fleet F07 last hour\n' +
        'from(bucket:"iot") |> range(start: -1h)\n' +
        '  |> filter(fn: (r) => r._measurement == "truck_telemetry"\n' +
        '                    and r.fleet_id == "F07"\n' +
        '                    and r._field == "speed")\n' +
        '  |> mean()\n\n' +
        '// Query: trucks with engine temp > 100°C (potential overheating alert)\n' +
        '  |> filter(fn: (r) => r._field == "engine_temp")\n' +
        '  |> filter(fn: (r) => r._value > 100.0)\n' +
        '  |> distinct(column: "truck_id")',
      whenToUse:
        'Use when: data is always associated with a timestamp, queried by time ranges, and you write far more than you read. Any monitoring, IoT, or financial tick data workload.',
    },
    {
      title: 'Storage Architecture and Compression',
      icon: '💾',
      layman:
        'Time-series databases are extraordinarily efficient at storing time-stamped data because adjacent measurements are usually similar. ' +
        'CPU was 87%, then 87.1%, then 86.9% — the differences are tiny. ' +
        'Instead of storing 87.0, 87.1, 86.9, they store 87.0 and then just the differences: +0.1, -0.2. ' +
        'This is called delta encoding, and it achieves 10-90% compression on typical metrics.',
      technical:
        'Compression techniques:\n\n' +
        '1. Delta encoding (timestamps):\n' +
        '   Raw: 1716000000, 1716000010, 1716000020, 1716000030\n' +
        '   Encoded: 1716000000, Δ10, Δ10, Δ10\n' +
        '   Regular intervals → only store the interval size\n\n' +
        '2. Delta-of-delta (Gorilla algorithm — Facebook):\n' +
        '   First delta: t1 - t0\n' +
        '   Second delta: (t2 - t1) - (t1 - t0)\n' +
        '   For perfectly regular intervals: most deltas are 0 → extremely compressible\n\n' +
        '3. XOR compression for floats (Gorilla):\n' +
        '   87.3 XOR 87.1 = only a few bits differ → encode the difference in bits\n' +
        '   Similar consecutive floats: 1-5 bits per sample (vs 64 bits raw)\n\n' +
        '4. Run-length encoding (RLE):\n' +
        '   87.3, 87.3, 87.3, 87.3 → (87.3, count=4)\n' +
        '   Constant metrics compress to near zero\n\n' +
        'Real compression ratios:\n' +
        '- Prometheus (TSDB): 1.3-2 bytes per sample (vs 16 bytes raw float+timestamp)\n' +
        '- InfluxDB TSM files: 2-3 bytes per sample (float + timestamp)\n' +
        '- Gorilla (Facebook): 1.37 bytes per sample average in production\n\n' +
        'Time-ordered storage:\n' +
        '- InfluxDB TSM (Time Series Merged): in-memory cache → WAL → TSM files\n' +
        '  TSM files are immutable, time-ordered blocks, compacted over time\n' +
        '- Prometheus TSDB: chunks of 120 samples per series, 2-hour blocks\n' +
        '- TimescaleDB: PostgreSQL chunks partitioned by time (configurable window)',
      example:
        'Compression comparison — storing 1 year of CPU metrics:\n\n' +
        'Setup: 1000 servers × cpu_usage metric × every 10 seconds\n' +
        '= 1000 × 6 × 60 × 24 × 365 = 3.1 billion data points\n\n' +
        'PostgreSQL (naïve approach):\n' +
        'CREATE TABLE metrics (host TEXT, ts TIMESTAMPTZ, cpu DOUBLE);\n' +
        '-- 3.1B rows × ~40 bytes/row (text, timestamp, double + overhead)\n' +
        '-- = ~124 GB storage\n' +
        '-- SELECT avg(cpu) GROUP BY day: 12+ seconds (3.1B row scan)\n\n' +
        'InfluxDB (TSM compression):\n' +
        '-- 3.1B samples × 2 bytes/sample (after Gorilla compression)\n' +
        '-- = ~6 GB storage (20× compression)\n' +
        '-- Same average query: <500ms (time-range pruning + pre-aggregation)\n\n' +
        'TimescaleDB (PostgreSQL + columnar compression):\n' +
        '-- ~10 GB with columnar compression (same table, different storage engine)\n' +
        '-- Full SQL: SELECT time_bucket(\'1 day\', ts), avg(cpu) FROM metrics\n' +
        '            WHERE ts > NOW() - INTERVAL \'30 days\' GROUP BY 1\n' +
        '-- Performance: 100ms with continuous aggregates pre-built',
    },
    {
      title: 'Downsampling and Data Retention',
      icon: '📉',
      layman:
        'Do you really need 10-second resolution data from 3 years ago? Probably not. ' +
        'You need to know the trend, not the exact value at 14:30:42 on March 15, 2021. ' +
        'Time-series databases automatically downsample older data: ' +
        'recent data stays at full resolution (every 10 seconds), ' +
        'data from last month is kept at 1-minute resolution, ' +
        'data from last year at 1-hour resolution, ' +
        'and data older than 2 years might be deleted entirely. ' +
        'This keeps storage costs manageable while preserving long-term trends.',
      technical:
        'Downsampling = aggregating fine-grained data into coarser time buckets:\n' +
        '- Raw (10s resolution): kept for 7 days\n' +
        '- 1-minute rollup: kept for 90 days\n' +
        '- 1-hour rollup: kept for 1 year\n' +
        '- 1-day rollup: kept for 5 years\n\n' +
        'InfluxDB continuous queries / tasks (Flux):\n' +
        'option task = {name: "downsample_1min", every: 1m}\n' +
        'from(bucket:"metrics_raw")\n' +
        '  |> range(start: -task.every)\n' +
        '  |> filter(fn: (r) => r._measurement == "cpu_usage")\n' +
        '  |> aggregateWindow(every: 1m, fn: mean)\n' +
        '  |> to(bucket: "metrics_1m")\n\n' +
        'TimescaleDB continuous aggregates:\n' +
        'CREATE MATERIALIZED VIEW metrics_hourly\n' +
        'WITH (timescaledb.continuous) AS\n' +
        'SELECT time_bucket(\'1 hour\', time) AS bucket,\n' +
        '       host, AVG(cpu) as avg_cpu, MAX(cpu) as max_cpu\n' +
        'FROM metrics\n' +
        'GROUP BY bucket, host\n' +
        'WITH NO DATA;\n\n' +
        'SELECT add_continuous_aggregate_policy(\'metrics_hourly\',\n' +
        '  start_offset => INTERVAL \'1 month\',\n' +
        '  end_offset => INTERVAL \'1 hour\',\n' +
        '  schedule_interval => INTERVAL \'1 hour\'\n' +
        ');\n\n' +
        'Data retention with automatic delete:\n' +
        '-- TimescaleDB: drop chunks older than 90 days\n' +
        'SELECT add_retention_policy(\'metrics\', INTERVAL \'90 days\');\n\n' +
        'Prometheus retention:\n' +
        '-- Default: 15 days\n' +
        '-- --storage.tsdb.retention.time=30d  (in start flags)\n' +
        '-- Use Thanos or Cortex for long-term storage (object store: S3)',
      example:
        'Datadog-style monitoring tiered storage:\n\n' +
        'Tier 1 (0-24 hours): raw metrics every 10 seconds\n' +
        '  Storage: SSD-backed InfluxDB cluster\n' +
        '  Latency: <100ms for dashboard queries\n' +
        '  Use: real-time dashboards, alerting\n\n' +
        'Tier 2 (1-30 days): 1-minute aggregates\n' +
        '  Storage: compressed InfluxDB on slower disks\n' +
        '  Latency: <500ms for month-range queries\n' +
        '  Use: incident retrospectives, weekly reports\n\n' +
        'Tier 3 (1-12 months): 1-hour aggregates\n' +
        '  Storage: Parquet files on S3 (queried via Athena/Spark)\n' +
        '  Latency: seconds to minutes (batch analytics)\n' +
        '  Use: capacity planning, trend analysis\n\n' +
        'Tier 4 (> 1 year): 1-day aggregates\n' +
        '  Storage: S3 Glacier (cold storage)\n' +
        '  Latency: minutes\n' +
        '  Use: annual reviews, compliance\n\n' +
        'Cost comparison:\n' +
        'Storing 100 servers × 10s raw data for 1 year: ~50 GB (compressed)\n' +
        'Same with tiered storage: ~8 GB (5 days raw + rollups)',
      whenToUse:
        'Always configure retention and downsampling for time-series data. Without it, storage grows linearly forever. Define tiers based on how far back you need full resolution vs trend data.',
    },
    {
      title: 'Alerting and Anomaly Detection',
      icon: '🚨',
      layman:
        'The whole point of collecting metrics is to know when something goes wrong. ' +
        'Time-series databases integrate with alerting systems to notify you when a metric crosses a threshold: ' +
        '"Alert me if CPU stays above 90% for 5 minutes" or "Alert if error rate jumps 50% above the weekly average." ' +
        'More advanced systems detect anomalies automatically — not just threshold crossings but unusual patterns.',
      technical:
        'Threshold alerting (Prometheus AlertManager):\n' +
        '-- alert.rules.yml\n' +
        'groups:\n' +
        '- name: infrastructure\n' +
        '  rules:\n' +
        '  - alert: HighCPU\n' +
        '    expr: avg(cpu_usage_percent) by (host) > 90\n' +
        '    for: 5m  # must be true for 5 minutes (avoids flapping)\n' +
        '    labels:\n' +
        '      severity: warning\n' +
        '    annotations:\n' +
        '      summary: "High CPU on {{ $labels.host }}"\n' +
        '      description: "CPU usage: {{ $value }}%"\n\n' +
        '  - alert: ErrorRateSpike\n' +
        '    expr: rate(http_requests_total{status=~"5.."}[5m]) /\n' +
        '          rate(http_requests_total[5m]) > 0.05\n' +
        '    for: 2m\n' +
        '    labels:\n' +
        '      severity: critical\n\n' +
        'Anomaly detection approaches:\n\n' +
        '1. Z-score: flag values > 3 standard deviations from mean\n' +
        '   Uses rolling window mean + stddev\n\n' +
        '2. Seasonal decomposition: account for time-of-day patterns\n' +
        '   (CPU at 3am is expected to be lower than at 2pm)\n' +
        '   Compare to same time last week/day, not global mean\n\n' +
        '3. Holt-Winters forecasting: triple exponential smoothing\n' +
        '   Accounts for trend + seasonality → alert if actual >> forecast\n\n' +
        '4. Machine learning (Prophet, LSTM):\n' +
        '   Learn complex seasonal patterns\n' +
        '   Used by Datadog, New Relic for smart alerting\n\n' +
        'InfluxDB alert on anomaly:\n' +
        'from(bucket:"metrics") |> range(start: -1h)\n' +
        '  |> filter(fn: (r) => r._measurement == "http_latency")\n' +
        '  |> timedMovingAverage(every: 1m, period: 5m)\n' +
        '  |> map(fn: (r) => ({ r with zscore: (r._value - r.mean) / r.stddev }))\n' +
        '  |> filter(fn: (r) => r.zscore > 3.0)',
      example:
        'Netflix chaos engineering uses TSDB-based anomaly detection:\n\n' +
        'During Chaos Monkey experiments (intentionally killing servers):\n' +
        '- Prometheus tracks error rates per service\n' +
        '- AlertManager fires if error rate > baseline × 2 for > 60s\n' +
        '- Automated rollback triggered if SLO breach detected\n\n' +
        'SLO monitoring query (Prometheus):\n' +
        '// Error budget burn rate: are we consuming our monthly error budget too fast?\n' +
        'sum(rate(http_errors[1h])) / sum(rate(http_requests[1h]))\n' +
        '  > (1 - 0.999) * (30 * 24 / 1)  // burning 1 month budget in 1 hour\n\n' +
        'This Google SRE methodology ("error budget alerts") is standard practice.\n' +
        'If you burn your 30-day error budget in 1 hour, page the on-call engineer.',
    },
    {
      title: 'Popular Time-Series Databases Compared',
      icon: '⚖️',
      layman:
        'Prometheus, InfluxDB, and TimescaleDB are the three most common time-series databases in production. ' +
        'Prometheus is the standard for infrastructure monitoring (Kubernetes metrics). ' +
        'InfluxDB is more flexible and supports IoT and business metrics. ' +
        'TimescaleDB is PostgreSQL underneath — if your team already knows SQL, it requires the least relearning.',
      technical:
        'Prometheus:\n' +
        '- Pull model: Prometheus scrapes metrics from HTTP /metrics endpoints every 15s\n' +
        '- PromQL: powerful query language for rates, aggregations, alerting\n' +
        '  rate(http_requests_total[5m]) — per-second rate over 5-minute window\n' +
        '  histogram_quantile(0.99, sum(rate(latency_bucket[5m])) by (le)) — p99 latency\n' +
        '- TSDB: 2-hour blocks, local disk storage\n' +
        '- Short retention (15 days default); use Thanos/Cortex for long-term\n' +
        '- Ecosystem: 1000+ exporters (node_exporter, mysqld_exporter, redis_exporter)\n' +
        '- Standard for Kubernetes + cloud-native monitoring\n\n' +
        'InfluxDB 3.0:\n' +
        '- Push model: clients write via Line Protocol or API\n' +
        '- Flux query language (functional, powerful but verbose)\n' +
        '- Good for IoT, business metrics, complex multi-measurement queries\n' +
        '- Tasks: built-in scheduled downsampling and alerting\n' +
        '- InfluxDB Cloud: fully managed, serverless option\n\n' +
        'TimescaleDB:\n' +
        '- PostgreSQL extension: hypertables, continuous aggregates, compression\n' +
        '- Full SQL + time-series optimisations\n' +
        '- Best for: teams that want SQL, existing PostgreSQL expertise\n' +
        '- Can use all PostgreSQL extensions (PostGIS for spatial time-series)\n' +
        '- Joins with relational tables (metrics + business data in same DB)\n\n' +
        'VictoriaMetrics:\n' +
        '- Prometheus-compatible (reads PromQL), much better performance\n' +
        '- Handles 10× more data than Prometheus on same hardware\n' +
        '- Used by Wix (50 billion metrics/day), Adidas, and Grammarly\n' +
        '- Simpler operations than Thanos/Cortex for long-term storage',
      example:
        'Monitoring stack for a large SaaS platform:\n\n' +
        'Tier 1 — Infrastructure metrics:\n' +
        '  Prometheus + node_exporter on all servers\n' +
        '  Thanos for long-term storage → S3\n' +
        '  Grafana for dashboards\n' +
        '  AlertManager → PagerDuty for alerts\n\n' +
        'Tier 2 — Application metrics:\n' +
        '  InfluxDB for custom business metrics:\n' +
        '  - Orders per minute (revenue monitoring)\n' +
        '  - Feature flag experiment metrics\n' +
        '  - User action funnels\n\n' +
        'Tier 3 — IoT device telemetry:\n' +
        '  TimescaleDB (PostgreSQL for device data + relational for device metadata)\n' +
        '  Device metadata JOIN time-series in one query:\n' +
        '  SELECT d.model, AVG(m.battery_pct) FROM devices d\n' +
        '  JOIN device_metrics m ON d.id = m.device_id\n' +
        '  WHERE m.ts > NOW() - INTERVAL \'1 day\'\n' +
        '  GROUP BY d.model\n' +
        '  -- Impossible in InfluxDB or Prometheus (no relational joins)',
    },
  ],

  comparison: {
    caption: 'Time-series database comparison',
    columns: ['Feature', 'Prometheus', 'InfluxDB', 'TimescaleDB', 'VictoriaMetrics'],
    rows: [
      ['Query language', 'PromQL', 'Flux / InfluxQL', 'SQL', 'PromQL (compatible)'],
      ['Write model', 'Pull (scrape)', 'Push', 'Push (INSERT)', 'Push or Pull'],
      ['Retention default', '15 days', 'Configurable', 'Configurable', 'Configurable'],
      ['Long-term storage', 'Thanos / Cortex', 'InfluxDB Cloud', 'PostgreSQL (native)', 'Built-in'],
      ['SQL support', '❌', '❌', '✅ Full SQL', '❌'],
      ['Best for', 'K8s, cloud-native', 'IoT, custom metrics', 'PostgreSQL teams, IoT', 'High-volume Prometheus'],
      ['Managed cloud', 'Grafana Cloud', 'InfluxDB Cloud', 'Timescale Cloud', 'VictoriaMetrics Cloud'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Cloudflare',
      icon: '☁️',
      description:
        'Cloudflare processes 50 million HTTP requests per second and needs to monitor every data centre in real time. ' +
        'They use ClickHouse (column-oriented analytical DB) for their metrics pipeline, handling 100 trillion data points per day. ' +
        'Their setup: Kafka for ingestion → ClickHouse for storage and query → Grafana for visualisation. ' +
        'Key insight: at their scale, standard Prometheus does not work — they needed a columnar OLAP database with time-series optimisations.',
    },
    {
      company: 'Tesla',
      icon: '⚡',
      description:
        'Tesla collects telemetry from millions of vehicles: GPS, speed, battery state, motor temperature, hundreds of sensor readings every second. ' +
        'This is classic IoT time-series data. ' +
        'Tesla uses InfluxDB for vehicle telemetry, collecting billions of data points per day. ' +
        'The data powers: range estimation algorithms (learning from real-world battery performance), over-the-air update rollout monitoring (is this firmware update degrading performance?), and predictive maintenance (which component is showing early failure patterns).',
    },
    {
      company: 'Goldman Sachs',
      icon: '💰',
      description:
        'Goldman Sachs uses time-series databases for financial tick data — stock prices, bond yields, options chains updated thousands of times per second across thousands of instruments. ' +
        'They use kdb+ (a specialised time-series database widely used in quantitative finance) for microsecond-precision tick data storage and query. ' +
        'kdb+\'s q query language is designed for time-series analysis: "5-minute VWAP for AAPL over the last trading day" is a single line of q code that scans billions of ticks in seconds.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Design the metrics collection system for a company like Datadog',
      answer:
        'Ingestion: agents on each customer server send metrics via UDP/TCP to regional collection endpoints. ' +
        'Buffering: Kafka cluster receives metrics stream, providing backpressure and replay capability. ' +
        'Storage: write path writes to InfluxDB or a custom TSDB. Shard by metric name hash across nodes. ' +
        'Hot path (real-time): metrics land in TSDB, dashboards query it within seconds. ' +
        'Cold path (history): after 3 days, downsample to 1-minute aggregates, stored longer. After 30 days, 1-hour aggregates on S3. ' +
        'Alerting: separate Alerting Service subscribes to metrics stream via Kafka, evaluates rules (PromQL-style expressions), fires to PagerDuty/Slack on breach. ' +
        'Scale: 50,000 customers × 1,000 metrics × every 10s = 5 million data points per second ingestion rate. This requires a distributed TSDB cluster, not a single InfluxDB instance.',
    },
    {
      question: 'Why is PostgreSQL a poor choice for storing time-series metrics?',
      answer:
        'Three fundamental problems: ' +
        '(1) Storage efficiency: PostgreSQL stores each row with per-row overhead (tuple header, null bitmap, OID). At 40 bytes/row overhead for a float value: 1 billion metrics = 40 GB overhead alone. Time-series DBs compress to 2 bytes/sample. ' +
        '(2) Insert performance: PostgreSQL inserts update B-Tree indexes on every write. High-throughput time-series (millions/sec) causes heavy index fragmentation and write amplification. LSM-tree TSDBs append-only — no index updates on write. ' +
        '(3) Query performance for time-range scans: B-Tree index on a timestamp column does a range scan but still reads full rows. Column-oriented time-series storage reads only the timestamp + value columns — skipping all other metadata. ' +
        'TimescaleDB is the exception: it extends PostgreSQL with time-partitioned hypertables, columnar compression, and continuous aggregates — getting time-series performance while retaining SQL.',
    },
    {
      question: 'How do you handle high cardinality in a time-series database?',
      answer:
        'High cardinality means your tags have many unique values — like storing user_id as a tag for a million users. ' +
        'InfluxDB indexes all tag values in memory. A million unique user_ids × thousands of metrics = billions of series, exhausting RAM. ' +
        'This is called "cardinality explosion" and is one of the most common operational problems with TSDBs. ' +
        'Solutions: (1) Move high-cardinality dimensions to fields (unindexed) or to a separate relational DB lookup. (2) Aggregate before writing — instead of per-user metrics, write per-cohort or percentile metrics. (3) Use a TSDB designed for high cardinality: VictoriaMetrics handles 50M+ unique time series without cardinality limits. (4) Separate storage: store high-cardinality user metrics in a columnar OLAP system (ClickHouse, Druid) and use the TSDB only for infrastructure metrics.',
    },
  ],

  commonMistakes: [
    'Using a relational database for high-frequency time-series data — works for small datasets, breaks at millions of rows with range scan queries',
    'Creating high-cardinality tags (user_id, session_id, request_id) — these explode the TSDB\'s in-memory index and crash production systems',
    'Not configuring retention policies — time-series data grows indefinitely without retention; storage fills up and writes fail',
    'Not downsampling historical data — keeping raw 10-second data for 2 years is 99% wasted storage; downsample to appropriate granularity for each time window',
    'Alerting on raw metrics instead of rates — a spike in absolute error count could just be higher traffic; always alert on error RATE (errors / total requests)',
    'Pulling too many data points into the application for aggregation — always aggregate in the TSDB query, not in application code; TSDBs are optimised for server-side aggregation',
    'Not accounting for out-of-order writes — distributed systems send metrics slightly out of order; TSDBs handle this with a write buffer, but configuring the buffer too small causes data loss',
  ],
};
