CREATE TABLE community_likes (

    post_id UUID NOT NULL,

    user_id UUID NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (post_id, user_id),

    CONSTRAINT fk_like_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_like_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);
