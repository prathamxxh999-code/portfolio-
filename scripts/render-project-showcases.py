"""Render silent portfolio films from the captured Cashbell and CRM interfaces.

Run with Python, Pillow, NumPy and an FFmpeg binary. Use --poster-only to
inspect the device composition before exporting a complete film.
"""

import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "showcase-sources"
MEDIA = ROOT / "src" / "showcases"
FPS = 30
WIDTH, HEIGHT = 1920, 1200
INTRO_FRAMES = 84
OUTRO_FRAMES = 108
PROJECTS = {
    "crm": {
        "title": "IDSSPL CRM",
        "subtitle": "The client workspace",
        "mobile": False,
        "screens": ["crm-overview", "crm-clients", "crm-tasks", "crm-reports"],
    },
    "cashbell": {
        "title": "CashBell 360",
        "subtitle": "Loan origination & loan management",
        "mobile": True,
        "screens": ["cashbell-home", "cashbell-offers", "cashbell-loan"],
    },
}


def clamp(value):
    return max(0.0, min(1.0, value))


def smooth(value):
    value = clamp(value)
    return value * value * (3 - 2 * value)


def interpolate(first, second, amount):
    return first + (second - first) * amount


def font(size, weight=500):
    result = ImageFont.truetype(str(SOURCE / "fonts" / "DM-Sans.ttf"), size)
    result.set_variation_by_axes([32, weight])
    return result


def backdrop():
    y, x = np.mgrid[0:HEIGHT, 0:WIDTH].astype(np.float32)
    pool = np.exp(-(((x - WIDTH * .52) / (WIDTH * .53)) ** 2
                    + ((y - HEIGHT * .69) / (HEIGHT * .6)) ** 2) * 2)
    rim = np.exp(-(((x - WIDTH * .32) / (WIDTH * .7)) ** 2
                   + ((y - HEIGHT * .04) / (HEIGHT * .3)) ** 2) * 2)
    grain = np.random.default_rng(77).normal(0, .48, (HEIGHT, WIDTH))
    rgb = np.stack([
        8 + pool * 17 + rim * 4 + grain,
        12 + pool * 27 + rim * 8 + grain,
        10 + pool * 20 + rim * 8 + grain,
    ], axis=-1)
    return Image.fromarray(np.uint8(np.clip(rgb, 0, 255))).convert("RGBA")


