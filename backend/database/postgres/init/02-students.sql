-- NOTA (modificado): "semester" pasó de NOT NULL a nullable. Se declaró
-- obligatorio en la versión original, pero hoy no hay ninguna lógica en el
-- backend que lo use (no filtra dificultad de casos ni nada parecido) — es
-- solo un dato que el estudiante puede declarar, no debería bloquear el
-- registro de nadie. Si en el futuro se usa para recomendar/filtrar casos
-- clínicos por nivel del estudiante, se puede volver a exigir en ese momento.

CREATE TABLE students (

    user_id UUID PRIMARY KEY,

    student_code VARCHAR(50) UNIQUE NOT NULL,

    semester SMALLINT,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);
