import type { RefObject } from "react";
import type WebView from "react-native-webview";

// Web → Native 메시지 타입
export type WebToNativeMessage =
  | { type: "READY" }
  | { type: "REQUEST_PUSH_TOKEN" };

// Native → Web 메시지 타입
export type NativeToWebMessage =
  | { type: "PUSH_TOKEN"; token: string; platform: "ios" | "android" }
  | { type: "NAVIGATE"; path: string };

/**
 * WebView에 JS 코드를 주입하여 메시지 전달
 */
export function sendToWeb(
  webViewRef: RefObject<WebView | null>,
  message: NativeToWebMessage
) {
  const js = `
    (function() {
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(JSON.stringify(message))}
      }));
    })();
    true;
  `;
  webViewRef.current?.injectJavaScript(js);
}

/**
 * WebView 로드 시 주입할 JS — window.__IS_NATIVE_APP 플래그 설정
 */
export const INJECTED_JAVASCRIPT = `
  (function() {
    window.__IS_NATIVE_APP = true;
  })();
  true;
`;

/**
 * Web → Native 메시지 파싱
 */
export function parseWebMessage(data: string): WebToNativeMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg && typeof msg.type === "string") {
      return msg as WebToNativeMessage;
    }
  } catch {
    // 무시 — WebView 내부 메시지일 수 있음
  }
  return null;
}
