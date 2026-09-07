import fs from "node:fs";

const path = new URL("../src/ResumeDistrict.tsx", import.meta.url);
let source = fs.readFileSync(path, "utf8");

const MARKER = "// OPPORTUNITY_CITY_CLEANUP_V1";
if (source.includes(MARKER)) {
  console.log("Resume District Opportunity City cleanup already applied.");
  process.exit(0);
}

function replaceOne(label, oldText, newText) {
  const count = source.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  source = source.replace(oldText, newText);
}

replaceOne(
  "marker",
  'import { authRedirectUrl, supabase, supabaseConfigured } from "@/lib/supabase";',
  'import { authRedirectUrl, supabase, supabaseConfigured } from "@/lib/supabase";\n' + MARKER
);

replaceOne(
  "arrival title",
  'const titles=["Enter Resume District","The District Map"',
  'const titles=["Welcome to Resume District","The District Map"'
);

replaceOne(
  "arrival alt",
  '"A learner enters a neon city where Resume District is the first destination."',
  '"A learner arrives in Resume District after beginning the Level Up journey in Discovery."'
);

replaceOne(
  "phases",
  'const phases=[["Experience",0,3],["Skills",4,7],["Build Résumé",8,10],["Interview Ready",11,12],["District Map",13,16]] as const;',
  'const phases=[["Experience",0,3],["Build Résumé",5,7],["Professional Brand",8,10],["Reflection",12,12]] as const;\nconst CORE_SCENES=[0,2,3,5,7,8,9,10,12] as const;\nfunction normalizeScene(scene:number){if(scene===1)return 0;if(scene===4)return 3;if(scene===11)return 10;if(scene>=13)return 12;return scene}'
);

replaceOne(
  "local state migration",
  'useEffect(()=>{try{const x=localStorage.getItem(STORE);if(x)setJ({...EMPTY,...JSON.parse(x)});}catch{}setReady(true)},[]);',
  'useEffect(()=>{try{const x=localStorage.getItem(STORE);if(x){const saved={...EMPTY,...JSON.parse(x)} as Journey;saved.scene=normalizeScene(saved.scene);setJ(saved)}}catch{}setReady(true)},[]);'
);

replaceOne(
  "remote state migration",
  'const remote={...EMPTY,...progress.data.journey_state} as Journey;setJ(local=>',
  'const remote={...EMPTY,...progress.data.journey_state} as Journey;remote.scene=normalizeScene(remote.scene);setJ(local=>'
);

replaceOne(
  "next routing",
  'function next(){if(scene===5)update({scene:7});else if(scene<16)update({scene:scene+1})}',
  'function next(){const route:Record<number,number>={0:2,2:3,3:5,5:7,6:7,7:8,8:9,9:10,10:12};const target=route[scene];if(target!==undefined)update({scene:target})}'
);

replaceOne(
  "previous routing",
  'function previous(){if(scene===7)update({scene:5});else if(scene===6)update({scene:5});else if(scene>0)update({scene:scene-1})}',
  'function previous(){const route:Record<number,number>={2:0,3:2,5:3,6:5,7:5,8:7,9:8,10:9,12:10};const target=route[scene];if(target!==undefined)update({scene:target})}'
);

replaceOne(
  "fallback name screen",
  'if(!j.name)return <main className="welcome"><section><div className="brand"><b>LU</b><span>LEVEL UP<small>RESUME DISTRICT</small></span></div><p className="kicker">INTERVIEW UNLOCKED • EPISODE 1</p><h1>Show what you can do.</h1><p>Turn work, school, caregiving, service, and life experience into résumé-ready evidence.</p><label>What should we call you?<input autoFocus onKeyDown={e=>{const n=(e.target as HTMLInputElement).value.trim();if(e.key==="Enter"&&n)void beginWithName(n)}}/></label><p className="hint">Enter your name and press Enter to begin.</p></section></main>;',
  'if(!j.name)return <main className="welcome"><section><div className="brand"><b>LU</b><span>LEVEL UP<small>RESUME DISTRICT</small></span></div><p className="kicker">RESUME DISTRICT • ARRIVAL</p><h1>Turn your experience into your story.</h1><p>Your Level Up profile normally supplies your name automatically. If it is missing, add it here so your progress and learner outputs can be personalized.</p><label>Name for your Level Up profile<input autoFocus onKeyDown={e=>{const n=(e.target as HTMLInputElement).value.trim();if(e.key==="Enter"&&n)void beginWithName(n)}}/></label><p className="hint">Enter your name and press Enter to continue.</p></section></main>;'
);

