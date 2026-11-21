export const SIZES = [
  { id: 'S', label: 'Small', hint: 'under 20 lb', mult: 1 },
  { id: 'M', label: 'Medium', hint: '20-50 lb', mult: 1.3 },
  { id: 'L', label: 'Large', hint: '50-90 lb', mult: 1.7 },
  { id: 'XL', label: 'Giant', hint: '90 lb +', mult: 2.1 }
];

export const SERVICES = [
  { id: 'bath', name: 'Bath & Brush', base: 45, mins: 60, desc: 'Shampoo, conditioner, blow-dry, full brush-out.' },
  { id: 'full', name: 'Full Groom', base: 75, mins: 120, desc: 'Bath, haircut to breed or style, nails, ears.' },
  { id: 'puppy', name: 'Puppy Intro', base: 40, mins: 45, desc: 'Gentle first visit for pups under 6 months.' },
  { id: 'deshed', name: 'De-shed Treatment', base: 65, mins: 90, desc: 'Undercoat release, bath and blow-out. Great for huskies and labs.' },
  { id: 'spa', name: 'Spa Bath', base: 58, mins: 75, desc: 'Oatmeal soak, paw balm, soothing for itchy skin.' },
  { id: 'strip', name: 'Hand Strip', base: 95, mins: 150, desc: 'Traditional hand-stripping for wire-haired terriers.' },
  { id: 'nails', name: 'Nail Trim & File', base: 18, mins: 20, desc: 'Quick clip and smooth file. No appointment fuss.' },
  { id: 'teeth', name: 'Teeth Brushing', base: 15, mins: 15, desc: 'Enzyme toothpaste and a fresh-breath finish.' },
  { id: 'face', name: 'Face & Feet Tidy', base: 25, mins: 30, desc: 'Trim around eyes, muzzle and paw pads.' }
];

export const GROOMERS = [
  { id: 'any', name: 'First available' },
  { id: 'mara', name: 'Mara' },
  { id: 'jun', name: 'Jun' },
  { id: 'tess', name: 'Tess' }
];

export const SEED_DOGS = [
  { id: 'd1', name: 'Biscuit', breed: 'Golden Retriever', size: 'L' },
  { id: 'd2', name: 'Pickle', breed: 'Miniature Dachshund', size: 'S' }
];

export const priceFor = (svc, sizeId) => {
  const s = SIZES.find((x) => x.id === sizeId);
  return Math.round(svc.base * (s ? s.mult : 1));
};
export const durationFor = (svc, sizeId) => {
  const extra = sizeId === 'L' ? 15 : sizeId === 'XL' ? 30 : 0;
  return svc.mins + (svc.mins >= 60 ? extra : 0);
};
