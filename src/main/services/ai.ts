import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIProvider, AIProviderConfig, AIAction, AISettings, AIStreamChunk } from '../../shared/types';

// System prompts for different actions
const SYSTEM_PROMPTS: Record<AIAction, string> = {
  generate: `You are an expert at creating AI coding assistant context files (like CLAUDE.md, .cursorrules, etc.).
Your task is to generate a comprehensive context file based on the project structure provided.

Guidelines:
- Include clear project overview and tech stack
- List important commands (build, test, dev, lint)
- Document project structure with key directories
- Add coding standards and conventions
- Include relevant file naming patterns
- Be concise but comprehensive
- Use markdown formatting
- Focus on information that helps AI assistants understand and work with the codebase`,

  improve: `You are an expert at improving AI coding assistant context files.
Your task is to enhance the existing context file to make it more useful for AI assistants.

Guidelines:
- Add missing sections if the file is incomplete
- Clarify ambiguous instructions
- Add more specific coding patterns and conventions
- Improve structure and organization
- Remove redundant or outdated information
- Keep the existing voice and style where possible
- Suggest additions for common AI assistant pitfalls
- Be concise but comprehensive`,

  summarize: `You are an expert at summarizing AI coding assistant context files.
Your task is to condense the context file while preserving essential information.

Guidelines:
- Keep critical project information (tech stack, key commands)
- Preserve important coding standards and patterns
- Remove verbose explanations, keep actionable items
- Maintain the essential structure
- Reduce token count by 40-60% while keeping value
- Focus on what AI assistants need most
- Remove examples if concepts are clear without them`,
};

// User prompts for different actions
function getUserPrompt(action: AIAction, content: string, projectInfo?: string, additionalInstructions?: string): string {
  let basePrompt = '';

  switch (action) {
    case 'generate':
      basePrompt = `Generate a context file for the following project structure:\n\n${projectInfo || 'No project info provided'}\n\nCreate a comprehensive CLAUDE.md file.`;
      break;
    case 'improve':
      basePrompt = `Improve the following context file:\n\n${content}\n\nMake it more comprehensive and useful for AI assistants. Return the improved version.`;
      break;
    case 'summarize':
      basePrompt = `Summarize the following context file while keeping essential information:\n\n${content}\n\nReturn a more concise version that reduces token usage.`;
      break;
  }

  // Append additional instructions if provided
  if (additionalInstructions) {
    basePrompt += `\n\n## Additional Instructions:\n${additionalInstructions}`;
  }

  return basePrompt;
}

// Abstract interface for AI providers
interface AIClient {
  streamChat(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;
}

// Anthropic client wrapper
class AnthropicClient implements AIClient {
  private client: Anthropic;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async streamChat(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          onChunk({ type: 'text', content: delta.text });
        }
      }
    }

    onChunk({ type: 'done', content: '' });
  }
}

// OpenAI client wrapper
class OpenAIClient implements AIClient {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async streamChat(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 4096,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk({ type: 'text', content });
      }
    }

    onChunk({ type: 'done', content: '' });
  }
}

// Ollama client wrapper
class OllamaClient implements AIClient {
  private baseUrl: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model;
  }

  async streamChat(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            onChunk({ type: 'text', content: data.message.content });
          }
          if (data.done) {
            onChunk({ type: 'done', content: '' });
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}

// Create AI client based on provider
function createClient(provider: AIProvider, config: AIProviderConfig): AIClient {
  switch (provider) {
    case 'anthropic':
      return new AnthropicClient(config);
    case 'openai':
      return new OpenAIClient(config);
    case 'ollama':
      return new OllamaClient(config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Main AI service class
export class AIService {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  updateSettings(settings: AISettings): void {
    this.settings = settings;
  }

  getActiveProvider(): { provider: AIProvider; config: AIProviderConfig } | null {
    // Try default provider first
    const defaultConfig = this.settings.providers[this.settings.defaultProvider];
    if (defaultConfig.enabled) {
      return { provider: this.settings.defaultProvider, config: defaultConfig };
    }

    // Fall back to any enabled provider
    for (const [provider, config] of Object.entries(this.settings.providers)) {
      if (config.enabled) {
        return { provider: provider as AIProvider, config };
      }
    }

    return null;
  }

  async executeAction(
    action: AIAction,
    content: string,
    projectInfo: string | undefined,
    additionalInstructions: string | undefined,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const active = this.getActiveProvider();
    if (!active) {
      onChunk({ type: 'error', content: 'No AI provider configured. Go to Settings > AI Providers.' });
      return;
    }

    const { provider, config } = active;

    try {
      const client = createClient(provider, config);
      const systemPrompt = SYSTEM_PROMPTS[action];
      const userPrompt = getUserPrompt(action, content, projectInfo, additionalInstructions);

      await client.streamChat(systemPrompt, userPrompt, onChunk);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed';
      onChunk({ type: 'error', content: message });
    }
  }
}
