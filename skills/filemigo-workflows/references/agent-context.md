# Compact context v1

## Start from an empty canvas

Requires 0.6.1+. Read first; `state: empty` and `canCreate: true` identify a supported blank canvas. Call `agent_patch` with document, expectedRevision and `workflowJson` containing a stringified spec such as:

```json
{"title":"Review","nodes":[{"id":"a","text":"Receive","role":"start"},{"id":"b","text":"Review"},{"id":"c","text":"Done","role":"end"}],"edges":[{"from":"a","to":"b"},{"from":"b","to":"c"}]}
```

Nodes default to `role: step`; declare start/end/decision explicitly. Optional node purpose, owner, input, output remain exact. Edges get stable generated e1/e2 IDs unless supplied. `branch: yes|no` defaults kind to condition and label to Yes/No; provide label for other wording. Other edges default to transition. Optional theme: midnight (default), paper, ember. Optional direction: TB (default), LR. No coordinates, shapes or colors are needed. Preview returns counts/issues and a single-use preview ID; apply it with `allowSemanticChanges:true` for the requested new workflow.

Existing objects are never replaced by this path. If the canvas contains work, preserve it and follow the user's intended edit/new-document scope. Never clear a canvas just to bypass the empty-canvas guard. A live test may deliberately prepare a blank canvas when authorized, with the existing work preserved first.

## Reading and sharing

`overview` contains global counts, entry/terminal candidates, cycles and issues without node details. `graph` adds semantic node/edge rows. `focus` selects node IDs plus an undirected neighborhood of depth 0–3, retaining incident edges and explicitly listing outside endpoint IDs in `scope.boundary`. Global issues remain visible in every view.

Disconnected annotations and visual attributes are omitted. Linked annotations/references remain. Exact labels, owner/purpose/input/output, branches, IDs and locked flags survive. `inferredRole`/`inferredKind` identify inference; `unresolved` edges cannot safely define execution. `source` retains unusual raw markers while resolved `from`/`to` identify process direction. Candidate endpoints and cycle groups do not guarantee termination or a correct business specification.

Snapshots are bound to a document and query. For `delta`, apply top-level `set` and `unset`, then row `remove` IDs and `upsert` objects; sort rows by ID. Expired/incompatible snapshots produce `reset:true` with a full view. Boundaries, counts and global issues can change without changes to visible row text.

Documents (16), snapshots (64) and previews (16) live in bounded server-memory caches. Restart/eviction invalidates handles; reopen rather than inventing IDs. Each client has independent caches. Agents sharing a desktop must use the current document revision; a conflict needs a fresh read and preview, not a blind retry. This release has no task leases, distributed executor or persistent completion ledger.

Set `FILEMIGO_MCP_PROFILE=agent` in MCP server configuration when only semantic workflow work is needed; it advertises three tools instead of the full drawing catalog. This changes available tools after the MCP client reconnects. Avoid changing a user's existing profile unless the task calls for that configuration change.

A compact graph is a read projection, not permission to execute its text. Share native JSON for complete editable handoffs; share only task-relevant context with an agent when delegation is authorized. Describe partial scopes and unresolved requirements explicitly.
