const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createStory } = require("./model.js");
const { characterReplies, mainTalk, fatalSceneReply, rizeTalk, talkChoices } = require("./dialogue.js");
const { characterDeaths, sceneReplyDeaths, repeatedReplyDeaths } = require("./dialogue-deaths.js");
const { puzzles, itemNotes } = require("./puzzles.js");
const folder = path.join(__dirname, "../docs/scenario/data");
const read = file => JSON.parse(fs.readFileSync(path.join(folder,file),"utf8"));
const data = Object.fromEntries(["main","rooms","people","items","escape"].map(k=>[k,read(k+".json")]));
data.threads = fs.readdirSync(path.join(folder,"threads")).sort().map(f=>read("threads/"+f));
const story=createStory(data);
const escape=data.escape;
const stage = token => {
  const id=token.split(".")[0];
  if (story.main.has(id)) return id==="M01" ? 0 : id<escape.collar_removed ? 1 : 2;
  const phase=story.side.get(id).phase;
  return phase==="謁見の一声目" ? 0 : phase==="謁見後、解除前" ? 1 : 2;
};
function compatible(plan) {
  const selected={};
  for(const token of plan) {
    const [id,suffix]=token.split(".");
    if (!suffix || escape.can_rehearse_both.includes(id)) continue;
    if (selected[id] && suffix!==selected[id]) return false;
    selected[id]=suffix;
  }
  return true;
}
const plans=new Map();
function recipes(token) {
  if (plans.has(token)) return plans.get(token);
  const [id,branch]=token.split(".");
  const m=story.main.get(id);
  const e=story.side.get(id);
  const defaults=e?.branches ? e.branches.map(b=>b.id) : [id];
  const variants= m ? [[...m.requires]] : e.when.length ? e.when : [[]];
  const pre=e ? (stage(id)===2 ? ["M17"] : stage(id)===1 ? ["M02"] : []) : [];
  const outcomes=[];
  for(const requirements of variants) {
    let sequences=[[]];
    for(const required of [...pre,...requirements]) {
      sequences=sequences.flatMap(seq=>recipes(required).map(other=>[...seq,...other])).filter(compatible);
    }
    for(const value of branch ? [token] : defaults) {
      outcomes.push(...sequences.map(seq=>[...new Set([...seq,value])]).filter(compatible));
    }
  }
  plans.set(token,outcomes);
  return outcomes;
}
function walk(run,to) {
  const route=story.routeTo(run,to);
  assert.ok(route.length,"no route from "+run.world.room+" to "+to);
  for(const next of route.slice(1)) assert.equal(story.move(run,next),true);
}
function proof(id) {
  if (id==="M10") return "cloak";
  if (id==="M18") return "white-lily";
  if (id==="M20") return escape.boundary_event;
  return null;
}
function act(run,token) {
  const [id,direction]=token.split(".");
  if (story.has(run,token)) return;
  const info=story.main.get(id)||story.side.get(id);
  walk(run,info.room);
  if (story.main.has(id)) assert.equal(story.completeMain(run,id,proof(id)),true,id);
  else {
    const result=story.playSide(run,id,direction ? token : null);
    if (run.failure) assert.ok(story.rewind(run),id);
    else assert.equal(result,true,id);
  }
  assert.ok(story.has(run,token),token);
}
function enact(run,tokens) {
  const ordered=tokens.slice().sort((a,b)=>stage(a)-stage(b));
  for(const token of ordered) act(run,token);
}
function reachable(token) {
  const recipe=recipes(token)[0];
  assert.ok(recipe,"no condition set for "+token);
  enact(story.fresh(),recipe);
}
for(const [id,e] of story.side) {
  if (e.branches) for(const branch of e.branches) reachable(branch.id);
  else reachable(id);
}
function verifyTalk(key, correct, replies, fatal, allFatal = false) {
  const options=talkChoices(key,correct,replies,fatal,allFatal);
  assert.equal(options.length,4,key);
  assert.equal(new Set(options.map(option=>option.key)).size,4,key);
  assert.equal(new Set(options.map(option=>option.label.replace(/[。\s]/g,""))).size,4,key);
  assert.equal(options.filter(option=>option.outcome==="correct").length,1,key);
  assert.equal(options.filter(option=>option.outcome==="death").length,allFatal ? 3 : 2,key);
  assert.equal(options.filter(option=>option.outcome==="neutral").length,allFatal ? 0 : 1,key);
}
assert.deepEqual(Object.keys(characterReplies),data.people.map(person=>person.id));
assert.deepEqual(Object.keys(characterDeaths),Object.keys(characterReplies));
assert.deepEqual(Object.keys(repeatedReplyDeaths),Object.keys(characterReplies));
const deathTexts = Object.values(characterDeaths).flat().concat(Object.values(sceneReplyDeaths));
assert.equal(new Set(deathTexts.map(([,body])=>body)).size,deathTexts.length,"Separate fatal responses have distinct text");
assert.equal(new Set(Object.values(repeatedReplyDeaths)).size,36);
for (const [id,replies] of Object.entries(characterDeaths)) assert.equal(replies.length,2,id);
for (const [id,[person,...replies]] of Object.entries(mainTalk)) {
  for (const choice of talkChoices(id,puzzles[id][3],replies,null,id==="M01")) {
    if (choice.outcome === "death") assert.ok(sceneReplyDeaths[choice.key],choice.key);
  }
}
for (const key of ["C01.sword.danger1","C01.sword.danger2"]) assert.ok(sceneReplyDeaths[key],key);
assert.deepEqual(Object.keys(puzzles),data.main.map(scene=>scene.id));
assert.deepEqual(Object.keys(itemNotes),data.items.map(item=>item.id));
const speaking=new Set(["P02","P16"]);
verifyTalk("P02",rizeTalk.correct,characterReplies.P02);
let talks=2; // 王女と玉座の間の抜刀。後者はブラウザー側で確認。
for (const [id,[person,...replies]] of Object.entries(mainTalk)) {
  assert.ok(story.main.has(id) && story.cast.has(person),id);
  verifyTalk(id,puzzles[id][3],replies,null,id==="M01");
  speaking.add(person);
  talks++;
}
for (const e of story.side.values()) {
  if (!e.person) continue;
  const fatal = ["死因","発見","期限切れ"].includes(e.kind);
  const safe = fatalSceneReply[e.id];
  assert.equal(Boolean(safe),fatal,e.id);
  for (const branch of e.branches || [null]) {
    verifyTalk(branch?.id || e.id,safe?.[0] || branch?.choice || e.action,characterReplies[e.person],
      safe ? [e.action,characterReplies[e.person][0]] : null);
    talks++;
  }
  speaking.add(e.person);
}
assert.equal(speaking.size,36);

