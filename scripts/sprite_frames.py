"""Extract connected character silhouettes instead of slicing through neighboring art.

This is an atlas layout/import step: source pixels and source sheets are preserved.
Only pixels belonging to the selected silhouette enter its exported frame.
"""
from PIL import Image


def silhouettes(image, expected=12):
    width, height = image.size
    foreground = bytearray(255 if alpha >= 128 else 0
                           for alpha in image.getchannel('A').tobytes())
    found = []
    for seed in range(len(foreground)):
        if not foreground[seed]:
            continue
        foreground[seed] = 0
        pending = [seed]
        pixels = []
        while pending:
            index = pending.pop()
            pixels.append(index)
            x, y = index % width, index // width
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    neighbor = ny * width + nx
                    if foreground[neighbor]:
                        foreground[neighbor] = 0
                        pending.append(neighbor)
        # Dust and detached background remnants are not character silhouettes.
        if len(pixels) > 400:
            found.append(pixels)
    if len(found) != expected:
        raise ValueError(f'Expected {expected} separated sprites, found {len(found)}. '
                         'Fix touching source artwork instead of exporting mixed frames.')
    found.sort(key=lambda pixels: (min(i % width for i in pixels) +
                                   max(i % width for i in pixels)) / 2)
    frames = []
    for pixels in found:
        mask = bytearray(width * height)
        for index in pixels:
            mask[index] = 255
        alpha = Image.frombytes('L', (width, height), bytes(mask))
        frame = image.copy()
        frame.putalpha(alpha)
        frames.append(frame.crop(alpha.getbbox()))
    return frames


def pack(frame, scale, box=(96, 112), gutter=2):
    """Keep a transparent gutter and feet pivot, without interpolating pixels."""
    factor = min(scale, (box[0] - gutter * 2) / frame.width,
                 (box[1] - 4 - gutter) / frame.height)
    resized = frame.resize((max(1, round(frame.width * factor)),
                            max(1, round(frame.height * factor))),
                           Image.Resampling.NEAREST)
    # Anchor the feet, not the weapon/FX bounding-box midpoint.
    alpha = resized.getchannel('A')
    sole = [(x, y) for y in range(max(0, resized.height - 5), resized.height)
            for x in range(resized.width) if alpha.getpixel((x, y))]
    foot = sum(x for x, _ in sole) / len(sole) if sole else resized.width / 2
    x = round(box[0] / 2 - foot)
    x = max(gutter, min(box[0] - gutter - resized.width, x))
    out = Image.new('RGBA', box)
    out.alpha_composite(resized, (x, box[1] - 4 - resized.height))
    return out
