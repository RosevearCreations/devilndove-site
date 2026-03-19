// File: /public/js/members-self-protect.js

document.addEventListener("DOMContentLoaded", () => {
  const accessMessageEl = document.getElementById("membersAccessMessage");
  const protectedSectionIds = [
    "membersSection",
    "memberAccountSection",
    "memberOrdersSection",
    "memberDownloadsSection"
  ];

  function setAccessMessage(message, isError = false) {
    if (!accessMessageEl) return;

    accessMessageEl.textContent = message;
    accessMessageEl.style.display = message ? "block" : "none";
    accessMessageEl.style.color = isError ? "#b00020" : "";
  }

  function hideProtectedSections() {
    protectedSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
      }
    });
  }

  function showProtectedSections() {
    protectedSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "";
      }
    });
  }

  function safeRedirect(path) {
    window.location.href = path;
  }

  async function protectMembersPage() {
    hideProtectedSections();

    if (!window.DDAuth) {
      setAccessMessage("Authentication tools are not available.", true);
      return;
    }

    if (!window.DDAuth.isLoggedIn()) {
      setAccessMessage("You must be logged in to access this page.", true);

      setTimeout(() => {
        safeRedirect("/login/");
      }, 900);

      return;
    }

    setAccessMessage("Checking your account access...");

    try {
      const me = await window.DDAuth.fetchMe();
      const role = String(me?.role || "").trim().toLowerCase();
      const isActive =
        me?.is_active === true ||
        Number(me?.is_active || 0) === 1;

      if (!isActive) {
        setAccessMessage("This account is inactive.", true);

        setTimeout(() => {
          safeRedirect("/");
        }, 1200);

        return;
      }

      if (!["member", "admin"].includes(role)) {
        setAccessMessage("A valid member account is required for this page.", true);

        setTimeout(() => {
          safeRedirect("/");
        }, 1200);

        return;
      }

      showProtectedSections();
      setAccessMessage("");

      document.dispatchEvent(new CustomEvent("dd:member-access-ready", {
        detail: {
          ok: true,
          user: me
        }
      }));
    } catch (error) {
      setAccessMessage("Your session could not be verified. Please log in again.", true);

      if (window.DDAuth.logout) {
        try {
          await window.DDAuth.logout();
        } catch {
          // ignore logout cleanup failure
        }
      }

      document.dispatchEvent(new CustomEvent("dd:member-access-ready", {
        detail: {
          ok: false,
          error: error?.message || "Session could not be verified."
        }
      }));

      setTimeout(() => {
        safeRedirect("/login/");
      }, 1200);
    }
  }

  protectMembersPage();
});
