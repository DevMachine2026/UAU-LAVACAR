import { PropsWithChildren } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

type FadeInViewProps = PropsWithChildren<{
  delay?: number;
  index?: number;
}>;

export function FadeInView({ children, index = 0 }: FadeInViewProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300).springify()}>
      {children}
    </Animated.View>
  );
}
