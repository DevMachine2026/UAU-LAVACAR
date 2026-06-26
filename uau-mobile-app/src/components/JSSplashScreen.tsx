import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, StyleSheet } from "react-native";

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
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShow(false));
    }
  }, [visible, opacity]);

  if (!show) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
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
    backgroundColor: "#009688",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 220,
    height: 220,
  },
});
