// Privacy and terms copy. The privacy screen promises that diagnostics exclude
// source code and that account deletion cascades. Keep this file in step with that.
export const legalUpdated = "10 October 2026";

export const privacySections = [
    {
        title: "Who we are",
        body: "MobLeet is an independent coding-practice app. It is not affiliated with LeetCode. The Android application id is com.debeshghorui.mobleet.",
    },
    {
        title: "Information we collect",
        body: "When you continue with Google or GitHub, we receive the email address, display name, and profile image those providers share, along with a user id. We store the code you submit, the language, the result, and which problems you have solved. A session token is stored on your device so you stay signed in. We also send crash and usage diagnostics that include your user id, problem id, language, result, and timing. Those diagnostics do not include your source code.",
    },
    {
        title: "How we use it",
        body: "We use this information to sign you in, show your profile, save submissions, show your progress, and keep the app reliable. MobLeet does not show ads and does not sell your information.",
    },
    {
        title: "Where it is stored",
        body: "Account and practice data are stored with Supabase. Sign-in is handled by Google or GitHub through Supabase Auth. Crash reports go to Sentry. Product usage events go to PostHog. We do not use your data for advertising.",
    },
    {
        title: "How long we keep it",
        body: "We keep your account and practice data until you delete your account. Deletion removes your user, profile, submissions, test results, and solved progress.",
    },
    {
        title: "Delete your account",
        body: "Open MobLeet, go to Profile, and tap Delete account. This is permanent. If you cannot open the app, use the account-deletion page linked from the Google Play listing.",
    },
    {
        title: "Children",
        body: "MobLeet is not directed at children under 13, and we do not knowingly collect their information.",
    },
    {
        title: "Contact",
        body: "Use the developer email address shown on the MobLeet listing in Google Play.",
    },
] as const;

export const termsSections = [
    {
        title: "The service",
        body: "MobLeet lets you practice coding problems and save your progress. It is provided as-is and may change or stop without notice.",
    },
    {
        title: "Your account",
        body: "You sign in with Google or GitHub. You are responsible for activity on your account. You can delete the account from Profile at any time.",
    },
    {
        title: "Acceptable use",
        body: "Do not misuse the service, attempt to break it, or submit code that attacks our systems or other people.",
    },
    {
        title: "Your code",
        body: "You keep ownership of the code you write. You give MobLeet permission to store and run that code so we can check it against the problem tests.",
    },
] as const;
