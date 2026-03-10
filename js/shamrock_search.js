/********** GLOBAL VARIABLES & CONFIG **********/
var g = { //Global Variables and Config
  big:false,
  bonusS:150,
  bonusW:300,
  debug:false, //Debug testing Var (flags some console.outs)
  dec:0,
  difficulty:1, //Medium is Default
  dom:{}, //Holds DOM elements for easy/repeated access
  domIDs:[ //IDs of elements to cache in g.dom
    'd','grid','high'
    ,'muteoff','muteon','numL','numS','points'
    ,'records','record0','record1','record2','record3','restart'
    ,'status0','status1','textDiff','timer'
    ,'view0','view1','view2','view3'
  ],
  gameOver:false,
  modes:['Easy','Medium','Hard','Insane'],
  muted:0, //Flags if we should play sounds or not
  numL:-2,
  numS:1,
  numViews:4, //#view1, #view2, #view3, & #view4
  points:1000, //Current number of points (decrements over time)
  qs:new Array(), //Holds the Game Grid Data of Shamrocks/Leprechauns
  rowClass:null, //skews things big/small with .rowXL/.rowXS
  scalarL:4,
  scalarS:3,
  scores:[0,0,0,0], //Keep in lock-step with localStorage, after init()
  secs:0,
  storageID:'shamrock_search_scores',
  timer:null
};



/********** FUNCTIONS **********/

/** Ensure localStorage & DOM setup **/
function init() {
  initDomCache();
  initLocalStorage();
  detectSize();
}

/** Caches all of g.domIDs in g.dom for easy reuse **/
function initDomCache() {
  for (let id of g.domIDs) {
    let e = document.getElementById(id);
    if (null == e) {
      console.log("WARNING: No such element: " + id);
    } else {
      g.dom[id] = e;
    }
  }
}

/** Ensure localStorage has entries for score1,score2,score3,score4 **/
function initLocalStorage() {
  let x = localStorage.getItem(g.storageID);
  if (null == x)
    localStorage.setItem(g.storageID, g.scores.join(','));
  g.scores = localStorage.getItem(g.storageID).split(',');
}


/** As the Game Timer ticks down, do these things **/
function asTimeGoesBy() {
  g.secs++;
  let s = g.secs;
  let m = Math.floor(s/60);
  s %= 60;
  if (s < 10)
    s = "0"+s;

  g.points -= g.dec; //lose points each second
  if (g.points < 0)
    g.points = 0; //don't go negative

  g.dom.timer.innerHTML = m+':'+s;
  g.dom.points.innerHTML = g.points;
}


/** Toggles Difficulty button, but could be used for other buttons too **/
function bToggle(btn) {
  if ('d' == btn.id) {
    g.difficulty++
    g.difficulty %= g.modes.length; //wrap around to 0
    btn.innerHTML = g.modes[g.difficulty];
  }
}


/** After setupGrid() calculate the values adjacent to the Shamrocks/Leprechauns **/
function calculateGrid(){
  for (let i=0; i<g.qs.length; ++i) {
    if (g.qs[i] == 'L') {
      let is = calculateGridGetSurrounding(i);
      calculateGridChangeIndexes(is, -1);
    } else if (g.qs[i] == 'S') {
      let is = calculateGridGetSurrounding(i);
      calculateGridChangeIndexes(is, 1);
    }
  }
}
/** Helper function for calculateGrid **/
function calculateGridChangeIndexes(is, offset) {
  for (let i = 0; i < is.length; ++i) {
    let j = is[i];
    if (g.qs[j] == '') {
      g.qs[j] = offset; //0 isn't the same as '' (0 means it touches at least 1 L & 1 S)
    } else if (g.qs[j] != 'L' && g.qs[j] != 'S') {
      g.qs[j] += offset;
    }
  }
}
/** Helper function for calculateGrid **/
function calculateGridGetSurrounding(i){
  let len = 8; //length for a row
  let mod = i % len;
  let is = new Array();
  let rtn = new Array();
  is[is.length] = i - 0 + len;
  is[is.length] = i - len;
  if (mod == 0) { //Flush on left
    is[is.length] = i - 0 + 1;
    is[is.length] = i - 0 + len + 1;
    is[is.length] = i - len + 1;
  } else if (mod == len - 1) { //Flush on right
    is[is.length] = i - 1;
    is[is.length] = i - 0 + len - 1;
    is[is.length] = i - len - 1;
  } else {
    is[is.length] = i - 0 + 1;
    is[is.length] = i - 1;
    is[is.length] = i - 0 + len + 1;
    is[is.length] = i - 0 + len - 1;
    is[is.length] = i - len + 1;
    is[is.length] = i - len - 1;
  }

  for (let i = 0; i < is.length; ++i) {
    let j = is[i];
    if (j >= 0 && j < g.qs.length) {
      rtn[rtn.length] = j;
    } else {
      ;//console.log("SKIP: "+j);
    }
  }
  //console.log(rtn.join(','));
  return rtn;
}


