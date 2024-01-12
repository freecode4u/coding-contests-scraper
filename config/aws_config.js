require("dotenv").config();
const s3fs = require("@cyclic.sh/s3fs/promises")(
  process.env.CYCLIC_BUCKET_NAME
);

const initializeS3 = () => {
  const fs = s3fs(process.env.CYCLIC_BUCKET_NAME, {
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });

  return fs;
};

module.exports = { initializeS3 };
