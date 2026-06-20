package com.ragchat.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads StringTemplate-style prompt files from the classpath and renders them
 * by substituting {@code $variable} placeholders with supplied values.
 * <p>
 * Every prompt stage in the multi-stage RAG pipeline has a dedicated
 * convenience method so callers never need to remember file names or variable
 * keys.
 */
@Component
public class Prompts {

    private final ResourceLoader resourceLoader;

    public Prompts(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    // ------------------------------------------------------------------ core

    /**
     * Loads a raw template from {@code classpath:prompts/{templateName}.st}.
     *
     * @param templateName template file name without extension
     * @return the template content as a UTF-8 string
     */
    public String loadTemplate(String templateName) {
        Resource resource = resourceLoader.getResource("classpath:prompts/" + templateName + ".st");
        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load prompt template: " + templateName, e);
        }
    }

    /**
     * Loads a template and replaces every {@code $key} placeholder with the
     * corresponding value from {@code variables}.
     *
     * @param templateName template file name without extension
     * @param variables    placeholder → value mappings
     * @return rendered prompt string
     */
    public String renderTemplate(String templateName, Map<String, String> variables) {
        String template = loadTemplate(templateName);
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            template = template.replace("$" + entry.getKey(), entry.getValue());
        }
        return template;
    }

    // --------------------------------------------------- convenience methods

    /** Loads the shared system-message preamble (no variables). */
    public String systemMessage() {
        return loadTemplate("system-message");
    }

    /**
     * Stage 1 – opening prompt that tells the model how many documents are
     * about to be summarised.
     */
    public String summarizeBeginning(String documentCount, String documentNames, String totalChunks) {
        Map<String, String> vars = new HashMap<>();
        vars.put("system_message", systemMessage());
        vars.put("document_count", documentCount);
        vars.put("document_names", documentNames);
        vars.put("total_chunks", totalChunks);
        return renderTemplate("summarize-beginning", vars);
    }

    /** Stage 1 – per-section summarisation prompt. */
    public String summarizeSection(String sectionId, String filename, String sectionContent) {
        Map<String, String> vars = new HashMap<>();
        vars.put("section_id", sectionId);
        vars.put("filename", filename);
        vars.put("section_content", sectionContent);
        return renderTemplate("summarize-section", vars);
    }

    /** Stage 1 – final consolidation prompt. */
    public String summarizeFinal(String summary) {
        Map<String, String> vars = new HashMap<>();
        vars.put("summary", summary);
        return renderTemplate("summarize-final", vars);
    }

    /** Stage 2 – insights generation (no variables). */
    public String summarizeInsights() {
        return loadTemplate("summarize-insights");
    }

    /** Stage 3 – QA opening prompt with the document summary. */
    public String qaBeginning(String summary) {
        Map<String, String> vars = new HashMap<>();
        vars.put("system_message", systemMessage());
        vars.put("summary", summary);
        return renderTemplate("qa-beginning", vars);
    }

    /** Stage 3 – injects a full document's content as context. */
    public String qaContext(String filename, String fileContent) {
        Map<String, String> vars = new HashMap<>();
        vars.put("filename", filename);
        vars.put("file_content", fileContent);
        return renderTemplate("qa-context", vars);
    }

    /** Stage 3 – injects vector-retrieved chunks as context. */
    public String qaRetrieved(String filename, String retrievedChunks) {
        Map<String, String> vars = new HashMap<>();
        vars.put("filename", filename);
        vars.put("retrieved_chunks", retrievedChunks);
        return renderTemplate("qa-retrieved", vars);
    }

    /** Stage 3 – final QA instructions (no variables). */
    public String qaInstructions() {
        return loadTemplate("qa-instructions");
    }

    /** Stage 3 – the actual question-answering prompt. */
    public String qaAnswer(String question, String conversationHistory, String retrievedChunks) {
        Map<String, String> vars = new HashMap<>();
        vars.put("question", question);
        vars.put("conversation_history", conversationHistory);
        vars.put("retrieved_chunks", retrievedChunks);
        return renderTemplate("qa-answer", vars);
    }

    /** Stage 4 – follow-up opening with filename and summary. */
    public String followupBeginning(String filename, String summary) {
        Map<String, String> vars = new HashMap<>();
        vars.put("system_message", systemMessage());
        vars.put("filename", filename);
        vars.put("summary", summary);
        return renderTemplate("followup-beginning", vars);
    }

    /** Stage 4 – follow-up answer prompt. */
    public String followupAnswer(String conversationHistory, String retrievedChunks, String followupQuestion) {
        Map<String, String> vars = new HashMap<>();
        vars.put("conversation_history", conversationHistory);
        vars.put("retrieved_chunks", retrievedChunks);
        vars.put("followup_question", followupQuestion);
        return renderTemplate("followup-answer", vars);
    }
}
