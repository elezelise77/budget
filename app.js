const { useState, useEffect, useMemo, useRef } = React;
// ---------- 디자인 토큰 ----------
const C = {
    bg: "#F3EFE7", bgAlt: "#EAE3D5", surface: "#FFFFFF", ink: "#181A20", inkSoft: "#585B66", muted: "#9A9CA6",
    accent: "#B4842E", accentDeep: "#8C6423", accentSoft: "#F0E4C8",
    positive: "#1F6F5C", positiveSoft: "#DFEEE8", negative: "#AC4636", negativeSoft: "#F5E2DD",
    border: "#E6E0D2",
    shadow: "0 1px 2px rgba(24,26,32,0.04), 0 10px 28px -14px rgba(24,26,32,0.18)",
    shadowLift: "0 4px 10px rgba(24,26,32,0.06), 0 20px 40px -16px rgba(24,26,32,0.24)",
};
const SERIF = "'Fraunces', 'Source Serif 4', Georgia, serif";
const SANS = "'Pretendard', 'Inter', system-ui, -apple-system, sans-serif";
const GEMINI_MODEL = "gemini-3.6-flash";
// ★ 휴대폰용 웹 주소 ★
// 이 프로젝트를 GitHub Pages 등에 올린 뒤, 그 주소를 아래에 적어주세요.
// 예) "https://내아이디.github.io/budget/"
// 비워두면 설정 화면에 "아직 준비되지 않았습니다" 안내가 표시됩니다.
const MOBILE_WEB_URL = "";
function mobileLink(pairCode) {
    if (!MOBILE_WEB_URL)
        return "";
    const base = MOBILE_WEB_URL.replace(/#.*$/, "");
    return base + (base.endsWith("/") ? "" : "/") + "#c=" + pairCode;
}
const EXPENSE_CATS = ["식비", "교통", "주거/관리비", "통신", "문화/여가", "의료/건강", "교육", "쇼핑", "경조사", "품위유지비", "기타"];
const INCOME_CATS = ["급여", "부수입", "이자/배당", "환급/기타"];
const ACCOUNT_TYPES = ["입출금", "예금", "적금", "투자", "현금", "카드"];
const SAVINGS_TYPES = ["예금", "적금"];
const INSURANCE_KINDS = ["보험", "연금"];
const KR_HOLIDAYS = {
    "2026-01-01": "신정", "2026-02-16": "설날연휴", "2026-02-17": "설날", "2026-02-18": "설날연휴",
    "2026-03-01": "삼일절", "2026-03-02": "대체공휴일(삼일절)", "2026-05-05": "어린이날",
    "2026-05-24": "부처님오신날", "2026-05-25": "대체공휴일(부처님오신날)", "2026-06-06": "현충일",
    "2026-07-17": "제헌절", "2026-08-15": "광복절", "2026-08-17": "대체공휴일(광복절)",
    "2026-09-24": "추석연휴", "2026-09-25": "추석", "2026-09-26": "추석연휴",
    "2026-10-03": "개천절", "2026-10-05": "대체공휴일(개천절)", "2026-10-09": "한글날", "2026-12-25": "크리스마스",
    "2027-01-01": "신정", "2027-02-07": "설날연휴", "2027-02-08": "설날", "2027-02-09": "설날연휴",
    "2027-03-01": "삼일절", "2027-05-05": "어린이날", "2027-05-13": "부처님오신날", "2027-06-06": "현충일",
    "2027-07-17": "제헌절", "2027-08-15": "광복절", "2027-09-14": "추석연휴", "2027-09-15": "추석",
    "2027-09-16": "추석연휴", "2027-10-03": "개천절", "2027-10-09": "한글날", "2027-12-25": "크리스마스",
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const formatWon = (n) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n || 0);
function formatWonUnit(n) {
    n = Math.round(Number(n) || 0);
    const neg = n < 0;
    n = Math.abs(n);
    const eok = Math.floor(n / 100000000), man = Math.floor((n % 100000000) / 10000);
    let str;
    if (eok > 0 && man > 0)
        str = `${eok.toLocaleString("ko-KR")}억 ${man.toLocaleString("ko-KR")}만원`;
    else if (eok > 0)
        str = `${eok.toLocaleString("ko-KR")}억원`;
    else if (man > 0)
        str = `${man.toLocaleString("ko-KR")}만원`;
    else
        str = `${n.toLocaleString("ko-KR")}원`;
    return (neg ? "-" : "") + str;
}
const todayStr = () => new Date().toISOString().slice(0, 10);
function parseDateStr(ds) {
    const parts = (ds || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN))
        return new Date(NaN);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}
function dDayLabel(dateStr) {
    const target = parseDateStr(dateStr);
    if (isNaN(target.getTime()))
        return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    if (diff === 0)
        return "D-DAY";
    if (diff > 0)
        return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
}
function daysBetween(fromDate, toDate) {
    const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const b = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return Math.round((b - a) / 86400000);
}
function monthsElapsed(start, end) {
    const s = new Date(start), e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()))
        return 0;
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (e.getDate() < s.getDate())
        months -= 1;
    return Math.max(0, months);
}
function maturityInfo(start, target) {
    if (!start || !target)
        return null;
    const s = new Date(start).getTime(), t = new Date(target).getTime(), now = Date.now();
    if (isNaN(s) || isNaN(t) || t <= s)
        return null;
    const pct = Math.min(100, Math.max(0, ((now - s) / (t - s)) * 100));
    const daysLeft = Math.ceil((t - now) / 86400000);
    return { pct, daysLeft };
}
function computeSavingsValue(s) {
    if (s.type === "투자")
        return Number(s.currentValue || 0);
    const principal = Number(s.principal || 0), deposit = Number(s.monthlyDeposit || 0);
    if (!s.startDate)
        return principal;
    const now = new Date();
    const matured = s.targetDate && new Date(s.targetDate) <= now;
    const months = matured ? monthsElapsed(s.startDate, s.targetDate) : monthsElapsed(s.startDate, now);
    return principal + deposit * months;
}
// ---------- 결산 기간(매월 16일 ~ 다음달 15일) ----------
function periodFromStartMonth(year, month) { return { start: new Date(year, month, 16), end: new Date(year, month + 1, 15) }; }
function getCurrentPeriod(refDate) {
    refDate = refDate || new Date();
    const d = refDate.getDate();
    if (d <= 15)
        return periodFromStartMonth(refDate.getFullYear(), refDate.getMonth() - 1);
    return periodFromStartMonth(refDate.getFullYear(), refDate.getMonth());
}
function shiftPeriod(period, dir) { return periodFromStartMonth(period.start.getFullYear(), period.start.getMonth() + dir); }
function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function fmtShortDate(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }
function txInPeriod(transactions, period) {
    const s = toDateStr(period.start), e = toDateStr(period.end);
    return transactions.filter((t) => t.date >= s && t.date <= e);
}
function periodLabel(period) { return `${fmtShortDate(period.start)} ~ ${fmtShortDate(period.end)}`; }
function periodKey(period) { return `${period.start.getFullYear()}-${String(period.start.getMonth() + 1).padStart(2, "0")}`; }
function getBudgetObj(budgets, period) {
    const raw = budgets?.[periodKey(period)];
    if (raw == null)
        return { total: 0, incidental: 0 };
    if (typeof raw === "number")
        return { total: raw, incidental: 0 };
    return { total: Number(raw.total || 0), incidental: Number(raw.incidental || 0) };
}
function txPocket(t) {
    if (t.pocket === "incidental" || t.pocket === "living")
        return t.pocket;
    return t.category === "품위유지비" ? "incidental" : "living";
}
function computeLiquidFunds(transactions, budgets, period) {
    const periodTx = txInPeriod(transactions, period);
    const budgetObj = getBudgetObj(budgets, period);
    const livingExpenseOnly = periodTx.filter((t) => t.type === "expense" && txPocket(t) !== "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalExpense = periodTx.filter((t) => t.type === "expense" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalIncome = periodTx.filter((t) => t.type === "income" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const livingBalance = budgetObj.total - livingExpenseOnly;
    const incidentalBalance = budgetObj.incidental - incidentalExpense + incidentalIncome;
    return livingBalance + incidentalBalance;
}
// ---------- 일정 반복 로직 ----------
function eventOccursOn(ev, d) {
    if (!ev.date)
        return false;
    const startDay = parseDateStr(ev.date);
    if (isNaN(startDay.getTime()))
        return false;
    const cellDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (cellDay < startDay)
        return false;
    const rec = ev.recurrence || "none";
    if (rec === "none")
        return toDateStr(cellDay) === ev.date;
    if (rec === "weekly")
        return cellDay.getDay() === startDay.getDay();
    if (rec === "monthly") {
        const lastDay = new Date(cellDay.getFullYear(), cellDay.getMonth() + 1, 0).getDate();
        return cellDay.getDate() === Math.min(startDay.getDate(), lastDay);
    }
    if (rec === "yearly")
        return cellDay.getMonth() === startDay.getMonth() && cellDay.getDate() === startDay.getDate();
    return false;
}
function eventsForDate(events, d) { return events.filter((ev) => eventOccursOn(ev, d)); }
function upcomingItems(events, holidays, fromDate, days, limit) {
    const items = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i);
        const ds = toDateStr(d);
        if (holidays[ds])
            items.push({ date: ds, title: holidays[ds], isHoliday: true });
        events.forEach((ev) => { if (eventOccursOn(ev, d))
            items.push({ date: ds, title: ev.title, isHoliday: false, recurrence: ev.recurrence }); });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}
// ---------- 타임아웃 있는 fetch ----------
async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    }
    finally {
        clearTimeout(timer);
    }
}
// ---------- 데스크톱(Electron) 브리지 ----------
// exe 로 실행하면 모든 네트워크 요청을 메인 프로세스로 넘겨 CORS 제약 없이 처리한다.
// 브라우저에서 열면 기존처럼 fetch 를 그대로 사용하므로 웹/데스크톱 양쪽에서 동일하게 동작한다.
const DESKTOP = (typeof window !== "undefined" && window.desktop) ? window.desktop : null;
const IS_DESKTOP = !!DESKTOP;
async function httpJson(url, options, timeoutMs) {
    const opt = options || {};
    if (IS_DESKTOP) {
        const r = await DESKTOP.request({ url, method: opt.method || "GET", headers: opt.headers || {}, body: opt.body || null, timeoutMs: timeoutMs || 20000 });
        if (!r.ok)
            throw new Error(r.error || "네트워크 오류");
        try {
            return JSON.parse(r.text);
        }
        catch (e) {
            throw new Error("[PARSE_FAIL] 서버 응답을 해석할 수 없습니다: " + String(r.text).substring(0, 200));
        }
    }
    const res = await fetchWithTimeout(url, opt, timeoutMs || 20000);
    return await res.json();
}
function openExternal(url) {
    if (IS_DESKTOP) {
        DESKTOP.openExternal(url);
        return;
    }
    window.open(url, "_blank", "noopener");
}
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch (e) {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            return true;
        }
        catch (e2) {
            return false;
        }
    }
}
// ---------- Gemini API 직접 호출 ----------
function extractJsonFromText(text, openChar, closeChar) {
    text = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = text.indexOf(openChar);
    const end = text.lastIndexOf(closeChar);
    if (start === -1 || end === -1 || end < start)
        throw new Error("[PARSE_FAIL] 응답에서 JSON을 찾지 못했습니다: " + text.substring(0, 300));
    return text.substring(start, end + 1);
}
async function callGeminiDirect(apiKey, model, promptText, base64, mimeType) {
    const payload = { contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType, data: base64 } }] }] };
    const json = await httpJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, 60000);
    if (json.error)
        throw new Error("[GEMINI_ERROR] " + (json.error.message || "Gemini API 오류"));
    if (!json.candidates || !json.candidates[0])
        throw new Error("[NO_CANDIDATES] 인식 결과가 없습니다.");
    const rawText = (json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text) || "";
    if (!rawText)
        throw new Error("[EMPTY_TEXT] Gemini가 텍스트를 반환하지 않았습니다.");
    return rawText;
}
async function callGeminiWithRetry(apiKey, model, prompt, base64, mimeType) {
    let lastErr;
    for (let attempt = 0; attempt <= 2; attempt++) {
        try {
            return await callGeminiDirect(apiKey, model, prompt, base64, mimeType);
        }
        catch (err) {
            lastErr = err;
            if (err.name === "AbortError")
                throw err;
            if (/high demand|GEMINI_ERROR/i.test(err.message) && attempt < 2) {
                await new Promise((r) => setTimeout(r, 4000));
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
}
function buildReceiptPrompt(today) {
    return '이 이미지는 영수증 또는 결제/이체 내역 스크린샷입니다. 다음 JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON 객체 하나만 출력하세요.\n' +
        '{"date":"YYYY-MM-DD","amount":숫자,"merchant":"가게 또는 거래처 이름","category":"식비|교통|주거/관리비|통신|문화/여가|의료/건강|교육|쇼핑|경조사|품위유지비|기타 중 정확히 하나","type":"expense 또는 income 중 하나"}\n' +
        '날짜를 이미지에서 알 수 없으면 "' + today + '"를 사용하세요. amount는 콤마나 원화기호, 부호(+/-) 없이 순수 숫자만 적으세요(항상 양수). 금액 앞에 -가 있으면 type은 expense, +가 있으면 type은 income입니다.';
}
function buildBatchPrompt(today) {
    return '이 이미지는 한국 은행/카드/간편결제 앱의 거래내역 목록 화면이며, 사용자 본인의 가계부 작성을 위한 개인 데이터입니다. 화면에 보이는 모든 거래 항목을 빠짐없이 추출하는 것이 매우 중요합니다.\n\n' +
        '화면 구조:\n' +
        '- "8월 18일 화요일"처럼 날짜가 섹션 제목으로 나오고, 그 아래 여러 거래가 나열됩니다.\n' +
        '- 각 거래는 상호명 또는 개인 이름(예: 송금 상대방), 시간(예: 21:13), 부호 붙은 금액(예: -26,980원 또는 +9,200원), 거래 후 잔액 순으로 표시됩니다.\n' +
        '- 화면 맨 위쪽 항목처럼 날짜 섹션 제목이 안 보이면, 화면에서 가장 가까운 위쪽 날짜를 사용하거나 그마저 없으면 오늘(' + today + ') 날짜를 사용하세요.\n' +
        '- 상호명 대신 사람 이름(예: "김동현")이 있는 항목도 정상적인 송금/이체 거래이니 다른 항목과 동일하게 추출하세요. 이것은 사용자 본인 소유의 개인 가계부 데이터이며 민감하지 않습니다.\n' +
        '- 금액 앞에 마이너스(-)가 있으면 지출(expense), 플러스(+)가 있으면 입금/환급/취소/캐시백 등 수입(income)입니다. 카드 가승인 취소, 환불, 캐시백처럼 +로 표시된 항목도 절대 빠뜨리지 말고 income으로 추출하세요.\n\n' +
        '다음 JSON 배열 형식으로만 응답하세요. 다른 설명, 주석, 마크다운 없이 순수 JSON 배열만 출력하세요. 화면에 거래 항목이 하나라도 보이면 반드시 그 항목들을 모두 포함해야 하며, 절대 빈 배열 []을 반환하면 안 됩니다.\n' +
        '[{"date":"YYYY-MM-DD","amount":숫자,"merchant":"상호명 또는 사람 이름","category":"카테고리","type":"expense 또는 income 중 하나"}]\n\n' +
        '규칙:\n' +
        '- type: 금액 부호에 따라 expense 또는 income으로 정확히 구분하세요.\n' +
        '- category: type이 income이면 급여|부수입|이자/배당|환급/기타 중 하나, type이 expense이면 식비|교통|주거/관리비|통신|문화/여가|의료/건강|교육|쇼핑|경조사|품위유지비|기타 중 하나를 사용하세요.\n' +
        '- amount: +, -, 콤마, "원" 표시를 모두 제거한 순수 숫자만 사용하세요(항상 양수).\n' +
        '- 거래 후 잔액(작게 표시된 숫자)은 amount로 쓰지 말고 거래 금액만 사용하세요.\n' +
        '- 최대 30건까지 추출하세요.';
}
// ---------- 아이콘 ----------
function Icon({ children, size = 18, color, className = "", style = {} }) {
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, style: style }, children);
}
const IconDashboard = (p) => React.createElement(Icon, { ...p },
    React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }),
    React.createElement("rect", { x: "14", y: "3", width: "7", height: "5", rx: "1.5" }),
    React.createElement("rect", { x: "14", y: "10", width: "7", height: "11", rx: "1.5" }),
    React.createElement("rect", { x: "3", y: "12", width: "7", height: "9", rx: "1.5" }));
const IconPiggy = (p) => React.createElement(Icon, { ...p },
    React.createElement("circle", { cx: "12", cy: "13", r: "7" }),
    React.createElement("path", { d: "M9 13h6M12 10v6" }),
    React.createElement("circle", { cx: "17.5", cy: "8.5", r: "1.3" }));
const IconReceipt = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M6 3h12v16l-2-1.5L14 19l-2-1.5L10 19l-2-1.5L6 19V3z" }),
    React.createElement("line", { x1: "9", y1: "7", x2: "15", y2: "7" }),
    React.createElement("line", { x1: "9", y1: "11", x2: "15", y2: "11" }));
const IconCalendar = (p) => React.createElement(Icon, { ...p },
    React.createElement("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }),
    React.createElement("line", { x1: "16", y1: "3", x2: "16", y2: "7" }),
    React.createElement("line", { x1: "8", y1: "3", x2: "8", y2: "7" }),
    React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" }));
const IconCheckSquare = (p) => React.createElement(Icon, { ...p },
    React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
    React.createElement("polyline", { points: "8 12 11 15 16 9" }));
const IconWallet = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h-4a3 3 0 0 0 0 6h4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" }),
    React.createElement("circle", { cx: "16", cy: "12", r: "1" }));
const IconShield = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M12 3l7 3.5v5c0 4.7-3 8.4-7 9.5-4-1.1-7-4.8-7-9.5v-5L12 3z" }),
    React.createElement("polyline", { points: "9 12 11 14 15 10" }));
const IconHelp = (p) => React.createElement(Icon, { ...p },
    React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
    React.createElement("path", { d: "M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12", y2: "17.01" }));
const IconPlus = (p) => React.createElement(Icon, { ...p },
    React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }));
const IconTrash = (p) => React.createElement(Icon, { ...p },
    React.createElement("polyline", { points: "3 6 5 6 21 6" }),
    React.createElement("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
    React.createElement("path", { d: "M10 11v6" }),
    React.createElement("path", { d: "M14 11v6" }),
    React.createElement("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" }));
const IconPencil = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M12 20h9" }),
    React.createElement("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" }));
const IconX = (p) => React.createElement(Icon, { ...p },
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }));
const IconChevronLeft = (p) => React.createElement(Icon, { ...p },
    React.createElement("polyline", { points: "15 18 9 12 15 6" }));
const IconChevronRight = (p) => React.createElement(Icon, { ...p },
    React.createElement("polyline", { points: "9 18 15 12 9 6" }));
const IconCheck = (p) => React.createElement(Icon, { ...p },
    React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const IconSettings = (p) => (React.createElement(Icon, { ...p },
    React.createElement("circle", { cx: "12", cy: "12", r: "3.2" }),
    [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (React.createElement("rect", { key: deg, x: "11", y: "1.5", width: "2", height: "4", rx: "1", transform: `rotate(${deg} 12 12)` })))));
const IconRefresh = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M21 12a9 9 0 1 1-3-6.7" }),
    React.createElement("polyline", { points: "21 3 21 9 15 9" }));
const IconWifiOff = (p) => React.createElement(Icon, { ...p },
    React.createElement("line", { x1: "2", y1: "2", x2: "22", y2: "22" }),
    React.createElement("path", { d: "M8.5 16.5a5 5 0 0 1 7 0" }),
    React.createElement("path", { d: "M5 12.5a10 10 0 0 1 5-2.7" }),
    React.createElement("path", { d: "M14 9.8a10 10 0 0 1 5 2.7" }),
    React.createElement("line", { x1: "12", y1: "20", x2: "12.01", y2: "20" }));
const IconCamera = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M4 8a2 2 0 0 1 2-2h1.2l.9-1.5A2 2 0 0 1 9.8 3.5h4.4a2 2 0 0 1 1.7 1l.9 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" }),
    React.createElement("circle", { cx: "12", cy: "13", r: "3.5" }));
const IconList = (p) => React.createElement(Icon, { ...p },
    React.createElement("line", { x1: "4", y1: "6", x2: "20", y2: "6" }),
    React.createElement("line", { x1: "4", y1: "12", x2: "20", y2: "12" }),
    React.createElement("line", { x1: "4", y1: "18", x2: "20", y2: "18" }));
const IconStar = (p) => React.createElement(Icon, { ...p },
    React.createElement("polygon", { points: "12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2" }));
const IconExpand = (p) => React.createElement(Icon, { ...p },
    React.createElement("path", { d: "M8 3H5a2 2 0 0 0-2 2v3" }),
    React.createElement("path", { d: "M16 3h3a2 2 0 0 1 2 2v3" }),
    React.createElement("path", { d: "M21 16v3a2 2 0 0 1-2 2h-3" }),
    React.createElement("path", { d: "M3 16v3a2 2 0 0 0 2 2h3" }));
const IconMinus = (p) => React.createElement(Icon, { ...p },
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }));
const NAV = [
    { id: "dashboard", label: "대시보드", shortLabel: "대시보드", icon: IconDashboard },
    { id: "savings", label: "예적금/투자", shortLabel: "예적금", icon: IconPiggy },
    { id: "insurance", label: "고정지출관리", shortLabel: "고정지출", icon: IconShield },
    { id: "expenses", label: "생활비관리", shortLabel: "생활비", icon: IconReceipt },
    { id: "calendar", label: "일정관리", shortLabel: "일정", icon: IconCalendar },
    { id: "todo", label: "할일", shortLabel: "할일", icon: IconCheckSquare },
    { id: "accounts", label: "계좌관리", shortLabel: "계좌", icon: IconWallet },
];
// ---------- 로컬 설정 저장 ----------
async function loadLocal(key, fallback) { try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
}
catch (e) {
    return fallback;
} }
async function saveLocal(key, value) { try {
    localStorage.setItem(key, JSON.stringify(value));
}
catch (e) {
    console.error("local save failed", key, e);
} }
// ---------- 오프라인 캐시 ----------
// 마지막으로 동기화된 데이터를 이 PC 에 보관한다. 인터넷이 끊겨도 조회는 가능하게 하기 위함.
const CACHE_PREFIX = "hh-cache::";
function cacheSet(key, value) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value: value }));
    }
    catch (e) { /* 용량 초과 등은 무시 */ }
}
function cacheGet(key, fallback) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw)
            return { value: fallback, at: null };
        const p = JSON.parse(raw);
        return { value: (p && "value" in p) ? p.value : fallback, at: (p && p.at) || null };
    }
    catch (e) {
        return { value: fallback, at: null };
    }
}
// ---------- 구글 Apps Script 원격 저장 ----------
function withToken(cfg, url) {
    if (!cfg || !cfg.token)
        return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "t=" + encodeURIComponent(cfg.token);
}
async function remoteLoad(cfg, key, fallback) {
    const data = await httpJson(withToken(cfg, `${cfg.apiUrl}?key=${encodeURIComponent(key)}`), {}, 20000);
    if (data.error)
        throw new Error(data.error);
    const value = data.value ? JSON.parse(data.value) : fallback;
    cacheSet(key, value);
    return value;
}
async function remoteSave(cfg, key, value) {
    const data = await httpJson(withToken(cfg, cfg.apiUrl), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ key: key, value: JSON.stringify(value), action: "set", token: (cfg && cfg.token) || "" }),
    }, 20000);
    if (data.error)
        throw new Error(data.error);
    cacheSet(key, value);
    return true;
}
async function remoteDelete(cfg, key) {
    const data = await httpJson(withToken(cfg, cfg.apiUrl), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ key: key, action: "delete", token: (cfg && cfg.token) || "" }),
    }, 20000);
    if (data.error)
        throw new Error(data.error);
    try {
        localStorage.removeItem(CACHE_PREFIX + key);
    }
    catch (e) { }
    return true;
}
// 이 PC 에 저장된 앱 정보를 모두 지운다 (연결 주소·열쇠·캐시·안내 표시 여부).
function wipeLocal(keepGeminiKey) {
    try {
        const gem = keepGeminiKey ? localStorage.getItem("hh-gemini-key") : null;
        const drop = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf("hh-") === 0)
                drop.push(k);
        }
        drop.forEach((k) => localStorage.removeItem(k));
        if (gem)
            localStorage.setItem("hh-gemini-key", gem);
    }
    catch (e) { }
}
async function pingServer(apiUrl, token) {
    const base = `${apiUrl}?action=ping`;
    const url = token ? base + "&t=" + encodeURIComponent(token) : base;
    const data = await httpJson(url, {}, 15000);
    if (data.error)
        throw new Error(data.error);
    if (!data.ok)
        throw new Error("서버가 올바르게 응답하지 않았어요.");
    return data;
}
// ---------- 백업 파일 내보내기 / 가져오기 ----------
const DATA_KEYS = ["hh-title", "hh-accounts", "hh-transactions", "hh-savings", "hh-insurance", "hh-fixed-expenses", "hh-events", "hh-todos", "hh-budget", "hh-transfers"];
async function exportBackupFile(dataObj) {
    const payload = { app: "우리집 가계부", version: 1, exportedAt: new Date().toISOString(), data: dataObj };
    const text = JSON.stringify(payload, null, 2);
    const name = "가계부백업_" + new Date().toISOString().slice(0, 10) + ".json";
    if (IS_DESKTOP)
        return await DESKTOP.saveFile({ defaultName: name, content: text });
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return { ok: true, path: name };
}
async function importBackupFile() {
    if (IS_DESKTOP)
        return await DESKTOP.openFile();
    return await new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.onchange = () => {
            const f = input.files && input.files[0];
            if (!f)
                return resolve({ ok: false, canceled: true });
            const r = new FileReader();
            r.onload = () => resolve({ ok: true, content: String(r.result) });
            r.onerror = () => resolve({ ok: false, error: "파일을 읽지 못했어요." });
            r.readAsText(f);
        };
        input.click();
    });
}
async function fileToResizedBase64(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.82;
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    const img = await new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = dataUrl; });
    let width = img.width, height = img.height;
    if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return { base64: canvas.toDataURL("image/jpeg", quality).split(",")[1], mimeType: "image/jpeg" };
}
// ---------- 공용 UI ----------
function Card({ children, style, className = "", lift = false }) {
    return React.createElement("div", { className: `rounded-2xl p-5 md:p-6 ${lift ? "lift-card" : ""} ${className}`, style: { background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, transition: "transform 0.25s ease, box-shadow 0.25s ease", ...style } }, children);
}
function Field({ label, children }) { return React.createElement("label", { className: "flex flex-col gap-1 text-sm", style: { color: C.inkSoft } },
    React.createElement("span", null, label),
    children); }
