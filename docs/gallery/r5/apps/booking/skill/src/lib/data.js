// Sample salon data. Prices in pence-free pounds, minutes per dog size. All values are sample data.
export const SIZES = { S: "Small, under 10 kg", M: "Medium, 10 to 25 kg", L: "Large, over 25 kg" };

export const DOGS = [
  { id: "juno", name: "Juno", breed: "Labrador", size: "L", weight: 29, tone: "accent" },
  { id: "biscuit", name: "Biscuit", breed: "Cockapoo", size: "M", weight: 12, tone: "muted" },
  { id: "pepper", name: "Pepper", breed: "Miniature Schnauzer", size: "S", weight: 8, tone: "mark" },
];

// price and minutes are [S, M, L]
export const SERVICES = [
  { id: "full", name: "Full groom", blurb: "Bath, blow-dry, cut or tidy, nails, ears.", price: [58, 72, 92], minutes: [90, 120, 150] },
  { id: "bath", name: "Bath and brush", blurb: "Shampoo, conditioner, blow-dry, brush-out.", price: [34, 44, 58], minutes: [45, 60, 75] },
  { id: "puppy", name: "Puppy first groom", blurb: "Under 6 months. Short, gentle, treats.", price: [26, 26, 30], minutes: [30, 30, 45] },
  { id: "deshed", name: "De-shed treatment", blurb: "Undercoat rake and bath to cut shedding.", price: [46, 60, 78], minutes: [60, 75, 105] },
  { id: "strip", name: "Hand-strip", blurb: "For wire coats. Done by hand, no clippers.", price: [66, 82, 104], minutes: [105, 120, 150] },
  { id: "senior", name: "Senior gentle groom", blurb: "Extra time, breaks, a non-slip table.", price: [62, 76, 96], minutes: [105, 120, 150] },
  { id: "flea", name: "Flea and tick bath", blurb: "Medicated bath, comb-through, rinse.", price: [38, 48, 62], minutes: [45, 60, 75] },
  { id: "face", name: "Face and sanitary trim", blurb: "Tidy around eyes, muzzle and back end.", price: [22, 26, 32], minutes: [30, 30, 45] },
  { id: "ears", name: "Ears, eyes and teeth", blurb: "Gentle clean and a tooth brush.", price: [16, 18, 20], minutes: [30, 30, 30] },
  { id: "nails", name: "Nail trim and paw tidy", blurb: "Clip, file, trim between the pads.", price: [12, 14, 16], minutes: [30, 30, 30] },
];

const SIZE_INDEX = { S: 0, M: 1, L: 2 };
export const serviceById = (id) => SERVICES.find((s) => s.id === id);
export const dogById = (id) => DOGS.find((d) => d.id === id);
export const priceFor = (service, dog) => service.price[SIZE_INDEX[dog.size]];
export const minutesFor = (service, dog) => service.minutes[SIZE_INDEX[dog.size]];

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
export const money = (n) => GBP.format(n);
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
export const timeLabel = (d) => TIME.format(d).replace(" ", "");
export const dayShort = (d) => new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);
export const dayLong = (d) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(d);
export const dayCard = (d) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d);
export const dayNum = (d) => d.getDate();
export const duration = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
};
export const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseISODay = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
