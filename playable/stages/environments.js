/**
 * 王都からの脱出 — 全59地点 高精細3Dマップ・地下通路・屋外・接続廊下ライブラリ v3 (Three.js r128+)
 *
 * v3 改良点:
 *  - 全59室の扉を「実体ある3D接続廊下（廊下）」へ拡張。壁を実際に開口し、地区様式に合わせた廊下トンネル・照明・行先アーチを接続。
 *  - Q04 王家の抜け穴を本格的な「地下石造アーチ通路（地下通路）」へ刷新（半円ヴォールト天井・石リブ・排水溝・濡れ石畳・松明・青い誓灯・陶板の偽りの青空ニッチ・昇降階段）。
 *  - G06 舟遊び池の船を多部品のリアル木造和舟/小舟へ刷新（湾曲船体・肋骨・腰掛け・櫂とオール受け・舳先ランタン・桟橋と係留ロープ・波紋・睡蓮・葦・石橋）。
 *  - 屋外エリア(E05, G01-G07, Q05等)にグラデーション空ドーム・遠景城壁＆塔・多層枝葉ツリー・彫刻噴水・石畳・街灯を追加。
 *  - 室内インテリア（玉座・馬車・書棚・机・椅子・寝台・石像・星暦盤・鷺）を多部品＆CanvasTextureで高精細化。
 */
