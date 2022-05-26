const CACHE_NAME = 'ICDNCache';
let cachelist = [];
self.addEventListener('install', async function (installEvent) {
    self.skipWaiting();
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
});
self.addEventListener('fetch', async event => {
    try {
        event.respondWith(handle(event.request))
    } catch (msg) {
        event.respondWith(handleerr(event.request, msg))
    }
});
const handleerr = async (req, msg) => {
    return new Response(`<h1>CDN分流器遇到了致命错误</h1>
    <b>${msg}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
}
let cdn = {
    "gh": {
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/gh"
        },
        jsdelivr_fastly: {
            "url": "https://fastly.jsdelivr.net/gh"
        },
        jsdelivr_gcore: {
            "url": "https://gcore.jsdelivr.net/gh"
        },
        jsdelivr_test1: {
            "url": "https://test1.jsdelivr.net/gh"
        },
        jsdelivr_testingcf: {
            "url": "https://testingcf.jsdelivr.net/gh"
        },
        jsdelivr_doge: {
            "url": "https://dogecdn.42pic.top/gh"
        }
    },
    "combine": {
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/combine"
        },
        jsdelivr_fastly: {
            "url": "https://fastly.jsdelivr.net/combine"
        },
        jsdelivr_gcore: {
            "url": "https://gcore.jsdelivr.net/combine"
        },
        jsdelivr_test1: {
            "url": "https://test1.jsdelivr.net/combine"
        },
        jsdelivr_testingcf: {
            "url": "https://testingcf.jsdelivr.net/combine"
        },
        jsdelivr_doge: {
            "url": "https://dogecdn.42pic.top/combine"
        }
    },
    "npm": {
        unpkg_eleme: {
            "url": "https://npm.elemecdn.com"
        },
        jsdelivr: {
            "url": "https://cdn.jsdelivr.net/npm"
        },
        jsdelivr_fastly: {
            "url": "https://fastly.jsdelivr.net/npm"
        },
        jsdelivr_gcore: {
            "url": "https://gcore.jsdelivr.net/npm"
        },
        jsdelivr_test1: {
            "url": "https://test1.jsdelivr.net/npm"
        },
        jsdelivr_testingcf: {
            "url": "https://testingcf.jsdelivr.net/npm"
        },
        unpkg: {
            "url": "https://unpkg.com"
        },
        unpkg_zhimg: {
            "url": "https://unpkg.zhimg.com"
        },
        jsdelivr_doge: {
            "url": "https://dogecdn.42pic.top/npm"
        },
        unpkg_doge: {
            "url": "https://unpkg.dogecdn.42pic.top"
        }
    },
    "sinaimg": {
        tva1: {
            "url": "https://tva1.sinaimg.cn"
        },
        tva2: {
            "url": "https://tva2.sinaimg.cn"
        },
        tva3: {
            "url": "https://tva3.sinaimg.cn"
        },
        tva4: {
            "url": "https://tva4.sinaimg.cn"
        },
        tvax1: {
            "url": "https://tvax1.sinaimg.cn"
        },
        tvax2: {
            "url": "https://tvax2.sinaimg.cn"
        },
        tvax3: {
            "url": "https://tvax3.sinaimg.cn"
        },
        tvax4: {
            "url": "https://tvax4.sinaimg.cn"
        },
        wx1: {
            "url": "https://wx1.sinaimg.cn"
        },
        wx2: {
            "url": "https://wx2.sinaimg.cn"
        },
        wx3: {
            "url": "https://wx3.sinaimg.cn"
        },
        wx4: {
            "url": "https://wx4.sinaimg.cn"
        }
    }
}
const handle = async function (req) {
    const urlStr = req.url
    const domain = (urlStr.split('/'))[2]
    let urls = []
    for (let i in cdn) {
        for (let j in cdn[i]) {
            if (domain == cdn[i][j].url.split('https://')[1].split('/')[0] && urlStr.match(cdn[i][j].url)) {
                urls = []
                for (let k in cdn[i]) {
                    urls.push(urlStr.replace(cdn[i][j].url, cdn[i][k].url))
                }
                if (urlStr.indexOf('@latest/') > -1) {
                    return lfetch(urls, urlStr)
                } else {
                    return caches.match(req).then(function (resp) {
                        return resp || lfetch(urls, urlStr).then(function (res) {
                            return caches.open(CACHE_NAME).then(function (cache) {
                                cache.put(req, res.clone());
                                return res;
                            });
                        });
                    })
                }
            }
        }
    }
    return fetch(req)
}
const lfetch = async (urls, url) => {
    let controller = new AbortController();
    const PauseProgress = async (res) => {
        return new Response(await (res).arrayBuffer(), { status: res.status, headers: res.headers });
    };
    if (!Promise.any) {
        Promise.any = function (promises) {
            return new Promise((resolve, reject) => {
                promises = Array.isArray(promises) ? promises : []
                let len = promises.length
                let errs = []
                if (len === 0) return reject(new AggregateError('All promises were rejected'))
                promises.forEach((promise) => {
                    promise.then(value => {
                        resolve(value)
                    }, err => {
                        len--
                        errs.push(err)
                        if (len === 0) {
                            reject(new AggregateError(errs))
                        }
                    })
                })
            })
        }
    }
    return Promise.any(urls.map(urls => {
        return new Promise((resolve, reject) => {
            fetch(urls, {
                signal: controller.signal
            })
                .then(PauseProgress)
                .then(res => {
                    if (res.status == 200) {
                        controller.abort();
                        resolve(res)
                    } else {
                        reject(res)
                    }
                })
        })
    }))
}