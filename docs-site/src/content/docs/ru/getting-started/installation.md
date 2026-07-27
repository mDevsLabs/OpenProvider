---
title: Установка
description: Установите прокси OpenProvider (opr) и необходимые компоненты и убедитесь, что он запускается.
---

OpenProvider устанавливает два эквивалентных имени команды: `opr` и `OpenProvider`. Обе запускают один и
тот же небольшой локальный HTTP-сервер (построенный на Bun). Запросы к моделям идут к провайдеру,
выбранному маршрутизацией; опциональные сайдкары для vision и веб-поиска также могут использовать
ваш вход в ChatGPT, когда они нужны маршрутизируемой модели.

## Предварительные требования

| Требование | Зачем |
| --- | --- |
| **[Node](https://nodejs.org) ≥ 18** | `opr` работает на рантайме Bun, но рантайм автоматически поставляется в комплекте при `npm install` — устанавливать Bun самостоятельно **не нужно**. |
| **[OpenAI Codex](https://openai.com/codex)** (CLI, App или SDK) | Клиент, перед которым работает OpenProvider. OpenProvider записывает данные в `$CODEX_HOME/config.toml` (по умолчанию `~/.codex/config.toml`). |
| Аккаунт провайдера или API-ключ | Anthropic, xAI, Kimi, Ollama Cloud, OpenRouter, OpenAI-совместимая конечная точка или ваш вход в ChatGPT. |

## Установка

```bash
npm install -g @bitkyc08/OpenProvider
```

:::note[npm заблокировал postinstall-скрипт bun?]
Свежие версии npm могут блокировать postinstall-скрипт bun (`npm warn
install-scripts ... blocked because they are not covered by allowScripts`),
из-за чего встроенный рантайм Bun остаётся неподготовленным. Переустановите
пакет, разрешив скрипт bun, — и обязательно указывайте имя пакета: в
сокращённой подсказке npm его нет, и без него вместо пакета переустановится
текущий каталог:

```bash
npm install -g --allow-scripts=bun @bitkyc08/OpenProvider

# если изначально устанавливали через sudo, продолжайте использовать sudo:
sudo npm install -g --allow-scripts=bun @bitkyc08/OpenProvider
```
:::

Убедитесь, что оба псевдонима команды доступны в `PATH`:

```bash
opr --version
OpenProvider --version
```

### Каналы релизов

Стабильный канал `latest` уже включает поддержку каталога GPT-5.6 Sol/Terra/Luna для маршрутов
ChatGPT, OpenAI по API-ключу, OpenRouter и экспериментального Cursor. Доступ у вышестоящего
провайдера по-прежнему зависит от аккаунта; сами по себе записи каталога доступ не дают.
Используйте канал preview только для тестирования ещё не выпущенных сборок OpenProvider:

```bash
npm install -g @bitkyc08/OpenProvider@preview
opr update --tag preview
```

## Запуск из исходного кода

Чтобы работать над самим OpenProvider:

```bash
git clone https://github.com/mDevsLabs/OpenProvider.git
cd OpenProvider
bun install
bun run dev:proxy   # запускает API прокси в режиме разработки (src/cli/index.ts start)
bun run dev:gui     # запускает dev-сервер панели управления (в другом терминале)
```

`bun run dev` остаётся псевдонимом для `bun run dev:proxy`. API прокси предоставляет `/healthz`,
`/v1/responses` и `/api/*`; `GET /` отдаёт упакованную панель управления только после того, как
`bun run build:gui` создаст `gui/dist`. Пока вы работаете над панелью управления, запускайте
фронтенд отдельно командой `bun run dev:gui`.

## Что создаётся

Состояние OpenProvider хранится в `$OpenProvider_HOME` (по умолчанию `~/.OpenProvider`). Файлы интеграции
с Codex находятся в `$CODEX_HOME` (по умолчанию `~/.codex`).

| Путь | Назначение |
| --- | --- |
| `$OpenProvider_HOME/config.json` | Ваши провайдеры, провайдер по умолчанию, порт и параметры. |
| `$OpenProvider_HOME/opr.pid` | PID запущенного прокси (защита от повторного запуска). |
| `$OpenProvider_HOME/runtime-port.json` | Текущие PID, имя хоста и порт, включая автоматически выбранный запасной порт. |
| `$OpenProvider_HOME/auth.json` | Сохранённые учётные данные OAuth (после `opr login`). |
| `$OpenProvider_HOME/catalog-backup*.json` | Резервные копии каталога моделей Codex, создаваемые перед тем, как OpenProvider его изменит. |
| `$CODEX_HOME/config.toml` | На loopback-адресе OpenProvider добавляет корневой `openai_base_url`, отмеченный собственным маркером; при привязке не к loopback используются `model_provider = "OpenProvider"` и `[model_providers.OpenProvider]`, чтобы Codex мог отправлять заголовок API-аутентификации. |
| `$CODEX_HOME/OpenProvider.config.toml` | Резервный/справочный профиль, записываемый рядом с основной конфигурацией Codex. |
| `$CODEX_HOME/OpenProvider-catalog.json` | Синхронизированный каталог нативных и маршрутизируемых моделей, используемый Codex. |

:::note
OpenProvider никогда не удаляет вашу конфигурацию Codex. Каждое внедрение обратимо — `opr stop`,
`opr restore` или `opr eject` убирают ровно те строки, которые добавил OpenProvider, и восстанавливают
нативный Codex.
:::

## Далее

Переходите к разделу [Быстрый старт](/ru/getting-started/quickstart/), чтобы настроить
первого провайдера, или прочитайте [Как это работает](/ru/getting-started/how-it-works/),
чтобы разобраться в архитектуре.


