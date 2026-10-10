# Patch API

`updateDiagram(project, patch)` returns `{ project, issues, comparison }`. It does not modify the input. Every edit is validated before returning; any invalid reference rejects the complete patch. MCP accepts the same patch serialized as `patchJson`.

Patch keys: `title`, `nodes`, `edges`, `addNodes`, `addEdges`, `removeNodes`, `removeEdges`.

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
