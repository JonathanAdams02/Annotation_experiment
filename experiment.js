// Generate random 4-digit subject ID
const subjectId = Math.floor(1000 + Math.random() * 9000);

// Load video list from JSON file
let videoListData = [];

fetch('video-list.json')
    .then(response => response.json())
    .then(data => {
        videoListData = data;
        initializeExperiment();
    })
    .catch(error => {
        console.error('Error loading video list:', error);
        alert('Error loading videos. Please refresh the page.');
    });

function initializeExperiment() {
    // Initialize jsPsych
    const jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        on_finish: function() {
            saveData(jsPsych);
        }
    });

    function createTrialPairs(videoList) {
        const pairs = [];
        const originalVideos = videoList.filter(v => 
            !v.filename.includes('Annotated') && 
            !v.folder.includes('Annotated')
        );
        
        originalVideos.forEach(original => {
            // Extract condition, type (Direct/Indirect), and number from filename
            const match = original.filename.match(/(.+)_(Direct|Indirect|Indrect)_(\d+)\.mp4/);
            if (!match) return;
            
            const [, condition, type, number] = match;
            const normalizedType = type === 'Indrect' ? 'Indirect' : type; // Fix typo in some filenames
            
            // Map to annotated folder - just add "_Annotated" to the folder name
            const annotatedFolder = original.folder + '_Annotated';
            
            // Construct annotated filename
            const annotatedFilename = original.filename.replace('.mp4', '_Annotated.mp4');
            
            // Find matching annotated video
            const annotated = videoList.find(v => 
                v.folder === annotatedFolder && 
                v.filename === annotatedFilename
            );
            
            if (annotated) {
                pairs.push({
                    original_url: original.url,
                    annotated_url: annotated.url,
                    condition: condition,
                    type: normalizedType,
                    video_number: number,
                    folder: original.folder
                });
            }
        });
        
        return pairs;
    }

    // Create and shuffle video pairs
    const videoPairs = createTrialPairs(videoListData);
    console.log(`Created ${videoPairs.length} video pairs`);
    const shuffledPairs = jsPsych.randomization.shuffle(videoPairs);

    // Welcome screen
    const welcome = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h1>Welkom bij het Video Annotatie Onderzoek</h1>
            <p>Bedankt voor uw deelname aan deze studie.</p>
            <p>U zult ${videoPairs.length} video's bekijken en beoordelen.</p>
            <p>Uw deelnemer ID is: <strong>${subjectId}</strong></p>
            <p>Klik op "Start" om te beginnen.</p>
        `,
        choices: ['Start']
    };

    // Instructions
    const instructions = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructies</h2>
            <p>Voor elke video zult u het volgende doen:</p>
            <ol>
                <li><strong>Beoordeel de setting</strong> - U ziet een video en beoordeelt de setting (niet de mensen) op intensiteit en valentie</li>
                <li><strong>Beoordeel de persoon</strong> - U ziet dezelfde video met een omcirkelde persoon en beoordeelt deze persoon op intensiteit en valentie</li>
                <li><strong>Kies een emotie</strong> - U kiest één emotie die u associeert met de video als geheel</li>
                <li><strong>Beoordeel directheid</strong> - U beoordeelt of de sociale interactie meer direct of indirect is</li>
            </ol>
            <p><strong>De video's starten automatisch en u kunt ze opnieuw afspelen als u dat wilt.</strong></p>
            <p>Er zijn optionele pauzes na elke 30 video's.</p>
            <p>Klik op "Verder" om te beginnen.</p>
        `,
        choices: ['Verder']
    };

    // Create timeline
    let timeline = [];
    timeline.push(welcome);
    timeline.push(instructions);

    // Add trials
    shuffledPairs.forEach((pair, index) => {
        const trialNum = index + 1;
        
// Helper function to create a fixed "Verder" button
function createVerderButton(onClickText = 'Verder', callback) {
    // Remove any previous button
    const existing = document.getElementById('custom-verder-button');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.id = 'custom-verder-button';
    button.textContent = onClickText;
    button.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 40px;
        z-index: 9999;
        font-size: 20px;
        font-weight: bold;
        padding: 15px 40px;
        border-radius: 8px;
        border: none;
        background-color: #007bff;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        transition: background-color 0.2s;
    `;
    button.addEventListener('mouseenter', () => button.style.backgroundColor = '#0056b3');
    button.addEventListener('mouseleave', () => button.style.backgroundColor = '#007bff');
    button.addEventListener('click', callback);
    document.body.appendChild(button);
}

// ===== PAGE 1: Original video + Setting rating =====
const settingTrial = {
    type: jsPsychHtmlButtonResponse,
    choices: [], // disable default buttons
    stimulus: function() {
        return `
            <div style="display:flex; height:100vh; width:100vw;">
                <!-- Video -->
                <div style="flex:0 0 40%; padding:10px;">
                    <video id="setting-video" controls autoplay style="width:100%; height:100%; object-fit:contain;">
                        <source src="${pair.original_url}" type="video/mp4">
                    </video>
                </div>
                <!-- Controls -->
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                    <p style="font-size:24px; font-weight:bold;">Beoordeel de SETTING van de video, niet de mensen</p>
                    <label>Intensiteit</label>
                    <input type="range" id="intensiteit-slider" min="0" max="100" value="50">
                    <p id="intensiteit-value">Waarde: 50</p>
                    <label>Valentie</label>
                    <input type="range" id="valentie-slider" min="0" max="100" value="50">
                    <p id="valentie-value">Waarde: 50</p>
                </div>
            </div>
        `;
    },
    data: { task: 'setting_rating', trial_number: trialNum, subject_id: subjectId },
    on_load: function() {
        const intens = document.getElementById('intensiteit-slider');
        const val = document.getElementById('valentie-slider');
        const intensVal = document.getElementById('intensiteit-value');
        const valVal = document.getElementById('valentie-value');

        window.currentSettingIntensiteit = 50;
        window.currentSettingValentie = 50;

        intens.addEventListener('input', () => {
            window.currentSettingIntensiteit = parseInt(intens.value);
            intensVal.textContent = 'Waarde: ' + intens.value;
        });
        val.addEventListener('input', () => {
            window.currentSettingValentie = parseInt(val.value);
            valVal.textContent = 'Waarde: ' + val.value;
        });

        createVerderButton('Verder', () => jsPsych.finishTrial({
            setting_intensiteit: window.currentSettingIntensiteit,
            setting_valentie: window.currentSettingValentie
        }));
    }
};

// ===== PAGE 2: Annotated video + Person rating =====
const personTrial = {
    type: jsPsychHtmlButtonResponse,
    choices: [],
    stimulus: function() {
        return `
            <div style="display:flex; height:100vh; width:100vw;">
                <div style="flex:0 0 40%; padding:10px;">
                    <video id="person-video" controls autoplay style="width:100%; height:100%; object-fit:contain;">
                        <source src="${pair.annotated_url}" type="video/mp4">
                    </video>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                    <p style="font-size:24px; font-weight:bold;">Beoordeel de OMCIRKELDE PERSOON</p>
                    <label>Intensiteit</label>
                    <input type="range" id="person-intensiteit-slider" min="0" max="100" value="50">
                    <p id="person-intensiteit-value">Waarde: 50</p>
                    <label>Valentie</label>
                    <input type="range" id="person-valentie-slider" min="0" max="100" value="50">
                    <p id="person-valentie-value">Waarde: 50</p>
                </div>
            </div>
        `;
    },
    data: { task: 'person_rating', trial_number: trialNum, subject_id: subjectId },
    on_load: function() {
        const intens = document.getElementById('person-intensiteit-slider');
        const val = document.getElementById('person-valentie-slider');
        const intensVal = document.getElementById('person-intensiteit-value');
        const valVal = document.getElementById('person-valentie-value');

        window.currentPersonIntensiteit = 50;
        window.currentPersonValentie = 50;

        intens.addEventListener('input', () => {
            window.currentPersonIntensiteit = parseInt(intens.value);
            intensVal.textContent = 'Waarde: ' + intens.value;
        });
        val.addEventListener('input', () => {
            window.currentPersonValentie = parseInt(val.value);
            valVal.textContent = 'Waarde: ' + val.value;
        });

        createVerderButton('Verder', () => jsPsych.finishTrial({
            person_intensiteit: window.currentPersonIntensiteit,
            person_valentie: window.currentPersonValentie
        }));
    }
};

// ===== PAGE 3: Original video + Emotion choice =====
const emotionTrial = {
    type: jsPsychHtmlButtonResponse,
    choices: [],
    stimulus: function() {
        return `
            <div style="display:flex; height:100vh; width:100vw;">
                <div style="flex:0 0 40%; padding:10px;">
                    <video controls autoplay style="width:100%; height:100%; object-fit:contain;">
                        <source src="${pair.original_url}" type="video/mp4">
                    </video>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                    <p style="font-size:24px; font-weight:bold;">Kies één emotie die u associeert met deze video</p>
                    <div id="custom-emotion-buttons" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;"></div>
                </div>
            </div>
        `;
    },
    data: { task: 'emotion_choice', trial_number: trialNum, subject_id: subjectId },
    on_load: function() {
        const container = document.getElementById('custom-emotion-buttons');
        const emotions = ['Optimisme','Liefde','Onderwerping','Ontzag','Afkeuring','Berouw','Minachting','Agressiviteit'];
        window.trialStartTime = performance.now();

        container.innerHTML = '';
        emotions.forEach((emotion, idx) => {
            const btn = document.createElement('button');
            btn.textContent = emotion;
            btn.style.cssText = `
                padding:20px; font-size:20px; font-weight:bold; background-color:#007bff; color:white; border:none; border-radius:8px; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.2);
            `;
            btn.addEventListener('click', () => jsPsych.finishTrial({
                emotion_choice: emotion,
                rt: performance.now() - window.trialStartTime
            }));
            container.appendChild(btn);
        });
    }
};

// ===== PAGE 4: Original video + Directness rating =====
const directnessTrial = {
    type: jsPsychHtmlButtonResponse,
    choices: [],
    stimulus: function() {
        return `
            <div style="display:flex; height:100vh; width:100vw;">
                <div style="flex:0 0 40%; padding:10px;">
                    <video id="directness-video" controls autoplay style="width:100%; height:100%; object-fit:contain;">
                        <source src="${pair.original_url}" type="video/mp4">
                    </video>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                    <p style="font-size:24px; font-weight:bold;">Beoordeel directheid</p>
                    <input type="range" id="directness-slider" min="0" max="100" value="50">
                    <p id="directness-value">Waarde: 50</p>
                </div>
            </div>
        `;
    },
    data: { task: 'directness_rating', trial_number: trialNum, subject_id: subjectId },
    on_load: function() {
        const slider = document.getElementById('directness-slider');
        const value = document.getElementById('directness-value');
        window.currentDirectness = 50;

        slider.addEventListener('input', () => {
            window.currentDirectness = parseInt(slider.value);
            value.textContent = 'Waarde: ' + slider.value;
        });

        createVerderButton('Verder', () => jsPsych.finishTrial({
            directness_rating: window.currentDirectness
        }));
    }
};
        timeline.push(settingTrial);
        timeline.push(personTrial);
        timeline.push(emotionTrial);
        timeline.push(directnessTrial);
        
        // Add optional break every 30 trials
        if (trialNum % 30 === 0 && trialNum < videoPairs.length) {
            const breakScreen = {
                type: jsPsychHtmlButtonResponse,
                stimulus: `
                    <h2>Pauze</h2>
                    <p>U heeft ${trialNum} van de ${videoPairs.length} video's voltooid.</p>
                    <p>Neem een pauze als u dat wilt.</p>
                    <p>Klik op "Doorgaan" wanneer u klaar bent.</p>
                `,
                choices: ['Doorgaan']
            };
            timeline.push(breakScreen);
        }
    });

    // Final screen
    const finalScreen = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Experiment Voltooid!</h2>
            <p>Bedankt voor uw deelname.</p>
            <p>Uw gegevens worden opgeslagen...</p>
        `,
        choices: []
    };
    timeline.push(finalScreen);

    // Run experiment
    jsPsych.run(timeline);
}

// Function to save data
function saveData(jsPsych) {
    const data = jsPsych.data.get();
    const tsvData = convertToTabDelimited(data.values());
    
    // Try to send to Netlify function (for deployed version)
    fetch('/.netlify/functions/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subject_id: subjectId,
            data: tsvData
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Data saved to server successfully');
        alert('Data opgeslagen! Bedankt voor uw deelname.');
    })
    .catch(error => {
        // Fallback: download locally for testing
        console.log('Server save failed, downloading locally');
        downloadData(tsvData, `subj_${subjectId}.txt`);
        alert('Data gedownload naar uw computer. Bedankt voor uw deelname.');
    });
}

