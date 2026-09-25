import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authRedirectUrl, supabase, supabaseConfigured } from "@/lib/supabase";

type Source = "Sports"|"Volunteering"|"School Projects"|"Teamwork"|"Caregiving";
type Answers = {
  experienceSource?:Source; experienceSkills?:string[]; experienceNote?:string;
  experienceResponses?:Partial<Record<Source,{skills:string[];note:string}>>;
  experienceFit?:Partial<Record<Source,"use"|"not-me">>;
  skillReflections?:Record<string,string>;
  task?:string; action?:string; skill?:string; result?:string; bullet?:string;
  recruiterStack?:string; recruiterTakeaway?:string;
  keywordTakeaway?:string; digitalTakeaway?:string; integrityTakeaway?:string; emailTakeaway?:string;
  support?:string; lesson?:string; addThisWeek?:string; nextAction?:string;
};
type Journey={name:string;scene:number;xp:number;completed:string[];answers:Answers;completionDate:string;playbackRate:number;reducedMotion:boolean;largeText:boolean};
const STORE_BASE="level-up-resume-district-ux-v4";
const storeFor=(userId:string)=>`${STORE_BASE}:${userId}`;
const MODULE_ID="resume-district";
const profileNameKey=(userId:string)=>`level-up-profile-name-v1:${userId}`;
const EMPTY:Journey={name:"",scene:0,xp:0,completed:[],answers:{},completionDate:"",playbackRate:1,reducedMotion:false,largeText:false};
const ASSETS="assets/resume/scenes";
const PORTAL="https://pinalworkforce1-del.github.io/Level_Up_Portal/";
const RESUME_BUILDER="https://pinalworkforce1-del.github.io/LU_Discovery/resume-builder-prototype.html";
const MY_RESUMES="https://pinalworkforce1-del.github.io/LU_Discovery/my-resumes.html";
const titles=["Enter Resume District","The District Map","No Experience? Look Again","Transferable Skills Unlocked","Interview Access","Build the Right Path","Recruiter Perspective","The Keyword Forge","Protect Your Brand","Integrity Unlocked","Your Résumé, Built","Interview Gate Unlocked","Level Up Reflection","Resume District","Interview Arena","First Day Challenge","Money Moves"];
const alts=[
  "A learner enters a neon city where Resume District is the first destination.",
  "A neon Level Up city map shows four career-readiness districts around Opportunity Plaza and a Career Skill Tree.",
  "A learner recognizes sports, volunteering, school projects, teamwork, and caregiving as sources of transferable skills.",
  "A glowing transferable-skills card is surrounded by teamwork, leadership, communication, reliability, and problem-solving icons.",
  "A path opens from Resume District toward Interview Arena.",
  "A résumé dungeon contrasts an ATS-friendly path with common résumé mistakes.",
  "A recruiter sorts résumés into rejected, maybe, strong candidates, and interview-invite stacks.",
  "A learner uses the Keyword Forge to align truthful experience with a job posting.",
  "A learner reviews a professional digital presence.",
  "A learner chooses the honest path toward lasting success.",
  "A guided résumé builder organizes summary, skills, experience, and education.",
  "The Interview Gate opens after résumé-readiness achievements.",
  "The Level Up map displays the Resume District reflection checkpoint.",
  "Resume District completion scene.",
  "Interview Arena preview.",
  "First Day Challenge preview.",
  "Money Moves preview."
];
const sourceLessons:Record<Source,{skills:string[];body:string}> = {
  Sports:{skills:["Teamwork","Discipline","Resilience"],body:"Practice, support teammates, follow a plan, and adapt under pressure."},
  Volunteering:{skills:["Service","Initiative","Reliability"],body:"Show up for a cause, help people, solve needs, and work with a team."},
  "School Projects":{skills:["Organization","Research","Communication"],body:"Meet deadlines, divide work, present ideas, and improve with feedback."},
  Teamwork:{skills:["Collaboration","Communication","Problem solving"],body:"Coordinate with others, listen, contribute, and help the group finish."},
  Caregiving:{skills:["Planning","Patience","Responsibility"],body:"Manage real needs, schedules, safety, and communication people depend on."}
};
const sourceOrder:Source[]=["Sports","Volunteering","School Projects","Teamwork","Caregiving"];
const emailCards=[
  ["alex.morgan@gmail.com",true,"Recognizable name, simple format, and no distracting language."],
  ["cooldude420@lol.com",false,"A nickname and unrelated numbers may distract from the professional message."],
  ["tbrady.jobs@outlook.com",true,"A clear name-based address with a job-search purpose."],
  ["partyroyal99@yahoo.com",false,"The identity sounds social rather than professional."],
  ["j.santos2026@gmail.com",true,"A name-based address with a neutral number is generally appropriate."]
] as const;
const tipNames=["Too Long","No Focus","Unprofessional","Confusing Templates","ATS Scanner","ATS Approved","Right Path","Résumé Quest Tip"];
const skillLessons=[
  ["teamwork","Teamwork","Work toward a shared goal, communicate, and support the group.","Employers value people who contribute reliably and make the whole team stronger."],
  ["leadership","Leadership","Take initiative, guide others, and help a group move forward.","Employers value sound judgment, ownership, and positive influence."],
  ["communication","Communication","Listen carefully and share clear information in the right way.","Employers value fewer misunderstandings and stronger customer and team relationships."],
  ["reliability","Reliability","Follow through, arrive prepared, and do what you said you would do.","Employers need teammates they can count on without constant reminders."],
  ["problem","Problem Solving","Notice what is wrong, consider options, and take a practical next step.","Employers value people who can keep work moving when challenges appear."]
] as const;
const mapZones=[
  {id:"resume",label:"Resume District",scene:13,x:28,y:10,w:20,h:31},
  {id:"interview",label:"Interview Arena",scene:14,x:59,y:9,w:20,h:31},
  {id:"first",label:"First Day Challenge",scene:15,x:76,y:26,w:19,h:30},
  {id:"money",label:"Money Moves",scene:16,x:15,y:43,w:22,h:30},
] as const;
const phases=[["Experience",0,3],["Skills",4,7],["Build Résumé",8,10],["Interview Ready",11,12],["District Map",13,16]] as const;

