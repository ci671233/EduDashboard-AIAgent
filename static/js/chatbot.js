// 교육 데이터 분석 챗봇 JavaScript

class ChatBot {
    constructor() {
        this.isConnected = false;
        this.isLoading = false;
        this.messageHistory = [];
        
        // DOM 요소들
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');
        this.clearButton = document.getElementById('clear-chat');
        this.loadExamplesButton = document.getElementById('load-examples');
        this.exampleQuestions = document.getElementById('example-questions');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkConnectionStatus();
        // this.loadExampleQuestions(); // 예시 질문 기능 비활성화
    }
    
    setupEventListeners() {
        // 전송 버튼 클릭
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter 키로 전송
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 입력 상태에 따른 버튼 활성화
        this.chatInput.addEventListener('input', () => {
            const hasText = this.chatInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText || this.isLoading;
        });
        
        // 대화 내용 지우기
        this.clearButton.addEventListener('click', () => this.clearChat());
        
        // 예시 질문 기능 비활성화
        // this.loadExamplesButton.addEventListener('click', () => this.loadExampleQuestions());
    }
    
    async checkConnectionStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.success) {
                this.updateStatus('connected', '연결됨');
                this.isConnected = true;
            } else {
                this.updateStatus('error', '연결 실패');
                this.isConnected = false;
            }
        } catch (error) {
            console.error('상태 확인 실패:', error);
            this.updateStatus('error', '연결 오류');
            this.isConnected = false;
        }
    }
    
    updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }
    
    async loadExampleQuestions() {
        // 예시 질문 기능 비활성화
        return;
    }
    
    displayExampleQuestions(examples) {
        this.exampleQuestions.innerHTML = '';
        
        examples.forEach(example => {
            const exampleItem = document.createElement('div');
            exampleItem.className = 'example-item';
            exampleItem.textContent = example;
            exampleItem.addEventListener('click', () => {
                this.chatInput.value = example;
                this.chatInput.focus();
                this.sendButton.disabled = false;
            });
            
            this.exampleQuestions.appendChild(exampleItem);
        });
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isLoading) return;
        
        // 사용자 메시지 추가
        this.addMessage('user', message);
        this.chatInput.value = '';
        this.sendButton.disabled = true;
        
        // 로딩 상태
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage('bot', data.message);
            } else {
                this.addMessage('bot', `죄송합니다. 오류가 발생했습니다: ${data.error}`, true);
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            this.addMessage('bot', '서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', true);
        } finally {
            this.setLoading(false);
        }
    }
    
    addMessage(type, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <p>${this.escapeHtml(content)}</p>
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        } else {
            const errorClass = isError ? 'error-message' : '';
            const icon = isError ? 'fas fa-exclamation-triangle' : 'fas fa-robot';
            const formattedContent = this.formatBotMessage(content);
            
            messageDiv.innerHTML = `
                <div class="message-avatar ${errorClass}">
                    <i class="${icon}"></i>
                </div>
                <div class="message-content ${errorClass}">
                    ${formattedContent}
                    <div class="message-time">${timestamp}</div>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // 메시지 히스토리 저장
        this.messageHistory.push({ type, content, timestamp, isError });
    }
    
    formatBotMessage(content) {
        // 숫자에 천단위 콤마 추가 (이미 포맷된 경우 중복 방지)
        let formatted = content.replace(/\b(\d{4,})\b/g, (match) => {
            if (match.includes(',')) return match;
            return parseInt(match).toLocaleString();
        });
        
        // 키워드 하이라이팅
        const keywords = ['학생수', '교사수', '교육예산', '출생아수', '폐교', '휴교', '지역', '순이동률'];
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            formatted = formatted.replace(regex, '<strong>$1</strong>');
        });
        
        // 줄바꿈 처리
        formatted = formatted.replace(/\n/g, '<br>');
        
        return `<p>${formatted}</p>`;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.loadingOverlay.classList.remove('hidden');
            this.sendButton.disabled = true;
            this.chatInput.disabled = true;
        } else {
            this.loadingOverlay.classList.add('hidden');
            this.chatInput.disabled = false;
            this.sendButton.disabled = this.chatInput.value.trim().length === 0;
            this.chatInput.focus();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    clearChat() {
        if (confirm('대화 내용을 모두 지우시겠습니까?')) {
            // 환영 메시지만 남기고 모든 메시지 제거
            const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage);
            }
            
            this.messageHistory = [];
            this.chatInput.focus();
        }
    }
    
    showError(message) {
        this.addMessage('bot', message, true);
    }
    
    // 유틸리티 메서드들
    formatNumber(num) {
        return parseInt(num).toLocaleString();
    }
    
    formatCurrency(amount) {
        return parseInt(amount).toLocaleString() + '원';
    }
}

// CSS 추가 스타일을 동적으로 추가
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .message-time {
            font-size: 0.7rem;
            color: #999;
            margin-top: 0.5rem;
            text-align: right;
        }
        
        .user-message .message-time {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .error-message {
            color: #f56565 !important;
        }
        
        .bot-message .message-content.error-message {
            background: rgba(245, 101, 101, 0.1) !important;
            border: 1px solid rgba(245, 101, 101, 0.2) !important;
        }
        
        .message-content strong {
            color: #667eea;
            font-weight: 600;
        }
        
        .user-message .message-content strong {
            color: rgba(255, 255, 255, 0.9);
        }
        
        /* 모바일에서 입력창 확대 방지 */
        @media screen and (max-width: 768px) {
            #chat-input {
                font-size: 16px;
            }
        }
        
        /* 스크롤 애니메이션 */
        .chat-messages {
            scroll-behavior: smooth;
        }
        
        /* 메시지 등장 애니메이션 */
        .user-message,
        .bot-message {
            animation: messageSlideIn 0.3s ease-out;
        }
        
        @keyframes messageSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* 타이핑 인디케이터 */
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #666;
            font-style: italic;
        }
        
        .typing-dots {
            display: flex;
            gap: 2px;
        }
        
        .typing-dots span {
            width: 4px;
            height: 4px;
            background: #667eea;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.3;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// DOM이 로드되면 챗봇 초기화
document.addEventListener('DOMContentLoaded', () => {
    addDynamicStyles();
    
    // 챗봇 인스턴스 생성
    window.chatBot = new ChatBot();
    
    // 전역 함수들
    window.sendExampleQuestion = (question) => {
        window.chatBot.chatInput.value = question;
        window.chatBot.sendMessage();
    };
    
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + L로 채팅 지우기
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            window.chatBot.clearChat();
        }
        
        // ESC로 입력창 포커스
        if (e.key === 'Escape') {
            window.chatBot.chatInput.focus();
        }
    });
    
    console.log('🤖 교육 데이터 분석 챗봇이 준비되었습니다!');
}); 