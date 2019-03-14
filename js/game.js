var testing = false; //Debug testing Var (flags some console.outs)
var rowClass = null;

var hasHighScore = false;
var gameOver = false;
var bonusS = 150;
var bonusW = 300;
var dec = 0;
var timer = null;
var numL = -2;
var numS = 1;
var scalarL = 4;
var scalarS = 3;
var points = 1000;
var secs = 0;
var qs = new Array();

var dS = null;
var dL = null;
var dPoints = null;
var dTimer = null;

function doSetup() {
   $('#restart').addClass('invisible');
   $('#status2').addClass('invisible');
   $('#status1').removeClass('invisible');

   if (big)
      rowClass = 'rowXL';
   else
      rowClass = 'rowXS';
   hasHighScore = false;
   gameOver = false;
   bonusS = 150;
   bonusW = 300;
   dec = 0;
   numL = -2;
   numS = 1;
   scalarL = 4;
   scalarS = 3;
   points = 1000;
   secs = 0;
   qs = new Array();
    

   var db = window.openDatabase("Database", "1.0", "Shamrock", 200000);
   db.transaction(getScore, dbError);
}
function getScore(tx) {
    tx.executeSql('SELECT x FROM SCORE WHERE d='+difficulty, [], dispScore, dbError);
}
function dispScore(tx, q) {
    var e = document.getElementById('high');
    var t = document.getElementById('textDiff');
    if (q.rows.length == 0) { //no high scores yet
        e.innerHTML = 'none';
    } else {
        hasHighScore = true;
        e.innerHTML = q.rows.item(0).x;
    }
    if (difficulty == 1) {
        t.innerHTML = 'Easy';
    } else if (difficulty == 2) {
        t.innerHTML = 'Medium';
    } else if (difficulty == 3) {
        t.innerHTML = 'Hard';
    } else if (difficulty == 4) {
        t.innerHTML = 'Insane';
    }
    continueSetup();
}
function continueSetup() {
    console.log('func doSetup');
    dS = document.getElementById('numS');
    dL = document.getElementById('numL');
    dPoints = document.getElementById('points');
    dTimer = document.getElementById('timer');
    console.log("Difficulty: "+difficulty);

    scalarL *= difficulty; //help put more things in the grid
    scalarS *= difficulty; //help put more things in the grid
    numL += scalarL;
    numS += scalarS;
    dL.innerHTML = numL;
    dS.innerHTML = numS;

    bonusS *= difficulty; //Shamrocks worth more on harder levels
    bonusW *= (difficulty * difficulty); //Winning worth more on harder levels
    points *= difficulty; //start off with more points for harder difficulty
    dPoints.innerHTML = points;

    setupGrid();
    showClues();

    dec = 12 / difficulty; //harder = less decrement
    var slow = (400 / difficulty) - 100; //easier = slightly slower
    timer = setInterval("asTimeGoesBy();", 1000 + slow);
}

function asTimeGoesBy() {
    var s = ++secs;
    var m = Math.floor(s/60);
    s %= 60;
    if (s < 10)
        s = "0"+s;

    points -= dec; //lose points each second
    if (points < 0)
        points = 0; //don't go negative

    dTimer.innerHTML = m+':'+s;
    dPoints.innerHTML = points;
}

function reveal(div, recursing) {
    if (gameOver)
        return; //no clicking after the end
    div.style.backgroundColor = 'rgba(255,255,255,0.85)'; //Change Background color
    var len = div.innerHTML.length;
    div.innerHTML = div.innerHTML.replace(/\binvisible\b/, ''); //Show innerds
    if (len != 0 && len == div.innerHTML.length)
        return; //we revealed this earlier
    //console.log(div.innerHTML);

    if (recursing != null && recursing != false) {
        points += (dec * 2); //every one you turn over gets you *some* points
        dPoints.innerHTML = points;
        return; //no points on this one, so just show guts
    }

    if (div.innerHTML == '') {
        var i = div.id.substr(1);
        console.log('Reveal All Around: '+i);
        var is = getSurrounding(i);
        for (var j=0; j<is.length; ++j) {
            //console.log('...'+is[j]);
            reveal(document.getElementById('g'+is[j]), true); //recurse 1-deep
        }
        points += (dec * 2); //every one you turn over gets you *some* points
        dPoints.innerHTML = points;
        return;
    }

    var status = document.getElementById('status2');
    var img = div.innerHTML.replace(/^.*?(\w+)\.png.*$/, '$1');
    //console.log('IMG: '+img);
    if (img == 'good') {
        points += bonusS;
        dPoints.innerHTML = points;
        --numS;
        dS.innerHTML = numS;
        if (numS <= 0) { //no more shamrocks
            status.innerHTML = "<h2>You Win!</h2>";
            endGame();
            points += bonusW;
            dPoints.innerHTML = points;
            wav('music');
            revealAll();
            recordScore();
        } else {
            wav('beep');
        }
    } else if (img == 'bad') {
        status.innerHTML = "<h2>Game Over</h2>";
        endGame();
        wav('err');
        revealAll();
        recordScore();
    } else {
        points += (dec * 2); //every one you turn over gets you *some* points
        dPoints.innerHTML = points;
    }
}
function revealAll(){
    var content = document.getElementById('grid');
    content.innerHTML = content.innerHTML.replace(/\binvisible\b/g, '');
}