/** Determine window size so we can scale up if we need **/
function detectSize() {
  let temph = document.body.clientHeight; //don't use... we let it flow off screen in instruc.html
  let tempw = document.body.clientWidth;
  if (tempw > 700) { //a larger device
    g.big = true;
    console.log('LARGE DISPLAY');
    document.body.style.fontSize = "230%";
    enlargeSize();
  }
  return g.big;
}


/** Home Button at any point (even in middle of game) **/
function doHome() {
  if (g.gameOver || confirm("Are you sure you want to abandon your game?")) {
    clearInterval(g.timer);
    document.getElementById('grid').innerHTML = '';
    view(0);
  }
}


/** Setup a fresh Game Grid **/
function doSetup() {
  g.dom.restart.classList.add('opacity0');
  g.dom.status1.classList.add('invisible');
  g.dom.status0.classList.remove('invisible');

  if (g.big)
    g.rowClass = 'rowXL';
  else
    g.rowClass = 'rowXS';
  g.gameOver = false;
  g.bonusS = 150;
  g.bonusW = 300;
  g.dec = 0;
  g.numL = -2;
  g.numS = 1;
  g.scalarL = 4;
  g.scalarS = 3;
  g.points = 1000;
  g.secs = 0;
  g.qs = new Array();

  // Display the High Score    
  g.dom.high.innerHTML = g.scores[g.difficulty];
  g.dom.textDiff.innerHTML = g.modes[g.difficulty];

  // Scale Points Based on Difficulty
  let d1 = g.difficulty + 1; //1-based for scalar math
  g.scalarL *= d1; //help put more things in the grid
  g.scalarS *= d1; //help put more things in the grid
  g.numL += g.scalarL;
  g.numS += g.scalarS;
  g.dom.numL.innerHTML = g.numL;
  g.dom.numS.innerHTML = g.numS;

  g.bonusS *= d1; //Shamrocks worth more on harder levels
  g.bonusW *= (d1 * d1); //Winning worth more on harder levels
  g.points *= d1; //start off with more points for harder difficulty
  g.dom.points.innerHTML = g.points;

  setupGrid();
  showClues();

  g.dec = 12 / d1; //harder = less decrement
  let slow = (400 / d1) - 100; //easier = slightly slower
  g.timer = setInterval("asTimeGoesBy();", 1000 + slow);
}


/** Scale up display (if detectSize() said it's a large display) **/
function enlargeSize(parent) {
  if (parent == null)
    parent = document.body;
  let kids = parent.childNodes;
  for (let i=0; i<kids.length; ++i) {
    let k = kids[i];
    if (k.nodeName == 'IMG') {
//      k.className = k.className.replace(/\s*img\w/, ''); //get rid of width restrictions
      //console.log(k.className);
    } else if (k.nodeName == 'INPUT' || k.nodeName == 'SELECT') {
      k.style.marginTop = '4px';
      if (k.nodeName == 'SELECT') {
        k.style.marginBottom = '18px';
      }
    } else {
      enlargeSize(k);
    }
  }
}


/** Flag Cell as Dangerous by adding a class to color it **/
function flag(div) {
  div.classList.toggle('flagged');
}


