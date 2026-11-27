/*
 * 참석 여부 · 방명록 저장용 (구글 시트)
 *
 * 설정 방법 (5분)
 * 1. 구글 드라이브 → 새로 만들기 → 구글 스프레드시트
 * 2. 시트 메뉴 [확장 프로그램] → [Apps Script] → 기존 코드를 지우고 이 파일 내용 전체를 붙여넣기 → 저장
 * 3. 오른쪽 위 [배포] → [새 배포] → 유형 선택(톱니바퀴) → [웹 앱]
 *    - 실행 사용자: 나 / 액세스 권한: 모든 사용자 → [배포] → 권한 허용
 * 4. 나온 "웹 앱 URL"(https://script.google.com/macros/s/.../exec)을
 *    index.html의 CONFIG.sheetUrl 에 붙여넣기
 *
 * 결과는 시트의 'RSVP', '방명록' 탭에 쌓입니다. 방명록 삭제는 시트에서 해당 줄을 지우면 됩니다.
 * 코드를 고친 뒤에는 [배포] → [배포 관리] → 수정 → 버전 "새 버전"으로 다시 배포해야 반영돼요.
 */

const ss = SpreadsheetApp.getActiveSpreadsheet();

function sheet(name, head) {
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); }
  return s;
}

// 길이 제한 + '='로 시작하는 값이 수식으로 실행되지 않게 막기
function clip(v, n) {
  const s = String(v || '').slice(0, n);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.type === 'rsvp') {
    sheet('RSVP', ['시간', '측', '참석', '성함', '인원', '식사'])
      .appendRow([new Date(), clip(d.side, 10), clip(d.attend, 10), clip(d.name, 30), Math.min(Number(d.count) || 1, 10), clip(d.meal, 10)]);
  } else if (d.type === 'gb') {
    sheet('방명록', ['시간', '이름', '메시지']).appendRow([new Date(), clip(d.name, 30), clip(d.msg, 300)]);
  }
  return ContentService.createTextOutput('ok');
}

// 방명록 최신 100개
function doGet() {
  const rows = sheet('방명록', ['시간', '이름', '메시지']).getDataRange().getValues().slice(1).reverse().slice(0, 100);
  const out = rows.map(r => ({ t: r[0], name: r[1], msg: r[2] }));
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
