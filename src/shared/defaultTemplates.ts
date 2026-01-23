import { Template } from './types';

export const defaultTemplates: Template[] = [
  // 1. Minimal Template
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A clean starting point with just the essentials',
    toolId: 'all',
    category: 'minimal',
    content: `# {{PROJECT_NAME}}

## Overview
Brief description of this project.

## Tech Stack
- Language/Framework here

## Key Commands
\`\`\`bash
# Install dependencies
npm install

# Run development
npm run dev

# Build
npm run build
\`\`\`

## Project Structure
\`\`\`
src/
├── index.ts    # Entry point
└── ...
\`\`\`
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-project',
        required: true,
      },
    ],
  },

  // 2. Full-Stack JavaScript
  {
    id: 'fullstack-js',
    name: 'Full-Stack JavaScript',
    description: 'Next.js/React with Node.js backend patterns',
    toolId: 'all',
    category: 'fullstack',
    content: `# {{PROJECT_NAME}}

## Overview
A full-stack JavaScript application using modern patterns.

## Tech Stack
- **Frontend**: {{FRONTEND_FRAMEWORK}}
- **Backend**: Node.js
- **Database**: {{DATABASE}}
- **Styling**: Tailwind CSS

## Project Structure
\`\`\`
{{PROJECT_NAME}}/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── features/     # Feature-specific components
│   ├── lib/              # Utilities and helpers
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── public/               # Static assets
├── prisma/               # Database schema (if using Prisma)
└── tests/                # Test files
\`\`\`

## Key Commands
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Database migrations (if using Prisma)
npx prisma migrate dev
\`\`\`

## Coding Standards
- Use TypeScript with strict mode
- Prefer functional components with hooks
- Use named exports for components
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use \`async/await\` over raw promises

## File Naming
- Components: PascalCase (e.g., \`UserCard.tsx\`)
- Utilities: camelCase (e.g., \`formatDate.ts\`)
- Types: PascalCase with \`.types.ts\` suffix
- Tests: \`*.test.ts\` or \`*.spec.ts\`

## API Conventions
- RESTful endpoints under \`/api/*\`
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return consistent JSON responses
- Handle errors with proper status codes
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-fullstack-app',
        required: true,
      },
      {
        name: 'FRONTEND_FRAMEWORK',
        label: 'Frontend Framework',
        placeholder: 'Next.js 14 (App Router)',
        required: false,
      },
      {
        name: 'DATABASE',
        label: 'Database',
        placeholder: 'PostgreSQL with Prisma',
        required: false,
      },
    ],
  },

  // 3. Python
  {
    id: 'python',
    name: 'Python',
    description: 'Python project with virtual environments and testing',
    toolId: 'all',
    category: 'backend',
    content: `# {{PROJECT_NAME}}

## Overview
A Python project following best practices.

## Tech Stack
- **Language**: Python 3.11+
- **Package Manager**: pip / poetry
- **Testing**: pytest
- **Linting**: ruff, black

## Project Structure
\`\`\`
{{PROJECT_NAME}}/
├── src/
│   └── {{MODULE_NAME}}/
│       ├── __init__.py
│       ├── main.py
│       └── utils/
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── pyproject.toml
├── requirements.txt
└── README.md
\`\`\`

## Setup
\`\`\`bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python -m src.{{MODULE_NAME}}.main

# Run tests
pytest

# Format code
black src/ tests/
ruff check src/ tests/
\`\`\`

## Coding Standards
- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for public functions and classes
- Keep functions small and focused (< 20 lines ideal)
- Use \`pathlib.Path\` over \`os.path\`
- Prefer f-strings for string formatting

## Testing
- One test file per module
- Use descriptive test names: \`test_should_return_user_when_valid_id\`
- Use fixtures for common setup
- Aim for >80% coverage on critical paths

## Environment Variables
- Use \`.env\` file for local development
- Never commit secrets to version control
- Document all required env vars in README
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-python-project',
        required: true,
      },
      {
        name: 'MODULE_NAME',
        label: 'Module Name',
        placeholder: 'myapp',
        required: true,
      },
    ],
  },

  // 4. Monorepo
  {
    id: 'monorepo',
    name: 'Monorepo',
    description: 'Multi-package workspace with shared code',
    toolId: 'all',
    category: 'fullstack',
    content: `# {{PROJECT_NAME}} Monorepo

## Overview
A monorepo containing multiple packages and applications.

## Tech Stack
- **Package Manager**: {{PACKAGE_MANAGER}}
- **Build System**: Turborepo
- **Languages**: TypeScript

## Workspace Structure
\`\`\`
{{PROJECT_NAME}}/
├── apps/
│   ├── web/              # Main web application
│   ├── admin/            # Admin dashboard
│   └── api/              # Backend API
├── packages/
│   ├── ui/               # Shared React components
│   ├── config/           # Shared configs (ESLint, TypeScript, Tailwind)
│   ├── utils/            # Shared utilities
│   └── types/            # Shared TypeScript types
├── turbo.json            # Turborepo config
├── package.json          # Root package.json
└── pnpm-workspace.yaml   # Workspace definition (if using pnpm)
\`\`\`

## Key Commands
\`\`\`bash
# Install all dependencies
{{INSTALL_CMD}}

# Run all apps in development
{{RUN_CMD}} dev

# Build all packages
{{RUN_CMD}} build

# Run tests across all packages
{{RUN_CMD}} test

# Add dependency to specific package
{{ADD_CMD}} lodash --filter web

# Run command in specific package
{{RUN_CMD}} dev --filter=web
\`\`\`

## Package Dependencies
- Apps can import from \`packages/*\`
- Packages should NOT import from \`apps/*\`
- Use \`@{{PROJECT_NAME}}/*\` for internal package imports

## Coding Standards
- Shared code goes in \`packages/\`
- Each package has its own \`package.json\`
- Use TypeScript project references
- Keep packages focused and minimal
- Document public APIs with JSDoc

## Adding a New Package
1. Create folder in \`packages/\` or \`apps/\`
2. Add \`package.json\` with correct name
3. Add to workspace config if needed
4. Run install command to link

## CI/CD
- Use \`turbo run build --filter=[origin/main...]\` for affected builds
- Cache node_modules and .turbo folders
- Run tests in parallel where possible
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-monorepo',
        required: true,
      },
      {
        name: 'PACKAGE_MANAGER',
        label: 'Package Manager',
        placeholder: 'pnpm',
        required: false,
      },
      {
        name: 'INSTALL_CMD',
        label: 'Install Command',
        placeholder: 'pnpm install',
        required: false,
      },
      {
        name: 'RUN_CMD',
        label: 'Run Command',
        placeholder: 'pnpm',
        required: false,
      },
      {
        name: 'ADD_CMD',
        label: 'Add Dependency Command',
        placeholder: 'pnpm add',
        required: false,
      },
    ],
  },

  // 5. API Project
  {
    id: 'api',
    name: 'API Project',
    description: 'REST or GraphQL API backend',
    toolId: 'all',
    category: 'backend',
    content: `# {{PROJECT_NAME}} API

## Overview
Backend API service for {{PROJECT_NAME}}.

## Tech Stack
- **Runtime**: Node.js / {{RUNTIME}}
- **Framework**: {{FRAMEWORK}}
- **Database**: {{DATABASE}}
- **Auth**: JWT / OAuth2

## Project Structure
\`\`\`
{{PROJECT_NAME}}/
├── src/
│   ├── routes/           # API route handlers
│   ├── controllers/      # Business logic
│   ├── services/         # Data access layer
│   ├── middleware/       # Auth, validation, logging
│   ├── models/           # Database models
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── tests/
│   ├── unit/
│   └── integration/
├── docs/                 # API documentation
└── scripts/              # Deployment scripts
\`\`\`

## Key Commands
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Generate API docs
npm run docs
\`\`\`

## API Design Principles
- Use RESTful conventions
- Version APIs: \`/api/v1/*\`
- Use proper HTTP status codes
- Return consistent response shapes
- Paginate list endpoints
- Rate limit public endpoints

## Response Format
\`\`\`json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

## Authentication
- Use Bearer tokens in Authorization header
- Refresh tokens stored in httpOnly cookies
- Implement rate limiting on auth endpoints
- Log all auth events

## Error Handling
- Use custom error classes
- Log errors with context (request ID, user ID)
- Never expose stack traces in production
- Return actionable error messages

## Security Checklist
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting
- [ ] CORS properly configured
- [ ] Helmet.js or equivalent headers
- [ ] No secrets in code or logs
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-api',
        required: true,
      },
      {
        name: 'RUNTIME',
        label: 'Runtime',
        placeholder: 'Node.js 20',
        required: false,
      },
      {
        name: 'FRAMEWORK',
        label: 'Framework',
        placeholder: 'Express / Fastify / Hono',
        required: false,
      },
      {
        name: 'DATABASE',
        label: 'Database',
        placeholder: 'PostgreSQL',
        required: false,
      },
    ],
  },

  // 6. Mobile (React Native)
  {
    id: 'mobile',
    name: 'Mobile (React Native)',
    description: 'React Native app with Expo',
    toolId: 'all',
    category: 'mobile',
    content: `# {{PROJECT_NAME}}

## Overview
A React Native mobile application built with Expo.

## Tech Stack
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **State**: {{STATE_MANAGEMENT}}
- **Styling**: NativeWind (Tailwind for RN)

## Project Structure
\`\`\`
{{PROJECT_NAME}}/
├── app/                  # Expo Router file-based routes
│   ├── (tabs)/           # Tab navigation
│   ├── (auth)/           # Auth screens
│   └── _layout.tsx       # Root layout
├── components/
│   ├── ui/               # Reusable UI components
│   └── features/         # Feature-specific components
├── hooks/                # Custom hooks
├── lib/                  # Utilities and services
├── stores/               # State management
├── types/                # TypeScript types
├── assets/               # Images, fonts
└── constants/            # App constants, theme
\`\`\`

## Key Commands
\`\`\`bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production (EAS)
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
\`\`\`

## Navigation Patterns
- Use Expo Router for file-based routing
- Organize routes in groups: \`(tabs)\`, \`(auth)\`, \`(modal)\`
- Use \`_layout.tsx\` for shared layouts
- Deep linking configured in \`app.json\`

## Component Guidelines
- Use functional components with hooks
- Extract styles to StyleSheet or use NativeWind
- Handle loading and error states
- Test on both iOS and Android
- Consider safe areas and notches

## Performance Tips
- Use \`FlatList\` for lists (not ScrollView with map)
- Memoize expensive computations
- Lazy load screens with \`React.lazy\`
- Optimize images (use WebP, proper sizes)
- Avoid inline functions in render

## Platform-Specific Code
\`\`\`typescript
import { Platform } from 'react-native';

// Conditional styling
const styles = {
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 4 },
  }),
};

// Conditional files: Component.ios.tsx, Component.android.tsx
\`\`\`

## Testing
- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox (optional)
- Test on real devices before release
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'my-mobile-app',
        required: true,
      },
      {
        name: 'STATE_MANAGEMENT',
        label: 'State Management',
        placeholder: 'Zustand / Redux Toolkit',
        required: false,
      },
    ],
  },

  // 7. Careful AI (Safety Rules)
  {
    id: 'careful-ai',
    name: 'Careful AI',
    description: 'Safety-focused rules to prevent destructive actions',
    toolId: 'all',
    category: 'safety',
    content: `# {{PROJECT_NAME}} - AI Assistant Guidelines

## Critical Safety Rules

### NEVER Do These Without Explicit Permission:
1. **Delete files or directories** - Always ask first
2. **Run \`git checkout --\`** - This discards changes
3. **Run \`git reset\`** - This can destroy commits
4. **Run \`git clean\`** - This removes untracked files
5. **Run \`rm -rf\`** - Destructive and irreversible
6. **Overwrite existing files** - Ask before replacing
7. **Push to remote** - Let the user push manually
8. **Run commands with \`--force\`** - Usually dangerous

### Always Ask Before:
- Deleting anything
- Reverting changes
- Modifying git history
- Running destructive commands
- Making assumptions about what to keep/discard

### Safe Patterns:
- **Read files** before modifying them
- **Show diffs** before applying changes
- **Explain** what a command will do
- **Offer alternatives** when there's risk
- **Backup** before risky operations

## Development Workflow

### Code Changes
- Read existing code before suggesting modifications
- Make minimal, focused changes
- Don't refactor unrelated code
- Preserve existing patterns and styles

### Git Operations
- Never add "Claude" or "AI" to commit messages
- Use conventional commits: \`feat:\`, \`fix:\`, \`chore:\`
- Don't commit secrets or .env files
- Let user review before committing

### File Operations
- Prefer editing existing files over creating new ones
- Don't create documentation unless asked
- Keep file names consistent with project conventions

## Error Handling
When something goes wrong:
1. **Stop** - Don't try to "fix" by reverting
2. **Report** - Tell the user exactly what happened
3. **Ask** - Get guidance on how to proceed
4. **Never assume** - The user knows their project best

## Communication Style
- Be concise and direct
- Focus on facts, not praise
- Admit uncertainty
- Ask clarifying questions when needed
`,
    variables: [
      {
        name: 'PROJECT_NAME',
        label: 'Project Name',
        placeholder: 'My Project',
        required: true,
      },
    ],
  },
];

// Helper to get templates for a specific tool
export function getTemplatesForTool(toolId: string): Template[] {
  return defaultTemplates.filter((t) => t.toolId === 'all' || t.toolId === toolId);
}

// Helper to get template by ID
export function getTemplateById(id: string): Template | undefined {
  return defaultTemplates.find((t) => t.id === id);
}

// Helper to substitute variables in template content
export function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value || '');
  }
  return result;
}
