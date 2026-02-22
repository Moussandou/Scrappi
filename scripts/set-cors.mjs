/**
 * Script to configure CORS on the Firebase Storage bucket.
 * Run with: node scripts/set-cors.mjs
 *
 * Prerequisites:
 *   npm install @google-cloud/storage
 *   gcloud auth application-default login (or set GOOGLE_APPLICATION_CREDENTIALS)
 */

import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = "scrappi-app.firebasestorage.app";

const corsConfig = [
    {
        origin: ["*"],
        method: ["GET", "HEAD", "OPTIONS"],
        maxAgeSeconds: 3600,
    },
];

async function main() {
    const storage = new Storage({ projectId: "scrappi-app" });
    const bucket = storage.bucket(BUCKET_NAME);

    await bucket.setCorsConfiguration(corsConfig);
    console.log(`CORS configuration applied to gs://${BUCKET_NAME}`);
    console.log(JSON.stringify(corsConfig, null, 2));
}

main().catch((err) => {
    console.error("Failed to set CORS:", err.message);
    process.exit(1);
});
