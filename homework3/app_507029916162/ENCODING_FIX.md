# UTF-8 编码问题解决方案

## 问题描述
如果前端显示中文乱码，可能是文件编码问题。Windows 系统上，文件可能被保存为 GBK/GB2312 编码，但构建工具期望 UTF-8。

## 解决方案

### 方法 1: 在 VS Code 中设置文件编码
1. 打开 VS Code
2. 按 `Ctrl+,` 打开设置
3. 搜索 `files.encoding`
4. 设置为 `utf8`
5. 打开有乱码的文件（如 `src/pages/p-navigation/index.tsx`）
6. 点击右下角的编码显示（可能显示 'GBK' 或 'UTF-8'）
7. 选择 "通过编码保存" -> "UTF-8"
8. 保存文件

### 方法 2: 批量转换文件编码（VS Code）
1. 在 VS Code 中打开命令面板 (`Ctrl+Shift+P`)
2. 输入 "Change File Encoding"
3. 选择 "Save with Encoding"
4. 选择 "UTF-8"

### 方法 3: 使用 VS Code 的编码检测
1. 打开文件
2. 查看右下角状态栏的编码信息
3. 如果显示非 UTF-8，点击它
4. 选择 "Reopen with Encoding" -> "UTF-8"
5. 然后 "Save with Encoding" -> "UTF-8"

## 已修复的配置

? **vite.config.ts** - 已添加 UTF-8 编码配置
```typescript
esbuild: {
  charset: 'utf8',
},
build: {
  charset: 'utf8',
},
```

? **index.html** - 已设置 UTF-8 charset
```html
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
```

## 验证修复

修复后，请：
1. 重启开发服务器 (`npm run dev`)
2. 清除浏览器缓存 (`Ctrl+Shift+Delete`)
3. 刷新页面 (`F5` 或 `Ctrl+R`)

如果仍有问题，检查：
- 浏览器开发者工具 -> Network -> 查看 Response Headers 中的 `Content-Type` 是否包含 `charset=utf-8`
- 检查构建输出文件是否包含正确的中文字符

## 预防措施

建议在 `.vscode/settings.json` 中添加：
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false
}
```

这样可以确保所有新文件都使用 UTF-8 编码保存。
