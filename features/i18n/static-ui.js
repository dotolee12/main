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
        sourceSeoul:["서울 열린데이터광장 · 카카오맵","Seoul Open Data Plaza · KakaoMap","ソウル開放データ広場 · KakaoMap","首尔开放数据广场 · KakaoMap","Portal de datos abiertos de Seúl · KakaoMap","Portail des données ouvertes de Séoul · KakaoMap"],
        sourceRestrooms:["서울 열린데이터광장 · 카카오맵","Seoul Open Data Plaza · KakaoMap","ソウル開放データ広場 · KakaoMap","首尔开放数据广场 · KakaoMap","Datos abiertos de Seúl · KakaoMap","Données ouvertes de Séoul · KakaoMap"],
        sourceParking:["공공데이터포털 · 전국주차장정보표준데이터","Korea Public Data Portal · National Parking Information Standard Data","韓国公共データポータル · 全国駐車場情報標準データ","韩国公共数据门户 · 全国停车场信息标准数据","Portal de datos públicos de Corea · Datos nacionales normalizados de aparcamientos","Portail des données publiques de Corée · Données nationales normalisées sur les parkings"],
        sourceFishing:["행정안전부 · 전국 낚시터정보","Ministry of the Interior and Safety · National Fishing Site Information","韓国行政安全部 · 全国釣り場情報","韩国行政安全部 · 全国垂钓场信息","Ministerio del Interior y Seguridad de Corea · Información nacional de lugares de pesca","Ministère coréen de l’Intérieur et de la Sécurité · Informations nationales sur les sites de pêche"],
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

window.giloaRouteTrackingDiagnostic = function() {
    var bridge = getNativeRouteTrackingBridge();
    if (!bridge || typeof bridge.getRouteTrackingStatus !== "function") return null;
    try { return JSON.parse(bridge.getRouteTrackingStatus()); } catch (_) { return null; }
};
