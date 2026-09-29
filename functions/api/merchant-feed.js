// Release 467 Build 298 — public reviewed Google Merchant-compatible feed/export.
// This route never submits to Google or another provider.
import { getDb, jsonResponse } from './_lib/adminAudit.js';
import { merchantCoverage, merchantRssXml, merchantTsv } from './_lib/merchantSearchDistribution.js';
export async function onRequestGet(context){
  const db=getDb(context.env);
  const coverage=await merchantCoverage(db,context.env);
  const format=String(new URL(context.request.url).searchParams.get('format')||'xml').toLowerCase();
  if(format==='json')return jsonResponse({ok:true,release:467,build:298,provider_execution:false,review_first:true,feed_url:'https://devilndove.com/api/merchant-feed',...coverage},200,{'Cache-Control':'public, max-age=900, stale-while-revalidate=3600','X-DD-Merchant-Feed':'reviewed-v298'});
  if(format==='tsv')return new Response(merchantTsv(coverage),{status:200,headers:{'Content-Type':'text/tab-separated-values; charset=utf-8','Content-Disposition':'inline; filename="devilndove-google-merchant-canada.tsv"','Cache-Control':'public, max-age=900, stale-while-revalidate=3600','X-DD-Merchant-Feed':'reviewed-v298'}});
  return new Response(merchantRssXml(coverage),{status:200,headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=900, stale-while-revalidate=3600','X-DD-Merchant-Feed':'reviewed-v298','X-DD-Merchant-Eligible':String(coverage.summary?.eligible||0)}});
}
