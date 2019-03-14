var muted = 0;
var difficulty = 2; //Medium is Default
var bs = 'Easy,Medium,Hard,Insane'.split(',');

function bToggle(btn) {
    if ('d' == btn.id) {
        difficulty %= bs.length; //no "++" because it is one-based
        btn.innerHTML = bs[difficulty];
        ++difficulty; //it is one-based
    }
}

function view(num){
	$('.viewCard').addClass('invisible'); //hide all cards
    $('#view'+num).removeClass('invisible');
    allowScroll = false; //TODO: deal with this in CSS???
    if (num == 2)
        allowScroll = true;
}

function startGame() {
    console.log('func startGame');
    view(3);
    doSetup();
}

function muteOn() {
    muted = 1;
    $('.muteBtn').toggleClass('invisible');
}
function muteOff() {
    muted = 0;
    $('.muteBtn').toggleClass('invisible');
}

function showRecords() {
    console.log('func showRecords');
    var db = window.openDatabase("Database", "1.0", "Shamrock", 200000);
    db.transaction(getRecords, dbError);
}
function getRecords(tx) {
    console.log('func getRecords');
    tx.executeSql('SELECT d,x FROM SCORE', [], getRecords2, dbError);
}
function getRecords2(tx, q) {
    console.log('func getRecords2');
    for (var i=0; i < q.rows.length; ++i) {
        var d = q.rows.item(i).d;
        console.log('...record'+d+' = '+q.rows.item(i).x);
        document.getElementById('record'+d).innerHTML = q.rows.item(i).x;
    }
    view(4);
}


function ensureSchema() {
    console.log('func ensureSchema');
    var db = window.openDatabase("Database", "1.0", "Shamrock", 200000);
    db.transaction(ensureSchema2, dbError);
}
function ensureSchema2(tx) {
    //tx.executeSql('DROP TABLE IF EXISTS SCORE');
    tx.executeSql('CREATE TABLE IF NOT EXISTS SCORE (d INTEGER, x INTEGER)');
}
