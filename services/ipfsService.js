import axios from "axios";

export async function uploadMetadata(metadata) {

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    metadata,
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json"
      }
    }
  );

  return `ipfs://${res.data.IpfsHash}`;
}