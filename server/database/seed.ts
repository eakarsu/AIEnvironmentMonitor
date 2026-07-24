import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

const seedDatabase = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_environment_monitor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Clear existing data
    await pool.query(`
      TRUNCATE users, weather_impacts, carbon_footprints, recycling_items, energy_usages, water_quality,
      password_reset_tokens, user_settings, notifications, audit_logs, feedback, support_tickets, file_uploads
      RESTART IDENTITY CASCADE
    `);
    console.log('✓ Cleared existing data');

    // Seed Users
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await pool.query(`
      INSERT INTO users (email, password, name, role, email_verified) VALUES
      ('demo@example.com', $1, 'Demo User', 'user', true),
      ('admin@example.com', $1, 'Admin User', 'admin', true)
    `, [hashedPassword]);
    console.log('✓ Users seeded');

    // Seed Weather Impacts (17 items)
    await pool.query(`
      INSERT INTO weather_impacts (crop_name, location, weather_condition, temperature, humidity, rainfall, impact_level) VALUES
      ('Wheat', 'Kansas, USA', 'Drought', 35.5, 25.0, 5.0, 'High'),
      ('Corn', 'Iowa, USA', 'Heavy Rain', 22.0, 85.0, 150.0, 'Medium'),
      ('Rice', 'Thailand', 'Monsoon', 28.5, 92.0, 300.0, 'Low'),
      ('Soybeans', 'Brazil', 'Heat Wave', 38.0, 30.0, 0.0, 'Critical'),
      ('Cotton', 'Texas, USA', 'Normal', 30.0, 45.0, 25.0, 'Low'),
      ('Coffee', 'Colombia', 'Frost', 2.0, 70.0, 10.0, 'Critical'),
      ('Sugarcane', 'India', 'Flood', 26.0, 95.0, 400.0, 'High'),
      ('Tomatoes', 'California, USA', 'Mild', 24.0, 55.0, 15.0, 'Low'),
      ('Potatoes', 'Idaho, USA', 'Cool', 15.0, 60.0, 30.0, 'Low'),
      ('Grapes', 'France', 'Hail', 18.0, 75.0, 45.0, 'High'),
      ('Oranges', 'Florida, USA', 'Hurricane Warning', 29.0, 88.0, 200.0, 'Critical'),
      ('Apples', 'Washington, USA', 'Early Frost', 0.5, 65.0, 8.0, 'Medium'),
      ('Bananas', 'Ecuador', 'Tropical Storm', 27.0, 90.0, 180.0, 'High'),
      ('Olives', 'Spain', 'Drought', 36.0, 20.0, 2.0, 'High'),
      ('Cocoa', 'Ghana', 'Heavy Rain', 25.0, 88.0, 220.0, 'Medium'),
      ('Tea', 'Sri Lanka', 'Normal Monsoon', 23.0, 80.0, 150.0, 'Low'),
      ('Peanuts', 'Georgia, USA', 'Dry Spell', 32.0, 40.0, 8.0, 'Medium')
    `);
    console.log('✓ Weather impacts seeded (17 items)');

    // Seed Carbon Footprints (17 items)
    await pool.query(`
      INSERT INTO carbon_footprints (activity_name, category, emission_source, co2_kg, ch4_kg, n2o_kg, total_co2e, date) VALUES
      ('Daily Commute', 'Transportation', 'Gasoline Car', 8.5, 0.01, 0.001, 8.8, '2024-01-15'),
      ('Home Heating', 'Energy', 'Natural Gas', 12.0, 0.05, 0.002, 13.5, '2024-01-15'),
      ('Air Travel NYC-LA', 'Transportation', 'Jet Fuel', 350.0, 0.1, 0.05, 365.0, '2024-01-20'),
      ('Beef Consumption', 'Food', 'Livestock', 27.0, 1.5, 0.1, 65.0, '2024-01-21'),
      ('Electricity Usage', 'Energy', 'Coal Power', 15.0, 0.02, 0.003, 15.8, '2024-01-22'),
      ('Online Shopping Delivery', 'Shopping', 'Diesel Truck', 2.5, 0.005, 0.001, 2.7, '2024-01-23'),
      ('Lawn Mowing', 'Home', 'Gasoline', 1.2, 0.02, 0.001, 1.5, '2024-01-24'),
      ('Streaming Video 8hrs', 'Digital', 'Data Center', 0.4, 0.001, 0.0001, 0.45, '2024-01-25'),
      ('Dairy Products Weekly', 'Food', 'Livestock', 8.0, 0.5, 0.05, 15.0, '2024-01-26'),
      ('Public Transit', 'Transportation', 'Electric Rail', 0.5, 0.001, 0.0001, 0.55, '2024-01-27'),
      ('Home Cooling', 'Energy', 'Electricity', 6.0, 0.01, 0.001, 6.3, '2024-01-28'),
      ('Fast Fashion Purchase', 'Shopping', 'Manufacturing', 25.0, 0.1, 0.02, 28.0, '2024-01-29'),
      ('Waste to Landfill', 'Waste', 'Decomposition', 3.0, 0.8, 0.01, 25.0, '2024-01-30'),
      ('Smartphone Charging Year', 'Digital', 'Electricity', 2.0, 0.005, 0.001, 2.2, '2024-02-01'),
      ('Restaurant Meal', 'Food', 'Mixed Sources', 5.0, 0.1, 0.02, 8.0, '2024-02-02'),
      ('Home Office Equipment', 'Digital', 'Manufacturing', 150.0, 0.2, 0.05, 158.0, '2024-02-03'),
      ('Weekly Groceries', 'Food', 'Mixed Transport', 10.0, 0.15, 0.03, 15.5, '2024-02-04')
    `);
    console.log('✓ Carbon footprints seeded (17 items)');

    // Seed Recycling Items (18 items)
    await pool.query(`
      INSERT INTO recycling_items (item_name, material_type, category, recyclable, special_instructions, environmental_impact) VALUES
      ('Plastic Water Bottle', 'PET Plastic #1', 'Plastic', true, 'Remove cap, rinse clean', 'High'),
      ('Aluminum Can', 'Aluminum', 'Metal', true, 'Rinse clean, can crush', 'Medium'),
      ('Cardboard Box', 'Corrugated Cardboard', 'Paper', true, 'Flatten, remove tape', 'Low'),
      ('Glass Wine Bottle', 'Clear Glass', 'Glass', true, 'Remove cork, rinse', 'Medium'),
      ('Newspaper', 'Newsprint', 'Paper', true, 'Keep dry, bundle together', 'Low'),
      ('Plastic Bag', 'LDPE Plastic #4', 'Plastic', false, 'Return to store collection', 'High'),
      ('Styrofoam Container', 'Polystyrene #6', 'Plastic', false, 'Check local facility', 'Critical'),
      ('Battery AA', 'Lithium/Alkaline', 'Hazardous', false, 'Special recycling center', 'Critical'),
      ('Pizza Box', 'Cardboard', 'Paper', false, 'Greasy parts not recyclable', 'Medium'),
      ('Milk Jug', 'HDPE Plastic #2', 'Plastic', true, 'Rinse, replace cap', 'Medium'),
      ('Tin Can', 'Steel/Tin', 'Metal', true, 'Rinse, remove label optional', 'Low'),
      ('Magazine', 'Glossy Paper', 'Paper', true, 'Remove plastic wrap', 'Low'),
      ('Light Bulb CFL', 'Glass/Mercury', 'Hazardous', false, 'Special disposal required', 'Critical'),
      ('Yogurt Cup', 'PP Plastic #5', 'Plastic', true, 'Rinse thoroughly', 'Medium'),
      ('Electronics Phone', 'Mixed Materials', 'E-Waste', false, 'E-waste recycling center', 'Critical'),
      ('Wine Cork', 'Natural Cork', 'Organic', true, 'Special cork recycling', 'Low'),
      ('Bubble Wrap', 'LDPE Plastic #4', 'Plastic', false, 'Return to store', 'High'),
      ('Metal Coat Hanger', 'Steel Wire', 'Metal', true, 'Donate or metal recycling', 'Low')
    `);
    console.log('✓ Recycling items seeded (18 items)');

    // Seed Energy Usages (18 items)
    await pool.query(`
      INSERT INTO energy_usages (device_name, category, power_watts, usage_hours, daily_kwh, monthly_kwh, monthly_cost, efficiency_rating) VALUES
      ('Central Air Conditioner', 'HVAC', 3500, 8, 28.0, 840.0, 126.00, 'B'),
      ('Electric Water Heater', 'Water Heating', 4500, 3, 13.5, 405.0, 60.75, 'C'),
      ('Refrigerator', 'Kitchen', 150, 24, 3.6, 108.0, 16.20, 'A'),
      ('Clothes Dryer', 'Laundry', 3000, 1, 3.0, 90.0, 13.50, 'C'),
      ('Washing Machine', 'Laundry', 500, 1, 0.5, 15.0, 2.25, 'A'),
      ('Dishwasher', 'Kitchen', 1800, 1, 1.8, 54.0, 8.10, 'B'),
      ('LED TV 55 inch', 'Entertainment', 100, 5, 0.5, 15.0, 2.25, 'A+'),
      ('Desktop Computer', 'Office', 300, 8, 2.4, 72.0, 10.80, 'B'),
      ('Laptop', 'Office', 65, 8, 0.52, 15.6, 2.34, 'A+'),
      ('Microwave', 'Kitchen', 1200, 0.5, 0.6, 18.0, 2.70, 'B'),
      ('Electric Oven', 'Kitchen', 2500, 1, 2.5, 75.0, 11.25, 'C'),
      ('Pool Pump', 'Outdoor', 1500, 6, 9.0, 270.0, 40.50, 'C'),
      ('Space Heater', 'HVAC', 1500, 4, 6.0, 180.0, 27.00, 'D'),
      ('Ceiling Fan', 'HVAC', 75, 8, 0.6, 18.0, 2.70, 'A'),
      ('Hair Dryer', 'Personal', 1875, 0.25, 0.47, 14.1, 2.11, 'C'),
      ('Gaming Console', 'Entertainment', 200, 3, 0.6, 18.0, 2.70, 'B'),
      ('Smart Home Hub', 'Smart Home', 10, 24, 0.24, 7.2, 1.08, 'A+'),
      ('Electric Vehicle Charger', 'Transportation', 7200, 2, 14.4, 432.0, 64.80, 'A')
    `);
    console.log('✓ Energy usages seeded (18 items)');

    // Seed Water Quality (17 items)
    await pool.query(`
      INSERT INTO water_quality (source_name, location, sample_date, ph_level, turbidity, dissolved_oxygen, nitrate_level, lead_level, bacteria_count, quality_index) VALUES
      ('City Municipal Supply', 'Downtown Station', '2024-01-15', 7.2, 0.5, 8.5, 3.2, 0.001, 0, 'Excellent'),
      ('Private Well A', 'Rural Farm District', '2024-01-16', 6.8, 2.1, 7.0, 8.5, 0.005, 12, 'Good'),
      ('River Intake Point', 'Industrial Zone', '2024-01-17', 7.5, 5.2, 6.5, 12.0, 0.015, 45, 'Fair'),
      ('Lake Reservoir', 'Mountain Region', '2024-01-18', 7.0, 1.2, 9.0, 2.0, 0.002, 5, 'Excellent'),
      ('Groundwater Well B', 'Suburban Area', '2024-01-19', 7.8, 0.8, 7.5, 5.5, 0.003, 8, 'Good'),
      ('Spring Source', 'Forest Preserve', '2024-01-20', 6.9, 0.3, 9.5, 1.5, 0.001, 2, 'Excellent'),
      ('Treatment Plant Output', 'Water District 5', '2024-01-21', 7.4, 0.2, 8.0, 2.8, 0.001, 0, 'Excellent'),
      ('Desalination Plant', 'Coastal City', '2024-01-22', 7.1, 0.4, 7.8, 1.0, 0.002, 0, 'Excellent'),
      ('Agricultural Runoff', 'Farming Valley', '2024-01-23', 6.5, 8.5, 5.0, 25.0, 0.008, 120, 'Poor'),
      ('Storm Drain Output', 'Urban Center', '2024-01-24', 6.2, 15.0, 4.5, 18.0, 0.025, 250, 'Critical'),
      ('Recycled Water', 'Reclamation Facility', '2024-01-25', 7.3, 0.6, 7.2, 4.0, 0.002, 5, 'Good'),
      ('School Water Fountain', 'Elementary School', '2024-01-26', 7.0, 0.4, 8.2, 2.5, 0.012, 3, 'Good'),
      ('Hospital Supply', 'Medical Center', '2024-01-27', 7.2, 0.2, 8.8, 2.0, 0.001, 0, 'Excellent'),
      ('Swimming Pool', 'Community Center', '2024-01-28', 7.4, 0.3, 7.0, 1.8, 0.001, 0, 'Excellent'),
      ('Fire Hydrant Sample', 'Residential Block', '2024-01-29', 7.1, 1.5, 7.5, 3.5, 0.004, 15, 'Good'),
      ('Rainwater Collection', 'Green Building', '2024-01-30', 6.0, 2.0, 8.0, 0.5, 0.001, 20, 'Fair'),
      ('Bottled Water Test', 'Distribution Center', '2024-02-01', 7.0, 0.1, 8.5, 1.0, 0.001, 0, 'Excellent')
    `);
    console.log('✓ Water quality seeded (17 items)');

    // Seed User Settings
    await pool.query(`
      INSERT INTO user_settings (user_id, theme, notifications_enabled, email_notifications, language, data_sharing) VALUES
      (1, 'dark', true, true, 'en', false),
      (2, 'dark', true, true, 'en', true)
    `);
    console.log('✓ User settings seeded');

    // Seed Notifications (16 items)
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, read, link) VALUES
      (1, 'Welcome to AI Environment Monitor', 'Your account has been created. Explore our 5 environmental modules!', 'info', true, '/dashboard'),
      (1, 'Critical Water Quality Alert', 'Storm Drain Output in Urban Center has critical contamination levels', 'alert', false, '/water'),
      (1, 'High Carbon Emissions Detected', 'Air Travel NYC-LA recorded 365 kg CO2e - consider alternatives', 'warning', false, '/carbon'),
      (1, 'Weather Alert: Heat Wave', 'Soybeans in Brazil facing critical heat wave conditions', 'alert', false, '/weather'),
      (1, 'Energy Optimization Tip', 'Your Space Heater rated D - consider upgrading to A+ rated model', 'info', false, '/energy'),
      (1, 'Recycling Reminder', 'Styrofoam containers require special disposal at recycling centers', 'info', true, '/recycling'),
      (1, 'Weekly Summary Available', 'Your weekly environmental impact summary is ready to view', 'info', false, '/dashboard'),
      (1, 'New AI Analysis Complete', 'Weather impact analysis for Wheat in Kansas is now available', 'success', false, '/weather'),
      (1, 'Lead Level Warning', 'School Water Fountain lead level (0.012) is near the safety threshold', 'warning', false, '/water'),
      (1, 'Battery Disposal Reminder', 'AA Batteries require special recycling - find centers near you', 'info', false, '/recycling'),
      (1, 'System Update', 'New features added: Search, Export, Charts, and Notifications', 'info', false, '/dashboard'),
      (1, 'Carbon Goal Progress', 'You reduced your carbon footprint by 15% this month!', 'success', true, '/carbon'),
      (2, 'Admin: New User Registration', 'A new user has registered on the platform', 'info', false, '/admin'),
      (2, 'Admin: System Health Check', 'All systems operational - database responding normally', 'success', true, '/admin'),
      (2, 'Admin: Storage Warning', 'File uploads approaching 80% of allocated storage', 'warning', false, '/admin'),
      (2, 'Admin: Weekly Report', 'System usage report for the past week is available', 'info', false, '/admin')
    `);
    console.log('✓ Notifications seeded (16 items)');

    // Seed Audit Logs (16 items)
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES
      (1, 'LOGIN', 'auth', NULL, '{"method":"POST","path":"/api/auth/login"}'),
      (1, 'CREATE', 'weather_impacts', '1', '{"method":"POST","path":"/api/weather"}'),
      (1, 'UPDATE', 'weather_impacts', '1', '{"method":"PUT","path":"/api/weather/1"}'),
      (1, 'CREATE', 'carbon_footprints', '1', '{"method":"POST","path":"/api/carbon"}'),
      (2, 'LOGIN', 'auth', NULL, '{"method":"POST","path":"/api/auth/login"}'),
      (2, 'CREATE', 'energy_usages', '1', '{"method":"POST","path":"/api/energy"}'),
      (1, 'DELETE', 'recycling_items', '5', '{"method":"DELETE","path":"/api/recycling/5"}'),
      (1, 'CREATE', 'water_quality', '1', '{"method":"POST","path":"/api/water"}'),
      (2, 'UPDATE', 'users', '1', '{"method":"PUT","path":"/api/admin/users/1"}'),
      (1, 'ANALYZE', 'weather_impacts', '2', '{"method":"POST","path":"/api/weather/2/analyze"}'),
      (1, 'EXPORT', 'weather_impacts', NULL, '{"method":"GET","path":"/api/export/weather?format=csv"}'),
      (2, 'CREATE', 'carbon_footprints', '3', '{"method":"POST","path":"/api/carbon"}'),
      (1, 'UPDATE', 'user_settings', NULL, '{"method":"PUT","path":"/api/settings"}'),
      (1, 'ANALYZE', 'carbon_footprints', '5', '{"method":"POST","path":"/api/carbon/5/analyze"}'),
      (2, 'LOGIN', 'auth', NULL, '{"method":"POST","path":"/api/auth/login"}'),
      (1, 'CREATE', 'recycling_items', '10', '{"method":"POST","path":"/api/recycling"}')
    `);
    console.log('✓ Audit logs seeded (16 items)');

    // Seed Feedback (16 items)
    await pool.query(`
      INSERT INTO feedback (user_id, rating, comment, category) VALUES
      (1, 5, 'Amazing AI analysis for weather impacts! Very accurate predictions.', 'feature'),
      (1, 4, 'Carbon footprint calculator is very helpful for tracking daily emissions.', 'feature'),
      (1, 5, 'The recycling sorter helped me learn what can actually be recycled.', 'feature'),
      (1, 3, 'Energy optimizer could use more specific recommendations for my devices.', 'improvement'),
      (1, 4, 'Water quality monitoring is essential - great data visualization.', 'feature'),
      (2, 5, 'Admin dashboard provides great overview of system usage.', 'feature'),
      (1, 4, 'Love the dark theme design. Very easy on the eyes.', 'design'),
      (1, 2, 'Would love to see mobile app version of this platform.', 'improvement'),
      (2, 5, 'AI-powered insights are incredibly detailed and actionable.', 'feature'),
      (1, 4, 'Export to CSV feature saves me a lot of time for reports.', 'feature'),
      (1, 3, 'Search could be faster and show more relevant results.', 'improvement'),
      (1, 5, 'Best environmental monitoring tool I have used. Highly recommend!', 'general'),
      (2, 4, 'Notification system keeps me updated on critical alerts.', 'feature'),
      (1, 4, 'Charts and graphs make data much easier to understand.', 'design'),
      (1, 3, 'Could use more granular date filtering on data tables.', 'improvement'),
      (2, 5, 'The API documentation is clear and well-organized.', 'general')
    `);
    console.log('✓ Feedback seeded (16 items)');

    // Seed Support Tickets (16 items)
    await pool.query(`
      INSERT INTO support_tickets (user_id, subject, message, priority, status) VALUES
      (1, 'Cannot export water quality data', 'When I try to export water quality data as CSV, I get a blank file. Please help.', 'high', 'open'),
      (1, 'Feature request: Multi-language support', 'Would love to see the platform available in Spanish and French.', 'low', 'open'),
      (1, 'AI analysis taking too long', 'The AI analysis for carbon footprint is timing out after 30 seconds.', 'medium', 'in_progress'),
      (2, 'Admin panel user count discrepancy', 'The user count on the admin panel does not match the database.', 'high', 'resolved'),
      (1, 'How to interpret water quality index?', 'Can you explain what Excellent vs Good vs Fair means for water quality?', 'low', 'resolved'),
      (1, 'Data not persisting after refresh', 'My custom weather entries disappear after page refresh.', 'critical', 'open'),
      (1, 'Request for API access', 'I would like to access the API directly for my research project.', 'medium', 'open'),
      (2, 'Notification preferences not saving', 'When I change notification settings, they revert to defaults.', 'medium', 'in_progress'),
      (1, 'Incorrect carbon calculation', 'The CO2e calculation for dairy products seems too high.', 'medium', 'open'),
      (1, 'Suggestion: Add comparison feature', 'Would be great to compare monthly carbon footprint trends.', 'low', 'open'),
      (1, 'Login issue with special characters', 'Cannot login when password contains @ symbol.', 'high', 'resolved'),
      (2, 'Audit log missing entries', 'Some DELETE operations are not being recorded in audit logs.', 'medium', 'in_progress'),
      (1, 'Mobile view broken on iPhone', 'Tables overflow on iPhone 12 screen, cannot scroll horizontally.', 'medium', 'open'),
      (1, 'Energy optimizer rating explanation', 'What criteria determines A+ vs A vs B ratings?', 'low', 'resolved'),
      (1, 'Account deletion request', 'I would like to know how to delete my account and all associated data.', 'medium', 'open'),
      (2, 'Database backup schedule', 'What is the current database backup schedule and retention policy?', 'high', 'open')
    `);
    console.log('✓ Support tickets seeded (16 items)');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 2 Users (demo + admin)');
    console.log('   - 17 Weather Impact Records');
    console.log('   - 17 Carbon Footprint Records');
    console.log('   - 18 Recycling Items');
    console.log('   - 18 Energy Usage Records');
    console.log('   - 17 Water Quality Records');
    console.log('   - 2 User Settings');
    console.log('   - 16 Notifications');
    console.log('   - 16 Audit Logs');
    console.log('   - 16 Feedback Entries');
    console.log('   - 16 Support Tickets');

  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    await pool.end();
  }
};

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
