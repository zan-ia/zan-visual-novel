---
name: stitch-mcp
description: 'Reference knowledge for Google Stitch MCP — AI-powered design-to-code platform. Covers authentication (API Key vs OAuth), VS Code MCP configuration, design system management, screen generation, and project workflows. Use when: configuring Stitch MCP, generating screens/designs via AI, managing design systems, troubleshooting Stitch authentication, or integrating Stitch into the development pipeline. Activates for: stitch, design, screen generation, design system, ui generation, mcp stitch, stitch mcp, google stitch.'
argument-hint: '[auth-config | api-key | oauth | generate-screen | design-system | tools-reference | troubleshoot] — what do you need?'
user-invocable: true
disable-model-invocation: false
context: fork
---

# Stitch MCP — Reference Knowledge

Complete reference for configuring and using the **Google Stitch** MCP server. Stitch is an AI-powered design-to-code platform that allows AI agents (Cursor, VS Code, Claude Code, Gemini CLI, Antigravity) to create, edit, and manage UI designs, design systems, and screens programmatically via the Model Context Protocol (MCP).

> **Official documentation:** https://stitch.withgoogle.com/docs/mcp/setup/
> **MCP endpoint:** `https://stitch.googleapis.com/mcp`

---

## 1. Authentication Modes

Stitch supports **two authentication methods**. Choose based on your environment:

| Mode        | Mechanism                                       | Persistence               | Complexity     | Best for                                        |
| ----------- | ----------------------------------------------- | ------------------------- | -------------- | ----------------------------------------------- |
| **API Key** | `X-Goog-Api-Key` header                         | Permanent (until revoked) | ⭐ Simple      | Local dev, private machines, VS Code            |
| **OAuth**   | `Authorization: Bearer` + `X-Goog-User-Project` | 1-hour tokens             | ⭐⭐⭐ Complex | Zero-trust environments, CI/CD, web-based tools |

### When to use which

| Scenario                                        | API Key | OAuth |
| ----------------------------------------------- | ------- | ----- |
| Tool accepts config file/env var                | ✅      | —     |
| Web-based tool (no manual key input)            | —       | ✅    |
| Private machine (safe to store secrets locally) | ✅      | —     |
| Zero-trust / ephemeral environment              | —       | ✅    |
| Connection stays active indefinitely            | ✅      | —     |
| Need to "log out" and revoke instantly          | —       | ✅    |
| Session-based with expiry                       | —       | ✅    |

---

## 2. API Key Setup (Recommended)

### 2.1 Generate an API Key

1. Go to [Stitch Settings](https://stitch.withgoogle.com/settings)
2. Scroll to **API Keys** section
3. Click **Create API Key**
4. Copy the key and store it securely

### 2.2 VS Code MCP Configuration

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "stitch-api-key",
      "description": "Stitch (Google Cloud) API Key",
      "password": true
    }
  ],
  "servers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "Accept": "application/json",
        "X-Goog-Api-Key": "${input:stitch-api-key}"
      }
    }
  }
}
```

**How it works:**

- `${input:stitch-api-key}` is a VS Code input variable — the actual key is **never** written to disk
- On first connection, VS Code prompts for the API key (masked input)
- The key is securely stored in VS Code's internal credential store

### 2.3 Other Clients

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

**Claude Code:**

```bash
claude mcp add stitch --transport http https://stitch.googleapis.com/mcp \
  --header "X-Goog-Api-Key: YOUR-API-KEY" -s user
```

**Gemini CLI:**

```bash
gemini extensions install https://github.com/gemini-cli-extensions/stitch
```

---

## 3. OAuth Setup (Advanced)

OAuth uses **Google Cloud SDK** (`gcloud`) for authentication. Tokens expire in **1 hour** and must be refreshed manually.

### 3.1 Prerequisites

- Google Cloud SDK (`gcloud` CLI) installed
- A Google Cloud Project with Stitch API enabled
- `roles/serviceusage.serviceUsageConsumer` IAM role

### 3.2 Step-by-Step

**1. Install gcloud CLI:**

```bash
# Standalone
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
export CLOUDSDK_CORE_DISABLE_PROMPTS=1

