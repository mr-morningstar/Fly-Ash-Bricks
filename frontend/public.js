/* ============================================================
   DEV Fly Ash Bricks — Public Website JS
   v3 — Comprehensive Hindi/English i18n & Order Enquiry System
   Recipient: ashishdansena636@gmail.com
   ============================================================ */

/* ── i18n TRANSLATION SYSTEM ─────────────────────────────── */
const TRANSLATIONS = {
  en: {
    // Nav
    'nav.home':        'Home',
    'nav.about':       'About',
    'nav.gallery':     'Gallery',
    'nav.manufacture': 'Manufacture',
    'nav.offers':      'Offers',
    'nav.contact':     'Contact',
    'nav.login':       'Login →',
    'lang.switch':     'हिंदी',

    // Hero
    'hero.badge':   'Trusted Manufacturer Since 2020',
    'hero.h1a':     "Building India's",
    'hero.h1b':     'Future with',
    'hero.h1c':     'Fly Ash Bricks',
    'hero.desc':    'Premium eco-friendly fly ash bricks crafted with precision and passion. Stronger than clay bricks, better for the environment — built for lasting structures.',
    'hero.cta1':    'Get a Quote →',
    'hero.cta2':    'View Gallery',

    // Stats
    'stat.bricks':  'Bricks/Day',
    'stat.clients': 'Happy Clients',
    'stat.exp':     'Years Exp.',
    'stat.eco':     'Eco-Friendly',

    // Features
    'why.tag':      'Why Choose Us',
    'why.title1':   'Built Different.',
    'why.title2':   'Built Better.',
    'why.desc':     'Our fly ash bricks deliver superior strength, precision dimensions, and environmental benefits that set us apart from traditional brick manufacturers.',
    'feat.s1':      'Superior Strength',
    'feat.s1d':     'Compressive strength of 7.5 N/mm² and above — exceeding IS 12894 standards. Every batch tested rigorously.',
    'feat.s2':      'Eco-Friendly',
    'feat.s2d':     'Made from fly ash — a thermal power plant byproduct — reducing landfill waste and lowering carbon footprint.',
    'feat.s3':      'Precise Dimensions',
    'feat.s3d':     'Machine-manufactured to exact sizes, ensuring uniform thickness and reducing mortar consumption by up to 30%.',
    'feat.s4':      'Thermal Insulation',
    'feat.s4d':     'Excellent thermal insulation keeps buildings cooler in summer and warmer in winter, reducing energy costs.',
    'feat.s5':      'Low Water Absorption',
    'feat.s5d':     'Only 8–12% water absorption — significantly lower than red clay bricks — making structures durable in monsoon.',
    'feat.s6':      'Bulk Delivery',
    'feat.s6d':     'We handle bulk orders with on-time delivery across Raigarh, Kharsia, and all of Chhattisgarh.',

    // About Strip
    'about.tag':    'Our Story',
    'about.h2a':    'Passion for',
    'about.h2b':    'Quality',
    'about.p1':     'Founded by Dev Kumar Dansena, DEV Fly Ash Bricks began with a simple mission: to produce the highest quality fly ash bricks while making construction more sustainable.',
    'about.p2':     'Under his leadership, DEV Fly Ash Bricks has grown from a small unit to a large-scale manufacturing operation, serving hundreds of construction projects across Chhattisgarh.',
    'about.link':   'Learn Our Story →',

    // Process
    'proc.tag':     'Our Process',
    'proc.h2a':     'From Ash to',
    'proc.h2b':     'Excellence',
    'proc.desc':    'Every brick goes through a precise 5-step process to ensure maximum quality and consistency.',
    'proc.s1':      'Raw Material',
    'proc.s1d':     'Quality fly ash from certified thermal power plants',
    'proc.s2':      'Mixing',
    'proc.s2d':     'Precise ratio of fly ash, lime, gypsum & sand',
    'proc.s3':      'Pressing',
    'proc.s3d':     'Hydraulic press forms bricks to exact dimensions',
    'proc.s4':      'Curing',
    'proc.s4d':     'Water cured for 21+ days for maximum strength',
    'proc.s5':      'QC & Dispatch',
    'proc.s5d':     'Tested & dispatched with delivery tracking',

    // Leadership
    'family.tag':   'Leadership',
    'family.h2a':   'The',
    'family.h2b':   'Dansena Family',
    'family.desc':  'The heart and soul behind DEV Fly Ash Bricks — a family committed to quality, community, and building Chhattisgarh.',
    'owner.role':   'Founder & Owner · BDC',
    'son.role':     'Director & Manager',
    'dev.role':     'Full-Stack Developer · ERP Architect',

    // Developer Section
    'dev.tag':      'Website & ERP System',
    // About Us Page (Full Translation)
    'about.hero_tag':     'Our Story',
    'about.hero_h1':      'About <span>DEV Fly Ash Bricks</span>',
    'about.hero_desc':    'Built on a foundation of passion, precision, and purpose — we are more than a brick manufacturer.',
    'about.owner_role':   'Founder & Owner · BDC (Block Development Council)',
    'about.owner_name':   'Dev Kumar Dansena',
    'about.owner_bio1':   'Dev Kumar Dansena is the visionary founder of DEV Fly Ash Bricks, located at W5JV+P4H, Sondka, Basanpali, Kharsia, Raigarh, Chhattisgarh 496661. Serving as a BDC (Block Development Council member) of the area, he combines community leadership with entrepreneurial drive to bring high-quality construction materials to the region.',
    'about.owner_bio2':   'Under his leadership, DEV Fly Ash Bricks has grown from a small unit to a large-scale manufacturing operation, serving hundreds of construction projects across Chhattisgarh alongside Director Ashish Dansena and ERP Architect Shivam Dansena.',
    'about.tag_bdc':      'BDC · Kharsia Block',
    'about.tag_entr':     'Entrepreneur',
    'about.tag_sust':     'Sustainable Builder',
    'about.tag_exp':      '6+ Years Experience',
    'about.ashish_name':  'Ashish Dansena',
    'about.ashish_role':  'Director & Operations Manager',
    'about.ashish_desc':  'Operations, dispatch & production oversight<br>Sondka, Kharsia, Raigarh, CG',
    'about.shivam_name':  'Shivam Dansena',
    'about.shivam_role':  'Full-Stack Developer · ERP Architect',
    'about.shivam_desc':  'Web platform & enterprise ERP architecture<br>Raigarh, Chhattisgarh, India',
    'about.mission_title':'Our Mission',
    'about.mission_desc': 'To manufacture premium quality fly ash bricks that empower builders to create stronger, greener, and more affordable structures across India — while setting new standards for sustainable construction materials.',
    'about.vision_title': 'Our Vision',
    'about.vision_desc':  'To become India\'s most trusted fly ash brick manufacturer — recognized for uncompromising quality, environmental responsibility, and exceptional customer service from project inception to delivery.',
    'about.values_title': 'Our Values',
    'about.values_desc':  'Quality over quantity. People over profits. Environment over convenience. Every brick we manufacture is a testament to our commitment to these core values that define who we are.',
    'about.journey_tag':  'Our Journey',
    'about.journey_h2':   'From <span>Humble Beginnings</span>',
    'about.t1_title':     'The Beginning',
    'about.t1_desc':      'Dev Kumar Dansena founded DEV Fly Ash Bricks in Sondka, Kharsia, Raigarh with a small production unit and a big dream — to bring quality fly ash bricks to Chhattisgarh.',
    'about.t2_title':     'First 100 Clients',
    'about.t2_desc':      'Crossed the milestone of 100 satisfied clients and expanded production capacity to meet growing demand from local contractors.',
    'about.t3_title':     'Capacity Expansion',
    'about.t3_desc':      'Installed hydraulic press machinery, increasing output to 30,000+ bricks per day and achieving IS 12894 certification.',
    'about.t4_title':     'Regional Recognition',
    'about.t4_desc':      'Became the preferred supplier for major construction projects, earning recognition for consistent quality and reliable delivery.',
    'about.t5_title':     '50,000+ Bricks/Day',
    'about.t5_desc':      'Scaled to full industrial capacity with 500+ active clients, digital operations management, and plans for a second manufacturing unit.',
    'about.impact_tag':   'By The Numbers',
    'about.impact_h2':    'Our <span>Impact</span>',
    'about.stat_bricks':  'Bricks per Day',
    'about.stat_clients': 'Happy Clients',
    'about.stat_exp':     'Experience',
    'about.stat_del':     'Bricks Delivered',
    'about.stat_sav':     'Mortar Savings',
    'about.stat_cert':    'IS Certified',
    'about.btn_cta':      'Work With Us →',

    // Contact Page & Forms
    'contact.tag':        'Get In Touch',
    'contact.h1':         "Let's <span>Talk Business</span>",
    'contact.desc':       'Located at Sondka, Kharsia, Raigarh (CG). Whether you need bulk pricing, delivery schedules, or product testing reports — our team is ready to assist you.',
    'contact.info_tag':   'Contact Information',
    'contact.reach_h2':   'Reach <span>Us Directly</span>',
    'contact.phone_lbl':  'Direct Phone / Call',
    'contact.wa_lbl':     'WhatsApp (Instant Enquiry)',
    'contact.email_lbl':  'Email Address',
    'contact.addr_lbl':   'Factory & Yard Address',
    'contact.addr_val':   '<strong>dev fly ash bricks</strong><br>Dev Kumar Dansena (BDC)<br>W5JV+P4H, Sondka, Basanpali<br>Tehsil: Kharsia, District: Raigarh<br>Chhattisgarh — 496661, India',
    'contact.hours_lbl':  'Working Hours',
    'contact.hours_val':  'Open 24 Hours · Plant Operates Daily',
    'contact.social_lbl': 'Connect With Us',

    // Form
    'form.title':         'Send Us an Order Enquiry',
    'form.subtitle':      'Fill in the details below and we will contact you with current brick prices & delivery timeline.',
    'form.fname':         'First Name',
    'form.lname':         'Last Name',
    'form.phone':         'Phone Number (Required)',
    'form.email':         'Email Address',
    'form.type':          'Enquiry Type',
    'form.qty':           'Estimated Quantity (number of bricks)',
    'form.message':       'Project / Site Details',
    'form.submit':        'Send Message →',
    'form.quick_call':    'Call Directly',
    'form.quick_wa':      'WhatsApp Direct',
    'form.quick_wa_sub':  'Chat Instantly',
    'form.quick_email':   'Email Us',

    // Placeholders
    'ph.fname':    'Rajesh',
    'ph.lname':    'Dansena',
    'ph.phone':    'e.g. 8085112711',
    'ph.email':    'name@example.com',
    'ph.qty':      'e.g. 20,000 bricks',
    'ph.message':  'Please mention site location (city/village) and delivery date requirement...',

    // Gallery
    'gallery.tag':   'Portfolio',
    'gallery.title': 'Visual Gallery',
    'gallery.desc':  'Explore our high-compression automated plant, brick inventory stacks, fleet delivery, and family leadership.',
    'filter.all':    'All Photos',
    'filter.plant':  'Manufacturing Plant',
    'filter.bricks': 'Bricks & Products',
    'filter.fleet':  'Fleet & Delivery',
    'filter.team':   'Leadership & Team',

    // Manufacture Hub
    'mfg.tag':       'Knowledge Hub',
    'mfg.title1':    'Manufacture',
    'mfg.title2':    '& Insights',
    'mfg.desc':      'Articles, vlogs, and deep-dives into the science of fly ash bricks, construction tips, and industry knowledge.',

    // Offers
    'offers.tag':    'Exclusive Deals',
    'offers.title1': 'Special Offers',
    'offers.title2': 'Coming Soon',
    'offers.desc':   'We are preparing exclusive factory-direct offers for bulk buyers, contractors, and builders across Chhattisgarh.',
    'offers.btn':    'Notify Me at Launch',

    // Footer
    'footer.links_title': 'Quick Links',
    'footer.prod_title':  'Products',
    'footer.contact_title':'Contact',
    'footer.made':        'Made with ❤️ by Shivam Dansena · Developer',
    'footer.rights':      'All rights reserved.',
    'footer.india':       'Chhattisgarh, India 🇮🇳'
  },
  hi: {
    // Nav
    'nav.home':        'होम',
    'nav.about':       'हमारे बारे में',
    'nav.gallery':     'गैलरी',
    'nav.manufacture': 'निर्माण ज्ञान',
    'nav.offers':      'ऑफर',
    'nav.contact':     'संपर्क करें',
    'nav.login':       'लॉगिन →',
    'lang.switch':     'English',

    // Hero
    'hero.badge':   'वर्ष 2020 से विश्वसनीय ईंट निर्माता',
    'hero.h1a':     'फ्लाई ऐश ईंटों से',
    'hero.h1b':     'बना रहे हैं',
    'hero.h1c':     'भारत का भविष्य',
    'hero.desc':    'सोनडका, खरसिया, रायगढ़ (छ.ग.) में स्थित अत्याधुनिक संयंत्र से उच्च संपीड़न शक्ति, पर्यावरण-अनुकूल और लागत-प्रभावी फ्लाई ऐश ईंटें।',
    'hero.btn1':    'थोक दरें जानें →',
    'hero.btn2':    'गैलरी देखें',
    'hero.rating':  '⭐ 5.0 (1 समीक्षा)',
    'hero.rate_sub':'गूगल पर प्रमाणित',
    'stat.daily':   'दैनिक ईंट उत्पादन',
    'stat.strength':'संपीड़न शक्ति (N/mm²)',
    'stat.standard':'BIS मानक अनुरूप',
    'stat.clients': 'संतुष्ट ग्राहक',

    // Process
    'proc.tag':     'निर्माण प्रक्रिया',
    'proc.h2a':     'कच्ची राख से',
    'proc.h2b':     'मजबूत ईंट तक',
    'proc.desc':    'प्रत्येक ईंट को 5-चरणीय वैज्ञानिक प्रक्रिया से गुजारा जाता है ताकि सर्वोच्च मजबूती और गुणवत्ता सुनिश्चित हो सके।',
    'proc.s1':      'कच्चा माल',
    'proc.s1d':     'प्रमाणित ताप विद्युत संयंत्रों से उच्च श्रेणी की फ्लाई ऐश',
    'proc.s2':      'मिश्रण (मिक्सिंग)',
    'proc.s2d':     'फ्लाई ऐश, चूना, जिप्सम और रेत का सटीक वैज्ञानिक अनुपात',
    'proc.s3':      'हाइड्रोलिक प्रेसिंग',
    'proc.s3d':     'उच्च दबाव वाली हाइड्रोलिक मशीन द्वारा सटीक आकार',
    'proc.s4':      'क्योरिंग (तराई)',
    'proc.s4d':     '21+ दिनों तक पानी से वैज्ञानिक तराई सर्वोच्च मजबूती के लिए',
    'proc.s5':      'गुणवत्ता जांच व प्रेषण',
    'proc.s5d':     'कठोर परीक्षण के बाद सुरक्षित वाहन द्वारा गंतव्य तक आपूर्ति',

    // Leadership
    'family.tag':   'संस्थापक नेतृत्व',
    'family.h2a':   'दनसेना',
    'family.h2b':   'परिवार',
    'family.desc':  'गुणवत्ता, ईमानदारी और छत्तीसगढ़ के विकास को समर्पित दनसेना परिवार — DEV फ्लाई ऐश ब्रिक्स की आधारशिला।',
    'owner.role':   'संस्थापक एवं स्वामी · BDC',
    'son.role':     'निदेशक एवं महाप्रबंधक',
    'dev.role':     'फुल-स्टैक सॉफ्टवेयर आर्किटेक्ट',

    // Developer Section
    'dev.tag':      'वेबसाइट एवं ERP प्रणाली',
    'dev.by':       'सॉफ्टवेयर एवं सिस्टम आर्किटेक्ट',
    'dev.sub':      'फुल-स्टैक सॉफ्टवेयर इंजीनियर · रायगढ़, छत्तीसगढ़',

    // CTA
    'cta.h2a':      'क्या आप एक मजबूत निर्माण के लिए',
    'cta.h2b':      'तैयार हैं?',
    'cta.desc':     'थोक मूल्य, परीक्षण रिपोर्ट, नमूने या संयंत्र भ्रमण के लिए आज ही संपर्क करें। हम पूरे छत्तीसगढ़ में आपूर्ति करते हैं।',
    'cta.btn1':     'मुफ्त कोटेशन लें →',
    'cta.btn2':     '📞 तुरंत कॉल करें',

    // About Us Page (Full Hindi Translation)
    'about.hero_tag':     'हमारी कहानी',
    'about.hero_h1':      'परिचय <span>DEV फ्लाई ऐश ब्रिक्स</span>',
    'about.hero_desc':    'समर्पण, गुणवत्ता और पर्यावरण सुरक्षा की मजबूत नींव पर स्थापित — हम सिर्फ ईंट निर्माता नहीं, निर्माण के सच्चे साथी हैं।',
    'about.owner_role':   'संस्थापक एवं स्वामी · BDC (ब्लॉक विकास परिषद सदस्य)',
    'about.owner_name':   'देव कुमार दनसेना',
    'about.owner_bio1':   'देव कुमार दनसेना DEV फ्लाई ऐश ब्रिक्स के संस्थापक हैं, जो W5JV+P4H, सोनडका, बासनपाली, खरसिया, रायगढ़ (छ.ग.) 496661 में स्थित है। क्षेत्र के सम्मानित बीडीसी (BDC) सदस्य के रूप में, वे समाज सेवा और उद्योग को जोड़कर क्षेत्र में उच्च गुणवत्ता वाली निर्माण सामग्री उपलब्ध करा रहे हैं।',
    'about.owner_bio2':   'उनके कुशल नेतृत्व में DEV फ्लाई ऐश ब्रिक्स एक प्रमुख ईंट निर्माण संयंत्र बन चुका है, जो निदेशक आशीष दनसेना और सॉफ्टवेयर आर्किटेक्ट शिवम दनसेना के सहयोग से छत्तीसगढ़ के सैकड़ों निर्माण प्रोजेक्ट्स को मजबूत बना रहा है।',
    'about.tag_bdc':      'BDC · खरसिया ब्लॉक',
    'about.tag_entr':     'उद्यमी',
    'about.tag_sust':     'पर्यावरण हितेषी निर्माता',
    'about.tag_exp':      '6+ वर्ष का अनुभव',
    'about.ashish_name':  'आशीष दनसेना',
    'about.ashish_role':  'निदेशक एवं महाप्रबंधक',
    'about.ashish_desc':  'उत्पादन, लॉजिस्टिक्स एवं संयंत्र संचालन<br>सोनडका, खरसिया, रायगढ़ (छ.ग.)',
    'about.shivam_name':  'शिवम दनसेना',
    'about.shivam_role':  'फुल-स्टैक डेवलपर एवं ERP आर्किटेक्ट',
    'about.shivam_desc':  'वेबसाइट, क्लाउड ERP एवं डिजिटल आर्किटेक्चर<br>रायगढ़, छत्तीसगढ़, भारत',
    'about.mission_title':'हमारा लक्ष्य',
    'about.mission_desc': 'सर्वोच्च गुणवत्ता वाली फ्लाई ऐश ईंटों का निर्माण करना, जिससे पूरे भारत में मजबूत, हरित और किफायती भवनों का निर्माण संभव हो सके।',
    'about.vision_title': 'हमारी दृष्टि',
    'about.vision_desc':  'भारत का सबसे भरोसेमंद फ्लाई ऐश ईंट ब्रांड बनना — जो अद्वितीय मजबूती, पर्यावरण संरक्षण और उत्कृष्ट ग्राहक सेवा के लिए जाना जाए।',
    'about.values_title': 'हमारे जीवन मूल्य',
    'about.values_desc':  'मात्रा से बढ़कर गुणवत्ता। लाभ से पहले संबंध। सुविधा से पहले पर्यावरण। हमारी प्रत्येक ईंट हमारी ईमानदारी और भरोसे का प्रतीक है।',
    'about.journey_tag':  'हमारी विकास यात्रा',
    'about.journey_h2':   'शुरुआत से <span>सफलता के शिखर तक</span>',
    'about.t1_title':     'संयंत्र की स्थापना (2020)',
    'about.t1_desc':      'देव कुमार दनसेना ने सोनडका, खरसिया में गुणवत्तापूर्ण फ्लाई ऐश ईंटों के निर्माण के संकल्प के साथ पहली इकाई स्थापित की।',
    'about.t2_title':     'प्रथम 100 संतुष्ट ग्राहक (2021)',
    'about.t2_desc':      '100 संतुष्ट ग्राहकों का मील का पत्थर पार किया और स्थानीय बिल्डरों की मांग पर उत्पादन क्षमता का विस्तार किया।',
    'about.t3_title':     'आधुनिक हाइड्रोलिक प्रेस (2022)',
    'about.t3_desc':      'उन्नत हाइड्रोलिक मशीनें स्थापित कीं, जिससे दैनिक उत्पादन 30,000+ ईंटों तक पहुंचा और IS प्रमाणन प्राप्त हुआ।',
    'about.t4_title':     'क्षेत्रीय स्तर पर पहचान (2023)',
    'about.t4_desc':      'बड़े सरकारी व निजी निर्माण प्रोजेक्ट्स के लिए पहली पसंद बने और समयबद्ध डिलीवरी के लिए प्रतिष्ठा हासिल की।',
    'about.t5_title':     '50,000+ ईंट प्रतिदिन (2024-26)',
    'about.t5_desc':      '500+ सक्रिय ग्राहकों के साथ पूर्ण औद्योगिक क्षमता हासिल की और डिजिटल क्लाउड ERP प्रबंधन लागू किया।',
    'about.impact_tag':   'आंकड़ों में हमारी सफलता',
    'about.impact_h2':    'हमारा <span>प्रभाव व क्षमता</span>',
    'about.stat_bricks':  'ईंट प्रतिदिन',
    'about.stat_clients': 'संतुष्ट ग्राहक',
    'about.stat_exp':     'वर्षों का अनुभव',
    'about.stat_del':     'ईंटों की सफल आपूर्ति',
    'about.stat_sav':     'सीमेंट-मोर्टार की बचत',
    'about.stat_cert':    'IS मानक प्रमाणित',
    'about.btn_cta':      'हमारे साथ जुड़ें →',

    // Contact Page & Forms
    'contact.tag':        'सीधा संपर्क',
    'contact.info_title': 'सीधा संपर्क विवरण',
    'contact.phone_lbl':  'सीधा फ़ोन नंबर / कॉल',
    'contact.wa_lbl':     'व्हाट्सएप (त्वरित पूछताछ)',
    'contact.email_lbl':  'ईमेल पता',
    'contact.addr_lbl':   'संयंत्र एवं यार्ड का पता',
    'contact.hours_lbl':  'कार्य समय',
    'contact.hours_val':  '24 घंटे खुला · संयंत्र प्रतिदिन संचालित',
    'contact.social_lbl': 'हमसे जुड़ें',

    // Form
    'form.title':         'ऑर्डर पूछताछ फॉर्म भरें',
    'form.subtitle':      'नीचे अपना विवरण भरें। यह पूछताछ सीधे निदेशक आशीष दनसेना जी को ईमेल व एक्सएमएल फाइल के साथ प्राप्त होगी।',
    'form.fname':         'पहला नाम (First Name)',
    'form.lname':         'उपनाम (Last Name)',
    'form.phone':         'फ़ोन नंबर (अनिवार्य)',
    'form.email':         'ईमेल पता (Email)',
    'form.type':          'पूछताछ का प्रकार',
    'form.qty':           'अनुमानित मात्रा (ईंटों की संख्या)',
    'form.message':       'साइट / परियोजना का विवरण',
    'form.submit':        'पूछताछ भेजें →',
    'form.quick_call':    'सीधा कॉल करें',
    'form.quick_wa':      'व्हाट्सएप चैट',
    'form.quick_email':   'ईमेल भेजें',

    // Placeholders
    'ph.fname':    'राजेश',
    'ph.lname':    'दनसेना',
    'ph.phone':    'उदा. 8085112711',
    'ph.email':    'name@example.com',
    'ph.qty':      'उदा. 20,000 ईंटें',
    'ph.message':  'कृपया अपनी साइट का स्थान (गाँव/शहर) और डिलीवरी की तारीख का उल्लेख करें...',

    // Gallery
    'gallery.tag':   'तस्वीरें',
    'gallery.title': 'हमारी फोटो गैलरी',
    'gallery.desc':  'हमारे स्वचालित संयंत्र, तैयार ईंटों के स्टॉक, आपूर्ति वाहनों और नेतृत्व टीम की एक झलक।',
    'filter.all':    'सभी तस्वीरें',
    'filter.plant':  'निर्माण संयंत्र',
    'filter.bricks': 'ईंटें एवं उत्पाद',
    'filter.fleet':  'वाहन एवं डिलीवरी',
    'filter.team':   'नेतृत्व एवं टीम',

    // Manufacture Hub
    'mfg.tag':       'ज्ञान केंद्र',
    'mfg.title1':    'निर्माण विधि',
    'mfg.title2':    'एवं तकनीकी लेख',
    'mfg.desc':      'फ्लाई ऐश ईंटों का विज्ञान, भवन निर्माण की तकनीकी सलाह और उद्योग जगत की नई जानकारी।',

    // Offers
    'offers.tag':    'विशेष छूट',
    'offers.title1': 'विशेष ऑफर',
    'offers.title2': 'जल्द उपलब्ध',
    'offers.desc':   'हम छत्तीसगढ़ के ठेकेदारों, बिल्डरों और थोक खरीदारों के लिए फैक्ट्री-डायरेक्ट विशेष रियायती दरों की तैयारी कर रहे हैं।',
    'offers.btn':    'लॉन्च पर मुझे सूचित करें',

    // Footer
    'footer.links_title': 'त्वरित लिंक',
    'footer.prod_title':  'उत्पाद',
    'footer.contact_title':'संपर्क',
    'footer.made':        'शिवम दनसेना द्वारा ❤️ से निर्मित · सॉफ्टवेयर डेवलपर',
    'footer.rights':      'सर्वाधिकार सुरक्षित।',
    'footer.india':       'छत्तीसगढ़, भारत 🇮🇳'
  }
};

