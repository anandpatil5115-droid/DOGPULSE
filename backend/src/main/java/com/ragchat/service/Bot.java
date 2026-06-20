package com.ragchat.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;

/**
 * Thin wrapper around the Spring AI {@link ChatModel} that adds:
 * <ul>
 *   <li>Concurrency limiting (semaphore-based)</li>
 *   <li>Exponential-backoff retry on transient failures</li>
 *   <li>Conversation-chain tracking per call</li>
 * </ul>
 */
@Service
public class Bot {

    private static final Logger log = LoggerFactory.getLogger(Bot.class);

    private final ChatModel chatModel;

    /** Caps the number of simultaneous OpenAI calls. */
    private final Semaphore concurrencyLimit = new Semaphore(4);

    private final int maxRetries = 5;
    private final long baseDelayMs = 1_000L;
    private final long timeoutMs = 60_000L;

    public Bot(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    // -------------------------------------------------------------- results

    /**
     * Bundles a raw response string together with the conversation chain that
     * produced it.
     */
    public static class ChatResult {
        private final String response;
        private final ConversationChain chain;

        public ChatResult(String response, ConversationChain chain) {
            this.response = response;
            this.chain = chain;
        }

        public String getResponse() {
            return response;
        }

        public ConversationChain getChain() {
            return chain;
        }
    }

    // ---------------------------------------------------------- public API

    /**
     * Sends {@code prompt} to the chat model, records the exchange in
     * {@code chain}, and returns the result.
     * <p>
     * The call is guarded by a concurrency semaphore and will retry up to
     * {@link #maxRetries} times with exponential back-off on failure.
     *
     * @param prompt the user/system message to send
     * @param chain  the conversation chain to append to
     * @return a {@link ChatResult} containing the model's response and the
     *         updated chain
     */
    public ChatResult call(String prompt, ConversationChain chain) {
        try {
            concurrencyLimit.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting for concurrency permit", e);
        }

        try {
            for (int attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    org.springframework.ai.chat.model.ChatResponse chatResponse =
                            chatModel.call(new Prompt(prompt));

                    String responseText = chatResponse.getResult().getOutput().getContent();
                    chain.addExchange(prompt, responseText);
                    return new ChatResult(responseText, chain);

                } catch (Exception e) {
                    log.warn("Chat call attempt {} failed: {}", attempt + 1, e.getMessage());
                    if (attempt < maxRetries - 1) {
                        long sleepMs = baseDelayMs * (1L << attempt); // exponential backoff
                        sleepMs = Math.min(sleepMs, timeoutMs);
                        try {
                            Thread.sleep(sleepMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Interrupted during retry back-off", ie);
                        }
                    }
                }
            }
            throw new RuntimeException("All " + maxRetries + " chat call attempts failed");
        } finally {
            concurrencyLimit.release();
        }
    }

    /**
     * Convenience overload that creates a fresh {@link ConversationChain}
     * before calling the model.
     */
    public ChatResult callWithNewChain(String prompt) {
        return call(prompt, new ConversationChain());
    }

    /**
     * Asynchronous variant of {@link #call(String, ConversationChain)} that
     * returns immediately with a {@link CompletableFuture}.
     */
    public CompletableFuture<ChatResult> callAsync(String prompt, ConversationChain chain) {
        return CompletableFuture.supplyAsync(() -> call(prompt, chain));
    }
}
