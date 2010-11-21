/*jslint indent:2, browser:true, onevar:false */
/*global $, window, YouTube, asPercentage */

var Visualizer = (function () {

  var m_samples, m_duration;

// ======================================
// SAMPLE DIV

  var samplesDiv = null;

  var WIDTH_MULTIPLIER = 1;

  var setupSamplesDiv = function () {
    $('.tipsy').remove();
    samplesDiv = $("#samples").width((WIDTH_MULTIPLIER * 100) + "%").empty();
  };

// ======================================
// ASSIGNING STRIPS

  // To lay out the samples, we first assign each sample to a strip that
  // runs across the page.
  // We use a naive algorithm: Loop through the samples in order (sorted
  // by start time). For each sample, put it in the first strip that
  // is available at the sample's start time.

  var totalStrips;

  // Checks if the supplied time is between the start and stop times of
  // of the sample.  optional parameter fudgeFactor expands (if positive)
  // or shrinks (if negative) the sample by fudgeFactor on both ends.
  var isTimeInSample = function (sample, time, fudgeFactor) {
    fudgeFactor = fudgeFactor || 0;
    return (time >= (sample.start - fudgeFactor)) && 
      (time <= (sample.end + fudgeFactor));
  };

  var clearSampleStrips = function () {
    $.each(m_samples, function (index, sample) {
      sample.strip = undefined;
    });
  };

  // This is inefficient, not that it matters.
  var setSampleStrips = function () {
    clearSampleStrips();
    totalStrips = 0;
    $.each(m_samples, function (index, sample) {
      // identify all strips already in use at sample start time
      var stripsInUse = {};
      $.each(m_samples, function (index, sample2) {
        if (sample2.strip !== undefined && sample2.strip !== null &&
          isTimeInSample(sample2, sample.start)) {
          stripsInUse[sample2.strip] = true;
        }
      });
      // find the first strip not in use, and assign it to the sample
      var stripNum = 0;
      while (stripsInUse[stripNum]) {
        stripNum += 1;
      }
      sample.strip = stripNum;
      // update totalStrips if this creates a new strip
      if (stripNum >= totalStrips) {
        totalStrips = stripNum + 1;
      }
    });
  };

// ============================================
// REPRESENTING SAMPLES AS VISUAL BLOCKS

  var VERTICAL_PADDING_PERCENTAGE = 10.0;

  var blockHeight, blockVerticalPadding; // expressed as a %age of div#samples

  var tooltipHTML = function (sample) {
    return sample.artist + "<br />" + sample.title;
  };

  var createSampleBlock = function (sample) {
    return $('<div></div>').
      addClass("sample-block strip-" + (sample.strip % 6)).
      css({
        top: (sample.strip * blockHeight +
               (2 * sample.strip + 1) * blockVerticalPadding) + "%",
        height: blockHeight + "%",
        left: asPercentage(1.0 * sample.start / m_duration),
        right: asPercentage(1 - 1.0 * sample.end / m_duration)
      }).
      tipsy({
        trigger: 'hoverWithOverride',
        tipHover: true,
        gravity: 'c',
        html: true,
        fallback: tooltipHTML(sample)
      });
  };

  var activateBlock = function (block, animate) {
    if (animate) {
      block.tipsy("enableFade");
      block.tipsy("showWithOverride");
      block.stop().animate({opacity: 1});
    } else {
      block.tipsy("disableFade");
      block.tipsy("showWithOverride");
      block.stop().css("opacity", 1);
    }
  };

  var deactivateBlock = function (block, animate) {
    if (animate) {
      block.tipsy("enableFade");
      block.tipsy("hide");
      block.stop().animate({opacity: 0.2});
    } else {
      block.tipsy("disableFade");
      block.stop().css("opacity", 0.2).tipsy("hide");
    }
  };

  var setupSampleBlocks = function () {
    blockVerticalPadding = VERTICAL_PADDING_PERCENTAGE / totalStrips;
    blockHeight = (100.0 - 2 * VERTICAL_PADDING_PERCENTAGE) / totalStrips;
    $.each(m_samples, function (index, sample) {
      sample.block = createSampleBlock(sample);
      deactivateBlock(sample.block);
      $('#samples').append(sample.block);
    });
  };

// ==========================================
// TIME-DEPENDENT EFFECTS

  var updateSampleActivity = function (time, animate) {
    $.each(m_samples, function (index, sample) {
      if (isTimeInSample(sample, time)) {
        if (!sample.block.hasClass("active")) {
          sample.block.addClass("active");
          activateBlock(sample.block, animate);
        }
      } else if (sample.block.hasClass("active")) {
        sample.block.removeClass("active");
        deactivateBlock(sample.block, animate);
      }
    });
  };

  var setTime = function (time, animate) {
    updateSampleActivity(time, animate);
    if (WIDTH_MULTIPLIER !== 1) {
      samplesDiv.css("left",
        -100.0 * (WIDTH_MULTIPLIER - 1) * (time / duration) + "%");
    }
  };

// ===========================================

  var setup = function (samples, trackDuration) {
    $('.tipsy').remove();
    m_duration = trackDuration;
    // make sure samples are sorted by start time
    m_samples = samples.sort(function (a, b) {
      return a.start - b.start;
    });
    setupSamplesDiv();
    setSampleStrips();
    setupSampleBlocks();
  };

  return {
    setup: setup,
    setTime: setTime
  };

}());

