import React from 'react';
import {
  MessageSquare,
  Upload,
  FileText,
  Cpu,
  Database,
  Zap,
  Circle,
  LogOut,
} from 'lucide-react';

interface IndexedDocument {
  name: string;
  chunks: number;
}

interface SidebarProps {
  activeTab: 'chat' | 'upload';
  onTabChange: (tab: 'chat' | 'upload') => void;
  indexedDocuments: IndexedDocument[];
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, indexedDocuments, onLogout }) => {
  return (
    <aside className="w-72 bg-syn-surfaceContainerLow border-r border-syn-outlineVariant/30 flex flex-col h-full relative overflow-hidden">
      {/* Subtle background gradient pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(0, 86, 197, 0.04) 0%, transparent 60%),
                            radial-gradient(circle at 90% 80%, rgba(20, 110, 241, 0.03) 0%, transparent 60%)`,
        }}
      />

      {/* Brand Header Removed */ }

      {/* Navigation Tabs */}
      <nav className="relative px-3 py-5 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold text-syn-outline uppercase tracking-wider font-mono">
          Navigation
        </p>
        
        <button
          onClick={() => onTabChange('chat')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-soft-sm text-sm font-medium transition-all duration-200 group border-l-[3px]
            ${activeTab === 'chat'
              ? 'bg-syn-primaryContainer/30 text-syn-primary border-syn-primary'
              : 'text-syn-onSurfaceVariant hover:text-syn-onSurface hover:bg-syn-surfaceContainer/50 border-transparent'
            }`}
        >
          <MessageSquare className={`w-[18px] h-[18px] transition-colors duration-200 ${
            activeTab === 'chat' ? 'text-syn-primary' : 'text-syn-outline group-hover:text-syn-onSurfaceVariant'
          }`} />
          <span>Chat</span>
          {activeTab === 'chat' && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-syn-primary" />
          )}
        </button>

        <button
          onClick={() => onTabChange('upload')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-soft-sm text-sm font-medium transition-all duration-200 group border-l-[3px]
            ${activeTab === 'upload'
              ? 'bg-syn-primaryContainer/30 text-syn-primary border-syn-primary'
              : 'text-syn-onSurfaceVariant hover:text-syn-onSurface hover:bg-syn-surfaceContainer/50 border-transparent'
            }`}
        >
          <Upload className={`w-[18px] h-[18px] transition-colors duration-200 ${
            activeTab === 'upload' ? 'text-syn-primary' : 'text-syn-outline group-hover:text-syn-onSurfaceVariant'
          }`} />
          <span>Upload Documents</span>
        </button>
      </nav>

      {/* Indexed Documents Section */}
      <div className="relative flex-1 px-3 py-2 overflow-y-auto border-t border-syn-outlineVariant/20">
        <div className="flex items-center justify-between px-3 mb-3">
          <p className="text-[10px] font-bold text-syn-outline uppercase tracking-wider font-mono">
            Your Documents
          </p>
          {indexedDocuments.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-syn-secondaryContainer text-syn-onSecondaryContainer font-semibold font-mono">
              {indexedDocuments.length}
            </span>
          )}
        </div>
        
        {indexedDocuments.length === 0 ? (
          <div className="px-4 py-8 text-center bg-syn-surfaceContainerLow/30 rounded-soft-md border border-dashed border-syn-outlineVariant/40 mx-2">
            <Database className="w-7 h-7 text-syn-outline/50 mx-auto mb-2.5" />
            <p className="text-xs font-medium text-syn-onSurfaceVariant">Empty Workspace</p>
            <p className="text-[10px] text-syn-outline mt-1">Upload PDFs to populate</p>
          </div>
        ) : (
          <div className="space-y-1">
            {indexedDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-soft-sm hover:bg-syn-surfaceContainer/40 border border-transparent hover:border-syn-outlineVariant/10 transition-all duration-200 group cursor-default animate-slideIn"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="w-8 h-8 rounded-soft-sm bg-syn-primaryContainer/10 flex items-center justify-center flex-shrink-0 group-hover:bg-syn-primaryContainer/20 transition-colors duration-200">
                  <FileText className="w-4 h-4 text-syn-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-syn-onSurface truncate group-hover:text-syn-primary transition-colors duration-200">
                    {doc.name}
                  </p>
                  <p className="text-[9px] text-syn-onSurfaceVariant/60 flex items-center gap-1 font-mono">
                    <Zap className="w-2.5 h-2.5 text-syn-primary" />
                    {doc.chunks} chunks
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / System Health */}
      <div className="relative px-4 py-4.5 border-t border-syn-outlineVariant/30 space-y-3.5 bg-syn-surfaceContainerLow/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-soft-sm text-xs font-semibold text-syn-error bg-syn-errorContainer/10 hover:bg-syn-errorContainer/20 border border-syn-error/20 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>

        {/* System Online Badge */}
        <div className="flex items-center gap-2 px-2">
          <div className="relative flex items-center">
            <Circle className="w-2 h-2 text-syn-surfaceTint fill-syn-surfaceTint" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-syn-surfaceTint/50 animate-ping" />
          </div>
          <span className="text-[11px] text-syn-onSurfaceVariant font-medium">DocAI Pipeline Connected</span>
        </div>

        {/* Tech Stack Info */}
        <div className="flex items-center justify-center gap-1.5 px-2 text-[9px] font-bold tracking-wider text-syn-outline/80 font-mono">
          <span>SPRING AI</span>
          <span className="text-syn-outlineVariant/70">|</span>
          <span>GROQ</span>
          <span className="text-syn-outlineVariant/70">|</span>
          <span>VECTOR</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
