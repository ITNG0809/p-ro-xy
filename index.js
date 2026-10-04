const http = require('http');
const httpProxy = require('http-proxy');

// 🔒 あなたが決める「合言葉（パスワード）」
// ※英数字で好きな文字に変えてください
const MY_SECRET_PASSWORD = "hazimete12";

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // ブラウザから送られてきた合言葉をチェック
  const authHeader = req.headers['proxy-authorization'];
  
  // 合言葉が合っているか確認する処理
  const expectedAuth = 'Basic ' + Buffer.from('user:' + MY_SECRET_PASSWORD).toString('base64');

  if (!authHeader || authHeader !== expectedAuth) {
    // 合言葉が違う、または入力されていない場合は「鍵がかかっています」と返す
    res.writeHead(407, {
      'Proxy-Authenticate': 'Basic realm="Secure Private Proxy"'
    });
    res.end('Access Denied: Invalid Password.');
    return;
  }

  // 合言葉が正しければ、リクエストされたサイトへ通信を身代わりで転送する
  proxy.web(req, res, { 
    target: req.url,
    changeOrigin: true
  });
});

// サーバーを起動する（ポートは環境に合わせる）
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
