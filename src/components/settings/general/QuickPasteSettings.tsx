import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands } from "@/bindings";
import { useSettings } from "../../../hooks/useSettings";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { SettingContainer } from "../../ui/SettingContainer";
import { ShortcutInput } from "../ShortcutInput";

const SLOT_IDS = ["quick_paste_1", "quick_paste_2", "quick_paste_3"] as const;

export const QuickPasteSettings: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, refreshSettings } = useSettings();
  const slots = getSetting("quick_paste_slots") ?? [];
  const [drafts, setDrafts] = useState<string[]>([]);

  const promptKey = slots.map((slot) => slot.prompt ?? "").join("\0");
  useEffect(() => {
    setDrafts(promptKey.split("\0"));
  }, [promptKey]);

  const savePrompt = async (index: number, prompt: string) => {
    const result = await commands.changeQuickPastePrompt(index, prompt);
    if (result.status === "ok") {
      await refreshSettings();
    }
  };

  return (
    <SettingsGroup
      title={t("settings.general.quickPaste.title")}
      description={t("settings.general.quickPaste.description")}
    >
      {SLOT_IDS.map((id, index) => {
        const slot = slots[index];
        return (
          <React.Fragment key={id}>
            <ShortcutInput shortcutId={id} grouped />
            <SettingContainer
              title={t("settings.general.quickPaste.prompt")}
              description={t("settings.general.quickPaste.promptHint")}
              grouped
              layout="stacked"
            >
              <textarea
                className="mt-2 w-full min-h-[88px] rounded-md border border-line-strong bg-wash px-3 py-2 text-sm text-text"
                value={drafts[index] ?? ""}
                aria-label={t(
                  `settings.general.shortcut.bindings.${id}.name`,
                  `Quick Paste ${index + 1}`,
                )}
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
                    savePrompt(index, value);
                  }
                }}
              />
            </SettingContainer>
          </React.Fragment>
        );
      })}
    </SettingsGroup>
  );
};
