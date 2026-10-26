//! Lifetime usage counters that survive the five-hour history wipe.

use chrono::{Datelike, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::BTreeMap;
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

const STORE_NAME: &str = "analytics_store.json";

#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
pub struct UsageAnalytics {
    /// Lifetime dictation sessions that produced pasted text.
    pub total_uses: u64,
    pub words_transcribed: u64,
    pub chinese_characters: u64,
    pub deepseek_rewrites: u64,
    pub text_refine_uses: u64,
    /// Calendar days (YYYY-MM-DD) with at least one use.
    #[serde(default)]
    pub active_day_keys: Vec<String>,
    /// Words pasted per calendar day (YYYY-MM-DD → count).
    #[serde(default)]
    pub words_by_day: BTreeMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DictationAnalytics {
    pub total_uses: u64,
    pub words_transcribed: u64,
    pub chinese_characters: u64,
    pub deepseek_rewrites: u64,
    pub text_refine_uses: u64,
    pub active_days: u64,
    pub words_this_week: u64,
}

pub struct AnalyticsManager {
    inner: Mutex<UsageAnalytics>,
    path: std::path::PathBuf,
}

fn is_han_char(ch: char) -> bool {
    matches!(
        ch,
        '\u{3400}'..='\u{4DBF}'
            | '\u{4E00}'..='\u{9FFF}'
            | '\u{F900}'..='\u{FAFF}'
            | '\u{20000}'..='\u{2A6DF}'
            | '\u{2A700}'..='\u{2B73F}'
            | '\u{2B740}'..='\u{2B81F}'
            | '\u{2B820}'..='\u{2CEAF}'
            | '\u{30000}'..='\u{3134F}'
    )
}

pub fn word_count(text: &str) -> u64 {
    text.split_whitespace()
        .filter(|word| word.chars().any(|ch| ch.is_alphanumeric() || is_han_char(ch)))
        .count() as u64
}

pub fn han_char_count(text: &str) -> u64 {
    text.chars().filter(|ch| is_han_char(*ch)).count() as u64
}

fn today_key() -> String {
    let now = Utc::now();
    format!("{:04}-{:02}-{:02}", now.year(), now.month(), now.day())
}

fn prune_week_map(map: &mut BTreeMap<String, u64>) {
    let cutoff = Utc::now() - chrono::Duration::days(8);
    let cutoff_key = format!(
        "{:04}-{:02}-{:02}",
        cutoff.year(),
        cutoff.month(),
        cutoff.day()
    );
    map.retain(|day, _| day.as_str() >= cutoff_key.as_str());
}

impl AnalyticsManager {
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let path = crate::portable::app_data_dir(app)
            .map_err(|e| e.to_string())?
            .join(STORE_NAME);
        let data = if path.exists() {
            let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            serde_json::from_str(&raw).unwrap_or_default()
        } else {
            UsageAnalytics::default()
        };
        Ok(Self {
            inner: Mutex::new(data),
            path,
        })
    }

    fn persist(&self, data: &UsageAnalytics) {
        if let Some(parent) = self.path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(data) {
            let _ = fs::write(&self.path, json);
        }
    }

    pub fn snapshot(&self) -> DictationAnalytics {
        let data = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        let cutoff = Utc::now() - chrono::Duration::days(7);
        let cutoff_key = format!(
            "{:04}-{:02}-{:02}",
            cutoff.year(),
            cutoff.month(),
            cutoff.day()
        );
        let words_this_week = data
            .words_by_day
            .iter()
            .filter(|(day, _)| day.as_str() >= cutoff_key.as_str())
            .map(|(_, n)| *n)
            .sum();
        DictationAnalytics {
            total_uses: data.total_uses,
            words_transcribed: data.words_transcribed,
            chinese_characters: data.chinese_characters,
            deepseek_rewrites: data.deepseek_rewrites,
            text_refine_uses: data.text_refine_uses,
            active_days: data.active_day_keys.len() as u64,
            words_this_week,
        }
    }

    pub fn record_dictation(&self, pasted_text: &str, deepseek_rewrote: bool) {
        let words = word_count(pasted_text);
        let han = han_char_count(pasted_text);
        let day = today_key();
        let mut data = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        data.total_uses = data.total_uses.saturating_add(1);
        data.words_transcribed = data.words_transcribed.saturating_add(words);
        data.chinese_characters = data.chinese_characters.saturating_add(han);
        if deepseek_rewrote {
            data.deepseek_rewrites = data.deepseek_rewrites.saturating_add(1);
        }
        if !data.active_day_keys.iter().any(|d| d == &day) {
            data.active_day_keys.push(day.clone());
        }
        let entry = data.words_by_day.entry(day).or_insert(0);
        *entry = entry.saturating_add(words);
        prune_week_map(&mut data.words_by_day);
        self.persist(&data);
    }

    pub fn record_text_refine(&self, pasted_text: &str) {
        let words = word_count(pasted_text);
        let han = han_char_count(pasted_text);
        let day = today_key();
        let mut data = self.inner.lock().unwrap_or_else(|e| e.into_inner());
        data.text_refine_uses = data.text_refine_uses.saturating_add(1);
        data.words_transcribed = data.words_transcribed.saturating_add(words);
        data.chinese_characters = data.chinese_characters.saturating_add(han);
        if !data.active_day_keys.iter().any(|d| d == &day) {
            data.active_day_keys.push(day.clone());
        }
        let entry = data.words_by_day.entry(day).or_insert(0);
        *entry = entry.saturating_add(words);
        prune_week_map(&mut data.words_by_day);
        self.persist(&data);
    }
}

pub fn init(app: &AppHandle) {
    match AnalyticsManager::new(app) {
        Ok(manager) => {
            app.manage(manager);
        }
        Err(e) => log::error!("Failed to init analytics store: {e}"),
    }
}
