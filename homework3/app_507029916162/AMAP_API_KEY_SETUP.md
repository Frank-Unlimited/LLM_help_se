# 高德地图 API Key 配置指南

## 问题：INVALID_USER_SCODE 错误

这个错误通常是因为 API Key 类型不匹配或配置不正确。

## 解决方案

### 对于 JavaScript API（地图显示和步行路线规划）

我们使用的是高德地图的 **JavaScript API（Web端）**，需要使用以下配置：

1. **创建/选择正确的 Key 类型**
   - 访问：https://console.amap.com/dev/key/app
   - 选择或创建 **"Web端(JS API)"** 类型的 Key
   - **不要使用 "Web服务" 类型的 Key**

2. **配置域名白名单**
   - 在 Key 的"安全设置"中
   - 添加以下域名到白名单：
     - `localhost`
     - `127.0.0.1`
     - 您的实际域名（如：`example.com`）
   - 也可以临时添加 `*` 允许所有域名（仅用于测试）

3. **启用服务**
   - 确保启用了 "JavaScript API" 服务
   - 确保启用了 "路径规划" 相关服务（如果使用步行导航）

4. **配置 Key**
   - 将 Key 填入 `index.html` 中的 `window.config.amapApiKey`

### 检查清单

- [ ] Key 类型是 "Web端(JS API)"
- [ ] 域名白名单已配置（包含 localhost 或您的域名）
- [ ] JavaScript API 服务已启用
- [ ] 路径规划服务已启用
- [ ] Key 已在 index.html 中正确配置

## 常见错误类型

- **INVALID_USER_SCODE**: Key 类型错误或安全设置问题（通常是使用 Web服务 Key 而非 Web端 Key）
- **INVALID_USER_KEY**: Key 不存在或已过期
- **INVALID_PARAMS**: 参数格式错误
- **DAILY_QUERY_OVER_LIMIT**: API 调用次数超限

## 测试步骤

1. 检查控制台是否有 API Key 相关的错误
2. 确认 Key 类型正确（Web端 JS API）
3. 检查域名是否在白名单中
4. 刷新页面重试


