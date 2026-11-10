var tutorialStepIndex = 0;
var tutorialRecordCompleted = false;
var tutorialRecordingPrepared = false;
var TUTORIAL_GUIDE_FALLBACK = encodeURI("./gilo many appearance/gilo-scenes-transparent/01-first-meeting-transparent.png");
var TUTORIAL_GUIDE_IMAGES = [
    encodeURI("./gilo many appearance/gilo-actions-transparent/07-waving-transparent.png"),
    encodeURI("./gilo many appearance/gilo-actions-transparent/10-map-transparent.png"),
    encodeURI("./gilo many appearance/gilo-actions-transparent/09-explaining-transparent.png"),
    encodeURI("./gilo many appearance/gilo-actions-transparent/11-photo-transparent.png"),
    encodeURI("./gilo many appearance/gilo-actions-transparent/16-memo-transparent.png"),
    encodeURI("./gilo many appearance/gilo-emotions-transparent/11-curious-transparent.png"),
    encodeURI("./gilo many appearance/gilo-actions-transparent/06-thumbs-up-transparent.png")
];
var TUTORIAL_GUIDE_IMAGE_POSITIONS = ["center", "center", "center", "center", "center", "center", "center"];
var tutorialStepsByLang = {
    ko: [
        { target:"#rec-btn", title:"자, 첫걸음을 내디뎌 볼까?", copy:"여행을 시작할 때 이 버튼을 누르면 현재 위치부터 네가 걸은 길이 지도에 기록돼.", pose:"focus", requiresAction:"record", waiting:"기록 버튼을 눌러 줘" },
        { target:"#photo-btn", title:"멋진 풍경을 발견했네.", copy:"촬영한 사진이나 이미 찍어둔 사진을 가져와 이 장소를 기록할 수 있어.", pose:"point-left" },
        { target:"#tour-panel", title:"주변에 어떤 이야기가 숨어 있을까?", copy:"가까운 명소와 축제를 살펴보고 다음 목적지를 골라 봐. 도착한 장소는 여행의 기억이 돼.", pose:"peek" },
        { target:"#ham-btn", title:"지나온 길이 문득 궁금해졌어.", copy:"메뉴를 열면 사진, 발걸음, 방문한 장소와 모은 아이템을 언제든 다시 볼 수 있어.", pose:"peek" },
        { target:"#help-btn", title:"여행 중 길을 잃거나 궁금한 게 생겼어?", copy:"여기서 안내를 다시 보거나 언어와 지도 설정을 바꿀 수 있어. 언제든 나를 불러 줘.", pose:"hello" },
        { title:"이제 준비 끝!", copy:"밖으로 나가\n너만의 대동여지도를 만들어 보자.", pose:"cheer" }
    ],
    en: [
        { title:"Hi! I'm Gilo.", copy:"From today, I'll help record your travels.\n\nA journey begins the moment you take your first step, not when you reach the destination.", pose:"hello" },
        { title:"This map is still empty.", copy:"Every path you walk will gradually become a map that belongs only to you.", pose:"peek" },
        { target:"#rec-btn", title:"Before we leave, let's start recording.", copy:"Tap it to move the map to your location and begin saving your GPS route. Try the highlighted control below.", pose:"focus", requiresAction:"record", waiting:"Tap record" },
        { target:"#photo-btn", title:"You found a wonderful view!", copy:"Take a photo now or import one from your gallery. Photos with location data are placed on the map automatically.", pose:"point-left" },
        { target:"#ham-btn", title:"You can revisit every journey later.", copy:"The menu keeps your photos, footsteps, and saved travel records together.", pose:"peek" },
        { target:"#help-btn", title:"Come find me whenever you have a question.", copy:"Help lets you replay this guide or change the language.", pose:"hello" },
        { title:"You're ready now.", copy:"Step outside and create your own map of the world.", pose:"cheer" }
    ],
    ja: [
        { title:"こんにちは！ぼくはギロ。", copy:"今日から君の旅を一緒に記録するよ。\n\n旅は目的地ではなく、最初の一歩から始まるんだ。", pose:"hello" },
        { title:"この地図はまだ空っぽだよ。", copy:"これから歩いた道が、少しずつ君だけの地図になっていくよ。", pose:"peek" },
        { target:"#rec-btn", title:"出発する前に記録を始めよう。", copy:"押すと地図が現在地へ移動し、GPS経路の保存が始まるよ。光っている場所を押してね。", pose:"focus", requiresAction:"record", waiting:"記録を押してね" },
        { target:"#photo-btn", title:"すてきな景色を見つけたね！", copy:"今撮影することも、アルバムの写真を読み込むこともできるよ。位置情報があれば自動で地図に残るよ。", pose:"point-left" },
        { target:"#ham-btn", title:"これまでの旅はいつでも見返せるよ。", copy:"メニューで写真、足あと、保存した旅の記録を確認できるよ。", pose:"peek" },
        { target:"#help-btn", title:"困ったときはいつでもぼくを呼んでね。", copy:"ヘルプではこの案内をもう一度見たり、言語を変更できるよ。", pose:"hello" },
        { title:"これで準備完了！", copy:"外へ出て、君だけの大東輿地図を作ろう。", pose:"cheer" }
    ],
    zh: [
        { title:"你好！我是吉路。", copy:"从今天开始，我会陪你记录旅行。\n\n旅行不是从抵达目的地开始，而是从你迈出第一步开始。", pose:"hello" },
        { title:"这张地图现在还是空的。", copy:"从现在起，你走过的路会一点点变成只属于你的地图。", pose:"peek" },
        { target:"#rec-btn", title:"出发前，先开始记录吧。", copy:"点击后地图会移动到当前位置，并开始保存GPS路线。请点击下方高亮的位置。", pose:"focus", requiresAction:"record", waiting:"请点击记录" },
        { target:"#photo-btn", title:"发现了很棒的风景！", copy:"可以现在拍照，也可以从相册导入。带有位置信息的照片会自动记录在地图上。", pose:"point-left" },
        { target:"#ham-btn", title:"走过的旅程随时都能再看。", copy:"菜单中可以查看照片、足迹和保存的旅行记录。", pose:"peek" },
        { target:"#help-btn", title:"有问题时，随时来找我。", copy:"帮助中可以重看教程，也可以更改语言。", pose:"hello" },
        { title:"现在准备好了。", copy:"走到户外，创造属于你的大东舆地图吧。", pose:"cheer" }
    ],
    es: [
        { title:"¡Hola! Soy Gilo.", copy:"Desde hoy te ayudaré a registrar tus viajes.\n\nUn viaje comienza con el primer paso, no al llegar al destino.", pose:"hello" },
        { title:"Este mapa todavía está vacío.", copy:"Cada camino que recorras se convertirá poco a poco en un mapa solo tuyo.", pose:"peek" },
        { target:"#rec-btn", title:"Antes de salir, empecemos a registrar.", copy:"Toca aquí para centrar el mapa en tu ubicación y guardar tu ruta GPS. Prueba el control resaltado.", pose:"focus", requiresAction:"record", waiting:"Toca Grabar" },
        { target:"#photo-btn", title:"¡Has encontrado una vista maravillosa!", copy:"Haz una foto o impórtala de tu galería. Si contiene ubicación, aparecerá automáticamente en el mapa.", pose:"point-left" },
        { target:"#ham-btn", title:"Puedes volver a cada viaje cuando quieras.", copy:"El menú reúne tus fotos, recorridos y registros de viaje guardados.", pose:"peek" },
        { target:"#help-btn", title:"Ven a buscarme cuando tengas una duda.", copy:"En Ayuda puedes repetir esta guía o cambiar el idioma.", pose:"hello" },
        { title:"Ya está todo listo.", copy:"Sal y crea tu propio mapa del mundo.", pose:"cheer" }
    ],
    fr: [
        { title:"Bonjour ! Je suis Gilo.", copy:"Dès aujourd’hui, je t’aiderai à garder la trace de tes voyages.\n\nUn voyage commence au premier pas, pas à l’arrivée.", pose:"hello" },
        { title:"Cette carte est encore vide.", copy:"Chaque chemin que tu emprunteras deviendra peu à peu une carte qui n’appartient qu’à toi.", pose:"peek" },
        { target:"#rec-btn", title:"Avant de partir, lançons l’enregistrement.", copy:"Appuie ici pour centrer la carte sur ta position et enregistrer ton parcours GPS. Essaie le bouton mis en évidence.", pose:"focus", requiresAction:"record", waiting:"Appuie sur Enregistrer" },
        { target:"#photo-btn", title:"Tu as trouvé un beau paysage !", copy:"Prends une photo ou importe-en une depuis ta galerie. Les photos géolocalisées sont placées automatiquement sur la carte.", pose:"point-left" },
        { target:"#ham-btn", title:"Tu peux retrouver chaque voyage quand tu veux.", copy:"Le menu réunit tes photos, tes parcours et tes souvenirs de voyage enregistrés.", pose:"peek" },
        { target:"#help-btn", title:"Viens me voir dès que tu as une question.", copy:"Dans l’aide, tu peux revoir ce guide ou changer de langue.", pose:"hello" },
        { title:"Tout est prêt.", copy:"Sors et crée ta propre carte du monde.", pose:"cheer" }
    ]
};
function getTutorialSteps() { return tutorialStepsByLang[currentLang] || tutorialStepsByLang.ko; }

