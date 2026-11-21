/* Opt-in heuristic. No extra location watcher, uploads, or writes to journey data. */
(function(root) {
    'use strict';
    function distance(a,b) {
        var rad=Math.PI/180, x=(b.lng-a.lng)*rad*Math.cos((a.lat+b.lat)*rad/2), y=(b.lat-a.lat)*rad;
        return Math.sqrt(x*x+y*y)*6371000;
    }
    function detector(saved) {
        var s=saved || {last:0, ride:[], riding:false, walk:[], anchor:null, rideAt:0};
        return {state:s, feed:function(p) {
            if(!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat)>90 || Math.abs(p.lng)>180 || !Number.isFinite(p.accuracy) || p.accuracy>30 || p.accuracy<0 || !Number.isFinite(p.time) || p.time<=s.last) return null;
            var gap=p.time-s.last;
            if(s.last && gap>90000) { s.ride=[];s.riding=false;s.walk=[];s.anchor=null; }
            s.last=p.time;
            // Missing GPS speed is not converted to zero (which would invent a stop).
            if(typeof p.speed!=='number' || !Number.isFinite(p.speed) || p.speed<0) {s.ride=[];s.riding=false;s.walk=[];s.anchor=null;return null;}
            if(p.speed>12) {s.ride=[];s.riding=false;s.walk=[];s.anchor=null;return null;}
            if(p.speed>=2.5) {
                s.walk=[];s.anchor=null;s.ride.push(p);s.ride=s.ride.filter(function(q){return p.time-q.time<=90000;});
                if(s.ride.length>=5 && p.time-s.ride[0].time>=60000) s.riding=true;
                s.rideAt=p.time;return null;
            }
            s.ride=[];
            if(!s.riding || p.time-s.rideAt>600000) {s.riding=false;return null;}
            if(!s.anchor) s.anchor=p;
            if(p.speed<0.5 || p.speed>2.2) {s.walk=[];return null;}
            s.walk.push(p);
            if(s.walk.length>=5 && p.time-s.walk[0].time>=60000 && distance(s.walk[0],p)>=25) {
                var result={lat:s.anchor.lat,lng:s.anchor.lng,accuracy:s.anchor.accuracy,time:s.anchor.time,detectedAt:p.time,confirmed:false};
                s.riding=false;s.walk=[];s.anchor=null;return result;
            }
            return null;
        }};
    }
    if(typeof module==='object' && module.exports) {module.exports={detector:detector,distance:distance};return;}
    var KEY='giloa-bike-parking-v1', data={enabled:false,since:0,candidate:null}, machine=detector(), panel,button,marker;
    try {var stored=JSON.parse(localStorage.getItem(KEY));if(stored && typeof stored.enabled==='boolean') {data=stored;if(stored.machine && Array.isArray(stored.machine.ride) && Array.isArray(stored.machine.walk) && Number.isFinite(stored.machine.last)) machine=detector(stored.machine);if(data.candidate && (!Number.isFinite(data.candidate.lat) || !Number.isFinite(data.candidate.lng) || Math.abs(data.candidate.lat)>90 || Math.abs(data.candidate.lng)>180)) data.candidate=null;}} catch(_) {}
    var words={
        ko:['자전거 자동 기억','자전거를 탈 때 켜두세요. 위치 기록 중 탑승→도보 전환을 추정합니다. 웹은 화면 잠금 중 중단될 수 있어요. 앱은 수집한 기록을 복귀 시 분석합니다. 속도만으로 판정하므로 자동차·정차를 잘못 판단할 수 있어요.','자동 기억 켜기','자동 기억 끄기','주차 후보가 아직 없어요.','여기에 자전거를 세웠나요?','내 자전거 찾기','여기가 맞아요','후보 지우기','닫기','기기 저장에 실패했어요. 저장 공간을 확인하세요.','확인한 주차 위치','위치 기록을 시작해야 감지합니다. 기록이 끊기면 후보를 만들지 않습니다.'],
        en:['Remember bicycle parking','Enable when cycling. Detects riding → walking during location recording. Web recording may stop when locked; native samples are analysed on return. Speed can confuse driving and stops.','Enable','Disable','No parking candidate yet.','Did you park your bicycle here?','Find my bicycle','Confirm location','Clear candidate','Close','Could not save on this device. Check storage.','Confirmed parking location','Start location recording to detect parking. Gaps do not create candidates.'],
        ja:['自転車の駐輪を記憶','乗車時に有効にしてください。位置記録中の走行→徒歩を推定します。Webは画面ロックで停止する場合があります。アプリの記録は復帰時に分析します。車や停車を誤判定する場合があります。','有効にする','無効にする','駐輪候補はありません。','ここに駐輪しましたか？','自転車を探す','位置を確認','候補を削除','閉じる','保存できません。空き容量を確認してください。','確認済みの駐輪位置','位置記録を開始してください。記録が途切れた区間は推定しません。'],
        zh:['记住自行车停车位置','骑车时启用。根据位置记录推测骑行→步行。网页锁屏时可能停止，应用返回时分析原生记录。可能将开车或停车误判。','启用','停用','暂无停车候选位置。','自行车停在这里吗？','寻找自行车','确认位置','清除候选位置','关闭','保存失败，请检查存储空间。','已确认的停车位置','请开始位置记录。记录中断时不生成候选位置。'],
        es:['Recordar aparcamiento de bici','Activa al montar. Estima el cambio de bici a pie durante la grabación. La web puede pararse al bloquear; la app analiza los registros al volver. Puede confundir coche y paradas.','Activar','Desactivar','Sin ubicación candidata.','¿Aparcaste la bici aquí?','Buscar mi bici','Confirmar ubicación','Borrar candidato','Cerrar','No se pudo guardar. Revisa el espacio.','Aparcamiento confirmado','Inicia la grabación de ubicación. Los huecos no generan candidatos.']
    };
    function text(i) {return (words[String(typeof currentLang==='string'?currentLang:document.documentElement.lang).slice(0,2)]||words.en)[i];}
    function persist() {try {data.machine=machine.state;localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(_) {if(panel)panel.querySelector('[data-status]').textContent=text(10);return false;}}
    function showMarker() {
        if(marker) {marker.remove();marker=null;}
        var c=data.candidate;if(!c || typeof map==='undefined')return;
        marker=L.marker([c.lat,c.lng]).addTo(map).bindTooltip(text(c.confirmed?11:5));
        marker.on('click',open);
    }
    function render() {
        if(!panel)return;
        button.textContent='🚲 '+text(0)+(data.candidate&&!data.candidate.confirmed?' •':'');
        panel.querySelector('h2').textContent=text(0);
        panel.querySelector('[data-info]').textContent=text(1)+' '+text(12);
        panel.querySelector('[data-toggle]').textContent=text(data.enabled?3:2);
        var c=data.candidate;
        panel.querySelector('[data-status]').textContent=c?text(c.confirmed?11:5)+' · '+new Date(c.time).toLocaleString()+' · ±'+Math.round(c.accuracy)+' m':text(4);
        [6,7,8].forEach(function(i){var b=panel.querySelector('[data-action="'+i+'"]');b.textContent=text(i);b.hidden=!c;});
        panel.querySelector('[data-close]').setAttribute('aria-label',text(9));
    }
    function close(){panel.hidden=true;}
    function open(){render();panel.hidden=false;panel.focus();}
    function setup(){
        if(panel || typeof map==='undefined')return;
        var host=document.querySelector('#sidebar .sidebar-header');if(!host)return;
        button=document.createElement('button');button.type='button';button.className='sidebar-button';host.after(button);button.onclick=function(e){e.stopPropagation();open();if(typeof toggleSidebar==='function')toggleSidebar(false);};
        panel=document.createElement('section');panel.hidden=true;panel.tabIndex=-1;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','bike-parking-title');
        panel.style.cssText='position:fixed;z-index:12000;top:75px;left:12px;right:12px;max-width:420px;max-height:75vh;overflow:auto;background:#1a2035;color:white;padding:20px;border:2px solid #4fc3f7;border-radius:16px;box-shadow:0 8px 25px #0008';
        panel.innerHTML='<button data-close type="button" style="float:right">×</button><h2 id="bike-parking-title"></h2><p data-info></p><button data-toggle type="button"></button><p data-status role="status"></p><div>'+[6,7,8].map(function(i){return '<button type="button" data-action="'+i+'"></button>';}).join(' ')+'</div>';
        document.body.append(panel);L.DomEvent.disableClickPropagation(panel);
        panel.querySelector('[data-close]').onclick=close;
        panel.querySelector('[data-toggle]').onclick=function(){var old=data.enabled;data.enabled=!old;data.since=Date.now();machine=detector();if(!persist()) {data.enabled=old;return;}render();};
        panel.querySelector('[data-action="6"]').onclick=function(){var c=data.candidate;if(c){close();map.setView([c.lat,c.lng],18);showMarker();marker.openTooltip();}};
        panel.querySelector('[data-action="7"]').onclick=function(){data.candidate.confirmed=true;if(persist()){render();showMarker();}};
        panel.querySelector('[data-action="8"]').onclick=function(){data.candidate=null;if(persist()){render();showMarker();}};
        map.on('click',function(){if(!panel.hidden)close();});
        document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
        new MutationObserver(function(){render();showMarker();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
        render();showMarker();
    }
    root.GiloaBikeParking={feed:function(p){
        if(!data.enabled || !p || p.time<data.since)return;
        var candidate=machine.feed(p);
        // Retain an unresolved candidate until explicitly cleared or confirmed.
        if(candidate && (!data.candidate || data.candidate.confirmed)) data.candidate=candidate;
        if(persist() && candidate){render();showMarker();if(document.visibilityState==='visible')open();}
    },open:open};
    root.addEventListener('giloa:ready',setup);
    if(document.readyState!=='loading')setup();else document.addEventListener('DOMContentLoaded',setup);
})(typeof window==='undefined'?globalThis:window);
