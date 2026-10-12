"""Offline asset contracts. Validation is technical, never artistic approval.

Import a native PNG plus a JSON contract into a staging directory, then validate
before publishing it and the registry together. No network or generation API.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse
import hashlib
import json
import os
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets"
MANIFEST = ASSETS / "animations/manifest.json"


def safe_path(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or Path(relative).is_absolute():
        raise ValueError(f"Asset path escapes its root: {relative}")
    return path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect(entry, root=ASSETS):
    errors, warnings = [], []
    try:
        path = safe_path(root, entry["path"])
        source_image = Image.open(path)
        image = source_image.convert("RGBA")
        if digest(path) != entry["sha256"]:
            errors.append("file hash differs from the registered version")
        if list(image.size) != entry["sourceSize"]:
            errors.append("source dimensions differ from contract")
        if not entry.get("provenance") or not entry.get("review", {}).get("status"):
            errors.append("missing provenance/review status")
        directions = entry["directions"]
        allowed = {"front", "right", "back", "left", "N", "NE", "E", "SE", "S", "SW", "W", "NW"}
        if not isinstance(directions, list) or len(set(directions)) != len(directions) or set(directions)-allowed:
            errors.append("invalid or duplicate direction labels")
        if type(entry["runtime"]) is not bool:
            errors.append("runtime must be an explicit boolean")
        if entry.get("material") != "native":
            warnings.append("legacy illustration: native pixel reconstruction remains pending")
            return errors, warnings
        if source_image.format != "PNG":
            errors.append("native asset must be encoded as PNG")
        colors = json.loads((ASSETS / "animations/palette.json").read_text())
        if len(colors) > 63:
            errors.append("shared palette exceeds 63 material colors")
        palette = {tuple(c) for c in colors}
        visible = {tuple(p[:3]) for p in image.get_flattened_data() if p[3]}
        if visible - palette:
            errors.append(f"{len(visible - palette)} colors outside the shared palette")
        if any(p[3] not in (0, 255) for p in image.get_flattened_data()):
            errors.append("native sprite contains partially transparent pixels")
        cw, ch = entry["frame"]["size"]
        px, py = entry["frame"]["pivot"]
        if cw <= 0 or ch <= 0 or not (0 <= px <= cw and 0 <= py <= ch):
            errors.append("invalid cell dimensions or pivot")
            return errors, warnings
        if entry.get("role") == "actor" and len(directions) not in (4, 8):
            errors.append("new actor contract requires four or eight real directions")
        if image.width % cw or image.height % ch:
            errors.append("atlas does not divide into whole cells")
            return errors, warnings
        hashes = []
        gutter = entry["frame"].get("gutter", 0)
        if gutter < 0 or gutter * 2 >= min(cw, ch):
            errors.append("invalid transparent gutter")
            return errors, warnings
        for row in range(image.height // ch):
            for col in range(image.width // cw):
                cell = image.crop((col*cw, row*ch, (col+1)*cw, (row+1)*ch))
                bounds = cell.getchannel("A").getbbox()
                if not bounds:
                    errors.append(f"empty cell {col},{row}")
                elif gutter and (bounds[0] < gutter or bounds[1] < gutter or
                                 bounds[2] > cw-gutter or bounds[3] > ch-gutter):
                    errors.append(f"cell {col},{row} violates transparent gutter")
                hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
        for name, animation in entry.get("animations", {}).items():
            frames = animation["frames"]
            if not frames or animation["duration"] <= 0:
                errors.append(f"invalid animation {name}")
            elif any(type(i) is not int or i < 0 or i >= len(hashes) for i in frames):
                errors.append(f"animation {name} addresses missing frames")
            elif len(frames) > 1 and len({hashes[i] for i in frames}) == 1:
                errors.append(f"animation {name} contains only repeated artwork")
        if entry["review"]["status"] != "approved":
            warnings.append("technical validation does not replace pending visual review")
    except (OSError, KeyError, TypeError, ValueError) as error:
        errors.append(str(error))
    return errors, warnings


def validate(manifest, root=ASSETS, release=False):
    errors, warnings = [], []
    if manifest.get("schemaVersion") != 1 or not manifest.get("assets"):
        return ["missing versioned asset registry"], []
    for name, entry in manifest["assets"].items():
        bad, pending = inspect(entry, root)
        errors.extend(f"{name}: {message}" for message in bad)
        warnings.extend(f"{name}: {message}" for message in pending)
        if release and entry.get("review", {}).get("status") != "approved":
            errors.append(f"{name}: artistic release review is pending")
    return errors, warnings


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as file:
        json.dump(value, file, indent=2, ensure_ascii=False)
        file.write("\n")
        temporary = Path(file.name)
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def publish_compilation(staging, production):
    """Preserve foreign registrations; publish only after every rebuilt file passes.

    Roll back replaced files if publication fails. Compile/import are serialized
    CLI operations, not a multi-process database transaction.
    """
    registry_path = production / "animations/manifest.json"
    manifest = json.loads(registry_path.read_text())
    files = sorted(staging.rglob("*.png"))
    by_path = {entry["path"]: entry for entry in manifest["assets"].values()}
    for file in files:
        relative = file.relative_to(staging).as_posix()
        if relative not in by_path:
            raise ValueError(f"Compiler output has no registered contract: {relative}")
        entry = by_path[relative]
        previous_hash = entry["sha256"]
        entry["sha256"] = digest(file)
        if entry["sha256"] != previous_hash:
            entry["review"] = {"status": "pending", "note": "Recompiled pixels require visual review"}
        errors, _ = inspect(entry, staging)
        if errors:
            raise ValueError(f"{relative}: {'; '.join(errors)}")
    backups, published = {}, []
    try:
        for file in files:
            destination = safe_path(production, file.relative_to(staging).as_posix())
            backups[destination] = destination.read_bytes() if destination.exists() else None
            destination.parent.mkdir(parents=True, exist_ok=True)
            # Keep os.replace on the same filesystem even if staging is elsewhere.
            with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as temporary:
                temporary.write(file.read_bytes())
                temporary_path = Path(temporary.name)
            try:
                os.replace(temporary_path, destination)
            finally:
                temporary_path.unlink(missing_ok=True)
            published.append(destination)
        atomic_json(registry_path, manifest)
    except BaseException:
        for destination in reversed(published):
            previous = backups[destination]
            if previous is None:
                destination.unlink(missing_ok=True)
            else:
                destination.write_bytes(previous)
        raise


def import_native(name, source, contract, manifest_path=MANIFEST, root=ASSETS):
    manifest = json.loads(manifest_path.read_text())
    entry = dict(contract)
    if entry.get("material") != "native" or source.suffix.lower() != ".png":
        raise ValueError("New sprites must be native PNGs; references are not production sprites")
    destination = safe_path(root, entry["path"])
    # Imports never silently overwrite existing art, nor grant artistic approval.
    if name in manifest["assets"] or destination.exists():
        raise ValueError("Existing registration/path: use an explicitly reviewed replacement")
    entry["sha256"] = digest(source)
    entry["review"] = {"status": "pending", "note": "Offline import; inspect at 1× in the game before approving"}
    with tempfile.TemporaryDirectory(dir=root) as staging:
        stage_root = Path(staging)
        stage_file = safe_path(stage_root, entry["path"])
        stage_file.parent.mkdir(parents=True)
        stage_file.write_bytes(source.read_bytes())
        errors, _ = inspect(entry, stage_root)
        if errors:
            raise ValueError("; ".join(errors))
        destination.parent.mkdir(parents=True, exist_ok=True)
        os.replace(stage_file, destination)
        manifest["assets"][name] = entry
        try:
            atomic_json(manifest_path, manifest)
        except BaseException:
            destination.unlink()
            raise
    return entry


def contact_sheet(name, entry, output, scale=2, root=ASSETS):
    """Diagnostic contact sheet; never edits or approves the source artwork."""
    if not 1 <= scale <= 4:
        raise ValueError("inspection scale must be an integer from 1 to 4")
    if output.resolve().is_relative_to(root.resolve()):
        raise ValueError("inspection output must not replace a production asset")
    image = Image.open(safe_path(root, entry["path"])).convert("RGBA")
    frames = []
    normalization = entry.get("normalization")
    if normalization:
        cw, ch = normalization["cell"]
        px, py = normalization["pivot"]
        for index, (x, y, width, height) in enumerate(normalization["rects"]):
            # Replicate the existing legacy import for inspection, not reconstruction.
            col, row = index % normalization["columns"], index // normalization["columns"]
            factor = normalization["scales"][index]
            fx = normalization.get("footXs", [x + width/2]*8)[col]
            fy = normalization["footYs"][row][col] if "footYs" in normalization else y+height-8
            crop = image.crop((x-3, y-3, x+width+3, y+height+3))
            crop = crop.resize((round((width+6)*factor), round((height+6)*factor)), Image.Resampling.NEAREST)
            cell = Image.new("RGBA", (cw, ch))
            cell.alpha_composite(crop, (round(px-(fx-x+3)*factor), round(py-(fy-y+3)*factor)))
            frames.append(cell)
    else:
        cw, ch = entry["frame"]["size"]
        px, py = entry["frame"]["pivot"]
        for y in range(0, image.height, ch):
            for x in range(0, image.width, cw):
                frames.append(image.crop((x, y, x+cw, y+ch)))
    columns = min(8, len(frames))
    width, height = cw*scale+12, ch*scale+28
    sheet = Image.new("RGB", (columns*width, 54+((len(frames)+columns-1)//columns)*height), "#101923")
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 8), f"{name} | {entry['review']['status']} | diagnostic only", fill="white")
    draw.text((8, 25), f"source SHA256 {entry['sha256'][:24]} | {scale}x nearest | magenta: pivot", fill="white")
    for index, cell in enumerate(frames):
        x, y = index % columns*width+6, 54+index//columns*height
        for yy in range(0, ch*scale, 8):
            for xx in range(0, cw*scale, 8):
                draw.rectangle((x+xx, y+yy, x+min(xx+7,cw*scale-1), y+min(yy+7,ch*scale-1)),
                               fill="#30404c" if (xx//8+yy//8)%2 else "#1b2832")
        sheet.paste(cell.resize((cw*scale,ch*scale),Image.Resampling.NEAREST), (x,y),
                    cell.getchannel("A").resize((cw*scale,ch*scale),Image.Resampling.NEAREST))
        pivot = (x+px*scale, y+min(py*scale,ch*scale-1))
        draw.line((pivot[0]-4,pivot[1],pivot[0]+4,pivot[1]),fill="#ff7ee9")
        draw.line((pivot[0],pivot[1]-4,pivot[0],pivot[1]+4),fill="#ff7ee9")
        draw.text((x,y+ch*scale+4),f"frame {index}",fill="white")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    check = sub.add_parser("validate")
    check.add_argument("--release", action="store_true")
    importing = sub.add_parser("import")
    importing.add_argument("name")
    importing.add_argument("source", type=Path)
    importing.add_argument("contract", type=Path)
    inspecting = sub.add_parser("inspect")
    inspecting.add_argument("name")
    inspecting.add_argument("output", type=Path)
    inspecting.add_argument("--scale", type=int, default=2)
    options = parser.parse_args()
    if options.command == "inspect":
        entry = json.loads(MANIFEST.read_text())["assets"][options.name]
        contact_sheet(options.name, entry, options.output, options.scale)
        print(f"Diagnostic sheet written to {options.output}; review status unchanged.")
        return
    if options.command == "import":
        import_native(options.name, options.source, json.loads(options.contract.read_text()))
        print(f"Registered {options.name}; visual review remains pending.")
        return
    errors, warnings = validate(json.loads(MANIFEST.read_text()), release=options.release)
    for message in warnings:
        print(f"REVIEW: {message}")
    for message in errors:
        print(f"ERROR: {message}")
    print(f"{len(errors)} errors; {len(warnings)} pending reviews.")
    raise SystemExit(bool(errors))


if __name__ == "__main__":
    main()
