export interface Account {
  id: string,
  email: string,
  isAdmin: boolean
}

export interface UserInfo {
  uid: string,
  email: string,
  phoneNumber: string,
  isEmailVerified: boolean,
  displayName: string
}
