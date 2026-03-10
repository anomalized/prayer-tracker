export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  context: string;
  category: string;
  source?: string;
}

export interface DuaCategory {
  id: string;
  label: string;
  icon: string;
  color: string;        // tailwind bg color
  borderColor: string;  // tailwind border color
  textColor: string;    // tailwind text color
}

export const DUA_CATEGORIES: DuaCategory[] = [
  { id: "morning",   label: "Morning & Evening",    icon: "🌅", color: "bg-amber-50",   borderColor: "border-amber-200", textColor: "text-amber-700" },
  { id: "sleep",     label: "Before Sleep",          icon: "🌙", color: "bg-indigo-50",  borderColor: "border-indigo-200", textColor: "text-indigo-700" },
  { id: "waking",    label: "Waking Up",             icon: "☀️", color: "bg-yellow-50",  borderColor: "border-yellow-200", textColor: "text-yellow-700" },
  { id: "home",      label: "Entering / Leaving Home", icon: "🏠", color: "bg-green-50",   borderColor: "border-green-200", textColor: "text-green-700" },
  { id: "eating",    label: "Before & After Eating", icon: "🍽️", color: "bg-orange-50",  borderColor: "border-orange-200", textColor: "text-orange-700" },
  { id: "travel",    label: "Traveling",             icon: "✈️", color: "bg-sky-50",     borderColor: "border-sky-200",    textColor: "text-sky-700" },
  { id: "forgiveness", label: "Forgiveness (Istighfar)", icon: "🤲", color: "bg-rose-50",    borderColor: "border-rose-200",   textColor: "text-rose-700" },
  { id: "protection", label: "Protection",           icon: "🛡️", color: "bg-violet-50",  borderColor: "border-violet-200", textColor: "text-violet-700" },
  { id: "prayer",    label: "After Prayer",          icon: "📿", color: "bg-teal-50",    borderColor: "border-teal-200",   textColor: "text-teal-700" },
];

