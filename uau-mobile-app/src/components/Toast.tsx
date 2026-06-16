import { createContext, PropsWithChildren, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const BG: Record<ToastType, string> = {
  success: "#009688",
  error: "#C62828",
  info: "#37474F",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, t: ToastType = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    setType(t);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: insets.bottom + 24,
          left: 20,
          right: 20,
          opacity,
          zIndex: 9999,
        }}
      >
        <View
          style={{
            backgroundColor: BG[type],
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>{message}</Text>
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}