def rounded_mask(size, radius):
    mask = Image.new("L", size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return mask


# Existing hardware templates, credited to Apple Design Resources by MockUPhone.
# The alpha channel includes the real bezel, camera and reflections. Only the
# display underneath is composited; no hardware or interface is generated.
DEVICES = {}
for mobile, name, bounds in [
    (True, "iphone-15-pro.png", (120, 120, 1179, 2556)),
    (False, "macbook-pro-14.png", (459, 299, 3024, 1964)),
]:
    plate = Image.open(SOURCE / "devices" / name).convert("RGBA")
    # Keep over 2x the displayed resolution without processing 4K per frame.
    ratio = min(1, (1250 if mobile else 2300) / plate.width)
    size = tuple(round(value * ratio) for value in plate.size)
    plate = plate.resize(size, Image.Resampling.LANCZOS)
    DEVICES[mobile] = (plate, tuple(round(value * ratio) for value in bounds))


def device_face(screen, mobile):
    plate, (left, top, width, height) = DEVICES[mobile]
    panel = Image.new("RGBA", plate.size)
    display = Image.new("RGBA", (width, height), "#121214" if mobile else "#f4f6ef")
    if mobile:
        # Reserve space above the app for the physical camera island. The app
        # itself is captured at 430 x 880, without cropping any interface.
        fitted = ImageOps.contain(screen.convert("RGBA"), (width, height), Image.Resampling.LANCZOS)
        display.alpha_composite(fitted, ((width-fitted.width)//2, height-fitted.height))
        display.putalpha(rounded_mask(display.size, round(width * .085)))
    else:
        fitted = ImageOps.contain(screen.convert("RGBA"), (width, height), Image.Resampling.LANCZOS)
        display.alpha_composite(fitted, ((width-fitted.width)//2, (height-fitted.height)//2))
    panel.alpha_composite(display, (left, top))
    panel.alpha_composite(plate)
    return panel


SHADOW = Image.new("RGBA", (720, 120))
ImageDraw.Draw(SHADOW).ellipse((20, 35, 700, 86), fill=(0, 0, 0, 155))
SHADOW = SHADOW.filter(ImageFilter.GaussianBlur(18))


def projected(points, center, scale, yaw, pitch=.15):
    points = np.asarray(points, dtype=np.float64)
    cos_y, sin_y = math.cos(yaw), math.sin(yaw)
    rotated_x = points[:, 0] * cos_y + points[:, 2] * sin_y
    rotated_z = -points[:, 0] * sin_y + points[:, 2] * cos_y
    view_y = points[:, 1] * math.cos(pitch) - rotated_z * math.sin(pitch)
    view_z = points[:, 1] * math.sin(pitch) + rotated_z * math.cos(pitch)
    perspective = 9.5 / (9.5 - view_z)
    return np.column_stack([
        center[0] + rotated_x * scale * perspective,
        center[1] - view_y * scale * perspective,
    ])


def place_plane(destination, texture, corners):
    left, top = np.floor(np.min(corners, axis=0)).astype(int)
    right, bottom = np.ceil(np.max(corners, axis=0)).astype(int)
    if right <= 0 or left >= WIDTH or bottom <= 0 or top >= HEIGHT:
        return
    local = corners - [left, top]
    source = [(0, 0), (texture.width, 0), (texture.width, texture.height), (0, texture.height)]
    matrix, values = [], []
    for (x, y), (u, v) in zip(local, source):
        matrix.extend([[x, y, 1, 0, 0, 0, -u * x, -u * y],
                       [0, 0, 0, x, y, 1, -v * x, -v * y]])
        values.extend([u, v])
    coefficients = np.linalg.solve(matrix, values)
    warped = texture.transform((right - left, bottom - top), Image.Transform.PERSPECTIVE,
                               coefficients, Image.Resampling.BICUBIC)
    destination.alpha_composite(warped, (int(left), int(top)))


def place_device(destination, texture, center, zoom, yaw, mobile):
    scale = HEIGHT * (.43 if mobile else .41) * zoom
    half_width, half_height = texture.width / texture.height, 1
    pitch = 0
    front = [[-half_width, half_height, 0], [half_width, half_height, 0],
             [half_width, -half_height, 0], [-half_width, -half_height, 0]]
    front_quad = projected(front, center, scale, yaw, pitch)
    place_plane(destination, texture, front_quad)


class ScreenRecording:
    def __init__(self, ffmpeg, path, width, height):
        self.width = width
        self.height = height
        self.process = subprocess.Popen([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(path),
            "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
        ], stdout=subprocess.PIPE)

    def read(self):
        data = self.process.stdout.read(self.width * self.height * 3)
        if not data:
            return None
        if len(data) != self.width * self.height * 3:
            raise RuntimeError("Incomplete screen-recording frame")
        return Image.frombytes("RGB", (self.width, self.height), data)

    def close(self):
        # Drain the last frame before closing, so FFmpeg can finish normally.
        self.process.stdout.read()
        self.process.stdout.close()
        if self.process.wait() != 0:
            raise RuntimeError("Screen recording could not be decoded")


class Film:
    def __init__(self, key):
        self.key = key
        self.project = PROJECTS[key]
        self.mobile = self.project["mobile"]
        self.screens = [Image.open(MEDIA / "screens" / f"{name}.png").convert("RGB")
                        for name in self.project["screens"]]
        self.static_devices = [device_face(screen, self.mobile) for screen in self.screens]
        self.background = backdrop()
        self.heading = font(round(WIDTH * .042), 600)
        self.subheading = font(round(WIDTH * .016), 400)
        self.texture = self.static_devices[0]

    def frame(self, number, recorded_frames, screen=None):
        image = self.background.copy()
        total = INTRO_FRAMES + recorded_frames + OUTRO_FRAMES
        mobile = self.mobile
        center = [WIDTH * .5, HEIGHT * .50]
        zoom = 1.0
        yaw = -.035
        if number < INTRO_FRAMES:
            reveal = smooth(number / INTRO_FRAMES)
            center[0] = interpolate(WIDTH * .78, WIDTH * .5, reveal)
            center[1] += (1 - reveal) * 55
            zoom = interpolate(.68, zoom, reveal)
            yaw = interpolate(-.08, -.035, reveal)
            self.texture = self.static_devices[0]
        elif number < INTRO_FRAMES + recorded_frames:
            amount = (number - INTRO_FRAMES) / max(1, recorded_frames - 1)
            yaw = -.035 + .07 * smooth(amount)
            zoom += math.sin(amount * math.pi) * (.055 if mobile else .06)
            if screen is not None:
                self.texture = device_face(screen, mobile)
        else:
            finish = smooth((number - INTRO_FRAMES - recorded_frames) / OUTRO_FRAMES)
            zoom = interpolate(1, .86 if mobile else .97, finish)
            yaw = interpolate(.035, -.035, finish)
            self.texture = self.static_devices[0]
            if mobile:
                for index, direction in [(1, -1), (2, 1)]:
                    side_center = [WIDTH * .5 + direction * WIDTH * .25 * finish, HEIGHT * .51]
                    place_device(image, self.static_devices[index], side_center,
                                 zoom * .77, -direction * .035, True)
        shadow_width = int(WIDTH * (.53 if mobile else .85) * zoom)
        shadow = SHADOW.resize((shadow_width, max(1, int(95 * zoom))), Image.Resampling.BICUBIC)
        image.alpha_composite(shadow, (int(center[0] - shadow_width / 2), int(HEIGHT * .88)))
        place_device(image, self.texture, center, zoom, yaw, mobile)
        if number < INTRO_FRAMES:
            opacity = 1 - smooth((number / INTRO_FRAMES - .12) / .73)
            title = Image.new("RGBA", image.size)
            ink = ImageDraw.Draw(title)
            ink.text((WIDTH * .065, HEIGHT * .30), self.project["title"], font=self.heading,
                     fill=(237, 241, 231, int(opacity * 255)))
            ink.text((WIDTH * .067, HEIGHT * .30 + WIDTH * .06), self.project["subtitle"], font=self.subheading,
                     fill=(169, 193, 158, int(opacity * 255)))
            image.alpha_composite(title)
        fade_in = smooth(number / 12)
        fade_out = 1 - smooth((number - total + 17) / 17)
        exposure = min(fade_in, fade_out)
        if exposure < 1:
            dark = self.background.copy()
            image = Image.blend(dark, image, exposure)
        return image.convert("RGB")


def render(key, ffmpeg, poster_only=False):
    film = Film(key)
    capture_path = SOURCE / "recordings" / f"{key}.json"
    capture = json.loads(capture_path.read_text())
    recorded_frames = math.ceil(capture["duration"] * FPS)
    poster = MEDIA / f"{key}-poster.jpg"
    poster_frame = film.frame(INTRO_FRAMES, recorded_frames)
    # The full-resolution poster is exported separately from the video encode.
    if poster_only or not poster.exists():
        poster_frame.save(poster, quality=94)
    if poster_only:
        for name, texture in zip(film.project["screens"], film.static_devices):
            still = film.background.copy()
            place_device(still, texture, (WIDTH * .5, HEIGHT * .5), 1, 0, film.mobile)
            if film.mobile:
                half_width = round(HEIGHT * .32)
                still = still.crop((WIDTH//2-half_width, 0, WIDTH//2+half_width, HEIGHT))
            still.convert("RGB").save(MEDIA / f"{name}-mockup.webp", quality=93)
    if poster_only:
        print(f"Saved {poster}", flush=True)
        return

    destination = MEDIA / f"{key}-film.mp4"
    frames = INTRO_FRAMES + recorded_frames + OUTRO_FRAMES
    reader = ScreenRecording(ffmpeg, SOURCE / "recordings" / f"{key}.mp4",
                             capture["width"], capture["height"])
    command = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "pipe:0",
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-threads", "2",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-colorspace", "bt709",
        "-color_primaries", "bt709", "-color_trc", "bt709", str(destination),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for number in range(frames):
            screen = None
            if INTRO_FRAMES <= number < INTRO_FRAMES + recorded_frames:
                screen = reader.read()
            output = film.frame(number, recorded_frames, screen)
            encoder.stdin.write(output.tobytes())
            if number % 120 == 0:
                print(f"{key}: {number}/{frames}", flush=True)
    finally:
        reader.close()
        encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError(f"Failed to encode {destination}")
    result = {"project": key, "duration": frames / FPS, "frames": frames,
              "width": WIDTH, "height": HEIGHT, "fps": FPS, "audio": False}
    (MEDIA / f"{key}-film.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", choices=PROJECTS, required=True)
    parser.add_argument("--poster-only", action="store_true")
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1200)
    parser.add_argument("--ffmpeg", default=os.getenv("SHOWCASE_FFMPEG") or shutil.which("ffmpeg"))
    args = parser.parse_args()
    WIDTH, HEIGHT = args.width, args.height
    if not args.ffmpeg and not args.poster_only:
        parser.error("Provide --ffmpeg or set SHOWCASE_FFMPEG to the FFmpeg executable")
    render(args.project, args.ffmpeg, args.poster_only)
