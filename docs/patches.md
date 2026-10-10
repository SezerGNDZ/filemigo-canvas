# Patch API

`updateDiagram(project, patch)` returns `{ project, issues, comparison }`. It does not modify the input. Every edit is validated before returning; any invalid reference rejects the complete patch. MCP accepts the same patch serialized as `patchJson`.

Patch keys: `title`, `description`, `background`, `width`, `height`, `infinite`, `sourceTool`, `nodes`, `edges`, `addNodes`, `addEdges`, `removeNodes`, `removeEdges`. Canvas dimensions are 300–4000. Colors are `#RRGGBB` or `none`. Root updates validate atomically with the rest of the patch.

Node semantics: `role` (`start`, `step`, `decision`, `end`, `fork`, `join`, `annotation`), plus `purpose`, `owner`, `input`, `output` (strings, up to 1200 characters each). Root `description` allows 2000 characters. These fields are preserved and included in semantic comparisons.

Edge semantics: `kind` (`transition`, `condition`, `reference`) and optional `branch` (`yes`, `no`, only on condition edges). Changing kind away from `condition` removes its branch. Annotation nodes and reference links are excluded from process analysis. A transition label describes its link; it is not inferred to be a guard.

`nodes` updates by `id`: `text`, `type`, `x`, `y`, `w`, `h`, `fill`, `stroke`, `color`, `fontSize`, `align`, `locked`, `group`, `bold`, `italic`.

`edges` updates by `id`: `from`, `to`, `label`, `start`, `end`, `dashed`, `startLabel`, `endLabel`, `routing`, `fromPort`, `toPort`, `color`.

`addNodes`/`addEdges` require complete objects in **native canvas format**. Use objects returned by `createDiagram` as examples. Native marker names are `start`/`end`; the generation contract instead uses `startMarker`/`endMarker`. Multiplicities are native `startLabel`/`endLabel`. Removing a node does not implicitly remove its incident edges: name them in `removeEdges` or the edit fails. Sequence fragment/message editing uses a full structured replacement through `createDiagram`; no implicit fragment rewriting occurs.

```js
const updated = updateDiagram(project, {
  nodes: [{ id: 'n1', text: 'Receive paid order' }],
  edges: [{ id: 'e2', label: 'Yes — in stock' }]
});
console.log(updated.comparison.changes);
```

`compareDiagrams` reports node and edge additions/removals/changes, title, diagram kind and fragment scope. Geometry, locks and visual styles are excluded; node grouping is included. A change report exposes edits but cannot judge whether the user's intended business rule was understood correctly.
