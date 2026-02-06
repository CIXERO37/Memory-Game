"use client"

import { Languages, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Image from "next/image"

const languages = [
  { code: 'en', name: 'English', flag: '/flag/US.webp' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '/flag/idn.webp' },
  { code: 'zh', name: '中文', flag: '/flag/cn.webp' },
  { code: 'ar', name: 'العربية', flag: '/flag/ar.webp' }
]

interface LanguageSelectorProps {
  onClose?: () => void
}

export function LanguageSelector({ onClose }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation()
  const [showLanguages, setShowLanguages] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  useEffect(() => {
    setCurrentLanguage(i18n.language)
  }, [i18n.language])

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setCurrentLanguage(langCode)
    setShowLanguages(false)
    if (onClose) {
      onClose()
    }
  }

  const getCurrentFlag = () => {
    const currentLang = languages.find(lang => lang.code === currentLanguage)
    return currentLang ? currentLang.flag : '/flag/US.webp'
  }

  const getCurrentLanguageName = () => {
    const currentLang = languages.find(lang => lang.code === currentLanguage)
    return currentLang ? currentLang.name : 'English'
  }

  return (
    <div className="relative">
      {!showLanguages ? (
        <button
          onClick={() => setShowLanguages(true)}
          className="w-full px-4 py-3 text-left hover:bg-purple-800/60 transition-colors duration-200 flex items-center gap-3"
        >
          <div className="w-8 h-8 relative flex-shrink-0 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <Image
              src={getCurrentFlag()}
              alt="Current language flag"
              width={32}
              height={32}
              className="object-cover object-center w-full h-full"
            />
          </div>
          <span className="text-white font-medium">{getCurrentLanguageName()}</span>
        </button>
      ) : (
        <div className="py-2">
          {/* Back Button */}
          <button
            onClick={() => setShowLanguages(false)}
            className="w-full px-4 py-2 text-left hover:bg-purple-800/60 transition-colors duration-200 flex items-center gap-3 mb-1"
          >
            <span className="text-white text-xl">←</span>
            <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden border-2 border-white/20 shadow-md">
              <Image
                src={getCurrentFlag()}
                alt="Current language flag"
                width={24}
                height={24}
                className="object-cover object-center w-full h-full"
              />
            </div>
            <span className="text-white font-medium">{t('menu.language')}</span>
          </button>

          {/* Divider */}
          <div className="border-t border-purple-500/40 my-1"></div>

          {/* Language Options */}
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full px-4 py-3 text-left hover:bg-purple-800/60 transition-colors duration-200 flex items-center justify-between gap-3 ${currentLanguage === lang.code ? 'bg-purple-800/50' : ''
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                  <Image
                    src={lang.flag}
                    alt={`${lang.name} flag`}
                    width={40}
                    height={40}
                    className="object-cover object-center w-full h-full"
                  />
                </div>
                <span className="text-white font-medium">{lang.name}</span>
              </div>
              {currentLanguage === lang.code && (
                <Check className="w-5 h-5 text-green-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
