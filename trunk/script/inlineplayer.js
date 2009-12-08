/*

  SoundManager 2 Demo: Play MP3 links "in-place"
  ----------------------------------------------

  http://schillmania.com/projects/soundmanager2/

  A simple demo making MP3s playable "inline"
  and easily styled/customizable via CSS.

  Requires SoundManager 2 Javascript API.

*/

var vis_text = null;
var eWaves = null;
var lineL = null;
var lineR = null;


function InlinePlayer() {
  var self = this;
  var pl = this;
  var sm = soundManager; // soundManager instance
  this.excludeClass = 'inline-exclude'; // CSS class for ignoring MP3 links
  this.links = [];
  this.sounds = [];
  this.soundsByURL = [];
  this.indexByURL = [];
  this.lastSound = null;
  this.soundCount = 0;
  
  var isIE = (navigator.userAgent.match(/msie/i));

  this.config = {
    playNext: false, // stop after one sound, or play through list until end
	autoPlay: false  // start playing the first sound right away
  };

  this.css = {
    // CSS class names appended to link during various states
    sDefault: 'sm2_link', // default state
    sLoading: 'sm2_loading',
    sPlaying: 'sm2_playing',
    sPaused: 'sm2_paused'
  };

  this.addEventHandler = function(o,evtName,evtHandler) {
    var X = typeof(attachEvent)=='undefined'?o.addEventListener(evtName,evtHandler,false):o.attachEvent('on'+evtName,evtHandler);
  };

  this.removeEventHandler = function(o,evtName,evtHandler) {
    var X = typeof(attachEvent)=='undefined'?o.removeEventListener(evtName,evtHandler,false):o.detachEvent('on'+evtName,evtHandler);
  };

  this.classContains = function(o,cStr) {
	return (typeof(o.className)!='undefined'?o.className.match(new RegExp('(\\s|^)'+cStr+'(\\s|$)')):false);
  };

  this.addClass = function(o,cStr) {
  	  if (!o || !cStr || self.classContains(o,cStr)) {return false;}
    o.className = (o.className?o.className+' ':'')+cStr;
  };

  this.removeClass = function(o,cStr) {
  	  if (!o || !cStr || !self.classContains(o,cStr)) {return false;}
    o.className = o.className.replace(new RegExp('( '+cStr+')|('+cStr+')','g'),'');
  };

  this.getSoundByURL = function(sURL) {
    return (typeof self.soundsByURL[sURL] != 'undefined'?self.soundsByURL[sURL]:null);
  };

  this.isChildOfNode = function(o,sNodeName) {
    if (!o || !o.parentNode) {
      return false;
    }
    sNodeName = sNodeName.toLowerCase();
    do {
      o = o.parentNode;
    } while (o && o.parentNode && o.nodeName.toLowerCase() != sNodeName);
    return (o.nodeName.toLowerCase() == sNodeName?o:null);
  };

  this.events = {

    // handlers for sound events as they're started/stopped/played

    play: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLink,this._data.className);
    },

    stop: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = '';
    },

    pause: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPaused;
      pl.addClass(this._data.oLink,this._data.className);
    },

    resume: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = pl.css.sPlaying;
      pl.addClass(this._data.oLink,this._data.className);      
    },

    finish: function() {
      pl.removeClass(this._data.oLink,this._data.className);
      this._data.className = '';
      if (pl.config.playNext) {
        var nextLink = (pl.indexByURL[this._data.oLink.href]+1);
        if (nextLink<pl.links.length) {
          pl.handleClick({'target':pl.links[nextLink]});
        }
      }
    },
    
    onid3:function(){
			vis_text.set('html', this.id3.TALB);
			//console.log(this.id3);
		},
	whileplaying:function() {
		//console.log("this =", this);
		//vis_text.setStyle('opacity', this.peakData.left);
		/*
		var sNewWaveL = 'L ';
		var sNewWaveR = 'L ';
		for (var i=0; i<256; i++) {
			iOpacity = (this.waveformData.left[i] * 0.5)+ 0.5;
			vis_text.setStyle('opacity', iOpacity);
			sNewWaveL = sNewWaveL+i+','+Math.round((this.waveformData.left[i]*124)+124)+' ';
			sNewWaveR = sNewWaveR+i+','+Math.round((this.waveformData.right[i]*124)+124)+' ';
			
		}
		var myLine = new Element('path', {'d':sNewWaveR,'stroke':'red','stroke-width':2});
		*/
		//"120 30, 25 150, 290 150"
		
		
		var sNewWaveL = '';
		
		var sNewWaveR = '';
		for (var i=0; i<256; i++) {
			//iOpacity = (this.waveformData.left[i] * 0.5)+ 0.5;
			//console.log("this.waveformData.left =", this.waveformData.left);
			sNewWaveL = sNewWaveL+i+' '+Math.round((this.waveformData.left[i]*124)+124)+', ';
			sNewWaveR = sNewWaveR+i+','+Math.round((this.waveformData.right[i]*124)+124)+' ,';
			
		}
		//var oOptions = {'stroke-width':'4', 'style':'fill: none;', 'stroke':'purple', 'points':sNewWaveL};
		//var myLine = new Element('polyline', oOptions);
		
		//console.log("sNewWaveL =", sNewWaveL);
		lineL.set('points', sNewWaveL);
		lineR.set('points', sNewWaveR);
		lineL.setStyle('opacity', this.peakData.left);
		lineR.setStyle('opacity', this.peakData.right);
		
		//myLine.inject(eWaves);
		//console.log("eWaves =", eWaves);
	}
  };

  this.stopEvent = function(e) {
   if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
      e.preventDefault();
    } else if (typeof event != 'undefined' && typeof event.returnValue != 'undefined') {
      event.returnValue = false;
    }
    return false;
  };

  this.getTheDamnLink = (isIE)?function(e) {
    // I really didn't want to have to do this.
    return (e && e.target?e.target:window.event.srcElement);
  }:function(e) {
    return e.target;
  };

  this.handleClick = function(e) {
    // a sound link was clicked
    if (typeof e.button != 'undefined' && e.button>1) {
	  // ignore right-click
	  return true;
    }
    var o = self.getTheDamnLink(e);
    if (o.nodeName.toLowerCase() != 'a') {
      o = self.isChildOfNode(o,'a');
      if (!o) {return true;}
    }
    var sURL = o.getAttribute('href');
    if (!o.href || !o.href.match(/\.mp3(\\?.*)$/i) || self.classContains(o,self.excludeClass)) {
      if (isIE && o.onclick) {
        return false; // IE will run this handler before .onclick(), everyone else is cool?
      }
      return true; // pass-thru for non-MP3/non-links
    }
    sm._writeDebug('handleClick()');
    var soundURL = (o.href);
    var thisSound = self.getSoundByURL(soundURL);
    if (thisSound) {
      // already exists
      if (thisSound == self.lastSound) {
        // and was playing (or paused)
        thisSound.togglePause();
      } else {
        // different sound
        thisSound.togglePause(); // start playing current
        sm._writeDebug('sound different than last sound: '+self.lastSound.sID);
        if (self.lastSound) {self.stopSound(self.lastSound);}
      }
    } else {
      // create sound
      thisSound = sm.createSound({
       id:'inlineMP3Sound'+(self.soundCount++),
       usePeakData: true,     // [Flash 9 only] whether or not to show peak data (left/right channel values) - nor noticable on CPU
       useWaveformData: true, // [Flash 9 only] show raw waveform data - WARNING: LIKELY VERY CPU-HEAVY
       //useEQData: true,      // [Flash 9 only] show EQ (frequency spectrum) data
       useFavIcon: false,      // try to apply peakData to address bar (Firefox + Opera) - performance note: appears to make Firefox 3 do some temporary, heavy disk access/swapping/garbage collection at first(?)
       useMovieStar: false,     // Flash 9.0r115+ only: Support for a subset of MPEG4 formats.*/
       url:soundURL,
       onplay:self.events.play,
       onstop:self.events.stop,
       onpause:self.events.pause,
       onresume:self.events.resume,
       onfinish:self.events.finish,
       onid3:self.events.onid3,
       whileplaying:self.events.whileplaying
      });
      // tack on some custom data
      thisSound._data = {
        oLink: o, // DOM node for reference within SM2 object event handlers
        className: self.css.sPlaying
      };
      self.soundsByURL[soundURL] = thisSound;
      self.sounds.push(thisSound);
      if (self.lastSound) {self.stopSound(self.lastSound);}
      thisSound.play();
      // stop last sound
    }

    self.lastSound = thisSound; // reference for next call

    if (typeof e != 'undefined' && typeof e.preventDefault != 'undefined') {
      e.preventDefault();
    } else {
      event.returnValue = false;
    }
    return false;
  };

  this.stopSound = function(oSound) {
    soundManager.stop(oSound.sID);
    soundManager.unload(oSound.sID);
  };

  this.init = function() {
    sm._writeDebug('inlinePlayer.init()');
    var oLinks = document.getElementsByTagName('a');
    // grab all links, look for .mp3
    var foundItems = 0;
    for (var i=0; i<oLinks.length; i++) {
      if (oLinks[i].href.match(/\.mp3/i) && !self.classContains(oLinks[i],self.excludeClass)) {
        self.addClass(oLinks[i],self.css.sDefault); // add default CSS decoration
        self.links[foundItems] = (oLinks[i]);
        self.indexByURL[oLinks[i].href] = foundItems; // hack for indexing
        foundItems++;
      }
    }
    if (foundItems>0) {
      self.addEventHandler(document,'click',self.handleClick);
	  if (self.config.autoPlay) {
	    self.handleClick({target:self.links[0],preventDefault:function(){}});
	  }
    }
    sm._writeDebug('inlinePlayer.init(): Found '+foundItems+' relevant items.');
  };

  this.init();

}

