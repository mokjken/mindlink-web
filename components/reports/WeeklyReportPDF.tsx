/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register Chinese Font (Noto Sans SC)
// Use window.location.origin to ensure absolute path, avoiding "Unknown font format" with relative paths
const fontUrl = typeof window !== 'undefined' ? `${window.location.origin}/fonts/NotoSansSC.woff` : '/fonts/NotoSansSC.woff';

Font.register({
    family: 'Noto Sans SC',
    src: fontUrl
});

// Styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Noto Sans SC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 4,
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 14,
        marginBottom: 8,
        color: '#334155',
        fontWeight: 'bold',
    },
    text: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#475569',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    metricLabel: {
        fontSize: 9,
        color: '#64748B',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    chartContainer: {
        marginBottom: 20,
        height: 250,
    },
    chartImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    }
});

interface ReportData {
    title: string;
    scope: string;
    date: string;
    aiSummary: string;
    stats: {
        total: number;
        risk: number;
        avgScore: string;
        negRatio: string;
    };
    charts: {
        trend?: string; // Data URL
        composition?: string;
        category?: string;
        heatmap?: string;
    }
}

export const WeeklyReportPDF: React.FC<{ data: ReportData }> = ({ data }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{data.title}</Text>
                        <Text style={styles.subtitle}>生成日期: {data.date} | 范围: {data.scope}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, color: '#6366F1' }}>MindLink Smart Report</Text>
                    </View>
                </View>

                {/* Key Metrics */}
                <View style={styles.metricsRow}>
                    <View style={[styles.metricCard, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.metricValue, { color: '#2563EB' }]}>{data.stats.total}</Text>
                        <Text style={styles.metricLabel}>总记录数</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.metricValue, { color: '#DC2626' }]}>{data.stats.risk}</Text>
                        <Text style={styles.metricLabel}>高风险警报</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.metricValue, { color: '#059669' }]}>{data.stats.avgScore}</Text>
                        <Text style={styles.metricLabel}>平均情绪分</Text>
                    </View>
                    <View style={[styles.metricCard, { backgroundColor: '#FFF7ED' }]}>
                        <Text style={[styles.metricValue, { color: '#EA580C' }]}>{data.stats.negRatio}</Text>
                        <Text style={styles.metricLabel}>消极占比</Text>
                    </View>
                </View>

                {/* AI Insight */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 AI 智能决策建议</Text>
                    <Text style={styles.text}>
                        {data.aiSummary}
                    </Text>
                </View>

                {/* Chart: Trend */}
                {data.charts.trend && (
                    <View style={styles.chartContainer}>
                        <Text style={styles.sectionTitle}>📈 情绪指数走势</Text>
                        <Image src={data.charts.trend} style={styles.chartImage} />
                    </View>
                )}

                {/* Charts: Row 2 */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {data.charts.composition && (
                        <View style={{ flex: 1, height: 200 }}>
                            <Text style={styles.sectionTitle}>🧩 情绪构成</Text>
                            <Image src={data.charts.composition} style={styles.chartImage} />
                        </View>
                    )}
                    {data.charts.category && (
                        <View style={{ flex: 1, height: 200 }}>
                            <Text style={styles.sectionTitle}>📊 分类/区域分析</Text>
                            <Image src={data.charts.category} style={styles.chartImage} />
                        </View>
                    )}
                </View>

                {/* Heatmap (Page Break if needed, but fitting on one for now) */}
                {data.charts.heatmap && (
                    <View style={[styles.chartContainer, { marginTop: 20 }]}>
                        <Text style={styles.sectionTitle}>🌡️ 空间风险热力图</Text>
                        <Image src={data.charts.heatmap} style={{ width: '100%', height: 200, objectFit: 'contain' }} />
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    MindLink Campus System • Generated by AI Analysis Core • Confidential
                </Text>

            </Page>
        </Document>
    );
};
