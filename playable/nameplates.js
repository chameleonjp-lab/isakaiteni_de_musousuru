"use strict";

function createCastleNameplate(character, name) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = '600 13px "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", sans-serif';
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(name).width) + 16;
  const height = 22;
  canvas.width = width * 2;
  canvas.height = height * 2;
  ctx.scale(2,2);
  ctx.fillStyle = "#141b20ef";
  ctx.strokeStyle = "#e8c484";
  ctx.beginPath();
  ctx.roundRect(.5,.5,width - 1,height - 1,4);
  ctx.fill();
  ctx.stroke();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff6e5";
  ctx.fillText(name,width / 2,height / 2 + .5);

  const map = new THREE.CanvasTexture(canvas);
  map.encoding = THREE.sRGBEncoding;
  const material = new THREE.SpriteMaterial({
    map, transparent:true, depthWrite:false, sizeAttenuation:false, toneMapped:false, fog:false
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = name;
  sprite.center.set(.5,0);

  const head = character.headPivot;
  const bounds = new THREE.Box3();
  head.updateWorldMatrix(true,true);
  const inverse = head.matrixWorld.clone().invert();
  head.traverseVisible(node => {
    if (!node.isMesh) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    const relative = new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld);
    bounds.union(node.geometry.boundingBox.clone().applyMatrix4(relative));
  });
  sprite.position.set(0,bounds.max.y + .11,(bounds.min.z + bounds.max.z) * .5);
  head.add(sprite);

  const point = new THREE.Vector3();
  return {
    resize(unitsPerPixel) {
      sprite.scale.set(width * unitsPerPixel,height * unitsPerPixel,1);
    },
    update(camera, viewportWidth) {
      sprite.getWorldPosition(point).project(camera);
      sprite.visible = Math.abs(point.x) <= 1 && Math.abs(point.z) <= 1;
      if (!sprite.visible) return;
      const anchorX = (point.x + 1) * viewportWidth / 2;
      const left = THREE.MathUtils.clamp(anchorX - width / 2,4,Math.max(4,viewportWidth - width - 4));
      sprite.center.x = (anchorX - left) / width;
    }
  };
}

function createCastleRoomNameplates(story, residents, controller) {
  const inspect = controller?._inspect;
  const actors = Object.entries(inspect?.actors ?? {});
  if (inspect?.hero && !inspect.actors?.hero) actors.push(["hero",inspect.hero]);
  if (inspect?.westGuard) actors.push(["westGuard",inspect.westGuard]);
  return [
    ...residents.map(({model}) => createCastleNameplate(model,story.cast.get(model.id).name)),
    ...actors.map(([role,{charObj}]) => {
      const name = role === "hero" ? "主人公" :
        role === "westGuard" ? "西番" :
        role === "guardR" && controller.id === "C01" ? "衛兵" :
        story.cast.get(charObj.id).name;
      return createCastleNameplate(charObj,name);
    })
  ];
}
