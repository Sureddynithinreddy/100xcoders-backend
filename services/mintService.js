import { walletClient } from "../config/web3Client.js";
import fs from "fs";
import path from "path";

const abiPath = path.resolve("./contracts/CertificateNFT.json");

// ✅ Raw ABI array, no .abi needed
const certificateABI = JSON.parse(
  fs.readFileSync(abiPath, "utf8")
);

export async function mintCertificate(
  walletAddress,
  courseId,
  courseName,
  metadataURI
) {

  const tx = await walletClient.writeContract({
    address: process.env.CONTRACT_ADDRESS,
    abi: certificateABI,
    functionName: "mintCertificate",
    args: [walletAddress, courseId, courseName, metadataURI]
  });

  return tx;
}