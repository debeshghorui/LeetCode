// Sign-in stack. The root layout sends signed-out users here.
import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0a0a0c" },
                animation: "fade",
            }}
        />
    );
}
