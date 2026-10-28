// The release is native ESM in dist/, not a transpiled bundle. Validate exactly
// the files served in production rather than generating a second asset tree.
import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve('dist');
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);out.push(...(e.isDirectory()?await walk(p):[p]));}return out;}
const files=await walk(root);let references=0;
for(const file of [...files,...await walk(resolve('server'))]){
 if(extname(file)==='.js'){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
 const type=extname(file);if(!['.js','.html','.css'].includes(type))continue;
 const text=await readFile(file,'utf8'),patterns=type==='.js'?[/\bfrom\s*['"](\.[^'"]+)['"]/g]:type==='.html'?[/\b(?:src|href)=["']([^"']+)["']/g]:[/url\(['"]?([^'"\)]+)['"]?\)/g];
 for(const pattern of patterns)for(const m of text.matchAll(pattern)){const ref=m[1];if(/^(?:https?:|data:|#|\/)/.test(ref))continue;const target=resolve(dirname(file),ref.split(/[?#]/)[0]);if(!(await stat(target)).isFile())throw Error('Missing asset: '+target);references++;}
}
console.log(`Production assets verified: ${files.length} files, ${references} local references; runtime syntax passed.`);
