# WebOsu 2

[![CodeFactor](https://www.codefactor.io/repository/github/webosu-2/webosu-2.github.io/badge)](https://www.codefactor.io/repository/github/webosu-2/webosu-2.github.io)


Osu! is a rhythm game in which you click circles on the screen, following the rhythm of the music.


Powered by [PixiJS](https://www.pixijs.com) and [Sayobot](https://osu.sayobot.cn). This project is a fork & continuation of [the original WebOsu.](https://github.com/111116/webosu)

**(This project is not complete is under continuous development)**

This is an unofficial implementation of [Osu!](https://osu.ppy.sh). Scoring and judgement rules can differ from that of official Osu! and modes other than Osu!std are unsupported.

## Footage

game in action:

![webpage](screenshots/clip3.gif)

## Todo list

- [x] Update from outdated PixiJS v6 to v7
- [ ] Update from outdated PixiJS v7 to v8
- [ ] Uploadable skins
- [ ] Switch between beatmap providers

## Download proxy

Restricted networks can close browser connections to beatmap providers. The optional
`workers/download-proxy.js` Cloudflare Worker provides `/api/download?sid=<set id>`
from the same origin and is tried before the direct providers. Deploy it as a
Cloudflare Worker with an `/api/*` route on the site's domain; the static GitHub
Pages deployment will automatically fall through to the direct providers.
For example: `npx wrangler deploy workers/download-proxy.js --name webosu-download-proxy`.
Configure the Worker route as `your-domain.example/api/*`, or set
`BEATMAP_PROVIDER.DOWNLOAD_PROXY` in `scripts/config.js` to the Worker URL if it
is hosted on another domain.
If Wrangler reports that a `workers.dev` subdomain must be registered, open the
Workers subdomain page in the Cloudflare dashboard, choose a subdomain, then run
`npx wrangler deploy` again.

## License Notes

Some media files are copyrighted by [ppy](https://github.com/ppy/) and others. Check their respective license before you use them.
