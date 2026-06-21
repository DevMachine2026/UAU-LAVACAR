import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet } from "react-native";

interface Props {
  visible: boolean;
  onCoveringScreen?: () => void;
}

export function JSSplashScreen({ visible, onCoveringScreen }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [show, setShow] = useState(true);

  useEffect(() => { onCoveringScreen?.(); }, []);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => setShow(false));
    }
  }, [visible, opacity]);

  if (!show) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, zIndex: 9999, elevation: 9999 }]}>
      <Image
        source={require("../../assets/splash.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </Animated.View>
  );
}
