import pricingTable from "../pricing/2026-06.json" with { type: "json" };
import type { RawRecord } from "./types.js";

export interface TokenMetrics {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
  apiEquivalentUsd: number;
  pricingTableVersion: string;
}

interface ModelRate {
  input: number;
  output: number;
}

const RATES: Record<string, ModelRate> = pricingTable.models;

/** Longest-prefix match so dated ids (claude-haiku-4-5-20251001) still price. */
export function rateFor(model: string): ModelRate | null {
  let best: ModelRate | null = null;
  let bestLen = 0;
  for (const [prefix, rate] of Object.entries(RATES)) {
    if (model.startsWith(prefix) && prefix.length > bestLen) {
      best = rate;
      bestLen = prefix.length;
    }
  }
  return best;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Sums usage on assistant records deduped by requestId (streaming partials
 * must not double-count). All usage fields are optional - older records
 * degrade to zero, never to wrong numbers.
 */
export class TokensEngine {
  private seen = new Set<string>();
  private totals = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  private usd = 0;

  addAssistant(record: RawRecord): void {
    if (record.type !== "assistant") return;
    const requestId = record.requestId;
    const key = typeof requestId === "string" && requestId.length > 0
      ? requestId
      : `uuid:${String(record.uuid ?? "")}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);

    const message = record.message;
    if (typeof message !== "object" || message === null) return;
    const msg = message as Record<string, unknown>;
    const usage = msg.usage;
    if (typeof usage !== "object" || usage === null) return;
    const u = usage as Record<string, unknown>;

    const input = num(u.input_tokens);
    const output = num(u.output_tokens);
    const cacheRead = num(u.cache_read_input_tokens);
    const cacheCreation = num(u.cache_creation_input_tokens);
    this.totals.input += input;
    this.totals.output += output;
    this.totals.cacheRead += cacheRead;
    this.totals.cacheCreation += cacheCreation;

    const model = typeof msg.model === "string" ? msg.model : "";
    const rate = rateFor(model);
    if (rate) {
      this.usd +=
        (input * rate.input +
          output * rate.output +
          cacheRead * rate.input * pricingTable.cacheReadMultiplier +
          cacheCreation * rate.input * pricingTable.cacheWriteMultiplier) /
        1_000_000;
    }
  }

  result(): TokenMetrics {
    return {
      ...this.totals,
      apiEquivalentUsd: Math.round(this.usd * 100) / 100,
      pricingTableVersion: pricingTable.version,
    };
  }
}
