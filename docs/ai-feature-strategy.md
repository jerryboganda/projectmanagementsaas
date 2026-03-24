# AI Feature Strategy

## Current State
- `@google/genai` (Gemini) dependency installed but not yet integrated with real API
- AI Copilot panel built with mock responses for demo, but not mounted in the current authenticated shell
- Quick actions: subtask generation, status updates, risk detection, next steps

## Implemented (Mock)

### AI Copilot Chat Panel
- **Location:** Source-only fixed right panel demo; not currently mounted from the live header or provider stack
- **UX:** Chat interface with quick action buttons, loading states, timestamp display
- **Mock responses:** Contextual project management advice using hardcoded response map
- **Provider:** `AiCopilotProvider` remains in source, but is not currently mounted in `app/providers.tsx`

### Quick Actions
| Action | Description | User Value |
|--------|-------------|------------|
| Generate subtasks | Break down a task into actionable items | Saves planning time |
| Write status update | Generate project status summary | Saves reporting time |
| Identify risks | Surface potential blockers and risks | Proactive risk management |
| Suggest next steps | Recommend team focus areas | Reduces decision fatigue |

## Planned Integration (When Backend Exists)

### Phase 1: Direct Gemini API
- Wire `@google/genai` SDK to Copilot chat
- Pass project/task context as system prompt
- Stream responses for real-time feedback
- Environment: `GEMINI_API_KEY` already configured in `.env.example`

### Phase 2: Contextual AI Features
| Feature | Data Needed | Integration Point |
|---------|-------------|-------------------|
| Smart task decomposition | Task title + description | Task creation modal |
| Auto-generated status reports | Project tasks + status + timeline | Reports page |
| Risk prediction | Task dependencies + deadlines + health | Dashboard + Project detail |
| Natural language task creation | User input | Command palette |
| Meeting notes → action items | Text input | Docs module |
| Workload optimization suggestions | Resource allocation data | Workload page |

### Phase 3: Proactive Intelligence
- Automatic delay detection based on task velocity
- Dependency conflict alerts
- Capacity rebalancing suggestions
- Goal alignment scoring
- Automated weekly digest generation

## Design Principles
1. **Useful, not decorative** — Every AI feature must solve a real workflow problem
2. **Explainable** — Users should understand why AI made a suggestion
3. **Non-blocking** — AI should assist, never block user workflows
4. **Context-aware** — Use project/task/user context to improve relevance
5. **Safe defaults** — AI suggestions are suggestions, never auto-applied
6. **Progressive** — Start with simple features, add complexity as data quality improves

## Technical Notes
- Gemini model selection: Use `gemini-2.0-flash` for speed, `gemini-2.0-pro` for complex analysis
- Token budget: Keep context window under 8K tokens for fast responses
- Rate limiting: Client-side debounce + server-side per-user rate limits
- Caching: Cache identical prompts for 5 minutes to reduce API costs
- Error handling: Graceful degradation to mock responses on API failure
