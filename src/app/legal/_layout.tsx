// Open without a session so a store listing can link privacy and terms.
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
