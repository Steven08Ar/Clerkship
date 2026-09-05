CREATE TYPE conversation_type AS ENUM (

    'DIRECT',

    'GROUP',

    'PUBLIC'

);

-- ai_agent_id: se llena solo cuando la conversación es con un agente IA de
-- Clerkship (no con otro usuario humano). course_id se llena solo cuando la
-- conversación es un grupo de discusión ligado a un curso.

CREATE TABLE conversations (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    type conversation_type NOT NULL,

    name VARCHAR(150),

    course_id UUID,

    ai_agent_id UUID,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_conversation_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_conversation_ai_agent
        FOREIGN KEY (ai_agent_id)
        REFERENCES ai_agents(id)
        ON DELETE SET NULL

);
