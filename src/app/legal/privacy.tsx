// Copy lives in src/lib/legal.ts so the screen and the store listing stay aligned.
import { LegalDocument } from "@/components/legal-document";
import { legalUpdated, privacySections } from "@/lib/legal";

export default function PrivacyScreen() {
    return (
        <LegalDocument
            title="Privacy"
            updated={legalUpdated}
            sections={privacySections}
        />
    );
}
