export interface Account {
  id: string,
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  isAdmin: boolean
}

export interface Accounts {
  accounts: Account[]
}
