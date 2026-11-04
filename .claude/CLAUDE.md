@../AGENTS.md

## Claude Code

この節は Claude Code のセッションにだけ適用する。Cursor は `AGENTS.md` と `.cursor/rules/` に従う。Cursor の Cloud Agent の完了条件は `.cursor/rules/cursor-cloud.mdc` にあり、この節はそれを取り消さない。

自分を Cursor の Cloud Agent と扱わない。環境変数 `CLAUDE_CODE_REMOTE` が `true` のセッションが、Claude Code のクラウドエージェントである。それ以外の Claude Code はローカルである。

- **ローカル:** コミット、push、プルリクエストの作成は、この会話でユーザーが頼んだときだけ行う。
- **クラウド:** 用語解説記事を作成または編集し終えたら、ユーザーの追加の指示を待たず、コミット → push → プルリクエスト作成まで行う。手順は `.claude/rules/glossary-article-authoring.md`。`main` へ直接 push しない。`gh pr create` は使わず、GitHub の REST で PR を開く。
- **定期実行（Routine）から起動されたクラウド:** 指示文で渡された `docs/routine-article-theme.md` に従い、追加の指示を待たず PR（または候補 Issue）まで送る。類似問題は定期実行しない。
