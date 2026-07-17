CREATE TABLE teachers (

    user_id UUID PRIMARY KEY,

    department VARCHAR(150),

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);