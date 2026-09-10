/*
// scripts/config.js
const BEATMAP_PROVIDER = {
    // Beatmap .osz download
    DOWNLOAD: "https://txy1.sayobot.cn/beatmaps/download/mini/",
    
    // Audio preview (mp3)
    PREVIEW: "https://cdn.sayobot.cn:25225/preview/",
    
    // Cover image
    COVER: "https://cdn.sayobot.cn:25225/beatmaps/",
    
    // Beatmap info API (single map details)
    API_INFO: "https://api.sayobot.cn/beatmapinfo?1=",
    API_INFO_V2: "https://api.sayobot.cn/v2/beatmapinfo?0=",
    
    // Beatmap list API (browsing/searching)
    API_LIST: "https://api.sayobot.cn/beatmaplist"
};

// Helper functions for URL construction
function getDownloadUrl(sid) {
    return `${BEATMAP_PROVIDER.DOWNLOAD}${sid}?noVideo=1`;
}

function getDownloadUrls(sid) {
    return [
        getDownloadUrl(sid),
        `https://api.nerinyan.moe/d/${sid}?noVideo=1`
    ];
}

function getPreviewUrl(sid) {
    return `${BEATMAP_PROVIDER.PREVIEW}${sid}.mp3`;
}

function getCoverUrl(sid) {
    return `${BEATMAP_PROVIDER.COVER}${sid}/covers/cover.webp`;
}

function getInfoUrl(sid) {
    return `${BEATMAP_PROVIDER.API_INFO}${sid}`;
}

function getInfoUrlV2(sid) {
    return `${BEATMAP_PROVIDER.API_INFO_V2}${sid}`;
}

*/


// scripts/config.js

const BEATMAP_PROVIDER = {
    // Beatmap .osz download. Nerinyan returns a CORS-enabled redirect to the archive.
    DOWNLOAD: "https://api.nerinyan.moe/d/",
    DOWNLOAD_PROXY: "https://webosu-download-proxy.webosu-2-nerinyan-github-io.workers.dev",
    
    // Audio preview (mp3) - redirected to official osu! assets
    PREVIEW: "https://b.ppy.sh/preview/",
    
    // Cover image - redirected to official osu! assets
    COVER: "https://assets.ppy.sh/beatmaps/",
    
    // Route osu.direct API requests through a CORS-friendly read-only relay.
    API_INFO: "https://r.jina.ai/http://osu.direct/api/v2/s/",
    API_INFO_V2: "https://r.jina.ai/http://osu.direct/api/v2/s/",
    
    // Beatmap list API (searching)
    API_LIST: "https://r.jina.ai/http://osu.direct/api/v2/search"
};

// Helper functions for URL construction
function getDownloadUrl(sid) {
    return `${BEATMAP_PROVIDER.DOWNLOAD}${sid}?noVideo=1`;
}

function getDownloadUrls(sid) {
    const proxyUrl = BEATMAP_PROVIDER.DOWNLOAD_PROXY
        ? `${BEATMAP_PROVIDER.DOWNLOAD_PROXY}/api/download?sid=${encodeURIComponent(sid)}`
        : `/api/download?sid=${encodeURIComponent(sid)}`;

    return [
        proxyUrl,
        getDownloadUrl(sid),
        `https://osu.direct/d/${sid}`,
        `https://catboy.best/d/${sid}`
    ];
}

function getPreviewUrl(sid) {
    return `${BEATMAP_PROVIDER.PREVIEW}${sid}.mp3`;
}

function getCoverUrl(sid) {
    // osu! official assets use .jpg for covers
    return `${BEATMAP_PROVIDER.COVER}${sid}/covers/cover.jpg`;
}

function getInfoUrl(sid) {
    return `${BEATMAP_PROVIDER.API_INFO}${sid}`;
}

function getInfoUrlV2(sid) {
    return `${BEATMAP_PROVIDER.API_INFO_V2}${sid}`;
}

function getListUrl(options = {}) {
    const {
        offset = 0,
        query = "",
        sort = "last_updated:desc",
        genre = "",
        language = ""
    } = options;
    const limit = 20;
    const params = new URLSearchParams({
        limit: limit.toString(),
        page: (Math.floor(offset / limit) + 1).toString(),
        sort
    });

    if (query) params.set("q", query);
    if (genre) params.set("g", genre);
    if (language) params.set("l", language);

    return `${BEATMAP_PROVIDER.API_LIST}?${params}`;
}

(function patchFetchForOsuDirect() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const url = args[0] instanceof Request ? args[0].url : args[0];

        // 1. Intercept osu.direct API calls (Search & Info) to reformat JSON
        if (typeof url === "string" && url.includes("osu.direct/api/v2/")) {
            const response = await originalFetch.apply(this, args);
            const originalJson = response.json.bind(response);
            const isRelayResponse = response.headers.get("content-type")?.includes("text/plain");
            
            // Parse relay envelopes, then adapt osu! API v2 format to the site's format.
            response.json = async () => {
                let data;
                if (isRelayResponse) {
                    const body = await response.text();
                    const marker = "Markdown Content:\n";
                    const content = body.includes(marker) ? body.split(marker, 2)[1].trim() : body;
                    data = JSON.parse(content);
                } else {
                    data = await originalJson();
                }
                
                // Case A: Search results (API_LIST)
                if (Array.isArray(data)) {
                    return {
                        data: data.map(set => ({
                            sid: set.id,
                            title: set.title,
                            artist: set.artist,
                            creator: set.creator,
                            approved: {
                                ranked: 1,
                                approved: 2,
                                qualified: 3,
                                loved: 4,
                                pending: 0,
                                wip: -1,
                                graveyard: -2
                            }[set.status] ?? 0
                        }))
                    };
                }

                // Case B: Beatmapset info (API_INFO / API_INFO_V2)
                if (data.id && data.beatmaps) {
                    const difficulties = data.beatmaps.map(b => ({
                        bid: b.id,
                        mode: b.mode_int,
                        star: b.difficulty_rating,
                        version: b.version,
                        creator: data.creator,
                        length: b.total_length,
                        BPM: b.bpm
                    }));

                    const setMetadata = {
                        sid: data.id,
                        title: data.title,
                        artist: data.artist,
                        creator: data.creator,
                        approved: data.ranked
                    };
                    
                    // Return hybrid object
                    return {
                        status: 0,
                        data: Object.assign(difficulties, setMetadata)
                    };
                }
                return data;
            };
            return response;
        }

        // 2. Normal fetch for everything else (including downloads)
        return originalFetch.apply(this, args);
    };
})();
//
