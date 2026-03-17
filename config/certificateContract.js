import fs from "fs";
import path from "path";
import { walletClient } from "./web3Client.js";

const abiPath = path.resolve("./contracts/CertificateNFT.json");

const certificateABI = JSON.parse(
  fs.readFileSync(abiPath, "utf8")
);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export const mintCertificateNFT = async (
  walletAddress,
  courseId,
  courseName,
  metadataURI
) => {

  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: certificateABI,
    functionName: "mintCertificate",
    args: [walletAddress, courseId, courseName, metadataURI]
  });

  return txHash;

};

export const certificateContract = {
  address: CONTRACT_ADDRESS,
  abi: certificateABI
};