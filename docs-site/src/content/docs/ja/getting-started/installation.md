---
title: インストール
description: OpenProvider(opr)プロキシと前提条件をインストールし、正常に実行できるか確認します。
---

OpenProvider をインストールすると同じ実行ファイルを指す `opr` と `OpenProvider` コマンドが一緒に提供されます。
どちらも Bun ベースの小さなローカル HTTP サーバーを実行します。モデルリクエストはルーティングで選ばれたプロバイダーに
転送され、必要に応じて vision とウェブ検索のサイドカーが ChatGPT ログインを使うこともあります。

## 前提条件

| 要件 | 理由 |
 --- | --- |
| **[Node](https://nodejs.org) ≥ 18** | `opr` は Bun ランタイムで実行されますが、ランタイムは `npm install` 時に自動でバンドルされるため、Bun を自分でインストールする必要は**ありません**。 |
| **[OpenAI Codex](https://openai.com/codex)**(CLI、App、または SDK) | OpenProvider が前に立つクライアントです。OpenProvider は `$CODEX_HOME/config.toml`(デフォルト `~/.codex/config.toml`)に書き込みます。 |
| プロバイダーアカウントまたは API キー | Anthropic、xAI、Kimi、Ollama Cloud、OpenRouter、OpenAI API キー、OpenAI 互換エンドポイント、または ChatGPT ログイン。 |

## インストール

```bash
npm install -g @bitkyc08/OpenProvider
```

:::note[npm が bun の postinstall をブロックした?]
最新の npm は bun の postinstall スクリプトをブロックすることがあります(`npm warn
install-scripts ... blocked because they are not covered by allowScripts`)。
この場合バンドル Bun ランタイムが準備されないため、bun スクリプトを許可して
再インストールしてください。npm 警告の省略コマンドにはパッケージ名が含まれておらず、現在の
ディレクトリを再インストールしてしまうので、必ずパッケージ名を明示してください:

```bash
npm install -g --allow-scripts=bun @bitkyc08/OpenProvider

# 最初に sudo でインストールした場合は sudo を維持してください:
sudo npm install -g --allow-scripts=bun @bitkyc08/OpenProvider
```
:::

両方のコマンドが `PATH` にあることを確認します:

```bash
opr --version
OpenProvider --version
```

### 配布チャネル

安定チャネルの `latest` にも ChatGPT、OpenAI API キー、OpenRouter、実験段階の Cursor 経路のための
GPT-5.6 Sol/Terra/Luna カタログ情報がすでに含まれています。ただしモデルの利用権まで付与されるわけでは
ありません。まだ正式配布されていない OpenProvider ビルドを試す場合のみ preview チャネルを使ってください:

```bash
npm install -g @bitkyc08/OpenProvider@preview
opr update --tag preview
```

## ソースから実行

OpenProvider 自体を直接修正しながら作業するには:

```bash
git clone https://github.com/mDevsLabs/OpenProvider.git
cd OpenProvider
bun install
bun run dev:proxy   # 開発モードでプロキシ API を起動 (src/cli/index.ts start)
bun run dev:gui     # ダッシュボード dev サーバーを起動 (別ターミナル)
```

`bun run dev` は `bun run dev:proxy` のエイリアスとして残っています。プロキシ API は `/healthz`、
`/v1/responses`、`/api/*` を公開し、`GET /` は `bun run build:gui` が `gui/dist` を生成した
後にのみパッケージされたダッシュボードを提供します。ダッシュボードを編集する際は `bun run dev:gui` でフロントエンドを
別途実行してください。

## 生成されるもの

OpenProvider の状態ファイルは `$OpenProvider_HOME`(デフォルト `~/.OpenProvider`)の下に、Codex 連携ファイルは
`$CODEX_HOME`(デフォルト `~/.codex`)の下に保存されます。

| パス | 用途 |
 --- | --- |
| `$OpenProvider_HOME/config.json` | プロバイダー、デフォルトプロバイダー、ポート、オプション。 |
| `$OpenProvider_HOME/opr.pid` | 実行中のプロキシの PID(単一インスタンスガード)。 |
| `$OpenProvider_HOME/runtime-port.json` | 自動で選んだ代替ポートを含む現在の PID、ホスト名、ポート。 |
| `$OpenProvider_HOME/auth.json` | 保存された OAuth 認証情報(`opr login` 時)。 |
| `$OpenProvider_HOME/catalog-backup*.json` | OpenProvider が変更する前に作成した Codex モデルカタログのバックアップ。 |
| `$CODEX_HOME/config.toml` | ローカル専用構成では OpenProvider が管理するルート `openai_base_url` を追加します。ローカル以外のアドレスにバインドする場合は Codex が API 認証ヘッダーを送れるよう `model_provider = "OpenProvider"` と `[model_providers.OpenProvider]` を使います。 |
| `$CODEX_HOME/OpenProvider.config.toml` | デフォルト Codex 設定と一緒に生成される参考用 fallback プロファイル。 |
| `$CODEX_HOME/OpenProvider-catalog.json` | Codex が使うネイティブおよびルーティングモデルカタログ。 |

:::note
OpenProvider は決して Codex 設定を削除しません。すべての注入は元に戻せます — `opr stop`、`opr restore`、
または `opr eject` は OpenProvider が追加した行だけを正確に削除し、ネイティブ Codex を復元します。
:::

## 次へ

[クイックスタート](/ja/getting-started/quickstart/)に進んで最初のプロバイダーを設定するか、
アーキテクチャを知るには[仕組み](/ja/getting-started/how-it-works/)をお読みください。


