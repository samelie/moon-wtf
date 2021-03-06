'use strict';

// Vendor dependencies
import Marionette from 'backbone.marionette';
import $ from 'jquery';

import template from './audio.ejs';

import Channel from 'channel';
import Utils from 'utils';

import SythAudio from './synthAudio';
import AudioYoutubeSono from './audioYoutubeSono';
import VjMediaSource from '../vj/vj-mediasource';
import VjUtils from '../vj/vj-utils';
import EchonestService from 'echonestService';
import SpotifyService from 'spotifyService';
import YoutubeService from 'youtubeService';
import ServerService from 'serverService';

const DISNEY_AUDIO_PLAYLIST = "PLR1m37W9Dc9kBc5qKkUOWqkc8rPseKbUL";
const DISNEY_PLAYLIST = "PLdSMQMuTYK4A2e67n5JcmjQQODoRK4S-6";
const DR_DOG_PLAYLIST = "PL60A35E06A9EA1BFB";

// Define
class AudioView extends Marionette.LayoutView {

    template() {
        return template;
    }

    ui() {
        return {
            videoEl: 'audio'
        }
    }

    events() {
        return {}
    }

    regions() {
        return {
            centerRegion: '[data-region="center"]'
        }
    }

    initialize() {
        // auto render
        Channel.on('audio:playlist:set', this.setPlaylist, this);
        Channel.on('mediasource:nextvideo', (id, addVo) => {
            //this._getNext(id, addVo);
        });

        this.beatCounter = 0;
        this._beatIncrePerUpdate = 0;
        this._hasEchoData;
        this._previousContextTime = 0;
    }

    onRender() {

        //this.sythAudio = new SythAudio();
    }

    onShow() {
        this.audioSource = new VjMediaSource(this.ui.videoEl[0]);
        this.audioSono = new AudioYoutubeSono(this.ui.videoEl[0]);

        this.audioSource.endingSignal.add(() => {
            this._getNext();
        });

        this.audioSource.videoStartedSignal.add((currentVo) => {
            if (this._hasEchoData) {
                let _c = this.currentTrack();
                this.currentTempo = _c.echo.audio_summary.tempo;
                this.beatCounter = this.currentTempo;
                //seconds and update time
                Utils.log(`Tempo:${this.currentTempo} - ${_c.q}`);
                this._beatIncrePerUpdate = 60 / this.currentTempo;
                //this._beatIncrePerUpdate = this.currentTempo / (60 * 60);
            }
        });

        //this.boundUpdate = this.update.bind(this);
        //window.requestAnimationFrame(this.boundUpdate);
    }

    setPlaylist(playlist) {
        this.playlistIndex = -1;
        this.playlist = playlist;
        this._getNext();
    }

    _getPlaylistVideos() {

    }

    //*********
    // CALLED FROM APP
    //*********

    update() {

    }

    getAmplitude(callback) {
        if (this.audioSono) {
            return this.audioSono.getAmplitude(callback);
        }
    }

    isBeat() {
        if (this._hasEchoData) {
            let _c = this.audioSono.getContext().currentTime;
            let _diff = _c - this._previousContextTime;
            this.beatCounter += _diff;
            this._previousContextTime = _c;
            if (this.beatCounter > this._beatIncrePerUpdate && this._beatIncrePerUpdate > 0) {
                this.beatCounter = 0;
                return true;
            } else {
                return false;
            }
        } else {
            return this.audioSono.isBeat();
        }
    }

    currentTrack() {
        return this.playlist[this.playlistIndex];
    }

    //**************
    //PRIVATE
    //**************

    _getNext() {
        this.playlistIndex++;
        if (!this.playlist) {
            return;
        }
        //loop
        if (this.playlistIndex > this.playlist.length - 1) {
            this.playlistIndex = 0;
        }
        let _obj = this.playlist[this.playlistIndex];
        var vId = _obj.id;
        return this._getEchonest(_obj.uri)
            .then((echo) => {
                this._hasEchoData = !!echo;
                _obj.echo = echo;
                return ServerService.getSidx(vId, {
                    chooseBest: true,
                    audioonly: true
                }).then((results) => {
                    let vo = VjUtils.createVo(results, {
                        all: true
                    });

                    Channel.trigger('audio:newtrack', _obj);
                    //this.audioSono.analyzeAudio(vo);
                    this.audioSource.addVo(vo);
                }).catch(err => {
                    console.log(err)
                });
            });
    }

    _getEchonest(trackId) {
        return EchonestService.search(trackId);
    }

    onDestroy() {}


};

export default AudioView
