package com.ragchat.service;

import org.springframework.stereotype.Component;

/**
 * Lightweight token-count estimator that avoids a full tokeniser dependency.
 * Uses the empirical heuristic that 1 token ≈ 0.75 whitespace-delimited words.
 */
@Component
public class Tokenizer {

    /**
     * Estimates the token count for the given text using a word-count heuristic.
     *
     * @param text the input text
     * @return estimated token count (always ≥ 0)
     */
    public int getTokenCount(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        int wordCount = text.split("\\s+").length;
        return (int) (wordCount * 0.75);
    }

    /**
     * Returns the maximum number of tokens that may be allocated for retrieved /
     * extra content, based on the model being used.
     *
     * @param model the OpenAI model identifier (e.g. "gpt-4", "gpt-3.5-turbo")
     * @return maximum tokens for extra content
     */
    public int getMaxTokensForExtraContent(String model) {
        if (model == null) {
            return 1000;
        }
        if (model.equals("gpt-4") || model.contains("gpt-4")) {
            return 5000;
        }
        if (model.contains("llama-3")) {
            return 2500;
        }
        if (model.contains("gpt-3.5-turbo")) {
            return 2500;
        }
        return 1000;
    }

    /**
     * Checks whether the estimated token count for {@code text} is within the
     * supplied limit.
     */
    public boolean isWithinTokenLimit(String text, int maxTokens) {
        return getTokenCount(text) <= maxTokens;
    }

    /**
     * Truncates {@code text} so that its estimated token count does not exceed
     * {@code maxTokens}. Words are removed from the end.
     *
     * @param text      the input text
     * @param maxTokens the target token budget
     * @return truncated text fitting within the budget
     */
    public String truncateToTokens(String text, int maxTokens) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String[] words = text.split("\\s+");
        int maxWords = (int) (maxTokens / 0.75);
        if (words.length <= maxWords) {
            return text;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < maxWords; i++) {
            if (i > 0) {
                sb.append(' ');
            }
            sb.append(words[i]);
        }
        return sb.toString();
    }
}
