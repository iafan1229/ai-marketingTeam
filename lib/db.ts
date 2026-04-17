import type { GeneratedDraft, PostResult } from "@/lib/types";

interface MemoryInsight {
  id: string;
  type: "hook" | "weakness" | "strategy";
  content: string;
  createdAt: string;
}

interface MockDb {
  drafts: GeneratedDraft[];
  postResults: PostResult[];
  insights: MemoryInsight[];
}

declare global {
  var __healthlogMockDb__: MockDb | undefined;
}

function createStore(): MockDb {
  return {
    drafts: [],
    postResults: [],
    insights: [],
  };
}

const store = globalThis.__healthlogMockDb__ ?? createStore();

if (!globalThis.__healthlogMockDb__) {
  globalThis.__healthlogMockDb__ = store;
}

export function saveDrafts(drafts: GeneratedDraft[]) {
  store.drafts = [...drafts, ...store.drafts].slice(0, 50);
}

export function listDrafts() {
  return store.drafts;
}

export function savePostResult(result: PostResult) {
  store.postResults = [result, ...store.postResults].slice(0, 100);
}

export function listPostResults() {
  return store.postResults;
}

export function saveInsight(type: MemoryInsight["type"], content: string) {
  store.insights = [
    {
      id: crypto.randomUUID(),
      type,
      content,
      createdAt: new Date().toISOString(),
    },
    ...store.insights,
  ].slice(0, 50);
}

export function listInsights() {
  return store.insights;
}

