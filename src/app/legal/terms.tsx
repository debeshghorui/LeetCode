// Copy lives in src/lib/legal.ts so the screen and the store listing stay aligned.
import { LegalDocument } from "@/components/legal-document";
import { legalUpdated, termsSections } from "@/lib/legal";

export default function TermsScreen() {
    return (
        <LegalDocument
            title="Terms"
            updated={legalUpdated}
            sections={termsSections}
        />
    );
}
