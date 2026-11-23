"""Verify the author's scenario model. No game engine or third-party libraries required."""
from collections import Counter, deque
from functools import lru_cache
from itertools import product
import re
from urllib.parse import urlsplit

import scenario_atlas as atlas

def require(ok, message):
    if not ok:
        raise ValueError(message)

rules = atlas.read('escape.json')
main = {m['id']: m for m in atlas.main}
events = {e['id']: e for e in atlas.events}
rooms = {r['id'] for r in atlas.rooms}
people = {p['id'] for p in atlas.people}
branches = {b['id'] for e in atlas.events for b in e.get('branches', [])}
milestones = list(main)
bit = {key: 1 << i for i, key in enumerate(milestones)}
deps = {k: sum(bit[d] for d in row['requires']) for k, row in main.items()}
gates = {frozenset(g['rooms']): bit[g['opens']] for g in rules['gates']}
removed = rules['collar_removed']
finish = rules['finish']
threshold = {'謁見の一声目': 0, '謁見後、解除前': 1, '解除後、境石を越えるまで': 2}

def catalog():
    require(milestones == [f'M{i:02}' for i in range(1,21)], '必須20行程の番号')
    require(list(events) == [f'E{i:03}' for i in range(1,301)], '任意300件の番号')
    require(len({e['title'] for e in atlas.events}) == 300, '任意場面の題名重複')
    require(len({e['action'] for e in atlas.events}) == 300, '任意場面の行動重複')
    require(len(atlas.nodes)==sum(map(len,(atlas.main,atlas.rooms,atlas.people,atlas.events,atlas.items))), '識別子の重複')
    require(set(rules['can_rehearse_both']) <= events.keys(), '練習の識別子')
    require(len(atlas.threads) == 20 and all(len(t['events']) == 15 for t in atlas.threads), '各編の構成')
    require(len(branches) == 2 * sum(e['kind']=='選択' for e in events.values()), '選択識別子の重複')
    for room in atlas.rooms:
        for n in room['neighbors']:
            require(n in rooms and n != room['id'], '存在しない隣室 '+n)
    for gate in rules['gates']:
        a,b = gate['rooms']
        require(b in atlas.adjacent[a], '地図にない扉 '+a+b)
    for p in atlas.people:
        require(p['room'] in rooms and p['relative'] in people and p['id']!=p['relative'], p['id']+' 人物の参照')
        require(p['line'] and bool(atlas.occupants[p['id']]), p['id']+' 台詞または登場場面')
    for e in atlas.events:
        key=e['id']
        require(e['room'] in rooms and (e['person'] in people or e['person'] is None), key+' 場所・人物')
        require(set(e.get('also_people',[]))<=people, key+' 同席人物')
        require(e['phase'] in threshold and e['record'] in ['手帳の記憶','その時点の世界'], key+' 時期・保存')
        require(all(e[f].strip() for f in ('title','action','scene','effect')), key+' 本文不足')
        require(e['links'] and all(edge['target'] in main or edge['target'] in events for edge in e['links']), key+' 関係先')
        if e['kind']=='選択':
            require([b['id'] for b in e['branches']]==[key+'.A',key+'.B'], key+' 選択の値')
            require(len({b['effect'] for b in e['branches']})==2, key+' 同じ分岐結果')
            require(e['payoff'] and all(v in main or v in events for v in e['payoff']), key+' 分岐の反映先')
    for i in atlas.items:
        source=main[i['found']]
        require(all(k in main and main[k]['room']!=source['room'] for k in i['uses']), i['id']+' 入手・使用場所')
        require(all(i['found'] in required_ancestors(k) for k in i['uses']), i['id']+' 入手前の使用')
    for key,entry in main.items():
        require(entry['room'] in rooms and set(entry['requires'])<=main.keys(), key+' 必須操作が任意条件に依存')
    require(atlas.adjacent['Q05']=={'Q04'} and atlas.adjacent['Q04']=={'Q03','Q05'},'王家の抜け穴に別の出入口がある')

@lru_cache(None)
def required_ancestors(key):
    found=set(main[key]['requires'])
    for parent in main[key]['requires']:
        found.update(required_ancestors(parent))
    return found

@lru_cache(None)
def walks(room, mask):
    distance={room:0}
    todo=deque([room])
    while todo:
        p=todo.popleft()
        for n in atlas.adjacent[p]:
            gate=gates.get(frozenset((p,n)),0)
            if n in distance or mask & gate != gate:
                continue
            if mask & bit[removed] and not n.startswith('Q'):
                continue
            distance[n]=distance[p]+1
            todo.append(n)
    return distance

def shortest(disable=None):
    start=rules['start_room']
    todo=deque([(0,0)])
    seen={0}
    while todo:
        mask,distance=todo.popleft()
        if mask & bit[finish]:
            return distance
        start_room='Q01' if mask & bit[removed] else start
        reachable=walks(start_room,mask)
        for k,m in main.items():
            if k==disable or mask & bit[k] or mask & deps[k] != deps[k] or m['room'] not in reachable:
                continue
            nxt=mask|bit[k]
            if nxt not in seen:
                seen.add(nxt)
                todo.append((nxt,distance+1))
    return None

def route():
    require(required_ancestors(finish)==set(main)-{finish},'到達に不要な必須行程')
    require(shortest()==20, '設計上の最短が20以外')
    for key in main:
        require(shortest(disable=key) is None, key+' を飛ばして成功')
    mask=0
    position=rules['start_room']
    travel=0
    for key,m in main.items():
        require(mask & deps[key]==deps[key], '掲載順では進行不能 '+key)
        reach=walks(position,mask)
        require(m['room'] in reach, '掲載順で移動不能 '+key)
        travel+=reach[m['room']]
        position=m['room']
        mask|=bit[key]
    maximum=20*rules['minutes_per_new_action']+travel*rules['minutes_per_room_change']+rules['max_wait_for_patrol']
    require(maximum<rules['minutes_until_obedience'],'最短例でも刻限を超過')
    require(len(walks('C01',bit['M01']|bit['M02']))==len(rooms)-5,'謁見後の公開区画に孤立地点')
    return travel,maximum

