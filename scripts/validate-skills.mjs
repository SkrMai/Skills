#!/usr/bin/env node
// 校验本仓库的 skill 目录结构、frontmatter 必填字段、目录名一致性与全局重名。
// 零依赖，只用 Node 内置模块。用法：node scripts/validate-skills.mjs

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const IGNORED_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts', 'templates', 'assets'])
const MAX_SKILL_DEPTH = 2

async function findSkillFiles(dir, depth = 0, acc = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue
    const child = join(dir, entry.name)
    const childDepth = depth + 1
    if (childDepth > MAX_SKILL_DEPTH) continue
    const files = await readdir(child).catch(() => [])
    if (files.includes('SKILL.md')) acc.push(join(child, 'SKILL.md'))
    else await findSkillFiles(child, childDepth, acc)
  }
  return acc
}

/** 极简 YAML frontmatter 解析：只取顶层标量键值，不处理嵌套结构与多行标量。 */
function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (match === null) return null
  const data = {}
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue
    const kv = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line)
    if (kv === null) continue
    let value = kv[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1)
    }
    data[kv[1]] = value
  }
  return data
}

function isInsideRoot(dir) {
  return dir !== repoRoot && !dir.startsWith(repoRoot + sep)
}

const skillFiles = (await findSkillFiles(repoRoot)).sort()
const problems = []
const skills = []

for (const file of skillFiles) {
  const dir = file.slice(0, -'SKILL.md'.length - 1)
  const relDir = relative(repoRoot, dir).split(sep).join('/')
  const leaf = relDir.split('/').pop()
  const segments = relDir.split('/')
  const text = await readFile(file, 'utf8')
  const data = parseFrontmatter(text)

  if (data === null) {
    problems.push(`${relDir}: SKILL.md 缺少 YAML frontmatter`)
    continue
  }

  for (const field of ['name', 'version', 'description']) {
    if (data[field] === undefined || data[field] === '') {
      problems.push(`${relDir}: frontmatter 缺少必填字段 ${field}`)
    }
  }

  if (data.name !== undefined && data.name !== leaf) {
    problems.push(`${relDir}: 目录名 "${leaf}" 与 frontmatter name "${data.name}" 不一致`)
  }

  if (data.version !== undefined && !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(data.version)) {
    problems.push(`${relDir}: version "${data.version}" 不是语义化版本（期望 x.y.z）`)
  }

  if (!isInsideRoot(dir)) {
    problems.push(`${relDir}: skill 目录超出仓库范围`)
  }

  skills.push({
    name: data.name ?? leaf,
    version: data.version ?? '?',
    category: segments.length === MAX_SKILL_DEPTH ? segments[0] : '(未分类)',
    relDir,
  })
}

const byName = new Map()
for (const skill of skills) {
  const existing = byName.get(skill.name)
  if (existing !== undefined) {
    problems.push(`skill 名 "${skill.name}" 重复：${existing} / ${skill.relDir}（装机到 ~/.agents/skills 时会互相覆盖）`)
  } else {
    byName.set(skill.name, skill.relDir)
  }
}

skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
const nameWidth = Math.max(4, ...skills.map(s => s.name.length))
const versionWidth = Math.max(7, ...skills.map(s => s.version.length))

console.log('已发现的 skill：')
if (skills.length === 0) console.log('  （无）')
for (const skill of skills) {
  console.log(`  ${skill.category.padEnd(12)} ${skill.name.padEnd(nameWidth)}  v${skill.version.padEnd(versionWidth)}  ${skill.relDir}`)
}

console.log('')
if (problems.length > 0) {
  console.error(`✗ 校验失败，发现 ${problems.length} 个问题：`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`✓ 校验通过：${skills.length} 个 skill，结构、frontmatter 与命名均合规。`)
