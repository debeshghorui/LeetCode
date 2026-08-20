import { toDateKey } from "@/lib/problems";
import { colors } from "@/lib/theme";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const CELL = 12;
const GAP = 3;
const WEEKS = 53;
const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];
const LEVELS = [
    "rgba(255,255,255,0.06)",
    "rgba(189, 240, 110, 0.22)",
    "rgba(189, 240, 110, 0.45)",
    "rgba(189, 240, 110, 0.7)",
    colors.lime,
];

type DayCell = {
    key: string;
    date: Date;
    count: number;
    level: number;
    inRange: boolean;
};

function addDays(date: Date, amount: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function levelForCount(count: number) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
}

function buildWeeks(activity: Map<string, number>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = addDays(today, -(WEEKS * 7 - 1));
    const gridStart = addDays(rangeStart, -rangeStart.getDay());
    const weeks: DayCell[][] = [];

    for (let w = 0; w < WEEKS; w++) {
        const column: DayCell[] = [];
        for (let d = 0; d < 7; d++) {
            const date = addDays(gridStart, w * 7 + d);
            const key = toDateKey(date);
            const inRange = date >= rangeStart && date <= today;
            const count = inRange ? (activity.get(key) ?? 0) : 0;
            column.push({
                key,
                date,
                count,
                level: levelForCount(count),
                inRange,
            });
        }
        weeks.push(column);
    }
    return weeks;
}

export function ActivityHeatmap({
    activity,
    loading,
}: {
    activity: Map<string, number>;
    loading?: boolean;
}) {
    const [selected, setSelected] = useState<DayCell | null>(null);
    const weeks = useMemo(() => buildWeeks(activity), [activity]);

    const months = useMemo(() => {
        const markers: { weekIndex: number; label: string }[] = [];
        let last = -1;
        weeks.forEach((week, weekIndex) => {
            const day = week.find((d) => d.inRange) ?? week[0];
            const month = day.date.getMonth();
            if (month !== last) {
                markers.push({ weekIndex, label: MONTHS[month] });
                last = month;
            }
        });
        return markers;
    }, [weeks]);

    let total = 0;
    activity.forEach((n) => {
        total += n;
    });

    const summary = selected
        ? `${selected.count} on ${selected.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
        : `${total} submissions in the last year`;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Activity</Text>
                <Text style={styles.subtitle}>
                    {loading ? "Loading…" : `${activity.size} active days`}
                </Text>
            </View>
            <Text style={styles.summary}>{summary}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={styles.monthRow}>
                        {months.map((m) => (
                            <Text
                                key={`${m.label}-${m.weekIndex}`}
                                style={[
                                    styles.monthLabel,
                                    { left: m.weekIndex * (CELL + GAP) },
                                ]}
                            >
                                {m.label}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.gridRow}>
                        <View style={styles.dayLabels}>
                            {["", "Mon", "", "Wed", "", "Fri", ""].map(
                                (label, i) => (
                                    <Text key={i} style={styles.dayLabel}>
                                        {label}
                                    </Text>
                                ),
                            )}
                        </View>
                        <View style={styles.weeks}>
                            {weeks.map((week, wi) => (
                                <View key={wi} style={styles.week}>
                                    {week.map((day) => (
                                        <Pressable
                                            key={day.key}
                                            disabled={!day.inRange}
                                            onPress={() => setSelected(day)}
                                            style={[
                                                styles.cell,
                                                {
                                                    backgroundColor: day.inRange
                                                        ? LEVELS[day.level]
                                                        : "transparent",
                                                    opacity: day.inRange
                                                        ? 1
                                                        : 0,
                                                },
                                                selected?.key === day.key &&
                                                    styles.cellSelected,
                                            ]}
                                        />
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                {LEVELS.map((color, i) => (
                    <View
                        key={i}
                        style={[styles.legendCell, { backgroundColor: color }]}
                    />
                ))}
                <Text style={styles.legendText}>More</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 20,
        borderRadius: 24,
        padding: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    title: { color: colors.foreground, fontSize: 16, fontWeight: "700" },
    subtitle: { color: colors.muted, fontSize: 12 },
    summary: { color: colors.muted, fontSize: 13, marginBottom: 14 },
    monthRow: {
        height: 16,
        marginLeft: 28,
        marginBottom: 6,
        position: "relative",
    },
    monthLabel: {
        position: "absolute",
        color: colors.mutedDark,
        fontSize: 10,
        fontWeight: "600",
    },
    gridRow: { flexDirection: "row" },
    dayLabels: { width: 28, gap: GAP },
    dayLabel: {
        height: CELL,
        color: colors.mutedDark,
        fontSize: 9,
        fontWeight: "600",
        lineHeight: CELL,
    },
    weeks: { flexDirection: "row", gap: GAP },
    week: { gap: GAP },
    cell: { width: CELL, height: CELL, borderRadius: 3 },
    cellSelected: { borderWidth: 1, borderColor: colors.foreground },
    legend: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
    },
    legendText: { color: colors.mutedDark, fontSize: 10, marginHorizontal: 2 },
    legendCell: { width: 10, height: 10, borderRadius: 2 },
});