function prepareTutorialRecordingStep() {
    if (tutorialRecordingPrepared) return;
    tutorialRecordingPrepared = true;
    autoRecordingNoticePending = false;
    dismissAutoRecordingNotice();
    if (isRecording) {
        stopRecording();
        return;
    }
    clearAutoRecordingTimer();
    clearTrackingRetryTimer();
    releaseScreenAwake();
    stopTracking();
    syncRecordingUI();
    scheduleSave();
}

function renderTutorialGuideImage(stepIndex) {
    var img = document.getElementById("giloa-guide-image");
    if (!img) return;
    var source = TUTORIAL_GUIDE_IMAGES[stepIndex] || TUTORIAL_GUIDE_IMAGES[0];
    var card = document.querySelector(".giloa-tutorial-card");
    if (card) {
        card.classList.add("has-step-art");
        card.classList.toggle("transparent-guide-art", stepIndex <= 5);
    }
    img.onerror = function() {
        img.onerror = null;
        img.src = TUTORIAL_GUIDE_FALLBACK;
    };
    if (img.getAttribute("src") !== source) img.src = source;
    img.style.objectPosition = TUTORIAL_GUIDE_IMAGE_POSITIONS[stepIndex] || "center";
    img.classList.remove("step-image-enter");
    void img.offsetWidth;
    img.classList.add("step-image-enter");
}

function clearTutorialPlacement(card) {
    if (!card) return;
    card.className = "giloa-tutorial-card";
    card.style.left = "";
    card.style.top = "";
    card.style.right = "";
    card.style.bottom = "";
    card.style.width = "";
}

function placeTutorialCard(step) {
    var card = document.querySelector(".giloa-tutorial-card");
    if (!card) return;
    clearTutorialPlacement(card);
    card.classList.add("pose-" + (step.pose || "hello"));
    card.classList.add("anchored-bottom");
    var controls = document.getElementById("controls");
    if (controls && window.innerWidth <= 700) {
        var controlsRect = controls.getBoundingClientRect();
        var safeLeft = 12;
        var safeRight = Math.floor(controlsRect.left - 12);
        var safeWidth = safeRight - safeLeft;
        if (safeWidth >= 248 && safeWidth < 430) {
            card.classList.add("controls-safe");
            card.style.left = safeLeft + "px";
            card.style.width = safeWidth + "px";
        }
    }
    if (!step.target) return;
    var target = document.querySelector(step.target);
    if (!target) return;
    var targetRect = target.getBoundingClientRect();
    if (!targetRect.width || !targetRect.height || targetRect.top <= window.innerHeight * .45) return;
    var gap = 18;
    var desiredBottom = Math.ceil(window.innerHeight - targetRect.top + gap);
    var cardHeight = card.offsetHeight || 190;
    var maxBottom = Math.max(16, window.innerHeight - cardHeight - 16);
    card.style.bottom = Math.min(desiredBottom, maxBottom) + "px";
}

function removeTutorialTarget() {
    document.querySelectorAll(".tutorial-target").forEach(function(el) {
        el.classList.remove("tutorial-target");
    });
    document.querySelectorAll(".tutorial-target-parent").forEach(function(el) { el.classList.remove("tutorial-target-parent"); });
}

