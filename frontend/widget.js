(function() {
  'use strict';
  
  // Configuration - can be overridden by data attributes
  const defaultConfig = {
    apiUrl: 'http://localhost:3000',
    position: 'bottom-right',
    primaryColor: '#667eea',
    darkMode: false,
    welcomeMessage: '👋 Hi there! I\'m your AI assistant. How can I help you today?',
    placeholder: 'Type your message...',
    title: 'AI Assistant',
    subtitle: 'Online • Usually replies instantly'
  };
  
  // Get configuration from script tag data attributes
  function getConfig() {
    const script = document.querySelector('script[src*="widget.js"]');
    if (!script) return defaultConfig;
    
    const config = { ...defaultConfig };
    
    // Override with data attributes
    if (script.dataset.apiUrl) config.apiUrl = script.dataset.apiUrl;
    if (script.dataset.position) config.position = script.dataset.position;
    if (script.dataset.primaryColor) config.primaryColor = script.dataset.primaryColor;
    if (script.dataset.darkMode) config.darkMode = script.dataset.darkMode === 'true';
    if (script.dataset.welcomeMessage) config.welcomeMessage = script.dataset.welcomeMessage;
    if (script.dataset.placeholder) config.placeholder = script.dataset.placeholder;
    if (script.dataset.title) config.title = script.dataset.title;
    if (script.dataset.subtitle) config.subtitle = script.dataset.subtitle;
    
    return config;
  }
  
  const config = getConfig();
  
  // Generate unique session ID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Create CSS styles
  function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ai-chatbot-widget * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .ai-chatbot-widget {
        position: fixed;
        ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      .ai-chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${config.primaryColor} 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        color: white;
        font-size: 24px;
      }
      
      .ai-chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
      }
      
      .ai-chat-window {
        position: absolute;
        ${config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
        ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
        width: 380px;
        height: 550px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      
      .ai-chat-window.active {
        transform: translateY(0) scale(1);
        opacity: 1;
        visibility: visible;
      }
      
      .ai-chat-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .ai-chat-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .ai-chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      
      .ai-chat-info h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
      }
      
      .ai-chat-info p {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .ai-chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .ai-chat-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .ai-chat-body {
        height: 380px;
        overflow-y: auto;
        padding: 20px;
        background: #fafafa;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .ai-chat-message {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        animation: messageSlide 0.3s ease;
      }
      
      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .ai-chat-message.user {
        align-self: flex-end;
        background: linear-gradient(135deg, ${config.primaryColor} 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .ai-chat-message.bot {
        align-self: flex-start;
        background: white;
        color: #333;
        border: 1px solid #e1e5e9;
        border-bottom-left-radius: 4px;
      }
      
      .ai-chat-message.typing {
        background: white;
        border: 1px solid #e1e5e9;
        align-self: flex-start;
      }
      
      .ai-typing-indicator {
        display: flex;
        gap: 4px;
        padding: 8px 0;
      }
      
      .ai-typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #cbd5e0;
        animation: typing 1.4s infinite;
      }
      
      .ai-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .ai-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-10px);
        }
      }
      
      .ai-chat-input {
        padding: 20px;
        border-top: 1px solid #e1e5e9;
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }
      
      .ai-input-container {
        flex: 1;
        position: relative;
      }
      
      .ai-message-input {
        width: 100%;
        min-height: 44px;
        max-height: 120px;
        padding: 12px 16px;
        border: 1px solid #e1e5e9;
        border-radius: 22px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        transition: border-color 0.2s;
      }
      
      .ai-message-input:focus {
        border-color: ${config.primaryColor};
      }
      
      .ai-send-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${config.primaryColor} 0%, #764ba2 100%);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-size: 16px;
      }
      
      .ai-send-btn:hover:not(:disabled) {
        transform: scale(1.05);
      }
      
      .ai-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .ai-welcome-message {
        text-align: center;
        color: #666;
        font-size: 14px;
        padding: 40px 20px;
      }
      
      /* Mobile responsive */
      @media (max-width: 480px) {
        .ai-chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
          ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          border-radius: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'ai-chatbot-widget';
    widget.innerHTML = `
      <button class="ai-chat-toggle" id="aiChatToggle">
        💬
      </button>
      
      <div class="ai-chat-window" id="aiChatWindow">
        <div class="ai-chat-header">
          <div class="ai-chat-header-info">
            <div class="ai-chat-avatar">🤖</div>
            <div class="ai-chat-info">
              <h3>${config.title}</h3>
              <p>${config.subtitle}</p>
            </div>
          </div>
          <button class="ai-chat-close" id="aiChatClose">×</button>
        </div>
        
        <div class="ai-chat-body" id="aiChatBody">
          <div class="ai-welcome-message">
            ${config.welcomeMessage}
          </div>
        </div>
        
        <div class="ai-chat-input">
          <div class="ai-input-container">
            <textarea 
              class="ai-message-input" 
              id="aiMessageInput" 
              placeholder="${config.placeholder}"
              rows="1"></textarea>
          </div>
          <button class="ai-send-btn" id="aiSendBtn" disabled>
            ➤
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    return widget;
  }
  
  // Initialize widget functionality
  function initWidget(widget) {
    const toggle = widget.querySelector('#aiChatToggle');
    const window = widget.querySelector('#aiChatWindow');
    const close = widget.querySelector('#aiChatClose');
    const body = widget.querySelector('#aiChatBody');
    const input = widget.querySelector('#aiMessageInput');
    const sendBtn = widget.querySelector('#aiSendBtn');
    
    let isOpen = false;
    let isTyping = false;
    let sessionId = generateUUID();
    
    // Event listeners
    toggle.addEventListener('click', toggleChat);
    close.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('input', handleInputChange);
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('input', autoResize);
    
    function toggleChat() {
      isOpen = !isOpen;
      window.classList.toggle('active', isOpen);
      toggle.textContent = isOpen ? '×' : '💬';
      
      if (isOpen) {
        input.focus();
      }
    }
    
    function handleInputChange() {
      const hasText = input.value.trim().length > 0;
      sendBtn.disabled = !hasText || isTyping;
    }
    
    function handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
          sendMessage();
        }
      }
    }
    
    function autoResize() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    
    async function sendMessage() {
      const message = input.value.trim();
      if (!message || isTyping) return;
      
      // Add user message
      addMessage(message, 'user');
      input.value = '';
      autoResize();
      handleInputChange();
      
      // Show typing indicator
      showTypingIndicator();
      
      try {
        const response = await fetch(`${config.apiUrl}/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            userAgent: navigator.userAgent,
            referrer: window.location.href
          }),
        });
        
        hideTypingIndicator();
        
        if (response.ok) {
          const data = await response.json();
          addMessage(data.response, 'bot');
          sessionId = data.sessionId;
        } else {
          const errorData = await response.json().catch(() => ({}));
          addMessage(
            errorData.error || 'Sorry, I\\'m having trouble right now. Please try again later.',
            'bot'
          );
        }
      } catch (error) {
        hideTypingIndicator();
        console.error('AI Chatbot Error:', error);
        addMessage(
          'I\\'m having trouble connecting. Please check your internet connection and try again.',
          'bot'
        );
      }
    }
    
    function addMessage(text, sender) {
      // Remove welcome message if it exists
      const welcomeMsg = body.querySelector('.ai-welcome-message');
      if (welcomeMsg) {
        welcomeMsg.remove();
      }
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `ai-chat-message ${sender}`;
      messageDiv.textContent = text;
      
      body.appendChild(messageDiv);
      scrollToBottom();
    }
    
    function showTypingIndicator() {
      if (body.querySelector('.typing')) return;
      
      isTyping = true;
      handleInputChange();
      
      const typingDiv = document.createElement('div');
      typingDiv.className = 'ai-chat-message typing';
      typingDiv.innerHTML = `
        <div class="ai-typing-indicator">
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
        </div>
      `;
      
      body.appendChild(typingDiv);
      scrollToBottom();
    }
    
    function hideTypingIndicator() {
      const typingIndicator = body.querySelector('.typing');
      if (typingIndicator) {
        typingIndicator.remove();
      }
      isTyping = false;
      handleInputChange();
    }
    
    function scrollToBottom() {
      body.scrollTop = body.scrollHeight;
    }
  }
  
  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Don't initialize if widget already exists
    if (document.querySelector('.ai-chatbot-widget')) {
      return;
    }
    
    createStyles();
    const widget = createWidget();
    initWidget(widget);
  }
  
  init();
})();
