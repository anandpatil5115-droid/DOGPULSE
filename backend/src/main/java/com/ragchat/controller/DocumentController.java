package com.ragchat.controller;

import com.ragchat.dto.UploadResponse;
import com.ragchat.service.DocumentService;
import com.ragchat.service.MultiStageRagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for document upload, semantic search, and store management.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;
    private final MultiStageRagService ragService;

    public DocumentController(DocumentService documentService,
                               MultiStageRagService ragService) {
        this.documentService = documentService;
        this.ragService = ragService;
    }

    /**
     * Uploads a PDF, processes it into vector-store chunks, and registers it
     * with the RAG pipeline session.
     *
     * @param file      the PDF file to upload
     * @param sessionId optional session identifier (a new UUID is generated
     *                  when absent)
     * @return an {@link UploadResponse} summarising the ingestion result
     */
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sessionId", required = false) String sessionId) {
        try {
            if (sessionId == null || sessionId.isBlank()) {
                sessionId = UUID.randomUUID().toString();
            }

            UploadResponse response = documentService.processPdf(file);

            // Register the document with the RAG session
            if ("success".equals(response.getStatus())) {
                ragService.registerDocument(sessionId, response.getFilename());
            }

            // Include sessionId in the response for the client
            return ResponseEntity.ok(UploadResponse.builder()
                    .filename(response.getFilename())
                    .pages(response.getPages())
                    .chunks(response.getChunks())
                    .status(response.getStatus())
                    .build());

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(UploadResponse.builder()
                            .filename(file.getOriginalFilename())
                            .pages(0)
                            .chunks(0)
                            .status("error: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Performs a semantic similarity search over the vector store.
     *
     * @param query the natural-language query
     * @param topK  maximum number of results (default 5)
     * @return a list of maps containing {@code content} and {@code metadata}
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {
        try {
            List<Document> results = documentService.search(query, topK);

            List<Map<String, Object>> response = results.stream()
                    .map(doc -> {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("content", doc.getContent());
                        entry.put("metadata", doc.getMetadata());
                        return entry;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Search failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    /**
     * Clears all documents from the vector store.
     */
    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, String>> clear() {
        try {
            documentService.clearAll();
            return ResponseEntity.ok(Map.of("status", "cleared"));
        } catch (Exception e) {
            log.error("Clear failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
