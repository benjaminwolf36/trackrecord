import type { ParserWarning } from "./warnings.js";
import type { OutputMetrics } from "./loc.js";
import type { ActivityMetrics } from "./sessions.js";
import type { DeliveryMetrics } from "./delivery.js";
import type { ToolsMetrics } from "./tools.js";
import type { TokenMetrics } from "./tokens.js";

export const SCHEMA_VERSION = "1.0.0";

/** The schema v1.0.0 contract. Additive changes bump minor, breaking bump major. */
export interface Metrics {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  source: {
    files: number;
    records: number;
    ccVersionRange: [string, string] | [null, null];
    dateRange: [string, string] | [null, null];
    parserWarnings: ParserWarning[];
  };
  output: OutputMetrics;
  delivery: DeliveryMetrics;
  activity: ActivityMetrics;
  tools: ToolsMetrics;
  tokens: TokenMetrics;
  git: { reserved: true };
}
