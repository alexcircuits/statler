# Statler

A self-hosted, unified GitHub stats card generator. Designed to look native, feel premium, and run efficiently on your own infrastructure.

![Preview](https://statler.noirsystems.com/api/card/alexcircuits?accent=58a6ff)

## Features

- **Unified Card** - All your GitHub stats in one clean, high-performance SVG.
- **Language Breakdown** - Detailed language percentages with GitHub-native colors.
- **Contribution Graph** - 30-day activity sparkline and streak tracking.
- **Customizable** - Change colors, toggle sections, and include private commits.
- **Production Ready** - Built-in caching, rate limiting, and performance optimizations.

## VPS Deployment

To deploy Statler to your VPS (e.g., Ubuntu), follow these steps:

### 1. Requirements
Ensure you have Node.js (18+), npm, and Nginx installed on your server.

### 2. Auto-Deploy Script
Run the following commands on your VPS:
```bash
wget https://raw.githubusercontent.com/alexcircuits/statler/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 3. Nginx Setup
Copy `statler.conf` to `/etc/nginx/sites-available/` and link it:
```bash
sudo cp statler.conf /etc/nginx/sites-available/statler.conf
sudo ln -s /etc/nginx/sites-available/statler.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL (Optional but Recommended)
```bash
sudo certbot --nginx -d statler.noirsystems.com
```

## API Usage

Generate cards via the API:
`https://statler.noirsystems.com/api/card/{username}?options`

| Option | Values |
|--------|--------|
| `accent` | Hex color (e.g., `58a6ff`) |
| `stats` | `true`/`false` |
| `languages` | `true`/`false` |
| `streak` | `true`/`false` |
| `activity` | `true`/`false` |
| `include_private` | `true`/`false` |
| `show_name` | `true`/`false` |
| `full_width` | `true`/`false` |

## License
MIT
