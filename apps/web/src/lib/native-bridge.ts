// Native → Web 메시지 타입
type NativeToWebMessage =
  | { type: "PUSH_TOKEN"; token: string; platform: "ios" | "android" }
  | { type: "NAVIGATE"; path: string };

// Web → Native 메시지 타입
type WebToNativeMessage =
  | { type: "READY" }
  | { type: "REQUEST_PUSH_TOKEN" };

/**
 * React Native WebView 내에서 실행 중인지 확인
 */
export function isNativeApp(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as Record<string, unknown>).__IS_NATIVE_APP
  );
}

/**
 * Native로 메시지 전송
 */
export function postToNative(message: WebToNativeMessage): void {
  const rn = (window as unknown as Record<string, unknown>)
    .ReactNativeWebView as
    | { postMessage: (msg: string) => void }
    | undefined;
  rn?.postMessage(JSON.stringify(message));
}

/**
 * Native에서 오는 메시지 리스너 등록
 * @returns cleanup 함수
 */
export function onNativeMessage(
  handler: (message: NativeToWebMessage) => void
): () => void {
  function listener(event: MessageEvent) {
    try {
      const data =
        typeof event.data === "string" ? event.data : String(event.data);
      const msg = JSON.parse(data) as NativeToWebMessage;
      if (msg && typeof msg.type === "string") {
        handler(msg);
      }
    } catch {
      // 무시 — 다른 소스의 메시지일 수 있음
    }
  }

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
