import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

interface Props {
  visible: boolean;
}

export function JSSplashScreen({ visible }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity, zIndex: 999 }]}
      pointerEvents="none"
    >
      <Image
        source={require("../../assets/splash.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}
