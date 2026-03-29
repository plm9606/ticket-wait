import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { SafeAreaView } from "react-native-safe-area-context";

import { WEB_URL, ALLOWED_HOSTS } from "../lib/constants";
import {
  INJECTED_JAVASCRIPT,
  parseWebMessage,
  sendToWeb,
  type WebToNativeMessage,
} from "../lib/bridge";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useDeepLink } from "../hooks/useDeepLink";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";

// 스플래시 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {
    requestToken,
    pendingNotificationUrl,
    consumePendingUrl,
  } = usePushNotifications();
  const { pendingPath, consumePendingPath } = useDeepLink();

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [canGoBack]);

  // WebView READY 후 pending 딥링크/알림 URL 처리
  useEffect(() => {
    if (!isReady) return;

    // 푸시 알림 탭에서 온 URL
    if (pendingNotificationUrl) {
      sendToWeb(webViewRef, { type: "NAVIGATE", path: pendingNotificationUrl });
      consumePendingUrl();
    }
    // 딥링크에서 온 경로
    else if (pendingPath) {
      sendToWeb(webViewRef, { type: "NAVIGATE", path: pendingPath });
      consumePendingPath();
    }

    // 스플래시 숨기기
    SplashScreen.hideAsync();
  }, [isReady, pendingNotificationUrl, pendingPath, consumePendingUrl, consumePendingPath]);

  // 이미 ready 상태에서 새로운 알림 탭이나 딥링크가 들어올 때
  useEffect(() => {
    if (!isReady) return;

    if (pendingNotificationUrl) {
      sendToWeb(webViewRef, { type: "NAVIGATE", path: pendingNotificationUrl });
      consumePendingUrl();
    }
  }, [isReady, pendingNotificationUrl, consumePendingUrl]);

  useEffect(() => {
    if (!isReady) return;

    if (pendingPath) {
      sendToWeb(webViewRef, { type: "NAVIGATE", path: pendingPath });
      consumePendingPath();
    }
  }, [isReady, pendingPath, consumePendingPath]);

  // Web → Native 메시지 핸들러
  const handleMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      const msg = parseWebMessage(event.nativeEvent.data);
      if (!msg) return;

      switch (msg.type) {
        case "READY":
          setIsReady(true);
          break;

        case "REQUEST_PUSH_TOKEN": {
          const token = await requestToken();
          if (token) {
            sendToWeb(webViewRef, {
              type: "PUSH_TOKEN",
              token,
              platform: Platform.OS as "ios" | "android",
            });
          }
          break;
        }
      }
    },
    [requestToken]
  );

  // URL 필터링 — 허용된 호스트만 WebView 내에서 열기
  const handleShouldStartLoad = useCallback(
    (event: WebViewNavigation) => {
      try {
        const url = new URL(event.url);
        const isAllowed = ALLOWED_HOSTS.some(
          (host) => url.host === host || url.host.endsWith(`.${host}`)
        );

        if (!isAllowed) {
          Linking.openURL(event.url);
          return false;
        }
      } catch {
        // 유효하지 않은 URL은 무시
      }
      return true;
    },
    []
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack);
    },
    []
  );

  const handleError = useCallback((_event: WebViewErrorEvent) => {
    setHasError(true);
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    // 서버 에러(5xx)만 에러 화면 표시
    if (event.nativeEvent.statusCode >= 500) {
      setHasError(true);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    webViewRef.current?.reload();
  }, []);

  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>연결할 수 없습니다</Text>
          <Text style={styles.errorMessage}>
            네트워크 연결을 확인하고 다시 시도해주세요
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>재시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        // 쿠키 설정
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        // JS 주입
        injectedJavaScript={INJECTED_JAVASCRIPT}
        javaScriptEnabled={true}
        // 메시지 핸들링
        onMessage={handleMessage}
        // URL 필터링
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onNavigationStateChange={handleNavigationStateChange}
        // 에러 처리
        onError={handleError}
        onHttpError={handleHttpError}
        // 기타 설정
        allowsBackForwardNavigationGestures={true}
        startInLoadingState={true}
        domStorageEnabled={true}
        // iOS safe area 지원
        contentMode="mobile"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#000000",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
});
