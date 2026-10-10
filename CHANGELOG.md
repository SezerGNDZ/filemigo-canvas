# 0.6.1

- Empty desktop canvases return a compact, actionable creation state instead of a workflow-only error.
- The same three agent tools now create workflows through `workflowJson`: semantic nodes/links, server-generated shapes/layout/theme, compact previews and revision-bound verified application.
- Creation never replaces existing objects. Strict validation preserves explicit roles, branches, metadata and uncertainty; empty-to-graph deltas are reconstructible.

# 0.6.0

- Agent context v1: layout-free overview, full semantic graph and bounded neighborhood views with explicit boundary IDs and inference/uncertainty markers.
- Three MCP tools cache documents, return scope-bound snapshot deltas and preview/apply revision-bound single-use patches with compact verified receipts.
- Optional `FILEMIGO_MCP_PROFILE=agent` reduces tool discovery to contract/read/patch; the default keeps all 26 tools.
- Updated progressive-disclosure skill, reproducible tokenizer benchmarks and tests for semantic preservation, partial context, stale reads, locks, cache eviction, concurrent edits and uncertain acknowledgements.
- Protocol is diagram understanding/editing only; it does not execute workflow tasks or implement distributed agent leases.

# 0.5.0

- Explicit process roles separate starts, steps, decisions, ends, parallel boundaries and annotations. Responsibilities, purpose, inputs and outputs survive native/brief/editable SVG and supported draw.io roundtrips.
- Transition descriptions no longer produce false guard warnings; explicit conditions and reference links carry distinct semantics.
- Understand Flow panel reviews logic and walks user-selected scenarios without executing actions or guessing conditions.
- Midnight, Paper and Ember themes preserve meaning and locks; native MCP patches can change canvas background and dimensions.
- Five new MCP tools discover capabilities, analyze/trace workflows and preview complete themes. Old desktop writes are refused to prevent metadata loss.
- Portable filemigo-workflows skill and patch reference; reproducible browser SDK/MCP App build; expanded graph, transport, exchange and browser integration checks.

# 0.4.0

- Portable Windows desktop canvas with offline bundled assets and native Open/Save/Save As.
- Live MCP moved from browser pairing to an authenticated desktop named pipe; bundled runtime requires no external Node.js.
- AI access starts disabled; revision conflicts, locks, pause, acknowledgement and undo protect manual edits.
- Website retains its independent canvas and links to desktop downloads.
- First build is unsigned Windows x64; no automatic updater or macOS/Linux binaries.

# 0.3.0

- Interactive MCP App resource and show/import/preview tools (18 tools total).
- Non-mutating change previews and optional user-applied browser proposals with revision protection.
- Supported draw.io XML import/export; compressed pages, endpoint labels and explicit unsupported-feature errors.
- Editable SVG with embedded native project, import review and small-project handoff.
- Expanded patch style fields and design-review prompt.

# 0.2.2

- Repository now owned by latecafe-tech (Late Cafe Games); original SezerGNDZ authorship retained.
- Updated installation URLs and browser connection guidance.

# 0.2.1

- Optional local window relay for public-to-loopback browser restrictions.
- Filemigo website adds explicitly enabled WebMCP tools for supported browser assistants, without a local installation.
- Structured browser-tool failures and authenticated relay regression tests.

# 0.2.0

- Authenticated local live bridge and five MCP tools for a paired browser canvas.
- Revision conflicts, busy/paused guards, acknowledged edits and undo support.
- Live connection UI, GitHub mark and Late Cafe Games project credit.

# Changelog

## 0.1.0 — 2026-10-10

Initial developer release: shared canvas core, 54 shapes, 16 diagram templates, native JSON/SVG/LLM exports, atomic patching, semantic comparisons and 10 local MCP tools. Includes English/Turkish installation instructions and real stdio integration tests. No live browser bridge, packaged visual editor or draw.io XML support in this release.
