"""Build the linked Markdown atlas from the author's UTF-8 JSON records."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
import posixpath

ROOT = Path(__file__).resolve().parents[1] / 'docs' / 'scenario'
DATA = ROOT / 'data'
ZONES = {'C': '中央宮', 'W': '西の記録棟', 'E': '東の暮らしと舞台', 'N': '北の学術・施療棟',
         'S': '南の客舎と職場', 'G': '中庭と庭園', 'B': '地下の仕事場', 'Q': '王家の礼拝区と境界'}
def read(name):
    return json.loads((DATA / name).read_text(encoding='utf-8'))

main = read('main.json')
rooms = read('rooms.json')
people = read('people.json')
threads = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((DATA/'threads').glob('*.json'))]
events = [e for t in threads for e in t['events']]
nodes = {x['id']: x for x in [*main, *events, *rooms, *people]}
locations = {}
titles = {}
incoming = defaultdict(list)
uses = defaultdict(list)
occupants = defaultdict(list)
adjacent = defaultdict(set)
for room in rooms:
    k = room['id']
    locations[k], titles[k] = 'castle.md', room['name']
    for n in room['neighbors']:
        adjacent[k].add(n)
        adjacent[n].add(k)
for p in people:
    k = p['id']
    locations[k], titles[k] = 'cast.md', p['name']
for m in main:
    k = m['id']
    locations[k], titles[k] = 'main-route.md', m['action']
    uses[m['room']].append(k)
    for p in people:
        if p['name'] in m['actor']:
            occupants[p['id']].append(k)
    for pre in m['requires']:
        incoming[pre].append(('成立条件', k))
for t in threads:
    for e in t['events']:
        k = e['id']
        locations[k], titles[k] = 'threads/' + t['id'] + '.md', e['title']
        uses[e['room']].append(k)
        if e['person']:
            occupants[e['person']].append(k)
        for clause in e['when']:
            for pre in clause:
                incoming[pre].append(('成立条件', k))
        for edge in e['links']:
            incoming[edge['target']].append((edge['type'], k))

def link(src, key, full=False):
    if key not in locations:
        return key
    dest = locations[key]
    path = '' if src == dest else posixpath.relpath(dest, posixpath.dirname(src) or '.')
    label = key + (' ' + titles[key] if full else '')
    return f'[{label}]({path}#{key.lower()})'

def heading(key, title):
    return f'<a id="{key.lower()}"></a>\n\n### {key}　{title}\n'

def back(src, key):
    distinct = list(dict.fromkeys(incoming[key]))
    if not distinct:
        return ''
    return '\n**この要素を参照する場面**　' + ' ／ '.join(link(src,k) + '（' + kind + '）' for kind,k in distinct) + '\n'

def menu(src):
    base = '../' if src.startswith('threads/') else ''
    return f'[資料の目次]({base}README.md) ・ [最短行程]({base}main-route.md) ・ [城内地図]({base}castle.md) ・ [人物]({base}cast.md)\n'

def when(src, clauses):
    return ' または '.join(' ＋ '.join(link(src,k) for k in c) for c in clauses) or '召喚直後'

def build():
    out = {}
    src = 'main-route.md'
    text = ['# 王都からの脱出　最短20行程\n', menu(src),
            '異世界の城へ呼ばれた一般人は、王に贈られた翻訳の首輪を外し、城の敷地の外へ出る。王女は迎えに来ない。子供のころの玩具と、後年、肖像に残した言葉が主人公を外へ導く。\n',
            '**行程の数え方**　新規開始から、プレイヤーが物語の状態を一段進める操作を一回と数える。移動、カメラ操作、メモの開閉、同じ操作で自動的に起きる結果は数えない。最初の二度の呼びかけは別々の選択。以下は最短の一例で、東の布札と北の釉板、医務の調査、王家の遺品、鐘番の調査には順序を入れ替えられる箇所がある。\n',
            '**クリア判定**　首輪が外れている、解除以降に一度も目撃されていない、王家の入口を通った同じ逃走である、抜け穴の境石を内から外へ越えた。この四条件を同時に満たした時だけ成功する。謁見や解除前の通常の会話は可能。南門での一礼は内側の検札で完結する。\n',
            '**場面を選ぶ**　'+' ・ '.join(link(src,m['id']) for m in main)+'\n']
    for m in main:
        k = m['id']
        text += [heading(k,m['action']), '**場所**　'+link(src,m['room'],True)+'　 **相手・対象**　'+m['actor']+'　 **成立に必要**　'+when(src,[m['requires']] if m['requires'] else [])+'\n',
                 m['scene']+'\n', '**変化**　'+m['effect']+'\n', back(src,k)]
    out[src]='\n'.join(text)
    for t in threads:
        src = 'threads/' + t['id'] + '.md'
        text = ['# '+t['id']+'　'+t['title']+'\n', menu(src), t['intro']+'\n',
                '**場面を選ぶ**　'+' ・ '.join(link(src,e['id']) for e in t['events'])+'\n']
        for e in t['events']:
            k=e['id']
            actor = link(src,e['person'],True) if e['person'] else '主人公のみ・場所の反応'
            text.extend([heading(k,e['title']), f'**{e["kind"]}**　'+link(src,e['room'],True)+'　'+actor+'\n',
                         '**成立に必要**　'+when(src,e['when'])+'　 **時期**　'+phase(e)+'\n',
                         '**行動**　'+e['action']+'\n', e['scene']+'\n', '**結果**　'+e['effect']+'\n',
                         '**他の場面との関係**　'+' ／ '.join(edge['type']+' → '+link(src,edge['target'],True) for edge in e['links'])+'\n', back(src,k)])
        out[src]='\n'.join(text)
    src='castle.md'
    text=['# 城内地図　'+str(len(rooms))+'地点\n', menu(src),
          '各部屋の「徒歩で隣接」をたどると、次にどこへ行けるか分かる。移動は双方向。敷地外の草地を含む境界地点はQ05だけで、南門検札所も馬車溜も敷地内にある。\n',
          '謁見前はC01のみ。謁見後は中央宮から四方と庭、地下の職場へ歩ける。W04→Q01は香車の予約後。Q01→Q02は解除後、Q02→Q03は未発見での横断後、Q03→Q04は像の開扉後。Q04からQ05の外側に足を置く操作が最終行程。逃走中の目撃・失敗で戻る先は[状態と死に戻り](rules.md)に示す。\n',
          chr(96)*3+'mermaid\nflowchart TD\n  C["中央宮"] --- W["西の記録棟"]\n  C --- E["東の暮らしと舞台"]\n  C --- N["北の学術・施療棟"]\n  C --- S["南の客舎と職場"]\n  E --- G["中庭と庭園"]\n  S --- G\n  N --- G\n  W --- B["地下の仕事場"]\n  E --- B\n  S --- B\n  N --- B\n  W --> Q["王家の礼拝区"]\n  Q --> O["境石の外"]\n'+chr(96)*3+'\n',
          '図は区域間の代表的な移動を示す。個々の直通路は下の「徒歩で隣接」にすべて載せた。\n']
    for z, name in ZONES.items():
        text.append('## '+name+'\n')
        for r in [r for r in rooms if r['id'][0]==z]:
            k=r['id']
            text += [heading(k,r['name']), r['feature']+'\n',
                     '**徒歩で隣接**　'+' ／ '.join(link(src,n,True) for n in sorted(adjacent[k]))+'\n',
                     '**ここで起こる場面**　'+(' ・ '.join(link(src,n) for n in uses[k]) or '途中の移動地点')+'\n']
    out[src]='\n'.join(text)
    src='cast.md'
    text=['# 人物　'+str(len(people))+'人\n',menu(src),'秘密の通路全体を最初から知っているのは国王と王女リゼ。主人公は王女の私筆と実物をつないで、例外的に道を知る。\n']
    for p in people:
        k=p['id']
        text += [heading(k,p['name']),'**主な居場所**　'+link(src,p['room'],True)+'\n',p['goal']+'\n',
                 '**知っている範囲**　'+p['knows']+'\n','**登場**　'+' ・ '.join(link(src,n) for n in occupants[k])+'\n']
    out[src]='\n'.join(text)
    return out

def phase(e):
    n=int(e['id'][1:])
    if n in (1,2): return '謁見の一声目'
    if n in AFTER: return '解除後、境石を越えるまで'
    return '謁見後、解除前'

AFTER = set(range(273, 301))
if __name__=='__main__':
    arg=argparse.ArgumentParser()
    arg.add_argument('--check', action='store_true')
    options=arg.parse_args()
    for name,content in build().items():
        target=ROOT/name
        content=content.rstrip()+'\n'
        if options.check:
            if not target.exists() or target.read_text(encoding='utf-8')!=content:
                raise SystemExit('要再生成 '+name)
        else:
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_text(content,encoding='utf-8')
