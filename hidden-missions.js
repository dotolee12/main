(function () {
    "use strict";

    var STORAGE_KEY = "giloa-hidden-travel-rpg-v1";
    var MAX_DISCOVERY_ACCURACY_M = 50;
    var EXIT_HYSTERESIS_M = 35;
    var POSITION_SAMPLE_MS = 3000;

    function asset(file) { return encodeURI("./gilo many appearance/" + file); }

    /* Business logic refers only to roles. File names live in this single mapping. */
    var GILO_ASSETS = Object.freeze({
        levelUp: asset("게임상황_01.png"),
        missionClear: asset("게임상황_02.png"),
        itemDiscovery: asset("게임상황_03.png"),
        treasure: asset("게임상황_04.png"),
        navigation: asset("게임상황_05.png"),
        gps: asset("게임상황_06.png"),
        placeDiscovery: asset("게임상황_07.png"),
        photoSuccess: asset("게임상황_08.png"),
        surprise: asset("ChatGPT Image Aug 3, 2026, 09_16_40 AM.png"),
        curious: asset("길로_뒷모습.png"),
        happy: asset("길로_즐거운모습_01_환영.png"),
        moved: asset("길로_감동하는모습_03_마음깊은감동.png"),
        warning: asset("길로_화난모습_01_팔짱.png"),
        explain: asset("일하는 모습, 인사하는 모습, 여러가지 모습.png"),
        photoGuide: asset("giloa-tutorial-photo-nature.png"),
        specialDiscovery: asset("길로_감동하는모습_02_감사의눈물.png")
    });

    var COPY = {
        ko: { discovered:"새로운 장소 발견", first:"여긴 처음 와 보는 곳이네.", next:"다음", close:"여행 계속하기", clear:"HIDDEN MISSION CLEAR", reward:"여행에 기록하기", rewardExplore:"탐험 +{n}", rewardExperience:"경험 +{n}", rewardMemory:"기억 +{n}" },
        en: { discovered:"NEW PLACE DISCOVERED", first:"This is our first time here.", next:"Next", close:"Keep traveling", clear:"HIDDEN MISSION CLEAR", reward:"Save to journey", rewardExplore:"Exploration +{n}", rewardExperience:"Experience +{n}", rewardMemory:"Memory +{n}" },
        ja: { discovered:"新しい場所を発見", first:"ここは初めて来る場所だね。", next:"次へ", close:"旅を続ける", clear:"HIDDEN MISSION CLEAR", reward:"旅に記録する", rewardExplore:"探索 +{n}", rewardExperience:"体験 +{n}", rewardMemory:"記憶 +{n}" },
        zh: { discovered:"发现新地点", first:"这里是我们第一次来呢。", next:"下一步", close:"继续旅行", clear:"HIDDEN MISSION CLEAR", reward:"记录到旅程", rewardExplore:"探索 +{n}", rewardExperience:"体验 +{n}", rewardMemory:"记忆 +{n}" },
        es: { discovered:"NUEVO LUGAR DESCUBIERTO", first:"Es la primera vez que venimos aquí.", next:"Siguiente", close:"Seguir viajando", clear:"MISIÓN OCULTA COMPLETADA", reward:"Guardar en el viaje", rewardExplore:"Exploración +{n}", rewardExperience:"Experiencia +{n}", rewardMemory:"Recuerdos +{n}" }
    };

    COPY.fr = { discovered:"NOUVEAU LIEU DÉCOUVERT", first:"C’est notre première fois ici.", next:"Suivant", close:"Continuer le voyage", clear:"MISSION SECRÈTE TERMINÉE", reward:"Ajouter au voyage", rewardExplore:"Exploration +{n}", rewardExperience:"Expérience +{n}", rewardMemory:"Souvenirs +{n}" };

    var PLACE_MISSIONS = Object.freeze({
        boshingak: {
            placeId:"boshingak", missionId:"seoul_time_01", type:"heritage",
            location:{ lat:37.570005, lng:126.983678, radiusM:105 },
            requirements:{ any:[{ type:"stay", seconds:120 },{ type:"explore", meters:220 },{ type:"photoExif", radiusM:130 }] },
            rewards:{ exploration:2, experience:3, memory:2 },
            assets:{ discovery:"placeDiscovery", clear:"missionClear", finale:"moved" },
            dialogue:{
                ko:{ name:"보신각", title:"서울의 시간을 만나다", pages:["잠깐!\n너 방금 숨겨진 이야기를 하나 완성했어.","서울의 시간을 지켜온 장소를 직접 발견했어.","이제 이곳은 지도 위의 이름이 아니라, 네가 직접 찾아온 장소야."] },
                en:{ name:"Bosingak Belfry", title:"Meet Seoul's Time", pages:["Wait!\nYou just completed a hidden story.","You discovered the place that has kept Seoul's time.","Now it is more than a name on a map—it is somewhere you found yourself."] },
                ja:{ name:"普信閣", title:"ソウルの時に出会う", pages:["待って！\n今、隠された物語をひとつ完成させたよ。","ソウルの時を守ってきた場所を自分で見つけたね。","ここはもう地図上の名前ではなく、君が見つけた場所だよ。"] },
                zh:{ name:"普信阁", title:"遇见首尔的时间", pages:["等一下！\n你刚刚完成了一个隐藏故事。","你亲自发现了守护首尔时间的地方。","这里不再只是地图上的名字，而是你亲自找到的地点。"] },
                es:{ name:"Campanario Bosingak", title:"Encontrar el tiempo de Seúl", pages:["¡Espera!\nAcabas de completar una historia oculta.","Has descubierto el lugar que ha marcado el tiempo de Seúl.","Ahora ya no es solo un nombre en el mapa: es un lugar que encontraste por ti mismo."] }
            }
        },
        tapgol_park: {
            placeId:"tapgol_park", missionId:"park_pause_01", type:"park",
            location:{ lat:37.571145, lng:126.988158, radiusM:110 },
            requirements:{ any:[{ type:"stay", seconds:180 },{ type:"explore", meters:300 },{ type:"photoExif", radiusM:140 }] },
            rewards:{ exploration:2, experience:2, memory:2 },
            assets:{ discovery:"placeDiscovery", clear:"missionClear", finale:"happy" },
            dialogue:{
                ko:{ name:"탑골공원", title:"도시 안의 쉼을 발견하다", pages:["잠깐!\n조용히 걷던 시간이 하나의 이야기가 됐어.","도시 한가운데서 머물고 둘러본 순간을 발견했어.","서두르지 않은 시간도 네 여행의 일부야."] },
                en:{ name:"Tapgol Park", title:"A Pause in the City", pages:["Wait!\nYour quiet walk just became a story.","You found a moment to stay and look around in the middle of the city.","Unhurried time is part of your journey too."] },
                ja:{ name:"タプコル公園", title:"街の中の休息を発見", pages:["待って！\n静かに歩いた時間が物語になったよ。","街の真ん中で立ち止まり、見渡した瞬間を見つけたね。","急がない時間も君の旅の一部だよ。"] },
                zh:{ name:"塔谷公园", title:"发现城市中的停歇", pages:["等一下！\n安静行走的时间也变成了一个故事。","你在城市中央发现了停留和环顾的片刻。","不匆忙的时间也是旅行的一部分。"] },
                es:{ name:"Parque Tapgol", title:"Una pausa en la ciudad", pages:["¡Espera!\nTu paseo tranquilo acaba de convertirse en una historia.","Has encontrado un momento para quedarte y mirar a tu alrededor en plena ciudad.","El tiempo sin prisas también forma parte de tu viaje."] }
            }
        }
    });

    Object.keys(PLACE_MISSIONS).forEach(function(key) {
        var dialogue = PLACE_MISSIONS[key] && PLACE_MISSIONS[key].dialogue;
        if (!dialogue) return;
        if (key === "boshingak") dialogue.fr = { name:"Beffroi de Bosingak", title:"À la rencontre du temps de Séoul", pages:["Attends !\nTu viens de terminer une histoire cachée.","Tu as découvert le lieu qui a donné le rythme du temps à Séoul.","Ce n’est plus seulement un nom sur une carte : c’est un lieu que tu as trouvé toi-même."] };
        if (key === "tapgol_park") dialogue.fr = { name:"Parc Tapgol", title:"Une pause dans la ville", pages:["Attends !\nTa promenade tranquille vient de devenir une histoire.","Tu as trouvé un moment pour t’arrêter et regarder autour de toi au cœur de la ville.","Prendre son temps fait aussi partie du voyage."] };
    });

    function emptyState() { return { version:1, discoveredPlaces:{}, completedHiddenMissions:{}, progress:{}, rewardedMissions:{} }; }
    function loadState() { try { var v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); return v && v.version===1 ? Object.assign(emptyState(),v) : emptyState(); } catch (_) { return emptyState(); } }
    var state=loadState(), lastPosition=null, lastSampleAt=0, insidePlaces={};
    function saveState() { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch (_) {} }
    function lang() { var key=typeof currentLang==="string"?currentLang:"ko"; return COPY[key]?key:"ko"; }
    function words() { return COPY[lang()]; }
    function distance(a,b) { var r=6371000,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180; var x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
    function localized(mission) { return mission.dialogue[lang()]||mission.dialogue.ko; }
    function progressFor(mission) { return state.progress[mission.missionId]||(state.progress[mission.missionId]={ enteredAt:0, stayMs:0, exploredM:0, photoMatched:false, lastLat:null, lastLng:null, lastAt:0 }); }
    function showDiscovery(mission) {
        if (typeof setDiscoveryGiloImage==="function") { var img=document.getElementById("discovery-gilo"); if(img) img.src=GILO_ASSETS[mission.assets.discovery]; }
        var toast=document.getElementById("discovery-toast"); if(!toast)return;
        var w=words(), d=localized(mission), kicker=toast.querySelector(".discovery-kicker");
        if(kicker)kicker.textContent=w.discovered;
        document.getElementById("discovery-place-name").textContent=d.name;
        document.getElementById("discovery-method").textContent=w.first;
        document.getElementById("discovery-reward").textContent="";
        if(typeof discoveryRewardTimer!=="undefined"&&discoveryRewardTimer)clearTimeout(discoveryRewardTimer);
        toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden","false");
        discoveryRewardTimer=setTimeout(function(){toast.classList.remove("show");toast.setAttribute("aria-hidden","true");},2200);
    }
    function requirementsMet(mission,p) { return mission.requirements.any.some(function(r){ return r.type==="stay"?p.stayMs>=r.seconds*1000:r.type==="explore"?p.exploredM>=r.meters:r.type==="photoExif"?p.photoMatched:false; }); }
    function applyReward(mission) {
        if(state.rewardedMissions[mission.missionId])return;
        state.rewardedMissions[mission.missionId]=Date.now();
        if(typeof loadRpgGrowth==="function"&&typeof saveRpgGrowth==="function"){
            var s=loadRpgGrowth(); Object.keys(mission.rewards).forEach(function(k){s.stats[k]=(Number(s.stats[k])||0)+mission.rewards[k];}); saveRpgGrowth(s); if(typeof updateRpgGrowthUI==="function")updateRpgGrowthUI(s);
        }
        if(typeof items!=="undefined"&&Array.isArray(items)&&typeof saveCollection==="function"){
            items.push({id:mission.missionId,name:localized(mission).title,earnedAt:Date.now(),dateString:new Date().toLocaleDateString()}); saveCollection(); if(typeof updateItemList==="function")updateItemList();
        }
    }
    var novel={ mission:null,page:0 };
    function renderNovel() {
        var m=novel.mission,d=localized(m),w=words(),pages=d.pages,rewardPage=novel.page>=pages.length;
        document.getElementById("hidden-mission-kicker").textContent=w.clear;
        document.getElementById("hidden-mission-title").textContent=d.title;
        document.getElementById("hidden-mission-copy").textContent=rewardPage?d.pages[d.pages.length-1]:pages[novel.page];
        document.getElementById("hidden-mission-gilo").src=GILO_ASSETS[rewardPage?m.assets.finale:m.assets.clear];
        var rewards=document.getElementById("hidden-mission-rewards"); rewards.hidden=!rewardPage;
        rewards.innerHTML=rewardPage?[w.rewardExplore,w.rewardExperience,w.rewardMemory].map(function(t,i){var keys=["exploration","experience","memory"];return "<span>"+t.replace("{n}",m.rewards[keys[i]]||0)+"</span>";}).join(""):"";
        document.getElementById("hidden-mission-progress").style.width=((novel.page+1)/(pages.length+1)*100)+"%";
        document.getElementById("hidden-mission-next").textContent=rewardPage?w.reward:w.next;
    }
    function openNovel(mission){novel={mission:mission,page:0};var el=document.getElementById("hidden-mission-novel");if(!el)return;el.classList.add("open");el.setAttribute("aria-hidden","false");document.body.classList.add("hidden-mission-open");renderNovel();document.getElementById("hidden-mission-next").focus();}
    function closeNovel(){var el=document.getElementById("hidden-mission-novel");if(!el)return;el.classList.remove("open");el.setAttribute("aria-hidden","true");document.body.classList.remove("hidden-mission-open");novel={mission:null,page:0};}
    function nextNovel(){if(!novel.mission)return;var count=localized(novel.mission).pages.length;if(novel.page>=count){applyReward(novel.mission);saveState();closeNovel();return;}novel.page+=1;renderNovel();}
    function complete(mission){if(state.completedHiddenMissions[mission.missionId])return;state.completedHiddenMissions[mission.missionId]={completedAt:Date.now(),placeId:mission.placeId};saveState();openNovel(mission);}
    function onPosition(pos){
        if(!pos||!isFinite(pos.lat)||!isFinite(pos.lng)||pos.accuracy>MAX_DISCOVERY_ACCURACY_M)return;
        if(pos.timestamp-lastSampleAt<POSITION_SAMPLE_MS)return;lastSampleAt=pos.timestamp;
        Object.keys(PLACE_MISSIONS).forEach(function(id){var m=PLACE_MISSIONS[id],dist=distance(pos,m.location),inside=dist<=m.location.radiusM,p=progressFor(m);
            if(!state.discoveredPlaces[m.placeId]&&inside){state.discoveredPlaces[m.placeId]={discoveredAt:Date.now(),lat:pos.lat,lng:pos.lng};p.enteredAt=pos.timestamp;p.lastAt=pos.timestamp;p.lastLat=pos.lat;p.lastLng=pos.lng;insidePlaces[id]=true;saveState();showDiscovery(m);return;}
            if(!state.discoveredPlaces[m.placeId]||state.completedHiddenMissions[m.missionId])return;
            if(inside){if(!insidePlaces[id]){insidePlaces[id]=true;p.enteredAt=pos.timestamp;p.lastAt=pos.timestamp;}var delta=Math.max(0,Math.min(15000,pos.timestamp-(p.lastAt||pos.timestamp)));p.stayMs+=delta;if(p.lastLat!==null){var moved=distance({lat:p.lastLat,lng:p.lastLng},pos);if(moved>=3&&moved<=80)p.exploredM+=moved;}p.lastLat=pos.lat;p.lastLng=pos.lng;p.lastAt=pos.timestamp;saveState();if(requirementsMet(m,p))complete(m);}else if(dist>m.location.radiusM+EXIT_HYSTERESIS_M){insidePlaces[id]=false;p.enteredAt=0;p.lastAt=0;saveState();}
        });lastPosition=pos;
    }
    function onPhoto(photo){if(!photo||photo.locationSource!=="exif"||!isFinite(photo.lat)||!isFinite(photo.lng))return;Object.keys(PLACE_MISSIONS).some(function(id){var m=PLACE_MISSIONS[id],rule=m.requirements.any.find(function(r){return r.type==="photoExif";});if(!rule||!state.discoveredPlaces[m.placeId]||state.completedHiddenMissions[m.missionId])return false;if(distance(photo,m.location)<=rule.radiusM){var p=progressFor(m);p.photoMatched=true;saveState();complete(m);return true;}return false;});}
    function init(){var next=document.getElementById("hidden-mission-next"),close=document.getElementById("hidden-mission-close");if(next)next.addEventListener("click",nextNovel);if(close)close.addEventListener("click",closeNovel);document.addEventListener("keydown",function(e){if(e.key==="Escape"&&novel.mission)closeNovel();});/* Mission artwork is requested only when its discovery/dialogue is shown. Eagerly fetching every optional image here competes with the first map render. */}
    window.GiloaHiddenMissions={onPosition:onPosition,onPhoto:onPhoto,assets:GILO_ASSETS,places:PLACE_MISSIONS,getState:function(){return JSON.parse(JSON.stringify(state));},init:init};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
