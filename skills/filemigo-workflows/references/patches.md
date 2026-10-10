# Native patches (Filemigo 0.5+)

`filemigo_update_diagram` and `filemigo_preview_changes` take `diagramJson` plus `patchJson`. Live update uses `expectedRevision`, `patchJson`, `allowSemanticChanges`, and optional `lang`.

Root patch keys: `title`, `description`, `background` (`#RRGGBB` or `none`), `width`, `height` (300–4000), `infinite`, `sourceTool`, `nodes`, `edges`, `addNodes`, `addEdges`, `removeNodes`, `removeEdges`.

`sourceTool`: flowchart, uml-class, er-diagram, sequence-diagram, assignment-cover, weekly-planner. It declares the intended diagram category; do not relabel a UML diagram just to make flow analysis run.

`nodes`: objects identified by `id`, with changed fields only. Supports text, type, x/y/w/h, fill/stroke/color, fontSize, align, locked, group, bold, italic, radius, strokeWidth, dash, fontFamily, verticalAlign, opacity, padding, and semantic role/purpose/owner/input/output.

`edges`: objects identified by `id`. Supports from/to, label, start/end markers, dashed, startLabel/endLabel multiplicities, routing, fromPort/toPort, color, strokeWidth, kind, branch. Changing kind away from condition removes its branch. Native markers are `start`/`end`; the generation contract uses `startMarker`/`endMarker`.

Additions require complete native objects returned by create_diagram. Removing a node requires explicit removal of its incident edges. Patches are atomic: invalid fields/references reject the whole change. Metadata is included in semantic comparisons. Canvas color and geometry are not semantic changes; category, description, role, branch and responsibility changes are.

Example — a cosmetic live patch:

```json
{"background":"#0B1222","nodes":[{"id":"step1","fill":"#16233D","stroke":"#4EDBC5","color":"#F1F6FF"}]}
```

Example — declared meaning (requires user-authorized semantic change):

```json
{"nodes":[{"id":"heading","role":"annotation"},{"id":"step1","role":"start","owner":"Operations","output":"Validated request"}],"edges":[{"id":"e_approved","kind":"condition","branch":"yes"}]}
```

Prefer native JSON / editable SVG to preserve all supported metadata. Other interchange formats may reject unsupported semantics; do not silently strip them to make an export succeed.
