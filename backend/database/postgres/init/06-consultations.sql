CREATE TYPE consultation_status AS ENUM (

    'IN_PROGRESS',

    'COMPLETED',

    'ABANDONED'

);

CREATE TYPE difficulty_level AS ENUM (

    'EASY',

    'MEDIUM',

    'HARD'

);

CREATE TABLE consultations (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    student_id UUID NOT NULL,

    course_id UUID NOT NULL,

    specialty VARCHAR(100) NOT NULL,

    difficulty difficulty_level NOT NULL,

    status consultation_status NOT NULL DEFAULT 'IN_PROGRESS',

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    finished_at TIMESTAMP,

    score NUMERIC(5,2),

    CONSTRAINT fk_consultation_student
        FOREIGN KEY (student_id)
        REFERENCES students(user_id),

    CONSTRAINT fk_consultation_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)

);