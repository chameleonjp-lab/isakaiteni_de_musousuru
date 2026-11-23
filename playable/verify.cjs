const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createStory } = require("./model.js");
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
