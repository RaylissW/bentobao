
export const MARKUPS = {
  cosplay: 1.5,   // +50%
  cosmetics: 1.4, // +40%
  kpop: 1.35,     // +35%
  tech: 1.6,      // +60%
  discount: 1.25  // +25%
};

export const CATEGORIES = {
  cosplay: 'Косплей',
  cosmetics: 'Косметика',
  kpop: 'К-поп',
  tech: 'Техника',
  discount: 'Скидочная'
};

export function calculatePrice(costRub, category) {
  const markup = MARKUPS[category] || 1;
  return costRub * markup;
}