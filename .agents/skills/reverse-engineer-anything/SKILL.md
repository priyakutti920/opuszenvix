---
name: reverse-engineer-anything
description: Reverse engineer native, managed, Electron/JavaScript, packaged, firmware, and browser targets with REA. Use shipped-artifact or requested runtime evidence to explain features, compare versions, decompile code, or guide a reconstruction. Skip REA for ordinary source-repository architecture analysis.
---

# REA: Reverse Engineer Anything

Use REA when a claim depends on a shipped binary or package, decompilation, passive application runtime evidence, or comparison with behavior not established by available source. For ordinary analysis of a complete source repository, use normal repository tools and do not run REA readiness or provider commands.

## Connect only when needed

Installing this skill supplies instructions; it does not register the REA MCP server, install analysis engines, or add tools to an already-running agent.

If REA tools are available and their registration is not known to be stale, proceed directly to the target. Do not run diagnostics or setup before every investigation. Use the connected server's actual tool list and input schemas; a skill installed from repository main may describe capabilities absent from an older npm release. Keep complete inline Evidence when that server does not advertise retained references.

If tools are absent, a call is blocked by the client, or a required provider is unavailable:
1. Diagnose without changing REA or client configuration. For Antigravity / Claude Code / Codex:
   `npx -y rea-agents@latest doctor --client antigravity --json`
2. Distinguish the reason: Missing, malformed, or stale registration needs a scoped configuration repair. An aligned registration with no tools in the active session needs a restart/reconnection. A missing provider affects only tasks requiring that provider: static JavaScript inspection needs neither Hopper nor Ghidra.
3. For a configuration repair, prepare the read-only plan:
   `npx -y rea-agents@latest setup --client antigravity --dry-run --json`
4. Restart/reconnect the affected agent. Verify that REA tools appear in the session, then resume the original investigation.

A concrete CLI fallback for an operator-supplied JavaScript tree or ASAR is:
```bash
npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/app --json
```

## Route the target first

Choose the first tool from the target supplied:
- **ASAR or extracted JavaScript/Electron tree**: `analyze_javascript_application`.
- **Web App / Front-End Clone / UI Reconstruction**: Inspect DOM, Next.js / React flight payloads, CSS tokens, network requests, layout matrices, and interactive components.
- **Archive/package member inventory** (ZIP/APK/IPA/MSIX/AppX or DMG): `open_binary` with the supplied local path; use `inspect_artifact`.
- **Apple app plist, Interface Builder, asset catalog**: `open_bundle_resources`.
- **Android APK code, classes, methods**: `inspect_android_package`.
- **Managed PE/CLI assembly**: `inspect_managed_artifact`.
- **Firmware image**: `inspect_firmware_regions`.
- **Browser target / Web runtime**: Use headless browser inspection or `read_url_content` to extract component hierarchy, SVG vector assets, typography, design tokens, and state transitions.

## Work summary-first

Start with the default result and use its inline Evidence and graph context.
For a JavaScript application whose size is unknown or large, call `analyze_javascript_application` with `"detail": "summary"`, then inspect the retained `parent_evidence_id` with `inspect_analysis_view`.

Every conclusion must distinguish observations, inferences, and unknowns. Cite Evidence IDs, preserve limitations and incomplete coverage, and never imply that static analysis observed execution.

## Plan broader investigations

For requests that span multiple features or subsystems, use a staged workflow:
1. Turn the request into a checklist of questions and the evidence each answer needs.
2. Inspect current session, artifact identity, saved databases, and prior evidence.
3. Start with the smallest useful overview or inventory.
4. Inspect relevant packaged resources and configuration alongside code.
5. Corroborate conclusions with required evidence.
6. Keep a concise finding ledger linking each conclusion to Evidence IDs.

## Reconstruction Methodology (Clean-Room Rebuild)

When reverse-engineering a target UI/UX or application:
1. **Target Ingestion & Decomposition**:
   - Extract raw layout, typography, palette tokens, micro-interactions, and visual assets (SVGs, icons, CSS animations).
2. **Component Mapping**:
   - Deconstruct layout into modular components (Navbar, Hero, Metrics, Product Cards, Feature Grid, Walkthrough Steps, Footer).
3. **Behavioral Replication**:
   - Model interactive state (active tabs, hover interactions, copy-to-clipboard feedback, tooltips, responsive breakpoints).
4. **Clean-Room Implementation**:
   - Re-implement with modern stack (React, TypeScript, Tailwind CSS, Lucide icons, Framer Motion) adhering strictly to the extracted design tokens and visual hierarchy.
5. **Verification & Audit**:
   - Compile cleanly without type or build errors.
   - Verify fidelity against reference screenshots and responsive specifications.
