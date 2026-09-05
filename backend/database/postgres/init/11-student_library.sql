CREATE TYPE shelf_status AS ENUM (

    'NEXT',

    'FINISHED'

);

CREATE TABLE student_library (

    student_id UUID NOT NULL,

    article_id UUID NOT NULL,

    status shelf_status NOT NULL DEFAULT 'NEXT',

    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (student_id, article_id),

    CONSTRAINT fk_library_student
        FOREIGN KEY (student_id)
        REFERENCES students(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_library_article
        FOREIGN KEY (article_id)
        REFERENCES articles(id)
        ON DELETE CASCADE

);
