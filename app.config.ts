import type { ConfigContext, ExpoConfig } from "@expo/config";

type AppVariant = "development" | "preview" | "production";

const resolveAppVariant = (): AppVariant => {
    const variant = process.env.APP_VARIANT;

    if (variant === "preview") {
        return "preview";
    }

    if (variant === "production") {
        return "production";
    }

    return "development";
};

const APP_VARIANT = resolveAppVariant();
const IS_DEV = APP_VARIANT === "development";
const IS_PREVIEW = APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return "com.debeshghorui.mobleet.dev";
    }
    if (IS_PREVIEW) {
        return "com.debeshghorui.mobleet.preview";
    }
    return "com.debeshghorui.mobleet";
};

const getAppName = () => {
    if (IS_DEV) {
        return "MobLeet (Dev)";
    }
    if (IS_PREVIEW) {
        return "MobLeet (Preview)";
    }
    return "MobLeet";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: "LeetCode",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobleet",
    userInterfaceStyle: "automatic",
    ios: {
        ...config.ios,
        icon: "./assets/expo.icon",
        bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
        ...config.android,
        adaptiveIcon: {
            backgroundColor: "#0a0a0c",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
        },
        predictiveBackGestureEnabled: false,
        package: getUniqueIdentifier(),
        blockedPermissions: [
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.READ_CONTACTS",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "com.google.android.gms.permission.AD_ID",
        ],
    },
    web: {
        ...config.web,
        output: "static",
        favicon: "./assets/images/favicon.png",
    },
    updates: {
        url: "https://u.expo.dev/7c586b8a-b9d1-4203-afd6-267f00bb1af3",
    },
    runtimeVersion: {
        policy: "appVersion",
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
                backgroundColor: "#0a0a0c",
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
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
