// Real salon content: dogs, services, groomers. Durations are minutes by dog size.
export const dogs = [
  { id: 'biscuit', name: 'Biscuit', breed: 'Cockapoo', size: 'medium', weight: '13 kg', coat: 'Curly, matts behind the ears' },
  { id: 'juno', name: 'Juno', breed: 'Greyhound', size: 'large', weight: '29 kg', coat: 'Short, sheds lightly' },
  { id: 'pip', name: 'Pip', breed: 'Chihuahua', size: 'small', weight: '3 kg', coat: 'Smooth, sensitive skin' },
];

// minutes: [small, medium, large]; price in pounds
export const services = [
  { id: 'bath-brush', name: 'Bath and brush', minutes: [60, 75, 90], price: [28, 36, 46], blurb: 'Shampoo, towel dry, blow dry, full brush-out.' },
  { id: 'full-groom', name: 'Full groom', minutes: [105, 135, 165], price: [48, 62, 80], blurb: 'Bath, clip or scissor to a style, nails, ears, tidy paws.' },
  { id: 'puppy-intro', name: 'Puppy introduction', minutes: [45, 45, 60], price: [22, 22, 28], blurb: 'Short and gentle, under six months. Treats included.' },
  { id: 'de-shed', name: 'De-shedding treatment', minutes: [75, 90, 120], price: [34, 44, 58], blurb: 'Conditioning bath and undercoat rake for double coats.' },
  { id: 'hand-strip', name: 'Hand stripping', minutes: [120, 150, 180], price: [52, 66, 84], blurb: 'Wire coats: old coat pulled by hand, never clipped.' },
  { id: 'nail-trim', name: 'Nail trim and file', minutes: [15, 15, 30], price: [10, 10, 14], blurb: 'Clip, file smooth, tidy the pads.' },
  { id: 'teeth', name: 'Teeth clean', minutes: [30, 30, 45], price: [14, 16, 20], blurb: 'Enzyme paste and a brush, no sedation.' },
  { id: 'facial-paws', name: 'Blueberry facial and paw balm', minutes: [30, 30, 45], price: [12, 14, 18], blurb: 'Tear-stain wipe, face rinse and balm on dry pads.' },
];

export const groomers = [
  { id: 'mara', name: 'Mara Okafor', first: 'Mara' },
  { id: 'tobias', name: 'Tobias Lindqvist', first: 'Tobias' },
];

const SIZE_INDEX = { small: 0, medium: 1, large: 2 };
export const dogById = (id) => dogs.find((d) => d.id === id) ?? dogs[0];
export const serviceById = (id) => services.find((s) => s.id === id) ?? services[0];
export const groomerById = (id) => groomers.find((g) => g.id === id) ?? groomers[0];
export const minutesFor = (service, dog) => service.minutes[SIZE_INDEX[dog.size]];
export const priceFor = (service, dog) => service.price[SIZE_INDEX[dog.size]];
export const money = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n);

// Names of other owners' dogs, for the booked blocks on the tape.
export const otherDogs = ['Poppy', 'Mochi', 'Hank', 'Dolly', 'Rex', 'Nell', 'Waffles', 'Ziggy', 'Maple', 'Otis', 'Bella', 'Fergus'];