# Homebrew (macOS)
brew install --cask google-cloud-sdk
```

**2. Double-Layer Authentication:**

```bash
# User login (opens browser)
gcloud auth login

# Application Default Credentials (ADC) — allows MCP to impersonate you
gcloud auth application-default login
```

**3. Configure Project & Permissions:**

```bash
PROJECT_ID="your-gcp-project-id"
gcloud config set project "$PROJECT_ID"

# Enable Stitch API
gcloud beta services mcp enable stitch.googleapis.com --project="$PROJECT_ID"

# Grant permissions
USER_EMAIL=$(gcloud config get-value account)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="user:$USER_EMAIL" \
  --role="roles/serviceusage.serviceUsageConsumer" \
  --condition=None
```

**4. Generate Secrets:**

```bash
TOKEN=$(gcloud auth application-default print-access-token)
echo "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" > .env
echo "STITCH_ACCESS_TOKEN=$TOKEN" >> .env
```

**5. Refresh workflow (every hour):**

```bash
# Re-run step 4 to update .env
TOKEN=$(gcloud auth application-default print-access-token)
# Then update your MCP client config with the new token
```

### 3.3 VS Code OAuth Configuration

```json
{
  "servers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "Accept": "application/json",
        "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",
        "X-Goog-User-Project": "<YOUR_PROJECT_ID>"
      }
    }
  }
}
```

> ⚠️ **IMPORTANT:** The `Authorization` header must be updated every hour. Most MCP clients do NOT auto-read `.env` files.

---

## 4. Available Tools Reference

### 4.1 Project Management

| Tool             | Parameters                  | Description                                |
| ---------------- | --------------------------- | ------------------------------------------ |
| `create_project` | `title` (string)            | Creates a new project container            |
| `get_project`    | `name` (string)             | Retrieves project details by resource name |
| `list_projects`  | `filter` (string, optional) | Lists accessible projects (owned/shared)   |

### 4.2 Screen Management

| Tool           | Parameters           | Description                               |
| -------------- | -------------------- | ----------------------------------------- |
| `list_screens` | `projectId` (string) | Fetches all screens in a project          |
| `get_screen`   | `name` (string)      | Retrieves screen details by resource name |

### 4.3 AI Generation

| Tool                        | Parameters                                                     | Description                                  |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `generate_screen_from_text` | `projectId`, `prompt`, `modelId`                               | Creates a new screen from text description   |
| `edit_screens`              | `projectId`, `selectedScreenIds[]`, `prompt`                   | Edits existing screens with natural language |
| `generate_variants`         | `projectId`, `selectedScreenIds[]`, `prompt`, `variantOptions` | Generates design variants of screens         |

### 4.4 Design Systems

| Tool                   | Parameters                                          | Description                             |
| ---------------------- | --------------------------------------------------- | --------------------------------------- |
| `create_design_system` | `designSystem` (object), `projectId` (optional)     | Creates a new design system with tokens |
| `update_design_system` | `name`, `projectId`, `designSystem`                 | Updates an existing design system       |
| `list_design_systems`  | `projectId` (optional)                              | Lists all design systems for a project  |
| `apply_design_system`  | `projectId`, `selectedScreenInstances[]`, `assetId` | Applies a design system to screens      |

### 4.5 Design System Schema

```json
{
  "displayName": "My Design System",
  "theme": {
    "colorMode": "LIGHT" | "DARK",
    "headlineFont": "FONT_*",
    "bodyFont": "FONT_*",
    "labelFont": "FONT_*",
    "roundness": "ROUND_FOUR" | "ROUND_EIGHT" | "ROUND_TWELVE" | "ROUND_FULL",
    "customColor": "#hex-color",
    "colorVariant": "MONOCHROME" | "NEUTRAL" | "TONAL_SPOT" | "VIBRANT" | "EXPRESSIVE" | "FIDELITY" | "CONTENT" | "RAINBOW" | "FRUIT_SALAD",
    "typography": { /* level → { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } */ },
    "spacing": { /* name → value */ }
  }
}
```

---

## 5. Storing API Keys Securely

### Anti-patterns (NEVER do this)

```json
// ❌ Hardcoded key in mcp.json — WILL leak in git
{
  "headers": {
    "X-Goog-Api-Key": "YOUR_API_KEY_HERE"
  }
}
```

```bash
# ❌ Key in shell history or plain-text file
export STITCH_API_KEY="AQ.Ab8..."
```

### Correct patterns

```json
// ✅ VS Code input variable — securely stored, never committed
{
  "headers": {
    "X-Goog-Api-Key": "${input:stitch-api-key}"
  }
}
```

```bash
# ✅ Environment variable in .env (gitignored)
STITCH_API_KEY=AQ.Ab8...
```

---

## 6. Model ID Reference

For `generate_screen_from_text` tool:

| Model ID         | Description                           |
| ---------------- | ------------------------------------- |
| `GEMINI_3_FLASH` | Fast, cost-effective generation       |
| `GEMINI_3_1_PRO` | Higher quality, more detailed results |

---

## 7. Integration with Harness Pipeline

### When to use Stitch in the workflow

| Pipeline Phase             | Stitch Usage                                            |
| -------------------------- | ------------------------------------------------------- |
| **Product Definition**     | Generate initial screen mockups from PRD descriptions   |
| **Requirements Gathering** | Visualize UI requirements as interactive screens        |
| **Design Review**          | Generate variants for A/B design comparison             |
| **Implementation**         | Apply design systems, generate screens for new features |
| **Documentation**          | Create design system documentation from Stitch config   |

### Harness tool mapping

```
User Request → Engineer → Orchestrator → Stitch MCP (generate screens)
                                              ↓
                                         Planner (uses screens as context)
                                              ↓
                                         Implementer (codes from designs)
                                              ↓
                                         Reviewer (validates against designs)