replaceOne(
  "visible scene count",
  'const visibleSceneCount=12;\n  const visibleScene=scene<=5?scene+1:scene===6?6:scene<=12?scene:12;',
  'const visibleSceneCount=CORE_SCENES.length;\n  const visibleScene=bonus?4:Math.max(1,CORE_SCENES.indexOf(scene as (typeof CORE_SCENES)[number])+1);'
);

replaceOne(
  "back button",
  'onClick={preview?()=>update({scene:1}):previous} disabled={scene===0} aria-label={preview?"Back to district map":"Previous scene"}',
  'onClick={previous} disabled={scene===0} aria-label="Previous scene"'
);

replaceOne(
  "brand plus email scene",
  '{scene===8&&interactionReady&&<button className={`image-zone digital-zone visible-cue ${j.completed.includes("brand")?"done":""}`} onClick={()=>setModal("brand")} aria-label="Explore positive digital presence"><span>Explore positive digital presence</span><b>Explore digital presence</b></button>}',
  '{scene===8&&interactionReady&&<><button className={`image-zone digital-zone visible-cue ${j.completed.includes("brand")?"done":""}`} onClick={()=>setModal("brand")} aria-label="Explore positive digital presence"><span>Explore positive digital presence</span><b>Explore digital presence</b></button><button className={`activity-trigger ${j.completed.includes("email")?"done":""}`} onClick={()=>setModal("email")}>✦ Check your professional email</button></>}'
);

replaceOne(
  "completion actions",
  '{scene===12&&resumeComplete&&<div className="completion-actions"><h2>Resume District Complete</h2><p>Interview Arena is now unlocked.</p><div><button onClick={()=>setModal("review")}>View Resume District Review</button><button onClick={()=>update({scene:1})}>Return to District Map</button><a className="primary-action" href={PORTAL}>Enter Interview Arena</a></div></div>}\n      {scene===12&&resumeComplete&&<a className="interview-icon-link" href={PORTAL} aria-label="Continue to Interview Arena from the unlocked arena icon"><span>Enter Interview Arena</span></a>}',
  '{scene===12&&resumeComplete&&<div className="completion-actions"><h2>Resume District Complete</h2><p>You’ve turned your experiences, skills, and strengths into a stronger employment story. Your résumé work is saved, and your journey is ready to continue.</p><div><button onClick={()=>setModal("review")}>View Resume District Review</button><a className="primary-action" href={PORTAL}>Return to Opportunity City</a></div></div>}'
);

replaceOne(
  "next hotspot stop at reflection",
  '{scene<13&&<button className="next-world"',
  '{scene<12&&<button className="next-world shell-continue-trigger"'
);

replaceOne(
  "phase nav columns",
  '<nav className="phase-nav" aria-label="Resume District levels">',
  '<nav className="phase-nav" style={{gridTemplateColumns:"repeat(4,1fr)"}} aria-label="Resume District levels">'
);

fs.writeFileSync(path, source);
console.log("Applied Resume District Opportunity City cleanup.");
console.log("Core route: 0 → 2 → 3 → 5 → 7 → 8 → 9 → 10 → 12");
console.log("Clean scene artwork is used directly; no legacy footer fill/mask is applied.");
console.log("Skipped legacy scenes: 1 (old map), 4 (old interview access), 11 (old interview gate), 13–16 (old previews).");
