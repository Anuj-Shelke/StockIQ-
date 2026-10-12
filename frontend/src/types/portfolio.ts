export interface Holding {
  id: string
  portfolio_id: string
  symbol: string
  name?: string
  asset_type: 'EQUITY' | 'GOLD' | 'FD' | string
  quantity: number
  buy_price: number
  current_price: number
  created_at?: string
  sector?: string
}

export interface Portfolio {
  id: string
  user_id?: string
  name: string
  description?: string
  total_value: number
  holdings: Holding[]
  created_at?: string
  updated_at?: string
}

export interface HoldingFormData {
  symbol: string
  name?: string
  asset_type: string
  quantity: number
  buy_price: number
  current_price?: number
}

export interface StockCatalogItem {
  symbol: string
  name: string
  exchange: string
  sector: string
  current_price: number
  currency: string
}
