package com.ragchat.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Tracks the conversation history as a sequence of prompt/response exchanges.
 * Supports deep-copy branching so that parallel conversation paths can diverge
 * without corrupting the shared history.
 */
public class ConversationChain {

    /**
     * A single user-prompt / assistant-response pair.
     */
    public static class Exchange {
        private final String prompt;
        private final String response;

        public Exchange(String prompt, String response) {
            this.prompt = prompt;
            this.response = response;
        }

        public String getPrompt() {
            return prompt;
        }

        public String getResponse() {
            return response;
        }
    }

    private final List<Exchange> exchanges;

    public ConversationChain() {
        this.exchanges = new ArrayList<>();
    }

    private ConversationChain(List<Exchange> exchanges) {
        this.exchanges = exchanges;
    }

    /**
     * Records a new prompt/response exchange at the end of the chain.
     */
    public void addExchange(String prompt, String response) {
        exchanges.add(new Exchange(prompt, response));
    }

    /**
     * Creates a deep copy of this chain suitable for branching.
     * The new list is independent, but the immutable Exchange objects are shared.
     */
    public ConversationChain copy() {
        return new ConversationChain(new ArrayList<>(this.exchanges));
    }

    /**
     * Serialises the full conversation history into a readable string.
     *
     * @return formatted history or an empty string when no exchanges exist
     */
    public String toHistoryString() {
        if (exchanges.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Exchange exchange : exchanges) {
            sb.append("User: ").append(exchange.getPrompt()).append("\n");
            sb.append("Assistant: ").append(exchange.getResponse()).append("\n\n");
        }
        return sb.toString();
    }

    /**
     * Returns the response from the most recent exchange, or an empty string
     * if no exchanges have been recorded yet.
     */
    public String getLastResponse() {
        if (exchanges.isEmpty()) {
            return "";
        }
        return exchanges.get(exchanges.size() - 1).getResponse();
    }

    /**
     * @return the number of exchanges recorded so far
     */
    public int size() {
        return exchanges.size();
    }

    /**
     * Removes all exchanges from the chain.
     */
    public void clear() {
        exchanges.clear();
    }
}
