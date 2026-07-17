CREATE TYPE user_role AS ENUM (
    'STUDENT',
    'TEACHER'
);

CREATE TABLE users (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);