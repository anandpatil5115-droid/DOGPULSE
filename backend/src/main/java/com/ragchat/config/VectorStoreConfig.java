package com.ragchat.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.File;

@Configuration
public class VectorStoreConfig {

    /**
     * Local bag-of-words embedding model — no external API call required.
     * Used by SimpleVectorStore to compute and compare document vectors.
     */
    @Bean
    @Primary
    public EmbeddingModel localEmbeddingModel() {
        return new NoopEmbeddingModel();
    }

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        File storeFile = new File("vectorstore.json");
        SimpleVectorStore simpleStore = new SimpleVectorStore(embeddingModel);

        if (storeFile.exists()) {
            try {
                simpleStore.load(storeFile);
            } catch (Exception ignored) {}
        }

        // Return a wrapper that auto-saves the store after mutations
        return new VectorStore() {
            @Override
            public void add(java.util.List<org.springframework.ai.document.Document> documents) {
                simpleStore.add(documents);
                try {
                    simpleStore.save(storeFile);
                } catch (Exception ignored) {}
            }

            @Override
            public java.util.Optional<Boolean> delete(java.util.List<String> idList) {
                java.util.Optional<Boolean> result = simpleStore.delete(idList);
                try {
                    simpleStore.save(storeFile);
                } catch (Exception ignored) {}
                return result;
            }

            @Override
            public java.util.List<org.springframework.ai.document.Document> similaritySearch(
                    org.springframework.ai.vectorstore.SearchRequest request) {
                return simpleStore.similaritySearch(request);
            }
        };
    }
}
