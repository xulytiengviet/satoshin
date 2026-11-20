/**
 * Satoshi / Sirius — Vietnamese archival reader
 * Source: https://mmalmi.github.io/satoshi/
 * The email bodies are NOT bundled with this repository.
 * They are requested client-side from a public copy of Martti Malmi's document.
 */
"use strict";

const ORIGINAL_ARCHIVE = "https://mmalmi.github.io/satoshi/";
const SOURCE_COMMIT = "ca318bdd10592da19d0037a3016e01181b56e9eb";
const SOURCES = [
  "https://cdn.jsdelivr.net/gh/mmalmi/mmalmi.github.io@" + SOURCE_COMMIT + "/satoshi/index.html",
  "https://raw.githubusercontent.com/mmalmi/mmalmi.github.io/master/satoshi/index.html"
];
const $ = (selector) => document.querySelector(selector);
const mailList = $("#mail-list");
const readerContent = $("#reader-content");
const state = {
  emails: [],
  filtered: [],
  selectedId: null,
  sender: "all",
  year: "all",
  query: "",
  descending: false,
  fontSize: 14,
  loaded: false
};

function node(tagName, className, textValue) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textValue !== undefined) element.textContent = String(textValue);
  return element;
}
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN");
}
function report(message, isError) {
  const status = $("#status-line");
  status.textContent = message;
  status.classList.toggle("error", Boolean(isError));
}
function parseHeaders(message) {
  const fields = {};
  for (const row of message.querySelectorAll(".header > div")) {
    const raw = row.textContent.replace(/\s+/g, " ").trim();
    const colon = raw.indexOf(":");
    if (colon < 0) continue;
    const label = raw.slice(0, colon).trim().toLowerCase();
    const value = raw.slice(colon + 1).trim();
    if (["date", "from", "to", "subject", "cc"].includes(label)) {
      fields[label] = value;
    }
  }
  return fields;
}
function parseArchive(documentText) {
  const parsed = new DOMParser().parseFromString(documentText, "text/html");
  const messages = Array.from(parsed.querySelectorAll(".message[id^='email-']"));
  if (messages.length === 0) throw new Error("Không tìm thấy cấu trúc .message trong nguồn.");

  const seen = new Set();
  const items = [];
  for (const item of messages) {
    const id = Number(item.id.replace("email-", ""));
    if (!Number.isSafeInteger(id) || id < 1 || seen.has(id)) continue;
    const headers = parseHeaders(item);
    const body = item.querySelector(".body pre")?.textContent || "";
    const yearMatch = (headers.date || "").match(/\b(2009|2010|2011)\b/);
    const year = yearMatch ? yearMatch[1] : "unknown";
    const sender = item.classList.contains("satoshi") ? "satoshi" : "sirius";
    const previewLines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith(">") && !line.startsWith("-----"))
      .slice(0, 3);
    const subject = headers.subject || "(Không có tiêu đề)";
    const preview = previewLines.join(" ").slice(0, 170);
    const record = {
      id, sender, year, subject, preview,
      date: headers.date || "",
      from: headers.from || "",
      to: headers.to || "",
      cc: headers.cc || "",
      body
    };
    record.searchable = normalizeText([
      record.id, record.sender, record.year, record.subject, record.preview,
      record.date, record.from, record.to, record.cc, record.body
    ].join(" "));
    items.push(record);
    seen.add(id);
  }
  items.sort((a, b) => a.id - b.id);
  if (items.length === 0) throw new Error("Nguồn không có thư hợp lệ.");
  return items;
}
async function fetchWithDeadline(url, timeoutMs = 13000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "default" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const text = await response.text();
    if (text.length < 2000) throw new Error("Nội dung nguồn không đủ dài.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
async function loadArchive() {
  let lastError;
  for (const sourceUrl of SOURCES) {
    try {
      const sourceText = await fetchWithDeadline(sourceUrl);
      const records = parseArchive(sourceText);
      state.emails = records;
      state.loaded = true;
      initializeArchive();
      report("Đã nạp " + records.length + " thư trực tiếp từ tài liệu do Martti Malmi công bố. Nội dung gốc không lưu trên website này.");
      return;
    } catch (error) {
      lastError = error;
      console.warn("Nguồn lưu trữ tạm không sẵn sàng:", sourceUrl, error);
    }
  }
  showLoadError(lastError);
}
function showLoadError(error) {
  const message = "Không thể tải bản lưu trữ trong trình duyệt này.";
  mailList.replaceChildren(node("div", "list-placeholder", message));
  readerContent.replaceChildren();
  const box = node("div", "reader-empty");
  box.append(node("div", "empty-glyph", "✉"));
  box.append(node("h3", "", "Không kết nối được kho thư"));
  box.append(node("p", "", "Nguồn lưu trữ bên ngoài có thể tạm thời không khả dụng hoặc bị chặn. Bạn vẫn có thể đọc toàn bộ tài liệu từ trang của Martti Malmi."));
  const link = node("a", "", "Mở tư liệu gốc ↗");
  link.href = ORIGINAL_ARCHIVE;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  box.append(link);
  readerContent.append(box);
  report(message + " " + (error?.message || ""), true);
}
function displayedDate(raw) {
  const match = String(raw).match(/\b(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\b/);
  if (!match) return raw || "Không rõ ngày";
  const names = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
  const month = names[match[2]];
  if (!month) return raw;
  return match[1].padStart(2, "0") + "." + String(month).padStart(2, "0") + "." + match[3];
}
function senderName(sender) {
  return sender === "satoshi" ? "Satoshi Nakamoto" : "Martti Malmi / Sirius";
}
function normalizedSubject(subject) {
  return subject.replace(/^(re|fw|fwd):\s*/i, "").trim() || subject;
}
function getHashId() {
  const match = location.hash.match(/^#email-(\d+)$/);
  return match ? Number(match[1]) : null;
}
function setSelectedHash(id) {
  const hash = "#email-" + id;
  if (location.hash !== hash) history.replaceState(null, "", hash);
}
function filterEmails() {
  const q = normalizeText(state.query.trim());
  state.filtered = state.emails.filter((mail) => {
    return (state.sender === "all" || mail.sender === state.sender)
      && (state.year === "all" || mail.year === state.year)
      && (!q || mail.searchable.includes(q));
  });
  if (state.descending) state.filtered.reverse();
  if (!state.filtered.some((mail) => mail.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id ?? null;
  }
  renderList();
  renderReader();
  updateYearCards();
}
function renderList() {
  const listFragment = document.createDocumentFragment();
  for (const item of state.filtered) {
    const button = node("button", "mail-item");
    button.type = "button";
    button.dataset.emailId = String(item.id);
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-current", String(item.id === state.selectedId));
    button.setAttribute("aria-label", "Thư số " + item.id + ", " + senderName(item.sender) + ", " + item.subject);

    const top = node("div", "mail-item-top");
    top.append(node("span", "mail-item-num", "NO. " + String(item.id).padStart(3, "0")));
    top.append(node("time", "", displayedDate(item.date)));
    const heading = node("h3", "", normalizedSubject(item.subject));
    const excerpt = node("p", "mail-item-summary", item.preview || "Đọc nội dung thư tín gốc.");
    const sender = node("div", "mail-item-sender");
    sender.append(node("span", "sender-dot " + item.sender));
    sender.append(node("span", "", senderName(item.sender)));
    button.append(top, heading, excerpt, sender);
    button.addEventListener("click", () => selectEmail(item.id, true));
    listFragment.append(button);
  }
  if (state.filtered.length === 0) {
    listFragment.append(node("div", "list-placeholder", "Không tìm thấy thư phù hợp. Hãy thử một từ khóa hoặc bộ lọc khác."));
  }
  mailList.replaceChildren(listFragment);
  $("#match-count").textContent = String(state.filtered.length);
  $("#list-caption").textContent = state.query.trim() || state.sender !== "all" || state.year !== "all"
    ? "KẾT QUẢ LỌC" : "THEO THỜI GIAN";
}
function makeMeta(label, value) {
  const group = node("div", "meta-row");
  group.append(node("span", "meta-label", label), node("span", "meta-value", value || "—"));
  return group;
}
function renderReader() {
  readerContent.replaceChildren();
  const total = state.filtered.length;
  const position = state.filtered.findIndex((email) => email.id === state.selectedId);
  const hasSelection = position >= 0;
  $("#reader-position").textContent = hasSelection ? (position + 1) + " / " + total : "— / " + total;
  $("#page-indicator").textContent = hasSelection ? "THƯ " + (position + 1) + " / " + total : "CHƯA CHỌN THƯ";
  $("#prev-btn").disabled = !hasSelection || position === 0;
  $("#next-btn").disabled = !hasSelection || position === total - 1;
  $("#copy-link").disabled = !hasSelection;
  $("#download-txt").disabled = !hasSelection;

  if (!hasSelection) {
    const box = node("div", "reader-empty");
    box.append(node("div", "empty-glyph", "✉"), node("h3", "", "Không có thư phù hợp"));
    box.append(node("p", "", "Thay đổi bộ lọc hoặc xóa từ khóa để tiếp tục đọc."));
    readerContent.append(box);
    return;
  }
  const mail = state.filtered[position];
  const numeral = node("p", "letter-numeral", "LÁ THƯ SỐ " + String(mail.id).padStart(3, "0") + " / " + mail.year);
  const title = node("h3", "letter-title", mail.subject);
  title.id = "reader-title";
  const metadata = node("div", "letter-meta");
  metadata.append(
    makeMeta("NGƯỜI GỬI / FROM", mail.from || senderName(mail.sender)),
    makeMeta("NGƯỜI NHẬN / TO", mail.to),
    makeMeta("NGÀY GIỜ GỐC / DATE", mail.date),
    makeMeta("CHỦ ĐỀ / SUBJECT", mail.subject)
  );
  if (mail.cc) metadata.append(makeMeta("ĐỒNG NHẬN / CC", mail.cc));

  const bodyHeader = node("div", "letter-section-top");
  bodyHeader.append(node("span", "", "NỘI DUNG NGUYÊN VĂN / ENGLISH ORIGINAL"));
  const originalLink = node("a", "", "Đối chiếu nguồn ↗");
  originalLink.href = ORIGINAL_ARCHIVE + "#email-" + mail.id;
  originalLink.target = "_blank";
  originalLink.rel = "noopener noreferrer";
  bodyHeader.append(originalLink);
  const body = node("pre", "letter-body", mail.body);
  body.id = "mail-body";
  body.setAttribute("tabindex", "0");
  body.setAttribute("aria-label", "Nội dung nguyên văn thư số " + mail.id);
  const footnote = node("p", "letter-footnote", "Bản hiển thị giữ nguyên nội dung tiếng Anh của tài liệu công khai. Các dòng trích dẫn và tiêu đề thư được bảo toàn.");
  readerContent.append(numeral, title, metadata, bodyHeader, body, footnote);
}
function scrollSelectedIntoListView() {
  const button = mailList.querySelector('[data-email-id="' + state.selectedId + '"]');
  if (!button) return;
  const targetTop = button.offsetTop - mailList.offsetTop;
  if (targetTop < mailList.scrollTop) mailList.scrollTop = Math.max(targetTop - 12, 0);
  else if (targetTop + button.offsetHeight > mailList.scrollTop + mailList.clientHeight) {
    mailList.scrollTop = targetTop + button.offsetHeight - mailList.clientHeight + 12;
  }
}
function selectEmail(id, fromClick) {
  if (!state.filtered.some((mail) => mail.id === id)) return;
  state.selectedId = id;
  setSelectedHash(id);
  renderList();
  renderReader();
  if (!fromClick) scrollSelectedIntoListView();
  if (fromClick && matchMedia("(max-width: 640px)").matches) {
    $("#reader").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
}
function updateYearCards() {
  for (const card of document.querySelectorAll("[data-filter-year]")) {
    const active = card.dataset.filterYear === state.year;
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", String(active));
  }
}
function initializeArchive() {
  $("#stat-total").textContent = String(state.emails.length);
  for (const year of ["2009", "2010", "2011"]) {
    const count = state.emails.filter((mail) => mail.year === year).length;
    $("#count-" + year).textContent = count + " thư";
  }
  const requestedId = getHashId();
  state.selectedId = state.emails.some((mail) => mail.id === requestedId)
    ? requestedId : state.emails[0].id;
  filterEmails();
  if (requestedId && state.selectedId === requestedId) scrollSelectedIntoListView();
}
function moveSelection(delta) {
  const index = state.filtered.findIndex((mail) => mail.id === state.selectedId);
  const next = state.filtered[index + delta];
  if (next) selectEmail(next.id, false);
}
function updateFont(delta) {
  state.fontSize = Math.min(21, Math.max(12, state.fontSize + delta));
  document.documentElement.style.setProperty("--body-size", state.fontSize + "px");
}
function downloadCurrentEmail() {
  const mail = state.emails.find((item) => item.id === state.selectedId);
  if (!mail) return;
  const content = [
    "Satoshi — Sirius email #" + mail.id,
    "Date: " + mail.date,
    "From: " + mail.from,
    "To: " + mail.to,
    "Subject: " + mail.subject,
    "Original source: " + ORIGINAL_ARCHIVE + "#email-" + mail.id,
    "",
    mail.body
  ].join("\r\n");
  const file = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = "satoshi-sirius-email-" + String(mail.id).padStart(3, "0") + ".txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copyLink() {
  if (state.selectedId === null) return;
  const url = location.href.split("#")[0] + "#email-" + state.selectedId;
  const button = $("#copy-link");
  try {
    await navigator.clipboard.writeText(url);
    const label = button.textContent;
    button.textContent = "Đã sao chép ✓";
    setTimeout(() => { button.textContent = label; }, 1800);
  } catch {
    window.prompt("Sao chép liên kết tới lá thư:", url);
  }
}
function bindControls() {
  $("#search").addEventListener("input", (event) => {
    state.query = event.target.value;
    filterEmails();
  });
  $("#sender-filter").addEventListener("change", (event) => {
    state.sender = event.target.value;
    filterEmails();
  });
  $("#year-filter").addEventListener("change", (event) => {
    state.year = event.target.value;
    filterEmails();
  });
  $("#sort-btn").addEventListener("click", (event) => {
    state.descending = !state.descending;
    event.currentTarget.textContent = (state.descending ? "Mới nhất trước" : "Cũ nhất trước") + " ↕";
    filterEmails();
  });
  $("#prev-btn").addEventListener("click", () => moveSelection(-1));
  $("#next-btn").addEventListener("click", () => moveSelection(1));
  $("#font-down").addEventListener("click", () => updateFont(-1));
  $("#font-up").addEventListener("click", () => updateFont(1));
  $("#copy-link").addEventListener("click", copyLink);
  $("#download-txt").addEventListener("click", downloadCurrentEmail);
  for (const card of document.querySelectorAll("[data-filter-year]")) {
    card.addEventListener("click", () => {
      state.year = state.year === card.dataset.filterYear ? "all" : card.dataset.filterYear;
      $("#year-filter").value = state.year;
      filterEmails();
      $("#archive").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }
  window.addEventListener("hashchange", () => {
    if (!state.loaded) return;
    const requested = getHashId();
    if (requested && state.emails.some((mail) => mail.id === requested)) {
      // A permalink always opens the corresponding message, even if it is outside the current filter.
      const mail = state.emails.find((item) => item.id === requested);
      if (state.year !== "all" && state.year !== mail.year) {
        state.year = "all";
        $("#year-filter").value = "all";
      }
      if (state.sender !== "all" && state.sender !== mail.sender) {
        state.sender = "all";
        $("#sender-filter").value = "all";
      }
      if (state.query && !mail.searchable.includes(normalizeText(state.query))) {
        state.query = "";
        $("#search").value = "";
      }
      state.selectedId = requested;
      filterEmails();
      scrollSelectedIntoListView();
    }
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement && (
      target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );
    if (event.key === "/" && !typing && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      $("#search").focus();
    }
    if (event.key === "Escape" && document.activeElement === $("#search")) {
      $("#search").value = "";
      state.query = "";
      filterEmails();
      $("#search").blur();
    }
  });
}
bindControls();
loadArchive();
