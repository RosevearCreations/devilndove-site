// Release 459 — authenticated, read-only provider setup guide.
// Returns names/instructions and presence booleans only. Secret values are never emitted.
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';

const text=(v)=>String(v==null?'':v).trim();
const json=(data,status=200)=>jsonResponse({release:CURRENT_RELEASE,...data},status,{'Cache-Control':'no-store'});
const field=(name,storage,purpose,source,required=true)=>({name,storage,purpose,source,required});

function providerGuide(origin){
  return [
    {
      key:'stripe',name:'Stripe',type:'payment',dashboard:'Stripe Dashboard → Developers',environment:'test',implementation_state:'checkout_and_webhook_runtime_present_manual_acceptance_pending',
      fields:[
        field('STRIPE_PUBLISHABLE_KEY','variable','Client-side Stripe test-mode identifier.','Stripe test-mode API keys.'),
        field('STRIPE_SECRET_KEY','secret','Server-side Stripe test-mode credential.','Stripe test-mode API keys.'),
        field('STRIPE_WEBHOOK_SECRET','secret','Verifies signed Development webhook events.','Stripe Development/test webhook endpoint signing secret.')
      ],
      callbacks:[],scopes:[],
      setup_steps:['Create/use test-mode credentials only.','Store server credentials under Cloudflare Variables and Secrets for devilndove-site-dev.','Configure the Development webhook and signing secret.','Run test checkout, signed webhook, reconciliation and idempotent replay before acceptance.'],
      verification:['Configuration presence is safe to check automatically.','No live charge is part of Release 459 automated acceptance.']
    },
    {
      key:'paypal',name:'PayPal',type:'payment',dashboard:'PayPal Developer Dashboard',environment:'sandbox',implementation_state:'sandbox_runtime_present_manual_acceptance_pending',
      fields:[
        field('PAYPAL_CLIENT_ID','variable','Identifies the PayPal sandbox application.','PayPal Developer Dashboard sandbox app.'),
        field('PAYPAL_CLIENT_SECRET','secret','Authenticates server-side sandbox requests.','PayPal Developer Dashboard sandbox app.'),
        field('PAYPAL_WEBHOOK_ID','variable','Identifies the configured sandbox webhook.','PayPal Developer Dashboard webhook configuration.')
      ],callbacks:[],scopes:[],
      setup_steps:['Use sandbox application credentials only.','Store the client secret in Cloudflare, never D1/source.','Create the sandbox webhook and record PAYPAL_WEBHOOK_ID.','Complete approval/capture, authenticity verification, reconciliation and replay acceptance later.'],
      verification:['Automated readiness never moves money.','Production credentials remain unavailable during Development.']
    },
    {
      key:'etsy',name:'Etsy',type:'marketplace',dashboard:'Etsy Developer / Open API application',environment:'development',implementation_state:'local_listing_preparation_ready_provider_specific_oauth_exchange_pending',
      fields:[
        field('ETSY_API_KEYSTRING','secret','Open API application keystring used with Etsy API requests.','Approved Etsy Open API application.'),
        field('ETSY_SHARED_SECRET','secret','Open API shared secret paired with the application keystring.','Approved Etsy Open API application.'),
        field('ETSY_REDIRECT_URI','variable','Exact HTTPS OAuth redirect URI.','Choose the final Devil n Dove Development Etsy callback once the provider-specific OAuth route is enabled.'),
        field('ETSY_SHOP_ID','variable','Safe identifier for the intended Devil n Dove Etsy shop.','Etsy shop/account after authorization.')
      ],
      callbacks:[{label:'Etsy callback',url:null,status:'provider_specific_callback_not_enabled_yet'}],
      scopes:['shops_r','listings_r','listings_w','transactions_r'],
      setup_steps:['Obtain/approve the Etsy Open API application.','OAuth Authorization Code must use PKCE and an exact HTTPS redirect.','Begin with least-privilege shop/listing/order-read scopes; add write scopes only for implemented workflows.','Never paste rotating access/refresh tokens into D1, source, Markdown or this UI.'],
      verification:['Local Etsy listing preparation remains draft-only.','Provider-side OAuth/draft acceptance stays blocked until the secure OAuth lifecycle is enabled.']
    },
    {
      key:'pinterest',name:'Pinterest',type:'social',dashboard:'Pinterest Developers application',environment:'development',implementation_state:'callback_readiness_present_token_exchange_pending',
      fields:[field('PINTEREST_APP_ID','variable','Identifies the Pinterest application.','Pinterest developer application.'),field('PINTEREST_APP_SECRET','secret','Authenticates server-side OAuth exchange.','Pinterest developer application.'),field('PINTEREST_REDIRECT_URI','variable','Exact HTTPS OAuth redirect URI.','Register the Development callback below.')],
      callbacks:[{label:'Pinterest OAuth callback',url:`${origin}/api/social/oauth/pinterest/callback`,status:'deployed_readiness_callback'}],
      scopes:['boards:read','boards:write','pins:read','pins:write'],
      setup_steps:['Create/confirm the Pinterest business developer application.','Register the callback exactly.','Request only board/Pin permissions required by the approved workflow.','Complete domain/business review where required.'],
      verification:['Current callback proves route/config readiness but does not exchange tokens yet.','Publishing remains disabled until secure token lifecycle and controlled acceptance are complete.']
    },
    {
      key:'meta',name:'Meta / Facebook / Instagram',type:'social',dashboard:'Meta for Developers application',environment:'development',implementation_state:'callback_readiness_present_token_exchange_pending',
      fields:[field('META_APP_ID','variable','Identifies the Meta application shared by configured Facebook/Instagram flows.','Meta App Dashboard.'),field('META_APP_SECRET','secret','Authenticates server-side Meta OAuth exchange.','Meta App Dashboard.'),field('META_REDIRECT_URI','variable','Canonical redirect reference selected for the Meta connection flow.','Meta App Dashboard OAuth settings.')],
      callbacks:[{label:'Meta callback',url:`${origin}/api/social/oauth/meta/callback`,status:'deployed_readiness_callback'},{label:'Facebook callback',url:`${origin}/api/social/oauth/facebook/callback`,status:'deployed_readiness_callback'},{label:'Instagram callback',url:`${origin}/api/social/oauth/instagram/callback`,status:'deployed_readiness_callback'}],
      scopes:['Verify current Meta Page/Instagram permissions at activation; permissions and app-review requirements change by product/use case.'],
      setup_steps:['Use one documented Meta application authority for the Facebook/Instagram channels unless provider review requires separation.','Register every callback actually used by the selected Meta product.','Verify current Meta permissions, business/domain verification and app-review requirements immediately before activation.','Do not mark connected because an App ID/secret merely exists.'],
      verification:['Current routes are readiness callbacks only.','Provider acceptance must confirm the intended business/page/Instagram account and approved permissions.']
    },
    {
      key:'x',name:'X',type:'social',dashboard:'X Developer Portal application',environment:'development',implementation_state:'callback_readiness_present_durable_authority_added_release459_token_exchange_pending',
      fields:[field('X_CLIENT_ID','variable','Identifies the X OAuth 2 application.','X Developer Portal OAuth 2 settings.'),field('X_CLIENT_SECRET','secret','Confidential-client secret when issued/required.','X Developer Portal OAuth 2 settings.'),field('X_REDIRECT_URI','variable','Exact HTTPS OAuth redirect URI.','Register the Development callback below.')],
      callbacks:[{label:'X OAuth callback',url:`${origin}/api/social/oauth/x/callback`,status:'deployed_readiness_callback'}],
      scopes:['tweet.read','tweet.write','users.read','offline.access','media.write (only when media upload is implemented)'],
      setup_steps:['Configure OAuth 2 Authorization Code with PKCE.','Register the exact Development callback.','Request offline.access only when refresh tokens are required.','Add media.write only for an implemented approved media-upload path.'],
      verification:['Release 459 adds the missing durable X setup/readiness authority.','Connection/publication stays closed until encrypted token lifecycle and controlled acceptance pass.']
    },
    {
      key:'tiktok',name:'TikTok',type:'social',dashboard:'TikTok for Developers application',environment:'development',implementation_state:'callback_readiness_present_content_posting_preparation_token_exchange_pending',
      fields:[field('TIKTOK_CLIENT_KEY','variable','Identifies the TikTok developer application.','TikTok developer application.'),field('TIKTOK_CLIENT_SECRET','secret','Authenticates server-side TikTok OAuth exchange.','TikTok developer application.'),field('TIKTOK_REDIRECT_URI','variable','Exact HTTPS OAuth redirect URI.','Register the Development callback below.')],
      callbacks:[{label:'TikTok OAuth callback',url:`${origin}/api/social/oauth/tiktok/callback`,status:'deployed_readiness_callback'}],
      scopes:['user.info.basic','video.publish','video.upload','video.list (only if readback/listing is implemented)'],
      setup_steps:['Enable the Content Posting product required by the chosen workflow.','Register the exact Development callback.','Use video.publish for Direct Post and video.upload for upload-to-draft workflows as applicable.','Preserve explicit user review/consent before provider execution.'],
      verification:['Unaudited/testing restrictions must be reviewed in the provider console before public use.','General posting remains disabled.']
    },
    {
      key:'youtube',name:'YouTube',type:'video',dashboard:'Google Cloud Console → OAuth consent / Credentials',environment:'development',implementation_state:'callback_readiness_present_reference_names_corrected_release459_token_exchange_pending',
      fields:[field('YOUTUBE_CLIENT_ID','variable','Identifies the Google OAuth Web client used for YouTube.','Google Cloud OAuth client.'),field('YOUTUBE_CLIENT_SECRET','secret','Authenticates server-side Google OAuth exchange.','Google Cloud OAuth client.'),field('YOUTUBE_REDIRECT_URI','variable','Exact HTTPS OAuth redirect URI.','Register the Development callback below.')],
      callbacks:[{label:'YouTube OAuth callback',url:`${origin}/api/social/oauth/youtube/callback`,status:'deployed_readiness_callback'}],
      scopes:['https://www.googleapis.com/auth/youtube.upload'],
      setup_steps:['Create a Web OAuth client for Devil n Dove Development.','Register the exact Development callback.','Start with youtube.upload; add broader scopes only when an implemented feature requires them.','Request offline access only when encrypted refresh-token storage/refresh is enabled.'],
      verification:['Release 459 aligns durable reference names with the actual YOUTUBE_* runtime contract.','Service accounts are not treated as the user-channel authorization path.']
    }
  ];
}

export async function onRequestGet({request,env}){
  if(!await getAdminUserFromRequest(request,env))return json({ok:false,error:'Unauthorized.'},401);
  const origin=new URL(request.url).origin;
  const providers=providerGuide(origin).map((provider)=>{
    const fields=provider.fields.map((item)=>({...item,present:Boolean(text(env?.[item.name]))}));
    const required=fields.filter((item)=>item.required!==false);
    return {...provider,fields,configured_required_count:required.filter((item)=>item.present).length,required_field_count:required.length,configuration_complete:required.length>0&&required.every((item)=>item.present)};
  });
  return json({
    ok:true,
    authority:'it-provider-setup-guide',
    environment:'development',
    pages_project:'devilndove-site-dev',
    cloudflare_location:'Workers & Pages → devilndove-site-dev → Settings → Variables and Secrets',
    secret_values_emitted:false,
    provider_execution_allowed:false,
    provider_publication_allowed:false,
    oauth_token_exchange_global_state:'not_enabled_until_secure_state_pkce_encrypted_token_refresh_disconnect_lifecycle_is_complete',
    providers
  });
}
