
-- Initial Glass Dimensions
INSERT INTO glass_dimensions (name, volume_ml, is_default, sort_order) VALUES
('Shot', 25, false, 10),
('Double Shot', 50, false, 20),
('Small Wine', 125, false, 30),
('Large Wine', 175, false, 40),
('Pint', 568, false, 50),
('Half Pint', 284, false, 60),
('Tulip', 330, false, 70),
('Standard', 0, true, 999) -- For 'count' method fallback or placeholder
ON CONFLICT DO NOTHING;

-- Initial Locations
INSERT INTO locations (name, description, location_type, sort_order) VALUES
('Main Bar', 'Primary serving area', 'bar', 10),
('Cellar', 'Main storage', 'cellar', 20),
('Kitchen', 'Kitchen stock', 'kitchen', 30),
('Office', 'Office supplies', 'office', 40)
ON CONFLICT DO NOTHING;
