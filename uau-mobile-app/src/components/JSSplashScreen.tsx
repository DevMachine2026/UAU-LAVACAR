import { useEffect, useRef, useState } from "react";
import { Animated, Image, Modal, StyleSheet } from "react-native";

interface Props {
  visible: boolean;
  onCoveringScreen?: () => void;
}

export function JSSplashScreen({ visible, onCoveringScreen }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(true);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible, opacity]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onShow={onCoveringScreen}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <Image
          source={require("../../assets/splash.png")}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </Animated.View>
    </Modal>
  );
}
