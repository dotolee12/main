const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','parking-ocr.js'),'utf8');
function setup(Tesseract){const context={window:{Tesseract},setTimeout,clearTimeout,URL};vm.runInNewContext(source,context);return context.window.GiloaParkingOcr;}
test('extracts floor and pillar without confusing B3 with a zone or B-203 with a floor',()=>{
 const api=setup();
 for(const [text,floor,zone] of [['B3\nC-17','B3','C-17'],['지하 2층\nA 112','B2','A-112'],['5F\nC17','5F','C-17'],['B-203','','B-203'],['B3','B3',''],['구역 108','','108'],['주차 요금 1000원','',''],['','', '']]){
  const result=api.parse(text);assert.equal(result.floor,floor,text);assert.equal(result.zone,zone,text);
 }
});
test('worker receives transient blob, disables IndexedDB cache, and terminates after recognition',async()=>{
 let opts,language,input,stopped=0;const blob={type:'image/jpeg'};
 const api=setup({createWorker:async(lang,_,options)=>{language=lang;opts=options;return {recognize:async value=>{input=value;return {data:{text:'B3\nC-17'}};},terminate:async()=>{stopped++;}};}});
 const result=await api.recognize(blob).promise;assert.equal(result.floor,'B3');assert.equal(input,blob);assert.equal(language,'kor+eng');assert.equal(opts.cacheMethod,'none');assert.equal(stopped,1);
});
test('cancelling during worker creation terminates it before any image recognition',async()=>{
 let create,reads=0,stopped=0;
 const api=setup({createWorker:()=>new Promise(r=>create=r)});const task=api.recognize({});await Promise.resolve();task.cancel();
 create({recognize:()=>{reads++;},terminate:async()=>stopped++});await assert.rejects(task.promise,/cancelled/);assert.equal(reads,0);assert.equal(stopped,1);
});
