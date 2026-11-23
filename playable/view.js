"use strict";

const themes = {
  C: [0x938679, 0x782a37, 0xffc590], W: [0x776e62, 0x456e69, 0xffcc98],
  E: [0x7e7063, 0x7a4a38, 0xffc486], N: [0x7e8490, 0x455d86, 0xb8d8ff],
  S: [0x8d755f, 0x7a583b, 0xffa966], G: [0x536550, 0x9dba7b, 0xe1e8ab],
  B: [0x625d61, 0x6f576a, 0xffb181], Q: [0x919f9a, 0x446866, 0xc7e5d5]
};
const shader = n => new THREE.MeshStandardMaterial({ color: n, roughness: .76 });

function startCastleView({ renderer, camera, scene, hero, king, princess, torchFlames, createStoneTexture, canvas, frame }) {
  const roomScene = new THREE.Scene();
  const decoration = new THREE.Group();
  const shadow = new THREE.HemisphereLight(0xffecd4, 0x3b4246, 1.7);
  const daylight = new THREE.DirectionalLight(0xfbf0d6, 1.6);
  daylight.position.set(-4, 7, 5);
  roomScene.add(decoration, shadow, daylight);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const pole = new THREE.CylinderGeometry(.5, .5, 1, 10);
  const orb = new THREE.SphereGeometry(.5, 14, 10);
  const taper = new THREE.ConeGeometry(.5, 1, 11);
  const round = new THREE.TorusGeometry(.48, .065, 8, 24);
  const brass = shader(0xb99552);
  const wood = shader(0x3e2e24);
  const white = shader(0xe0d9b6);
  const colored = new Map();
  const prop = new THREE.Group();
  const stoneTexture = createStoneTexture("#aca9a1", "#7e7771", 9, 5);
  const flame = new THREE.MeshBasicMaterial({ color: 0xffb967 });
  const lumen = new THREE.MeshBasicMaterial({ color: 0xffe7a6 });
  const materials = new Map();
  let current = "";
  let mark = "";
  let yaw = 0;
  let stamp = 0;
  let angle = 0;
  let origin = 0;
  let pointer = null;
  let state;
  let contextLost = false;
  const move = (shape, material, X, Y, Z, width, height, depth, parent = decoration) => {
    const part = new THREE.Mesh(shape, material);
    part.position.set(X, Y, Z);
    part.scale.set(width, height, depth);
    parent.add(part);
    return part;
  };
  const solid = (m,x,y,z,w,h,d,p) => move(box,m,x,y,z,w,h,d,p);
  function color(hex) {
    if (!colored.has(hex)) colored.set(hex, shader(hex));
    return colored.get(hex);
  }
  function arch(x, z, wall, trim, turn = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = turn;
    decoration.add(group);
    for (const sign of [-1, 1]) solid(trim, sign * 1.09, 1.63, .12, .29, 3.26, .55, group);
    for (let index = 0; index < 9; index++) {
      const a = index * Math.PI / 8;
      solid(trim, Math.cos(a)*1.09, 3.25+Math.sin(a)*1.04, .1, .36, .37, .55, group).rotation.z = a;
    }
    solid(wall, 0, 1.55, -.13, 1.89, 3.1, .25, group);
    solid(wood, 0, 1.51, .05, 1.9, 3.02, .2, group);
    for (let i=-2; i<=2; i++) solid(trim, i*.34, 1.49, .17, .022, 2.9, .015, group);
    solid(brass, .63, 1.41, .25, .16, .11, .11, group);
  }
  function shelves(mat, shade, seed) {
    for (let row=0; row<3; row++) {
      const y = .28 + row*.62;
      solid(wood,0,y,0,2.7,.11,.66,prop);
      for (let i=0;i<9;i++) {
        const h = .29+((seed+i*13+row*7)%7)*.033;
        solid(i%3===0 ? shade : mat,-1.05+i*.26,y+.08+h/2,.03,.16,h,.43,prop);
      }
    }
  }
  function displayProp(id, main, floor, seed) {
    const table = () => {
      solid(wood,0,.74,0,2.54,.16,1.18,prop);
      for (const x of [-1,1]) for (const z of [-.43,.43]) solid(wood,x,.38,z,.19,.76,.19,prop);
    };
    const sphere = (m,x,y,z,w,h,d) => move(orb,m,x,y,z,w,h,d,prop);
    if (id === "G01") {
      move(pole,floor,0,.14,0,1.9,.28,1.9,prop);
      sphere(brass,0,1.31,0,.63,.54,1.2);
      move(pole,brass,.19,.7,.1,.10,1.19,.10,prop);
      move(pole,brass,-.22,.75,.1,.10,1.12,.10,prop).rotation.z=-.16;
      move(pole,brass,0,1.76,.42,.19,.81,.19,prop).rotation.x=.31;
      sphere(brass,0,2.16,.59,.30,.30,.30);
      move(taper,brass,0,2.15,.86,.20,.50,.20,prop).rotation.x=Math.PI/2;
      solid(white,-.24,.72,.23,.19,.14,.045,prop);
      return;
    }
    if (id === "N03" || id === "N06" || id === "G04") {
      move(pole,wood,0,.62,0,.49,1.25,.49,prop);
      for (let i=0;i<3;i++) {
        const disc=move(round,i===1 ? main : brass,0,1.67,0,2.15-i*.44,2.15-i*.44,2.15-i*.44,prop);
        disc.rotation.set(i*.98,.15+i*.8,.22);
      }
      sphere(lumen,0,1.66,0,.24,.24,.24);
      return;
    }
    if (id === "Q03") {
      for (const x of [-1.43,0,1.43]) {
        solid(floor,x,.23,0,.86,.46,.77,prop);
        move(taper,floor,x,1.11,0,.73,1.32,.59,prop);
        sphere(white,x,1.89,0,.43,.47,.43);
        if (x) move(taper,brass,x,2.2,0,.47,.35,.47,prop);
      }
      return;
    }
    if (id === "W03" || id === "W08") {
      solid(wood,0,1.48,0,1.51,1.83,.14,prop);
      solid(brass,0,1.48,.10,1.36,1.68,.19,prop);
      solid(main,0,1.48,.22,1.20,1.52,.08,prop);
      sphere(white,0,1.80,.33,.43,.6,.19);
      move(taper,wood,0,1.22,.35,.85,.7,.16,prop);
      solid(wood,0,.41,.25,1.55,.11,.33,prop);
      return;
    }
    if (id === "E02" || id === "S01" || id === "B06" || id === "B02") {
      solid(wood,0,.51,0,1.72,1.02,1.1,prop);
      solid(main,0,1.05,0,1.85,.20,1.21,prop);
      for (const x of [-.55,.55]) solid(brass,x,.6,.563,.10,.98,.05,prop);
      solid(brass,0,.72,.62,.32,.23,.1,prop);
      sphere(lumen,0,.72,.665,.07,.08,.03);
      return;
    }
    if (id === "W01" || id === "W06" || id === "N02" || id === "E03") {
      shelves(main,white,seed);
      return;
    }
    if (id === "Q01" || id === "Q02" || id === "Q04") {
      for (const x of [-.74,0,.74]) {
        move(pole,brass,x,.55,0,.15,1.1,.15,prop);
        move(pole,white,x,1.14,0,.12,.29,.12,prop);
        move(taper,flame,x,1.35,0,.11,.26,.11,prop);
      }
      if (id === "Q02") {
        for(let i=0;i<7;i++) {
          for(let j=0;j<4;j++) {
            const flower=sphere(white,-2.55+Math.cos(j*Math.PI/2)*.075,.028,2.35-i*1.12+Math.sin(j*Math.PI/2)*.075,.11,.045,.11);
            flower.rotation.y=.4;
          }
        }
      }
      return;
    }
    if (id.startsWith("G") || id === "Q05") {
      for (let i=0;i<9;i++) {
        const x=-4.05+(i%5)*2.02;
        const z=1.5-Math.floor(i/5)*4.7-(i%2)*1.2;
        move(pole,wood,x,.78,z,.17,1.55,.17,prop);
        move(orb,main,x,1.8,z,.93,1.5,.96,prop);
      }
      if (id === "Q05") {
        solid(white,0,.14,-.9,5.8,.28,.51,prop);
        solid(wood,-.03,.30,-.90,1.45,.06,.43,prop);
      } else {
        move(pole,floor,0,.19,0,2.31,.38,2.31,prop);
        move(pole,color(0x547b81),0,.385,0,1.96,.038,1.96,prop);
      }
      return;
    }
    table();
    for(let i=0;i<5;i++) {
      const x=-.87+i*.43;
      const h=.19+((seed+i*9)%6)*.063;
      if (id.startsWith("E") || id === "W02") solid(i%2 ? main : white,x,.84+h/2,-.04,.36,h,.63,prop);
      else {
        move(pole,i%2 ? main : white,x,.84+h/2,-.05,.28,h,.28,prop);
        move(pole,brass,x,.84+h,-.05,.33,.056,.33,prop);
      }
    }
  }
  function rebuild(id) {
    decoration.clear();
    prop.clear();
    prop.position.set(0,0,-2.48);
    decoration.add(prop);
    const [wall,tint,light] = themes[id[0]];
    if (!materials.has(id[0])) materials.set(id[0], new THREE.MeshStandardMaterial({map: stoneTexture,color:wall,roughness:.86}));
    const masonry=materials.get(id[0]);
    const main=color(tint);
    const outside = id[0] === "G" || id === "Q05";
    roomScene.background = new THREE.Color(outside ? 0x405761 : 0x181d20);
    roomScene.fog = new THREE.FogExp2(outside ? 0x405761 : 0x181d20, outside ? .035 : .019);
    daylight.color.setHex(light);
    solid(masonry,0,-.17,-1,11.5,.32,12.8);
    const entryFloor = id === "Q02" ? white : main;
    solid(entryFloor,0,.013,-.6,2.3,.018,9.7);
    if (!outside) {
      solid(masonry,0,3.35,-5.95,11.5,6.7,.55);
      for (const x of [-5.5,5.5]) solid(masonry,x,3.35,-1.0,.55,6.7,10.5);
    }
    arch(0,-5.6,masonry,main);
    if (!outside) { arch(-5.1,-3.1,masonry,main,Math.PI/2); arch(5.1,-3.1,masonry,main,-Math.PI/2); }
    for (const x of [-3.5,3.5]) {
      solid(main,x,3.99,-5.61,.95,2.11,.06);
      solid(brass,x,5.08,-5.54,1.15,.06,.10);
      move(pole,brass,x,2.55,-5.23,.1,.44,.12);
      move(taper,flame,x,2.91,-5.23,.20,.51,.22);
    }
    const furniture = parseInt(id.slice(1),10);
    displayProp(id, main, masonry, furniture);
    if (id === "G01" || id === "Q05") prop.position.z = -2.0;
    if (id === "Q02") prop.position.z = 0;
  }
  function kneel(weight) {
    hero.group.position.set(0,-.31*weight,-.45);
    hero.group.rotation.y = Math.PI;
    hero.upperBody.rotation.x=.35*weight;
    hero.headPivot.rotation.x=.4*weight;
    hero.leftLeg.hip.rotation.x=-1.22*weight;
    hero.leftLeg.knee.rotation.x=1.30*weight;
    hero.rightLeg.hip.rotation.x=.27*weight;
    hero.rightLeg.knee.rotation.x=1.31*weight;
    hero.rightArm.shoulder.rotation.x=-.49*weight;
    hero.leftArm.shoulder.rotation.x=-.27*weight;
  }
  const stage3D = createCastleStage();
  const closeView = frame.querySelector("#stage-close");
  const doorView = frame.querySelector("#stage-door");
  let controller;
  let snapshotKey;
  let cameraMode = "wide";
  const setCameraMode = mode => {
    cameraMode = mode;
    closeView.setAttribute("aria-pressed", String(mode === "closeup"));
    doorView.setAttribute("aria-pressed", String(mode === "doorClose"));
  };
  closeView.addEventListener("click", () => setCameraMode(cameraMode === "closeup" ? "wide" : "closeup"));
  doorView.addEventListener("click", () => setCameraMode(cameraMode === "doorClose" ? "wide" : "doorClose"));

  function setRoom(room, run) {
    state = run;
    const snapshot = castleStageState(story, run);
    const nextKey = JSON.stringify([snapshot, run.failure?.event, !!run.failure, run.fails]);
    if (nextKey !== snapshotKey) {
      controller = stage3D.setRoom(room.id, snapshot);
      snapshotKey = nextKey;
    }
    if (current !== room.id) {
      yaw = 0;
      angle = 0;
      origin = performance.now();
      current = room.id;
      closeView.hidden = !controller;
      doorView.hidden = current !== "Q01";
      setCameraMode("wide");
      if (!controller && current !== "C01") rebuild(current);
      if (current === "Q04" && !run.failure && !run.world.escaped) stage3D.play("passToQ05");
    }
    const mood = run.world.escaped ? "clear" : run.failure ? "failed" : "normal";
    if (mark !== mood) { origin = performance.now(); mark = mood; }
  }
  const size = new ResizeObserver(() => {
    camera.aspect = Math.max(1, frame.clientWidth) / Math.max(1, frame.clientHeight);
    camera.fov = camera.aspect < 1.25 ? 48 : 42;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
    renderer.setSize(frame.clientWidth,frame.clientHeight,false);
    camera.updateProjectionMatrix();
  });
  size.observe(frame);
  canvas.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    pointer = event.pointerId;
    stamp = event.clientX;
    canvas.setPointerCapture(pointer);
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerId !== pointer) return;
    yaw = Math.max(-.45,Math.min(.45,yaw+(event.clientX-stamp)*.0032));
    stamp = event.clientX;
  });
  for (const type of ["pointerup","pointercancel","lostpointercapture"]) canvas.addEventListener(type, () => { pointer = null; });
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault(); contextLost = true; frame.classList.add("unavailable");
    stage3D.cancel();
  });
  canvas.addEventListener("webglcontextrestored", () => { contextLost = false; frame.classList.remove("unavailable"); });

  let last = 0;
  let animation;
  function draw(now) {
    animation = 0;
    if (document.hidden) return;
    animation = requestAnimationFrame(draw);
    if (!state || contextLost || now-last < 33) return;
    const dt = Math.min(0.08, (now-last) / 1000);
    last = now;
    const seconds = now / 1000;
    const progress = Math.max(0,1-(now-origin)/730);
    angle += (yaw-angle)*.2;
    if (controller) {
      const completed = stage3D.update(dt, seconds);
      const preset = controller.getCameraPreset(cameraMode);
      const zoom = cameraMode === "wide" && camera.aspect < 1.25 ? 1.15 : 1;
      placeCastleStageCamera(camera, preset, angle, zoom);
      renderer.render(stage3D.scene, camera);
      completed?.();
      return;
    }
    if (current === "C01") {
      kneel(state.world.main.includes("M02") ? 0 : state.world.main.includes("M01") ? .71 : 1);
      king.rightArm.rotation.x = -.81+Math.sin(seconds*2.25)*.075;
      princess.rotation.z = Math.sin(seconds*.45)*.009;
      for(const fire of torchFlames) fire.mesh.scale.y=.96+Math.sin(seconds*9+fire.phase)*.1;
      camera.position.set(angle*6,2.2,4.32+progress);
      camera.lookAt(angle*.62,2.04,-5.8);
      renderer.render(scene,camera);
    } else {
      const clear=state.world.escaped;
      const roomAngle=clear ? angle*.5 : angle;
      camera.position.set(Math.sin(roomAngle)*7.4,clear ? 2.9 : 2.58,6.2+progress);
      camera.lookAt(roomAngle*1.5,clear ? 1.62 : 1.78,-1.72);
      renderer.render(roomScene,camera);
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(animation); animation=0; }
    else if (!animation) animation=requestAnimationFrame(draw);
  });
  animation = requestAnimationFrame(draw);
  const play = (variant, done) => !contextLost && stage3D.play(variant, done);
  return { setRoom, play };
}
