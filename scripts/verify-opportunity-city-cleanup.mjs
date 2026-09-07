import fs from 'node:fs';

function assert(cond, msg){ if(!cond){ throw new Error(msg); } console.log('PASS:', msg); }

const src = fs.readFileSync('src/ResumeDistrict.tsx','utf8');
const css = fs.readFileSync('src/level-up-standard.css','utf8');
const shell = fs.readFileSync('src/level-up-shell.ts','utf8');
const main = fs.readFileSync('src/main.tsx','utf8');

assert(src.includes('// OPPORTUNITY_CITY_CLEANUP_V1'), 'cleanup transform applied');
assert(src.includes('const CORE_SCENES=[0,2,3,5,7,8,9,10,12] as const;'), 'core Resume route is reduced to retained scenes');
assert(src.includes('const route:Record<number,number>={0:2,2:3,3:5,5:7,6:7,7:8,8:9,9:10,10:12};'), 'forward routing skips legacy map/gate/preview scenes');
assert(!src.includes('Interview Arena is now unlocked.'), 'legacy direct Interview unlock copy removed');
assert(!src.includes('Return to District Map'), 'legacy district-map return removed');
assert(src.includes('Return to Opportunity City'), 'completion returns to Opportunity City');
assert(src.includes('Check your professional email'), 'professional email checkpoint moved into retained flow');
assert(src.includes('className="next-world shell-continue-trigger"'), 'learner-facing in-image next hotspot replaced by hidden shell trigger');
assert(src.includes('scene<12&&<button className="next-world shell-continue-trigger"'), 'forward shell trigger stops at reflection/completion');
assert(main.includes('import "./level-up-standard.css";') && main.includes('import "./level-up-shell";'), 'Level Up UX shell is loaded');
assert(shell.includes('data-shell="continue"') && shell.includes('currentContinue()?.click()'), 'right-rail Continue owns forward movement');
assert(src.includes('className="stage stage-art-fill"') && src.includes('backgroundImage:`url(${ASSETS}/slide-${num}.webp)`'), 'stage uses scene art as a full-display continuation background');
assert(css.includes('.level-up-standard .stage-art-fill>img{object-fit:contain!important') && css.includes('mask-image:linear-gradient'), 'legacy footer is faded out while preserving hotspot coordinates');
assert(css.includes('background-size:116% auto!important'), 'stage background fills the legacy footer area with artwork');
assert(css.includes('.level-up-standard .caption-video{object-fit:contain!important'), 'caption/narration layer uses matching contain framing');
assert(css.includes('rgba(0,0,0,.60)') && css.includes('height:11%'), 'caption backdrop uses approved semi-transparent lower strip');

const expected = {
  'public/assets/resume/scenes/narration-01.mp4': 1764042,
  'public/assets/resume/scenes/narration-09.mp4': 602588,
  'public/assets/resume/scenes/narration-13.mp4': 501377,
};
for (const [file,size] of Object.entries(expected)) {
  assert(fs.existsSync(file), `${file} exists`);
  assert(fs.statSync(file).size === size, `${file} matches replacement upload size`);
}

console.log('\nResume District Opportunity City cleanup verification passed.');
