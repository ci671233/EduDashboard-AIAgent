from flask import Flask, render_template, request, jsonify
from cbci_mcp import CBCIMCPServer

app = Flask(__name__)

# MCP 서버 초기화
server = CBCIMCPServer()
server.setup(
    config_path="cbci-mcp/config.yaml",
    questions_path="cbci-mcp/questions.yaml", 
    schema_path="cbci-mcp/schema.yaml"
)

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """챗봇 API"""
    data = request.get_json()
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'success': False, 'error': '메시지를 입력해주세요.'}), 400
    
    # MCP 서버에 질문
    response = server.ask(user_message)
    
    # 응답 처리
    if isinstance(response, dict) and response.get('status') == 'success':
        answer = response.get('answer', str(response))
    else:
        answer = str(response)
    
    return jsonify({
        'success': True,
        'message': answer,
        'user_message': user_message
    })

@app.route('/api/status', methods=['GET'])
def status():
    """상태 확인"""
    return jsonify({
        'success': True,
        'initialized': True,
        'status': '준비됨'
    })

if __name__ == '__main__':
    print("🚀 교육 데이터 분석 챗봇 시작!")
    print("📊 URL: http://localhost:9990")
    app.run(debug=True, host='0.0.0.0', port=9990) 