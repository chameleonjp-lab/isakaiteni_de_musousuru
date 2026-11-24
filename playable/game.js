"use strict";

const story = createStory(CASTLE_DATA);
const $ = id => document.getElementById(id);
const content = $("content");
const stage = $("stage");
const modal = $("dialog");
const dialogCopy = $("dialog-copy");
const dialogNext = $("dialog-next");
const dialogActions = $("dialog-actions");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desk = $("desk");
const tabs = [...document.querySelectorAll("[data-tab]")];
const compactLayout = window.matchMedia("(max-width: 740px), (max-width: 1100px) and (pointer: coarse)");
const key = "ou-to-escape-v1";
const zones = { C:"中央宮", W:"西の記録棟", E:"東の生活棟", N:"北の研究棟・施療院", S:"南の客舎・作業場",
  G:"中庭と庭園", B:"地下の作業場", Q:"王家の礼拝区" };
const observations = {
  C01: "赤い絨毯の先に、玉座が静かに構えている。かすかな灯りがその足元だけを照らしている。",
  W01: "貸出棚の段ごとに、綴じ方の異なる冊子がぎっしりと並んでいる。",
  E01: "仕分けられた布の山の向こうから、干し台の古い木脚がのぞいている。",
  N01: "青灰色の焼き物が棚に並ぶ。窯のそばでは職人が黙々と手を動かしている。",
  S01: "豪華な櫃の隣に、浅い箱がひっそりと置かれている。箱の底には左右に分かれた鳥の絵が見える。",
  N02: "薬の匂いが漂う棚に、召喚客の診察記録と魔道具の控えが並んでいる。",
  G01: "水音のそばで、青銅の鷺が片脚を上げたままじっと立っている。",
  E02: "廊下の窓の下に、星の印を焼き付けた木箱がひっそりと置かれている。",
  W02: "祝宴を描いた大きな織物が垂れ下がっている。その裏側に、細い足場がのぞいている。",
  S02: "貼り替えられた壁紙の下から、背丈を刻んだような古い跡がうっすらとのぞいている。",
  N03: "石の盤に季節ごとの窓が刻まれている。何度も指で触れられたのか、縁がなめらかに減った穴もあった。",
  E03: "屋根の縁から雨のしずくが落ちる。棚には本物の羽と、木で彫られた羽が並んでいた。",
  W03: "数ある絵の中で、王女の肖像にだけ二つの小さな光が揺れている。",
  S03: "当番盤に、見張りの持ち場を示す駒が並ぶ。そばの鐘が微かに震え、余韻を残していた。",
  W04: "返却前の香車が静かに止まっている。奥の扉の隙間から、白い石床がわずかに見えた。",
  Q01: "閉ざされた扉の向こうから、遠くの祈りの気配だけが微かに伝わってくる。",
  Q02: "見張りの灯りが白い床をゆっくりと横切る。壁際の浮き彫りは、その先の暗がりまで続いている。",
  Q03: "明かり取りの窓の下に、古い石像が静かに並ぶ。冠が鈍く光っているのは三体だけだ。",
  Q04: "声を立ててもまるで響かない。通路の奥から、外の匂いを含んだ湿った風が流れてくる。",
  Q05: "白い砂の端に、古びた境石が据えられている。その先の草むらで、夜露が静かに光っていた。"
};
const unlockedPast = new Set(["発見","死因","期限切れ"]);
const payoff = new Map();
for (const e of story.side.values()) {
  for (const ref of e.payoff || []) {
    if (ref === e.id) continue;
    if (!payoff.has(ref)) payoff.set(ref, []);
    payoff.get(ref).push(e.id);
  }
}
let run = story.fresh();
let audioEnabled = true;
let initialPosition;
try {
  const stored = JSON.parse(localStorage.getItem(key) || 'null');
  if (stored && story.validSave(stored.run)) {
    run = stored.run;
    if (Array.isArray(run.warnings)) run.warnings = run.warnings.map(upgradeWarningKey);
    initialPosition = stored.position;
  }
  if (stored?.audioEnabled === false) audioEnabled = false;
} catch { /* A blocked store is fine for the current tab. */ }

