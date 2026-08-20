import Prism from "prismjs";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";

import type { LanguageId } from "@/lib/problems";

const GRAMMAR: Record<LanguageId, keyof typeof Prism.languages> = {
    javascript: "javascript",
    java: "java",
    python: "python",
};

export function grammarForLanguage(language: LanguageId) {
    const name = GRAMMAR[language];
    return Prism.languages[name];
}
