import type { ConfigContext, ExpoConfig } from "@expo/config";
import { env } from "./env";

const IS_DEV = env.APP_VARIANT === "development";
const IS_PREVIEW = env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return "com.debeshghorui.LeetCode.dev";
    }
    if (IS_PREVIEW) {
        return "com.debeshghorui.LeetCode.preview";
    }
    return "com.debeshghorui.LeetCode";
};

const getAppName = () => {
    if (IS_DEV) {
        return "LeetCode (Dev)";
    }
    if (IS_PREVIEW) {
        return "LeetCode (Preview)";
    }
    return "LeetCode";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: "LeetCode",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "leetcode",
    userInterfaceStyle: "automatic",
    ios: {
        ...config.ios,
        icon: "./assets/expo.icon",
        bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
        ...config.android,
        adaptiveIcon: {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
        },
        predictiveBackGestureEnabled: false,
        package: getUniqueIdentifier(),
    },
    web: {
        ...config.web,
        output: "static",
        favicon: "./assets/images/favicon.png",
    },
    plugins: [
        "expo-router",
        [
            "expo-web-browser",
            {
                experimentalLauncherActivity: false,
            },
        ],
        [
            "expo-splash-screen",
            {
                backgroundColor: "#208AEF",
                image: "./assets/images/splash-icon.png",
                imageWidth: 76,
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
    extra: {
        ...config.extra,
        router: {},
        eas: {
            projectId: "7c586b8a-b9d1-4203-afd6-267f00bb1af3",
        },
    },
});