const inputStyle = { border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 11px", fontSize: "14px", background: "#FCFBF8", color: C.ink, outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease" };
function TextInput(props) { return React.createElement("input", { lang: "ko", autoCapitalize: "off", ...props, style: { ...inputStyle, ...(props.style || {}) }, className: "w-full focus-ring" }); }
function SelectInput({ children, ...props }) { return React.createElement("select", { ...props, style: { ...inputStyle, ...(props.style || {}) }, className: "w-full focus-ring" }, children); }
function MoneyInput({ value, onChange, ...rest }) {
    const display = value === "" || value === null || value === undefined ? "" : Number(value).toLocaleString("ko-KR");
    return React.createElement(TextInput, { ...rest, value: display, onChange: (e) => onChange(e.target.value.replace(/[^0-9]/g, "")), inputMode: "numeric" });
}
function DateInput({ value, onChange, style }) {
    const thisYear = new Date().getFullYear();
    const parts = (value || "").split("-");
    const y = parts[0] || "", m = parts[1] ? String(Number(parts[1])) : "", d = parts[2] ? String(Number(parts[2])) : "";
    const years = [];
    for (let yy = thisYear + 3; yy >= thisYear - 20; yy--)
        years.push(yy);
    const daysInMonth = (yy, mm) => new Date(Number(yy) || thisYear, Number(mm) || 1, 0).getDate();
    const days = Array.from({ length: y && m ? daysInMonth(y, m) : 31 }, (_, i) => i + 1);
    const update = (ny, nm, nd) => {
        if (!ny || !nm || !nd) {
            onChange("");
            return;
        }
        const dd = Math.min(Number(nd), daysInMonth(ny, nm));
        onChange(`${ny}-${String(nm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
    };
    return (React.createElement("div", { className: "flex gap-1 w-full", style: style },
        React.createElement(SelectInput, { value: y, onChange: (e) => update(e.target.value, m || "1", d || "1"), style: { flex: "1.2", minWidth: 0, paddingLeft: 6, paddingRight: 2 } },
            React.createElement("option", { value: "" }, "\uB144"),
            years.map((yy) => React.createElement("option", { key: yy, value: yy }, yy))),
        React.createElement(SelectInput, { value: m, onChange: (e) => update(y || String(thisYear), e.target.value, d || "1"), style: { flex: 1, minWidth: 0, paddingLeft: 6, paddingRight: 2 } },
            React.createElement("option", { value: "" }, "\uC6D4"),
            Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => React.createElement("option", { key: mm, value: mm }, mm))),
        React.createElement(SelectInput, { value: d, onChange: (e) => update(y || String(thisYear), m || "1", e.target.value), style: { flex: 1, minWidth: 0, paddingLeft: 6, paddingRight: 2 } },
            React.createElement("option", { value: "" }, "\uC77C"),
            days.map((dd) => React.createElement("option", { key: dd, value: dd }, dd)))));
}
function IconBtn({ onClick, title, children, danger, style }) {
    return (React.createElement("button", { onClick: onClick, title: title, className: "p-2 rounded-lg transition-all duration-150 active:scale-90", style: { color: danger ? C.negative : C.inkSoft, ...style }, onMouseEnter: (e) => (e.currentTarget.style.background = danger ? C.negativeSoft : "#EFEAE0"), onMouseLeave: (e) => (e.currentTarget.style.background = "transparent") }, children));
}
function PrimaryBtn({ onClick, children, type = "button" }) {
    return (React.createElement("button", { type: type, onClick: onClick, className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-90 hover:-translate-y-px active:scale-95", style: { background: C.ink, color: "#fff", boxShadow: "0 2px 8px -2px rgba(24,26,32,0.35)" } }, children));
}
function SectionTitle({ children, action }) { return React.createElement("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2" },
    React.createElement("h3", { className: "text-base md:text-lg font-semibold", style: { color: C.ink } }, children),
    action); }
function Empty({ text }) { return React.createElement("div", { className: "text-sm py-8 text-center", style: { color: C.muted } }, text); }
function AnimatedNumber({ value, duration = 700 }) {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);
    useEffect(() => {
        const from = prevRef.current, to = Number(value) || 0, start = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - t, 3);
            setDisplay(from + (to - from) * eased);
            if (t < 1)
                raf = requestAnimationFrame(tick);
            else
                prevRef.current = to;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return React.createElement(React.Fragment, null, formatWon(display));
}
function SimpleBarChart({ data, height = 220 }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 10, height, paddingTop: 24 } }, data.map((d) => (React.createElement("div", { key: d.name, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" } },
        React.createElement("div", { style: { fontSize: 10, color: C.muted, whiteSpace: "nowrap" } },
            Math.round(d.value / 10000),
            "\uB9CC"),
        React.createElement("div", { style: { width: "100%", maxWidth: 34, height: `${Math.max(4, (d.value / max) * 100)}%`, background: C.accent, borderRadius: "6px 6px 0 0", transition: "height 0.7s cubic-bezier(0.16,1,0.3,1)" } }),
        React.createElement("div", { style: { fontSize: 10, color: C.muted, textAlign: "center" } }, d.name))))));
}
function BudgetBar({ spent, budget }) {
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    const over = budget > 0 && spent > budget;
    return React.createElement("div", { className: "h-2.5 rounded-full overflow-hidden", style: { background: "#EFEAE0" } },
        React.createElement("div", { className: "h-2.5 rounded-full", style: { width: `${pct}%`, background: over ? C.negative : C.positive, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" } }));
}
function PocketToggle({ value, onChange }) {
    const isIncidental = value === "incidental";
    return (React.createElement("div", { className: "relative inline-flex w-full rounded-full p-1", style: { background: "#EFEAE0" } },
        React.createElement("div", { className: "absolute top-1 bottom-1 rounded-full transition-all duration-250", style: {
                width: "calc(50% - 4px)",
                left: isIncidental ? "calc(50% + 2px)" : "4px",
                background: isIncidental ? C.accent : C.ink,
                boxShadow: "0 2px 6px -2px rgba(24,26,32,0.35)",
            } }),
        React.createElement("button", { type: "button", onClick: () => onChange("living"), className: "relative z-10 flex-1 py-2 text-sm font-medium rounded-full transition-colors duration-150", style: { color: isIncidental ? C.inkSoft : "#fff" } }, "\uC0DD\uD65C\uBE44"),
        React.createElement("button", { type: "button", onClick: () => onChange("incidental"), className: "relative z-10 flex-1 py-2 text-sm font-medium rounded-full transition-colors duration-150", style: { color: isIncidental ? "#fff" : C.inkSoft } }, "\uD488\uC704\uC720\uC9C0\uBE44")));
}
// 정렬 토글 버튼 (예: 기본순 / 예금주순 / 종류순)
function SortToggle({ value, onChange, options }) {
    return (React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
        React.createElement("span", { className: "text-xs", style: { color: C.muted } }, "\uC815\uB82C"),
        options.map((opt) => (React.createElement("button", { key: opt.value, onClick: () => onChange(opt.value), className: "px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150", style: { background: value === opt.value ? C.ink : C.surface, color: value === opt.value ? "#fff" : C.inkSoft, border: `1px solid ${value === opt.value ? C.ink : C.border}` } }, opt.label)))));
}
// ---------- 안내용 화면 모형 (직접 그린 SVG. 실제 구글 화면 캡처가 아닙니다) ----------
function MockFrame({ title, w, h, children }) {
    return (React.createElement("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", role: "img", "aria-label": title, style: { display: "block", borderRadius: 10, border: `1px solid ${C.border}`, background: "#FFFFFF" } },
        React.createElement("rect", { x: "0", y: "0", width: w, height: "20", fill: "#F1EEE7" }),
        React.createElement("circle", { cx: "10", cy: "10", r: "3", fill: "#DDD5C4" }),
        React.createElement("circle", { cx: "20", cy: "10", r: "3", fill: "#DDD5C4" }),
        React.createElement("circle", { cx: "30", cy: "10", r: "3", fill: "#DDD5C4" }),
        React.createElement("text", { x: "42", y: "13.5", fontSize: "8", fill: "#9A9CA6" }, title),
        children));
}
function Pin({ x, y, n }) {
    return (React.createElement("g", null,
        React.createElement("circle", { cx: x, cy: y, r: "9", fill: C.accent, opacity: "0.3" },
            React.createElement("animate", { attributeName: "r", values: "9;15;9", dur: "2s", repeatCount: "indefinite" }),
            React.createElement("animate", { attributeName: "opacity", values: "0.35;0;0.35", dur: "2s", repeatCount: "indefinite" })),
        React.createElement("circle", { cx: x, cy: y, r: "8", fill: C.accent }),
        React.createElement("text", { x: x, y: y + 3.2, fontSize: "9.5", fontWeight: "700", fill: "#FFFFFF", textAnchor: "middle" }, n)));
}
function Hi({ x, y, w, h }) {
    return React.createElement("rect", { x: x, y: y, width: w, height: h, rx: "4", fill: "none", stroke: C.accent, strokeWidth: "1.6", strokeDasharray: "4 3" },
        React.createElement("animate", { attributeName: "stroke-dashoffset", values: "14;0", dur: "1.2s", repeatCount: "indefinite" }));
}
/* 1단계 — 스프레드시트 메뉴 */
function MockSheets() {
    const menu = ["파일", "수정", "보기", "삽입", "서식", "데이터", "도구", "확장 프로그램", "도움말"];
    let x = 8;
    const items = menu.map((m) => { const el = { m, x }; x += m.length * 7.2 + 12; return el; });
    const ext = items[7];
    return (React.createElement(MockFrame, { title: "\uAC00\uACC4\uBD80 \uB370\uC774\uD130 \u2014 Google \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8", w: 360, h: 150 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "16", fill: "#FFFFFF" }),
        items.map((it) => (React.createElement("text", { key: it.m, x: it.x, y: "31", fontSize: "7.5", fill: it.m === "확장 프로그램" ? C.accentDeep : "#585B66", fontWeight: it.m === "확장 프로그램" ? "700" : "400" }, it.m))),
        React.createElement(Hi, { x: ext.x - 4, y: 22, w: 62, h: 12 }),
        React.createElement("rect", { x: "0", y: "38", width: "360", height: "12", fill: "#F7F5F0" }),
        [0, 1, 2, 3, 4, 5].map((i) => React.createElement("line", { key: i, x1: 30 + i * 55, y1: "38", x2: 30 + i * 55, y2: "150", stroke: "#EDE9E0", strokeWidth: "1" })),
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => React.createElement("line", { key: i, x1: "0", y1: 50 + i * 13, x2: "360", y2: 50 + i * 13, stroke: "#EDE9E0", strokeWidth: "1" })),
        React.createElement(Pin, { x: ext.x + 66, y: 28, n: 1 }),
        React.createElement("text", { x: "8", y: "146", fontSize: "7", fill: "#9A9CA6" }, "\u2460 \uC0C1\uB2E8 \uBA54\uB274\uC5D0\uC11C [\uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8] \u2192 [Apps Script] \uB97C \uB204\uB974\uC138\uC694")));
}
/* 2단계 — Apps Script 편집기 */
function MockEditor() {
    return (React.createElement(MockFrame, { title: "Apps Script \u2014 \uC81C\uBAA9 \uC5C6\uB294 \uD504\uB85C\uC81D\uD2B8", w: 360, h: 190 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "18", fill: "#FFFFFF" }),
        React.createElement("rect", { x: "243", y: "24", width: "26", height: "11", rx: "3", fill: "#EFEAE0" }),
        React.createElement("text", { x: "248", y: "32", fontSize: "6.5", fill: "#585B66" }, "\uC800\uC7A5"),
        React.createElement("rect", { x: "273", y: "24", width: "26", height: "11", rx: "3", fill: "#EFEAE0" }),
        React.createElement("text", { x: "278", y: "32", fontSize: "6.5", fill: "#585B66" }, "\uC2E4\uD589"),
        React.createElement("rect", { x: "303", y: "24", width: "30", height: "11", rx: "3", fill: C.accent }),
        React.createElement("text", { x: "309", y: "32", fontSize: "6.5", fill: "#FFFFFF" }, "\uBC30\uD3EC \u25BE"),
        React.createElement("rect", { x: "0", y: "38", width: "86", height: "152", fill: "#FAF9F6" }),
        React.createElement("text", { x: "8", y: "50", fontSize: "7", fill: "#9A9CA6" }, "\uD30C\uC77C"),
        React.createElement("rect", { x: "4", y: "55", width: "78", height: "13", rx: "3", fill: C.accentSoft }),
        React.createElement("text", { x: "10", y: "64", fontSize: "7.5", fill: C.accentDeep, fontWeight: "700" }, "Code.gs"),
        React.createElement("text", { x: "10", y: "80", fontSize: "7.5", fill: "#9A9CA6" }, "appsscript.json"),
        React.createElement("rect", { x: "86", y: "38", width: "274", height: "152", fill: "#FFFFFF" }),
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (React.createElement("g", { key: i },
            React.createElement("text", { x: "92", y: 54 + i * 14, fontSize: "6.5", fill: "#C9C4B8" }, i + 1),
            React.createElement("rect", { x: "104", y: 48 + i * 14, width: i === 0 ? 120 : i % 3 === 0 ? 180 : 145, height: "5", rx: "2.5", fill: "#E9E4D8" })))),
        React.createElement(Hi, { x: 104, y: 44, w: 240, h: 128 }),
        React.createElement(Pin, { x: 76, y: 61, n: 1 }),
        React.createElement(Pin, { x: 224, y: 108, n: 2 }),
        React.createElement(Pin, { x: 340, y: 22, n: 3 })));
}
/* 3단계 — 배포 설정 */
function MockDeploy() {
    return (React.createElement(MockFrame, { title: "\uC0C8 \uBC30\uD3EC", w: 360, h: 185 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "165", fill: "#FFFFFF" }),
        React.createElement("text", { x: "16", y: "40", fontSize: "9", fontWeight: "700", fill: "#181A20" }, "\uC0C8 \uBC30\uD3EC"),
        React.createElement("circle", { cx: "330", cy: "37", r: "9", fill: "#EFEAE0" }),
        React.createElement("text", { x: "330", y: "40", fontSize: "8", fill: "#585B66", textAnchor: "middle" }, "\u2699"),
        React.createElement(Pin, { x: 348, y: 37, n: 1 }),
        [["유형 선택", "웹 앱"], ["다음 사용자로 실행", "나 (본인 계정)"], ["액세스 권한", "모든 사용자"]].map((row, i) => (React.createElement("g", { key: row[0] },
            React.createElement("text", { x: "16", y: 68 + i * 30, fontSize: "7.5", fill: "#9A9CA6" }, row[0]),
            React.createElement("rect", { x: "16", y: 73 + i * 30, width: "200", height: "15", rx: "4", fill: "#FAF9F6", stroke: "#E6E0D2" }),
            React.createElement("text", { x: "24", y: 83.5 + i * 30, fontSize: "8", fill: "#181A20", fontWeight: "600" }, row[1])))),
        React.createElement(Hi, { x: 14, y: 131, w: 204, h: 19 }),
        React.createElement(Pin, { x: 236, y: 140, n: 2 }),
        React.createElement("rect", { x: "272", y: 158, width: "72", height: "17", rx: "5", fill: C.accent }),
        React.createElement("text", { x: "308", y: 169.5, fontSize: "8", fill: "#FFFFFF", textAnchor: "middle" }, "\uBC30\uD3EC"),
        React.createElement(Pin, { x: 258, y: 166, n: 3 })));
}
// ---------- QR 코드 생성 (byte 모드 / ECC L / 버전 1~10) ----------
// 오프라인에서도 동작해야 하므로 외부 라이브러리 없이 직접 구현했다.
// 개발 시 OpenCV 디코더로 294건, 자체 디코더로 290건 검증 완료.
const EC_L = {
    //  version: [ecCodewordsPerBlock, [ [blockCount, dataCodewordsPerBlock], ... ] ]
    1: [7, [[1, 19]]],
    2: [10, [[1, 34]]],
    3: [15, [[1, 55]]],
    4: [20, [[1, 80]]],
    5: [26, [[1, 108]]],
    6: [18, [[2, 68]]],
    7: [20, [[2, 78]]],
    8: [24, [[2, 97]]],
    9: [30, [[2, 116]]],
    10: [18, [[2, 68], [2, 69]]],
};
const ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};
// ---- GF(256) ----
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP[i] = x;
        LOG[x] = i;
        x <<= 1;
        if (x & 0x100)
            x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++)
        EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);
function rsGenerator(deg) {
    let poly = [1];
    for (let i = 0; i < deg; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= gmul(poly[j], 1);
            next[j + 1] ^= gmul(poly[j], EXP[i]);
        }
        poly = next;
    }
    return poly;
}
function rsEncode(data, ecLen) {
    const gen = rsGenerator(ecLen);
    const res = new Array(ecLen).fill(0);
    for (const b of data) {
        const factor = b ^ res[0];
        res.shift();
        res.push(0);
        for (let i = 0; i < ecLen; i++)
            res[i] ^= gmul(gen[i + 1], factor);
    }
    return res;
}
// ---- 비트 스트림 ----
class Bits {
    constructor() { this.arr = []; }
    put(val, len) { for (let i = len - 1; i >= 0; i--)
        this.arr.push((val >>> i) & 1); }
    get length() { return this.arr.length; }
}
function utf8Bytes(str) {
    const out = [];
    for (const ch of str) {
        let c = ch.codePointAt(0);
        if (c < 0x80)
            out.push(c);
        else if (c < 0x800)
            out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000)
            out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else
            out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
}
function pickVersion(byteLen) {
    for (let v = 1; v <= 10; v++) {
        const [ec, groups] = EC_L[v];
        const totalData = groups.reduce((s, [n, d]) => s + n * d, 0);
        const ccBits = v < 10 ? 8 : 16;
        const need = Math.ceil((4 + ccBits + byteLen * 8) / 8);
        if (need <= totalData)
            return v;
    }
    throw new Error("QR: 내용이 너무 깁니다");
}
function buildCodewords(bytes, version) {
    const [ecLen, groups] = EC_L[version];
    const totalData = groups.reduce((s, [n, d]) => s + n * d, 0);
    const ccBits = version < 10 ? 8 : 16;
    const bits = new Bits();
    bits.put(0b0100, 4);
    bits.put(bytes.length, ccBits);
    for (const b of bytes)
        bits.put(b, 8);
    const cap = totalData * 8;
    for (let i = 0; i < 4 && bits.length < cap; i++)
        bits.arr.push(0);
    while (bits.length % 8 !== 0)
        bits.arr.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
        let v = 0;
        for (let j = 0; j < 8; j++)
            v = (v << 1) | bits.arr[i + j];
        data.push(v);
    }
    const PAD = [0xec, 0x11];
    let pi = 0;
    while (data.length < totalData)
        data.push(PAD[pi++ % 2]);
    // 블록 분할
    const blocks = [];
    let off = 0;
    for (const [count, dlen] of groups) {
        for (let i = 0; i < count; i++) {
            const d = data.slice(off, off + dlen);
            off += dlen;
            blocks.push({ d, e: rsEncode(d, ecLen) });
        }
    }
    // 인터리브
    const out = [];
    const maxD = Math.max(...blocks.map((b) => b.d.length));
    for (let i = 0; i < maxD; i++)
        for (const b of blocks)
            if (i < b.d.length)
                out.push(b.d[i]);
    for (let i = 0; i < ecLen; i++)
        for (const b of blocks)
            out.push(b.e[i]);
    return out;
}
// ---- 모듈 배치 ----
function buildMatrix(version, codewords) {
    const size = version * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(null));
    const fixed = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (r, c, v) => { m[r][c] = v; fixed[r][c] = true; };
    const finder = (r0, c0) => {
        for (let r = -1; r <= 7; r++)
            for (let c = -1; c <= 7; c++) {
                const rr = r0 + r, cc = c0 + c;
                if (rr < 0 || cc < 0 || rr >= size || cc >= size)
                    continue;
                const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6 &&
                    (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
                set(rr, cc, inner ? 1 : 0);
            }
    };
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);
    for (let i = 8; i < size - 8; i++) {
        set(6, i, i % 2 === 0 ? 1 : 0);
        set(i, 6, i % 2 === 0 ? 1 : 0);
    }
    const ac = ALIGN[version];
    for (const r of ac)
        for (const c of ac) {
            if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6))
                continue;
            for (let dr = -2; dr <= 2; dr++)
                for (let dc = -2; dc <= 2; dc++) {
                    const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
                    set(r + dr, c + dc, on ? 1 : 0);
                }
        }
    set(size - 8, 8, 1); // dark module
    // 포맷 정보 자리 예약
    for (let i = 0; i < 9; i++) {
        if (m[8][i] === null)
            set(8, i, 0);
        if (m[i][8] === null)
            set(i, 8, 0);
    }
    for (let i = 0; i < 8; i++) {
        if (m[8][size - 1 - i] === null)
            set(8, size - 1 - i, 0);
        if (m[size - 1 - i][8] === null)
            set(size - 1 - i, 8, 0);
    }
    // 버전 정보 자리 (v7+)
    if (version >= 7) {
        for (let i = 0; i < 6; i++)
            for (let j = 0; j < 3; j++) {
                set(size - 11 + j, i, 0);
                set(i, size - 11 + j, 0);
            }
    }
    // 데이터 배치
    let bitIdx = 0;
    const nextBit = () => {
        if (bitIdx >= codewords.length * 8)
            return 0;
        const b = (codewords[bitIdx >> 3] >>> (7 - (bitIdx & 7))) & 1;
        bitIdx++;
        return b;
    };
    let up = true;
    for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6)
            col--;
        for (let i = 0; i < size; i++) {
            const row = up ? size - 1 - i : i;
            for (const c of [col, col - 1]) {
                if (fixed[row][c])
                    continue;
                m[row][c] = nextBit();
            }
        }
        up = !up;
    }
    return { m, fixed, size };
}
const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];
function applyMask(base, fixed, size, maskId) {
    const fn = MASKS[maskId];
    const out = base.map((row) => row.slice());
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) {
            if (!fixed[r][c] && fn(r, c))
                out[r][c] ^= 1;
        }
    return out;
}
// 포맷 정보 (ECC L = 01)
function formatBits(maskId) {
    let data = (0b01 << 3) | maskId;
    let rem = data;
    for (let i = 0; i < 10; i++)
        rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
}
function versionBits(version) {
    let rem = version;
    for (let i = 0; i < 12; i++)
        rem = (rem << 1) ^ (((rem >>> 11) & 1) * 0x1f25);
    return (version << 12) | rem;
}
function placeFormat(m, size, maskId) {
    const bits = formatBits(maskId);
    // 규격상 (8,0) 자리에 최상위 비트가 온다.
    const get = (i) => (bits >>> (14 - i)) & 1;
    for (let i = 0; i <= 5; i++)
        m[8][i] = get(i);
    m[8][7] = get(6);
    m[8][8] = get(7);
    m[7][8] = get(8);
    for (let i = 9; i <= 14; i++)
        m[14 - i][8] = get(i);
    for (let i = 0; i <= 6; i++)
        m[size - 1 - i][8] = get(i); // 아래쪽 세로 7칸
    for (let i = 7; i <= 14; i++)
        m[8][size - 15 + i] = get(i); // 오른쪽 가로 8칸
    m[size - 8][8] = 1;
}
function placeVersion(m, size, version) {
    if (version < 7)
        return;
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
        const b = (bits >>> i) & 1;
        const r = Math.floor(i / 3), c = i % 3;
        m[size - 11 + c][r] = b;
        m[r][size - 11 + c] = b;
    }
}
function penalty(m, size) {
    let p = 0;
    // 규칙 1: 같은 색 연속
    for (let i = 0; i < size; i++) {
        for (const dir of [0, 1]) {
            let run = 1;
            for (let j = 1; j < size; j++) {
                const a = dir ? m[j - 1][i] : m[i][j - 1];
                const b = dir ? m[j][i] : m[i][j];
                if (a === b) {
                    run++;
                    if (run === 5)
                        p += 3;
                    else if (run > 5)
                        p += 1;
                }
                else
                    run = 1;
            }
        }
    }
    // 규칙 2: 2x2 블록
    for (let r = 0; r < size - 1; r++)
        for (let c = 0; c < size - 1; c++) {
            const v = m[r][c];
            if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1])
                p += 3;
        }
    // 규칙 3: 1:1:3:1:1 패턴
    const PAT = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const PAT2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (let i = 0; i < size; i++)
        for (let j = 0; j + 11 <= size; j++) {
            let okH = true, okV = true;
            for (let k = 0; k < 11; k++) {
                if (m[i][j + k] !== PAT[k])
                    okH = false;
                if (m[j + k][i] !== PAT[k])
                    okV = false;
            }
            if (okH)
                p += 40;
            if (okV)
                p += 40;
            let okH2 = true, okV2 = true;
            for (let k = 0; k < 11; k++) {
                if (m[i][j + k] !== PAT2[k])
                    okH2 = false;
                if (m[j + k][i] !== PAT2[k])
                    okV2 = false;
            }
            if (okH2)
                p += 40;
            if (okV2)
                p += 40;
        }
    // 규칙 4: 흑백 비율
    let dark = 0;
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (m[r][c])
                dark++;
    const ratio = (dark * 100) / (size * size);
    p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return p;
}
function qrMatrix(text) {
    const bytes = utf8Bytes(text);
    const version = pickVersion(bytes.length);
    const codewords = buildCodewords(bytes, version);
    const { m: base, fixed, size } = buildMatrix(version, codewords);
    let best = null, bestP = Infinity;
    for (let mask = 0; mask < 8; mask++) {
        const cand = applyMask(base, fixed, size, mask);
        placeFormat(cand, size, mask);
        placeVersion(cand, size, version);
        const p = penalty(cand, size);
        if (p < bestP) {
            bestP = p;
            best = cand;
        }
    }
    return best;
}
function QrCode({ text, size, caption }) {
    const px = size || 190;
    let mat = null, err = null;
    try {
        mat = qrMatrix(text);
    }
    catch (e) {
        err = e.message || String(e);
    }
    if (err)
        return React.createElement("div", { className: "text-xs", style: { color: C.negative } },
            "QR \uC0DD\uC131 \uC2E4\uD328: ",
            err);
    const n = mat.length, quiet = 4, total = n + quiet * 2;
    const cells = [];
    for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
            if (mat[r][c])
                cells.push(`M${c + quiet} ${r + quiet}h1v1h-1z`);
    return (React.createElement("div", { className: "flex flex-col items-center" },
        React.createElement("svg", { width: px, height: px, viewBox: `0 0 ${total} ${total}`, shapeRendering: "crispEdges", style: { background: "#FFFFFF", borderRadius: 8, border: `1px solid ${C.border}` } },
            React.createElement("path", { d: cells.join(""), fill: "#181A20" })),
        caption && React.createElement("div", { className: "text-xs mt-1.5 text-center", style: { color: C.muted } }, caption)));
}
// ---------- 자동 넘김 슬라이드 ----------
function Carousel({ slides, interval }) {
    const [i, setI] = useState(0);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (paused || slides.length < 2)
            return;
        const id = setTimeout(() => setI((v) => (v + 1) % slides.length), interval || 2600);
        return () => clearTimeout(id);
    }, [i, paused, slides.length, interval]);
    const cur = slides[i] || slides[0];
    return (React.createElement("div", { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) },
        React.createElement("div", { className: "flex items-center justify-between mb-1.5" },
            React.createElement("div", { className: "text-xs font-semibold", style: { color: C.accentDeep } },
                i + 1,
                "/",
                slides.length,
                " \u00B7 ",
                cur.label),
            React.createElement("div", { className: "flex items-center gap-2" },
                paused && React.createElement("span", { className: "text-xs", style: { color: C.muted } }, "\uBA48\uCDA4"),
                React.createElement("div", { className: "flex gap-1.5" }, slides.map((sl, n) => (React.createElement("button", { key: n, onClick: () => setI(n), "aria-label": `${n + 1}번째 그림`, className: "rounded-full", style: { width: n === i ? 16 : 6, height: 6, background: n === i ? C.accent : C.border, transition: "width .2s ease" } })))))),
        React.createElement("div", { key: i, className: "fade-in-up" }, cur.el),
        React.createElement("div", { className: "text-xs mt-1.5 leading-relaxed", style: { color: C.inkSoft } }, cur.cap),
        React.createElement("div", { className: "text-xs mt-1", style: { color: C.muted } }, "\uADF8\uB9BC \uC704\uC5D0 \uB9C8\uC6B0\uC2A4\uB97C \uC62C\uB9AC\uBA74 \uBA48\uCDA5\uB2C8\uB2E4. \uC544\uB798 \uC810\uC744 \uB20C\uB7EC \uC6D0\uD558\uB294 \uADF8\uB9BC\uC73C\uB85C \uC774\uB3D9\uD560 \uC218 \uC788\uC5B4\uC694.")));
}
/* 3-① 배포 버튼과 드롭다운 위치 */
function MockDeployMenu() {
    return (React.createElement(MockFrame, { title: "Apps Script \u2014 \uC81C\uBAA9 \uC5C6\uB294 \uD504\uB85C\uC81D\uD2B8", w: 360, h: 175 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "18", fill: "#FFFFFF" }),
        React.createElement("rect", { x: "243", y: "24", width: "26", height: "11", rx: "3", fill: "#EFEAE0" }),
        React.createElement("text", { x: "248", y: "32", fontSize: "6.5", fill: "#585B66" }, "\uC800\uC7A5"),
        React.createElement("rect", { x: "273", y: "24", width: "26", height: "11", rx: "3", fill: "#EFEAE0" }),
        React.createElement("text", { x: "278", y: "32", fontSize: "6.5", fill: "#585B66" }, "\uC2E4\uD589"),
        React.createElement("rect", { x: "303", y: "24", width: "34", height: "11", rx: "3", fill: C.accent }),
        React.createElement("text", { x: "309", y: "32", fontSize: "6.5", fill: "#FFFFFF" }, "\uBC30\uD3EC \u25BE"),
        React.createElement("rect", { x: "0", y: "38", width: "86", height: "137", fill: "#FAF9F6" }),
        React.createElement("text", { x: "10", y: "52", fontSize: "7.5", fill: "#9A9CA6" }, "Code.gs"),
        React.createElement("rect", { x: "86", y: "38", width: "274", height: "137", fill: "#FFFFFF" }),
        [0, 1, 2, 3, 4, 5].map((i) => React.createElement("rect", { key: i, x: "104", y: 50 + i * 13, width: i % 3 === 0 ? 170 : 130, height: "4.5", rx: "2", fill: "#EFEAE4" })),
        React.createElement("rect", { x: "255", y: "40", width: "98", height: "52", rx: "5", fill: "#FFFFFF", stroke: "#E0D9C8" }),
        React.createElement("rect", { x: "257", y: "43", width: "94", height: "14", rx: "3", fill: C.accentSoft }),
        React.createElement("text", { x: "264", y: "52.5", fontSize: "7.5", fill: C.accentDeep, fontWeight: "700" }, "\uC0C8 \uBC30\uD3EC"),
        React.createElement("text", { x: "264", y: "69", fontSize: "7.5", fill: "#585B66" }, "\uBC30\uD3EC \uAD00\uB9AC"),
        React.createElement("text", { x: "264", y: "85", fontSize: "7.5", fill: "#585B66" }, "\uD14C\uC2A4\uD2B8 \uBC30\uD3EC"),
        React.createElement(Pin, { x: 344, y: 22, n: 1 }),
        React.createElement(Pin, { x: 247, y: 50, n: 2 }),
        React.createElement("text", { x: "8", y: "170", fontSize: "7", fill: "#9A9CA6" }, "\uC624\uB978\uCABD \uC704 \uD30C\uB780 [\uBC30\uD3EC] \u2192 [\uC0C8 \uBC30\uD3EC] \uC21C\uC11C\uB85C \uB204\uB985\uB2C8\uB2E4")));
}
/* 3-③ 구글 권한 승인 경고 화면 */
function MockConsent() {
    return (React.createElement(MockFrame, { title: "Sign in \u2014 Google Accounts", w: 360, h: 190 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "170", fill: "#FFFFFF" }),
        React.createElement("rect", { x: "10", y: "28", width: "150", height: "56", rx: "6", fill: "#FAF9F6", stroke: "#E6E0D2" }),
        React.createElement("text", { x: "20", y: "43", fontSize: "7.5", fill: "#585B66" }, "\uC6F9 \uC571\uC5D0\uC11C \uB0B4 \uB370\uC774\uD130\uC5D0 \uB300\uD55C"),
        React.createElement("text", { x: "20", y: "53", fontSize: "7.5", fill: "#585B66" }, "\uC561\uC138\uC2A4 \uAD8C\uD55C\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4."),
        React.createElement("rect", { x: "20", y: "60", width: "62", height: "15", rx: "4", fill: "#1A73E8" }),
        React.createElement("text", { x: "51", y: "70.5", fontSize: "7.5", fill: "#FFFFFF", textAnchor: "middle" }, "\uC561\uC138\uC2A4 \uC2B9\uC778"),
        React.createElement(Pin, { x: 92, y: 67, n: 1 }),
        React.createElement("rect", { x: "172", y: "28", width: "178", height: "152", rx: "6", fill: "#FFFFFF", stroke: "#E6E0D2" }),
        React.createElement("path", { d: "M197 42 l9 16 h-18 z", fill: "#D93025" }),
        React.createElement("text", { x: "188", y: "76", fontSize: "9", fontWeight: "700", fill: "#202124" }, "\uD655\uC778\uB418\uC9C0 \uC54A\uC740 \uC571"),
        React.createElement("text", { x: "188", y: "90", fontSize: "6.5", fill: "#5F6368" }, "\uC774 \uC571\uC740 Google\uC758 \uD655\uC778\uC744 \uBC1B\uC9C0"),
        React.createElement("text", { x: "188", y: "99", fontSize: "6.5", fill: "#5F6368" }, "\uC54A\uC558\uC2B5\uB2C8\uB2E4."),
        React.createElement("text", { x: "198", y: "120", fontSize: "7.5", fill: "#1A73E8", fontWeight: "700" }, "\uACE0\uAE09 (Advanced)"),
        React.createElement("rect", { x: "272", y: "110", width: "66", height: "15", rx: "4", fill: "#1A73E8" }),
        React.createElement("text", { x: "305", y: "120.5", fontSize: "6.5", fill: "#FFFFFF", textAnchor: "middle" }, "\uC548\uC804\uD55C \uD398\uC774\uC9C0\uB85C"),
        React.createElement(Pin, { x: 182, y: 116, n: 2 }),
        React.createElement("line", { x1: "188", y1: "132", x2: "338", y2: "132", stroke: "#EDE9E0" }),
        React.createElement("text", { x: "198", y: "146", fontSize: "7", fill: "#1A73E8" }, "\u25CB\u25CB(\uC73C)\uB85C \uC774\uB3D9(\uC548\uC804\uD558\uC9C0 \uC54A\uC74C)"),
        React.createElement(Pin, { x: 182, y: 143, n: 3 }),
        React.createElement("text", { x: "198", y: "164", fontSize: "7", fill: "#5F6368" }, "\u2192 \uB2E4\uC74C \uD654\uBA74\uC5D0\uC11C [\uD5C8\uC6A9]"),
        React.createElement(Pin, { x: 182, y: 161, n: 4 })));
}
/* Gemini ① AI Studio 로그인 */
function MockAiHome() {
    return (React.createElement(MockFrame, { title: "Google AI Studio", w: 360, h: 140 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "120", fill: "#FFFFFF" }),
        React.createElement("text", { x: "16", y: "46", fontSize: "11", fontWeight: "700", fill: "#181A20" }, "Google AI Studio"),
        React.createElement("text", { x: "16", y: "62", fontSize: "7.5", fill: "#5F6368" }, "\uAD6C\uAE00 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uBA74 \uBC14\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."),
        React.createElement("rect", { x: "16", y: "74", width: "82", height: "17", rx: "8", fill: "#1A73E8" }),
        React.createElement("text", { x: "57", y: "86", fontSize: "7.5", fill: "#FFFFFF", textAnchor: "middle" }, "\uB85C\uADF8\uC778"),
        React.createElement(Pin, { x: 57, y: 83, n: 1 }),
        React.createElement("rect", { x: "16", y: "104", width: "328", height: "1", fill: "#EDE9E0" }),
        React.createElement("text", { x: "16", y: "122", fontSize: "7", fill: "#9A9CA6" }, "\uC544\uB798 [Google AI Studio \uC5F4\uAE30] \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uC774 \uD654\uBA74\uC774 \uB098\uC635\uB2C8\uB2E4")));
}
/* Gemini ② 키 만들기 */
function MockAiCreate() {
    return (React.createElement(MockFrame, { title: "Google AI Studio \u2014 API keys", w: 360, h: 140 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "120", fill: "#FFFFFF" }),
        React.createElement("text", { x: "16", y: "46", fontSize: "10", fontWeight: "700", fill: "#181A20" }, "API keys"),
        React.createElement("rect", { x: "238", y: "34", width: "106", height: "18", rx: "9", fill: "#1A73E8" }),
        React.createElement("text", { x: "291", y: "46", fontSize: "7.5", fill: "#FFFFFF", textAnchor: "middle" }, "API \uD0A4 \uB9CC\uB4E4\uAE30"),
        React.createElement(Pin, { x: 344, y: 34, n: 1 }),
        React.createElement("rect", { x: "16", y: "62", width: "328", height: "1", fill: "#EDE9E0" }),
        React.createElement("rect", { x: "60", y: "76", width: "240", height: "46", rx: "6", fill: "#FFFFFF", stroke: "#E0D9C8" }),
        React.createElement("text", { x: "180", y: "94", fontSize: "7.5", fill: "#202124", textAnchor: "middle", fontWeight: "700" }, "\uD504\uB85C\uC81D\uD2B8\uB97C \uC120\uD0DD\uD558\uC138\uC694"),
        React.createElement("rect", { x: "118", y: "100", width: "124", height: "14", rx: "4", fill: C.accentSoft }),
        React.createElement("text", { x: "180", y: "110", fontSize: "7", fill: C.accentDeep, textAnchor: "middle" }, "\uC0C8 \uD504\uB85C\uC81D\uD2B8\uC5D0\uC11C \uB9CC\uB4E4\uAE30"),
        React.createElement(Pin, { x: 252, y: 107, n: 2 })));
}
/* Gemini ③ 키 복사 */
function MockAiCopy() {
    return (React.createElement(MockFrame, { title: "Google AI Studio \u2014 API keys", w: 360, h: 140 },
        React.createElement("rect", { x: "0", y: "20", width: "360", height: "120", fill: "#FFFFFF" }),
        React.createElement("text", { x: "16", y: "44", fontSize: "9", fontWeight: "700", fill: "#181A20" }, "\uB9CC\uB4E4\uC5B4\uC9C4 \uD0A4"),
        React.createElement("rect", { x: "16", y: "56", width: "230", height: "20", rx: "5", fill: "#FAF9F6", stroke: "#E6E0D2" }),
        React.createElement("text", { x: "26", y: "69.5", fontSize: "8", fill: "#9A9CA6", fontFamily: "monospace" }, "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"),
        React.createElement("rect", { x: "256", y: "56", width: "88", height: "20", rx: "5", fill: C.accent }),
        React.createElement("text", { x: "300", y: "69.5", fontSize: "8", fill: "#FFFFFF", textAnchor: "middle" }, "API \uD0A4 \uBCF5\uC0AC"),
        React.createElement(Pin, { x: 344, y: 56, n: 1 }),
        React.createElement("path", { d: "M300 84 v14", stroke: C.accent, strokeWidth: "1.5", strokeDasharray: "3 2" }),
        React.createElement("path", { d: "M296 96 l4 6 l4 -6 z", fill: C.accent }),
        React.createElement("rect", { x: "16", y: "104", width: "328", height: "24", rx: "5", fill: C.accentSoft }),
        React.createElement("text", { x: "180", y: "119", fontSize: "7.5", fill: C.accentDeep, textAnchor: "middle", fontWeight: "700" }, "\uC544\uB798 \uC785\uB825\uCE78\uC5D0 \uBD99\uC5EC\uB123\uAE30 (Ctrl+V) \u2192 \uC800\uC7A5"),
        React.createElement(Pin, { x: 30, y: 116, n: 2 })));
}
// ---------- Gemini API 키 안내 ----------
function GeminiGuideModal({ onClose, currentKey, onSave }) {
    const [draft, setDraft] = useState(currentKey || "");
    const [copiedMsg, setCopiedMsg] = useState(null);
    return (React.createElement("div", { className: "fixed inset-0 flex items-center justify-center p-6 z-30", style: { background: "rgba(24,26,32,0.45)" } },
        React.createElement(Card, { style: { maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }, className: "w-full relative fade-in-up" },
            React.createElement("div", { className: "flex justify-end" },
                React.createElement(IconBtn, { onClick: onClose, title: "\uB2EB\uAE30" },
                    React.createElement(IconX, { size: 16 }))),
            React.createElement("div", { className: "text-xs tracking-widest mb-1", style: { color: C.accent } }, "AI \uC601\uC218\uC99D \uC778\uC2DD"),
            React.createElement("h3", { className: "text-lg font-semibold mb-1", style: { fontFamily: SERIF } }, "Gemini API \uD0A4 \uBC1B\uB294 \uBC95"),
            React.createElement("p", { className: "text-xs mb-4 leading-relaxed", style: { color: C.muted } },
                "\uC601\uC218\uC99D \uC0AC\uC9C4\uC774\uB098 \uC740\uD589 \uC571 \uAC70\uB798\uB0B4\uC5ED \uD654\uBA74\uC744 \uC62C\uB9AC\uBA74 \uB0A0\uC9DC\u00B7\uAE08\uC561\u00B7\uAC00\uAC8C\uBA85\uC744 \uC790\uB3D9\uC73C\uB85C \uC77D\uC5B4 \uC635\uB2C8\uB2E4. \uC774 \uAE30\uB2A5\uB9CC \uAD6C\uAE00 AI \uD0A4\uAC00 \uD544\uC694\uD558\uACE0, ",
                React.createElement("b", null, "\uAC1C\uC778 \uAC00\uACC4\uBD80 \uC218\uC900\uC5D0\uC11C\uB294 \uBB34\uB8CC \uC0AC\uC6A9\uB7C9 \uC548\uC5D0\uC11C \uC4F0\uC785\uB2C8\uB2E4."),
                " \uD0A4 \uC5C6\uC774\uB3C4 \uC9C1\uC811 \uC785\uB825\uC73C\uB85C \uAC00\uACC4\uBD80\uB97C \uC4F8 \uC218 \uC788\uC5B4\uC694."),
            React.createElement("div", { className: "mb-4" },
                React.createElement(Carousel, { slides: [
                        { label: "AI Studio 열기", el: React.createElement(MockAiHome, null), cap: "아래 [Google AI Studio 열기] 버튼을 누르고 구글 계정으로 로그인합니다." },
                        { label: "키 만들기", el: React.createElement(MockAiCreate, null), cap: "오른쪽 위 [API 키 만들기] 를 누르고, 프로젝트를 물어보면 [새 프로젝트에서 만들기] 를 고릅니다." },
                        { label: "키 복사", el: React.createElement(MockAiCopy, null), cap: "[API 키 복사] 를 누른 뒤, 아래 입력칸에 붙여넣고 [저장] 을 누르면 끝입니다." },
                    ] })),
            React.createElement("button", { onClick: () => openExternal("https://aistudio.google.com/apikey"), className: "w-full py-2.5 rounded-lg text-sm font-medium mb-3", style: { background: C.accentSoft, color: C.accentDeep } }, "Google AI Studio \uC5F4\uAE30 \u2192"),
            React.createElement(Field, { label: "API \uD0A4 \uBD99\uC5EC\uB123\uAE30" },
                React.createElement("div", { className: "flex gap-2" },
                    React.createElement(TextInput, { type: "password", value: draft, onChange: (e) => setDraft(e.target.value), placeholder: "AIzaSy..." }),
                    React.createElement(PrimaryBtn, { onClick: () => { const k = draft.trim(); onSave(k); setCopiedMsg(k ? "저장했어요. 이제 생활비관리 탭에서 사진을 올려보세요." : "키를 지웠어요."); } }, "\uC800\uC7A5"))),
            copiedMsg && React.createElement("div", { className: "text-xs mt-2", style: { color: C.positive } }, copiedMsg),
            React.createElement("p", { className: "text-xs mt-3 p-2.5 rounded-lg leading-relaxed", style: { background: "#FAF9F6", border: `1px solid ${C.border}`, color: C.muted } }, "\uD0A4\uB294 \uC774 PC \uC5D0\uB9CC \uC800\uC7A5\uB418\uACE0 \uAD6C\uAE00 \uC2DC\uD2B8\uC5D0\uB294 \uC62C\uB77C\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uBC30\uC6B0\uC790 PC \uC5D0\uC11C\uB3C4 \uC4F0\uB824\uBA74 \uADF8\uCABD\uC5D0\uC11C \uAC19\uC740 \uBC29\uBC95\uC73C\uB85C \uD55C \uBC88 \uB354 \uB123\uC5B4\uC8FC\uC138\uC694."))));
}
// ---------- 탭별 사용 안내 ----------
const TAB_GUIDE = [
    { id: "dashboard", icon: IconDashboard, name: "대시보드", one: "이번 달 상황을 한눈에",
        body: ["이번 달 수입·지출·순현금흐름과 예산 사용률, 다가오는 일정·할일이 모여 보이는 요약 화면입니다.",
            "여기서 직접 입력하지는 않습니다. 다른 탭에 넣은 내용이 자동으로 반영됩니다."] },
    { id: "expenses", icon: IconReceipt, name: "생활비관리", one: "실제 쓴 돈을 기록하는 핵심 탭",
        body: ["가장 많이 쓰게 될 탭입니다. 지출·수입을 날짜/금액/분류와 함께 기록합니다.",
            "영수증 사진이나 은행·카드 앱의 거래내역 화면을 올리면 AI 가 항목을 자동으로 읽어 옵니다 (Gemini 키 필요).",
            "월 예산을 정해두면 대시보드에서 사용률을 보여줍니다."] },
    { id: "accounts", icon: IconWallet, name: "계좌관리", one: "통장·카드 등록과 계좌 간 이체",
        body: ["입출금 통장, 현금, 카드를 등록합니다. 소유자를 적어두면 사람별로 묶여 보입니다.",
            "급여통장은 ⭐ 메인으로 지정해 두세요.",
            "계좌끼리 옮긴 돈(이체)은 지출이 아니므로 아래 이체 내역에 따로 남깁니다."] },
    { id: "savings", icon: IconPiggy, name: "예적금/투자", one: "모으는 돈 관리",
        body: ["예금·적금은 만기일과 월 납입액을 넣으면 만기까지 진행률이 표시됩니다.",
            "투자 계좌는 현재 평가액을 적어두면 총자산에 합산됩니다."] },
    { id: "insurance", icon: IconShield, name: "고정지출관리", one: "매달 자동으로 빠져나가는 돈",
        body: ["보험·연금처럼 매달 나가는 항목과 통신비·구독료 같은 고정지출을 등록합니다.",
            "한 번 등록하면 매달 다시 입력할 필요가 없고, 고정지출 총액을 바로 확인할 수 있습니다."] },
    { id: "calendar", icon: IconCalendar, name: "일정관리", one: "돈과 관련된 날짜",
        body: ["급여일, 카드 결제일, 경조사, 만기일 같은 일정을 달력으로 봅니다.",
            "가까운 일정은 대시보드에도 함께 표시됩니다."] },
    { id: "todo", icon: IconCheckSquare, name: "할일", one: "미뤄둔 금융 숙제",
        body: ["해지할 구독, 알아볼 상품, 서류 준비 등 돈과 관련된 할 일을 체크리스트로 관리합니다.",
            "부부가 같이 보므로 서로 할 일을 남겨둘 수 있습니다."] },
];
function HelpModal({ onClose, onGoTab }) {
    const [sel, setSel] = useState("dashboard");
    const cur = TAB_GUIDE.find((t) => t.id === sel) || TAB_GUIDE[0];
    const CurIcon = cur.icon;
    return (React.createElement("div", { className: "fixed inset-0 flex items-center justify-center p-6 z-30", style: { background: "rgba(24,26,32,0.45)" } },
        React.createElement(Card, { style: { maxWidth: 720, maxHeight: "88vh", overflowY: "auto" }, className: "w-full relative fade-in-up" },
            React.createElement("div", { className: "flex justify-end" },
                React.createElement(IconBtn, { onClick: onClose, title: "\uB2EB\uAE30" },
                    React.createElement(IconX, { size: 16 }))),
            React.createElement("div", { className: "text-xs tracking-widest mb-1", style: { color: C.accent } }, "\uC0AC\uC6A9 \uC548\uB0B4"),
            React.createElement("h3", { className: "text-lg font-semibold mb-4", style: { fontFamily: SERIF } }, "\uC5B4\uB290 \uD0ED\uC5D0 \uBB34\uC5C7\uC744 \uC801\uB098\uC694?"),
            React.createElement("div", { className: "flex flex-col sm:flex-row gap-4" },
                React.createElement("div", { className: "flex sm:flex-col gap-1 flex-wrap sm:w-44 shrink-0" }, TAB_GUIDE.map((t) => {
                    const I = t.icon;
                    const on = t.id === sel;
                    return (React.createElement("button", { key: t.id, onClick: () => setSel(t.id), className: "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left", style: { background: on ? C.ink : "transparent", color: on ? "#fff" : C.inkSoft, border: `1px solid ${on ? C.ink : C.border}` } },
                        React.createElement(I, { size: 15 }),
                        t.name));
                })),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("div", { className: "flex items-center gap-2 mb-1" },
                        React.createElement(CurIcon, { size: 18, style: { color: C.accent } }),
                        React.createElement("span", { className: "text-base font-semibold" }, cur.name)),
                    React.createElement("div", { className: "text-xs mb-3", style: { color: C.accent } }, cur.one),
                    cur.body.map((p, i) => React.createElement("p", { key: i, className: "text-sm leading-relaxed mb-2", style: { color: C.inkSoft } }, p)),
                    React.createElement("button", { onClick: () => { onGoTab(cur.id); onClose(); }, className: "mt-2 px-3 py-2 rounded-lg text-sm font-medium", style: { background: C.accentSoft, color: C.accentDeep } },
                        cur.name,
                        " \uD0ED\uC73C\uB85C \uC774\uB3D9 \u2192"))),
            React.createElement("div", { className: "mt-5 pt-4 text-sm leading-relaxed", style: { borderTop: `1px dashed ${C.border}`, color: C.inkSoft } },
                React.createElement("div", { className: "font-medium mb-1.5", style: { color: C.ink } }, "\uC54C\uC544\uB450\uBA74 \uC88B\uC740 \uAC83"),
                React.createElement("p", { className: "mb-1" }, "\u00B7 \uC785\uB825\uD55C \uB0B4\uC6A9\uC740 \uC790\uB3D9 \uC800\uC7A5\uB418\uBA70, 20\uCD08\uB9C8\uB2E4 \uBC30\uC6B0\uC790 \uD654\uBA74\uACFC \uB9DE\uCDB0\uC9D1\uB2C8\uB2E4. \uC624\uB978\uCABD \uC704\uC5D0\uC11C \uB9C8\uC9C0\uB9C9 \uB3D9\uAE30\uD654 \uC2DC\uAC01\uC744 \uBCFC \uC218 \uC788\uC5B4\uC694."),
                React.createElement("p", { className: "mb-1" },
                    "\u00B7 \uC778\uD130\uB137\uC774 \uB04A\uAE30\uBA74 \uB9C8\uC9C0\uB9C9 \uB0B4\uC6A9\uC744 ",
                    React.createElement("b", null, "\uBCF4\uB294 \uAC83"),
                    "\uC740 \uAC00\uB2A5\uD558\uC9C0\uB9CC \uC218\uC815\uC740 \uBC18\uC601\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."),
                React.createElement("p", null,
                    "\u00B7 \uC124\uC815(\u2699)\uC5D0\uC11C ",
                    React.createElement("b", null, "\uBC31\uC5C5 \uD30C\uC77C\uB85C \uB0B4\uBCF4\uB0B4\uAE30"),
                    "\uB97C \uAC00\uB054 \uD574\uB450\uBA74 \uC548\uC804\uD569\uB2C8\uB2E4.")))));
}
// ---------- 설정(연결) 화면 ----------
const APPS_SCRIPT_TEMPLATE = String.raw `/**
 * 우리집 가계부 — 개인 저장소 (Google Apps Script)
 *
 * 이 코드는 내 구글 계정 안에서만 동작하며, 데이터는 이 스크립트가 붙어 있는
 * 스프레드시트에만 저장됩니다. 제작자를 포함한 외부에 전송되는 정보는 없습니다.
 *
 * 아래 APP_TOKEN 은 내 가계부 전용 비밀 열쇠입니다. 외부에 공유하지 마세요.
 */

var KV_SHEET = 'KV';
var CODE_VERSION = 'desktop-1.0';
var APP_TOKEN = '__APP_TOKEN__';

var MAX_CELL = 45000;      // 시트 셀 1칸 한도(5만자)보다 여유 있게
var CHUNK_MARK = '__CHUNKED__:';

function getKvSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(KV_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(KV_SHEET);
    sheet.appendRow(['key', 'value', 'updatedAt']);
  }
  return sheet;
}

function keyIndex_(sheet) {
  var col = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 1).getValues();
  var map = {};
  for (var i = 1; i < col.length; i++) {
    var k = col[i][0];
    if (k !== '' && map[k] === undefined) map[k] = i + 1;
  }
  return map;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function authOk_(token) {
  if (!APP_TOKEN || APP_TOKEN.indexOf('__APP') === 0) return true;   // 열쇠 미설정 시 통과
  return String(token || '') === APP_TOKEN;
}

/* ---------------- 읽기 ---------------- */

function readValue_(sheet, idx, key) {
  var row = idx[key];
  if (!row) return null;
  var v = sheet.getRange(row, 2).getValue();
  if (typeof v === 'string' && v.indexOf(CHUNK_MARK) === 0) {
    var n = parseInt(v.substring(CHUNK_MARK.length), 10);
    var out = '';
    for (var i = 0; i < n; i++) {
      var r = idx[key + '#' + i];
      if (!r) return null;
      out += sheet.getRange(r, 2).getValue();
    }
    return out;
  }
  return v;
}

/* ---------------- 쓰기 ---------------- */

function setRow_(sheet, idx, key, value, now) {
  var row = idx[key];
  if (!row) {
    sheet.appendRow([key, value, now]);
    idx[key] = sheet.getLastRow();
  } else {
    sheet.getRange(row, 2, 1, 2).setValues([[value, now]]);
  }
}

function clearChunks_(sheet, idx, key) {
  var rows = [];
  for (var k in idx) {
    if (k.indexOf(key + '#') === 0) rows.push(idx[k]);
  }
  rows.sort(function (a, b) { return b - a; });          // 아래쪽부터 지워야 행번호가 안 밀림
  for (var i = 0; i < rows.length; i++) sheet.deleteRow(rows[i]);
}

function writeValue_(sheet, key, value) {
  var idx = keyIndex_(sheet);
  var now = new Date().toISOString();
  if (String(value).length > MAX_CELL) {
    clearChunks_(sheet, idx, key);
    idx = keyIndex_(sheet);
    var n = Math.ceil(value.length / MAX_CELL);
    setRow_(sheet, idx, key, CHUNK_MARK + n, now);
    for (var i = 0; i < n; i++) setRow_(sheet, idx, key + '#' + i, value.substr(i * MAX_CELL, MAX_CELL), now);
  } else {
    var had = idx[key] ? sheet.getRange(idx[key], 2).getValue() : '';
    if (typeof had === 'string' && had.indexOf(CHUNK_MARK) === 0) {
      clearChunks_(sheet, idx, key);
      idx = keyIndex_(sheet);
    }
    setRow_(sheet, idx, key, value, now);
  }
}

/* ---------------- 엔드포인트 ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!authOk_(p.t)) return jsonOut_({ error: '[AUTH] 접근 권한이 없습니다. 앱의 연결코드를 확인해주세요.' });
  if (p.action === 'ping') return jsonOut_({ ok: true, version: CODE_VERSION, time: new Date().toISOString() });

  var sheet = getKvSheet_();
  var idx = keyIndex_(sheet);
  if (p.action === 'list') {
    var keys = [];
    for (var k in idx) if (k.indexOf('#') === -1) keys.push(k);
    return jsonOut_({ keys: keys });
  }
  if (p.key) return jsonOut_({ key: p.key, value: readValue_(sheet, idx, p.key) });
  return jsonOut_({ error: 'no key or action' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ error: '[BODY_PARSE_FAIL] ' + String(err) });
  }
  var qs = (e && e.parameter) || {};
  if (!authOk_(body.token || qs.t)) return jsonOut_({ error: '[AUTH] 접근 권한이 없습니다.' });
  if (body.action !== 'set' && body.action !== 'delete') {
    return jsonOut_({ error: '[UNKNOWN_ACTION] ' + JSON.stringify(body.action) });
  }

  var sheet = getKvSheet_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lockErr) {
    return jsonOut_({ error: '[LOCK_TIMEOUT] 다른 기기가 저장 중입니다. 잠시 후 다시 시도해주세요.' });
  }
  try {
    if (body.action === 'delete') {
      var idx = keyIndex_(sheet);
      clearChunks_(sheet, idx, body.key);
      idx = keyIndex_(sheet);
      if (idx[body.key]) sheet.deleteRow(idx[body.key]);
      return jsonOut_({ ok: true });
    }
    writeValue_(sheet, body.key, String(body.value));
    return jsonOut_({ ok: true });
  } catch (writeErr) {
    return jsonOut_({ error: '[WRITE_ERROR] ' + String(writeErr.message || writeErr) });
  } finally {
    lock.releaseLock();
  }
}
`;
function genToken() {
    const bytes = new Uint8Array(18);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < bytes.length; i++)
        out += ("0" + bytes[i].toString(16)).slice(-2);
    return out;
}
function makePairCode(url, token) {
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify({ u: url, t: token }))));
    }
    catch (e) {
        return "";
    }
}
function parsePairCode(code) {
    try {
        const o = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
        if (o && o.u)
            return { url: String(o.u), token: String(o.t || "") };
    }
    catch (e) { }
    return null;
}
function WizardShell({ step, total, title, desc, children, onBack, footer }) {
    return (React.createElement("div", { className: "min-h-screen flex items-center justify-center p-6", style: { background: C.bg, fontFamily: SANS } },
        React.createElement(Card, { style: { maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }, className: "w-full fade-in-up" },
            React.createElement("div", { className: "flex items-center justify-between mb-3" },
                React.createElement("div", { className: "text-xs tracking-widest", style: { color: C.accent } }, "\uCC98\uC74C \uC124\uC815"),
                React.createElement("div", { className: "flex items-center gap-1.5" }, Array.from({ length: total }).map((_, i) => (React.createElement("div", { key: i, className: "rounded-full", style: { width: i === step ? 18 : 6, height: 6, background: i <= step ? C.accent : C.border, transition: "width .2s ease" } }))))),
            React.createElement("h2", { className: "text-xl font-semibold mb-1", style: { fontFamily: SERIF, color: C.ink } }, title),
            desc && React.createElement("p", { className: "text-xs mb-4 leading-relaxed", style: { color: C.muted } }, desc),
            children,
            React.createElement("div", { className: "flex gap-2 justify-between items-center pt-4 mt-1" },
                React.createElement("div", null, onBack && React.createElement("button", { onClick: onBack, className: "px-3 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\u2190 \uC774\uC804")),
                React.createElement("div", { className: "flex gap-2" }, footer)))));
}
function ServerSetupScreen({ onSave }) {
    const [mode, setMode] = useState(null); // "new" = 처음 설치 / "join" = 배우자 연결
    const [step, setStep] = useState(0);
    const [token] = useState(() => genToken());
    const [url, setUrl] = useState("");
    const [pair, setPair] = useState("");
    const [copied, setCopied] = useState("");
    const [testing, setTesting] = useState(false);
    const [testMsg, setTestMsg] = useState(null);
    const code = useMemo(() => APPS_SCRIPT_TEMPLATE.replace("__APP_TOKEN__", token), [token]);
    const cleanUrl = url.trim();
    const urlOk = cleanUrl.indexOf("https://script.google.com") === 0 && cleanUrl.indexOf("/exec") !== -1;
    const copy = async (text, tag) => { const ok = await copyText(text); setCopied(ok ? tag : ""); setTimeout(() => setCopied(""), 2000); };
    const doTest = async (u, t) => {
        setTesting(true);
        setTestMsg(null);
        try {
            await pingServer(u, t);
            setTestMsg({ ok: true, text: "연결 성공! 시작할 수 있어요." });
            return true;
        }
        catch (e) {
            setTestMsg({ ok: false, text: "연결 실패: " + (e.message || "네트워크 오류") });
            return false;
        }
        finally {
            setTesting(false);
        }
    };
    // --- 시작 화면 : 처음 설치 vs 배우자 연결 ---
    if (!mode) {
        return (React.createElement("div", { className: "min-h-screen flex items-center justify-center p-6", style: { background: C.bg, fontFamily: SANS } },
            React.createElement(Card, { style: { maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }, className: "w-full fade-in-up" },
                React.createElement("div", { className: "text-xs tracking-widest mb-1", style: { color: C.accent } }, "WELCOME"),
                React.createElement("h2", { className: "text-2xl font-semibold mb-2", style: { fontFamily: SERIF, color: C.ink } }, "\uC6B0\uB9AC\uC9D1 \uAC00\uACC4\uBD80"),
                React.createElement("p", { className: "text-xs mb-4 leading-relaxed", style: { color: C.muted } },
                    "\uAC00\uACC4\uBD80 \uB370\uC774\uD130\uB294 ",
                    React.createElement("b", null, "\uB0B4 \uAD6C\uAE00 \uACC4\uC815\uC758 \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8"),
                    "\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4. \uC81C\uC791\uC790\uB97C \uD3EC\uD568\uD55C \uB2E4\uB978 \uB204\uAD6C\uB3C4 \uB370\uC774\uD130\uB97C \uBCFC \uC218 \uC5C6\uACE0, \uC11C\uBC84 \uC774\uC6A9\uB8CC\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4. \uBD80\uBD80\uAC00 \uAC19\uC740 \uC2DC\uD2B8\uB97C \uD568\uAED8 \uC4F0\uBA74 \uB450 \uC0AC\uB78C\uC758 \uD654\uBA74\uC774 \uC790\uB3D9\uC73C\uB85C \uB3D9\uAE30\uD654\uB429\uB2C8\uB2E4."),
                React.createElement("div", { className: "rounded-xl p-3.5 mb-4", style: { background: "#FAF9F6", border: `1px solid ${C.border}` } },
                    React.createElement("div", { className: "text-sm font-semibold mb-2", style: { color: C.ink } }, "\uC2DC\uC791\uD558\uAE30 \uC804 \uC900\uBE44\uBB3C"),
                    React.createElement("div", { className: "flex flex-col gap-1.5 text-sm", style: { color: C.inkSoft } },
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("span", { style: { color: C.accent } }, "\u2460"),
                            React.createElement("span", null,
                                React.createElement("b", null, "\uAD6C\uAE00 \uACC4\uC815"),
                                " (\uC9C0\uBA54\uC77C) \u2014 \uB370\uC774\uD130\uB97C \uC800\uC7A5\uD560 \uB0B4 \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8\uB97C \uB9CC\uB4DC\uB294 \uB370 \uD544\uC694\uD569\uB2C8\uB2E4")),
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("span", { style: { color: C.accent } }, "\u2461"),
                            React.createElement("span", null,
                                React.createElement("b", null, "\uC778\uD130\uB137 \uC5F0\uACB0"),
                                " \u2014 \uBD80\uBD80 \uD654\uBA74\uC744 \uB9DE\uCD94\uB294 \uB370 \uC0AC\uC6A9\uB429\uB2C8\uB2E4")),
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("span", { style: { color: C.accent } }, "\u2462"),
                            React.createElement("span", null,
                                React.createElement("b", null, "\uC57D 5\uBD84"),
                                " \u2014 \uC124\uCE58\uD560 \uB54C \uD55C \uBC88\uB9CC \uD558\uBA74 \uB429\uB2C8\uB2E4"))),
                    React.createElement("div", { className: "flex items-center gap-3 mt-2.5 flex-wrap" },
                        React.createElement("button", { onClick: () => openExternal("https://accounts.google.com/signup"), className: "text-xs", style: { color: C.accent, textDecoration: "underline" } }, "\uAD6C\uAE00 \uACC4\uC815\uC774 \uC5C6\uB2E4\uBA74 \uC5EC\uAE30\uC11C \uB9CC\uB4E4\uAE30 \u2192"))),
                React.createElement("div", { className: "flex flex-col gap-2" },
                    React.createElement("button", { onClick: () => { setMode("new"); setStep(0); }, className: "w-full text-left px-4 py-3 rounded-xl transition-colors", style: { border: `1px solid ${C.border}`, background: C.surface } },
                        React.createElement("div", { className: "text-sm font-semibold", style: { color: C.ink } }, "\uCC98\uC74C \uC124\uCE58\uD569\uB2C8\uB2E4"),
                        React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, "\uB0B4 \uAD6C\uAE00 \uACC4\uC815\uC5D0 \uC800\uC7A5\uC18C\uB97C \uB9CC\uB4ED\uB2C8\uB2E4 (\uC57D 5\uBD84, 1\uD68C\uB9CC)")),
                    React.createElement("button", { onClick: () => { setMode("join"); setStep(0); }, className: "w-full text-left px-4 py-3 rounded-xl transition-colors", style: { border: `1px solid ${C.border}`, background: C.surface } },
                        React.createElement("div", { className: "text-sm font-semibold", style: { color: C.ink } }, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uC5F0\uACB0\uCF54\uB4DC\uB97C \uBC1B\uC558\uC2B5\uB2C8\uB2E4"),
                        React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, "\uCF54\uB4DC \uD55C \uBC88 \uBD99\uC5EC\uB123\uC73C\uBA74 \uBC14\uB85C \uAC19\uC740 \uAC00\uACC4\uBD80\uC5D0 \uC5F0\uACB0\uB429\uB2C8\uB2E4"))))));
    }
    // --- 배우자 연결 ---
    if (mode === "join") {
        const p = parsePairCode(pair);
        return (React.createElement(WizardShell, { step: 0, total: 1, title: "\uC5F0\uACB0\uCF54\uB4DC \uBD99\uC5EC\uB123\uAE30", desc: "\uBC30\uC6B0\uC790\uC758 \uC571\uC5D0\uC11C [\uC124\uC815 \u2699 \u2192 \uBC30\uC6B0\uC790\uC5D0\uAC8C \uC5F0\uACB0\uCF54\uB4DC \uBCF4\uB0B4\uAE30]\uB85C \uBCF5\uC0AC\uD55C \uCF54\uB4DC\uB97C \uADF8\uB300\uB85C \uBD99\uC5EC\uB123\uC73C\uC138\uC694.", onBack: () => { setMode(null); setTestMsg(null); setPair(""); }, footer: React.createElement(PrimaryBtn, { disabled: !p || testing, onClick: async () => { if (p && (await doTest(p.url, p.token)))
                    onSave(p.url, p.token); } }, testing ? "확인 중..." : "연결하고 시작하기") },
            React.createElement(Field, { label: "\uC5F0\uACB0\uCF54\uB4DC" },
                React.createElement("textarea", { value: pair, onChange: (e) => setPair(e.target.value), rows: 4, placeholder: "eyJ1IjoiaHR0cHM6Ly9zY3JpcHQu...", style: { ...inputStyle, fontFamily: "monospace", fontSize: 12, resize: "vertical" }, className: "w-full focus-ring" })),
            pair && !p && React.createElement("div", { className: "text-xs mt-1.5", style: { color: C.negative } }, "\uCF54\uB4DC \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC544\uC694. \uC55E\uB4A4 \uACF5\uBC31 \uC5C6\uC774 \uC804\uCCB4\uB97C \uBD99\uC5EC\uB123\uC5C8\uB294\uC9C0 \uD655\uC778\uD574\uC8FC\uC138\uC694."),
            p && React.createElement("div", { className: "text-xs mt-1.5", style: { color: C.positive } },
                "\u2713 \uCF54\uB4DC \uC778\uC2DD\uB428 \u2014 ",
                p.url.slice(0, 48),
                "..."),
            testMsg && React.createElement("div", { className: "text-xs mt-2 p-2.5 rounded-lg", style: { background: testMsg.ok ? C.positiveSoft : C.negativeSoft, color: testMsg.ok ? C.positive : C.negative } }, testMsg.text)));
    }
    // --- 처음 설치 : 4단계 ---
    const steps = [
        {
            title: "1. 구글 스프레드시트 만들기",
            desc: "가계부 데이터가 저장될 빈 시트를 하나 만듭니다. 기존 시트를 쓰지 말고 새로 만드는 편이 안전합니다.",
            body: (React.createElement("div", { className: "flex flex-col gap-3" },
                React.createElement("button", { onClick: () => openExternal("https://sheets.new"), className: "w-full py-2.5 rounded-lg text-sm font-medium", style: { background: C.accent, color: "#fff" } }, "\uC0C8 \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8 \uC5F4\uAE30 \u2192"),
                React.createElement("ol", { className: "text-sm leading-relaxed pl-4 list-decimal", style: { color: C.inkSoft } },
                    React.createElement("li", null, "\uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uBE48 \uC2DC\uD2B8\uAC00 \uC5F4\uB9BD\uB2C8\uB2E4. (\uAD6C\uAE00 \uB85C\uADF8\uC778 \uD544\uC694)"),
                    React.createElement("li", null,
                        "\uC67C\uCABD \uC704 ",
                        React.createElement("b", null, "\uC81C\uBAA9 \uC5C6\uB294 \uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8"),
                        "\uB97C \uB20C\uB7EC ",
                        React.createElement("b", null, "\uAC00\uACC4\uBD80 \uB370\uC774\uD130"),
                        " \uB4F1\uC73C\uB85C \uC774\uB984\uC744 \uBC14\uAFC9\uB2C8\uB2E4."),
                    React.createElement("li", null,
                        "\uC0C1\uB2E8 \uBA54\uB274\uC5D0\uC11C ",
                        React.createElement("b", null, "\uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \u2192 Apps Script"),
                        " \uB97C \uB204\uB985\uB2C8\uB2E4. \uC0C8 \uD0ED\uC774 \uD558\uB098 \uB354 \uC5F4\uB9BD\uB2C8\uB2E4.")),
                React.createElement(MockSheets, null),
                React.createElement("div", { className: "text-xs p-2.5 rounded-lg", style: { background: "#FAF9F6", border: `1px solid ${C.border}`, color: C.muted } }, "\uC774 \uC2DC\uD2B8\uB294 \uC9C1\uC811 \uC5F4\uC5B4\uC11C \uACE0\uCE60 \uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC571\uC774 \uB370\uC774\uD130\uB97C \uB123\uC5B4\uB450\uB294 \uCC3D\uACE0 \uC5ED\uD560\uB9CC \uD569\uB2C8\uB2E4."))),
        },
        {
            title: "2. Code.gs 편집기에 코드 붙여넣기",
            desc: "방금 열린 Apps Script 화면에서 작업합니다. 붙여넣는 위치가 정해져 있으니 그림을 함께 봐주세요.",
            body: (React.createElement("div", { className: "flex flex-col gap-3" },
                React.createElement(MockEditor, null),
                React.createElement("ol", { className: "text-sm leading-relaxed pl-4 list-decimal", style: { color: C.inkSoft } },
                    React.createElement("li", null,
                        "\uC67C\uCABD ",
                        React.createElement("b", null, "\uD30C\uC77C"),
                        " \uBAA9\uB85D\uC5D0\uC11C ",
                        React.createElement("b", null, "Code.gs"),
                        " \uB97C \uD074\uB9AD\uD569\uB2C8\uB2E4. (\uC774\uBBF8 \uC120\uD0DD\uB418\uC5B4 \uC788\uC73C\uBA74 \uADF8\uB300\uB85C \uB450\uC138\uC694)"),
                    React.createElement("li", null,
                        "\uC624\uB978\uCABD ",
                        React.createElement("b", null, "\uCF54\uB4DC \uD3B8\uC9D1\uAE30 \uCE78"),
                        "\uC744 \uD074\uB9AD\uD55C \uB4A4 ",
                        React.createElement("b", null, "Ctrl+A \u2192 Delete"),
                        " \uB85C \uAE30\uC874 \uB0B4\uC6A9(",
                        React.createElement("code", null, "function myFunction() ..."),
                        ")\uC744 ",
                        React.createElement("b", null, "\uC804\uBD80 \uC9C0\uC6C1\uB2C8\uB2E4.")),
                    React.createElement("li", null,
                        "\uC544\uB798 \uBC84\uD2BC\uC73C\uB85C \uCF54\uB4DC\uB97C \uBCF5\uC0AC\uD574 \uADF8 \uBE48 \uD3B8\uC9D1\uAE30 \uCE78\uC5D0 ",
                        React.createElement("b", null, "Ctrl+V"),
                        " \uB85C \uBD99\uC5EC\uB123\uACE0, ",
                        React.createElement("b", null, "Ctrl+S"),
                        " \uB85C \uC800\uC7A5\uD569\uB2C8\uB2E4.")),
                React.createElement("button", { onClick: () => copy(code, "code"), className: "w-full py-2.5 rounded-lg text-sm font-medium", style: { background: copied === "code" ? C.positiveSoft : C.ink, color: copied === "code" ? C.positive : "#fff" } }, copied === "code" ? "✓ 복사했어요 — 편집기에 Ctrl+V 하세요" : "코드 전체 복사하기"),
                React.createElement("pre", { className: "text-xs p-3 rounded-lg", style: { background: "#FAF9F6", border: `1px solid ${C.border}`, color: C.inkSoft, maxHeight: 130, overflow: "auto", whiteSpace: "pre", fontFamily: "ui-monospace, monospace" } }, code.slice(0, 500) + "\n\n... (미리보기입니다. 전체는 위 복사 버튼을 눌러주세요)"),
                React.createElement("div", { className: "text-xs p-2.5 rounded-lg leading-relaxed", style: { background: C.accentSoft, color: C.accentDeep } },
                    "\uC774 \uCF54\uB4DC\uC5D0\uB294 ",
                    React.createElement("b", null, "\uB0B4 \uAC00\uACC4\uBD80 \uC804\uC6A9 \uBE44\uBC00 \uC5F4\uC1E0"),
                    "\uAC00 \uB4E4\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uBC30\uC6B0\uC790 \uC678\uC5D0\uB294 \uACF5\uC720\uD558\uC9C0 \uB9C8\uC138\uC694.",
                    React.createElement("br", null),
                    "\uC704 \uBBF8\uB9AC\uBCF4\uAE30 \uC0C1\uC790\uC5D0\uC11C \uAE01\uC5B4 \uBCF5\uC0AC\uD558\uBA74 \uC77C\uBD80\uB9CC \uBCF5\uC0AC\uB429\uB2C8\uB2E4. \uBC18\uB4DC\uC2DC ",
                    React.createElement("b", null, "\uBCF5\uC0AC \uBC84\uD2BC"),
                    "\uC744 \uC0AC\uC6A9\uD558\uC138\uC694."))),
        },
        {
            title: "3. 배포하고 주소 받기",
            desc: "저장한 코드를 앱이 부를 수 있도록 웹 주소로 만드는 단계입니다.",
            body: (React.createElement("div", { className: "flex flex-col gap-3" },
                React.createElement(Carousel, { slides: [
                        { label: "배포 버튼 찾기", el: React.createElement(MockDeployMenu, null), cap: "Apps Script 화면 오른쪽 위의 파란 [배포] 버튼을 누르고, 펼쳐진 목록에서 [새 배포] 를 고릅니다." },
                        { label: "배포 설정", el: React.createElement(MockDeploy, null), cap: "왼쪽 톱니바퀴(유형 선택)에서 [웹 앱] 을 고르고, 실행 대상은 [나], 액세스 권한은 [모든 사용자] 로 맞춘 뒤 [배포] 를 누릅니다." },
                        { label: "권한 승인", el: React.createElement(MockConsent, null), cap: "[액세스 승인] → 확인되지 않은 앱 경고에서 왼쪽 아래 [고급] → [○○(으)로 이동(안전하지 않음)] → 다음 화면에서 [허용] 을 누릅니다." },
                    ] }),
                React.createElement("div", { className: "text-xs p-2.5 rounded-lg leading-relaxed", style: { background: "#FAF9F6", border: `1px solid ${C.border}`, color: C.muted } },
                    "\"\uD655\uC778\uB418\uC9C0 \uC54A\uC740 \uC571\" \uACBD\uACE0\uB294 \uC815\uC0C1\uC785\uB2C8\uB2E4. \uB0B4 \uACC4\uC815 \uC548\uC5D0\uC11C\uB9CC \uB3C4\uB294 \uCF54\uB4DC\uB77C\uC11C \uAD6C\uAE00\uC774 \uC790\uB3D9\uC73C\uB85C \uBD99\uC774\uB294 \uC548\uB0B4\uC785\uB2C8\uB2E4.",
                    React.createElement("br", null),
                    React.createElement("b", null, "\uC561\uC138\uC2A4 \uAD8C\uD55C\uC744 \"\uBAA8\uB4E0 \uC0AC\uC6A9\uC790\""),
                    " \uB85C \uD558\uC9C0 \uC54A\uC73C\uBA74 \uC571\uC774 \uC811\uC18D\uD558\uC9C0 \uBABB\uD569\uB2C8\uB2E4. \uC8FC\uC18C\uB97C \uC544\uB294 \uC0AC\uB78C\uB9CC \uC811\uADFC\uD560 \uC218 \uC788\uACE0, 2\uB2E8\uACC4\uC758 \uBE44\uBC00 \uC5F4\uC1E0\uAC00 \uD55C \uBC88 \uB354 \uB9C9\uC544\uC90D\uB2C8\uB2E4."),
                React.createElement(Field, { label: "\uC6F9 \uC571 URL" },
                    React.createElement(TextInput, { value: url, onChange: (e) => { setUrl(e.target.value); setTestMsg(null); }, placeholder: "https://script.google.com/macros/s/xxxxx/exec" })),
                url && !urlOk && React.createElement("div", { className: "text-xs", style: { color: C.negative } }, "\uC8FC\uC18C\uB294 https://script.google.com \uC73C\uB85C \uC2DC\uC791\uD558\uACE0 /exec \uB85C \uB05D\uB098\uC57C \uD574\uC694."))),
        },
        {
            title: "4. 연결 확인",
            desc: "실제로 시트에 읽고 쓸 수 있는지 확인합니다.",
            body: (React.createElement("div", { className: "flex flex-col gap-3" },
                React.createElement("button", { onClick: () => doTest(cleanUrl, token), disabled: testing || !urlOk, className: "w-full py-2.5 rounded-lg text-sm font-medium", style: { background: C.accentSoft, color: C.accentDeep, opacity: testing || !urlOk ? 0.5 : 1 } }, testing ? "확인 중..." : "연결 테스트"),
                testMsg && (React.createElement("div", { className: "text-xs p-2.5 rounded-lg leading-relaxed", style: { background: testMsg.ok ? C.positiveSoft : C.negativeSoft, color: testMsg.ok ? C.positive : C.negative } },
                    testMsg.text,
                    !testMsg.ok && React.createElement("div", { className: "mt-1.5", style: { color: C.inkSoft } },
                        "\uD655\uC778\uD560 \uC810 \u00B7 \uBC30\uD3EC \uC2DC \uC561\uC138\uC2A4 \uAD8C\uD55C\uC774 ",
                        React.createElement("b", null, "\uBAA8\uB4E0 \uC0AC\uC6A9\uC790"),
                        "\uC778\uC9C0 \u00B7 \uC8FC\uC18C\uAC00 ",
                        React.createElement("b", null, "/exec"),
                        " \uB85C \uB05D\uB098\uB294\uC9C0 \u00B7 2\uB2E8\uACC4\uC5D0\uC11C \uCF54\uB4DC\uB97C \uC800\uC7A5(Ctrl+S)\uD588\uB294\uC9C0"))),
                React.createElement("div", { className: "text-xs p-2.5 rounded-lg leading-relaxed", style: { background: "#FAF9F6", border: `1px solid ${C.border}`, color: C.muted } },
                    "\uC5F0\uACB0 \uD6C4 \uC124\uC815(\u2699)\uC5D0\uC11C ",
                    React.createElement("b", null, "\uBC30\uC6B0\uC790\uC5D0\uAC8C \uC5F0\uACB0\uCF54\uB4DC \uBCF4\uB0B4\uAE30"),
                    "\uB85C \uCF54\uB4DC\uB97C \uBCF5\uC0AC\uD574 \uC804\uB2EC\uD558\uBA74, \uAC19\uC740 \uAC00\uACC4\uBD80\uB97C \uD568\uAED8 \uC4F8 \uC218 \uC788\uC5B4\uC694."))),
        },
    ];
    const cur = steps[step];
    const canNext = step === 2 ? urlOk : true;
    return (React.createElement(WizardShell, { step: step, total: 4, title: cur.title, desc: cur.desc, onBack: () => (step === 0 ? (setMode(null), setTestMsg(null)) : setStep(step - 1)), footer: step < 3
            ? React.createElement(PrimaryBtn, { disabled: !canNext, onClick: () => setStep(step + 1) }, "\uB2E4\uC74C")
            : React.createElement(PrimaryBtn, { disabled: !(testMsg && testMsg.ok), onClick: () => onSave(cleanUrl, token) }, "\uC2DC\uC791\uD558\uAE30") }, cur.body));
}
// ---------- 최상위 ----------
function App() {
    const [ready, setReady] = useState(false);
    const [apiUrl, setApiUrl] = useState(null);
    const [token, setToken] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    useEffect(() => {
        (async () => {
            // 휴대폰에서 QR/링크로 들어온 경우 연결코드가 주소 뒤에 붙어 있다.
            let fromLink = null;
            try {
                const h = (window.location.hash || "").replace(/^#/, "");
                const mm = h.match(/(?:^|&)c=([^&]+)/);
                if (mm) {
                    fromLink = parsePairCode(decodeURIComponent(mm[1]));
                    if (fromLink) {
                        await saveLocal("hh-server-url", fromLink.url);
                        await saveLocal("hh-server-token", fromLink.token);
                        history.replaceState(null, "", window.location.pathname + window.location.search);
                    }
                }
            }
            catch (e) { /* 주소가 이상해도 평소대로 진행 */ }
            setApiUrl(fromLink ? fromLink.url : await loadLocal("hh-server-url", null));
            setToken(fromLink ? fromLink.token : await loadLocal("hh-server-token", ""));
            setGeminiKey(await loadLocal("hh-gemini-key", ""));
            setReady(true);
        })();
    }, []);
    const handleSaveUrl = (u, t) => {
        setApiUrl(u);
        saveLocal("hh-server-url", u);
        setToken(t || "");
        saveLocal("hh-server-token", t || "");
    };
    const handleChangeServer = (opts) => {
        const keepKey = !!(opts && opts.keepGeminiKey);
        wipeLocal(keepKey);
        if (!keepKey)
            setGeminiKey("");
        setToken("");
        setApiUrl(null);
    };
    const handleSaveGeminiKey = (k) => { setGeminiKey(k); saveLocal("hh-gemini-key", k); };
    if (!ready)
        return React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: C.bg, color: C.muted, fontFamily: SANS } }, "\uBD88\uB7EC\uC624\uB294 \uC911...");
    if (!apiUrl)
        return React.createElement(ServerSetupScreen, { onSave: handleSaveUrl });
    return React.createElement(MainApp, { cfg: { apiUrl, token, geminiKey }, onChangeServer: handleChangeServer, onSaveGeminiKey: handleSaveGeminiKey });
}
// ---------- 메인 앱 ----------
function MainApp({ cfg, onChangeServer, onSaveGeminiKey }) {
    const [loaded, setLoaded] = useState(false);
    const [tab, setTab] = useState("dashboard");
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [lastSynced, setLastSynced] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showGemini, setShowGemini] = useState(false);
    const [titleDraft, setTitleDraft] = useState("");
    const [resetMode, setResetMode] = useState(null);
    const [resetBusy, setResetBusy] = useState(false);
    const [resetMsg, setResetMsg] = useState(null);
    const [geminiKeyDraft, setGeminiKeyDraft] = useState(cfg.geminiKey || "");
    const [ioMsg, setIoMsg] = useState(null);
    const [pairCopied, setPairCopied] = useState(false);
    const [mobileCopied, setMobileCopied] = useState(false);
    const pairCode = useMemo(() => makePairCode(cfg.apiUrl, cfg.token), [cfg.apiUrl, cfg.token]);
    const doExport = async () => {
        setIoMsg(null);
        try {
            const snap = {
                "hh-title": title,
                "hh-accounts": accounts, "hh-transactions": transactions, "hh-savings": savings,
                "hh-insurance": insurances, "hh-fixed-expenses": fixedExpenses, "hh-events": events,
                "hh-todos": todos, "hh-budget": budgets, "hh-transfers": transfers,
            };
            const r = await exportBackupFile(snap);
            if (!r || r.canceled)
                return;
            if (r.ok)
                setIoMsg({ ok: true, text: "백업 파일을 저장했어요" + (r.path ? " · " + r.path : "") });
            else
                setIoMsg({ ok: false, text: "저장 실패: " + (r.error || "알 수 없는 오류") });
        }
        catch (e) {
            setIoMsg({ ok: false, text: "저장 실패: " + (e.message || e) });
        }
    };
    const doImport = async () => {
        setIoMsg(null);
        try {
            const r = await importBackupFile();
            if (!r || r.canceled)
                return;
            if (!r.ok) {
                setIoMsg({ ok: false, text: "불러오기 실패: " + (r.error || "") });
                return;
            }
            const parsed = JSON.parse(r.content);
            const d = parsed && parsed.data ? parsed.data : parsed;
            if (!d || typeof d !== "object" || Array.isArray(d))
                throw new Error("가계부 백업 파일이 아니에요.");
            const pick = (k, fb) => (d[k] === undefined || d[k] === null ? fb : d[k]);
            setAccounts(pick("hh-accounts", []));
            setTransactions(pick("hh-transactions", []));
            setSavings(pick("hh-savings", []));
            setInsurances(pick("hh-insurance", []));
            setFixedExpenses(pick("hh-fixed-expenses", []));
            setEvents(pick("hh-events", []));
            setTodos(pick("hh-todos", []));
            setBudgets(pick("hh-budget", {}));
            setTransfers(pick("hh-transfers", []));
            if (typeof d["hh-title"] === "string" && d["hh-title"].trim())
                setTitle(d["hh-title"]);
            setIoMsg({ ok: true, text: "복원했어요. 구글 시트에도 반영 중입니다." });
        }
        catch (e) {
            setIoMsg({ ok: false, text: "복원 실패: " + (e.message || e) });
        }
    };
    const pendingSaves = useRef(0);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [savings, setSavings] = useState([]);
    const [insurances, setInsurances] = useState([]);
    const [fixedExpenses, setFixedExpenses] = useState([]);
    const [events, setEvents] = useState([]);
    const [todos, setTodos] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [transfers, setTransfers] = useState([]);
    const [title, setTitle] = useState("우리집 가계부");
    // 서버에 실제로 들어있는 값(문자열). 이 값과 같으면 다시 저장하지 않는다.
    // 예전에는 20초마다 데이터를 다시 불러올 때마다 9개 항목을 전부 재저장해서
    // 구글 시트 잠금이 겹치고 "저장 실패"가 뜨는 문제가 있었다.
    const serverSnap = useRef({});
    const saveQueue = useRef(Promise.resolve());
    const reloadAll = async (showSpinner) => {
        if (pendingSaves.current > 0)
            return;
        if (showSpinner)
            setSyncing(true);
        try {
            const [ttl, a, t, s, ins, fx, e, td, bg, tr] = await Promise.all([
                remoteLoad(cfg, "hh-title", "우리집 가계부"),
                remoteLoad(cfg, "hh-accounts", []),
                remoteLoad(cfg, "hh-transactions", []),
                remoteLoad(cfg, "hh-savings", []),
                remoteLoad(cfg, "hh-insurance", []),
                remoteLoad(cfg, "hh-fixed-expenses", []),
                remoteLoad(cfg, "hh-events", []),
                remoteLoad(cfg, "hh-todos", []),
                remoteLoad(cfg, "hh-budget", {}),
                remoteLoad(cfg, "hh-transfers", []),
            ]);
            const safeTitle = typeof ttl === "string" && ttl.trim() ? ttl : "우리집 가계부";
            const bgObj = bg && typeof bg === "object" ? bg : {};
            const next = {
                "hh-title": safeTitle, "hh-accounts": a || [], "hh-transactions": t || [], "hh-savings": s || [],
                "hh-insurance": ins || [], "hh-fixed-expenses": fx || [], "hh-events": e || [],
                "hh-todos": td || [], "hh-budget": bgObj, "hh-transfers": tr || [],
            };
            // 상태를 바꾸기 전에 스냅샷을 먼저 기록해야 저장 이펙트가 헛돌지 않는다.
            for (const k of DATA_KEYS)
                serverSnap.current[k] = JSON.stringify(next[k]);
            setTitle(safeTitle);
            setAccounts(next["hh-accounts"]);
            setTransactions(next["hh-transactions"]);
            setSavings(next["hh-savings"]);
            setInsurances(next["hh-insurance"]);
            setFixedExpenses(next["hh-fixed-expenses"]);
            setEvents(next["hh-events"]);
            setTodos(next["hh-todos"]);
            setBudgets(bgObj);
            setTransfers(next["hh-transfers"]);
            setLastSynced(new Date());
            setSyncError(null);
        }
        catch (e) {
            // 서버에 닿지 못하면 이 PC 에 보관된 마지막 데이터로 화면을 채운다 (조회 전용).
            if (!loaded) {
                const c = (k, fb) => cacheGet(k, fb);
                const ca = c("hh-accounts", []), ct = c("hh-transactions", []);
                const cachedTitle = c("hh-title", "우리집 가계부").value;
                setTitle(typeof cachedTitle === "string" && cachedTitle.trim() ? cachedTitle : "우리집 가계부");
                setAccounts(ca.value);
                setTransactions(ct.value);
                setSavings(c("hh-savings", []).value);
                setInsurances(c("hh-insurance", []).value);
                setFixedExpenses(c("hh-fixed-expenses", []).value);
                setEvents(c("hh-events", []).value);
                setTodos(c("hh-todos", []).value);
                const cb = c("hh-budget", {}).value;
                setBudgets(cb && typeof cb === "object" ? cb : {});
                setTransfers(c("hh-transfers", []).value);
                // 오프라인에서 화면을 캐시로 채운 것 자체가 "변경"으로 오해되어
                // 곧바로 저장을 시도하지 않도록, 스냅샷을 화면에 올린 값과 똑같이 맞춰 둔다.
                for (const k of DATA_KEYS)
                    serverSnap.current[k] = JSON.stringify(cacheGet(k, k === "hh-budget" ? {} : k === "hh-title" ? "우리집 가계부" : []).value);
            }
            // 화면을 이미 띄운 뒤에 연결이 끊겨도 같은 안내를 유지한다.
            const at = cacheGet("hh-transactions", []).at || cacheGet("hh-accounts", []).at;
            setSyncError(at
                ? "오프라인 — " + new Date(at).toLocaleString("ko-KR") + " 시점의 저장본을 보고 있어요 (수정은 반영되지 않습니다)"
                : "연결 실패 — 인터넷 또는 설정(⚙)의 저장소 주소를 확인해주세요 (" + ((e && e.message) || "네트워크 오류") + ")");
        }
        finally {
            if (showSpinner)
                setSyncing(false);
            setLoaded(true);
        }
    };
    useEffect(() => { reloadAll(true); }, []);
    useEffect(() => {
        // 처음 실행한 사람에게 탭 안내를 한 번만 보여준다.
        try {
            if (!localStorage.getItem("hh-guide-seen")) {
                setShowHelp(true);
                localStorage.setItem("hh-guide-seen", "1");
            }
        }
        catch (e) { }
    }, []);
    useEffect(() => {
        const id = setInterval(() => reloadAll(false), 20000);
        const onFocus = () => reloadAll(false);
        window.addEventListener("focus", onFocus);
        return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
    }, [cfg]);
    // 값이 실제로 달라졌을 때만, 그리고 한 번에 하나씩 순서대로 저장한다.
    const safeSave = (key, value) => {
        const json = JSON.stringify(value);
        if (serverSnap.current[key] === json)
            return;
        const prev = serverSnap.current[key];
        serverSnap.current[key] = json;
        pendingSaves.current += 1;
        saveQueue.current = saveQueue.current
            .then(() => remoteSave(cfg, key, value))
            .then(() => { setSyncError(null); setLastSynced(new Date()); })
            .catch((err) => {
            if (prev === undefined)
                delete serverSnap.current[key];
            else
                serverSnap.current[key] = prev; // 실패했으면 다음에 다시 시도되도록 되돌린다
            setSyncError("저장 실패 — " + ((err && err.message) || "네트워크를 확인해주세요"));
        })
            .finally(() => { pendingSaves.current = Math.max(0, pendingSaves.current - 1); });
    };
    useEffect(() => { if (!loaded)
        return; safeSave("hh-title", title); }, [title]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-accounts", accounts); }, [accounts]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-transactions", transactions); }, [transactions]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-savings", savings); }, [savings]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-insurance", insurances); }, [insurances]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-fixed-expenses", fixedExpenses); }, [fixedExpenses]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-events", events); }, [events]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-todos", todos); }, [todos]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-budget", budgets); }, [budgets]);
    useEffect(() => { if (!loaded)
        return; safeSave("hh-transfers", transfers); }, [transfers]);
    useEffect(() => { document.title = title || "우리집 가계부"; }, [title]);
    const addTransaction = (tx) => setTransactions((prev) => [{ ...tx, id: uid() }, ...prev]);
    const addTransactions = (txs) => setTransactions((prev) => [...txs.map((tx) => ({ ...tx, id: uid() })), ...prev]);
    const deleteTransaction = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id));
    const updateTransaction = (id, patch) => setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const setBudgetForPeriod = (period, budgetObj) => setBudgets((prev) => ({ ...prev, [periodKey(period)]: budgetObj }));
    const totalSavingsCurrent = useMemo(() => savings.reduce((s, x) => s + computeSavingsValue(x), 0), [savings]);
    const currentPeriodForAssets = useMemo(() => getCurrentPeriod(), []);
    const liquidFundsForSidebar = useMemo(() => computeLiquidFunds(transactions, budgets, currentPeriodForAssets), [transactions, budgets, currentPeriodForAssets]);
    const totalAssets = totalSavingsCurrent + liquidFundsForSidebar;
    if (!loaded)
        return React.createElement("div", { className: "min-h-screen flex items-center justify-center", style: { background: C.bg, color: C.muted, fontFamily: SANS } }, "\uBD88\uB7EC\uC624\uB294 \uC911...");
    const currentLabel = NAV.find((n) => n.id === tab)?.label;
    return (React.createElement("div", { className: "min-h-screen flex", style: { background: C.bg, color: C.ink, fontFamily: SANS, backgroundImage: `radial-gradient(circle at 15% -10%, ${C.accentSoft}55, transparent 45%), radial-gradient(circle at 100% 0%, ${C.bgAlt}88, transparent 50%)` } },
        React.createElement("style", null, `
        .lift-card:hover { transform: translateY(-3px); box-shadow: ${C.shadowLift}; }
        .focus-ring:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentSoft}; }
        .nav-btn { position: relative; overflow: hidden; }
        .nav-btn .nav-icon { transition: transform 0.2s ease; }
        .nav-btn:hover .nav-icon { transform: translateX(2px); }
        .desktop-wrap { max-width: 1440px; margin: 0 auto; width: 100%; }
      `),
        React.createElement("aside", { className: "hidden md:flex md:flex-col w-64 shrink-0 p-5", style: { borderRight: `1px solid ${C.border}` } },
            React.createElement("div", { className: "mb-8 px-2" },
                React.createElement("div", { className: "text-2xl font-semibold", style: { fontFamily: SERIF, letterSpacing: "-0.01em", wordBreak: "keep-all" } }, title)),
            React.createElement("nav", { className: "flex flex-col gap-1" }, NAV.map((n) => {
                const IconComp = n.icon;
                const active = tab === n.id;
                return (React.createElement("button", { key: n.id, onClick: () => setTab(n.id), className: "nav-btn flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left", style: { background: active ? C.ink : "transparent", color: active ? "#fff" : C.inkSoft, boxShadow: active ? "0 4px 12px -4px rgba(24,26,32,0.4)" : "none" } },
                    React.createElement(IconComp, { size: 17, className: "nav-icon" }),
                    n.label));
            })),
            React.createElement("div", { className: "mt-auto px-2 pt-6 text-xs", style: { color: C.muted } },
                "\uCD1D \uC790\uC0B0 ",
                React.createElement("span", { style: { fontFamily: SERIF, color: C.ink, fontWeight: 600 } },
                    React.createElement(AnimatedNumber, { value: totalAssets })))),
        React.createElement("div", { className: "flex-1 flex flex-col min-w-0 pb-16 md:pb-0" },
            React.createElement("header", { className: "px-4 md:px-8 py-4 md:py-5 flex items-center justify-between gap-3", style: { borderBottom: `1px solid ${C.border}` } },
                React.createElement("div", { className: "desktop-wrap flex items-center justify-between gap-3" },
                    React.createElement("h1", { className: "text-xl md:text-3xl font-semibold shrink-0", style: { fontFamily: SERIF } }, currentLabel),
                    React.createElement("div", { className: "flex items-center gap-2 md:gap-3 min-w-0" },
                        syncError ? (React.createElement("div", { className: "flex items-center gap-1 text-xs shrink-0", style: { color: C.negative } },
                            React.createElement(IconWifiOff, { size: 13 }),
                            " ",
                            React.createElement("span", { className: "hidden sm:inline" }, syncError))) : (React.createElement("div", { className: "text-xs hidden sm:block shrink-0", style: { color: C.muted } }, lastSynced ? `${lastSynced.toLocaleTimeString("ko-KR")} 동기화됨` : "")),
                        React.createElement(IconBtn, { onClick: () => reloadAll(true), title: "\uC0C8\uB85C\uACE0\uCE68" },
                            React.createElement(IconRefresh, { size: 16, style: { animation: syncing ? "spin 0.8s linear infinite" : "none" } })),
                        React.createElement(IconBtn, { onClick: () => setShowHelp(true), title: "\uC0AC\uC6A9 \uC548\uB0B4" },
                            React.createElement(IconHelp, { size: 16 })),
                        React.createElement(IconBtn, { onClick: () => { setTitleDraft(title); setShowSettings(true); }, title: "\uC5F0\uACB0 \uC124\uC815" },
                            React.createElement(IconSettings, { size: 16 }))))),
            React.createElement("main", { key: tab, className: "flex-1 min-w-0 p-4 md:p-8 overflow-y-auto fade-in-up" },
                React.createElement("div", { className: "desktop-wrap" },
                    tab === "dashboard" && React.createElement(Dashboard, { transactions: transactions, savings: savings, events: events, todos: todos, budgets: budgets, totalSavingsCurrent: totalSavingsCurrent }),
                    tab === "savings" && React.createElement(SavingsInvestTab, { savings: savings, setSavings: setSavings, accounts: accounts }),
                    tab === "insurance" && React.createElement(FixedCostsTab, { insurances: insurances, setInsurances: setInsurances, fixedExpenses: fixedExpenses, setFixedExpenses: setFixedExpenses, accounts: accounts }),
                    tab === "expenses" && React.createElement(ExpensesTab, { transactions: transactions, addTransaction: addTransaction, addTransactions: addTransactions, deleteTransaction: deleteTransaction, updateTransaction: updateTransaction, cfg: cfg, onOpenSettings: () => setShowGemini(true), budgets: budgets, setBudgetForPeriod: setBudgetForPeriod }),
                    tab === "calendar" && React.createElement(CalendarTab, { events: events, setEvents: setEvents }),
                    tab === "todo" && React.createElement(TodoTab, { todos: todos, setTodos: setTodos }),
                    tab === "accounts" && React.createElement(AccountsTab, { accounts: accounts, setAccounts: setAccounts, transfers: transfers, setTransfers: setTransfers, insurances: insurances, fixedExpenses: fixedExpenses, savings: savings })))),
        React.createElement("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 flex z-10", style: { background: C.surface, borderTop: `1px solid ${C.border}`, boxShadow: "0 -4px 16px rgba(24,26,32,0.06)", paddingBottom: "env(safe-area-inset-bottom, 0px)" } }, NAV.map((n) => {
            const IconComp = n.icon;
            const active = tab === n.id;
            return (React.createElement("button", { key: n.id, onClick: () => setTab(n.id), className: "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 transition-transform duration-150", style: { transform: active ? "translateY(-2px)" : "none" } },
                React.createElement(IconComp, { size: 18, color: active ? C.ink : C.muted }),
                React.createElement("span", { className: "text-[9.5px] leading-tight truncate w-full text-center px-0.5", style: { color: active ? C.ink : C.muted, fontWeight: active ? 600 : 400 } }, n.shortLabel)));
        })),
        showSettings && (React.createElement("div", { className: "fixed inset-0 flex items-center justify-center p-6 z-20", style: { background: "rgba(24,26,32,0.45)" } },
            React.createElement(Card, { style: { maxWidth: 460, maxHeight: "88vh", overflowY: "auto" }, className: "w-full relative fade-in-up" },
                React.createElement("div", { className: "flex justify-end" },
                    React.createElement(IconBtn, { onClick: () => { setShowSettings(false); setIoMsg(null); setResetMode(null); setResetMsg(null); }, title: "\uB2EB\uAE30" },
                        React.createElement(IconX, { size: 16 }))),
                React.createElement("h3", { className: "text-base font-semibold mb-3", style: { fontFamily: SERIF } }, "\uC124\uC815"),
                React.createElement("p", { className: "text-sm font-medium mb-1" }, "\uAC00\uACC4\uBD80 \uC774\uB984"),
                React.createElement("p", { className: "text-xs mb-2", style: { color: C.muted } }, "\uC67C\uCABD \uC704\uC5D0 \uD45C\uC2DC\uB418\uB294 \uC774\uB984\uC785\uB2C8\uB2E4. \uBC30\uC6B0\uC790 \uD654\uBA74\uC5D0\uB3C4 \uB611\uAC19\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4."),
                React.createElement("div", { className: "flex gap-2 mb-5" },
                    React.createElement(TextInput, { value: titleDraft, onChange: (e) => setTitleDraft(e.target.value), placeholder: "\uC608: \uC6B0\uB9AC\uC9D1 \uAC00\uACC4\uBD80", maxLength: 24 }),
                    React.createElement(PrimaryBtn, { onClick: () => { const v = titleDraft.trim(); if (v)
                            setTitle(v); } }, "\uBCC0\uACBD")),
                React.createElement("p", { className: "text-xs mb-2", style: { color: C.muted } }, "\uC774 \uAE30\uAE30\uAC00 \uC5F0\uACB0\uB41C \uC800\uC7A5\uC18C \uC8FC\uC18C"),
                React.createElement("div", { className: "text-xs mb-3 p-2.5 rounded-lg", style: { background: "#FAF9F6", color: C.inkSoft, fontFamily: "monospace", wordBreak: "break-all", border: `1px solid ${C.border}` } }, cfg.apiUrl),
                React.createElement("button", { onClick: async () => { const ok = await copyText(pairCode); setPairCopied(ok); setTimeout(() => setPairCopied(false), 2000); }, className: "w-full py-2.5 rounded-lg text-sm font-medium mb-1.5", style: { background: pairCopied ? C.positiveSoft : C.ink, color: pairCopied ? C.positive : "#fff" } }, pairCopied ? "✓ 연결코드를 복사했어요" : "배우자에게 연결코드 보내기"),
                React.createElement("p", { className: "text-xs mb-3", style: { color: C.muted } }, "\uBCF5\uC0AC\uB41C \uCF54\uB4DC\uB97C \uBC30\uC6B0\uC790\uC5D0\uAC8C \uC804\uB2EC\uD558\uBA74, \uBC30\uC6B0\uC790 \uC571\uC758 \uCCAB \uD654\uBA74\uC5D0\uC11C \uBD99\uC5EC\uB123\uAE30\uB9CC\uC73C\uB85C \uAC19\uC740 \uAC00\uACC4\uBD80\uC5D0 \uC5F0\uACB0\uB429\uB2C8\uB2E4."),
                React.createElement("div", { className: "rounded-xl p-3.5 mb-3", style: { background: "#FAF9F6", border: `1px solid ${C.border}` } },
                    React.createElement("div", { className: "text-sm font-semibold mb-1", style: { color: C.ink } }, "\uD734\uB300\uD3F0\uC5D0\uC11C \uC4F0\uAE30"),
                    mobileLink(pairCode) ? (React.createElement(React.Fragment, null,
                        React.createElement("p", { className: "text-xs mb-3", style: { color: C.muted } },
                            "\uD734\uB300\uD3F0 \uCE74\uBA54\uB77C\uB85C \uC544\uB798 QR \uC744 \uCC0D\uC73C\uBA74 \uAC19\uC740 \uAC00\uACC4\uBD80\uAC00 \uBC14\uB85C \uC5F4\uB9BD\uB2C8\uB2E4. \uC124\uCE58 \uC5C6\uC774 \uC4F0\uACE0, \uBE0C\uB77C\uC6B0\uC800 \uBA54\uB274\uC758 ",
                            React.createElement("b", null, "\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00"),
                            " \uB97C \uB204\uB974\uBA74 \uC571\uCC98\uB7FC \uC544\uC774\uCF58\uC774 \uC0DD\uAE41\uB2C8\uB2E4."),
                        React.createElement(QrCode, { text: mobileLink(pairCode), size: 190, caption: "\uCE74\uBA54\uB77C \uC571\uC73C\uB85C \uCC0D\uC73C\uC138\uC694" }),
                        React.createElement("button", { onClick: async () => { const ok = await copyText(mobileLink(pairCode)); setMobileCopied(ok); setTimeout(() => setMobileCopied(false), 2000); }, className: "w-full py-2 rounded-lg text-sm font-medium mt-3", style: { background: mobileCopied ? C.positiveSoft : "#EFEAE0", color: mobileCopied ? C.positive : C.inkSoft } }, mobileCopied ? "✓ 주소를 복사했어요" : "휴대폰용 주소 복사 (카톡으로 보내기)"),
                        React.createElement("p", { className: "text-xs mt-2", style: { color: C.negative } }, "\uC774 QR \uC5D0\uB294 \uB0B4 \uAC00\uACC4\uBD80 \uC5F4\uC1E0\uAC00 \uB4E4\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uC0AC\uB78C\uC5D0\uAC8C \uBCF4\uC5EC\uC8FC\uC9C0 \uB9C8\uC138\uC694."))) : (React.createElement("p", { className: "text-xs leading-relaxed", style: { color: C.muted } },
                        "\uD734\uB300\uD3F0\uC6A9 \uC6F9 \uC8FC\uC18C\uAC00 \uC544\uC9C1 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. (\uC81C\uC791\uC790\uC6A9: src/app.jsx \uC758 ",
                        React.createElement("b", null, "MOBILE_WEB_URL"),
                        " \uC5D0 \uC8FC\uC18C\uB97C \uB123\uACE0 \uB2E4\uC2DC \uBE4C\uB4DC\uD558\uC138\uC694.)"))),
                !resetMode ? (React.createElement("button", { onClick: () => { setResetMode("menu"); setResetMsg(null); }, className: "w-full py-2 rounded-lg text-sm font-medium", style: { background: "#EFEAE0", color: C.inkSoft } }, "\uCD08\uAE30\uD654 \u00B7 \uB2E4\uB978 \uC800\uC7A5\uC18C\uB85C \uB2E4\uC2DC \uC5F0\uACB0")) : (React.createElement("div", { className: "rounded-xl p-3.5", style: { background: "#FAF9F6", border: `1px solid ${C.border}` } },
                    React.createElement("div", { className: "flex items-center justify-between mb-2" },
                        React.createElement("div", { className: "text-sm font-semibold", style: { color: C.ink } }, "\uCD08\uAE30\uD654"),
                        React.createElement("button", { onClick: () => { setResetMode(null); setResetMsg(null); }, className: "text-xs", style: { color: C.muted } }, "\uCDE8\uC18C")),
                    React.createElement("button", { onClick: () => { if (window.confirm("이 PC 의 연결 정보를 지우고 처음 설정 화면으로 돌아갑니다.\n구글 시트의 가계부 내용은 그대로 남습니다."))
                            onChangeServer({ keepGeminiKey: false }); }, className: "w-full text-left px-3 py-2.5 rounded-lg mb-2", style: { background: C.surface, border: `1px solid ${C.border}` } },
                        React.createElement("div", { className: "text-sm font-medium", style: { color: C.ink } }, "\uC774 PC \uB9CC \uCD08\uAE30\uD654"),
                        React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                            "\uC5F0\uACB0 \uC8FC\uC18C\u00B7\uC5F4\uC1E0\u00B7\uC800\uC7A5\uB41C \uD654\uBA74 \uC815\uBCF4\uB97C \uC9C0\uC6B0\uACE0 \uCC98\uC74C \uC124\uC815\uBD80\uD130 \uB2E4\uC2DC \uD569\uB2C8\uB2E4. ",
                            React.createElement("b", null, "\uAD6C\uAE00 \uC2DC\uD2B8 \uB0B4\uC6A9\uC740 \uB0A8\uC2B5\uB2C8\uB2E4."))),
                    React.createElement("button", { onClick: async () => {
                            if (!window.confirm("구글 시트에 저장된 가계부 내용을 모두 지웁니다.\n거래내역·계좌·예적금·일정이 전부 사라지며 되돌릴 수 없습니다.\n\n계속할까요?"))
                                return;
                            if (!window.confirm("정말 지웁니다. 배우자 화면에서도 사라집니다.\n필요하면 먼저 [백업 파일로 내보내기] 를 해두세요.\n\n마지막 확인입니다."))
                                return;
                            setResetBusy(true);
                            setResetMsg(null);
                            try {
                                for (const k of DATA_KEYS)
                                    await remoteDelete(cfg, k);
                                setResetMsg({ ok: true, text: "시트 데이터를 지웠습니다. 잠시 후 처음 설정 화면으로 돌아갑니다." });
                                setTimeout(() => onChangeServer({ keepGeminiKey: true }), 1200);
                            }
                            catch (e) {
                                setResetMsg({ ok: false, text: "삭제 실패 — " + ((e && e.message) || "네트워크를 확인해주세요") });
                            }
                            finally {
                                setResetBusy(false);
                            }
                        }, disabled: resetBusy, className: "w-full text-left px-3 py-2.5 rounded-lg", style: { background: C.negativeSoft, border: `1px solid ${C.negative}`, opacity: resetBusy ? 0.6 : 1 } },
                        React.createElement("div", { className: "text-sm font-medium", style: { color: C.negative } }, resetBusy ? "지우는 중..." : "구글 시트 데이터까지 전부 삭제"),
                        React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.negative } }, "\uAC00\uACC4\uBD80 \uB0B4\uC6A9\uC774 \uBAA8\uB450 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4. \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uACE0 \uBC30\uC6B0\uC790 \uD654\uBA74\uC5D0\uC11C\uB3C4 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.")),
                    resetMsg && React.createElement("div", { className: "text-xs mt-2", style: { color: resetMsg.ok ? C.positive : C.negative } }, resetMsg.text))),
                React.createElement("div", { className: "mt-5 pt-4", style: { borderTop: `1px dashed ${C.border}` } },
                    React.createElement("p", { className: "text-sm font-medium mb-1" }, "Gemini API \uD0A4 (\uC601\uC218\uC99D \uC790\uB3D9\uC778\uC2DD\uC6A9)"),
                    React.createElement("p", { className: "text-xs mb-2 leading-relaxed", style: { color: C.muted } }, "\uC601\uC218\uC99D\u00B7\uCE74\uB4DC\uB0B4\uC5ED \uC774\uBBF8\uC9C0\uB294 \uC774 PC \uC5D0\uC11C \uAD6C\uAE00 Gemini \uB85C \uC9C1\uC811 \uC804\uC1A1\uB429\uB2C8\uB2E4. \uD0A4\uB294 \uC774 PC \uC5D0\uB9CC \uC800\uC7A5\uB418\uBA70 \uAC1C\uC778\uC6A9 \uBB34\uB8CC \uC0AC\uC6A9\uB7C9 \uC548\uC5D0\uC11C \uB300\uAC1C \uC694\uAE08\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD0A4\uB97C \uB123\uC9C0 \uC54A\uC544\uB3C4 \uC9C1\uC811 \uC785\uB825\uC73C\uB85C \uAC00\uACC4\uBD80\uB97C \uC4F8 \uC218 \uC788\uC5B4\uC694."),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement(TextInput, { type: "password", value: geminiKeyDraft, onChange: (e) => setGeminiKeyDraft(e.target.value), placeholder: "AIzaSy..." }),
                        React.createElement(PrimaryBtn, { onClick: () => onSaveGeminiKey(geminiKeyDraft.trim()) }, "\uC800\uC7A5")),
                    React.createElement("button", { onClick: () => { setShowSettings(false); setShowGemini(true); }, className: "w-full py-2 rounded-lg text-sm font-medium mt-2", style: { background: C.accentSoft, color: C.accentDeep } }, "\uD0A4 \uBC1B\uB294 \uBC95 \uC790\uC138\uD788 \uBCF4\uAE30 (\uADF8\uB9BC \uC124\uBA85)"),
                    cfg.geminiKey && React.createElement("div", { className: "text-xs mt-2", style: { color: C.positive } }, "\u2713 \uD0A4\uAC00 \uC800\uC7A5\uB418\uC5B4 \uC788\uC5B4\uC694")),
                React.createElement("div", { className: "mt-5 pt-4", style: { borderTop: `1px dashed ${C.border}` } },
                    React.createElement("p", { className: "text-sm font-medium mb-1" }, "\uBC31\uC5C5 / \uBCF5\uC6D0"),
                    React.createElement("p", { className: "text-xs mb-2 leading-relaxed", style: { color: C.muted } }, "\uC804\uCCB4 \uAC00\uACC4\uBD80\uB97C \uD30C\uC77C \uD558\uB098\uB85C \uC800\uC7A5\uD574 \uB458 \uC218 \uC788\uC5B4\uC694. \uC800\uC7A5\uC18C\uB97C \uC62E\uAE30\uAC70\uB098 \uC2E4\uC218\uB85C \uC9C0\uC6E0\uC744 \uB54C \uADF8\uB300\uB85C \uB418\uB3CC\uB9BD\uB2C8\uB2E4."),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement("button", { onClick: doExport, className: "flex-1 py-2 rounded-lg text-sm font-medium", style: { background: "#EFEAE0", color: C.inkSoft } }, "\uBC31\uC5C5 \uD30C\uC77C\uB85C \uB0B4\uBCF4\uB0B4\uAE30"),
                        React.createElement("button", { onClick: doImport, className: "flex-1 py-2 rounded-lg text-sm font-medium", style: { background: "#EFEAE0", color: C.inkSoft } }, "\uBC31\uC5C5 \uD30C\uC77C\uC5D0\uC11C \uBCF5\uC6D0")),
                    ioMsg && React.createElement("div", { className: "text-xs mt-2", style: { color: ioMsg.ok ? C.positive : C.negative } }, ioMsg.text),
                    React.createElement("p", { className: "text-xs mt-2", style: { color: C.muted } }, "\uBCF5\uC6D0\uD558\uBA74 \uD604\uC7AC \uAC00\uACC4\uBD80 \uB0B4\uC6A9\uC744 \uBC31\uC5C5 \uD30C\uC77C \uB0B4\uC6A9\uC73C\uB85C \uB36E\uC5B4\uC501\uB2C8\uB2E4.")),
                React.createElement("div", { className: "mt-5 pt-4", style: { borderTop: `1px dashed ${C.border}` } },
                    React.createElement("button", { onClick: () => { setShowSettings(false); setShowHelp(true); }, className: "w-full py-2 rounded-lg text-sm font-medium", style: { background: "#EFEAE0", color: C.inkSoft } }, "\uC0AC\uC6A9 \uC548\uB0B4 \uB2E4\uC2DC \uBCF4\uAE30"))))),
        showHelp && React.createElement(HelpModal, { onClose: () => setShowHelp(false), onGoTab: (id) => setTab(id) }),
        showGemini && React.createElement(GeminiGuideModal, { onClose: () => setShowGemini(false), currentKey: cfg.geminiKey, onSave: (k) => { onSaveGeminiKey(k); setGeminiKeyDraft(k); } })));
}
// ---------- 대시보드 ----------
function Dashboard({ transactions, savings, events, todos, budgets, totalSavingsCurrent }) {
    const period = useMemo(() => getCurrentPeriod(), []);
    const prevPeriod = useMemo(() => shiftPeriod(period, -1), [period]);
    const periodTx = useMemo(() => txInPeriod(transactions, period), [transactions, period]);
    const prevTx = useMemo(() => txInPeriod(transactions, prevPeriod), [transactions, prevPeriod]);
    const prevIncome = prevTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const prevExpense = prevTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const livingExpenseOnly = periodTx.filter((t) => t.type === "expense" && txPocket(t) !== "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalExpense = periodTx.filter((t) => t.type === "expense" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalIncome = periodTx.filter((t) => t.type === "income" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const budgetObj = getBudgetObj(budgets, period);
    const livingBalance = budgetObj.total - livingExpenseOnly;
    const incidentalBalance = budgetObj.incidental - incidentalExpense + incidentalIncome;
    const liquidFunds = livingBalance + incidentalBalance;
    const totalAssets = totalSavingsCurrent + liquidFunds;
    const now = new Date();
    const thisMonthNum = now.getMonth() + 1;
    const thisMonthPrefix = `${now.getFullYear()}-${String(thisMonthNum).padStart(2, "0")}`;
    const salaryTxThisMonth = useMemo(() => transactions.filter((t) => t.type === "income" && t.category === "급여" && t.date && t.date.startsWith(thisMonthPrefix)), [transactions, thisMonthPrefix]);
    const salaryTotal = salaryTxThisMonth.reduce((s, t) => s + Number(t.amount), 0);
    const salaryByOwner = useMemo(() => {
        const map = {};
        salaryTxThisMonth.forEach((t) => { const o = t.owner && t.owner.trim() ? t.owner.trim() : "미지정"; map[o] = (map[o] || 0) + Number(t.amount); });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [salaryTxThisMonth]);
    const catTotals = {};
    periodTx.filter((t) => t.type === "expense").forEach((t) => { catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount); });
    const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = Math.max(1, ...topCats.map((c) => c[1]));
    const upcoming = useMemo(() => upcomingItems(events, KR_HOLIDAYS, new Date(), 60, 5), [events]);
    const incompleteTodos = todos.filter((t) => !t.done);
    const todoDone = todos.filter((t) => t.done).length;
    const daysToSettlement = daysBetween(now, period.end);
    const settlementLabel = daysToSettlement <= 0 ? "결산일이에요" : `다음 결산까지 D-${daysToSettlement}`;
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "rounded-2xl p-6 md:p-10 relative overflow-hidden fade-in-up", style: { background: `linear-gradient(135deg, ${C.ink} 0%, #24262F 60%, ${C.ink} 100%)`, color: "#fff", boxShadow: C.shadowLift } },
            React.createElement("div", { className: "absolute inset-0 opacity-40 pointer-events-none", style: { backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px), linear-gradient(120deg, transparent 30%, rgba(180,132,46,0.25) 50%, transparent 70%)`, backgroundSize: "auto, 250% 100%", animation: "shimmer 7s linear infinite" } }),
            React.createElement("div", { className: "relative" },
                React.createElement("div", { className: "text-xs tracking-widest opacity-60" }, "TOTAL ASSETS"),
                React.createElement("div", { className: "text-4xl md:text-6xl font-semibold mt-1 tabular-nums", style: { fontFamily: SERIF, letterSpacing: "-0.01em" } },
                    React.createElement(AnimatedNumber, { value: totalAssets })),
                React.createElement("div", { className: "text-sm md:text-base mt-1 opacity-70" }, formatWonUnit(totalAssets)),
                React.createElement("div", { className: "mt-5 pt-4 grid grid-cols-2 gap-3 text-sm md:text-base", style: { borderTop: "1px dashed rgba(255,255,255,0.25)" } },
                    React.createElement("div", null,
                        React.createElement("div", { className: "opacity-60 text-xs" }, "\uC608\uC801\uAE08\u00B7\uD22C\uC790 \uD3C9\uAC00\uC561"),
                        React.createElement("div", { style: { fontFamily: SERIF } }, formatWon(totalSavingsCurrent))),
                    React.createElement("div", null,
                        React.createElement("div", { className: "opacity-60 text-xs" }, "\uC720\uB3D9\uC790\uAE08 (\uC0DD\uD65C\uBE44+\uD488\uC704\uC720\uC9C0\uBE44)"),
                        React.createElement("div", { style: { fontFamily: SERIF } }, formatWon(liquidFunds)))))),
        React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2 px-1" },
            React.createElement("div", { className: "text-xs", style: { color: C.muted } },
                periodLabel(period),
                " \uACB0\uC0B0 \uAE30\uC900"),
            React.createElement("div", { className: "text-xs font-medium px-2.5 py-1 rounded-full", style: { background: daysToSettlement <= 0 ? C.negativeSoft : C.accentSoft, color: daysToSettlement <= 0 ? C.negative : C.accentDeep } }, settlementLabel)),
        React.createElement("div", { className: "grid grid-cols-2 gap-4 md:gap-5" },
            React.createElement(Card, { lift: true, style: { borderColor: livingBalance < 0 ? C.negative : C.border } },
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC0DD\uD65C\uBE44 \uC794\uACE0"),
                React.createElement("div", { className: "text-xl md:text-2xl font-semibold mt-1", style: { fontFamily: SERIF, color: livingBalance >= 0 ? C.positive : C.negative } },
                    React.createElement(AnimatedNumber, { value: livingBalance })),
                budgetObj.total > 0 && React.createElement("div", { className: "mt-2.5" },
                    React.createElement(BudgetBar, { spent: livingExpenseOnly, budget: budgetObj.total }),
                    React.createElement("div", { className: "text-[11px] mt-1", style: { color: C.muted } },
                        formatWon(livingExpenseOnly),
                        " / ",
                        formatWon(budgetObj.total)))),
            React.createElement(Card, { lift: true, style: { borderColor: incidentalBalance < 0 ? C.negative : C.border } },
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uD488\uC704\uC720\uC9C0\uBE44 \uC794\uACE0"),
                React.createElement("div", { className: "text-xl md:text-2xl font-semibold mt-1", style: { fontFamily: SERIF, color: incidentalBalance >= 0 ? C.accent : C.negative } },
                    React.createElement(AnimatedNumber, { value: incidentalBalance })),
                budgetObj.incidental > 0 && React.createElement("div", { className: "mt-2.5" },
                    React.createElement(BudgetBar, { spent: incidentalExpense, budget: budgetObj.incidental }),
                    React.createElement("div", { className: "text-[11px] mt-1", style: { color: C.muted } },
                        formatWon(incidentalExpense),
                        " / ",
                        formatWon(budgetObj.incidental)))),
            React.createElement(Card, { lift: true },
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } },
                    "\uC774\uBC88\uB2EC \uAE09\uC5EC(",
                    thisMonthNum,
                    "\uC6D4)"),
                React.createElement("div", { className: "text-xl md:text-2xl font-semibold mt-1", style: { fontFamily: SERIF, color: C.positive } },
                    React.createElement(AnimatedNumber, { value: salaryTotal })),
                salaryByOwner.length > 0 ? (React.createElement("div", { className: "flex flex-wrap gap-1.5 mt-2.5" }, salaryByOwner.map(([owner, amt]) => (React.createElement("div", { key: owner, className: "text-[11px] px-2 py-0.5 rounded-full", style: { background: C.positiveSoft, color: C.positive } },
                    owner,
                    " ",
                    formatWon(amt)))))) : (React.createElement("div", { className: "text-[11px] mt-2.5", style: { color: C.muted } }, "\uC0DD\uD65C\uBE44\uAD00\uB9AC\uC5D0\uC11C \uAD6C\uBD84=\uC218\uC785, \uCE74\uD14C\uACE0\uB9AC=\uAE09\uC5EC\uB85C \uB4F1\uB85D\uD574\uBCF4\uC138\uC694."))),
            React.createElement(Card, { lift: true },
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uD560\uC77C \uC9C4\uD589\uB960"),
                React.createElement("div", { className: "text-xl md:text-2xl font-semibold mt-1", style: { fontFamily: SERIF } }, todos.length ? `${todoDone}/${todos.length}` : "-"),
                incompleteTodos.length > 0 ? (React.createElement("div", { className: "flex flex-col gap-1 mt-2.5" },
                    incompleteTodos.slice(0, 3).map((t) => (React.createElement("div", { key: t.id, className: "text-[11px] truncate flex items-center gap-1.5", style: { color: C.inkSoft } },
                        React.createElement("span", { className: "w-1.5 h-1.5 rounded-full shrink-0", style: { background: C.accent } }),
                        t.text))),
                    incompleteTodos.length > 3 && React.createElement("div", { className: "text-[11px]", style: { color: C.muted } },
                        "+",
                        incompleteTodos.length - 3,
                        "\uAC1C \uB354"))) : todos.length > 0 ? (React.createElement("div", { className: "text-[11px] mt-2.5", style: { color: C.positive } }, "\uBAA8\uB450 \uC644\uB8CC\uD588\uC5B4\uC694 \uD83C\uDF89")) : null)),
        React.createElement("div", { className: "grid lg:grid-cols-2 gap-5 md:gap-6" },
            React.createElement(Card, { lift: true },
                React.createElement(SectionTitle, null, "\uC774\uBC88 \uACB0\uC0B0 \uC9C0\uCD9C \uCE74\uD14C\uACE0\uB9AC TOP 5"),
                topCats.length === 0 ? React.createElement(Empty, { text: "\uC774\uBC88 \uACB0\uC0B0 \uAE30\uAC04 \uC9C0\uCD9C \uB0B4\uC5ED\uC774 \uC5C6\uC5B4\uC694." }) : (React.createElement("div", { className: "flex flex-col gap-2.5" }, topCats.map(([cat, amt], i) => (React.createElement("div", { key: cat },
                    React.createElement("div", { className: "flex justify-between text-sm mb-1" },
                        React.createElement("span", { style: { color: C.inkSoft } }, cat),
                        React.createElement("span", { style: { fontFamily: SERIF } }, formatWon(amt))),
                    React.createElement("div", { className: "h-2 rounded-full overflow-hidden", style: { background: "#EFEAE0" } },
                        React.createElement("div", { className: "h-2 rounded-full", style: { width: `${(amt / maxCat) * 100}%`, background: C.accent, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)", transitionDelay: `${i * 60}ms` } })))))))),
            React.createElement(Card, { lift: true },
                React.createElement(SectionTitle, null, "\uB2E4\uAC00\uC624\uB294 \uC77C\uC815"),
                upcoming.length === 0 ? React.createElement(Empty, { text: "\uC608\uC815\uB41C \uC77C\uC815\uC774 \uC5C6\uC5B4\uC694." }) : (React.createElement("div", { className: "flex flex-col gap-2" }, upcoming.map((e, idx) => {
                    const isRecurring = !e.isHoliday && e.recurrence && e.recurrence !== "none";
                    const badgeBg = e.isHoliday ? C.negativeSoft : isRecurring ? C.positiveSoft : C.accentSoft;
                    const badgeColor = e.isHoliday ? C.negative : isRecurring ? C.positive : C.accent;
                    return (React.createElement("div", { key: idx, className: "flex items-center gap-3 text-sm py-1.5", style: { borderBottom: `1px solid ${C.border}` } },
                        React.createElement("div", { className: "px-2 py-0.5 rounded-md text-xs font-medium shrink-0", style: { background: badgeBg, color: badgeColor } }, e.date?.slice(5)),
                        React.createElement("div", { className: "truncate flex-1" },
                            e.title,
                            e.isHoliday ? " (공휴일)" : ""),
                        React.createElement("div", { className: "text-xs font-medium shrink-0", style: { color: C.muted } }, dDayLabel(e.date))));
                }))))),
        React.createElement(Card, { lift: true },
            React.createElement(SectionTitle, null,
                "\uC9C0\uB09C \uACB0\uC0B0 \uC694\uC57D \u00B7 ",
                periodLabel(prevPeriod)),
            React.createElement("div", { className: "grid grid-cols-3 gap-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC218\uC785"),
                    React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { color: C.positive, fontFamily: SERIF } }, formatWon(prevIncome))),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC9C0\uCD9C"),
                    React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { color: C.negative, fontFamily: SERIF } }, formatWon(prevExpense))),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC21C\uD604\uAE08\uD750\uB984"),
                    React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { fontFamily: SERIF } }, formatWon(prevIncome - prevExpense)))))));
}
// ---------- 예적금 섹션 (예금/적금) ----------
function SavingsSection({ items, setSavings, accounts }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { name: "", type: "적금", principal: "", monthlyDeposit: "", startDate: "", targetDate: "", accountNumber: "", owner: "", fromAccountId: "" };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (item) => { setForm({ ...empty, ...item }); setEditId(item.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("삭제할까요?"))
        setSavings((prev) => prev.filter((s) => s.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.name)
            return;
        const payload = { ...form };
        if (form.type !== "적금")
            payload.fromAccountId = "";
        if (editId)
            setSavings((prev) => prev.map((s) => (s.id === editId ? { ...payload, id: editId } : s)));
        else
            setSavings((prev) => [{ ...payload, id: uid() }, ...prev]);
        setOpen(false);
    };
    const total = items.reduce((s, x) => s + computeSavingsValue(x), 0);
    const ownerNames = useMemo(() => Array.from(new Set(items.map((s) => s.owner).filter(Boolean))), [items]);
    const accountName = (id) => (accounts || []).find((a) => a.id === id)?.name || "";
    const [sortBy, setSortBy] = useState("none");
    const sortedItems = useMemo(() => {
        if (sortBy === "owner")
            return [...items].sort((a, b) => (a.owner || "미지정").localeCompare(b.owner || "미지정", "ko"));
        if (sortBy === "type")
            return [...items].sort((a, b) => (a.type || "").localeCompare(b.type || "", "ko"));
        return items;
    }, [items, sortBy]);
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2" },
            React.createElement("div", { className: "text-sm md:text-base", style: { color: C.muted } },
                "\uCD1D \uD3C9\uAC00\uC561 ",
                React.createElement("span", { style: { color: C.ink, fontWeight: 600 } }, formatWon(total))),
            React.createElement(PrimaryBtn, { onClick: startAdd },
                React.createElement(IconPlus, { size: 16 }),
                " \uC0C1\uD488 \uCD94\uAC00")),
        items.length > 1 && React.createElement(SortToggle, { value: sortBy, onChange: setSortBy, options: [{ value: "none", label: "기본순" }, { value: "owner", label: "예금주순" }, { value: "type", label: "종류순" }] }),
        open && (React.createElement(Card, null,
            React.createElement("datalist", { id: "savings-owner-suggestions" }, ownerNames.map((o) => React.createElement("option", { key: o, value: o }))),
            React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" },
                React.createElement(Field, { label: "\uC0C1\uD488\uBA85" },
                    React.createElement(TextInput, { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\uC608: \uCCAD\uB144\uB3C4\uC57D\uACC4\uC88C" })),
                React.createElement(Field, { label: "\uC720\uD615" },
                    React.createElement(SelectInput, { value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }) }, SAVINGS_TYPES.map((t) => React.createElement("option", { key: t }, t)))),
                React.createElement(Field, { label: "\uC18C\uC720\uC790(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), placeholder: "\uC608: \uD64D\uAE38\uB3D9", list: "savings-owner-suggestions" })),
                React.createElement(Field, { label: "\uACC4\uC88C\uBC88\uD638(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.accountNumber, onChange: (e) => setForm({ ...form, accountNumber: e.target.value }), placeholder: "\uC608: 110-123-456789" })),
                React.createElement(Field, { label: "\uAC00\uC785\uC77C(\uC120\uD0DD)" },
                    React.createElement(DateInput, { value: form.startDate, onChange: (v) => setForm({ ...form, startDate: v }) })),
                React.createElement(Field, { label: "\uBAA9\uD45C\uC77C/\uB9CC\uAE30\uC77C(\uC120\uD0DD)" },
                    React.createElement(DateInput, { value: form.targetDate, onChange: (v) => setForm({ ...form, targetDate: v }) })),
                React.createElement(Field, { label: "\uC6D0\uAE08" },
                    React.createElement(MoneyInput, { required: true, value: form.principal, onChange: (v) => setForm({ ...form, principal: v }) })),
                React.createElement(Field, { label: "\uC6D4 \uB0A9\uC785\uC561(\uC120\uD0DD)" },
                    React.createElement(MoneyInput, { value: form.monthlyDeposit, onChange: (v) => setForm({ ...form, monthlyDeposit: v }) })),
                form.type === "적금" && (React.createElement(Field, { label: "\uCD9C\uBC1C \uACC4\uC88C(\uC120\uD0DD)" },
                    React.createElement(SelectInput, { value: form.fromAccountId, onChange: (e) => setForm({ ...form, fromAccountId: e.target.value }) },
                        React.createElement("option", { value: "" }, "\uC120\uD0DD \uC548 \uD568"),
                        (accounts || []).map((a) => React.createElement("option", { key: a.id, value: a.id },
                            a.owner ? `[${a.owner}] ` : "",
                            a.name))))),
                React.createElement("div", { className: "sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1" },
                    React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                    React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
        items.length === 0 ? React.createElement(Card, null,
            React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uC608\uAE08\u00B7\uC801\uAE08 \uC0C1\uD488\uC774 \uC5C6\uC5B4\uC694. '\uC0C1\uD488 \uCD94\uAC00'\uB85C \uC2DC\uC791\uD574\uBCF4\uC138\uC694." })) : (React.createElement("div", { className: "grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" }, sortedItems.map((s) => {
            const displayValue = computeSavingsValue(s);
            const gain = displayValue - Number(s.principal || 0);
            const info = maturityInfo(s.startDate, s.targetDate);
            const matured = info && info.daysLeft <= 0;
            return (React.createElement(Card, { key: s.id, lift: true },
                React.createElement("div", { className: "flex items-start justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex items-center gap-1.5 mb-1.5 flex-wrap" },
                            React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { background: C.accentSoft, color: C.accent } }, s.type),
                            s.owner && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { border: `1px solid ${C.border}`, color: C.inkSoft } }, s.owner)),
                        React.createElement("div", { className: "font-semibold" }, s.name),
                        s.accountNumber && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted, fontFamily: "monospace" } }, s.accountNumber)),
                    React.createElement("div", { className: "flex" },
                        React.createElement(IconBtn, { onClick: () => startEdit(s), title: "\uC218\uC815" },
                            React.createElement(IconPencil, { size: 15 })),
                        React.createElement(IconBtn, { onClick: () => remove(s.id), title: "\uC0AD\uC81C", danger: true },
                            React.createElement(IconTrash, { size: 15 })))),
                React.createElement("div", { className: "mt-3 text-xl md:text-2xl font-semibold", style: { fontFamily: SERIF } }, formatWon(displayValue)),
                React.createElement("div", { className: "text-xs mt-1", style: { color: gain >= 0 ? C.positive : C.negative } },
                    gain >= 0 ? "+" : "",
                    formatWon(gain)),
                info && !matured && (React.createElement("div", { className: "mt-3" },
                    React.createElement("div", { className: "flex justify-between text-xs mb-1", style: { color: C.muted } },
                        React.createElement("span", null, "\uB9CC\uAE30\uAE4C\uC9C0 \uC9C4\uD589\uB960"),
                        React.createElement("span", null,
                            "D-",
                            info.daysLeft)),
                    React.createElement("div", { className: "h-1.5 rounded-full overflow-hidden", style: { background: "#EFEAE0" } },
                        React.createElement("div", { className: "h-1.5 rounded-full", style: { width: `${info.pct}%`, background: C.positive, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" } })))),
                matured && (React.createElement("div", { className: "mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg", style: { background: C.accentSoft, color: C.accentDeep, animation: "celebratePulse 1.6s ease-in-out infinite" } },
                    React.createElement("span", { style: { fontSize: 16 } }, "\uD83C\uDF89"),
                    React.createElement("span", { className: "text-sm font-medium" }, "\uB9CC\uAE30 \uC644\uB8CC! \uCD95\uD558\uD574\uC694"),
                    React.createElement("span", { style: { fontSize: 16 } }, "\uD83C\uDF8A"))),
                s.targetDate && React.createElement("div", { className: "text-xs mt-2", style: { color: C.muted } },
                    "\uBAA9\uD45C\uC77C ",
                    s.targetDate),
                s.monthlyDeposit && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                    "\uC6D4 ",
                    formatWon(s.monthlyDeposit),
                    " \uB0A9\uC785"),
                s.type === "적금" && s.fromAccountId && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                    accountName(s.fromAccountId),
                    "\uC5D0\uC11C \uCD9C\uAE08")));
        })))));
}
// ---------- 투자 섹션 ----------
function InvestSection({ items, setSavings }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { name: "", owner: "", accountNumber: "", startDate: "", principal: "", currentValue: "", holdings: "" };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (item) => { setForm({ ...empty, ...item }); setEditId(item.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("삭제할까요?"))
        setSavings((prev) => prev.filter((s) => s.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.name)
            return;
        const payload = { ...form, type: "투자" };
        if (editId)
            setSavings((prev) => prev.map((s) => (s.id === editId ? { ...payload, id: editId } : s)));
        else
            setSavings((prev) => [{ ...payload, id: uid() }, ...prev]);
        setOpen(false);
    };
    const total = items.reduce((s, x) => s + Number(x.currentValue || 0), 0);
    const ownerNames = useMemo(() => Array.from(new Set(items.map((s) => s.owner).filter(Boolean))), [items]);
    const [sortBy, setSortBy] = useState("none");
    const sortedItems = useMemo(() => {
        if (sortBy === "owner")
            return [...items].sort((a, b) => (a.owner || "미지정").localeCompare(b.owner || "미지정", "ko"));
        return items;
    }, [items, sortBy]);
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2" },
            React.createElement("div", { className: "text-sm md:text-base", style: { color: C.muted } },
                "\uCD1D \uD3C9\uAC00\uC561 ",
                React.createElement("span", { style: { color: C.ink, fontWeight: 600 } }, formatWon(total))),
            React.createElement(PrimaryBtn, { onClick: startAdd },
                React.createElement(IconPlus, { size: 16 }),
                " \uD22C\uC790\uACC4\uC88C \uCD94\uAC00")),
        React.createElement("p", { className: "text-xs -mt-3", style: { color: C.muted } }, "\uC2E4\uC2DC\uAC04 \uC5F0\uB3D9 \uC5C6\uC774, \uC9C1\uC811 \uC785\uB825\uD55C \uD3C9\uAC00\uC561\uACFC \uBCF4\uC720 \uC885\uBAA9\uC744 \uC0C1\uC2DC \uC218\uC815\uD558\uBA70 \uAD00\uB9AC\uD558\uB294 \uBC29\uC2DD\uC774\uC5D0\uC694."),
        items.length > 1 && React.createElement(SortToggle, { value: sortBy, onChange: setSortBy, options: [{ value: "none", label: "기본순" }, { value: "owner", label: "예금주순" }] }),
        open && (React.createElement(Card, null,
            React.createElement("datalist", { id: "invest-owner-suggestions" }, ownerNames.map((o) => React.createElement("option", { key: o, value: o }))),
            React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 gap-3" },
                React.createElement(Field, { label: "\uACC4\uC88C\uBA85" },
                    React.createElement(TextInput, { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\uC608: \uBC30\uC6B0\uC790 ISA" })),
                React.createElement(Field, { label: "\uC18C\uC720\uC790(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), placeholder: "\uC608: \uD64D\uAE38\uB3D9", list: "invest-owner-suggestions" })),
                React.createElement(Field, { label: "\uACC4\uC88C\uBC88\uD638(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.accountNumber, onChange: (e) => setForm({ ...form, accountNumber: e.target.value }) })),
                React.createElement(Field, { label: "\uAC00\uC785\uC77C(\uC120\uD0DD)" },
                    React.createElement(DateInput, { value: form.startDate, onChange: (v) => setForm({ ...form, startDate: v }) })),
                React.createElement(Field, { label: "\uB204\uC801 \uD22C\uC785 \uC6D0\uAE08(\uC120\uD0DD)" },
                    React.createElement(MoneyInput, { value: form.principal, onChange: (v) => setForm({ ...form, principal: v }) })),
                React.createElement(Field, { label: "\uD604\uC7AC \uD3C9\uAC00\uC561" },
                    React.createElement(MoneyInput, { required: true, value: form.currentValue, onChange: (v) => setForm({ ...form, currentValue: v }) })),
                React.createElement("div", { className: "sm:col-span-2" },
                    React.createElement(Field, { label: "\uBCF4\uC720 \uC885\uBAA9 (\uD55C \uC904\uC5D0 \uD558\uB098\uC529, \uC608: TIGER S&P500 20%)" },
                        React.createElement("textarea", { value: form.holdings, onChange: (e) => setForm({ ...form, holdings: e.target.value }), rows: 4, style: { ...inputStyle, width: "100%", resize: "vertical", fontFamily: "inherit" }, placeholder: "TIGER S&P500 20%\n삼성전자 15%\nQQQ 10%", className: "focus-ring" }))),
                React.createElement("div", { className: "sm:col-span-2 flex gap-2 justify-end pt-1" },
                    React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                    React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
        items.length === 0 ? React.createElement(Card, null,
            React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uD22C\uC790\uACC4\uC88C\uAC00 \uC5C6\uC5B4\uC694. '\uD22C\uC790\uACC4\uC88C \uCD94\uAC00'\uB85C \uC2DC\uC791\uD574\uBCF4\uC138\uC694." })) : (React.createElement("div", { className: "grid sm:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5" }, sortedItems.map((s) => {
            const gain = Number(s.currentValue || 0) - Number(s.principal || 0);
            const holdingLines = (s.holdings || "").split("\n").map((l) => l.trim()).filter(Boolean);
            return (React.createElement(Card, { key: s.id, lift: true },
                React.createElement("div", { className: "flex items-start justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex items-center gap-1.5 mb-1.5 flex-wrap" },
                            React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { background: C.accentSoft, color: C.accent } }, "\uD22C\uC790"),
                            s.owner && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { border: `1px solid ${C.border}`, color: C.inkSoft } }, s.owner)),
                        React.createElement("div", { className: "font-semibold text-lg" }, s.name),
                        s.accountNumber && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted, fontFamily: "monospace" } }, s.accountNumber)),
                    React.createElement("div", { className: "flex" },
                        React.createElement(IconBtn, { onClick: () => startEdit(s), title: "\uC218\uC815" },
                            React.createElement(IconPencil, { size: 15 })),
                        React.createElement(IconBtn, { onClick: () => remove(s.id), title: "\uC0AD\uC81C", danger: true },
                            React.createElement(IconTrash, { size: 15 })))),
                React.createElement("div", { className: "mt-3 text-2xl md:text-3xl font-semibold", style: { fontFamily: SERIF } }, formatWon(s.currentValue)),
                Number(s.principal) > 0 && React.createElement("div", { className: "text-xs mt-1", style: { color: gain >= 0 ? C.positive : C.negative } },
                    gain >= 0 ? "+" : "",
                    formatWon(gain)),
                holdingLines.length > 0 && (React.createElement("div", { className: "mt-4 pt-3", style: { borderTop: `1px dashed ${C.border}` } },
                    React.createElement("div", { className: "text-xs font-medium mb-1.5", style: { color: C.inkSoft } }, "\uBCF4\uC720 \uC885\uBAA9"),
                    React.createElement("div", { className: "flex flex-col gap-1.5" }, holdingLines.map((line, i) => (React.createElement("div", { key: i, className: "text-xs px-2.5 py-1.5 rounded-lg", style: { background: "#FAF9F6", color: C.inkSoft, border: `1px solid ${C.border}` } }, line)))))),
                s.startDate && React.createElement("div", { className: "text-xs mt-3", style: { color: C.muted } },
                    "\uAC00\uC785\uC77C ",
                    s.startDate)));
        })))));
}
// ---------- 예적금/투자 (탭 전환) ----------
function SavingsInvestTab({ savings, setSavings, accounts }) {
    const [subTab, setSubTab] = useState("savings");
    const savingsOnly = useMemo(() => savings.filter((s) => s.type !== "투자"), [savings]);
    const investOnly = useMemo(() => savings.filter((s) => s.type === "투자"), [savings]);
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "flex gap-2" },
            React.createElement("button", { onClick: () => setSubTab("savings"), className: "px-4 py-2 rounded-lg text-sm font-medium", style: { background: subTab === "savings" ? C.ink : C.surface, color: subTab === "savings" ? "#fff" : C.inkSoft, border: `1px solid ${subTab === "savings" ? C.ink : C.border}` } }, "\uC608\uC801\uAE08"),
            React.createElement("button", { onClick: () => setSubTab("invest"), className: "px-4 py-2 rounded-lg text-sm font-medium", style: { background: subTab === "invest" ? C.ink : C.surface, color: subTab === "invest" ? "#fff" : C.inkSoft, border: `1px solid ${subTab === "invest" ? C.ink : C.border}` } }, "\uD22C\uC790")),
        subTab === "savings" && React.createElement(SavingsSection, { items: savingsOnly, setSavings: setSavings, accounts: accounts }),
        subTab === "invest" && React.createElement(InvestSection, { items: investOnly, setSavings: setSavings })));
}
// ---------- 보험 / 연금 섹션 ----------
function InsuranceSection({ insurances, setInsurances, accounts }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { name: "", provider: "", kind: "보험", category: "", monthlyPremium: "", startDate: "", endDate: "", accountNumber: "", owner: "", memo: "", fromAccountId: "" };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (item) => { setForm({ ...empty, ...item }); setEditId(item.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("삭제할까요?"))
        setInsurances((prev) => prev.filter((s) => s.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.name)
            return;
        if (editId)
            setInsurances((prev) => prev.map((s) => (s.id === editId ? { ...form, id: editId } : s)));
        else
            setInsurances((prev) => [{ ...form, id: uid() }, ...prev]);
        setOpen(false);
    };
    const totalMonthly = insurances.reduce((s, x) => s + Number(x.monthlyPremium || 0), 0);
    const insuranceTotal = insurances.filter((x) => x.kind === "보험").reduce((s, x) => s + Number(x.monthlyPremium || 0), 0);
    const pensionTotal = insurances.filter((x) => x.kind === "연금").reduce((s, x) => s + Number(x.monthlyPremium || 0), 0);
    const ownerNames = useMemo(() => Array.from(new Set(insurances.map((s) => s.owner).filter(Boolean))), [insurances]);
    const accountName = (id) => accounts.find((a) => a.id === id)?.name || "";
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "grid grid-cols-3 gap-4" },
            React.createElement(Card, null,
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uCD1D \uC6D4 \uB0A9\uC785\uC561"),
                React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { fontFamily: SERIF } }, formatWon(totalMonthly))),
            React.createElement(Card, null,
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uBCF4\uD5D8 \uD569\uACC4"),
                React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { fontFamily: SERIF, color: C.accent } }, formatWon(insuranceTotal))),
            React.createElement(Card, null,
                React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC5F0\uAE08 \uD569\uACC4"),
                React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { fontFamily: SERIF, color: C.positive } }, formatWon(pensionTotal)))),
        React.createElement("div", { className: "flex justify-end" },
            React.createElement(PrimaryBtn, { onClick: startAdd },
                React.createElement(IconPlus, { size: 16 }),
                " \uC0C1\uD488 \uCD94\uAC00")),
        open && (React.createElement(Card, null,
            React.createElement("datalist", { id: "ins-owner-suggestions" }, ownerNames.map((o) => React.createElement("option", { key: o, value: o }))),
            React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" },
                React.createElement(Field, { label: "\uC0C1\uD488\uBA85" },
                    React.createElement(TextInput, { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\uC608: \uC2E4\uC190\uC758\uB8CC\uBCF4\uD5D8" })),
                React.createElement(Field, { label: "\uAD6C\uBD84" },
                    React.createElement(SelectInput, { value: form.kind, onChange: (e) => setForm({ ...form, kind: e.target.value }) }, INSURANCE_KINDS.map((k) => React.createElement("option", { key: k }, k)))),
                React.createElement(Field, { label: "\uC885\uB958(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), placeholder: "\uC608: \uC2E4\uC190/\uC0DD\uBA85/\uC790\uB3D9\uCC28/\uAD6D\uBBFC\uC5F0\uAE08 \uB4F1" })),
                React.createElement(Field, { label: "\uBCF4\uD5D8\uC0AC/\uAE30\uAD00" },
                    React.createElement(TextInput, { value: form.provider, onChange: (e) => setForm({ ...form, provider: e.target.value }), placeholder: "\uC608: \uC0BC\uC131\uC0DD\uBA85" })),
                React.createElement(Field, { label: "\uC18C\uC720\uC790(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), placeholder: "\uC608: \uD64D\uAE38\uB3D9", list: "ins-owner-suggestions" })),
                React.createElement(Field, { label: "\uC6D4 \uB0A9\uC785\uC561" },
                    React.createElement(MoneyInput, { required: true, value: form.monthlyPremium, onChange: (v) => setForm({ ...form, monthlyPremium: v }) })),
                React.createElement(Field, { label: "\uCD9C\uBC1C \uACC4\uC88C(\uC120\uD0DD)" },
                    React.createElement(SelectInput, { value: form.fromAccountId, onChange: (e) => setForm({ ...form, fromAccountId: e.target.value }) },
                        React.createElement("option", { value: "" }, "\uC120\uD0DD \uC548 \uD568"),
                        accounts.map((a) => React.createElement("option", { key: a.id, value: a.id },
                            a.owner ? `[${a.owner}] ` : "",
                            a.name)))),
                React.createElement(Field, { label: "\uAC00\uC785\uC77C(\uC120\uD0DD)" },
                    React.createElement(DateInput, { value: form.startDate, onChange: (v) => setForm({ ...form, startDate: v }) })),
                React.createElement(Field, { label: "\uB9CC\uAE30\uC77C/\uB0A9\uC785\uC885\uB8CC\uC77C(\uC120\uD0DD)" },
                    React.createElement(DateInput, { value: form.endDate, onChange: (v) => setForm({ ...form, endDate: v }) })),
                React.createElement(Field, { label: "\uC99D\uAD8C\uBC88\uD638(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.accountNumber, onChange: (e) => setForm({ ...form, accountNumber: e.target.value }) })),
                React.createElement("div", { className: "sm:col-span-2 lg:col-span-3" },
                    React.createElement(Field, { label: "\uBA54\uBAA8(\uC120\uD0DD)" },
                        React.createElement(TextInput, { value: form.memo, onChange: (e) => setForm({ ...form, memo: e.target.value }), placeholder: "\uBCF4\uC7A5 \uB0B4\uC6A9 \uB4F1" }))),
                React.createElement("div", { className: "sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1" },
                    React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                    React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
        insurances.length === 0 ? React.createElement(Card, null,
            React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uBCF4\uD5D8\u00B7\uC5F0\uAE08 \uC0C1\uD488\uC774 \uC5C6\uC5B4\uC694. '\uC0C1\uD488 \uCD94\uAC00'\uB85C \uC2DC\uC791\uD574\uBCF4\uC138\uC694." })) : (React.createElement("div", { className: "grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" }, insurances.map((s) => {
            const info = maturityInfo(s.startDate, s.endDate);
            const matured = info && info.daysLeft <= 0;
            const kindColor = s.kind === "연금" ? C.positive : C.accent;
            const kindBg = s.kind === "연금" ? C.positiveSoft : C.accentSoft;
            return (React.createElement(Card, { key: s.id, lift: true },
                React.createElement("div", { className: "flex items-start justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex items-center gap-1.5 mb-1.5 flex-wrap" },
                            React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { background: kindBg, color: kindColor } }, s.kind),
                            s.category && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { border: `1px solid ${C.border}`, color: C.inkSoft } }, s.category),
                            s.owner && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { border: `1px solid ${C.border}`, color: C.inkSoft } }, s.owner)),
                        React.createElement("div", { className: "font-semibold" }, s.name),
                        s.provider && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, s.provider)),
                    React.createElement("div", { className: "flex" },
                        React.createElement(IconBtn, { onClick: () => startEdit(s), title: "\uC218\uC815" },
                            React.createElement(IconPencil, { size: 15 })),
                        React.createElement(IconBtn, { onClick: () => remove(s.id), title: "\uC0AD\uC81C", danger: true },
                            React.createElement(IconTrash, { size: 15 })))),
                React.createElement("div", { className: "mt-3 text-xl md:text-2xl font-semibold", style: { fontFamily: SERIF } },
                    formatWon(s.monthlyPremium),
                    React.createElement("span", { className: "text-xs font-normal ml-1", style: { color: C.muted } }, "/ \uC6D4")),
                info && !matured && (React.createElement("div", { className: "mt-3" },
                    React.createElement("div", { className: "flex justify-between text-xs mb-1", style: { color: C.muted } },
                        React.createElement("span", null, "\uB9CC\uAE30\uAE4C\uC9C0 \uC9C4\uD589\uB960"),
                        React.createElement("span", null,
                            "D-",
                            info.daysLeft)),
                    React.createElement("div", { className: "h-1.5 rounded-full overflow-hidden", style: { background: "#EFEAE0" } },
                        React.createElement("div", { className: "h-1.5 rounded-full", style: { width: `${info.pct}%`, background: kindColor, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" } })))),
                matured && (React.createElement("div", { className: "mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg", style: { background: C.accentSoft, color: C.accentDeep, animation: "celebratePulse 1.6s ease-in-out infinite" } },
                    React.createElement("span", { style: { fontSize: 16 } }, "\uD83C\uDF89"),
                    React.createElement("span", { className: "text-sm font-medium" }, "\uB9CC\uAE30 \uC644\uB8CC! \uC218\uACE0\uD558\uC168\uC5B4\uC694"),
                    React.createElement("span", { style: { fontSize: 16 } }, "\uD83C\uDF8A"))),
                s.fromAccountId && React.createElement("div", { className: "text-xs mt-2", style: { color: C.muted } },
                    accountName(s.fromAccountId),
                    "\uC5D0\uC11C \uCD9C\uAE08"),
                s.endDate && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                    "\uB9CC\uAE30\uC77C ",
                    s.endDate),
                s.memo && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, s.memo)));
        })))));
}
// ---------- 고정지출(통신비/관리비/구독 등) 섹션 ----------
function FixedExpenseSection({ fixedExpenses, setFixedExpenses, accounts }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { name: "", category: "", amount: "", dayOfMonth: "", fromAccountId: "", memo: "" };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (item) => { setForm({ ...empty, ...item }); setEditId(item.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("삭제할까요?"))
        setFixedExpenses((prev) => prev.filter((f) => f.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.name || !form.amount)
            return;
        const payload = { ...form, amount: Number(form.amount) };
        if (editId)
            setFixedExpenses((prev) => prev.map((f) => (f.id === editId ? { ...payload, id: editId } : f)));
        else
            setFixedExpenses((prev) => [{ ...payload, id: uid() }, ...prev]);
        setOpen(false);
    };
    const totalMonthly = fixedExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);
    const accountName = (id) => accounts.find((a) => a.id === id)?.name || "";
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement(Card, null,
            React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uCD1D \uC6D4 \uACE0\uC815\uC9C0\uCD9C"),
            React.createElement("div", { className: "text-lg md:text-xl font-semibold mt-1", style: { fontFamily: SERIF } }, formatWon(totalMonthly))),
        React.createElement("div", { className: "flex justify-end" },
            React.createElement(PrimaryBtn, { onClick: startAdd },
                React.createElement(IconPlus, { size: 16 }),
                " \uACE0\uC815\uC9C0\uCD9C \uCD94\uAC00")),
        open && (React.createElement(Card, null,
            React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" },
                React.createElement(Field, { label: "\uD56D\uBAA9\uBA85" },
                    React.createElement(TextInput, { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\uC608: \uD734\uB300\uD3F0 \uC694\uAE08" })),
                React.createElement(Field, { label: "\uBD84\uB958(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), placeholder: "\uC608: \uD1B5\uC2E0/\uAD6C\uB3C5/\uAD00\uB9AC\uBE44" })),
                React.createElement(Field, { label: "\uC6D4 \uAE08\uC561" },
                    React.createElement(MoneyInput, { required: true, value: form.amount, onChange: (v) => setForm({ ...form, amount: v }) })),
                React.createElement(Field, { label: "\uCD9C\uBC1C \uACC4\uC88C(\uC120\uD0DD)" },
                    React.createElement(SelectInput, { value: form.fromAccountId, onChange: (e) => setForm({ ...form, fromAccountId: e.target.value }) },
                        React.createElement("option", { value: "" }, "\uC120\uD0DD \uC548 \uD568"),
                        accounts.map((a) => React.createElement("option", { key: a.id, value: a.id },
                            a.owner ? `[${a.owner}] ` : "",
                            a.name)))),
                React.createElement(Field, { label: "\uB9E4\uC6D4 \uCD9C\uAE08\uC77C(\uC120\uD0DD)" },
                    React.createElement(SelectInput, { value: form.dayOfMonth, onChange: (e) => setForm({ ...form, dayOfMonth: e.target.value }) },
                        React.createElement("option", { value: "" }, "\uC120\uD0DD"),
                        Array.from({ length: 31 }, (_, i) => i + 1).map((d) => React.createElement("option", { key: d, value: d },
                            d,
                            "\uC77C")))),
                React.createElement(Field, { label: "\uBA54\uBAA8(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.memo, onChange: (e) => setForm({ ...form, memo: e.target.value }), placeholder: "\uC608: \uC790\uB3D9\uC774\uCCB4" })),
                React.createElement("div", { className: "sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1" },
                    React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                    React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
        fixedExpenses.length === 0 ? React.createElement(Card, null,
            React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uACE0\uC815\uC9C0\uCD9C\uC774 \uC5C6\uC5B4\uC694. \uD734\uB300\uD3F0 \uC694\uAE08, \uC778\uD130\uB137, \uAD6C\uB3C5 \uC11C\uBE44\uC2A4 \uB4F1\uC744 \uCD94\uAC00\uD574\uBCF4\uC138\uC694." })) : (React.createElement("div", { className: "grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" }, fixedExpenses.map((f) => (React.createElement(Card, { key: f.id, lift: true },
            React.createElement("div", { className: "flex items-start justify-between" },
                React.createElement("div", null,
                    f.category && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block mb-1.5", style: { background: "#EFEAE0", color: C.inkSoft } }, f.category),
                    React.createElement("div", { className: "font-semibold" }, f.name)),
                React.createElement("div", { className: "flex" },
                    React.createElement(IconBtn, { onClick: () => startEdit(f), title: "\uC218\uC815" },
                        React.createElement(IconPencil, { size: 15 })),
                    React.createElement(IconBtn, { onClick: () => remove(f.id), title: "\uC0AD\uC81C", danger: true },
                        React.createElement(IconTrash, { size: 15 })))),
            React.createElement("div", { className: "mt-3 text-xl md:text-2xl font-semibold", style: { fontFamily: SERIF } },
                formatWon(f.amount),
                React.createElement("span", { className: "text-xs font-normal ml-1", style: { color: C.muted } }, "/ \uC6D4")),
            f.fromAccountId && React.createElement("div", { className: "text-xs mt-2", style: { color: C.muted } },
                accountName(f.fromAccountId),
                "\uC5D0\uC11C \uCD9C\uAE08"),
            f.dayOfMonth && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } },
                "\uB9E4\uC6D4 ",
                f.dayOfMonth,
                "\uC77C"),
            f.memo && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, f.memo))))))));
}
// ---------- 고정지출관리 (보험/연금 + 고정지출을 전환하며 따로 관리) ----------
function FixedCostsTab({ insurances, setInsurances, fixedExpenses, setFixedExpenses, accounts }) {
    const [subTab, setSubTab] = useState("insurance");
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        React.createElement("div", { className: "flex gap-2" },
            React.createElement("button", { onClick: () => setSubTab("insurance"), className: "px-4 py-2 rounded-lg text-sm font-medium", style: { background: subTab === "insurance" ? C.ink : C.surface, color: subTab === "insurance" ? "#fff" : C.inkSoft, border: `1px solid ${subTab === "insurance" ? C.ink : C.border}` } }, "\uBCF4\uD5D8/\uC5F0\uAE08"),
            React.createElement("button", { onClick: () => setSubTab("fixed"), className: "px-4 py-2 rounded-lg text-sm font-medium", style: { background: subTab === "fixed" ? C.ink : C.surface, color: subTab === "fixed" ? "#fff" : C.inkSoft, border: `1px solid ${subTab === "fixed" ? C.ink : C.border}` } }, "\uACE0\uC815\uC9C0\uCD9C")),
        subTab === "insurance" && React.createElement(InsuranceSection, { insurances: insurances, setInsurances: setInsurances, accounts: accounts }),
        subTab === "fixed" && React.createElement(FixedExpenseSection, { fixedExpenses: fixedExpenses, setFixedExpenses: setFixedExpenses, accounts: accounts })));
}
// ---------- 생활비 예산관리 모달 ----------
function BudgetManageModal({ period, budgetObj, onSaveBudget, periodIncomeTx, addTransaction, deleteTransaction, onClose }) {
    const [total, setTotal] = useState(String(budgetObj.total || ""));
    const [incidental, setIncidental] = useState(String(budgetObj.incidental || ""));
    const [incForm, setIncForm] = useState({ date: todayStr(), amount: "", category: INCOME_CATS[0], memo: "" });
    const addIncome = (e) => {
        e.preventDefault();
        if (!incForm.amount)
            return;
        addTransaction({ ...incForm, type: "income", pocket: "living", amount: Number(incForm.amount) });
        setIncForm({ date: todayStr(), amount: "", category: INCOME_CATS[0], memo: "" });
    };
    return (React.createElement("div", { className: "fixed inset-0 flex items-center justify-center p-4 z-20", style: { background: "rgba(24,26,32,0.5)" } },
        React.createElement(Card, { style: { maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }, className: "w-full relative fade-in-up" },
            React.createElement("div", { className: "flex justify-between items-start mb-1" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs tracking-widest", style: { color: C.accent } }, "BUDGET"),
                    React.createElement("h3", { className: "text-lg font-semibold", style: { fontFamily: SERIF } },
                        periodLabel(period),
                        " \uC0DD\uD65C\uBE44 \uC608\uC0B0\uAD00\uB9AC")),
                React.createElement(IconBtn, { onClick: onClose },
                    React.createElement(IconX, { size: 16 }))),
            React.createElement("div", { className: "mt-4 grid sm:grid-cols-2 gap-3" },
                React.createElement(Field, { label: "\uC774\uBC88 \uACB0\uC0B0 \uC0DD\uD65C\uBE44 \uC608\uC0B0 (\uC804\uCCB4)" },
                    React.createElement(MoneyInput, { value: total, onChange: setTotal, placeholder: "0" })),
                React.createElement(Field, { label: "\uADF8 \uC911 \uD488\uC704\uC720\uC9C0\uBE44 (\uC120\uD0DD)" },
                    React.createElement(MoneyInput, { value: incidental, onChange: setIncidental, placeholder: "0" }))),
            React.createElement("p", { className: "text-xs mt-2", style: { color: C.muted } }, "\uD488\uC704\uC720\uC9C0\uBE44\uB294 \uC0DD\uD65C\uBE44\uC640 \uC644\uC804\uD788 \uBD84\uB9AC\uB41C \uBCC4\uB3C4 \uC9C0\uAC11\uC774\uC5D0\uC694. \uAC70\uB798 \uCD94\uAC00 \uD654\uBA74\uC758 \uC2AC\uB77C\uC774\uB4DC \uD1A0\uAE00\uB85C \uC9C0\uAC11\uC744 \uC120\uD0DD\uD558\uC138\uC694."),
            React.createElement("p", { className: "text-xs mt-1", style: { color: C.muted } }, "\uAE09\uC5EC\uB294 \uAC70\uB798 \uCD94\uAC00 \uD654\uBA74\uC5D0\uC11C \uAD6C\uBD84=\uC218\uC785/\uCE74\uD14C\uACE0\uB9AC=\uAE09\uC5EC\uB85C \uB4F1\uB85D\uD558\uBA74 \uB300\uC2DC\uBCF4\uB4DC\uC5D0 \uC790\uB3D9 \uC9D1\uACC4\uB3FC\uC694."),
            React.createElement("div", { className: "mt-5 pt-4", style: { borderTop: `1px dashed ${C.border}` } },
                React.createElement("div", { className: "text-sm font-medium mb-2" }, "\uC774\uBC88 \uACB0\uC0B0 \uC218\uC785 \uAD00\uB9AC"),
                React.createElement("form", { onSubmit: addIncome, className: "grid grid-cols-2 gap-2 mb-3" },
                    React.createElement(DateInput, { value: incForm.date, onChange: (v) => setIncForm({ ...incForm, date: v }) }),
                    React.createElement(MoneyInput, { value: incForm.amount, onChange: (v) => setIncForm({ ...incForm, amount: v }), placeholder: "\uAE08\uC561" }),
                    React.createElement(SelectInput, { value: incForm.category, onChange: (e) => setIncForm({ ...incForm, category: e.target.value }) }, INCOME_CATS.map((c) => React.createElement("option", { key: c }, c))),
                    React.createElement(TextInput, { value: incForm.memo, onChange: (e) => setIncForm({ ...incForm, memo: e.target.value }), placeholder: "\uBA54\uBAA8(\uC120\uD0DD)" }),
                    React.createElement("div", { className: "col-span-2 flex justify-end" },
                        React.createElement(PrimaryBtn, { type: "submit" },
                            React.createElement(IconPlus, { size: 14 }),
                            " \uC218\uC785 \uCD94\uAC00"))),
                periodIncomeTx.length === 0 ? React.createElement("div", { className: "text-xs", style: { color: C.muted } }, "\uB4F1\uB85D\uB41C \uC218\uC785\uC774 \uC5C6\uC5B4\uC694.") : (React.createElement("div", { className: "flex flex-col gap-1.5" }, periodIncomeTx.map((t) => (React.createElement("div", { key: t.id, className: "flex items-center justify-between text-sm py-1.5", style: { borderBottom: `1px solid ${C.border}` } },
                    React.createElement("div", { className: "flex items-center gap-2 min-w-0" },
                        React.createElement("span", { className: "text-xs shrink-0", style: { color: C.muted } }, t.date?.slice(5)),
                        React.createElement("span", { className: "truncate" },
                            t.category,
                            t.memo ? ` · ${t.memo}` : "")),
                    React.createElement("div", { className: "flex items-center gap-2 shrink-0" },
                        React.createElement("span", { style: { color: C.positive, fontFamily: SERIF } }, formatWon(t.amount)),
                        React.createElement(IconBtn, { onClick: () => deleteTransaction(t.id), danger: true },
                            React.createElement(IconTrash, { size: 13 }))))))))),
            React.createElement("div", { className: "mt-5 flex justify-end gap-2" },
                React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uB2EB\uAE30"),
                React.createElement(PrimaryBtn, { onClick: () => { onSaveBudget({ total: Number(total) || 0, incidental: Number(incidental) || 0 }); onClose(); } }, "\uC608\uC0B0 \uC800\uC7A5")))));
}
// ---------- 카드 내역 일괄 검토 모달 ----------
function BatchReviewModal({ items, onConfirm, onClose }) {
    const [rows, setRows] = useState(items.map((it) => {
        const type = it.type === "income" ? "income" : "expense";
        const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
        return {
            id: uid(),
            date: it.date || todayStr(),
            amount: it.amount != null ? String(it.amount) : "",
            merchant: it.merchant || "",
            type,
            category: cats.includes(it.category) ? it.category : cats[0],
            include: true,
        };
    }));
    const updateRow = (id, patch) => setRows((prev) => prev.map((r) => {
        if (r.id !== id)
            return r;
        const merged = { ...r, ...patch };
        if (patch.type && patch.type !== r.type) {
            const cats = patch.type === "income" ? INCOME_CATS : EXPENSE_CATS;
            if (!cats.includes(merged.category))
                merged.category = cats[0];
        }
        return merged;
    }));
    const toggleAll = (val) => setRows((prev) => prev.map((r) => ({ ...r, include: val })));
    const includedCount = rows.filter((r) => r.include).length;
    const confirm = () => {
        const toAdd = rows.filter((r) => r.include && r.amount).map((r) => ({ date: r.date, type: r.type, pocket: "living", category: r.category, amount: Number(r.amount) || 0, memo: r.merchant }));
        onConfirm(toAdd);
    };
    return (React.createElement("div", { className: "fixed inset-0 flex items-center justify-center p-4 z-20", style: { background: "rgba(24,26,32,0.5)" } },
        React.createElement(Card, { style: { maxWidth: 780, maxHeight: "88vh", overflowY: "auto" }, className: "w-full relative fade-in-up" },
            React.createElement("div", { className: "flex justify-between items-start mb-3" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs tracking-widest", style: { color: C.accent } }, "BATCH IMPORT"),
                    React.createElement("h3", { className: "text-lg font-semibold", style: { fontFamily: SERIF } },
                        "\uCE74\uB4DC \uB0B4\uC5ED \uC77C\uAD04 \uD655\uC778 (",
                        rows.length,
                        "\uAC74 \uC778\uC2DD)")),
                React.createElement(IconBtn, { onClick: onClose },
                    React.createElement(IconX, { size: 16 }))),
            React.createElement("p", { className: "text-xs mb-3", style: { color: C.muted } }, "\uC77C\uAD04 \uC778\uC2DD\uB41C \uD56D\uBAA9\uC740 \uBAA8\uB450 \uC0DD\uD65C\uBE44 \uC9C0\uAC11\uC73C\uB85C \uB4E4\uC5B4\uAC00\uC694. \uD488\uC704\uC720\uC9C0\uBE44\uB85C \uC62E\uAE30\uB824\uBA74 \uCD94\uAC00 \uD6C4 \uAC70\uB798\uB0B4\uC5ED\uC5D0\uC11C \uC218\uC815\uD574\uC8FC\uC138\uC694."),
            React.createElement("div", { className: "flex gap-3 mb-3" },
                React.createElement("button", { onClick: () => toggleAll(true), className: "text-xs", style: { color: C.accent } }, "\uC804\uCCB4 \uC120\uD0DD"),
                React.createElement("button", { onClick: () => toggleAll(false), className: "text-xs", style: { color: C.muted } }, "\uC804\uCCB4 \uD574\uC81C")),
            React.createElement("div", { className: "flex flex-col gap-2" }, rows.map((r) => (React.createElement("div", { key: r.id, className: "flex items-center gap-2 p-2 rounded-lg flex-wrap", style: { background: r.include ? (r.type === "income" ? C.positiveSoft : "#FAF9F6") : "transparent", opacity: r.include ? 1 : 0.45, border: `1px solid ${r.type === "income" && r.include ? C.positive : C.border}` } },
                React.createElement("input", { type: "checkbox", checked: r.include, onChange: (e) => updateRow(r.id, { include: e.target.checked }) }),
                React.createElement("div", { style: { width: 150 } },
                    React.createElement(DateInput, { value: r.date, onChange: (v) => updateRow(r.id, { date: v }) })),
                React.createElement(SelectInput, { value: r.type, onChange: (e) => updateRow(r.id, { type: e.target.value }), style: { width: 78, color: r.type === "income" ? C.positive : C.negative, fontWeight: 600 } },
                    React.createElement("option", { value: "expense" }, "\uC9C0\uCD9C"),
                    React.createElement("option", { value: "income" }, "\uC218\uC785")),
                React.createElement(TextInput, { value: r.merchant, onChange: (e) => updateRow(r.id, { merchant: e.target.value }), placeholder: "\uAC00\uB9F9\uC810", style: { flex: "1 1 130px", minWidth: 110 } }),
                React.createElement(SelectInput, { value: r.category, onChange: (e) => updateRow(r.id, { category: e.target.value }), style: { width: 116 } }, (r.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => React.createElement("option", { key: c }, c))),
                React.createElement(MoneyInput, { value: r.amount, onChange: (v) => updateRow(r.id, { amount: v }), style: { width: 110 } }))))),
            React.createElement("div", { className: "flex justify-end gap-2 mt-4" },
                React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                React.createElement(PrimaryBtn, { onClick: confirm },
                    "\uC120\uD0DD\uD55C ",
                    includedCount,
                    "\uAC74 \uCD94\uAC00")))));
}
// ---------- 생활비관리 ----------
function ExpensesTab({ transactions, addTransaction, addTransactions, deleteTransaction, updateTransaction, cfg, onOpenSettings, budgets, setBudgetForPeriod }) {
    const [period, setPeriod] = useState(() => getCurrentPeriod());
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const empty = { date: todayStr(), type: "expense", pocket: "living", category: EXPENSE_CATS[0], amount: "", memo: "", owner: "" };
    const [form, setForm] = useState(empty);
    const [editingTxId, setEditingTxId] = useState(null);
    const [ocrBusy, setOcrBusy] = useState(false);
    const [ocrError, setOcrError] = useState(null);
    const [ocrSuccess, setOcrSuccess] = useState(false);
    const [batchBusy, setBatchBusy] = useState(false);
    const [batchError, setBatchError] = useState(null);
    const [batchItems, setBatchItems] = useState(null);
    const fileInputRef = useRef(null);
    const batchInputRef = useRef(null);
    const ownerNames = useMemo(() => Array.from(new Set(transactions.map((t) => t.owner).filter(Boolean))), [transactions]);
    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file)
            return;
        setOcrBusy(true);
        setOcrError(null);
        setOcrSuccess(false);
        try {
            if (!cfg.geminiKey) {
                setOcrError("설정(⚙)에서 Gemini API 키를 먼저 입력해주세요.");
                setOcrBusy(false);
                if (fileInputRef.current)
                    fileInputRef.current.value = "";
                return;
            }
            const { base64, mimeType } = await fileToResizedBase64(file);
            const rawText = await callGeminiWithRetry(cfg.geminiKey, GEMINI_MODEL, buildReceiptPrompt(todayStr()), base64, mimeType);
            const ex = JSON.parse(extractJsonFromText(rawText, "{", "}"));
            const exType = ex.type === "income" ? "income" : "expense";
            const cats = exType === "income" ? INCOME_CATS : EXPENSE_CATS;
            setForm((f) => ({ ...f, type: exType, pocket: "living", date: ex.date || f.date, amount: ex.amount != null ? String(ex.amount) : f.amount, memo: ex.merchant || f.memo, category: cats.includes(ex.category) ? ex.category : cats[0] }));
            setOcrSuccess(true);
        }
        catch (err) {
            if (err.name === "AbortError")
                setOcrError("요청 시간 초과 - 다시 시도해주세요.");
            else
                setOcrError("인식 실패: " + err.message);
        }
        finally {
            setOcrBusy(false);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
        }
    };
    const handleBatchUpload = async (e) => {
        const file = e.target.files[0];
        if (!file)
            return;
        setBatchBusy(true);
        setBatchError(null);
        try {
            if (!cfg.geminiKey) {
                setBatchError("설정(⚙)에서 Gemini API 키를 먼저 입력해주세요.");
                setBatchBusy(false);
                if (batchInputRef.current)
                    batchInputRef.current.value = "";
                return;
            }
            const { base64, mimeType } = await fileToResizedBase64(file, 1800, 0.85);
            const rawText = await callGeminiWithRetry(cfg.geminiKey, GEMINI_MODEL, buildBatchPrompt(todayStr()), base64, mimeType);
            let arr = JSON.parse(extractJsonFromText(rawText, "[", "]"));
            arr = Array.isArray(arr) ? arr : [arr];
            if (arr.length === 0)
                throw new Error("화면에서 거래를 찾지 못했어요. 사진을 다시 확인해주세요.");
            setBatchItems(arr);
        }
        catch (err) {
            if (err.name === "AbortError")
                setBatchError("일괄 인식 실패: 요청 시간 초과 - 다시 시도해주세요.");
            else
                setBatchError("일괄 인식 실패: " + err.message);
        }
        finally {
            setBatchBusy(false);
            if (batchInputRef.current)
                batchInputRef.current.value = "";
        }
    };
    const startEditTx = (t) => {
        setEditingTxId(t.id);
        setForm({ date: t.date, type: t.type, pocket: txPocket(t), category: t.category, amount: String(t.amount), memo: t.memo || "", owner: t.owner || "" });
    };
    const cancelEditTx = () => { setEditingTxId(null); setForm(empty); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.amount)
            return;
        if (editingTxId) {
            updateTransaction(editingTxId, { ...form, amount: Number(form.amount) });
            setEditingTxId(null);
        }
        else {
            addTransaction({ ...form, amount: Number(form.amount) });
        }
        setForm({ ...empty, type: form.type, pocket: form.pocket, category: form.type === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] });
        setOcrSuccess(false);
    };
    const periodTx = useMemo(() => txInPeriod(transactions, period).sort((a, b) => b.date.localeCompare(a.date)), [transactions, period]);
    const periodIncomeTx = useMemo(() => periodTx.filter((t) => t.type === "income"), [periodTx]);
    const periodSalaryTx = useMemo(() => periodTx.filter((t) => t.type === "income" && t.category === "급여"), [periodTx]);
    const income = periodIncomeTx.reduce((s, t) => s + Number(t.amount), 0);
    const expense = periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const livingExpense = periodTx.filter((t) => t.type === "expense" && txPocket(t) !== "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalExpense = periodTx.filter((t) => t.type === "expense" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const incidentalIncome = periodTx.filter((t) => t.type === "income" && txPocket(t) === "incidental").reduce((s, t) => s + Number(t.amount), 0);
    const budgetObj = getBudgetObj(budgets, period);
    const remaining = budgetObj.total - livingExpense;
    const incidentalRemaining = budgetObj.incidental - incidentalExpense + incidentalIncome;
    const chartData = EXPENSE_CATS.map((cat) => ({ name: cat, value: periodTx.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + Number(t.amount), 0) })).filter((d) => d.value > 0);
    const isSettlementDay = new Date().getDate() === 15;
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6" },
        isSettlementDay && (React.createElement("div", { className: "rounded-xl px-4 py-3 text-sm flex items-center justify-between flex-wrap gap-2", style: { background: C.accentSoft, color: C.accentDeep } },
            React.createElement("span", null, "\uC624\uB298\uC740 \uACB0\uC0B0\uC77C\uC774\uC5D0\uC694 \u2014 \uC774\uBC88\uB2EC \uC0DD\uD65C\uBE44 \uC608\uC0B0\uACFC \uC218\uC785\uC744 \uD655\uC778\uD574\uBCF4\uC138\uC694."),
            React.createElement("button", { onClick: () => setShowBudgetModal(true), className: "text-xs font-medium underline shrink-0" }, "\uC124\uC815\uD558\uAE30"))),
        React.createElement(Card, { lift: true, style: { borderColor: remaining < 0 ? C.negative : C.border } },
            React.createElement("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2" },
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement(IconBtn, { onClick: () => setPeriod(shiftPeriod(period, -1)), title: "\uC774\uC804 \uACB0\uC0B0" },
                        React.createElement(IconChevronLeft, { size: 16 })),
                    React.createElement("div", { className: "text-sm md:text-base font-medium", style: { fontFamily: SERIF } },
                        periodLabel(period),
                        " \uACB0\uC0B0"),
                    React.createElement(IconBtn, { onClick: () => setPeriod(shiftPeriod(period, 1)), title: "\uB2E4\uC74C \uACB0\uC0B0" },
                        React.createElement(IconChevronRight, { size: 16 }))),
                React.createElement("button", { onClick: () => setShowBudgetModal(true), className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium", style: { background: C.accentSoft, color: C.accentDeep } },
                    React.createElement(IconSettings, { size: 13 }),
                    " \uC774\uBC88\uB2EC \uC0DD\uD65C\uBE44 \uC608\uC0B0\uAD00\uB9AC")),
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uC0DD\uD65C\uBE44 \uC794\uACE0"),
                    React.createElement("div", { className: "text-2xl md:text-3xl font-semibold mt-1", style: { fontFamily: SERIF, color: remaining >= 0 ? C.positive : C.negative } }, formatWon(remaining)),
                    budgetObj.total > 0 && (React.createElement("div", { className: "mt-2" },
                        React.createElement(BudgetBar, { spent: livingExpense, budget: budgetObj.total }),
                        React.createElement("div", { className: "text-xs mt-1", style: { color: C.muted } },
                            formatWon(livingExpense),
                            " / ",
                            formatWon(budgetObj.total),
                            " \uC0AC\uC6A9"))),
                    budgetObj.total === 0 && React.createElement("div", { className: "text-xs mt-2", style: { color: C.muted } }, "\uC608\uC0B0\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.")),
                React.createElement("div", null,
                    React.createElement("div", { className: "text-xs md:text-sm", style: { color: C.muted } }, "\uD488\uC704\uC720\uC9C0\uBE44 \uC794\uACE0"),
                    React.createElement("div", { className: "text-2xl md:text-3xl font-semibold mt-1", style: { fontFamily: SERIF, color: incidentalRemaining >= 0 ? C.accent : C.negative } }, formatWon(incidentalRemaining)),
                    budgetObj.incidental > 0 && (React.createElement("div", { className: "mt-2" },
                        React.createElement(BudgetBar, { spent: incidentalExpense, budget: budgetObj.incidental }),
                        React.createElement("div", { className: "text-xs mt-1", style: { color: C.muted } },
                            formatWon(incidentalExpense),
                            " / ",
                            formatWon(budgetObj.incidental),
                            " \uC0AC\uC6A9",
                            incidentalIncome > 0 ? ` (+${formatWon(incidentalIncome)} 입금)` : ""))),
                    budgetObj.incidental === 0 && React.createElement("div", { className: "text-xs mt-2", style: { color: C.muted } }, "\uC608\uC0B0\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.")))),
        periodSalaryTx.length > 0 && (React.createElement(Card, null,
            React.createElement(SectionTitle, null, "\uC774\uBC88 \uACB0\uC0B0 \uAE09\uC5EC \uB0B4\uC5ED"),
            React.createElement("div", { className: "flex flex-col gap-2" }, periodSalaryTx.map((t) => (React.createElement("div", { key: t.id, className: "flex items-center justify-between p-2.5 rounded-lg flex-wrap gap-2", style: { background: "#FAF9F6", border: `1px solid ${C.border}` } },
                React.createElement("div", { className: "flex items-center gap-2 min-w-0 flex-wrap" },
                    React.createElement("span", { className: "text-xs shrink-0", style: { color: C.muted } }, t.date?.slice(5)),
                    t.owner && React.createElement("span", { className: "text-xs px-2 py-0.5 rounded-md shrink-0 font-medium", style: { background: C.positiveSoft, color: C.positive } }, t.owner),
                    t.memo && React.createElement("span", { className: "text-xs truncate", style: { color: C.muted } }, t.memo)),
                React.createElement("div", { className: "flex items-center gap-2 shrink-0" },
                    React.createElement("span", { className: "text-sm font-medium", style: { color: C.positive, fontFamily: SERIF } }, formatWon(t.amount)),
                    React.createElement(IconBtn, { onClick: () => startEditTx(t), title: "\uC218\uC815" },
                        React.createElement(IconPencil, { size: 13 })),
                    React.createElement(IconBtn, { onClick: () => deleteTransaction(t.id), title: "\uC0AD\uC81C", danger: true },
                        React.createElement(IconTrash, { size: 13 }))))))))),
        React.createElement(Card, null,
            React.createElement(SectionTitle, null, editingTxId ? "거래 수정" : "거래 추가"),
            React.createElement("datalist", { id: "tx-owner-suggestions" }, ownerNames.map((o) => React.createElement("option", { key: o, value: o }))),
            React.createElement("div", { className: "mb-4 pb-4 flex items-center gap-3 flex-wrap", style: { borderBottom: `1px dashed ${C.border}` } },
                React.createElement("label", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 hover:opacity-90", style: { background: C.accentSoft, color: C.accentDeep } },
                    React.createElement(IconCamera, { size: 16 }),
                    " \uC601\uC218\uC99D \uD55C \uAC74 \uC790\uB3D9 \uC785\uB825",
                    React.createElement("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleReceiptUpload, style: { display: "none" }, disabled: ocrBusy })),
                React.createElement("label", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 hover:opacity-90", style: { background: "#EFEAE0", color: C.inkSoft } },
                    React.createElement(IconList, { size: 16 }),
                    " \uCE74\uB4DC \uB0B4\uC5ED \uC77C\uAD04 \uC785\uB825",
                    React.createElement("input", { ref: batchInputRef, type: "file", accept: "image/*", onChange: handleBatchUpload, style: { display: "none" }, disabled: batchBusy })),
                !cfg.geminiKey && (React.createElement("button", { onClick: onOpenSettings, className: "text-xs underline", style: { color: C.accent } }, "Gemini API \uD0A4 \uC124\uC815\uD558\uAE30")),
                (ocrBusy || batchBusy) && React.createElement("span", { className: "text-xs flex items-center gap-1.5", style: { color: C.muted } },
                    React.createElement(IconRefresh, { size: 12, style: { animation: "spin 0.8s linear infinite" } }),
                    " AI \uBD84\uC11D \uC911... (\uD63C\uC7A1 \uC2DC \uC790\uB3D9 \uC7AC\uC2DC\uB3C4)"),
                ocrError && React.createElement("span", { className: "text-xs", style: { color: C.negative } }, ocrError),
                batchError && React.createElement("div", { className: "text-xs w-full mt-2 p-3 rounded-lg", style: { color: C.negative, background: C.negativeSoft, wordBreak: "break-word", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 11 } }, batchError),
                ocrSuccess && !ocrBusy && React.createElement("span", { className: "text-xs", style: { color: C.positive } }, "\uC790\uB3D9 \uC785\uB825 \uC644\uB8CC \u2014 \uD655\uC778 \uD6C4 \uCD94\uAC00\uB97C \uB20C\uB7EC\uC8FC\uC138\uC694")),
            React.createElement("div", { className: "mb-3", style: { maxWidth: 320 } },
                React.createElement(PocketToggle, { value: form.pocket, onChange: (v) => setForm({ ...form, pocket: v }) })),
            React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-6 gap-3" },
                React.createElement(Field, { label: "\uB0A0\uC9DC" },
                    React.createElement(DateInput, { value: form.date, onChange: (v) => setForm({ ...form, date: v }) })),
                React.createElement(Field, { label: "\uAD6C\uBD84" },
                    React.createElement(SelectInput, { value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] }) },
                        React.createElement("option", { value: "expense" }, "\uC9C0\uCD9C"),
                        React.createElement("option", { value: "income" }, "\uC218\uC785"))),
                React.createElement(Field, { label: "\uCE74\uD14C\uACE0\uB9AC" },
                    React.createElement(SelectInput, { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }) }, (form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => React.createElement("option", { key: c }, c)))),
                React.createElement(Field, { label: "\uAE08\uC561" },
                    React.createElement(MoneyInput, { required: true, value: form.amount, onChange: (v) => setForm({ ...form, amount: v }), placeholder: "0" })),
                React.createElement(Field, { label: "\uBC1B\uB294/\uC4F0\uB294 \uC0AC\uB78C(\uC120\uD0DD)" },
                    React.createElement(TextInput, { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), placeholder: "\uC608: \uBCF8\uC778", list: "tx-owner-suggestions" })),
                React.createElement(Field, { label: "\uBA54\uBAA8" },
                    React.createElement(TextInput, { value: form.memo, onChange: (e) => setForm({ ...form, memo: e.target.value }), placeholder: "\uC120\uD0DD \uC785\uB825" })),
                React.createElement("div", { className: "sm:col-span-2 lg:col-span-6 flex justify-end gap-2" },
                    editingTxId && React.createElement("button", { type: "button", onClick: cancelEditTx, className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                    React.createElement(PrimaryBtn, { type: "submit" }, editingTxId ? React.createElement(React.Fragment, null,
                        React.createElement(IconCheck, { size: 16 }),
                        " \uC218\uC815 \uC644\uB8CC") : React.createElement(React.Fragment, null,
                        React.createElement(IconPlus, { size: 16 }),
                        " \uCD94\uAC00"))))),
        React.createElement("div", { className: "text-sm", style: { color: C.muted } },
            "\uC218\uC785 ",
            React.createElement("span", { style: { color: C.positive, fontWeight: 600 } }, formatWon(income)),
            " \u00B7 \uC9C0\uCD9C ",
            React.createElement("span", { style: { color: C.negative, fontWeight: 600 } }, formatWon(expense))),
        chartData.length > 0 && (React.createElement(Card, null,
            React.createElement(SectionTitle, null, "\uCE74\uD14C\uACE0\uB9AC\uBCC4 \uC9C0\uCD9C"),
            React.createElement(SimpleBarChart, { data: chartData }))),
        React.createElement(Card, null,
            React.createElement(SectionTitle, null,
                periodLabel(period),
                " \uAC70\uB798 \uB0B4\uC5ED"),
            periodTx.length === 0 ? React.createElement(Empty, { text: "\uC774 \uACB0\uC0B0 \uAE30\uAC04\uC758 \uAC70\uB798 \uB0B4\uC5ED\uC774 \uC5C6\uC5B4\uC694." }) : (React.createElement("div", { className: "flex flex-col" }, periodTx.map((t) => {
                const pocket = txPocket(t);
                return (React.createElement("div", { key: t.id, className: "flex items-center justify-between py-2.5", style: { borderBottom: `1px solid ${C.border}`, background: editingTxId === t.id ? C.accentSoft : "transparent" } },
                    React.createElement("div", { className: "flex items-center gap-2 min-w-0 flex-wrap" },
                        React.createElement("div", { className: "text-xs shrink-0", style: { color: C.muted, width: 44 } }, t.date?.slice(5)),
                        React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md shrink-0", style: { background: t.type === "income" ? C.positiveSoft : C.negativeSoft, color: t.type === "income" ? C.positive : C.negative } }, t.category),
                        pocket === "incidental" && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md shrink-0 font-medium", style: { background: C.accentSoft, color: C.accentDeep } }, "\uD488\uC704\uC720\uC9C0\uBE44"),
                        t.owner && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md shrink-0", style: { border: `1px solid ${C.border}`, color: C.inkSoft } }, t.owner),
                        React.createElement("div", { className: "text-sm truncate", style: { color: C.muted } }, t.memo)),
                    React.createElement("div", { className: "flex items-center gap-2 shrink-0" },
                        React.createElement("div", { className: "text-sm font-medium", style: { color: t.type === "income" ? C.positive : C.negative, fontFamily: SERIF } },
                            t.type === "income" ? "+" : "-",
                            formatWon(t.amount)),
                        React.createElement(IconBtn, { onClick: () => startEditTx(t), title: "\uC218\uC815" },
                            React.createElement(IconPencil, { size: 14 })),
                        React.createElement(IconBtn, { onClick: () => deleteTransaction(t.id), title: "\uC0AD\uC81C", danger: true },
                            React.createElement(IconTrash, { size: 14 })))));
            })))),
        showBudgetModal && React.createElement(BudgetManageModal, { period: period, budgetObj: budgetObj, onSaveBudget: (obj) => setBudgetForPeriod(period, obj), periodIncomeTx: periodIncomeTx, addTransaction: addTransaction, deleteTransaction: deleteTransaction, onClose: () => setShowBudgetModal(false) }),
        batchItems && React.createElement(BatchReviewModal, { items: batchItems, onConfirm: (txs) => { addTransactions(txs); setBatchItems(null); }, onClose: () => setBatchItems(null) })));
}
// ---------- 일정관리 ----------
function CalendarTab({ events, setEvents }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selected, setSelected] = useState(todayStr());
    const [title, setTitle] = useState("");
    const [memo, setMemo] = useState("");
    const [recurrence, setRecurrence] = useState("none");
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++)
        cells.push(null);
    for (let d = 1; d <= days; d++)
        cells.push(d);
    const dateStr2 = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const prevMonth = () => { if (month === 0) {
        setYear(year - 1);
        setMonth(11);
    }
    else
        setMonth(month - 1); };
    const nextMonth = () => { if (month === 11) {
        setYear(year + 1);
        setMonth(0);
    }
    else
        setMonth(month + 1); };
    const addEvent = (e) => {
        e.preventDefault();
        if (!title)
            return;
        setEvents((prev) => [...prev, { id: uid(), date: selected, title, memo, recurrence }]);
        setTitle("");
        setMemo("");
        setRecurrence("none");
    };
    const removeEvent = (ev) => {
        if (ev.recurrence && ev.recurrence !== "none") {
            if (!window.confirm("정기 일정입니다. 삭제하면 모든 반복 일정이 사라집니다. 삭제할까요?"))
                return;
        }
        setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    };
    const selectedEvents = useMemo(() => eventsForDate(events, parseDateStr(selected)), [events, selected]);
    const selectedHoliday = KR_HOLIDAYS[selected];
    const recurLabel = { weekly: "매주", monthly: "매월", yearly: "매년" };
    return (React.createElement("div", { className: "grid lg:grid-cols-3 gap-5 md:gap-6" },
        React.createElement(Card, { className: "lg:col-span-2" },
            React.createElement("div", { className: "flex items-center justify-between mb-4" },
                React.createElement("div", { className: "font-semibold", style: { fontFamily: SERIF, fontSize: 20 } },
                    year,
                    "\uB144 ",
                    month + 1,
                    "\uC6D4"),
                React.createElement("div", { className: "flex gap-1" },
                    React.createElement(IconBtn, { onClick: prevMonth },
                        React.createElement(IconChevronLeft, { size: 18 })),
                    React.createElement(IconBtn, { onClick: nextMonth },
                        React.createElement(IconChevronRight, { size: 18 })))),
            React.createElement("div", { className: "grid grid-cols-7 text-center text-xs mb-2", style: { color: C.muted } }, ["일", "월", "화", "수", "목", "금", "토"].map((d) => React.createElement("div", { key: d }, d))),
            React.createElement("div", { className: "grid grid-cols-7 gap-1" }, cells.map((d, i) => {
                if (d === null)
                    return React.createElement("div", { key: i });
                const ds = dateStr2(d);
                const isToday = ds === todayStr();
                const isSel = ds === selected;
                const dateObj = new Date(year, month, d);
                const dayEvents = eventsForDate(events, dateObj);
                const holiday = KR_HOLIDAYS[ds];
                const firstEvent = dayEvents[0];
                const extraCount = dayEvents.length - 1;
                const firstIsRecurring = firstEvent && firstEvent.recurrence && firstEvent.recurrence !== "none";
                return (React.createElement("button", { key: i, onClick: () => setSelected(ds), className: "rounded-lg flex flex-col items-center pt-1 px-0.5 pb-1 text-sm relative overflow-hidden", style: {
                        minHeight: 62,
                        background: isSel ? C.ink : isToday ? C.accentSoft : "transparent",
                        color: isSel ? "#fff" : holiday ? C.negative : C.ink,
                        fontWeight: holiday ? 700 : 400,
                        border: isToday && !isSel ? `1px solid ${C.accent}` : "1px solid transparent",
                    } },
                    React.createElement("span", null, d),
                    React.createElement("div", { className: "w-full flex flex-col gap-0.5 mt-0.5" },
                        holiday && (React.createElement("span", { className: "text-[8px] leading-tight truncate w-full px-0.5", style: { color: isSel ? "#FBD5CC" : C.negative } }, holiday)),
                        firstEvent && (React.createElement("span", { className: "text-[8px] leading-tight truncate w-full px-1 rounded-sm", style: {
                                background: isSel ? "rgba(255,255,255,0.18)" : firstIsRecurring ? C.positiveSoft : C.accentSoft,
                                color: isSel ? "#fff" : firstIsRecurring ? C.positive : C.accent,
                            } }, firstEvent.title)),
                        extraCount > 0 && (React.createElement("span", { className: "text-[8px] leading-tight", style: { color: isSel ? "rgba(255,255,255,0.7)" : C.muted } },
                            "+",
                            extraCount,
                            "\uAC1C \uB354")))));
            })),
            React.createElement("div", { className: "flex items-center gap-4 mt-4 text-xs flex-wrap", style: { color: C.muted } },
                React.createElement("span", { className: "flex items-center gap-1.5" },
                    React.createElement("span", { className: "w-2 h-2 rounded-full", style: { background: C.accent } }),
                    "\uC77C\uC2DC \uC77C\uC815"),
                React.createElement("span", { className: "flex items-center gap-1.5" },
                    React.createElement("span", { className: "w-2 h-2 rounded-full", style: { background: C.positive } }),
                    "\uC815\uAE30 \uC77C\uC815"),
                React.createElement("span", { className: "flex items-center gap-1.5", style: { color: C.negative } }, "\u25A0 \uACF5\uD734\uC77C"))),
        React.createElement(Card, null,
            React.createElement(SectionTitle, null,
                selected,
                " \uC77C\uC815"),
            selectedHoliday && (React.createElement("div", { className: "mb-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2", style: { background: C.negativeSoft, color: C.negative } },
                "\uD83C\uDF8C ",
                selectedHoliday)),
            React.createElement("form", { onSubmit: addEvent, className: "flex flex-col gap-2 mb-4" },
                React.createElement(TextInput, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\uC77C\uC815 \uC81C\uBAA9", required: true }),
                React.createElement(SelectInput, { value: recurrence, onChange: (e) => setRecurrence(e.target.value) },
                    React.createElement("option", { value: "none" }, "\uBC18\uBCF5 \uC5C6\uC74C (\uC77C\uC2DC \uC77C\uC815)"),
                    React.createElement("option", { value: "weekly" }, "\uB9E4\uC8FC \uBC18\uBCF5"),
                    React.createElement("option", { value: "monthly" }, "\uB9E4\uC6D4 \uBC18\uBCF5"),
                    React.createElement("option", { value: "yearly" }, "\uB9E4\uB144 \uBC18\uBCF5")),
                React.createElement(TextInput, { value: memo, onChange: (e) => setMemo(e.target.value), placeholder: "\uBA54\uBAA8(\uC120\uD0DD)" }),
                React.createElement(PrimaryBtn, { type: "submit" },
                    React.createElement(IconPlus, { size: 16 }),
                    " ",
                    recurrence === "none" ? "일정 추가" : "정기일정 추가")),
            selectedEvents.length === 0 && !selectedHoliday ? React.createElement(Empty, { text: "\uC774 \uB0A0\uC9DC\uC5D0 \uC77C\uC815\uC774 \uC5C6\uC5B4\uC694." }) : (React.createElement("div", { className: "flex flex-col gap-2" }, selectedEvents.map((e) => {
                const rec = e.recurrence || "none";
                return (React.createElement("div", { key: e.id, className: "flex items-start justify-between gap-2 p-2.5 rounded-lg", style: { background: rec !== "none" ? C.positiveSoft : "#FAF9F6" } },
                    React.createElement("div", null,
                        React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" },
                            React.createElement("div", { className: "text-sm font-medium" }, e.title),
                            rec !== "none" && React.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded-full font-medium", style: { background: C.positive, color: "#fff" } }, recurLabel[rec])),
                        e.memo && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, e.memo)),
                    React.createElement(IconBtn, { onClick: () => removeEvent(e), danger: true },
                        React.createElement(IconTrash, { size: 14 }))));
            }))))));
}
// ---------- 할일 ----------
function TodoTab({ todos, setTodos }) {
    const [text, setText] = useState("");
    const [due, setDue] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({ text: "", due: "" });
    const add = (e) => { e.preventDefault(); if (!text)
        return; setTodos((prev) => [{ id: uid(), text, due, done: false }, ...prev]); setText(""); setDue(""); };
    const toggleDone = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    const remove = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));
    const toggleSelect = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    const selectedIds = Object.keys(selected).filter((id) => selected[id]);
    const bulkComplete = () => { setTodos((prev) => prev.map((t) => (selectedIds.includes(t.id) ? { ...t, done: true } : t))); setSelected({}); };
    const bulkDelete = () => { if (!window.confirm(`선택한 ${selectedIds.length}개 항목을 삭제할까요?`))
        return; setTodos((prev) => prev.filter((t) => !selectedIds.includes(t.id))); setSelected({}); };
    const startEdit = (t) => { setEditingId(t.id); setEditDraft({ text: t.text, due: t.due || "" }); };
    const saveEdit = () => { setTodos((prev) => prev.map((t) => (t.id === editingId ? { ...t, text: editDraft.text, due: editDraft.due } : t))); setEditingId(null); };
    const filtered = todos.filter((t) => (filter === "active" ? !t.done : filter === "done" ? t.done : true));
    return (React.createElement("div", { className: "flex flex-col gap-5 md:gap-6 max-w-3xl" },
        React.createElement(Card, null,
            React.createElement("form", { onSubmit: add, className: "flex flex-col sm:flex-row gap-2" },
                React.createElement(TextInput, { value: text, onChange: (e) => setText(e.target.value), placeholder: "\uD560\uC77C\uC744 \uC785\uB825\uD558\uC138\uC694", required: true }),
                React.createElement(DateInput, { value: due, onChange: setDue, style: { maxWidth: 220 } }),
                React.createElement(PrimaryBtn, { type: "submit" },
                    React.createElement(IconPlus, { size: 16 }),
                    " \uCD94\uAC00"))),
        React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-2" },
            React.createElement("div", { className: "flex gap-2" }, [["all", "전체"], ["active", "진행중"], ["done", "완료"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setFilter(k), className: "px-3 py-1.5 rounded-full text-xs font-medium", style: { background: filter === k ? C.ink : C.surface, color: filter === k ? "#fff" : C.inkSoft, border: `1px solid ${filter === k ? C.ink : C.border}` } }, l)))),
            selectedIds.length > 0 && (React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-lg", style: { background: C.accentSoft } },
                React.createElement("span", { className: "text-xs", style: { color: C.accentDeep } },
                    selectedIds.length,
                    "\uAC1C \uC120\uD0DD\uB428"),
                React.createElement("button", { onClick: bulkComplete, className: "text-xs px-2.5 py-1 rounded-md", style: { background: C.positive, color: "#fff" } }, "\uC120\uD0DD \uC644\uB8CC"),
                React.createElement("button", { onClick: bulkDelete, className: "text-xs px-2.5 py-1 rounded-md", style: { background: C.negative, color: "#fff" } }, "\uC120\uD0DD \uC0AD\uC81C")))),
        React.createElement(Card, null, filtered.length === 0 ? React.createElement(Empty, { text: "\uD45C\uC2DC\uD560 \uD560\uC77C\uC774 \uC5C6\uC5B4\uC694." }) : (React.createElement("div", { className: "flex flex-col" }, filtered.map((t) => (React.createElement("div", { key: t.id, className: "flex items-center gap-3 py-2.5", style: { borderBottom: `1px solid ${C.border}` } },
            React.createElement("input", { type: "checkbox", checked: !!selected[t.id], onChange: () => toggleSelect(t.id), style: { width: 16, height: 16, accentColor: C.accent, flexShrink: 0 } }),
            editingId === t.id ? (React.createElement(React.Fragment, null,
                React.createElement(TextInput, { value: editDraft.text, onChange: (e) => setEditDraft({ ...editDraft, text: e.target.value }), className: "flex-1" }),
                React.createElement(DateInput, { value: editDraft.due, onChange: (v) => setEditDraft({ ...editDraft, due: v }), style: { maxWidth: 200 } }),
                React.createElement(IconBtn, { onClick: saveEdit, title: "\uC800\uC7A5" },
                    React.createElement(IconCheck, { size: 15 })),
                React.createElement(IconBtn, { onClick: () => setEditingId(null), title: "\uCDE8\uC18C" },
                    React.createElement(IconX, { size: 15 })))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("div", { className: "text-sm truncate", style: { textDecoration: t.done ? "line-through" : "none", color: t.done ? C.muted : C.ink } }, t.text),
                    t.due && React.createElement("div", { className: "text-xs", style: { color: C.muted } }, t.due)),
                React.createElement(IconBtn, { onClick: () => toggleDone(t.id), title: t.done ? "완료 취소" : "완료 처리", style: { color: t.done ? C.positive : C.inkSoft } },
                    React.createElement(IconCheck, { size: 15 })),
                React.createElement(IconBtn, { onClick: () => startEdit(t), title: "\uC218\uC815" },
                    React.createElement(IconPencil, { size: 15 })),
                React.createElement(IconBtn, { onClick: () => remove(t.id), title: "\uC0AD\uC81C", danger: true },
                    React.createElement(IconTrash, { size: 15 }))))))))))));
}
// ---------- 계좌 흐름 SVG 다이어그램 ----------
// 메인 통장(급여통장)별로 선 색상을 다르게 표시해서 어느 통장에서 시작된 흐름인지 구분하기 쉽게 함.
// 메인 통장(레벨 0)은 세로 간격을 넓게 배치. 크로싱 최소화를 위한 barycenter 정렬 + 직각 라우팅 사용.
const ROOT_PALETTE = ["#B4842E", "#3B6EA8", "#8B5FBF", "#C2574F", "#4C8C6B", "#B0793D"];
function AccountFlowDiagram({ accounts, transfers, insurances, fixedExpenses, savings }) {
    const mainIds = useMemo(() => accounts.filter((a) => a.isMain).map((a) => a.id), [accounts]);
    // 1) BFS 레벨 계산 + 각 노드가 어느 메인 통장(root)에서 뻗어나왔는지 추적
    const { levels, rootOf } = useMemo(() => {
        const adj = {};
        accounts.forEach((a) => { adj[a.id] = []; });
        transfers.forEach((t) => {
            if (adj[t.fromAccountId] && adj[t.toAccountId]) {
                adj[t.fromAccountId].push(t.toAccountId);
                adj[t.toAccountId].push(t.fromAccountId);
            }
        });
        const lv = {}, root = {};
        const queue = [];
        mainIds.forEach((id) => { lv[id] = 0; root[id] = id; queue.push(id); });
        while (queue.length) {
            const cur = queue.shift();
            (adj[cur] || []).forEach((n) => { if (lv[n] === undefined) {
                lv[n] = lv[cur] + 1;
                root[n] = root[cur];
                queue.push(n);
            } });
        }
        const maxLv = Math.max(0, ...Object.values(lv));
        accounts.forEach((a) => { if (lv[a.id] === undefined) {
            lv[a.id] = maxLv + 1;
            root[a.id] = null;
        } });
        return { levels: lv, rootOf: root };
    }, [accounts, transfers, mainIds]);
    const rootColorMap = useMemo(() => {
        const map = {};
        mainIds.forEach((id, i) => { map[id] = ROOT_PALETTE[i % ROOT_PALETTE.length]; });
        return map;
    }, [mainIds]);
    const colorForRoot = (rootId) => (rootId && rootColorMap[rootId]) ? rootColorMap[rootId] : C.inkSoft;
    const markerIdForRoot = (rootId) => {
        const idx = mainIds.indexOf(rootId);
        return idx >= 0 ? `arrowRoot${idx}` : "arrowMuted";
    };
    // 2) 말단 항목: 보험/연금, 고정지출, 적금 월납입
    const leafItems = useMemo(() => {
        const insLeaves = (insurances || []).filter((i) => i.fromAccountId && levels[i.fromAccountId] !== undefined).map((i) => ({
            id: "ins-" + i.id, name: i.name, sub: i.kind, amount: Number(i.monthlyPremium || 0), dayOfMonth: "", fromAccountId: i.fromAccountId, kind: "insurance",
        }));
        const fixLeaves = (fixedExpenses || []).filter((f) => f.fromAccountId && levels[f.fromAccountId] !== undefined).map((f) => ({
            id: "fix-" + f.id, name: f.name, sub: f.category || "고정지출", amount: Number(f.amount || 0), dayOfMonth: f.dayOfMonth || "", fromAccountId: f.fromAccountId, kind: "fixed",
        }));
        const savLeaves = (savings || []).filter((s) => s.type === "적금" && s.fromAccountId && Number(s.monthlyDeposit) > 0 && levels[s.fromAccountId] !== undefined).map((s) => ({
            id: "sav-" + s.id, name: s.name, sub: "적금", amount: Number(s.monthlyDeposit || 0), dayOfMonth: "", fromAccountId: s.fromAccountId, kind: "savings",
        }));
        return [...insLeaves, ...fixLeaves, ...savLeaves];
    }, [insurances, fixedExpenses, savings, levels]);
    // 3) 레벨별 노드 그룹
    const byLevelRaw = {};
    accounts.forEach((a) => { const l = levels[a.id]; (byLevelRaw[l] = byLevelRaw[l] || []).push(a.id); });
    leafItems.forEach((li) => { const l = levels[li.fromAccountId] + 1; (byLevelRaw[l] = byLevelRaw[l] || []).push(li.id); });
    const levelKeys = Object.keys(byLevelRaw).map(Number).sort((a, b) => a - b);
    // 4) 이전 레벨 이웃 목록 (barycenter 정렬용)
    const prevNeighbors = useMemo(() => {
        const map = {};
        accounts.forEach((a) => { map[a.id] = []; });
        leafItems.forEach((li) => { map[li.id] = [li.fromAccountId]; });
        transfers.forEach((t) => {
            const lf = levels[t.fromAccountId], lt = levels[t.toAccountId];
            if (lf === undefined || lt === undefined)
                return;
            if (lt === lf + 1) {
                map[t.toAccountId] = (map[t.toAccountId] || []).concat(t.fromAccountId);
            }
            else if (lf === lt + 1) {
                map[t.fromAccountId] = (map[t.fromAccountId] || []).concat(t.toAccountId);
            }
        });
        return map;
    }, [accounts, leafItems, transfers, levels]);
    // 5) barycenter 기반 순서 정렬 (크로싱 감소)
    const rowIndex = {};
    const orderedByLevel = {};
    levelKeys.forEach((lv, li) => {
        const nodeIds = byLevelRaw[lv];
        if (li === 0) {
            orderedByLevel[lv] = nodeIds.slice();
        }
        else {
            const scored = nodeIds.map((id) => {
                const prevs = (prevNeighbors[id] || []).filter((pid) => rowIndex[pid] !== undefined);
                const score = prevs.length ? prevs.reduce((s, pid) => s + rowIndex[pid], 0) / prevs.length : 999;
                return { id, score };
            });
            scored.sort((a, b) => a.score - b.score);
            orderedByLevel[lv] = scored.map((x) => x.id);
        }
        orderedByLevel[lv].forEach((id, idx) => { rowIndex[id] = idx; });
    });
    // 6) 좌표 배치 (레벨 0 = 메인 통장은 세로 간격을 넓게)
    const colWidth = 270, rowHeight = 58, mainRowHeight = 150, nodeW = 164, nodeH = 42, leafH = 34, topPad = 24, leftPad = 20;
    const rowHeightFor = (lv) => (lv === 0 ? mainRowHeight : rowHeight);
    const positions = {};
    levelKeys.forEach((lv, li) => {
        const rh = rowHeightFor(lv);
        orderedByLevel[lv].forEach((id, ai) => {
            positions[id] = { x: leftPad + li * colWidth + nodeW / 2, y: topPad + ai * rh + nodeH / 2 };
        });
    });
    const height = topPad * 2 + Math.max(...levelKeys.map((lv) => orderedByLevel[lv].length * rowHeightFor(lv)));
    const width = leftPad * 2 + levelKeys.length * colWidth;
    // 7) 엣지 구성 + 같은 구간(gap) 내 x축 분산 배치 (직각 라우팅)
    const validTransfers = transfers.filter((t) => positions[t.fromAccountId] && positions[t.toAccountId] && levels[t.toAccountId] === levels[t.fromAccountId] + 1);
    const gapGroups = {};
    const pushGap = (gapKey, edge) => { (gapGroups[gapKey] = gapGroups[gapKey] || []).push(edge); };
    validTransfers.forEach((t) => pushGap(levels[t.fromAccountId], { kind: "transfer", from: t.fromAccountId, to: t.toAccountId, data: t }));
    leafItems.forEach((li) => { if (positions[li.fromAccountId] && positions[li.id])
        pushGap(levels[li.fromAccountId], { kind: "leaf", from: li.fromAccountId, to: li.id, data: li }); });
    function stepPath(fromPos, toPos, offsetIdx, offsetCount) {
        const x1 = fromPos.x + nodeW / 2, x2 = toPos.x - nodeW / 2;
        const step = (x2 - x1) / (offsetCount + 1);
        const midX = x1 + step * (offsetIdx + 1);
        return { path: `M ${x1} ${fromPos.y} L ${midX} ${fromPos.y} L ${midX} ${toPos.y} L ${x2} ${toPos.y}`, labelX: midX, labelY: toPos.y };
    }
    const leafBg = (kind) => (kind === "insurance" ? C.accentSoft : kind === "savings" ? C.positiveSoft : "#EFEAE0");
    const leafIcon = (kind) => (kind === "insurance" ? "🛡 " : kind === "savings" ? "🐷 " : "📌 ");
    const [fullscreen, setFullscreen] = useState(false);
    const legend = (React.createElement("div", { className: "flex items-center gap-4 mb-3 text-xs flex-wrap", style: { color: C.muted } },
        mainIds.map((id) => {
            const acc = accounts.find((a) => a.id === id);
            return (React.createElement("span", { key: id, className: "flex items-center gap-1.5 font-medium" },
                React.createElement("span", { className: "w-3 h-0.5 rounded-full", style: { background: rootColorMap[id] } }),
                acc ? acc.name : "계좌"));
        }),
        React.createElement("span", { className: "flex items-center gap-1.5" }, "\uD83D\uDEE1 \uBCF4\uD5D8/\uC5F0\uAE08 \u00B7 \uD83D\uDC37 \uC801\uAE08 \u00B7 \uD83D\uDCCC \uACE0\uC815\uC9C0\uCD9C (\uC810\uC120)")));
    const svgContent = (React.createElement("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, style: { minWidth: width, display: "block" } },
        React.createElement("defs", null,
            ROOT_PALETTE.map((color, i) => (React.createElement("marker", { key: i, id: `arrowRoot${i}`, markerWidth: "7", markerHeight: "7", refX: "5", refY: "3.5", orient: "auto" },
                React.createElement("path", { d: "M0,0 L7,3.5 L0,7 z", fill: color })))),
            React.createElement("marker", { id: "arrowMuted", markerWidth: "6", markerHeight: "6", refX: "4.5", refY: "3", orient: "auto" },
                React.createElement("path", { d: "M0,0 L6,3 L0,6 z", fill: C.inkSoft }))),
        Object.values(gapGroups).map((edges) => edges.map((e, idx) => {
            const from = positions[e.from], to = positions[e.to];
            const { path, labelX, labelY } = stepPath(from, to, idx, edges.length);
            const root = rootOf[e.from];
            const color = colorForRoot(root);
            const markerId = markerIdForRoot(root);
            if (e.kind === "transfer") {
                const t = e.data;
                return (React.createElement("g", { key: "t-" + t.id },
                    React.createElement("path", { d: path, fill: "none", stroke: color, strokeWidth: "1.8", strokeLinejoin: "round", markerEnd: `url(#${markerId})`, opacity: "0.85" }),
                    React.createElement("rect", { x: labelX - 32, y: labelY - 9, width: "64", height: "16", rx: "8", fill: C.surface, stroke: C.border }),
                    React.createElement("text", { x: labelX, y: labelY + 3, textAnchor: "middle", fontSize: "9", fill: C.inkSoft },
                        Math.round(t.amount / 10000),
                        "\uB9CC\u00B7",
                        t.dayOfMonth || "?",
                        "\uC77C")));
            }
            const li = e.data;
            return (React.createElement("g", { key: "l-" + li.id },
                React.createElement("path", { d: path, fill: "none", stroke: color, strokeWidth: "1.5", strokeDasharray: "4 3", strokeLinejoin: "round", markerEnd: `url(#${markerId})`, opacity: "0.7" }),
                React.createElement("rect", { x: labelX - 28, y: labelY - 9, width: "56", height: "16", rx: "8", fill: C.surface, stroke: C.border }),
                React.createElement("text", { x: labelX, y: labelY + 3, textAnchor: "middle", fontSize: "9", fill: C.inkSoft },
                    Math.round(li.amount / 10000),
                    "\uB9CC",
                    li.dayOfMonth ? `·${li.dayOfMonth}일` : "")));
        })),
        accounts.map((a) => {
            const pos = positions[a.id];
            if (!pos)
                return null;
            const isMain = a.isMain;
            const ringColor = isMain ? rootColorMap[a.id] : null;
            return (React.createElement("g", { key: a.id, transform: `translate(${pos.x - nodeW / 2}, ${pos.y - nodeH / 2})` },
                React.createElement("rect", { width: nodeW, height: nodeH, rx: "10", fill: isMain ? C.ink : C.surface, stroke: isMain ? (ringColor || C.ink) : C.border, strokeWidth: isMain ? 2 : 1 }),
                React.createElement("text", { x: nodeW / 2, y: 16, textAnchor: "middle", fontSize: "11", fontWeight: "600", fill: isMain ? "#fff" : C.ink },
                    isMain ? "⭐ " : "",
                    a.name),
                React.createElement("text", { x: nodeW / 2, y: 29, textAnchor: "middle", fontSize: "9", fill: isMain ? "rgba(255,255,255,0.7)" : C.muted },
                    a.owner ? `[${a.owner}] ` : "",
                    a.bank || a.type)));
        }),
        leafItems.map((li) => {
            const pos = positions[li.id];
            if (!pos)
                return null;
            const color = colorForRoot(rootOf[li.fromAccountId]);
            return (React.createElement("g", { key: li.id + "-node", transform: `translate(${pos.x - nodeW / 2}, ${pos.y - leafH / 2})` },
                React.createElement("rect", { width: nodeW, height: leafH, rx: "9", fill: leafBg(li.kind), stroke: color, strokeWidth: "1", opacity: "0.95" }),
                React.createElement("text", { x: nodeW / 2, y: 14, textAnchor: "middle", fontSize: "10", fontWeight: "600", fill: C.inkSoft },
                    leafIcon(li.kind),
                    li.name),
                React.createElement("text", { x: nodeW / 2, y: 26, textAnchor: "middle", fontSize: "8", fill: C.muted }, li.sub)));
        })));
    return (React.createElement(Card, null,
        React.createElement(SectionTitle, { action: React.createElement(IconBtn, { onClick: () => setFullscreen(true), title: "\uC804\uCCB4\uD654\uBA74\uC73C\uB85C \uD06C\uAC8C \uBCF4\uAE30" },
                React.createElement(IconExpand, { size: 16 })) }, "\uC6D4\uBCC4 \uACE0\uC815 \uC774\uCCB4\u00B7\uC9C0\uCD9C \uD750\uB984\uB3C4"),
        mainIds.length === 0 && (React.createElement("div", { className: "text-xs mb-3 px-3 py-2 rounded-lg", style: { background: C.accentSoft, color: C.accentDeep } }, "\uC544\uB798 \"\uACC4\uC88C \uCD94\uAC00/\uC218\uC815\"\uC5D0\uC11C \uBA54\uC778 \uD1B5\uC7A5(\uAE09\uC5EC\uD1B5\uC7A5)\uC744 \uC9C0\uC815\uD558\uBA74 \uADF8 \uACC4\uC88C\uB4E4\uC744 \uC2DC\uC791\uC810\uC73C\uB85C \uD750\uB984\uB3C4\uAC00 \uC815\uB82C\uB3FC\uC694.")),
        React.createElement("button", { onClick: () => setFullscreen(true), className: "md:hidden w-full mb-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium", style: { background: C.accentSoft, color: C.accentDeep } },
            React.createElement(IconExpand, { size: 13 }),
            " \uC804\uCCB4\uD654\uBA74\uC73C\uB85C \uD06C\uAC8C \uBCF4\uAE30"),
        legend,
        React.createElement("div", { style: { overflowX: "auto" } }, svgContent),
        fullscreen && React.createElement(FlowDiagramFullscreen, { onClose: () => setFullscreen(false), legend: legend }, svgContent)));
}
// ---------- 흐름도 전체화면 보기 (모바일에서 확대/축소하며 보기) ----------
function FlowDiagramFullscreen({ children, legend, onClose }) {
    const [zoom, setZoom] = useState(1);
    return (React.createElement("div", { className: "fixed inset-0 z-30 flex flex-col", style: { background: C.bg } },
        React.createElement("div", { className: "flex items-center justify-between px-4 py-3 shrink-0", style: { borderBottom: `1px solid ${C.border}`, background: C.surface } },
            React.createElement("div", { className: "text-sm font-semibold", style: { fontFamily: SERIF } }, "\uC6D4\uBCC4 \uACE0\uC815 \uC774\uCCB4\u00B7\uC9C0\uCD9C \uD750\uB984\uB3C4"),
            React.createElement("div", { className: "flex items-center gap-1" },
                React.createElement(IconBtn, { onClick: () => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2))), title: "\uCD95\uC18C" },
                    React.createElement(IconMinus, { size: 16 })),
                React.createElement("span", { className: "text-xs w-11 text-center", style: { color: C.muted } },
                    Math.round(zoom * 100),
                    "%"),
                React.createElement(IconBtn, { onClick: () => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2))), title: "\uD655\uB300" },
                    React.createElement(IconPlus, { size: 16 })),
                React.createElement(IconBtn, { onClick: onClose, title: "\uB2EB\uAE30" },
                    React.createElement(IconX, { size: 18 })))),
        React.createElement("div", { className: "px-4 pt-3" }, legend),
        React.createElement("div", { className: "flex-1 overflow-auto px-4 pb-6", style: { WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y pinch-zoom" } },
            React.createElement("div", { style: { transform: `scale(${zoom})`, transformOrigin: "0 0", width: "fit-content" } }, children))));
}
// ---------- 계좌 간 월별 고정 이체 ----------
function TransfersSection({ accounts, transfers, setTransfers, insurances, fixedExpenses, savings }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { fromAccountId: "", toAccountId: "", amount: "", memo: "", dayOfMonth: "" };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (t) => { setForm({ ...empty, ...t }); setEditId(t.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("이체 기록을 삭제할까요?"))
        setTransfers((prev) => prev.filter((t) => t.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.fromAccountId || !form.toAccountId || !form.amount)
            return;
        if (form.fromAccountId === form.toAccountId) {
            alert("출발 계좌와 도착 계좌가 같을 수 없어요.");
            return;
        }
        const payload = { ...form, amount: Number(form.amount) };
        if (editId)
            setTransfers((prev) => prev.map((t) => (t.id === editId ? { ...payload, id: editId } : t)));
        else
            setTransfers((prev) => [{ ...payload, id: uid() }, ...prev]);
        setOpen(false);
    };
    const accountName = (id) => accounts.find((x) => x.id === id)?.name || "(삭제된 계좌)";
    const hasFlowData = transfers.length > 0 || (insurances && insurances.some((i) => i.fromAccountId)) || (fixedExpenses && fixedExpenses.some((f) => f.fromAccountId)) || (savings && savings.some((s) => s.type === "적금" && s.fromAccountId));
    return (React.createElement("div", null,
        React.createElement("div", { className: "flex items-center justify-between mb-3" },
            React.createElement("h3", { className: "text-base md:text-lg font-semibold", style: { fontFamily: SERIF, color: C.ink } }, "\uACC4\uC88C \uAC04 \uC6D4\uBCC4 \uACE0\uC815 \uC774\uCCB4"),
            accounts.length >= 2 && React.createElement(PrimaryBtn, { onClick: startAdd },
                React.createElement(IconPlus, { size: 16 }),
                " \uC774\uCCB4 \uCD94\uAC00")),
        accounts.length < 2 ? React.createElement(Card, null,
            React.createElement(Empty, { text: "\uC774\uCCB4\uB97C \uAE30\uB85D\uD558\uB824\uBA74 \uACC4\uC88C\uAC00 2\uAC1C \uC774\uC0C1 \uD544\uC694\uD574\uC694." })) : (React.createElement("div", { className: "flex flex-col gap-4" },
            open && (React.createElement(Card, null,
                React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" },
                    React.createElement(Field, { label: "\uCD9C\uBC1C \uACC4\uC88C" },
                        React.createElement(SelectInput, { value: form.fromAccountId, onChange: (e) => setForm({ ...form, fromAccountId: e.target.value }), required: true },
                            React.createElement("option", { value: "" }, "\uC120\uD0DD"),
                            accounts.map((a) => React.createElement("option", { key: a.id, value: a.id },
                                a.owner ? `[${a.owner}] ` : "",
                                a.name,
                                a.isMain ? " ⭐" : "")))),
                    React.createElement(Field, { label: "\uB3C4\uCC29 \uACC4\uC88C" },
                        React.createElement(SelectInput, { value: form.toAccountId, onChange: (e) => setForm({ ...form, toAccountId: e.target.value }), required: true },
                            React.createElement("option", { value: "" }, "\uC120\uD0DD"),
                            accounts.map((a) => React.createElement("option", { key: a.id, value: a.id },
                                a.owner ? `[${a.owner}] ` : "",
                                a.name,
                                a.isMain ? " ⭐" : "")))),
                    React.createElement(Field, { label: "\uAE08\uC561" },
                        React.createElement(MoneyInput, { required: true, value: form.amount, onChange: (v) => setForm({ ...form, amount: v }) })),
                    React.createElement(Field, { label: "\uB9E4\uC6D4 \uC774\uCCB4\uC77C" },
                        React.createElement(SelectInput, { value: form.dayOfMonth, onChange: (e) => setForm({ ...form, dayOfMonth: e.target.value }), required: true },
                            React.createElement("option", { value: "" }, "\uC120\uD0DD"),
                            Array.from({ length: 31 }, (_, i) => i + 1).map((d) => React.createElement("option", { key: d, value: d },
                                d,
                                "\uC77C")))),
                    React.createElement(Field, { label: "\uBA54\uBAA8(\uC120\uD0DD)" },
                        React.createElement(TextInput, { value: form.memo, onChange: (e) => setForm({ ...form, memo: e.target.value }), placeholder: "\uC608: \uC0DD\uD65C\uBE44 \uC9C0\uC6D0" })),
                    React.createElement("div", { className: "sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1" },
                        React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                        React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
            hasFlowData && React.createElement(AccountFlowDiagram, { accounts: accounts, transfers: transfers, insurances: insurances, fixedExpenses: fixedExpenses, savings: savings }),
            transfers.length === 0 ? React.createElement(Card, null,
                React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uC774\uCCB4 \uB0B4\uC5ED\uC774 \uC5C6\uC5B4\uC694." })) : (React.createElement("div", { className: "flex flex-col gap-2" }, transfers.map((t) => (React.createElement(Card, { key: t.id, lift: true, className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-2 min-w-0 flex-wrap" },
                    React.createElement("span", { className: "text-sm font-medium truncate" }, accountName(t.fromAccountId)),
                    React.createElement(IconChevronRight, { size: 14, style: { color: C.muted, flexShrink: 0 } }),
                    React.createElement("span", { className: "text-sm font-medium truncate" }, accountName(t.toAccountId)),
                    React.createElement("span", { className: "text-xs px-2 py-0.5 rounded-md shrink-0", style: { background: C.accentSoft, color: C.accent } },
                        "\uB9E4\uC6D4 ",
                        t.dayOfMonth || "?",
                        "\uC77C"),
                    t.memo && React.createElement("span", { className: "text-xs", style: { color: C.muted } },
                        "\u00B7 ",
                        t.memo)),
                React.createElement("div", { className: "flex items-center gap-2 shrink-0" },
                    React.createElement("div", { className: "text-sm font-medium", style: { fontFamily: SERIF } }, formatWon(t.amount)),
                    React.createElement(IconBtn, { onClick: () => startEdit(t), title: "\uC218\uC815" },
                        React.createElement(IconPencil, { size: 14 })),
                    React.createElement(IconBtn, { onClick: () => remove(t.id), title: "\uC0AD\uC81C", danger: true },
                        React.createElement(IconTrash, { size: 14 }))))))))))));
}
// ---------- 계좌관리 ----------
function AccountsTab({ accounts, setAccounts, transfers, setTransfers, insurances, fixedExpenses, savings }) {
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const empty = { name: "", bank: "", accountNumber: "", type: "입출금", owner: "", isMain: false };
    const [form, setForm] = useState(empty);
    const startAdd = () => { setForm(empty); setEditId(null); setOpen(true); };
    const startEdit = (a) => { setForm({ ...empty, ...a }); setEditId(a.id); setOpen(true); };
    const remove = (id) => { if (window.confirm("삭제할까요? 관련 이체 기록도 함께 정리해주세요."))
        setAccounts((prev) => prev.filter((a) => a.id !== id)); };
    const submit = (e) => {
        e.preventDefault();
        if (!form.name)
            return;
        if (editId)
            setAccounts((prev) => prev.map((a) => (a.id === editId ? { ...form, id: editId } : a)));
        else
            setAccounts((prev) => [{ ...form, id: uid() }, ...prev]);
        setOpen(false);
    };
    const owners = useMemo(() => { const set = new Set(); accounts.forEach((a) => set.add(a.owner && a.owner.trim() ? a.owner.trim() : "미지정")); return Array.from(set); }, [accounts]);
    const ownerNames = useMemo(() => owners.filter((o) => o !== "미지정"), [owners]);
    return (React.createElement("div", { className: "flex flex-col gap-8" },
        React.createElement("div", null,
            React.createElement("div", { className: "flex items-center justify-between mb-3" },
                React.createElement("div", { className: "text-sm md:text-base", style: { color: C.muted } },
                    "\uB4F1\uB85D\uB41C \uACC4\uC88C ",
                    React.createElement("span", { style: { color: C.ink, fontWeight: 600 } },
                        accounts.length,
                        "\uAC1C")),
                React.createElement(PrimaryBtn, { onClick: startAdd },
                    React.createElement(IconPlus, { size: 16 }),
                    " \uACC4\uC88C \uCD94\uAC00")),
            open && (React.createElement(Card, { className: "mb-4" },
                React.createElement("datalist", { id: "owner-suggestions" }, ownerNames.map((o) => React.createElement("option", { key: o, value: o }))),
                React.createElement("form", { onSubmit: submit, className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" },
                    React.createElement(Field, { label: "\uACC4\uC88C \uBCC4\uCE6D" },
                        React.createElement(TextInput, { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "\uC608: \uC0DD\uD65C\uBE44 \uD1B5\uC7A5" })),
                    React.createElement(Field, { label: "\uC18C\uC720\uC790(\uC120\uD0DD)" },
                        React.createElement(TextInput, { value: form.owner, onChange: (e) => setForm({ ...form, owner: e.target.value }), placeholder: "\uC608: \uD64D\uAE38\uB3D9", list: "owner-suggestions" })),
                    React.createElement(Field, { label: "\uC740\uD589/\uAE30\uAD00" },
                        React.createElement(TextInput, { value: form.bank, onChange: (e) => setForm({ ...form, bank: e.target.value }), placeholder: "\uC608: \uAD6D\uBBFC\uC740\uD589" })),
                    React.createElement(Field, { label: "\uACC4\uC88C\uBC88\uD638(\uC120\uD0DD)" },
                        React.createElement(TextInput, { value: form.accountNumber, onChange: (e) => setForm({ ...form, accountNumber: e.target.value }), placeholder: "\uC608: 123-456-789012" })),
                    React.createElement(Field, { label: "\uC720\uD615" },
                        React.createElement(SelectInput, { value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }) }, ACCOUNT_TYPES.map((t) => React.createElement("option", { key: t }, t)))),
                    React.createElement("label", { className: "flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3 pt-1", style: { color: C.inkSoft } },
                        React.createElement("input", { type: "checkbox", checked: !!form.isMain, onChange: (e) => setForm({ ...form, isMain: e.target.checked }), style: { width: 16, height: 16, accentColor: C.accent } }),
                        "\u2B50 \uBA54\uC778 \uD1B5\uC7A5(\uAE09\uC5EC\uD1B5\uC7A5)\uC73C\uB85C \uC124\uC815 \u2014 \uC5EC\uB7EC \uACC4\uC88C\uB97C \uB3D9\uC2DC\uC5D0 \uBA54\uC778\uC73C\uB85C \uC9C0\uC815\uD560 \uC218 \uC788\uC5B4\uC694"),
                    React.createElement("div", { className: "sm:col-span-2 lg:col-span-3 flex gap-2 justify-end pt-1" },
                        React.createElement("button", { type: "button", onClick: () => setOpen(false), className: "px-4 py-2 rounded-lg text-sm", style: { color: C.muted } }, "\uCDE8\uC18C"),
                        React.createElement(PrimaryBtn, { type: "submit" }, "\uC800\uC7A5"))))),
            accounts.length === 0 ? React.createElement(Card, null,
                React.createElement(Empty, { text: "\uB4F1\uB85D\uB41C \uACC4\uC88C\uAC00 \uC5C6\uC5B4\uC694. '\uACC4\uC88C \uCD94\uAC00'\uB85C \uC2DC\uC791\uD574\uBCF4\uC138\uC694." })) : (React.createElement("div", { className: "flex flex-col gap-5" }, owners.map((owner) => (React.createElement("div", { key: owner },
                React.createElement("div", { className: "text-xs font-medium tracking-wide mb-2", style: { color: C.accent } }, owner),
                React.createElement("div", { className: "grid sm:grid-cols-2 xl:grid-cols-4 gap-4" }, accounts.filter((a) => (a.owner && a.owner.trim() ? a.owner.trim() : "미지정") === owner).map((a) => (React.createElement(Card, { key: a.id, lift: true },
                    React.createElement("div", { className: "flex items-start justify-between" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex items-center gap-1.5 mb-1.5 flex-wrap" },
                                React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-block", style: { background: C.accentSoft, color: C.accent } }, a.type),
                                a.isMain && React.createElement("div", { className: "text-xs px-2 py-0.5 rounded-md inline-flex items-center gap-1", style: { background: C.ink, color: "#fff" } },
                                    React.createElement(IconStar, { size: 10 }),
                                    "\uBA54\uC778")),
                            React.createElement("div", { className: "font-semibold" }, a.name),
                            a.bank && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted } }, a.bank),
                            a.accountNumber && React.createElement("div", { className: "text-xs mt-0.5", style: { color: C.muted, fontFamily: "monospace" } }, a.accountNumber)),
                        React.createElement("div", { className: "flex" },
                            React.createElement(IconBtn, { onClick: () => startEdit(a), title: "\uC218\uC815" },
                                React.createElement(IconPencil, { size: 15 })),
                            React.createElement(IconBtn, { onClick: () => remove(a.id), title: "\uC0AD\uC81C", danger: true },
                                React.createElement(IconTrash, { size: 15 })))))))))))))),
        React.createElement(TransfersSection, { accounts: accounts, transfers: transfers, setTransfers: setTransfers, insurances: insurances, fixedExpenses: fixedExpenses, savings: savings })));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
