# 길로아 기능·파일 안내 — 수정 전에 먼저 읽기

이 문서는 길로아를 고치는 사람과 AI가 가장 먼저 읽는 안내서입니다.

## 처음 여는 파일

- **기능을 찾을 때:** 이 문서 `FEATURE_MAP.md`를 엽니다.
- **모든 파일의 역할:** [docs/FEATURE_FILES.md](docs/FEATURE_FILES.md)를 엽니다.
- **함수 이름으로 찾을 때:** [docs/FEATURE_SYMBOLS.md](docs/FEATURE_SYMBOLS.md)를 검색합니다.
- **기존 기능 보호 원칙:** [GILOA_CORE_RULES.md](GILOA_CORE_RULES.md)를 전체 읽습니다.
- **화면 실행:** https://giloa.kr/ 또는 프로젝트 루트를 제공하는 로컬 서버를 엽니다. `features/`의 HTML 조각은 직접 실행하지 않습니다.

## 원본과 배포 파일의 차이

`features/` 안에는 기능별로 나눈 JS·CSS·HTML 원본이 있습니다. 이미 독립돼 있던 `parking.js`, `local-shops.js` 등은 기존 경로를 유지합니다.

프로젝트 루트의 **`script.js`, `style.css`, `index.html`은 자동으로 합쳐 만든 배포 파일**입니다. 이 세 파일을 직접 고치지 마세요. 해당 `features/` 원본을 고치고 `npm run features:build`로 합칩니다.

- [features/bundles.json](features/bundles.json): 원본 목록·역할·합치는 순서. JS 실행 순서, CSS 우선순위, HTML 순서를 보존합니다.
- [tools/build-feature-sources.mjs](tools/build-feature-sources.mjs): 원본을 그대로 합치고 문서·일치 여부를 검사하는 도구입니다.
- 원본은 독립 실행용 ES 모듈이 아닙니다. 기존 전역 함수·상태와 실행 순서를 그대로 유지하는 소스 조각입니다. 임의로 `import`, 함수 래퍼, `async` 로딩을 추가하지 않습니다.
- HTML의 열린 태그·닫힌 태그가 서로 다른 조각에 있을 수 있습니다. 조립된 전체 HTML에서도 확인합니다.
- 상대 이미지 URL은 배포 파일이 놓이는 **프로젝트 루트 기준**입니다. 원본 폴더 기준으로 바꾸지 않습니다.
- 안드로이드 assets나 `app/`, 과거 배포 복사본은 별도 대상입니다. 웹 수정 때문에 함께 덮어쓰지 않습니다.

## 기능별 첫 번째 수정 위치

아래는 시작점입니다. 공유 상태·번역·추가 CSS가 다른 조각에 있을 수 있으므로 함수·HTML ID·선택자로 연결을 확인하세요. 각 폴더의 모든 파일은 파일 목록 문서에 있습니다.

