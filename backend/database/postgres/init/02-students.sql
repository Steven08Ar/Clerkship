CREATE TABLE students (

    user_id UUID PRIMARY KEY,

    student_code VARCHAR(50) UNIQUE NOT NULL,

    semester SMALLINT NOT NULL,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);