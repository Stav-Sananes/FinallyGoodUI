/* finally-good-ui browser probe (self-contained, no imports).
 * Inject via Playwright (page.addInitScript({path}) or page.addScriptTag({path}))
 * or any browser tool's JS-exec, then: await window.__fguProbe({touch, focus, tokens, reducedMotion}).
 * Result: {tool:"probe", findings:[{rule,severity,selector,message,card}], summary,
 *   animations:[{selector,duration,easing,properties,iterations}], metrics:{overflowX,cls,viewport,
 *   type:{sizes,weights,families,bodySize,paragraphMaxCh,paragraphMinLineHeight}, tokenCoverage}}.
 * Injected early (init script) it also records animations that finish before the probe runs.
 * opts: touch (44px targets), focus (walk focus states), tokens {colors:[css], spacing:[px]},
 *   reducedMotion (flag spatial motion), maxPerRule (default 15), skip:[rule names].
 */
(function () {
  if (window.__fguProbe) return;
  var seen = (window.__fguSeenAnimations = window.__fguSeenAnimations || new Set());
  try {
    var grab = function (e) { try { (e.target.getAnimations ? e.target.getAnimations() : []).forEach(function (a) { seen.add(a); }); } catch (_) {} };
    document.addEventListener('animationstart', grab, true);
    document.addEventListener('transitionrun', grab, true);
    var orig = Element.prototype.animate;
    if (orig && !orig.__fgu) {
      Element.prototype.animate = function () { var a = orig.apply(this, arguments); try { seen.add(a); } catch (_) {} return a; };
      Element.prototype.animate.__fgu = true;
    }
  } catch (_) {}
  var cls = 0;
  try {
    new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (!e.hadRecentInput) cls += e.value; }); })
      .observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}

  var COMPOSITOR = ['transform', 'opacity', 'filter', 'clip-path', 'clipPath', 'translate', 'scale', 'rotate'];
  var COLOR_PROPS = ['color', 'background-color', 'backgroundColor'];
  var LAYOUT = /^(width|height|top|left|right|bottom|inset|margin|padding|font-size|fontSize|min-|max-|grid-template|border-width|line-height)/i;
  var SPATIAL = /^(transform|translate|scale|rotate|top|left|right|bottom|inset|margin|width|height)/i;

  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/[^\w-]/g, '\\$&'); }
  function unique(sel) { try { return document.querySelectorAll(sel).length === 1; } catch (_) { return false; } }
  function sel(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id && !/\d{3,}|:/.test(el.id) && unique('#' + cssEsc(el.id))) return '#' + cssEsc(el.id);
    var parts = [], cur = el;
    for (var depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      var part = cur.tagName.toLowerCase();
      var tid = cur.getAttribute('data-testid');
      if (tid) part += '[data-testid="' + tid.replace(/"/g, '\\"') + '"]';
      else {
        var cl = Array.prototype.filter.call(cur.classList, function (c) { return c.length < 30 && !/\d{3,}|^css-|^sc-|[:[\]/]/.test(c); }).slice(0, 2);
        if (cl.length) part += '.' + cl.map(cssEsc).join('.');
        var p = cur.parentElement;
        if (p) {
          var same = Array.prototype.filter.call(p.children, function (c) { return c.tagName === cur.tagName; });
          if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(cur) + 1) + ')';
        }
      }
      parts.unshift(part);
      var s = parts.join(' > ');
      if (unique(s)) return s;
      if (cur.parentElement && cur.parentElement.id && unique('#' + cssEsc(cur.parentElement.id))) return '#' + cssEsc(cur.parentElement.id) + ' > ' + s;
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }
  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    return !el.closest('[aria-hidden="true"],[inert]');
  }
  // The visually-hidden (sr-only) pattern, detected by computed style rather than class name:
  // a <=1px box with overflow hidden/clip, or an absolutely positioned box clipped to nothing
  // (clip: rect(0 0 0 0) / clip-path: inset(50%)).
  function visuallyHidden(el, cs) {
    cs = cs || getComputedStyle(el);
    var r = el.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1 && /(hidden|clip)/.test(cs.overflowX + ' ' + cs.overflowY)) return true;
    if (!/^(absolute|fixed)$/.test(cs.position)) return false;
    if (/^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/.test(cs.clip)) return true;
    return /^inset\(\s*50%\s*\)$/.test(cs.clipPath);
  }
  var cv = document.createElement('canvas'); cv.width = cv.height = 1;
  var ctx = cv.getContext('2d', { willReadFrequently: true }), cc = {};
  function rgba(str) {
    if (!str) return null;
    if (cc[str]) return cc[str];
    if (str === 'transparent') return (cc[str] = [0, 0, 0, 0]);
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = str; ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return (cc[str] = [d[0], d[1], d[2], d[3] / 255]);
  }
  function blend(top, bot) {
    var a = top[3] + bot[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map(function (i) { return (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a; }).concat(a);
  }
  function lum(c) {
    var v = c.slice(0, 3).map(function (x) { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function effectiveBg(el) {
    var layers = [];
    for (var cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      var cs = getComputedStyle(cur);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      if (/^(IMG|VIDEO|CANVAS|PICTURE|SVG)$/i.test(cur.tagName)) return null;
      var c = rgba(cs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    var base = [255, 255, 255, 1];
    for (var i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  }
  function ownText(el) {
    var t = '';
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) t += n.nodeValue;
    return t.trim();
  }
  function accName(el) {
    var t = (el.getAttribute('aria-label') || '').trim();
    if (t) return t;
    var lb = el.getAttribute('aria-labelledby');
    if (lb) { t = lb.split(/\s+/).map(function (id) { var n = document.getElementById(id); return n ? n.textContent : ''; }).join(' ').trim(); if (t) return t; }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      if (el.labels && el.labels.length) { t = Array.prototype.map.call(el.labels, function (l) { return l.textContent; }).join(' ').trim(); if (t) return t; }
      if (/^(submit|button|reset)$/.test(el.type) && el.value) return el.value;
      if (el.type === 'image' && el.alt) return el.alt;
    } else {
      t = (el.innerText || el.textContent || '').trim();
      if (t) return t;
      var img = el.querySelector('img[alt]:not([alt=""]),svg[aria-label],[role="img"][aria-label]');
      if (img) return img.getAttribute('alt') || img.getAttribute('aria-label');
      var st = el.querySelector('svg title'); if (st && st.textContent.trim()) return st.textContent.trim();
    }
    return (el.getAttribute('title') || '').trim();
  }

  window.__fguProbe = async function (opts) {
    opts = opts || {};
    var max = opts.maxPerRule || 15, skip = opts.skip || [], findings = [], counts = {}, errors = [];
    var vw = window.innerWidth, vh = window.innerHeight;
    function add(rule, severity, el, message, card) {
      counts[rule] = (counts[rule] || 0) + 1;
      if (counts[rule] > max) return;
      findings.push({ rule: rule, severity: severity, file: null, line: null, selector: typeof el === 'string' ? el : sel(el), message: message, card: card });
    }
    function fail(name) { return function (e) { errors.push(name + ': ' + (e && e.message)); }; }
    function run(name, fn) {
      if (skip.indexOf(name) >= 0) return;
      try { var r = fn(); return r && r.then ? r.catch(fail(name)) : r; } catch (e) { fail(name)(e); }
    }
    var all = Array.prototype.slice.call(document.body ? document.body.querySelectorAll('*') : []);
    var root = document.documentElement;
    var overflowX = Math.max(root.scrollWidth, document.body ? document.body.scrollWidth : 0) > vw + 1;

    run('overflow-x', function () {
      if (!overflowX) return;
      var off = all.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (!(r.right > vw + 1 || r.left < -1) || r.width === 0) return false;
        for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(p).overflowX)) return false;
        }
        return !(el.parentElement && off0(el.parentElement));
      });
      function off0(p) { var r = p.getBoundingClientRect(); return p !== document.body && (r.right > vw + 1 || r.left < -1); }
      add('overflow-x', 'high', 'html', 'Page scrolls horizontally: scrollWidth ' + root.scrollWidth + 'px > viewport ' + vw + 'px', 'layout.intrinsic-responsive');
      off.slice(0, 10).forEach(function (el) { var r = el.getBoundingClientRect(); add('overflow-x-element', 'high', el, 'Extends past viewport (left ' + Math.round(r.left) + ', right ' + Math.round(r.right) + ')', 'layout.intrinsic-responsive'); });
    });

    run('clipped-text', function () {
      all.forEach(function (el) {
        if (!ownText(el) || !visible(el)) return;
        var cs = getComputedStyle(el);
        if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) return;
        if (visuallyHidden(el, cs)) return; // .sr-only / .visually-hidden: clipped on purpose, read by screen readers
        var x = /(hidden|clip)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
        var y = /(hidden|clip)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
        if (x || y) add('clipped-text', 'medium', el, 'Text is cut off (' + (x ? 'horizontal' : 'vertical') + ') without an ellipsis', 'layout.intrinsic-responsive');
      });
    });

    var focusables = all.filter(function (el) { return el.matches('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[tabindex]:not([tabindex="-1"])') && !el.disabled && visible(el); });

    run('small-target', function () {
      var min = opts.touch ? 44 : 24;
      focusables.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width >= min && r.height >= min) return;
        if (el.tagName === 'A' && el.parentElement && /^(P|LI|SPAN|TD|DD|LABEL)$/.test(el.parentElement.tagName) && (el.parentElement.textContent || '').trim().length > (el.textContent || '').trim().length + 10) return; // inline link exception
        var sev = r.width < 24 || r.height < 24 ? 'medium' : 'low';
        add('small-target', sev, el, 'Target ' + Math.round(r.width) + 'x' + Math.round(r.height) + 'px < ' + min + 'px' + (opts.touch ? ' (touch)' : ''), 'a11y.target-size');
      });
    });

    run('small-input-font', function () {
      if (vw >= 768) return;
      all.forEach(function (el) {
        if (!el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]):not([type=submit]):not([type=button]),select,textarea') || !visible(el)) return;
        var fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) add('small-input-font', 'medium', el, 'Input font-size ' + fs + 'px < 16px at ' + vw + 'px (iOS zooms on focus)', 'a11y.target-size');
      });
    });

    run('low-contrast', function () {
      var n = 0;
      for (var i = 0; i < all.length && n < 600; i++) {
        var el = all[i];
        if (!ownText(el) || !visible(el) || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(el.tagName)) continue;
        n++;
        var cs = getComputedStyle(el), bg = effectiveBg(el);
        if (!bg) { counts['contrast-unknown'] = (counts['contrast-unknown'] || 0) + 1; continue; }
        var fg = blend(rgba(cs.color), bg), cr = ratio(fg, bg);
        var size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        var large = size >= 24 || (bold && size >= 18.66), need = large ? 3 : 4.5;
        if (cr < need) add('low-contrast', cr < need - 1 ? 'high' : 'medium', el, 'Contrast ' + cr.toFixed(2) + ':1 < ' + need + ':1 (' + size + 'px' + (bold ? ' bold' : '') + ')', 'a11y.contrast-minimums');
      }
    });

    run('missing-name', function () {
      all.forEach(function (el) {
        if (!el.matches('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=link]') || !visible(el)) return;
        if (!accName(el)) add('missing-name', 'high', el, '<' + el.tagName.toLowerCase() + '> has no accessible name' + (el.placeholder ? ' (placeholder is not a label)' : ''), 'a11y.semantic-first');
      });
    });

    run('heading-order', function () {
      var hs = all.filter(function (el) { return /^H[1-6]$/.test(el.tagName) || (el.getAttribute('role') === 'heading' && el.getAttribute('aria-level')); }).filter(visible);
      var prev = 0;
      if (hs.length && !hs.some(function (h) { return h.tagName === 'H1' || h.getAttribute('aria-level') === '1'; })) add('heading-order', 'low', 'html', 'No h1 on the page', 'a11y.semantic-first');
      hs.forEach(function (h) {
        var lv = /^H\d$/.test(h.tagName) ? +h.tagName[1] : +h.getAttribute('aria-level');
        if (prev && lv > prev + 1) add('heading-order', 'low', h, 'Heading jumps h' + prev + ' -> h' + lv, 'a11y.semantic-first');
        prev = lv;
      });
    });

    run('img-no-alt', function () {
      all.forEach(function (el) {
        if (el.tagName === 'IMG' && !el.hasAttribute('alt') && !el.closest('[aria-hidden="true"]') && el.getAttribute('role') !== 'presentation') add('img-no-alt', 'medium', el, 'Image has no alt attribute (use alt="" if decorative)', 'a11y.semantic-first');
        if (el.getAttribute('role') === 'img' && !accName(el)) add('img-no-alt', 'medium', el, 'role="img" without a label', 'a11y.semantic-first');
      });
    });

    var focusStats = null;
    if (opts.focus) await run('focus-visible', async function () {
      var st = document.createElement('style');
      st.textContent = '*,*::before,*::after{transition:none!important;animation-play-state:paused!important}';
      document.head.appendChild(st);
      function fv(el) { try { return el.matches(':focus-visible'); } catch (_) { return true; } } // no :focus-visible support: don't gate
      var prevActive = document.activeElement, prevFV = !!(prevActive && prevActive !== document.body && fv(prevActive));
      // Visible signature of a box. Outline sub-properties only count when an outline is actually drawn
      // (Chromium's UA sheet changes outline-offset on a:focus-visible even under `outline: none`).
      function outlineSig(cs) { return cs.outlineStyle === 'none' || !(parseFloat(cs.outlineWidth) > 0) ? 'none' : [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset].join(' '); }
      function boxSig(cs) { return [outlineSig(cs), cs.boxShadow, cs.borderTopStyle === 'none' ? 'none' : cs.borderColor + ' ' + cs.borderWidth, cs.backgroundColor].join('|'); }
      function pseudoSig(el, p) { var cs = getComputedStyle(el, p); return cs.content === 'none' || cs.content === 'normal' ? 'none' : [cs.content, cs.opacity, cs.transform, cs.visibility, boxSig(cs)].join('|'); }
      // The element itself, its ::before/::after, and the neighbours focus styles commonly target
      // (`.field:has(input:focus-visible)`, `input:focus-visible + span`, `:focus-within`).
      function snapshot(el) {
        var cs = getComputedStyle(el), s = [boxSig(cs), cs.color, cs.textDecorationLine, pseudoSig(el, '::before'), pseudoSig(el, '::after')];
        if (el.parentElement && el.parentElement !== document.body) s.push(boxSig(getComputedStyle(el.parentElement)));
        if (el.nextElementSibling) s.push(boxSig(getComputedStyle(el.nextElementSibling)));
        return s.join('#');
      }
      var checked = 0, unverified = 0;
      try {
        for (var i = 0; i < focusables.length && i < (opts.focusLimit || 60); i++) {
          var el = focusables[i];
          if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
          var b = snapshot(el);
          // focusVisible:true makes scripted focus match :focus-visible (as keyboard Tab would). A plain
          // el.focus() after any mouse click does not, so every :focus-visible style looked absent.
          el.focus({ preventScroll: true, focusVisible: true });
          if (document.activeElement !== el) continue;
          if (!fv(el)) { unverified++; el.blur(); continue; } // browser ignored focusVisible: can't judge
          checked++;
          var after = getComputedStyle(el);
          var changed = snapshot(el) !== b;
          var ring = outlineSig(after) !== 'none';
          if (!changed) add('focus-invisible', 'high', el, 'No visible change on focus (outline/box-shadow/border/background identical)', 'a11y.focus-visible');
          else if (ring && after.outlineStyle !== 'auto' && parseFloat(after.outlineWidth) < 2) add('focus-weak', 'low', el, 'Focus outline ' + after.outlineWidth + ' (< 2px; WCAG 2.4.13 AAA advisory)', 'a11y.focus-visible');
          var r = el.getBoundingClientRect();
          if (r.right <= 0 || r.bottom + scrollY <= 0 || r.left >= root.scrollWidth) add('focus-hidden', 'medium', el, 'Focused element is off-canvas', 'a11y.focus-visible');
          el.blur();
        }
      } finally {
        if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
        // Restore focus without leaving a forced ring behind for the screenshot taken next.
        if (prevActive && prevActive !== document.body && prevActive.focus) prevActive.focus({ preventScroll: true, focusVisible: prevFV });
        st.remove();
        focusStats = { checked: checked, unverified: unverified };
      }
    });

    var animations = [];
    run('animations', function () {
      var list = new Set(document.getAnimations ? document.getAnimations() : []);
      seen.forEach(function (a) { list.add(a); });
      var byKey = {};
      list.forEach(function (a) {
        var ef = a.effect; if (!ef) return;
        var t = ef.getTiming ? ef.getTiming() : {}, target = ef.target, props = [];
        var kf = ef.getKeyframes ? ef.getKeyframes() : [], easing = t.easing || 'linear';
        if (a.transitionProperty) props = [a.transitionProperty];
        else kf.forEach(function (k) { Object.keys(k).forEach(function (p) { if (['offset', 'computedOffset', 'easing', 'composite'].indexOf(p) < 0 && props.indexOf(p) < 0) props.push(p); }); });
        if (easing === 'linear' && kf[0] && kf[0].easing && kf[0].easing !== 'linear') easing = kf[0].easing;
        var s = target ? sel(target) + (ef.pseudoElement || '') : null;
        var name = a.animationName || a.transitionProperty || a.id || 'waapi';
        var key = s + '|' + name;
        if (byKey[key]) return;
        var rec = byKey[key] = { selector: s, name: name, duration: typeof t.duration === 'number' ? t.duration : null, delay: t.delay || 0, easing: easing, properties: props, iterations: t.iterations === Infinity ? 'infinite' : t.iterations };
        animations.push(rec);
        var bad = props.filter(function (p) { return COMPOSITOR.indexOf(p) < 0 && COLOR_PROPS.indexOf(p) < 0 && p !== 'all'; });
        if (props.indexOf('all') >= 0) add('anim-transition-all', 'medium', s, 'transition: all animates every changed property', 'motion.compositor-only');
        if (bad.length) add('anim-non-compositor', bad.some(function (p) { return LAYOUT.test(p); }) ? 'high' : 'medium', s, name + ' animates ' + bad.join(', ') + ' (not transform/opacity)', 'motion.compositor-only');
        else if (props.some(function (p) { return COLOR_PROPS.indexOf(p) >= 0; })) add('anim-color', 'low', s, name + ' animates colour (acceptable; keep it short)', 'motion.compositor-only');
        if (rec.iterations !== 'infinite' && rec.duration != null) {
          if (rec.duration > 500) add('anim-long-duration', 'medium', s, name + ' runs ' + rec.duration + 'ms > 500ms', 'motion.frequency-budget');
          else if (rec.duration > 300) add('anim-long-duration', 'low', s, name + ' runs ' + rec.duration + 'ms > 300ms (routine UI budget)', 'motion.frequency-budget');
        }
        if (rec.iterations === 'infinite' && target && target.isConnected) {
          var host = target.closest('p,li,article,section,main,[role=main]') || target.parentElement;
          if ((target.innerText || '').trim().length > 20 || (host && (host.innerText || '').trim().length > 40)) add('anim-infinite-near-text', 'medium', s, name + ' loops forever next to readable text', 'motion.purpose-only');
        }
        if (opts.reducedMotion && props.some(function (p) { return SPATIAL.test(p); })) add('motion-under-reduce', 'medium', s, name + ' moves elements while prefers-reduced-motion is reduce (keep fades, drop movement)', 'motion.reduced-motion');
      });
    });

    await new Promise(function (r) { setTimeout(r, 30); });
    run('cls', function () {
      if (cls > 0.25) add('layout-shift', 'high', 'html', 'Cumulative layout shift ' + cls.toFixed(3) + ' > 0.25', 'states.loading-perceived');
      else if (cls > 0.1) add('layout-shift', 'medium', 'html', 'Cumulative layout shift ' + cls.toFixed(3) + ' > 0.1', 'states.loading-perceived');
    });

    var type = null, tokenCoverage = null;
    run('type-stats', function () {
      var sizes = {}, weights = {}, fams = {}, maxCh = 0, minLh = null;
      all.forEach(function (el) {
        if (!ownText(el) || !visible(el)) return;
        var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
        sizes[fs] = (sizes[fs] || 0) + 1; weights[cs.fontWeight] = 1;
        fams[cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()] = 1;
        if (el.tagName === 'P' && ownText(el).length > 120) {
          maxCh = Math.max(maxCh, Math.round(el.clientWidth / (fs * 0.5)));
          var lh = parseFloat(cs.lineHeight); if (lh) minLh = Math.min(minLh == null ? 9 : minLh, +(lh / fs).toFixed(2));
        }
      });
      var body = Object.keys(sizes).sort(function (a, b) { return sizes[b] - sizes[a]; })[0];
      type = { sizes: Object.keys(sizes).map(Number).sort(function (a, b) { return a - b; }), weights: Object.keys(weights), families: Object.keys(fams),
        bodySize: body ? +body : null, paragraphMaxCh: maxCh || null, paragraphMinLineHeight: minLh };
    });

    run('off-token', function () {
      var tk = opts.tokens; if (!tk) return;
      var colors = (tk.colors || []).map(rgba).filter(Boolean), spacing = (tk.spacing || []).map(Number);
      var offC = {}, offS = {}, checked = 0, off = 0;
      function near(c) { return c[3] === 0 || colors.some(function (t) { return Math.abs(t[0] - c[0]) <= 2 && Math.abs(t[1] - c[1]) <= 2 && Math.abs(t[2] - c[2]) <= 2; }); }
      all.slice(0, opts.tokenSample || 400).forEach(function (el) {
        if (!visible(el)) return;
        var cs = getComputedStyle(el);
        if (colors.length) ['color', 'backgroundColor', 'borderTopColor'].forEach(function (p) {
          if (p === 'borderTopColor' && !(parseFloat(cs.borderTopWidth) > 0)) return;
          if (p === 'color' && !ownText(el)) return;
          var v = cs[p], c = rgba(v); if (!c || c[3] === 0) return; checked++;
          if (!near(c)) { off++; (offC[v] = offC[v] || []).push(el); }
        });
        if (spacing.length) ['marginTop', 'marginBottom', 'paddingTop', 'paddingLeft', 'rowGap', 'columnGap'].forEach(function (p) {
          var n = parseFloat(cs[p]); if (!n || isNaN(n) || Math.abs(n) <= 2) return; checked++;
          if (!spacing.some(function (s) { return Math.abs(Math.abs(n) - s) <= 0.5; })) { off++; (offS[n + 'px'] = offS[n + 'px'] || []).push(el); }
        });
      });
      tokenCoverage = { checked: checked, off: off, ratio: checked ? +(1 - off / checked).toFixed(3) : null };
      Object.keys(offC).sort(function (a, b) { return offC[b].length - offC[a].length; }).forEach(function (v) { add('off-token-color', 'low', offC[v][0], v + ' is not a token colour (' + offC[v].length + ' elements)', 'color.role-scale'); });
      Object.keys(offS).sort(function (a, b) { return offS[b].length - offS[a].length; }).forEach(function (v) { add('off-token-spacing', 'low', offS[v][0], v + ' is off the spacing scale (' + offS[v].length + ' elements)', 'layout.spacing-scale'); });
    });

    var summary = { high: 0, medium: 0, low: 0 };
    findings.forEach(function (f) { summary[f.severity]++; });
    var truncated = {}; Object.keys(counts).forEach(function (k) { if (k !== 'contrast-unknown' && counts[k] > max) truncated[k] = counts[k]; });
    return {
      tool: 'probe', url: location.href, findings: findings, summary: summary, animations: animations,
      metrics: { overflowX: overflowX, cls: +cls.toFixed(4), viewport: { width: vw, height: vh }, contrastUnknown: counts['contrast-unknown'] || 0, type: type, tokenCoverage: tokenCoverage, truncated: truncated, focus: focusStats },
      errors: errors
    };
  };
})();
