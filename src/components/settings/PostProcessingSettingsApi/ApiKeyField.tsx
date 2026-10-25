import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

interface ApiKeyFieldProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  disabled: boolean;
  placeholder?: string;
  className?: string;
}

export const ApiKeyField: React.FC<ApiKeyFieldProps> = React.memo(
  ({ value, onSave, disabled, placeholder, className = "" }) => {
    const { t } = useTranslation();
    const [localValue, setLocalValue] = useState(value);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const dirty = localValue.trim() !== value.trim();
    const saved = !dirty && value.trim().length > 0;

    const save = async () => {
      if (!dirty || saving) return;
      setSaving(true);
      try {
        await onSave(localValue);
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        <Input
          type="password"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
          }}
          placeholder={placeholder}
          variant="compact"
          disabled={disabled || saving}
          className={`flex-1 min-w-[320px] ${className}`}
        />
        <Button
          type="button"
          size="sm"
          variant={saved ? "secondary" : "primary"}
          disabled={disabled || saving || !dirty}
          onClick={() => void save()}
        >
          {saving
            ? t("settings.postProcessing.api.apiKey.saving")
            : saved
              ? t("settings.postProcessing.api.apiKey.saved")
              : t("settings.postProcessing.api.apiKey.save")}
        </Button>
      </>
    );
  },
);

ApiKeyField.displayName = "ApiKeyField";
