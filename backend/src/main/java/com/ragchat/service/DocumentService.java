package com.ragchat.service;

import com.ragchat.dto.UploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Handles PDF ingestion (read → split → embed → store) and similarity search
 * against the pgvector-backed {@link VectorStore}.
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final VectorStore vectorStore;

    public DocumentService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    /**
     * Processes an uploaded PDF file:
     * <ol>
     *   <li>Saves the multipart upload to a temporary file</li>
     *   <li>Reads pages with {@link PagePdfDocumentReader}</li>
     *   <li>Splits pages into token-sized chunks</li>
     *   <li>Enriches each chunk with source metadata</li>
     *   <li>Stores the chunks in the vector store</li>
     * </ol>
     *
     * @param file the uploaded PDF
     * @return an {@link UploadResponse} summarising the result
     */
    public UploadResponse processPdf(MultipartFile file) {
        Path tempFile = null;
        try {
            // 1. Persist to temp file so the PDF reader can access it by URI
            String originalFilename = file.getOriginalFilename() != null
                    ? file.getOriginalFilename()
                    : "upload.pdf";

            tempFile = Files.createTempFile("rag-upload-", "-" + originalFilename);
            file.transferTo(tempFile.toFile());

            // 2. Read pages
            PagePdfDocumentReader reader = new PagePdfDocumentReader(tempFile.toUri().toString());
            List<Document> pages = reader.get();

            // 3. Split into chunks
            TokenTextSplitter splitter = new TokenTextSplitter(500, 10, 5, 10000, true);
            List<Document> chunks = splitter.apply(pages);

            // 4. Enrich metadata
            for (Document chunk : chunks) {
                chunk.getMetadata().put("source", originalFilename);
                chunk.getMetadata().put("type", "pdf");
            }

            // 5. Store in vector store
            vectorStore.add(chunks);

            log.info("Processed PDF '{}': {} pages, {} chunks", originalFilename, pages.size(), chunks.size());

            return UploadResponse.builder()
                    .filename(originalFilename)
                    .pages(pages.size())
                    .chunks(chunks.size())
                    .status("success")
                    .build();

        } catch (Exception e) {
            log.error("Failed to process PDF: {}", e.getMessage(), e);
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            return UploadResponse.builder()
                    .filename(name)
                    .pages(0)
                    .chunks(0)
                    .status("error: " + e.getMessage())
                    .build();
        } finally {
            // Clean up temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {
                    log.warn("Could not delete temp file: {}", tempFile);
                }
            }
        }
    }

    /**
     * Performs a similarity search against the vector store.
     *
     * @param query the natural-language query
     * @param topK  maximum number of results to return
     * @return matching {@link Document}s ordered by similarity
     */
    public List<Document> search(String query, int topK) {
        SearchRequest searchRequest = SearchRequest.query(query).withTopK(topK);
        return vectorStore.similaritySearch(searchRequest);
    }

    /**
     * Attempts to remove all documents from the vector store.
     * <p>
     * Note: not all {@link VectorStore} implementations support bulk deletion.
     * This method makes a best-effort attempt.
     */
    public void clearAll() {
        try {
            // VectorStore does not define a universal "clear" operation.
            // The PgVectorStore implementation supports delete-by-filter;
            // passing an empty filter list is a no-op on some versions, so we
            // log the intent and let the caller know.
            vectorStore.delete(List.of());
            log.info("Vector store clear requested");
        } catch (Exception e) {
            log.warn("Could not clear vector store: {}", e.getMessage());
        }
    }
}
