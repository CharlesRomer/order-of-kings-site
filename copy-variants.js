(function () {
  'use strict';

  function applyVariantA() {

    // 1. Hero eyebrow — remove revenue range
    var eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow) {
      eyebrow.innerHTML =
        '<span class="eyebrow-pip"></span>' +
        'For Christian Entrepreneurs Who Have Built Something Real — And It Still Isn’t Enough';
    }

    // 2. Confession — add isolation paragraphs after scripture quote
    var confScripture = document.querySelector('.confession blockquote.scripture');
    if (confScripture) {
      confScripture.insertAdjacentHTML('afterend',
        '<div class="prose-block">' +
          '<p>And here is the part almost no one says out loud: there is nobody in your world who can hear that sentence and actually understand it.</p>' +
          '<p>Your church doesn’t speak the language of P&Ls and payroll runs. Your business friends don’t speak the language of surrender and calling. You can talk numbers with one room and faith with another — but you have never once been in a room where you didn’t have to translate yourself.</p>' +
          '<p>So you carry it alone. Not because you’re antisocial. Because there’s nowhere to put it down.</p>' +
        '</div>'
      );
    }

    // 3. Diagnosis — add "giving" cost item
    var costList = document.querySelector('.cost-list');
    if (costList) {
      costList.insertAdjacentHTML('beforeend',
        '<li class="cost-item">' +
          '<span class="cost-pip"></span>' +
          '<div><strong>Your capacity to give</strong> — the ministry you used to fund without thinking twice, now the first thing that gets cut when the month is tight</div>' +
        '</li>'
      );
    }

    // 4. Shift — insert "not an information problem" paragraph before outcomes
    var outcomes = document.querySelector('.shift .outcomes');
    if (outcomes) {
      outcomes.insertAdjacentHTML('beforebegin',
        '<p class="sec-intro">This is not information you’re missing. You already know what to do — most of the men in this room did, before they ever spoke to us. What they didn’t have was the structure to actually carry it out, and someone with the standing to say the hard thing their team, their pastor, and even their wife couldn’t say to them directly.</p>'
      );
    }

    // 5. Shift — insert outcome IV (giving) before old IV; renumber old IV to V
    var outcomeItems = document.querySelectorAll('.shift .outcome-item');
    if (outcomeItems.length >= 4) {
      var oldIV = outcomeItems[3];
      var oldNum = oldIV.querySelector('.out-num');
      if (oldNum) oldNum.textContent = 'V';
      oldIV.insertAdjacentHTML('beforebegin',
        '<div class="outcome-item">' +
          '<div class="out-num">IV</div>' +
          '<div class="out-body">' +
            '<strong>Your Capacity to Give Multiplies</strong>' +
            '<p>Money was never the goal — obedience was. When the structure is right, provision stops being something you white-knuckle and starts being something you steward. The giving that got cut comes back first.</p>' +
          '</div>' +
        '</div>'
      );
    }

    // 6. Offer — inject knowledge-problem paragraph after first .offer-body
    var firstOfferBody = document.querySelector('.offer .offer-body');
    if (firstOfferBody) {
      firstOfferBody.insertAdjacentHTML('afterend',
        '<p class="offer-body">You don’t have a knowledge problem. You have a structure problem — and information has never fixed that for anyone.</p>'
      );
    }

    // 7. Offer — reorder deliverables (Dan 1-on-1 moves to #01)
    var delivs = document.querySelector('.delivs');
    if (delivs) {
      delivs.innerHTML =
        '<div class="deliv"><span class="deliv-n">01</span><div class="deliv-text">' +
          '<strong>Monthly 1-on-1 With Dan Romer</strong>' +
          '<p>Six private, 60-minute sessions where Dan looks directly into the structural and spiritual fractures of your life and business. These are not coaching calls. These are surgical interventions. He will say what your employees won’t. What your pastor can’t. And what your wife has been trying to tell you for years.</p>' +
          '<p>This is not a team of coaches with Dan’s name on the door. It’s Dan.</p>' +
        '</div></div>' +
        '<div class="deliv"><span class="deliv-n">02</span><div class="deliv-text">' +
          '<strong>The Weekly King’s Council</strong>' +
          '<p>24 live strategic sessions with a brotherhood of men who understand the weight you carry — because they carry it too. Real problems. Real prayer. Real accountability. No theory. No fluff. No one hiding behind a highlight reel.</p>' +
          '<p>An hour a week. Not a curriculum you fall behind on. Not another platform demanding your time — a room that’s already waiting when you show up.</p>' +
        '</div></div>' +
        '<div class="deliv"><span class="deliv-n">03</span><div class="deliv-text">' +
          '<strong>The King’s License</strong>' +
          '<p>The complete blueprint — time, life, spiritual rhythm, and business architecture — that shifts you from operator to owner, from grinder to governor. The exact operating system required to lead a Kingdom enterprise without sacrificing your family, your health, or your walk with God.</p>' +
        '</div></div>' +
        '<div class="deliv"><span class="deliv-n">04</span><div class="deliv-text">' +
          '<strong>The In-Person Mastermind</strong>' +
          '<p>One exclusive, high-level physical gathering. Access Dan, his personal network of Kingdom investors, and his sons — who run their own highly successful operations. Some doors only open when you’re in the room.</p>' +
        '</div></div>' +
        '<div class="deliv"><span class="deliv-n">05</span><div class="deliv-text">' +
          '<strong>The Private King’s Channel</strong>' +
          '<p>Direct, daily access to the brotherhood. The real-time accountability, encouragement, and iron-sharpening-iron that ensures your transformation doesn’t die the moment the call ends.</p>' +
          '<blockquote class="outcome-scripture">“As iron sharpens iron, so one man sharpens another.” — Proverbs 27:17</blockquote>' +
        '</div></div>';
    }

    // 8. Insert "Who's In The Room" section before the standard section
    var standardSection = document.getElementById('standard');
    if (standardSection) {
      standardSection.insertAdjacentHTML('beforebegin',
        '<section class="section-block whos-in-room" id="whos-in-room">' +
          '<div class="inner">' +
            '<h2 class="sec-headline">Who’s Actually <em>In The Room</em></h2>' +
            '<p class="sec-intro">This isn’t a room of one kind of man.</p>' +
            '<p class="standard-body">Members range from their mid-20s to their 60s. Their businesses run from under $1M to well over $200M in revenue — construction, real estate, agriculture, manufacturing, energy, industrial supply, professional services. They live across five countries and three continents.</p>' +
            '<p class="standard-body">What they share isn’t an age bracket or a tax bracket. It’s this: a real, physical business that outgrew the way they were running it, and no one else in their life who understands both what they’ve built and what they believe.</p>' +
            '<p class="standard-body">A real person — not a filter, not a form — reads every application. Dan reviews them himself. Most are not accepted.</p>' +
          '</div>' +
        '</section>'
      );
    }

    // 9. Standard — remove revenue range from "Built For You If" bullet
    var stdYesItems = document.querySelectorAll('.std-yes li');
    stdYesItems.forEach(function (li) {
      if (li.textContent.indexOf('$200K') !== -1) {
        li.textContent = 'You have built something real, and it is not enough.';
      }
    });
  }

  window.COPY_VARIANTS = {
    'variant-A': applyVariantA
  };

})();