| 원하는 기능·검색어 | 먼저 읽을 파일 | 함께 확인할 곳 |
|---|---|---|
| 현재 위치·GPS·녹화·기록·8시간·백그라운드 | [features/gps/recording.js](features/gps/recording.js) | `common/state.js`, `common/settings.js`, `common/lifecycle.js`, Android `RouteTrackingService.java` |
| 기록 버튼 길게 누르기·현재 위치로 이동 | `features/ui/sidebar-and-info.js`, `features/gps/recording.js` | `features/map/map-and-controls.html` |
| 지도·지도 공급자·초기 지도 | `features/map/base-and-directions.js`, `map-bootstrap.js` | `features/common/head-and-startup.html`, `config.js` |
| 안개·이동 경로·지나간 길·체류 표시 | `features/map/fog-and-paths.js` | `features/map/canvas.css`, GPS 경로 연결 규칙 |
| 이 길을 지난 날짜·길게 누르기 | `features/photos/markers-and-recovery.js` | `findRouteDatesAt`, `initRouteDatesLongPress` |
| 방향 부채꼴·나침반·기기 방향 | `features/map/heading-and-events.js` | `features/gps/recording.js`, `features/ui/compatibility-overrides.css` |
| 지역명·지역 판정·체류시간·지역 테두리 | `features/regions/stay.js`, `region-stay-core.js` | `features/map/base-and-directions.js`, `data/admin-districts.geojson` |
| 지역 뱃지·지역 캐릭터·뱃지 지도·획득 조건 | `features/regions/badge-atlas.js` | `regions/stay.js`, `collection/items-badges-and-visits.js`, `regions/badge-atlas.html`, `regions/atlas-base.css`, `regions/atlas-overrides.css` |
| 할 일·일일 미션·1km·길로아 알리기 | `features/tasks/daily-tasks.js`, `features/tasks/state.js` | `completeDailyTask`는 `collection/items-badges-and-visits.js`, `tasks/top-bar-and-tasks.css` |
| 숨은 미션·보신각·탑골공원 | `hidden-missions.js` | `hidden-missions.obfuscated.js`는 배포 결과. 현재 원본 수정 후 기존 보호 빌드 절차 확인 |
| 길로 레벨·경험·칭호·여행 성향·성장 | `features/growth/growth-and-wardrobe.js`, `features/growth/state.js` | `features/growth/growth.css`, `features/growth/hud-and-recap.html` |
| 길로 옷장·장비·장착·획득 미션 | `features/growth/growth-and-wardrobe.js`, `features/growth/state.js` | `checkWearableMissions`는 `collection/items-badges-and-visits.js`, 목록은 `collection/lists.js` |
| 길로 대화·대사·상황별 반응·표정 | `features/character/dialogue.js`, `features/character/reactions.js` | `features/character/dialogue.css`, `gilo many appearance/`, `assets/` |
| 일반 아이템·활동 뱃지·테스터 선물 | `features/collection/items-badges-and-visits.js`, `features/collection/lists.js` | 저장 키 `giloa-collection`, `features/collection/lists.css` |
| 사진으로 만든 아이템·물건 자동 판별·사진 자르기·간단 그림·아이콘 변경 | `photo-items.js`, `photo-items.css`, `item-icons.js`, `item-recognition.js`, `item-recognition-worker.js` | 지원하는 물건은 기기 내 사진 판별로 종류·빈 이름을 자동 제안. 불확실하면 직접 선택. 전용 DB `giloa-photo-items-v1`의 같은 ID로 변경 저장. 인식 범위·네트워크·취소는 `docs/ITEM_RECOGNITION.md` 참고 |
| 방문·방문 도장·자동 방문 | `features/collection/items-badges-and-visits.js`, `features/collection/lists.js` | `completeExperience`, `checkNearbyVisitCompletion`, 공통 방문 반경·시간 상수 |
| 오늘의 여행 요약·오늘 경로 | `features/collection/items-badges-and-visits.js` | `tasks/daily-tasks.js`, `growth/hud-and-recap.html`。`renderDailyTravelLog`는 현재 HTML 연결 여부 확인 |
| 기억·메모·별표 | `features/memories/memories-and-lists.js` | `features/collection/lists.css`, `features/ui/sidebar.html` |
| 파란 현재 위치 점·특별 장소 메모 | `features/memories/special-places.js` | `features/help/settings-and-memo.html`, `parking.js`의 메모/주차 탭 |
| 사진 촬영·갤러리·사진 위치 선택 | `features/photos/capture-and-location.js` | `features/photos/panels.html`, `features/photos/list-and-picker.css` |
| EXIF·촬영 위치·촬영 날짜·HEIC·사진 가져오기 | `features/photos/exif-and-import.js` | `photos/capture-and-location.js`, `photos/image-processing.js`, `storage/indexeddb.js`, `vendor/exifr.full.umd.js` |
| 사진 인식·티처블 머신·인식 뱃지 | `features/photos/image-processing.js` | `features/common/settings.js`의 인식 기준, `tm-my-image-model/` |
| 사진 마커·미리보기·복구·사진 삭제 | `features/photos/markers-and-recovery.js` | `storage/indexeddb.js`, `photos/image-processing.js`, 사진 목록은 `memories/memories-and-lists.js` |
| 시간의 흔적·재촬영·과거 사진 비교 | `time-trace.js`, `time-trace.css` | `features/photos/panels.html` |
| 개인 주차·층·구역·차를 세운 위치 | `parking.js`, `parking.css` | `parking-ocr.js`는 촬영한 기둥 번호 인식. 공공 주차장 조회와 다름 |
| 관광지·음식점·쇼핑·숙박·축제·좋아요 | `features/places/tourism.js` | `features/places/tourism.css`, `features/map/map-and-controls.html`, 번역·지도 표시 설정 |
| 음식점 누락 보완·굵은 가게 이름 | `features/places/restaurant-coverage.js` | 음식점 스위치가 켜졌을 때 한국관광공사 식당과 중복되지 않는 주변 OpenStreetMap 음식점 표시. `features/places/tourism.js`, `features/places/tourism.css` |
| 검색·동네가게·편의점·카페·커피 브랜드 글자 표시·마트·다이소·올리브영 | `local-shops.js`, `local-shops.css` | 통합 쇼핑 스위치는 `features/map/layer-controls.js` |
| 병원·약국 | `medical-layers.js` | 지도 표시 스위치·키 설정·외부 API 조건 |
| 주민회관·마을회관·주민센터 | `community-places.js` | `features/map/layer-controls.js`, `features/ui/sidebar.html` |
| 도서관 | `features/places/libraries.js` | `data/libraries_seoul.bundle.js`, `features/i18n/languages.js` |
| 화장실 | `features/places/restrooms.js` | 카카오·OSM 보조 조회는 `map/layer-controls.js`。`restrooms.js`는 실제 로드 여부부터 확인 |
| 공공 주차장·주차장 검색 | `features/places/parking-lots.js` | `data/parking/`。개인 주차 저장은 `parking.js` |
| 낚시터 | `features/places/fishing.js` | `data/`의 낚시 데이터·API 설정 |
| 두루누비·공식 탐방로·완료 구간 | `features/places/trails.js` | `features/map/trails-and-hidden.css`, `data/durunubi*` |
| 지도 표시·시설 켜기 끄기·타일 순서 | `features/map/layer-controls.js` | `features/map/layer-controls.css`, `features/ui/sidebar.html`, `features/common/state.js` |
| 카카오 연결·길찾기·목적지 | `features/map/base-and-directions.js` | `openKakaoDirections`, `setSelectedDestination`, `features/map/map-and-controls.html` |
| GPX 추출·가져오기·저장 경로·GPX에 포함된 사진 | `features/gpx/routes.js`, `features/gpx/routes.css` | 발급 ID 제한은 `gpx-access.js`, `features/gpx/access.css` |
| 여행 ZIP·경로와 사진 연결 | `trip-share.js`, `features/gpx/trip-presentation.css` | `gpx-access.js`, 일반 사진 저장소 |
| 시작 동의·위치 사용·자동 기록 시작 | `privacy-policy.js`, `features/common/lifecycle.js` | `features/gps/recording.js`, `features/gps/location-disclosure.css` |
| 음악·길로 인사 음성 | `startup-music.js` | `features/common/scripts-and-footer.html`, `features/map/map-and-controls.html` |
| 이야기·챕터 목록·이어 읽기·첫 만남·튜토리얼 | `features/onboarding/story-and-tutorial.js`, `tutorial.js` | `features/onboarding/story.html`, `features/onboarding/*.css`, `tutorial.css` |
| 언어·번역·외국어 | `features/i18n/languages.js`, `features/i18n/early-ui.js`, `features/i18n/static-ui.js` | 각 독립 기능 파일의 `TEXT`·`I18N`。한국어·영어·일본어·중국어 유지 |
| 문의·도움말·설정·물가 | `features/help/help-and-prices.js` | `features/help/settings-and-memo.html`。물가는 현재 예시 데이터 |
| 메뉴·출처·정책·업데이트 안내 | `features/ui/sidebar-and-info.js` | `features/ui/sidebar.html`, `features/help/info-panels.html`, `privacy-policy.*` |
| 저장·복원·기록 보존 | `features/storage/persistence.js`, `features/storage/indexeddb.js` | `features/common/lifecycle.js`, `features/common/settings.js`의 저장 키 |
| 로그인·계정·동기화 | `supabase-sync.js` | `config.js`의 기능 플래그。현재 비활성 상태를 임의로 켜지 않음 |
| 오프라인·PWA·업데이트 | `sw.js`, `manifest.json` | `features/common/head-and-startup.html`, `features/common/scripts-and-footer.html` |

