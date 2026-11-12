/* =====================================================================
   VIATU VIBES — STORE SETTINGS
   Edit this file to change contact details, payment info, delivery fees
   and promo codes. No other code changes are needed.
   ===================================================================== */
window.VV_CONFIG = {
  storeName: "Viatu Vibes",

  // WhatsApp number that receives orders. International format, digits only.
  // e.g. 0712 345 678  ->  "254712345678"
  whatsappNumber: "254700000000",
  phoneDisplay: "+254 700 000 000",
  email: "hello@viatuvibes.co.ke",
  address: "Moi Avenue, Nairobi CBD",
  hours: "Mon – Sat: 8:00am – 7:00pm · Sun: 10:00am – 4:00pm",

  // Lipa na M-Pesa details shown at checkout.
  mpesa: {
    type: "Buy Goods", // "Buy Goods" (Till) or "Paybill"
    number: "000000", // Till number or Paybill business number
    account: "", // Paybill only: account number customers should use (leave "" to use the order number)
    name: "VIATU VIBES",
  },

  social: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
  },

  // Free delivery applies to Nairobi orders at or above this amount (after discounts).
  freeDeliveryThreshold: 7500,
  freeDeliveryCounties: ["Nairobi"],

  // Delivery fee per tier (KES) and estimated time.
  // days: [fastest, slowest] delivery in days (0 = same day if ordered before sameDayCutoffHour).
  deliveryTiers: {
    nairobi: { fee: 250, eta: "Same day / next day", days: [0, 1] },
    metro: { fee: 350, eta: "1 – 2 days", days: [1, 2] },
    major: { fee: 450, eta: "1 – 3 days", days: [1, 3] },
    other: { fee: 600, eta: "2 – 4 days", days: [2, 4] },
  },
  sameDayCutoffHour: 14, // 2pm

  // Product photos: save a photo in the images/ folder named after the product's slug
  // (e.g. images/nairobi-runner.jpg, .png or .webp) and it appears automatically everywhere.
  autoPhotos: true,

  // Shoes that rotate in the big showcase at the top of the home page (product slugs).
  heroShoes: ["nairobi-runner", "kileleshwa-stiletto", "maasai-mara-trail-boot", "kilimani-leather-loafer", "lamu-leather-sandal"],

  // "Unaenda wapi leo?" occasion picker. Tag products with these ids in products.js.
  vibes: [
    { id: "kazi", emoji: "💼", label: "Kazi", sub: "Office & work" },
    { id: "church", emoji: "⛪", label: "Sunday best", sub: "Church, harusi & events" },
    { id: "mtaa", emoji: "😎", label: "Mtaa", sub: "Everyday streets" },
    { id: "run", emoji: "🏃🏾", label: "Run & gym", sub: "Iten-ready" },
    { id: "pwani", emoji: "🏖️", label: "Pwani", sub: "Beach & coast" },
    { id: "safari", emoji: "🦒", label: "Safari", sub: "Hikes & upcountry" },
    { id: "shule", emoji: "🎒", label: "Shule", sub: "School & play" },
  ],
  // Counties not listed here fall into the "other" tier.
  countyTiers: {
    Nairobi: "nairobi",
    Kiambu: "metro",
    Machakos: "metro",
    Kajiado: "metro",
    "Murang'a": "metro",
    Mombasa: "major",
    Kisumu: "major",
    Nakuru: "major",
    "Uasin Gishu": "major",
    Nyeri: "major",
  },

  pickup: { label: "Pick up at our shop", where: "Moi Avenue, Nairobi CBD", fee: 0 },

  // Cash on delivery is only offered for these counties.
  cashOnDeliveryCounties: ["Nairobi"],

  // Promo codes. type: "percent" | "fixed". min = minimum subtotal (optional).
  promoCodes: {
    KARIBU10: { type: "percent", value: 10, label: "10% off your order" },
    VIBES500: { type: "fixed", value: 500, min: 5000, label: "KES 500 off orders over KES 5,000" },
  },

  // OPTIONAL: get an email copy of every order / newsletter signup.
  // Create a free form at https://formspree.io and paste its URL here,
  // e.g. "https://formspree.io/f/abcdwxyz". Leave "" to disable.
  orderEndpoint: "",
  newsletterEndpoint: "",

  // Placeholder testimonials. Replace these with real customer reviews
  // before you launch, or set to [] to hide the section.
  testimonials: [
    { name: "Customer name", place: "Nairobi", text: "Replace this with a real review from one of your customers." },
    { name: "Customer name", place: "Mombasa", text: "Real reviews build trust. Collect them on WhatsApp after delivery." },
    { name: "Customer name", place: "Kisumu", text: "Short, specific reviews work best. Mention fit, quality and delivery." },
  ],
};

window.VV_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
  "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];
