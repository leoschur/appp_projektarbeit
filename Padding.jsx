import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Small component to ensure there is enough spacing at the top
 */
export default function Padding() {
    const insets = useSafeAreaInsets();

    return <View style={{ paddingTop: insets.top }} />
}