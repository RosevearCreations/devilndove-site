document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("adminMoviesList");
  const searchEl = document.getElementById("adminMoviesSearch");
  const refreshBtn = document.getElementById("refreshMoviesButton");
  const messageEl = document.getElementById("adminMoviesMessage");
  const form = document.getElementById("adminMovieForm");

  if (!listEl || !form) return;

  const fields = {
    upc: document.getElementById("movieUpc"),
    slug: document.getElementById("movieSlug"),
    title: document.getElementById("movieTitle"),
    original_title: document.getElementById("movieOriginalTitle"),
    release_year: document.getElementById("movieYear"),
    actor_names: document.getElementById("movieActors"),
    director_names: document.getElementById("movieDirectors"),
    genre: document.getElementById("movieGenre"),
    media_format: document.getElementById("movieFormat"),
    studio_name: document.getElementById("movieStudio"),
    runtime_minutes: document.getElementById("movieRuntime"),
    imdb_id: document.getElementById("movieImdbId"),
    alternate_identifier: document.getElementById("movieAltId"),
    trailer_url: document.getElementById("movieTrailer"),
    front_image_url: document.getElementById("movieFront"),
    back_image_url: document.getElementById("movieBack"),
    summary: document.getElementById("movieSummary"),
    collection_notes: document.getElementById("movieNotes"),
    rarity_notes: document.getElementById("movieRarityNotes"),
    metadata_status: document.getElementById("movieMetadataStatus"),
    status: document.getElementById("movieStatus")
  };

  let items = [];

  function setMessage(text, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.style.display = text ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fillForm(item = {}) {
    Object.entries(fields).forEach(([key, el]) => {
      if (!el) return;
      el.value = item[key] ?? "";
    });
  }

  function currentFormPayload() {
    const payload = {};
    Object.entries(fields).forEach(([key, el]) => {
      if (!el) return;
      payload[key] = el.value;
    });
    return payload;
  }

  function renderList(rows) {
    if (!rows.length) {
      listEl.innerHTML = `<div class="small">No movies found.</div>`;
      return;
    }

    listEl.innerHTML = rows.map((item, index) => {
      const title = item.title || item.upc || item.slug || `Movie ${index + 1}`;
      const sub = [
        item.release_year || "",
        item.media_format || "",
        item.director_names || "",
        item.upc ? `UPC: ${item.upc}` : ""
      ].filter(Boolean).join(" • ");

      return `
        <button type="button" class="card admin-movie-pick" data-key="${esc(item.upc || item.slug)}" style="display:block;width:100%;text-align:left;margin-bottom:10px">
          <div style="font-weight:700">${esc(title)}</div>
          <div class="small">${esc(sub)}</div>
        </button>
      `;
    }).join("");

    listEl.querySelectorAll(".admin-movie-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-key") || "";
        const item = items.find((row) => String(row.upc || row.slug) === key);
        fillForm(item || {});
        setMessage(item ? `Loaded ${item.title || item.upc || item.slug}.` : "");
      });
    });
  }

  async function loadMovies() {
    setMessage("Loading movies...");
    const q = encodeURIComponent(searchEl?.value || "");
    const response = await fetch(`/api/admin/movies?q=${q}`, { credentials: "same-origin" });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      items = [];
      renderList([]);
      setMessage(data?.error || "Could not load movies.", true);
      return;
    }

    items = Array.isArray(data.items) ? data.items : [];
    renderList(items);
    setMessage(`Loaded ${items.length} movie record(s).`);
  }

  async function saveMovie(event) {
    event.preventDefault();
    setMessage("Saving movie...");

    const response = await fetch("/api/admin/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(currentFormPayload())
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      setMessage(data?.error || "Could not save movie.", true);
      return;
    }

    setMessage("Movie saved.");
    await loadMovies();
  }

  refreshBtn?.addEventListener("click", loadMovies);
  searchEl?.addEventListener("input", () => {
    clearTimeout(searchEl._ddMovieTimer);
    searchEl._ddMovieTimer = setTimeout(loadMovies, 250);
  });

  form.addEventListener("submit", saveMovie);
  loadMovies();
});
