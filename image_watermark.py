import os
import argparse
from PIL import Image, ImageDraw, ImageFont, ExifTags
from datetime import datetime


def get_exif_date(image_path):
    """从图片的EXIF信息中获取拍摄日期"""
    try:
        with Image.open(image_path) as img:
            exif_data = img.getexif()

            # 查找日期时间标签
            date_tags = ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime']
            date_tag_ids = {tag: id for id, tag in ExifTags.TAGS.items() if tag in date_tags}

            for tag in date_tags:
                if tag in date_tag_ids and date_tag_ids[tag] in exif_data:
                    date_str = exif_data[date_tag_ids[tag]]
                    # 解析日期格式 (通常是 "YYYY:MM:DD HH:MM:SS")
                    date_obj = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
                    return date_obj.strftime("%Y-%m-%d")

            # 如果没有找到EXIF日期，返回文件修改日期
            file_mtime = os.path.getmtime(image_path)
            date_obj = datetime.fromtimestamp(file_mtime)
            return date_obj.strftime("%Y-%m-%d")

    except Exception as e:
        print(f"获取EXIF信息失败: {e}")
        # 失败时返回当前日期
        return datetime.now().strftime("%Y-%m-%d")


def add_watermark(image_path, output_path, text, font_size=30, color=(255, 255, 255), position='bottom_right'):
    """给图片添加水印"""
    try:
        with Image.open(image_path) as img:
            # 确保图片是RGB模式，以便处理透明通道
            if img.mode in ('RGBA', 'LA'):
                background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                background.paste(img, img.split()[-1])
                img = background.convert("RGB")
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # 创建绘制对象
            draw = ImageDraw.Draw(img)

            # 尝试加载系统字体，如失败则使用默认字体
            try:
                # 尝试不同操作系统的常见字体
                if os.name == 'nt':  # Windows
                    font = ImageFont.truetype("arial.ttf", font_size)
                elif os.name == 'posix':  # macOS/Linux
                    # macOS通常的字体路径
                    if os.path.exists("/Library/Fonts/Arial.ttf"):
                        font = ImageFont.truetype("/Library/Fonts/Arial.ttf", font_size)
                    # Linux通常的字体路径
                    elif os.path.exists("/usr/share/fonts/truetype/freefont/FreeSans.ttf"):
                        font = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSans.ttf", font_size)
                    else:
                        font = ImageFont.load_default()
                else:
                    font = ImageFont.load_default()
            except:
                font = ImageFont.load_default()

            # 获取文本尺寸 - 使用textbbox替代textsize（兼容Pillow 10.0.0+）
            # textbbox返回(x0, y0, x1, y1)，分别是文本框的左上角和右下角坐标
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            # 根据位置计算文本坐标
            width, height = img.size
            margin = 10  # 边距

            if position == 'top_left':
                x, y = margin, margin
            elif position == 'top_right':
                x, y = width - text_width - margin, margin
            elif position == 'bottom_left':
                x, y = margin, height - text_height - margin
            elif position == 'center':
                x, y = (width - text_width) // 2, (height - text_height) // 2
            else:  # bottom_right (default)
                x, y = width - text_width - margin, height - text_height - margin

            # 添加半透明背景以提高可读性
            # 调整背景框大小使其更好地包围文本
            draw.rectangle(
                [(x - 2, y - 2), (x + text_width + 2, y + text_height + 2)],
                fill=(0, 0, 0, 128)  # 黑色半透明背景
            )

            # 绘制文本
            draw.text((x, y), text, font=font, fill=color)

            # 保存图片
            img.save(output_path)
            print(f"已保存带水印图片: {output_path}")
            return True

    except Exception as e:
        print(f"添加水印失败: {e}")
        return False


def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='给图片添加基于EXIF日期的水印')
    parser.add_argument('image_path', help='图片文件路径或包含图片的目录')
    parser.add_argument('--font-size', type=int, default=30, help='水印字体大小')
    parser.add_argument('--color', type=str, default='255,255,255', help='水印颜色，格式为R,G,B，例如255,255,255表示白色')
    parser.add_argument('--position', type=str, default='bottom_right',
                        choices=['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'],
                        help='水印位置')

    args = parser.parse_args()

    # 解析颜色参数
    try:
        color = tuple(map(int, args.color.split(',')))
        if len(color) != 3 or any(c < 0 or c > 255 for c in color):
            raise ValueError
    except ValueError:
        print("颜色格式错误，使用默认白色(255,255,255)")
        color = (255, 255, 255)

    # 收集所有图片文件
    image_files = []
    if os.path.isdir(args.image_path):
        # 如果输入是目录，处理目录下的所有图片
        for filename in os.listdir(args.image_path):
            path = os.path.join(args.image_path, filename)
            if os.path.isfile(path) and filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_files.append(path)
    elif os.path.isfile(args.image_path) and args.image_path.lower().endswith(
            ('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
        # 如果输入是单个图片文件
        image_files.append(args.image_path)
    else:
        print("无效的图片路径或文件格式")
        return

    if not image_files:
        print("未找到任何图片文件")
        return

    # 创建输出目录
    if os.path.isdir(args.image_path):
        output_dir = os.path.join(args.image_path, f"{os.path.basename(args.image_path)}_watermark")
    else:
        output_dir = os.path.join(os.path.dirname(args.image_path),
                                  f"{os.path.basename(os.path.dirname(args.image_path))}_watermark")

    os.makedirs(output_dir, exist_ok=True)

    # 处理每张图片
    for img_path in image_files:
        # 获取水印文本（EXIF日期）
        watermark_text = get_exif_date(img_path)

        # 生成输出文件路径
        filename = os.path.basename(img_path)
        name, ext = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}_watermark{ext}")

        # 添加水印
        add_watermark(img_path, output_path, watermark_text,
                      font_size=args.font_size,
                      color=color,
                      position=args.position)


if __name__ == "__main__":
    main()