// Convert data to tab-delimited format
function convertToTabDelimited(data) {
    const emotions = ['Optimisme', 'Liefde', 'Onderwerping', 'Ontzag', 'Afkeuring', 'Berouw', 'Minachting', 'Agressiviteit'];
    
    // Group by trial
    const trials = {};
    data.forEach(row => {
        if (row.task) {
            const trialNum = row.trial_number;
            if (!trials[trialNum]) {
                trials[trialNum] = {
                    subject_id: row.subject_id,
                    trial_number: row.trial_number,
                    condition: row.condition,
                    direct_indirect: row.type,
                    video_number: row.video_number
                };
            }
            
            if (row.task === 'setting_rating') {
                trials[trialNum].setting_intensiteit = row.setting_intensiteit;
                trials[trialNum].setting_valentie = row.setting_valentie;
                trials[trialNum].setting_rt = row.rt;
            } else if (row.task === 'person_rating') {
                trials[trialNum].person_intensiteit = row.person_intensiteit;
                trials[trialNum].person_valentie = row.person_valentie;
                trials[trialNum].person_rt = row.rt;
            } else if (row.task === 'emotion_choice') {
                trials[trialNum].emotion_choice = emotions[row.response];
                trials[trialNum].emotion_rt = row.rt;
            } else if (row.task === 'directness_rating') {
                trials[trialNum].directness_rating = row.directness_rating;
                trials[trialNum].directness_rt = row.rt;
            }
        }
    });
    
    // Convert to tab-delimited string
    const headers = [
        'subject_id',
        'trial_number',
        'condition',
        'direct_indirect',
        'video_number',
        'setting_intensiteit',
        'setting_valentie',
        'setting_rt',
        'person_intensiteit',
        'person_valentie',
        'person_rt',
        'emotion_choice',
        'emotion_rt',
        'directness_rating',
        'directness_rt'
    ];
    
    let output = headers.join('\t') + '\n';
    
    Object.keys(trials).sort((a, b) => a - b).forEach(trialNum => {
        const trial = trials[trialNum];
        const row = headers.map(h => trial[h] !== undefined ? trial[h] : '').join('\t');
        output += row + '\n';
    });
    
    return output;
}

// Download data locally
function downloadData(data, filename) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}