# kyo

<p align="center"><img src="static/icon.svg" width="128" height="128" alt="" /></p>

A keyboard-driven work tracking app. Three columns — Backlog, Today, Upcoming — managed entirely via
the keyboard.

## Features

- **Three-column layout**: Backlog, Today, and auto-generated Upcoming view for cards with due dates
- **Keyboard-first**: navigate, reorder, move, edit, archive, and mark done entirely via shortcuts
- **Score**: cards carried over at End of Day gain a score — backlog sorts by priority
- **Command palette** (`⌘K`): search cards by name, trigger End of Day
- **Markdown**: card content renders as rich text with preview in the editor
- **Tag autocomplete**: suggests existing tags as you type
- **SQLite** backend with versioned migrations

## Install

Using `Homebrew`:

```shell
brew tap ruaylabs/tap

brew install --cask kyo
```

## Stack

- **Frontend**: Svelte 5 + SvelteKit (SPA)
- **Backend**: Rust + Tauri 2
- **Database**: SQLite (via rusqlite + migrations)
- **Package manager**: pnpm
- **Runtime**: Node 24, pnpm (managed via mise)

## Quick start

```bash
mise trust
mise install
pnpm install
pnpm tauri dev
```

## macOS publishing

Tauri signs and notarizes the macOS bundle automatically when the following environment variables
are set:

|Variable                |Description                                          |
|------------------------|-----------------------------------------------------|
|`APPLE_SIGNING_IDENTITY`|`Developer ID Application: ...` code signing identity|
|`APPLE_ID`              |Apple ID (email) used for notarization               |
|`APPLE_PASSWORD`        |App-specific password for that Apple ID              |
|`APPLE_TEAM_ID`         |10-character Apple Developer Team ID                 |

Optional: set `APPLE_CERTIFICATE` and `APPLE_CERTIFICATE_PASSWORD` (base64-encoded `.p12` and its
password) instead of relying on a keychain-installed identity.

Build a signed and notarized release (done by the release workflow on tag push):

## Just recipes

```bash
just format          # biome + cargo fmt
just check           # format-check + lint
just tauri-dev       # pnpm tauri dev
just version         # print current version
just bump-version 0.2.0  # bump and tag a release
```
