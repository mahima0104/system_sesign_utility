import type { ConceptDeepDive } from '../../types';

export const vectorDatabases: ConceptDeepDive = {
  moduleId: 'vector-databases',
  tagline: 'The database that understands meaning — not just data',

  introduction: {
    layman:
      'Traditional databases find data by exact match: "find all users where city = \'NYC\'". ' +
      'Vector databases find data by similarity: "find all documents that are about the same topic as this query." ' +
      'They do this by representing data as lists of numbers (vectors) that capture meaning. ' +
      'A sentence is converted to a 1,536-number vector where sentences with similar meaning have similar numbers. ' +
      '"I love machine learning" and "I enjoy deep learning" would be close together in vector space. ' +
      '"I hate broccoli" would be far away. ' +
      'Vector databases are the foundation of AI search, recommendation systems, and the RAG (Retrieval Augmented Generation) pattern that powers modern AI chatbots.',
    analogy:
      'Imagine you could describe every book in a library using its coordinates on a map — books about similar topics are placed close together. ' +
      '"Machine learning" books cluster near "artificial intelligence" books, which cluster near "statistics" books. ' +
      '"Romance novels" cluster in a completely different region. ' +
      'When you search for "books about teaching computers to learn," the library maps your query to a point on this map and shows you the nearest books — without caring about exact word matches. ' +
      'This is semantic search, and vector databases are the system that makes this map queryable in milliseconds.',
    whyMatters:
      'The explosion of LLMs (ChatGPT, Claude, Gemini) has made vector databases one of the fastest-growing technology categories. ' +
      'RAG (Retrieval Augmented Generation) — the pattern where you retrieve relevant context from a vector database to ground LLM responses — is used in virtually every production AI application. ' +
      'In system design interviews, "design an AI-powered search" or "design a RAG system" are common questions at companies building AI features. ' +
      'Understanding embeddings, ANN search algorithms, and when to use vector databases vs traditional search is now expected for senior AI/ML-adjacent roles.',
  },

  subTopics: [
    {
      title: 'Embeddings: Converting Data to Vectors',
      icon: '🔢',
      layman:
        'An embedding model is a neural network that converts any piece of data (text, image, audio) into a fixed-length list of numbers. ' +
        'These numbers capture the "essence" of the data — text embeddings capture semantic meaning, image embeddings capture visual features. ' +
        'OpenAI\'s text-embedding-3-small model converts any text into 1,536 numbers. ' +
        'Two texts about the same topic produce vectors that are mathematically similar (close in distance). ' +
        'This is the magic: meaning becomes geometry.',
      technical:
        'How text embedding works:\n' +
        '- Input: string of text (sentence, paragraph, document chunk)\n' +
        '- Processing: transformer neural network encodes contextual meaning\n' +
        '- Output: dense float vector of fixed dimension (e.g., 1536 floats)\n' +
        '- Each dimension captures some latent semantic feature\n\n' +
        'Similarity metrics:\n' +
        '- Cosine similarity: angle between vectors (most common for text)\n' +
        '  cos(θ) = (A·B) / (|A|×|B|). Range: -1 (opposite) to 1 (identical).\n' +
        '- Dot product: similar to cosine but magnitude matters (for scores)\n' +
        '- Euclidean distance: geometric distance in vector space\n' +
        '- Hamming distance: for binary vectors (efficient but lossy)\n\n' +
        'Popular embedding models:\n' +
        '- text-embedding-3-small (OpenAI): 1536 dims, balanced cost/quality\n' +
        '- text-embedding-3-large (OpenAI): 3072 dims, highest quality\n' +
        '- all-MiniLM-L6-v2 (Sentence Transformers): 384 dims, fast, free\n' +
        '- CLIP (OpenAI): multimodal — image and text in same vector space\n' +
        '- Cohere Embed: multilingual, 1024 dims\n\n' +
        'Practical dimensions:\n' +
        '- Higher dimensions → better quality, more storage, slower search\n' +
        '- 384d: good for fast similarity, small index\n' +
        '- 1536d: standard for production semantic search\n' +
        '- 3072d: maximum quality, use for critical retrieval tasks',
      example:
        'Generating and using embeddings with OpenAI:\n\n' +
        'import OpenAI from "openai";\n' +
        'const openai = new OpenAI();\n\n' +
        '// Convert text to vector\n' +
        'async function embed(text: string): Promise<number[]> {\n' +
        '  const response = await openai.embeddings.create({\n' +
        '    model: "text-embedding-3-small",\n' +
        '    input: text\n' +
        '  });\n' +
        '  return response.data[0].embedding;  // array of 1536 floats\n' +
        '}\n\n' +
        '// Example similarity check:\n' +
        'const vec1 = await embed("I love machine learning");\n' +
        'const vec2 = await embed("I enjoy deep learning research");\n' +
        'const vec3 = await embed("The weather is nice today");\n\n' +
        'cosineSimilarity(vec1, vec2) → 0.92  (very similar meaning)\n' +
        'cosineSimilarity(vec1, vec3) → 0.21  (unrelated topics)\n\n' +
        '// Cosine similarity function:\n' +
        'function cosineSimilarity(a: number[], b: number[]): number {\n' +
        '  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);\n' +
        '  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai*ai, 0));\n' +
        '  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi*bi, 0));\n' +
        '  return dot / (magA * magB);\n' +
        '}',
      whenToUse:
        'Use embeddings whenever you need semantic understanding — not keyword matching. For exact keyword search, Elasticsearch is simpler and faster. Use embeddings when "machine learning" should match "AI" and "neural networks."',
    },
    {
      title: 'ANN Search: HNSW and IVF Indexes',
      icon: '🔍',
      layman:
        'Finding the exact nearest neighbor in a space of 1 million 1,536-dimensional vectors would require comparing your query to all 1 million vectors — too slow. ' +
        'ANN (Approximate Nearest Neighbor) algorithms find the very-close-but-not-guaranteed-exact nearest neighbors in milliseconds. ' +
        'The trade-off is accuracy: you might miss 1-5% of the true nearest neighbors. ' +
        'For semantic search, this is completely acceptable — the result quality is indistinguishable from exact search.',
      technical:
        'HNSW (Hierarchical Navigable Small World):\n' +
        '- Graph-based index. Each vector is a node. Connections span different "layers."\n' +
        '- Top layers: few long-range connections (highway graph)\n' +
        '- Bottom layers: many short-range connections (local neighbourhood)\n' +
        '- Search: start at top layer, navigate to approximate location, descend to find exact neighbours\n' +
        '- Like a GPS: use highways to get close, then local roads to pinpoint\n\n' +
        '- Time complexity: O(log N) query time\n' +
        '- Space complexity: O(N × M) where M = connections per node (default 16)\n' +
        '- Parameters:\n' +
        '  efConstruction: build time accuracy (default 200)\n' +
        '  M: edges per node — higher M = better recall, more memory\n' +
        '  ef: search time accuracy (higher = slower, better recall)\n' +
        '- Best for: low-latency queries, moderate dataset size (<100M vectors)\n\n' +
        'IVF (Inverted File Index):\n' +
        '- Clusters vectors using k-means (nlist clusters)\n' +
        '- At query time: find nearest cluster centroids (nprobe clusters), search only those clusters\n' +
        '- Like a library: go to the right section, then search that section\n' +
        '- Parameters:\n' +
        '  nlist: number of clusters (typical: sqrt(N))\n' +
        '  nprobe: clusters to search at query time (higher = better recall, slower)\n' +
        '- Best for: large datasets (>10M vectors), memory-efficient\n\n' +
        'IVF-PQ (Product Quantisation):\n' +
        '- Compresses vectors by quantising sub-vectors\n' +
        '- 1536-dim float (6KB) → 64-byte PQ code (96× compression)\n' +
        '- Slight accuracy loss for massive memory savings\n' +
        '- Can store 1 billion 1536-dim vectors in ~64GB (vs 6TB raw)',
      example:
        'Benchmark comparison — 1M vectors, 1536 dimensions:\n\n' +
        'Exact k-NN (brute force):\n' +
        '  Latency: 1500ms per query\n' +
        '  Recall: 100%\n' +
        '  Memory: 6GB (float32)\n\n' +
        'HNSW (M=16, efConstruction=200, ef=100):\n' +
        '  Latency: 2-5ms per query (300-750× faster)\n' +
        '  Recall: 98-99%\n' +
        '  Memory: 7.5GB (6GB + 1.5GB graph structure)\n\n' +
        'IVF-PQ (nlist=1024, nprobe=10, 64 bytes/vector):\n' +
        '  Latency: 5-15ms per query\n' +
        '  Recall: 85-95%\n' +
        '  Memory: 64MB (vs 6GB — 93× smaller)\n\n' +
        'Production choice:\n' +
        '- <50M vectors with fast RAM: HNSW (best latency)\n' +
        '- >100M vectors or memory-constrained: IVF-PQ\n' +
        '- FAISS library (Meta): implements both, industry standard for custom systems',
    },
    {
      title: 'RAG: Retrieval Augmented Generation',
      icon: '🤖',
      layman:
        'LLMs like ChatGPT know a lot from training, but they do not know about your company\'s internal documents, your product\'s latest features, or events after their training cutoff. ' +
        'RAG (Retrieval Augmented Generation) solves this by retrieving relevant information from a vector database and including it in the LLM\'s context. ' +
        'When a user asks "What is our refund policy?", the system: (1) searches the vector database for relevant policy documents, (2) includes those documents in the LLM prompt, (3) the LLM answers based on the retrieved context. ' +
        'The LLM generates the answer; the vector database provides the knowledge.',
      technical:
        'RAG architecture:\n\n' +
        'Offline (indexing pipeline):\n' +
        '1. Load documents (PDFs, web pages, database records)\n' +
        '2. Chunk: split into overlapping segments (400-800 tokens, 20% overlap)\n' +
        '3. Embed: convert each chunk to vector using embedding model\n' +
        '4. Store: insert (vector, metadata, text) into vector database\n\n' +
        'Online (query pipeline):\n' +
        '1. Embed user query using same embedding model\n' +
        '2. ANN search: find top-K most similar chunks\n' +
        '3. Re-rank (optional): cross-encoder to improve precision\n' +
        '4. Build prompt: system prompt + retrieved chunks + user question\n' +
        '5. LLM inference: generate answer grounded in retrieved context\n' +
        '6. Return: answer with source citations\n\n' +
        'Chunking strategies:\n' +
        '- Fixed size: 512 tokens with 50-token overlap (simple, effective)\n' +
        '- Semantic: split at sentence/paragraph boundaries\n' +
        '- Recursive: split by paragraph, then sentence, then word as needed\n' +
        '- Document-specific: PDF page-based, Markdown section-based\n\n' +
        'Evaluation metrics:\n' +
        '- Recall@K: what % of relevant chunks are in top-K results\n' +
        '- MRR (Mean Reciprocal Rank): how highly ranked is the first relevant result\n' +
        '- Answer faithfulness: does the LLM answer match the retrieved context\n' +
        '- Answer relevance: does the answer address the question',
      example:
        'Building a customer support RAG system:\n\n' +
        '// Indexing pipeline (runs once + on document updates)\n' +
        'async function indexDocuments(docs: Document[]) {\n' +
        '  for (const doc of docs) {\n' +
        '    const chunks = splitIntoChunks(doc.text, { size: 500, overlap: 100 });\n' +
        '    for (const chunk of chunks) {\n' +
        '      const embedding = await embed(chunk.text);\n' +
        '      await vectorDB.upsert({\n' +
        '        id: chunk.id,\n' +
        '        vector: embedding,\n' +
        '        metadata: { docId: doc.id, title: doc.title, section: chunk.section }\n' +
        '      });\n' +
        '    }\n' +
        '  }\n' +
        '}\n\n' +
        '// Query pipeline (runs on each user question)\n' +
        'async function answerQuestion(question: string): Promise<string> {\n' +
        '  // 1. Embed the question\n' +
        '  const queryVector = await embed(question);\n\n' +
        '  // 2. Find top-5 relevant chunks\n' +
        '  const results = await vectorDB.query({\n' +
        '    vector: queryVector,\n' +
        '    topK: 5,\n' +
        '    includeMetadata: true\n' +
        '  });\n\n' +
        '  // 3. Build context from retrieved chunks\n' +
        '  const context = results.matches\n' +
        '    .map(r => `[${r.metadata.title}]\\n${r.metadata.text}`)\n' +
        '    .join("\\n\\n");\n\n' +
        '  // 4. Generate grounded answer\n' +
        '  const response = await openai.chat.completions.create({\n' +
        '    model: "gpt-4o",\n' +
        '    messages: [\n' +
        '      { role: "system", content: "Answer using ONLY the provided context. Cite sources." },\n' +
        '      { role: "user", content: `Context:\\n${context}\\n\\nQuestion: ${question}` }\n' +
        '    ]\n' +
        '  });\n\n' +
        '  return response.choices[0].message.content;\n' +
        '}',
      whenToUse:
        'RAG is the standard pattern for grounding LLMs in your specific data. Use it whenever users ask questions about private, proprietary, or recent information that the LLM was not trained on.',
    },
    {
      title: 'Hybrid Search: Vectors + Keywords',
      icon: '🔀',
      layman:
        'Pure vector search is great for semantic queries but misses exact keyword matches. ' +
        'Pure keyword search (Elasticsearch) misses semantically similar terms. ' +
        'Hybrid search combines both: use BM25 for keyword matching AND vectors for semantic similarity, then blend the scores. ' +
        'This is why Weaviate\'s "best of both worlds" approach has become the production standard for search systems.',
      technical:
        'The problem with pure vector search:\n' +
        '- Query: "GPT-4 performance benchmarks"\n' +
        '- Vector search: finds documents about "LLM evaluation" and "model comparison"\n' +
        '  → Good semantic match, but may miss documents that literally mention "GPT-4"\n\n' +
        'The problem with pure keyword search (BM25):\n' +
        '- Query: "machine learning performance"\n' +
        '- BM25: finds documents with exact words "machine", "learning", "performance"\n' +
        '  → Misses: "deep learning speed", "neural network benchmarks"\n\n' +
        'Hybrid search:\n' +
        '- Run both BM25 and vector search independently\n' +
        '- Combine scores with Reciprocal Rank Fusion (RRF):\n' +
        '  score = 1/(rank_bm25 + k) + 1/(rank_vector + k)  where k=60\n' +
        '- Re-rank the combined list\n' +
        '- Top results match both semantically AND lexically\n\n' +
        'Implementation options:\n' +
        '1. Weaviate: native BM25 + vector hybrid with alpha parameter\n' +
        '   alpha=0: pure keyword, alpha=1: pure vector, alpha=0.5: balanced\n\n' +
        '2. Elasticsearch + pgvector:\n' +
        '   Run ES query for keyword score\n' +
        '   Run pgvector for semantic score\n' +
        '   Merge in application with RRF\n\n' +
        '3. Pinecone with sparse+dense vectors:\n' +
        '   Store sparse BM25 vector + dense embedding\n' +
        '   Query both indexes, combine scores',
      example:
        'E-commerce product search:\n\n' +
        'User query: "blue running shoes under $100"\n\n' +
        'Pure BM25 results:\n' +
        '  1. "Blue Athletic Training Shoes" (exact keyword: blue, shoes)\n' +
        '  2. "Blue Running Sneakers" (keywords: blue, running)\n' +
        '  3. "Blue Casual Footwear" (keywords: blue, shoes)\n\n' +
        'Pure vector results:\n' +
        '  1. "Navy Performance Trainers" (semantic: running + sports)\n' +
        '  2. "Sapphire Speed Runners" (semantic: running shoes, similar color)\n' +
        '  3. "Blue Athletic Footwear" (semantic: shoes + athletic)\n\n' +
        'Hybrid results (RRF combined):\n' +
        '  1. "Blue Running Sneakers" (top of both lists)\n' +
        '  2. "Blue Athletic Training Shoes" (high BM25 + good semantic)\n' +
        '  3. "Navy Performance Trainers" (top semantic, good lexical)\n\n' +
        '// Plus price filtering: metadata filter price < 100\n' +
        '// This is how Amazon and Zappos search actually works',
    },
    {
      title: 'Vector Database Architecture and Scaling',
      icon: '⚙️',
      layman:
        'Vector databases must store millions to billions of high-dimensional vectors and answer similarity queries in milliseconds. ' +
        'This requires specialised storage and indexing that general databases do not provide. ' +
        'The main options: purpose-built vector databases (Pinecone, Weaviate, Qdrant) or extensions to existing databases (pgvector for PostgreSQL, Redis Vector).',
      technical:
        'Purpose-built vector databases:\n\n' +
        'Pinecone (managed, serverless):\n' +
        '- Managed SaaS: no infrastructure to manage\n' +
        '- Namespaces: logical isolation within an index (multi-tenancy)\n' +
        '- Metadata filtering: filter by metadata BEFORE vector search\n' +
        '  { filter: { category: "sports", price: { $lt: 100 } }, vector: query_vec }\n' +
        '- Serverless tier: pay per query, scales to 0 (ideal for variable traffic)\n' +
        '- Limitation: vendor lock-in, higher cost at large scale\n\n' +
        'Weaviate (open source, managed cloud):\n' +
        '- Multi-modal: text, image, audio in same system\n' +
        '- Native hybrid search (BM25 + vector)\n' +
        '- GraphQL-based query API with object relationships\n' +
        '- Modules: plug-in embedding models, spellcheck, Q&A\n' +
        '- Horizontal sharding with replication\n\n' +
        'Qdrant (open source, Rust-based):\n' +
        '- High performance (Rust implementation)\n' +
        '- Payload filtering with complex conditions\n' +
        '- Sparse + dense vector hybrid search\n' +
        '- On-disk index option: trade latency for memory efficiency\n\n' +
        'pgvector (PostgreSQL extension):\n' +
        '- vector column type in regular PostgreSQL table\n' +
        '- ivfflat and hnsw index types\n' +
        '- Full SQL: JOIN metadata with vector search in one query\n' +
        '- Best for: <10M vectors, existing PostgreSQL infrastructure\n' +
        '- Scale limit: single-node PostgreSQL limits (vs distributed native vector DBs)\n\n' +
        'Redis Vector Similarity Search:\n' +
        '- Vector index on Redis keys\n' +
        '- HNSW and FLAT index types\n' +
        '- In-memory: fastest queries, limited by RAM\n' +
        '- Good for: small-medium datasets where latency is paramount',
      example:
        'pgvector for a semantic documentation search (under 1M chunks):\n\n' +
        '-- Enable extension\n' +
        'CREATE EXTENSION vector;\n\n' +
        '-- Table: document chunks with embeddings\n' +
        'CREATE TABLE doc_chunks (\n' +
        '  id          BIGSERIAL PRIMARY KEY,\n' +
        '  doc_id      BIGINT REFERENCES documents(id),\n' +
        '  chunk_text  TEXT,\n' +
        '  embedding   vector(1536),  -- OpenAI text-embedding-3-small\n' +
        '  created_at  TIMESTAMP DEFAULT NOW()\n' +
        ');\n\n' +
        '-- HNSW index for fast approximate search\n' +
        'CREATE INDEX ON doc_chunks USING hnsw (embedding vector_cosine_ops)\n' +
        '  WITH (m = 16, ef_construction = 64);\n\n' +
        '-- Semantic search query with metadata filter\n' +
        'SELECT dc.chunk_text, d.title,\n' +
        '       1 - (dc.embedding <=> $1::vector) AS similarity\n' +
        'FROM doc_chunks dc\n' +
        'JOIN documents d ON dc.doc_id = d.id\n' +
        'WHERE d.category = \'api\' AND d.published = true  -- metadata filter\n' +
        'ORDER BY dc.embedding <=> $1::vector  -- <=> = cosine distance\n' +
        'LIMIT 5;\n\n' +
        '-- $1 is the query embedding (1536-dim vector)\n' +
        '-- This single SQL query: metadata filter + vector search + JOIN\n' +
        '-- pgvector makes this possible in PostgreSQL',
    },
  ],

  comparison: {
    caption: 'Vector database options compared',
    columns: ['Feature', 'Pinecone', 'Weaviate', 'Qdrant', 'pgvector'],
    rows: [
      ['Type', 'Managed SaaS', 'Open source / Cloud', 'Open source / Cloud', 'PostgreSQL extension'],
      ['Managed service', '✅ Fully managed', 'Weaviate Cloud', 'Qdrant Cloud', 'Via Supabase, Neon, etc.'],
      ['Hybrid search', '✅ Sparse+dense', '✅ Native BM25', '✅ Sparse+dense', '🟡 Manual (FTS + pgvector)'],
      ['Max scale', '1B+ vectors', '100M+ vectors', '100M+ vectors', '~10M (single node)'],
      ['SQL / joins', '❌', '❌ (GraphQL)', '❌', '✅ Full SQL'],
      ['Multi-modal', '❌', '✅ (images, audio)', '❌', '❌'],
      ['Best for', 'Quick start, minimal ops', 'Multi-modal, complex schema', 'Performance-critical, self-hosted', 'PostgreSQL teams, <10M vecs'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Notion',
      icon: '📝',
      description:
        'Notion AI uses vector databases to power their "Ask Anything" feature. ' +
        'When a user asks a question, the system embeds the query, searches a Pinecone vector index of all the user\'s Notion pages and blocks, retrieves the most relevant content, and passes it to Claude or GPT-4 to generate a grounded answer. ' +
        'Without the vector database, the LLM would have no knowledge of the user\'s private workspace content. ' +
        'This is RAG in production: vector retrieval + LLM generation.',
    },
    {
      company: 'Spotify',
      icon: '🎵',
      description:
        'Spotify uses embeddings for their music recommendation system. ' +
        'Each track is embedded based on its audio features, lyrical content, and user listening patterns. ' +
        'Tracks with similar embeddings sound alike or are liked by similar users. ' +
        '"Discover Weekly" is partially powered by finding your listening history\'s centroid in embedding space and finding nearest neighbours — songs you haven\'t heard but are close to your taste vector. ' +
        'They built Annoy (Approximate Nearest Neighbours Oh Yeah) — an open-source ANN library — to power this at 500M user scale.',
    },
    {
      company: 'GitHub Copilot',
      icon: '💻',
      description:
        'GitHub Copilot uses RAG to provide contextually relevant code completions. ' +
        'Beyond the immediate code window, Copilot retrieves semantically similar code from your repository and open-source codebases using embedding-based search. ' +
        'When you write a function signature, it retrieves: (1) similar functions in your codebase, (2) similar patterns from GitHub\'s code corpus. ' +
        'These retrieved examples are included in the LLM context, dramatically improving completion quality. ' +
        'This is why Copilot "understands" your codebase\'s patterns and conventions beyond what is visible in the current file.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain how you would design a semantic search system for a large documentation site',
      answer:
        'Architecture: ' +
        '(1) Offline indexing: crawl all documentation pages → split into 400-token chunks with 100-token overlap → embed each chunk with text-embedding-3-small → store (chunk_text, embedding, metadata) in Pinecone or pgvector. ' +
        '(2) Query handling: embed the search query → ANN search top-20 in vector index → re-rank with cross-encoder for precision → return top-5 with source links. ' +
        '(3) Hybrid search: also run BM25 keyword search → combine with vector results using Reciprocal Rank Fusion → covers both semantic and exact matches. ' +
        '(4) For AI answer generation: take top-5 retrieved chunks → pass to LLM with "answer based only on provided context" → return synthesised answer with citations. ' +
        'Scale considerations: for <1M chunks, pgvector on a PostgreSQL instance handles it simply. For >10M chunks, use a purpose-built vector database (Pinecone, Weaviate).',
    },
    {
      question: 'What is the difference between keyword search and semantic search?',
      answer:
        'Keyword search (BM25/TF-IDF): matches exact or stemmed words. "machine learning models" matches documents containing those words. Fast, deterministic, no ML required. ' +
        'Fails for: synonyms ("neural networks" ≠ "machine learning" in keyword search), intent-based queries ("how to make my model faster" → should find documents about "model optimisation"). ' +
        'Semantic search: converts query and documents to embeddings. Finds documents whose meaning is similar, regardless of exact words. Handles synonyms, paraphrases, intent. ' +
        'Fails for: exact lookups (product codes, error codes — "ERROR_401_FORBIDDEN" → keyword search wins). ' +
        'Production systems use hybrid: BM25 for precision + vectors for recall. The alpha parameter (vector weight) is tuned per use case — code search leans keyword, conversational search leans semantic.',
    },
    {
      question: 'What are the key challenges in building a production RAG system?',
      answer:
        'Five main challenges: ' +
        '(1) Chunking strategy: too-small chunks lose context; too-large chunks introduce noise and exceed context windows. Experiment with 400-600 tokens, overlap 10-20%. ' +
        '(2) Retrieval precision: semantic search can return tangentially related chunks. Use re-ranking (cross-encoders) or hybrid search to improve precision. ' +
        '(3) LLM hallucination: the LLM may generate answers not grounded in retrieved context. Constrain prompts: "answer ONLY from context; say I don\'t know if not covered." ' +
        '(4) Embedding model consistency: use the same model to embed documents and queries. Mixing models degrades similarity scores. ' +
        '(5) Index freshness: when source documents update, re-index them. Design incremental indexing pipelines, not full re-indexes. Track document versions with checksums. ' +
        'Evaluation: build a test set of question-answer pairs, measure Recall@K and answer faithfulness regularly — RAG quality degrades silently as documents change.',
    },
    {
      question: 'When would you use a vector database vs Elasticsearch for search?',
      answer:
        'Elasticsearch wins when: queries use specific keywords, product codes, or identifiers; exact phrase matching matters; you need faceted filtering (filter by brand, price, category); you have structured documents with many filterable fields. Elasticsearch has been production-proven at billion-scale with rich query DSL. ' +
        'Vector database wins when: queries are natural language / conversational; users express intent not keywords; semantic similarity matters (recommendations, "similar items", Q&A); multilingual search (embeddings handle languages natively). ' +
        'Best answer: use both with hybrid search. Run Elasticsearch BM25 + vector similarity → combine with RRF. Most mature search platforms (Elasticsearch 8+, OpenSearch) now support vector search natively, so you do not always need a separate vector DB. ' +
        'The separate vector DB makes sense when: you have AI-specific retrieval needs beyond text (images, code), you want serverless scale-to-zero (Pinecone serverless), or you are building a specialised AI application.',
    },
  ],

  commonMistakes: [
    'Using different embedding models for indexing and querying — vectors are only comparable if generated by the same model; mixing models produces random results',
    'Chunking documents into pieces too large (>1000 tokens) — the LLM context gets flooded with irrelevant content; smaller focused chunks improve precision',
    'Not filtering by metadata before vector search — searching all vectors when you only need vectors from a specific category wastes computation; always pre-filter with metadata',
    'Treating vector search as a replacement for keyword search — exact keyword and product code lookups need BM25; always combine with hybrid search for production systems',
    'Not re-ranking retrieved results — ANN search optimises for approximate similarity, not answer quality; cross-encoder re-ranking dramatically improves final answer relevance',
    'Storing full documents as single vectors — one embedding cannot represent a long document well; always chunk and embed separately',
    'Not measuring RAG quality with a test set — assumed working without evaluation; retrieval quality degrades silently as your document corpus changes',
  ],
};
