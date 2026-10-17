# OpusZyra — Phase 12: Minimal Default Model Compatibility Fix & Regression Verification Report

**Date:** October 17, 2026  
**Project:** OpusZyra — Anthropic-compatible AI API Gateway  
**Production Gateway:** `https://api.opuszyra.live`  
**Configured Upstream:** `https://api.opuszen.shop`  
**Target File Modified:** `server/routes/anthropicProxy.js`  
**Status:** **PASS WITH STIPULATED LIMITATIONS** (Upstream Provider Identity Limitation Remains)

---

## 1. Initial Git Baseline

- **Repository Root:** `D:/Projects/Opuszyra`
- **Branch:** `main`
- **Base HEAD Commit:** `68bbc9cfc192168c2a78a04b0f052fd5e294d92a`
- **Pre-existing Working Tree State:**
  ```text
  ?? .audit/phase8_live_production_readiness_report.md
  ?? .audit/phase9_safe_mock_separation_report.md
  ```
- **Credentials & Upstream Verification:**
  - `UPSTREAM_API_BASE`: Verified configured as `https://api.opuszen.shop`.
  - `UPSTREAM_API_KEY`: Preserved unchanged, redacted, and unprinted.
  - No secret disclosure or rotation performed.

---

## 2. Compatibility Analysis & Supporting Evidence

