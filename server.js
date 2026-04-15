import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import mintRoute from "./routes/mintCertificate.js";

dotenv.config();

const app = express();

/*
---------------------------------------
CORS
---------------------------------------
*/

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));/// ← handle ALL preflight requests

/*
---------------------------------------
Middleware
---------------------------------------
*/

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

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
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