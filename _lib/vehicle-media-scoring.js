export function scoreVehicleMedia({
  mediaUrl,
  mediaKind = "photo",
  altText = "",
  imageTitle = "",
  caption = "",
  widthPx = null,
  heightPx = null,
  orientation = null,
  cropHistory = null,
  mediaAnalysis = null,
  existingMedia = [],
  captureRole = null,
  isFirstImage = false
}) {
  const kind = String(mediaKind || "photo").trim().toLowerCase();
  if (!mediaUrl) {
    return { score: null, label: null, status: "missing_media_url", reject_save: true, failures: ["Image URL is required."] };
  }

  if (kind === "video") {
    return {
      score: null,
      label: "Video uploaded",
      status: "video_manual_review",
      reject_save: false,
      failures: [],
      checks: { kind: "video" }
    };
  }

  const width = toPositiveInt(widthPx);
  const height = toPositiveInt(heightPx);
  const normalizedOrientation = normalizeOrientation(orientation, width, height);
  const alt = String(altText || "").trim();
  const title = String(imageTitle || "").trim();
  const note = String(caption || "").trim();
  const normalizedCaptureRole = String(captureRole || "").trim().toLowerCase() || null;
  const hasCropHistory = hasNonEmptyCropHistory(cropHistory);
  const analysis = normalizeMediaAnalysis(mediaAnalysis);
  const duplicate = computeDuplicatePenalty({ analysis, existingMedia, captureRole: normalizedCaptureRole, mediaUrl });

  let score = 0;
  if (mediaUrl) score += 20;
  if (alt.length >= 5) score += 10;
  if (alt.length >= 12) score += 5;
  if (width >= 1600 && height >= 1600) score += 20;
  else if (width >= 1200 && height >= 1200) score += 16;
  else if (width >= 800 && height >= 800) score += 12;
  if (isFirstImage) {
    if (["square", "landscape"].includes(normalizedOrientation || "")) score += 12;
  } else if (normalizedOrientation) {
    score += 8;
  }
  if (hasCropHistory) score += 8;
  if (note) score += 3;
  if (title) score += 2;

  score += scaledPoints(analysis.background_score, 10);
  score += scaledPoints(analysis.subject_fill_score, 10);
  score += scaledPoints(analysis.sharpness_score, 10);
  score += scaledPoints(analysis.brightness_score, 5);
  score += scaledPoints(analysis.contrast_score, 5);

  if (!isFirstImage && analysis.scene_style === "lifestyle" && analysis.subject_fill_score >= 0.35 && duplicate.penalty < 10) {
    score += 5;
  }

  if (duplicate.penalty > 0) score -= duplicate.penalty;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const failures = [];
  if (width == null || height == null) failures.push("Image dimensions are required before save.");
  if (width != null && width < 800) failures.push("Images must be at least 800 pixels wide.");
  if (height != null && height < 800) failures.push("Images must be at least 800 pixels tall.");
  if (!["square", "landscape"].includes(normalizedOrientation || "")) failures.push("Images must be square or landscape.");
  if (analysis.sharpness_score != null && analysis.sharpness_score < 0.14) failures.push("This image appears too soft or blurry for the gallery.");
  if (analysis.brightness_score != null && analysis.brightness_score < 0.15) failures.push("This image is too dark or too bright for merchandising.");

  if (isFirstImage) {
    if (width != null && width < 1200) failures.push("The first image must be at least 1200 pixels wide.");
    if (height != null && height < 1200) failures.push("The first image must be at least 1200 pixels tall.");
    if (alt.length < 12) failures.push("The first image needs alt text of at least 12 characters.");
    if (analysis.subject_fill_score != null && analysis.subject_fill_score < 0.16) failures.push("Move closer so the vehicle fills more of the first image frame.");
    if (analysis.background_score != null && analysis.background_score < 0.2) failures.push("The first image background looks too cluttered for a lead merchandising photo.");
    if (score < 70) failures.push("The first image score must be at least 70 before save.");
  }

  let label = "Needs work";
  if (score >= 92) label = isFirstImage ? "Lead image ready" : "Merch-ready";
  else if (score >= 84) label = "Strong merchandising";
  else if (score >= 70) label = "Ready";
  else if (score >= 55) label = "Usable with improvements";

  return {
    score,
    label,
    status: failures.length ? (isFirstImage ? "rejected_first_image_validation" : "rejected_image_validation") : (duplicate.penalty > 0 ? "scored_with_duplicate_penalty" : "scored"),
    reject_save: failures.length > 0,
    failures,
    checks: {
      width_px: width,
      height_px: height,
      orientation: normalizedOrientation,
      is_first_image: isFirstImage,
      alt_text_length: alt.length,
      has_crop_history: hasCropHistory,
      has_caption: Boolean(note),
      has_image_title: Boolean(title),
      capture_role: normalizedCaptureRole,
      background_score: analysis.background_score,
      subject_fill_score: analysis.subject_fill_score,
      sharpness_score: analysis.sharpness_score,
      brightness_score: analysis.brightness_score,
      contrast_score: analysis.contrast_score,
      scene_style: analysis.scene_style,
      duplicate_penalty: duplicate.penalty,
      duplicate_reason: duplicate.reason || null,
      duplicate_capture_role_match: duplicate.capture_role_match,
      duplicate_distance: duplicate.distance,
      fingerprint_present: Boolean(analysis.fingerprint)
    }
  };
}

