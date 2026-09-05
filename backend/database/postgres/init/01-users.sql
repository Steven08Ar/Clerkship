-- NOTA (modificado): se agregó la columna "username" (el "@sarias202" que
-- sale del correo institucional antes del @, ej. sarias202@unab.edu.co).
-- id (UUID) sigue siendo el identificador real: es la llave que amarra
-- Postgres con Mongo (sender_id en messages, etc.) y nunca cambia. username
-- es solo para mostrar en la UI y para buscar usuarios dentro de la
-- plataforma — por eso es UNIQUE (no puede repetirse) pero sí se puede
-- editar sin romper ninguna relación, porque nada más lo referencia como FK.

CREATE TYPE user_role AS ENUM (
    'STUDENT',
    'TEACHER'
);

CREATE TABLE users (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    username VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);