import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const { user, logout, messages, sendMessage, isLoading, clearMessages } = useAuthStore();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearMessages}
              className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-all duration-200 text-sm"
            >
              Clear
            </button>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-all duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome, {user?.name?.split(' ')[0] || 'there'}</h2>
                <p className="text-zinc-500 text-sm">Start a conversation to see your messages here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={msg.id} className="group">
                  {msg.role === 'user' ? (
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-black text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="text-sm font-medium mb-1.5 text-zinc-400">You</div>
                        <div className="text-[15px] leading-relaxed">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="text-sm font-medium mb-1.5 text-zinc-400">AI Assistant</div>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="text-sm font-medium mb-1.5 text-zinc-400">AI Assistant</div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-6 bg-gradient-to-t from-black via-black to-transparent">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <div className={`relative rounded-2xl bg-zinc-900 border transition-all duration-300 ${
              focused ? 'border-zinc-700 shadow-lg shadow-zinc-900/50' : 'border-zinc-800'
            }`}>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                rows="1"
                className="w-full bg-transparent text-white rounded-2xl pl-5 pr-14 py-4 resize-none focus:outline-none placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
                style={{ 
                  minHeight: '56px',
                  maxHeight: '200px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#52525b transparent'
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    input.trim() && !isLoading
                      ? 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-600 text-center mt-3 px-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </form>
      </div>
    </main>
  );
}