function renderTutorialStep() {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap) return;
    var tutorialSteps = getTutorialSteps();
    var step = tutorialSteps[tutorialStepIndex] || tutorialSteps[0];
    var title = document.getElementById("giloa-tutorial-title");
    var copy = document.getElementById("giloa-tutorial-copy");
    var prev = document.getElementById("giloa-tutorial-prev");
    var next = document.getElementById("giloa-tutorial-next");
    var progress = document.getElementById("giloa-tutorial-progress");
    var text = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (step.requiresAction === "record" && !tutorialRecordCompleted) prepareTutorialRecordingStep();
    if (title) title.textContent = step.title;
    if (copy) copy.textContent = step.copy;
    if (prev) prev.style.visibility = tutorialStepIndex === 0 ? "hidden" : "visible";
    if (prev) prev.textContent = text.previous || "이전";
    if (next) next.textContent = tutorialStepIndex === tutorialSteps.length - 1 ? (text.start || "시작") : (text.next || "다음");
    var waitingForRecord = step.requiresAction === "record" && !tutorialRecordCompleted;
    if (next) {
        next.disabled = waitingForRecord;
        if (waitingForRecord) next.textContent = step.waiting || "기록을 눌러 줘";
    }
    if (progress) {
        progress.innerHTML = tutorialSteps.map(function(_, idx) {
            return '<span class="giloa-tutorial-dot' + (idx === tutorialStepIndex ? " active" : "") + '"></span>';
        }).join("");
    }
    removeTutorialTarget();
    if (step.target) {
        var target = document.querySelector(step.target);
        if (target) {
            target.classList.add("tutorial-target");
            var stackingParent = target.closest("#controls, #top-bar");
            if (stackingParent) stackingParent.classList.add("tutorial-target-parent");
        }
    }
    placeTutorialCard(step);
    renderTutorialGuideImage(tutorialStepIndex);
}

function closeGiloaGuideTutorial(markDone) {
    var wrap = document.getElementById("giloa-tutorial");
    if (wrap) {
        wrap.classList.remove("show");
        wrap.setAttribute("aria-hidden", "true");
    }
    removeTutorialTarget();
if (markDone) safeStorageSet(TUTORIAL_DONE_KEY, "1");
}

function openGiloaGuideTutorial(force) {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap) return;
    var completed = safeStorageGet(TUTORIAL_DONE_KEY);
    if (!force && (completed === "1" || completed === "true")) return;
    tutorialStepIndex = 0;
    tutorialRecordCompleted = false;
    tutorialRecordingPrepared = false;
    wrap.classList.add("show");
    wrap.setAttribute("aria-hidden", "false");
    renderTutorialStep();
}

function initGiloaGuideTutorial() {
    var wrap =
        document.getElementById("giloa-tutorial");

    if (!wrap || wrap.dataset.bound === "1") {
        return;
    }

    wrap.dataset.bound = "1";

    var prev =
        document.getElementById("giloa-tutorial-prev");

    var next =
        document.getElementById("giloa-tutorial-next");

    var skip =
        document.getElementById("giloa-tutorial-skip");

    if (prev) {
        prev.addEventListener("click", function() {
            tutorialStepIndex = Math.max(
                0,
                tutorialStepIndex - 1
            );

            renderTutorialStep();
        });
    }

    if (next) {
        next.addEventListener("click", function() {
            var tutorialSteps = getTutorialSteps();

            if (
                tutorialStepIndex >=
                tutorialSteps.length - 1
            ) {
                closeGiloaGuideTutorial(true);
                return;
            }

            tutorialStepIndex += 1;
            renderTutorialStep();
        });
    }

    if (skip) {
        skip.addEventListener("click", function() {
            closeGiloaGuideTutorial(true);
        });
    }

    var dim =
        wrap.querySelector(".giloa-tutorial-dim");

    if (dim) {
        dim.addEventListener("click", function() {
            closeGiloaGuideTutorial(true);
        });
    }

    /*
     * 기록 버튼을 누른 것만으로 완료하지 않고,
     * 안내 확인 후 실제 기록이 시작됐을 때만 완료한다.
     */
    window.addEventListener(
        "giloa:recording-started",
        function() {
            var steps = getTutorialSteps();
            var step = steps[tutorialStepIndex];

            if (
                !wrap.classList.contains("show") ||
                !step ||
                step.requiresAction !== "record"
            ) {
                return;
            }

            tutorialRecordCompleted = true;

            setTimeout(function() {
                tutorialStepIndex = Math.min(
                    tutorialStepIndex + 1,
                    getTutorialSteps().length - 1
                );

                renderTutorialStep();
            }, 80);
        }
    );

    window.addEventListener(
        "resize",
        function() {
            if (wrap.classList.contains("show")) {
                renderTutorialStep();
            }
        }
    );

    prepareGuideCharacterImage();
}

