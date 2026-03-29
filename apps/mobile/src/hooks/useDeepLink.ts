import { useEffect, useState } from "react";
import * as Linking from "expo-linking";

/**
 * backstage:// 딥링크를 수신하여 WebView에 전달할 경로를 반환
 */
export function useDeepLink() {
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    // 앱이 이미 실행 중일 때 딥링크 수신
    const subscription = Linking.addEventListener("url", (event) => {
      const path = extractPath(event.url);
      if (path) {
        setPendingPath(path);
      }
    });

    // Cold start — 딥링크로 앱이 시작된 경우
    Linking.getInitialURL().then((url) => {
      if (url) {
        const path = extractPath(url);
        if (path) {
          setPendingPath(path);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  function consumePendingPath() {
    setPendingPath(null);
  }

  return { pendingPath, consumePendingPath };
}

/**
 * backstage://concerts/abc → /concerts/abc
 */
function extractPath(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    if (parsed.path) {
      return `/${parsed.path}`;
    }
  } catch {
    // 무시
  }
  return null;
}
