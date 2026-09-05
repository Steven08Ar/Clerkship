CREATE TABLE article_tags (

    article_id UUID NOT NULL,

    tag VARCHAR(50) NOT NULL,

    PRIMARY KEY (article_id, tag),

    CONSTRAINT fk_tag_article
        FOREIGN KEY (article_id)
        REFERENCES articles(id)
        ON DELETE CASCADE

);