var INTRO_SCREEN_I18N = {
    ko:{skip:"건너뛰기",next:"다음",subtitle:"나의 대동여지도",replay:"길로아 이야기 다시 보기",screens:[
        ["…이제 제 말이 들리나요?\n전 길로예요.\n제가 왜 길로아의 안내자가 되었는지 들려드릴게요."],
        ["길로는 늘 익숙한 곳에서\n비슷한 하루를 보내고 있었어요.\n하지만 창밖에는\n아직 만나지 못한 세상이 있었죠."],
        ["그래서 길로는\n처음 보는 길을 직접 걸어보기로 했어요.\n지도에 길은 이미 있었지만,\n가보기 전까지는 길로의 세계가 아니었으니까요."],
        ["걷고, 머물고, 보고, 느끼고, 기억하면서…\n길로는 알게 되었어요.\n그렇게 한 장소가 비로소\n'나의 세계'가 된다는 걸."],
        ["새로운 곳을 만날 때마다\n길로의 세계도 조금씩 넓어졌어요.\n그래서 처음 온 여행자와 함께 걷기로 했죠.\n그렇게 길로는 길로아의 안내자가 되었어요."],
        ["이제 당신 차례예요.\n저 어둠 속에 아무것도 없는 게 아니에요.\n아직 당신이 만나지 못했을 뿐이죠.\n아직 만나지 못한 세상, 이제 같이 만나러 가요."]
    ]},
    en:{skip:"Skip",next:"Next",subtitle:"My own map of the world",replay:"Replay the GILOA story",screens:[
        ["…Can you hear me now?\nI’m Gilo.\nLet me tell you why I became GILOA’s guide."],
        ["Gilo spent similar days\nin the same familiar place.\nBut beyond the window lay a world\nGilo had not yet met."],
        ["So Gilo decided to walk\nan unfamiliar road in person.\nThe roads were already on the map,\nbut until Gilo went there they weren’t Gilo’s world."],
        ["Walking, staying, seeing, feeling, remembering…\nGilo came to understand.\nThat is how a place finally becomes\npart of ‘my world.’"],
        ["With every new place,\nGilo’s world grew a little wider.\nSo Gilo chose to walk beside new travelers.\nThat is how Gilo became GILOA’s guide."],
        ["Now it’s your turn.\nThe darkness doesn’t mean there is nothing there.\nYou simply haven’t met it yet.\nA world you haven’t met — let’s go meet it together."]
    ]},
    ja:{skip:"スキップ",next:"次へ",subtitle:"私だけの大東輿地図",replay:"GILOAの物語をもう一度見る",screens:[
        ["…今度は、ぼくの声が聞こえますか？\nぼくはギロです。\nなぜGILOAの案内役になったのか、お話ししますね。"],
        ["ギロはいつも慣れ親しんだ場所で、\n似たような毎日を過ごしていました。\nけれど窓の向こうには、\nまだ出会っていない世界がありました。"],
        ["そこでギロは、初めて見る道を\n自分の足で歩いてみることにしました。\n地図には道がありました。でも実際に訪れるまでは、\nまだギロの世界ではなかったのです。"],
        ["歩いて、立ち止まって、見て、感じて、記憶して…\nギロは気づきました。\nそうして一つの場所が、\n初めて『自分の世界』になるのだと。"],
        ["新しい場所に出会うたび、\nギロの世界も少しずつ広がりました。\nだから初めて訪れる旅人と一緒に歩くと決めたのです。\nそうしてギロはGILOAの案内役になりました。"],
        ["次は、あなたの番です。\nあの暗闇に何もないわけではありません。\nまだあなたが出会っていないだけ。\nまだ出会っていない世界へ、今から一緒に会いに行こう。"]
    ]},
    zh:{skip:"跳过",next:"下一步",subtitle:"我的大东舆地图",replay:"重温 GILOA 的故事",screens:[
        ["……现在能听懂我说话了吗？\n我是 Gilo。\n让我告诉你，我为什么成为了 GILOA 的向导。"],
        ["Gilo 总是在熟悉的地方，\n度过相似的每一天。\n但窗外还有一个\n尚未相遇的世界。"],
        ["于是 Gilo 决定亲自走上\n一条从未见过的路。\n地图上早已有这些道路，\n但在亲自抵达之前，它们还不是 Gilo 的世界。"],
        ["行走、停留、看见、感受、记住……\nGilo 渐渐明白了。\n一个地方正是这样，\n最终成为“我的世界”。"],
        ["每遇见一个新地方，\nGilo 的世界也会宽阔一点。\n于是他决定陪着初来的旅行者一起走。\n就这样，Gilo 成为了 GILOA 的向导。"],
        ["现在轮到你了。\n那片黑暗里并非什么都没有，\n只是你还没有遇见而已。\n那尚未相遇的世界，现在一起去遇见吧。"]
    ]},
    fr:{skip:"Passer",next:"Suivant",subtitle:"Ma propre carte du monde",replay:"Revoir l’histoire de GILOA",screens:[
        ["…Tu m’entends maintenant ?\nJe m’appelle Gilo.\nLaisse-moi te raconter pourquoi je suis devenu le guide de GILOA."],
        ["Gilo passait des journées semblables\ndans un lieu familier.\nMais derrière la fenêtre s’étendait un monde\nqu’il n’avait pas encore rencontré."],
        ["Alors Gilo décida d’emprunter lui-même\nun chemin inconnu.\nLes chemins existaient déjà sur la carte,\nmais avant d’y aller ils n’étaient pas son monde."],
        ["Marcher, rester, voir, ressentir, se souvenir…\nGilo finit par comprendre.\nC’est ainsi qu’un lieu devient enfin\nune partie de « mon monde »."],
        ["À chaque nouveau lieu,\nson monde s’agrandissait un peu.\nAlors il choisit de marcher aux côtés des voyageurs.\nC’est ainsi que Gilo devint le guide de GILOA."],
        ["Maintenant, c’est à toi.\nL’obscurité ne signifie pas qu’il n’y a rien.\nTu ne l’as simplement pas encore rencontré.\nCe monde inconnu, allons le découvrir ensemble."]
    ]},
    es:{skip:"Saltar",next:"Siguiente",subtitle:"Mi propio mapa del mundo",replay:"Volver a ver la historia de GILOA",screens:[
        ["…¿Ahora puedes entenderme?\nSoy Gilo.\nDéjame contarte por qué me convertí en el guía de GILOA."],
        ["Gilo pasaba días parecidos\nen un lugar conocido.\nPero tras la ventana había un mundo\nque todavía no había descubierto."],
        ["Así que Gilo decidió recorrer en persona\nun camino desconocido.\nLos caminos ya estaban en el mapa,\npero hasta visitarlos no eran su mundo."],
        ["Caminar, quedarse, ver, sentir, recordar…\nGilo llegó a comprenderlo.\nAsí es como un lugar se convierte por fin\nen parte de «mi mundo»."],
        ["Con cada lugar nuevo,\nsu mundo se hacía un poco más grande.\nPor eso decidió caminar junto a quienes llegan por primera vez.\nAsí fue como Gilo se convirtió en el guía de GILOA."],
        ["Ahora es tu turno.\nLa oscuridad no significa que allí no haya nada.\nSimplemente, todavía no lo has descubierto.\nEse mundo desconocido, vamos a conocerlo juntos."]
    ]}
};

