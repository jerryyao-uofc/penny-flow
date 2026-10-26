import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands, type DictationAnalytics } from "@/bindings";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { SettingContainer } from "../../ui/SettingContainer";

const MetricRow: React.FC<{ label: string; value: string; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <SettingContainer title={label} description={hint} grouped layout="horizontal">
    <div className="text-sm font-semibold tabular-nums text-text">{value}</div>
  </SettingContainer>
);

export const AnalyticsSettings: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DictationAnalytics | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await commands.getDictationAnalytics();
      if (!cancelled && result.status === "ok") {
        setStats(result.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const format = (n: number | undefined) =>
    n === undefined ? "—" : n.toLocaleString();

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.analytics.title")}>
        <p className="px-3 pb-2 text-sm text-ink-3">
          {t("settings.analytics.note")}
        </p>
        <MetricRow
          label={t("settings.analytics.totalUses")}
          value={format(stats?.total_uses)}
          hint={t("settings.analytics.totalUsesHint")}
        />
        <MetricRow
          label={t("settings.analytics.words")}
          value={format(stats?.words_transcribed)}
          hint={t("settings.analytics.wordsHint")}
        />
        <MetricRow
          label={t("settings.analytics.chineseChars")}
          value={format(stats?.chinese_characters)}
          hint={t("settings.analytics.chineseCharsHint")}
        />
        <MetricRow
          label={t("settings.analytics.deepseek")}
          value={format(stats?.deepseek_rewrites)}
          hint={t("settings.analytics.deepseekHint")}
        />
        <MetricRow
          label={t("settings.analytics.refine")}
          value={format(stats?.text_refine_uses)}
          hint={t("settings.analytics.refineHint")}
        />
        <MetricRow
          label={t("settings.analytics.activeDays")}
          value={format(stats?.active_days)}
          hint={t("settings.analytics.activeDaysHint")}
        />
        <MetricRow
          label={t("settings.analytics.weekWords")}
          value={format(stats?.words_this_week)}
          hint={t("settings.analytics.weekWordsHint")}
        />
      </SettingsGroup>
    </div>
  );
};