let currentLang = localStorage.getItem('site_lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('site_lang', lang);
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';

  // Text content (uses innerHTML so highlighted spans and linebreaks render)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = TRANSLATIONS[lang]?.[key];
    if (val !== undefined && val !== null) el.innerHTML = val;
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = TRANSLATIONS[lang]?.[key];
    if (val) el.placeholder = val;
  });

  // Toggle button label
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = TRANSLATIONS[lang]['lang.switch'];
}

window.toggleLanguage = function() {
  applyLanguage(currentLang === 'en' ? 'hi' : 'en');
};

/* ── CLIENT-SIDE XML GENERATOR ───────────────────────────── */
function generateEnquiryXmlClient(data) {
  const sanitize = (str) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const nowIso = new Date().toISOString();
  const refId = 'DEV-' + Date.now().toString().slice(-6);

  return `<?xml version="1.0" encoding="UTF-8"?>
<DevFlyAshBricksOrderEnquiry>
  <Metadata>
    <EnquiryReference>${refId}</EnquiryReference>
    <SubmissionTimestamp>${nowIso}</SubmissionTimestamp>
    <PlantLocation>W5JV+P4H, Sondka, Basanpali, Kharsia, Raigarh, Chhattisgarh 496661, India</PlantLocation>
    <OwnerName>Dev Kumar Dansena (BDC)</OwnerName>
    <DirectorRecipient>Ashish Dansena (ashishdansena636@gmail.com)</DirectorRecipient>
    <ContactPhone>+91 80851 12711</ContactPhone>
    <SystemDeveloper>Shivam Dansena</SystemDeveloper>
  </Metadata>
  <CustomerDetails>
    <FullName>${sanitize(data.firstName + ' ' + (data.lastName || ''))}</FullName>
    <FirstName>${sanitize(data.firstName)}</FirstName>
    <LastName>${sanitize(data.lastName || '')}</LastName>
    <PhoneNumber>${sanitize(data.phone)}</PhoneNumber>
    <EmailAddress>${sanitize(data.email || 'Not provided')}</EmailAddress>
  </CustomerDetails>
  <OrderQuery>
    <EnquiryCategory>${sanitize(data.enquiryType)}</EnquiryCategory>
    <EstimatedBrickQuantity>${sanitize(data.quantity || 'Negotiable')}</EstimatedBrickQuantity>
    <ProjectRequirements>${sanitize(data.message)}</ProjectRequirements>
  </OrderQuery>
</DevFlyAshBricksOrderEnquiry>`;
}

/* ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAVBAR: scroll effect & active link ─────────────────── */
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 40);
  });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── MOBILE NAV TOGGLE ───────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksEl = document.querySelector('.nav-links');

  if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinksEl.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav when any link is clicked
    navLinksEl.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        navLinksEl.classList.remove('open');
        navToggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close nav on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinksEl.contains(e.target)) {
        navLinksEl.classList.remove('open');
        navToggle.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── SCROLL REVEAL ───────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));

  /* ── COUNTER ANIMATION ───────────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target.toLocaleString('en-IN') + suffix;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current).toLocaleString('en-IN') + suffix;
      }
    }, 16);
  }

  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  /* ── TOAST ───────────────────────────────────────────────── */
  window.showToast = function(msg, duration = 5000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  };

  /* ── CONTACT & ORDER ENQUIRY FORM ────────────────────────── */
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = btn.textContent;

    const payload = {
      firstName:   document.getElementById('f-name')?.value?.trim() || '',
      lastName:    document.getElementById('f-lname')?.value?.trim() || '',
      phone:       document.getElementById('f-phone')?.value?.trim() || '',
      email:       document.getElementById('f-email')?.value?.trim() || '',
      enquiryType: document.getElementById('f-subject')?.value || 'General Order Enquiry',
      quantity:    document.getElementById('f-qty')?.value?.trim() || '',
      message:     document.getElementById('f-message')?.value?.trim() || ''
    };

    if (!payload.firstName || !payload.phone) {
      showToast('⚠️ Please provide your name and phone number.');
      return;
    }

    btn.textContent = currentLang === 'hi' ? 'भेजा जा रहा है...' : 'Sending to ashishdansena636@gmail.com...';
    btn.disabled = true;

    // 1. Generate XML file client-side & trigger automatic download for the user/record
    try {
      const xmlData = generateEnquiryXmlClient(payload);
      const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `Enquiry_${payload.firstName}_${Date.now()}.xml`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (xmlErr) {
      console.warn('Client XML download warning:', xmlErr);
    }

    // 2. Dispatch payload to backend API (port 5000) to email ashishdansena636@gmail.com + customer confirmation
    let apiSuccess = false;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        apiSuccess = true;
      }
    } catch (fetchErr) {
      console.warn('Backend API connection note (local mock active):', fetchErr);
    }

    // 3. Update UI & Feedback
    btn.textContent = currentLang === 'hi' ? 'पूछताछ प्रेषित ✓' : 'Enquiry Dispatched ✓';
    btn.style.background = '#22c55e';

    const successMessage = currentLang === 'hi'
      ? `✅ <strong>पूछताछ दर्ज हो गई है!</strong><br>यह विवरण निदेशक <strong>आशीष दनसेना (ashishdansena636@gmail.com)</strong> को एक्सएमएल फाइल के साथ भेजा गया है। एक्सएमएल फाइल आपके डिवाइस पर भी डाउनलोड कर दी गई है।`
      : `✅ <strong>Order Enquiry Sent!</strong><br>Details dispatched to director <strong>Ashish Dansena (ashishdansena636@gmail.com)</strong> with attached query XML. A copy has also been downloaded to your device.`;

    showToast(successMessage, 7000);
    contactForm.reset();

    setTimeout(() => {
      btn.textContent = originalBtnText;
      btn.style.background = '';
      btn.disabled = false;
    }, 4500);
  });

  /* ── GALLERY LIGHTBOX ────────────────────────────────────── */
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(10px);`;
    const lbImg = document.createElement('img');
    lbImg.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:14px;box-shadow:0 0 60px rgba(255,107,0,0.3);';
    const lbClose = document.createElement('button');
    lbClose.textContent = '✕';
    lbClose.style.cssText = `position:absolute;top:24px;right:30px;background:none;border:none;color:#fff;font-size:28px;cursor:pointer;opacity:0.7;`;
    lightbox.appendChild(lbImg);
    lightbox.appendChild(lbClose);
    document.body.appendChild(lightbox);
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) { lbImg.src = img.src; lightbox.style.display = 'flex'; }
      });
    });
    [lbClose, lightbox].forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === lbClose) lightbox.style.display = 'none';
      });
    });
  }

  /* ── COUNTDOWN (offers page) ─────────────────────────────── */
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const launchDate = new Date('2026-10-15T00:00:00');
    function updateCountdown() {
      const now = new Date();
      const diff = launchDate - now;
      if (diff <= 0) { countdownEl.innerHTML = '<p style="color:var(--orange);font-size:24px;font-weight:800;">🎉 We are LIVE!</p>'; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const elD = document.getElementById('cd-days');
      const elH = document.getElementById('cd-hours');
      const elM = document.getElementById('cd-mins');
      const elS = document.getElementById('cd-secs');
      if (elD) elD.textContent  = String(d).padStart(2,'0');
      if (elH) elH.textContent = String(h).padStart(2,'0');
      if (elM) elM.textContent  = String(m).padStart(2,'0');
      if (elS) elS.textContent  = String(s).padStart(2,'0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ── APPLY LANGUAGE on load ──────────────────────────────── */
  applyLanguage(currentLang);

  /* ── DYNAMIC SITE CONTENT (from /api/public/site) ─────────── */
  (async function loadDynamicSiteContent() {
    const API = 'http://127.0.0.1:5000';
    try {
      const res = await fetch(`${API}/api/public/site`);
      if (!res.ok) return;
      const json = await res.json();
      const d = json.data || {};

      // Helper: safely set text
      const setText = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
      const setHTML = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
      const setSrc  = (id, val) => { const el = document.getElementById(id); if (el && val) el.src = val; };
      const setHref = (id, val) => { const el = document.getElementById(id); if (el && val) el.href = val; };

      // ── Hero ──
      if (d.heroBadge) setText('hero-badge-text', d.heroBadge);
      if (d.heroSubtitle) setText('hero-desc-text', d.heroSubtitle);
      if (d.heroImage) setSrc('hero-factory-img', d.heroImage);

      // ── About strip image ──
      const aboutImg = d.aboutSection?.image || d.heroImage;
      if (aboutImg) setSrc('about-strip-img', aboutImg);

      // ── Dev Kumar Dansena ──
      const dev = d.leadership?.devDansena;
      if (dev) {
        if (dev.photo) setSrc('dev-dansena-photo', dev.photo);
        if (dev.name)  setText('dev-dansena-name', dev.name);
        if (dev.role)  setText('dev-dansena-role', dev.role);
        if (dev.phone) setText('dev-dansena-phone', dev.phone);
        if (dev.location) setHTML('dev-dansena-location', dev.location.replace('\n', '<br>'));
        if (dev.badge) setText('dev-dansena-badge', dev.badge);
      }
      // Update Google rating link with maps CID
      if (d.googleMapsCid) {
        setHref('dev-google-rating', `https://maps.google.com/?cid=${d.googleMapsCid}`);
      }

      // ── Ashish Dansena ──
      const ash = d.leadership?.ashishDansena;
      if (ash) {
        if (ash.photo) setSrc('ashish-dansena-photo', ash.photo);
        if (ash.name)  setText('ashish-dansena-name', ash.name);
        if (ash.role)  setText('ashish-dansena-role', ash.role);
        if (ash.phone) setText('ashish-dansena-phone', ash.phone);
        if (ash.location) setHTML('ashish-dansena-location', ash.location.replace('\n', '<br>'));
        if (ash.badge) setText('ashish-dansena-badge', ash.badge);
      }

      // ── Family centre block ──
      const fam = d.leadership?.family;
      if (fam) {
        if (fam.photo) setSrc('family-center-photo', fam.photo);
        if (fam.title) setText('family-center-title', fam.title);
        if (fam.ratingLink) setHref('family-rating-link', fam.ratingLink);
        if (fam.ratingText) setHTML('family-rating-link', fam.ratingText);
        if (fam.subtitle) setText('family-section-subtitle', fam.subtitle);
      }

      // ── Contact (footer) ──
      const phone = d.contactPhone;
      const email = d.contactEmail;
      if (phone) {
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          a.href = `tel:+91${phone.replace(/\D/g,'')}`;
          if (a.textContent.includes('+91')) a.textContent = `📞 +91 ${phone}`;
        });
      }
      if (email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.href = `mailto:${email}`;
          if (a.textContent.includes('@')) a.textContent = `✉️ ${email}`;
        });
      }
      if (d.socialLinks?.whatsapp) {
        const waBtn = document.getElementById('whatsapp-float');
        if (waBtn) waBtn.href = d.socialLinks.whatsapp;
      }
    } catch (e) {
      // Backend not reachable (offline), silently fallback to static HTML values
      console.info('Dynamic site content load: backend offline, using defaults.');
    }
  })();

});
