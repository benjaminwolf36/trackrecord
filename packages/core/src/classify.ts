import { safeTypeName } from "./sanitize.js";
import { KNOWN_RECORD_TYPES, type RawRecord } from "./types.js";
import type { WarningCollector } from "./warnings.js";

const KNOWN = new Set<string>(KNOWN_RECORD_TYPES);

/**
 * Gate every record by top-level `type`. Unknown types are skipped and
 * tallied; records without a usable type are malformed. Never throws.
 */
export function classifyRecord(record: RawRecord, warnings: WarningCollector): RawRecord | null {
  const type = record.type;
  if (typeof type !== "string" || type.length === 0) {
    warnings.tally("skippedMalformedRecord", {});
    return null;
  }
  if (!KNOWN.has(type)) {
    // sanitized: a corrupt "type" could carry prompts/paths into surfaced warnings
    warnings.tally("unknownRecordType", { type: safeTypeName(type) });
    return null;
  }
  return record;
}
