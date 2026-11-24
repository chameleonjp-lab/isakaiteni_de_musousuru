"use strict";

// Home rooms come from the scenario. These anchors put the extra cast next
// to their workplaces and out of the doorways and main walking lanes.
const residentAnchors = {
  P03: { x:-3.2, z:1.1, yaw:1.25 },             // 拝謁前室、舞台幕の脇
  P04: { x:2.0, z:1.8, yaw:-1.1 },             // 紋章廊、浮き彫り沿い
  P05: { x:-1.8, z:-1.2, yaw:.4, pose:"play_lute" }, // 楽師桟敷、譜面台の間
  P06: { x:-2.2, z:.45, yaw:.6 },              // 客人談話室、談話卓のそば
  P08: { x:-1.0, z:-1.9, yaw:-1.5 },           // 写字室、机の右手
  P10: { x:2.5, z:-1, yaw:-1.4 },              // 製本台の脇
  P12: { x:1.9, z:.2, yaw:-.6 },               // 衣装繕い室、裁縫台の手前
  P14: { x:1.45, z:-3.25, yaw:.6 },            // 舞台倉、衣装箱沿い
  P15: { x:1.45, y:.88, z:-4, yaw:.05 },       // 小劇場、舞台上
  P20: { x:-2.5, z:.1, yaw:.8 },               // 薬草乾燥室、作業卓の脇
  P21: { x:-2.5, z:-.65, yaw:1.2 },            // 星暦盤の左手
  P22: { x:3, z:.7, yaw:-.55 },                // 鐘鋳場、作業卓の手前
  P25: { x:1.3, z:-.5, yaw:-1.25 },            // 城内の馬車待ち場、馬車の脇
  P26: { x:-3.55, z:-.5, yaw:.95 },            // 宴会厨房、調理台の脇
  P27: { x:3, z:.72, yaw:-.65 },               // パン窯室、作業卓の手前
  P28: { x:3.6, z:1.1, yaw:-1 },               // 食器棚室、棚と卓の間
  P29: { x:2.5, z:-1.9, yaw:-.95 },            // 庭師小屋、作業卓の脇
  P30: { x:-5.6, z:2.7, yaw:1.15 },            // 舟遊び池、桟橋寄りの岸
  P31: { x:1.2, z:-.45, yaw:-.75 },            // 貯氷室、氷塊の手前
  P32: { x:2.65, z:-1.3, yaw:-1.25 },          // からくり工房、作業台の脇
  P33: { x:3.15, z:1.55, yaw:-.75 },           // 古い給茶室、茶卓の外側
  P34: { x:2.2, z:.65, yaw:-1.25 },            // 帳票庫、記録卓の脇
  P35: { x:-1.9, z:1.7, yaw:.55 },             // 果樹回廊、小道の脇
  P36: { x:-3.65, z:.4, yaw:1.1 }              // 療養温室、回転棚の外側
};

function placeCastleResidents(area, controller) {
  const models = window.CastleEscapeModels;
  const staged = new Set(Object.values(controller?._inspect?.actors || {}).map(actor => actor.charObj.id));
  return CASTLE_DATA.people.flatMap((person, index) => {
    if (person.room !== area.id || staged.has(person.id)) return [];
    const anchor = residentAnchors[person.id];
    if (!anchor) return [];
    const model = models.createCharacter(person.id, {});
    const root = new THREE.Group();
    root.name = person.id;
    root.position.set(anchor.x, anchor.y ?? 0, anchor.z);
    root.rotation.y = anchor.yaw;
    root.userData.walkObstacle = "actor";
    root.add(model.group);
    area.group.add(root);
    const update = time => models.applyPose(model, anchor.pose || "idle", time + index * .7);
    update(0);
    return [{ model, root, update }];
  });
}
