"use strict";

function createStory(data) {
  const rooms = new Map(data.rooms.map(room => [room.id, room]));
  const main = new Map(data.main.map(scene => [scene.id, scene]));
  const side = new Map(data.threads.flatMap(thread => thread.events).map(scene => [scene.id, scene]));
  const cast = new Map(data.people.map(person => [person.id, person]));
  const neighbors = new Map([...rooms.keys()].map(room => [room, []]));
  const byRoom = new Map([...rooms.keys()].map(room => [room, []]));
  const gates = new Map(data.escape.gates.map(gate => [gate.rooms.slice().sort().join('-'), gate.opens]));
  for (const room of data.rooms) {
    for (const next of room.neighbors) {
      neighbors.get(room.id).push(next);
      neighbors.get(next).push(room.id);
    }
  }
  for (const event of side.values()) byRoom.get(event.room).push(event);

  const start = data.escape.start_room;
  const removed = data.escape.collar_removed;
  const entrance = data.escape.royal_entrance;
  const finish = data.escape.finish;
  const crossing = data.escape.unseen_crossing;
  function fresh() {
    const world = { room: start, minutes: 0, main: [], side: [], choices: {}, seen: false, escaped: false };
    return { world, memory: [], visited: [start], warnings: [], fails: 0, checkpoint: null, beforeRemoval: null, beforeDeadline: copyWorld(world), failure: null };
  }
  const copyWorld = world => JSON.parse(JSON.stringify(world));
  const pushOnce = (list, id) => { if (!list.includes(id)) list.push(id); };
  const collarOff = world => world.main.includes(removed);
  function has(run, token) {
    const [id, option] = token.split(".");
    if (option) return run.world.choices[id]?.includes(option) || false;
    return run.world.main.includes(id) || run.world.side.includes(id) || run.memory.includes(id);
  }
  function canMove(world, target) {
    if (world.escaped || !neighbors.get(world.room)?.includes(target)) return false;
    if (collarOff(world) && !target.startsWith('Q')) return false;
    const gate = gates.get([target, world.room].sort().join('-'));
    return !gate || world.main.includes(gate);
  }
  function eventPhase(world) {
    if (!world.main.includes("M01")) return "謁見の一声目";
    if (!world.main.includes("M02")) return "謁見の二声目";
    return collarOff(world) ? "解除後、境石を越えるまで" : "謁見後、解除前";
  }
  function canSide(run, event) {
    return !run.failure && !run.world.escaped && run.world.room === event.room
      && event.phase === eventPhase(run.world)
      && (!event.when.length || event.when.some(group => group.every(flag => has(run, flag))));
  }
  function canMain(run, id) {
    const event = main.get(id);
    return !!event && !run.failure && !run.world.escaped && run.world.room === event.room
      && !has(run, id) && event.requires.every(flag => has(run, flag))
      && (!collarOff(run.world) || event.room.startsWith("Q"));
  }
  function fail(run, event, heading, body, world = run.world, witnessed = false) {
    if (run.failure || run.world.escaped) return false;
    run.checkpoint = copyWorld(world);
    if (event?.kind === "発見" || witnessed) run.world.seen = true;
    if (event) pushOnce(run.memory, event.id);
    run.failure = { heading, body, event: event?.id || null };
    run.fails += 1;
    return false;
  }
  function choose(run, key, person) {
    if (run.failure || run.world.escaped) return false;
    if (!Array.isArray(run.warnings)) run.warnings = [];
    const used = run.warnings.indexOf(key);
    if (used < 0) {
      run.warnings.push(key);
      return true;
    }
    run.warnings.splice(used,1);
    const reason = person ? `${person}は「しつこい。何か探っているな」と声を上げた。` :
      "同じ場所で繰り返される物音を不審に思い、見回りの兵が立ち止まった。";
    return fail(run,null,"同じ行動を怪しまれた",reason+"駆けつけた衛兵に処刑された。",run.world,collarOff(run.world));
  }
  function advanceClock(run, minutes) {
    if (collarOff(run.world)) return true;
    if (run.world.minutes + minutes >= data.escape.minutes_until_obedience) {
      const end = side.get("E067");
      return fail(run, end, end.title, end.scene, run.beforeDeadline);
    }
    run.world.minutes += minutes;
    return true;
  }
  function rememberDeadline(run) {
    if (!collarOff(run.world) && run.world.minutes < data.escape.minutes_until_obedience-90) {
      run.beforeDeadline = copyWorld(run.world);
    }
  }
  function move(run, next) {
    if (run.failure || !canMove(run.world, next)) return false;
    if (!advanceClock(run, data.escape.minutes_per_room_change)) return false;
    run.world.room = next;
    pushOnce(run.visited, next);
    rememberDeadline(run);
    return true;
  }
  function completeMain(run, id, proof) {
    if (!canMain(run, id)) return false;
    const w = run.world;
    if (id === "M10" && proof !== "cloak") return false;
    if (id === crossing && (proof !== "white-lily" || w.seen || !collarOff(w))) return false;
    if (id === finish && (proof !== data.escape.boundary_event || !collarOff(w)
      || !w.main.includes(crossing) || !w.main.includes(entrance) || w.seen)) return false;
    const cost = data.escape.minutes_per_new_action
      + (id === "M16" ? data.escape.max_wait_for_patrol : 0);
    if (!advanceClock(run, cost)) return false;
    if (id === removed) {
      run.beforeRemoval = copyWorld(w);
      run.beforeRemoval.minutes -= cost;
    }
    w.main.push(id);
    if (id === finish) w.escaped = true;
    rememberDeadline(run);
    return true;
  }
  function playSide(run, id, selected = null) {
    const event = side.get(id);
    if (!event || !canSide(run, event)) return false;
    const option = event.branches?.find(k => k.id === selected);
    if (event.branches && !option) return false;
    if (["死因","発見","期限切れ"].includes(event.kind)) {
      return fail(run,event,event.title,event.scene,event.kind==="期限切れ" ? run.beforeDeadline : run.world);
    }
    const repeatable = data.escape.can_rehearse_both.includes(id);
    if (has(run, id) && (!repeatable || !option || has(run, selected))) return false;
    if (!advanceClock(run, data.escape.minutes_per_new_action)) return false;
    if (event.record === "手帳の記憶") pushOnce(run.memory, id);
    else pushOnce(run.world.side, id);
    if (option) {
      const choice = option.id.split(".")[1];
      run.world.choices[id] = repeatable ? [...(run.world.choices[id] || []), choice] : [choice];
    }
    rememberDeadline(run);
    return true;
  }
  function rewind(run, beforeRemoval = false) {
    const target = beforeRemoval ? run.beforeRemoval : run.checkpoint;
    if (!target || (!beforeRemoval && !run.failure) || run.world.escaped) return false;
    run.world = copyWorld(target);
    run.checkpoint = null;
    run.failure = null;
    return true;
  }
  function routeTo(run, target) {
    const src = run.world.room;
    const queue = [[src]];
    const seen = new Set([src]);
    for (const path of queue) {
      const here = path.at(-1);
      if (here === target) return path;
      for (const next of neighbors.get(here) || []) {
        if (seen.has(next) || !canMove({ ...run.world, room: here }, next)) continue;
        seen.add(next);
        queue.push([...path, next]);
      }
    }
    return [];
  }
  function validSave(run) {
    if (!run?.world || !run.beforeDeadline || !Array.isArray(run.memory) || !Array.isArray(run.visited)) return false;
    const { world } = run;
    return rooms.has(world.room) && Array.isArray(world.main) && world.main.every(flag => main.has(flag))
      && Array.isArray(world.side) && world.side.every(flag => side.has(flag))
      && run.memory.every(flag => side.has(flag)) && run.visited.every(room => rooms.has(room))
      && !!world.choices && Number.isFinite(world.minutes) && Number.isFinite(run.fails)
      && (!world.escaped || (world.main.includes(finish) && collarOff(world) && !world.seen));
  }
  return { fresh, rooms, main, side, cast, neighbors, byRoom, has, canMove, canSide, canMain,
    move, completeMain, playSide, rewind, fail, choose, routeTo, collarOff, validSave };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createStory };
