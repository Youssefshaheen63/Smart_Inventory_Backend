export interface ToolExecutorService {
  execute(toolName: string, input: Record<string, unknown>): Promise<unknown>;
}
