# Skills

我自己的 Agent Skills 仓库。skill 按领域分类存放，每个 skill 一个独立目录，可直接被支持 `.agents/skills` 约定的 Agent（如 DeepSeek Harness、Claude Code 等）加载。

## 安装方式

**方式一：复制到用户级 skill 目录（全局可用）**

```powershell
# DeepSeek Harness / 兼容 .agents 约定的 Agent
Copy-Item "engineering\prompt-mentor" "$env:USERPROFILE\.agents\skills\prompt-mentor" -Recurse -Force
```

```bash
# macOS / Linux
cp -r engineering/prompt-mentor ~/.agents/skills/prompt-mentor
```

**方式二：复制到项目级 skill 目录（仅当前项目可用）**

```bash
cp -r engineering/prompt-mentor <项目根>/.agents/skills/prompt-mentor
```

优先级：项目级 `.dsh/skills` > 项目级 `.agents/skills` > 用户级 `~/.dsh/skills` > 用户级 `~/.agents/skills` > Agent 内置。

**方式三：稀疏检出（只要某一个 skill）**

```bash
git clone --filter=blob:none --sparse https://github.com/SkrMai/Skills.git
cd Skills && git sparse-checkout set engineering/prompt-mentor
```

> 注意：安装目标目录名必须是 **skill 名**（frontmatter 的 `name`），不是分类名。同一 skill 名在本仓库全局唯一，`scripts/validate-skills.mjs` 会强制这一点。

## Skill 清单

| 分类 | Skill | 版本 | 用途 |
|------|-------|------|------|
| engineering | [prompt-mentor](engineering/prompt-mentor/) | 0.5.1 | 需求共识导师。把模糊的项目需求澄清为原子化的需求清单，产出带可验证停止条件的共识包；用户放行后可在同一窗口切换为资深工程师角色就地执行，也可只要共识包。只读项目文档，读代码仅用于核实需求侧事实 |

## 目录结构

```text
.
├── README.md
├── CHANGELOG.md
├── .gitattributes
├── .gitignore
├── .github/workflows/validate-skills.yml
├── scripts/validate-skills.mjs       # 结构与命名校验
└── <分类>/                            # 按领域分类，如 engineering、writing、productivity
    └── <skill>/
        ├── SKILL.md                  # 主文件：角色、边界、流程、规则
        ├── references/               # 按需加载的详细清单与模板
        └── templates/                # 可选：输出模板
```

## 校验

```bash
node scripts/validate-skills.mjs
```

会检查：每个 skill 目录存在 `SKILL.md`、frontmatter 含 `name`/`version`/`description`、目录名与 `name` 一致、`version` 为语义化版本、全局无重名。CI 在每次 push 与 PR 时自动运行（`.github/workflows/validate-skills.yml`）。

## 约定

本节是仓库现行约定的**唯一权威说明**。[CHANGELOG.md](CHANGELOG.md) 末尾的「仓库（不设版本号）」分节只记录这些约定何时变过，不重复规则正文——改约定只改本节，CHANGELOG 里补一条变更记录即可。

- **分类**：一级目录是领域（`engineering` / `writing` / `productivity` …），二级是 skill 目录；最多两层，不再往下嵌套
- **命名**：skill 目录名即 skill 名，与 `SKILL.md` frontmatter 的 `name` 一致；全局唯一（装机到 `~/.agents/skills` 是平铺的，重名会互相覆盖）
- **frontmatter**：必须包含 `name`、`version`、`description`；可选 `whenToUse`
- **主文件纪律**：长清单、模板、决策树下沉到 `references/`，`SKILL.md` 只保留触发条件与规则，避免主文件膨胀
- **写法**：规则写成可判定条件（“不得…”“必须…”），不写成“要更注意…”这类劝告
- **版本**：**仓库本身不设版本号**，版本归属于单个 skill，以其 `SKILL.md` frontmatter 的 `version` 为准（遵循 [语义化版本](https://semver.org/lang/zh-CN/)）。某个 skill 的结构或内容变更记入 [CHANGELOG.md](CHANGELOG.md) 中该 skill 的小节；仓库新增 skill 时只增加这个新 skill 的版本，不动已有 skill 的版本号
- **新增 skill 的步骤**：新建 `<分类>/<skill>/SKILL.md`（含 frontmatter）→ 需要时建 `references/`、`templates/` → 跑 `node scripts/validate-skills.mjs` → 在本文件「Skill 清单」加一行 → 在 CHANGELOG 的 `## <skill 名>` 下新增该 skill 的版本小节 → 提交。**要改的文件只有这三个**：新 skill 目录、本文件清单表、CHANGELOG
