# Filemigo Canvas

**Editable diagrams for people and AI tools.** A JavaScript diagram toolkit, shape/template library and local MCP server, using the same core as [Filemigo Canvas](https://filemigo.com/canvas/).

[Developer guide](https://filemigo.com/developers/) · [Türkçe kurulum](docs/README.tr.md) · [Patch API](docs/patches.md)

![Editable order approval diagram](docs/preview.svg)

## What is included

- 54 vector shapes and 16 diagram templates: flowcharts, UML, ER and sequence diagrams.
- Validated editable JSON, automatic layout, SVG and LLM brief/Markdown exports.
- Atomic edits and semantic comparisons: IDs, text, directions, relationship markers, multiplicities and sequence scopes.
- 10 local MCP tools over stdio. No API key, model call, telemetry, network listener or automatic file access.

Version **0.1.0** is an early developer release. This is a headless diagram toolkit, not a packaged drag-and-drop editor. Use the website for interactive editing. The MCP server returns data; it does not control an open browser tab. It does not read `.drawio` files.

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