function setupGrid() {
    var content = document.getElementById('grid');
    for (var i=0; i < 64; ++i) {
        qs[i] = '';
    }
    var countL = 0;
    var countS = 0;
    var tempI = 0;
    while (countL < numL) {
        tempI = Math.round(Math.random() * (qs.length - 1));
        while (qs[tempI] != '') //ensure no overwrite
            tempI = Math.round(Math.random() * (qs.length - 1));
        countL++;
        qs[tempI] = 'L'; //flag for a BAD choice
    }
    while (countS < numS) {
        tempI = Math.round(Math.random() * (qs.length - 1));
        while (qs[tempI] != '') //ensure no overwrite
            tempI = Math.round(Math.random() * (qs.length - 1));
        countS++;
        qs[tempI] = 'S'; //flag for a GOOD choice
    }


    calculateGrid();


    if (testing) {
       var tmp = '';
       for (var i=0; i<qs.length; ++i) {
           if (i % 8 == 0)
              tmp += "\n";
           var tmp2 = qs[i];
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

    var cell = '';
    var out = '';
    var prefix = '';
    var suffix = '';
    for (var i=0; i < qs.length; ++i) { //Set hidden innerds
        prefix = '';
        suffix = '';
        if (i % 8 == 0)
            prefix = '<div class="'+rowClass+'">';
        else if (i % 8 == 7)
            suffix = '</div>';
        if (qs[i] == 'L') {
            cell = '<img src="img/bad.png" />';
        } else if (qs[i] == 'S') {
            cell = '<img src="img/good.png" />';
        } else if (qs[i] === '') {
            cell = '';
        } else { //Color the pure Numbers
            var color = '#BCC2AC'; //gray-ish yellow/green
            cell = qs[i];
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
        var pre2 = '<div class="invisible">';
        var suf2 = '</div>';
        if (cell === '') {
            pre2 = '';
            suf2 = '';
        }

        out += prefix +'<div id="g'+i+'" onclick="reveal(this);" class="cell">'+ pre2 + cell + suf2 +'</div>'+ suffix;
    }
    //console.log("\n"+out);
    content.innerHTML = out;
}

function calculateGrid(){
    for (var i=0; i<qs.length; ++i) {
        if (qs[i] == 'L') {
            var is = getSurrounding(i);
            changeIndexes(is, -1);
        } else if (qs[i] == 'S') {
            var is = getSurrounding(i);
            changeIndexes(is, 1);
        }
    }
}
function changeIndexes(is, offset) {
    for (var i = 0; i < is.length; ++i) {
        var j = is[i];
        if (qs[j] == '') {
            qs[j] = offset; //0 isn't the same as '' (0 means it touches at least 1 L & 1 S)
        } else if (qs[j] != 'L' && qs[j] != 'S') {
            qs[j] += offset;
        }
    }
}
function getSurrounding(i){
    var len = 8; //length for a row
    var mod = i % len;
    var is = new Array();
    var rtn = new Array();
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

    for (var i = 0; i < is.length; ++i) {
        var j = is[i];
        if (j >= 0 && j < qs.length) {
            rtn[rtn.length] = j;
        } else {
            ;//console.log("SKIP: "+j);
        }
    }
    //console.log(rtn.join(','));
    return rtn;
}

function showClues() {
    if (difficulty > 2)
        return; //save time
    var num2show = 0;
    var count = 0;
    var is = new Array();
    is[is.length] = 'g27';
    is[is.length] = 'g36';
    is[is.length] = 'g28';
    is[is.length] = 'g35';

    if (difficulty == 1) {
        num2show = 4;
    } else if (difficulty == 2) {
        num2show = 2;
    }

    for (var i=0; i < is.length && count < num2show; ++i) {
        var e = document.getElementById(is[i]);
        if (!e.innerHTML.match(/\.png/)) {
            reveal(e, true);
            count++;
        }
    }
}

function endGame() {
    clearInterval(timer);
    gameOver = true; //flag to ignore additional clicks
    $('#status1').addClass('invisible');
    $('#status2').removeClass('invisible');
    $('#restart').removeClass('invisible');
}
function recordScore() {
    //Update GUI
    var high = document.getElementById('high');
    var hX = high.innerHTML;
    if (hX == 'none')
        hX = 0;
    else
        hX = hX - 0;
    if (points > hX - 0)
        high.innerHTML = points;

    //Update DB
    var db = window.openDatabase("Database", "1.0", "Shamrock", 200000);
    db.transaction(saveScore, dbError);
}
function saveScore(tx) {
    if (hasHighScore)
        tx.executeSql('UPDATE SCORE SET x="'+points+'" WHERE d='+difficulty+' AND x < "'+points+'"');
    else
        tx.executeSql('INSERT INTO SCORE(d,x) VALUES(?,?)', [difficulty, points], null, dbError);
}

/** Plays WAV files we have embedded with <audio id="wav_something"> **/
function wav(suffix) {
	if (muted)
		return;
	var w = document.getElementById('wav_'+suffix);
	if (null == w)
		console.log("ERROR: Missing Audio wav_" + suffix);
	else
		w.play();
}

function doHome() {
    if (gameOver || confirm("Are you sure you want to abandon your game?")) {
        clearInterval(timer);
        document.getElementById('grid').innerHTML = '';
        view(1);
    }
}
function restart() {
    clearInterval(timer);
    doSetup();
}