var ONBOARDING_I18N = {
    ko:{language:"언어",title:"내 주변에는\n무엇이 있을까?",description:"길로와 함께 주변의 새로운 장소를 발견해보세요.",tour:"여행지",food:"음식점",library:"도서관",lodging:"숙박",restroom:"화장실",trail:"산책로",you:"지금, 여기",giloHint:"주변을 둘러봐요!",places:"장소",trails:"산책로",badges:"배지",missions:"미션",start:"START",story:"길로 이야기",details:"기능 자세히 보기",guideTitle:"길로아 기능 자세히 보기",worldLabel:"현재 위치 주변의 여행지, 음식점, 도서관, 숙박, 화장실과 산책로를 길로가 안내하는 지도",storyClose:"이야기 닫기",storyBack:"소개로 돌아가기"},
    en:{language:"Language",title:"What is around\nme?",description:"Discover new places nearby with Gilo.",tour:"Sights",food:"Food",library:"Library",lodging:"Stay",restroom:"Restroom",trail:"Trails",you:"YOU",giloHint:"Look around!",places:"PLACES",trails:"TRAILS",badges:"BADGES",missions:"MISSIONS",start:"START",story:"Gilo's story",details:"See how it works",guideTitle:"Explore GILOA's features",worldLabel:"A discovery map where Gilo guides you to sights, food, libraries, lodging, restrooms and trails around your location",storyClose:"Close story",storyBack:"Back to introduction"},
    ja:{language:"言語",title:"私の周りには\n何がある？",description:"ギロと一緒に、近くの新しい場所を見つけよう。",tour:"観光地",food:"グルメ",library:"図書館",lodging:"宿泊",restroom:"トイレ",trail:"散策路",you:"今、ここ",giloHint:"周りを見てみよう！",places:"場所",trails:"散策路",badges:"バッジ",missions:"ミッション",start:"START",story:"ギロの物語",details:"機能を詳しく見る",guideTitle:"GILOAの機能を見る",worldLabel:"現在地の周りにある観光地、飲食店、図書館、宿泊施設、トイレ、散策路をギロが案内する地図",storyClose:"物語を閉じる",storyBack:"紹介に戻る"},
    zh:{language:"语言",title:"我的周围\n有什么？",description:"和Gilo一起发现附近的新地点。",tour:"景点",food:"美食",library:"图书馆",lodging:"住宿",restroom:"洗手间",trail:"步道",you:"我在这里",giloHint:"看看周围吧！",places:"地点",trails:"步道",badges:"徽章",missions:"任务",start:"START",story:"Gilo的故事",details:"查看详细功能",guideTitle:"查看GILOA功能",worldLabel:"Gilo为你介绍当前位置周围的景点、美食、图书馆、住宿、洗手间和步道",storyClose:"关闭故事",storyBack:"返回介绍"},
    fr:{language:"Langue",title:"Qu'y a-t-il\nautour de moi ?",description:"Découvrez de nouveaux lieux à proximité avec Gilo.",tour:"Visites",food:"Repas",library:"Bibliothèque",lodging:"Séjour",restroom:"Toilettes",trail:"Sentiers",you:"ICI",giloHint:"Regardez autour !",places:"LIEUX",trails:"SENTIERS",badges:"BADGES",missions:"MISSIONS",start:"START",story:"L'histoire de Gilo",details:"Voir les fonctions",guideTitle:"Découvrir les fonctions de GILOA",worldLabel:"Une carte où Gilo vous guide vers les visites, restaurants, bibliothèques, hébergements, toilettes et sentiers proches",storyClose:"Fermer l'histoire",storyBack:"Retour à l'introduction"},
    es:{language:"Idioma",title:"¿Qué hay\na mi alrededor?",description:"Descubre nuevos lugares cercanos con Gilo.",tour:"Lugares",food:"Comida",library:"Biblioteca",lodging:"Alojamiento",restroom:"Baños",trail:"Senderos",you:"AQUÍ",giloHint:"¡Mira alrededor!",places:"LUGARES",trails:"SENDEROS",badges:"INSIGNIAS",missions:"MISIONES",start:"START",story:"La historia de Gilo",details:"Ver las funciones",guideTitle:"Descubre las funciones de GILOA",worldLabel:"Un mapa donde Gilo te guía a lugares, restaurantes, bibliotecas, alojamientos, baños y senderos cercanos",storyClose:"Cerrar la historia",storyBack:"Volver a la introducción"}
};

// Story assets remain intact but are assigned to the image element only after the optional story is opened.
var INTRO_SCREEN_FRAMES = [
    encodeURI("./gilo many appearance/gilo-awake-transparent.png"),
    "./assets/gilo/story/gilo_story_01.png",
    "./assets/gilo/story/gilo_story_05.png",
    "./assets/gilo/story/gilo_story_10.png",
    "./assets/gilo/story/gilo_story_20.png",
    "./assets/gilo/story/gilo_story_23.png"
];

var introStoryState={
    active:false,
    mode:"",
    screen:1,
    returnToOnboarding:false,
    completeToMap:false,
    lastArt:""
};

