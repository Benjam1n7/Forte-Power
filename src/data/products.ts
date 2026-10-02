import { Product, PredefinedKit } from '../types';

export const HERO_IMAGE_URL = '/src/assets/images/hero_power_resilience_kit_1790950962112.jpg';
export const POWER_BANK_IMAGE_URL = '/src/assets/images/product_power_bank_1790950977000.jpg';
export const SOLAR_CHARGER_IMAGE_URL = '/src/assets/images/product_solar_charger_1790950999126.jpg';
export const DC_FAN_IMAGE_URL = '/src/assets/images/product_dc_fan_1790951011811.jpg';
export const TASK_LAMP_IMAGE_URL = '/src/assets/images/product_task_lamp_1790951023412.jpg';

export const PRODUCTS: Product[] = [
  // 1. Heavy Laptop Power Bank
  {
    id: 'FO-PB-60K',
    name: 'Forte MaxPower 60,000mAh 65W PD Laptop & Station Bank',
    short_name: '60,000mAh Laptop Bank',
    category: 'power_bank',
    description: 'Dual 65W USB-C Power Delivery with dedicated 12V DC router port and digital LED percentage meter. Charges MacBooks, ThinkPads, and phones during 18-hour grid collapses.',
    specifications: {
      capacity_mah: 60000,
      watt_hours: 222,
      battery_life_hours: '3-4 full laptop charges or 14 full phone recharges',
      outputs: ['2x USB-C PD 65W', '2x USB-A QC3.0 22.5W', '1x 12V DC Router Port'],
      inputs: ['USB-C Fast Recharging (65W In)'],
      weight_kg: 1.2
    },
    price_naira: 62000,
    watts: 65,
    battery_wh: 222,
    warranty_months: 18,
    is_verified: true,
    image_url: POWER_BANK_IMAGE_URL,
    stock_quantity: 55
  },
  // 2. Compact Fast Power Bank
  {
    id: 'FO-PB-30K',
    name: 'Forte PocketGrid 30,000mAh 22.5W QuickCharge Bank',
    short_name: '30,000mAh Fast Bank',
    category: 'power_bank',
    description: 'Slim airline-approved high-density polymer battery with 22.5W SuperCharge for Samsung, iPhone, and Android devices. 7 full phone refills.',
    specifications: {
      capacity_mah: 30000,
      watt_hours: 111,
      battery_life_hours: '7 full smartphone charges',
      outputs: ['1x USB-C 20W PD', '2x USB-A 22.5W'],
      inputs: ['Micro-USB & USB-C'],
      weight_kg: 0.6
    },
    price_naira: 28500,
    watts: 22.5,
    battery_wh: 111,
    warranty_months: 12,
    is_verified: true,
    image_url: POWER_BANK_IMAGE_URL,
    stock_quantity: 90
  },
  // 3. Everyday Emergency Pocket Bank
  {
    id: 'FO-PB-20K',
    name: 'Forte DailyCommute 20,000mAh Dual-Port Power Bank',
    short_name: '20,000mAh Pocket Bank',
    category: 'power_bank',
    description: 'Lightweight textured casing with LED indicators. Keeps two phones powered through daily bus commutes and sudden evening cuts.',
    specifications: {
      capacity_mah: 20000,
      watt_hours: 74,
      battery_life_hours: '4 full smartphone charges',
      outputs: ['2x USB-A 18W Fast Out'],
      inputs: ['Type-C In'],
      weight_kg: 0.4
    },
    price_naira: 18500,
    watts: 18,
    battery_wh: 74,
    warranty_months: 12,
    is_verified: true,
    image_url: POWER_BANK_IMAGE_URL,
    stock_quantity: 120
  },
  // 4. 12-inch DC Rechargeable Fan
  {
    id: 'FO-FAN-12DC',
    name: 'Forte WhisperFlow 12" Brushless DC Oscillating Fan',
    short_name: '12" Silent DC Fan',
    category: 'usb_fan',
    description: 'Engineered for hot Nigerian nights. Silent brushless motor running up to 16 hours on whisper mode or direct USB-C input. Zero motor hum.',
    specifications: {
      fan_blade_inches: 12,
      fan_speeds: 4,
      watt_hours: 44.4,
      battery_life_hours: '9 hours on high, 16 hours on whisper mode',
      outputs: ['Emergency 5V USB output for phone topping'],
      inputs: ['USB-C 18W Fast In'],
      weight_kg: 1.6
    },
    price_naira: 38500,
    watts: 15,
    battery_wh: 44.4,
    warranty_months: 12,
    is_verified: true,
    image_url: DC_FAN_IMAGE_URL,
    stock_quantity: 70
  },
  // 5. 8-inch Desk & Clip Fan
  {
    id: 'FO-FAN-08CP',
    name: 'Forte BreezeClip 8" Rechargeable Desk & Bedpost Fan',
    short_name: '8" Clamp Desk Fan',
    category: 'usb_fan',
    description: 'Dual-purpose base and heavy-duty spring clamp. Attaches to hostel bed frames, study desks, or cashier counters. 10 hours runtime.',
    specifications: {
      fan_blade_inches: 8,
      fan_speeds: 3,
      watt_hours: 29.6,
      battery_life_hours: '10 hours continuous airflow',
      inputs: ['USB-C In'],
      weight_kg: 0.75
    },
    price_naira: 21000,
    watts: 10,
    battery_wh: 29.6,
    warranty_months: 12,
    is_verified: true,
    image_url: DC_FAN_IMAGE_URL,
    stock_quantity: 85
  },
  // 6. Portable Personal Neck & Hand Fan
  {
    id: 'FO-FAN-MINI',
    name: 'Forte TurboAir Handheld & Hands-Free Personal Fan',
    short_name: 'Turbo Mini Fan',
    category: 'usb_fan',
    description: 'Turbine bladeless airflow with digital battery percentage readout. Ideal for crowded lecture halls, market stalls, and Lagos traffic.',
    specifications: {
      fan_speeds: 5,
      watt_hours: 14.8,
      battery_life_hours: '6 hours high, 12 hours low',
      inputs: ['USB-C In'],
      weight_kg: 0.22
    },
    price_naira: 9500,
    watts: 5,
    battery_wh: 14.8,
    warranty_months: 6,
    is_verified: true,
    image_url: DC_FAN_IMAGE_URL,
    stock_quantity: 150
  },
  // 7. 40W Monocrystalline Folding Solar Mat
  {
    id: 'FO-SOL-40W',
    name: 'Forte SunFold 40W Monocrystalline ETFE Solar Mat',
    short_name: '40W Folding Solar Mat',
    category: 'solar_charger',
    description: 'Military-grade laminated solar charger with 23.4% high-efficiency cells. Direct DC5521 18V output to recharge 60k power bank + 30W USB-C.',
    specifications: {
      solar_watts: 40,
      watt_hours: 0,
      outputs: ['18V DC5521 (Direct Battery Charger)', 'USB-C PD 30W', 'USB-A QuickCharge 18W'],
      weight_kg: 1.4
    },
    price_naira: 49000,
    watts: 40,
    battery_wh: 0,
    warranty_months: 24,
    is_verified: true,
    image_url: SOLAR_CHARGER_IMAGE_URL,
    stock_quantity: 40
  },
  // 8. 80W Heavy-Duty Briefcase Solar Panel
  {
    id: 'FO-SOL-80W',
    name: 'Forte SunBase 80W High-Yield Briefcase Solar System',
    short_name: '80W Briefcase Solar Panel',
    category: 'solar_charger',
    description: 'Twin folding kickstand panels designed for balconies, rooftops, and shopfronts. Replenishes dual power banks in 3.5 hours of equatorial sun.',
    specifications: {
      solar_watts: 80,
      outputs: ['19.5V DC Heavy Port', 'Dual USB-C 45W Out', 'Anderson Port'],
      weight_kg: 3.1
    },
    price_naira: 84000,
    watts: 80,
    battery_wh: 0,
    warranty_months: 24,
    is_verified: true,
    image_url: SOLAR_CHARGER_IMAGE_URL,
    stock_quantity: 25
  },
  // 9. 21W Ultra-Portable Solar Backpack Mat
  {
    id: 'FO-SOL-21W',
    name: 'Forte TrailSun 21W Dual USB Pocket Solar Charger',
    short_name: '21W Pocket Solar Panel',
    category: 'solar_charger',
    description: 'Folds down to the size of a notebook. Weatherproof canvas sleeve with brass eyelets to hang on windows or balconies for steady phone topping.',
    specifications: {
      solar_watts: 21,
      outputs: ['2x USB-A 5V/2.4A Smart Port'],
      weight_kg: 0.65
    },
    price_naira: 29500,
    watts: 21,
    battery_wh: 0,
    warranty_months: 12,
    is_verified: true,
    image_url: SOLAR_CHARGER_IMAGE_URL,
    stock_quantity: 60
  },
  // 10. 1200-Lumen Emergency Task Lamp
  {
    id: 'FO-LMP-1200',
    name: 'Forte Beacon 1200-Lumen Anti-Glare Emergency Task Lamp',
    short_name: '1200lm Study & Task Lamp',
    category: 'lamp',
    description: 'Rotary step-less dimming from 3000K warm reading light to 5000K daylight beam. Heavy aluminum handle and up to 36 hours reading illumination.',
    specifications: {
      lamp_lumens: 1200,
      light_modes: ['Warm Reading (3000K)', 'Natural White (4000K)', 'High Daylight (5000K)'],
      battery_life_hours: '12 hours high brightness, 36 hours reading brightness',
      outputs: ['USB-A Emergency Out'],
      inputs: ['USB-C In'],
      weight_kg: 0.55
    },
    price_naira: 19500,
    watts: 12,
    battery_wh: 37,
    warranty_months: 12,
    is_verified: true,
    image_url: TASK_LAMP_IMAGE_URL,
    stock_quantity: 110
  },
  // 11. Magnetic LED Work & Kitchen Tube Light
  {
    id: 'FO-LMP-TUBE',
    name: 'Forte StripLite 60cm Magnetic Rechargeable Tube Lamp',
    short_name: '60cm Magnetic Tube Light',
    category: 'lamp',
    description: 'Mounts under kitchen cabinets, study carrels, and boutique shelves with peel-and-stick magnetic plates. Motion-sensor or continuous mode.',
    specifications: {
      lamp_lumens: 650,
      battery_life_hours: '8 hours continuous run, 60 days on motion mode',
      inputs: ['Type-C In'],
      weight_kg: 0.35
    },
    price_naira: 14500,
    watts: 8,
    battery_wh: 18.5,
    warranty_months: 12,
    is_verified: true,
    image_url: TASK_LAMP_IMAGE_URL,
    stock_quantity: 95
  },
  // 12. 9W Automatic Rechargeable Inverter Bulb
  {
    id: 'FO-BLB-09W',
    name: 'Forte AutoGlow 9W Inverter Emergency LED Bulb',
    short_name: '9W Inverter Bulb',
    category: 'inverter_bulb',
    description: 'Screws into standard light bulb socket. Charges automatically while grid power is on; switches on instantly within 0.1s of blackout for 4 hours.',
    specifications: {
      lamp_lumens: 850,
      battery_life_hours: '4 hours backup time during blackout',
      inputs: ['Standard E27 or B22 Socket'],
      weight_kg: 0.15
    },
    price_naira: 5800,
    watts: 9,
    battery_wh: 7.4,
    warranty_months: 12,
    is_verified: true,
    image_url: TASK_LAMP_IMAGE_URL,
    stock_quantity: 200
  },
  // 13. 15W High-Lumen Living Room Inverter Bulb
  {
    id: 'FO-BLB-15W',
    name: 'Forte SuperGlow 15W High-Lumen Inverter Bulb',
    short_name: '15W Inverter Bulb',
    category: 'inverter_bulb',
    description: 'High-output emergency bulb for living rooms, shops, and pharmacies. Up to 5 hours backup with dual lithium internal cells.',
    specifications: {
      lamp_lumens: 1450,
      battery_life_hours: '5 hours continuous backup',
      inputs: ['Standard E27 or B22 Socket'],
      weight_kg: 0.22
    },
    price_naira: 8200,
    watts: 15,
    battery_wh: 11.1,
    warranty_months: 12,
    is_verified: true,
    image_url: TASK_LAMP_IMAGE_URL,
    stock_quantity: 140
  },
  // 14. 100W Smart Meter Braided Cable + Router Kit
  {
    id: 'FO-CBL-100W',
    name: 'Forte PowerLink 100W Watt-Display Cable & DC Router Jack Kit',
    short_name: '100W Watt-Meter Cable + DC Kit',
    category: 'cable',
    description: 'Heavy braided Kevlar USB-C to USB-C cable with real-time digital wattage display + 12V step-up adapter for MTN/Airtel/Spectranet WiFi routers.',
    specifications: {
      outputs: ['100W E-Marker PD', '12V DC 5.5x2.1mm Router Barrel Tip'],
      weight_kg: 0.12
    },
    price_naira: 7500,
    watts: 100,
    battery_wh: 0,
    warranty_months: 12,
    is_verified: true,
    image_url: TASK_LAMP_IMAGE_URL,
    stock_quantity: 250
  }
];

