import { useHideTabBar } from '@/hooks/use-tab-bar-style'
import { colors } from '@/lib/theme'
import { Stack } from 'expo-router'

export default function ProblemIdLayout() {
    useHideTabBar()

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { flex: 1, backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        />
    )
}