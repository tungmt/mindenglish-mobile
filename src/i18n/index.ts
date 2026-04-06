import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"

import en from "./locales/en.json"
import vi from "./locales/vi.json"

const resources = {
  en: { translation: en },
  vi: { translation: vi },
}

// Get the device locale tag (e.g. "vi-VN", "en-US")
const deviceLocale = Localization.getLocales()?.[0]?.languageTag ?? "vi"
// Use only the language code ("vi", "en", etc.)
const languageCode = deviceLocale.split("-")[0]
const supportedLanguages = Object.keys(resources)
const fallbackLanguage = "vi"

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLanguages.includes(languageCode) ? languageCode : fallbackLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
})

export default i18n
