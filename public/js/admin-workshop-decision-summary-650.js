(() => {
  'use strict';
  const get = id => document.getElementById(`dd650${id}`);
  if (!get('Review') || !window.DDAuth?.apiFetch ||
      !window.DD641OwnerPlans?.subscribe || !window.DD641OwnerPlans?.snapshot ||
      !window.DD641OwnerPlans?.reopen) return;
  const ui = Object.fromEntries(['Plan','Review','Refresh','Clear','Status','Summary',
    'Freshness','Guidance','Reopen'].map(id => [id, get(id)]));
  const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const categories = {
    needs_physical_count: ['Physical count needed', 'Check actual stock and qualified order commitments in their original records before any count correction.'],
    needs_supplier_review: ['Supplier review needed', 'Review supplier availability and purchasing authority separately. This note is not an approved order.'],
    needs_workshop_review: ['Workshop review needed', 'Inspect actual workbench evidence and the current saved plan before choosing the next action.'],
    follow_up_scheduled: ['Follow-up scheduled', 'Check the saved date; reopen the original editor if a separate date or status Save is needed.'],
    no_change_recommended: ['No stock change recommended', 'Keep the recommendation distinct from a physical count. Review again if current evidence changes.'],
    separate_action_recommended: ['Separate action recommended', 'Use the appropriate separately authorized workflow after checking its source evidence. Nothing is approved here.']
  };
  const statuses = new Set(['draft','follow_up','blocked','completed']);
  const dateOK = v => typeof v === 'string' && (!v ||
    (/^20\d{2}-\d{2}-\d{2}$/.test(v) &&
     !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
     new Date(`${v}T00:00:00Z`).toISOString().slice(0,10) === v));
  const safe = v => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  let source = null, checked = null, busy = false, sequence = 0;
  const message = text => { ui.Status.textContent = text; };
  const plan = () => source?.plans.find(p => p.id === ui.Plan.value) || null;
  function normalize(snapshot) {
    if (snapshot?.loaded !== true || !safe(snapshot.owner_user_id) ||
        snapshot.owner_user_id < 1 || !safe(snapshot.version) ||
        !Array.isArray(snapshot.plans) || snapshot.plans.length > 20) return null;
    const seen = new Set(), plans = [];
    for (const p of snapshot.plans) {
      if (!idPattern.test(p?.plan_id || '') || seen.has(p.plan_id) ||
          typeof p.title !== 'string' || p.title.length < 4 || p.title.length > 100 ||
          !statuses.has(p.status) || !dateOK(p.follow_up_on)) return null;
      seen.add(p.plan_id);
      plans.push({id:p.plan_id,title:p.title,status:p.status,due:p.follow_up_on});
    }
    return {owner:snapshot.owner_user_id,version:snapshot.version,plans};
  }
  const current = () => !!source &&
    JSON.stringify(source) === JSON.stringify(normalize(window.DD641OwnerPlans.snapshot()));
  function clear(reason = 'Private summary cleared. No saved record was changed.') {
    sequence++;
    checked = null; busy = false;
    ui.Summary.textContent = 'No current, verified owner decision summary.';
    ui.Freshness.textContent = 'Not checked. Saved decisions may have changed.';
    ui.Guidance.textContent = 'Choose a plan and explicitly review its private dated decisions.';
    ui.Reopen.disabled = true;
    ui.Refresh.disabled = !plan();
    ui.Clear.disabled = !source;
    message(reason);
  }
  function verify(data, selected, now) {
    const summary = data?.summary, events = data?.events;
    if (data?.build !== 643 || data.ok !== true || data.private !== true ||
        data.read_only !== true || data.automatic !== false ||
        data.inventory_mutation !== false || data.owner_user_id !== source.owner ||
        data.plan_id !== selected.id || data.plan_version !== source.version ||
        !safe(data.timeline_version) || !safe(data.matched_total) ||
        data.matched_total > 50 || !Array.isArray(events) || events.length > 10 ||
        !summary || !safe(summary.review_count) || summary.review_count > 50 ||
        summary.review_count !== data.matched_total ||
        summary.plan_status !== selected.status ||
        summary.plan_follow_up_on !== selected.due ||
        summary.advisory_only !== true || summary.inventory_mutation !== false ||
        summary.order_mutation !== false || data.search?.q !== '' ||
        data.search?.outcome !== '' || !summary.outcome_counts ||
        Object.keys(summary.outcome_counts).length !== 6 ||
        Object.keys(categories).some(k => !safe(summary.outcome_counts[k]) ||
          summary.outcome_counts[k] > 50) ||
        Object.values(summary.outcome_counts).reduce((a,b) => a+b,0) !== summary.review_count ||
        events.length !== Math.min(10,summary.review_count) ||
        (data.next_cursor !== null && (events.length !== 10 ||
          data.next_cursor !== events.at(-1)?.event_id)) ||
        (data.next_cursor === null && summary.review_count > 10)) return null;
    const seen = new Set(); let prior = Infinity;
    for (const e of events) {
      const time = Date.parse(e?.recorded_at);
      if (!idPattern.test(e?.event_id || '') || seen.has(e.event_id) ||
          !Object.hasOwn(categories,e.outcome) || typeof e.note !== 'string' ||
          e.note.trim().length < 8 || e.note.length > 300 ||
          typeof e.recorded_at !== 'string' || !Number.isFinite(time) ||
          time > now + 600000 || time > prior || !safe(e.plan_version) ||
          e.plan_version < 1 || e.plan_version > source.version ||
          !statuses.has(e.status_at_review) || !dateOK(e.follow_up_on_at_review)) return null;
      seen.add(e.event_id); prior = time;
    }
    if (summary.latest_outcome !== (events[0]?.outcome || null) ||
        summary.latest_review_at !== (events[0]?.recorded_at || null) ||
        (summary.review_count === 0 && data.timeline_version !== 0)) return null;
    return {timeline:data.timeline_version,total:summary.review_count,
      counts:{...summary.outcome_counts},events:events.map(e=>({at:e.recorded_at,
        category:e.outcome})),asOf:now,selected:{...selected},
      owner:source.owner,version:source.version};
  }
  function display() {
    if (!checked || !current() || plan()?.id !== checked.selected.id) return;
    const {events,counts,total,timeline,asOf,selected} = checked;
    const latest = events[0], previous = events[1];
    const currentDay = new Date(asOf).toISOString().slice(0,10);
    const dueDays = selected.due ? Math.round((Date.parse(`${selected.due}T00:00:00Z`) -
      Date.parse(`${currentDay}T00:00:00Z`))/86400000) : null;
    const label = latest ? categories[latest.category][0] : 'No saved dated decision';
    const totals = Object.entries(categories).map(([key,value])=>`${value[0]}: ${counts[key]}`).join(' · ');
    ui.Summary.textContent = `Plan: ${selected.title} · saved plan v${checked.version} · `+
      `review timeline v${timeline} · ${total} recorded review(s), latest: ${label}. `+
      `${totals}. ${Math.min(total,10)} most recent records checked; older private notes `+
      `${total > 10 ? 'are not included in this view.' : 'are included in the counts.'} `+
      'All outcomes are owner-reported planning recommendations.';
    const ageDays = latest ? Math.max(0,Math.floor((asOf-Date.parse(latest.at))/86400000)) : null;
    const age = ageDays === null ? 'No saved review date exists.' :
      `Most recent saved review: ${new Date(latest.at).toLocaleString()} (${ageDays} day(s) ago). `+
      (ageDays > 7 ? 'Review age exceeds seven days; check current facts.' :
        'Age is informational, not proof that the facts remain current.');
    ui.Freshness.textContent = `Checked at ${new Date(asOf).toLocaleString()} (one manual read). `+
      `${age} Refresh deliberately after another owner saves a decision. `+
      'No background refresh or live-stock verification is performed.';
    const change = latest && previous && latest.category !== previous.category ?
      ` The two most recent recorded outcomes differ (${categories[previous.category][0]} → ${label}); `+
      'this is a recorded recommendation change, not an actual stock change.' : '';
    const due = dueDays === null ? 'The saved plan has no follow-up date.' :
      dueDays < 0 ? `The saved plan follow-up was due ${-dueDays} day(s) ago.` :
      dueDays === 0 ? 'The saved plan follow-up date is today.' :
      `The saved plan follow-up is in ${dueDays} day(s).`;
    ui.Guidance.textContent = `${due} Saved status: ${selected.status.replaceAll('_',' ')}. `+
      (latest ? categories[latest.category][1] :
        'Use the separate dated-review editor to record an explicit factual owner recommendation if needed.')+
      change + ' Review Build 649 private history for the underlying notes. ' +
      'Reopening the plan never saves a change; actual stock, suppliers, payments and publishing have separate approval.';
    ui.Reopen.disabled = false;
    ui.Refresh.disabled = false;
  }
  async function review() {
    if (busy || !current() || !plan()) return;
    const selected = {...plan()}, owner = source.owner, version = source.version, ticket = ++sequence;
    checked = null; busy = true; ui.Refresh.disabled = true; ui.Reopen.disabled = true;
    ui.Summary.textContent = 'Checking private saved decisions…';
    ui.Freshness.textContent = 'Awaiting verified source and timeline.';
    ui.Guidance.textContent = 'No recommendation is shown until verification succeeds.';
    message('Loading one authenticated private review page.');
    try {
      const response = await window.DDAuth.apiFetch(
        `/api/admin/owner-restock-review-notes?plan_id=${encodeURIComponent(selected.id)}`,
        {method:'GET',cache:'no-store'});
      const data = await response.json().catch(()=>null);
      if (ticket !== sequence || !current() || source.owner !== owner ||
          source.version !== version || plan()?.id !== selected.id) return;
      if (!response.ok) throw Error('Private dated reviews unavailable.');
      const result = verify(data,selected,Date.now());
      if (!result) throw Error('Saved owner or timeline evidence did not match.');
      checked = result; display();
      message('Verified read-only summary. Check source dates before acting; no record was saved.');
    } catch (error) {
      if (ticket === sequence) clear(`HOLD — ${error.message} Reload owner plans and review explicitly; no automatic retry.`);
    } finally {
      if (ticket === sequence) {busy = false; ui.Refresh.disabled = !plan();}
    }
  }
  ui.Plan.addEventListener('change',()=>clear('Saved plan selection changed. Review its own dated decisions explicitly.'));
  ui.Refresh.addEventListener('click',()=>void review());
  ui.Clear.addEventListener('click',()=>clear());
  ui.Reopen.addEventListener('click',()=>{
    if (!checked || !current() || plan()?.id !== checked.selected.id) return;
    if (window.DD641OwnerPlans.reopen(checked.selected.id) !== true) {
      clear('HOLD — original owner editor could not be opened.'); return;
    }
    message('Original owner plan reopened. Any update requires a separate deliberate Save.');
  });
  window.DD641OwnerPlans.subscribe(snapshot=>{
    const next = normalize(snapshot), changed = JSON.stringify(next) !== JSON.stringify(source);
    source = next;
    if (!changed) return;
    ui.Plan.innerHTML = '<option value="">Choose a saved owner plan</option>';
    for (const p of source?.plans || []) {
      const option = document.createElement('option');
      option.value = p.id; option.textContent = `${p.title} (${p.status.replaceAll('_',' ')})`;
      ui.Plan.appendChild(option);
    }
    ui.Plan.value = '';
    ui.Plan.disabled = !source;
    clear(source ? 'Verified owner plans loaded. Choose one for a deliberate decision review.' :
      'HOLD — verified owner plans unavailable. No private summary displayed.');
  });
})();
