#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const baseUrl = process.env.S1_BASE_URL ?? 'http://127.0.0.1:4173/';
const chromeBin = process.env.CHROME_BIN;
const phase = process.argv.includes('--phase=before') ? 'before' : 'after';
const artifactDir = resolve('.w/screenshots', phase);
const browserTmp = resolve('.w/t');
const checks = [];
const shots = [];
const requests = [];

if (!chromeBin) {
  throw new Error('Set CHROME_BIN to a Chromium executable.');
}
mkdirSync(artifactDir, { recursive: true });
mkdirSync(browserTmp, { recursive: true });
mkdirSync(resolve('.w/home'), { recursive: true });

const profile = mkdtempSync(resolve('.w/chrome-s1-'));
const chrome = spawn(chromeBin, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-breakpad',
  '--disable-crash-reporter',
  '--disable-default-apps',
  '--disable-extensions',
  'about:blank'
], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOME: resolve('.w/home'),
    XDG_CONFIG_HOME: resolve('.w/config'),
    XDG_CACHE_HOME: resolve('.w/cache'),
    XDG_DATA_HOME: resolve('.w/data'),
    TMPDIR: '.w/t'
  },
  stdio: 'ignore'
});

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitForPort() {
  const activePort = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      return Number(readFileSync(activePort, 'utf8').split('\n')[0]);
    } catch {
      await delay(100);
    }
  }
  throw new Error('Chromium did not publish its DevTools port.');
}

function check(name, pass, detail = '') {
  checks.push({ name, pass, detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const port = await waitForPort();
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let commandId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
  if (message.id && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
  }
});

function send(method, params = {}) {
  const id = ++commandId;
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(functionBody) {
  const response = await send('Runtime.evaluate', {
    expression: `(${functionBody})()`,
    awaitPromise: true,
    returnByValue: true
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function scrollTo(y) {
  await evaluate(`() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo({ top: ${Math.max(0, y)}, behavior: 'instant' }); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }`);
}

async function navigate(url) {
  await send('Page.navigate', { url });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(`() => document.readyState === 'complete' && !!document.querySelector('.hero')`);
    if (ready) break;
    await delay(50);
  }
  await evaluate(`async () => { await document.fonts.ready; document.documentElement.style.scrollBehavior = 'auto'; return true; }`);
  await delay(1250);
}

async function setContext(width, height, motion, saveData = false) {
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 640
  });
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: motion === 'reduce' ? 'reduce' : 'no-preference' }]
  });
  if (saveData) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: 'Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });'
    });
  }
}

async function screenshot(name, width, height, locale, motion, problem, pin, equivalent = false) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  const file = `${name}-${width}-${locale}-${motion}.png`;
  writeFileSync(join(artifactDir, file), Buffer.from(data, 'base64'));
  const scrollY = await evaluate('() => Math.round(window.scrollY)');
  shots.push({ file, width, height, locale, motion, scrollY, problem, pin, equivalent });
  return scrollY;
}

