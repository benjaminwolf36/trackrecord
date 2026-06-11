import type { RawRecord } from "./types.js";

export interface DeliveryMetrics {
  pullRequests: number;
  repositories: number;
  branches: number;
  claudeBranches: number;
}

/** pr-link dedupe by prUrl; branches from main session files only. */
export class DeliveryEngine {
  private prUrls = new Set<string>();
  private repos = new Set<string>();
  private branches = new Set<string>();

  addRecord(record: RawRecord, isAgentFile: boolean): void {
    if (record.type === "pr-link") {
      if (typeof record.prUrl === "string" && record.prUrl.length > 0) {
        this.prUrls.add(record.prUrl);
      }
      if (typeof record.prRepository === "string" && record.prRepository.length > 0) {
        this.repos.add(record.prRepository);
      }
      return;
    }
    if (!isAgentFile && typeof record.gitBranch === "string" && record.gitBranch.length > 0) {
      this.branches.add(record.gitBranch);
    }
  }

  result(): DeliveryMetrics {
    return {
      pullRequests: this.prUrls.size,
      repositories: this.repos.size,
      branches: this.branches.size,
      claudeBranches: [...this.branches].filter((b) => /^claude\//.test(b)).length,
    };
  }
}
