# 기능별 원본 파일 목록

> 자동 생성: `npm run features:build`. 직접 수정하지 말고 역할은 `features/bundles.json`에서 수정하세요.

수정 시작점과 검색 방법은 [FEATURE_MAP.md](../FEATURE_MAP.md)를 먼저 읽으세요. 아래 순서는 합치는 순서이며 바꾸면 안 됩니다.

## 나뉜 원본

| 배포 파일 | 수정할 원본 | 역할 |
|---|---|---|
| `script.js` | [features/common/compatibility.js](../features/common/compatibility.js) | 구형 WebView 호환 처리 |
| `script.js` | [features/i18n/early-ui.js](../features/i18n/early-ui.js) | 초기 안내 번역·위치 권한 요청 |
| `script.js` | [features/common/settings.js](../features/common/settings.js) | 공통 저장 키·설정·통신·이미지 인식 기준 |
| `script.js` | [features/storage/indexeddb.js](../features/storage/indexeddb.js) | 사진·원시 GPS IndexedDB 저장과 복구 |
| `script.js` | [features/common/state.js](../features/common/state.js) | 공유 상태·지도 표시 설정 |
| `script.js` | [features/tasks/state.js](../features/tasks/state.js) | 할 일 저장 키·공유 문구 |
| `script.js` | [features/growth/state.js](../features/growth/state.js) | 성장·장비 카탈로그·공유 UI 상태 |
| `script.js` | [features/character/reactions.js](../features/character/reactions.js) | 길로 장면·상황별 반응·로딩 상태 |
| `script.js` | [features/map/base-and-directions.js](../features/map/base-and-directions.js) | 지도 초기화·지도 공급자·카카오 길찾기·지도 레이어 생성 |
| `script.js` | [features/regions/stay.js](../features/regions/stay.js) | 지역 판정·체류 적립·지역 테두리·진단 |
| `script.js` | [features/map/fog-and-paths.js](../features/map/fog-and-paths.js) | 안개·경로·시간·체류 표현·사진 군집 |
| `script.js` | [features/tasks/daily-tasks.js](../features/tasks/daily-tasks.js) | 오늘의 할 일·진행률·공유·오늘 경로 |
| `script.js` | [features/growth/growth-and-wardrobe.js](../features/growth/growth-and-wardrobe.js) | 길로 성장·칭호·장비·HUD·사진 미션 상태 |
| `script.js` | [features/help/help-and-prices.js](../features/help/help-and-prices.js) | 문의·설정·튜토리얼 다시 보기·예시 물가 |
| `script.js` | [features/photos/capture-and-location.js](../features/photos/capture-and-location.js) | 촬영·갤러리·네이티브 사진·위치 지정 |
| `script.js` | [features/gps/recording.js](../features/gps/recording.js) | 화면 유지·기록 동의·GPS 시작 종료·경로 검증·체류 보너스 |
| `script.js` | [features/memories/memories-and-lists.js](../features/memories/memories-and-lists.js) | 기억 저장·삭제·기록 탭·사진 목록 |
| `script.js` | [features/gpx/routes.js](../features/gpx/routes.js) | GPX 시간·추출·저장·불러오기·경로 표시 |
| `script.js` | [features/ui/sidebar-and-info.js](../features/ui/sidebar-and-info.js) | 메뉴·출처·정책·이야기·업데이트 안내·기록 버튼 길게 누르기 |
| `script.js` | [features/storage/persistence.js](../features/storage/persistence.js) | 여행 상태 저장·병합·백업·복원·과거 계정 호환 |
| `script.js` | [features/memories/special-places.js](../features/memories/special-places.js) | 파란 위치 점 메모·특별 장소 핀 |
| `script.js` | [features/photos/image-processing.js](../features/photos/image-processing.js) | 티처블 머신 인식·사진 처리·인식 뱃지 |
| `script.js` | [features/photos/exif-and-import.js](../features/photos/exif-and-import.js) | EXIF GPS·날짜·HEIC·압축·사진 진단·가져오기 |
| `script.js` | [features/photos/markers-and-recovery.js](../features/photos/markers-and-recovery.js) | 사진 마커·미리보기 복구·삭제·경로 날짜·일부 HUD 연결 |
| `script.js` | [features/onboarding/story-and-tutorial.js](../features/onboarding/story-and-tutorial.js) | 첫 만남·이야기·언어 선택·기존 튜토리얼 |
| `script.js` | [features/common/lifecycle.js](../features/common/lifecycle.js) | 시작 순서·복원 완료 확인·앱 재개 |
| `script.js` | [features/places/tourism.js](../features/places/tourism.js) | 관광·축제·상세·좋아요·관광 데이터 캐시 |
| `script.js` | [features/places/libraries.js](../features/places/libraries.js) | 도서관 조회·다국어 표시 |
| `script.js` | [features/places/parking-lots.js](../features/places/parking-lots.js) | 공공 주차장 조회·지도 표시 |
| `script.js` | [features/places/fishing.js](../features/places/fishing.js) | 낚시터 데이터·지도 표시 |
| `script.js` | [features/places/restrooms.js](../features/places/restrooms.js) | 화장실 데이터·좌표·팝업·캐시 |
| `script.js` | [features/map/layer-controls.js](../features/map/layer-controls.js) | 관광 재조회·지도 표시 켜기 끄기·순서·화장실 보조 검색 |
| `script.js` | [features/places/trails.js](../features/places/trails.js) | 두루누비 공식 탐방로·GPX·완료 경로 비교 |
| `script.js` | [features/i18n/languages.js](../features/i18n/languages.js) | 화면 번역·언어 설정·관광 정보 번역 |
| `script.js` | [features/collection/items-badges-and-visits.js](../features/collection/items-badges-and-visits.js) | 수집 데이터·활동 뱃지·방문·장비 보상·오늘 요약·미션 완료 |
| `script.js` | [features/regions/badge-atlas.js](../features/regions/badge-atlas.js) | 지역 뱃지 지도·진행률·상세·진단 |
| `script.js` | [features/collection/lists.js](../features/collection/lists.js) | 아이템·방문 목록·장착 클릭·수집 알림 |
| `script.js` | [features/character/dialogue.js](../features/character/dialogue.js) | 길로 대사·페이지 넘김·기존 첫 인사 |
| `script.js` | [features/map/heading-and-events.js](../features/map/heading-and-events.js) | 방향 부채꼴·지도 이벤트·화면 복귀 연결 |
| `script.js` | [features/i18n/static-ui.js](../features/i18n/static-ui.js) | 정적 화면 추가 번역·안내 문구 |
| `style.css` | [features/common/base.css](../features/common/base.css) | 브랜드 색상·기본 레이아웃·지도 공통 |
| `style.css` | [features/map/canvas.css](../features/map/canvas.css) | 지도 캔버스·레이어·사진 군집 |
| `style.css` | [features/tasks/top-bar-and-tasks.css](../features/tasks/top-bar-and-tasks.css) | 상단·음악 버튼·할 일·기록 상태 |
| `style.css` | [features/ui/sidebar.css](../features/ui/sidebar.css) | 메뉴·지도 표시 패널·탭 |
| `style.css` | [features/regions/atlas-base.css](../features/regions/atlas-base.css) | 지역 뱃지 지도·뱃지 기본 디자인 |
| `style.css` | [features/collection/lists.css](../features/collection/lists.css) | 방문·아이템·기억 목록 |
| `style.css` | [features/photos/list-and-picker.css](../features/photos/list-and-picker.css) | 사진 목록·촬영 선택 메뉴 |
| `style.css` | [features/gpx/routes.css](../features/gpx/routes.css) | GPX 추출·저장 목록 |
| `style.css` | [features/ui/legacy-panels.css](../features/ui/legacy-panels.css) | 오른쪽 조작·도움말·HUD·사진 위치 패널의 기존 스타일 |
| `style.css` | [features/character/loading.css](../features/character/loading.css) | 길로 로딩·관광 마커·정보 창 |
| `style.css` | [features/places/tourism.css](../features/places/tourism.css) | 주변 관광지·축제·기존 언어와 수집 스타일 |
| `style.css` | [features/onboarding/legacy-story.css](../features/onboarding/legacy-story.css) | 이야기·기존 튜토리얼·첫 만남·사진 메모·시간 분위기 |
| `style.css` | [features/growth/growth.css](../features/growth/growth.css) | 성장·아이템·장비·HUD 상세 |
| `style.css` | [features/character/dialogue.css](../features/character/dialogue.css) | 길로 하단 대화창 |
| `style.css` | [features/map/trails-and-hidden.css](../features/map/trails-and-hidden.css) | 공식 탐방로·숨은 미션 화면 |
| `style.css` | [features/regions/atlas-overrides.css](../features/regions/atlas-overrides.css) | 지역 뱃지 상태·진단·지역 테두리 |
| `style.css` | [features/onboarding/story-layout.css](../features/onboarding/story-layout.css) | 이야기 화면·구형 튜토리얼 호환 |
| `style.css` | [features/onboarding/start-screen.css](../features/onboarding/start-screen.css) | 현재 첫 화면·시작 버튼 |
| `style.css` | [features/ui/compatibility-overrides.css](../features/ui/compatibility-overrides.css) | 시작 반응·방향 표시·요약 제목·계정 표시 보정 |
| `style.css` | [features/gpx/trip-presentation.css](../features/gpx/trip-presentation.css) | 여행 ZIP 화면·사진 선택 |
| `style.css` | [features/gps/location-disclosure.css](../features/gps/location-disclosure.css) | 위치·기록 동의 창 |
| `style.css` | [features/map/layer-controls.css](../features/map/layer-controls.css) | 지도 표시 타일·순서 편집 |
| `style.css` | [features/gpx/access.css](../features/gpx/access.css) | 발급 ID 입력·이용 잠금 |
| `index.html` | [features/common/head-and-startup.html](../features/common/head-and-startup.html) | 문서 head·외부 파일 연결·로딩 화면 |
| `index.html` | [features/ui/sidebar.html](../features/ui/sidebar.html) | 메뉴·지도 표시·사진 GPX 방문 아이템 탭 |
| `index.html` | [features/help/info-panels.html](../features/help/info-panels.html) | 출처·정책·업데이트·이야기 안내 |
| `index.html` | [features/regions/badge-atlas.html](../features/regions/badge-atlas.html) | 지역 뱃지 지도·진단 화면 |
| `index.html` | [features/map/map-and-controls.html](../features/map/map-and-controls.html) | 지도·숨은 미션·할 일·음악·관광지·오른쪽 버튼 |
| `index.html` | [features/photos/panels.html](../features/photos/panels.html) | 사진 메뉴·위치 선택·시간의 흔적 |
| `index.html` | [features/help/settings-and-memo.html](../features/help/settings-and-memo.html) | 위치 메모·문의·설명·물가·언어 설정 |
| `index.html` | [features/onboarding/story.html](../features/onboarding/story.html) | 첫 만남·이야기·튜토리얼 화면 |
| `index.html` | [features/growth/hud-and-recap.html](../features/growth/hud-and-recap.html) | 길로 대화·성장 HUD·장비·여행 요약·계정 화면 |
| `index.html` | [features/common/scripts-and-footer.html](../features/common/scripts-and-footer.html) | 모듈 재시도·스크립트 순서·SW 등록·인사 음성 |

