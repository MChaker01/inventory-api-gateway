import sql from "mssql";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: envFile });

// 1. Cache for connection pools (Agadir, Marrakech, Rabat)
const pools = new Map<string, sql.ConnectionPool>();

/**
 * Creates a configuration object for a specific database city.
 * Preserves Windows Auth and Named Instance logic from original db.ts
 */
const createConfig = (dbName: string): sql.config => {
  const useWindowsAuth = !process.env.DB_USER || !process.env.DB_PASSWORD;
  const isNamedInstance = process.env.DB_SERVER!.includes("\\");

  const baseConfig: sql.config = {
    server: process.env.DB_SERVER!,
    database: dbName, // Dynamic database name
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      ...(useWindowsAuth && { trustedConnection: true }),
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };

  // Only add port if it is NOT a named instance
  if (!isNamedInstance && process.env.DB_PORT) {
    baseConfig.port = parseInt(process.env.DB_PORT);
  }

  // Add credentials if not using Windows Auth
  if (!useWindowsAuth) {
    baseConfig.user = process.env.DB_USER;
    baseConfig.password = process.env.DB_PASSWORD;
  }

  return baseConfig;
};

/**
 * Fetches an existing pool or creates a new one for the requested branch.
 * @param branch - 'agadir', 'marrakech', or 'rabat'
 */
export const getPool = async (branch: string): Promise<sql.ConnectionPool> => {
  const normalizedBranch = branch.toLowerCase().trim();
  const dbName = `controll_stock_${normalizedBranch}`;

  // Return cached pool if it exists to avoid re-connecting
  if (pools.has(normalizedBranch)) {
    return pools.get(normalizedBranch)!;
  }

  console.log(`🌐 Branch Switch: Connecting to ${dbName}...`);
  const config = createConfig(dbName);

  try {
    const pool = new sql.ConnectionPool(config);
    const connectedPool = await pool.connect();
    pools.set(normalizedBranch, connectedPool);
    return connectedPool;
  } catch (error) {
    console.error(
      `❌ Connection failed for ${dbName}:`,
      (error as Error).message,
    );
    throw error;
  }
};

/**
 * Initial startup check.
 * Ensures the server can talk to the default database (Agadir).
 */
export const connectDB = async () => {
  try {
    await getPool("agadir");
    console.log("✅ Multi-Pool Database System Ready (Default: Agadir)");
  } catch (error) {
    console.error("❌ SQL Initial Connection Failed");
    process.exit(1);
  }
};

export { sql };
