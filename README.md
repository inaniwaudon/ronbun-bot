# ronbun-bot

論文を要約する bot です。以下のサイトに対応しています。

- [ACM Digital Library](https://dl.acm.org)
- [J-STAGE](https://www.jstage.jst.go.jp/browse/-char/ja/)

## 使い方

サーバーに招待し、スラッシュコマンド `/doi doi: <DOI または DOI を含む URL>` で呼び出します。

```
/doi doi: https://dl.acm.org/doi/10.1145/2493190.2493243
/doi doi: 10.11184/his.23.4_383
```

## 導入

Cloudflare Workers および Google Apps Script（GAS）にデプロイします。

```bash
yarn
yaru run dev    # 開発サーバを起動
yarn run deploy # デプロイ
```

1. [Developer Portal](https://discord.com/developers/applications) から Discord App を登録し、以下の API キーを取得する
    - General Information → Application ID, Public Key
    - Bot → Token
2. [OpenAI API](https://openai.com/blog/openai-api) に登録し、API キーを取得する
3. GAS のスクリプトプロパティに 各種 API キーおよびコールバック用のエンドポイントを登録する
4. GAS に `gas.js` をウェブアプリとしてデプロイする
5. Cloudflare Workers にアプリケーションをデプロイする
6. Cloudflare Workers の環境変数に、各種 API キーおよび GAS の URL を登録する
    - 詳細は `src/bindings.ts` を参照
