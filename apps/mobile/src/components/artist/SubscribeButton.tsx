import { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { colors } from "@/theme/colors";

interface SubscribeButtonProps {
  artistId: string;
}

export function SubscribeButton({ artistId }: SubscribeButtonProps) {
  const { user, login } = useAuth();
  const { isSubscribed, subscribe, unsubscribe } = useSubscriptions();
  const [toggling, setToggling] = useState(false);

  const subscribed = isSubscribed(artistId);

  const handlePress = async () => {
    if (!user) {
      await login();
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      if (subscribed) {
        await unsubscribe(artistId);
      } else {
        await subscribe(artistId);
      }
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  return (
    <Pressable
      style={[styles.button, subscribed ? styles.subscribed : styles.notSubscribed]}
      onPress={handlePress}
      disabled={toggling}
    >
      <Text style={[styles.text, subscribed ? styles.subscribedText : styles.notSubscribedText]}>
        {toggling ? "..." : subscribed ? "구독 중" : user ? "구독하기" : "로그인하고 구독하기"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  subscribed: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  notSubscribed: {
    backgroundColor: colors.black,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  subscribedText: {
    color: colors.gray[500],
  },
  notSubscribedText: {
    color: colors.white,
  },
});