export default function ResumeDistrict(){
  const [j,setJ]=useState<Journey>(EMPTY);
  const [ready,setReady]=useState(false);
  const [session,setSession]=useState<Session|null>(null);
  const [profileName,setProfileName]=useState("");
  const [authReady,setAuthReady]=useState(false);
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [sync,setSync]=useState<"local"|"saving"|"saved"|"error">("local");
  const [modal,setModal]=useState<string|null>(null);
  const [playing,setPlaying]=useState(false);
  const [started,setStarted]=useState(false);
  const [interactionReady,setInteractionReady]=useState(false);
  const [audioOn,setAudioOn]=useState(true);
  const [toast,setToast]=useState("");
  const video=useRef<HTMLVideoElement>(null);
  const scene=j.scene;
  useEffect(()=>{if(!authReady||!session)return;const cachedName=(localStorage.getItem(profileNameKey(session.user.id))||"").trim();try{const x=localStorage.getItem(storeFor(session.user.id));if(x){const parsed={...EMPTY,...JSON.parse(x)} as Journey;setJ({...parsed,name:cachedName||parsed.name||""});}else setJ(cachedName?{...EMPTY,name:cachedName}:EMPTY);}catch{setJ(cachedName?{...EMPTY,name:cachedName}:EMPTY)}setProfileName(cachedName);setReady(true)},[authReady,session?.user.id]);
  useEffect(()=>{if(ready&&session){localStorage.setItem(storeFor(session.user.id),JSON.stringify(j));(window as any).LevelUpOfflineProgress?.save(MODULE_ID,j,{xp:j.xp,isComplete:j.completed.includes("reflection"),completedAt:j.completionDate||null})}},[j,ready,session?.user.id]);
  useEffect(()=>{if(!supabase){setAuthReady(true);return}let active=true;const timer=window.setTimeout(()=>{if(active)setAuthReady(true)},2500);supabase.auth.getSession().then(({data})=>{if(!active)return;window.clearTimeout(timer);setSession(data.session);setAuthReady(true)}).catch(()=>{if(active)setAuthReady(true)});const {data}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthReady(true)});return()=>{active=false;window.clearTimeout(timer);data.subscription.unsubscribe()}},[]);
  useEffect(()=>{if(!session||!supabase)return;Promise.all([supabase.from("module_progress").select("journey_state").eq("user_id",session.user.id).eq("module_id",MODULE_ID).maybeSingle(),supabase.from("profiles").select("display_name").eq("user_id",session.user.id).maybeSingle()]).then(([progress,profile])=>{if(progress.error||profile.error){setSync("error");return}const canonical=(profile.data?.display_name||"").trim();if(canonical)localStorage.setItem(profileNameKey(session.user.id),canonical);setProfileName(canonical||profileName);if(progress.data?.journey_state){const remote={...EMPTY,...progress.data.journey_state} as Journey;setJ(local=>{const chosen=remote.completed.length>local.completed.length||remote.xp>local.xp?remote:local;return canonical?{...chosen,name:canonical}:chosen})}else if(canonical)setJ(local=>({...local,name:canonical}));setSync("saved")})},[session?.user.id]);
  useEffect(()=>{if(!session||!supabase||!ready)return;setSync("saving");const timer=setTimeout(async()=>{const done=j.completed.includes("reflection");const {error}=await supabase!.from("module_progress").upsert({user_id:session.user.id,module_id:MODULE_ID,journey_state:j,xp:j.xp,is_complete:done,completed_at:j.completionDate||null},{onConflict:"user_id,module_id"});if(!error)(window as any).LevelUpOfflineProgress?.markSynced(MODULE_ID);setSync(error?"error":"saved")},800);return()=>clearTimeout(timer)},[j,session?.user.id,ready]);
  useEffect(()=>{video.current?.pause();setPlaying(false);setStarted(false);setInteractionReady(scene>=13);video.current?.load();},[scene]);
  useEffect(()=>{if(video.current)video.current.playbackRate=j.playbackRate||1},[j.playbackRate,scene]);
  useEffect(()=>{if(!video.current||scene>=13)return;const t=setTimeout(()=>video.current?.play().catch(()=>{}),220);return()=>clearTimeout(t)},[scene]);
  const required=useMemo(()=>["experience-source","translator","anatomy","keywords","brand","integrity","builder","reflection"],[]);
  const resumeComplete=j.completed.includes("reflection");
  function update(p:Partial<Journey>){setJ(v=>({...v,...p}))}
  function answer(p:Partial<Answers>){setJ(v=>({...v,answers:{...v.answers,...p}}))}
  function complete(id:string,xp:number){setJ(v=>({...v,xp:v.completed.includes(id)?v.xp:v.xp+xp,completed:v.completed.includes(id)?v.completed:[...v.completed,id],completionDate:id==="reflection"?(v.completionDate||new Date().toISOString()):v.completionDate}));setToast(`+${xp} XP`);setTimeout(()=>setToast(""),1800)}
  function next(){if(scene===5)update({scene:7});else if(scene<16)update({scene:scene+1})}
  function previous(){if(scene===7)update({scene:5});else if(scene===6)update({scene:5});else if(scene>0)update({scene:scene-1})}
  function toggle(){if(!video.current||scene>=13)return;playing?video.current.pause():video.current.play().catch(()=>{})}
  function skip(){if(!video.current)return;video.current.pause();try{video.current.currentTime=video.current.duration||0}catch{}setPlaying(false);setStarted(false);setInteractionReady(true)}
  function restart(){if(confirm("Restart Resume District and clear this test progress?"))setJ({...EMPTY,name:j.name})}
  async function magic(){if(!supabase||!email.trim())return;const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:authRedirectUrl()}});if(!error)setSent(true)}
  async function beginWithName(name:string){update({name});if(session&&supabase&&!profileName){const {error}=await supabase.from("profiles").upsert({user_id:session.user.id,display_name:name},{onConflict:"user_id",ignoreDuplicates:true});if(!error)setProfileName(name)}}
  if(!ready||!authReady)return <main className="loading">Loading Resume District…</main>;
  if(supabaseConfigured&&!session)return <main className="welcome auth"><section><div className="brand"><b>LU</b><span>LEVEL UP<small>RESUME DISTRICT</small></span></div><p className="kicker">YOUR NEXT DISTRICT IS OPEN</p><h1>Sign in to continue</h1><p>Your Level Up account saves your progress across devices.</p>{sent?<div className="feedback"><b>Check your email</b><p>Use the secure link to return to Resume District.</p></div>:<><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&magic()}/></label><button className="primary" onClick={magic}>Email my sign-in link</button></>}</section></main>;
  if(!j.name)return <main className="welcome"><section><div className="brand"><b>LU</b><span>LEVEL UP<small>RESUME DISTRICT</small></span></div><p className="kicker">INTERVIEW UNLOCKED • EPISODE 1</p><h1>Show what you can do.</h1><p>Turn work, school, caregiving, service, and life experience into résumé-ready evidence.</p><label>What should we call you?<input autoFocus onKeyDown={e=>{const n=(e.target as HTMLInputElement).value.trim();if(e.key==="Enter"&&n)void beginWithName(n)}}/></label><p className="hint">Enter your name and press Enter to begin.</p></section></main>;
  const num=String(scene+1).padStart(2,"0");
  const preview=scene>=13;
  const bonus=scene===6;
  const visibleSceneCount=12;
  const visibleScene=scene<=5?scene+1:scene===6?6:scene<=12?scene:12;
  const sourceDone=sourceOrder.filter(s=>j.completed.includes("source-"+slug(s))).length;
  const skillDone=skillLessons.filter(s=>j.completed.includes("skill-"+s[0])).length;
  const tipDone=tipNames.filter(t=>j.completed.includes("tip-"+slug(t))).length;
  const bonusUnlocked=j.completed.includes("anatomy")&&tipDone>=3;
  return <main className={`app ${j.largeText?"large-text":""} ${j.reducedMotion?"reduce-motion":""}`}>
    <header className="topbar">
      <div className="brand"><b>LU</b><span>LEVEL UP<small>RESUME DISTRICT</small></span></div>
      <div className="hud"><span>{titles[scene]}</span><div><i style={{width:`${Math.min((visibleScene/visibleSceneCount)*100,100)}%`}}/></div><small>{preview?"DISTRICT PREVIEW":bonus?"BONUS SCENE":`SCENE ${visibleScene} OF ${visibleSceneCount}`}</small><strong>{j.xp} XP</strong></div>
      <div className="controls">
        <button className="utility-button city-return" onClick={()=>window.location.assign(PORTAL+"?from=resume-district")} aria-label="Back to Opportunity City" title="Back to Opportunity City"><span aria-hidden="true">←</span><b>Opportunity City</b></button>
        <span className={`sync sync-labeled ${sync}`} title={sync==="saved"?"Progress saved to Level Up":sync==="saving"?"Saving progress":sync==="error"?"Cloud save paused — progress remains on this device":"Progress saved on this device"}><span aria-hidden="true">{sync==="error"?"☁̸":"☁"}</span><b>{sync==="saving"?"Saving":sync==="error"?"Device saved":sync==="saved"?"Saved":"Local"}</b></span>
        <button className="scene-source-control" onClick={preview?()=>update({scene:1}):previous} disabled={scene===0} aria-label={preview?"Back to district map":"Previous scene"}>←</button>
        <button className="resume-library" onClick={()=>window.open(MY_RESUMES,"_blank","noopener")} aria-label="Open My Résumés">My Résumés</button>
        <button className="utility-button help-button" onClick={()=>setModal("help")} aria-label="Open Resume District help" title="Help"><span aria-hidden="true">?</span><b>Help</b></button>
        <button className="scene-source-control" onClick={()=>setModal("access")} aria-label="Accessibility and scene description">◉</button>
        <button className="scene-source-control" onClick={toggle} disabled={scene>=13} aria-label={playing?"Pause narration":"Play narration"}>{playing?"Ⅱ":"▶"}</button>
        <button className="scene-source-control" onClick={()=>setAudioOn(v=>!v)} disabled={scene>=13} aria-label={audioOn?"Mute narration":"Turn on narration"}>{audioOn?"🔊":"🔇"}</button>
        <button className="utility-button clear-button" onClick={restart} aria-label="Clear Resume District progress" title="Clear Resume District progress"><span aria-hidden="true">↻</span><b>Clear</b></button>
      </div>
    </header>
    <section className="stage" aria-label={titles[scene]}>
      <img src={`${ASSETS}/slide-${num}.webp`} alt={alts[scene]}/>
      {scene<13&&<><div className={`caption-mask ${started?"visible":""}`} aria-hidden="true"/><video ref={video} className="caption-video" src={`${ASSETS}/narration-${num}.mp4`} playsInline muted={!audioOn} preload="auto" onLoadedMetadata={e=>{e.currentTarget.playbackRate=j.playbackRate||1}} onPlay={e=>{e.currentTarget.playbackRate=j.playbackRate||1;setPlaying(true);setStarted(true)}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);setStarted(false);setInteractionReady(true)}}/></>}
      {scene<13&&started&&<button className="skip" onClick={skip}>Skip narration</button>}
      {scene<13&&!started&&!playing&&<button className="play-fallback" onClick={toggle}>▶ Play narration & captions</button>}
      {scene===1&&<MapHotspots completed={resumeComplete} go={s=>update({scene:s})} info={()=>setModal("skill-tree")}/>}
      {scene===2&&interactionReady&&<><div className="explore-hint">Select each glowing experience • {sourceDone} of 5 explored</div>{sourceOrder.map((s,i)=><button key={s} className={`image-zone source-zone source-${i} ${j.completed.includes("source-"+slug(s))?"done":""}`} onClick={()=>setModal(`source:${s}`)} aria-label={`Explore ${s} experience`}><span>{s}</span></button>)}</>}
      {scene===3&&interactionReady&&<><div className="explore-hint">Explore each skill • {skillDone} of 5 explored</div>{skillLessons.map((s,i)=><button key={s[0]} className={`skill-zone skill-${i} ${j.completed.includes("skill-"+s[0])?"done":""}`} onClick={()=>setModal("skill:"+s[0])} aria-label={`Explore ${s[1]}`}><span>{s[1]}</span></button>)}<button className="activity-trigger translator" onClick={()=>setModal("translator")}>✦ Build a résumé bullet</button></>}
      {scene===4&&interactionReady&&<button className={`image-zone email-zone ${j.completed.includes("email")?"done":""}`} onClick={()=>setModal("email")} aria-label="Open professional email checkpoint"><span>Professional email checkpoint</span><b>Check your professional email</b></button>}
      {scene===5&&interactionReady&&<>
        {bonusUnlocked&&<button className={`image-zone xp-scroll unlocked ${j.completed.includes("recruiter-bonus")?"done":""}`} onClick={()=>update({scene:6})} aria-label="Open recruiter perspective bonus scene"><span>Bonus recruiter perspective</span><b>Bonus XP</b></button>}
        {j.completed.includes("anatomy")&&tipNames.map((x,i)=><button key={x} className={`tip-zone tip-${i} ${j.completed.includes("tip-"+slug(x))?"done":""}`} onClick={()=>{complete("tip-"+slug(x),0);setModal("tip:"+x)}} aria-label={`Explore tip: ${x}`}><span>{x}</span></button>)}
        <div className="explore-hint">{j.completed.includes("anatomy")?`Explore 3 résumé clues to unlock bonus XP • ${tipDone} explored`:"Begin with résumé anatomy"}</div>
        <button className="activity-trigger anatomy" onClick={()=>setModal("anatomy")}>✦ {j.completed.includes("anatomy")?"Review":"Explore"} résumé anatomy</button>
      </>}
      {scene===6&&interactionReady&&<button className="activity-trigger recruiter" onClick={()=>setModal("recruiter")}>✦ Sort the recruiter stacks</button>}
      {scene===7&&interactionReady&&<button className={`image-zone keyword-zone visible-cue ${j.completed.includes("keywords")?"done":""}`} onClick={()=>setModal("keywords")} aria-label="Enter the Keyword Forge"><span>Enter Keyword Forge</span><b>Forge your keywords</b></button>}
      {scene===8&&interactionReady&&<button className={`image-zone digital-zone visible-cue ${j.completed.includes("brand")?"done":""}`} onClick={()=>setModal("brand")} aria-label="Explore positive digital presence"><span>Explore positive digital presence</span><b>Explore digital presence</b></button>}
      {scene===9&&interactionReady&&<button className="activity-trigger" onClick={()=>setModal("integrity")}>✦ Test résumé integrity</button>}
      {scene===10&&interactionReady&&<button className="activity-trigger" onClick={()=>setModal("builder")}>✦ Review your résumé plan</button>}
      {scene===12&&interactionReady&&!resumeComplete&&<button className="activity-trigger" onClick={()=>setModal("reflection")}>✦ Complete Resume District reflection</button>}
      {scene===12&&resumeComplete&&<div className="completion-actions"><h2>Reflection Complete ✓</h2><p>Put the evidence to work in Resume Builder. Your Level Up account will keep your working résumé and saved targeted versions.</p><div><a className="primary-action" href={RESUME_BUILDER}>Open Resume Builder →</a><a href={MY_RESUMES}>My Résumés</a><button onClick={()=>setModal("review")}>View Resume District Review</button><button onClick={()=>update({scene:1})}>Return to District Map</button><a href={PORTAL}>Enter Interview Arena</a></div></div>}
      {scene===12&&resumeComplete&&<a className="interview-icon-link" href={PORTAL} aria-label="Interview Arena is available after Resume District"><span>Enter Interview Arena</span></a>}
      {preview&&<button className="preview-back" onClick={()=>update({scene:1})}>← Back to District Map</button>}
      {scene<13&&<button className="next-world" onClick={next} aria-label={scene===5?"Continue to Keyword Forge":"Continue to next scene"}><span>Continue</span></button>}
      {toast&&<div className="toast" role="status">{toast}</div>}
    </section>
    {!preview&&<nav className="phase-nav" aria-label="Resume District levels">{phases.slice(0,4).map(([label,start,end],i)=>{const active=scene>=start&&scene<=end,done=scene>end;return <button key={label} disabled={scene<start} className={active?"active":done?"done":""} onClick={()=>update({scene:start})}><span>{done?"✓":i+1}</span>{label}</button>})}</nav>}
    {modal&&<Modal title={modalTitle(modal)} close={()=>setModal(null)}>{modal==="access"?<AccessibilityPanel j={j} scene={scene} onUpdate={p=>update(p)} close={()=>setModal(null)}/>:renderModal(modal,j,answer,complete,()=>setModal(null),s=>update({scene:s}))}</Modal>}
    <span className="sr-only" aria-live="polite">{required.filter(x=>j.completed.includes(x)).length} of {required.length} required activities complete.</span>
  </main>
}

