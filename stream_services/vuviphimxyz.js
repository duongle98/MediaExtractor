import StreamingService from './base.js';
import request from 'async-request';
import {
    getProp,
    unpackJS
} from '../utils/helper.js';
import MediaSource from '../utils/mediasource.js'


const BASE_URL = "https://vuviphimmoi.com/xem-phim";

class VuViPhimStream extends StreamingService {
    constructor(cacheManager = null) {
        super(cacheManager, "vuviphimxyz");
    }

    async _getProxy() {
        return null;
    }

    async getMediaSource(aux) {
        let url = aux["url"];
        let origin = getProp(aux, "origin", BASE_URL);
        let referer = getProp(aux, "referer", BASE_URL);

        let src = null;
        try {
            let urlResp = await request(url, {
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "User-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
                    "Origin": origin,
                    "Referer": referer,
                    "Accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,vi;q=0.6",
                }
            });
            let sourcesRegex = urlResp.body.match(/(eval\(function\(p,a,c,k,e,d\).*?)\s+?<\/script>/);
            let sources = null;
            if (sourcesRegex.length) {
                sources = sourcesRegex[1];
                sources = unpackJS(sources);
            } else {
                sources = urlResp.body;
            }
            sourcesRegex = sources.match(/sources: *( *?\[.*?\])/);
            if (sourcesRegex.length) {
                sources = sourcesRegex[1].replace(/(?<={|,)([a-zA-Z][a-zA-Z0-9]*)(?=:)'/, "");
                let jsonSources = null;
                eval(`jsonSources = ${sources};`);;
                if (jsonSources.length) {
                    src = []
                    jsonSources.map(m => src.push(new MediaSource(getProp(m, "file"), getProp(m, "type"), getProp(m, "label"))));
                }
            }
        } catch (e) {
            console.log("Error while getting vuviphim.xyz media source");
        }
        return src;
    }
}

module.exports = new VuViPhimStream();