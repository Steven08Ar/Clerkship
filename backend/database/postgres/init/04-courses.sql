CREATE TABLE courses (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    teacher_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    academic_period VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(user_id)
        ON DELETE CASCADE

);