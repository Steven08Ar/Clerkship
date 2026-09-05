-- Buzón real (Mailgun) — pantalla de autorización antes de crear la cuenta
-- de correo. Una vez aceptada, el usuario queda con dirección real
-- {username}@clerk-ship.online (ej. sarias202@clerk-ship.online), tanto
-- para mandar como para recibir correo de cualquier dominio.

ALTER TABLE users
    ADD COLUMN mailbox_created BOOLEAN NOT NULL DEFAULT FALSE;
