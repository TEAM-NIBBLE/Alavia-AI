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
        signupSubtitle: 'Join Alavia AI - health guidance in your language',
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
        signInDemo: 'Sign in as Demo User',
        forgotPasswordSuccess: '✓ A reset link has been sent if your account exists.',
        orDivider: 'or',
        logout: 'Log Out',
        profile: 'View Profile',
        step2Label: 'Step 2 of 2',
        back: 'Back'
      },
      voice: {
        sessionStatusLabel: 'Session Status',
        status: {
          ready: 'Ready',
          listening: 'Listening',
          processing: 'Processing'
        },
        healthSession: 'Health Session',
        emergencyHelp: 'Emergency help',
        micDisabledTitle: 'Microphone access is disabled',
        micDisabledText: 'Enable microphone permission in your browser settings to use voice triage.',
        listeningTitle: 'Listening Clearly...',
        speakTitle: 'Tap or Hold to Speak',
        listeningHint: 'Speak now about how you are feeling',
        speakHint: 'Share your symptoms for an instant health check',
        modeTap: 'Tap mode',
        modeHold: 'Hold mode',
        standardText: 'Standard Text',
        enableLargeText: 'Enable Large Text',
        transcript: 'Transcript',
        responseHeading: 'Here is what I understand',
        playAudio: 'Play audio response',
        triageQuestion: 'Triage Question',
        yes: 'Yes',
        no: 'No',
        speakAnswer: 'Speak Answer',
        severityResult: 'Severity Result',
        currentLevel: 'Current level',
        findHospital: 'Find nearby hospital',
        openKeyboard: 'Open keyboard input',
        typeSymptoms: 'How are you feeling?',
        closeKeyboard: 'Close keyboard panel',
        inputPlaceholder: 'E.g. I have a sharp headache...',
        send: 'Send',
        footer: 'Voice-First AI Health Assistant',
        questions: {
          breathing: 'Are you having any trouble breathing?',
          fainting: 'Have you fainted or felt sudden confusion?',
          worse: 'Are your symptoms getting worse quickly?',
          weakness: 'Do you have one-sided weakness or slurred speech?'
        },
        summaries: {
          critical: 'Your symptoms may need urgent attention. Please seek emergency care now.',
          high: 'You should visit a hospital today for assessment.',
          medium: 'Monitor closely and plan a same-day clinic visit if symptoms continue.',
          low: 'Current signs look mild. Keep monitoring and rest.'
        }
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
        signupSubtitle: 'Join Alavia AI - health for your language',
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
        noAccount: 'You no get account?',
        signUp: 'Sign Up',
        creating: 'E dey create account...',
        signInDemo: 'Sign in as Demo Person',
        forgotPasswordSuccess: '✓ Reset link don send if your account dey.',
        orDivider: 'abi',
        logout: 'Log Out',
        profile: 'Ma Profile',
        step2Label: 'Step 2 of 2',
        back: 'Go back'
      },
      voice: {
        sessionStatusLabel: 'Session status',
        status: {
          ready: 'Ready',
          listening: 'Listening',
          processing: 'Processing'
        },
        healthSession: 'Health session',
        emergencyHelp: 'Emergency help',
        micDisabledTitle: 'Microphone no dey active',
        micDisabledText: 'Abeg allow microphone permission for browser settings make voice triage work.',
        listeningTitle: 'I dey hear you...',
        speakTitle: 'Tap or Hold to Talk',
        listeningHint: 'Talk now about how you dey feel',
        speakHint: 'Share your symptoms make we check am quick',
        modeTap: 'Tap mode',
        modeHold: 'Hold mode',
        standardText: 'Normal text',
        enableLargeText: 'Big text',
        transcript: 'Wetin you talk',
        responseHeading: 'Wetin I understand be this',
        playAudio: 'Play audio reply',
        triageQuestion: 'Triage question',
        yes: 'Yes',
        no: 'No',
        speakAnswer: 'Talk answer',
        severityResult: 'Severity result',
        currentLevel: 'Current level',
        findHospital: 'Find hospital near me',
        openKeyboard: 'Open keyboard input',
        typeSymptoms: 'How you dey feel?',
        closeKeyboard: 'Close keyboard panel',
        inputPlaceholder: 'Example: My head dey pain well well...',
        send: 'Send',
        footer: 'Voice-First AI Health Assistant',
        questions: {
          breathing: 'You dey get any breathing wahala?',
          fainting: 'You don faint or get sudden confusion?',
          worse: 'Symptoms dey worse quickly?',
          weakness: 'You get one-side weakness or slurred speech?'
        },
        summaries: {
          critical: 'Your symptoms fit need urgent help. Abeg go emergency care now now.',
          high: 'You suppose go hospital today for checkup.',
          medium: 'Monitor am well and plan same-day clinic visit if e continue.',
          low: 'Signs look mild for now. Keep monitoring and rest.'
        }
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
        saving: 'A n fipamo ayanfe...',
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
        signupTitle: 'Create your account',
        signupSubtitle: 'Darapo mo Alavia AI',
        fullName: 'Oruko Kikun',
        fullNamePlaceholder: 'e.g. Amara Okonkwo',
        email: 'Imeeli',
        emailPlaceholder: 'you@example.com',
        phone: 'Nomba Foonu',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Oroigbaniwole',
        passwordPlaceholder: 'Seto oroigbaniwole to lagbara',
        createAccount: 'Seda Account',
        alreadyHaveAccount: 'O ti ni account?',
        signIn: 'Wole',
        signinTitle: 'Kaabo pada',
        signinSubtitle: 'Wole lati tesiwaju',
        emailOrPhone: 'Imeeli tabi Foonu',
        emailOrPhonePlaceholder: 'you@example.com tabi +234...',
        signinPassword: 'Oroigbaniwole',
        signinPasswordPlaceholder: 'Te oroigbaniwole re',
        forgotPassword: 'Gbagbe oroigbaniwole?',
        signInBtn: 'Wole',
        noAccount: 'Ko ni account?',
        signUp: 'Forukosile',
        creating: 'N seda account...',
        signInDemo: 'Wole gege bi Demo User',
        forgotPasswordSuccess: '✓ A ti fi link ntunse ranse ti o ba ni account.',
        orDivider: 'tabi',
        logout: 'Jade',
        profile: 'Ìró mi',
        step2Label: 'Igbese 2 ninu 2',
        back: 'Pada'
      },
      voice: {
        sessionStatusLabel: 'Ipo akoko',
        status: {
          ready: 'Setan',
          listening: 'N gbo',
          processing: 'N sise'
        },
        healthSession: 'Ibaraenisoro ilera',
        emergencyHelp: 'Iranlowo pajawiri',
        micDisabledTitle: 'A ko fun microphone ni ase',
        micDisabledText: 'Jowo fun browser ni ase microphone ki triage ohun le sise.',
        listeningTitle: 'Mo n gbo yin...',
        speakTitle: 'Te tabi di mu lati so',
        listeningHint: 'So bayii nipa bi o se n rilara',
        speakHint: 'So awon ami aisan re ki a le se ayewo kiakia',
        modeTap: 'Ipo te',
        modeHold: 'Ipo di mu',
        standardText: 'Iwon deede',
        enableLargeText: 'Mu font tobi',
        transcript: 'Ohun ti o so',
        responseHeading: 'Eyi ni ohun ti mo ye',
        playAudio: 'Tun ohun idahun se',
        triageQuestion: 'Ibeere triage',
        yes: 'Beeni',
        no: 'Rara',
        speakAnswer: 'Fi ohun dahun',
        severityResult: 'Esi ipo ewu',
        currentLevel: 'Ipele isiyi',
        findHospital: 'Wa ile iwosan to sun mo',
        openKeyboard: 'Si tit? keyboard',
        typeSymptoms: 'Bawo ni o se n rilara?',
        closeKeyboard: 'Pa panel keyboard',
        inputPlaceholder: 'Apeere: Ori mi n dun gan...',
        send: 'Fi ranse',
        footer: 'Oluranlowo Ilera AI Ohun',
        questions: {
          breathing: 'Se o ni isoro mimi?',
          fainting: 'Se o ti daku tabi ni rudurudu lojiji?',
          worse: 'Se ami aisan n buru sii ni kia kia?',
          weakness: 'Se o ni ailera apa kan tabi oro to n ya?'
        },
        summaries: {
          critical: 'Ami aisan yi le nilo iranlowo pajawiri. Lo si ile iwosan pajawiri bayii.',
          high: 'O ye ki o lo si ile iwosan loni fun ayewo.',
          medium: 'Tele e peki ki o si gbero ibewo ile iwosan loni bi o ba tesiwaju.',
          low: 'Ami yi rorun fun bayii. Maa tele e ki o sinmi.'
        }
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
        signupTitle: 'Kirkiro asusun ku',
        signupSubtitle: 'Shiga Alavia AI',
        fullName: 'Cikakken Suna',
        fullNamePlaceholder: 'misali Amara Okonkwo',
        email: 'Adireshin Imel',
        emailPlaceholder: 'ku@misali.com',
        phone: 'Lambar Waya',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Kalmar Sirri',
        passwordPlaceholder: 'Kirkiro kalmar sirri mai karfi',
        createAccount: 'Bude Asusun',
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
        noAccount: 'Ba ku da asusun?',
        signUp: 'Yi Rajista',
        creating: 'Ana bude asusun...',
        signInDemo: 'Shiga a matsayin Demo User',
        forgotPasswordSuccess: '✓ An aika link na sake saiti idan kana da asusu.',
        orDivider: 'ko',
        logout: 'Fita',
        profile: 'Bayanin Nawa',
        step2Label: 'Mataki na 2 cikin 2',
        back: 'Koma baya'
      },
      voice: {
        sessionStatusLabel: 'Matsayin zama',
        status: {
          ready: 'A shirye',
          listening: 'Ina sauraro',
          processing: 'Ana nazari'
        },
        healthSession: 'Zaman lafiya',
        emergencyHelp: 'Taimakon gaggawa',
        micDisabledTitle: 'An kashe izinin microphone',
        micDisabledText: 'Ba da izinin microphone a saitin browser domin triage na murya.',
        listeningTitle: 'Ina jin ka...',
        speakTitle: 'Danna ko rike don magana',
        listeningHint: 'Yi magana yanzu game da yadda kake ji',
        speakHint: 'Bayyana alamun rashin lafiya domin a duba cikin gaggawa',
        modeTap: 'Yanayin danna',
        modeHold: 'Yanayin rike',
        standardText: 'Rubutu na alada',
        enableLargeText: 'Babban rubutu',
        transcript: 'Abin da ka fada',
        responseHeading: 'Ga abin da na fahimta',
        playAudio: 'Sake kunna amsa',
        triageQuestion: 'Tambayar triage',
        yes: 'Eh',
        no: 'A a',
        speakAnswer: 'Amsa da murya',
        severityResult: 'Sakamakon tsanani',
        currentLevel: 'Matakin yanzu',
        findHospital: 'Nemo asibiti mafi kusa',
        openKeyboard: 'Bude shigar keyboard',
        typeSymptoms: 'Yaya kake ji?',
        closeKeyboard: 'Rufe panel keyboard',
        inputPlaceholder: 'Misali: Kaina na min zafi sosai...',
        send: 'Aika',
        footer: 'Mataimakin Lafiya na Murya',
        questions: {
          breathing: 'Kana da matsalar numfashi?',
          fainting: 'Ka taba suma ko rikicewa kwatsam?',
          worse: 'Alamun suna kara tsananta da sauri?',
          weakness: 'Kana da raunin gefe daya ko magana na rikicewa?'
        },
        summaries: {
          critical: 'Alamun ka na iya bukatar kulawar gaggawa. Je asibitin gaggawa yanzu.',
          high: 'Ya kamata ka je asibiti yau domin dubawa.',
          medium: 'Ci gaba da lura sosai kuma ka shirya zuwa asibiti yau idan ya ci gaba.',
          low: 'Alamun sun yi sauki a yanzu. Ci gaba da lura kuma ka huta.'
        }
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
        saving: 'A na echekwa nhoro gi...',
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
        signupTitle: 'Mep?ta aka?nt? gi',
        signupSubtitle: 'Sonye Alavia AI',
        fullName: 'Aha zuru oke',
        fullNamePlaceholder: 'dika Amara Okonkwo',
        email: 'Adreesi Email',
        emailPlaceholder: 'gi@ihe.com',
        phone: 'Nomba Ekwenti',
        phonePlaceholder: '+234 800 000 0000',
        password: 'Okwuntughe',
        passwordPlaceholder: 'Mep?ta okwuntughe siri ike',
        createAccount: 'Mep?ta Aka?nt?',
        alreadyHaveAccount: 'I nwere aka?nt??',
        signIn: 'Banye',
        signinTitle: 'Nabata ozo',
        signinSubtitle: 'Banye inogide',
        emailOrPhone: 'Email ma obu Ekwenti',
        emailOrPhonePlaceholder: 'gi@ihe.com ma obu +234...',
        signinPassword: 'Okwuntughe',
        signinPasswordPlaceholder: 'Tinye okwuntughe gi',
        forgotPassword: 'Chefuo okwuntughe?',
        signInBtn: 'Banye',
        noAccount: 'I nwegh? aka?nt??',
        signUp: 'Debanye aha',
        creating: 'Na-emep?ta aka?nt?...',
        signInDemo: 'Banye dika Demo User',
        forgotPasswordSuccess: '✓ Ezitela link nt?ghar? ma ? b?r? na i nwere aka?nt?.',
        orDivider: 'ma ? b?r?',
        logout: 'Puputa',
        profile: 'Profaịlụ m',
        step2Label: 'Nzo 2 nime 2',
        back: 'Laghachi'
      },
      voice: {
        sessionStatusLabel: 'Onodu oge',
        status: {
          ready: 'Njikere',
          listening: 'Ana m anu',
          processing: 'Ana nyochaa'
        },
        healthSession: 'Nzuk? ahuike',
        emergencyHelp: 'Enyemaka mberede',
        micDisabledTitle: 'A machibidoro microphone',
        micDisabledText: 'Kwe ka browser jiri microphone ka voice triage nwee ike iru oru.',
        listeningTitle: 'Ana m anu gi...',
        speakTitle: 'Pia ma obu jide ka ikwu',
        listeningHint: 'Kwuo ugbu a maka otu i si aru',
        speakHint: 'Kowa mgbaama gi ka anyi nyochaa ngwa ngwa',
        modeTap: 'Uzo pia',
        modeHold: 'Uzo ijide',
        standardText: 'Nha nkewa',
        enableLargeText: 'Mkpuruokwu buru ibu',
        transcript: 'Ihe i kwuru',
        responseHeading: 'Nke a bu ihe m gh?tara',
        playAudio: 'Kpoo aziza olu ozo',
        triageQuestion: 'Ajuju triage',
        yes: 'Ee',
        no: 'Mba',
        speakAnswer: 'Zaa na olu',
        severityResult: 'Nsonaazu ike oria',
        currentLevel: 'Ogo ugbu a',
        findHospital: 'Chota ulo ogwu di nso',
        openKeyboard: 'Mepee keyboard input',
        typeSymptoms: 'Kedu ka i si aru?',
        closeKeyboard: 'Mechie panel keyboard',
        inputPlaceholder: 'Dika: Isi m na afu m ike...',
        send: 'Zipu',
        footer: 'Onye enyemaka ahuike olu AI',
        questions: {
          breathing: 'I nwere nsogbu iku ume?',
          fainting: 'I dara mba ma obu nwee mgbagwoju anya ozugbo?',
          worse: 'Mgbaama ahu na-aka nj? ngwa ngwa?',
          weakness: 'I nwere adighi ike n otu akuku ma obu okwu na-aputa ihe isi ike?'
        },
        summaries: {
          critical: 'Mgbaama gi nwere ike choro enyemaka ozugbo. Gaa ulo ogwu mberede ugbu a.',
          high: 'I kwesiri iga ulo ogwu taa ka ha nyochaa gi.',
          medium: 'Nyochaa nke oma ma mee atumatu ileta ulo ogwu taa ma oburu na o gara nihu.',
          low: 'Mgbaama di mfe ugbu a. Nogide na-ele anya ma zuru ike.'
        }
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
