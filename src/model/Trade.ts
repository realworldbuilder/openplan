export const TRADES = [
  { id: 'general', name: 'General', color: '#9E9E9E' },
  { id: 'sitework', name: 'Sitework', color: '#8D6E63' },
  { id: 'concrete', name: 'Concrete', color: '#BDBDBD' },
  { id: 'steel', name: 'Structural Steel', color: '#546E7A' },
  { id: 'framing', name: 'Framing', color: '#FFB74D' },
  { id: 'roofing', name: 'Roofing', color: '#78909C' },
  { id: 'electrical', name: 'Electrical', color: '#64B5F6' },
  { id: 'plumbing', name: 'Plumbing', color: '#81C784' },
  { id: 'hvac', name: 'HVAC', color: '#FFD54F' },
  { id: 'fire-protection', name: 'Fire Protection', color: '#FF7043' },
  { id: 'insulation', name: 'Insulation', color: '#AED581' },
  { id: 'drywall', name: 'Drywall', color: '#CE93D8' },
  { id: 'painting', name: 'Painting', color: '#4FC3F7' },
  { id: 'flooring', name: 'Flooring', color: '#F48FB1' },
  { id: 'ceiling', name: 'Ceiling', color: '#FFF176' },
  { id: 'glazing', name: 'Glazing', color: '#4DD0E1' },
  { id: 'elevator', name: 'Elevator', color: '#7E57C2' },
  { id: 'commissioning', name: 'Commissioning', color: '#26A69A' },
  { id: 'demolition', name: 'Demolition', color: '#EF5350' },
  { id: 'carpentry', name: 'Carpentry', color: '#BCAAA4' },
  { id: 'finishing', name: 'Finishing', color: '#B39DDB' },
] as const;

export type TradeId = typeof TRADES[number]['id'];

export function getTradeColor(tradeId: string): string {
  const t = TRADES.find(t => t.id === tradeId);
  return t ? t.color : '#9E9E9E';
}
