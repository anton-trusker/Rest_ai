export interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  type: 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Fortified' | 'Dessert';
  region: string;
  country: string;
  volume: number;
  abv: number;
  price: number;
  sku: string;
  barcode?: string;
  grapeVarieties: string[];
  stockUnopened: number;
  stockOpened: number;
  minStockLevel: number;
  hasImage: boolean;
  imageUrl?: string;
  tastingNotes?: string;
  location: string;
  isActive: boolean;
}

export const mockWines: Wine[] = [
  { id: '1', name: 'Château Margaux', producer: 'Château Margaux', vintage: 2015, type: 'Red', region: 'Bordeaux', country: 'France', volume: 750, abv: 13.5, price: 450, sku: 'CM-2015-750', barcode: '3760004131201', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 10, stockOpened: 2, minStockLevel: 6, hasImage: true, tastingNotes: 'Elegant tannins with blackcurrant and cedar notes', location: 'Cellar A - Rack 3', isActive: true },
  { id: '2', name: 'Barolo Riserva', producer: 'Giuseppe Rinaldi', vintage: 2018, type: 'Red', region: 'Piedmont', country: 'Italy', volume: 750, abv: 14.5, price: 89, sku: 'BR-2018-750', barcode: '8000174001050', grapeVarieties: ['Nebbiolo'], stockUnopened: 2, stockOpened: 0, minStockLevel: 6, hasImage: true, tastingNotes: 'Rose petals, tar, and dark cherry with firm tannins', location: 'Cellar A - Rack 5', isActive: true },
  { id: '3', name: 'Sassicaia', producer: 'Tenuta San Guido', vintage: 2019, type: 'Red', region: 'Tuscany', country: 'Italy', volume: 750, abv: 14, price: 220, sku: 'SS-2019-750', grapeVarieties: ['Cabernet Sauvignon', 'Cabernet Franc'], stockUnopened: 0, stockOpened: 0, minStockLevel: 4, hasImage: false, location: 'Cellar B - Rack 1', isActive: true },
  { id: '4', name: 'Opus One', producer: 'Opus One Winery', vintage: 2020, type: 'Red', region: 'Napa Valley', country: 'USA', volume: 750, abv: 14.5, price: 400, sku: 'OO-2020-750', barcode: '0086003123458', grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'], stockUnopened: 15, stockOpened: 1, minStockLevel: 8, hasImage: true, tastingNotes: 'Rich blend with dark fruit and vanilla oak notes', location: 'Cellar A - Rack 1', isActive: true },
  { id: '5', name: 'Dom Pérignon', producer: 'Moët & Chandon', vintage: 2012, type: 'Sparkling', region: 'Champagne', country: 'France', volume: 750, abv: 12.5, price: 280, sku: 'DP-2012-750', barcode: '3185370554210', grapeVarieties: ['Chardonnay', 'Pinot Noir'], stockUnopened: 8, stockOpened: 0, minStockLevel: 4, hasImage: true, tastingNotes: 'Toasty brioche with citrus and mineral notes', location: 'Cellar B - Rack 2', isActive: true },
  { id: '6', name: 'Cloudy Bay', producer: 'Cloudy Bay Vineyards', vintage: 2023, type: 'White', region: 'Marlborough', country: 'New Zealand', volume: 750, abv: 13, price: 28, sku: 'CB-2023-750', grapeVarieties: ['Sauvignon Blanc'], stockUnopened: 24, stockOpened: 3, minStockLevel: 12, hasImage: true, tastingNotes: 'Vibrant passionfruit and grapefruit with herbaceous edge', location: 'Bar Fridge', isActive: true },
  { id: '7', name: 'Whispering Angel', producer: 'Château d\'Esclans', vintage: 2023, type: 'Rosé', region: 'Provence', country: 'France', volume: 750, abv: 13, price: 24, sku: 'WA-2023-750', grapeVarieties: ['Grenache', 'Cinsault'], stockUnopened: 18, stockOpened: 2, minStockLevel: 10, hasImage: true, tastingNotes: 'Pale pink with strawberry and white peach', location: 'Bar Fridge', isActive: true },
  { id: '8', name: 'Penfolds Grange', producer: 'Penfolds', vintage: 2016, type: 'Red', region: 'Barossa Valley', country: 'Australia', volume: 750, abv: 14.5, price: 680, sku: 'PG-2016-750', grapeVarieties: ['Shiraz'], stockUnopened: 4, stockOpened: 0, minStockLevel: 3, hasImage: true, tastingNotes: 'Concentrated dark fruit, spice, and chocolatey oak', location: 'Cellar A - Rack 2', isActive: true },
  { id: '9', name: 'Tignanello', producer: 'Marchesi Antinori', vintage: 2020, type: 'Red', region: 'Tuscany', country: 'Italy', volume: 750, abv: 14, price: 120, sku: 'TG-2020-750', grapeVarieties: ['Sangiovese', 'Cabernet Sauvignon'], stockUnopened: 6, stockOpened: 1, minStockLevel: 4, hasImage: true, location: 'Cellar B - Rack 3', isActive: true },
  { id: '10', name: 'Chablis Grand Cru', producer: 'William Fèvre', vintage: 2021, type: 'White', region: 'Burgundy', country: 'France', volume: 750, abv: 13, price: 75, sku: 'CG-2021-750', grapeVarieties: ['Chardonnay'], stockUnopened: 5, stockOpened: 1, minStockLevel: 6, hasImage: true, tastingNotes: 'Crisp minerality with citrus and flinty notes', location: 'Cellar B - Rack 4', isActive: true },
  { id: '11', name: 'Château Margaux', producer: 'Château Margaux', vintage: 2018, type: 'Red', region: 'Bordeaux', country: 'France', volume: 750, abv: 13.5, price: 520, sku: 'CM-2018-750', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 6, stockOpened: 0, minStockLevel: 4, hasImage: true, location: 'Cellar A - Rack 3', isActive: true },
  { id: '12', name: 'Château Margaux', producer: 'Château Margaux', vintage: 2015, type: 'Red', region: 'Bordeaux', country: 'France', volume: 375, abv: 13.5, price: 240, sku: 'CM-2015-375', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 3, stockOpened: 0, minStockLevel: 2, hasImage: true, location: 'Cellar A - Rack 3', isActive: true },
];

export interface InventoryMovement {
  id: string;
  wineId: string;
  wineName: string;
  userId: string;
  userName: string;
  method: 'manual' | 'barcode' | 'image_ai';
  unopened: number;
  opened: number;
  confidence?: number;
  notes?: string;
  timestamp: string;
  sessionId: string;
}

export const mockMovements: InventoryMovement[] = [
  { id: 'm1', wineId: '1', wineName: 'Château Margaux 2015 750ml', userId: '2', userName: 'Sarah Miller', method: 'barcode', unopened: 10, opened: 2, timestamp: '2026-02-09T14:45:00', sessionId: 'S004', notes: '' },
  { id: 'm2', wineId: '2', wineName: 'Barolo Riserva 2018 750ml', userId: '2', userName: 'Sarah Miller', method: 'image_ai', unopened: 2, opened: 0, confidence: 92.5, timestamp: '2026-02-09T14:38:00', sessionId: 'S004' },
  { id: 'm3', wineId: '4', wineName: 'Opus One 2020 750ml', userId: '1', userName: 'Marco Rossi', method: 'manual', unopened: 15, opened: 1, timestamp: '2026-02-09T13:15:00', sessionId: 'S003' },
  { id: 'm4', wineId: '5', wineName: 'Dom Pérignon 2012 750ml', userId: '2', userName: 'Sarah Miller', method: 'barcode', unopened: 8, opened: 0, timestamp: '2026-02-08T16:20:00', sessionId: 'S002' },
  { id: 'm5', wineId: '6', wineName: 'Cloudy Bay 2023 750ml', userId: '1', userName: 'Marco Rossi', method: 'manual', unopened: 24, opened: 3, timestamp: '2026-02-08T15:00:00', sessionId: 'S001' },
  { id: 'm6', wineId: '9', wineName: 'Tignanello 2020 750ml', userId: '2', userName: 'Sarah Miller', method: 'image_ai', unopened: 6, opened: 1, confidence: 88.3, timestamp: '2026-02-08T14:30:00', sessionId: 'S002' },
];

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  lastLogin: string;
  totalCounts: number;
}

export const mockUsers: MockUser[] = [
  { id: '1', name: 'Marco Rossi', email: 'admin@wine.com', role: 'admin', status: 'active', lastLogin: '2026-02-09T14:00:00', totalCounts: 432 },
  { id: '2', name: 'Sarah Miller', email: 'staff@wine.com', role: 'staff', status: 'active', lastLogin: '2026-02-09T14:45:00', totalCounts: 287 },
  { id: '3', name: 'John Davis', email: 'john@wine.com', role: 'staff', status: 'active', lastLogin: '2026-02-08T18:30:00', totalCounts: 156 },
  { id: '4', name: 'Elena Garcia', email: 'elena@wine.com', role: 'staff', status: 'inactive', lastLogin: '2026-01-15T10:00:00', totalCounts: 89 },
];
