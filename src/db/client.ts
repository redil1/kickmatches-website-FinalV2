import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Use the correct fallback connection string that matches Docker setup
// Docker credentials: kickai:kickai@localhost:5432/kickai_matches
const connectionString = process.env.DATABASE_URL || 'postgresql://kickai:kickai@localhost:5432/kickai_matches'

// Configure connection pool with better error handling for Docker environment
export const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Increased timeout for Docker environment
  // Additional Docker-specific configuration
  ssl: false, // Disable SSL for local Docker connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
})

// Enhanced error handling for Docker environment
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  console.error('Connection string used:', connectionString.replace(/:\/\/.*@/, '://***:***@'))
  // Don't exit immediately in Docker environment, allow for reconnection
  if (process.env.NODE_ENV === 'production') {
    console.error('Database connection error in production, attempting to reconnect...')
  } else {
    process.exit(-1)
  }
})

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client from pool', err)
    console.error('Database URL:', connectionString.replace(/:\/\/.*@/, '://***:***@'))
  } else {
    console.log('✅ Successfully connected to Docker database')
    if (client) {
      release()
    }
  }
})

export const db = drizzle(pool)


