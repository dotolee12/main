import {readFileSync,writeFileSync,existsSync} from 'node:fs';
if(!existsSync('.env.local')){
 let source='';try{source=readFileSync('../config.js','utf8');}catch{}
 const key=/window\.GILOA_CARTO_BASEMAP_KEY\s*=\s*["']([^"']+)["']/.exec(source)?.[1];
 if(key){writeFileSync('.env.local','VITE_CARTO_BASEMAP_KEY='+JSON.stringify(key)+'\n',{mode:0o600});console.log('Using the existing GILOA browser map key.');}
 else console.log('Map key missing: set VITE_CARTO_BASEMAP_KEY in .env.local.');
}
