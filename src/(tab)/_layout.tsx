import { useTabBarStyle } from '@/hooks/use-tab-bar-style'
import { colors } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
    const tabBarStyle = useTabBarStyle()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle,
                tabBarActiveTintColor: colors.lime,
                tabBarInactiveTintColor: '#a1a1aa',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                sceneStyle: { backgroundColor: colors.background },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="problems"
                options={{
                    title: 'Problems',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}