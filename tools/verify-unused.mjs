// Better verifier: distinguish (declaration only) vs (used internally) vs (used externally)
import { execSync } from 'child_process';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('unused-trim.json', 'utf8'));
const SEARCH_DIRS = ['app', 'components', 'contexts', 'hooks', 'lib', 'tests', 'types'];

function findRefs(name) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-ChildItem -Recurse -Path ${SEARCH_DIRS.join(',')} -Include *.ts,*.tsx | Select-String -Pattern '\\b${name}\\b' | ForEach-Object { $_.Path + '|' + $_.LineNumber }"`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return out.split('\n').filter(Boolean).map((l) => {
      const [file, line] = l.split('|');
      return { file: file.replace(/\\/g, '/').toLowerCase(), line: Number(line) };
    });
  } catch (e) {
    return [];
  }
}

const verified = {};
for (const [file, names] of Object.entries(data)) {
  const declFile = file.replace(/\\/g, '/').toLowerCase();
  const results = [];
  for (const name of names) {
    const refs = findRefs(name);
    const inDecl = refs.filter((r) => r.file.endsWith(declFile));
    const external = refs.filter((r) => !r.file.endsWith(declFile));
    let category;
    if (external.length > 0) category = 'EXTERNAL_USED';
    else if (inDecl.length > 1) category = 'INTERNAL_ONLY';
    else category = 'TRULY_UNUSED';
    results.push({ name, internalRefs: inDecl.length, externalRefs: external.length, category, externalSample: external.slice(0, 2).map(r=>r.file) });
  }
  verified[file] = results;
}

fs.writeFileSync('verify-results.json', JSON.stringify(verified, null, 2));

let truly = 0, internal = 0, external = 0;
for (const items of Object.values(verified)) {
  for (const i of items) {
    if (i.category === 'TRULY_UNUSED') truly++;
    else if (i.category === 'INTERNAL_ONLY') internal++;
    else external++;
  }
}
console.log(`TRULY_UNUSED (delete): ${truly}`);
console.log(`INTERNAL_ONLY (drop export keyword): ${internal}`);
console.log(`EXTERNAL_USED (false positive, keep): ${external}`);
