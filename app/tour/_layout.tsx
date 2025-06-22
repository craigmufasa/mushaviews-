import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

export default function TourLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: false
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}