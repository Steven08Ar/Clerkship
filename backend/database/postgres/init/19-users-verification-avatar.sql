-- Verificación de correo (código de 6 dígitos vía Mailgun, ver
-- app/utils/mailer.py) + avatar DiceBear elegido/personalizado por el
-- usuario en el registro, guardado como SVG real (texto, unos pocos KB) en
-- vez de solo un seed — así no depende de que la API de DiceBear siga
-- disponible para poder mostrarlo después.

ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN verification_code VARCHAR(6),
    ADD COLUMN verification_code_expires_at TIMESTAMP,
    ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN avatar_svg TEXT;
