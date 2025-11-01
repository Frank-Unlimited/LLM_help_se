declare module '../../../app/webaudiospeechrecognizer.js' {
  export default class WebAudioSpeechRecognizer {
    constructor(params?: any, isLog?: boolean);
    start(): void;
    stop(): void;
    destroyStream(): void;
    OnRecognitionStart?: (res: any) => void;
    OnSentenceBegin?: (res: any) => void;
    OnRecognitionResultChange?: (res: any) => void;
    OnSentenceEnd?: (res: any) => void;
    OnRecognitionComplete?: (res: any) => void;
    OnError?: (err: any) => void;
    OnRecorderStop?: (res: any) => void;
  }
}


