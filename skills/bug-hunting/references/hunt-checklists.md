# Bug Hunting Checklists & Language Sink Patterns

Adapted from `Claude-BugHunter` for source-code and service bug hunting. Use these checklists during Phases 1, 2, and 3 to form high-signal hypotheses, then prove each hypothesis with executable tests.

## 1. Crown-Jewel Threat Modeling Template

Before hunting a module, fill in this 4-line mental model:

```text
TARGET MODULE: <package / service / controller>
CROWN JEWELS:  1. <worst data/financial loss>  2. <worst authz/tenant breach>  3. <worst availability/crash>
ENTRY POINTS:  <HTTP/gRPC handlers, queue consumers, scheduled jobs, exported API functions>
TRUST SEAMS:   <where untrusted input is parsed, validated, authorized, and persisted>
```

## 2. High-Signal Bug-Class Checklists

### Financial, Accounting, & Business Logic

- **Rounding & Precision:** Floating-point math on currency, premature rounding inside loops before summing, division truncation losing remainder cents, negative zero or NaN propagation.
- **Sign & Boundary Flaws:** Negative amounts, quantities, or pagination offsets flipping a debit into a credit or bypassing a `< limit` check; zero-value inputs dividing by zero or creating empty transactions.
- **Idempotency & Replay:** Mutating endpoints or job handlers lacking idempotency keys, or checking idempotency before a transaction commits so retries either double-apply or drop operations.
- **Partial Failure & Rollback:** Multi-step mutations (for example database write + external API call + cache update) where step 2 fails and step 1 is not rolled back, leaving permanently wedged state.

### Concurrency & Race Conditions

- **Check-Then-Act (TOCTOU):** Reading a balance, status, or quota in `SELECT`, checking it in application memory, and writing back without `SELECT ... FOR UPDATE`, atomic compare-and-swap, or a uniqueness constraint.
- **State-Machine Skips:** Concurrent transitions moving an entity from `pending -> cancelled` and `pending -> settled` simultaneously, or replaying a terminal transition twice.
- **Shared Memory & Map Races:** Concurrent goroutines, threads, or async tasks reading and mutating shared maps, slices, caches, or singleton clients without synchronization.
- **Resource & Lock Leaks:** Early error returns skipping `defer unlock()`, connection close, context cancellation, or temp-file cleanup, causing deadlocks or exhaustion under error load.

### Authorization & Trust Boundaries (IDOR / BOLA / Auth Bypass)

- **Object-Level Authorization (IDOR / BOLA):** Fetching or mutating a record by primary key (`find(params[:id])`, `WHERE id = $1`) without scoping the query to the authenticated caller's tenant/user ID (`WHERE id = $1 AND user_id = $2`).
- **Sibling Endpoint Inconsistency:** `GET /resource/:id` checks ownership, but `PATCH`, `DELETE`, batch/bulk export, or GraphQL `node(id: ...)` omits the check.
- **Fail-Open Error Paths:** `catch` / `rescue` / `if err != nil` blocks in auth, permission, or rate-limit helpers that log an error and return `nil` / `true` instead of denying access.
- **Mass Assignment / Prototype Pollution:** Binding raw request maps directly into models or config objects, allowing callers to overwrite `role`, `tenant_id`, `status`, or `__proto__`.

### Injection, SSRF, & File/Path Handling

- **Query & Command Construction:** String concatenation or `fmt.Sprintf` / template interpolation into SQL, NoSQL filters, shell commands, or LDAP/XML queries.
- **Path Traversal & Archive Extraction:** Joining user-controlled filenames with `path.Join` / `os.path.join` without verifying the resolved path stays inside the base directory (`filepath.Rel` / `realpath` prefix check).
- **SSRF & Redirect Chains:** Fetching user-supplied webhook or import URLs without blocking loopback (`127.0.0.1`, `[::1]`), link-local cloud metadata (`169.254.169.254`), internal RFC1918 ranges, or HTTP 302 redirects to internal hosts.

---

## 3. A->B Sibling Cluster Chains

When you prove **Bug A**, immediately hunt for **Bug B** across sibling code:

