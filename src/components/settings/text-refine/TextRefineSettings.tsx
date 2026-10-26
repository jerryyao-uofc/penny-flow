import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands } from "@/bindings";
import { useSettings } from "../../../hooks/useSettings";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { SettingContainer } from "../../ui/SettingContainer";
import { Switch } from "../../ui/Switch";
import { ShortcutInput } from "../ShortcutInput";

const SLOT_IDS = ["refine_1", "refine_2", "refine_3"] as const;

export const TextRefineSettings: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, refreshSettings } = useSettings();
  const slots = getSetting("text_refine_slots") ?? [];
  const [drafts, setDrafts] = useState<string[]>([]);

  const promptKey = slots.map((s) => s.prompt ?? "").join("\0");
  useEffect(() => {
    setDrafts(slots.map((slot) => slot.prompt ?? ""));
    // Sync drafts when settings load or prompts change from the backend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptKey]);

  const updateSlot = async (
    index: number,
    patch: { enabled?: boolean; prompt?: string },
  ) => {
    const result = await commands.changeTextRefineSlotSetting(
      index,
      patch.enabled ?? null,
      null,
      patch.prompt ?? null,
    );
    if (result.status === "ok") {
      await refreshSettings();
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.textRefine.title")}>
        <p className="px-3 pb-2 text-sm text-ink-3">
          {t("settings.textRefine.description")}
        </p>
      </SettingsGroup>

      {SLOT_IDS.map((id, index) => {
        const slot = slots[index];
        const enabled = slot?.enabled ?? false;
        return (
          <SettingsGroup
            key={id}
            title={
              slot?.name ||
              t(`settings.textRefine.slots.${index}.name`, `Slot ${index + 1}`)
            }
          >
            <SettingContainer
              title={t("settings.textRefine.enabled")}
              description={t("settings.textRefine.enabledHint")}
              grouped
            >
              <Switch
                checked={enabled}
                onChange={(next) => updateSlot(index, { enabled: next })}
                ariaLabel={t("settings.textRefine.enabled")}
              />
            </SettingContainer>
            <ShortcutInput shortcutId={id} grouped disabled={!enabled} />
            <SettingContainer
              title={t("settings.textRefine.prompt")}
              description={t("settings.textRefine.promptHint")}
              grouped
              layout="stacked"
            >
              <textarea
                className="mt-2 w-full min-h-[120px] rounded-md border border-line-strong bg-wash px-3 py-2 text-sm text-text disabled:opacity-50"
                value={drafts[index] ?? ""}
                disabled={!enabled}
                onChange={(e) => {
                  const value = e.target.value;
                  setDrafts((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value !== (slot?.prompt ?? "")) {
                    updateSlot(index, { prompt: value });
                  }
                }}
              />
            </SettingContainer>
          </SettingsGroup>
        );
      })}
    </div>
  );
};
