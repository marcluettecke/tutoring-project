export interface Account {
  id: string,
  firstname: string,
  lastname: string,
  email: string,
  password: string
}

export interface Accounts {
  accounts: Account[]
}