```

### Example workflows

**Create a new screen from description:**

```
1. User: "/start-feature Create a login page with email/password"
2. Orchestrator invokes Stitch: generate_screen_from_text(projectId, "login page...")
3. Planner uses screen as design reference
4. Implementer codes the component
5. Reviewer validates code matches Stitch design
```

**Apply design system to existing screens:**

```
1. User: "/start-improvement Apply Material Design to all screens"
2. Orchestrator invokes Stitch: list_design_systems → apply_design_system
3. Planner maps design tokens to CSS variables
4. Implementer updates theme
```

---

## 8. Troubleshooting

### VS Code asks for OAuth instead of API key

**Cause:** VS Code detects the server supports OAuth and attempts it as a "more secure" fallback.

**Fix:**

- Ensure `X-Goog-Api-Key` header is configured (not `Authorization: Bearer`)
- Do NOT add `oauth` field to the server config
- Reload VS Code window after config changes (`Ctrl+Shift+P` → `Developer: Reload Window`)

### "Unauthenticated" error with OAuth

**Cause:** Access token expired (tokens last ~1 hour).

**Fix:**

```bash
TOKEN=$(gcloud auth application-default print-access-token)
# Update the Authorization header in mcp.json with the new token
```

### Tools not showing up in chat

**Cause:** Server not started or trust not confirmed.

**Fix:**

- Run `MCP: List Servers` in Command Palette
- Check server status → Start if stopped
- Confirm trust dialog if prompted
- Run `MCP: Reset Cached Tools` if tools changed

### API key not being prompted

**Cause:** Input variable already cached from a previous entry.

**Fix:**

- Run `MCP: Reset Trust` to clear cached credentials
- Restart the server in `MCP: List Servers`