var inlinePlayer = null;
  soundManager.useConsole = true;
  soundManager.consoleOnly = true;   // if console is being used, do not create/write to #soundmanager-debug
  soundManager.debugMode = true;
  soundManager.useFastPolling = false;
  soundManager.flashVersion=9;       // version of Flash to tell SoundManager to use - either 8 or 9. Flash 9 required for peak / spectrum data.
  //soundManager.usePeakData=true;     // [Flash 9 only] whether or not to show peak data (left/right channel values) - nor noticable on CPU
  //soundManager.useWaveformData= true; // [Flash 9 only] show raw waveform data - WARNING: LIKELY VERY CPU-HEAVY
  //soundManager.useEQData=true;      // [Flash 9 only] show EQ (frequency spectrum) data
  soundManager.allowPolling = true;
  soundManager.useHighPerformance = true;
  
  soundManager.url = 'swf/'; // path to directory containing SM2 SWF

soundManager.onready(function(oStatus) {
  if (soundManager.supported()) {
    // soundManager.createSound() etc. may now be called
    inlinePlayer = new InlinePlayer();
    if (oStatus.success) {
		vis_text = $('vis_text');
		//console.log("vis_text =", vis_text);
		eWaves = $('waves');
		lineL = $('lineL');
		lineR = $('lineR');
    }
  }
});

