(() => {
  'use strict';

  const mount = document.getElementById('adminCommunityMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let latest = { events: [], pickup_profiles: [] };

  function cardWrap(title, inner) {
    return `<section class="card" style="margin-top:18px"><h2 style="margin-top:0">${esc(title)}</h2>${inner}</section>`;
  }

  function eventRowsMarkup() {
    return (latest.events || []).map((row) => `
      <tr>
        <td>${esc(row.title)}</td>
        <td>${esc(row.event_type)}</td>
        <td>${esc(row.event_status)}</td>
        <td>${esc(row.city || row.region_label || '—')}</td>
        <td>${esc(row.starts_at || '—')}</td>
        <td><button class="btn" type="button" data-edit-event="${Number(row.community_event_id || 0)}">Edit</button> <button class="btn" type="button" data-delete-event="${Number(row.community_event_id || 0)}">Delete</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="small">No event rows yet.</td></tr>';
  }

  function pickupRowsMarkup() {
    return (latest.pickup_profiles || []).map((row) => `
      <tr>
        <td>${esc(row.label)}</td>
        <td>${esc(row.pickup_mode)}</td>
        <td>${esc(row.city || row.region_label || '—')}</td>
        <td>${Number(row.appointment_only || 0) ? 'Yes' : 'No'}</td>
        <td>${esc(String(row.lead_time_hours || 0))}</td>
        <td><button class="btn" type="button" data-edit-pickup="${Number(row.pickup_profile_id || 0)}">Edit</button> <button class="btn" type="button" data-delete-pickup="${Number(row.pickup_profile_id || 0)}">Delete</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="small">No pickup rows yet.</td></tr>';
  }

  function render(message = '') {
    mount.innerHTML = [
      cardWrap('Community events, pickup, and market visibility', `<p class="small">Move the public Events and Pickup pages away from hard-coded placeholder text and into admin-managed rows that can support local SEO, marketplace timing, and safer public guidance. ${message ? `<br><strong>${esc(message)}</strong>` : ''}</p>`),
      cardWrap('Upcoming events / markets', `
        <form id="communityEventForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <input type="hidden" name="community_event_id" value="">
          <div><label class="small">Title</label><input name="title" required placeholder="Tillsonburg market table"></div>
          <div><label class="small">Type</label><select name="event_type"><option value="market">market</option><option value="popup">popup</option><option value="show">show</option><option value="pickup_window">pickup_window</option><option value="meetup">meetup</option></select></div>
          <div><label class="small">Status</label><select name="event_status"><option value="planned">planned</option><option value="live">live</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select></div>
          <div><label class="small">Starts at</label><input name="starts_at" placeholder="2026-05-15 10:00"></div>
          <div><label class="small">Ends at</label><input name="ends_at" placeholder="2026-05-15 16:00"></div>
          <div><label class="small">Venue</label><input name="venue_name" placeholder="Community market"></div>
          <div><label class="small">City</label><input name="city" placeholder="Tillsonburg"></div>
          <div><label class="small">Region label</label><input name="region_label" placeholder="Oxford County"></div>
          <div><label class="small">Event URL</label><input name="event_url" placeholder="https://..."></div>
          <div><label class="small">Sort order</label><input name="sort_order" type="number" value="0"></div>
          <div><label class="small"><input name="pickup_supported" type="checkbox"> Pickup supported</label><br><label class="small"><input name="is_featured" type="checkbox"> Featured</label><br><label class="small"><input name="is_active" type="checkbox" checked> Active</label></div>
          <div style="grid-column:1/-1"><label class="small">Public note</label><textarea name="public_note" rows="2" placeholder="What buyers should know before attending or asking about this event."></textarea></div>
          <div style="grid-column:1/-1"><label class="small">Sale channel note</label><textarea name="sale_channel_note" rows="2" placeholder="Explain handmade vs vintage/collectible mix, marketplace tie-ins, or pickup conditions."></textarea></div>
          <div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Save event</button><button class="btn" id="communityEventReset" type="button">Clear</button></div>
        </form>
        <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Location</th><th>Starts</th><th>Actions</th></tr></thead><tbody>${eventRowsMarkup()}</tbody></table></div>
      `),
      cardWrap('Pickup profiles', `
        <form id="pickupProfileForm" class="admin-form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <input type="hidden" name="pickup_profile_id" value="">
          <div><label class="small">Label</label><input name="label" required placeholder="Tillsonburg appointment pickup"></div>
          <div><label class="small">Mode</label><select name="pickup_mode"><option value="appointment">appointment</option><option value="event">event</option><option value="market">market</option><option value="porch">porch</option><option value="hybrid">hybrid</option></select></div>
          <div><label class="small">City</label><input name="city" placeholder="Tillsonburg"></div>
          <div><label class="small">Region label</label><input name="region_label" placeholder="Oxford County"></div>
          <div><label class="small">Lead time hours</label><input name="lead_time_hours" type="number" value="24"></div>
          <div><label class="small">Map URL</label><input name="map_url" placeholder="https://..."></div>
          <div><label class="small">Sort order</label><input name="sort_order" type="number" value="0"></div>
          <div><label class="small"><input name="appointment_only" type="checkbox" checked> Appointment only</label><br><label class="small"><input name="is_active" type="checkbox" checked> Active</label></div>
          <div style="grid-column:1/-1"><label class="small">Public note</label><textarea name="public_note" rows="2" placeholder="General pickup guidance for this location/profile."></textarea></div>
          <div style="grid-column:1/-1"><label class="small">Availability note</label><textarea name="availability_note" rows="2" placeholder="Handmade timelines, hybrid listings, external-only reminders, etc."></textarea></div>
          <div style="grid-column:1/-1"><label class="small">Contact hint</label><input name="contact_hint" placeholder="Please confirm item availability before travelling."></div>
          <div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Save pickup profile</button><button class="btn" id="pickupProfileReset" type="button">Clear</button></div>
        </form>
        <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Label</th><th>Mode</th><th>Location</th><th>Appointment</th><th>Lead hrs</th><th>Actions</th></tr></thead><tbody>${pickupRowsMarkup()}</tbody></table></div>
      `)
    ].join('');
    wire();
  }

  function fillForm(form, row) {
    Object.entries(row).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Number(value || 0) === 1;
      else field.value = value == null ? '' : String(value);
    });
  }

  async function request(payload) {
    const response = await fetch('/api/admin/community-content', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'Save failed.');
    return data;
  }

  function wire() {
    const eventForm = document.getElementById('communityEventForm');
    const pickupForm = document.getElementById('pickupProfileForm');
    const eventReset = document.getElementById('communityEventReset');
    const pickupReset = document.getElementById('pickupProfileReset');

    eventForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(eventForm);
      const payload = Object.fromEntries(fd.entries());
      payload.action = 'save_event';
      payload.pickup_supported = eventForm.elements.pickup_supported.checked;
      payload.is_featured = eventForm.elements.is_featured.checked;
      payload.is_active = eventForm.elements.is_active.checked;
      try {
        await request(payload);
        await load('Event saved.');
      } catch (error) {
        render(error.message || 'Event save failed.');
      }
    });

    pickupForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(pickupForm);
      const payload = Object.fromEntries(fd.entries());
      payload.action = 'save_pickup_profile';
      payload.appointment_only = pickupForm.elements.appointment_only.checked;
      payload.is_active = pickupForm.elements.is_active.checked;
      try {
        await request(payload);
        await load('Pickup profile saved.');
      } catch (error) {
        render(error.message || 'Pickup profile save failed.');
      }
    });

    eventReset?.addEventListener('click', () => eventForm?.reset());
    pickupReset?.addEventListener('click', () => pickupForm?.reset());

    mount.querySelectorAll('[data-edit-event]').forEach((button) => button.addEventListener('click', () => {
      const row = (latest.events || []).find((item) => Number(item.community_event_id || 0) === Number(button.getAttribute('data-edit-event') || 0));
      if (row && eventForm) fillForm(eventForm, row);
    }));
    mount.querySelectorAll('[data-delete-event]').forEach((button) => button.addEventListener('click', async () => {
      try {
        await request({ action: 'delete_event', community_event_id: Number(button.getAttribute('data-delete-event') || 0) });
        await load('Event deleted.');
      } catch (error) {
        render(error.message || 'Event delete failed.');
      }
    }));
    mount.querySelectorAll('[data-edit-pickup]').forEach((button) => button.addEventListener('click', () => {
      const row = (latest.pickup_profiles || []).find((item) => Number(item.pickup_profile_id || 0) === Number(button.getAttribute('data-edit-pickup') || 0));
      if (row && pickupForm) fillForm(pickupForm, row);
    }));
    mount.querySelectorAll('[data-delete-pickup]').forEach((button) => button.addEventListener('click', async () => {
      try {
        await request({ action: 'delete_pickup_profile', pickup_profile_id: Number(button.getAttribute('data-delete-pickup') || 0) });
        await load('Pickup profile deleted.');
      } catch (error) {
        render(error.message || 'Pickup profile delete failed.');
      }
    }));
  }

  async function load(message = '') {
    try {
      const response = await fetch('/api/admin/community-content', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Community content could not be loaded.');
      latest = { events: Array.isArray(data.events) ? data.events : [], pickup_profiles: Array.isArray(data.pickup_profiles) ? data.pickup_profiles : [] };
      render(message);
    } catch (error) {
      render(error.message || 'Community content could not be loaded.');
    }
  }

  load();
})();
