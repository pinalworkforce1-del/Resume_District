const RAIL_ID = "level-up-scene-rail";
const PORTAL_URL = "https://pinalworkforce1-del.github.io/Level_Up_Portal/";
const RETURN_LABEL = "Return to Opportunity City";

function findHeaderButton(pattern: RegExp) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".topbar .controls button"))
    .find((button) => pattern.test(button.getAttribute("aria-label") || ""));
}

function currentVideo() {
  return document.querySelector<HTMLVideoElement>(".stage .caption-video");
}

function currentContinue() {
  return document.querySelector<HTMLButtonElement>(".stage .shell-continue-trigger");
}

function delay(ms:number){
  return new Promise<void>(resolve=>window.setTimeout(resolve,ms));
}

function returnButton(){
  return findHeaderButton(/Sign out|Return to Opportunity City|Saving progress before returning/i);
}

function configureReturnButton(){
  const button=returnButton();
  if(!button||button.dataset.luReturning==="1")return;
  button.setAttribute("aria-label",RETURN_LABEL);
  button.title=RETURN_LABEL;
}

async function waitForCloudSave(button:HTMLButtonElement){
  button.dataset.luReturning="1";
  button.disabled=true;
  button.setAttribute("aria-label","Saving progress before returning to Opportunity City");
  button.title="Saving progress…";

  // Resume District persists device state immediately and debounces the
  // Supabase module_progress write for 800 ms. Wait for that save to begin,
  // then allow the existing sync state to confirm completion.
  await delay(1000);
  const deadline=Date.now()+5000;
  while(Date.now()<deadline&&document.querySelector(".sync.saving"))await delay(120);

  if(document.querySelector(".sync.error")){
    window.alert("Level Up saved your progress on this device, but could not confirm the cloud save yet. Please try Return to Opportunity City again in a moment.");
    delete button.dataset.luReturning;
    button.disabled=false;
    button.setAttribute("aria-label",RETURN_LABEL);
    button.title=RETURN_LABEL;
    return false;
  }
  return true;
}

async function returnToOpportunityCity(button:HTMLButtonElement){
  if(button.dataset.luReturning==="1")return;
  if(await waitForCloudSave(button))window.location.href=PORTAL_URL;
}

// The native header control signs out of the shared Level Up session. Capture
// that click before React receives it and convert it into a save-then-return
// action so authentication, XP, progression, and Supabase history remain intact.
document.addEventListener("click",event=>{
  const target=event.target instanceof Element
    ? event.target.closest<HTMLButtonElement>(".topbar .controls button")
    : null;
  if(!target)return;
  const label=target.getAttribute("aria-label")||"";
  if(!/Sign out|Return to Opportunity City|Saving progress before returning/i.test(label))return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  void returnToOpportunityCity(target);
},true);

function buildRail() {
  const rail = document.createElement("aside");
  rail.id = RAIL_ID;
  rail.className = "level-up-scene-rail";
  rail.setAttribute("aria-label", "Scene controls");
  rail.innerHTML = `
    <small>SCENE CONTROLS</small>
    <button type="button" data-shell="audio"><span class="control-icon">🔊</span><span class="control-label">Audio on</span></button>
    <button type="button" data-shell="replay"><span class="control-icon">↻</span><span class="control-label">Replay narration</span></button>
    <button type="button" data-shell="skip"><span class="control-icon">↠</span><span class="control-label">Skip narration</span></button>
    <button type="button" data-shell="play"><span class="control-icon">▶</span><span class="control-label">Play narration</span></button>
    <button type="button" class="rail-continue" data-shell="continue">Continue <span>→</span></button>
  `;

  rail.querySelector<HTMLButtonElement>('[data-shell="audio"]')!.addEventListener("click", () => {
    findHeaderButton(/Mute narration|Turn on narration/i)?.click();
    queueRefresh();
  });

  rail.querySelector<HTMLButtonElement>('[data-shell="play"]')!.addEventListener("click", () => {
    findHeaderButton(/Pause narration|Play narration/i)?.click();
    queueRefresh();
  });

  rail.querySelector<HTMLButtonElement>('[data-shell="replay"]')!.addEventListener("click", () => {
    const video = currentVideo();
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => findHeaderButton(/Play narration/i)?.click());
    queueRefresh();
  });

  rail.querySelector<HTMLButtonElement>('[data-shell="skip"]')!.addEventListener("click", () => {
    const skip = document.querySelector<HTMLButtonElement>(".stage .skip");
    if (skip) skip.click();
    queueRefresh();
  });

  rail.querySelector<HTMLButtonElement>('[data-shell="continue"]')!.addEventListener("click", () => {
    currentContinue()?.click();
    queueRefresh();
  });

  return rail;
}

function bindVideo(video: HTMLVideoElement | null) {
  if (!video || video.dataset.levelUpShellBound === "true") return;
  video.dataset.levelUpShellBound = "true";
  ["play", "pause", "ended", "volumechange", "loadedmetadata"].forEach((event) =>
    video.addEventListener(event, queueRefresh),
  );
}

function refreshRail() {
  configureReturnButton();
  const app = document.querySelector<HTMLElement>("main.app");
  const stage = app?.querySelector<HTMLElement>(":scope > .stage");
  if (!app || !stage) return;

  app.classList.add("level-up-standard");
  let rail = document.getElementById(RAIL_ID) as HTMLElement | null;
  if (!rail) rail = buildRail();
  if (rail.parentElement !== app || rail.previousElementSibling !== stage) stage.insertAdjacentElement("afterend", rail);

  const video = currentVideo();
  bindVideo(video);
  const hasNarration = Boolean(video);
  const audioButton = rail.querySelector<HTMLButtonElement>('[data-shell="audio"]')!;
  const replayButton = rail.querySelector<HTMLButtonElement>('[data-shell="replay"]')!;
  const skipButton = rail.querySelector<HTMLButtonElement>('[data-shell="skip"]')!;
  const playButton = rail.querySelector<HTMLButtonElement>('[data-shell="play"]')!;
  const continueButton = rail.querySelector<HTMLButtonElement>('[data-shell="continue"]')!;

  const muted = video?.muted ?? false;
  audioButton.disabled = !hasNarration;
  audioButton.querySelector<HTMLElement>(".control-icon")!.textContent = muted ? "🔇" : "🔊";
  audioButton.querySelector<HTMLElement>(".control-label")!.textContent = muted ? "Audio off" : "Audio on";

  replayButton.disabled = !hasNarration;
  skipButton.disabled = !document.querySelector(".stage .skip");
  playButton.disabled = !hasNarration;
  const isPlaying = Boolean(video && !video.paused && !video.ended);
  playButton.querySelector<HTMLElement>(".control-icon")!.textContent = isPlaying ? "Ⅱ" : "▶";
  playButton.querySelector<HTMLElement>(".control-label")!.textContent = isPlaying ? "Pause narration" : "Play narration";

  const next = currentContinue();
  continueButton.hidden = !next;
  continueButton.disabled = !next || next.disabled;
}

let refreshQueued = false;
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    refreshRail();
  });
}

const observer = new MutationObserver(queueRefresh);
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "disabled", "class"] });
window.addEventListener("load", queueRefresh);
queueRefresh();
