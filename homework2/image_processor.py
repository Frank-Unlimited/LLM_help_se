import os
import json
import tkinter as tk
from tkinter import filedialog, ttk, messagebox, colorchooser, simpledialog
from PIL import Image, ImageTk, ImageDraw, ImageFont, ImageOps
import glob
import sys
import math
from datetime import datetime


class ImageProcessorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("图片处理器")
        self.root.geometry("1200x800")
        self.root.minsize(1100, 700)

        # 确保中文显示正常
        self.style = ttk.Style()
        self.style.configure("TLabel", font=("SimHei", 10))
        self.style.configure("TButton", font=("SimHei", 10))
        self.style.configure("TCheckbutton", font=("SimHei", 10))
        self.style.configure("TRadiobutton", font=("SimHei", 10))

        # 存储导入的图片信息
        self.images = []  # 格式: [(原图路径, 缩略图对象, 文件名, 图片副本), ...]
        self.current_preview_index = -1  # 当前预览图片索引
        self.preview_image = None  # 当前预览图片对象
        self.preview_photo = None  # 当前预览图片的PhotoImage对象

        # 导出设置
        self.output_dir = ""
        self.naming_option = tk.StringVar(value="original")  # original, prefix, suffix
        self.custom_text = tk.StringVar(value="")
        self.output_format = tk.StringVar(value="png")
        self.jpeg_quality = tk.IntVar(value=95)  # JPEG质量，0-100

        # 尺寸调整设置
        self.resize_method = tk.StringVar(value="none")  # none, width, height, percentage
        self.target_width = tk.IntVar(value=800)
        self.target_height = tk.IntVar(value=600)
        self.resize_percentage = tk.IntVar(value=100)

        # 水印设置
        self.watermark_type = tk.StringVar(value="none")  # none:无水印, text:文本水印, image:图片水印
        # 1. 文本水印参数
        self.watermark_text = tk.StringVar(value="© 版权所有")  # 默认文本
        self.watermark_font_family = tk.StringVar(value="SimHei")  # 默认字体
        self.watermark_font_size = tk.IntVar(value=24)  # 默认字号
        self.watermark_font_bold = tk.BooleanVar(value=False)  # 粗体
        self.watermark_font_italic = tk.BooleanVar(value=False)  # 斜体
        self.watermark_text_color = tk.StringVar(value="#000000")  # 默认黑色
        self.watermark_text_opacity = tk.IntVar(value=50)  # 文本透明度(0-100)
        self.watermark_text_shadow = tk.BooleanVar(value=True)  # 阴影效果
        # 2. 图片水印参数
        self.watermark_image_path = tk.StringVar(value="")  # 水印图片路径
        self.watermark_image_obj = None  # 加载的水印图片对象
        self.watermark_image_scale = tk.IntVar(value=50)  # 图片缩放比例(0-200)
        self.watermark_image_opacity = tk.IntVar(value=50)  # 图片透明度(0-100)
        # 3. 水印位置和旋转参数
        self.watermark_position = tk.StringVar(value="bottom_right")  # 九宫格位置
        self.watermark_x = tk.IntVar(value=0)  # 水印X坐标
        self.watermark_y = tk.IntVar(value=0)  # 水印Y坐标
        self.watermark_rotation = tk.IntVar(value=0)  # 水印旋转角度(0-360)
        self.is_dragging = False  # 是否正在拖拽水印
        self.drag_offset_x = 0  # 拖拽偏移X
        self.drag_offset_y = 0  # 拖拽偏移Y

        # 4. 水印模板管理
        self.watermark_templates = {}  # 存储水印模板
        self.template_dir = os.path.join(os.path.expanduser("~"), ".image_processor_templates")
        self.current_template = tk.StringVar(value="")  # 当前选中的模板
        self.load_templates()  # 加载保存的模板

        # 创建界面
        self.create_widgets()

        # 尝试启用拖放功能
        self.enable_drag_and_drop()

        # 绑定水印设置变更事件，实现实时预览
        self.bind_watermark_events()

    def create_widgets(self):
        # 创建主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 左侧带滚动条的控制区容器
        control_container = ttk.Frame(main_frame)
        control_container.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

        # 控制区滚动条
        control_scrollbar = ttk.Scrollbar(control_container, orient=tk.VERTICAL)
        control_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 左侧控制区（放在Canvas内实现滚动）
        self.control_canvas = tk.Canvas(control_container, yscrollcommand=control_scrollbar.set)
        self.control_canvas.pack(side=tk.LEFT, fill=tk.Y)
        control_scrollbar.config(command=self.control_canvas.yview)

        # 控制区内容框架
        control_frame = ttk.LabelFrame(self.control_canvas, text="操作", padding="10")
        control_frame_window = self.control_canvas.create_window((0, 0), window=control_frame, anchor="nw")

        # 绑定事件以调整滚动区域
        control_frame.bind("<Configure>", lambda e: self.control_canvas.configure(
            scrollregion=self.control_canvas.bbox("all")
        ))
        self.control_canvas.bind("<Configure>", lambda e: self.control_canvas.itemconfig(
            control_frame_window, width=e.width
        ))

        # 导入按钮
        ttk.Button(control_frame, text="导入单张图片", command=self.import_single_image).pack(fill=tk.X, pady=(0, 5))
        ttk.Button(control_frame, text="导入多张图片", command=self.import_multiple_images).pack(fill=tk.X, pady=(0, 5))
        ttk.Button(control_frame, text="导入文件夹", command=self.import_folder).pack(fill=tk.X, pady=(0, 15))

        # 导出设置
        export_frame = ttk.LabelFrame(control_frame, text="导出设置", padding="10")
        export_frame.pack(fill=tk.X, pady=(0, 15))

        ttk.Button(export_frame, text="选择输出文件夹", command=self.select_output_dir).pack(fill=tk.X, pady=(0, 10))
        self.output_dir_label = ttk.Label(export_frame, text="未选择输出文件夹")
        self.output_dir_label.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(export_frame, text="命名规则:").pack(anchor=tk.W, pady=(0, 5))
        ttk.Radiobutton(export_frame, text="保留原文件名", variable=self.naming_option, value="original").pack(
            anchor=tk.W)
        ttk.Radiobutton(export_frame, text="添加前缀", variable=self.naming_option, value="prefix").pack(anchor=tk.W)
        ttk.Radiobutton(export_frame, text="添加后缀", variable=self.naming_option, value="suffix").pack(anchor=tk.W)

        self.text_entry = ttk.Entry(export_frame, textvariable=self.custom_text)
        self.text_entry.pack(fill=tk.X, pady=(5, 10))
        self.update_text_entry_state()
        self.naming_option.trace_add("write", lambda *args: self.update_text_entry_state())

        ttk.Label(export_frame, text="输出格式:").pack(anchor=tk.W, pady=(0, 5))
        format_frame = ttk.Frame(export_frame)
        format_frame.pack(fill=tk.X)
        ttk.Radiobutton(format_frame, text="JPEG", variable=self.output_format, value="jpeg",
                        command=self.update_jpeg_quality_state).pack(side=tk.LEFT)
        ttk.Radiobutton(format_frame, text="PNG", variable=self.output_format, value="png",
                        command=self.update_jpeg_quality_state).pack(side=tk.LEFT, padx=10)

        # JPEG质量调节
        self.jpeg_quality_frame = ttk.Frame(export_frame)
        self.quality_label_title = ttk.Label(self.jpeg_quality_frame, text="JPEG质量:")
        self.quality_label_title.pack(anchor=tk.W, pady=(5, 0))
        quality_slider_frame = ttk.Frame(self.jpeg_quality_frame)
        self.quality_slider = ttk.Scale(quality_slider_frame, from_=0, to=100,
                                        variable=self.jpeg_quality, orient=tk.HORIZONTAL,
                                        length=150, command=self.update_quality_label)
        self.quality_slider.pack(side=tk.LEFT)
        self.quality_value_label = ttk.Label(quality_slider_frame, text=f"{self.jpeg_quality.get()}%")
        self.quality_value_label.pack(side=tk.LEFT, padx=5)
        quality_slider_frame.pack(fill=tk.X, pady=(0, 5))
        self.jpeg_quality_frame.pack(fill=tk.X, pady=(5, 10))
        self.update_jpeg_quality_state()  # 初始状态设置

        # 尺寸调整设置
        resize_frame = ttk.LabelFrame(export_frame, text="尺寸调整")
        resize_frame.pack(fill=tk.X, pady=(10, 0))

        ttk.Radiobutton(resize_frame, text="不调整尺寸", variable=self.resize_method, value="none",
                        command=self.update_resize_fields_state).pack(anchor=tk.W, pady=(5, 0))
        ttk.Radiobutton(resize_frame, text="按宽度调整", variable=self.resize_method, value="width",
                        command=self.update_resize_fields_state).pack(anchor=tk.W)
        ttk.Radiobutton(resize_frame, text="按高度调整", variable=self.resize_method, value="height",
                        command=self.update_resize_fields_state).pack(anchor=tk.W)
        ttk.Radiobutton(resize_frame, text="按百分比调整", variable=self.resize_method, value="percentage",
                        command=self.update_resize_fields_state).pack(anchor=tk.W, pady=(0, 5))

        # 宽度调整输入
        width_frame = ttk.Frame(resize_frame)
        ttk.Label(width_frame, text="目标宽度:").pack(side=tk.LEFT)
        self.width_entry = ttk.Entry(width_frame, textvariable=self.target_width, width=10)
        self.width_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(width_frame, text="像素").pack(side=tk.LEFT)
        width_frame.pack(fill=tk.X, pady=(0, 5), padx=20)

        # 高度调整输入
        height_frame = ttk.Frame(resize_frame)
        ttk.Label(height_frame, text="目标高度:").pack(side=tk.LEFT)
        self.height_entry = ttk.Entry(height_frame, textvariable=self.target_height, width=10)
        self.height_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(height_frame, text="像素").pack(side=tk.LEFT)
        height_frame.pack(fill=tk.X, pady=(0, 5), padx=20)

        # 百分比调整输入
        percentage_frame = ttk.Frame(resize_frame)
        ttk.Label(percentage_frame, text="缩放比例:").pack(side=tk.LEFT)
        self.percentage_entry = ttk.Entry(percentage_frame, textvariable=self.resize_percentage, width=10)
        self.percentage_entry.pack(side=tk.LEFT, padx=5)
        ttk.Label(percentage_frame, text="%").pack(side=tk.LEFT)
        percentage_frame.pack(fill=tk.X, pady=(0, 5), padx=20)

        self.update_resize_fields_state()  # 初始状态设置

        # 水印设置框架
        watermark_frame = ttk.LabelFrame(control_frame, text="水印设置", padding="10")
        watermark_frame.pack(fill=tk.X, pady=(0, 15))

        # 1. 水印类型选择
        ttk.Label(watermark_frame, text="水印类型:").pack(anchor=tk.W, pady=(0, 5))
        type_frame = ttk.Frame(watermark_frame)
        type_frame.pack(fill=tk.X, pady=(0, 10))
        ttk.Radiobutton(type_frame, text="无水印", variable=self.watermark_type, value="none",
                        command=self.update_watermark_fields).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(type_frame, text="文本水印", variable=self.watermark_type, value="text",
                        command=self.update_watermark_fields).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(type_frame, text="图片水印", variable=self.watermark_type, value="image",
                        command=self.update_watermark_fields).pack(side=tk.LEFT, padx=5)

        # 2. 文本水印设置（默认隐藏）
        self.text_watermark_subframe = ttk.Frame(watermark_frame, padding="5 0 0 0")
        # 文本内容
        ttk.Label(self.text_watermark_subframe, text="水印文本:").pack(anchor=tk.W, pady=(0, 2))
        ttk.Entry(self.text_watermark_subframe, textvariable=self.watermark_text).pack(fill=tk.X, pady=(0, 5))
        # 字体设置（家族+字号）
        font_frame = ttk.Frame(self.text_watermark_subframe)
        ttk.Label(font_frame, text="字体:").pack(side=tk.LEFT, padx=(0, 5))
        # 加载系统字体（过滤非中文字体）
        import tkinter.font as tkFont
        system_fonts = [font for font in tkFont.families() if
                        any(u'\u4e00' <= c <= u'\u9fff' for c in font) or font in ["Arial", "Times New Roman"]]
        ttk.Combobox(font_frame, textvariable=self.watermark_font_family, values=system_fonts, state="readonly").pack(
            side=tk.LEFT, padx=5)
        ttk.Label(font_frame, text="字号:").pack(side=tk.LEFT, padx=(10, 5))
        ttk.Spinbox(font_frame, from_=8, to=72, textvariable=self.watermark_font_size, width=5).pack(side=tk.LEFT)
        font_frame.pack(fill=tk.X, pady=(0, 5))
        # 字体样式（粗体+斜体）
        style_frame = ttk.Frame(self.text_watermark_subframe)
        ttk.Checkbutton(style_frame, text="粗体", variable=self.watermark_font_bold).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(style_frame, text="斜体", variable=self.watermark_font_italic).pack(side=tk.LEFT, padx=5)
        style_frame.pack(fill=tk.X, pady=(0, 5))
        # 文本颜色（调色板）
        color_frame = ttk.Frame(self.text_watermark_subframe)
        ttk.Label(color_frame, text="文本颜色:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Entry(color_frame, textvariable=self.watermark_text_color, width=10).pack(side=tk.LEFT)
        ttk.Button(color_frame, text="选择", command=self.pick_text_color).pack(side=tk.LEFT, padx=5)
        color_frame.pack(fill=tk.X, pady=(0, 5))
        # 透明度+阴影
        opacity_frame = ttk.Frame(self.text_watermark_subframe)
        ttk.Label(opacity_frame, text="透明度:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Scale(opacity_frame, from_=0, to=100, variable=self.watermark_text_opacity, orient=tk.HORIZONTAL,
                  length=100).pack(side=tk.LEFT, padx=5)
        ttk.Label(opacity_frame, textvariable=self.watermark_text_opacity).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opacity_frame, text="阴影", variable=self.watermark_text_shadow).pack(side=tk.LEFT, padx=10)
        opacity_frame.pack(fill=tk.X, pady=(0, 5))

        # 3. 图片水印设置（默认隐藏）
        self.image_watermark_subframe = ttk.Frame(watermark_frame, padding="5 0 0 0")
        # 选择图片
        img_path_frame = ttk.Frame(self.image_watermark_subframe)
        ttk.Label(img_path_frame, text="水印图片:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Entry(img_path_frame, textvariable=self.watermark_image_path, state="readonly").pack(fill=tk.X,
                                                                                                 side=tk.LEFT, padx=5)
        ttk.Button(img_path_frame, text="选择", command=self.select_watermark_image).pack(side=tk.LEFT, padx=5)
        img_path_frame.pack(fill=tk.X, pady=(0, 5))
        # 图片预览（小尺寸）
        self.watermark_preview_label = ttk.Label(self.image_watermark_subframe, text="未选择图片")
        self.watermark_preview_label.pack(pady=(0, 5))
        # 缩放比例+透明度
        scale_frame = ttk.Frame(self.image_watermark_subframe)
        ttk.Label(scale_frame, text="缩放:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Scale(scale_frame, from_=10, to=200, variable=self.watermark_image_scale, orient=tk.HORIZONTAL,
                  length=100).pack(side=tk.LEFT, padx=5)
        ttk.Label(scale_frame, textvariable=self.watermark_image_scale).pack(side=tk.LEFT, padx=5)
        ttk.Label(scale_frame, text="%").pack(side=tk.LEFT)
        scale_frame.pack(fill=tk.X, pady=(0, 5))
        img_opacity_frame = ttk.Frame(self.image_watermark_subframe)
        ttk.Label(img_opacity_frame, text="透明度:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Scale(img_opacity_frame, from_=0, to=100, variable=self.watermark_image_opacity, orient=tk.HORIZONTAL,
                  length=100).pack(side=tk.LEFT, padx=5)
        ttk.Label(img_opacity_frame, textvariable=self.watermark_image_opacity).pack(side=tk.LEFT, padx=5)
        ttk.Label(img_opacity_frame, text="%").pack(side=tk.LEFT)
        img_opacity_frame.pack(fill=tk.X, pady=(0, 5))

        # 4. 水印布局设置
        layout_frame = ttk.LabelFrame(watermark_frame, text="水印布局")
        layout_frame.pack(fill=tk.X, pady=(10, 0))

        # 九宫格位置选择
        ttk.Label(layout_frame, text="预设位置:").pack(anchor=tk.W, pady=(5, 0))
        position_frame = ttk.Frame(layout_frame)

        positions = [
            ("左上", "top_left"), ("中上", "top_center"), ("右上", "top_right"),
            ("左中", "middle_left"), ("中心", "center"), ("右中", "middle_right"),
            ("左下", "bottom_left"), ("中下", "bottom_center"), ("右下", "bottom_right")
        ]

        for i, (text, value) in enumerate(positions):
            row, col = divmod(i, 3)
            ttk.Radiobutton(
                position_frame, text=text, variable=self.watermark_position,
                value=value, command=self.set_watermark_position
            ).grid(row=row, column=col, padx=5, pady=2, sticky="w")

        position_frame.pack(fill=tk.X, pady=(0, 5))

        # 旋转设置
        rotation_frame = ttk.Frame(layout_frame)
        ttk.Label(rotation_frame, text="旋转角度:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Scale(rotation_frame, from_=0, to=359, variable=self.watermark_rotation,
                  orient=tk.HORIZONTAL, length=150).pack(side=tk.LEFT, padx=5)
        ttk.Label(rotation_frame, textvariable=self.watermark_rotation).pack(side=tk.LEFT, padx=5)
        ttk.Label(rotation_frame, text="°").pack(side=tk.LEFT)
        rotation_frame.pack(fill=tk.X, pady=(0, 5))

        # 初始化水印字段状态
        self.update_watermark_fields()

        # 5. 水印模板管理
        template_frame = ttk.LabelFrame(control_frame, text="水印模板", padding="10")
        template_frame.pack(fill=tk.X, pady=(0, 15))

        ttk.Label(template_frame, text="保存的模板:").pack(anchor=tk.W, pady=(0, 5))
        template_select_frame = ttk.Frame(template_frame)
        self.template_combobox = ttk.Combobox(
            template_select_frame, textvariable=self.current_template,
            state="readonly", width=25
        )
        self.template_combobox.pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(template_select_frame, text="加载", command=self.load_selected_template).pack(side=tk.LEFT, padx=2)
        ttk.Button(template_select_frame, text="删除", command=self.delete_selected_template).pack(side=tk.LEFT, padx=2)
        template_select_frame.pack(fill=tk.X, pady=(0, 5))

        save_template_frame = ttk.Frame(template_frame)
        self.new_template_name = ttk.Entry(save_template_frame, width=20)
        self.new_template_name.pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(save_template_frame, text="保存当前设置为模板", command=self.save_current_as_template).pack(
            side=tk.LEFT)
        save_template_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Button(control_frame, text="导出选中图片", command=self.export_selected).pack(fill=tk.X, pady=(15, 5))
        ttk.Button(control_frame, text="导出所有图片", command=self.export_all).pack(fill=tk.X, pady=(0, 5))

        # 添加一个占位元素，确保最后有足够空间
        ttk.Label(control_frame, text="").pack(pady=10)

        # 右侧区域 - 分为预览区和图片列表区
        right_frame = ttk.Frame(main_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        # 预览区
        preview_frame = ttk.LabelFrame(right_frame, text="预览", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # 预览画布
        self.preview_canvas = tk.Canvas(preview_frame, bg="#f0f0f0", highlightthickness=1, highlightbackground="#ccc")
        self.preview_canvas.pack(fill=tk.BOTH, expand=True)

        # 绑定预览画布事件用于拖拽水印
        self.preview_canvas.bind("<Button-1>", self.start_drag_watermark)
        self.preview_canvas.bind("<B1-Motion>", self.drag_watermark)
        self.preview_canvas.bind("<ButtonRelease-1>", self.stop_drag_watermark)

        # 图片列表区
        image_frame = ttk.LabelFrame(right_frame, text="已导入图片", padding="10")
        image_frame.pack(fill=tk.BOTH, expand=True)

        # 滚动条
        scrollbar = ttk.Scrollbar(image_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 图片列表
        self.image_listbox = tk.Canvas(image_frame, yscrollcommand=scrollbar.set)
        self.image_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.image_listbox.yview)

        # 用于放置图片项的框架
        self.images_container = ttk.Frame(self.image_listbox)
        self.image_listbox_window = self.image_listbox.create_window((0, 0), window=self.images_container, anchor="nw")

        # 添加提示文字
        self.hint_label = ttk.Label(
            self.images_container,
            text="请使用左侧按钮导入图片，或直接拖放图片到此处",
            font=("SimHei", 12, "italic"),
            foreground="#666666"
        )
        self.hint_label.pack(pady=50)

        # 绑定事件以调整滚动区域
        self.images_container.bind("<Configure>", self.on_container_configure)
        self.image_listbox.bind("<Configure>", self.on_canvas_configure)

        # 更新模板列表
        self.update_template_list()

    def update_quality_label(self, value):
        """更新JPEG质量标签显示"""
        self.quality_value_label.config(text=f"{int(float(value))}%")

    def update_jpeg_quality_state(self):
        """根据输出格式更新JPEG质量控件状态"""
        state = tk.NORMAL if self.output_format.get().lower() == "jpeg" else tk.DISABLED
        # 只对支持state属性的控件设置状态
        self.quality_slider.configure(state=state)
        # 标签通过颜色区分是否可用
        if state == tk.DISABLED:
            self.quality_label_title.configure(foreground="#999999")
            self.quality_value_label.configure(foreground="#999999")
        else:
            self.quality_label_title.configure(foreground="#000000")
            self.quality_value_label.configure(foreground="#000000")

    def update_resize_fields_state(self):
        """根据尺寸调整方式更新输入框状态"""
        method = self.resize_method.get()
        self.width_entry.config(state=tk.NORMAL if method == "width" else tk.DISABLED)
        self.height_entry.config(state=tk.NORMAL if method == "height" else tk.DISABLED)
        self.percentage_entry.config(state=tk.NORMAL if method == "percentage" else tk.DISABLED)

    def enable_drag_and_drop(self):
        """使用更兼容的方式实现拖放功能"""
        try:
            # 修复tkinterdnd2的导入方式
            from tkinterdnd2 import DND_FILES, Tk
            # 检查是否已经是TkinterDnD的Tk对象
            if not isinstance(self.root, Tk):
                # 创建一个新的TkinterDnD窗口并转移配置
                new_root = Tk()
                new_root.title(self.root.title())
                new_root.geometry(self.root.geometry())
                self.root.destroy()
                self.root = new_root

            # 绑定拖放事件
            self.images_container.drop_target_register(DND_FILES)
            self.images_container.dnd_bind('<<Drop>>', self.on_drop)
        except ImportError:
            # 如果没有tkinterdnd2库，尝试基础实现
            self.setup_fallback_drag_drop()

    def setup_fallback_drag_drop(self):
        """备用拖放实现，兼容更多环境"""
        try:
            # 为图片容器设置允许拖放的属性
            self.images_container.configure(takefocus=True)
            self.images_container.bind('<Button-1>', lambda e: self.images_container.focus_set())

            # 不同平台的基础拖放绑定
            if sys.platform == 'win32':
                # Windows系统使用OLE拖放
                self.images_container.bind("<Enter>", self.on_drag_enter)
                self.images_container.bind("<Leave>", self.on_drag_leave)
                self.images_container.bind("<Motion>", self.on_drag_motion)
                self.images_container.bind("<ButtonRelease-1>", self.on_drag_release)
            else:
                # Unix-like系统
                self.images_container.bind("<DragEnter>", self.on_drag_enter)
                self.images_container.bind("<DragLeave>", self.on_drag_leave)
                self.images_container.bind("<Drop>", self.on_drop)
        except Exception as e:
            messagebox.showinfo(
                "提示",
                f"拖放功能初始化失败：{str(e)}\n"
                "您仍然可以使用按钮导入图片"
            )

    def on_drag_enter(self, event):
        """处理拖入事件"""
        event.widget.focus_set()
        return "copy"

    def on_drag_leave(self, event):
        """处理拖离事件"""
        pass

    def on_drag_motion(self, event):
        """处理拖放移动事件（Windows）"""
        return "copy"

    def on_drag_release(self, event):
        """处理拖放释放事件（Windows）"""
        try:
            # 尝试从剪贴板获取文件路径
            files = self.root.clipboard_get().split()
            if files:
                self.process_dropped_files(files)
        except:
            pass

    def on_drop(self, event):
        """处理放置事件"""
        if event.data:
            # 解析拖放的文件路径
            files = event.data.split()
            # 清理路径中的特殊字符
            files = [file.strip('{}"') for file in files if file.strip()]
            self.process_dropped_files(files)
        return "break"

    def process_dropped_files(self, files):
        """处理拖放的文件或文件夹"""
        if not files:
            return

        # 移除提示文字
        if hasattr(self, 'hint_label') and self.hint_label.winfo_exists():
            self.hint_label.destroy()

        image_paths = []
        for file in files:
            # 检查是否为目录
            if os.path.isdir(file):
                # 处理目录中的图片
                dir_images = self.get_image_files_in_directory(file)
                image_paths.extend(dir_images)
            else:
                # 检查是否为图片文件
                if self.is_image_file(file):
                    image_paths.append(file)

        # 导入图片
        self.import_images(image_paths)

    def update_text_entry_state(self):
        # 根据选中的命名规则更新文本输入框状态
        state = tk.NORMAL if self.naming_option.get() in ["prefix", "suffix"] else tk.DISABLED
        self.text_entry.config(state=state)
        if state == tk.DISABLED:
            self.custom_text.set("")

    def on_container_configure(self, event):
        # 更新画布滚动区域
        self.image_listbox.configure(scrollregion=self.image_listbox.bbox("all"))

    def on_canvas_configure(self, event):
        # 调整画布窗口大小
        self.image_listbox.itemconfig(self.image_listbox_window, width=event.width)

    def is_image_file(self, file_path):
        # 检查文件是否为支持的图片格式
        supported_formats = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif')
        return file_path.lower().endswith(supported_formats)

    def get_image_files_in_directory(self, directory):
        # 获取目录中所有支持的图片文件
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.tiff', '*.gif']
        image_files = []

        for ext in image_extensions:
            image_files.extend(glob.glob(os.path.join(directory, ext)))
            image_files.extend(glob.glob(os.path.join(directory, ext.upper())))

        return image_files

    def import_single_image(self):
        # 导入单张图片
        # 移除提示文字
        if hasattr(self, 'hint_label') and self.hint_label.winfo_exists():
            self.hint_label.destroy()

        file_path = filedialog.askopenfilename(
            title="选择图片",
            filetypes=[
                ("图片文件", "*.jpg;*.jpeg;*.png;*.bmp;*.tiff;*.gif"),
                ("所有文件", "*.*")
            ]
        )

        if file_path and self.is_image_file(file_path):
            self.import_images([file_path])

    def import_multiple_images(self):
        # 导入多张图片
        # 移除提示文字
        if hasattr(self, 'hint_label') and self.hint_label.winfo_exists():
            self.hint_label.destroy()

        file_paths = filedialog.askopenfilenames(
            title="选择多张图片",
            filetypes=[
                ("图片文件", "*.jpg;*.jpeg;*.png;*.bmp;*.tiff;*.gif"),
                ("所有文件", "*.*")
            ]
        )

        if file_paths:
            # 过滤非图片文件
            image_paths = [path for path in file_paths if self.is_image_file(path)]
            self.import_images(image_paths)

    def import_folder(self):
        # 导入文件夹
        # 移除提示文字
        if hasattr(self, 'hint_label') and self.hint_label.winfo_exists():
            self.hint_label.destroy()

        folder_path = filedialog.askdirectory(title="选择图片文件夹")

        if folder_path:
            image_paths = self.get_image_files_in_directory(folder_path)
            self.import_images(image_paths)

    def import_images(self, image_paths):
        # 导入图片并显示
        if not image_paths:
            messagebox.showinfo("提示", "未找到有效的图片文件")
            return

        new_images = []
        for path in image_paths:
            # 检查是否已导入
            if any(img[0] == path for img in self.images):
                continue

            try:
                # 打开图片并创建缩略图
                with Image.open(path) as img:
                    # 保存原图的副本，避免后续处理时文件被锁定
                    img_copy = img.copy()

                    # 创建缩略图
                    thumbnail = img_copy.copy()
                    thumbnail.thumbnail((120, 120))  # 缩略图最大尺寸
                    photo = ImageTk.PhotoImage(thumbnail)

                    file_name = os.path.basename(path)
                    new_images.append((path, photo, file_name, img_copy))
            except Exception as e:
                messagebox.showerror("错误", f"无法导入图片 {os.path.basename(path)}: {str(e)}")

        if new_images:
            self.images.extend(new_images)
            self.update_image_list()
            # 如果是第一次导入图片，自动预览第一张
            if self.current_preview_index == -1 and self.images:
                self.current_preview_index = 0
                self.update_preview()
            messagebox.showinfo("成功", f"成功导入 {len(new_images)} 张图片")

    def update_image_list(self):
        # 清空现有内容
        for widget in self.images_container.winfo_children():
            widget.destroy()

        # 显示所有图片
        cols = 4  # 每行显示4张图片
        for i, (path, photo, file_name, img) in enumerate(self.images):
            frame = ttk.Frame(self.images_container, padding="5",
                              relief=tk.RAISED if i == self.current_preview_index else tk.FLAT, borderwidth=2)

            # 点击图片切换预览
            frame.bind("<Button-1>", lambda e, idx=i: self.set_preview_image(idx))

            # 复选框
            var = tk.BooleanVar(value=True)
            chk = ttk.Checkbutton(frame, variable=var)
            chk.var = var
            chk.pack(anchor=tk.NW)

            # 缩略图
            label_img = ttk.Label(frame, image=photo)
            label_img.image = photo  # 保持引用（避免被垃圾回收）
            label_img.pack(pady=(0, 5))
            label_img.bind("<Button-1>", lambda e, idx=i: self.set_preview_image(idx))

            # 文件名（显示部分，过长截断）
            display_name = file_name if len(file_name) <= 15 else file_name[:12] + "..."
            label_name = ttk.Label(frame, text=display_name, wraplength=120)
            label_name.pack()
            label_name.bind("<Button-1>", lambda e, idx=i: self.set_preview_image(idx))

            # 存储路径和变量引用
            frame.image_path = path
            frame.checkbox_var = var

            # 放置在网格中
            row, col = divmod(i, cols)
            frame.grid(row=row, column=col, padx=5, pady=5)

        # 更新滚动区域
        self.images_container.update_idletasks()
        self.image_listbox.configure(scrollregion=self.image_listbox.bbox("all"))

    def select_output_dir(self):
        # 选择输出文件夹
        dir_path = filedialog.askdirectory(title="选择输出文件夹")
        if dir_path:
            self.output_dir = dir_path
            self.output_dir_label.config(text=os.path.basename(dir_path))

    def resize_image(self, img):
        """根据设置调整图片尺寸"""
        method = self.resize_method.get()
        if method == "none":
            return img.copy()

        original_width, original_height = img.size
        new_width, new_height = original_width, original_height

        try:
            if method == "width":
                # 按宽度调整，保持比例
                target_width = max(1, self.target_width.get())  # 确保至少1像素
                ratio = target_width / original_width
                new_width = target_width
                new_height = int(original_height * ratio)

            elif method == "height":
                # 按高度调整，保持比例
                target_height = max(1, self.target_height.get())  # 确保至少1像素
                ratio = target_height / original_height
                new_height = target_height
                new_width = int(original_width * ratio)

            elif method == "percentage":
                # 按百分比调整
                percentage = max(1, min(1000, self.resize_percentage.get()))  # 限制在1-1000%
                ratio = percentage / 100
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)

            # 调整图片尺寸
            return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        except Exception as e:
            messagebox.showerror("错误", f"调整图片尺寸失败: {str(e)}")
            return img.copy()

    # 文本水印相关方法
    def pick_text_color(self):
        """打开颜色选择器选择文本颜色"""
        color = colorchooser.askcolor(title="选择水印文本颜色", initialcolor=self.watermark_text_color.get())
        if color[1]:  # color[1]是十六进制颜色码
            self.watermark_text_color.set(color[1])

    def get_watermark_font(self):
        """根据设置生成字体对象参数"""
        weight = "bold" if self.watermark_font_bold.get() else "normal"
        slant = "italic" if self.watermark_font_italic.get() else "roman"
        return (self.watermark_font_family.get(), self.watermark_font_size.get(), weight, slant)

    def add_text_watermark(self, img, is_preview=False):
        """给图片添加文本水印（支持透明度、阴影、旋转）"""
        img_copy = img.copy()
        draw = ImageDraw.Draw(img_copy, mode="RGBA")
        text = self.watermark_text.get()
        if not text:
            return img_copy  # 空文本不添加水印

        # 1. 准备字体和颜色（带透明度）
        try:
            font = ImageFont.truetype(
                font=self.watermark_font_family.get(),
                size=self.watermark_font_size.get(),
                weight="bold" if self.watermark_font_bold.get() else "normal"
            )
        except:
            # 字体加载失败时使用默认字体
            font = ImageFont.load_default()

        # 解析颜色
        hex_color = self.watermark_text_color.get().lstrip("#")
        try:
            r, g, b = tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
        except:
            r, g, b = 0, 0, 0  # 默认黑色

        opacity = int(self.watermark_text_opacity.get() * 2.55)  # 转0-255
        text_color = (r, g, b, opacity)

        # 2. 获取文本尺寸和位置
        img_width, img_height = img_copy.size
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

        # 如果是预览且没有设置过位置，使用预设位置
        if is_preview and (self.watermark_x.get() == 0 and self.watermark_y.get() == 0):
            self.set_watermark_position()

        x, y = self.watermark_x.get(), self.watermark_y.get()

        # 3. 处理旋转
        rotation = self.watermark_rotation.get()
        if rotation != 0:
            # 创建一个临时图像来绘制旋转后的文本
            temp_img = Image.new('RGBA', (text_width + 20, text_height + 20), (0, 0, 0, 0))
            temp_draw = ImageDraw.Draw(temp_img)

            # 添加阴影到临时图像
            if self.watermark_text_shadow.get():
                shadow_color = (0, 0, 0, int(opacity * 0.3))  # 半透明黑色阴影
                temp_draw.text((2, 2), text, font=font, fill=shadow_color)

            # 添加文本到临时图像
            temp_draw.text((0, 0), text, font=font, fill=text_color)

            # 旋转临时图像
            rotated_temp = temp_img.rotate(rotation, expand=True, resample=Image.Resampling.BILINEAR)

            # 将旋转后的文本粘贴到原图
            img_copy.paste(rotated_temp, (x, y), rotated_temp)
        else:
            # 不旋转的情况
            # 添加阴影
            if self.watermark_text_shadow.get():
                shadow_color = (0, 0, 0, int(opacity * 0.3))  # 半透明黑色阴影
                draw.text((x + 2, y + 2), text, font=font, fill=shadow_color)

            # 添加文本水印
            draw.text((x, y), text, font=font, fill=text_color)

        return img_copy

    # 图片水印相关方法
    def select_watermark_image(self):
        """选择水印图片（支持PNG透明通道）"""
        img_path = filedialog.askopenfilename(
            title="选择水印图片",
            filetypes=[("图片文件", "*.png;*.jpg;*.jpeg;*.bmp"), ("所有文件", "*.*")]
        )
        if img_path:
            self.watermark_image_path.set(img_path)
            # 加载图片并预览
            try:
                with Image.open(img_path) as img:
                    self.watermark_image_obj = img.copy()
                    # 生成预览图（100x100缩略图）
                    preview = img.copy()
                    preview.thumbnail((100, 100))
                    preview_photo = ImageTk.PhotoImage(preview)
                    self.watermark_preview_label.config(image=preview_photo, text="")
                    self.watermark_preview_label.image = preview_photo  # 防止GC回收

                    # 重置水印位置
                    self.watermark_x.set(0)
                    self.watermark_y.set(0)
                    self.update_preview()
            except Exception as e:
                messagebox.showerror("错误", f"加载水印图片失败: {str(e)}")
                self.watermark_image_path.set("")
                self.watermark_image_obj = None

    def add_image_watermark(self, img, is_preview=False):
        """给图片添加图片水印（支持缩放、透明度、透明通道、旋转）"""
        if not self.watermark_image_obj:
            return img.copy()  # 无水印图片时返回原图

        img_copy = img.copy()
        watermark = self.watermark_image_obj.copy()

        # 1. 缩放水印图片
        scale = self.watermark_image_scale.get() / 100
        wm_width = int(watermark.width * scale)
        wm_height = int(watermark.height * scale)
        watermark = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)

        # 2. 调整水印透明度
        opacity = int(self.watermark_image_opacity.get() * 2.55)  # 转0-255
        if watermark.mode != "RGBA":
            watermark = watermark.convert("RGBA")
        wm_data = watermark.getdata()
        # 遍历每个像素调整透明度
        new_wm_data = [(r, g, b, int(a * opacity / 255)) for r, g, b, a in wm_data]
        watermark.putdata(new_wm_data)

        # 3. 处理旋转
        rotation = self.watermark_rotation.get()
        if rotation != 0:
            watermark = watermark.rotate(rotation, expand=True, resample=Image.Resampling.BILINEAR)

        # 4. 获取水印尺寸和位置
        wm_width, wm_height = watermark.size
        img_width, img_height = img_copy.size

        # 如果是预览且没有设置过位置，使用预设位置
        if is_preview and (self.watermark_x.get() == 0 and self.watermark_y.get() == 0):
            self.set_watermark_position()

        x, y = self.watermark_x.get(), self.watermark_y.get()

        # 确保水印不会超出图片范围太多
        x = max(0, min(x, img_width - 10))
        y = max(0, min(y, img_height - 10))

        # 5. 叠加水印（保留PNG透明通道）
        img_copy.paste(watermark, (x, y), watermark)  # 第三个参数是蒙版，保留透明
        return img_copy

    def update_watermark_fields(self):
        """根据水印类型显示/隐藏对应设置项"""
        watermark_type = self.watermark_type.get()
        # 文本水印字段
        if watermark_type == "text":
            self.text_watermark_subframe.pack(fill=tk.X, pady=(0, 5))
            self.image_watermark_subframe.pack_forget()
        # 图片水印字段
        elif watermark_type == "image":
            self.image_watermark_subframe.pack(fill=tk.X, pady=(0, 5))
            self.text_watermark_subframe.pack_forget()
        # 无水印（隐藏所有）
        else:
            self.text_watermark_subframe.pack_forget()
            self.image_watermark_subframe.pack_forget()

        # 更新预览
        self.update_preview()

    def get_output_path(self, original_path):
        # 根据设置生成输出路径
        if not self.output_dir:
            return None

        # 检查是否为原文件夹（防止覆盖）
        original_dir = os.path.dirname(original_path)
        if os.path.abspath(self.output_dir) == os.path.abspath(original_dir):
            messagebox.showerror("错误", "禁止导出到原文件夹，以防止覆盖原图")
            return None

        # 获取文件名和扩展名
        file_name = os.path.basename(original_path)
        name_without_ext, original_ext = os.path.splitext(file_name)

        # 根据命名规则处理文件名
        output_ext = self.output_format.get().lower()
        custom_text = self.custom_text.get().strip()

        if self.naming_option.get() == "original":
            new_name = f"{name_without_ext}.{output_ext}"
        elif self.naming_option.get() == "prefix":
            new_name = f"{custom_text}{name_without_ext}.{output_ext}"
        else:  # suffix
            new_name = f"{name_without_ext}{custom_text}.{output_ext}"

        return os.path.join(self.output_dir, new_name)

    def export_selected(self):
        # 导出选中的图片
        if not self.images:
            messagebox.showinfo("提示", "没有可导出的图片")
            return

        if not self.output_dir:
            messagebox.showinfo("提示", "请先选择输出文件夹")
            return

        # 检查命名规则（前缀/后缀需填写文本）
        if self.naming_option.get() in ["prefix", "suffix"] and not self.custom_text.get().strip():
            messagebox.showinfo("提示", "请输入前缀或后缀文本")
            return

        # 检查尺寸调整参数
        if self.resize_method.get() == "width" and (self.target_width.get() <= 0):
            messagebox.showinfo("提示", "请输入有效的目标宽度")
            return

        if self.resize_method.get() == "height" and (self.target_height.get() <= 0):
            messagebox.showinfo("提示", "请输入有效的目标高度")
            return

        if self.resize_method.get() == "percentage" and (
                self.resize_percentage.get() <= 0 or self.resize_percentage.get() > 1000):
            messagebox.showinfo("提示", "请输入有效的缩放比例（1-1000%）")
            return

        # 检查水印参数
        if self.watermark_type.get() == "image" and not self.watermark_image_path.get():
            messagebox.showinfo("提示", "请选择水印图片")
            return

        # 获取选中的图片
        selected_frames = [frame for frame in self.images_container.winfo_children()
                           if hasattr(frame, 'checkbox_var') and frame.checkbox_var.get()]

        if not selected_frames:
            messagebox.showinfo("提示", "请先选择要导出的图片")
            return

        # 导出图片
        success_count = 0
        for frame in selected_frames:
            # 找到对应的图片数据
            for path, photo, file_name, img in self.images:
                if path == frame.image_path:
                    output_path = self.get_output_path(path)
                    if output_path:
                        try:
                            # 1. 先调整尺寸
                            resized_img = self.resize_image(img)
                            # 2. 根据水印类型添加水印
                            watermark_type = self.watermark_type.get()
                            if watermark_type == "text":
                                final_img = self.add_text_watermark(resized_img)
                            elif watermark_type == "image":
                                final_img = self.add_image_watermark(resized_img)
                            else:
                                final_img = resized_img  # 无水印

                            # 3. 保存图片
                            if self.output_format.get().lower() == "jpeg":
                                if final_img.mode in ('RGBA', 'LA'):
                                    background = Image.new(final_img.mode[:-1], final_img.size, (255, 255, 255))
                                    background.paste(final_img, final_img.split()[-1])
                                    final_img = background
                                final_img.save(output_path, "JPEG", quality=self.jpeg_quality.get())
                            else:  # PNG（保留透明通道）
                                final_img.save(output_path, "PNG")
                            success_count += 1
                        except Exception as e:
                            messagebox.showerror("错误", f"导出 {file_name} 失败: {str(e)}")
                    break

        messagebox.showinfo("完成", f"导出完成，成功导出 {success_count} 张图片")

    def export_all(self):
        # 导出所有图片（全选后调用导出选中逻辑）
        if not self.images:
            messagebox.showinfo("提示", "没有可导出的图片")
            return

        # 全选所有图片
        for frame in self.images_container.winfo_children():
            if hasattr(frame, 'checkbox_var'):
                frame.checkbox_var.set(True)

        # 调用导出选中图片的函数
        self.export_selected()

    # 水印布局与实时预览相关方法
    def bind_watermark_events(self):
        """绑定水印设置变更事件，实现实时预览"""
        # 水印类型变更
        self.watermark_type.trace_add("write", lambda *args: self.update_preview())

        # 文本水印变更
        self.watermark_text.trace_add("write", lambda *args: self.update_preview())
        self.watermark_font_family.trace_add("write", lambda *args: self.update_preview())
        self.watermark_font_size.trace_add("write", lambda *args: self.update_preview())
        self.watermark_font_bold.trace_add("write", lambda *args: self.update_preview())
        self.watermark_font_italic.trace_add("write", lambda *args: self.update_preview())
        self.watermark_text_color.trace_add("write", lambda *args: self.update_preview())
        self.watermark_text_opacity.trace_add("write", lambda *args: self.update_preview())
        self.watermark_text_shadow.trace_add("write", lambda *args: self.update_preview())

        # 图片水印变更
        self.watermark_image_scale.trace_add("write", lambda *args: self.update_preview())
        self.watermark_image_opacity.trace_add("write", lambda *args: self.update_preview())

        # 水印位置和旋转变更
        self.watermark_position.trace_add("write", lambda *args: self.set_watermark_position())
        self.watermark_rotation.trace_add("write", lambda *args: self.update_preview())

        # 尺寸调整变更
        self.resize_method.trace_add("write", lambda *args: self.update_preview())
        self.target_width.trace_add("write", lambda *args: self.update_preview())
        self.target_height.trace_add("write", lambda *args: self.update_preview())
        self.resize_percentage.trace_add("write", lambda *args: self.update_preview())

    def set_preview_image(self, index):
        """设置当前预览图片"""
        if 0 <= index < len(self.images):
            self.current_preview_index = index
            self.update_image_list()  # 更新列表高亮显示
            self.update_preview()  # 更新预览

    def update_preview(self):
        """更新预览窗口显示"""
        if self.current_preview_index < 0 or self.current_preview_index >= len(self.images):
            return

        # 获取当前图片
        path, photo, file_name, img = self.images[self.current_preview_index]

        # 调整尺寸
        resized_img = self.resize_image(img)

        # 添加水印
        watermark_type = self.watermark_type.get()
        if watermark_type == "text":
            self.preview_image = self.add_text_watermark(resized_img, is_preview=True)
        elif watermark_type == "image":
            self.preview_image = self.add_image_watermark(resized_img, is_preview=True)
        else:
            self.preview_image = resized_img

        # 调整预览大小以适应窗口
        self.display_preview_image()

    def display_preview_image(self):
        """在画布上显示预览图片"""
        if not self.preview_image:
            return

        # 清除画布
        self.preview_canvas.delete("all")

        # 获取画布尺寸
        canvas_width = self.preview_canvas.winfo_width()
        canvas_height = self.preview_canvas.winfo_height()

        # 如果画布还没渲染，使用默认尺寸
        if canvas_width <= 1 or canvas_height <= 1:
            canvas_width = 800
            canvas_height = 600

        # 计算缩放比例以适应画布
        img_width, img_height = self.preview_image.size
        scale = min(canvas_width / img_width, canvas_height / img_height, 1.0)

        # 计算缩放后的尺寸
        new_width = int(img_width * scale)
        new_height = int(img_height * scale)

        # 缩放图片
        scaled_img = self.preview_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        self.preview_photo = ImageTk.PhotoImage(scaled_img)

        # 计算居中位置
        x = (canvas_width - new_width) // 2
        y = (canvas_height - new_height) // 2

        # 在画布上显示图片
        self.preview_canvas.create_image(x, y, anchor=tk.NW, image=self.preview_photo)

        # 存储预览信息
        self.preview_info = {
            "original_size": (img_width, img_height),
            "scaled_size": (new_width, new_height),
            "scale": scale,
            "position": (x, y)
        }

        # 绑定画布大小变化事件
        self.preview_canvas.bind("<Configure>", lambda e: self.display_preview_image())

    def set_watermark_position(self):
        """根据九宫格位置设置水印位置"""
        if self.current_preview_index < 0 or self.current_preview_index >= len(self.images):
            return

        # 获取当前图片
        path, photo, file_name, img = self.images[self.current_preview_index]
        resized_img = self.resize_image(img)
        img_width, img_height = resized_img.size

        # 获取水印尺寸
        if self.watermark_type.get() == "text":
            # 计算文本水印尺寸
            try:
                font = ImageFont.truetype(
                    font=self.watermark_font_family.get(),
                    size=self.watermark_font_size.get(),
                    weight="bold" if self.watermark_font_bold.get() else "normal"
                )
            except:
                font = ImageFont.load_default()

            draw = ImageDraw.Draw(resized_img)
            text = self.watermark_text.get() or " "  # 防止空文本
            text_bbox = draw.textbbox((0, 0), text, font=font)
            wm_width = text_bbox[2] - text_bbox[0]
            wm_height = text_bbox[3] - text_bbox[1]
        elif self.watermark_type.get() == "image" and self.watermark_image_obj:
            # 计算图片水印尺寸
            scale = self.watermark_image_scale.get() / 100
            wm_width = int(self.watermark_image_obj.width * scale)
            wm_height = int(self.watermark_image_obj.height * scale)
        else:
            return

        # 根据选择的位置计算坐标
        position = self.watermark_position.get()
        margin = 20  # 边距

        if position == "top_left":
            x, y = margin, margin
        elif position == "top_center":
            x, y = (img_width - wm_width) // 2, margin
        elif position == "top_right":
            x, y = img_width - wm_width - margin, margin
        elif position == "middle_left":
            x, y = margin, (img_height - wm_height) // 2
        elif position == "center":
            x, y = (img_width - wm_width) // 2, (img_height - wm_height) // 2
        elif position == "middle_right":
            x, y = img_width - wm_width - margin, (img_height - wm_height) // 2
        elif position == "bottom_left":
            x, y = margin, img_height - wm_height - margin
        elif position == "bottom_center":
            x, y = (img_width - wm_width) // 2, img_height - wm_height - margin
        else:  # bottom_right
            x, y = img_width - wm_width - margin, img_height - wm_height - margin

        # 更新水印位置
        self.watermark_x.set(x)
        self.watermark_y.set(y)

        # 更新预览
        self.update_preview()

    def start_drag_watermark(self, event):
        """开始拖拽水印"""
        if self.watermark_type.get() == "none":
            return

        if not hasattr(self, 'preview_info'):
            return

        # 获取预览信息
        scale = self.preview_info["scale"]
        img_x, img_y = self.preview_info["position"]
        img_width, img_height = self.preview_info["original_size"]

        # 计算点击位置在原图上的坐标
        click_x = (event.x - img_x) / scale
        click_y = (event.y - img_y) / scale

        # 判断是否点击在水印上
        if self.is_point_on_watermark(click_x, click_y, img_width, img_height):
            self.is_dragging = True
            # 计算偏移量
            self.drag_offset_x = click_x - self.watermark_x.get()
            self.drag_offset_y = click_y - self.watermark_y.get()

    def drag_watermark(self, event):
        """拖拽水印过程"""
        if not self.is_dragging or self.watermark_type.get() == "none":
            return

        if not hasattr(self, 'preview_info'):
            return

        # 获取预览信息
        scale = self.preview_info["scale"]
        img_x, img_y = self.preview_info["position"]
        img_width, img_height = self.preview_info["original_size"]

        # 计算拖拽位置在原图上的坐标
        new_x = (event.x - img_x) / scale - self.drag_offset_x
        new_y = (event.y - img_y) / scale - self.drag_offset_y

        # 更新水印位置
        self.watermark_x.set(int(new_x))
        self.watermark_y.set(int(new_y))

        # 更新预览
        self.update_preview()

    def stop_drag_watermark(self, event):
        """停止拖拽水印"""
        self.is_dragging = False

    def is_point_on_watermark(self, x, y, img_width, img_height):
        """判断点是否在水印上"""
        wm_x, wm_y = self.watermark_x.get(), self.watermark_y.get()

        # 获取水印尺寸
        if self.watermark_type.get() == "text":
            try:
                font = ImageFont.truetype(
                    font=self.watermark_font_family.get(),
                    size=self.watermark_font_size.get(),
                    weight="bold" if self.watermark_font_bold.get() else "normal"
                )
            except:
                font = ImageFont.load_default()

            text = self.watermark_text.get() or " "  # 防止空文本
            temp_img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(temp_img)
            text_bbox = draw.textbbox((wm_x, wm_y), text, font=font)
            return (text_bbox[0] <= x <= text_bbox[2] and
                    text_bbox[1] <= y <= text_bbox[3])

        elif self.watermark_type.get() == "image" and self.watermark_image_obj:
            scale = self.watermark_image_scale.get() / 100
            wm_width = int(self.watermark_image_obj.width * scale)
            wm_height = int(self.watermark_image_obj.height * scale)

            # 考虑旋转的情况
            rotation = self.watermark_rotation.get()
            if rotation != 0:
                # 简化处理，使用旋转后的外接矩形判断
                angle_rad = math.radians(rotation)
                cos_theta = abs(math.cos(angle_rad))
                sin_theta = abs(math.sin(angle_rad))
                rotated_width = int(wm_width * cos_theta + wm_height * sin_theta)
                rotated_height = int(wm_width * sin_theta + wm_height * cos_theta)

                # 计算旋转后水印的中心位置
                center_x = wm_x + wm_width / 2
                center_y = wm_y + wm_height / 2

                # 判断点是否在旋转后的外接矩形内
                return (center_x - rotated_width / 2 <= x <= center_x + rotated_width / 2 and
                        center_y - rotated_height / 2 <= y <= center_y + rotated_height / 2)
            else:
                # 不旋转的情况
                return (wm_x <= x <= wm_x + wm_width and
                        wm_y <= y <= wm_y + wm_height)

        return False

    # 水印模板管理相关方法
    def load_templates(self):
        """加载保存的水印模板"""
        try:
            # 确保模板目录存在
            if not os.path.exists(self.template_dir):
                os.makedirs(self.template_dir)

            # 加载目录中的所有模板文件
            for filename in os.listdir(self.template_dir):
                if filename.endswith(".json"):
                    template_name = os.path.splitext(filename)[0]
                    with open(os.path.join(self.template_dir, filename), 'r', encoding='utf-8') as f:
                        self.watermark_templates[template_name] = json.load(f)

            # 尝试加载上次使用的模板
            last_used_path = os.path.join(self.template_dir, "__last_used__.json")
            if os.path.exists(last_used_path):
                with open(last_used_path, 'r', encoding='utf-8') as f:
                    last_settings = json.load(f)
                    self.apply_watermark_settings(last_settings)

        except Exception as e:
            print(f"加载模板失败: {e}")

    def update_template_list(self):
        """更新模板下拉列表"""
        self.template_combobox['values'] = list(self.watermark_templates.keys())
        if self.watermark_templates and not self.current_template.get():
            self.current_template.set(next(iter(self.watermark_templates.keys())))

    def save_current_as_template(self):
        """将当前水印设置保存为模板"""
        template_name = self.new_template_name.get().strip()
        if not template_name:
            template_name = f"模板_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # 收集当前水印设置
        settings = {
            "watermark_type": self.watermark_type.get(),

            # 文本水印设置
            "watermark_text": self.watermark_text.get(),
            "watermark_font_family": self.watermark_font_family.get(),
            "watermark_font_size": self.watermark_font_size.get(),
            "watermark_font_bold": self.watermark_font_bold.get(),
            "watermark_font_italic": self.watermark_font_italic.get(),
            "watermark_text_color": self.watermark_text_color.get(),
            "watermark_text_opacity": self.watermark_text_opacity.get(),
            "watermark_text_shadow": self.watermark_text_shadow.get(),

            # 图片水印设置
            "watermark_image_path": self.watermark_image_path.get(),
            "watermark_image_scale": self.watermark_image_scale.get(),
            "watermark_image_opacity": self.watermark_image_opacity.get(),

            # 布局设置
            "watermark_position": self.watermark_position.get(),
            "watermark_rotation": self.watermark_rotation.get()
        }

        # 保存模板
        try:
            # 保存模板文件
            template_path = os.path.join(self.template_dir, f"{template_name}.json")
            with open(template_path, 'w', encoding='utf-8') as f:
                json.dump(settings, f, ensure_ascii=False, indent=2)

            # 添加到模板字典
            self.watermark_templates[template_name] = settings

            # 更新模板列表
            self.update_template_list()

            # 清空输入框
            self.new_template_name.delete(0, tk.END)

            messagebox.showinfo("成功", f"模板 '{template_name}' 已保存")

            # 保存为上次使用的设置
            self.save_last_used_settings(settings)

        except Exception as e:
            messagebox.showerror("错误", f"保存模板失败: {str(e)}")

    def load_selected_template(self):
        """加载选中的模板"""
        template_name = self.current_template.get()
        if not template_name or template_name not in self.watermark_templates:
            messagebox.showinfo("提示", "请选择有效的模板")
            return

        # 应用模板设置
        settings = self.watermark_templates[template_name]
        self.apply_watermark_settings(settings)

        # 保存为上次使用的设置
        self.save_last_used_settings(settings)

        messagebox.showinfo("成功", f"已加载模板 '{template_name}'")

    def delete_selected_template(self):
        """删除选中的模板"""
        template_name = self.current_template.get()
        if not template_name or template_name not in self.watermark_templates:
            messagebox.showinfo("提示", "请选择有效的模板")
            return

        if messagebox.askyesno("确认", f"确定要删除模板 '{template_name}' 吗？"):
            try:
                # 删除模板文件
                template_path = os.path.join(self.template_dir, f"{template_name}.json")
                if os.path.exists(template_path):
                    os.remove(template_path)

                # 从模板字典中移除
                del self.watermark_templates[template_name]

                # 更新模板列表
                self.update_template_list()

                messagebox.showinfo("成功", f"模板 '{template_name}' 已删除")
            except Exception as e:
                messagebox.showerror("错误", f"删除模板失败: {str(e)}")

    def apply_watermark_settings(self, settings):
        """应用水印设置"""
        # 应用水印类型
        self.watermark_type.set(settings.get("watermark_type", "none"))

        # 应用文本水印设置
        self.watermark_text.set(settings.get("watermark_text", ""))
        self.watermark_font_family.set(settings.get("watermark_font_family", "SimHei"))
        self.watermark_font_size.set(settings.get("watermark_font_size", 24))
        self.watermark_font_bold.set(settings.get("watermark_font_bold", False))
        self.watermark_font_italic.set(settings.get("watermark_font_italic", False))
        self.watermark_text_color.set(settings.get("watermark_text_color", "#000000"))
        self.watermark_text_opacity.set(settings.get("watermark_text_opacity", 50))
        self.watermark_text_shadow.set(settings.get("watermark_text_shadow", True))

        # 应用图片水印设置
        img_path = settings.get("watermark_image_path", "")
        self.watermark_image_path.set(img_path)
        # 尝试加载图片
        if img_path and os.path.exists(img_path):
            try:
                with Image.open(img_path) as img:
                    self.watermark_image_obj = img.copy()
                    # 更新预览
                    preview = img.copy()
                    preview.thumbnail((100, 100))
                    preview_photo = ImageTk.PhotoImage(preview)
                    self.watermark_preview_label.config(image=preview_photo, text="")
                    self.watermark_preview_label.image = preview_photo
            except:
                pass

        self.watermark_image_scale.set(settings.get("watermark_image_scale", 50))
        self.watermark_image_opacity.set(settings.get("watermark_image_opacity", 50))

        # 应用布局设置
        self.watermark_position.set(settings.get("watermark_position", "bottom_right"))
        self.watermark_rotation.set(settings.get("watermark_rotation", 0))

        # 更新水印字段显示状态
        self.update_watermark_fields()

        # 重置水印位置（会根据预设位置重新计算）
        self.watermark_x.set(0)
        self.watermark_y.set(0)

        # 更新预览
        self.update_preview()

    def save_last_used_settings(self, settings):
        """保存上次使用的设置"""
        try:
            last_used_path = os.path.join(self.template_dir, "__last_used__.json")
            with open(last_used_path, 'w', encoding='utf-8') as f:
                json.dump(settings, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存上次使用的设置失败: {e}")


if __name__ == "__main__":
    # 检查是否已安装tkinterdnd2，如果已安装则使用其Tk类
    try:
        from tkinterdnd2 import Tk

        root = Tk()
    except ImportError:
        root = tk.Tk()
    app = ImageProcessorApp(root)
    root.mainloop()
