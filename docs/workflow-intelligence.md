# Workflow intelligence (0.5)

Filemigo now distinguishes how a diagram looks from what its process means. The desktop, browser SDK, MCP server, editable exports and AI skill use the same model.

## For people

Select a node and use **Anlam ve tasarım / Meaning & design** to define its role, purpose, responsible person/team, input and output. Titles, legends and explanatory notes should use the **Annotation** role. New text objects default to annotations; existing projects are not reclassified automatically.

Select a connection to choose its meaning: **Transition** describes movement, **Condition** requires a decision, and **Reference** documents a relationship without executing it. Binary outcomes can be explicitly marked Yes/No independently of the label's language.

Open **Akışı anla / Understand flow** to see process counts, ambiguous logic, responsibilities and a scenario walkthrough. Click an issue to focus the relevant objects. Choose decision branches to follow a hypothetical path. The walkthrough stops at loops, parallel boundaries, unresolved choices and the 100-step default limit. It is not a BPMN engine and does not run actions, evaluate conditions or prove process termination.

Three complete themes — Midnight, Paper and Ember — update the canvas, shapes and connectors together. Text, relationships and locked objects remain intact. Theme and metadata edits participate in ordinary undo/redo.

Open `examples/orbit-workflow.filemigo.json` for a styled demo with 15 process nodes, six annotations, three decisions and three recovery loops. It is an invented mission, not operational flight guidance.

## For AI tools

| Tool | Result |
| --- | --- |
| `filemigo_capabilities` | Version, supported fields, limits and live protocol |
| `filemigo_analyze_workflow` | Entries, terminals, steps, responsibilities, decisions, cycles and issues |
| `filemigo_trace_workflow` | One hypothetical path; explicit unresolved stopping reason |
| `filemigo_list_themes` | Three palettes with exact colors |
| `filemigo_style_diagram` | Styled preview, applicable patch and semantic comparison |

`trace_workflow.choices` maps a node ID to one of its outgoing **edge IDs**. A trace has `executed: false`. `complete` means it reached a declared end; `terminal-candidate` means only that there is no outgoing link. `parallel-boundary` deliberately stops rather than pretending a single sequential path represents concurrent work.

Native patching now includes root `background`, `width`, `height`, `infinite`, `sourceTool` and `description`. See [patches](patches.md). Styling does not require semantic-change authorization. Responsibility, role, condition and description edits do, because they affect interpretation.

Live edits still require an enabled desktop session, a fresh revision, an acknowledged renderer change and readback. The 0.5 MCP client refuses writes to a pre-0.5 desktop, which cannot preserve the new semantic fields. Install/restart both sides together; keep the current diagram saved before closing an older app.

## Portable AI skill

The repository ships [`filemigo-workflows`](../skills/filemigo-workflows/SKILL.md), including a compact native patch reference. Copy that folder into the skills directory of your compatible AI client. For Codex, use `~/.codex/skills/filemigo-workflows` and start a new session so the skill can be discovered. The skill uses an independently configured local Filemigo MCP connection; copying the skill alone does not create that connection.

The skill covers creation, intent preservation, annotation handling, previews, revision conflicts, readback and handoff. It discovers server capabilities instead of assuming every client has the same version. It does not require a particular AI provider or paid API.

## Exchange and compatibility

Native JSON and editable SVG retain metadata. Supported draw.io shapes retain Filemigo semantics in custom attributes when round-tripped through Filemigo; other editors may remove custom attributes. Unsupported shapes, groups and sequence scopes remain explicit export errors. Markdown/JSON briefs include semantic fields without image pixels.

0.5 reads older native projects. Older Filemigo versions do not understand these additive fields and may discard them when saving, so use 0.5 for documents containing process metadata.

## Verification

- `npm test`: graph semantics, revisions, locks, exchange and real MCP stdio tests.
- `npm run build:runtime`: regenerate desktop core, browser SDK and MCP App from the source model.
- `node tests/browser-workflow.mjs`: optional Windows Edge check for imports, themes, undo/redo, review, branch walking, responsibility editing and draft persistence. Set `EDGE_BIN` if Edge is elsewhere. Screenshots are written to `out/qa`.
- `npm run desktop:package`: build the Windows app under `out/Filemigo-win32-x64`.

This release establishes an inspectable process model. Full BPMN execution, collaborative multi-user editing, nested subprocesses, richer layout algorithms and signed cross-platform distribution remain future work.
