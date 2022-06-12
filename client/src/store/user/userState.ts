interface UserState {
  address: string;
  balances: { [key: string]: { [key: string]: string } };
}

export default UserState;
