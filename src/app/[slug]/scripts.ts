// ── Countdown script ──────────────────────────────────────────────────────────

export function buildCountdownScript(): string {
  return `<script>
(function(){
  document.querySelectorAll('[data-cd-clock]').forEach(function(container){
    var raw = container.getAttribute('data-date');
    if (!raw) return;
    var target = raw.includes('T') ? new Date(raw) : new Date(raw + 'T00:00:00');
    if (isNaN(target.getTime())) return;
    var bid = container.getAttribute('data-block-id') || '';
    var els = {
      days:  document.getElementById('cd-days-'  + bid),
      hours: document.getElementById('cd-hours-' + bid),
      mins:  document.getElementById('cd-mins-'  + bid),
      secs:  document.getElementById('cd-secs-'  + bid),
    };
    var timer;
    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        ['days','hours','mins','secs'].forEach(function(k){ if(els[k]) els[k].textContent='0'; });
        clearInterval(timer);
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (els.days)  els.days.textContent  = String(d);
      if (els.hours) els.hours.textContent = String(h).padStart(2, '0');
      if (els.mins)  els.mins.textContent  = String(m).padStart(2, '0');
      if (els.secs)  els.secs.textContent  = String(s).padStart(2, '0');
    }
    tick();
    timer = setInterval(tick, 1000);
  });
})();
</script>`;
}

// ── postMessage listener script ───────────────────────────────────────────────

