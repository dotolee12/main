// giloa.js
// Lightweight compatibility layer for older Android System WebView builds.
// Missing collection and Promise helpers must never stop the map at startup.
(function installLegacyCompatibility() {
    if (!Object.assign) {
        Object.assign = function(target) {
            if (target === null || target === undefined) throw new TypeError("Cannot convert undefined or null to object");
            var output = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source === null || source === undefined) continue;
                for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) output[key] = source[key];
            }
            return output;
        };
    }
    if (!Array.from) Array.from = function(value) { return Array.prototype.slice.call(value || []); };
    if (!Array.prototype.find) Array.prototype.find = function(callback, thisArg) { for (var i = 0; i < this.length; i++) if (callback.call(thisArg, this[i], i, this)) return this[i]; };
    if (!Array.prototype.findIndex) Array.prototype.findIndex = function(callback, thisArg) { for (var i = 0; i < this.length; i++) if (callback.call(thisArg, this[i], i, this)) return i; return -1; };
    if (!Array.prototype.includes) Array.prototype.includes = function(value, start) { return this.indexOf(value, start || 0) !== -1; };
    if (!String.prototype.includes) String.prototype.includes = function(value, start) { return this.indexOf(value, start || 0) !== -1; };
    if (!String.prototype.padStart) String.prototype.padStart = function(length, fill) { var text = String(this); var pad = String(fill === undefined ? " " : fill); while (text.length < length) text = pad + text; return text.slice(-length); };
    if (typeof NodeList !== "undefined" && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
    if (typeof Promise === "function" && !Promise.prototype.finally) {
        Promise.prototype.finally = function(callback) {
            var PromiseCtor = this.constructor || Promise;
            return this.then(function(value) { return PromiseCtor.resolve(callback()).then(function() { return value; }); }, function(error) { return PromiseCtor.resolve(callback()).then(function() { throw error; }); });
        };
    }
    if (typeof window.requestAnimationFrame !== "function") window.requestAnimationFrame = function(callback) { return setTimeout(function() { callback(Date.now()); }, 16); };
    if (typeof window.cancelAnimationFrame !== "function") window.cancelAnimationFrame = function(id) { clearTimeout(id); };
})();

// Display-only strings. Keep saved names, coordinates and storage records intact.
// Each row follows the app's supported language order: ko, en, ja, zh, es, fr.
const EARLY_UI_I18N = {
    trafficFailed: ["카카오 교통 지도를 불러오지 못했습니다. config.js의 JavaScript 키 설정을 확인해 주세요.", "Could not load the Kakao traffic map. Check the JavaScript key in config.js.", "カカオ交通地図を読み込めませんでした。config.jsのJavaScriptキーを確認してください。", "无法加载Kakao交通地图。请检查config.js中的JavaScript密钥。", "No se pudo cargar el mapa de tráfico de Kakao. Comprueba la clave JavaScript en config.js.", "Impossible de charger le trafic Kakao. Vérifiez la clé JavaScript dans config.js."],
    locationBeforeDirections: ["현재 위치를 확인한 뒤 길찾기를 이용해 주세요.", "Wait for your current location before requesting directions.", "現在地を確認してから経路を検索してください。", "请先确定当前位置，再使用路线导航。", "Espera a que se determine tu ubicación para buscar una ruta.", "Attendez que votre position soit déterminée avant de rechercher un itinéraire."],
    destination: ["목적지", "Destination", "目的地", "目的地", "Destino", "Destination"],
    selectDestination: ["목적지를 먼저 선택해 주세요.", "Select a destination first.", "先に目的地を選んでください。", "请先选择目的地。", "Selecciona primero un destino.", "Sélectionnez d’abord une destination."],
    destinationTooClose: ["현재 위치와 목적지가 너무 가깝습니다. 다른 장소를 선택해 주세요.", "The destination is too close to your location. Choose another place.", "目的地が現在地に近すぎます。別の場所を選んでください。", "目的地离当前位置太近。请选择其他地点。", "El destino está demasiado cerca. Elige otro lugar.", "La destination est trop proche. Choisissez un autre lieu."],
    currentLocation: ["현재 위치", "Current location", "現在地", "当前位置", "Ubicación actual", "Position actuelle"],
    noRouteToday: ["오늘 기록된 이동 경로가 아직 없어요.", "No walking route has been recorded today yet.", "今日の移動ルートはまだ記録されていません。", "今天还没有记录路线。", "Todavía no hay ninguna ruta registrada hoy.", "Aucun parcours n’a encore été enregistré aujourd’hui."],
    giloEncouragement: ["길로의 응원", "Gilo cheers you on", "ギロの応援", "Gilo的鼓励", "Gilo te anima", "Les encouragements de Gilo"],
    toastKicker: ["길로의 한마디", "A word from Gilo", "ギロからひとこと", "Gilo的话", "Unas palabras de Gilo", "Un mot de Gilo"],
    toastGrowing: ["당신의 여행이 성장하고 있어요.", "Your journey is growing.", "あなたの旅が成長しています。", "你的旅程正在成长。", "Tu viaje sigue creciendo.", "Votre voyage s’enrichit."],
    toastReward: ["현실에서 발견한 만큼 기록되었어요", "Your real-world discoveries have been recorded", "実際に見つけた発見が記録されました", "现实中的发现已记录", "Tus descubrimientos reales han quedado registrados", "Vos découvertes réelles ont été enregistrées"],
    levelReached: ["레벨 {level} 달성!", "Level {level} reached!", "レベル{level}に到達！", "达到{level}级！", "¡Nivel {level} alcanzado!", "Niveau {level} atteint !"],
    newStage: ["새로운 여행 단계가 열렸어.", "A new stage of your journey has begun.", "新しい旅の段階が始まったよ。", "新的旅行阶段开始了。", "Ha comenzado una nueva etapa de tu viaje.", "Une nouvelle étape de votre voyage commence."],
    traitChanged: ["여행 성향: {trait}", "Travel style: {trait}", "旅のスタイル：{trait}", "旅行风格：{trait}", "Estilo de viaje: {trait}", "Style de voyage : {trait}"],
    statGained: ["{stat} +{amount}", "{stat} +{amount}", "{stat} +{amount}", "{stat} +{amount}", "{stat} +{amount}", "{stat} +{amount}"],
    actionBecameSkill: ["방금 한 행동이 여행 능력이 되었어.", "What you just did has become a travel skill.", "今の行動が旅の力になったよ。", "刚才的行动变成了旅行能力。", "Lo que acabas de hacer se ha convertido en una habilidad viajera.", "Votre action vient d’enrichir vos compétences de voyage."],
    connectionGained: ["연결 +{amount}", "Connection +{amount}", "つながり +{amount}", "连接 +{amount}", "Conexión +{amount}", "Lien +{amount}"],
    connectionDetail: ["사람과 지역을 이어 주었어.", "You connected people and places.", "人と地域をつないだよ。", "你连接了人与地方。", "Has conectado personas y lugares.", "Vous avez relié des personnes et des lieux."],
    journeyMap: ["오늘의 대동여지도 보기", "View today's journey map", "今日の旅の地図を見る", "查看今日旅程地图", "Ver el mapa del viaje de hoy", "Voir la carte du voyage d’aujourd’hui"],
    memoryUnit: ["개", " memories", "件", "条", " recuerdos", " souvenirs"],
    photoUnit: ["장", " photos", "枚", "张", " fotos", " photos"],
    missionPlace: ["미션 장소", "Mission location", "ミッションの場所", "任务地点", "Lugar de la misión", "Lieu de mission"],
    photoMission: ["{name} 사진 미션", "{name} photo mission", "{name} 写真ミッション", "{name}拍照任务", "Misión fotográfica: {name}", "Mission photo : {name}"],
    importPhotos: ["갤러리에서 사진 불러오기", "Import photos from gallery", "ギャラリーから写真を取り込む", "从相册导入照片", "Importar fotos de la galería", "Importer des photos de la galerie"],
    photoFailed: ["일부 사진({count}장)을 처리하지 못했습니다.", "Could not process {count} photo(s).", "{count}枚の写真を処理できませんでした。", "有{count}张照片无法处理。", "No se pudieron procesar {count} fotos.", "Impossible de traiter {count} photo(s)."],
    photoOpenFailed: ["사진을 외부 앱에서 열지 못했습니다.", "Could not open the photo in another app.", "別のアプリで写真を開けませんでした。", "无法在其他应用中打开照片。", "No se pudo abrir la foto en otra aplicación.", "Impossible d’ouvrir la photo dans une autre application."],
    locating: ["현재 위치를 다시 확인하는 중…", "Checking your current location…", "現在地を再確認しています…", "正在重新确定当前位置…", "Comprobando tu ubicación actual…", "Vérification de votre position actuelle…"],
    locationImprecise: ["위치를 맞췄지만 오차가 큽니다 (±{accuracy}m). 실내라면 창가나 야외에서 다시 눌러 주세요.", "Location updated, but accuracy is low (±{accuracy}m). Try again near a window or outdoors.", "現在地を更新しましたが誤差が大きいです（±{accuracy}m）。窓際や屋外でもう一度お試しください。", "位置已更新，但误差较大（±{accuracy}米）。请到窗边或室外重试。", "Ubicación actualizada, pero con poca precisión (±{accuracy} m). Inténtalo cerca de una ventana o al aire libre.", "Position actualisée, mais peu précise (±{accuracy} m). Réessayez près d’une fenêtre ou à l’extérieur."],
    locationUpdated: ["현재 위치로 맞췄습니다 (±{accuracy}m)", "Location updated (±{accuracy}m)", "現在地を更新しました（±{accuracy}m）", "位置已更新（±{accuracy}米）", "Ubicación actualizada (±{accuracy} m)", "Position actualisée (±{accuracy} m)"],
    locationFailed: ["위치를 확인하지 못했습니다. 위치 권한과 GPS를 확인해 주세요.", "Could not locate you. Check location permission and GPS.", "現在地を取得できませんでした。位置情報の権限とGPSを確認してください。", "无法确定位置。请检查位置权限和GPS。", "No se pudo obtener tu ubicación. Comprueba el permiso de ubicación y el GPS.", "Impossible de vous localiser. Vérifiez l’autorisation de localisation et le GPS."],
    restoringBeforeRecord: ["이전 발걸음을 복원하고 있어요. 복원이 끝나면 기록을 시작할게요.", "Restoring your previous route. Recording will start when restoration finishes.", "以前の足跡を復元しています。完了したら記録を開始します。", "正在恢复以前的足迹。恢复完成后将开始记录。", "Restaurando tu ruta anterior. El registro comenzará al terminar.", "Restauration de votre parcours précédent. L’enregistrement commencera ensuite."],
    locationPermission: ["위치 권한이 있어야 경로를 기록할 수 있어요.", "Location permission is required to record your route.", "ルートの記録には位置情報の権限が必要です。", "记录路线需要位置权限。", "Se necesita permiso de ubicación para registrar tu ruta.", "L’autorisation de localisation est nécessaire pour enregistrer votre parcours."],
    noMemoryLocation: ["기억으로 남길 위치가 없습니다.", "There is no location to save as a memory.", "思い出として保存する位置がありません。", "没有可保存为回忆的位置。", "No hay una ubicación para guardar como recuerdo.", "Aucune position à enregistrer comme souvenir."],
    memoryPrompt: ["이 장소의 이름을 입력하세요.", "Enter a name for this place.", "この場所の名前を入力してください。", "请输入此地点的名称。", "Escribe un nombre para este lugar.", "Saisissez un nom pour ce lieu."],
    newDiscovery: ["새로운 발견", "New discovery", "新しい発見", "新的发现", "Nuevo descubrimiento", "Nouvelle découverte"],
    photoMemory: ["사진의 기억", "Photo memory", "写真の思い出", "照片回忆", "Recuerdo fotográfico", "Souvenir photo"],
    memoryPlace: ["기억 장소", "Memory location", "思い出の場所", "回忆地点", "Lugar del recuerdo", "Lieu du souvenir"],
    checkingLocation: ["위치 정보를 확인하는 중입니다.", "Checking your location.", "位置情報を確認しています。", "正在确认位置信息。", "Comprobando tu ubicación.", "Vérification de votre position."],
    emptyMemories: ["아직 저장된 기억이 없습니다.", "No memories saved yet.", "保存された思い出はまだありません。", "尚无已保存的回忆。", "Todavía no hay recuerdos guardados.", "Aucun souvenir enregistré pour le moment."],
    move: ["이동", "Go to", "移動", "前往", "Ir", "Y aller"],
    delete: ["삭제", "Delete", "削除", "删除", "Eliminar", "Supprimer"],
    gpxTooFew: ["선택한 시간에 경로를 만들 만큼 GPS 지점이 충분하지 않습니다.", "There are not enough GPS points in the selected period to create a route.", "選択した期間にルート作成に必要なGPS地点が足りません。", "所选时间段内的GPS点不足以生成路线。", "No hay suficientes puntos GPS en el período seleccionado para crear una ruta.", "Il n’y a pas assez de points GPS dans la période choisie pour créer un parcours."],
    gpxNoRoute: ["해당 시간에 기록된 경로가 없습니다.", "No route was recorded in this period.", "この期間に記録されたルートはありません。", "此时间段内没有记录路线。", "No hay rutas registradas en este período.", "Aucun parcours enregistré pendant cette période."],
    recentRoute: ["최근 {hours}시간 경로", "Route from the last {hours} hours", "過去{hours}時間のルート", "最近{hours}小时的路线", "Ruta de las últimas {hours} horas", "Parcours des {hours} dernières heures"],
    gpxSaved: ["\"{name}\" 저장 완료 · {count}개 GPS 지점", "\"{name}\" saved · {count} GPS points", "「{name}」を保存しました · GPS地点{count}件", "已保存“{name}” · {count}个GPS点", "\"{name}\" guardada · {count} puntos GPS", "« {name} » enregistré · {count} points GPS"],
    departure: ["출발", "Start", "出発", "出发", "Salida", "Départ"],
    arrival: ["도착", "Finish", "到着", "到达", "Llegada", "Arrivée"],
    photoFileMissing: ["사진 파일을 찾을 수 없습니다.", "Could not find the photo file.", "写真ファイルが見つかりません。", "找不到照片文件。", "No se encontró el archivo de la foto.", "Le fichier photo est introuvable."],
    authPassword: ["비밀번호가 맞지 않습니다.", "The password is incorrect.", "パスワードが違います。", "密码不正确。", "La contraseña es incorrecta.", "Le mot de passe est incorrect."],
    authId: ["아이디 형식이 맞지 않습니다. 영문, 숫자, _, - 만 사용해 주세요.", "Invalid ID. Use only letters, numbers, _ and -.", "IDの形式が正しくありません。英数字、_、-のみ使用してください。", "账号格式不正确。请仅使用英文字母、数字、_和-。", "ID no válido. Usa solo letras, números, _ y -.", "Identifiant invalide. Utilisez uniquement des lettres, des chiffres, _ et -."],
    authNetwork: ["네트워크 연결을 확인해 주세요.", "Check your network connection.", "ネットワーク接続を確認してください。", "请检查网络连接。", "Comprueba tu conexión de red.", "Vérifiez votre connexion réseau."],
    authWeak: ["비밀번호는 6자 이상으로 입력해 주세요.", "Enter a password with at least 6 characters.", "パスワードは6文字以上で入力してください。", "密码至少需要6个字符。", "La contraseña debe tener al menos 6 caracteres.", "Le mot de passe doit contenir au moins 6 caractères."],
    authUnavailable: ["로그인 기능이 현재 허용되지 않습니다.", "Sign-in is currently unavailable.", "現在ログインを利用できません。", "当前无法登录。", "El inicio de sesión no está disponible ahora.", "La connexion est actuellement indisponible."],
    authTooMany: ["시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.", "Too many attempts. Try again later.", "試行回数が多すぎます。しばらくしてから再試行してください。", "尝试次数过多。请稍后重试。", "Demasiados intentos. Inténtalo de nuevo más tarde.", "Trop de tentatives. Réessayez plus tard."],
    authFailed: ["로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.", "Sign-in failed. Check your ID and password.", "ログインできませんでした。IDとパスワードを確認してください。", "登录失败。请检查账号和密码。", "No se pudo iniciar sesión. Comprueba tu ID y contraseña.", "Échec de connexion. Vérifiez votre identifiant et votre mot de passe."],
    errorCode: ["오류 코드", "Error code", "エラーコード", "错误代码", "Código de error", "Code d’erreur"],
    noId: ["아이디 없음", "No ID", "IDなし", "无账号", "Sin ID", "Aucun identifiant"],
    storageFull: ["기기 저장 공간이 부족합니다.", "Your device is running out of storage.", "端末の保存容量が不足しています。", "设备存储空间不足。", "No hay suficiente espacio en el dispositivo.", "L’espace de stockage de l’appareil est insuffisant."],
    restoring: ["저장된 발걸음을 확인하는 중…", "Checking your saved footsteps…", "保存された足跡を確認しています…", "正在检查已保存的足迹…", "Comprobando tus pasos guardados…", "Vérification de vos pas enregistrés…"],
    copy: ["복사", "Copy", "コピー", "复制", "Copiar", "Copier"],
    copied: ["복사됨", "Copied", "コピーしました", "已复制", "Copiado", "Copié"],
    close: ["닫기", "Close", "閉じる", "关闭", "Cerrar", "Fermer"],
    diagnostic: ["진단 결과", "Diagnostic results", "診断結果", "诊断结果", "Resultados del diagnóstico", "Résultats du diagnostic"],
    regionDiagnostic: ["지역 뱃지 진단", "Regional badge diagnostics", "地域バッジ診断", "地区徽章诊断", "Diagnóstico de insignias regionales", "Diagnostic des badges régionaux"],
    photoDiagnostic: ["사진 위치 진단", "Photo location diagnostics", "写真位置の診断", "照片位置诊断", "Diagnóstico de ubicación de fotos", "Diagnostic de localisation des photos"],
    photoExifDiagnostic: ["사진 위치정보 진단", "Photo location metadata diagnostics", "写真位置情報の診断", "照片位置元数据诊断", "Diagnóstico de metadatos de ubicación", "Diagnostic des métadonnées de localisation"],
    storageDiagnostic: ["사진 저장소 진단", "Photo storage diagnostics", "写真ストレージ診断", "照片存储诊断", "Diagnóstico del almacenamiento de fotos", "Diagnostic du stockage des photos"],
    none: ["없음", "None", "なし", "无", "Ninguno", "Aucun"],
    unknown: ["알 수 없음", "Unknown", "不明", "未知", "Desconocido", "Inconnu"],
    present: ["있음", "Present", "あり", "有", "Presente", "Présent"],
    build: ["빌드", "Build", "ビルド", "版本", "Compilación", "Version"],
    environment: ["실행 환경", "Environment", "実行環境", "运行环境", "Entorno", "Environnement"],
    browser: ["브라우저", "Browser", "ブラウザー", "浏览器", "Navegador", "Navigateur"],
    adminPolygons: ["행정구역 폴리곤", "Administrative polygons", "行政区域ポリゴン", "行政区域多边形", "Polígonos administrativos", "Polygones administratifs"],
    geojsonPath: ["geojson 경로", "GeoJSON path", "GeoJSONパス", "GeoJSON路径", "Ruta GeoJSON", "Chemin GeoJSON"],
    geojsonStatus: ["geojson 상태", "GeoJSON status", "GeoJSON状態", "GeoJSON状态", "Estado GeoJSON", "État GeoJSON"],
    sampleNames: ["샘플 이름", "Sample names", "サンプル名", "示例名称", "Nombres de ejemplo", "Exemples de noms"],
    propertyKeys: ["속성 키", "Property keys", "プロパティキー", "属性键", "Claves de propiedades", "Clés de propriétés"],
    fallbackPolygons: ["미로딩 · 폴백 폴리곤 사용 중", "Not loaded · using fallback polygons", "未読込 · 代替ポリゴンを使用中", "未加载 · 正在使用备用多边形", "Sin cargar · usando polígonos alternativos", "Non chargé · polygones de secours utilisés"],
    evaluationCoordinates: ["판정용 좌표", "Evaluation coordinates", "判定座標", "判定坐标", "Coordenadas de evaluación", "Coordonnées d’évaluation"],
    accuracy: ["정확도", "Accuracy", "精度", "精度", "Precisión", "Précision"],
    freshness: ["좌표 신선도", "Coordinate age", "座標の経過時間", "坐标时效", "Antigüedad de coordenadas", "Âge des coordonnées"],
    secondsAgo: ["{seconds}초 전", "{seconds}s ago", "{seconds}秒前", "{seconds}秒前", "Hace {seconds} s", "Il y a {seconds} s"],
    resolvedRegion: ["판정 지역", "Resolved region", "判定地域", "判定地区", "Región detectada", "Région détectée"],
    resolutionSource: ["판정 근거", "Resolution source", "判定根拠", "判定依据", "Fuente de detección", "Source de détection"],
    staleCoordinates: ["없음 (정확도 초과 또는 오래된 좌표)", "None (inaccurate or stale coordinates)", "なし（精度不足または古い座標）", "无（精度不足或坐标过期）", "Ninguna (coordenadas imprecisas o antiguas)", "Aucune (coordonnées imprécises ou anciennes)"],
    waitingGps: ["없음 (GPS 대기 중)", "None (waiting for GPS)", "なし（GPS待機中）", "无（等待GPS）", "Ninguna (esperando GPS)", "Aucune (en attente du GPS)"],
    lastCoordinates: ["마지막 좌표", "Last coordinates", "最後の座標", "最后坐标", "Últimas coordenadas", "Dernières coordonnées"],
    rawGpsCounts: ["GPS 원본 포인트: 전체 {total}개 · 최근 10분 {recent}개", "Raw GPS points: {total} total · {recent} in the last 10 minutes", "元GPS地点：合計{total}件 · 過去10分{recent}件", "原始GPS点：共{total}个 · 最近10分钟{recent}个", "Puntos GPS originales: {total} en total · {recent} en los últimos 10 minutos", "Points GPS bruts : {total} au total · {recent} dans les 10 dernières minutes"],
    recordingStatus: ["기록 상태", "Recording status", "記録状態", "记录状态", "Estado del registro", "État de l’enregistrement"],
    recording: ["기록 중", "Recording", "記録中", "记录中", "Registrando", "Enregistrement en cours"],
    stopped: ["정지", "Stopped", "停止", "已停止", "Detenido", "Arrêté"],
    running: ["동작 중", "Running", "動作中", "运行中", "En marcha", "En cours"],
    stayTimer: ["적립 타이머", "Stay timer", "滞在タイマー", "停留计时器", "Temporizador de estancia", "Minuteur de séjour"],
    lastTickRegion: ["직전 틱 지역", "Previous tick region", "前回の計測地域", "上次计时地区", "Región del último intervalo", "Région du dernier intervalle"],
    lastResolution: ["마지막 실시간 판정", "Last live resolution", "最新のリアルタイム判定", "最近实时判定", "Última detección en tiempo real", "Dernière détection en temps réel"],
    stayMinutes: ["{minutes}/60분 (경로 {path} · 실시간 {live})", "{minutes}/60 min (route {path} · live {live})", "{minutes}/60分（ルート{path} · リアルタイム{live}）", "{minutes}/60分钟（路线{path} · 实时{live}）", "{minutes}/60 min (ruta {path} · en vivo {live})", "{minutes}/60 min (parcours {path} · en direct {live})"],
    earned: ["획득", "Earned", "獲得", "已获得", "Conseguida", "Obtenu"],
    totalPhotos: ["전체 사진", "Total photos", "写真総数", "照片总数", "Total de fotos", "Total des photos"],
    mapMarkers: ["지도 마커", "Map markers", "地図マーカー", "地图标记", "Marcadores del mapa", "Repères sur la carte"],
    located: ["위치 있음", "With location", "位置あり", "有位置", "Con ubicación", "Avec position"],
    unlocated: ["위치 없음", "Without location", "位置なし", "无位置", "Sin ubicación", "Sans position"],
    missingImage: ["이미지 없음", "Image missing", "画像なし", "图像缺失", "Sin imagen", "Image absente"],
    readRoute: ["읽은 경로", "Read source", "読込元", "读取来源", "Origen de lectura", "Source de lecture"],
    nativeBridge: ["네이티브 브릿지", "Native bridge", "ネイティブブリッジ", "原生桥接", "Puente nativo", "Passerelle native"],
    bridgeAbsent: ["GiloaPhotoBridge 없음 (네이티브 미적용)", "GiloaPhotoBridge absent (native bridge unavailable)", "GiloaPhotoBridgeなし（ネイティブ未対応）", "无GiloaPhotoBridge（原生桥接不可用）", "GiloaPhotoBridge ausente (puente nativo no disponible)", "GiloaPhotoBridge absent (passerelle native indisponible)"],
    methods: ["메서드", "Methods", "メソッド", "方法", "Métodos", "Méthodes"],
    missing: ["누락", "Missing", "不足", "缺失", "Faltantes", "Manquants"],
    photoPermission: ["사진 위치 권한", "Photo location permission", "写真位置情報の権限", "照片位置权限", "Permiso de ubicación de fotos", "Autorisation de localisation des photos"],
    allowed: ["허용됨", "Allowed", "許可済み", "已允许", "Permitido", "Autorisé"],
    denied: ["거부/미요청", "Denied/not requested", "拒否／未要求", "已拒绝／未请求", "Denegado/no solicitado", "Refusé/non demandé"],
    callFailed: ["호출 실패", "Call failed", "呼出し失敗", "调用失败", "Llamada fallida", "Échec de l’appel"],
    originalReadFailed: ["네이티브 경로로 원본을 읽지 못했습니다.", "Could not read the original through the native bridge.", "ネイティブ経由で元の写真を読み込めませんでした。", "无法通过原生桥接读取原始照片。", "No se pudo leer el original mediante el puente nativo.", "Impossible de lire l’original via la passerelle native."],
    readAttempts: ["읽기 시도 기록", "Read attempts", "読込試行履歴", "读取尝试记录", "Intentos de lectura", "Tentatives de lecture"],
    noRecords: ["기록 없음", "No records", "記録なし", "无记录", "Sin registros", "Aucun enregistrement"],
    systemPicker: ["시스템 사진 선택기 (위치 제거됨)", "System photo picker (location removed)", "システム写真選択（位置情報削除）", "系统照片选择器（位置已移除）", "Selector de fotos del sistema (ubicación eliminada)", "Sélecteur photo système (position supprimée)"],
    pickerUsed: ["사용된 선택기", "Picker used", "使用した選択機能", "使用的选择器", "Selector utilizado", "Sélecteur utilisé"],
    file: ["파일", "File", "ファイル", "文件", "Archivo", "Fichier"],
    unnamed: ["이름 없음", "Unnamed", "名前なし", "未命名", "Sin nombre", "Sans nom"],
    format: ["형식", "Format", "形式", "格式", "Formato", "Format"],
    byteReadFailed: ["바이트 읽기 실패", "Byte read failed", "バイト読込失敗", "字节读取失败", "Error al leer los bytes", "Échec de lecture des octets"],
    exifBlock: ["EXIF 블록", "EXIF block", "EXIFブロック", "EXIF块", "Bloque EXIF", "Bloc EXIF"],
    gpsBlock: ["GPS 블록", "GPS block", "GPSブロック", "GPS块", "Bloque GPS", "Bloc GPS"],
    gpsTagCount: ["있음 (태그 {count}개)", "Present ({count} tags)", "あり（タグ{count}件）", "有（{count}个标签）", "Presente ({count} etiquetas)", "Présent ({count} balises)"],
    verdict: ["판정", "Result", "判定", "判定", "Resultado", "Résultat"],
    rawGpsTags: ["GPS 태그 원본 값", "Raw GPS tag values", "GPSタグの元の値", "GPS标签原始值", "Valores originales de etiquetas GPS", "Valeurs brutes des balises GPS"],
    finalCoordinates: ["최종 좌표", "Final coordinates", "最終座標", "最终坐标", "Coordenadas finales", "Coordonnées finales"],
    processingLog: ["처리 기록", "Processing log", "処理履歴", "处理记录", "Registro de procesamiento", "Journal de traitement"],
    locationRedacted: ["※ 안드로이드 위치 제거로 판단됩니다.\nACCESS_MEDIA_LOCATION 권한과 MediaStore.setRequireOriginal() 없이 사진을 받으면 태그는 남고 값만 0으로 지워집니다.", "Android appears to have removed the location.\nWithout ACCESS_MEDIA_LOCATION permission and MediaStore.setRequireOriginal(), tags remain but their values are replaced with zero.", "Androidが位置情報を削除したと考えられます。\nACCESS_MEDIA_LOCATION権限とMediaStore.setRequireOriginal()なしではタグが残り、値が0に置き換わります。", "Android可能移除了位置信息。\n没有ACCESS_MEDIA_LOCATION权限和MediaStore.setRequireOriginal()时，标签仍在，但数值会被替换为0。", "Android parece haber eliminado la ubicación.\nSin el permiso ACCESS_MEDIA_LOCATION y MediaStore.setRequireOriginal(), las etiquetas permanecen, pero sus valores se sustituyen por cero.", "Android semble avoir supprimé la position.\nSans l’autorisation ACCESS_MEDIA_LOCATION et MediaStore.setRequireOriginal(), les balises restent, mais leurs valeurs sont remplacées par zéro."],
    exifOk: ["성공 ({endian})", "Success ({endian})", "成功（{endian}）", "成功（{endian}）", "Correcto ({endian})", "Réussi ({endian})"],
    exifSmall: ["파일이 너무 작음", "File too small", "ファイルが小さすぎます", "文件过小", "Archivo demasiado pequeño", "Fichier trop petit"],
    exifAbsent: ["EXIF 블록 자체가 없음 (재인코딩된 사본으로 추정)", "No EXIF block (likely a re-encoded copy)", "EXIFブロックなし（再エンコードされたコピーの可能性）", "没有EXIF块（可能是重新编码的副本）", "Sin bloque EXIF (posiblemente una copia recodificada)", "Aucun bloc EXIF (probablement une copie réencodée)"],
    exifHeader: ["EXIF 헤더 손상", "Damaged EXIF header", "EXIFヘッダー破損", "EXIF头损坏", "Cabecera EXIF dañada", "En-tête EXIF endommagé"],
    tiffHeader: ["TIFF 헤더 손상", "Damaged TIFF header", "TIFFヘッダー破損", "TIFF头损坏", "Cabecera TIFF dañada", "En-tête TIFF endommagé"],
    gpsPointerAbsent: ["EXIF는 있으나 GPS 포인터 없음 → 기기가 위치를 제거함", "EXIF present, no GPS pointer → device removed location", "EXIFあり、GPSポインターなし → 端末が位置情報を削除", "有EXIF但无GPS指针 → 设备移除了位置", "EXIF presente, sin puntero GPS → el dispositivo eliminó la ubicación", "EXIF présent, sans pointeur GPS → position supprimée par l’appareil"],
    gpsEmpty: ["GPS 블록이 비어 있음 → 기기가 위치를 제거함", "Empty GPS block → device removed location", "GPSブロックが空 → 端末が位置情報を削除", "GPS块为空 → 设备移除了位置", "Bloque GPS vacío → el dispositivo eliminó la ubicación", "Bloc GPS vide → position supprimée par l’appareil"],
    gpsCoordinatesAbsent: ["GPS 블록은 있으나 위/경도 값 없음", "GPS block present, but no latitude/longitude", "GPSブロックあり、緯度・経度の値なし", "有GPS块但无经纬度值", "Bloque GPS presente, pero sin latitud/longitud", "Bloc GPS présent, sans latitude ni longitude"],
    gpsZeroed: ["GPS 값이 전부 0 → 안드로이드가 값을 지우고 넘김", "All GPS values are zero → Android redacted the values", "GPS値がすべて0 → Androidが値を削除", "GPS值全部为0 → Android清除了数值", "Todos los valores GPS son cero → Android los ocultó", "Toutes les valeurs GPS sont nulles → valeurs masquées par Android"],
    address: ["주소", "Address", "アドレス", "地址", "Dirección", "Adresse"],
    idbReadFailed: ["IndexedDB 읽기 실패", "IndexedDB read failed", "IndexedDB読込失敗", "IndexedDB读取失败", "Error de lectura de IndexedDB", "Échec de lecture d’IndexedDB"],
    imageOk: ["정상", "OK", "正常", "正常", "Correcta", "Correcte"],
    idbMissing: ["IDB 행 없음", "IDB row missing", "IDB行なし", "无IDB行", "Falta la fila IDB", "Ligne IDB absente"],
    originalOnly: ["원본만 있음", "Original only", "原本のみ", "仅有原图", "Solo el original", "Original uniquement"],
    rowWithoutImage: ["행은 있으나 이미지 없음", "Row exists, image missing", "行あり、画像なし", "有行但无图像", "Fila presente, imagen ausente", "Ligne présente, image absente"],
    idbRows: ["IndexedDB 행", "IndexedDB rows", "IndexedDB行", "IndexedDB行", "Filas IndexedDB", "Lignes IndexedDB"],
    imagesOk: ["이미지 정상", "Images OK", "正常な画像", "正常图像", "Imágenes correctas", "Images correctes"],
    recoverableOriginal: ["원본만 있음(복구 가능)", "Original only (recoverable)", "原本のみ（復元可能）", "仅有原图（可恢复）", "Solo original (recuperable)", "Original uniquement (récupérable)"],
    problemPhotos: ["문제 사진", "Problem photos", "問題のある写真", "异常照片", "Fotos con problemas", "Photos problématiques"],
    failed: ["실패", "Failed", "失敗", "失败", "Error", "Échec"],
    error: ["오류", "Error", "エラー", "错误", "Error", "Erreur"],
    response: ["응답", "Response", "応答", "响应", "Respuesta", "Réponse"],
    chunkSize: ["청크 크기", "Chunk size", "チャンクサイズ", "分块大小", "Tamaño del bloque", "Taille du bloc"],
    chunkRead: ["청크 읽기", "Chunk read", "チャンク読込", "读取分块", "Lectura del bloque", "Lecture du bloc"],
    chunkTransfer: ["청크 전송", "Chunk transfer", "チャンク転送", "分块传输", "Transferencia del bloque", "Transfert du bloc"],
    emptyString: ["빈 문자열", "Empty string", "空文字列", "空字符串", "Cadena vacía", "Chaîne vide"],
    cacheUrl: ["캐시 URL", "Cache URL", "キャッシュURL", "缓存URL", "URL de caché", "URL du cache"],
    cachePath: ["캐시 경로", "Cache path", "キャッシュパス", "缓存路径", "Ruta de caché", "Chemin du cache"],
    pathFormat: ["경로형식", "Path format", "パス形式", "路径格式", "Formato de ruta", "Format du chemin"],
    stringSize: ["{size}KB 문자열", "{size}KB string", "{size}KB文字列", "{size}KB字符串", "Cadena de {size} KB", "Chaîne de {size} Ko"],
    success: ["성공", "Success", "成功", "成功", "Correcto", "Réussi"],
    input: ["입력", "Input", "入力", "输入", "Entrada", "Entrée"],
    noCoordinates: ["좌표 없음", "No coordinates", "座標なし", "无坐标", "Sin coordenadas", "Aucune coordonnée"],
    notLoaded: ["미로드", "Not loaded", "未読込", "未加载", "Sin cargar", "Non chargé"],
    byteRead: ["바이트 읽기", "Byte read", "バイト読込", "字节读取", "Lectura de bytes", "Lecture d’octets"],
    bytes: ["바이트", "Bytes", "バイト", "字节", "Bytes", "Octets"],
    fullRetry: ["전체 재시도", "Full-file retry", "ファイル全体を再試行", "重试整个文件", "Reintento del archivo completo", "Nouvel essai du fichier entier"],
    fullRetryResult: ["전체 재시도 결과", "Full-file retry result", "ファイル全体の再試行結果", "整个文件重试结果", "Resultado del reintento completo", "Résultat du nouvel essai complet"],
    parser: ["자체 파서", "Built-in parser", "内蔵パーサー", "内置解析器", "Analizador integrado", "Analyseur intégré"],
    outOfBounds: ["범위밖", "Out of bounds", "範囲外", "超出范围", "Fuera de rango", "Hors limites"],
    readFailed: ["읽기 실패", "Read failed", "読込失敗", "读取失败", "Error de lectura", "Échec de lecture"],
    invalidTypeCount: ["타입/개수 이상", "Invalid type/count", "型または件数が無効", "类型或数量无效", "Tipo o cantidad no válidos", "Type ou nombre invalide"],
    valueOutsideBuffer: ["값 위치가 버퍼 밖", "Value outside buffer", "値の位置がバッファー外", "值的位置超出缓冲区", "Valor fuera del búfer", "Valeur hors du tampon"],
    featuresEmpty: ["features 배열이 비어 있음", "The features array is empty", "features配列が空です", "features数组为空", "La matriz features está vacía", "Le tableau features est vide"]
};
function earlyUiText(key, params) {
    var row = EARLY_UI_I18N[key];
    var language = typeof currentLang === "string" ? currentLang : "";
    if (!language) { try { language = localStorage.getItem("giloa-language-v1") || "ko"; } catch (_) { language = "ko"; } }
    var index = ["ko", "en", "ja", "zh", "es", "fr"].indexOf(language);
    var text = row ? row[index < 0 ? 1 : index] || row[1] : key;
    return String(text).replace(/\{(\w+)\}/g, function(token, name) {
        return params && params[name] !== undefined ? String(params[name]) : token;
    });
}
function earlyMemoryDateText(memory, dateOnly) {
    var time = Number(memory.time);
    var date = isFinite(time) && time > 0 ? new Date(time) : null;
    var originalTime = String(memory.timeString || "");
    var hasTime = !!date;
    if (!date) {
        var parts = String(memory.dateString || "").match(/^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*$/);
        if (parts) {
            date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
            if (date.getFullYear() !== Number(parts[1]) || date.getMonth() !== Number(parts[2]) - 1 || date.getDate() !== Number(parts[3])) date = null;
            var clock = originalTime.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})\s*$/);
            if (date && clock && Number(clock[2]) >= 1 && Number(clock[2]) <= 12 && Number(clock[3]) < 60) {
                date.setHours(Number(clock[2]) % 12 + (clock[1] === "오후" ? 12 : 0), Number(clock[3]));
                hasTime = true;
            }
        }
    }
    if (!date || isNaN(date.getTime())) return (memory.dateString || "") + (dateOnly ? "" : " " + originalTime);
    var language = currentLang || "ko";
    var display = date.toLocaleDateString(language, { year:"numeric", month:"long", day:"numeric" });
    if (dateOnly) return display;
    return display + " " + (hasTime ? date.toLocaleTimeString(language, { hour:"2-digit", minute:"2-digit" }) : originalTime);
}
// Localize diagnostic descriptions only when displaying them. Raw EXIF values
// and the native read/parser functions retain their original behavior.
function earlyDiagnosticValue(value) {
    var text = String(value === undefined || value === null ? "" : value);
    var keys = Object.keys(EARLY_UI_I18N);
    for (var i = 0; i < keys.length; i++) {
        if (EARLY_UI_I18N[keys[i]][0] === text) return earlyUiText(keys[i]);
    }
    if (text === "객체 exif") return "EXIF";
    if (text === "브릿지" || text === "네이티브") return earlyUiText("nativeBridge");
    if (text === "청크") return earlyUiText("chunkRead");
    if (/ 오류$/.test(text)) return earlyDiagnosticValue(text.slice(0, -3)) + " " + earlyUiText("error");
    if (/ 실패$/.test(text)) return earlyDiagnosticValue(text.slice(0, -3)) + " " + earlyUiText("failed");
    if (/ fetch$/.test(text)) return earlyDiagnosticValue(text.slice(0, -6)) + " fetch";
    if (/ XHR$/.test(text)) return earlyDiagnosticValue(text.slice(0, -4)) + " XHR";
    if (/^경로형식\d+$/.test(text)) return earlyUiText("pathFormat") + " " + text.slice(4);
    if (/^응답 \d+$/.test(text)) return earlyUiText("response") + " " + text.slice(3);
    if (/^\d+KB 문자열$/.test(text)) return earlyUiText("stringSize", { size:parseInt(text, 10) });
    if (/^\d+KB 확보$/.test(text)) return text.replace(" 확보", "");
    return text;
}
function earlyDiagnosticTraceLine(line) {
    var text = String(line || "");
    var prefix = text.indexOf("· ") === 0 ? "· " : "";
    var body = prefix ? text.slice(2) : text;
    var separator = body.indexOf(": ");
    if (separator < 0) return prefix + earlyDiagnosticValue(body);
    return prefix + earlyDiagnosticValue(body.slice(0, separator)) + ": " + earlyDiagnosticValue(body.slice(separator + 2));
}
function refreshEarlyLanguageUI() {
    updateMemoryList();
    syncImageMissionUI();
    syncUserIdUI();
    var memoryCount = document.getElementById("memory-count-val");
    var photoCount = document.getElementById("photo-count-val");
    if (memoryCount) memoryCount.innerHTML = memories.length + "<span>" + escapeHtml(earlyUiText("memoryUnit")) + "</span>";
    if (photoCount) photoCount.innerHTML = photos.length + "<span>" + escapeHtml(earlyUiText("photoUnit")) + "</span>";
    memoryMarkers.forEach(function(marker, id) {
        var popup = marker.getPopup && marker.getPopup();
        var content = popup && popup.getContent();
        if (!content || typeof content.querySelector !== "function") return;
        var button = content.querySelector(".popup-delete-btn");
        if (button) button.textContent = earlyUiText("delete");
        var memory = memories.find(function(item) { return item.id === id; });
        var date = content.querySelector("small");
        if (date && memory) date.textContent = earlyMemoryDateText(memory);
    });
    activeGpxLayers.forEach(function(layer) {
        if (layer.giloaRouteEndpoint && typeof layer.setTooltipContent === "function") layer.setTooltipContent(earlyUiText(layer.giloaRouteEndpoint));
    });
    var diagnostic = document.getElementById("giloa-diagnostic-overlay");
    if (diagnostic) {
        var diagnosticTitle = document.getElementById("giloa-diagnostic-title");
        if (diagnosticTitle && diagnostic.dataset.titleKey) diagnosticTitle.textContent = earlyUiText(diagnostic.dataset.titleKey);
        var buttons = diagnostic.querySelectorAll("button");
        if (buttons[0]) buttons[0].textContent = earlyUiText("copy");
        if (buttons[1]) buttons[1].textContent = earlyUiText("close");
    }
}

async function requestLocationPermission() {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { Geolocation } = window.Capacitor.Plugins;
            await Geolocation.requestPermissions();
        } catch (e) { console.warn("위치 권한 요청 실패", e); throw e; }
    }
}

const STORAGE_KEY = "giloa-v7";
const STORAGE_BACKUP_KEY = STORAGE_KEY + "-backup";
const STORAGE_CORRUPT_KEY = STORAGE_KEY + "-corrupt";
const STORAGE_TEMP_KEY = STORAGE_KEY + "-pending";
const FOG_ENABLED_KEY = "giloa-fog-enabled";
const MAP_LAYER_KEY = "giloa-map-layers";
const MAP_LAYER_RADIUS_M = 300;
const GPX_SAVES_KEY = "giloa-gpx-saves";
const GPX_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
const TUTORIAL_DONE_KEY = "giloa-tutorial-completed";
const INTRO_STORY_SEEN_KEY = "giloa_intro_story_seen_v5";
// v2 forces the redesigned first-run language screen to appear once for
// users who had already selected a language in an older build.
const LANGUAGE_SELECTED_KEY = "giloa-language-selected-v2";
const LANGUAGE_PREFERENCE_KEY = "giloa-language-v1";
const FIRST_MEETING_DONE_KEY = "giloa-first-meeting-done-v1";
const GILOA_UPDATE_VERSION = "1.4.27";
const GILOA_UPDATE_SEEN_KEY = "giloa-update-seen-" + GILOA_UPDATE_VERSION;
const FOG_ALPHA_BASE = 0.40;
const FOG_ALPHA_PER_LV = 0;
function getFogAlpha() { return FOG_ALPHA_BASE; }
const FOG_RADIUS_M = 18;
const VISION_CONE_RADIUS_M = 70;
const VISION_CONE_SPREAD_DEG = 70;
const MIN_MOVE_M = 15;
// Raw fixes up to 100 m are useful route evidence. Display smoothing and
// implausible-jump rejection happen after the raw point has been persisted.
const MAX_ACCURACY_M = 100;
// Keep the live marker responsive, but never turn a short GPS jump into
// travelled distance or a long fog-clearing line. Samples faster than normal
// road movement are rejected as likely cell/Wi-Fi jumps.
const MAX_PATH_SPEED_MPS = 15;
// A fix received less than a minute after the previous one must remain within
// a fast bicycle pace. This prevents brief cell/Wi-Fi jumps from drawing rays
// while leaving the less strict rule available for longer, real GPS gaps.
const PATH_SHORT_GAP_MAX_SPEED_MPS = 8.5;
const PATH_JUMP_BASE_TOLERANCE_M = 25;
const PATH_SPIKE_WINDOW_MS = 2 * 60 * 1000;
const PATH_SPIKE_MIN_EXCURSION_M = 45;
const STAY_ACCURACY_FACTOR = 1.5;
const MAX_STAY_RADIUS_M = 75;
const SAVE_DELAY_MS = 800;
const CHECKPOINT_INTERVAL_MS = 20000;
const GILOA_PERSISTENCE_DEBUG = true;
const NETWORK_TIMEOUT_MS = 12000;
const NETWORK_RETRY_DELAY_MS = 450;
function waitForNetworkDelay(delay) {
    return new Promise(function(resolve) { setTimeout(resolve, Math.max(0, delay || 0)); });
}
function createHttpError(status) {
    var error = new Error("HTTP " + status);
    error.status = Number(status) || 0;
    return error;
}
function requestJsonByXhr(url, timeoutMs, externalSignal) {
    return new Promise(function(resolve, reject) {
        if (typeof XMLHttpRequest !== "function") { reject(new Error("No supported network transport")); return; }
        var xhr = new XMLHttpRequest();
        var settled = false;
        function finish(error, value) {
            if (settled) return;
            settled = true;
            if (externalSignal && typeof externalSignal.removeEventListener === "function") externalSignal.removeEventListener("abort", abortRequest);
            error ? reject(error) : resolve(value);
        }
        function abortRequest() { try { xhr.abort(); } catch (_) {} finish(new Error("Request aborted")); }
        if (externalSignal && externalSignal.aborted) { finish(new Error("Request aborted")); return; }
        if (externalSignal && typeof externalSignal.addEventListener === "function") externalSignal.addEventListener("abort", abortRequest);
        xhr.open("GET", url, true);
        xhr.timeout = timeoutMs;
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4 || settled) return;
            if (xhr.status < 200 || xhr.status >= 300) { finish(createHttpError(xhr.status)); return; }
            try { finish(null, JSON.parse(xhr.responseText || "null")); }
            catch (_) { finish(new Error("Invalid JSON response")); }
        };
        xhr.onerror = function() { finish(new Error("Network request failed")); };
        xhr.ontimeout = function() { finish(new Error("Network request timed out")); };
        xhr.onabort = function() { finish(new Error("Request aborted")); };
        try { xhr.send(); } catch (error) { finish(error); }
    });
}
function requestJsonOnce(url, options) {
    options = options || {};
    var timeoutMs = Math.max(1000, Number(options.timeoutMs) || NETWORK_TIMEOUT_MS);
    var externalSignal = options.signal || null;
    if (navigator.onLine === false && /^https?:/i.test(url)) return Promise.reject(new Error("Device is offline"));
    if (typeof fetch !== "function") return requestJsonByXhr(url, timeoutMs, externalSignal);
    return new Promise(function(resolve, reject) {
        var settled = false;
        var controller = typeof AbortController === "function" ? new AbortController() : null;
        function finish(error, value) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (externalSignal && typeof externalSignal.removeEventListener === "function") externalSignal.removeEventListener("abort", abortRequest);
            error ? reject(error) : resolve(value);
        }
        function abortRequest() { if (controller) controller.abort(); finish(new Error("Request aborted")); }
        if (externalSignal && externalSignal.aborted) { reject(new Error("Request aborted")); return; }
        if (externalSignal && typeof externalSignal.addEventListener === "function") externalSignal.addEventListener("abort", abortRequest);
        var timer = setTimeout(function() { if (controller) controller.abort(); finish(new Error("Network request timed out")); }, timeoutMs);
        fetch(url, controller ? { signal: controller.signal, cache: options.cache || "no-store" } : { cache: options.cache || "no-store" }).then(function(response) {
            if (!response.ok) throw createHttpError(response.status);
            return response.text();
        }).then(function(text) {
            try { finish(null, JSON.parse(text || "null")); }
            catch (_) { finish(new Error("Invalid JSON response")); }
        }).catch(function(error) { finish(error); });
    });
}
function requestJsonWithRetry(url, options) {
    options = options || {};
    var retries = Math.max(0, Number(options.retries) || 0);
    function attempt(remaining) {
        return requestJsonOnce(url, options).catch(function(error) {
            var status = Number(error && error.status) || 0;
            var retryable = !status || status === 408 || status === 429 || status >= 500;
            if (!retryable || remaining <= 0 || navigator.onLine === false || (options.signal && options.signal.aborted)) throw error;
            var delay = (Number(options.retryDelayMs) || NETWORK_RETRY_DELAY_MS) * Math.pow(2, retries - remaining) + Math.floor(Math.random() * 180);
            return waitForNetworkDelay(delay).then(function() { return attempt(remaining - 1); });
        });
    }
    return attempt(retries);
}
const SCREEN_AWAKE_MS = 8 * 60 * 60 * 1000;
const AUTO_RECORDING_MS = 8 * 60 * 60 * 1000;
const MERGE_DISTANCE_M = 6;
const MERGE_TIME_GAP_MS = 2 * 60 * 1000;
// Eight hours at the native five-second sampling interval is about 5,760
// samples. Leave room for foreground/native overlap without thinning bends.
const MAX_PATH_POINTS = 12000;
const FULL_VISIBILITY_HOURS = 0;
const MIN_VISIBILITY_HOURS = 24;
const MIN_PATH_VISIBILITY = 0.4;
const THREE_DAYS_IN_DAYS = 3;
const ONE_MONTH_DAYS = 30;
const THREE_MONTHS_DAYS = 90;
const SIX_MONTHS_DAYS = 180;
const ONE_YEAR_DAYS = 365;
const SEDIMENT_LAYER_COLOR = "rgba(126, 112, 96, 0.24)";
const CLUSTER_ZOOM_THRESHOLD = 14;
const MARKER_MAX_SIZE = 40;
const MARKER_MIN_SIZE = 20;
const MARKER_MAX_ZOOM = 17;
const MARKER_MIN_ZOOM = 14;
const GAP_THRESHOLD_MS = 3 * 60 * 1000;
const PATH_MID_GAP_MAX_MS = 15 * 60 * 1000;
const PATH_LONG_GAP_MAX_MS = 60 * 60 * 1000;
const PATH_MID_GAP_MAX_SPEED_MPS = 8;
const PATH_LONG_GAP_MAX_SPEED_MPS = 3.5;
const PATH_LONG_GAP_MAX_DISTANCE_M = 5000;
const PATH_CONNECT_MAX_ACCURACY_M = 100;
const PHOTO_STORE_PREVIEW = true;
const PHOTO_POPUP_MAX_SIZE = 2048;
const PHOTO_POPUP_JPEG_QUALITY = 0.92;
const PHOTO_POPUP_MIN_QUALITY = 0.78;
const PHOTO_POPUP_TARGET_BYTES = 1600 * 1024;
const PHOTO_THUMB_SIZE = 120;
const PHOTO_THUMB_JPEG_QUALITY = 0.74;
const PHOTO_THUMB_MIN_QUALITY = 0.58;
const PHOTO_THUMB_TARGET_BYTES = 24 * 1024;
const PHOTO_ORIGINAL_MAX_BYTES = 32 * 1024 * 1024;
const PHOTO_LOCATION_GOOD_ACCURACY_M = 80;
const PHOTO_LOCATION_MAX_ROUTE_TIME_MS = 15 * 60 * 1000;
const PHOTO_REMOTE_MAX_SIZE = 1920;
const PHOTO_REMOTE_JPEG_QUALITY = 0.9;
const IMAGE_CLASSIFIER_MODEL_URL = "./tm-my-image-model/model.json";
const IMAGE_CLASSIFIER_METADATA_URL = "./tm-my-image-model/metadata.json";
const IMAGE_CLASSIFIER_THRESHOLD = 0.8;
const IMAGE_CLASS_BADGES = {
    "Hyundai Fountain": "image_hyundai_fountain",
    "Heendy": "image_heendy",
    "Dasan Street": "image_dasan_street"
};

const LEVEL_TABLE = [
{ level: 1, title: "Wanderer", distKm: 0, memories: 0, photos: 0 },
{ level: 2, title: "Trace Maker", distKm: 1, memories: 0, photos: 0 },
{ level: 3, title: "Explorer", distKm: 10, memories: 1, photos: 0 },
{ level: 4, title: "Path Builder", distKm: 30, memories: 3, photos: 0 },
{ level: 5, title: "Wind Walker", distKm: 60, memories: 5, photos: 3 },
{ level: 6, title: "Memory Collector", distKm: 100, memories: 8, photos: 5 },
{ level: 7, title: "Two-Wheel Traveler", distKm: 150, memories: 12, photos: 8 },
{ level: 8, title: "Map Maker", distKm: 220, memories: 18, photos: 12 },
{ level: 9, title: "Road Chronicler", distKm: 300, memories: 25, photos: 18 },
{ level: 10, title: "Pioneer", distKm: 400, memories: 35, photos: 25 },
{ level: 11, title: "Speed Explorer", distKm: 550, memories: 45, photos: 33 },
{ level: 12, title: "Orbit Rider", distKm: 720, memories: 58, photos: 43 },
{ level: 13, title: "Continent Crosser", distKm: 900, memories: 72, photos: 55 },
{ level: 14, title: "World Witness", distKm: 1100, memories: 88, photos: 68 },
{ level: 15, title: "World Recorder", distKm: 1350, memories: 107, photos: 84 },
];

const LEVEL_TITLE_I18N = {
    ko: LEVEL_TABLE.map(function(row) { return row.title; }),
    en: LEVEL_TABLE.map(function(row) { return row.title; }),
    ja: LEVEL_TABLE.map(function(row) { return row.title; }),
    zh: LEVEL_TABLE.map(function(row) { return row.title; }),
    es: ["Caminante","Creador de Huellas","Explorador","Constructor de Caminos","Caminante del Viento","Coleccionista de Recuerdos","Viajero sobre Ruedas","Cartógrafo","Cronista de Caminos","Pionero","Explorador Veloz","Viajero Orbital","Viajero Continental","Testigo del Mundo","Cronista del Mundo"],
    fr: ["Promeneur","Traceur de chemins","Explorateur","Bâtisseur de chemins","Marcheur du vent","Collectionneur de souvenirs","Voyageur à deux roues","Cartographe","Chroniqueur des routes","Pionnier","Explorateur éclair","Voyageur des horizons","Traverseur de continents","Témoin du monde","Gardien du monde"]
};
function getLevelTitle(current) {
    // Compatibility for older callers: official HUD titles now come from RPG growth.
    if (typeof loadRpgGrowth === "function") return getRpgTrait(loadRpgGrowth()).name;
    var titles = LEVEL_TITLE_I18N[currentLang] || LEVEL_TITLE_I18N.ko;
    var idx = Math.max(0, (current && current.level ? current.level : 1) - 1);
    return titles[idx] || titles[titles.length - 1] || "";
}
const SPEED_LIMIT_WALK = 7 / 3.6;
const SPEED_LIMIT_BIKE = 30 / 3.6;

// IndexedDB ?占?占쎌냼
const IDB_NAME = "giloa-photos"; const IDB_VERSION = 2; const IDB_STORE = "images"; const IDB_GPS_STORE = "gps-points"; let idb = null;
var photoStoragePersistenceRequested = false;
function openIdb() {
    // The database is opened WITHOUT a fixed version first. A database created by a
    // newer build used to fail with VersionError, which silently wiped every photo
    // thumbnail and every photo marker while localStorage still held the records.
    return new Promise(function(resolve, reject) {
        if (idb) { resolve(idb); return; }
        function upgradeStores(db) {
            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: "id" });
            if (!db.objectStoreNames.contains(IDB_GPS_STORE)) {
                var gpsStore = db.createObjectStore(IDB_GPS_STORE, { keyPath: "id" });
                gpsStore.createIndex("timestamp", "timestamp", { unique:false });
            }
        }
        function adopt(db) {
            idb = db;
            idb.onversionchange = function() { try { idb.close(); } catch (_) {} idb = null; };
            resolve(idb);
        }
        var probe;
        try { probe = indexedDB.open(IDB_NAME); }
        catch (error) { reject(error); return; }
        probe.onupgradeneeded = function(e) { upgradeStores(e.target.result); };
        probe.onerror = function(e) { reject(e.target.error); };
        probe.onblocked = function() { reject(new Error("Local storage is blocked")); };
        probe.onsuccess = function(e) {
            var db = e.target.result;
            if (db.objectStoreNames.contains(IDB_STORE) && db.objectStoreNames.contains(IDB_GPS_STORE)) { adopt(db); return; }
            var nextVersion = Math.max(IDB_VERSION, (db.version || 1) + 1);
            try { db.close(); } catch (_) {}
            var upgradeRequest = indexedDB.open(IDB_NAME, nextVersion);
            upgradeRequest.onupgradeneeded = function(ev) { upgradeStores(ev.target.result); };
            upgradeRequest.onsuccess = function(ev) { adopt(ev.target.result); };
            upgradeRequest.onerror = function(ev) { reject(ev.target.error); };
            upgradeRequest.onblocked = function() { reject(new Error("Local storage is blocked")); };
        };
    });
}
function idbSaveGpsPoint(point) { if (!point) return Promise.resolve(); var row = Object.assign({}, point, { id:String(point.id || (point.timestamp + ":" + point.lat.toFixed(7) + ":" + point.lng.toFixed(7))) }); return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_GPS_STORE, "readwrite"); tx.objectStore(IDB_GPS_STORE).put(row); tx.oncomplete = resolve; tx.onerror = function(e) { reject(tx.error || e.target.error); }; }); }); }
function idbGetAllGpsPoints() { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_GPS_STORE, "readonly").objectStore(IDB_GPS_STORE).getAll(); req.onsuccess = function(e) { resolve(e.target.result || []); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function requestPhotoStoragePersistence() {
    if (photoStoragePersistenceRequested) return;
    photoStoragePersistenceRequested = true;
    try {
        if (navigator.storage && typeof navigator.storage.persist === "function") navigator.storage.persist().catch(function() {});
    } catch (_) {}
}
function writePhotoRow(row) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).put(row); tx.oncomplete = function() { resolve(row); }; tx.onerror = function(e) { reject(tx.error || e.target.error); }; tx.onabort = function(e) { reject(tx.error || e.target.error); }; }); }); }
function idbSavePhoto(id, photo, thumb, originalBlob, originalMimeType) {
    requestPhotoStoragePersistence();
    var safeOriginal = originalBlob && typeof originalBlob.size === "number" && originalBlob.size <= PHOTO_ORIGINAL_MAX_BYTES ? originalBlob : null;
    var row = { id: id, photo: photo || "", thumb: thumb || "", originalBlob: safeOriginal, originalMimeType: originalMimeType || (safeOriginal && safeOriginal.type) || "image/jpeg" };
    return writePhotoRow(row).catch(function(error) {
        if (!safeOriginal) throw error;
        console.warn("Original photo storage failed; keeping high-resolution preview", error && error.name);
        row.originalBlob = null;
        return writePhotoRow(row);
    });
}
function idbGetPhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(id); req.onsuccess = function(e) { resolve(e.target.result || null); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbDeletePhoto(id) { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var tx = db.transaction(IDB_STORE, "readwrite"); tx.objectStore(IDB_STORE).delete(id); tx.oncomplete = resolve; tx.onerror = function(e) { reject(e.target.error); }; }); }); }
function idbGetAllPhotos() { return openIdb().then(function(db) { return new Promise(function(resolve, reject) { var req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).getAll(); req.onsuccess = function(e) { resolve(e.target.result || []); }; req.onerror = function(e) { reject(e.target.error); }; }); }); }
function migratePhotosToThumbOnly() {
    if (PHOTO_STORE_PREVIEW) return Promise.resolve();
    return idbGetAllPhotos().then(function(list) {
        var tasks = [];
        list.forEach(function(row) {
            if (!row || !row.id || !row.thumb) return;
            if (row.photo && row.photo !== row.thumb) tasks.push(idbSavePhoto(row.id, "", row.thumb, row.originalBlob || null, row.originalMimeType || ""));
        });
        if (tasks.length === 0) return;
        return Promise.all(tasks);
    }).catch(function(e) { console.warn("사진 경량화 실패", e); });
}

// ???占쏀깭 蹂??
let isRecording = false; let photos = []; let isFogEnabled = true; let isHudExpanded = false;
// Blob URLs are session-only display handles. They are deliberately kept out
// of localStorage so a restored journey never overwrites durable photo data.
var photoDisplayObjectUrls = new Map();
var recordingSessionId = null;
var recordingSessionStartedAt = 0;
// A clean install starts with destinations only. Once the user changes a
// switch, the complete selection is restored from localStorage on later runs.
var MAP_LAYER_DEFAULTS = { tourism: true, library: false, restaurant: false, lodging: false, restroom: false, parking: false, fishing: false, camping: false, durunubi: false, community: false };
var MAP_LAYER_UNAVAILABLE = { community: true };
var MAP_VIEWPORT_MARKER_LIMIT = 100;
var MAP_VIEWPORT_ROUTE_LIMIT = 60;
var MAP_VIEWPORT_MAX_RADIUS_M = 20000;
function loadMapLayerSettings() {
    try {
        var raw = localStorage.getItem(MAP_LAYER_KEY);
        var saved = raw ? JSON.parse(raw) : {};
        return Object.assign({}, MAP_LAYER_DEFAULTS, saved);
    } catch (e) { return Object.assign({}, MAP_LAYER_DEFAULTS); }
}
var mapLayerSettings = loadMapLayerSettings();
var librariesLoaded = false;
function saveMapLayerSettings() {
    try { localStorage.setItem(MAP_LAYER_KEY, JSON.stringify(mapLayerSettings)); }
    catch (error) { console.warn("Map layer settings could not be saved", error); }
}
let currentPos = null; let rawGpsPoints = []; let pathCoordinates = []; let memories = []; let specialPlacePins = []; let totalDistance = 0;
// Only explicit user deletions are recorded here; absent entries are not deletions.
var deletedJourneyRecords = { memories: [], photos: [] };
let currentAccuracy = Infinity;
let currentPositionTimestamp = 0;
let currentUserId = "local";
let playerMarker = null; let playerAccuracyCircle = null; let playerHeading = null; let watchId = null; let backgroundWatchId = null; let backgroundWatchStartPromise = null; let trackingRequested = false; let saveTimer = null; let rafId = null;
let screenWakeLock = null; let screenWakeLockTimer = null; let screenAwakeUntil = 0; let autoRecordingTimer = null; let trackingRetryTimer = null; let photoTapTimer = null;
let autoRecordingNoticePending = false;
let pendingRecordingStartAfterRestore = false;
const memoryMarkers = new Map();
const specialPlaceMarkers = new Map();
let specialPlaceEditorCoords = null; let activeSpecialPlaceMarker = null; let activeSpecialPlacePin = null; let specialPlacePopupTimer = null;
let activeGpxId = null; let activeGpxLayers = []; let dialHours = 8;
const STAY_BONUS_MS = 30 * 60 * 1000; const STAY_BONUS_RADIUS_M = 50;
const IMAGE_MISSION_RADIUS_M = 120;
let stayBonusStartTime = null; let stayBonusAnchor = null; let stayBonusLevelBoost = 0; let stayBonusPlaces = [];
let activeImageMission = null;
var visitCandidate = { contentId: "", enteredAt: 0, item: null };
var completedVisitKeys = new Set();
// Nearby results follow the visible map area; a stale GPS position must not
// drive the list after the user pans elsewhere.
var tourSearchMode = "map";
const DAILY_TASK_KEY = "giloa-daily-tasks-v1";
const DAILY_SHARE_KEY = "giloa-daily-share-v1";
const DAILY_GROWTH_KEY = "giloa-daily-growth-v1";
const DAILY_SHARE_TEXT = {
    ko: { mission: "길로아 알리기", action: "알리기", text: "길로아와 함께 나만의 여행 지도를 만들고 있어요." },
    en: { mission: "Share Giloa", action: "Share", text: "I am making my own travel map with Giloa." },
    ja: { mission: "ギロをシェアする", action: "シェア", text: "ギロと一緒に、自分だけの旅の地図を作っています。" },
    zh: { mission: "分享 Giloa", action: "分享", text: "我正在用 Giloa 制作属于自己的旅行地图。" },
    es: { mission: "Comparte Giloa", action: "Compartir", text: "Estoy creando mi propio mapa de viaje con Giloa." },
    fr: { mission: "Partager Giloa", action: "Partager", text: "Je crée ma propre carte de voyage avec Giloa." }
};
// 길로아를 알릴 때 사용하는 대표 링크. 스토어 주소를 기본으로 쓴다
// (받는 사람이 바로 설치할 수 있는 쪽이 전환에 유리하다).
const GILOA_STORE_URL = "https://play.google.com/store/apps/details?id=com.giloa.app";
const GILOA_SITE_URL = "https://play.google.com/store/apps/details?id=com.giloa.app";
const GILOA_SHARE_UI = {
    ko: { title: "길로아 알리기", intro: "친구에게 길로아를 소개해 주세요. 알리면 오늘의 할 일이 완료됩니다.", system: "다른 앱으로 공유", instagram: "인스타그램", copyLink: "링크 복사", copied: "문구와 링크를 복사했어요!", igGuide: "인스타그램은 링크 공유 기능이 없어 문구를 복사한 뒤 앱을 열어드려요. 스토리나 게시물에 붙여넣어 주세요.", note: "인스타그램·카카오톡은 ‘다른 앱으로 공유’에서도 선택할 수 있어요." , "modeApp": "길로아 소개", "modeJourney": "내가 걸은 길", "shareImage": "이미지로 공유", "saveImage": "이미지 저장", "journeyNote": "내가 걸은 길은 오늘 기록(거리·발견·사진·기억)으로 카드 이미지를 만듭니다. SNS 링크 버튼에는 요약 문구와 링크만 담깁니다." },
    en: { title: "Share Giloa", intro: "Introduce Giloa to a friend. Sharing completes today's task.", system: "Share via apps", instagram: "Instagram", copyLink: "Copy link", copied: "Message and link copied!", igGuide: "Instagram has no link-sharing API, so the text is copied and the app opens. Paste it into a story or post.", note: "Instagram and KakaoTalk are also available under \u201cShare via apps\u201d." , "modeApp": "About Giloa", "modeJourney": "My route", "shareImage": "Share as image", "saveImage": "Save image", "journeyNote": "Your route becomes a card image from today\u2019s record. Link buttons carry only the summary text and the link." },
    ja: { title: "ギロをシェア", intro: "友だちにギロを紹介しましょう。シェアすると今日のやることが完了します。", system: "他のアプリで共有", instagram: "Instagram", copyLink: "リンクをコピー", copied: "テキストとリンクをコピーしました！", igGuide: "Instagramにはリンク共有機能がないため、テキストをコピーしてアプリを開きます。ストーリーや投稿に貼り付けてください。", note: "InstagramやLINEは「他のアプリで共有」からも選べます。" , "modeApp": "ギロ紹介", "modeJourney": "歩いた道", "shareImage": "画像でシェア", "saveImage": "画像を保存", "journeyNote": "歩いた道は今日の記録からカード画像を作ります。リンクボタンには要約とリンクのみ入ります。" },
    zh: { title: "分享 Giloa", intro: "把 Giloa 介绍给朋友吧。分享后即完成今天的任务。", system: "用其他应用分享", instagram: "Instagram", copyLink: "复制链接", copied: "已复制文案和链接！", igGuide: "Instagram 没有链接分享接口，因此会复制文案并打开应用，请粘贴到故事或帖子中。", note: "Instagram 和微信也可在“用其他应用分享”中选择。" , "modeApp": "介绍 Giloa", "modeJourney": "我走过的路", "shareImage": "以图片分享", "saveImage": "保存图片", "journeyNote": "我走过的路会用今天的记录生成卡片图片。链接按钮只包含摘要和链接。" },
    es: { title: "Comparte Giloa", intro: "Presenta Giloa a un amigo. Compartir completa la tarea de hoy.", system: "Compartir con apps", instagram: "Instagram", copyLink: "Copiar enlace", copied: "¡Texto y enlace copiados!", igGuide: "Instagram no permite compartir enlaces, así que copiamos el texto y abrimos la app. Pégalo en una historia o publicación.", note: "Instagram también está disponible en \u201cCompartir con apps\u201d." , "modeApp": "Sobre Giloa", "modeJourney": "Mi ruta", "shareImage": "Compartir imagen", "saveImage": "Guardar imagen", "journeyNote": "Tu ruta se convierte en una imagen con el registro de hoy. Los enlaces solo llevan el resumen y el enlace." },
    fr: { title: "Partager Giloa", intro: "Présentez Giloa à un ami. Partager valide la tâche du jour.", system: "Partager via une app", instagram: "Instagram", copyLink: "Copier le lien", copied: "Texte et lien copiés !", igGuide: "Instagram ne propose pas de partage de lien : le texte est copié et l\u2019app s\u2019ouvre. Collez-le dans une story ou un post.", note: "Instagram est aussi disponible dans \u00ab Partager via une app \u00bb." , "modeApp": "\u00c0 propos", "modeJourney": "Mon parcours", "shareImage": "Partager en image", "saveImage": "Enregistrer", "journeyNote": "Votre parcours devient une image \u00e0 partir du relev\u00e9 du jour. Les liens ne contiennent que le r\u00e9sum\u00e9 et le lien." }
};
// 각 SNS의 웹 공유(인텐트) 엔드포인트. 설치된 앱이 있으면 모바일에서 앱이 열린다.
const GILOA_SHARE_TARGETS = [
    { id: "threads", label: "Threads", mark: "@", accent: "#ffffff", build: function(text, url) { return "https://www.threads.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url); } },
    { id: "x", label: "X", mark: "X", accent: "#ffffff", build: function(text, url) { return "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url); } },
    { id: "facebook", label: "Facebook", mark: "f", accent: "#7aacff", build: function(text, url) { return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(text); } },
    { id: "line", label: "LINE", mark: "L", accent: "#8fe388", build: function(text, url) { return "https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text); } },
    { id: "band", label: "BAND", mark: "B", accent: "#8fe388", build: function(text, url) { return "https://band.us/plugin/share?body=" + encodeURIComponent(text + "\n" + url) + "&route=" + encodeURIComponent(url); } }
];
const RPG_GROWTH_KEY = "giloa-rpg-growth-v1";
const RPG_POINTS_PER_LEVEL = 40;
const RPG_STAT_KEYS = ["exploration", "experience", "memory", "connection", "growth"];
const RPG_STAT_LABELS = { exploration:"탐험", experience:"경험", memory:"기억", connection:"연결", growth:"성장" };
const RPG_TEXT = {
    ko:{stats:{exploration:"탐험",experience:"경험",memory:"기억",connection:"연결",growth:"성장"},beginner:["길을 배우는 여행자","조금씩 나만의 여행 성향을 만들어 가는 중"],traits:{exploration:["개척자","새로운 길과 미지의 장소를 즐기는 여행자"],experience:["문화 여행가","지역의 문화와 경험을 깊게 만나는 여행자"],memory:["세계의 기록자","순간과 이야기를 오래 남기는 여행자"],connection:["길잡이","사람과 지역을 이어 주는 여행자"],growth:["모험가","미션과 도전을 즐기며 전진하는 여행자"]},forming:"성향 형성 중",job:"직업 활성화",next:"다음 레벨까지",max:"최고 레벨 달성",local:"이 기기에 저장된 기록"},
    en:{stats:{exploration:"Exploration",experience:"Experience",memory:"Memory",connection:"Connection",growth:"Growth"},beginner:["Learning Traveler","Your travel style is beginning to take shape"],traits:{exploration:["Pioneer","A traveler drawn to new paths and unknown places"],experience:["Culture Traveler","A traveler who dives into local culture and experiences"],memory:["World Recorder","A traveler who preserves moments and stories"],connection:["Guide","A traveler who connects people and places"],growth:["Adventurer","A traveler who moves forward through missions and challenges"]},forming:"Style forming",job:"Class active",next:"Until next level",max:"Max level reached",local:"Records saved on this device"},
    ja:{stats:{exploration:"探索",experience:"体験",memory:"記憶",connection:"つながり",growth:"成長"},beginner:["旅を学ぶ人","自分らしい旅のスタイルを少しずつ育てています"],traits:{exploration:["開拓者","新しい道と未知の場所を楽しむ旅人"],experience:["文化の旅人","地域の文化と体験を深く味わう旅人"],memory:["世界の記録者","瞬間と物語を長く残す旅人"],connection:["道しるべ","人と地域をつなぐ旅人"],growth:["冒険者","ミッションと挑戦を楽しむ旅人"]},forming:"傾向を形成中",job:"クラス解放",next:"次のレベルまで",max:"最高レベル達成",local:"この端末に保存された記録"},
    zh:{stats:{exploration:"探索",experience:"体验",memory:"记忆",connection:"连接",growth:"成长"},beginner:["学习旅行的人","正在慢慢形成属于自己的旅行风格"],traits:{exploration:["开拓者","喜欢新道路和未知地点的旅行者"],experience:["文化旅行家","深入体验当地文化的旅行者"],memory:["世界记录者","长久保存瞬间与故事的旅行者"],connection:["引路人","连接人与地区的旅行者"],growth:["冒险家","通过任务与挑战不断前进的旅行者"]},forming:"风格形成中",job:"职业已启用",next:"距离下一级",max:"已达到最高等级",local:"保存在此设备上的记录"},
    es:{stats:{exploration:"Exploración",experience:"Experiencia",memory:"Recuerdos",connection:"Conexión",growth:"Crecimiento"},beginner:["Viajero aprendiz","Tu estilo de viaje empieza a tomar forma"],traits:{exploration:["Pionero","Un viajero atraído por caminos nuevos y lugares desconocidos"],experience:["Viajero cultural","Un viajero que se sumerge en la cultura y las experiencias locales"],memory:["Cronista del mundo","Un viajero que conserva momentos e historias"],connection:["Guía","Un viajero que conecta personas y lugares"],growth:["Aventurero","Un viajero que avanza mediante misiones y desafíos"]},forming:"Estilo en formación",job:"Clase activa",next:"Para el siguiente nivel",max:"Nivel máximo alcanzado",local:"Registros guardados en este dispositivo"},
    fr:{stats:{exploration:"Exploration",experience:"Expérience",memory:"Souvenirs",connection:"Lien",growth:"Progression"},beginner:["Voyageur en devenir","Votre style de voyage prend doucement forme"],traits:{exploration:["Pionnier","Un voyageur attiré par les nouveaux chemins et les lieux inconnus"],experience:["Voyageur culturel","Un voyageur qui s’immerge dans la culture et les expériences locales"],memory:["Gardien des souvenirs","Un voyageur qui conserve les instants et les histoires"],connection:["Éclaireur","Un voyageur qui relie les personnes et les lieux"],growth:["Aventurier","Un voyageur qui avance grâce aux missions et aux défis"]},forming:"Style en formation",job:"Classe active",next:"Jusqu’au niveau suivant",max:"Niveau maximum atteint",local:"Souvenirs enregistrés sur cet appareil",toastKicker:"UN MOT DE GILO",toastGrowing:"Votre voyage continue de grandir.",toastReward:"Chaque découverte vécue devient un souvenir.",levelReached:"Niveau {level} atteint !",newStage:"Une nouvelle étape de voyage s’ouvre.",traitChanged:"Style de voyage : {trait}",statGained:"{stat} +{amount}",actionBecameSkill:"Ce que vous venez de faire est devenu une compétence de voyage.",connectionGained:"Lien +{amount}",connectionDetail:"Vous avez rapproché des personnes et des lieux."}
};
function getRpgText() { return RPG_TEXT[currentLang] || RPG_TEXT.ko; }
// The HUD has one official progression model.  Legacy distance/photo levels are
// retained only for old saved data compatibility and are never rendered.
var rpgDetailsOpen = false;
var RPG_HUD_TEXT = {
    ko:{learning:["여행을 배우는 길로","첫 걸음마다 나만의 지도를 채우고 있어요."],forming:["길을 만들어 가는 길로","좋아하는 여행의 모습이 조금씩 드러나고 있어요."],seasoned:["여행색을 찾아가는 길로","나만의 여행 방식이 단단해지고 있어요."],identity:"나만의 여행 정체성",myGilo:"나의 길로",myTravelColor:"나의 여행색",today:"오늘의 여정",distance:"거리",discoveries:"발견",photos:"사진",missions:"미션",detailShow:"자세한 여행색 보기",detailHide:"자세한 여행색 접기",next:"다음 레벨까지",max:"여행 정체성 완성",local:"이 기기에 안전하게 저장됩니다."},
    en:{learning:["Gilo learning to travel","Every first step is filling in your own map."],forming:["Gilo making new paths","The kind of travel you love is beginning to appear."],seasoned:["Gilo finding its travel colors","Your own way of traveling is growing stronger."],identity:"Your travel identity",myGilo:"My Gilo",myTravelColor:"My travel colors",today:"Today’s journey",distance:"Distance",discoveries:"Discoveries",photos:"Photos",missions:"Missions",detailShow:"View travel colors",detailHide:"Hide travel colors",next:"Until next level",max:"Travel identity complete",local:"Saved safely on this device."},
    ja:{learning:["旅を学ぶギロ","最初の一歩から、自分だけの地図が広がります。"],forming:["道をつくるギロ","好きな旅のかたちが少しずつ見えてきます。"],seasoned:["旅の色を探すギロ","自分らしい旅のスタイルが育っています。"],identity:"あなたの旅のアイデンティティ",myGilo:"私のギロ",myTravelColor:"私の旅色",today:"今日の旅",distance:"距離",discoveries:"発見",photos:"写真",missions:"ミッション",detailShow:"旅色の詳細を見る",detailHide:"旅色の詳細を閉じる",next:"次のレベルまで",max:"旅のアイデンティティ完成",local:"この端末に安全に保存されます。"},
    zh:{learning:["学习旅行的 Gilo","每一次迈步都在填满属于你的地图。"],forming:["正在开拓道路的 Gilo","你喜欢的旅行方式正慢慢显现。"],seasoned:["寻找旅行色彩的 Gilo","属于你的旅行方式正变得坚定。"],identity:"你的旅行身份",myGilo:"我的 Gilo",myTravelColor:"我的旅行色彩",today:"今天的旅程",distance:"距离",discoveries:"发现",photos:"照片",missions:"任务",detailShow:"查看旅行色彩",detailHide:"收起旅行色彩",next:"距离下一级",max:"旅行身份已完成",local:"已安全保存在此设备中。"},
    es:{learning:["Gilo aprende a viajar","Cada primer paso llena tu propio mapa."],forming:["Gilo abre nuevos caminos","La forma de viajar que amas empieza a aparecer."],seasoned:["Gilo busca sus colores viajeros","Tu propia manera de viajar se fortalece."],identity:"Tu identidad viajera",myGilo:"Mi Gilo",myTravelColor:"Mis colores de viaje",today:"El viaje de hoy",distance:"Distancia",discoveries:"Descubrimientos",photos:"Fotos",missions:"Misiones",detailShow:"Ver colores de viaje",detailHide:"Ocultar colores de viaje",next:"Hasta el siguiente nivel",max:"Identidad viajera completada",local:"Guardado de forma segura en este dispositivo."},
    fr:{learning:["Gilo apprend à voyager","Chaque premier pas remplit votre propre carte."],forming:["Gilo crée de nouveaux chemins","La manière de voyager que vous aimez commence à apparaître."],seasoned:["Gilo cherche ses couleurs de voyage","Votre façon de voyager se renforce."],identity:"Votre identité de voyage",myGilo:"Mon Gilo",myTravelColor:"Mes couleurs de voyage",today:"Le voyage d’aujourd’hui",distance:"Distance",discoveries:"Découvertes",photos:"Photos",missions:"Missions",detailShow:"Voir les couleurs de voyage",detailHide:"Masquer les couleurs de voyage",next:"Jusqu’au niveau suivant",max:"Identité de voyage accomplie",local:"Enregistré en toute sécurité sur cet appareil."}
};
function getRpgHudText() { return RPG_HUD_TEXT[currentLang] || RPG_HUD_TEXT.ko; }
let dailyTaskPanelOpen = false;
let dailyRouteLayer = null;
let selectedDestination = null;
let selectedVisitMarker = null;
var discoveryRewardTimer = null;
var giloLastReactionAt = 0;
var GILO_30_SCENE_BASE = "./gilo many appearance/길로_장면별_30장_PNG/";
function getGilo30Scene(number) { return GILO_30_SCENE_BASE + "gilo_scene_" + String(number).padStart(2, "0") + ".png"; }
// Scene assets progressively replace the legacy random reaction pool. A missing
// scene is never substituted with another illustration.
var GILO_SCENE_IMAGES = {
    first_meeting:getGilo30Scene(1), find_location:getGilo30Scene(2), start_recording:getGilo30Scene(3), first_walk:getGilo30Scene(4), first_path_reveal:getGilo30Scene(5),
    free_exploration:getGilo30Scene(6), place_discovered:getGilo30Scene(7), destination_suggested:getGilo30Scene(8), approaching_place:getGilo30Scene(9), place_arrived:getGilo30Scene(10),
    photo_suggest:getGilo30Scene(11), photo_saved:getGilo30Scene(12), memory_saved:getGilo30Scene(13), long_stay:getGilo30Scene(14), mission_found:getGilo30Scene(15), mission_complete:getGilo30Scene(16), daily_complete:getGilo30Scene(17),
    item_discovered:getGilo30Scene(18), treasure_open:getGilo30Scene(19), item_obtained:getGilo30Scene(20), hidden_mission_found:getGilo30Scene(21), hidden_mission_complete:getGilo30Scene(22), level_up:getGilo30Scene(23), badge_obtained:getGilo30Scene(24),
    rainy_day:getGilo30Scene(25), snow_day:getGilo30Scene(26), night_exploration:getGilo30Scene(27), lost_direction:getGilo30Scene(28), rest_break:getGilo30Scene(29), trip_end:getGilo30Scene(30), welcome_back:getGilo30Scene(1), thank_you:getGilo30Scene(30)
};
var GILO_REACTION_SCENES = {
    photo:["photo_suggest","photo_saved","memory_saved"], memory:["memory_saved","long_stay","rest_break"],
    mission:["mission_found","mission_complete","item_obtained"], daily:["daily_complete","level_up","trip_end"],
    discovery:["free_exploration","place_discovered","approaching_place","place_arrived"], item:["item_discovered","treasure_open","item_obtained"], badge:["item_discovered","treasure_open","badge_obtained"],
    level:["level_up","badge_obtained","thank_you"], welcome:["first_meeting","welcome_back","free_exploration"]
};
var giloReactionSceneIndex = {};
var giloMissingSceneWarnings = {};
var GILO_REACTION_TEXT = {
    ko:{photo:["사진을 남겼구나!","이 순간도 여행의 기억이 됐어."],memory:["기억 하나가 더 생겼어!","나중에 다시 보면 분명 반가울 거야."],mission:["미션 완료!","오늘도 한 걸음 성장했어."],daily:["오늘의 할 일 완료!","정말 멋져. 오늘의 여행을 모두 채웠어!"],badge:["새로운 업적이야!","네 여행이 특별한 기록을 만들었어."],level:["레벨 업!","함께 걸어온 길이 이렇게 커졌어."],discovery:["새로운 곳을 발견했어!","지도에 또 하나의 이야기가 생겼어."],welcome:["다시 만나서 반가워!","오늘은 어떤 길을 만나게 될까?"]},
    en:{photo:["Photo saved!","This moment is now part of your journey."],memory:["A new memory!","It will be wonderful to revisit someday."],mission:["Mission complete!","You grew another step today."],daily:["Today's tasks complete!","Wonderful—you filled today's journey."],badge:["A new achievement!","Your travels created something special."],level:["Level up!","Look how far our journey has grown."],discovery:["A new discovery!","Your map has another story."],welcome:["Great to see you again!","What path will we find today?"]},
    ja:{photo:["写真を残したね！","この瞬間も旅の記憶になったよ。"],memory:["新しい記憶が増えたよ！","いつか見返すのが楽しみだね。"],mission:["ミッション完了！","今日も一歩成長したね。"],daily:["今日のタスク完了！","すごい！今日の旅を全部満たしたよ。"],badge:["新しい実績だよ！","君の旅が特別な記録を作ったね。"],level:["レベルアップ！","一緒に歩いた道がこんなに広がったよ。"],discovery:["新しい場所を発見！","地図にまた物語が増えたよ。"],welcome:["また会えてうれしい！","今日はどんな道に出会えるかな？"]},
    zh:{photo:["照片保存好了！","这一刻也成为旅行记忆了。"],memory:["又多了一份记忆！","以后再看一定会很开心。"],mission:["任务完成！","今天也向前成长了一步。"],daily:["今日任务全部完成！","太棒了，今天的旅程已经填满！"],badge:["获得新成就！","你的旅行留下了特别的记录。"],level:["升级了！","我们一起走过的路越来越长了。"],discovery:["发现了新地点！","地图上又多了一个故事。"],welcome:["很高兴再次见到你！","今天会遇见怎样的道路呢？"]},
    es:{photo:["¡Foto guardada!","Este momento ya forma parte de tu viaje."],memory:["¡Un recuerdo nuevo!","Será bonito volver a verlo algún día."],mission:["¡Misión completada!","Hoy has crecido un paso más."],daily:["¡Tareas de hoy completadas!","Genial: has llenado el viaje de hoy."],badge:["¡Nuevo logro!","Tu viaje ha creado un recuerdo especial."],level:["¡Subiste de nivel!","Mira cuánto ha crecido nuestro viaje."],discovery:["¡Nuevo lugar descubierto!","Tu mapa tiene una historia más."],welcome:["¡Qué alegría volver a verte!","¿Qué camino encontraremos hoy?"]},
    fr:{
        photo:["Photo enregistrée !","Ce moment fait désormais partie de votre voyage."],
        memory:["Un nouveau souvenir !","Ce sera un plaisir de le revoir un jour."],
        mission:["Mission accomplie !","Vous avez encore progressé aujourd’hui."],
        daily:["Les tâches du jour sont terminées !","Bravo, vous avez accompli le voyage d’aujourd’hui."],
        badge:["Un nouveau succès !","Votre voyage a créé un souvenir exceptionnel."],
        level:["Niveau supérieur !","Regardez tout le chemin parcouru ensemble."],
        discovery:["Un nouveau lieu découvert !","Votre carte compte une nouvelle histoire."],
        welcome:["Ravi de vous revoir !","Quel chemin allons-nous découvrir aujourd’hui ?"]
    }
};
function setGiloSceneImage(image, sceneId) {
    if (!image) return false;
    var source = GILO_SCENE_IMAGES[sceneId];
    image.onerror = function() {
        image.hidden = true; image.removeAttribute("src");
        if (!giloMissingSceneWarnings[sceneId]) { console.warn("Missing Gilo scene image:", source || sceneId); giloMissingSceneWarnings[sceneId] = true; }
    };
    if (!source) { image.onerror(); return false; }
    image.hidden = false; image.src = encodeURI(source); image.dataset.scene = sceneId;
    return true;
}
function setDiscoveryGiloImage(type) {
    var image = document.getElementById("discovery-gilo");
    var choices = GILO_REACTION_SCENES[type] || ["free_exploration"];
    if (!Array.isArray(choices)) choices = [choices];
    var index = Number(giloReactionSceneIndex[type]) || 0;
    var sceneId = choices[index % choices.length];
    giloReactionSceneIndex[type] = index + 1;
    return setGiloSceneImage(image, sceneId);
}
function showGiloReaction(type, detail, options) {
    options = options || {}; var now = Date.now();
    if (!options.force && now - giloLastReactionAt < 900) return false;
    giloLastReactionAt = now;
    var toast = document.getElementById("discovery-toast"); if (!toast) return false;
    var words = (GILO_REACTION_TEXT[currentLang] || GILO_REACTION_TEXT.ko)[type] || (GILO_REACTION_TEXT[currentLang] || GILO_REACTION_TEXT.ko).mission;
    setDiscoveryGiloImage(type);
    var kicker = toast.querySelector(".discovery-kicker"); if (kicker) kicker.textContent = earlyUiText("giloEncouragement");
    document.getElementById("discovery-place-name").textContent = options.title || words[0];
    document.getElementById("discovery-method").textContent = detail || words[1];
    document.getElementById("discovery-reward").textContent = options.reward || "";
    if (discoveryRewardTimer) clearTimeout(discoveryRewardTimer);
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, options.duration || 5200);
    return true;
}
function preloadGiloReactionImages() { preloadGiloSceneImages(); }
function preloadGiloSceneImages() { Object.keys(GILO_SCENE_IMAGES).forEach(function(sceneId) { var image = new Image(); image.onerror = function() { if (!giloMissingSceneWarnings[sceneId]) { console.warn("Missing Gilo scene image:", GILO_SCENE_IMAGES[sceneId]); giloMissingSceneWarnings[sceneId] = true; } }; image.src = encodeURI(GILO_SCENE_IMAGES[sceneId]); }); }
var recentDiscoveryPulse = { startedAt: 0, lat: null, lng: null };
var completedTaskEffects = new Set();
let lastPhotoMarkerSize = null;
let heicLoaderPromise = null;
var pendingPhotoLocationChoice = null;
var pendingPhotoMapClickHandler = null;
var photoLocationPermissionPromise = null;
var pendingCameraCaptureLocation = null;
var pendingCameraCaptureDate = null;
const recBtn = document.getElementById("rec-btn");
const recStatusBox = document.getElementById("rec-status-box");

// 吏??珥덇린??
const map = window.giloaMapBootstrap || L.map("map", { zoomControl: false, attributionControl: true }).setView([37.5665, 126.978], 16);
const BASE_TILE_LAYERS = [
    {
        url: window.GILOA_CARTO_TILE_URL,
        options: {
            zIndex: 10,
            maxZoom: 20,
            crossOrigin: true,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                '&copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    }
];
let currentBaseTileLayer = window.giloaInitialBaseTileLayer || null;
let lastReadyBaseTileLayer = null;
const BASE_TILE_PROVIDER_KEY = "giloa-map-tile-provider-v4";
let currentBaseTileIndex = 0;
let baseTileErrorCount = 0;
let baseTileLoadTimer = null;

try {
    var savedTileProvider = parseInt(localStorage.getItem(BASE_TILE_PROVIDER_KEY), 10);
    if (isFinite(savedTileProvider) && savedTileProvider >= 0 && savedTileProvider < BASE_TILE_LAYERS.length) currentBaseTileIndex = savedTileProvider;
} catch (_) {}

function setBaseTileLayer(index) {
    var meta = BASE_TILE_LAYERS[index] || BASE_TILE_LAYERS[0];
    var mapWrap = document.getElementById("map-wrap");
    if (mapWrap) {
        if (!lastReadyBaseTileLayer) mapWrap.classList.remove("tiles-ready");
        mapWrap.classList.remove("tiles-error");
    }
    if (currentBaseTileLayer && currentBaseTileLayer !== lastReadyBaseTileLayer) map.removeLayer(currentBaseTileLayer);
    currentBaseTileIndex = index;
    baseTileErrorCount = 0;
    var tileLayer = L.tileLayer(meta.url, meta.options).addTo(map);
    currentBaseTileLayer = tileLayer;
    if (baseTileLoadTimer !== null) clearTimeout(baseTileLoadTimer);
    baseTileLoadTimer = setTimeout(function() {
        if (tileLayer !== currentBaseTileLayer) return;
        if (mapWrap && !mapWrap.classList.contains("tiles-ready")) {
            if (currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
                setBaseTileLayer(currentBaseTileIndex + 1);
            } else {
                mapWrap.classList.add("tiles-error");
            }
        }
    }, 9000);
    tileLayer.on("tileload", function() {
        if (tileLayer !== currentBaseTileLayer) return;
        if (baseTileLoadTimer !== null) {
            clearTimeout(baseTileLoadTimer);
            baseTileLoadTimer = null;
        }
        if (mapWrap) {
            mapWrap.classList.add("tiles-ready");
            mapWrap.classList.remove("tiles-error");
        }
        if (lastReadyBaseTileLayer && lastReadyBaseTileLayer !== tileLayer && map.hasLayer(lastReadyBaseTileLayer)) map.removeLayer(lastReadyBaseTileLayer);
        lastReadyBaseTileLayer = tileLayer;
        try { localStorage.setItem(BASE_TILE_PROVIDER_KEY, String(currentBaseTileIndex)); } catch (_) {}
        scheduleRender();
    });
    tileLayer.on("tileerror", function() {
        if (tileLayer !== currentBaseTileLayer) return;
        baseTileErrorCount += 1;
        if (baseTileErrorCount >= 6 && currentBaseTileIndex < BASE_TILE_LAYERS.length - 1) {
            setBaseTileLayer(currentBaseTileIndex + 1);
        } else if (baseTileErrorCount >= 6 && mapWrap) {
            mapWrap.classList.add("tiles-error");
        }
    });
}
setBaseTileLayer(currentBaseTileIndex);
setTimeout(function() { map.invalidateSize(); }, 250);

let kakaoTrafficMap = null;
let kakaoTrafficLoading = null;

function getKakaoJsKey() {
    return (window.GILOA_KAKAO_JS_KEY || "").trim();
}

function leafletZoomToKakaoLevel(zoom) {
    return Math.max(1, Math.min(14, 19 - Math.round(zoom || 16)));
}

function loadKakaoTrafficSdk() {
    if (kakaoTrafficLoading) return kakaoTrafficLoading;
    kakaoTrafficLoading = new Promise(function(resolve, reject) {
        var settled = false;
        var script = null;
        var timer = setTimeout(function() { fail(new Error("Kakao Maps SDK timed out.")); }, 8000);
        function succeed() {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve();
        }
        function fail(error) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (script && script.parentNode) script.parentNode.removeChild(script);
            kakaoTrafficLoading = null;
            reject(error);
        }
        if (window.kakao && window.kakao.maps) {
            try { window.kakao.maps.load(succeed); } catch (error) { fail(error); }
            return;
        }
        var appKey = getKakaoJsKey();
        if (!appKey) {
            fail(new Error("Kakao JavaScript key is missing."));
            return;
        }
        script = document.createElement("script");
        script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" + encodeURIComponent(appKey) + "&libraries=services&autoload=false";
        script.async = true;
        script.onload = function() {
            if (window.kakao && window.kakao.maps) {
                try { window.kakao.maps.load(succeed); } catch (error) { fail(error); }
            } else fail(new Error("Kakao Maps SDK is unavailable."));
        };
        script.onerror = function() { fail(new Error("Kakao Maps SDK failed to load.")); };
        document.head.appendChild(script);
    });
    return kakaoTrafficLoading;
}

function syncKakaoTrafficMap() {
    if (!kakaoTrafficMap || !window.kakao || !window.kakao.maps) return;
    var center = map.getCenter();
    if (typeof kakaoTrafficMap.relayout === "function") kakaoTrafficMap.relayout();
    kakaoTrafficMap.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
    kakaoTrafficMap.setLevel(leafletZoomToKakaoLevel(map.getZoom()));
}

function toggleKakaoTraffic(force) {
    var wrap = document.getElementById("kakao-traffic-wrap");
    var btn = document.getElementById("traffic-btn");
    if (!wrap) return;
    var next = typeof force === "boolean" ? force : !wrap.classList.contains("show");
    if (!next) {
        wrap.classList.remove("show");
        wrap.setAttribute("aria-hidden", "true");
        if (btn) btn.classList.remove("active");
        return;
    }
    loadKakaoTrafficSdk().then(function() {
        wrap.classList.add("show");
        wrap.setAttribute("aria-hidden", "false");
        if (btn) btn.classList.add("active");
        var center = map.getCenter();
        var el = document.getElementById("kakao-traffic-map");
        if (!kakaoTrafficMap) {
            kakaoTrafficMap = new window.kakao.maps.Map(el, {
                center: new window.kakao.maps.LatLng(center.lat, center.lng),
                level: leafletZoomToKakaoLevel(map.getZoom())
            });
            kakaoTrafficMap.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        }
        setTimeout(syncKakaoTrafficMap, 0);
    }).catch(function(error) {
        alert(earlyUiText("trafficFailed"));
        console.warn(error);
    });
}
function openKakaoDirections() {
    if (!currentPos) {
        alert(earlyUiText("locationBeforeDirections"));
        centerMap();
        return;
    }
    var mapCenter = map.getCenter();
    var dest = selectedDestination || (mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, name: earlyUiText("destination") } : null);
    if (!dest || !isFinite(dest.lat) || !isFinite(dest.lng)) {
        alert(earlyUiText("selectDestination"));
        return;
    }
    if (currentPos.distanceTo([dest.lat, dest.lng]) < 15) {
        alert(earlyUiText("destinationTooClose"));
        return;
    }
    var startName = earlyUiText("currentLocation");
    var destName = dest.name || earlyUiText("destination");
    var url = "https://map.kakao.com/link/from/" + encodeURIComponent(startName) + "," + currentPos.lat.toFixed(6) + "," + currentPos.lng.toFixed(6) + "/to/" + encodeURIComponent(destName) + "," + dest.lat.toFixed(6) + "," + dest.lng.toFixed(6);
    try {
        window.open(url, "_blank");
    } catch (e) {
        location.href = url;
    }
}
function setSelectedDestination(lat, lng, name) {
    if (!isFinite(lat) || !isFinite(lng)) return;
    selectedDestination = {
        lat: lat,
        lng: lng,
        name: String(name || earlyUiText("destination")).trim() || earlyUiText("destination")
    };
}

map.on("moveend zoomend", function() {
    var wrap = document.getElementById("kakao-traffic-wrap");
    if (wrap && wrap.classList.contains("show")) syncKakaoTrafficMap();
});

map.createPane("colorRevealPane");
map.getPane("colorRevealPane").style.zIndex = 205;
map.getPane("colorRevealPane").style.pointerEvents = "none";
map.createPane("fogPane");
map.getPane("fogPane").style.zIndex = 450;
map.createPane("photoPane");
map.getPane("photoPane").style.zIndex = 630;
map.createPane("memoryPane");
map.getPane("memoryPane").style.zIndex = 640;
map.createPane("playerPane");
// The live GPS marker and accuracy circle must stay above every map-data pane.
map.getPane("playerPane").style.zIndex = 690;
map.createPane("tourPane");
map.getPane("tourPane").style.zIndex = 660;
map.createPane("adminBoundaryPane");
// Administrative borders stay below route lines and the exploration fog.
map.getPane("adminBoundaryPane").style.zIndex = 430;
map.getPane("adminBoundaryPane").style.pointerEvents = "auto";
map.createPane("durunubiPane");
// Keep official routes above the base map but below the exploration fog.
// Cleared areas reveal the route naturally together with the map.
map.getPane("durunubiPane").style.zIndex = 440;
map.getPane("durunubiPane").style.pointerEvents = "auto";
map.createPane("libraryPane");
map.getPane("libraryPane").style.zIndex = 665;
map.createPane("specialPlacePane");
map.getPane("specialPlacePane").style.zIndex = 670;
map.createPane("visitedPlacePane");
map.getPane("visitedPlacePane").style.zIndex = 675;
map.createPane("restroomPane");
map.getPane("restroomPane").style.zIndex = 667;
map.createPane("parkingPane");
map.getPane("parkingPane").style.zIndex = 668;
map.createPane("fishingPane");
map.getPane("fishingPane").style.zIndex = 669;
map.createPane("campingPane");
map.getPane("campingPane").style.zIndex = 671;
var tourRenderer = L.svg({ pane: "tourPane" });
var durunubiRenderer = L.canvas({ pane: "durunubiPane", padding: 1 });
var durunubiLayerGroup = L.featureGroup().addTo(map);

var adminBoundaryLayer = null;
var adminDistrictFeatures = [];
var activeAdminBoundaryLayer = null;
var activeAdminDistrictName = "";
var ADMIN_REGION_TEXT = {
    ko: "지도 중심", en: "Map center", ja: "地図の中心", zh: "地图中心",
    es: "Centro del mapa", fr: "Centre de la carte"
};

function adminBoundaryStyle(feature) {
    var selected = feature && feature.properties && feature.properties.title === activeAdminDistrictName;
    return {
        pane: "adminBoundaryPane",
        color: selected ? "#8be7ff" : "#4fc3f7",
        weight: selected ? 2.6 : 1.2,
        opacity: selected ? 0.95 : 0.62,
        fillColor: "#4fc3f7",
        fillOpacity: selected ? 0.1 : 0.018,
        lineCap: "round",
        lineJoin: "round"
    };
}

function makeAdminRegionLabel() {
    var wrap = document.getElementById("map-wrap");
    if (!wrap) return null;
    var label = document.getElementById("admin-region-label");
    if (!label) {
        label = document.createElement("button");
        label.type = "button";
        label.id = "admin-region-label";
        label.className = "admin-region-label";
        label.hidden = true;
        label.addEventListener("click", function() {
            if (activeAdminBoundaryLayer && activeAdminBoundaryLayer.getBounds) {
                map.fitBounds(activeAdminBoundaryLayer.getBounds(), { padding:[32,32], maxZoom:12 });
            }
        });
        wrap.appendChild(label);
    }
    return label;
}

function pointInAdminRing(lng, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = Number(ring[i][0]), yi = Number(ring[i][1]);
        var xj = Number(ring[j][0]), yj = Number(ring[j][1]);
        if (((yi > lat) !== (yj > lat)) && lng < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi) inside = !inside;
    }
    return inside;
}

function pointInAdminPolygon(lng, lat, polygon) {
    if (!polygon || !polygon.length || !pointInAdminRing(lng, lat, polygon[0])) return false;
    for (var i = 1; i < polygon.length; i += 1) if (pointInAdminRing(lng, lat, polygon[i])) return false;
    return true;
}

function adminFeatureContains(feature, latlng) {
    var bbox = feature._giloaBbox;
    if (!bbox || latlng.lng < bbox[0] || latlng.lat < bbox[1] || latlng.lng > bbox[2] || latlng.lat > bbox[3]) return false;
    var geometry = feature.geometry || {};
    if (geometry.type === "Polygon") return pointInAdminPolygon(latlng.lng, latlng.lat, geometry.coordinates);
    if (geometry.type === "MultiPolygon") return geometry.coordinates.some(function(polygon) { return pointInAdminPolygon(latlng.lng, latlng.lat, polygon); });
    return false;
}

function getAdminFeatureBbox(feature) {
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    function walk(value) {
        if (!Array.isArray(value)) return;
        if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
            bbox[0] = Math.min(bbox[0], value[0]); bbox[1] = Math.min(bbox[1], value[1]);
            bbox[2] = Math.max(bbox[2], value[0]); bbox[3] = Math.max(bbox[3], value[1]);
        } else value.forEach(walk);
    }
    walk(feature.geometry && feature.geometry.coordinates);
    return bbox;
}

function updateAdminRegionForMap() {
    if (!adminBoundaryLayer || !adminDistrictFeatures.length) return;
    var center = map.getCenter();
    var feature = adminDistrictFeatures.find(function(candidate) { return adminFeatureContains(candidate, center); }) || null;
    var name = feature && feature.properties ? String(feature.properties.title || "") : "";
    if (name === activeAdminDistrictName) return;
    activeAdminDistrictName = name;
    if (adminBoundaryLayer.resetStyle) adminBoundaryLayer.resetStyle();
    activeAdminBoundaryLayer = null;
    if (feature && feature._giloaLayer) {
        activeAdminBoundaryLayer = feature._giloaLayer;
        activeAdminBoundaryLayer.setStyle(adminBoundaryStyle(feature));
        if (activeAdminBoundaryLayer.bringToFront) activeAdminBoundaryLayer.bringToFront();
    }
    var label = makeAdminRegionLabel();
    if (label) {
        label.hidden = !name;
        var municipalityName = getMunicipalityName(name) || name;
        label.dataset.municipality = municipalityName;
        label.textContent = name ? ((ADMIN_REGION_TEXT[currentLang] || ADMIN_REGION_TEXT.ko) + " · " + municipalityName) : "";
        label.setAttribute("aria-label", label.textContent);
    }
}

var ADMIN_BOUNDARY_ASSET_URL = "./data/admin-districts.geojson";
var ADMIN_BOUNDARY_URL = ADMIN_BOUNDARY_ASSET_URL + "?v=2020-sgis-1";
// The boundary fetch used to fail into a console warning only, which is
// invisible on a phone. The outcome is recorded so the atlas diagnostic can
// say whether the file is missing, malformed or simply still downloading.
var adminBoundaryLoadStatus = { state:"idle", detail:"", url:ADMIN_BOUNDARY_URL, at:0 };

function setAdminBoundaryStatus(state, detail) {
    adminBoundaryLoadStatus = { state:state, detail:String(detail || ""), url:ADMIN_BOUNDARY_URL, at:Date.now() };
}

function loadAdminBoundaryJsonByXhr(url) {
    return new Promise(function(resolve, reject) {
        if (typeof XMLHttpRequest !== "function") { reject(new Error("XMLHttpRequest unavailable")); return; }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 15000;
        xhr.onload = function() {
            // Android file:///android_asset responses commonly report status 0.
            if (xhr.status !== 0 && (xhr.status < 200 || xhr.status >= 300)) { reject(new Error("XHR HTTP " + xhr.status)); return; }
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (error) { reject(new Error("GeoJSON parse failed: " + error.message)); }
        };
        xhr.onerror = function() { reject(new Error("GeoJSON XHR failed")); };
        xhr.ontimeout = function() { reject(new Error("GeoJSON XHR timeout")); };
        try { xhr.send(); } catch (error) { reject(error); }
    });
}

function loadAdminBoundaryJson() {
    var isAndroidAsset = location.protocol === "file:" || (typeof isNativeApp === "function" && isNativeApp());
    // A query string on file:///android_asset can make WebView fetch() fail
    // even though the bundled file exists. XHR with the plain asset path is
    // reliable there; browsers retain network-first cache-busted loading.
    if (isAndroidAsset) return loadAdminBoundaryJsonByXhr(ADMIN_BOUNDARY_ASSET_URL);
    return fetch(ADMIN_BOUNDARY_URL).then(function(response) {
        if (!response.ok) throw new Error("HTTP " + response.status + " " + (response.statusText || ""));
        return response.json();
    }).catch(function(fetchError) {
        return loadAdminBoundaryJsonByXhr(ADMIN_BOUNDARY_ASSET_URL).catch(function(xhrError) {
            throw new Error((fetchError && fetchError.message ? fetchError.message : "fetch failed") + " / " + xhrError.message);
        });
    });
}

function loadAdminDistrictBoundaries() {
    setAdminBoundaryStatus("loading", "");
    return loadAdminBoundaryJson().then(function(data) {
        adminDistrictFeatures = Array.isArray(data && data.features) ? data.features : [];
        adminDistrictFeatures.forEach(function(feature) { feature._giloaBbox = getAdminFeatureBbox(feature); });
        adminBoundaryLayer = L.geoJSON(data, {
            pane:"adminBoundaryPane",
            style:adminBoundaryStyle,
            onEachFeature:function(feature, layer) {
                feature._giloaLayer = layer;
                var name = feature.properties && feature.properties.title;
                if (name) layer.bindTooltip(escapeHtml(name), { sticky:true, direction:"top", className:"admin-boundary-tooltip" });
            }
        }).addTo(map);
        updateAdminRegionForMap();
        // Any city resolved before the polygons arrived came from the fallback
        // boxes, so the memoised answers have to be thrown away here.
        invalidateRegionStayCache();
        scheduleRegionStayRecalculation();
        if (adminDistrictFeatures.length) setAdminBoundaryStatus("ok", String(adminDistrictFeatures.length));
        else setAdminBoundaryStatus("empty", earlyUiText("featuresEmpty"));
        console.info("[GILOA ADMIN BOUNDARY]", adminDistrictFeatures.length, "districts loaded",
            adminDistrictFeatures.slice(0, 3).map(getAdminFeatureTitle));
        refreshRegionBadgeAtlasIfOpen();
    }).catch(function(error) {
        setAdminBoundaryStatus("failed", (error && (error.message || error.name)) || String(error));
        console.warn("[GILOA ADMIN BOUNDARY] load failed", error);
    });
}

map.on("moveend", updateAdminRegionForMap);
loadAdminDistrictBoundaries();

var REGION_STAY_KEY = "giloa-region-stay-v2";
// Bumped with every region-stay change. The atlas prints this on screen so a
// stale Capacitor bundle can be spotted without any developer tooling.
var GILOA_REGION_STAY_BUILD = "rs-2026-09-06b-heicgps";
var REGION_STAY_REQUIRED_MS = 60 * 60 * 1000;
var REGION_STAY_MAX_SAMPLE_GAP_MS = 2 * 60 * 1000;
var REGION_STAY_MAX_ACCURACY_M = 100;
var REGION_STAY_STALE_FIX_MS = 3 * 60 * 1000;
var REGION_STAY_TICK_MS = 10 * 1000;
var regionStayState = null;
var regionStayLastLiveUpdateAt = 0;
var REGION_STAY_LIVE_UPDATE_MS = 5000;
var regionStayAsyncRecalculationRunning = false;
var regionStayAsyncRecalculationQueued = false;
var REGION_STAY_TARGETS = {
    "김포시": "region_gimpo_1h",
    "하남시": "region_hanam_1h",
    "고양시": "region_goyang_1h"
};

// Coarse municipal outlines, [lng, lat]. These are only consulted when
// data/admin-districts.geojson is missing, still loading, or names the
// district in a way the name lookup cannot resolve. Bounding boxes were not
// usable here: 고양시 and 김포시 face each other across the 한강, so their
// boxes overlap and the river has to be traced as the shared edge.
var REGION_STAY_FALLBACK_SHAPES = [
    { city:"고양시", ring:[
        [126.700,37.720],[126.760,37.745],[126.870,37.740],[126.945,37.690],[126.975,37.640],
        [126.930,37.600],[126.860,37.585],[126.790,37.600],[126.745,37.640],[126.720,37.680]
    ] },
    { city:"김포시", ring:[
        [126.700,37.720],[126.720,37.680],[126.745,37.640],[126.790,37.600],[126.815,37.585],
        [126.800,37.565],[126.700,37.555],[126.590,37.565],[126.500,37.620],[126.440,37.680],
        [126.470,37.750],[126.560,37.790],[126.640,37.760]
    ] },
    { city:"하남시", ring:[
        [127.135,37.560],[127.180,37.585],[127.240,37.590],[127.290,37.555],
        [127.280,37.500],[127.230,37.455],[127.175,37.470],[127.140,37.510]
    ] }
];

var regionStayPointCityCache = Object.create(null);
var regionStayTickTimer = null;
var regionStayLastTickAt = 0;
var regionStayLastTickCity = "";
var regionStayLastFix = null;
var regionStayLastResolution = { city:"", source:"none", districtTitle:"", at:0 };

function loadRegionStayState() {
    if (regionStayState) return regionStayState;
    try { regionStayState = JSON.parse(localStorage.getItem(REGION_STAY_KEY) || "{}"); }
    catch (_) { regionStayState = {}; }
    if (!regionStayState || typeof regionStayState !== "object") regionStayState = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = regionStayState[city];
        if (!entry || typeof entry !== "object") entry = {};
        // Migrate the v1/v2 shape (accumulatedMs only) into the split
        // path/live counters without losing the minutes already earned.
        var legacy = Math.max(0, Number(entry.accumulatedMs) || 0);
        entry.pathMs = Math.max(0, Number(entry.pathMs) || 0);
        entry.liveMs = Math.max(0, Number(entry.liveMs) || 0, legacy);
        entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
        regionStayState[city] = entry;
    });
    return regionStayState;
}

function saveRegionStayState() {
    try { localStorage.setItem(REGION_STAY_KEY, JSON.stringify(loadRegionStayState())); }
    catch (error) { console.warn("[GILOA REGION STAY] save failed", error); }
}

function normalizeRegionName(name) {
    return String(name == null ? "" : name).replace(/\s+/g, "");
}

// Administrative boundary sets label 고양시 in several different ways
// ("고양시", "고양시덕양구", "경기도 고양시 일산서구", ...). Matching on a
// flattened substring keeps every one of those spellings pointing at the
// same badge target.
function getMunicipalityName(districtName) {
    var flat = normalizeRegionName(districtName);
    if (!flat) return "";
    var keys = Object.keys(REGION_STAY_TARGETS);
    for (var i = 0; i < keys.length; i += 1) {
        if (flat.indexOf(keys[i]) >= 0) return keys[i];
    }
    return "";
}

var ADMIN_TITLE_KEYS = ["title", "name", "adm_nm", "ADM_NM", "SIG_KOR_NM", "sig_kor_nm", "SIGUNGU_NM", "sigungu_nm", "full_nm", "NAME"];

function getAdminFeatureTitle(feature) {
    var properties = feature && feature.properties;
    if (!properties) return "";
    for (var i = 0; i < ADMIN_TITLE_KEYS.length; i += 1) {
        var value = properties[ADMIN_TITLE_KEYS[i]];
        if (typeof value === "string" && value) return value;
    }
    return "";
}

function findAdminDistrictAt(latlng) {
    if (!latlng || !adminDistrictFeatures.length) return null;
    return adminDistrictFeatures.find(function(feature) { return adminFeatureContains(feature, latlng); }) || null;
}

function getRegionStayFallbackCity(lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return "";
    for (var i = 0; i < REGION_STAY_FALLBACK_SHAPES.length; i += 1) {
        var shape = REGION_STAY_FALLBACK_SHAPES[i];
        if (pointInAdminRing(lng, lat, shape.ring)) return shape.city;
    }
    return "";
}

// Resolves a coordinate to one of the badge cities and records how the
// answer was reached so the on-device diagnostic can explain a zero count.
function resolveRegionStayCity(lat, lng, options) {
    options = options || {};
    var result = { city:"", source:"none", districtTitle:"" };
    if (!isFinite(lat) || !isFinite(lng)) return result;
    if (adminDistrictFeatures.length) {
        var feature = findAdminDistrictAt(L.latLng(lat, lng));
        if (feature) {
            result.districtTitle = getAdminFeatureTitle(feature);
            var matched = getMunicipalityName(result.districtTitle);
            if (matched) {
                result.city = matched;
                result.source = "geojson";
                if (options.remember !== false) regionStayLastResolution = { city:result.city, source:result.source, districtTitle:result.districtTitle, at:Date.now() };
                return result;
            }
        }
    }
    var fallback = getRegionStayFallbackCity(lat, lng);
    if (fallback) {
        result.city = fallback;
        result.source = adminDistrictFeatures.length ? "fallback-polygon (geojson miss)" : "fallback-polygon (geojson not loaded)";
    }
    if (options.remember !== false) regionStayLastResolution = { city:result.city, source:result.source, districtTitle:result.districtTitle, at:Date.now() };
    return result;
}

function getRegionStayCityForPoint(point) {
    if (!point) return "";
    return resolveRegionStayCity(Number(point.lat), Number(point.lng), { remember:false }).city;
}

// Point-in-polygon over every administrative feature is expensive and this
// runs on each save, so the answer is memoised per GPS point id. The cache is
// dropped whenever the boundary set changes.
function getCachedRegionStayCity(point) {
    if (!point) return "";
    var key = point.id || (point.timestamp + ":" + point.lat + ":" + point.lng);
    var cached = regionStayPointCityCache[key];
    if (cached !== undefined) return cached;
    var city = getRegionStayCityForPoint(point);
    regionStayPointCityCache[key] = city;
    return city;
}

function invalidateRegionStayCache() {
    regionStayPointCityCache = Object.create(null);
}

// Replays the recorded GPS trail and sums the time spent inside each target
// city. Only consecutive samples closer together than the gap limit count, so
// a long break in recording never inflates the total.
function calculateRegionStayFromPoints(points) {
    var totals = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) { totals[city] = 0; });
    var sorted = (points || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.timestamp || point.startTime))
            && isFinite(Number(point.accuracy)) && Number(point.accuracy) <= REGION_STAY_MAX_ACCURACY_M;
    }).slice().sort(function(a, b) {
        return Number(a.timestamp || a.startTime) - Number(b.timestamp || b.startTime);
    });
    for (var i = 1; i < sorted.length; i += 1) {
        var previous = sorted[i - 1], current = sorted[i];
        var gap = Number(current.timestamp || current.startTime) - Number(previous.timestamp || previous.startTime);
        if (!isFinite(gap) || gap <= 0 || gap > REGION_STAY_MAX_SAMPLE_GAP_MS) continue;
        var previousCity = getCachedRegionStayCity(previous);
        if (!previousCity || previousCity !== getCachedRegionStayCity(current)) continue;
        totals[previousCity] += gap;
    }
    return totals;
}

function grantEarnedRegionBadges(state) {
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city];
        if (entry && entry.accumulatedMs >= REGION_STAY_REQUIRED_MS && typeof earnBadge === "function") earnBadge(REGION_STAY_TARGETS[city]);
    });
}

function recalculateRegionStayFromPath() {
    var state = loadRegionStayState();
    var totals = calculateRegionStayFromPoints(rawGpsPoints);
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city];
        entry.pathMs = Math.max(0, Number(totals[city]) || 0);
        entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
        entry.recalculatedAt = Date.now();
        entry.source = entry.pathMs >= entry.liveMs ? "rawGpsPoints" : "liveTick";
    });
    saveRegionStayState();
    grantEarnedRegionBadges(state);
    return true;
}

// Replaying thousands of native GPS samples through administrative polygons can
// monopolise a slower Android WebView for many seconds. Keep the exact same
// calculation, but yield between small batches so the map and buttons remain
// responsive while the cached city lookup is warmed in the background.
function scheduleRegionStayRecalculation() {
    if (regionStayAsyncRecalculationRunning || regionStayAsyncRecalculationQueued) return;
    regionStayAsyncRecalculationQueued = true;
    var begin = function() {
        regionStayAsyncRecalculationQueued = false;
        var state = loadRegionStayState();
        var totals = {};
        Object.keys(REGION_STAY_TARGETS).forEach(function(city) { totals[city] = 0; });
        var sorted = (rawGpsPoints || []).filter(function(point) {
            return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.timestamp || point.startTime))
                && isFinite(Number(point.accuracy)) && Number(point.accuracy) <= REGION_STAY_MAX_ACCURACY_M;
        }).slice().sort(function(a, b) {
            return Number(a.timestamp || a.startTime) - Number(b.timestamp || b.startTime);
        });
        var index = 1;
        regionStayAsyncRecalculationRunning = true;
        function runBatch() {
            var startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
            var processed = 0;
            while (index < sorted.length && processed < 16) {
                var previous = sorted[index - 1], current = sorted[index];
                var gap = Number(current.timestamp || current.startTime) - Number(previous.timestamp || previous.startTime);
                if (isFinite(gap) && gap > 0 && gap <= REGION_STAY_MAX_SAMPLE_GAP_MS) {
                    var previousCity = getCachedRegionStayCity(previous);
                    if (previousCity && previousCity === getCachedRegionStayCity(current)) totals[previousCity] += gap;
                }
                index += 1;
                processed += 1;
                var now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
                if (now - startedAt >= 8) break;
            }
            if (index < sorted.length) { setTimeout(runBatch, 0); return; }
            Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
                var entry = state[city];
                entry.pathMs = Math.max(0, Number(totals[city]) || 0);
                entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
                entry.recalculatedAt = Date.now();
                entry.source = entry.pathMs >= entry.liveMs ? "rawGpsPoints" : "liveTick";
            });
            saveRegionStayState();
            grantEarnedRegionBadges(state);
            regionStayAsyncRecalculationRunning = false;
            refreshRegionBadgeAtlasIfOpen();
        }
        setTimeout(runBatch, 0);
    };
    if (typeof requestIdleCallback === "function") requestIdleCallback(begin, { timeout:1200 });
    else setTimeout(begin, 250);
}

// Returns the position the live ticker should judge, preferring the live
// watchPosition fix. In the APK the foreground fix can go quiet while the
// native background service keeps writing samples, so the newest recorded
// point is used as a fallback rather than stalling the counter.
function getRegionStayLiveFix(now) {
    if (currentPos && isFinite(currentAccuracy) && Number(currentAccuracy) <= REGION_STAY_MAX_ACCURACY_M) {
        var age = isFinite(currentPositionTimestamp) ? now - Number(currentPositionTimestamp) : 0;
        if (age <= REGION_STAY_STALE_FIX_MS) {
            return { lat:currentPos.lat, lng:currentPos.lng, accuracy:Number(currentAccuracy), age:age, source:"watchPosition" };
        }
    }
    var newest = null;
    for (var i = rawGpsPoints.length - 1; i >= 0 && rawGpsPoints.length - i <= 40; i -= 1) {
        var point = rawGpsPoints[i];
        if (!point || !isFinite(point.lat) || !isFinite(point.lng)) continue;
        var stamp = Number(point.timestamp || point.endTime || point.startTime);
        if (!isFinite(stamp)) continue;
        if (!newest || stamp > newest.stamp) newest = { point:point, stamp:stamp };
    }
    if (!newest) return null;
    var newestAge = now - newest.stamp;
    if (newestAge > REGION_STAY_STALE_FIX_MS) return null;
    if (!isFinite(newest.point.accuracy) || Number(newest.point.accuracy) > REGION_STAY_MAX_ACCURACY_M) return null;
    return { lat:newest.point.lat, lng:newest.point.lng, accuracy:Number(newest.point.accuracy), age:newestAge, source:"rawGpsPoint" };
}

// Wall-clock accrual. The trail replay alone cannot count a stay while the
// device is stationary and the browser throttles GPS callbacks, so time is
// also credited directly from the clock whenever the live fix is fresh,
// accurate and inside the same city as the previous tick.
function tickRegionStayLive() {
    var now = Date.now();
    // The anchor is only moved on a tick that actually produced a fix. Moving
    // it unconditionally meant every GPS dropout wiped the previous city, so
    // the next good tick had nothing to compare against and the two-minute
    // tolerance never applied - roughly half the stay was thrown away when
    // fixes arrived on alternate ticks.
    var previousTickAt = regionStayLastTickAt;
    var previousCity = regionStayLastTickCity;

    var fix = getRegionStayLiveFix(now);
    regionStayLastFix = fix;
    if (!fix) return false;

    var city = resolveRegionStayCity(fix.lat, fix.lng).city;
    updateRegionEdgeFrame(fix);
    regionStayLastTickAt = now;
    regionStayLastTickCity = city;
    if (!city || city !== previousCity || !previousTickAt) return false;

    var delta = Math.min(now - previousTickAt, REGION_STAY_MAX_SAMPLE_GAP_MS);
    if (!isFinite(delta) || delta <= 0) return false;

    var state = loadRegionStayState();
    var entry = state[city];
    entry.liveMs = Math.max(0, Number(entry.liveMs) || 0) + delta;
    entry.accumulatedMs = Math.max(entry.pathMs, entry.liveMs);
    entry.lastTickAt = now;
    saveRegionStayState();
    grantEarnedRegionBadges(state);
    refreshRegionBadgeAtlasIfOpen();
    return true;
}

// --- Regional edge frame -----------------------------------------------
// A 3px border around the whole viewport, tinted for whichever municipality
// the current GPS fix falls inside. Works for every district in
// admin-districts.geojson, not just the badge targets.

// Requested palette: 빨 주 노 초 파 남 보 흰 검. Black sits on a dark UI and is
// nearly invisible, so it is kept last and only reached by hashing.
var REGION_EDGE_PALETTE = ["#e5484d", "#f76b15", "#f5c518", "#39b54a", "#2e7dd1", "#2b3f9e", "#8b46c8", "#f2f2f2", "#1a1a1a"];

// Municipal colours take priority over the palette. These three are
// placeholders picked to be distinguishable - replace them with the official
// CI colours once confirmed with each 지자체.
var REGION_EDGE_COLORS = {
    "고양시": "#f5c518",
    "김포시": "#2e7dd1",
    "하남시": "#39b54a"
};

// "고양시덕양구" and "고양시일산서구" must share one colour, so the name is
// trimmed at the first 시/군 boundary.
function getRegionColorKey(districtTitle) {
    var flat = normalizeRegionName(districtTitle);
    if (!flat) return "";
    var match = flat.match(/^(.*?[시군])/);
    return (match && match[1]) || flat;
}

function getRegionEdgeColor(districtTitle) {
    var key = getRegionColorKey(districtTitle);
    if (!key) return "";
    if (REGION_EDGE_COLORS[key]) return REGION_EDGE_COLORS[key];
    var hash = 0;
    for (var i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return REGION_EDGE_PALETTE[hash % REGION_EDGE_PALETTE.length];
}

var activeRegionEdgeKey = null;

function updateRegionEdgeFrame(fix) {
    var frame = document.getElementById("region-edge-frame");
    if (!frame) return;

    var title = "";

    if (
        fix &&
        isFinite(fix.lat) &&
        isFinite(fix.lng) &&
        adminDistrictFeatures.length
    ) {
        title = getAdminFeatureTitle(
            findAdminDistrictAt(L.latLng(fix.lat, fix.lng))
        );
    }

    var key = getRegionColorKey(title);
    var badgeId = REGION_STAY_TARGETS[key];

   var completed =
    !!badgeId &&
    Array.isArray(badges) &&
    badges.some(function(badge) {
        return badge.id === badgeId;
    });

    var frameState = key + (completed ? ":completed" : ":active");

    if (frameState === activeRegionEdgeKey) return;
    activeRegionEdgeKey = frameState;

    if (!key || completed) {
        frame.hidden = true;
        frame.style.borderColor = "transparent";
        frame.style.boxShadow = "none";
        frame.removeAttribute("data-region");
        return;
    }

    var color = getRegionEdgeColor(title);

    frame.style.borderColor = color;
    frame.style.boxShadow = "inset 0 0 18px " + color + "40";
    frame.setAttribute("data-region", key);
    frame.hidden = false;
}

function refreshRegionBadgeAtlasIfOpen() {
    var atlas = document.getElementById("region-badge-atlas");
    if (!atlas || atlas.hidden) return;
    if (typeof renderRegionBadgeAtlas !== "function") return;
    renderRegionBadgeAtlas();
}

function startRegionStayTicker() {
    if (regionStayTickTimer) return;
    regionStayLastTickAt = 0;
    regionStayLastTickCity = "";
    regionStayTickTimer = setInterval(tickRegionStayLive, REGION_STAY_TICK_MS);
}

document.addEventListener("visibilitychange", function() {
    // A backgrounded tab stops producing fixes. Resetting the anchor prevents
    // the whole hidden period from being credited on the next tick.
    if (document.visibilityState === "visible") {
        regionStayLastTickAt = 0;
        regionStayLastTickCity = "";
    }
});

startRegionStayTicker();

function updateRegionStayProgress() {
    if (!rawGpsPoints.length) return false;
    var now = Date.now();
    // Repainted here as well as on the ticker so crossing a boundary while
    // walking recolours the frame at GPS rate rather than up to 10s later.
    updateRegionEdgeFrame(getRegionStayLiveFix(now));
    if (now - regionStayLastLiveUpdateAt < REGION_STAY_LIVE_UPDATE_MS) return false;
    regionStayLastLiveUpdateAt = now;
    scheduleRegionStayRecalculation();
    return false;
}

window.recalculateGiloaRegionStay = recalculateRegionStayFromPath;

window.getGiloaRegionStayProgress = function() {
    var state = loadRegionStayState();
    var result = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        result[city] = Math.min(60, Math.floor((Number(state[city] && state[city].accumulatedMs) || 0) / 60000));
    });
    return result;
};

window.getGiloaRegionStayDetail = function() {
    var state = loadRegionStayState();
    var detail = {};
    Object.keys(REGION_STAY_TARGETS).forEach(function(city) {
        var entry = state[city] || {};
        detail[city] = {
            minutes: Math.floor((Number(entry.accumulatedMs) || 0) / 60000),
            pathMinutes: Math.floor((Number(entry.pathMs) || 0) / 60000),
            liveMinutes: Math.floor((Number(entry.liveMs) || 0) / 60000),
            earned: typeof getEarnedBadge === "function" ? !!getEarnedBadge(REGION_STAY_TARGETS[city]) : false
        };
    });
    return detail;
};

// On-device diagnostic. The APK has no DevTools and a WebView can swallow
// alert(), so the report is written into the atlas itself and only falls back
// to alert() when that element is missing.
window.giloaRegionStayDiagnostic = function() {
    var now = Date.now();
    var lines = [];
    lines.push("[" + earlyUiText("regionDiagnostic") + "]");
    lines.push(earlyUiText("build") + ": " + GILOA_REGION_STAY_BUILD);
    lines.push(earlyUiText("environment") + ": " + (typeof isNativeApp === "function" && isNativeApp() ? "APK (Capacitor)" : earlyUiText("browser")) + " · " + location.protocol);
    lines.push(earlyUiText("adminPolygons") + ": " + adminDistrictFeatures.length);
    lines.push(earlyUiText("geojsonPath") + ": " + adminBoundaryLoadStatus.url);
    lines.push(earlyUiText("geojsonStatus") + ": " + adminBoundaryLoadStatus.state + (adminBoundaryLoadStatus.detail ? " · " + adminBoundaryLoadStatus.detail : ""));
    if (adminDistrictFeatures.length) {
        lines.push(earlyUiText("sampleNames") + ": " + adminDistrictFeatures.slice(0, 3).map(getAdminFeatureTitle).join(" / "));
        var propertyKeys = Object.keys((adminDistrictFeatures[0] && adminDistrictFeatures[0].properties) || {});
        lines.push(earlyUiText("propertyKeys") + ": " + (propertyKeys.join(", ") || earlyUiText("none")));
    } else {
        lines.push(earlyUiText("sampleNames") + ": " + earlyUiText("fallbackPolygons"));
    }

    var fix = getRegionStayLiveFix(now);
    if (fix) {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + fix.lat.toFixed(5) + ", " + fix.lng.toFixed(5) + " (" + fix.source + ")");
        lines.push(earlyUiText("accuracy") + ": " + Math.round(fix.accuracy) + "m / ≤ " + REGION_STAY_MAX_ACCURACY_M + "m");
        lines.push(earlyUiText("freshness") + ": " + earlyUiText("secondsAgo", { seconds:Math.round(fix.age / 1000) }) + " / ≤ " + Math.round(REGION_STAY_STALE_FIX_MS / 1000) + "s");
        var resolved = resolveRegionStayCity(fix.lat, fix.lng, { remember:false });
        lines.push(earlyUiText("resolvedRegion") + ": " + (resolved.city || earlyUiText("none")));
        lines.push(earlyUiText("resolutionSource") + ": " + resolved.source + (resolved.districtTitle ? " · " + resolved.districtTitle : ""));
    } else if (currentPos) {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + earlyUiText("staleCoordinates"));
        lines.push(earlyUiText("lastCoordinates") + ": " + currentPos.lat.toFixed(5) + ", " + currentPos.lng.toFixed(5)
            + " · " + earlyUiText("accuracy") + " " + (isFinite(currentAccuracy) ? Math.round(currentAccuracy) + "m" : earlyUiText("unknown"))
            + " · " + (isFinite(currentPositionTimestamp) ? earlyUiText("secondsAgo", { seconds:Math.round((now - currentPositionTimestamp) / 1000) }) : earlyUiText("unknown")));
    } else {
        lines.push(earlyUiText("evaluationCoordinates") + ": " + earlyUiText("waitingGps"));
    }

    var recent = rawGpsPoints.filter(function(point) {
        var stamp = Number(point && (point.timestamp || point.startTime));
        return isFinite(stamp) && now - stamp <= 10 * 60 * 1000;
    }).length;
    lines.push(earlyUiText("rawGpsCounts", { total:rawGpsPoints.length, recent:recent }));
    lines.push(earlyUiText("recordingStatus") + ": " + earlyUiText(typeof isRecording !== "undefined" && isRecording ? "recording" : "stopped"));
    lines.push(earlyUiText("stayTimer") + ": " + earlyUiText(regionStayTickTimer ? "running" : "stopped") + " · " + earlyUiText("lastTickRegion") + " " + (regionStayLastTickCity || earlyUiText("none")));
    lines.push(earlyUiText("lastResolution") + ": " + (regionStayLastResolution.city || earlyUiText("none")) + " · " + regionStayLastResolution.source);

    var detail = window.getGiloaRegionStayDetail();
    Object.keys(detail).forEach(function(city) {
        var row = detail[city];
        lines.push(city + ": " + earlyUiText("stayMinutes", { minutes:row.minutes, path:row.pathMinutes, live:row.liveMinutes }) + (row.earned ? " · " + earlyUiText("earned") : ""));
    });

    try {
        var photoReport = window.giloaPhotoDiagnostic ? window.giloaPhotoDiagnostic(true) : null;
        if (photoReport) {
            lines.push("");
            lines.push("[" + earlyUiText("photoDiagnostic") + "]");
            lines.push(earlyUiText("totalPhotos") + " " + photoReport.summary.total + " · " + earlyUiText("mapMarkers") + " " + photoReport.summary.markers);
            lines.push(earlyUiText("located") + " " + photoReport.summary.located + " · " + earlyUiText("unlocated") + " " + photoReport.summary.unlocated + " · " + earlyUiText("missingImage") + " " + photoReport.summary.missingImage);
        }
    } catch (_) {}

    var text = lines.join("\n");
    console.info(text);
    var panel = document.getElementById("region-badge-atlas-diagnostic");
    var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
    if (panel && wrap) {
        panel.textContent = text;
        wrap.hidden = false;
        // The atlas card scrolls, so the report is pulled into view instead of
        // leaving it below the fold where it was easy to miss.
        if (wrap.scrollIntoView) wrap.scrollIntoView({ block:"start" });
    } else {
        showGiloaDiagnosticReport(text, earlyUiText("regionDiagnostic"));
    }
    return text;
};

function toggleRegionStayDiagnostic() {
    var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
    if (wrap && !wrap.hidden) { wrap.hidden = true; return; }
    window.giloaRegionStayDiagnostic();
}

var colorRevealPane = map.getPane("colorRevealPane");
colorRevealPane.appendChild(document.getElementById("color-reveal-canvas"));
var fogPane = map.getPane("fogPane");
fogPane.appendChild(document.getElementById("fog-canvas"));
fogPane.appendChild(document.getElementById("fog-shade-canvas"));
fogPane.appendChild(document.getElementById("age-canvas"));
fogPane.appendChild(document.getElementById("stay-canvas"));

const photoClusterGroup = L.markerClusterGroup({
    clusterPane: "photoPane", maxClusterRadius: 60, disableClusteringAtZoom: CLUSTER_ZOOM_THRESHOLD + 1,
    iconCreateFunction: function(cluster) { var count = cluster.getChildCount(); return L.divIcon({ className: "photo-cluster-icon", html: '<div class="photo-cluster-inner">' + count + '</div>', iconSize: [36, 36] }); }
});
map.addLayer(photoClusterGroup);

const colorRevealCanvas = document.getElementById("color-reveal-canvas");
const fogCanvas = document.getElementById("fog-canvas");
const fogShadeCanvas = document.getElementById("fog-shade-canvas");
const ageCanvas = document.getElementById("age-canvas");
const stayCanvas = document.getElementById("stay-canvas");
const colorRevealCtx = colorRevealCanvas.getContext("2d");
const fogCtx = fogCanvas.getContext("2d");
const fogShadeCtx = fogShadeCanvas.getContext("2d");
const ageCtx = ageCanvas.getContext("2d");
const stayCtx = stayCanvas.getContext("2d");
const colorRevealMaskCanvas = document.createElement("canvas");
const fogScratchCanvas = document.createElement("canvas");
const ageScratchCanvas = document.createElement("canvas");
const colorRevealMaskCtx = colorRevealMaskCanvas.getContext("2d");
const fogScratchCtx = fogScratchCanvas.getContext("2d");
const ageScratchCtx = ageScratchCanvas.getContext("2d");
let colorRevealDrawWarningShown = false;
let canvasTopLeft = L.point(0, 0);

function syncCanvasPosition() {
    canvasTopLeft = map.containerPointToLayerPoint([0, 0]);
    [colorRevealCanvas, fogCanvas, fogShadeCanvas, ageCanvas, stayCanvas].forEach(function(c) { L.DomUtil.setPosition(c, canvasTopLeft); });
}
// The canvas is visually pinned to the map container.  Drawing in container
// coordinates keeps the fog aligned with Leaflet markers while the map pane is
// being translated (especially on Android WebView during a touch pan).
function latLngToCanvasPoint(latlng) { return map.latLngToContainerPoint(latlng); }

function resizeCanvas() {
    var mapEl = document.getElementById("map");
    var w = mapEl.clientWidth || window.innerWidth;
    var h = mapEl.clientHeight || window.innerHeight;
    [colorRevealCanvas, fogCanvas, fogShadeCanvas, ageCanvas, stayCanvas].forEach(function(c) { c.width = w; c.height = h; });
    [colorRevealMaskCanvas, fogScratchCanvas, ageScratchCanvas].forEach(function(c) { c.width = w; c.height = h; });
    syncCanvasPosition();
    scheduleRender();
}

window.addEventListener("resize", resizeCanvas);
map.on("resize", resizeCanvas);
map.on("move zoom", scheduleRender);
map.on("zoomend", updatePhotoMarkerSizes);

if (typeof ResizeObserver === "function") {
    new ResizeObserver(function() { resizeCanvas(); }).observe(document.getElementById("map"));
}

function scheduleRender() { if (rafId !== null) return; rafId = requestAnimationFrame(function() { rafId = null; render(); }); }
function getPersistedGpsPointCount() {
    try {
        var saved = JSON.parse(localStorage.getItem(getLocalStorageKey()) || "{}");
        return Array.isArray(saved.rawGpsPoints) ? saved.rawGpsPoints.length : (Array.isArray(saved.pathCoordinates) ? saved.pathCoordinates.length : 0);
    } catch (_) { return -1; }
}
function captureGpsIntegrity() {
    return {
        rawCount:Array.isArray(rawGpsPoints) ? rawGpsPoints.length : -1,
        displayCount:Array.isArray(pathCoordinates) ? pathCoordinates.length : -1,
        distance:Number(totalDistance) || 0,
        persistedCount:getPersistedGpsPointCount()
    };
}
function logGpsLayerChange(stage, snapshot) {
    var current = captureGpsIntegrity();
    console.log("GPS " + stage, current.displayCount, current.distance, {
        rawPoints:current.rawCount,
        persistedPoints:current.persistedCount
    });
    if (snapshot && (current.rawCount !== snapshot.rawCount || current.displayCount !== snapshot.displayCount || current.persistedCount !== snapshot.persistedCount)) {
        console.error("[GILOA GPS INTEGRITY] Place-layer update changed GPS data", { before:snapshot, after:current });
    }
    return current;
}
function refreshGpsVisualsAfterPlaceLayerChange(label, before) {
    logGpsLayerChange("AFTER " + label, before);
    // Place markers live in independent Leaflet groups. Repaint every GPS
    // canvas from the persisted in-memory source after their DOM work ends.
    scheduleRender();
    setTimeout(scheduleRender, 0);
}
function render() {
    syncCanvasPosition();
    var mapWrap = document.getElementById("map-wrap");
    if (mapWrap) mapWrap.classList.toggle("fog-disabled", !isFogEnabled);
    renderFog();
    renderColorReveal();
    renderFogShade();
    renderAgeTint();
    renderStayTint();
}
function calcMpp() { var center = map.getCenter(); var pt = map.latLngToContainerPoint(center); var ll2 = map.containerPointToLatLng(L.point(pt.x + 10, pt.y)); var mpp = center.distanceTo(ll2) / 10; return isFinite(mpp) && mpp > 0 ? mpp : 1; }
function metersToPixels(meters, mpp) { return meters / Math.max(mpp || 1, 0.01); }

function renderColorReveal() {
    var w = colorRevealCanvas.width, h = colorRevealCanvas.height;
    colorRevealCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled || !w || !h) return;
    var mapElement = map.getContainer();
    var mapRect = mapElement.getBoundingClientRect();
    var tilePane = map.getPane("tilePane");
    var tiles = tilePane ? tilePane.querySelectorAll("img.leaflet-tile-loaded") : [];
    colorRevealCtx.save();
    colorRevealCtx.globalCompositeOperation = "source-over";
    colorRevealCtx.imageSmoothingEnabled = true;
    for (var tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
        var tile = tiles[tileIndex];
        if (!tile.naturalWidth || !tile.naturalHeight) continue;
        var rect = tile.getBoundingClientRect();
        var x = rect.left - mapRect.left;
        var y = rect.top - mapRect.top;
        if (x >= w || y >= h || x + rect.width <= 0 || y + rect.height <= 0) continue;
        try {
            colorRevealCtx.drawImage(tile, x, y, rect.width, rect.height);
        } catch (error) {
            if (!colorRevealDrawWarningShown) {
                console.warn("Color map reveal tile draw failed.", error);
                colorRevealDrawWarningShown = true;
            }
        }
    }
    colorRevealCtx.restore();

    // fogCanvas is an invisible opaque mask. Inverting it leaves only the
    // current-position circle and the GPS path available for the colour map.
    colorRevealMaskCtx.clearRect(0, 0, w, h);
    colorRevealMaskCtx.save();
    colorRevealMaskCtx.fillStyle = "#000";
    colorRevealMaskCtx.fillRect(0, 0, w, h);
    colorRevealMaskCtx.globalCompositeOperation = "destination-out";
    colorRevealMaskCtx.drawImage(fogCanvas, 0, 0);
    colorRevealMaskCtx.restore();
    colorRevealCtx.save();
    colorRevealCtx.globalCompositeOperation = "destination-in";
    colorRevealCtx.drawImage(colorRevealMaskCanvas, 0, 0);
    colorRevealCtx.restore();
}

function renderFogShade() {
    var w = fogShadeCanvas.width, h = fogShadeCanvas.height;
    fogShadeCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled || !w || !h) return;
    fogShadeCtx.save();
    fogShadeCtx.fillStyle = "rgba(8, 10, 18, " + getFogAlpha() + ")";
    fogShadeCtx.fillRect(0, 0, w, h);
    fogShadeCtx.globalCompositeOperation = "destination-in";
    fogShadeCtx.drawImage(fogCanvas, 0, 0);
    fogShadeCtx.restore();
}

function renderVisionFogClear(pos, mpp) {
    if (playerHeading === null) return;
    var radius = metersToPixels(VISION_CONE_RADIUS_M, mpp);
    var spread = VISION_CONE_SPREAD_DEG * Math.PI / 180;
    var heading = (playerHeading - 90) * Math.PI / 180;
    var start = heading - spread / 2;
    var end = heading + spread / 2;
    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    var grad = fogCtx.createRadialGradient(pos.x, pos.y, radius * 0.16, pos.x, pos.y, radius);
    grad.addColorStop(0, "rgba(0,0,0,0.95)");
    grad.addColorStop(0.62, "rgba(0,0,0,0.62)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    fogCtx.fillStyle = grad;
    fogCtx.beginPath();
    fogCtx.moveTo(pos.x, pos.y);
    fogCtx.arc(pos.x, pos.y, radius, start, end);
    fogCtx.closePath();
    fogCtx.fill();
    fogCtx.restore();
}

function renderFog() {
    var w = fogCanvas.width, h = fogCanvas.height; fogCtx.clearRect(0, 0, w, h);
    if (!isFogEnabled) return;
    fogCtx.fillStyle = "#000";
    fogCtx.fillRect(0, 0, w, h);
    // Read back the rendered marker position when available so the visible
    // current-location dot and the clear area always use the same coordinates.
    var fogPosition = playerMarker && typeof playerMarker.getLatLng === "function" ? playerMarker.getLatLng() : currentPos;
    if (fogPosition) {
        var mpp = calcMpp();
        var pos = latLngToCanvasPoint(fogPosition);
        var playerRadius = metersToPixels(FOG_RADIUS_M * 1.5, mpp);
        fogCtx.save();
        fogCtx.globalCompositeOperation = "destination-out";
        var grad = fogCtx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, playerRadius);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        fogCtx.fillStyle = grad;
        fogCtx.beginPath();
        fogCtx.arc(pos.x, pos.y, playerRadius, 0, Math.PI * 2);
        fogCtx.fill();
        fogCtx.restore();
        renderVisionFogClear(pos, mpp);
    }
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var BUCKET = 0.05; var buckets = new Map();
    var addToBucket = function(alpha, drawFn) { var key = Math.round(alpha / BUCKET) * BUCKET; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(drawFn); };
    for (var i = 0; i < pathCoordinates.length; i++) {
        (function(idx) {
            var point = pathCoordinates[idx];
            var ageHours = (now - point.startTime) / 3600000;
            var alpha = getPathVisibility(ageHours);
            var pos = latLngToCanvasPoint([point.lat, point.lng]);
            var stayMin = (point.endTime - point.startTime) / 60000;
            var stayR = metersToPixels(getStayRadiusMeters(stayMin), mpp);
            addToBucket(alpha, function(ctx) { ctx.beginPath(); ctx.arc(pos.x, pos.y, stayR, 0, Math.PI * 2); ctx.fill(); });
            if (idx > 0) {
                var prev = latLngToCanvasPoint([pathCoordinates[idx - 1].lat, pathCoordinates[idx - 1].lng]);
                if (shouldConnectStoredPathPoints(pathCoordinates[idx - 1], point)) {
                    addToBucket(alpha, function(ctx) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); });
                }
            }
        })(i);
    }
    var offCtx = fogScratchCtx;
    buckets.forEach(function(drawFns, alpha) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.fillStyle = "rgba(0,0,0," + alpha + ")";
        offCtx.strokeStyle = "rgba(0,0,0," + alpha + ")";
        offCtx.lineWidth = radius * 2.2;
        offCtx.lineCap = "round"; offCtx.lineJoin = "round";
        drawFns.forEach(function(fn) { fn(offCtx); });
        fogCtx.save();
        fogCtx.globalCompositeOperation = "destination-out";
        fogCtx.drawImage(fogScratchCanvas, 0, 0);
        fogCtx.restore();
    });
}

function getPathVisibility(ageHours) { if (ageHours <= FULL_VISIBILITY_HOURS) return 1; if (ageHours >= MIN_VISIBILITY_HOURS) return MIN_PATH_VISIBILITY; return 1 - (1 - MIN_PATH_VISIBILITY) * (ageHours / MIN_VISIBILITY_HOURS); }

function renderAgeTint() {
    var w = ageCanvas.width, h = ageCanvas.height; ageCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return;
    var now = Date.now(); var mpp = calcMpp(); var radius = metersToPixels(FOG_RADIUS_M, mpp);
    var buckets = new Map();
    pathCoordinates.forEach(function(point, i) {
        var ageDays = (now - point.startTime) / 86400000; var color = getAgeColor(ageDays); if (!color) return;
        if (!buckets.has(color)) buckets.set(color, []); var pos = latLngToCanvasPoint([point.lat, point.lng]);
        if (i > 0 && shouldConnectStoredPathPoints(pathCoordinates[i - 1], point)) { var prev = latLngToCanvasPoint([pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng]); buckets.get(color).push({ x1: prev.x, y1: prev.y, x2: pos.x, y2: pos.y }); }
    });
    var offCtx = ageScratchCtx;
    buckets.forEach(function(draws, color) {
        offCtx.clearRect(0, 0, w, h);
        offCtx.strokeStyle = color; offCtx.lineWidth = radius * 1.15; offCtx.lineCap = "round"; offCtx.lineJoin = "round"; offCtx.beginPath();
        draws.forEach(function(d) { offCtx.moveTo(d.x1, d.y1); offCtx.lineTo(d.x2, d.y2); }); offCtx.stroke(); ageCtx.drawImage(ageScratchCanvas, 0, 0);
    });
}

function getAgeColor(ageDays) { if (ageDays < THREE_DAYS_IN_DAYS) return null; if (ageDays < ONE_MONTH_DAYS) return "rgba(173, 255, 120, 0.16)"; if (ageDays < THREE_MONTHS_DAYS) return "rgba(60, 170, 80, 0.18)"; if (ageDays < SIX_MONTHS_DAYS) return "rgba(214, 176, 55, 0.18)"; if (ageDays < ONE_YEAR_DAYS) return "rgba(130, 92, 55, 0.20)"; return SEDIMENT_LAYER_COLOR; }

function renderStayTint() {
    var w = stayCanvas.width, h = stayCanvas.height; stayCtx.clearRect(0, 0, w, h);
    if (pathCoordinates.length === 0) return; var mpp = calcMpp();
    pathCoordinates.forEach(function(point) {
        var stayMin = (point.endTime - point.startTime) / 60000; if (stayMin < 10) return;
        var pos = latLngToCanvasPoint([point.lat, point.lng]); var radius = metersToPixels(getStayRadiusMeters(stayMin), mpp);
        // A stay is a radius, not a color overlay.  Keep the map and fog
        // readable by drawing only soft concentric rings (1x to 2x radius).
        var ratio = Math.max(0, Math.min(1, (stayMin - 10) / 170));
        var inner = radius * Math.max(.42, .66 - ratio * .18);
        stayCtx.save();
        stayCtx.strokeStyle = "rgba(79, 195, 247, " + (0.18 + ratio * 0.16).toFixed(2) + ")";
        stayCtx.lineWidth = Math.max(1.25, radius * .035);
        stayCtx.setLineDash([Math.max(3, radius * .13), Math.max(3, radius * .10)]);
        stayCtx.beginPath(); stayCtx.arc(pos.x, pos.y, inner, 0, Math.PI * 2); stayCtx.stroke();
        stayCtx.setLineDash([]);
        stayCtx.strokeStyle = "rgba(79, 195, 247, " + (0.28 + ratio * 0.20).toFixed(2) + ")";
        stayCtx.lineWidth = Math.max(1.5, radius * .045);
        stayCtx.beginPath(); stayCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); stayCtx.stroke();
        stayCtx.restore();
    });
}

function getStayRadiusMeters(stayMin) { if (stayMin < 10) return FOG_RADIUS_M; if (stayMin >= 180) return FOG_RADIUS_M * 2.0; return FOG_RADIUS_M * (1.0 + (stayMin - 10) / (180 - 10)); }
function getPhotoMarkerSize() { var zoom = map.getZoom(); if (zoom >= MARKER_MAX_ZOOM) return MARKER_MAX_SIZE; if (zoom <= MARKER_MIN_ZOOM) return MARKER_MIN_SIZE; var ratio = (zoom - MARKER_MIN_ZOOM) / (MARKER_MAX_ZOOM - MARKER_MIN_ZOOM); return Math.round(MARKER_MIN_SIZE + ratio * (MARKER_MAX_SIZE - MARKER_MIN_SIZE)); }
function buildPhotoMarkerIcon(src, size, data) { var badges = data && (data.memo || data.missionId) ? '<span class="photo-memory-badge">' + (data.missionId ? "★" : "✎") + '</span>' : ""; return L.divIcon({ className: "photo-marker", html: '<span class="photo-polaroid"><img src="' + src + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;" />' + badges + '</span>', iconSize: [size, size], iconAnchor: [size / 2, size] }); }
function updatePhotoMarkerSizes() {
    var size = getPhotoMarkerSize();
    if (size === lastPhotoMarkerSize) return;
    lastPhotoMarkerSize = size;
    photoClusterGroup.eachLayer(function(marker) {
        if (marker._photoData) marker.setIcon(buildPhotoMarkerIcon(marker._photoData.thumb, size, marker._photoData));
    });
}

function calcLevel() {
    var state = loadRpgGrowth();
    return { level:getRpgLevel(getRpgTotal(state.stats)), title:getRpgTrait(state).name };
}

function updateHud() { updateRpgGrowthUI(loadRpgGrowth()); }

function getDailyTaskDate() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}
function loadTodayGrowth() {
    var today = getDailyTaskDate();
    try {
        var saved = JSON.parse(localStorage.getItem(DAILY_GROWTH_KEY) || "null");
        if (saved && saved.date === today && saved.stats) return saved;
    } catch (_) {}
    return { date:today, stats:{ exploration:0, experience:0, memory:0, connection:0, growth:0 } };
}
function recordTodayGrowth(added) {
    var state = loadTodayGrowth();
    RPG_STAT_KEYS.forEach(function(key) { state.stats[key] = Math.max(0, Number(state.stats[key]) || 0) + Math.max(0, Number(added[key]) || 0); });
    localStorage.setItem(DAILY_GROWTH_KEY, JSON.stringify(state));
}
function loadDailyTaskState() {
    var today = getDailyTaskDate();
    try {
        var saved = JSON.parse(localStorage.getItem(DAILY_TASK_KEY) || "null");
        if (saved && saved.date === today) {
            // 거리 미션이 두 개였던 이전 일일 미션은 같은 날에도 즉시 교체한다.
            // 사용자가 직접 남기는 기록 행동을 하나 넣어 걷기 미션과 겹치지 않게 한다.
            var hasReplaceableMission = Array.isArray(saved.missions) && saved.missions.some(function(mission) { return mission && (mission.id === "walk_100" || mission.id === "pin_1"); });
            if (hasReplaceableMission) {
                saved.missions = saved.missions.map(function(mission) {
                    return mission && (mission.id === "walk_100" || mission.id === "pin_1")
                        ? { id: "share_giloa", type: "share", icon: "↗", name: "길로아 알리기", target: 1 }
                        : mission;
                });
                localStorage.setItem(DAILY_TASK_KEY, JSON.stringify(saved));
            }
            return saved;
        }
    } catch (e) {}
    // 매일 어떤 지역에서도 같은 세 가지 여행 행동을 제시한다.
    // 주변 장소 검색 상태에 따라 1km 걷기 미션이 사라지지 않게 한다.
    var missions = [
        { id: "share_giloa", type: "share", icon: "↗", name: "길로아 알리기", target: 1 },
        { id: "walk_1000", type: "distance", icon: "✦", name: "1km 걷기", target: 1000 },
        { id: "photo_1", type: "photo", icon: "◇", name: "사진 1장 남기기", target: 1 }
    ];
    var fresh = { date: today, startDistance: totalDistance, startPhotos: photos.length, missions: missions.slice(0, 3) };
    localStorage.setItem(DAILY_TASK_KEY, JSON.stringify(fresh));
    return fresh;
}
function getDailyTaskProgress() {
    var state = loadDailyTaskState();
    var walked = Math.max(0, totalDistance - Number(state.startDistance || 0));
    var photoCount = Math.max(0, photos.length - Number(state.startPhotos || 0));
    return (state.missions || []).map(function(mission) {
        var current = 0;
        if (mission.type === "distance") current = Math.min(walked, mission.target);
        else if (mission.type === "photo") current = Math.min(photoCount, 1);
        else if (mission.type === "share") current = localStorage.getItem(DAILY_SHARE_KEY) === state.date ? 1 : 0;
        else if (mission.type === "photo_place") current = photos.some(function(p) { return p.placeId === mission.targetId || (p.lat && L.latLng(p.lat, p.lng).distanceTo([mission.targetLat, mission.targetLng]) <= 80); }) ? 1 : 0;
        else if (mission.type === "visit_place") current = visitStamps.some(function(v) { return v.visitKey && v.visitKey.indexOf(mission.targetId + ":") === 0; }) ? 1 : 0;
        return Object.assign({}, mission, { current: current, value: mission.type === "distance" ? Math.round(current) + "/" + mission.target + "m" : current + "/1" });
    });
}
function getDailyMissionName(mission) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (mission.type === "distance") {
        var meters = Number(mission.target) || 0;
        var distance = meters >= 1000 ? (meters / 1000) + "km" : meters + "m";
        return String(t.daily_mission_walk || "{distance} 걷기").replace("{distance}", distance);
    }
    if (mission.type === "photo") return t.daily_mission_photo;
    if (mission.type === "share") return (DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko).mission;
    var item = (tourItems || []).concat(festivalItems || []).find(function(candidate) { return getTourItemId(candidate) === String(mission.targetId || ""); });
    var place = item ? getImageMissionName(item) : t.daily_nearby_place;
    if (mission.type === "visit_place") return String(t.daily_mission_visit || "{place} 방문하기").replace("{place}", place);
    if (mission.type === "photo_place") return String(t.daily_mission_photo_place || "{place}에서 사진 남기기").replace("{place}", place);
    return mission.name || "";
}
function updateDailyMissions() {
    var listEl = document.getElementById("daily-task-list");
    if (!listEl) return;
    var tasks = getDailyTaskProgress();
    var completed = tasks.filter(function(task) { return task.current >= task.target; }).length;
    listEl.innerHTML = tasks.map(function(task) {
        var pct = Math.min(100, Math.round((task.current / task.target) * 100));
        var done = pct >= 100;
        var effect = done && completeDailyTask(task.id, 30) ? ' just-completed' : '';
        // 공유는 하루에 몇 번이든 할 수 있어야 하므로 미션 완료 뒤에도 버튼을 계속 노출한다.
        var shareAction = task.type === "share" ? '<button type="button" class="daily-share-action" onclick="shareGiloaToday()">' + escapeHtml((DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko).action) + '</button>' : '';
        return '<div class="daily-task-item daily-task-action' + (done ? ' done' : '') + effect + '" data-task-id="' + escapeHtml(task.id) + '" data-task-type="' + escapeHtml(task.type) + '" role="button" tabindex="0"><div class="daily-task-icon">' + (done ? "✓" : task.icon) + '</div><div><div class="daily-task-name">' + escapeHtml(getDailyMissionName(task)) + '</div><div class="daily-task-track"><div class="daily-task-fill" style="width:' + pct + '%"></div></div></div><div class="daily-task-value">' + task.value + shareAction + '</div></div>';
    }).join("");
    listEl.querySelectorAll(".daily-task-action").forEach(function(item) {
        var activate = function(event) {
            if (event && event.target && event.target.closest && event.target.closest(".daily-share-action")) return;
            handleDailyTaskAction(item.dataset.taskType, event);
        };
        item.addEventListener("click", activate);
        item.addEventListener("keydown", function(event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            activate(event);
        });
    });
    var tagCount = document.getElementById("daily-task-tag-count");
    var summary = document.getElementById("daily-task-summary");
    var tag = document.getElementById("daily-task-tag");
    if (tagCount) tagCount.textContent = completed + "/3";
    if (summary) summary.textContent = completed + "/3 " + ((UI_TEXT[currentLang] || UI_TEXT.ko).daily_completed || "완료");
    if (tag) tag.classList.toggle("all-done", completed === 3);
}
function handleDailyTaskAction(taskType, event) {
    if (event) event.stopPropagation();
    if (taskType === "photo" || taskType === "photo_place") {
        toggleDailyTasks(false);
        triggerCamera();
        return;
    }
    if (taskType === "distance") showTodayWalkingRoute();
}
function showTodayWalkingRoute() {
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    var points = (pathCoordinates || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && Number(point.endTime || point.startTime) >= todayStart.getTime();
    }).sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    if (!points.length) {
        showCollectionToast(earlyUiText("noRouteToday"));
        return;
    }
    toggleDailyTasks(false);
    if (!map.getPane("dailyRoutePane")) {
        map.createPane("dailyRoutePane");
        map.getPane("dailyRoutePane").style.zIndex = 625;
        map.getPane("dailyRoutePane").style.pointerEvents = "none";
    }
    if (dailyRouteLayer) dailyRouteLayer.clearLayers();
    else dailyRouteLayer = L.layerGroup().addTo(map);
    var runs = [], run = [];
    points.forEach(function(point) {
        if (!run.length) { run.push(point); return; }
        var previous = run[run.length - 1];
        var connected = shouldConnectPath(previous, point);
        if (!connected) { runs.push(run); run = [point]; }
        else run.push(point);
    });
    if (run.length) runs.push(run);
    runs.forEach(function(segment) {
        var latlngs = segment.map(function(point) { return [point.lat, point.lng]; });
        if (latlngs.length < 2) {
            L.circleMarker(latlngs[0], { pane:"dailyRoutePane", radius:6, color:"#6b7280", weight:3, fillColor:"#72d34d", fillOpacity:1, interactive:false }).addTo(dailyRouteLayer);
            return;
        }
        L.polyline(latlngs, { pane:"dailyRoutePane", color:"#6b7280", weight:9, opacity:.88, lineCap:"round", lineJoin:"round", interactive:false }).addTo(dailyRouteLayer);
        L.polyline(latlngs, { pane:"dailyRoutePane", color:"#72d34d", weight:5, opacity:1, lineCap:"round", lineJoin:"round", interactive:false }).addTo(dailyRouteLayer);
    });
    var bounds = L.latLngBounds(points.map(function(point) { return [point.lat, point.lng]; }));
    if (bounds.isValid() && points.length > 1) map.fitBounds(bounds, { padding:[42, 110], maxZoom:18, animate:true });
    else map.setView([points[0].lat, points[0].lng], 17, { animate:true });
}
function getGiloaShareUi() { return GILOA_SHARE_UI[normalizeLang(currentLang)] || GILOA_SHARE_UI.ko; }
// 공유 모드: "app"은 길로아 소개, "journey"는 오늘 내가 걸은 길.
var giloaShareMode = "app";
function setGiloaShareMode(mode) {
    giloaShareMode = mode === "journey" ? "journey" : "app";
    renderGiloaShareSheet();
}
function getJourneyShareMessage() {
    var summary = getTodayJourneySummary(), t = getJourneyShareText();
    var parts = [
        t.distance + " " + (summary.distance / 1000).toFixed(1) + "km",
        t.visits + " " + summary.visits.length,
        t.photos + " " + summary.photos.length,
        t.memories + " " + summary.memories.length
    ];
    return t.title + " — " + parts.join(" · ") + "\n" + t.footer;
}
function getGiloaShareMessage() {
    if (giloaShareMode === "journey") return getJourneyShareMessage();
    var copy = DAILY_SHARE_TEXT[currentLang] || DAILY_SHARE_TEXT.ko;
    return copy.text;
}
function markDailyShareDone() {
    localStorage.setItem(DAILY_SHARE_KEY, getDailyTaskDate());
    updateDailyMissions();
}
// Capacitor WebView에서는 window.open이 막히는 경우가 있어 앵커 클릭으로 우회한다.
function openExternalLink(url) {
    var win = null;
    try { win = window.open(url, "_blank", "noopener,noreferrer"); } catch (e) { win = null; }
    if (win) return;
    var anchor = document.createElement("a");
    anchor.href = url; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}
function copyGiloaShareText() {
    var message = getGiloaShareMessage() + "\n" + GILOA_STORE_URL;
    var ui = getGiloaShareUi();
    var done = function() { showCollectionToast(ui.copied); markDailyShareDone(); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(done).catch(function() { window.prompt(ui.copyLink, message); markDailyShareDone(); });
        return;
    }
    window.prompt(ui.copyLink, message);
    markDailyShareDone();
}
// 인스타그램은 외부에서 글/링크를 미리 채워 넣는 공개 엔드포인트가 없다.
// 그래서 문구를 클립보드에 넣고 앱(또는 웹)을 열어 붙여넣도록 안내한다.
function shareGiloaToInstagram() {
    var ui = getGiloaShareUi();
    var message = getGiloaShareMessage() + "\n" + GILOA_STORE_URL;
    var openInstagram = function() {
        showCollectionToast(ui.igGuide);
        markDailyShareDone();
        setTimeout(function() { openExternalLink("https://www.instagram.com/"); }, 900);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(openInstagram).catch(openInstagram);
        return;
    }
    openInstagram();
}
function shareGiloaVia(targetId) {
    if (targetId === "journeyImage") return shareTodayJourneyToInstagram();
    if (targetId === "saveImage") {
        showCollectionToast(getJourneyShareText().preparing);
        return buildTodayJourneyShareImage().then(function(blob) { downloadJourneyShareImage(blob); markDailyShareDone(); })
            .catch(function(error) { console.warn("Journey share image failed", error); copyGiloaShareText(); });
    }
    if (targetId === "system") return shareGiloaWithSystemSheet();
    if (targetId === "copy") return copyGiloaShareText();
    if (targetId === "instagram") return shareGiloaToInstagram();
    var target = null;
    GILOA_SHARE_TARGETS.forEach(function(entry) { if (entry.id === targetId) target = entry; });
    if (!target) return;
    openExternalLink(target.build(getGiloaShareMessage(), GILOA_STORE_URL));
    // 외부 창에서 실제로 게시했는지는 확인할 수 없으므로, 공유 창을 연 시점에 완료 처리한다.
    markDailyShareDone();
    closeGiloaShare();
}
function shareGiloaWithSystemSheet() {
    if (!navigator.share) return copyGiloaShareText();
    // 이미 공유 창이 떠 있으면 navigator.share가 InvalidStateError로 거절된다.
    // 사용자가 직접 취소한 AbortError와 달리, 그 밖의 실패는 복사로 대체한다.
    navigator.share({ title: "Giloa", text: getGiloaShareMessage(), url: GILOA_STORE_URL })
        .then(function() { markDailyShareDone(); closeGiloaShare(); })
        .catch(function(error) {
            if (error && (error.name === "AbortError" || error.name === "InvalidStateError")) return;
            copyGiloaShareText();
        });
}
function renderGiloaShareSheet() {
    var grid = document.getElementById("giloa-share-grid");
    if (!grid) return;
    var ui = getGiloaShareUi();
    var journey = giloaShareMode === "journey";
    var buttons = [];
    if (journey) {
        // 오늘 걸은 길은 카드 이미지가 본편이다. 이미지 공유가 막힌 기기에서는 저장으로 대체한다.
        buttons.push({ id: "journeyImage", label: ui.shareImage, mark: "◎", accent: "#b8ff40" });
        buttons.push({ id: "saveImage", label: ui.saveImage, mark: "↓", accent: "#68ccff" });
    } else if (navigator.share) {
        buttons.push({ id: "system", label: ui.system, mark: "↗", accent: "#b8ff40" });
    }
    if (!journey) buttons.push({ id: "instagram", label: ui.instagram, mark: "IG", accent: "#ff9ad2" });
    GILOA_SHARE_TARGETS.forEach(function(target) { buttons.push(target); });
    buttons.push({ id: "copy", label: ui.copyLink, mark: "⧉", accent: "#68ccff" });
    grid.innerHTML = buttons.map(function(button) {
        return '<button type="button" class="giloa-share-btn" data-share-id="' + escapeHtml(button.id) + '" onclick="shareGiloaVia(\'' + escapeHtml(button.id) + '\')">'
            + '<span class="giloa-share-mark" style="color:' + escapeHtml(button.accent) + '">' + escapeHtml(button.mark) + '</span>'
            + '<span class="giloa-share-label">' + escapeHtml(button.label) + '</span></button>';
    }).join("");
    var modes = document.getElementById("giloa-share-modes");
    if (modes) {
        modes.innerHTML = [["app", ui.modeApp], ["journey", ui.modeJourney]].map(function(mode) {
            return '<button type="button" class="giloa-share-mode' + (giloaShareMode === mode[0] ? " active" : "") + '"'
                + ' aria-pressed="' + (giloaShareMode === mode[0] ? "true" : "false") + '"'
                + ' onclick="setGiloaShareMode(\'' + mode[0] + '\')">' + escapeHtml(mode[1]) + '</button>';
        }).join("");
    }
    var title = document.getElementById("giloa-share-title");
    var intro = document.getElementById("giloa-share-copy");
    var note = document.getElementById("giloa-share-note");
    if (title) title.textContent = ui.title;
    if (intro) intro.textContent = journey ? getJourneyShareMessage().split("\n")[0] : ui.intro;
    if (note) note.textContent = journey ? ui.journeyNote : ui.note;
}
function openGiloaShare(event) {
    if (event) event.preventDefault();
    var modal = document.getElementById("giloa-share-sheet");
    if (!modal) return copyGiloaShareText();
    renderGiloaShareSheet();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    var closeButton = modal.querySelector(".giloa-share-head button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
}
function closeGiloaShare() {
    var modal = document.getElementById("giloa-share-sheet");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}
// 오늘의 할 일 "길로아 알리기" 버튼 진입점.
function shareGiloaToday() { openGiloaShare(); }
function toggleDailyTasks(forceOpen) {
    dailyTaskPanelOpen = typeof forceOpen === "boolean" ? forceOpen : !dailyTaskPanelOpen;
    var panel = document.getElementById("daily-task-panel");
    var tag = document.getElementById("daily-task-tag");
    if (panel) {
        panel.classList.toggle("open", dailyTaskPanelOpen);
        panel.setAttribute("aria-hidden", dailyTaskPanelOpen ? "false" : "true");
    }
    if (tag) tag.setAttribute("aria-expanded", dailyTaskPanelOpen ? "true" : "false");
    if (dailyTaskPanelOpen) updateDailyMissions();
}
function getRpgMetrics() {
    var daily = loadDailyTaskState();
    return {
        distanceUnits: Math.floor(Math.max(0, Number(totalDistance) || 0) / 100),
        visits: Array.isArray(visitStamps) ? visitStamps.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        memories: Array.isArray(memories) ? memories.length : 0,
        stayPlaces: Array.isArray(stayBonusPlaces) ? stayBonusPlaces.length : 0,
        badges: Array.isArray(badges) ? badges.length : 0,
        dailyTasks: daily && Array.isArray(daily.rewarded) ? daily.rewarded.length : 0
    };
}
function seedRpgStats(metrics) {
    return {
        exploration: metrics.distanceUnits,
        experience: metrics.visits * 3,
        memory: metrics.photos * 2 + metrics.memories * 2 + metrics.stayPlaces * 3,
        connection: 0,
        growth: metrics.badges * 4 + metrics.dailyTasks * 4
    };
}
function loadRpgGrowth() {
    var metrics = getRpgMetrics();
    try {
        var saved = JSON.parse(localStorage.getItem(RPG_GROWTH_KEY) || "null");
        if (saved && saved.stats && saved.metrics) {
            RPG_STAT_KEYS.forEach(function(key) { saved.stats[key] = Math.max(0, Number(saved.stats[key]) || 0); });
            saved.version = Math.max(2, Number(saved.version) || 1);
            saved.metrics = Object.assign({}, metrics, saved.metrics || {});
            return saved;
        }
    } catch (e) { console.warn("여행 성장 기록을 복원하지 못했습니다.", e); }
    return { version:2, stats:seedRpgStats(metrics), metrics:metrics, traitKey:"", updatedAt:Date.now() };
}
function saveRpgGrowth(state) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(RPG_GROWTH_KEY, JSON.stringify(state)); }
    catch (e) { console.warn("여행 성장 기록을 저장하지 못했습니다.", e); }
}
function getRpgTotal(stats) { return RPG_STAT_KEYS.reduce(function(sum, key) { return sum + (Number(stats[key]) || 0); }, 0); }
function getRpgLevel(total) { return Math.min(30, Math.max(1, Math.floor(total / RPG_POINTS_PER_LEVEL) + 1)); }
function getRpgStage(level) { return level <= 10 ? "learning" : level <= 20 ? "forming" : "seasoned"; }
function resolveRpgTraitKey(state) {
    var stats = state.stats || state;
    var topValue = Math.max.apply(null, RPG_STAT_KEYS.map(function(key) { return Number(stats[key]) || 0; }));
    var tied = RPG_STAT_KEYS.filter(function(key) { return (Number(stats[key]) || 0) === topValue; });
    var previous = state && state.traitKey;
    var key = tied.indexOf(previous) >= 0 ? previous : RPG_STAT_KEYS.find(function(candidate) { return tied.indexOf(candidate) >= 0; });
    if (state && state.stats) state.traitKey = key;
    return key || RPG_STAT_KEYS[0];
}
function getRpgTrait(state) {
    var stats = state && state.stats ? state.stats : state;
    var level = getRpgLevel(getRpgTotal(stats)); var words = getRpgText(); var hud = getRpgHudText();
    if (level < 30) { var stage = getRpgStage(level); return { key:stage, name:hud[stage][0], copy:hud[stage][1], official:false }; }
    var key = resolveRpgTraitKey(state && state.stats ? state : { stats:stats });
    return { key:key, name:words.traits[key][0], copy:words.traits[key][1], official:true };
}
function updateMyGiloAura(state, level) {
    var stats = state.stats || {}; var total = getRpgTotal(stats);
    var ratios = {};
    RPG_STAT_KEYS.forEach(function(key) { ratios[key] = total > 0 ? Math.max(0, Number(stats[key]) || 0) / total : 0; });
    var intensity = level >= 30 ? 1 : Math.max(.22, Math.min(.9, level / 30));
    document.querySelectorAll(".my-gilo-avatar").forEach(function(avatar) {
        avatar.style.setProperty("--aura-exploration", ratios.exploration.toFixed(3));
        avatar.style.setProperty("--aura-experience", ratios.experience.toFixed(3));
        avatar.style.setProperty("--aura-memory", ratios.memory.toFixed(3));
        avatar.style.setProperty("--aura-connection", ratios.connection.toFixed(3));
        avatar.style.setProperty("--aura-growth", ratios.growth.toFixed(3));
        avatar.style.setProperty("--aura-strength", intensity.toFixed(3));
        avatar.classList.toggle("aura-level-10", level >= 10);
        avatar.classList.toggle("aura-level-20", level >= 20);
        avatar.classList.toggle("aura-level-max", level >= 30);
    });
}
function showGiloGrowthReaction(title, detail, type) {
    var words = getRpgText();
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    setDiscoveryGiloImage(type || "mission");
    var kicker = toast.querySelector(".discovery-kicker");
    if (kicker) kicker.textContent = words.toastKicker || earlyUiText("toastKicker");
    document.getElementById("discovery-place-name").textContent = title;
    document.getElementById("discovery-method").textContent = detail || words.toastGrowing || earlyUiText("toastGrowing");
    document.getElementById("discovery-reward").textContent = words.toastReward || earlyUiText("toastReward");
    if (discoveryRewardTimer) clearTimeout(discoveryRewardTimer);
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, 5200);
}
function updateRpgGrowthUI(state) {
    if (!state) state = loadRpgGrowth();
    var total = getRpgTotal(state.stats); var level = getRpgLevel(total); var trait = getRpgTrait(state); var words = getRpgText(); var hud = getRpgHudText();
    var maxStat = Math.max(1, state.stats.exploration, state.stats.experience, state.stats.memory, state.stats.connection, state.stats.growth);
    RPG_STAT_KEYS.forEach(function(key) {
        var value = document.getElementById("rpg-stat-" + key); var bar = document.getElementById("rpg-bar-" + key);
        var ratioPercent = total > 0 ? Math.round((state.stats[key] / total) * 100) : 0;
        if (value) { value.textContent = ratioPercent + "%"; value.title = String(state.stats[key]); }
        if (bar) bar.style.width = Math.round((state.stats[key] / maxStat) * 100) + "%";
        var label = document.querySelector(".rpg-stat." + key + " span"); if (label) label.textContent = words.stats[key];
    });
    var traitName = document.getElementById("rpg-trait-name"); var traitCopy = document.getElementById("rpg-trait-copy");
    var levelEl = document.getElementById("rpg-level"); var nextLabel = document.getElementById("rpg-next-label");
    var nextValue = document.getElementById("rpg-next-value"); var progress = document.getElementById("rpg-level-progress");
    if (traitName) traitName.textContent = trait.official ? trait.name : trait.name;
    if (traitCopy) traitCopy.textContent = trait.copy;
    if (levelEl) levelEl.textContent = level;
    var isMax = level >= 30; var inLevel = total % RPG_POINTS_PER_LEVEL; var remaining = isMax ? 0 : RPG_POINTS_PER_LEVEL - inLevel;
    var progressPct = isMax ? 100 : Math.round(inLevel / RPG_POINTS_PER_LEVEL * 100);
    if (nextLabel) nextLabel.textContent = isMax ? hud.max : hud.next;
    if (nextValue) nextValue.textContent = isMax ? "MAX" : remaining;
    if (progress) progress.style.width = progressPct + "%";
    var maxBadge = document.getElementById("rpg-level-max"); if (maxBadge) maxBadge.hidden = !isMax;
    var myGiloTitle = document.getElementById("rpg-my-gilo-title"); if (myGiloTitle) myGiloTitle.textContent = hud.myGilo;
    var colorTitle = document.getElementById("rpg-color-title"); if (colorTitle) colorTitle.textContent = hud.myTravelColor;
    updateMyGiloAura(state, level);
    var mini = document.getElementById("hud-mini-line"); var miniProgress = document.getElementById("hud-mini-progress");
    var summary = getTodayJourneySummary(); var daily = getDailyTaskProgress(); var completed = daily.filter(function(task) { return task.current >= task.target; }).length;
    var status = trait.name + " · LV " + level + (isMax ? " · MAX" : " · " + progressPct + "%");
    if (mini) mini.textContent = status + " · " + (summary.distance / 1000).toFixed(1) + "km";
    if (miniProgress) miniProgress.style.width = progressPct + "%";
    var kicker = document.getElementById("rpg-growth-kicker"); if (kicker) kicker.textContent = trait.official ? hud.identity : "REAL-WORLD TRAVEL RPG";
    var setToday = function(id, label, value) { var el = document.getElementById(id); if (el) { el.textContent = label + " " + value; el.setAttribute("aria-label", label + " " + value); el.title = label; } };
    setToday("rpg-today-distance", hud.distance, (summary.distance / 1000).toFixed(1) + "km");
    setToday("rpg-today-visits", hud.discoveries, summary.visits.length);
    setToday("rpg-today-photos", hud.photos, summary.photos.length);
    setToday("rpg-today-missions", hud.missions, completed + "/" + daily.length);
    var recapOpen = document.getElementById("journey-recap-open"); if (recapOpen) recapOpen.textContent = earlyUiText("journeyMap");
    var details = document.getElementById("rpg-stat-details"); var toggle = document.getElementById("rpg-details-toggle");
    if (details) details.hidden = !rpgDetailsOpen;
    if (toggle) { toggle.textContent = rpgDetailsOpen ? hud.detailHide : hud.detailShow; toggle.setAttribute("aria-expanded", rpgDetailsOpen ? "true" : "false"); }
}
function toggleRpgDetails(forceOpen) {
    rpgDetailsOpen = typeof forceOpen === "boolean" ? forceOpen : !rpgDetailsOpen;
    updateRpgGrowthUI(loadRpgGrowth());
    if (rpgDetailsOpen) {
        var details = document.getElementById("rpg-stat-details");
        if (details && typeof details.scrollIntoView === "function") {
            setTimeout(function() { details.scrollIntoView({ behavior:"smooth", block:"nearest" }); }, 0);
        }
    }
}
function closeRpgHudForLinkedView() {
    if (isHudExpanded) toggleHud();
}
function openRpgJourneyView(view) {
    if (view === "photos") {
        closeRpgHudForLinkedView(); switchAllTab("photo"); toggleSidebar(true); return;
    }
    if (view === "visits") {
        closeRpgHudForLinkedView(); switchAllTab("visit"); toggleSidebar(true); return;
    }
    if (view === "missions") { closeRpgHudForLinkedView(); toggleDailyTasks(true); return; }
    if (view !== "distance") return;
    closeRpgHudForLinkedView();
    if (!map || pathCoordinates.length < 2) { switchAllTab("gpx"); toggleSidebar(true); return; }
    var latlngs = pathCoordinates.filter(function(point) { return isFinite(point.lat) && isFinite(point.lng); }).map(function(point) { return [point.lat, point.lng]; });
    if (latlngs.length < 2) return;
    // The fog reveal is the travel history.  Do not add a synthetic straight
    // blue route here: sparse GPS samples can misleadingly cut across the map.
    clearActiveGpxRoute();
    map.fitBounds(L.latLngBounds(latlngs), { padding:[52, 52] });
}
function syncRpgGrowth() {
    var state = loadRpgGrowth(); var beforeLevel = getRpgLevel(getRpgTotal(state.stats)); var beforeTrait = getRpgTrait(state).key;
    var current = getRpgMetrics(); var added = { exploration:0, experience:0, memory:0, connection:0, growth:0 };
    added.exploration = Math.max(0, current.distanceUnits - (state.metrics.distanceUnits || 0));
    added.experience = Math.max(0, current.visits - (state.metrics.visits || 0)) * 3;
    added.memory = Math.max(0, current.photos - (state.metrics.photos || 0)) * 2 + Math.max(0, current.memories - (state.metrics.memories || 0)) * 2 + Math.max(0, current.stayPlaces - (state.metrics.stayPlaces || 0)) * 3;
    added.growth = Math.max(0, current.badges - (state.metrics.badges || 0)) * 4 + Math.max(0, current.dailyTasks - (state.metrics.dailyTasks || 0)) * 4;
    RPG_STAT_KEYS.forEach(function(key) { state.stats[key] += added[key]; });
    recordTodayGrowth(added);
    Object.keys(current).forEach(function(key) { state.metrics[key] = Math.max(Number(state.metrics[key]) || 0, current[key]); });
    saveRpgGrowth(state); updateRpgGrowthUI(state);
    var gained = getRpgTotal(added); if (!gained) return;
    var level = getRpgLevel(getRpgTotal(state.stats)); var trait = getRpgTrait(state);
    var words = getRpgText();
    if (level > beforeLevel) showGiloGrowthReaction(String(words.levelReached || earlyUiText("levelReached")).replace("{level}", level), words.newStage || earlyUiText("newStage"), "level");
    else if (trait.key !== beforeTrait) showGiloGrowthReaction(String(words.traitChanged || earlyUiText("traitChanged")).replace("{trait}", trait.name), trait.copy, "badge");
    else { var top = RPG_STAT_KEYS.slice().sort(function(a,b) { return added[b] - added[a]; })[0]; showGiloGrowthReaction(String(words.statGained || earlyUiText("statGained")).replace("{stat}", words.stats[top] || RPG_STAT_LABELS[top]).replace("{amount}", added[top]), words.actionBecameSkill || earlyUiText("actionBecameSkill"), "mission"); }
}
function rewardConnection(points, source) {
    var state = loadRpgGrowth(); var amount = Math.max(0, Math.floor(Number(points) || 0)); if (!amount) return;
    state.stats.connection += amount; recordTodayGrowth({ connection:amount }); saveRpgGrowth(state); updateRpgGrowthUI(state);
    var words = getRpgText();
    showGiloGrowthReaction(String(words.connectionGained || earlyUiText("connectionGained")).replace("{amount}", amount), source || words.connectionDetail || earlyUiText("connectionDetail"));
}
function updateStats() { var todayDist = calcTodayDistance(); var distEl = document.getElementById("dist-val"); var todayEl = document.getElementById("today-dist-val"); var memEl = document.getElementById("memory-count-val"); var photoEl = document.getElementById("photo-count-val"); if (distEl) distEl.innerHTML = (totalDistance / 1000).toFixed(2) + "<span>km</span>"; if (todayEl) todayEl.innerHTML = (todayDist / 1000).toFixed(2) + "<span>km</span>"; if (memEl) memEl.innerHTML = memories.length + "<span>" + escapeHtml(earlyUiText("memoryUnit")) + "</span>"; if (photoEl) photoEl.innerHTML = photos.length + "<span>" + escapeHtml(earlyUiText("photoUnit")) + "</span>"; updateHud(); updateDailyMissions(); checkBadges(); syncRpgGrowth(); }

function toggleHud() { applyHudLang(UI_TEXT[currentLang] || UI_TEXT.ko); isHudExpanded = !isHudExpanded; document.getElementById("hud").classList.toggle("expanded", isHudExpanded); document.getElementById("controls").classList.toggle("hud-open", isHudExpanded); document.getElementById("help-btn").classList.toggle("hud-open", isHudExpanded); setTimeout(positionGiloLoading, 310); if (isHudExpanded) { setTimeout(function() { document.addEventListener("click", handleHudOutsideClick); }, 0); } else { document.removeEventListener("click", handleHudOutsideClick); } }
function handleHudOutsideClick(event) { var hud = document.getElementById("hud"); if (!hud.contains(event.target)) { isHudExpanded = false; hud.classList.remove("expanded"); document.getElementById("controls").classList.remove("hud-open"); document.getElementById("help-btn").classList.remove("hud-open"); document.removeEventListener("click", handleHudOutsideClick); setTimeout(positionGiloLoading, 310); } }
function getStatusText(key, value) {
    var t = UI_TEXT[currentLang] || UI_TEXT.en || UI_TEXT.ko;
    var text = t[key] || (UI_TEXT.en && UI_TEXT.en[key]) || key;
    return typeof value === "undefined" ? text : text.replace("{value}", value);
}
function syncRecordingUI() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; recBtn.classList.toggle("recording", isRecording); recStatusBox.textContent = isRecording ? t.rec_active : t.rec_idle; recStatusBox.classList.toggle("recording", isRecording); updateHud(); syncImageMissionUI(); }
function getImageMissionLatLng(item) {
    if (!item) return null;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return L.latLng(lat, lng);
}
function getImageMissionName(item) { return getTourDisplayTitle(item) || item.name || item.LBRRY_NAME || item.title || earlyUiText("missionPlace"); }
function getActiveImageMission() {
    if (!currentPos) return null;
    var sources = [];
    if (Array.isArray(tourItems)) sources = sources.concat(tourItems);
    if (Array.isArray(festivalItems)) sources = sources.concat(festivalItems);
    if (Array.isArray(libraryItems)) sources = sources.concat(libraryItems);
    var best = null;
    sources.forEach(function(item) {
        var latlng = getImageMissionLatLng(item);
        if (!latlng) return;
        var dist = currentPos.distanceTo(latlng);
        if (dist <= IMAGE_MISSION_RADIUS_M && (!best || dist < best.distance)) {
            best = { item: item, distance: dist, name: getImageMissionName(item) };
        }
    });
    return best;
}
function syncImageMissionUI() {
    var photoBtn = document.getElementById("photo-btn");
    if (!photoBtn) return;
    activeImageMission = getActiveImageMission();
    photoBtn.classList.toggle("mission-active", !!activeImageMission);
    photoBtn.setAttribute("title", activeImageMission ? earlyUiText("photoMission", { name:activeImageMission.name }) : earlyUiText("importPhotos"));
}
function syncFogButton() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var toggleBtn = document.getElementById("fog-toggle-btn"); var toggleState = document.getElementById("fog-toggle-state"); if (!toggleBtn) return; toggleBtn.classList.toggle("on", isFogEnabled); toggleBtn.classList.toggle("off", !isFogEnabled); if (toggleState) { toggleState.textContent = isFogEnabled ? t.fog_on : t.fog_off; toggleState.classList.toggle("on", isFogEnabled); toggleState.classList.toggle("off", !isFogEnabled); } }
const localMarketPriceData = {
    demo: true,
    regionName: "current",
    sourceName: "publicData",
    updatedAt: null,
    items: { meal: 10500, cafe: 4800, necessities: 2500, transport: 4800 }
};
const marketCategoryMap = {
    meal: [], cafe: [], necessities: [], transport: []
    // 추후 품목별 단위와 조사 기준을 확인한 뒤 카테고리 대표가격 산정 방식 적용 필요
};
let activeHelpTab = "ask";
async function fetchLocalMarketPrices(latitude, longitude) {
    // 추후 공공데이터 API 또는 CSV 연동 위치. 좌표는 연동 시 지역 판별에 사용한다.
    void latitude; void longitude; void marketCategoryMap;
    return localMarketPriceData;
}
function getCurrentCoordinates() {
    return currentPos ? { latitude: currentPos.lat, longitude: currentPos.lng } : { latitude: null, longitude: null };
}
function formatLocalPrice(value, language) {
    var amount = Number(value);
    if (!isFinite(amount) || amount < 0) return "";
    var formatted = Math.round(amount).toLocaleString(language === "ko" ? "ko-KR" : "en-US");
    return language === "ko" ? formatted + "원" : "₩" + formatted;
}
function showLocalMarketPriceLoading() {
    var content = document.getElementById("local-market-content");
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (content) content.innerHTML = '<div class="local-market-state local-market-loading">' + t.market_loading + '</div>';
}
function showLocalMarketPriceEmpty() {
    var content = document.getElementById("local-market-content");
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    if (content) content.innerHTML = '<div class="local-market-state">' + t.market_empty + '</div>';
}
function renderLocalMarketPrices(data) {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var content = document.getElementById("local-market-content");
    if (!content || !data || !data.items) { showLocalMarketPriceEmpty(); return; }
    var definitions = [
        { key: "meal", icon: "🍽", label: t.market_meal },
        { key: "cafe", icon: "☕", label: t.market_cafe },
        { key: "necessities", icon: "▣", label: t.market_necessities },
        { key: "transport", icon: "↔", label: t.market_transport }
    ];
    var validItems = definitions.filter(function(item) {
        var value = Number(data.items[item.key]);
        return isFinite(value) && value >= 0;
    });
    if (!validItems.length) { showLocalMarketPriceEmpty(); return; }
    content.innerHTML = '<div class="local-market-list">' + validItems.map(function(item) {
        return '<div class="local-market-item"><div class="local-market-icon" aria-hidden="true">' + item.icon + '</div><div class="local-market-name">' + item.label + '</div><div class="local-market-price">' + formatLocalPrice(data.items[item.key], currentLang) + '</div></div>';
    }).join("") + '</div>';
    setText("local-market-region", t.market_current_area);
    var updated = document.getElementById("local-market-updated");
    if (updated) {
        updated.hidden = !!data.demo || !data.updatedAt;
        updated.textContent = !data.demo && data.updatedAt ? t.market_updated + " " + data.updatedAt : "";
    }
}
async function renderLocalMarketPriceTab() {
    showLocalMarketPriceLoading();
    var coords = getCurrentCoordinates();
    try {
        var data = await fetchLocalMarketPrices(coords.latitude, coords.longitude);
        if (activeHelpTab === "market") renderLocalMarketPrices(data);
    } catch (e) {
        if (activeHelpTab === "market") showLocalMarketPriceEmpty();
    }
}
function updateLocalMarketPriceLanguage() {
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    setText("local-market-title", t.market_title);
    setText("local-market-description", t.market_description);
    setText("local-market-region", t.market_current_area);
    setText("local-market-source", t.market_source);
    if (activeHelpTab === "market") renderLocalMarketPrices(localMarketPriceData);
}
function toggleHelp() { applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko); document.getElementById("help-popup").classList.toggle("show"); }
function handleHelpOverlayClick(event) { var box = document.getElementById("help-content-box"); if (!box.contains(event.target)) toggleHelp(); }
function switchHelpTab(tab) {
    if (["ask", "info", "market", "settings"].indexOf(tab) < 0) tab = "ask";
    activeHelpTab = tab;
    applyHelpLang(UI_TEXT[currentLang] || UI_TEXT.ko);
    ["ask", "info", "market", "settings"].forEach(function(name) {
        var tabEl = document.getElementById("htab-" + name);
        var panelEl = document.getElementById("hpanel-" + name);
        var selected = name === tab;
        if (tabEl) { tabEl.classList.toggle("active", selected); tabEl.setAttribute("aria-selected", selected ? "true" : "false"); tabEl.tabIndex = selected ? 0 : -1; }
        if (panelEl) panelEl.hidden = !selected;
    });
    var box = document.getElementById("help-content-box");
    if (box) box.scrollTop = 0;
    if (tab === "market") renderLocalMarketPriceTab();
}
function showHelpTab(tabName) { switchHelpTab(tabName); }
function handleHelpTabKey(event, tab) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    var tabs = ["ask", "info", "market", "settings"];
    var index = tabs.indexOf(tab);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = tabs.length - 1;
    else index = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    switchHelpTab(tabs[index]);
    document.getElementById("htab-" + tabs[index]).focus();
}
function replayGiloaTutorial() {
    var helpPopup = document.getElementById("help-popup");
    if (helpPopup) helpPopup.classList.remove("show");
    if (typeof window.startGiloaTutorial === "function") window.startGiloaTutorial();
}
function changeLanguageFromSettings(lang) {
    lang = normalizeLang(lang);
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang);
    localStorage.setItem(LANGUAGE_SELECTED_KEY, "1");
    toggleLang(lang);
    switchHelpTab("settings");
}
function togglePhotoMenu() {
    var menu = document.getElementById("photo-menu"); var overlay = document.getElementById("photo-menu-overlay");
    if (!menu || !overlay) { triggerGallery(); return; }
    menu.classList.toggle("open"); overlay.classList.toggle("show", menu.classList.contains("open"));
}
function closePhotoMenu() { document.getElementById("photo-menu").classList.remove("open"); document.getElementById("photo-menu-overlay").classList.remove("show"); }

function requestPhotoLocationPermission() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.hasPhotoLocationPermission !== "function" || typeof bridge.requestPhotoLocationPermission !== "function") return Promise.resolve(true);
    try { if (bridge.hasPhotoLocationPermission()) return Promise.resolve(true); }
    catch (_) { return Promise.resolve(false); }
    if (photoLocationPermissionPromise) return photoLocationPermissionPromise;
    photoLocationPermissionPromise = new Promise(function(resolve) {
        var settled = false;
        var finish = function(granted) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            window.onGiloaPhotoLocationPermissionResult = null;
            photoLocationPermissionPromise = null;
            resolve(!!granted);
        };
        window.onGiloaPhotoLocationPermissionResult = finish;
        var timer = setTimeout(function() {
            var granted = false;
            try { granted = bridge.hasPhotoLocationPermission(); } catch (_) {}
            finish(granted);
        }, 15000);
        try { bridge.requestPhotoLocationPermission(); }
        catch (_) { finish(false); }
    });
    return photoLocationPermissionPromise;
}

function promiseWithTimeout(promise, timeoutMs, label) {
    return new Promise(function(resolve, reject) {
        var settled = false;
        var timer = setTimeout(function() {
            if (settled) return;
            settled = true;
            reject(new Error((label || "Operation") + " timed out"));
        }, timeoutMs);
        Promise.resolve(promise).then(function(value) {
            if (settled) return;
            settled = true; clearTimeout(timer); resolve(value);
        }, function(error) {
            if (settled) return;
            settled = true; clearTimeout(timer); reject(error);
        });
    });
}

function isValidPhotoCoordinate(lat, lng) {
    lat = Number(lat); lng = Number(lng);
    return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}
var PHOTO_PLACEHOLDER_THUMB = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="#1a2035"/><rect x="0.5" y="0.5" width="95" height="95" rx="11.5" fill="none" stroke="#4db8ff" stroke-opacity="0.45"/><circle cx="35" cy="36" r="7" fill="#4db8ff" fill-opacity="0.7"/><path d="M16 72l20-22 13 14 11-10 20 18z" fill="#4db8ff" fill-opacity="0.45"/></svg>');
function photoHasImageData(photo) {
    return !!(photo && (photo.thumb || photo.photo || photo.remoteThumbUrl || photo.remotePhotoUrl));
}
function getPhotoDisplaySrc(photo) {
    if (!photo) return PHOTO_PLACEHOLDER_THUMB;
    return photo._displayObjectUrl || photo.thumb || photo.photo || photo.remoteThumbUrl || photo.remotePhotoUrl || PHOTO_PLACEHOLDER_THUMB;
}
function parsePhotoDateValue(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "number" && isFinite(value) && value > 0) {
        var numericDate = new Date(value);
        if (!isNaN(numericDate.getTime())) return numericDate;
    }
    if (typeof value !== "string" || !value.trim()) return null;
    var match = value.match(/(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        var exifDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]) || 0);
        if (!isNaN(exifDate.getTime())) return exifDate;
    }
    var parsedTime = Date.parse(value);
    return isNaN(parsedTime) ? null : new Date(parsedTime);
}
function getPhotoTakenDate(photoOrFile, fallbackDate) {
    var exif = photoOrFile && photoOrFile.exif;
    var value = exif && (exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || exif.DateTimeDigitized || exif.DateTime || exif.dateTimeOriginal);
    var parsed = parsePhotoDateValue(value);
    if (parsed) return parsed;
    if (photoOrFile && isFinite(photoOrFile.lastModified) && photoOrFile.lastModified > 0) return new Date(photoOrFile.lastModified);
    return fallbackDate instanceof Date && !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
}
function getRoutePhotoLocation(timestamp) {
    if (!isFinite(timestamp) || !Array.isArray(pathCoordinates) || !pathCoordinates.length) return null;
    var best = null;
    pathCoordinates.forEach(function(point) {
        if (!point || !isValidPhotoCoordinate(point.lat, point.lng)) return;
        var start = Number(point.startTime) || 0;
        var end = Number(point.endTime) || start;
        var delta = timestamp < start ? start - timestamp : timestamp > end ? timestamp - end : 0;
        if (!best || delta < best.delta) best = { lat: Number(point.lat), lng: Number(point.lng), delta: delta };
    });
    if (!best || best.delta > PHOTO_LOCATION_MAX_ROUTE_TIME_MS) return null;
    return { lat: best.lat, lng: best.lng, source: "route", accuracy: null };
}
function getCurrentPhotoLocation() {
    var currentFallback = currentPos && isValidPhotoCoordinate(currentPos.lat, currentPos.lng) &&
        isFinite(currentAccuracy) && currentAccuracy <= PHOTO_LOCATION_GOOD_ACCURACY_M &&
        Date.now() - currentPositionTimestamp <= 120000
        ? { lat: currentPos.lat, lng: currentPos.lng, source: "current", accuracy: Number(currentAccuracy) }
        : null;
    if (currentFallback && Date.now() - currentPositionTimestamp <= 20000) return Promise.resolve(currentFallback);
    if (!navigator.geolocation) return Promise.resolve(currentFallback);
    return new Promise(function(resolve) {
        var settled = false;
        var best = currentFallback;
        var watch = null;
        var finish = function(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (watch !== null && typeof navigator.geolocation.clearWatch === "function") navigator.geolocation.clearWatch(watch);
            resolve(value || best || null);
        };
        var onPosition = function(position) {
            var coords = position && position.coords;
            var accuracy = coords && Number(coords.accuracy);
            if (!coords || !isValidPhotoCoordinate(coords.latitude, coords.longitude) || !isFinite(accuracy)) return;
            var candidate = { lat: Number(coords.latitude), lng: Number(coords.longitude), source: "current", accuracy: accuracy };
            if (!best || accuracy < best.accuracy) best = candidate;
            currentAccuracy = accuracy;
            currentPositionTimestamp = Number(position.timestamp) || Date.now();
            if (accuracy <= 30) finish(candidate);
        };
        var timeout = setTimeout(function() {
            finish(best && best.accuracy <= PHOTO_LOCATION_GOOD_ACCURACY_M ? best : null);
        }, 10000);
        try {
            watch = navigator.geolocation.watchPosition(onPosition, function(error) {
                if (error && error.code === 1) finish(currentFallback);
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 });
        } catch (_) {
            navigator.geolocation.getCurrentPosition(onPosition, function() { finish(currentFallback); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 });
        }
    });
}
function snapshotCurrentPhotoLocation() {
    if (!currentPos || !isValidPhotoCoordinate(currentPos.lat, currentPos.lng)) return null;
    if (!isFinite(currentAccuracy) || currentAccuracy > PHOTO_LOCATION_GOOD_ACCURACY_M) return null;
    if (!isFinite(currentPositionTimestamp) || Date.now() - currentPositionTimestamp > 120000) return null;
    return { lat:Number(currentPos.lat), lng:Number(currentPos.lng), source:"current", accuracy:Number(currentAccuracy) };
}
async function resolvePhotoLocation(photoOrFile, exifGps, sourceType, photoDate, capturedLocation) {
    if (exifGps === undefined) exifGps = await getPhotoExifGps(photoOrFile);
    if (exifGps && isValidPhotoCoordinate(exifGps.lat, exifGps.lng)) {
        return { lat: Number(exifGps.lat), lng: Number(exifGps.lng), source: "exif", accuracy: null };
    }
    if (sourceType === "camera" && capturedLocation && isValidPhotoCoordinate(capturedLocation.lat, capturedLocation.lng)) {
        return { lat:Number(capturedLocation.lat), lng:Number(capturedLocation.lng), source:"current", accuracy:isFinite(capturedLocation.accuracy) ? Number(capturedLocation.accuracy) : null };
    }
    return null;
}
async function inspectPhotoLocation(photoOrFile, sourceType, cameraFallbackDate, capturedLocation) {
    var metadata = await Promise.all([getPhotoExifGps(photoOrFile), getPhotoExifDate(photoOrFile)]);
    var gps = metadata[0];
    var exifDate = metadata[1];
    var routeDate = exifDate;
    if (!routeDate && sourceType === "camera") routeDate = cameraFallbackDate instanceof Date ? cameraFallbackDate : new Date();
    var photoLocation = await resolvePhotoLocation(photoOrFile, gps, sourceType, routeDate, capturedLocation);
    var fileName = photoOrFile && (photoOrFile.name || photoOrFile.path || photoOrFile.webPath || photoOrFile.uri) || "";
    var mimeType = photoOrFile && photoOrFile.type || "";
    console.log("[GILOA PHOTO LOCATION]", {
        fileName: String(fileName),
        mimeType: String(mimeType),
        exifGps: gps,
        exifDate: exifDate,
        resolvedLocation: photoLocation
    });
    return { gps: gps, photoDate: exifDate, routeDate: routeDate, location: photoLocation };
}
function consumeNativePhotoUri(index) {
    var list = window.__giloaNativePhotoUris;
    if ((!Array.isArray(list) || !list.length) && window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.consumeSelectedUris === "function") {
        try {
            var parsed = JSON.parse(window.GiloaPhotoBridge.consumeSelectedUris() || "[]");
            if (Array.isArray(parsed)) {
                list = parsed;
                window.__giloaNativePhotoUris = parsed;
            }
        } catch (_) {}
    }
    if (!Array.isArray(list)) return "";
    return typeof list[index] === "string" ? list[index] : "";
}
function clearNativePhotoUris() {
    try { window.__giloaNativePhotoUris = []; } catch (_) {}
    try {
        if (window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.consumeSelectedUris === "function") window.GiloaPhotoBridge.consumeSelectedUris();
    } catch (_) {}
}

function describeNativePhotoUri(uri) {
    if (!uri) return "";
    try {
        var parsed = new URL(uri);
        return parsed.protocol.replace(":", "") + "://" + (parsed.host || "local") + "/…";
    } catch (_) { return String(uri).split(":")[0] + "://…"; }
}
var GILOA_NATIVE_READ_TRACE = [];
function nativeReadTrace(step, detail) {
    try {
        GILOA_NATIVE_READ_TRACE.push("· " + step + (detail === undefined || detail === null ? "" : ": " + detail));
        if (GILOA_NATIVE_READ_TRACE.length > 40) GILOA_NATIVE_READ_TRACE.shift();
    } catch (_) {}
}
// A Capacitor WebView served from file:// blocks fetch(), so XHR is kept as a
// second route. Either one alone silently fails on some builds.
function xhrBlobFromUrl(url) {
    return new Promise(function(resolve) {
        try {
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "blob";
            request.onload = function() {
                var body = request.response;
                resolve(body && body.size ? body : null);
            };
            request.onerror = function() { resolve(null); };
            request.ontimeout = function() { resolve(null); };
            request.timeout = 20000;
            request.send();
        } catch (_) { resolve(null); }
    });
}
async function readBlobFromAnyUrl(url, label) {
    if (!url) return null;
    try {
        var response = await fetch(url);
        if (response.ok) {
            var body = await response.blob();
            if (body && body.size) { nativeReadTrace(label + " fetch", Math.round(body.size / 1024) + "KB"); return body; }
        }
        nativeReadTrace(label + " fetch", "응답 " + response.status);
    } catch (error) { nativeReadTrace(label + " fetch 실패", error && error.message); }
    var viaXhr = await xhrBlobFromUrl(url);
    if (viaXhr) { nativeReadTrace(label + " XHR", Math.round(viaXhr.size / 1024) + "KB"); return viaXhr; }
    nativeReadTrace(label + " XHR", "실패");
    return null;
}
function base64ToUint8Array(value) {
    var binary = atob(String(value || ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}
// Pulls the file across the JS bridge in pieces. A single 6MB base64 string can
// be dropped by the WebView, which looked exactly like "the file is unreadable".
async function readNativePhotoInChunks(bridge, uri) {
    if (typeof bridge.getPhotoSize !== "function" || typeof bridge.getPhotoChunk !== "function") return null;
    var total = Number(bridge.getPhotoSize(uri));
    if (!isFinite(total) || total <= 0) { nativeReadTrace("청크 크기", "0"); return null; }
    var chunkSize = 524288;
    var pieces = [];
    for (var offset = 0; offset < total; offset += chunkSize) {
        var encoded = bridge.getPhotoChunk(uri, offset, Math.min(chunkSize, total - offset));
        if (!encoded) { nativeReadTrace("청크 읽기", "offset " + offset + " 실패"); return null; }
        pieces.push(base64ToUint8Array(encoded));
        await new Promise(function(resolve) { setTimeout(resolve, 0); });
    }
    var blob = new Blob(pieces, { type: (typeof bridge.getPhotoMimeType === "function" && bridge.getPhotoMimeType(uri)) || "image/jpeg" });
    nativeReadTrace("청크 전송", Math.round(blob.size / 1024) + "KB");
    return blob.size ? blob : null;
}
async function readNativePhotoBlob(uri) {
    GILOA_NATIVE_READ_TRACE = [];
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || !uri) { nativeReadTrace("브릿지", "없음"); return null; }
    nativeReadTrace("URI", describeNativePhotoUri(uri));

    if (typeof bridge.copyPhotoToCache === "function") {
        try {
            var cacheUrl = bridge.copyPhotoToCache(uri);
            nativeReadTrace("copyPhotoToCache", cacheUrl ? String(cacheUrl).slice(0, 60) : "빈 문자열");
            var cached = await readBlobFromAnyUrl(cacheUrl, "캐시 URL");
            if (cached) return cached;
        } catch (error) { nativeReadTrace("copyPhotoToCache 오류", error && error.message); }
    }

    // The URL scheme a Capacitor build serves local files under varies, so each
    // known form is tried against the same cached file before giving up.
    if (typeof bridge.copyPhotoToCachePath === "function") {
        try {
            var path = bridge.copyPhotoToCachePath(uri);
            nativeReadTrace("캐시 경로", path ? String(path).slice(0, 60) : "빈 문자열");
            if (path) {
                var forms = ["https://localhost/_capacitor_file_" + path, "http://localhost/_capacitor_file_" + path, "file://" + path];
                for (var i = 0; i < forms.length; i++) {
                    var found = await readBlobFromAnyUrl(forms[i], "경로형식" + (i + 1));
                    if (found) return found;
                }
            }
        } catch (error) { nativeReadTrace("copyPhotoToCachePath 오류", error && error.message); }
    }

    if (typeof bridge.getPhotoData === "function") {
        try {
            var dataUrl = bridge.getPhotoData(uri);
            nativeReadTrace("getPhotoData", dataUrl ? Math.round(String(dataUrl).length / 1024) + "KB 문자열" : "빈 문자열");
            var dataBlob = dataUrl ? dataUrlToBlob(dataUrl) : null;
            if (dataBlob && dataBlob.size) return dataBlob;
        } catch (error) { nativeReadTrace("getPhotoData 오류", error && error.message); }
    }

    try {
        var chunked = await readNativePhotoInChunks(bridge, uri);
        if (chunked) return chunked;
    } catch (error) { nativeReadTrace("청크 오류", error && error.message); }

    if (typeof bridge.lastError === "function") {
        try { nativeReadTrace("네이티브 오류", bridge.lastError() || "없음"); } catch (_) {}
    }
    return null;
}
async function getOriginalPhotoBlob(nativeUri, pickerPhoto) {
    if (nativeUri) {
        var nativeBlob = await readNativePhotoBlob(nativeUri);
        if (nativeBlob && nativeBlob.size) return nativeBlob;
    }
    var candidates = pickerPhoto ? [pickerPhoto.path, pickerPhoto.uri, pickerPhoto.webPath] : [];
    for (var i = 0; i < candidates.length; i++) {
        if (!candidates[i]) continue;
        var blob = await fetchBlobFromUrl(candidates[i]).catch(function() { return null; });
        if (blob && blob.size) return blob;
    }
    return null;
}

async function triggerCamera() {
    closePhotoMenu();
    var cameraStartedAt = new Date();
    var cameraCaptureLocation = snapshotCurrentPhotoLocation();
    pendingCameraCaptureDate = cameraStartedAt;
    pendingCameraCaptureLocation = cameraCaptureLocation;
    var Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
    if (Camera && typeof Camera.getPhoto === "function") {
        try {
            var photo = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "CAMERA", saveToGallery: true, correctOrientation: true });
            await showPhotoImportProgress(1, 1);
            var photoUrl = photo.webPath || photo.path || photo.uri || "";
            var originalBlob = await fetchBlobFromUrl(photoUrl).catch(function() { return null; });
            var cameraInspection = await inspectPhotoLocation(originalBlob || photo, "camera", cameraStartedAt, cameraCaptureLocation);
            var takenDate = cameraInspection.photoDate || cameraStartedAt;
            var location = cameraInspection.location;
            var img = await loadImageFromUrl(photoUrl);
            await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                originalBlob: originalBlob,
                originalUrl: photoUrl,
                sourceUri: photo.path || photo.webPath || "",
                sourceWebPath: photo.webPath || "",
                sourceType: "camera",
                locationSource: location ? location.source : "unknown",
                locationAccuracy: location ? location.accuracy : null
            });
            pendingCameraCaptureDate = null;
            pendingCameraCaptureLocation = null;
            return;
        } catch (e) {
            console.warn("카메라 처리 실패", e);
        } finally {
            hidePhotoImportProgress();
        }
    }
    document.getElementById("camera-input").click();
}

function hasNativePhotoPicker() {
    var bridge = window.GiloaPhotoBridge;
    return !!(bridge && typeof bridge.pickPhotos === "function" && typeof bridge.copyPhotoToCache === "function");
}
// The cached copy comes back as application/octet-stream, which made HEIC files
// look like JPEG and capped the EXIF read at 1MB. The content resolver knows the
// real type, so it is asked directly.
function resolveNativePhotoMime(uri, blob) {
    var blobType = String(blob && blob.type || "").toLowerCase();
    if (/^image\/(?!$)/.test(blobType) && blobType.indexOf("octet") < 0) return blobType;
    var bridge = window.GiloaPhotoBridge;
    if (bridge && typeof bridge.getPhotoMimeType === "function") {
        try {
            var declared = String(bridge.getPhotoMimeType(uri) || "").toLowerCase();
            if (declared.indexOf("image/") === 0) return declared;
        } catch (_) { }
    }
    return blobType || "";
}
function nativeUriToFileName(uri, mimeType) {
    var base = String(uri || "photo").split("/").pop().split("?")[0] || "photo";
    var type = String(mimeType || "").toLowerCase();
    // A .jpg suffix on a real HEIC defeats the HEIC branch downstream, so the
    // resolved type wins over an extension that happens to be in the URI.
    if (type.indexOf("hei") >= 0) return base.replace(/\.[a-z0-9]{2,5}$/i, "") + ".heic";
    if (/\.[a-z0-9]{2,5}$/i.test(base)) return base;
    var ext = type.indexOf("hei") >= 0 ? ".heic" : type.indexOf("png") >= 0 ? ".png" : ".jpg";
    return base + ext;
}
function blobAsNamedFile(blob, name, mimeType) {
    if (!blob) return null;
    var type = mimeType || blob.type || "image/jpeg";
    if (typeof File === "function") {
        try { return new File([blob], name, { type: type, lastModified: Date.now() }); }
        catch (_) { }
    }
    try { blob.name = name; } catch (_) { }
    return blob;
}
// Imports photos handed over as content:// URIs by the native picker. Those
// bytes come through MediaStore.setRequireOriginal(), so unlike the system
// photo picker the GPS values are intact rather than zeroed out.
async function importPhotosFromNativeUris(uris) {
    var list = Array.isArray(uris) ? uris.filter(Boolean) : [];
    if (!list.length) { syncRecordingUI(); return; }
    var loadedCount = 0;
    var failedCount = 0;
    var lastLocatedPhoto = null;
    try {
        for (var i = 0; i < list.length; i++) {
            await showPhotoImportProgress(i + 1, list.length);
            try {
                var uri = list[i];
                var originalBlob = await getOriginalPhotoBlob(uri, null);
                if (!originalBlob || !originalBlob.size) throw new Error("원본 바이트를 읽지 못했습니다");
                var realMime = resolveNativePhotoMime(uri, originalBlob);
                var named = blobAsNamedFile(originalBlob, nativeUriToFileName(uri, realMime), realMime);
                var inspection = await inspectPhotoLocation(named, "gallery", null, null);
                var takenDate = inspection.photoDate || new Date();
                var location = inspection.location;
                console.log("[GILOA EXIF DEBUG native]", {
                    uri: describeNativePhotoUri(uri),
                    mimeType: originalBlob.type || "",
                    size: originalBlob.size,
                    exifGps: inspection.gps,
                    locationSource: location && location.source || "unknown"
                });
                var displayFile = await convertHeicToJpegFile(named);
                var img = await loadImageFromFile(displayFile);
                var importedPhoto = await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                    deferUi: true,
                    openPopup: list.length === 1,
                    originalBlob: originalBlob,
                    sourceUri: uri,
                    sourceType: "gallery",
                    locationSource: location ? location.source : "unknown",
                    locationAccuracy: location ? location.accuracy : null,
                    deferImageAnalysis: true
                });
                if (importedPhoto) {
                    loadedCount += 1;
                    if (isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) lastLocatedPhoto = importedPhoto;
                }
            } catch (error) {
                failedCount += 1;
                console.warn("네이티브 사진 처리 실패", error);
            }
        }
    } finally {
        hidePhotoImportProgress();
        clearNativePhotoUris();
        syncRecordingUI();
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (lastLocatedPhoto) focusPhotoOnMap(lastLocatedPhoto);
    }
    if (failedCount > 0) showCollectionToast(earlyUiText("photoFailed", { count:failedCount }));
}
window.onGiloaPhotosPicked = function(payload) {
    var uris = [];
    try { uris = typeof payload === "string" ? JSON.parse(payload || "[]") : (payload || []); }
    catch (_) { uris = []; }
    if (giloaExifDiagnosticPending) {
        giloaExifDiagnosticPending = false;
        clearNativePhotoUris();
        if (uris.length) giloaDiagnoseNativeUri(uris[0]);
        return;
    }
    importPhotosFromNativeUris(uris);
};
async function triggerGallery() {
    closePhotoMenu();
    await requestPhotoLocationPermission();
    // The system photo picker (used by Capacitor Camera and by <input type=file>)
    // always returns zeroed GPS values, so the native ACTION_OPEN_DOCUMENT bridge
    // is preferred whenever the APK provides it.
    if (hasNativePhotoPicker()) {
        try { window.GiloaPhotoBridge.pickPhotos(); return; }
        catch (error) { console.warn("네이티브 사진 선택 실패, 기본 경로로 대체합니다", error); }
    }
    var Camera = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
    if (Camera && (typeof Camera.pickImages === "function" || typeof Camera.getPhoto === "function")) {
        try {
            if (Camera && typeof Camera.pickImages === "function") {
                var picked = await Camera.pickImages({ quality: 95, limit: 20 });
                var list = picked && Array.isArray(picked.photos) ? picked.photos : [];
                if (!list.length) return;
                var lastLocatedPhoto = null;
                for (var i = 0; i < list.length; i++) {
                    await showPhotoImportProgress(i + 1, list.length);
                    var one = list[i];
                    var nativeUri = consumeNativePhotoUri(i);
                    var oneUrl = one.webPath || one.path || one.uri || "";
                    var oneBlob = await getOriginalPhotoBlob(nativeUri, one);
                    var oneInspection = await inspectPhotoLocation(oneBlob || one, "gallery", null, null);
                    var oneDate = oneInspection.photoDate || new Date();
                    var oneLocation = oneInspection.location;
                    var imgOne = await loadImageFromUrl(oneUrl);
                    var importedPhoto = await processPhoto(imgOne, oneDate, oneLocation && oneLocation.lat, oneLocation && oneLocation.lng, {
                        deferUi: true,
                        openPopup: list.length === 1,
                        originalBlob: oneBlob,
                        originalUrl: oneUrl,
                        sourceUri: nativeUri || one.path || one.webPath || "",
                        sourceWebPath: one.webPath || "",
                        sourceType: "gallery",
                        locationSource: oneLocation ? oneLocation.source : "unknown",
                        locationAccuracy: oneLocation ? oneLocation.accuracy : null
                    });
                    if (importedPhoto && isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) lastLocatedPhoto = importedPhoto;
                }
                updateStats();
                scheduleSave();
                updatePhotoList();
                if (lastLocatedPhoto) focusPhotoOnMap(lastLocatedPhoto);
                syncRecordingUI();
                return;
            }
            var single = await Camera.getPhoto({ quality: 95, resultType: "uri", source: "PHOTOS" });
            await showPhotoImportProgress(1, 1);
            var singleUrl = single.webPath || single.path || single.uri || "";
            // Capacitor may expose a display-only webPath whose EXIF has already
            // been stripped. Prefer the original path/URI bytes, as the multi-
            // select flow does, before falling back to the preview URL.
            var singleBlob = await getOriginalPhotoBlob("", single) || await fetchBlobFromUrl(singleUrl).catch(function() { return null; });
            var singleInspection = await inspectPhotoLocation(singleBlob || single, "gallery", null, null);
            var singleDate = singleInspection.photoDate || new Date();
            var singleLocation = singleInspection.location;
            var img = await loadImageFromUrl(singleUrl);
            var importedSingle = await processPhoto(img, singleDate, singleLocation && singleLocation.lat, singleLocation && singleLocation.lng, {
                originalBlob: singleBlob,
                originalUrl: singleUrl,
                sourceUri: single.path || single.webPath || "",
                sourceWebPath: single.webPath || "",
                sourceType: "gallery",
                locationSource: singleLocation ? singleLocation.source : "unknown",
                locationAccuracy: singleLocation ? singleLocation.accuracy : null
            });
            if (importedSingle && isValidPhotoCoordinate(importedSingle.lat, importedSingle.lng)) focusPhotoOnMap(importedSingle);
            return;
        } catch (e) {
            console.warn("갤러리 불러오기 실패", e);
        } finally {
            hidePhotoImportProgress();
        }
    }
    document.getElementById("gallery-input").click();
}
async function openPhotoInGallery(data) {
    if (!data) return;
    var bridge = window.GiloaPhotoBridge;
    var browserWindow = !bridge ? window.open("", "_blank") : null;
    try {
        var stored = data.id ? await idbGetPhoto(data.id).catch(function() { return null; }) : null;
        var sourceUri = data.sourceUri || data.sourceWebPath || data.remotePhotoUrl || "";
        if (bridge && typeof bridge.openPhoto === "function" && sourceUri) {
            if (bridge.openPhoto(sourceUri)) return;
        }
        var fullImage = stored && stored.originalBlob ? stored.originalBlob : (stored && stored.photo) || data.photo || data.remotePhotoUrl || data.thumb || "";
        if (bridge && typeof bridge.openPhotoData === "function" && fullImage) {
            var fullDataUrl = typeof fullImage === "string" ? fullImage : await blobToDataUrl(fullImage);
            if (bridge.openPhotoData(fullDataUrl, data.id || "photo")) return;
        }
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            var plugins = window.Capacitor.Plugins || {};
            if (sourceUri && plugins.Browser && typeof plugins.Browser.open === "function") {
                if (browserWindow) browserWindow.close();
                await plugins.Browser.open({ url: sourceUri });
                return;
            }
        }
        if (!fullImage && sourceUri) fullImage = sourceUri;
        if (!fullImage) throw new Error("No photo source");
        var objectUrlCreated = false;
        var externalUrl;
        if (typeof fullImage === "string" && fullImage.indexOf("data:image/") === 0) {
            externalUrl = URL.createObjectURL(dataUrlToBlob(fullImage));
            objectUrlCreated = true;
        } else if (typeof fullImage === "string") externalUrl = fullImage;
        else {
            externalUrl = URL.createObjectURL(fullImage);
            objectUrlCreated = true;
        }
        if (browserWindow) browserWindow.location.href = externalUrl;
        else window.open(externalUrl, "_blank");
        if (objectUrlCreated) setTimeout(function() { URL.revokeObjectURL(externalUrl); }, 60000);
    } catch (e) {
        if (browserWindow) browserWindow.close();
        console.warn("사진 외부 열기 실패", e);
        alert(earlyUiText("photoOpenFailed"));
    }
}
function getPhotoInteractionText() {
    var all = {
        ko: {
            mapView: "지도에서 촬영 위치 보기",
            importProgress: "사진을 지도에 붙이는 중 {current}/{total}",
            locationUnavailable: "이 사진의 촬영 위치를 확인할 수 없습니다.",
            originalOpen: "원본 사진을 휴대폰 앱에서 열기",
            originalHint: "지도 사진을 누르면 휴대폰의 원본을 엽니다.",
            mapLocation: "이전 버전에서 저장된 위치",
            exifLocation: "사진 촬영 위치",
            routeLocation: "이동 기록으로 위치 추정",
            currentLocation: "촬영 당시 현재 위치",
            manualLocation: "직접 지정한 위치",
            unknownLocation: "위치 정보 없음",
            chooseTitle: "이 사진의 촬영 위치를 찾지 못했어요.",
            chooseDescription: "촬영 위치를 직접 지정하거나 위치 없이 보관할 수 있어요.",
            chooseMap: "지도에서 위치 선택",
            chooseCurrent: "현재 위치 사용",
            currentUnavailable: "현재 위치를 확인할 수 없습니다. 지도에서 선택하거나 위치 없이 보관해 주세요.",
            keepWithout: "위치 없이 보관",
            cancel: "취소",
            tapMap: "지도에서 사진을 촬영한 위치를 눌러 주세요.",
            stopPicking: "위치 선택 취소",
            assignLocation: "촬영 위치 지정",
            memoPlaceholder: "왜 이 사진을 남겼나요?",
            memoSave: "메모 저장",
            memoSaved: "사진 메모를 저장했습니다.",
            deletePhoto: "사진 삭제",
            photoAnalysis: "사진 분석",
            analysisAccepted: "인식 성공",
            analysisRetry: "다시 찍어보세요",
            emptyPhotos: "아직 저장된 사진이 없습니다.",
            photoAlt: "여행 사진",
            locationNeeded: "촬영 위치 확인 필요",
            locationRestored: "사진 촬영 위치를 복구했어요.",
            rereadLocation: "사진 위치 다시 읽기",
            rereadFailed: "사진에서 GPS 정보를 찾지 못했어요.",
            originalMissing: "원본 사진이 없어 위치를 다시 읽을 수 없어요."
        },
        en: {
            mapView: "Show where this photo was taken",
            importProgress: "Adding photos to the map {current}/{total}",
            locationUnavailable: "This photo does not have a usable location.",
            originalOpen: "Open the original photo on this device",
            originalHint: "Tap the map photo to open the original on this device.",
            mapLocation: "Location saved by an earlier version",
            exifLocation: "Photo capture location",
            routeLocation: "Estimated from your travel route",
            currentLocation: "Current location when captured",
            manualLocation: "Location selected manually",
            unknownLocation: "No location information",
            chooseTitle: "We couldn't find where this photo was taken.",
            chooseDescription: "Choose a place on the map or keep the photo without a location.",
            chooseMap: "Choose on map",
            chooseCurrent: "Use current location",
            currentUnavailable: "Current location is unavailable. Choose on the map or keep the photo without a location.",
            keepWithout: "Keep without location",
            cancel: "Cancel",
            tapMap: "Tap the place where this photo was taken.",
            stopPicking: "Stop choosing",
            assignLocation: "Set capture location",
            memoPlaceholder: "Why are you keeping this photo?",
            memoSave: "Save note",
            memoSaved: "Photo note saved.",
            deletePhoto: "Delete photo",
            photoAnalysis: "Photo analysis",
            analysisAccepted: "Recognized",
            analysisRetry: "Try another photo",
            emptyPhotos: "No saved photos yet.",
            photoAlt: "Travel photo",
            locationNeeded: "Location needed",
            locationRestored: "Photo location restored.",
            rereadLocation: "Re-read photo location",
            rereadFailed: "No GPS data was found in this photo.",
            originalMissing: "The original file is unavailable, so the location cannot be re-read."
        },
        ja: {
            mapView: "写真の撮影場所を地図で見る",
            importProgress: "写真を地図に追加中 {current}/{total}",
            locationUnavailable: "この写真の撮影場所を確認できません。",
            originalOpen: "端末で元の写真を開く",
            originalHint: "地図上の写真をタップすると端末の元画像を開きます。",
            mapLocation: "以前のバージョンで保存された位置",
            exifLocation: "写真の撮影位置",
            routeLocation: "移動記録から位置を推定",
            currentLocation: "撮影時の現在位置",
            manualLocation: "手動で指定した位置",
            unknownLocation: "位置情報なし",
            chooseTitle: "この写真の撮影場所が見つかりませんでした。",
            chooseDescription: "地図で場所を指定するか、位置情報なしで保存できます。",
            chooseMap: "地図で位置を選ぶ",
            chooseCurrent: "現在地を使用",
            currentUnavailable: "現在地を確認できません。地図で選ぶか、位置情報なしで保存してください。",
            keepWithout: "位置情報なしで保存",
            cancel: "キャンセル",
            tapMap: "写真を撮影した場所を地図でタップしてください。",
            stopPicking: "位置選択をやめる",
            assignLocation: "撮影位置を指定",
            memoPlaceholder: "この写真を残した理由は？",
            memoSave: "メモを保存",
            memoSaved: "写真のメモを保存しました。",
            deletePhoto: "写真を削除",
            photoAnalysis: "写真を分析",
            analysisAccepted: "認識成功",
            analysisRetry: "もう一度撮ってみよう",
            emptyPhotos: "保存した写真はまだありません。",
            photoAlt: "旅の写真",
            locationNeeded: "撮影場所の確認が必要",
            locationRestored: "写真の撮影位置を復元しました。",
            rereadLocation: "撮影位置を再読み込み",
            rereadFailed: "この写真からGPS情報を見つけられませんでした。",
            originalMissing: "元の写真がないため位置を再読み込みできません。"
        },
        zh: {
            mapView: "在地图上查看拍摄位置",
            importProgress: "正在将照片添加到地图 {current}/{total}",
            locationUnavailable: "无法确认这张照片的拍摄位置。",
            originalOpen: "在手机中打开原始照片",
            originalHint: "点击地图上的照片即可打开手机中的原图。",
            mapLocation: "旧版本保存的位置",
            exifLocation: "照片拍摄位置",
            routeLocation: "根据移动记录推测位置",
            currentLocation: "拍摄时的当前位置",
            manualLocation: "手动指定的位置",
            unknownLocation: "无位置信息",
            chooseTitle: "未能找到这张照片的拍摄位置。",
            chooseDescription: "可以在地图上指定位置，或不带位置保存。",
            chooseMap: "在地图上选择位置",
            chooseCurrent: "使用当前位置",
            currentUnavailable: "无法获取当前位置。请在地图上选择，或不带位置保存。",
            keepWithout: "不带位置保存",
            cancel: "取消",
            tapMap: "请在地图上点击照片的拍摄位置。",
            stopPicking: "取消位置选择",
            assignLocation: "设置拍摄位置",
            memoPlaceholder: "为什么留下这张照片？",
            memoSave: "保存备注",
            memoSaved: "照片备注已保存。",
            deletePhoto: "删除照片",
            photoAnalysis: "照片分析",
            analysisAccepted: "识别成功",
            analysisRetry: "请再拍一次",
            emptyPhotos: "尚无已保存的照片。",
            photoAlt: "旅行照片",
            locationNeeded: "需要确认拍摄位置",
            locationRestored: "已恢复照片的拍摄位置。",
            rereadLocation: "重新读取照片位置",
            rereadFailed: "未在照片中找到GPS信息。",
            originalMissing: "没有原图，无法重新读取位置。"
        },
        es: {
            mapView: "Ver en el mapa dónde se tomó esta foto",
            importProgress: "Añadiendo fotos al mapa {current}/{total}",
            locationUnavailable: "Esta foto no tiene una ubicación válida.",
            originalOpen: "Abrir la foto original en este dispositivo",
            originalHint: "Toca la foto del mapa para abrir el original.",
            mapLocation: "Ubicación guardada por una versión anterior",
            exifLocation: "Lugar de captura de la foto",
            routeLocation: "Ubicación estimada desde tu ruta",
            currentLocation: "Ubicación actual al tomarla",
            manualLocation: "Ubicación elegida manualmente",
            unknownLocation: "Sin información de ubicación",
            chooseTitle: "No pudimos encontrar dónde se tomó esta foto.",
            chooseDescription: "Elige un lugar en el mapa o guarda la foto sin ubicación.",
            chooseMap: "Elegir en el mapa",
            chooseCurrent: "Usar ubicación actual",
            currentUnavailable: "No se pudo obtener la ubicación actual. Elige en el mapa o guarda sin ubicación.",
            keepWithout: "Guardar sin ubicación",
            cancel: "Cancelar",
            tapMap: "Toca en el mapa dónde se tomó la foto.",
            stopPicking: "Cancelar selección",
            assignLocation: "Definir lugar de captura",
            memoPlaceholder: "¿Por qué guardas esta foto?",
            memoSave: "Guardar nota",
            memoSaved: "Nota de la foto guardada.",
            deletePhoto: "Eliminar foto",
            photoAnalysis: "Análisis de foto",
            analysisAccepted: "Reconocida",
            analysisRetry: "Inténtalo con otra foto",
            emptyPhotos: "Aún no hay fotos guardadas.",
            photoAlt: "Foto de viaje",
            locationNeeded: "Ubicación necesaria",
            locationRestored: "Se restauró la ubicación de la foto.",
            rereadLocation: "Volver a leer la ubicación",
            rereadFailed: "No se encontraron datos GPS en esta foto.",
            originalMissing: "No hay archivo original, no se puede releer la ubicación."
        },
        fr: {
            mapView: "Voir le lieu de prise de vue sur la carte",
            locationUnavailable: "Cette photo n’a pas de position exploitable.",
            originalOpen: "Ouvrir la photo originale sur cet appareil",
            originalHint: "Touchez la photo sur la carte pour ouvrir l’original.",
            mapLocation: "Position enregistrée par une ancienne version",
            exifLocation: "Lieu de prise de vue",
            routeLocation: "Position estimée depuis votre parcours",
            currentLocation: "Position actuelle au moment de la prise",
            manualLocation: "Position choisie manuellement",
            unknownLocation: "Aucune information de position",
            chooseTitle: "Nous n’avons pas trouvé où cette photo a été prise.",
            chooseDescription: "Choisissez un lieu sur la carte ou conservez la photo sans position.",
            chooseMap: "Choisir sur la carte",
            chooseCurrent: "Utiliser la position actuelle",
            currentUnavailable: "Position actuelle indisponible. Choisissez sur la carte ou conservez sans position.",
            keepWithout: "Conserver sans position",
            cancel: "Annuler",
            tapMap: "Touchez sur la carte le lieu où cette photo a été prise.",
            stopPicking: "Arrêter la sélection",
            assignLocation: "Définir le lieu de prise de vue",
            memoPlaceholder: "Pourquoi garder cette photo ?",
            memoSave: "Enregistrer la note",
            memoSaved: "Note de la photo enregistrée.",
            deletePhoto: "Supprimer la photo",
            photoAnalysis: "Analyse de la photo",
            analysisAccepted: "Reconnaissance réussie",
            analysisRetry: "Essayez une autre photo",
            emptyPhotos: "Aucune photo enregistrée.",
            photoAlt: "Photo de voyage",
            locationNeeded: "Localisation requise",
            locationRestored: "Position de la photo restaurée.",
            rereadLocation: "Relire la position de la photo",
            rereadFailed: "Aucune donnée GPS trouvée dans cette photo.",
            originalMissing: "Fichier original indisponible, impossible de relire la position."
        }
    };
    return all[currentLang] || all.ko;
}
function normalizePhotoLocationSource(source, hasLocation) {
    source = String(source || "").toLowerCase();
    if (source === "gps") source = "current";
    if (source === "exif" || source === "route" || source === "current" || source === "manual") return source;
    if (source === "unknown" || !hasLocation) return "unknown";
    return "unknown";
}
function syncPhotoLocationDialogText() {
    var text = getPhotoInteractionText();
    var title = document.getElementById("photo-location-title");
    var description = document.getElementById("photo-location-description");
    var mapButton = document.getElementById("photo-location-map");
    var currentButton = document.getElementById("photo-location-current");
    var keepButton = document.getElementById("photo-location-keep");
    var cancelButton = document.getElementById("photo-location-cancel");
    var hint = document.getElementById("photo-location-pick-hint");
    var pickCancel = document.getElementById("photo-location-pick-cancel");
    if (title) title.textContent = text.chooseTitle;
    if (description) description.textContent = text.chooseDescription;
    if (mapButton) mapButton.textContent = text.chooseMap;
    if (currentButton) currentButton.textContent = text.chooseCurrent;
    if (keepButton) keepButton.textContent = text.keepWithout;
    if (cancelButton) cancelButton.textContent = text.cancel;
    if (hint) hint.textContent = text.tapMap;
    if (pickCancel) pickCancel.textContent = text.stopPicking;
}
function removePendingPhotoMapClick() {
    if (pendingPhotoMapClickHandler && map && typeof map.off === "function") map.off("click", pendingPhotoMapClickHandler);
    pendingPhotoMapClickHandler = null;
}
function setPhotoLocationPickingMode(picking) {
    var dialog = document.getElementById("photo-location-dialog");
    if (!dialog) return;
    dialog.classList.toggle("is-picking", !!picking);
    var decisionNodes = dialog.querySelectorAll(".photo-location-decision");
    Array.prototype.forEach.call(decisionNodes, function(node) { node.hidden = !!picking; });
    var hint = document.getElementById("photo-location-pick-hint");
    var pickCancel = document.getElementById("photo-location-pick-cancel");
    if (hint) hint.hidden = !picking;
    if (pickCancel) pickCancel.hidden = !picking;
    var card = dialog.querySelector(".photo-location-card");
    if (card) card.setAttribute("aria-modal", picking ? "false" : "true");
}
function closePhotoLocationDialog(result) {
    var pending = pendingPhotoLocationChoice;
    if (!pending) return;
    removePendingPhotoMapClick();
    pendingPhotoLocationChoice = null;
    var dialog = document.getElementById("photo-location-dialog");
    if (dialog) {
        dialog.classList.remove("show", "is-picking");
        dialog.setAttribute("aria-hidden", "true");
    }
    setPhotoLocationPickingMode(false);
    pending.resolve(result);
}
function requestMissingPhotoLocation(data, options) {
    options = options || {};
    if (!data) return Promise.resolve("cancel");
    if (pendingPhotoLocationChoice) return Promise.resolve("cancel");
    syncPhotoLocationDialogText();
    var dialog = document.getElementById("photo-location-dialog");
    if (!dialog) return Promise.resolve("unknown");
    var currentButton = document.getElementById("photo-location-current");
    if (currentButton) currentButton.disabled = false;
    return new Promise(function(resolve) {
        pendingPhotoLocationChoice = { photo: data, isNewImport: !!options.isNewImport, resolve: resolve };
        setPhotoLocationPickingMode(false);
        dialog.classList.add("show");
        dialog.setAttribute("aria-hidden", "false");
        setTimeout(function() {
            var first = document.getElementById("photo-location-map");
            if (first && typeof first.focus === "function") first.focus();
        }, 0);
    });
}
function beginPhotoLocationMapPick() {
    if (!pendingPhotoLocationChoice) return;
    removePendingPhotoMapClick();
    closePhotoMenu();
    toggleSidebar(false);
    setPhotoLocationPickingMode(true);
    pendingPhotoMapClickHandler = function(event) {
        var latlng = event && event.latlng;
        var pending = pendingPhotoLocationChoice;
        if (!pending || !latlng || !isValidPhotoCoordinate(latlng.lat, latlng.lng)) return;
        pending.photo.lat = Number(latlng.lat);
        pending.photo.lng = Number(latlng.lng);
        pending.photo.locationSource = "manual";
        pending.photo.locationAccuracy = null;
        createPhotoMarker(pending.photo, false);
        updatePhotoList();
        scheduleSave();
        closePhotoLocationDialog("manual");
    };
    setTimeout(function() {
        if (pendingPhotoMapClickHandler && pendingPhotoLocationChoice) map.once("click", pendingPhotoMapClickHandler);
    }, 40);
}
function stopPhotoLocationMapPick() {
    if (!pendingPhotoLocationChoice) return;
    removePendingPhotoMapClick();
    setPhotoLocationPickingMode(false);
    var first = document.getElementById("photo-location-map");
    if (first && typeof first.focus === "function") first.focus();
}
async function useCurrentPhotoLocation() {
    if (!pendingPhotoLocationChoice) return;
    var button = document.getElementById("photo-location-current");
    var description = document.getElementById("photo-location-description");
    if (button) button.disabled = true;
    var location = await getCurrentPhotoLocation().catch(function() { return null; });
    if (!pendingPhotoLocationChoice) return;
    if (!location || !isValidPhotoCoordinate(location.lat, location.lng)) {
        if (button) button.disabled = false;
        if (description) description.textContent = getPhotoInteractionText().currentUnavailable;
        return;
    }
    pendingPhotoLocationChoice.photo.lat = Number(location.lat);
    pendingPhotoLocationChoice.photo.lng = Number(location.lng);
    pendingPhotoLocationChoice.photo.locationSource = "current";
    pendingPhotoLocationChoice.photo.locationAccuracy = isFinite(location.accuracy) ? Number(location.accuracy) : null;
    closePhotoLocationDialog("current");
}
function keepPhotoWithoutLocation() {
    if (!pendingPhotoLocationChoice) return;
    pendingPhotoLocationChoice.photo.lat = null;
    pendingPhotoLocationChoice.photo.lng = null;
    pendingPhotoLocationChoice.photo.locationSource = "unknown";
    pendingPhotoLocationChoice.photo.locationAccuracy = null;
    closePhotoLocationDialog("unknown");
}
function cancelPhotoLocationChoice() { closePhotoLocationDialog("cancel"); }
function focusPhotoOnMap(data) {
    var photoText = getPhotoInteractionText();
    if (!data || !isValidPhotoCoordinate(data.lat, data.lng)) {
        if (data) {
            // Try to recover the real capture location before asking the user.
            // The current position must never be stamped onto an old photo.
            recoverPhotoLocationFromExif(data).then(function(restored) {
                if (restored) {
                    persistState();
                    updatePhotoList();
                    showCollectionToast(getPhotoInteractionText().locationRestored);
                    focusPhotoOnMap(data);
                    return;
                }
                requestMissingPhotoLocation(data, { isNewImport: false }).then(function(result) {
                    if (result === "manual") focusPhotoOnMap(data);
                });
            });
        } else alert(photoText.locationUnavailable);
        return;
    }
    var lat = Number(data.lat);
    var lng = Number(data.lng);
    toggleSidebar(false);
    setSelectedDestination(lat, lng, earlyMemoryDateText(data, true) || photoText.mapView);
    map.whenReady(function() {
        var markerLayer = findPhotoMarker(data.id);
        // A marker depends on coordinates only. Missing thumbnails must never hide a memory.
        if (!markerLayer) markerLayer = createPhotoMarker(data, false);
        var revealFinished = false;
        var revealPhoto = function() {
            if (revealFinished) return;
            revealFinished = true;
            map.off("moveend", revealPhoto);
            if (!markerLayer) return;
            if (photoClusterGroup && typeof photoClusterGroup.zoomToShowLayer === "function") {
                photoClusterGroup.zoomToShowLayer(markerLayer, function() { markerLayer.openPopup(); });
            } else {
                markerLayer.openPopup();
            }
        };
        map.once("moveend", revealPhoto);
        map.flyTo([lat, lng], Math.min(17, map.getMaxZoom()), { animate: true, duration: 0.65 });
        setTimeout(revealPhoto, 1000);
    });
}
function canUseScreenWakeLock() { return !!(navigator.wakeLock && typeof navigator.wakeLock.request === "function"); }
function requestNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.keepScreenOnFor === "function") window.GiloaScreenAwake.keepScreenOnFor(SCREEN_AWAKE_MS); } catch (e) { console.warn("네이티브 화면 켜짐 유지 실패", e); } }
function releaseNativeScreenAwake() { try { if (window.GiloaScreenAwake && typeof window.GiloaScreenAwake.clearKeepScreenOn === "function") window.GiloaScreenAwake.clearKeepScreenOn(); } catch (e) { console.warn("네이티브 화면 켜짐 유지 해제 실패", e); } }
async function requestScreenAwake() {
    screenAwakeUntil = Date.now() + SCREEN_AWAKE_MS;
    requestNativeScreenAwake();
    if (screenWakeLockTimer) clearTimeout(screenWakeLockTimer);
    screenWakeLockTimer = setTimeout(releaseScreenAwake, SCREEN_AWAKE_MS);
    if (!canUseScreenWakeLock() || document.visibilityState !== "visible") return;
    try {
        if (screenWakeLock && !screenWakeLock.released) return;
        screenWakeLock = await navigator.wakeLock.request("screen");
        screenWakeLock.addEventListener("release", function() {
            screenWakeLock = null;
            if (isRecording && Date.now() < screenAwakeUntil && document.visibilityState === "visible") {
                setTimeout(requestScreenAwake, 500);
            }
        });
    } catch (e) { console.warn("화면 켜짐 유지 실패", e); }
}
function releaseScreenAwake() {
    screenAwakeUntil = 0;
    releaseNativeScreenAwake();
    if (screenWakeLockTimer) { clearTimeout(screenWakeLockTimer); screenWakeLockTimer = null; }
    var lock = screenWakeLock;
    screenWakeLock = null;
    if (lock && !lock.released) lock.release().catch(function(e) { console.warn("화면 켜짐 유지 해제 실패", e); });
}
document.addEventListener("visibilitychange", function() {
    if (isRecording && Date.now() < screenAwakeUntil && document.visibilityState === "visible") requestScreenAwake();
});
function clearAutoRecordingTimer() {
    if (autoRecordingTimer) { clearTimeout(autoRecordingTimer); autoRecordingTimer = null; }
}
function clearTrackingRetryTimer() {
    if (trackingRetryTimer) { clearTimeout(trackingRetryTimer); trackingRetryTimer = null; }
}
function startAutoRecordingTimer() {
    clearAutoRecordingTimer();
    autoRecordingTimer = setTimeout(function() {
        autoRecordingTimer = null;
        if (isRecording) stopRecording();
    }, AUTO_RECORDING_MS);
}
function createRecordingSessionId(startedAt) {
    return "session:" + Number(startedAt || Date.now()) + ":" + Math.random().toString(36).slice(2, 10);
}
function ensureRecordingSession() {
    if (!recordingSessionId) {
        recordingSessionStartedAt = Date.now();
        recordingSessionId = createRecordingSessionId(recordingSessionStartedAt);
    }
    return recordingSessionId;
}
function stopRecording() {
    isRecording = false;
    clearAutoRecordingTimer();
    clearTrackingRetryTimer();
    releaseScreenAwake();
    syncRecordingUI();
    stopTracking();
    recordingSessionId = null;
    recordingSessionStartedAt = 0;
    compactPathData();
    scheduleSave();
}
function resetRecordingState() { stopRecording(); }
// 현재 위치 재동기화
// 예전에는 currentPos 가 한 번이라도 잡히면 그 값으로 panTo 만 하고 끝났다.
// 그래서 처음 들어온 부정확한 좌표(Wi-Fi/기지국 기반)가 계속 남아 실제 위치와
// 어긋난 채 고정됐다. 이제 버튼을 누를 때마다 새 측위를 강제로 다시 받는다.
const POSITION_STALE_MS = 30000;      // 이 시간이 지난 좌표는 정확도와 무관하게 교체
const POSITION_WORSE_FACTOR = 3;      // 기존 대비 3배 넘게 나빠지면 무시
const POSITION_WORSE_FLOOR_M = 100;   // 단, 100m 이내면 그냥 받아들인다
const RESYNC_TARGET_ACCURACY_M = 20;  // 이 정확도에 도달하면 즉시 종료
const RESYNC_DURATION_MS = 9000;      // 최대 대기 시간

function shouldIgnorePositionSample(accuracy, timestamp) {
    if (!currentPos || !isFinite(currentAccuracy)) return false;
    if (timestamp - currentPositionTimestamp > POSITION_STALE_MS) return false;
    if (accuracy <= POSITION_WORSE_FLOOR_M) return false;
    return accuracy > currentAccuracy * POSITION_WORSE_FACTOR;
}


function showLocationToast(message, holdMs) {
    var toast = document.getElementById("giloa-location-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "giloa-location-toast";
        toast.className = "giloa-location-toast";
        document.body.appendChild(toast);
    }
    if (toast._hideTimer) { clearTimeout(toast._hideTimer); toast._hideTimer = null; }
    if (!message) { toast.classList.remove("show"); return; }
    toast.textContent = message;
    toast.classList.add("show");
    if (holdMs) toast._hideTimer = setTimeout(function() { toast.classList.remove("show"); toast._hideTimer = null; }, holdMs);
}

// 한 번의 getCurrentPosition 은 캐시된 거친 좌표를 돌려주는 일이 잦다.
// 몇 초간 표본을 모아 가장 정확한 것을 고른다.
function acquireBestPosition(options) {
    options = options || {};
    var durationMs = options.durationMs || RESYNC_DURATION_MS;
    var target = options.targetAccuracy || RESYNC_TARGET_ACCURACY_M;
    return new Promise(function(resolve, reject) {
        if (!navigator.geolocation) { reject(new Error("Geolocation unavailable")); return; }
        var best = null, watch = null, timer = null, settled = false;
        function accuracyOf(position) { return Number(position && position.coords && position.coords.accuracy) || Infinity; }
        function finish(error) {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            if (watch !== null) { try { navigator.geolocation.clearWatch(watch); } catch (e) {} }
            if (best) resolve(best); else reject(error || new Error("No position fix"));
        }
        function onSample(position) {
            if (settled) return;
            if (accuracyOf(position) >= accuracyOf(best)) return;
            best = position;
            if (typeof options.onImproved === "function") options.onImproved(position);
            if (accuracyOf(position) <= target) finish();
        }
        timer = setTimeout(function() { finish(); }, durationMs);
        try {
            watch = navigator.geolocation.watchPosition(onSample, function(error) { if (!best) finish(error); }, { enableHighAccuracy: true, maximumAge: 0, timeout: durationMs });
        } catch (e) { /* 워치가 실패해도 아래 단발 호출로 시도한다 */ }
        navigator.geolocation.getCurrentPosition(onSample, function(error) { if (!best && watch === null) finish(error); }, { enableHighAccuracy: true, maximumAge: 0, timeout: durationMs });
    });
}

var locationResyncPending = false;
var locationResyncPromise = null;
var startupLocationRequested = false;
function focusStartupLocation() {
    // Restore saved journeys and finish language selection before requesting GPS.
    // This is a one-time map lookup per launch; recording keeps its own consent flow.
    if (startupLocationRequested || !giloaPersistentStateReady ||
        !hasSavedIntroLanguage() || localStorage.getItem(INTRO_STORY_SEEN_KEY) !== "true") {
        return Promise.resolve(false);
    }
    startupLocationRequested = true;
    return Promise.resolve().then(function() {
        return requestLocationPermission();
    }).then(function() {
        return focusCurrentLocation();
    }).catch(function() {
        showLocationToast(earlyUiText("locationFailed"), 4000);
        return false;
    });
}
function getDisplayedCurrentPosition() {
    if (playerMarker && typeof playerMarker.getLatLng === "function") return playerMarker.getLatLng();
    return currentPos;
}
function hasValidCurrentLocation() {
    var position = getDisplayedCurrentPosition();
    if (!position) return false;
    var lat = Number(position.lat);
    var lng = Number(position.lng);
    return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}
window.hasValidCurrentLocation = hasValidCurrentLocation;
function focusCurrentLocation() {
    var displayedPosition = getDisplayedCurrentPosition();
    if (displayedPosition) map.panTo(displayedPosition); // 먼저 반응부터 보여준다
    if (!navigator.geolocation) return Promise.resolve(false);
    // Startup, the location button and tutorial must await the same GPS result.
    if (locationResyncPending) return locationResyncPromise;
    locationResyncPending = true;
    showLocationToast(earlyUiText("locating"));
    locationResyncPromise = acquireBestPosition({
        onImproved: function(position) {
            handlePosition(position, { force: true });   // 더 정확한 값이 올 때마다 마커를 옮긴다
            var improvedPosition = getDisplayedCurrentPosition();
            if (improvedPosition) map.panTo(improvedPosition, { animate: true });
        }
    }).then(function(position) {
        handlePosition(position, { force: true });
        var accuracy = Math.round(Number(position.coords.accuracy) || 0);
        var finalPosition = getDisplayedCurrentPosition();
        if (finalPosition) map.setView(finalPosition, Math.max(map.getZoom(), 16));
        if (accuracy > POSITION_WORSE_FLOOR_M) showLocationToast(earlyUiText("locationImprecise", { accuracy:accuracy }), 5000);
        else showLocationToast(earlyUiText("locationUpdated", { accuracy:accuracy }), 2200);
        return true;
    }).catch(function(error) {
        showLocationToast(earlyUiText("locationFailed"), 4000);
        if (typeof window.onGiloaTutorialLocationError === "function") window.onGiloaTutorialLocationError(error);
        return false;
    }).then(function(result) {
        locationResyncPending = false;
        locationResyncPromise = null;
        if (trackingRequested || isRecording) startForegroundTracking();   // 워치를 새로 걸어 캐시된 좌표를 버린다
        return result;
    });
    return locationResyncPromise;
}
function normalizeHeading(value) { return (Number(value) % 360 + 360) % 360; }
function screenOrientationAngle() {
    if (screen.orientation && isFinite(screen.orientation.angle)) return Number(screen.orientation.angle);
    return isFinite(window.orientation) ? Number(window.orientation) : 0;
}
var deviceHeadingRenderTimer = null;
var deviceHeadingLastRenderTime = -Infinity;
var deviceHeadingLastRendered = null;
function renderDeviceHeading() {
    deviceHeadingRenderTimer = null;
    if (!currentPos || typeof playerHeading !== "number" || !isFinite(playerHeading)) return;
    if (deviceHeadingLastRendered !== null && Math.abs((playerHeading - deviceHeadingLastRendered + 540) % 360 - 180) < 1) return;
    updateVisionCone(currentPos);
}
function handleDeviceHeading(event) {
    var heading = event && typeof event.webkitCompassHeading === "number" ? event.webkitCompassHeading : NaN;
    if (!isFinite(heading) && event && event.absolute && typeof event.alpha === "number" && isFinite(event.alpha)) {
        heading = 360 - Number(event.alpha) + screenOrientationAngle();
    }
    if (!isFinite(heading)) return;
    playerHeading = normalizeHeading(heading);
    // Keep the shared heading current for photos; only throttle fog repainting.
    if (!currentPos || deviceHeadingRenderTimer !== null) return;
    if (deviceHeadingLastRendered !== null && Math.abs((playerHeading - deviceHeadingLastRendered + 540) % 360 - 180) < 1) return;
    var delay = 80 - (performance.now() - deviceHeadingLastRenderTime);
    if (delay <= 0) renderDeviceHeading();
    else deviceHeadingRenderTimer = setTimeout(renderDeviceHeading, delay);
}
function enableDeviceHeading() {
    var orientation = window.DeviceOrientationEvent;
    if (!orientation) return Promise.resolve(false);
    var attach = function() {
        window.removeEventListener("deviceorientationabsolute", handleDeviceHeading, true);
        window.removeEventListener("deviceorientation", handleDeviceHeading, true);
        window.addEventListener("deviceorientationabsolute", handleDeviceHeading, true);
        window.addEventListener("deviceorientation", handleDeviceHeading, true);
        return true;
    };
    if (typeof orientation.requestPermission !== "function") return Promise.resolve(attach());
    return orientation.requestPermission().then(function(result) { return result === "granted" ? attach() : false; }).catch(function() { return false; });
}
function toggleRecording() {
    if (!giloaPersistentStateReady) {
        pendingRecordingStartAfterRestore = true;

        showLocationToast(
            earlyUiText("restoringBeforeRecord"),
            1800
        );

        return;
    }

    pendingRecordingStartAfterRestore = false;
    if (isRecording) { stopRecording(); return; }
    focusCurrentLocation();
    ensureRecordingSession();
    isRecording = true;
    enableDeviceHeading();
    requestScreenAwake();
    startAutoRecordingTimer();
    syncRecordingUI();
    startTracking();
    scheduleSave();

window.dispatchEvent(
    new Event("giloa:recording-started")
);
}
function dismissAutoRecordingNotice() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
}
var LOCATION_RECORDING_DISCLOSURE_TEXT = {
    ko: {
        title: "위치 기록을 시작할까요?",
        copy: "길로아는 사용자가 걸은 길을 지도에 기록하기 위해 위치정보를 사용합니다.",
        background: "기록을 시작하면 화면이 꺼지거나 다른 앱을 사용하는 동안에도 최대 8시간 동안 위치정보가 계속 기록됩니다.",
        privacy: "위치 기록은 이 기기에만 저장되며 서버나 제3자에게 전송되지 않습니다. 오른쪽 아래 기록 버튼이나 Android 알림에서 언제든지 기록을 중단할 수 있습니다.",
        start: "8시간 기록 시작",
        cancel: "나중에"
    },

    en: {
        title: "Start location recording?",
        copy: "GILOA uses your location to save the path you walk on your map.",
        background: "After you start recording, your location will continue to be recorded for up to 8 hours while the screen is off or while you use another app.",
        privacy: "Location records are stored only on this device and are not sent to a server or shared with third parties. You can stop recording at any time using the record button or the Android notification.",
        start: "Start 8-hour recording",
        cancel: "Not now"
    },

    ja: {
        title: "位置記録を開始しますか？",
        copy: "GILOAは、歩いた道を地図に記録するために位置情報を使用します。",
        background: "記録を開始すると、画面が消えている間や他のアプリを使用している間も、最大8時間位置情報の記録が続きます。",
        privacy: "位置記録はこの端末内だけに保存され、サーバーや第三者には送信されません。画面右下の記録ボタンまたはAndroidの通知から、いつでも記録を停止できます。",
        start: "8時間の記録を開始",
        cancel: "後で"
    },

    zh: {
        title: "开始记录位置吗？",
        copy: "GILOA使用你的位置信息，在地图上记录你走过的路线。",
        background: "开始记录后，即使屏幕关闭或正在使用其他应用，位置信息也会继续记录，最长为8小时。",
        privacy: "位置记录仅保存在此设备上，不会发送到服务器或提供给第三方。你可以随时通过右下角的记录按钮或Android通知停止记录。",
        start: "开始8小时记录",
        cancel: "暂不"
    },

    es: {
        title: "¿Quieres iniciar el registro de ubicación?",
        copy: "GILOA utiliza tu ubicación para guardar en el mapa el camino que recorres.",
        background: "Después de iniciar el registro, tu ubicación continuará registrándose durante un máximo de 8 horas aunque la pantalla esté apagada o utilices otra aplicación.",
        privacy: "Los registros de ubicación se guardan únicamente en este dispositivo y no se envían a ningún servidor ni se comparten con terceros. Puedes detener el registro en cualquier momento mediante el botón de grabación o la notificación de Android.",
        start: "Iniciar registro de 8 horas",
        cancel: "Ahora no"
    },

    fr: {
        title: "Démarrer l’enregistrement de la position ?",
        copy: "GILOA utilise votre position pour enregistrer sur la carte le chemin que vous parcourez.",
        background: "Après le démarrage, votre position continuera à être enregistrée pendant 8 heures maximum, même lorsque l’écran est éteint ou que vous utilisez une autre application.",
        privacy: "Les données de position sont enregistrées uniquement sur cet appareil. Elles ne sont ni envoyées à un serveur ni partagées avec des tiers. Vous pouvez arrêter l’enregistrement à tout moment avec le bouton situé en bas à droite ou depuis la notification Android.",
        start: "Démarrer l’enregistrement de 8 heures",
        cancel: "Plus tard"
    }
};
function startRecordingAfterDisclosure() {
    dismissAutoRecordingNotice();

    Promise.resolve(requestLocationPermission())
        .then(function() {
            if (!isRecording) {
                toggleRecording();
            }
        })
        .catch(function(error) {
            console.warn(
                "Location permission request failed",
                error
            );

            showLocationToast(
                earlyUiText("locationPermission"),
                3500
            );
        });
}
function applyAutoRecordingNoticeLang() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        return;
    }

    var text =
        LOCATION_RECORDING_DISCLOSURE_TEXT[currentLang] ||
        LOCATION_RECORDING_DISCLOSURE_TEXT.ko;

    var box =
        overlay.querySelector(".auto-recording-box");

    var closeButton =
        overlay.querySelector(".auto-recording-close");

    var title =
        overlay.querySelector(".auto-recording-title");

    var copy =
        overlay.querySelector(".auto-recording-copy");

    var background =
        overlay.querySelector(".auto-recording-background");

    var privacy =
        overlay.querySelector(".auto-recording-privacy");

    var startButton =
        overlay.querySelector(".auto-recording-start");

    var cancelButton =
        overlay.querySelector(".auto-recording-cancel");

    if (box) {
        box.setAttribute("aria-label", text.title);
    }

    if (closeButton) {
        closeButton.setAttribute(
            "aria-label",
            text.cancel
        );
    }

    if (title) {
        title.textContent = text.title;
    }

    if (copy) {
        copy.textContent = text.copy;
    }

    if (background) {
        background.textContent = text.background;
    }

    if (privacy) {
        privacy.textContent = text.privacy;
    }

    if (startButton) {
        startButton.textContent = text.start;
    }

    if (cancelButton) {
        cancelButton.textContent = text.cancel;
    }
}
function showAutoRecordingNotice() {
    var overlay =
        document.getElementById("auto-recording-notice");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "auto-recording-notice";
        overlay.setAttribute("aria-hidden", "true");

        var box = document.createElement("div");
        box.className = "auto-recording-box";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");

        var closeButton = document.createElement("button");
        closeButton.className = "auto-recording-close";
        closeButton.type = "button";
        closeButton.textContent = "\u00d7";

        var title = document.createElement("div");
        title.className = "auto-recording-title";

        var copy = document.createElement("p");
        copy.className = "auto-recording-copy";

        var background = document.createElement("p");
        background.className = "auto-recording-background";

        var privacy = document.createElement("p");
        privacy.className = "auto-recording-privacy";

        var actions = document.createElement("div");
        actions.className = "auto-recording-actions";

        var cancelButton = document.createElement("button");
        cancelButton.className =
            "auto-recording-action auto-recording-cancel";
        cancelButton.type = "button";

        var startButton = document.createElement("button");
        startButton.className =
            "auto-recording-action auto-recording-start";
        startButton.type = "button";

        actions.appendChild(cancelButton);
        actions.appendChild(startButton);

        box.appendChild(closeButton);
        box.appendChild(title);
        box.appendChild(copy);
        box.appendChild(background);
        box.appendChild(privacy);
        box.appendChild(actions);

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function(event) {
            if (event.target === overlay) {
                dismissAutoRecordingNotice();
            }
        });

        closeButton.addEventListener(
            "click",
            dismissAutoRecordingNotice
        );

        cancelButton.addEventListener(
            "click",
            dismissAutoRecordingNotice
        );

        startButton.addEventListener(
            "click",
            startRecordingAfterDisclosure
        );
    }

    applyAutoRecordingNoticeLang();

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    var startButton =
        overlay.querySelector(".auto-recording-start");

    if (startButton) {
        setTimeout(function() {
            startButton.focus();
        }, 0);
    }
}

function toggleFog() { isFogEnabled = !isFogEnabled; localStorage.setItem(FOG_ENABLED_KEY, String(isFogEnabled)); syncFogButton(); scheduleRender(); }
function getBackgroundGeolocationPlugin() {
    return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.BackgroundGeolocation : null;
}
function getNativeRouteTrackingBridge() {
    return window.GiloaPhotoBridge && typeof window.GiloaPhotoBridge.startRouteTracking === "function" ? window.GiloaPhotoBridge : null;
}
function isNativeRouteTrackingAvailable() { return !!getNativeRouteTrackingBridge(); }
function isNativeRouteTrackingActive() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.isRouteTrackingActive !== "function") return false;
    try { return bridge.isRouteTrackingActive() === true; } catch (_) { return false; }
}
function startNativeRouteTracking() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || !isRecording) return false;
    var sessionId = ensureRecordingSession();
    try {
        if (typeof bridge.startRouteTrackingSession === "function") return bridge.startRouteTrackingSession(AUTO_RECORDING_MS, sessionId) === true;
        return bridge.startRouteTracking(AUTO_RECORDING_MS) === true;
    }
    catch (error) { console.warn("Native route tracking start failed", error); return false; }
}
function stopNativeRouteTracking() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.stopRouteTracking !== "function") return;
    try { bridge.stopRouteTracking(); } catch (error) { console.warn("Native route tracking stop failed", error); }
}
function mergeNativeRouteTrackingPoints(list) {
    if (!Array.isArray(list) || !list.length) return 0;
    var imported = list.map(function(point) {
        var lat = Number(point && point.lat);
        var lng = Number(point && point.lng);
        var accuracy = Number(point && point.accuracy);
        var time = Number(point && point.time) || Date.now();
        var sessionId = String(point && point.recordingSessionId || recordingSessionId || "");
        if (!isFinite(lat) || !isFinite(lng) || !isValidPhotoCoordinate(lat, lng)) return null;
        if (!isFinite(accuracy) || accuracy > MAX_ACCURACY_M) return null;
        return { lat:lat, lng:lng, startTime:time, endTime:time, timestamp:time, visits:1, accuracy:accuracy, recordingSessionId:sessionId || null, source:"native" };
    }).filter(Boolean);
    if (!imported.length) return 0;

    // Native tracking continues while the WebView is backgrounded or rebuilt.
    // Merge those samples directly instead of routing them through
    // handlePosition(), which intentionally ignores samples while the JS UI is
    // not yet marked as recording.
    rawGpsPoints = mergeJourneyPointLists([
    rawGpsPoints,
    imported
], true);

imported.forEach(function(point) {
    idbSaveGpsPoint(point).catch(function(error) {
        console.warn(
            "Native GPS durable save failed",
            error && error.name
        );
    });
});
    var combined = (pathCoordinates || []).map(function(point) { return Object.assign({}, point); }).concat(imported);
    combined.sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    var deduplicated = [];
    combined.forEach(function(point) {
        var previous = deduplicated[deduplicated.length - 1];
        if (previous) {
            var timeGap = Math.abs(Number(point.startTime) - Number(previous.startTime));
            var distance = L.latLng(previous.lat, previous.lng).distanceTo([point.lat, point.lng]);
            // Foreground and native trackers can report the same fix. Keep one
            // copy, but never simplify distinct bends in the recorded route.
            if (timeGap <= 15000 && distance < 5) {
                previous.endTime = Math.max(Number(previous.endTime) || 0, Number(point.endTime) || Number(point.startTime));
                previous.visits = Math.max(Number(previous.visits) || 1, Number(point.visits) || 1);
                return;
            }
        }
        deduplicated.push(point);
    });
    pathCoordinates = shrinkOldPoints(deduplicated, MAX_PATH_POINTS);
    var restoredDistance = totalDistance;
    totalDistance = 0;
    for (var i = 1; i < pathCoordinates.length; i++) {
        if (shouldConnectStoredPathPoints(pathCoordinates[i - 1], pathCoordinates[i])) {
            totalDistance += L.latLng(pathCoordinates[i - 1].lat, pathCoordinates[i - 1].lng).distanceTo([pathCoordinates[i].lat, pathCoordinates[i].lng]);
        }
    }
    totalDistance = Math.max(restoredDistance, totalDistance);
    return imported.length;
}
function restoreNativeRecordingSession() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.getRouteTrackingSessionId !== "function") return recordingSessionId;
    try {
        var nativeSessionId = String(bridge.getRouteTrackingSessionId() || "").trim();
        if (nativeSessionId) {
            recordingSessionId = nativeSessionId;
            var parts = nativeSessionId.split(":");
            if (!recordingSessionStartedAt && isFinite(parts[1])) recordingSessionStartedAt = Number(parts[1]);
        }
    } catch (error) { console.warn("Native recording session restore failed", error); }
    return recordingSessionId;
}
function acknowledgeNativeRouteTrackingPoints(bridge, throughTime) {
    if (!bridge || !throughTime || typeof bridge.acknowledgeRouteTrackingPoints !== "function") return false;
    try { return bridge.acknowledgeRouteTrackingPoints(throughTime) === true; }
    catch (error) { console.warn("Native route tracking acknowledgement failed", error); return false; }
}
function consumeNativeRouteTrackingPoints(options) {
    options = options || {};
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge) return Promise.resolve({ count:0, throughTime:0, canAcknowledge:false });
    var canAcknowledge = typeof bridge.loadRouteTrackingPoints === "function" && typeof bridge.acknowledgeRouteTrackingPoints === "function";
    if (!canAcknowledge && typeof bridge.consumeRouteTrackingPoints !== "function") return Promise.resolve({ count:0, throughTime:0, canAcknowledge:false });
    var raw;
    try { raw = canAcknowledge ? bridge.loadRouteTrackingPoints() : bridge.consumeRouteTrackingPoints(); }
    catch (error) { console.warn("Native route tracking read failed", error); return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge }); }
    var list;
    try { list = JSON.parse(raw || "[]"); } catch (_) { return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge }); }
    if (!Array.isArray(list) || !list.length) return Promise.resolve({ count:0, throughTime:0, canAcknowledge:canAcknowledge });
    list.sort(function(a, b) { return (Number(a.time) || 0) - (Number(b.time) || 0); });
    var count = mergeNativeRouteTrackingPoints(list);
    var throughTime = list.reduce(function(latest, point) { return Math.max(latest, Number(point && point.time) || 0); }, 0);
    if (!count) return Promise.resolve({ count:0, throughTime:throughTime, canAcknowledge:canAcknowledge });
    compactPathData();
    markJourneyStateDirty();
    if (!options.deferPersist) {
        var saved = persistState();
        if (saved && canAcknowledge) acknowledgeNativeRouteTrackingPoints(bridge, throughTime);
    }
    return Promise.resolve({ count:count, throughTime:throughTime, canAcknowledge:canAcknowledge });
}
function isNativeApp() {
    return !!(
        isNativeRouteTrackingAvailable() ||
        (
            window.Capacitor &&
            typeof window.Capacitor.isNativePlatform === "function" &&
            window.Capacitor.isNativePlatform()
        )
    );
}
function toPositionFromBackground(location) {
    return {
        coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            heading: location.bearing,
            speed: location.speed,
            altitude: location.altitude,
            altitudeAccuracy: location.altitudeAccuracy
        },
        timestamp: location.time || Date.now()
    };
}
function handleBackgroundLocation(location, error) {
    if (error) {
        console.warn("Background location error", error);
        if (error.code === "NOT_AUTHORIZED" && recStatusBox) recStatusBox.textContent = "Location permission required";
        return;
    }
    if (location && trackingRequested && isRecording) handlePosition(toPositionFromBackground(location), { source:"background" });
}
function startBackgroundTracking() {
    var background = getBackgroundGeolocationPlugin();
    if (!background || typeof background.addWatcher !== "function") return Promise.resolve(false);
    if (backgroundWatchId !== null) return Promise.resolve(true);
    if (backgroundWatchStartPromise) return backgroundWatchStartPromise;
    backgroundWatchStartPromise = background.addWatcher({
        backgroundMessage: "Giloa is recording your route.",
        backgroundTitle: "Giloa location recording",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10
    }, handleBackgroundLocation).then(function(id) {
        backgroundWatchStartPromise = null;
        if (!trackingRequested) {
            return background.removeWatcher({ id: id }).catch(function(error) {
                console.warn("Background location cleanup failed", error);
            }).then(function() { return false; });
        }
        backgroundWatchId = id;
        return true;
    }).catch(function(error) {
        backgroundWatchStartPromise = null;
        console.warn("Background location start failed", error);
        return false;
    });
    return backgroundWatchStartPromise;
}
function stopBackgroundTracking() {
    var background = getBackgroundGeolocationPlugin();
    if (!background || typeof background.removeWatcher !== "function" || backgroundWatchId === null) return Promise.resolve();
    var id = backgroundWatchId;
    backgroundWatchId = null;
    return background.removeWatcher({ id: id }).catch(function(error) {
        console.warn("Background location stop failed", error);
    });
}
function startForegroundTracking() {
    if (!navigator.geolocation) {
        if (recStatusBox) recStatusBox.textContent = "Location unavailable";
        return;
    }
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && !isNativeApp()) {
        if (recStatusBox) recStatusBox.textContent = "HTTPS required";
        return;
    }
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = navigator.geolocation.watchPosition(handlePosition, handleLocationError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    if (recStatusBox && isRecording) recStatusBox.textContent = "Waiting for location";
}
function startTracking() {
    clearTrackingRetryTimer();
    trackingRequested = true;
    if (isNativeRouteTrackingAvailable()) {
        startNativeRouteTracking();
        startForegroundTracking();
        return;
    }
    if (isNativeApp()) {
        startBackgroundTracking().then(function(started) {
            if (!started && trackingRequested && isRecording) startForegroundTracking();
        });
        return;
    }
    startForegroundTracking();
}
function stopTracking() {
    trackingRequested = false;
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    stopNativeRouteTracking();
    stopBackgroundTracking();
}

function handlePosition(position, options) {
    options = options || {};
    if (!position || !position.coords || !isValidPhotoCoordinate(position.coords.latitude, position.coords.longitude)) return;
        /*
     * 최초 네이티브 서비스 시작 시 위치 권한이 아직 승인되지 않았다면
     * startNativeRouteTracking()이 실패할 수 있다.
     * 첫 번째 정상 위치가 들어온 시점에는 권한 승인이 끝났으므로
     * 네이티브 백그라운드 기록 서비스를 다시 시작한다.
     */
    if (
        trackingRequested &&
        isRecording &&
        isNativeRouteTrackingAvailable() &&
        !isNativeRouteTrackingActive()
    ) {
        startNativeRouteTracking();
    }
    var accuracy = Number(position.coords.accuracy) || Infinity;
    var timestamp = Number(position.timestamp) || Date.now();
    // A single coarse Wi-Fi/cell fix must not drag the player marker hundreds of
    // metres away from a good GPS fix taken moments ago.  Skip a sample only when
    // it is dramatically worse than the fix we are already showing.
    if (!options.force && shouldIgnorePositionSample(accuracy, timestamp)) {
        if (recStatusBox && isRecording) recStatusBox.textContent = getStatusText("gps_weak", Math.round(accuracy));
        return;
    }
    currentAccuracy = accuracy;
    currentPositionTimestamp = timestamp;
    var latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    var heading = position.coords.heading;
    var prevPos = currentPos;
    if (isFinite(heading)) playerHeading = heading;
    else if (prevPos && prevPos.distanceTo(latlng) > 2) playerHeading = bearingBetween(prevPos, latlng);
    currentPos = latlng;
    if (!playerMarker) {
        playerMarker = L.marker(latlng, {
            pane: "playerPane", keyboard: true,
            title: (UI_TEXT[currentLang] || UI_TEXT.ko).special_place,
            icon: L.divIcon({ className: "player-marker", html: '<span class="player-marker-dot"></span>', iconSize: [44, 44], iconAnchor: [22, 22] })
        }).addTo(map);
        playerMarker.on("click", function(e) {
            if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
            var displayedPosition = getDisplayedCurrentPosition();
            if (displayedPosition) openSpecialPlaceEditor(displayedPosition.lat, displayedPosition.lng);
        });
        map.setView(latlng, 16);
    }
    else { playerMarker.setLatLng(latlng); }
    // The visible marker is the canonical current position used by the rest of
    // the map. This keeps the blue dot, map centering and fog opening identical.
    currentPos = playerMarker.getLatLng();
    latlng = currentPos;
    if (!playerAccuracyCircle) {
        playerAccuracyCircle = L.circle(latlng, { pane: "playerPane", radius: Math.max(accuracy, 3), interactive: false, color: "#4db8ff", weight: 1, opacity: 0.55, fillColor: "#4db8ff", fillOpacity: 0.09 }).addTo(map);
    } else {
        playerAccuracyCircle.setLatLng(latlng);
        playerAccuracyCircle.setRadius(Math.max(accuracy, 3));
    }
    // `handlePosition` is the single approval point used by the map, marker,
    // accuracy circle and tutorial. A late geolocation timeout must not undo
    // this accepted position in the tutorial UI.
    if (hasValidCurrentLocation()) {
        console.log("[GILOA LOCATION READY]", currentPos);
        window.dispatchEvent(new CustomEvent("giloa:location-ready", { detail:{ lat:currentPos.lat, lng:currentPos.lng, accuracy:currentAccuracy } }));
        updateRegionStayProgress(currentPos, currentAccuracy, currentPositionTimestamp);
    }
    refreshMapCenteredLayerMarkers();
    if (!prevPos) {
        scheduleRestroomFetch();
        delete tourSearchStateByLang[currentLang || "ko"];
        scheduleTourFetch({ immediate: true });
    }
    // The player marker moves even when recording is paused.  Repaint now so
    // the fog opening cannot remain at the previous GPS point.
    scheduleRender();
    updateVisionCone(latlng);
    syncImageMissionUI();
    if (window.GiloaHiddenMissions) {
        window.GiloaHiddenMissions.onPosition({
            lat: latlng.lat,
            lng: latlng.lng,
            accuracy: accuracy,
            timestamp: currentPositionTimestamp,
            recording: isRecording
        });
    }
    if (!isRecording) return;
    if (accuracy > MAX_ACCURACY_M) { recStatusBox.textContent = getStatusText("gps_very_weak", Math.round(accuracy)); return; }
    // Preserve the GPS sample time. Using Date.now() here collapsed delayed
    // background samples into the moment the app was reopened, breaking the
    // selected 1–8 hour export range.
    var now = timestamp; recStatusBox.textContent = accuracy > 50 ? getStatusText("gps_weak", Math.round(accuracy)) : getStatusText("rec_active");
    checkNearbyVisitCompletion({ method: "stay" });
    var rawPoint = createPathPoint(latlng, now, accuracy, ensureRecordingSession(), options.source || "foreground");
    if (!appendRawGpsPoint(rawPoint)) return;
    updateRegionStayProgress();
    if (pathCoordinates.length === 0) { pathCoordinates.push(rawPoint); checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleCompletedOfficialRouteRefresh(); scheduleRender(); return; }
    // Keep every accepted fix in RAW storage, but remove an isolated out-and-
    // back GPS excursion from DISPLAY once the following real fix proves it was
    // noise. No synthetic coordinate is created and no stored fix is deleted.
    if (pathCoordinates.length >= 2 && isIsolatedGpsSpike(pathCoordinates[pathCoordinates.length - 2], pathCoordinates[pathCoordinates.length - 1], rawPoint)) pathCoordinates.pop();
    var last = pathCoordinates[pathCoordinates.length - 1]; var dist = distanceToPoint(latlng, last); var stayThreshold = getDynamicStayThreshold(accuracy);
    var connected = shouldConnectPath(last, rawPoint);
    // MIN_MOVE is a display/statistics hint only. Every accepted raw fix is
    // retained, and the second valid fix can draw A-to-B immediately.
    pathCoordinates.push(rawPoint);
    if (connected && dist > stayThreshold) { totalDistance += dist; triggerRecentPathPulse(latlng.lat, latlng.lng); }
    else if (!connected && Number(rawPoint.startTime) - Number(last.endTime || last.startTime) <= GAP_THRESHOLD_MS) recStatusBox.textContent = getStatusText("gps_weak", Math.round(accuracy));
    if (pathCoordinates.length > MAX_PATH_POINTS) compactPathData();
    checkStayBonus(latlng, now); updateStats(); scheduleSave(); scheduleCompletedOfficialRouteRefresh(); scheduleRender();
}

function handleLocationError(err) {
    var messages = { 1: "Location permission needed", 2: "Checking location", 3: "Location timeout" };
    if (recStatusBox) recStatusBox.textContent = messages[err && err.code] || "Waiting for location";
    if (!isRecording) return;
    if (err && err.code === 1) { stopRecording(); return; }
    clearTrackingRetryTimer();
    trackingRetryTimer = setTimeout(function() {
        trackingRetryTimer = null;
        if (isRecording) startTracking();
    }, 15000);
}
function createPathPoint(latlng, timestamp, accuracy, sessionId, source) { return { lat: latlng.lat, lng: latlng.lng, startTime: timestamp, endTime: timestamp, timestamp: timestamp, visits: 1, accuracy: isFinite(accuracy) ? Number(accuracy) : null, recordingSessionId:sessionId || null, source:source || "foreground" }; }
var rawGpsPointIds = new Set();
var rawGpsPointIndexSource = null;
function getRawGpsPointId(point) {
    return String(point.id || (Number(point.timestamp) + ":" + Number(point.lat).toFixed(7) + ":" + Number(point.lng).toFixed(7)));
}
function rebuildRawGpsPointIndex() {
    rawGpsPointIds.clear();
    rawGpsPoints.forEach(function(point) {
        if (!point || !isFinite(point.timestamp) || !isFinite(point.lat) || !isFinite(point.lng)) return;
        point.id = getRawGpsPointId(point);
        rawGpsPointIds.add(point.id);
    });
    rawGpsPointIndexSource = rawGpsPoints;
}
function ensureRawGpsPointIndex() {
    if (rawGpsPointIndexSource !== rawGpsPoints || (rawGpsPoints.length && !rawGpsPointIds.size)) rebuildRawGpsPointIndex();
}
function findRawGpsPointIndex(timestamp, afterEqual) {
    var low = 0;
    var high = rawGpsPoints.length;
    while (low < high) {
        var middle = (low + high) >>> 1;
        var middleTimestamp = Number(rawGpsPoints[middle].timestamp);
        if (middleTimestamp < timestamp || (afterEqual && middleTimestamp === timestamp)) low = middle + 1;
        else high = middle;
    }
    return low;
}
function appendRawGpsPoint(point) {
    if (!point || !isFinite(point.lat) || !isFinite(point.lng) || !isFinite(point.timestamp) || !isFinite(point.accuracy) || point.accuracy > MAX_ACCURACY_M) return false;
    point = Object.assign({}, point, { startTime:Number(point.startTime || point.timestamp), endTime:Number(point.endTime || point.timestamp), timestamp:Number(point.timestamp), accuracy:Number(point.accuracy), recordingSessionId:point.recordingSessionId ? String(point.recordingSessionId) : null, source:point.source ? String(point.source) : "unknown" });
    point.id = getRawGpsPointId(point);
    ensureRawGpsPointIndex();
    if (rawGpsPointIds.has(point.id)) return false;
    var duplicateWindowStart = findRawGpsPointIndex(point.timestamp - 15000, false);
    for (var i = duplicateWindowStart; i < rawGpsPoints.length; i++) {
        var existing = rawGpsPoints[i];
        var timeGap = Math.abs(Number(existing.timestamp) - point.timestamp);
        if (Number(existing.timestamp) > point.timestamp + 15000) break;
        var distance = L.latLng(existing.lat, existing.lng).distanceTo([point.lat, point.lng]);
        if ((timeGap <= 1000 && distance < 1) || (existing.source !== point.source && timeGap <= 15000 && distance < 5)) return false;
    }
    var insertionIndex = findRawGpsPointIndex(point.timestamp, true);
    if (insertionIndex === rawGpsPoints.length) rawGpsPoints.push(point);
    else rawGpsPoints.splice(insertionIndex, 0, point);
    rawGpsPointIds.add(point.id);
    markJourneyStateDirty();
    idbSaveGpsPoint(point).catch(function(error) { console.warn("GPS point durable save failed", error && error.name); });
    return true;
}
function restoreRawGpsPoints() {
    return idbGetAllGpsPoints().then(function(points) {
        var beforeCount = rawGpsPoints.length;

        // 한 점씩 some()과 sort()를 반복하지 않고 한 번에 병합한다.
        rawGpsPoints = mergeJourneyPointLists([
            rawGpsPoints,
            Array.isArray(points) ? points : []
        ], true);

        if (!rawGpsPoints.length && pathCoordinates.length) {
            rawGpsPoints = mergeJourneyPointLists([
                pathCoordinates
            ], true);
        }

        if (rawGpsPoints.length) {
            pathCoordinates = buildDisplayPath(
                mergeJourneyPointLists([
                    pathCoordinates,
                    rawGpsPoints
                ], false)
            );

            totalDistance = Math.max(
                totalDistance,
                calculateRecordedDistance(pathCoordinates, 0)
            );

            updateStats();
            scheduleRender();
        }

        return {
            count: rawGpsPoints.length,
            added: Math.max(0, rawGpsPoints.length - beforeCount),
            failed: false
        };
    }).catch(function(error) {
        console.warn("GPS point restore failed", error && error.name);

        return {
            count: rawGpsPoints.length,
            added: 0,
            failed: true
        };
    });
}
function buildDisplayPath(points) {
    var display = [];
    (points || []).slice().sort(function(a, b) { return Number(a.timestamp) - Number(b.timestamp); }).forEach(function(point) {
        var next = Object.assign({}, point, { visits:Number(point.visits) || 1 });
        if (display.length >= 2 && isIsolatedGpsSpike(display[display.length - 2], display[display.length - 1], next)) display.pop();
        display.push(next);
    });
    return shrinkOldPoints(display, MAX_PATH_POINTS);
}
function distanceToPoint(latlng, point) { return latlng.distanceTo([point.lat, point.lng]); }
function getDynamicStayThreshold(accuracy) { return Math.max(MIN_MOVE_M, Math.min(MAX_STAY_RADIUS_M, accuracy * STAY_ACCURACY_FACTOR)); }
function isIsolatedGpsSpike(previous, candidate, next) {
    if (!previous || !candidate || !next) return false;
    var previousSession = String(previous.recordingSessionId || "");
    var candidateSession = String(candidate.recordingSessionId || "");
    var nextSession = String(next.recordingSessionId || "");
    if ((previousSession || candidateSession || nextSession) && (!previousSession || previousSession !== candidateSession || candidateSession !== nextSession)) return false;
    var previousTime = Number(previous.startTime || previous.timestamp);
    var candidateTime = Number(candidate.startTime || candidate.timestamp);
    var nextTime = Number(next.startTime || next.timestamp);
    if (!isFinite(previousTime) || !isFinite(candidateTime) || !isFinite(nextTime) || candidateTime <= previousTime || nextTime <= candidateTime || nextTime - previousTime > PATH_SPIKE_WINDOW_MS) return false;
    var accuracies = [previous.accuracy, candidate.accuracy, next.accuracy].map(function(value) { return isFinite(value) ? Number(value) : MAX_ACCURACY_M; });
    if (accuracies.some(function(value) { return value < 0 || value > PATH_CONNECT_MAX_ACCURACY_M; })) return false;
    var previousToCandidate = L.latLng(previous.lat, previous.lng).distanceTo([candidate.lat, candidate.lng]);
    var candidateToNext = L.latLng(candidate.lat, candidate.lng).distanceTo([next.lat, next.lng]);
    var previousToNext = L.latLng(previous.lat, previous.lng).distanceTo([next.lat, next.lng]);
    if (![previousToCandidate, candidateToNext, previousToNext].every(isFinite)) return false;
    var returnRadius = Math.max(30, Math.min(75, (accuracies[0] + accuracies[2]) * 1.25));
    var excursion = Math.min(previousToCandidate, candidateToNext);
    var detour = previousToCandidate + candidateToNext;
    var outboundSpeed = previousToCandidate / Math.max(1, (candidateTime - previousTime) / 1000);
    var returnSpeed = candidateToNext / Math.max(1, (nextTime - candidateTime) / 1000);
    var candidateAccuracyIsWorse = accuracies[1] >= Math.max(25, Math.max(accuracies[0], accuracies[2]) * 1.8);
    return previousToNext <= returnRadius && excursion >= Math.max(PATH_SPIKE_MIN_EXCURSION_M, previousToNext * 2.5) && detour >= Math.max(100, previousToNext * 4) && (Math.max(outboundSpeed, returnSpeed) > PATH_SHORT_GAP_MAX_SPEED_MPS || candidateAccuracyIsWorse);
}
function isPlausiblePathSegment(fromPoint, toLatLng, timestamp, accuracy) {
    if (!fromPoint || !toLatLng) return true;
    return shouldConnectPath(fromPoint, {
        lat:toLatLng.lat, lng:toLatLng.lng, startTime:Number(timestamp), endTime:Number(timestamp), timestamp:Number(timestamp),
        accuracy:isFinite(accuracy) ? Number(accuracy) : MAX_ACCURACY_M,
        recordingSessionId:fromPoint.recordingSessionId || recordingSessionId || null
    });
}
function shouldConnectPath(fromPoint, toPoint) {
    if (!fromPoint || !toPoint) return false;

    var fromSession = String(fromPoint.recordingSessionId || "");
    var toSession = String(toPoint.recordingSessionId || "");
    if (fromSession && toSession && fromSession !== toSession) return false;
    var sameSession =
        !!fromSession &&
        !!toSession &&
        fromSession === toSession;

    var fromAccuracy = isFinite(fromPoint.accuracy)
        ? Number(fromPoint.accuracy)
        : MAX_ACCURACY_M;

    var toAccuracy = isFinite(toPoint.accuracy)
        ? Number(toPoint.accuracy)
        : MAX_ACCURACY_M;

    if (
        fromAccuracy < 0 ||
        toAccuracy < 0 ||
        fromAccuracy > PATH_CONNECT_MAX_ACCURACY_M ||
        toAccuracy > PATH_CONNECT_MAX_ACCURACY_M
    ) {
        return false;
    }

 var fromFixTime = Number(
    fromPoint.timestamp || fromPoint.startTime
);
var toFixTime = Number(
    toPoint.timestamp || toPoint.startTime
);

if (
    !isFinite(fromFixTime) ||
    !isFinite(toFixTime) ||
    toFixTime <= fromFixTime
) return false;

var fromEndTime = Number(fromPoint.endTime);
var departureTime =
    isFinite(fromEndTime) &&
    fromEndTime >= fromFixTime &&
    fromEndTime < toFixTime
        ? fromEndTime
        : fromFixTime;

var elapsedMs = toFixTime - departureTime;
    var distance = L.latLng(
        fromPoint.lat,
        fromPoint.lng
    ).distanceTo([
        toPoint.lat,
        toPoint.lng
    ]);

    if (!isFinite(distance)) return false;

    var elapsedSeconds = Math.max(1, elapsedMs / 1000);
    var speed = distance / elapsedSeconds;

    var accuracyAllowance = Math.min(
        100,
        Math.max(0, fromAccuracy + toAccuracy)
    );

    if (elapsedMs <= GAP_THRESHOLD_MS) {
        var speedLimit =
            elapsedMs <= 60 * 1000
                ? PATH_SHORT_GAP_MAX_SPEED_MPS
                : MAX_PATH_SPEED_MPS;

        var allowedDistance =
            PATH_JUMP_BASE_TOLERANCE_M +
            accuracyAllowance +
            elapsedSeconds * speedLimit;

        return (
            speed <= speedLimit &&
            distance <= allowedDistance
        );
    }

    if (!sameSession) return false;

    if (elapsedMs <= PATH_MID_GAP_MAX_MS) {
        return (
            speed <= PATH_MID_GAP_MAX_SPEED_MPS &&
            distance <= PATH_LONG_GAP_MAX_DISTANCE_M
        );
    }

    if (elapsedMs <= PATH_LONG_GAP_MAX_MS) {
        return (
            speed <= PATH_LONG_GAP_MAX_SPEED_MPS &&
            distance <= PATH_LONG_GAP_MAX_DISTANCE_M
        );
    }

    return distance <= Math.max(
        250,
        accuracyAllowance * 2
    );
}
function shouldConnectStoredPathPoints(fromPoint, toPoint) { return shouldConnectPath(fromPoint, toPoint); }

function checkStayBonus(latlng, now) {
    if (!stayBonusAnchor) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (latlng.distanceTo(stayBonusAnchor) > STAY_BONUS_RADIUS_M) { stayBonusAnchor = latlng; stayBonusStartTime = now; return; }
    if (stayBonusPlaces.some(function(p) { return latlng.distanceTo([p.lat, p.lng]) <= STAY_BONUS_RADIUS_M; })) return;
    var remaining = STAY_BONUS_MS - (now - stayBonusStartTime);
    if (remaining > 0) { recStatusBox.textContent = getStatusText("stay_bonus_wait", Math.ceil(remaining / 60000)); return; }
    stayBonusPlaces.push({ lat: stayBonusAnchor.lat, lng: stayBonusAnchor.lng }); stayBonusLevelBoost += 1; saveBonusState(); updateStats();
    recStatusBox.textContent = getStatusText("stay_bonus_done"); setTimeout(function() { if (isRecording) recStatusBox.textContent = getStatusText("rec_active"); }, 4000);
}
function saveBonusState() { localStorage.setItem("giloa-stay-bonus", JSON.stringify({ boost: stayBonusLevelBoost, places: stayBonusPlaces })); }
function loadBonusState() { try { var raw = localStorage.getItem("giloa-stay-bonus"); if (!raw) return; var data = JSON.parse(raw); stayBonusLevelBoost = isFinite(data.boost) ? data.boost : 0; stayBonusPlaces = Array.isArray(data.places) ? data.places.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng); }) : []; } catch (e) { console.warn("보너스 상태 불러오기 실패", e); } }
function calculateRecordedDistance(points, sinceMs) { var dist = 0; for (var i = 1; i < points.length; i++) { if ((!sinceMs || Number(points[i].startTime) >= sinceMs) && shouldConnectStoredPathPoints(points[i - 1], points[i])) dist += L.latLng(points[i].lat, points[i].lng).distanceTo([points[i - 1].lat, points[i - 1].lng]); } return dist; }
function calcTodayDistance() { return calculateRecordedDistance(pathCoordinates, new Date().setHours(0, 0, 0, 0)); }

function compactPathData() {
    // Never compact the source log. The display path only removes impossible
    // jumps and old overflow; small, legitimate A-to-B movement stays visible.
    // Legacy display points can predate the durable RAW log. Preserve both.
    var displayByFix = new Map();
    pathCoordinates.forEach(function(point) {
        displayByFix.set(journeyPointKey(point), point);
    });
    var combined = mergeJourneyPointLists([rawGpsPoints, pathCoordinates], false);
    combined.forEach(function(point) {
        var displayed = displayByFix.get(journeyPointKey(point));
        if (!displayed) return;
        // RAW owns fix/session metadata; keep accumulated stays from display data.
        point.endTime = Math.max(Number(point.endTime) || 0, Number(displayed.endTime) || 0);
        point.visits = Math.max(Number(point.visits) || 1, Number(displayed.visits) || 1);
    });
    pathCoordinates = buildDisplayPath(combined);
}
function shrinkOldPoints(points, maxPoints) { if (points.length <= maxPoints) return points; var keepTail = Math.floor(maxPoints * 0.4); var tail = points.slice(-keepTail); var head = points.slice(0, points.length - keepTail); var ratio = Math.ceil(head.length / (maxPoints - keepTail)); var filtered = head.filter(function(_, i) { return i % ratio === 0; }); return filtered.concat(tail).slice(-maxPoints); }

function addMemoryAt(lat, lng, defaultName) {
    if (!isFinite(lat) || !isFinite(lng)) { alert(earlyUiText("noMemoryLocation")); return; }
    var input = prompt(earlyUiText("memoryPrompt"), defaultName || earlyUiText("newDiscovery"));
    if (input === null) return;
    var now = new Date();
    var data = {
        id: String(now.getTime()),
        lat: lat,
        lng: lng,
        name: escapeHtml(input.trim() || "Memory point"),
        time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    memories.push(data);
    createMemoryMarker(data, true);
    updateMemoryList();
    updateStats();
    scheduleSave();
}
function addMemory() {
    if (!currentPos) { alert(earlyUiText("checkingLocation")); return; }
    addMemoryAt(currentPos.lat, currentPos.lng, earlyUiText("newDiscovery"));
}
function addPhotoMemory(data) {
    if (!data) return;
    addMemoryAt(data.lat, data.lng, earlyUiText("photoMemory"));
}
function createMemoryMarker(data, openPopup) { var marker = L.marker([data.lat, data.lng], { pane: "memoryPane", icon: L.divIcon({ className: "memory-marker", html: "*", iconSize: [28, 28] }) }).addTo(map); var popupEl = document.createElement("div"); var title = document.createElement("b"); title.textContent = data.name; var info = document.createElement("small"); info.style.display = "block"; info.textContent = earlyMemoryDateText(data); var delBtn = document.createElement("button"); delBtn.className = "popup-delete-btn"; delBtn.textContent = earlyUiText("delete"); delBtn.addEventListener("click", function() { deleteMemory(data.id); }); popupEl.appendChild(title); popupEl.appendChild(document.createElement("br")); popupEl.appendChild(info); popupEl.appendChild(delBtn); marker.bindPopup(popupEl); marker.on("click", function() { setSelectedDestination(data.lat, data.lng, data.name || earlyUiText("memoryPlace")); }); memoryMarkers.set(data.id, marker); if (openPopup) { setSelectedDestination(data.lat, data.lng, data.name || earlyUiText("memoryPlace")); marker.openPopup(); } }
function deleteMemory(id) {
    if (!commitJourneyDeletion("memories", id)) return;
    var marker = memoryMarkers.get(id);
    if (marker) { map.removeLayer(marker); memoryMarkers.delete(id); }
    updateMemoryList(); updateStats();
}
function updateMemoryList() { var container = document.getElementById("memory-list-container"); if (!container) return; if (memories.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(earlyUiText("emptyMemories")) + '</p>'; return; } container.innerHTML = ""; memories.slice().reverse().forEach(function(memo) { var item = document.createElement("div"); item.className = "memory-item"; var name = document.createElement("span"); name.className = "item-name"; name.textContent = memo.name; var date = document.createElement("span"); date.className = "item-date"; date.textContent = earlyMemoryDateText(memo); var actions = document.createElement("div"); actions.className = "memory-actions"; var moveBtn = document.createElement("button"); moveBtn.className = "memory-action-btn move"; moveBtn.textContent = earlyUiText("move"); moveBtn.addEventListener("click", function(e) { e.stopPropagation(); setSelectedDestination(memo.lat, memo.lng, memo.name || earlyUiText("memoryPlace")); map.flyTo([memo.lat, memo.lng], 17); }); var delBtn = document.createElement("button"); delBtn.className = "memory-action-btn delete"; delBtn.textContent = earlyUiText("delete"); delBtn.addEventListener("click", function(e) { e.stopPropagation(); deleteMemory(memo.id); }); actions.appendChild(moveBtn); actions.appendChild(delBtn); item.appendChild(name); item.appendChild(date); item.appendChild(actions); item.addEventListener("click", function() { setSelectedDestination(memo.lat, memo.lng, memo.name || earlyUiText("memoryPlace")); map.flyTo([memo.lat, memo.lng], 17); toggleSidebar(false); }); container.appendChild(item); }); }
// 紐⑤뱺 ???占쏀솚
var ALL_TABS = ["photo", "gpx", "visit", "item"];
function switchAllTab(tab) {
    if (tab === "memory") tab = "photo";
    if (tab === "badge") tab = "item";
    ALL_TABS.forEach(function(t) {
        var tabEl = document.getElementById("tab-" + t);
        var panelEl = document.getElementById("panel-" + t);
        if (tabEl) tabEl.classList.toggle("active", t === tab);
        if (panelEl) panelEl.style.display = t === tab ? "" : "none";
    });
    if (tab === "photo") updatePhotoList();
    if (tab === "gpx") updateGpxSavedList();
    if (tab === "visit") updateVisitList();
    if (tab === "item") updateItemList();
}
function switchTab(tab) { switchAllTab(tab); }
function updatePhotoList() {
    var container = document.getElementById("photo-list-container");
    if (!container) return;
    var photoText = getPhotoInteractionText();
    if (photos.length === 0) {
        container.innerHTML = '<p class="empty-message" style="grid-column:1/-1">' + escapeHtml(photoText.emptyPhotos) + '</p>';
        return;
    }
    container.innerHTML = "";
    // Appending each tile straight into the container forced a layout pass per
    // photo; the fragment collapses that into a single one.
    var listFragment = document.createDocumentFragment();
    photos.slice().reverse().forEach(function(p) {
        var item = document.createElement("div");
        item.className = "photo-list-item";
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        var hasPhotoLocation = isValidPhotoCoordinate(p.lat, p.lng);
        item.setAttribute("aria-label", hasPhotoLocation ? photoText.mapView : photoText.assignLocation);
        var img = document.createElement("img");
        img.src = getPhotoDisplaySrc(p);
        img.alt = earlyMemoryDateText(p, true) || photoText.photoAlt;
        var date = document.createElement("div");
        date.className = "photo-list-date";
        date.textContent = earlyMemoryDateText(p, true);
        item.appendChild(img);
        item.appendChild(date);
        var badge = document.createElement("div");
        badge.className = hasPhotoLocation ? "photo-location-ok" : "photo-location-missing";
        badge.textContent = hasPhotoLocation ? "\ud83d\udccd " + photoText.exifLocation : "\ud83d\udccd " + photoText.locationNeeded;
        item.appendChild(badge);
        if (p.memo) {
            var memo = document.createElement("div");
            memo.className = "photo-list-memo";
            memo.textContent = p.memo;
            item.appendChild(memo);
        }
        var del = document.createElement("button");
        del.type = "button";
        del.className = "photo-list-del";
        del.textContent = "×";
        del.setAttribute("aria-label", photoText.deletePhoto);
        del.addEventListener("click", function(e) { e.stopPropagation(); deletePhoto(p.id); updatePhotoList(); });
        item.addEventListener("click", function() { focusPhotoOnMap(p); });
        item.addEventListener("keydown", function(e) {
            if (e.target !== item || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            focusPhotoOnMap(p);
        });
        item.title = hasPhotoLocation ? photoText.mapView : photoText.assignLocation;
        item.appendChild(del);
        listFragment.appendChild(item);
    });
    container.appendChild(listFragment);
}
// A full cluster scan per lookup made startup cost grow with the square of the
// photo count, because createPhotoMarker checks for an existing marker on every
// photo. hasLayer keeps the index honest if a marker is removed elsewhere.
var photoMarkerIndex = new Map();
function indexPhotoMarker(id, marker) { if (id && marker) photoMarkerIndex.set(id, marker); }
function forgetPhotoMarker(id) { if (id) photoMarkerIndex.delete(id); }
function clearPhotoMarkerIndex() { photoMarkerIndex.clear(); }
function findPhotoMarker(id) {
    if (!id) return null;
    var cached = photoMarkerIndex.get(id);
    if (!cached) return null;
    if (photoClusterGroup && typeof photoClusterGroup.hasLayer === "function" && !photoClusterGroup.hasLayer(cached)) {
        photoMarkerIndex.delete(id);
        return null;
    }
    return cached;
}
function refreshPhotoMarkersForLanguage() {
    if (!photoClusterGroup) return;
    var openPhotoIds = [];
    photoClusterGroup.eachLayer(function(layer) {
        if (layer && layer._photoData && typeof layer.isPopupOpen === "function" && layer.isPopupOpen()) openPhotoIds.push(layer._photoData.id);
    });
    photoClusterGroup.clearLayers();
    clearPhotoMarkerIndex();
    photos.forEach(function(photo) {
        if (photo && isValidPhotoCoordinate(photo.lat, photo.lng)) createPhotoMarker(photo, false);
    });
    openPhotoIds.forEach(function(id) {
        var marker = findPhotoMarker(id);
        if (!marker) return;
        if (typeof photoClusterGroup.zoomToShowLayer === "function") photoClusterGroup.zoomToShowLayer(marker, function() { marker.openPopup(); });
        else marker.openPopup();
    });
}
function adjustHourDial(dir) { var next = dialHours + dir; if (next < 1 || next > 8) return; dialHours = next; updateDialUI(); }
function updateDialUI() { var t = UI_TEXT[currentLang] || UI_TEXT.ko; var labelEl = document.getElementById("dial-hour-label"); var infoEl = document.getElementById("gpx-range-info"); if (labelEl) labelEl.textContent = dialHours + t.gpx_hour_short; if (infoEl) infoEl.textContent = t.gpx_recent_route.replace("{hours}", dialHours); }
function splitRecordedPathSegments(points) {
    var sorted = (points || []).filter(function(point) {
        return point && isFinite(point.lat) && isFinite(point.lng) && isFinite(Number(point.startTime));
    }).slice().sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    var segments = [];
    sorted.forEach(function(point) {
        var segment = segments[segments.length - 1];
        var previous = segment && segment[segment.length - 1];
        if (!segment || !shouldConnectStoredPathPoints(previous, point)) {
            segment = [];
            segments.push(segment);
        }
        segment.push(point);
    });
    return segments.filter(function(segment) { return segment.length > 0; });
}
function buildGpxContent(name, points) {
    var segmentXml = splitRecordedPathSegments(points).map(function(segment) {
        var trkpts = segment.map(function(point) {
            var time = new Date(Number(point.startTime)).toISOString();
            var accuracyXml = isFinite(point.accuracy) ? '\n        <extensions><giloa:accuracy>' + Number(point.accuracy).toFixed(1) + '</giloa:accuracy></extensions>' : '';
            return '      <trkpt lat="' + Number(point.lat).toFixed(7) + '" lon="' + Number(point.lng).toFixed(7) + '">\n        <time>' + time + '</time>' + accuracyXml + '\n      </trkpt>';
        }).join("\n");
        return '    <trkseg>\n' + trkpts + '\n    </trkseg>';
    }).join("\n");
    return '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Giloa"\n     xmlns="http://www.topografix.com/GPX/1/1" xmlns:giloa="https://giloa.kr/gpx/1">\n  <metadata><name>' + escapeXml(name) + '</name><time>' + new Date().toISOString() + '</time></metadata>\n  <trk><name>' + escapeXml(name) + '</name>\n' + segmentXml + '\n  </trk>\n</gpx>';
}
function escapeXml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function saveGpxRecord(name, points, options) { options = options || {}; if (!Array.isArray(points) || points.length === 0) return null; var gpxContent = buildGpxContent(name, points); var saves = loadGpxSaves(); var id = String(Date.now()) + Math.random().toString(36).slice(2); saves.push({ id: id, name: name, createdAt: Date.now(), pointCount: points.length, gpxContent: gpxContent }); if (!saveGpxSaves(saves)) return null; updateGpxSavedList(); if (options.download) { var blob = new Blob([gpxContent], { type: "application/gpx+xml" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "giloa_" + name + ".gpx"; a.click(); URL.revokeObjectURL(url); } return id; }
function exportGpx() {
    // Drain the foreground service first so points recorded while the screen
    // was off are included in the selected historical window.
    consumeNativeRouteTrackingPoints();
    var now = Date.now();
    var sinceMs = now - dialHours * 60 * 60 * 1000;
    var filtered = rawGpsPoints.filter(function(point) {
        var start = Number(point.startTime);
        var end = Number(point.endTime || point.startTime);
        return isFinite(start) && isFinite(end) && end >= sinceMs && start <= now;
    }).sort(function(a, b) { return Number(a.startTime) - Number(b.startTime); });
    if (filtered.length < 2) {
        alert(earlyUiText(filtered.length ? "gpxTooFew" : "gpxNoRoute"));
        return;
    }
    var nameInput = document.getElementById("gpx-export-name").value.trim();
    var name = nameInput || earlyUiText("recentRoute", { hours:dialHours });
    if (!saveGpxRecord(name, filtered, { download: true })) { document.getElementById("gpx-import-status").textContent = getGpxImportText().storage; return; }
    document.getElementById("gpx-export-name").value = "";
    document.getElementById("gpx-import-status").textContent = earlyUiText("gpxSaved", { name:name, count:filtered.length });
}
function loadGpxSaves() { try { return JSON.parse(localStorage.getItem(GPX_SAVES_KEY) || "[]"); } catch(e) { return []; } }
function saveGpxSaves(saves) {
    try { localStorage.setItem(GPX_SAVES_KEY, JSON.stringify(saves)); return true; }
    catch (error) { console.warn("GPX save failed", error && error.name); return false; }
}
function updateGpxSavedList() { var container = document.getElementById("gpx-saved-list"); if (!container) return; var t = UI_TEXT[currentLang] || UI_TEXT.ko; var saves = loadGpxSaves(); if (saves.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(t.gpx_empty) + '</p>'; return; } container.innerHTML = ""; saves.slice().reverse().forEach(function(s) { var item = document.createElement("div"); item.className = "gpx-saved-item" + (s.id === activeGpxId ? " active-route" : ""); var icon = document.createElement("span"); icon.className = "gpx-saved-icon"; icon.textContent = s.id === activeGpxId ? t.gpx_showing : t.gpx_route; var info = document.createElement("div"); info.className = "gpx-saved-info"; var nameEl = document.createElement("div"); nameEl.className = "gpx-saved-name"; nameEl.textContent = s.name; var meta = document.createElement("div"); meta.className = "gpx-saved-meta"; meta.textContent = new Date(s.createdAt).toLocaleDateString(currentLang) + " · " + s.pointCount + " " + t.gpx_points; info.appendChild(nameEl); info.appendChild(meta); var del = document.createElement("div"); del.className = "gpx-saved-del"; del.textContent = t.gpx_delete; del.addEventListener("click", function(e) { e.stopPropagation(); deleteGpxSave(s.id); }); item.appendChild(icon); item.appendChild(info); item.appendChild(del); item.addEventListener("click", function() { toggleGpxRoute(s); }); container.appendChild(item); }); }
function deleteGpxSave(id) { if (id === activeGpxId) clearActiveGpxRoute(); saveGpxSaves(loadGpxSaves().filter(function(s) { return s.id !== id; })); updateGpxSavedList(); }
function toggleGpxRoute(save) { if (activeGpxId === save.id) { clearActiveGpxRoute(); updateGpxSavedList(); return; } clearActiveGpxRoute(); drawGpxRoute(save.gpxContent, save.id); updateGpxSavedList(); toggleSidebar(false); }
function clearActiveGpxRoute() { activeGpxLayers.forEach(function(l) { map.removeLayer(l); }); activeGpxLayers = []; activeGpxId = null; }
function drawGpxRoute(gpxContent, id) {
    var xmlDoc = new DOMParser().parseFromString(gpxContent, "application/xml");
    var segmentNodes = Array.from(xmlDoc.querySelectorAll("trkseg"));
    if (!segmentNodes.length) segmentNodes = [xmlDoc];
    var segmentLatLngs = segmentNodes.map(function(segmentNode) {
        return Array.from(segmentNode.querySelectorAll("trkpt, rtept")).map(function(point) {
            var lat = parseFloat(point.getAttribute("lat"));
            var lng = parseFloat(point.getAttribute("lon"));
            return isFinite(lat) && isFinite(lng) ? [lat, lng] : null;
        }).filter(Boolean);
    }).filter(function(segment) { return segment.length > 0; });
    if (!segmentLatLngs.length) return;
    var layers = [];
    segmentLatLngs.forEach(function(latlngs) {
        if (latlngs.length > 1) layers.push(L.polyline(latlngs, { color:"#4db8ff", weight:4, opacity:0.85, dashArray:"8, 6" }).addTo(map));
    });
    var first = segmentLatLngs[0][0];
    var lastSegment = segmentLatLngs[segmentLatLngs.length - 1];
    var last = lastSegment[lastSegment.length - 1];
    layers.push(L.circleMarker(first, { radius:7, color:"#4db8ff", fillColor:"#fff", fillOpacity:1, weight:2.5 }).addTo(map).bindTooltip(earlyUiText("departure")));
    layers[layers.length - 1].giloaRouteEndpoint = "departure";
    layers.push(L.circleMarker(last, { radius:7, color:"#ff6b6b", fillColor:"#fff", fillOpacity:1, weight:2.5 }).addTo(map).bindTooltip(earlyUiText("arrival")));
    layers[layers.length - 1].giloaRouteEndpoint = "arrival";
    activeGpxLayers = layers;
    activeGpxId = id;
    var bounds = L.latLngBounds([]);
    segmentLatLngs.forEach(function(segment) { segment.forEach(function(latlng) { bounds.extend(latlng); }); });
    if (bounds.isValid()) map.fitBounds(bounds, { padding:[50, 50] });
}
function getGpxImportText() {
    var text = {
        ko:{ loading:"불러오는 중...", tooLarge:"GPX 파일은 10MB 이하만 불러올 수 있습니다.", invalid:"올바른 GPX 경로 파일이 아닙니다.", noRoute:"경로 좌표가 없습니다.", storage:"저장 공간이 부족해 GPX를 저장하지 못했습니다.", done:"불러오기 완료", read:"파일을 읽지 못했습니다." },
        en:{ loading:"Importing...", tooLarge:"GPX files must be 10MB or smaller.", invalid:"This is not a valid GPX route file.", noRoute:"No route coordinates were found.", storage:"Not enough storage to save this GPX file.", done:"Import complete", read:"Could not read the file." },
        ja:{ loading:"読み込み中...", tooLarge:"GPXファイルは10MB以下にしてください。", invalid:"有効なGPXルートファイルではありません。", noRoute:"ルート座標がありません。", storage:"保存容量が不足してGPXを保存できません。", done:"読み込み完了", read:"ファイルを読み込めませんでした。" },
        zh:{ loading:"正在导入...", tooLarge:"GPX文件必须小于或等于10MB。", invalid:"这不是有效的GPX路线文件。", noRoute:"未找到路线坐标。", storage:"存储空间不足，无法保存GPX。", done:"导入完成", read:"无法读取文件。" },
        es:{ loading:"Importando...", tooLarge:"El archivo GPX debe tener 10 MB o menos.", invalid:"No es un archivo de ruta GPX válido.", noRoute:"No se encontraron coordenadas de ruta.", storage:"No hay espacio suficiente para guardar el GPX.", done:"Importación completada", read:"No se pudo leer el archivo." },
        fr:{ loading:"Importation...", tooLarge:"Le fichier GPX doit faire 10 Mo maximum.", invalid:"Ce fichier de parcours GPX n’est pas valide.", noRoute:"Aucune coordonnée de parcours trouvée.", storage:"Espace insuffisant pour enregistrer le GPX.", done:"Importation terminée", read:"Impossible de lire le fichier." }
    };
    return text[currentLang] || text.ko;
}
function importGpxFile(event) {
    var file = event.target.files[0]; if (!file) return;
    var statusEl = document.getElementById("gpx-import-status"); var text = getGpxImportText();
    if (file.size > GPX_IMPORT_MAX_BYTES) { statusEl.textContent = text.tooLarge; event.target.value = ""; return; }
    statusEl.textContent = text.loading;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var name = file.name.replace(/\.gpx$/i, ""); var gpxContent = String(e.target.result || "");
            var xmlDoc = new DOMParser().parseFromString(gpxContent, "application/xml");
            if (xmlDoc.querySelector("parsererror")) { statusEl.textContent = text.invalid; return; }
            var routePoints = Array.from(xmlDoc.querySelectorAll("trkpt, rtept")).filter(function(point) {
                var lat = parseFloat(point.getAttribute("lat")); var lng = parseFloat(point.getAttribute("lon"));
                return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            });
            if (!routePoints.length) { statusEl.textContent = text.noRoute; return; }
            var saves = loadGpxSaves(); var id = String(Date.now());
            saves.push({ id:id, name:name, createdAt:Date.now(), pointCount:routePoints.length, gpxContent:gpxContent });
            if (!saveGpxSaves(saves)) { statusEl.textContent = text.storage; return; }
            clearActiveGpxRoute(); drawGpxRoute(gpxContent, id); updateGpxSavedList();
            statusEl.textContent = '"' + name + '" ' + text.done; toggleSidebar(false);
        } catch (err) { statusEl.textContent = text.read; console.error(err); }
    };
    reader.onerror = function() { statusEl.textContent = text.read; };
    reader.readAsText(file); event.target.value = "";
}
function toggleSidebar(forceOpen) { var sidebar = document.getElementById("sidebar"); var overlay = document.getElementById("sidebar-overlay"); if (!sidebar || !overlay) return; var willOpen = typeof forceOpen === "boolean" ? forceOpen : !sidebar.classList.contains("open"); sidebar.classList.toggle("open", willOpen); overlay.classList.toggle("show", willOpen); }
function openGiloaSources(event) {
    if (event) event.preventDefault();
    var modal = document.getElementById("giloa-sources");
    if (!modal) return false;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    toggleSidebar(false);
    var closeButton = modal.querySelector(".giloa-sources-head button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
function closeGiloaSources() {
    var modal = document.getElementById("giloa-sources");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}
document.addEventListener("keydown", function(event) { if (event.key === "Escape") { closeGiloaSources(); closeGiloaInfoPage(); closeGiloaShare(); } });
function openGiloaInfoPage(key, event) {
    if (event) event.preventDefault();
    if (key === "about") return openGiloaStoryHub(event);
    var modal = document.getElementById("giloa-info");
    if (!modal || (key !== "account" && key !== "privacy")) return false;
    var lang = normalizeLang(currentLang);
    var copy = (GILOA_INFO_COPY[lang] || GILOA_INFO_COPY.ko)[key];
    document.getElementById("giloa-info-kicker").textContent = copy.kicker;
    document.getElementById("giloa-info-title").textContent = copy.title;
    document.getElementById("giloa-info-intro").textContent = copy.intro;
    var list = document.getElementById("giloa-info-list");
    list.innerHTML = "";
    copy.items.forEach(function(item) {
        var article = document.createElement("article");
        var title = document.createElement("strong");
        var body = document.createElement("span");
        title.textContent = item[0]; body.textContent = item[1];
        article.appendChild(title); article.appendChild(body); list.appendChild(article);
    });
    toggleSidebar(false);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    var closeButton = modal.querySelector("button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
var GILOA_INFO_COPY = Object.freeze({
    ko: { account: { kicker: "ACCOUNT SAFETY", title: "계정 보호", intro: "길로아는 별도 회원 계정을 만들거나 로그인하지 않아도 사용할 수 있습니다.", items: [["기록은 내 기기에", "사진, 기억, 이동 경로와 성장 기록은 기본적으로 이 기기에 저장됩니다."], ["기기 잠금", "다른 사람이 기기를 함께 사용한다면 휴대폰의 화면 잠금과 운영체제 보안 기능을 사용해 주세요."], ["공유 전 확인", "화면·사진·GPX 파일을 다른 사람에게 보내기 전에는 위치와 개인 메모가 포함되는지 확인해 주세요."]] }, privacy: { kicker: "PRIVACY", title: "프라이버시", intro: "길로아는 사용자가 자신의 기록과 위치 사용을 직접 통제할 수 있도록 설계되었습니다.", items: [["위치 기록", "GPS 경로 기록은 사용자가 시작과 중단을 직접 선택할 수 있으며, 기록은 이 기기에 저장됩니다."], ["사진과 기억", "사진 촬영 위치와 개인 메모는 지도 기록에 사용될 수 있으므로 공유 전에 내용을 확인해 주세요."], ["주변 정보 조회", "주변 장소와 지도 정보를 표시하기 위해 현재 지도 범위 또는 위치와 관련된 공개 데이터 조회가 이루어질 수 있습니다."]] } },
    en: { account: { kicker: "ACCOUNT SAFETY", title: "Account Safety", intro: "Giloa can be used without creating a separate member account or signing in.", items: [["Records stay on your device", "Photos, memories, routes and growth records are stored on this device by default."], ["Device lock", "If others use your device, protect it with your phone's screen lock and operating-system security."], ["Check before sharing", "Before sharing a screen, photo or GPX file, check whether it includes location or personal notes."]] }, privacy: { kicker: "PRIVACY", title: "Privacy", intro: "Giloa is designed to let you control how your records and location are used.", items: [["Location records", "You choose when GPS recording starts and stops, and the record is stored on this device."], ["Photos and memories", "Photo locations and personal notes can appear in map records, so review them before sharing."], ["Nearby information", "Public-data requests may use the current map area or location to show nearby places and map information."]] } },
    ja: { account: { kicker: "ACCOUNT SAFETY", title: "アカウント保護", intro: "Giloaは、別途会員アカウントの作成やログインなしで利用できます。", items: [["記録は端末内に保存", "写真、思い出、移動経路、成長記録は基本的にこの端末に保存されます。"], ["端末のロック", "他の人と端末を共有する場合は、画面ロックとOSのセキュリティ機能を利用してください。"], ["共有前の確認", "画面、写真、GPXファイルを共有する前に、位置情報や個人メモが含まれていないか確認してください。"]] }, privacy: { kicker: "PRIVACY", title: "プライバシー", intro: "Giloaは、記録と位置情報の利用をユーザー自身が管理できるよう設計されています。", items: [["位置記録", "GPS記録の開始と停止はユーザーが選択し、記録はこの端末に保存されます。"], ["写真と思い出", "写真の位置と個人メモは地図記録に表示されることがあるため、共有前に確認してください。"], ["周辺情報の検索", "周辺の場所と地図情報を表示するため、現在の地図範囲または位置に関する公開データ照会が行われることがあります。"]] } },
    zh: { account: { kicker: "ACCOUNT SAFETY", title: "账户保护", intro: "无需创建单独的会员账户或登录即可使用 Giloa。", items: [["记录保存在设备上", "照片、记忆、行程和成长记录默认保存在此设备上。"], ["设备锁定", "若他人会使用您的设备，请使用手机屏幕锁和操作系统安全功能。"], ["分享前确认", "分享屏幕、照片或 GPX 文件前，请确认其中是否包含位置或个人备注。"]] }, privacy: { kicker: "PRIVACY", title: "隐私", intro: "Giloa 的设计让您能够自行控制记录和位置的使用方式。", items: [["位置记录", "您可以自行选择开始或停止 GPS 记录，记录将保存在此设备上。"], ["照片和记忆", "照片位置和个人备注可能显示在地图记录中，分享前请先确认。"], ["附近信息", "为了显示附近地点和地图信息，公开数据查询可能会使用当前地图范围或位置。"]] } }
});
function closeGiloaInfoPage() {
    var modal = document.getElementById("giloa-info");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}
function openGiloaStoryHub(event) {
    if (event) event.preventDefault();
    var hub = document.getElementById("giloa-story-hub");
    if (!hub) return false;
    toggleSidebar(false);
    hub.hidden = false;
    hub.setAttribute("aria-hidden", "false");
    var closeButton = hub.querySelector("header button");
    if (closeButton) setTimeout(function() { closeButton.focus(); }, 0);
    return false;
}
function closeGiloaStoryHub() {
    var hub = document.getElementById("giloa-story-hub");
    if (!hub) return;
    hub.hidden = true;
    hub.setAttribute("aria-hidden", "true");
}
document.addEventListener("keydown", function(event) {
    if (event.key !== "Escape") return;
    closeGiloaStoryHub();
    dismissGiloaUpdateNotice();
});
function replayGiloaStoryFromHub() { closeGiloaStoryHub(); return replayGiloaStory(); }
function dismissGiloaUpdateNotice() {
    var notice = document.getElementById("giloa-update-notice");
    if (!notice || notice.hidden) return;
    safeStorageSet(GILOA_UPDATE_SEEN_KEY, "1");
    notice.hidden = true;
    notice.setAttribute("aria-hidden", "true");
    document.body.classList.remove("giloa-update-open");
    persistDurableStorageSnapshot();
}
function showGiloaUpdateNoticeIfNeeded() {
    if (safeStorageGet(GILOA_UPDATE_SEEN_KEY) === "1") return false;
    if (safeStorageGet(INTRO_STORY_SEEN_KEY) !== "true") return false;
    var notice = document.getElementById("giloa-update-notice");
    if (!notice) return false;
    notice.hidden = false;
    notice.setAttribute("aria-hidden", "false");
    document.body.classList.add("giloa-update-open");
    return true;
}
function applyInfoLinkLanguage(lang) {
    var labels = {
        ko: { account: "계정 보호", privacy: "프라이버시", about: "길로아 이야기" },
        en: { account: "Account Safety", privacy: "Privacy", about: "About Giloa" },
        ja: { account: "アカウント保護", privacy: "プライバシー", about: "ギロアについて" },
        zh: { account: "账户保护", privacy: "隐私", about: "关于 Giloa" },
        es: { account: "Seguridad de la cuenta", privacy: "Privacidad", about: "Acerca de Giloa" },
        fr: { account: "Sécurité du compte", privacy: "Confidentialité", about: "À propos de Giloa" }
    };
    var text = labels[normalizeLang(lang)] || labels.ko;
    Object.keys(text).forEach(function(key) {
        var link = document.getElementById("info-link-" + key);
        if (!link) return;
        link.textContent = text[key];
        link.setAttribute("aria-label", text[key]);
    });
}
function centerMap() { focusCurrentLocation(); }
// 위치 버튼을 길게 누르면 기록 상태는 건드리지 않고 위치만 다시 맞춘다.
var suppressRecToggle = false;
function toggleLocationRecording() {
    if (suppressRecToggle) {
        suppressRecToggle = false;
        return;
    }

    /*
     * 기록 중이면 즉시 중단한다.
     */
    if (isRecording) {
        toggleRecording();
        return;
    }

    /*
     * 새 기록은 안내창에서 사용자가
     * 시작을 선택한 뒤에만 실행한다.
     */
    showAutoRecordingNotice();
}

(function bindLocationLongPress() {
    var button = document.getElementById("rec-btn");
    if (!button) return;
    var timer = null;
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    button.addEventListener("pointerdown", function() {
        cancel();
        timer = setTimeout(function() {
            timer = null;
            suppressRecToggle = true;
            if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
            focusCurrentLocation();
        }, 600);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function(name) { button.addEventListener(name, cancel); });
})();
var persistentStateDirty = false;
var lastCheckpointAt = 0;
function markJourneyStateDirty() { persistentStateDirty = true; }
function scheduleSave() {
    markJourneyStateDirty();
    if (saveTimer !== null) return;
    var delay = Math.max(SAVE_DELAY_MS, CHECKPOINT_INTERVAL_MS - Math.max(0, Date.now() - lastCheckpointAt));
    saveTimer = setTimeout(function() {
        saveTimer = null;
        if (!persistentStateDirty || !giloaPersistentStateReady) return;
        compactPathData();
        persistState();
    }, delay);
}
function getLocalStorageKey() { return STORAGE_KEY; }
function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return new Blob([], { type: "image/jpeg" });
    var match = parts[0].match(/data:([^;]+);base64/i);
    var mime = match ? match[1] : "image/jpeg";
    var binary = atob(parts[1]);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
function blobToDataUrl(blob) {
    return new Promise(function(resolve, reject) {
        if (!blob) { reject(new Error("Missing photo blob")); return; }
        var reader = new FileReader();
        reader.onload = function() { resolve(String(reader.result || "")); };
        reader.onerror = function() { reject(reader.error || new Error("Could not read photo")); };
        reader.readAsDataURL(blob);
    });
}
function getPhotoStoragePath(photoId, kind) {
    return "giloaUsers/" + encodeURIComponent(currentUserId) + "/photos/" + encodeURIComponent(photoId) + "/" + kind + ".jpg";
}
async function fetchBlobFromUrl(url) {
    if (!url) return null;
    try {
        var response = await fetch(url);
        if (response.ok) return await response.blob();
    } catch (_) { }
    var viaXhr = await xhrBlobFromUrl(url);
    if (viaXhr) return viaXhr;
    throw new Error(earlyUiText("photoFileMissing"));
}
async function uploadPhotoRemote(data, options) {
    return Promise.resolve();
}
function deleteRemotePhotoFiles(photo) {
    return;
}
function normalizeUserId(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64); }
function userIdToAuthEmail(userId) { return normalizeUserId(userId) + "@giloa.app"; }
function authEmailToUserId(email) {
    var value = String(email || "").toLowerCase();
    var suffix = "@giloa.app";
    return value.endsWith(suffix) ? normalizeUserId(value.slice(0, -suffix.length)) : "";
}
function getAuthErrorMessage(error) {
    var code = error && error.code;
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return earlyUiText("authPassword");
    if (code === "auth/invalid-email") return earlyUiText("authId");
    if (code === "auth/network-request-failed") return earlyUiText("authNetwork");
    if (code === "auth/weak-password") return earlyUiText("authWeak");
    if (code === "auth/operation-not-allowed") return earlyUiText("authUnavailable");
    if (code === "auth/too-many-requests") return earlyUiText("authTooMany");
    return earlyUiText("authFailed");
}
function getAuthDebugMessage(error) {
    var code = error && error.code ? error.code : "unknown";
    var message = error && error.message ? error.message : String(error || "");
    return getAuthErrorMessage(error) + "\n\n" + earlyUiText("errorCode") + ": " + code + "\n" + message;
}
async function signInWithGiloaId(userId, password) {
    currentUserId = normalizeUserId(userId) || "local";
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
}
function waitForAuthReady() {
    return Promise.resolve(null);
}
function askUserId(defaultValue) {
    return new Promise(function(resolve) {
        var modal = document.getElementById("user-id-modal");
        var input = document.getElementById("user-id-input");
        var passwordInput = document.getElementById("user-password-input");
        var errorEl = document.getElementById("user-id-error");
        var submit = document.getElementById("user-id-submit");
        if (!modal || !input || !passwordInput || !submit) {
            resolve({ userId: defaultValue || "", password: "" });
            return;
        }
        input.value = defaultValue || "";
        passwordInput.value = "";
        passwordInput.style.display = "none";
        if (errorEl) errorEl.textContent = "";
        modal.classList.add("show");
        setTimeout(function() { input.focus(); input.select(); }, 60);
        function done() {
            var value = normalizeUserId(input.value);
            if (!value) {
                input.focus();
                return;
            }
            submit.removeEventListener("click", done);
            input.removeEventListener("keydown", onKeyDown);
            passwordInput.removeEventListener("keydown", onKeyDown);
            modal.classList.remove("show");
            resolve({ userId: value, password: "" });
        }
        function onKeyDown(e) {
            if (e.key === "Enter") done();
        }
        submit.addEventListener("click", done);
        input.addEventListener("keydown", onKeyDown);
        passwordInput.addEventListener("keydown", onKeyDown);
    });
}
async function ensureUserId() {
    currentUserId = "local";
}
function syncUserIdUI() {
    var idEl = document.getElementById("hud-user-id");
    if (idEl) idEl.textContent = currentUserId || earlyUiText("noId");
}
async function changeUserId() {
    var credentials = await askUserId(currentUserId || "");
    var nextId = normalizeUserId(credentials.userId);
    if (!nextId || nextId === currentUserId) return;
    try {
        await signInWithGiloaId(nextId, credentials.password);
    } catch (error) {
        alert(getAuthDebugMessage(error));
        return;
    }
    currentUserId = nextId;
    localStorage.setItem(USER_ID_KEY, currentUserId);
    syncUserIdUI();
    pathCoordinates = [];
    rawGpsPoints = [];
    memories = [];
    specialPlacePins = [];
    photos = [];
    deletedJourneyRecords = { memories: [], photos: [] };
    totalDistance = 0;
    memoryMarkers.forEach(function(marker) { map.removeLayer(marker); });
    memoryMarkers.clear();
    specialPlaceMarkers.forEach(function(marker) { map.removeLayer(marker); });
    specialPlaceMarkers.clear();
    closeSpecialPlacePopup();
    if (photoClusterGroup) { photoClusterGroup.clearLayers(); clearPhotoMarkerIndex(); }
    clearActiveGpxRoute();
    loadState();
    renderStoredMarkers();
    renderStoredPhotoMarkers();
    updateStats();
    updateMemoryList();
    updatePhotoList();
    scheduleRender();
}
function buildStatePayload() {
    return {
        deletedJourneyRecords: mergeJourneyDeletionRecords([deletedJourneyRecords]),
        rawGpsPoints: rawGpsPoints.map(function(p) { return { id:p.id, lat:p.lat, lng:p.lng, startTime:p.startTime, endTime:p.endTime, timestamp:Number(p.timestamp || p.startTime), visits:p.visits || 1, accuracy:Number(p.accuracy), recordingSessionId:typeof p.recordingSessionId === "string" ? p.recordingSessionId : null, source:typeof p.source === "string" ? p.source : null }; }),
        pathCoordinates: pathCoordinates.map(function(p) { return { lat: p.lat, lng: p.lng, startTime: p.startTime, endTime: p.endTime, timestamp: Number(p.timestamp || p.startTime), visits: p.visits || 1, accuracy: p.accuracy == null ? null : (isFinite(p.accuracy) ? Number(p.accuracy) : null), recordingSessionId:typeof p.recordingSessionId === "string" ? p.recordingSessionId : null, source:typeof p.source === "string" ? p.source : null }; }),
        memories: memories.map(function(m) { return { id: m.id, lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: m.timeString }; }),
        specialPlacePins: specialPlacePins.map(function(pin) { return { id: pin.id, latitude: pin.latitude, longitude: pin.longitude, note: pin.note, createdAt: pin.createdAt }; }),
        photos: photos.map(function(p) {
            var hasLocation = isValidPhotoCoordinate(p.lat, p.lng);
            return {
                id: p.id,
                lat: hasLocation ? Number(p.lat) : null,
                lng: hasLocation ? Number(p.lng) : null,
                time: p.time,
                dateString: p.dateString,
                timeString: p.timeString,
                memo: typeof p.memo === "string" ? p.memo : "",
                emotion: typeof p.emotion === "string" ? p.emotion : "",
                missionId: typeof p.missionId === "string" ? p.missionId : "",
                placeId: typeof p.placeId === "string" ? p.placeId : "",
                sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                locationSource: normalizePhotoLocationSource(p.locationSource, hasLocation),
                locationAccuracy: typeof p.locationAccuracy === "number" && isFinite(p.locationAccuracy) ? Number(p.locationAccuracy) : null,
                heading: isFinite(p.heading) ? normalizeHeading(p.heading) : null,
                remotePhotoUrl: typeof p.remotePhotoUrl === "string" ? p.remotePhotoUrl : "",
                remoteThumbUrl: typeof p.remoteThumbUrl === "string" ? p.remoteThumbUrl : "",
                storagePath: typeof p.storagePath === "string" ? p.storagePath : "",
                thumbStoragePath: typeof p.thumbStoragePath === "string" ? p.thumbStoragePath : "",
                imagePrediction: p.imagePrediction && typeof p.imagePrediction === "object" ? {
                    label: typeof p.imagePrediction.label === "string" ? p.imagePrediction.label : "",
                    probability: isFinite(p.imagePrediction.probability) ? p.imagePrediction.probability : 0,
                    percent: isFinite(p.imagePrediction.percent) ? p.imagePrediction.percent : 0,
                    accepted: !!p.imagePrediction.accepted,
                    badgeId: typeof p.imagePrediction.badgeId === "string" ? p.imagePrediction.badgeId : ""
                } : null
            };
        }),
        totalDistance: totalDistance,
        recordingSessionId: isRecording && typeof recordingSessionId === "string" ? recordingSessionId : null,
        recordingSessionStartedAt: isRecording && isFinite(recordingSessionStartedAt) ? Number(recordingSessionStartedAt) : 0,
        recordingSessionActive: !!isRecording
    };
}
function isValidJourneyPoint(point, requireAccuracy) {
    if (!point || !isFinite(point.lat) || !isFinite(point.lng)) return false;
    var lat = Number(point.lat), lng = Number(point.lng);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    var timestamp = Number(point.timestamp || point.startTime);
    if (!isFinite(timestamp) || timestamp <= 0) return false;
    if (requireAccuracy && (!isFinite(point.accuracy) || Number(point.accuracy) < 0 || Number(point.accuracy) > MAX_ACCURACY_M)) return false;
    return true;
}
function journeyPointKey(point) {
    return Number(point.timestamp || point.startTime) + ":" + Number(point.lat).toFixed(6) + ":" + Number(point.lng).toFixed(6);
}
function mergeJourneyPointLists(lists, requireAccuracy) {
    var merged = [];
    var seen = {};
    (lists || []).forEach(function(list) {
        (Array.isArray(list) ? list : []).forEach(function(point) {
            if (!isValidJourneyPoint(point, requireAccuracy)) return;
            var timestamp = Number(point.timestamp || point.startTime);
            var key = journeyPointKey(point);
            if (seen[key]) return;
            seen[key] = true;
            merged.push(Object.assign({}, point, {
                lat:Number(point.lat), lng:Number(point.lng),
                startTime:Number(point.startTime || timestamp), endTime:Number(point.endTime || timestamp), timestamp:timestamp,
                visits:isFinite(point.visits) ? Number(point.visits) : 1,
                accuracy:isFinite(point.accuracy) ? Number(point.accuracy) : null,
                recordingSessionId:typeof point.recordingSessionId === "string" && point.recordingSessionId ? point.recordingSessionId : null,
                source:typeof point.source === "string" && point.source ? point.source : null
            }));
        });
    });
    merged.sort(function(a, b) { return a.timestamp - b.timestamp; });
    return merged;
}
function mergeJourneyEntities(lists) {
    var result = [];
    var seen = {};
    (lists || []).forEach(function(list) {
        (Array.isArray(list) ? list : []).forEach(function(item) {
            if (!item || typeof item !== "object") return;
            var key = String(item.id || item.visitKey || item.createdAt || item.time || JSON.stringify(item));
            if (seen[key]) return;
            seen[key] = true;
            result.push(item);
        });
    });
    return result;
}
function journeyPayloadPointCount(payload) {
    if (!payload || typeof payload !== "object") return 0;
    return Math.max(Array.isArray(payload.rawGpsPoints) ? payload.rawGpsPoints.length : 0, Array.isArray(payload.pathCoordinates) ? payload.pathCoordinates.length : 0);
}
function journeyPayloadRecordCounts(payload) {
    payload = payload || {};
    return {
        points:journeyPayloadPointCount(payload),
        memories:Array.isArray(payload.memories) ? payload.memories.length : 0,
        photos:Array.isArray(payload.photos) ? payload.photos.length : 0,
        specialPlaces:Array.isArray(payload.specialPlacePins) ? payload.specialPlacePins.length : 0
    };
}
function mergeJourneyDeletionRecords(records) {
    var merged = { memories: [], photos: [] };
    Object.keys(merged).forEach(function(kind) {
        var seen = new Set();
        (records || []).forEach(function(record) {
            var ids = record && Array.isArray(record[kind]) ? record[kind] : [];
            ids.forEach(function(id) {
                if (typeof id !== "string" || !id || seen.has(id)) return;
                seen.add(id); merged[kind].push(id);
            });
        });
    });
    return merged;
}
function journeyEntityId(item, kind) {
    if (!item) return null;
    // Match applyStatePayload's legacy memory ID migration before comparison.
    if (kind === "memories") return typeof item.id === "string" ? item.id : String(item.time);
    return item.id == null ? null : String(item.id);
}
function filterDeletedJourneyEntities(items, ids, kind) {
    var deleted = new Set(ids || []);
    return (Array.isArray(items) ? items : []).filter(function(item) {
        return !deleted.has(journeyEntityId(item, kind));
    });
}
function commitJourneyDeletion(kind, id) {
    if (kind !== "memories" && kind !== "photos") return false;
    var before = kind === "photos" ? photos : memories;
    if (!before.some(function(item) { return item.id === id; })) return false;
    var beforeDeletion = buildStatePayload();
    var previousDeletions = deletedJourneyRecords;
    var previousPending = safeStorageGet(STORAGE_TEMP_KEY);
    deletedJourneyRecords = mergeJourneyDeletionRecords([previousDeletions]);
    deletedJourneyRecords[kind].push(String(id));
    var remaining = before.filter(function(item) { return item.id !== id; });
    if (kind === "photos") photos = remaining; else memories = remaining;
    // Commit the specific deletion before touching any original image or marker.
    if (persistState({ beforeExplicitDeletion: beforeDeletion })) return true;
    if (kind === "photos") photos = before; else memories = before;
    deletedJourneyRecords = previousDeletions;
    if (safeStorageGet(STORAGE_TEMP_KEY) !== previousPending) {
        safeStorageSet(STORAGE_TEMP_KEY, previousPending || "");
    }
    alert((UI_TEXT[currentLang] || UI_TEXT.ko).journey_delete_save_failed);
    return false;
}
function hasJourneyRecordRegression(previous, next) {
    var before = journeyPayloadRecordCounts(previous);
    var after = journeyPayloadRecordCounts(next);
    if (after.points < before.points || after.specialPlaces < before.specialPlaces) return true;
    var oldRaw = Array.isArray(previous.rawGpsPoints) ? previous.rawGpsPoints : [];
    var newRaw = Array.isArray(next.rawGpsPoints) ? next.rawGpsPoints : [];
    if (newRaw.length < oldRaw.length) {
        var rawKeys = new Set(newRaw.filter(function(point) { return isValidJourneyPoint(point, true); }).map(journeyPointKey));
        if (oldRaw.some(function(point) { return isValidJourneyPoint(point, true) && !rawKeys.has(journeyPointKey(point)); })) return true;
    }
    var deletions = mergeJourneyDeletionRecords([next && next.deletedJourneyRecords]);
    return ["memories", "photos"].some(function(kind) {
        var oldItems = Array.isArray(previous[kind]) ? previous[kind] : [];
        var newItems = Array.isArray(next[kind]) ? next[kind] : [];
        var remaining = new Set(newItems.map(function(item) { return journeyEntityId(item, kind); }));
        var deleted = new Set(deletions[kind]);
        var intentional = 0;
        var unexpected = oldItems.some(function(item) {
            var id = journeyEntityId(item, kind);
            if (id === null || remaining.has(id)) return false;
            if (!deleted.has(id)) return true;
            intentional += 1;
            return false;
        });
        return unexpected || after[kind] < before[kind] - intentional;
    });
}
function mergeJourneyStatePayloads(payloads) {
    var valid = (payloads || []).filter(function(payload) { return payload && typeof payload === "object" && !Array.isArray(payload); });
    if (!valid.length) return null;
    valid.sort(function(a, b) {
        var countDiff = journeyPayloadPointCount(b) - journeyPayloadPointCount(a);
        if (countDiff) return countDiff;
        return (Number(b.totalDistance) || 0) - (Number(a.totalDistance) || 0);
    });
    var merged = Object.assign({}, valid[0]);
    merged.pathCoordinates = mergeJourneyPointLists(valid.map(function(p) { return p.pathCoordinates; }), false);
    merged.rawGpsPoints = mergeJourneyPointLists(valid.map(function(p) { return p.rawGpsPoints; }), true);
    merged.memories = mergeJourneyEntities(valid.map(function(p) { return p.memories; }));
    merged.specialPlacePins = mergeJourneyEntities(valid.map(function(p) { return p.specialPlacePins; }));
    merged.photos = mergeJourneyEntities(valid.map(function(p) { return p.photos; }));
    merged.deletedJourneyRecords = mergeJourneyDeletionRecords(valid.map(function(p) { return p.deletedJourneyRecords; }));
    merged.memories = filterDeletedJourneyEntities(merged.memories, merged.deletedJourneyRecords.memories, "memories");
    merged.photos = filterDeletedJourneyEntities(merged.photos, merged.deletedJourneyRecords.photos, "photos");
    merged.totalDistance = valid.reduce(function(maximum, payload) {
        var value = Number(payload.totalDistance);
        return isFinite(value) && value >= 0 ? Math.max(maximum, value) : maximum;
    }, 0);
    return merged;
}
function applyStatePayload(saved) {
    if (!saved || typeof saved !== "object") return false;
    deletedJourneyRecords = mergeJourneyDeletionRecords([saved.deletedJourneyRecords]);
    saved = Object.assign({}, saved);
    if (Array.isArray(saved.memories)) saved.memories = filterDeletedJourneyEntities(saved.memories, deletedJourneyRecords.memories, "memories");
    if (Array.isArray(saved.photos)) saved.photos = filterDeletedJourneyEntities(saved.photos, deletedJourneyRecords.photos, "photos");
    if (Array.isArray(saved.pathCoordinates)) {
        pathCoordinates = saved.pathCoordinates.filter(function(p) { return isFinite(p.lat) && isFinite(p.lng) && isFinite(p.startTime) && isFinite(p.endTime); }).map(function(p) { return { lat: Number(p.lat), lng: Number(p.lng), startTime: Number(p.startTime), endTime: Number(p.endTime), timestamp: Number(p.timestamp || p.startTime), visits: isFinite(p.visits) ? Number(p.visits) : 1, accuracy: p.accuracy == null ? null : (isFinite(p.accuracy) ? Number(p.accuracy) : null), recordingSessionId:typeof p.recordingSessionId === "string" && p.recordingSessionId ? p.recordingSessionId : null, source:typeof p.source === "string" && p.source ? p.source : null }; });
    }
    rawGpsPoints = mergeJourneyPointLists([saved.rawGpsPoints], true).map(function(p) { p.id = String(p.id || (p.timestamp + ":" + p.lat.toFixed(7) + ":" + p.lng.toFixed(7))); return p; });
    if (saved.recordingSessionActive === true && typeof saved.recordingSessionId === "string" && saved.recordingSessionId) recordingSessionId = saved.recordingSessionId;
    if (saved.recordingSessionActive === true && isFinite(saved.recordingSessionStartedAt) && Number(saved.recordingSessionStartedAt) > 0) recordingSessionStartedAt = Number(saved.recordingSessionStartedAt);
    if (Array.isArray(saved.memories)) {
        memories = saved.memories.filter(function(m) { return isFinite(m.lat) && isFinite(m.lng) && typeof m.name === "string"; }).map(function(m) { return { id: typeof m.id === "string" ? m.id : String(m.time), lat: m.lat, lng: m.lng, name: m.name, time: m.time, dateString: m.dateString, timeString: typeof m.timeString === "string" ? m.timeString : new Date(m.time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }; });
    }
    if (Array.isArray(saved.specialPlacePins)) specialPlacePins = saved.specialPlacePins.filter(function(pin) {
        return pin && typeof pin.id === "string" && isFinite(pin.latitude) && isFinite(pin.longitude) &&
            typeof pin.note === "string" && pin.note.trim() && !isNaN(Date.parse(pin.createdAt));
    }).map(function(pin) {
        return { id: pin.id, latitude: Number(pin.latitude), longitude: Number(pin.longitude), note: pin.note, createdAt: pin.createdAt };
    });
    var calculatedDistance = calculateRecordedDistance(pathCoordinates, 0);
    var savedDistance = Number(saved.totalDistance);
    totalDistance = isFinite(savedDistance) && savedDistance >= 0 ? Math.max(savedDistance, calculatedDistance) : calculatedDistance;
    if (Array.isArray(saved.photos)) {
        photos = saved.photos.filter(function(p) { return p && p.id; }).map(function(p) {
            var hasLocation = isValidPhotoCoordinate(p.lat, p.lng);
            return {
                id: p.id,
                lat: hasLocation ? Number(p.lat) : null,
                lng: hasLocation ? Number(p.lng) : null,
                time: p.time,
                dateString: p.dateString,
                timeString: p.timeString,
                memo: typeof p.memo === "string" ? p.memo : "",
                emotion: typeof p.emotion === "string" ? p.emotion : "",
                missionId: typeof p.missionId === "string" ? p.missionId : "",
                placeId: typeof p.placeId === "string" ? p.placeId : "",
                sourceUri: typeof p.sourceUri === "string" ? p.sourceUri : "",
                sourceWebPath: typeof p.sourceWebPath === "string" ? p.sourceWebPath : "",
                sourceType: typeof p.sourceType === "string" ? p.sourceType : "",
                locationSource: normalizePhotoLocationSource(p.locationSource, hasLocation),
                locationAccuracy: typeof p.locationAccuracy === "number" && isFinite(p.locationAccuracy) ? Number(p.locationAccuracy) : null,
                heading: isFinite(p.heading) ? normalizeHeading(p.heading) : null,
                remotePhotoUrl: typeof p.remotePhotoUrl === "string" ? p.remotePhotoUrl : "",
                remoteThumbUrl: typeof p.remoteThumbUrl === "string" ? p.remoteThumbUrl : "",
                storagePath: typeof p.storagePath === "string" ? p.storagePath : "",
                thumbStoragePath: typeof p.thumbStoragePath === "string" ? p.thumbStoragePath : "",
                imagePrediction: p.imagePrediction && typeof p.imagePrediction === "object" ? {
                    label: typeof p.imagePrediction.label === "string" ? p.imagePrediction.label : "",
                    probability: isFinite(p.imagePrediction.probability) ? p.imagePrediction.probability : 0,
                    percent: isFinite(p.imagePrediction.percent) ? p.imagePrediction.percent : 0,
                    accepted: !!p.imagePrediction.accepted,
                    badgeId: typeof p.imagePrediction.badgeId === "string" ? p.imagePrediction.badgeId : ""
                } : null
            };
        });
    }
    isFogEnabled = true;
    compactPathData();
    scheduleCompletedOfficialRouteRefresh();
    return true;
}
function safeStorageGet(key) {
    try { return localStorage.getItem(key); }
    catch (error) { console.warn("Local storage read failed", error && error.name); return null; }
}
function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { console.warn("Local storage write failed", error && error.name); return false; }
}
function storedValueRichness(raw) {
    if (!raw || typeof raw !== "string") return 0;
    try {
        var value = JSON.parse(raw);
        function score(item) {
            if (Array.isArray(item)) return item.length + item.reduce(function(total, child) { return total + score(child); }, 0);
            if (item && typeof item === "object") return Object.keys(item).reduce(function(total, key) { return total + score(item[key]); }, 0);
            if (typeof item === "number") return isFinite(item) && item > 0 ? item : 0;
            return typeof item === "string" && item ? 1 : 0;
        }
        return score(value);
    } catch (_) { return 0; }
}
function getDurableStorageKeys() {
    var exact = [
        STORAGE_KEY, STORAGE_BACKUP_KEY, STORAGE_CORRUPT_KEY, GPX_SAVES_KEY,
        TUTORIAL_DONE_KEY, INTRO_STORY_SEEN_KEY, LANGUAGE_SELECTED_KEY,
        LANGUAGE_PREFERENCE_KEY, FIRST_MEETING_DONE_KEY, FOG_ENABLED_KEY,
        DAILY_TASK_KEY, RPG_GROWTH_KEY, COLLECTION_KEY, "giloa-stay-bonus", GILOA_UPDATE_SEEN_KEY,
        "giloa-prelaunch-tester-2026-v1"
    ];
    var keys = [];
    exact.forEach(function(key) { if (key && keys.indexOf(key) < 0) keys.push(key); });
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && /^giloa-(?:daily-growth|region-stay|user)/.test(key) && keys.indexOf(key) < 0) keys.push(key);
    }
    return keys;
}
function buildDurableStorageSnapshot() {
    var values = {};
    getDurableStorageKeys().forEach(function(key) {
        var value = safeStorageGet(key);
        if (value !== null) values[key] = value;
    });
    return JSON.stringify({ version:1, savedAt:Date.now(), values:values });
}
function persistDurableStorageSnapshot() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.saveDurableState !== "function") return false;
    try { return bridge.saveDurableState(buildDurableStorageSnapshot()) === true; }
    catch (error) { console.warn("Durable state backup failed", error && error.message); return false; }
}
function restoreDurableStorageSnapshot() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge || typeof bridge.loadDurableState !== "function") return false;
    try {
        var raw = bridge.loadDurableState();
        if (!raw) return false;
        var snapshot = JSON.parse(raw);
        var values = snapshot && snapshot.values;
        if (!values || typeof values !== "object" || Array.isArray(values)) return false;
        var restored = false;
        Object.keys(values).forEach(function(key) {
            if (typeof values[key] !== "string") return;
            var current = safeStorageGet(key);
            // The normal case is an exact mirror of localStorage. Avoid parsing
            // and merging the same multi-megabyte journey JSON on every launch.
            if (current === values[key]) return;
            if (key === STORAGE_KEY || key === STORAGE_BACKUP_KEY) {
                var candidates = [];
                [current, values[key]].forEach(function(rawState) {
                    try { var parsed = parseStoredState(rawState); if (parsed) candidates.push(parsed); } catch (_) { }
                });
                var merged = mergeJourneyStatePayloads(candidates);
                if (merged && safeStorageSet(key, JSON.stringify(merged))) restored = true;
                return;
            }
            if (/^(?:giloa-rpg-growth|giloa-collection|giloa-stay-bonus|giloa-daily-growth|giloa-region-stay)/.test(key) && storedValueRichness(values[key]) > storedValueRichness(current)) {
                if (safeStorageSet(key, values[key])) restored = true;
                return;
            }
            if (current === null && safeStorageSet(key, values[key])) restored = true;
        });
        return restored;
    } catch (error) {
        console.warn("Durable state restore failed", error && error.message);
        return false;
    }
}
function parseStoredState(raw) {
    if (!raw || typeof raw !== "string") return null;
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid saved state");
    return parsed;
}
function persistState(options) {
    options = options || {};
    if (!giloaPersistentStateReady && !options.restoreCommit) {
        console.warn("[GILOA CHECKPOINT] blocked before restore completed");
        return false;
    }
    try {
        scheduleRegionStayRecalculation();
        var payload = buildStatePayload();
        var serialized = JSON.stringify(payload);
        var current = safeStorageGet(getLocalStorageKey());
        var currentPayload = null;
        try { currentPayload = parseStoredState(current); } catch (_) { }
        if (!options.userReset && currentPayload && hasJourneyRecordRegression(currentPayload, payload)) {
            console.error("[GILOA CHECKPOINT] blocked record-count regression", journeyPayloadRecordCounts(currentPayload), journeyPayloadRecordCounts(payload));
            return false;
        }
        // An uncommitted deletion must not enter recovery through TEMP. Until
        // PRIMARY commits, retain the pre-deletion checkpoint, including originals.
        var pendingPayload = options.beforeExplicitDeletion || payload;
        var pendingSerialized = options.beforeExplicitDeletion ? JSON.stringify(pendingPayload) : serialized;
        if (!safeStorageSet(STORAGE_TEMP_KEY, pendingSerialized)) throw new Error("Temporary storage write rejected");
        var verified = parseStoredState(safeStorageGet(STORAGE_TEMP_KEY));
        if (!verified || journeyPayloadPointCount(verified) !== journeyPayloadPointCount(pendingPayload)) throw new Error("Temporary storage verification failed");
        if (current && !safeStorageSet(STORAGE_BACKUP_KEY, current)) throw new Error("Backup storage write rejected");
        if (!safeStorageSet(getLocalStorageKey(), serialized)) throw new Error("Storage write rejected");
        safeStorageSet(STORAGE_TEMP_KEY, "");
        var durableSaved = persistDurableStorageSnapshot();
        persistentStateDirty = false;
        lastCheckpointAt = Date.now();
        if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA CHECKPOINT] " + JSON.stringify({ path:pathCoordinates.length, rawGps:rawGpsPoints.length, distance:totalDistance, photos:photos.length, timestamp:lastCheckpointAt, durable:durableSaved }));
        return true;
    } catch (e) {
        console.error("저장 실패", e);
        if (e && e.name === "QuotaExceededError") alert(earlyUiText("storageFull"));
        return false;
    }
}

function loadStateLegacy() {
    try {
        var raw = localStorage.getItem(getLocalStorageKey()) || localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyStatePayload(JSON.parse(raw));
    } catch (e) {
        console.error("복원 실패", e);
    }
}

function loadState() {
    var primary = safeStorageGet(getLocalStorageKey()) || safeStorageGet(STORAGE_KEY);
    var backup = safeStorageGet(STORAGE_BACKUP_KEY);
    var pending = safeStorageGet(STORAGE_TEMP_KEY);
    var candidates = [];
    [primary, backup, pending].forEach(function(raw, index) {
        try { var parsed = parseStoredState(raw); if (parsed) candidates.push(parsed); }
        catch (error) {
            if (index === 0 && raw) {
                console.warn("Primary state was damaged; preserving it and trying recovery", error && error.message);
                safeStorageSet(STORAGE_CORRUPT_KEY, raw.slice(0, 200000));
            }
        }
    });
    var merged = mergeJourneyStatePayloads(candidates);
    if (!merged || !applyStatePayload(merged)) {
        if (candidates.length) console.error("State recovery failed: no valid journey state");
        else if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] no previous journey state");
        return false;
    }
    return true;
}

function getSpecialPlaceText() { return UI_TEXT[currentLang] || UI_TEXT.ko; }
function createSpecialPlaceId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "special-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
function applySpecialPlaceLang() {
    var t = getSpecialPlaceText();
    setText("special-place-title", t.special_place);
    var note = document.getElementById("special-place-note");
    var save = document.getElementById("special-place-save");
    var cancel = document.getElementById("special-place-cancel");
    if (note) note.placeholder = t.special_place_placeholder;
    if (save) { save.textContent = t.save_pin; save.setAttribute("aria-label", t.save_pin); }
    if (cancel) { cancel.textContent = t.cancel_pin; cancel.setAttribute("aria-label", t.cancel_pin); }
    if (playerMarker && playerMarker.getElement()) playerMarker.getElement().setAttribute("aria-label", t.special_place);
    if (activeSpecialPlaceMarker && activeSpecialPlacePin) openSpecialPlacePopup(activeSpecialPlaceMarker, activeSpecialPlacePin, true);
}
function openSpecialPlaceEditor(latitude, longitude) {
    var editor = document.getElementById("special-place-editor");
    var note = document.getElementById("special-place-note");
    if (!editor || !note || !isFinite(latitude) || !isFinite(longitude)) return;
    specialPlaceEditorCoords = { latitude: Number(latitude), longitude: Number(longitude) };
    applySpecialPlaceLang();
    document.getElementById("special-place-error").textContent = "";
    note.value = "";
    editor.classList.add("show");
    editor.setAttribute("aria-hidden", "false");
    setTimeout(function() { note.focus(); }, 50);
}
function closeSpecialPlaceEditor() {
    var editor = document.getElementById("special-place-editor");
    if (!editor) return;
    editor.classList.remove("show");
    editor.setAttribute("aria-hidden", "true");
    specialPlaceEditorCoords = null;
    var error = document.getElementById("special-place-error");
    if (error) error.textContent = "";
}
function saveSpecialPlacePin() {
    var noteEl = document.getElementById("special-place-note");
    var note = noteEl ? noteEl.value.trim() : "";
    var t = getSpecialPlaceText();
    if (!note) {
        var error = document.getElementById("special-place-error");
        if (error) error.textContent = t.empty_pin_note;
        if (noteEl) noteEl.focus();
        return;
    }
    if (!specialPlaceEditorCoords) return;
    var pin = {
        id: createSpecialPlaceId(),
        latitude: specialPlaceEditorCoords.latitude,
        longitude: specialPlaceEditorCoords.longitude,
        note: note,
        createdAt: new Date().toISOString()
    };
    specialPlacePins.push(pin);
    createSpecialPlaceMarker(pin);
    persistState();
    closeSpecialPlaceEditor();
    showCollectionToast(t.pin_saved);
    showGiloReaction("memory", "", { force:true });
}
function createSpecialPlaceMarker(pinData) {
    if (!pinData || specialPlaceMarkers.has(pinData.id)) return specialPlaceMarkers.get(pinData && pinData.id);
    var marker = L.marker([pinData.latitude, pinData.longitude], {
        pane: "specialPlacePane", keyboard: true, title: getSpecialPlaceText().special_place,
        icon: L.divIcon({ className: "special-place-marker-wrap", html: '<div class="special-place-marker"><span>★</span></div>', iconSize: [30, 34], iconAnchor: [15, 30] })
    }).addTo(map);
    marker.on("click", function(e) {
        if (e && e.originalEvent) L.DomEvent.stop(e.originalEvent);
        if (activeSpecialPlaceMarker === marker) closeSpecialPlacePopup();
        else openSpecialPlacePopup(marker, pinData);
    });
    specialPlaceMarkers.set(pinData.id, marker);
    return marker;
}
function renderSavedSpecialPlacePins() {
    specialPlacePins.forEach(function(pin) { createSpecialPlaceMarker(pin); });
}
function buildSpecialPlacePopup(pinData) {
    var t = getSpecialPlaceText();
    var wrap = document.createElement("div"); wrap.className = "special-place-popup";
    var title = document.createElement("div"); title.className = "special-place-popup-title"; title.textContent = t.special_place;
    var note = document.createElement("div"); note.className = "special-place-popup-note"; note.textContent = pinData.note;
    var time = document.createElement("div"); time.className = "special-place-popup-time";
    time.textContent = new Date(pinData.createdAt).toLocaleString(currentLang, { dateStyle: "medium", timeStyle: "short" });
    wrap.appendChild(title); wrap.appendChild(note); wrap.appendChild(time);
    return wrap;
}
function openSpecialPlacePopup(marker, pinData, keepTimer) {
    if (!marker || !pinData) return;
    if (activeSpecialPlaceMarker && activeSpecialPlaceMarker !== marker) closeSpecialPlacePopup();
    marker.bindPopup(buildSpecialPlacePopup(pinData), { closeButton: false, autoClose: false, closeOnClick: false, offset: [0, -24] }).openPopup();
    activeSpecialPlaceMarker = marker;
    activeSpecialPlacePin = pinData;
    if (!keepTimer) scheduleSpecialPlacePopupClose();
}
function closeSpecialPlacePopup() {
    clearSpecialPlacePopupTimer();
    if (activeSpecialPlaceMarker) activeSpecialPlaceMarker.closePopup();
    activeSpecialPlaceMarker = null;
    activeSpecialPlacePin = null;
}
function scheduleSpecialPlacePopupClose() {
    clearSpecialPlacePopupTimer();
    specialPlacePopupTimer = setTimeout(closeSpecialPlacePopup, 3000);
}
function clearSpecialPlacePopupTimer() {
    if (specialPlacePopupTimer !== null) clearTimeout(specialPlacePopupTimer);
    specialPlacePopupTimer = null;
}

var imageClassifierPromise = null;
var imageClassifierMeta = null;
function ensureTf() {
    if (window.tf) return Promise.resolve(window.tf);
    return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./vendor/tf.min.js";
        script.async = true;
        script.onload = function() { window.tf ? resolve(window.tf) : reject(new Error("TensorFlow.js 로드 실패")); };
        script.onerror = function() { reject(new Error("TensorFlow.js 파일을 불러오지 못했습니다.")); };
        document.head.appendChild(script);
    });
}
async function loadImageClassifier() {
    if (imageClassifierPromise) return imageClassifierPromise;
    imageClassifierPromise = Promise.all([
        ensureTf(),
        fetch(IMAGE_CLASSIFIER_METADATA_URL).then(function(res) {
            if (!res.ok) throw new Error("이미지 모델 메타데이터 로드 실패");
            return res.json();
        })
    ]).then(function(result) {
        var tf = result[0];
        imageClassifierMeta = result[1] || {};
        return tf.loadLayersModel(IMAGE_CLASSIFIER_MODEL_URL).then(function(model) {
            return {
                model: model,
                labels: Array.isArray(imageClassifierMeta.labels) ? imageClassifierMeta.labels : [],
                imageSize: imageClassifierMeta.imageSize || 224
            };
        });
    }).catch(function(e) {
        imageClassifierPromise = null;
        throw e;
    });
    return imageClassifierPromise;
}
async function classifyImportedImage(img) {
    var input = null;
    var prediction = null;
    try {
        var bundle = await promiseWithTimeout(loadImageClassifier(), 15000, "Image model load");
        var tf = window.tf;
        input = tf.tidy(function() {
            return tf.browser.fromPixels(img)
                .resizeBilinear([bundle.imageSize, bundle.imageSize])
                .toFloat()
                .div(127.5)
                .sub(1)
                .expandDims(0);
        });
        prediction = bundle.model.predict(input);
        var values = Array.from(await prediction.data());
        var bestIndex = 0;
        for (var i = 1; i < values.length; i++) {
            if (values[i] > values[bestIndex]) bestIndex = i;
        }
        var label = getReadableImagePredictionLabel(bundle.labels[bestIndex]);
        var probability = values[bestIndex] || 0;
        return {
            label: label,
            probability: probability,
            percent: Math.round(probability * 1000) / 10,
            accepted: probability >= IMAGE_CLASSIFIER_THRESHOLD,
            badgeId: probability >= IMAGE_CLASSIFIER_THRESHOLD ? IMAGE_CLASS_BADGES[label] || "" : ""
        };
    } catch (e) {
        console.warn("이미지 분석 실패", e);
        return null;
    } finally {
        if (prediction) prediction.dispose();
        if (input) input.dispose();
    }
}
function awardImagePredictionBadge(prediction) {
    if (!prediction || !prediction.accepted || !prediction.badgeId) return false;
    earnBadge(prediction.badgeId);
    return true;
}

// ?占쎌쭊 泥섎━
function showPhotoImportProgress(current, total) {
    var progress = document.getElementById("photo-import-progress");
    if (!progress) {
        progress = document.createElement("div");
        progress.id = "photo-import-progress";
        progress.setAttribute("role", "status");
        progress.setAttribute("aria-live", "polite");
        document.body.appendChild(progress);
    }
    var text = getPhotoInteractionText().importProgress || getPhotoInteractionText().photoAnalysis;
    progress.textContent = text.replace("{current}", current).replace("{total}", total);
    progress.hidden = false;
    // Paint the map after the native picker, before bridge reads or canvas work.
    return new Promise(function(resolve) { setTimeout(resolve, 32); });
}
function hidePhotoImportProgress() {
    var progress = document.getElementById("photo-import-progress");
    if (progress) progress.hidden = true;
}
function awardPhotoImagePrediction(data, mission) {
    if (!mission || !data.imagePrediction || !data.imagePrediction.accepted) return;
    var targetText = (mission.name + " " + (mission.item && mission.item.imageLabel || "")).toLowerCase();
    var labelText = String(data.imagePrediction.label || "").toLowerCase();
    if (labelText && targetText.indexOf(labelText) >= 0) awardImagePredictionBadge(data.imagePrediction);
}
function renderPhotoImagePrediction(element, data) {
    var prediction = data.imagePrediction;
    element.hidden = !(prediction && prediction.label);
    if (element.hidden) return;
    var text = getPhotoInteractionText();
    element.className = prediction.accepted ? "photo-ai-result accepted" : "photo-ai-result";
    element.textContent = getReadableImagePredictionLabel(prediction.label) + " " + (prediction.percent || 0) + "% · " + (prediction.accepted ? text.analysisAccepted : text.analysisRetry);
}
var photoImageAnalysisQueue = Promise.resolve();
function schedulePhotoImageAnalysis(data, img, mission) {
    // Retain only model-sized pixels, never a batch of decoded camera originals.
    var input = document.createElement("canvas");
    input.width = input.height = imageClassifierMeta && imageClassifierMeta.imageSize || 224;
    var context = input.getContext("2d");
    context.drawImage(img, 0, 0, input.width, input.height);
    photoImageAnalysisQueue = photoImageAnalysisQueue.then(async function() {
        await new Promise(function(resolve) { setTimeout(resolve, 32); });
        if (photos.indexOf(data) < 0) return;
        var prediction = await classifyImportedImage(input);
        // Deleting a photo while analysis runs must not resurrect it.
        if (!prediction || photos.indexOf(data) < 0) return;
        data.imagePrediction = prediction;
        awardPhotoImagePrediction(data, mission);
        var marker = findPhotoMarker(data.id);
        if (marker && marker._photoPredictionElement) {
            renderPhotoImagePrediction(marker._photoPredictionElement, data);
            if (marker.isPopupOpen()) marker.getPopup().update();
        }
        scheduleSave();
    }).catch(function(error) {
        console.warn("Deferred photo analysis failed", error);
    }).finally(function() {
        input.width = input.height = 0;
    });
}

async function processPhoto(img, now, lat, lng, options) {
    options = options || {};
    var imageMission = activeImageMission;
    if (!(now instanceof Date) || isNaN(now.getTime())) now = new Date();
    var hasLocation = isValidPhotoCoordinate(lat, lng);
    lat = hasLocation ? Number(lat) : null;
    lng = hasLocation ? Number(lng) : null;
    var thumb = resizeImage(img, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
    var popup = PHOTO_STORE_PREVIEW
        ? resizeImage(img, { maxSize: PHOTO_POPUP_MAX_SIZE, quality: PHOTO_POPUP_JPEG_QUALITY, minQuality: PHOTO_POPUP_MIN_QUALITY, targetBytes: PHOTO_POPUP_TARGET_BYTES })
        : "";
    var previewSrc = popup || thumb;
    var contentFingerprint = getPhotoContentFingerprint(thumb);
    var duplicate = photos.find(function(photo) { return photo && photo.contentFingerprint && photo.contentFingerprint === contentFingerprint; });
    if (duplicate) return duplicate;
    var id = String(now.getTime()) + Math.random().toString(36).slice(2);
    var data = {
        id: id, lat: lat, lng: lng, photo: previewSrc, thumb: thumb, time: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" }),
        timeString: now.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" }),
        memo: "",
        emotion: "",
        missionId: options.mission && (options.mission.id || options.mission.targetId) || "",
        placeId: options.mission && options.mission.targetId || "",
        sourceUri: typeof options.sourceUri === "string" ? options.sourceUri : "",
        sourceWebPath: typeof options.sourceWebPath === "string" ? options.sourceWebPath : "",
        sourceType: typeof options.sourceType === "string" ? options.sourceType : "",
        locationSource: normalizePhotoLocationSource(options.locationSource, hasLocation),
        locationAccuracy: typeof options.locationAccuracy === "number" && isFinite(options.locationAccuracy) ? Number(options.locationAccuracy) : null,
        remotePhotoUrl: "",
        remoteThumbUrl: "",
        storagePath: "",
        thumbStoragePath: "",
        imagePrediction: options.imagePrediction || null,
        heading: isFinite(options.heading) ? normalizeHeading(options.heading) : (options.sourceType === "camera" && isFinite(playerHeading) ? normalizeHeading(playerHeading) : null),
        contentFingerprint: contentFingerprint
    };
    await idbSavePhoto(id, popup, thumb, options.originalBlob || null, options.originalBlob && options.originalBlob.type || "image/jpeg");
    photos.push(data);
    if (!hasLocation) {
        var locationChoice = await requestMissingPhotoLocation(data, { isNewImport: true });
        if (locationChoice === "cancel") {
            photos = photos.filter(function(photo) { return photo.id !== data.id; });
            await idbDeletePhoto(data.id).catch(function(error) { console.warn("Cancelled photo cleanup failed", error); });
            if (!options.deferUi) {
                updateStats();
                scheduleSave();
                updatePhotoList();
            }
            return null;
        }
        hasLocation = isValidPhotoCoordinate(data.lat, data.lng);
    }
    awardPhotoImagePrediction(data, imageMission);
    showGiloReaction("photo");
    if (window.GiloaHiddenMissions) window.GiloaHiddenMissions.onPhoto(data);
    if (data.sourceType === "camera" && hasLocation) checkNearbyVisitCompletion({ method: "photo", photo: data });
    uploadPhotoRemote(data, { img: img, originalBlob: options.originalBlob || null, originalUrl: options.originalUrl || "" }).catch(function(e) { console.warn("Remote photo upload failed", e); });
    if (hasLocation) createPhotoMarker(data, options.openPopup !== false);
    if (!options.deferUi) {
        updateStats();
        scheduleSave();
        updatePhotoList();
    }
    try {
        window.dispatchEvent(new CustomEvent("giloa:photo-saved", { detail:{ photo:data } }));
    } catch (timeTraceError) { console.warn("Time Trace photo hook failed", timeTraceError); }
    if (options.deferImageAnalysis && !data.imagePrediction) {
        try { schedulePhotoImageAnalysis(data, img, imageMission); }
        catch (analysisError) { console.warn("Photo analysis scheduling failed", analysisError); }
    }
    return data;
}
function getPhotoContentFingerprint(dataUrl) {
    var value = String(dataUrl || "");
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return "thumb-v1:" + value.length + ":" + (hash >>> 0).toString(16);
}
function parseExifRational(value) {
    if (typeof value === "number") return isFinite(value) ? value : null;
    if (Array.isArray(value) && value.length >= 2) {
        var arrayDenominator = Number(value[1]);
        return isFinite(Number(value[0])) && isFinite(arrayDenominator) && arrayDenominator !== 0 ? Number(value[0]) / arrayDenominator : null;
    }
    if (value && typeof value === "object") {
        if (isFinite(value.numerator) && isFinite(value.denominator) && Number(value.denominator) !== 0) return Number(value.numerator) / Number(value.denominator);
        if (isFinite(value.num) && isFinite(value.den) && Number(value.den) !== 0) return Number(value.num) / Number(value.den);
    }
    var parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : null;
}
function parseExifCoord(value, ref, axis) {
    if (value === null || value === undefined) return null;
    var result = null;
    if (typeof value === "number") result = value;
    else if (Array.isArray(value) && value.length >= 3) {
        var degrees = parseExifRational(value[0]);
        var minutes = parseExifRational(value[1]);
        var seconds = parseExifRational(value[2]);
        if (![degrees, minutes, seconds].every(function(part) { return part !== null && isFinite(part); })) return null;
        if (degrees < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;
        result = degrees + minutes / 60 + seconds / 3600;
    } else if (typeof value === "string" && isFinite(parseFloat(value))) result = parseFloat(value);
    if (!isFinite(result)) return null;
    ref = String(ref || "").trim().toUpperCase();
    if (ref && ((axis === "lat" && ref !== "N" && ref !== "S") || (axis === "lng" && ref !== "E" && ref !== "W"))) return null;
    return ref === "S" || ref === "W" ? -Math.abs(result) : result;
}
function gpsFromExifObject(exif) {
    if (!exif || typeof exif !== "object") return null;
    var directLat = exif.latitude;
    var directLng = exif.longitude;
    if (isValidPhotoCoordinate(directLat, directLng)) return { lat: Number(directLat), lng: Number(directLng) };
    var lat = parseExifCoord(exif.GPSLatitude || exif.gpsLatitude, exif.GPSLatitudeRef || exif.gpsLatitudeRef, "lat");
    var lng = parseExifCoord(exif.GPSLongitude || exif.gpsLongitude, exif.GPSLongitudeRef || exif.gpsLongitudeRef, "lng");
    return isValidPhotoCoordinate(lat, lng) ? { lat: lat, lng: lng } : null;
}
var GILOA_EXIF_TRACE = [];
function giloaExifTrace(step, detail) {
    try {
        GILOA_EXIF_TRACE.push("· " + step + (detail === undefined || detail === null ? "" : ": " + detail));
        if (GILOA_EXIF_TRACE.length > 40) GILOA_EXIF_TRACE.shift();
    } catch (_) {}
}
function readGpsRationalTriplet(view, at, littleEndian, type, count) {
    if (type !== 5 && type !== 10) return null;
    var signed = type === 10;
    var parts = [];
    var take = Math.min(3, Math.max(1, count));
    for (var k = 0; k < take; k++) {
        var numerator = signed ? view.getInt32(at + k * 8, littleEndian) : view.getUint32(at + k * 8, littleEndian);
        var denominator = signed ? view.getInt32(at + k * 8 + 4, littleEndian) : view.getUint32(at + k * 8 + 4, littleEndian);
        if (!denominator) return null;
        parts.push(numerator / denominator);
    }
    while (parts.length < 3) parts.push(0);
    if (parts[0] < 0 || parts[1] < 0 || parts[1] >= 60 || parts[2] < 0 || parts[2] >= 60) return null;
    var value = parts[0] + parts[1] / 60 + parts[2] / 3600;
    return isFinite(value) ? value : null;
}
function findExifTiffBase(view, searchFrom) {
    var resumeAt = Math.max(0, Number(searchFrom) || 0);
    // 1) 정상적인 JPEG 세그먼트 순회
    if (!resumeAt && view.byteLength > 4 && view.getUint16(0, false) === 0xFFD8) {
        var offset = 2;
        while (offset + 4 <= view.byteLength) {
            if (view.getUint8(offset) !== 0xFF) { offset += 1; continue; }
            var marker = view.getUint8(offset + 1);
            if (marker === 0xDA || marker === 0xD9) break;
            if (marker === 0xFF) { offset += 1; continue; }
            if (marker === 0x01 || marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) { offset += 2; continue; }
            if (offset + 4 > view.byteLength) break;
            var segmentLength = view.getUint16(offset + 2, false);
            if (segmentLength < 2) break;
            var segmentEnd = offset + 2 + segmentLength;
            if (marker === 0xE1 && segmentLength >= 8 &&
                view.getUint8(offset + 4) === 0x45 && view.getUint8(offset + 5) === 0x78 &&
                view.getUint8(offset + 6) === 0x69 && view.getUint8(offset + 7) === 0x66 &&
                view.getUint8(offset + 8) === 0) {
                return { tiffBase: offset + 10, limit: Math.min(segmentEnd, view.byteLength), how: "segment" };
            }
            if (segmentEnd > view.byteLength) break;
            offset = segmentEnd;
        }
    }
    // 2) 세그먼트가 깨졌거나 JPEG이 아닐 때: "Exif\0\0" 시그니처 직접 탐색
    // HEIC/HEIF는 EXIF 블록이 파일 앞 1MB 밖(수 MB 지점)에 놓이는 경우가 많으므로
    // 버퍼 전체를 훑는다. 예전 1MB 제한은 HEIC 사진의 GPS 유실 원인이었다.
    var scanBytes = null;
    try { scanBytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength); } catch (_) { scanBytes = null; }
    var byteAt = scanBytes ? function(a) { return scanBytes[a]; } : function(a) { return view.getUint8(a); };
    var scanEnd = view.byteLength - 8;
    for (var p = resumeAt; p < scanEnd; p++) {
        if (byteAt(p) !== 0x45) continue;
        if (byteAt(p + 1) !== 0x78 || byteAt(p + 2) !== 0x69 || byteAt(p + 3) !== 0x66) continue;
        if (byteAt(p + 4) !== 0 || byteAt(p + 5) !== 0) continue;
        var candidate = p + 6;
        var order = view.getUint16(candidate, false);
        if (order === 0x4949 || order === 0x4D4D) {
            return { tiffBase: candidate, limit: view.byteLength, how: "scan", nextSearchFrom: p + 1 };
        }
    }
    return null;
}
var GPS_TAG_NAMES = { 0:"VersionID", 1:"LatitudeRef", 2:"Latitude", 3:"LongitudeRef", 4:"Longitude", 5:"AltitudeRef", 6:"Altitude", 7:"TimeStamp", 8:"Satellites", 9:"Status", 16:"ImgDirectionRef", 17:"ImgDirection", 27:"ProcessingMethod", 29:"DateStamp" };
// Dumps the bytes actually sitting behind a GPS tag. Android's MediaStore keeps
// the tag structure intact and zeroes only the values, so an all-zero dump is
// proof of redaction rather than a parser bug.
function formatGpsTagValue(view, dataOffset, type, count, littleEndian, limit) {
    try {
        var parts = [];
        var i;
        if (type === 5 || type === 10) {
            var pairs = Math.min(count, 3);
            for (i = 0; i < pairs; i++) {
                var at = dataOffset + i * 8;
                if (at + 8 > limit) { parts.push("범위밖"); break; }
                var num = type === 10 ? view.getInt32(at, littleEndian) : view.getUint32(at, littleEndian);
                var den = type === 10 ? view.getInt32(at + 4, littleEndian) : view.getUint32(at + 4, littleEndian);
                parts.push(num + "/" + den);
            }
            return parts.join(", ");
        }
        if (type === 2) {
            var text = "";
            for (i = 0; i < Math.min(count, 12); i++) {
                if (dataOffset + i >= limit) break;
                var code = view.getUint8(dataOffset + i);
                if (!code) break;
                text += String.fromCharCode(code);
            }
            return '"' + text + '"';
        }
        for (i = 0; i < Math.min(count, 8); i++) {
            if (dataOffset + i >= limit) break;
            parts.push(view.getUint8(dataOffset + i).toString(16).padStart(2, "0"));
        }
        return parts.join(" ");
    } catch (_) { return "읽기 실패"; }
}
// Inspects ONE EXIF candidate starting at searchFrom. Kept separate so the
// caller can walk past a block that turned out to carry no coordinates.
function inspectExifBufferAt(buffer, searchFrom) {
    var out = { hasExif: false, hasGpsIfd: false, gpsTagCount: 0, endian: "", lat: null, lng: null, reason: "", gpsTags: [], gpsAllZero: false, nextSearchFrom: 0 };
    try {
        if (!buffer || buffer.byteLength < 16) { out.reason = "too-small"; return out; }
        var view = new DataView(buffer);
        var found = findExifTiffBase(view, searchFrom);
        if (!found) { out.reason = "no-exif"; return out; }
        out.hasExif = true;
        out.nextSearchFrom = found.nextSearchFrom || 0;
        var tiffBase = found.tiffBase;
        var limit = found.limit;
        var byteOrder = view.getUint16(tiffBase, false);
        var littleEndian = byteOrder === 0x4949;
        if (!littleEndian && byteOrder !== 0x4D4D) { out.reason = "bad-byte-order"; return out; }
        out.endian = littleEndian ? "II" : "MM";
        var read16 = function(a) { if (a < tiffBase || a + 2 > limit) throw new RangeError("EXIF bounds"); return view.getUint16(a, littleEndian); };
        var read32 = function(a) { if (a < tiffBase || a + 4 > limit) throw new RangeError("EXIF bounds"); return view.getUint32(a, littleEndian); };
        if (read16(tiffBase + 2) !== 42) { out.reason = "bad-magic"; return out; }
        var ifd0 = tiffBase + read32(tiffBase + 4);
        var ifd0Count = read16(ifd0);
        var gpsPointer = null;
        for (var i = 0; i < ifd0Count && i < 256; i++) {
            var entry = ifd0 + 2 + i * 12;
            if (entry + 12 > limit) break;
            if (read16(entry) === 0x8825) { gpsPointer = read32(entry + 8); break; }
        }
        if (gpsPointer === null || gpsPointer <= 0) { out.reason = "no-gps-tag"; return out; }
        var gpsIfd = tiffBase + gpsPointer;
        var gpsCount = read16(gpsIfd);
        if (!gpsCount || gpsCount > 128) { out.reason = "gps-ifd-empty"; return out; }
        out.hasGpsIfd = true;
        out.gpsTagCount = gpsCount;
        var latRef = "", lngRef = "", lat = null, lng = null;
        for (var j = 0; j < gpsCount; j++) {
            var gpsEntry = gpsIfd + 2 + j * 12;
            if (gpsEntry + 12 > limit) break;
            var tag = read16(gpsEntry);
            var type = read16(gpsEntry + 2);
            var count = read32(gpsEntry + 4);
            var typeSize = (type === 1 || type === 2 || type === 6 || type === 7) ? 1
                : (type === 3 || type === 8) ? 2
                : (type === 4 || type === 9 || type === 11) ? 4
                : (type === 5 || type === 10 || type === 12) ? 8 : 0;
            if (!typeSize || !count || count > 256) { out.gpsTags.push({ tag: tag, type: type, count: count, raw: "타입/개수 이상" }); continue; }
            var totalBytes = typeSize * count;
            var dataOffset = totalBytes <= 4 ? gpsEntry + 8 : tiffBase + read32(gpsEntry + 8);
            var needed = Math.min(totalBytes, 24);
            if (dataOffset < tiffBase || dataOffset + needed > limit) { out.gpsTags.push({ tag: tag, type: type, count: count, raw: "값 위치가 버퍼 밖" }); continue; }
            out.gpsTags.push({ tag: tag, type: type, count: count, raw: formatGpsTagValue(view, dataOffset, type, count, littleEndian, limit) });
            if (tag === 1) latRef = String.fromCharCode(view.getUint8(dataOffset)).toUpperCase();
            else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(dataOffset)).toUpperCase();
            else if (tag === 2 || tag === 4) {
                var value = readGpsRationalTriplet(view, dataOffset, littleEndian, type, count);
                if (value === null) continue;
                if (tag === 2) lat = value; else lng = value;
            }
        }
        var coordTags = out.gpsTags.filter(function(entry) { return entry.tag === 2 || entry.tag === 4; });
        out.gpsAllZero = coordTags.length > 0 && coordTags.every(function(entry) {
            return typeof entry.raw === "string" && /^[0\s,\/]+$/.test(entry.raw);
        });
        if (lat === null || lng === null) { out.reason = out.gpsAllZero ? "gps-zeroed" : "no-coordinates"; return out; }
        if ((latRef && latRef !== "N" && latRef !== "S") || (lngRef && lngRef !== "E" && lngRef !== "W")) { out.reason = "no-coordinates"; return out; }
        if (latRef === "S") lat = -Math.abs(lat);
        if (lngRef === "W") lng = -Math.abs(lng);
        if (!isValidPhotoCoordinate(lat, lng)) { out.reason = "no-coordinates"; return out; }
        out.lat = Number(lat);
        out.lng = Number(lng);
        out.reason = "ok";
        return out;
    } catch (e) {
        out.reason = "parser-error";
        return out;
    }
}
function parseExifGps(buffer) {
    var info = inspectExifBuffer(buffer);
    return info && isValidPhotoCoordinate(info.lat, info.lng) ? { lat: Number(info.lat), lng: Number(info.lng) } : null;
}
async function getPhotoArrayBuffer(photoOrFile) {
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (isBlob) {
        if (typeof photoOrFile.arrayBuffer === "function") return photoOrFile.arrayBuffer();
        return readFileAsArrayBuffer(photoOrFile);
    }
    var url = photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri);
    if (!url) return null;
    var response = await fetch(url);
    if (!response || !response.ok) return null;
    return response.arrayBuffer();
}
async function getPhotoExifDate(photoOrFile) {
    var objectDate = getPhotoTakenDate(photoOrFile, null);
    var exifrInput = photoOrFile;
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (!isBlob && photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri)) {
        exifrInput = photoOrFile.webPath || photoOrFile.path || photoOrFile.uri;
    }
    if (window.exifr && typeof window.exifr.parse === "function" && exifrInput) {
        try {
            var metadata = await promiseWithTimeout(window.exifr.parse(exifrInput, ["DateTimeOriginal", "CreateDate", "ModifyDate", "DateTimeDigitized"]), 8000, "EXIF date read");
            var parsedDate = metadata && (
                parsePhotoDateValue(metadata.DateTimeOriginal) ||
                parsePhotoDateValue(metadata.CreateDate) ||
                parsePhotoDateValue(metadata.ModifyDate) ||
                parsePhotoDateValue(metadata.DateTimeDigitized)
            );
            if (parsedDate) return parsedDate;
        } catch (error) {
            console.warn("exifr date parse failed", error && error.message);
        }
    }
    return objectDate;
}
function isHeicLikeBlob(blob) {
    if (!blob) return false;
    var type = String(blob.type || "").toLowerCase();
    if (type.indexOf("heic") >= 0 || type.indexOf("heif") >= 0) return true;
    return /\.(heic|heif)$/i.test(String(blob.name || ""));
}
async function getPhotoHeaderBuffer(photoOrFile, maxBytes) {
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (isBlob) {
        // HEIC/HEIF는 EXIF가 파일 뒤쪽에 위치해 앞 1MB만 읽으면 GPS를 놓친다.
        if (!maxBytes) maxBytes = isHeicLikeBlob(photoOrFile) ? Infinity : 1048576;
        var part = photoOrFile;
        if (photoOrFile.size > maxBytes && typeof photoOrFile.slice === "function") part = photoOrFile.slice(0, maxBytes);
        if (typeof part.arrayBuffer === "function") return part.arrayBuffer();
        return readFileAsArrayBuffer(part);
    }
    return getPhotoArrayBuffer(photoOrFile);
}
async function getPhotoExifGps(photoOrFile) {
    GILOA_EXIF_TRACE = [];
    window.__giloaLastExifReason = "";
    var fromObject = gpsFromExifObject(photoOrFile && photoOrFile.exif);
    if (fromObject) {
        giloaExifTrace("객체 exif", "성공");
        window.__giloaLastExifReason = "ok";
        return fromObject;
    }
    var exifrInput = photoOrFile;
    var isBlob = typeof Blob !== "undefined" && photoOrFile instanceof Blob;
    if (!isBlob && photoOrFile && (photoOrFile.webPath || photoOrFile.path || photoOrFile.uri)) {
        exifrInput = photoOrFile.webPath || photoOrFile.path || photoOrFile.uri;
    }
    giloaExifTrace("입력", isBlob
        ? "Blob " + Math.round((photoOrFile.size || 0) / 1024) + "KB " + (photoOrFile.type || "type?")
        : String(exifrInput || "없음").slice(0, 70));

    if (window.exifr && typeof window.exifr.gps === "function" && exifrInput) {
        try {
            var exifrGps = await promiseWithTimeout(window.exifr.gps(exifrInput), 8000, "EXIF GPS read");
            if (exifrGps && isValidPhotoCoordinate(exifrGps.latitude, exifrGps.longitude)) {
                giloaExifTrace("exifr", "성공");
                window.__giloaLastExifReason = "ok";
                return { lat: Number(exifrGps.latitude), lng: Number(exifrGps.longitude) };
            }
            giloaExifTrace("exifr", "좌표 없음");
        } catch (error) {
            giloaExifTrace("exifr 오류", error && error.message);
        }
    } else {
        giloaExifTrace("exifr", "미로드");
    }

    try {
        var buffer = await getPhotoHeaderBuffer(photoOrFile);
        if (!buffer) {
            giloaExifTrace("바이트 읽기", "실패");
            window.__giloaLastExifReason = "read-failed";
            return null;
        }
        giloaExifTrace("바이트", Math.round(buffer.byteLength / 1024) + "KB 확보");
        var info = inspectExifBuffer(buffer);
        // 앞부분만 읽어 좌표를 얻지 못했고 원본이 더 크면 전체를 다시 읽어 재시도한다.
        // HEIC는 앞쪽에 EXIF 블록이 보여도 GPS는 파일 뒤에 있는 경우가 많아,
        // hasExif만으로 재시도를 건너뛰면 좌표를 통째로 놓친다.
        var truncatedRead = isBlob && photoOrFile.size > buffer.byteLength;
        if (truncatedRead && (!info || !isValidPhotoCoordinate(info.lat, info.lng))) {
            giloaExifTrace("전체 재시도", Math.round(photoOrFile.size / 1024) + "KB");
            var fullBuffer = await getPhotoHeaderBuffer(photoOrFile, Infinity).catch(function() { return null; });
            if (fullBuffer && fullBuffer.byteLength > buffer.byteLength) {
                buffer = fullBuffer;
                info = inspectExifBuffer(buffer);
                giloaExifTrace("전체 재시도 결과", describeExifReason(info));
            }
        }
        window.__giloaLastExifReason = info.reason;
        giloaExifTrace("자체 파서", describeExifReason(info));
        if (isValidPhotoCoordinate(info.lat, info.lng)) {
            return { lat: Number(info.lat), lng: Number(info.lng) };
        }
    } catch (e) {
        giloaExifTrace("자체 파서 오류", e && e.message);
        window.__giloaLastExifReason = "parser-error";
    }
    return null;
}
// A HEIC can hold a thumbnail EXIF block ahead of the real one. Stopping at the
// first block found made the GPS look missing when it was simply further in.
function inspectExifBuffer(buffer) {
    var best = null;
    var searchFrom = 0;
    for (var attempt = 0; attempt < 6; attempt += 1) {
        var info = inspectExifBufferAt(buffer, searchFrom);
        if (!best || (!best.hasExif && info.hasExif) || (!best.hasGpsIfd && info.hasGpsIfd)) best = info;
        if (info && isValidPhotoCoordinate(info.lat, info.lng)) return info;
        if (!info || !info.hasExif || !info.nextSearchFrom) break;
        searchFrom = info.nextSearchFrom;
    }
    return best || inspectExifBufferAt(buffer, 0);
}
function describeExifReason(info) {
    if (!info) return earlyUiText("unknown");
    switch (info.reason) {
        case "ok": return earlyUiText("exifOk", { endian:info.endian });
        case "too-small": return earlyUiText("exifSmall");
        case "no-exif": return earlyUiText("exifAbsent");
        case "bad-byte-order": return earlyUiText("exifHeader");
        case "bad-magic": return earlyUiText("tiffHeader");
        case "no-gps-tag": return earlyUiText("gpsPointerAbsent");
        case "gps-ifd-empty": return earlyUiText("gpsEmpty");
        case "no-coordinates": return earlyUiText("gpsCoordinatesAbsent");
        case "gps-zeroed": return earlyUiText("gpsZeroed");
        default: return String(info.reason || earlyUiText("unknown"));
    }
}
function showGiloaDiagnosticReport(text, title) {
    var wrap = document.getElementById("giloa-diagnostic-overlay");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "giloa-diagnostic-overlay";
        wrap.style.cssText = "position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(4,8,18,0.82);padding:18px;";
        var card = document.createElement("div");
        card.style.cssText = "width:100%;max-width:420px;max-height:80vh;display:flex;flex-direction:column;background:#141b30;border:1px solid rgba(77,184,255,0.45);border-radius:14px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.55);";
        var head = document.createElement("div");
        head.id = "giloa-diagnostic-title";
        head.style.cssText = "padding:12px 14px;font-size:13px;font-weight:800;color:#8edfff;border-bottom:1px solid rgba(255,255,255,0.08);";
        var body = document.createElement("pre");
        body.id = "giloa-diagnostic-body";
        body.style.cssText = "margin:0;padding:14px;flex:1;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.55;color:#e8f2ff;font-family:ui-monospace,Menlo,Consolas,monospace;-webkit-user-select:text;user-select:text;";
        var foot = document.createElement("div");
        foot.style.cssText = "display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.08);";
        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = earlyUiText("copy");
        copyBtn.style.cssText = "flex:1;padding:10px;border-radius:9px;border:1px solid rgba(77,184,255,0.5);background:rgba(77,184,255,0.14);color:#8edfff;font-size:13px;font-weight:700;";
        copyBtn.addEventListener("click", function() {
            var value = document.getElementById("giloa-diagnostic-body").textContent;
            var done = function() { copyBtn.textContent = earlyUiText("copied"); setTimeout(function() { copyBtn.textContent = earlyUiText("copy"); }, 1500); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done).catch(function() {});
            else {
                var temp = document.createElement("textarea");
                temp.value = value;
                document.body.appendChild(temp);
                temp.select();
                try { document.execCommand("copy"); done(); } catch (_) {}
                document.body.removeChild(temp);
            }
        });
        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = earlyUiText("close");
        closeBtn.style.cssText = "flex:1;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:#e8f2ff;font-size:13px;font-weight:700;";
        closeBtn.addEventListener("click", function() { wrap.style.display = "none"; });
        foot.appendChild(copyBtn);
        foot.appendChild(closeBtn);
        card.appendChild(head);
        card.appendChild(body);
        card.appendChild(foot);
        wrap.appendChild(card);
        wrap.addEventListener("click", function(e) { if (e.target === wrap) wrap.style.display = "none"; });
        document.body.appendChild(wrap);
    }
    wrap.dataset.titleKey = ["diagnostic", "regionDiagnostic", "photoDiagnostic", "photoExifDiagnostic", "storageDiagnostic"].find(function(key) { return EARLY_UI_I18N[key].indexOf(title || earlyUiText("diagnostic")) >= 0; }) || "";
    document.getElementById("giloa-diagnostic-title").textContent = title || earlyUiText("diagnostic");
    document.getElementById("giloa-diagnostic-body").textContent = String(text || "");
    wrap.style.display = "flex";
    console.info(text);
    return text;
}
function describeGiloaPhotoBridge() {
    var bridge = window.GiloaPhotoBridge;
    if (!bridge) return { present: false, methods: [], summary: earlyUiText("bridgeAbsent") };
    var wanted = ["pickPhotos", "consumeSelectedUris", "copyPhotoToCache", "getPhotoData", "hasPhotoLocationPermission", "requestPhotoLocationPermission"];
    var picker = "";
    try { if (typeof bridge.lastPicker === "function") picker = bridge.lastPicker() || ""; } catch (_) { }
    var have = wanted.filter(function(name) { return typeof bridge[name] === "function"; });
    var missing = wanted.filter(function(name) { return have.indexOf(name) < 0; });
    var permission = earlyUiText("unknown");
    try {
        if (typeof bridge.hasPhotoLocationPermission === "function") permission = earlyUiText(bridge.hasPhotoLocationPermission() ? "allowed" : "denied");
    } catch (_) { permission = earlyUiText("callFailed"); }
    return {
        present: true,
        methods: have,
        missing: missing,
        permission: permission,
        picker: picker,
        summary: earlyUiText("present") + " · " + earlyUiText("methods") + " " + have.length + "/" + wanted.length + (missing.length ? " · " + earlyUiText("missing") + ": " + missing.join(", ") : "")
    };
}
var giloaExifDiagnosticPending = false;
// The hidden file input always routes through the system photo picker, which
// redacts location no matter what. Once the native bridge exists the diagnostic
// must read through it, otherwise it can never show the fix working.
function giloaRunExifDiagnostic() {
    if (hasNativePhotoPicker()) {
        giloaExifDiagnosticPending = true;
        try { window.GiloaPhotoBridge.pickPhotos(); return; }
        catch (error) {
            giloaExifDiagnosticPending = false;
            console.warn("네이티브 진단 선택 실패", error);
        }
    }
    var input = document.getElementById("exif-diagnose-input");
    if (input) input.click();
}
async function giloaDiagnoseNativeUri(uri) {
    var blob = await getOriginalPhotoBlob(uri, null).catch(function() { return null; });
    if (!blob || !blob.size) {
        var failLines = [earlyUiText("originalReadFailed"), ""];
        var info = describeGiloaPhotoBridge();
        failLines.push(earlyUiText("nativeBridge") + ": " + info.summary);
        if (info.present) failLines.push(earlyUiText("photoPermission") + ": " + info.permission);
        failLines.push("URI: " + describeNativePhotoUri(uri));
        failLines.push("");
        failLines.push("--- " + earlyUiText("readAttempts") + " ---");
        failLines = failLines.concat(GILOA_NATIVE_READ_TRACE.length ? GILOA_NATIVE_READ_TRACE.map(earlyDiagnosticTraceLine) : [earlyUiText("noRecords")]);
        showGiloaDiagnosticReport(failLines.join("\n"), earlyUiText("photoExifDiagnostic"));
        return;
    }
    var diagMime = resolveNativePhotoMime(uri, blob);
    await giloaDiagnosePhotoExif(blobAsNamedFile(blob, nativeUriToFileName(uri, diagMime), diagMime), { via: earlyUiText("nativeBridge"), uri: uri });
}
var giloaDiagnosticTaps = 0;
var giloaDiagnosticTapTimer = null;
window.giloaShowExifDiagnostic = function() { giloaRunExifDiagnostic(); };
function giloaTapDiagnostic() {
    giloaDiagnosticTaps += 1;
    clearTimeout(giloaDiagnosticTapTimer);
    giloaDiagnosticTapTimer = setTimeout(function() { giloaDiagnosticTaps = 0; }, 2500);
    if (giloaDiagnosticTaps < 5) return;
    giloaDiagnosticTaps = 0;
    var item = document.getElementById("photo-diagnose-item");
    if (!item) return;
    item.style.display = item.style.display === "none" ? "" : "none";
}
async function giloaDiagnosePhotoExifEvent(event) {
    var file = event && event.target && event.target.files && event.target.files[0];
    if (event && event.target) event.target.value = "";
    if (!file) return;
    await giloaDiagnosePhotoExif(file);
}
async function giloaDiagnosePhotoExif(file, context) {
    context = context || {};
    var lines = [];
    var bridgeInfo = describeGiloaPhotoBridge();
    lines.push(earlyUiText("readRoute") + ": " + (context.via || earlyUiText("systemPicker")));
    lines.push(earlyUiText("nativeBridge") + ": " + bridgeInfo.summary);
    if (bridgeInfo.present) lines.push(earlyUiText("photoPermission") + ": " + bridgeInfo.permission);
    if (bridgeInfo.picker) lines.push(earlyUiText("pickerUsed") + ": " + bridgeInfo.picker);
    lines.push("");
    lines.push(earlyUiText("file") + ": " + (file.name || earlyUiText("unnamed")));
    lines.push(earlyUiText("format") + ": " + (file.type || earlyUiText("unknown")) + " / " + Math.round((file.size || 0) / 1024) + "KB");
    lines.push("");
    var info = null;
    try {
        var buffer = await getPhotoHeaderBuffer(file, Infinity);
        info = buffer ? inspectExifBuffer(buffer) : null;
    } catch (e) {
        lines.push(earlyUiText("byteReadFailed") + ": " + (e && e.message));
    }
    if (info) {
        lines.push(earlyUiText("exifBlock") + ": " + (info.hasExif ? earlyUiText("present") + " (" + info.endian + ")" : earlyUiText("none")));
        lines.push(earlyUiText("gpsBlock") + ": " + (info.hasGpsIfd ? earlyUiText("gpsTagCount", { count:info.gpsTagCount }) : earlyUiText("none")));
        lines.push(earlyUiText("verdict") + ": " + describeExifReason(info));
        if (info.gpsTags && info.gpsTags.length) {
            lines.push("");
            lines.push("--- " + earlyUiText("rawGpsTags") + " ---");
            info.gpsTags.forEach(function(entry) {
                var name = GPS_TAG_NAMES[entry.tag] || ("tag" + entry.tag);
                lines.push(name + " (type " + entry.type + " x" + entry.count + ") = " + earlyDiagnosticValue(entry.raw));
            });
        }
    }
    var gps = await getPhotoExifGps(file);
    lines.push("");
    lines.push(gps
        ? earlyUiText("finalCoordinates") + ": " + gps.lat.toFixed(6) + ", " + gps.lng.toFixed(6)
        : earlyUiText("finalCoordinates") + ": " + earlyUiText("unknown"));
    lines.push("");
    lines.push("--- " + earlyUiText("processingLog") + " ---");
    lines = lines.concat(GILOA_EXIF_TRACE.map(earlyDiagnosticTraceLine));
    if (info && info.hasExif && (!info.hasGpsIfd || info.gpsAllZero || info.reason === "gps-zeroed")) {
        lines.push("");
        lines.push(earlyUiText("locationRedacted"));
    }
    return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("photoExifDiagnostic"));
}

function estimateDataUrlBytes(dataUrl) {
    var commaIndex = dataUrl.indexOf(",");
    if (commaIndex < 0) return 0;
    var base64Length = dataUrl.length - commaIndex - 1;
    return Math.ceil(base64Length * 0.75);
}

function resizeImage(img, options) {
    options = options || {};
    var maxSize = options.maxSize || 1024;
    var quality = typeof options.quality === "number" ? options.quality : 0.85;
    var minQuality = typeof options.minQuality === "number" ? options.minQuality : quality;
    var targetBytes = typeof options.targetBytes === "number" ? options.targetBytes : 0;
    var canvas = document.createElement("canvas");
    var w = img.width;
    var h = img.height;
    if (w > h && w > maxSize) {
        h = Math.round(h * maxSize / w);
        w = maxSize;
    } else if (h > maxSize) {
        w = Math.round(w * maxSize / h);
        h = maxSize;
    }
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    var dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (targetBytes > 0) {
        var currentQuality = quality;
        while (estimateDataUrlBytes(dataUrl) > targetBytes && currentQuality > minQuality) {
            currentQuality = Math.max(minQuality, currentQuality - 0.06);
            dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
            if (currentQuality === minQuality) break;
        }
    }
    return dataUrl;
}

function isJpegFile(file) { return /image\/jpe?g/i.test(file.type) || /\.(jpe?g)$/i.test(file.name); }
function isHeicFile(file) { return /image\/hei[cf]/i.test(file.type) || /\.(hei[cf])$/i.test(file.name); }

function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function() { reject(reader.error || new Error("파일 읽기 실패")); };
        reader.readAsArrayBuffer(file);
    });
}

function loadImageFromFile(file) {
    return new Promise(function(resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        var timer = setTimeout(function() { URL.revokeObjectURL(url); img.src = ""; reject(new Error("이미지 불러오기 시간 초과")); }, 20000);
        img.onload = function() { clearTimeout(timer); URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function(err) { clearTimeout(timer); URL.revokeObjectURL(url); reject(err || new Error("이미지 불러오기 실패")); };
        img.src = url;
    });
}

function loadImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var img = new Image();
        var timer = setTimeout(function() { img.src = ""; reject(new Error("이미지 불러오기 시간 초과")); }, 20000);
        img.onload = function() { clearTimeout(timer); resolve(img); };
        img.onerror = function(err) { clearTimeout(timer); reject(err || new Error("이미지 불러오기 실패")); };
        img.src = url;
    });
}

function ensureHeic2Any() {
    if (typeof window.heic2any === "function") return Promise.resolve(window.heic2any);
    if (heicLoaderPromise) return heicLoaderPromise;
    heicLoaderPromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        script.src = "./vendor/heic2any.min.js";
        script.async = true;
        script.onload = function() {
            if (typeof window.heic2any === "function") resolve(window.heic2any);
            else reject(new Error("heic2any 불러오기 실패"));
        };
        script.onerror = function() { reject(new Error("heic2any 스크립트를 불러오지 못했습니다.")); };
        document.head.appendChild(script);
    }).catch(function(err) {
        heicLoaderPromise = null;
        throw err;
    });
    return heicLoaderPromise;
}

async function convertHeicToJpegFile(file) {
    if (!isHeicFile(file)) return file;
    var heic2any = await ensureHeic2Any();
    var converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
    var blob = Array.isArray(converted) ? converted[0] : converted;
    var name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    if (typeof File === "function") return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
    blob.name = name;
    return blob;
}

async function handlePhotos(event) {
    var files = Array.from(event.target.files || []);
    if (!files.length) { clearNativePhotoUris(); return; }
    var loadedCount = 0;
    var failedCount = 0;
    var lastLocatedImportedPhoto = null;
    var sourceType = event.target && event.target.id === "camera-input" ? "camera" : "gallery";
    try {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            await showPhotoImportProgress(i + 1, files.length);
            try {
                var sourceUri = consumeNativePhotoUri(i);
                var cameraFallbackDate = sourceType === "camera" ? (pendingCameraCaptureDate || new Date()) : null;
                var cameraCaptureLocation = sourceType === "camera" ? pendingCameraCaptureLocation : null;
                var originalBlob = await getOriginalPhotoBlob(sourceUri, null) || file;
                var inspection = await inspectPhotoLocation(originalBlob, sourceType, cameraFallbackDate, cameraCaptureLocation);
                var takenDate = inspection.photoDate || cameraFallbackDate || new Date();
                var location = inspection.location;
                console.log("[GILOA EXIF DEBUG]", {
                    fileName: file && file.name || "",
                    mimeType: originalBlob && originalBlob.type || file && file.type || "",
                    nativeUri: describeNativePhotoUri(sourceUri),
                    originalBlobSize: originalBlob && originalBlob.size || 0,
                    exifGps: inspection.gps,
                    exifDate: inspection.photoDate,
                    finalLocation: location,
                    locationSource: location && location.source || "unknown"
                });
                var normalizedFile = await convertHeicToJpegFile(file);
                var img = await loadImageFromFile(normalizedFile);
                var importedPhoto = await processPhoto(img, takenDate, location && location.lat, location && location.lng, {
                    deferUi: true,
                    openPopup: files.length === 1,
                    originalBlob: originalBlob,
                    sourceUri: sourceUri,
                    sourceType: sourceType,
                    locationSource: location ? location.source : "unknown",
                    locationAccuracy: location ? location.accuracy : null,
                    deferImageAnalysis: true,
                    mission: activeImageMission ? { name: activeImageMission.name } : null
                });
                if (importedPhoto) {
                    loadedCount += 1;
                    if (isValidPhotoCoordinate(importedPhoto.lat, importedPhoto.lng)) {
                        lastLocatedImportedPhoto = importedPhoto;
                        setSelectedDestination(importedPhoto.lat, importedPhoto.lng, importedPhoto.dateString || getPhotoInteractionText().exifLocation);
                    }
                }
            } catch (e) {
                failedCount += 1;
                console.warn("사진 처리 실패:", file.name, e);
            }
        }
    } finally {
        hidePhotoImportProgress();
        if (sourceType === "camera") {
            pendingCameraCaptureDate = null;
            pendingCameraCaptureLocation = null;
        }
        clearNativePhotoUris();
        event.target.value = "";
        syncRecordingUI();
    }
    if (loadedCount > 0) {
        updateStats();
        scheduleSave();
        updatePhotoList();
        if (lastLocatedImportedPhoto) focusPhotoOnMap(lastLocatedImportedPhoto);
    }
    if (failedCount > 0) alert(earlyUiText("photoFailed", { count:failedCount }));
}
function createPhotoMarker(data, openPopup) {
    if (!data || !isValidPhotoCoordinate(data.lat, data.lng)) return null;
    var existingMarker = findPhotoMarker(data.id);
    if (existingMarker) {
        if (openPopup) existingMarker.openPopup();
        return existingMarker;
    }
    var size = getPhotoMarkerSize();
    lastPhotoMarkerSize = size;
    var marker = L.marker([data.lat, data.lng], { pane: "photoPane", icon: buildPhotoMarkerIcon(getPhotoDisplaySrc(data), size, data) });
    marker._photoData = data;
    var popupEl = document.createElement("div");
    popupEl.className = "photo-popup";
    var img = document.createElement("img");
    img.src = getPhotoDisplaySrc(data);
    marker._photoImageElement = img;
    img.style.cssText = "width:72vw;max-width:280px;border-radius:8px;margin-bottom:8px;display:block;cursor:pointer;";
    var photoText = getPhotoInteractionText();
    img.title = photoText.originalOpen;
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", photoText.originalOpen);
    var openOriginalPhoto = function(e) {
        if (e) e.stopPropagation();
        openPhotoInGallery(data);
    };
    img.addEventListener("click", openOriginalPhoto);
    img.addEventListener("keydown", function(e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openOriginalPhoto(e);
    });
    var info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:rgba(255,255,255,0.6);text-align:center;margin:6px 0 8px;";
    info.textContent = earlyMemoryDateText(data);
    var predictionInfo = document.createElement("div");
    renderPhotoImagePrediction(predictionInfo, data);
    marker._photoPredictionElement = predictionInfo;
    var delBtn = document.createElement("button");
    delBtn.className = "popup-delete-btn";
    delBtn.textContent = photoText.deletePhoto;
    delBtn.addEventListener("click", function() { deletePhoto(data.id); marker.closePopup(); });
    popupEl.appendChild(img);
    popupEl.appendChild(info);
    if (predictionInfo) popupEl.appendChild(predictionInfo);
    var memoInput = document.createElement("textarea");
    memoInput.className = "photo-memo-input";
    memoInput.placeholder = photoText.memoPlaceholder;
    memoInput.value = data.memo || "";
    var memoSave = document.createElement("button");
    memoSave.className = "photo-memo-save";
    memoSave.type = "button";
    memoSave.textContent = photoText.memoSave;
    memoSave.addEventListener("click", function() { data.memo = memoInput.value.trim(); scheduleSave(); updatePhotoList(); showCollectionToast(getPhotoInteractionText().memoSaved); showGiloReaction("memory", "", { force:true }); });
    popupEl.appendChild(memoInput);
    popupEl.appendChild(memoSave);
    var note = document.createElement("div");
    note.style.cssText = "font-size:11px;color:rgba(255,255,255,0.52);text-align:center;margin:0 0 8px;";
    var normalizedSource = normalizePhotoLocationSource(data.locationSource, isValidPhotoCoordinate(data.lat, data.lng));
    var locationLabel = photoText.unknownLocation;
    if (normalizedSource === "exif") locationLabel = photoText.exifLocation;
    else if (normalizedSource === "route") locationLabel = photoText.routeLocation;
    else if (normalizedSource === "current") locationLabel = photoText.currentLocation + (typeof data.locationAccuracy === "number" && isFinite(data.locationAccuracy) ? " · ±" + Math.round(data.locationAccuracy) + "m" : "");
    else if (normalizedSource === "manual") locationLabel = photoText.manualLocation;
    note.textContent = locationLabel + " · " + photoText.originalHint;
    popupEl.appendChild(note);
    var rereadBtn = document.createElement("button");
    rereadBtn.type = "button";
    rereadBtn.className = "photo-memo-save";
    rereadBtn.textContent = photoText.rereadLocation;
    rereadBtn.addEventListener("click", function() { reReadPhotoLocation(data); });
    popupEl.appendChild(rereadBtn);
    popupEl.appendChild(delBtn);
    marker.bindPopup(popupEl);
    photoClusterGroup.addLayer(marker);
    indexPhotoMarker(data.id, marker);
    if (openPopup) marker.openPopup();
    return marker;
}
function refreshPhotoMarkerImage(photo) {
    if (!photo) return;
    var marker = findPhotoMarker(photo.id);
    if (!marker) return;
    var src = getPhotoDisplaySrc(photo);
    if (typeof marker.setIcon === "function") marker.setIcon(buildPhotoMarkerIcon(src, getPhotoMarkerSize(), photo));
    if (marker._photoImageElement) marker._photoImageElement.src = src;
}
function rememberPhotoDisplayObjectUrl(photo, blob) {
    if (!photo || !blob || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
    var oldUrl = photoDisplayObjectUrls.get(photo.id);
    if (oldUrl && typeof URL.revokeObjectURL === "function") { try { URL.revokeObjectURL(oldUrl); } catch (_) {} }
    try {
        var url = URL.createObjectURL(blob);
        photoDisplayObjectUrls.set(photo.id, url);
        photo._displayObjectUrl = url;
        // Keep the normal display fields populated too, so marker resizing and
        // photo lists use the recovered image instead of falling back to SVG.
        if (!photo.thumb) photo.thumb = url;
        if (!photo.photo) photo.photo = url;
        refreshPhotoMarkerImage(photo);
        return true;
    } catch (_) { return false; }
}
async function hydratePhotoImageFromOriginal(photo, row) {
    if (!photo || photoHasImageData(photo)) return false;
    var original = row && row.originalBlob && row.originalBlob.size ? row.originalBlob : null;
    // sourceUri only resolves through the Android bridge. On the web build the
    // image can still live behind sourceWebPath or a remote URL, so the shared
    // lookup is used instead of the native-only one.
    if (!original) original = await getPhotoRecoveryBlob(photo).catch(function() { return null; });
    if (!original || !original.size) return false;
    // A JPEG/PNG can be displayed immediately while a compressed preview is
    // generated. This removes the placeholder even if canvas conversion fails.
    rememberPhotoDisplayObjectUrl(photo, original);
    try {
        var file = isHeicLikeBlob(original) ? await convertHeicToJpegFile(original) : original;
        var image = await loadImageFromFile(file);
        var thumb = resizeImage(image, { maxSize: PHOTO_THUMB_SIZE, quality: PHOTO_THUMB_JPEG_QUALITY, minQuality: PHOTO_THUMB_MIN_QUALITY, targetBytes: PHOTO_THUMB_TARGET_BYTES });
        var popup = PHOTO_STORE_PREVIEW ? resizeImage(image, { maxSize: PHOTO_POPUP_MAX_SIZE, quality: PHOTO_POPUP_JPEG_QUALITY, minQuality: PHOTO_POPUP_MIN_QUALITY, targetBytes: PHOTO_POPUP_TARGET_BYTES }) : "";
        photo.thumb = thumb || photo.thumb;
        photo.photo = popup || photo.photo || photo.thumb;
        var temporaryUrl = photoDisplayObjectUrls.get(photo.id);
        if (temporaryUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
            try { URL.revokeObjectURL(temporaryUrl); } catch (_) {}
        }
        photoDisplayObjectUrls.delete(photo.id);
        delete photo._displayObjectUrl;
        refreshPhotoMarkerImage(photo);
        // Repair the durable preview row so this photo is fast on the next run.
        await idbSavePhoto(photo.id, popup || photo.photo, thumb || photo.thumb, original, original.type || "image/jpeg").catch(function(error) {
            console.warn("Recovered photo preview could not be cached", error);
        });
        return true;
    } catch (error) {
        console.warn("Recovered photo preview conversion failed", error);
        return true;
    }
}
async function getPhotoRecoveryBlob(photo) {
    if (!photo || !photo.id) return null;
    var stored = await idbGetPhoto(photo.id).catch(function() { return null; });
    if (stored && stored.originalBlob && stored.originalBlob.size) return stored.originalBlob;
    if (photo.sourceUri) {
        var nativeBlob = await getOriginalPhotoBlob(photo.sourceUri, null).catch(function() { return null; });
        if (nativeBlob && nativeBlob.size) return nativeBlob;
    }
    var candidates = [photo.sourceWebPath, photo.remotePhotoUrl].filter(Boolean);
    for (var i = 0; i < candidates.length; i++) {
        var blob = await fetchBlobFromUrl(candidates[i]).catch(function() { return null; });
        if (blob && blob.size) return blob;
    }
    return null;
}
// Restores the true capture position from the original file. Returns true only when
// a real EXIF coordinate was found; it never falls back to the current position.
async function recoverPhotoLocationFromExif(photo, options) {
    options = options || {};
    if (!photo || !photo.id) return false;
    if (!options.force && isValidPhotoCoordinate(photo.lat, photo.lng)) return true;
    if (!options.force && photo._exifRecoveryTried) return false;
    photo._exifRecoveryTried = true;
    var blob = await getPhotoRecoveryBlob(photo).catch(function() { return null; });
    if (!blob) {
        if (!options.silent) showCollectionToast(getPhotoInteractionText().originalMissing);
        return false;
    }
    var gps = await getPhotoExifGps(blob).catch(function() { return null; });
    if (!gps || !isValidPhotoCoordinate(gps.lat, gps.lng)) {
        if (!options.silent) showCollectionToast(getPhotoInteractionText().rereadFailed);
        return false;
    }
    photo.lat = Number(gps.lat);
    photo.lng = Number(gps.lng);
    photo.locationSource = "exif";
    photo.locationAccuracy = null;
    var existing = findPhotoMarker(photo.id);
    if (existing) { photoClusterGroup.removeLayer(existing); forgetPhotoMarker(photo.id); }
    createPhotoMarker(photo, false);
    scheduleSave();
    return true;
}
async function reReadPhotoLocation(photo) {
    if (!photo || !photo.id) return;
    var restored = await recoverPhotoLocationFromExif(photo, { force: true });
    if (!restored) return;
    persistState();
    updatePhotoList();
    showCollectionToast(getPhotoInteractionText().locationRestored);
    setSelectedDestination(photo.lat, photo.lng, earlyMemoryDateText(photo, true) || getPhotoInteractionText().exifLocation);
    map.flyTo([photo.lat, photo.lng], Math.min(17, map.getMaxZoom()));
    var marker = findPhotoMarker(photo.id);
    if (marker && typeof marker.openPopup === "function") setTimeout(function() { marker.openPopup(); }, 700);
}
function deletePhoto(id) {
    var photo = photos.find(function(p) { return p.id === id; });
    if (!photo || !commitJourneyDeletion("photos", id)) return;
    deleteRemotePhotoFiles(photo);
    var marker = findPhotoMarker(id);
    if (marker) { photoClusterGroup.removeLayer(marker); forgetPhotoMarker(id); }
    idbDeletePhoto(id).catch(function(e) { console.warn("IDB 삭제 실패", e); });
    try { window.dispatchEvent(new CustomEvent("giloa:photo-deleted", { detail:{ photoId:id } })); } catch (_) {}
    updateStats();
}
function escapeHtml(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function getReadableImagePredictionLabel(label) {
    var text = String(label || "").trim();
    var photoText = getPhotoInteractionText();
    if (!text || /[^\w\s가-힣%-]/.test(text)) return photoText.photoAnalysis;
    return photoText.photoAnalysis;
}
function renderStoredMarkers() { memories.forEach(function(m) { createMemoryMarker(m, false); }); }
var PHOTO_LOCATION_MIGRATION_KEY = "giloa-photo-location-migration-v1";
var PHOTO_LOCATION_RECOVERY_BATCH = 5;
var photoLocationRecoveryRunning = false;
function scheduleDeferredPhotoLocationRecovery() {
    if (photoLocationRecoveryRunning) return;
    if (safeStorageGet(PHOTO_LOCATION_MIGRATION_KEY) === "done") return;
    // Never block the first paint: a handful of photos are inspected well after startup.
    setTimeout(function() { migratePhotoLocations(); }, 2500);
}
async function migratePhotoLocations(options) {
    options = options || {};
    if (photoLocationRecoveryRunning) return 0;
    if (!options.force && safeStorageGet(PHOTO_LOCATION_MIGRATION_KEY) === "done") return 0;
    photoLocationRecoveryRunning = true;
    var recovered = 0;
    try {
        var targets = photos.filter(function(p) { return p && !isValidPhotoCoordinate(p.lat, p.lng) && !p._exifRecoveryTried; });
        var limit = options.force ? targets.length : Math.min(targets.length, PHOTO_LOCATION_RECOVERY_BATCH);
        for (var i = 0; i < limit; i++) {
            var restored = await recoverPhotoLocationFromExif(targets[i], { silent: true });
            if (restored) recovered += 1;
            await new Promise(function(resolve) { setTimeout(resolve, 120); });
        }
        if (recovered > 0) { persistState(); updatePhotoList(); }
        if (targets.length <= limit) safeStorageSet(PHOTO_LOCATION_MIGRATION_KEY, "done");
    } catch (error) {
        console.warn("\uc0ac\uc9c4 \uc704\uce58 \ubcf5\uad6c \uc2e4\ud328", error);
    } finally {
        photoLocationRecoveryRunning = false;
    }
    return recovered;
}
function renderStoredPhotoMarkers() {
    if (!Array.isArray(photos) || photos.length === 0) return;
    var applyStoredPhotos = function(idbList) {
        var idbMap = new Map((idbList || []).map(function(r) { return [r.id, r]; }));
        var fingerprintAdded = false;
        var mapped = 0;
        var unlocated = 0;
        photos.forEach(function(p) {
            var img = idbMap.get(p.id);
            if (img) {
                p.thumb = img.thumb || img.photo || p.thumb || "";
                p.photo = img.photo || p.thumb || "";
                p.hasOriginalBlob = !!img.originalBlob;
            } else {
                p.thumb = p.thumb || p.remoteThumbUrl || "";
                p.photo = p.photo || p.remotePhotoUrl || p.remoteThumbUrl || "";
            }
            if (!p.contentFingerprint && p.thumb) {
                p.contentFingerprint = getPhotoContentFingerprint(p.thumb);
                fingerprintAdded = true;
            }
            // The marker depends on the coordinate alone. Image data that failed to load
            // must not remove the memory from the map, and the photo is never deleted.
            if (isValidPhotoCoordinate(p.lat, p.lng)) { createPhotoMarker(p, false); mapped += 1; }
            else unlocated += 1;
            if (!photoHasImageData(p)) {
                // Preview recovery must not depend on the photo having coordinates.
                // A located photo showed its image while an unlocated one was stuck
                // with the placeholder forever, even though both can be repaired.
                hydratePhotoImageFromOriginal(p, img).then(function(recovered) {
                    if (recovered) { updatePhotoList(); scheduleSave(); }
                });
            }
        });
        if (fingerprintAdded) scheduleSave();
        updatePhotoList();
        console.log("[GILOA PHOTO] " + JSON.stringify({ total: photos.length, mapped: mapped, unlocated: unlocated, idbRows: idbMap.size }));
        if (unlocated > 0) scheduleDeferredPhotoLocationRecovery();
    };
    idbGetAllPhotos().then(applyStoredPhotos).catch(function(e) {
        // Even with no image store at all the coordinates alone rebuild every marker.
        console.warn("IDB \ubd88\ub7ec\uc624\uae30 \uc2e4\ud328 - \uc88c\ud45c\ub85c\ub9cc \uc0ac\uc9c4 \ub9c8\ucee4\ub97c \ubcf5\uc6d0\ud569\ub2c8\ub2e4", e);
        applyStoredPhotos([]);
    });
}
window.giloaPhotoDiagnostic = function(silent) {
    var summary = { total: photos.length, located: 0, unlocated: 0, exif: 0, manual: 0, current: 0, route: 0, map: 0, unknown: 0, markers: 0, missingImage: 0 };
    if (photoClusterGroup) photoClusterGroup.eachLayer(function() { summary.markers += 1; });
    var rows = photos.map(function(p) {
        var has = isValidPhotoCoordinate(p.lat, p.lng);
        var source = normalizePhotoLocationSource(p.locationSource, has);
        if (has) summary.located += 1; else summary.unlocated += 1;
        if (typeof summary[source] === "number") summary[source] += 1;
        if (!photoHasImageData(p)) summary.missingImage += 1;
        return {
            id: p.id, dateString: p.dateString,
            lat: has ? Number(p.lat) : null, lng: has ? Number(p.lng) : null,
            locationSource: source, sourceType: p.sourceType || "",
            image: photoHasImageData(p), marker: !!findPhotoMarker(p.id)
        };
    });
    console.log("[\uc0ac\uc9c4 \uc704\uce58 \uc9c4\ub2e8]", summary);
    if (!silent && summary.missingImage > 0 && window.giloaPhotoStorageDiagnostic) {
        setTimeout(function() { window.giloaPhotoStorageDiagnostic(); }, 400);
    }
    if (typeof console.table === "function") console.table(rows); else console.log(rows);
    var photoWords = getPhotoInteractionText();
    var text = "[" + earlyUiText("photoDiagnostic") + "]\n\n"
        + earlyUiText("totalPhotos") + ": " + summary.total + "\n"
        + earlyUiText("located") + ": " + summary.located + "\n"
        + earlyUiText("unlocated") + ": " + summary.unlocated + "\n"
        + earlyUiText("mapMarkers") + ": " + summary.markers + "\n"
        + earlyUiText("missingImage") + ": " + summary.missingImage + "\n\n"
        + photoWords.exifLocation + ": " + summary.exif + "\n"
        + photoWords.manualLocation + ": " + summary.manual + "\n"
        + photoWords.currentLocation + ": " + summary.current + "\n"
        + photoWords.routeLocation + ": " + summary.route + "\n"
        + earlyUiText("unknown") + ": " + (summary.unknown + summary.map);
    if (!silent) {
        // The APK has no DevTools and its WebView can swallow alert(), so the
        // report is written into the existing on-screen diagnostic panel first.
        showGiloaDiagnosticReport(text, earlyUiText("photoDiagnostic"));
    }
    return { summary: summary, photos: rows, text: text };
};
// Answers the one question the photo diagnostic could not: is the image row
// absent entirely, present but previewless, or present with an original that
// recovery should have used?
window.giloaPhotoStorageDiagnostic = async function() {
    var lines = ["[" + earlyUiText("storageDiagnostic") + "]", ""];
    lines.push(earlyUiText("address") + ": " + (location.origin || "file://"));
    lines.push(earlyUiText("totalPhotos") + ": " + photos.length);
    var rows = [];
    try {
        rows = await idbGetAllPhotos();
    } catch (error) {
        lines.push(earlyUiText("idbReadFailed") + ": " + (error && error.message));
        return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("storageDiagnostic"));
    }
    var byId = new Map((rows || []).map(function(r) { return [r.id, r]; }));
    var counts = { noRow: 0, rowNoImage: 0, rowWithOriginal: 0, ok: 0 };
    var samples = [];
    photos.forEach(function(p) {
        var row = byId.get(p.id);
        var state;
        if (photoHasImageData(p)) { state = "imageOk"; counts.ok += 1; }
        else if (!row) { state = "idbMissing"; counts.noRow += 1; }
        else if (row.originalBlob && row.originalBlob.size) { state = "originalOnly"; counts.rowWithOriginal += 1; }
        else { state = "rowWithoutImage"; counts.rowNoImage += 1; }
        if (state !== "imageOk" && samples.length < 8) {
            samples.push("  " + (p.dateString || p.id) + " → " + earlyUiText(state)
                + " | thumb " + ((p.thumb || "").length)
                + " | sourceUri " + earlyUiText(p.sourceUri ? "present" : "none")
                + " | remote " + earlyUiText(p.remoteThumbUrl || p.remotePhotoUrl ? "present" : "none"));
        }
    });
    lines.push(earlyUiText("idbRows") + ": " + byId.size);
    lines.push("");
    lines.push(earlyUiText("imagesOk") + ": " + counts.ok);
    lines.push(earlyUiText("idbMissing") + ": " + counts.noRow);
    lines.push(earlyUiText("rowWithoutImage") + ": " + counts.rowNoImage);
    lines.push(earlyUiText("recoverableOriginal") + ": " + counts.rowWithOriginal);
    if (samples.length) {
        lines.push("");
        lines.push("--- " + earlyUiText("problemPhotos") + " ---");
        lines = lines.concat(samples);
    }
    return showGiloaDiagnosticReport(lines.join("\n"), earlyUiText("storageDiagnostic"));
};
window.giloaRecoverPhotoLocations = function() { return migratePhotoLocations({ force: true }); };
function initGpxDial() { dialHours = 8; updateDialUI(); }
function initHudTapTargets() { var hud = document.getElementById("hud"); var handle = document.getElementById("hud-handle"); var distItem = document.querySelector(".hud-prog-item:nth-child(1)"); var photoItem = document.querySelector(".hud-prog-item:nth-child(3)"); if (hud && !hud.dataset.stopBound) { hud.dataset.stopBound = "1"; ["click", "pointerdown"].forEach(function(type) { hud.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true }); }); } if (handle) { handle.style.cursor = "pointer"; } if (distItem) { distItem.style.cursor = "pointer"; distItem.addEventListener("click", function() { toggleSidebar(true); switchTab("gpx"); }); } if (photoItem) { photoItem.style.cursor = "pointer"; photoItem.addEventListener("click", function() { toggleSidebar(true); switchTab("photo"); }); } }

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
if (markDone) {
    localStorage.setItem(TUTORIAL_DONE_KEY, "1");
}
}

function openGiloaGuideTutorial(force) {
    var wrap = document.getElementById("giloa-tutorial");
    if (!wrap) return;
    var completed = localStorage.getItem(TUTORIAL_DONE_KEY);
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
function hasSavedIntroLanguage(){var raw=localStorage.getItem(LANGUAGE_PREFERENCE_KEY);return localStorage.getItem(LANGUAGE_SELECTED_KEY)==="1"&&["ko","en","ja","zh","fr","es"].indexOf(raw)>=0;}
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
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY,language);localStorage.setItem(LANGUAGE_SELECTED_KEY,"1");currentLang=language;applyUILang(language);syncLanguageButtons(language);
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
        if(hasSavedIntroLanguage()){currentLang=normalizeLang(localStorage.getItem(LANGUAGE_PREFERENCE_KEY));applyUILang(currentLang);}
        renderGiloaOnboarding();
    } catch (error) {
        console.warn("showGiloaOnboarding text render failed", error && error.message);
    }
    return true;
}
function startMapTutorial(){if(typeof window.startGiloaTutorial==="function")window.startGiloaTutorial();}
function finishGiloaOnboarding(){
    var root=document.getElementById("giloa-story-intro"),language=normalizeLang(currentLang);localStorage.setItem(LANGUAGE_PREFERENCE_KEY,language);localStorage.setItem(LANGUAGE_SELECTED_KEY,"1");localStorage.setItem(FIRST_MEETING_DONE_KEY,"1");localStorage.setItem(INTRO_STORY_SEEN_KEY,"true");introStoryState.active=false;introStoryState.mode="";
    closeGiloaFeatureGuide();if(root){root.className="gsi";root.setAttribute("aria-hidden","true");}document.body.classList.remove("gsi-active");if(typeof map!=="undefined"&&map&&map.invalidateSize)setTimeout(function(){map.invalidateSize();},60);setTimeout(startMapTutorial,120);
    runInitStep("startup location", focusStartupLocation);
}
function setIntroArt(source){
    var root=document.getElementById("giloa-story-intro"),art=document.getElementById("gsi-art");if(!root||!art||!source||introStoryState.lastArt===source)return;introStoryState.lastArt=source;root.classList.add("changing");
    art.onerror=function(){root.classList.add("image-failed");root.classList.remove("changing");};art.onload=function(){root.classList.remove("image-failed","changing");};art.src=source;
}
function renderIntroStory(){
    if(!introStoryState.active||introStoryState.mode!=="story")return;var words=introStoryText(),screen=Math.max(1,Math.min(6,introStoryState.screen)),copy=document.getElementById("gsi-copy"),bar=document.getElementById("gsi-progress-bar"),progress=document.getElementById("gsi-progress"),count=document.getElementById("gsi-progress-count"),next=document.getElementById("gsi-next"),close=document.getElementById("gsi-story-close");
    setIntroArt(INTRO_SCREEN_FRAMES[screen-1]);if(copy){copy.textContent=(words.screens[screen-1]||[])[0]||"";copy.lang=normalizeLang(currentLang);}if(bar)bar.style.width=(screen/6*100)+"%";if(progress)progress.setAttribute("aria-label",screen+" / 6");if(count)count.textContent=screen+" / 6";
    if(next){setOnboardingText("gsi-next-copy",screen<6?words.next:(introStoryState.returnToOnboarding?onboardingText().storyBack:onboardingText().storyClose));next.setAttribute("aria-label",document.getElementById("gsi-next-copy").textContent);}if(close)close.setAttribute("aria-label",onboardingText().storyClose);
}
function showGiloStory(options){
    options=options||{};var root=document.getElementById("giloa-story-intro"),onboarding=document.getElementById("gsi-onboarding"),story=document.getElementById("gsi-story");if(!root||!story)return false;
    introStoryState={active:true,mode:"story",screen:1,returnToOnboarding:!!options.returnToOnboarding,completeToMap:!!options.completeToMap,lastArt:""};root.className="gsi active story-mode";root.setAttribute("aria-hidden","false");root.setAttribute("aria-labelledby","gsi-copy");if(onboarding)onboarding.hidden=true;story.hidden=false;document.body.classList.add("gsi-active");
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
function advanceGiloaIntroStory(event){if(event){event.preventDefault();event.stopPropagation();}if(!introStoryState.active||introStoryState.mode!=="story")return;if(introStoryState.screen<6){introStoryState.screen+=1;introStoryState.lastArt="";renderIntroStory();}else closeGiloStory();}
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
function startFirstLaunchExperience() {
    // 저장된 언어가 없으면 언어 선택 온보딩부터 표시한다.
    if (!hasSavedIntroLanguage()) {
        return showGiloaOnboarding();
    }

    currentLang = normalizeLang(
        localStorage.getItem(LANGUAGE_PREFERENCE_KEY)
    );
    applyUILang(currentLang);

    // 언어는 선택했지만 인트로를 아직 완료하지 않은 경우
    if (localStorage.getItem(INTRO_STORY_SEEN_KEY) !== "true") {
        return showGiloaOnboarding();
    }

    // 인트로 완료 후 지도 사용법 튜토리얼로 연결
    if (typeof window.startGiloaTutorialIfNeeded === "function") {
        return window.startGiloaTutorialIfNeeded();
    }

    return false;
}
window.showGiloaOnboarding=showGiloaOnboarding;window.showGiloStory=showGiloStory;window.closeGiloStory=closeGiloStory;window.startMapTutorial=startMapTutorial;
function prepareGuideCharacterImage() {
    return;
    var img = document.getElementById("giloa-guide-image");
    if (!img || img.dataset.chroma === "1") return;
    function process() {
        try {
            var canvas = document.createElement("canvas");
            var w = img.naturalWidth || img.width;
            var h = img.naturalHeight || img.height;
            if (!w || !h) return;
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var r = data[i], g = data[i + 1], b = data[i + 2];
                if (g > 135 && g > r * 1.45 && g > b * 1.45) {
                    var greenStrength = Math.min(255, Math.max(0, g - Math.max(r, b)));
                    data[i + 3] = greenStrength > 105 ? 0 : Math.min(data[i + 3], 90);
                }
            }
            ctx.putImageData(imageData, 0, 0);
            img.src = canvas.toDataURL("image/png");
            img.dataset.chroma = "1";
        } catch (e) {
            console.warn("Guide character chroma key failed", e);
        }
    }
    if (img.complete) process();
    else img.addEventListener("load", process, { once: true });
}

function runInitStep(name, action) {
    try {
        var result = action();
        if (result && typeof result.catch === "function") return result.catch(function(error) { console.warn("Init step failed: " + name, error && error.message); });
        return Promise.resolve(result);
    } catch (error) {
        console.warn("Init step failed: " + name, error && error.message);
        return Promise.resolve();
    }
}
function runJourneyDataIntegrityCheck() {
    var invalidPath = (pathCoordinates || []).filter(function(point) { return !isValidJourneyPoint(point, false); }).length;
    var invalidRaw = (rawGpsPoints || []).filter(function(point) { return !isValidJourneyPoint(point, true); }).length;
    var rpg = loadRpgGrowth();
    var rpgStats = rpg && rpg.stats ? rpg.stats : rpg;
    var invalidRpg = RPG_STAT_KEYS.some(function(key) { return !isFinite(rpgStats && rpgStats[key]) || Number(rpgStats[key]) < 0; });
    var report = {
        path:pathCoordinates.length, rawGps:rawGpsPoints.length, invalidPath:invalidPath, invalidRaw:invalidRaw,
        distance:totalDistance, photos:photos.length, memories:memories.length,
        visits:Array.isArray(visitStamps) ? visitStamps.length : 0, invalidRpg:invalidRpg
    };
    if (invalidPath || invalidRaw || !isFinite(totalDistance) || totalDistance < 0 || invalidRpg) console.warn("[GILOA RESTORE] integrity warning " + JSON.stringify(report));
    else if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] integrity " + JSON.stringify(report));
    return report;
}
async function initializePersistentJourneyState() {
    console.log("[GILOA RESTORE] start");
    // Fast phase: Android durable mirror + localStorage are synchronous/local and
    // can be restored before the first usable frame. Do not wait for IndexedDB
    // or the native GPS bridge before letting the user see and pan the map.
   var localLoaded =
    pathCoordinates.length > 0 ||
    rawGpsPoints.length > 0;
    if (window.GiloaBoot && typeof window.GiloaBoot.setStatus === "function") window.GiloaBoot.setStatus(earlyUiText("restoring"));
    var localPathCount = pathCoordinates.length;
    var durablePathCount = localPathCount;
    var indexedDbResult = await restoreRawGpsPoints();
        if (isNativeRouteTrackingActive()) {
     restoreNativeRecordingSession();
}
    var nativeResult = await consumeNativeRouteTrackingPoints({ deferPersist:true });
    var mergedBefore = Math.max(localPathCount, indexedDbResult.count, nativeResult.count, durablePathCount);
    var mergedCount = Math.max(pathCoordinates.length, rawGpsPoints.length);
    if (GILOA_PERSISTENCE_DEBUG) {
        console.log("[GILOA RESTORE] " + JSON.stringify({ localStoragePath:localPathCount, indexedDBGps:indexedDbResult.count, nativeGps:nativeResult.count, durableBackupPath:durablePathCount }));
        console.log("[GILOA RESTORE] " + JSON.stringify({ mergedGps:mergedCount, duplicateRemoved:Math.max(0, localPathCount + indexedDbResult.count + nativeResult.count - mergedCount), invalidRemoved:0 }));
    }
    var saved = persistState({ restoreCommit:true });
    if (saved && nativeResult.canAcknowledge && nativeResult.throughTime) acknowledgeNativeRouteTrackingPoints(getNativeRouteTrackingBridge(), nativeResult.throughTime);
    giloaPersistentStateReady = true;
    if (
    pendingRecordingStartAfterRestore &&
    !isRecording
) {
    pendingRecordingStartAfterRestore = false;

    setTimeout(function() {
        if (!isRecording) {
            toggleRecording();
        }
    }, 0);
}
    runJourneyDataIntegrityCheck();
    if (GILOA_PERSISTENCE_DEBUG) console.log("[GILOA RESTORE] " + JSON.stringify({ distance:(totalDistance / 1000).toFixed(2) + "km", photos:photos.length, memories:memories.length, visits:Array.isArray(visitStamps) ? visitStamps.length : 0, sourceMaximum:mergedBefore }));
    console.log("[GILOA RESTORE] COMPLETE");
    return localLoaded || mergedCount > 0;
}
async function init() {
    await runInitStep("canvas", resizeCanvas);
    // Make the shell responsive immediately. The map, menu, help and map panning
    // do not need to wait for IndexedDB/native route merging.
    await runInitStep("local user", ensureUserId);
    await runInitStep("durable state restore fast", restoreDurableStorageSnapshot);
    var fastStateLoaded = loadState();
    runInitStep("recording UI fast", syncRecordingUI);
    runInitStep("fog UI fast", syncFogButton);
    runInitStep("language UI fast", function() { applyUILang(currentLang); });
    runInitStep("statistics fast", updateStats);
    runInitStep("map render fast", function() { render(); scheduleRender(); map.invalidateSize(); });
    
    // Heavy recovery continues after the first usable frame. It merges IndexedDB
    // and native background GPS points without forcing the user to stare at a
    // frozen map. initializePersistentJourneyState() remains the source of truth.
    await new Promise(function(resolve) { setTimeout(resolve, 0); });
    await runInitStep("saved journey", initializePersistentJourneyState);
    if (isNativeRouteTrackingActive()) {
        restoreNativeRecordingSession();
        isRecording = true;
        trackingRequested = true;
    }
    runInitStep("stay bonus", loadBonusState);
    runInitStep("collection", function() {
        loadCollection();
        scheduleRegionStayRecalculation();});
    runInitStep("memory markers", renderStoredMarkers);
    runInitStep("saved places", renderSavedSpecialPlacePins);
    runInitStep("photo migration", function() { return migratePhotosToThumbOnly().finally(function() { runInitStep("photo markers", renderStoredPhotoMarkers); }); });
    runInitStep("statistics", updateStats);
    runInitStep("memory list", updateMemoryList);
    runInitStep("recording UI", syncRecordingUI);
    runInitStep("fog UI", syncFogButton);
    runInitStep("language UI", function() { applyUILang(currentLang); });
    runInitStep("RPG UI", function() { updateRpgGrowthUI(loadRpgGrowth()); });
    setTimeout(function() { runInitStep("map render", function() { render(); scheduleRender(); }); }, 100);
    runInitStep("GPX", initGpxDial);
    runInitStep("HUD", initHudTapTargets);
    // The first-run state machine lives in tutorial.js. Legacy guide/prologue
    // initializers remain inert for backward-compatible function references.
    // startFirstLaunchExperience()만 유일하게 runInitStep 보호 없이 호출되고 있었다.
    // 이 함수 내부(온보딩 표시/언어 텍스트 렌더링 등)에서 예외가 나면 다른 init 단계처럼
    // 조용히 넘어가지 못하고 init() 전체가 여기서 멈춰버려, 이후의 위치 권한 요청/자동
    // 기록 시작(6867~6870줄)까지 실행되지 않는 문제가 있었다. 다른 모든 init 단계와
    // 동일하게 runInitStep으로 감싸 예외를 흡수하고 나머지 init이 계속 진행되게 한다.
    var firstMeetingShown = false;
    runInitStep("first launch experience", function() { firstMeetingShown = startFirstLaunchExperience(); return firstMeetingShown; });
    runInitStep("startup location", focusStartupLocation);
    if (!firstMeetingShown) setTimeout(showGiloaUpdateNoticeIfNeeded, 450);
    runInitStep("atmosphere", updateTimeAtmosphere);
    setInterval(updateTimeAtmosphere, 10 * 60 * 1000);
    var specialEditor = document.getElementById("special-place-editor");
    if (specialEditor) specialEditor.addEventListener("click", function(e) { if (e.target === specialEditor) closeSpecialPlaceEditor(); });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && specialEditor && specialEditor.classList.contains("show")) closeSpecialPlaceEditor();
    });

if (
    window.GiloaBoot &&
    typeof window.GiloaBoot.markInteractive === "function"
) {
    window.GiloaBoot.markInteractive();
}
}
window.addEventListener("pagehide", function() {
    persistState();
});
var giloaPersistentStateReady = false;
var giloaLastHiddenAt = 0;
function refreshAfterAppResume() {
    // Android/WebView can return with a stale/black compositor surface.
    requestAnimationFrame(function() {
        try {
            map.invalidateSize({ pan:false, animate:false });
        } catch (_) {}

        scheduleRender();

        requestAnimationFrame(function() {
            try {
                map.invalidateSize({ pan:false, animate:false });
            } catch (_) {}

            scheduleRender();
        });
    });

    if (giloaPersistentStateReady) {
        /*
         * 앱이 잠금 화면이나 다른 앱에서 돌아왔을 때
         * 네이티브 서비스가 사용하던 동일한 기록 세션을 먼저 복원한다.
         */
        if (isNativeRouteTrackingActive()) {
            restoreNativeRecordingSession();
        }

        consumeNativeRouteTrackingPoints().then(function(result) {
            if (!result || !result.count) return;

            compactPathData();
            updateStats();
            scheduleRender();
        }).catch(function(error) {
            console.warn("Resume route merge failed", error);
        });
    }
}

window.addEventListener("giloa:app-resume", refreshAfterAppResume);

window.addEventListener("pageshow", function() { refreshAfterAppResume(); });
window.addEventListener("focus", function() { if (document.visibilityState === "visible") refreshAfterAppResume(); });
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible") refreshAfterAppResume();
    if (document.visibilityState === "hidden") {
    giloaLastHiddenAt = Date.now();
    persistState();
}
});
setInterval(function() {
    if (!giloaPersistentStateReady || !persistentStateDirty) return;
    compactPathData();
    persistState();
}, CHECKPOINT_INTERVAL_MS);
window.addEventListener("online", function() {
    if (typeof scheduleTourFetch === "function") scheduleTourFetch({ immediate: true });
    if (mapLayerSettings.restroom && typeof fetchRestroomsForCurrentArea === "function") fetchRestroomsForCurrentArea({ force: true });
    if (mapLayerSettings.library && typeof fetchLibraries === "function") fetchLibraries();
});
map.whenReady(function() { setTimeout(init, 0); });

// TourAPI 愿愿묕옙? 異붿쿇
var TOUR_API_KEY = window.GILOA_TOUR_API_KEY || "";

// 승인된 서비스: Kor/Eng/Jpn/Cht(중문 번체)/Spn(서어)/Fre(불어)
var TOUR_API_BASES = {
    ko: "KorService2",
    en: "EngService2",
    ja: "JpnService2",
    zh: "ChtService2",
    es: "SpnService2",
    fr: "FreService2"
};

function getTourApiBase(lang) {
    return "https://apis.data.go.kr/B551011/" +
        (TOUR_API_BASES[lang || currentLang] || TOUR_API_BASES.ko);
}

function getTourEndpoint(path, lang) {
    return getTourApiBase(lang) + "/" + path;
}

function formatTourCount(count) {
    var suffix = (UI_TEXT[currentLang] || UI_TEXT.ko).count_suffix;
    return currentLang === "ko" ||
        currentLang === "ja" ||
        currentLang === "zh"
        ? String(count) + suffix
        : String(count) + " " + suffix;
}

var tourItems = [];
var festivalItems = [];
var tourExpanded = false;
var tourPanelOpen = false;
var tourFetchTimer = null;
var tourMarkers = [];
var tourMarkerLayer = L.layerGroup().addTo(map);
var TOUR_VISIBLE_COUNT = 3;
var tourRequestSeq = 0;
var festivalRequestSeq = 0;
var tourTranslationRenderTimer = null;
var TOUR_CACHE_PREFIX = "giloa-tour-location-v2:";
var TOUR_LAST_CACHE_PREFIX = "giloa-tour-last-v4:";
var TOUR_FESTIVAL_CACHE_PREFIX = "giloa-tour-festivals-v4:";
var TOUR_LIKED_STORAGE_KEY = "giloa-tour-liked-v1";
var likedTourKeys = loadLikedTourKeys();
function loadLikedTourKeys() {
    try {
        var saved = JSON.parse(localStorage.getItem(TOUR_LIKED_STORAGE_KEY) || "[]");
        return new Set(Array.isArray(saved) ? saved.filter(function(key) { return typeof key === "string" && key.length > 0; }) : []);
    } catch (error) {
        console.warn("여행지 관심 표시를 불러오지 못했습니다.", error);
        return new Set();
    }
}
function getTourLikeKey(item) {
    if (!item) return "";
    if (item.contentid != null && String(item.contentid)) return "content:" + String(item.contentid);
    return "place:" + [item.mapy, item.mapx, item.title || item._displayTitle || ""].map(function(value) { return String(value == null ? "" : value).trim(); }).join("|");
}
function isTourLiked(item) { return likedTourKeys.has(getTourLikeKey(item)); }
function getMapPlaceLikeKey(kind, parts) {
    return String(kind || "place") + ":" + (parts || []).map(function(value) { return String(value == null ? "" : value).trim(); }).join("|");
}
function getTourLikeText(liked) {
    var labels = {
        ko: liked ? "마음에 든 장소" : "마음에 들어요",
        en: liked ? "Liked place" : "Mark as liked",
        ja: liked ? "お気に入りの場所" : "気に入った",
        zh: liked ? "喜欢的地点" : "标记为喜欢",
        es: liked ? "Lugar favorito" : "Me gusta",
        fr: liked ? "Lieu favori" : "J’aime"
    };
    return labels[currentLang] || labels.ko;
}
function saveLikedTourKeys() {
    try { localStorage.setItem(TOUR_LIKED_STORAGE_KEY, JSON.stringify(Array.from(likedTourKeys))); }
    catch (error) { console.warn("여행지 관심 표시를 저장하지 못했습니다.", error); }
}
function buildMapPlaceLikeButton(key) {
    var liked = likedTourKeys.has(key);
    return "<button type='button' class='tour-like-button" + (liked ? " is-liked" : "") + "' data-tour-like-key='" + escapeHtml(key) + "' aria-pressed='" + String(liked) + "'><span aria-hidden='true'>" + (liked ? "★" : "☆") + "</span> " + escapeHtml(getTourLikeText(liked)) + "</button>";
}
function updateMapPlaceLikedDom(key) {
    var liked = likedTourKeys.has(key);
    document.querySelectorAll("[data-place-like-key]").forEach(function(element) {
        if (element.getAttribute("data-place-like-key") === key) element.classList.toggle("state-liked", liked);
    });
    document.querySelectorAll(".tour-like-button[data-tour-like-key]").forEach(function(button) {
        if (button.getAttribute("data-tour-like-key") !== key) return;
        button.classList.toggle("is-liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.innerHTML = "<span aria-hidden='true'>" + (liked ? "★" : "☆") + "</span> " + escapeHtml(getTourLikeText(liked));
    });
}
document.addEventListener("click", function(event) {
    var button = event.target.closest && event.target.closest(".tour-like-button[data-tour-like-key]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    var key = button.getAttribute("data-tour-like-key") || "";
    if (!key) return;
    if (likedTourKeys.has(key)) likedTourKeys.delete(key); else likedTourKeys.add(key);
    saveLikedTourKeys();
    updateMapPlaceLikedDom(key);
    if (key.indexOf("content:") === 0 || key.indexOf("place:") === 0) { renderTourCards(); addTourMarkers(); }
}, true);
function toggleTourLiked(item) {
    var key = getTourLikeKey(item);
    if (!key) return;
    if (likedTourKeys.has(key)) likedTourKeys.delete(key); else likedTourKeys.add(key);
    saveLikedTourKeys();
    renderTourCards();
    addTourMarkers();
}
// 지도 이동 후 보이는 영역을 놓치지 않도록 충분히 짧게 유지한다.
var TOUR_SEARCH_MOVE_M = 120;
var TOUR_REVALIDATE_MS = 15 * 60 * 1000;
var tourSearchStateByLang = {};
var tourRefreshPromiseByLang = {};
var tourHydratedByLang = {};
var giloLoadingActiveRequests = 0;
var giloLoadingShowTimer = null;
var giloLoadingSlowTimer = null;
var giloLoadingStopTimer = null;
var giloLoadingHideTimer = null;
var giloLoadingShownAt = 0;
var giloLoadingMessageKey = "nearby";
var GILO_LOADING_DELAY_MS = 400;
var GILO_LOADING_MIN_VISIBLE_MS = 600;
var GILO_LOADING_SLOW_MS = 5000;
var GILO_LOADING_MESSAGES = {
    nearby: {
        ko: "길로가 주변 정보를 모으고 있어요",
        en: "Gilo is gathering nearby information",
        ja: "ギロが周辺情報を集めています",
        zh: "Gilo 正在收集附近信息"
        ,es: "Gilo está reuniendo información cercana"
    },
    slow: {
        ko: "주변 정보를 조금 더 살펴보고 있어요",
        en: "Gilo is looking a little further around",
        ja: "周辺情報をもう少し詳しく調べています",
        zh: "正在进一步查看附近信息"
        ,es: "Gilo está buscando un poco más alrededor"
    }
};
function getGiloLoadingElement() {
    return document.getElementById("gilo-tour-loading");
}
function updateGiloLoadingMessage(messageKey) {
    giloLoadingMessageKey = messageKey || giloLoadingMessageKey || "nearby";
    var messageEl = document.getElementById("gilo-loading-message");
    var messages = GILO_LOADING_MESSAGES[giloLoadingMessageKey] || GILO_LOADING_MESSAGES.nearby;
    if (messageEl) messageEl.textContent = messages[normalizeLang(currentLang || "ko")] || messages.ko;
}
function positionGiloLoading() {
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl) return;
    var viewportWidth = Math.max(280, window.innerWidth || document.documentElement.clientWidth || 360);
    var viewportHeight = Math.max(480, window.innerHeight || document.documentElement.clientHeight || 640);
    var hud = document.getElementById("hud");
    var hudHeight = hud ? hud.offsetHeight : 70;
    var baseX = viewportWidth * 0.5;
    var topClearance = Math.min(140, viewportHeight * 0.26);
    var bottomClearance = viewportHeight - hudHeight - 20;
    var minBaseY = topClearance + 36;
    var maxBaseY = Math.max(minBaseY, bottomClearance - 88);
    var baseY = Math.max(minBaseY, Math.min(viewportHeight * 0.43, maxBaseY));
    var rangeX = Math.max(18, Math.min(viewportWidth * 0.11, baseX - 58, viewportWidth - baseX - 58));
    var rangeY = Math.max(0, Math.min(viewportHeight * 0.1, baseY - topClearance - 36, bottomClearance - baseY - 36));
    loadingEl.style.setProperty("--gilo-base-x", Math.round(baseX) + "px");
    loadingEl.style.setProperty("--gilo-base-y", Math.round(baseY) + "px");
    loadingEl.style.setProperty("--gilo-x1", Math.round(-rangeX) + "px");
    loadingEl.style.setProperty("--gilo-y1", Math.round(-rangeY * 0.25) + "px");
    loadingEl.style.setProperty("--gilo-x2", Math.round(rangeX) + "px");
    loadingEl.style.setProperty("--gilo-y2", Math.round(-rangeY) + "px");
    loadingEl.style.setProperty("--gilo-x3", Math.round(rangeX * 0.15) + "px");
    loadingEl.style.setProperty("--gilo-y3", Math.round(rangeY) + "px");
}
function startGiloLoading(messageKey) {
    if (giloLoadingActiveRequests <= 0) return;
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl) return;
    positionGiloLoading();
    updateGiloLoadingMessage(messageKey || "nearby");
    loadingEl.classList.remove("completing");
    loadingEl.classList.add("visible");
    loadingEl.setAttribute("aria-hidden", "false");
    giloLoadingShownAt = Date.now();
}
function finishGiloLoadingHide() {
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl || giloLoadingActiveRequests > 0) return;
    loadingEl.classList.add("completing");
    giloLoadingHideTimer = setTimeout(function() {
        if (giloLoadingActiveRequests > 0) return;
        loadingEl.classList.remove("visible", "completing");
        loadingEl.setAttribute("aria-hidden", "true");
        giloLoadingShownAt = 0;
        giloLoadingHideTimer = null;
    }, 260);
}
function stopGiloLoading() {
    if (giloLoadingShowTimer) { clearTimeout(giloLoadingShowTimer); giloLoadingShowTimer = null; }
    if (giloLoadingSlowTimer) { clearTimeout(giloLoadingSlowTimer); giloLoadingSlowTimer = null; }
    var loadingEl = getGiloLoadingElement();
    if (!loadingEl || !loadingEl.classList.contains("visible")) return;
    var remaining = Math.max(0, GILO_LOADING_MIN_VISIBLE_MS - (Date.now() - giloLoadingShownAt));
    if (giloLoadingStopTimer) clearTimeout(giloLoadingStopTimer);
    giloLoadingStopTimer = setTimeout(function() {
        giloLoadingStopTimer = null;
        finishGiloLoadingHide();
    }, remaining);
}
function beginTourApiLoading() {
    var wasIdle = giloLoadingActiveRequests === 0;
    giloLoadingActiveRequests += 1;
    if (!wasIdle) return;
    if (giloLoadingStopTimer) { clearTimeout(giloLoadingStopTimer); giloLoadingStopTimer = null; }
    if (giloLoadingHideTimer) { clearTimeout(giloLoadingHideTimer); giloLoadingHideTimer = null; }
    var loadingEl = getGiloLoadingElement();
    if (loadingEl) loadingEl.classList.remove("completing");
    updateGiloLoadingMessage("nearby");
    positionGiloLoading();
    if (!loadingEl || !loadingEl.classList.contains("visible")) {
        giloLoadingShowTimer = setTimeout(function() {
            giloLoadingShowTimer = null;
            startGiloLoading("nearby");
        }, GILO_LOADING_DELAY_MS);
    }
    giloLoadingSlowTimer = setTimeout(function() {
        giloLoadingSlowTimer = null;
        if (giloLoadingActiveRequests > 0) updateGiloLoadingMessage("slow");
    }, GILO_LOADING_SLOW_MS);
}
function endTourApiLoading() {
    giloLoadingActiveRequests = Math.max(0, giloLoadingActiveRequests - 1);
    if (giloLoadingActiveRequests === 0) stopGiloLoading();
}
window.addEventListener("resize", function() {
    var loadingEl = getGiloLoadingElement();
    if (loadingEl && loadingEl.classList.contains("visible")) positionGiloLoading();
});
var giloLoadingImageEl = document.querySelector(".gilo-loading-character");
if (giloLoadingImageEl) {
    giloLoadingImageEl.addEventListener("error", function() {
        var halo = giloLoadingImageEl.parentNode;
        if (halo) halo.classList.add("image-missing");
    });
}
var TOUR_TYPE_NAMES = {
    ko: { "12": "관광지", "14": "문화시설", "15": "축제", "25": "여행코스", "28": "레포츠", "32": "숙박", "38": "쇼핑", "39": "음식점" },
    en: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Course", "28": "Leports", "32": "Stay", "38": "Shopping", "39": "Food" },
    ja: { "12": "観光地", "14": "文化施設", "15": "祭り", "25": "コース", "28": "レポーツ", "32": "宿泊", "38": "ショッピング", "39": "グルメ" },
    zh: { "12": "景点", "14": "文化设施", "15": "庆典", "25": "路线", "28": "休闲运动", "32": "住宿", "38": "购物", "39": "美食" }
    ,es: { "12": "Atracción", "14": "Cultura", "15": "Festival", "25": "Ruta", "28": "Deportes", "32": "Alojamiento", "38": "Compras", "39": "Gastronomía" }
    ,fr: { "12": "Attraction", "14": "Culture", "15": "Festival", "25": "Itinéraire", "28": "Loisirs sportifs", "32": "Hébergement", "38": "Shopping", "39": "Restauration" }
};
var TOUR_TYPE_LABELS = {
    ko: { "25": "코스", "28": "레포츠", "38": "쇼핑", "15": "축제", "12": "관광", "14": "문화", "32": "숙박", "39": "음식", default: "관광" },
    en: { "25": "Course", "28": "Leports", "38": "Shop", "15": "Fest", "12": "Spot", "14": "Culture", "32": "Stay", "39": "Food", default: "Spot" },
    ja: { "25": "コース", "28": "レポーツ", "38": "買物", "15": "祭り", "12": "観光", "14": "文化", "32": "宿泊", "39": "食事", default: "観光" },
    zh: { "25": "路线", "28": "运动", "38": "购物", "15": "庆典", "12": "景点", "14": "文化", "32": "住宿", "39": "美食", default: "景点" }
    ,es: { "25": "Ruta", "28": "Deporte", "38": "Compras", "15": "Festival", "12": "Lugar", "14": "Cultura", "32": "Hotel", "39": "Comida", default: "Lugar" }
    ,fr: { "25": "Itinéraire", "28": "Sport", "38": "Boutiques", "15": "Festival", "12": "Lieu", "14": "Culture", "32": "Hôtel", "39": "Restaurant", default: "Lieu" }
};
function getTourTypeName(contentTypeId) { var names = TOUR_TYPE_NAMES[currentLang] || TOUR_TYPE_NAMES.ko; return names[String(contentTypeId)] || names["12"]; }
function getTourTypeLabel(contentTypeId) { var labels = TOUR_TYPE_LABELS[currentLang] || TOUR_TYPE_LABELS.ko; return labels[String(contentTypeId)] || labels.default; }
var TOUR_TYPE_META = {
    "25": { label: "Course", color: "#ef4444", fill: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.55)" },
    "28": { label: "Leports", color: "#38bdf8", fill: "rgba(56,189,248,0.18)", border: "rgba(56,189,248,0.55)" },
    "38": { label: "Shop", color: "#facc15", fill: "rgba(250,204,21,0.18)", border: "rgba(250,204,21,0.58)" },
    "15": { label: "Fest", color: "#c084fc", fill: "rgba(192,132,252,0.18)", border: "rgba(192,132,252,0.58)" },
    "12": { label: "Spot", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" },
    "14": { label: "Culture", color: "#a78bfa", fill: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.58)" },
    "32": { label: "Stay", color: "#2dd4bf", fill: "rgba(45,212,191,0.18)", border: "rgba(45,212,191,0.58)" },
    "39": { label: "Food", color: "#fb7185", fill: "rgba(251,113,133,0.18)", border: "rgba(251,113,133,0.58)" },
    default: { label: "Spot", color: "#fb923c", fill: "rgba(251,146,60,0.18)", border: "rgba(251,146,60,0.58)" }
};
function getTourTypeMeta(contentTypeId) { var meta = TOUR_TYPE_META[String(contentTypeId)] || TOUR_TYPE_META.default; return Object.assign({}, meta, { label: getTourTypeLabel(contentTypeId) }); }
function isTourItemVisible(item) {
    var typeId = String(item && item.contenttypeid);
    return typeId !== "39" && typeId !== "32";
}
function getVisibleTourItems() {
    var center = getMapSearchCenter();
    return tourItems.filter(isTourItemVisible).filter(isNearbyMapLayerTourItem).sort(function(a, b) {
        return center.distanceTo([parseFloat(a.mapy), parseFloat(a.mapx)]) - center.distanceTo([parseFloat(b.mapy), parseFloat(b.mapx)]);
    }).slice(0, MAP_VIEWPORT_MARKER_LIMIT);
}
function getVisibleTourMarkerItems() {
    var center = getMapSearchCenter();
    return tourItems.filter(function(item) {
        var typeId = String(item && item.contenttypeid);
        if (typeId === "39") return !!mapLayerSettings.restaurant;
        if (typeId === "32") return !!mapLayerSettings.lodging;
        return !!mapLayerSettings.tourism;
    }).filter(isNearbyMapLayerTourItem).sort(function(a, b) {
        return center.distanceTo([parseFloat(a.mapy), parseFloat(a.mapx)]) - center.distanceTo([parseFloat(b.mapy), parseFloat(b.mapx)]);
    }).slice(0, MAP_VIEWPORT_MARKER_LIMIT);
}
function getMapSearchCenter() {
    // Search around the map area the user is actively browsing.
    return getMapBrowseCenter();
}
function getUserExperienceCenter() { return currentPos || map.getCenter(); }
function getMapBrowseCenter() { return map.getCenter(); }
function getMapSearchRadius() {
    if (!map || !map.getBounds || !map.getCenter) return MAP_LAYER_RADIUS_M;
    var bounds = map.getBounds();
    var center = map.getCenter();
    var corners = [bounds.getNorthEast(), bounds.getNorthWest(), bounds.getSouthEast(), bounds.getSouthWest()];
    var viewportRadius = corners.reduce(function(maxDistance, corner) {
        return Math.max(maxDistance, center.distanceTo(corner));
    }, MAP_LAYER_RADIUS_M);
    return Math.round(Math.max(MAP_LAYER_RADIUS_M, Math.min(MAP_VIEWPORT_MAX_RADIUS_M, viewportRadius * 1.12)));
}
function normalizeTourImageUrl(url) {
    if (!url) return "";
    var normalized = String(url).trim();
    // TourAPI can still return legacy HTTP image URLs. Android WebView and
    // installed HTTPS PWAs block those URLs even when they work in a browser.
    if (/^http:\/\//i.test(normalized)) normalized = normalized.replace(/^http:\/\//i, "https://");
    return /^https:\/\//i.test(normalized) ? normalized : "";
}
function getTourImage(item) {
    if (!item) return "";
    return normalizeTourImageUrl(item.firstimage) || normalizeTourImageUrl(item.firstimage2);
}
function getLastTourCacheKey(lang) {
    return TOUR_LAST_CACHE_PREFIX + (lang || currentLang || "ko");
}
function normalizeTourCacheRecord(record) {
    if (!record || !Array.isArray(record.items)) return null;
    var center = record.center;
    if (!center || !isFinite(parseFloat(center.lat)) || !isFinite(parseFloat(center.lng))) return null;
    return {
        center: { lat: parseFloat(center.lat), lng: parseFloat(center.lng) },
        savedAt: Number(record.savedAt) || 0,
        lastFetchedAt: Number(record.lastFetchedAt || record.savedAt) || 0,
        items: record.items
    };
}
function readLegacyTourCache(lang) {
    var newest = null;
    var prefix = TOUR_CACHE_PREFIX + (lang || currentLang || "ko") + ":";
    try {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf(prefix) !== 0) continue;
            var parts = key.slice(prefix.length).split(":");
            var cached = JSON.parse(localStorage.getItem(key) || "null");
            if (!cached || !Array.isArray(cached.items) || parts.length < 2) continue;
            var record = normalizeTourCacheRecord({
                center: { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) },
                savedAt: cached.savedAt,
                lastFetchedAt: cached.savedAt,
                items: cached.items
            });
            if (record && (!newest || record.savedAt > newest.savedAt)) newest = record;
        }
    } catch (e) { return null; }
    return newest;
}
function readLastTourCache(lang) {
    try {
        var record = normalizeTourCacheRecord(JSON.parse(localStorage.getItem(getLastTourCacheKey(lang)) || "null"));
        if (record) return record;
        return readLegacyTourCache(lang);
    } catch (e) { return null; }
}
function writeTourCache(center, lang, items, fetchedAt) {
    var record = {
        center: { lat: center.lat, lng: center.lng },
        savedAt: Date.now(),
        lastFetchedAt: fetchedAt || Date.now(),
        items: items
    };
    try {
        localStorage.setItem(getLastTourCacheKey(lang), JSON.stringify(record));
    } catch (e) { /* Storage can be unavailable or full; live results still work. */ }
    return record;
}
function readFestivalCache(lang) {
    try {
        return normalizeTourCacheRecord(JSON.parse(localStorage.getItem(TOUR_FESTIVAL_CACHE_PREFIX + lang) || "null"));
    } catch (e) { return null; }
}
function writeFestivalCache(center, lang, items) {
    try {
        localStorage.setItem(TOUR_FESTIVAL_CACHE_PREFIX + lang, JSON.stringify({
            center: { lat: center.lat, lng: center.lng },
            savedAt: Date.now(),
            lastFetchedAt: Date.now(),
            items: items
        }));
    } catch (e) { /* Keep live festival data even when storage is unavailable. */ }
}
function hydrateTourItemsFromCache(lang, force) {
    lang = lang || currentLang || "ko";
    if (tourHydratedByLang[lang] && !force) return false;
    tourHydratedByLang[lang] = true;
    var cached = readLastTourCache(lang);
    if (!cached) return false;
    tourSearchStateByLang[lang] = {
        center: cached.center,
        lastFetchedAt: cached.lastFetchedAt,
        itemCount: cached.items.length
    };
    tourItems = cached.items;
    markTourItemsSource(tourItems, lang);
    var cachedFestivals = readFestivalCache(lang);
    if (cachedFestivals) {
        festivalItems = cachedFestivals.items;
        markTourItemsSource(festivalItems, lang);
        updateFestivalBadge();
    }
    renderTourCards();
    updateTourSummary();
    translateTourItemsForLang(lang, tourItems);
    return true;
}
function updateTourSummary() {
    var countEl = document.getElementById("tour-count");
    var emptyEl = document.getElementById("tour-empty");
    var visibleItems = getVisibleTourItems();
    if (countEl) countEl.textContent = visibleItems.length ? formatTourCount(visibleItems.length) : "";
    if (emptyEl) {
        emptyEl.style.display = visibleItems.length ? "none" : "";
        if (!visibleItems.length) emptyEl.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour;
    }
}
function setTourRefreshing(refreshing) {
    var panel = document.getElementById("tour-panel");
    if (panel) panel.classList.toggle("refreshing", !!refreshing);
}
function makeTourImage(item, className) {
    var src = getTourImage(item);
    var wrap = document.createElement("div");
    wrap.className = className || "tour-card-image";
    if (!src) { wrap.classList.add("fallback"); wrap.setAttribute("aria-label", getTourUiText().noImage); return wrap; }
    var img = document.createElement("img");
    img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.referrerPolicy = "no-referrer";
    wrap.classList.add("loading");
    img.addEventListener("load", function() { wrap.classList.remove("loading"); });
    img.addEventListener("error", function() { img.remove(); wrap.classList.remove("loading"); wrap.classList.add("fallback"); });
    wrap.appendChild(img);
    var loadImage = function() { if (img.isConnected) img.src = src; };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(loadImage);
    else setTimeout(loadImage, 0);
    return wrap;
}
function isWithinMapSearchCenter(lat, lng, radiusM) {
    if (!map || !isFinite(lat) || !isFinite(lng)) return false;
    if (map.getBounds) return map.getBounds().pad(0.12).contains([lat, lng]);
    return getMapSearchCenter().distanceTo([lat, lng]) <= (radiusM || getMapSearchRadius());
}
function isNearbyMapLayerTourItem(item) {
    return isWithinMapSearchCenter(parseFloat(item && item.mapy), parseFloat(item && item.mapx), getMapSearchRadius());
}
function getNearbyFestivalItems() {
    return festivalItems.filter(isNearbyMapLayerTourItem);
}
function applyTourTypeVars(el, meta) { el.style.setProperty("--tour-color", meta.color); el.style.setProperty("--tour-fill", meta.fill); el.style.setProperty("--tour-border", meta.border); }function getTodayString() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + mm + dd;
}

function fetchFestivals(options) {
    options = options || {};
    var center = options.center || getMapSearchCenter();
    var today = getTodayString();
    var requestLang = currentLang;
    var requestSeq = ++festivalRequestSeq;
    var radiusM = options.radius || getMapSearchRadius();
    var buildUrl = function(lang) { return getTourEndpoint("searchFestival2", lang) + "?serviceKey=" + TOUR_API_KEY + "&eventStartDate=" + today + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=100&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    beginTourApiLoading();
    var festivalRequest;
    try {
        festivalRequest = fetchTourJsonWithFallback(buildUrl, requestLang);
    } catch (error) {
        endTourApiLoading();
        return Promise.reject(error);
    }
    return festivalRequest.then(function(data) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        var body = data && data.response && data.response.body;
        var header = data && data.response && data.response.header;
        if (!body || (header && header.resultCode && header.resultCode !== "0000")) throw new Error("Festival API returned an invalid response");
        var items = [];
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        festivalItems = items; markTourItemsSource(festivalItems, data._giloaSourceLang || requestLang); translateTourItemsForLang(currentLang, festivalItems);
        writeFestivalCache(center, requestLang, festivalItems);
        updateFestivalBadge();
        if (tourPanelOpen) renderFestivalStrip();
    }).catch(function(err) {
        if (requestSeq !== festivalRequestSeq || requestLang !== currentLang) return;
        console.warn("Festival API request failed");
        throw err;
    }).finally(endTourApiLoading);
}

function updateFestivalBadge() {
    var badge = document.getElementById("tour-festival-badge");
    if (!badge) return;
    var nearbyItems = getNearbyFestivalItems();
    if (nearbyItems.length > 0) { badge.textContent = (UI_TEXT[currentLang] || UI_TEXT.ko).festival_badge + " " + nearbyItems.length; badge.classList.add("show"); }
    else { badge.classList.remove("show"); }
}

function renderFestivalStrip() {
    var gpsBefore = captureGpsIntegrity();
    logGpsLayerChange("BEFORE festival-refresh", gpsBefore);
    var label = document.getElementById("festival-strip-label");
    var strip = document.getElementById("festival-strip");
    if (!strip || !label) { refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore); return; }
    var nearbyItems = getNearbyFestivalItems();
    if (nearbyItems.length === 0) { strip.classList.remove("show"); label.classList.remove("show"); refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore); return; }
    strip.innerHTML = "";
    var center = getMapSearchCenter();
    nearbyItems.forEach(function(item) {
        var card = document.createElement("div"); card.className = "festival-card"; applyTourTypeVars(card, getTourTypeMeta("15"));
        var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName("15");
        var nameEl = document.createElement("div"); nameEl.className = "festival-card-name"; nameEl.textContent = getTourDisplayTitle(item) || getTourTypeName("15");
        var dateEl = document.createElement("div"); dateEl.className = "festival-card-date";
        var start = item.eventstartdate || ""; var end = item.eventenddate || "";
        if (start.length === 8) start = start.slice(0,4) + "." + start.slice(4,6) + "." + start.slice(6,8);
        if (end.length === 8) end = end.slice(0,4) + "." + end.slice(4,6) + "." + end.slice(6,8);
        dateEl.textContent = start + (end && end !== start ? " ~ " + end : "");
        var distEl = document.createElement("div"); distEl.className = "festival-card-dist";
        var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
        distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
        card.appendChild(typeEl); card.appendChild(nameEl); card.appendChild(dateEl); card.appendChild(distEl);
        card.addEventListener("click", function() {
            focusTourItemBelowPanel(item);
        });
        strip.appendChild(card);
    });
    label.classList.add("show"); strip.classList.add("show");
    refreshGpsVisualsAfterPlaceLayerChange("festival-refresh", gpsBefore);
}

var LOCGO_HUB_ENDPOINT = "https://apis.data.go.kr/B551011/LocgoHubTarService1";
function fetchLocgoHubItems(center, radiusM) {
    var url = LOCGO_HUB_ENDPOINT + "/locationBasedList1?serviceKey=" + TOUR_API_KEY +
        "&numOfRows=500&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&listYN=Y&arrange=E" +
        "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM;
    return fetch(url, { cache: "no-store" }).then(function(res) {
        if (!res.ok) throw new Error("LocgoHubTarService1 HTTP " + res.status);
        return res.json();
    }).then(function(data) {
        var body = data && data.response && data.response.body;
        var items = body && body.items && body.items.item;
        items = Array.isArray(items) ? items : (items ? [items] : []);
        return items.filter(function(it) {
            return it && it.contentid && isFinite(parseFloat(it.mapx)) && isFinite(parseFloat(it.mapy));
        }).map(function(it) {
            return {
                contentid: "locgo:" + it.contentid, title: it.title || "", mapx: it.mapx, mapy: it.mapy,
                addr1: it.addr1 || "", contenttypeid: it.contenttypeid || "12",
                firstimage: it.firstimage || "", firstimage2: it.firstimage2 || "", _giloaSource: "locgo"
            };
        });
    }).catch(function(error) { console.warn("LocgoHubTarService1 request failed", error && error.message); return []; });
}
// 한국관광공사 TourAPI 결과와 겹치지 않는 지점만 지자체 중심 관광지 데이터를 더해준다.
function mergeLocgoHubTour(center, radiusM, requestSeq) {
    if (!mapLayerSettings.tourism) return;
    fetchLocgoHubItems(center, radiusM).then(function(extra) {
        if (!extra.length || requestSeq !== tourRequestSeq || !mapLayerSettings.tourism) return;
        var seen = new Set(tourItems.map(function(t) { return Number(t.mapx).toFixed(4) + "," + Number(t.mapy).toFixed(4); }));
        var added = false;
        extra.forEach(function(item) {
            var key = Number(item.mapx).toFixed(4) + "," + Number(item.mapy).toFixed(4);
            if (seen.has(key)) return;
            seen.add(key); tourItems.push(item); added = true;
        });
        if (added) {
            markTourItemsSource([tourItems[tourItems.length - 1]], currentLang);
            renderTourCards(); addTourMarkers(); translateTourItemsForLang(currentLang, tourItems);
        }
    });
}
function fetchTourSpots(options) {
    options = options || {};
    var center = options.center || getMapSearchCenter();
    var radiusM = options.radius || getMapSearchRadius();
    var listEl = document.getElementById("tour-list"); var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty"); var expandBtn = document.getElementById("tour-expand-btn"); var countEl = document.getElementById("tour-count");
    if (!listEl || !loadingEl || !emptyEl || !expandBtn || !countEl) return;
    var hasExistingItems = tourItems.length > 0;
    loadingEl.style.display = hasExistingItems ? "none" : "";
    emptyEl.style.display = "none";
    expandBtn.style.display = "none";
    var requestLang = currentLang;
    var requestSeq = ++tourRequestSeq;
    // Dense Korean datasets contain many restaurants and lodging entries.
    // Fetch a broad page before separating tourism cards from optional map layers.
    var buildUrl = function(lang) { return getTourEndpoint("locationBasedList2", lang) + "?serviceKey=" + TOUR_API_KEY + "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM + "&numOfRows=1000&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json&arrange=E"; };
    beginTourApiLoading();
    var tourRequest;
    try {
        tourRequest = fetchTourJsonWithFallback(buildUrl, requestLang);
    } catch (error) {
        endTourApiLoading();
        return Promise.reject(error);
    }
    return tourRequest.then(function(data) {
        if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return false;
        loadingEl.style.display = "none"; var body = data && data.response && data.response.body; var items = [];
        var header = data && data.response && data.response.header;
        if (!body || (header && header.resultCode && header.resultCode !== "0000")) throw new Error("TourAPI returned an invalid response");
        if (body && body.items && body.items.item) { items = Array.isArray(body.items.item) ? body.items.item : [body.items.item]; }
        var nextItems = items.filter(function(item) {
            return item && item.contentid && isFinite(parseFloat(item.mapx)) && isFinite(parseFloat(item.mapy));
        }).map(function(item) {
            return {
                contentid: item.contentid, title: item.title || "", mapx: item.mapx, mapy: item.mapy,
                addr1: item.addr1 || "", contenttypeid: item.contenttypeid || "12",
                firstimage: item.firstimage || "", firstimage2: item.firstimage2 || ""
            };
        });
        if (nextItems.length || !options.keepExisting) tourItems = nextItems;
        markTourItemsSource(tourItems, data._giloaSourceLang || requestLang);
        if (nextItems.length) writeTourCache(center, requestLang, tourItems, Date.now());
        var visibleItems = getVisibleTourItems();
        if (visibleItems.length === 0) { emptyEl.style.display = ""; countEl.textContent = ""; renderTourCards(); return nextItems.length > 0; }
        countEl.textContent = formatTourCount(visibleItems.length); renderTourCards(); translateTourItemsForLang(currentLang, tourItems);
        mergeLocgoHubTour(center, radiusM, requestSeq);
        return nextItems.length > 0;
    }).catch(function(err) {
        if (requestSeq !== tourRequestSeq || requestLang !== currentLang) return;
        loadingEl.style.display = "none";
        if (!tourItems.length) {
            emptyEl.style.display = "";
            emptyEl.textContent = getTourUiText().loadFailed;
            countEl.textContent = "";
        } else {
            emptyEl.style.display = "none";
            updateTourSummary();
        }
        console.warn("TourAPI request failed");
        throw err;
    }).finally(endTourApiLoading);
}

function tourResponseHasItems(data) {
    var body = data && data.response && data.response.body;
    return !!(body && body.items && body.items.item);
}

function fetchTourJsonWithFallback(buildUrl, lang) {
    lang = normalizeLang(lang);
    var apiRequestLang = lang;
    var languageOrder = [apiRequestLang];
    if (languageOrder.indexOf("ko") < 0) languageOrder.push("ko");
    if (languageOrder.indexOf("en") < 0) languageOrder.push("en");
    var lastValidResponse = null;
    function waitForRetry() { return new Promise(function(resolve) { setTimeout(resolve, NETWORK_RETRY_DELAY_MS); }); }
    function fetchJson(url, retryCount) {
        var controller = typeof AbortController === "function" ? new AbortController() : null;
        var timer = setTimeout(function() { if (controller) controller.abort(); }, NETWORK_TIMEOUT_MS);
        return fetch(url, controller ? { signal: controller.signal, cache: "no-store" } : { cache: "no-store" }).then(function(res) {
            if (!res.ok) {
                var httpError = new Error("TourAPI HTTP " + res.status);
                httpError.status = res.status;
                throw httpError;
            }
            return res.json();
        }).catch(function(error) {
            var status = Number(error && error.status) || 0;
            var retryable = status === 0 || status === 408 || status === 429 || status >= 500;
            if (retryCount > 0 && retryable && navigator.onLine !== false) return waitForRetry().then(function() { return fetchJson(url, retryCount - 1); });
            throw error;
        }).finally(function() { clearTimeout(timer); });
    }
    function requestAt(index) {
        if (index >= languageOrder.length) {
            if (lastValidResponse) return Promise.resolve(lastValidResponse);
            return Promise.reject(new Error("TourAPI request failed in every supported fallback language"));
        }
        var sourceLang = languageOrder[index];
        return fetchJson(buildUrl(sourceLang), 1).then(function(data) {
            data._giloaSourceLang = sourceLang;
            var header = data && data.response && data.response.header;
            if (!header || !header.resultCode || header.resultCode === "0000") lastValidResponse = data;
            if (tourResponseHasItems(data)) return data;
            return requestAt(index + 1);
        }, function() { return requestAt(index + 1); });
    }
    return requestAt(0);
}
function getTourApiItem(data) {
    var body = data && data.response && data.response.body;
    var raw = body && body.items && body.items.item;
    return Array.isArray(raw) ? raw[0] : (raw || null);
}
function stripTourHtml(value) {
    var box = document.createElement("div");
    box.innerHTML = String(value || "").replace(/<br\s*\/?>/gi, "\n");
    return (box.textContent || box.innerText || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function fetchTourDetail(item) {
    if (!item || !item.contentid) return Promise.resolve(null);
    if (item._detailPromise) return item._detailPromise;
    var lang = currentLang;
    var contentId = encodeURIComponent(item.contentid);
    var contentTypeId = encodeURIComponent(item.contenttypeid || "");
    var commonUrl = function(requestLang) { return getTourEndpoint("detailCommon2", requestLang) + "?serviceKey=" + TOUR_API_KEY + "&contentId=" + contentId + "&MobileOS=ETC&MobileApp=Giloa&_type=json&defaultYN=Y&firstImageYN=Y&addrinfoYN=Y&mapinfoYN=Y&overviewYN=Y"; };
    var introUrl = function(requestLang) { return getTourEndpoint("detailIntro2", requestLang) + "?serviceKey=" + TOUR_API_KEY + "&contentId=" + contentId + "&contentTypeId=" + contentTypeId + "&MobileOS=ETC&MobileApp=Giloa&_type=json"; };
    item._detailPromise = Promise.all([
        fetchTourJsonWithFallback(commonUrl, lang).catch(function() { return null; }),
        fetchTourJsonWithFallback(introUrl, lang).catch(function() { return null; })
    ]).then(function(results) {
        var common = getTourApiItem(results[0]) || {};
        var intro = getTourApiItem(results[1]) || {};
        var sourceLang = normalizeLang((results[0] && results[0]._giloaSourceLang) || item._sourceLang || (hasHangul(common.overview || item.title || item.addr1) ? "ko" : lang));
        var detail = Object.assign({}, common, intro);
        detail._sourceLang = sourceLang;
        item._detail = detail;
        return detail;
    });
    return item._detailPromise;
}
function getTourDetailLines(detail) {
    if (!detail) return [];
    var lines = [];
    var overview = cleanTourText(stripTourHtml(detail.overview), "");
    if (overview) lines.push({ key: "overview", text: overview });
    var labelsByLang = {
        ko: { eventstartdate: "시작일", eventenddate: "종료일", playtime: "시간", eventplace: "장소", sponsor1: "주최", usetimefestival: "이용요금", infocenter: "문의", restdate: "휴무일", usetime: "운영시간" },
        en: { eventstartdate: "Starts", eventenddate: "Ends", playtime: "Time", eventplace: "Place", sponsor1: "Host", usetimefestival: "Fee", infocenter: "Contact", restdate: "Closed", usetime: "Hours" },
        ja: { eventstartdate: "開始日", eventenddate: "終了日", playtime: "時間", eventplace: "場所", sponsor1: "主催", usetimefestival: "料金", infocenter: "お問い合わせ", restdate: "休業日", usetime: "営業時間" },
        zh: { eventstartdate: "开始日期", eventenddate: "结束日期", playtime: "时间", eventplace: "地点", sponsor1: "主办方", usetimefestival: "费用", infocenter: "咨询", restdate: "休息日", usetime: "营业时间" },
        es: { eventstartdate: "Inicio", eventenddate: "Fin", playtime: "Horario", eventplace: "Lugar", sponsor1: "Organiza", usetimefestival: "Precio", infocenter: "Contacto", restdate: "Cerrado", usetime: "Horario" },
        fr: { eventstartdate: "Début", eventenddate: "Fin", playtime: "Horaire", eventplace: "Lieu", sponsor1: "Organisateur", usetimefestival: "Tarif", infocenter: "Contact", restdate: "Fermeture", usetime: "Horaires" }
    };
    var labels = labelsByLang[currentLang] || labelsByLang.ko;
    [
        "eventstartdate",
        "eventenddate",
        "playtime",
        "eventplace",
        "sponsor1",
        "usetimefestival",
        "infocenter",
        "restdate",
        "usetime"
    ].forEach(function(key) {
        var value = cleanTourText(stripTourHtml(detail[key]), "");
        if (value) lines.push({ key: key, label: labels[key] || key, text: value });
    });
    return lines;
}
function translateTourDetailLines(item, detail) {
    var lang = currentLang;
    var sourceLang = normalizeLang((detail && detail._sourceLang) || item._sourceLang || (hasHangul(detail && detail.overview) ? "ko" : lang));
    var lines = getTourDetailLines(detail);
    return Promise.all(lines.map(function(line) {
        var lineSource = hasHangul(line.text) ? "ko" : sourceLang;
        var translated = lineSource === lang ? Promise.resolve(line.text) : varcoTranslate(line.text, getVarcoLang(lineSource), getVarcoLang(lang));
        return translated.then(function(value) {
            var text = cleanTourText(value, "");
            return text ? (line.label ? line.label + ": " : "") + text : "";
        });
    })).then(function(translatedLines) { return translatedLines.filter(Boolean); });
}
var TOUR_UI_I18N = {
    ko:{phone:"전화",loading:"상세 정보를 불러오는 중...",noDetails:"상세 정보가 없습니다.",noImage:"이미지 없음",credit:"출처: ⓒ한국관광공사",loadFailed:"관광지 정보를 불러오지 못했어요. 지도를 다시 이동해 주세요.",customers:"고객 이용",paid:"유료",publicRestroom:"공중화장실",diagnostic:"두루누비 진단",stage:"단계",courses:"코스 정보",routes:"경로",points:"총 좌표",drawn:"그린 경로",error:"오류",none:"없음",waiting:"대기",loaded:"내장 경로 파일 로드됨",loadingRoutes:"경로 파일 불러오는 중",failedRoutes:"경로 파일 실패",off:"꺼짐",visibleRoutes:"주변 경로 표시됨",noRoutes:"주변 경로 없음"},
    en:{phone:"Phone",loading:"Loading details...",noDetails:"No details available.",noImage:"No image",credit:"Source: ⓒKorea Tourism Organization",loadFailed:"Unable to load nearby places. Move the map to retry.",customers:"Customers only",paid:"Paid",publicRestroom:"Public restroom",diagnostic:"Durunubi diagnostics",stage:"Stage",courses:"Courses",routes:"Routes",points:"Total coordinates",drawn:"Routes drawn",error:"Error",none:"None",waiting:"Waiting",loaded:"Bundled routes loaded",loadingRoutes:"Loading route file",failedRoutes:"Route file failed",off:"Off",visibleRoutes:"Nearby routes shown",noRoutes:"No nearby routes"},
    ja:{phone:"電話",loading:"詳細情報を読み込み中...",noDetails:"詳細情報はありません。",noImage:"画像なし",credit:"出典: ⓒ韓国観光公社",loadFailed:"周辺のスポットを読み込めませんでした。地図を動かして再試行してください。",customers:"利用客専用",paid:"有料",publicRestroom:"公衆トイレ",diagnostic:"ドゥルヌビ診断",stage:"状態",courses:"コース情報",routes:"経路",points:"座標の総数",drawn:"表示中の経路",error:"エラー",none:"なし",waiting:"待機中",loaded:"内蔵経路を読み込みました",loadingRoutes:"経路ファイルを読み込み中",failedRoutes:"経路ファイルの読み込み失敗",off:"オフ",visibleRoutes:"周辺の経路を表示中",noRoutes:"周辺の経路なし"},
    zh:{phone:"电话",loading:"正在加载详细信息...",noDetails:"暂无详细信息。",noImage:"暂无图片",credit:"来源: ⓒ韩国观光公社",loadFailed:"无法加载附近地点。请移动地图后重试。",customers:"仅限顾客",paid:"收费",publicRestroom:"公共卫生间",diagnostic:"Durunubi 诊断",stage:"状态",courses:"路线信息",routes:"路径",points:"坐标总数",drawn:"已显示路径",error:"错误",none:"无",waiting:"等待中",loaded:"已加载内置路径",loadingRoutes:"正在加载路径文件",failedRoutes:"路径文件加载失败",off:"关闭",visibleRoutes:"已显示附近路径",noRoutes:"附近没有路径"},
    es:{phone:"Teléfono",loading:"Cargando información...",noDetails:"No hay información disponible.",noImage:"Sin imagen",credit:"Fuente: ⓒOrganización de Turismo de Corea",loadFailed:"No se pudieron cargar los lugares cercanos. Mueve el mapa para intentarlo de nuevo.",customers:"Solo clientes",paid:"De pago",publicRestroom:"Baño público",diagnostic:"Diagnóstico de Durunubi",stage:"Estado",courses:"Información de rutas",routes:"Recorridos",points:"Coordenadas totales",drawn:"Recorridos mostrados",error:"Error",none:"Ninguno",waiting:"En espera",loaded:"Rutas incluidas cargadas",loadingRoutes:"Cargando archivo de rutas",failedRoutes:"Error del archivo de rutas",off:"Desactivado",visibleRoutes:"Rutas cercanas visibles",noRoutes:"Sin rutas cercanas"},
    fr:{phone:"Téléphone",loading:"Chargement des détails...",noDetails:"Aucun détail disponible.",noImage:"Aucune image",credit:"Source : ⓒOffice du tourisme de Corée",loadFailed:"Impossible de charger les lieux à proximité. Déplacez la carte pour réessayer.",customers:"Réservé aux clients",paid:"Payant",publicRestroom:"Toilettes publiques",diagnostic:"Diagnostic de Durunubi",stage:"État",courses:"Informations sur les itinéraires",routes:"Parcours",points:"Total des coordonnées",drawn:"Parcours affichés",error:"Erreur",none:"Aucune",waiting:"En attente",loaded:"Parcours intégrés chargés",loadingRoutes:"Chargement du fichier des parcours",failedRoutes:"Échec du fichier des parcours",off:"Désactivé",visibleRoutes:"Parcours proches affichés",noRoutes:"Aucun parcours proche"}
};
function getTourUiText() { return TOUR_UI_I18N[normalizeLang(currentLang)] || TOUR_UI_I18N.en; }
// Only provider-supplied place popups use this translator. Saved memories and
// photo notes never enter this path, and translations are not written to records.
var activePublicPlacePopup = null;
function translatePublicPlacePopup(popup) {
    var language = normalizeLang(currentLang);
    var root = popup && popup.getElement && popup.getElement();
    if (language === "ko" || !root || navigator.onLine === false) return Promise.resolve();
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var entries = [], node;
    while ((node = walker.nextNode())) {
        if (hasHangul(node.nodeValue) && node.nodeValue.trim()) entries.push({node:node, text:node.nodeValue});
    }
    return entries.reduce(function(chain, entry) {
        return chain.then(function() {
            if (language !== normalizeLang(currentLang) || !entry.node.isConnected || !map.hasLayer(popup)) return;
            return varcoTranslate(entry.text, "ko", getVarcoLang(language)).then(function(translated) {
                if (language === normalizeLang(currentLang) && entry.node.isConnected && map.hasLayer(popup) && translated) entry.node.nodeValue = translated;
            });
        });
    }, Promise.resolve()).catch(function() { /* Keep the original public information when offline. */ });
}
function trackPublicPlacePopup(popup, refresh) {
    activePublicPlacePopup = {popup:popup, refresh:refresh};
    translatePublicPlacePopup(popup);
    return popup;
}
function refreshPublicPlacePopupLanguage() {
    var active = activePublicPlacePopup;
    if (active && map.hasLayer(active.popup)) active.refresh();
}
function buildTourPopupHtml(item, detailLines, isLoading) {
    var typeName = getTourTypeName(item.contenttypeid);
    var meta = getTourTypeMeta(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    var addr = getTourDisplayAddr(item);
    var words = getTourUiText();
    var telLabel = words.phone;
    var loadingText = words.loading;
    var noDetailText = words.noDetails;
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4db8ff;font-size:12px;'>" + telLabel + " " + escapeHtml(item.tel) + "</a>" : "";
    var tag = "<span class='tour-popup-tag' style='color:" + meta.color + ";border-color:" + meta.border + ";background:" + meta.fill + ";'>" + escapeHtml(typeName) + "</span>";
    var detailHtml = "";
    if (isLoading) detailHtml = "<div class='tour-popup-detail loading'>" + escapeHtml(loadingText) + "</div>";
    else if (detailLines && detailLines.length) {
        var readableLines = detailLines.map(function(line) {
            return cleanTourText(line, "");
        }).filter(Boolean);
        detailHtml = readableLines.length
            ? "<div class='tour-popup-detail'>" + readableLines.map(function(line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div>"
            : "<div class='tour-popup-detail muted'>" + escapeHtml(noDetailText) + "</div>";
    }
    else detailHtml = "<div class='tour-popup-detail muted'>" + escapeHtml(noDetailText) + "</div>";
    var image = getTourImage(item);
    var imageHtml = image
        ? "<div class='tour-popup-image'><img src='" + escapeHtml(image) + "' alt='' referrerpolicy='no-referrer' onerror=\"this.parentNode.classList.add('fallback');this.remove()\"></div>"
        : "<div class='tour-popup-image fallback' aria-label='" + escapeHtml(words.noImage) + "'></div>";
    var liked = isTourLiked(item);
    var likeButton = buildMapPlaceLikeButton(getTourLikeKey(item));
    return imageHtml + "<b class='tour-popup-title'>" + escapeHtml(title) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + tel + detailHtml + likeButton + "<small class='tour-popup-credit'>" + escapeHtml(words.credit) + "</small>";
}
function hideFestivalStrip() {
    var strip = document.getElementById("festival-strip");
    var label = document.getElementById("festival-strip-label");
    if (strip) strip.classList.remove("show");
    if (label) label.classList.remove("show");
}

function syncTourCloseButton() {
    var closeBtn = document.getElementById("tour-close-btn");
    if (closeBtn) closeBtn.style.display = "none";
    var header = document.getElementById("tour-header");
    if (header) header.setAttribute("aria-expanded", String(tourPanelOpen));
    var toggleIcon = document.getElementById("tour-toggle-icon");
    if (toggleIcon) toggleIcon.classList.toggle("open", tourPanelOpen);
}

function renderTourCards() {
    var listEl = document.getElementById("tour-list"); var expandBtn = document.getElementById("tour-expand-btn"); if (!listEl || !expandBtn) return;
    var previousScrollTop = listEl.scrollTop;
    listEl.innerHTML = ""; var center = getMapSearchCenter();
    var visibleItems = getVisibleTourItems();
    var panel = document.getElementById("tour-panel");
    if (panel) panel.classList.toggle("collapsed", !tourPanelOpen);
    if (!tourPanelOpen) {
        expandBtn.style.display = "none";
        listEl.classList.remove("expanded");
        hideFestivalStrip();
        syncTourCloseButton();
        addTourMarkers();
        return;
    }
    var showCount = visibleItems.length;
    for (var i = 0; i < showCount; i++) {
        (function(item) {
            var meta = getTourTypeMeta(item.contenttypeid);
            var card = document.createElement("div"); card.className = "tour-card" + (isTourLiked(item) ? " is-liked" : ""); card.setAttribute("data-place-like-key", getTourLikeKey(item)); card.tabIndex = 0; card.setAttribute("role", "button"); applyTourTypeVars(card, meta);
            var imageEl = makeTourImage(item, "tour-card-image");
            var infoEl = document.createElement("div"); infoEl.className = "tour-card-info";
            var nameEl = document.createElement("div"); nameEl.className = "tour-card-name"; nameEl.textContent = getTourDisplayTitle(item) || (UI_TEXT[currentLang] || UI_TEXT.ko).empty_tour;
            var typeEl = document.createElement("div"); typeEl.className = "tour-card-type"; typeEl.textContent = getTourTypeName(item.contenttypeid) || meta.label;
            var addrEl = document.createElement("div"); addrEl.className = "tour-card-addr"; addrEl.textContent = getTourDisplayAddr(item) || "";
            var distEl = document.createElement("div"); distEl.className = "tour-card-dist";
            var distM = center.distanceTo([parseFloat(item.mapy), parseFloat(item.mapx)]);
            distEl.textContent = distM < 1000 ? Math.round(distM) + "m" : (distM / 1000).toFixed(1) + "km";
            infoEl.appendChild(nameEl); infoEl.appendChild(typeEl); infoEl.appendChild(distEl);
            card.appendChild(imageEl); card.appendChild(infoEl);
            var openItem = function() { focusTourItemBelowPanel(item); };
            card.addEventListener("click", openItem);
            card.addEventListener("keydown", function(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openItem(); } });
            listEl.appendChild(card);
        })(visibleItems[i]);
    }
    expandBtn.style.display = "none";
    var expandIcon = document.getElementById("tour-expand-icon");
    var expandText = document.getElementById("tour-expand-text");
    if (expandIcon) expandIcon.textContent = tourExpanded ? "-" : "+";
    if (expandText) expandText.textContent = tourExpanded ? ((UI_TEXT[currentLang] || UI_TEXT.ko).close || "Close") : ((UI_TEXT[currentLang] || UI_TEXT.ko).more || "More");
    listEl.classList.toggle("expanded", visibleItems.length > 0 && tourPanelOpen);
    if (previousScrollTop > 0) {
        requestAnimationFrame(function() { listEl.scrollTop = previousScrollTop; });
    }
    syncTourCloseButton();
    addTourMarkers();
    if (tourPanelOpen) renderFestivalStrip();
    else hideFestivalStrip();
}

function collapseTourPanel() {
    var loadingEl = document.getElementById("tour-loading");
    var emptyEl = document.getElementById("tour-empty");
    if (loadingEl) loadingEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    tourPanelOpen = false;
    tourExpanded = false;
    renderTourCards();
    map.closePopup();
}

function closeTourPanel(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    collapseTourPanel();
}

function toggleTourExpand() {
    if (tourPanelOpen) {
        tourPanelOpen = false;
        tourExpanded = false;
    } else {
        tourPanelOpen = true;
        tourExpanded = false;
        updateTourSummary();
        // 사용자가 패널을 열면 캐시 상태와 관계없이 현재 경험 중심을 확인한다.
        refreshTourData({ forceHydrate: false, force: true });
    }
    renderTourCards();
}

function toggleTourMore(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    tourPanelOpen = true;
    tourExpanded = !tourExpanded;
    renderTourCards();
}
var tourHeaderEl = document.getElementById("tour-header");
if (tourHeaderEl) {
    tourHeaderEl.addEventListener("click", function(event) { event.stopPropagation(); toggleTourExpand(); });
    tourHeaderEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); toggleTourExpand(); }
    });
}
var tourListInteractionEl = document.getElementById("tour-list");
if (tourListInteractionEl) {
    if (window.L && L.DomEvent) {
        L.DomEvent.disableClickPropagation(tourListInteractionEl);
        L.DomEvent.disableScrollPropagation(tourListInteractionEl);
    }
    ["touchstart", "touchmove", "pointerdown", "wheel"].forEach(function(eventName) {
        tourListInteractionEl.addEventListener(eventName, function(event) {
            event.stopPropagation();
        }, { passive: true });
    });
}
var hamButtonEl = document.getElementById("ham-btn");
if (hamButtonEl) {
    hamButtonEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSidebar();
        }
    });
}

var tourFocusSequence = 0;
function focusTourItemBelowPanel(item) {
    var lat = parseFloat(item && item.mapy);
    var lng = parseFloat(item && item.mapx);
    if (!isFinite(lat) || !isFinite(lng)) return;
    var sequence = ++tourFocusSequence;
    var destination = L.latLng(lat, lng);
    var adjusted = false;
    function openSelectedPopup() {
        if (sequence !== tourFocusSequence) return;
        showTourPopup(item);
    }
    function adjustSelectedPosition() {
        if (adjusted || sequence !== tourFocusSequence) return;
        adjusted = true;
        map.off("moveend", adjustSelectedPosition);
        var mapContainer = map.getContainer();
        var mapRect = mapContainer.getBoundingClientRect();
        var mapHeight = mapContainer.clientHeight || mapRect.height;
        var mapWidth = mapContainer.clientWidth || mapRect.width;
        var panel = document.getElementById("tour-panel");
        var panelBottom = 0;
        if (panel && tourPanelOpen) {
            var panelRect = panel.getBoundingClientRect();
            panelBottom = Math.max(0, panelRect.bottom - mapRect.top);
        }
        var minTargetY = mapHeight * 0.68;
        var maxTargetY = mapHeight * 0.75;
        var popupClearance = Math.min(180, mapHeight * 0.24);
        var targetY = Math.max(mapHeight * 0.70, panelBottom + popupClearance);
        targetY = Math.max(minTargetY, Math.min(maxTargetY, targetY));
        var hud = document.getElementById("hud");
        var hudHeight = hud ? hud.offsetHeight : 70;
        targetY = Math.min(targetY, mapHeight - hudHeight - 36);
        var targetX = mapWidth * 0.5;
        var currentPoint = map.latLngToContainerPoint(destination);
        var panOffset = L.point(currentPoint.x - targetX, currentPoint.y - targetY);
        var popupOpened = false;
        function openOnce() {
            if (popupOpened || sequence !== tourFocusSequence) return;
            popupOpened = true;
            map.off("moveend", openOnce);
            openSelectedPopup();
        }
        if (Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1) {
            map.once("moveend", openOnce);
            map.panBy(panOffset, { animate: true, duration: 0.28 });
            setTimeout(openOnce, 420);
        } else {
            openOnce();
        }
    }
    map.once("moveend", adjustSelectedPosition);
    map.flyTo(destination, Math.max(map.getZoom(), 17), { animate: true, duration: 0.38 });
    setTimeout(adjustSelectedPosition, 700);
}

function showTourPopup(item) {
    var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx);
    var typeName = getTourTypeName(item.contenttypeid);
    var title = getTourDisplayTitle(item);
    setSelectedDestination(lat, lng, title || typeName || getTourUiText().noDetails);
    var popup = L.popup({
        className: "tour-popup",
        autoPan: false,
        keepInView: false,
        maxWidth: 280,
        offset: L.point(0, -6)
    })
        .setLatLng([lat, lng])
        .setContent(buildTourPopupHtml(item, null, true))
        .openOn(map);
    trackPublicPlacePopup(popup, function() { showTourPopup(item); });
    var popupLanguage = normalizeLang(currentLang);
    fetchTourDetail(item).then(function(detail) {
        if (popupLanguage !== normalizeLang(currentLang) || !map.hasLayer(popup)) return [];
        return translateTourDetailLines(item, detail);
    }).then(function(lines) {
        if (popupLanguage !== normalizeLang(currentLang) || !map.hasLayer(popup)) return;
        item._translatedDetailLines = lines;
        popup.setContent(buildTourPopupHtml(item, lines, false));
        translatePublicPlacePopup(popup);
    }).catch(function() {
        if (popupLanguage === normalizeLang(currentLang) && map.hasLayer(popup)) {
            popup.setContent(buildTourPopupHtml(item, [], false));
            translatePublicPlacePopup(popup);
        }
    });
}

function clearTourMarkers() {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE tour-clear", before);
    tourMarkerLayer.clearLayers();
    tourMarkers = [];
    refreshGpsVisualsAfterPlaceLayerChange("tour-clear", before);
}
function addTourMarkers() {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE tour-refresh", before);
    tourMarkerLayer.clearLayers();
    tourMarkers = [];
    getVisibleTourMarkerItems().forEach(function(item, index) { var lat = parseFloat(item.mapy); var lng = parseFloat(item.mapx); if (!isFinite(lat) || !isFinite(lng)) return; var meta = getTourTypeMeta(item.contenttypeid); var state = getTourMarkerState(item, index); var liked = isTourLiked(item); var likeKey = getTourLikeKey(item); var classes = [state.visited ? "state-visited" : "", state.selected ? "state-selected" : "", state.nearby ? "state-nearby" : "", state.discoverable ? "state-discoverable" : "", liked ? "state-liked" : ""].filter(Boolean).join(" "); var badge = liked ? "★" : state.visited ? "✓" : state.missionAvailable ? "📷" : state.discoverable ? "◎" : ""; var icon = L.divIcon({ className: "tour-map-marker-wrap", html: "<div class='tour-map-marker " + classes + "' data-place-like-key='" + escapeHtml(likeKey) + "' style='--tour-color:" + meta.color + ";--tour-fill:" + meta.fill + ";--tour-border:" + meta.border + ";'><span class='tour-map-dot'></span><span class='tour-map-label'>" + escapeHtml(meta.label) + "</span>" + (badge ? "<span class='tour-map-badge'>" + badge + "</span>" : "") + "</div>", iconSize: [84, 30], iconAnchor: [10, 15] }); var marker = L.marker([lat, lng], { pane: "tourPane", icon: icon, title: (getTourTypeName(item.contenttypeid) || meta.label) + " - " + (getTourDisplayTitle(item) || "") }).addTo(tourMarkerLayer); marker._tourItem = item; marker.on("click", function() { focusTourItemBelowPanel(item); }); tourMarkers.push(marker); });
    refreshGpsVisualsAfterPlaceLayerChange("tour-refresh", before);
}


// ?쒖슱 怨듦났?꾩꽌愿 ?꾩튂?뺣낫
var SEOUL_LIBRARY_API_KEY = window.GILOA_SEOUL_LIBRARY_API_KEY || "";
var SEOUL_LIBRARY_API_URL = "http://openapi.seoul.go.kr:8088/" + SEOUL_LIBRARY_API_KEY + "/json/SeoulPublicLibraryInfo/1/300/";
var SEOUL_LIBRARY_CACHE_KEY = "giloa-library-seoul-v1";
var SEOUL_LIBRARY_CACHE_MS = 30 * 24 * 60 * 60 * 1000;
var libraryItems = [];
var libraryMarkers = [];
var libraryMarkerLayer = L.layerGroup().addTo(map);
var LIBRARY_MARKER_COLOR = "#2563eb";

// Public restroom data: bundled coordinates first, then short background
// refreshes from Seoul Open Data / OSM. Last-known data remains usable offline.
var SEOUL_RESTROOM_API_KEY = window.GILOA_SEOUL_RESTROOM_API_KEY || "";
var SEOUL_RESTROOM_API_BASE = window.GILOA_SEOUL_RESTROOM_API_BASE || "http://openapi.seoul.go.kr:8088";
var SEOUL_RESTROOM_API_SERVICE = "mgisToiletPoi";
var SEOUL_RESTROOM_PAGE_SIZE = 1000;
var RESTROOM_DATA_URL = "./data/restrooms_seoul.json";
var RESTROOM_GEOCODE_CACHE_KEY = "giloa-restroom-geocode-cache";
var RESTROOM_SEOUL_CACHE_KEY = "giloa-restroom-seoul-v2";
var RESTROOM_AREA_CACHE_PREFIX = "giloa-restroom-area-v2:";
var RESTROOM_CACHE_FRESH_MS = 6 * 60 * 60 * 1000;
var RESTROOM_CACHE_STALE_MS = 30 * 24 * 60 * 60 * 1000;
var RESTROOM_SEOUL_REFRESH_MS = 24 * 60 * 60 * 1000;
var RESTROOM_PROVIDER_TIMEOUT_MS = 6500;
var RESTROOM_MAX_MARKERS = 100;
var RESTROOM_MAX_AREA_CACHES = 12;
var RESTROOM_OSM_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
var restroomRawItems = [];      // ?쒖슱 ?꾩껜 ?붿옣??(?대쫫+二쇱냼, 醫뚰몴 ?놁쓬)
var restroomRawLoaded = false;
var restroomGeoCache = {};      // { 二쇱냼: {lat, lng} } - localStorage???곴뎄 罹먯떆
var restroomVisibleItems = [];  // 醫뚰몴媛 ?뺣낫?섏뼱 ?ㅼ젣濡??쒖떆 以묒씤 ??ぉ
var restroomMarkers = [];
var restroomMarkerLayer = L.layerGroup().addTo(map);
var restroomSearchSeq = 0;
var restroomSearchPromise = null;
var restroomSearchKey = "";
var restroomAbortController = null;
var restroomSeoulRefreshPromise = null;
var restroomSeoulLastAttemptAt = 0;
var restroomGuFetched = {};     // ?대? 吏?ㅼ퐫?⑹쓣 ?쒕룄??援??대쫫 吏묓빀 (以묐났 諛⑹?)
var restroomGeocodeQueueBusy = false;
var RESTROOM_MARKER_COLOR = "#a3e635";

function normalizeLang(lang) {
    return ({ ko: "ko", en: "en", ja: "ja", jp: "ja", zh: "zh", cn: "zh", "zh-cn": "zh", "zh_cn": "zh", es: "es", "es-es": "es", "es_mx": "es", "es-mx": "es", fr: "fr", "fr-fr": "fr", "fr_ca": "fr", "fr-ca": "fr" })[String(lang || currentLang || "ko").toLowerCase()] || "ko";
}
function getLibraryLabel(lang) {
    var labels = { ko: "도서관", en: "Library", ja: "図書館", zh: "图书馆", es: "Biblioteca", fr: "Bibliothèque" };
    return labels[normalizeLang(lang)] || labels.ko;
}
function getRestroomLabel(lang) {
    var labels = { ko: "화장실", en: "Restroom", ja: "トイレ", zh: "卫生间", es: "Baño", fr: "Toilettes" };
    return labels[normalizeLang(lang)] || labels.ko;
}

function getLibraryDisplayName(item) { return (item && item._nameByLang && item._nameByLang[currentLang]) || (item && item.LBRRY_NAME) || ""; }
function getLibraryDisplayAddr(item) { return (item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.ADRES) || ""; }

function clearLibraryMarkers() { var before = captureGpsIntegrity(); logGpsLayerChange("BEFORE library-clear", before); libraryMarkerLayer.clearLayers(); libraryMarkers = []; refreshGpsVisualsAfterPlaceLayerChange("library-clear", before); }

function refreshLibraryMarkerLabels(lang) {
    var label = getLibraryLabel(lang);
    document.querySelectorAll(".library-map-label").forEach(function(el) { el.textContent = label; });
}

function renderLibraryMarkers(lang) {
    var before = captureGpsIntegrity();
    logGpsLayerChange("BEFORE library-refresh", before);
    libraryMarkerLayer.clearLayers();
    libraryMarkers = [];
    var label = getLibraryLabel(lang);
    var center = getMapSearchCenter();
    libraryItems.map(function(item) {
        var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
        return { item:item, lat:lat, lng:lng, distance:isFinite(lat) && isFinite(lng) ? center.distanceTo([lat, lng]) : Infinity };
    }).filter(function(entry) {
        return isFinite(entry.lat) && isFinite(entry.lng) && isWithinMapSearchCenter(entry.lat, entry.lng, getMapSearchRadius());
    }).sort(function(a, b) { return a.distance - b.distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(entry) {
        var item = entry.item;
        var lat = entry.lat; var lng = entry.lng;
        var likeKey = getMapPlaceLikeKey("library", [item.LBRRY_SEQ_NO || item.LBRRY_NAME, lat, lng]);
        var icon = L.divIcon({
            className: "library-map-marker-wrap",
            html: "<div class='library-map-marker" + (likedTourKeys.has(likeKey) ? " state-liked" : "") + "' data-place-like-key='" + escapeHtml(likeKey) + "'><span class='library-map-dot'></span><span class='library-map-label'>" + escapeHtml(label) + "</span><span class='place-liked-star'>★</span></div>",
            iconSize: [92, 28], iconAnchor: [10, 14]
        });
        var marker = L.marker([lat, lng], { pane: "libraryPane", icon: icon, title: label + " - " + getLibraryDisplayName(item) }).addTo(libraryMarkerLayer);
        marker.on("click", function() { showLibraryPopup(item); });
        libraryMarkers.push(marker);
    });
    refreshGpsVisualsAfterPlaceLayerChange("library-refresh", before);
}

function showLibraryPopup(item) {
    var lat = parseFloat(item.XCNTS); var lng = parseFloat(item.YDNTS);
    var name = getLibraryDisplayName(item);
    var addr = getLibraryDisplayAddr(item);
    var label = getLibraryLabel();
    setSelectedDestination(lat, lng, name || label);
    var tel = item.TEL_NO ? "<br><a href='tel:" + item.TEL_NO + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(getTourUiText().phone) + " " + escapeHtml(item.TEL_NO) + "</a>" : "";
    var time = item.OP_TIME ? "<br><small>" + escapeHtml(item.OP_TIME) + "</small>" : "";
    var tag = "<span class='tour-popup-tag' style='color:#60a5fa;border-color:rgba(37,99,235,0.75);background:rgba(37,99,235,0.22);'>" + escapeHtml(label) + "</span>";
    var likeKey = getMapPlaceLikeKey("library", [item.LBRRY_SEQ_NO || item.LBRRY_NAME, lat, lng]);
    var popup = L.popup({ className: "tour-popup" }).setLatLng([lat, lng]).setContent("<b>" + escapeHtml(name) + "</b><br>" + tag + "<br><small>" + escapeHtml(addr) + "</small>" + time + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showLibraryPopup(item); });
}

function translateLibraryItemsForLang(lang) {
    renderLibraryMarkers(lang);
    refreshLibraryMarkerLabels(lang);
    return Promise.resolve();
}

function fetchLibraryJson() {
    var cached = null;
    try {
        cached = JSON.parse(localStorage.getItem(SEOUL_LIBRARY_CACHE_KEY) || "null");
        if (!cached || !cached.data || Date.now() - Number(cached.savedAt || 0) > SEOUL_LIBRARY_CACHE_MS) cached = null;
    } catch (_) { cached = null; }
    var mixedContentBlocked = location.protocol === "https:" && !window.GiloaPhotoBridge;
    if (!SEOUL_LIBRARY_API_KEY || navigator.onLine === false || mixedContentBlocked) {
        return cached ? Promise.resolve(cached.data) : Promise.reject(new Error("Library data unavailable offline"));
    }
    return requestJsonWithRetry(SEOUL_LIBRARY_API_URL, { timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS, retries: 1 }).then(function(data) {
        var body = data && data.SeoulPublicLibraryInfo;
        if (!body || !Array.isArray(body.row)) throw new Error("Invalid library response");
        try { localStorage.setItem(SEOUL_LIBRARY_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data })); } catch (_) {}
        return data;
    }).catch(function(error) {
        if (cached) return cached.data;
        throw error;
    });
}

function fetchLibraries() {
    fetchLibraryJson().then(function(data) {
        var body = data && data.SeoulPublicLibraryInfo;
        var freshItems = body && Array.isArray(body.row) ? body.row : [];
        if (freshItems.length) libraryItems = freshItems;
        librariesLoaded = true;
        if (mapLayerSettings.library) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
    }).catch(function(err) { console.warn("?쒖슱 ?꾩꽌愿 API ?ㅻ쪟", err); });
}

// Nationwide parking data is split into 0.25-degree tiles. Only tiles that
// intersect the current viewport are fetched, with a hard request/marker cap.
var PARKING_DATA_INDEX_URL = "./data/parking/index.json";
var PARKING_TILE_REQUEST_LIMIT = 16;
var PARKING_COLOR = "#a78bfa";
var parkingManifestPromise = null;
var parkingManifest = null;
var parkingTileCache = {};
var parkingMarkers = [];
var parkingLayerGroup = L.layerGroup().addTo(map);
var parkingRequestSeq = 0;
var parkingBundlePromise = null;
function loadParkingBundle() {
    if (window.GILOA_PARKING_BUNDLE) return Promise.resolve(window.GILOA_PARKING_BUNDLE);
    if (parkingBundlePromise) return parkingBundlePromise;
    parkingBundlePromise = new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        var timer = setTimeout(function() { finish(new Error("Parking bundle timeout")); }, 15000);
        var finished = false;
        function finish(error) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            script.onload = script.onerror = null;
            script.remove();
            if (error) reject(error);
            else resolve(window.GILOA_PARKING_BUNDLE);
        }
        script.src = "./data/parking/bundle.js?v=1";
        script.onload = function() {
            var data = window.GILOA_PARKING_BUNDLE;
            finish(data && data.manifest && data.tiles ? null : new Error("Invalid parking bundle"));
        };
        script.onerror = function() { finish(new Error("Parking bundle load failed")); };
        document.head.appendChild(script);
    }).finally(function() { parkingBundlePromise = null; });
    return parkingBundlePromise;
}
function readParkingData(id) {
    function fromBundle() {
        return loadParkingBundle().then(function(bundle) {
            var data = id ? bundle.tiles[id] : bundle.manifest;
            if (!data) throw new Error("Parking bundle tile missing: " + id);
            return data;
        });
    }
    if (location.protocol === "file:" || window.GILOA_PARKING_BUNDLE) return fromBundle();
    var url = id ? "./data/parking/" + id + ".json" : PARKING_DATA_INDEX_URL;
    return fetch(url, { cache:"no-cache" }).then(function(response) {
        if (!response.ok) throw new Error("Parking data HTTP " + response.status);
        return response.json();
    }).then(function(data) {
        if (id ? !Array.isArray(data) : !Array.isArray(data && data.tiles)) throw new Error("Invalid parking data");
        return data;
    }).catch(function() { return fromBundle(); });
}
function getParkingText() {
    var all = {
        ko:{ label:"주차장", spaces:"주차면", fee:"요금", hours:"평일 운영", free:"무료", paid:"유료", minute:"분", won:"원" },
        en:{ label:"Parking", spaces:"Spaces", fee:"Fee", hours:"Weekday hours", free:"Free", paid:"Paid", minute:"min", won:"KRW" },
        ja:{ label:"駐車場", spaces:"駐車台数", fee:"料金", hours:"平日営業時間", free:"無料", paid:"有料", minute:"分", won:"ウォン" },
        zh:{ label:"停车场", spaces:"车位", fee:"费用", hours:"工作日营业", free:"免费", paid:"收费", minute:"分钟", won:"韩元" },
        es:{ label:"Aparcamiento", spaces:"Plazas", fee:"Tarifa", hours:"Horario laborable", free:"Gratis", paid:"De pago", minute:"min", won:"KRW" },
        fr:{ label:"Parking", spaces:"Places", fee:"Tarif", hours:"Horaires en semaine", free:"Gratuit", paid:"Payant", minute:"min", won:"KRW" }
    };
    return all[normalizeLang(currentLang)] || all.ko;
}
function clearParkingMarkers() {
    parkingMarkers = [];
    parkingLayerGroup.clearLayers();
}
function loadParkingManifest() {
    if (parkingManifest) return Promise.resolve(parkingManifest);
    if (parkingManifestPromise) return parkingManifestPromise;
    parkingManifestPromise = readParkingData().then(function(data) {
        var tiles = Array.isArray(data && data.tiles) ? data.tiles : [];
        parkingManifest = { scale:Number(data && data.scale) || 4, ids:new Set(tiles.map(function(tile) { return String(tile.id); })) };
        return parkingManifest;
    }).finally(function() { parkingManifestPromise = null; });
    return parkingManifestPromise;
}
function getParkingViewportTileIds(manifest) {
    if (!map || !map.getBounds || !manifest) return [];
    var bounds = map.getBounds().pad(0.12); var scale = manifest.scale; var center = map.getCenter(); var ids = [];
    var minLat = Math.floor(bounds.getSouth() * scale), maxLat = Math.floor(bounds.getNorth() * scale);
    var minLng = Math.floor(bounds.getWest() * scale), maxLng = Math.floor(bounds.getEast() * scale);
    for (var latKey = minLat; latKey <= maxLat; latKey += 1) {
        for (var lngKey = minLng; lngKey <= maxLng; lngKey += 1) {
            var id = latKey + "_" + lngKey;
            if (manifest.ids.has(id)) ids.push({ id:id, distance:center.distanceTo([(latKey + 0.5) / scale, (lngKey + 0.5) / scale]) });
        }
    }
    return ids.sort(function(a, b) { return a.distance - b.distance; }).slice(0, PARKING_TILE_REQUEST_LIMIT).map(function(tile) { return tile.id; });
}
function loadParkingTile(id) {
    if (parkingTileCache[id]) return Promise.resolve(parkingTileCache[id]);
    return readParkingData(id).then(function(items) { parkingTileCache[id] = Array.isArray(items) ? items : []; return parkingTileCache[id]; });
}
function showParkingPopup(item) {
    var text = getParkingText(); var address = item.a || ""; var details = [];
    if (item.s) details.push(text.spaces + " " + item.s);
    if (item.f) details.push(text.fee + " " + (item.f === "무료" ? text.free : item.f === "유료" ? text.paid : item.f));
    if (item.m && isFinite(item.p)) details.push(item.m + text.minute + " " + item.p.toLocaleString() + text.won);
    if (item.o || item.c) details.push(text.hours + " " + [item.o, item.c].filter(Boolean).join("–"));
    var tel = item.t ? "<br><a href='tel:" + escapeHtml(item.t) + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(item.t) + "</a>" : "";
    setSelectedDestination(item.y, item.x, item.n || text.label);
    var likeKey = getMapPlaceLikeKey("parking", [item.i || item.n, item.y, item.x]);
    var popup = L.popup({ className:"tour-popup" }).setLatLng([item.y, item.x]).setContent("<b>" + escapeHtml(item.n || text.label) + "</b><br><span class='tour-popup-tag' style='color:" + PARKING_COLOR + ";border-color:" + PARKING_COLOR + ";background:rgba(167,139,250,.18);'>" + escapeHtml(text.label) + "</span>" + (address ? "<br><small>" + escapeHtml(address) + "</small>" : "") + (details.length ? "<br><small>" + escapeHtml(details.join(" · ")) + "</small>" : "") + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showParkingPopup(item); });
}
function renderParkingMarkers(tileIds) {
    clearParkingMarkers();
    if (!mapLayerSettings.parking) return;
    var text = getParkingText(); var center = getMapSearchCenter(); var seen = new Set(); var items = [];
    (tileIds || []).forEach(function(id) { (parkingTileCache[id] || []).forEach(function(item) {
        var key = item.i || (item.y + "|" + item.x + "|" + item.n);
        if (seen.has(key) || !isWithinMapSearchCenter(Number(item.y), Number(item.x), getMapSearchRadius())) return;
        seen.add(key); item._distance = center.distanceTo([item.y, item.x]); items.push(item);
    }); });
    items.sort(function(a, b) { return a._distance - b._distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(item) {
        var likeKey = getMapPlaceLikeKey("parking", [item.i || item.n, item.y, item.x]);
        var icon = L.divIcon({ className:"library-map-marker-wrap parking-map-marker-wrap", html:"<div class='library-map-marker" + (likedTourKeys.has(likeKey) ? " state-liked" : "") + "' data-place-like-key='" + escapeHtml(likeKey) + "' style='--tour-color:" + PARKING_COLOR + ";'><span class='library-map-dot' style='background:" + PARKING_COLOR + ";'></span><span class='library-map-label'>" + escapeHtml(text.label) + "</span><span class='place-liked-star'>★</span></div>", iconSize:[76,28], iconAnchor:[10,14] });
        var marker = L.marker([item.y, item.x], { pane:"parkingPane", icon:icon, title:text.label + " - " + (item.n || "") }).addTo(parkingLayerGroup);
        marker.on("click", function() { showParkingPopup(item); }); parkingMarkers.push(marker);
    });
}
function fetchParkingFromKakao() {
    if (!mapLayerSettings.parking || navigator.onLine === false) return Promise.resolve([]);
    var center = getMapSearchCenter();
    var radius = Math.min(20000, getMapSearchRadius());
    return loadKakaoTrafficSdk().then(function() {
        if (!window.kakao.maps.services || !window.kakao.maps.services.Places) return [];
        return new Promise(function(resolve) {
            var results = [];
            var settled = false;
            var timer = setTimeout(function() { finish(); }, 7000);
            function finish() {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(results);
            }
            try {
                var places = new window.kakao.maps.services.Places();
                places.categorySearch("PK6", function(items, status, pagination) {
                    if (settled || !mapLayerSettings.parking) { finish(); return; }
                    if (status !== window.kakao.maps.services.Status.OK) { finish(); return; }
                    (items || []).forEach(function(place) {
                        results.push({
                            i:"kakao|" + place.id, n:place.place_name || "", a:place.road_address_name || place.address_name || "",
                            y:Number(place.y), x:Number(place.x), s:"", f:"", m:"", p:0, o:"", c:"", t:place.phone || ""
                        });
                    });
                    if (pagination && pagination.hasNextPage && results.length < 45) pagination.nextPage();
                    else finish();
                }, {
                    location:new window.kakao.maps.LatLng(center.lat, center.lng),
                    radius:radius,
                    size:15,
                    sort:window.kakao.maps.services.SortBy.DISTANCE
                });
            } catch (_) { finish(); }
        });
    }).catch(function(error) { console.warn("Kakao parking fallback failed", error && error.message); return []; });
}
function refreshParkingForMap() {
    if (!mapLayerSettings.parking) return Promise.resolve(false);
    var requestSeq = ++parkingRequestSeq;
    return loadParkingManifest().then(function(manifest) {
        var tileIds = getParkingViewportTileIds(manifest);
        return Promise.all(tileIds.map(function(id) { return loadParkingTile(id).catch(function(error) { console.warn("Parking tile load failed", id, error && error.message); return []; }); })).then(function() {
            if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
            renderParkingMarkers(tileIds);
            if (parkingMarkers.length > 0) return true;
            return fetchParkingFromKakao().then(function(items) {
                if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
                parkingTileCache.__kakao__ = items;
                renderParkingMarkers(["__kakao__"]);
                return items.length > 0;
            });
        });
    }).catch(function(error) {
        console.warn("Parking local data load failed; using Kakao fallback", error && error.message);
        return fetchParkingFromKakao().then(function(items) {
            if (requestSeq !== parkingRequestSeq || !mapLayerSettings.parking) return false;
            parkingTileCache.__kakao__ = items;
            renderParkingMarkers(["__kakao__"]);
            return items.length > 0;
        });
    });
}

// Ministry of the Interior and Safety nationwide fishing-spot layer.
// API records are cached in memory; only the current viewport is rendered.
var FISHING_API_ENDPOINT = "https://apis.data.go.kr/1741000/fishing_spot_info";
var FISHING_API_KEY = window.GILOA_FISHING_API_KEY || "";
var FISHING_COLOR = "#38bdf8";
var FISHING_PAGE_SIZE = 100;
var FISHING_MAX_PAGES = 12;
var fishingItems = null;
var fishingLoadPromise = null;
var fishingMarkers = [];
var fishingLayerGroup = L.layerGroup().addTo(map);
var fishingRequestSeq = 0;
var fishingMissingKeyWarned = false;
function getFishingText() {
    var all = {
        ko:{ label:"낚시터", address:"주소", type:"유형", species:"주요어종", capacity:"최대수용인원", fee:"이용요금", area:"수면적", phone:"전화번호", people:"명" },
        en:{ label:"Fishing spot", address:"Address", type:"Type", species:"Main species", capacity:"Maximum capacity", fee:"Fee", area:"Surface area", phone:"Phone", people:" people" },
        ja:{ label:"釣り場", address:"住所", type:"種類", species:"主な魚種", capacity:"最大収容人数", fee:"利用料金", area:"水面積", phone:"電話番号", people:"名" },
        zh:{ label:"钓鱼场", address:"地址", type:"类型", species:"主要鱼种", capacity:"最大容纳人数", fee:"使用费", area:"水面面积", phone:"电话", people:"人" },
        es:{ label:"Zona de pesca", address:"Dirección", type:"Tipo", species:"Especies principales", capacity:"Aforo máximo", fee:"Tarifa", area:"Superficie acuática", phone:"Teléfono", people:" personas" },
        fr:{ label:"Site de pêche", address:"Adresse", type:"Type", species:"Espèces principales", capacity:"Capacité maximale", fee:"Tarif", area:"Surface d'eau", phone:"Téléphone", people:" personnes" }
    };
    return all[normalizeLang(currentLang)] || all.ko;
}
function normalizeFishingFieldName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}
function firstFishingField(record, aliases) {
    if (!record || typeof record !== "object") return "";
    for (var i = 0; i < aliases.length; i += 1) {
        if (record[aliases[i]] !== undefined && record[aliases[i]] !== null && record[aliases[i]] !== "") return record[aliases[i]];
    }
    var wanted = aliases.map(normalizeFishingFieldName);
    var keys = Object.keys(record);
    for (var k = 0; k < keys.length; k += 1) {
        if (wanted.indexOf(normalizeFishingFieldName(keys[k])) >= 0 && record[keys[k]] !== "") return record[keys[k]];
    }
    return "";
}
function extractFishingRows(data) {
    var candidates = [
        data && data.response && data.response.body && data.response.body.items && data.response.body.items.item,
        data && data.response && data.response.body && data.response.body.items,
        data && data.body && data.body.items && data.body.items.item,
        data && data.body && data.body.items,
        data && data.fishing_spot_info && data.fishing_spot_info.row,
        data && data.fishingSpotInfo && data.fishingSpotInfo.row,
        data && data.items && data.items.item,
        data && data.items,
        data && data.row
    ];
    for (var i = 0; i < candidates.length; i += 1) {
        if (Array.isArray(candidates[i])) return candidates[i];
        if (candidates[i] && typeof candidates[i] === "object") return [candidates[i]];
    }
    var servicePayload = data && (data.fishing_spot_info || data.fishingSpotInfo);
    if (Array.isArray(servicePayload)) {
        for (var p = 0; p < servicePayload.length; p += 1) {
            if (servicePayload[p] && Array.isArray(servicePayload[p].row)) return servicePayload[p].row;
        }
    }
    return [];
}
function extractFishingTotal(data, fallback) {
    var body = data && data.response && data.response.body ? data.response.body : (data && data.body ? data.body : data);
    var total = Number(body && (body.totalCount || body.total || body.totalCnt));
    if (isFinite(total) && total > 0) return total;
    var servicePayload = data && (data.fishing_spot_info || data.fishingSpotInfo);
    if (Array.isArray(servicePayload) && servicePayload[0] && Array.isArray(servicePayload[0].head)) {
        for (var h = 0; h < servicePayload[0].head.length; h += 1) {
            total = Number(servicePayload[0].head[h] && (servicePayload[0].head[h].list_total_count || servicePayload[0].head[h].totalCount));
            if (isFinite(total) && total > 0) return total;
        }
    }
    return fallback;
}
function normalizeFishingItem(record) {
    var lat = Number(firstFishingField(record, ["위도", "latitude", "lat", "LAT", "REFINE_WGS84_LAT", "WGS84_LAT"]));
    var lng = Number(firstFishingField(record, ["경도", "longitude", "lng", "lon", "LON", "LOT", "REFINE_WGS84_LOGT", "WGS84_LON", "WGS84_LOT"]));
    if (!isFinite(lat) || !isFinite(lng) || lat < 30 || lat > 40 || lng < 120 || lng > 132) return null;
    var roadAddress = firstFishingField(record, ["소재지도로명주소", "도로명주소", "roadNameAddress", "roadAddress", "RDNMADR", "ROAD_NM_ADDR", "LCTN_ROAD_NM_ADDR"]);
    var lotAddress = firstFishingField(record, ["소재지지번주소", "지번주소", "lotNumberAddress", "address", "LNMADR", "LOTNO_ADDR", "LCTN_LOTNO_ADDR"]);
    return {
        name:String(firstFishingField(record, ["낚시터명", "fishingSpotName", "FISHING_SPOT_NAME", "FSHLC_NM", "FSHNGSPT_NM", "fcltyNm", "name"]) || ""),
        address:String(roadAddress || lotAddress || ""),
        type:String(firstFishingField(record, ["낚시터유형", "fishingSpotType", "FISHING_SPOT_TYPE", "FSHLC_TYPE", "FSHNGSPT_TYPE", "type"]) || ""),
        species:String(firstFishingField(record, ["주요어종", "mainFishSpecies", "MAIN_FISH_SPECIES", "MAJOR_FISH", "MAIN_FSHSPC", "fishSpecies"]) || ""),
        capacity:String(firstFishingField(record, ["최대수용인원", "maximumCapacity", "MAXIMUM_CAPACITY", "MAX_CAPACITY", "MAX_ACTC_PERNE"]) || ""),
        fee:String(firstFishingField(record, ["이용요금", "usageFee", "USE_FEE", "FEE", "UTZTN_CRG"]) || ""),
        area:String(firstFishingField(record, ["수면적", "waterArea", "WATER_AREA", "SURFACE_AREA", "WTRAREA"]) || ""),
        phone:String(firstFishingField(record, ["낚시터전화번호", "fishingSpotPhoneNumber", "PHONE_NUMBER", "FSHLC_TELNO", "FSHNGSPT_TELNO", "phone", "관리기관전화번호", "MNG_INST_TELNO"]) || ""),
        lat:lat, lng:lng
    };
}
function buildFishingRequestUrl(pageNo) {
    var key = String(FISHING_API_KEY || "").trim();
    var encodedKey = /%[0-9a-f]{2}/i.test(key) ? key : encodeURIComponent(key);
    return FISHING_API_ENDPOINT + "/info?serviceKey=" + encodedKey + "&pageNo=" + pageNo + "&numOfRows=" + FISHING_PAGE_SIZE + "&returnType=json";
}
function fetchFishingPage(pageNo) {
    return fetch(buildFishingRequestUrl(pageNo), { cache:"no-store" }).then(function(response) {
        if (!response.ok) throw new Error("Fishing API HTTP " + response.status);
        return response.json();
    });
}
function loadFishingData() {
    if (Array.isArray(fishingItems)) return Promise.resolve(fishingItems);
    if (!FISHING_API_KEY) {
        if (!fishingMissingKeyWarned) console.warn("Fishing layer disabled: window.GILOA_FISHING_API_KEY is not configured.");
        fishingMissingKeyWarned = true;
        return Promise.resolve([]);
    }
    if (fishingLoadPromise) return fishingLoadPromise;
    fishingLoadPromise = fetchFishingPage(1).then(function(firstPage) {
        var rows = extractFishingRows(firstPage);
        var total = extractFishingTotal(firstPage, rows.length < FISHING_PAGE_SIZE ? rows.length : FISHING_PAGE_SIZE * FISHING_MAX_PAGES);
        var pageCount = Math.min(FISHING_MAX_PAGES, Math.max(1, Math.ceil(total / FISHING_PAGE_SIZE)));
        var requests = [];
        for (var page = 2; page <= pageCount; page += 1) requests.push(fetchFishingPage(page).then(extractFishingRows));
        return Promise.all(requests).then(function(extraPages) {
            extraPages.forEach(function(pageRows) { rows = rows.concat(pageRows); });
            var seen = new Set();
            fishingItems = rows.map(normalizeFishingItem).filter(function(item) {
                if (!item) return false;
                var id = item.lat.toFixed(6) + "|" + item.lng.toFixed(6) + "|" + item.name;
                if (seen.has(id)) return false;
                seen.add(id); return true;
            });
            return fishingItems;
        });
    }).finally(function() { fishingLoadPromise = null; });
    return fishingLoadPromise;
}
function clearFishingMarkers() {
    fishingMarkers = [];
    fishingLayerGroup.clearLayers();
}
function showFishingPopup(item) {
    var text = getFishingText(); var details = [];
    if (item.address) details.push([text.address, item.address]);
    if (item.type) details.push([text.type, item.type]);
    if (item.species) details.push([text.species, item.species]);
    if (item.capacity) details.push([text.capacity, item.capacity + text.people]);
    if (item.fee) details.push([text.fee, item.fee]);
    if (item.area) details.push([text.area, item.area]);
    var detailHtml = details.map(function(detail) { return "<br><small><b>" + escapeHtml(detail[0]) + ":</b> " + escapeHtml(detail[1]) + "</small>"; }).join("");
    var tel = item.phone ? "<br><small><b>" + escapeHtml(text.phone) + ":</b> <a href='tel:" + escapeHtml(item.phone) + "' style='color:" + FISHING_COLOR + ";'>" + escapeHtml(item.phone) + "</a></small>" : "";
    setSelectedDestination(item.lat, item.lng, item.name || text.label);
    var likeKey = getMapPlaceLikeKey("fishing", [item.name, item.lat, item.lng]);
    var popup = L.popup({ className:"tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || text.label) + "</b><br><span class='tour-popup-tag' style='color:" + FISHING_COLOR + ";border-color:" + FISHING_COLOR + ";background:rgba(56,189,248,.18);'>🎣 " + escapeHtml(text.label) + "</span>" + detailHtml + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showFishingPopup(item); });
}
function renderFishingMarkers() {
    clearFishingMarkers();
    if (!mapLayerSettings.fishing || !Array.isArray(fishingItems)) return;
    var text = getFishingText(); var center = getMapSearchCenter(); var bounds = map.getBounds().pad(0.12);
    fishingItems.filter(function(item) {
        return bounds.contains([item.lat, item.lng]) && isWithinMapSearchCenter(item.lat, item.lng, getMapSearchRadius());
    }).map(function(item) {
        item._distance = center.distanceTo([item.lat, item.lng]); return item;
    }).sort(function(a, b) { return a._distance - b._distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(item) {
        var hookSvg = "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='8' cy='4.5' r='2.5'></circle><path d='M8 7v8.1a5.4 5.4 0 0 0 10.8 0v-4.4l-3.8 4.1'></path></svg>";
        var likeKey = getMapPlaceLikeKey("fishing", [item.name, item.lat, item.lng]);
        var icon = L.divIcon({ className:"library-map-marker-wrap fishing-map-marker-wrap", html:"<div class='library-map-marker fishing-map-marker" + (likedTourKeys.has(likeKey) ? " state-liked" : "") + "' data-place-like-key='" + escapeHtml(likeKey) + "'><span class='fishing-map-icon'>" + hookSvg + "</span><span class='library-map-label fishing-map-label'>" + escapeHtml(text.label) + "</span><span class='place-liked-star'>★</span></div>", iconSize:[76,28], iconAnchor:[10,14] });
        var marker = L.marker([item.lat, item.lng], { pane:"fishingPane", icon:icon, title:text.label + " - " + (item.name || "") }).addTo(fishingLayerGroup);
        marker.on("click", function() { showFishingPopup(item); }); fishingMarkers.push(marker);
    });
}
function refreshFishingForMap() {
    if (!mapLayerSettings.fishing) return Promise.resolve(false);
    var requestSeq = ++fishingRequestSeq;
    return loadFishingData().then(function() {
        if (requestSeq !== fishingRequestSeq || !mapLayerSettings.fishing) return false;
        renderFishingMarkers(); return true;
    }).catch(function(error) { console.warn("Fishing data load failed", error && error.message); return false; });
}

// ---- 고캠핑(한국관광공사) ----
var CAMPING_API_ENDPOINT = "https://apis.data.go.kr/B551011/GoCamping";
var CAMPING_API_KEY = window.GILOA_CAMPING_API_KEY || TOUR_API_KEY || "";
var CAMPING_COLOR = "#22c55e";
var campingItems = null;
var campingMarkers = [];
var campingLayerGroup = L.layerGroup().addTo(map);
var campingRequestSeq = 0;
var campingMissingKeyWarned = false;
function getCampingText() {
    var all = {
        ko: { label: "캠핑장", address: "주소", type: "야영장 유형", facilities: "부대시설", phone: "전화번호" },
        en: { label: "Campsite", address: "Address", type: "Type", facilities: "Facilities", phone: "Phone" },
        ja: { label: "キャンプ場", address: "住所", type: "種類", facilities: "付帯施設", phone: "電話番号" },
        zh: { label: "露营地", address: "地址", type: "类型", facilities: "配套设施", phone: "电话" },
        es: { label: "Camping", address: "Dirección", type: "Tipo", facilities: "Instalaciones", phone: "Teléfono" },
        fr: { label: "Camping", address: "Adresse", type: "Type", facilities: "Équipements", phone: "Téléphone" }
    };
    return all[normalizeLang(currentLang)] || all.ko;
}
function buildCampingRequestUrl(center, radiusM, pageNo) {
    var key = String(CAMPING_API_KEY || "").trim();
    var encodedKey = /%[0-9a-f]{2}/i.test(key) ? key : encodeURIComponent(key);
    return CAMPING_API_ENDPOINT + "/locationBasedList?serviceKey=" + encodedKey +
        "&numOfRows=500&pageNo=" + (pageNo || 1) + "&MobileOS=ETC&MobileApp=Giloa&_type=json" +
        "&mapX=" + center.lng.toFixed(6) + "&mapY=" + center.lat.toFixed(6) + "&radius=" + radiusM;
}
function normalizeCampingItem(record) {
    var lat = Number(record && record.mapY);
    var lng = Number(record && record.mapX);
    if (!record || !isFinite(lat) || !isFinite(lng)) return null;
    return {
        id: String((record.contentId != null ? record.contentId : "") || (record.facltNm || "") + "|" + lat + "|" + lng),
        name: String(record.facltNm || ""),
        address: String(record.addr1 || ""),
        type: String(record.induty || ""),
        facilities: String(record.sbrsCl || ""),
        phone: String(record.tel || ""),
        lat: lat, lng: lng
    };
}
function fetchCampingPage(center, radiusM, pageNo) {
    return fetch(buildCampingRequestUrl(center, radiusM, pageNo), { cache: "no-store" }).then(function(response) {
        if (!response.ok) throw new Error("GoCamping API HTTP " + response.status);
        return response.json();
    });
}
function extractCampingRows(data) {
    var body = data && data.response && data.response.body;
    var items = body && body.items && body.items.item;
    if (Array.isArray(items)) return items;
    if (items && typeof items === "object") return [items];
    return [];
}
function loadCampingData(center, radiusM) {
    if (!CAMPING_API_KEY) {
        if (!campingMissingKeyWarned) console.warn("Camping layer disabled: window.GILOA_CAMPING_API_KEY is not configured.");
        campingMissingKeyWarned = true;
        return Promise.resolve([]);
    }
    return fetchCampingPage(center, radiusM, 1).then(function(data) {
        var rows = extractCampingRows(data);
        var seen = new Set();
        campingItems = rows.map(normalizeCampingItem).filter(function(item) {
            if (!item) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id); return true;
        });
        return campingItems;
    }).catch(function(error) {
        console.warn("GoCamping data load failed", error && error.message);
        campingItems = campingItems || [];
        return campingItems;
    });
}
function clearCampingMarkers() { campingMarkers = []; campingLayerGroup.clearLayers(); }
function showCampingPopup(item) {
    var text = getCampingText(); var details = [];
    if (item.address) details.push([text.address, item.address]);
    if (item.type) details.push([text.type, item.type]);
    if (item.facilities) details.push([text.facilities, item.facilities]);
    var detailHtml = details.map(function(detail) { return "<br><small><b>" + escapeHtml(detail[0]) + ":</b> " + escapeHtml(detail[1]) + "</small>"; }).join("");
    var tel = item.phone ? "<br><small><b>" + escapeHtml(text.phone) + ":</b> <a href='tel:" + escapeHtml(item.phone) + "' style='color:" + CAMPING_COLOR + ";'>" + escapeHtml(item.phone) + "</a></small>" : "";
    setSelectedDestination(item.lat, item.lng, item.name || text.label);
    var likeKey = getMapPlaceLikeKey("camping", [item.name, item.lat, item.lng]);
    var popup = L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || text.label) + "</b><br><span class='tour-popup-tag' style='color:" + CAMPING_COLOR + ";border-color:" + CAMPING_COLOR + ";background:rgba(34,197,94,.18);'>🏕️ " + escapeHtml(text.label) + "</span>" + detailHtml + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showCampingPopup(item); });
}
function renderCampingMarkers() {
    clearCampingMarkers();
    if (!mapLayerSettings.camping || !Array.isArray(campingItems)) return;
    var text = getCampingText(); var center = getMapSearchCenter(); var bounds = map.getBounds().pad(0.12);
    campingItems.filter(function(item) {
        return bounds.contains([item.lat, item.lng]) && isWithinMapSearchCenter(item.lat, item.lng, getMapSearchRadius());
    }).map(function(item) {
        item._distance = center.distanceTo([item.lat, item.lng]); return item;
    }).sort(function(a, b) { return a._distance - b._distance; }).slice(0, MAP_VIEWPORT_MARKER_LIMIT).forEach(function(item) {
        var likeKey = getMapPlaceLikeKey("camping", [item.name, item.lat, item.lng]);
        var icon = L.divIcon({ className: "library-map-marker-wrap camping-map-marker-wrap", html: "<div class='library-map-marker camping-map-marker" + (likedTourKeys.has(likeKey) ? " state-liked" : "") + "' data-place-like-key='" + escapeHtml(likeKey) + "'><span class='camping-map-icon' aria-hidden='true'>🏕️</span><span class='library-map-label camping-map-label'>" + escapeHtml(item.name || text.label) + "</span><span class='place-liked-star'>★</span></div>", iconSize: [76, 28], iconAnchor: [10, 14] });
        var marker = L.marker([item.lat, item.lng], { pane: "campingPane", icon: icon, title: text.label + " - " + (item.name || "") }).addTo(campingLayerGroup);
        marker.on("click", function() { showCampingPopup(item); }); campingMarkers.push(marker);
    });
}
function refreshCampingForMap() {
    if (!mapLayerSettings.camping) return Promise.resolve(false);
    var requestSeq = ++campingRequestSeq;
    return loadCampingData(getMapSearchCenter(), getMapSearchRadius()).then(function() {
        if (requestSeq !== campingRequestSeq || !mapLayerSettings.camping) return false;
        renderCampingMarkers(); return true;
    }).catch(function(error) { console.warn("Camping data load failed", error && error.message); return false; });
}

// ---- 怨듭쨷?붿옣??(?댁옣 ?쒖슱 ?곗씠??+ 移댁뭅??吏?ㅼ퐫?? ----
function loadRestroomGeoCache() {
    try { restroomGeoCache = JSON.parse(localStorage.getItem(RESTROOM_GEOCODE_CACHE_KEY) || "{}"); }
    catch (e) { restroomGeoCache = {}; }
}
function saveRestroomGeoCache() {
    try { localStorage.setItem(RESTROOM_GEOCODE_CACHE_KEY, JSON.stringify(restroomGeoCache)); }
    catch (e) { /* ???怨듦컙 遺議??깆? 臾댁떆 - ?ㅼ쓬 ?몄뀡???ㅼ떆 吏?ㅼ퐫?⑸맖 */ }
}
function extractGuFromAddress(addr) {
    if (!addr) return "";
    var clean = addr.replace(/^서울특별시\s*/, "").replace(/^서울\s*/, "");
    var tokens = clean.split(/\s+/);
    for (var i = 0; i < tokens.length; i++) {
        if (/^[가-힣]{2,5}구$/.test(tokens[i])) return tokens[i];
    }
    return "";
}
function cleanRestroomText(value) {
    var text = String(value || "").replace(/\|/g, " · ").replace(/\s*·\s*$/g, "").trim();
    return typeof isBrokenDisplayText === "function" && isBrokenDisplayText(text) ? "" : text;
}
function isValidRestroomCoordinate(lat, lng) {
    return isFinite(lat) && isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}
function normalizeRestroomItem(row, source) {
    row = row || {};
    var lat = parseFloat(row.lat !== undefined ? row.lat : (row.COORD_Y !== undefined ? row.COORD_Y : row.y));
    var lng = parseFloat(row.lng !== undefined ? row.lng : (row.COORD_X !== undefined ? row.COORD_X : row.x));
    if (!isValidRestroomCoordinate(lat, lng)) return null;
    var id = row.id || row.OBJECTID || row._giloaKey || "";
    var name = cleanRestroomText(row.name || row.CONTS_NAME || row.place_name || getRestroomLabel());
    var addr = cleanRestroomText(row.addr || row.ADDR_NEW || row.ADDR_OLD || row.road_address_name || row.address_name || "");
    return {
        _giloaKey: String(source || row.source || "restroom") + "|" + String(id || (lat.toFixed(6) + "|" + lng.toFixed(6))),
        id: String(id || ""),
        name: name || getRestroomLabel(),
        addr: addr,
        tel: cleanRestroomText(row.tel || row.TEL_NO || row.phone || ""),
        hours: cleanRestroomText(row.hours || row.VALUE_02 || row.opening_hours || ""),
        openType: cleanRestroomText(row.openType || row.VALUE_01 || row.access || ""),
        lat: lat,
        lng: lng,
        source: source || row.source || "restroom"
    };
}
function dedupeRestroomItems(items) {
    var seen = {};
    return (items || []).map(function(item) { return normalizeRestroomItem(item, item && item.source); }).filter(function(item) {
        if (!item) return false;
        var key = item.lat.toFixed(5) + "|" + item.lng.toFixed(5) + "|" + item.name.toLowerCase();
        if (seen[key]) return false;
        seen[key] = true;
        return true;
    });
}
function getRestroomDistance(center, item) {
    return L.latLng(center.lat, center.lng).distanceTo(L.latLng(item.lat, item.lng));
}
function filterRestroomItemsForArea(items, center, radius) {
    var safeRadius = Math.max(300, Math.min(10000, Number(radius) || MAP_LAYER_RADIUS_M));
    return dedupeRestroomItems(items).map(function(item) {
        item._distance = getRestroomDistance(center, item);
        return item;
    }).filter(function(item) { return item._distance <= safeRadius; }).sort(function(a, b) { return a._distance - b._distance; }).slice(0, RESTROOM_MAX_MARKERS);
}
function isLikelySeoulArea(center) {
    return !!center && center.lat >= 37.40 && center.lat <= 37.72 && center.lng >= 126.73 && center.lng <= 127.23;
}
function getRestroomAreaCacheKey(center, radius) {
    return RESTROOM_AREA_CACHE_PREFIX + center.lat.toFixed(3) + ":" + center.lng.toFixed(3) + ":" + Math.round((Number(radius) || MAP_LAYER_RADIUS_M) / 300);
}
function readRestroomAreaCache(center, radius) {
    try {
        var saved = JSON.parse(localStorage.getItem(getRestroomAreaCacheKey(center, radius)) || "null");
        var age = saved ? Date.now() - Number(saved.savedAt || 0) : Infinity;
        if (!saved || age > RESTROOM_CACHE_STALE_MS || !Array.isArray(saved.items)) return null;
        return { items: filterRestroomItemsForArea(saved.items, center, radius), fresh: age <= RESTROOM_CACHE_FRESH_MS, savedAt: saved.savedAt };
    } catch (_) { return null; }
}
function trimRestroomAreaCaches() {
    try {
        var entries = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key || key.indexOf(RESTROOM_AREA_CACHE_PREFIX) !== 0) continue;
            var saved = JSON.parse(localStorage.getItem(key) || "null");
            entries.push({ key: key, savedAt: Number(saved && saved.savedAt) || 0 });
        }
        entries.sort(function(a, b) { return b.savedAt - a.savedAt; });
        entries.slice(RESTROOM_MAX_AREA_CACHES).forEach(function(entry) { localStorage.removeItem(entry.key); });
    } catch (_) {}
}
function writeRestroomAreaCache(center, radius, items) {
    if (!items || !items.length) return;
    try {
        localStorage.setItem(getRestroomAreaCacheKey(center, radius), JSON.stringify({ savedAt: Date.now(), items: items.slice(0, RESTROOM_MAX_MARKERS) }));
        trimRestroomAreaCaches();
    } catch (_) { /* A full cache must never stop the map. */ }
}
function readSeoulRestroomCache() {
    try {
        var saved = JSON.parse(localStorage.getItem(RESTROOM_SEOUL_CACHE_KEY) || "null");
        if (!saved || !Array.isArray(saved.items) || Date.now() - Number(saved.savedAt || 0) > RESTROOM_CACHE_STALE_MS) return null;
        return { items: dedupeRestroomItems(saved.items), savedAt: Number(saved.savedAt) || 0 };
    } catch (_) { return null; }
}
function writeSeoulRestroomCache(items) {
    if (!items || items.length < 1000) return;
    try { localStorage.setItem(RESTROOM_SEOUL_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items: items })); }
    catch (_) { /* The bundled snapshot remains available when storage is full. */ }
}
function canUseSeoulRestroomApi() {
    if (!SEOUL_RESTROOM_API_KEY || navigator.onLine === false) return false;
    // Seoul Open Data currently exposes this dataset over HTTP. Browsers on an
    // HTTPS page must use the bundled snapshot/OSM instead of mixed content.
    var nativeAsset = location.protocol === "file:" || !!window.GiloaPhotoBridge;
    return location.protocol !== "https:" || nativeAsset;
}
function getSeoulRestroomPage(start, end, signal) {
    var url = SEOUL_RESTROOM_API_BASE + "/" + encodeURIComponent(SEOUL_RESTROOM_API_KEY) + "/json/" + SEOUL_RESTROOM_API_SERVICE + "/" + start + "/" + end + "/";
    return requestJsonWithRetry(url, {
        timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS,
        retries: 1,
        retryDelayMs: 500,
        signal: signal
    }).then(function(data) {
        var body = data && data[SEOUL_RESTROOM_API_SERVICE];
        var result = body && body.RESULT;
        if (!body || !Array.isArray(body.row)) {
            var error = new Error("Invalid Seoul restroom response");
            error.status = result && result.CODE === "INFO-200" ? 404 : 502;
            throw error;
        }
        return {
            total: Math.max(0, Number(body.list_total_count) || body.row.length),
            rows: body.row
        };
    });
}
function fetchSeoulRestroomData(options) {
    options = options || {};
    var cached = readSeoulRestroomCache();
    if (cached && !options.force && Date.now() - cached.savedAt <= RESTROOM_SEOUL_REFRESH_MS) return Promise.resolve(cached.items);
    if (!canUseSeoulRestroomApi()) return Promise.resolve(cached ? cached.items : restroomRawItems);
    if (!options.force && Date.now() - restroomSeoulLastAttemptAt < 5 * 60 * 1000) return Promise.resolve(cached ? cached.items : restroomRawItems);
    if (restroomSeoulRefreshPromise) return restroomSeoulRefreshPromise;

    restroomSeoulLastAttemptAt = Date.now();
    var signal = options.signal || null;
    var refreshPromise = getSeoulRestroomPage(1, SEOUL_RESTROOM_PAGE_SIZE, signal).then(function(firstPage) {
        var rows = firstPage.rows.slice();
        var total = firstPage.total;
        function nextPage(start) {
            if (start > total) return Promise.resolve(rows);
            return getSeoulRestroomPage(start, Math.min(total, start + SEOUL_RESTROOM_PAGE_SIZE - 1), signal).then(function(page) {
                rows = rows.concat(page.rows);
                return nextPage(start + SEOUL_RESTROOM_PAGE_SIZE);
            });
        }
        return nextPage(SEOUL_RESTROOM_PAGE_SIZE + 1);
    }).then(function(rows) {
        var items = dedupeRestroomItems(rows.map(function(row) { return normalizeRestroomItem(row, "seoul"); }).filter(Boolean));
        // Never replace a complete bundled/last-good dataset with a partial page.
        if (items.length < 1000) throw new Error("Incomplete Seoul restroom response");
        restroomRawItems = items;
        restroomRawLoaded = true;
        writeSeoulRestroomCache(items);
        return items;
    }).catch(function() {
        var fallback = readSeoulRestroomCache();
        return fallback ? fallback.items : restroomRawItems;
    }).finally(function() {
        if (restroomSeoulRefreshPromise === refreshPromise) restroomSeoulRefreshPromise = null;
    });
    restroomSeoulRefreshPromise = refreshPromise;
    return refreshPromise;
}
function fetchRestroomRawData() {
    if (restroomRawLoaded) return Promise.resolve(restroomRawItems);
    return requestJsonOnce(RESTROOM_DATA_URL, { timeoutMs: 5000, cache: "default" }).then(function(data) {
        restroomRawItems = dedupeRestroomItems(Array.isArray(data) ? data : []);
        restroomRawLoaded = true;
        return restroomRawItems;
    }).catch(function() {
        var cached = readSeoulRestroomCache();
        restroomRawItems = cached ? cached.items : [];
        restroomRawLoaded = restroomRawItems.length > 0;
        return restroomRawItems;
    });
}
function clearRestroomMarkers() {
    restroomMarkers.forEach(function(marker) {
        if (restroomMarkerLayer.hasLayer(marker)) restroomMarkerLayer.removeLayer(marker);
        else if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    restroomMarkers = [];
    restroomMarkerLayer.clearLayers();
    var pane = map.getPane("restroomPane");
    if (pane) pane.querySelectorAll(".leaflet-marker-icon, .leaflet-marker-shadow").forEach(function(el) { el.remove(); });
}
function rememberRestroomItem(item) {
    var key = item._giloaKey || (String(item.addr || item.name || "") + "|" + item.lat + "|" + item.lng);
    var existing = restroomVisibleItems.findIndex(function(saved) {
        return saved._giloaKey === key;
    });
    item._giloaKey = key;
    if (existing >= 0) restroomVisibleItems[existing] = item;
    else restroomVisibleItems.push(item);
}
function createRestroomMarker(item) {
    if (!isValidRestroomCoordinate(Number(item.lat), Number(item.lng))) return;
    var label = getRestroomLabel();
    var likeKey = getMapPlaceLikeKey("restroom", [item._giloaKey || item.name || item.addr, item.lat, item.lng]);
    var icon = L.divIcon({
        className: "library-map-marker-wrap restroom-map-marker-wrap",
        html: "<div class='library-map-marker" + (likedTourKeys.has(likeKey) ? " state-liked" : "") + "' data-place-like-key='" + escapeHtml(likeKey) + "' style='--tour-color:" + RESTROOM_MARKER_COLOR + ";'><span class='library-map-dot' style='background:" + RESTROOM_MARKER_COLOR + ";'></span><span class='library-map-label'>" + escapeHtml(label) + "</span><span class='place-liked-star'>★</span></div>",
        iconSize: [76, 28], iconAnchor: [10, 14]
    });
    var marker = L.marker([item.lat, item.lng], { pane: "restroomPane", icon: icon, title: label + " - " + (item.name || "") }).addTo(restroomMarkerLayer);
    marker.on("click", function() { showRestroomPopup(item); });
    restroomMarkers.push(marker);
}
function addRestroomMarker(item) {
    if (!isFinite(item.lat) || !isFinite(item.lng)) return;
    rememberRestroomItem(item);
    createRestroomMarker(item);
}
function renderRestroomMarkers() {
    clearRestroomMarkers();
    if (!mapLayerSettings.restroom) return;
    var center = getMapSearchCenter();
    var visible = filterRestroomItemsForArea(restroomVisibleItems, center, getMapSearchRadius()).filter(function(item) {
        return isWithinMapSearchCenter(Number(item.lat), Number(item.lng), getMapSearchRadius());
    });
    visible.slice(0, RESTROOM_MAX_MARKERS).forEach(createRestroomMarker);
}
function showRestroomPopup(item) {
    var label = getRestroomLabel();
    setSelectedDestination(item.lat, item.lng, item.name || label);
    var tag = "<span class='tour-popup-tag' style='color:" + RESTROOM_MARKER_COLOR + ";border-color:" + RESTROOM_MARKER_COLOR + ";background:rgba(163,230,53,0.18);'>" + escapeHtml(label) + "</span>";
    var tel = item.tel ? "<br><a href='tel:" + item.tel + "' style='color:#4ade80;font-size:12px;'>" + escapeHtml(getTourUiText().phone) + " " + escapeHtml(item.tel) + "</a>" : "";
    var openTypes = {"고객 이용":getTourUiText().customers,"유료":getTourUiText().paid,"공중화장실":getTourUiText().publicRestroom};
    var extra = [openTypes[item.openType] || item.openType, item.hours].filter(Boolean).join(" - ");
    var likeKey = getMapPlaceLikeKey("restroom", [item._giloaKey || item.name || item.addr, item.lat, item.lng]);
    var popup = L.popup({ className: "tour-popup" }).setLatLng([item.lat, item.lng]).setContent("<b>" + escapeHtml(item.name || label) + "</b><br>" + tag + "<br><small>" + escapeHtml(item.addr || "") + "</small>" + (extra ? "<br><small>" + escapeHtml(extra) + "</small>" : "") + tel + buildMapPlaceLikeButton(likeKey)).openOn(map);
    trackPublicPlacePopup(popup, function() { showRestroomPopup(item); });
}
// 二쇱냼 ?섎굹瑜?移댁뭅??吏?ㅼ퐫?붾줈 醫뚰몴 蹂??(Promise ?섑븨)
function geocodeAddress(addr) {
    return loadKakaoTrafficSdk().then(function() {
        return new Promise(function(resolve) {
            if (!window.kakao.maps.services) { resolve(null); return; }
            var geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.addressSearch(addr, function(result, status) {
                if (status === window.kakao.maps.services.Status.OK && result && result[0]) {
                    resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
                } else {
                    resolve(null);
                }
            });
        });
    }).catch(function() { return null; });
}
function geocodeQueueSequential(items, onEach) {
    var i = 0;
    function step() {
        if (i >= items.length) { restroomGeocodeQueueBusy = false; saveRestroomGeoCache(); return; }
        var item = items[i++];
        geocodeAddress(item.addr).then(function(coord) {
            if (coord) {
                restroomGeoCache[item.addr] = coord;
                onEach(item, coord);
            }
            if (i % 20 === 0) saveRestroomGeoCache();
            setTimeout(step, 120);
        });
    }
    restroomGeocodeQueueBusy = true;
    step();
}
// 吏??以묒떖???꾩튂??"援?瑜??뚯븘?댁꽌, 洹?援ъ쓽 ?붿옣?ㅻ쭔 吏?ㅼ퐫??罹먯떆???녿뒗 寃껊쭔) + ?쒖떆
function fetchRestroomsFromLocalDataForCurrentArea(center, radius, requestSeq) {
    center = center || getMapSearchCenter();
    radius = radius || getMapSearchRadius();
    return fetchRestroomRawData().then(function(allItems) {
        var items = filterRestroomItemsForArea(allItems, center, radius);
        if (requestSeq && requestSeq !== restroomSearchSeq) return [];
        if (items.length && mapLayerSettings.restroom) {
            restroomVisibleItems = items;
            writeRestroomAreaCache(center, radius, items);
            renderRestroomMarkers();
        }
        return items;
    }).catch(function() { return []; });
}
function scheduleRestroomFetch() {
    if (!mapLayerSettings.restroom) return;
    if (restroomFetchTimer) clearTimeout(restroomFetchTimer);
    restroomFetchTimer = setTimeout(function() { restroomFetchTimer = null; fetchRestroomsForCurrentArea(); }, 700);
}
var restroomFetchTimer = null;
map.on("moveend", scheduleRestroomFetch);
loadRestroomGeoCache();

function getTourSearchDistance(centerA, centerB) {
    if (!centerA || !centerB) return Infinity;
    return L.latLng(centerA.lat, centerA.lng).distanceTo(L.latLng(centerB.lat, centerB.lng));
}
function shouldRefreshTourData(center, lang, radius) {
    var state = tourSearchStateByLang[lang];
    if (!state || !state.center || !state.lastFetchedAt) return true;
    // Never keep a transient empty response as a fresh result for 15 minutes.
    if (state.itemCount === 0) return true;
    if (getTourSearchDistance(center, state.center) >= TOUR_SEARCH_MOVE_M) return true;
    if (radius > (state.radius || MAP_LAYER_RADIUS_M) * 1.12) return true;
    return Date.now() - state.lastFetchedAt >= TOUR_REVALIDATE_MS;
}
function refreshTourData(options) {
    options = options || {};
    var lang = currentLang || "ko";
    hydrateTourItemsFromCache(lang, !!options.forceHydrate);
    // The Android app runs from file:///android_asset. Its WebView explicitly
    // allows HTTPS requests from file URLs, and TourAPI accepts the null origin.
    // Do not stop the core tourism refresh solely because the page is local.
    if (tourRefreshPromiseByLang[lang]) return tourRefreshPromiseByLang[lang];
    var center = getMapSearchCenter();
    var radius = getMapSearchRadius();
    if (!options.force && !shouldRefreshTourData(center, lang, radius)) {
        updateTourSummary();
        renderTourCards();
        return Promise.resolve(false);
    }
    var requestCenter = { lat: center.lat, lng: center.lng };
    setTourRefreshing(true);
    var spotsPromise = fetchTourSpots({ center: requestCenter, radius:radius, keepExisting: true }).then(function(hasFreshItems) {
        tourSearchStateByLang[lang] = { center: requestCenter, radius:radius, lastFetchedAt: Date.now(), itemCount: hasFreshItems ? tourItems.length : 0 };
        return !!hasFreshItems;
    }).catch(function() { return false; });
    var festivalsPromise = fetchFestivals({ center: requestCenter, radius:radius, keepExisting: true }).then(function() {
        return true;
    }).catch(function() { return false; });
    var refreshPromise = Promise.all([spotsPromise, festivalsPromise]).then(function(results) {
        return results[0];
    }).finally(function() {
        if (tourRefreshPromiseByLang[lang] === refreshPromise) delete tourRefreshPromiseByLang[lang];
        if (lang === currentLang) setTourRefreshing(false);
        var latestCenter = getMapSearchCenter();
        var latestRadius = getMapSearchRadius();
        if (lang === currentLang && (getTourSearchDistance(latestCenter, requestCenter) >= TOUR_SEARCH_MOVE_M || latestRadius > radius * 1.12)) {
            scheduleTourFetch({ immediate: true });
        }
    });
    tourRefreshPromiseByLang[lang] = refreshPromise;
    return refreshPromise;
}
function scheduleTourFetch(options) {
    options = options || {};
    if (tourFetchTimer) clearTimeout(tourFetchTimer);
    tourFetchTimer = setTimeout(function() {
        tourFetchTimer = null;
        hydrateTourItemsFromCache(currentLang || "ko");
        refreshTourData();
    }, options.immediate === true ? 0 : 350);
}
map.on("moveend", scheduleTourFetch);
map.on("moveend", refreshMapCenteredLayerMarkers);
function closeMapTransientPanels() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("open")) toggleSidebar(false);
    if (isHudExpanded) toggleHud();
    if (dailyTaskPanelOpen) toggleDailyTasks(false);
    if (tourPanelOpen) collapseTourPanel();
    var dialogue = document.getElementById("gilo-dialogue-layer");
    if (dialogue && dialogue.classList.contains("is-open")) hideGiloDialogue();
    var help = document.getElementById("help-popup");
    if (help && help.classList.contains("show")) help.classList.remove("show");
    var photoMenu = document.getElementById("photo-menu");
    if (photoMenu && photoMenu.classList.contains("open")) closePhotoMenu();
    closeSpecialPlacePopup();
}

function bindOutsidePanelDismissals() {
    if (document.documentElement.dataset.outsidePanelDismissBound === "1") return;
    document.documentElement.dataset.outsidePanelDismissBound = "1";
    document.addEventListener("click", function(event) {
        var target = event.target;
        var dailyPanel = document.getElementById("daily-task-panel");
        var dailyTag = document.getElementById("daily-task-tag");
        if (dailyTaskPanelOpen && dailyPanel && !dailyPanel.contains(target) && (!dailyTag || !dailyTag.contains(target))) toggleDailyTasks(false);

        var tourPanel = document.getElementById("tour-panel");
        if (tourPanelOpen && tourPanel && !tourPanel.contains(target)) collapseTourPanel();

        var dialogue = document.getElementById("gilo-dialogue-layer");
        var dialogueBox = document.getElementById("gilo-dialogue-box");
        if (dialogue && dialogue.classList.contains("is-open") && dialogueBox && !dialogueBox.contains(target)) hideGiloDialogue();

        var help = document.getElementById("help-popup");
        var helpBox = document.getElementById("help-content-box");
        var helpButton = document.getElementById("help-btn");
        if (help && help.classList.contains("show") && helpBox && !helpBox.contains(target) && (!helpButton || !helpButton.contains(target))) help.classList.remove("show");

        var photoMenu = document.getElementById("photo-menu");
        var photoButton = document.getElementById("photo-btn");
        if (photoMenu && photoMenu.classList.contains("open") && !photoMenu.contains(target) && (!photoButton || !photoButton.contains(target))) closePhotoMenu();
    });
}

bindOutsidePanelDismissals();
map.on("click", closeMapTransientPanels);
scheduleTourFetch({ immediate: true });
if (mapLayerSettings.library) fetchLibraries();

// 吏???쒖떆 ?덉씠???좉? (?ъ씠?쒕컮 "吏???쒖떆" ?⑤꼸)
function toggleMapLayerPanel() {
    var panel = document.getElementById("map-layer-panel");
    var caret = document.getElementById("map-layer-caret");
    if (!panel) return;
    panel.classList.toggle("expanded");
    if (caret) caret.classList.toggle("open");
}
// Sidebar grouping only: the existing per-layer settings and actions remain authoritative.
var MAP_LAYER_GROUPS = {
    discovery: ["tourism"],
    food: ["restaurant"],
    convenience: ["restroom", "parking", "library", "lodging", "community"],
    activity: ["durunubi", "fishing", "camping"]
};
var MAP_LAYER_MENU_ICONS = {
    discovery: '<path d="M3 9l9-6 9 6H3zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
    food: '<path d="M5 3v7m3-7v7M3 3v5a3 3 0 006 0V3M6 11v10M17 3v18m0-18c-4 3-4 9 0 9"/>',
    convenience: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M9 5V3h6v2m-3 5v6m-3-3h6"/>',
    activity: '<path d="M3 20l6-12 4 7 3-5 5 10H3zM16 3v3m-2-1h4"/>',
    restroom: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M4 10h6v6H4zm2 6v5m3-5v5m8-11l-4 7h8l-4-7zm-1 7v4m3-4v4"/>',
    parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 18V7h4a3 3 0 010 6H9"/>',
    library: '<path d="M12 6C8 3 5 4 3 5v15c3-2 6-1 9 1 3-2 6-3 9-1V5c-2-1-5-2-9 1zm0 0v15"/>',
    lodging: '<path d="M3 21V4m0 12h18v5m-18-9h18v4M7 12V8h5v4m0 0V8h6v4"/>',
    fishing: '<path d="M4 21L15 3h5v10a3 3 0 01-6 0m0 0v-2"/>',
    camping: '<path d="M4 20L12 4l8 16H4zm4 0l4-8 4 8M2 20h20"/>',
    community: '<path d="M3 10l9-7 9 7v11H3V10zm6 11v-7h6v7"/>'
};
function mapLayerMenuIcon(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (MAP_LAYER_MENU_ICONS[key] || MAP_LAYER_MENU_ICONS.discovery) + '</svg>';
}
function getMapLayerGroupKeys(group) {
    return (MAP_LAYER_GROUPS[group] || []).filter(function(key) {
        return Object.prototype.hasOwnProperty.call(mapLayerSettings, key) && !MAP_LAYER_UNAVAILABLE[key];
    });
}
function getMapLayerGroupState(group) {
    var keys = getMapLayerGroupKeys(group);
    var count = keys.filter(function(key) { return !!mapLayerSettings[key]; }).length;
    return count === 0 ? "off" : count === keys.length ? "on" : "mixed";
}
function toggleMapLayerGroup(group) {
    var turnOn = getMapLayerGroupState(group) !== "on";
    getMapLayerGroupKeys(group).forEach(function(key) {
        if (!!mapLayerSettings[key] !== turnOn) toggleMapLayer(key);
    });
    syncMapLayerGroupUI();
}
function syncMapLayerGroupUI() {
    if (!UI_TEXT) return;
    var text = UI_TEXT[currentLang] || UI_TEXT.ko;
    Object.keys(MAP_LAYER_GROUPS).forEach(function(group) {
        var card = document.getElementById("map-layer-group-" + group);
        if (!card) return;
        var state = getMapLayerGroupState(group);
        var name = text["map_group_" + group];
        card.dataset.state = state;
        card.querySelector(".map-layer-group-name").textContent = name;
        card.querySelector(".map-layer-group-state").textContent = text["map_group_" + state];
        card.querySelector(".map-layer-group-toggle").setAttribute("aria-checked", state === "mixed" ? "mixed" : String(state === "on"));
        card.querySelector(".map-layer-group-expand").setAttribute("aria-label", name);
    });
}
function initMapLayerGroups() {
    var panel = document.getElementById("map-layer-panel");
    if (!panel || panel.dataset.grouped === "true") return;
    panel.dataset.grouped = "true";
    Object.keys(MAP_LAYER_GROUPS).forEach(function(group) {
        var card = document.createElement("section");
        card.id = "map-layer-group-" + group;
        card.className = "map-layer-group";
        card.innerHTML = '<div class="map-layer-group-header"><button type="button" class="map-layer-group-toggle" role="checkbox" aria-checked="false"><span class="map-layer-menu-icon">' + mapLayerMenuIcon(group) + '</span><span class="map-layer-group-name"></span><span class="map-layer-group-state"></span></button><button type="button" class="map-layer-group-expand" aria-expanded="false" aria-controls="map-layer-group-details-' + group + '">▾</button></div><div class="map-layer-group-details" id="map-layer-group-details-' + group + '" hidden></div>';
        var details = card.querySelector(".map-layer-group-details");
        card.querySelector(".map-layer-group-toggle").addEventListener("click", function() { toggleMapLayerGroup(group); });
        card.querySelector(".map-layer-group-expand").addEventListener("click", function(event) {
            event.stopPropagation();
            details.hidden = !details.hidden;
            this.setAttribute("aria-expanded", String(!details.hidden));
            this.textContent = details.hidden ? "▾" : "▴";
        });
        MAP_LAYER_GROUPS[group].forEach(function(key) {
            var toggle = document.getElementById("layer-toggle-" + key);
            var row = toggle && toggle.closest(".map-layer-item");
            if (!row) return;
            var dot = row.querySelector(".map-layer-dot");
            if (dot) {
                dot.className = "map-layer-menu-icon";
                dot.innerHTML = mapLayerMenuIcon(key === "tourism" ? "discovery" : key === "restaurant" ? "food" : key === "durunubi" ? "activity" : key);
            }
            details.appendChild(row);
        });
        panel.appendChild(card);
    });
    syncMapLayerGroupUI();
}
function syncMapLayerToggleUI(key) {
    var sw = document.getElementById("layer-toggle-" + key);
    if (!sw) return;
    var on = !!mapLayerSettings[key];
    sw.classList.toggle("on", on);
    sw.classList.toggle("off", !on);
    syncMapLayerGroupUI();
}
function applyMapLayerChange(key) {
    var gpsBefore = captureGpsIntegrity();
    logGpsLayerChange("BEFORE layer-" + key, gpsBefore);
    if (key === "tourism") {
        addTourMarkers();
        if (mapLayerSettings.tourism) refreshTourData({ force:true });
    } else if (key === "library") {
        if (mapLayerSettings.library) {
            if (librariesLoaded) { renderLibraryMarkers(); translateLibraryItemsForLang(currentLang); }
            else fetchLibraries();
        } else {
            clearLibraryMarkers();
        }
    } else if (key === "restroom") {
        if (mapLayerSettings.restroom) {
            fetchRestroomsForCurrentArea();
        } else {
            restroomSearchSeq += 1;
            if (restroomAbortController) restroomAbortController.abort();
            restroomAbortController = null;
            restroomSearchPromise = null;
            restroomSearchKey = "";
            clearRestroomMarkers();
            restroomGuFetched = {}; // ?ㅼ떆 耳곗쓣 ???꾩옱 蹂댁씠??援щ? ?ы룊媛?섎룄濡?珥덇린??(吏?ㅼ퐫??罹먯떆???좎??섏뼱 ?ы샇異쒖? ????
        }
    } else if (key === "parking") {
        if (mapLayerSettings.parking) refreshParkingForMap();
        else { parkingRequestSeq += 1; clearParkingMarkers(); }
    } else if (key === "fishing") {
        if (mapLayerSettings.fishing) refreshFishingForMap();
        else { fishingRequestSeq += 1; clearFishingMarkers(); }
    } else if (key === "camping") {
        if (mapLayerSettings.camping) refreshCampingForMap();
        else { campingRequestSeq += 1; clearCampingMarkers(); }
    } else if (key === "restaurant" || key === "lodging") {
        addTourMarkers();
        if (mapLayerSettings[key]) refreshTourData({ force:true });
    } else if (key === "durunubi") {
        if (mapLayerSettings.durunubi) refreshDurunubiForMap(true);
        else clearDurunubiRoutes();
    }
    // community: ?꾩쭅 ?곌껐???곗씠???뚯뒪媛 ?놁뼱 ?곹깭留???ν빀?덈떎 (以鍮?以?.
    refreshGpsVisualsAfterPlaceLayerChange("layer-" + key, gpsBefore);
}
function toggleMapLayer(key) {
    if (MAP_LAYER_UNAVAILABLE[key]) return;
    mapLayerSettings[key] = !mapLayerSettings[key];
    saveMapLayerSettings();
    syncMapLayerToggleUI(key);
    applyMapLayerChange(key);
}
function fetchRestroomsFromKakaoForCurrentArea(center, radius, requestSeq) {
    if (!mapLayerSettings.restroom || navigator.onLine === false) return Promise.resolve([]);
    center = center || getMapSearchCenter();
    radius = radius || getMapSearchRadius();
    return loadKakaoTrafficSdk().then(function() {
        if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) return [];
        if (!window.kakao.maps.services || !window.kakao.maps.services.Places) return [];
        return new Promise(function(resolve) {
            var settled = false;
            var timer = setTimeout(function() { finish([]); }, RESTROOM_PROVIDER_TIMEOUT_MS);
            function finish(items) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(items || []);
            }
            try {
                var places = new window.kakao.maps.services.Places();
                places.keywordSearch("화장실", function(results, status) {
                    if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) { finish([]); return; }
                    if (status !== window.kakao.maps.services.Status.OK) { finish([]); return; }
                    var items = (results || []).map(function(place) {
                        return normalizeRestroomItem({
                            id: place.id,
                            name: place.place_name,
                            addr: place.road_address_name || place.address_name,
                            tel: place.phone,
                            lat: place.y,
                            lng: place.x
                        }, "kakao");
                    }).filter(Boolean);
                    finish(filterRestroomItemsForArea(items, center, radius));
                }, {
                    location: new window.kakao.maps.LatLng(center.lat, center.lng),
                    radius: radius,
                    size: 15,
                    sort: window.kakao.maps.services.SortBy.DISTANCE
                });
            } catch (_) { finish([]); }
        });
    }).catch(function() { return []; });
}
function fetchRestroomsFromOsm(center, radius, options) {
    options = options || {};
    var cached = readRestroomAreaCache(center, radius);
    if (cached && cached.fresh && !options.force) return Promise.resolve(cached.items);
    if (navigator.onLine === false) return Promise.reject(new Error("Device is offline"));
    var queryRadius = Math.max(300, Math.min(10000, Math.round(radius)));
    var query = '[out:json][timeout:7];nwr["amenity"="toilets"](around:' + queryRadius + ',' + center.lat.toFixed(6) + ',' + center.lng.toFixed(6) + ');out center tags 100;';
    return new Promise(function(resolve, reject) {
        var settled = false;
        var failures = 0;
        var secondTimer = null;
        function finish(error, data) {
            if (settled) return;
            if (error) {
                failures += 1;
                if (failures < RESTROOM_OSM_ENDPOINTS.length) return;
            }
            settled = true;
            if (secondTimer !== null) clearTimeout(secondTimer);
            error ? reject(error) : resolve(data);
        }
        function startProvider(index) {
            var url = RESTROOM_OSM_ENDPOINTS[index] + "?data=" + encodeURIComponent(query);
            requestJsonOnce(url, { timeoutMs: RESTROOM_PROVIDER_TIMEOUT_MS, signal: options.signal }).then(function(data) {
                finish(null, data);
            }).catch(function(error) { finish(error); });
        }
        startProvider(0);
        secondTimer = setTimeout(function() { startProvider(1); }, 650);
    }).then(function(data) {
        var items = (data && Array.isArray(data.elements) ? data.elements : []).map(function(element) {
            var tags = element.tags || {};
            return normalizeRestroomItem({
                id: element.type + "|" + element.id,
                name: tags.name || tags["name:ko"] || getRestroomLabel(),
                addr: [tags["addr:city"], tags["addr:district"], tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
                tel: tags.phone || tags["contact:phone"] || "",
                hours: tags.opening_hours || "",
                openType: tags.access === "customers" ? "고객 이용" : (tags.fee === "yes" ? "유료" : "공중화장실"),
                lat: isFinite(element.lat) ? Number(element.lat) : Number(element.center && element.center.lat),
                lng: isFinite(element.lon) ? Number(element.lon) : Number(element.center && element.center.lon)
            }, "osm");
        }).filter(Boolean);
        items = filterRestroomItemsForArea(items, center, radius);
        if (items.length) writeRestroomAreaCache(center, radius, items);
        return items;
    });
}
function fetchRestroomsForCurrentArea(options) {
    options = options || {};
    if (!mapLayerSettings.restroom) return Promise.resolve(false);
    var center = getMapSearchCenter();
    var radius = getMapSearchRadius();
    var areaKey = getRestroomAreaCacheKey(center, radius);
    if (!options.force && restroomSearchPromise && restroomSearchKey === areaKey) return restroomSearchPromise;

    restroomSearchSeq += 1;
    var requestSeq = restroomSearchSeq;
    if (restroomAbortController) restroomAbortController.abort();
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    restroomAbortController = controller;
    var cached = readRestroomAreaCache(center, radius);
    if (cached && cached.items.length) {
        restroomVisibleItems = cached.items;
        renderRestroomMarkers();
    }

    function applyItems(items) {
        if (requestSeq !== restroomSearchSeq || !mapLayerSettings.restroom) return false;
        var visible = filterRestroomItemsForArea(items, center, radius);
        if (!visible.length) return false;
        restroomVisibleItems = visible;
        writeRestroomAreaCache(center, radius, visible);
        renderRestroomMarkers();
        return true;
    }
    function refreshSeoulInBackground() {
        return fetchSeoulRestroomData({ force: !!options.force }).then(function(items) { return applyItems(items); });
    }
    function fetchOnlineFallbacks() {
        if (navigator.onLine === false) return Promise.resolve(!!(cached && cached.items.length));
        return fetchRestroomsFromOsm(center, radius, { force: !!options.force, signal: controller && controller.signal }).then(function(items) {
            if (applyItems(items)) return true;
            return fetchRestroomsFromKakaoForCurrentArea(center, radius, requestSeq).then(applyItems);
        }).catch(function() {
            return fetchRestroomsFromKakaoForCurrentArea(center, radius, requestSeq).then(applyItems);
        });
    }

    var isSeoul = isLikelySeoulArea(center);
    var work = (isSeoul ? fetchRestroomsFromLocalDataForCurrentArea(center, radius, requestSeq) : Promise.resolve([])).then(function(localItems) {
        var hasLocal = applyItems(localItems);
        if (hasLocal) {
            refreshSeoulInBackground();
            return true;
        }
        if (cached && cached.fresh && cached.items.length && !options.force) return true;
        if (isSeoul) return refreshSeoulInBackground().then(function(hasFresh) { return hasFresh || fetchOnlineFallbacks(); });
        return fetchOnlineFallbacks();
    }).catch(function() {
        return !!(cached && cached.items.length);
    }).finally(function() {
        if (restroomSearchPromise === work) {
            restroomSearchPromise = null;
            restroomSearchKey = "";
        }
        if (restroomAbortController === controller) restroomAbortController = null;
    });
    restroomSearchKey = areaKey;
    restroomSearchPromise = work;
    return work;
}
function refreshMapCenteredLayerMarkers() {
    if (mapLayerSettings.library && librariesLoaded) renderLibraryMarkers(currentLang);
    if (mapLayerSettings.restroom) {
        renderRestroomMarkers();
    }
    if (mapLayerSettings.parking) refreshParkingForMap();
    if (mapLayerSettings.fishing) refreshFishingForMap();
    if (mapLayerSettings.camping) refreshCampingForMap();
    updateFestivalBadge();
    renderTourCards();
}
function initMapLayerUI() {
    Object.keys(MAP_LAYER_DEFAULTS).forEach(function(key) { syncMapLayerToggleUI(key); });
    if (mapLayerSettings.parking) refreshParkingForMap();
    if (mapLayerSettings.fishing) refreshFishingForMap();
    if (mapLayerSettings.camping) refreshCampingForMap();
    addTourMarkers();
}
initMapLayerUI();

// Korea Tourism Organization Durunubi routes, drawn automatically below fog.
var DURUNUBI_ENDPOINT = "https://apis.data.go.kr/B551011/Durunubi";
var DURUNUBI_API_KEY = window.GILOA_DURUNUBI_API_KEY || TOUR_API_KEY || "";
var durunubiCourses = [];
var durunubiCoursesPromise = null;
var durunubiGpxCache = {};
var durunubiLocalBundlePromise = null;
var durunubiRouteLayers = [];
var completedOfficialLayerGroup = L.layerGroup().addTo(map);
var renderedOfficialRoutes = [];
var completedOfficialRefreshTimer = null;
var completedOfficialMatchCache = new WeakMap();
var durunubiCanvas = document.getElementById("durunubi-canvas");
var durunubiCanvasContext = durunubiCanvas ? durunubiCanvas.getContext("2d") : null;
var durunubiVisibleBundle = null;
var durunubiRefreshTimer = null;
var durunubiRequestSeq = 0;
var durunubiLastRegion = "";
var durunubiDiagnostics = { stage:"대기", courses:0, routes:0, points:0, drawn:0, error:"" };
var DURUNUBI_TEXT = {
    ko:{ route:"공식 탐방로", easy:"쉬움", normal:"보통", hard:"어려움", difficulty:"난이도", hour:"시간", minute:"분", durunubiSource:"한국관광공사 두루누비", forestSource:"한국등산·트레킹지원센터 국가숲길", officialTrailSource:"한국등산·트레킹지원센터", failed:"탐방로 데이터 실패 · 눌러서 확인" },
    en:{ route:"Official walking route", easy:"Easy", normal:"Moderate", hard:"Hard", difficulty:"Difficulty", hour:"hr", minute:"min", durunubiSource:"Korea Tourism Organization · Durunubi", forestSource:"Korea Mountaineering Support Center · National Forest Trails", officialTrailSource:"Korea Mountaineering Support Center", failed:"Durunubi failed · Tap to check" },
    ja:{ route:"公式トレイル", easy:"やさしい", normal:"普通", hard:"難しい", difficulty:"難易度", hour:"時間", minute:"分", durunubiSource:"韓国観光公社・ドゥルヌビ", forestSource:"韓国登山・トレッキング支援センター・国家森林道", officialTrailSource:"韓国登山・トレッキング支援センター", failed:"ドゥルヌビの読込失敗 · タップして確認" },
    zh:{ route:"官方步道", easy:"简单", normal:"普通", hard:"困难", difficulty:"难度", hour:"小时", minute:"分钟", durunubiSource:"韩国观光公社 Durunubi", forestSource:"韩国登山徒步支援中心·国家森林步道", officialTrailSource:"韩国登山徒步支援中心", failed:"Durunubi 加载失败 · 点击查看" },
    es:{ route:"Ruta oficial", easy:"Fácil", normal:"Moderada", hard:"Difícil", difficulty:"Dificultad", hour:"h", minute:"min", durunubiSource:"Organización de Turismo de Corea · Durunubi", forestSource:"Centro Coreano de Montañismo · Senderos forestales nacionales", officialTrailSource:"Centro Coreano de Montañismo", failed:"Error de Durunubi · Toca para comprobar" },
    fr:{ route:"Itinéraire officiel", easy:"Facile", normal:"Modéré", hard:"Difficile", difficulty:"Difficulté", hour:"h", minute:"min", durunubiSource:"Office du tourisme de Corée · Durunubi", forestSource:"Centre coréen de randonnée · Sentiers forestiers nationaux", officialTrailSource:"Centre coréen de randonnée", failed:"Échec de Durunubi · Touchez pour vérifier" }
};
function getDurunubiText() { return DURUNUBI_TEXT[currentLang] || DURUNUBI_TEXT.ko; }

var OFFICIAL_ROUTE_STYLES = {
    nationalForestTrail:{ color:"#25e6ad", weight:7, minZoom:7 },
    majorPeak:{ color:"#a78bfa", weight:5, minZoom:11 },
    mountain100:{ color:"#fb923c", weight:6, minZoom:9 },
    ridge9:{ color:"#38bdf8", weight:6, minZoom:6 },
    baekduDaegan:{ color:"#ef4444", weight:7, minZoom:6 },
    fiveSensesTrail:{ color:"#f472b6", weight:6, minZoom:8 },
    durunubi:{ color:"#ffd21f", weight:6, minZoom:7 }
};

function setDurunubiBadge(text, tone) {
    var badge = document.getElementById("durunubi-loaded-badge");
    if (!badge) return;
    if (!text) { badge.hidden = true; return; }
    badge.textContent = text;
    badge.dataset.tone = tone || "ok";
    badge.hidden = false;
}
function describeDurunubiState() {
    var t = getTourUiText();
    var stages = {"대기":t.waiting,"내장 경로 파일 로드됨":t.loaded,"경로 파일 불러오는 중":t.loadingRoutes,"경로 파일 실패":t.failedRoutes,"꺼짐":t.off,"주변 경로 표시됨":t.visibleRoutes,"주변 경로 없음":t.noRoutes};
    return ["[" + t.diagnostic + "]", t.stage + ": " + (stages[durunubiDiagnostics.stage] || durunubiDiagnostics.stage),
        t.courses + ": " + durunubiDiagnostics.courses,
        t.routes + ": " + durunubiDiagnostics.routes,
        t.points + ": " + durunubiDiagnostics.points,
        t.drawn + ": " + durunubiDiagnostics.drawn,
        t.error + ": " + (durunubiDiagnostics.error || t.none)].join("\n");
}
window.giloaDurunubiDebug = function() { alert(describeDurunubiState()); return durunubiDiagnostics; };

function getDurunubiItems(data) {
    var list = data && data.response && data.response.body && data.response.body.items && data.response.body.items.item;
    return !list ? [] : (Array.isArray(list) ? list : [list]);
}
function stripDurunubiHtml(value) {
    var div = document.createElement("div");
    div.innerHTML = String(value || "").replace(/<br\s*\/?>/gi, " ");
    return (div.textContent || "").replace(/\s+/g, " ").trim();
}
function durunubiMinutesLabel(value) {
    var minutes = Math.max(0, Number(value) || 0), hours = Math.floor(minutes / 60), rest = minutes % 60;
    var t = getDurunubiText();
    return hours ? hours + t.hour + (rest ? " " + rest + t.minute : "") : rest + t.minute;
}
function fetchDurunubiCourses() {
    if (durunubiCourses.length) return Promise.resolve(durunubiCourses);
    if (durunubiCoursesPromise) return durunubiCoursesPromise;
    if (!DURUNUBI_API_KEY) return Promise.reject(new Error("Durunubi service key is missing"));
    var url = DURUNUBI_ENDPOINT + "/courseList?serviceKey=" + encodeURIComponent(DURUNUBI_API_KEY) + "&numOfRows=500&pageNo=1&MobileOS=ETC&MobileApp=Giloa&_type=json";
    durunubiCoursesPromise = requestJsonOnce(url, { timeoutMs:15000 }).then(function(data) {
        var header = data && data.response && data.response.header;
        if (!header || header.resultCode !== "0000") throw new Error((header && header.resultMsg) || "Durunubi response error");
        durunubiCourses = getDurunubiItems(data);
        return durunubiCourses;
    }).finally(function() { durunubiCoursesPromise = null; });
    return durunubiCoursesPromise;
}
function normalizeDurunubiRegion(value) {
    return String(value || "").replace(/특별자치시|특별자치도|특별시|광역시|도$/g, "").replace(/\s+/g, "").trim();
}
function getDurunubiMapRegion() {
    return loadKakaoTrafficSdk().then(function() {
        return new Promise(function(resolve, reject) {
            if (!window.kakao || !window.kakao.maps.services) { reject(new Error("Kakao geocoder unavailable")); return; }
            var center = map.getCenter();
            new window.kakao.maps.services.Geocoder().coord2RegionCode(center.lng, center.lat, function(result, status) {
                if (status !== window.kakao.maps.services.Status.OK || !result || !result.length) { reject(new Error("Region lookup failed")); return; }
                var row = result.find(function(item) { return item.region_type === "H"; }) || result[0];
                resolve({ primary:normalizeDurunubiRegion(row.region_1depth_name), secondary:normalizeDurunubiRegion(row.region_2depth_name) });
            });
        });
    });
}
function parseDurunubiGpx(text) {
    var xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("GPX parse error");
    return Array.from(xml.querySelectorAll("trkpt, rtept")).map(function(point) {
        return [Number(point.getAttribute("lat")), Number(point.getAttribute("lon"))];
    }).filter(function(point) { return isFinite(point[0]) && isFinite(point[1]); });
}
function loadDurunubiLocalScriptBundle() {
    // file:// cannot fetch the JSON bundle; load the packaged JS only on demand.
    return new Promise(function(resolve, reject) {
        var script = document.createElement("script");
        function finish(error) {
            script.onload = script.onerror = null;
            script.remove();
            if (error) reject(error);
            else resolve(window.GILOA_DURUNUBI_BUNDLE);
        }
        script.src = "./data/durunubi-routes.js";
        script.async = true;
        script.onload = function() {
            var bundle = window.GILOA_DURUNUBI_BUNDLE;
            finish(bundle && Object.keys(bundle.routes || {}).length ? null : new Error("경로 파일에 사용할 좌표가 없습니다"));
        };
        script.onerror = function() { finish(new Error("경로 파일을 불러오지 못했습니다 (data/durunubi-routes.js 배포 확인)")); };
        document.head.appendChild(script);
    });
}
function loadDurunubiLocalBundle() {
    if (window.GILOA_DURUNUBI_BUNDLE && Object.keys(window.GILOA_DURUNUBI_BUNDLE.routes || {}).length) {
        var embedded = window.GILOA_DURUNUBI_BUNDLE;
        var embeddedRoutes = embedded.routes || {};
        var embeddedIds = Object.keys(embeddedRoutes);
        var embeddedPoints = embeddedIds.reduce(function(total, id) { return total + (Array.isArray(embeddedRoutes[id]) ? embeddedRoutes[id].length : 0); }, 0);
        durunubiDiagnostics.courses = (embedded.courses || []).length;
        durunubiDiagnostics.routes = embeddedIds.length;
        durunubiDiagnostics.points = embeddedPoints;
        durunubiDiagnostics.error = "";
        durunubiDiagnostics.stage = "내장 경로 파일 로드됨";
        return Promise.resolve(embedded);
    }
    if (durunubiLocalBundlePromise) return durunubiLocalBundlePromise;
    durunubiDiagnostics.stage = "경로 파일 불러오는 중";
    var load = window.location.protocol === "file:" ? loadDurunubiLocalScriptBundle() : fetch("./data/durunubi-routes.json", { cache:"no-store" }).then(function(response) {
        if (!response.ok) throw new Error("경로 파일 HTTP " + response.status + " (data/durunubi-routes.json 배포 확인)");
        return response.json();
    });
    durunubiLocalBundlePromise = load.then(function(data) {
        var bundle = data || {}, routes = bundle.routes || {}, ids = Object.keys(routes);
        if (!ids.length) throw new Error("경로 파일에 사용할 좌표가 없습니다");
        var points = ids.reduce(function(total, id) { return total + (Array.isArray(routes[id]) ? routes[id].length : 0); }, 0);
        durunubiDiagnostics.courses = (bundle.courses || []).length;
        durunubiDiagnostics.routes = ids.length;
        durunubiDiagnostics.points = points;
        durunubiDiagnostics.error = "";
        return bundle;
    }).catch(function(error) {
        durunubiLocalBundlePromise = null;
        durunubiDiagnostics.stage = "경로 파일 실패";
        durunubiDiagnostics.error = error && error.message ? error.message : String(error);
        throw error;
    });
    return durunubiLocalBundlePromise;
}
function fetchDurunubiGpx(course) {
    var id = course.crsIdx || course.gpxpath;
    if (durunubiGpxCache[id]) return Promise.resolve(durunubiGpxCache[id]);
    if (!course.gpxpath) return Promise.resolve([]);
    return loadDurunubiLocalBundle().then(function(bundle) {
        var routes = bundle.routes || {};
        if (routes[id] && routes[id].length > 1) {
            durunubiGpxCache[id] = routes[id];
            return routes[id];
        }
        return fetch(course.gpxpath, { cache:"force-cache" }).then(function(response) {
            if (!response.ok) throw new Error("GPX HTTP " + response.status);
            return response.text();
        }).then(parseDurunubiGpx).then(function(points) {
            durunubiGpxCache[id] = points;
            return points;
        });
    });
}
function clearDurunubiRoutes() {
    durunubiRequestSeq += 1;
    durunubiLayerGroup.clearLayers();
    completedOfficialLayerGroup.clearLayers();
    renderedOfficialRoutes = [];
    durunubiRouteLayers = [];
    durunubiVisibleBundle = null;
    clearDurunubiCanvas();
    durunubiDiagnostics.drawn = 0;
    durunubiDiagnostics.stage = "꺼짐";
    setDurunubiBadge("");
}
function resizeDurunubiCanvas() {
    if (!durunubiCanvas || !durunubiCanvasContext) return;
    var size = map.getSize();
    var ratio = Math.min(2, window.devicePixelRatio || 1);
    var width = Math.max(1, Math.round(size.x * ratio));
    var height = Math.max(1, Math.round(size.y * ratio));
    if (durunubiCanvas.width !== width || durunubiCanvas.height !== height) {
        durunubiCanvas.width = width;
        durunubiCanvas.height = height;
        durunubiCanvas.style.width = size.x + "px";
        durunubiCanvas.style.height = size.y + "px";
    }
    durunubiCanvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function clearDurunubiCanvas() {
    if (!durunubiCanvas || !durunubiCanvasContext) return;
    resizeDurunubiCanvas();
    var size = map.getSize();
    durunubiCanvasContext.clearRect(0, 0, size.x, size.y);
    var badge = document.getElementById("durunubi-loaded-badge");
    if (badge) badge.hidden = true;
}
function drawDurunubiCanvas() {
    clearDurunubiCanvas();
    if (!mapLayerSettings.durunubi || !durunubiVisibleBundle || !durunubiCanvasContext) return;
    var routes = durunubiVisibleBundle.routes || {};
    var visibleBounds = map.getBounds().pad(.25);
    var ctx = durunubiCanvasContext;
    var visibleCount = 0;
    Object.keys(routes).forEach(function(routeId) {
        var points = routes[routeId];
        if (!points || points.length < 2 || !L.latLngBounds(points).intersects(visibleBounds)) return;
        visibleCount += 1;
        ctx.beginPath();
        points.forEach(function(latlng, index) {
            var point = map.latLngToContainerPoint(latlng);
            if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
        });
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(17,24,39,.9)";
        ctx.lineWidth = 11;
        ctx.stroke();
        ctx.strokeStyle = "#ffd21f";
        ctx.lineWidth = 6;
        ctx.stroke();
    });
    setDurunubiBadge("");
}
function buildDurunubiPopupHtml(course) {
    var isForestTrail = course.sourceType === "nationalForestTrail";
    var dt = getDurunubiText();
    var level = course.crsLevel ? (({ "1":dt.easy, "2":dt.normal, "3":dt.hard })[String(course.crsLevel)] || dt.difficulty + " " + course.crsLevel) : "";
    var sourceLabel = course.sourceName || (isForestTrail ? dt.forestSource : (course.sourceType ? dt.officialTrailSource : dt.durunubiSource));
    var meta = [course.sigun || "", course.crsDstnc ? course.crsDstnc + "km" : "", course.crsTotlRqrmHour ? durunubiMinutesLabel(course.crsTotlRqrmHour) : "", level].filter(Boolean).join(" · ");
    return "<b>" + escapeHtml(course.crsKorNm || dt.route) + "</b>" + (meta ? "<br><small>" + escapeHtml(meta) + "</small>" : "") + "<p>" + escapeHtml(stripDurunubiHtml(course.crsSummary || course.crsContents)).slice(0, 260) + "</p><small>" + escapeHtml(sourceLabel) + "</small>";
}
function drawDurunubiCourse(course, points) {
    if (points.length < 2) return false;
    var style = OFFICIAL_ROUTE_STYLES[course.sourceType] || OFFICIAL_ROUTE_STYLES.durunubi;
    var casing = L.polyline(points, { renderer:durunubiRenderer, pane:"durunubiPane", color:"#111827", weight:style.weight + 4, opacity:0.28, interactive:false, lineCap:"round", lineJoin:"round" });
    var line = L.polyline(points, { renderer:durunubiRenderer, pane:"durunubiPane", color:style.color, weight:style.weight, opacity:0.4, interactive:true, lineCap:"round", lineJoin:"round" });
    line.bindTooltip(escapeHtml(course.crsKorNm || getDurunubiText().route), { sticky:true, className:"durunubi-route-tooltip" });
    line.on("tooltipopen", function(event) {
        event.tooltip.setContent(escapeHtml(course.crsKorNm || getDurunubiText().route));
        translatePublicPlacePopup(event.tooltip);
    });
    line.bindPopup(buildDurunubiPopupHtml(course));
    line.on("popupopen", function(event) {
        var popup = event.popup;
        function refresh() {
            popup.setContent(buildDurunubiPopupHtml(course));
            translatePublicPlacePopup(popup);
        }
        popup.setContent(buildDurunubiPopupHtml(course));
        trackPublicPlacePopup(popup, refresh);
    });
    durunubiLayerGroup.addLayer(casing);
    durunubiLayerGroup.addLayer(line);
    durunubiRouteLayers.push(casing, line);
    renderedOfficialRoutes.push({ id:String(course.crsIdx || ""), points:points, sourceType:course.sourceType || "durunubi" });
    return true;
}

function projectPointToOfficialSegment(point, a, b) {
    var latScale = 111320;
    var lngScale = Math.max(1, 111320 * Math.cos(point.lat * Math.PI / 180));
    var ax = (a[1] - point.lng) * lngScale, ay = (a[0] - point.lat) * latScale;
    var bx = (b[1] - point.lng) * lngScale, by = (b[0] - point.lat) * latScale;
    var dx = bx - ax, dy = by - ay, lengthSq = dx * dx + dy * dy;
    var t = lengthSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSq)) : 0;
    var x = ax + t * dx, y = ay + t * dy;
    return { distance:Math.sqrt(x * x + y * y), point:[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] };
}
function findOfficialRouteMatch(pathPoint) {
    var best = null, threshold = 30;
    for (var r = renderedOfficialRoutes.length - 1; r >= 0; r -= 1) {
        var route = renderedOfficialRoutes[r], points = route.points;
        for (var i = 1; i < points.length; i += 1) {
            var hit = projectPointToOfficialSegment(pathPoint, points[i - 1], points[i]);
            if (hit.distance <= threshold && (!best || hit.distance < best.distance)) best = { id:route.id, distance:hit.distance, point:hit.point };
        }
    }
    return best;
}
function renderCompletedOfficialRoutes() {
    completedOfficialLayerGroup.clearLayers();
    if (!mapLayerSettings.durunubi || renderedOfficialRoutes.length === 0 || pathCoordinates.length < 2) return;
    var matches = pathCoordinates.map(function(point) {
        if (completedOfficialMatchCache.has(point)) return completedOfficialMatchCache.get(point);
        var match = findOfficialRouteMatch(point);
        completedOfficialMatchCache.set(point, match);
        return match;
    }), run = [], runDistance = 0;
    function flushRun() {
        if (runDistance >= 100 && run.length > 1) {
            L.polyline(run, { pane:"durunubiPane", color:"#ffffff", weight:7, opacity:0.92, interactive:false, lineCap:"round", lineJoin:"round" }).addTo(completedOfficialLayerGroup);
        }
        run = []; runDistance = 0;
    }
    for (var i = 0; i < matches.length; i += 1) {
        var match = matches[i];
        if (!match) { flushRun(); continue; }
        if (i > 0 && matches[i - 1] && matches[i - 1].id === match.id) {
            var step = map.distance(L.latLng(matches[i - 1].point[0], matches[i - 1].point[1]), L.latLng(match.point[0], match.point[1]));
            if (step <= 150) { if (!run.length) run.push(matches[i - 1].point); run.push(match.point); runDistance += step; continue; }
        }
        flushRun();
        run = [match.point];
    }
    flushRun();
}
function scheduleCompletedOfficialRouteRefresh() {
    if (completedOfficialRefreshTimer) clearTimeout(completedOfficialRefreshTimer);
    completedOfficialRefreshTimer = setTimeout(function() { completedOfficialRefreshTimer = null; renderCompletedOfficialRoutes(); }, 800);
}
function isDurunubiRouteInViewport(points, bounds) {
    if (!bounds || !points || !points.length) return false;
    for (var i = 0; i < points.length; i++) {
        if (bounds.contains([Number(points[i][0]), Number(points[i][1])])) return true;
    }
    return false;
}
function isDurunubiBoundsInViewport(routeBounds, bounds) {
    if (!routeBounds || routeBounds.length < 4 || !bounds) return true;
    return routeBounds[2] >= bounds.getSouth() && routeBounds[0] <= bounds.getNorth() &&
        routeBounds[3] >= bounds.getWest() && routeBounds[1] <= bounds.getEast();
}
function renderNearbyDurunubiRoutes() {
    if (!durunubiVisibleBundle || !mapLayerSettings.durunubi) return 0;
    durunubiLayerGroup.clearLayers();
    completedOfficialLayerGroup.clearLayers();
    durunubiRouteLayers = [];
    renderedOfficialRoutes = [];
    completedOfficialMatchCache = new WeakMap();
    var courses = durunubiVisibleBundle.courses || [], routes = durunubiVisibleBundle.routes || {}, routeBounds = durunubiVisibleBundle.routeBounds || {}, courseById = {};
    courses.forEach(function(course) { courseById[String(course.crsIdx)] = course; });
    var viewportBounds = map.getBounds().pad(0.15);
    var currentZoom = map.getZoom();
    var drawn = 0;
    var overlapPriority = { fiveSensesTrail:1, ridge9:2, mountain100:3, majorPeak:4 };
    Object.keys(routes).sort(function(a, b) {
        var aCourse = courseById[String(a)] || {}, bCourse = courseById[String(b)] || {};
        return (overlapPriority[aCourse.sourceType] || 0) - (overlapPriority[bCourse.sourceType] || 0);
    }).forEach(function(routeId) {
        if (drawn >= MAP_VIEWPORT_ROUTE_LIMIT) return;
        var course = courseById[String(routeId)] || { crsIdx:routeId, crsKorNm:getDurunubiText().route };
        var routeStyle = OFFICIAL_ROUTE_STYLES[course.sourceType] || OFFICIAL_ROUTE_STYLES.durunubi;
        if (currentZoom < routeStyle.minZoom) return;
        if (!isDurunubiBoundsInViewport(routeBounds[routeId], viewportBounds)) return;
        if (!isDurunubiRouteInViewport(routes[routeId], viewportBounds)) return;
        if (drawDurunubiCourse(course, routes[routeId])) drawn += 1;
    });
    durunubiDiagnostics.drawn = drawn;
    durunubiDiagnostics.stage = drawn ? "주변 경로 표시됨" : "주변 경로 없음";
    setDurunubiBadge("");
    renderCompletedOfficialRoutes();
    return drawn;
}
function refreshDurunubiForMap(force) {
    if (!mapLayerSettings.durunubi) return Promise.resolve(false);
    if (durunubiRouteLayers.length && !force) return Promise.resolve(true);
    var requestSeq = ++durunubiRequestSeq;
    setDurunubiBadge("");
    return loadDurunubiLocalBundle().then(function(bundle) {
        var localCourses = bundle.courses || [];
        if (localCourses.length) return { courses:localCourses, routes:bundle.routes || {}, routeBounds:bundle.routeBounds || {} };
        return fetchDurunubiCourses().then(function(courses) { return { courses:courses || [], routes:bundle.routes || {}, routeBounds:bundle.routeBounds || {} }; });
    }).then(function(values) {
        if (requestSeq !== durunubiRequestSeq || !mapLayerSettings.durunubi) return false;
        var courses = values.courses, localRoutes = values.routes;
        durunubiVisibleBundle = { courses:courses, routes:localRoutes, routeBounds:values.routeBounds || {} };
        clearDurunubiCanvas();
        renderNearbyDurunubiRoutes();
        return true;
    }).catch(function(error) {
        console.warn("Durunubi map routes failed", error);
        durunubiDiagnostics.error = error && error.message ? error.message : String(error);
        setDurunubiBadge(getDurunubiText().failed, "error");
        return false;
    });
}
function focusNearestDurunubiRoute() {
    if (!durunubiVisibleBundle) { alert(describeDurunubiState()); return; }
    var center = map.getCenter(), best = null, bestDistance = Infinity;
    Object.keys(durunubiVisibleBundle.routes || {}).forEach(function(id) {
        var track = durunubiVisibleBundle.routes[id];
        if (!track || !track.length) return;
        var point = track[Math.floor(track.length / 2)];
        var distance = map.distance(center, L.latLng(point[0], point[1]));
        if (distance < bestDistance) { bestDistance = distance; best = track; }
    });
    if (best) map.fitBounds(L.latLngBounds(best), { padding:[40, 40] });
}
(function bindDurunubiBadge() {
    var badge = document.getElementById("durunubi-loaded-badge");
    if (!badge) return;
    badge.addEventListener("click", function() {
        if (durunubiDiagnostics.error) alert(describeDurunubiState());
        else focusNearestDurunubiRoute();
    });
})();
if (mapLayerSettings.durunubi) refreshDurunubiForMap(true);
function scheduleDurunubiViewportRefresh() {
    if (!mapLayerSettings.durunubi || !durunubiVisibleBundle) return;
    if (durunubiRefreshTimer) clearTimeout(durunubiRefreshTimer);
    durunubiRefreshTimer = setTimeout(function() {
        durunubiRefreshTimer = null;
        renderNearbyDurunubiRoutes();
    }, 180);
}
map.on("moveend zoomend", scheduleDurunubiViewportRefresh);

// VARCO 踰덉뿭
var VARCO_API_KEY = window.GILOA_VARCO_API_KEY || "";
var VARCO_TRANSLATE_URL = "https://api.varco.ai/mt/chat-content/v1/translate";
var currentLang = "ko";

function getVarcoLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh", es: "es", fr: "fr" })[lang] || "en"; }
function getGoogleLang(lang) { return ({ ko: "ko", en: "en", ja: "ja", zh: "zh-CN", es: "es", fr: "fr" })[lang] || "en"; }

function googleTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(sourceLang || "ko") + "&tl=" + encodeURIComponent(getGoogleLang(targetLang)) + "&q=" + encodeURIComponent(text);
    return fetch(url).then(function(res) { return res.json(); }).then(function(data) {
        if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map(function(part) { return part && part[0] ? part[0] : ""; }).join("") || text;
        return text;
    });
}

var translateMemoryCache = {};
function getTranslateCacheKey(text, sourceLang, targetLang) {
    return [sourceLang || "ko", targetLang || "en", text || ""].join("|");
}
function varcoTranslate(text, sourceLang, targetLang) {
    if (!text) return Promise.resolve("");
    if (normalizeLang(sourceLang) === normalizeLang(targetLang)) return Promise.resolve(text);
    var cacheKey = getTranslateCacheKey(text, sourceLang, targetLang);
    if (translateMemoryCache[cacheKey]) return Promise.resolve(translateMemoryCache[cacheKey]);
    return googleTranslate(text, sourceLang, targetLang).then(function(translated) {
        translateMemoryCache[cacheKey] = translated;
        return translated;
    }).catch(function() {
        if (!VARCO_API_KEY) return text;
        return fetch(VARCO_TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "openapi_key": VARCO_API_KEY },
        body: JSON.stringify({ TID: "giloa-" + Date.now(), svc: "varco-translation", provider: "content", source_lang: sourceLang, source_text: text, target_lang: targetLang })
        }).then(function(res) { return res.text(); }).then(function(raw) {
            if (/^\s*</.test(raw)) throw new Error("VARCO returned HTML");
            var data = JSON.parse(raw);
            var translated = data.target_text || (data.result && data.result.target_text) || (data.data && data.data.target_text) || (data.output && data.output.text) || text;
            translateMemoryCache[cacheKey] = translated;
            return translated;
        }).catch(function() { return text; });
    });
}

var UI_TEXT = {
    ko: { sidebar_title: "나의 기록", fog_label: "안개 효과", fog_on: "켜짐", fog_off: "꺼짐", tab_memory: "기억", tab_photo: "사진", tab_gpx: "경로", tab_badge: "뱃지", tab_visit: "방문", tab_item: "아이템", rec_idle: "중단됨", rec_active: "기록중", gps_weak: "GPS 약함 ({value}m)", gps_very_weak: "GPS 매우 약함 ({value}m)", stay_bonus_wait: "기록중 - 체류 보너스까지 {value}분", stay_bonus_done: "30분 체류 완료! 레벨 +1 보너스!", empty_memory: "아직 기록이 없습니다.", empty_photo: "아직 사진이 없습니다.", tour_title: "주변 관광지", tour_place_fallback: "관광지", festival_label: "주변 축제", festival_badge: "축제", loading: "검색 중...", empty_tour: "주변 장소가 없습니다", close: "닫기", more: "더보기", next: "다음", start: "시작", previous: "이전", count_suffix: "곳", unit_count: "개", hud_title_label: "현재 칭호", hud_level_label: "LV", hud_dist_label: "이동 거리", hud_memory_label: "기억", hud_photo_label: "사진", hud_next: "다음까지", hud_condition_met: "달성!", hud_no_condition: "조건 없음", hud_max: "최고!", hud_max_level: "최고 레벨!", help_tab_ask: "문의하기", help_tab_info: "설명보기", help_tutorial_replay: "튜토리얼 다시 보기", help_ask_copy: "사용 중 불편한 점이나 건의사항은<br>카카오톡 오픈채팅으로 알려주세요.", help_notice: "저장된 GPX 데이터는 서버로 전송되지 않습니다.<br>모든 기록은 <b>이 기기 안에만</b> 저장되고 보여집니다.", help_link: "카카오톡 오픈채팅", help_record_title: "기록 버튼", help_record_desc: "누르면 GPS 경로 기록을 시작하고 다시 누르면 중단합니다.", help_photo_title: "사진 버튼", help_photo_desc: "갤러리에서 사진을 불러옵니다.", help_memory_title: "기억 버튼", help_memory_desc: "현재 위치에 이름을 붙여 기억으로 저장합니다.", help_location_title: "현재 위치와 특별 장소", help_location_desc: "지도 위 파란 현재 위치 점을 누르면 메모와 함께 특별 장소 핀을 저장할 수 있습니다.", help_status_title: "상태 버튼", help_status_desc: "칭호와 진행 상태를 확인합니다.", help_menu_title: "메뉴 버튼", help_menu_desc: "기억, 사진, 경로 기록을 확인합니다." },
    en: { sidebar_title: "My Records", fog_label: "Fog Effect", fog_on: "On", fog_off: "Off", tab_memory: "Memory", tab_photo: "Photo", tab_gpx: "Route", tab_badge: "Badges", tab_visit: "Visits", tab_item: "Items", rec_idle: "Stopped", rec_active: "Recording", gps_weak: "Weak GPS ({value}m)", gps_very_weak: "Very weak GPS ({value}m)", stay_bonus_wait: "Recording - stay bonus in {value} min", stay_bonus_done: "30 min stay complete! Level +1 bonus!", empty_memory: "No records yet.", empty_photo: "No photos yet.", tour_title: "Nearby Places", tour_place_fallback: "Place", festival_label: "Nearby Festivals", festival_badge: "Festivals", loading: "Searching...", empty_tour: "No nearby places", close: "Close", more: "More", next: "Next", start: "Start", previous: "Back", count_suffix: "places", unit_count: "", hud_title_label: "Current Title", hud_level_label: "LV", hud_dist_label: "Distance", hud_memory_label: "Memories", hud_photo_label: "Photos", hud_next: "Next", hud_condition_met: "Met!", hud_no_condition: "No condition", hud_max: "Max!", hud_max_level: "Max level reached!", help_tab_ask: "Contact", help_tab_info: "Guide", help_tutorial_replay: "Replay Tutorial", help_ask_copy: "Tell us about issues or suggestions<br>through KakaoTalk open chat.", help_notice: "Saved GPX data is not sent to the server.<br>All records are stored and shown <b>only on this device</b>.", help_link: "KakaoTalk Open Chat", help_record_title: "Record Button", help_record_desc: "Tap to start GPS route recording. Tap again to stop.", help_photo_title: "Photo Button", help_photo_desc: "Import photos from your gallery.", help_memory_title: "Memory Button", help_memory_desc: "Name your current location and save it as a memory.", help_location_title: "Current Location & Special Places", help_location_desc: "Tap the blue current-location dot on the map to save a special-place pin with a note.", help_status_title: "Status Button", help_status_desc: "Check your title and progress.", help_menu_title: "Menu Button", help_menu_desc: "View memories, photos, and route records." },
    ja: {},
    zh: {},
    es: {}
};
UI_TEXT.ja = Object.assign({}, UI_TEXT.en);
UI_TEXT.zh = Object.assign({}, UI_TEXT.en);
UI_TEXT.es = Object.assign({}, UI_TEXT.en);
Object.assign(UI_TEXT.ja, {
    sidebar_title: "私の記録", fog_label: "霧の効果", fog_on: "オン", fog_off: "オフ",
    tab_memory: "記憶", tab_photo: "写真", tab_gpx: "ルート", tab_badge: "バッジ", tab_visit: "訪問", tab_item: "アイテム",
    rec_idle: "停止中", rec_active: "記録中", gps_weak: "GPSが弱い ({value}m)", gps_very_weak: "GPSが非常に弱い ({value}m)",
    stay_bonus_wait: "記録中 - 滞在ボーナスまで{value}分", stay_bonus_done: "30分滞在完了！レベル+1ボーナス！",
    empty_memory: "まだ記録がありません。", empty_photo: "まだ写真がありません。",
    tour_title: "周辺観光地", tour_place_fallback: "観光地", festival_label: "周辺の祭り", festival_badge: "祭り",
    loading: "検索中...", empty_tour: "周辺の場所がありません", close: "閉じる", more: "もっと見る",
    next: "次へ", start: "開始", previous: "戻る", count_suffix: "件", unit_count: "個",
    hud_title_label: "現在の称号", hud_level_label: "LV", hud_dist_label: "移動距離", hud_memory_label: "記憶",
    hud_photo_label: "写真", hud_next: "次まで", hud_condition_met: "達成！", hud_no_condition: "条件なし",
    hud_max: "最高！", hud_max_level: "最高レベル！",
    help_tab_ask: "お問い合わせ", help_tab_info: "使い方", help_tutorial_replay: "チュートリアルをもう一度見る",
    help_ask_copy: "ご不便な点やご意見は<br>KakaoTalkオープンチャットでお知らせください。",
    help_notice: "保存されたGPXデータはサーバーへ送信されません。<br>すべての記録は<b>この端末内だけ</b>に保存・表示されます。",
    help_link: "KakaoTalkオープンチャット",
    help_record_title: "記録ボタン", help_record_desc: "押すとGPSルート記録を開始し、もう一度押すと停止します。",
    help_photo_title: "写真ボタン", help_photo_desc: "ギャラリーから写真を読み込みます。",
    help_memory_title: "記憶ボタン", help_memory_desc: "現在地に名前を付けて記憶として保存します。",
    help_location_title: "現在地と特別な場所", help_location_desc: "地図上の青い現在地の点をタップすると、メモ付きの特別な場所のピンを保存できます。",
    help_status_title: "ステータスボタン", help_status_desc: "称号と進行状況を確認します。",
    help_menu_title: "メニューボタン", help_menu_desc: "記憶、写真、ルート記録を確認します。"
});
Object.assign(UI_TEXT.zh, {
    sidebar_title: "我的记录", fog_label: "迷雾效果", fog_on: "开启", fog_off: "关闭",
    tab_memory: "记忆", tab_photo: "照片", tab_gpx: "路线", tab_badge: "徽章", tab_visit: "访问", tab_item: "物品",
    rec_idle: "已停止", rec_active: "记录中", gps_weak: "GPS信号较弱 ({value}m)", gps_very_weak: "GPS信号很弱 ({value}m)",
    stay_bonus_wait: "记录中 - 距离停留奖励还有{value}分钟", stay_bonus_done: "停留30分钟完成！等级+1奖励！",
    empty_memory: "还没有记录。", empty_photo: "还没有照片。",
    tour_title: "周边景点", tour_place_fallback: "景点", festival_label: "周边庆典", festival_badge: "庆典",
    loading: "搜索中...", empty_tour: "附近没有地点", close: "关闭", more: "更多",
    next: "下一步", start: "开始", previous: "返回", count_suffix: "处", unit_count: "个",
    hud_title_label: "当前称号", hud_level_label: "LV", hud_dist_label: "移动距离", hud_memory_label: "记忆",
    hud_photo_label: "照片", hud_next: "距离下一级", hud_condition_met: "已达成！", hud_no_condition: "无条件",
    hud_max: "最高！", hud_max_level: "已达最高等级！",
    help_tab_ask: "联系我们", help_tab_info: "使用说明", help_tutorial_replay: "重新查看教程",
    help_ask_copy: "使用中如有不便或建议，<br>请通过KakaoTalk开放聊天告诉我们。",
    help_notice: "保存的GPX数据不会发送到服务器。<br>所有记录<b>只会保存在此设备中</b>并在此显示。",
    help_link: "KakaoTalk开放聊天",
    help_record_title: "记录按钮", help_record_desc: "点击开始记录GPS路线，再次点击即可停止。",
    help_photo_title: "照片按钮", help_photo_desc: "从相册导入照片。",
    help_memory_title: "记忆按钮", help_memory_desc: "为当前位置命名并保存为记忆。",
    help_location_title: "当前位置与特别地点", help_location_desc: "点击地图上的蓝色当前位置圆点，即可保存带备注的特别地点标记。",
    help_status_title: "状态按钮", help_status_desc: "查看称号和进度。",
    help_menu_title: "菜单按钮", help_menu_desc: "查看记忆、照片和路线记录。"
});
Object.assign(UI_TEXT.es, { map_layer_durunubi:"Rutas oficiales", map_layer_durunubi_source:"Organización de Turismo de Corea · Centro Coreano de Montañismo" });
Object.assign(UI_TEXT.ko, {
    hud_next_short: "다음", daily_tag: "할 일", daily_title: "오늘의 할 일", daily_close: "할 일 닫기", daily_kicker:"오늘의 길로아", daily_copy:"가볍게 걸으며 오늘의 길을 남겨보세요.", daily_reset:"매일 자정에 새로 시작", daily_completed:"완료", daily_mission_walk:"새로운 길 {distance} 걷기", daily_mission_photo:"사진 1장 남기기", daily_mission_visit:"{place} 방문하기", daily_mission_photo_place:"{place}에서 사진 남기기", daily_nearby_place:"주변 장소", journey_kicker:"오늘의 여정", journey_stats:"{distance}km · 발견 {visits}곳 · 사진 {photos}장 · 연속 {streak}일", journey_latest:"최근 발견: {place}", journey_empty:"아직 오늘의 발견이 없어요. 주변에서 새로운 경험을 찾아보세요.", journey_log_stats:"이동 {distance}km · 장소 {visits}곳 · 사진 {photos}장 · 머문 장소 {stays}곳", journey_log_places:"오늘의 발견 · {places}", journey_log_wait:"오늘의 발견을 기다리고 있어요.",
    gpx_format: "GPX", gpx_export: "발걸음 추출", gpx_time: "시간", gpx_recent: "최근", gpx_hour_short: "시간",
    gpx_recent_route: "오늘 기준 최근 {hours}시간 발걸음", gpx_name_placeholder: "발걸음 이름 (예: 한강 산책)",
    gpx_save: "이 발걸음 저장하기", gpx_saved: "저장된 발걸음 열기", gpx_import: "파일에서 불러오기", gpx_empty: "저장된 발걸음이 없습니다.", gpx_showing: "표시 중", gpx_route: "경로", gpx_points: "개 지점", gpx_delete: "삭제"
});
Object.assign(UI_TEXT.en, {
    hud_next_short: "Next", daily_tag: "Tasks", daily_title: "Today's Tasks", daily_close: "Close tasks", daily_kicker:"TODAY WITH GILO", daily_copy:"Take a light walk and leave today's path behind.", daily_reset:"Resets every day at midnight", daily_completed:"complete", daily_mission_walk:"Walk a new {distance} path", daily_mission_photo:"Save 1 photo", daily_mission_visit:"Visit {place}", daily_mission_photo_place:"Take a photo at {place}", daily_nearby_place:"a nearby place", journey_kicker:"Today's Journey", journey_stats:"{distance}km · {visits} discoveries · {photos} photos · {streak}-day streak", journey_latest:"Latest discovery: {place}", journey_empty:"No discoveries today yet. Look around for a new experience.", journey_log_stats:"Distance {distance}km · {visits} places · {photos} photos · {stays} stays", journey_log_places:"Today's discoveries · {places}", journey_log_wait:"Waiting for today's first discovery.",
    gpx_format: "GPX", gpx_export: "Export Route", gpx_time: "Time", gpx_recent: "Recent", gpx_hour_short: "h",
    gpx_recent_route: "Route from the last {hours} hours", gpx_name_placeholder: "Route name (e.g. Riverside walk)",
    gpx_save: "Save This Route", gpx_saved: "Open Saved Routes", gpx_import: "Import from File", gpx_empty: "No saved routes.", gpx_showing: "Shown", gpx_route: "Route", gpx_points: "points", gpx_delete: "Delete"
});
Object.assign(UI_TEXT.ja, {
    hud_next_short: "次まで", daily_tag: "タスク", daily_title: "今日のタスク", daily_close: "タスクを閉じる", daily_kicker:"今日のギロ", daily_copy:"気軽に歩いて、今日の道を残してみよう。", daily_reset:"毎日0時にリセット", daily_completed:"完了", daily_mission_walk:"新しい道を{distance}歩く", daily_mission_photo:"写真を1枚残す", daily_mission_visit:"{place}を訪れる", daily_mission_photo_place:"{place}で写真を残す", daily_nearby_place:"周辺の場所", journey_kicker:"今日の旅", journey_stats:"{distance}km · 発見 {visits}か所 · 写真 {photos}枚 · 連続 {streak}日", journey_latest:"最近の発見：{place}", journey_empty:"今日はまだ発見がありません。周辺で新しい体験を探してみよう。", journey_log_stats:"移動 {distance}km · 場所 {visits}か所 · 写真 {photos}枚 · 滞在 {stays}か所", journey_log_places:"今日の発見 · {places}", journey_log_wait:"今日の発見を待っています。",
    gpx_format: "GPX", gpx_export: "ルートを書き出す", gpx_time: "時間", gpx_recent: "最近", gpx_hour_short: "時間",
    gpx_recent_route: "直近{hours}時間のルート", gpx_name_placeholder: "ルート名（例：川沿いの散歩）",
    gpx_save: "このルートを保存", gpx_saved: "保存したルートを開く", gpx_import: "ファイルから読み込む", gpx_empty: "保存したルートはありません。", gpx_showing: "表示中", gpx_route: "ルート", gpx_points: "地点", gpx_delete: "削除"
});
Object.assign(UI_TEXT.zh, {
    hud_next_short: "下一级", daily_tag: "任务", daily_title: "今日任务", daily_close: "关闭任务", daily_kicker:"今日吉路", daily_copy:"轻松走一走，留下今天的足迹吧。", daily_reset:"每天午夜重新开始", daily_completed:"完成", daily_mission_walk:"探索新的{distance}路线", daily_mission_photo:"记录1张照片", daily_mission_visit:"访问{place}", daily_mission_photo_place:"在{place}拍照", daily_nearby_place:"附近地点", journey_kicker:"今日旅程", journey_stats:"{distance}km · 发现 {visits}处 · 照片 {photos}张 · 连续 {streak}天", journey_latest:"最近发现：{place}", journey_empty:"今天还没有发现。去周边寻找新的体验吧。", journey_log_stats:"移动 {distance}km · 地点 {visits}处 · 照片 {photos}张 · 停留 {stays}处", journey_log_places:"今日发现 · {places}", journey_log_wait:"等待今天的发现。",
    gpx_format: "GPX", gpx_export: "导出路线", gpx_time: "时间", gpx_recent: "最近", gpx_hour_short: "小时",
    gpx_recent_route: "最近{hours}小时的路线", gpx_name_placeholder: "路线名称（例：河边散步）",
    gpx_save: "保存此路线", gpx_saved: "打开已保存路线", gpx_import: "从文件导入", gpx_empty: "没有已保存的路线。", gpx_showing: "显示中", gpx_route: "路线", gpx_points: "个地点", gpx_delete: "删除"
});
Object.assign(UI_TEXT.ko, {
    map_layer_title: "지도 표시", map_layer_library: "도서관", map_layer_restaurant: "음식점",
    map_layer_lodging: "숙박", map_layer_restroom: "화장실", map_layer_parking: "주차장", map_layer_fishing:"낚시터", map_layer_camping:"캠핑장", map_layer_community: "주민회관",
    map_layer_durunubi:"공식 탐방로", map_layer_durunubi_source:"한국관광공사 · 한국등산·트레킹지원센터", map_layer_coming_soon: "준비중"
});
Object.assign(UI_TEXT.en, {
    map_layer_title: "Map Display", map_layer_library: "Library", map_layer_restaurant: "Restaurant",
    map_layer_lodging: "Lodging", map_layer_restroom: "Restroom", map_layer_parking: "Parking", map_layer_fishing:"Fishing spot", map_layer_camping:"Campsite", map_layer_community: "Community Center",
    map_layer_durunubi:"Official Trails", map_layer_durunubi_source:"Korea Tourism Organization · Korea Mountaineering Support Center", map_layer_coming_soon: "Coming soon"
});
Object.assign(UI_TEXT.ja, {
    map_layer_title: "地図表示", map_layer_library: "図書館", map_layer_restaurant: "飲食店",
    map_layer_lodging: "宿泊", map_layer_restroom: "トイレ", map_layer_parking: "駐車場", map_layer_fishing:"釣り場", map_layer_camping:"キャンプ場", map_layer_community: "住民センター",
    map_layer_durunubi:"公式トレイル", map_layer_durunubi_source:"韓国観光公社・韓国登山トレッキング支援センター", map_layer_coming_soon: "準備中"
});
Object.assign(UI_TEXT.zh, {
    map_layer_title: "地图显示", map_layer_library: "图书馆", map_layer_restaurant: "餐厅",
    map_layer_lodging: "住宿", map_layer_restroom: "卫生间", map_layer_parking: "停车场", map_layer_fishing:"钓鱼场", map_layer_camping:"露营地", map_layer_community: "社区中心",
    map_layer_durunubi:"官方步道", map_layer_durunubi_source:"韩国观光公社 · 韩国登山徒步支援中心", map_layer_coming_soon: "即将推出"
});
Object.assign(UI_TEXT.ko, {
    special_place: "특별한 장소", special_place_placeholder: "이 장소에 대한 내용을 입력하세요",
    save_pin: "저장", cancel_pin: "취소", empty_pin_note: "내용을 입력해 주세요.", pin_saved: "특별한 장소가 저장되었습니다."
});
Object.assign(UI_TEXT.en, {
    special_place: "Special Place", special_place_placeholder: "Write something about this place",
    save_pin: "Save", cancel_pin: "Cancel", empty_pin_note: "Please enter a note.", pin_saved: "Special place saved."
});
Object.assign(UI_TEXT.ja, {
    special_place: "特別な場所", special_place_placeholder: "この場所について入力してください",
    save_pin: "保存", cancel_pin: "キャンセル", empty_pin_note: "内容を入力してください。", pin_saved: "特別な場所を保存しました。"
});
Object.assign(UI_TEXT.zh, {
    special_place: "特别地点", special_place_placeholder: "请输入关于这个地点的内容",
    save_pin: "保存", cancel_pin: "取消", empty_pin_note: "请输入内容。", pin_saved: "特别地点已保存。"
});
Object.assign(UI_TEXT.ko, {
    help_tab_market: "주변 시세", help_tab_settings:"설정", help_language_title:"언어", focus_location:"현재 위치로 이동", photo_camera:"카메라로 촬영", photo_gallery:"내 기기 사진에서 선택", market_title: "이 지역의 주변 시세",
    market_description: "현재는 예시 가격을 보여주는 시범 기능입니다.",
    market_meal: "식사", market_cafe: "카페", market_necessities: "생필품", market_transport: "교통",
    market_source: "실제 지역별 공공데이터 연동은 추후 적용 예정입니다.",
    market_loading: "주변 시세를 불러오는 중입니다.", market_empty: "현재 지역의 시세 정보가 없습니다.",
    market_updated: "업데이트 날짜", market_current_area: "현재 지역"
});
Object.assign(UI_TEXT.en, {
    help_tab_market: "Local Prices", help_tab_settings:"Settings", help_language_title:"Language", focus_location:"Move to current location", photo_camera:"Take a photo", photo_gallery:"Choose from gallery", market_title: "Local Price Guide",
    market_description: "This shows typical prices in the current area for reference.",
    market_meal: "Meals", market_cafe: "Cafes", market_necessities: "Daily necessities", market_transport: "Transportation",
    market_source: "Reference prices based on public data.",
    market_loading: "Loading local price information.", market_empty: "Price information is not available for this area.",
    market_updated: "Updated", market_current_area: "Current area"
});
Object.assign(UI_TEXT.ja, {
    help_tab_market: "周辺相場", help_tab_settings:"設定", help_language_title:"言語", focus_location:"現在地へ移動", photo_camera:"カメラで撮影", photo_gallery:"アルバムから選択", market_title: "この地域の周辺相場",
    market_description: "現在の地域で一般的に形成されている価格を参考として表示します。",
    market_meal: "食事", market_cafe: "カフェ", market_necessities: "生活必需品", market_transport: "交通",
    market_source: "公共データに基づく参考価格です。",
    market_loading: "周辺相場を読み込んでいます。", market_empty: "現在の地域の相場情報はありません。",
    market_updated: "更新日", market_current_area: "現在の地域"
});
Object.assign(UI_TEXT.zh, {
    help_tab_market: "周边行情", help_tab_settings:"设置", help_language_title:"语言", focus_location:"移动到当前位置", photo_camera:"拍照", photo_gallery:"从相册选择", market_title: "当前地区的周边行情",
    market_description: "显示当前地区通常形成的价格，仅供参考。",
    market_meal: "餐饮", market_cafe: "咖啡", market_necessities: "生活必需品", market_transport: "交通",
    market_source: "基于公共数据的参考价格。",
    market_loading: "正在加载周边行情。", market_empty: "当前地区暂无行情信息。",
    market_updated: "更新日期", market_current_area: "当前地区"
});
Object.assign(UI_TEXT.es, {
    sidebar_title:"Mis registros", fog_label:"Efecto de niebla", fog_on:"Activado", fog_off:"Desactivado", tab_memory:"Recuerdos", tab_photo:"Fotos", tab_gpx:"Ruta", tab_badge:"Insignias", tab_visit:"Visitas", tab_item:"Objetos",
    rec_idle:"Detenido", rec_active:"Grabando", gps_weak:"GPS débil ({value}m)", gps_very_weak:"GPS muy débil ({value}m)", stay_bonus_wait:"Grabando: faltan {value} min para la bonificación por estancia", stay_bonus_done:"¡30 min de estancia! ¡Bonificación de nivel +1!",
    empty_memory:"Aún no hay recuerdos.", empty_photo:"Aún no hay fotos.", tour_title:"Lugares cercanos", tour_place_fallback:"Lugar turístico", festival_label:"Festivales cercanos", festival_badge:"Festivales", loading:"Buscando...", empty_tour:"No hay lugares cercanos",
    close:"Cerrar", more:"Ver más", next:"Siguiente", start:"Empezar", previous:"Atrás", count_suffix:"lugares", unit_count:"", hud_title_label:"Título actual", hud_level_label:"NV", hud_dist_label:"Distancia", hud_memory_label:"Recuerdos", hud_photo_label:"Fotos", hud_next:"Siguiente", hud_condition_met:"¡Cumplido!", hud_no_condition:"Sin condición", hud_max:"¡Máximo!", hud_max_level:"¡Nivel máximo!",
    help_tab_ask:"Contacto", help_tab_info:"Guía", help_tutorial_replay:"Repetir tutorial", help_ask_copy:"Cuéntanos tus problemas o sugerencias<br>mediante el chat abierto de KakaoTalk.", help_notice:"Los datos GPX guardados no se envían al servidor.<br>Todos los registros se guardan y muestran <b>solo en este dispositivo</b>.", help_link:"Chat abierto de KakaoTalk",
    help_record_title:"Botón Grabar", help_record_desc:"Toca para iniciar el registro de la ruta GPS y vuelve a tocar para detenerlo.", help_photo_title:"Botón Foto", help_photo_desc:"Importa fotos desde la galería.", help_memory_title:"Botón Recuerdo", help_memory_desc:"Pon nombre a tu ubicación y guárdala como recuerdo.", help_location_title:"Ubicación actual y lugares especiales", help_location_desc:"Toca el punto azul de tu ubicación para guardar un lugar especial con una nota.", help_status_title:"Botón Estado", help_status_desc:"Consulta tu título y progreso.", help_menu_title:"Botón Menú", help_menu_desc:"Consulta recuerdos, fotos y rutas.",
    hud_next_short:"Siguiente", daily_tag:"Tareas", daily_title:"Tareas de hoy", daily_close:"Cerrar tareas", daily_kicker:"HOY CON GILO", daily_copy:"Da un paseo tranquilo y deja la huella de hoy.", daily_reset:"Se reinicia cada día a medianoche", daily_completed:"completadas", daily_mission_walk:"Recorre {distance} por un camino nuevo", daily_mission_photo:"Guarda 1 foto", daily_mission_visit:"Visita {place}", daily_mission_photo_place:"Haz una foto en {place}", daily_nearby_place:"un lugar cercano",
    journey_kicker:"Viaje de hoy", journey_stats:"{distance}km · {visits} descubrimientos · {photos} fotos · racha de {streak} días", journey_latest:"Último descubrimiento: {place}", journey_empty:"Todavía no hay descubrimientos hoy. Busca una experiencia nueva a tu alrededor.", journey_log_stats:"Distancia {distance}km · {visits} lugares · {photos} fotos · {stays} estancias", journey_log_places:"Descubrimientos de hoy · {places}", journey_log_wait:"Esperando el primer descubrimiento de hoy.",
    gpx_format:"GPX", gpx_export:"Exportar ruta", gpx_time:"Tiempo", gpx_recent:"Reciente", gpx_hour_short:"h", gpx_recent_route:"Ruta de las últimas {hours} horas", gpx_name_placeholder:"Nombre de la ruta (p. ej., paseo junto al río)", gpx_save:"Guardar esta ruta", gpx_saved:"Abrir rutas guardadas", gpx_import:"Importar archivo", gpx_empty:"No hay rutas guardadas.", gpx_showing:"Visible", gpx_route:"Ruta", gpx_points:"puntos", gpx_delete:"Eliminar",
    map_layer_title:"Capas del mapa", map_layer_library:"Biblioteca", map_layer_restaurant:"Restaurante", map_layer_lodging:"Alojamiento", map_layer_restroom:"Baño", map_layer_parking:"Aparcamiento", map_layer_fishing:"Zona de pesca", map_layer_camping:"Camping", map_layer_community:"Centro comunitario", map_layer_coming_soon:"Próximamente", special_place:"Lugar especial", special_place_placeholder:"Escribe algo sobre este lugar", save_pin:"Guardar", cancel_pin:"Cancelar", empty_pin_note:"Escribe una nota.", pin_saved:"Lugar especial guardado.",
    help_tab_market:"Precios locales", help_tab_settings:"Ajustes", help_language_title:"Idioma", focus_location:"Ir a mi ubicación", photo_camera:"Hacer una foto", photo_gallery:"Elegir de la galería", market_title:"Guía de precios locales", market_description:"Muestra precios habituales de la zona como referencia.", market_meal:"Comidas", market_cafe:"Cafés", market_necessities:"Productos básicos", market_transport:"Transporte", market_source:"Precios de referencia basados en datos públicos.", market_loading:"Cargando precios locales.", market_empty:"No hay información de precios para esta zona.", market_updated:"Actualizado", market_current_area:"Zona actual"
});
UI_TEXT.fr = {
    sidebar_title:"Mes souvenirs", fog_label:"Effet de brume", fog_on:"Activé", fog_off:"Désactivé", tab_memory:"Souvenirs", tab_photo:"Photos", tab_gpx:"Parcours", tab_badge:"Badges", tab_visit:"Visites", tab_item:"Objets",
    rec_idle:"Arrêté", rec_active:"Enregistrement", gps_weak:"GPS faible ({value}m)", gps_very_weak:"GPS très faible ({value}m)", stay_bonus_wait:"Enregistrement — bonus d’arrêt dans {value} min", stay_bonus_done:"30 min sur place ! Bonus de niveau +1 !",
    empty_memory:"Aucun souvenir pour le moment.", empty_photo:"Aucune photo pour le moment.", tour_title:"Lieux à proximité", tour_place_fallback:"Lieu", festival_label:"Festivals à proximité", festival_badge:"Festivals", loading:"Recherche en cours…", empty_tour:"Aucun lieu à proximité",
    close:"Fermer", more:"Voir plus", next:"Suivant", start:"Commencer", previous:"Retour", count_suffix:"lieux", unit_count:"", hud_title_label:"Titre actuel", hud_level_label:"NV", hud_dist_label:"Distance", hud_memory_label:"Souvenirs", hud_photo_label:"Photos", hud_next:"Suivant", hud_condition_met:"Atteint !", hud_no_condition:"Aucune condition", hud_max:"Maximum !", hud_max_level:"Niveau maximum atteint !",
    help_tab_ask:"Contact", help_tab_info:"Guide", help_tutorial_replay:"Revoir le tutoriel", help_ask_copy:"Partagez vos problèmes ou suggestions<br>sur le chat ouvert KakaoTalk.", help_notice:"Les données GPX enregistrées ne sont pas envoyées au serveur.<br>Tous les souvenirs restent <b>sur cet appareil</b>.", help_link:"Chat ouvert KakaoTalk",
    help_record_title:"Bouton d’enregistrement", help_record_desc:"Touchez pour commencer l’enregistrement GPS, puis touchez à nouveau pour l’arrêter.", help_photo_title:"Bouton photo", help_photo_desc:"Importez des photos depuis votre galerie.", help_memory_title:"Bouton souvenir", help_memory_desc:"Nommez votre position actuelle et enregistrez-la comme souvenir.", help_location_title:"Position actuelle et lieux spéciaux", help_location_desc:"Touchez le point bleu de votre position sur la carte pour enregistrer un lieu spécial avec une note.", help_status_title:"Bouton de statut", help_status_desc:"Consultez votre titre et votre progression.", help_menu_title:"Bouton menu", help_menu_desc:"Consultez souvenirs, photos et parcours.",
    hud_next_short:"Suivant", daily_tag:"Tâches", daily_title:"Tâches du jour", daily_close:"Fermer les tâches", daily_kicker:"AUJOURD’HUI AVEC GILO", daily_copy:"Faites une petite marche et laissez la trace d’aujourd’hui.", daily_reset:"Réinitialisation chaque jour à minuit", daily_completed:"terminées", daily_mission_walk:"Parcourir {distance} sur un nouveau chemin", daily_mission_photo:"Enregistrer 1 photo", daily_mission_visit:"Visiter {place}", daily_mission_photo_place:"Prendre une photo à {place}", daily_nearby_place:"un lieu proche", badge_earned:"Badge obtenu !",
    journey_kicker:"Voyage du jour", journey_stats:"{distance}km · {visits} découvertes · {photos} photos · série de {streak} jours", journey_latest:"Dernière découverte : {place}", journey_empty:"Aucune découverte aujourd’hui. Cherchez une nouvelle expérience autour de vous.", journey_log_stats:"Distance {distance}km · {visits} lieux · {photos} photos · {stays} arrêts", journey_log_places:"Découvertes du jour · {places}", journey_log_wait:"En attente de la première découverte du jour.",
    gpx_format:"GPX", gpx_export:"Exporter le parcours", gpx_time:"Temps", gpx_recent:"Récent", gpx_hour_short:"h", gpx_recent_route:"Parcours des {hours} dernières heures", gpx_name_placeholder:"Nom du parcours (ex. promenade au bord de l’eau)", gpx_save:"Enregistrer ce parcours", gpx_saved:"Ouvrir les parcours enregistrés", gpx_import:"Importer un fichier", gpx_empty:"Aucun parcours enregistré.", gpx_showing:"Affiché", gpx_route:"Parcours", gpx_points:"points", gpx_delete:"Supprimer",
    map_layer_title:"Couches de carte", map_layer_library:"Bibliothèque", map_layer_restaurant:"Restaurant", map_layer_lodging:"Hébergement", map_layer_restroom:"Toilettes", map_layer_parking:"Parking", map_layer_fishing:"Site de pêche", map_layer_camping:"Camping", map_layer_community:"Centre communautaire", map_layer_coming_soon:"Bientôt", special_place:"Lieu spécial", special_place_placeholder:"Écrivez quelque chose sur ce lieu", save_pin:"Enregistrer", cancel_pin:"Annuler", empty_pin_note:"Écrivez une note.", pin_saved:"Lieu spécial enregistré.",
    help_tab_market:"Prix locaux", help_tab_settings:"Réglages", help_language_title:"Langue", focus_location:"Aller à ma position", photo_camera:"Prendre une photo", photo_gallery:"Choisir dans la galerie", market_title:"Guide des prix locaux", market_description:"Affiche des prix habituels dans cette zone à titre indicatif.", market_meal:"Repas", market_cafe:"Cafés", market_necessities:"Produits essentiels", market_transport:"Transport", market_source:"Prix de référence basés sur des données publiques.", market_loading:"Chargement des prix locaux.", market_empty:"Aucune information de prix pour cette zone.", market_updated:"Mis à jour", market_current_area:"Zone actuelle"
};
Object.assign(UI_TEXT.fr, { map_layer_durunubi:"Itinéraires officiels", map_layer_durunubi_source:"Office du tourisme de Corée · Centre coréen de randonnée" });
Object.assign(UI_TEXT.ko, { map_group_discovery:"볼거리", map_group_food:"먹고·쇼핑", map_group_convenience:"여행 편의", map_group_activity:"활동", map_group_mixed:"일부", map_group_on:"켜짐", map_group_off:"꺼짐" });
Object.assign(UI_TEXT.en, { map_group_discovery:"See & Discover", map_group_food:"Eat & Shop", map_group_convenience:"Travel Essentials", map_group_activity:"Activities", map_group_mixed:"Some", map_group_on:"On", map_group_off:"Off" });
Object.assign(UI_TEXT.ja, { map_group_discovery:"見どころ", map_group_food:"食事・ショッピング", map_group_convenience:"旅行の便利情報", map_group_activity:"アクティビティ", map_group_mixed:"一部", map_group_on:"オン", map_group_off:"オフ" });
Object.assign(UI_TEXT.zh, { map_group_discovery:"景点", map_group_food:"餐饮与购物", map_group_convenience:"旅行便利", map_group_activity:"活动", map_group_mixed:"部分", map_group_on:"开启", map_group_off:"关闭" });
Object.assign(UI_TEXT.es, { map_group_discovery:"Lugares para descubrir", map_group_food:"Comer y comprar", map_group_convenience:"Servicios para viajeros", map_group_activity:"Actividades", map_group_mixed:"Parcial", map_group_on:"Activado", map_group_off:"Desactivado" });
Object.assign(UI_TEXT.fr, { map_group_discovery:"À découvrir", map_group_food:"Manger et shopping", map_group_convenience:"Services pratiques", map_group_activity:"Activités", map_group_mixed:"Partiel", map_group_on:"Activé", map_group_off:"Désactivé" });
Object.assign(UI_TEXT.ko, { map_layer_tourism:"여행지" });
Object.assign(UI_TEXT.en, { map_layer_tourism:"Destinations" });
Object.assign(UI_TEXT.ja, { map_layer_tourism:"観光スポット" });
Object.assign(UI_TEXT.zh, { map_layer_tourism:"旅游景点" });
Object.assign(UI_TEXT.es, { map_layer_tourism:"Destinos" });
Object.assign(UI_TEXT.fr, { map_layer_tourism:"Destinations" });
Object.assign(UI_TEXT.ko, { journey_delete_save_failed:"삭제를 저장하지 못했습니다. 원본은 유지됩니다. 저장 공간을 확인한 뒤 다시 시도해 주세요." });
Object.assign(UI_TEXT.en, { journey_delete_save_failed:"The deletion could not be saved. The original is kept. Check available storage and try again." });
Object.assign(UI_TEXT.ja, { journey_delete_save_failed:"削除を保存できませんでした。元のデータは保持されます。空き容量を確認して再試行してください。" });
Object.assign(UI_TEXT.zh, { journey_delete_save_failed:"无法保存删除操作。原始数据已保留。请检查存储空间后重试。" });
Object.assign(UI_TEXT.es, { journey_delete_save_failed:"No se pudo guardar la eliminación. Se conserva el original. Comprueba el espacio disponible e inténtalo de nuevo." });
Object.assign(UI_TEXT.fr, { journey_delete_save_failed:"La suppression n’a pas pu être enregistrée. L’original est conservé. Vérifiez l’espace disponible et réessayez." });
Object.assign(UI_TEXT.ko, { help_tutorial_replay:"길로 부르기" });
Object.assign(UI_TEXT.en, { help_tutorial_replay:"Call Gilo" });
Object.assign(UI_TEXT.ja, { help_tutorial_replay:"ギロを呼ぶ" });
Object.assign(UI_TEXT.zh, { help_tutorial_replay:"呼叫Gilo" });
Object.assign(UI_TEXT.es, { help_tutorial_replay:"Llamar a Gilo" });
Object.assign(UI_TEXT.fr, { help_tutorial_replay:"Appeler Gilo" });
Object.assign(UI_TEXT.ko, { help_story_replay:"길로아 이야기 다시 보기" });
Object.assign(UI_TEXT.en, { help_story_replay:"Replay the GILOA Story" });
Object.assign(UI_TEXT.ja, { help_story_replay:"GILOAの物語をもう一度見る" });
Object.assign(UI_TEXT.zh, { help_story_replay:"重温 GILOA 的故事" });
Object.assign(UI_TEXT.es, { help_story_replay:"Volver a ver la historia de GILOA" });
Object.assign(UI_TEXT.fr, { help_story_replay:"Revoir l’histoire de GILOA" });
Object.assign(UI_TEXT.ko, { help_ask_copy:"불편한 점이나 건의사항은<br>편한 문의 방법을 선택해 알려주세요.", help_link:"카카오톡 1:1 문의", help_google_link:"Google 문의 양식 / Global Contact Form" });
Object.assign(UI_TEXT.en, { help_ask_copy:"Choose any convenient contact method<br>to send questions or feedback.", help_link:"KakaoTalk 1:1 Chat", help_google_link:"Google Contact Form" });
Object.assign(UI_TEXT.ja, { help_ask_copy:"ご都合のよいお問い合わせ方法を選び、<br>ご質問やご意見をお送りください。", help_link:"KakaoTalk 1対1チャット", help_google_link:"Googleお問い合わせフォーム" });
Object.assign(UI_TEXT.zh, { help_ask_copy:"请选择方便的联系方式，<br>向我们发送问题或建议。", help_link:"KakaoTalk一对一咨询", help_google_link:"Google咨询表单" });
Object.assign(UI_TEXT.es, { help_ask_copy:"Elige el medio de contacto que prefieras<br>para enviar preguntas o comentarios.", help_link:"Chat 1 a 1 de KakaoTalk", help_google_link:"Formulario de Google" });
Object.assign(UI_TEXT.fr, { help_ask_copy:"Choisissez le moyen de contact qui vous convient<br>pour envoyer vos questions ou suggestions.", help_link:"Discussion KakaoTalk individuelle", help_google_link:"Formulaire Google" });
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function setHtml(id, value) { var el = document.getElementById(id); if (el) el.innerHTML = value; }
function formatUiTemplate(template, values) { return String(template || "").replace(/\{(\w+)\}/g, function(_, key) { return values && values[key] !== undefined ? values[key] : ""; }); }
function applyHelpLang(t) {
    setText("htab-ask", t.help_tab_ask);
    setText("htab-info", t.help_tab_info);
    setText("htab-market", t.help_tab_market);
    setText("htab-settings", t.help_language_title);
    setText("help-tutorial-replay", t.help_tutorial_replay);
    setText("help-story-replay", t.help_story_replay);
    setHtml("help-ask-copy", t.help_ask_copy);
    setHtml("help-notice", t.help_notice);
    setText("help-link", t.help_link);
    setText("help-link-google", t.help_google_link);
    document.querySelectorAll("[data-settings-lang]").forEach(function(button) {
        var active = normalizeLang(button.dataset.settingsLang) === currentLang;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var titles = [t.help_record_title, t.help_photo_title, t.help_location_title, t.help_status_title, t.help_menu_title];
    var descs = [t.help_record_desc, t.help_photo_desc, t.help_location_desc, t.help_status_desc, t.help_menu_desc];
    document.querySelectorAll(".help-guide-text").forEach(function(box, idx) {
        var title = box.querySelector("b"); var desc = box.querySelector("span");
        if (title && titles[idx]) title.textContent = titles[idx];
        if (desc && descs[idx]) desc.textContent = descs[idx];
    });
    updateLocalMarketPriceLanguage();
}
function applyHudLang(t) {
    setText("hud-title-label", t.hud_title_label);
    setText("hud-level-label", t.hud_level_label);
    var labels = document.querySelectorAll(".hud-prog-label");
    if (labels[0]) labels[0].textContent = t.hud_dist_label;
    if (labels[1]) labels[1].textContent = t.hud_memory_label;
    if (labels[2]) labels[2].textContent = t.hud_photo_label;
    updateHud();
}
function applyUILang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    document.documentElement.lang = lang;
    var t = UI_TEXT[lang] || UI_TEXT["ko"];
    initMapLayerGroups();
    syncMapLayerGroupUI();
    var el = function(id) { return document.getElementById(id); };
    if (el("sidebar-title")) el("sidebar-title").textContent = t.sidebar_title;
    if (el("fog-toggle-label-el")) el("fog-toggle-label-el").textContent = t.fog_label;
    if (el("fog-toggle-state")) el("fog-toggle-state").textContent = isFogEnabled ? t.fog_on : t.fog_off;
    var tabMemory = document.querySelector("#tab-memory .sidebar-tab-text");
    var tabPhoto = document.querySelector("#tab-photo .sidebar-tab-text");
    var tabGpx = document.querySelector("#tab-gpx .sidebar-tab-text");
    var tabBadge = document.querySelector("#tab-badge .sidebar-tab-text");
    var tabVisit = document.querySelector("#tab-visit .sidebar-tab-text");
    var tabItem = document.querySelector("#tab-item .sidebar-tab-text");
    if (tabMemory) tabMemory.textContent = t.tab_memory;
    if (tabPhoto) tabPhoto.textContent = t.tab_photo;
    if (tabGpx) tabGpx.textContent = t.tab_gpx;
    if (tabBadge) tabBadge.textContent = t.tab_badge;
    if (tabVisit) tabVisit.textContent = t.tab_visit;
    if (tabItem) tabItem.textContent = t.tab_item;
    setText("daily-task-tag-label", t.daily_tag);
    setText("daily-task-title", t.daily_title);
    setText("daily-task-kicker", t.daily_kicker);
    setText("daily-task-copy", t.daily_copy);
    setText("daily-task-reset", t.daily_reset);
    var dailyClose = el("daily-task-panel") && el("daily-task-panel").querySelector(".daily-task-close");
    if (dailyClose) dailyClose.setAttribute("aria-label", t.daily_close);
    setText("gpx-tab-icon", t.gpx_format);
    setText("gpx-export-label", t.gpx_export);
    setText("gpx-time-label", t.gpx_time);
    setText("gpx-recent-label", t.gpx_recent);
    setText("gpx-save-btn", t.gpx_save);
    setText("gpx-saved-label", t.gpx_saved);
    setText("gpx-import-btn", t.gpx_import);
    if (el("gpx-export-name")) el("gpx-export-name").placeholder = t.gpx_name_placeholder;
    updateDialUI();
    updateGpxSavedList();
    if (el("tour-title")) el("tour-title").textContent = t.tour_title;
    if (el("festival-strip-label")) el("festival-strip-label").textContent = t.festival_label;
    if (el("tour-loading")) el("tour-loading").textContent = t.loading;
    if (el("tour-empty")) el("tour-empty").textContent = t.empty_tour;
    if (el("tour-close-btn")) el("tour-close-btn").setAttribute("aria-label", t.close);
    if (el("map-layer-title")) el("map-layer-title").textContent = t.map_layer_title;
    if (el("map-layer-name-tourism")) el("map-layer-name-tourism").textContent = t.map_layer_tourism;
    if (el("map-layer-name-library")) el("map-layer-name-library").textContent = t.map_layer_library;
    if (el("map-layer-name-restaurant")) el("map-layer-name-restaurant").textContent = t.map_layer_restaurant;
    if (el("map-layer-name-lodging")) el("map-layer-name-lodging").textContent = t.map_layer_lodging;
    if (el("map-layer-name-restroom")) el("map-layer-name-restroom").textContent = t.map_layer_restroom;
    if (el("map-layer-name-parking")) el("map-layer-name-parking").textContent = t.map_layer_parking;
    if (el("map-layer-name-fishing")) el("map-layer-name-fishing").textContent = t.map_layer_fishing;
    if (el("map-layer-name-camping")) el("map-layer-name-camping").textContent = t.map_layer_camping;
    if (el("map-layer-name-durunubi")) el("map-layer-name-durunubi").textContent = t.map_layer_durunubi;
    if (el("map-layer-source-durunubi")) el("map-layer-source-durunubi").textContent = t.map_layer_durunubi_source;
    if (el("map-layer-name-community")) el("map-layer-name-community").textContent = t.map_layer_community;
    if (el("map-layer-coming-soon")) el("map-layer-coming-soon").textContent = t.map_layer_coming_soon;
    setText("photo-camera-label", t.photo_camera);
    setText("photo-gallery-label", t.photo_gallery);
    var recordingControl = el("rec-btn");
    if (recordingControl) {
        var recordingLabel = (t.focus_location || "") + " · " + (isRecording ? t.rec_active : t.rec_idle);
        recordingControl.title = recordingLabel;
        recordingControl.setAttribute("aria-label", recordingLabel);
    }
    var photoControl = el("photo-btn");
    if (photoControl) {
        photoControl.title = t.tab_photo;
        photoControl.setAttribute("aria-label", t.tab_photo);
    }
    syncFogButton();
    syncRecordingUI();
    syncLanguageButtons(lang);
    updatePhotoList();
    refreshPhotoMarkersForLanguage();
    syncPhotoLocationDialogText();
    applyInfoLinkLanguage(lang);
    applyHelpLang(t);
    applyHudLang(t);
    applySpecialPlaceLang();
    var adminRegionLabel = document.getElementById("admin-region-label");
    if (adminRegionLabel && activeAdminDistrictName) {
        var municipalityName = getMunicipalityName(activeAdminDistrictName) || activeAdminDistrictName;
        adminRegionLabel.dataset.municipality = municipalityName;
        adminRegionLabel.textContent = (ADMIN_REGION_TEXT[lang] || ADMIN_REGION_TEXT.ko) + " · " + municipalityName;
        adminRegionLabel.setAttribute("aria-label", adminRegionLabel.textContent);
    }
    renderTourCards();
    renderFestivalStrip();
    translateTourItemsForLang(lang, tourItems);
    translateTourItemsForLang(lang, festivalItems);
    if (mapLayerSettings.library) {
        translateLibraryItemsForLang(lang);
        refreshLibraryMarkerLabels(lang);
    } else {
        clearLibraryMarkers();
    }
    if (mapLayerSettings.restroom) renderRestroomMarkers();
    if (mapLayerSettings.parking) renderParkingMarkers(Object.keys(parkingTileCache));
    if (mapLayerSettings.fishing) renderFishingMarkers();
    if (mapLayerSettings.camping) renderCampingMarkers();
    if (mapLayerSettings.durunubi && durunubiVisibleBundle) renderNearbyDurunubiRoutes();
    updateDailyMissions();
    refreshGiloDialogueLanguage();
    if (typeof applySupplementalStaticLanguage === "function") applySupplementalStaticLanguage();
    if (typeof refreshEarlyLanguageUI === "function") refreshEarlyLanguageUI();
    if (typeof refreshCollectionLanguageUI === "function") refreshCollectionLanguageUI();
    if (typeof ONBOARDING_I18N !== "undefined" && ONBOARDING_I18N) renderGiloaOnboarding();
    if (typeof introStoryState !== "undefined" && introStoryState && introStoryState.active && introStoryState.mode === "story") renderIntroStory();
    refreshPublicPlacePopupLanguage();
}

function toggleLang(lang) {
    lang = normalizeLang(lang);
    currentLang = lang;
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang);
    updateGiloLoadingMessage(giloLoadingMessageKey);
    syncLanguageButtons(lang);
    applyUILang(lang);
    applyAutoRecordingNoticeLang();
    var tutorialWrap = document.getElementById("giloa-tutorial");
    if (tutorialWrap && tutorialWrap.classList.contains("show")) {
        tutorialStepIndex = Math.min(tutorialStepIndex, getTutorialSteps().length - 1);
        renderTutorialStep();
    }
    refreshLibraryMarkerLabels(lang);
    hydrateTourItemsFromCache(lang, true);
    // Existing French cache entries from before the translation-source fix may
    // be labelled as French while their titles are English. Re-run translation
    // immediately; the network refresh below will then replace them safely.
    if (lang === "fr") {
        translateTourItemsForLang("fr", tourItems);
        translateTourItemsForLang("fr", festivalItems);
    }
    refreshTourData({ force:true, forceHydrate:true });
    setTimeout(function() { refreshLibraryMarkerLabels(lang); }, 50);
}

function syncLanguageButtons(lang) {
    lang = normalizeLang(lang);
    document.querySelectorAll(".lang-btn").forEach(function(btn) {
        btn.classList.toggle("active", normalizeLang(btn.dataset.lang) === lang);
        btn.setAttribute("aria-pressed", normalizeLang(btn.dataset.lang) === lang ? "true" : "false");
    });
}

function markTourItemsSource(items, sourceLang) {
    (items || []).forEach(function(item) {
        var detected = hasHangul((item && item.title) || "") || hasHangul((item && item.addr1) || "") ? "ko" : sourceLang;
        item._sourceLang = normalizeLang(detected || currentLang);
    });
}

function hasHangul(text) {
    return /[\uAC00-\uD7A3]/.test(String(text || ""));
}

function isBrokenDisplayText(text) {
    var value = String(text || "").trim();
    if (!value) return true;
    if (/[占�]/.test(value)) return true;
    if (/\?{2,}/.test(value)) return true;
    if ((value.match(/\?/g) || []).length >= 2) return true;
    if (/[湲濡쒖댁媛諛遺嫄吏占쎈]/.test(value)) return true;
    return false;
}

function cleanTourText(text, fallback) {
    var value = String(text || "").replace(/<[^>]*>/g, "").trim();
    return isBrokenDisplayText(value) ? fallback : value;
}

function translateTourItemsForLang(lang, items) {
    lang = normalizeLang(lang);
    items = items || tourItems;
    var targetLang = getVarcoLang(lang);
    var tasks = [];
    function scheduleTranslatedRender() {
        if (lang !== currentLang) return;
        if (tourTranslationRenderTimer !== null) return;
        tourTranslationRenderTimer = setTimeout(function() {
            tourTranslationRenderTimer = null;
            renderTourCards();
            addTourMarkers();
            if (tourPanelOpen) renderFestivalStrip();
        }, 80);
    }
    items.forEach(function(item) {
        if (!item) return;
        item._titleByLang = item._titleByLang || {};
        item._addrByLang = item._addrByLang || {};
        var sourceLang = normalizeLang(item._sourceLang || (hasHangul(item.title || item.addr1) ? "ko" : "en"));
        // A stale cache from the first French implementation could have been
        // marked as fr even though it contains TourAPI English text. Treat it
        // as English so it is translated rather than shown unchanged.
        if (lang === "fr" && sourceLang === "fr") sourceLang = "en";
        if (sourceLang === lang) return;
        if (item.title && !item._titleByLang[lang]) {
            tasks.push(varcoTranslate(item.title, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._titleByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
        if (item.addr1 && !item._addrByLang[lang]) {
            tasks.push(varcoTranslate(item.addr1, getVarcoLang(sourceLang), targetLang).then(function(translated) { item._addrByLang[lang] = translated; scheduleTranslatedRender(); }));
        }
    });
    if (tasks.length === 0) return Promise.resolve();
    return Promise.all(tasks).then(function() { renderTourCards(); addTourMarkers(); if (tourPanelOpen) renderFestivalStrip(); });
}

function getTourDisplayTitle(item) {
    var fallback = (UI_TEXT[currentLang] || UI_TEXT.ko).tour_place_fallback || getTourTypeName(item && item.contenttypeid);
    return cleanTourText((item && item._titleByLang && item._titleByLang[currentLang]) || (item && item.title), fallback);
}
function getTourDisplayAddr(item) {
    return cleanTourText((item && item._addrByLang && item._addrByLang[currentLang]) || (item && item.addr1), "");
}

// Collection items
var COLLECTION_KEY = "giloa-collection";
var badges = []; var visitStamps = []; var items = [];
var TESTER_SPROUT_ITEM_ID = "tester_sprout_2026";
var TESTER_SPROUT_IMAGE = "./assets/items/giloa-tester-sprout.png";
var TESTER_ELIGIBILITY_KEY = "giloa-prelaunch-tester-2026-v1";

var COLLECTION_UI_I18N = {
    ko: {
        regional_badges:"지역 뱃지", regional_hint:"전국 지도에서 지역별 뱃지를 확인하세요", empty_items:"아직 획득한 아이템이 없습니다.", empty_visits:"아직 방문한 장소가 없습니다.", item:"아이템", place:"장소", nearby_place:"주변 장소", visited_place:"방문 장소", new_place:"새로운 장소", new_region:"새로운 지역",
        visit_recorded:"{place} 방문을 기록했습니다.", gift_arrived:"선물 도착! 길로아의 새싹을 지켜봐줘서 고마워요 🌱", sprout_name:"길로아의 새싹", sprout_description:"출시 전부터 길로아의 새싹을 지켜봐 준 테스터에게 드리는 한정 증표예요.", discovery:"새로운 장소 발견", photo_complete:"사진으로 방문 완료", stay_complete:"체류로 방문 완료", experience_reward:"경험 +3", travel_stamp:"여행 스탬프 획득", boundary_loading:"불러오는 중...", boundary_reload:"행정경계 다시 불러오기",
        recap_exploration:"오늘도 새로운 길을 열어 나만의 지도를 넓혔어.", recap_experience:"오늘 만난 장소들이 특별한 여행 경험이 되었어.", recap_memory:"오늘 남긴 사진과 기억이 오래 빛날 거야.", recap_connection:"오늘 사람과 지역을 잇는 새로운 연결을 만들었어.", recap_growth:"오늘의 도전이 다음 모험을 위한 힘이 되었어.",
        badge_encounter:"{city}에서의 시간이 새로운 만남이 되었어. {name}를 얻었어!", badge_view:"아이템의 지역 뱃지 지도에서 방금 얻은 {name}를 확인해 봐."
    },
    en: {
        regional_badges:"Regional badges", regional_hint:"Explore regional badges on the nationwide map", empty_items:"No items earned yet.", empty_visits:"No places visited yet.", item:"Item", place:"Place", nearby_place:"Nearby place", visited_place:"Visited place", new_place:"New place", new_region:"a new region",
        visit_recorded:"Visit to {place} recorded.", gift_arrived:"A gift has arrived! Thank you for watching Giloa grow 🌱", sprout_name:"Giloa's Sprout", sprout_description:"A limited token for testers who supported Giloa before launch.", discovery:"New place discovered", photo_complete:"Visit completed with a photo", stay_complete:"Visit completed by staying", experience_reward:"Experience +3", travel_stamp:"Travel stamp earned", boundary_loading:"Loading...", boundary_reload:"Reload administrative boundaries",
        recap_exploration:"You opened new paths and expanded your own map today.", recap_experience:"Today's places became special travel experiences.", recap_memory:"Today's photos and memories will shine for a long time.", recap_connection:"You made new connections with people and places today.", recap_growth:"Today's challenges gave you strength for your next adventure.",
        badge_encounter:"Your time in {city} became a new encounter. You earned {name}!", badge_view:"Open Items → Regional Badge Atlas to see your new {name}."
    },
    ja: {
        regional_badges:"地域バッジ", regional_hint:"全国地図で地域ごとのバッジを確認できます", empty_items:"まだ獲得したアイテムはありません。", empty_visits:"まだ訪れた場所はありません。", item:"アイテム", place:"場所", nearby_place:"近くの場所", visited_place:"訪れた場所", new_place:"新しい場所", new_region:"新しい地域",
        visit_recorded:"{place}への訪問を記録しました。", gift_arrived:"プレゼントが届いたよ！ギロアの成長を見守ってくれてありがとう 🌱", sprout_name:"ギロアの若芽", sprout_description:"リリース前からギロアを見守ってくれたテスターへの限定の証です。", discovery:"新しい場所を発見", photo_complete:"写真で訪問完了", stay_complete:"滞在で訪問完了", experience_reward:"経験 +3", travel_stamp:"旅のスタンプを獲得", boundary_loading:"読み込み中...", boundary_reload:"行政区域の境界を再読み込み",
        recap_exploration:"今日も新しい道を開き、自分だけの地図が広がったね。", recap_experience:"今日訪れた場所が、特別な旅の経験になったね。", recap_memory:"今日の写真と思い出は、いつまでも輝くよ。", recap_connection:"今日は人と地域をつなぐ、新しい出会いがあったね。", recap_growth:"今日の挑戦が、次の冒険への力になったね。",
        badge_encounter:"{city}で過ごした時間が新しい出会いになったよ。{name}を獲得したよ！", badge_view:"アイテムの地域バッジ地図で、獲得した{name}を確認してみて。"
    },
    zh: {
        regional_badges:"地区徽章", regional_hint:"在全国地图上查看各地区徽章", empty_items:"还没有获得物品。", empty_visits:"还没有访问过的地点。", item:"物品", place:"地点", nearby_place:"附近地点", visited_place:"已访问地点", new_place:"新地点", new_region:"新地区",
        visit_recorded:"已记录对{place}的访问。", gift_arrived:"礼物到了！感谢你一直守护Giloa的成长 🌱", sprout_name:"Giloa的嫩芽", sprout_description:"送给在正式发布前就支持Giloa的测试者的限定纪念品。", discovery:"发现新地点", photo_complete:"通过照片完成访问", stay_complete:"通过停留完成访问", experience_reward:"体验 +3", travel_stamp:"获得旅行印章", boundary_loading:"正在加载...", boundary_reload:"重新加载行政区边界",
        recap_exploration:"今天又开辟了新的道路，让自己的地图更广阔了。", recap_experience:"今天到访的地点成为了特别的旅行体验。", recap_memory:"今天留下的照片与回忆，会长久闪耀。", recap_connection:"今天与人们和地区建立了新的联系。", recap_growth:"今天的挑战，为下一次冒险积蓄了力量。",
        badge_encounter:"你在{city}度过的时光带来了新的相遇。获得了{name}！", badge_view:"请在“物品”的地区徽章地图中查看刚获得的{name}。"
    },
    es: {
        regional_badges:"Insignias regionales", regional_hint:"Consulta las insignias regionales en el mapa nacional", empty_items:"Todavía no has conseguido objetos.", empty_visits:"Todavía no has visitado ningún lugar.", item:"Objeto", place:"Lugar", nearby_place:"Lugar cercano", visited_place:"Lugar visitado", new_place:"Nuevo lugar", new_region:"una nueva región",
        visit_recorded:"Visita a {place} registrada.", gift_arrived:"¡Ha llegado un regalo! Gracias por acompañar el crecimiento de Giloa 🌱", sprout_name:"El brote de Giloa", sprout_description:"Un recuerdo exclusivo para quienes probaron y apoyaron Giloa antes de su lanzamiento.", discovery:"Nuevo lugar descubierto", photo_complete:"Visita completada con una foto", stay_complete:"Visita completada por estancia", experience_reward:"Experiencia +3", travel_stamp:"Sello de viaje conseguido", boundary_loading:"Cargando...", boundary_reload:"Recargar límites administrativos",
        recap_exploration:"Hoy abriste nuevos caminos y ampliaste tu propio mapa.", recap_experience:"Los lugares de hoy se convirtieron en experiencias de viaje especiales.", recap_memory:"Las fotos y los recuerdos de hoy brillarán durante mucho tiempo.", recap_connection:"Hoy creaste nuevos vínculos con personas y lugares.", recap_growth:"Los retos de hoy te dieron fuerzas para tu próxima aventura.",
        badge_encounter:"Tu tiempo en {city} se convirtió en un nuevo encuentro. ¡Conseguiste {name}!", badge_view:"Mira tu nuevo {name} en Objetos → Atlas de insignias regionales."
    },
    fr: {
        regional_badges:"Badges régionaux", regional_hint:"Consultez les badges régionaux sur la carte nationale", empty_items:"Aucun objet obtenu pour le moment.", empty_visits:"Aucun lieu visité pour le moment.", item:"Objet", place:"Lieu", nearby_place:"Lieu à proximité", visited_place:"Lieu visité", new_place:"Nouveau lieu", new_region:"une nouvelle région",
        visit_recorded:"Visite de {place} enregistrée.", gift_arrived:"Un cadeau est arrivé ! Merci d'avoir accompagné la croissance de Giloa 🌱", sprout_name:"La pousse de Giloa", sprout_description:"Un souvenir exclusif pour les testeurs qui ont soutenu Giloa avant son lancement.", discovery:"Nouveau lieu découvert", photo_complete:"Visite validée avec une photo", stay_complete:"Visite validée par un séjour", experience_reward:"Expérience +3", travel_stamp:"Tampon de voyage obtenu", boundary_loading:"Chargement...", boundary_reload:"Recharger les limites administratives",
        recap_exploration:"Vous avez ouvert de nouveaux chemins et agrandi votre carte aujourd'hui.", recap_experience:"Les lieux d'aujourd'hui sont devenus des expériences de voyage uniques.", recap_memory:"Les photos et souvenirs d'aujourd'hui brilleront longtemps.", recap_connection:"Vous avez créé de nouveaux liens avec les personnes et les lieux aujourd'hui.", recap_growth:"Les défis d'aujourd'hui vous ont donné des forces pour votre prochaine aventure.",
        badge_encounter:"Le temps passé à {city} est devenu une nouvelle rencontre. Vous avez obtenu {name} !", badge_view:"Retrouvez {name} dans Objets → Atlas des badges régionaux."
    }
};
function collectionUiText(key, values, language) {
    var text = COLLECTION_UI_I18N[normalizeLang(language || currentLang)] || COLLECTION_UI_I18N.en;
    return formatUiTemplate(text[key] || COLLECTION_UI_I18N.en[key] || "", values || {});
}
function formatCollectionDate(timestamp, fallback) {
    var date = timestamp !== undefined && timestamp !== null && timestamp !== "" ? new Date(Number(timestamp)) : null;
    if (!date || isNaN(date.getTime())) {
        var parts = String(fallback || "").match(/^(\d{4})\s*(?:년|\.)\s*(\d{1,2})\s*(?:월|\.)\s*(\d{1,2})\s*(?:일|\.)?\s*$/);
        if (parts) date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    }
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString(normalizeLang(currentLang)) : String(fallback || "");
}
function getCollectionItemText(savedItem) {
    // Resolve built-in labels only at display time; keep all saved records intact.
    if (savedItem.id === TESTER_SPROUT_ITEM_ID) return { name:collectionUiText("sprout_name"), description:collectionUiText("sprout_description") };
    var name = savedItem.name || savedItem.title || collectionUiText("item");
    return { name:name, description:savedItem.description || name };
}
function getVisitTypeLabel(visit) {
    var savedType = String(visit.type || "");
    var typeId = String(visit.contenttypeid || visit.contentTypeId || "");
    Object.keys(TOUR_TYPE_NAMES).some(function(lang) {
        return Object.keys(TOUR_TYPE_NAMES[lang]).some(function(id) {
            if (savedType !== TOUR_TYPE_NAMES[lang][id] && savedType !== id) return false;
            typeId = id;
            return true;
        });
    });
    return typeId ? getTourTypeLabel(typeId) : collectionUiText("place");
}
function getVisitDisplayName(visit) {
    var id = visit.visitKey ? String(visit.visitKey).replace(/:\d{4}-\d{2}-\d{2}$/, "") : "";
    var source = id ? (tourItems || []).concat(festivalItems || []).find(function(item) { return getTourItemId(item) === id; }) : null;
    return source ? getTourDisplayTitle(source) : (visit.name ? getRegionBadgeCityLabelFromName(visit.name, getRegionBadgeAtlasText()) : collectionUiText("visited_place"));
}
var activeDiscoveryRewardOptions = null;

function getCollectionImage(fileName) {
    return encodeURI("./gilo many appearance/" + fileName);
}
function getProvinceAsset(path) { return encodeURI("./assets/province/" + path); }
var DEFAULT_COLLECTION_IMAGE = getCollectionImage("gilo-tutorial-thumbs-transparent.png");

var BADGE_DEFS = [
    { id: "first_memory", icon: "M", image: getCollectionImage("gilo-tutorial-heartfelt-transparent.png"), imagePosition: "center 34%", name: "First Memory", desc: "Saved your first memory." },
    { id: "first_photo", icon: "P", image: getCollectionImage("giloa-tutorial-photo-nature.png"), imagePosition: "center 48%", name: "First Photo", desc: "Saved your first photo." },
    { id: "first_10km", icon: "10", image: getCollectionImage("gilo-tutorial-thumbs-transparent.png"), imagePosition: "center 35%", name: "10km", desc: "Walked 10km in total." },
    { id: "first_50km", icon: "50", image: getCollectionImage("gilo-tutorial-stars-transparent.png"), imagePosition: "center 38%", name: "50km", desc: "Walked 50km in total." },
    { id: "early_bird", icon: "AM", image: getCollectionImage("gilo-tutorial-curious-transparent.png"), imagePosition: "center 28%", name: "Early Bird", desc: "Recorded before 5 AM." },
    { id: "memory_5", icon: "M5", image: getCollectionImage("gilo-emotions-transparent/14-love-transparent.png"), imagePosition: "center 38%", name: "Memory Collector", desc: "Saved 5 memories." },
    { id: "photo_10", icon: "P10", image: getCollectionImage("gilo-tutorial-welcome-transparent.png"), imagePosition: "center 36%", name: "Photo Collector", desc: "Saved 10 photos." },
    { id: "tour_visit", icon: "T", image: getCollectionImage("ChatGPT Image Aug 3, 2026, 09_16_54 AM.png"), imagePosition: "center 50%", name: "Explorer", desc: "Visited a place." },
    { id: "festival_visit", icon: "F", image: getCollectionImage("gilo-actions-transparent/04-dancing-transparent.png"), imagePosition: "center 35%", name: "Festival Visitor", desc: "Visited a festival." },
    { id: "image_hyundai_fountain", icon: makeImageBadgeIcon("fountain"), name: "Fountain Friend", desc: "Recognized the fountain." },
    { id: "image_heendy", icon: makeImageBadgeIcon("heendy"), name: "Heendy Friend", desc: "Recognized Heendy." },
    { id: "image_dasan_street", icon: makeImageBadgeIcon("street"), name: "Street Explorer", desc: "Recognized Dasan Street." },
    { id: "region_gimpo_1h", icon: "GP", image: getProvinceAsset("김포시 - 포미, 포수/01_png/기본형01.png"), imageFit:"contain", imagePosition:"center", name:"김포 포미·포수", desc:"김포시에서 확인된 GPS로 1시간 머물렀어요." },
    { id: "region_goyang_1h", icon: "GY", image: getProvinceAsset("고양시 - 고양고양이/고양시 - 고양고양이.png"), imageFit:"contain", imagePosition:"center", name:"고양고양이", desc:"고양시에서 확인된 GPS로 1시간 머물렀어요." },
];

var BADGE_TEXT_I18N = {
    ko: {
        first_memory:{name:"첫 기억",desc:"첫 번째 기억을 저장했어요."},
        first_photo:{name:"첫 사진",desc:"첫 번째 사진을 저장했어요."},
        first_10km:{name:"10km",desc:"총 10km를 걸었어요."},
        first_50km:{name:"50km",desc:"총 50km를 걸었어요."},
        early_bird:{name:"얼리버드",desc:"오전 5시 전에 기록했어요."},
        memory_5:{name:"기억 수집가",desc:"기억 5개를 저장했어요."},
        photo_10:{name:"사진 수집가",desc:"사진 10장을 저장했어요."},
        tour_visit:{name:"탐험가",desc:"새로운 장소를 방문했어요."},
        festival_visit:{name:"축제 방문자",desc:"축제를 방문했어요."},
        image_hyundai_fountain:{name:"분수 친구",desc:"분수를 인식했어요."},
        image_heendy:{name:"흰디 친구",desc:"흰디를 인식했어요."},
        image_hanam_bangul:{name:"방울이 친구",desc:"방울이를 인식했어요."},
        image_dasan_street:{name:"거리 탐험가",desc:"다산 거리를 인식했어요."},
        region_gimpo_1h:{name:"김포 포미·포수",desc:"김포시에서 1시간 머문 방문 뱃지예요."},
        region_hanam_1h:{name:"하남이와 방울이",desc:"하남시에서 1시간 머문 방문 뱃지예요."},
        region_goyang_1h:{name:"고양고양이",desc:"고양시에서 1시간 머문 방문 뱃지예요."}
    },

    en: {
        first_memory:{name:"First Memory",desc:"Saved your first memory."},
        first_photo:{name:"First Photo",desc:"Saved your first photo."},
        first_10km:{name:"10 km",desc:"Walked 10 km in total."},
        first_50km:{name:"50 km",desc:"Walked 50 km in total."},
        early_bird:{name:"Early Bird",desc:"Recorded a journey before 5 AM."},
        memory_5:{name:"Memory Collector",desc:"Saved 5 memories."},
        photo_10:{name:"Photo Collector",desc:"Saved 10 photos."},
        tour_visit:{name:"Explorer",desc:"Visited a new place."},
        festival_visit:{name:"Festival Visitor",desc:"Visited a festival."},
        image_hyundai_fountain:{name:"Fountain Friend",desc:"Recognized the fountain."},
        image_heendy:{name:"Heendy Friend",desc:"Recognized Heendy."},
        image_hanam_bangul:{name:"Bangul Friend",desc:"Recognized Bangul."},
        image_dasan_street:{name:"Street Explorer",desc:"Recognized Dasan Street."},
        region_gimpo_1h:{name:"Gimpo Pomi & Posu",desc:"Stayed in Gimpo for one verified hour."},
        region_hanam_1h:{name:"Hanam-i & Bangul-i",desc:"Stayed in Hanam for one verified hour."},
        region_goyang_1h:{name:"Goyang Cat",desc:"Stayed in Goyang for one verified hour."}
    },

    ja: {
        first_memory:{name:"初めての思い出",desc:"初めての思い出を保存しました。"},
        first_photo:{name:"初めての写真",desc:"初めての写真を保存しました。"},
        first_10km:{name:"10km",desc:"合計10km歩きました。"},
        first_50km:{name:"50km",desc:"合計50km歩きました。"},
        early_bird:{name:"早起きの旅人",desc:"午前5時前に記録しました。"},
        memory_5:{name:"思い出コレクター",desc:"思い出を5件保存しました。"},
        photo_10:{name:"写真コレクター",desc:"写真を10枚保存しました。"},
        tour_visit:{name:"探検家",desc:"新しい場所を訪れました。"},
        festival_visit:{name:"フェスティバル訪問者",desc:"フェスティバルを訪れました。"},
        image_hyundai_fountain:{name:"噴水の友達",desc:"噴水を認識しました。"},
        image_heendy:{name:"ヒンディの友達",desc:"ヒンディを認識しました。"},
        image_hanam_bangul:{name:"バンウリの友達",desc:"バンウリを認識しました。"},
        image_dasan_street:{name:"通りの探検家",desc:"茶山通りを認識しました。"},
        region_gimpo_1h:{name:"金浦 ポミ・ポス",desc:"金浦市に確認済みの1時間滞在。"},
        region_hanam_1h:{name:"河南 ハナミとバンウリ",desc:"河南市に確認済みの1時間滞在。"},
        region_goyang_1h:{name:"高陽ネコ",desc:"高陽市に確認済みの1時間滞在。"}
    },

    zh: {
        first_memory:{name:"第一份回忆",desc:"保存了第一份回忆。"},
        first_photo:{name:"第一张照片",desc:"保存了第一张照片。"},
        first_10km:{name:"10公里",desc:"累计步行了10公里。"},
        first_50km:{name:"50公里",desc:"累计步行了50公里。"},
        early_bird:{name:"早起旅行者",desc:"在清晨5点前完成了记录。"},
        memory_5:{name:"回忆收藏家",desc:"保存了5份回忆。"},
        photo_10:{name:"照片收藏家",desc:"保存了10张照片。"},
        tour_visit:{name:"探索者",desc:"访问了一个新地点。"},
        festival_visit:{name:"节庆访客",desc:"访问了一个节庆活动。"},
        image_hyundai_fountain:{name:"喷泉之友",desc:"识别出了喷泉。"},
        image_heendy:{name:"Heendy之友",desc:"识别出了Heendy。"},
        image_hanam_bangul:{name:"Bangul之友",desc:"识别出了Bangul。"},
        image_dasan_street:{name:"街道探索者",desc:"识别出了茶山街道。"},
        region_gimpo_1h:{name:"金浦 Pomi与Posu",desc:"在金浦市完成1小时有效停留。"},
        region_hanam_1h:{name:"河南 Hanam-i与Bangul-i",desc:"在河南市完成1小时有效停留。"},
        region_goyang_1h:{name:"高阳猫",desc:"在高阳市完成1小时有效停留。"}
    },

    es: {
        first_memory:{name:"Primer recuerdo",desc:"Guardaste tu primer recuerdo."},
        first_photo:{name:"Primera foto",desc:"Guardaste tu primera foto."},
        first_10km:{name:"10 km",desc:"Caminaste 10 km en total."},
        first_50km:{name:"50 km",desc:"Caminaste 50 km en total."},
        early_bird:{name:"Madrugador",desc:"Registraste un recorrido antes de las 5 a. m."},
        memory_5:{name:"Coleccionista de recuerdos",desc:"Guardaste 5 recuerdos."},
        photo_10:{name:"Coleccionista de fotos",desc:"Guardaste 10 fotos."},
        tour_visit:{name:"Explorador",desc:"Visitaste un lugar nuevo."},
        festival_visit:{name:"Visitante de festivales",desc:"Visitaste un festival."},
        image_hyundai_fountain:{name:"Amigo de la fuente",desc:"Reconociste la fuente."},
        image_heendy:{name:"Amigo de Heendy",desc:"Reconociste a Heendy."},
        image_hanam_bangul:{name:"Amigo de Bangul",desc:"Reconociste a Bangul."},
        image_dasan_street:{name:"Explorador de calles",desc:"Reconociste la calle Dasan."},
        region_gimpo_1h:{name:"Gimpo: Pomi y Posu",desc:"Una hora verificada en Gimpo."},
        region_hanam_1h:{name:"Hanam-i y Bangul-i",desc:"Una hora verificada en Hanam."},
        region_goyang_1h:{name:"Gato de Goyang",desc:"Una hora verificada en Goyang."}
    },

    fr: {
        first_memory:{name:"Premier souvenir",desc:"Vous avez enregistré votre premier souvenir."},
        first_photo:{name:"Première photo",desc:"Vous avez enregistré votre première photo."},
        first_10km:{name:"10 km",desc:"Vous avez parcouru 10 km au total."},
        first_50km:{name:"50 km",desc:"Vous avez parcouru 50 km au total."},
        early_bird:{name:"Lève-tôt",desc:"Vous avez enregistré un trajet avant 5 h."},
        memory_5:{name:"Collectionneur de souvenirs",desc:"Vous avez enregistré 5 souvenirs."},
        photo_10:{name:"Collectionneur de photos",desc:"Vous avez enregistré 10 photos."},
        tour_visit:{name:"Explorateur",desc:"Vous avez visité un nouveau lieu."},
        festival_visit:{name:"Visiteur de festival",desc:"Vous avez visité un festival."},
        image_hyundai_fountain:{name:"Ami de la fontaine",desc:"Vous avez reconnu la fontaine."},
        image_heendy:{name:"Ami de Heendy",desc:"Vous avez reconnu Heendy."},
        image_hanam_bangul:{name:"Ami de Bangul",desc:"Vous avez reconnu Bangul."},
        image_dasan_street:{name:"Explorateur de rue",desc:"Vous avez reconnu la rue Dasan."},
        region_gimpo_1h:{name:"Gimpo : Pomi et Posu",desc:"Une heure vérifiée à Gimpo."},
        region_hanam_1h:{name:"Hanam-i et Bangul-i",desc:"Une heure vérifiée à Hanam."},
        region_goyang_1h:{name:"Chat de Goyang",desc:"Une heure vérifiée à Goyang."}
    }
};
function getBadgeText(def) {
    var local = BADGE_TEXT_I18N[normalizeLang(currentLang)] || {};
    return local[def.id] || { name:def.name, desc:def.desc };
}

function makeImageBadgeIcon(type) {
    var faces = {
        fountain: '<span class="badge-face badge-fountain"><span class="badge-splash"></span><span class="badge-eyes"></span></span>',
        heendy: '<span class="badge-face badge-heendy"><span class="badge-ears"></span><span class="badge-eyes"></span></span>',
        street: '<span class="badge-face badge-street"><span class="badge-sign"></span><span class="badge-eyes"></span></span>'
    };
    return '<span class="character-badge" aria-hidden="true">' + (faces[type] || faces.street) + '</span>';
}

function getCollectionVisualHtml(def, fallbackIcon) {
    if (def && def.image) {
        var imagePosition = def.imagePosition || "center";
        var imageFit = def.imageFit || "cover";
        return '<div class="badge-art" style="--badge-image-position:' + escapeHtml(imagePosition) + ';--badge-image-fit:' + escapeHtml(imageFit) + '"><span class="badge-art-fallback" aria-hidden="true">✦</span><img src="' + escapeHtml(def.image) + '" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.remove()"></div>';
    }
    return '<div class="badge-icon">' + (fallbackIcon || "✦") + '</div>';
}

function loadCollection() {
    try {
        var raw = localStorage.getItem(COLLECTION_KEY);
        if (raw) {
            var data = JSON.parse(raw);
            badges = Array.isArray(data.badges) ? data.badges : [];
            visitStamps = Array.isArray(data.visitStamps) ? data.visitStamps : [];
            items = Array.isArray(data.items) ? data.items : [];
        }
        enrollPrelaunchTesterIfOpen();
        grantTesterSproutGift();
        updateBadgeList();
        updateVisitList();
    } catch(e) { console.warn("수집 정보 복원 실패", e); }
}

function saveCollection() {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify({ badges: badges, visitStamps: visitStamps, items: items }));
}

function earnBadge(badgeId) {
    if (badges.some(function(b) { return b.id === badgeId; })) return;
    var def = BADGE_DEFS.find(function(d) { return d.id === badgeId; });
    if (!def) return;
    var now = new Date();
    badges.push({ id: badgeId, earnedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateBadgeList();
    var regionAtlas = document.getElementById("region-badge-atlas");
    if (isRegionBadgeId(badgeId) && regionAtlas && !regionAtlas.hidden) renderRegionBadgeAtlas();
    var badgeText = getBadgeText(def);
    var ui = UI_TEXT[currentLang] || UI_TEXT.ko;
    showCollectionToast((ui.badge_earned || "뱃지 획득!") + " " + badgeText.name);
   if (isRegionBadgeId(badgeId)) {
    animateRegionBadgeToMenu(badgeId);
}
else {
    showGiloReaction("badge", "", {
        force:true,
        reward:badgeText.name
    });
}
}

function animateRegionBadgeToMenu(badgeId) {
    var menuButton = document.getElementById("ham-btn");
    if (!menuButton) return;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        menuButton.classList.remove("region-badge-received");
        void menuButton.offsetWidth;
        menuButton.classList.add("region-badge-received");
        setTimeout(function() { menuButton.classList.remove("region-badge-received"); }, 900);
        return;
    }
    var source = document.querySelector('.region-badge-slot[data-badge-id="' + badgeId + '"] .region-badge-brass-frame');
    var sourceRect = source ? source.getBoundingClientRect() : null;
    var targetRect = menuButton.getBoundingClientRect();
    var startX = sourceRect ? sourceRect.left + sourceRect.width / 2 : window.innerWidth / 2;
    var startY = sourceRect ? sourceRect.top + sourceRect.height / 2 : window.innerHeight * 0.42;
    var endX = targetRect.left + targetRect.width / 2;
    var endY = targetRect.top + targetRect.height / 2;
    var def = BADGE_DEFS.find(function(item) { return item.id === badgeId; });
    var flight = document.createElement("div");
    flight.className = "region-badge-menu-flight";
    flight.setAttribute("aria-hidden", "true");
    flight.style.left = startX + "px";
    flight.style.top = startY + "px";
    flight.style.setProperty("--badge-flight-x", (endX - startX) + "px");
    flight.style.setProperty("--badge-flight-y", (endY - startY) + "px");
    flight.style.setProperty("--badge-flight-mid-x", ((endX - startX) * 0.72) + "px");
    flight.style.setProperty("--badge-flight-mid-y", (((endY - startY) * 0.72) - 34) + "px");
    flight.innerHTML = '<span class="region-badge-menu-flight-frame">' + getCollectionVisualHtml(def, def && def.icon) + '</span>';
    document.body.appendChild(flight);
    var finish = function() {
        if (flight.parentNode) flight.parentNode.removeChild(flight);
        menuButton.classList.remove("region-badge-received");
        void menuButton.offsetWidth;
        menuButton.classList.add("region-badge-received");
        setTimeout(function() { menuButton.classList.remove("region-badge-received"); }, 900);
    };
    flight.addEventListener("animationend", finish, { once:true });
    setTimeout(function() { if (flight.parentNode) finish(); }, 1500);
}

function showRegionBadgeEarnedDialogue(badgeId, badgeText) {
    var region = REGION_BADGE_ATLAS_ENTRIES.find(function(entry) { return entry.id === badgeId; });
    var encounter = {}, view = {};
    Object.keys(COLLECTION_UI_I18N).forEach(function(lang) {
        var translatedBadge = BADGE_TEXT_I18N[lang] && BADGE_TEXT_I18N[lang][badgeId];
        var name = translatedBadge ? translatedBadge.name : collectionUiText("regional_badges", {}, lang);
        var city = region ? getRegionBadgeCityLabel(region, REGION_BADGE_ATLAS_I18N[lang]) : collectionUiText("new_region", {}, lang);
        encounter[lang] = collectionUiText("badge_encounter", { city:city, name:name }, lang);
        view[lang] = collectionUiText("badge_view", { name:name }, lang);
    });
    showGiloDialogue({
        image:GILO_DIALOG_IMAGE,
        name:"Gilo",
        pages:[encounter, view]
    });
}

function addVisitStamp(name, type, lat, lng) {
    var now = new Date();
    visitStamps.push({ name: name, type: type, lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR") });
    saveCollection();
    updateVisitList();
    if (type === "愿愿묕옙?" || type === "臾명솕?占쎌꽕") earnBadge("tour_visit");
    if (type === "異뺤젣") earnBadge("festival_visit");
    showCollectionToast(collectionUiText("visit_recorded", { place:name }));
}

function checkBadges() {
    var distKm = totalDistance / 1000;
    if (distKm >= 10) earnBadge("first_10km");
    if (distKm >= 50) earnBadge("first_50km");
    if (memories.length >= 1) earnBadge("first_memory");
    if (memories.length >= 5) earnBadge("memory_5");
    if (photos.length >= 1) earnBadge("first_photo");
    if (photos.length >= 10) earnBadge("photo_10");
    var hour = new Date().getHours();
    if (isRecording && hour < 5) earnBadge("early_bird");
}

function updateBadgeList() {
    updateItemList();
}

function grantTesterSproutGift() {
    if (items.some(function(item) { return item && item.id === TESTER_SPROUT_ITEM_ID; })) return false;
    if (!safeStorageGet(TESTER_ELIGIBILITY_KEY)) return false;
    var now = new Date();
    items.push({
        id: TESTER_SPROUT_ITEM_ID,
        name: "길로아의 새싹",
        description: "출시 전부터 길로아의 새싹을 지켜봐 준 테스터에게 드리는 한정 증표예요.",
        image: TESTER_SPROUT_IMAGE,
        imagePosition: "center",
        earnedAt: now.getTime(),
        dateString: now.toLocaleDateString("ko-KR"),
        source: "prelaunch-tester",
        limited: true
    });
    saveCollection();
    setTimeout(function() {
        showCollectionToast(collectionUiText("gift_arrived"));
        showGiloReaction("item", "", { force:true, reward:collectionUiText("sprout_name") });
    }, 1400);
    return true;
}

function enrollPrelaunchTesterIfOpen() {
    if (window.GILOA_TESTER_ENROLLMENT_OPEN !== true) return false;
    if (safeStorageGet(TESTER_ELIGIBILITY_KEY)) return true;
    safeStorageSet(TESTER_ELIGIBILITY_KEY, JSON.stringify({ enrolledAt:Date.now(), cohort:"prelaunch-2026" }));
    persistDurableStorageSnapshot();
    return true;
}

function getTourItemId(item) {
    return String(item && (item.contentid || item.contentId || item.id || item.title) || "");
}
function getVisitDateKey() { return getDailyTaskDate(); }
function completeExperience(item, method) {
    if (!item) return false;
    var id = getTourItemId(item);
    var key = id + ":" + getVisitDateKey();
    if (!id || completedVisitKeys.has(key) || visitStamps.some(function(v) { return v.visitKey === key; })) return false;
    var lat = parseFloat(item.mapy !== undefined ? item.mapy : item.lat);
    var lng = parseFloat(item.mapx !== undefined ? item.mapx : item.lng);
    var title = getTourDisplayTitle(item) || item.title || collectionUiText("nearby_place");
    var now = new Date();
    visitStamps.push({ name: title, type: getTourTypeName(item.contenttypeid), lat: lat, lng: lng, visitedAt: now.getTime(), dateString: now.toLocaleDateString("ko-KR"), visitKey: key, method: method });
    completedVisitKeys.add(key);
    saveCollection(); updateVisitList(); earnBadge("tour_visit"); updateDailyMissions(); syncRpgGrowth();
    showCollectionToast(collectionUiText("visit_recorded", { place:title }));
    showDiscoveryReward({ placeName: title, placeSource: item, method: method, rewardTextKey: "experience_reward", itemNameKey: "travel_stamp" });
    updateJourneyHud();
    return true;
}
function getAutomaticVisitCandidates() {
    var candidates = [];
    function add(items, layerType) {
        if (!mapLayerSettings[layerType]) return;
        (items || []).forEach(function(item) {
            if (!item) return;
            var point = getImageMissionLatLng(item);
            if (!point) return;
            var copy = Object.assign({}, item);
            copy._giloaVisitLayerType = layerType;
            candidates.push(copy);
        });
    }

    // 지도에 실제 표시되는 장소만 자동 방문 후보로 사용한다.
    // 화장실과 주차장은 지도 표시 여부와 관계없이 자동 방문 기록에서 제외한다.
    add(tourItems, "tourism");
    add(festivalItems, "tourism");
    if (typeof libraryItems !== "undefined") add(libraryItems, "library");
    if (typeof fishingItems !== "undefined") add(fishingItems, "fishing");
    if (typeof campingItems !== "undefined") add(campingItems, "camping");

    return candidates.filter(function(item) {
        var type = String(item.contenttypeid || item.contentTypeId || "");
        if (type === "39" && !mapLayerSettings.restaurant) return false;
        if (type === "32" && !mapLayerSettings.lodging) return false;
        return item._giloaVisitLayerType !== "restroom" && item._giloaVisitLayerType !== "parking";
    });
}

function checkNearbyVisitCompletion(options) {
    options = options || {};

    // 사용자가 위치 기록을 꺼 둔 동안에는 자동 방문 판정을 전혀 하지 않는다.
    // 기록을 다시 켜면 30분 체류 시간도 처음부터 다시 센다.
    if (!isRecording) {
        visitCandidate = { contentId:"", enteredAt:0, item:null };
        return false;
    }

    // 50m 방문 판정이므로 GPS 오차가 50m보다 크면 체류 시간을 인정하지 않는다.
    if (!currentPos || currentAccuracy > 50) {
        visitCandidate = { contentId:"", enteredAt:0, item:null };
        return false;
    }

    var nearby = getAutomaticVisitCandidates().filter(function(item) {
        var point = getImageMissionLatLng(item);
        return point && currentPos.distanceTo(point) <= 50;
    }).sort(function(a, b) {
        return currentPos.distanceTo(getImageMissionLatLng(a)) - currentPos.distanceTo(getImageMissionLatLng(b));
    })[0];

    if (!nearby) {
        visitCandidate = { contentId:"", enteredAt:0, item:null };
        return false;
    }

    var id = getTourItemId(nearby);
    if (!id) return false;

    if (visitCandidate.contentId !== id) {
        visitCandidate = { contentId:id, enteredAt:Date.now(), item:nearby };
        return false;
    }

    // 같은 장소 포인트 50m 안에서 연속 30분 + 위치 기록 ON일 때만 방문 완료.
    if (Date.now() - visitCandidate.enteredAt < 30 * 60 * 1000) return false;
    return completeExperience(nearby, collectionUiText("stay_complete"));
}

function showDiscoveryReward(options) {
    options = options || {};
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    setDiscoveryGiloImage("discovery");
    if (discoveryRewardTimer) { clearTimeout(discoveryRewardTimer); discoveryRewardTimer = null; }
    activeDiscoveryRewardOptions = options;
    renderDiscoveryRewardText();
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show"); toast.setAttribute("aria-hidden", "false");
    discoveryRewardTimer = setTimeout(function() { toast.classList.remove("show"); toast.setAttribute("aria-hidden", "true"); discoveryRewardTimer = null; }, 5200);
}
function renderDiscoveryRewardText() {
    var options = activeDiscoveryRewardOptions || {};
    var toast = document.getElementById("discovery-toast");
    if (!toast) return;
    var kicker = toast.querySelector(".discovery-kicker");
    if (kicker) kicker.textContent = collectionUiText("discovery");
    document.getElementById("discovery-place-name").textContent = options.placeSource ? getTourDisplayTitle(options.placeSource) : (options.placeName || collectionUiText("new_place"));
    document.getElementById("discovery-method").textContent = collectionUiText(options.method === "photo" ? "photo_complete" : "stay_complete");
    document.getElementById("discovery-reward").textContent = [options.rewardTextKey ? collectionUiText(options.rewardTextKey) : options.rewardText, options.itemNameKey ? collectionUiText(options.itemNameKey) : options.itemName].filter(Boolean).join(" · ");
}
function getTourMarkerState(item, nearbyIndex) {
    var id = getTourItemId(item); var todayPrefix = id + ":";
    var visited = visitStamps.some(function(v) { return v.visitKey && v.visitKey.indexOf(todayPrefix) === 0; });
    var point = getImageMissionLatLng(item); var distance = currentPos && point ? currentPos.distanceTo(point) : Infinity;
    var selected = !!selectedDestination && point && L.latLng(selectedDestination.lat, selectedDestination.lng).distanceTo(point) < 2;
    return { visited: visited, selected: selected, nearby: !visited && nearbyIndex < 3 && distance <= 300, discoverable: !visited && distance <= 80, missionAvailable: !!activeImageMission && activeImageMission.item === item };
}
function triggerRecentPathPulse(lat, lng) {
    recentDiscoveryPulse = { startedAt: Date.now(), lat: lat, lng: lng };
    var point = map.latLngToContainerPoint([lat, lng]); var pulse = document.createElement("div"); pulse.className = "recent-path-pulse"; pulse.style.left = (point.x - 6) + "px"; pulse.style.top = (point.y - 6) + "px"; document.getElementById("map-wrap").appendChild(pulse); setTimeout(function() { pulse.remove(); }, 1050); scheduleRender();
}
function getLocalDateKey(value) {
    var date = new Date(Number(value));
    if (isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function getTodayJourneySummary() {
    var today = getDailyTaskDate(); var todayVisits = visitStamps.filter(function(v) { return getLocalDateKey(v.visitedAt) === today; });
    var todayPhotos = photos.filter(function(p) { return getLocalDateKey(p.time) === today; });
    var todayMemories = memories.filter(function(m) { return getLocalDateKey(m.time) === today; });
    return { distance: calcTodayDistance(), visits: todayVisits, photos: todayPhotos, memories:todayMemories, latest: todayVisits.length ? todayVisits.slice().sort(function(a,b){return b.visitedAt-a.visitedAt;})[0] : null };
}
function renderTodayJourneyRecap() {
    var recap = document.getElementById("journey-recap"); if (!recap) return;
    var summary = getTodayJourneySummary(); var growth = loadTodayGrowth(); var words = getRpgText();
    var topKey = RPG_STAT_KEYS.slice().sort(function(a,b) { return Number(growth.stats[b] || 0) - Number(growth.stats[a] || 0); })[0];
    var topAmount = Number(growth.stats[topKey]) || 0;
    document.getElementById("journey-recap-distance").textContent = (summary.distance / 1000).toFixed(1) + " km";
    document.getElementById("journey-recap-visits").textContent = summary.visits.length;
    document.getElementById("journey-recap-photos").textContent = summary.photos.length;
    document.getElementById("journey-recap-memories").textContent = summary.memories.length;
    document.getElementById("journey-recap-date").textContent = new Date().toLocaleDateString(currentLang || "ko", { year:"numeric", month:"long", day:"numeric", weekday:"long" });
    document.getElementById("journey-recap-trait").textContent = (words.stats[topKey] || RPG_STAT_LABELS[topKey]) + " +" + topAmount;
    document.getElementById("journey-recap-message").textContent = collectionUiText("recap_" + topKey);
    var image = document.getElementById("journey-recap-gilo"); if (image) image.src = encodeURI(GILO_SCENE_IMAGES.trip_end);
    syncJourneyShareButtonLanguage();
}

var GILOA_JOURNEY_SHARE_TEXT = {
    ko:{button:"인스타그램에 공유", title:"오늘의 대동여지도", distance:"걸은 거리", visits:"새로운 발견", photos:"사진", memories:"기억", footer:"나만의 지도를 만들어 보세요", preparing:"공유 이미지를 만들고 있어요…", saved:"공유 이미지를 만들었어요. Instagram을 선택해 주세요.", unsupported:"이 기기에서는 이미지 직접 공유가 어려워 이미지를 저장합니다."},
    en:{button:"Share to Instagram", title:"Today's Journey Map", distance:"Distance", visits:"Discoveries", photos:"Photos", memories:"Memories", footer:"Make your own map", preparing:"Creating your share image…", saved:"Your share image is ready. Choose Instagram.", unsupported:"Direct image sharing is unavailable here, so the image will be saved."},
    ja:{button:"Instagramでシェア", title:"今日の旅の地図", distance:"歩いた距離", visits:"新しい発見", photos:"写真", memories:"思い出", footer:"自分だけの地図を作ろう", preparing:"シェア画像を作成中…", saved:"画像を作成しました。Instagramを選んでください。", unsupported:"この端末では画像の直接共有が難しいため、画像を保存します。"},
    zh:{button:"分享到 Instagram", title:"今日旅程地图", distance:"步行距离", visits:"新发现", photos:"照片", memories:"回忆", footer:"制作属于你的地图", preparing:"正在生成分享图片…", saved:"分享图片已生成，请选择 Instagram。", unsupported:"此设备不支持直接分享图片，将保存图片。"},
    es:{button:"Compartir en Instagram", title:"Mapa del viaje de hoy", distance:"Distancia", visits:"Descubrimientos", photos:"Fotos", memories:"Recuerdos", footer:"Crea tu propio mapa", preparing:"Creando la imagen para compartir…", saved:"Imagen lista. Elige Instagram.", unsupported:"No se puede compartir la imagen directamente; se guardará."},
    fr:{button:"Partager sur Instagram", title:"Carte du voyage du jour", distance:"Distance", visits:"Découvertes", photos:"Photos", memories:"Souvenirs", footer:"Créez votre propre carte", preparing:"Création de l’image de partage…", saved:"Image prête. Choisissez Instagram.", unsupported:"Le partage direct d’image n’est pas disponible ; l’image sera enregistrée."}
};
function getJourneyShareText() { return GILOA_JOURNEY_SHARE_TEXT[normalizeLang(currentLang)] || GILOA_JOURNEY_SHARE_TEXT.ko; }

function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function canvasToBlobPromise(canvas) {
    return new Promise(function(resolve, reject) {
        try { canvas.toBlob(function(blob) { blob ? resolve(blob) : reject(new Error("PNG creation failed")); }, "image/png", 0.96); }
        catch (error) { reject(error); }
    });
}
function loadShareImage(src) {
    return new Promise(function(resolve) {
        if (!src) { resolve(null); return; }
        var image = new Image();
        image.onload = function(){ resolve(image); };
        image.onerror = function(){ resolve(null); };
        image.src = src;
    });
}
function buildTodayJourneyShareImage() {
    var summary = getTodayJourneySummary(), t = getJourneyShareText(), growth = loadTodayGrowth(), words = getRpgText();
    var topKey = RPG_STAT_KEYS.slice().sort(function(a,b){ return Number(growth.stats[b]||0)-Number(growth.stats[a]||0); })[0];
    var topAmount = Number(growth.stats[topKey]) || 0;
    var canvas = document.createElement("canvas"), w = 1080, h = 1920;
    canvas.width=w; canvas.height=h; var ctx=canvas.getContext("2d");
    var giloSrc = encodeURI(GILO_SCENE_IMAGES.trip_end || "");
    return loadShareImage(giloSrc).then(function(gilo) {
        var bg=ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"#1a2035"); bg.addColorStop(1,"#08101f");
        ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
        var glow=ctx.createRadialGradient(820,320,20,820,320,560); glow.addColorStop(0,"rgba(79,195,247,.28)"); glow.addColorStop(1,"rgba(79,195,247,0)");
        ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);

        ctx.fillStyle="#4fc3f7"; ctx.beginPath(); ctx.arc(92,108,14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="900 44px sans-serif"; ctx.fillText("GILOA",126,124);
        ctx.fillStyle="rgba(255,255,255,.62)"; ctx.font="700 25px sans-serif"; ctx.fillText("MY DAEDONGYEOJIDO",82,174);

        ctx.fillStyle="#fff"; ctx.font="900 68px sans-serif"; ctx.fillText(t.title,82,300);
        ctx.fillStyle="rgba(255,255,255,.66)"; ctx.font="600 30px sans-serif";
        ctx.fillText(new Date().toLocaleDateString(currentLang||"ko",{year:"numeric",month:"long",day:"numeric",weekday:"long"}),82,354);

        if (gilo) {
            var maxW=560,maxH=560, ratio=Math.min(maxW/gilo.width,maxH/gilo.height);
            var iw=gilo.width*ratio, ih=gilo.height*ratio;
            ctx.drawImage(gilo, w-iw-38, 390, iw, ih);
        }

        // Abstract route/map panel: uses today's route geometry but intentionally omits base-map labels for privacy.
        roundRectPath(ctx,70,560,940,570,44); ctx.fillStyle="rgba(7,15,31,.88)"; ctx.fill();
        ctx.strokeStyle="rgba(79,195,247,.25)"; ctx.lineWidth=3; ctx.stroke();
        var todayStart=new Date(); todayStart.setHours(0,0,0,0);
        var pts=(pathCoordinates||[]).filter(function(p){return p && Number(p.endTime||p.startTime)>=todayStart.getTime() && isFinite(p.lat)&&isFinite(p.lng);});
        if (pts.length>1) {
            var minLat=Math.min.apply(null,pts.map(function(p){return p.lat;})), maxLat=Math.max.apply(null,pts.map(function(p){return p.lat;}));
            var minLng=Math.min.apply(null,pts.map(function(p){return p.lng;})), maxLng=Math.max.apply(null,pts.map(function(p){return p.lng;}));
            var latSpan=Math.max(.0001,maxLat-minLat), lngSpan=Math.max(.0001,maxLng-minLng);
            ctx.strokeStyle="#4fc3f7"; ctx.lineWidth=10; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath();
            pts.forEach(function(p,i){var x=125+(p.lng-minLng)/lngSpan*830; var y=1070-(p.lat-minLat)/latSpan*450; if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}); ctx.stroke();
            ctx.fillStyle="#fff"; var first=pts[0], last=pts[pts.length-1];
            [first,last].forEach(function(p){var x=125+(p.lng-minLng)/lngSpan*830;var y=1070-(p.lat-minLat)/latSpan*450;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();});
        } else {
            ctx.fillStyle="rgba(79,195,247,.15)"; ctx.beginPath(); ctx.arc(540,840,150,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="#4fc3f7"; ctx.beginPath(); ctx.arc(540,840,18,0,Math.PI*2); ctx.fill();
        }

        var stats=[
            [(summary.distance/1000).toFixed(1)+" km",t.distance],
            [String(summary.visits.length),t.visits],
            [String(summary.photos.length),t.photos],
            [String(summary.memories.length),t.memories]
        ];
        stats.forEach(function(row,i){var x=70+(i%2)*475,y=1180+Math.floor(i/2)*205;roundRectPath(ctx,x,y,455,170,28);ctx.fillStyle="rgba(255,255,255,.055)";ctx.fill();ctx.strokeStyle="rgba(255,255,255,.10)";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 52px sans-serif";ctx.fillText(row[0],x+30,y+70);ctx.fillStyle="rgba(255,255,255,.55)";ctx.font="700 26px sans-serif";ctx.fillText(row[1],x+30,y+118);});

        roundRectPath(ctx,70,1605,940,130,28); ctx.fillStyle="rgba(79,195,247,.10)";ctx.fill();ctx.strokeStyle="rgba(79,195,247,.35)";ctx.stroke();
        ctx.fillStyle="#4fc3f7";ctx.font="800 26px sans-serif";ctx.fillText((words.stats[topKey]||RPG_STAT_LABELS[topKey])+" +"+topAmount,102,1660);
        ctx.fillStyle="#fff";ctx.font="700 30px sans-serif";ctx.fillText(t.footer,102,1705);
        ctx.fillStyle="rgba(255,255,255,.58)";ctx.font="700 26px sans-serif";ctx.fillText("Google Play · com.giloa.app",82,1800); ctx.font="600 21px sans-serif"; ctx.fillText("https://play.google.com/store/apps/details?id=com.giloa.app",82,1842);
        return canvasToBlobPromise(canvas);
    });
}
function downloadJourneyShareImage(blob) {
    var url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="GILOA-today-"+getDailyTaskDate()+".png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
function shareTodayJourneyToInstagram() {
    // 공유 자체는 하루 횟수 제한 없음. 일일 미션 보상만 최초 1회 처리한다.
    var t=getJourneyShareText(); showCollectionToast(t.preparing);
    buildTodayJourneyShareImage().then(function(blob){
        var file=new File([blob],"GILOA-today-"+getDailyTaskDate()+".png",{type:"image/png"});
        var shareData={title:"GILOA",text:getJourneyShareMessage()+"\n"+GILOA_STORE_URL,url:GILOA_STORE_URL,files:[file]};
        if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
            // Instagram은 이미지 파일과 함께 전달된 URL/본문을 버릴 수 있으므로
            // 링크를 클립보드에도 복사해 사용자가 스토리/DM에 바로 붙여넣을 수 있게 한다.
            var copyPromise = navigator.clipboard && navigator.clipboard.writeText
                ? navigator.clipboard.writeText(GILOA_STORE_URL).catch(function(){})
                : Promise.resolve();
            return copyPromise.then(function() {
                return navigator.share(shareData);
            }).then(function(){
                // 공유는 무제한. 오늘의 '길로아 알리기' 미션만 최초 공유 시 완료된다.
                markDailyShareDone();
                showCollectionToast(t.saved);
            });
        }
        showCollectionToast(t.unsupported); downloadJourneyShareImage(blob);
    }).catch(function(error){ console.warn("Journey share image failed",error); copyGiloaShareText(); });
}
function syncJourneyShareButtonLanguage() {
    var button=document.getElementById("journey-recap-share-instagram");
    if (button) button.textContent=getJourneyShareText().button;
}

function showTodayJourneyRecap() {
    var recap = document.getElementById("journey-recap"); if (!recap) return;
    renderTodayJourneyRecap();
    recap.classList.add("open"); recap.setAttribute("aria-hidden", "false"); document.body.classList.add("journey-recap-opened");
    if (isHudExpanded) toggleHud();
}
function hideTodayJourneyRecap() { var recap = document.getElementById("journey-recap"); if (!recap) return; recap.classList.remove("open"); recap.setAttribute("aria-hidden", "true"); document.body.classList.remove("journey-recap-opened"); }
function openTodayRouteFromRecap() { hideTodayJourneyRecap(); showTodayWalkingRoute(); }
function getExplorationStreak() {
    var days = new Set(visitStamps.map(function(v) { return new Date(v.visitedAt).toISOString().slice(0,10); })); var streak = 0; var day = new Date();
    while (days.has(day.toISOString().slice(0,10))) { streak += 1; day.setDate(day.getDate() - 1); } return streak;
}
function updateJourneyHud() {
    var summary = getTodayJourneySummary(); var stats = document.getElementById("journey-hud-stats"); var latest = document.getElementById("journey-hud-latest"); var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    var kicker = document.querySelector(".journey-hud-kicker"); if (kicker) kicker.textContent = t.journey_kicker;
    if (stats) stats.textContent = formatUiTemplate(t.journey_stats, {distance:(summary.distance / 1000).toFixed(1),visits:summary.visits.length,photos:summary.photos.length,streak:getExplorationStreak()});
    if (latest) latest.textContent = summary.latest ? formatUiTemplate(t.journey_latest,{place:getVisitDisplayName(summary.latest)}) : t.journey_empty;
    renderDailyTravelLog(summary);
}
function renderDailyTravelLog(summary) {
    var card = document.getElementById("daily-travel-log"); if (!card) return; var hasData = summary.distance > 0 || summary.visits.length || summary.photos.length; card.hidden = !hasData; if (!hasData) return;
    var t = UI_TEXT[currentLang] || UI_TEXT.ko;
    document.getElementById("daily-travel-log-date").textContent = new Date().toLocaleDateString(currentLang, { year:"numeric", month:"long", day:"numeric" });
    document.getElementById("daily-travel-log-stats").textContent = formatUiTemplate(t.journey_log_stats,{distance:(summary.distance/1000).toFixed(1),visits:summary.visits.length,photos:summary.photos.length,stays:stayBonusPlaces.length});
    document.getElementById("daily-travel-log-places").textContent = summary.visits.length ? formatUiTemplate(t.journey_log_places,{places:summary.visits.slice(0,3).map(getVisitDisplayName).join(" · ")}) : t.journey_log_wait;
}
function completeDailyTask(taskId, reward) {
    var state = loadDailyTaskState(); state.rewarded = state.rewarded || []; if (state.rewarded.indexOf(taskId) >= 0) return false; state.rewarded.push(taskId); localStorage.setItem(DAILY_TASK_KEY, JSON.stringify(state)); completedTaskEffects.add(taskId); setTimeout(function(){ completedTaskEffects.delete(taskId); }, 1200); showGiloReaction(state.rewarded.length >= 3 ? "daily" : "mission", "", { force:true, reward:"+" + reward + " EXP" }); return true;
}
function updateTimeAtmosphere() {
    var overlay = document.getElementById("time-atmosphere"); if (!overlay) return; var hour = new Date().getHours(); var period = hour >= 4 && hour < 7 ? "dawn" : hour >= 7 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "sunset" : "night"; overlay.className = period;
}

var REGION_BADGE_ATLAS_ENTRIES = [
    { id:"region_gimpo_1h", city:"김포시", x:18, y:36 },
    { id:"region_goyang_1h", city:"고양시", x:30, y:24 }
];
var activeRegionBadgeEntryId = "region_gimpo_1h";
function isRegionBadgeId(id) { return /^region_.*_1h$/.test(String(id || "")); }
function getEarnedBadge(id) { return badges.find(function(b) { return b.id === id; }) || null; }
var REGION_BADGE_ATLAS_I18N = {
    ko: {
        cities:{
            region_gimpo_1h:"김포시",
            region_goyang_1h:"고양시",
            region_hanam_1h:"하남시"
        },
        accumulating:"{city} 적립 중 · 정확도 {accuracy}",
        currentCity:"현재 {city}에 있어요",
        outside:"현재 위치가 {city} 밖이에요",
        accuracy:"정확도 {accuracy} · 100m 이내여야 적립",
        waiting:"GPS 위치를 기다리는 중",
        requirement:"{city}에서 정확도 100m 이내의 GPS 기록을 누적 1시간 모으면 획득해요.",
        earned:"획득 완료 · {date}",
        progress:"진행 {minutes}/60분",
        ariaEarned:"획득 완료",
        ariaLocked:"미획득"
    },

    en: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Recording in {city} · accuracy {accuracy}",
        currentCity:"You are currently in {city}",
        outside:"Your current location is outside {city}",
        accuracy:"Accuracy {accuracy} · must be within 100 m",
        waiting:"Waiting for GPS location",
        requirement:"Collect 1 hour of GPS records within 100 m accuracy in {city}.",
        earned:"Earned · {date}",
        progress:"Progress {minutes}/60 min",
        ariaEarned:"earned",
        ariaLocked:"not earned"
    },

    ja: {
        cities:{
            region_gimpo_1h:"金浦市",
            region_goyang_1h:"高陽市",
            region_hanam_1h:"河南市"
        },
        accumulating:"{city}で記録中 · 精度 {accuracy}",
        currentCity:"現在地は{city}です",
        outside:"現在地は{city}の外です",
        accuracy:"精度 {accuracy} · 100m以内で記録されます",
        waiting:"GPS位置を待っています",
        requirement:"{city}で精度100m以内のGPS記録を合計1時間集めると獲得できます。",
        earned:"獲得済み · {date}",
        progress:"進行 {minutes}/60分",
        ariaEarned:"獲得済み",
        ariaLocked:"未獲得"
    },

    zh: {
        cities:{
            region_gimpo_1h:"金浦市",
            region_goyang_1h:"高阳市",
            region_hanam_1h:"河南市"
        },
        accumulating:"正在{city}记录 · 精度 {accuracy}",
        currentCity:"当前位置在{city}",
        outside:"当前位置不在{city}范围内",
        accuracy:"精度 {accuracy} · 需在100米以内",
        waiting:"正在等待GPS位置",
        requirement:"在{city}累计收集1小时精度在100米以内的GPS记录即可获得。",
        earned:"已获得 · {date}",
        progress:"进度 {minutes}/60分钟",
        ariaEarned:"已获得",
        ariaLocked:"未获得"
    },

    es: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Registrando en {city} · precisión {accuracy}",
        currentCity:"Actualmente estás en {city}",
        outside:"Tu ubicación actual está fuera de {city}",
        accuracy:"Precisión {accuracy} · debe estar dentro de 100 m",
        waiting:"Esperando la ubicación GPS",
        requirement:"Acumula 1 hora de registros GPS con una precisión de 100 m en {city}.",
        earned:"Conseguida · {date}",
        progress:"Progreso {minutes}/60 min",
        ariaEarned:"conseguida",
        ariaLocked:"no conseguida"
    },

    fr: {
        cities:{
            region_gimpo_1h:"Gimpo",
            region_goyang_1h:"Goyang",
            region_hanam_1h:"Hanam"
        },
        accumulating:"Enregistrement à {city} · précision {accuracy}",
        currentCity:"Vous êtes actuellement à {city}",
        outside:"Votre position actuelle est en dehors de {city}",
        accuracy:"Précision {accuracy} · doit être inférieure à 100 m",
        waiting:"En attente de la position GPS",
        requirement:"Cumulez 1 heure de données GPS avec une précision de 100 m à {city}.",
        earned:"Obtenu · {date}",
        progress:"Progression {minutes}/60 min",
        ariaEarned:"obtenu",
        ariaLocked:"non obtenu"
    }
};

function getRegionBadgeAtlasText() {
    return REGION_BADGE_ATLAS_I18N[normalizeLang(currentLang)]
        || REGION_BADGE_ATLAS_I18N.ko;
}

function formatRegionBadgeAtlasText(template, values) {
    return String(template || "").replace(/\{([a-zA-Z]+)\}/g, function(match, key) {
        return values[key] !== undefined ? String(values[key]) : match;
    });
}

function getRegionBadgeCityLabel(entry, text) {
    if (!entry) return "";
    return text.cities[entry.id] || entry.city;
}

function getRegionBadgeCityLabelFromName(city, text) {
    var entry = REGION_BADGE_ATLAS_ENTRIES.find(function(item) {
        return item.city === city;
    });
    return entry ? getRegionBadgeCityLabel(entry, text) : city;
}
function setRegionBadgeAtlasDetail(entry) {
    var detail = document.getElementById("region-badge-atlas-detail");
    if (!entry) return;

    activeRegionBadgeEntryId = entry.id;

    var def = BADGE_DEFS.find(function(d) {
        return d.id === entry.id;
    });

    if (!detail || !def) return;

    var earned = getEarnedBadge(entry.id);
    var badgeText = getBadgeText(def);
    var atlasText = getRegionBadgeAtlasText();
    var cityLabel = getRegionBadgeCityLabel(entry, atlasText);

    var progress =
        typeof window.getGiloaRegionStayProgress === "function"
            ? window.getGiloaRegionStayProgress()
            : {};

    var minutes = Math.max(
        0,
        Math.min(60, Number(progress[entry.city]) || 0)
    );

    var status = "";

    if (!earned) {
        var fix = getRegionStayLiveFix(Date.now());

        if (regionStayLastTickCity === entry.city) {
            status = formatRegionBadgeAtlasText(
                atlasText.accumulating,
                {
                    city: cityLabel,
                    accuracy: fix
                        ? Math.round(fix.accuracy) + "m"
                        : "-"
                }
            );
        } else if (regionStayLastTickCity) {
            status = formatRegionBadgeAtlasText(
                atlasText.currentCity,
                {
                    city: getRegionBadgeCityLabelFromName(
                        regionStayLastTickCity,
                        atlasText
                    )
                }
            );
        } else if (fix) {
            status = formatRegionBadgeAtlasText(
                atlasText.outside,
                {
                    city: cityLabel
                }
            );
        } else if (
            currentPos &&
            isFinite(currentAccuracy) &&
            Number(currentAccuracy) > REGION_STAY_MAX_ACCURACY_M
        ) {
            status = formatRegionBadgeAtlasText(
                atlasText.accuracy,
                {
                    accuracy: Math.round(currentAccuracy) + "m"
                }
            );
        } else {
            status = atlasText.waiting;
        }
    }

    var requirementText = formatRegionBadgeAtlasText(
        atlasText.requirement,
        {
            city: cityLabel
        }
    );

    var progressText;

    if (earned) {
        progressText = formatRegionBadgeAtlasText(
            atlasText.earned,
            {
                date: formatCollectionDate(earned.earnedAt, earned.dateString)
            }
        );
    } else {
        progressText = formatRegionBadgeAtlasText(
            atlasText.progress,
            {
                minutes: minutes
            }
        );
    }

    detail.innerHTML =
        "<strong>" +
        escapeHtml(badgeText.name) +
        "</strong>" +
        "<span>" +
        escapeHtml(requirementText) +
        "</span>" +
        "<em>" +
        escapeHtml(progressText) +
        "</em>" +
        (
            status
                ? '<small class="region-badge-atlas-status">' +
                  escapeHtml(status) +
                  "</small>"
                : ""
        );
}

var regionStayDiagnosticTaps = 0;
var regionStayDiagnosticTimer = null;
function bindRegionStayDiagnosticGesture() {
    var stamp = document.getElementById("region-badge-atlas-build");
    if (stamp) stamp.textContent = "build " + GILOA_REGION_STAY_BUILD;

    var button = document.getElementById("region-badge-atlas-diagnose");
    if (button && !button._giloaDiagnosticBound) {
        button._giloaDiagnosticBound = true;
        button.addEventListener("click", toggleRegionStayDiagnostic);
    }

    var dismiss = document.getElementById("region-badge-atlas-diagnostic-close");
    if (dismiss && !dismiss._giloaDiagnosticBound) {
        dismiss._giloaDiagnosticBound = true;
        dismiss.addEventListener("click", function() {
            var wrap = document.getElementById("region-badge-atlas-diagnostic-wrap");
            if (wrap) wrap.hidden = true;
        });
    }

    var reload = document.getElementById("region-badge-atlas-reload-boundary");
    if (reload && !reload._giloaDiagnosticBound) {
        reload._giloaDiagnosticBound = true;
        reload.addEventListener("click", function() {
            reload.disabled = true;
            reload.textContent = collectionUiText("boundary_loading");
            loadAdminDistrictBoundaries().then(function() {
                reload.disabled = false;
                reload.textContent = collectionUiText("boundary_reload");
                window.giloaRegionStayDiagnostic();
            });
        });
    }

    var title = document.getElementById("region-badge-atlas-title");
    if (!title || title._giloaDiagnosticBound) return;
    title._giloaDiagnosticBound = true;
    title.addEventListener("click", function() {
        regionStayDiagnosticTaps += 1;
        clearTimeout(regionStayDiagnosticTimer);
        regionStayDiagnosticTimer = setTimeout(function() { regionStayDiagnosticTaps = 0; }, 1200);
        if (regionStayDiagnosticTaps < 5) return;
        regionStayDiagnosticTaps = 0;
        toggleRegionStayDiagnostic();
    });
}
document.addEventListener("DOMContentLoaded", bindRegionStayDiagnosticGesture);
function renderRegionBadgeAtlas() {
    var slots = document.getElementById("region-badge-map-slots");
    if (!slots) return;

    var atlasText = getRegionBadgeAtlasText();
    slots.innerHTML = "";

    REGION_BADGE_ATLAS_ENTRIES.forEach(function(entry) {
        var def = BADGE_DEFS.find(function(d) {
            return d.id === entry.id;
        });

        if (!def) return;

        var earned = getEarnedBadge(entry.id);
        var badgeText = getBadgeText(def);
        var cityLabel = getRegionBadgeCityLabel(entry, atlasText);

        var slot = document.createElement("button");
        slot.type = "button";
        slot.className =
            "region-badge-slot" +
            (earned ? " earned" : " locked");

        slot.dataset.badgeId = entry.id;
        slot.style.left = entry.x + "%";
        slot.style.top = entry.y + "%";

        slot.setAttribute(
            "aria-label",
            cityLabel +
            " " +
            badgeText.name +
            " " +
            (
                earned
                    ? atlasText.ariaEarned
                    : atlasText.ariaLocked
            )
        );

        slot.innerHTML =
            '<span class="region-badge-brass-frame">' +
            (
                earned
                    ? getCollectionVisualHtml(def, def.icon)
                    : "<i>?</i>"
            ) +
            "</span>" +
            "<b>" +
            escapeHtml(cityLabel) +
            "</b>";

        slot.addEventListener("click", function() {
            setRegionBadgeAtlasDetail(entry);
        });

        slots.appendChild(slot);
    });

    var selected =
        REGION_BADGE_ATLAS_ENTRIES.find(function(entry) {
            return entry.id === activeRegionBadgeEntryId;
        }) || REGION_BADGE_ATLAS_ENTRIES[0];

    setRegionBadgeAtlasDetail(selected);
}
function openRegionBadgeAtlas() {
    var atlas = document.getElementById("region-badge-atlas"); if (!atlas) return;
    bindRegionStayDiagnosticGesture();
    tickRegionStayLive();
    recalculateRegionStayFromPath();
    renderRegionBadgeAtlas(); atlas.hidden = false; atlas.setAttribute("aria-hidden", "false"); document.body.classList.add("region-badge-atlas-open");
    var close = document.getElementById("region-badge-atlas-close"); if (close) close.focus();
}
function closeRegionBadgeAtlas() {
    var atlas = document.getElementById("region-badge-atlas"); if (!atlas) return;
    atlas.hidden = true; atlas.setAttribute("aria-hidden", "true"); document.body.classList.remove("region-badge-atlas-open");
}
window.openRegionBadgeAtlas = openRegionBadgeAtlas;
window.closeRegionBadgeAtlas = closeRegionBadgeAtlas;
document.addEventListener("click", function(event) {
    var atlas = document.getElementById("region-badge-atlas");
    if (!atlas || atlas.hidden || !event.target) return;
    if (event.target === atlas || (event.target.closest && event.target.closest("[data-region-atlas-close]"))) closeRegionBadgeAtlas();
});
document.addEventListener("keydown", function(event) { if (event.key === "Escape") closeRegionBadgeAtlas(); });

function updateItemList() {
    var container = document.getElementById("item-list");
    if (!container) return;
    container.innerHTML = "";
    var regionCount = REGION_BADGE_ATLAS_ENTRIES.filter(function(entry) { return !!getEarnedBadge(entry.id); }).length;
    var regionCard = document.createElement("button");
    regionCard.type = "button"; regionCard.className = "region-badge-entry-card";
    regionCard.innerHTML = '<span class="region-badge-entry-icon"><i></i></span><span><b>' + escapeHtml(collectionUiText("regional_badges")) + '</b><small>' + escapeHtml(collectionUiText("regional_hint")) + '</small></span><em>' + regionCount + '/' + REGION_BADGE_ATLAS_ENTRIES.length + '</em><strong aria-hidden="true">›</strong>';
    regionCard.addEventListener("click", openRegionBadgeAtlas); container.appendChild(regionCard);
    if (badges.length === 0 && items.length === 0) {
        var empty = document.createElement("p"); empty.className = "empty-message region-badge-empty"; empty.textContent = collectionUiText("empty_items"); container.appendChild(empty);
    }
    items.slice().reverse().forEach(function(savedItem) {
        var item = document.createElement("div");
        item.className = "badge-item item-card";
        var itemText = getCollectionItemText(savedItem);
        var name = itemText.name;
        var date = formatCollectionDate(savedItem.earnedAt, savedItem.dateString);
        var savedVisual = { image: savedItem.image || savedItem.imageUrl || DEFAULT_COLLECTION_IMAGE, imagePosition: savedItem.imagePosition || "center 35%" };
        item.innerHTML = getCollectionVisualHtml(savedVisual, "✦") + '<div class="badge-name">' + escapeHtml(name) + '</div><div class="badge-date">' + escapeHtml(date) + '</div>';
        item.title = itemText.description;
        container.appendChild(item);
    });
    badges.slice().reverse().filter(function(b) { return !isRegionBadgeId(b.id); }).forEach(function(b) {
        var def = BADGE_DEFS.find(function(d) { return d.id === b.id; });
        if (!def) return;
        var item = document.createElement("div");
        item.className = "badge-item";
        var badgeText = getBadgeText(def);
        item.innerHTML = getCollectionVisualHtml(def, def.icon) + '<div class="badge-name">' + escapeHtml(badgeText.name) + '</div><div class="badge-date">' + escapeHtml(formatCollectionDate(b.earnedAt, b.dateString)) + '</div>';
        item.title = badgeText.desc || badgeText.name;
        container.appendChild(item);
    });
}

function updateVisitList() {
    var container = document.getElementById("visit-list");
    if (!container) return;
    if (visitStamps.length === 0) { container.innerHTML = '<p class="empty-message">' + escapeHtml(collectionUiText("empty_visits")) + '</p>'; return; }
    container.innerHTML = "";
    visitStamps.slice().sort(function(a,b){ return b.visitedAt - a.visitedAt; }).forEach(function(v) {
        var icon = getVisitTypeLabel(v);
        var el = document.createElement("div");
        el.className = "visit-item";
        el.innerHTML = '<div class="visit-icon">' + escapeHtml(icon) + '</div><div class="visit-info"><div class="visit-name">' + escapeHtml(getVisitDisplayName(v)) + '</div><div class="visit-date">' + escapeHtml(formatCollectionDate(v.visitedAt, v.dateString)) + '</div></div>';
        el.addEventListener("click", function() { focusVisitedPlace(v); });
        container.appendChild(el);
    });
}

function focusVisitedPlace(visit) {
    if (!visit || !isFinite(Number(visit.lat)) || !isFinite(Number(visit.lng))) return;
    var lat = Number(visit.lat);
    var lng = Number(visit.lng);
    var name = String(getVisitDisplayName(visit));
    setSelectedDestination(lat, lng, name);
    if (selectedVisitMarker) map.removeLayer(selectedVisitMarker);
    selectedVisitMarker = L.marker([lat, lng], {
        pane: "visitedPlacePane",
        keyboard: true,
        title: name,
        zIndexOffset: 40,
        icon: L.divIcon({
            className: "visited-place-marker",
            html: '<span class="visited-place-marker-pulse"></span><span class="visited-place-marker-core"></span>',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        })
    }).addTo(map).bindTooltip(name, { direction:"top", offset:[0, -17], className:"visited-place-tooltip" });
    selectedVisitMarker.openTooltip();
    map.flyTo([lat, lng], 17, { animate:true, duration:0.65 });
    toggleSidebar(false);
}

function switchCollectionTab(tab) { switchAllTab(tab === "badge" ? "item" : tab); }

function refreshCollectionLanguageUI() {
    updateItemList();
    updateVisitList();
    var atlas = document.getElementById("region-badge-atlas");
    if (atlas && !atlas.hidden) renderRegionBadgeAtlas();
    var reload = document.getElementById("region-badge-atlas-reload-boundary");
    if (reload) reload.textContent = collectionUiText(reload.disabled ? "boundary_loading" : "boundary_reload");
    var recap = document.getElementById("journey-recap");
    if (recap && recap.classList.contains("open")) renderTodayJourneyRecap();
    var discovery = document.getElementById("discovery-toast");
    if (discovery && discovery.classList.contains("show")) renderDiscoveryRewardText();
    refreshGiloDialogueLanguage();
}

function showCollectionToast(msg) {
    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(20,20,35,0.95);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;white-space:nowrap;backdrop-filter:blur(10px);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2500);
}

// Bottom Gilo dialogue (kept independent from the tutorial/prologue systems).
const GILO_DIALOG_IMAGE = encodeURI("./gilo many appearance/gilo-tutorial-welcome-transparent.png");
const GILO_DIALOG_PAGE_IMAGES = [
    GILO_DIALOG_IMAGE,
    encodeURI("./gilo many appearance/gilo-tutorial-thumbs-transparent.png"),
    encodeURI("./gilo many appearance/gilo-tutorial-curious-transparent.png")
];
var giloDialogueState = { pages: [], index: 0, data: null, closeTimer: null };
var GILO_DIALOGUE_TEXT = {
    ko: { next: "다음 >", start: "시작하기", close: "대화 닫기" },
    en: { next: "Next >", start: "Start", close: "Close dialogue" },
    ja: { next: "次へ >", start: "はじめる", close: "会話を閉じる" },
    zh: { next: "下一步 >", start: "开始", close: "关闭对话" },
    es: { next: "Siguiente >", start: "Empezar", close: "Cerrar diálogo" },
    fr: { next: "Suivant >", start: "Commencer", close: "Fermer le dialogue" }
};
function getGiloDialogueLang() { var lang = typeof currentLang === "string" ? currentLang : document.documentElement.lang; lang = String(lang || "ko").toLowerCase().split("-")[0]; return GILO_DIALOGUE_TEXT[lang] ? lang : "en"; }
function resolveGiloDialogueValue(value) { if (value === null || value === undefined) return ""; if (typeof value !== "object") return String(value); var lang = getGiloDialogueLang(); return String(value[lang] || value.ko || value.en || value.ja || value.zh || ""); }
function updateGiloDialogueClearance() {
    var layer = document.getElementById("gilo-dialogue-layer"), controls = document.getElementById("controls");
    if (!layer || !controls) return;
    var rect = controls.getBoundingClientRect();
    layer.style.setProperty("--gilo-dialogue-controls-clearance", Math.max(90, Math.ceil(window.innerWidth - rect.left + 12)) + "px");
}
function renderGiloDialoguePage() {
    var state = giloDialogueState, data = state.data || {}, copy = document.getElementById("gilo-dialogue-copy"), name = document.getElementById("gilo-dialogue-name"), next = document.getElementById("gilo-dialogue-next"), close = document.getElementById("gilo-dialogue-close"), progress = document.getElementById("gilo-dialogue-progress"), image = document.getElementById("gilo-dialogue-character"), box = document.getElementById("gilo-dialogue-box");
    if (!copy || !next) return;
    var labels = GILO_DIALOGUE_TEXT[getGiloDialogueLang()];
    name.textContent = resolveGiloDialogueValue(data.name || "Gilo");
    copy.textContent = resolveGiloDialogueValue(state.pages[state.index]);
    next.textContent = resolveGiloDialogueValue(state.index >= state.pages.length - 1 ? (data.finalLabel || labels.start) : (data.nextLabel || labels.next));
    next.setAttribute("aria-label", next.textContent.replace(" >", ""));
    close.setAttribute("aria-label", resolveGiloDialogueValue(data.closeLabel || labels.close));
    progress.textContent = state.pages.length > 1 ? (state.index + 1) + " / " + state.pages.length : "";
    if (image && Array.isArray(data.images) && data.images.length) {
        image.onload = function() { if (box) box.classList.remove("image-fallback"); };
        image.onerror = function() { if (box) box.classList.add("image-fallback"); };
        image.src = data.images[state.index] || data.images[data.images.length - 1] || GILO_DIALOG_IMAGE;
    }
}
function showGiloDialogue(dialogueData) {
    var layer = document.getElementById("gilo-dialogue-layer"), box = document.getElementById("gilo-dialogue-box"), image = document.getElementById("gilo-dialogue-character"), hud = document.getElementById("hud");
    if (!layer || !box || !image) return;
    var data = dialogueData || {}, pages = Array.isArray(data.pages) ? data.pages.slice() : [];
    if (!pages.length) pages = [data.text || ""];
    if (giloDialogueState.closeTimer) clearTimeout(giloDialogueState.closeTimer);
    giloDialogueState = { pages: pages, index: 0, data: data, closeTimer: null };
    box.classList.remove("image-fallback");
    image.onerror = function() { box.classList.add("image-fallback"); image.removeAttribute("src"); };
    image.onload = function() { box.classList.remove("image-fallback"); };
    image.src = data.image || GILO_DIALOG_IMAGE;
    renderGiloDialoguePage(); updateGiloDialogueClearance();
    layer.setAttribute("aria-hidden", "false");
    if (hud) hud.classList.add("gilo-dialogue-hud-hidden");
    requestAnimationFrame(function() { layer.classList.add("is-open"); });
}
function hideGiloDialogue() {
    var layer = document.getElementById("gilo-dialogue-layer"), hud = document.getElementById("hud");
    if (!layer) return;
    layer.classList.remove("is-open"); layer.setAttribute("aria-hidden", "true");
    if (hud) hud.classList.remove("gilo-dialogue-hud-hidden");
    giloDialogueState.closeTimer = setTimeout(function() { giloDialogueState.closeTimer = null; }, 250);
}
function nextGiloDialogue(event) {
    // Inline handling keeps this action reliable even if a map/UI listener
    // is registered after the dialogue module.
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    var pageCount = giloDialogueState.pages.length;
    if (!pageCount || giloDialogueState.index >= pageCount - 1) {
        var onComplete = giloDialogueState.data && giloDialogueState.data.onComplete;
        hideGiloDialogue();
        if (typeof onComplete === "function") setTimeout(function() { try { onComplete(); } catch (error) { console.warn("Gilo dialogue completion failed", error); } }, 260);
        return false;
    }
    giloDialogueState.index = Math.min(giloDialogueState.index + 1, pageCount - 1);
    renderGiloDialoguePage();
    return false;
}
function refreshGiloDialogueLanguage() { var layer = document.getElementById("gilo-dialogue-layer"); if (layer && layer.classList.contains("is-open")) renderGiloDialoguePage(); }
(function initGiloDialogue() {
    var close = document.getElementById("gilo-dialogue-close"), next = document.getElementById("gilo-dialogue-next"), box = document.getElementById("gilo-dialogue-box");
    if (!close || !next) return;
    // The dialogue sits over the map and the combined location/record control.
    // Keep its button interactions inside the dialogue so a tap cannot also
    // trigger a map click or location refresh behind it.
    function consumeDialogueEvent(event) {
        if (!event) return;
        event.preventDefault();
        event.stopPropagation();
    }
    if (box) {
        box.addEventListener("pointerdown", function(event) { event.stopPropagation(); });
        box.addEventListener("click", function(event) { event.stopPropagation(); });
    }
close.addEventListener("click", function(event) {
    consumeDialogueEvent(event);
    hideGiloDialogue();
});

window.addEventListener("resize", updateGiloDialogueClearance);
window.addEventListener("orientationchange", updateGiloDialogueClearance);

setTimeout(function() {
    showGiloDialogue({
        image: GILO_DIALOG_IMAGE,
        images: GILO_DIALOG_PAGE_IMAGES,
        name: "Gilo",
        pages: [
            {
                ko: "안녕! 나는 길로야.",
                en: "Hi! I'm Gilo.",
                ja: "こんにちは！ぼくはギロだよ。",
                zh: "你好！我是Gilo。",
                es: "¡Hola! Soy Gilo.",
                fr: "Bonjour ! Je suis Gilo."
            },
            {
                ko: "오늘은 어떤 모험이 기다리고 있을까?",
                en: "What kind of adventure awaits us today?",
                ja: "今日はどんな冒険が待っているかな？",
                zh: "今天会有什么样的冒险等着我们呢？",
                es: "¿Qué aventura nos espera hoy?",
                fr: "Quelle aventure nous attend aujourd’hui ?"
            },
            {
                ko: "지도를 탐험하며 새로운 장소를 찾아보자!",
                en: "Let's explore the map and discover new places!",
                ja: "地図を探検して、新しい場所を見つけよう！",
                zh: "一起探索地图，发现新的地点吧！",
                es: "¡Exploremos el mapa y descubramos nuevos lugares!",
                fr: "Explorons la carte et découvrons de nouveaux lieux !"
            }
        ]
    });
}, 450);

})();

// 방향 부채꼴 표시
var visionCone = null;
var visionLine = null;
function updateVisionCone(latlng) {
    if (visionCone) { map.removeLayer(visionCone); visionCone = null; }
    if (visionLine) { map.removeLayer(visionLine); visionLine = null; }
    // Position updates also request this repaint, so compare sensor jitter
    // against the latest requested direction rather than an older sensor value.
    deviceHeadingLastRendered = typeof playerHeading === "number" && isFinite(playerHeading) ? playerHeading : null;
    deviceHeadingLastRenderTime = performance.now();
    scheduleRender();
}
function bearingBetween(from, to) {
    var lat1 = from.lat * Math.PI / 180; var lat2 = to.lat * Math.PI / 180;
    var dLng = (to.lng - from.lng) * Math.PI / 180;
    var y = Math.sin(dLng) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function destPoint(center, angleDeg, distanceM) {
    var R = 6371000; var lat1 = center[0] * Math.PI / 180; var lng1 = center[1] * Math.PI / 180; var brng = angleDeg * Math.PI / 180; var d = distanceM / R;
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    var lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
}

// Independent, read-only facing UI. Do not feed this heading into playerHeading,
// updateVisionCone or renderVisionFogClear: those also affect photos and fog.
(function initGiloaViewConeUI() {
    "use strict";
    if (window.giloaViewConeUI) return;
    const VIEW_CONE_ANGLE = 70; // Degrees; adjustable independently of fog vision.
    const VIEW_CONE_DISTANCE_M = 90;
    const VIEW_CONE_MIN_PX = 24;
    const VIEW_CONE_MAX_PX = 135;
    const VIEW_CONE_FRAME_MS = 1000 / 15;
    const VIEW_CONE_SMOOTH_MS = 100;
    const VIEW_CONE_HEADING_TTL_MS = 10000;
    var coneMap, coneCanvas, viewConeLayer, observedMarker;
    // location-ready currently has no independent GPS course/speed. Do not use
    // the shared playerHeading or invent a bearing from noisy position deltas.
    var sample = null, displayedHeading = null, lastFrameTime = 0;
    var frameId = 0, frameTimer = 0, staleTimer = 0;
    var sensorAttached = false, disposed = false;
    var diagnosticError = null, displayIssue = null, lastHeadingAt = null, headingExpired = false;

    function getStatus() {
        var status, reason, hasLocation = false;
        var age = lastHeadingAt === null ? null : Math.max(0, performance.now() - lastHeadingAt);
        try { hasLocation = !!(coneMap && readMarkerPosition()); }
        catch (error) { return Object.freeze({ status: "error", reason: "marker-unavailable", visible: false }); }
        if (diagnosticError) { status = "error"; reason = diagnosticError; }
        else if (disposed) { status = "hidden"; reason = "disposed"; }
        else if (!coneMap || !window.L) { status = "unsupported"; reason = "map-unavailable"; }
        else if (!window.DeviceOrientationEvent) { status = "unsupported"; reason = "orientation-unavailable"; }
        else if (document.hidden) { status = "hidden"; reason = "document-hidden"; }
        else if (!hasLocation) { status = "waiting-location"; reason = "current-marker-unavailable"; }
        else if (headingExpired || (age !== null && age >= VIEW_CONE_HEADING_TTL_MS)) { status = "stale"; reason = "heading-expired"; }
        else if (!sample) { status = "waiting-heading"; reason = "absolute-heading-required"; }
        else if (displayIssue) { status = "error"; reason = displayIssue; }
        else if (!coneCanvas || coneCanvas.hidden || !viewConeLayer || !coneMap.hasLayer(viewConeLayer)) { status = "hidden"; reason = "awaiting-frame"; }
        else { status = "visible"; reason = "ready"; }
        return Object.freeze({
            status: status, reason: reason, visible: status === "visible",
            sensorSupported: !!window.DeviceOrientationEvent, sensorAttached: sensorAttached,
            permissionRequired: !!(window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function"),
            hasLocation: hasLocation, headingAgeMs: age
        });
    }

    function finiteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }
    function wrapAngle(value) { return (value % 360 + 360) % 360; }
    function shortestTurn(from, to) { return (to - from + 540) % 360 - 180; }
    function screenAngle() {
        var angle = window.screen && window.screen.orientation && window.screen.orientation.angle;
        return finiteNumber(angle) ? angle : (finiteNumber(window.orientation) ? window.orientation : 0);
    }
    function safely(fn) {
        return function() {
            if (disposed) return;
            try { return fn.apply(null, arguments); }
            catch (error) {
                diagnosticError = String(error && error.message || "facing-ui-error");
                dispose();
                console.warn("GILOA facing UI unavailable", error);
            }
        };
    }
    function clearPendingFrames() {
        if (frameId) cancelAnimationFrame(frameId);
        if (frameTimer) clearTimeout(frameTimer);
        frameId = frameTimer = 0;
    }
    function hideCone() {
        if (coneCanvas) coneCanvas.hidden = true;
        displayedHeading = null;
        lastFrameTime = 0;
        clearPendingFrames();
    }
    function readMarkerPosition() {
        if (!observedMarker || !coneMap.hasLayer(observedMarker)) return null;
        var point = observedMarker.getLatLng();
        return point && finiteNumber(point.lat) && finiteNumber(point.lng) ? point : null;
    }
    function makeConeCanvas() {
        var canvas = document.createElement("canvas");
        canvas.className = "giloa-view-cone";
        canvas.hidden = true;
        canvas.setAttribute("aria-hidden", "true");
        canvas.width = canvas.height = 384;
        var context = canvas.getContext("2d");
        if (!context) throw new Error("Facing canvas unavailable");
        var radius = canvas.width / 2;
        var gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
        gradient.addColorStop(0, "rgba(79,195,247,0.14)");
        gradient.addColorStop(0.5, "rgba(79,195,247,0.08)");
        gradient.addColorStop(0.82, "rgba(79,195,247,0.02)");
        gradient.addColorStop(1, "rgba(79,195,247,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Feather both angular edges, not just the far edge. Build the small
        // bitmap once; sensor updates only rotate/position this canvas.
        var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
                var angle = Math.abs(Math.atan2(x + 0.5 - radius, radius - y - 0.5) * 180 / Math.PI);
                var fade = Math.max(0, Math.min(1, (VIEW_CONE_ANGLE / 2 - angle) / 8));
                pixels.data[(y * canvas.width + x) * 4 + 3] *= fade * fade * (3 - 2 * fade);
            }
        }
        context.putImageData(pixels, 0, 0);
        return canvas;
    }
    function positionCone() {
        displayIssue = null;
        var point = readMarkerPosition();
        if (!point) { hideCone(); return false; }
        if (!coneCanvas) coneCanvas = makeConeCanvas();
        if (!viewConeLayer) {
            var pane = coneMap.getPane("viewConePane") || coneMap.createPane("viewConePane");
            pane.style.zIndex = "590"; // fog 450 < cone < default markers 600 / photos 630 / player 690
            pane.style.pointerEvents = "none";
            viewConeLayer = L.marker(point, {
                pane: "viewConePane", interactive: false, keyboard: false,
                icon: L.divIcon({ className: "giloa-view-cone-anchor", html: coneCanvas, iconSize: [0, 0], iconAnchor: [0, 0] })
            }).addTo(coneMap);
        } else {
            viewConeLayer.setLatLng(point);
        }
        var center = coneMap.latLngToContainerPoint(point);
        var next = coneMap.containerPointToLatLng(L.point(center.x + 1, center.y));
        var metersPerPixel = coneMap.distance(point, next);
        if (!finiteNumber(metersPerPixel) || metersPerPixel <= 0) { displayIssue = "invalid-map-scale"; hideCone(); return false; }
        var radius = Math.max(VIEW_CONE_MIN_PX, Math.min(VIEW_CONE_MAX_PX, VIEW_CONE_DISTANCE_M / metersPerPixel));
        coneCanvas.style.width = coneCanvas.style.height = (radius * 2) + "px";
        coneCanvas.style.left = coneCanvas.style.top = (-radius) + "px";
        return true;
    }
    function queueFrame() {
        if (disposed || document.hidden || frameId || frameTimer) return;
        var delay = Math.max(0, VIEW_CONE_FRAME_MS - (performance.now() - lastFrameTime));
        frameTimer = setTimeout(safely(function() {
            frameTimer = 0;
            frameId = requestAnimationFrame(drawFrame);
        }), delay);
    }
    var drawFrame = safely(function(time) {
        frameId = 0;
        if (document.hidden || !sample || performance.now() - sample.time > VIEW_CONE_HEADING_TTL_MS || !readMarkerPosition()) {
            hideCone(); return;
        }
        if (!coneCanvas || !viewConeLayer || displayIssue) { if (!positionCone()) return; }
        var delta = displayedHeading === null ? 0 : shortestTurn(wrapAngle(displayedHeading), sample.heading);
        if (displayedHeading === null) displayedHeading = sample.heading;
        else {
            var elapsed = Math.max(1, time - lastFrameTime);
            displayedHeading += delta * (1 - Math.exp(-elapsed / VIEW_CONE_SMOOTH_MS));
            if (Math.abs(delta) < 0.15) displayedHeading += shortestTurn(wrapAngle(displayedHeading), sample.heading);
        }
        lastFrameTime = time;
        coneCanvas.style.transform = "rotate(" + displayedHeading + "deg)";
        coneCanvas.hidden = false;
        if (Math.abs(shortestTurn(wrapAngle(displayedHeading), sample.heading)) >= 0.15) queueFrame();
    });
    var expireHeading = safely(function() {
        staleTimer = 0;
        if (!sample || document.hidden) return;
        var remaining = VIEW_CONE_HEADING_TTL_MS - (performance.now() - sample.time);
        if (remaining > 0) staleTimer = setTimeout(expireHeading, remaining + 1);
        else { headingExpired = true; sample = null; hideCone(); }
    });
    var onHeading = safely(function(event) {
        if (document.hidden) return;
        var heading;
        if (finiteNumber(event.webkitCompassHeading)) {
            if (finiteNumber(event.webkitCompassAccuracy) && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 50)) return;
            heading = event.webkitCompassHeading + screenAngle();
        } else if ((event.absolute === true || event.type === "deviceorientationabsolute") && finiteNumber(event.alpha)) {
            heading = 360 - event.alpha + screenAngle();
        } else return; // Relative alpha, null and NaN are not a north heading.
        sample = { heading: wrapAngle(heading), time: performance.now() };
        lastHeadingAt = sample.time;
        headingExpired = false;
        if (!staleTimer) staleTimer = setTimeout(expireHeading, VIEW_CONE_HEADING_TTL_MS + 1);
        queueFrame();
    });
    function attachSensor() {
        if (sensorAttached || document.hidden || !window.DeviceOrientationEvent) return;
        // Listening itself never prompts. iOS permission is already requested
        // by the existing recording-button flow; do not request it a second time.
        window.addEventListener("deviceorientationabsolute", onHeading, { passive: true });
        window.addEventListener("deviceorientation", onHeading, { passive: true });
        sensorAttached = true;
    }
    function detachSensor() {
        window.removeEventListener("deviceorientationabsolute", onHeading);
        window.removeEventListener("deviceorientation", onHeading);
        sensorAttached = false;
    }
    var onMarkerMove = safely(function() {
        if (document.hidden) return;
        if (positionCone()) queueFrame();
    });
    var onLocationReady = safely(function() {
        var marker = typeof playerMarker !== "undefined" ? playerMarker : null;
        if (marker !== observedMarker) {
            if (observedMarker) observedMarker.off("move add remove", onMarkerMove);
            observedMarker = marker;
            if (observedMarker) observedMarker.on("move add remove", onMarkerMove);
        }
        onMarkerMove();
    });
    var onResume = safely(function() {
        sample = null;
        lastHeadingAt = null;
        headingExpired = false;
        if (staleTimer) clearTimeout(staleTimer);
        staleTimer = 0;
        hideCone();
        if (document.hidden) detachSensor();
        else { attachSensor(); onLocationReady(); } // Wait for a fresh sensor reading.
    });
    function dispose() {
        if (disposed) return;
        disposed = true;
        // Only this UI's listeners/timers/layer are removed. Never touch GPS.
        try {
            hideCone();
            if (staleTimer) clearTimeout(staleTimer);
            detachSensor();
            if (observedMarker) observedMarker.off("move add remove", onMarkerMove);
            if (coneMap) {
                coneMap.off("zoomend resize", onMarkerMove);
                coneMap.off("unload", dispose);
                if (viewConeLayer) coneMap.removeLayer(viewConeLayer);
            }
            window.removeEventListener("giloa:location-ready", onLocationReady);
            window.removeEventListener("giloa:app-resume", onResume);
            window.removeEventListener("orientationchange", onResume);
            window.removeEventListener("pageshow", onResume);
            document.removeEventListener("visibilitychange", onResume);
        } catch (_) { /* A display failure must never escape into the app. */ }
    }
    try {
        coneMap = typeof map !== "undefined" ? map : null;
        window.giloaViewConeUI = { dispose: dispose, getStatus: getStatus };
        if (!coneMap || !window.L) return;
        coneMap.on("zoomend resize", onMarkerMove);
        coneMap.on("unload", dispose);
        window.addEventListener("giloa:location-ready", onLocationReady);
        window.addEventListener("giloa:app-resume", onResume);
        window.addEventListener("orientationchange", onResume);
        window.addEventListener("pageshow", onResume);
        document.addEventListener("visibilitychange", onResume);
        attachSensor();
        onLocationReady();
    } catch (error) {
        diagnosticError = String(error && error.message || "facing-ui-initialization-error");
        dispose();
        console.warn("GILOA facing UI initialization skipped", error);
    }
})();

// Supplemental static copy. Keep text nodes separate from icons, controls and stored content.
var STATIC_EXTRA_I18N = (function() {
    var rows = {
        pageTitle:["나의 대동여지도 - Project Giloa","My Journey Map - Project Giloa","私だけの旅地図 - Project Giloa","我的旅行地图 - Project Giloa","Mi mapa de viajes - Project Giloa","Ma carte de voyage - Project Giloa"],
        brandLabel:["GILOA 나의 대동여지도","GILOA · My Journey Map","GILOA · 私だけの旅地図","GILOA · 我的旅行地图","GILOA · Mi mapa de viajes","GILOA · Ma carte de voyage"],
        brandSubtitle:["나의 대동여지도","My Journey Map","私だけの旅地図","我的旅行地图","Mi mapa de viajes","Ma carte de voyage"],
        close:["닫기","Close","閉じる","关闭","Cerrar","Fermer"],
        closeSources:["출처 닫기","Close credits","出典を閉じる","关闭来源","Cerrar fuentes","Fermer les sources"],
        closeIntro:["온보딩 닫기","Close introduction","紹介を閉じる","关闭介绍","Cerrar introducción","Fermer la présentation"],
        sources:["출처","Credits","出典","来源","Fuentes","Sources"],
        sourcesTitle:["길로아 출처","GILOA credits","GILOAの出典","GILOA 数据来源","Fuentes de GILOA","Sources de GILOA"],
        sourcesIntro:["길로아의 ‘나의 대동여지도’에는 다음 기관과 서비스의 데이터가 사용됩니다.","GILOA's My Journey Map uses data from the following organizations and services.","GILOAの「私だけの旅地図」は、以下の機関とサービスのデータを使用しています。","GILOA 的“我的旅行地图”使用以下机构和服务提供的数据。","Mi mapa de viajes de GILOA utiliza datos de las siguientes organizaciones y servicios.","Ma carte de voyage de GILOA utilise les données des organismes et services suivants."],
        sourceTourismCredit:["출처: ⓒ한국관광공사","Source: ⓒ Korea Tourism Organization","出典：ⓒ韓国観光公社","来源：ⓒ韩国观光公社","Fuente: ⓒ Organización de Turismo de Corea","Source : ⓒ Office du tourisme de Corée"],
        sourceTourism:["ⓒ한국관광공사 TourAPI","ⓒ Korea Tourism Organization TourAPI","ⓒ韓国観光公社 TourAPI","ⓒ韩国观光公社 TourAPI","ⓒ Organización de Turismo de Corea TourAPI","ⓒ Office du tourisme de Corée TourAPI"],
        sourceSeoul:["서울 열린데이터광장","Seoul Open Data Plaza","ソウル開放データ広場","首尔开放数据广场","Portal de datos abiertos de Seúl","Portail des données ouvertes de Séoul"],
        sourceRestrooms:["서울 열린데이터광장 · 카카오맵","Seoul Open Data Plaza · KakaoMap","ソウル開放データ広場 · KakaoMap","首尔开放数据广场 · KakaoMap","Datos abiertos de Seúl · KakaoMap","Données ouvertes de Séoul · KakaoMap"],
        sourceParking:["공공데이터포털 · 전국주차장정보표준데이터","Korea Public Data Portal · National Parking Information Standard Data","韓国公共データポータル · 全国駐車場情報標準データ","韩国公共数据门户 · 全国停车场信息标准数据","Portal de datos públicos de Corea · Datos nacionales normalizados de aparcamientos","Portail des données publiques de Corée · Données nationales normalisées sur les parkings"],
        sourceFishing:["행정안전부 · 전국 낚시터정보","Ministry of the Interior and Safety · National Fishing Site Information","韓国行政安全部 · 全国釣り場情報","韩国行政安全部 · 全国垂钓场信息","Ministerio del Interior y Seguridad de Corea · Información nacional de lugares de pesca","Ministère coréen de l’Intérieur et de la Sécurité · Informations nationales sur les sites de pêche"],
        sourceCamping:["한국관광공사 · 고캠핑","Korea Tourism Organization · GoCamping","韓国観光公社 · GoCamping","韩国观光公社 · GoCamping","Organización de Turismo de Corea · GoCamping","Office du tourisme coréen · GoCamping"],
        sourceTrails:["한국관광공사 두루누비 · 한국등산·트레킹지원센터 국가숲길","Korea Tourism Organization Durunubi · Korea Mountaineering Support Center National Forest Trails","韓国観光公社ドゥルヌビ · 韓国登山・トレッキング支援センター国家森林トレイル","韩国观光公社 Durunubi · 韩国登山徒步支援中心国家森林步道","Durunubi de la Organización de Turismo de Corea · Senderos forestales nacionales del Centro Coreano de Montañismo","Durunubi de l’Office du tourisme de Corée · Sentiers forestiers nationaux du Centre coréen de randonnée"],
        sourceTourismTypes:["관광지 · 음식점 · 숙박 · 축제 · 관광사진","Sights · Restaurants · Lodging · Festivals · Tourism photos","観光地 · 飲食店 · 宿泊 · 祭り · 観光写真","景点 · 餐厅 · 住宿 · 节庆 · 旅游照片","Lugares · Restaurantes · Alojamiento · Festivales · Fotos turísticas","Sites · Restaurants · Hébergements · Festivals · Photos touristiques"],
        sourceTrailsType:["공식 탐방로","Official trails","公式トレイル","官方步道","Rutas oficiales","Itinéraires officiels"],
        sourceFacilitiesTypes:["도서관 · 공중화장실","Libraries · Public restrooms","図書館 · 公衆トイレ","图书馆 · 公共卫生间","Bibliotecas · Baños públicos","Bibliothèques · Toilettes publiques"],
        sourceParkingType:["주차장","Parking","駐車場","停车场","Aparcamientos","Parkings"],
        sourceFishingType:["낚시터","Fishing sites","釣り場","垂钓场","Lugares de pesca","Sites de pêche"],
        sourceDirectionsTypes:["장소 검색 · 교통정보 · 길찾기","Place search · Traffic · Directions","場所検索 · 交通情報 · 経路案内","地点搜索 · 交通信息 · 路线导航","Búsqueda de lugares · Tráfico · Indicaciones","Recherche de lieux · Trafic · Itinéraires"],
        sourceKakao:["카카오맵","KakaoMap","KakaoMap","KakaoMap","KakaoMap","KakaoMap"],
        sourceMapType:["기본 지도","Base map","ベースマップ","底图","Mapa base","Fond de carte"],
        sourceMap:["ⓒ OpenStreetMap contributors · ⓒ CARTO","ⓒ OpenStreetMap contributors · ⓒ CARTO","ⓒ OpenStreetMap contributors · ⓒ CARTO","ⓒ OpenStreetMap contributors · ⓒ CARTO","ⓒ OpenStreetMap contributors · ⓒ CARTO","ⓒ OpenStreetMap contributors · ⓒ CARTO"],
        sourceMascotsType:["지역 마스코트·캐릭터","Regional mascots and characters","地域のマスコット・キャラクター","地方吉祥物与角色","Mascotas y personajes regionales","Mascottes et personnages régionaux"],
        sourceMascots:["포미·포수 ⓒ 김포시<br>고양고양이 ⓒ 고양특례시","Pomi · Posu ⓒ Gimpo City<br>Goyang Goyangi ⓒ Goyang Special City","ポミ・ポス ⓒ 金浦市<br>コヤンコヤンイ ⓒ 高陽特例市","Pomi · Posu ⓒ 金浦市<br>Goyang Goyangi ⓒ 高阳特例市","Pomi · Posu ⓒ Ciudad de Gimpo<br>Goyang Goyangi ⓒ Ciudad especial de Goyang","Pomi · Posu ⓒ Ville de Gimpo<br>Goyang Goyangi ⓒ Ville spéciale de Goyang"],
        sourcesNote:["지역 마스코트와 캐릭터의 명칭·이미지 저작권은 각 지자체에 있습니다. 그 밖의 데이터 저작권은 해당 제공기관과 원저작자에게 있으며, 사진 등 개별 콘텐츠에는 별도의 출처가 표시될 수 있습니다.","Names and images of regional mascots and characters belong to their respective local governments. Other data rights belong to the providers and original creators. Individual content, including photos, may carry separate credits.","地域のマスコットやキャラクターの名称・画像の著作権は各自治体に帰属します。その他のデータの権利は提供機関および原著作者に帰属し、写真などの個別コンテンツには別途出典が表示される場合があります。","地方吉祥物及角色的名称、图片版权归各地方政府所有。其他数据的版权归提供机构及原作者所有。照片等具体内容可能另附来源说明。","Los nombres e imágenes de mascotas y personajes regionales pertenecen a sus respectivos gobiernos locales. Los derechos de los demás datos pertenecen a sus proveedores y autores originales. Las fotos y otros contenidos pueden incluir créditos específicos.","Les noms et images des mascottes et personnages régionaux appartiennent aux collectivités concernées. Les autres données appartiennent à leurs fournisseurs et auteurs d’origine. Les photos et autres contenus peuvent comporter des crédits distincts."],
        dataPreparing:["데이터 준비중","Data coming soon","データ準備中","数据准备中","Datos en preparación","Données en préparation"],
        updateTitle:["길로아가 더 단단해졌어요","GILOA is now more reliable","GILOAがもっと頼もしくなりました","GILOA 更加稳定了","GILOA ahora es más fiable","GILOA est désormais plus fiable"],
        updateIntro:["당신의 기록을 오래 지키고, 사진과 발걸음을 더 정확히 남길 수 있도록 다듬었습니다.","We improved GILOA to protect your records over time and record your photos and footsteps more accurately.","大切な記録を長く守り、写真や足跡をより正確に残せるよう改善しました。","我们进行了改进，让你的记录保存得更久，照片和足迹记录得更准确。","Hemos mejorado GILOA para proteger tus recuerdos y registrar tus fotos y pasos con mayor precisión.","Nous avons amélioré GILOA pour préserver vos souvenirs et enregistrer plus précisément vos photos et vos pas."],
        updatePhotoTitle:["사진 위치 자동 기록","Automatic photo locations","写真の位置を自動記録","自动记录照片位置","Ubicación automática de fotos","Localisation automatique des photos"],
        updatePhotoCopy:["휴대폰 사진의 촬영 위치를 찾아 지도 위에 놓아요.","Finds where your phone photos were taken and places them on the map.","スマートフォンの写真の撮影場所を読み取り、地図に配置します。","读取手机照片的拍摄位置，并放到地图上。","Lee dónde se tomaron las fotos del móvil y las coloca en el mapa.","Retrouve le lieu de prise de vue des photos de votre téléphone et les place sur la carte."],
        updateGpsTitle:["안정적인 발걸음","More reliable footsteps","安定した足跡の記録","更稳定的足迹记录","Pasos más fiables","Des pas mieux enregistrés"],
        updateGpsCopy:["GPS가 갑자기 튀어도 이동 거리로 잘못 기록되지 않게 했어요.","Sudden GPS jumps are prevented from being counted as distance traveled.","GPSの突然の位置ずれを移動距離として誤記録しないようにしました。","防止 GPS 突然漂移被误记为移动距离。","Evita que los saltos repentinos del GPS se cuenten como distancia recorrida.","Évite de compter les sauts soudains du GPS comme de la distance parcourue."],
        updateRecordsTitle:["기록 이중 보호","Double protection for records","記録を二重に保護","双重保护记录","Doble protección de registros","Double protection des données"],
        updateRecordsCopy:["업데이트 뒤에도 경로·사진·기억·성장 기록을 안전하게 복원해요.","Safely restores routes, photos, memories and growth records after updates.","更新後もルート・写真・思い出・成長の記録を安全に復元します。","更新后也能安全恢复路线、照片、记忆和成长记录。","Restaura de forma segura rutas, fotos, recuerdos y progreso tras las actualizaciones.","Restaure les itinéraires, photos, souvenirs et progrès en toute sécurité après les mises à jour."],
        updateMapTitle:["정돈된 지도 화면","A clearer map screen","見やすい地図画面","更清晰的地图界面","Un mapa más claro","Une carte plus lisible"],
        updateMapCopy:["길로의 한마디와 컨트롤이 겹치지 않고, 데이터 출처도 한곳에서 확인할 수 있어요.","Gilo's messages no longer overlap the controls, and data credits are available in one place.","ギロのメッセージと操作ボタンが重ならず、データの出典も一か所で確認できます。","Gilo 的话语不再遮挡控件，数据来源也能集中查看。","Los mensajes de Gilo no se superponen a los controles y las fuentes de datos están reunidas en un solo lugar.","Les messages de Gilo ne recouvrent plus les commandes et les sources de données sont regroupées au même endroit."],
        updateDismiss:["화면을 탭하면 시작해요","Tap the screen to start","画面をタップして始めよう","轻触屏幕开始","Toca la pantalla para empezar","Touchez l’écran pour commencer"],
        storyTitle:["길로아 이야기","The GILOA story","GILOAの物語","GILOA 的故事","La historia de GILOA","L’histoire de GILOA"],
        storyIntro:["아직 만나지 못한 세상을 당신만의 대동여지도로 만들어 가는 이야기입니다.","A story of turning the world you have yet to discover into your own journey map.","まだ出会っていない世界を、あなただけの旅地図にしていく物語です。","这是一个把尚未相遇的世界变成专属旅行地图的故事。","Una historia sobre cómo convertir el mundo que aún no conoces en tu propio mapa de viajes.","Une histoire pour transformer le monde encore inconnu en votre propre carte de voyage."],
        storyReplay:["길로아 이야기 다시 보기","Replay the GILOA story","GILOAの物語をもう一度見る","重温 GILOA 的故事","Volver a ver la historia de GILOA","Revoir l’histoire de GILOA"],
        storyUpdatePhoto:["휴대폰 사진의 촬영 위치를 읽어 지도에 자동 배치","Read photo locations and place phone photos on the map automatically","写真の撮影場所を読み取り、地図に自動配置","读取手机照片的拍摄位置并自动放到地图上","Lee la ubicación de las fotos del móvil y las coloca automáticamente en el mapa","Lit le lieu des photos du téléphone et les place automatiquement sur la carte"],
        storyUpdateGps:["GPS 위치 튐과 잘못된 이동 거리 기록 방지","Prevent GPS jumps and incorrect distance records","GPSの位置ずれと移動距離の誤記録を防止","防止 GPS 漂移和错误的移动距离记录","Evita saltos del GPS y registros de distancia incorrectos","Évite les sauts du GPS et les distances incorrectes"],
        storyUpdateRecords:["업데이트 후 사용자 기록 이중 백업 및 자동 복원","Double backup and automatic restoration of records after updates","更新後の記録を二重バックアップと自動復元で保護","更新后通过双重备份自动恢复用户记录","Doble copia de seguridad y restauración automática tras las actualizaciones","Double sauvegarde et restauration automatique après les mises à jour"],
        storyUpdateMap:["길로의 한마디 배치 개선과 데이터·지역 마스코트 출처 정리","Improved message placement and credits for data and regional mascots","ギロのメッセージ配置を改善し、データと地域マスコットの出典を整理","改善 Gilo 话语的位置，并整理数据及地方吉祥物来源","Mejora la ubicación de los mensajes y reúne las fuentes de datos y mascotas regionales","Améliore la position des messages et regroupe les crédits des données et mascottes régionales"],
        atlasTitle:["지역 뱃지 지도","Regional badge atlas","地域バッジマップ","地区徽章地图","Mapa de insignias regionales","Carte des badges régionaux"],
        atlasCopy:["지역을 방문해 GPS 기록을 쌓으면 황동색 틀에 그 지역의 뱃지가 채워져요.","Visit a region and build up GPS records to fill its brass frame with a regional badge.","地域を訪れてGPS記録を重ねると、真鍮色の枠にその地域のバッジが入ります。","到访各地区并积累 GPS 记录，就能在黄铜色框中获得当地徽章。","Visita una región y acumula registros GPS para llenar su marco de latón con una insignia regional.","Visitez une région et accumulez des relevés GPS pour remplir son cadre en laiton d’un badge régional."],
        atlasMapLabel:["대한민국 지역 뱃지 지도","Regional badge map of South Korea","韓国の地域バッジマップ","韩国地区徽章地图","Mapa de insignias regionales de Corea del Sur","Carte des badges régionaux de Corée du Sud"],
        reloadBoundary:["행정경계 다시 불러오기","Reload administrative boundaries","行政境界を再読み込み","重新加载行政边界","Recargar límites administrativos","Recharger les limites administratives"],
        loading:["불러오는 중...","Loading...","読み込み中...","加载中...","Cargando...","Chargement…"],
        addPhoto:["사진 추가","Add a photo","写真を追加","添加照片","Añadir foto","Ajouter une photo"],
        mission:["미션","Mission","ミッション","任务","Misión","Mission"],
        demoFeature:["시범 기능","Demo feature","試験機能","试用功能","Función de prueba","Fonction en essai"],
        helpMenu:["도움말 메뉴","Help menu","ヘルプメニュー","帮助菜单","Menú de ayuda","Menu d’aide"],
        changeLanguage:["언어 변경","Change language","言語を変更","更改语言","Cambiar idioma","Changer de langue"],
        openMenu:["메뉴 열기","Open menu","メニューを開く","打开菜单","Abrir menú","Ouvrir le menu"],
        openHud:["여행 상태 열기","Open travel status","旅のステータスを開く","打开旅行状态","Abrir estado del viaje","Ouvrir l’état du voyage"],
        travelGrowth:["실시간 여행 성장","Live travel growth","リアルタイムの旅の成長","实时旅行成长","Progreso del viaje en tiempo real","Progression du voyage en temps réel"],
        directions:["카카오맵 길찾기","KakaoMap directions","KakaoMapの経路案内","KakaoMap 路线导航","Indicaciones de KakaoMap","Itinéraire KakaoMap"],
        recapOpen:["오늘의 대동여지도 보기","View today's journey map","今日の旅地図を見る","查看今日旅行地图","Ver el mapa del viaje de hoy","Voir la carte du voyage d’aujourd’hui"],
        recapKicker:["오늘의 대동여지도","Today's journey map","今日の旅地図","今日旅行地图","El mapa del viaje de hoy","La carte du voyage d’aujourd’hui"],
        recapTitle:["오늘 하나의 여행을 완성했어요","You completed a journey today","今日、ひとつの旅ができました","今天你完成了一段旅程","Hoy has completado un viaje","Vous avez accompli un voyage aujourd’hui"],
        recapDistance:["걸은 거리","Distance walked","歩いた距離","步行距离","Distancia caminada","Distance parcourue"],
        recapDiscoveries:["새로운 발견","New discoveries","新しい発見","新发现","Nuevos descubrimientos","Nouvelles découvertes"],
        recapPhotos:["사진","Photos","写真","照片","Fotos","Photos"],
        recapMemories:["기억","Memories","思い出","记忆","Recuerdos","Souvenirs"],
        recapGrowth:["오늘 가장 많이 자란 여행색","Your strongest travel color today","今日いちばん育った旅の色","今日成长最多的旅行色彩","Tu color de viaje que más creció hoy","Votre couleur de voyage qui a le plus grandi aujourd’hui"],
        recapRoute:["오늘 걸은 길 전체 보기","View today's full route","今日歩いた道をすべて見る","查看今日完整路线","Ver toda la ruta de hoy","Voir tout l’itinéraire d’aujourd’hui"],
        gilo:["길로","Gilo","ギロ","Gilo","Gilo","Gilo"],
        guideIntro:["길로와 함께 아직 몰랐던 장소와 이야기를 발견해 보세요.","Discover places and stories you did not know with Gilo.","ギロと一緒に、まだ知らなかった場所や物語を見つけよう。","和 Gilo 一起发现还不知道的地点与故事。","Descubre con Gilo lugares e historias que aún no conocías.","Découvrez avec Gilo des lieux et des histoires encore inconnus."],
        guideLanguageTitle:["언어 선택","Choose your language","言語を選ぶ","选择语言","Elige tu idioma","Choisissez votre langue"],
        guideLanguageCopy:["상단에서 언어를 선택하면 화면의 안내 문구가 즉시 변경됩니다.","Choose a language at the top to update the on-screen guidance immediately.","上部で言語を選ぶと、画面の案内がすぐに切り替わります。","在顶部选择语言，界面提示会立即切换。","Selecciona un idioma en la parte superior para cambiar al instante las indicaciones en pantalla.","Choisissez une langue en haut pour changer immédiatement les indications à l’écran."],
        guidePlacesTitle:["주변 장소 미리보기","Preview nearby places","周辺の場所をチェック","预览附近地点","Explora los lugares cercanos","Découvrez les lieux à proximité"],
        guidePlacesCopy:["현재 위치 주변의 관광지, 음식점, 숙박, 화장실, 도서관과 산책로를 지도에서 찾아보세요.","Find sights, food, lodging, restrooms, libraries and trails around your current location on the map.","現在地の周りの観光地、飲食店、宿泊施設、トイレ、図書館、散策路を地図で探せます。","在地图上查找当前位置附近的景点、餐厅、住宿、卫生间、图书馆和步道。","Encuentra en el mapa lugares, restaurantes, alojamiento, baños, bibliotecas y senderos cerca de ti.","Trouvez sur la carte les sites, restaurants, hébergements, toilettes, bibliothèques et sentiers près de vous."],
        guideCardsTitle:["추천 장소 카드","Recommended place cards","おすすめの場所のカード","推荐地点卡片","Tarjetas de lugares recomendados","Fiches de lieux recommandés"],
        guideCardsCopy:["가까운 추천 장소를 카드로 미리 보고 새로운 목적지를 발견해 보세요.","Preview nearby recommendations on cards and discover your next destination.","近くのおすすめをカードで見て、次の目的地を見つけよう。","通过卡片预览附近推荐地点，发现下一个目的地。","Consulta las recomendaciones cercanas en tarjetas y descubre tu próximo destino.","Consultez les recommandations proches sur des fiches et découvrez votre prochaine destination."],
        guideFeaturesTitle:["핵심 기능 소개","Explore the main features","主な機能を知る","了解主要功能","Conoce las funciones principales","Découvrez les fonctions principales"],
        guideFeaturesCopy:["장소, 산책로, 지역 뱃지, 숨은 미션을 통해 주변을 여행해 보세요.","Explore your surroundings through places, trails, regional badges and hidden missions.","場所、散策路、地域バッジ、隠されたミッションを通じて周辺を旅しよう。","通过地点、步道、地区徽章和隐藏任务探索周围。","Explora tu entorno con lugares, senderos, insignias regionales y misiones ocultas.","Explorez les environs grâce aux lieux, sentiers, badges régionaux et missions cachées."],
        guidePlacesFeature:["주변 장소 발견 — 가까운 관광지와 생활 편의시설을 찾아보세요.","Places — Discover nearby sights and everyday facilities.","場所 — 近くの観光地や便利な施設を探そう。","地点 — 发现附近景点和生活设施。","Lugares — Descubre sitios y servicios cercanos.","Lieux — Découvrez les sites et les services à proximité."],
        guideTrailsFeature:["산책로 탐색 — 걷기 좋은 길을 찾아보세요.","Trails — Find enjoyable paths to walk.","散策路 — 歩くのが楽しい道を探そう。","步道 — 寻找适合散步的路线。","Senderos — Encuentra caminos agradables para caminar.","Sentiers — Trouvez des chemins agréables à parcourir."],
        guideBadgesFeature:["지역 뱃지 수집 — 각 지역의 특별한 뱃지를 모아보세요.","Badges — Collect special badges from each region.","バッジ — 各地域の特別なバッジを集めよう。","徽章 — 收集各地区的特别徽章。","Insignias — Colecciona las insignias especiales de cada región.","Badges — Collectionnez les badges propres à chaque région."],
        guideMissionsFeature:["숨은 미션 발견 — 지도 속에 숨은 이야기를 찾아보세요.","Missions — Discover stories hidden in the map.","ミッション — 地図に隠れた物語を見つけよう。","任务 — 发现隐藏在地图中的故事。","Misiones — Descubre historias escondidas en el mapa.","Missions — Découvrez les histoires cachées sur la carte."],
        guideStartTitle:["지도 시작하기","Start your map","地図を始める","开始你的地图","Empieza tu mapa","Commencez votre carte"],
        guideStartCopy:["시작 버튼을 한 번 누르면 바로 지도로 이동합니다.","Tap the start button once to open the map.","開始ボタンをタップすると、すぐに地図が開きます。","轻触开始按钮即可打开地图。","Toca el botón de inicio para abrir el mapa.","Touchez le bouton de démarrage pour ouvrir la carte."],
        guideStoryTitle:["길로 이야기","Gilo's story","ギロの物語","Gilo 的故事","La historia de Gilo","L’histoire de Gilo"],
        guideStoryCopy:["길로 이야기를 선택하면 길로가 여행 안내자가 된 이야기를 볼 수 있어요.","Choose Gilo's story to learn how Gilo became your travel guide.","ギロの物語を選ぶと、ギロが旅の案内人になった物語を見られます。","选择 Gilo 的故事，了解 Gilo 如何成为旅行向导。","Elige la historia de Gilo para descubrir cómo se convirtió en tu guía de viaje.","Choisissez l’histoire de Gilo pour découvrir comment il est devenu votre guide de voyage."]
    };
    var languages = ["ko", "en", "ja", "zh", "es", "fr"];
    var dictionary = {};
    languages.forEach(function(lang, index) {
        dictionary[lang] = {};
        Object.keys(rows).forEach(function(key) { dictionary[lang][key] = rows[key][index]; });
    });
    return dictionary;
})();

function applySupplementalStaticLanguage() {
    var lang = normalizeLang(currentLang);
    var words = STATIC_EXTRA_I18N[lang] || STATIC_EXTRA_I18N.ko;
    [
        ["data-i18n-extra", "textContent"],
        ["data-i18n-extra-html", "innerHTML"],
        ["data-i18n-extra-aria", "aria-label"],
        ["data-i18n-extra-title", "title"],
        ["data-i18n-extra-alt", "alt"]
    ].forEach(function(binding) {
        document.querySelectorAll("[" + binding[0] + "]").forEach(function(element) {
            var value = words[element.getAttribute(binding[0])];
            if (typeof value !== "string") return;
            if (binding[1] === "textContent" || binding[1] === "innerHTML") element[binding[1]] = value;
            else element.setAttribute(binding[1], value);
        });
    });
    var photoButton = document.getElementById("photo-btn");
    if (photoButton) photoButton.setAttribute("data-mission-label", words.mission);
    var trafficButton = document.getElementById("traffic-btn");
    if (trafficButton) { trafficButton.title = words.directions; trafficButton.setAttribute("aria-label", words.directions); }
    document.querySelectorAll(".time-trace-close, #gilo-dialogue-close").forEach(function(button) {
        button.setAttribute("aria-label", words.close);
    });
    var guideImage = document.getElementById("gsi-feature-guide-image");
    var guideText = document.getElementById("gsi-feature-guide-localized");
    if (guideImage) guideImage.hidden = lang !== "ko";
    if (guideText) guideText.hidden = lang === "ko";
    var brandImage = document.querySelector(".gsi-brand-logo img");
    var brandText = document.getElementById("gsi-brand-localized");
    if (brandImage) brandImage.hidden = lang !== "ko";
    if (brandText) brandText.hidden = lang === "ko";
}
