import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
export function createApi(dbPath: string, previewHost?: string) {
 const db = new DatabaseSync(dbPath);
 db.exec('CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT NOT NULL, place TEXT NOT NULL, body TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)');
 const send = (res: ServerResponse, status: number, value: unknown) => {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 async function handle(req: IncomingMessage, res: ServerResponse) {
  if (!req.url?.startsWith('/api/')) return false;
  const host=req.headers.host || '';
  if ((!/^(localhost|127\.0\.0\.1):\d+$/.test(host) && host!==previewHost) || (req.headers.origin && req.headers.origin !== `http://${host}`)) {send(res,403,{error:'Forbidden origin'});return true;}
  const path=req.url.split('?')[0], match=/^\/api\/notes\/([\w-]+)$/.exec(path);
  try {
   if(path==='/api/notes' && req.method==='GET'){send(res,200,db.prepare('SELECT * FROM notes ORDER BY updatedAt DESC, id').all());return true;}
   if(match && req.method==='DELETE'){const out=db.prepare('DELETE FROM notes WHERE id=?').run(match[1]);send(res,out.changes?200:404,out.changes?{ok:true}:{error:'Not found'});return true;}
   if((path==='/api/notes' && req.method==='POST') || (match && req.method==='PUT')){
    if(!req.headers['content-type']?.startsWith('application/json')){send(res,415,{error:'JSON required'});return true;}
    let raw='', size=0; for await(const chunk of req){size+=chunk.length;if(size>16384){send(res,413,{error:'Too large'});return true;}raw+=chunk;}
    let value;try{value=JSON.parse(raw);}catch{send(res,400,{error:'Invalid JSON'});return true;}
    if(!value || typeof value!=='object' || Array.isArray(value)){send(res,400,{error:'Invalid note'});return true;}
    const {title,place,body,lat,lng}=value;
    if(typeof title!=='string'||!title.trim()||title.length>80||typeof place!=='string'||!place.trim()||place.length>120||typeof body!=='string'||body.length>2000||typeof lat!=='number'||!Number.isFinite(lat)||Math.abs(lat)>90||typeof lng!=='number'||!Number.isFinite(lng)||Math.abs(lng)>180){send(res,400,{error:'Invalid note'});return true;}
    const now=new Date().toISOString(); const id=match?.[1] || randomUUID();
    if(match){const out=db.prepare('UPDATE notes SET title=?,place=?,body=?,lat=?,lng=?,updatedAt=? WHERE id=?').run(title.trim(),place.trim(),body,lat,lng,now,id);if(!out.changes){send(res,404,{error:'Not found'});return true;}}
    else db.prepare('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?)').run(id,title.trim(),place.trim(),body,lat,lng,now,now);
    send(res,match?200:201,db.prepare('SELECT * FROM notes WHERE id=?').get(id));return true;
   }
   send(res,404,{error:'Not found'});
  }catch(error){console.error('Note API failure',error instanceof Error?error.name:'Error');send(res,500,{error:'Storage unavailable'});}
  return true;
 }
 return {handle,close:()=>db.close()};
}
