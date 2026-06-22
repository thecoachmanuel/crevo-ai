# Crevo AI - AI-Powered Cloud IDE

Crevo AI is a browser-based, AI-powered cloud IDE featuring real-time collaborative code editing, conversation-based AI assistance, a complete file system explorer, and GitHub integration. 

## Tech Stack

| Category      | Technologies                                                |
| ------------- | ----------------------------------------------------------- |
| **Frontend**  | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Editor**    | CodeMirror 6, Custom Extensions, One Dark Theme             |
| **Backend**   | Convex (Real-time DB), Inngest (Background Jobs)            |
| **AI**        | Gemini 2.0 (primary) and Claude 3.7 Sonnet (fallback)       |
| **Auth**      | Convex Auth (with GitHub OAuth integration)                 |
| **Payments**  | Paystack (primary) and Stripe (fallback)                    |
| **Execution** | WebContainer API, xterm.js                                  |
| **UI**        | shadcn/ui, Radix UI                                         |

## App Structure

```text
src/
├── app/                    # Next.js App Router Pages & Layouts
│   ├── api/               # Server-side API endpoints
│   │   ├── billing/       # Paystack/Stripe checkout & webhook endpoints
│   │   ├── github/        # GitHub repo import/export endpoints
│   │   ├── inngest/       # Inngest background job handlers
│   │   ├── messages/      # AI Conversation messaging endpoints
│   │   ├── projects/      # Project creation endpoints
│   │   ├── quick-edit/    # Cmd+K quick edit AI endpoints
│   │   └── suggestion/    # Real-time code suggestion endpoints
│   └── projects/          # Dynamic project pages (`[projectId]`)
├── components/            # Global/shared UI components
│   ├── ai-elements/      # UI pieces for the AI Assistant chat
│   └── ui/               # shadcn/ui base components
├── features/              # Feature-driven architecture modules
│   ├── auth/             # Authentication & user menu UI
│   ├── conversations/    # AI chat logic, agents, and Inngest tools
│   ├── editor/           # CodeMirror setup, hooks, store, and extensions
│   ├── preview/          # WebContainer logic & hooks
│   └── projects/         # Project management & file explorer
├── hooks/                 # Global React hooks
├── inngest/              # Background job client setup
└── lib/                  # Utilities (auth helpers, convex clients, etc.)

convex/                    # Backend (Convex) logic & Database
├── auth.ts               # Convex Auth & GitHub provider configuration
├── conversations.ts      # Queries/mutations for AI conversations
├── files.ts              # Queries/mutations for file system tree
├── http.ts               # HTTP routes configured for Convex Auth
├── projects.ts           # Queries/mutations for projects
├── schema.ts             # Database schema definition
├── system.ts             # Internal API logic (used by Inngest workers)
└── users.ts              # Queries/mutations for user identity
```

## Features

### 💻 Advanced Code Editor
- Syntax highlighting for JS, TS, CSS, HTML, JSON, Markdown, Python
- Multi-cursor editing, bracket matching, and indentation guides
- Resizable panes and minimap overview

### 🤖 AI Code Assistant
- Real-time inline code suggestions with ghost text
- Quick edit via Cmd+K (select code + natural language instruction)
- Dedicated sidebar conversation with message history context
- Context-aware code explanations

### 🗂️ File System Management
- Multi-file explorer with hierarchical folder tree
- Create, rename, delete files and directories seamlessly
- Real-time synchronization powered by Convex
- GitHub import & export integration

### ⚡ Infrastructure
- Real-time backend operations using Convex
- Heavy AI processing offloaded to background jobs via Inngest
- Credit-based payment system supporting dual providers (Paystack & Stripe)

## Getting Started

### Prerequisites

- Node.js 20.09+
- npm or pnpm
- Accounts needed:
  - [Convex](https://cwa.run/convex) - Database & Authentication
  - [Inngest](https://cwa.run/inngest) - Background jobs
  - [Google AI Studio](https://aistudio.google.com) - Gemini 2.0 API (Required)
  - [Anthropic](https://anthropic.com) - Claude 3.7 API (Optional)
  - [Paystack](https://paystack.com) & [Stripe](https://stripe.com) - Billing (Optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/code-with-antonio/polaris.git
   cd polaris
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local` with the required keys:
   ```env
   # Convex & Auth
   NEXT_PUBLIC_CONVEX_URL=
   CONVEX_DEPLOYMENT=
   POLARIS_CONVEX_INTERNAL_KEY=  # Generate a random string
   JWKS=                         # Run `npx convex auth add`
   AUTH_GITHUB_ID=
   AUTH_GITHUB_SECRET=

   # AI Providers
   GEMINI_API_KEY=               # Required - Primary AI Agent (Gemini 2.0)
   ANTHROPIC_API_KEY=            # Optional - Fallback AI

   # Payments
   PAYSTACK_SECRET_KEY=          # Primary Payment Gateway
   STRIPE_SECRET_KEY=            # Optional Fallback Payment Gateway
   ```

5. Start the Convex development server:
   ```bash
   npx convex dev
   ```

6. In a new terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```

7. In another terminal, start the Inngest dev server:
   ```bash
   npx inngest-cli@latest dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```
