CREATE TABLE community_posts (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    author_id UUID NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_post_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);
