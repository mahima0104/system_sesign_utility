import type { ConceptDeepDive } from '../../types';

export const graphDatabases: ConceptDeepDive = {
  moduleId: 'graph-databases',
  tagline: 'When relationships are first-class citizens — not an afterthought',

  introduction: {
    layman:
      'In most databases, data is king and relationships are an afterthought (foreign keys, join tables). ' +
      'In a graph database, relationships are as important as the data itself — they are stored, indexed, and queried as first-class entities. ' +
      'A graph database stores data as nodes (things) and edges (connections between things), both with their own properties. ' +
      '"Alice follows Bob, who works at Acme, which sells products that Alice reviewed" — this is trivially represented and queried in a graph database. ' +
      'In a relational database, it requires five tables, four JOINs, and recursive queries to answer "how is Alice connected to this product?"',
    analogy:
      'Imagine a massive corkboard with photos pinned on it and strings connecting related photos. ' +
      'Each photo is a node (a person, a company, a product). Each string is an edge (works at, knows, purchased). ' +
      'Finding "all people who know someone who works at Google" means following the strings two hops. ' +
      'Doing this in a relational database means building a multi-table query that gets exponentially more complex at each hop. ' +
      'A graph database is built to follow these strings — it is literally what it does.',
    whyMatters:
      'Social networks, fraud detection, recommendation engines, and access control systems all have deeply connected data. ' +
      'LinkedIn\'s "People You May Know" is a 2-hop graph traversal on 900 million nodes. ' +
      'PayPal\'s fraud detection identifies fraudulent rings by finding clusters of connected suspicious accounts. ' +
      'In system design interviews, questions about social graphs, recommendation systems, or fraud detection often have a graph database as the correct answer.',
  },

  subTopics: [
    {
      title: 'The Property Graph Model',
      icon: '🕸️',
      layman:
        'Every graph database is built around the same concept: nodes and edges, both carrying properties. ' +
        'A node represents an entity — a Person, a Product, a Company, a Location. ' +
        'An edge represents a relationship — KNOWS, PURCHASED, WORKS_AT, LOCATED_IN. ' +
        'Both nodes and edges can have properties: a KNOWS edge might have a "since" date; a Person node might have a "name" and "age". ',
      technical:
        'Property graph components:\n\n' +
        'Nodes:\n' +
        '- Represent entities\n' +
        '- Have labels (types): :Person, :Product, :Company\n' +
        '- Have properties: key-value pairs {name: "Alice", age: 32}\n' +
        '- Can have multiple labels: (:Person:Employee)\n\n' +
        'Edges (Relationships):\n' +
        '- Connect two nodes with a direction\n' +
        '- Have a type: FOLLOWS, PURCHASED, WORKS_AT\n' +
        '- Have properties: {since: 2021, weight: 0.8}\n' +
        '- Direction matters: Alice FOLLOWS Bob ≠ Bob FOLLOWS Alice\n\n' +
        'Indexed lookups:\n' +
        '- Nodes indexed by label + property (like a table\'s primary key)\n' +
        '- Relationships stored as adjacency lists per node — traversal is O(degree), not O(table size)\n' +
        '- This is the key performance advantage: following a relationship does not require a table scan\n\n' +
        'Contrast with SQL:\n' +
        'SQL JOIN = check all rows of table B matching a condition on table A\n' +
        'Graph traversal = follow a pointer from node A directly to node B\n' +
        'At 1 million nodes: SQL JOIN scans millions of rows. Graph traversal: follows N pointers where N = degree.',
      example:
        'Social network graph in Neo4j:\n\n' +
        '// Create nodes\n' +
        'CREATE (alice:Person {id: 1, name: "Alice", city: "NYC"})\n' +
        'CREATE (bob:Person   {id: 2, name: "Bob",   city: "SF"})\n' +
        'CREATE (acme:Company {id: 10, name: "Acme Corp", industry: "Tech"})\n\n' +
        '// Create relationships\n' +
        'CREATE (alice)-[:FOLLOWS {since: "2023-01-15"}]->(bob)\n' +
        'CREATE (bob)-[:WORKS_AT {role: "Engineer", since: "2022-06-01"}]->(acme)\n' +
        'CREATE (alice)-[:FOLLOWS {since: "2022-11-01"}]->(acme)\n\n' +
        '// Query: who does Alice follow?\n' +
        'MATCH (alice:Person {name: "Alice"})-[:FOLLOWS]->(target)\n' +
        'RETURN target.name, target\n\n' +
        '// Query: what companies does Alice follow indirectly (via people)?\n' +
        'MATCH (alice:Person {name: "Alice"})-[:FOLLOWS*1..2]->(entity:Company)\n' +
        'RETURN entity.name\n' +
        '// *1..2 = follow FOLLOWS edges between 1 and 2 hops',
    },
    {
      title: 'Cypher Query Language',
      icon: '💻',
      layman:
        'Cypher is the query language of Neo4j (and adopted by others). ' +
        'Its design is visual and intuitive: you literally draw the graph pattern you want to match. ' +
        '(alice)-[:FOLLOWS]->(bob) looks like the graph itself. ' +
        'Once you see the pattern, Cypher is much more readable than recursive SQL for graph queries.',
      technical:
        'Cypher syntax:\n\n' +
        'Node pattern: (variable:Label {property: value})\n' +
        'Relationship pattern: -[:TYPE {prop: val}]->\n' +
        'Path: (a)-[:REL]->(b)-[:REL2]->(c)\n\n' +
        'MATCH: find patterns in the graph\n' +
        'MATCH (p:Person)-[:WORKS_AT]->(c:Company)\n' +
        'WHERE c.industry = "Tech"\n' +
        'RETURN p.name, c.name\n\n' +
        'Variable length paths:\n' +
        'MATCH (a:Person)-[:KNOWS*1..3]->(b:Person)  -- 1 to 3 hops\n' +
        'MATCH (a)-[:KNOWS*]->(b)                    -- any number of hops\n' +
        'MATCH p = shortestPath((a)-[:KNOWS*]-(b))   -- shortest path\n\n' +
        'Aggregation:\n' +
        'MATCH (p:Person)-[:PURCHASED]->(prod:Product)\n' +
        'RETURN prod.name, COUNT(p) as buyers ORDER BY buyers DESC LIMIT 10\n\n' +
        'Create and update:\n' +
        'MERGE (p:Person {email: "alice@co.com"})  -- create if not exists\n' +
        'ON CREATE SET p.created = timestamp()\n' +
        'ON MATCH SET p.lastSeen = timestamp()\n\n' +
        'APOC library: 300+ procedures for graph algorithms:\n' +
        '- apoc.algo.pageRank: identify influential nodes\n' +
        '- apoc.algo.betweenness: find bridge nodes\n' +
        '- apoc.path.subgraphNodes: explore subgraphs',
      example:
        'LinkedIn "People You May Know" query:\n\n' +
        '// Find friends of Alice\'s connections that Alice doesn\'t already know\n' +
        'MATCH (alice:Member {id: 1})\n' +
        '  -[:CONNECTED_TO]->(friend:Member)\n' +
        '  -[:CONNECTED_TO]->(fof:Member)\n' +
        'WHERE NOT (alice)-[:CONNECTED_TO]->(fof)\n' +
        '  AND fof <> alice\n' +
        'RETURN fof.name, fof.headline,\n' +
        '       COUNT(friend) AS mutualConnections\n' +
        'ORDER BY mutualConnections DESC\n' +
        'LIMIT 10\n\n' +
        'Equivalent SQL (recursive CTEs):\n' +
        'WITH friends AS (\n' +
        '  SELECT to_id FROM connections WHERE from_id = 1\n' +
        '),\n' +
        'friends_of_friends AS (\n' +
        '  SELECT c.to_id, COUNT(*) as mutual FROM connections c\n' +
        '  JOIN friends f ON c.from_id = f.to_id\n' +
        '  WHERE c.to_id NOT IN (SELECT to_id FROM friends) AND c.to_id != 1\n' +
        '  GROUP BY c.to_id\n' +
        ')\n' +
        'SELECT u.name, fof.mutual FROM friends_of_friends fof\n' +
        'JOIN users u ON fof.to_id = u.id\n' +
        'ORDER BY fof.mutual DESC LIMIT 10;\n\n' +
        '-- SQL: 200ms on 1M nodes, gets exponentially worse at 3+ hops\n' +
        '-- Neo4j: 15ms on 1M nodes, scales well to 4-5 hops',
    },
    {
      title: 'Fraud Detection with Graph Databases',
      icon: '🔍',
      layman:
        'Fraud often involves rings of connected accounts — multiple fake accounts sharing a device, a payment card, or a phone number. ' +
        'In a relational database, finding these rings requires complex self-joins that get slower as the ring gets larger. ' +
        'In a graph database, these rings are literally visible as cycles in the graph. ' +
        'PayPal, banks, and fintech companies use graph databases to detect fraud in real time.',
      technical:
        'Fraud signals represented as graph edges:\n' +
        '- SHARES_DEVICE: account A and B logged in from same device ID\n' +
        '- SHARES_CARD: account A and B used the same payment card\n' +
        '- SHARES_IP: accounts logged in from same IP range\n' +
        '- SAME_BENEFICIARY: accounts transferred money to same recipient\n\n' +
        'Fraud ring detection patterns:\n\n' +
        '// Find accounts sharing a device with flagged accounts\n' +
        'MATCH (flagged:Account {status: "suspicious"})\n' +
        '  -[:SHARES_DEVICE]->(device:Device)\n' +
        '  <-[:SHARES_DEVICE]-(related:Account)\n' +
        'WHERE flagged <> related\n' +
        'RETURN related.id, device.id, flagged.id\n\n' +
        '// Detect circular money transfers (money laundering)\n' +
        'MATCH cycle = (a:Account)-[:TRANSFERRED*3..6]->(a)\n' +
        'WHERE ALL(t IN relationships(cycle) WHERE t.amount > 500)\n' +
        'RETURN cycle\n\n' +
        '// Community detection (APOC)\n' +
        'CALL apoc.algo.community({label: "Account", relationship: "SHARES_DEVICE"})\n' +
        '// Groups accounts into communities — large communities of shared devices = fraud ring\n\n' +
        'Real-time scoring:\n' +
        '- On transaction: query graph for 1-2 hop connected accounts\n' +
        '- Count fraud signals: shared devices, shared cards, shared IPs\n' +
        '- Compute risk score: high connectivity to known-bad accounts = high risk\n' +
        '- Decision: <50ms response to payment processor',
      example:
        'PayPal fraud ring discovery:\n\n' +
        'Scenario: 15 accounts, each looks legitimate individually.\n' +
        'But: accounts A→B→C→D→E all share device IDs in a circular pattern.\n\n' +
        'SQL detection: requires 5-way self-join on a 100M-row connections table.\n' +
        'At 100M accounts × 3 connections each: 300M rows.\n' +
        'SQL query for 5-hop cycle: >60 seconds. Not usable in real-time.\n\n' +
        'Neo4j detection:\n' +
        'MATCH cycle = (a:Account)-[:SHARES_DEVICE*4..6]->(a)\n' +
        'RETURN nodes(cycle)\n' +
        '→ 120ms. Real-time fraud scoring during checkout.\n\n' +
        'Additional signal: money flow analysis\n' +
        'MATCH (suspicious:Account)-[:SENT*1..3]->(recipient:Account)\n' +
        'WHERE suspicious.risk_score > 0.8\n' +
        'RETURN recipient, COUNT(*) as suspiciousInflows\n' +
        '// Recipients of money from many high-risk accounts = likely money mule',
    },
    {
      title: 'Recommendation Engines',
      icon: '🎯',
      layman:
        '"Users who bought this also bought..." is a graph problem. ' +
        'Users and products are nodes. "Purchased," "viewed," and "rated" are edges. ' +
        'To recommend products to Alice, find products that Alice\'s similar users liked. ' +
        '"Similar users" means users connected through shared product interactions. ' +
        'This is collaborative filtering — and it maps naturally to graph traversals.',
      technical:
        'Collaborative filtering as graph traversal:\n\n' +
        '// Item-based: users who bought A also bought B\n' +
        'MATCH (target:User {id: $userId})-[:PURCHASED]->(product:Product)\n' +
        '      <-[:PURCHASED]-(similar:User)-[:PURCHASED]->(rec:Product)\n' +
        'WHERE NOT (target)-[:PURCHASED]->(rec)\n' +
        'RETURN rec.name, COUNT(similar) as score\n' +
        'ORDER BY score DESC LIMIT 10\n\n' +
        '// Content-based: similar products by shared attributes\n' +
        'MATCH (p1:Product {id: $productId})-[:HAS_TAG]->(tag:Tag)\n' +
        '      <-[:HAS_TAG]-(p2:Product)\n' +
        'WHERE p1 <> p2\n' +
        'RETURN p2.name, COUNT(tag) as similarity\n' +
        'ORDER BY similarity DESC LIMIT 10\n\n' +
        'Graph algorithms for recommendations:\n' +
        '- PageRank: identify influential nodes (top products, key users)\n' +
        '- Similarity algorithms: Jaccard similarity, Pearson coefficient\n' +
        '- Community detection: group users by similar tastes\n' +
        '- Shortest path: "how is Alice connected to this product she might like?"\n\n' +
        'Neo4j Graph Data Science (GDS) library:\n' +
        'CALL gds.nodeSimilarity.stream("myGraph")\n' +
        'YIELD node1, node2, similarity\n' +
        'RETURN gds.util.asNode(node1).name, gds.util.asNode(node2).name, similarity\n' +
        'ORDER BY similarity DESCENDING LIMIT 10',
      example:
        'Spotify music recommendations:\n\n' +
        'Graph structure:\n' +
        '- User nodes: (user:User {id, country, plan})\n' +
        '- Track nodes: (track:Track {id, title, artist, genre})\n' +
        '- Artist nodes: (artist:Artist {id, name, genre})\n' +
        '- Edges: LISTENED_TO {play_count, skip_ratio, last_played}\n' +
        '         FOLLOWED_ARTIST\n' +
        '         SIMILAR_TO (artist to artist, precomputed)\n\n' +
        '// "Discover Weekly" — what do similar users listen to that you don\'t?\n' +
        'MATCH (me:User {id: $myId})-[:LISTENED_TO]->(track:Track)\n' +
        '      <-[:LISTENED_TO]-(similar:User)\n' +
        '-[:LISTENED_TO]->(rec:Track)\n' +
        'WHERE NOT (me)-[:LISTENED_TO]->(rec)\n' +
        'AND similar.country = me.country\n' +
        'WITH rec, COUNT(similar) as listeners,\n' +
        '     AVG(similar_listen.play_count) as avgPlays\n' +
        'ORDER BY listeners * avgPlays DESC\n' +
        'RETURN rec.title, rec.artist LIMIT 30\n\n' +
        'This query runs for each user weekly to generate their playlist.\n' +
        'At 500M users: precomputed and cached, not real-time per user.',
    },
    {
      title: 'Graph Database Internals and Scaling',
      icon: '⚙️',
      layman:
        'Graph databases are fast at traversals because of how they store relationships. ' +
        'In relational databases, a JOIN scans a table to find matching rows. ' +
        'In Neo4j, each node stores direct pointers to its relationships — following a relationship is following a pointer, not scanning a table. ' +
        'This is called "index-free adjacency" and is the secret behind graph database traversal speed.',
      technical:
        'Index-free adjacency:\n' +
        '- Each node record contains a pointer to its first relationship\n' +
        '- Each relationship record contains pointers to: start node, end node, next relationship for start, next relationship for end\n' +
        '- Traversing from Alice to her friends: follow pointer chain from Alice\'s node\n' +
        '- Complexity: O(k) where k = number of relationships, not O(total records)\n\n' +
        'Contrast with SQL JOIN:\n' +
        '- SQL: SELECT ... FROM follows WHERE user_id = 42\n' +
        '  → Even with an index: O(log N + k) where N = all follows\n' +
        '  → At 3 hops: O(log N + k) × k × k — multiplies per hop\n\n' +
        'Neo4j native graph storage:\n' +
        '- Fixed-size node records (15 bytes per node)\n' +
        '- Fixed-size relationship records (34 bytes per relationship)\n' +
        '- Property records: linked list of properties per node/relationship\n' +
        '- Labels and property keys stored in separate stores\n\n' +
        'Scaling limits:\n' +
        '- Single-server Neo4j: up to ~10-100 billion nodes+relationships (with sufficient RAM)\n' +
        '- Hot spot risk: "supernode" with millions of relationships degrades traversal\n' +
        '- Workaround: bucket supernodes, paginate large adjacency lists\n\n' +
        'Neo4j Clustering (Causal Cluster):\n' +
        '- 1 leader (writes) + N followers (reads)\n' +
        '- Raft consensus: leader election and write replication\n' +
        '- Read replicas: async replication for read scaling\n' +
        '- Horizontal scaling is limited vs Cassandra — graph sharding is hard\n\n' +
        'Amazon Neptune:\n' +
        '- Managed graph DB, supports Gremlin and SPARQL\n' +
        '- Storage: distributed across 6 replicas across 3 AZs\n' +
        '- Better managed ops than self-hosted Neo4j',
      example:
        'Supernode problem: celebrity accounts\n\n' +
        'Kylie Jenner (Twitter): 50 million followers\n' +
        'Her :Person node has 50M :FOLLOWS relationships.\n\n' +
        'Query: "Get Kylie\'s followers" → traverse all 50M relationships\n' +
        'This creates a hot spot — her node is accessed constantly.\n\n' +
        'Neo4j handling:\n' +
        '- By default, this traversal is O(50M) — slow\n' +
        '- Fix: paginate using SKIP/LIMIT\n' +
        'MATCH (kylie:Person {id: 99})<-[:FOLLOWS]-(f)\n' +
        'RETURN f SKIP 0 LIMIT 100  -- page 1\n' +
        'RETURN f SKIP 100 LIMIT 100  -- page 2\n\n' +
        '- Fix 2: for fan-out write problems (broadcasting to 50M followers):\n' +
        '  Use a materialised approach — precompute and cache in Redis\n' +
        '  Twitter uses this hybrid: materialise feeds for < 1M followers;\n' +
        '  compute on-read for celebrities (Kylie\'s followers pull her tweets themselves)',
    },
  ],

  comparison: {
    caption: 'Graph database options compared',
    columns: ['Feature', 'Neo4j', 'Amazon Neptune', 'ArangoDB', 'JanusGraph'],
    rows: [
      ['Query language', 'Cypher (primary), Gremlin', 'Gremlin, SPARQL, openCypher', 'AQL (own language)', 'Gremlin'],
      ['Storage', 'Native graph', 'Custom distributed', 'Multi-model (graph + doc)', 'Pluggable (Cassandra, HBase)'],
      ['Managed service', 'AuraDB (cloud)', '✅ Fully managed AWS', 'ArangoDB Cloud', '❌ Self-managed'],
      ['Horizontal scale', '🟡 Read replicas only', '✅ Better than Neo4j', '✅ Sharding support', '✅ Distributed (Cassandra)'],
      ['ACID transactions', '✅', '✅', '✅', '🟡 Limited'],
      ['Best for', 'Social, fraud, knowledge graph', 'AWS-native, compliance', 'Multi-model needs', 'Very large graphs on Cassandra'],
    ],
  },

  realWorldExamples: [
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'LinkedIn\'s entire professional graph — 900M members, billions of connections, endorsements, job postings, and company relationships — powers features like PYMK (People You May Know), job recommendations, and "How you\'re connected" paths. ' +
        'LinkedIn built a custom graph system called Expander for their largest graph queries. ' +
        'Their key finding: multi-hop traversals (2-3 hops) are 10-100× faster in a purpose-built graph system than in relational databases.',
    },
    {
      company: 'eBay',
      icon: '🛒',
      description:
        'eBay uses a knowledge graph (built on graph database principles) called eBay Knowledge Graph to power product search and recommendations. ' +
        'Products, categories, brands, attributes, and user interactions are nodes. ' +
        'Relationships like "A is a subcategory of B," "brand X makes category Y products," and "users who bought A often bought B" power their recommendation engine. ' +
        'Queries like "show me products similar to this one" traverse the graph rather than running complex SQL analytics.',
    },
    {
      company: 'NASA',
      icon: '🚀',
      description:
        'NASA uses Neo4j to manage their knowledge graph of missions, spacecraft, instruments, experiments, and publications. ' +
        'Researchers can query: "which experiments ran on missions that also carried instrument X, and what papers were published from those missions?" ' +
        'This multi-hop query across entity types would require complex joins in a relational system. ' +
        'In Neo4j, it is a straightforward MATCH query. NASA also uses it for managing supply chain relationships for spacecraft components.',
    },
  ],

  interviewQuestions: [
    {
      question: 'When would you use a graph database instead of a relational database?',
      answer:
        'Use a graph database when: (1) Your primary queries are about relationships and traversals — "find all people connected to X within 3 hops," "shortest path between A and B." (2) Relationships are as important as entities — fraud rings, social networks, knowledge graphs. (3) The number of JOIN levels is dynamic and potentially deep — you do not know ahead of time how many hops you need. ' +
        'Relational databases handle 2-3 known JOINs well. At 4+ dynamic hops, graph databases win dramatically. ' +
        'Stick with relational when: you have simple relationships (user → orders), need complex aggregations (SQL GROUP BY + window functions), or your team is unfamiliar with graph modeling. ' +
        'A common interview trap: not every problem with "connections" needs a graph DB. Start with relational; add graph only if traversal performance is a proven bottleneck.',
    },
    {
      question: 'Design the data model for a social network\'s "mutual friends" feature',
      answer:
        'Graph model: nodes are :Person {id, name, profileUrl}, edges are :FOLLOWS {since, notification_enabled}. ' +
        'Mutual friends query: MATCH (me)-[:FOLLOWS]->(mutual)-[:FOLLOWS]->(target) WHERE NOT (me)-[:FOLLOWS]->(target) RETURN mutual.name ORDER BY mutual.followers DESC LIMIT 10. ' +
        'In production: pre-compute mutual friends during follow/unfollow events and cache in Redis. Real-time computation is too slow at scale (Twitter: 300M users × average 700 follows). ' +
        'For read-heavy use cases: materialise the result and cache with a short TTL (5 min). Recompute when a user follows/unfollows (event-driven). ' +
        'For celebrities: skip real-time computation entirely — their "mutual friends" with any given user is negligible at their scale.',
    },
    {
      question: 'How does index-free adjacency give graph databases their performance advantage?',
      answer:
        'In a relational database, finding "all friends of user 42" requires: SELECT * FROM follows WHERE user_id = 42. Even with an index, this involves a B-Tree lookup (log N) plus reading all matching rows. ' +
        'At 3 hops ("friends of friends of friends"): each hop requires another full index scan. Cost multiplies exponentially. ' +
        'In Neo4j with index-free adjacency: user 42\'s node stores a direct pointer to its first FOLLOWS relationship. That relationship points to the next FOLLOWS. Following 10 friends = following 10 pointers — O(k), not O(log N + k). ' +
        'At 3 hops with k friends each: O(k³) pointer follows — no table scans, no index lookups. For sparse graphs (social networks where k << N), this is dramatically faster. ' +
        'The limitation: graph databases do not handle full-table scans or aggregations well — those are SQL strengths.',
    },
  ],

  commonMistakes: [
    'Using a graph database for simple parent-child relationships that a relational database handles fine — adding graph complexity without graph-specific queries',
    'Not handling supernodes — nodes with millions of relationships (celebrity accounts, popular products) cause performance hot spots; plan for this upfront',
    'Running unbounded traversals without a depth limit — MATCH (a)-[:KNOWS*]->(b) without *1..4 limit can traverse the entire graph and time out',
    'Trying to horizontally shard a graph database the way you would a relational database — graph sharding requires graph partitioning algorithms; naively it results in high cross-shard traversal costs',
    'Modeling everything as a graph — if your primary access pattern is simple key lookups or flat aggregations, a relational or document database is simpler and faster',
    'Ignoring graph-specific query optimisation — not using schema indexes on node labels slows MATCH lookups; always index frequently queried node properties',
    'Using a graph database for time-series or write-heavy event data — graph databases are not optimised for high-throughput writes; use Cassandra for events and query a graph projection for relationship analysis',
  ],
};
