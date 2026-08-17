/**
 * dsh-plugin-guide — requirement-driven plugin discovery for DeepSeek Harness
 * ("点菜", not "逛超市"): the `plugin_guide` tool matches natural-language
 * needs to a curated plugin directory, and the `recipe` tool installs whole
 * environments ("插件界的 dotfiles") from bundled community recipes with
 * ordered install plans. No network, no LLM calls, no external deps.
 *
 * @module dsh-plugin-guide
 */
import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { loadPlugins, search } from "./match.js";
import { loadRecipes, installPlan, renderRecipe, searchRecipes, validateAll } from "./recipe.js";

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
const GUIDE_SECTION_TEXT = "The `plugin_guide` tool is a semantic plugin finder: when the user states a capability or need in their own words — \"notify me when a task finishes\", \"抓取网页内容\", \"多会话管理\" — instead of naming a plugin, call `plugin_guide` to discover matching dsh plugins with reasons and install commands.\n\nThe `recipe` tool installs whole environments instead of single plugins: call `recipe action=list` or `recipe action=search need=<user words>` when the user asks for a bundle/环境/套装/整套; then `recipe action=get id=<id>` for details or `recipe action=apply id=<id>` for the ordered install plan. Do not translate the user's phrasing into plugin names yourself; let the tools match.";

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

  const recipes = loadRecipes();
  const recipeProblems = validateAll(recipes);
  if (!recipeProblems.valid) {
    ctx.root?.logger?.("plugin-guide").warn("recipe validation failed: " + JSON.stringify(recipeProblems.problems));
  }

  ctx.tools.register(defineTool({
    name: "recipe",
    description: "Bundle installer for DeepSeek Harness ('插件界的 dotfiles'): list, search, inspect, or get the ordered install plan for community plugin recipes (environments like 通知全家桶, 安全审计套装, 移动远程套装). Use when the user wants a whole environment/setup/套装/环境 rather than a single plugin.",
    parameters: {
      action: {
        type: "string",
        required: true,
        enum: ["list", "search", "get", "apply"],
        description: "list = all recipes; search = match recipes to a need; get = recipe details; apply = ordered install plan.",
      },
      need: {
        type: "string",
        description: "Natural-language need, required for action=search (e.g. '手机远程访问', '安全审计').",
      },
      id: {
        type: "string",
        description: "Recipe id, required for action=get and action=apply.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        required: true,
        properties: {
          action: { type: "string", required: true },
          count: { type: "integer", required: true },
          recipes: {
            type: "array",
            required: true,
            items: {
              type: "object",
              additionalProperties: false,
              required: true,
              properties: {
                id: { type: "string", required: true },
                name: { type: "string", required: true },
                nameEn: { type: "string", required: true },
                description: { type: "string", required: true },
                descriptionEn: { type: "string", required: true },
                exclusive: { type: "boolean", required: true },
                steps: {
                  type: "array",
                  required: true,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: true,
                    properties: {
                      name: { type: "string", required: true },
                      install: { type: "string", required: true },
                      required: { type: "boolean", required: true },
                      order: { type: "integer", required: true },
                    },
                  },
                },
                notes: { type: "string", required: true },
              },
            },
          },
        },
      },
      render: (_args, value) => {
        const lines = ["Recipe " + value.action + ": " + value.count + " result" + (value.count === 1 ? "" : "s"), ""];
        for (const rc of value.recipes) {
          lines.push(renderRecipe({
            id: rc.id, name: rc.name, nameEn: rc.nameEn,
            description: rc.description, descriptionEn: rc.descriptionEn,
            exclusive: rc.exclusive, notes: rc.notes,
            plugins: rc.steps.map((s) => ({ name: s.name, order: s.order, required: s.required })),
          }));
          lines.push("");
        }
        return [{ type: "text", text: lines.join("\n").trimEnd() }];
      },
    },
    execute: async (args) => {
      const { action } = args;
      const rec = recipes.find((r) => r.id === args.id);
      if (action === "get" || action === "apply") {
        if (!rec) throw new Error('recipe: unknown id "' + args.id + '" — call list or search first');
      }
      let out = [];
      if (action === "list") {
        out = recipes.map((r) => ({ ...recipeBrief(r), steps: installPlan(r).steps, notes: r.notes ?? "" }));
      } else if (action === "search") {
        out = searchRecipes(args.need ?? "", recipes).map(({ recipe: r }) => ({ ...recipeBrief(r), steps: installPlan(r).steps, notes: r.notes ?? "" }));
      } else {
        const r = rec;
        out = [{ ...recipeBrief(r), steps: installPlan(r).steps, notes: r.notes ?? "" }];
      }
      return { action, count: out.length, recipes: out };
    },
    presentCall: (args) => ({
      card: "generic",
      title: "Recipe " + String(args.action) + (args.id ? ": " + args.id : ""),
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

/** Compact recipe summary used by the tool output. */
function recipeBrief(r) {
  return {
    id: r.id,
    name: r.name,
    nameEn: r.nameEn,
    description: r.description,
    descriptionEn: r.descriptionEn,
    exclusive: r.exclusive === true,
  };
}

export { Config, GUIDE_SECTION_TEXT, apply, inject, name };