export function normalizeOrientation(orientation, widthPx = null, heightPx = null) {
  const raw = String(orientation || "").trim().toLowerCase();
  if (["square", "landscape", "portrait"].includes(raw)) return raw;
  const width = toPositiveInt(widthPx);
  const height = toPositiveInt(heightPx);
  if (width == null || height == null) return null;
  const ratio = width / height;
  if (ratio >= 0.95 && ratio <= 1.05) return "square";
  return ratio > 1.05 ? "landscape" : "portrait";
}

function hasNonEmptyCropHistory(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function normalizeMediaAnalysis(value) {
  let analysis = value;
  if (typeof analysis === "string") {
    try { analysis = JSON.parse(analysis); } catch { analysis = null; }
  }
  if (!analysis || typeof analysis !== "object") analysis = {};
  return {
    brightness_mean: toFiniteNumber(analysis.brightness_mean),
    contrast_stddev: toFiniteNumber(analysis.contrast_stddev),
    sharpness_variance: toFiniteNumber(analysis.sharpness_variance),
    border_brightness_ratio: bounded(analysis.border_brightness_ratio),
    border_low_saturation_ratio: bounded(analysis.border_low_saturation_ratio),
    border_consistency_score: bounded(analysis.border_consistency_score),
    background_score: bounded(analysis.background_score),
    subject_fill_ratio: bounded(analysis.subject_fill_ratio),
    subject_fill_score: bounded(analysis.subject_fill_score),
    sharpness_score: bounded(analysis.sharpness_score),
    brightness_score: bounded(analysis.brightness_score),
    contrast_score: bounded(analysis.contrast_score),
    scene_style: normalizeSceneStyle(analysis.scene_style),
    fingerprint: typeof analysis.fingerprint === "string" ? analysis.fingerprint.trim() || null : null,
    suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 6) : []
  };
}

function computeDuplicatePenalty({ analysis, existingMedia = [], captureRole = null, mediaUrl = null }) {
  const fingerprint = analysis?.fingerprint || null;
  const targetRole = String(captureRole || "").trim().toLowerCase() || null;
  let bestPenalty = 0;
  let bestReason = null;
  let bestDistance = null;
  let bestRoleMatch = false;

  for (const row of Array.isArray(existingMedia) ? existingMedia : []) {
    if (!row || row.is_deleted === true) continue;
    if (String(row.media_kind || "photo").trim().toLowerCase() !== "photo") continue;
    if (mediaUrl && String(row.media_url || "").trim() === String(mediaUrl).trim()) continue;
    const rowRole = String(row.capture_role || "").trim().toLowerCase() || null;
    const rowAnalysis = normalizeMediaAnalysis(row.media_analysis || row.analysis || null);
    const sameRole = Boolean(targetRole && rowRole && targetRole === rowRole);
    const distance = fingerprint && rowAnalysis.fingerprint ? hammingDistance(fingerprint, rowAnalysis.fingerprint) : null;
    let penalty = 0;
    let reason = null;
    if (distance != null && distance <= 4) {
      penalty = sameRole ? 15 : 10;
      reason = sameRole ? "Very similar photo already exists for this angle." : "Very similar photo already exists in the vehicle library.";
    } else if (distance != null && distance <= 7) {
      penalty = sameRole ? 10 : 6;
      reason = sameRole ? "Another photo of this angle is already very close." : "This upload is close to another existing photo.";
    } else if (sameRole && !fingerprint) {
      penalty = 4;
      reason = "This angle already has another photo and the new file could not be fingerprinted.";
    }
    if (penalty > bestPenalty) {
      bestPenalty = penalty;
      bestReason = reason;
      bestDistance = distance;
      bestRoleMatch = sameRole;
    }
  }

  return { penalty: bestPenalty, reason: bestReason, distance: bestDistance, capture_role_match: bestRoleMatch };
}

function hammingDistance(a, b) {
  const left = String(a || "").trim();
  const right = String(b || "").trim();
  if (!left || !right || left.length !== right.length) return null;
  let distance = 0;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) distance += 1;
  }
  return distance;
}

function scaledPoints(value, maxPoints) {
  if (value == null) return 0;
  return Math.round(Math.max(0, Math.min(maxPoints, value * maxPoints)) * 10) / 10;
}

function normalizeSceneStyle(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["record", "lifestyle", "mixed"].includes(raw)) return raw;
  return "mixed";
}

function bounded(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}
