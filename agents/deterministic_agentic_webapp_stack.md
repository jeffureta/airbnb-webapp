# Low-Effort, Low-Cost Deterministic Agentic Web App Architecture

## Executive Summary
This architecture provides a blueprint for a personal-use web application that executes **1 to 5 bounded sub-tasks to achieve a single goal**. It is designed around three pillars:
- **Low Build Effort**: Minimal boilerplate using full-stack TypeScript and pre-built components.
- **Low Operating Cost**: $0/month using generous free tiers across compute, models, and hosting.
- **Deterministic Augmentation**: Constrained orchestration using schema validation to prevent unbounded loops and hallucinations.

---

## 1. Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND & ROUTING                   │
│   Next.js (App Router) + Tailwind CSS + shadcn/ui      │
│   • Vercel AI SDK (`ai/react` with `useChat`)          │
└───────────────────────────┬────────────────────────────┘
                            │ Server-Sent Events (SSE)
┌───────────────────────────▼────────────────────────────┐
│                  ORCHESTRATION LAYER                   │
│   Next.js Route Handlers (`app/api/agent/route.ts`)    │
│   • Zod Schemas (Deterministic JSON contract)          │
│   • `@ai-sdk/google` (Direct Gemini integration)       │
└───────────────────────────┬────────────────────────────┘
                            │ Typed Function Calls
┌───────────────────────────▼────────────────────────────┐
│                    MODEL & TOOL EXECUTION              │
│   Gemini 1.5 / 2.0 Flash (`google-genai` / AI SDK)     │
│   • Subtask 1: Web Research / Comps API                │
│   • Subtask 2: Market Analysis / Math Calculations     │
│   • Subtask 3: Draft PRD / Spec Document               │
└───────────────────────────┬────────────────────────────┘
                            │ Free Zero-Config Deploy
┌───────────────────────────▼────────────────────────────┐
│                      HOSTING & STATE                   │
│   • Hosting: Vercel (Hobby Tier — $0)                  │
│   • Storage: Supabase Free Tier or Browser LocalStorage│
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Justification

| Layer | Recommended Technology | Rationale & Trade-offs |
| :--- | :--- | :--- |
| **Frontend & UI** | **Next.js (App Router) + shadcn/ui** | Zero-effort copy-paste components for progress badges, accordion steps, and clean cards. |
| **Streaming Protocol** | **Vercel AI SDK (`ai/react`)** | Direct LLM tool-invocation tracking tied into React state without writing WebSocket or SSE handlers. |
| **Determinism Engine** | **Zod (`zod`)** | Strict schema validation ensures LLM produces valid execution plans and clamped subtask lists. |
| **Core Model** | **Gemini 1.5 / 2.0 Flash** | Ultra-fast (<1s latency), 1M context window, high function-calling fidelity, and Google AI Studio Free Tier (15 RPM). |
| **Hosting** | **Vercel (Hobby Tier)** | $0/month, continuous Git deployments, built-in edge/serverless compute, automatic HTTPS. |

---

## 3. The 3-Step Recipe for Deterministic Augmentation

> [!IMPORTANT]
> Unconstrained autonomous agents frequently get trapped in infinite loops or deviate from user instructions. To keep the app reliable as a personal augmenter, enforce deterministic constraints in code.

### Step 1: Constrain the Plan (Structured Output via Zod)
Force Gemini to declare an explicit, typed array containing between 1 and 5 tasks:

```typescript
import { z } from 'zod';

export const AgentPlanSchema = z.object({
  goal: z.string(),
  tasks: z.array(
    z.object({
      id: z.number().min(1).max(5),
      name: z.string(),
      action: z.enum(['search_market', 'calculate_metrics', 'generate_prd']),
      parameters: z.record(z.any()),
    })
  ).min(1).max(5), // Hard clamps execution to 1-5 tasks
});
```

### Step 2: Deterministic Execution Loop
Use the model for intelligence, but keep application code in control of the execution flow:

```typescript
const taskOutputs = [];

for (const task of plan.tasks) {
  // Update UI step state (e.g., Pending -> Running)
  notifyUI({ step: task.id, status: 'running', name: task.name });
  
  // Execute deterministic tool function
  const result = await tools[task.action].execute(task.parameters);
  
  // Update UI step state (Running -> Completed)
  notifyUI({ step: task.id, status: 'completed', result });
  taskOutputs.push(result);
}
```

### Step 3: Synthesis Step
Feed the accumulated `taskOutputs` back into the persona prompt (such as [product_manager_agent.md](./product_manager_agent.md) or [software_engineer_agent.md](./software_engineer_agent.md)) to assemble the final structured document.

---

## 4. Cost, Effort & Maintenance Profile

- **Build Time**: 1 to 2 days using standard scaffolding (`npx create-next-app` + `@ai-sdk/google`).
- **Monthly Cloud Cost**: **$0.00**
  - Vercel Hosting: Free
  - Google AI Studio (Gemini Flash): Free (up to 15 RPM)
  - Storage: Free (LocalStorage / Supabase Free)
- **Maintenance**: Single language (TypeScript end-to-end), no long-running server instances to monitor or patch.
