package com.ragchat.config;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResultMetadata;

import java.util.*;

/**
 * A lightweight local EmbeddingModel that produces keyword-frequency (bag-of-words)
 * vectors so documents can be stored in SimpleVectorStore and retrieved via cosine
 * similarity — without any external API call.
 *
 * Vector size is fixed at 512. Each dimension corresponds to the hash of a word
 * (mod 512), and the value is the word's relative frequency in the text.
 */
public class NoopEmbeddingModel implements EmbeddingModel {

    private static final int DIM = 512;

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        for (int i = 0; i < request.getInstructions().size(); i++) {
            String text = request.getInstructions().get(i);
            float[] vector = encode(text);
            embeddings.add(new Embedding(vector, i, EmbeddingResultMetadata.EMPTY));
        }
        return new EmbeddingResponse(embeddings);
    }

    @Override
    public float[] embed(String text) {
        return encode(text);
    }

    @Override
    public float[] embed(Document document) {
        return encode(document.getContent());
    }

    @Override
    public List<float[]> embed(List<String> texts) {
        List<float[]> result = new ArrayList<>();
        for (String text : texts) {
            result.add(encode(text));
        }
        return result;
    }

    @Override
    public int dimensions() {
        return DIM;
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    /**
     * Converts text to a normalized bag-of-words vector of length DIM=512.
     */
    private static float[] encode(String text) {
        float[] vector = new float[DIM];
        if (text == null || text.isBlank()) return vector;

        String[] tokens = text.toLowerCase().split("[^a-z0-9]+");
        int total = 0;
        for (String token : tokens) {
            if (token.length() < 2) continue;
            int bucket = Math.abs(token.hashCode()) % DIM;
            vector[bucket] += 1f;
            total++;
        }
        // L2 normalize
        if (total > 0) {
            float norm = 0f;
            for (float v : vector) norm += v * v;
            norm = (float) Math.sqrt(norm);
            if (norm > 0f) {
                for (int i = 0; i < DIM; i++) vector[i] /= norm;
            }
        }
        return vector;
    }
}
