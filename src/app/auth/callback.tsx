import { useAuthStore } from '@/state/auth-store'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

export default function AuthCallbackScreen() {
    const router = useRouter()
    const handleDeepLink = useAuthStore((s) => s.handelDeepLink)
    const url = Linking.useLinkingURL()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!url) return

        async function finishAuth() {
            try {
                await handleDeepLink(url!)
                router.replace('/' as never)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign-in failed.')
            }
        }

        void finishAuth()
    }, [handleDeepLink, router, url])

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#0a0a0c',
            }}
        >
            {!error ? (
                <ActivityIndicator color="#bdf06e" />
            ) : (
                <Text style={{ color: '#fafafa' }}>{error}</Text>
            )}
        </View>
    )
}