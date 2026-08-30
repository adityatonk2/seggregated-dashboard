import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getModel, getProviderInfo } from "@/lib/ai/provider";
import { searchLeads, findSimilarLeads } from "@/lib/agent/tools/lead-tools";
import { getLeadStats, searchOrganisations } from "@/lib/agent/tools/analytics-tools";
import { LeadSource } from "@/app/types/lead";

const SYSTEM_PROMPT = `You are "ICP Analyst", a sales intelligence assistant for a B2B CRM.

You have access to a small set of tools that query a real MongoDB database of
sales leads. You must ground every factual claim (counts, names, organisations)
in the results returned by these tools — never invent leads, counts, or
organisations that a tool did not return.

Rules:
- Call at least one tool before making any claim about how many leads exist or match a request.
- Prefer 1-3 tool calls total. Avoid redundant calls with the same arguments.
- When a request mentions multiple roles (e.g. "CTO and CIO"), you may call searchLeads once per role, or combine them into a single regex-friendly role string.
- After gathering results, write a concise, natural-language answer referencing concrete names and organisations from the tool results. Do not dump raw JSON.
- When stating how many leads match, always use the tool result's exact "count" field verbatim — never estimate, round, or count the sample list yourself (the sample you receive is capped and smaller than the true count).
- If a tool returns an error or no results, say so plainly instead of guessing.
- CRITICAL: if a tool call errors (invalid arguments, database error, etc.), you may retry once with simpler/corrected arguments. If it still fails, tell the user plainly that the search could not be completed and why. Under no circumstances invent placeholder or example leads, names, or companies (e.g. "John Doe", "ABC Corporation") and present them as if they were real search results — every name and organisation in your final answer must come verbatim from a successful tool result.`;

const searchLeadsTool = tool({
  description:
    "Search the leads database by organisation, role/title, sector, and/or source. Returns a small capped sample plus a total count.",
  inputSchema: z.object({
    organisation: z.string().optional().describe("Partial or full organisation name to filter by"),
    role: z.string().optional().describe("Job title/role keyword, e.g. 'CTO' or 'Chief Technology'"),
    sector: z.string().optional().describe("Industry sector to filter by"),
    source: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of one or more sources to filter by. Valid values: client_export, card, company_directory, excel_import. Omit entirely if not filtering by source.",
      ),
    // coerce: local models via Ollama sometimes stringify numeric args (e.g. "25" instead of 25)
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max leads to return (server enforces a hard cap of 25)"),
  }),
  execute: async (args) => {
    const source = args.source
      ? (args.source
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) as LeadSource[])
      : undefined;
    return searchLeads({ ...args, source });
  },
});

const getLeadStatsTool = tool({
  description: "Get overall lead counts broken down by source and by sector across the whole database.",
  inputSchema: z.object({}),
  execute: async () => getLeadStats(),
});

const searchOrganisationsTool = tool({
  description:
    "Search distinct organisations represented in the leads database, optionally filtered by name or sector, ranked by how many leads each has.",
  inputSchema: z.object({
    query: z.string().optional().describe("Partial organisation name to search for"),
    sector: z.string().optional().describe("Exact sector to filter by"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max organisations to return (server enforces a hard cap of 20)"),
  }),
  execute: async (args) => searchOrganisations(args),
});

const findSimilarLeadsTool = tool({
  description:
    "Given a specific lead's database id, find other leads similar to it (same organisation, sector, or overlapping role keywords).",
  inputSchema: z.object({
    leadId: z.string().describe("The MongoDB _id of the source lead"),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max similar leads to return (server enforces a hard cap of 20)"),
  }),
  execute: async (args) => findSimilarLeads(args),
});

export type AgentTraceStep = {
  tool: string;
  args: Record<string, unknown>;
  resultSummary: string;
};

export type IcpAnalystResult = {
  answer: string;
  trace: AgentTraceStep[];
  meta: { provider: string; model: string; steps: number };
};

function summarizeResult(toolName: string, result: unknown): string {
  if (result && typeof result === "object" && "error" in result) {
    return `Error: ${(result as { error: string }).error}`;
  }
  if (result && typeof result === "object") {
    if ("count" in result && "leads" in result) {
      return `${(result as { count: number }).count} matching lead(s) found`;
    }
    if ("count" in result && "organisations" in result) {
      return `${(result as { count: number }).count} matching organisation(s) found`;
    }
    if ("total" in result && "bySource" in result) {
      return `Total ${(result as { total: number }).total} leads across all sources/sectors`;
    }
    if ("sourceLead" in result && "similar" in result) {
      const similar = (result as { similar: unknown[] }).similar;
      return `${similar.length} similar lead(s) found`;
    }
  }
  return "Completed";
}

export async function runIcpAnalyst(prompt: string): Promise<IcpAnalystResult> {
  const model = await getModel();

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
    tools: {
      searchLeads: searchLeadsTool,
      getLeadStats: getLeadStatsTool,
      searchOrganisations: searchOrganisationsTool,
      findSimilarLeads: findSimilarLeadsTool,
    },
    stopWhen: stepCountIs(Number(process.env.AI_MAX_STEPS) || 6),
  });

  const trace: AgentTraceStep[] = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => {
      const toolResult = step.toolResults.find(
        (r) => (r as { toolCallId?: string }).toolCallId === call.toolCallId,
      ) as { type?: string; output?: unknown; error?: unknown } | undefined;

      if (!toolResult) {
        return {
          tool: call.toolName,
          args: (call.input as Record<string, unknown>) || {},
          resultSummary: "Error: tool call did not complete (likely invalid arguments)",
        };
      }

      const isToolError = toolResult.type === "tool-error" || toolResult.error !== undefined;
      const payload = isToolError ? toolResult.error : toolResult.output;

      return {
        tool: call.toolName,
        args: (call.input as Record<string, unknown>) || {},
        resultSummary: isToolError
          ? `Error: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`
          : summarizeResult(call.toolName, payload),
      };
    }),
  );

  const { provider, model: modelName } = getProviderInfo();

  return {
    answer: result.text,
    trace,
    meta: { provider, model: modelName, steps: result.steps.length },
  };
}
