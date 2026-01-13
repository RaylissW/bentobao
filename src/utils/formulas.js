export const MARKUPS = {
  cosplay: 1.2,   // +20%
  cosmetics: 1.15, // +10%
  kpop: 1.25,     // +25%
  tech: 1.30,      // +30%
  discount: 1.10  // +10%
};

export const CATEGORIES = {
  cosplay: 'Косплей',
  cosmetics: 'Косметика',
  kpop: 'К-поп',
  tech: 'Техника',
  discount: 'Ринкан'
};

export function calculatePrice(costRub, category) {
  const markup = MARKUPS[category] || 1;  // Только категорийная наценка, комиссии уже в costRub
  return costRub * markup;
}