export interface ToolsMetrics {
  builtin: { name: string; count: number }[];
  mcp: { totalCalls: number; servers: number };
}

/**
 * Tool-call tallies. MCP tools are aggregated; raw mcp__<uuid> names are
 * never surfaced - only the call total and distinct server count.
 */
export class ToolsEngine {
  private builtin = new Map<string, number>();
  private mcpCalls = 0;
  private mcpServers = new Set<string>();

  addToolUse(name: string): void {
    if (name.startsWith("mcp__")) {
      this.mcpCalls += 1;
      const server = name.split("__")[1];
      if (server) this.mcpServers.add(server);
      return;
    }
    this.builtin.set(name, (this.builtin.get(name) ?? 0) + 1);
  }

  result(): ToolsMetrics {
    return {
      builtin: [...this.builtin.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1)),
      mcp: { totalCalls: this.mcpCalls, servers: this.mcpServers.size },
    };
  }
}
