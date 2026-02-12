import { StarterPack } from './types';

export interface StarterPackMeta {
  id: string;
  builtin: boolean;
  pack: StarterPack;
}

export const builtinPacks: StarterPackMeta[] = [
  {
    id: 'essential-commands',
    builtin: true,
    pack: {
      tcpack: '1.0',
      name: 'Essential Claude Commands',
      description: 'Core slash commands for everyday development: PR creation, code review, standup reports, ticket work, and deploy checks.',
      author: 'TokenCentric',
      version: '1.0.0',
      tools: {
        claude: {
          configFiles: [
            {
              filename: 'commands/pr.md',
              content: `# Create Pull Request

Create a pull request for the current branch.

## Instructions

1. Run git status and git diff to understand all changes
2. Check if the current branch tracks a remote branch
3. Run git log to see commit history since branching from main
4. Analyze all commits (not just the latest) for the PR description
5. Create the PR using gh pr create with:
   - Short title (under 70 characters)
   - Summary section with 1-3 bullet points
   - Test plan section with checklist
6. Push to remote with -u flag if needed
7. Return the PR URL when done
`,
            },
            {
              filename: 'commands/code-review.md',
              content: `# Code Review

Review the code changes in the current branch or PR.

## Instructions

1. Identify all changed files using git diff
2. For each file, analyze:
   - Correctness: Does the logic work as intended?
   - Security: Any OWASP top 10 vulnerabilities?
   - Performance: Any obvious bottlenecks?
   - Readability: Is the code clear and maintainable?
3. Check for:
   - Missing error handling
   - Untested edge cases
   - Breaking changes to public APIs
4. Provide feedback organized by severity: Critical, Warning, Suggestion
5. Highlight what was done well
`,
            },
            {
              filename: 'commands/standup.md',
              content: `# Standup Report

Generate a standup report from recent git activity.

## Instructions

1. Check git log for commits in the last 24 hours (or since last working day)
2. Group changes by project area or feature
3. Format as:
   - **Yesterday**: What was accomplished
   - **Today**: What's planned (based on open branches, TODO comments)
   - **Blockers**: Any failing tests or unresolved issues
4. Keep it concise - 2-3 bullets per section
`,
            },
            {
              filename: 'commands/do-ticket.md',
              content: `# Do Ticket

Work on a ticket/issue from start to finish.

## Instructions

1. Read the ticket/issue to understand requirements
2. Create a new branch from main with a descriptive name
3. Plan the implementation approach
4. Implement the changes incrementally with atomic commits
5. Run build validation before each commit
6. Run tests at the end to verify nothing is broken
7. Create a PR when complete
`,
            },
            {
              filename: 'commands/deploy-check.md',
              content: `# Deploy Check

Verify the project is ready for deployment.

## Instructions

1. Run the full build: npm run build (or equivalent)
2. Run the test suite: npm test (or equivalent)
3. Check for:
   - TypeScript errors (tsc --noEmit)
   - Lint warnings (npm run lint)
   - Uncommitted changes (git status)
   - Environment variable requirements
4. Report status as PASS or FAIL with details
`,
            },
          ],
        },
      },
    },
  },
  {
    id: 'engineering-agents',
    builtin: true,
    pack: {
      tcpack: '1.0',
      name: 'Engineering Agent Team',
      description: 'A team of specialized engineering agents for frontend, backend, mobile, DevOps, testing, and more.',
      author: 'TokenCentric',
      version: '1.0.0',
      tools: {
        claude: {
          configFiles: [
            {
              filename: 'agents/engineering/frontend-developer.md',
              content: `---
name: "Frontend Developer"
description: "Specializes in React, Vue, Angular, state management, and frontend performance"
color: "#3B82F6"
tools:
  - Write
  - Read
  - MultiEdit
  - Bash
  - Grep
  - Glob
---

Use this agent when building user interfaces, implementing React/Vue/Angular components, handling state management, or optimizing frontend performance.

Capabilities:
- Building responsive, accessible web applications
- React component architecture and hooks patterns
- CSS/Tailwind styling and responsive design
- State management (Redux, Zustand, Context)
- Frontend performance optimization (virtualization, memoization)
- Browser API integration
`,
            },
            {
              filename: 'agents/engineering/backend-architect.md',
              content: `---
name: "Backend Architect"
description: "Designs APIs, databases, and scalable server-side systems"
color: "#10B981"
tools:
  - Write
  - Read
  - MultiEdit
  - Bash
  - Grep
---

Use this agent when designing APIs, building server-side logic, implementing databases, or architecting scalable backend systems.

Capabilities:
- RESTful and GraphQL API design
- Database schema design and query optimization
- Authentication and authorization (OAuth2, JWT)
- Microservices architecture
- Caching strategies (Redis, in-memory)
- Message queues and event-driven patterns
`,
            },
            {
              filename: 'agents/engineering/mobile-app-builder.md',
              content: `---
name: "Mobile App Builder"
description: "Develops native iOS/Android apps with React Native and native performance"
color: "#8B5CF6"
tools:
  - Write
  - Read
  - MultiEdit
  - Bash
  - Grep
  - Glob
---

Use this agent when developing native iOS or Android applications, implementing React Native features, or optimizing mobile performance.

Capabilities:
- React Native / Expo development
- Native iOS (Swift/SwiftUI) and Android (Kotlin) integration
- Push notifications and biometric authentication
- Offline-first architecture
- App Store / Play Store submission preparation
- Performance optimization for mobile devices
`,
            },
            {
              filename: 'agents/engineering/devops-automator.md',
              content: `---
name: "DevOps Automator"
description: "Sets up CI/CD, cloud infrastructure, monitoring, and deployment automation"
color: "#F59E0B"
tools:
  - Write
  - Read
  - MultiEdit
  - Bash
  - Grep
---

Use this agent when setting up CI/CD pipelines, configuring cloud infrastructure, implementing monitoring, or automating deployment processes.

Capabilities:
- GitHub Actions / GitLab CI pipeline configuration
- Docker containerization and orchestration
- Cloud infrastructure (AWS, GCP, Vercel)
- Monitoring and alerting (Datadog, Sentry)
- Auto-scaling and load balancing
- Infrastructure as Code (Terraform, Pulumi)
`,
            },
            {
              filename: 'agents/engineering/test-writer-fixer.md',
              content: `---
name: "Test Writer & Fixer"
description: "Writes tests, runs suites, analyzes failures, and fixes them"
color: "#EF4444"
tools:
  - Write
  - Read
  - MultiEdit
  - Bash
  - Grep
  - Glob
---

Use this agent after code changes to write new tests, run existing tests, analyze failures, and fix them while maintaining test integrity.

Capabilities:
- Unit test writing (Jest, Vitest, pytest)
- Integration and E2E testing (Playwright, Cypress)
- Test coverage analysis and improvement
- Snapshot testing and visual regression
- Mock and stub implementation
- CI test pipeline configuration
`,
            },
          ],
        },
      },
    },
  },
  {
    id: 'full-setup',
    builtin: true,
    pack: {
      tcpack: '1.0',
      name: 'Complete Developer Setup',
      description: 'A comprehensive Claude Code setup with commands, agents, plugins, hooks, and permissions for a productive development workflow.',
      author: 'TokenCentric',
      version: '1.0.0',
      tools: {
        claude: {
          configFiles: [
            {
              filename: 'commands/pr.md',
              content: `# Create Pull Request\n\nCreate a pull request for the current branch with proper title and description.\n`,
            },
            {
              filename: 'commands/code-review.md',
              content: `# Code Review\n\nReview code changes for correctness, security, performance, and readability.\n`,
            },
            {
              filename: 'commands/standup.md',
              content: `# Standup\n\nGenerate a standup report from recent git activity.\n`,
            },
            {
              filename: 'agents/engineering/frontend-developer.md',
              content: `---\nname: "Frontend Developer"\ndescription: "React, Vue, state management, and frontend performance"\ncolor: "#3B82F6"\n---\n\nFrontend development specialist.\n`,
            },
            {
              filename: 'agents/engineering/backend-architect.md',
              content: `---\nname: "Backend Architect"\ndescription: "APIs, databases, and scalable server-side systems"\ncolor: "#10B981"\n---\n\nBackend architecture specialist.\n`,
            },
            {
              filename: 'agents/engineering/test-writer-fixer.md',
              content: `---\nname: "Test Writer & Fixer"\ndescription: "Writes and fixes tests"\ncolor: "#EF4444"\n---\n\nTest automation specialist.\n`,
            },
          ],
          settings: {
            hooks: {
              Stop: [
                {
                  matcher: '',
                  hooks: [
                    {
                      type: 'command',
                      command: 'afplay /System/Library/Sounds/Blow.aiff',
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  },
];
