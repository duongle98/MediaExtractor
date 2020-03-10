import MediaExtractor from '../base/base_mediaextractor'
import request from 'async-request';
import {
    parse
} from 'node-html-parser';
import MediaSource from '../../utils/mediasource.js'
import {
    Hydrax
} from '../../stream_services/services.js'
import {
    getProp
} from '../../utils/helper.js'
import MediaMetadata from './api/mediametadata.js'
import {
    simpleGetLinkDriver
} from '../../stream_services/services.js';
import M3U8Generator from '../../m3u8_generator/standard_generator.js';



export class FimFastMediaExtractor extends MediaExtractor {
    constructor(prefix = "FimFast") {
        super(prefix);
    }

    async _extractMedias(aux) {
        //1st layer cache
        let mediaMetadatas = await MediaMetadata.getMediaMetadata({
            "movieName": aux["movieName"],
            "episode": aux["episode"]
        });

        console.log(mediaMetadatas);
        let medias = {
            "direct": [],
            "iframe": []
        }

        if (!mediaMetadatas)
            return [];


        for (let mediaMetadata of mediaMetadatas) {
            if (mediaMetadata.type == "video-sources") {
                let bundle = [];
                for (let m of mediaMetadata.data) {
                    if (m["src"] == "error")
                        continue;

                    if (m["type"] == "hls") {
                        let m3u8Paste = await M3U8Generator.genM3U8({
                            src: m["src"]
                        });
                        if (m3u8Paste) {
                            m = {
                                ...m
                            } // clone
                            m["src"] = m3u8Paste;
                            m["permaLink"] = true;
                        }
                    }
                    bundle.push(MediaSource.createFrom(m))
                }
                medias["direct"].push(bundle); // direct video source
            } else if (mediaMetadata.type == "iframe") {
                let bundle = []
                let iframeSrc = mediaMetadata.data;
                //2nd layer cache
                let streamLinks = await simpleGetLinkDriver({
                    "url": iframeSrc
                });
                if (streamLinks)
                    medias[iframeSrc] = streamLinks;

                medias["iframe"].push([new MediaSource(iframeSrc, "iframe")]);
            }
        }
        return medias;
    }

}

module.exports = new FimFastMediaExtractor();