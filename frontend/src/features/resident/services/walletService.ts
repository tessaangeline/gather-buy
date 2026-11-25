
import api from "../../../services/api";

export interface WalletResponse {
  message: string;
  wallet_balance: number | string;
}

export const topUpWallet = async (
  amount: number
): Promise<WalletResponse> => {
  const response = await api.post("/wallet/top-up", {
    amount,
  });

  return response.data;
};
