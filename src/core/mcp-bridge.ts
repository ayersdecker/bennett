import type { MCPConnection } from '../stores/connectionsStore';

export interface MCPTool {
  name: string;
  description: string;
  connectionId: string;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export class MCPBridge {
  private connections: Map<string, MCPConnection> = new Map();
  private tools: Map<string, MCPTool> = new Map();

  registerConnection(connection: MCPConnection): void {
    this.connections.set(connection.id, connection);
  }

  getAvailableTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool.execute(params);
  }

  getConnectedCount(): number {
    return Array.from(this.connections.values()).filter(
      (c) => c.status === 'connected'
    ).length;
  }
}

export const mcpBridge = new MCPBridge();