let selectedTab = "scene";
let audienceMission = null;
let toastTimer;
let timer = 0;
let puzzleStarted = 0;
let dialogOrigin;
let dialogueLines = [];
let finishLine;
let dialogueFrame = 0;
let sound;
let view;
let boundaryAttempt;
function save() {
  const position = view?.walkingPosition(run.world.room);
  try { localStorage.setItem(key,JSON.stringify({run,audioEnabled,position})); } catch { /* play without persistence */ }
}
function savePosition() {
  const position = view?.walkingPosition(run.world.room);
  if (!position) return;
  try {
    const current = JSON.parse(localStorage.getItem(key));
    if (current && JSON.stringify(current.run) === JSON.stringify(run)) {
      localStorage.setItem(key,JSON.stringify({...current,position}));
    }
  } catch { /* play without persistence */ }
}
function tone(notes, wave = "triangle") {
  if (!audioEnabled) return;
  try {
    sound ||= new (window.AudioContext || window.webkitAudioContext)();
    if (sound.state === "suspended") sound.resume().catch(() => {});
    for (const [index, pitch] of notes.entries()) {
      const oscillator = sound.createOscillator();
      const volume = sound.createGain();
      const at = sound.currentTime + index*.09;
      oscillator.frequency.value = pitch;
      oscillator.type = wave;
      volume.gain.setValueAtTime(.001,at);
      volume.gain.exponentialRampToValueAtTime(.045,at+.02);
      volume.gain.exponentialRampToValueAtTime(.001,at+.25);
      oscillator.connect(volume);
      volume.connect(sound.destination);
      oscillator.start(at);
      oscillator.stop(at+.27);
    }
  } catch { /* browser sound support is optional */ }
}
function hintToast(text) {
  clearTimeout(toastTimer);
  const el = $("toast");
  el.textContent = text;
  el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; },4200);
}
function element(tag, text = "", className = "") {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function action(label, onClick, options = {}) {
  const node = element("button",label, "action "+(options.className || ""));
  node.type = "button";
  node.disabled = !!options.disabled;
  if (options.detail) node.append(element("span",options.detail));
  node.addEventListener("click",onClick);
  return node;
}
function paragraphs(target, texts) {
  for (const text of texts) if (text) target.append(element("p",text));
}
function appendSection(title, list) {
  if (!list.length) return;
  content.append(element("h3",title));
  const listBox = element("div","","actions");
  listBox.append(...list);
  content.append(listBox);
}
function updateStatus(walk) {
  const w = run.world;
  const room = story.rooms.get(w.room);
  const remaining = Math.max(0,CASTLE_DATA.escape.minutes_until_obedience-w.minutes);
  $("clock").textContent = w.escaped ? "敷地外" : story.collarOff(w) ? "見つからずに進め" :
    "残り "+Math.floor(remaining/60)+"時間 "+String(remaining%60).padStart(2,"0")+"分";
  $("collar").textContent = story.collarOff(w) ? "首輪を外した" : "翻訳の首輪";
  $("district").textContent = w.escaped ? "夜明け前" : zones[room.id[0]];
  $("room").textContent = w.escaped ? "城の外" : room.name;
  $("feature").textContent = w.escaped ? "冠を刻んだ境石は、もう背後に遠ざかった。" : observations[room.id] || room.feature;
  $("audio").textContent = audioEnabled ? "音あり" : "音なし";
  $("audio").setAttribute("aria-pressed",String(audioEnabled));
  stage.dataset.mood = run.failure ? "danger" : w.escaped ? "clear" : "normal";
  $("walk-tab").textContent = view?.available() ? "出口" : "移動";
  audienceMission = ["M01","M02"].find(id=>story.canMain(run,id));
  const call = $("audience-call");
  call.hidden = !audienceMission;
  call.textContent = audienceMission ? puzzles[audienceMission][0] : "";
  view?.setRoom(room,run,walk);
}
function deskOpen() {
  return compactLayout.matches && desk.dataset.open === "true";
}
function updateDeskControls() {
  for (const tab of tabs) {
    const selected = tab.dataset.tab === selectedTab;
    if (compactLayout.matches) {
      tab.removeAttribute("aria-pressed");
      tab.setAttribute("aria-expanded",String(deskOpen() && selected));
    } else {
      tab.removeAttribute("aria-expanded");
      tab.setAttribute("aria-pressed",String(selected));
    }
  }
}
function setDeskOpen(open, returnFocus = false) {
  if (desk.dataset.open !== String(open)) view?.stopInput();
  desk.dataset.open = String(open);
  updateDeskControls();
  if (returnFocus) tabs.find(tab=>tab.dataset.tab===selectedTab)?.focus({preventScroll:true});
}
function openDesk(tab) {
  refresh(tab);
  if (compactLayout.matches) {
    setDeskOpen(true);
    content.focus({preventScroll:true});
  }
}
function refresh(tab = selectedTab, walk) {
  const changed = tab !== selectedTab;
  selectedTab = tab;
  updateStatus(walk);
  updateDeskControls();
  content.replaceChildren();
  if (tab==="walk") renderWalk();
  else if (tab==="notes") renderNotes();
  else if (tab==="items") renderItems();
  else renderScene();
  if (changed) content.scrollTop = 0;
}
function stopTimer() { clearInterval(timer); timer = 0; puzzleStarted = 0; }
function stopDialogue() {
  cancelAnimationFrame(dialogueFrame);
  dialogueFrame = 0;
  finishLine = null;
  dialogueLines = [];
}
function showDialogueLine() {
  const line = dialogueLines.shift();
  const text = element("p");
  dialogCopy.replaceChildren(text);
  dialogCopy.closest(".dialog-content").scrollTop = 0;
  const hint = $("dialog-hint");
  const showFullLine = () => {
    cancelAnimationFrame(dialogueFrame);
    dialogueFrame = 0;
    finishLine = null;
    hint.textContent = dialogueLines.length ? "次へ" : "行動を選ぶ";
    dialogNext.setAttribute("aria-label",hint.textContent);
    text.textContent = line;
  };
  if (reducedMotion.matches) return showFullLine();

  const characters = Array.from(line);
  const started = performance.now();
  finishLine = showFullLine;
  hint.textContent = "";
  dialogNext.setAttribute("aria-label","全文を表示");
  const type = now => {
    const count = Math.max(1, Math.floor((now - started) * .028));
    if (count >= characters.length) return showFullLine();
    const nextText = characters.slice(0,count).join("");
    if (text.textContent !== nextText) text.textContent = nextText;
    dialogueFrame = requestAnimationFrame(type);
  };
  dialogueFrame = requestAnimationFrame(type);
}
function advanceDialogue() {
  if (finishLine) return finishLine();
  if (dialogueLines.length) return showDialogueLine();
  dialogNext.hidden = true;
  dialogActions.hidden = false;
  dialogActions.firstElementChild?.focus({preventScroll:true});
}
function openDialog(kicker, title, texts, controls, {locked = false, mode = "story", speaker = null} = {}) {
  stopTimer();
  stopDialogue();
  view?.stopInput();
  view?.setSpeaker(speaker?.id);
  $("dialog-kicker").textContent = kicker;
  $("dialog-title").textContent = title;
  dialogCopy.replaceChildren();
  dialogActions.replaceChildren(...controls);
  $("dialog-close").hidden = locked;
  modal.dataset.locked = String(locked);
  modal.dataset.layout = mode === "panel" ? "panel" : "story";
  modal.dataset.speaker = String(Boolean(speaker));
  modal.setAttribute("aria-labelledby",speaker ? "dialog-kicker" : "dialog-title");
  const progressive = mode === "story" && texts.some(Boolean) && controls.length > 0;
  dialogActions.hidden = progressive;
  dialogNext.hidden = !progressive;
  if (progressive) {
    dialogueLines = texts.filter(Boolean);
    showDialogueLine();
  } else {
    paragraphs(dialogCopy,texts);
  }
  if (!modal.open) {
    dialogOrigin = deskOpen() && desk.contains(document.activeElement) ?
      tabs.find(tab=>tab.dataset.tab===selectedTab) : document.activeElement;
    setDeskOpen(false);
    modal.showModal();
  }
  modal.scrollTop = 0;
  const focus = progressive ? dialogNext : locked ? controls[0] : $("dialog-close");
  focus?.focus({preventScroll:true});
}
function closeDialog() {
  stopTimer();
  stopDialogue();
  view?.setSpeaker(null);
  modal.close();
  if (dialogOrigin?.isConnected) dialogOrigin.focus({preventScroll:true});
}
function tracked(key, respond, person = null, repeatedDeath) {
  return () => {
    if (!story.choose(run,key,person,repeatedDeath)) {
      if (run.failure) { save(); presentFailure(); }
      return;
    }
    save();
    respond();
  };
}
function previousChoices(id) {
  return (payoff.get(id) || []).flatMap(from => {
    const earlier = story.side.get(from).branches.filter(b=>story.has(run,b.id));
    return earlier.map(b=>`以前の選択「${b.choice}」── ${b.effect}`);
  });
}
function fatalReply(person, choice) {
  const {heading,body} = conversationDeath(person,choice);
  story.fail(run,null,heading,body,run.world,story.collarOff(run.world));
  save();
  presentFailure();
}
function openConversation({person, key, title, lines, correct, onCorrect, replies, fatal, onFatal, allFatal}) {
  const actual = replies || characterReplies[person.id];
  const reopen = () => openConversation({person,key,title,lines,correct,onCorrect,replies,fatal,onFatal,allFatal});
  const controls = talkChoices(key,correct,actual,fatal,allFatal).map(choice => {
    const respond = () => {
      if (choice.outcome === "correct") return onCorrect();
      if (choice.outcome === "death") {
        if (onFatal?.(choice)) return;
        return fatalReply(person,choice);
      }
      openDialog(person.name,"会話を終えた",["相手は話を切り上げ、元の仕事に戻った。"],[action("もう一度話す",reopen),action("閉じる",closeDialog)],{speaker:person});
    };
    return action(choice.label,tracked(conversationWarningKey(person,choice),respond,person.name,
      () => conversationDeath(person,choice,true)));
  });
  openDialog(person.name,title,lines,controls,{speaker:person});
}

function presentFailure() {
  updateStatus();
  const { heading, body, event } = run.failure;
  if (CASTLE_STAGE_EFFECTS[event]) view?.play(CASTLE_STAGE_EFFECTS[event]);
  const kind = story.side.get(event)?.kind;
  const label = kind === "発見" ? "発見された" : kind === "期限切れ" ? "時間切れ" : "命を落とした";
  tone([182,119,65],"sine");
  const doRewind = (earlier = false) => {
    if (!story.rewind(run,earlier)) return;
    closeDialog();
    refresh("scene",{reset:true});
    save();
    hintToast("直前の安全な場面へ戻った。手帳の記録はそのまま残っている。");
  };
  const controls = [action("安全な場面に戻る",() => doRewind(),{className:"primary"})];
  if (run.beforeRemoval && story.collarOff(run.world)) {
    controls.push(action("首輪を外す前に戻る",() => doRewind(true)));
  }
  openDialog(label,heading,[body,event ? story.side.get(event)?.effect : null],controls,{locked:true,mode:"panel"});
}
function presentClear() {
  refresh("scene");
  tone([261.63,329.63,392,523.25]);
  openDialog("脱出成功","王都の城を抜け出した",[
    story.main.get("M20").scene,
    ...previousChoices("M20"),
    `本筋の進行 ${run.world.main.length}／20　寄り道の発見 ${new Set([...run.world.side,...run.memory]).size}／300`,
    "訪れた場所 "+run.visited.length+"／59　死に戻り "+run.fails+"回"
  ],[action("手帳を開く",() => { closeDialog(); openDesk("notes"); },{className:"primary"}),action("閉じる",closeDialog)],{mode:"panel"});
}
function confirmReset() {
  openDialog("はじめから","最初の謁見からやり直す",["現在の進行状況と手帳の記録をすべて消し、最初の謁見からやり直します。"],[
    action("最初からやり直す",() => { run=story.fresh(); closeDialog(); refresh("scene",{reset:true}); save(); },{className:"danger"}),
    action("やめる",closeDialog)
  ],{mode:"panel"});
}
function postMain(id, proof, speaker = null) {
  const success=story.completeMain(run,id,proof);
  save();
  if (run.failure) return presentFailure();
  if (!success) return;
  tone(id==="M17" ? [209,186,164] : [349,523]);
  if (run.world.escaped) return presentClear();
  const scene = story.main.get(id);
  refresh();
  const reward = CASTLE_DATA.items.find(item=>item.found===id);
  openDialog(reward ? `「${reward.name}」を手に入れた` : (id==="M17" ? "首輪の翻訳が途絶えた" : "その後"),
    id==="M17" ? "首輪が外れた" : puzzles[id][0],
    [scene.scene,scene.effect,reward && itemNotes[reward.id],...previousChoices(id)],
    [action("次へ進む",() => {
      closeDialog();
      view?.play(CASTLE_STAGE_EFFECTS[id]);
    },{className:"primary"})],{speaker});
}
function wrongMain(id, index) {
  const bad = id==="M18" ? (index===0 ? "E280" : "E278") : id==="M19" && index===0 ? "E284" : null;
  if (bad) {
    story.playSide(run,bad);
    save();
    if (run.failure) return presentFailure();
  }
  if (id==="M10" && index===1) {
    closeDialog();
    return hintToast("裏見台の入口まで戻った。マントはまだ使える。");
  }
  const variant = { M06:"singleSlotFail", M08:"rodOnlyFail", M12:"oneOnlyFail",
    M16:"wrongOrientation", M17:"doorOpen", M19:"wrongStatue", M20:"stopBeforeStone" }[id];
  if (variant && index === 0) view?.play(variant);
  tone([240],"sine");
  openDialog("様子を見る",puzzles[id][0],[answers[id]],[action("調べ直す",() => inspectMain(id),{className:"primary"}), action("閉じる",closeDialog)]);
}
function timerUI(seconds, onExpire, note) {
  const label = element("p",note);
  const bar = document.createElement("progress");
  bar.max = seconds;
  bar.value = seconds;
  bar.setAttribute("aria-label","マントの残り時間");
  $("dialog-copy").append(label,bar);
  puzzleStarted=performance.now();
  timer=setInterval(() => {
    const remaining=Math.max(0,seconds-(performance.now()-puzzleStarted)/1000);
    bar.value=remaining;
    label.textContent=`マントの効果：残り${Math.ceil(remaining)}秒`;
    if (!remaining) { stopTimer(); onExpire(); }
  },100);
}
function timedCloak(id) {
  const [,speaker,detail,right,wrong] = puzzles[id];
  openDialog("隠密のマント",speaker,[detail],[
    action(right,tracked(id+".correct",() => {
      if (puzzleStarted && performance.now()-puzzleStarted<10000) postMain(id,"cloak");
      else wrongMain(id,1);
    })),
    ...wrong.map((text,i)=>action(text,tracked(id+".wrong"+i,()=>wrongMain(id,i))))
  ],{mode:"timed"});
  timerUI(10,() => openDialog("マントの効果が切れた","裏見台の手前",[
    "裾の星がすべて消え、姿が露わになった。入口からもう一度羽織り直せる。"
  ],[action("マントを羽織り直す",() => timedCloak(id),{className:"primary"}),action("閉じる",closeDialog)]),"マントの効果：残り10秒");
}
function patrolCrossing() {
  const id = "M18";
  const [,,brief,,wrong] = puzzles[id];
  const elapsed = () => (performance.now()-puzzleStarted)%8000;
  const open = () => elapsed()>=2000 && elapsed()<6500;
  const passage=action("白百合の壁際を渡る",tracked(id+".correct",() => {
    if (open()) { postMain(id,"white-lily"); return; }
    const event=story.side.get("E280");
    story.fail(run,event,"交代前に見つかった","見張りの灯りが白百合の壁際を照らし出す。西番が足を止め、こちらへ視線を向けた。");
    save();
    presentFailure();
  }));
  openDialog("巡回環","見張りの交代を待つ",[brief],[
    passage, ...wrong.map((text,index) => action(text,tracked(id+".wrong"+index,() => wrongMain(id,index))))
  ],{mode:"timed"});
  const gauge=element("p","西番はまだ持ち場を離れていない。","record");
  gauge.setAttribute("role","status");
  $("dialog-copy").append(gauge);
  puzzleStarted=performance.now();
  timer=setInterval(() => {
    const status=open() ? "切れ目が重なった！ 今なら渡れる。" : "西番が廊下を見張っている。";
    if (status!==gauge.textContent) { gauge.textContent=status; if(open()) tone([277,415]); }
  },80);
}

function crossBoundary(proof) {
  if (boundaryAttempt || !story.canMain(run, "M20")) return;
  const attempt = { run, world: run.world };
  boundaryAttempt = attempt;
  closeDialog();
  const finish = crossed => {
    if (boundaryAttempt !== attempt) return;
    boundaryAttempt = null;
    if (run !== attempt.run || run.world !== attempt.world || run.world.room !== "Q05") return;
    if (crossed) postMain("M20", proof);
    else if (!run.failure) hintToast("まだ境石を越えていない。その先の草地まで歩き切ろう。");
  };
  if (!view?.play("clearSuccess", finish)) finish(true);
}

function inspectMain(id) {
  if (!story.canMain(run,id)) return;
  const [,speaker,brief,right,wrong] = puzzles[id];
  if (id === CASTLE_DATA.escape.finish && view?.available()) {
    return openDialog("境石",speaker,[brief,"境石の脇を抜け、白い砂の先の草地まで歩いて越えよう。"],[action("戻る",closeDialog)]);
  }
  if (id==="M18") {
    openDialog("調べる",speaker,[brief],[
      action("巡回環をかざす",patrolCrossing,{className:"primary"}),action("閉じる",closeDialog)
    ]);
    return;
  }
  if (id==="M10") {
    openDialog("調べる",speaker,[brief,"姿を隠せるのは十秒だけ。羽織る前に、床の白い線がどこへ続いているか確かめておこう。"],[
      action("マントを羽織る",() => timedCloak(id),{className:"primary"}),action("閉じる",closeDialog)
    ]);
    return;
  }
  const proof = id==="M20" ? CASTLE_DATA.escape.boundary_event : null;
  const options = [action(right,tracked(id+".correct",() => id === "M20" ? crossBoundary(proof) : postMain(id,proof))),
    ...wrong.map((text,i)=>action(text,tracked(id+".wrong"+i,()=>wrongMain(id,i))))];
  if (id!=="M20") options.splice(0,0,...options.splice(Number(id.slice(1))%options.length));
  openDialog("調べる",speaker,[brief],options);
}
function inspectMainTalk(id) {
  if (!story.canMain(run,id) && !canRevisitMainTalk(id)) return;
  const [personId,...replies] = mainTalk[id];
  const [,speaker,brief,correct] = puzzles[id];
  const person = story.cast.get(personId);
  const spoken = speaker.match(/「(.+)」$/)?.[1] || person.line;
  openConversation({
    person,key:id,title:speaker,lines:[spoken,brief],correct,replies,allFatal:id==="M01",
    onCorrect:() => {
      if (story.canMain(run,id)) return postMain(id,null,person);
      openDialog(person.name,speaker,[story.main.get(id).effect],[action("閉じる",closeDialog)],{speaker:person});
    },
    onFatal:choice=> {
      if (choice.key!=="M01.danger1" || !story.canSide(run,story.side.get("E002"))) return false;
      seeOutcome(story.side.get("E002"),null,{death:conversationDeath(person,choice)});
      return true;
    }
  });
}
function canRevisitMainTalk(id) {
  return Boolean(mainTalk[id] && !run.failure && !run.world.escaped && !story.collarOff(run.world) &&
    run.world.room===story.main.get(id).room && run.world.main.includes(id));
}
function seeOutcome(event, branch, {speaker = null, death = null} = {}) {
  const done = story.playSide(run,event.id,branch?.id);
  if (death && run.failure?.event === event.id) Object.assign(run.failure,death);
  save();
  if (run.failure) return presentFailure();
  if (!done) return;
  tone(event.kind==="宝箱" ? [392,523.25,659.25] : [300,440]);
  refresh();
  openDialog(speaker?.name || event.kind,event.title,[
    event.scene,
    branch?.effect || event.effect,
    ...previousChoices(event.id)
  ],[action("戻る",() => {
    closeDialog();
    const variant = CASTLE_STAGE_EFFECTS[branch?.id || event.id];
    if (variant) view?.play(variant);
  },{className:"primary"})],{speaker});
}
function inspectSide(event, branch = null) {
  if (!story.canSide(run,event)) return;
  const person = story.cast.get(event.person);
  const actionLabel = event.action.replace(/。$/,"");
  if (person) {
    const safe = fatalSceneReply[event.id];
    const alternatives = characterReplies[person.id];
    const correct = safe?.[0] || branch?.choice || actionLabel;
    const known = story.has(run,branch?.id || event.id);
    return openConversation({
      person,key:branch?.id || event.id,title:event.title,
      lines:[event.actor_note || story.rooms.get(event.room).feature,person.line],correct,
      fatal:safe ? [actionLabel,alternatives[0]] : null,
      onCorrect:() => {
        if (!safe && !known) return seeOutcome(event,branch,{speaker:person});
        openDialog(person.name,event.title,[safe?.[1] || branch?.effect || event.effect],[action("閉じる",closeDialog)],{speaker:person});
      },
      onFatal:choice=> {
        if (!safe || !choice.key.endsWith(".danger1")) return false;
        seeOutcome(event,null,{death:{
          heading:event.title,
          body:event.scene
        }});
        return true;
      }
    });
  }
  const options = (event.branches || []).filter(b => !story.has(run,b.id));
  const known = story.has(run,event.id) && (!event.branches || !CASTLE_DATA.escape.can_rehearse_both.includes(event.id) || options.length===0);
  if (known && !unlockedPast.has(event.kind)) {
    const current=event.branches?.filter(b=>story.has(run,b.id)).map(b=>b.effect);
    openDialog("以前に調べたこと",event.title,[event.scene,...(current?.length ? current : [event.effect])],[action("戻る",closeDialog)]);
    return;
  }
  const controls = event.branches ? options.map(b=>action(b.choice,tracked(b.id+".use",()=>seeOutcome(event,b)))) :
    [action(actionLabel,tracked(event.id+".use",()=>seeOutcome(event,null)),{className:unlockedPast.has(event.kind) ? "danger" : "primary"})];
  controls.push(action("やめる", closeDialog,{className:"subtle"}));
  openDialog(person?.name || "辺りの様子",event.title,event.branches ? [event.action, event.actor_note] : [event.actor_note],controls);
}
function renderScene() {
  const w=run.world;
  if (w.escaped) {
    content.append(element("h2","脱出成功"));
    paragraphs(content,["境石を越え、誰にも気づかれず城外の草地へたどり着いた。"]);
    appendSection("記録",[action("脱出の記録を見る",presentClear),action("はじめから",confirmReset)]);
    return;
  }
  content.append(element("h2",!w.main.includes("M02") ? "謁見" : "ここでできること"));
  const possible=[...story.main.values()].filter(e=>story.canMain(run,e.id));
  const sceneButtons=possible.map(e=>action(puzzles[e.id][0],()=>mainTalk[e.id] ? inspectMainTalk(e.id) : inspectMain(e.id),{className:"primary emblem"}));
  if (w.room==="C01" && w.main.includes("M02") && !story.collarOff(w)) {
    sceneButtons.push(action(rizeTalk.title,()=>openConversation({
      person:story.cast.get("P02"),key:"P02",title:rizeTalk.title,lines:[rizeTalk.line],correct:rizeTalk.correct,
      onCorrect:()=>openDialog("王女リゼ",rizeTalk.title,[rizeTalk.result],[action("閉じる",closeDialog)],{speaker:story.cast.get("P02")})
    })));
    sceneButtons.push(action("腰の剣に手をかける",() => {
      openConversation({
        person:story.cast.get("P16"),key:"C01.sword",title:"衛兵の警告",
        lines:["そばの衛兵があなたの手元を鋭く見ている。「剣は抜くな。両手を見せろ」"],
        correct:"剣から手を離して両手を見せる",replies:["剣を抜く","衛兵の槍を奪う","足元を見てそのまま立つ"],
        onCorrect:()=>openDialog("東番キリ","剣から手を離した",["衛兵はあなたの手に何もないことを確かめると、静かに槍を下ろした。"],[action("閉じる",closeDialog)],{speaker:story.cast.get("P16")})
      });
    }));
  }
  if (sceneButtons.length) {
    const box=element("div","","actions");
    box.append(...sceneButtons);
    content.append(box);
  }
  const available=story.byRoom.get(w.room).filter(e=>story.canSide(run,e));
  const freshEvents=available.filter(e=>!story.has(run,e.id) ||
    (CASTLE_DATA.escape.can_rehearse_both.includes(e.id) && e.branches?.some(b=>!story.has(run,b.id))));
  const buttons=e=> {
    const detail=story.cast.get(e.person)?.name;
    if (!detail || !e.branches) return [action(e.title,()=>inspectSide(e),{detail})];
    const choices=e.branches.filter(b=>!story.has(run,e.id) || story.has(run,b.id) || CASTLE_DATA.escape.can_rehearse_both.includes(e.id));
    return choices.map(b=>action(e.title,()=>inspectSide(e,b),{detail:detail+" ／ "+b.choice}));
  };
  appendSection("人物と仕掛け",freshEvents.flatMap(buttons));
  const known=available.filter(e=>!freshEvents.includes(e));
  const oldConversations=Object.keys(mainTalk).filter(canRevisitMainTalk).map(id=>action(puzzles[id][0],()=>inspectMainTalk(id)));
  appendSection("調べた記録",[...oldConversations,...known.flatMap(buttons)]);
  if (!sceneButtons.length && !available.length) {
    paragraphs(content,["ここで調べられるものはもうない。別の部屋へ移るか、手帳を見返そう。"]);
  }
  if (w.main.includes("M02")) {
    const tip=action("次の手掛かりを見る",showHint,{className:"subtle"});
    appendSection("探索",[view?.available() ? action("出口を見る",()=>openDesk("walk")) :
      action("隣の部屋へ",()=>openDesk("walk")),tip]);
  }
}
function enterRoom(id) {
  if (modal.open || boundaryAttempt) return false;
  const from=run.world.room;
  if (story.move(run,id)) {
    tone([193]);
    setDeskOpen(false);
    refresh("scene",{from});
    content.scrollTop=0;
    save();
    return true;
  }
  if (!run.failure) return false;
  save();
  presentFailure();
  return true;
}
function renderWalk() {
  const from=run.world.room;
  const physical = view?.available();
  content.append(element("h2",physical ? "出口" : "隣の部屋"));
  const options=story.neighbors.get(from).filter(x=>story.canMove(run.world,x));
  if (physical && options.length) paragraphs(content,["左下のスティックで、行き先札のある廊下を奥まで歩こう。"]);
  appendSection("行ける場所",options.map(id=> {
    const room=story.rooms.get(id);
    const detail=zones[id[0]]+"・"+(run.visited.includes(id)?"訪問済み":"未訪問");
    return physical ? record(room.name,detail) : action(room.name,()=>enterRoom(id),{detail});
  }));
  if (!options.length) paragraphs(content,[run.world.escaped ? "ここはもう、城の敷地の外だ。" : "謁見が終わるまで、この間からは出られない。まずは国王の言葉に耳を傾けよう。"]);
  if (story.has(run,"M03")) {
    const visited=run.visited.filter(id=>id!=="Q05" || run.world.escaped).map(id=>story.rooms.get(id).name);
    content.append(element("h3","手帳の地図"));
    paragraphs(content,[visited.join(" ／ ")]);
  }
}
function record(title, body) {
  const n=element("div","","record");
  n.append(element("strong",title));
  paragraphs(n,[body]);
  return n;
}
function renderNotes() {
  content.append(element("h2","探索の手帳"));
  const seen=[...new Set([...run.memory,...run.world.side])];
  paragraphs(content,[`記録 ${seen.length}／300場面　やり直し ${run.fails}回`]);
  const grid=element("div","","cards");
  for(const id of [...run.world.main].reverse()) {
    const m=story.main.get(id);
    grid.append(record(puzzles[id][0],m.effect));
  }
  for(const id of seen.reverse()) {
    const s=story.side.get(id);
    const detail=s.branches?.filter(b=>story.has(run,b.id)).map(b=>b.effect).join("／");
    grid.append(record(s.title,detail||s.effect));
  }
  content.append(grid);
  if (run.world.main.length===0 && !seen.length) paragraphs(content,["見つけた手掛かりや、やり直す前に得た知識はここに書き残される。"]);
  if (story.collarOff(run.world) && run.beforeRemoval && !run.world.escaped) {
    appendSection("脱出の準備に戻る",[action("首輪を外す前の記録へ戻る",() => {
      openDialog("手帳","首輪を外す直前に戻る",["首輪を着けた状態に戻り、城内の調査をやり直せます。"],[
        action("直前に戻る",()=>{ if (story.rewind(run,true)) { closeDialog(); refresh("scene",{reset:true}); save(); } },{className:"primary"}),
        action("取り消す",closeDialog)
      ]);
    })]);
  }
}
function renderItems() {
  content.append(element("h2","持ち物"));
  const items=CASTLE_DATA.items.filter(i=>run.world.main.includes(i.found));
  const extra=run.world.side.map(id=>story.side.get(id)).filter(x=>x.kind==="宝箱");
  const box=element("div","","cards");
  if (story.collarOff(run.world)) box.append(record("外した首輪","白鍵と一緒にしまってある。もはや言葉を訳す力は宿っていない。"));
  for(const item of items) {
    const remaining=item.uses.filter(id=>!run.world.main.includes(id)).map(id=>story.rooms.get(story.main.get(id).room).name);
    const body=item.id==="I11" && story.has(run,"M19") ? "冠のない像の背に置いた。" : itemNotes[item.id];
    const destinations=remaining.length ? ` 使える場所：${[...new Set(remaining)].join("、")}` : "";
    box.append(record(item.name,body+destinations));
  }
  for(const e of extra) box.append(record(e.title,e.effect));
  if (!box.children.length) paragraphs(content,["まだ何も持っていない。"]);
  content.append(box);
}
function showHint() {
  const unfinished=[...story.main.values()].filter(m=>!story.has(run,m.id) && m.requires.every(r=>story.has(run,r)));
  const candidates = unfinished.map(m=>({m,path:story.routeTo(run,m.room)})).filter(e=>e.path.length);
  candidates.sort((a,b)=>a.path.length-b.path.length);
  const next=candidates[0];
  if (!next) return;
  const way=next.path.map(x=>story.rooms.get(x).name).join(" → ");
  openDialog("手帳の手掛かり",puzzles[next.m.id][0],[way,puzzles[next.m.id][2]],[
    action("閉じる",closeDialog)
  ]);
}
$("dialog-close").addEventListener("click",closeDialog);
dialogNext.addEventListener("click",advanceDialogue);
modal.addEventListener("cancel",event=>{ event.preventDefault(); if (modal.dataset.locked!=="true") closeDialog(); });
for (const tab of tabs) tab.addEventListener("click",() => {
  if (deskOpen() && tab.dataset.tab === selectedTab) setDeskOpen(false,true);
  else openDesk(tab.dataset.tab);
});
$("desk-close").addEventListener("click",()=>setDeskOpen(false,true));
$("audience-call").addEventListener("click",()=>{ if (audienceMission) inspectMainTalk(audienceMission); });
compactLayout.addEventListener("change",()=>setDeskOpen(false));
window.addEventListener("keydown",event=>{
  if (event.key === "Escape" && deskOpen() && !modal.open) setDeskOpen(false,true);
});
$("audio").addEventListener("click",() => { audioEnabled=!audioEnabled; if(audioEnabled) tone([523]); updateStatus(); save(); });
$("help").addEventListener("click",() => {
  openDialog("遊び方","首輪を外し、城の外へ",[
    "異世界から城へ召喚され、言葉を訳す首輪を着けられたあなた。翌日の同じ鐘が鳴る前に首輪を外し、誰にも見つからず城の外へ脱出しよう。",
    view?.available() ? "謁見が終わると、左下のスティックで歩けるようになる。画面を指でなぞれば視点も動く。隣の部屋へ移るには、行き先札のある廊下を奥まで進もう。「調べる」から会話や調査を行える。" :
      "「調べる」から会話や調査を行える。「移動」で隣の部屋へ進もう。",
    "会話では四つの行動から選ぶ。同じ相手の前で同じ行動を繰り返すと怪しまれるので注意。やり直しても知ったことは手帳に残り、道具の使い方は「持ち物」でいつでも確認できる。"
  ],[action("ゲームに戻る",closeDialog,{className:"primary"}),action("はじめから",confirmReset)],{mode:"panel"});
});

try {
  view=createCastleView($("castle-canvas"),stage,{
    initialPosition, savePosition, move:enterRoom, isBlocked:()=>modal.open || deskOpen(),
    modeChanged:()=>refresh(),
    exposed:()=> {
      const event=story.side.get("E280");
      if (run.world.main.includes(CASTLE_DATA.escape.unseen_crossing) || !story.canSide(run,event)) return false;
      seeOutcome(event,null);
      return true;
    },
    escape:()=> {
      const {finish,boundary_event:proof}=CASTLE_DATA.escape;
      if (run.world.seen || !story.canMain(run,finish)) return false;
      postMain(finish,proof);
      return run.world.escaped;
    }
  });
}
catch (error) { stage.classList.add("unavailable"); }
refresh();
if (run.failure) presentFailure();