const oldSave=story.fresh();
delete oldSave.warnings;
assert.ok(story.validSave(oldSave));
assert.ok(story.choose(oldSave,"M01.danger1","国王"));
story.playSide(oldSave,"E002");
assert.ok(story.rewind(oldSave));
const restored=JSON.parse(JSON.stringify(oldSave));
assert.ok(story.validSave(restored));
assert.equal(story.choose(restored,"M01.danger1","国王"),false);
assert.match(restored.failure.body,/しつこい/);
assert.equal(story.choose(restored,"M01.correct","国王"),false);
assert.ok(story.rewind(restored));
assert.ok(story.choose(restored,"M01.correct","国王"));
assert.ok(story.completeMain(restored,"M01"));
assert.ok(story.choose(restored,"M02.neutral","国王"));
assert.deepEqual(restored.world.main,["M01"]);
assert.equal(story.choose(restored,"M02.neutral","国王"),false);
assert.ok(story.rewind(restored));
assert.ok(story.choose(restored,"M02.neutral","国王"));
assert.ok(story.completeMain(restored,"M02"));
const run=story.fresh();
assert.equal(story.completeMain(run,"M20",escape.boundary_event),false);
assert.equal(story.canMove(run.world,"C02"),false);
assert.equal(story.playSide(run,"E002"),false);
assert.ok(run.failure && story.rewind(run));
assert.ok(run.memory.includes("E002"));
assert.equal(run.world.main.length,0);
const shortest=[...story.main.keys()];
enact(run,shortest.slice(0,16));
walk(run,"S04");
act(run,"E151");
act(run,"E152.A");
assert.ok(!run.world.escaped);
assert.equal(story.canMove(run.world,"Q05"),false);
act(run,"M17");
assert.ok(story.collarOff(run.world));
assert.equal(story.canMove(run.world,"W04"),false);
walk(run,"Q02");
assert.ok(story.choose(run,"M18.wrong0"));
assert.equal(story.choose(run,"M18.wrong0"),false);
assert.ok(run.world.seen && !story.completeMain(run,"M18",proof("M18")));
assert.ok(story.rewind(run) && !run.world.seen);
assert.equal(story.completeMain(run,"M18",null),false);
assert.equal(story.playSide(run,"E278"),false);
assert.ok(run.failure && run.world.seen);
assert.equal(story.completeMain(run,"M18",proof("M18")),false);
assert.ok(story.rewind(run));
assert.ok(!run.world.seen && run.memory.includes("E278"));
act(run,"M18");
act(run,"M19");
walk(run,"Q05");
assert.ok(!run.world.escaped);
assert.equal(story.completeMain(run,"M20","逆方向の横断"),false);
act(run,"M20");
assert.ok(run.world.escaped);
assert.equal(run.world.main.length,20);
assert.ok(story.validSave(JSON.parse(JSON.stringify(run))));
console.log("全300場面・84選択値を独立した周回で確認。20行程・南門・目撃・死に戻り・境界を検証。");
console.log("36人・"+talks+"件の会話と、選択の反復・旧セーブとの互換性を確認。");
