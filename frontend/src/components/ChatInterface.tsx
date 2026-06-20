import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  BookOpen,
  Lightbulb,
  User,
  Bot,
  FileText,
  X,
  Loader2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  stage?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  sessionId: string;
}

const SUGGESTIONS = [
  'Summarize the key findings',
  'What are the main topics?',
  'Compare the documents',
  'Extract important dates',
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [insightsContent, setInsightsContent] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const isFollowUp = messageCountRef.current > 0;
      const endpoint = isFollowUp ? '/api/chat/followup' : '/api/chat';

      const response = await axios.post(endpoint, {
        message: messageText.trim(),
        sessionId,
      });

      messageCountRef.current += 1;

      const data = response.data;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer || data.response || data.content || JSON.stringify(data),
        sources: data.sources || data.relevantDocuments || [],
        stage: data.stage || data.type || (isFollowUp ? 'follow-up' : 'qa'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      let errorMsg = 'Sorry, something went wrong. Please try again.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        errorMsg = 'API endpoint not found. Make sure the backend server is running.';
      } else if (axios.isAxiosError(error) && !error.response) {
        errorMsg = 'Cannot connect to the server. Please check if the backend is running on port 8080.';
      }

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMsg,
        stage: 'error',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }, [inputValue, sendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const summarizeDocuments = useCallback(async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);

    try {
      const response = await axios.post(`/api/chat/summarize?sessionId=${sessionId}`);
      const data = response.data;
      setSummaryContent(data.summary || data.answer || data.content || JSON.stringify(data));
      setShowSummary(true);
      setShowInsights(false);
    } catch (error: unknown) {
      let errorMsg = 'Failed to generate summary. Please ensure documents are uploaded.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setSummaryContent(errorMsg);
      setShowSummary(true);
    } finally {
      setIsSummarizing(false);
    }
  }, [isSummarizing, sessionId]);

  const generateInsights = useCallback(async () => {
    if (isGeneratingInsights) return;
    setIsGeneratingInsights(true);

    try {
      const response = await axios.post(`/api/chat/insights?sessionId=${sessionId}`);
      const data = response.data;
      setInsightsContent(data.insights || data.answer || data.content || JSON.stringify(data));
      setShowInsights(true);
      setShowSummary(false);
    } catch (error: unknown) {
      let errorMsg = 'Failed to generate insights. Please ensure documents are uploaded.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setInsightsContent(errorMsg);
      setShowInsights(true);
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [isGeneratingInsights, sessionId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-syn-surface relative overflow-hidden">
      {/* Radial soft ambient background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(0, 86, 197, 0.05) 0%, transparent 60%)`,
        }}
      />

      {/* Top Action Toolbar */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-3 border-b border-syn-outlineVariant/30 bg-syn-surfaceContainerLowest/80 backdrop-blur-md">
        <button
          onClick={summarizeDocuments}
          disabled={isSummarizing}
          className="flex items-center gap-2 px-4 py-2 rounded-soft-sm text-xs font-semibold
            bg-syn-primaryContainer/20 text-syn-primary border border-syn-primary/15 
            hover:border-syn-primary/30 hover:bg-syn-primaryContainer/30
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSummarizing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BookOpen className="w-3.5 h-3.5" />
          )}
          Summarize documents
        </button>

        <button
          onClick={generateInsights}
          disabled={isGeneratingInsights}
          className="flex items-center gap-2 px-4 py-2 rounded-soft-sm text-xs font-semibold
            bg-syn-secondaryContainer/20 text-syn-onSecondaryContainer border border-syn-outlineVariant/40 
            hover:bg-syn-secondaryContainer/35 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingInsights ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Lightbulb className="w-3.5 h-3.5" />
          )}
          Generate insights
        </button>
      </div>

      {/* Collapsible Document Summary */}
      {showSummary && (
        <div className="relative z-10 mx-6 mt-4 animate-fadeIn">
          <div className="bg-syn-surfaceContainerLowest border border-syn-primary/20 rounded-soft-md p-5 shadow-syn-elevation">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-syn-primary" />
                <h3 className="text-sm font-semibold text-syn-primary font-geist">Document Summary</h3>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="p-1 rounded hover:bg-syn-surfaceContainer text-syn-onSurfaceVariant/60 hover:text-syn-onSurface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="markdown-content text-sm max-h-64 overflow-y-auto pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summaryContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible AI Insights */}
      {showInsights && (
        <div className="relative z-10 mx-6 mt-4 animate-fadeIn">
          <div className="bg-syn-surfaceContainerLowest border border-syn-outlineVariant/50 rounded-soft-md p-5 shadow-syn-elevation">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-syn-primary" />
                <h3 className="text-sm font-semibold text-syn-primary font-geist">AI Insights</h3>
              </div>
              <button
                onClick={() => setShowInsights(false)}
                className="p-1 rounded hover:bg-syn-surfaceContainer text-syn-onSurfaceVariant/60 hover:text-syn-onSurface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="markdown-content text-sm max-h-64 overflow-y-auto pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {insightsContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State Dashboard */
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-soft-lg bg-syn-primaryContainer/15 flex items-center justify-center mb-6 text-syn-primary">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-syn-onSurface mb-2 font-geist tracking-tight">
              Chat with your documents
            </h2>
            <p className="text-sm text-syn-onSurfaceVariant/80 mb-8 leading-relaxed">
              Upload your PDF reports, manuals, or research papers in the Upload tab, then ask questions here. DocPulse will search your files and answer you instantly.
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 rounded-soft-sm text-xs font-semibold text-syn-onSurfaceVariant bg-syn-surfaceContainerLowest border border-syn-outlineVariant/50
                    hover:bg-syn-surfaceContainerLow hover:text-syn-primary hover:border-syn-primary/30
                    transition-all duration-200 flex items-center gap-2 group shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-syn-outline group-hover:text-syn-primary transition-colors" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Stream List */
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3.5 animate-fadeIn ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-gradient-to-br from-syn-primary to-syn-primaryContainer flex items-center justify-center mt-1 shadow-syn-elevation">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  {/* Pipeline Stage Tag */}
                  {message.role === 'assistant' && message.stage && (
                    <div className="mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                        message.stage === 'error'
                          ? 'bg-syn-errorContainer text-syn-onErrorContainer border border-syn-error/25'
                          : 'bg-syn-primaryContainer/30 text-syn-primary border border-syn-primary/15'
                      }`}>
                        {message.stage}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4.5 py-3 shadow-syn-elevation ${
                      message.role === 'user'
                        ? 'bg-syn-primary text-white rounded-soft-md rounded-tr-[1px]'
                        : 'bg-syn-surfaceContainerLowest border border-syn-outlineVariant/40 text-syn-onSurfaceVariant rounded-soft-md rounded-tl-[1px]'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="markdown-content text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Grounded Citations */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {message.sources.map((source, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-syn-surfaceContainer text-syn-onSurfaceVariant text-[9px] font-medium border border-syn-outlineVariant/30"
                        >
                          <FileText className="w-3 h-3 text-syn-primary" />
                          {source}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Time badge */}
                  <p className={`text-[9px] font-semibold text-syn-outline/75 mt-1 font-mono ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {/* User Avatar */}
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-syn-surfaceContainerHighest flex items-center justify-center mt-1 border border-syn-outlineVariant/30 shadow-syn-elevation">
                    <User className="w-4 h-4 text-syn-onSurface" />
                  </div>
                )}
              </div>
            ))}

            {/* Waiting for pipeline to response */}
            {isLoading && (
              <div className="flex gap-3.5 animate-fadeIn">
                <div className="flex-shrink-0 w-8.5 h-8.5 rounded-full bg-gradient-to-br from-syn-primary to-syn-primaryContainer flex items-center justify-center shadow-syn-elevation">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-syn-surfaceContainerLowest border border-syn-outlineVariant/40 rounded-soft-md rounded-tl-[1px] px-5 py-4 shadow-syn-elevation">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-syn-primary typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-syn-primary typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-syn-primary typing-dot" />
                    </div>
                    <span className="text-[11px] font-medium text-syn-outline">Processing pipeline stages...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="relative z-10 px-6 py-4 border-t border-syn-outlineVariant/30 bg-syn-surfaceContainerLowest/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query workspace or ask questions..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none bg-syn-surfaceContainerLowest border border-syn-outlineVariant/50 rounded-soft-sm px-4 py-3 text-sm text-syn-onSurface
                placeholder-syn-outline/70 focus:outline-none focus:border-syn-primary focus:ring-1 focus:ring-syn-primary/20
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                max-h-40 scrollbar-thin"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-soft-sm bg-syn-primary
              flex items-center justify-center text-white shadow-syn-elevation
              hover:bg-syn-surfaceTint hover:shadow-lg
              transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-syn-outline/75 mt-2 text-center font-mono">
          Enter to send · Shift + Enter for newline
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
