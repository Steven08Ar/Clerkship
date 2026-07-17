CREATE TABLE ai_evaluations (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    consultation_id UUID NOT NULL UNIQUE,

    final_score NUMERIC(5,2),

    feedback_summary TEXT,

    execution_time_seconds NUMERIC(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_consultation
        FOREIGN KEY (consultation_id)
        REFERENCES consultations(id)
        ON DELETE CASCADE

);