## 수정 순서 — AI와 개발자 공통

1. **먼저 이 문서와 `GILOA_CORE_RULES.md`를 읽습니다.** 사용자가 요청한 기능·원하는 결과를 한 문장으로 정리합니다.
2. 표에서 주 담당 파일을 찾고 실제 내용을 읽습니다. 필요하면 `docs/FEATURE_FILES.md`와 `docs/FEATURE_SYMBOLS.md`를 확인합니다.
3. 수정할 원본 파일과 직접 관련된 함수·HTML ID·CSS 선택자를 정합니다. 그 함수가 GPS·저장·사진·언어 등 다른 기능에서도 쓰이는지 읽고 확인합니다.
4. 사용자 요청에 필요한 최소 변경만 합니다. 관련 없는 코드 정리·최적화·중복 삭제·리팩터링은 하지 않습니다. 저장 키·데이터 구조·GPS·EXIF 우선순위를 임의로 바꾸지 않습니다.
5. 원본을 수정하고 `npm run features:build`를 실행합니다. 자동 생성된 배포 파일·함수 목록·파일 목록을 함께 갱신합니다.
6. `npm run features:check`, `npm run test:features`와 해당 기능의 기존 테스트를 실행합니다. 조립 파일의 차이가 요청한 원본 변경에서만 발생했는지 `git diff`로 확인합니다.
7. 새 기능·파일 이동·역할 변경이 있으면 **이 문서와 `features/bundles.json`의 역할을 같은 작업에서 갱신**합니다. 문서만 바꾸고 실제 코드 위치를 그대로 두거나, 이동한 코드를 문서에서 누락하지 않습니다.
8. 배포 전 기존 GPS·GPX·EXIF·저장 복원·다국어·PWA 영향을 확인합니다. 자동 검사 통과를 실기 검증으로 표현하지 않습니다. 코드만 이전 버전으로 되돌릴 수 있게 커밋을 남깁니다.

