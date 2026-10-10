# Pict Chainer

1台のスマホを順番に回して遊ぶ、絵しりとりのモバイル向けWebアプリ（PWA）です。

## 遊び方

1. 描く順番を決め、人数・制限時間を設定してスタート
2. 最初の文字がお題として出るので、1番目の人はその文字から始まるものを絵に描き、答え（ひらがな）を入力して「完了」
3. 次の人は前の人の絵が何かを考え、しりとりでつながる絵を描く
4. 制限時間が終わったら答え合わせ。正しくつながった絵が連続した最大数がスコアになります

描いたものをゲーム中に口に出してはいけません。

### しりとりの判定ルール

- 末尾の「ー」は直前の文字を使う（こーひー → ひ）
- 小さい文字は大きい文字として扱う（きしゃ → や）
- 「ん」で終わると次にはつながらない
- 濁点・半濁点を区別するかはゲームの開始設定画面で切り替え可能（初期値は区別する）
- 判定に納得できないときは、結果画面で○×をタップして修正できる

## 必要な環境

- Node.js 22 以上（開発時は 22.17 を使用）
- npm

## セットアップ

```bash
npm install
```

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバーを起動（http://localhost:5173） |
| `npm run build` | 型チェックのあと `dist/` に本番ビルド |
| `npm run preview` | ビルド結果を配信（http://localhost:4173） |
| `npm test` | ユニットテスト（しりとり判定・履歴の件数制限） |
| `npm run icons` | `public/icon.svg` からPWA用アイコンを再生成 |

### オフライン動作・PWAの確認

Service Worker は本番ビルドにだけ含まれます。`npm run dev` では確認できないので、次の手順で確認します。

```bash
npm run build
npm run preview
```

ブラウザで開いたあと、開発者ツールでオフラインに切り替えて再読み込みしても動けばOKです。

### スマホ実機での確認

PWAのインストールや Service Worker は HTTPS（または localhost）でしか動きません。
同じWi-Fi内のスマホから `npm run preview -- --host` で表示はできますが、インストールやオフライン動作まで確認するには Netlify などHTTPSの環境にデプロイしてください。

## Netlify へのデプロイ

設定は `netlify.toml` に入っています（ビルドコマンド `npm run build`、公開フォルダ `dist`、Node 22）。

### Gitリポジトリと連携する場合

1. このフォルダをGitリポジトリにして GitHub などへ push
2. Netlify で「Add new site」→「Import an existing project」からリポジトリを選ぶ
3. ビルド設定は `netlify.toml` から自動で読み込まれるので、そのままデプロイ

### 手元からデプロイする場合

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

アセットは相対パスで参照しているので、サブディレクトリに置いても動きます。

## アイコンを変えるとき

`public/icon.svg` を差し替えて `npm run icons` を実行すると、`public/` 内のPNG・favicon が作り直されます。

## 構成

```
src/
├─ main.tsx / App.tsx     エントリと画面の切り替え
├─ screens/               ホーム・開始設定・ゲーム中・結果・履歴・設定
├─ components/            描画キャンバス、結果表示、インストール案内など
├─ lib/
│   ├─ shiritori.ts       しりとり判定とスコア計算
│   ├─ history.ts         履歴を直近5件に保つ処理
│   ├─ storage.ts         保存（履歴は IndexedDB、設定は localStorage）
│   ├─ audio.ts           BGM・SE（Web Audio で合成、音声ファイルなし）
│   ├─ resultImage.ts     結果画像の生成と保存
│   └─ install.ts         PWAインストール関連
└─ styles/app.css         スタイル全体
```

## データの保存について

- すべて端末内に保存され、外部には送信しません
- 履歴は直近5回ぶんだけ残り、それより古いものは自動で消えます
- ブラウザのサイトデータを消すと、履歴と設定も消えます

## 技術スタック

Vite / React / TypeScript / vite-plugin-pwa（Workbox）/ idb-keyval / Vitest
