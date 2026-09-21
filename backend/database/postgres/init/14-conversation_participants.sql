CREATE TABLE conversation_participants (

    conversation_id UUID NOT NULL,

    user_id UUID NOT NULL,

    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_read_at TIMESTAMP,

    PRIMARY KEY (conversation_id, user_id),

    CONSTRAINT fk_participant_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_participant_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);
