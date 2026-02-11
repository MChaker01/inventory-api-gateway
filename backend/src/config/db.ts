import sql from "mssql";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
dotenv.config({ path: envFile });

console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`🔧 Connecting to: ${process.env.DB_SERVER}`);

const useWindowsAuth = !process.env.DB_USER || !process.env.DB_PASSWORD;

// Check if server name contains instance (has backslash)
const isNamedInstance = process.env.DB_SERVER!.includes("\\");

let config: sql.config;

if (useWindowsAuth) {
  // Windows Authentication Configuration
  config = {
    server: process.env.DB_SERVER!,
    // ✅ FIX: Only add port if it's NOT a named instance
    // Named instances use SQL Server Browser, not fixed ports
    database: process.env.DB_NAME!,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      trustedConnection: true,
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };

  // Only add port for default instances (no backslash in server name)
  if (!isNamedInstance && process.env.DB_PORT) {
    config.port = parseInt(process.env.DB_PORT);
  }
} else {
  // SQL Server Authentication Configuration
  config = {
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    server: process.env.DB_SERVER!,
    database: process.env.DB_NAME!,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };

  // Only add port for default instances
  if (!isNamedInstance && process.env.DB_PORT) {
    config.port = parseInt(process.env.DB_PORT);
  }
}

export const connectDB = async () => {
  try {
    console.log(`🔐 Auth mode: ${useWindowsAuth ? "Windows" : "SQL Server"}`);
    console.log(
      `🔐 Server type: ${isNamedInstance ? "Named Instance" : "Default Instance"}`,
    );

    const pool = await sql.connect(config);
    console.log(
      `✅ Connected to SQL Server: ${config.server}/${config.database}`,
    );
    return pool;
  } catch (error) {
    console.error("❌ SQL Connection Failed:", (error as Error).message);

    if (process.env.NODE_ENV !== "production") {
      console.log("\n💡 TROUBLESHOOTING:");
      console.log(
        "   1. Verify server name in SSMS (e.g., localhost\\SQLEXPRESS)",
      );
      console.log(
        "   2. Check if SQL Server service is running (services.msc)",
      );
      console.log(
        "   3. For named instances, SQL Server Browser must be running",
      );
      console.log(
        "   4. Verify TCP/IP is enabled in SQL Configuration Manager\n",
      );
    }

    process.exit(1);
  }
};

export { sql };
