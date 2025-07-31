/**
 * AI Chatbot Widget - Client-side Implementation
 * 
 * This script creates a customizable AI chatbot widget that can be embedded
 * on any website. It communicates with the backend API to provide AI-powered
 * customer support.
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-api-key="your-api-key"></script>
 */

(function() {
    'use strict';
    
    // Configuration
    const WIDGET_CONFIG = {
        // API endpoint (will be set from script tag or defaults)
        apiEndpoint: window.ChatbotWidgetAPI || 'http://localhost:3000',
        apiKey: null,
        
        // Default widget settings
        primaryColor: '#667eea',
        position: 'bottom-right',
        title: 'AI Assistant',
        subtitle: 'Online • Usually replies instantly',
        welcomeMessage: 'Hi there! I\'m your AI assistant. How can I help you today?',
        placeholder: 'Type your message...',
        
        // Widget behavior
        autoOpen: false,
        showBranding: true,
        maxMessages: 50,
        typingDelay: 1000,
        
        // Animations
        animationDuration: 300
    };
    
    // Widget state
    let widget = null;
    let isOpen = false;
    let isTyping = false;
    let sessionId = null;
    let messageHistory = [];
    let currentConfig = { ...WIDGET_CONFIG };
    
    // Utility functions
    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    function createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    
    function sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // API functions
    async function sendMessage(message) {
        try {
            const response = await fetch(`${currentConfig.apiEndpoint}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': currentConfig.apiKey ? `Bearer ${currentConfig.apiKey}` : ''
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId,
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Chatbot API Error:', error);
            throw error;
        }
    }
    
    async function loadConfiguration() {
        try {
            const response = await fetch(`${currentConfig.apiEndpoint}/config`);
            if (response.ok) {
                const config = await response.json();
                // Merge server config with local config
                Object.assign(currentConfig, config.branding || {});
            }
        } catch (error) {
            console.warn('Could not load widget configuration:', error);
        }
    }
    
    // Widget UI creation
    function createWidgetHTML() {
        return `
            <div class="chatbot-widget-overlay" style="display: none;">
                <div class="chatbot-widget-container">
                    <div class="chatbot-widget-header">
                        <div class="chatbot-widget-info">
                            <h3 class="chatbot-widget-title">${currentConfig.title}</h3>
                            <p class="chatbot-widget-subtitle">${currentConfig.subtitle}</p>
                        </div>
                        <button class="chatbot-widget-close" title="Close chat">&times;</button>
                    </div>
                    
                    <div class="chatbot-widget-messages" id="chatbot-messages">
                        <div class="chatbot-message chatbot-message-bot">
                            <div class="chatbot-message-content">
                                <div class="chatbot-message-text">${currentConfig.welcomeMessage}</div>
                                <div class="chatbot-message-time">${formatTime(new Date())}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chatbot-widget-typing" id="chatbot-typing" style="display: none;">
                        <div class="chatbot-typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="chatbot-typing-text">AI is typing...</span>
                    </div>
                    
                    <div class="chatbot-widget-input">
                        <input 
                            type="text" 
                            id="chatbot-input-field" 
                            placeholder="${currentConfig.placeholder}"
                            maxlength="1000"
                            autocomplete="off"
                        >
                        <button id="chatbot-send-button" title="Send message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    
                    ${currentConfig.showBranding ? `
                        <div class="chatbot-widget-branding">
                            <small>Powered by AI Chatbot Widget</small>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <button class="chatbot-widget-trigger" id="aiChatToggle" title="Open chat">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span class="chatbot-widget-notification" id="chatbot-notification" style="display: none;"></span>
            </button>
        `;
    }
    
    function createWidgetStyles() {
        return `
            <style>
                /* Chatbot Widget Styles */
                .chatbot-widget-overlay {
                    position: fixed;
                    bottom: 90px;
                    ${currentConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    width: 380px;
                    max-width: calc(100vw - 40px);
                    height: 500px;
                    max-height: calc(100vh - 120px);
                    z-index: 2147483647;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .chatbot-widget-container {
                    width: 100%;
                    height: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .chatbot-widget-header {
                    background: ${currentConfig.primaryColor};
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chatbot-widget-info {
                    flex: 1;
                }
                
                .chatbot-widget-title {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .chatbot-widget-subtitle {
                    margin: 0;
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .chatbot-widget-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .chatbot-widget-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .chatbot-widget-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: #fafafa;
                }
                
                .chatbot-message {
                    margin-bottom: 16px;
                    display: flex;
                    animation: fadeIn 0.3s ease-in;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .chatbot-message-bot {
                    justify-content: flex-start;
                }
                
                .chatbot-message-user {
                    justify-content: flex-end;
                }
                
                .chatbot-message-content {
                    max-width: 80%;
                    min-width: 100px;
                }
                
                .chatbot-message-text {
                    padding: 12px 16px;
                    border-radius: 18px;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }
                
                .chatbot-message-bot .chatbot-message-text {
                    background: white;
                    color: #333;
                    border-bottom-left-radius: 6px;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
                
                .chatbot-message-user .chatbot-message-text {
                    background: ${currentConfig.primaryColor};
                    color: white;
                    border-bottom-right-radius: 6px;
                }
                
                .chatbot-message-time {
                    font-size: 11px;
                    color: #999;
                    margin-top: 4px;
                    padding: 0 16px;
                }
                
                .chatbot-widget-typing {
                    padding: 12px 20px;
                    background: white;
                    border-top: 1px solid #eee;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .chatbot-typing-indicator {
                    display: flex;
                    gap: 3px;
                }
                
                .chatbot-typing-indicator span {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ccc;
                    animation: typing 1.4s infinite ease-in-out;
                }
                
                .chatbot-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .chatbot-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
                
                .chatbot-typing-text {
                    font-size: 12px;
                    color: #666;
                }
                
                .chatbot-widget-input {
                    display: flex;
                    padding: 16px 20px;
                    background: white;
                    border-top: 1px solid #eee;
                    gap: 12px;
                }
                
                #chatbot-input-field {
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    padding: 10px 16px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                #chatbot-input-field:focus {
                    border-color: ${currentConfig.primaryColor};
                }
                
                #chatbot-send-button {
                    background: ${currentConfig.primaryColor};
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }
                
                #chatbot-send-button:hover {
                    background: color-mix(in srgb, ${currentConfig.primaryColor} 90%, black);
                }
                
                #chatbot-send-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .chatbot-widget-branding {
                    padding: 8px 20px;
                    background: #f8f8f8;
                    text-align: center;
                    border-top: 1px solid #eee;
                }
                
                .chatbot-widget-branding small {
                    color: #999;
                    font-size: 11px;
                }
                
                .chatbot-widget-trigger {
                    position: fixed;
                    bottom: 20px;
                    ${currentConfig.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    width: 60px;
                    height: 60px;
                    background: ${currentConfig.primaryColor};
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                    z-index: 2147483647;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .chatbot-widget-trigger:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                }
                
                .chatbot-widget-notification {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                /* Mobile responsive */
                @media (max-width: 480px) {
                    .chatbot-widget-overlay {
                        bottom: 90px;
                        left: 10px;
                        right: 10px;
                        width: auto;
                        height: 70vh;
                        max-height: 500px;
                    }
                    
                    .chatbot-widget-trigger {
                        bottom: 15px;
                        right: 15px;
                        width: 55px;
                        height: 55px;
                    }
                }
            </style>
        `;
    }
    
    // Widget functionality
    function addMessage(text, isUser = false, showTime = true) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = createElement('div', `chatbot-message ${isUser ? 'chatbot-message-user' : 'chatbot-message-bot'}`);
        
        const contentDiv = createElement('div', 'chatbot-message-content');
        const textDiv = createElement('div', 'chatbot-message-text', sanitizeHTML(text));
        
        contentDiv.appendChild(textDiv);
        
        if (showTime) {
            const timeDiv = createElement('div', 'chatbot-message-time', formatTime(new Date()));
            contentDiv.appendChild(timeDiv);
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message in history
        messageHistory.push({
            text: text,
            isUser: isUser,
            timestamp: new Date()
        });
        
        // Limit message history
        if (messageHistory.length > currentConfig.maxMessages) {
            messageHistory = messageHistory.slice(-currentConfig.maxMessages);
        }
    }
    
    function showTyping() {
        const typingDiv = document.getElementById('chatbot-typing');
        if (typingDiv) {
            typingDiv.style.display = 'flex';
            isTyping = true;
        }
    }
    
    function hideTyping() {
        const typingDiv = document.getElementById('chatbot-typing');
        if (typingDiv) {
            typingDiv.style.display = 'none';
            isTyping = false;
        }
    }
    
    async function handleUserMessage(message) {
        if (!message.trim()) return;
        
        // Add user message
        addMessage(message, true);
        
        // Clear input
        const inputField = document.getElementById('chatbot-input-field');
        const sendButton = document.getElementById('chatbot-send-button');
        
        if (inputField) inputField.value = '';
        if (sendButton) sendButton.disabled = true;
        
        // Show typing indicator
        showTyping();
        
        try {
            const response = await sendMessage(message);
            
            // Simulate typing delay
            await new Promise(resolve => setTimeout(resolve, currentConfig.typingDelay));
            
            hideTyping();
            
            // Add bot response
            addMessage(response.response, false);
            
        } catch (error) {
            hideTyping();
            
            let errorMessage = 'Sorry, I\'m having trouble processing your request right now.';
            
            if (error.message.includes('429')) {
                errorMessage = 'I\'m receiving too many messages. Please wait a moment and try again.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Authentication error. Please contact support.';
            }
            
            addMessage(errorMessage, false);
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    }
    
    function openWidget() {
        const overlay = widget.querySelector('.chatbot-widget-overlay');
        const trigger = widget.querySelector('.chatbot-widget-trigger');
        
        if (overlay && trigger) {
            overlay.style.display = 'block';
            trigger.style.display = 'none';
            isOpen = true;
            
            // Focus input field
            setTimeout(() => {
                const inputField = document.getElementById('chatbot-input-field');
                if (inputField) inputField.focus();
            }, 100);
        }
    }
    
    function closeWidget() {
        const overlay = widget.querySelector('.chatbot-widget-overlay');
        const trigger = widget.querySelector('.chatbot-widget-trigger');
        
        if (overlay && trigger) {
            overlay.style.display = 'none';
            trigger.style.display = 'flex';
            isOpen = false;
        }
    }
    
    function bindEvents() {
        // Trigger button
        const trigger = widget.querySelector('#aiChatToggle');
        if (trigger) {
            trigger.addEventListener('click', openWidget);
        }
        
        // Close button
        const closeBtn = widget.querySelector('.chatbot-widget-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeWidget);
        }
        
        // Send button
        const sendBtn = widget.querySelector('#chatbot-send-button');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const inputField = document.getElementById('chatbot-input-field');
                if (inputField) {
                    handleUserMessage(inputField.value);
                }
            });
        }
        
        // Input field
        const inputField = widget.querySelector('#chatbot-input-field');
        if (inputField) {
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUserMessage(inputField.value);
                }
            });
            
            inputField.addEventListener('input', (e) => {
                const sendBtn = document.getElementById('chatbot-send-button');
                if (sendBtn) {
                    sendBtn.disabled = !e.target.value.trim();
                }
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeWidget();
            }
        });
    }
    
    // Initialize widget
    function initializeWidget() {
        // Generate session ID
        sessionId = generateSessionId();
        
        // Get configuration from script tag
        const scriptTag = document.querySelector('script[src*="widget"]') || document.querySelector('script[data-api-key]');
        if (scriptTag) {
            // Handle API key
            const apiKey = scriptTag.getAttribute('data-api-key');
            if (apiKey) {
                currentConfig.apiKey = apiKey;
            }
            
            // Handle API URL
            const apiUrl = scriptTag.getAttribute('data-api-url');
            if (apiUrl) {
                currentConfig.apiEndpoint = apiUrl;
            }
            
            // Check for other configuration attributes
            const attributes = ['primary-color', 'position', 'title', 'welcome-message', 'subtitle'];
            attributes.forEach(attr => {
                const value = scriptTag.getAttribute(`data-${attr}`);
                if (value) {
                    const configKey = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    currentConfig[configKey] = value;
                }
            });
        }
        
        // Create widget container
        widget = createElement('div', 'ai-chatbot-widget');
        widget.innerHTML = createWidgetHTML();
        
        // Add styles
        const styleElement = createElement('div');
        styleElement.innerHTML = createWidgetStyles();
        document.head.appendChild(styleElement.firstElementChild);
        
        // Add widget to page
        document.body.appendChild(widget);
        
        // Bind events
        bindEvents();
        
        // Load configuration from server
        loadConfiguration();
        
        // Auto-open if configured
        if (currentConfig.autoOpen) {
            setTimeout(openWidget, 1000);
        }
        
        console.log('AI Chatbot Widget initialized successfully');
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }
    
    // Public API
    window.AIChatbotWidget = {
        open: openWidget,
        close: closeWidget,
        isOpen: () => isOpen,
        sendMessage: (message) => {
            if (isOpen) {
                handleUserMessage(message);
            } else {
                console.warn('Widget is not open. Call AIChatbotWidget.open() first.');
            }
        },
        getConfig: () => currentConfig,
        updateConfig: (newConfig) => {
            Object.assign(currentConfig, newConfig);
            // TODO: Re-render widget with new config
        }
    };
    
})();
