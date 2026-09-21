-- Permite crear una carpeta DENTRO de otra (subcarpetas). parent_folder_id
-- es NULL para las carpetas de nivel raíz. ON DELETE CASCADE hace que borrar
-- una carpeta borre también todas sus subcarpetas (y el backend ya se
-- encarga de borrar los documentos Mongo de cada una).

ALTER TABLE document_folders
    ADD COLUMN parent_folder_id UUID NULL;

ALTER TABLE document_folders
    ADD CONSTRAINT fk_folder_parent
        FOREIGN KEY (parent_folder_id)
        REFERENCES document_folders(id)
        ON DELETE CASCADE;

CREATE INDEX idx_document_folders_parent ON document_folders(parent_folder_id);
