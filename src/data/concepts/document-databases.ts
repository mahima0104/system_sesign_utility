import type { ConceptDeepDive } from '../../types';

export const documentDatabases: ConceptDeepDive = {
  moduleId: 'document-databases',
  tagline: 'Store data the way your code thinks about it — flexible, nested, and fast to read',

  introduction: {
    layman:
      'Document databases store data as self-contained JSON objects called documents. ' +
      'A user document might contain their profile, preferences, and recent activity all in one place — ' +
      'exactly the way your application code thinks about a user object. ' +
      'No splitting across tables, no joining them back together at query time. ' +
      'MongoDB is the most popular document database, used by eBay, LinkedIn, and Expedia. ' +
      'The key selling point: your code and your database speak the same language — JSON.',
    analogy:
      'A relational database is like a library with strict cataloguing: every book must have the same fields on its card (title, author, year, pages, genre). ' +
      'A document database is like a digital archive where each item can have any metadata it needs: ' +
      'a manuscript has pages and a handwritten_by field; a photograph has dimensions and a photographer field; a map has a scale field. ' +
      'Each "document" tells its own complete story, and you do not need to cross-reference multiple catalogues to get the full picture.',
    whyMatters:
      'Document databases have become the default NoSQL choice for many startups and product teams because they match the programming model of modern applications. ' +
      'Objects in your code map directly to documents in the database — no ORM impedance mismatch. ' +
      'In system design interviews, knowing when a document DB outperforms relational (hierarchical data, variable schema, high write volume) and when it falls short (complex joins, ACID transactions) is a mark of engineering maturity.',
  },

  subTopics: [
    {
      title: 'The Document Model: Embedding vs Referencing',
      icon: '📄',
      layman:
        'The most important decision in document database design: do you put related data inside one document (embedding), or do you store it separately and link them by ID (referencing)? ' +
        'Embedding is like putting a shopping list inside a note — everything is in one place, easy to retrieve. ' +
        'Referencing is like keeping a list of book ISBNs and looking them up separately in the library — more flexible but requires extra steps.',
      technical:
        'Embedding (denormalisation):\n' +
        '- Include related data as a nested object or array within the parent document\n' +
        '- One read retrieves all needed data (no joins)\n' +
        '- Best when: data is always accessed together, bounded in size, and child items are "owned" by parent\n' +
        '- Risk: unbounded growth (a post with millions of comments as an array grows forever)\n\n' +
        'Referencing (normalisation):\n' +
        '- Store the _id of related document; look it up in a separate query\n' +
        '- Best when: referenced entity is shared across many parents, or the embedded array could grow unboundedly\n' +
        '- Drawback: two queries (or $lookup) required; no referential integrity enforcement\n\n' +
        'Decision rules:\n' +
        '1. One-to-one: always embed (address inside user)\n' +
        '2. One-to-few (bounded): embed (blog post tags, product images, <10 items)\n' +
        '3. One-to-many (unbounded): reference (post → comments, order → line items over time)\n' +
        '4. Many-to-many: reference (users ↔ groups, products ↔ tags)\n\n' +
        'MongoDB 3.2+ $lookup:\n' +
        'db.orders.aggregate([{ $lookup: { from: "products", localField: "product_id",\n' +
        '  foreignField: "_id", as: "product_details" } }])\n' +
        '- Server-side join but slower than relational JOIN; use sparingly',
      example:
        'Blog post schema design:\n\n' +
        '// Option A: Embed comments (bad for popular posts)\n' +
        '{\n' +
        '  _id: "post-1",\n' +
        '  title: "How Cassandra Works",\n' +
        '  author_id: "user-42",\n' +
        '  content: "...",\n' +
        '  comments: [  // grows forever!\n' +
        '    { text: "Great article!", author: "alice", ts: "2024-01-01" },\n' +
        '    { text: "Really helpful", author: "bob", ts: "2024-01-02" },\n' +
        '    // ... potentially millions of comments\n' +
        '  ]\n' +
        '}\n\n' +
        '// Option B: Reference comments (correct approach)\n' +
        '// Post document:\n' +
        '{ _id: "post-1", title: "...", author_id: "user-42", comment_count: 4521 }\n\n' +
        '// Comment document (separate collection):\n' +
        '{ _id: "comment-1", post_id: "post-1", text: "Great!", author_id: "user-77", ts: ... }\n\n' +
        '// Fetch post comments:\n' +
        'db.comments.find({ post_id: "post-1" }).sort({ ts: -1 }).limit(20)\n' +
        '// Paginated — never loads millions of comments at once',
      whenToUse:
        'Embed when data is always read together and bounded in size. Reference when related data could grow without bound or is independently useful.',
    },
    {
      title: 'Querying and Aggregation in MongoDB',
      icon: '🔍',
      layman:
        'MongoDB has a rich query system that lets you filter, sort, and aggregate data. ' +
        'Unlike SQL where you write text queries, MongoDB uses JSON-style query objects. ' +
        'The aggregation pipeline is MongoDB\'s equivalent of SQL GROUP BY and JOINs — you chain stages that transform documents step by step.',
      technical:
        'Basic queries:\n' +
        'db.users.find({ age: { $gt: 25 }, city: "NYC" })\n' +
        'db.products.find({ tags: { $in: ["gaming", "laptop"] } })\n' +
        'db.orders.find({ "items.price": { $gt: 100 } })  // query inside embedded array\n\n' +
        'Comparison operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin\n' +
        'Logical operators: $and, $or, $not, $nor\n' +
        'Element operators: $exists, $type\n' +
        'Array operators: $all, $elemMatch, $size\n\n' +
        'Aggregation pipeline stages:\n' +
        '$match: filter documents (like WHERE)\n' +
        '$group: group and compute (like GROUP BY)\n' +
        '$sort: sort results (like ORDER BY)\n' +
        '$limit / $skip: pagination\n' +
        '$project: select/reshape fields (like SELECT)\n' +
        '$lookup: join from another collection (like JOIN)\n' +
        '$unwind: flatten an array field into separate documents\n' +
        '$addFields: compute new fields\n\n' +
        'Indexes:\n' +
        'db.users.createIndex({ email: 1 })  // ascending B-Tree index\n' +
        'db.orders.createIndex({ user_id: 1, created_at: -1 })  // compound\n' +
        'db.products.createIndex({ name: "text" })  // full-text search\n' +
        'db.locations.createIndex({ coords: "2dsphere" })  // geospatial',
      example:
        '"Monthly revenue by product category" — MongoDB aggregation pipeline:\n\n' +
        'db.orders.aggregate([\n' +
        '  // Stage 1: Filter last 30 days\n' +
        '  { $match: { createdAt: { $gte: thirtyDaysAgo }, status: "completed" } },\n\n' +
        '  // Stage 2: Flatten the items array (each item becomes a document)\n' +
        '  { $unwind: "$items" },\n\n' +
        '  // Stage 3: Join with products collection to get category\n' +
        '  { $lookup: { from: "products", localField: "items.productId",\n' +
        '               foreignField: "_id", as: "product" } },\n' +
        '  { $unwind: "$product" },\n\n' +
        '  // Stage 4: Group by category and sum revenue\n' +
        '  { $group: {\n' +
        '    _id: "$product.category",\n' +
        '    revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },\n' +
        '    orderCount: { $sum: 1 }\n' +
        '  }},\n\n' +
        '  // Stage 5: Sort by revenue\n' +
        '  { $sort: { revenue: -1 } }\n' +
        '])\n\n' +
        'Equivalent SQL is 5 lines. The MongoDB version is longer but still readable.\n' +
        'The performance difference: $lookup is slower than SQL JOIN for large datasets.',
    },
    {
      title: 'Schema Validation and Data Integrity',
      icon: '🛡️',
      layman:
        'NoSQL is often sold as "schemaless" — but that does not mean schema-free. ' +
        'It means the database does not enforce structure by default. ' +
        'Without discipline, your documents become inconsistent: some have a "phone" field, some call it "phone_number," some have neither. ' +
        'MongoDB supports JSON Schema validation to catch bad data before it enters the database.',
      technical:
        'MongoDB schema validation (v3.6+):\n' +
        'db.createCollection("users", {\n' +
        '  validator: { $jsonSchema: {\n' +
        '    bsonType: "object",\n' +
        '    required: ["name", "email", "createdAt"],\n' +
        '    properties: {\n' +
        '      email: { bsonType: "string", pattern: "^\\S+@\\S+\\.\\S+$" },\n' +
        '      age: { bsonType: "int", minimum: 18 },\n' +
        '      plan: { bsonType: "string", enum: ["free", "pro", "enterprise"] }\n' +
        '    }\n' +
        '  }},\n' +
        '  validationAction: "error"  // or "warn"\n' +
        '})\n\n' +
        'What MongoDB cannot enforce:\n' +
        '- Referential integrity: document B referencing document A\'s _id — MongoDB will not prevent deleting A\n' +
        '- Cross-collection consistency: no foreign key constraints\n' +
        '- Cascade deletes: must implement in application code\n\n' +
        'Application-level enforcement strategies:\n' +
        '- Use an ODM (Mongoose for Node.js, MongoEngine for Python) with schema definitions\n' +
        '- Validate in service layer before writes\n' +
        '- Write integration tests that verify document shape\n' +
        '- Use MongoDB Atlas Data Explorer to audit document shapes in production',
      example:
        'Referential integrity problem in MongoDB:\n\n' +
        '// User document\n' +
        '{ _id: ObjectId("user-42"), name: "Alice" }\n\n' +
        '// Order documents referencing user\n' +
        '{ _id: ObjectId("order-1"), user_id: ObjectId("user-42"), total: 99 }\n' +
        '{ _id: ObjectId("order-2"), user_id: ObjectId("user-42"), total: 249 }\n\n' +
        '// Delete user (MongoDB allows this with no warning)\n' +
        'db.users.deleteOne({ _id: ObjectId("user-42") })\n\n' +
        '// Now orders have a dangling user_id\n' +
        '// MongoDB will not flag this. order-1 and order-2 are orphaned.\n\n' +
        '// In PostgreSQL:\n' +
        'DELETE FROM users WHERE id = 42;\n' +
        '-- ERROR: foreign key constraint "orders_user_id_fkey" on table "orders"\n' +
        '-- Database PREVENTS deletion. You must handle orders first.\n\n' +
        '// Fix in MongoDB: application must cascade delete manually\n' +
        'await db.orders.deleteMany({ user_id: userId });\n' +
        'await db.users.deleteOne({ _id: userId });',
      whenToUse:
        'Always define schema validation in MongoDB for production collections. Never rely on "the application will always write correct data" — it will not, eventually.',
    },
    {
      title: 'Transactions in MongoDB',
      icon: '🔐',
      layman:
        'MongoDB added multi-document ACID transactions in version 4.0 (2018). ' +
        'Before that, MongoDB was limited to atomic operations on a single document. ' +
        'Now you can wrap multiple document writes in a transaction — if one fails, all roll back. ' +
        'The catch: multi-document transactions have a performance cost and should be used sparingly.',
      technical:
        'Single-document atomicity (always):\n' +
        '- Operations on a single document are always atomic\n' +
        '- Even complex $push, $pull, $inc on embedded arrays are atomic\n' +
        '- This covers most use cases if you model data with embedding\n\n' +
        'Multi-document transactions (v4.0+):\n' +
        'const session = client.startSession();\n' +
        'session.startTransaction();\n' +
        'try {\n' +
        '  await accounts.updateOne({ _id: "A" },\n' +
        '    { $inc: { balance: -100 } }, { session });\n' +
        '  await accounts.updateOne({ _id: "B" },\n' +
        '    { $inc: { balance: 100 } }, { session });\n' +
        '  await session.commitTransaction();\n' +
        '} catch (e) {\n' +
        '  await session.abortTransaction();\n' +
        '} finally { session.endSession(); }\n\n' +
        'Transaction limitations:\n' +
        '- Maximum 16MB of data within one transaction\n' +
        '- 60-second wall clock limit by default\n' +
        '- Performance overhead: 2–3× slower than non-transactional operations\n' +
        '- Requires replica set or sharded cluster (not standalone)\n\n' +
        'Best practice:\n' +
        '- Design document model to minimise cross-document atomicity needs\n' +
        '- Use single-document atomicity (embedding) for most cases\n' +
        '- Reserve transactions for genuinely cross-collection operations',
      example:
        'E-commerce inventory update with MongoDB transaction:\n\n' +
        'Scenario: User buys 2 units of product P1.\n' +
        'Must: decrement inventory AND create order atomically.\n\n' +
        'const session = client.startSession();\n' +
        'session.startTransaction();\n' +
        'try {\n' +
        '  // Check and decrement inventory\n' +
        '  const result = await products.findOneAndUpdate(\n' +
        '    { _id: "P1", stock: { $gte: 2 } },\n' +
        '    { $inc: { stock: -2 } },\n' +
        '    { session, returnDocument: "after" }\n' +
        '  );\n' +
        '  if (!result.value) throw new Error("Insufficient stock");\n\n' +
        '  // Create order\n' +
        '  await orders.insertOne({\n' +
        '    userId: "U42", productId: "P1", qty: 2,\n' +
        '    total: result.value.price * 2, status: "pending"\n' +
        '  }, { session });\n\n' +
        '  await session.commitTransaction();\n' +
        '} catch (e) {\n' +
        '  await session.abortTransaction();\n' +
        '  throw e;\n' +
        '}',
    },
    {
      title: 'Scaling MongoDB',
      icon: '📈',
      layman:
        'MongoDB scales horizontally by sharding — splitting data across multiple servers called shards. ' +
        'You choose a shard key, and MongoDB automatically routes documents to the correct shard and balances data as it grows. ' +
        'Each shard can be a replica set for high availability. ' +
        'This is MongoDB\'s major scaling advantage over single-primary relational databases.',
      technical:
        'Replica sets (high availability):\n' +
        '- 1 primary (writes) + 2+ secondaries (reads/failover)\n' +
        '- Automatic failover: if primary fails, secondary elected in <10 seconds\n' +
        '- Read preference: PRIMARY, PRIMARY_PREFERRED, SECONDARY, NEAREST\n' +
        '- Read from secondaries: may serve stale data (replication lag)\n\n' +
        'Sharding architecture:\n' +
        '- Mongos: query router — app connects here\n' +
        '- Config servers: store shard metadata (replica set of 3)\n' +
        '- Shards: each a replica set holding a subset of data\n\n' +
        'Shard key selection (same rules as any sharding):\n' +
        '- High cardinality: avoid boolean or enum shard keys\n' +
        '- Even distribution: avoid "hot" values (user_id of a celebrity causing one shard to get all traffic)\n' +
        '- Query isolation: most queries should target one shard\n\n' +
        'Chunk balancing:\n' +
        '- Data is split into 64MB "chunks" per shard key range\n' +
        '- Balancer automatically moves chunks between shards to equalise\n' +
        '- Can cause I/O spikes; schedule balancing during off-peak hours\n\n' +
        'Atlas: MongoDB\'s managed service\n' +
        '- Auto-scaling, auto-backup, multi-region clusters\n' +
        '- Atlas Search: Lucene-based full-text search integrated with MongoDB\n' +
        '- Atlas Vector Search: pgvector-equivalent for AI workloads',
      example:
        'eBay uses MongoDB for their product catalog:\n\n' +
        'Challenge: 1.4 billion active listings, each with highly variable attributes:\n' +
        '- Electronics: brand, model, RAM, storage, screen size\n' +
        '- Clothing: size, colour, material, gender, fit\n' +
        '- Vehicles: make, model, year, mileage, VIN\n\n' +
        'Why MongoDB:\n' +
        '- Each listing type has completely different attributes\n' +
        '- SQL would require dozens of attribute tables with complex JOINs\n' +
        '- MongoDB: one document per listing with flexible attribute subdocument\n\n' +
        '{ _id: "L123456", category: "electronics", subcategory: "laptop",\n' +
        '  title: "Dell XPS 15", price: 1299, condition: "new",\n' +
        '  attrs: { cpu: "i7-12700H", ram: "16GB", storage: "512GB NVMe",\n' +
        '           display: "15.6\\" OLED", weight_kg: 1.86 },\n' +
        '  seller_id: "S789", listed_at: ISODate("2024-01-15") }\n\n' +
        'Sharded by seller_id: all listings from one seller on same shard.\n' +
        'Secondary index on category + price for browse queries.',
    },
  ],

  comparison: {
    caption: 'MongoDB vs Firestore vs CouchDB — document database comparison',
    columns: ['Feature', 'MongoDB', 'Firestore', 'CouchDB'],
    rows: [
      ['Best for', 'General purpose apps, complex queries', 'Mobile/web real-time apps', 'Offline-first, sync'],
      ['Transactions', '✅ Multi-doc ACID', '✅ Multi-doc', '✅ Single-doc atomic'],
      ['Real-time', '❌ (watch cursors)', '✅ Native listeners', '✅ Change feed'],
      ['Offline sync', '❌', '✅ Client SDKs', '✅ Built-in CouchDB sync'],
      ['Query power', '✅ Rich aggregation', '🟡 Limited (no OR queries)', '🟡 MapReduce, Mango'],
      ['Managed service', 'MongoDB Atlas', 'Google Firestore', 'Cloudant (IBM)'],
      ['Scale', '✅ Sharding', '✅ Automatic', '🟡 Manual clustering'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Expedia',
      icon: '✈️',
      description:
        'Expedia uses MongoDB for their hotel content database — 1+ million properties, each with wildly different attributes. ' +
        'A budget hostel has different fields than a resort or an apartment rental. ' +
        'MongoDB\'s flexible schema lets each property document contain the exact attributes relevant to its type. ' +
        'They shard by hotel_id for even distribution and index on location (2dsphere index) for proximity searches.',
    },
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'LinkedIn built Espresso, an internal document database, because their user profile data had highly variable structure that did not fit well into a rigid relational schema. ' +
        'Different professional profiles have radically different sections (skills, endorsements, publications, patents, projects). ' +
        'Espresso stores each profile as a document with the relevant sections embedded. ' +
        'They expose an indexing service on top for query patterns beyond simple key-based lookups.',
    },
    {
      company: 'Adobe',
      icon: '🎨',
      description:
        'Adobe uses MongoDB for Adobe Experience Manager (AEM) — their enterprise CMS. ' +
        'Content (pages, assets, components) is stored as documents because CMS content is inherently hierarchical and variable. ' +
        'A hero banner component has different fields than a product listing or a navigation menu. ' +
        'MongoDB\'s tree-structured document model maps naturally to the hierarchical page and component structure of a CMS.',
    },
  ],

  interviewQuestions: [
    {
      question: 'When would you choose MongoDB over PostgreSQL?',
      answer:
        'Three strong signals for MongoDB: ' +
        '(1) Schema is highly variable per record — different product types have completely different attributes; forcing them into SQL tables requires either JSON columns (at which point just use MongoDB) or complex EAV tables. ' +
        '(2) Data is naturally hierarchical and always accessed as a unit — a user profile with embedded education, experience, and skills is fetched as one document; splitting across SQL tables means 5 JOINs per profile read. ' +
        '(3) Schema evolves rapidly — adding a new field to MongoDB requires zero migration; in PostgreSQL on a 100M-row table, ALTER TABLE is painful. ' +
        'If you need complex reporting queries with joins, strong referential integrity, or financial ACID guarantees — PostgreSQL wins.',
    },
    {
      question: 'How do you model a one-to-many relationship in MongoDB?',
      answer:
        'Depends on the cardinality and access pattern. ' +
        'One-to-few (bounded): embed. A blog post with at most 3 authors: store authors array inside post document. One read, always accessed together. ' +
        'One-to-many (unbounded): reference. An order can have thousands of line items over its lifetime — store order_id in each line_item document. Query line items separately. ' +
        'One-to-many (read together): bucket pattern. Group items into arrays of N (e.g., 100 items per bucket document). Used by MongoDB for time-series data to avoid millions of tiny documents. ' +
        'The anti-pattern: embedding unbounded arrays in a document. MongoDB has a 16MB document size limit — large arrays break this.',
    },
    {
      question: 'What is the 16MB document size limit and why does it matter?',
      answer:
        'MongoDB limits each document to 16MB in BSON format. This is intentional — very large documents indicate a design problem (usually an unbounded embedded array). ' +
        'A blog post with 10 million comments embedded as an array would hit this limit. ' +
        'The correct fix: use referencing (store comments in a separate collection with a post_id field). ' +
        'In interviews, when asked about MongoDB, mentioning document size limits shows you understand its constraints, not just its selling points. ' +
        'Practical rule: if any array field could grow unboundedly (comments, events, log entries), reference instead of embed.',
    },
  ],

  commonMistakes: [
    'Embedding unbounded arrays in documents — comments, events, or log entries that grow forever will hit the 16MB document limit',
    'Treating MongoDB as a "schemaless" database and skipping schema validation — inconsistent documents cause production bugs',
    'Using MongoDB because it is "easier to start with" and then needing relational features later (JOINs, foreign keys, complex transactions)',
    'Not defining indexes before querying in production — MongoDB does a full collection scan if no index exists for a query',
    'Using $lookup extensively as a SQL-JOIN replacement — it works, but it is much slower; if you need lots of joins, consider if relational is the right choice',
    'Not handling referential integrity in the application layer — MongoDB will not prevent deleting a document that others reference',
    'Choosing a poor shard key — a low-cardinality or monotonically-increasing shard key creates unbalanced shards ("hot shards")',
  ],
};
