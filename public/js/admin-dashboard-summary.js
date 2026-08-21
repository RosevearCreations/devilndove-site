// File: /public/js/admin-dashboard-summary.js
// Build 279: dashboard summary waits for admin access and uses shared dedupe/backoff/stale-cache handling.
document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;
  const refreshButton = document.getElementById('refreshAdminSummary');
  const messageEl = document.getElementById('adminSummaryMessage');
  let isLoading = false;
  const ids = ['summaryUsersCount','summaryProductsCount','summaryOrdersCount','summaryPaymentsCount','summaryLowStockCount','summaryFailedWebhooksCount','summaryOpenDisputesCount','summaryLiveVisitorsCount','summaryRecentSearchesCount','summaryRuntimeIncidentsCount','summaryMissingFeaturedImagesCount','summaryMissingImageRolesCount','summaryMissingHeroRoleCount','summaryMissingAltTextCount','summaryBlockedPublicImagesCount','summaryMissingSeoCount'];
  const setValue = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=String(value ?? '—'); };
  const setMessage = (m, err=false) => { if(!messageEl)return; messageEl.textContent=m||''; messageEl.style.display=m?'block':'none'; messageEl.classList.toggle('is-error',Boolean(m&&err)); };
  const formatCount = (v) => Number.isFinite(Number(v)) ? Number(v).toLocaleString() : '—';
  const renderEmpty = () => ids.forEach((id)=>setValue(id,'—'));
  function renderSummary(s={}) {
    const map={summaryUsersCount:'users_count',summaryProductsCount:'products_count',summaryOrdersCount:'orders_count',summaryPaymentsCount:'payments_count',summaryLowStockCount:'low_stock_count',summaryFailedWebhooksCount:'failed_webhooks_count',summaryOpenDisputesCount:'open_disputes_count',summaryLiveVisitorsCount:'active_visitor_sessions_count',summaryRecentSearchesCount:'recent_searches_count',summaryRuntimeIncidentsCount:'recent_runtime_incidents_count',summaryMissingFeaturedImagesCount:'products_missing_featured_image_count',summaryMissingImageRolesCount:'products_missing_image_roles_count',summaryMissingHeroRoleCount:'products_missing_hero_role_count',summaryMissingAltTextCount:'products_missing_alt_text_count',summaryBlockedPublicImagesCount:'products_blocked_public_images_count',summaryMissingSeoCount:'products_missing_seo_count'};
    Object.entries(map).forEach(([id,key])=>setValue(id,formatCount(s[key])));
  }
  async function loadSummary({force=false}={}) {
    if(isLoading&&!force)return; isLoading=true; const original=refreshButton?.textContent||'Refresh Summary';
    try { setMessage('Loading dashboard summary…'); if(refreshButton){refreshButton.disabled=true;refreshButton.textContent='Loading…';}
      const d=await window.DDAuth.apiJson('/api/admin/dashboard-summary?view=compact',{method:'GET'},{fallbackMessage:'Dashboard summary is temporarily unavailable.',cacheKey:'admin-dashboard-summary',cacheTtlMs:120000,retries:0,staleOnError:true});
      renderSummary(d.summary||{}); setMessage(d?._response_meta?.stale?'Server is temporarily busy. Showing the most recent saved dashboard summary.':'',Boolean(d?._response_meta?.stale));
    } catch(e){renderEmpty();setMessage(e.message||'Failed to load dashboard summary.',true);} finally{isLoading=false;if(refreshButton){refreshButton.disabled=false;refreshButton.textContent=original;}}
  }
  refreshButton?.addEventListener('click',()=>loadSummary({force:true}));
  document.addEventListener('dd:user-updated',()=>loadSummary({force:true})); document.addEventListener('dd:order-updated',()=>loadSummary({force:true})); document.addEventListener('dd:product-updated',()=>loadSummary({force:true}));
  renderEmpty();
  if(window.DDWhenAdminReady) window.DDWhenAdminReady(()=>loadSummary(),{delayMs:100}); else document.addEventListener('dd:admin-access-granted',()=>setTimeout(()=>loadSummary(),100),{once:true});
});
