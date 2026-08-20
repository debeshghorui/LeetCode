import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useScreenInsets(options: {
    bottomExtra?: number
    topExtra?: number
    includeBottomInset?: boolean
} = {}) {
    const { bottomExtra = 24, topExtra = 8, includeBottomInset = false } = options
    const insets = useSafeAreaInsets()

    return useMemo(
        () => ({
            contentPadding: {
                paddingTop: topExtra,
                paddingBottom: bottomExtra + (includeBottomInset ? insets.bottom : 0),
                paddingHorizontal: 20,
            },
            sheetPaddingBottom: Math.max(insets.bottom, 12) + 20,
        }),
        [bottomExtra, includeBottomInset, insets.bottom, topExtra]
    )
}