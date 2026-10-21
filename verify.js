#!/usr/bin/env node
/**
 * 旗舰 AI 锻造闭环 · 一键聚合自检
 * 通过 git submodule 引用三件实物，依次运行各自的自检并汇总战绩。
 * 用法：node verify.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const nodeBin = process.execPath; // 使用当前运行的同一 node

const REPOS = [
  { name: 'flagship-algo-forge',  label: '算法工具库',   file: 'flagship-algo-forge/apex-forge.js' },
  { name: 'flagship-transformer', label: 'Transformer 参考实现 + 基准', file: 'flagship-transformer/apex-transformer.js' },
  { name: 'flagship-rag-engine',  label: '推理引擎 + RAG', file: 'flagship-rag-engine/apex-engine.js' },
];

let allPass = true;
const summary = [];

for (const r of REPOS) {
  const abs = path.resolve(__dirname, r.file);
  process.stdout.write(`\n▶ 运行 ${r.name} (${r.label}) ... `);
  let out = '';
  let code = 0;
  try {
    out = execFileSync(nodeBin, [abs], { encoding: 'utf8', timeout: 420000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    code = e.status || 1;
    out = (e.stdout || '') + '\n' + (e.stderr || '');
  }
  const passCount = (out.match(/✅/g) || []).length;
  const failCount = (out.match(/❌/g) || []).length;
  const ok = code === 0 && failCount === 0;
  if (!ok) allPass = false;
  summary.push({ ...r, passCount, failCount, ok });
  console.log(ok ? `[PASS] ${passCount}/${passCount + failCount} 全绿` : `[FAIL] ${passCount} 通过 / ${failCount} 失败`);
  out.split('\n')
    .filter((l) => l.includes('✅') || l.includes('❌') || l.includes('结果'))
    .forEach((l) => console.log('   ' + l.trim()));
}

console.log('\n================ 旗舰闭环总战绩 ================');
summary.forEach((s) =>
  console.log(`${s.ok ? '[PASS]' : '[FAIL]'} ${s.name.padEnd(24)} ${s.label.padEnd(26)} ${s.passCount}/${s.passCount + s.failCount}`)
);
console.log('==============================================');
console.log(allPass ? '\n[PASS] 三件实物全部自检通过 · 闭环可复现 · 作者：晨星' : '\n[FAIL] 存在未通过项，请检查上方明细');
process.exit(allPass ? 0 : 1);
