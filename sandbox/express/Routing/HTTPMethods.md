라우팅은 URI(또는 경로) 및 특정한 HTTP 요청 메소드(GET, POST 등)인 특정 엔드포인트에 대한 클라이언트 요청에 
애플리케이션이 응답하는 방법을 결정하는 것을 말합니다.

라우팅은 애플리케이션 엔드 포인트(URI)의 정의, 그리고 URI가 클라이언트 요청에 응답하는 방식을 말합니다. 

각 라우트는 하나 이상의 핸들러 함수를 가질 수 있으며, 이러한 함수는 라우트가 일치할 때 실행됩니다.

라우트 정의에는 다음과 같은 구조가 필요합니다.
app.METHOD(PATH, HANDLER)
여기서,
app은 express의 인스턴스입니다.
METHOD는 HTTP 요청 메소드입니다.
PATH는 서버에서의 경로입니다.
HANDLER는 라우트가 일치할 때 실행되는 함수입니다.

Express는 HTTP 메소드에 해당하는 다음과 같은 라우팅 메소드를 지원합니다. 
get, post, put, head, delete, 
options, trace, copy, lock, mkcol, 
move, purge, propfind, proppatch, 
unlock, report, mkactivity, checkout, 
merge, m-search, notify, subscribe, unsubscribe, 
patch, search 및 connect.