export function buildMessageListenerScript(): string {
  return `<script>
(function(){
  function applySiteSettings(delta) {
    var root = document.documentElement;
    var map = {
      accentColor: '--site-accent',
      bgColor: '--bg',
      headingColor: '--heading-color',
      bodyColor: '--body-color',
      siteTextColor: '--site-text',
      siteBorderColor: '--site-border',
      navBg: '--nav-bg',
      navBrandColor: '--nav-brand',
      navLinkColor: '--nav-link',
      navHighlightColor: '--nav-highlight',
      musicBtnBg: '--music-btn-bg',
      musicBtnColor: '--music-btn-color',
    };
    Object.keys(delta).forEach(function(k) {
      if (map[k]) root.style.setProperty(map[k], String(delta[k]));
    });
    if ('siteTextColor' in delta) root.style.setProperty('--text', String(delta.siteTextColor || '#292524'));
    if ('bodyColor' in delta) root.style.setProperty('--site-muted', String(delta.bodyColor || '#78716c'));
    if ('headingFont' in delta) root.style.setProperty('--heading-font', String(delta.headingFont || 'Georgia, serif'));
    if ('bodyFont' in delta) root.style.setProperty('--body-font', String(delta.bodyFont || 'system-ui, sans-serif'));
    if ('marginTop' in delta || 'marginRight' in delta || 'marginBottom' in delta || 'marginLeft' in delta) {
      var siteContent = document.getElementById('site-content');
      if (siteContent) {
        var mt = delta.marginTop  != null ? Number(delta.marginTop)  : 0;
        var mr = delta.marginRight != null ? Number(delta.marginRight) : 0;
        var mb = delta.marginBottom != null ? Number(delta.marginBottom) : 0;
        var ml = delta.marginLeft != null ? Number(delta.marginLeft) : 0;
        siteContent.style.padding = mt + 'px ' + mr + 'px ' + mb + 'px ' + ml + 'px';
        var _overflow = (mt || mr || mb || ml) ? 'hidden' : '';
        siteContent.style.overflowX = _overflow;
        siteContent.style.overflowY = _overflow;
        var siteBg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#fff';
        var cT = document.querySelector('.margin-curtain-t');
        var cB = document.querySelector('.margin-curtain-b');
        var cL = document.querySelector('.margin-curtain-l');
        var cR = document.querySelector('.margin-curtain-r');
        if (cT) { cT.style.height = mt + 'px'; if (mt) cT.style.background = siteBg; }
        if (cB) { cB.style.height = mb + 'px'; if (mb) cB.style.background = siteBg; }
        if (cL) { cL.style.width = ml + 'px'; if (ml) cL.style.background = siteBg; }
        if (cR) { cR.style.width = mr + 'px'; if (mr) cR.style.background = siteBg; }
        var hasAny = mt || mr || mb || ml;
        var navEls = document.querySelectorAll('.site-nav, .site-nav-row');
        navEls.forEach(function(n) {
          n.style.zIndex = hasAny ? '9991' : '';
        });
      }
    }
    if ('sectionSpacing' in delta) {
      root.style.setProperty('--section-spacing', (Number(delta.sectionSpacing) || 0) + 'px');
    }
    if ('siteMaxWidth' in delta) {
      var sc = document.getElementById('site-content');
      if (sc) {
        var mw = delta.siteMaxWidth ? Number(delta.siteMaxWidth) : 0;
        sc.style.maxWidth = mw ? mw + 'px' : '';
        sc.style.marginLeft = mw ? 'auto' : '';
        sc.style.marginRight = mw ? 'auto' : '';
      }
    }
    function toBackgroundPercent(value, fallback) {
      if (value == null || value === '') return fallback;
      var numeric = Number(value);
      return (Number.isFinite ? Number.isFinite(numeric) : isFinite(numeric)) ? numeric : fallback;
    }
    function toBackgroundSize(value, fallback) {
      return 'auto ' + Math.max(100, toBackgroundPercent(value, fallback)) + '%';
    }
    function hasBackgroundImage(surface) {
      if (!surface) return false;
      if (surface.style.backgroundImage && surface.style.backgroundImage !== 'none') return true;
      try {
        return getComputedStyle(surface).backgroundImage !== 'none';
      } catch(e) {
        return false;
      }
    }
    function activeNonOverlayBackgroundSurface(layer, siteContent) {
      if (layer === 'content' || layer === 'content-only' || layer === 'content_only') return siteContent || document.body;
      if (layer === 'full-page' || layer === 'fullPage' || layer === 'page') return document.body;
      if (siteContent && hasBackgroundImage(siteContent)) return siteContent;
      return document.body;
    }
    function applyBgZoomPosition(surface, delta) {
      if (!surface) return;
      if ('bgImageZoom' in delta) {
        surface.style.backgroundSize = toBackgroundSize(delta.bgImageZoom, 100);
        surface.style.backgroundRepeat = 'no-repeat';
      }
      if ('bgImagePositionX' in delta || 'bgImagePositionY' in delta) {
        var px = delta.bgImagePositionX != null ? toBackgroundPercent(delta.bgImagePositionX, 50) : 50;
        var py = delta.bgImagePositionY != null ? toBackgroundPercent(delta.bgImagePositionY, 50) : 50;
        surface.style.backgroundPosition = px + '% ' + py + '%';
        surface.style.backgroundRepeat = 'no-repeat';
      }
    }
    if ('bgImageLayer' in delta || 'bgImageOpacity' in delta || 'bgImageZoom' in delta || 'bgImagePositionX' in delta || 'bgImagePositionY' in delta) {
      var bgOv = document.getElementById('bg-overlay');
      var siteBgSurface = document.getElementById('site-content');
      var layer = delta.bgImageLayer;
      if (bgOv) {
        if ('bgImageLayer' in delta) {
          var isOverlay = layer === 'overlay';
          bgOv.style.display = isOverlay ? '' : 'none';
        }
        if ('bgImageOpacity' in delta && delta.bgImageOpacity != null) {
          bgOv.style.opacity = String(delta.bgImageOpacity);
        }
        applyBgZoomPosition(bgOv, delta);
      }
      var overlayActive = layer === 'overlay' || (layer == null && bgOv && bgOv.style.display !== 'none');
      if (!overlayActive) {
        var bgSurface = activeNonOverlayBackgroundSurface(layer, siteBgSurface);
        if ('bgImageLayer' in delta && bgOv && bgSurface) {
          bgSurface.style.backgroundImage = bgOv.style.backgroundImage;
          bgSurface.style.backgroundSize = bgOv.style.backgroundSize || bgSurface.style.backgroundSize;
          bgSurface.style.backgroundPosition = bgOv.style.backgroundPosition || bgSurface.style.backgroundPosition;
          bgSurface.style.backgroundRepeat = bgOv.style.backgroundRepeat || 'no-repeat';
          bgSurface.style.backgroundAttachment = 'fixed';
          if (bgSurface === document.body && siteBgSurface) siteBgSurface.style.backgroundImage = '';
          if (bgSurface === siteBgSurface) document.body.style.backgroundImage = '';
        }
        applyBgZoomPosition(bgSurface, delta);
      }
    }
    if ('backgroundImage' in delta) {
      var pageBg = document.getElementById('page-bg-image');
      var sc = document.getElementById('site-content');
      if (delta.backgroundImage) {
        try {
          var bi = JSON.parse(String(delta.backgroundImage));
          if (bi && bi.url) {
            var bsize = bi.fit === 'cover' ? 'cover' : bi.fit === 'contain' ? 'contain' : 'auto';
            var brepeat = bi.fit === 'repeat' ? 'repeat' : 'no-repeat';
            var bpos = bi.position || 'center';
            var bop = bi.opacity != null ? String(bi.opacity) : '1';
            if (bi.scope === 'page') {
              if (!pageBg) { pageBg = document.createElement('div'); pageBg.id = 'page-bg-image'; pageBg.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;'; document.body.insertBefore(pageBg, document.body.firstChild); }
              pageBg.style.display = 'none';
              if (sc) { sc.style.backgroundImage = "url('" + bi.url + "')"; sc.style.backgroundSize = bsize; sc.style.backgroundRepeat = brepeat; sc.style.backgroundPosition = bpos; }
            } else {
              if (sc) { sc.style.backgroundImage = ''; sc.style.backgroundSize = ''; sc.style.backgroundRepeat = ''; sc.style.backgroundPosition = ''; }
              if (!pageBg) { pageBg = document.createElement('div'); pageBg.id = 'page-bg-image'; pageBg.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background-attachment:fixed;'; document.body.insertBefore(pageBg, document.body.firstChild); }
              pageBg.style.backgroundImage = "url('" + bi.url + "')";
              pageBg.style.backgroundSize = bsize;
              pageBg.style.backgroundRepeat = brepeat;
              pageBg.style.backgroundPosition = bpos;
              pageBg.style.opacity = bop;
              pageBg.style.display = '';
            }
          }
        } catch(e) {}
      } else {
        if (pageBg) pageBg.style.display = 'none';
        if (sc) { sc.style.backgroundImage = ''; }
      }
    }
    if ('envelopeColor' in delta) {
      var introOverlay = document.getElementById('intro-overlay');
      if (introOverlay) {
        if (delta.envelopeColor) {
          introOverlay.style.setProperty('--env-color', String(delta.envelopeColor));
        } else {
          introOverlay.style.removeProperty('--env-color');
        }
      }
    }
    if ('showNavBrand' in delta) {
      var showBrand = !!delta.showNavBrand;
      var nb = document.querySelector('.site-nav-brand');
      var nbo = document.querySelector('.site-nav-brand-outside');
      if (nb) nb.style.display = showBrand ? '' : 'none';
      if (nbo) nbo.style.display = showBrand ? '' : 'none';
    }
  }

  function applyBlockConfig(blockId, cfg) {
    var node = document.querySelector('[data-block-id="' + blockId + '"]');
    if (!node) return;
    var type = node.getAttribute('data-block-type');

    if (type === 'countdown') {
      var labelEl = node.querySelector('.countdown-label');
      if (labelEl && cfg.label != null) labelEl.textContent = String(cfg.label);
      var rsvpWrap = node.querySelector('.rsvp-wrap');
      if (rsvpWrap) rsvpWrap.style.display = cfg.showRsvpButton ? '' : 'none';
      var rsvpBtn = node.querySelector('.rsvp-wrap .rsvp-submit');
      if (rsvpBtn) {
        if ('rsvpButtonColor' in cfg) rsvpBtn.style.background = cfg.rsvpButtonColor ? String(cfg.rsvpButtonColor) : '';
        if ('rsvpButtonTextColor' in cfg) rsvpBtn.style.color = cfg.rsvpButtonTextColor ? String(cfg.rsvpButtonTextColor) : '';
        if ('rsvpButtonBorderColor' in cfg) rsvpBtn.style.border = cfg.rsvpButtonBorderColor ? '2px solid ' + String(cfg.rsvpButtonBorderColor) : '';
      }
    }

    if (type === 'video') {
      // show/hide countdown overlay
      var overlay = node.querySelector('.video-cd-overlay');
      if (overlay) overlay.style.display = cfg.showCountdown ? '' : 'none';
      // update overlay position
      if (overlay && cfg.countdownX != null) overlay.style.transform = 'translateX(calc(-50% + ' + cfg.countdownX + 'px))';
      if (overlay && cfg.countdownY != null) overlay.style.bottom = cfg.countdownY + 'px';
      // update block height
      if (cfg.height && /^[\d.]+(px|dvh|vh|svh|%)$/.test(String(cfg.height))) {
        node.style.height = cfg.height;
      }
    }

    if (type === 'text') {
      var heading = node.querySelector('.section-heading');
      if (heading && cfg.heading != null) heading.textContent = String(cfg.heading);
      var body = node.querySelector('.text-body p');
      if (body && cfg.body != null) body.textContent = String(cfg.body);
    }

    if (type === 'images') {
      var imgs = node.querySelectorAll('.gallery-img');
      var photoR = cfg.photoRadius ? String(cfg.photoRadius) : '8px';
      var photoBW = cfg.photoBorder ? String(cfg.photoBorder) : '0';
      var photoBColor = cfg.photoBorderColor ? String(cfg.photoBorderColor) : '#e0dbd4';
      var phH = cfg.photoHeight ? String(Number(cfg.photoHeight)) + 'px' : '';
      var phW = cfg.photoWidth ? String(Number(cfg.photoWidth)) + 'px' : '';
      imgs.forEach(function(img) {
        img.style.borderRadius = photoR;
        img.style.border = (photoBW && photoBW !== '0') ? photoBW + ' solid ' + photoBColor : '';
        if (phH) img.style.height = phH;
        if (phW) img.style.width = phW;
      });
      var grid = node.querySelector('.image-grid');
      if (grid && cfg.galleryOffsetX != null) {
        var ox = Number(cfg.galleryOffsetX);
        grid.style.transform = ox !== 0 ? 'translateX(' + ox + 'px)' : '';
      }
    }

    if (type === 'photo-split') {
      var psImg = node.querySelector('.ps-photo img');
      if (psImg && cfg.photo) {
        var ph = cfg.photo;
        if (ph.widthPx) psImg.style.width = String(Number(ph.widthPx)) + 'px';
        else psImg.style.width = 'auto';
        if (ph.heightPx) psImg.style.height = String(Number(ph.heightPx)) + 'px';
        else psImg.style.height = 'auto';
        if (ph.crop) psImg.style.objectPosition = String(ph.crop);
        var psContainer = node.querySelector('.ps-photo');
        if (psContainer && ph.offsetX != null) {
          var pox = Number(ph.offsetX);
          psContainer.style.marginLeft = (cfg.photoSide !== 'right' && pox !== 0) ? pox + 'px' : '';
          psContainer.style.marginRight = (cfg.photoSide === 'right' && pox !== 0) ? pox + 'px' : '';
        }
      }
    }

    // Generic: background / text color
    if (cfg.background && cfg.background.type === 'color') {
      node.style.backgroundColor = cfg.background.value || '';
    } else if (cfg.background === null) {
      node.style.backgroundColor = '';
    }
    if (cfg.textColor) {
      node.style.color = String(cfg.textColor);
      node.style.setProperty('--block-text', String(cfg.textColor));
    } else if (cfg.textColor === null) {
      node.style.color = '';
      node.style.removeProperty('--block-text');
    }
    if ('borderColor' in cfg) {
      node.style.border = (cfg.borderColor && !cfg.hideBorder) ? '1px solid ' + String(cfg.borderColor) : '';
    }
  }

  window.addEventListener('message', function(event) {
    if (event.origin !== location.origin) return;
    var d = event.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'block_config_update') {
      applyBlockConfig(String(d.blockId), d.config || {});
    } else if (d.type === 'site_settings_update') {
      applySiteSettings(d.delta || {});
    }
  });
})();
</script>`;
}