export const PREDEFINED_KITS: PredefinedKit[] = [
  {
    id: 'kit-student',
    code: 'FO-01',
    name: 'Study & Exam Resilience Box',
    target_audience: 'student',
    audience_title: 'Student & Researcher',
    tagline: 'Never study with candles or phone torch during exam season.',
    description: 'A focused, portable pack built to keep your laptop, smartphone, and reading desk powered through 12-hour campus library and hostel blackouts.',
    items: [
      { productId: 'FO-LMP-1200', quantity: 1 },
      { productId: 'FO-PB-60K', quantity: 1 }
    ],
    bundle_discount_percent: 8,
    daily_fuel_saved_liters: 1.5,
    generator_noise_reduction_db: 78,
    monthly_savings_naira: 42500,
    badge_label: 'Recommended for UNILAG, UI, OAU, UNN Hostels',
    typical_appliances: ['Laptop (35W)', 'Phone charging', 'Desk study light']
  },
  {
    id: 'kit-worker',
    code: 'FO-02',
    name: 'Remote Worker 24/7 Deep Work Box',
    target_audience: 'remote_worker',
    audience_title: 'Remote Worker & Tech Pro',
    tagline: 'Zero Zoom call drops when the neighbourhood transformer trips.',
    description: 'High-wattage laptop continuous run, uninterrupted WiFi router powering, silent airflow for video calls, and solar replenishing during the day.',
    items: [
      { productId: 'FO-PB-60K', quantity: 1 },
      { productId: 'FO-FAN-12DC', quantity: 1 },
      { productId: 'FO-SOL-40W', quantity: 1 },
      { productId: 'FO-LMP-1200', quantity: 1 }
    ],
    bundle_discount_percent: 12,
    daily_fuel_saved_liters: 3.5,
    generator_noise_reduction_db: 82,
    monthly_savings_naira: 98000,
    badge_label: 'Most Popular for Developers & Freelancers',
    typical_appliances: ['MacBook / ThinkPad', 'MTN/Airtel 5G Router', 'Quiet breeze for video calls', 'Desk illumination']
  },
  {
    id: 'kit-shop',
    code: 'FO-03',
    name: 'POS & Continuous Retail Box',
    target_audience: 'shop_owner',
    audience_title: 'Shop Owner & Merchant',
    tagline: 'Keep your store bright and your POS machine active all evening.',
    description: 'Customers walk past dark shops into yours. Powers two POS terminals, phone recharge kiosk, shopfront spotlight, and keeps shop attendants cool without generator fumes.',
    items: [
      { productId: 'FO-PB-60K', quantity: 1 },
      { productId: 'FO-FAN-12DC', quantity: 1 },
      { productId: 'FO-LMP-1200', quantity: 2 }
    ],
    bundle_discount_percent: 10,
    daily_fuel_saved_liters: 4.0,
    generator_noise_reduction_db: 85,
    monthly_savings_naira: 112000,
    badge_label: 'Essential for Pharmacies, Boutiques & Supermarkets',
    typical_appliances: ['2x POS Terminals', 'Barcode Scanner', 'Cashier Counter Light', 'Cooling Fan']
  },
  {
    id: 'kit-family',
    code: 'FO-04',
    name: 'Whole-Apartment Sleep & Light Box',
    target_audience: 'family',
    audience_title: 'Family & Apartment',
    tagline: 'Children sleep peacefully in cool air without inhaling carbon monoxide fumes.',
    description: 'Double the fan circulation, twin emergency lamps for living room and bedroom, and dual battery backup with high-yield solar refilling every morning.',
    items: [
      { productId: 'FO-PB-60K', quantity: 2 },
      { productId: 'FO-FAN-12DC', quantity: 2 },
      { productId: 'FO-LMP-1200', quantity: 2 },
      { productId: 'FO-SOL-40W', quantity: 1 }
    ],
    bundle_discount_percent: 15,
    daily_fuel_saved_liters: 6.0,
    generator_noise_reduction_db: 88,
    monthly_savings_naira: 168000,
    badge_label: 'Best for 2-3 Bedroom Homes',
    typical_appliances: ['Master & Kids Bedrooms', 'All Night Fan Airflow', 'Entire Flat Illumination', 'Family Phones']
  }
];

export const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Ogun', 'Kaduna', 'Kano', 'Enugu', 
  'Delta', 'Edo', 'Anambra', 'Akwa Ibom', 'Imo', 'Abia', 'Plateau', 'Kwara', 
  'Osun', 'Ondo', 'Cross River', 'Benue', 'Bauchi', 'Adamawa', 'Bayelsa', 'Bornu',
  'Ebonyi', 'Ekiti', 'Gombe', 'Jigawa', 'Kebbi', 'Kogi', 'Nasarawa', 'Niger',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];
