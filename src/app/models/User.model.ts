export interface Account {
  id: string,
  email: string,
  isAdmin: boolean
}

export interface UserInfo {
  uid: string,
  email: string | null,
  phoneNumber: string | null,
  isEmailVerified?: boolean,
  displayName: string | null
}
