-- NOTA: reutiliza la función update_updated_at_column() definida en
-- 09-triggers.sql. Va en un archivo aparte (no dentro del 09) porque
-- conversations y community_posts se crean en archivos posteriores al 09,
-- y los scripts se ejecutan en orden por nombre de archivo — el trigger
-- no puede crearse antes de que exista la tabla.

CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER trg_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
