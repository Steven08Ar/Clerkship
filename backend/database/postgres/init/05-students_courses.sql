CREATE TABLE student_courses (

    student_id UUID NOT NULL,

    course_id UUID NOT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (student_id, course_id),

    CONSTRAINT fk_sc_student
        FOREIGN KEY (student_id)
        REFERENCES students(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sc_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE

);