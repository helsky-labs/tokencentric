import { StarterPack } from './types';

export interface ParsedCommand {
  slug: string;
  title: string;
  summary: string;
  stepCount: number;
  rawContent: string;
}

export interface ParsedAgent {
  name: string;
  description: string;
  color: string;
  tools: string[];
  capabilities: string[];
}

export interface ParsedSettings {
  hookEvents: string[];
  hookCommands: string[];
}

export interface ParsedPackContents {
  commands: ParsedCommand[];
  agents: ParsedAgent[];
  settings: ParsedSettings | null;
  totalFiles: number;
}

function parseCommand(filename: string, content: string): ParsedCommand {
  const slug = filename.replace(/^commands\//, '').replace(/\.md$/, '');

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  // First non-empty paragraph after the title line
  const lines = content.split('\n');
  let summary = '';
  let pastTitle = false;
  for (const line of lines) {
    if (!pastTitle) {
      if (titleMatch && line.includes(titleMatch[1])) {
        pastTitle = true;
      }
      continue;
    }
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.match(/^\d+\./)) {
      summary = trimmed;
      break;
    }
  }

  const stepCount = (content.match(/^\d+\.\s/gm) || []).length;

  return { slug, title, summary, stepCount, rawContent: content };
}

function parseAgent(content: string): ParsedAgent {
  const agent: ParsedAgent = {
    name: '',
    description: '',
    color: '',
    tools: [],
    capabilities: [],
  };

  // Parse YAML frontmatter between --- markers
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const frontmatter = fmMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*"?(.+?)"?\s*$/m);
    const descMatch = frontmatter.match(/^description:\s*"?(.+?)"?\s*$/m);
    const colorMatch = frontmatter.match(/^color:\s*"?(.+?)"?\s*$/m);

    if (nameMatch) agent.name = nameMatch[1];
    if (descMatch) agent.description = descMatch[1];
    if (colorMatch) agent.color = colorMatch[1];

    // Parse tools list
    const toolsSection = frontmatter.match(/^tools:\s*\n((?:\s+-\s+.+\n?)*)/m);
    if (toolsSection) {
      agent.tools = toolsSection[1]
        .split('\n')
        .map((l) => l.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }

  // Parse capabilities from bullet points in body (after frontmatter)
  const body = fmMatch ? content.slice(fmMatch[0].length) : content;
  const capSection = body.match(/Capabilities:\n((?:-\s+.+\n?)*)/);
  if (capSection) {
    agent.capabilities = capSection[1]
      .split('\n')
      .map((l) => l.replace(/^-\s+/, '').trim())
      .filter(Boolean);
  }

  return agent;
}

function parseSettings(settings: Record<string, unknown>): ParsedSettings {
  const result: ParsedSettings = { hookEvents: [], hookCommands: [] };

  const hooks = settings.hooks as Record<string, unknown[]> | undefined;
  if (hooks) {
    for (const [event, matchers] of Object.entries(hooks)) {
      result.hookEvents.push(event);
      if (Array.isArray(matchers)) {
        for (const matcher of matchers) {
          const m = matcher as { hooks?: { command?: string }[] };
          if (m.hooks) {
            for (const h of m.hooks) {
              if (h.command) result.hookCommands.push(h.command);
            }
          }
        }
      }
    }
  }

  return result;
}

export function parsePackContents(pack: StarterPack): ParsedPackContents {
  const commands: ParsedCommand[] = [];
  const agents: ParsedAgent[] = [];
  let settings: ParsedSettings | null = null;
  let totalFiles = 0;

  for (const toolData of Object.values(pack.tools)) {
    const files = toolData.configFiles || [];
    totalFiles += files.length;

    for (const file of files) {
      if (file.filename.startsWith('commands/')) {
        commands.push(parseCommand(file.filename, file.content));
      } else if (file.filename.includes('agents/')) {
        agents.push(parseAgent(file.content));
      }
    }

    if (toolData.settings) {
      settings = parseSettings(toolData.settings);
    }
  }

  return { commands, agents, settings, totalFiles };
}
