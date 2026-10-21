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

/* Screen-wide control guide: annotations only, no GPS or journey mutations. */
(function () {
  "use strict";
  var languages=["ko","en","ja","zh","es","fr"], DONE="giloa-tutorial-completed";
  var legacyActive=window.isGiloaTutorialActive, legacyClose=window.closeGiloaFirstJourneyTutorial;
  var active=false,root,layer,svg,footer,observer,frame=0,settle=0,mode="map",annotated=[],pointerStart=null,pointerMoved=false;
  var words={
    map:["화면 한눈에 보기","Your screen at a glance","画面をひと目で","一眼了解屏幕","La pantalla de un vistazo","Votre écran en un regard"],
    sidebar:["메뉴 한눈에 보기","Menu at a glance","メニューをひと目で","一眼了解菜单","El menú de un vistazo","Le menu en un regard"],
    photo:["사진 메뉴 한눈에 보기","Photo menu at a glance","写真メニューをひと目で","一眼了解照片菜单","El menú de fotos","Le menu des photos"],
    help:["도움말 메뉴 한눈에 보기","Help menu at a glance","ヘルプをひと目で","一眼了解帮助菜单","El menú de ayuda","Le menu d’aide"],
    daily:["오늘의 할 일","Today's tasks","今日のミッション","今日任务","Tareas de hoy","Les tâches du jour"],
    hud:["나의 길로와 성장","Your Gilo and progress","ギロと成長記録","我的Gilo与成长","Tu Gilo y progreso","Votre Gilo et vos progrès"],
    tour:["주변 여행지","Nearby places","周辺のスポット","附近地点","Lugares cercanos","Les lieux proches"],
    hint:["버튼을 눌러 살펴보세요. 빈 지도나 ×를 누르면 안내가 닫혀요.","Explore the buttons. Tap the empty map or × to close this guide.","ボタンを試してみよう。地図の空白か×で案内を閉じます。","点击按钮体验。点地图空白处或×关闭说明。","Explora los botones. Toca el mapa vacío o × para cerrar la guía.","Essayez les boutons. Touchez la carte vide ou × pour fermer le guide."],
    detail:["열린 화면의 버튼을 함께 설명해요.","All the buttons on this screen are explained together.","この画面のボタンをまとめて説明します。","一起说明当前屏幕上的按钮。","Aquí se explican todos los botones de esta pantalla.","Les boutons de cet écran sont expliqués ensemble."],
    done:["안내 끝내기","Finish guide","案内を閉じる","结束说明","Terminar guía","Fermer le guide"],
    back:["지도로 돌아가기","Back to map","地図に戻る","返回地图","Volver al mapa","Revenir à la carte"],
    menuKey:["메뉴|기록 · 지도 표시","Menu|Records · map layers","メニュー|記録・地図表示","菜单|记录与地图图层","Menú|Registros y capas","Menu|Parcours et carte"],
    tasksKey:["할 일|오늘의 미션과 진행 상태","Tasks|Today's missions and progress","ミッション|今日の目標と進み具合","任务|今日目标与进度","Tareas|Misiones y progreso de hoy","Tâches|Missions et progrès du jour"],
    tourKey:["주변 관광지|지도 주변의 여행지 찾기","Nearby places|Find places around the map","周辺スポット|地図の周りの観光地を探す","附近景点|查找地图周边的地点","Lugares cercanos|Busca sitios alrededor del mapa","Lieux proches|Trouvez des lieux sur la carte"],
    photoKey:["사진|촬영·내 사진 가져오기","Photos|Take or import a photo","写真|撮影・写真の取り込み","照片|拍摄或导入照片","Fotos|Hacer o importar una foto","Photos|Prendre ou importer une photo"],
    directionsKey:["길찾기|카카오맵으로 길 안내","Directions|Route with KakaoMap","道案内|KakaoMapで道案内","路线导航|打开KakaoMap导航","Cómo llegar|Ruta con KakaoMap","Itinéraire|Trajet avec KakaoMap"],
    recordKey:["현재 위치 · 기록|위치 확인·기록 시작/중단","Location · record|Locate yourself; start or stop a route","現在地・記録|現在地の確認・記録の開始／停止","位置与记录|定位、开始或停止记录","Ubicación · registro|Localízate e inicia o detén la ruta","Position · parcours|Se situer ; démarrer ou arrêter"],
    helpKey:["도움말|설명·문의·언어 설정","Help|Guide, contact and language","ヘルプ|使い方・問い合わせ・言語","帮助|说明、联系与语言设置","Ayuda|Guía, contacto e idioma","Aide|Guide, contact et langue"],
    growthKey:["나의 길로|레벨·여행색·성장 기록","My Gilo|Level, travel style and progress","マイギロ|レベル・旅の色・成長記録","我的Gilo|等级、旅行风格与成长","Mi Gilo|Nivel, estilo y progreso","Mon Gilo|Niveau, style et progrès"],
    layers:["지도에 표시할 여행지·시설을 고르세요.","Choose the places and facilities shown on the map.","地図に表示する場所・施設を選びます。","选择地图上显示的地点与设施。","Elige los lugares y servicios del mapa.","Choisissez les lieux et services affichés."],
    photos:["저장한 사진과 촬영 위치를 다시 봐요.","Revisit saved photos and where they were taken.","保存した写真と撮影場所を見返します。","查看保存的照片与拍摄地点。","Revisa tus fotos y dónde las hiciste.","Revoyez les photos et leurs lieux de prise de vue."],
    routes:["걸은 경로를 저장하거나 GPX를 불러와요.","Save walked routes or import GPX files.","歩いたルートを保存・GPXを読み込みます。","保存走过的路线或导入GPX文件。","Guarda recorridos o importa archivos GPX.","Enregistrez vos parcours ou importez un GPX."],
    visits:["방문한 장소와 방문 기록을 확인해요.","See the places you visited and your visit history.","訪れた場所と訪問記録を確認します。","查看去过的地点与访问记录。","Consulta tus lugares e historial de visitas.","Retrouvez les lieux visités et votre historique."],
    items:["받은 아이템과 지역 뱃지를 확인해요.","See earned items and regional badges.","獲得したアイテムと地域バッジを確認します。","查看获得的物品与地区徽章。","Consulta objetos y medallas regionales.","Consultez vos objets et badges régionaux."],
    camera:["카메라를 열어 새 사진을 찍어요.","Open the camera to take a new photo.","カメラを開いて写真を撮ります。","打开相机拍摄新照片。","Abre la cámara para hacer una foto.","Ouvrez l’appareil photo pour une nouvelle photo."],
    gallery:["휴대폰 사진을 가져와 지도에 남겨요.","Import phone photos onto your map.","スマホの写真を地図に取り込みます。","把手机照片导入地图。","Importa las fotos del móvil al mapa.","Importez les photos du téléphone sur la carte."],
    timeTrace:["같은 장소의 예전 사진과 지금을 비교해요.","Compare a place's old photo with today's view.","同じ場所の昔の写真と今を比べます。","比较同一地点过去的照片与现在。","Compara una foto antigua con el lugar actual.","Comparez une ancienne photo au lieu actuel."],
    contact:["문의 · 불편 신고","Questions and feedback","質問・不具合の連絡","提问与问题反馈","Consultas y problemas","Questions et remarques"],
    guide:["버튼 설명 · 길로 부르기","Button guide and Call Gilo","ボタン説明・ギロを呼ぶ","按钮说明与呼叫Gilo","Guía y Llamar a Gilo","Guide et Appeler Gilo"],
    market:["지도 주변 시세 보기","Prices around the map","地図周辺の相場を見る","查看附近价格信息","Precios cerca del mapa","Prix autour de la carte"],
    language:["표시 언어 선택","Choose display language","表示言語を選ぶ","选择显示语言","Elegir idioma","Choisir la langue"],
    toggle:["지도 표시를 켜거나 꺼요.","Turn this map layer on or off.","地図表示をオン・オフにします。","开启或关闭此地图图层。","Activa o desactiva esta capa.","Activez ou désactivez cette couche."],
    expand:["세부 항목 펼치기 / 접기","Expand / collapse details","詳細を開く／閉じる","展开或收起详细选项","Abrir / cerrar detalles","Ouvrir / fermer les détails"],
    close:["닫고 지도로 돌아가요.","Close this screen and return to the map.","閉じて地図に戻ります。","关闭此屏幕并返回地图。","Cierra esta pantalla y vuelve al mapa.","Fermez cet écran et revenez à la carte."],
    task:["눌러서 이 미션을 시작하거나 확인해요.","Tap to start or check this mission.","押してミッションを始める・確認します。","点击开始或查看此任务。","Toca para empezar o revisar la misión.","Touchez pour commencer ou voir la mission."],
    details:["내 여행색과 성장 내용을 펼쳐 봐요.","Expand your travel style and growth details.","旅の色と成長の詳細を開きます。","展开旅行风格与成长详情。","Abre tu estilo de viaje y progreso.","Dépliez votre style de voyage et vos progrès."],
    source:["데이터 출처","Data credits","データの出典","数据来源","Fuentes de datos","Sources des données"],
    account:["계정과 기록 보호","Account and record protection","アカウントと記録の保護","账户与记录保护","Cuenta y protección","Compte et protection"],
    privacy:["위치·사진 정보 안내","Location and photo privacy","位置・写真情報の案内","位置与照片隐私","Privacidad de ubicación y fotos","Confidentialité des positions et photos"],
    story:["길로아 소개와 이야기","About Giloa and its story","ギロアの紹介と物語","Giloa介绍与故事","Giloa y su historia","Giloa et son histoire"],
    routeRange:["− / + 로 저장할 시간 범위를 바꿔요.","Use − / + to choose the route's time range.","− / + で保存する時間範囲を変えます。","用 − / + 选择要保存的时间范围。","Usa − / + para elegir el intervalo de la ruta.","Choisissez la période du parcours avec − / +."],
    routeSave:["선택한 시간의 발걸음을 GPX 파일로 저장해요.","Save the selected route period as a GPX file.","選んだ時間のルートをGPXで保存します。","把所选时间段的路线保存为GPX文件。","Guarda el periodo elegido como archivo GPX.","Enregistrez la période choisie dans un GPX."],
    routeImport:["기기에 있는 GPX 파일을 지도에 불러와요.","Load a GPX file from your device onto the map.","端末のGPXファイルを地図に読み込みます。","把设备上的GPX文件导入地图。","Importa un archivo GPX del dispositivo al mapa.","Importez sur la carte un GPX de votre appareil."],
    atlas:["지역별 체류 시간과 획득한 뱃지를 살펴봐요.","See time spent in each region and earned badges.","地域ごとの滞在時間と獲得バッジを見ます。","查看各地区停留时间与获得的徽章。","Consulta el tiempo por región y las medallas.","Consultez les séjours par région et les badges."]
  };
  function text(key){var index=languages.indexOf(typeof currentLang==="string"?currentLang:"ko");return (words[key]||words.hint)[Math.max(0,index)];}
  function visible(el){if(!el)return false;var r=el.getBoundingClientRect(),s=getComputedStyle(el);if(!(r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)!==0))return false;for(var parent=el.parentElement;parent&&parent!==document.body;parent=parent.parentElement){var ps=getComputedStyle(parent),pr=parent.getBoundingClientRect();if(/auto|scroll|hidden/.test(ps.overflowY)&&(r.bottom<=pr.top||r.top>=pr.bottom))return false;if(/auto|scroll|hidden/.test(ps.overflowX)&&(r.right<=pr.left||r.left>=pr.right))return false;}return true;}
  function open(id,cls){var el=document.getElementById(id);return el&&el.classList.contains(cls||"open");}
  function detectMode(){if(open("help-popup","show"))return"help";if(open("sidebar"))return"sidebar";if(open("photo-menu"))return"photo";if(open("daily-task-panel"))return"daily";if(open("hud","expanded"))return"hud";var tour=document.getElementById("tour-panel");if(tour&&!tour.classList.contains("collapsed"))return"tour";return"map";}
  function descriptors(){var list=[];function add(selector,key,inline,side){var el=document.querySelector(selector);if(visible(el))list.push({el:el,key:key,inline:!!inline,side:side||"left"});}
    if(mode==="map"){
      add("#ham-btn","menuKey",false,"right");add("#daily-task-tag","tasksKey",false,"below");add("#tour-header","tourKey",false,"below");
      add("#hud-mini-avatar","growthKey",false,"right");add("#photo-btn","photoKey");add("#traffic-btn","directionsKey");add("#rec-btn","recordKey");add("#help-btn","helpKey",false,"above");
    }else if(mode==="sidebar"){
      add("#map-layer-header","layers",true);add("#tab-photo","photos",true);add("#tab-gpx","routes",true);add("#tab-visit","visits",true);add("#tab-item","items",true);
      [["sources","source"],["account","account"],["privacy","privacy"],["about","story"]].forEach(function(row){add("#info-link-"+row[0],row[1],true);});
      if(visible(document.getElementById("panel-gpx"))){add(".gpx-dial-row","routeRange",true);add("#gpx-save-btn","routeSave",true);add("#gpx-import-btn","routeImport",true);}
      add(".region-badge-entry-card","atlas",true);
      if(open("map-layer-panel","expanded")){
        document.querySelectorAll("#map-layer-panel .map-layer-group-toggle").forEach(function(el){if(visible(el))list.push({el:el,key:"toggle",inline:true});});
        document.querySelectorAll("#map-layer-panel .map-layer-group-expand").forEach(function(el){if(visible(el))list.push({el:el,key:"expand",inline:true});});
        document.querySelectorAll("#map-layer-panel .map-layer-item").forEach(function(el){if(visible(el))list.push({el:el,key:"toggle",inline:true});});
      }
    }else if(mode==="photo"){
      ["camera","gallery","timeTrace"].forEach(function(key,i){add("#photo-menu .photo-menu-item:nth-of-type("+(i+1)+")",key,true);});
    }else if(mode==="help"){
      [["ask","contact"],["info","guide"],["market","market"],["settings","language"]].forEach(function(row){add("#htab-"+row[0],row[1],true);});
    }else if(mode==="daily"){
      document.querySelectorAll(".daily-task-action").forEach(function(el){if(visible(el))list.push({el:el,key:"task",inline:true});});
    }else if(mode==="hud"){add("#rpg-details-toggle","details",true);}
    else if(mode==="tour"){add("#tour-expand-btn","expand",true);add("#tour-header","tourKey",false,"below");}
    return list;
  }
  function clearInline(){annotated.forEach(function(el){var note=el.querySelector(":scope > .sg-inline-description");if(note)note.remove();el.classList.remove("sg-inline-host");});annotated=[];}
  function addInline(item){var note=document.createElement("span");note.className="sg-inline-description";note.textContent=text(item.key);item.el.classList.add("sg-inline-host");item.el.appendChild(note);annotated.push(item.el);}
  function box(el){var r=el.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};}
  function overlaps(a,b,p){p=p||0;return Math.max(0,Math.min(a.x+a.w+p,b.x+b.w+p)-Math.max(a.x-p,b.x-p))*Math.max(0,Math.min(a.y+a.h+p,b.y+b.h+p)-Math.max(a.y-p,b.y-p));}
  function svgEl(tag,attrs){var el=document.createElementNS("http://www.w3.org/2000/svg",tag);Object.keys(attrs).forEach(function(key){el.setAttribute(key,attrs[key]);});svg.appendChild(el);return el;}
  function choosePosition(target,w,h,side,obstacles,titleWidth,alignRight){
    if(side==="inside")return{x:Math.max(52,target.x+52),y:Math.max(8,Math.min(innerHeight-h-8,target.y+(target.h-h)/2)),w:Math.min(w,innerWidth-64),h:h,side:"inside"};
    var order=[side].concat(["left","right","below","above"].filter(function(s){return s!==side;})),best,bestScore=Infinity;
    order.forEach(function(direction,index){[14,68,122,176].forEach(function(gap){[0,-h-10,h+10,-2*(h+10),2*(h+10)].forEach(function(offset){
      var x,y;if(direction==="left"||direction==="right"){x=direction==="left"?target.x-w-gap:target.x+target.w+gap;y=target.y+(target.h-h)/2+offset;}
      else{x=target.x+offset;y=direction==="below"?target.y+target.h+gap:target.y-h-gap;}
      var candidate={x:Math.max(8,Math.min(innerWidth-w-8,x)),y:Math.max(8,Math.min(innerHeight-h-8,y)),w:w,h:h,side:direction,titleWidth:titleWidth,alignRight:alignRight};
      var score=index*6+Math.abs(offset)*.3+(gap-14)*.5+Math.hypot(candidate.x+w/2-target.x-target.w/2,candidate.y+h/2-target.y-target.h/2)*.4;
      obstacles.forEach(function(other){score+=overlaps(candidate,other,2)*1000;});
      score+=overlaps(candidate,target,3)*1000;
      var route=connector(target,candidate);
      if(!route)score+=100000;
      else obstacles.forEach(function(other){if(segmentHits(route.a,route.corner,other)||segmentHits(route.corner,route.b,other))score+=100000;});
      if(score<bestScore){best=candidate;bestScore=score;}
    });});});
    if(bestScore>500){for(var gy=8;gy<=innerHeight-h-8;gy+=12){for(var gx=8;gx<=innerWidth-w-8;gx+=12){var fallback={x:gx,y:gy,w:w,h:h,side:gx+w<=target.x?"left":gx>=target.x+target.w?"right":gy>=target.y+target.h?"below":"above",titleWidth:titleWidth,alignRight:alignRight};var fallbackScore=Math.hypot(gx+w/2-target.x-target.w/2,gy+h/2-target.y-target.h/2);obstacles.concat([target]).forEach(function(other){fallbackScore+=overlaps(fallback,other,2)*1000;});var fallbackRoute=connector(target,fallback);if(!fallbackRoute)fallbackScore+=100000;else obstacles.forEach(function(other){if(segmentHits(fallbackRoute.a,fallbackRoute.corner,other)||segmentHits(fallbackRoute.corner,fallbackRoute.b,other))fallbackScore+=100000;});if(fallbackScore<bestScore){best=fallback;bestScore=fallbackScore;}}}}
    return best;
  }
  function segmentHits(a,b,r){if(a.x===b.x)return a.x>r.x-3&&a.x<r.x+r.w+3&&Math.max(a.y,b.y)>r.y-3&&Math.min(a.y,b.y)<r.y+r.h+3;return a.y>r.y-3&&a.y<r.y+r.h+3&&Math.max(a.x,b.x)>r.x-3&&Math.min(a.x,b.x)<r.x+r.w+3;}
  function connector(target,label){var a,b,corner;
    if(label.side==="inside")return null;
    if(label.side==="left"){a={x:target.x-4,y:target.y+target.h/2};b={x:label.x+label.w+3,y:label.y+label.h/2};corner={x:b.x,y:a.y};}
    else if(label.side==="right"){a={x:target.x+target.w+4,y:target.y+target.h/2};b={x:label.x-3,y:label.y+label.h/2};corner={x:b.x,y:a.y};}
    else if(label.side==="below"){var belowX=label.x+(label.alignRight?label.w-label.titleWidth/2:label.titleWidth/2);a={x:Math.max(target.x+12,Math.min(target.x+target.w-12,belowX)),y:target.y+target.h+4};b={x:belowX,y:label.y-3};corner={x:a.x,y:b.y};}
    else{var aboveX=label.x+(label.alignRight?label.w-label.titleWidth/2:label.titleWidth/2);a={x:Math.max(target.x+12,Math.min(target.x+target.w-12,aboveX)),y:target.y-4};b={x:aboveX,y:label.y+label.h+3};corner={x:a.x,y:b.y};}
    var length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(length>96)return null;return{a:a,b:b,corner:corner,length:length};
  }
  function positionFooter(){footer.classList.remove("sg-compact");var h=footer.offsetHeight,w=innerWidth,top=innerHeight*.38;
    footer.style.left=w>600?"50%":"12px";footer.style.width="";
    if(mode==="map"){var controls=document.getElementById("controls");if(w<=600&&controls)top=Math.max(172,Math.min(top,controls.getBoundingClientRect().top-h-16));}
    else if(mode==="sidebar"){var content=document.getElementById("sidebar-content"),r=content.getBoundingClientRect();footer.style.left="12px";footer.style.width=Math.min(300,r.width-24)+"px";footer.style.transform="none";top=r.top+Math.max(10,(r.height-h)/2);if(open("map-layer-panel","expanded")||visible(document.getElementById("panel-gpx"))||r.height<h+20){footer.classList.add("sg-compact");top=12;}}
    else{var panel=document.getElementById(mode==="photo"?"photo-menu":mode==="help"?"help-content-box":mode==="daily"?"daily-task-panel":mode==="hud"?"hud":"tour-panel");if(panel){top=panel.getBoundingClientRect().top-h-12;if(top<12){footer.classList.add("sg-compact");top=12;}}}
    if(mode!=="sidebar")footer.style.transform="";
    footer.style.top=Math.max(8,Math.min(innerHeight-footer.offsetHeight-8,top))+"px";
  }
  function observe(){if(!observer)return;["sidebar","photo-menu","help-popup","daily-task-panel","hud","tour-panel","map-layer-panel"].forEach(function(id){var el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:["class","hidden","aria-expanded"],childList:true,subtree:true});});}
  function render(){if(!active)return;if(observer)observer.disconnect();clearInline();mode=detectMode();root.dataset.guideScreen=mode;document.body.classList.toggle("sg-map-active",mode==="map");footer.hidden=mode!=="map"&&mode!=="photo";
    layer.querySelectorAll(".sg-label").forEach(function(el){el.remove();});svg.replaceChildren();
    footer.querySelector("h2").textContent=text(mode);footer.querySelector("p").textContent=text(mode==="map"?"hint":"detail");
    document.getElementById("sg-done").setAttribute("aria-label",text("done"));
    var list=descriptors();list.filter(function(item){return item.inline;}).forEach(addInline);list=list.filter(function(item){return visible(item.el);});positionFooter();
    var obstacles=[footer.hidden?{x:-1,y:-1,w:0,h:0}:box(footer)].concat(list.map(function(item){return box(item.el);})),labels=[];
    list.forEach(function(item,index){var r=box(item.el);
      if(item.inline)return;
      var label=document.createElement("div"),body=document.createElement("div"),title=document.createElement("strong"),description=document.createElement("p"),pair=text(item.key).split("|");
      label.className="sg-label";label.dataset.target=item.el.id;title.textContent=pair[0];description.textContent=pair[1]||"";body.append(title,description);label.append(body);var width=item.key==="recordKey"?170:item.key==="tasksKey"?130:item.key==="helpKey"?(innerWidth<=340?100:110):innerWidth<=340&&(item.key==="photoKey"||item.key==="directionsKey")?130:155;label.style.width=Math.min(width,innerWidth-98)+"px";layer.appendChild(label);
      var titleRange=document.createRange();titleRange.selectNodeContents(title);var titleWidth=titleRange.getBoundingClientRect().width;
      var position=choosePosition(r,label.offsetWidth,label.offsetHeight,item.side,obstacles.filter(function(o,i){return i!==index+1;}),titleWidth,item.key==="tasksKey");label.style.left=position.x+"px";label.style.top=position.y+"px";label.dataset.side=position.side;obstacles.push(position);labels.push({target:r,label:position,el:label,key:item.el.id});
      var planned=connector(r,position);if(planned)[[planned.a,planned.corner],[planned.corner,planned.b]].forEach(function(piece){obstacles.push({x:Math.min(piece[0].x,piece[1].x),y:Math.min(piece[0].y,piece[1].y),w:Math.abs(piece[0].x-piece[1].x),h:Math.abs(piece[0].y-piece[1].y),owner:label});});
    });
    var lines=[];labels.forEach(function(entry){var line=connector(entry.target,entry.label);if(!line)return;var pieces=[[line.a,line.corner],[line.corner,line.b]],blocked=false;
      obstacles.forEach(function(r){if(r===entry.label||r.owner===entry.el)return;pieces.forEach(function(segment){if(segmentHits(segment[0],segment[1],r))blocked=true;});});
      lines.forEach(function(previous){pieces.forEach(function(segment){previous.forEach(function(p){var r={x:Math.min(p[0].x,p[1].x),y:Math.min(p[0].y,p[1].y),w:Math.abs(p[0].x-p[1].x),h:Math.abs(p[0].y-p[1].y)};if(segmentHits(segment[0],segment[1],r))blocked=true;});});});
      if(!blocked){svgEl("path",{d:"M "+line.a.x+" "+line.a.y+" L "+line.corner.x+" "+line.corner.y+" L "+line.b.x+" "+line.b.y,"data-length":line.length,"data-target":entry.key});svgEl("circle",{cx:line.a.x,cy:line.a.y,r:2,class:"sg-endpoint"});lines.push(pieces);}
    });observe();
  }
  function schedule(){if(!active||frame)return;frame=requestAnimationFrame(function(){frame=0;render();});}
  function clicked(event){if(!active)return;var target=event&&event.target;if(target&&target.closest){
    if(target.closest("#giloa-first-tutorial"))return;
    if(target.closest("#sidebar .close-btn,#help-popup .help-close,#daily-task-panel .daily-task-close,#hud-close,#tour-close-btn,[data-region-atlas-close]")){finish(true);return;}
    var control=target.closest("button,a,input,select,textarea,[role=button],#sidebar,#photo-menu,#help-content-box,#daily-task-panel,#hud,#top-bar,#tour-panel,#controls,#help-btn,.leaflet-control,.leaflet-marker-icon,.leaflet-popup");
    var blankMap=!control&&(target.closest("#map-wrap")||target.id==="sidebar-overlay"||target.id==="photo-menu-overlay"||target.id==="help-popup");
    if(blankMap){if(pointerMoved&&event.detail!==0){pointerMoved=false;return;}finish(true);return;}
  }schedule();clearTimeout(settle);settle=setTimeout(schedule,240);}
  function pointerDown(event){if(active){pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};pointerMoved=false;}}
  function pointerMove(event){if(active&&pointerStart&&event.pointerId===pointerStart.id&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>10)pointerMoved=true;}
  function back(){if(mode==="sidebar"&&typeof toggleSidebar==="function")toggleSidebar(false);if(mode==="photo"&&typeof closePhotoMenu==="function")closePhotoMenu();if(mode==="help"&&typeof toggleHelp==="function")toggleHelp();if(mode==="daily"&&typeof toggleDailyTasks==="function")toggleDailyTasks(false);if(mode==="hud"&&typeof toggleHud==="function")toggleHud();if(mode==="tour"&&typeof closeTourPanel==="function")closeTourPanel();clicked();}
  function finish(done){if(!active)return;active=false;if(observer)observer.disconnect();observer=null;cancelAnimationFrame(frame);frame=0;clearTimeout(settle);clearInline();document.removeEventListener("click",clicked,true);document.removeEventListener("scroll",schedule,true);document.removeEventListener("pointerdown",pointerDown,true);document.removeEventListener("pointermove",pointerMove,true);pointerStart=null;pointerMoved=false;window.removeEventListener("resize",schedule);window.removeEventListener("orientationchange",clicked);root.className="gft";root.setAttribute("aria-hidden","true");root.removeAttribute("data-guide-screen");if(layer)layer.remove();document.body.classList.remove("gft-active","sg-map-active");if(done)try{localStorage.setItem(DONE,"1");}catch(_){} }
  function start(force){if(active)finish(false);if(legacyActive&&legacyActive()&&legacyClose)legacyClose(false);if(!force&&["1","true"].indexOf(localStorage.getItem(DONE))>=0)return false;
    root=document.getElementById("giloa-first-tutorial");if(!root)return false;if(typeof window.closeMapTransientPanels==="function")window.closeMapTransientPanels();if(typeof window.toggleSidebar==="function")window.toggleSidebar(false);
    active=true;root.className="gft active gft-overview-mode";root.setAttribute("aria-hidden","false");document.body.classList.add("gft-active");
    layer=document.createElement("section");layer.className="sg-overview";layer.setAttribute("aria-label",text("map"));var shade=document.createElement("div");shade.className="sg-shade";layer.appendChild(shade);svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.classList.add("sg-wires");svg.setAttribute("aria-hidden","true");layer.appendChild(svg);
    footer=document.createElement("div");footer.className="sg-footer";var img=document.createElement("img");img.alt="";img.src=encodeURI("./gilo many appearance/gilo-tutorial-welcome-transparent.png");var body=document.createElement("div"),heading=document.createElement("h2"),hint=document.createElement("p");
    var doneButton=document.createElement("button");doneButton.id="sg-done";doneButton.className="sg-close";doneButton.type="button";doneButton.textContent="×";doneButton.setAttribute("aria-label",text("done"));doneButton.onclick=function(){finish(true);};body.append(heading,hint);footer.append(img,body,doneButton);layer.appendChild(footer);root.appendChild(layer);
    observer=new MutationObserver(schedule);document.addEventListener("click",clicked,true);document.addEventListener("scroll",schedule,true);document.addEventListener("pointerdown",pointerDown,true);document.addEventListener("pointermove",pointerMove,true);window.addEventListener("resize",schedule);window.addEventListener("orientationchange",clicked);render();return true;
  }
  window.startGiloaTutorial=function(){return start(true);};window.startGiloaTutorialIfNeeded=function(){return start(false);};window.openGiloaFirstJourneyTutorial=window.startGiloaTutorial;window.closeGiloaFirstJourneyTutorial=function(done){finish(!!done);};window.isGiloaTutorialActive=function(){return active;};
})();
