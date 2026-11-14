"""各アームの描画監査 (report.json) から、トークンに依存しない指標だけを抜き出して比較する。"""
import json, sys, collections
for arm in sys.argv[1:]:
    d = json.load(open(f'experiments/ab/{arm}.report.json'))
    t = d['targets'][0]
    c = collections.Counter(f['rule'] for f in d['findings'] if f['target'] == t['target'])
    sizes = sorted({s for r in t['runs'] for s in r['stats']['fontSizes']})
    desk = next(r for r in t['runs'] if r['viewport'] == 'desktop' and r['theme'] == 'light')
    print(f"{arm}: contrast={c['contrast']} tiny-text={c['tiny-text']} tap<24px={c['tap-target']} focus={c['focus-visible']} "
          f"no-name/label={c['no-name']+c['no-label']} overflow-x={c['overflow-x']} | "
          f"font sizes(all viewports)={len(sizes)} {sizes} | min={min(sizes)}px | fonts={desk['stats']['fonts']}")
