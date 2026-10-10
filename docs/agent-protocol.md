# Agent protocol v1 · Filemigo 0.6

Optimize the context an agent needs to understand and edit a workflow. Native canvas JSON remains the editable source; compact context is a semantic read projection. This is a protocol candidate with measured payload sizes and deterministic tests, not a claim of industry standardization or verified model task success.

## Three-tool interface

Set `FILEMIGO_MCP_PROFILE=agent` in the MCP server environment to expose only `filemigo_agent_contract`, `filemigo_agent_read` and `filemigo_agent_patch`. The default profile retains all 26 tools for diagram creation, layout and interchange. Read the contract once per protocol version; do not repeatedly load the drawing manual or shape catalog for a semantic edit.

```json
{"view":"overview"}
```

Calling `agent_read` with no document or input connects to the open desktop and returns a document handle, revision, snapshot and small overview. AI must already be enabled. For an offline, session-local document, send `diagramJson` once. That caches the native source without repeatedly transmitting it. Nothing is written to a file.

```json
{"document":"RETURNED_HANDLE","view":"focus","ids":["approval"],"depth":0}
```

`graph` returns process nodes and links; `focus` returns selected nodes plus up to three undirected neighborhood hops. Every incident edge survives, including endpoints beyond the slice. `scope.boundary` explicitly lists those IDs; `complete:false` prevents treating a slice as the whole workflow. Global entry/terminal candidates, cycles and issues remain present. Inspect boundary nodes when a task depends on them.

Graph rows retain exact text, responsibilities, inputs/outputs, conditions, stable IDs, locks and relevant group membership. Only disconnected annotations and rendering data are omitted. Linked annotations and references survive. Inferred roles/kinds are marked; ambiguous directions remain unresolved, with original endpoint markers retained. Unsupported diagram types are rejected rather than silently reinterpreted as workflows.

## Creating from a blank canvas

Since 0.6.1, `agent_read` on an empty freeform/workflow canvas returns `state: "empty"` and `canCreate: true`. It does not misclassify other diagram categories. Use `agent_patch` with `workflowJson` instead of `patchJson`:

```json
{"title":"Approval","nodes":[{"id":"a","text":"Receive","role":"start"},{"id":"b","text":"Approved?","role":"decision"},{"id":"c","text":"Done","role":"end"},{"id":"d","text":"Revise"}],"edges":[{"from":"a","to":"b"},{"from":"b","to":"c","branch":"yes"},{"from":"b","to":"d","branch":"no"},{"from":"d","to":"b"}]}
```

Pass this object as a JSON string in `workflowJson`, alongside document and expectedRevision. Optional description, theme (midnight/paper/ember), direction (TB/LR), node purpose/owner/input/output and edge id/kind/label are supported. Nodes default to step; declare start/end/decision explicitly. Edges default to transition, or condition if branch is supplied; generated edge IDs are e1, e2, etc. Explicit IDs must remain unique. Branch labels default to Yes/No. Unknown fields, duplicate IDs, missing endpoints and invalid branches are rejected. Incomplete logic is reported rather than invented.

The server produces native shapes, layout and colors without sending those fields through the model. Creation previews return counts and issues, not a full graph echo. Apply the single-use preview ID with `allowSemanticChanges:true`; revision, lock, pause, acknowledgement and readback guards still apply. Nonempty canvases are rejected without modification. Use native tools only when custom visual design is needed, not to bootstrap ordinary agent-created workflows.

## Incremental reads

Pass the previous `snapshot` as `since`, with the same document/view/IDs/depth. A semantic no-op returns `unchanged:true` even if a style edit advanced the revision. Changed views return `delta`: apply `set`/`unset` to top-level fields, remove row IDs, then replace/add `upsert` nodes/edges and sort by ID. A missing or mismatched snapshot returns `reset:true` and a complete fresh view, never a fabricated empty delta.

Caches are process-local and bounded: 16 documents, 64 snapshots, 16 previews. Eviction/restart invalidates handles. Different agents can independently read the same desktop with their own handles; diagram revision guards arbitrate writes. There are no agent task leases, distributed execution guarantees, task-completion states or durable memory in this release.

## Compact edits

```json
{"document":"RETURNED_HANDLE","expectedRevision":7,"patchJson":"{\"nodes\":[{\"id\":\"approval\",\"owner\":\"Editorial agent\"}]}"}
```

`agent_patch` previews against the last observed project and exact revision, returning changed IDs/fields, counts, issues and a single-use `previewId`. Apply with that ID, document, revision and `apply:true`; omit `patchJson`. Set `allowSemanticChanges:true` only for a user-authorized meaning change. Existing authorization is sufficient for routine edits; the preview step does not create a new user-approval requirement.

The server rereads state, rejects stale/busy/paused/locked changes, and sends the exact previewed patch. Desktop acknowledgement and readback determine `applied`/`verified`. An unknown acknowledgement consumes the preview; read again before deciding what remains. Receipts omit full graph echoes. Use `since` to inspect the resulting delta. This changes diagram data only; an owner field neither delegates a task nor authorizes external actions.

## Reproduce measurements

```sh
node examples/agent-benchmark.mjs examples/orbit-workflow.filemigo.json payloads.json
python examples/count-agent-tokens.py payloads.json token-report.json
```

The optional Python measurement requires `tiktoken`. It counts both `o200k_base` and `cl100k_base`; this is not a runtime dependency. Compare minified JSON with minified JSON, include envelopes, report the one-time contract separately, and identify partial views. Provider billing and reasoning costs are not inferred from payload size. Next evaluation should measure correct branch interpretation, missing-context detection and successful edits across models alongside token count, latency and retries.

## Measured example

For the 0.6.0 baseline, on the 21-object / 17-edge NOVA workflow, using tiktoken 0.14.0 and `o200k_base` (minified response text, including envelopes):

| Read | Tokens |
| --- | ---: |
| Native canvas JSON | 3,727 |
| Existing brief with layout | 5,065 |
| Complete semantic graph | 1,371 |
| Overview | 277 |
| One decision, depth 0 | 400 |
| One owner-field change delta | 195 |
| Unchanged response | 82 |
| One-time agent contract | 523 |
| Full tool discovery (26) | 4,295 |
| Agent tool discovery (3) | 526 |

The full semantic graph uses 63.2% fewer tokens than native JSON in this example; the agent tool catalog is 87.8% smaller. Focus and delta views intentionally contain less information. Random handle tokenization can vary slightly between runs. See [both tokenizer counts and methodology](agent-token-report.json). These results measure payload size, not model accuracy or an end-to-end bill.

## Live creation measurement (0.6.1)

A six-node, six-edge SPARK workflow was created on an empty live desktop using only the three agent-profile tools after the existing drawing was backed up and the test canvas cleared. The compact spec used **183 tokens**, versus **774** for generated native JSON (76.4% fewer). Empty read + creation preview + verified apply exchanged **567 tokens** of argument/response text. A subsequent complete semantic graph read brings that to **997**. The one-time contract request/response adds **677**. These counts use tiktoken 0.14.0 / o200k_base; tool discovery, test setup and model reasoning are not included. This is payload measurement, not provider billing.

The live test confirmed 6 nodes/6 edges, explicit yes/no branches, an unchanged incremental read, desktop acknowledgement/readback, and rejection of creation on an occupied canvas. See [token details](empty-create-token-report.json).
