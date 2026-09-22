# Sample bank statements for Prospr

## Test unknown format → verification

Use this file on **Transactions → Import**:

- `unknown-bank-format.txt`

Prospr does not accept `.txt` as a known statement type, so it should show
**Needs format verification**. Click **Update format**, map columns, save the
template, then confirm the import.

Suggested mapping for that file (pipe `|` separators — if analyze fails,
rename to `.csv` and use `unknown-bank-format.csv` instead):

| Column     | Map to            |
|------------|-------------------|
| PostingDay | Transaction Date  |
| MemoText   | Description       |
| MoneyOut   | Debit             |
| MoneyIn    | Credit            |
| Ledger     | Balance           |
| BankRef    | Reference         |

## Alternate CSV (same odd headers)

- `unknown-bank-format.csv` — same data as `.txt`, comma-separated.
  Automatic header detection may still fail on names like `PostingDay` /
  `MoneyOut`; if it does, use **Update format**.

## Known format (auto preview)

- `standard-hdfc-style.csv` — should parse with automatic mapping for a
  quick happy-path check.