| Proven Bug A | Sibling Cluster to Sweep (Bug B) | Escalated Impact |
| --- | --- | --- |
| Read IDOR on `GET /items/:id` | `PUT`, `PATCH`, `DELETE`, and bulk export on the same controller/store | Cross-tenant data modification or deletion |
| Missing lock on one balance/quota update | All other mutators touching the same table or Redis key | Double-spend or quota bypass under concurrency |
| Unchecked error on one external call | Sibling callers of the same client interface across the package | Silent data divergence across workflows |
| Off-by-one or timezone boundary in one query | Reporting, billing, and expiration queries using the same date helper | Systematic financial or access-window drift |
| Missing input validation on `/v2/` endpoint | Legacy `/v1/`, internal RPC, or background job consuming the same struct | Full validation bypass via alternate entry point |

---

## 4. Language-Specific High-Risk Sink Patterns

Use these patterns to locate candidate sinks during Phase 2, then trace callers before writing a reproduction test:

### Go

- **Concurrency & Races:** `go func` capturing loop variables or mutating shared maps/slices without `sync.Mutex` or `atomic`; missing `defer rows.Close()` or `defer cancel()` on error branches.
- **Slice & Map Traps:** Appending to a sub-slice that aliases backing array memory; nil map writes on uninitialized struct fields; integer conversion truncation (`int32(v)`, `uint(v)` on negative values).
- **SQL & Command Sinks:** `fmt.Sprintf` inside `db.Query` / `db.Exec`; `exec.Command("sh", "-c", ...)` with untrusted input; `filepath.Join` on untrusted paths without base-prefix verification.
- **Proof Tip:** Run `go test -race -run TestRepro ./...` to prove data races deterministically.

### Ruby

- **Deserialization & Eval:** `YAML.load` (without `safe_load`), `Marshal.load`, `eval`, `send` / `public_send` on user-supplied method names, `constantize` on untrusted strings.
- **ActiveRecord & Authz:** `Model.find(params[:id])` instead of `current_user.models.find(params[:id])`; string interpolation inside `where("... #{params[:x]}")`, `order`, or `pluck`; `permit!` or overly broad `permit(...)`.
- **Transaction & Callback Traps:** Sidekiq jobs enqueued *inside* an uncommitted `ActiveRecord::Base.transaction` block (worker runs before commit and sees `RecordNotFound` or stale data); `rescue => e` swallowing `ActiveRecord::Rollback`.
- **Proof Tip:** Run `bundle exec rspec path/to/spec.rb --example "reproduces..."` to prove the defect against the model or request spec.

### Python

- **Execution & Deserialization:** `pickle.loads`, `yaml.load` (without `SafeLoader`), `eval`, `exec`, `subprocess.run(..., shell=True)`.
- **Mutable Defaults & Async State:** `def fn(items=[])` mutating default list/dict across requests; shared class attributes mutated per instance; unawaited coroutines or blocking I/O inside `async def` handlers.
- **ORM & Numeric Traps:** Float arithmetic where `Decimal` is required; raw SQL f-strings in `cursor.execute(f"...")`; catching broad `Exception:` and returning a default truthy object.
- **Proof Tip:** Run `pytest path/to/test_file.py -k test_repro -vv` to capture the exact assertion traceback.

### TypeScript / JavaScript

- **Async & Promise Traps:** Floating promises (`async` calls without `await` inside `forEach` or event handlers); `Promise.all` leaving sibling operations partially committed on rejection; race conditions across `await` boundaries (reading state before `await`, writing stale state after `await`).
- **Object & Type Coercion:** Prototype pollution via recursive `Object.assign` / deep merge with `__proto__` or `constructor.prototype`; `Number(input)` or `parseInt(input)` accepting `NaN`, `Infinity`, or partial strings (`"123abc"`); loose truthiness (`if (!value)`) treating `0` or `""` as missing.
- **DOM & Execution Sinks:** `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `child_process.exec` with interpolated strings, unanchored regexes (`new RegExp(userInput)`) causing ReDoS.
- **Proof Tip:** Run `npx vitest run path/to/file.test.ts -t "reproduces..."` or `npm test` to capture the failing assertion.
