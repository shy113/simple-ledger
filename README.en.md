# FuYou Simple Ledger

> Light records, slow life.

[中文](README.md) | English

A minimalist personal bookkeeping mini-program built with **uni-app + Vue 3 + TypeScript**.
Designed for speed, clarity, and complete on-device privacy — no server, no sign-up, no tracking.

---

## Features

- **Quick Entry** — Floating action button to add bills instantly: amount, date, category, member, notes
- **Multi-dimensional Stats** — Weekly / Monthly / Yearly views with trend charts, category rankings, and member rankings
- **Category Management** — Fully customizable expense / income categories with emoji icons
- **Member Management** — Add family or team members with custom avatars
- **Data Backup** — Export all data as JSON to clipboard; restore from clipboard with one tap
- **Themes** — Multiple built-in color schemes powered by CSS Variables
- **Fully Local** — All data stored on-device only. Zero server, zero tracking, zero registration

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Framework | uni-app + Vue 3 Composition API     |
| Language  | TypeScript                          |
| Build     | Vite                                |
| Styling   | CSS Variables + rpx                 |
| Storage   | uni.setStorageSync / getStorageSync |

Supported targets: WeChat Mini Program, H5, Alipay Mini Program, and more via uni-app.

---

## Getting Started

```bash
npm install

# WeChat Mini Program
npm run dev:mp-weixin

# H5
npm run dev:h5
```

Build:

```bash
npm run build:mp-weixin
npm run build:h5
```

Type check:

```bash
npm run type-check
```

---

## Project Structure

```
src/
├── components/          # Shared UI components
├── composables/         # Core state: bills, categories, members, theme
├── pages/               # App pages (home, stats, stats-detail, profile)
├── views/Home/          # Home sub-views (add bill modal, backup, etc.)
├── types/               # TypeScript type definitions
├── utils/               # Date parsing helpers
└── theme/               # Theme color configuration
```

---

## Local Storage Schema

No backend. Data lives entirely on-device in WeChat local storage:

| Key             | Content              |
|-----------------|----------------------|
| my_bills        | Bill list JSON       |
| my_categories   | Category config JSON |
| my_persons      | Member config JSON   |

---

## Roadmap

- Budget limits with overspend alerts
- Enhanced charts (pie, bar)
- Cloud sync and multi-device support
- Recurring bills (rent, subscriptions)
- CSV export

---

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss changes first.

---

## License

Released under the [MIT License](LICENSE).
