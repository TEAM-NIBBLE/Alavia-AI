import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      onboarding: {
        tagline: 'Your health, in your language.',
        heroDescription: 'Voice-first health guidance built for Nigeria.',
        chooseLanguageTitle: 'Choose language',
        chooseLanguageHint: 'Pick how you want to interact with Alavia',
        stepLabel: 'Step 1 of 2',
        continue: 'Continue',
        saving: 'Saving preference...',
        saved: 'Language saved. Starting your journey...',
        footer: 'Voice-First AI Health Assistant',
        disclaimerLabel: 'Medical Disclaimer:',
        disclaimerText:
          'Alavia AI provides health information but is not a medical professional. In case of emergency, contact local emergency services immediately.'
      },
      language: {
        en: { name: 'English', nativeName: 'English' },
        pcm: { name: 'Nigerian Pidgin', nativeName: 'Pidgin' },
        yo: { name: 'Yoruba', nativeName: 'Yoruba' },
        ha: { name: 'Hausa', nativeName: 'Hausa' },
        ig: { name: 'Igbo', nativeName: 'Igbo' }
      }
    }
  },
  pcm: {
    translation: {
      onboarding: {
        tagline: 'Your health, for your language.',
        heroDescription: 'Voice-first health support wey dey built for Nigeria.',
        chooseLanguageTitle: 'Choose language',
        chooseLanguageHint: 'Pick how you wan use Alavia',
        stepLabel: 'Step 1 of 2',
        continue: 'Continue',
        saving: 'Dey save preference...',
        saved: 'Language don save. We don start your journey...',
        footer: 'Voice-First AI Health Assistant',
        disclaimerLabel: 'Medical Disclaimer:',
        disclaimerText:
          'Alavia AI fit give health info, but e no be doctor. If emergency happen, abeg call local emergency service sharp sharp.'
      },
      language: {
        en: { name: 'English', nativeName: 'English' },
        pcm: { name: 'Nigerian Pidgin', nativeName: 'Pidgin' },
        yo: { name: 'Yoruba', nativeName: 'Yoruba' },
        ha: { name: 'Hausa', nativeName: 'Hausa' },
        ig: { name: 'Igbo', nativeName: 'Igbo' }
      }
    }
  },
  yo: {
    translation: {
      onboarding: {
        tagline: 'Ilera re, ninu ede re.',
        heroDescription: 'Iranlowo ilera ohun ti a ko fun Nigeria.',
        chooseLanguageTitle: 'Yan ede',
        chooseLanguageHint: 'Yan bi o se fe ba Alavia soro',
        stepLabel: 'Igbese 1 ninu 2',
        continue: 'Tesiwaju',
        saving: 'A n fipamo ayanf?...',
        saved: 'A ti fipamo ede. A n bere irin ajo re...',
        footer: 'Iranlowo Ilera AI Ohun',
        disclaimerLabel: 'Ikilo Isegun:',
        disclaimerText:
          'Alavia AI n pese alaye ilera sugbon kii se dokita. Ti pajawiri ba waye, pe awon iranlowo pajawiri agbegbe re.'
      },
      language: {
        en: { name: 'Geesi', nativeName: 'English' },
        pcm: { name: 'Pidgin Naijiria', nativeName: 'Pidgin' },
        yo: { name: 'Yoruba', nativeName: 'Yoruba' },
        ha: { name: 'Hausa', nativeName: 'Hausa' },
        ig: { name: 'Igbo', nativeName: 'Igbo' }
      }
    }
  },
  ha: {
    translation: {
      onboarding: {
        tagline: 'Lafiyarka, cikin harshenka.',
        heroDescription: 'Taimakon lafiya na murya da aka gina domin Najeriya.',
        chooseLanguageTitle: 'Zabi harshe',
        chooseLanguageHint: 'Zabi yadda zaka yi magana da Alavia',
        stepLabel: 'Mataki na 1 cikin 2',
        continue: 'Ci gaba',
        saving: 'Ana adana zabin ka...',
        saved: 'An adana harshe. Ana fara tafiyarka...',
        footer: 'Mataimakin Lafiya na Murya',
        disclaimerLabel: 'Gargadin Lafiya:',
        disclaimerText:
          'Alavia AI na bada bayanin lafiya ne kawai, ba likita ba ne. Idan gaggawa ce, kira maikatan gaggawa na yankinku nan take.'
      },
      language: {
        en: { name: 'Turanci', nativeName: 'English' },
        pcm: { name: 'Pidgin na Najeriya', nativeName: 'Pidgin' },
        yo: { name: 'Yarbanci', nativeName: 'Yoruba' },
        ha: { name: 'Hausa', nativeName: 'Hausa' },
        ig: { name: 'Igbo', nativeName: 'Igbo' }
      }
    }
  },
  ig: {
    translation: {
      onboarding: {
        tagline: 'Ahike gi, n asusu gi.',
        heroDescription: 'Nduzi ahike nke olu emere maka Naijiria.',
        chooseLanguageTitle: 'Horo asusu',
        chooseLanguageHint: 'Horo otu i ga esi kparita na Alavia',
        stepLabel: 'Nzo 1 nime 2',
        continue: 'Gaa nihu',
        saving: 'A na echekwa nh?r? gi...',
        saved: 'Asusu echekwara. A na amalite njem gi...',
        footer: 'Onye enyemaka ahike nke olu AI',
        disclaimerLabel: 'Ncheta Ahike:',
        disclaimerText:
          'Alavia AI na enye ozi ahike ma o bughi d?k?ta. O buru na obu ihe mberede, kp?? ndi enyemaka mberede ozugbo.'
      },
      language: {
        en: { name: 'Bekee', nativeName: 'English' },
        pcm: { name: 'Pidgin Naijiria', nativeName: 'Pidgin' },
        yo: { name: 'Yoruba', nativeName: 'Yoruba' },
        ha: { name: 'Hausa', nativeName: 'Hausa' },
        ig: { name: 'Igbo', nativeName: 'Igbo' }
      }
    }
  }
} as const

const selectedLanguage = localStorage.getItem('alavia.selectedLanguage') ?? 'en'

i18n.use(initReactI18next).init({
  resources,
  lng: selectedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

export default i18n
