// functions/api/_lib/pricing-catalog.js
// Canonical pricing catalog loader.
// Reads app_management_settings.pricing_catalog first, then falls back to bundled JSON.

import { serviceHeaders } from "./staff-session.js";

const FALLBACK_CATALOG = {"charts": [{"filename": "CarPrice2025.PNG", "title": "Vehicle Price Chart 2025", "r2_url": "/assets/brand/CarPrice2025.PNG"}, {"filename": "CarPriceDetails2025.PNG", "title": "Package Service Details Chart", "r2_url": "/assets/brand/CarPriceDetails2025.PNG"}, {"filename": "CarSizeChart.PNG", "title": "Vehicle Size Chart", "r2_url": "https://assets.rosiedazzlers.ca/packages/CarSizeChart.PNG"}], "packages": [{"code": "premium_wash", "name": "Premium Wash", "subtitle": "Quick exterior clean", "prices_cad": {"small": 85, "mid": 105, "oversize": 125}, "deposit_cad": 50, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWash.png", "mid": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWashMidSize.png", "oversize": "https://assets.rosiedazzlers.ca/packages/PremiumExternalWashLargeSizeExotic.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Quick exterior-focused clean", "Main image changes with vehicle size"]}, {"code": "basic_detail", "name": "Basic Detail", "subtitle": "Quick interior clean", "prices_cad": {"small": 115, "mid": 135, "oversize": 170}, "deposit_cad": 50, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailSmallSize.png", "mid": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailMidSize.png", "oversize": "https://assets.rosiedazzlers.ca/packages/BasicInteriorDetailExotics.png"}, "included_services": [{"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Quick interior-focused package", "Main image changes with vehicle size"]}, {"code": "complete_detail", "name": "Complete Detail", "subtitle": "Our #1 choice", "prices_cad": {"small": 319, "mid": 369, "oversize": 419}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/CompleteDetailSmallCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/CompleteDetailMidSizelCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/CompleteDetailOverSizeExoticCars.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Shampoo Carpets & Mats"}, {"name": "Shampoo Cloth Seats", "optional_condition_note": "Where equipped"}], "notes": ["Best all-around package", "Main image changes with vehicle size"]}, {"code": "interior_detail", "name": "Interior Detail", "subtitle": "Full interior detailing", "prices_cad": {"small": 195, "mid": 220, "oversize": 245}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailSmallCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailMidSuvCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/FullInteriorDetailLargeExoticCars.png"}, "included_services": [{"name": "Full Vacuum (Seats, Carpets, Mats, Trunk)"}, {"name": "Clean Dash & Centre Console"}, {"name": "Clean Windows (In/Out)"}, {"name": "Clean Leather / Vinyl Seats", "optional_condition_note": "Where equipped"}, {"name": "Shampoo Carpets & Mats"}, {"name": "Shampoo Cloth Seats", "optional_condition_note": "Where equipped"}], "notes": ["Interior-only full detailing package", "Main image changes with vehicle size"]}, {"code": "exterior_detail", "name": "Exterior Detail", "subtitle": "Full exterior detailing", "prices_cad": {"small": 195, "mid": 220, "oversize": 245}, "deposit_cad": 100, "images_by_size": {"small": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailSmallSizeCars.png", "mid": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailMidSizeCars.png", "oversize": "https://assets.rosiedazzlers.ca/packages/FullExteriorDetailLargeExoticCars.png"}, "included_services": [{"name": "Hand Wash & Dry"}, {"name": "Clean Windows (In/Out)"}, {"name": "Door Jambs"}, {"name": "Wash Tires & Wheel Wells"}], "notes": ["Exterior-only full detailing package", "Main image changes with vehicle size"]}], "service_matrix": [{"service": "Hand Wash & Dry", "included_in": {"premium_wash": true, "basic_detail": false, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Full Vacuum (Seats, Carpets, Mats, Trunk)", "included_in": {"premium_wash": false, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Clean Dash & Centre Console", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Clean Windows (In/Out)", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": true}}, {"service": "Door Jambs", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Wash Tires & Wheel Wells", "included_in": {"premium_wash": true, "basic_detail": true, "complete_detail": true, "interior_detail": false, "exterior_detail": true}}, {"service": "Clean Leather / Vinyl Seats", "conditional_note": "Where equipped", "included_in": {"premium_wash": false, "basic_detail": true, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Shampoo Carpets & Mats", "included_in": {"premium_wash": false, "basic_detail": false, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}, {"service": "Shampoo Cloth Seats", "conditional_note": "Where equipped", "included_in": {"premium_wash": false, "basic_detail": false, "complete_detail": true, "interior_detail": true, "exterior_detail": false}}], "addons": [{"code": "full_clay_treatment", "name": "Full Clay Treatment", "prices_cad": {"small": 79, "mid": 99, "oversize": 129}, "quote_required": false, "source": "interpreted_pricing", "notes": ["Add-on service not included in any package"], "category": "paint correction", "type": "surface prep", "image_url": "https://assets.rosiedazzlers.ca/packages/full_clay_treatment.png", "image_fallback_url": "/assets/addons/full_clay_treatment.png"}, {"code": "two_stage_polish", "name": "Two Stage Polish", "prices_cad": {"small": 199, "mid": 279, "oversize": 359}, "quote_required": true, "source": "interpreted_pricing", "notes": ["Quote required because paint condition varies"], "category": "paint correction", "type": "machine polishing", "image_url": "https://assets.rosiedazzlers.ca/packages/two_stage_polish.png", "image_fallback_url": "/assets/addons/two_stage_polish.png"}, {"code": "high_grade_paint_sealant", "name": "High Grade Paint Sealant", "prices_cad": {"small": 59, "mid": 79, "oversize": 99}, "quote_required": false, "source": "interpreted_pricing", "category": "paint protection", "type": "sealant", "image_url": "https://assets.rosiedazzlers.ca/packages/high_grade_paint_sealant.png", "notes": ["Longer-lasting gloss"], "image_fallback_url": "/assets/addons/high_grade_paint_sealant.png"}, {"code": "uv_protectant_applied_on_interior_panels", "name": "UV Protectant Applied on Interior Panels", "prices_cad": {"small": 25, "mid": 35, "oversize": 45}, "quote_required": false, "source": "interpreted_pricing", "category": "interior protection", "type": "uv protectant", "image_url": "https://assets.rosiedazzlers.ca/packages/uv_protectant_applied_on_interior_panels.png", "notes": ["Interior panel dressing"], "image_fallback_url": "/assets/addons/uv_protectant_applied_on_interior_panels.png"}, {"code": "de_ionizing_treatment", "name": "De-Ionizing Treatment", "prices_cad": {"small": 59, "mid": 79, "oversize": 99}, "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/De-Ionizing%20Vehicle%20Add%20on%20service.png", "category": "odor treatment", "type": "de-ionizing", "image_fallback_url": "/assets/addons/de_ionizing_treatment.svg"}, {"code": "de_badging", "name": "De-Badging", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/DeBadgingAddonService.png", "category": "appearance modifications", "type": "badge removal", "image_fallback_url": "/assets/addons/de_badging.svg"}, {"code": "engine_cleaning", "name": "Engine Cleaning", "price_cad": 59, "quote_required": false, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Engine%20Cleaning%20add%20on%20service.png", "category": "engine bay", "type": "cleaning", "image_fallback_url": "/assets/addons/engine_cleaning.svg"}, {"code": "external_ceramic_coating", "name": "External Ceramic Coating", "price_cad": 299, "quote_required": true, "source": "package_asset", "notes": ["Starting price only"], "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Ceramic%20coating%20add%20on%20service.png", "category": "paint protection", "type": "ceramic coating", "image_fallback_url": "/assets/addons/external_ceramic_coating.svg"}, {"code": "external_graphene_fine_finish", "name": "External Graphene Fine Finish", "price_cad": 249, "quote_required": true, "source": "package_asset", "notes": ["Starting price only"], "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Graphene%20Fine%20finish%20add%20on%20service.png", "category": "paint protection", "type": "graphene finish", "image_fallback_url": "/assets/addons/external_graphene_fine_finish.svg"}, {"code": "external_wax", "name": "External Wax", "prices_cad": {"small": 49, "mid": 59, "oversize": 69}, "quote_required": false, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/External%20Wax%20add%20on%20service.png", "category": "paint protection", "type": "wax", "image_fallback_url": "/assets/addons/external_wax.svg"}, {"code": "vinyl_wrapping", "name": "Vinyl Wrapping", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Vinyl%20Wrapping%20add%20on%20service.png", "category": "appearance modifications", "type": "vinyl wrapping", "image_fallback_url": "/assets/addons/vinyl_wrapping.svg"}, {"code": "window_tinting", "name": "Window Tinting", "quote_required": true, "source": "package_asset", "image_url": "https://assets.rosiedazzlers.ca/packages/Window%20Tinting%20add%20on%20service.png", "category": "glass services", "type": "window tinting", "image_fallback_url": "/assets/addons/window_tinting.svg"}], "service_areas": [{"county": "Oxford County", "value": "Woodstock, Oxford County", "label": "Woodstock — Oxford County", "bylaw_note": "Woodstock jobs should stay on private property whenever possible. Street and winter parking restrictions can change by block, and unnecessary noise rules still apply during setup and cleanup.", "municipality": "Woodstock", "zone": "Woodstock", "area_type": "city", "travel_tier": "urban", "parking_rule": "Prefer driveway or private-lot setup. Winter overnight street parking restrictions and posted parking limits are the main risk areas for mobile detailing support vehicles.", "noise_rule": "Avoid prolonged engine, vacuum, or music noise near homes, especially early mornings and evenings.", "water_rule": "Contain runoff and avoid letting wash water or debris migrate across the boulevard or into storm drains.", "access_rule": "Confirm hose reach, outlet access, and turnaround room before dispatch.", "official_links": [{"label": "Woodstock parking information", "url": "https://www.cityofwoodstock.ca/en/residential-services/parking.aspx"}, {"label": "Woodstock parking exemptions", "url": "https://www.cityofwoodstock.ca/en/residential-services/parking-exemptions.aspx"}, {"label": "Woodstock bylaw services", "url": "https://www.cityofwoodstock.ca/en/city-governance/bylaw.aspx"}]}, {"county": "Oxford County", "value": "Tillsonburg, Oxford County", "label": "Tillsonburg — Oxford County", "bylaw_note": "Tillsonburg work should stay on the customer driveway or private lot. Noise complaints and neighborhood bylaw calls are the biggest operational risk.", "municipality": "Tillsonburg", "zone": "Tillsonburg", "area_type": "town", "travel_tier": "urban", "parking_rule": "Avoid street setup unless the customer has confirmed it is allowed and safe for the work truck or trailer.", "noise_rule": "Reduce loud vacuums, compressors, and music near homes and keep setup/teardown tidy.", "water_rule": "Keep water, cleaners, and debris on-site and controlled; do not assume curb runoff is acceptable.", "access_rule": "Confirm driveway width, outlet access, and customer-supplied water before arrival.", "official_links": [{"label": "Tillsonburg by-law enforcement", "url": "https://www.tillsonburg.ca/living-here/by-law-enforcement/"}, {"label": "Tillsonburg by-law directory", "url": "https://www.tillsonburg.ca/town-hall/by-laws/"}]}, {"county": "Oxford County", "value": "Ingersoll, Oxford County", "label": "Ingersoll — Oxford County", "bylaw_note": "Ingersoll jobs should prioritize private-property setup. Downtown and street-side work need extra parking attention, especially if the customer depends on permit or timed parking areas.", "municipality": "Ingersoll", "zone": "Ingersoll", "area_type": "town", "travel_tier": "urban", "parking_rule": "Check posted street limits, downtown permit areas, and avoid blocking sidewalks or neighbour access.", "noise_rule": "Keep louder detailing steps inside reasonable daytime hours and avoid idle-noise complaints.", "water_rule": "Keep runoff controlled and do not let wastewater pool near sidewalks, curbs, or municipal lots.", "access_rule": "Confirm private driveway space or off-street parking before dispatch.", "official_links": [{"label": "Ingersoll parking information", "url": "https://www.ingersoll.ca/residential-services/parking-information/"}, {"label": "Ingersoll permit parking", "url": "https://www.ingersoll.ca/general/permit-parking/"}, {"label": "Ingersoll by-laws and policies", "url": "https://www.ingersoll.ca/town-hall/by-laws-and-policies/"}]}, {"county": "Oxford County", "value": "Norwich / Otterville, Oxford County", "label": "Norwich / Otterville — Oxford County", "bylaw_note": "Norwich Township jobs often involve mixed town-and-rural access. Confirm whether the vehicle is on a village lot or a rural property before dispatch.", "municipality": "Norwich Township", "zone": "Norwich / Otterville", "area_type": "township", "travel_tier": "township", "parking_rule": "Use driveway or yard-side access only where the customer confirms there is room and permission.", "noise_rule": "Keep generator, vacuum, and compressor noise within normal daytime expectations for residential properties.", "water_rule": "Treat runoff conservatively and keep products away from roadside ditches, gravel shoulders, and private drainage paths.", "access_rule": "Ask about gravel lanes, turnaround room, water source, and outlet distance.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Oxford County", "value": "Thamesford / Embro / Innerkip, Oxford County", "label": "Thamesford / Embro / Innerkip — Oxford County", "bylaw_note": "This service zone spans more than one Oxford municipality, so driveway, parking, and setup expectations should be confirmed for the exact address before scheduling.", "municipality": "Zorra / East Zorra-Tavistock", "zone": "Thamesford / Embro / Innerkip", "area_type": "township-zone", "travel_tier": "township", "parking_rule": "Prefer confirmed private-property setup; do not assume roadside or shoulder parking is suitable for equipment staging.", "noise_rule": "Use standard daytime-only detailing noise practices near homes and farm properties.", "water_rule": "Keep runoff and debris contained away from ditches, catch basins, and shared private lanes.", "access_rule": "Confirm exact town, road type, and turnaround room with the customer.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Oxford County", "value": "Tavistock / Hickson, Oxford County", "label": "Tavistock / Hickson — Oxford County", "bylaw_note": "Village and rural properties in East Zorra-Tavistock need the exact address confirmed because setup room and access expectations can vary a lot.", "municipality": "East Zorra-Tavistock", "zone": "Tavistock / Hickson", "area_type": "township-zone", "travel_tier": "township", "parking_rule": "Use the customer driveway or lot and avoid shoulder parking for long jobs.", "noise_rule": "Plan louder work for standard daytime hours only.", "water_rule": "Keep wash runoff off roadside ditches and unmanaged gravel edges.", "access_rule": "Confirm lane width, trailer turning room, and water/power availability.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Oxford County", "value": "Beachville / South-West Oxford, Oxford County", "label": "Beachville / South-West Oxford — Oxford County", "bylaw_note": "South-West Oxford bookings should distinguish between village addresses and more rural properties before dispatching staff or trailers.", "municipality": "South-West Oxford", "zone": "Beachville / South-West Oxford", "area_type": "township-zone", "travel_tier": "township", "parking_rule": "Private-property access is preferred; avoid blocking farm lanes, sidewalks, or narrow residential streets.", "noise_rule": "Minimize extended machine noise near homes and hamlet main streets.", "water_rule": "Keep runoff controlled and away from ditches and low roadside areas.", "access_rule": "Confirm exact address, driveway surface, and setup room.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Oxford County", "value": "Plattsville / Blandford-Blenheim, Oxford County", "label": "Plattsville / Blandford-Blenheim — Oxford County", "bylaw_note": "Blandford-Blenheim work often mixes village and rural conditions. Confirm the exact location before assigning a larger crew or trailer.", "municipality": "Blandford-Blenheim", "zone": "Plattsville / Blandford-Blenheim", "area_type": "township-zone", "travel_tier": "township", "parking_rule": "Keep support vehicles on-site and off travelled roads or narrow shoulders.", "noise_rule": "Use daytime-only machine noise practices near residential properties.", "water_rule": "Keep wastewater and debris off roadside drainage and private shared lanes.", "access_rule": "Confirm driveway surface, slope, and available utility access.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Oxford County", "value": "Rural Oxford County", "label": "Rural Oxford County", "bylaw_note": "Rural Oxford jobs need stronger pre-dispatch checks for driveway access, turnaround space, water supply, and safe work area.", "municipality": "Oxford County rural", "zone": "Rural Oxford County", "area_type": "rural", "travel_tier": "rural", "parking_rule": "Do not assume roadside shoulders are suitable for support vehicles, trailers, or long-duration setup.", "noise_rule": "Keep extended machine noise inside standard daytime work windows.", "water_rule": "Protect wells, ditches, culverts, and gravel drainage paths from runoff or chemical carry-off.", "access_rule": "Confirm road condition, driveway length, turnaround room, and utility distance.", "official_links": [{"label": "Oxford County planning by municipality", "url": "https://www.oxfordcounty.ca/services-for-you/planning-and-development/"}, {"label": "Oxford County area municipalities", "url": "https://www.oxfordcounty.ca/your-government/about-oxford-county/"}]}, {"county": "Norfolk County", "value": "Simcoe, Norfolk County", "label": "Simcoe — Norfolk County", "bylaw_note": "Simcoe jobs should stay on private property whenever possible. Municipal parking, downtown activity, and residential noise expectations are the main operational considerations.", "municipality": "Norfolk County", "zone": "Simcoe", "area_type": "urban-centre", "travel_tier": "urban", "parking_rule": "Use driveway or private-lot setup. Confirm longer-duration parking before assigning a large crew or trailer.", "noise_rule": "Keep louder detailing steps to daytime hours and avoid unnecessary idle or music noise near homes.", "water_rule": "Keep runoff controlled and away from drains, curbs, and shared paved areas.", "access_rule": "Confirm private-property working room and any building or condo access rules.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Delhi, Norfolk County", "label": "Delhi — Norfolk County", "bylaw_note": "Delhi bookings should confirm private-property working space and any downtown parking limitations before finalizing the schedule.", "municipality": "Norfolk County", "zone": "Delhi", "area_type": "urban-centre", "travel_tier": "urban", "parking_rule": "Avoid street setup if the customer cannot confirm long-enough parking for the service window.", "noise_rule": "Use normal daytime noise practices near homes and mixed-use streets.", "water_rule": "Keep runoff controlled on site and away from public drains or roadside channels.", "access_rule": "Confirm driveway or lot access before dispatch.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-law directory", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Port Dover, Norfolk County", "label": "Port Dover — Norfolk County", "bylaw_note": "Port Dover needs stronger parking and arrival planning because waterfront and downtown rules are tighter during busier seasons.", "municipality": "Norfolk County", "zone": "Port Dover", "area_type": "waterfront", "travel_tier": "coastal", "parking_rule": "Check posted downtown, waterfront, and seasonal parking limits before assigning support vehicles or a crew trailer.", "noise_rule": "Keep noisy work inside daytime windows and avoid unnecessary disturbance near tourist and residential areas.", "water_rule": "Keep runoff well contained and away from curbs, lakefront drains, and public pedestrian areas.", "access_rule": "Confirm off-street access, visitor traffic conditions, and any seasonal parking limits.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk parking schedule details", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/parking-regulations-by-law/parking-regulations-by-law-schedule-a/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Waterford, Norfolk County", "label": "Waterford — Norfolk County", "bylaw_note": "Waterford bookings should confirm driveway or private-lot access and keep machine noise within normal daytime use.", "municipality": "Norfolk County", "zone": "Waterford", "area_type": "urban-centre", "travel_tier": "urban", "parking_rule": "Avoid long street-side staging unless the customer has confirmed it is allowed.", "noise_rule": "Use normal daytime detailing noise practices.", "water_rule": "Control runoff and debris on site.", "access_rule": "Confirm driveway space, hose reach, and outlet access.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Port Rowan, Norfolk County", "label": "Port Rowan — Norfolk County", "bylaw_note": "Port Rowan needs seasonal parking awareness and private-property setup confirmation before dispatch.", "municipality": "Norfolk County", "zone": "Port Rowan", "area_type": "waterfront", "travel_tier": "coastal", "parking_rule": "Check waterfront and municipal-lot conditions before sending larger vehicles or crews.", "noise_rule": "Keep machine noise to daytime windows only near homes and visitor areas.", "water_rule": "Keep runoff away from curbs, drains, and shoreline-adjacent infrastructure.", "access_rule": "Confirm parking room and turnaround space at the exact address.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk parking schedule details", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/parking-regulations-by-law/parking-regulations-by-law-schedule-a/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Langton, Norfolk County", "label": "Langton — Norfolk County", "bylaw_note": "Langton jobs should confirm driveway or lot setup and treat runoff conservatively around roadside ditches and low drainage areas.", "municipality": "Norfolk County", "zone": "Langton", "area_type": "urban-centre", "travel_tier": "urban", "parking_rule": "Prefer off-street setup for full or crew-sized jobs.", "noise_rule": "Keep louder steps to standard daytime hours.", "water_rule": "Avoid uncontrolled runoff to ditches or roadside drainage.", "access_rule": "Confirm driveway width and utility access.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Courtland, Norfolk County", "label": "Courtland — Norfolk County", "bylaw_note": "Courtland work should be treated like a hamlet or rural-edge job: confirm driveway access, staging room, and utility reach before dispatch.", "municipality": "Norfolk County", "zone": "Courtland", "area_type": "hamlet", "travel_tier": "hamlet", "parking_rule": "Keep support vehicles fully on private property where possible.", "noise_rule": "Use daytime-only machine noise practices.", "water_rule": "Keep runoff and debris out of ditches and shared drainage edges.", "access_rule": "Confirm exact property layout before crew assignment.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Vittoria / St. Williams, Norfolk County", "label": "Vittoria / St. Williams — Norfolk County", "bylaw_note": "These hamlet-area bookings need exact-address confirmation because road, driveway, and seasonal visitor conditions can vary sharply.", "municipality": "Norfolk County", "zone": "Vittoria / St. Williams", "area_type": "hamlet-zone", "travel_tier": "hamlet", "parking_rule": "Use private-property staging only where the customer confirms enough room.", "noise_rule": "Keep noisy steps inside daytime windows near homes and cottages.", "water_rule": "Keep runoff away from roadside ditches and conservation-sensitive areas.", "access_rule": "Confirm driveway width, turnaround room, and service utilities.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Turkey Point / Long Point, Norfolk County", "label": "Turkey Point / Long Point — Norfolk County", "bylaw_note": "Beach-area jobs need the strongest seasonal parking and arrival planning. Dispatch should confirm exact parking availability before booking a crew or trailer.", "municipality": "Norfolk County", "zone": "Turkey Point / Long Point", "area_type": "beach-zone", "travel_tier": "coastal", "parking_rule": "Seasonal and waterfront parking rules can change by location and time of year. Confirm off-street parking before final approval.", "noise_rule": "Use daytime-only machine noise practices near cottages and vacation properties.", "water_rule": "Keep runoff tightly contained and away from drains, shoreline areas, and sandy road edges.", "access_rule": "Confirm the exact address, parking plan, and seasonal traffic conditions.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk parking schedule details", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/by-law-directory/parking-regulations-by-law/parking-regulations-by-law-schedule-a/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Walsh / Walsingham, Norfolk County", "label": "Walsh / Walsingham — Norfolk County", "bylaw_note": "Walsh and Walsingham bookings should be treated as rural setups: confirm access, utility reach, and turnaround room before dispatch.", "municipality": "Norfolk County", "zone": "Walsh / Walsingham", "area_type": "rural-zone", "travel_tier": "rural", "parking_rule": "Do not assume roadside staging is suitable for equipment, vans, or trailers.", "noise_rule": "Keep extended machine noise inside daytime work windows.", "water_rule": "Keep runoff and debris away from ditches, gravel edges, and rural drainage features.", "access_rule": "Confirm driveway length, surface, and available setup room.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}, {"county": "Norfolk County", "value": "Rural Norfolk County", "label": "Rural Norfolk County", "bylaw_note": "Rural Norfolk jobs need stronger dispatch checks for long driveways, well/water access, outlet reach, and safe trailer turnaround.", "municipality": "Norfolk County rural", "zone": "Rural Norfolk County", "area_type": "rural", "travel_tier": "rural", "parking_rule": "Keep all support vehicles on the customer property and out of travelled roads or soft shoulders.", "noise_rule": "Use standard daytime-only machine-noise practices.", "water_rule": "Protect ditches, culverts, wells, and unpaved drainage paths from runoff or carry-off.", "access_rule": "Confirm road conditions, driveway length, turnaround room, and customer-provided utilities.", "official_links": [{"label": "Norfolk parking", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/roads-parking-and-traffic/parking/"}, {"label": "Norfolk by-laws and policies", "url": "https://www.norfolkcounty.ca/council-administration-and-government/by-laws-and-policies/"}, {"label": "Norfolk online maps", "url": "https://www.norfolkcounty.ca/home-property-and-neighbourhood/maps-and-data/online-maps/"}]}], "booking_rules": {"availability_window_days": 21, "default_service_area": "Tillsonburg, Oxford County", "hold_minutes": 30, "slot_labels": {"AM": "AM half day", "PM": "PM half day", "FULL": "Full day"}, "public_requirements": ["Driveway required", "Customer provides power and water or additional fees may apply", "One vehicle per day unless half-day jobs are confirmed"], "travel_pricing": {"urban": 0, "standard": 0, "rural": 20, "remote": 35, "out_of_zone": 50, "notes": "Travel charges are managed centrally in App Management."}, "price_controls": {"fuel_surcharge_cad": 0, "material_surcharge_cad": 0, "minimum_callout_cad": 0, "tax_rate_percent": 13}}, "public_requirements": ["Driveway required", "Customer provides power and water or additional fees may apply", "One vehicle per day unless half-day jobs are confirmed"]};

