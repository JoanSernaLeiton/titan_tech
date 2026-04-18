-- Enable RLS on all 6 new tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_agreement_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (admin-only app)
-- Allow all authenticated users full access to all tables

CREATE POLICY "authenticated_all_providers" ON providers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customers" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customer_devices" ON customer_devices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customer_agreement_variables" ON customer_agreement_variables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_customer_thresholds" ON customer_thresholds
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_alerts" ON alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
