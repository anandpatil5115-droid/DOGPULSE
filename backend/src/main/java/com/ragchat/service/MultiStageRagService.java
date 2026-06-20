package com.ragchat.service;

import com.ragchat.dto.ChatRequest;
import com.ragchat.dto.ChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the four-stage multi-step RAG pipeline:
 * <ol>
 *   <li><b>Summarise</b> – condense uploaded documents into a summary</li>
 *   <li><b>Insights</b> – extract key insights from the summary</li>
 *   <li><b>Chat (QA)</b> – answer questions using retrieved context</li>
 *   <li><b>Follow-up</b> – continue the conversation with history</li>
 * </ol>
 * <p>
 * Session state (chains, summaries, insights, document lists) is held in
 * concurrent maps keyed by {@code sessionId}.
 */
@Service
public class MultiStageRagService {

    private static final Logger log = LoggerFactory.getLogger(MultiStageRagService.class);

    private final Bot bot;
    private final DocumentService documentService;
    private final Prompts prompts;
    private final Tokenizer tokenizer;

    /** Per-session conversation chains. */
    private final Map<String, ConversationChain> sessionChains = new ConcurrentHashMap<>();

    /** Per-session document summaries produced by Stage 1. */
    private final Map<String, String> sessionSummaries = new ConcurrentHashMap<>();

    /** Per-session insights produced by Stage 2. */
    private final Map<String, String> sessionInsights = new ConcurrentHashMap<>();

    /** Per-session list of uploaded document filenames. */
    private final Map<String, List<String>> sessionDocuments = new ConcurrentHashMap<>();

    public MultiStageRagService(Bot bot,
                                 DocumentService documentService,
                                 Prompts prompts,
                                 Tokenizer tokenizer) {
        this.bot = bot;
        this.documentService = documentService;
        this.prompts = prompts;
        this.tokenizer = tokenizer;
    }

    // ====================================================================
    // Public: document registration
    // ====================================================================

    /**
     * Associates a document filename with a session so that later pipeline
     * stages know which documents belong to the session.
     */
    public void registerDocument(String sessionId, String filename) {
        sessionDocuments.computeIfAbsent(sessionId, k -> new CopyOnWriteArrayList<>()).add(filename);
    }

    // ====================================================================
    // Stage 1 – Summarise Documents
    // ====================================================================

    /**
     * Summarises all documents registered for the given session.
     * <ol>
     *   <li>Sends the <em>summarize-beginning</em> prompt</li>
     *   <li>Processes each document chunk in parallel via
     *       <em>summarize-section</em></li>
     *   <li>Consolidates partial summaries with <em>summarize-final</em></li>
     * </ol>
     *
     * @param sessionId the session whose documents should be summarised
     * @return a {@link ChatResponse} containing the final summary
     */
    public ChatResponse summarizeDocuments(String sessionId) {
        List<String> documents = sessionDocuments.get(sessionId);
        if (documents == null || documents.isEmpty()) {
            throw new IllegalStateException("No documents registered for session: " + sessionId);
        }

        ConversationChain chain = new ConversationChain();

        // Retrieve all chunks for every registered document
        List<Document> allChunks = new ArrayList<>();
        for (String docName : documents) {
            List<Document> found = documentService.search(docName, 50);
            allChunks.addAll(found);
        }

        // 1. Beginning prompt
        String beginningPrompt = prompts.summarizeBeginning(
                String.valueOf(documents.size()),
                String.join(", ", documents),
                String.valueOf(allChunks.size()));
        bot.call(beginningPrompt, chain);

        // 2. Section summaries – processed in parallel
        ExecutorService executor = Executors.newFixedThreadPool(
                Math.min(allChunks.size(), 4));
        try {
            List<Future<String>> futures = new ArrayList<>();
            for (int i = 0; i < allChunks.size(); i++) {
                final int idx = i;
                final Document chunk = allChunks.get(i);
                futures.add(executor.submit(() -> {
                    String source = (String) chunk.getMetadata().getOrDefault("source", "unknown");
                    String sectionPrompt = prompts.summarizeSection(
                            String.valueOf(idx + 1), source, chunk.getContent());
                    Bot.ChatResult result = bot.callWithNewChain(sectionPrompt);
                    return result.getResponse();
                }));
            }

            StringBuilder combinedSummaries = new StringBuilder();
            for (int i = 0; i < futures.size(); i++) {
                try {
                    String sectionSummary = futures.get(i).get(120, TimeUnit.SECONDS);
                    combinedSummaries.append("--- Section ").append(i + 1).append(" ---\n");
                    combinedSummaries.append(sectionSummary).append("\n\n");
                } catch (Exception e) {
                    log.warn("Section {} summarisation failed: {}", i + 1, e.getMessage());
                    combinedSummaries.append("--- Section ").append(i + 1).append(" ---\n");
                    combinedSummaries.append("[Summary unavailable]\n\n");
                }
            }

            // 3. Final consolidation
            String finalPrompt = prompts.summarizeFinal(combinedSummaries.toString());
            Bot.ChatResult finalResult = bot.call(finalPrompt, chain);

            // Persist
            sessionSummaries.put(sessionId, finalResult.getResponse());
            sessionChains.put(sessionId, chain);

            return ChatResponse.builder()
                    .answer(finalResult.getResponse())
                    .sources(documents)
                    .sessionId(sessionId)
                    .build();
        } finally {
            executor.shutdown();
        }
    }