/** Ends the Timer & Changes UI for Game Over **/
function gameEnd() {
  clearInterval(g.timer);
  g.gameOver = true; //flag to ignore additional clicks
  g.dom.status0.classList.add('invisible');
  g.dom.status1.classList.remove('invisible');
  g.dom.restart.classList.remove('opacity0');
}


/** Cleans up the Game for a fresh start **/
function gameRestart() {
  if (g.dom.restart.classList.contains('opacity0'))
    return; //Don't allow restart when the icon is invisible
  clearInterval(g.timer);
  doSetup();
}


/** Starts the Game with the current settings **/
function gameStart() {
  view(2);
  doSetup();
}


/** Mutes Audio & changes UI accordingly **/
function muteOn() {
  g.muted = 1;
  g.dom.muteoff.classList.toggle('invisible');
  g.dom.muteon.classList.toggle('invisible');
}
/** Unmutes Audio & changes UI accordingly **/
function muteOff() {
  g.muted = 0;
  g.dom.muteoff.classList.toggle('invisible');
  g.dom.muteon.classList.toggle('invisible');
}


/** Save Score if it's a High Score **/
function recordScore() {
  if (g.points > g.scores[g.difficulty]) {
    g.dom.high.innerHTML = g.points; // Update UI
    g.scores[g.difficulty] = g.points; // Update State
    localStorage.setItem(g.storageID, g.scores.join(',')); // Update Storage
  }
}


/** Reveal a Grid Square, and possible surrounding squares **/
function reveal(div, recursing) {
  if (g.gameOver)
    return; //no clicking after the end
  if (div.classList.contains('flagged'))
    return; //prevent clicking flagged squares

  div.style.backgroundColor = 'rgba(255,255,255,0.85)'; //Change Background color
  let len = div.innerHTML.length;
  div.innerHTML = div.innerHTML.replace(/\binvisible\b/, ''); //Show innerds
  if (len != 0 && len == div.innerHTML.length)
    return; //we revealed this earlier

  if (recursing != null && recursing != false) {
    g.points += (g.dec * 2); //every one you turn over gets you *some* points
    g.dom.points.innerHTML = g.points;
    return; //no points on this one, so just show guts
  }

  if (div.innerHTML == '') {
    let i = div.id.substr(1);
    //console.log('Reveal All Around: '+i);
    let is = calculateGridGetSurrounding(i);
    for (let j=0; j<is.length; ++j) {
      //console.log('...'+is[j]);
      reveal(document.getElementById('g'+is[j]), true); //recurse 1-deep
    }
    g.points += (g.dec * 2); //every one you turn over gets you *some* points
    g.dom.points.innerHTML = g.points;
    return;
  }

  let img = div.innerHTML.replace(/^.*?(\w+)\.svg.*$/, '$1');
  //console.log('IMG: '+img);
  if (img == 'good') {
    g.points += g.bonusS;
    g.dom.points.innerHTML = g.points;
    g.numS--;
    g.dom.numS.innerHTML = g.numS;
    if (g.numS <= 0) { //no more shamrocks
      g.dom.status1.innerHTML = "<h2>You Win!</h2>";
      gameEnd();
      g.points += g.bonusW;
      g.dom.points.innerHTML = g.points;
      wav('music');
      revealAll();
      recordScore();
    } else {
      wav('beep');
    }
  } else if (img == 'bad') {
    g.dom.status1.innerHTML = "<h2>Game Over</h2>";
    gameEnd();
    wav('err');
    revealAll();
    recordScore();
  } else {
    g.points += (g.dec * 2); //every one you turn over gets you *some* points
    g.dom.points.innerHTML = g.points;
  }
}


/** Unhide All Game Grid Elements as game is over **/
function revealAll(){
  g.dom.grid.innerHTML = g.dom.grid.innerHTML.replace(/\binvisible\b/g, '');
}


