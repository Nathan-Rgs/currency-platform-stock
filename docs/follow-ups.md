# Follow-ups (pendências menores da revisão final)

Itens não bloqueantes registrados durante a revisão de 2026-10-21 (branch feat/final-review). Nenhum grava valor errado nem vaza dado privado; todos foram triados como follow-up na revisão final.

- **T1:** test session autoflush=False differs from app default? (app SessionLocal also autoflush=False — matches)
- **T1:** TestClient without lifespan context
- **T2:** auth-guard tests send no body for POST routes; no flag-on register test; PUT/PATCH/upload not parametrized
- **T3:** PATCH with explicit null on NOT NULL fields (for_sale, title…) → 500 not 422 (pre-existing pattern)
- **T3:** year validator also runs on CoinRead (read of legacy future-year row would 500)
- **T4:** ilike wildcards %/_ not escaped in search
- **T4:** /public/facets lacks response_model
- **T4:** no test for sale_price kept when for_sale=True; no test for notes search on private list
- **T5:** redundant second db.commit() coins.py:167
- **T5:** no magic-byte check; consider X-Content-Type-Options nosniff on /media; check file.size early
- **T5:** no unit test for delete_media traversal/foreign prefix, single-side upload, commit failure
- **T6:** thousands separators (1.234,50) and 'R$ 10,00' rejected as row errors (safe, unsupported)
- **T6:** audit loop failure after commit returns 500 without counts (pre-existing)
- **T6:** CSV formula injection on export (low, single owner); import has no size cap
- **T6:** CSV row with only ignored columns → row error; no JSON falsy-value regression test; \r-only line endings
- **T7:** total_originals/replicas/for_sale count records not pieces — label cards accordingly
- **T8:** coin-format imports api.ts (axios) — move API_URL to config.ts if needed; no ImportMetaEnv typing for VITE_* vars (add when contact vars consumed, T12)
- **T10:** text-gold on cream in CoinCard/PublicHeader/CoinFilters; font-bold on Fraunces; card borders vs D6; success tokens unmapped
- **T11:** no keepPreviousData/retry tuning on list query (skeleton flash, ~7s to error)
- **T11:** unvalidated URL params (NaN years, bad enums); no scroll-to-top on page change; page>totalPages; aria-label/visible text mismatch on country select; URL value missing from facets renders blank
- **T12:** Dialog lacks DialogDescription; close button visibility on transparent dialog; one-frame flash on coin change; stray ' · ' with null country/year; null sale_price on for_sale; WhatsApp env not sanitized (strip non-digits); title not restored; dialog.tsx sr-only 'Close' in English
- **T13:** sidebar coin mark hardcoded hex (share with PublicHeader); Sheet stays open past lg; App.tsx semicolon style inconsistency; Sheet/Dialog close sr-only label 'Close' in English
- **T14:** '1.234' parsed as 1.234 (pt-BR thousands ambiguity; plan mandates accepting '10.50'); Number() accepts 1e3/0x10
- **T14:** 500 without detail shown as 'Falha de conexão'; quantity no upper bound; object URLs not revoked/created in updater; no unsaved-changes guard; year message built at import; missing tests (1.234,50, year+1, for_sale off); condition error not tied to input
- **T15:** noCoinsAtAll should use meta.total_items (page>total shows wrong empty state); revokeObjectURL immediately after click; ImportDialog stale result if closed mid-import; duplicatingTitle not cleared after add-another + no cancel flag; thumbnail alt duplicates title; setPage before invalidate
- **T16:** dark-mode palette slots equal (dark out of scope); Cell key 'Outros' collision; import doesn't invalidate dashboard-summary (refetch on close covers it); YAxis width clips long names; thumbnail alt repeats title; empty recent section; topN tests for exactly-n/empty
- **T17:** next=/admin/login nested bounce (exclude in regex); interceptor startsWith('/admin') matches /administrator; toast lost before hard redirect; download.ts mutates e.response.data; no test for next-guard regex
- **T18:** .env.example lacks comment that JWT/MFA keys must be generated (MFA placeholder not valid Fernet → crash); unused CORS origins 5173/3000
- **T18:** stale /tmp/backup.dump in container; Git Bash MSYS path conversion for /tmp args
