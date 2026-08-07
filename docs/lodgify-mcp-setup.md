# Optional: Lodgify MCP for Cursor

There is **no official Lodgify MCP** in Cursor by default. This project documents community MCP servers for **API exploration during development** — they do not modify the Lodgify website builder directly.

## Is Lodgify MCP installed here?

**No.** Your Cursor MCP folder has Nx, Figma, Cloudflare, Linear, and Slack — but no Lodgify server yet. Add one below if you want chat-based access to properties, availability, and quotes while building the Angular app.

## Recommended community server

**[MikeRobGIT/lodgify-mcp](https://github.com/MikeRobGIT/lodgify-mcp)** — most complete option (20+ tools, TypeScript, read-only mode):

| Tool category | Examples |
|---------------|----------|
| Properties | List properties, get by ID |
| Availability | `lodgify_get_property_availability`, daily rates calendar |
| Quotes | `lodgify_get_quote` per property/dates |
| Bookings | List, create, payment links (writes blocked in read-only mode) |

Alternatives: [diecamdia/lodgify-mcp-server](https://github.com/diecamdia/lodgify-mcp-server), [Fast-Transients/lodgify-mcp-server](https://github.com/Fast-Transients/lodgify-mcp-server) (Python, fewer tools).

## Install in Cursor

### 1. Get a Lodgify API key

Lodgify Dashboard → **Settings** → **Public API** → generate key.

### 2. Add to Cursor MCP config

Edit **Cursor Settings → MCP → Add new MCP server** or `%USERPROFILE%\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "lodgify": {
      "command": "npx",
      "args": ["-y", "lodgify-mcp@latest"],
      "env": {
        "LODGIFY_API_KEY": "YOUR_LODGIFY_API_KEY",
        "LODGIFY_READ_ONLY": "true"
      }
    }
  }
}
```

Set `LODGIFY_READ_ONLY` to `"true"` while exploring. Remove or set `"false"` only when you intentionally need write tools (create booking, etc.).

### 3. Restart Cursor

After restart, ask in chat: *"List my Lodgify properties"* — the MCP should call `lodgify_list_properties` (exact tool names vary by server version).

## What MCP can and cannot do for this project

| Task | MCP helps? | Notes |
|------|------------|-------|
| Look up property IDs, rates, availability | **Yes** | Use during Angular BFF development |
| Debug quote API for multi-cabin grid | **Yes** | Compare MCP quote vs your BFF response |
| Embed `/calendar/multi` on the website | **No** | Host-only admin UI — not exposed via API or builder |
| Replace Lodgify website builder widgets | **No** | Builder only supports native widgets + **Raw HTML** |
| Paste modern page designs | **No** | Use Angular build output + Lodgify Raw HTML (see [BUILDER-GUIDE.md](lodgify/BUILDER-GUIDE.md)) |

## Use with this Angular project

The **Angular 21 app** (`ng serve` / `ng build`) will call a **BFF** (backend-for-frontend) that holds the API key. The MCP is optional for debugging in Cursor — same API, different entry point.

### Sync property IDs (Angular tooling)

Once `tools/sync-properties.ts` is added to the repo:

```powershell
$env:LODGIFY_API_KEY = "your-key"
npm run sync-properties
```

That npm script will invoke the TypeScript tool (not a legacy `node scripts/*.js` file). Output updates `src/environments/cabin-config.ts` (or `public/config.json` for static embed config).

### Local Angular dev

```powershell
ng serve
# Group booking widget: http://localhost:4200/group-booking
# Content page previews: http://localhost:4200/preview/activities
```

### Production build (deploy to Cloudflare Pages / Netlify)

```powershell
ng build --configuration production
# Deploy dist/remotely-rogers/browser/ to booking.remotelyrogers.com
```

## Security

- Never commit API keys to git
- Never put `LODGIFY_API_KEY` in the Angular browser bundle — only in BFF secrets (Wrangler, Railway, etc.)
- Use MCP read-only mode when exploring
- Stripe secret keys stay server-side only; Angular gets `stripePublishableKey` via environment

## Related docs

- [ANGULAR-21-IMPLEMENTATION-PLAN.md](ANGULAR-21-IMPLEMENTATION-PLAN.md) — full architecture
- [lodgify/BUILDER-GUIDE.md](lodgify/BUILDER-GUIDE.md) — paste HTML into Lodgify
- [payment/PAYMENT-DECISION.md](payment/PAYMENT-DECISION.md) — multi-cabin checkout strategy