function MapHotspots({completed,go,info}:{completed:boolean;go:(s:number)=>void;info:()=>void}){
  return <>{mapZones.map(z=><button key={z.id} style={{left:z.x+"%",top:z.y+"%",width:z.w+"%",height:z.h+"%"}} className="map-zone" onClick={()=>go(z.scene)} aria-label={`Open ${z.label}`}><span>{z.label}</span></button>)}<button className="map-zone skill-tree" onClick={info} aria-label="Learn about the Career Skill Tree"><span>{completed?"Explore Career Skill Tree":"Career Skill Tree locked — learn how to unlock"}</span></button></>
}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><div><p className="kicker">RESUME DISTRICT • SKILL LAB</p><h2>{title}</h2></div><button className="close" onClick={close} aria-label="Close">×</button></header>{children}</section></div>}
function Choices({label,items,value,onChange,multi=false}:{label:string;items:string[];value?:string|string[];onChange:(v:any)=>void;multi?:boolean}){const chosen=(x:string)=>Array.isArray(value)?value.includes(x):value===x;return <fieldset><legend>{label}</legend><div className="choices">{items.map(x=><button key={x} className={chosen(x)?"selected":""} onClick={()=>multi?onChange(Array.isArray(value)?(chosen(x)?value.filter(v=>v!==x):[...value,x]):[x]):onChange(x)}>{chosen(x)?"✓ ":""}{x}</button>)}</div></fieldset>}
function Field({label,value,onChange,placeholder=""}:{label:string;value?:string;onChange:(v:string)=>void;placeholder?:string}){return <label>{label}<input value={value||""} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>}
function AccessibilityPanel({j,scene,onUpdate,close}:{j:Journey;scene:number;onUpdate:(p:Partial<Journey>)=>void;close:()=>void}){
  return <>
    <div className="scene-description"><strong>Describe this scene</strong><p>{alts[scene]}</p></div>
    <div className="accessibility-options" aria-label="Accessibility preferences">
      <label className="preference-row"><span><strong>Larger interface text</strong><small>Increases controls and readable text without changing the artwork.</small></span><input type="checkbox" checked={j.largeText} onChange={e=>onUpdate({largeText:e.target.checked})}/></label>
      <label className="preference-row"><span><strong>Reduce motion</strong><small>Turns off pulses and decorative movement.</small></span><input type="checkbox" checked={j.reducedMotion} onChange={e=>onUpdate({reducedMotion:e.target.checked})}/></label>
      <fieldset className="speed-options"><legend>Narration speed</legend><div>{[0.75,1,1.25,1.5].map(rate=><button key={rate} type="button" className={j.playbackRate===rate?"selected":""} aria-pressed={j.playbackRate===rate} onClick={()=>onUpdate({playbackRate:rate})}>{rate}×</button>)}</div></fieldset>
    </div>
    <p className="caption-note">Captions are included with every narration video. You can pause, replay, mute, change speed, or skip narration without losing access to the scene.</p>
    <button className="primary" onClick={close}>Return to Resume District</button>
  </>
}
function renderModal(kind:string,j:Journey,answer:(p:Partial<Answers>)=>void,complete:(id:string,xp:number)=>void,close:()=>void,go:(s:number)=>void){
  const a=j.answers;
  if(kind.startsWith("source:")){
    const source=kind.slice(7) as Source,l=sourceLessons[source],saved=a.experienceResponses?.[source]||{skills:[],note:""};
    const fit=a.experienceFit?.[source];
    const save=(p:Partial<{skills:string[];note:string}>)=>answer({
      experienceResponses:{...(a.experienceResponses||{}),[source]:{...saved,...p}},
      experienceSource:source,
      experienceSkills:p.skills||saved.skills,
      experienceNote:p.note??saved.note
    });
    const finish=(choice:"use"|"not-me")=>{
      answer({experienceFit:{...(a.experienceFit||{}),[source]:choice}});
      complete("source-"+slug(source),50);
      close();
    };
    return <>
      <p>{l.body}</p>
      <Choices label="Which skills can this experience show?" items={l.skills} value={saved.skills} multi onChange={v=>save({skills:v})}/>
      <Field label="What is one example from your experience?" value={saved.note} onChange={v=>save({note:v})} placeholder="A short, truthful example"/>
      <div className="source-outcomes">
        <button className="primary" disabled={!saved.skills.length||!saved.note.trim()} onClick={()=>finish("use")}>I can use this experience • 50 XP</button>
        <button className="secondary honest-exit" onClick={()=>finish("not-me")}>This experience doesn’t fit me • 50 XP</button>
      </div>
      <p className="source-integrity-note">Both choices count as exploration. Choose the option that is true for you—you never need to invent an example.</p>
    </>
  }
  if(kind.startsWith("skill:")){const id=kind.slice(6),s=skillLessons.find(x=>x[0]===id)!,reflection=a.skillReflections?.[id]||"";return <><div className="micro"><h3>{s[1]} in action</h3><p>{s[2]}</p><h3>Why employers value it</h3><p>{s[3]}</p></div><Field label="Where have you already used this skill?" value={reflection} onChange={v=>answer({skillReflections:{...(a.skillReflections||{}),[id]:v}})} placeholder="A short example from work, school, home, or your community"/><button className="primary" disabled={!reflection.trim()} onClick={()=>{complete("skill-"+id,25);close()}}>Skill explored • 25 XP</button></>}
  if(kind==="translator"){const bullet=buildBullet(a);return <><p>Describe only what really happened. We will shape your words without inventing accomplishments.</p><Field label="What did you actually do?" value={a.task} onChange={v=>answer({task:v})} placeholder="Example: organized appointments and transportation"/><Choices label="Choose a strong opening action" items={["Coordinated","Organized","Supported","Created","Resolved","Maintained","Trained","Assisted"]} value={a.action} onChange={v=>answer({action:v})}/><Field label="What skill did that demonstrate?" value={a.skill} onChange={v=>answer({skill:v})} placeholder="planning, communication, teamwork…"/><Field label="What changed or was accomplished? (optional)" value={a.result} onChange={v=>answer({result:v})}/><div className="draft"><b>Your editable résumé bullet</b><textarea value={a.bullet??bullet} onChange={e=>answer({bullet:e.target.value})}/></div><button className="primary" disabled={!a.task||!a.action} onClick={()=>{answer({bullet:a.bullet||bullet});complete("translator",125);close()}}>Save résumé bullet • 125 XP</button></>}
  if(kind.startsWith("tip:")){const t=kind.slice(4),copy:Record<string,string>={"Too Long":"Keep the most relevant evidence easy to scan. More words do not always mean more value.","No Focus":"Aim the résumé at a target role. Relevant evidence helps a recruiter understand your fit quickly.","Unprofessional":"Use consistent formatting, an appropriate email address, and language you would confidently discuss in an interview.","Confusing Templates":"Simple structure helps recruiters—and applicant tracking systems—find your skills and experience.","ATS Scanner":"Applicant tracking systems often look for readable structure and relevant terms from the posting.","ATS Approved":"Clear headings, standard fonts, and truthful job-relevant keywords are safer than decorative complexity.","Right Path":"Choose clarity, evidence, relevance, and honesty at every step.","Résumé Quest Tip":"A strong résumé earns the next conversation. It does not need to tell your whole life story."};return <><div className="micro"><h3>{t}</h3><p>{copy[t]}</p></div><button className="primary" onClick={close}>Got it</button></>}
  if(kind==="email")return <EmailCheckpoint done={()=>{answer({emailTakeaway:"Use a recognizable, name-based email address without jokes, provocative language, or distracting numbers."});complete("email",75);close()}}/>;
  if(kind==="anatomy")return <><p>Open each section to learn its job.</p><div className="flip-grid">{[["Contact","Name, phone, professional email, and location—not a full street address."],["Summary","A targeted snapshot of the value you offer."],["Skills","Relevant, honest skills that appear in the target posting."],["Experience","Evidence of what you did and the value it created."],["Education","School, credentials, training, and relevant certifications."]].map(x=><details key={x[0]}><summary>{x[0]}<small>Flip to explore</small></summary><p>{x[1]}</p></details>)}</div><button className="primary" onClick={()=>{complete("anatomy",50);close()}}>Résumé anatomy explored</button></>;
  if(kind==="recruiter")return <Recruiter j={j} answer={answer} complete={complete} close={close}/>;
  if(kind==="keywords")return <Challenge prompt="A posting asks for customer service, accurate records, and teamwork. Which bullet is better tailored?" options={["Helped customers and did other tasks.","Assisted customers, maintained accurate order records, and coordinated with teammates during busy shifts."]} correct={1} explain="The second bullet uses relevant language and concrete evidence without making unsupported claims." done={()=>{answer({keywordTakeaway:"Use truthful keywords from the posting and prove them with specific evidence."});complete("keywords",75);close()}}/>;
  if(kind==="brand")return <Challenge prompt="Before applying, what is the strongest next step?" options={["Delete every account immediately.","Review public content, privacy settings, username, and profile information.","Assume employers never search online."]} correct={1} explain="A thoughtful review protects privacy and supports the professional story you want to tell." done={()=>{answer({digitalTakeaway:"Review public content, privacy settings, usernames, and profile information before applying."});complete("brand",50);close()}}/>;
  if(kind==="integrity")return <Challenge prompt="Which résumé choice is honest and strong?" options={["Claim a manager title because you sometimes helped new coworkers.","Say nothing about helping new coworkers.","Supported onboarding by demonstrating routine tasks and answering new-employee questions."]} correct={2} explain="Strengthening truthful experience is good résumé writing. Inventing a title is not." done={()=>{answer({integrityTakeaway:"Describe real contributions strongly without changing titles or inventing authority."});complete("integrity",75);close()}}/>;
  if(kind==="builder")return <><h3>Your résumé evidence</h3><div className="draft"><b>Saved bullet</b><p>{a.bullet||"Return to Transferable Skills to create your first bullet."}</p></div><Choices label="What support would help next?" items={["Start my first résumé","Improve my current résumé","Review keywords","Get Career Coach feedback","Prepare for applications"]} value={a.support} onChange={v=>answer({support:v})}/><button className="primary" disabled={!a.support} onClick={()=>{complete("builder",50);close()}}>Save résumé plan</button></>;
  if(kind==="reflection")return <><Choices label="Which lesson helped you level up most?" items={["My experience counts","Transferable skills","Professional email","Keywords","Tailoring a résumé","Digital presence","Résumé integrity"]} value={a.lesson} onChange={v=>answer({lesson:v})}/><Field label="What experience can you add this week?" value={a.addThisWeek} onChange={v=>answer({addThisWeek:v})}/><Choices label="What are you most likely to do next?" items={["Create my first résumé","Update my résumé","Apply for jobs","Review my social media","Meet with my Career Coach"]} value={a.nextAction} onChange={v=>answer({nextAction:v})}/><button className="primary" disabled={!a.lesson||!a.addThisWeek||!a.nextAction} onClick={()=>{complete("reflection",100);close()}}>Complete Resume District</button></>;
  if(kind==="review")return <Review j={j}/>;
  if(kind==="skill-tree")return <><div className="micro"><h3>Career Skill Tree</h3><p>This future career-exploration pathway will help you connect your interests and strengths with local labor-market opportunities, explore career families, and identify skills worth building next.</p><h3>How it unlocks</h3><p>Complete Resume District, Interview Arena, First Day Challenge, and Money Moves. You can always open this panel to see what is ahead.</p></div><button className="primary" onClick={close}>Back to the map</button></>;
  if(kind==="help")return <><div className="micro help-guide"><h3>Resume District controls</h3><p><b>Opportunity City</b> returns you to the Level Up city without clearing your Resume District progress.</p><p><b>Cloud save</b> shows whether your progress is saved, saving, or temporarily stored on this device.</p><p><b>Glowing hotspots</b> mark places you can select to explore, practice, or complete an activity.</p><p><b>Audio controls</b> let you play or pause narration and turn narration sound on or off. Captions remain available with narrated scenes.</p><p><b>Clear</b> restarts Resume District only after you confirm the reset.</p><p>Your XP tracks completed learning interactions. It is progress—not a score.</p></div><button className="primary" onClick={close}>Got it</button></>;
  return <><h3>Accessibility</h3><p>{alts[j.scene]}</p><p>Narration can be paused, muted, replayed, or skipped. Captions are included in the narrated video. All learning hotspots work by keyboard and touch, with visible focus.</p><button className="primary" onClick={close}>Done</button></>;
}
function EmailCheckpoint({done}:{done:()=>void}){const [index,setIndex]=useState(0),[pick,setPick]=useState<boolean|null>(null),[correct,setCorrect]=useState(0);const card=emailCards[index];function choose(v:boolean){setPick(v);if(v===card[1])setCorrect(c=>c+1)}function advance(){if(index===emailCards.length-1){done();return}setIndex(i=>i+1);setPick(null)}return <><p>Choose whether each fictional address is professional for a job search. Then flip the card to see why.</p><div className="email-progress">{index+1} of {emailCards.length}</div><article className={`email-card ${pick!==null?"flipped":""}`}><div><strong>{card[0]}</strong>{pick===null?<div className="email-actions"><button onClick={()=>choose(true)}>Professional</button><button onClick={()=>choose(false)}>Needs work</button></div>:<div className="email-answer"><b>{pick===card[1]?"✓ Strong call":"Take another look"}</b><p>{card[2]}</p><p>Recommended: <strong>{card[1]?"Professional":"Needs work"}</strong></p></div>}</div></article>{pick!==null&&<button className="primary" onClick={advance}>{index===emailCards.length-1?`Finish checkpoint • ${correct+(pick===card[1]?0:0)} reviewed`:"Next email"}</button>}</>}
function Recruiter({j,answer,complete,close}:{j:Journey;answer:(p:Partial<Answers>)=>void;complete:(id:string,xp:number)=>void;close:()=>void}){
  const stacks=[["Rejected","Too generic, hard to read, or unsupported claims."],["Maybe Candidates","Some relevant evidence, but the fit is not yet clear."],["Strong Candidates","Relevant skills are backed by specific, readable evidence."],["Interview Invites","The résumé makes the recruiter want to learn more."]];
  return <><p>Recruiters make fast comparisons. Explore the stacks, then capture one change that could move a résumé forward.</p><div className="flip-grid">{stacks.map(x=><details key={x[0]}><summary>{x[0]}<small>See the recruiter lens</small></summary><p>{x[1]}</p></details>)}</div><Choices label="Where should a résumé with relevant, specific evidence go?" items={stacks.map(x=>x[0])} value={j.answers.recruiterStack} onChange={v=>answer({recruiterStack:v})}/><Field label="What would move your résumé to the next stack?" value={j.answers.recruiterTakeaway} onChange={v=>answer({recruiterTakeaway:v})} placeholder="One change you can make"/><button className="primary" disabled={j.answers.recruiterStack!=="Strong Candidates"||!j.answers.recruiterTakeaway} onClick={()=>{complete("recruiter-bonus",100);close()}}>Save bonus takeaway • 100 XP</button></>
}
function Challenge({prompt,options,correct,explain,done}:{prompt:string;options:string[];correct:number;explain:string;done:()=>void}){const [pick,setPick]=useState<number|null>(null);return <><h3>{prompt}</h3><div className="challenge">{options.map((x,i)=><button className={pick===i?(i===correct?"right":"wrong"):""} onClick={()=>setPick(i)} key={x}>{x}</button>)}</div>{pick!==null&&<div className="feedback"><b>{pick===correct?"Strong choice":"Look again"}</b><p>{explain}</p></div>}<button className="primary" disabled={pick!==correct} onClick={done}>Save and continue</button></>}
function Review({j}:{j:Journey}){const a=j.answers;const explored=sourceOrder.map(s=>{const r=a.experienceResponses?.[s],fit=a.experienceFit?.[s];if(fit==="not-me")return `${s}: explored — not part of my experience`;return r?.note?`${s}: ${r.skills.join(", ")} — ${r.note}`:""}).filter(Boolean).join(" | ");const skillUses=skillLessons.map(s=>a.skillReflections?.[s[0]]?`${s[1]}: ${a.skillReflections[s[0]]}`:"").filter(Boolean).join(" | ");const rows=[["Experience explored",explored||"Not yet captured"],["Skills in my life",skillUses||"Not yet captured"],["Résumé bullet",a.bullet||"Not yet captured"],["Professional email",a.emailTakeaway||"Not yet captured"],["Recruiter perspective",a.recruiterTakeaway||"Bonus activity not completed"],["Keyword / ATS takeaway",a.keywordTakeaway||"Not yet captured"],["Digital presence",a.digitalTakeaway||"Not yet captured"],["Integrity",a.integrityTakeaway||"Not yet captured"],["Résumé plan",a.support||"Not yet captured"],["Most useful lesson",a.lesson||"Not yet captured"],["Experience to add",a.addThisWeek||"Not yet captured"],["Next step",a.nextAction||"Not yet captured"]];return <div className="review"><div className="review-head"><div><p className="kicker">RESUME DISTRICT REVIEW</p><h3>{j.name}'s next career-coach conversation</h3></div><strong>{j.xp} XP</strong></div><p className="takeaway">You explored how life experience becomes workplace evidence—and how a clear, honest résumé can earn the next conversation.</p><dl>{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><section className="coach"><h3>Career coach conversation starter</h3><p>“Which experience gives us the strongest evidence for the role you want next, and how can we tailor that evidence to a real job posting?”</p></section><footer><span>🏅 Resume District completed {j.completionDate?new Date(j.completionDate).toLocaleDateString():""}</span><button className="primary" onClick={()=>window.print()}>Print / Save as PDF</button></footer></div>}
function buildBullet(a:Answers){if(!a.action||!a.task)return "Choose an action and describe what you did to create a draft.";return `${a.action} ${a.task.trim().replace(/[.]$/,"")}${a.skill?` using ${a.skill}`:""}${a.result?` to ${a.result}`:""}.`}
function slug(x:string){return x.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function modalTitle(k:string){if(k.startsWith("source:"))return k.slice(7)+" Experience";if(k.startsWith("skill:"))return "Transferable Skill";if(k.startsWith("tip:"))return "Résumé Quest Tip";return ({translator:"Experience Translator",email:"Professional Email Checkpoint",anatomy:"Résumé Anatomy",recruiter:"Recruiter Perspective — Bonus",keywords:"Keyword Forge",brand:"Digital Presence Check",integrity:"Integrity Crossroads",builder:"Résumé Readiness",reflection:"Resume District Reflection",review:"Resume District Review",help:"Help",access:"Accessibility","skill-tree":"Career Skill Tree"} as Record<string,string>)[k]||"Resume District"}
