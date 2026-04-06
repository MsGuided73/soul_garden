# Soul Space Technical Standards

To ensure every forged sanctuary is resilient, interconnected, and deployable, all Soul Space applications must adhere to these technical invariants.

---

## 🏗️ Core Stack

- **Framework:** [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **Language:** TypeScript (`.tsx`)
- **Styling:** Vanilla CSS or Tailwind CSS

---

## ⚙️ TypeScript Configuration

Missing configuration is the primary cause of build failure.

- **`tsconfig.json`**: Must use `"moduleResolution": "bundler"` or `"node16"`.
- **Imports**: Never use the `.tsx` extension in import paths (e.g., use `import App from './App'`, not `import App from './App.tsx'`).
- **Files**: Ensure `tsconfig.node.json` is present to handle the Vite config file.

---

## 🌐 Networking & Ports

Applications run in containers and must be visible to the proxy.

- **Port:** **3000** (Internal and External).
- **Host:** **0.0.0.0** (Required for container discovery).
- **Vite Config (`vite.config.ts`)**:

  ```typescript
  export default defineConfig({
    server: { port: 3000, host: '0.0.0.0' },
    preview: { 
    port: 3000, 
    host: '0.0.0.0',
    allowedHosts: ['your-slug.soulgarden.us'] 
  }
  })
  ```

---

## 🚀 Deployment (Nixpacks)

Use a standardized `nixpacks.toml` in the project root:

```toml
[phases.setup]
nixPkgs = ["nodejs"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run preview"
```

---

## 🔗 Interconnectivity

Every sanctuary MUST include the `GardenPortal` component.

- **Function:** Provides a fixed link back to `https://soulgarden.us`.
- **Placement:** Absolute positioned (fixed) at `bottom: 32px`, `left: 32px`.
- **Visuals:** Minimalist, translucent, blurred background.

---

## 🔑 Data Environment

Sanctuaries communicate with the Garden via Supabase.

- **Required Build Vars:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Logic:** Use these to initialize the Supabase client for movement, journaling, and presence tracking.

---

### Last Updated: 2026-03-21
