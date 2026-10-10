import * as ExpoCrypto from "expo-crypto";
import "react-native-get-random-values";

type DigestAlgorithm = string | { name: string };

const subtle = {
    async digest(
        algorithm: DigestAlgorithm,
        data: ArrayBuffer | ArrayBufferView,
    ): Promise<ArrayBuffer> {
        const name = typeof algorithm === "string" ? algorithm : algorithm.name;
        const bytes =
            data instanceof ArrayBuffer
                ? new Uint8Array(data)
                : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

        return ExpoCrypto.digest(
            name === "SHA-256"
                ? ExpoCrypto.CryptoDigestAlgorithm.SHA256
                : ExpoCrypto.CryptoDigestAlgorithm.SHA256,
            bytes,
        );
    },
};

// Hermes ships a crypto object that cannot be replaced. Attach subtle when
// possible, and never throw — a throw here closes the app before the first screen.
function installCryptoSubtle() {
    const current = globalThis.crypto;

    if (current?.subtle?.digest) {
        return;
    }

    if (current) {
        try {
            Object.defineProperty(current, "subtle", {
                value: subtle,
                configurable: true,
            });
            return;
        } catch {
            // The native crypto object rejected a new property.
        }
    }

    const getRandomValues = current?.getRandomValues
        ? current.getRandomValues.bind(current)
        : ExpoCrypto.getRandomValues;
    const randomUUID = current?.randomUUID
        ? current.randomUUID.bind(current)
        : ExpoCrypto.randomUUID;

    try {
        Object.defineProperty(globalThis, "crypto", {
            value: {
                getRandomValues,
                randomUUID,
                subtle,
            },
            configurable: true,
        });
    } catch (error) {
        console.error(error);
    }
}

installCryptoSubtle();
