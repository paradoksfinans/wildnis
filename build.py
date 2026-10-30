#!/usr/bin/env python3
import base64, glob, os, json, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(ROOT, 'src/index.html'), encoding='utf-8').read()
assets = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'assets/*'))):
    n, ext = os.path.splitext(os.path.basename(f))
    mime = 'image/jpeg' if ext in ('.jpg', '.jpeg') else 'image/png'
    assets[n] = 'data:%s;base64,%s' % (mime, base64.b64encode(open(f, 'rb').read()).decode())
js_parts = []
for f in sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js'))):
    js_parts.append('// ==== %s ====\n' % os.path.basename(f) + open(f, encoding='utf-8').read())
js = '\n'.join(js_parts)
if '</script' in js:
    sys.exit('ERROR: </script inside JS')
out = tpl.replace('/*__ASSETS__*/', 'const ASSETS=' + json.dumps(assets) + ';').replace('/*__JS__*/', js)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist/wildnis-v3.html'), 'w', encoding='utf-8').write(out)
open(os.path.join(ROOT, 'dist/game.js'), 'w', encoding='utf-8').write('const ASSETS={};\n' + js)
print('built', len(out) // 1024, 'KB; js', len(js) // 1024, 'KB')
