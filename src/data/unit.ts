export interface UnitDetails {
  title: string;
  tagline: string;
  location: string;
  view: string;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  basePrice: number;
  cleaningFee: number;
  securityDeposit: number;
  description: string;
  amenities: {
    category: string;
    items: { name: string; icon: string; highlighted?: boolean }[];
  }[];
  condoRules: {
    checkIn: string;
    checkOut: string;
    poolFeeRegular: string;
    poolFeeHoliday: string;
    poolHours: string;
    parkingFee: string;
    quietHours: string;
    petPolicy: string;
    towerAndFloor: string;
    smartDoorLock: string;
    wifiDetails: string;
    cookingPolicy: string;
    smokingPolicy: string;
    garbageDisposal: string;
    balconyQuirk: string;
  };
  nearbyAttractions: { name: string; distance: string; highlight: string }[];
  images: { url: string; alt: string; caption: string; isHero?: boolean }[];
}

export const TAGAYTAY_UNIT: UnitDetails = {
  title: "The Taal Viewpoint Sanctuary",
  tagline: "Panoramic Taal Lake & Volcano Vista with Cool Mountain Breeze",
  location: "Tower 3, Wind Residences, Tagaytay-Nasugbu Hwy, Tagaytay City, Cavite, Philippines",
  view: "Direct unobstructed 180° view of Taal Lake & Volcano",
  rating: 4.96,
  reviewCount: 128,
  maxGuests: 4,
  bedrooms: 1,
  beds: 2, // 1 Queen Bed + 1 Premium Sofa Bed
  baths: 1,
  basePrice: 2800, // PHP per night weekdays
  cleaningFee: 500,
  securityDeposit: 1000,
  description:
    "Perched high on the ridge of Tagaytay, our bespoke corner suite offers breathtaking, uninterrupted views of Taal Lake and Volcano. Designed for couples, small families, and remote work retreats seeking peace, cool mountain climate, high-speed fiber internet, Netflix bingeing, and hotel-grade linens.",
  amenities: [
    {
      category: "Scenic & Relaxation",
      items: [
        { name: "Private Balcony with Direct Taal View", icon: "Eye", highlighted: true },
        { name: "Cool Ridge Climate (Pack a light jacket!)", icon: "Wind", highlighted: true },
        { name: "Hotel-Grade Queen Mattress & Duvet", icon: "Bed" },
        { name: "Blackout Curtains", icon: "Moon" },
      ],
    },
    {
      category: "Entertainment & Connectivity",
      items: [
        { name: "100 Mbps High-Speed Fiber WiFi", icon: "Wifi", highlighted: true },
        { name: "50\" 4K Smart TV with Netflix & YouTube", icon: "Tv", highlighted: true },
        { name: "Dedicated Laptop Workstation", icon: "Laptop" },
      ],
    },
    {
      category: "Kitchenette & Comfort",
      items: [
        { name: "Microwave & Induction Cooktop", icon: "Flame" },
        { name: "Refrigerator & Electric Kettle", icon: "Coffee" },
        { name: "Hot & Cold Rainfall Shower", icon: "Droplets", highlighted: true },
        { name: "Bidet & Full Toiletries Set", icon: "Sparkles" },
        { name: "Inverter Air Conditioner", icon: "Airplay" },
      ],
    },
    {
      category: "Building Amenities (Wind Residences)",
      items: [
        { name: "Heated Indoor & Outdoor Olympic Pools", icon: "Waves", highlighted: true },
        { name: "Sky Lounge & Promenade", icon: "Compass" },
        { name: "24/7 Security & Front Desk Lobby", icon: "ShieldCheck" },
        { name: "Commercial Strip (Robinsons, 7-Eleven, Cafes)", icon: "ShoppingBag" },
      ],
    },
  ],
  condoRules: {
    checkIn: "2:00 PM onwards (Digital Keyless Pin / Self Check-In)",
    checkOut: "12:00 PM noon",
    poolFeeRegular: "₱150 per guest / day (Regular Days)",
    poolFeeHoliday: "₱300 per guest / day (Holidays & Peak Seasons)",
    poolHours: "8:00 AM – 10:00 PM (Monday Closed for Maintenance)",
    parkingFee: "₱150 overnight parking (Pay directly to building admin cashier)",
    quietHours: "10:00 PM – 8:00 AM",
    petPolicy: "Strictly no pets per condominium administration guidelines",
    towerAndFloor: "Tower 3, 19th Floor, Unit 1928 (Tagaytay Ridge View)",
    smartDoorLock: "Digital Keypad (4-digit guest PIN sent 2 hours before check-in)",
    wifiDetails: "SSID: TaalViewpoint_Guest (100 Mbps Fiber) • Password provided upon confirmed booking",
    cookingPolicy: "Light cooking & reheating only (microwave, electric kettle, rice cooker). Deep-frying and strong-odor fish (tuyo/dried fish) strictly prohibited.",
    smokingPolicy: "100% Non-Smoking inside the suite & balcony. Building admin imposes ₱5,000 penalty for smoking.",
    garbageDisposal: "Garbage chute room located beside elevator lobby on the 19th floor. Please tie trash bags securely.",
    balconyQuirk: "Strong mountain breeze! Always close balcony glass door when leaving unit and secure light clothing on chairs.",
  },
  nearbyAttractions: [
    { name: "Mahogany Beef Market (Bulalo)", distance: "5 mins drive", highlight: "Authentic Tagaytay bulalo & fresh local fruits" },
    { name: "Sky Ranch Tagaytay", distance: "3 mins drive", highlight: "Ferris wheel overlooking the lake ridge" },
    { name: "Picnic Grove & People's Park", distance: "12 mins drive", highlight: "Pine tree walks, zipline, scenic vistas" },
    { name: "Bag of Beans Athena", distance: "4 mins drive", highlight: "Famous rustic coffee, pancakes & pastries" },
  ],
  images: [
    {
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80",
      alt: "Panoramic Lake Vista Balcony",
      caption: "Unobstructed sunrise & sunset over Taal Lake from your private balcony",
      isHero: true,
    },
    {
      url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      alt: "Cozy Master Suite",
      caption: "Queen pillow-top bed dressed in 400-thread count crisp linens",
    },
    {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      alt: "Living Lounge with Smart TV",
      caption: "Relax with 50-inch 4K Netflix, fiber WiFi, and comfortable sleeper sofa",
    },
    {
      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      alt: "Kitchenette & Dining Corner",
      caption: "Fully equipped with microwave, induction stove, fridge, and dining set",
    },
    {
      url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
      alt: "Olympic Pool Complex",
      caption: "Wind Residences clubhouse pools surrounded by gardens and mountain air",
    },
  ],
};
