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
      },
      auth: {
        signupTitle: 'Create your account',
        signupSubtitle: 'Join Alavia AI — health guidance in your language',
        fullName: 'Full Name',
        fullNamePlaceholder: 'e.g. Amara Okonkwo',
        email: 'Email Address',
        emailPlaceholder: 'you@example.com',
        phone: 'Phone Number',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Password',
        passwordPlaceholder: 'Create a strong password',
        createAccount: 'Create Account',
        alreadyHaveAccount: 'Already have an account?',
        signIn: 'Sign In',
        signinTitle: 'Welcome back',
        signinSubtitle: 'Sign in to continue your health journey',
        emailOrPhone: 'Email or Phone Number',
        emailOrPhonePlaceholder: 'you@example.com or +234...',
        signinPassword: 'Password',
        signinPasswordPlaceholder: 'Enter your password',
        forgotPassword: 'Forgot password?',
        signInBtn: 'Sign In',
        noAccount: "Don't have an account?",
        signUp: 'Sign Up',
        creating: 'Creating account...',
        signingIn: 'Signing in...',
        step2Label: 'Step 2 of 2',
        back: 'Back'
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
      },
      auth: {
        signupTitle: 'Create your account',
        signupSubtitle: 'Join Alavia AI — health for your language',
        fullName: 'Full Name',
        fullNamePlaceholder: 'e.g. Amara Okonkwo',
        email: 'Email Address',
        emailPlaceholder: 'you@example.com',
        phone: 'Phone Number',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Password',
        passwordPlaceholder: 'Create strong password',
        createAccount: 'Create Account',
        alreadyHaveAccount: 'You don get account?',
        signIn: 'Sign In',
        signinTitle: 'Welcome back',
        signinSubtitle: 'Sign in to continue',
        emailOrPhone: 'Email or Phone Number',
        emailOrPhonePlaceholder: 'you@example.com or +234...',
        signinPassword: 'Password',
        signinPasswordPlaceholder: 'Enter your password',
        forgotPassword: 'Forget password?',
        signInBtn: 'Sign In',
        noAccount: "You no get account?",
        signUp: 'Sign Up',
        creating: 'E dey create account...',
        signingIn: 'E dey sign in...',
        step2Label: 'Step 2 of 2',
        back: 'Go back'
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
      },
      auth: {
        signupTitle: 'Ṣẹda akọọlẹ rẹ',
        signupSubtitle: 'Darapọ mọ Alavia AI',
        fullName: 'Orukọ Kikun',
        fullNamePlaceholder: 'e.g. Amara Okonkwo',
        email: 'Adirẹsi Imeeli',
        emailPlaceholder: 'you@example.com',
        phone: 'Nọmba Foonu',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Ọrọigbaniwọle',
        passwordPlaceholder: 'Ṣẹda ọrọigbaniwọle to lagbara',
        createAccount: 'Ṣẹda Akọọlẹ',
        alreadyHaveAccount: 'O ti ni akọọlẹ?',
        signIn: 'Wọle',
        signinTitle: 'Kaabo pada',
        signinSubtitle: 'Wọle lati tẹsiwaju',
        emailOrPhone: 'Imeeli tabi Foonu',
        emailOrPhonePlaceholder: 'you@example.com tabi +234...',
        signinPassword: 'Ọrọigbaniwọle',
        signinPasswordPlaceholder: 'Tẹ ọrọigbaniwọle rẹ',
        forgotPassword: 'Gbagbe ọrọigbaniwọle?',
        signInBtn: 'Wọle',
        noAccount: "Ko ni akọọlẹ?",
        signUp: 'Forukọsilẹ',
        creating: 'Ẹda akọọlẹ...',
        signingIn: 'Gbigba wọle...',
        step2Label: 'Igbese 2 ninu 2',
        back: 'Pada sẹhin'
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
      },
      auth: {
        signupTitle: 'Ƙirƙiri asusun ku',
        signupSubtitle: 'Shiga Alavia AI',
        fullName: 'Cikakken Suna',
        fullNamePlaceholder: 'misali Amara Okonkwo',
        email: 'Adireshin Imel',
        emailPlaceholder: 'ku@misali.com',
        phone: 'Lambar Waya',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Kalmar Sirri',
        passwordPlaceholder: 'Ƙirƙiri kalmar sirri mai ƙarfi',
        createAccount: 'Buɗe Asusun',
        alreadyHaveAccount: 'Kuna da asusun?',
        signIn: 'Shiga',
        signinTitle: 'Barka da dawowa',
        signinSubtitle: 'Shiga don ci gaba',
        emailOrPhone: 'Imel ko Lambar Waya',
        emailOrPhonePlaceholder: 'ku@misali.com ko +234...',
        signinPassword: 'Kalmar Sirri',
        signinPasswordPlaceholder: 'Shigar da kalmar sirrinka',
        forgotPassword: 'Manta kalmar sirri?',
        signInBtn: 'Shiga',
        noAccount: "Ba ku da asusun?",
        signUp: 'Yi Rajista',
        creating: 'Ana buɗe asusun...',
        signingIn: 'Ana shiga...',
        step2Label: 'Mataki na 2 cikin 2',
        back: 'Koma baya'
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
      },
      auth: {
        signupTitle: 'Mepụta akaụntụ gị',
        signupSubtitle: 'Sonye Alavia AI',
        fullName: 'Aha Ezi na Ulo',
        fullNamePlaceholder: 'dịka Amara Okonkwo',
        email: 'Adreesị Email',
        emailPlaceholder: 'gi@ihe.com',
        phone: 'Nọmba Ekwentị',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Okwuntughe',
        passwordPlaceholder: 'Mepụta okwuntughe siri ike',
        createAccount: 'Mepụta Akaụntụ',
        alreadyHaveAccount: 'Ị nwere akaụntụ?',
        signIn: 'Banye',
        signinTitle: 'Nabata ọzọ',
        signinSubtitle: 'Banye ịnọgide',
        emailOrPhone: 'Email ma ọ bụ Ekwentị',
        emailOrPhonePlaceholder: 'gi@ihe.com ma ọ bụ +234...',
        signinPassword: 'Okwuntughe',
        signinPasswordPlaceholder: 'Tinye okwuntughe gị',
        forgotPassword: 'Chefuo okwuntughe?',
        signInBtn: 'Banye',
        noAccount: "Ị enweghị akaụntụ?",
        signUp: 'Debanye Aha',
        creating: 'Na-emepụta akaụntụ...',
        signingIn: 'Na-abanye...',
        step2Label: 'Nzo 2 nime 2',
        back: 'Laghachi'
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
