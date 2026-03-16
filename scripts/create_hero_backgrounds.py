#!/usr/bin/env python3
"""
建立炫酷的 Hero 背景圖片
- 去背景
- 建立漸變背景
- 加入光暈效果
"""

import os
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove
import numpy as np

PROJECT_PATH = "/Users/yaja/projects/penhu7days/public"

def create_gradient(width, height, color1, color2, direction='vertical'):
    """建立漸變背景"""
    gradient = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(gradient)

    if direction == 'vertical':
        for y in range(height):
            r = int(color1[0] + (color2[0] - color1[0]) * y / height)
            g = int(color1[1] + (color2[1] - color1[1]) * y / height)
            b = int(color1[2] + (color2[2] - color1[2]) * y / height)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
    else:  # horizontal
        for x in range(width):
            r = int(color1[0] + (color2[0] - color1[0]) * x / width)
            g = int(color1[1] + (color2[1] - color1[1]) * x / width)
            b = int(color1[2] + (color2[2] - color1[2]) * x / width)
            draw.line([(x, 0), (x, height)], fill=(r, g, b))

    return gradient

def create_radial_glow(width, height, center, radius, color, intensity=0.5):
    """建立放射狀光暈"""
    glow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)

    cx, cy = center
    for r in range(int(radius), 0, -2):
        alpha = int(255 * intensity * (1 - r / radius) ** 0.5)
        if alpha > 0:
            draw.ellipse(
                [cx - r, cy - r, cx + r, cy + r],
                fill=(color[0], color[1], color[2], alpha)
            )

    return glow

def process_woman_image():
    """處理女生圖片"""
    print("處理女生圖片...")

    # 載入原圖
    img_path = os.path.join(PROJECT_PATH, "hero-image.png")
    img = Image.open(img_path)

    # 去背景
    print("  去除背景...")
    img_no_bg = remove(img)

    # 建立新畫布 (1920x1080)
    canvas_width, canvas_height = 1920, 1080

    # 建立奶茶色漸變背景 (延伸原圖背景色)
    # 原圖背景色約 #c9a882 到 #b89b7a
    color_top = (200, 175, 145)      # 較淺的奶茶色
    color_bottom = (165, 140, 115)   # 較深的奶茶色
    background = create_gradient(canvas_width, canvas_height, color_top, color_bottom, 'vertical')

    # 加入柔和的光暈效果 (在人物後面)
    glow_color = (255, 235, 210)  # 暖色光暈
    glow = create_radial_glow(canvas_width, canvas_height,
                               (canvas_width * 0.7, canvas_height * 0.4),
                               600, glow_color, 0.4)
    background = Image.alpha_composite(background.convert('RGBA'), glow)

    # 調整人物大小
    person = img_no_bg.convert('RGBA')

    # 縮放讓人物高度約為畫布高度的 95%
    target_height = int(canvas_height * 0.98)
    scale = target_height / person.height
    new_width = int(person.width * scale)
    new_height = target_height
    person = person.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # 計算位置 (放在右側，垂直置中偏下)
    x = canvas_width - new_width - 50  # 距離右邊 50px
    y = canvas_height - new_height + 10  # 底部對齊，稍微露出一點

    # 合成
    background.paste(person, (x, y), person)

    # 轉換為 RGB 並儲存
    output = background.convert('RGB')
    output_path = os.path.join(PROJECT_PATH, "hero-woman-extended.png")
    output.save(output_path, quality=95)
    print(f"  已儲存: {output_path}")

    return output_path

def process_man_image():
    """處理男生圖片"""
    print("處理男生圖片...")

    # 載入原圖
    img_path = os.path.join(PROJECT_PATH, "hero-image-2.png")
    img = Image.open(img_path)

    # 去背景
    print("  去除背景...")
    img_no_bg = remove(img)

    # 建立新畫布 (1920x1080)
    canvas_width, canvas_height = 1920, 1080

    # 建立深色漸變背景
    color_left = (15, 15, 18)    # 更深的左側
    color_right = (35, 35, 40)   # 稍淺的右側
    background = create_gradient(canvas_width, canvas_height, color_left, color_right, 'horizontal')

    # 加入橘色光暈 (品牌色)
    orange_glow = (241, 132, 1)
    glow = create_radial_glow(canvas_width, canvas_height,
                               (canvas_width * 0.75, canvas_height * 0.5),
                               700, orange_glow, 0.15)
    background = Image.alpha_composite(background.convert('RGBA'), glow)

    # 加入第二層更柔和的光暈
    glow2 = create_radial_glow(canvas_width, canvas_height,
                                (canvas_width * 0.85, canvas_height * 0.3),
                                400, (255, 180, 80), 0.1)
    background = Image.alpha_composite(background, glow2)

    # 調整人物大小
    person = img_no_bg.convert('RGBA')

    # 縮放讓人物高度約為畫布高度的 110% (讓頭頂被裁切一點，更有氣勢)
    target_height = int(canvas_height * 1.15)
    scale = target_height / person.height
    new_width = int(person.width * scale)
    new_height = target_height
    person = person.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # 計算位置 (放在右側)
    x = canvas_width - new_width - 80
    y = canvas_height - new_height + int(new_height * 0.08)  # 稍微往上

    # 合成
    background.paste(person, (x, y), person)

    # 轉換為 RGB 並儲存
    output = background.convert('RGB')
    output_path = os.path.join(PROJECT_PATH, "hero-man-extended.png")
    output.save(output_path, quality=95)
    print(f"  已儲存: {output_path}")

    return output_path

if __name__ == "__main__":
    print("=" * 50)
    print("建立炫酷 Hero 背景")
    print("=" * 50)

    woman_path = process_woman_image()
    man_path = process_man_image()

    print("\n" + "=" * 50)
    print("處理完成！")
    print(f"女生圖片: {woman_path}")
    print(f"男生圖片: {man_path}")
    print("=" * 50)
