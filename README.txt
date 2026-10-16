Web Proxy Lab
=============

必要なもの
- Node.js 18 以降

起動
1. このフォルダでターミナルを開く
2. node server.js
3. ブラウザで http://127.0.0.1:3000/ を開く
4. 「ライブ通信 (ローカルプロキシ)」に切り替える

初期状態の許可先
- example.com
- www.example.com
- httpbin.org
- www.httpbin.org

安全のため、任意のサイトを通す公開プロキシにはしていません。
自分で管理しているテストサイトを追加する場合は server.js の ALLOWED_HOSTS を編集してください。

仕組み
ブラウザ → localhost:3000/proxy?url=対象URL → Node.js → 対象サイト

対象サイトから返ってきたHTMLは、元のHTMLを画面側のリライト処理に渡します。
画像・CSS・JSなども同じ /proxy エンドポイントから取得できるよう、HTML内のURLを書き換えます。
