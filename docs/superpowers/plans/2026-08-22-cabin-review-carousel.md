# Cabin Review Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full reviews page with a reusable per-cabin carousel widget and export six Lodgify Raw HTML snippets.

**Architecture:** Pure helpers drive index wrap and auto-advance rules. An Angular `ReviewCarousel` takes a cabin slug. `/preview/reviews` hosts six carousels (one visible). Export cuts each `[data-rr-host]` block into its own HTML file with vanilla rotate/modal script.

**Tech Stack:** Angular 21 standalone components, Vitest, existing Lodgify flatten/export pipeline.

## Global Constraints

- Auto-advance every **20 seconds**
- Pause on hover, modal open, or `document.hidden`
- `prefers-reduced-motion: reduce` disables auto-advance
- One card at a time; Show all opens a `role="dialog"` modal
- Six paste files, one cabin each; avatars inlined as JPEG data URIs
- No Footer injector; no Airbnb screenshots on the site
- Unknown/empty slug renders nothing

---
