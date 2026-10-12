"""Builds index.html (the standalone app) from the files in src/.

    python3 src/build.py

To refresh the SRD data: clone https://github.com/5e-bits/5e-database and run
    python3 src/srd/build_srd.py <path-to>/5e-database/src/2024/en
"""
import json, os
H = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.dirname(H.rstrip('/')) + '/'
s = open(H + 'storyboard.src.html').read()
bridge = open(ROOT + 'roll20/storyboard-bridge.js').read()
mods = '\n'.join(open(H + f).read() for f in ['srd/srd-data.js', 'spells-data.js', 'modules.js', 'screen.js', 'grid.js', 'everything.js', 'bestiary.js', 'links.js', 'archive.js', 'npc.js'])
s = s.replace('/*__MODULES_CSS__*/', open(H + 'modules.css').read()).replace('/*__MODULES_JS__*/', mods)
assert '__MODULES' not in s
body = s.replace('__SCRIPT__', json.dumps(bridge).replace('</', '<\\/'))
shim = '\n'.join(open(H + f).read() for f in ['fallen-lands.js', 'fallen-lands-npcs.js', 'fallen-lands-network.js', 'stormhollow.js', 'standalone-shim.js'])
assert body.count('<script>\nconst ROLL20_SCRIPT') == 1
app = body.replace('<script>\nconst ROLL20_SCRIPT', '<script>\nwindow.__sbForceLocal = true; window.__STANDALONE = true;\n' + shim + '\n</script>\n<script>\nconst ROLL20_SCRIPT')
head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n')
open(ROOT + 'index.html', 'w').write(head + app + '\n</body>\n</html>\n')
print('Built index.html,', os.path.getsize(ROOT + 'index.html') // 1024, 'KB')