export const VALID_PRESET_IDS = new Set([
  "fade-in",
  "spring-in",
  "fade-slide-up",
  "split-text",
  "mask-wipe",
  "parallax-monogram",
  "ken-burns",
  "scroll-pinned-story",
  "sticky-date",
  "blur-in",
  "envelope-unfold",
  "letter-cascade",
]);

export function buildBlockAnimationScript(usedPresets: Set<string>): string {
  const ids = [...usedPresets].filter((id) => VALID_PRESET_IDS.has(id));
  if (!ids.length) return "";

  // JSON-encoded array is safe to embed — preset IDs are allowlisted above
  const idsJson = JSON.stringify(ids);

  // <script type="module"> enables top-level await and native dynamic import().
  // GSAP CDN is already loaded synchronously in <head>, so `gsap` global is
  // available before this deferred module executes.
  return `<script type="module">
if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
const ids = ${idsJson};
const mods = await Promise.all(ids.map(id => import('/animations/presets/' + id + '.js')));
const fns = Object.fromEntries(ids.map((id, i) => [id, mods[i].default]));
const els = document.querySelectorAll('[data-animation]');
if (!els.length) return;
function getOpts(el) {
  return {
    duration: parseFloat(el.dataset.animationDuration || '') || undefined,
    delay: parseFloat(el.dataset.animationDelay || '') || undefined,
    easing: el.dataset.animationEasing || undefined,
  };
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const trigger = e.target.dataset.animationTrigger || 'on-view';
    if (trigger !== 'on-view') { io.unobserve(e.target); continue; }
    const fn = fns[e.target.dataset.animation];
    if (fn) { fn(e.target, getOpts(e.target)); io.unobserve(e.target); }
  }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
const hoverEls = [...els].filter(el => el.dataset.animationTrigger === 'on-hover');
for (const el of hoverEls) {
  const fn = fns[el.dataset.animation];
  if (fn) el.addEventListener('mouseenter', () => fn(el, getOpts(el)), { once: true });
}
const scrubEls = [...els].filter(el => el.dataset.animationTrigger === 'on-scroll-scrub');
if (scrubEls.length && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  for (const el of scrubEls) {
    const fn = fns[el.dataset.animation];
    if (!fn) continue;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: true,
      onEnter: () => fn(el, { ...getOpts(el), scrub: true }),
    });
  }
}
for (const el of els) {
  const trigger = el.dataset.animationTrigger || 'on-view';
  if (trigger === 'on-view') io.observe(el);
}
</script>`;
}

