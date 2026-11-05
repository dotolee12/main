/* Original, local SVG pictograms. Suggestions use item names, never photo recognition. */
(function () {
    'use strict';
    var types = [
        ['phone',['휴대폰','Phone','携帯電話','手机'],/휴대폰|휴대전화|스마트폰|핸드폰|아이폰|갤럭시|^폰$|\bphone\b|mobile|携帯|スマホ|手机|手機/i],
        ['camera',['카메라','Camera','カメラ','相机'],/카메라|camera|カメラ|相机|相機/i],
        ['book',['책','Book','本','书'],/책|도서|book|本|书|書/i],
        ['flower',['꽃','Flower','花','花'],/꽃|flower|花/i],
        ['tree',['나무','Tree','木','树'],/나무|tree|樹|树|木/i],
        ['coffee',['음료','Drink','飲み物','饮料'],/커피|음료|카페|coffee|drink|cafe|コーヒー|飲み物|咖啡|饮料/i],
        ['bag',['가방','Bag','かばん','包'],/가방|배낭|bag|backpack|かばん|バッグ|背包|包/i],
        ['bicycle',['자전거','Bicycle','自転車','自行车'],/자전거|bicycle|bike|自転車|自行车/i],
        ['car',['자동차','Car','車','汽车'],/자동차|승용차|\bcar\b|車|汽车|汽車/i],
        ['building',['건물','Building','建物','建筑'],/건물|집|building|house|建物|建筑|建築/i],
        ['food',['음식','Food','食べ物','食物'],/음식|식사|food|meal|食べ物|食物/i],
        ['star',['기념품','Keepsake','記念品','纪念品'],null]
    ];
    var art = {
        phone:'<rect x="32" y="12" width="64" height="104" rx="13" fill="#1a2035"/><rect x="40" y="29" width="48" height="63" rx="5" fill="#4fc3f7" stroke="none"/><path d="M55 21h18" stroke="#a8ddf5"/><circle cx="64" cy="103" r="4" fill="#ffd66b" stroke="none"/>',
        camera:'<path d="M17 36h24l8-14h30l8 14h24v64H17Z" fill="#1a2035"/><circle cx="64" cy="68" r="23" fill="#4fc3f7"/><circle cx="64" cy="68" r="11" fill="#1a2035" stroke="none"/><circle cx="99" cy="47" r="4" fill="#ffd66b" stroke="none"/>',
        book:'<path d="M15 25c20-7 35-4 49 6 14-10 29-13 49-6v77c-20-7-35-4-49 6-14-10-29-13-49-6Z" fill="#4fc3f7"/><path d="M64 31v77M28 44h22M28 60h22M78 44h22M78 60h22"/>',
        flower:'<path d="M64 71v43m0-14c-16 0-27-8-28-23 16 0 27 8 28 23m0-8c16 0 27-8 28-23-16 0-27 8-28 23" fill="#4fc3f7"/><path d="M64 23c20-29 40-5 26 14 34 5 25 36 2 36 5 32-27 34-36 13-23 24-44 1-29-18-33-14-15-41 8-34-4-27 23-38 29-11Z" fill="#4fc3f7"/><circle cx="62" cy="54" r="15" fill="#ffd66b"/>',
        tree:'<path d="M57 79h14v35H57Z" fill="#ffd66b"/><path d="m64 12 35 36H84l25 31H19l25-31H29Z" fill="#4fc3f7"/>',
        coffee:'<path d="M91 47h12c23 0 23 34 0 34H91"/><path d="M24 42h68v40c0 20-16 29-34 29S24 102 24 82Z" fill="#4fc3f7"/><path d="M18 116h80M42 28V14m20 14V9m20 19V14"/><path d="M34 56h46" stroke="#ecf8ff"/>',
        bag:'<path d="M29 36h70l10 77H19Z" fill="#4fc3f7"/><path d="M45 45V29c0-25 38-25 38 0v16"/><path d="M40 78h48v22H40Z" fill="#1a2035"/><path d="M59 78v9h10v-9" stroke="#ffd66b"/>',
        bicycle:'<circle cx="30" cy="88" r="23" fill="#1a2035"/><circle cx="99" cy="88" r="23" fill="#1a2035"/><path d="m30 88 24-44 24 44H30l36-26h24m-12 26 12-43h15M45 44h19" fill="none" stroke="#4fc3f7" stroke-width="6"/>',
        car:'<path d="m24 58 13-29h54l13 29 9 9v36H15V67Z" fill="#4fc3f7"/><path d="m43 38-8 21h58l-8-21Z" fill="#1a2035"/><path d="M20 103v12h16v-12m56 0v12h16v-12" fill="#1a2035"/><path d="M29 79h12m46 0h12" stroke="#ffd66b" stroke-width="8"/>',
        building:'<path d="M22 113V23h58v90m0-49h26v49H22Z" fill="#4fc3f7"/><path d="M35 39h12m12 0h8M35 57h12m12 0h8M35 75h12m12 0h8M89 79h8M89 95h8"/><path d="M45 113V94h17v19" fill="#1a2035"/>',
        food:'<path d="M20 60h88c0 32-19 50-44 50S20 92 20 60Z" fill="#4fc3f7"/><path d="M16 60h96M42 114h44M42 44V24m22 20V14m22 30V24"/><path d="M37 75h54" stroke="#ecf8ff"/>',
        star:'<path d="m64 12 15 32 35 5-25 25 6 36-31-17-31 17 6-36L14 49l35-5Z" fill="#4fc3f7"/><path d="m64 37 7 15 17 3-12 12 3 17-15-8-15 8 3-17-12-12 17-3Z" fill="#ffd66b" stroke="none"/>'
    };
    function known(type) { return types.some(function(t) { return t[0] === type; }) ? type : 'star'; }
    function svg(type) { return '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 128 128" fill="none" stroke="#1a2035" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'+art[known(type)]+'</svg>'; }
    window.GiloaItemIcons = Object.freeze({
        suggest:function(name) { var item = types.find(function(t) { return t[2] && t[2].test(String(name || '')); }); return item ? item[0] : 'star'; },
        list:function(lang) { var index = {ko:0,en:1,ja:2,zh:3}[String(lang||'en').split('-')[0]]; if (index === undefined) index=1; return types.map(function(t) { return {id:t[0],name:t[1][index]}; }); },
        svg:svg, url:function(type) { return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(type)); },
        blob:function(type) { return new Blob([svg(type)], {type:'image/svg+xml'}); }, valid:known
    });
})();
