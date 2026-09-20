/* GILOA first-run interactive tutorial */
(function () {
  "use strict";

  var DONE_KEY = "giloa-tutorial-completed";
  var HELLO_IMAGE = encodeURI("./gilo many appearance/gilo-actions-transparent/07-waving-transparent.png");
  var LOCATION_IMAGE = encodeURI("./gilo many appearance/gilo-actions-transparent/10-map-transparent.png");
  var EXPLAIN_IMAGE = encodeURI("./gilo many appearance/gilo-actions-transparent/09-explaining-transparent.png");
  var WALK_IMAGE = encodeURI("./gilo many appearance/gilo-actions-transparent/01-walking-transparent.png");
  var SURPRISED_IMAGE = encodeURI("./gilo many appearance/gilo-emotions-transparent/12-surprised-transparent.png");
  var FINISH_IMAGE = encodeURI("./gilo many appearance/gilo-actions-transparent/06-thumbs-up-transparent.png");
  var MOVE_DISTANCE_M = 12;
  var MAX_ACCURACY_M = 50;
  var STATES = Object.freeze({
    IDLE: "IDLE", BLACK: "INTRO_BLACK", BLINK: "BLINK", MAP: "MAP_REVEAL",
    INTRO: "GILO_INTRO", LOCATION_PROMPT: "WAIT_LOCATION_CLICK", LOCATION: "WAIT_LOCATION",
    LOCATION_OK: "LOCATION_SUCCESS", RECORD: "WAIT_RECORD_CLICK", MOVE: "WAIT_MOVEMENT",
    MOVE_OK: "MOVEMENT_SUCCESS", FINISH: "FINISH"
  });

  var I18N = {
    ko: {
      next: "다음", skip: "건너뛰기", explore: "탐험 시작", retry: "다시 시도",
      intro: ["어? 깨어났네!", "안녕! 나는 길로야.", "여기… 좀 어둡지?", "아직 네가 가보지 않은 곳들이야.", "우선 우리가 어디 있는지부터 찾아볼까?"],
      location: ["우선 우리가 어디 있는지부터 찾아보자!", "여기를 눌러봐."],
      finding: "잠깐만! 지금 위치를 찾고 있어.", permission: "현재 위치를 찾으려면 위치 권한을 허용해 줘.", unavailable: "위치를 찾지 못했어. 다시 시도해 볼까?",
      locationSuccess: ["찾았다!", "여기서부터 네 지도가 시작되는 거야."],
      record: ["이제 한번 걸어볼까?", "이 버튼을 누르면 네 발걸음을 기억할 수 있어.", "눌러봐!"],
      movement: ["좋아!", "이제 조금 걸어봐!", "천천히 걸어도 괜찮아.", "네가 움직이면 지도가 기억하기 시작할 거야."],
      success: ["우와!", "보았어?", "네가 걸으니까 길이 나타났어!", "이게 네가 직접 만들어가는 지도야."],
      finish: ["이제 알겠지?", "어디로 갈지는 내가 정하지 않을게.", "네가 가고 싶은 곳으로 가.", "세상에 나가,\n너만의 길을 만들어봐."],
      confirmTitle: "튜토리얼을 종료할까?", confirmCopy: "도움말에서 언제든 다시 볼 수 있어.", keep: "계속 보기", exit: "종료"
    },
    en: {
      next: "Next", skip: "Skip", explore: "Start exploring", retry: "Try again",
      intro: ["Oh! You're awake!", "Hi! I'm Gilo.", "It's a little dark here, isn't it?", "These are places you haven't visited yet.", "First, shall we find out where we are?"],
      location: ["Let's find where we are first!", "Tap here."],
      finding: "One moment! I'm finding your location.", permission: "Please allow location access so I can find you.", unavailable: "I couldn't find your location. Shall we try again?",
      locationSuccess: ["Found it!", "Your map begins right here."],
      record: ["Shall we take a walk?", "This button remembers every step you take.", "Tap it!"],
      movement: ["Great!", "Now walk a little!", "Take your time.", "When you move, the map will begin to remember."],
      success: ["Wow!", "Did you see that?", "The path appeared because you walked!", "This is a map you create yourself."],
      finish: ["Now you understand, right?", "I won't decide where you should go.", "Go wherever you want.", "Step into the world,\nand make your own path."],
      confirmTitle: "End the tutorial?", confirmCopy: "You can replay it anytime from Help.", keep: "Keep watching", exit: "Exit"
    },
    ja: {
      next: "次へ", skip: "スキップ", explore: "探索を始める", retry: "もう一度試す",
      intro: ["あっ！目が覚めたんだね！", "こんにちは！ぼくはギロ。", "ここ…少し暗いでしょう？", "まだ君が訪れていない場所なんだ。", "まずは、今いる場所を探してみようか？"],
      location: ["まずは今いる場所を探そう！", "ここを押してみて。"],
      finding: "ちょっと待ってね。今いる場所を探しているよ。", permission: "現在地を探すには、位置情報の許可が必要だよ。", unavailable: "現在地を見つけられなかったよ。もう一度試そうか？",
      locationSuccess: ["見つけた！", "ここから君の地図が始まるよ。"],
      record: ["さあ、歩いてみようか？", "このボタンを押すと、君の足どりを記憶できるよ。", "押してみて！"],
      movement: ["いいね！", "少し歩いてみよう！", "ゆっくりで大丈夫。", "君が動くと、地図が記憶を始めるよ。"],
      success: ["わあ！", "見えた？", "君が歩いたから道が現れたよ！", "これが君自身で作っていく地図だよ。"],
      finish: ["もう分かったよね？", "どこへ行くかは、ぼくが決めないよ。", "君が行きたい場所へ行こう。", "世界へ踏み出して、\n君だけの道を作ってみよう。"],
      confirmTitle: "チュートリアルを終了しますか？", confirmCopy: "ヘルプからいつでも見直せます。", keep: "続ける", exit: "終了"
    },
    zh: {
      next: "下一步", skip: "跳过", explore: "开始探索", retry: "再试一次",
      intro: ["咦？你醒啦！", "你好！我是吉洛。", "这里……有点暗，对吧？", "这些都是你还没有去过的地方。", "先来找找我们现在在哪里吧？"],
      location: ["先找到我们现在的位置吧！", "点一下这里。"],
      finding: "稍等一下！正在寻找你的位置。", permission: "要找到当前位置，请允许使用位置信息。", unavailable: "没能找到你的位置。要再试一次吗？",
      locationSuccess: ["找到了！", "你的地图就从这里开始。"],
      record: ["现在去走一走吧？", "按下这个按钮，就能记住你的每一步。", "点一下吧！"],
      movement: ["很好！", "现在走一小段吧！", "慢慢走也没关系。", "当你移动时，地图就会开始记录。"],
      success: ["哇！", "看到了吗？", "因为你走过，道路出现了！", "这就是由你亲手创造的地图。"],
      finish: ["现在明白了吧？", "去哪里，不由我来决定。", "去你想去的地方吧。", "走进世界，\n创造属于你自己的路。"],
      confirmTitle: "要结束教程吗？", confirmCopy: "随时可以在帮助中重新查看。", keep: "继续观看", exit: "结束"
    }
    ,es: {
      next:"Siguiente", skip:"Omitir", explore:"Empezar a explorar", retry:"Intentar de nuevo",
      intro:["¡Oh! ¡Ya estás despierto!","¡Hola! Soy Gilo.","Aquí está un poco oscuro, ¿verdad?","Son lugares que aún no has visitado.","Primero, ¿vemos dónde estamos?"],
      location:["¡Primero encontremos nuestra ubicación!","Toca aquí."],
      finding:"Un momento. Estoy buscando tu ubicación.", permission:"Permite el acceso a la ubicación para que pueda encontrarte.", unavailable:"No pude encontrar tu ubicación. ¿Lo intentamos de nuevo?",
      locationSuccess:["¡Te encontré!","Tu mapa comienza justo aquí."],
      record:["¿Damos un paseo?","Este botón recuerda cada paso que das.","¡Tócalo!"],
      movement:["¡Muy bien!","Ahora camina un poco.","Sin prisa.","Cuando te muevas, el mapa comenzará a recordar."],
      success:["¡Guau!","¿Lo has visto?","¡El camino apareció porque caminaste!","Este es un mapa que creas tú mismo."],
      finish:["Ya lo entiendes, ¿verdad?","Yo no decidiré adónde debes ir.","Ve adonde tú quieras.","Sal al mundo\ny crea tu propio camino."],
      confirmTitle:"¿Terminar el tutorial?", confirmCopy:"Puedes repetirlo cuando quieras desde Ayuda.", keep:"Seguir viendo", exit:"Salir"
    },
    fr: {
      next:"Suivant", skip:"Passer", explore:"Commencer à explorer", retry:"Réessayer",
      intro:["Oh ! Tu es réveillé !", "Bonjour ! Je suis Gilo.", "Il fait un peu sombre ici, non ?", "Ce sont des lieux que tu n’as pas encore visités.", "Commençons par voir où nous sommes."],
      location:["Trouvons d’abord où nous sommes !", "Touchez ici."],
      finding:"Un instant ! Je cherche votre position.", permission:"Autorisez la position pour que je puisse vous trouver.", unavailable:"Je n’ai pas trouvé votre position. On réessaie ?",
      locationSuccess:["Je t’ai trouvé !", "Votre carte commence juste ici."],
      record:["On fait une promenade ?", "Ce bouton se souvient de chaque pas que vous faites.", "Touchez-le !"],
      movement:["Parfait !", "Marchez un peu maintenant.", "Prenez votre temps.", "Quand vous bougez, la carte commence à se souvenir."],
      success:["Waouh !", "Vous avez vu ?", "Le chemin est apparu parce que vous avez marché !", "C’est une carte que vous créez vous-même."],
      finish:["Vous avez compris maintenant ?", "Je ne déciderai pas où vous devez aller.", "Allez où vous voulez.", "Entrez dans le monde,\net créez votre propre chemin."],
      confirmTitle:"Quitter le tutoriel ?", confirmCopy:"Vous pouvez le revoir à tout moment dans l’aide.", keep:"Continuer", exit:"Quitter"
    }
  };

  var root, locButton, recButton, state = STATES.IDLE, active = false, line = 0;
  var timers = [], movementTimer = null, movementStart = null, pathStartLength = 0;
  var bindings = [];

  function isDone() { var value = localStorage.getItem(DONE_KEY); return value === "1" || value === "true"; }
  function t() { return I18N[typeof currentLang === "string" ? currentLang : "ko"] || I18N.ko; }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; if (movementTimer) clearInterval(movementTimer); movementTimer = null; }
  function bind(el, type, fn) { if (!el) return; el.addEventListener(type, fn); bindings.push([el, type, fn]); }
  function unbindAll() { bindings.forEach(function (b) { b[0].removeEventListener(b[1], b[2]); }); bindings = []; }
  function setState(value) { state = value; if (root) root.dataset.state = value; }
  function setPhase(value) { if (!root) return; ["phase-black","phase-blink","phase-map","phase-dialogue","phase-action","phase-walk","phase-success"].forEach(function (c) { root.classList.remove(c); }); if (value) root.classList.add(value); }
  function setCopy(value, emphasis) { var el = document.getElementById("gft-copy"); if (!el) return; el.textContent = value || ""; el.classList.toggle("emphasis", !!emphasis); }
  function setNext(show, label) { var el = document.getElementById("gft-next"); if (!el) return; el.hidden = !show; el.textContent = label || t().next; el.setAttribute("aria-label", label || t().next); }
  function showSkip() { root.classList.add("skip-ready"); document.getElementById("gft-skip").textContent = t().skip; }
  function useCharacter(src) {
    var img = document.getElementById("gft-character"), placeholder = root.querySelector(".gft-character-placeholder");
    if (!img) return;
    img.hidden = false; if (placeholder) placeholder.hidden = true;
    img.onerror = function () {
      if (src !== HELLO_IMAGE) { img.onerror = function () { img.hidden = true; if (placeholder) placeholder.hidden = false; }; img.src = HELLO_IMAGE; }
      else { img.hidden = true; if (placeholder) placeholder.hidden = false; }
    };
    img.src = src;
  }
  function clearTarget() { document.querySelectorAll(".gft-target").forEach(function (e) { e.classList.remove("gft-target"); }); document.querySelectorAll(".gft-target-parent").forEach(function (e) { e.classList.remove("gft-target-parent"); }); }
  function spotlight(el) { clearTarget(); if (!el) return; el.classList.add("gft-target"); var parent = el.closest("#controls, #top-bar"); if (parent) parent.classList.add("gft-target-parent"); }
  function show(lines) { setCopy(lines[line] || lines[lines.length - 1]); }

  function intro() { setState(STATES.INTRO); setPhase("phase-dialogue"); root.classList.add("show-guide"); useCharacter(HELLO_IMAGE); line = 0; show(t().intro); setNext(true); }
  function locationPrompt() { setState(STATES.LOCATION_PROMPT); setPhase("phase-action"); useCharacter(LOCATION_IMAGE); line = 0; spotlight(locButton); show(t().location); setNext(true); }
  function waitLocation() { if (state !== STATES.LOCATION_PROMPT) return; setState(STATES.LOCATION); setCopy(t().finding); setNext(false); later(checkLocation, 180); }
  function checkLocation() { if (!active || state !== STATES.LOCATION) return; if (typeof currentPos !== "undefined" && currentPos) return locationFound(); later(checkLocation, 500); }
  function locationFound() { if (!active || (state !== STATES.LOCATION && state !== STATES.LOCATION_PROMPT)) return; clearTarget(); setState(STATES.LOCATION_OK); setPhase("phase-dialogue"); useCharacter(SURPRISED_IMAGE); setCopy(t().locationSuccess[0]); setNext(false); later(function () { setCopy(t().locationSuccess[1]); setNext(true); }, 700); }
  function recordPrompt() {
    setState(STATES.RECORD); setPhase("phase-action"); useCharacter(EXPLAIN_IMAGE); line = 0; spotlight(recButton);
    if (locButton === recButton && typeof isRecording !== "undefined" && isRecording) {
      // The combined location/record control was already tapped in the
      // preceding step. Explain what it started, then continue without
      // asking for a second tap that would stop the recording again.
      line = Math.min(1, t().record.length - 1);
      show(t().record); setNext(false); later(movementWait, 1100); return;
    }
    show(t().record); setNext(true);
  }
  function recordClicked() { if (!active || state !== STATES.RECORD) return; later(function () { if (typeof isRecording !== "undefined" && isRecording) movementWait(); }, 100); }
  function movementWait() {
    clearTarget(); setState(STATES.MOVE); setPhase("phase-walk"); useCharacter(WALK_IMAGE); line = 0;
    movementStart = typeof currentPos !== "undefined" && currentPos ? { lat: currentPos.lat, lng: currentPos.lng } : null;
    pathStartLength = typeof pathCoordinates !== "undefined" ? pathCoordinates.length : 0;
    setCopy(t().movement[0]); setNext(true);
    later(function () { if (state === STATES.MOVE) { setCopy(t().movement[1]); setNext(true); } }, 700);
    later(function () { if (state === STATES.MOVE) { setCopy(t().movement[2]); setNext(true); } }, 6000);
    later(function () { if (state === STATES.MOVE) { setCopy(t().movement[3]); setNext(true); } }, 13000);
    movementTimer = setInterval(checkMovement, 1000);
  }
  function meters(a, b) { if (!a || !b) return 0; if (typeof L !== "undefined" && L.latLng) return L.latLng(a.lat, a.lng).distanceTo([b.lat, b.lng]); var r=6371000,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180,sdp=Math.sin(dp/2),sdl=Math.sin(dl/2),x=sdp*sdp+Math.cos(p1)*Math.cos(p2)*sdl*sdl; return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
  function checkMovement() { if (!active || state !== STATES.MOVE || !movementStart || typeof currentPos === "undefined" || !currentPos) return; var accuracy = typeof currentAccuracy === "number" ? currentAccuracy : Infinity; var grew = typeof pathCoordinates !== "undefined" && pathCoordinates.length > pathStartLength; if (accuracy <= MAX_ACCURACY_M && grew && meters(movementStart, currentPos) >= MOVE_DISTANCE_M) movementSuccess(); }
  function movementSuccess() { if (!active || state !== STATES.MOVE) return; if (movementTimer) clearInterval(movementTimer); movementTimer = null; setState(STATES.MOVE_OK); setPhase("phase-success"); useCharacter(SURPRISED_IMAGE); line = 0; show(t().success); setNext(true); if (typeof scheduleRender === "function") scheduleRender(); }
  function finish() { setState(STATES.FINISH); setPhase("phase-dialogue"); useCharacter(FINISH_IMAGE); line = 0; show(t().finish); setNext(true); }

  function next() {
    var x = t();
    if (state === STATES.INTRO) { if (++line < x.intro.length) show(x.intro); else locationPrompt(); }
    else if (state === STATES.LOCATION_PROMPT && line < x.location.length - 1) { line++; show(x.location); setNext(false); }
    else if (state === STATES.LOCATION_OK) recordPrompt();
    else if (state === STATES.RECORD && line < x.record.length - 1) { line++; show(x.record); if (line === x.record.length - 1) setNext(false); }
    else if (state === STATES.MOVE) movementSuccess();
    else if (state === STATES.MOVE_OK) { if (++line < x.success.length) show(x.success); else finish(); }
    else if (state === STATES.FINISH) { if (line < x.finish.length - 1) { line++; show(x.finish); if (line === x.finish.length - 1) { setCopy(x.finish[line], true); setNext(true, x.explore); } } else complete(); }
    else if (state === STATES.LOCATION) locationPrompt();
  }
  function confirmSkip() { var x=t(), modal=document.getElementById("gft-skip-confirm"); document.getElementById("gft-confirm-title").textContent=x.confirmTitle; document.getElementById("gft-confirm-copy").textContent=x.confirmCopy; document.getElementById("gft-continue").textContent=x.keep; document.getElementById("gft-exit").textContent=x.exit; modal.hidden=false; document.getElementById("gft-continue").focus(); }
  function hideConfirm() { var modal=document.getElementById("gft-skip-confirm"); if (modal) modal.hidden=true; }
  function attach() { unbindAll(); bind(document.getElementById("gft-next"), "click", next); bind(document.getElementById("gft-skip"), "click", confirmSkip); bind(document.getElementById("gft-continue"), "click", hideConfirm); bind(document.getElementById("gft-exit"), "click", exit); bind(locButton, "click", waitLocation); bind(recButton, "click", recordClicked); }
  function cleanup(done, autoRecord) { clearTimers(); clearTarget(); unbindAll(); active=false; state=STATES.IDLE; if (done) localStorage.setItem(DONE_KEY, "1"); if (root) { root.className="gft"; root.dataset.state=STATES.IDLE; root.setAttribute("aria-hidden", "true"); } hideConfirm(); if (autoRecord && typeof startAutoRecordingOnLaunch === "function" && typeof isRecording !== "undefined" && !isRecording) setTimeout(startAutoRecordingOnLaunch, 120); }
  function complete() {
    cleanup(true, false);
    setTimeout(function () {
      if (typeof openGiloaGuideTutorial === "function") openGiloaGuideTutorial(true);
    }, 320);
  }
  function exit() { cleanup(true, true); }

  function start(force) {
    if (active && !force) return true;
    if (active) cleanup(false, false);
    if (!force && isDone()) return false;
    root=document.getElementById("giloa-first-tutorial");
    recButton=document.getElementById("rec-btn");
    locButton=recButton;
    if (!root || !locButton || !recButton) return false;
    // The current-location and recording actions share one control in the
    // latest UI. Reset an existing session so the highlighted first tap
    // always starts (rather than stops) recording and safely saves it.
    if (typeof isRecording !== "undefined" && isRecording && typeof stopRecording === "function") stopRecording();
    else if (typeof stopTracking === "function") stopTracking();
    active=true; line=0; clearTimers(); clearTarget(); attach();
    root.className="gft active phase-black"; root.setAttribute("aria-hidden", "false"); setState(STATES.BLACK); setNext(false); useCharacter(HELLO_IMAGE);
    later(function () { if (active) { setState(STATES.BLINK); setPhase("phase-blink"); } }, 500);
    later(function () { if (active) { showSkip(); setState(STATES.MAP); setPhase("phase-map"); } }, 2350);
    later(function () { if (active) intro(); }, 3350);
    return true;
  }

  window.onGiloaTutorialLocationError = function (error) { if (!active || state !== STATES.LOCATION) return; clearTimers(); setCopy(error && error.code === 1 ? t().permission : t().unavailable); setNext(true, t().retry); };
  window.startGiloaTutorial = function () { return start(true); };
  window.startGiloaTutorialIfNeeded = function () { return start(false); };
  window.resetGiloaTutorial = function () { localStorage.removeItem(DONE_KEY); console.info("GILOA tutorial reset. Reload to replay."); };
  window.completeTutorialMovementForTest = function () { if (active && state === STATES.MOVE) movementSuccess(); };
  window.isGiloaTutorialActive = function () { return active; };
  window.initGiloaFirstJourneyTutorial = function () { root=document.getElementById("giloa-first-tutorial"); };
  window.openGiloaFirstJourneyTutorial = window.startGiloaTutorial;
  window.closeGiloaFirstJourneyTutorial = function (done) { cleanup(!!done, !!done); };
})();

