export interface SelectOption {
  label: string
  value: string | number
}

export interface CrudField {
  prop: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'select' | 'switch'
  placeholder?: string
  required?: boolean
  query?: boolean
  table?: boolean
  width?: number
  options?: SelectOption[]
  disabledOnEdit?: boolean
}

export interface CrudApi {
  list: (query: any) => Promise<any>
  get: (id: number) => Promise<any>
  add: (data: any) => Promise<any>
  update: (data: any) => Promise<any>
  remove: (id: number) => Promise<any>
  toggle: (id: number, enabled: number) => Promise<any>
}

export interface DetailField {
  prop: string
  label: string
  span?: number
  options?: SelectOption[]
}
