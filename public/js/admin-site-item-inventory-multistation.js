(() => {
  'use strict';

  const API_PATH = '/api/admin/site-item-inventory';
  const ROW_SELECTOR = '[data-inventory-row]';
  const LEGACY_ROW_SELECT = '[data-field="workstation_site_item_inventory_id"]';
  const FULL_SELECT_ID = 'siteInventoryParentStation';
  let pendingFormIds = [];
  let scheduled = false;

  function uniqIds(value) {
    const raw = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
    return [...new Set(raw.map((v) => Number(v || 0)).filter((id) => Number.isInteger(id) && id > 0))];
  }

  function parseItem(button) {
    try { return JSON.parse(button?.getAttribute('data-item') || '{}'); } catch { return {}; }
  }

  function itemIdsFromRow(row) {
    const button = row?.querySelector('[data-save-row-id][data-item], [data-load-form-id][data-item]');
    const item = parseItem(button);
    return uniqIds(item.workstation_site_item_inventory_ids || item.workstation_site_item_inventory_id || []);
  }

  function currentChecked(container) {
    if (!container) return [];
    return uniqIds(Array.from(container.querySelectorAll('input[type="checkbox"][data-station-id]:checked')).map((el) => el.dataset.stationId));
  }

  function candidatesFromSelect(select) {
    return Array.from(select?.options || [])
      .map((option) => ({ id: Number(option.value || 0), label: String(option.textContent || '').trim() }))
      .filter((row) => row.id > 0);
  }

  function syncLegacySelect(select, ids) {
    if (!select) return;
    const first = uniqIds(ids)[0] || 0;
    select.value = first ? String(first) : '';
  }

  function checklistMarkup(candidates, selectedIds, disabled, inputName) {
    const chosen = new Set(uniqIds(selectedIds));
    if (disabled) return '<div class="dd-multistation-empty">This tool is a workstation. Associated items can link to it.</div>';
    if (!candidates.length) return '<div class="dd-multistation-empty">No workstation tools have been marked in this category yet.</div>';
    return candidates.map((station) => `
      <label class="dd-multistation-choice">
        <input type="checkbox" name="${inputName}" data-station-id="${station.id}" value="${station.id}" ${chosen.has(station.id) ? 'checked' : ''}/>
        <span>${escapeHtml(station.label || ('Inventory #' + station.id))}</span>
      </label>
    `).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function transformRow(row) {
    const select = row?.querySelector(LEGACY_ROW_SELECT);
    if (!select) return;
    const role = row.querySelector('[data-field="workstation_role"]');
    const roleIsStation = String(role?.value || '') === 'station';
    const label = select.closest('label');
    if (label?.firstChild?.nodeType === Node.TEXT_NODE) label.firstChild.nodeValue = 'Specific station tools';
    const existing = row.querySelector('[data-multistation-row]');
    const priorChecked = currentChecked(existing);
    const selected = priorChecked.length ? priorChecked : itemIdsFromRow(row);
    const candidates = candidatesFromSelect(select);
    select.hidden = true;
    select.setAttribute('aria-hidden','true');
    select.tabIndex = -1;

    const box = existing || document.createElement('div');
    box.className = 'dd-multistation-checklist';
    box.dataset.multistationRow = String(row.dataset.inventoryRow || '');
    box.innerHTML = checklistMarkup(candidates, selected, roleIsStation, 'inventory-row-station');
    if (!existing) select.insertAdjacentElement('afterend', box);

    const activeIds = roleIsStation ? [] : currentChecked(box);
    syncLegacySelect(select, activeIds);
  }

  function transformFullForm() {
    const select = document.getElementById(FULL_SELECT_ID);
    if (!select) return;
    const role = document.getElementById('siteInventoryWorkstationRole');
    const roleIsStation = String(role?.value || '') === 'station';
    const fullLabel = document.querySelector('label[for="siteInventoryParentStation"]');
    if (fullLabel && fullLabel.textContent !== 'Specific station tools') fullLabel.textContent = 'Specific station tools';
    let box = document.getElementById('siteInventoryParentStations');
    const priorChecked = currentChecked(box);
    const selected = priorChecked.length ? priorChecked : pendingFormIds.length ? pendingFormIds : uniqIds(select.value);
    select.hidden = true;
    select.setAttribute('aria-hidden','true');
    select.tabIndex = -1;
    if (!box) {
      box = document.createElement('div');
      box.id = 'siteInventoryParentStations';
      box.className = 'dd-multistation-checklist';
      select.insertAdjacentElement('afterend', box);
    }
    box.innerHTML = checklistMarkup(candidatesFromSelect(select), selected, roleIsStation, 'siteInventoryParentStationMembership');
    const activeIds = roleIsStation ? [] : currentChecked(box);
    syncLegacySelect(select, activeIds);
  }

  let observer = null;
  let observedMount = null;
  let transforming = false;

  function observeMount() {
    if (!observer || !observedMount) return;
    observer.observe(observedMount, { childList:true, subtree:true, attributes:true, attributeFilter:['disabled'] });
  }

  function transformAll() {
    if (transforming) return;
    transforming = true;
    if (observer) observer.disconnect();
    try {
      document.querySelectorAll(ROW_SELECTOR).forEach(transformRow);
      transformFullForm();
    } finally {
      if (observer) observer.takeRecords();
      observeMount();
      transforming = false;
    }
  }

  function scheduleTransform() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      transformAll();
    });
  }

  document.addEventListener('change', (event) => {
    const checkbox = event.target.closest?.('input[type="checkbox"][data-station-id]');
    if (checkbox) {
      const box = checkbox.closest('.dd-multistation-checklist');
      const row = checkbox.closest(ROW_SELECTOR);
      if (row) syncLegacySelect(row.querySelector(LEGACY_ROW_SELECT), currentChecked(box));
      else syncLegacySelect(document.getElementById(FULL_SELECT_ID), currentChecked(box));
      return;
    }

    if (event.target.matches?.('[data-field="inventory_process_id"],[data-field="workstation_role"],[data-field="source_type"],#siteInventoryCategoryPreset,#siteInventoryWorkstationRole,#siteInventorySourceType')) {
      setTimeout(scheduleTransform, 0);
    }
  }, true);

  document.addEventListener('click', (event) => {
    const fullEdit = event.target.closest?.('[data-load-form-id][data-item]');
    if (fullEdit) {
      const item = parseItem(fullEdit);
      pendingFormIds = uniqIds(item.workstation_site_item_inventory_ids || item.workstation_site_item_inventory_id || []);
      setTimeout(scheduleTransform, 0);
      return;
    }
    if (event.target.closest?.('#siteInventoryResetButton, [data-site-inventory-new]')) {
      pendingFormIds = [];
      setTimeout(scheduleTransform, 0);
    }
  }, true);

  // Build 290: the primary Inventory client now sends workstation_site_item_inventory_ids
  // directly. The former window.fetch interception is intentionally retired; this helper
  // remains only as the compatibility renderer for the multi-select checklist.
  observer = new MutationObserver((records) => {
    if (transforming) return;
    const relevant = records.some((record) => {
      const target = record.target instanceof Element ? record.target : record.target?.parentElement;
      return !target?.closest?.('.dd-multistation-checklist');
    });
    if (relevant) scheduleTransform();
  });
  const begin = () => {
    observedMount = document.getElementById('siteInventoryAdminMount') || document.body;
    observeMount();
    scheduleTransform();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, { once:true });
  else begin();

  const style = document.createElement('style');
  style.textContent = `
    .dd-multistation-checklist{display:grid;gap:6px;margin-top:6px;padding:8px;border:1px solid rgba(148,163,184,.28);border-radius:8px;max-height:180px;overflow:auto}
    .dd-multistation-choice{display:flex;align-items:flex-start;gap:8px;font-size:.85rem;line-height:1.25;cursor:pointer}
    .dd-multistation-choice input{width:auto!important;min-width:auto!important;margin-top:2px}
    .dd-multistation-empty{font-size:.78rem;opacity:.8;line-height:1.3}
    .site-inventory-admin-table.dd-v237-card-mode .dd-multistation-checklist{max-height:150px}
  `;
  document.head.appendChild(style);
})();
