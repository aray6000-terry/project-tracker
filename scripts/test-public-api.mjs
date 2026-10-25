import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';
const module={exports:{}};const code=ts.transpileModule(fs.readFileSync('app/api/state/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(code,{module,exports:module.exports,require:()=>({json:(data,status)=>Response.json(data,{status})})});
assert.equal((await module.exports.GET()).status,401);assert.equal((await module.exports.PUT()).status,410);console.log('PASS retired public/bulk endpoint refuses real project access and writes');