var giloaStoryOpenedFromHelp = false;
function introStoryText(){return INTRO_SCREEN_I18N[normalizeLang(currentLang)]||INTRO_SCREEN_I18N.ko;}
function onboardingText(){return ONBOARDING_I18N[normalizeLang(currentLang)]||ONBOARDING_I18N.ko;}
function hasSavedIntroLanguage(){var raw=safeStorageGet(LANGUAGE_PREFERENCE_KEY);return safeStorageGet(LANGUAGE_SELECTED_KEY)==="1"&&["ko","en","ja","zh","fr","es"].indexOf(raw)>=0;}
function setOnboardingText(id,value){var element=document.getElementById(id);if(element)element.textContent=value||"";}
function renderGiloaOnboarding(){
    var words=onboardingText(),language=normalizeLang(currentLang),select=document.getElementById("gsi-language-select"),visual=document.getElementById("gsi-world-visual");
    setOnboardingText("gsi-language-label",words.language);setOnboardingText("gsi-onboarding-title",words.title);setOnboardingText("gsi-onboarding-description",words.description);
    [["gsi-place-tour",words.tour],["gsi-place-food",words.food],["gsi-place-library",words.library],["gsi-place-lodging",words.lodging],["gsi-place-restroom",words.restroom],["gsi-place-trail",words.trail],["gsi-you-copy",words.you],["gsi-gilo-hint",words.giloHint],["gsi-hint-places",words.places],["gsi-hint-trails",words.trails],["gsi-hint-badges",words.badges],["gsi-hint-missions",words.missions],["gsi-start-copy",words.start],["gsi-story-open-copy",words.story],["gsi-detail-open-copy",words.details],["gsi-feature-guide-title",words.guideTitle]].forEach(function(pair){setOnboardingText(pair[0],pair[1]);});
    if(select){select.value=language;select.setAttribute("aria-label",words.language);}if(visual)visual.setAttribute("aria-label",words.worldLabel);
    var start=document.getElementById("gsi-start"),storyOpen=document.getElementById("gsi-story-open"),detailOpen=document.getElementById("gsi-detail-open"),guideImage=document.getElementById("gsi-feature-guide-image");
    if(start)start.setAttribute("aria-label",words.start);if(storyOpen)storyOpen.setAttribute("aria-label",words.story);if(detailOpen)detailOpen.setAttribute("aria-label",words.details);if(guideImage)guideImage.alt=words.guideTitle;
}
function openGiloaFeatureGuide(event){
    if(event){event.preventDefault();event.stopPropagation();}
    var guide=document.getElementById("gsi-feature-guide"),image=document.getElementById("gsi-feature-guide-image");if(!guide)return false;
    if(image&&!image.getAttribute("src"))image.src=image.getAttribute("data-src");guide.hidden=false;guide.setAttribute("aria-hidden","false");return false;
}
function closeGiloaFeatureGuide(event){if(event){event.preventDefault();event.stopPropagation();}var guide=document.getElementById("gsi-feature-guide");if(guide){guide.hidden=true;guide.setAttribute("aria-hidden","true");}return false;}
function selectIntroLanguage(languageCode){
    var language=normalizeLang(languageCode);if(["ko","en","ja","zh","fr","es"].indexOf(language)<0)return;
    safeStorageSet(LANGUAGE_PREFERENCE_KEY,language);safeStorageSet(LANGUAGE_SELECTED_KEY,"1");currentLang=language;applyUILang(language);syncLanguageButtons(language);
    if(introStoryState.mode==="story")renderIntroStory();else renderGiloaOnboarding();
}
function showGiloaOnboarding(){
    var root=document.getElementById("giloa-story-intro"),onboarding=document.getElementById("gsi-onboarding"),story=document.getElementById("gsi-story");if(!root||!onboarding)return false;
    introStoryState={active:true,mode:"onboarding",screen:1,returnToOnboarding:true,completeToMap:false,lastArt:""};root.className="gsi active onboarding-mode";root.setAttribute("aria-hidden","false");root.setAttribute("aria-labelledby","gsi-onboarding-title");onboarding.hidden=false;if(story)story.hidden=true;document.body.classList.add("gsi-active");
    // 버튼 연결을 언어/텍스트 렌더링보다 먼저 한다. renderGiloaOnboarding()이나
    // applyUILang() 쪽에서 예외가 나더라도(예: 특정 DOM이 예상과 다른 상태) 최소한
    // 재생/닫기/카드 클릭은 항상 동작하도록 하기 위해서다. 실제로 "온보딩 화면은
    // 뜨는데 아무 버튼도 안 눌린다"는 증상이 이 순서 때문에 발생할 수 있었다.
    var select=document.getElementById("gsi-language-select"),start=document.getElementById("gsi-start"),close=document.getElementById("gsi-onboarding-close"),storyOpen=document.getElementById("gsi-story-open"),detailOpen=document.getElementById("gsi-detail-open");if(select)select.onchange=function(){selectIntroLanguage(select.value);};if(start)start.onclick=finishGiloaOnboarding;if(close)close.onclick=finishGiloaOnboarding;if(storyOpen)storyOpen.onclick=function(event){event.preventDefault();event.stopPropagation();showGiloStory({returnToOnboarding:true});};if(detailOpen)detailOpen.onclick=openGiloaFeatureGuide;
    document.querySelectorAll("[data-gsi-guide-close]").forEach(function(element){element.onclick=closeGiloaFeatureGuide;});
    root.onclick=function(event){if(event.target===root||event.target.classList.contains("gsi-glow"))finishGiloaOnboarding();};
    try {
        if(hasSavedIntroLanguage()){currentLang=normalizeLang(safeStorageGet(LANGUAGE_PREFERENCE_KEY));applyUILang(currentLang);}
        renderGiloaOnboarding();
    } catch (error) {
        console.warn("showGiloaOnboarding text render failed", error && error.message);
    }
    return true;
}
function startMapTutorial(){if(typeof window.startGiloaTutorial==="function")window.startGiloaTutorial();}
function finishGiloaOnboarding(){
    var root=document.getElementById("giloa-story-intro"),language=normalizeLang(currentLang);safeStorageSet(LANGUAGE_PREFERENCE_KEY,language);safeStorageSet(LANGUAGE_SELECTED_KEY,"1");safeStorageSet(FIRST_MEETING_DONE_KEY,"1");safeStorageSet(INTRO_STORY_SEEN_KEY,"true");introStoryState.active=false;introStoryState.mode="";
    closeGiloaFeatureGuide();if(root){root.className="gsi";root.setAttribute("aria-hidden","true");}document.body.classList.remove("gsi-active");if(typeof map!=="undefined"&&map&&map.invalidateSize)setTimeout(function(){map.invalidateSize();},60);setTimeout(startMapTutorial,120);
    runInitStep("startup location", focusStartupLocation);
}
function setIntroArt(source){
    var root=document.getElementById("giloa-story-intro"),art=document.getElementById("gsi-art");if(!root||!art||!source||introStoryState.lastArt===source)return;introStoryState.lastArt=source;root.classList.add("changing");
    art.onerror=function(){root.classList.add("image-failed");root.classList.remove("changing");};art.onload=function(){root.classList.remove("image-failed","changing");};art.src=source;
}
var GILOA_STORY_PROGRESS_KEY = "giloa-story-reading-position";
var GILOA_STORY_CHAPTERS = [
    { id: 1, titles: { ko:"길로의 첫 지도", en:"Gilo’s First Map", ja:"ギロの最初の地図", zh:"吉洛的第一张地图", fr:"La première carte de Gilo", es:"El primer mapa de Gilo" } },
    { id: 2, titles: { ko:"닫힌 문 앞에서", en:"The Closed Gate", ja:"閉ざされた門の前で", zh:"在紧闭的门前", fr:"Devant la grille fermée", es:"Ante la puerta cerrada" }, pages: {
        ko: [
            "해가 지기 전에 전망대에 닿기로 했다.\n길로가 계단을 두 칸씩 뛰어올랐다. “우리, 노을 볼 수 있겠지?”",
            "언덕 끝에 도착하니 전망대 문에 자물쇠가 걸려 있었다.\n길로는 까치발을 하고 문틈을 들여다봤다. 안쪽은 조용했다.",
            "길로가 여행자 옆에 털썩 앉았다.\n“나도 여기서 해 지는 거 보고 싶었는데. 우리 잠깐만 앉았다 갈까?”",
            "둘은 올라왔던 길 옆의 좁은 골목으로 내려갔다.\n먼저 모퉁이를 돈 길로가 빼꼼 고개를 내밀었다. “잠깐, 여기서도 보여!”",
            "지붕 사이로 붉은 해가 내려앉았다. 둘은 나란히 서서 한참 바라봤다.\n여행자는 사진을 찍어 지도에 남겼다. ‘길로와 노을을 본 골목.’",
            "며칠 뒤, 여행자가 지도에서 그날 찍은 사진을 열었다.\n길로가 화면을 들여다봤다. “여기 기억난다. 우리 한참 서 있었잖아.”"
        ],
        en: ["They set out to reach the lookout before sunset.\nGilo bounded up the stairs. “Think we’ll catch it?”","At the top, they found the gate padlocked.\nGilo stood on tiptoe and peered inside. It was quiet.","Gilo sat down beside the traveler.\n“I wanted to see the sunset here too. Shall we sit for a bit?”","They headed down a narrow alley.\nGilo peeked around the corner. “Wait, you can see it from here!”","The red sun sank between the rooftops. They watched side by side.\nThe traveler took a photo and saved it to the map.","Days later, the traveler opened the photo on the map.\n“I remember this,” Gilo said. “We stood there for ages.”"],
        ja: ["日が沈む前に展望台へ向かった。\nギロは階段を駆け上がった。「夕日、見られるかな？」","坂の上で展望台の門に鍵がかかっていた。\nギロは背伸びして中をのぞいた。あたりは静かだった。","ギロは旅人の隣に腰を下ろした。\n「ここで夕日を見たかったな。少し座っていこうか？」","ふたりは細い路地を下った。\n角から顔を出したギロが言った。「待って、ここからも見えるよ！」","屋根の間に赤い夕日が沈んだ。ふたりは並んで眺めた。\n旅人は写真を撮って地図に残した。","数日後、旅人が地図から写真を開いた。\nギロは言った。「ここ覚えてる。ずっと並んで見てたね。」"],
        zh: ["他们想在日落前赶到观景台。\n吉洛蹦上台阶，问道：“我们能赶上日落吗？”","到了坡顶，观景台的大门已经上锁。\n吉洛踮起脚往里看，里面静悄悄的。","吉洛在旅人身边坐下。\n“我也想在这里看日落。我们坐一会儿吧？”","两人沿着一条窄巷下坡。\n吉洛从拐角探出头：“等等，这里也看得见！”","红日落在屋顶之间。两人并肩看了许久。\n旅人拍下照片，把它留在地图上。","几天后，旅人从地图打开那张照片。\n吉洛说：“我记得这里。那天我们站了好久。”"],
        fr: ["Ils voulaient atteindre le belvédère avant le coucher du soleil.\nGilo bondit dans l’escalier. « On va y arriver à temps ? »","En haut, la grille était cadenassée.\nGilo se hissa sur la pointe des pieds. Tout était silencieux.","Gilo s’assit près du voyageur.\n« Moi aussi, je voulais voir le coucher du soleil ici. On s’assoit un peu ? »","Ils descendirent par une ruelle.\nGilo passa la tête au coin. « Attends, on le voit d’ici ! »","Le soleil rouge descendit entre les toits. Ils le regardèrent côte à côte.\nLe voyageur prit une photo et l’ajouta à la carte.","Quelques jours plus tard, le voyageur rouvrit la photo sur la carte.\n« Je m’en souviens, dit Gilo. On est restés là un bon moment. »"],
        es: ["Querían llegar al mirador antes del atardecer.\nGilo subió los escalones de un salto. «¿Llegaremos a tiempo?»","Arriba, la verja tenía un candado.\nGilo se puso de puntillas para mirar. Todo estaba en silencio.","Gilo se sentó junto al viajero.\n«Yo también quería ver la puesta de sol desde aquí. ¿Nos sentamos un rato?»","Bajaron por un callejón estrecho.\nGilo asomó la cabeza. «¡Espera, desde aquí se ve!»","El sol rojo bajó entre los tejados. Se quedaron mirando juntos.\nEl viajero hizo una foto y la guardó en el mapa.","Días después, el viajero abrió la foto en el mapa.\n«Me acuerdo», dijo Gilo. «Nos quedamos allí un buen rato.»"]
    } }
];
var GILOA_CHAPTER_ACTIONS = {
    ko:["이어 읽기","다음 이야기","지도에서 탐험하기"], en:["Continue reading","Next chapter","Explore the map"],
    ja:["続きを読む","次の章","地図を探検する"], zh:["继续阅读","下一章","探索地图"],
    fr:["Continuer la lecture","Chapitre suivant","Explorer la carte"], es:["Seguir leyendo","Siguiente capítulo","Explorar el mapa"]
};
function giloaChapterActions() {
    return GILOA_CHAPTER_ACTIONS[normalizeLang(currentLang)] || GILOA_CHAPTER_ACTIONS.en;
}
function giloaChapterLabel(chapter) {
    return "CHAPTER " + String(chapter.id).padStart(2, "0") + " · " + (chapter.titles[normalizeLang(currentLang)] || chapter.titles.en);
}
function giloaChapterPages(chapter) {
    return chapter.pages ? (chapter.pages[normalizeLang(currentLang)] || chapter.pages.en) : introStoryText().screens.map(function(screen) { return screen[0]; });
}
function giloaStoryPosition() {
    var parts = (safeStorageGet(GILOA_STORY_PROGRESS_KEY) || "").split(":");
    var chapter = GILOA_STORY_CHAPTERS.find(function(entry) { return entry.id === Number(parts[0]); });
    var screen = Number(parts[1]);
    return chapter && Number.isInteger(screen) && screen >= 1 && screen <= giloaChapterPages(chapter).length ? { chapter: chapter, screen: screen } : null;
}
function renderGiloaStoryChapters() {
    var list = document.getElementById("giloa-story-chapters");
    var resume = document.getElementById("giloa-story-resume");
    if (!list || !resume) return;
    var position = giloaStoryPosition();
    resume.hidden = !position;
    if (position) resume.textContent = giloaChapterActions()[0] + " · " + giloaChapterLabel(position.chapter);
    list.replaceChildren();
    GILOA_STORY_CHAPTERS.forEach(function(chapter) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "giloa-story-replay";
        button.textContent = giloaChapterLabel(chapter);
        button.onclick = function() { openGiloaChapter(chapter, 1); };
        list.appendChild(button);
    });
}
function openGiloaChapter(chapter, screen) {
    closeGiloaStoryHub();
    return showGiloStory({ chapter: chapter, screen: screen, fromHub: true });
}
function resumeGiloaStory() {
    var position = giloaStoryPosition();
    if (position) openGiloaChapter(position.chapter, position.screen);
}
function renderIntroStory() {
    if (!introStoryState.active || introStoryState.mode !== "story") return;
    var chapter = introStoryState.chapter;
    var pages = giloaChapterPages(chapter);
    var screen = introStoryState.screen;
    var isLast = screen === pages.length;
    var nextChapter = GILOA_STORY_CHAPTERS[GILOA_STORY_CHAPTERS.indexOf(chapter) + 1];
    var copy = document.getElementById("gsi-copy");
    var count = screen + " / " + pages.length;
    setIntroArt(chapter.pages ? "./assets/gilo/story/chapter-" + String(chapter.id).padStart(2, "0") + "/" + screen + ".webp" : INTRO_SCREEN_FRAMES[screen - 1]);
    setOnboardingText("gsi-chapter-label", giloaChapterLabel(chapter));
    if (copy) { copy.textContent = pages[screen - 1]; copy.lang = normalizeLang(currentLang); }
    document.getElementById("gsi-progress-bar").style.width = (screen / pages.length * 100) + "%";
    document.getElementById("gsi-progress").setAttribute("aria-label", count);
    setOnboardingText("gsi-progress-count", count);
    var label = introStoryText().next;
    if (isLast) label = introStoryState.fromHub ? giloaChapterActions()[nextChapter ? 1 : 2] : (introStoryState.returnToOnboarding ? onboardingText().storyBack : onboardingText().storyClose);
    setOnboardingText("gsi-next-copy", label);
    document.getElementById("gsi-next").setAttribute("aria-label", label);
    document.getElementById("gsi-story-close").setAttribute("aria-label", introStoryState.fromHub ? giloaChapterActions()[2] : onboardingText().storyClose);
    if (introStoryState.fromHub) safeStorageSet(GILOA_STORY_PROGRESS_KEY, chapter.id + ":" + screen);
}
function showGiloStory(options){
    options=options||{};var root=document.getElementById("giloa-story-intro"),onboarding=document.getElementById("gsi-onboarding"),story=document.getElementById("gsi-story");if(!root||!story)return false;
    introStoryState={active:true,mode:"story",screen:options.screen||1,chapter:options.chapter||GILOA_STORY_CHAPTERS[0],fromHub:!!options.fromHub,returnToOnboarding:!!options.returnToOnboarding,completeToMap:!!options.completeToMap,lastArt:""};root.className="gsi active story-mode";root.setAttribute("aria-hidden","false");root.setAttribute("aria-labelledby","gsi-copy");if(onboarding)onboarding.hidden=true;story.hidden=false;document.body.classList.add("gsi-active");
    // gsi-next/gsi-story-close가 혹시라도 DOM에 없으면(null) .onclick 대입에서 바로
    // 예외가 나서 이 함수가 그 자리에서 멈추고, 그 아래 story.onclick 연결과
    // renderIntroStory() 호출까지 전부 건너뛰어 화면만 뜨고 아무것도 안 눌리는
    // 상태가 될 수 있었다. null 체크로 각 연결을 서로 독립시킨다.
var next=document.getElementById("gsi-next"),
    storyClose=document.getElementById("gsi-story-close");

if(next)next.onclick=advanceGiloaIntroStory;
if(storyClose)storyClose.onclick=closeGiloStory;

root.onclick=function(event){
    if(event.target===root){
        closeGiloStory();
    }
};
    try { renderIntroStory(); } catch (error) { console.warn("renderIntroStory failed", error && error.message); }
    return true;
}
function advanceGiloaIntroStory(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!introStoryState.active || introStoryState.mode !== "story") return;
    var chapter = introStoryState.chapter;
    if (introStoryState.screen < giloaChapterPages(chapter).length) {
        introStoryState.screen += 1;
        renderIntroStory();
        return;
    }
    var next = GILOA_STORY_CHAPTERS[GILOA_STORY_CHAPTERS.indexOf(chapter) + 1];
    if (introStoryState.fromHub && next) {
        openGiloaChapter(next, 1);
        return;
    }
    if (introStoryState.fromHub) safeStorageSet(GILOA_STORY_PROGRESS_KEY, "");
    closeGiloStory();
}
function closeGiloStory() {
    var returnToOnboarding =
        introStoryState.returnToOnboarding;

    var completeToMap =
        introStoryState.completeToMap;

    var returnToHelp =
        giloaStoryOpenedFromHelp;

    giloaStoryOpenedFromHelp = false;

    var art = document.getElementById("gsi-art");

    if (art) {
        art.removeAttribute("src");
        art.onerror = null;
        art.onload = null;
    }

    if (completeToMap) {
        finishGiloaOnboarding();
        return;
    }

    if (returnToOnboarding) {
        showGiloaOnboarding();
        return;
    }

    var root =
        document.getElementById("giloa-story-intro");

    introStoryState = {
        active: false,
        mode: "",
        screen: 1,
        returnToOnboarding: false,
        completeToMap: false,
        lastArt: ""
    };

    if (root) {
        root.className = "gsi";
        root.setAttribute("aria-hidden", "true");
    }

    document.body.classList.remove("gsi-active");

    if (returnToHelp) {
        switchHelpTab("info");

        var helpPopup =
            document.getElementById("help-popup");

        if (helpPopup) {
            helpPopup.classList.add("show");
        }
    }

    if (
        typeof map !== "undefined" &&
        map &&
        map.invalidateSize
    ) {
        setTimeout(function() {
            map.invalidateSize();
        }, 60);
    }
}
function playGiloaIntroStory(options){options=options||{};return showGiloStory({returnToOnboarding:!!options.returnToOnboarding});}
function finishGiloaIntroStory(){closeGiloStory();}
function skipGiloaIntroStory(event){if(event){event.preventDefault();event.stopPropagation();}closeGiloStory();}
function replayGiloaStory() {
    var popup = document.getElementById("help-popup");

    if (popup) {
        popup.classList.remove("show");
    }

    giloaStoryOpenedFromHelp = true;

    var opened = showGiloStory({
        returnToOnboarding: false
    });

    if (!opened) {
        giloaStoryOpenedFromHelp = false;
    }

    return opened;
}
