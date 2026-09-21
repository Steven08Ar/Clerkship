-- NOTA (modificado): tabla ampliada para la Biblioteca real del frontend
-- (frontend/src/pages/contenido/BibliotecaPage.tsx). Se agregó el ENUM
-- article_type y las columnas type, specialty, source, year, pages y
-- created_by, que corresponden a los campos que ya existen en los datos
-- mock de esa página. La columna "category" original se conserva (texto
-- libre), pero el filtro real de la UI usa "type".

CREATE TYPE article_type AS ENUM (

    'LIBRO',

    'GUIA',

    'ENSAYO',

    'PROTOCOLO',

    'CASO'

);

CREATE TABLE articles (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    type article_type NOT NULL,

    title VARCHAR(255) NOT NULL,

    authors TEXT,

    category VARCHAR(100),

    specialty VARCHAR(100),

    source VARCHAR(255),

    year SMALLINT,

    pages SMALLINT,

    description TEXT,

    url TEXT NOT NULL,

    created_by UUID,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_article_teacher
        FOREIGN KEY (created_by)
        REFERENCES teachers(user_id)
        ON DELETE SET NULL

);
