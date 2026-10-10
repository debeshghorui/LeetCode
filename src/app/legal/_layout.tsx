import { Stack } from "expo-router";

export default function LegalLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0a0a0c" },
                animation: "slide_from_right",
            }}
        />
    );
}
