import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createApi } from './api';
const production=process.argv.includes('--production');
const portArg=process.argv.indexOf('--port'),hostArg=process.argv.indexOf('--host');
const port=portArg>=0?Number(process.argv[portArg+1]):5173;
const host=hostArg>=0?process.argv[hostArg+1]:'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
mkdirSync('data',{recursive:true});
const api=createApi(resolve('data/notes.sqlite'),host==='0.0.0.0'?`terminal.local:${port}`:undefined);
const vite=production?null:await (await import('vite')).createServer({server:{middlewareMode:true,allowedHosts:host==='0.0.0.0'?['terminal.local']:undefined},appType:'spa'});
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 if(await api.handle(req,res)) return;
 if(vite){vite.middlewares(req,res);return;}
 try{const pathname=decodeURIComponent((req.url||'/').split('?')[0]);const file=resolve('dist',pathname==='/'?'index.html':'.'+pathname);if(!file.startsWith(resolve('dist')+'/')){res.writeHead(403);res.end();return;}const data=readFileSync(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,host,()=>console.log(`GILOA React Lab: http://${host}:${port}`));
for(const sig of ['SIGINT','SIGTERM'] as const)process.on(sig,()=>server.close(async()=>{await vite?.close();api.close();process.exit(0);}));
