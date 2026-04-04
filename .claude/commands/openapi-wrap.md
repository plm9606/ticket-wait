Validate an OpenAPI spec file and generate a TypeScript client wrapper for it.

## Steps

### 1. Validate the spec

Run `npx @redocly/cli lint $ARGUMENTS` to validate the OpenAPI spec at the given path.

If the spec has **parse errors** (not just warnings):
- Check if it contains `[cite_start]`, `[cite: N]`, or other non-YAML artifacts and strip them first.
- Fix any other structural YAML/OpenAPI errors you find.
- Re-run lint after fixing and report the result (errors vs warnings).

Warnings (missing 4xx responses, missing operationId, etc.) should be fixed if easy; otherwise just note them.

### 2. Analyze the spec

Read the fixed spec and identify:
- Base URL
- All endpoints (path + method + operationId)
- All request parameters (required vs optional, types, enums)
- Response schemas — especially nested/XML structures that need normalization
- Authentication scheme (apiKey in query, Bearer, etc.)

### 3. Generate the TypeScript client

Create a `.ts` file alongside the spec (same directory, same base name). Follow the patterns already used in `apps/server/src/lib/`:
- Use `axios` for HTTP (already a dependency)
- If the API returns XML, use `fast-xml-parser` (`XMLParser`) — install it with `pnpm add fast-xml-parser` inside `apps/server/` if not already installed
- Read credentials/keys from `env` (`apps/server/src/config/env.ts`) — add the new key there and in `.env.example` if needed
- Export one typed function per operationId
- Export all TypeScript types/interfaces so callers can import them

**Type naming convention:** derive clean names from schema names or operationIds (e.g., `PerformanceSummary`, `ListPerformancesParams`).

**Comments:** Every exported interface property, type alias, and function must have a KDoc-style JSDoc comment. Use the `description` from the OpenAPI spec as the comment body. Format:
```ts
/**
 * 공연명
 */
prfnm: string;

/**
 * 공연목록 조회 (GET /pblprfr)
 */
export async function listPerformances(...) {}
```
Inline comments (`//`) are only for non-exported internal code.

**XML normalization:** KOPIS-style APIs return single items as objects and multiple items as arrays — use `isArray` option in `XMLParser` and write normalization helpers for nested fields.

### 4. Generate tests

Create a `<same-base-name>.test.ts` file alongside the generated client. Use **vitest** (`describe`, `it`, `expect`, `vi`).

Test structure:
- Mock `axios` with `vi.mock("axios")` and `vi.mocked(axios.get)`
- Mock the env module to inject a test service key: `vi.mock("../config/env.js", () => ({ env: { <KEY_NAME>: "test-key" } }))`
- Import the functions under test **after** the mocks (use top-level `await import(...)`)
- Create realistic XML fixture strings that mirror actual API responses (cover single-item and multi-item cases for any field that needs normalization)

One `describe` block per exported function. Cover:
- Happy path — correct return type and field values
- Service key is included in request params
- Optional params are included when provided; excluded when undefined
- Empty response returns `null` or `[]` as appropriate
- Normalization edge cases — single vs multiple items for any nested list (e.g., `relates`, `styurls`, hall lists)
- Missing service key throws a clear error

Run `pnpm --filter server test` after writing and fix any failures before reporting.

### 5. Type-check

Run `npx tsc --noEmit` from `apps/server/` and confirm there are **no new errors** introduced by the generated file. Pre-existing errors in other files are acceptable.

### 6. Report

Summarize:
- Lint result (errors fixed, warnings remaining)
- Generated file path
- Exported functions with their signatures
- Any env vars added
