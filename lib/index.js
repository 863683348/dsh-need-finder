/**
 * dsh-plugin-guide — a model-facing `plugin_guide` tool: requirement-driven
 * plugin discovery for DeepSeek Harness ("点菜", not "逛超市").
 *
 * Given a natural-language need, the tool ranks the curated directory
 * (lib/guide-data.json) by a local semantic score (English terms, Chinese
 * substrings, category lexicon) and returns the best matches with reasons
 * and install commands. No network, no LLM calls, no external deps.
 *
 * @module dsh-plugin-guide
 */
import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { loadPlugins, search } from "./match.js";

/** Cordis plugin name (registered with the loader). */
const name = "plugin-guide";

/** Services this plugin must resolve before it applies. */
const inject = ["tools", "systemPrompt"];

/** Composition-row configuration. */
const Config = z.object({
  /** Default result count when the model omits `limit`. */
  limit: z.number().default(5),
  /** Prompt section order (ascending; persona is 0). */
  sectionOrder: z.number().default(5),
});

/** Prompt section teaching when to use the finder. */
const GUIDE_SECTION_TEXT = "The `plugin_guide` tool is a semantic plugin finder. When the user states a capability or need in their own words — \"notify me when a task finishes\", \"抓取网页内容\", \"多会话管理\" — instead of naming a plugin, call `plugin_guide` with the user's words to discover matching dsh plugins, their reasons, and install commands. Do not translate the user's phrasing into plugin names yourself; let the tool match it.";

/**
 * Register the `plugin_guide` tool and the guidance section.
 * @param ctx - registrant context carrying `tools`, `systemPrompt`.
 * @param config - validated plugin configuration.
 */
function apply(ctx, config) {
  const plugins = loadPlugins();

  ctx.tools.register(defineTool({
    name: "plugin_guide",
    description: "Semantic plugin finder for DeepSeek Harness: given a natural-language need (not a plugin name), return the best-matching dsh plugins from a curated directory (84 plugins across 14 categories), each with a match reason and install command. Use when the user describes WHAT they want — e.g. 'notify me when a task finishes', '手机上看 DSH', '抓取网页' — rather than naming a plugin.",
    parameters: {
      need: {
        type: "string",
        required: true,
        description: "The user's requirement in natural language (English or Chinese).",
      },
      limit: {
        type: "integer",
        description: "Max results to return (1-10). Defaults to the plugin config limit.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        required: true,
        properties: {
          need: { type: "string", required: true },
          count: { type: "integer", required: true },
          results: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              required: true,
              properties: {
                name: { type: "string", required: true },
                url: { type: "string", required: true },
                category: { type: "string", required: true },
                descEn: { type: "string", required: true },
                descZh: { type: "string", required: true },
                score: { type: "integer", required: true },
                reasons: {
                  type: "array",
                  required: true,
                  items: { type: "string" },
                },
                install: { type: "string", required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => {
        const lines = ["Matched " + value.count + " plugin" + (value.count === 1 ? "" : "s") + " for: " + value.need, ""];
        for (const r of value.results) {
          lines.push("## " + r.name + " [" + r.category + "] (score " + r.score + ")");
          lines.push(r.descEn);
          if (r.descZh) lines.push(r.descZh);
          lines.push("reasons: " + r.reasons.join(", "));
          lines.push("install: " + r.install);
          lines.push("");
        }
        if (value.count === 0) lines.push("No match in the curated directory — suggest searching the dsh-plugin topic on GitHub.");
        return [{ type: "text", text: lines.join("\n").trimEnd() }];
      },
    },
    execute: async (args) => {
      const limit = Number.isInteger(args.limit) ? args.limit : config.limit;
      const results = search(args.need, plugins, limit);
      return { need: args.need, count: results.length, results };
    },
    presentCall: (args) => ({
      card: "generic",
      title: "Find plugins for: " + String(args.need).slice(0, 60),
      kind: "other",
      rawInput: args,
    }),
  }));

  ctx.effect(() => ctx.systemPrompt.section({
    name: "plugin-guide:instructions",
    order: config.sectionOrder,
    text: GUIDE_SECTION_TEXT,
  }), "plugin-guide.section()");
}

export { Config, GUIDE_SECTION_TEXT, apply, inject, name };
