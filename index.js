/**
 * Cream X Emirates — WhatsApp AI Order Bot
 * Step-by-step guided conversation, feels human
 * Languages: English, Tamil, Malayalam, Hindi, Kannada
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs   = require('fs');
const path = require('path');

// QR code image path (place your payment QR as payment-qr.jpg in the bot folder)
const QR_IMAGE_PATH = path.join(__dirname, 'payment-qr.jpg');
const ShopifyAPI = require('./shopify.js');

// ─────────────────────────────────────────────
// SHOPIFY SETUP
// ─────────────────────────────────────────────
const shopify = (process.env.SHOP_DOMAIN && process.env.ACCESS_TOKEN)
  ? new ShopifyAPI(process.env.SHOP_DOMAIN, process.env.ACCESS_TOKEN)
  : null;

// Map product id → your Shopify variant ID (set in .env)
const VARIANT_MAP = {
  1: process.env.VARIANT_CREAM_1,
  2: process.env.VARIANT_CREAM_2,
  3: process.env.VARIANT_CREAM_3,
  4: process.env.VARIANT_SUNSCREEN,
  5: process.env.VARIANT_LOTION,
  6: process.env.VARIANT_LIPBALM,
  7: process.env.VARIANT_FACEWASH,
};

// ─────────────────────────────────────────────
// TYPING SIMULATION — feels like a real person
// ─────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function humanReply(msg, text) {
  const chat = await msg.getChat();
  await chat.sendStateTyping();
  const words = text.split(' ').length;
  const delay = Math.min(Math.max((words / 220) * 60000, 900), 3200);
  await sleep(delay);
  await chat.clearState();
  await msg.reply(text);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─────────────────────────────────────────────
// LANGUAGE MENU — shown first to every customer
// ─────────────────────────────────────────────
const LANG_MENU =
  `🌸 *Welcome to Cream X Emirates!*\n\n` +
  `Please choose your language:\n\n` +
  `1️⃣  English\n` +
  `2️⃣  தமிழ்  (Tamil)\n` +
  `3️⃣  മലയാളം  (Malayalam)\n` +
  `4️⃣  हिंदी  (Hindi)\n` +
  `5️⃣  ಕನ್ನಡ  (Kannada)\n\n` +
  `_Just reply with 1, 2, 3, 4 or 5_ 👇`;

const LANG_MAP = { '1': 'en', '2': 'ta', '3': 'ml', '4': 'hi', '5': 'kn' };

// ─────────────────────────────────────────────
// ALL MESSAGES — 5 languages
// ─────────────────────────────────────────────
const LANG = {

  // ══════════════════════
  // ENGLISH
  // ══════════════════════
  en: {
    name: 'English',

    greet: [
      `Hey! 👋 I'm *Sarah* from *Cream X Emirates*.\nI'll help you place your order in just a few easy steps 😊`,
      `Hi there! 💖 Welcome! I'm *Sarah*, your order assistant at *Cream X Emirates*.\nLet's get your order ready in a minute! 🌸`,
      `Hello! 🌸 Great to have you here! I'm *Sarah* from the *Cream X Emirates* team.\nReady to place your order? Let's go! 😊`,
    ],

    menu:
      `🛍️ *Our Products — Choose One:*\n\n` +
      `💖 *Cream X Emirates*\n` +
      `   *1️⃣*  1 Piece    —  ₹699\n` +
      `   *2️⃣*  2 Pieces  —  ₹1299  _(Save ₹99)_ 🔥\n` +
      `   *3️⃣*  3 Pieces  —  ₹2000  _(Save ₹97)_ 🔥\n\n` +
      `☀️ *4️⃣*  Sunscreen      —  ₹499\n` +
      `🧴 *5️⃣*  Body Lotion   —  ₹699\n` +
      `💄 *6️⃣*  Lip Balm        —  ₹399\n` +
      `🫧 *7️⃣*  Face Wash      —  ₹450\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚚 COD available | Delivery 4–5 days\n` +
      `⏳ Today's special offer only!\n\n` +
      `_Reply with the number (1–7) to select_ 👇`,

    productPicked: [
      (p) => `✅ *${p.label}* — ₹${p.price}\nGreat pick! Let's get your delivery details. 📦\n\n*Step 1 of 4* — What's your *full name*? 📝`,
      (p) => `💖 Nice choice! *${p.label}* — ₹${p.price}\nQuick and easy — just 4 steps!\n\n*Step 1 of 4* — Your *full name* please? 📝`,
      (p) => `🌸 *${p.label}* — ₹${p.price} added!\nLet me grab your details real quick!\n\n*Step 1 of 4* — What's your *name*? 📝`,
    ],

    ackName: [
      (n) => `Nice to meet you, *${n}*! 😊\n\n*Step 2 of 4* — What's your *phone number*? 📱`,
      (n) => `Got it, *${n}*! 👍\n\n*Step 2 of 4* — Your *WhatsApp / phone number*? 📱`,
      (n) => `Perfect, *${n}*! 🌸\n\n*Step 2 of 4* — Your *contact number*? 📱`,
    ],

    ackPhone: [
      `Noted! 📱\n\n*Step 3 of 4* — Your *full delivery address*?\n_(House no, Street, Area, City)_ 📍`,
      `Got your number! ✅\n\n*Step 3 of 4* — Where should we deliver?\n_(Street, Area, City)_ 📍`,
      `Perfect! 😊\n\n*Step 3 of 4* — Your *delivery address* please? 📍`,
    ],

    ackAddress: [
      `Almost done! 🙌\n\n*Step 4 of 4 (last one!)* — Your *pincode*? 📮`,
      `Great! Just one more!\n\n*Step 4 of 4* — What's your *pincode*? 📮`,
      `We're almost there! 😊\n\n*Step 4 of 4* — *Pincode*? 📮`,
    ],

    paymentMsg: (s) =>
      `✨ *Almost done, ${s.name}!*\n\n` +
      `Here's your order:\n` +
      `🛍️  ${s.product.label}\n` +
      `💰  ₹${s.product.price}\n` +
      `📍  ${s.address}, ${s.pincode}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*How would you like to pay?*\n\n` +
      `💳 *1 — Online Payment*\n` +
      `Pay ₹${s.product.price} now & send screenshot ✅\n\n` +
      `📦 *2 — Cash on Delivery*\n` +
      `₹99 advance + ₹${s.product.price} on delivery\n` +
      `Total: ₹${s.product.price + 99}\n\n` +
      `_Reply *1* or *2* to confirm_ 👇`,

    upiMsg: (s) =>
      `💳 *Online Payment*\n\n` +
      `Please pay *₹${s.product.price}* to:\n\n` +
      `📲 UPI ID: *${process.env.UPI_ID || 'your-upi@bank'}*\n\n` +
      `After paying, send your *payment screenshot* here 📸\n` +
      `I'll confirm your order right away! 😊`,

    awaitSS: `📸 Just send me your *payment screenshot* and I'll confirm immediately! 😊`,

    orderConfirmed: (s, pay) =>
      `🎉✨ *ORDER CONFIRMED!* ✨🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦  *${s.product.label}*\n` +
      `👤  ${s.name}\n` +
      `📱  ${s.phone}\n` +
      `📍  ${s.address}\n` +
      `📮  ${s.pincode}\n` +
      `💰  ${pay === 'COD'
        ? `Pay ₹${s.product.price + 99} on delivery\n    _(₹99 advance + ₹${s.product.price})_`
        : `Online payment ₹${s.product.price} ✅`}\n` +
      `🚚  Delivery in *4–5 days*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Thank you so much, *${s.name}*! 🌸\n` +
      `Our team will call you to confirm your delivery.\n\n` +
      `Questions? Just message us anytime! 😊\n` +
      `_Cream X Emirates — xemirates.in_`,

    offTopic: [
      `I'm here to help you with orders! 😊 Want to see our products?`,
      `Happy to help! Shall we place an order? Just say *hi* to start 🌸`,
    ],
    invalid: `Hmm, I didn't catch that 😊 Please reply with a number *1 to 7*.`,
    langErr: `Please reply with *1, 2, 3, 4 or 5* to choose your language 😊`,
  },

  // ══════════════════════
  // TAMIL
  // ══════════════════════
  ta: {
    name: 'Tamil',

    greet: [
      `ஹாய்! 👋 நான் *Sarah*, *Cream X Emirates* இல் இருந்து.\nசில எளிய படிகளில் ஆர்டர் செய்ய உதவுகிறேன் 😊`,
      `வணக்கம்! 💖 *Sarah* இங்கே — உங்கள் ஆர்டரை சேர்த்து தர உதவுகிறேன்! 🌸`,
    ],

    menu:
      `🛍️ *எங்கள் தயாரிப்புகள் — ஒன்றை தேர்வு செய்யுங்கள்:*\n\n` +
      `💖 *Cream X Emirates*\n` +
      `   *1️⃣*  1 பீஸ்    —  ₹699\n` +
      `   *2️⃣*  2 பீஸ்   —  ₹1299  _(₹99 சேமிப்பு)_ 🔥\n` +
      `   *3️⃣*  3 பீஸ்   —  ₹2000  _(₹97 சேமிப்பு)_ 🔥\n\n` +
      `☀️ *4️⃣*  சன்ஸ்க்ரீன்      —  ₹499\n` +
      `🧴 *5️⃣*  பாடி லோஷன்   —  ₹699\n` +
      `💄 *6️⃣*  லிப் பாம்        —  ₹399\n` +
      `🫧 *7️⃣*  ஃபேஸ் வாஷ்    —  ₹450\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚚 COD கிடைக்கும் | 4–5 நாட்களில் டெலிவரி\n` +
      `⏳ இன்றைய சிறப்பு சலுகை மட்டுமே!\n\n` +
      `_எண் (1–7) அனுப்பி தேர்வு செய்யுங்கள்_ 👇`,

    productPicked: [
      (p) => `✅ *${p.label}* — ₹${p.price}\nசிறந்த தேர்வு! கொஞ்சம் விவரங்கள் மட்டுமே! 📦\n\n*படி 1 / 4* — உங்கள் *முழு பெயர்*? 📝`,
      (p) => `💖 *${p.label}* — ₹${p.price}\n4 படிகளில் முடித்துவிடலாம்!\n\n*படி 1 / 4* — *பெயர்* சொல்லுங்கள்? 📝`,
    ],

    ackName:    [(n) => `*${n}*, பழகி மகிழ்ச்சி! 😊\n\n*படி 2 / 4* — *தொலைபேசி எண்*? 📱`,
                 (n) => `சரி, *${n}*! 👍\n\n*படி 2 / 4* — *போன் நம்பர்*? 📱`],
    ackPhone:   [`அடுத்தது!\n\n*படி 3 / 4* — *டெலிவரி முகவரி*?\n_(வீடு, தெரு, பகுதி, நகரம்)_ 📍`,
                 `நல்லது! 😊\n\n*படி 3 / 4* — *முகவரி*? 📍`],
    ackAddress: [`கிட்டத்தட்ட முடிந்தது! 🙌\n\n*படி 4 / 4 (கடைசி!)* — *பின்கோட்*? 📮`,
                 `சூப்பர்! இன்னொரு விவரம்!\n\n*படி 4 / 4* — *பின்கோட்*? 📮`],

    paymentMsg: (s) =>
      `✨ *கிட்டத்தட்ட முடிந்தது, ${s.name}!*\n\n` +
      `உங்கள் ஆர்டர்:\n` +
      `🛍️  ${s.product.label}\n` +
      `💰  ₹${s.product.price}\n` +
      `📍  ${s.address}, ${s.pincode}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*பேமெண்ட் முறை தேர்வு செய்யுங்கள்:*\n\n` +
      `💳 *1 — ஆன்லைன் பேமெண்ட்*\n` +
      `₹${s.product.price} செலுத்தி screenshot அனுப்புங்கள் ✅\n\n` +
      `📦 *2 — கேஷ் ஆன் டெலிவரி*\n` +
      `₹99 முன்பணம் + டெலிவரியில் ₹${s.product.price}\n` +
      `மொத்தம்: ₹${s.product.price + 99}\n\n` +
      `_*1* அல்லது *2* அனுப்புங்கள்_ 👇`,

    upiMsg: (s) =>
      `💳 *ஆன்லைன் பேமெண்ட்*\n\n` +
      `*₹${s.product.price}* இங்கே செலுத்துங்கள்:\n\n` +
      `📲 UPI ID: *${process.env.UPI_ID || 'your-upi@bank'}*\n\n` +
      `பேமெண்ட் பிறகு *screenshot* அனுப்புங்கள் 📸\n` +
      `உடனே confirm செய்கிறேன்! 😊`,

    awaitSS: `📸 *Payment screenshot* அனுப்புங்கள், உடனே confirm செய்கிறேன்! 😊`,

    orderConfirmed: (s, pay) =>
      `🎉✨ *ஆர்டர் CONFIRMED!* ✨🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦  *${s.product.label}*\n` +
      `👤  ${s.name}\n` +
      `📱  ${s.phone}\n` +
      `📍  ${s.address}\n` +
      `📮  ${s.pincode}\n` +
      `💰  ${pay === 'COD'
        ? `டெலிவரியில் ₹${s.product.price + 99} செலுத்துங்கள்`
        : `ஆன்லைன் ₹${s.product.price} ✅`}\n` +
      `🚚  *4–5 நாட்களில் டெலிவரி*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `மிக்க நன்றி, *${s.name}*! 🌸\n` +
      `எங்கள் team உங்களை அழைப்பார்கள்.\n` +
      `கேள்வி இருந்தால் இங்கே message செய்யுங்கள்! 😊\n` +
      `_Cream X Emirates — xemirates.in_`,

    offTopic: [`ஆர்டர் செய்ய உதவ இங்கே இருக்கிறேன்! 😊 *hi* என்று அனுப்பி தொடங்குங்கள்.`],
    invalid:  `புரியவில்லை 😊 *1 முதல் 7* வரை ஒரு எண் அனுப்புங்கள்.`,
    langErr:  `*1, 2, 3, 4 அல்லது 5* என்று அனுப்பி மொழி தேர்வு செய்யுங்கள் 😊`,
  },

  // ══════════════════════
  // MALAYALAM
  // ══════════════════════
  ml: {
    name: 'Malayalam',

    greet: [
      `ഹലോ! 👋 ഞാൻ *Sarah*, *Cream X Emirates* ൽ നിന്ന്.\nചെറിയ ഏതാനും ചുവടുകളിൽ ഓർഡർ ചെയ്യാം 😊`,
      `നമസ്കാരം! 💖 *Sarah* ഇവിടെ — ഓർഡർ ചെയ്യാൻ സഹായിക്കാം! 🌸`,
    ],

    menu:
      `🛍️ *ഞങ്ങളുടെ Products — ഒന്ന് തിരഞ്ഞെടുക്കൂ:*\n\n` +
      `💖 *Cream X Emirates*\n` +
      `   *1️⃣*  1 പീസ്    —  ₹699\n` +
      `   *2️⃣*  2 പീസ്   —  ₹1299  _(₹99 ലാഭം)_ 🔥\n` +
      `   *3️⃣*  3 പീസ്   —  ₹2000  _(₹97 ലാഭം)_ 🔥\n\n` +
      `☀️ *4️⃣*  സൺസ്ക്രീൻ      —  ₹499\n` +
      `🧴 *5️⃣*  ബോഡി ലോഷൻ   —  ₹699\n` +
      `💄 *6️⃣*  ലിപ് ബാം        —  ₹399\n` +
      `🫧 *7️⃣*  ഫേസ് വാഷ്      —  ₹450\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚚 COD ലഭ്യം | 4–5 ദിവസം Delivery\n` +
      `⏳ ഇന്നത്തെ offer മാത്രം!\n\n` +
      `_നമ്പർ (1–7) അയക്കൂ_ 👇`,

    productPicked: [
      (p) => `✅ *${p.label}* — ₹${p.price}\nമികച്ച ആയ്‌ക്കൽ! ചെറിയ വിവരങ്ങൾ ചോദിക്കട്ടെ 📦\n\n*Step 1 / 4* — നിങ്ങളുടെ *പൂർണ്ണ പേര്*? 📝`,
      (p) => `💖 *${p.label}* — ₹${p.price}\n4 ചുവടുകൾ മാത്രം!\n\n*Step 1 / 4* — *പേര്* പറയൂ? 📝`,
    ],

    ackName:    [(n) => `*${n}*, നിങ്ങളെ കണ്ടതിൽ സന്തോഷം! 😊\n\n*Step 2 / 4* — *ഫോൺ നമ്പർ*? 📱`,
                 (n) => `ശരി, *${n}*! 👍\n\n*Step 2 / 4* — *ഫോൺ*? 📱`],
    ackPhone:   [`ഗ്രേറ്റ്!\n\n*Step 3 / 4* — *ഡെലിവറി വിലാസം*?\n_(വീട്, തെരുവ്, നഗരം)_ 📍`,
                 `നന്നായി! 😊\n\n*Step 3 / 4* — *വിലാസം*? 📍`],
    ackAddress: [`ഏതാണ്ട് തീർന്നു! 🙌\n\n*Step 4 / 4 (അവസാനം!)* — *പിൻകോഡ്*? 📮`,
                 `*Step 4 / 4* — *പിൻകോഡ്* പറയൂ 📮`],

    paymentMsg: (s) =>
      `✨ *ഏതാണ്ട് ready, ${s.name}!*\n\n` +
      `നിങ്ങളുടെ ഓർഡർ:\n` +
      `🛍️  ${s.product.label}\n` +
      `💰  ₹${s.product.price}\n` +
      `📍  ${s.address}, ${s.pincode}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*പേയ്‌മെന്റ് ഓപ്‌ഷൻ:*\n\n` +
      `💳 *1 — Online Payment*\n` +
      `₹${s.product.price} അടച്ച് screenshot അയക്കൂ ✅\n\n` +
      `📦 *2 — Cash on Delivery*\n` +
      `₹99 advance + delivery-ൽ ₹${s.product.price}\n` +
      `ആകെ: ₹${s.product.price + 99}\n\n` +
      `_*1* അല്ലെങ്കിൽ *2* അയക്കൂ_ 👇`,

    upiMsg: (s) =>
      `💳 *Online Payment*\n\n` +
      `*₹${s.product.price}* ഇവിടേക്ക് അടക്കൂ:\n\n` +
      `📲 UPI ID: *${process.env.UPI_ID || 'your-upi@bank'}*\n\n` +
      `ശേഷം *screenshot* ഇവിടെ അയക്കൂ 📸\n` +
      `ഉടൻ confirm ചെയ്യാം! 😊`,

    awaitSS: `📸 *Payment screenshot* അയക്കൂ, ഉടൻ confirm ചെയ്യാം! 😊`,

    orderConfirmed: (s, pay) =>
      `🎉✨ *ഓർഡർ CONFIRMED!* ✨🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦  *${s.product.label}*\n` +
      `👤  ${s.name}\n` +
      `📱  ${s.phone}\n` +
      `📍  ${s.address}\n` +
      `📮  ${s.pincode}\n` +
      `💰  ${pay === 'COD' ? `Delivery-ൽ ₹${s.product.price + 99}` : `Online ₹${s.product.price} ✅`}\n` +
      `🚚  *4–5 ദിവസം Delivery*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `വളരെ നന്ദി, *${s.name}*! 🌸\n` +
      `ഞങ്ങളുടെ team ഉടൻ call ചെയ്യും.\n` +
      `ചോദ്യങ്ങൾക്ക് ഇവിടെ message ചെയ്യൂ! 😊\n` +
      `_Cream X Emirates — xemirates.in_`,

    offTopic: [`ഓർഡർ ചെയ്യാൻ സഹായിക്കാൻ ഇവിടെ ഉണ്ട്! 😊 *hi* അയച്ച് തുടങ്ങൂ.`],
    invalid:  `മനസ്സിലായില്ല 😊 *1 മുതൽ 7* വരെ ഒരു നമ്പർ അയക്കൂ.`,
    langErr:  `*1, 2, 3, 4 അല്ലെങ്കിൽ 5* അയച്ച് ഭാഷ തിരഞ്ഞെടുക്കൂ 😊`,
  },

  // ══════════════════════
  // HINDI
  // ══════════════════════
  hi: {
    name: 'Hindi',

    greet: [
      `हेलो! 👋 मैं *Sarah* हूं, *Cream X Emirates* से.\nकुछ आसान steps में आपका order कर देती हूं 😊`,
      `नमस्ते! 💖 *Sarah* यहाँ — आपका order करने में मदद करती हूं! 🌸`,
      `हाय! 🌸 *Cream X Emirates* में आपका स्वागत!\nमैं *Sarah*, आपकी order assistant हूं 😊`,
    ],

    menu:
      `🛍️ *हमारे Products — एक चुनें:*\n\n` +
      `💖 *Cream X Emirates*\n` +
      `   *1️⃣*  1 पीस    —  ₹699\n` +
      `   *2️⃣*  2 पीस   —  ₹1299  _(₹99 बचत)_ 🔥\n` +
      `   *3️⃣*  3 पीस   —  ₹2000  _(₹97 बचत)_ 🔥\n\n` +
      `☀️ *4️⃣*  Sunscreen      —  ₹499\n` +
      `🧴 *5️⃣*  Body Lotion   —  ₹699\n` +
      `💄 *6️⃣*  Lip Balm        —  ₹399\n` +
      `🫧 *7️⃣*  Face Wash      —  ₹450\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚚 COD उपलब्ध | 4–5 दिनों में Delivery\n` +
      `⏳ आज का खास ऑफर!\n\n` +
      `_नंबर (1–7) भेजकर चुनें_ 👇`,

    productPicked: [
      (p) => `✅ *${p.label}* — ₹${p.price}\nबेहतरीन! बस कुछ details चाहिए 📦\n\n*Step 1 / 4* — आपका *पूरा नाम*? 📝`,
      (p) => `💖 *${p.label}* — ₹${p.price}\n4 steps में order ready!\n\n*Step 1 / 4* — *नाम* बताइए? 📝`,
      (p) => `🌸 *${p.label}* — ₹${p.price} — शानदार चुनाव!\n\n*Step 1 / 4* — *पूरा नाम*? 📝`,
    ],

    ackName:    [(n) => `*${n}* से मिलकर खुशी हुई! 😊\n\n*Step 2 / 4* — *फोन नंबर*? 📱`,
                 (n) => `ठीक है, *${n}*! 👍\n\n*Step 2 / 4* — *WhatsApp नंबर*? 📱`,
                 (n) => `परफेक्ट, *${n}*! 🌸\n\n*Step 2 / 4* — *Contact नंबर*? 📱`],
    ackPhone:   [`नोट किया! 📱\n\n*Step 3 / 4* — *Delivery Address*?\n_(मकान नं, गली, Area, शहर)_ 📍`,
                 `मिल गया! ✅\n\n*Step 3 / 4* — *पूरा पता* बताइए? 📍`],
    ackAddress: [`लगभग हो गया! 🙌\n\n*Step 4 / 4 (आखिरी!)* — *Pincode*? 📮`,
                 `बस एक कदम और!\n\n*Step 4 / 4* — *Pincode* बताइए 📮`],

    paymentMsg: (s) =>
      `✨ *लगभग हो गया, ${s.name}!*\n\n` +
      `आपका order:\n` +
      `🛍️  ${s.product.label}\n` +
      `💰  ₹${s.product.price}\n` +
      `📍  ${s.address}, ${s.pincode}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Payment कैसे करना चाहते हैं?*\n\n` +
      `💳 *1 — Online Payment*\n` +
      `₹${s.product.price} भेजें और screenshot दें ✅\n\n` +
      `📦 *2 — Cash on Delivery*\n` +
      `₹99 advance + delivery पर ₹${s.product.price}\n` +
      `Total: ₹${s.product.price + 99}\n\n` +
      `_*1* या *2* भेजें_ 👇`,

    upiMsg: (s) =>
      `💳 *Online Payment*\n\n` +
      `*₹${s.product.price}* यहाँ भेजें:\n\n` +
      `📲 UPI ID: *${process.env.UPI_ID || 'your-upi@bank'}*\n\n` +
      `Payment के बाद *screenshot* यहाँ भेजें 📸\n` +
      `तुरंत confirm कर देती हूं! 😊`,

    awaitSS: `📸 *Payment screenshot* भेजिए, फटाफट confirm कर देती हूं! 😊`,

    orderConfirmed: (s, pay) =>
      `🎉✨ *ORDER CONFIRMED!* ✨🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦  *${s.product.label}*\n` +
      `👤  ${s.name}\n` +
      `📱  ${s.phone}\n` +
      `📍  ${s.address}\n` +
      `📮  ${s.pincode}\n` +
      `💰  ${pay === 'COD' ? `Delivery पर ₹${s.product.price + 99}` : `Online ₹${s.product.price} paid ✅`}\n` +
      `🚚  *4–5 दिनों में Delivery*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `बहुत-बहुत शुक्रिया, *${s.name}*! 🌸\n` +
      `हमारी team जल्द call करेगी.\n` +
      `कोई सवाल हो तो यहाँ message करें! 😊\n` +
      `_Cream X Emirates — xemirates.in_`,

    offTopic: [`Order में मदद के लिए यहाँ हूं! 😊 *hi* भेजकर शुरू करें.`,
               `खुशी से मदद करूंगी! 😊 हमारे products देखना चाहते हैं?`],
    invalid:  `समझ नहीं आया 😊 *1 से 7* में से एक नंबर भेजें.`,
    langErr:  `*1, 2, 3, 4 या 5* भेजकर भाषा चुनें 😊`,
  },

  // ══════════════════════
  // KANNADA
  // ══════════════════════
  kn: {
    name: 'Kannada',

    greet: [
      `ಹಲೋ! 👋 ನಾನು *Sarah*, *Cream X Emirates* ನಿಂದ.\nಕೆಲವು ಸುಲಭ ಹಂತಗಳಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡೋಣ 😊`,
      `ನಮಸ್ಕಾರ! 💖 *Sarah* ಇಲ್ಲಿ — ನಿಮ್ಮ ಆರ್ಡರ್‌ಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ! 🌸`,
    ],

    menu:
      `🛍️ *ನಮ್ಮ Products — ಒಂದು ಆಯ್ಕೆ ಮಾಡಿ:*\n\n` +
      `💖 *Cream X Emirates*\n` +
      `   *1️⃣*  1 ಪೀಸ್    —  ₹699\n` +
      `   *2️⃣*  2 ಪೀಸ್   —  ₹1299  _(₹99 ಉಳಿತಾಯ)_ 🔥\n` +
      `   *3️⃣*  3 ಪೀಸ್   —  ₹2000  _(₹97 ಉಳಿತಾಯ)_ 🔥\n\n` +
      `☀️ *4️⃣*  Sunscreen      —  ₹499\n` +
      `🧴 *5️⃣*  Body Lotion   —  ₹699\n` +
      `💄 *6️⃣*  Lip Balm        —  ₹399\n` +
      `🫧 *7️⃣*  Face Wash      —  ₹450\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚚 COD ಲಭ್ಯ | 4–5 ದಿನ Delivery\n` +
      `⏳ ಇಂದಿನ ಆಫರ್ ಮಾತ್ರ!\n\n` +
      `_ನಂಬರ್ (1–7) ಕಳಿಸಿ_ 👇`,

    productPicked: [
      (p) => `✅ *${p.label}* — ₹${p.price}\nಅದ್ಭುತ ಆಯ್ಕೆ! ಸ್ವಲ್ಪ ವಿವರ ಕೇಳುತ್ತೇನೆ 📦\n\n*Step 1 / 4* — ನಿಮ್ಮ *ಪೂರ್ಣ ಹೆಸರು*? 📝`,
      (p) => `💖 *${p.label}* — ₹${p.price}\n4 steps ಮಾತ್ರ!\n\n*Step 1 / 4* — *ಹೆಸರು*? 📝`,
    ],

    ackName:    [(n) => `*${n}*, ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿ ಸಂತೋಷ! 😊\n\n*Step 2 / 4* — *ಫೋನ್ ನಂಬರ್*? 📱`,
                 (n) => `ಸರಿ, *${n}*! 👍\n\n*Step 2 / 4* — *ಫೋನ್*? 📱`],
    ackPhone:   [`ಗ್ರೇಟ್!\n\n*Step 3 / 4* — *Delivery ವಿಳಾಸ*?\n_(ಮನೆ ನಂ, ಬೀದಿ, ನಗರ)_ 📍`,
                 `ಧನ್ಯವಾದ! 😊\n\n*Step 3 / 4* — *ವಿಳಾಸ*? 📍`],
    ackAddress: [`ಬಹುತೇಕ ಮುಗಿಯಿತು! 🙌\n\n*Step 4 / 4 (ಕೊನೆಯದು!)* — *Pincode*? 📮`,
                 `*Step 4 / 4* — *Pincode* ಕಳಿಸಿ 📮`],

    paymentMsg: (s) =>
      `✨ *ಬಹುತೇಕ Ready, ${s.name}!*\n\n` +
      `ನಿಮ್ಮ ಆರ್ಡರ್:\n` +
      `🛍️  ${s.product.label}\n` +
      `💰  ₹${s.product.price}\n` +
      `📍  ${s.address}, ${s.pincode}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Payment ಹೇಗೆ ಮಾಡಬೇಕು?*\n\n` +
      `💳 *1 — Online Payment*\n` +
      `₹${s.product.price} ಕಳಿಸಿ screenshot ಕೊಡಿ ✅\n\n` +
      `📦 *2 — Cash on Delivery*\n` +
      `₹99 advance + delivery-ಲ್ಲಿ ₹${s.product.price}\n` +
      `ಒಟ್ಟು: ₹${s.product.price + 99}\n\n` +
      `_*1* ಅಥವಾ *2* ಕಳಿಸಿ_ 👇`,

    upiMsg: (s) =>
      `💳 *Online Payment*\n\n` +
      `*₹${s.product.price}* ಇಲ್ಲಿಗೆ ಕಳಿಸಿ:\n\n` +
      `📲 UPI ID: *${process.env.UPI_ID || 'your-upi@bank'}*\n\n` +
      `ಪಾವತಿ ನಂತರ *screenshot* ಇಲ್ಲಿ ಕಳಿಸಿ 📸\n` +
      `ತಕ್ಷಣ confirm ಮಾಡುತ್ತೇನೆ! 😊`,

    awaitSS: `📸 *Payment screenshot* ಕಳಿಸಿ, ತಕ್ಷಣ confirm ಮಾಡುತ್ತೇನೆ! 😊`,

    orderConfirmed: (s, pay) =>
      `🎉✨ *ಆರ್ಡರ್ CONFIRMED!* ✨🎉\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📦  *${s.product.label}*\n` +
      `👤  ${s.name}\n` +
      `📱  ${s.phone}\n` +
      `📍  ${s.address}\n` +
      `📮  ${s.pincode}\n` +
      `💰  ${pay === 'COD' ? `Delivery-ಲ್ಲಿ ₹${s.product.price + 99}` : `Online ₹${s.product.price} ✅`}\n` +
      `🚚  *4–5 ದಿನ Delivery*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `ತುಂಬಾ ಧನ್ಯವಾದ, *${s.name}*! 🌸\n` +
      `ನಮ್ಮ team ಶೀಘ್ರ call ಮಾಡುತ್ತಾರೆ.\n` +
      `ಪ್ರಶ್ನೆ ಇದ್ದರೆ ಇಲ್ಲಿ message ಮಾಡಿ! 😊\n` +
      `_Cream X Emirates — xemirates.in_`,

    offTopic: [`ಆರ್ಡರ್‌ಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ! 😊 *hi* ಕಳಿಸಿ ಪ್ರಾರಂಭಿಸಿ.`],
    invalid:  `ಅರ್ಥವಾಗಲಿಲ್ಲ 😊 *1 ರಿಂದ 7* ನಂಬರ್ ಕಳಿಸಿ.`,
    langErr:  `*1, 2, 3, 4 ಅಥವಾ 5* ಕಳಿಸಿ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ 😊`,
  },
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, label: '💖 Cream X Emirates — 1 Piece',  price: 699  },
  { id: 2, label: '💖 Cream X Emirates — 2 Pieces', price: 1299 },
  { id: 3, label: '💖 Cream X Emirates — 3 Pieces', price: 2000 },
  { id: 4, label: '☀️ Sunscreen',                   price: 499  },
  { id: 5, label: '🧴 Body Lotion',                 price: 699  },
  { id: 6, label: '💄 Lip Balm',                    price: 399  },
  { id: 7, label: '🫧 Face Wash',                   price: 450  },
];

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
const sessions = {};
function getSession(id) {
  if (!sessions[id]) sessions[id] = { step:'ask_lang', lang:'en', product:null, name:'', phone:'', address:'', pincode:'', whatsapp:'' };
  return sessions[id];
}

// ─────────────────────────────────────────────
// SAVE ORDER
// ─────────────────────────────────────────────
const ordersFile = path.join(__dirname, 'orders.csv');
if (!fs.existsSync(ordersFile))
  fs.writeFileSync(ordersFile, 'Date,WhatsApp,Name,Phone,Product,Price,Total,Address,Pincode,Payment,Language\n');

function saveOrder(s, pay) {
  const total = pay === 'COD' ? s.product.price + 99 : s.product.price;
  fs.appendFileSync(ordersFile, [
    new Date().toLocaleString(), s.whatsapp, `"${s.name}"`, s.phone,
    `"${s.product.label}"`, s.product.price, total,
    `"${s.address}"`, s.pincode, pay, LANG[s.lang].name
  ].join(',') + '\n');
  console.log(`✅ ORDER | ${s.name} | ${s.product.label} | ${pay} ₹${total}`);
}

// ─────────────────────────────────────────────
// CREATE ORDER IN SHOPIFY
// ─────────────────────────────────────────────
async function createShopifyOrder(session, payType) {
  if (!shopify) {
    console.log('ℹ️  Shopify not configured — order saved to CSV only');
    return null;
  }

  const variantId = VARIANT_MAP[session.product.id];
  if (!variantId) {
    console.log(`⚠️  No Shopify variant ID for product ${session.product.id} — add it to .env`);
    return null;
  }

  const nameParts = session.name.trim().split(' ');
  const result = await shopify.createDraftOrder({
    customerName  : session.name,
    customerEmail : null,
    phone         : session.phone,
    lineItems     : [{ variantId, quantity: 1 }],
    shippingAddress: {
      address1 : session.address,
      city     : '',
      zip      : session.pincode,
      country  : 'IN',
    },
    note: `WhatsApp order | Payment: ${payType} | Lang: ${LANG[session.lang].name} | Ph: ${session.phone}`,
  });

  if (result && result.success) {
    console.log(`🛍️  Shopify draft order created: ${result.orderName} | Invoice: ${result.invoiceUrl}`);
    return result;
  } else {
    console.log(`❌  Shopify order failed:`, result?.error || 'unknown error');
    return null;
  }
}

// ─────────────────────────────────────────────
// VOICE MESSAGE REPLIES — per language
// ─────────────────────────────────────────────
const VOICE_REPLY = {
  en: `🎙️ Oh! I received a voice message, but I can't listen to audio just yet 😊\nCould you please *type your message*? I'll help you right away! 💬`,
  ta: `🎙️ குரல் செய்தி பெற்றேன், ஆனால் கேட்க முடியவில்லை 😊\n*தட்டச்சு செய்து* அனுப்பவும், உடனே பதில் சொல்கிறேன்! 💬`,
  ml: `🎙️ Voice message കിട്ടി, പക്ഷേ audio കേൾക്കാൻ കഴിയില്ല 😊\n*Type ചെയ്ത്* അയക്കൂ, ഉടൻ reply ചെയ്യാം! 💬`,
  hi: `🎙️ Voice message मिला, लेकिन audio नहीं सुन सकती 😊\n*Type करके* भेजिए, तुरंत मदद करती हूं! 💬`,
  kn: `🎙️ Voice message ಸಿಕ್ಕಿತು, ಆದರೆ audio ಕೇಳಲು ಆಗುತ್ತಿಲ್ಲ 😊\n*Type ಮಾಡಿ* ಕಳಿಸಿ, ತಕ್ಷಣ help ಮಾಡುತ್ತೇನೆ! 💬`,
};

// ─────────────────────────────────────────────
// GREETING DETECTION
// ─────────────────────────────────────────────
const GREETINGS = ['hi','hello','helo','hii','hey','good morning','good evening','good afternoon',
  'gm','hai','hlo','helo','hy','yo','sup','morning','evening','afternoon','namaste','vanakkam',
  'namaskar','salam','assalam','start','begin','order','help','info','price','available','yes','ok','okay'];

function isGreeting(text) {
  const t = text.toLowerCase().trim().replace(/[!?.]/g, '');
  return GREETINGS.includes(t) || t.length < 4;
}

// ─────────────────────────────────────────────
// COMPLAINT DETECTION
// ─────────────────────────────────────────────
const COMPLAINT_KEYWORDS = [
  'where is my order','where is my package','not received','not delivered','not arrived',
  'still waiting','delayed','delay','when will','when delivery','track','tracking','status',
  'refund','cancel','wrong product','damaged','broken','complaint','problem','issue',
  'not working','bad','worst','fake','cheat','fraud','money back',
  // Indian language keywords
  'order kahan','kahan hai','nahi aaya','cancel karo','return','wapas',
  'எங்கே','வரவில்லை','கேன்சல்','திரும்ப',
  'എവിടെ','കിട്ടിയില്ല','cancel','refund',
  'ಎಲ್ಲಿ','ಬರಲಿಲ್ಲ','ರದ್ದು'
];

function isComplaint(text) {
  const t = text.toLowerCase();
  return COMPLAINT_KEYWORDS.some(k => t.includes(k));
}

const COMPLAINT_REPLY = {
  en: `😔 I'm really sorry to hear that! I completely understand your concern.\n\nOur team will personally look into this right away and get back to you within a few hours.\n\n📞 You can also call us directly for faster support.\n\nThank you so much for your patience, we truly appreciate it 🙏`,
  ta: `😔 மன்னிக்கவும்! உங்கள் கவலை புரிகிறது.\n\nஎங்கள் team சீக்கிரமே இதை பார்த்து உங்களுக்கு பதில் சொல்வார்கள்.\n\nசற்று பொறுமையாக இருந்தால் நன்றி 🙏`,
  ml: `😔 ക്ഷമിക്കണം! നിങ്ങളുടെ പ്രശ്നം മനസ്സിലായി.\n\nഞങ്ങളുടെ team ഉടൻ investigate ചെയ്ത് reply ചെയ്യും.\n\nക്ഷമ കാണിച്ചതിന് നന്ദി 🙏`,
  hi: `😔 माफ कीजिए! आपकी परेशानी समझ आती है।\n\nहमारी team जल्द से जल्द इसे देखेगी और आपसे संपर्क करेगी।\n\nआपके धैर्य के लिए बहुत शुक्रिया 🙏`,
  kn: `😔 ಕ್ಷಮಿಸಿ! ನಿಮ್ಮ ಸಮಸ್ಯೆ ಅರ್ಥವಾಯಿತು.\n\nನಮ್ಮ team ಶೀಘ್ರದಲ್ಲೇ ನೋಡಿ reply ಮಾಡುತ್ತಾರೆ.\n\nನಿಮ್ಮ ತಾಳ್ಮೆಗೆ ಧನ್ಯವಾದ 🙏`,
};

// ─────────────────────────────────────────────
// LANGUAGE SWITCH DETECTION
// ─────────────────────────────────────────────
function detectLangSwitch(t) {
  const s = t.toLowerCase();
  if (s.includes('english') || s === 'eng')        return 'en';
  if (s.includes('tamil'))                          return 'ta';
  if (s.includes('malayalam'))                      return 'ml';
  if (s.includes('hindi'))                          return 'hi';
  if (s.includes('kannada'))                        return 'kn';
  return null;
}

async function reaskInLang(msg, session) {
  const L    = LANG[session.lang];
  const note = `✅ Switched to *${L.name}*!\n\n`;
  const step = session.step;
  if (step === 'pick_product')     return humanReply(msg, note + L.menu);
  if (step === 'ask_name')         return humanReply(msg, note + pick(L.productPicked)(session.product));
  if (step === 'ask_phone')        return humanReply(msg, note + pick(L.ackName)(session.name));
  if (step === 'ask_address')      return humanReply(msg, note + pick(L.ackPhone));
  if (step === 'ask_pincode')      return humanReply(msg, note + pick(L.ackAddress));
  if (step === 'ask_payment')      return humanReply(msg, note + L.paymentMsg(session));
  if (step === 'await_screenshot') return humanReply(msg, note + L.awaitSS);
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
async function handleMessage(msg) {
  if (msg.isGroupMsg || msg.from.includes('@g.us')) return;
  if (msg.from === 'status@broadcast') return;

  const id      = msg.from;
  const body    = msg.body.trim();
  const session = getSession(id);
  session.whatsapp = id.replace('@c.us', '');
  const L = LANG[session.lang];
  console.log(`📩 [${session.step}] [${L.name}] [${msg.type}] "${body}"`);

  // ── 🎙️ VOICE MESSAGE — ask to type instead ─
  if (msg.type === 'ptt' || msg.type === 'audio') {
    await humanReply(msg, VOICE_REPLY[session.lang] || VOICE_REPLY.en);
    return;
  }

  // ── 😤 COMPLAINT DETECTION — any step ──────
  if (isComplaint(body)) {
    await humanReply(msg, COMPLAINT_REPLY[session.lang] || COMPLAINT_REPLY.en);
    return;
  }

  // ── Mid-conversation language switch ────────
  if (!['ask_lang','pick_lang'].includes(session.step)) {
    const sw = detectLangSwitch(body);
    if (sw) { session.lang = sw; await reaskInLang(msg, session); return; }
  }

  // ── 👋 GREETING — restart or welcome back ──
  if (session.step === 'ask_lang' || session.step === 'done' || isGreeting(body)) {
    if (session.step === 'done') sessions[id] = null;
    await humanReply(msg, LANG_MENU);
    getSession(id).step = 'pick_lang';
    return;
  }

  // ── Language menu (first message) ──────────
  if (session.step === 'ask_lang') {
    await humanReply(msg, LANG_MENU);
    session.step = 'pick_lang';
    return;
  }

  // ── Pick language ──────────────────────────
  if (session.step === 'pick_lang') {
    if (!LANG_MAP[body]) { await humanReply(msg, L.langErr); return; }
    session.lang = LANG_MAP[body];
    const NL = LANG[session.lang];
    await humanReply(msg, pick(NL.greet));     // greeting
    await sleep(1000);
    await humanReply(msg, NL.menu);            // product menu
    session.step = 'pick_product';
    return;
  }

  // ── Pick product ───────────────────────────
  if (session.step === 'pick_product') {
    const num = parseInt(body, 10);
    if (!num || num < 1 || num > 7) { await humanReply(msg, pick(L.offTopic)); return; }
    session.product = PRODUCTS[num - 1];
    await humanReply(msg, pick(L.productPicked)(session.product));
    session.step = 'ask_name';
    return;
  }

  // ── Step 1: Name ───────────────────────────
  if (session.step === 'ask_name') {
    session.name = body;
    await humanReply(msg, pick(L.ackName)(session.name));
    session.step = 'ask_phone';
    return;
  }

  // ── Step 2: Phone ──────────────────────────
  if (session.step === 'ask_phone') {
    session.phone = body;
    await humanReply(msg, pick(L.ackPhone));
    session.step = 'ask_address';
    return;
  }

  // ── Step 3: Address ────────────────────────
  if (session.step === 'ask_address') {
    session.address = body;
    await humanReply(msg, pick(L.ackAddress));
    session.step = 'ask_pincode';
    return;
  }

  // ── Step 4: Pincode → payment ──────────────
  if (session.step === 'ask_pincode') {
    session.pincode = body;
    await humanReply(msg, L.paymentMsg(session));
    session.step = 'ask_payment';
    return;
  }

  // ── Payment ────────────────────────────────
  if (session.step === 'ask_payment') {
    if (body === '1') {
      await humanReply(msg, L.upiMsg(session));
      // Send QR code image if available
      if (fs.existsSync(QR_IMAGE_PATH)) {
        const chat = await msg.getChat();
        const media = MessageMedia.fromFilePath(QR_IMAGE_PATH);
        await chat.sendMessage(media, { caption: '📲 Scan this QR to pay instantly!' });
      }
      session.step = 'await_screenshot';
      return;
    }
    if (body === '2') {
      saveOrder(session, 'COD');
      createShopifyOrder(session, 'COD');          // ← create in Shopify (async, no await needed)
      await humanReply(msg, L.orderConfirmed(session, 'COD'));
      session.step = 'done';
      return;
    }
    await humanReply(msg, L.invalid);
    return;
  }

  // ── Screenshot ─────────────────────────────
  if (session.step === 'await_screenshot') {
    if (msg.hasMedia || msg.type === 'image' || body.length > 2) {
      saveOrder(session, 'Online');
      createShopifyOrder(session, 'Online');        // ← create in Shopify (async, no await needed)
      await humanReply(msg, L.orderConfirmed(session, 'Online'));
      session.step = 'done';
    } else {
      await humanReply(msg, L.awaitSS);
    }
    return;
  }

  // ── Done — any message restarts ────────────
  if (session.step === 'done') {
    sessions[id] = null;
    await humanReply(msg, LANG_MENU);
    getSession(id).step = 'pick_lang';
    return;
  }
}

// ─────────────────────────────────────────────
// WHATSAPP CLIENT
// ─────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'xemirates-bot' }),
  puppeteer: {
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => { console.log('\n📱 Scan QR with WhatsApp:\n'); qrcode.generate(qr, { small: true }); });
client.on('authenticated', () => console.log('🔐 Authenticated!'));
client.on('ready', () => {
  console.log(`\n🤖 Cream X Emirates Bot is LIVE!`);
  console.log(`🌍 English | Tamil | Malayalam | Hindi | Kannada`);
  console.log(`👩 Step-by-step human-like conversation`);
  console.log(`📦 Orders → orders.csv\n`);
});
client.on('message', handleMessage);
client.on('disconnected', r => console.log('⚠️ Disconnected:', r));
client.initialize();