    // ====================================================================
    // Stage 2 – Generate Insights
    // ====================================================================

    /**
     * Generates insights from the summary produced by Stage 1.
     *
     * @param sessionId session whose summary to analyse
     * @return a {@link ChatResponse} containing the insights
     */
    public ChatResponse generateInsights(String sessionId) {
        String summary = sessionSummaries.get(sessionId);
        if (summary == null || summary.isBlank()) {
            throw new IllegalStateException(
                    "No summary available for session: " + sessionId +
                    ". Run summarizeDocuments first.");
        }

        ConversationChain chain = new ConversationChain();
        String insightsPrompt = prompts.summarizeInsights() + "\n\nSummary:\n" + summary;
        Bot.ChatResult result = bot.call(insightsPrompt, chain);

        sessionInsights.put(sessionId, result.getResponse());

        List<String> docs = sessionDocuments.getOrDefault(sessionId, List.of());
        return ChatResponse.builder()
                .answer(result.getResponse())
                .sources(docs)
                .sessionId(sessionId)
                .build();
    }

    // ====================================================================
    // Stage 3 – Chat / QA
    // ====================================================================

    /**
     * Answers a question using the full multi-step QA pipeline:
     * <ol>
     *   <li>Retrieve relevant chunks via similarity search</li>
     *   <li>Send <em>qa-beginning</em> prompt with the document summary</li>
     *   <li>Inject retrieved chunks via <em>qa-retrieved</em></li>
     *   <li>Send <em>qa-instructions</em></li>
     *   <li>Send <em>qa-answer</em> with the actual question</li>
     * </ol>
     */
    public ChatResponse chat(ChatRequest request) {
        String sessionId = resolveSessionId(request.getSessionId());
        String question = request.getMessage();

        // Retrieve the most relevant chunks (limit to 3 to stay lean)
        List<Document> retrieved = documentService.search(question, 3);

        // Build a compact context from retrieved chunks (max ~1000 tokens)
        StringBuilder contextBuilder = new StringBuilder();
        int tokenBudget = 1000;
        for (Document doc : retrieved) {
            String chunk = doc.getContent();
            if (tokenBudget <= 0) break;
            int chunkTokens = tokenizer.getTokenCount(chunk);
            if (chunkTokens > tokenBudget) {
                chunk = tokenizer.truncateToTokens(chunk, tokenBudget);
            }
            contextBuilder.append(chunk).append("\n---\n");
            tokenBudget -= chunkTokens;
        }
        String context = contextBuilder.length() > 0 ? contextBuilder.toString() : "No relevant content found.";

        // Build a single self-contained prompt
        String prompt = "You are a helpful document assistant. Use the following document excerpts to answer the question.\n\n" +
                "DOCUMENT EXCERPTS:\n" + context + "\n" +
                "QUESTION: " + question + "\n\n" +
                "Answer concisely based only on the document excerpts above. If the answer isn't in the excerpts, say so.";

        ConversationChain chain = sessionChains.getOrDefault(sessionId, new ConversationChain());
        Bot.ChatResult result = bot.call(prompt, chain);
        sessionChains.put(sessionId, chain);

        List<String> sources = retrieved.stream()
                .map(d -> (String) d.getMetadata().getOrDefault("source", "unknown"))
                .distinct()
                .collect(Collectors.toList());

        return ChatResponse.builder()
                .answer(result.getResponse())
                .sources(sources)
                .sessionId(sessionId)
                .build();
    }

