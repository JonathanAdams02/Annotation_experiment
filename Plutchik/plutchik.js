function toggleClicked(e) {
    // Get the SVG document (works for both inline and <object> embedded SVGs)
    const svgDoc = e.ownerDocument;
    const container = svgDoc.getElementById('div_svg') || svgDoc.documentElement;
    
    let els = container.getElementsByClassName('clicked');
    var b_skip = false;
    
    for (var i = 0; i < els.length; i++) {
        if (els[i].id == e.id) {
            b_skip = true;
        }
        els[i].classList.remove('clicked');
    }

    if (!b_skip) {
        e.classList.add('clicked');
    }
}

function displayEmoDesc(event) {
    let callerEmo = event.srcElement ? event.srcElement.id : event.target.id;
    
    // Find the description box in the parent document (not the SVG document)
    const descBox = document.getElementById('div_svg_lt_box');
    
    if (!descBox) {
        console.warn('Description box not found');
        return;
    }
    
    switch (callerEmo) {
        case 'serenity':
        case 'Serenity':
            _setEmoDesc(true, 'Calm, Peaceful', 'Relaxed, open hearted', 'Something is happening that\'s essential, pure, or purposeful', 'Renew energy, make connections, reflect to learn');
            break;
        case 'joy':
        case 'Joy':
            _setEmoDesc(true, 'Excited, Pleased', 'Sense of energy and possibility', 'Life is going well', 'Sparks creativity, connection, gives energy');
            break;
        case 'ecstasy':
        case 'Ecstasy':
            _setEmoDesc(true, 'Delighted, Giddy', 'Abundance of energy', 'This is better than I imagined', 'Strengthens relationship, increases creativity, builds memories');
            break;

        case 'acceptance':
        case 'Acceptance':
            _setEmoDesc(true, 'Open, Welcoming', 'Peaceful', 'We are in this together', 'Create relationships, community');
            break;
        case 'trust':
        case 'Trust':
            _setEmoDesc(true, 'Accepting, Safe', 'Warm', 'This is safe', 'Be open, connect, build alliance');
            break;
        case 'admiration':
        case 'Admiration':
            _setEmoDesc(true, 'Connected, Proud', 'Glowing', 'I want to support the person or thing', 'Strengthen commitment to person or idea');
            break;

        case 'apprehension':
        case 'Apprehension':
            _setEmoDesc(true, 'Worried, Anxious', 'Can\'t relax', 'There could be a problem', 'Seek out potential risks, don\'t ignore problem');
            break;
        case 'fear':
        case 'Fear':
            _setEmoDesc(true, 'Stressed, Scared', 'Agitated', 'Something I care about is at risk', 'Protect what we care about');
            break;
        case 'terror':
        case 'Terror':
            _setEmoDesc(true, 'Alarmed, Petrified', 'Hard to breathe', 'There is big danger', 'Seek safety for self/others');
            break;

        case 'distraction':
        case 'Distraction':
            _setEmoDesc(false, 'Scattered, Uncertain', 'Unfocused', 'I don\'t know what to prioritize', 'Consider what to prioritize');
            break;
        case 'surprise':
        case 'Surprise':
            _setEmoDesc(false, 'Shocked, Unexpected', 'Heart pounding', 'Something new happened', 'Pay attention to what\'s right here');
            break;
        case 'amazement':
        case 'Amazement':
            _setEmoDesc(false, 'Inspired, WOWed', 'Heart stopping', 'Something is totally unexpected', 'Remember this moment');
            break;

        case 'pensiveness':
        case 'Pensiveness':
            _setEmoDesc(false, 'Blue, Unhappy', 'Slow & disconnected', 'Love is distant', 'Remembering people, things that are important');
            break;
        case 'sadness':
        case 'Sadness':
            _setEmoDesc(false, 'Bummed, Loss', 'Heavy', 'Love is going away', 'Focus on what\'s important to us');
            break;
        case 'grief':
        case 'Grief':
            _setEmoDesc(false, 'Heartbroken, Distraught', 'Hard to get up', 'Love is lost', 'To know what we truly want');
            break;

        case 'boredom':
        case 'Boredom':
            _setEmoDesc(false, 'Tired, Uninterested', 'Drained, low energy', 'The potential for this situation isn\'t being met', 'Take a rest, learn something new, refocus on what I can control about situation');
            break;
        case 'disgust':
        case 'Disgust':
            _setEmoDesc(false, 'Distrust, Rejecting', 'Bitter & unwanted', 'Wrong; rules are violated', 'Notice something unsafe or wrong');
            break;
        case 'loathing':
        case 'Loathing':
            _setEmoDesc(false, 'Disturbed, Horrified', 'Bileous & vehement', 'Fundamental values are violated', 'Energize to block something vile');
            break;

        case 'annoyance':
        case 'Annoyance':
            _setEmoDesc(false, 'Frustrated, Prickly', 'Slightly agitated', 'Something is unresolved', 'Notice minor issues');
            break;
        case 'anger':
        case 'Anger':
            _setEmoDesc(false, 'Mad, Fierce', 'Strong and heated', 'Something is in the way', 'Energize to break through a barrier');
            break;
        case 'rage':
        case 'Rage':
            _setEmoDesc(false, 'Overwhelmed, Furious', 'Pounding heart, see red', 'I\'m blocked from something vital', 'Attack an obstacle');
            break;

        case 'interest':
        case 'Interest':
            _setEmoDesc(true, 'Open, Looking', 'Mild sense of curiosity', 'Something useful might come', 'Pay attention, explore');
            break;
        case 'anticipation':
        case 'Anticipation':
            _setEmoDesc(true, 'Curious, Considering', 'Alert and exploring', 'Change is happening', 'Look ahead, look at what might be coming');
            break;
        case 'vigilance':
        case 'Vigilance':
            _setEmoDesc(true, 'Intense, Focused', 'Highly focused', 'Something big is coming', 'Get ready, look carefully, stay alert');
            break;

        default:
            console.log('Unknown emotion:', callerEmo);
    }
    
    // Position at cursor
    const descBox2 = document.getElementById('div_svg_lt_box');
    if (descBox2 && event.clientX && event.clientY) {
        descBox2.style.left = (event.clientX + 10) + 'px';
        descBox2.style.top = (event.clientY + 10) + 'px';
    }
}

function hideEmoDesc() {
    const descBox = document.getElementById('div_svg_lt_box');
    if (descBox) {
        descBox.style.display = 'none';
    }
}

function _setEmoDesc(top_offset, similar, sens, telling, help) {
    const descBox = document.getElementById('div_svg_lt_box');
    
    if (!descBox) return;
    
    const spans = {
        similar: descBox.querySelector('#span_similar_to'),
        sensations: descBox.querySelector('#span_typical_sensations'),
        telling: descBox.querySelector('#span_telling_you'),
        help: descBox.querySelector('#span_help_you')
    };
    
    if (spans.similar) spans.similar.innerText = similar;
    if (spans.sensations) spans.sensations.innerText = sens;
    if (spans.telling) spans.telling.innerText = telling;
    if (spans.help) spans.help.innerText = help;

    descBox.style.display = 'block';
}

// Add global mouse tracking for tooltip
document.addEventListener('mousemove', function(e) {
    const descBox = document.getElementById('div_svg_lt_box');
    if (descBox && descBox.style.display === 'block') {
        // Position 10px to the right and 10px below cursor
        descBox.style.left = (e.pageX + 10) + 'px';
        descBox.style.top = (e.pageY + 10) + 'px';
    }
});