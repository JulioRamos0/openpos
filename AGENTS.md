# AGENTS.md - Development Guide for AI Agents

## Project Overview

**POS (Point of Sale) Terminal UI** built with Bun, Ink (React for terminal), Zustand (state), Drizzle ORM (SQLite).

- Entry: `src/app.tsx`
- Database: `pos.db` (SQLite with WAL mode)
- Schema: `src/db/schema.ts`

---

## Commands

```bash
# Development
bun run dev        # Run app in development
bun run start     # Alias for dev
bun run seed      # Seed database with sample products

# Build (creates standalone .exe)
bun build src/app.tsx --compile --outfile pos.exe
# Or: build.bat

# Type checking (strict mode)
tsc --noEmit

# Testing (no framework - Vitest recommended)
# bun test src/path/to/test.test.ts
```

---

## Code Style Guidelines

### File Organization
```
src/
├── app.tsx              # Entry point
├── modules/pos/        # POS feature
│   ├── PosScreen.tsx  # Main screen
│   └── components/   # POS components
├── shared/            # Utilities
│   ├── theme.ts      # Colors, formatters
│   └── components/  # UI components
├── store/             # Zustand stores
│   └── cart.ts      # Cart state
└── db/                # Database
    ├── client.ts    # Drizzle client
    ├── schema.ts   # Table definitions
    └── seed.ts     # Seed data
```

### TypeScript
- **Strict mode** enabled
- Use `type` for shapes, `interface` for extensible types
- Use `typeof X.$inferSelect` for Drizzle row types (`schema.ts:22-23`)
- Import types explicitly: `import type { Product } from "..."`

### Imports
- **Path aliases** in `tsconfig.json`:
  - `@db/*` → `src/db/*`
  - `@store/*` → `src/store/*`
  - `@shared/*` → `src/shared/*`
  - `@modules/*` → `src/modules/*`
- Use **`.js` extension** for Bun compatibility:
  ```ts
  import { useCart } from "../../store/cart.js";  // ✓
  ```

### React/Component Patterns
- Functional components with explicit return types
- Prefer `React.useState` over hook imports
- Use Ink hooks: `useInput`, `useApp`, `useStdin`
- Handle resize: `process.stdout.on("resize")` (see `PosScreen.tsx:31-38`)

### Zustand Store
- Define store type explicitly (`cart.ts:6-18`)
- Use `create<StoreType>()` for inference
- Functional updates: `set(s => ({ ... }))`
- Access state via `get()` for computed values

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PosScreen.tsx` |
| Files | camelCase | `cart.ts` |
| Types | PascalCase | `CartItem` |
| Constants | PascalCase | `PAY_METHODS` |

### Error Handling
- Handle DB errors in `useEffect`
- Use try-catch for async operations
- Display errors in status bar

### UI/Theme
- Use `theme` from `src/shared/theme.ts`
- Formatting helpers: `fmt.money()`, `fmt.ticket()`
- Minimal terminal design: box-drawing borders (┌─┐│└┘), horizontal dividers (──)

#### Available Components
```ts
import { Panel, ScrollBox, Button, Input, Badge, Spinner } from "@shared/components/index.js";
```

---

## Database Schema

```typescript
// products: id, sku(unique), name, price, category, stock
// sales:    id, ticket, total, tax, method, items(JSON), createdAt
```

Row types: `export type Product = typeof products.$inferSelect`

---

## Dependencies

- Runtime: `ink`, `react` 19, `zustand`, `drizzle-orm`
- Dev: `typescript` 5.4.5, `drizzle-kit`, `@types/react` 19

---

## Notes

- No linting/formatting tools (Prettier/ESLint can be added)
- No test framework (Vitest recommended)
- Database auto-initializes on app start
- Use Bun's built-in `--compile` for building .exe