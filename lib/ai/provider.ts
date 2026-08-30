import type { LanguageModel } from "ai";

export type AiProviderName = "ollama" | "openai" | "anthropic" | "google" | "groq";

function resolveProviderName(): AiProviderName {
  const raw = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  if (raw === "ollama" || raw === "openai" || raw === "anthropic" || raw === "google" || raw === "groq") {
    return raw;
  }
  throw new Error(`Unknown AI_PROVIDER "${raw}". Expected one of: ollama, openai, anthropic, google, groq`);
}

async function buildModel(providerName: AiProviderName): Promise<LanguageModel> {
  switch (providerName) {
    case "ollama": {
      const { createOllama } = await import("ai-sdk-ollama");
      const baseURL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
      const model = process.env.OLLAMA_MODEL || "llama3.1";
      const ollama = createOllama({ baseURL });
      return ollama(model);
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({ apiKey });
      return openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
    }
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const anthropic = createAnthropic({ apiKey });
      return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5");
    }
    case "google": {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required when AI_PROVIDER=google");
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const google = createGoogleGenerativeAI({ apiKey });
      return google(process.env.GOOGLE_MODEL || "gemini-2.0-flash");
    }
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq");
      const { createGroq } = await import("@ai-sdk/groq");
      const groq = createGroq({ apiKey });
      return groq(process.env.GROQ_MODEL || "openai/gpt-oss-120b");
    }
  }
}

let cachedModel: Promise<LanguageModel> | undefined;
let cachedProviderName: AiProviderName | undefined;

/**
 * Lazily builds (and caches) the configured LanguageModel. Deferred until
 * first use, same pattern as lib/mongodb.ts's getMongoClientPromise, so
 * `next build` never fails on a missing provider API key. A failed build
 * clears the cache so the next call retries instead of awaiting a dead promise.
 */
export function getModel(): Promise<LanguageModel> {
  if (!cachedModel) {
    const providerName = resolveProviderName();
    cachedProviderName = providerName;
    const promise = buildModel(providerName);
    promise.catch(() => {
      if (cachedModel === promise) cachedModel = undefined;
    });
    cachedModel = promise;
  }
  return cachedModel;
}

export function getProviderInfo(): { provider: AiProviderName; model: string } {
  const provider = cachedProviderName || resolveProviderName();
  const modelEnvKey: Record<AiProviderName, string> = {
    ollama: process.env.OLLAMA_MODEL || "llama3.1",
    openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
    anthropic: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    google: process.env.GOOGLE_MODEL || "gemini-2.0-flash",
    groq: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  };
  return { provider, model: modelEnvKey[provider] };
}
