import dotenv from "dotenv";
dotenv.config();

import { createWalletClient, createPublicClient, http } from "viem"; // ✅ added createPublicClient
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PLATFORM_PRIVATE_KEY);

export const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.RPC_URL) // ✅ added RPC here
});

// ✅ added publicClient
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL) // ✅ added RPC here
});