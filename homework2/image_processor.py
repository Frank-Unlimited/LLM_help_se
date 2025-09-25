import os
import tkinter as tk
from tkinter import filedialog, ttk, messagebox
from PIL import Image, ImageTk
import glob
import sys


class ImageProcessorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("图片处理器")
        self.root.geometry("900x600")
        self.root.minsize(800, 500)

        # 确保中文显示正常
        self.style = ttk.Style()
        self.style.configure("TLabel", font=("SimHei", 10))
        self.style.configure("TButton", font=("SimHei", 10))
        self.style.configure("TCheckbutton", font=("SimHei", 10))
        self.style.configure("TRadiobutton", font=("SimHei", 10))

        # 存储导入的图片信息
        self.images = []  # 格式: [(原图路径, 缩略图对象, 文件名, 图片副本), ...]

        # 导出设置
        self.output_dir = ""
        self.naming_option = tk.StringVar(value="original")  # original, prefix, suffix
        self.custom_text = tk.StringVar(value="")
        self.output_format = tk.StringVar(value="png")

        # 创建界面
        self.create_widgets()

        # 尝试启用拖放功能
        self.enable_drag_and_drop()

    def create_widgets(self):
        # 创建主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 左侧控制区
        control_frame = ttk.LabelFrame(main_frame, text="操作", padding="10")
        control_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

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
        ttk.Radiobutton(format_frame, text="JPEG", variable=self.output_format, value="jpeg").pack(side=tk.LEFT)
        ttk.Radiobutton(format_frame, text="PNG", variable=self.output_format, value="png").pack(side=tk.LEFT, padx=10)

        ttk.Button(control_frame, text="导出选中图片", command=self.export_selected).pack(fill=tk.X, pady=(0, 5))
        ttk.Button(control_frame, text="导出所有图片", command=self.export_all).pack(fill=tk.X, pady=(0, 5))

        # 右侧图片列表区
        image_frame = ttk.LabelFrame(main_frame, text="已导入图片", padding="10")
        image_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

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

    def enable_drag_and_drop(self):
        """使用更兼容的方式实现拖放功能"""
        try:
            # 尝试使用tkinterdnd2库（更可靠的拖放实现）
            from tkinterdnd2 import DND_FILES, TkinterDnD
            # 将根窗口转换为支持拖放的窗口
            self.root = TkinterDnD(self.root)
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

            # 提示用户可能需要安装tkinterdnd2以获得更好的拖放体验
            messagebox.showinfo(
                "提示",
                "检测到系统拖放支持有限，拖放功能可能不稳定。\n"
                "建议安装tkinterdnd2以获得更好体验：pip install tkinterdnd2"
            )
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
        # 这种方式在某些环境下可能无法获取文件路径
        # 作为最后的备选方案
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
            messagebox.showinfo("成功", f"成功导入 {len(new_images)} 张图片")

    def update_image_list(self):
        # 清空现有内容
        for widget in self.images_container.winfo_children():
            widget.destroy()

        # 显示所有图片
        cols = 4  # 每行显示4张图片
        for i, (path, photo, file_name, img) in enumerate(self.images):
            frame = ttk.Frame(self.images_container, padding="5")

            # 复选框
            var = tk.BooleanVar(value=True)
            chk = ttk.Checkbutton(frame, variable=var)
            chk.var = var
            chk.pack(anchor=tk.NW)

            # 缩略图
            label_img = ttk.Label(frame, image=photo)
            label_img.image = photo  # 保持引用（避免被垃圾回收）
            label_img.pack(pady=(0, 5))

            # 文件名（显示部分，过长截断）
            display_name = file_name if len(file_name) <= 15 else file_name[:12] + "..."
            label_name = ttk.Label(frame, text=display_name, wraplength=120)
            label_name.pack()

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
                            # 保存图片（处理格式差异）
                            if self.output_format.get().lower() == "jpeg":
                                # JPEG不支持透明通道，转换为RGB（背景白色）
                                if img.mode in ('RGBA', 'LA'):
                                    background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                                    background.paste(img, img.split()[-1])  # 用透明通道作为蒙版
                                    img = background
                                img.save(output_path, "JPEG", quality=95)
                            else:  # PNG（保留透明通道）
                                img.save(output_path, "PNG")
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


if __name__ == "__main__":
    root = tk.Tk()
    app = ImageProcessorApp(root)
    root.mainloop()
