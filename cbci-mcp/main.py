from cbci_mcp import CBCIMCPServer

# MCP 서버 생성
server = CBCIMCPServer()

# 챗봇 세팅
server.setup(config_path="config.yaml", questions_path="questions.yaml", schema_path="schema.yaml")

# 질문하기
answer = server.ask("서울 2023년 학생수")
print("답변:", answer)
