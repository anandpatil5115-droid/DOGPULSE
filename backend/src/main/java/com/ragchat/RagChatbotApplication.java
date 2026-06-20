package com.ragchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RagChatbotApplication {
    public static void main(String[] args) {
        SpringApplication.run(RagChatbotApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.ai.embedding.EmbeddingModel dummyEmbeddingModel() {
        return new org.springframework.ai.embedding.EmbeddingModel() {
            @Override
            public org.springframework.ai.embedding.EmbeddingResponse call(org.springframework.ai.embedding.EmbeddingRequest request) {
                java.util.List<org.springframework.ai.embedding.Embedding> embeddings = new java.util.ArrayList<>();
                for (int i = 0; i < request.getInstructions().size(); i++) {
                    embeddings.add(new org.springframework.ai.embedding.Embedding(new float[384], i));
                }
                return new org.springframework.ai.embedding.EmbeddingResponse(embeddings);
            }
            @Override
            public float[] embed(org.springframework.ai.document.Document document) {
                return new float[384];
            }
            @Override
            public int dimensions() {
                return 384;
            }
        };
    }
}
