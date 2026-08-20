import type { LanguageId } from "@/lib/problems";
import { grammarForLanguage } from "@/lib/prism-languages";
import type { Token, TokenStream } from "prismjs";
import Prism from "prismjs";
import { useMemo, type ReactNode } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextStyle,
} from "react-native";

const COLORS: Record<string, string> = {
    plain: "#f4f4f5",
    comment: "#86c47a",
    prolog: "#86c47a",
    doctype: "#86c47a",
    cdata: "#86c47a",
    punctuation: "#d4d4d8",
    namespace: "#f4878a",
    property: "#f0c674",
    tag: "#f4878a",
    boolean: "#e5a060",
    number: "#e5a060",
    constant: "#6ad0e0",
    symbol: "#6ad0e0",
    deleted: "#f4878a",
    selector: "#a6d98c",
    "attr-name": "#e5a060",
    string: "#a6d98c",
    char: "#a6d98c",
    builtin: "#f0c674",
    inserted: "#a6d98c",
    operator: "#6ad0e0",
    entity: "#f0c674",
    url: "#a6d98c",
    variable: "#f4878a",
    atrule: "#d69ff0",
    "attr-value": "#a6d98c",
    function: "#7cc4f5",
    "class-name": "#f0c674",
    regex: "#a6d98c",
    important: "#d69ff0",
    keyword: "#d69ff0",
};

const H_PAD = 12;
const V_PAD = 12;
const mono = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "Courier",
});

function renderItem(
    item: string | Token,
    key: string,
    textStyle: TextStyle,
): ReactNode {
    if (typeof item === "string") {
        return (
            <Text key={key} style={[textStyle, { color: COLORS.plain }]}>
                {item}
            </Text>
        );
    }
    const color = COLORS[item.type] ?? COLORS.plain;
    const content = item.content;
    if (typeof content === "string") {
        return (
            <Text key={key} style={[textStyle, { color }]}>
                {content}
            </Text>
        );
    }
    return (
        <Text key={key} style={[textStyle, { color }]}>
            {renderStream(content, `${key}-c`, textStyle)}
        </Text>
    );
}

function renderStream(
    stream: TokenStream,
    path: string,
    textStyle: TextStyle,
): ReactNode[] {
    if (typeof stream === "string")
        return [renderItem(stream, path, textStyle)];
    if (Array.isArray(stream)) {
        return stream.map((item, i) =>
            renderItem(item, `${path}-${i}`, textStyle),
        );
    }
    return [renderItem(stream, path, textStyle)];
}

export function CodeEditor({
    value,
    onValueChange,
    language,
    minHeight = 280,
    placeholder = "// Write your solution here",
}: {
    value: string;
    onValueChange: (text: string) => void;
    language: LanguageId;
    minHeight?: number;
    placeholder?: string;
}) {
    const textStyle = useMemo<TextStyle>(
        () => ({
            fontFamily: mono as string,
            fontSize: 14,
            lineHeight: 22,
            color: COLORS.plain,
            ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
        }),
        [],
    );

    const highlighted = useMemo(() => {
        if (!value) return null;
        const grammar = grammarForLanguage(language);
        if (!grammar) {
            return (
                <Text style={[textStyle, { color: COLORS.plain }]}>
                    {value}
                </Text>
            );
        }
        return renderStream(
            Prism.tokenize(value, grammar) as TokenStream,
            "t",
            textStyle,
        );
    }, [value, language, textStyle]);

    return (
        <View style={{ position: "relative", width: "100%" }}>
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { paddingHorizontal: H_PAD, paddingVertical: V_PAD },
                ]}
                pointerEvents="none"
            >
                <Text style={textStyle} selectable={false}>
                    {highlighted}
                </Text>
            </View>

            <TextInput
                value={value}
                onChangeText={onValueChange}
                multiline
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                scrollEnabled={false}
                placeholder={placeholder}
                placeholderTextColor="#71717a"
                underlineColorAndroid="transparent"
                selectionColor="rgba(189, 240, 110, 0.45)"
                {...(Platform.OS === "android"
                    ? { cursorColor: "#f4f4f5" as const }
                    : {})}
                style={[
                    textStyle,
                    {
                        position: "relative",
                        zIndex: 1,
                        minHeight,
                        paddingHorizontal: H_PAD,
                        paddingVertical: V_PAD,
                        textAlignVertical: "top",
                        // Android: use alpha-0, not `transparent`, or highlight washes out.
                        color: "rgba(255,255,255,0)",
                        backgroundColor: "transparent",
                    },
                ]}
            />
        </View>
    );
}
