import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  // First connect without database to create it
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres'
  });

  try {
    // Check if database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'ai_environment_monitor']
    );

    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'ai_environment_monitor'}`);
      console.log('✓ Database created');
    } else {
      console.log('✓ Database already exists');
    }
  } catch (err: any) {
    if (err.code !== '42P04') { // Database already exists
      console.error('Error creating database:', err);
    }
  } finally {
    await adminPool.end();
  }

  // Connect to the actual database
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_environment_monitor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Create tables
    await pool.query(`
      -- Users table (with new columns)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add columns if they don't exist (for existing databases)
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
      EXCEPTION WHEN others THEN NULL;
      END $$;

      -- Weather Impacts table
      CREATE TABLE IF NOT EXISTS weather_impacts (
        id SERIAL PRIMARY KEY,
        crop_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        weather_condition VARCHAR(255) NOT NULL,
        temperature DECIMAL(5,2),
        humidity DECIMAL(5,2),
        rainfall DECIMAL(10,2),
        impact_level VARCHAR(50),
        ai_analysis TEXT,
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Carbon Footprints table
      CREATE TABLE IF NOT EXISTS carbon_footprints (
        id SERIAL PRIMARY KEY,
        activity_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        emission_source VARCHAR(255),
        co2_kg DECIMAL(10,2) NOT NULL,
        ch4_kg DECIMAL(10,4),
        n2o_kg DECIMAL(10,4),
        total_co2e DECIMAL(10,2),
        date DATE,
        ai_analysis TEXT,
        reduction_tips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Recycling Items table
      CREATE TABLE IF NOT EXISTS recycling_items (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        material_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        recyclable BOOLEAN DEFAULT true,
        special_instructions TEXT,
        environmental_impact VARCHAR(100),
        ai_analysis TEXT,
        disposal_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Energy Usages table
      CREATE TABLE IF NOT EXISTS energy_usages (
        id SERIAL PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        power_watts DECIMAL(10,2) NOT NULL,
        usage_hours DECIMAL(5,2),
        daily_kwh DECIMAL(10,4),
        monthly_kwh DECIMAL(10,2),
        monthly_cost DECIMAL(10,2),
        efficiency_rating VARCHAR(10),
        ai_analysis TEXT,
        optimization_tips TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Water Quality table
      CREATE TABLE IF NOT EXISTS water_quality (
        id SERIAL PRIMARY KEY,
        source_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        sample_date DATE,
        ph_level DECIMAL(4,2),
        turbidity DECIMAL(10,2),
        dissolved_oxygen DECIMAL(5,2),
        nitrate_level DECIMAL(10,2),
        lead_level DECIMAL(10,4),
        bacteria_count INTEGER,
        quality_index VARCHAR(50),
        ai_analysis TEXT,
        treatment_recommendations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Password Reset Tokens table
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User Settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'dark',
        notifications_enabled BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        language VARCHAR(10) DEFAULT 'en',
        data_sharing BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT false,
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit Logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100),
        entity_id VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Feedback table
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Support Tickets table
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- File Uploads table
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI Results table (persisted parsed AI responses)
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        analysis_type VARCHAR(100) NOT NULL,
        domain VARCHAR(100),
        entity_id VARCHAR(100),
        result JSONB NOT NULL,
        model_used VARCHAR(200) DEFAULT 'anthropic/claude-3-5-sonnet-20241022',
        confidence NUMERIC(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_results_type ON ai_results(analysis_type);
      CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);
    `);

    console.log('✓ All tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    await pool.end();
  }
};

setupDatabase()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database setup failed:', err);
    process.exit(1);
  });
