const translations = {
  ko: {
    eyebrow: "ANDROID CLOSED TEST",
    heroTitle: "길로아 안드로이드<br>베타테스터를 모집합니다",
    heroDescription: "내가 걸은 길이 지도가 되는 여행·걷기 기록 앱입니다. 정식 출시 전, 실제 사용 의견을 들려주실 분을 찾고 있습니다.",
    applyButton: "테스터 신청하기",
    homeButton: "길로아 홈페이지 보기",
    trust1: "무료 참여",
    trust2: "이름과 Gmail 주소만 필요",
    trust3: "금전 및 다른 개인정보 요구 없음",
    trust4: "현재 Android만 지원 · iOS 추후 지원",
    privacyTitle: "개인정보 안전 안내",
    privacyText: "수집 정보는 테스트 참여 확인과 Google Play 테스터 등록 목적으로만 사용되며, 외부에 제공되지 않습니다.",
    levelText: "기록 탐험가",
    speech: "길로와 함께<br>세상을 탐험해요!",
    statDistance: "총 거리",
    statToday: "오늘 거리",
    statMemory: "기억",
    statPhoto: "사진"
  },
  en: {
    eyebrow: "ANDROID CLOSED TEST",
    heroTitle: "Join the GILOA Android<br>beta test",
    heroDescription: "GILOA is a walking and travel journal where the paths you walk become your map. We are looking for real feedback before release.",
    applyButton: "Apply as a tester",
    homeButton: "Visit GILOA",
    trust1: "Free participation",
    trust2: "Only name and Gmail required",
    trust3: "No payment or other personal data requested",
    trust4: "Android now · iOS planned later",
    privacyTitle: "Privacy notice",
    privacyText: "Your information is used only to confirm participation and register Google Play testers.",
    levelText: "Record Explorer",
    speech: "Explore the world<br>with Gillo!",
    statDistance: "Total",
    statToday: "Today",
    statMemory: "Memories",
    statPhoto: "Photos"
  },
  ja: {
    eyebrow: "ANDROID CLOSED TEST",
    heroTitle: "GILOA Android<br>ベータテスター募集",
    heroDescription: "歩いた道が自分の地図になる旅行・散歩記録アプリです。正式公開前に実際のご意見を募集しています。",
    applyButton: "テスターに応募",
    homeButton: "GILOAを見る",
    trust1: "無料参加",
    trust2: "氏名とGmailのみ必要",
    trust3: "金銭や他の個人情報は求めません",
    trust4: "現在Androidのみ · iOSは今後対応予定",
    privacyTitle: "個人情報について",
    privacyText: "情報は参加確認とGoogle Playテスター登録のみに使用します。",
    levelText: "記録探検家",
    speech: "ギロと一緒に<br>世界を探検しよう！",
    statDistance: "総距離",
    statToday: "今日",
    statMemory: "記憶",
    statPhoto: "写真"
  },
  zh: {
    eyebrow: "ANDROID CLOSED TEST",
    heroTitle: "招募 GILOA Android<br>测试用户",
    heroDescription: "这是一款让走过的路变成个人地图的旅行与步行记录应用。正式发布前，我们正在征集真实使用意见。",
    applyButton: "申请成为测试用户",
    homeButton: "查看 GILOA",
    trust1: "免费参与",
    trust2: "只需姓名和 Gmail",
    trust3: "不收取费用，也不索取其他个人信息",
    trust4: "目前仅支持 Android · iOS 以后支持",
    privacyTitle: "隐私说明",
    privacyText: "信息仅用于确认参与和 Google Play 测试用户登记。",
    levelText: "记录探险家",
    speech: "和 Gillo 一起<br>探索世界！",
    statDistance: "总距离",
    statToday: "今日",
    statMemory: "回忆",
    statPhoto: "照片"
  }
};

function setLanguage(language) {
  const dictionary = translations[language] || translations.ko;
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (!dictionary[key]) return;

    if (key === "heroTitle" || key === "speech") {
      element.innerHTML = dictionary[key];
    } else {
      element.textContent = dictionary[key];
    }
  });

  document.querySelectorAll(".lang").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });

  localStorage.setItem("giloa-tester-language", language);
}

document.querySelectorAll(".lang").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

setLanguage(localStorage.getItem("giloa-tester-language") || "ko");
