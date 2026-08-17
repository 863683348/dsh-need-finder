# dsh-need-finder — 需求型插件导购 (Requirement-driven plugin guide)

**"点菜，不是逛超市。"** 现有 DSH 插件市场都是按名称/分类浏览；本插件让 agent 直接听懂你的**需求**，从精选目录里语义匹配最合适的插件，给出匹配理由和安装命令。

## 为什么需要它

- 用户说的是**任务**（"任务完成通知我"、"手机上看 DSH"、"抓取网页内容"），不是插件名。
- `plugin_guide` 用本地语义评分（英文词 + 中文子串 + 分类词典）在 84 个精选插件（覆盖 14 个分类）中匹配，**零网络、零 LLM 调用、零外部依赖**。
- 输出即"点菜单"：插件名、分类、双语描述、匹配理由、`dsh plugin add` 安装命令。

## 安装

```bash
dsh plugin --profile <profile> add dsh-need-finder     # npm 发布后
# 或本地：dsh plugin --profile <profile> add <本目录>
```

## 用法（模型侧）

工具 `plugin_guide`：

| 参数 | 说明 |
| --- | --- |
| `need`（必填） | 自然语言需求，中英文皆可，如 `notify me when a task finishes`、`抓取网页` |
| `limit`（可选） | 返回条数 1-10，默认 5 |

示例需求与命中分类：

| 需求 | 命中分类 |
| --- | --- |
| "任务完成时通知我" / "notify when done" | `notify` |
| "记不住上下文，换个会话就忘了" | `memory` |
| "在手机上远程看 DSH" | `ui` / `usage` |
| "抓取网页/截图给 agent 看" | `vision` |
| "多会话管理/状态切换" | `session` |
| "检查插件安全性" | `dev` |

插件还会注入 `plugin-guide:instructions` 提示词段落，教 agent 在用户描述需求而非插件名时调用本工具。

## 目录

内置精选目录 `lib/guide-data.json`：84 个真实插件，从 awesome-dsh-plugin 的 1019 个条目按分类均匀采样生成，含双语描述与标签。可按需增删（纯数据文件，改完即生效）。

## 设计

- **纯逻辑分离**：`lib/match.js` 零依赖（分词/评分/排序），`lib/guide-data.json` 纯数据，`lib/index.js` 才是 Cordis 插件。
- **评分**：名称命中 +3、标签命中 +2、描述命中 +1；中文 2-gram 子串匹配；分类词典兜底。
- **安全**：无网络请求、无文件写入、无 secrets。

## 测试

```bash
node test/match.test.mjs
```


## Recipes — 插件界的 dotfiles

从"装单个"到"装环境"：`recipe` 工具内置 8 个社区配方（JSON：插件清单 + 安装顺序 + 配置说明），一键生成整套有序安装计划：

| id | 套装 |
| --- | --- |
| `notify-suite` | 通知全家桶 |
| `security-audit` | 安全审计套装 |
| `remote-mobile` | 移动远程套装 |
| `dev-tools` | 开发效率套装 |
| `memory-set` | 记忆与上下文套装 |
| `im-bridge` | IM 桥接（三选一） |
| `vision-lab` | 视觉实验室 |
| `research-stack` | 浏览器研究环境 |

`recipe action=list` 看全部；`recipe action=search need="手机远程"` 按需求找配方；`recipe action=apply id=notify-suite` 输出按依赖顺序排列的 `dsh plugin add` 命令（DAG 友好，可被工作流/编排引擎消费）。配方数据在 `lib/recipes.json`，可自行增删。

## Relationship to dsh-recipe

This plugin bundles 8 curated recipes (guide-first). If you want a dedicated recipe tool (list/search/apply/compose custom environments), install [dsh-recipe](https://github.com/863683348/dsh-recipe) separately (`dsh plugin add dsh-recipe`). The two complement each other.

## License

MIT