import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

// Configuration object for the MSSQL client
const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT!), // Must be a number
  database: process.env.DB_NAME!,

  // CRITICAL FOR NETWORK STABILITY
  pool: {
    max: 10, // Don't allow more than 10 concurrent connections to the fragile server
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // We are using a self-signed cert or simple HTTP on the internal network usually
    trustServerCertificate: true, // Bypass SSL validation errors for the legacy server
    connectionTimeout: 30000, // 30 seconds before giving up on connecting
    requestTimeout: 30000, // 30 seconds before giving up on a query
  },
};

export const connectDB = async () => {
  try {
    // Await the connection to the pool
    const pool = await sql.connect(config);
    console.log(`✅ Connected to SQL Server: ${config.server}`);
    return pool;
  } catch (error) {
    console.error("❌ SQL Connection Failed:", (error as Error).message);
    process.exit(1);
  }
};

export { sql };
