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

## License

MIT