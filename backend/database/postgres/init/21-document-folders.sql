-- Carpetas de documentos del Dashboard — cada una con su color propio,
-- elegido por el usuario (mismo espíritu que el fondo de avatar personalizable
-- del registro). El contenido real de los documentos (bytes + metadata) vive
-- en Mongo (colección "documents"), mismo patrón que los adjuntos de Chats y
-- el Buzón — esta tabla solo maneja la carpeta en sí (quién es dueño, nombre,
-- color).

CREATE TABLE document_folders (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    owner_user_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    color VARCHAR(7) NOT NULL DEFAULT '#0284C7',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_folder_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);

CREATE INDEX idx_document_folders_owner ON document_folders(owner_user_id);
