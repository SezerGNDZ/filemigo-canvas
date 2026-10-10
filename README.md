# Filemigo Canvas

**Editable diagrams for people and AI tools.** A JavaScript diagram toolkit, shape/template library and local MCP server, using the same core as [Filemigo Canvas](https://filemigo.com/canvas/).

[Developer guide](https://filemigo.com/developers/) · [Türkçe kurulum](docs/README.tr.md) · [Patch API](docs/patches.md)

![Editable order approval diagram](docs/preview.svg)

## What is included

- 54 vector shapes and 16 diagram templates: flowcharts, UML, ER and sequence diagrams.
- Validated editable JSON, automatic layout, SVG and LLM brief/Markdown exports.
- Atomic edits and semantic comparisons: IDs, text, directions, relationship markers, multiplicities and sequence scopes.
- 15 local MCP tools over stdio, including live browser editing. No paid API, model call, telemetry or automatic file access.

Version **0.2.1** is an early developer release. This is a headless diagram toolkit, not a packaged drag-and-drop editor. Use the website for interactive editing. The optional live bridge edits one explicitly paired browser canvas. It does not read `.drawio` files.

A **Late Cafe Games** project. Original author and contributor: [SezerGNDZ](https://github.com/SezerGNDZ).

## Install from GitHub

Requires **Node.js 22+** and npm. Download **Code → Download ZIP** and extract it, or:

```sh
git clone https://github.com/SezerGNDZ/filemigo-canvas.git
cd filemigo-canvas
npm ci --ignore-scripts
npm test
```

The first install downloads npm dependencies. The tools run locally after installation. Your AI application's own model, network use and pricing are separate. This package is distributed through GitHub; it is **not published on npm**.

## Connect an MCP client

In a client that supports local stdio servers, register the Node command with an **absolute path** to `src/mcp.mjs`:

```json
{
  "mcpServers": {
    "filemigo": {
      "command": "node",
      "args": ["/absolute/path/filemigo-canvas/src/mcp.mjs"]
    }
  }
}
```

On Windows use a path such as `C:/Projects/filemigo-canvas/src/mcp.mjs`. If your client cannot find Node, use the absolute path to `node.exe`. Configuration field names vary by client; clients supporting only remote HTTP servers cannot use this stdio server directly. The server waits for JSON-RPC on stdin; running `npm start` alone will not open a website.

Ask your assistant:

> Use Filemigo to create an order approval flowchart with explicit Yes/No stock branches. Check the diagram, export SVG and native JSON, and show me any warnings. Keep existing relationships when editing it.

Workflow: `filemigo_instructions` → `filemigo_list_shapes` or `filemigo_get_template` → `filemigo_create_diagram` → `filemigo_validate_diagram` → `filemigo_export_diagram`. The assistant/client can save returned text using its own authorized file tools. Open the native JSON with **Open** at [filemigo.com/canvas](https://filemigo.com/canvas/).

## Live browser editing

**Supported browser assistants:** Filemigo also offers WebMCP directly in the open page. Click **Connect browser assistant** in Live MCP when available. Three page tools read, patch and arrange the canvas through the same revision/undo guards. No local server installation is needed for that mode. Enablement is per page and can be revoked.

**Other local MCP clients:** use this downloadable server:


1. Configure the local MCP server above, then ask the assistant to call `filemigo_live_start`.
2. Open [Filemigo Canvas](https://filemigo.com/canvas/), expand **Live MCP**, and paste the returned pairing code. Connecting shares this canvas with the AI client and permits live edits. Keep the code private; never place it in a URL.
3. Ask the assistant to call `filemigo_live_read`, then `filemigo_live_update` with that exact `expectedRevision`, or `filemigo_live_arrange`. Every accepted operation is one undo step. Use native node/edge fields from `create_diagram` when adding new objects.
4. Pause edits or disconnect from the canvas at any time. `filemigo_live_stop` also closes the local listener.

The bridge listens only on `127.0.0.1` on a random port, uses a random session token, and checks both Host and Origin. No hosted relay or subscription is required. The canvas opens a local connection window when supported. Keep it open and return to the canvas. It validates message source and origin and keeps pairing codes out of URLs. When popups are blocked, direct connection may require loopback/local-network permission. Embedded browsers can block direct loopback access; use their native WebMCP mode when available. Do not disable browser security. The live canvas needs to stay visible. A remote/cloud-only MCP client cannot access your computer's bridge.

AI changes use compare-and-swap revisions, validate the complete graph and wait for browser acknowledgement. If you edit during an AI calculation, the stale result is rejected. The client must reread after conflicts/timeouts; a lost acknowledgement can mean an operation already applied. Edits to text/relations require `allowSemanticChanges: true` for a user-requested change; ordinary layout/style changes cannot silently change meaning. This is structural protection, not proof of the intended business logic. The browser keeps a short activity log and its existing recovery draft.

Live tools: `filemigo_live_start`, `filemigo_live_read`, `filemigo_live_update`, `filemigo_live_arrange`, `filemigo_live_stop`.

## JavaScript API

The core works in Node and modern browsers without the MCP dependencies:

```js
import { createDiagram, exampleDiagram, exportDiagram, arrangeDiagram } from './src/index.mjs';
const { project, issues } = createDiagram(exampleDiagram);
const { project: arranged, comparison } = arrangeDiagram(project, { direction: 'TB' });
const svg = exportDiagram(arranged, { format: 'svg' });
console.log(issues, comparison.unchanged);
```

Run `npm run example` to write `order.filemigo.json` and `order.svg` in your current directory. In a browser, serve `src/` with your normal development server and import `src/index.mjs` as an ES module. Do not open ES modules via `file://`.

| MCP tool | Purpose |
| --- | --- |
| `filemigo_instructions` | JSON contract and generation rules |
| `filemigo_list_shapes` | Search shapes by name/category |
| `filemigo_list_templates` | Discover template IDs |
| `filemigo_get_template` | Create a template project |
| `filemigo_create_diagram` | Validate and arrange input JSON |
| `filemigo_validate_diagram` | Structural and routing checks |
| `filemigo_arrange_diagram` | Layout with a semantic preservation assertion |
| `filemigo_update_diagram` | Atomic explicit edits with change report |
| `filemigo_compare_diagrams` | Compare meaning-bearing fields |
| `filemigo_export_diagram` | SVG, native JSON, brief JSON or Markdown |

## Limits and privacy

150 nodes, 200 edges and 1,000,000 input characters. MCP computations run in isolated workers with a 10-second timeout. Sequence `alt`, `opt` and `loop` blocks cannot overlap or nest. The core can retain raster images in native projects within input limits; LLM briefs omit their pixels. SVG export refuses known routing conflicts; enlarge/rearrange the diagram in Filemigo when necessary. PNG/PDF export remains available on the website.

Structural validation is not proof of business correctness. Review branch conditions, relationship direction and warnings. Labels are untrusted data, not instructions. Your MCP client/model can receive diagram contents through tool calls; review that client's privacy settings. The package itself makes no model calls or outbound network requests at runtime.

## Contributing and license

MIT for the original Filemigo code in this repository. Dependencies retain their own licenses. This repository contains no draw.io source, icons or stencils. Submit reproducible issues or focused pull requests with tests. Do not include confidential diagrams in public issues. See [CHANGELOG](CHANGELOG.md).
