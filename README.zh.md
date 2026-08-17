# dsh-need-finder — 需求型插件导购

**"点菜，不是逛超市。"** 现有 DSH 插件市场都是按名称/分类浏览；本插件让 agent 直接听懂你的**需求**，从精选目录里语义匹配最合适的插件，给出匹配理由和安装命令。

## 为什么需要它

- 用户说"任务完成通知我"、"手机上看 DSH"、"抓取网页内容"——是**需求**，不是插件名。
- `plugin_guide` 本地语义评分（英文词 + 中文子串 + 分类词典），在 84 个精选插件（14 分类）中匹配，**零网络、零 LLM 调用、零依赖**。
- 输出即"点菜单"：插件名、分类、双语描述、匹配理由、`dsh plugin add` 命令。

## 安装

```bash
dsh plugin --profile <profile名> add dsh-need-finder
```

## 用法

| 参数 | 说明 |
| --- | --- |
| `need`（必填） | 自然语言需求，中英文皆可 |
| `limit`（可选） | 返回条数 1-10，默认 5 |

示例："任务完成时通知我"→`notify`；"记不住上下文"→`memory`；"手机远程看 DSH"→`ui`/`usage`；"抓取网页截图"→`vision`；"检查插件安全"→`dev`。

## 设计

- `lib/match.js` 纯逻辑零依赖；`lib/guide-data.json` 纯数据（84 个真实插件，从 awesome-dsh-plugin 1019 条按分类采样）；`lib/index.js` Cordis 插件。
- 评分：名称 +3 / 标签 +2 / 描述 +1；中文 2-gram；分类词典兜底。
- 安全：无网络、无写入、无 secrets。


## 配方 —— 插件界的 dotfiles

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

## License

MIT