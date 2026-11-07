import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApi} from '../server/api';
import {appendFix,EMPTY,parseTrail,totalDistance,toGpx,type Fix} from '../src/tracking';
const fix=(lat:number,time:number,accuracy=5):Fix=>({lat,lng:126.984,time,accuracy});
test('walking filters, segments, restoration and GPX preserve real accepted paths',()=>{
 const a=fix(37.574,1700000000000),b=fix(37.5742,a.time+10000);
 let t=appendFix(EMPTY,a);assert.equal(t.segments[0].length,1);
 assert.equal(appendFix(t,fix(37.57401,a.time+1000)),t);
 assert.equal(appendFix(t,fix(37.58,a.time+1000)),t);
 assert.equal(appendFix(t,fix(37.5742,a.time+10000,150)),t);
 t=appendFix(t,b);assert.ok(totalDistance(t)>20&&totalDistance(t)<24);
 t=appendFix(t,fix(37.58,a.time+200000));assert.equal(t.segments.length,2);
 assert.ok(totalDistance(t)<24,'must not draw distance across a GPS interruption');
 assert.deepEqual(parseTrail(JSON.stringify(t)),t);assert.throws(()=>parseTrail('{bad'));
 assert.throws(()=>parseTrail('{"version":1,"segments":[[{}]]}'));
 assert.equal((toGpx(t).match(/<trkseg>/g)||[]).length,2);
});
test('SQLite API: CRUD, persistence, validation, injection strings and cross-origin rejection',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'giloa-test-')),path=join(dir,'notes.sqlite');let api=createApi(path);
 const server=createServer(async(req,res)=>{if(!await api.handle(req,res)){res.writeHead(404);res.end();}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const addr=server.address();assert.ok(addr&&typeof addr==='object');const base=`http://127.0.0.1:${addr.port}`;
 const data={title:"A ' ; DROP TABLE notes;--",place:'북촌',body:'<script>alert(1)</script>',lat:37.58,lng:126.98};
 const write=(route:string,method:string,value:unknown,origin?:string)=>fetch(base+route,{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(value)});
 try{
  assert.equal((await write('/api/notes','POST',data,'https://evil.example')).status,403);
  assert.equal((await write('/api/notes','POST',{...data,lat:91})).status,400);
  assert.equal((await write('/api/notes','POST',{...data,title:'  '})).status,400);
  assert.equal((await write('/api/notes','POST',null)).status,400);
  const response=await write('/api/notes','POST',data);assert.equal(response.status,201);const n=await response.json() as {id:string;title:string};assert.equal(n.title,data.title);
  api.close();api=createApi(path);const list=await (await fetch(base+'/api/notes')).json() as unknown[];assert.equal(list.length,1);
  const changed=await write('/api/notes/'+n.id,'PUT',{...data,title:'수정한 기억'});assert.equal(changed.status,200);assert.equal((await changed.json() as {title:string}).title,'수정한 기억');
  assert.equal((await fetch(base+'/api/notes/'+n.id,{method:'DELETE'})).status,200);
  assert.equal((await write('/api/notes/'+n.id,'PUT',data)).status,404);
  assert.deepEqual(await (await fetch(base+'/api/notes')).json(),[]);
 }finally{await new Promise<void>(r=>server.close(()=>r()));api.close();rmSync(dir,{recursive:true,force:true});}
});