async function press(key) {
  const keyCodes = { Tab: 9, Enter: 13, Escape: 27, ' ': 32 };
  const text = key === 'Enter' ? '\r' : undefined;
  await send('Input.dispatchKeyEvent', { type: key === 'Enter' ? 'keyDown' : 'rawKeyDown', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: keyCodes[key], text, unmodifiedText: text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: keyCodes[key] });
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  for (const width of [390, 860, 1440]) {
    const height = width === 1440 ? 900 : 844;
    for (const locale of ['es', 'en']) {
      for (const motion of ['normal', 'reduce']) {
        await setContext(width, height, motion);
        await navigate(`${baseUrl}?lang=${locale}`);
        const layout = await evaluate(`() => {
          const hero = document.querySelector('.hero');
          const stage = document.querySelector('.hero-stage');
          return { top: hero.getBoundingClientRect().top + scrollY, height: hero.offsetHeight,
            viewport: innerHeight, width: innerWidth, stageHeight: stage.getBoundingClientRect().height,
            stagePosition: getComputedStyle(stage).position, motionOk: document.documentElement.classList.contains('motion-ok'),
            supportsTimeline: CSS.supports('animation-timeline', 'view()') };
        }`);
        const shouldPin = motion === 'normal' && layout.motionOk && layout.supportsTimeline;
        check(`hero pin ${width}/${locale}/${motion}`, shouldPin ? layout.stagePosition === 'sticky' : layout.stagePosition !== 'sticky', JSON.stringify(layout));
        const pinTravel = Math.max(1, layout.height - layout.viewport);
        const start = 0;
        const middle = layout.top + pinTravel / 2;
        const end = Math.max(start, layout.top + pinTravel - 1);
        const released = layout.top + pinTravel + 1;
        const states = [];
        for (const [state, position] of [['start', start], ['mid', middle], ['end', end], ['released', released]]) {
          await scrollTo(position);
          const stateData = await evaluate(`() => {
            const rect = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}; };
            const css = sel => { const e=document.querySelector(sel),s=getComputedStyle(e); return {opacity:s.opacity,transform:s.transform,display:s.display,position:s.position}; };
            const hero=document.querySelector('.hero'), stage=document.querySelector('.hero-stage'), stageStyle=getComputedStyle(stage);
            const agent=rect('.agent-figure'), index=rect('.chapter-index');
            const head=rect('.hero-head'), copy=rect('.hero-copy'), network=rect('.hero-network'), sr=stage.getBoundingClientRect();
            const over=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
          const heroAgent=rect('.agent-figure'),heroCopy=rect('.hero-copy');
          return {scrollY:Math.round(scrollY), overlapAgentIndex:over(agent,index), overlapCopyNetwork:over(copy,network), overlapAgentNetwork:over(agent,network), overlapAgentCopy:over(heroAgent,heroCopy),
              headInside:head.top>=sr.top-1&&head.bottom<=sr.bottom+1, copyInside:copy.top>=sr.top-1&&copy.bottom<=sr.bottom+1,
              agentInside:agent.top>=sr.top-1&&agent.bottom<=sr.bottom+1, stageOccludesNetwork:stageStyle.position==='sticky'&&Number(stageStyle.zIndex)>0&&stageStyle.backgroundColor===getComputedStyle(document.body).backgroundColor,
              head:css('.hero-head'),copy:css('.hero-copy'),agent:css('.agent-figure'),autoplayHeld:document.querySelector('[data-thread]').hasAttribute('data-autoplay')};
          }`);
          states.push(stateData);
          if (state === 'start' && shouldPin && motion === 'normal' && Number(stateData.agent.opacity) < 0.95) {
            check(`agent scene waits until visible ${width}/${locale}`, stateData.autoplayHeld, JSON.stringify(stateData));
          }
          if (state === 'end' || state === 'released') {
            check(`no agent/index overlap ${width}/${locale}/${motion}/${state}`, !stateData.overlapAgentIndex, JSON.stringify(stateData));
          }
          if (width <= 860 && shouldPin && state === 'start') {
            check(`mobile stage contains content ${width}/${locale}/${state}`,
              stateData.headInside && stateData.copyInside, JSON.stringify(stateData));
          }
          if (width <= 860 && shouldPin && state === 'end') {
            check(`mobile agent arrives cleanly ${width}/${locale}`, stateData.headInside && stateData.copyInside && stateData.agentInside && Number(stateData.agent.opacity) > 0.95 && !stateData.overlapAgentIndex && stateData.stageOccludesNetwork && !(stateData.overlapAgentCopy && Number(stateData.copy.opacity) > 0.05), JSON.stringify(stateData));
          }
          await screenshot(`hero-${state}`, width, height, locale, motion, 'B1: pin stages, agent/index; hero copy, mobile network; chapter list', shouldPin, !shouldPin);
        }
        const distinct = JSON.stringify(states[0].head) !== JSON.stringify(states[1].head) ||
          JSON.stringify(states[0].copy) !== JSON.stringify(states[1].copy) ||
          JSON.stringify(states[0].agent) !== JSON.stringify(states[1].agent);
        check(`hero has distinct sequence ${width}/${locale}/${motion}`, !shouldPin || distinct, JSON.stringify(states.map(({head,copy,agent})=>({head,copy,agent}))));
        if (shouldPin && width <= 860) {
          const end = states[2];
          check(`mobile agent stays clear of index/map ${width}/${locale}`, !end.overlapAgentIndex && end.stageOccludesNetwork && !(end.overlapAgentCopy && Number(end.copy.opacity) > 0.05), JSON.stringify(end));
        }
        if (width === 1440) {
          const map = await evaluate(`() => {const e=document.querySelector('#norte .map');return {top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight,viewport:innerHeight,pinned:getComputedStyle(e).position==='sticky'};}`);
          for (const [state, position] of [['start', Math.max(0, map.top - map.viewport + 54)], ['mid', Math.max(0, map.top - 54)], ['end', map.top + map.height - 54], ['released', map.top + map.height + 1]]) {
            await scrollTo(position);
            await delay(450);
            await screenshot(`map-${state}`, width, height, locale, motion, 'David3/8: map pin, aligned map reveal, empty left stage', map.pinned, !map.pinned);
          }
        }
      }
    }
  }

  await setContext(390, 844, 'normal');
  await navigate(`${baseUrl}?lang=en&hero=stacked`);
  const stacked = await evaluate(`() => { const grid=document.querySelector('.hero-grid'),stage=document.querySelector('.hero-stage'),network=document.querySelector('.hero-network'); const g=getComputedStyle(grid),s=getComputedStyle(stage),n=getComputedStyle(network); return {display:g.display,rowGap:g.rowGap,columnGap:g.columnGap,stage:s.position,network:n.position}; }`);
  check('hero=stacked restores grid and gaps', stacked.display === 'grid' && parseFloat(stacked.rowGap) > 0 && parseFloat(stacked.columnGap) > 0 && stacked.stage === 'static' && stacked.network === 'static', JSON.stringify(stacked));
  await screenshot('hero-stacked-compare', 390, 844, 'en', 'normal', 'B1: query variant restores the unpinned grid comparison', false, true);

  for (const width of [861, 1440]) {
    const height = width === 1440 ? 900 : 844;
    for (const motion of ['normal', 'reduce']) {
      await setContext(width, height, motion);
      await navigate(`${baseUrl}?lang=en`);
      await evaluate(`() => { document.activeElement.blur(); window.scrollTo({top:0,behavior:'instant'}); }`);
      let heroFocusCount = 0;
      for (let tab = 0; tab < 35; tab += 1) {
        await press('Tab');
        const focused = await evaluate(`() => {
        const el=document.activeElement, hero=document.querySelector('.hero');
        if(!hero.contains(el)) return null;
        const r=el.getBoundingClientRect(), s=getComputedStyle(el);
        let opacity=1, node=el;
        while(node&&node!==document.body){opacity*=Number.parseFloat(getComputedStyle(node).opacity)||0;node=node.parentElement;}
        const x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)), y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));
        const hit=document.elementFromPoint(x,y);
        return {tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,40),opacity,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
          visibleHit:!!hit&&(hit===el||el.contains(hit)),outline:s.outlineStyle,outlineWidth:s.outlineWidth,boxShadow:s.boxShadow};
        }`);
        if (!focused) continue;
        heroFocusCount += 1;
        const inView = focused.rect.left >= -1 && focused.rect.right <= width + 1 && focused.rect.top >= -1 && focused.rect.bottom <= height + 1;
        const focusStyle = focused.outline !== 'none' && parseFloat(focused.outlineWidth) > 0 || focused.boxShadow !== 'none';
        check(`keyboard focus visible ${width}/${motion}/${focused.tag}/${heroFocusCount}`, focused.opacity > 0.95 && inView && focused.visibleHit && focusStyle, JSON.stringify(focused));
      }
      check(`keyboard reaches hero controls ${width}/${motion}`, heroFocusCount >= 3, String(heroFocusCount));
    }
  }

  await setContext(390, 844, 'normal');
  await navigate(`${baseUrl}?lang=en`);
  const indexLinks = await evaluate(`() => [...document.querySelectorAll('.chapter-index-row')].map(a=>({text:a.innerText,href:a.getAttribute('href')}))`);
  let indexHitCount = 0;
  const indexMisses = [];
  for (const index of indexLinks) {
    await evaluate(`() => { const a=[...document.querySelectorAll('.chapter-index-row')].find(x=>x.getAttribute('href')===${JSON.stringify(index.href)});a.scrollIntoView({block:'center',behavior:'instant'}); }`);
    const hit = await evaluate(`() => { const a=[...document.querySelectorAll('.chapter-index-row')].find(x=>x.getAttribute('href')===${JSON.stringify(index.href)});const r=a.getBoundingClientRect(), e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {hit:!!e&&(e===a||a.contains(e)),target:e?.tagName,class:e?.className,top:r.top,bottom:r.bottom}; }`);
    if (hit.hit) indexHitCount += 1;
    else indexMisses.push({ ...index, ...hit });
  }
  check('every index link passes hit-test', indexHitCount === indexLinks.length, `${indexHitCount}/${indexLinks.length}; misses=${JSON.stringify(indexMisses)}`);

  for (const locale of ['es', 'en']) {
    await navigate(`${baseUrl}?lang=${locale}`);
    const targetY = await evaluate(`() => {const e=document.querySelector('#programa .chapter-head'),r=e.getBoundingClientRect();return r.top+scrollY+r.height/2-innerHeight/2;}`);
    await scrollTo(targetY);
    const heading = await evaluate(`() => {const h=document.querySelector('#programa .chapter-head'),n=h.querySelector('.chapter-n').getBoundingClientRect(),l=h.querySelector('.chapter-lead').getBoundingClientRect();return {overlap:n.left<l.right&&n.right>l.left&&n.top<l.bottom&&n.bottom>l.top,n:{left:n.left,right:n.right,top:n.top,bottom:n.bottom},lead:{left:l.left,right:l.right,top:l.top,bottom:l.bottom}};}`);
    check(`chapter II numeral clears lead 390/${locale}`, !heading.overlap, JSON.stringify(heading));
    await screenshot('chapter-programa-ii-mobile', 390, 844, locale, 'normal', 'David4: numeral II clears existing lead on mobile', false, true);
  }

  await setContext(1440, 900, 'normal');
  for (const locale of ['es', 'en']) {
    await navigate(`${baseUrl}?lang=${locale}`);
    const tallies = await evaluate(`() => [...document.querySelectorAll('.shift-count')].map(el=>{const r=el.getBoundingClientRect(),col=el.closest('.shift-col'),rect=s=>{const b=col.querySelector(s).getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height};};return {text:el.textContent,top:r.top,bottom:r.bottom,height:r.height,col:col.getBoundingClientRect().height,sub:rect('.shift-col-sub'),rows:rect('.shift-rows'),tally:rect('.shift-tally')};})`);
    check(`tally baselines align ${locale}`, tallies.length === 2 && Math.abs(tallies[0].top - tallies[1].top) <= 1, JSON.stringify(tallies));
    const metric = await evaluate(`() => {const e=document.querySelector('.shift-tally'),r=e.getBoundingClientRect();return {top:r.top+scrollY,height:r.height};}`);
    await scrollTo(metric.top + metric.height / 2 - 450);
    await screenshot('shift-metrics', 1440, 900, locale, 'normal', 'David4: desktop 4 of 5 and 2 of 5 count baselines', false, true);
    const heading = await evaluate(`() => {const h=document.querySelector('#programa .chapter-head'),n=h.querySelector('.chapter-n').getBoundingClientRect(),l=h.querySelector('.chapter-lead').getBoundingClientRect();return {overlap:n.left<l.right&&n.right>l.left&&n.top<l.bottom&&n.bottom>l.top,n:{left:n.left,right:n.right,top:n.top,bottom:n.bottom},lead:{left:l.left,right:l.right,top:l.top,bottom:l.bottom}};}`);
    check(`chapter II numeral clears lead 1440/${locale}`, !heading.overlap, JSON.stringify(heading));

    const chapters = await evaluate(`() => [...document.querySelectorAll('.chapter-title')].map(el=>({id:el.id,text:el.innerText,top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height}))`);
    for (const chapter of chapters) {
      const targetY = await evaluate(`() => {const el=document.getElementById(${JSON.stringify(chapter.id)});return el.getBoundingClientRect().top+scrollY+el.getBoundingClientRect().height/2-innerHeight/2;}`);
      await scrollTo(targetY);
      const reveal = await evaluate(`() => {const h=document.getElementById(${JSON.stringify(chapter.id)}),mask=h.querySelector('.mask'),span=mask.firstElementChild,r=span.getBoundingClientRect(),m=mask.getBoundingClientRect(),transform=getComputedStyle(span).transform;return {text:h.innerText,transform,top:r.top,bottom:r.bottom,maskTop:m.top,maskBottom:m.bottom,center:innerHeight/2};}`);
      const transformSettled = reveal.transform === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(reveal.transform);
      check(`chapter title complete at viewport center ${chapter.id}/${locale}`, transformSettled && reveal.top >= reveal.maskTop - 1 && reveal.bottom <= reveal.maskBottom + 1, JSON.stringify(reveal));
      await screenshot(`chapter-${chapter.id}-center`, 1440, 900, locale, 'normal', 'David1/5: full chapter title and descenders inside mask at viewport center', false, true);
    }

    const mapTop = await evaluate(`() => {const e=document.querySelector('#norte');return e.getBoundingClientRect().top+scrollY;}`);
    const mapHeight = await evaluate(`() => document.querySelector('#norte').offsetHeight`);
    await scrollTo(mapTop + mapHeight + 2);
    const mapGeometry = await evaluate(`() => {
      const svg=document.querySelector('#norte .map-svg'), matrix=svg.getScreenCTM();
      const nodes=[...svg.querySelectorAll('.map-node')].map(g=>{const c=g.querySelector('.map-dot'),p=new DOMPoint(c.cx.baseVal.value,c.cy.baseVal.value).matrixTransform(matrix);return {id:g.dataset.node,x:p.x,y:p.y};});
      const edges=[...svg.querySelectorAll('.map-edge')].map(line=>{
        const a=new DOMPoint(line.x1.baseVal.value,line.y1.baseVal.value).matrixTransform(matrix),b=new DOMPoint(line.x2.baseVal.value,line.y2.baseVal.value).matrixTransform(matrix);
        const start=Math.min(...nodes.map(n=>Math.hypot(n.x-a.x,n.y-a.y))),target=nodes.find(n=>n.id===line.dataset.node),end=target?Math.hypot(target.x-b.x,target.y-b.y):Infinity;
        return {to:line.dataset.node,start,end,dash:parseFloat(getComputedStyle(line).strokeDashoffset)};
      });
      const hz=document.querySelector('#norte .hz').getBoundingClientRect(),body=document.querySelector('#norte .north-body'),br=body.getBoundingClientRect(),map=document.querySelector('#norte .map');
      return {position:getComputedStyle(map).position,minHeight:getComputedStyle(body).minHeight,bodyHeight:br.height,hzHeight:hz.height,mapHeight:map.getBoundingClientRect().height,edges};
    }`);
    const endpointsPass = mapGeometry.edges.length > 0 && mapGeometry.edges.every(edge => edge.start < 1.5 && edge.end < 1.5);
    check(`map edge endpoints meet rendered cities ${locale}`, endpointsPass, JSON.stringify(mapGeometry.edges));
    check(`map edges finish drawing ${locale}`, mapGeometry.edges.every(edge => edge.dash <= 0.1), JSON.stringify(mapGeometry.edges.map(edge => ({to:edge.to,dash:edge.dash}))));
    check(`map has no sticky viewport spacer ${locale}`, mapGeometry.position !== 'sticky' && parseFloat(mapGeometry.minHeight) < 100, JSON.stringify({position:mapGeometry.position,minHeight:mapGeometry.minHeight,bodyHeight:mapGeometry.bodyHeight,hzHeight:mapGeometry.hzHeight,mapHeight:mapGeometry.mapHeight}));

    await setContext(1440, 900, 'normal');
    for (const width of [390, 860, 1440]) {
      const height = width === 1440 ? 900 : 844;
      for (const motion of ['normal', 'reduce']) {
    await setContext(width, height, motion);
    await navigate(`${baseUrl}?lang=${locale}`);
    const talk = await evaluate(`() => {const all=[...document.querySelectorAll('img[src*="ignite-poster"]')],img=all.find(e=>e.classList.contains('talk-poster')),r=img?.getBoundingClientRect();return {count:all.length,inChapter:!!img&&!!document.querySelector('#charla').contains(img),alt:img?.alt,width:r?.width,height:r?.height,ratio:r?.width/r?.height,natural:img?.naturalWidth};}`);
    check(`Ignite poster appears once in chapter V ${width}/${locale}/${motion}`, talk.count === 1 && talk.inChapter && !!talk.alt, JSON.stringify(talk));
    const scrollTalk = await evaluate(`() => {const img=document.querySelector('#charla .talk-poster');img.scrollIntoView({block:'center',behavior:'instant'});const r=img.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,ratio:r.width/r.height,natural:img.naturalWidth};}`);
    check(`Ignite poster fits viewport ${width}/${locale}/${motion}`, scrollTalk.left >= 0 && scrollTalk.right <= width && scrollTalk.top >= 54 && scrollTalk.bottom <= height && Math.abs(scrollTalk.ratio - 16/9) < 0.02 && scrollTalk.natural > 0, JSON.stringify(scrollTalk));
    await delay(500);
    await screenshot('talk-poster', width, height, locale, motion, 'David6/9: one existing poster in chapter V, responsive and fully visible', false, true);
      }
    }
  }

  await setContext(390, 844, 'normal');
  await navigate(`${baseUrl}?lang=en`);
  await evaluate(`() => { window.__transitions=[]; const native=document.startViewTransition?.bind(document); if(native) document.startViewTransition=function(update){const named=()=>[...document.querySelectorAll('*')].filter(el=>el.style.getPropertyValue('view-transition-name')==='door-title').map(el=>el.getAttribute('data-door-title')||el.getAttribute('data-dialog-title')||el.tagName);const before=named(),after=[];const t=native(()=>{update();after.push(...named());});const record={before,after,ready:'pending',finished:'pending'};t.ready.then(()=>record.ready='resolved',()=>record.ready='rejected');t.finished.then(()=>record.finished='resolved',()=>record.finished='rejected');window.__transitions.push(record);return t;};}`);
  const point = await evaluate(`() => {const e=document.querySelector('.door-row');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await delay(700);
  const pointer = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,records:window.__transitions,active:document.activeElement?.tagName})`);
  check('pointer door transition ready and uniquely named', pointer.open && !!pointer.records?.length && pointer.records[0].ready === 'resolved' && pointer.records[0].before.length === 1 && pointer.records[0].after.length === 1, JSON.stringify(pointer));
  check('pointer transition cleans names after success', pointer.records?.[0]?.finished === 'resolved' && await evaluate(`() => [...document.querySelectorAll('*')].filter(el=>getComputedStyle(el).viewTransitionName==='door-title').length`) === 0, JSON.stringify(pointer.records));
  await press('Escape');
  const escaped = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,focus:document.activeElement?.classList.contains('door-row')})`);
  check('Escape closes dialog and returns focus', !escaped.open && escaped.focus, JSON.stringify(escaped));

  for (const key of ['Enter', ' ']) {
    await evaluate(`() => {const row=document.querySelector('.door-row');row.focus();}`);
    await press(key);
    await delay(150);
    const keyboard = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,transitions:window.__transitions.length})`);
    check(`keyboard ${key === ' ' ? 'Space' : key} opens without view transition`, keyboard.open && keyboard.transitions === 1, JSON.stringify(keyboard));
    await press('Escape');
    const focus = await evaluate(`() => document.activeElement?.classList.contains('door-row')`);
    check(`keyboard ${key === ' ' ? 'Space' : key} Escape restores focus`, focus, String(focus));
  }

  for (const [label, motion, omitApi] of [['reduced', 'reduce', false], ['missing-api', 'normal', true]]) {
    await setContext(390, 844, motion);
    await navigate(`${baseUrl}?lang=en`);
    await evaluate(`() => {window.__vtCount=0;const native=document.startViewTransition?.bind(document);if(native)document.startViewTransition=function(...args){window.__vtCount++;return native(...args);};${omitApi ? 'document.startViewTransition=undefined;' : ''}}`);
    const target = await evaluate(`() => {const e=document.querySelector('.door-row');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    const fallback = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,calls:window.__vtCount,api:typeof document.startViewTransition})`);
    check(`${label} pointer opens without transition`, fallback.open && fallback.calls === 0, JSON.stringify(fallback));
    await press('Escape');
  }

  await setContext(390, 844, 'normal');
  await navigate(`${baseUrl}?lang=en`);
  await evaluate(`() => {document.startViewTransition=update=>{update();return {ready:Promise.reject(Error('simulated ready failure')),finished:Promise.reject(Error('simulated transition failure'))};};}`);
  const failedTransitionPoint = await evaluate(`() => {const e=document.querySelector('.door-row');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: failedTransitionPoint.x, y: failedTransitionPoint.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: failedTransitionPoint.x, y: failedTransitionPoint.y, button: 'left', clickCount: 1 });
  await delay(100);
  const failedTransition = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,names:[...document.querySelectorAll('*')].filter(el=>el.style.getPropertyValue('view-transition-name')==='door-title').length})`);
  check('rejected transition cleans names and leaves dialog usable', failedTransition.open && failedTransition.names === 0, JSON.stringify(failedTransition));
  await press('Escape');

  for (const width of [390, 860, 1440]) {
    const height = width === 1440 ? 900 : 844;
    await setContext(width, height, 'normal', true);
    await navigate(`${baseUrl}?lang=es`);
    const saveData = await evaluate(`() => ({motionOk:document.documentElement.classList.contains('motion-ok'),stage:getComputedStyle(document.querySelector('.hero-stage')).position,saveData:navigator.connection?.saveData})`);
    check(`saveData does not pin or load motion ${width}`, saveData.saveData === true && !saveData.motionOk && saveData.stage !== 'sticky', JSON.stringify(saveData));
    if (width === 390) {
      await evaluate(`() => {window.__vtCount=0;const native=document.startViewTransition?.bind(document);if(native)document.startViewTransition=function(...args){window.__vtCount++;return native(...args);};}`);
      const target = await evaluate(`() => {const e=document.querySelector('.door-row');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}`);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
      const noTransition = await evaluate(`() => ({open:document.querySelector('.door-dialog')?.open,calls:window.__vtCount,saveData:navigator.connection?.saveData})`);
      check('saveData pointer opens without transition', noTransition.open && noTransition.calls === 0 && noTransition.saveData === true, JSON.stringify(noTransition));
      await press('Escape');
    }
    if (width === 1440) {
      let focus;
      for (let i = 0; i < 20; i += 1) {
        await press('Tab');
        focus = await evaluate(`() => {const e=document.activeElement,hero=document.querySelector('.hero');let opacity=1;for(let n=e;n&&n!==document.body;n=n.parentElement)opacity*=Number.parseFloat(getComputedStyle(n).opacity)||0;const r=e.getBoundingClientRect();return {inside:hero.contains(e),opacity,top:r.top,bottom:r.bottom,text:(e.innerText||'').trim().slice(0,30)};}`);
        if (focus.inside) break;
      }
      check('saveData Tab focus remains visible 1440', focus.inside && focus.opacity > 0.95 && focus.top >= 0 && focus.bottom <= height, JSON.stringify(focus));
    }
  }

  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate(`${baseUrl}?lang=es`);
  const noScript = await evaluate(`() => ({chapters:[...document.querySelectorAll('main section.chapter')].map(e=>e.dataset.chapterLabel),poster:document.querySelectorAll('#charla .talk-poster').length})`);
  check('prerender remains complete with JavaScript disabled', noScript.chapters.length === 6 && noScript.poster === 1, JSON.stringify(noScript));
  await send('Emulation.setScriptExecutionDisabled', { value: false });

  const external = requests.filter((url) => new URL(url).origin !== new URL(baseUrl).origin);
  check('page makes no third-party requests during QA', external.length === 0, JSON.stringify(external));
} finally {
  socket.close();
  chrome.kill('SIGTERM');
  await delay(100);
  const manifest = [
    `# S1 ${phase} browser evidence`,
    '',
    'Screenshots use a 1× headless Chrome viewport; hero states are start, mid, pin end, and released. Reduced-motion and no-pin states are equivalent scroll positions, not pinned.',
    '',
    '| File | Viewport | Locale | Motion | Scroll Y | Pin | Problem / result |',
    '| --- | ---: | --- | --- | ---: | --- | --- |',
    ...shots.map((shot) => `| ${shot.file} | ${shot.width}×${shot.height} | ${shot.locale} | ${shot.motion} | ${shot.scrollY} | ${shot.pin ? 'yes' : 'no; equivalent' } | ${shot.problem} |`),
    '',
    '## Browser checks',
    '',
    ...checks.map(({ name, pass, detail }) => `- ${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`),
    '',
    `External requests observed: ${JSON.stringify(requests.filter((url) => { try { return new URL(url).origin !== new URL(baseUrl).origin; } catch { return true; } }))}`
  ].join('\n');
  writeFileSync(join(artifactDir, 'manifest.md'), `${manifest}\n`);
}

const failures = checks.filter(({ pass }) => !pass);
console.log(`\n${checks.length - failures.length}/${checks.length} checks passed; ${shots.length} screenshots in ${artifactDir}`);
if (failures.length) process.exitCode = 1;
