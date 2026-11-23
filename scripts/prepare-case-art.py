"""Encode the generated still lifes for fast delivery; preserve all source PNGs."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'src/showcases/project-art'
manifest = json.loads((ROOT / 'scripts/showcase-sources/case-system/artwork.json').read_text(encoding='utf-8'))
for item in manifest['assets']:
    source = Path(item['source'])
    target = ART / (item['key'] + '.webp')
    with Image.open(source) as image:
        image.convert('RGB').save(target, 'WEBP', quality=89, method=6)
    print(f"{target.name}: {target.stat().st_size // 1024} KB")
