package com.ragchat.controller;

import com.ragchat.dto.ChatRequest;
import com.ragchat.dto.ChatResponse;
import com.ragchat.service.MultiStageRagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller exposing the four RAG pipeline stages as HTTP endpoints.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final MultiStageRagService ragService;

    public ChatController(MultiStageRagService ragService) {
        this.ragService = ragService;
    }

    /**
     * Stage 3 – ask a question against uploaded documents.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        try {
            ChatResponse response = ragService.chat(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Chat failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(request.getSessionId())
                            .build());
        }
    }

    /**
     * Stage 4 – ask a follow-up question within an existing session.
     */
    @PostMapping("/followup")
    public ResponseEntity<ChatResponse> followUp(@RequestBody ChatRequest request) {
        try {
            ChatResponse response = ragService.followUp(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Follow-up failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(request.getSessionId())
                            .build());
        }
    }

    /**
     * Stage 1 – summarise all documents registered for a session.
     */
    @PostMapping("/summarize")
    public ResponseEntity<ChatResponse> summarize(@RequestParam String sessionId) {
        try {
            ChatResponse response = ragService.summarizeDocuments(sessionId);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("Summarize precondition failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(sessionId)
                            .build());
        } catch (Exception e) {
            log.error("Summarize failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(sessionId)
                            .build());
        }
    }

    /**
     * Stage 2 – generate insights from the session's document summary.
     */
    @PostMapping("/insights")
    public ResponseEntity<ChatResponse> insights(@RequestParam String sessionId) {
        try {
            ChatResponse response = ragService.generateInsights(sessionId);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.warn("Insights precondition failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(sessionId)
                            .build());
        } catch (Exception e) {
            log.error("Insights generation failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ChatResponse.builder()
                            .answer("Error: " + e.getMessage())
                            .sessionId(sessionId)
                            .build());
        }
    }
}