# Witnesses carry only mutually exclusive decisions required by a given scene.
# This avoids falsely accepting a scene that needs both versions of a one-off gift.
def stage(key):
    if key not in main:
        return threshold[events[key]['phase']]
    if key == 'M01':
        return 0
    if key == finish:
        return 3
    if key == removed or removed in required_ancestors(key):
        return 2
    return 1

@lru_cache(None)
def guaranteed_main(token):
    key=token.split('.')[0]
    if key in main:
        return required_ancestors(key) | {key}
    scene=events[key]
    options=[set().union(*(guaranteed_main(t) for t in clause)) for clause in scene['when']]
    common=set.intersection(*options) if options else set()
    if stage(key)==2:
        common.update(guaranteed_main(removed))
    elif stage(key)==1:
        common.update(guaranteed_main('M02'))
    return common

active=set()
@lru_cache(None)
def witnesses(token):
    if token in main:
        return {frozenset()}
    owner, _, option=token.partition('.')
    require(owner in events and (not option or token in branches),'不明な前提 '+token)
    require(token not in active, '条件の循環 '+token)
    active.add(token)
    e=events[owner]
    possibilities=set()
    for clause in e['when'] or [[]]:
        partial={frozenset()}
        for pre in clause:
            source=pre.split('.')[0]
            require(stage(source)<=threshold[e['phase']],token+' 時期が逆転 '+pre)
            next_sets=set()
            for a,b in product(partial,witnesses(pre)):
                combined=a|b
                if compatible(combined):
                    next_sets.add(combined)
            partial=next_sets
        possibilities.update(partial)
    if option:
        possibilities={v|{token} for v in possibilities if compatible(v|{token})}
    active.remove(token)
    return possibilities

def compatible(required):
    owner={}
    for b in required:
        k,opt=b.split('.')
        if k not in rules['can_rehearse_both'] and k in owner and owner[k]!=opt:
            return False
        owner[k]=opt
    return True

def optional():
    for key in events:
        e=events[key]
        require(witnesses(key), '到達不能な任意場面 '+key)
        position='Q01' if threshold[e['phase']]==2 else rules['start_room']
        mask=sum(bit[k] for k in guaranteed_main(key))
        require(e['room'] in walks(position,mask), key+' 前提を満たしても部屋へ行けない')
        if threshold[e['phase']]==2:
            require(e['person'] is None and not e.get('also_people'),key+' 逃走中の相対会話')
        for b in e.get('branches',[]):
            require(witnesses(b['id']), '到達不能な選択 '+b['id'])
    for a,b in [('E192','E194'),('E237','E239')]:
        require(not any(compatible(x|y) for x,y in product(witnesses(a),witnesses(b))), a+' 排他性')
    require(witnesses('E195') and witnesses('E240'), '排他分岐の再合流')

def clears(collar_off, ever_seen, same_entrance, room, event):
    return collar_off and not ever_seen and same_entrance and room==rules['boundary_room'] and event==rules['boundary_event']

def endings():
    count=0
    for off,seen,royal,room,event in product((False,True),(False,True),(False,True),
            ('S04','S05','Q03','Q04','Q05'),('入室','境石の手前で観察','境石を外から内へ横切る',rules['boundary_event'])):
        expected=(off,seen,royal,room,event)==(True,False,True,'Q05','境石を内から外へ横切る')
        require(clears(off,seen,royal,room,event)==expected,'誤った終端')
        count+=1
    for observations in product((False,True), repeat=3):
        seen=False
        for sighting in observations:
            seen=seen or sighting
        require(clears(True,seen,True,'Q05',rules['boundary_event'])==(not any(observations)),'目撃履歴消失')
    return count

def markdown():
    root=atlas.ROOT.parent.parent
    docs=[root/'README.md',*sorted(atlas.ROOT.rglob('*.md'))]
    anchors={p.resolve(): set(re.findall(r'<a id="([^"]+)"',p.read_text())) for p in docs}
    count=0
    for f in docs:
        for target in re.findall(r'\[[^\]\n]*\]\(([^)\s]+)\)',f.read_text()):
            u=urlsplit(target)
            if u.scheme: continue
            dest=(f.parent/u.path).resolve() if u.path else f.resolve()
            require(dest.exists(), f.name+' 参照先がない '+target)
            if u.fragment:
                require(u.fragment in anchors.get(dest,set()),f.name+' アンカーがない '+target)
            count+=1
    for name,code in atlas.build().items():
        require((atlas.ROOT/name).read_text()==code.rstrip()+'\n', name+' 要再生成')
    return count

if __name__=='__main__':
    catalog()
    travel,minutes=route()
    optional()
    finishes=endings()
    links=markdown()
    print(f'必須 {len(main)}、任意 {len(events)}、選択肢 {len(branches)}、人物 {len(people)}、地点 {len(rooms)}、重要品 {len(atlas.items)}')
    print(f'最短 20、各行程を禁止すると20件すべてクリア不能。掲載例の部屋移動 {travel}、設計時計の上限 {minutes} 分')
    print(f'全任意場面と選択値の成立条件を確認。終端 {finishes} 通り、目撃履歴 8 通り、文書内リンク {links}')
    print(dict(Counter(e['kind'] for e in events.values())))
