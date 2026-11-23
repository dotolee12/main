import {useEffect,useRef,useState} from 'react';
import {appendFix,EMPTY,parseTrail,TRACK_KEY,type Fix,type Trail} from './tracking';
export function useTracking(){
 const [trail,setTrail]=useState<Trail>(EMPTY),[current,setCurrent]=useState<Fix|null>(null),[active,setActive]=useState(false),[issue,setIssue]=useState<'denied'|'unavailable'|'timeout'|'storage'|'corrupt'|null>(null);
 const trailRef=useRef<Trail>(EMPTY),watch=useRef<number|null>(null),blocked=useRef(false);
 useEffect(()=>{try{const t=parseTrail(localStorage.getItem(TRACK_KEY));trailRef.current=t;setTrail(t);}catch{blocked.current=true;setIssue('corrupt');}return()=>{if(watch.current!==null)navigator.geolocation.clearWatch(watch.current);};},[]);
 function stop(){if(watch.current!==null){navigator.geolocation.clearWatch(watch.current);watch.current=null;}setActive(false);}
 function persist(t:Trail){try{localStorage.setItem(TRACK_KEY,JSON.stringify(t));trailRef.current=t;setTrail(t);return true;}catch{setIssue('storage');stop();return false;}}
 function start(){if(watch.current!==null||blocked.current)return;if(!navigator.geolocation){setIssue('unavailable');return;}setIssue(null);if(!persist({...trailRef.current,segments:[...trailRef.current.segments,[]]}))return;setActive(true);
 watch.current=navigator.geolocation.watchPosition(position=>{const f:Fix={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy,time:position.timestamp};setCurrent(f);const next=appendFix(trailRef.current,f);if(next!==trailRef.current)persist(next);},error=>{setIssue(error.code===1?'denied':error.code===3?'timeout':'unavailable');if(error.code===1)stop();},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
 }
 return {trail,current,active,issue,start,stop};
}
