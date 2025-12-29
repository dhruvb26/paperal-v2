import { Pinecone, Index } from "@pinecone-database/pinecone";
import type { RecordMetadataValue } from "@pinecone-database/pinecone";

type Hit = {
  _id: string;
  _score: number;
  fields: Record<string, RecordMetadataValue> & { text: string };
};

type SearchResult = {
  result: {
    hits: Hit[];
  };
};

type MergedHit = {
  _id: string;
  fields: Record<string, RecordMetadataValue> & { text: string };
};

type UpsertRecord = {
  _id: string;
  text: string;
  [key: string]: RecordMetadataValue;
};

const INDEX_NAME = "paperal";
const SPARSE_INDEX_NAME = `${INDEX_NAME}-sparse`;

let client: Pinecone | null = null;
let denseIndex: Index | null = null;
let sparseIndex: Index | null = null;

function getClient(): Pinecone {
  if (!client) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return client;
}

async function initializeIndexes(): Promise<void> {
  const pc = getClient();

  const existingIndexes = await pc.listIndexes();
  const indexNames = existingIndexes.indexes?.map((i) => i.name) ?? [];

  if (!indexNames.includes(INDEX_NAME)) {
    await pc.createIndexForModel({
      name: INDEX_NAME,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: "llama-text-embed-v2",
        fieldMap: { text: "text" },
      },
    });
  }

  if (!indexNames.includes(SPARSE_INDEX_NAME)) {
    await pc.createIndexForModel({
      name: SPARSE_INDEX_NAME,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: "pinecone-sparse-english-v0",
        fieldMap: { text: "text" },
      },
    });
  }

  const denseInfo = await pc.describeIndex(INDEX_NAME);
  const sparseInfo = await pc.describeIndex(SPARSE_INDEX_NAME);

  denseIndex = pc.index(denseInfo.host!);
  sparseIndex = pc.index(sparseInfo.host!);
}

async function ensureInitialized(): Promise<{ dense: Index; sparse: Index }> {
  if (!denseIndex || !sparseIndex) {
    await initializeIndexes();
  }
  return { dense: denseIndex!, sparse: sparseIndex! };
}

async function rerankResults(
  mergedResults: MergedHit[],
  query: string
): Promise<MergedHit[]> {
  const pc = getClient();

  const originalData = Object.fromEntries(
    mergedResults.map((hit) => [hit._id, hit.fields])
  );

  const rerankedResponse = await pc.inference.rerank(
    "bge-reranker-v2-m3",
    query,
    mergedResults.map((hit) => ({
      id: hit._id,
      text: hit.fields.text,
    })),
    {
      topN: 10,
      returnDocuments: true,
      rankFields: ["text"],
      parameters: { truncate: "END" },
    }
  );

  return rerankedResponse.data.map((hit) => {
    const id = hit.document!.id!;
    const original = originalData[id] ?? {};
    return {
      _id: id,
      fields: {
        text: hit.document!.text!,
        ...Object.fromEntries(
          Object.entries(original).filter(([k]) => k !== "text")
        ),
      },
    };
  });
}

function mergeAndDedupeHits(
  h1: SearchResult,
  h2: SearchResult
): MergedHit[] {
  const deduped = new Map<string, Hit>();

  for (const hit of [...h1.result.hits, ...h2.result.hits]) {
    const existing = deduped.get(hit._id);
    if (!existing || hit._score > existing._score) {
      deduped.set(hit._id, hit);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b._score - a._score)
    .map((hit) => ({ _id: hit._id, fields: hit.fields }));
}

export async function query(
  namespace: string,
  queryText: string
): Promise<MergedHit[]> {
  const { dense, sparse } = await ensureInitialized();

  const [denseHits, sparseHits] = await Promise.all([
    dense.namespace(namespace).searchRecords({
      query: { inputs: { text: queryText }, topK: 3 },
    }) as Promise<SearchResult>,
    sparse.namespace(namespace).searchRecords({
      query: { inputs: { text: queryText }, topK: 3 },
    }) as Promise<SearchResult>,
  ]);

  const merged = mergeAndDedupeHits(denseHits, sparseHits);
  return rerankResults(merged, queryText);
}

export async function upsertRecords(
  namespace: string,
  data: UpsertRecord[]
): Promise<boolean> {
  const { dense, sparse } = await ensureInitialized();

  const BATCH_SIZE = 96;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    await Promise.all([
      dense.namespace(namespace).upsertRecords(batch),
      sparse.namespace(namespace).upsertRecords(batch),
    ]);
  }

  return true;
}

export async function deleteRecords(namespace: string): Promise<boolean> {
  const { dense, sparse } = await ensureInitialized();

  await Promise.all([
    dense.namespace(namespace).deleteAll(),
    sparse.namespace(namespace).deleteAll(),
  ]);

  return true;
}