import type { ConceptDeepDive } from '../../types';

export const databaseCompression: ConceptDeepDive = {
  moduleId: 'database-compression',
  tagline: 'Store 10TB of data in 2TB — and make queries faster in the process',

  introduction: {
    layman:
      'Database compression is exactly what it sounds like: storing your data in a smaller, denser form. ' +
      'But unlike file compression you might know (zip files), database compression is smarter — it compresses data in a way that the database can still query it efficiently without uncompressing the entire file first. ' +
      'A typical e-commerce database can shrink from 10TB to 2–3TB with compression. That\'s not just cheaper storage — compressed data fits more easily in RAM (the fast memory your database uses as a cache), so queries run faster too.',
    analogy:
      'Imagine an office where every document is printed in full — names, addresses, "Mumbai" repeated 50,000 times across 50,000 files. ' +
      'A smart filing system notices "Mumbai" appears constantly and replaces it with a code: "#M01". ' +
      'Now every document is shorter. The storage room (disk) needs less space. The clerk\'s desk (RAM cache) can fit more files. And finding a document is faster because there\'s simply less paper to move. ' +
      'This is what compression does — and modern databases are incredibly smart about which parts to compress most aggressively.',
    whyMatters:
      'At scale, storage costs are enormous. A 100TB database costs $2,000–5,000/month on cloud storage. Compression to 20TB saves $1,600–4,000 every month. ' +
      'But the bigger benefit is often performance: compressed data fits in buffer cache (RAM), meaning queries read from RAM instead of slow disk. ' +
      'Columnar databases like BigQuery and ClickHouse achieve 10–50× compression ratios — enabling sub-second queries on petabyte datasets that would be impossible without it. ' +
      'For interviews: "how would you design a system to store and query 1 petabyte of event data?" — the answer involves columnar storage and compression.',
  },

  subTopics: [
    {
      title: 'How Database Compression Works',
      icon: '🔧',
      layman:
        'Databases use several clever tricks to store data in less space. The most important ones work because real data has patterns: ' +
        'lots of repeated values (most users are from India, most orders have status=\'delivered\'), long strings that appear over and over, and numbers that don\'t change much between rows.',
      technical:
        'Common compression algorithms in databases:\n\n' +
        '1. Run-Length Encoding (RLE):\n' +
        '   Input:  Mumbai, Mumbai, Mumbai, Mumbai, Mumbai (5 identical rows)\n' +
        '   Output: {Mumbai × 5}  → 80% size reduction.\n' +
        '   Best for: sorted columns with repeated values (status, country, category).\n\n' +
        '2. Dictionary Encoding:\n' +
        '   Build a dictionary: {0: \'Mumbai\', 1: \'Delhi\', 2: \'Bangalore\'}.\n' +
        '   Replace strings with tiny integer codes: "Mumbai" (6 bytes) → 0 (1 byte).\n' +
        '   Best for: low-cardinality string columns (city, status, category).\n\n' +
        '3. Delta Encoding:\n' +
        '   Instead of storing absolute timestamps (1704067200, 1704067260, 1704067320), store deltas: (start=1704067200, +60, +60, +60).\n' +
        '   Best for: monotonically increasing values (timestamps, auto-increment IDs).\n\n' +
        '4. Bit Packing:\n' +
        '   A column of values 0–127 only needs 7 bits, not 64 bits. Pack 9 values into one 64-bit word.\n' +
        '   Best for: low-range integers (ratings 1–5, age, small counters).\n\n' +
        '5. LZ4, Snappy, Zstandard (general-purpose):\n' +
        '   Byte-level pattern matching and back-reference compression. LZ4 is fastest (low CPU). Zstd is best ratio. Snappy is Google\'s balanced choice.',
      example:
        'Column: order_status in an orders table (500M rows).\n' +
        'Values: \'pending\' (5%), \'processing\' (10%), \'delivered\' (80%), \'cancelled\' (5%).\n\n' +
        'Without compression: 500M × avg 10 bytes = 5GB.\n\n' +
        'With dictionary encoding:\n' +
        'Dictionary: {0: \'pending\', 1: \'processing\', 2: \'delivered\', 3: \'cancelled\'}\n' +
        'Storage: 500M × 1 byte (just the code!) = 500MB.\n' +
        'Compression ratio: 10:1. Bonus: comparisons on integer codes are faster than string comparisons.\n\n' +
        'With dictionary + RLE (since data is sorted by status in analytics queries):\n' +
        '{2 × 400M, 1 × 50M, 0 × 25M, 3 × 25M} → a few dozen bytes. Near-infinite ratio on sorted data.',
      whenToUse: 'Always use compression for large tables in analytics databases. For OLTP (high write), use block-level compression (LZ4) which has minimal CPU overhead.',
    },
    {
      title: 'Row-Store vs Column-Store Compression',
      icon: '📊',
      layman:
        'Traditional databases store data row by row (all columns of row 1, then all columns of row 2...). ' +
        'This is great for reading or writing one specific user\'s data — all their information is together. ' +
        'But for analytics (SUM(amount) across 500M orders), you have to read all columns just to get to the one you care about. ' +
        'Columnar (column-store) databases flip this: all values from the amount column are stored together. ' +
        'Reading just the amount column skips all other data — and values in the same column compress incredibly well because they\'re similar to each other.',
      technical:
        'Row-store (PostgreSQL, MySQL):\n' +
        '  Data: [id=1, name="Alice", amount=100.00, status="delivered"]\n' +
        '         [id=2, name="Bob",   amount=250.50, status="pending"]\n' +
        '  Storage: Row 1 bytes | Row 2 bytes | ...\n' +
        '  Best for: OLTP (read/write individual rows).\n' +
        '  Compression: general-purpose block compression (LZ4, Zstd). 2–4× ratio typical.\n\n' +
        'Column-store (BigQuery, ClickHouse, Redshift, Parquet, DuckDB):\n' +
        '  Data: [id column: 1, 2, 3...] [name column: Alice, Bob...] [amount column: 100.00, 250.50...]\n' +
        '  Storage: ID values | Name values | Amount values | ...\n' +
        '  Best for: OLAP (aggregate a few columns across millions of rows).\n' +
        '  Compression: RLE + dictionary per column. 10–50× ratio common.\n\n' +
        'Why columnar compresses better:\n' +
        '  Same column → values have similar types, ranges, and patterns.\n' +
        '  "status" column: [delivered, delivered, delivered, pending, delivered, cancelled...] → RLE crushes this.\n' +
        '  Mixed row: [1, Alice, 100.00, delivered, 2024-03-15, Mumbai...] → few patterns across types.',
      example:
        'ClickHouse analytics query: SUM of all orders by month for last year.\n\n' +
        'Row-store (PostgreSQL on 500M rows):\n' +
        '  Must read all columns of all 500M rows to get created_at and amount.\n' +
        '  I/O: 500M × 400 bytes per row = 200GB of data read from disk → 3 minutes.\n\n' +
        'Column-store (ClickHouse, same 500M rows):\n' +
        '  Only reads created_at column (compressed: 2GB) and amount column (compressed: 3GB) = 5GB total.\n' +
        '  I/O: 5GB → 8 seconds.\n' +
        '  With ClickHouse\'s vectorized execution: 1.2 seconds.\n\n' +
        'Same data, same query, same hardware: 3 minutes → 1.2 seconds.',
    },
    {
      title: 'Page-Level vs Row-Level vs Block Compression',
      icon: '🗜️',
      layman:
        'Most traditional databases (PostgreSQL, MySQL) don\'t compress individual values — they compress whole chunks of data together. ' +
        'When a query reads data, it decompresses the chunk, uses what it needs, then moves on. ' +
        'This is simpler to implement and fast enough for most use cases. ' +
        'Some databases compress individual values (like long strings) separately from the rest of the row.',
      technical:
        'PostgreSQL compression:\n' +
        '- TOAST (The Oversized-Attribute Storage Technique): values > 2KB are compressed (LZ) and stored out-of-line automatically.\n' +
        '- Page-level compression (PostgreSQL 14+ with pg_compress): entire 8KB pages compressed before writing to disk. LZ4 default.\n' +
        '- No row-level compression for small values.\n\n' +
        'MySQL InnoDB compression:\n' +
        '- Key-based block compression: 16KB pages compressed to 8KB blocks. 2:1 ratio typical.\n' +
        '- KEY_BLOCK_SIZE in CREATE TABLE controls compression level.\n' +
        '- Trade-off: more CPU on reads/writes; less I/O.\n\n' +
        'TimescaleDB / PostgreSQL hypertable compression:\n' +
        '- Columnar compression for old time-series data.\n' +
        '- Recent data: normal PostgreSQL rows (fast writes).\n' +
        '- Old data (>7 days): automatically compressed with delta+delta + RLE + dictionary.\n' +
        '- Typical ratio: 10–20× for time-series. Queries still work normally.\n\n' +
        'ClickHouse / BigQuery:\n' +
        '- Column-by-column compression with encoding matched to data type.\n' +
        '- Automatic: uses LZ4 by default; better ratio with ZSTD codec.\n' +
        '- Can specify codec per column: amount Float64 CODEC(Delta, ZSTD(3)).',
      example:
        'TimescaleDB in practice (IoT sensor data):\n' +
        'Recent 7 days: 50M rows, 10GB on disk (standard PostgreSQL rows).\n' +
        'Automatic compression kicks in for data >7 days old.\n' +
        'After compression: same 50M rows → 800MB (12× compression ratio).\n\n' +
        'Total: 6 months of historical data + current week.\n' +
        'Without compression: 6 months × 10GB/week × 4 weeks ≈ 240GB.\n' +
        'With compression: (240 - 10GB recent) / 12 + 10GB ≈ 29GB.\n' +
        'Storage cost: 88% reduction. Query on recent data: still fast (uncompressed). Historical query: decompressed on-the-fly, still much less disk I/O.',
    },
    {
      title: 'Compression Trade-offs and Tuning',
      icon: '⚖️',
      layman:
        'Compression is never free — you trade CPU work (to compress/decompress) for disk space (smaller files) and often better performance (more data fits in RAM). ' +
        'The right compression setting depends on your workload. A high-write system with fast SSDs benefits less from compression than a read-heavy analytics system on spinning disks or cloud object storage.',
      technical:
        'CPU vs compression ratio trade-off:\n\n' +
        '┌──────────────┬───────────────┬──────────┬─────────────────────────────┐\n' +
        '│ Algorithm    │ Ratio         │ CPU Cost │ Best For                    │\n' +
        '├──────────────┼───────────────┼──────────┼─────────────────────────────┤\n' +
        '│ LZ4          │ 2–3×          │ Very Low │ OLTP, high-write workloads  │\n' +
        '│ Snappy       │ 2–3×          │ Low      │ High-throughput streaming   │\n' +
        '│ Zstandard    │ 3–7×          │ Medium   │ Balanced OLAP, cold storage │\n' +
        '│ LZO          │ 2–3×          │ Low      │ Hadoop, MapReduce           │\n' +
        '│ BZIP2        │ 5–8×          │ High     │ Archives, offline storage   │\n' +
        '└──────────────┴───────────────┴──────────┴─────────────────────────────┘\n\n' +
        'When compression hurts performance:\n' +
        '1. Very high write rate + slow CPU → decompression bottleneck.\n' +
        '2. Random reads with large block sizes → must decompress whole block for one value.\n' +
        '3. Already compressed data (images, video, encrypted data) → near 0% compression gain, pure CPU waste.\n\n' +
        'When compression helps performance:\n' +
        '1. Analytics: larger I/O blocks, sequential reads → high compression ratio, CPU faster than I/O.\n' +
        '2. Cache fit: compressed data fits in RAM that uncompressed wouldn\'t → more cache hits → faster queries.\n' +
        '3. Network: less data over the wire in distributed queries.',
      example:
        'ClickHouse column compression settings:\n\n' +
        'CREATE TABLE events (\n' +
        '  event_id UInt64 CODEC(Delta, LZ4),   -- IDs are sequential → delta works great\n' +
        '  user_id UInt32 CODEC(LZ4),            -- random, use general compression\n' +
        '  event_type LowCardinality(String),    -- dictionary encoding automatically\n' +
        '  amount Decimal64(2) CODEC(Delta, ZSTD(3)), -- prices change slightly → delta + high ratio\n' +
        '  created_at DateTime CODEC(DoubleDelta, LZ4), -- timestamps → DoubleDelta excellent\n' +
        '  metadata String CODEC(ZSTD(6))        -- JSON blobs → high ratio for text\n' +
        ');\n\n' +
        'Typical result: 1TB raw data → 80GB on disk (12.5× ratio).\n' +
        'Query on event_type (dictionary encoded) → 100× faster than uncompressed string comparison.',
    },
    {
      title: 'Real-World Compression Strategies',
      icon: '🏗️',
      layman:
        'Different parts of your system benefit from different compression strategies. ' +
        'Recent, frequently-written data needs fast compression (low CPU). ' +
        'Old, rarely-accessed data can use aggressive compression (high CPU on write, lower CPU on the rare reads). ' +
        'The best systems use tiered storage: hot tier (fast SSD, light compression), warm tier (HDD, medium compression), cold tier (object storage, aggressive compression).',
      technical:
        'Tiered storage + compression:\n\n' +
        'Tier 1 — Hot (last 7 days, NVMe SSD):\n' +
        '  LZ4 compression (2–3×). Fast writes and reads.\n' +
        '  Small table → fits in buffer cache → often no disk I/O.\n\n' +
        'Tier 2 — Warm (7 days – 3 months, SATA SSD):\n' +
        '  Zstandard level 3 (4–6×). Occasional reads acceptable.\n' +
        '  TimescaleDB compression policy: compress after 7 days.\n\n' +
        'Tier 3 — Cold (>3 months, S3/GCS object storage):\n' +
        '  Parquet format + Zstandard (10–30×). Queries via Athena/BigQuery.\n' +
        '  Cost: $0.023/GB vs $0.10/GB for SSD.\n\n' +
        'PostgreSQL pg_compress + tablespaces:\n' +
        '  Move old partitions to cheaper tablespace:\n' +
        '  ALTER TABLE orders_2022 SET TABLESPACE cold_storage;\n\n' +
        'Compression for JSONB:\n' +
        '  Don\'t store large JSON in JSONB if you can normalize it.\n' +
        '  If you must: PostgreSQL TOAST compresses JSONB > 2KB automatically.\n' +
        '  For analytics: extract key fields into typed columns + compress the blob.',
      example:
        'Flipkart order history system:\n' +
        'Problem: 8 years of order data, 400TB, $40,000/month storage bill.\n\n' +
        'Solution (simplified):\n' +
        '1. Hot (last 90 days): stay in PostgreSQL, LZ4 page compression. 100TB → 35TB.\n' +
        '2. Warm (90 days – 2 years): TimescaleDB compressed chunks. 200TB → 18TB.\n' +
        '3. Cold (>2 years): export to Parquet + Zstd on S3. 100TB → 8TB.\n\n' +
        'After tiering + compression:\n' +
        'Total: 35 + 18 + 8 = 61TB (vs 400TB original).\n' +
        'Storage cost: $6,100/month (vs $40,000). Savings: $33,900/month.\n' +
        'Query latency on hot data: unchanged.\n' +
        'Historical query (via Athena on S3): 8 seconds (acceptable for reporting).',
    },
  ],

  comparison: {
    caption: 'Compression strategies for different database types',
    columns: ['Database', 'Default Compression', 'Best Algorithm', 'Typical Ratio', 'Best For'],
    rows: [
      ['PostgreSQL', 'TOAST for large values', 'LZ4 (pg_compress)', '2–4×', 'OLTP with occasional large blobs'],
      ['MySQL InnoDB', 'Block compression (optional)', 'LZ4 or Zstd', '2–4×', 'Mixed OLTP + moderate analytics'],
      ['ClickHouse', 'Per-column (LZ4 default)', 'Delta + Zstd per type', '10–50×', 'High-volume analytics, time-series'],
      ['BigQuery', 'Automatic columnar', 'Capacitor format', '10–30×', 'Serverless analytics at petabyte scale'],
      ['TimescaleDB', 'Chunked columnar for old data', 'Delta-delta + RLE + Zstd', '10–20×', 'Time-series with hot/cold separation'],
      ['Parquet (files)', 'Per-column encoding', 'Snappy or Zstd', '5–20×', 'Data lake storage, queried by Athena/Spark'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Meta (Facebook)',
      icon: '📘',
      description:
        'Meta stores hundreds of petabytes of analytics data in their internal columnar format. ' +
        'Their ORC and Parquet-based data warehouse uses dictionary encoding + delta encoding + Zstandard. ' +
        'Typical compression: 15–25×. Without compression, their storage costs would be 15× higher — effectively impossible. ' +
        'They also pioneered "cold" storage on low-cost spinning disks, serving queries via Presto/Spark with decompression happening on-the-fly at query time.',
    },
    {
      company: 'Cloudflare',
      icon: '☁️',
      description:
        'Cloudflare\'s Analytics platform stores DNS, HTTP, and security event data from 20 million+ internet properties. ' +
        'Using ClickHouse with custom compression codecs per column (DoubleDelta for timestamps, LowCardinality + LZ4 for string fields), ' +
        'they achieve 12–15× compression on structured event data. ' +
        'This turns a 60TB/day ingestion rate into ~4TB/day of compressed storage — making the entire system economically viable.',
    },
    {
      company: 'Uber',
      icon: '🚕',
      description:
        'Uber\'s trip database stores billions of GPS traces, ride events, and pricing calculations. ' +
        'They use a tiered approach: recent trip data in a row-store (MySQL) with LZ4 compression for fast writes. ' +
        'Historical analytics (>30 days) moved to Hive/Parquet on HDFS with Snappy compression for Spark queries. ' +
        'GPS coordinates stored as delta-encoded integers (difference from last point) rather than absolute floats — reducing GPS trace storage by 4× compared to naive float storage.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is database compression and what are the trade-offs?',
      answer:
        'Database compression stores data in a smaller encoded form, reducing disk I/O and storage costs. Trade-offs: CPU (needed to compress/decompress) vs I/O savings and cache efficiency. ' +
        'Compression helps when: I/O is the bottleneck (HDDs, network storage), data has many repeated values, or fitting more data in RAM cache improves hit rates. ' +
        'Compression hurts when: writes are extremely high-throughput and CPU is the bottleneck, or data is already compressed (images, encrypted bytes). ' +
        'For OLTP: LZ4 (low CPU, 2–3×). For analytics: Zstandard or column-specific encodings (10–50×).',
    },
    {
      question: 'Why do columnar databases compress so much better than row databases?',
      answer:
        'Columnar databases store all values from one column together. Column values are typically the same data type and have similar patterns — "status" column contains only "pending", "delivered", "cancelled" repeated millions of times. ' +
        'Run-length encoding and dictionary encoding can reduce this to near nothing. ' +
        'Row databases store all columns of a row together — a mix of IDs, strings, dates, and numbers with few patterns across types. General-purpose compressors achieve only 2–4× on mixed rows. ' +
        'This is why BigQuery and ClickHouse can query petabytes in seconds — the data being read is 10–50× smaller.',
    },
    {
      question: 'How does TOAST work in PostgreSQL?',
      answer:
        'TOAST (The Oversized-Attribute Storage Technique) handles values larger than 2KB in PostgreSQL. When a value exceeds the threshold, PostgreSQL automatically: (1) tries to compress it (LZ compression); if still >2KB, (2) stores it out-of-line in a separate TOAST table, with a pointer in the main row. ' +
        'This keeps main table rows small (better cache efficiency) while handling large values transparently. ' +
        'JSONB, TEXT, and BYTEA columns benefit most. You don\'t need to do anything — it\'s automatic.',
    },
    {
      question: 'What is the difference between LZ4 and Zstandard compression? When do you use each?',
      answer:
        'LZ4: extremely fast (decompresses at 4GB/s), lower compression ratio (2–3×). Use for OLTP or high-write workloads where CPU is precious. ' +
        'Zstandard (Zstd): slower but achieves 4–7× compression with tunable levels (zstd level 1 is fast, level 19 is maximum ratio). Use for analytics data, cold storage, or when storage cost reduction outweighs CPU overhead. ' +
        'Rule of thumb: LZ4 for hot data, Zstd for warm/cold data. ClickHouse uses LZ4 by default but allows column-level codec override.',
    },
  ],

  commonMistakes: [
    'Applying high-compression to already-compressed data (images, video, encrypted blobs) — zero benefit, pure CPU waste',
    'Using compression on very high-write OLTP without measuring CPU impact — can halve write throughput',
    'Forgetting that general-purpose compression on row-stores achieves only 2–4× — not a substitute for columnar storage for analytics',
    'Not compressing time-series data — delta encoding + RLE on timestamps achieves 50–100× on sequential data',
    'Storing large JSON blobs in row-store tables — each query reads the full blob even if only one field is needed; extract key fields instead',
    'Not tiering storage — storing cold data (years old) on hot NVMe SSDs when S3+Parquet would be 20× cheaper with acceptable query latency',
  ],
};
