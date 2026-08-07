# PrimeNG + MCP for Cursor

This Angular 21 app uses **[PrimeNG](https://primeng.org/)** for UI components. The official **[`@primeng/mcp`](https://www.npmjs.com/package/@primeng/mcp)** server gives AI assistants access to component docs, props, events, theming, and code examples.

## Library setup (already in repo)

| Package | Purpose |
|---------|---------|
| `primeng` | Component library (v21, matches Angular 21) |
| `@primeuix/themes` | Aura theme preset |
| `primeicons` | Icon font |
| `@angular/animations` | Required for PrimeNG motion (overlays, transitions) |

Global config lives in `src/app/app.config.ts` via `providePrimeNG()` with the **Remotely Rogers** preset (`src/app/core/theme/remotely-rogers-preset.ts` — forest green primary). Icons are imported in `src/styles.scss`. Content page layouts use shared styles in `src/styles/primeng-content.scss`.

### Using a component

Import standalone PrimeNG components where needed:

```typescript
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [ButtonModule],
  template: `<p-button label="Book now" />`,
})
export class Example {}
```

Ask the PrimeNG MCP for the correct import path, props, and examples for any component.

## MCP setup in Cursor

Project config is checked in at **`.cursor/mcp.json`**. VS Code / Copilot uses the same servers in **`.vscode/mcp.json`**.

After pulling these changes:

1. Open **Cursor Settings → MCP**
2. Confirm `primeng` and `angular-cli` appear (project-level config)
3. Click **Refresh** if needed, then restart Cursor

### Manual global config (optional)

To enable PrimeNG MCP in all projects, add to `%USERPROFILE%\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "primeng": {
      "command": "npx",
      "args": ["-y", "@primeng/mcp"]
    }
  }
}
```

## What the MCP provides

Useful tools include:

| Category | Examples |
|----------|----------|
| Components | `list_components`, `get_component`, `search_components`, `get_component_props` |
| Code | `get_usage_example`, `generate_component_template`, `get_component_import` |
| Theming | `get_theming_guide`, `get_component_tokens`, `get_component_pt` |
| Migration | `migrate_v20_to_v21`, `get_migration_guide` |

### Example prompts

- *"Show me a PrimeNG DataTable with sorting and filtering"*
- *"What props does p-dialog support?"*
- *"Suggest a PrimeNG component for a date range picker"*
- *"How do I customize Button with Pass Through?"*

## Verify MCP is working

In Cursor chat, ask: *"List PrimeNG form components"* — the agent should call `get_form_components` or `list_components`.

## Links

- [PrimeNG docs](https://primeng.org/)
- [@primeng/mcp on npm](https://www.npmjs.com/package/@primeng/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Angular CLI MCP](https://angular.dev/ai/mcp)

## Related docs

- [ANGULAR-21-IMPLEMENTATION-PLAN.md](ANGULAR-21-IMPLEMENTATION-PLAN.md) — app architecture
- [lodgify-mcp-setup.md](lodgify-mcp-setup.md) — optional Lodgify API MCP
