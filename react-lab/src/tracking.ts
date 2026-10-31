export type Fix={lat:number;lng:number;accuracy:number;time:number};
export type Trail={version:1;segments:Fix[][]};
export const TRACK_KEY='giloa-react-lab-trail-v1';
export const EMPTY:Trail={version:1,segments:[]};
export function distance(a:Fix,b:Fix){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function validFix(p:unknown):p is Fix{if(!p||typeof p!=='object')return false;const f=p as Fix;return [f.lat,f.lng,f.accuracy,f.time].every(Number.isFinite)&&Math.abs(f.lat)<=90&&Math.abs(f.lng)<=180&&f.accuracy>=0&&f.accuracy<=100&&f.time>0;}
export function parseTrail(raw:string|null):Trail{if(raw===null)return {version:1,segments:[]};const v=JSON.parse(raw);if(v?.version!==1||!Array.isArray(v.segments)||!v.segments.every((s:unknown)=>Array.isArray(s)&&s.every(validFix)))throw new Error('Invalid trail');return v;}
export function appendFix(trail:Trail,fix:Fix):Trail{if(!validFix(fix))return trail;const segments=trail.segments.length?trail.segments:[[]];const last=segments.at(-1)!;const prev=last.at(-1);if(prev){const dt=(fix.time-prev.time)/1000,d=distance(prev,fix);if(dt<=0)return trail;if(dt>120)return {...trail,segments:[...segments,[fix]]};if(d/dt>(dt<60?8.5:15)||d<15)return trail;}return {...trail,segments:[...segments.slice(0,-1),[...last,fix]]};}
export function totalDistance(t:Trail){return t.segments.reduce((total,s)=>total+s.reduce((d,p,i)=>i?d+distance(s[i-1],p):d,0),0);}
export function toGpx(t:Trail){return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="GILOA React Lab" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>GILOA</name>${t.segments.filter(s=>s.length).map(s=>`<trkseg>${s.map(p=>`<trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.time).toISOString()}</time></trkpt>`).join('')}</trkseg>`).join('')}</trk></gpx>`;}
