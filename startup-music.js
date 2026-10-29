// Playback starts only inside an explicit music-button click, never on load or ordinary map taps.
(function () {
    "use strict";
    var audio = document.getElementById("adventure-music-audio");
    var toggle = document.getElementById("adventure-music-toggle");
    var start = document.getElementById("adventure-music-start");
    var silent = document.getElementById("gsi-start");
    var silentCopy = document.getElementById("gsi-start-copy");
    var status = document.getElementById("adventure-music-status");
    if (!audio || !toggle || !start || !silent) return;
    var words = {
        ko: ["음악과 함께 시작", "음악 없이 시작", "시작 음악: 길로의 모험 · 한 번 재생", "길로의 모험 재생", "길로의 모험 정지", "음악을 재생하지 못했어요. 위쪽 음표 버튼을 눌러 다시 시도해주세요.", "길로의 모험 재생 중", "시작 음악이 꺼졌어요."],
        en: ["Start with music", "Start without music", "Music: Gilo’s Adventure · plays once", "Play Gilo’s Adventure", "Stop Gilo’s Adventure", "Music could not play. Try the music button above.", "Gilo’s Adventure is playing", "Startup music is off."],
        ja: ["音楽と一緒に始める", "音楽なしで始める", "音楽：ギロの冒険・1回再生", "ギロの冒険を再生", "ギロの冒険を停止", "再生できませんでした。上の音符ボタンで再試行してください。", "ギロの冒険を再生中", "音楽を停止しました。"],
        zh: ["伴随音乐开始", "无音乐开始", "音乐：Gilo的冒险 · 播放一次", "播放Gilo的冒险", "停止Gilo的冒险", "无法播放，请点击上方音符按钮重试。", "正在播放Gilo的冒险", "开始音乐已关闭。"],
        es: ["Empezar con música", "Empezar sin música", "Música: La aventura de Gilo · una vez", "Reproducir La aventura de Gilo", "Detener La aventura de Gilo", "No se pudo reproducir. Prueba el botón de música de arriba.", "Suena La aventura de Gilo", "Música desactivada."],
        fr: ["Commencer en musique", "Commencer sans musique", "Musique : L’aventure de Gilo · une fois", "Écouter L’aventure de Gilo", "Arrêter L’aventure de Gilo", "Lecture impossible. Réessayez avec le bouton de musique en haut.", "L’aventure de Gilo est en cours", "Musique désactivée."]
    };
    var failed = false, pending = false, request = 0, startingWithMusic = false;
    audio.volume = 0.35;
    function copy() {
        var lang = typeof currentLang === "string" ? currentLang : document.documentElement.lang || "ko";
        return words[lang.slice(0, 2)] || words.en;
    }
    function render() {
        var w = copy(), playing = !audio.paused && !audio.ended;
        start.textContent = w[0];
        if (silentCopy && silentCopy.textContent !== w[1]) silentCopy.textContent = w[1];
        silent.setAttribute("aria-label", w[1]);
        document.getElementById("adventure-music-caption").textContent = w[2];
        toggle.setAttribute("aria-label", w[playing || pending ? 4 : 3]);
        toggle.title = w[playing || pending ? 4 : 3];
        toggle.setAttribute("aria-pressed", String(playing || pending));
        toggle.setAttribute("aria-busy", String(pending));
        status.textContent = w[failed ? 5 : playing ? 6 : 7];
        status.classList.toggle("music-screen-reader", !failed);
        status.classList.toggle("adventure-music-error", failed);
    }
    function stop() {
        request++; pending = false; failed = false;
        audio.pause(); audio.currentTime = 0; render();
    }
    function play() {
        var id = ++request;
        failed = false; pending = true;
        var greeting = document.getElementById("gilo-welcome-audio");
        if (greeting) greeting.pause();
        render();
        // Call synchronously in the click handler, before any promise or onboarding transition.
        try {
            Promise.resolve(audio.play()).then(function () {
                if (id !== request) return;
                pending = false; render();
            }).catch(function () {
                if (id !== request) return;
                pending = false; failed = true; render();
            });
        } catch (_) { pending = false; failed = true; render(); }
    }
    start.addEventListener("click", function () {
        play();
        // Reuse the app's existing onboarding completion, permissions and tutorial flow.
        startingWithMusic = true;
        try { silent.click(); } finally { startingWithMusic = false; }
    });
    silent.addEventListener("click", function () { if (!startingWithMusic) stop(); });
    toggle.addEventListener("click", function (event) {
        event.stopPropagation();
        if (pending || !audio.paused) stop(); else play();
    });
    ["play", "pause", "ended"].forEach(function (event) { audio.addEventListener(event, render); });
    audio.addEventListener("error", function () { request++; pending = false; failed = true; render(); });
    // Never mix the existing welcome speech and the new song.
    var greeting = document.getElementById("gilo-welcome-audio");
    if (greeting) greeting.addEventListener("play", stop);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
    window.addEventListener("pagehide", stop);
    if (silentCopy) new MutationObserver(render).observe(silentCopy, { childList: true, subtree: true, characterData: true });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    render();
})();