(function (global) {
  "use strict";

  const DISTRICT_THEMES = {
    C: { name: "中央宮", color: "#a8242e", bg: 0x1e1812, fog: 0x261e16, fogDensity: 0.015, floor: "#7e7264", wall: "#928472", accent: "#8f1b24", outdoor: false, lightColor: 0xffe2ad, hemiSky: 0xffe8c2, hemiGnd: 0x3b3026 },
    W: { name: "西の記録棟", color: "#34548a", bg: 0x18130e, fog: 0x211a13, fogDensity: 0.017, floor: "#695542", wall: "#857664", accent: "#2c4266", outdoor: false, lightColor: 0xffd79e, hemiSky: 0xffe0b5, hemiGnd: 0x362a20 },
    E: { name: "東の暮らしと舞台", color: "#9c354b", bg: 0x1a1516, fog: 0x241d1e, fogDensity: 0.016, floor: "#736050", wall: "#8c7d70", accent: "#782432", outdoor: false, lightColor: 0xffd9a8, hemiSky: 0xffe4c4, hemiGnd: 0x382d2a },
    N: { name: "北の学術・施療棟", color: "#2d7a70", bg: 0x171e24, fog: 0x202930, fogDensity: 0.015, floor: "#8d949c", wall: "#b4bcc4", accent: "#2f6b64", outdoor: false, lightColor: 0xeaf4ff, hemiSky: 0xdff0ff, hemiGnd: 0x3a434a },
    S: { name: "南の客舎と職場", color: "#9c6230", bg: 0x1c1712, fog: 0x261f18, fogDensity: 0.016, floor: "#756a5e", wall: "#8c7f70", accent: "#7d4b2a", outdoor: false, lightColor: 0xffdda6, hemiSky: 0xffe3b8, hemiGnd: 0x3b3128 },
    G: { name: "中庭と庭園", color: "#4c8a42", bg: 0x84b5e0, fog: 0xa0c8e8, fogDensity: 0.008, floor: "#4e7a44", wall: "#968c7e", accent: "#4c8cb8", outdoor: true, lightColor: 0xfff4d6, hemiSky: 0xc8e6ff, hemiGnd: 0x455c3c },
    B: { name: "地下の仕事場", color: "#4a6c8c", bg: 0x0d1016, fog: 0x12161e, fogDensity: 0.022, floor: "#454a54", wall: "#525864", accent: "#5e8fb0", outdoor: false, lightColor: 0xb8d4f0, hemiSky: 0x6b7c94, hemiGnd: 0x1e2229 },
    Q: { name: "王家の礼拝区と境界", color: "#d4a644", bg: 0x14161e, fog: 0x1a1d28, fogDensity: 0.016, floor: "#d2d4dc", wall: "#b8bcc7", accent: "#d9a944", outdoor: false, lightColor: 0xfff1d6, hemiSky: 0xe6ecff, hemiGnd: 0x363a45 }
  };

  // 全59地点（個別の間取り w/d/h、床・壁の個別配色、固有インテリア種別 kind）
  const CASTLE_LOCATIONS = [
    // 中央宮
    { id: "C01", d: "C", name: "玉座の間", w: 15, dLen: 18, h: 9.5, fl: "#7e7264", wl: "#948674", desc: "二回の呼びかけが響く赤い絨毯。客席と王座では織物の見え方が違う。", neighbors: ["C02"], kind: "throne" },
    { id: "C02", d: "C", name: "拝謁前室", w: 12, dLen: 10, h: 6.8, fl: "#7a6d5e", wl: "#998b79", desc: "侍従が客を整列させる。戸外の景色に見える物もここでは舞台幕。", neighbors: ["C01", "C03", "C05", "C07"], kind: "antechamber" },
    { id: "C03", d: "C", name: "紋章廊", w: 6.8, dLen: 16, h: 5.8, fl: "#74685b", wl: "#8c7d6b", desc: "式の違いを指でなぞれる浮き彫りが並ぶ。", neighbors: ["C02", "C04", "W03"], kind: "corridor_relief" },
    { id: "C04", d: "C", name: "楽師桟敷", w: 10, dLen: 8.5, h: 7.5, fl: "#614734", wl: "#7a6656", desc: "床から客席へ音がぬける。楽師の合図は光にも映る。", neighbors: ["C03", "E08"], kind: "gallery" },
    { id: "C05", d: "C", name: "衣装小部屋", w: 8.8, dLen: 8.8, h: 5.2, fl: "#664c38", wl: "#8a7866", desc: "稽古用の剣と客の礼装を別の箱に収める。", neighbors: ["C02", "C08", "E04"], kind: "wardrobe" },
    { id: "C06", d: "C", name: "客人談話室", w: 12, dLen: 11, h: 6.0, fl: "#735842", wl: "#9c8a72", desc: "城に呼ばれた者が席に残した走り書き。", neighbors: ["C07", "C08", "S02"], kind: "lounge" },
    { id: "C07", d: "C", name: "中央回廊", w: 15, dLen: 15, h: 7.8, fl: "#857a6c", wl: "#9c8f7d", desc: "東西南北と庭を結ぶ。床の色と壁の浮き彫りで方角を選べる。", neighbors: ["C02", "C06", "E02", "G02", "N02", "S05", "W01"], kind: "hub" },
    { id: "C08", d: "C", name: "客人寝室", w: 9.0, dLen: 8.5, h: 5.2, fl: "#6b503c", wl: "#a3927c", desc: "召喚客の荷を預かる。机には自分の文字でメモできる空きがある。", neighbors: ["C05", "C06", "S02"], kind: "bedroom" },

    // 西の記録棟
    { id: "W01", d: "W", name: "西資料室", w: 12, dLen: 12, h: 6.8, fl: "#5e4a38", wl: "#7d6d5c", desc: "貸出棚に移転後も使われている備品図がある。", neighbors: ["C07", "W02", "W05", "W06"], kind: "archive" },
    { id: "W02", d: "W", name: "織物回廊", w: 9.5, dLen: 15, h: 6.8, fl: "#695848", wl: "#827466", desc: "裏見台は短い日なたを横切る。表側の回廊は自由に歩ける。", neighbors: ["W01", "W03", "W08"], kind: "tapestry" },
    { id: "W03", d: "W", name: "肖像修復室", w: 10.5, dLen: 10, h: 6.2, fl: "#6b5642", wl: "#8f8170", desc: "王女の肖像と、裏打ち紙を傾けるための額台。", neighbors: ["C03", "W02", "W04", "W08"], kind: "portrait" },
    { id: "W04", d: "W", name: "香支度室", w: 8.5, dLen: 9.0, h: 5.4, fl: "#635449", wl: "#7a6c60", desc: "香車と当番盤がつながる。予約後に無音祈祷室の戸が開く。", neighbors: ["Q01", "W03"], kind: "incense" },
    { id: "W05", d: "W", name: "写字室", w: 11, dLen: 10, h: 5.8, fl: "#614d3b", wl: "#8a7b69", desc: "城内の誰がどの言葉を書いたか、手つきの跡が残る。", neighbors: ["W01", "W07"], kind: "scriptorium" },
    { id: "W06", d: "W", name: "地図架室", w: 11, dLen: 11, h: 6.5, fl: "#59483a", wl: "#756758", desc: "地図を年代別に吊るす。退出先の「外」が敷地外を指すとは限らない。", neighbors: ["B06", "N08", "W01", "W07"], kind: "maproom" },
    { id: "W07", d: "W", name: "製本台の間", w: 10, dLen: 9.5, h: 5.5, fl: "#664f3b", wl: "#82715e", desc: "裁ち紙が箱の底に再利用される。", neighbors: ["B06", "W05", "W06"], kind: "bindery" },
    { id: "W08", d: "W", name: "壁画足場", w: 10, dLen: 12, h: 9.2, fl: "#5e5042", wl: "#7a6e60", desc: "高い足場から絵の継ぎ目を調べられる。", neighbors: ["G03", "W02", "W03"], kind: "scaffold" },

    // 東の暮らしと舞台
    { id: "E01", d: "E", name: "洗濯仕分け場", w: 11.5, dLen: 10, h: 5.8, fl: "#6d747a", wl: "#8f9499", desc: "干し台の表に当日の衣類、裏に古い印が残る。", neighbors: ["E02", "E04", "E05"], kind: "laundry" },
    { id: "E02", d: "E", name: "東廊下", w: 6.8, dLen: 15, h: 5.6, fl: "#6e5d4f", wl: "#877668", desc: "舞台の返却品が入る星箱が壁際にある。", neighbors: ["C07", "E01", "E06", "E07"], kind: "east_hall" },
    { id: "E03", d: "E", name: "王家の鳩舎", w: 10.5, dLen: 10.5, h: 5.0, fl: "#7a6b58", wl: "#8f806e", desc: "世話道具の棚の上に王女専用の返書筒が残る。", neighbors: ["E05", "N06"], kind: "dovecote", outdoor: true },
    { id: "E04", d: "E", name: "衣装繕い室", w: 10, dLen: 9.5, h: 5.4, fl: "#6e5648", wl: "#948074", desc: "縁の縫い方と裏地で持ち主の仕事を読む。", neighbors: ["C05", "E01", "E06"], kind: "sewing" },
    { id: "E05", d: "E", name: "物干し屋根", w: 13.5, dLen: 12.5, h: 4.5, fl: "#8c5f4c", wl: "#8f8070", desc: "屋根には風向き旗と鳩のための雨覆い。", neighbors: ["E01", "E03", "G03"], kind: "rooftop", outdoor: true },
    { id: "E06", d: "E", name: "舞台倉", w: 11, dLen: 11, h: 6.4, fl: "#59483d", wl: "#706055", desc: "衣装箱の中に舞台用の宝箱や道具が紛れる。", neighbors: ["B05", "E02", "E04", "E08"], kind: "propstore" },
    { id: "E07", d: "E", name: "東詰所", w: 10, dLen: 9.5, h: 5.4, fl: "#6c6d73", wl: "#85827c", desc: "立入線の外に遺失物の受け渡し窓がある。", neighbors: ["E02", "S05"], kind: "guardpost" },
    { id: "E08", d: "E", name: "小劇場", w: 14, dLen: 14, h: 8.2, fl: "#543b30", wl: "#6e4648", desc: "客席、舞台袖、巻き上げ幕が一つの部屋を分ける。", neighbors: ["B05", "C04", "E06"], kind: "theatre" },

    // 北の学術・施療棟
    { id: "N01", d: "N", name: "窯見本室", w: 11, dLen: 11, h: 6.2, fl: "#757370", wl: "#948e88", desc: "釉薬の色が似ていても、縁と溝は違う。", neighbors: ["N02", "N05"], kind: "kiln" },
    { id: "N02", d: "N", name: "施療院", w: 12, dLen: 11, h: 5.8, fl: "#aeb6bd", wl: "#d0d7de", desc: "首輪の印に対応する救護札と、召喚者の経過を収めた棚。", neighbors: ["C07", "N01", "N04", "N07"], kind: "infirmary" },
    { id: "N03", d: "N", name: "星暦室", w: 12, dLen: 12, h: 8.0, fl: "#262d47", wl: "#323b5c", desc: "王家が使った冬至の星穴盤が残る。", neighbors: ["N06", "N08"], kind: "astro" },
    { id: "N04", d: "N", name: "薬草乾燥室", w: 9.5, dLen: 9.5, h: 5.6, fl: "#6b6150", wl: "#999382", desc: "乾燥紐の高さが薬草の用途を示す。", neighbors: ["N02", "N07"], kind: "herbs" },
    { id: "N05", d: "N", name: "鐘鋳場", w: 12, dLen: 12, h: 8.5, fl: "#5c5a58", wl: "#736e6a", desc: "音が出る前の鐘が並び、鋳肌に作り手の印がある。", neighbors: ["B03", "N01", "N08"], kind: "foundry" },
    { id: "N06", d: "N", name: "天文露台", w: 13.5, dLen: 13.5, h: 4.5, fl: "#6a7180", wl: "#8a92a1", desc: "風向きと星穴を同時に読める。", neighbors: ["E03", "G04", "N03"], kind: "observatory", outdoor: true },
    { id: "N07", d: "N", name: "療養温室", w: 11, dLen: 10, h: 6.2, fl: "#9ca89e", wl: "#c2d6cb", desc: "低い寝台から届く高さに花の窓がある。", neighbors: ["G07", "N02", "N04"], kind: "conservatory" },
    { id: "N08", d: "N", name: "標本廊", w: 7.2, dLen: 15, h: 6.0, fl: "#90979e", wl: "#b4bcc4", desc: "材料見本と、王家の古い図形見本を保管する。", neighbors: ["N03", "N05", "W06"], kind: "specimen" },

    // 南の客舎と職場
    { id: "S01", d: "S", name: "南返納庫", w: 9.0, dLen: 9.0, h: 5.4, fl: "#6e6256", wl: "#827568", desc: "布と焼き物の二つの照合札で引き出す旧式の箱。", neighbors: ["S05", "S08"], kind: "returnvault" },
    { id: "S02", d: "S", name: "冬客間", w: 10.5, dLen: 10, h: 5.5, fl: "#6b4e38", wl: "#a69276", desc: "子供部屋から移した背くらべ柱だけ壁紙が薄い。", neighbors: ["C06", "C08", "S06"], kind: "winterroom" },
    { id: "S03", d: "S", name: "鐘番室", w: 9.5, dLen: 9.5, h: 6.2, fl: "#6b635a", wl: "#857c72", desc: "巡回環を貸し出す当番盤と時刻の刻み。", neighbors: ["S04", "S05"], kind: "bellroom" },
    { id: "S04", d: "S", name: "南門検札所", w: 12, dLen: 13, h: 7.5, fl: "#706a62", wl: "#878077", desc: "礼法が通るのは内側の検札線まで。外扉は常に閉じる。", neighbors: ["S03", "S05"], kind: "southgate" },
    { id: "S05", d: "S", name: "城内の馬車待ち場", w: 15, dLen: 14, h: 4.5, fl: "#7a7368", wl: "#948b7e", desc: "外の町が見えても、検札所とすべての馬車は敷地内にある。", neighbors: ["C07", "E07", "G02", "S01", "S03", "S04", "S06"], kind: "carriageyard", outdoor: true },
    { id: "S06", d: "S", name: "宴会厨房", w: 13, dLen: 11, h: 6.0, fl: "#756a60", wl: "#9c8f80", desc: "地下から配膳し、欠けた食器は別棚へ返す。", neighbors: ["B07", "S02", "S05", "S07", "S08"], kind: "kitchen" },
    { id: "S07", d: "S", name: "パン窯室", w: 10.5, dLen: 10, h: 5.6, fl: "#7d6755", wl: "#9e8670", desc: "余熱で菓子を焼く夜番の作業場。", neighbors: ["B04", "S06"], kind: "bakery" },
    { id: "S08", d: "S", name: "食器棚室", w: 9.5, dLen: 10, h: 5.6, fl: "#705d4c", wl: "#917f6e", desc: "印の違う皿と、贈り物の箱を分けて保管する。", neighbors: ["B07", "S01", "S06"], kind: "pantry" },

    // 中庭と庭園
    { id: "G01", d: "G", name: "雨量庭園", w: 13.5, dLen: 13.5, h: 4.5, fl: "#4c7844", wl: "#91897d", desc: "旧雨量計の鷺は左脚の水を抜くと預かり筒が開く。", neighbors: ["B01", "G02", "G05"], kind: "raingarden", outdoor: true },
    { id: "G02", d: "G", name: "中庭の噴水", w: 15.5, dLen: 15.5, h: 4.5, fl: "#857d70", wl: "#9c9386", desc: "地上の四方を見比べられる。水の出口はすべて庭の循環池。", neighbors: ["C07", "G01", "G03", "G04", "G06", "S05"], kind: "fountain", outdoor: true },
    { id: "G03", d: "G", name: "果樹回廊", w: 10.5, dLen: 15.5, h: 4.5, fl: "#567d46", wl: "#8f8679", desc: "物干しの影が枝と重なる。", neighbors: ["E05", "G02", "G05", "G07", "W08"], kind: "orchard", outdoor: true },
    { id: "G04", d: "G", name: "日時計庭", w: 13.5, dLen: 13.5, h: 4.5, fl: "#8c8475", wl: "#999082", desc: "光と石の切り欠きで時刻を比べられる。", neighbors: ["G02", "G06", "N06"], kind: "sundial", outdoor: true },
    { id: "G05", d: "G", name: "庭師小屋", w: 8.8, dLen: 8.8, h: 4.8, fl: "#5c4a38", wl: "#6e553e", desc: "道具を形で返す棚と、過去の水量帳。", neighbors: ["G01", "G03", "G06"], kind: "shed" },
    { id: "G06", d: "G", name: "舟遊び池", w: 16.5, dLen: 15.5, h: 4.5, fl: "#4a7542", wl: "#8f877b", desc: "舟は城内の池だけを往復する。", neighbors: ["G02", "G04", "G05", "G07"], kind: "pond", outdoor: true },
    { id: "G07", d: "G", name: "回転温棚", w: 11, dLen: 11, h: 6.4, fl: "#6e7d6c", wl: "#a6baa4", desc: "日を追って鉢棚が回り、葉の裏の印が見える。", neighbors: ["G03", "G06", "N07"], kind: "rotarygreenhouse" },

    // 地下の仕事場
    { id: "B01", d: "B", name: "旧水位室", w: 10.5, dLen: 10.5, h: 6.0, fl: "#3e4652", wl: "#4f5866", desc: "目盛板の裏に昔の事故名が刻まれた。", neighbors: ["B02", "B03", "G01"], kind: "cistern" },
    { id: "B02", d: "B", name: "貯氷室", w: 10.5, dLen: 10.5, h: 5.5, fl: "#4c5c6e", wl: "#5b6d82", desc: "春の氷を夏まで包む。入口から救護の呼び紐が届く。", neighbors: ["B01", "B04", "B07"], kind: "icevault" },
    { id: "B03", d: "B", name: "からくり工房", w: 11, dLen: 10, h: 5.6, fl: "#4d4640", wl: "#615952", desc: "壊れた水鳥や鐘の部品を試す場所。", neighbors: ["B01", "B05", "N05"], kind: "clockwork" },
    { id: "B04", d: "B", name: "古い給茶室", w: 10, dLen: 9.5, h: 5.0, fl: "#59483b", wl: "#705d4e", desc: "見舞い客が和解の茶を用意する。", neighbors: ["B02", "B07", "S07"], kind: "tearoom" },
    { id: "B05", d: "B", name: "舞台奈落", w: 12, dLen: 12, h: 8.2, fl: "#3b3532", wl: "#4d4540", desc: "迫り台は舞台までの垂直移動用で、城外には続かない。", neighbors: ["B03", "B07", "E06", "E08"], kind: "understage" },
    { id: "B06", d: "B", name: "帳票庫", w: 10.5, dLen: 10.5, h: 5.4, fl: "#4a433d", wl: "#5e564f", desc: "書き換え前の受領控えと廃棄寸前の手紙。", neighbors: ["B07", "W06", "W07"], kind: "ledgervault" },
    { id: "B07", d: "B", name: "地下配膳廊", w: 6.8, dLen: 16, h: 4.8, fl: "#4a4e54", wl: "#5c6066", desc: "氷と料理の運搬路。行き着く先は城内の食器棚。", neighbors: ["B02", "B04", "B05", "B06", "S06", "S08"], kind: "servicecorridor" },

    // 王家の礼拝区と境界
    { id: "Q01", d: "Q", name: "無音祈祷室", w: 8.8, dLen: 8.8, h: 5.8, fl: "#9fa3b0", wl: "#787c8a", desc: "香車の予約で開く。扉を閉めると留め金の音も漏れない。", neighbors: ["Q02", "W04"], kind: "silentchapel" },
    { id: "Q02", d: "Q", name: "白礼拝廊", w: 7.4, dLen: 17, h: 6.8, fl: "#c8cbd4", wl: "#d6d9e3", desc: "番のいる中央の白床と、無人時間に渡れる白百合の縁。", neighbors: ["Q01", "Q03"], kind: "whitecorridor" },
    { id: "Q03", d: "Q", name: "旧礼拝堂", w: 13, dLen: 13, h: 8.2, fl: "#b5b8c2", wl: "#9ea2ad", desc: "冠なき像の背に、遠方から持ってきた覗き錘が収まる。", neighbors: ["Q02", "Q04"], kind: "oldchapel" },
    { id: "Q04", d: "Q", name: "王家の抜け穴（地下通路）", w: 5.4, dLen: 17, h: 4.4, fl: "#383a40", wl: "#474a52", desc: "旧礼拝堂の床下から続く石造アーチの地下通路。途中に偽りの青空陶板と青い誓灯がある。", neighbors: ["Q03", "Q05"], kind: "secretpassage", underground: true },
    { id: "Q05", d: "Q", name: "境石と外の草地", w: 16.5, dLen: 16.5, h: 4.5, fl: "#4d8242", wl: "#968e82", desc: "地下通路出口の先にある境石。内側の靴跡と外側の野草を踏み越えた瞬間が終点。", neighbors: ["Q04"], kind: "boundary", outdoor: true }
  ];

  // =========================================================================
  // テクスチャキャッシュ（石・木・芝・空・水面・絨毯・陶板・行先プレート）
  // =========================================================================
  const texCache = {};
  function getStoneTex(baseHex, lineHex, rx, ry, mossy) {
    const key = "st3|" + baseHex + "|" + lineHex + "|" + rx + "|" + ry + "|" + (mossy ? 1 : 0);
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1100; i++) {
      g.fillStyle = (i % 2 === 0) ? "rgba(255,248,235,0.045)" : "rgba(15,12,10,0.08)";
      g.fillRect((i * 73) % 256, (i * 139) % 256, 3, 3);
    }
    if (mossy) {
      for (let m = 0; m < 18; m++) {
        g.fillStyle = "rgba(44,74,48,0.18)";
        g.beginPath(); g.arc((m * 59) % 256, (m * 89) % 256, 12 + (m % 16), 0, Math.PI * 2); g.fill();
      }
    }
    g.strokeStyle = lineHex || "rgba(28,22,16,0.34)"; g.lineWidth = 3;
    for (let r = 0; r < 4; r++) {
      const y = r * 64; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
      const off = (r % 2) * 32;
      for (let col = 0; col <= 4; col++) {
        const x = (col * 64 + off) % 256;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(rx || 4, ry || 4);
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function getWoodTex(baseHex, rx, ry) {
    const key = "wd3|" + baseHex + "|" + rx + "|" + ry;
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex || "#593822"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 64; i++) {
      g.fillStyle = i % 2 === 0 ? "rgba(25,14,6,0.18)" : "rgba(130,86,48,0.12)";
      g.fillRect(0, i * 4, 256, 2);
    }
    g.strokeStyle = "rgba(20,10,4,0.45)"; g.lineWidth = 2;
    for (let p = 0; p < 4; p++) { g.beginPath(); g.moveTo(0, p * 64); g.lineTo(256, p * 64); g.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(rx || 2, ry || 2);
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function getGrassTex(baseHex, rx, ry) {
    const key = "gr3|" + baseHex + "|" + rx + "|" + ry;
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = baseHex || "#4a7840"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) {
      const x = (i * 97) % 256, y = (i * 151) % 256;
      g.fillStyle = (i % 3 === 0) ? "rgba(120,175,88,0.22)" : (i % 3 === 1 ? "rgba(38,68,30,0.2)" : "rgba(150,192,102,0.16)");
      g.fillRect(x, y, 2, 6);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(rx || 5, ry || 5);
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function getSkyDomeTex() {
    if (texCache.skydome) return texCache.skydome;
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#3d7ec7"); gr.addColorStop(0.45, "#78b4e6");
    gr.addColorStop(0.78, "#cde6f7"); gr.addColorStop(1, "#e8f2f5");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    // Soft painted clouds
    for (let i = 0; i < 18; i++) {
      const cx = (i * 71 + 20) % 512, cy = 80 + (i % 4) * 26;
      const cg = g.createRadialGradient(cx, cy, 4, cx, cy, 44);
      cg.addColorStop(0, "rgba(255,255,255,0.65)"); cg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = cg; g.beginPath(); g.ellipse(cx, cy, 48, 18, 0, 0, Math.PI * 2); g.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache.skydome = tex;
    return tex;
  }

  function getFakeSkyTileTex() {
    if (texCache.fakesky) return texCache.fakesky;
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#4e9ee0"); gr.addColorStop(1, "#a8dcf5");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "rgba(255,255,255,0.72)";
    g.beginPath(); g.arc(82, 110, 28, 0, Math.PI * 2); g.arc(110, 105, 34, 0, Math.PI * 2); g.arc(140, 112, 24, 0, Math.PI * 2); g.fill();
    // Ceramic tile grout grid so it reads as ceramic tiles inside the tunnel
    g.strokeStyle = "rgba(45,62,78,0.45)"; g.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache.fakesky = tex;
    return tex;
  }

  function getDoorSignTex(targetId, targetName, badgeColor) {
    const key = "sign3|" + targetId;
    if (texCache[key]) return texCache[key];
    const c = document.createElement("canvas"); c.width = 320; c.height = 72;
    const g = c.getContext("2d");
    g.fillStyle = "#161b29"; g.fillRect(0, 0, 320, 72);
    g.fillStyle = badgeColor || "#d9a944"; g.fillRect(0, 0, 16, 72); g.fillRect(304, 0, 16, 72);
    g.strokeStyle = "#e8c46b"; g.lineWidth = 3; g.strokeRect(3, 3, 314, 66);
    g.fillStyle = "#ffe8ad"; g.font = "bold 22px sans-serif"; g.textAlign = "center";
    g.fillText(targetName, 160, 44, 278);
    const tex = new THREE.CanvasTexture(c);
    tex.castleShared = true;
    texCache[key] = tex;
    return tex;
  }

  function getCarpetTex() {
    if (texCache.carpet) return texCache.carpet;
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "#6e1319"); gr.addColorStop(0.5, "#a3202a"); gr.addColorStop(1, "#6e1319");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#d9a944"; g.fillRect(14, 0, 10, 256); g.fillRect(232, 0, 10, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 5);
    tex.castleShared = true;
    texCache.carpet = tex;
    return tex;
  }

  // 方角別に扉の壁面（N / S / W / E）を決定
  function assignDoorSide(curLoc, targetLoc) {
    if (!targetLoc) return "S";
    // 王家の礼拝区〜地下通路〜境界門は南北に一直線につなげる
    if (curLoc.id === "Q04") return targetLoc.id === "Q05" ? "N" : "S";
    if (curLoc.id === "Q05") return "S";
    if (curLoc.id === "Q02") return targetLoc.id === "Q03" ? "N" : "S";
    if (curLoc.id === "Q03") return targetLoc.id === "Q04" ? "N" : "S";
    if (curLoc.id === "C01") return "S";
    if (curLoc.id === "E08" && targetLoc.id === "C04") return "W";
    if (curLoc.id === "W01" && targetLoc.id === "C07") return "E";
    if (curLoc.id === "B07") {
      return { B02: "W", B04: "W", B05: "E", B06: "E", S06: "S", S08: "N" }[targetLoc.id];
    }
    if (targetLoc.d === "N") return "N";
    if (targetLoc.d === "S") return "S";
    if (targetLoc.d === "W" || targetLoc.d === "Q") return "W";
    if (targetLoc.d === "E") return "E";
    if (targetLoc.d === "G") return "N";
    if (targetLoc.d === "B") return "S";
    return targetLoc.id < curLoc.id ? "N" : "S";
  }

  // =========================================================================
  // 59地点 3D環境ビルダー createEnvironment(locId, options)
  // =========================================================================
  function createEnvironment(locId, options) {
    const loc = CASTLE_LOCATIONS.find(function (l) { return l.id === locId; }) || CASTLE_LOCATIONS[0];
    const theme = DISTRICT_THEMES[loc.d] || DISTRICT_THEMES.C;
    const isOutdoor = !!(loc.outdoor || theme.outdoor);
    const isUnderground = !!(loc.underground || loc.d === "B");
    const envMap = options && options.envMap ? options.envMap : null;

    const root = new THREE.Group();
    const animators = [];
    const corridorPortals = [];
    const W = loc.w || 11;
    const D = loc.dLen || 11;
    const H = loc.h || 6.0;

    // 共通マテリアル
    const flHex = loc.fl || theme.floor;
    const wlHex = loc.wl || theme.wall;
    const floorMat = new THREE.MeshStandardMaterial({
      map: isOutdoor && (loc.kind === "pond" || loc.kind === "orchard" || loc.kind === "raingarden" || loc.kind === "boundary")
        ? getGrassTex(flHex, Math.round(W / 2.2), Math.round(D / 2.2))
        : getStoneTex(flHex, "rgba(25,20,15,0.28)", Math.round(W / 2.4), Math.round(D / 2.4), isUnderground),
      roughness: isUnderground ? 0.68 : 0.88
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: getStoneTex(wlHex, "rgba(28,22,16,0.34)", Math.round(W / 2.5), Math.round(H / 2.2), isUnderground),
      roughness: isUnderground ? 0.84 : 0.86
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x7a7062, map: getStoneTex("#7a7062", "rgba(20,16,12,0.3)", 2, 2), roughness: 0.78 });
    const woodMat = new THREE.MeshStandardMaterial({ map: getWoodTex("#5c3a22", 2, 2), roughness: 0.74 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ map: getWoodTex("#331e10", 2, 2), roughness: 0.78 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6b848, roughness: 0.24, metalness: 0.88, envMap: envMap });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc49538, roughness: 0.3, metalness: 0.82, envMap: envMap });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x383d46, roughness: 0.44, metalness: 0.82, envMap: envMap });
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x8f1821, roughness: 0.76 });
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xe6e7ec, roughness: 0.42 });
    const linenMat = new THREE.MeshStandardMaterial({ color: 0xeae2d0, roughness: 0.86 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2d7d96, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.88, envMap: envMap });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xc8ebff, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.42, envMap: envMap });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc864 });

    function addSolid(node, shape = true) {
      node.userData.walkObstacle = shape;
      root.add(node);
    }

    // 1. 地面・床
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    root.add(floor);

    // 2. 扉配置の事前振り分け（壁を開口して3D接続廊下を生やすため）
    const sideBuckets = { N: [], S: [], W: [], E: [] };
    loc.neighbors.forEach(function (nid) {
      const tLoc = CASTLE_LOCATIONS.find(function (x) { return x.id === nid; });
      const side = assignDoorSide(loc, tLoc);
      sideBuckets[side].push({ id: nid, loc: tLoc });
    });

    const DOOR_W = 2.4;
    const DOOR_H = isOutdoor ? 3.2 : Math.min(3.4, H - 0.9);
    const CORR_LEN = 5.6;

    // ヘルパー: 1枚の壁を開口付きで分割生成（ドア部分が抜けて廊下とつながる）
    function buildWallWithOpenings(side, totalLen, wallH, wallPos, rotY, entries) {
      const wallThick = 0.42;
      const spacing = Math.min(3.5, (totalLen - 2.2) / Math.max(1, entries.length));
      const openings = entries.map(function (ent, idx) {
        const off = entries.length === 1 ? 0 : (idx - (entries.length - 1) / 2) * spacing;
        return { ent: ent, off: off };
      }).sort(function (a, b) { return a.off - b.off; });

      // Solid wall segments between openings
      let cursor = -totalLen / 2;
      openings.forEach(function (op) {
        const leftEdge = op.off - DOOR_W / 2;
        const rightEdge = op.off + DOOR_W / 2;
        if (leftEdge > cursor + 0.05) {
          const segW = leftEdge - cursor;
          const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, wallH, wallThick), wallMat);
          const center = (cursor + leftEdge) / 2;
          if (side === "N" || side === "S") seg.position.set(center, wallH / 2, wallPos);
          else seg.position.set(wallPos, wallH / 2, center);
          seg.rotation.y = rotY;
          addSolid(seg);
        }
        // Header above doorway
        if (wallH > DOOR_H + 0.15) {
          const headH = wallH - DOOR_H;
          const head = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.12, headH, wallThick), wallMat);
          if (side === "N" || side === "S") head.position.set(op.off, DOOR_H + headH / 2, wallPos);
          else head.position.set(wallPos, DOOR_H + headH / 2, op.off);
          head.rotation.y = rotY;
          root.add(head);
        }
        cursor = rightEdge;
      });
      if (totalLen / 2 > cursor + 0.05) {
        const segW = totalLen / 2 - cursor;
        const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, wallH, wallThick), wallMat);
        const center = (cursor + totalLen / 2) / 2;
        if (side === "N" || side === "S") seg.position.set(center, wallH / 2, wallPos);
        else seg.position.set(wallPos, wallH / 2, center);
        seg.rotation.y = rotY;
        addSolid(seg);
      }

      // Build actual 3D connecting corridors extending outward from each doorway!
      openings.forEach(function (op) {
        buildConnectedCorridor(side, op.off, wallPos, op.ent);
      });
    }

    // ヘルパー: 3D接続廊下（アーチ枠・行先プレート・廊下本体・壁灯・奥の接続門）
    function buildConnectedCorridor(side, off, wallPos, ent) {
      const targetLoc = ent.loc;
      const targetTheme = targetLoc ? DISTRICT_THEMES[targetLoc.d] : theme;
      const isTargetUnder = !!(targetLoc && (targetLoc.underground || targetLoc.d === "B"));
      const corrUnder = isUnderground || isTargetUnder;
      const cg = new THREE.Group();

      // Local coordinates of cg: +Z points INTO the corridor (away from room center)
      let dirX = 0, dirZ = 0;
      if (side === "N") { cg.position.set(off, 0, wallPos); cg.rotation.y = Math.PI; dirZ = -1; }
      else if (side === "S") { cg.position.set(off, 0, wallPos); cg.rotation.y = 0; dirZ = 1; }
      else if (side === "W") { cg.position.set(wallPos, 0, off); cg.rotation.y = -Math.PI / 2; dirX = -1; }
      else { cg.position.set(wallPos, 0, off); cg.rotation.y = Math.PI / 2; dirX = 1; }

      const cW = DOOR_W + 0.25;
      const cH = DOOR_H + 0.25;
      const cWallMat = new THREE.MeshStandardMaterial({
        map: getStoneTex(corrUnder ? "#454850" : (targetLoc ? targetLoc.wl : wlHex), "rgba(22,18,14,0.36)", 3, 2, corrUnder),
        roughness: 0.85
      });
      const cFloorMat = new THREE.MeshStandardMaterial({
        map: getStoneTex(corrUnder ? "#363840" : (targetLoc ? targetLoc.fl : flHex), "rgba(22,18,14,0.3)", 2, 4, corrUnder),
        roughness: corrUnder ? 0.65 : 0.86
      });

      // Doorway stone archway jambs & district-colored lintel on room side
      [-DOOR_W / 2 - 0.14, DOOR_W / 2 + 0.14].forEach(function (jx) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.3, DOOR_H + 0.2, 0.56), trimMat);
        jamb.position.set(jx, (DOOR_H + 0.2) / 2, 0); cg.add(jamb); jamb.userData.walkObstacle = true;
      });
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(DOOR_W + 0.64, 0.34, 0.6),
        new THREE.MeshStandardMaterial({ color: targetTheme.color, roughness: 0.55 })
      );
      lintel.position.set(0, DOOR_H + 0.15, 0); cg.add(lintel);

      // Room-facing 3D destination signboard
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.15, 0.48),
        new THREE.MeshBasicMaterial({ map: getDoorSignTex(ent.id, targetLoc ? targetLoc.name : "", targetTheme.color) })
      );
      sign.rotation.y = Math.PI;
      sign.position.set(0, DOOR_H + 0.56, -0.26);
      cg.add(sign);

      // Corridor floor + optional red/district runner rug
      const cFloor = new THREE.Mesh(new THREE.PlaneGeometry(cW, CORR_LEN), cFloorMat);
      cFloor.rotation.x = -Math.PI / 2; cFloor.position.set(0, 0.01, CORR_LEN / 2); cg.add(cFloor);
      if (!corrUnder && !isOutdoor) {
        const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.15, CORR_LEN), new THREE.MeshStandardMaterial({ color: targetTheme.accent, roughness: 0.82 }));
        runner.rotation.x = -Math.PI / 2; runner.position.set(0, 0.025, CORR_LEN / 2); cg.add(runner);
      }

      // Corridor side walls (or colonnade pillars for garden outdoor passages)
      const gardenColonnade = isOutdoor && targetLoc && targetLoc.outdoor && !corrUnder;
      if (gardenColonnade) {
        // Stone garden colonnade + wooden pergola beams
        for (let cz = 1.4; cz <= CORR_LEN - 0.6; cz += 1.9) {
          [-cW / 2, cW / 2].forEach(function (cx) {
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, cH - 0.2, 10), trimMat);
            col.position.set(cx, (cH - 0.2) / 2, cz); cg.add(col); col.userData.walkObstacle = "round";
          });
          const beam = new THREE.Mesh(new THREE.BoxGeometry(cW + 0.4, 0.16, 0.2), woodMat);
          beam.position.set(0, cH - 0.12, cz); cg.add(beam);
        }
      } else {
        [-cW / 2 - 0.14, cW / 2 + 0.14].forEach(function (cx) {
          const sw = new THREE.Mesh(new THREE.BoxGeometry(0.28, cH, CORR_LEN), cWallMat);
          sw.position.set(cx, cH / 2, CORR_LEN / 2); cg.add(sw);
        });
        // Vaulted stone arch ribs & ceiling
        const vault = new THREE.Mesh(
          new THREE.CylinderGeometry(cW / 2 + 0.1, cW / 2 + 0.1, CORR_LEN, 14, 1, true, 0, Math.PI),
          cWallMat
        );
        vault.rotation.z = Math.PI / 2; vault.rotation.y = Math.PI / 2;
        vault.position.set(0, cH - 0.55, CORR_LEN / 2);
        vault.material = cWallMat.clone(); vault.material.side = THREE.BackSide;
        cg.add(vault);

        for (let rz = 1.5; rz <= CORR_LEN - 1.0; rz += 2.2) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(cW / 2, 0.11, 8, 16, Math.PI), trimMat);
          rib.position.set(0, cH - 0.55, rz); cg.add(rib);
          // Warm glowing wall sconce inside corridor
          [-cW / 2 + 0.08, cW / 2 - 0.08].forEach(function (sx) {
            const brk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), ironMat);
            brk.position.set(sx, 2.05, rz); cg.add(brk);
            const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), flameMat);
            fl.position.set(sx + (sx < 0 ? 0.08 : -0.08), 2.24, rz); cg.add(fl);
          });
        }
      }

      // Far end destination doorway portal (clickable in 3D!)
      const portalGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(cW - 0.3, cH - 0.3),
        new THREE.MeshBasicMaterial({ color: targetTheme.color, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
      );
      portalGlow.position.set(0, (cH - 0.3) / 2, CORR_LEN - 0.08);
      portalGlow.userData.targetRoomId = ent.id;
      cg.add(portalGlow);

      // Invisible clickable hit-plane at corridor entrance too
      const hitPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(DOOR_W, DOOR_H),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
      );
      hitPlane.position.set(0, DOOR_H / 2, 0.2);
      hitPlane.userData.targetRoomId = ent.id;
      cg.add(hitPlane);

      const farSign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 0.42),
        new THREE.MeshBasicMaterial({ map: getDoorSignTex(ent.id, targetLoc ? targetLoc.name : "", targetTheme.color) })
      );
      farSign.rotation.y = Math.PI;
      farSign.position.set(0, cH - 0.5, CORR_LEN - 0.12);
      cg.add(farSign);

      const barrier = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, .24), darkWoodMat);
      barrier.position.set(0, DOOR_H / 2, .22);
      barrier.visible = false;
      cg.add(barrier);

      root.add(cg);
      corridorPortals.push({
        targetId: ent.id,
        targetName: targetLoc ? targetLoc.name : ent.id,
        side: side,
        entryX: (side === "N" || side === "S") ? off : wallPos,
        entryZ: (side === "N" || side === "S") ? wallPos : off,
        dirX: dirX,
        dirZ: dirZ,
        length: CORR_LEN,
        width: DOOR_W,
        barrier: barrier,
        hitMeshes: [hitPlane, portalGlow]
      });
    }

    // 3. 部屋の構造（地下通路 Q04 / 屋外 / 通常室内）
    if (loc.kind === "secretpassage") {
      // Q04 王家の抜け穴: 本格的な「地下石造アーチ通路（地下通路）」
      const archR = W / 2;
      const sideH = H * 0.52;
      // Left & right damp stone walls
      [-W / 2, W / 2].forEach(function (wx) {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(0.5, sideH, D), wallMat);
        sw.position.set(wx, sideH / 2, 0); addSolid(sw);
      });
      // Full-length semi-cylindrical vaulted stone tunnel ceiling
      const tunnelCeilingMat = wallMat.clone(); tunnelCeilingMat.side = THREE.BackSide;
      const vault = new THREE.Mesh(new THREE.CylinderGeometry(archR, archR, D, 20, 1, true, 0, Math.PI), tunnelCeilingMat);
      vault.rotation.z = Math.PI / 2; vault.rotation.y = Math.PI / 2;
      vault.position.set(0, sideH, 0); root.add(vault);

      // Heavy carved stone rib arches + iron wall torches every 2.8m
      for (let rz = -D / 2 + 1.5; rz <= D / 2 - 1.5; rz += 2.8) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(archR - 0.08, 0.18, 10, 22, Math.PI), trimMat);
        rib.position.set(0, sideH, rz); root.add(rib);
        [-W / 2 + 0.3, W / 2 - 0.3].forEach(function (px) {
          const pil = new THREE.Mesh(new THREE.BoxGeometry(0.32, sideH, 0.36), trimMat);
          pil.position.set(px, sideH / 2, rz); addSolid(pil);
        });
        // Flickering iron wall sconce torch on alternating sides
        const sideS = (Math.round(rz) % 2 === 0) ? -1 : 1;
        const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.42, 8), ironMat);
        sconce.position.set(sideS * (W / 2 - 0.34), 1.95, rz); sconce.rotation.z = sideS * 0.35; root.add(sconce);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 8), flameMat);
        fl.position.set(sideS * (W / 2 - 0.44), 2.22, rz); root.add(fl);
        animators.push((function (fMesh, phase) {
          return function (t) { fMesh.scale.y = 0.88 + Math.sin(t * 9 + phase) * 0.18; };
        })(fl, rz));
      }

      // Recessed wet drainage channel + puddles along the tunnel floor
      const gutter = new THREE.Mesh(new THREE.PlaneGeometry(0.55, D - 1.2), waterMat);
      gutter.rotation.x = -Math.PI / 2; gutter.position.set(-W / 2 + 0.72, 0.025, 0); root.add(gutter);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, D - 1.0), trimMat);
      curb.position.set(-W / 2 + 1.05, 0.06, 0); root.add(curb);

      // End walls with open doorways into Q03 (South) and Q05 (North)
      buildWallWithOpenings("N", W, H, -D / 2, 0, sideBuckets.N);
      buildWallWithOpenings("S", W, H, D / 2, 0, sideBuckets.S);

      // Stone steps descending from Q03 (+Z) and ascending toward Q05 (-Z)
      for (let st = 0; st < 4; st++) {
        const sDown = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18 * (st + 1), 0.45), trimMat);
        sDown.position.set(0, 0.09 * (st + 1), D / 2 - 0.4 - st * 0.45); root.add(sDown);
        const sUp = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18 * (st + 1), 0.45), trimMat);
        sUp.position.set(0, 0.09 * (st + 1), -D / 2 + 0.4 + st * 0.45); root.add(sUp);
      }

      // Recessed stone niche with the decoy ceramic "偽りの青空" tile mural
      const nicheFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.35, 3.25), trimMat);
      nicheFrame.position.set(W / 2 - 0.22, 1.75, -1.2); addSolid(nicheFrame);
      const fakeSky = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.0), new THREE.MeshStandardMaterial({ map: getFakeSkyTileTex(), emissive: 0x3b82f6, emissiveIntensity: 0.25, roughness: 0.22 }));
      fakeSky.position.set(W / 2 - 0.36, 1.75, -1.2); fakeSky.rotation.y = -Math.PI / 2; root.add(fakeSky);

      // Hanging Blue Oath Lamp (青い誓灯) on iron chain
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 6), ironMat);
      chain.position.set(-0.7, 3.35, 1.5); root.add(chain);
      const lampCage = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.42, 6, 1, true), ironMat);
      lampCage.position.set(-0.7, 2.5, 1.5); root.add(lampCage);
      const oathLamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      oathLamp.position.set(-0.7, 2.5, 1.5); root.add(oathLamp);
      const oathLight = new THREE.PointLight(0x38bdf8, 1.2, 10);
      oathLight.position.set(-0.7, 2.5, 1.5); root.add(oathLight);
      animators.push(function (t) { oathLight.intensity = 1.05 + Math.sin(t * 2.8) * 0.25; });

    } else if (isOutdoor) {
      // 屋外: グラデーション空ドーム＋遠景の城壁＆尖塔シルエット＋石造り腰壁（開口＋接続廊下付き）
      const skyDome = new THREE.Mesh(
        new THREE.SphereGeometry(48, 24, 16),
        new THREE.MeshBasicMaterial({ map: getSkyDomeTex(), side: THREE.BackSide, fog: false })
      );
      root.add(skyDome);

      // Distant medieval castle keep & crenellated curtain walls so outdoor never floats in empty void
      const distantMat = new THREE.MeshStandardMaterial({ map: getStoneTex("#7f786d", "rgba(35,30,24,0.3)", 6, 4), roughness: 0.9 });
      const roofSlateMat = new THREE.MeshStandardMaterial({ color: 0x354761, roughness: 0.72 });
      const towerPositions = loc.id === "Q05"
        ? [[-14, 18, 14], [14, 18, 13], [0, 22, 18]]
        : [[-20, -18, 15], [20, -18, 16], [-22, 16, 13], [22, 16, 14]];
      towerPositions.forEach(function (tp) {
        const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, tp[2], 12), distantMat);
        tw.position.set(tp[0], tp[2] / 2 - 1, tp[1]); root.add(tw);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.6, 12), roofSlateMat);
        cone.position.set(tp[0], tp[2] + 1.2, tp[1]); root.add(cone);
      });

      const paraH = loc.id === "Q05" ? 2.6 : 1.75;
      if (loc.id === "Q05") {
        // Q05: 南側(城側)に重厚な城壁＋地下通路出口のみ、北側は開けた外の草地！
        buildWallWithOpenings("S", W, 3.8, D / 2, 0, sideBuckets.S);
        // Battlement merlons along the castle wall
        for (let mx = -W / 2 + 0.8; mx <= W / 2 - 0.8; mx += 1.6) {
          const merl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.55), trimMat);
          merl.position.set(mx, 4.15, D / 2); root.add(merl);
        }
      } else {
        buildWallWithOpenings("N", W, paraH, -D / 2, 0, sideBuckets.N);
        buildWallWithOpenings("S", W, paraH, D / 2, 0, sideBuckets.S);
        buildWallWithOpenings("W", D, paraH, -W / 2, Math.PI / 2, sideBuckets.W);
        buildWallWithOpenings("E", D, paraH, W / 2, Math.PI / 2, sideBuckets.E);
      }

      // Wrought-iron garden lampposts at corners
      [[-W / 2 + 1.1, -D / 2 + 1.1], [W / 2 - 1.1, -D / 2 + 1.1], [-W / 2 + 1.1, D / 2 - 1.1], [W / 2 - 1.1, D / 2 - 1.1]].forEach(function (lp) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 2.8, 8), ironMat);
        post.position.set(lp[0], 1.4, lp[1]); addSolid(post, "round");
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.36, 6), new THREE.MeshBasicMaterial({ color: 0xffe59e }));
        lantern.position.set(lp[0], 2.95, lp[1]); root.add(lantern);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 6), ironMat);
        cap.position.set(lp[0], 3.22, lp[1]); root.add(cap);
      });

    } else {
      // 通常室内: 開口＋3D接続廊下付きの4面壁・幅木・天井梁・隅柱
      buildWallWithOpenings("N", W, H, -D / 2, 0, sideBuckets.N);
      buildWallWithOpenings("S", W, H, D / 2, 0, sideBuckets.S);
      buildWallWithOpenings("W", D, H, -W / 2, Math.PI / 2, sideBuckets.W);
      buildWallWithOpenings("E", D, H, W / 2, Math.PI / 2, sideBuckets.E);

      // Corner stone pilasters & ceiling beams
      [[-W / 2 + 0.3, -D / 2 + 0.3], [W / 2 - 0.3, -D / 2 + 0.3], [-W / 2 + 0.3, D / 2 - 0.3], [W / 2 - 0.3, D / 2 - 0.3]].forEach(function (cp) {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, H, 0.55), trimMat);
        pil.position.set(cp[0], H / 2, cp[1]); addSolid(pil);
      });
      for (let bz = -D / 2 + 2.2; bz <= D / 2 - 2.2; bz += 3.2) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, 0.28, 0.26), darkWoodMat);
        beam.position.set(0, H - 0.2, bz); root.add(beam);
      }
    }

    // =========================================================================
    // 高精細インテリア＆自然物ヘルパー群
    // =========================================================================
    function addTable(x, z, tw, td) {
      const tg = new THREE.Group(); tg.position.set(x, 0, z);
      const top = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.11, td), woodMat); top.position.y = 0.88; tg.add(top);
      const apron = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.18, 0.14, td - 0.18), darkWoodMat); apron.position.y = 0.78; tg.add(apron);
      [[-tw / 2 + 0.14, -td / 2 + 0.14], [tw / 2 - 0.14, -td / 2 + 0.14], [-tw / 2 + 0.14, td / 2 - 0.14], [tw / 2 - 0.14, td / 2 - 0.14]].forEach(function (lp) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.84, 8), darkWoodMat);
        leg.position.set(lp[0], 0.42, lp[1]); tg.add(leg);
      });
      // Tabletop candle & parchment scroll for lived-in realism
      const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 10), brassMat); holder.position.set(tw * 0.3, 0.96, -td * 0.2); tg.add(holder);
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.2, 8), linenMat); candle.position.set(tw * 0.3, 1.08, -td * 0.2); tg.add(candle);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 6), flameMat); fl.position.set(tw * 0.3, 1.22, -td * 0.2); tg.add(fl);
      addSolid(tg);
    }

    function addOpenChest(x, z, width, height, depth, material) {
      const chest = new THREE.Group();
      chest.position.set(x, 0, z);
      const thickness = .08;
      function board(w, h, d, px, y, pz) {
        const part = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
        part.position.set(px,y,pz);
        chest.add(part);
      }
      board(width,.12,depth,0,.06,0);
      for (const sign of [-1,1]) {
        board(thickness,height,depth,sign * (width - thickness) / 2,height / 2,0);
        board(width - 2 * thickness,height,thickness,0,height / 2,sign * (depth - thickness) / 2);
      }
      addSolid(chest);
    }

    function addChair(x, z, rotY) {
      const cg = new THREE.Group(); cg.position.set(x, 0, z); cg.rotation.y = rotY || 0;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), woodMat); seat.position.y = 0.5; cg.add(seat);
      const cush = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.48), velvetMat); cush.position.y = 0.56; cg.add(cush);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.07), darkWoodMat); back.position.set(0, 0.85, -0.24); cg.add(back);
      [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(function (lp) {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.5, 6), darkWoodMat); l.position.set(lp[0], 0.25, lp[1]); cg.add(l);
      });
      addSolid(cg);
    }

    function addBookshelf(x, z, rotY) {
      const sg = new THREE.Group(); sg.position.set(x, 0, z); sg.rotation.y = rotY || 0;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.0, 0.62), darkWoodMat); frame.position.y = 1.5; sg.add(frame);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.16, 0.7), woodMat); crown.position.y = 3.04; sg.add(crown);
      const cols = [0x8c2424, 0x244675, 0x2f6142, 0x7a5724, 0x5c2d5e, 0x9c6d2c];
      for (let r = 0; r < 4; r++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.06, 0.58), woodMat);
        shelf.position.set(0, 0.38 + r * 0.66, 0.04); sg.add(shelf);
        for (let b = 0; b < 9; b++) {
          const bh = 0.34 + ((b * 7 + r * 3) % 4) * 0.045;
          const bk = new THREE.Mesh(new THREE.BoxGeometry(0.18, bh, 0.38), new THREE.MeshStandardMaterial({ color: cols[(r * 3 + b) % cols.length], roughness: 0.78 }));
          bk.position.set(-0.9 + b * 0.22, 0.41 + r * 0.66 + bh / 2, 0.14);
          if (b === 7 && r === 1) bk.rotation.z = 0.22;
          sg.add(bk);
        }
      }
      addSolid(sg);
    }

    function addRealisticTree(x, z, sc, hasFruit) {
      const tg = new THREE.Group(); tg.position.set(x, 0, z); tg.scale.setScalar(sc || 1);
      const barkMat = new THREE.MeshStandardMaterial({ map: getWoodTex("#4a3322", 2, 4), roughness: 0.92 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 2.3, 10), barkMat); trunk.position.y = 1.15; tg.add(trunk); trunk.userData.walkObstacle = "round";
      // Diverging branches
      [[-0.4, 2.0, 0.2, 0.55], [0.42, 2.1, -0.15, -0.5], [0.05, 2.2, 0.38, 0.25]].forEach(function (br) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 1.1, 7), barkMat);
        b.position.set(br[0], br[1], br[2]); b.rotation.z = br[3]; tg.add(b);
      });
      // Multi-layered clustered foliage canopy
      const leafMats = [
        new THREE.MeshStandardMaterial({ color: 0x356932, roughness: 0.86 }),
        new THREE.MeshStandardMaterial({ color: 0x457f3d, roughness: 0.84 }),
        new THREE.MeshStandardMaterial({ color: 0x589448, roughness: 0.84 })
      ];
      [[0, 3.15, 0, 1.1], [-0.75, 2.7, 0.35, 0.82], [0.78, 2.75, -0.25, 0.85], [0.25, 2.85, 0.75, 0.78], [-0.35, 2.9, -0.7, 0.8]].forEach(function (cl, i) {
        const l = new THREE.Mesh(new THREE.DodecahedronGeometry(cl[3], 1), leafMats[i % leafMats.length]);
        l.position.set(cl[0], cl[1], cl[2]); tg.add(l);
      });
      if (hasFruit) {
        const frMat = new THREE.MeshStandardMaterial({ color: 0xd9483b, roughness: 0.45 });
        [[-0.85, 2.45, 0.55], [0.8, 2.5, 0.3], [0.2, 2.55, 0.95], [-0.3, 2.6, -0.85]].forEach(function (fp) {
          const fr = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), frMat); fr.position.set(fp[0], fp[1], fp[2]); tg.add(fr);
        });
      }
      root.add(tg);
    }

    function addRealisticBoat(x, z, rotY) {
      const bg = new THREE.Group(); bg.position.set(x, 0.28, z); bg.rotation.y = rotY || 0.35;
      const hullWood = new THREE.MeshStandardMaterial({ map: getWoodTex("#6e4526", 3, 2), roughness: 0.72 });
      const gunwaleWood = new THREE.MeshStandardMaterial({ map: getWoodTex("#3d2312", 2, 1), roughness: 0.76 });

      // Tapered double-ended curved wooden boat hull
      const sh = new THREE.Shape();
      sh.moveTo(0, 1.75);
      sh.bezierCurveTo(0.88, 1.05, 0.92, -0.85, 0, -1.65);
      sh.bezierCurveTo(-0.92, -0.85, -0.88, 1.05, 0, 1.75);
      const outerHull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.52, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 }), hullWood);
      outerHull.rotation.x = Math.PI / 2; outerHull.position.y = 0.42; bg.add(outerHull);

      // Recessed dark interior cockpit deck + wooden ribs
      const innerSh = new THREE.Shape();
      innerSh.moveTo(0, 1.48);
      innerSh.bezierCurveTo(0.72, 0.88, 0.76, -0.72, 0, -1.4);
      innerSh.bezierCurveTo(-0.76, -0.72, -0.72, 0.88, 0, 1.48);
      const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(innerSh, { depth: 0.08, bevelEnabled: false }), gunwaleWood);
      deck.rotation.x = Math.PI / 2; deck.position.y = 0.18; bg.add(deck);

      // Gunwale rim around top edge
      const pts3 = sh.getPoints(28).map(function (p) { return new THREE.Vector3(p.x, 0.48, p.y); });
      pts3.push(pts3[0].clone());
      const rimCurve = new THREE.CatmullRomCurve3(pts3);
      const rimTube = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 40, 0.06, 8, true), gunwaleWood);
      bg.add(rimTube);

      // 3 wooden thwart benches
      [-0.72, 0.05, 0.82].forEach(function (bz, i) {
        const bw = i === 1 ? 1.42 : 1.15;
        const bench = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.07, 0.28), hullWood);
        bench.position.set(0, 0.34, bz); bg.add(bench);
      });

      // Brass oarlocks & pair of wooden oars with flat blades
      [-1, 1].forEach(function (s) {
        const lock = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12, Math.PI), brassMat);
        lock.rotation.z = Math.PI; lock.position.set(s * 0.78, 0.54, 0.05); bg.add(lock);
        const oarGroup = new THREE.Group();
        oarGroup.position.set(s * 0.78, 0.53, 0.05);
        oarGroup.rotation.set(0.18, s * 0.35, s * 0.22);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 2.2, 8), woodMat);
        shaft.rotation.z = Math.PI / 2; shaft.position.x = s * 0.45; oarGroup.add(shaft);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.022, 0.16), hullWood);
        blade.position.x = s * 1.45; oarGroup.add(blade);
        bg.add(oarGroup);
      });

      // Brass bow lantern & coiled mooring rope
      const bowPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 8), ironMat);
      bowPost.position.set(0, 0.66, 1.58); bg.add(bowPost);
      const bowLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.2, 6), flameMat);
      bowLantern.position.set(0, 0.88, 1.58); bg.add(bowLantern);
      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16), new THREE.MeshStandardMaterial({ color: 0xb5915b, roughness: 0.92 }));
      rope.rotation.x = Math.PI / 2; rope.position.set(0.25, 0.22, 1.1); bg.add(rope);

      root.add(bg);
      animators.push(function (t) {
        bg.position.y = 0.26 + Math.sin(t * 1.8) * 0.045;
        bg.rotation.z = Math.sin(t * 1.3) * 0.032;
        bg.rotation.x = Math.cos(t * 1.5) * 0.022;
      });
    }

    function addDetailedCarriage(x, z) {
      const cg = new THREE.Group(); cg.position.set(x, 0, z);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b2316, map: getWoodTex("#3b2316", 2, 2), roughness: 0.62 });
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.65, 3.4), bodyMat); cab.position.set(0, 1.78, 0); cg.add(cab); cab.userData.walkObstacle = true;
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 3.48, 12, 1, false, 0, Math.PI), darkWoodMat);
      roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.scale.set(1, 0.35, 1); roof.position.set(0, 2.6, 0); cg.add(roof);
      // Framed windows & gold royal trim
      [-1.12, 1.12].forEach(function (sx) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.72), glassMat);
        win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; win.position.set(sx, 1.95, 0); cg.add(win);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 3.44), goldMat); strip.position.set(sx, 1.38, 0); cg.add(strip);
      });
      // Driver box & shafts
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 0.9), darkWoodMat); box.position.set(0, 1.6, 2.15); cg.add(box); box.userData.walkObstacle = true;
      [-0.65, 0.65].forEach(function (shx) {
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.3, 8), woodMat);
        sh.rotation.x = Math.PI / 2; sh.position.set(shx, 1.05, 3.1); cg.add(sh); sh.userData.walkObstacle = true;
        const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.22, 6), flameMat);
        lant.position.set(shx * 1.4, 2.25, 1.72); cg.add(lant);
      });
      // 4 multi-spoked wooden wheels with iron rims
      [[-1.22, -1.25, 0.78], [1.22, -1.25, 0.78], [-1.22, 1.35, 0.62], [1.22, 1.35, 0.62]].forEach(function (wp) {
        const wg = new THREE.Group(); wg.position.set(wp[0], wp[2], wp[1]);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(wp[2], 0.065, 8, 22), ironMat); rim.rotation.y = Math.PI / 2; wg.add(rim);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 10), brassMat); hub.rotation.z = Math.PI / 2; wg.add(hub);
        for (let s = 0; s < 8; s++) {
          const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, wp[2] * 1.92, 6), woodMat);
          sp.rotation.x = (s * Math.PI) / 8; wg.add(sp);
        }
        cg.add(wg); wg.userData.walkObstacle = true;
      });
      root.add(cg);
    }

    // =========================================================================
    // 59地点 専用インテリア・ギミック造形（全種網羅）
    // =========================================================================
    const k = loc.kind;
    if (k === "throne") {
      // C01 玉座の間: 赤絨毯・段差・ゴシック王座・列柱・ステンドグラス風天窓光柱
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.8, D - 1.4), new THREE.MeshStandardMaterial({ map: getCarpetTex(), roughness: 0.85 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.02; root.add(carpet);
      const dais1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.42, 4.4), trimMat); dais1.position.set(0, 0.21, -D / 2 + 2.8); addSolid(dais1);
      const dais2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.36, 3.2), trimMat); dais2.position.set(0, 0.6, -D / 2 + 2.4); addSolid(dais2);
      const throne = global.CastleEscapeItems.createItemOrProp("PROP_THRONE", { envMap });
      throne.group.scale.setScalar(1.34);
      throne.group.position.set(0, 1.7342, -D / 2 + 2.14);
      addSolid(throne.group);
      // Twin rows of grand columns & banners
      for (let z = -D / 2 + 5.2; z <= D / 2 - 2.6; z += 3.6) {
        [-W / 2 + 2.2, W / 2 - 2.2].forEach(function (px) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, H - 0.3, 14), trimMat); col.position.set(px, H / 2, z); addSolid(col, "round");
          const ban = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), velvetMat); ban.position.set(px + (px < 0 ? 0.5 : -0.5), 4.2, z); ban.rotation.y = px < 0 ? Math.PI / 2 : -Math.PI / 2; root.add(ban);
        });
      }
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xffeba8, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
      [-3.2, 0, 3.2].forEach(function (rz) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.85, H, 10, 1, true), rayMat);
        beam.position.set(-1.0, H / 2, rz); beam.rotation.z = -0.24; root.add(beam);
      });
    } else if (k === "antechamber") {
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, D - 1.2), new THREE.MeshStandardMaterial({ map: getCarpetTex(), roughness: 0.86 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.02; root.add(carpet);
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.4), new THREE.MeshStandardMaterial({ map: getFakeSkyTileTex(), roughness: 0.85 }));
      backdrop.position.set(-W / 2 + 0.36, 2.35, -1.5); backdrop.rotation.y = Math.PI / 2; root.add(backdrop);
      addTable(3.2, -2.5, 2.2, 1.0); addChair(3.2, -1.4, Math.PI);
    } else if (k === "corridor_relief") {
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.2, D - 1.2), new THREE.MeshStandardMaterial({ map: getCarpetTex(), roughness: 0.86 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.02; root.add(carpet);
      for (let z = -5.4; z <= 5.4; z += 2.7) {
        [-W / 2 + 0.34, W / 2 - 0.34].forEach(function (wx) {
          const pl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.45, 1.25), goldMat);
          pl.position.set(wx, 2.1, z); root.add(pl);
        });
      }
    } else if (k === "gallery") {
      const railZ = -D / 2 + 1.0;
      const gaps = sideBuckets.N.map((_, index, all) => (index - (all.length - 1) / 2) *
        Math.min(3.5, (W - 2.2) / all.length));
      let start = -W / 2 + 0.9;
      function addRail(end) {
        if (end <= start) return;
        const rail = new THREE.Mesh(new THREE.BoxGeometry(end - start, 1, 0.24), darkWoodMat);
        rail.position.set((start + end) / 2, 0.5, railZ); addSolid(rail);
      }
      gaps.forEach(function (center) {
        addRail(center - DOOR_W / 2);
        start = center + DOOR_W / 2;
      });
      addRail(W / 2 - 0.9);
      [-2.8, -0.8, 1.2, 3.0].forEach(function (mx) {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.15, 8), darkWoodMat); stand.position.set(mx, 0.58, -1.2); addSolid(stand, "round");
        const desk = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.04), woodMat); desk.position.set(mx, 1.22, -1.2); desk.rotation.x = -0.45; root.add(desk);
        addChair(mx, -0.2, 0);
      });
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.65, 16), velvetMat); drum.position.set(-3.4, 0.45, 1.2); root.add(drum);
    } else if (k === "wardrobe") {
      [-2.2, 0, 2.2].forEach(function (mx) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.55, 8), darkWoodMat); pole.position.set(mx, 0.78, -2.5); addSolid(pole, "round");
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.72, 12), velvetMat); torso.position.set(mx, 1.32, -2.5); addSolid(torso, "round");
      });
      addTable(0, 1.2, 2.8, 1.1);
    } else if (k === "lounge") {
      addTable(-2.2, -1.6, 2.6, 1.2); addChair(-2.2, -2.6, 0); addChair(-2.2, -0.6, Math.PI);
      addTable(2.4, 1.2, 2.4, 1.2); addChair(2.4, 0.2, 0); addChair(2.4, 2.2, Math.PI);
      addBookshelf(-W / 2 + 0.85, 2.2, Math.PI / 2);
    } else if (k === "hub") {
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.8, 32), goldMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; root.add(ring);
      const star = new THREE.Mesh(new THREE.CircleGeometry(1.65, 8), marbleMat); star.rotation.x = -Math.PI / 2; star.position.y = 0.025; root.add(star);
      [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]].forEach(function (pp) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, H - 0.3, 14), trimMat); col.position.set(pp[0], H / 2, pp[1]); addSolid(col, "round");
      });
    } else if (k === "bedroom") {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.56, 3.0), darkWoodMat); bed.position.set(-2.3, 0.28, 1.0); addSolid(bed);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.35, 0.16), darkWoodMat); hb.position.set(-2.3, 0.7, -0.45); addSolid(hb);
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.2, 2.15), velvetMat); blanket.position.set(-2.3, 0.62, 1.35); root.add(blanket);
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.54), linenMat); pillow.position.set(-2.3, 0.66, -0.02); root.add(pillow);
      addTable(2.3, -2.0, 2.0, 1.0); addChair(2.3, -1.0, Math.PI);
    } else if (k === "archive") {
      [-3.4, 0, 3.4].forEach(function (bx) { addBookshelf(bx, -D / 2 + 1.1, 0); });
      addTable(0, 1.0, 3.6, 1.4); addChair(-1.0, 2.2, Math.PI); addChair(1.0, 2.2, Math.PI);
    } else if (k === "tapestry") {
      const tap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.2, 8.5), new THREE.MeshStandardMaterial({ color: 0x324c7a, roughness: 0.82 }));
      tap.position.set(-1.3, 2.4, 0); addSolid(tap);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 8.8), goldMat); frame.position.set(-1.3, 4.55, 0); root.add(frame);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 4.2), woodMat); bench.position.set(1.6, 0.25, 0); addSolid(bench);
    } else if (k === "portrait") {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.35, 0.14), goldMat); frame.position.set(0, 1.78, -2.1); frame.rotation.x = -0.14; addSolid(frame);
      const canvasP = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 2.05), new THREE.MeshStandardMaterial({ color: 0x5c3e4c, roughness: 0.78 }));
      canvasP.position.set(0, 1.78, -2.02); canvasP.rotation.x = -0.14; root.add(canvasP);
      addTable(-2.8, 1.4, 2.2, 1.0); addTable(2.8, 1.4, 2.0, 1.0);
    } else if (k === "incense") {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.82, 1.8), woodMat); cart.position.set(0, 0.65, -0.5); addSolid(cart);
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.34, 12), brassMat); burner.position.set(0, 1.24, -0.5); root.add(burner);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 18), brassMat); dial.rotation.x = Math.PI / 2; dial.position.set(0, 2.3, -D / 2 + 0.35); root.add(dial);
    } else if (k === "scriptorium") {
      [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]].forEach(function (dp) { addTable(dp[0], dp[1], 2.2, 1.1); addChair(dp[0], dp[1] + 0.9, Math.PI); });
    } else if (k === "maproom") {
      [-3.0, 0, 3.0].forEach(function (mx) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.6, 0.1), linenMat); m.position.set(mx, 2.25, -2.4); root.add(m);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), brassMat); rod.rotation.z = Math.PI / 2; rod.position.set(mx, 3.6, -2.4); root.add(rod);
      });
      addTable(0, 1.8, 3.6, 1.5);
    } else if (k === "bindery") {
      addTable(0, -1.0, 3.4, 1.3);
      const press = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.26, 0.95), ironMat); press.position.set(0, 1.38, -1.0); addSolid(press);
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.85, 10), brassMat); screw.position.set(0, 1.72, -1.0); root.add(screw);
    } else if (k === "scaffold") {
      const mural = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 6.2), new THREE.MeshStandardMaterial({ color: 0x997954, roughness: 0.85 }));
      mural.position.set(0, 3.8, -D / 2 + 0.32); root.add(mural);
      [2.1, 4.3].forEach(function (sy) {
        const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 1.7), woodMat); deck.position.set(0, sy, -D / 2 + 2.0); root.add(deck);
      });
      [[-2.7, -D / 2 + 1.2], [2.7, -D / 2 + 1.2], [-2.7, -D / 2 + 2.8], [2.7, -D / 2 + 2.8]].forEach(function (pp) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.4, 8), darkWoodMat); p.position.set(pp[0], 2.7, pp[1]); addSolid(p, "round");
      });
    } else if (k === "laundry") {
      [-3.0, 0, 3.0].forEach(function (tx) {
        const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.66, 0.82, 16), woodMat); tub.position.set(tx, 0.41, -1.5); addSolid(tub, "round");
        const wat = new THREE.Mesh(new THREE.CircleGeometry(0.74, 16), waterMat); wat.rotation.x = -Math.PI / 2; wat.position.set(tx, 0.78, -1.5); root.add(wat);
      });
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 7.6, 6), ironMat); line.rotation.z = Math.PI / 2; line.position.set(0, 2.75, 1.8); root.add(line);
      [-2.4, -0.8, 0.8, 2.4].forEach(function (cx) {
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.55), linenMat); sheet.position.set(cx, 1.95, 1.8); sheet.material = linenMat.clone(); sheet.material.side = THREE.DoubleSide; root.add(sheet);
      });
    } else if (k === "east_hall") {
      addOpenChest(-W / 2 + 1, 0, 1.5, .89, .95, darkWoodMat);
    } else if (k === "dovecote") {
      const coop = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 1.3), woodMat); coop.position.set(0, 1.4, -2.5); addSolid(coop);
      for (let bx = -1.6; bx <= 1.6; bx += 0.8) {
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.19, 10), new THREE.MeshBasicMaterial({ color: 0x16120e }));
        hole.position.set(bx, 1.95, -1.84); root.add(hole);
        const dove = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), linenMat); dove.position.set(bx, 1.78, -1.65); root.add(dove);
      }
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.34,16,1,true), brassMat.clone());
      tube.material.side = THREE.DoubleSide;
      tube.rotation.x = Math.PI / 2;
      tube.position.set(1.25, 1.2, -1.69);
      root.add(tube);
      addRealisticTree(-3.8, 2.6, 0.85, false);
    } else if (k === "sewing") {
      addTable(0, -1.2, 3.8, 1.3);
      [-2.6, 2.6].forEach(function (mx) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), darkWoodMat); pole.position.set(mx, 0.8, 1.8); addSolid(pole, "round");
        const dress = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.15, 12), velvetMat); dress.position.set(mx, 1.15, 1.8); addSolid(dress, "round");
      });
    } else if (k === "rooftop") {
      // E05 物干し屋根: 瓦屋根スロープ・煙突・風見鶏＆風向き旗・物干しシーツ
      const tileMat = new THREE.MeshStandardMaterial({ color: 0x8f4c38, roughness: 0.82 });
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 1.2), trimMat); chimney.position.set(-4.2, 1.4, -3.8); addSolid(chimney);
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(W - 1.5, 0.32, 0.45), tileMat); ridge.position.set(0, 0.16, 0); addSolid(ridge);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), ironMat); pole.position.set(3.8, 2.2, -3.2); addSolid(pole, "round");
      const sock = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.35, 10), velvetMat); sock.rotation.z = -Math.PI / 2; sock.position.set(4.5, 4.1, -3.2); root.add(sock);
      animators.push(function (t) { sock.rotation.y = Math.sin(t * 2.5) * 0.25; });
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 7.6, 6), ironMat); line.rotation.z = Math.PI / 2; line.position.set(-0.5, 2.7, 1.2); root.add(line);
      [-2.8, -0.8, 1.2].forEach(function (cx, i) {
        const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), linenMat); sh.material = linenMat.clone(); sh.material.side = THREE.DoubleSide;
        sh.position.set(cx, 1.85, 1.2); root.add(sh);
        animators.push(function (t) { sh.rotation.x = Math.sin(t * 3.1 + i) * 0.12; });
      });
    } else if (k === "propstore") {
      [[-3.0, -2.5], [-1.5, -2.5], [2.8, -2.2], [-2.5, 2.0]].forEach(function (cp) {
        const cr = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.2), woodMat); cr.position.set(cp[0], 0.55, cp[1]); addSolid(cr);
      });
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.9), goldMat); chest.position.set(2.2, 0.42, 2.0); addSolid(chest);
    } else if (k === "guardpost") {
      const redLine = new THREE.Mesh(new THREE.PlaneGeometry(W - 1.2, 0.22), new THREE.MeshBasicMaterial({ color: 0xe24444 }));
      redLine.rotation.x = -Math.PI / 2; redLine.position.set(0, 0.025, 0.8); root.add(redLine);
      addTable(0, -1.8, 3.6, 1.2); addChair(0, -2.8, 0);
      addTable(2.0, .74, 1.3, .49);
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 12), ironMat); bell.position.set(3.2, 2.5, -2.5); root.add(bell);
    } else if (k === "theatre") {
      const stage = new THREE.Mesh(new THREE.BoxGeometry(W - 2.4, 0.88, 5.2), darkWoodMat); stage.position.set(0, 0.44, -D / 2 + 3.0); addSolid(stage);
      [-W / 2 + 1.8, W / 2 - 1.8].forEach(function (cx) {
        const cur = new THREE.Mesh(new THREE.BoxGeometry(1.4, H - 1.2, 0.5), velvetMat); cur.position.set(cx, H / 2, -D / 2 + 5.2); addSolid(cur);
      });
      [1.8, 3.8].forEach(function (rz) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.55, 0.85), woodMat); bench.position.set(0, 0.28, rz); addSolid(bench);
      });
    } else if (k === "kiln" || k === "foundry" || k === "bakery") {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), trimMat); dome.position.set(0, 0, -2.6); addSolid(dome, "round");
      const fire = new THREE.Mesh(new THREE.CircleGeometry(0.75, 14), flameMat); fire.position.set(0, 0.8, -0.52); root.add(fire);
      addTable(-3.0, 2.0, 2.4, 1.1); addTable(3.0, 2.0, 2.4, 1.1);
    } else if (k === "infirmary") {
      [-3.2, 0, 3.2].forEach(function (bx) {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 2.65), linenMat); bed.position.set(bx, 0.31, -2.2); addSolid(bed);
        const pil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.48), marbleMat); pil.position.set(bx, 0.68, -3.1); addSolid(pil);
      });
      addTable(0, 2.2, 3.4, 1.2);
      addTable(4.38, -.55, 1.1, .66);
    } else if (k === "observatory") {
      const astro = global.CastleEscapeItems.createItemOrProp("PROP_ASTRO", { envMap });
      const scale = 1.6;
      astro.group.scale.setScalar(scale);
      astro.group.position.y = .97 * scale;
      addSolid(astro.group);
      animators.push(astro.update);
    } else if (k === "herbs") {
      addTable(0, 0.8, 3.2, 1.2);
      for (let hx = -3.0; hx <= 3.0; hx += 1.2) {
        const herb = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.85, 8), new THREE.MeshStandardMaterial({ color: 0x4b703d, roughness: 0.9 }));
        herb.rotation.x = Math.PI; herb.position.set(hx, 3.1, -1.6); root.add(herb);
      }
    } else if (k === "conservatory" || k === "rotarygreenhouse") {
      const glassRoof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.56, 2.4, 8), glassMat); glassRoof.position.y = H + 0.5; root.add(glassRoof);
      const rotGroup = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.55, 10), new THREE.MeshStandardMaterial({ color: 0xa65e3a }));
        pot.position.set(Math.cos(a) * 2.5, 0.28, Math.sin(a) * 2.5); rotGroup.add(pot);
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), new THREE.MeshStandardMaterial({ color: 0x3b8544 }));
        plant.position.set(Math.cos(a) * 2.5, 0.88, Math.sin(a) * 2.5); rotGroup.add(plant);
      }
      root.add(rotGroup);
      animators.push(function (t) { rotGroup.rotation.y = t * 0.24; });
    } else if (k === "specimen") {
      for (let sz = -4.2; sz <= 4.2; sz += 2.8) {
        [-1.8, 1.8].forEach(function (sx) {
          const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.1), woodMat); base.position.set(sx, 0.48, sz); addSolid(base);
          const caseG = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), glassMat); caseG.position.set(sx, 1.42, sz); root.add(caseG);
        });
      }
    } else if (k === "returnvault") {
      const decoy = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 0.95), goldMat); decoy.position.set(-2.0, 0.42, -1.6); addSolid(decoy);
      addOpenChest(2, -1.6, 1.28, .78, .88, ironMat);
      addTable(0, 1.8, 2.8, 1.0);
    } else if (k === "winterroom") {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, H, 0.68), woodMat); pillar.position.set(-2.2, H / 2, -1.5); addSolid(pillar);
      addTable(1.8, -1.4, 2.4, 1.2); addChair(1.8, -0.3, Math.PI);
    } else if (k === "bellroom") {
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.14), darkWoodMat); board.position.set(0, 2.0, -D / 2 + 0.38); root.add(board);
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.15, 16), brassMat); bell.position.set(0, H - 1.3, 0); root.add(bell);
    } else if (k === "southgate") {
      const grille = new THREE.Group();
      for (let gx = -3.6; gx <= 3.6; gx += 0.6) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 4.6, 8), ironMat); bar.position.set(gx, 2.3, -D / 2 + 1.0); grille.add(bar);
      }
      addSolid(grille);
      const redZone = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xe24444, transparent: true, opacity: 0.35 }));
      redZone.rotation.x = -Math.PI / 2; redZone.position.set(0, 0.025, -0.5); root.add(redZone);
    } else if (k === "carriageyard") {
      // S05 馬車溜: 多スポーク車輪＆ランタン付き本格馬車＋石畳
      addDetailedCarriage(-1.8, -1.2);
      addDetailedCarriage(3.4, 2.2);
    } else if (k === "kitchen" || k === "pantry") {
      addTable(0, -1.4, 4.8, 1.3);
      addBookshelf(-4.2, -2.2, Math.PI / 2); addBookshelf(4.2, -2.2, -Math.PI / 2);
    } else if (k === "raingarden") {
      // G01 雨量庭園: 彫刻石盤＋水面＋高精細ブロンズ鷺＋周囲の庭園樹＆石畳
      const path = new THREE.Mesh(new THREE.RingGeometry(1.7, 3.0, 24), trimMat); path.rotation.x = -Math.PI / 2; path.position.y = 0.02; root.add(path);
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 0.44, 24), trimMat); basin.position.y = 0.22; addSolid(basin, "round");
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.28, 24), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 0.45; root.add(water);
      const br = new THREE.MeshStandardMaterial({ color: 0x527367, roughness: 0.38, metalness: 0.72, envMap: envMap });
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 1.05, 8), br); rl.position.set(-0.08, 0.96, 0); root.add(rl);
      const ll = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.55, 8), br); ll.position.set(0.12, 1.15, 0.16); ll.rotation.x = 0.75; root.add(ll);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), br); b.scale.set(0.75, 0.85, 1.48); b.position.set(0, 1.52, 0); root.add(b);
      const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.72, 10), br); nk.position.set(0, 1.92, 0.3); nk.rotation.x = 0.28; root.add(nk);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), br); hd.position.set(0, 2.28, 0.4); root.add(hd);
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.44, 8), goldMat); bk.rotation.x = Math.PI / 2 + 0.18; bk.position.set(0, 2.22, 0.68); root.add(bk);
      [[-4.4, -4.2], [4.4, -4.2], [-4.4, 4.2], [4.4, 4.2]].forEach(function (tp) { addRealisticTree(tp[0], tp[1], 0.85, false); });
    } else if (k === "fountain") {
      // G02 中庭の噴水: 八角彫刻水盤＋2段噴水塔＋アニメーション水柱＆波紋＋石ベンチ＋樹木
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.65, 8), trimMat); basin.position.y = 0.32; addSolid(basin, "round");
      const pool = new THREE.Mesh(new THREE.CircleGeometry(2.9, 24), waterMat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.62; root.add(pool);
      const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.68, 1.5, 12), marbleMat); tier1.position.y = 1.2; root.add(tier1);
      const bowl1 = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 0.55, 0.38, 16), marbleMat); bowl1.position.y = 1.95; root.add(bowl1);
      const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.95, 12), marbleMat); tier2.position.y = 2.55; root.add(tier2);
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.15, 12, 1, true), glassMat); jet.rotation.x = Math.PI; jet.position.y = 3.25; root.add(jet);
      animators.push(function (t) { jet.scale.y = 0.9 + Math.sin(t * 6) * 0.14; });
      [[-5.0, -5.0], [5.0, -5.0], [-5.0, 5.0], [5.0, 5.0]].forEach(function (tp) { addRealisticTree(tp[0], tp[1], 0.92, false); });
    } else if (k === "pond") {
      // G06 舟遊び池: リアル木造小舟＋木製桟橋＆係留杭＋波紋池＋睡蓮＆葦＋石橋＋周囲の庭園樹
      const rim = new THREE.Mesh(new THREE.TorusGeometry(5.1, 0.36, 10, 32), trimMat); rim.rotation.x = Math.PI / 2; rim.position.y = 0.25; root.add(rim);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(5.05, 32), waterMat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.22; addSolid(pool, "water");
      // Wooden pier dock on pilings
      const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 2.8), woodMat); pier.position.set(-3.4, 0.46, 2.8); pier.rotation.y = 0.65; root.add(pier);
      [[-4.1, 2.2], [-2.7, 3.4], [-3.8, 3.6]].forEach(function (pp) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.95, 8), darkWoodMat); pile.position.set(pp[0], 0.48, pp[1]); root.add(pile);
      });
      // Realistic wooden rowboat floating in the pond
      addRealisticBoat(0.85, 0.2, 0.45);
      // Floating lily pads & lotus blossoms
      const padMat = new THREE.MeshStandardMaterial({ color: 0x3a7d3c, roughness: 0.8 });
      const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf7b7c8, roughness: 0.6 });
      [[-2.2, -1.8], [-1.5, -2.5], [2.6, -2.1], [3.1, 1.6], [-2.8, 0.4]].forEach(function (lp) {
        const pad = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12, 0, Math.PI * 1.82), padMat);
        pad.rotation.x = -Math.PI / 2; pad.position.set(lp[0], 0.24, lp[1]); root.add(pad);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 6), lotusMat); fl.rotation.x = Math.PI; fl.position.set(lp[0], 0.31, lp[1]); root.add(fl);
      });
      // Surrounding realistic garden trees
      [[-6.2, -5.2], [6.2, -5.2], [-6.2, 5.2], [6.2, 5.2]].forEach(function (tp) { addRealisticTree(tp[0], tp[1], 1.0, false); });
    } else if (k === "orchard") {
      // G03 果樹回廊: 石畳の小道＋実をつけた多層枝葉果樹並木
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.8, D - 1.2), trimMat); walk.rotation.x = -Math.PI / 2; walk.position.y = 0.02; root.add(walk);
      [-4.6, 0, 4.6].forEach(function (tz) {
        [-3.2, 3.2].forEach(function (tx) { addRealisticTree(tx, tz, 0.95, true); });
      });
    } else if (k === "sundial") {
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.55, 24), marbleMat); dial.position.y = 0.28; addSolid(dial, "round");
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.06, 8, 24), brassMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.58; root.add(ring);
      const gnomon = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.85, 4), goldMat); gnomon.position.set(0, 1.38, 0); gnomon.rotation.x = 0.45; root.add(gnomon);
      [[-4.8, -4.8], [4.8, -4.8], [-4.8, 4.8], [4.8, 4.8]].forEach(function (tp) { addRealisticTree(tp[0], tp[1], 0.85, false); });
    } else if (k === "shed") {
      addTable(0, -2.0, 2.8, 1.0);
      [-1.8, -0.6, 0.6, 1.8].forEach(function (px) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.36, 10), new THREE.MeshStandardMaterial({ color: 0xa65e3a }));
        pot.position.set(px, 0.18, 1.8); addSolid(pot, "round");
      });
    } else if (k === "cistern") {
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(W - 2.4, D - 2.4), waterMat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.08; root.add(pool);
      const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), new THREE.MeshStandardMaterial({ color: 0xd93838 })); buoy.position.set(0, 0.28, -1.2); root.add(buoy);
      animators.push(function (t) { buoy.position.y = 0.28 + Math.sin(t * 2.4) * 0.08; });
    } else if (k === "icevault") {
      const iceMat = new THREE.MeshStandardMaterial({ color: 0xbce8ff, roughness: 0.1, transparent: true, opacity: 0.84, envMap: envMap });
      [-2.4, 0, 2.4].forEach(function (ix) {
        const blk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.35, 1.6), iceMat); blk.position.set(ix, 0.68, -2.2); addSolid(blk);
      });
    } else if (k === "clockwork") {
      addTable(0, -1.2, 3.6, 1.3);
      [-0.9, 0.2, 1.1].forEach(function (gx, i) {
        const gear = new THREE.Mesh(new THREE.TorusGeometry(0.32 + i * 0.07, 0.05, 8, 16), goldMat); gear.rotation.x = Math.PI / 2; gear.position.set(gx, 0.98, -1.2); root.add(gear);
        animators.push(function (t) { gear.rotation.z = t * (i % 2 === 0 ? 1.2 : -1.2); });
      });
    } else if (k === "tearoom") {
      addTable(0, 0, 4.4, 1.5);
      [-1.5, 0, 1.5].forEach(function (cx) { addChair(cx, -1.2, 0); addChair(cx, 1.2, Math.PI); });
      addChair(2.6, 0, -Math.PI / 2);
      const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), ironMat); kettle.position.set(0, 1.08, 0); root.add(kettle);
    } else if (k === "understage") {
      const lift = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, 3.6), woodMat); lift.position.set(0, 0.45, 0); addSolid(lift);
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.55, 5), new THREE.MeshBasicMaterial({ color: 0xffe49e })); star.rotation.x = -Math.PI / 2; star.position.set(0, 0.6, 0); root.add(star);
    } else if (k === "ledgervault") {
      addBookshelf(-3.2, -3.8, 0); addBookshelf(3.2, -3.8, 0); addTable(0, 0.6, 2.4, 1.2);
      const oath = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.74), velvetMat); oath.position.set(0, 0.98, 0.6); root.add(oath);
    } else if (k === "servicecorridor") {
      [-3.8, 0, 3.8].forEach(function (tz) {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.75, 1.2), woodMat); rack.position.set(-W / 2 + 1.0, 0.88, tz); addSolid(rack);
      });
    } else if (k === "silentchapel") {
      const altar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.05), marbleMat); altar.position.set(0, 0.55, -2.4); addSolid(altar);
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), linenMat); candle.position.set(0, 1.31, -2.4); root.add(candle);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), flameMat); fl.position.set(0, 1.58, -2.4); root.add(fl);
    } else if (k === "whitecorridor") {
      const centerWhite = new THREE.Mesh(new THREE.PlaneGeometry(4.2, D - 1.2), marbleMat); centerWhite.rotation.x = -Math.PI / 2; centerWhite.position.y = 0.02; root.add(centerWhite);
      const lilyEdge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, D - 1.2), new THREE.MeshStandardMaterial({ color: 0x262936, roughness: 0.9 })); lilyEdge.rotation.x = -Math.PI / 2; lilyEdge.position.set(-W / 2 + 1.05, 0.025, 0); root.add(lilyEdge);
      for (let lz = -5.5; lz <= 5.5; lz += 2.2) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c2 })); lamp.position.set(0, 4.4, lz); root.add(lamp);
        const lily = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 6), linenMat); lily.rotation.x = Math.PI; lily.position.set(-W / 2 + 1.05, 0.14, lz); root.add(lily);
      }
    } else if (k === "oldchapel") {
      [-3.3, -1.1, 1.1, 3.3].forEach(function (sx, i) {
        const ped = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.78, 1.1), trimMat); ped.position.set(sx, 0.39, -3.2); addSolid(ped, "round");
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 1.45, 14), marbleMat); body.position.set(sx, 1.5, -3.2); root.add(body);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), marbleMat); hd.position.set(sx, 2.4, -3.2); root.add(hd);
        if (i !== 2) {
          const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.12, 10), goldMat); cr.position.set(sx, 2.58, -3.2); addSolid(cr);
        }
      });
    } else if (k === "boundary") {
      // Q05 境石と外の草地: 城側石畳 vs 外側の野草・花畑・本格樹木＋金王冠刻みの境石
      const innerSlab = new THREE.Mesh(new THREE.PlaneGeometry(W, D / 2), new THREE.MeshStandardMaterial({ map: getStoneTex("#c8c0ae", "rgba(35,30,22,0.28)", 6, 3), roughness: 0.9 }));
      innerSlab.rotation.x = -Math.PI / 2; innerSlab.position.set(0, 0.025, D / 4); root.add(innerSlab);
      const stone = global.CastleEscapeItems.createItemOrProp("PROP_BOUNDARY", { envMap });
      stone.group.scale.setScalar(1.4);
      stone.group.position.y = .76 * 1.4;
      root.add(stone.group);
      // Wildflower meadow & realistic multi-branch trees on the free outside (-Z)
      [[-5.2, -4.6], [5.2, -4.8], [-2.8, -6.2], [3.2, -6.0]].forEach(function (tp) { addRealisticTree(tp[0], tp[1], 1.12, false); });
      const flowerCols = [0xfef08a, 0xf9a8d4, 0xffffff, 0x93c5fd];
      for (let f = 0; f < 24; f++) {
        const fx = ((f * 37) % 130) / 10 - 6.5;
        const fz = -1.4 - ((f * 23) % 58) / 10;
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color: flowerCols[f % flowerCols.length] }));
        fl.position.set(fx, 0.1, fz); root.add(fl);
      }
    }

    return {
      id: loc.id,
      spec: loc,
      theme: theme,
      isOutdoor: isOutdoor,
      isUnderground: isUnderground,
      group: root,
      corridorPortals: corridorPortals,
      bounds: { minX: -W / 2 + 0.8, maxX: W / 2 - 0.8, minZ: -D / 2 + 0.8, maxZ: D / 2 - 0.8 },
      update: function (t) { animators.forEach(function (fn) { fn(t); }); }
    };
  }

  global.CastleEscapeEnvironments = {
    DISTRICT_THEMES: DISTRICT_THEMES,
    CASTLE_LOCATIONS: CASTLE_LOCATIONS,
    createEnvironment: createEnvironment
  };
})(window);