### A. Pre-change Behavior & Inconsistency
- Prior to this phase, line 211 of [`server/routes/anthropicProxy.js`](file:///d:/Projects/Opuszyra/server/routes/anthropicProxy.js#L211) was:
  ```javascript
  const { model = 'claude-3-7-sonnet-20250219', stream = false } = req.body;
  ```
- When a client sent a request omitting the `model` property, OpusZyra forwarded the body to `https://api.opuszen.shop/v1/messages`.
- Live probe evidence verified that `api.opuszen.shop` defaults internally to `claude-sonnet-4-6` and responds with `"model": "claude-sonnet-4-6"`.
- However, OpusZyra's internal token accounting and usage logging recorded the request as `claude-3-7-sonnet-20250219`, creating an accounting discrepancy between the gateway log and the upstream execution.
- Furthermore, canonical `claude-3-7-sonnet-20250219` is explicitly unsupported by `api.opuszen.shop` (returning an error notice if explicitly requested).

### B. Upstream Support for Proposed Alias
- Live inference probes against `https://api.opuszen.shop/v1/messages` confirmed that `claude-sonnet-4-6` is fully supported with HTTP 200 responses for both non-streaming completions and SSE streams.
- When `model` is omitted in client requests, defaulting to `claude-sonnet-4-6` perfectly aligns internal token logging with upstream execution.

### C. Explicit Model Preservation & Contract Adherence
- Explicit model requests (e.g., `model: "claude-opus-4-8"`, `model: "claude-3-7-sonnet-20250219"`) are never rewritten or substituted; JavaScript object destructuring defaults only apply when `req.body.model === undefined`.
- Authentication checks (HTTP 401), rate limits (HTTP 429), and message body validation (HTTP 400) remain strictly enforced before request execution.

---

## 3. Exact Source Diff

```diff
diff --git a/server/routes/anthropicProxy.js b/server/routes/anthropicProxy.js
index 6930fde..1658ac4 100644
--- a/server/routes/anthropicProxy.js
+++ b/server/routes/anthropicProxy.js
@@ -208,7 +208,7 @@ router.post('/messages', async (req, res) => {
     }
   }
 
-  const { model = 'claude-3-7-sonnet-20250219', stream = false } = req.body;
+  const { model = 'claude-sonnet-4-6', stream = false } = req.body;
 
   if (!isValidMessages(req.body.messages)) {
     return res.status(400).json({
```

---

## 4. Tests Executed & Results

### Focused Phase 12 Regression Suite (`scratch/phase12_regression_suite.mjs`)
**Result: 32 / 32 Passed (100%)**

| Test Category | Assertion Description | Result |
| :--- | :--- | :---: |
| **Default Model Fallback** | Missing model request succeeds with HTTP 200 | **PASS** |
| **Default Model Accounting** | Missing model selects `claude-sonnet-4-6` for internal usage logging | **PASS** |
| **Explicit Model Preservation** | Explicit `claude-opus-4-8` forwarded to upstream unchanged | **PASS** |
| **Explicit Model Accounting** | Explicit `claude-opus-4-8` logged with exact requested model name | **PASS** |
| **No Silent Rewriting** | Explicit `claude-3-7-sonnet-20250219` forwarded to upstream without rewrite | **PASS** |
| **Upstream Headers Integrity** | Upstream receives `x-api-key`, `Authorization: Bearer`, and `anthropic-version` | **PASS** |
| **Auth Enforcement** | Unauthenticated requests strictly rejected with HTTP 401 (`authentication_error`) | **PASS** |
| **Payload Validation** | Empty messages array rejected with HTTP 400 (`invalid_request_error`) | **PASS** |
| **Payload Validation** | Malformed message missing role rejected with HTTP 400 | **PASS** |
| **Response Schema** | Non-streaming response preserves Anthropic format (`id`, `type`, `role`, `content`) | **PASS** |
| **Streaming (SSE)** | SSE stream delivers `message_start`, `content_block_delta`, `message_stop` events | **PASS** |
| **Error Passthrough** | Upstream 401 preserves HTTP 401 and returns sanitized JSON error | **PASS** |
| **Error Passthrough** | Upstream 404 preserves HTTP 404 and returns sanitized JSON error | **PASS** |
| **Error Passthrough** | Upstream 429 preserves HTTP 429 and returns sanitized JSON error | **PASS** |
| **Error Passthrough** | Upstream 500 preserves HTTP 500 and returns sanitized JSON error | **PASS** |
| **Data Integrity** | Aborted stream does not record artificial usage log entries | **PASS** |
| **Mock Isolation** | Test execution strictly isolated in memory (`MockSupabaseDatabase`) | **PASS** |

### Existing Infrastructure Probe Verification
1. `probe-mock.mjs`: **PASSED** (Verified `.maybeSingle()` and `.single()` contracts).
2. `probe-morgan.mjs`: **PASSED** (Verified Morgan URL logger query redaction `?key=[REDACTED]`).
3. `probe-5x.mjs`: **PASSED** (Verified HTTP 200 local fallback and quota retrieval).
4. `probe-keystatus.mjs`: **PASSED** (Verified 20x heavy tier lookup and token limits).
5. `probe-instrument.mjs`: **PASSED** (Verified key matching and token tracking).
6. `probe-order.mjs`: **PASSED** (Verified order verification boundaries).

---

## 5. Explicit-Model Preservation Verification

- **Request with no `model` parameter:** Selects `claude-sonnet-4-6`.
- **Request with `model: "claude-opus-4-8"`:** Upstream receives `claude-opus-4-8`; database records `claude-opus-4-8`.
- **Request with `model: "claude-3-7-sonnet-20250219"`:** Upstream receives `claude-3-7-sonnet-20250219`; database records `claude-3-7-sonnet-20250219`.
- **Zero Silent Substitution:** The gateway never modifies an explicitly provided model parameter.

---

## 6. Authentication, Payment, Streaming & Usage-Logging Status

- **Authentication:** Unchanged. All requests to `/v1/messages` and `/v1/chat/completions` require valid credentials (`x-api-key` or `Authorization: Bearer`).
- **Payment Security:** Unchanged. The fail-closed `PAYMENT_VERIFICATION_OFFLINE` gate and atomic rollback in [`server/routes/stats.js`](file:///d:/Projects/Opuszyra/server/routes/stats.js) remain intact.
- **SSE Streaming:** Unchanged. Streaming headers (`text/event-stream; charset=utf-8`, `X-Accel-Buffering: no`) and SSE event sequences are preserved.
- **Usage Logging:** Unchanged. Logging accurately records the active model, input tokens, output tokens, cached tokens, and latency without false records on cancelled requests.

---

## 7. Final Git Status Comparison

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   server/routes/anthropicProxy.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.audit/phase12_default_model_compatibility_report.md
	.audit/phase8_live_production_readiness_report.md
	.audit/phase9_safe_mock_separation_report.md
```

- **Authorized Files Modified:** Exactly 1 file (`server/routes/anthropicProxy.js`).
- **Commits Created:** 0.
- **Git Pushes:** 0.
- **Deployments Triggered:** 0.
- **Credentials:** Preserved without modification or exposure.

---

## 8. Outstanding Limitations & Clear Identity Disclosure

> [!WARNING]
> **Stipulated Limitation (Provider Identity & Authenticity):**
> Setting the default fallback model to `claude-sonnet-4-6` ensures operational compatibility with the existing upstream gateway (`api.opuszen.shop`). However, as established in Phase 10, **`api.opuszen.shop` does not host or route to genuine Anthropic Claude models**. Requests are processed by third-party foundation models (specifically SenseTime's SenseNova / 商量) wrapped in emulated system prompts.
> 
> This change is strictly a **transport-level compatibility fix** for the existing upstream and must not be represented as providing genuine Anthropic Claude intelligence.
