#!/usr/bin/env node
import {
  COMMERCE_POLICY,
  COMMERCE_COUNTRY_RESTRICTIONS_VERSION,
  normalizeCountryCode,
  isAllowedCommerceCountry,
  isBlockedSalesCountry,
  isBlockedShippingCountry,
  commerceCountryRestriction,
  validateCanadianAddress,
  validateCommerceEnvelope,
  policyPublicSnapshot,
} from '../public/js/commerce-policy-core.js';

let checks=0;const check=(ok,msg)=>{checks+=1;if(!ok){console.error(`FAIL: ${msg}`);process.exitCode=1;}else console.log(`PASS: ${msg}`);};
check(COMMERCE_COUNTRY_RESTRICTIONS_VERSION==='R467B124_V1','Build 124 country-restriction identity is stable');
check(COMMERCE_POLICY.market_strategy==='CANADA_FIRST' && COMMERCE_POLICY.future_market_expansion==='REVIEW_BEFORE_ENABLE','Canada-first strategy does not auto-open other markets');
check(COMMERCE_POLICY.allowed_shipping_country_codes.join(',')==='CA' && COMMERCE_POLICY.allowed_billing_country_codes.join(',')==='CA','existing Canada-only checkout boundary remains authoritative');
check(COMMERCE_POLICY.blocked_sales_country_codes.join(',')==='US' && COMMERCE_POLICY.blocked_shipping_country_codes.join(',')==='US','U.S. sales and shipping are explicitly blocked');
check(COMMERCE_POLICY.united_states_sales_enabled===false && COMMERCE_POLICY.united_states_shipping_enabled===false,'U.S. enable flags remain false');
check(normalizeCountryCode('United States')==='US' && normalizeCountryCode('USA')==='US' && normalizeCountryCode('U.S.')==='US','U.S. country aliases normalize to US');
check(isAllowedCommerceCountry('Canada')===true && isAllowedCommerceCountry('US')===false,'Canada is allowed and U.S. is not');
check(isBlockedSalesCountry('United States')===true && isBlockedShippingCountry('USA')===true,'explicit blocked-country helpers identify U.S.');
const restriction=commerceCountryRestriction('United States',{purpose:'shipping'});check(restriction?.reason==='TEMPORARY_TARIFF_RESTRICTION' && restriction?.temporary===true,'U.S. restriction exposes temporary tariff reason');
const caEnvelope=validateCommerceEnvelope({currency:'CAD',billing_country:'Canada',shipping_country:'CA'});check(caEnvelope.ok===true,'Canadian billing and shipping envelope still passes');
const usBilling=validateCommerceEnvelope({currency:'CAD',billing_country:'United States',shipping_country:'CA'});check(!usBilling.ok && usBilling.code==='billing_country_not_supported' && usBilling.requested_country_code==='US' && usBilling.restriction_reason==='TEMPORARY_TARIFF_RESTRICTION','U.S. billing preserves historical error code and adds explicit tariff restriction metadata');
const usShipping=validateCommerceEnvelope({currency:'CAD',billing_country:'CA',shipping_country:'USA'});check(!usShipping.ok && usShipping.code==='shipping_country_not_supported' && usShipping.requested_country_code==='US' && usShipping.restriction_reason==='TEMPORARY_TARIFF_RESTRICTION','U.S. shipping preserves historical error code and adds explicit tariff restriction metadata');
const otherMarket=validateCommerceEnvelope({currency:'CAD',billing_country:'France',shipping_country:'France'});check(!otherMarket.ok && otherMarket.code==='billing_country_not_supported' && !otherMarket.restriction_reason,'other markets remain unsupported without pretending they are tariff-blocked');
const usAddress=validateCanadianAddress({country:'United States',province:'NY',postal_code:'10001'},{label:'Shipping'});check(!usAddress.ok && usAddress.code==='commerce_country_not_supported' && usAddress.requested_country_code==='US' && usAddress.restriction_reason==='TEMPORARY_TARIFF_RESTRICTION','U.S. shipping address preserves Build 77 code while exposing the tariff restriction');
check(/50% tariffs/i.test(COMMERCE_POLICY.canada_first_banner_message) && /Canada first/i.test(COMMERCE_POLICY.canada_first_banner_message) && /American customers/i.test(COMMERCE_POLICY.canada_first_banner_message),'front-page message explains tariff pause, Canada-first focus and hope to resume U.S. shipping');
const snapshot=policyPublicSnapshot();check(snapshot.blocked_sales_country_codes.join(',')==='US' && snapshot.blocked_shipping_country_codes.join(',')==='US' && snapshot.market_strategy==='CANADA_FIRST','public snapshot exposes market controls without secret state');
if(process.exitCode) process.exit(process.exitCode);
console.log(`RELEASE 467 BUILD 124 CANADA-FIRST MARKET CONTROLS RUNTIME: PASS (${checks} checks)`);
