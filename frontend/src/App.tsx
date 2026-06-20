import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

interface IndexedDocument {
  name: string;
  chunks: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat');
  const [indexedDocuments, setIndexedDocuments] = useState<IndexedDocument[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem("docpulse_auth");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.isAuthenticated) {
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.error("Failed to parse auth data", e);
        }
      }
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, []);

  const handleDocumentIndexed = useCallback((name: string, chunks: number) => {
    setIndexedDocuments(prev => [...prev, { name, chunks }]);
    setActiveTab('chat');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("docpulse_auth");
    setIsAuthenticated(false);
  }, []);

  if (isLoadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-syn-surface text-syn-onSurface">Loading...</div>;
  }

  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <Login 
          onLogin={() => setIsAuthenticated(true)} 
          onNavigateToSignUp={() => {
            setSignupSuccess(false);
            setAuthView('signup');
          }} 
          successMessage={signupSuccess ? "Account created! Please sign in." : undefined}
        />
      );
    }
    return (
      <SignUp 
        onSignUp={() => {
          setSignupSuccess(true);
          setAuthView('login');
        }} 
        onNavigateToLogin={() => setAuthView('login')} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-syn-surface text-syn-onSurface overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        indexedDocuments={indexedDocuments}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' ? (
          <ChatInterface sessionId={sessionId} />
        ) : (
          <DocumentUpload
            sessionId={sessionId}
            onDocumentIndexed={handleDocumentIndexed}
          />
        )}
      </main>
    </div>
  );
}

export default App;