/* v2 live-map state machine. This deliberately replaces the legacy exports above. */
(function () {
  "use strict";
  var DONE="giloa-tutorial-completed", S={HELLO:0,WAKE:1,MAP:2,LOCATE:3,FOUND:4,RECORD:5,WALK:6,REVEAL:7,PHOTO:8,MENU:9,HELP:10};
  var phases=["phase-black","phase-blink","phase-map","phase-dim","phase-clear","phase-error"];
  var images={hello:"07-waving-transparent.png",map:"10-map-transparent.png",explain:"09-explaining-transparent.png",walk:"01-walking-transparent.png",photo:"11-photo-transparent.png",found:"12-surprised-transparent.png"};
  var actionBase=encodeURI("./gilo many appearance/gilo-actions-transparent/"), emotionBase=encodeURI("./gilo many appearance/gilo-emotions-transparent/");
  var strings={
    ko:{next:"다음",skip:"건너뛰기",retry:"다시 시도",help:"해결 방법",skipMove:"이동 확인 건너뛰기",finish:"튜토리얼 마치기",lines:["안녕! 나는 길로야.","어? 깨어났네!","보이지? 길이 나타났어!","우선 우리가 어디 있는지부터 찾아볼까?","찾았다! 지금 네가 있는 곳이 여기야.","이제 기록을 시작해볼까? 네가 움직이는 길이 지도에 남을 거야.","이제 조금 걸어봐!","","사진 미션이야. 실제 사진 버튼으로 여행의 순간을 남겨 봐.","왼쪽 위 메뉴 버튼에서는 기억, 사진, 지나온 길과 방문 기록을 다시 볼 수 있어.","내 도움이 필요하면 ? 버튼의 설명하기에서 ‘길로 부르기’를 눌러 다시 불러 줘."],reveal:["보이죠?","세상이 새로 생긴 게 아니에요.","당신의 세계가 하나 더 생긴 거예요."],finding:"현재 위치를 찾고 있어…",denied:"위치 권한이 거부됐어.",timeout:"GPS 응답 시간이 초과됐어.",off:"위치 서비스가 꺼져 있거나 사용할 수 없어.",failed:"현재 위치를 찾지 못했어.",movement:"실제 이동을 기다리고 있어…"},
    en:{next:"Next",skip:"Skip",retry:"Try again",help:"How to fix",skipMove:"Skip movement check",finish:"Finish",lines:["Hi! I'm Gilo.","Oh? You're awake!","See? The roads have appeared!","First, shall we find where we are?","Found you! This is where you are.","Shall we start recording? The path you take will stay on the map.","Now walk a little!","","Photo mission: save this journey with the real photo button.","The menu button at the top left lets you revisit memories, photos, routes, and visits.","If you need me, open ? → Guide and tap ‘Call Gilo’ to bring me back."],reveal:["See?","The world itself wasn’t newly created.","Your world has grown by one more place."],finding:"Finding your current location…",denied:"Location permission was denied.",timeout:"GPS timed out.",off:"Location services are off or unavailable.",failed:"I couldn't find your location.",movement:"Waiting for real movement…"},
    ja:{next:"次へ",skip:"スキップ",retry:"もう一度",help:"解決方法",skipMove:"移動確認をスキップ",finish:"チュートリアルを終了",lines:["こんにちは！ぼくはギロだよ。","あれ？目が覚めたね！","見える？道が現れたよ！","まず、今いる場所を探してみようか？","見つけた！今いる場所はここだよ。","記録を始めようか？歩いた道が地図に残るよ。","少し歩いてみよう！","","写真ミッションだよ。写真ボタンで旅の瞬間を残そう。","左上のメニューボタンでは、思い出、写真、歩いた道、訪問記録をもう一度見られるよ。","ぼくの助けが必要なら、? → 使い方の「ギロを呼ぶ」でまた呼んでね。"],reveal:["見えるでしょう？","世界が新しく生まれたわけではありません。","あなたの世界が一つ増えたのです。"],finding:"現在地を探しています…",denied:"位置情報の権限が拒否されました。",timeout:"GPSの応答がタイムアウトしました。",off:"位置情報サービスがオフか利用できません。",failed:"現在地を見つけられませんでした。",movement:"実際の移動を待っています…"},
    zh:{next:"下一步",skip:"跳过",retry:"重试",help:"解决方法",skipMove:"跳过移动确认",finish:"完成教程",lines:["你好！我是Gilo。","咦？你醒了！","看见了吗？道路出现了！","先找找我们现在在哪里吧？","找到你了！你现在就在这里。","开始记录吧？你走过的路会留在地图上。","现在走一小段吧！","","照片任务：使用照片按钮留下旅途瞬间。","左上角的菜单按钮可以重新查看回忆、照片、走过的路线和访问记录。","需要我时，请打开 ? → 使用说明，点击“呼叫Gilo”再次叫我。"],reveal:["看见了吗？","并不是世界刚刚诞生了。","而是你的世界又多了一个地方。"],finding:"正在查找当前位置…",denied:"位置权限已被拒绝。",timeout:"GPS响应超时。",off:"位置服务已关闭或不可用。",failed:"无法找到当前位置。",movement:"正在等待真实移动…"},
    es:{next:"Siguiente",skip:"Omitir",retry:"Reintentar",help:"Cómo resolverlo",skipMove:"Omitir comprobación",finish:"Finalizar",lines:["¡Hola! Soy Gilo.","¿Eh? ¡Te has despertado!","¿Lo ves? ¡Los caminos han aparecido!","Primero, ¿buscamos dónde estamos?","¡Te encontré! Estás aquí.","¿Empezamos a registrar? Tu recorrido quedará en el mapa.","¡Camina un poco!","","Misión de foto: guarda un momento del viaje con el botón de foto.","El botón de menú de arriba a la izquierda te permite revisar recuerdos, fotos, rutas y visitas.","Si necesitas mi ayuda, abre ? → Guía y pulsa «Llamar a Gilo» para traerme de vuelta."],reveal:["¿Lo ves?","El mundo no acaba de aparecer.","Es tu mundo el que ahora tiene un lugar más."],finding:"Buscando tu ubicación…",denied:"Se denegó el permiso de ubicación.",timeout:"El GPS agotó el tiempo de espera.",off:"La ubicación está desactivada o no disponible.",failed:"No pude encontrar tu ubicación.",movement:"Esperando movimiento real…"},
    fr:{next:"Suivant",skip:"Passer",retry:"Réessayer",help:"Résoudre",skipMove:"Passer la vérification",finish:"Terminer",lines:["Bonjour ! Je suis Gilo.","Oh ? Tu es réveillé !","Tu vois ? Les chemins sont apparus !","Commençons par trouver où nous sommes.","Je t’ai trouvé ! Tu es ici.","On commence l’enregistrement ? Ton trajet restera sur la carte.","Marche un peu !","","Mission photo : garde un souvenir du voyage avec le bouton photo.","Le bouton de menu en haut à gauche permet de revoir les souvenirs, photos, parcours et visites.","Si tu as besoin de moi, ouvre ? → Guide et touche « Appeler Gilo » pour me rappeler."],reveal:["Tu vois ?","Le monde ne vient pas d’apparaître.","C’est ton monde qui compte maintenant un lieu de plus."],finding:"Recherche de votre position…",denied:"L’autorisation de localisation a été refusée.",timeout:"Le GPS a expiré.",off:"La localisation est désactivée ou indisponible.",failed:"Je n’ai pas trouvé votre position.",movement:"En attente d’un déplacement réel…"}
  };
  var tutorialMeta={
    ko:{permissionDetail:"설정 → 앱 → 길로아 → 권한 → 위치에서 ‘앱 사용 중 허용’을 선택해 주세요.",locationDetail:"위치 서비스를 켜고 창가나 야외에서 다시 시도해 주세요.",confirmTitle:"튜토리얼을 종료할까?",confirmCopy:"? 버튼의 설명하기에서 ‘길로 부르기’로 언제든 다시 볼 수 있어.",keep:"계속 보기",exit:"종료"},
    en:{permissionDetail:"Open Settings → Apps → Giloa → Permissions → Location and choose ‘Allow only while using the app’.",locationDetail:"Turn on location services and try again near a window or outdoors.",confirmTitle:"End the tutorial?",confirmCopy:"You can call Gilo again anytime from ? → Guide → Call Gilo.",keep:"Keep going",exit:"Exit"},
    ja:{permissionDetail:"設定 → アプリ → Giloa → 権限 → 位置情報で「アプリの使用中のみ許可」を選んでください。",locationDetail:"位置情報サービスをオンにして、窓際または屋外でもう一度試してください。",confirmTitle:"チュートリアルを終了しますか？",confirmCopy:"? → 使い方 →「ギロを呼ぶ」からいつでも呼び直せます。",keep:"続ける",exit:"終了"},
    zh:{permissionDetail:"请打开设置 → 应用 → Giloa → 权限 → 位置信息，并选择“仅在使用应用时允许”。",locationDetail:"请开启定位服务，并在窗边或户外重试。",confirmTitle:"要结束教程吗？",confirmCopy:"你可以随时通过 ? → 使用说明 →“呼叫Gilo”再次叫我。",keep:"继续",exit:"退出"},
    es:{permissionDetail:"Abre Ajustes → Aplicaciones → Giloa → Permisos → Ubicación y selecciona «Permitir solo mientras se usa la aplicación».",locationDetail:"Activa la ubicación e inténtalo de nuevo junto a una ventana o al aire libre.",confirmTitle:"¿Terminar el tutorial?",confirmCopy:"Puedes volver a llamar a Gilo desde ? → Guía → Llamar a Gilo.",keep:"Continuar",exit:"Salir"},
    fr:{permissionDetail:"Ouvrez Réglages → Applications → Giloa → Autorisations → Localisation, puis choisissez « Autoriser seulement pendant l’utilisation ».",locationDetail:"Activez la localisation et réessayez près d’une fenêtre ou à l’extérieur.",confirmTitle:"Terminer le tutoriel ?",confirmCopy:"Vous pouvez rappeler Gilo via ? → Guide → Appeler Gilo.",keep:"Continuer",exit:"Quitter"}
  };
  var root,nextBtn,secondBtn,copy,detail,hole,step=S.HELLO,revealLine=0,active=false,locating=false,moveTimer=null,origin=null,pathLength=0,lastError=null,resizeFn=null;
  var tutorialLocationRequestId=0,tutorialLocationResolved=false,locationAdvanceTimer=null,locationReadyHandler=null,mapViewHandler=null;
  function tx(){return strings[typeof currentLang==="string"&&strings[currentLang]?currentLang:"ko"]||strings.ko;}
  function mx(){return tutorialMeta[typeof currentLang==="string"&&tutorialMeta[currentLang]?currentLang:"ko"]||tutorialMeta.ko;}
  function invalidate(){if(typeof map!=="undefined"&&map&&map.invalidateSize)requestAnimationFrame(function(){map.invalidateSize({pan:false});});}
  function phase(name){phases.forEach(function(c){root.classList.remove(c);});root.classList.toggle("gft-guide-right",step===S.HELP);root.classList.add(name);}
  function image(name){var img=document.getElementById("gft-character"),fallback=root.querySelector(".gft-character-placeholder");if(!img)return;img.hidden=false;if(fallback)fallback.hidden=true;img.onerror=function(){img.hidden=true;if(fallback)fallback.hidden=false;};img.src=(name==="found"?emotionBase:actionBase)+images[name];}
  function buttons(primary,secondary,disabled){nextBtn.hidden=!primary;nextBtn.disabled=!!disabled;nextBtn.textContent=primary||"";secondBtn.hidden=!secondary;secondBtn.textContent=secondary||"";}
  function clearTarget(){document.querySelectorAll(".gft-target").forEach(function(el){el.classList.remove("gft-target");});document.querySelectorAll(".gft-target-parent").forEach(function(el){el.classList.remove("gft-target-parent");});hole.className="gft-spotlight";hole.removeAttribute("style");}
  function spotlight(el){clearTarget();if(!el)return;el.classList.add("gft-target");var parent=el.closest("#controls,#top-bar,.leaflet-pane");if(parent)parent.classList.add("gft-target-parent");var r=el.getBoundingClientRect(),p=el.classList.contains("leaflet-marker-icon")?12:8;hole.style.left=Math.max(4,r.left-p)+"px";hole.style.top=Math.max(4,r.top-p)+"px";hole.style.width=Math.max(34,r.width+p*2)+"px";hole.style.height=Math.max(34,r.height+p*2)+"px";hole.style.borderRadius=el.classList.contains("leaflet-marker-icon")?"50%":"18px";hole.classList.add("show");}
  function playerEl(){return typeof playerMarker!=="undefined"&&playerMarker&&playerMarker.getElement?playerMarker.getElement():null;}
  function tutorialPosition(){if(typeof playerMarker!=="undefined"&&playerMarker&&typeof playerMarker.getLatLng==="function")return playerMarker.getLatLng();return typeof currentPos!=="undefined"?currentPos:null;}
  function spotlightCurrentLocation(){var position=tutorialPosition();if(!position||typeof map==="undefined"||!map||typeof map.latLngToContainerPoint!=="function"){spotlight(playerEl());return;}clearTarget();var marker=playerEl();if(marker)marker.classList.add("gft-target");var container=map.getContainer(),rect=container.getBoundingClientRect(),point=map.latLngToContainerPoint(position),size=72;hole.style.left=Math.round(rect.left+point.x-size/2)+"px";hole.style.top=Math.round(rect.top+point.y-size/2)+"px";hole.style.width=size+"px";hole.style.height=size+"px";hole.style.borderRadius="50%";hole.classList.add("show");}
  function validLocation(){
    if(typeof window.hasValidCurrentLocation==="function")return window.hasValidCurrentLocation();
    var position=tutorialPosition();if(!position)return false;
    var lat=Number(position.lat),lng=Number(position.lng);
    return isFinite(lat)&&isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180&&!(lat===0&&lng===0);
  }
  function debugLocation(){
    console.log("[GILOA TUTORIAL LOCATION]",{currentPos:typeof currentPos!=="undefined"?currentPos:null,playerMarker:typeof playerMarker!=="undefined"&&playerMarker&&playerMarker.getLatLng?playerMarker.getLatLng():null,accuracy:typeof currentAccuracy!=="undefined"?currentAccuracy:null,hasValidLocation:validLocation(),tutorialStep:step,resolved:tutorialLocationResolved});
  }
  function completeLocation(requestId){
    if(!active||step!==S.LOCATE||!validLocation())return false;
    if(typeof requestId==="number"&&requestId!==tutorialLocationRequestId)return false;
    tutorialLocationResolved=true;locating=false;lastError=null;tutorialLocationRequestId+=1;
    var position=tutorialPosition();
    if(typeof map!=="undefined"&&map&&position)map.setView(position,Math.max(map.getZoom(),16),{animate:true});
    step=S.FOUND;render();setTimeout(function(){if(active&&step===S.FOUND)spotlightCurrentLocation();},120);setTimeout(function(){if(active&&step===S.FOUND)spotlightCurrentLocation();},600);
    if(locationAdvanceTimer)clearTimeout(locationAdvanceTimer);
    locationAdvanceTimer=setTimeout(function(){if(active&&step===S.FOUND&&tutorialLocationResolved){step=S.RECORD;render();}},1200);
    debugLocation();return true;
  }
  function render(){if(!active)return;var t=tx();root.dataset.step=String(step+1);detail.hidden=true;detail.textContent="";copy.textContent=t.lines[step];buttons(t.next,null,false);clearTarget();
    if(step===S.HELLO){step=S.MAP;render();return;}
    else if(step===S.WAKE){phase("phase-blink");image("found");buttons("눈을 뜨는 중…",null,true);invalidate();setTimeout(function(){if(active&&step===S.WAKE)buttons(tx().next,null,false);},1850);}
    else if(step===S.MAP){phase("phase-map");image("map");invalidate();setTimeout(invalidate,850);}
    else if(step===S.LOCATE){phase("phase-dim");image("map");spotlight(document.getElementById("rec-btn"));debugLocation();}
    else if(step===S.FOUND){phase("phase-dim");image("found");spotlightCurrentLocation();invalidate();}
    else if(step===S.RECORD){phase("phase-dim");image("explain");spotlight(document.getElementById("rec-btn"));}
    else if(step===S.WALK){phase("phase-clear");image("walk");copy.textContent=t.lines[step]+"\n"+t.movement;buttons(null,t.skipMove,true);watchMovement();invalidate();}
    else if(step===S.REVEAL){phase("phase-clear");image("found");copy.textContent=t.reveal[revealLine]||"";buttons(t.next,null,false);invalidate();}
    else if(step===S.PHOTO){phase("phase-dim");image("photo");spotlight(document.getElementById("photo-btn"));invalidate();}
    else if(step===S.MENU){phase("phase-dim");image("explain");spotlight(document.getElementById("ham-btn"));invalidate();}
    else if(step===S.HELP){phase("phase-dim");image("hello");spotlight(document.getElementById("help-btn"));buttons(t.finish,null,false);invalidate();}}
  function classify(error){var c=Number(error&&error.code),m=String(error&&error.message||"");if(c===1||/denied|permission/i.test(m))return{kind:"permission",message:tx().denied};if(c===3||/timeout/i.test(m))return{kind:"timeout",message:tx().timeout};if(c===2||/unavailable/i.test(m))return{kind:"unavailable",message:tx().off};return{kind:"unknown",message:tx().failed};}
  function locationFailed(error,requestId){if(!active||step!==S.LOCATE)return;if(validLocation()){completeLocation(requestId);return;}if(typeof requestId==="number"&&requestId!==tutorialLocationRequestId)return;if(tutorialLocationResolved)return;locating=false;lastError=classify(error);phase("phase-error");copy.textContent=lastError.message;detail.hidden=false;detail.textContent=lastError.kind==="permission"?mx().permissionDetail:mx().locationDetail;buttons(tx().retry,tx().help,false);spotlight(document.getElementById("rec-btn"));debugLocation();}
  function locate(){
    if(locating)return;
    locating=true;tutorialLocationResolved=false;lastError=null;
    var requestId=++tutorialLocationRequestId;
    copy.textContent=tx().finding;detail.hidden=true;buttons(tx().finding,null,true);debugLocation();
    Promise.resolve(typeof requestLocationPermission==="function"?requestLocationPermission():true).then(function(){
      if(requestId!==tutorialLocationRequestId||tutorialLocationResolved)return true;
      if(typeof focusCurrentLocation!=="function")throw new Error("Geolocation unavailable");
      return focusCurrentLocation();
    }).then(function(ok){
      if(requestId!==tutorialLocationRequestId||tutorialLocationResolved)return;
      if(validLocation()){completeLocation(requestId);return;}
      if(!ok)throw new Error("No real position fix");
      throw new Error("No approved current position");
    }).catch(function(error){locationFailed(error,requestId);});
  }
  function watchMovement(){if(moveTimer)return;origin=typeof currentPos!=="undefined"&&currentPos?{lat:currentPos.lat,lng:currentPos.lng}:null;pathLength=typeof pathCoordinates!=="undefined"?pathCoordinates.length:0;moveTimer=setInterval(function(){if(!active||step!==S.WALK||!origin||typeof currentPos==="undefined"||!currentPos)return;var accuracy=typeof currentAccuracy==="number"?currentAccuracy:Infinity,grew=typeof pathCoordinates!=="undefined"&&pathCoordinates.length>pathLength,distance=typeof L!=="undefined"?L.latLng(origin.lat,origin.lng).distanceTo(currentPos):0;if(grew&&accuracy<=60&&distance>=12)movementDone();},800);}
  function movementDone(){if(moveTimer)clearInterval(moveTimer);moveTimer=null;if(typeof scheduleRender==="function")scheduleRender();revealLine=0;step=S.REVEAL;render();}
  function help(){alert(lastError&&lastError.kind==="permission"?"휴대폰 설정에서 길로아의 위치 권한을 ‘앱 사용 중 허용’으로 바꿔 주세요.":"휴대폰 위치 서비스를 켜고 Wi-Fi 또는 모바일 데이터를 활성화한 뒤 야외에서 다시 시도하세요.");}
  function next(){if(!active)return;if(step===S.HELLO||step===S.WAKE){step=S.MAP;render();return;}if(step===S.MAP){step=S.LOCATE;render();return;}if(step===S.LOCATE){locate();return;}if(step===S.FOUND){step=S.RECORD;render();return;}if(step===S.RECORD){if(typeof isRecording!=="undefined"&&!isRecording&&typeof toggleRecording==="function")toggleRecording();step=S.WALK;render();return;}if(step===S.REVEAL){if(revealLine<tx().reveal.length-1){revealLine++;render();}else{step=S.PHOTO;render();}return;}if(step===S.PHOTO){step=S.MENU;render();return;}if(step===S.MENU){step=S.HELP;render();return;}if(step===S.HELP)finish(true);}
  function secondary(){if(step===S.LOCATE&&lastError)help();else if(step===S.WALK)movementDone();}
  function cleanup(){if(moveTimer)clearInterval(moveTimer);moveTimer=null;if(locationAdvanceTimer)clearTimeout(locationAdvanceTimer);locationAdvanceTimer=null;if(locationReadyHandler)window.removeEventListener("giloa:location-ready",locationReadyHandler);locationReadyHandler=null;if(mapViewHandler&&typeof map!=="undefined"&&map&&map.off)map.off("move zoom viewreset",mapViewHandler);mapViewHandler=null;tutorialLocationRequestId+=1;tutorialLocationResolved=false;locating=false;active=false;clearTarget();phases.forEach(function(c){root.classList.remove(c);});root.className="gft";root.dataset.state="IDLE";root.setAttribute("aria-hidden","true");document.body.classList.remove("gft-active","gft-blackout","gft-dim","gft-eyelids","gft-spotlight");var modal=document.getElementById("gft-skip-confirm");if(modal)modal.hidden=true;if(resizeFn)window.removeEventListener("resize",resizeFn);resizeFn=null;invalidate();setTimeout(invalidate,120);}
  function finish(done){if(done)localStorage.setItem(DONE,"1");cleanup();}
  function confirmSkip(){var m=mx();document.getElementById("gft-confirm-title").textContent=m.confirmTitle;document.getElementById("gft-confirm-copy").textContent=m.confirmCopy;document.getElementById("gft-continue").textContent=m.keep;document.getElementById("gft-exit").textContent=m.exit;document.getElementById("gft-skip-confirm").hidden=false;}
  function start(force){if(active)cleanup();if(!force&&["1","true"].indexOf(localStorage.getItem(DONE))>=0)return false;if(typeof window.closeMapTransientPanels==="function")window.closeMapTransientPanels();if(typeof window.toggleSidebar==="function")window.toggleSidebar(false);root=document.getElementById("giloa-first-tutorial");nextBtn=document.getElementById("gft-next");secondBtn=document.getElementById("gft-secondary");copy=document.getElementById("gft-copy");detail=document.getElementById("gft-error-detail");hole=document.getElementById("gft-spotlight");if(!root||!nextBtn||!secondBtn||!hole)return false;active=true;step=S.HELLO;tutorialLocationResolved=false;root.className="gft active show-guide phase-map skip-ready";root.setAttribute("aria-hidden","false");document.body.classList.add("gft-active");document.getElementById("gft-skip").textContent=tx().skip;nextBtn.onclick=next;secondBtn.onclick=secondary;document.getElementById("gft-skip").onclick=function(event){if(event)event.stopPropagation();confirmSkip();};document.getElementById("gft-continue").onclick=function(){document.getElementById("gft-skip-confirm").hidden=true;};document.getElementById("gft-exit").onclick=function(){finish(true);};var dim=root.querySelector(".gft-dim");if(dim)dim.onclick=function(){finish(true);};resizeFn=function(){if(active)render();};locationReadyHandler=function(){if(active&&step===S.LOCATE&&!tutorialLocationResolved)completeLocation(tutorialLocationRequestId);};mapViewHandler=function(){if(active&&step===S.FOUND)spotlightCurrentLocation();};window.addEventListener("giloa:location-ready",locationReadyHandler);window.addEventListener("resize",resizeFn);if(typeof map!=="undefined"&&map&&map.on)map.on("move zoom viewreset",mapViewHandler);render();return true;}
  window.onGiloaTutorialLocationError=function(error){if(active&&step===S.LOCATE){if(validLocation())completeLocation(tutorialLocationRequestId);else locationFailed(error,tutorialLocationRequestId);}};window.startGiloaTutorial=function(){return start(true);};window.startGiloaTutorialIfNeeded=function(){return start(false);};window.resetGiloaTutorial=function(){localStorage.removeItem(DONE);};window.completeTutorialMovementForTest=function(){if(active&&step===S.WALK)movementDone();};window.isGiloaTutorialActive=function(){return active;};window.initGiloaFirstJourneyTutorial=function(){};window.openGiloaFirstJourneyTutorial=window.startGiloaTutorial;window.closeGiloaFirstJourneyTutorial=function(done){finish(!!done);};
})();
