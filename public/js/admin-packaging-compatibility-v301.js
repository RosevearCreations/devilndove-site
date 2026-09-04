// Devil n Dove Build 301 Packaging compatibility checkpoint.
// Build 301 remains the live browser compatibility identity; Release 467 Builds 42–44
// add bounded Packaging intelligence/composition/production layers without replacing it.
(() => {
  const BUILD = 301;
  const MATERIAL_INTELLIGENCE_BUILD = 42;
  const LABEL_COMPOSITION_BUILD = 43;
  const LABEL_PRODUCTION_BUILD = 44;
  const EXPECTED = Object.freeze({ startupGateBuild:297, clientTransportBuild:297, nativeClientBuild:298, stabilizationBuild:300, editorImplementationBuild:298, nativeReadGatewayBuild:293, nativeReadImplementationBuild:286, nativeWriteGatewayBuild:292, nativeWriteServiceBuild:291 });
  const safeStatus = (target) => { try { return target?.getStatus?.() || null; } catch { return null; } };

  function snapshot() {
    const gate=safeStatus(globalThis.DDPackagingStartupGate), contracts=safeStatus(globalThis.DDPackagingContracts), client=safeStatus(globalThis.DDPackagingClient), stabilizer=safeStatus(globalThis.DDPackagingSaveStabilizer), material=safeStatus(globalThis.DDPackagingMaterialIntelligence), composition=safeStatus(globalThis.DDPackagingLabelComposition), production=safeStatus(globalThis.DDPackagingLabelProduction);
    const active=Boolean(Number(gate?.build||0)===EXPECTED.startupGateBuild&&Number(contracts?.clientTransportBuild||0)===EXPECTED.clientTransportBuild&&Number(client?.build||0)===EXPECTED.nativeClientBuild&&Number(client?.stabilizationBuild||stabilizer?.build||0)===EXPECTED.stabilizationBuild&&client?.nativeClient===true&&client?.ownerContractsReady===true&&client?.nativeBootstrapPath==='/api/admin/packaging-bootstrap'&&client?.nativeWritePath==='/api/admin/packaging-write'&&client?.legacyRouteNamedByClient===false&&Number(client?.failedVerificationCount??stabilizer?.failedVerificationCount??0)===0);
    return Object.freeze({
      build:BUILD,state:active?'active':'waiting-for-proven-packaging-stack',compatibilityCheckpoint:true,singleConversationBuild:BUILD,implementationProvenance:EXPECTED,
      startupGateReady:Boolean(gate?.runtimeReady),clientTransportReady:Boolean(contracts?.clientTransportReady),nativeClientReady:Boolean(client?.nativeClient&&client?.ownerContractsReady),saveVerificationActive:Boolean(client?.saveVerificationActive||stabilizer?.state==='active'),previewStabilizationActive:Boolean(stabilizer?.state==='active'),verifiedSaveCount:Number(client?.verifiedSaveCount??stabilizer?.verifiedSaveCount??0),failedVerificationCount:Number(client?.failedVerificationCount??stabilizer?.failedVerificationCount??0),previewMode:client?.previewMode??stabilizer?.previewMode??null,previewAuditCount:Number(client?.previewAuditCount??stabilizer?.previewAuditCount??0),forcedPreviewRefreshCount:Number(client?.forcedPreviewRefreshCount??stabilizer?.forcedPreviewRefreshCount??0),nativeReadCount:Number(client?.readCount||0),nativeReadStatus:Number(client?.lastReadStatus||0),nativeWriteCount:Number(client?.writeCount||0),nativeWriteStatus:Number(client?.lastWriteStatus||0),lastWriteBoundary:client?.lastWriteBoundary||null,
      materialIntelligenceBuild:Number(material?.build||client?.materialIntelligenceBuild||0)||null,materialIntelligenceActive:Boolean(material?.state==='active'||client?.materialIntelligenceActive),materialIntelligenceNormalizationFailures:Number(material?.normalizationFailureCount??client?.normalizationFailureCount??0),
      labelCompositionBuild:Number(composition?.build||0)||null,labelCompositionActive:Boolean(composition?.state==='active'),labelCompositionAuthoritativeReadback:Boolean(composition?.authoritativeReadback),labelCompositionFailures:Number(composition?.failureCount||0),
      labelProductionBuild:Number(production?.build||0)||null,labelProductionActive:Boolean(production?.state==='active'),labelProductionReady:Boolean(production?.productionReady),labelProductionFailures:Number(production?.failureCount||0),
      legacyCompatibilityTraffic:Object.freeze({delayed:Number(gate?.delayedLegacyRequests||0),replayed:Number(gate?.replayedLegacyRequests||0),blocked:Number(gate?.blockedLegacyRequests||0)}),productionContactedByCheckpoint:false
    });
  }
  function publishState(){const status=snapshot();if(typeof document!=='undefined'){document.documentElement.dataset.ddPackagingCompatibilityBuild=String(BUILD);document.documentElement.dataset.ddPackagingCompatibilityState=status.state;if(document.body){document.body.dataset.ddPackagingCompatibilityBuild=String(BUILD);document.body.dataset.ddPackagingCompatibilityState=status.state;}if(typeof CustomEvent!=='undefined')document.dispatchEvent(new CustomEvent('dd:packaging-compatibility-active',{detail:status}));}return status;}
  function addScript(selector,src,datasetKey,datasetValue,onload){if(document.querySelector(selector)){onload?.();return;}const script=document.createElement('script');script.src=src;script.async=false;script.dataset[datasetKey]=String(datasetValue);script.addEventListener('load',()=>{publishState();onload?.();},{once:true});document.head.appendChild(script);}
  function loadLabelProduction(){if(typeof document==='undefined'||!String(globalThis.location?.pathname||'').includes('/admin/packaging-studio'))return;addScript('script[data-dd-packaging-label-production]','/public/js/admin-packaging-label-production-v44.js?v=46744','ddPackagingLabelProduction',LABEL_PRODUCTION_BUILD);}
  function loadLabelComposition(){if(typeof document==='undefined'||!String(globalThis.location?.pathname||'').includes('/admin/packaging-studio'))return;addScript('script[data-dd-packaging-label-composition]','/public/js/admin-packaging-label-composition-v43.js?v=46743','ddPackagingLabelComposition',LABEL_COMPOSITION_BUILD,loadLabelProduction);}
  function loadMaterialIntelligence(){if(typeof document==='undefined'||!String(globalThis.location?.pathname||'').includes('/admin/packaging-studio'))return;addScript('script[data-dd-packaging-material-intelligence]','/public/js/admin-packaging-material-intelligence-v42.js?v=46742','ddPackagingMaterialIntelligence',MATERIAL_INTELLIGENCE_BUILD,loadLabelComposition);}
  globalThis.DDPackagingCompatibility=Object.freeze({build:BUILD,getStatus:snapshot,refreshStatus:publishState});
  if(typeof document!=='undefined'){
    ['dd:packaging-client-transport-active','dd:packaging-contract-bootstrap','dd:packaging-native-client-write','dd:packaging-material-intelligence-active','dd:packaging-label-composition-active','dd:packaging-label-production-active'].forEach((name)=>document.addEventListener(name,publishState));
    document.addEventListener('input',(event)=>{if(event?.target?.closest?.('#packagingStudioMain'))queueMicrotask(publishState);},{passive:true});
  }
  loadMaterialIntelligence();queueMicrotask(publishState);
})();
