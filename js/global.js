var allowScroll = false;
var big = false;
function potentialResize() {
    var temph = document.body.clientHeight; //don't use... we let it flow off screen in instruc.html
    var tempw = document.body.clientWidth;
    if (tempw > 700) { //a larger device
        big = true;
        console.log('LARGE DISPLAY');
        document.body.style.fontSize = "230%";
        enlargeSize();
    }
    return big;
}

function enlargeSize(parent) {
    if (parent == null)
        parent = document.body;
    var kids = parent.childNodes;
    for (var i=0; i<kids.length; ++i) {
        var k = kids[i];
        if (k.nodeName == 'IMG') {
            k.className = k.className.replace(/\s*img\w/, ''); //get rid of width restrictions
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

function dbError(err) { alert("Error processing SQL: ("+err.code+")\n"+err.message); }

function htmlentities(s) {
    s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    //TODO: escape " or ' ? (maybe a 2nd param to flag quote escaping)
    return s;
}
