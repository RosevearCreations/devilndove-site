// Release 457 — read-only Financials operations intelligence.
document.addEventListener('DOMContentLoaded', () => {
  const mount=document.getElementById('accountingOperationsMount');
  if(!mount||!window.DDAuth)return;
  const RELEASE=457;
  const urls=(month)=>({
    salesTax:`/api/admin/accounting-reconciliation?type=sales_tax&period_month=${encodeURIComponent(month)}`,
    processorFees:`/api/admin/accounting-reconciliation?type=processor_fees&period_month=${encodeURIComponent(month)}`,
    shipping:`/api/admin/accounting-reconciliation?type=shipping&period_month=${encodeURIComponent(month)}`,
    exceptions:`/api/admin/accounting-reconciliation-exceptions?period_month=${encodeURIComponent(month)}&limit=250`,
    imports:`/api/admin/accounting-statement-imports?period_month=${encodeURIComponent(month)}`,
    profitLoss:`/api/admin/accounting-profit-loss?month=${encodeURIComponent(month)}`,
    costing:`/api/admin/accounting-item-costing?month=${encodeURIComponent(month)}`,
    locks:'/api/admin/accounting-period-locks?limit=18',
    gifi:`/api/admin/accounting-gifi-summary?year=${encodeURIComponent(month.slice(0,4))}`,
  });
  mount.innerHTML=`<section class="card accounting-ops" id="financial-operations" aria-labelledby="financialOperationsHeading">
    <div class="accounting-ops-head"><div><p class="eyebrow">Release ${RELEASE} • read-only operations intelligence</p>
    <h2 id="financialOperationsHeading">Financial operations queue</h2>
    <p class="small">Reconciliation, statement, commerce-cost, close and reporting exceptions are projected here without creating a second ledger or write authority.</p></div>
    <div class="accounting-ops-period"><label for="accountingOpsMonth">Review month</label><input id="accountingOpsMonth" type="month"><button class="btn" id="accountingOpsRefresh" type="button">Refresh</button></div></div>
    <div id="accountingOpsStatus" class="small" aria-live="polite" role="status" data-admin-workspace-status data-admin-retry-action="reload">Loading financial operations…</div>
    <div class="accounting-ops-summary" id="accountingOpsSummary"></div><div class="accounting-ops-snapshot" id="accountingOpsSnapshot"></div><div class="accounting-ops-queue" id="accountingOpsQueue"></div>
    <p class="small accounting-ops-authority">Write authority duplicated: <strong>no</strong>. Existing Accounting, reconciliation, import, costing and close workflows remain the only write owners.</p></section>`;
  const monthEl=mount.querySelector('#accountingOpsMonth'),status=mount.querySelector('#accountingOpsStatus'),summary=mount.querySelector('#accountingOpsSummary'),snapshot=mount.querySelector('#accountingOpsSnapshot'),queue=mount.querySelector('#accountingOpsQueue');
  monthEl.value=new Date().toISOString().slice(0,7);
  const arr=(v)=>Array.isArray(v)?v:[],num=(v)=>Math.max(0,Number(v||0)||0),esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const money=(c)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(c||0)/100);
  async function read(url){const r=await window.DDAuth.apiFetch(url);const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw new Error(d?.error||`Read failed: ${url}`);return d;}
  const issue=(priority,title,detail,href,owner)=>({priority,title,detail,href,owner});
  function reconciliationIssues(label,data){
    const out=[];
    for(const row of arr(data?.rows)){
      const unresolved=num(row.unresolved_item_count),difference=Math.abs(Number(row.difference_cents||0)),tolerance=num(row.tolerance_cents);
      if(unresolved||difference>tolerance)out.push(issue(difference>Math.max(tolerance*3,1500)?'high':'medium',`${label}: ${row.label||row.scope_key||'review'}`,`${unresolved} unresolved • difference ${money(row.difference_cents||0)} • tolerance ${money(tolerance)}`,'#accountingReconciliationCard','Reconciliation'));
      const activity=num(row.statement_amount_cents)||num(row.book_amount_cents)||num(row.payment_count)||num(row.order_count);
      if(activity&&!num(row.attachment_count)&&!num(row.statement_count))out.push(issue('medium',`${label}: statement evidence missing`,`${row.scope_key||'all'} has financial activity but no statement attachment is associated with this reconciliation.`,'#accountingAttachmentsCard','Evidence'));
    }
    return out;
  }
  function renderSummary(s){
    summary.innerHTML=[['Open exceptions',s.exceptions,'#reconciliationExceptionsCard'],['Unresolved reconciliation',s.reconciliation,'#accountingReconciliationCard'],['Cost gaps',s.costGaps,'#item-costing'],['Close blockers',s.closeBlockers,'#period-locks'],['Evidence gaps',s.evidenceGaps,'#accountingAttachmentsCard']]
      .map(([label,value,href])=>`<a class="accounting-ops-stat" href="${href}"><span>${esc(label)}</span><strong>${esc(value)}</strong></a>`).join('');
  }
  function renderSnapshot(pl,costing,imports){
    const p=pl?.summary||{},c=costing?.summary||{};
    const recognized=Math.round(Number(p.recognized_amount||0)*100);
    const nonCogs=num(p.operating_expense_cents)+num(p.operating_expense_tax_cents)+num(p.writeoff_cents);
    const fullCogs=num(c.estimated_recognized_full_cogs_cents);
    const operating=recognized-nonCogs-fullCogs; // full COGS already includes allocated overhead; do not subtract overhead again.
    const statementFees=arr(imports?.imports).reduce((sum,row)=>sum+Number(row.fee_cents||0),0);
    snapshot.innerHTML=`<div><span>Recognized revenue</span><strong>${esc(money(recognized))}</strong></div><div><span>Non-COGS operating costs</span><strong>${esc(money(nonCogs))}</strong></div><div><span>Recognized full COGS</span><strong>${esc(money(fullCogs))}</strong></div><div><span>Imported provider fees</span><strong>${esc(money(statementFees))}</strong></div><div class="${operating<0?'negative':''}"><span>Rough operating result</span><strong>${esc(money(operating))}</strong></div>`;
  }
  function renderQueue(issues,failures){
    const order={high:0,medium:1,low:2};issues.sort((a,b)=>(order[a.priority]??9)-(order[b.priority]??9)||a.title.localeCompare(b.title));
    queue.innerHTML=issues.length?issues.map(x=>`<a class="accounting-ops-item priority-${esc(x.priority)}" href="${esc(x.href)}"><span class="accounting-ops-priority">${esc(x.priority)}</span><span class="accounting-ops-item-body"><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small></span><span class="accounting-ops-owner">${esc(x.owner)}</span></a>`).join(''):'<div class="accounting-ops-empty"><strong>No financial exceptions are currently derived for this month.</strong><span>Normal accounting work remains in the owner sections below.</span></div>';
    status.textContent=`Financial operations refreshed.${failures.length?` ${failures.length} read source${failures.length===1?'':'s'} unavailable; the queue is partial.`:''}`;
    status.dataset.state=failures.length?'warning':(issues.length?'ready':'empty');
  }
  async function refresh(){
    const month=monthEl.value||new Date().toISOString().slice(0,7);status.textContent=`Loading ${month} financial operations…`;status.dataset.state='loading';
    const entries=Object.entries(urls(month)),settled=await Promise.allSettled(entries.map(([,url])=>read(url))),data={},failures=[];
    settled.forEach((r,i)=>r.status==='fulfilled'?data[entries[i][0]]=r.value:failures.push(entries[i][0]));
    const issues=[...reconciliationIssues('Sales tax',data.salesTax),...reconciliationIssues('Processor fees',data.processorFees),...reconciliationIssues('Shipping',data.shipping)];
    const open=arr(data.exceptions?.exceptions).filter(r=>!['resolved','ignored'].includes(String(r.exception_status||'').toLowerCase()));
    open.forEach(r=>issues.push(issue(String(r.severity||'').toLowerCase()==='critical'?'high':'medium',`Reconciliation exception: ${r.reconciliation_type||r.reference_label||'review'}`,`${r.scope_key||'all'} • ${r.period_month||month} • ${money(r.difference_cents||0)} difference • ${r.exception_status||'open'}`,'#reconciliationExceptionsCard','Exceptions'));
    const c=data.costing?.summary||{},uncosted=num(c.uncosted_product_count),missing=num(c.missing_cost_link_count),negative=num(c.negative_margin_count);
    if(uncosted)issues.push(issue('high','Sold/Product costing incomplete',`${uncosted} product${uncosted===1?'':'s'} are uncosted for the monthly costing view.`,'#item-costing','Costing'));
    if(missing)issues.push(issue('medium','Product cost links incomplete',`${missing} product${missing===1?'':'s'} are missing cost-resource linkage.`,'#product-costs','Costing'));
    if(negative)issues.push(issue('medium','Negative margin review',`${negative} product${negative===1?'':'s'} currently derive a negative margin.`,'#item-costing','Performance'));
    const unmapped=num(data.gifi?.summary?.unmapped_line_count);if(unmapped)issues.push(issue('medium','GIFI mapping incomplete',`${unmapped} ledger line${unmapped===1?'':'s'} remain unmapped for ${month.slice(0,4)}.`,'#gifi-staging','Reporting'));
    const current=arr(data.locks?.closures).find(r=>String(r.period_month||'')===month);let closeBlockers=0;
    if(current){const checklist=current.close_checklist||{},keys=['bank_reconciled','sales_tax_reviewed','receipts_attached','gifi_reviewed','schedule_141_notes_started','accountant_followup_flagged'];closeBlockers=keys.reduce((n,k)=>n+(Number(checklist[k]||0)===1?0:1),0);if(String(current.lock_state||'').toLowerCase()!=='locked'&&closeBlockers)issues.push(issue('medium','Month close checklist incomplete',`${closeBlockers} close checklist item${closeBlockers===1?'':'s'} remain before ${month} can be treated as closed.`,'#period-locks','Close'));}else{closeBlockers=1;issues.push(issue('low','Month close record not started',`No period-lock/close record is present for ${month}.`,'#period-locks','Close'));}
    const reconciliation=num(data.salesTax?.summary?.unresolved_row_count)+num(data.processorFees?.summary?.unresolved_row_count)+num(data.shipping?.summary?.unresolved_row_count);
    renderSummary({exceptions:open.length,reconciliation,costGaps:uncosted+missing+negative,closeBlockers,evidenceGaps:issues.filter(x=>x.owner==='Evidence').length});
    renderSnapshot(data.profitLoss,data.costing,data.imports);renderQueue(issues,failures);
  }
  const fail=(e)=>{status.textContent=e?.message||'Financial operations could not be loaded.';status.dataset.state='error';};
  mount.querySelector('#accountingOpsRefresh')?.addEventListener('click',()=>refresh().catch(fail));monthEl.addEventListener('change',()=>refresh().catch(fail));refresh().catch(fail);
});
