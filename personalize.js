/*
 * personalize.js
 * -------------------------------------------------------------------
 * Pure, dependency-free helpers shared by the page (browser) and the
 * smoke test (Node). No DOM access here so it can be unit-tested.
 *
 * Personalization: outreach links use  ?business=Acme%20Plumbing
 * so a cold prospect opening the link sees their own name.
 */
(function (root) {
  'use strict';

  var DEFAULT_BUSINESS = 'your business';
  var MAX_LEN = 60;

  // Read & sanitise the ?business= query param.
  // Returns a trimmed, length-capped plain string (never null).
  function getBusinessName(search) {
    var params = new URLSearchParams(search || '');
    var raw = (params.get('business') || '').trim();
    if (!raw) return DEFAULT_BUSINESS;
    // Collapse whitespace, cap length. Output is always rendered via
    // textContent in the page, so it is XSS-safe regardless.
    raw = raw.replace(/\s+/g, ' ').slice(0, MAX_LEN);
    return raw;
  }

  // True when the visitor arrived via a personalized link.
  function isPersonalized(search) {
    var params = new URLSearchParams(search || '');
    return !!(params.get('business') || '').trim();
  }

  // Initials for the SMS avatar, e.g. "Acme Plumbing" -> "AP".
  function initials(name) {
    var clean = (name || '').trim();
    if (!clean || clean === DEFAULT_BUSINESS) return 'AT';
    var parts = clean.split(/\s+/).filter(Boolean);
    var first = parts[0] ? parts[0][0] : '';
    var second = parts[1] ? parts[1][0] : '';
    return (first + second).toUpperCase() || 'AT';
  }

  var api = {
    DEFAULT_BUSINESS: DEFAULT_BUSINESS,
    getBusinessName: getBusinessName,
    isPersonalized: isPersonalized,
    initials: initials,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api; // Node (smoke test)
  } else {
    root.Personalize = api; // Browser
  }
})(typeof window !== 'undefined' ? window : this);
