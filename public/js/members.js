// File: /public/js/members.js

document.addEventListener("DOMContentLoaded", () => {
  const accessMessageEl = document.getElementById("membersAccessMessage");
  const memberNameEls = Array.from(document.querySelectorAll("[data-member-name]"));
  const memberEmailEls = Array.from(document.querySelectorAll("[data-member-email]"));
  const memberRoleEls = Array.from(document.querySelectorAll("[data-member-role]"));
  const memberStatusEls = Array.from(document.querySelectorAll("[data-member-status]"));
  const memberCreatedEls = Array.from(document.querySelectorAll("[data-member-created-at]"));
  const memberUpdatedEls = Array.from(document.querySelectorAll("[data-member-updated-at]"));
  const memberSessionExpiresEls = Array.from(document.querySelectorAll("[data-member-session-expires]"));

  let currentMember = null;
  let currentSession = null;
  let hasBooted = false;

  function setAccessMessage(message, isError = false) {
    if (!accessMessageEl) return;

    accessMessageEl.textContent = message;
    accessMessageEl.style.display = message ? "block" : "none";
    accessMessageEl.style.color = isError ? "#b00020" : "";
  }

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isActiveUser(user) {
    return user?.is_active === true || Number(user?.is_active || 0) === 1;
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "—";

    return text
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "—";

    const raw = String(value).trim();
    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }

    const fallback = new Date(raw.replace(" ", "T") + "Z");
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toLocaleString();
    }

    return raw;
  }

  function setTextMany(elements, value) {
    elements.forEach((el) => {
      el.textContent = value;
    });
  }

  function clearMemberUi() {
    setTextMany(memberNameEls, "Member");
    setTextMany(memberEmailEls, "—");
    setTextMany(memberRoleEls, "—");
    setTextMany(memberStatusEls, "—");
    setTextMany(memberCreatedEls, "—");
    setTextMany(memberUpdatedEls, "—");
    setTextMany(memberSessionExpiresEls, "—");
  }

  function renderMemberUi(user, session) {
    const displayName =
      String(user?.display_name || "").trim() ||
      String(user?.email || "").trim() ||
      "Member";

    setTextMany(memberNameEls, displayName);
    setTextMany(memberEmailEls, user?.email || "—");
    setTextMany(memberRoleEls, titleCase(user?.role || "member"));
    setTextMany(memberStatusEls, isActiveUser(user) ? "Active" : "Inactive");
    setTextMany(memberCreatedEls, formatDate(user?.created_at));
    setTextMany(memberUpdatedEls, formatDate(user?.updated_at));
    setTextMany(memberSessionExpiresEls, formatDate(session?.expires_at));
  }

  function dispatchMembersReady(detail = {}) {
    document.dispatchEvent(new CustomEvent("dd:members-ready", { detail }));
  }

  async function fetchMemberSessionInfo() {
    if (!window.DDAuth) {
      throw new Error("Authentication tools are not available.");
    }

    const sessionInfo = await window.DDAuth.fetchSessionInfo();
    const user = sessionInfo?.user || null;
    const session = sessionInfo?.session || null;

    if (!user || !isActiveUser(user)) {
      throw new Error("A valid active member session is required.");
    }

    const role = normalizeRole(user.role);

    if (!["member", "admin"].includes(role)) {
      throw new Error("A valid member account is required.");
    }

    return { user, session };
  }

  async function bootMembersPage() {
    if (hasBooted) return;
    hasBooted = true;

    clearMemberUi();

    try {
      const result = await fetchMemberSessionInfo();

      currentMember = result.user;
      currentSession = result.session;

      renderMemberUi(currentMember, currentSession);
      setAccessMessage("");

      dispatchMembersReady({
        ok: true,
        user: currentMember,
        session: currentSession
      });
    } catch (error) {
      currentMember = null;
      currentSession = null;
      clearMemberUi();
      setAccessMessage(error.message || "Unable to load member account.", true);

      dispatchMembersReady({
        ok: false,
        error: error.message || "Unable to load member account."
      });
    }
  }

  document.addEventListener("dd:member-access-ready", async (event) => {
    const ok = !!event?.detail?.ok;

    hasBooted = false;

    if (!ok) {
      currentMember = null;
      currentSession = null;
      clearMemberUi();

      dispatchMembersReady({
        ok: false,
        error: event?.detail?.error || "Member access was not granted."
      });
      return;
    }

    await bootMembersPage();
  });

  document.addEventListener("dd:auth-changed", async () => {
    hasBooted = false;
    await bootMembersPage();
  });

  bootMembersPage();
});
