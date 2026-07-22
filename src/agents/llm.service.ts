import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigurationError } from './errors/configuration.error';
import { ToolExecutorService } from './interfaces/tool-executor.interface';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

@Injectable()
export class LLMService {
  private client: Anthropic;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ConfigurationError(
        'ANTHROPIC_API_KEY is not set in environment variables. The LLM service cannot start without it.',
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async runWithTools(
    systemPrompt: string,
    userMessage: string,
    tools: Anthropic.Messages.Tool[],
    toolExecutor: ToolExecutorService,
    maxToolRounds: number = 5,
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    for (let round = 0; round < maxToolRounds; round++) {
      const response = await this.client.messages.create({
        model: MODEL,
        system: systemPrompt,
        messages,
        max_tokens: MAX_TOKENS,
        tools: tools.length > 0 ? tools : undefined,
      });

      if (response.stop_reason !== 'tool_use') {
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text',
        );
        return textBlocks.map((b) => b.text).join('\n');
      }

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      messages.push({ role: 'assistant', content: response.content });

      for (const toolUse of toolUseBlocks) {
        let result: unknown;
        try {
          result = await toolExecutor.execute(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }

        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: typeof result === 'string' ? result : JSON.stringify(result),
            },
          ],
        });
      }
    }

    throw new Error(`Exceeded maximum tool rounds (${maxToolRounds}) without a final response.`);
  }

  async getStructuredDecision<T>(
    systemPrompt: string,
    context: string,
    schema: string,
  ): Promise<T> {
    const fullSystemPrompt = `${systemPrompt}\n\nRespond ONLY with a valid JSON object matching this schema, no other text, no markdown code fences:\n${schema}`;

    const response = await this.client.messages.create({
      model: MODEL,
      system: fullSystemPrompt,
      messages: [{ role: 'user', content: context }],
      max_tokens: MAX_TOKENS,
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    const raw = textBlocks.map((b) => b.text).join('\n');

    const cleaned = raw
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```\s*$/g, '')
      .trim();

    return JSON.parse(cleaned) as T;
  }
}