export const DUAS: Dua[] = [
  // ── Morning & Evening ────────────────────────────────────────
  {
    id: "morning-1",
    category: "morning",
    title: "Morning Remembrance",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Aṣbaḥnā wa aṣbaḥal mulku lillāh, walḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah",
    translation: "We have entered the morning and the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.",
    context: "Read in the morning after Fajr prayer.",
    source: "Abu Dawud 5076",
  },
  {
    id: "morning-2",
    category: "morning",
    title: "Evening Remembrance",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Amsaynā wa amsal mulku lillāh, walḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah",
    translation: "We have entered the evening and the whole kingdom belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.",
    context: "Read in the evening, after Maghrib prayer.",
    source: "Abu Dawud 5076",
  },
  {
    id: "morning-3",
    category: "morning",
    title: "Sayyidul Istighfar (Morning)",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ",
    transliteration: "Allāhumma anta rabbī lā ilāha illā ant, khalaqtanī wa ana ʿabduk, wa ana ʿalā ʿahdika wa waʿdika mastataʿt",
    translation: "O Allah, You are my Lord. There is none worthy of worship except You. You created me and I am Your servant. I am upon Your covenant and promise as best I can.",
    context: "The master supplication for seeking forgiveness. Whoever says it in the morning with firm belief and dies that day before evening will be among the people of Paradise.",
    source: "Bukhari 6306",
  },
  {
    id: "morning-4",
    category: "morning",
    title: "Protection (Morning & Evening)",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillāhil-ladhī lā yaḍurru maʿasmihi shayʾun fil-arḍi wa lā fis-samāʾi wa huwas-samīʿul-ʿalīm",
    translation: "In the name of Allah with Whose name nothing can harm on earth or in heaven, and He is the All-Hearing, All-Knowing.",
    context: "Read three times in the morning and evening. Whoever reads it will not be afflicted by any harm.",
    source: "Abu Dawud 5088, Tirmidhi 3388",
  },

  // ── Before Sleep ─────────────────────────────────────────────
  {
    id: "sleep-1",
    category: "sleep",
    title: "Dua Before Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allāhumma amūtu wa aḥyā",
    translation: "In Your name, O Allah, I die and I live.",
    context: "The Prophet ﷺ would say this every night before sleeping.",
    source: "Bukhari 6324",
  },
  {
    id: "sleep-2",
    category: "sleep",
    title: "Ayatul Kursi Before Sleep",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    transliteration: "Allāhu lā ilāha illā huw, al-ḥayyul-qayyūm, lā taʾkhudhuhū sinatun wa lā nawm",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
    context: "Reciting Ayatul Kursi before sleep brings a guardian from Allah, and Shaytan cannot come near until morning.",
    source: "Bukhari 2311, Quran 2:255",
  },
  {
    id: "sleep-3",
    category: "sleep",
    title: "Tasbih Before Sleep",
    arabic: "سُبْحَانَ اللَّهِ — ٣٣ مرة\nاَلْحَمْدُ لِلَّهِ — ٣٣ مرة\nاللَّهُ أَكْبَرُ — ٣٤ مرة",
    transliteration: "SubḥānAllāh (33×)\nAlḥamdulillāh (33×)\nAllāhu Akbar (34×)",
    translation: "Glory be to Allah (33×)\nAll praise be to Allah (33×)\nAllah is the Greatest (34×)",
    context: "Fatimah (RA) asked the Prophet ﷺ for a servant due to hardship. He told her this is better than what you asked for.",
    source: "Bukhari 3113",
  },
  {
    id: "sleep-4",
    category: "sleep",
    title: "Last Two Verses of Al-Baqarah",
    arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ",
    transliteration: "Āmanar-rasūlu bimā unzila ilayhi mir-rabbihi wal-muʾminūn...",
    translation: "The Messenger has believed in what was revealed to him from his Lord, and so have the believers. All of them have believed in Allah, His angels, His books, and His messengers...",
    context: "Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him.",
    source: "Bukhari 4008",
  },

  // ── Waking Up ────────────────────────────────────────────────
  {
    id: "waking-1",
    category: "waking",
    title: "Dua Upon Waking",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alḥamdulillāhil-ladhī aḥyānā baʿda mā amātanā wa ilayhin-nushūr",
    translation: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",
    context: "The first words to say upon waking from sleep, before doing anything else.",
    source: "Bukhari 6312",
  },
  {
    id: "waking-2",
    category: "waking",
    title: "Wiping Face After Waking",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي رَدَّ عَلَيَّ رُوحِي وَعَافَانِي فِي جَسَدِي وَأَذِنَ لِي بِذِكْرِهِ",
    transliteration: "Alḥamdulillāhil-ladhī radda ʿalayya rūḥī wa ʿāfānī fī jasadī wa adhina lī bidhikrih",
    translation: "All praise is for Allah who returned my soul to me, restored health in my body, and allowed me to remember Him.",
    context: "Read while wiping the face after waking up, as a reminder of Allah's mercy in granting us another day.",
    source: "Tirmidhi 3401",
  },

  // ── Entering / Leaving Home ──────────────────────────────────
  {
    id: "home-1",
    category: "home",
    title: "Entering the Home",
    arabic: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Bismillāhi walajna, wa bismillāhi kharajnā, wa ʿalallāhi rabbinā tawakkalnā",
    translation: "In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we place our trust.",
    context: "Say upon entering the home. The Prophet ﷺ taught us to mention Allah's name so Shaytan cannot find lodging.",
    source: "Abu Dawud 5096",
  },
  {
    id: "home-2",
    category: "home",
    title: "Leaving the Home",
    arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillāh, tawakkaltu ʿalallāh, wa lā ḥawla wa lā quwwata illā billāh",
    translation: "In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.",
    context: "Whoever says this upon leaving the home will be guided, protected and Shaytan will move away from him.",
    source: "Abu Dawud 5095, Tirmidhi 3426",
  },

  // ── Before & After Eating ────────────────────────────────────
  {
    id: "eating-1",
    category: "eating",
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillāh",
    translation: "In the name of Allah.",
    context: "Say Bismillah before eating. If you forget at the beginning, say: Bismillāhi awwalahu wa ākhirah (In the name of Allah at its beginning and end).",
    source: "Abu Dawud 3767",
  },
  {
    id: "eating-2",
    category: "eating",
    title: "After Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alḥamdulillāhil-ladhī aṭʿamanā wa saqānā wa jaʿalanā muslimīn",
    translation: "All praise is for Allah who fed us and gave us drink, and made us Muslims.",
    context: "Say after finishing a meal as a form of gratitude to Allah for His provisions.",
    source: "Abu Dawud 3850, Tirmidhi 3457",
  },
  {
    id: "eating-3",
    category: "eating",
    title: "When Visiting Someone's Home",
    arabic: "اللَّهُمَّ بَارِكْ لَهُمْ فِيمَا رَزَقْتَهُمْ، وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ",
    transliteration: "Allāhumma bārik lahum fī mā razaqtahum, waghfir lahum warḥamhum",
    translation: "O Allah, bless them in what You have provided for them, forgive them and have mercy on them.",
    context: "Recite this dua for your host after eating at their house.",
    source: "Muslim 2042",
  },

  // ── Traveling ────────────────────────────────────────────────
  {
    id: "travel-1",
    category: "travel",
    title: "Dua for Travel",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā rabbinā lamunqalibūn",
    translation: "Glory be to Him Who has subjected this to us, and we could never have it by our efforts, and surely, to our Lord we are to return.",
    context: "Recite when boarding any vehicle or conveyance — car, plane, ship. Then say Alhamdulillah three times and Allahu Akbar three times.",
    source: "Abu Dawud 2602, Tirmidhi 3446",
  },
  {
    id: "travel-2",
    category: "travel",
    title: "Dua for a Safe Return",
    arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى",
    transliteration: "Allāhumma innā nasʾaluka fī safarinā hādhal-birra wat-taqwā, wa minal-ʿamali mā tarḍā",
    translation: "O Allah, we ask You on this journey for righteousness and piety, and for deeds that are pleasing to You.",
    context: "A comprehensive travel dua asking Allah for protection, righteousness, and ease throughout the journey.",
    source: "Muslim 1342",
  },

  // ── Forgiveness ──────────────────────────────────────────────
  {
    id: "forgiveness-1",
    category: "forgiveness",
    title: "Seeking Forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullāhal-ʿaẓīmal-ladhī lā ilāha illā huwal-ḥayyul-qayyūmu wa atūbu ilayh",
    translation: "I seek forgiveness from Allah, the Magnificent, besides Whom there is none worthy of worship, the Ever-Living, the Sustainer, and I repent to Him.",
    context: "Whoever says this, Allah will forgive him, even if he ran away from the battlefield.",
    source: "Abu Dawud 1517, Tirmidhi 3577",
  },
  {
    id: "forgiveness-2",
    category: "forgiveness",
    title: "Dua for Forgiveness of All Sins",
    arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ",
    transliteration: "Allāhummaghfir lī dhanbī kullahu, diqqahu wa jillahu, wa awwalahu wa ākhirahu, wa ʿalāniyatahu wa sirrah",
    translation: "O Allah, forgive me all my sins, the small and the great, the first and the last, the open and the secret.",
    context: "A comprehensive supplication asking Allah to forgive all categories of sins.",
    source: "Muslim 483",
  },
  {
    id: "forgiveness-3",
    category: "forgiveness",
    title: "The Best Dua for Forgiveness",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    transliteration: "Rabbighfir lī wa tub ʿalayya, innaka anta-tawwābur-raḥīm",
    translation: "My Lord, forgive me and accept my repentance. Verily, You are the Acceptor of repentance, the Most Merciful.",
    context: "The Prophet ﷺ used to say this 100 times a day in a single gathering.",
    source: "Ahmad 5114, Ibn Majah 3814",
  },

  // ── Protection ───────────────────────────────────────────────
  {
    id: "protection-1",
    category: "protection",
    title: "Ayatul Kursi — Verse of the Throne",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
    transliteration: "Allāhu lā ilāha illā huw, al-ḥayyul-qayyūm, lā taʾkhudhuhū sinatun wa lā nawm, lahu mā fis-samāwāti wa mā fil-arḍ",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth.",
    context: "The greatest verse in the Quran. Read after every obligatory prayer and before sleep for protection.",
    source: "Quran 2:255, Bukhari 2311",
  },
  {
    id: "protection-2",
    category: "protection",
    title: "Protection from Shaytan",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    context: "Recite three times in the evening. Whoever says it will not be harmed by anything until the morning.",
    source: "Muslim 2709",
  },
  {
    id: "protection-3",
    category: "protection",
    title: "Al-Muawwidhatain — The Two Protections",
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    transliteration: "Qul aʿūdhu bi-rabbil-falaq\nQul aʿūdhu bi-rabbin-nās",
    translation: "Say: I seek refuge with the Lord of the daybreak.\nSay: I seek refuge with the Lord of mankind.",
    context: "Recite Surah Al-Falaq and Surah An-Nas three times in the morning and evening for complete protection.",
    source: "Abu Dawud 5082, Tirmidhi 3575",
  },

  // ── After Prayer ─────────────────────────────────────────────
  {
    id: "prayer-1",
    category: "prayer",
    title: "Tasbih After Prayer",
    arabic: "سُبْحَانَ اللَّهِ — ٣٣\nاَلْحَمْدُ لِلَّهِ — ٣٣\nاللَّهُ أَكْبَرُ — ٣٣\nلَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "SubḥānAllāh (33×)\nAlḥamdulillāh (33×)\nAllāhu Akbar (33×)\nLā ilāha illAllāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ʿalā kulli shayʾin qadīr",
    translation: "Glory be to Allah (33×)\nAll praise is for Allah (33×)\nAllah is the Greatest (33×)\nNone has the right to be worshipped but Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things capable.",
    context: "Recite after every obligatory prayer. Whoever does this, his sins will be forgiven even if they are as plentiful as the foam of the sea.",
    source: "Muslim 597",
  },
  {
    id: "prayer-2",
    category: "prayer",
    title: "Dua After Every Prayer",
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allāhumma aʿinnī ʿalā dhikrika wa shukrika wa ḥusni ʿibādatik",
    translation: "O Allah, help me to remember You, to give thanks to You, and to worship You in the best manner.",
    context: "The Prophet ﷺ took Muadh ibn Jabal's hand and said: I love you. Do not forget to say this after every prayer.",
    source: "Abu Dawud 1522",
  },
  {
    id: "prayer-3",
    category: "prayer",
    title: "Seeking Refuge After Prayer",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْجُبْنِ وَأَعُوذُ بِكَ مِنَ الْبُخْلِ وَأَعُوذُ بِكَ مِنَ أَنْ أُرَدَّ إِلَى أَرْذَلِ الْعُمُرِ",
    transliteration: "Allāhumma innī aʿūdhu bika minal-jubni, wa aʿūdhu bika minal-bukhli, wa aʿūdhu bika min an uradda ilā ardhalil-ʿumur",
    translation: "O Allah, I seek refuge in You from cowardice, I seek refuge in You from miserliness, and I seek refuge in You from being returned to the worst part of old age.",
    context: "Read after every prayer to seek refuge from spiritual and worldly weaknesses.",
    source: "Bukhari 6374",
  },
];

export function getDuasByCategory(categoryId: string): Dua[] {
  return DUAS.filter(d => d.category === categoryId);
}

export function getDuaById(id: string): Dua | undefined {
  return DUAS.find(d => d.id === id);
}

export function getCategoryById(id: string): DuaCategory | undefined {
  return DUA_CATEGORIES.find(c => c.id === id);
}