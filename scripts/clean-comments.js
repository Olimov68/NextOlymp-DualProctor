import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function stripAstComments(sourceCode, filePath) {
  const isJsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');

  let code = sourceCode;

  if (isJsx) {
    code = code.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const ranges = [];
  function scan(node) {
    const text = sourceFile.text;
    const leading = ts.getLeadingCommentRanges(text, node.pos) || [];
    const trailing = ts.getTrailingCommentRanges(text, node.end) || [];
    for (const r of leading) ranges.push(r);
    for (const r of trailing) ranges.push(r);
    ts.forEachChild(node, scan);
  }
  scan(sourceFile);

  const unique = [];
  const seen = new Set();
  for (const r of ranges) {
    const key = r.pos + '-' + r.end;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  unique.sort((a, b) => b.pos - a.pos);

  let result = code;
  for (const r of unique) {
    result = result.slice(0, r.pos) + result.slice(r.end);
  }

  return result.replace(/\n{3,}/g, '\n\n');
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n');
}

function stripSqlComments(sql) {
  return sql
    .replace(/--[^\r\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n{3,}/g, '\n\n');
}

function stripPhpComments(php) {
  return php
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(?<!:)\/\/[^\r\n]*/g, '')
    .replace(/(?<!\\)#[^\r\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== '.gemini') {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const original = fs.readFileSync(fullPath, 'utf8');
        const stripped = stripAstComments(original, fullPath);
        if (stripped !== original) {
          fs.writeFileSync(fullPath, stripped, 'utf8');
          console.log(`Cleaned TS/JS: ${path.relative(rootDir, fullPath)}`);
        }
      } else if (ext === '.css') {
        const original = fs.readFileSync(fullPath, 'utf8');
        const stripped = stripCssComments(original);
        if (stripped !== original) {
          fs.writeFileSync(fullPath, stripped, 'utf8');
          console.log(`Cleaned CSS: ${path.relative(rootDir, fullPath)}`);
        }
      } else if (ext === '.sql') {
        const original = fs.readFileSync(fullPath, 'utf8');
        const stripped = stripSqlComments(original);
        if (stripped !== original) {
          fs.writeFileSync(fullPath, stripped, 'utf8');
          console.log(`Cleaned SQL: ${path.relative(rootDir, fullPath)}`);
        }
      } else if (ext === '.php') {
        const original = fs.readFileSync(fullPath, 'utf8');
        const stripped = stripPhpComments(original);
        if (stripped !== original) {
          fs.writeFileSync(fullPath, stripped, 'utf8');
          console.log(`Cleaned PHP: ${path.relative(rootDir, fullPath)}`);
        }
      }
    }
  }
}

console.log('--- Cleaning comments from src/ ---');
processDirectory(path.join(rootDir, 'src'));

console.log('--- Cleaning comments from server/ ---');
processDirectory(path.join(rootDir, 'server'));

console.log('--- Cleaning comments from public/api/ ---');
processDirectory(path.join(rootDir, 'public', 'api'));

console.log('--- Cleaning comments from scripts/ ---');
processDirectory(path.join(rootDir, 'scripts'));

const sqlFile = path.join(rootDir, 'database.sql');
if (fs.existsSync(sqlFile)) {
  const original = fs.readFileSync(sqlFile, 'utf8');
  const stripped = stripSqlComments(original);
  if (stripped !== original) {
    fs.writeFileSync(sqlFile, stripped, 'utf8');
    console.log(`Cleaned: database.sql`);
  }
}

console.log('--- Comment cleanup complete! ---');
