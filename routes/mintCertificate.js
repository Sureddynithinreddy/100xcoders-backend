import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { walletClient, publicClient } from "../config/web3Client.js";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

/*
-----------------------------------------
Load Contract ABI
-----------------------------------------
*/

const abiPath = path.resolve("./contracts/CertificateNFT.json");

const certificateABI = JSON.parse(
  fs.readFileSync(abiPath, "utf8")
);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = process.env.PINATA_API_URL;         // https://api.pinata.cloud
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL; // https://gateway.pinata.cloud

if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS is not set in .env");
if (!PINATA_JWT) throw new Error("PINATA_JWT is not set in .env");
if (!PINATA_API_URL) throw new Error("PINATA_API_URL is not set in .env");
if (!PINATA_GATEWAY_URL) throw new Error("PINATA_GATEWAY_URL is not set in .env");

/*
-----------------------------------------
Mint Certificate Route
-----------------------------------------
*/

router.post("/", async (req, res) => {

  let imagePath = null;

  try {

    const { certificateId, courseName, walletAddress, certificateImage } = req.body;

    if (!certificateImage || !walletAddress || !certificateId || !courseName) {
      return res.status(400).json({ error: "Missing data" });
    }

    const normalizedWallet = walletAddress.toLowerCase();

    /*
    -----------------------------------------
    Convert base64 → image file
    -----------------------------------------
    */

    const base64Data = certificateImage.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    imagePath = `/tmp/certificate-${Date.now()}.png`;

    fs.writeFileSync(imagePath, imageBuffer);

    /*
    -----------------------------------------
    Upload image to IPFS
    -----------------------------------------
    */

    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    const imageUpload = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${PINATA_JWT}`
        }
      }
    );

    const imageHash = imageUpload.data.IpfsHash;
    const imageURI = `${PINATA_GATEWAY_URL}/ipfs/${imageHash}`;

    console.log("Image URI:", imageURI);

    /*
    -----------------------------------------
    Create NFT Metadata
    -----------------------------------------
    */

    const metadata = {
      name: courseName,
      description: `Course Completion Certificate for ${courseName}`,
      image: imageURI,
      attributes: [
        {
          trait_type: "Certificate ID",
          value: certificateId
        },
        {
          trait_type: "Course Name",
          value: courseName
        }
      ]
    };

    /*
    -----------------------------------------
    Upload metadata to IPFS
    -----------------------------------------
    */

    const metadataUpload = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json"
        }
      }
    );

    const metadataHash = metadataUpload.data.IpfsHash;
    const metadataURI = `${PINATA_GATEWAY_URL}/ipfs/${metadataHash}`;

    console.log("Metadata URI:", metadataURI);

    /*
    -----------------------------------------
    Mint NFT on blockchain
    -----------------------------------------
    */

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: certificateABI,
      functionName: "mintCertificate",
      args: [normalizedWallet, certificateId, courseName, metadataURI]
    });

    console.log("NFT Minted TX:", txHash);

    /*
    -----------------------------------------
    Wait for receipt & extract Token ID
    -----------------------------------------
    */

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    //const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const transferLog = receipt.logs.find(
  (log) => log.topics[0] === process.env.TRANSFER_TOPIC
);

    const tokenId = transferLog
      ? BigInt(transferLog.topics[3]).toString()
      : null;

    console.log("Token ID:", tokenId);
    console.log("Contract Address:", CONTRACT_ADDRESS);

    /*
    -----------------------------------------
    Save NFT record to Supabase
    -----------------------------------------
    */

    const { error: dbError } = await supabase
      .from("nft_certificates")
      .insert({
        wallet_address: normalizedWallet,
        certificate_id: certificateId,
        course_name: courseName,
        metadata_uri: metadataURI,
        tx_hash: txHash,
        token_id: tokenId,
        contract_address: CONTRACT_ADDRESS
      });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    /*
    -----------------------------------------
    Delete temp image
    -----------------------------------------
    */

    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({
      success: true,
      txHash,
      metadataURI,
      tokenId,
      contractAddress: CONTRACT_ADDRESS
    });

  } catch (err) {
  console.error("MINT ERROR:", err);
  res.status(500).json({
    error: err.message,
    stack: err.stack // optional (remove later)
  });
}

});

export default router;