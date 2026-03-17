import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import mintRoute from "./routes/mintCertificate.js";

dotenv.config();

const app = express();

/*
---------------------------------------
Middleware
---------------------------------------
*/

app.use(cors());

/* Increase payload size for certificate images */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/*
---------------------------------------
Health Check
---------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    status: "Web3 Backend Running",
    network: "Sepolia",
    service: "NFT Certificate Minting"
  });
});

/*
---------------------------------------
Routes
---------------------------------------
*/

app.use("/api/mint-certificate", mintRoute);

/*
---------------------------------------
Server Start
---------------------------------------
*/

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Web3 backend running on port ${PORT}`);
});