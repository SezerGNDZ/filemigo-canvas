# Filemigo Desktop

This checkout builds **0.6.1**, including [compact agent context](agent-protocol.md) and [workflow intelligence](workflow-intelligence.md). Run `npm ci --ignore-scripts`, `node node_modules/electron/install.js`, then `npm run desktop:package`. The result is `out/Filemigo-win32-x64/Filemigo.exe`. Save the open project and close the older app before starting the new one. Recopy its MCP setup configuration and restart your MCP client; 0.5 tools refuse writes to older desktop builds to preserve metadata.

Filemigo's offline diagram editor and live MCP now run together on your computer. The website remains an independent, installation-free editor. Live browser pairing has been retired in this version.

## Windows quick start

1. Download `Filemigo-Desktop-0.4.0-win-x64.zip` from [Releases](https://github.com/latecafe-tech/filemigo-canvas/releases/tag/v0.4.0).
2. Extract the **entire** ZIP to a permanent folder. Keep the resources and DLL files beside `Filemigo.exe`.
3. Open `Filemigo.exe`. Draw offline, open a project, or choose a template. Save with Ctrl+S; use Ctrl+Shift+S for Save As. Project files are JSON. SVG, PNG, PDF and supported draw.io exports remain available.
4. Open **MCP kurulumu** in the app. Copy its generated configuration into a **local stdio MCP client**. It contains your actual executable and packaged script paths. Restart the client after adding it.
5. Click **AI bağlantısını aç** in Filemigo. Ask your assistant: “Call filemigo_live_start, read my desktop canvas, then draw a library UML diagram. Preserve existing IDs and relationships.”

No separately installed Node.js or pairing code is required. The configuration runs the application's bundled Electron executable in its built-in Node mode (`ELECTRON_RUN_AS_NODE=1`). The desktop window remains a separate process. Moving the application folder requires copying the updated configuration again. Cloud-only clients cannot launch a local executable.

## Keep control

- AI starts disabled each time the window opens. Enable it explicitly for the current desktop session. **AI bağlantısını kes** revokes access for all connected local MCP clients.
- **Düzenlemeyi duraklat** prevents AI writes while retaining read access. Undo/redo works for accepted AI edits. Locks protect individual objects.
- The assistant must call `filemigo_live_read` before writing and use the returned revision. A manual edit, active text field, drag, modal or pause rejects conflicting writes. No automatic retry is performed.
- AI edits become visible only after the renderer accepts them. A timeout is not success: the assistant must read again before retrying.
- Project saving uses native file dialogs and is controlled by you. AI tools do not write arbitrary files. Opening another project is undoable. Saving detects external changes to the current disk file and offers Save As.
- An authenticated local named pipe connects the MCP process and app. No HTTP port or cloud relay is opened. A transient credential is stored in the app's user-data directory and removed on clean exit; do not share it.
- The editor loads only bundled resources; it has no analytics or ads and needs no network connection. Your chosen AI client/provider may use the internet and charge for its service. The enabled canvas is shared with that client.

## Current scope

The first binary is a **portable, unsigned Windows x64 build**, not an installer. No code-signing certificate, app-store listing or automatic updater is included. macOS/Linux binaries have not been built or validated. Download updates manually from this repository. Platform security may identify the unsigned app as an unknown publisher; this release does not bypass those checks.

54 shapes, 16 templates, 150 objects / 200 connections. Supported draw.io imports/exports are a subset. Validation preserves explicit relations but cannot prove the intended business logic. Native JSON or editable SVG preserves the full supported Filemigo document.

## Build from source

Requires Node.js 22.12+ for development only:

```sh
npm ci --ignore-scripts
node node_modules/electron/install.js
npm test
npm run desktop
npm run desktop:package
```

Bundled renderer assets are committed under `desktop/web`. To update them from the Filemigo site checkout, run `node desktop/prepare.mjs /absolute/path/to/site/dist` after building the site. `desktop:package` currently targets Windows x64. The packaged application includes the editor and MCP dependencies, but excludes development dependencies.

## Türkçe kısa kullanım

ZIP'in tamamını kalıcı bir klasöre çıkar → `Filemigo.exe` → **MCP kurulumu** → JSON'u yerel MCP istemcine ekle → istemciyi yeniden başlat → **AI bağlantısını aç**. Asistanından `filemigo_live_start` ve ardından `filemigo_live_read` çağırmasını iste. Çizdiklerini masaüstündeki açık tuvalde görürsün. Sen de düzenleyebilir, geri alabilir ve dosyana kaydedebilirsin. Web sitesini MCP için açman gerekmez.
