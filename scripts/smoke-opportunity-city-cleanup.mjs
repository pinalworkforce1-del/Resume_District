import { chromium } from 'playwright';

function check(cond, msg){ if(!cond) throw new Error(msg); console.log('PASS:', msg); }

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

const nameInput = page.locator('.welcome input');
if (await nameInput.count()) {
  await nameInput.fill('Test Participant');
  await nameInput.press('Enter');
}

await page.locator('main.app.level-up-standard').waitFor({state:'visible'});
await page.locator('#level-up-scene-rail').waitFor({state:'visible'});

const imgFit = await page.locator('.stage>img').evaluate(el=>getComputedStyle(el).objectFit);
check(imgFit === 'contain', 'full scene image is contained without crop/stretch');
const videoFit = await page.locator('.caption-video').evaluate(el=>getComputedStyle(el).objectFit);
check(videoFit === 'contain', 'caption/narration video aligns to full scene');
check(await page.locator('#level-up-scene-rail [data-shell="continue"]').isVisible(), 'HUD/right rail Continue is visible');
const hiddenTrigger = await page.locator('.shell-continue-trigger').evaluate(el=>({
  left:getComputedStyle(el).left,
  opacity:getComputedStyle(el).opacity,
  pointer:getComputedStyle(el).pointerEvents,
  width:getComputedStyle(el).width,
  height:getComputedStyle(el).height
}));
check(hiddenTrigger.left.startsWith('-9999') && hiddenTrigger.opacity === '0' && hiddenTrigger.pointer === 'none' && hiddenTrigger.width === '1px' && hiddenTrigger.height === '1px', 'legacy artwork forward trigger is functionally hidden from learner interaction');

const mask = page.locator('.caption-mask');
check(await mask.count() === 1, 'caption backdrop exists');
const maskBg = await mask.evaluate(el=>getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor);
check(maskBg.includes('0.6') || maskBg.includes('0.60') || maskBg.includes('rgba(0, 0, 0, 0.6)'), 'caption backdrop is semi-transparent');

const firstSrc = await page.locator('.caption-video').getAttribute('src');
check((firstSrc||'').endsWith('narration-01.mp4'), 'opening scene uses replacement narration-01');
const firstResponse = await page.request.get(new URL(firstSrc||'', page.url()).href);
check(firstResponse.ok(), 'opening narration asset is served successfully');

const expected = [
  'Welcome to Resume District',
  'No Experience? Look Again',
  'Transferable Skills Unlocked',
  'Build the Right Path',
  'The Keyword Forge',
  'Protect Your Brand',
  'Integrity Unlocked',
  'Your Résumé, Built',
  'Level Up Reflection',
];

for (let i=0;i<expected.length;i++) {
  const title = (await page.locator('.hud span').first().textContent())?.trim();
  check(title === expected[i], `route scene ${i+1}: ${expected[i]}`);
  if (expected[i] === 'Protect Your Brand') {
    const src = await page.locator('.caption-video').getAttribute('src');
    check((src||'').endsWith('narration-09.mp4'), 'Protect Your Brand uses replacement narration-09');
    const response = await page.request.get(new URL(src||'', page.url()).href);
    check(response.ok(), 'replacement narration-09 is served successfully');
  }
  if (expected[i] === 'Level Up Reflection') {
    const src = await page.locator('.caption-video').getAttribute('src');
    check((src||'').endsWith('narration-13.mp4'), 'Reflection/completion scene uses replacement narration-13');
    const response = await page.request.get(new URL(src||'', page.url()).href);
    check(response.ok(), 'replacement narration-13 is served successfully');
  }
  if (i < expected.length-1) {
    await page.locator('#level-up-scene-rail [data-shell="continue"]').click();
    await page.waitForTimeout(100);
  }
}
check(!(await page.locator('#level-up-scene-rail [data-shell="continue"]').isVisible()), 'Continue stops at reflection');

await page.evaluate(() => {
  localStorage.setItem('level-up-resume-district-ux-v3', JSON.stringify({
    name:'Test Participant', scene:12, xp:500,
    completed:['reflection'], answers:{}, completionDate:new Date().toISOString()
  }));
});
await page.reload({waitUntil:'networkidle'});
await page.locator('main.app.level-up-standard').waitFor({state:'visible'});
check(await page.getByText('Resume District Complete', {exact:true}).isVisible(), 'completion state renders');
check(await page.getByRole('link', {name:'Return to Opportunity City'}).isVisible(), 'completion returns to Opportunity City');
check(await page.getByText('Interview Arena is now unlocked.').count() === 0, 'legacy direct Interview unlock copy is absent');

await browser.close();
console.log('\nRendered browser smoke test passed.');
