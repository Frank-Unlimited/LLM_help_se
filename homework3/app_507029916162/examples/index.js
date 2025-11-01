let webAudioSpeechRecognizer; // 全局保存语音识别器实例
let isCanStop; // 标记是否允许手动停止（在一句话开始后才允许）
$(function () { // jQuery DOM 就绪回调，页面加载完成后执行
  const params = { // 初始化识别参数对象
    signCallback: signCallback, // 鉴权函数，生成请求签名
    // 用户参数
    secretid:  config.secretId, // 从全局 config 读取 SecretId
    secretkey: config.secretKey, // 从全局 config 读取 SecretKey
    appid: config.appId, // 从全局 config 读取 AppId
    // 临时密钥参数，非必填
    // token: config.token, // 若使用临时密钥，这里放置 token
    // 实时识别接口参数
    engine_model_type : '16k_zh', // 选择 16k 中文引擎，匹配内置录音 16k 采样率
    // 以下为非必填参数，可根据业务自行修改
    // voice_format : 1, // 音频编码格式
    // hotword_id : '08003a00000000000000000000000000', // 热词 ID
    // needvad: 1, // 是否启用 VAD 静音检测
    // filter_dirty: 1, // 脏词过滤
    // filter_modal: 2, // 方言、口音等过滤等级
    // filter_punc: 0, // 标点过滤选项
    // convert_num_mode : 1, // 数字转写模式
    // word_info: 2 // 返回词级信息
  } // 参数对象结束
  $('#start').on('click', function () { // 绑定“开始”按钮点击事件
    webAudioSpeechRecognizer = new WebAudioSpeechRecognizer(params); // 创建识别器实例
    const areaDom = $('#recognizeText'); // 获取展示识别结果的 DOM
    areaDom.text(''); // 清空展示区文本
    let resultText = ''; // 会话内累计的最终文本
    $(this).hide(); // 隐藏“开始”按钮
    $('#connecting').show(); // 显示“连接中”提示
    // 开始识别
    webAudioSpeechRecognizer.OnRecognitionStart = (res) => { // 识别建立成功回调（会话开始）
      console.log('开始识别', res); // 打印会话开始信息
    }; // 回调注册结束
    // 一句话开始
    webAudioSpeechRecognizer.OnSentenceBegin = (res) => { // 检测到一句话开始
      console.log('一句话开始', res); // 打印该句开始信息
      isCanStop = true; // 标记可停止
      $('#end').show(); // 显示“结束”按钮
      $('#recognizing').show(); // 显示“识别中”标识
      $('#connecting').hide(); // 隐藏“连接中”提示
    }; // 句子开始回调结束
    // 识别变化时
    webAudioSpeechRecognizer.OnRecognitionResultChange = (res) => { // 中间结果流式变化回调
      console.log('识别变化时', res); // 打印中间结果
      const currentText = `${resultText}${res.result.voice_text_str}`; // 累计文本 + 当前增量
      areaDom.text(currentText); // 实时更新展示区
    }; // 中间结果回调结束
    // 一句话结束
    webAudioSpeechRecognizer.OnSentenceEnd = (res) => { // 一句话最终结果回调
      console.log('一句话结束', res); // 打印该句结束信息
      resultText += res.result.voice_text_str; // 将该句最终文本追加到累计文本
      areaDom.text(resultText); // 用稳定的累计文本覆盖展示区
    }; // 句子结束回调结束
    // 识别结束
    webAudioSpeechRecognizer.OnRecognitionComplete = (res) => { // 整个识别会话结束
      console.log('识别结束', res); // 打印会话结束信息
    }; // 会话结束回调结束
    // 识别错误
    webAudioSpeechRecognizer.OnError = (res) => { // 识别发生错误
      console.log('识别失败', res) // 打印错误信息
      $('#end').hide(); // 隐藏“结束”按钮
      $('#recognizing').hide(); // 隐藏“识别中”标识
      $('#start').show(); // 显示“开始”按钮
      $('#connecting').hide(); // 隐藏“连接中”提示
    }; // 错误回调结束
    webAudioSpeechRecognizer.start(); // 启动识别流程
  }); // “开始”按钮事件绑定结束
  $('#end').on('click', function () { // 绑定“结束”按钮点击事件
    $(this).hide(); // 隐藏“结束”按钮
    $('#recognizing').hide(); // 隐藏“识别中”标识
    $('#start').show(); // 显示“开始”按钮
    if (isCanStop) { // 仅在允许停止时调用 stop，避免早停异常
      webAudioSpeechRecognizer.stop(); // 请求停止识别
    } // if 结束
  }); // “结束”按钮事件绑定结束
}); // DOM 就绪回调结束