const LOCAL_CHART_URLS = {
  "CarPrice2025.PNG": "/assets/brand/CarPrice2025.PNG",
  "CarPriceDetails2025.PNG": "/assets/brand/CarPriceDetails2025.PNG"
};

const DEFAULT_BOOKING_RULES = {
  availability_window_days: 21,
  default_service_area: "Tillsonburg, Oxford County",
  hold_minutes: 30,
  slot_labels: {
    AM: "AM half day",
    PM: "PM half day",
    FULL: "Full day"
  },
  public_requirements: [
    "Driveway required",
    "Customer provides power and water or additional fees may apply",
    "One vehicle per day unless half-day jobs are confirmed"
  ],
  travel_pricing: {
    urban: 0,
    township: 0,
    hamlet: 10,
    coastal: 20,
    rural: 20,
    out_of_zone: 50,
    notes: "Travel charges are managed centrally in App Management."
  },
  price_controls: {
    fuel_surcharge_cad: 0,
    material_surcharge_cad: 0,
    minimum_callout_cad: 0,
    tax_rate_percent: 13
  }
};

export async function loadPricingCatalog(env) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    return normalizeCatalog(FALLBACK_CATALOG);
  }

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.pricing_catalog&limit=1`,
      { headers: serviceHeaders(env) }
    );

    if (res.ok) {
      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;
      if (row && row.value && typeof row.value === "object") {
        return mergeCatalog(row.value, FALLBACK_CATALOG);
      }
    }
  } catch {}

  return normalizeCatalog(FALLBACK_CATALOG);
}

export function normalizeCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const charts = normalizeCharts(source.charts);
  const packages = normalizePackages(source.packages);
  const addons = normalizeAddons(source.addons);
  const serviceAreas = normalizeServiceAreas(source.service_areas);
  const serviceMatrix = Array.isArray(source.service_matrix) ? source.service_matrix : [];

  const packageMap = Object.create(null);
  const addonMap = Object.create(null);

  for (const pkg of packages) packageMap[pkg.code] = pkg;
  for (const addon of addons) addonMap[addon.code] = addon;

  const bookingRuleSource = source.booking_rules && typeof source.booking_rules === "object" ? source.booking_rules : {};
  const bookingRules = {
    availability_window_days: numberOr(bookingRuleSource.availability_window_days, DEFAULT_BOOKING_RULES.availability_window_days),
    default_service_area: cleanText(bookingRuleSource.default_service_area) || DEFAULT_BOOKING_RULES.default_service_area,
    hold_minutes: numberOr(bookingRuleSource.hold_minutes, DEFAULT_BOOKING_RULES.hold_minutes),
    slot_labels: {
      ...DEFAULT_BOOKING_RULES.slot_labels,
      ...(bookingRuleSource.slot_labels && typeof bookingRuleSource.slot_labels === "object" ? bookingRuleSource.slot_labels : {})
    },
    public_requirements: normalizeStringArray(
      Array.isArray(bookingRuleSource.public_requirements) ? bookingRuleSource.public_requirements : DEFAULT_BOOKING_RULES.public_requirements
    ),
    travel_pricing: {
      urban: numberOr(bookingRuleSource?.travel_pricing?.urban, DEFAULT_BOOKING_RULES.travel_pricing.urban),
      township: numberOr(bookingRuleSource?.travel_pricing?.township, DEFAULT_BOOKING_RULES.travel_pricing.township),
      hamlet: numberOr(bookingRuleSource?.travel_pricing?.hamlet, DEFAULT_BOOKING_RULES.travel_pricing.hamlet),
      coastal: numberOr(bookingRuleSource?.travel_pricing?.coastal, DEFAULT_BOOKING_RULES.travel_pricing.coastal),
      rural: numberOr(bookingRuleSource?.travel_pricing?.rural, DEFAULT_BOOKING_RULES.travel_pricing.rural),
      out_of_zone: numberOr(bookingRuleSource?.travel_pricing?.out_of_zone, DEFAULT_BOOKING_RULES.travel_pricing.out_of_zone),
      notes: cleanText(bookingRuleSource?.travel_pricing?.notes) || DEFAULT_BOOKING_RULES.travel_pricing.notes
    },
    price_controls: {
      fuel_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.fuel_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.fuel_surcharge_cad),
      material_surcharge_cad: numberOr(bookingRuleSource?.price_controls?.material_surcharge_cad, DEFAULT_BOOKING_RULES.price_controls.material_surcharge_cad),
      minimum_callout_cad: numberOr(bookingRuleSource?.price_controls?.minimum_callout_cad, DEFAULT_BOOKING_RULES.price_controls.minimum_callout_cad),
      tax_rate_percent: numberOr(bookingRuleSource?.price_controls?.tax_rate_percent, DEFAULT_BOOKING_RULES.price_controls.tax_rate_percent)
    }
  };

  const publicRequirements = normalizeStringArray(
    Array.isArray(source.public_requirements) ? source.public_requirements : bookingRules.public_requirements
  );

  return {
    ...source,
    charts,
    packages,
    addons,
    service_matrix: serviceMatrix,
    service_areas: serviceAreas,
    booking_rules: bookingRules,
    public_requirements: publicRequirements,
    package_map: packageMap,
    addon_map: addonMap
  };
}

function mergeCatalog(primary, fallback) {
  return normalizeCatalog({
    ...fallback,
    ...primary,
    charts: hasRows(primary?.charts) ? primary.charts : fallback?.charts,
    packages: hasRows(primary?.packages) ? primary.packages : fallback?.packages,
    addons: hasRows(primary?.addons) ? primary.addons : fallback?.addons,
    service_matrix: hasRows(primary?.service_matrix) ? primary.service_matrix : fallback?.service_matrix,
    service_areas: hasRows(primary?.service_areas) ? primary.service_areas : fallback?.service_areas,
    booking_rules: {
      ...(fallback?.booking_rules || {}),
      ...(primary?.booking_rules || {})
    },
    public_requirements: hasRows(primary?.public_requirements) ? primary.public_requirements : fallback?.public_requirements
  });
}

function hasRows(value) {
  return Array.isArray(value) && value.length > 0;
}

function normalizeCharts(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const title = cleanText(row?.title || row?.filename);
    const filename = cleanText(row?.filename) || null;
    const r2Url = LOCAL_CHART_URLS[filename] || cleanText(row?.r2_url);
    if (!title || !r2Url) return null;
    return {
      filename,
      title,
      r2_url: r2Url
    };
  }).filter(Boolean);
}

function normalizePackages(rows) {
  return (Array.isArray(rows) ? rows : []).map((pkg) => {
    const code = cleanText(pkg?.code);
    if (!code) return null;
    const images = pkg?.images_by_size && typeof pkg.images_by_size === "object" ? pkg.images_by_size : {};
    const included = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
    return {
      ...pkg,
      code,
      name: cleanText(pkg?.name) || code,
      subtitle: cleanText(pkg?.subtitle) || null,
      deposit_cad: toMoney(pkg?.deposit_cad),
      prices_cad: normalizeSizeMap(pkg?.prices_cad),
      images_by_size: {
        small: cleanText(images.small) || null,
        mid: cleanText(images.mid) || null,
        oversize: cleanText(images.oversize) || null
      },
      included_services: included.map((row) => typeof row === "string"
        ? { name: cleanText(row) }
        : { ...row, name: cleanText(row?.name) }
      ).filter((row) => row.name),
      notes: normalizeStringArray(pkg?.notes)
    };
  }).filter(Boolean);
}

function normalizeAddons(rows) {
  return (Array.isArray(rows) ? rows : []).map((addon) => {
    const code = cleanText(addon?.code);
    if (!code) return null;
    return {
      ...addon,
      code,
      name: cleanText(addon?.name) || code,
      quote_required: addon?.quote_required === true,
      prices_cad: normalizeSizeMap(addon?.prices_cad),
      price_cad: toMoney(addon?.price_cad),
      image_url: cleanText(addon?.image_url) || null,
      image_fallback_url: cleanText(addon?.image_fallback_url) || null,
      notes: normalizeStringArray(addon?.notes)
    };
  }).filter(Boolean);
}

function normalizeServiceAreas(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const value = cleanText(row?.value || row?.label);
    const label = cleanText(row?.label || row?.value);
    if (!value && !label) return null;
    return {
      ...row,
      county: cleanText(row?.county) || null,
      value: value || label,
      label: label || value,
      municipality: cleanText(row?.municipality) || null,
      zone: cleanText(row?.zone) || null,
      area_type: cleanText(row?.area_type) || null,
      travel_tier: cleanText(row?.travel_tier) || 'township',
      bylaw_note: cleanText(row?.bylaw_note) || null,
      parking_rule: cleanText(row?.parking_rule) || null,
      noise_rule: cleanText(row?.noise_rule) || null,
      water_rule: cleanText(row?.water_rule) || null,
      access_rule: cleanText(row?.access_rule) || null,
      official_links: (Array.isArray(row?.official_links) ? row.official_links : []).map((link) => ({
        label: cleanText(link?.label) || "Official source",
        url: cleanText(link?.url)
      })).filter((link) => link.url)
    };
  }).filter(Boolean);
}

function normalizeSizeMap(value) {
  const map = value && typeof value === "object" ? value : {};
  return {
    small: toMoney(map.small),
    mid: toMoney(map.mid),
    oversize: toMoney(map.oversize)
  };
}

function normalizeStringArray(value) {
  return (Array.isArray(value) ? value : []).map((row) => cleanText(row)).filter(Boolean);
}

function cleanText(value) {
  return String(value || "").trim();
}

function toMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
