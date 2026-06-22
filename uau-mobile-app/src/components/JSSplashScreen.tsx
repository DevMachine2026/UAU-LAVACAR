import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("screen");

interface Props {
  visible: boolean;
}

export function JSSplashScreen({ visible }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShow(false));
    }
  }, [visible, opacity]);

  if (!show) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={require("../../assets/bg.png")}
        style={styles.background}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <Image
        source={require("../../assets/adaptive-icon-original.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 99999,
    elevation: 99999,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "rgba(0, 150, 136, 0.45)",
  },
  logo: {
    position: "absolute",
    width: 220,
    height: 220,
    top: height / 2 - 110,
    left: width / 2 - 110,
  },
});