    // ====================================================================
    // Stage 4 – Follow-up
    // ====================================================================

    /**
     * Handles a follow-up question within an existing conversation session.
     */
    public ChatResponse followUp(ChatRequest request) {
        String sessionId = resolveSessionId(request.getSessionId());
        String followupQuestion = request.getMessage();

        // Retrieve relevant chunks for the follow-up question
        List<Document> retrieved = documentService.search(followupQuestion, 3);

        // Build compact context
        StringBuilder contextBuilder = new StringBuilder();
        int tokenBudget = 800;
        for (Document doc : retrieved) {
            String chunk = doc.getContent();
            if (tokenBudget <= 0) break;
            int chunkTokens = tokenizer.getTokenCount(chunk);
            if (chunkTokens > tokenBudget) {
                chunk = tokenizer.truncateToTokens(chunk, tokenBudget);
            }
            contextBuilder.append(chunk).append("\n---\n");
            tokenBudget -= chunkTokens;
        }
        String context = contextBuilder.length() > 0 ? contextBuilder.toString() : "No relevant content found.";

        // Build a single self-contained prompt
        String prompt = "You are a helpful document assistant. Use the following document excerpts to answer the question.\n\n" +
                "DOCUMENT EXCERPTS:\n" + context + "\n" +
                "FOLLOW-UP QUESTION: " + followupQuestion + "\n\n" +
                "Answer concisely based only on the document excerpts above. If the answer isn't in the excerpts, say so.";

        ConversationChain chain = sessionChains.getOrDefault(sessionId, new ConversationChain());
        Bot.ChatResult result = bot.call(prompt, chain);
        sessionChains.put(sessionId, chain);

        List<String> sources = retrieved.stream()
                .map(d -> (String) d.getMetadata().getOrDefault("source", "unknown"))
                .distinct()
                .collect(Collectors.toList());

        return ChatResponse.builder()
                .answer(result.getResponse())
                .sources(sources)
                .sessionId(sessionId)
                .build();
    }

    // ====================================================================
    // Helpers
    // ====================================================================

    private String resolveSessionId(String sessionId) {
        return (sessionId != null && !sessionId.isBlank())
                ? sessionId
                : UUID.randomUUID().toString();
    }

    /**
     * Concatenates retrieved document chunks into a single string, honouring
     * the token budget.
     */
    private String buildRetrievedChunksText(List<Document> documents) {
        if (documents == null || documents.isEmpty()) {
            return "No relevant chunks found.";
        }

        StringBuilder sb = new StringBuilder();
        int maxTokens = tokenizer.getMaxTokensForExtraContent("llama-3");

        for (Document doc : documents) {
            String source = (String) doc.getMetadata().getOrDefault("source", "unknown");
            String entry = "[Source: " + source + "]\n" + doc.getContent() + "\n---\n";

            String candidate = sb.toString() + entry;
            if (!tokenizer.isWithinTokenLimit(candidate, maxTokens)) {
                // Try to fit a truncated version
                int remaining = maxTokens - tokenizer.getTokenCount(sb.toString());
                if (remaining > 50) {
                    sb.append("[Source: ").append(source).append("]\n");
                    sb.append(tokenizer.truncateToTokens(doc.getContent(), remaining));
                    sb.append("\n---\n");
                }
                break;
            }
            sb.append(entry);
        }

        return sb.toString();
    }
}
