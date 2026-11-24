"use strict";

// Fingerprints of the original Japanese choice labels. Keep the old identifiers
// so old saves still recognize a repeated action.
const previousWarningIds = {
  "C01.sword.correct": "o6ekik", "C01.sword.danger1": "yjxqbl", "C01.sword.danger2": "61qkle", "C01.sword.neutral": "1pbnr1i",
  "E001.correct": "a1jv42", "E002.correct": "gnfqpw", "E002.danger1": "mpr6w5", "E003.correct": "1hibzjv",
  "E004.correct": "nuc9y3", "E005.A.correct": "auspkx", "E005.B.correct": "9qzjm3", "E006.A.correct": "nfh0wo",
  "E006.B.correct": "13otdq3", "E007.correct": "1m21gqi", "E008.correct": "rrt53t", "E009.correct": "1en3qkx",
  "E010.A.correct": "w80u0u", "E010.B.correct": "5m0fqy", "E011.correct": "1ytpfhe", "E012.correct": "15gxna8",
  "E013.correct": "1sqzvtl", "E014.correct": "oz4oef", "E015.correct": "1ukgxya", "E016.correct": "1vi82sf",
  "E017.correct": "1emdxt4", "E018.A.correct": "122rnc2", "E018.B.correct": "3twq4t", "E019.correct": "1celrkp",
  "E020.correct": "12yb7sx", "E021.correct": "1nflivn", "E022.correct": "13lnzp3", "E023.correct": "1ynqats",
  "E024.A.correct": "lqz6w2", "E024.B.correct": "1purokl", "E025.correct": "1rraubl", "E025.danger1": "1ukmkyk",
  "E026.correct": "h7h3wt", "E027.correct": "z517ux", "E028.correct": "1hr6bjx", "E029.correct": "r3prz9",
  "E030.correct": "szruff", "E031.correct": "1is8fxc", "E032.correct": "o4466l", "E033.correct": "177o3to",
  "E034.correct": "1e1g7p3", "E035.A.correct": "1aa4z1x", "E035.B.correct": "3pm5iz", "E036.correct": "1pxan1y",
  "E037.correct": "112efi3", "E038.correct": "1byxhyz", "E039.correct": "1vuqpd9", "E040.correct": "12vlaw2",
  "E041.correct": "5g0jli", "E041.danger1": "1pm1qtl", "E042.correct": "dcobib", "E043.correct": "19perd4",
  "E044.correct": "1356ycy", "E045.correct": "14rx5o7", "E046.correct": "4ruvhz", "E047.correct": "advgvz",
  "E048.correct": "huue5p", "E049.correct": "licl6j", "E050.correct": "1p7h2pz", "E051.correct": "1uj8kj9",
  "E052.correct": "1wjdm1l", "E053.correct": "1o4ri0j", "E054.A.correct": "8500uf", "E054.B.correct": "n9of2e",
  "E055.correct": "1syhyp5", "E055.danger1": "of0obo", "E056.correct": "wc0nhh", "E057.correct": "bd0wwy",
  "E058.correct": "1j7bxeg", "E059.A.correct": "rgvrcv", "E059.B.correct": "x1s1wb", "E060.correct": "tovi5f",
  "E061.correct": "1m4u9st", "E062.correct": "12sf0s4", "E063.correct": "sqqq6v", "E064.A.correct": "dh0g82",
  "E064.B.correct": "bm7mqz", "E065.correct": "d481np", "E066.correct": "122xql", "E067.correct": "uajb4x",
  "E067.danger1": "r681jm", "E068.correct": "emwwt3", "E069.correct": "tt74rl", "E070.A.correct": "gnrlsj",
  "E070.B.correct": "keku7u", "E071.correct": "1gscpgq", "E072.correct": "1153n8f", "E073.correct": "yls5kd",
  "E074.correct": "ylc4jd", "E075.correct": "1ubwqdy", "E076.correct": "1qyrtas", "E077.correct": "2s2082",
  "E078.correct": "1y93yo3", "E079.correct": "fs9k8f", "E080.correct": "5mrny7", "E081.A.correct": "sfa5ij",
  "E081.B.correct": "1qddahz", "E082.correct": "1wfbpzu", "E083.correct": "wdzljk", "E084.correct": "1hda2mn",
  "E085.correct": "cj0o5b", "E085.danger1": "6ev8kr", "E086.correct": "1py9ya4", "E087.A.correct": "1yetc8s",
  "E087.B.correct": "7ojdpm", "E088.correct": "b4ctiv", "E089.correct": "1727vub", "E090.correct": "14l2u94",
  "E091.correct": "5u22mk", "E092.correct": "1t2z082", "E093.correct": "1oibw47", "E094.correct": "o21bmi",
  "E095.correct": "1tr2p2", "E096.A.correct": "1bd469u", "E096.B.correct": "c29adi", "E097.correct": "1is3ez4",
  "E098.correct": "qa0t4x", "E099.correct": "cde5vb", "E100.correct": "z682gt", "E101.correct": "qn8aiu",
  "E102.A.correct": "ljnm4", "E102.B.correct": "1gpz55w", "E103.correct": "15xdq72", "E104.correct": "4ojeic",
  "E105.correct": "3pbs8h", "E106.correct": "ybv7lj", "E107.correct": "1hlyz81", "E108.correct": "b2mmay",
  "E109.correct": "ibkr38", "E110.correct": "14xl9s7", "E111.correct": "sc0n6t", "E112.A.correct": "1x32363",
  "E112.B.correct": "y0goga", "E113.correct": "1sk7qe9", "E114.correct": "hdjc8k", "E114.danger1": "1xzc0l0",
  "E115.correct": "exv6xw", "E116.correct": "c22xie", "E117.correct": "1ynjd28", "E118.correct": "kcvwp0",
  "E119.A.correct": "xoi2h1", "E119.B.correct": "1fuqk5f", "E120.correct": "1b7jige", "E121.correct": "1qqylsn",
  "E122.correct": "k7cpbn", "E123.correct": "1gcy11j", "E124.A.correct": "3ej4cs", "E124.B.correct": "1e5b3r9",
  "E125.correct": "dvzrdf", "E126.correct": "1of4tlm", "E127.correct": "1mewdg", "E128.correct": "g5nilq",
  "E129.correct": "1p6ag9n", "E130.correct": "1gs73rs", "E131.correct": "1j0qwwu", "E132.A.correct": "1e9a0l3",
  "E132.B.correct": "m9jy6x", "E133.correct": "18odg18", "E134.correct": "3f1u3a", "E135.correct": "b5gc5j",
  "E136.correct": "1vtaw5u", "E137.correct": "onwxi", "E138.correct": "uuhh4n", "E139.correct": "1xzqxtu",
  "E140.correct": "1kaqa01", "E141.A.correct": "1glqhk1", "E141.B.correct": "qcrdnz", "E142.correct": "1wn1ck6",
  "E143.correct": "tz9vmz", "E143.danger1": "1541bwz", "E144.correct": "7nrt4a", "E145.correct": "13u7of4",
  "E146.correct": "13hcz7a", "E147.correct": "1jvxia6", "E149.A.correct": "1s7nugg", "E149.B.correct": "syt3i6",
  "E150.correct": "1xd1on0", "E151.correct": "1qjaciw", "E152.A.correct": "1joafmm", "E152.B.correct": "18y4ltp",
  "E153.correct": "t66khj", "E153.danger1": "59m3ng", "E154.correct": "8ksgpg", "E155.correct": "624bsq",
  "E156.correct": "13lsv23", "E157.correct": "1ea0os0", "E158.correct": "pwllc2", "E159.correct": "12mbgi7",
  "E160.A.correct": "1fl4g9i", "E160.B.correct": "8se45", "E161.correct": "1lxlpah", "E162.correct": "1jglfvk",
  "E163.A.correct": "7q0g43", "E163.B.correct": "13b5vh3", "E164.correct": "1be0sz6", "E165.correct": "1fajedo",
  "E166.correct": "q2t4ul", "E167.correct": "aj2jxv", "E168.correct": "1v68ayi", "E169.correct": "99kvxq",
  "E170.A.correct": "1j9xvrg", "E170.B.correct": "1gocjvg", "E171.correct": "1tyq99h", "E172.correct": "j6wkom",
  "E173.A.correct": "trjk6d", "E173.B.correct": "lhbcbq", "E174.correct": "huxmeb", "E175.correct": "nkmz2l",
  "E176.correct": "19qlvk7", "E177.correct": "p1oe6e", "E178.correct": "tl5vvk", "E179.correct": "1pg250k",
  "E180.correct": "imrtyp", "E181.correct": "6z7ler", "E182.correct": "1lp4sgg", "E183.correct": "14oug6b",
  "E184.correct": "1u1bluj", "E184.danger1": "1r9aih7", "E185.A.correct": "1qe54na", "E185.B.correct": "1xrx769",
  "E186.correct": "11au84f", "E187.correct": "17hsmgd", "E188.correct": "1nxtil9", "E189.correct": "l4tx1x",
  "E190.A.correct": "1khuuo4", "E190.B.correct": "cjf83c", "E191.correct": "vzb4st", "E192.correct": "p4ypf1",
  "E193.correct": "swy6xe", "E194.correct": "1piff1t", "E195.correct": "18ido0", "E196.correct": "1d2mp8k",
  "E197.correct": "17w5fht", "E198.correct": "12vjjl3", "E199.A.correct": "1ndqhbu", "E199.B.correct": "1ajzkm8",
  "E200.correct": "1av0pv4", "E201.correct": "hhhgc9", "E202.correct": "1ljql4d", "E203.A.correct": "5y1di3",
  "E203.B.correct": "1tckgbl", "E204.correct": "1o5dpp1", "E204.danger1": "v4hv9z", "E205.correct": "n3ipbl",
  "E206.correct": "1ro7dz6", "E207.correct": "201yvs", "E208.correct": "1pm7hnn", "E209.correct": "1xhi8a9",
  "E210.correct": "1uqvqp5", "E211.correct": "7apu88", "E212.correct": "1bybzcz", "E213.correct": "1rsnumt",
  "E213.danger1": "157lj8w", "E214.A.correct": "xzxmd8", "E214.B.correct": "1tjo495", "E215.correct": "1iz2ywl",
  "E216.A.correct": "195arm1", "E216.B.correct": "zxgqtl", "E217.correct": "168cq1p", "E218.correct": "l4d3o7",
  "E219.correct": "180a697", "E220.correct": "ayxr0b", "E221.correct": "1v8j0ie", "E221.danger1": "u1kzvh",
  "E222.correct": "1s3rljd", "E223.correct": "8hejii", "E224.correct": "1q9277t", "E225.correct": "dytj62",
  "E226.correct": "v4pzj5", "E227.correct": "1ox37wc", "E228.correct": "8u1ust", "E229.correct": "138eeem",
  "E230.A.correct": "l5hqix", "E230.B.correct": "a6bb9", "E231.correct": "1lat23o", "E232.correct": "zv5x1v",
  "E232.danger1": "gkhx6a", "E233.correct": "aszju1", "E234.correct": "97jev1", "E235.A.correct": "1j32d71",
  "E235.B.correct": "dr4aqx", "E236.correct": "dht7jn", "E237.correct": "un2dgr", "E238.correct": "1k44p1u",
  "E239.correct": "1ban5w2", "E240.correct": "138jj31", "E241.correct": "blsjt6", "E242.correct": "1ggvi8z",
  "E243.correct": "14p748d", "E244.correct": "199s13j", "E245.correct": "tl21dr", "E246.A.correct": "1ed5avt",
  "E246.B.correct": "vok0du", "E247.correct": "1z0atpy", "E247.danger1": "l464bk", "E248.correct": "kjjnj4",
  "E249.correct": "10zt53v", "E250.A.correct": "86vpz3", "E250.B.correct": "zhdljc", "E251.correct": "6t6ubv",
  "E252.correct": "1s3c69p", "E253.correct": "125fu5r", "E254.A.correct": "6kkjxl", "E254.B.correct": "1b3auo3",
  "E255.correct": "19qp1uz", "E256.correct": "1y20exp", "E257.correct": "1mwmfdu", "E258.correct": "2org1e",
  "E259.correct": "g7cuue", "E260.A.correct": "o8yf9q", "E260.B.correct": "szrnb1", "E261.correct": "hwq028",
  "E262.correct": "1jhyh9k", "E263.correct": "1wfsgvu", "E263.danger1": "17bjpg0", "E264.correct": "bxffa",
  "E265.A.correct": "102eluj", "E265.B.correct": "i87fll", "E266.correct": "f7qglg", "E267.correct": "mq26h3",
  "E268.correct": "c7i25s", "E269.correct": "1f4l6id", "E270.correct": "10r5gz2", "M01.correct": "3cexlp",
  "M01.danger1": "vlxgts", "M01.danger2": "11jlh3b", "M01.danger3": "1h8xbj1", "M02.correct": "1ypmcaj",
  "M02.danger1": "1rizhzn", "M02.danger2": "h53d56", "M02.neutral": "o5eo6v", "M03.correct": "1a4ek6p",
  "M03.danger1": "bc9je6", "M03.danger2": "1jnqqmt", "M03.neutral": "1gv6zy0", "M04.correct": "ziqffl",
  "M04.danger1": "co5tiz", "M04.danger2": "l500cx", "M04.neutral": "1lmd8p7", "M05.correct": "t7sdhv",
  "M05.danger1": "1ve7irj", "M05.danger2": "zrnxn0", "M05.neutral": "1lb5tog", "M07.correct": "1ffhtya",
  "M07.danger1": "eaj6z8", "M07.danger2": "15p7rb0", "M07.neutral": "1hzwgt6", "M15.correct": "1cgl6bh",
  "M15.danger1": "1fmx3eq", "M15.danger2": "19qnlcp", "M15.neutral": "4yo23l", "P01.reply0": "1lhui5i",
  "P01.reply2": "16bxqun", "P02.correct": "zgepao", "P02.reply0": "j549fm", "P02.reply1": "nj4ggn",
  "P02.reply2": "1oe7dii", "P03.reply0": "1ak8e1o", "P03.reply1": "b5mbqo", "P03.reply2": "ks6imp",
  "P04.reply0": "r2vpt3", "P04.reply1": "z0whpu", "P04.reply2": "1kjwyvt", "P05.reply0": "b405y1",
  "P05.reply1": "xhkxsv", "P05.reply2": "y0ibwd", "P06.reply0": "10d2me8", "P06.reply1": "i5nxp",
  "P06.reply2": "vgjz66", "P07.reply0": "19j2ezl", "P07.reply1": "dzmpt5", "P07.reply2": "3nx31k",
  "P08.reply0": "1efsbqa", "P08.reply1": "1jtyomy", "P08.reply2": "1ge4zi3", "P09.reply0": "7kmy9r",
  "P09.reply1": "18yn4zb", "P09.reply2": "1rk3yaj", "P10.reply0": "1sw2v0x", "P10.reply1": "fr25ay",
  "P10.reply2": "1xx75am", "P11.reply0": "ri12f9", "P11.reply1": "guy6v8", "P11.reply2": "175dalp",
  "P12.reply0": "19notk5", "P12.reply1": "nobopi", "P12.reply2": "z21yar", "P13.reply0": "1d88smr",
  "P13.reply1": "jtd7ts", "P13.reply2": "19zii5a", "P14.reply0": "1evqumt", "P14.reply1": "8063os",
  "P14.reply2": "1gh6o7c", "P15.reply0": "ctbo5e", "P15.reply1": "btpv4m", "P15.reply2": "1o4ckz5",
  "P16.reply0": "1cfe6d8", "P16.reply1": "jbozt4", "P16.reply2": "9y9kgb", "P17.reply0": "vh2vfc",
  "P17.reply1": "t2n79t", "P17.reply2": "1usdrvd", "P18.reply0": "2ccujv", "P18.reply1": "1pf7u6m",
  "P18.reply2": "1qrbi3w", "P19.reply0": "106yq74", "P19.reply1": "tsew3x", "P19.reply2": "1uytzla",
  "P20.reply0": "rap7ah", "P20.reply1": "1836jh2", "P20.reply2": "16yme75", "P21.reply0": "ni60ml",
  "P21.reply1": "629qz9", "P21.reply2": "xlu5xz", "P22.reply0": "15t4zre", "P22.reply1": "infccq",
  "P22.reply2": "1ipzk5l", "P23.reply0": "otjm1f", "P23.reply1": "7dcgls", "P23.reply2": "j8p6jh",
  "P24.reply0": "1ah0fqe", "P24.reply1": "fm80gz", "P24.reply2": "16n8ndj", "P25.reply0": "1pvmvmd",
  "P25.reply1": "1yrmigl", "P25.reply2": "1eh3wis", "P26.reply0": "uldu0m", "P26.reply1": "1n31k9w",
  "P26.reply2": "l2wjl4", "P27.reply0": "1ajk5q8", "P27.reply1": "1e3g1yj", "P27.reply2": "1qfctz8",
  "P28.reply0": "aghkjl", "P28.reply1": "1b0q9iv", "P28.reply2": "15ovlq5", "P29.reply0": "ng0nym",
  "P29.reply1": "1xzf06z", "P29.reply2": "1fgnh7d", "P30.reply0": "u3kspk", "P30.reply1": "1likif5",
  "P30.reply2": "1fbhjqp", "P31.reply0": "11v8z7b", "P31.reply1": "1s09s76", "P31.reply2": "16980o0",
  "P32.reply0": "11ljt2l", "P32.reply1": "1crhku2", "P32.reply2": "11b8edc", "P33.reply0": "u3onoe",
  "P33.reply1": "6259v8", "P33.reply2": "zcrbh3", "P34.reply0": "1t1mbeu", "P34.reply1": "1cgrtwh",
  "P34.reply2": "1cfdx2a", "P35.reply0": "10tffs7", "P35.reply1": "1ojdl68", "P35.reply2": "o86iof",
  "P36.reply0": "1fb688q", "P36.reply1": "1hva2lp", "P36.reply2": "14bqurd"
};

function warningHash(label) {
  let hash = 2166136261;
  for (let i = 0; i < label.length; i++) {
    hash = Math.imul(hash ^ label.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(36);
}

function conversationWarningKey(person, choice) {
  const custom = choice.key.startsWith("M") || choice.key.startsWith("C01.sword.") ||
    choice.outcome === "correct" || (choice.key.endsWith(".danger1") && fatalSceneReply[choice.key.split(".")[0]]);
  const reply = custom ? -1 : characterReplies[person.id].indexOf(choice.label);
  const choiceId = reply < 0 ? choice.key : person.id + ".reply" + reply;
  return person.id + "#" + (previousWarningIds[choiceId] ?? choiceId);
}

function upgradeWarningKey(key) {
  if (typeof key !== "string" || !/^P\d{2} /.test(key)) return key;
  return key.slice(0,3) + "#" + warningHash(key.slice(4));
}
