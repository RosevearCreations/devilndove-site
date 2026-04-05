// File: /public/js/admin.js
// Brief description: Handles the admin dashboard shell. It listens for the resolved
// admin session, fills the visible admin summary placeholders, and keeps the
// page-level admin state aligned with the shared auth UI events.

document.addEventListener("DOMContentLoaded", () => {
  const accessMessageEl = document.getElementById("adminAccessMessage");

  function setAccessMessage(message, isError = false) {
    if (!accessMessageEl) return;

    accessMessageEl.textContent = message;
    accessMessageEl.style.display = message ? "block" : "none";
    accessMessageEl.style.color = isError ? "#b00020" : "";
  }

  function setSummaryValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }


  function setupPanelAccordion() {
    const sections = Array.from(document.querySelectorAll('[data-admin-panel]'));
    if (!sections.length) return;

    sections.forEach((section, index) => {
      const heading = section.querySelector('h2');
      if (!heading) return;
      section.classList.add('admin-panel');
      let toggle = heading.querySelector('.admin-panel-toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn admin-panel-toggle';
        toggle.innerHTML = '<span class="admin-panel-toggle-label">Collapse</span><span aria-hidden="true">▾</span>';
        heading.appendChild(toggle);
      }
      const body = document.createElement('div');
      body.className = 'admin-panel-body';
      const children = Array.from(section.children).filter((child) => child !== heading);
      children.forEach((child) => body.appendChild(child));
      section.appendChild(body);
      const defaultOpen = section.hasAttribute('data-panel-open') || index < 2;
      section.dataset.panelOpen = defaultOpen ? '1' : '0';
      body.hidden = !defaultOpen;
      toggle.querySelector('.admin-panel-toggle-label').textContent = defaultOpen ? 'Collapse' : 'Expand';
      section.classList.toggle('is-collapsed', !defaultOpen);
      toggle.addEventListener('click', () => {
        const opening = section.dataset.panelOpen !== '1';
        section.dataset.panelOpen = opening ? '1' : '0';
        body.hidden = !opening;
        section.classList.toggle('is-collapsed', !opening);
        toggle.querySelector('.admin-panel-toggle-label').textContent = opening ? 'Collapse' : 'Expand';
      });
    });

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      const panel = target?.closest?.('[data-admin-panel]');
      if (panel && panel.dataset.panelOpen !== '1') {
        const toggle = panel.querySelector('.admin-panel-toggle');
        toggle?.click();
      }
    }
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "—";

    return text
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function renderSignedOut() {
    setAccessMessage("Please log in with an admin account to access this page.", true);
    setSummaryValue("summaryUsersCount", "—");
    setSummaryValue("summaryProductsCount", "—");
    setSummaryValue("summaryOrdersCount", "—");
    setSummaryValue("summaryPaymentsCount", "—");
  }

  function renderSignedIn(user) {
    setAccessMessage("");

    const role = String(user?.role || "").trim().toLowerCase();
    const label = user?.display_name || user?.email || "Admin";

    document.title = `Admin Dashboard — Devil n Dove`;

    const heroHeading = document.querySelector(".hero h1");
    const heroText = document.querySelector(".hero p");

    if (heroHeading) {
      heroHeading.textContent = "Admin Dashboard";
    }

    if (heroText) {
      heroText.textContent =
        `${label} is signed in as ${titleCase(role || "admin")} and can manage users, products, orders, payments, and access tiers.`;
    }
  }

  document.addEventListener("dd:admin-ready", (event) => {
    const ok = !!event?.detail?.ok;
    const user = event?.detail?.user || null;

    if (!ok || !user) {
      renderSignedOut();
      return;
    }

    renderSignedIn(user);
  });

  document.addEventListener("dd:auth-ready", (event) => {
    const loggedIn = !!event?.detail?.logged_in;
    const user = event?.detail?.user || null;

    if (!loggedIn || !user || String(user.role || "").toLowerCase() !== "admin") {
      renderSignedOut();
    }
  });

  setupPanelAccordion();
  renderSignedOut();
});
