
DROP TABLE IF EXISTS api_logs CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Bases table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Types table
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- e.g., 'WEAPON', 'VEHICLE', 'AMMUNITION'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    base_id INTEGER REFERENCES bases(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements table 
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE RESTRICT,
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    ref_transfer_id INTEGER, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Transfers table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    from_base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE RESTRICT,
    to_base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE RESTRICT,
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    CHECK (from_base_id != to_base_id)
);


ALTER TABLE stock_movements 
ADD CONSTRAINT fk_transfer 
FOREIGN KEY (ref_transfer_id) REFERENCES transfers(id) ON DELETE CASCADE;

-- Assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE RESTRICT,
    equipment_type_id INTEGER NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
    assigned_to VARCHAR(100) NOT NULL, 
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    is_expended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- API Logs table 
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- indexes for better performance
CREATE INDEX idx_stock_movements_base ON stock_movements(base_id);
CREATE INDEX idx_stock_movements_equipment ON stock_movements(equipment_type_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_transfers_from ON transfers(from_base_id);
CREATE INDEX idx_transfers_to ON transfers(to_base_id);
CREATE INDEX idx_assignments_base ON assignments(base_id);
CREATE INDEX idx_assignments_equipment ON assignments(equipment_type_id);
CREATE INDEX idx_api_logs_user ON api_logs(user_id);
CREATE INDEX idx_api_logs_date ON api_logs(created_at);

-- Insert initial data
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Full access to all data and operations'),
('BASE_COMMANDER', 'Access to data and operations for assigned base'),
('LOGISTICS_OFFICER', 'Limited access to purchases and transfers');

INSERT INTO bases (name, location) VALUES
('Base Alpha', 'Northern Region'),
('Base Beta', 'Southern Region'),
('Base Gamma', 'Eastern Region'),
('Base Delta', 'Western Region');

INSERT INTO equipment_types (name, category, description) VALUES
('M4 Carbine', 'WEAPON', 'Standard issue assault rifle'),
('M9 Pistol', 'WEAPON', 'Standard issue sidearm'),
('Humvee', 'VEHICLE', 'High Mobility Multipurpose Wheeled Vehicle'),
('Truck', 'VEHICLE', 'Military transport truck'),
('5.56mm Ammunition', 'AMMUNITION', 'Standard rifle ammunition'),
('9mm Ammunition', 'AMMUNITION', 'Pistol ammunition'),
('Grenade', 'AMMUNITION', 'Hand grenade');


INSERT INTO users (username, password_hash, role_id, base_id) VALUES
('admin', '$2b$10$rOzJqZqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK', 1, 1),
('commander1', '$2b$10$rOzJqZqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK', 2, 1),
('logistics1', '$2b$10$rOzJqZqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqK', 3, 1);



