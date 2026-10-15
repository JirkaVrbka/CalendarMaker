#!/usr/bin/env node
// PreToolUse / Write|Edit|MultiEdit — block the FIRST *code* edit of a session until aligned.
// Non-code files (docs/config/.claude) pass through. Once per session. Cross-platform (Node).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const filePath = input?.tool_input?.file_path ?? '';
const sid = input?.session_id ?? 'nosid';
if (!filePath) process.exit(0);

const p = filePath.replace(/\\/g, '/').toLowerCase();
const passThrough =
  /\.(md|json|ya?ml|toml|ini|cfg)$/.test(p) ||
  /\/(docs|\.claude|\.agents|\.scratch)\//.test(p) ||
  /(^|\/)(claude\.md|context\.md|readme[^/]*|\.gitignore)$/.test(p);
if (passThrough) process.exit(0);

const markerDir = path.join(tmpdir(), 'claude-alignment-gate');
const marker = path.join(markerDir, sid.replace(/[^A-Za-z0-9_-]/g, '_'));
try { mkdirSync(markerDir, { recursive: true }); } catch {}

if (existsSync(marker)) process.exit(0); // already aligned this session

try { writeFileSync(marker, ''); } catch {}
process.stderr.write(
  'BLOCKED: first code edit of the session before alignment.\n' +
  "Instead: confirm the task's intent, acceptance criteria, and approach with the user first\n" +
  "(a quick 'grill me on this plan' works). This gate fires only once per session.\n"
);
process.exit(2);