## 문서에서 원하는 기능을 못 찾았을 때

**비슷한 이름의 파일을 찾아 읽고, 실제 화면 연결을 확인한 뒤 수정합니다. 추측으로 여러 파일을 바꾸며 시도하지 않습니다.**

1. 한국어 동의어·영문 이름으로 다시 찾습니다. 예: `주차 → parking`, `뱃지 → badge / atlas / region`, `할 일 → daily / task / mission`, `길찾기 → directions / destination / kakao`.
2. 터미널에서 아래처럼 기능 원본과 기존 독립 파일을 검색합니다. `npm run features:find -- 주차`는 후보 파일과 일치한 줄을 보여줍니다.
3. 화면의 문구·HTML `id`·CSS 클래스·버튼의 `onclick`에서 실제 함수를 따라갑니다. 함수 정의만 존재하는지, 현재 `index.html`이 그 파일을 로드하는지도 확인합니다.
4. 결과가 없으면 비슷한 기능 폴더와 데이터·설정·테스트를 읽습니다. `features/`는 원본이고 루트 3개는 조립 결과이므로, 결과 파일에서 찾았더라도 대응 원본으로 돌아갑니다.
5. `vendor/`, `app/`, Android assets, `output/`, 과거 복사본에서 발견했다면 현재 웹과 연결됐는지 먼저 확인합니다. 비활성 기능을 현재 기능으로 착각해 켜거나, 복사본을 원본 대신 고치지 않습니다.
6. 실제 담당 파일을 찾으면 이 안내서에 기능·경로·검색어를 추가합니다. 찾지 못하면 확인한 범위와 미확인 연결을 명시하고, 근거 없는 수정은 하지 않습니다.

```bash
npm run features:find -- 주차
npm run features:find -- openKakaoDirections
rg -n '주차|parking|방향|directions' features parking.js parking-ocr.js tests
rg -n '원하는함수이름|HTML의_ID|CSS클래스' features --glob '*.js' --glob '*.html' --glob '*.css'
```

## 명령을 실행하는 위치

프로젝트 폴더, 즉 **`package.json`과 이 MD 파일이 함께 있는 폴더**에서 터미널을 엽니다.

```bash
npm run features:build   # 기능 원본을 합치고 파일·함수 안내서 갱신
npm run features:check   # 원본/조립 결과/자동 문서가 같은지 검사. 불일치하면 실패
npm run test:features    # 분리·조립·오류 처리 검사
```

`npm run features:build`는 APK를 만들거나 사이트에 배포하거나 사용자 기록을 변경하지 않습니다. 최종 웹 실행 파일의 경로를 유지하므로 이번 구조 정리만으로 Service Worker 캐시 버전을 올릴 필요가 없습니다. 실제 기능을 바꿀 때는 기존 캐시 버전 규칙을 별도로 따릅니다.

## 보관·검증·주의사항

- 최초 분리 시점의 배포 파일 SHA-256은 `features/bundles.json`의 `baseline`에 있습니다. `node tools/build-feature-sources.mjs --verify-baseline`은 **이번 분리가 원래 코드와 동일한지** 확인하는 명령입니다. 이후 기능을 의도적으로 바꾸면 달라지는 것이 정상입니다. 이를 피하려고 기준 해시를 고치지 않습니다.
- `features:check`와 GitHub의 `Feature source checks`는 조립 불일치·문법·문서 누락을 잡습니다. 변경이 의도와 맞는지, GPS가 실제 휴대폰에서 오래 기록되는지까지 보장하지 않습니다. Pages 배포와 별도이므로 배포 전에 직접 통과를 확인합니다.
- 분리 파일 간 공유 전역 상태는 아직 존재합니다. 폴더를 나눴다는 이유로 함수의 실행 순서·초기화 시점·저장 형식을 바꾸지 않습니다.
- 브랜드 주조색 `#1a2035`, 보조색 `#4fc3f7`과 지원 언어를 유지합니다.