/** Populates g.qs with the Game Grid Data **/
function setupGrid() {
  for (let i=0; i < 64; ++i)
    g.qs[i] = '';
  let countL = 0;
  let countS = 0;
  let tempI = 0;
  while (countL < g.numL) {
    tempI = Math.round(Math.random() * (g.qs.length - 1));
    while (g.qs[tempI] != '') //ensure no overwrite
      tempI = Math.round(Math.random() * (g.qs.length - 1));
    countL++;
    g.qs[tempI] = 'L'; //flag for a BAD choice
  }
  while (countS < g.numS) {
    tempI = Math.round(Math.random() * (g.qs.length - 1));
    while (g.qs[tempI] != '') //ensure no overwrite
      tempI = Math.round(Math.random() * (g.qs.length - 1));
    countS++;
    g.qs[tempI] = 'S'; //flag for a GOOD choice
  }

  calculateGrid();

  if (g.debug) {
    let tmp = '';
    for (let i=0; i<g.qs.length; ++i) {
      if (i % 8 == 0)
        tmp += "\n";
      let tmp2 = g.qs[i];
      if (tmp2 < 0)
        ; //nothing
      else if (tmp2 === '')
        tmp2 = '  ';
      else
        tmp2 = ' '+tmp2;
      tmp += tmp2 + ' ';
    }
    console.log(tmp);
  }

  let cell = '';
  let out = '';
  let prefix = '';
  let suffix = '';
  for (let i=0; i < g.qs.length; ++i) { //Set hidden innerds
    prefix = '';
    suffix = '';
    if (i % 8 == 0)
      prefix = '<div class="'+g.rowClass+'">';
    else if (i % 8 == 7)
      suffix = '</div>';
    if (g.qs[i] == 'L') {
      cell = '<img src="img2/bad.svg" />';
    } else if (g.qs[i] == 'S') {
      cell = '<img src="img2/good.svg" />';
    } else if (g.qs[i] === '') {
      cell = '';
    } else { //Color the pure Numbers
      let color = '#BCC2AC'; //gray-ish yellow/green
      cell = g.qs[i];
      if (cell < -2)
        color = '#C41D2E'; //red
      else if (cell < 0)
        color = '#FC7482'; //pink
      else if (cell == 0)
        color = '#F7BC5C' //orange
      else if (cell > 3)
        color = '#009E05'; //Green
      else if (cell > 2)
        color = '#56D15A'; //light-green
      else if (cell == 2)
        color = '#7AD1FF'; //light-blue
      cell = '<span style="color:'+color+'">'+cell+'</span>';
    }
    let pre2 = '<div class="invisible">';
    let suf2 = '</div>';
    if (cell === '') {
      pre2 = '';
      suf2 = '';
    }

    out += prefix +'<div id="g'+i+'" onclick="reveal(this);" oncontextmenu="flag(this);return false;" class="cell">'+ pre2 + cell + suf2 +'</div>'+ suffix;
	//TODO: do this all with createElement() not string manipulation
  }
  //console.log("\n"+out);
  g.dom.grid.innerHTML = out;
}


/** Show Clues on the game grid **/
function showClues() {
  if (g.difficulty > 2)
    return; //save time
  let num2show = 0;
  let count = 0;
  let is = new Array();
  is[is.length] = 'g27';
  is[is.length] = 'g36';
  is[is.length] = 'g28';
  is[is.length] = 'g35';

  if (g.difficulty == 1) {
    num2show = 4;
  } else if (g.difficulty == 2) {
    num2show = 2;
  }

  for (let i=0; i < is.length && count < num2show; ++i) {
    let e = document.getElementById(is[i]);
    if (!e.innerHTML.match(/\.svg/)) {
      reveal(e, true);
      count++;
    }
  }
}


/** Show all the highest scores in the UI (from g.scores) **/
function showRecords() {
  for (let i=0; i<g.scores.length; ++i)
    g.dom['record'+i].innerHTML = g.scores[i];
  view(3);
}


/** Hide all cards except num (IDs: #view0 - #view3) **/
function view(num){
  for (let i=0; i<g.numViews; ++i) {
    let id = 'view' + i;
    if (i == num)
      g.dom[id].classList.remove('invisible');
    else
      g.dom[id].classList.add('invisible');
  }
}


/** Plays WAV files we have embedded with <audio id="wav_something"> **/
function wav(suffix) {
  if (g.muted)
    return;
  let w = document.getElementById('wav_'+suffix);
  if (null == w)
    console.log("ERROR: Missing Audio wav_" + suffix);
  else
    w.play();
}
