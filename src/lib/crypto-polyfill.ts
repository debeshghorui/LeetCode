import * as ExpoCrypto from 'expo-crypto'
import 'react-native-get-random-values'

const existingCrypto = globalThis.crypto

if (!existingCrypto?.subtle?.digest) {
    Object.defineProperty(globalThis, 'crypto', {
        value: {
            ...existingCrypto,
            getRandomValues: existingCrypto.getRandomValues.bind(existingCrypto),
            subtle: {
                async digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
                    const digestAlgorithm =
                        algorithm === 'SHA-256'
                            ? ExpoCrypto.CryptoDigestAlgorithm.SHA256
                            : ExpoCrypto.CryptoDigestAlgorithm.SHA256

                    return ExpoCrypto.digest(digestAlgorithm, data)
                },
            },
        },
        configurable: true,
    })
}