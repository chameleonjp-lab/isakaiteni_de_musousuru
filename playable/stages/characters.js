/**
 * 王都からの脱出 — 高精細3Dキャラクターモデル＆精密グリップ・役割別モーションライブラリ (Three.js r128+)
 * 収録: P00(主人公) + P01〜P36(全36人物) = 全37体
 *
 * v3 改良点:
 *  - リアルタイム両手中間点トラッキング(syncCarryToHands): 器・皿・本・巻物・盆・パン・リュート等の
 *    両手保持アイテムを、毎フレーム左右の手の実際の3D座標から計算し、必ず手のひら「の上／間」に密着配置。
 *  - 腰・胴体のZファイティング（ギザギザ境界）を完全解消し、立体ベルト・袖口カフス・親指付き手造形を追加。
 *  - 開いた本（見開きページ）・木軸付き巻物・凹みのある釉薬陶器碗・絵具付きパレット＋筆・弦付きリュートへ造形強化。
 */
(function (global) {
  "use strict";

  // =========================================================================
  // 1. 全37キャラクター定義
  // =========================================================================
  const CHARACTER_SPECS = [
    { id: "P00", name: "主人公（異界の客人）", loc: "C01 玉座の間", cat: "royal", role: "hero", gender: "m", age: "young",
      quote: "翻訳の首輪を外し、誰にも見られず境石を越えて城の外へ出る。",
      colors: { main: "#383d47", sub: "#243754", accent: "#e8ecf4", hair: 0x251811, skin: 0xf0c4a2, eye: 0x2c241e },
      hairStyle: "short", prop: "hero_sword", grip: "scabbard", collar: true },

    { id: "P01", name: "国王", loc: "C01 玉座の間", cat: "royal", role: "king", gender: "m", age: "elder",
      quote: "「面を上げよ。……客人よ、面を上げよ。」",
      colors: { main: "#8f1620", sub: "#3b2318", accent: "#e6b647", hair: 0xe8ecf4, skin: 0xe9bc99, eye: 0x3b5878 },
      hairStyle: "elder", prop: "scepter", grip: "staff", crown: "imperial" },

    { id: "P02", name: "王女リゼ", loc: "C01 玉座の間", cat: "royal", role: "princess", gender: "f", age: "young",
      quote: "「あなたが決めて。これだけは、誰の命令にもしたくない。」",
      colors: { main: "#6fb2e6", sub: "#c2e2fc", accent: "#f0c96a", hair: 0xe6c165, skin: 0xf6d3ba, eye: 0x2d78b8 },
      hairStyle: "long", prop: "lily", grip: "gentle", crown: "tiara" },

    { id: "P03", name: "侍従ルオ", loc: "C02 拝謁前室", cat: "central", role: "official", gender: "m", age: "adult",
      quote: "「膝が痛むでしょう。ですが、今はまだ。」",
      colors: { main: "#23324d", sub: "#1a2438", accent: "#d9b362", hair: 0x3a2c22, skin: 0xeec1a0, eye: 0x394a61 },
      hairStyle: "short", prop: "scroll", grip: "read" },

    { id: "P04", name: "礼官ベル", loc: "C03 紋章廊", cat: "central", role: "official", gender: "m", age: "elder",
      quote: "「右を忘れたら、ご自分の胸を見てください。」",
      colors: { main: "#542838", sub: "#2d1a22", accent: "#e6c36e", hair: 0xd0d4dc, skin: 0xebc09e, eye: 0x4b3b42 },
      hairStyle: "elder", prop: "book", grip: "read" },

    { id: "P05", name: "楽師ノノ", loc: "C04 楽師桟敷", cat: "central", role: "musician", gender: "f", age: "young",
      quote: "「一拍あけて。そこに座れる人がいるから。」",
      colors: { main: "#3d6b5e", sub: "#f2e7d5", accent: "#e0b34c", hair: 0x6e442c, skin: 0xf5ceb4, eye: 0x366956 },
      hairStyle: "bob", prop: "lute", grip: "instrument" },

    { id: "P06", name: "旅商ネウ", loc: "C06 客人談話室", cat: "central", role: "merchant", gender: "m", age: "young",
      quote: "「売ったのは噂だよ。間違ってたら……僕の名前で直す。」",
      colors: { main: "#7a4e2d", sub: "#3d2d20", accent: "#d9a944", hair: 0x5c3620, skin: 0xeec09c, eye: 0x6b4826 },
      hairStyle: "short", prop: "satchel", grip: "side" },

    { id: "P07", name: "司書ネリ", loc: "W01 西資料室", cat: "central", role: "scholar", gender: "f", age: "adult",
      quote: "「新しい地図だけ見ると、古い柱が一本余るでしょう。」",
      colors: { main: "#30415c", sub: "#e8e2d5", accent: "#c9a354", hair: 0x2e2320, skin: 0xf4ccb2, eye: 0x344a6b },
      hairStyle: "bun", prop: "book", grip: "read" },

    { id: "P08", name: "写字生ユラ", loc: "W05 写字室", cat: "central", role: "scholar", gender: "f", age: "young",
      quote: "「役職は同じでも、名前の最後は人によって跳ねるんです。」",
      colors: { main: "#4c546e", sub: "#f2efe9", accent: "#b89552", hair: 0x3c2e38, skin: 0xf5d0b8, eye: 0x4b436e },
      hairStyle: "bob", prop: "book", grip: "read" },

    { id: "P09", name: "絵師マレ", loc: "W03 肖像修復室", cat: "central", role: "artist", gender: "m", age: "adult",
      quote: "「触るなら絵の縁から。あの目だけは、王女様がご自分で。」",
      colors: { main: "#633840", sub: "#d9cbb8", accent: "#c89f54", hair: 0x38241a, skin: 0xedc09e, eye: 0x5c3e32 },
      hairStyle: "short", prop: "palette", grip: "paint", hat: "beret" },

    { id: "P10", name: "製本師ダン", loc: "W07 製本台の間", cat: "central", role: "artisan", gender: "m", age: "elder",
      quote: "「もう一枚、紙を挟んでごらん。古い傷の方から答えてくれる。」",
      colors: { main: "#5c4632", sub: "#382a1e", accent: "#c9a96e", hair: 0xc8ccd4, skin: 0xe6b692, eye: 0x4a3b2e },
      hairStyle: "elder", prop: "book", grip: "read" },

    { id: "P11", name: "洗濯係ミナ", loc: "E01 洗濯仕分け場", cat: "east_north", role: "maid", gender: "f", age: "young",
      quote: "「きれいになっても、戻す相手を忘れたら仕事は半分だよ。」",
      colors: { main: "#365678", sub: "#f4f6fa", accent: "#8bb8e0", hair: 0x6b4528, skin: 0xf4ccb0, eye: 0x36648a },
      hairStyle: "bun", prop: "basket", grip: "carry" },

    { id: "P12", name: "針子リリ", loc: "E04 衣装繕い室", cat: "east_north", role: "maid", gender: "f", age: "young",
      quote: "「名前なら消えちゃうからさ。縫い目でお礼を言ってもいい？」",
      colors: { main: "#6b3b5c", sub: "#f7f3eb", accent: "#e8c468", hair: 0x875234, skin: 0xf6d1b8, eye: 0x6b3a5c },
      hairStyle: "bob", prop: "basket", grip: "carry" },

    { id: "P13", name: "鳩番オト", loc: "E03 王家の鳩舎", cat: "east_north", role: "worker", gender: "m", age: "young",
      quote: "「速達？　いや、豆を早くくれって顔だよ、これは。」",
      colors: { main: "#4c6348", sub: "#3a2e22", accent: "#d9c28c", hair: 0x4a3322, skin: 0xeec19e, eye: 0x455c3e },
      hairStyle: "short", prop: "dove", grip: "shoulder" },

    { id: "P14", name: "舞台番トワ", loc: "E06 舞台倉", cat: "east_north", role: "worker", gender: "m", age: "adult",
      quote: "「消える役と、客が見落とす役。うちには両方ある。」",
      colors: { main: "#242730", sub: "#171920", accent: "#c8a452", hair: 0x1e1d22, skin: 0xebc09e, eye: 0x343844 },
      hairStyle: "short", prop: "lantern", grip: "lantern" },

    { id: "P15", name: "役者レン", loc: "E08 小劇場", cat: "east_north", role: "actor", gender: "m", age: "young",
      quote: "「剣を置いたら、僕の名前で呼んでもらえないかな。」",
      colors: { main: "#782834", sub: "#f0e8da", accent: "#e8be56", hair: 0x7d4c2a, skin: 0xf4cab0, eye: 0x4b6b8a },
      hairStyle: "short", prop: "propsword", grip: "sword" },

    { id: "P16", name: "東番キリ", loc: "E07 東詰所", cat: "east_north", role: "knight", gender: "m", age: "adult",
      quote: "「落とし物なら窓へ。線を越えて取りに来なくても届きます。」",
      colors: { main: "#1f3a6d", sub: "#c8d2e0", accent: "#e6b647", hair: 0x2c241e, skin: 0xebc09e, eye: 0x354860 },
      hairStyle: "short", prop: "sword", grip: "sword", armor: "knight" },

    { id: "P17", name: "陶工イオ", loc: "N01 窯見本室", cat: "east_north", role: "artisan", gender: "m", age: "elder",
      quote: "「名札を並べるのは簡単だ。あの子の皿だけ、見てやってくれ。」",
      colors: { main: "#5e6a78", sub: "#453a30", accent: "#9cb8c9", hair: 0xd6dae2, skin: 0xe3b490, eye: 0x455260 },
      hairStyle: "elder", prop: "bowl", grip: "carry" },

    { id: "P18", name: "見習いポル", loc: "N01 窯見本室", cat: "east_north", role: "artisan", gender: "m", age: "young",
      quote: "「失敗はそっち。鳥みたいでしょう。うまくいった皿より好きなんです。」",
      colors: { main: "#687a8c", sub: "#4a3e32", accent: "#c7d4de", hair: 0x6b4a30, skin: 0xf2c8a8, eye: 0x46647a },
      hairStyle: "short", prop: "bowl", grip: "carry" },

    { id: "P19", name: "療術師セト", loc: "N02 施療院", cat: "east_north", role: "healer", gender: "m", age: "adult",
      quote: "「この輪を贈り物と呼ぶかどうかは、外したあなたが決めてください。」",
      colors: { main: "#e8edf5", sub: "#2f5954", accent: "#c8a24c", hair: 0x2b303a, skin: 0xefc3a2, eye: 0x2f635c },
      hairStyle: "short", prop: "medcard", grip: "read" },

    { id: "P20", name: "薬草係ハナ", loc: "N04 薬草乾燥室", cat: "east_north", role: "maid", gender: "f", age: "young",
      quote: "「匂いが分からなくても、葉っぱのへこみは残るでしょう。」",
      colors: { main: "#456e4e", sub: "#f2efe6", accent: "#98c99e", hair: 0x543824, skin: 0xf5cfb4, eye: 0x3b6e48 },
      hairStyle: "bun", prop: "herb", grip: "gentle" },

    { id: "P21", name: "星読師ソア", loc: "N03 星暦室", cat: "east_north", role: "scholar", gender: "f", age: "adult",
      quote: "「星を数え終えたら、今度は星のない所も数えてみましょう。」",
      colors: { main: "#232a52", sub: "#171c38", accent: "#f0cb6c", hair: 0x2a2640, skin: 0xf3ccb4, eye: 0x4a5ca8 },
      hairStyle: "long", prop: "astrolabe", grip: "gentle" },

    { id: "P22", name: "鋳物師ベク", loc: "N05 鐘鋳場", cat: "east_north", role: "artisan", gender: "m", age: "elder",
      quote: "「鈴は鳴ってるよ。その板に、指を置いてみな。」",
      colors: { main: "#4a382c", sub: "#2e241d", accent: "#d49b42", hair: 0xc2c6cf, skin: 0xe0ae8a, eye: 0x4c3a2c },
      hairStyle: "elder", prop: "hammer", grip: "tool" },

    { id: "P23", name: "鐘番ドル", loc: "S03 鐘番室", cat: "south_sub", role: "spearman", gender: "m", age: "adult",
      quote: "「鐘は鳴った。で、誰が持ち場を替わった？　大事なのはそっちだ。」",
      colors: { main: "#243f72", sub: "#3f4550", accent: "#e0b34c", hair: 0x3a2a1e, skin: 0xe8b996, eye: 0x3b485c },
      hairStyle: "short", prop: "spear", grip: "polearm", armor: "spearman" },

    { id: "P24", name: "門番ウル", loc: "S04 南門検札所", cat: "south_sub", role: "knight", gender: "m", age: "adult",
      quote: "「よいお辞儀です。お荷物があれば、この内窓へどうぞ。」",
      colors: { main: "#1f3a6d", sub: "#c8d2e0", accent: "#e6b647", hair: 0x2c241e, skin: 0xe6b794, eye: 0x354860 },
      hairStyle: "short", prop: "sword", grip: "sword", armor: "knight" },

    { id: "P25", name: "御者サヤ", loc: "S05 城内側馬車溜", cat: "south_sub", role: "worker", gender: "f", age: "adult",
      quote: "「町って書いてあるからね。あれは小劇場が町を借りたんだよ。」",
      colors: { main: "#4d3c2e", sub: "#2c3e5c", accent: "#4d82bd", hair: 0x3a261a, skin: 0xedc09e, eye: 0x38587a },
      hairStyle: "bob", prop: "lantern", grip: "lantern", hat: "cap" },

    { id: "P26", name: "料理長イネ", loc: "S06 宴会厨房", cat: "south_sub", role: "chef", gender: "f", age: "adult",
      quote: "「一人ぶん余らせて。まだ座ってない誰かがいる。」",
      colors: { main: "#f2f4f8", sub: "#7a2c2c", accent: "#d9a944", hair: 0x452f22, skin: 0xf2c6a6, eye: 0x5c3c2e },
      hairStyle: "bun", prop: "plate", grip: "carry", hat: "toque" },

    { id: "P27", name: "パン焼きエマ", loc: "S07 パン窯室", cat: "south_sub", role: "chef", gender: "f", age: "young",
      quote: "「端っこだったら好みを二つにできるよ。一本のパンのままでね。」",
      colors: { main: "#f5efe6", sub: "#8c5c34", accent: "#e3b868", hair: 0x8c5a32, skin: 0xf5ceb4, eye: 0x6e4a2b },
      hairStyle: "bob", prop: "bread", grip: "carry", hat: "kerchief" },

    { id: "P28", name: "皿番テオ", loc: "S08 食器棚室", cat: "south_sub", role: "worker", gender: "m", age: "young",
      quote: "「割れ口まで、捨てる前に見て。そこに持ち主が残るから。」",
      colors: { main: "#405266", sub: "#edeae2", accent: "#a8bac9", hair: 0x4a382c, skin: 0xf0c4a2, eye: 0x3b5266 },
      hairStyle: "short", prop: "plate", grip: "carry" },

    { id: "P29", name: "庭師フェン", loc: "G05 庭師小屋", cat: "south_sub", role: "worker", gender: "m", age: "adult",
      quote: "「あの鷺、もう飛べないけどさ。雨の日にはちゃんと働くよ。」",
      colors: { main: "#3c5e3a", sub: "#59432e", accent: "#d9c07a", hair: 0x4f3824, skin: 0xe6b690, eye: 0x3a5c38 },
      hairStyle: "short", prop: "shears", grip: "tool", hat: "straw" },

    { id: "P30", name: "舟守メル", loc: "G06 舟遊び池", cat: "south_sub", role: "boatman", gender: "f", age: "adult",
      quote: "「舟をかえそう。岸はひとつでも、見る方角は変えられる。」",
      colors: { main: "#2c5b75", sub: "#e8e4d8", accent: "#d9a944", hair: 0x382820, skin: 0xedc09e, eye: 0x2a6280 },
      hairStyle: "bob", prop: "oar", grip: "polearm" },

    { id: "P31", name: "氷守アサ", loc: "B02 貯氷室", cat: "south_sub", role: "worker", gender: "m", age: "adult",
      quote: "「今日ひとつ分けても、去年の冬の仕事はなくならないさ。」",
      colors: { main: "#3d546b", sub: "#e6eef5", accent: "#9cc4e4", hair: 0x2c3440, skin: 0xebc0a0, eye: 0x466b8a },
      hairStyle: "short", prop: "ice", grip: "carry", furCollar: true },

    { id: "P32", name: "工匠ゴウ", loc: "B03 からくり工房", cat: "south_sub", role: "artisan", gender: "m", age: "elder",
      quote: "「影と仕掛けの動く順番、逆にするとよく分かるぞ。」",
      colors: { main: "#5c4938", sub: "#362b22", accent: "#d4a648", hair: 0xd0d4dc, skin: 0xe4b590, eye: 0x4f3e2e },
      hairStyle: "elder", prop: "hammer", grip: "tool" },

    { id: "P33", name: "茶番ニナ", loc: "B04 古い給茶室", cat: "south_sub", role: "maid", gender: "f", age: "young",
      quote: "「昔は、この椅子にも名前があったんだよ。」",
      colors: { main: "#273142", sub: "#f4f6fa", accent: "#c8a265", hair: 0x483022, skin: 0xf5cfb4, eye: 0x3b6e58 },
      hairStyle: "bun", prop: "tray", grip: "carry" },

    { id: "P34", name: "記録官エル", loc: "B06 帳票庫", cat: "south_sub", role: "official", gender: "m", age: "adult",
      quote: "「番号は消さない。隣に、本人の名を戻そう。」",
      colors: { main: "#2d3448", sub: "#1d2230", accent: "#c9a658", hair: 0x262830, skin: 0xedc1a2, eye: 0x384460 },
      hairStyle: "short", prop: "book", grip: "read" },

    { id: "P35", name: "子供ティム", loc: "G03 果樹回廊", cat: "south_sub", role: "child", gender: "m", age: "child",
      quote: "「しゃがんで。ほら、こっちからなら舟なんだ。」",
      colors: { main: "#5a7a42", sub: "#6b5036", accent: "#e6c468", hair: 0x6b4528, skin: 0xf5ceb4, eye: 0x4a6b38 },
      hairStyle: "short", prop: "toyboat", grip: "carry" },

    { id: "P36", name: "療養客マオ", loc: "N07 療養温室", cat: "south_sub", role: "patient", gender: "f", age: "young",
      quote: "「花を摘まなくていいよ。ここから一輪だけ見たかったんだ。」",
      colors: { main: "#ebe9e4", sub: "#d4dce6", accent: "#98c4a8", hair: 0x3b2c26, skin: 0xf7d8c4, eye: 0x4f6e5c },
      hairStyle: "long", prop: "flower", grip: "gentle" }
  ];

  // =========================================================================
  // 2. 役割ごとの専用モーション一覧
  // =========================================================================
  function getAvailablePoses(spec) {
    if (spec.role === "hero") return [
      { id: "idle", label: "立ち姿" }, { id: "walk", label: "歩行(肘膝)" },
      { id: "kneel", label: "片膝傅き" }, { id: "guard", label: "両手剣構え" }, { id: "bow", label: "南門一礼" }
    ];
    if (spec.role === "knight") return [
      { id: "idle", label: "直立警備" }, { id: "walk", label: "巡回歩行" },
      { id: "guard", label: "両手剣構え" }, { id: "salute", label: "剣の敬礼" }
    ];
    if (spec.role === "spearman") return [
      { id: "idle", label: "立哨(槍)" }, { id: "walk", label: "巡回歩行" },
      { id: "pole_brace", label: "槍制止構え" }, { id: "bow", label: "一礼" }
    ];
    if (spec.role === "king") return [
      { id: "idle", label: "威厳立ち" }, { id: "decree", label: "勅命(面を上げよ)" }, { id: "walk", label: "堂々歩行" }
    ];
    if (spec.role === "princess") return [
      { id: "idle", label: "優雅な立ち姿" }, { id: "walk", label: "淑やかな歩行" },
      { id: "curtsy", label: "カーテシー" }, { id: "inspect", label: "花を見つめる" }
    ];
    if (spec.role === "boatman") return [
      { id: "idle", label: "櫂を立てて立つ" }, { id: "walk", label: "歩行" },
      { id: "row", label: "舟を漕ぐ" }, { id: "greet", label: "挨拶" }
    ];
    if (spec.role === "musician") return [
      { id: "idle", label: "楽器を構える" }, { id: "play_lute", label: "演奏モーション" },
      { id: "walk", label: "歩行" }, { id: "greet", label: "一礼" }
    ];
    if (spec.role === "artist") return [
      { id: "idle", label: "パレットと筆" }, { id: "work", label: "絵を描く" },
      { id: "walk", label: "歩行" }, { id: "greet", label: "一礼" }
    ];
    if (spec.grip === "carry") return [
      { id: "idle", label: "両手で水平保持" }, { id: "walk", label: "運び歩き" },
      { id: "present", label: "差し出す・見せる" }, { id: "greet", label: "お辞儀" }
    ];
    if (spec.grip === "read") return [
      { id: "idle", label: "書物を読む" }, { id: "walk", label: "歩行" },
      { id: "present", label: "資料を示す" }, { id: "greet", label: "一礼" }
    ];
    if (spec.role === "actor") return [
      { id: "idle", label: "舞台立ち姿" }, { id: "walk", label: "歩行" },
      { id: "guard", label: "勇者役の構え" }, { id: "greet", label: "カーテンコール" }
    ];
    if (spec.role === "child") return [
      { id: "idle", label: "立ち姿" }, { id: "walk", label: "元気な歩行" },
      { id: "crouch", label: "しゃがんで覗く" }, { id: "present", label: "舟を見せる" }
    ];
    return [
      { id: "idle", label: "自然な立ち姿" }, { id: "walk", label: "歩行" },
      { id: "work", label: "仕事モーション" }, { id: "greet", label: "挨拶・一礼" }
    ];
  }

  // =========================================================================
  // 3. プロシージャルPBRテクスチャキャッシュ
  // =========================================================================
  const texCache = {};

  function getArmorPlateTexture() {
    if (texCache.armorPlate) return texCache.armorPlate;
    const c = document.createElement("canvas"); c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 512, 512);
    gr.addColorStop(0, "#dde3ec"); gr.addColorStop(0.5, "#b5bfcf"); gr.addColorStop(1, "#8d98ab");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(20,28,42,0.06)";
      g.fillRect(Math.random() * 512, Math.random() * 512, 24, 1);
    }
    g.strokeStyle = "#d9a944"; g.lineWidth = 6;
    g.strokeRect(10, 10, 492, 492);
    g.beginPath(); g.moveTo(256, 36); g.lineTo(256, 430); g.stroke();
    g.fillStyle = "#e6bc58";
    g.beginPath(); g.moveTo(256, 130); g.lineTo(286, 178); g.lineTo(256, 226); g.lineTo(226, 178); g.closePath(); g.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache.armorPlate = tex;
    return tex;
  }

  function getChainmailTexture() {
    if (texCache.chainmail) return texCache.chainmail;
    const c = document.createElement("canvas"); c.width = 128; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#353b45"; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#8a94a6"; g.lineWidth = 1.6;
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        g.beginPath(); g.arc(x + ((y / 8) % 2) * 4, y, 3.2, 0, Math.PI * 2); g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4);
    tex.castleShared = true;
    texCache.chainmail = tex;
    return tex;
  }

  function getMicroFabricTexture(baseHex, trimHex, pattern) {
    const key = baseHex + "|" + (trimHex || "") + "|" + (pattern || "");
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.032)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    if (pattern === "royal") {
      g.fillStyle = trimHex || "#e6b647";
      g.fillRect(0, 228, 256, 10); g.fillRect(0, 242, 256, 4);
    } else if (pattern === "ermine") {
      g.fillStyle = "#1f1d1a";
      for (let y = 18; y < 250; y += 36) {
        for (let x = 14 + ((y / 36) % 2) * 18; x < 250; x += 38) {
          g.beginPath(); g.ellipse(x, y, 2.8, 5.5, 0, 0, Math.PI * 2); g.fill();
        }
      }
    } else if (pattern === "stars") {
      g.fillStyle = "#f2d680";
      for (let i = 0; i < 42; i++) {
        g.beginPath(); g.arc((i * 59) % 248 + 4, (i * 83) % 240 + 8, 1.8 + (i % 2), 0, Math.PI * 2); g.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function getHoodieTexture() {
    if (texCache.heroHoodie) return texCache.heroHoodie;
    const c = document.createElement("canvas"); c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, "#434854"); bg.addColorStop(0.55, "#383d47");
    bg.addColorStop(0.88, "#313640"); bg.addColorStop(0.9, "#252932"); bg.addColorStop(1, "#22262e");
    g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2000; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)";
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    g.fillStyle = "#e8ecf4";
    g.beginPath(); g.moveTo(208, 0); g.lineTo(304, 0); g.quadraticCurveTo(286, 108, 256, 134); g.quadraticCurveTo(226, 108, 208, 0); g.fill();
    g.fillStyle = "#edc09e";
    g.beginPath(); g.moveTo(224, 0); g.lineTo(288, 0); g.quadraticCurveTo(276, 52, 256, 62); g.quadraticCurveTo(236, 52, 224, 0); g.fill();
    g.strokeStyle = "#cfd6e3"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(224, 2); g.quadraticCurveTo(256, 74, 288, 2); g.stroke();
    g.strokeStyle = "#20242c"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(208, 0); g.quadraticCurveTo(226, 108, 256, 134); g.quadraticCurveTo(286, 108, 304, 0); g.stroke();
    g.fillStyle = "#232730"; g.fillRect(252, 134, 8, 378);
    g.strokeStyle = "#9aa4b4"; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(256, 136); g.lineTo(256, 506); g.stroke(); g.setLineDash([]);
    [-1, 1].forEach(function (side) {
      const gx = 256 + side * 26;
      g.fillStyle = "#aeb7c6"; g.beginPath(); g.arc(gx, 96, 4.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#e6eaf2"; g.lineWidth = 3.5; g.lineCap = "round";
      g.beginPath(); g.moveTo(gx, 98); g.quadraticCurveTo(gx + side * 4, 152, gx + side * 2, 198); g.stroke();
      g.fillStyle = "rgba(18, 22, 28, 0.22)";
      g.beginPath(); g.moveTo(256 + side * 8, 336); g.lineTo(256 + side * 66, 336); g.lineTo(256 + side * 82, 405); g.lineTo(256 + side * 82, 456); g.lineTo(256 + side * 8, 456); g.closePath(); g.fill();
      g.strokeStyle = "rgba(16, 19, 24, 0.55)"; g.lineWidth = 2.5; g.stroke();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache.heroHoodie = tex;
    return tex;
  }

  function getTunicTexture(baseHex, subHex, accentHex, role) {
    const key = "tunic_v3|" + baseHex + "|" + subHex + "|" + accentHex + "|" + role;
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 512; c.height = 512;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, baseHex); gr.addColorStop(0.85, baseHex); gr.addColorStop(1, "rgba(0,0,0,0.22)");
    g.fillStyle = baseHex; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)";
      g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    if (role === "official" || role === "healer" || role === "scholar" || role === "actor" || role === "musician" || role === "artist") {
      g.fillStyle = subHex || "#f0eee8";
      g.beginPath(); g.moveTo(216, 0); g.lineTo(296, 0); g.lineTo(256, 118); g.closePath(); g.fill();
      g.strokeStyle = accentHex || "#d9b362"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(216, 0); g.lineTo(256, 118); g.lineTo(296, 0); g.stroke();
      g.fillStyle = accentHex || "#e6c36e";
      for (let y = 150; y <= 380; y += 54) { g.beginPath(); g.arc(256, y, 5.5, 0, Math.PI * 2); g.fill(); }
    } else if (role === "artisan" || role === "chef" || role === "worker" || role === "merchant" || role === "boatman") {
      g.fillStyle = subHex || "#3a2a1e";
      g.fillRect(198, 128, 116, 384);
      g.strokeStyle = "rgba(0,0,0,0.32)"; g.lineWidth = 4; g.strokeRect(198, 128, 116, 384);
      g.strokeStyle = subHex || "#3a2a1e"; g.lineWidth = 9;
      g.beginPath(); g.moveTo(210, 128); g.lineTo(232, 0); g.moveTo(302, 128); g.lineTo(280, 0); g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function makeLathe(pairs, segments, mat) {
    const pts = pairs.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    return new THREE.Mesh(new THREE.LatheGeometry(pts, segments || 20), mat);
  }

  // =========================================================================
  // 4. 頭部・髪・髭ビルダー
  // =========================================================================
  function buildHead(spec, r, skinMat) {
    const g = new THREE.Group();
    const isF = spec.gender === "f";
    const isChild = spec.age === "child";
    const skull = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 20), skinMat);
    skull.scale.set(0.92, isChild ? 1.02 : 1.08, 0.96); g.add(skull);

    [-r * 0.9, r * 0.9].forEach(function (ex) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 8, 8), skinMat);
      ear.scale.set(0.42, 1.15, 0.72); ear.position.set(ex, -r * 0.04, -r * 0.02); g.add(ear);
    });

    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfbfcff, roughness: 0.22 });
    const irisMat = new THREE.MeshStandardMaterial({ color: spec.colors.eye || 0x2d4a6e, roughness: 0.2 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111318 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x1e1510 });
    const browMat = new THREE.MeshStandardMaterial({ color: spec.colors.hair, roughness: 0.72 });
    const lipMat = new THREE.MeshStandardMaterial({ color: isF ? 0xd47d84 : 0xc27f76, roughness: 0.45 });

    [-1, 1].forEach(function (side) {
      const eg = new THREE.Group();
      eg.position.set(side * r * 0.33, r * 0.08, r * 0.87); eg.rotation.y = side * 0.24;
      const sc = new THREE.Mesh(new THREE.SphereGeometry(r * (isF || isChild ? 0.175 : 0.148), 12, 10), scleraMat);
      sc.scale.set(1.14, isF || isChild ? 0.88 : 0.72, 0.34); eg.add(sc);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(r * (isF || isChild ? 0.115 : 0.094), 10, 10), irisMat);
      ir.scale.set(1, 1, 0.38); ir.position.z = r * 0.032; eg.add(ir);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.054, 8, 8), pupilMat);
      pu.scale.set(1, 1, 0.34); pu.position.z = r * 0.054; eg.add(pu);
      const gl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.023, 6, 6), glintMat);
      gl.position.set(-r * 0.03, r * 0.03, r * 0.068); eg.add(gl);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(r * (isF ? 0.165 : 0.142), r * (isF ? 0.024 : 0.018), 6, 12, Math.PI * 0.85), lashMat);
      lash.rotation.z = Math.PI * 0.08; lash.position.set(0, r * 0.01, r * 0.035); eg.add(lash);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(r * 0.34, r * (isF ? 0.04 : 0.056), r * 0.036), browMat);
      brow.position.set(0, r * 0.22, r * 0.02); brow.rotation.z = -side * (isF ? 0.08 : 0.04); eg.add(brow);
      g.add(eg);
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(r * 0.105, r * 0.24, 6), skinMat);
    nose.rotation.x = Math.PI / 2 - 0.25; nose.position.set(0, -r * 0.1, r * 0.95); g.add(nose);
    const lips = new THREE.Mesh(new THREE.SphereGeometry(r * 0.135, 10, 8), lipMat);
    lips.scale.set(1.25, 0.34, 0.42); lips.position.set(0, -r * 0.38, r * 0.86); g.add(lips);

    const hairMat = new THREE.MeshStandardMaterial({ color: spec.colors.hair, roughness: 0.65 });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.44), hairMat);
    crown.scale.set(0.95, 1.1, 1.0); crown.rotation.x = -0.22; g.add(crown);
    const backShell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 20, 14, Math.PI * 0.04, Math.PI * 0.92, Math.PI * 0.14, Math.PI * 0.7), hairMat);
    backShell.scale.set(0.96, 1.08, 1.02); backShell.rotation.y = Math.PI; g.add(backShell);
    const fringe = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 16, 8, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.24, Math.PI * 0.14), hairMat);
    fringe.scale.set(0.95, 1.08, 1.0); g.add(fringe);

    const hs = spec.hairStyle || "short";
    if (hs === "bun") {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(r * 0.48, 12, 10), hairMat);
      bun.position.set(0, r * 0.08, -r * 1.1); g.add(bun);
    } else if (hs === "long") {
      const curtain = makeLathe([[r * 1.18, 0], [r * 1.08, r * 1.6], [r * 0.92, r * 3.0], [r * 0.44, r * 3.7]], 16, hairMat);
      curtain.position.set(0, -r * 3.35, -r * 0.48); g.add(curtain);
    } else if (hs === "bob") {
      const bobShell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 18, 12, Math.PI * 0.06, Math.PI * 0.88, Math.PI * 0.35, Math.PI * 0.52), hairMat);
      bobShell.scale.set(1.0, 1.18, 1.02); bobShell.rotation.y = Math.PI; bobShell.position.y = -r * 0.16; g.add(bobShell);
    } else if (hs === "elder") {
      const stache = new THREE.Mesh(new THREE.TorusGeometry(r * 0.32, r * 0.095, 8, 14, Math.PI), hairMat);
      stache.position.set(0, -r * 0.42, r * 0.78); stache.rotation.x = 0.22; g.add(stache);
      const beard = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 14, 12), hairMat);
      beard.scale.set(0.86, 1.18, 0.54); beard.position.set(0, -r * 0.84, r * 0.55); g.add(beard);
    }

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b647, roughness: 0.22, metalness: 0.9 });
    if (spec.crown === "imperial") {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 0.94, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x8f1620, roughness: 0.75 }));
      cap.position.y = r * 0.88; g.add(cap);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.02, r * 0.62, 16), goldMat);
      band.position.y = r * 1.0; g.add(band);
      [0, Math.PI / 2].forEach(function (ry) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(r * 0.94, r * 0.1, 6, 16, Math.PI), goldMat);
        arch.rotation.y = ry; arch.position.y = r * 1.25; g.add(arch);
      });
    } else if (spec.crown === "tiara") {
      const tiara = new THREE.Mesh(new THREE.TorusGeometry(r * 0.88, r * 0.1, 8, 16, Math.PI), goldMat);
      tiara.position.set(0, r * 0.96, r * 0.22); tiara.rotation.x = -0.25; g.add(tiara);
    } else if (spec.hat === "toque") {
      const toque = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 0.95, r * 1.35, 16), new THREE.MeshStandardMaterial({ color: 0xf6f8fc, roughness: 0.85 }));
      toque.position.y = r * 1.38; g.add(toque);
    } else if (spec.hat === "beret") {
      const beret = new THREE.Mesh(new THREE.SphereGeometry(r * 1.18, 16, 10), new THREE.MeshStandardMaterial({ color: 0x633840, roughness: 0.8 }));
      beret.scale.set(1.1, 0.42, 1.1); beret.position.set(r * 0.12, r * 1.02, -r * 0.08); beret.rotation.z = -0.18; g.add(beret);
    } else if (spec.hat === "straw") {
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xd9be7a, roughness: 0.88 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.85, r * 1.95, r * 0.12, 20), strawMat);
      brim.position.y = r * 0.78; g.add(brim);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 1.05, r * 0.72, 16), strawMat);
      top.position.y = r * 1.12; g.add(top);
    } else if (spec.hat === "cap" || spec.hat === "kerchief") {
      const cMat = new THREE.MeshStandardMaterial({ color: spec.hat === "cap" ? 0x2c3e5c : 0xf4eee2, roughness: 0.8 });
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), cMat);
      cap.position.y = r * 0.2; g.add(cap);
    }
    return g;
  }

  // =========================================================================
  // 5. 高精細持ち物ビルダー（底面＝Y=0基準で手のひらにピタッと乗る！）
  // =========================================================================
  function createPropMesh(propType, goldMat, steelMat, woodMat, leatherMat) {
    const p = new THREE.Group();
    if (propType === "sword" || propType === "hero_sword" || propType === "propsword") {
      const bMat = propType === "propsword" ? woodMat : steelMat;
      const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.036), goldMat);
      pommel.position.y = -0.12; p.add(pommel);
      p.add(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.2, 8), leatherMat));
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.028, 0.036), goldMat);
      guard.position.y = 0.11; p.add(guard);
      const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.038, 0.84, 4), bMat);
      blade.scale.set(1, 1, 0.24); blade.rotation.y = Math.PI / 4; blade.position.y = 0.54; p.add(blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.14, 4), bMat);
      tip.scale.set(1, 1, 0.3); tip.rotation.y = Math.PI / 4; tip.position.y = 1.03; p.add(tip);
    } else if (propType === "spear") {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.022, 2.35, 10), woodMat);
      shaft.position.y = 0.12; p.add(shaft);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.12, 8), goldMat);
      collar.position.y = 1.28; p.add(collar);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.4, 4), steelMat);
      head.scale.set(1, 1, 0.28); head.rotation.y = Math.PI / 4; head.position.y = 1.54; p.add(head);
      const penShape = new THREE.Shape();
      penShape.moveTo(0, 0); penShape.lineTo(0.24, -0.05); penShape.lineTo(0.18, -0.15); penShape.lineTo(0.24, -0.26); penShape.lineTo(0, -0.2); penShape.closePath();
      const pen = new THREE.Mesh(new THREE.ShapeGeometry(penShape), new THREE.MeshStandardMaterial({ color: 0x9b1c26, roughness: 0.75, side: THREE.DoubleSide }));
      pen.position.set(0.022, 1.24, 0); p.add(pen);
    } else if (propType === "oar") {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 1.95, 10), woodMat);
      shaft.position.y = -0.08; p.add(shaft);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.022), woodMat);
      bl.position.y = -0.82; p.add(bl);
    } else if (propType === "scepter") {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.68, 8), goldMat);
      st.position.y = 0.2; p.add(st);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.052), new THREE.MeshStandardMaterial({ color: 0xcc1828, roughness: 0.15, metalness: 0.4 }));
      orb.position.y = 0.56; p.add(orb);
    } else if (propType === "bowl") {
      // Hollow concave glazed ceramic bowl resting cleanly ON palms (y = 0..0.11)!
      const glazeMat = new THREE.MeshStandardMaterial({ color: 0x6e8fa6, roughness: 0.2, metalness: 0.12, side: THREE.DoubleSide });
      const bowlMesh = makeLathe([[0.0, 0.0], [0.09, 0.0], [0.15, 0.05], [0.175, 0.11], [0.16, 0.112], [0.135, 0.052], [0.075, 0.015], [0.0, 0.015]], 24, glazeMat);
      p.add(bowlMesh);
    } else if (propType === "plate" || propType === "tray") {
      const col = propType === "tray" ? 0xc8a265 : 0xf0f2f7;
      const rTop = propType === "tray" ? 0.22 : 0.18;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rTop * 0.85, 0.022, 22), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: propType === "tray" ? 0.45 : 0.08 }));
      dish.position.y = 0.012; p.add(dish);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(rTop - 0.008, 0.012, 8, 22), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25 }));
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.022; p.add(rim);
      if (propType === "tray") {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.028, 0.062, 12), new THREE.MeshStandardMaterial({ color: 0xf7f9fc, roughness: 0.22 }));
        cup.position.set(0.05, 0.052, 0); p.add(cup);
        const pot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe6eaf0, roughness: 0.22 }));
        pot.position.set(-0.055, 0.068, -0.01); p.add(pot);
      }
    } else if (propType === "bread") {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.018, 0.18), woodMat);
      board.position.y = 0.01; p.add(board);
      const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc98842, roughness: 0.84 }));
      loaf.scale.set(1.25, 0.58, 0.72); loaf.position.y = 0.065; p.add(loaf);
    } else if (propType === "basket") {
      const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xa68052, roughness: 0.88 }));
      bk.position.y = 0.08; p.add(bk);
      const cloth = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.85 }));
      cloth.scale.set(1, 0.45, 1); cloth.position.y = 0.16; p.add(cloth);
    } else if (propType === "ice") {
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.022, 16), woodMat);
      tray.position.y = 0.011; p.add(tray);
      const ice = new THREE.Mesh(new THREE.DodecahedronGeometry(0.095), new THREE.MeshStandardMaterial({ color: 0xbce6ff, roughness: 0.1, transparent: true, opacity: 0.86 }));
      ice.position.y = 0.095; p.add(ice);
    } else if (propType === "toyboat") {
      const hull = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 4), woodMat);
      hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.45); hull.position.y = 0.04; p.add(hull);
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.16, 0.1), new THREE.MeshStandardMaterial({ color: 0xf6f4ee }));
      sail.position.y = 0.12; p.add(sail);
    } else if (propType === "scroll") {
      // Unrolled parchment scroll held between two wooden rollers!
      const parchment = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.01, 0.18), new THREE.MeshStandardMaterial({ color: 0xf4e6c6, roughness: 0.85 }));
      parchment.position.y = 0.022; p.add(parchment);
      [-0.145, 0.145].forEach(function (rx) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 10), woodMat);
        rod.rotation.x = Math.PI / 2; rod.position.set(rx, 0.024, 0); p.add(rod);
        const cap1 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), goldMat);
        cap1.position.set(rx, 0.024, 0.115); p.add(cap1);
        const cap2 = cap1.clone(); cap2.position.z = -0.115; p.add(cap2);
      });
    } else if (propType === "book" || propType === "medcard") {
      // Open V-shaped book resting on both palms!
      const covMat = new THREE.MeshStandardMaterial({ color: propType === "medcard" ? 0x62b8e8 : 0x5c3624, roughness: 0.68 });
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xf7eed8, roughness: 0.85 });
      [-1, 1].forEach(function (side) {
        const halfCov = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.014, 0.2), covMat);
        halfCov.position.set(side * 0.072, 0.022, 0); halfCov.rotation.z = side * 0.24; p.add(halfCov);
        const halfPg = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.018, 0.185), pageMat);
        halfPg.position.set(side * 0.07, 0.036, 0); halfPg.rotation.z = side * 0.24; p.add(halfPg);
      });
    } else if (propType === "lute") {
      // Detailed Lute with sound hole, bridge & strings!
      const luteG = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), woodMat);
      body.scale.set(0.92, 1.22, 0.45); luteG.add(body);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.042, 14), new THREE.MeshBasicMaterial({ color: 0x1a110a }));
      hole.position.set(0, 0.01, 0.07); luteG.add(hole);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.42, 8), woodMat);
      neck.position.y = 0.34; luteG.add(neck);
      const strings = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.58, 0.004), goldMat);
      strings.position.set(0, 0.22, 0.072); luteG.add(strings);
      luteG.rotation.z = 0.82;
      luteG.position.set(0.02, 0.04, 0.02);
      p.add(luteG);
    } else if (propType === "palette") {
      // Painter's palette with colorful oil paint dabs!
      const pal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.016, 18), woodMat);
      pal.position.y = 0.01; p.add(pal);
      [0xd63638, 0x2b6cb0, 0xe6b647, 0x38a169, 0xf7fafc].forEach(function (col, i) {
        const a = -0.8 + i * 0.45;
        const dab = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }));
        dab.scale.set(1, 0.45, 1); dab.position.set(Math.cos(a) * 0.1, 0.022, Math.sin(a) * 0.1); p.add(dab);
      });
    } else if (propType === "lantern") {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 12), leatherMat);
      handle.position.y = -0.02; p.add(handle);
      const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x2b2d34, metalness: 0.8, roughness: 0.4 }));
      frame.position.y = -0.15; p.add(frame);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd275 }));
      glow.position.y = -0.15; p.add(glow);
    } else if (propType === "hammer" || propType === "shears") {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.34, 8), woodMat);
      h.position.y = 0.12; p.add(h);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.075, 0.075), steelMat);
      head.position.y = 0.29; p.add(head);
    } else if (propType === "flower" || propType === "lily" || propType === "herb") {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0x3b7a48 }));
      stem.position.y = 0.1; p.add(stem);
      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.085, 6), new THREE.MeshStandardMaterial({ color: propType === "herb" ? 0x5ca864 : 0xf8fbff, emissive: 0x222630 }));
      bloom.rotation.x = Math.PI; bloom.position.y = 0.25; p.add(bloom);
    } else if (propType === "astrolabe") {
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.011, 6, 16), goldMat);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.009, 6, 16), goldMat);
      r2.rotation.y = Math.PI / 2; p.add(r1, r2);
    } else if (propType === "satchel") {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.07), leatherMat);
      bx.position.y = -0.1; p.add(bx);
    }
    return p;
  }

  // =========================================================================
  // 6. 統合キャラクター生成関数 createCharacter(id, options)
  // =========================================================================
  function createCharacter(id, options) {
    const spec = CHARACTER_SPECS.find(function (c) { return c.id === id; }) || CHARACTER_SPECS[0];
    const envMap = options && options.envMap ? options.envMap : null;
    const root = new THREE.Group();
    const s = spec.age === "child" ? 0.68 : (spec.gender === "f" ? 0.94 : 1.0);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b647, roughness: 0.22, metalness: 0.9, envMap: envMap, envMapIntensity: 1.3 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd4dce8, roughness: 0.2, metalness: 0.92, envMap: envMap, envMapIntensity: 1.35 });
    const plateTorsoMat = new THREE.MeshStandardMaterial({ map: getArmorPlateTexture(), roughness: 0.22, metalness: 0.9, envMap: envMap, envMapIntensity: 1.35 });
    const chainMat = new THREE.MeshStandardMaterial({ map: getChainmailTexture(), color: 0x6b7485, roughness: 0.46, metalness: 0.78, envMap: envMap });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x52341f, roughness: 0.72 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x382418, roughness: 0.65 });
    const skinMat = new THREE.MeshStandardMaterial({ color: spec.colors.skin || 0xf0c4a2, roughness: 0.56 });
    const whiteLinenMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.8 });

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.38 * s, 18),
      new THREE.MeshBasicMaterial({ color: 0x090705, transparent: true, opacity: 0.34, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.015; root.add(shadow);

    const upperBody = new THREE.Group();
    upperBody.position.y = 0.94 * s;
    root.add(upperBody);

    const isGown = spec.role === "princess" || spec.role === "maid" || spec.role === "patient" || (spec.gender === "f" && spec.role === "scholar");
    const isKnight = spec.armor === "knight";
    const isSpearman = spec.armor === "spearman";

    // --- TORSO (Overlaps hips cleanly with zero Z-fighting + real 3D leather waist belt!) ---
    let mainSleeveMat;
    if (spec.role === "hero") {
      const torsoMat = new THREE.MeshStandardMaterial({ map: getHoodieTexture(), roughness: 0.85 });
      mainSleeveMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture("#383d47"), roughness: 0.85 });
      const torso = makeLathe([[0.186, -0.04], [0.19, 0.06], [0.18, 0.24], [0.198, 0.44], [0.212, 0.55], [0.172, 0.625], [0.075, 0.66]], 24, torsoMat);
      torso.scale.set(1.06, 1, 0.68); torso.rotation.y = Math.PI; upperBody.add(torso);
      const hoodRibMat = new THREE.MeshStandardMaterial({ color: 0x242831, roughness: 0.88 });
      const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.026, 8, 16, Math.PI * 1.15), hoodRibMat);
      hoodCollar.rotation.x = Math.PI / 2 - 0.18; hoodCollar.rotation.z = Math.PI - Math.PI * 0.075;
      hoodCollar.position.set(0, 0.625, -0.028); upperBody.add(hoodCollar);
    } else if (isKnight) {
      mainSleeveMat = steelMat;
      const cuirass = makeLathe([[0.188, 0], [0.215, 0.16], [0.268, 0.38], [0.245, 0.56], [0.132, 0.64]], 22, plateTorsoMat);
      cuirass.scale.set(1.06, 1, 0.82); cuirass.rotation.y = Math.PI; upperBody.add(cuirass);
      const gorget = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.178, 0.14, 18), steelMat);
      gorget.position.y = 0.63; upperBody.add(gorget);
      [0.02, -0.05].forEach(function (fy, idx) {
        const lame = new THREE.Mesh(new THREE.TorusGeometry(0.198 + idx * 0.015, 0.026, 8, 18), steelMat);
        lame.scale.set(1.06, 0.84, 1); lame.rotation.x = Math.PI / 2; lame.position.y = fy; upperBody.add(lame);
      });
      const capeMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.main, spec.colors.accent, "royal"), roughness: 0.72, side: THREE.DoubleSide });
      const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.36, 1.18, 14, 1, true, Math.PI * 0.68, Math.PI * 0.64), capeMat);
      cape.position.set(0, 0.04, -0.03); upperBody.add(cape);
      [-0.17, 0.17].forEach(function (cx) {
        const clasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.032), goldMat);
        clasp.position.set(cx, 0.57, 0.12); upperBody.add(clasp);
      });
    } else if (isSpearman) {
      mainSleeveMat = chainMat;
      const surcoatMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.main, spec.colors.accent, "royal"), roughness: 0.74 });
      const surcoat = makeLathe([[0.27, -0.3], [0.21, 0.02], [0.24, 0.36], [0.23, 0.56], [0.128, 0.64]], 18, surcoatMat);
      surcoat.scale.set(1.04, 1, 0.82); upperBody.add(surcoat);
      const plate = makeLathe([[0.198, 0.12], [0.235, 0.34], [0.238, 0.48], [0.148, 0.56]], 18, plateTorsoMat);
      plate.scale.set(1.06, 1, 0.86); plate.rotation.y = Math.PI; upperBody.add(plate);
    } else if (spec.role === "king") {
      const robeMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.main, spec.colors.accent, "royal"), roughness: 0.66, side: THREE.DoubleSide });
      const ermineMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture("#f4efe6", "#222", "ermine"), roughness: 0.88 });
      const doubletMat = new THREE.MeshStandardMaterial({ map: getTunicTexture(spec.colors.sub, spec.colors.main, spec.colors.accent, "official"), roughness: 0.7 });
      mainSleeveMat = robeMat;
      const torso = makeLathe([[0.22, -0.06], [0.25, 0.25], [0.285, 0.5], [0.23, 0.64], [0.11, 0.7]], 20, doubletMat);
      torso.scale.set(1.08, 1, 0.78); torso.rotation.y = Math.PI; upperBody.add(torso);
      const cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 1.32, 18, 1, true, Math.PI * 0.24, Math.PI * 1.52), robeMat);
      cloak.position.set(0, -0.02, -0.05); upperBody.add(cloak);
      const ermine = makeLathe([[0.4, 0], [0.35, 0.14], [0.24, 0.23], [0.13, 0.27]], 18, ermineMat);
      ermine.scale.set(1.08, 1, 0.84); ermine.position.set(0, 0.44, -0.02); upperBody.add(ermine);
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 18, Math.PI), goldMat);
      chain.rotation.z = Math.PI; chain.position.set(0, 0.52, 0.19); upperBody.add(chain);
    } else if (isGown) {
      const pattern = spec.id === "P21" ? "stars" : (spec.role === "princess" ? "royal" : "plain");
      const dressMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.main, spec.colors.accent, pattern), roughness: 0.68 });
      mainSleeveMat = dressMat;
      const bodice = makeLathe([[0.128 * s, 0], [0.155 * s, 0.17 * s], [0.168 * s, 0.31 * s], [0.105 * s, 0.39 * s]], 20, dressMat);
      upperBody.add(bodice);
      const skirt = makeLathe([[0.45 * s, 0.05 * s], [0.41 * s, 0.28 * s], [0.32 * s, 0.58 * s], [0.21 * s, 0.82 * s], [0.13 * s, 0.96 * s]], 22, dressMat);
      root.add(skirt);
      if (spec.role === "maid") {
        const apronPts = [[0.456 * s, 0.16 * s], [0.405 * s, 0.34 * s], [0.315 * s, 0.6 * s], [0.215 * s, 0.82 * s], [0.138 * s, 0.96 * s]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
        root.add(new THREE.Mesh(new THREE.LatheGeometry(apronPts, 18, -0.78, 1.56), whiteLinenMat));
        const bib = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * s, 0.136 * s, 0.27 * s, 14, 1, false, -0.58, 1.16), whiteLinenMat);
        bib.position.y = 0.16 * s; upperBody.add(bib);
        [-1, 1].forEach(function (sd) {
          const bow = new THREE.Mesh(new THREE.SphereGeometry(0.062 * s, 10, 8), whiteLinenMat);
          bow.scale.set(1.25, 0.7, 0.42); bow.position.set(sd * 0.068 * s, 0.02 * s, -0.155 * s); upperBody.add(bow);
        });
      }
      const chestSkin = new THREE.Mesh(new THREE.SphereGeometry(0.122 * s, 12, 10), skinMat);
      chestSkin.scale.set(1.16, 0.55, 0.85); chestSkin.position.y = 0.385 * s; upperBody.add(chestSkin);
    } else {
      // Flared Tunic extending cleanly BELOW waist (-0.08*s) so ZERO z-fighting seam with pants!
      const tMat = new THREE.MeshStandardMaterial({ map: getTunicTexture(spec.colors.main, spec.colors.sub, spec.colors.accent, spec.role), roughness: 0.78 });
      mainSleeveMat = new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.main), roughness: 0.8 });
      const torso = makeLathe([[0.194 * s, -0.07 * s], [0.184 * s, 0.08 * s], [0.178 * s, 0.24 * s], [0.198 * s, 0.44 * s], [0.208 * s, 0.55 * s], [0.165 * s, 0.625 * s], [0.078 * s, 0.66 * s]], 22, tMat);
      torso.scale.set(1.06, 1, 0.7); torso.rotation.y = Math.PI; upperBody.add(torso);
      // Real 3D Leather Belt & Gold Buckle at waist!
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.192 * s, 0.194 * s, 0.052 * s, 20), leatherMat);
      belt.scale.set(1.06, 1, 0.72); belt.position.y = 0.06 * s; upperBody.add(belt);
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.058 * s, 0.06 * s, 0.026 * s), goldMat);
      buckle.position.set(0, 0.06 * s, 0.138 * s); upperBody.add(buckle);
      if (spec.furCollar) {
        const fur = new THREE.Mesh(new THREE.TorusGeometry(0.145 * s, 0.042 * s, 8, 16), whiteLinenMat);
        fur.rotation.x = Math.PI / 2; fur.position.y = 0.6 * s; upperBody.add(fur);
      }
    }

    // Collar & Persistent Hip Scabbard
    let collarMesh = null;
    if (spec.collar) {
      const cMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, emissive: 0x38bdf8, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.85 });
      collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.015, 8, 20), cMat);
      collarMesh.rotation.x = Math.PI / 2; collarMesh.position.y = 0.675; upperBody.add(collarMesh);
    }

    let scabbardHilt = null;
    if (spec.role === "hero" || isKnight || spec.role === "actor") {
      const sg = new THREE.Group();
      const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.015, 0.76, 10), leatherMat);
      sb.position.y = -0.36; sg.add(sb);
      const chape = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.08, 8), goldMat);
      chape.rotation.x = Math.PI; chape.position.y = -0.76; sg.add(chape);
      const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.026, 0.05, 10), goldMat);
      sg.add(mouth);
      scabbardHilt = new THREE.Group();
      const hg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.03), goldMat); hg.position.y = 0.03; scabbardHilt.add(hg);
      const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.15, 8), leatherMat); gr.position.y = 0.11; scabbardHilt.add(gr);
      const pm = new THREE.Mesh(new THREE.OctahedronGeometry(0.026), goldMat); pm.position.y = 0.2; scabbardHilt.add(pm);
      sg.add(scabbardHilt);
      sg.position.set((isKnight ? 0.25 : 0.21) * s, 0.04 * s, -0.02);
      sg.rotation.x = 0.56; sg.rotation.z = 0.16; upperBody.add(sg);
    }

    if (spec.prop === "dove") {
      const dove = new THREE.Group();
      const db = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), whiteLinenMat);
      db.scale.set(0.85, 0.9, 1.35); dove.add(db);
      const dh = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), whiteLinenMat);
      dh.position.set(0, 0.055, 0.065); dove.add(dh);
      dove.position.set(0.22 * s, 0.64 * s, 0.02); upperBody.add(dove);
    }

    // --- HEAD & NECK ---
    const headPivot = new THREE.Group();
    const neckBaseY = isGown ? 0.39 * s : 0.65 * s;
    headPivot.position.set(0, neckBaseY, 0);
    upperBody.add(headPivot);

    const neckMat = isKnight ? chainMat : skinMat;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry((isKnight ? 0.088 : 0.052) * s, (isKnight ? 0.105 : 0.064) * s, 0.18 * s, 14), neckMat);
    neck.position.y = 0.05 * s; headPivot.add(neck);

    if (isKnight) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.158, 20, 16), steelMat);
      dome.scale.set(0.94, 1.08, 1.06); dome.position.y = 0.2; headPivot.add(dome);
      const visor = new THREE.Mesh(new THREE.SphereGeometry(0.162, 16, 12, -0.65, 1.3, 0.45, 0.95), steelMat);
      visor.scale.set(0.95, 1.02, 1.18); visor.rotation.y = Math.PI / 2; visor.position.set(0, 0.19, 0.025); headPivot.add(visor);
      const slit = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.166, 0.024, 16, 1, true, -0.52, 1.04), new THREE.MeshBasicMaterial({ color: 0x10131a, side: THREE.DoubleSide }));
      slit.position.set(0, 0.215, 0.025); headPivot.add(slit);
      const crest = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.018, 8, 16, Math.PI), goldMat);
      crest.rotation.y = Math.PI / 2; crest.position.y = 0.24; headPivot.add(crest);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0x9b1c26, roughness: 0.75 }));
      plume.rotation.x = -2.1; plume.position.set(0, 0.34, -0.14); headPivot.add(plume);
    } else {
      const headR = (spec.age === "child" ? 0.145 : 0.128) * s;
      const headCore = buildHead(spec, headR, skinMat);
      headCore.position.y = 0.19 * s; headPivot.add(headCore);
      if (isSpearman) {
        const coif = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08, 14, 12, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.18, Math.PI * 0.72), chainMat);
        coif.rotation.y = Math.PI; coif.position.y = 0.19 * s; headPivot.add(coif);
        const helmTop = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54), steelMat);
        helmTop.position.y = 0.23 * s; headPivot.add(helmTop);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(headR * 1.16, headR * 1.75, 0.052, 18), steelMat);
        brim.position.y = 0.24 * s; headPivot.add(brim);
      } else if (spec.role === "maid") {
        const hb = new THREE.Mesh(new THREE.TorusGeometry(headR * 1.1, 0.014 * s, 8, 16, Math.PI), whiteLinenMat);
        hb.position.set(0, 0.23 * s, 0.012); hb.rotation.x = -0.18; headPivot.add(hb);
      }
    }

    // --- ARTICULATED ARMS WITH CUFFS & THUMB-CONTOURED HANDS ---
    function buildArm(side) {
      const sh = new THREE.Group();
      const armY = isGown ? 0.33 * s : 0.545 * s;
      const armX = side * (isKnight ? 0.265 : (isGown ? 0.19 * s : 0.208 * s));
      sh.position.set(armX, armY, 0);

      if (isKnight) {
        sh.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), chainMat));
        const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 14), steelMat);
        pauldron.scale.set(1.05, 0.92, 1.05); pauldron.position.set(side * 0.02, 0.02, 0); sh.add(pauldron);
        const pTrim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.01, 6, 16), goldMat);
        pTrim.rotation.x = Math.PI / 2; pTrim.position.set(side * 0.02, -0.02, 0); sh.add(pTrim);
      } else {
        sh.add(new THREE.Mesh(new THREE.SphereGeometry((isGown ? 0.072 : 0.058) * s, 10, 10), spec.role === "maid" ? whiteLinenMat : mainSleeveMat));
      }

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.056 * s, 0.049 * s, 0.26 * s, 12), mainSleeveMat);
      upper.position.y = -0.13 * s; sh.add(upper);

      const el = new THREE.Group();
      el.position.y = -0.26 * s; sh.add(el);
      el.add(new THREE.Mesh(new THREE.SphereGeometry(0.048 * s, 10, 8), isKnight ? chainMat : mainSleeveMat));

      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.047 * s, 0.038 * s, 0.23 * s, 12), isGown && spec.role === "princess" ? skinMat : mainSleeveMat);
      fore.position.y = -0.115 * s; el.add(fore);

      // Tailored Wrist Cuff
      if (!isKnight && !(isGown && spec.role === "princess")) {
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.042 * s, 0.04 * s, 0.026 * s, 12), spec.role === "hero" ? new THREE.MeshStandardMaterial({ color: 0x242831 }) : whiteLinenMat);
        cuff.position.y = -0.228 * s; el.add(cuff);
      }

      // Sculpted Palm + Thumb
      const handMat = isKnight ? chainMat : skinMat;
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036 * s, 10, 8), handMat);
      palm.scale.set(0.85, 1.12, 0.65); palm.position.y = -0.262 * s; el.add(palm);
      const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.016 * s, 6, 6), handMat);
      thumb.scale.set(0.8, 1.4, 0.8); thumb.position.set(-side * 0.026 * s, -0.258 * s, 0.012 * s); el.add(thumb);

      const socket = new THREE.Group();
      socket.position.set(0, -0.265 * s, 0.015 * s);
      el.add(socket);

      upperBody.add(sh);
      return { shoulder: sh, elbow: el, socket: socket };
    }
    const leftArm = buildArm(1);
    const rightArm = buildArm(-1);

    // Real-time hand-tracked carry anchor!
    const chestCarryAnchor = new THREE.Group();
    upperBody.add(chestCarryAnchor);

    // Attach Prop cleanly
    let mainProp = null;
    if (spec.prop && spec.prop !== "dove") {
      mainProp = createPropMesh(spec.prop, goldMat, steelMat, woodMat, leatherMat);
      if (spec.grip === "carry" || spec.grip === "read" || spec.grip === "instrument") {
        chestCarryAnchor.add(mainProp);
      } else if (spec.grip === "scabbard") {
        mainProp.scale.set(0.84, 0.84, 0.84);
        mainProp.visible = false;
        rightArm.socket.add(mainProp);
      } else if (spec.grip === "paint") {
        // Palette in left hand, wooden paintbrush in right hand!
        leftArm.socket.add(mainProp);
        const brush = new THREE.Group();
        const bh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.26, 6), woodMat);
        bh.position.y = 0.09; brush.add(bh);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 6), new THREE.MeshStandardMaterial({ color: 0x2b6cb0 }));
        tip.position.y = 0.23; brush.add(tip);
        rightArm.socket.add(brush);
      } else {
        rightArm.socket.add(mainProp);
      }
    }

    // --- LEGS (Slightly narrower pelvis than flared tunic hem -> ZERO z-fighting!) ---
    const pantsMat = isKnight ? steelMat : new THREE.MeshStandardMaterial({ map: getMicroFabricTexture(spec.colors.sub || "#2c3545"), roughness: 0.82 });
    if (!isGown) {
      const hips = makeLathe([[0.162 * s, 0], [0.168 * s, 0.07 * s], [0.162 * s, 0.13 * s]], 16, isKnight ? chainMat : pantsMat);
      hips.scale.set(1.04, 1, 0.66); hips.position.y = 0.82 * s; root.add(hips);
    }
    function buildLeg(side) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.1 * s, 0.88 * s, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.066 * s, 0.42 * s, 12), pantsMat);
      thigh.position.y = -0.21 * s; hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.42 * s; hip.add(knee);
      knee.add(new THREE.Mesh(new THREE.SphereGeometry(0.066 * s, 10, 8), isKnight ? steelMat : pantsMat));
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.064 * s, 0.051 * s, 0.39 * s, 12), isKnight || isSpearman ? steelMat : pantsMat);
      calf.position.y = -0.195 * s; knee.add(calf);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.098 * s, 0.062 * s, 0.21 * s), isKnight ? steelMat : leatherMat);
      shoe.position.set(0, -0.4 * s, 0.038 * s); knee.add(shoe);
      if (isGown) { thigh.visible = false; calf.visible = false; }
      root.add(hip);
      return { hip: hip, knee: knee };
    }
    const leftLeg = buildLeg(1);
    const rightLeg = buildLeg(-1);

    return {
      id: spec.id, spec: spec, scale: s, group: root,
      upperBody: upperBody, headPivot: headPivot,
      leftArm: leftArm, rightArm: rightArm,
      leftLeg: leftLeg, rightLeg: rightLeg,
      collarMesh: collarMesh, mainProp: mainProp,
      scabbardHilt: scabbardHilt, chestCarryAnchor: chestCarryAnchor
    };
  }

  // Reusable scratch vectors for zero-GC real-time hand midpoint tracking
  const _vL = new THREE.Vector3();
  const _vR = new THREE.Vector3();
  const _vMid = new THREE.Vector3();

  // =========================================================================
  // 7. 精密ハンドトラッキング付き役割別モーションエンジン
  // =========================================================================
  function syncCarryToHands(charObj, yOffset, zOffset, rotX) {
    charObj.upperBody.updateMatrixWorld(true);
    charObj.leftArm.socket.getWorldPosition(_vL);
    charObj.rightArm.socket.getWorldPosition(_vR);
    charObj.upperBody.worldToLocal(_vL);
    charObj.upperBody.worldToLocal(_vR);
    _vMid.addVectors(_vL, _vR).multiplyScalar(0.5);
    charObj.chestCarryAnchor.position.set(
      _vMid.x,
      _vMid.y + (yOffset || 0),
      _vMid.z + (zOffset || 0)
    );
    charObj.chestCarryAnchor.rotation.set(rotX || 0, 0, 0);
  }

  function applyPose(charObj, poseName, t) {
    const s = charObj.scale || 1;
    const spec = charObj.spec;
    const grip = spec.grip || "none";

    // Clean Reset
    charObj.group.position.y = 0;
    charObj.upperBody.position.y = 0.94 * s;
    charObj.upperBody.rotation.set(0, 0, 0);
    charObj.headPivot.rotation.set(0, 0, 0);
    charObj.leftLeg.hip.rotation.set(0, 0, 0); charObj.leftLeg.knee.rotation.set(0, 0, 0);
    charObj.rightLeg.hip.rotation.set(0, 0, 0); charObj.rightLeg.knee.rotation.set(0, 0, 0);
    charObj.leftArm.shoulder.rotation.set(0, 0, 0); charObj.leftArm.elbow.rotation.set(-0.18, 0, 0);
    charObj.rightArm.shoulder.rotation.set(0, 0, 0); charObj.rightArm.elbow.rotation.set(-0.18, 0, 0);
    charObj.leftArm.socket.rotation.set(0, 0, 0);
    charObj.rightArm.socket.rotation.set(0, 0, 0);

    if (spec.role === "hero") {
      const drawn = poseName === "guard";
      if (charObj.mainProp) charObj.mainProp.visible = drawn;
      if (charObj.scabbardHilt) charObj.scabbardHilt.visible = !drawn;
    } else if (charObj.scabbardHilt) {
      charObj.scabbardHilt.visible = false;
    }

    function applyGripArms(extraReach) {
      const reach = extraReach || 0;
      if (grip === "carry") {
        // Forearms cradle the bottom of the bowl / plate / tray / bread cleanly!
        charObj.leftArm.shoulder.rotation.set(-0.42 - reach * 0.25, 0, -0.22);
        charObj.leftArm.elbow.rotation.x = -0.96;
        charObj.rightArm.shoulder.rotation.set(-0.42 - reach * 0.25, 0, 0.22);
        charObj.rightArm.elbow.rotation.x = -0.96;
        syncCarryToHands(charObj, 0.018 * s, 0.015 * s, 0);
      } else if (grip === "read") {
        // Open book / scroll sits cleanly ON TOP of both palms tilted toward eyes!
        charObj.leftArm.shoulder.rotation.set(-0.48 - reach * 0.22, 0, -0.24);
        charObj.leftArm.elbow.rotation.x = -1.02;
        charObj.rightArm.shoulder.rotation.set(-0.48 - reach * 0.22, 0, 0.24);
        charObj.rightArm.elbow.rotation.x = -1.02;
        syncCarryToHands(charObj, 0.02 * s, 0.01 * s, 0.36);
      } else if (grip === "instrument") {
        // Lute cradled against chest: left hand holds neck, right hand strums body!
        charObj.leftArm.shoulder.rotation.set(-0.62, 0, -0.14);
        charObj.leftArm.elbow.rotation.x = -1.02;
        charObj.rightArm.shoulder.rotation.set(-0.46, 0, 0.36);
        charObj.rightArm.elbow.rotation.x = -0.98;
        syncCarryToHands(charObj, -0.02 * s, -0.05 * s, 0);
      } else if (grip === "paint") {
        // Left hand holds colorful palette horizontally, right hand holds paintbrush ready!
        charObj.leftArm.shoulder.rotation.set(-0.46, 0, -0.1);
        charObj.leftArm.elbow.rotation.x = -1.04;
        charObj.leftArm.socket.rotation.set(1.5, 0, 0);
        charObj.rightArm.shoulder.rotation.set(-0.62, 0, 0.16);
        charObj.rightArm.elbow.rotation.x = -0.82;
        charObj.rightArm.socket.rotation.set(0.95, 0, 0);
      } else if (grip === "polearm") {
        charObj.rightArm.shoulder.rotation.set(-0.32, 0, -0.08);
        charObj.rightArm.elbow.rotation.x = -0.78;
        charObj.rightArm.socket.rotation.set(1.1, 0, 0.08);
      } else if (grip === "sword") {
        charObj.rightArm.shoulder.rotation.set(-0.36, 0, -0.06);
        charObj.rightArm.elbow.rotation.x = -0.68;
        charObj.rightArm.socket.rotation.set(0.95, 0, 0.06);
      } else if (grip === "staff") {
        charObj.rightArm.shoulder.rotation.set(-0.38, 0, -0.05);
        charObj.rightArm.elbow.rotation.x = -0.72;
        charObj.rightArm.socket.rotation.set(1.05, 0, 0.05);
      } else if (grip === "lantern") {
        charObj.rightArm.shoulder.rotation.set(-0.55, 0, -0.05);
        charObj.rightArm.elbow.rotation.x = -0.58;
        charObj.rightArm.socket.rotation.set(1.13, 0, 0.05);
      } else if (grip === "gentle" || grip === "tool") {
        charObj.rightArm.shoulder.rotation.set(-0.52, 0, 0.12);
        charObj.rightArm.elbow.rotation.x = -0.72;
        charObj.rightArm.socket.rotation.set(0.95, 0, 0);
      }
    }

    if (poseName === "idle") {
      charObj.upperBody.position.y = 0.94 * s + Math.sin(t * 2.0) * 0.006;
      charObj.headPivot.rotation.y = Math.sin(t * 0.8) * 0.07;
      applyGripArms(0);
    } else if (poseName === "walk") {
      const p = t * 6.8;
      const sL = Math.sin(p), sR = Math.sin(p + Math.PI);
      charObj.leftLeg.hip.rotation.x = -sL * 0.48;
      charObj.rightLeg.hip.rotation.x = -sR * 0.48;
      charObj.leftLeg.knee.rotation.x = Math.max(0, Math.cos(p - 0.35)) * 0.68;
      charObj.rightLeg.knee.rotation.x = Math.max(0, Math.cos(p + Math.PI - 0.35)) * 0.68;
      charObj.upperBody.rotation.y = sL * 0.055;
      charObj.leftArm.shoulder.rotation.x = sL * 0.38;
      charObj.leftArm.elbow.rotation.x = -0.18 - Math.max(0, -sL) * 0.5;
      charObj.rightArm.shoulder.rotation.x = sR * 0.38;
      charObj.rightArm.elbow.rotation.x = -0.18 - Math.max(0, -sR) * 0.5;
      applyGripArms(0);
    } else if (poseName === "kneel") {
      charObj.group.position.y = -0.33 * s;
      charObj.upperBody.rotation.x = 0.36;
      charObj.headPivot.rotation.x = 0.48;
      charObj.leftLeg.hip.rotation.x = -1.28; charObj.leftLeg.knee.rotation.x = 1.36;
      charObj.rightLeg.hip.rotation.x = 0.28; charObj.rightLeg.knee.rotation.x = 1.32;
      charObj.rightArm.shoulder.rotation.x = -0.5; charObj.rightArm.elbow.rotation.x = -0.75;
      charObj.leftArm.shoulder.rotation.x = -0.35; charObj.leftArm.elbow.rotation.x = -0.45;
    } else if (poseName === "guard") {
      charObj.group.position.y = -0.05 * s;
      charObj.leftLeg.hip.rotation.x = -0.28; charObj.leftLeg.knee.rotation.x = 0.32;
      charObj.rightLeg.hip.rotation.x = 0.24; charObj.rightLeg.knee.rotation.x = 0.26;
      charObj.upperBody.rotation.set(0.06, 0.14, 0);
      charObj.rightArm.shoulder.rotation.set(-0.92, 0, 0.42);
      charObj.rightArm.elbow.rotation.x = -0.72;
      charObj.leftArm.shoulder.rotation.set(-0.88, 0, -0.42);
      charObj.leftArm.elbow.rotation.x = -0.76;
      charObj.rightArm.socket.rotation.set(1.22, 0.15, -0.38);
    } else if (poseName === "salute") {
      charObj.rightArm.shoulder.rotation.set(-1.15, 0, 0.35);
      charObj.rightArm.elbow.rotation.x = -0.82;
      charObj.rightArm.socket.rotation.set(1.95, 0, -0.35);
      charObj.headPivot.rotation.x = 0.12;
    } else if (poseName === "pole_brace") {
      charObj.group.position.y = -0.06 * s;
      charObj.leftLeg.hip.rotation.x = -0.32; charObj.leftLeg.knee.rotation.x = 0.36;
      charObj.rightLeg.hip.rotation.x = 0.28; charObj.rightLeg.knee.rotation.x = 0.3;
      charObj.upperBody.rotation.y = 0.32;
      charObj.rightArm.shoulder.rotation.set(-0.45, 0, 0.12);
      charObj.rightArm.elbow.rotation.x = -0.85;
      charObj.leftArm.shoulder.rotation.set(-0.88, 0, -0.36);
      charObj.leftArm.elbow.rotation.x = -0.62;
      charObj.rightArm.socket.rotation.set(2.35, 0, 0.28);
    } else if (poseName === "row") {
      const r = Math.sin(t * 2.8);
      charObj.upperBody.rotation.x = 0.12 + r * 0.16;
      charObj.rightArm.shoulder.rotation.set(-0.75 + r * 0.38, 0, 0.22);
      charObj.rightArm.elbow.rotation.x = -0.65 - r * 0.25;
      charObj.leftArm.shoulder.rotation.set(-0.72 + r * 0.35, 0, -0.35);
      charObj.leftArm.elbow.rotation.x = -0.68 - r * 0.22;
      charObj.rightArm.socket.rotation.set(1.65 - r * 0.25, 0, 0.42);
    } else if (poseName === "play_lute") {
      applyGripArms(0);
      charObj.rightArm.elbow.rotation.x = -0.98 + Math.sin(t * 9.0) * 0.14;
      charObj.headPivot.rotation.z = Math.sin(t * 2.2) * 0.08;
    } else if (poseName === "decree") {
      applyGripArms(0);
      charObj.leftArm.shoulder.rotation.set(-1.05 + Math.sin(t * 2.2) * 0.08, 0, -0.25);
      charObj.leftArm.elbow.rotation.x = -0.35;
      charObj.headPivot.rotation.x = Math.sin(t * 1.5) * 0.05;
    } else if (poseName === "curtsy") {
      const b = 0.5 + 0.5 * Math.sin(t * 1.8);
      charObj.group.position.y = -0.14 * b * s;
      charObj.upperBody.rotation.x = 0.16 * b;
      charObj.headPivot.rotation.x = 0.15 * b;
      charObj.leftArm.shoulder.rotation.set(-0.2, 0, -0.35 * b);
      applyGripArms(0);
    } else if (poseName === "present") {
      const p = 0.5 + 0.5 * Math.sin(t * 2.0);
      charObj.upperBody.rotation.x = 0.07 * p;
      applyGripArms(p);
    } else if (poseName === "crouch") {
      charObj.group.position.y = -0.24 * s;
      charObj.leftLeg.hip.rotation.x = -1.15; charObj.leftLeg.knee.rotation.x = 1.45;
      charObj.rightLeg.hip.rotation.x = -1.15; charObj.rightLeg.knee.rotation.x = 1.45;
      charObj.upperBody.rotation.x = 0.22;
      applyGripArms(0);
    } else if (poseName === "work" || poseName === "inspect") {
      applyGripArms(0);
      charObj.rightArm.elbow.rotation.x = -0.78 + Math.sin(t * 5.2) * 0.2;
      charObj.rightArm.shoulder.rotation.z = 0.16 + Math.cos(t * 3.1) * 0.08;
      charObj.headPivot.rotation.x = 0.16;
    } else if (poseName === "bow") {
      const cyc = t % 2.6;
      if (cyc < 1.2) {
        const tap = Math.sin(cyc * Math.PI * 3.3);
        charObj.rightArm.shoulder.rotation.set(-0.95, 0, 0.42);
        charObj.rightArm.elbow.rotation.x = -1.15 - Math.max(0, tap) * 0.22;
      } else {
        const b = Math.sin(Math.min(1, (cyc - 1.2) / 1.2) * Math.PI);
        charObj.upperBody.rotation.x = b * 0.45;
        charObj.headPivot.rotation.x = b * 0.25;
      }
    } else if (poseName === "greet") {
      const b = 0.5 + 0.5 * Math.sin(t * 2.2);
      charObj.upperBody.rotation.x = 0.26 * b;
      charObj.headPivot.rotation.x = 0.15 * b;
      applyGripArms(0);
    }
  }

  global.CastleEscapeModels = {
    CHARACTER_SPECS: CHARACTER_SPECS,
    getAvailablePoses: getAvailablePoses,
    createCharacter: createCharacter,
    applyPose: applyPose
  };
})(window);