// ── Responsive scaling script ────────────────────────────────────────────────

export function buildResponsiveScript(): string {
  return `<script>
(function(){
  var content=document.getElementById('site-content');
  if(!content)return;
  var daw=parseInt(content.getAttribute('data-designed-at-width'))||1440;
  var blockEls=content.querySelectorAll('.block[data-block-id]');
  var blocks=[];
  var fontEls=[];
  var mode='desktop';

  for(var i=0;i<blockEls.length;i++){
    var el=blockEls[i];
    blocks.push({
      el:el,
      origStyle:el.style.cssText,
      rect:el.getBoundingClientRect(),
      bw:parseFloat(el.getAttribute('data-bw'))||0,
      bml:parseFloat(el.getAttribute('data-bml'))||0,
      bx:parseFloat(el.getAttribute('data-box'))||0,
      by:parseFloat(el.getAttribute('data-boy'))||0,
      bh:parseFloat(el.getAttribute('data-bh'))||0,
      br:parseFloat(el.getAttribute('data-brot'))||0
    });
  }

  var textSel='h1,h2,h3,h4,h5,h6,p,li,dd,dt,label,strong,em,a,span,button';
  for(var i=0;i<blocks.length;i++){
    var texts=blocks[i].el.querySelectorAll(textSel);
    for(var j=0;j<texts.length;j++){
      var tel=texts[j];
      fontEls.push({el:tel,base:parseFloat(getComputedStyle(tel).fontSize),orig:tel.style.fontSize});
    }
  }

  function update(){
    var vw=window.innerWidth;
    var scale=vw/daw;

    // PRO MODE: per-block breakpoint overrides will be applied here before proportional scaling

    if(scale>=1){
      if(mode!=='desktop'){restore();mode='desktop';}
    }else if(scale>0.6){
      if(mode==='reflow')restoreReflow();
      applyProp(scale);
      mode='proportional';
    }else{
      if(mode==='proportional')restoreProp();
      if(mode!=='reflow'){applyReflow();mode='reflow';}
    }
  }

  function applyProp(scale){
    document.body.classList.add('ds-proportional');
    document.body.classList.remove('ds-reflow');
    content.style.zoom=String(scale);
    for(var i=0;i<fontEls.length;i++){
      var f=fontEls[i];
      var rendered=f.base*scale;
      f.el.style.fontSize=rendered<11?(11/scale)+'px':(f.orig||'');
    }
  }

  function restoreProp(){
    content.style.zoom='';
    document.body.classList.remove('ds-proportional');
    for(var i=0;i<fontEls.length;i++){fontEls[i].el.style.fontSize=fontEls[i].orig||'';}
  }

  function applyReflow(){
    document.body.classList.add('ds-reflow');
    document.body.classList.remove('ds-proportional');
    content.style.zoom='';
    for(var i=0;i<blocks.length;i++){
      var el=blocks[i].el;
      el.style.width='100%';el.style.marginLeft='0';el.style.marginRight='0';
      el.style.transform='none';el.style.height='auto';
      if(blocks[i].bw||blocks[i].bx||blocks[i].by){el.style.position='static';el.style.zIndex='auto';}
    }

    var containers=[];var standalone=[];
    for(var i=0;i<blocks.length;i++){
      var b=blocks[i];
      var hasBg=b.origStyle.indexOf('background')>=0;
      if(hasBg&&b.bw&&b.bw<100){containers.push(b);}
    }
    var assigned={};
    for(var i=0;i<blocks.length;i++){
      var b=blocks[i];
      if(containers.indexOf(b)>=0)continue;
      var best=null;var bestPct=0;
      for(var c=0;c<containers.length;c++){
        var pct=overlapPct(b.rect,containers[c].rect);
        if(pct>=0.65&&pct>bestPct){best=containers[c];bestPct=pct;}
      }
      if(best){
        var cid=best.el.getAttribute('data-block-id');
        if(!assigned[cid])assigned[cid]=[];
        assigned[cid].push(b);
      }else{standalone.push(b);}
    }
    var allGroups=[];
    for(var i=0;i<containers.length;i++){
      var cid=containers[i].el.getAttribute('data-block-id');
      var ch=assigned[cid]||[];
      ch.sort(function(a,b){return a.rect.top-b.rect.top;});
      allGroups.push({y:containers[i].rect.top,container:containers[i],children:ch});
    }
    for(var i=0;i<standalone.length;i++){
      allGroups.push({y:standalone[i].rect.top,container:null,children:[standalone[i]]});
    }
    allGroups.sort(function(a,b){return a.y-b.y;});
    var order=0;
    for(var g=0;g<allGroups.length;g++){
      var grp=allGroups[g];
      if(grp.container){grp.container.el.style.order=String(order++);}
      for(var c=0;c<grp.children.length;c++){grp.children[c].el.style.order=String(order++);}
    }
    for(var i=0;i<fontEls.length;i++){fontEls[i].el.style.fontSize='';}
    createHamburger();
  }

  function restoreReflow(){
    document.body.classList.remove('ds-reflow');
    for(var i=0;i<blocks.length;i++){blocks[i].el.style.cssText=blocks[i].origStyle;blocks[i].el.style.order='';}
    for(var i=0;i<fontEls.length;i++){fontEls[i].el.style.fontSize=fontEls[i].orig||'';}
    removeHamburger();
  }

  function restore(){
    if(mode==='proportional')restoreProp();
    if(mode==='reflow')restoreReflow();
  }

  function overlapPct(inner,outer){
    var x1=Math.max(inner.left,outer.left);var y1=Math.max(inner.top,outer.top);
    var x2=Math.min(inner.right,outer.right);var y2=Math.min(inner.bottom,outer.bottom);
    if(x2<=x1||y2<=y1)return 0;
    var area=(x2-x1)*(y2-y1);var iArea=inner.width*inner.height;
    return iArea>0?area/iArea:0;
  }

  function createHamburger(){
    var nav=document.querySelector('.site-nav');
    if(!nav||document.getElementById('ds-ham-btn'))return;
    var inner=nav.querySelector('.site-nav-inner');if(!inner)return;
    var btn=document.createElement('button');
    btn.id='ds-ham-btn';btn.className='ds-hamburger';
    btn.setAttribute('aria-label','Toggle menu');
    btn.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    inner.appendChild(btn);
    var dd=document.createElement('div');
    dd.id='ds-mobile-menu';dd.className='ds-mobile-menu';
    var links=nav.querySelectorAll('.site-nav-link');
    for(var i=0;i<links.length;i++){
      (function(link){
        var item=document.createElement('button');
        item.className='ds-mobile-menu-item';
        item.textContent=link.textContent;
        item.onclick=function(){link.click();dd.classList.remove('open');};
        dd.appendChild(item);
      })(links[i]);
    }
    nav.appendChild(dd);
    btn.onclick=function(){dd.classList.toggle('open');};
  }

  function removeHamburger(){
    var btn=document.getElementById('ds-ham-btn');if(btn)btn.remove();
    var dd=document.getElementById('ds-mobile-menu');if(dd)dd.remove();
  }

  var timer;
  window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(update,100);});
  update();
})();
</script>`;
}
