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
    locationPermission: ["브라우저 또는 휴대폰 설정에서 위치 권한을 허용해야 경로를 기록할 수 있어요.", "Allow location in your browser or device settings to record your route.", "ブラウザまたは端末の設定で位置情報を許可すると経路を記録できます。", "请在浏览器或设备设置中允许位置权限以记录路线。", "Permite la ubicación en el navegador o dispositivo para registrar tu ruta.", "Autorisez la localisation dans le navigateur ou l’appareil pour enregistrer votre parcours."],
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
    gpxChooseLocation: ["GPX 파일을 저장할 위치를 선택해 주세요.", "Choose where to save the GPX file.", "GPXファイルの保存先を選択してください。", "请选择GPX文件的保存位置。", "Elige dónde guardar el archivo GPX.", "Choisissez où enregistrer le fichier GPX."],
    gpxFileSavedOnly: ["GPX 파일을 저장했습니다. 앱 내부 목록에는 추가하지 못했지만 기존 기록은 유지됩니다.", "GPX file saved. It could not be added to the app list; existing records are preserved.", "GPXファイルを保存しました。アプリの一覧には追加できませんでしたが、既存の記録は保持されています。", "GPX文件已保存。未能添加到应用列表，原有记录已保留。", "Archivo GPX guardado. No se añadió a la lista; los registros existentes se conservan.", "Fichier GPX enregistré. Il n’a pas pu être ajouté à la liste ; les données existantes sont conservées."],
    gpxSaveCancelled: ["GPX 파일 저장을 취소했습니다. 기존 기록은 유지됩니다.", "GPX file save cancelled. Existing records are preserved.", "GPXファイルの保存をキャンセルしました。既存の記録は保持されています。", "已取消保存GPX文件。原有记录已保留。", "Guardado GPX cancelado. Los registros existentes se conservan.", "Enregistrement GPX annulé. Les données existantes sont conservées."],
    gpxDownloadOnly: ["내부 저장에 실패해 목록에는 추가하지 못했습니다. GPX 다운로드를 요청했습니다. 다운로드된 파일을 확인해 주세요.", "Could not add this route to the saved list. GPX download requested; please check your downloaded files.", "内部保存に失敗したため一覧には追加されませんでした。GPXのダウンロードを要求しました。ダウンロードしたファイルを確認してください。", "内部保存失败，未添加到列表。已请求下载GPX，请检查下载的文件。", "No se pudo añadir la ruta a la lista. Se solicitó la descarga GPX; comprueba los archivos descargados.", "Impossible d’ajouter le parcours à la liste. Téléchargement GPX demandé ; vérifiez vos fichiers téléchargés."],
    gpxDownloadFailed: ["GPX 다운로드를 시작하지 못했습니다. 기존 경로는 유지됩니다. 다시 시도해 주세요.", "Could not start the GPX download. Your existing route is preserved. Please try again.", "GPXのダウンロードを開始できませんでした。既存の経路は保持されています。もう一度お試しください。", "无法开始下载GPX。原有路线已保留，请重试。", "No se pudo iniciar la descarga GPX. La ruta existente se conserva. Inténtalo de nuevo.", "Impossible de démarrer le téléchargement GPX. Le parcours existant est conservé. Réessayez."],
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
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) {
        try {
            const plugins = window.Capacitor.Plugins || {};
            const Geolocation = plugins.Geolocation;
            if (Geolocation && typeof Geolocation.requestPermissions === "function") await Geolocation.requestPermissions();
        } catch (e) { console.warn("위치 권한 요청 실패", e); throw e; }
    }
}

