/*jslint indent:2, browser:true, onevar:false */
/*global $, window, YouTube, safeLogger */

// ===============================
// CONTROLS

var Controls = (function () {

  var PLAYBACK_INTERVAL_IN_MS = 50;

  var bufferIndicator,
      positionIndicator,
      handleTimePoint,
      handleTimeText,
      timeleft,
      manualSeek = false,
      areControlsSetup = false;

  // We track duration and currentTime for indicators separately from
  // YouTube, because we may want to use or update controls before YouTube
  // has loaded, or when Youtube is not advancing.

  var duration,
      currentTime;

  var updateBufferIndicator = function () {
    var byteStatus = YouTube.byteStatus();
    if (!byteStatus.total || byteStatus.total < 0) {
      bufferIndicator.hide();
      return;
    }
    var bufferStart = 1.0 * byteStatus.startingAt / byteStatus.total;
    var bufferEnd = Math.min(1.0,
      1.0 * (byteStatus.startingAt + byteStatus.loaded) / byteStatus.total);
    bufferIndicator.css("left", asPercentage(bufferStart));
    bufferIndicator.css("right", asPercentage(1 - bufferEnd));
    bufferIndicator.show();
  };

  var updatePlaybackIndicators = function () {
    if (!duration) {
      return;
    }
    // text indicating time remaining
    timeleft.text(secToMmss(currentTime));
    // adjust position indicator if we aren't in the midst of a manual drag
    if (!manualSeek) {
      var pos =
      positionIndicator.css({
        left: asPercentage((currentTime || 0.0) / duration)
      });
    }
  };

  var setupHandleTimePoint = function () {
    handleTimePoint = $("#handle-time-point").addClass("tipsy-static").
      html('<div class="tipsy-inner" id="handle-time-text"></div>').
      css("opacity", 0.8);
    handleTimeText = $("#handle-time-text").html("0:00");
    $("#handle").mousedown(function () {
      handleTimePoint.show();
    });
  };
  $(document).ready(setupHandleTimePoint);

  var setHandleTailHeight = function () {
    $(".player #handle-tail").height(24 + $('#samples').height());
  };

  var setupPositionControl = function () {
    if (!duration) {
      return;
    }
    $('.player #gutter').slider({
      value: 0,
      step: 0.01,
      orientation: "horizontal",
      range: false,
      max: duration,
      animate: false,
      slide: function (e, ui) {
        manualSeek = true;
        handleTimePoint.show();
        handleTimeText.html(secToMmss(ui.value));
        Visualizer.setTime(ui.value);
        if (!YouTube.isPlaying()) {
          timeleft.text(secToMmss(ui.value));
        }
      },
      stop: function (e, ui) {
        manualSeek = false;
        handleTimePoint.stop().fadeOut();
        if (YouTube.isPlaying()) {
          currentTime = ui.value;
          YouTube.seekTo(ui.value, true);
        } else {
          currentTime = ui.value;
          YouTube.seekTo(ui.value, true);
          YouTube.pause();
        }
      }
    });
    setHandleTailHeight();
    $(".player #handle-tail").css("opacity", 0.5).show();
  };

  var setupPlayToggle = function () {
    // change play toggle when youtube player state changes
    YouTube.onStateChange.push(function () {
      if (YouTube.isPlaying()) {
        $("#playtoggle").addClass('playing');
      } else {
        $("#playtoggle").removeClass('playing');
      }
    });
    // clicking play toggle changes state of youtube player
    $("#playtoggle").click(function () {
      if (YouTube.isPlaying()) {
        YouTube.pause();
      } else {
        YouTube.play();
      }
    });
  };

  var setupControls = function (suppliedDuration) {

    duration = suppliedDuration;
    currentTime = 0;
//    updateDurationText();

    if (areControlsSetup) {
      $('.player #gutter').slider("option", "max", duration);
      updatePlaybackIndicators();
    } else {
      // stash common elements
      bufferIndicator = $('.player #buffer');
      positionIndicator = $('.player #handle');
      timeleft = $('.player #timeleft');

      setupPlayToggle();
      setupPositionControl();
      updatePlaybackIndicators();

      setInterval(function () {
        updateBufferIndicator();
        if (YouTube.isPlaying()) {
          currentTime = YouTube.currentTime();
          updatePlaybackIndicators();
          Visualizer.setTime(currentTime, true);
        }
      }, PLAYBACK_INTERVAL_IN_MS);
      areControlsSetup = true;
    }

  };

  var getTime = function () {
    return currentTime;
  };

  $(document).ready(function () {
    $(window).resize(setHandleTailHeight);
  });

  return {
    setup: setupControls,
    getTime: getTime
  };

}());

