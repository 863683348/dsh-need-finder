/**
 * dsh-need-finder — demo: run a few requirement searches.
 * Run: node scripts/demo.mjs
 */
import { loadPlugins, search } from "../lib/match.js";

const plugins = loadPlugins();
const needs = [
  "任务完成时通知我",
  "手机上看 DSH 界面",
  "notify me when a task finishes",
  "抓取网页内容",
];
for (const need of needs) {
  console.log("\n== " + need + " ==");
  const results = search(need, plugins, 3);
  for (const r of results) {
    console.log("- " + r.name + " [" + r.category + "] score " + r.score + " | " + r.descEn.slice(0, 80));
  }
}