## 기존에 독립된 기능 파일

| 수정할 파일 | 역할 |
|---|---|
| [item-recognition.js](../item-recognition.js) | 사진 물건 자동 판별·확신도 및 애매한 결과 처리·분석 취소 |
| [item-recognition-worker.js](../item-recognition-worker.js) | 기기 내 COCO-SSD CPU 추론·사진 외부 전송 없음·요청 시 모델 다운로드 |
| [item-icons.js](../item-icons.js) | 기본 그림 아이콘·이름 기반 종류 제안 — 사진 자동 인식 아님 |
| [parking.js](../parking.js) | 개인 주차 위치·층·구역·파란 위치 점 탭 |
| [parking.css](../parking.css) | 개인 주차 화면 디자인 |
| [parking-ocr.js](../parking-ocr.js) | 주차 기둥 번호 문자 인식 |
| [photo-items.js](../photo-items.js) | 사진 자르기·아이콘 아이템 저장·삭제 |
| [photo-items.css](../photo-items.css) | 사진 아이템 화면 디자인 |
| [local-shops.js](../local-shops.js) | 장소 검색·쇼핑·동네가게·카카오 OSM 조회 |
| [local-shops.css](../local-shops.css) | 가게·검색 화면 디자인 |
| [medical-layers.js](../medical-layers.js) | 병원·약국 지도 표시 |
| [community-places.js](../community-places.js) | 주민회관·마을회관·주민센터 조회 |
| [restrooms.js](../restrooms.js) | 화장실 관련 보조 파일 — 현재 HTML 직접 로드 여부부터 확인 |
| [region-stay-core.js](../region-stay-core.js) | 지역 체류시간 순수 계산 |
| [time-trace.js](../time-trace.js) | 시간의 흔적·재방문 사진 촬영·전후 비교 |
| [time-trace.css](../time-trace.css) | 시간의 흔적 화면 디자인 |
| [hidden-missions.js](../hidden-missions.js) | 숨은 장소 미션 원본·보신각·탑골공원 |
| [hidden-missions.obfuscated.js](../hidden-missions.obfuscated.js) | 숨은 미션 배포용 난독화 결과 — 직접 수정 금지 |
| [gpx-access.js](../gpx-access.js) | 발급 ID로 GPX 이용 제한 |
| [trip-share.js](../trip-share.js) | 여행 GPX·사진 연결·ZIP 저장 |
| [gpx-sharing.js](../gpx-sharing.js) | 과거 GPX 공유 호환 — 현재 서버 공유 비활성 |
| [startup-music.js](../startup-music.js) | 시작 음악 재생·정지 |
| [privacy-policy.js](../privacy-policy.js) | 시작 위치 동의·개인정보 안내 |
| [privacy-policy.css](../privacy-policy.css) | 개인정보 안내 디자인 |
| [privacy-policy.html](../privacy-policy.html) | 개인정보 안내 문서 |
| [map-bootstrap.js](../map-bootstrap.js) | 빠른 지도 초기 표시 |
| [tutorial.js](../tutorial.js) | 현재 단계별 튜토리얼 |
| [tutorial.css](../tutorial.css) | 단계별 튜토리얼 디자인 |
| [supabase-sync.js](../supabase-sync.js) | 로그인·서버 동기화 — 현재 비활성 |
| [config.js](../config.js) | 외부 서비스 설정 — 비밀키 추가·공개 금지 |
| [sw.js](../sw.js) | 오프라인·캐시·PWA 업데이트 |
| [manifest.json](../manifest.json) | PWA 설치 정보 |

HTML 조각은 완성된 페이지가 아닙니다. 화면 확인은 조립한 프로젝트 루트의 `index.html`을 서버로 열거나 https://giloa.kr/ 에서 하세요.
