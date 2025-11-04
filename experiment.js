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
            !v.folder.includes('Annotation')
        );

        originalVideos.forEach(original => {
            const match = original.filename.match(/(.+)_(Direct|Indirect|Indrect)_(\d+)\.mp4/);
            if (!match) return;
            const [, condition, type, number] = match;
            const normalizedType = type === 'Indrect' ? 'Indirect' : type;

            const annotatedFolder = original.folder + '_Annotation';
            const annotatedFilename = original.filename.replace('.mp4', '_Annotated.mp4');

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

    const videoPairs = createTrialPairs(videoListData);
    const shuffledPairs = jsPsych.randomization.shuffle(videoPairs);

    // ===== Welcome & Instructions =====
    const welcome = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h1>Welkom bij het video-onderzoek</h1>
            <p>Bedankt voor uw deelname aan deze studie.</p>
            <p>U gaat een reeks korte video's bekijken en na elke video enkele vragen beantwoorden.</p>
            <p>Uw deelnemer ID is: <strong>${subjectId}</strong></p>
            <p>Klik op "Start" om te beginnen.</p>
        `,
        choices: ['Start']
    };

    const instructionsRound1 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructies</h2>
            <p>In dit deel van het onderzoek ziet u verschillende video's.</p>
            <p>Voor elke video beantwoordt u drie vragen:</p>
            <ul style="list-style-type:none; padding-left:0;">
              <li><strong>Intensiteit en valentie van de setting</strong><br>
                  De <em>setting</em> is alles wat u ziet behalve de gezichten of lichaamstaal van de personen. Denk aan kleding, omgeving en de gebeurtenis (bijv. feest, begrafenis, bruiloft).</li>
              <li><strong>De emotie van de video als geheel</strong><br>
                  Welke emotie past volgens u het best bij de totale video?</li>
              <li><strong>De directheid van de sociale interactie</strong><br>
                  Vindt u de interactie tussen de personen in de video meer indirect of direct?</li>
            </ul>
            <p>Klik op "Verder" om te beginnen.</p>
        `,
        choices: ['Verder']
    };

    const instructionsRound2 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructies – Tweede ronde</h2>
            <p>In dit deel ziet u dezelfde video's opnieuw, maar nu is één persoon omcirkeld.</p>
            <p>Beoordeel voor elke video de <strong>intensiteit</strong> en <strong>valentie</strong> van de <strong>omcirkelde persoon</strong>. Probeer de setting te negeren.</p>
            <p>Klik op "Verder" om te beginnen.</p>
        `,
        choices: ['Verder']
    };

    // ===== Helper: create fixed "Verder" button =====
    function createVerderButton(onClickText = 'Verder', callback) {
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

    // ===== Helper: Likert creation =====
    function createLikertQuestion(container, questionText, options, callback) {
        container.innerHTML = `<p style="font-size:24px; font-weight:bold;">${questionText}</p>`;
        const btnContainer = document.createElement('div');
        btnContainer.style = 'display:flex; flex-direction:column; gap:10px; margin-top:15px;';
        container.appendChild(btnContainer);
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.textContent = option.label;
            btn.style.cssText = `
                padding:15px;
                font-size:18px;
                font-weight:bold;
                border-radius:6px;
                border:none;
                cursor:pointer;
                background-color:#007bff;
                color:white;
            `;
            btn.addEventListener('mouseenter', () => btn.style.backgroundColor='#0056b3');
            btn.addEventListener('mouseleave', () => btn.style.backgroundColor='#007bff');
            btn.addEventListener('click', () => callback(option.value));
            btnContainer.appendChild(btn);
        });
    }

    // ===== Likert options =====
    const intensityOptions = [
        {label:'Zeer rustig', value:1},
        {label:'Rustig', value:2},
        {label:'Gemiddeld', value:3},
        {label:'Intens', value:4},
        {label:'Zeer intens', value:5}
    ];
    const valenceOptions = [
        {label:'Zeer negatief', value:1},
        {label:'Negatief', value:2},
        {label:'Neutraal', value:3},
        {label:'Positief', value:4},
        {label:'Zeer positief', value:5}
    ];
    const directnessOptions = [
        {label:'Zeer indirect', value:1},
        {label:'Indirect', value:2},
        {label:'Neutraal', value:3},
        {label:'Direct', value:4},
        {label:'Zeer direct', value:5}
    ];
    const emotionsOptions = ['Woede','Angst','Verwachting','Verrassing','Vreugde','Verdriet','Vertrouwen','Walging']
        .map((e,i)=>({label:e,value:i+1}));

    // ===== Timeline =====
    let timeline = [];
    timeline.push(welcome);
    timeline.push(instructionsRound1);

    // ===== ROUND 1: Original videos =====
    shuffledPairs.forEach((pair, index) => {
        const trialNum = index + 1;
        const round1Trial = {
            type: jsPsychHtmlButtonResponse,
            choices: [],
            stimulus: function() {
                return `
                    <div style="display:flex; height:100vh; width:100vw;">
                      <div style="flex:0 0 40%; padding:10px;">
                        <video id="video-player" autoplay loop controls style="width:100%; height:100%; object-fit:contain;">
                          <source src="${pair.original_url}" type="video/mp4">
                        </video>
                      </div>
                      <div id="question-container" style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;"></div>
                    </div>
                `;
            },
            data: { task: 'round1', trial_number: trialNum, subject_id: subjectId },
            on_load: function() {
                const questions = ['setting','emotion','directness'];
                const responses = {};
                let qIndex = 0;
                const container = document.getElementById('question-container');

                function showQuestion() {
                    container.innerHTML = '';
                    if(questions[qIndex]==='setting'){
                        createLikertQuestion(container, 'Beoordeel de intensiteit van de SETTING van deze video', intensityOptions, (value1)=>{
                            responses.setting_intensiteit = value1;
                            createLikertQuestion(container, 'Beoordeel de valentie van de SETTING van deze video', valenceOptions, (value2)=>{
                                responses.setting_valentie = value2;
                                nextQuestion();
                            });
                        });
                    } else if(questions[qIndex]==='emotion'){
                        createLikertQuestion(container, 'Welke emotie past het best bij deze video?', emotionsOptions, (value)=>{
                            responses.emotion_choice = value;
                            nextQuestion();
                        });
                    } else if(questions[qIndex]==='directness'){
                        createLikertQuestion(container, 'Vindt u de interactie tussen de personen meer indirect of direct?', directnessOptions, (value)=>{
                            responses.directness_rating = value;
                            nextQuestion();
                        });
                    }
                }

                function nextQuestion(){
                    qIndex++;
                    if(qIndex<questions.length){ showQuestion(); }
                    else{ jsPsych.finishTrial(responses); }
                }

                showQuestion();
            }
        };
        timeline.push(round1Trial);
    });

    // ===== ROUND 2: Annotated videos =====
    timeline.push(instructionsRound2);
    shuffledPairs.forEach((pair,index)=>{
        const trialNum = index+1;
        const personTrial = {
            type: jsPsychHtmlButtonResponse,
            choices: [],
            stimulus: function(){
                return `
                  <div style="display:flex; height:100vh; width:100vw;">
                    <div style="flex:0 0 40%; padding:10px;">
                      <video autoplay loop controls style="width:100%; height:100%; object-fit:contain;">
                        <source src="${pair.annotated_url}" type="video/mp4">
                      </video>
                    </div>
                    <div id="person-question-container" style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;"></div>
                  </div>
                `;
            },
            data: {task:'round2', trial_number:trialNum, subject_id:subjectId},
            on_load: function(){
                const container = document.getElementById('person-question-container');
                createLikertQuestion(container, 'Beoordeel de intensiteit van de OMCIRKELDE PERSOON', intensityOptions, (value1)=>{
                    const personIntensiteit = value1;
                    createLikertQuestion(container, 'Beoordeel de valentie van de OMCIRKELDE PERSOON', valenceOptions, (value2)=>{
                        const personValentie = value2;
                        jsPsych.finishTrial({
                            person_intensiteit: personIntensiteit,
                            person_valentie: personValentie
                        });
                    });
                });
            }
        };
        timeline.push(personTrial);
    });

// ===== Final Screen =====
const finalScreen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<h2>Experiment voltooid!</h2><p>Uw gegevens worden opgeslagen...</p>',
    choices: "NO_KEYS", // v7 compatible
    on_start: function() {
        // Get the data as TSV
        const data = jsPsych.data.get();
        const tsvData = convertToTabDelimited(data.values());

        // Attempt to upload
        fetch('https://annotationexperiment.netlify.app/.netlify/functions/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject_id: subjectId, data: tsvData })
        })
        .then(async response => {
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            await response.json();
            // Success message
            document.querySelector('#jspsych-target').innerHTML =
                '<h2>Upload succesvol!</h2><p>Bedankt voor uw deelname.</p>';
        })
        .catch((err) => {
            console.error('Upload failed:', err);
            // Download locally if upload fails
            downloadData(tsvData, `subj_${subjectId}.txt`);
            document.querySelector('#jspsych-target').innerHTML =
                '<h2>Upload mislukt</h2><p>Uw data is gedownload naar uw computer.</p>';
        });
    }
};

timeline.push(finalScreen);
}

// ===== Data saving =====
function saveData(jsPsych) {
    const data = jsPsych.data.get();
    const tsvData = convertToTabDelimited(data.values());

    fetch('https://annotationexperiment.netlify.app/.netlify/functions/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, data: tsvData })
    })
    .then(async response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        alert('Data opgeslagen! Bedankt voor uw deelname.');
    })
    .catch((err) => {
        console.error('Upload failed:', err);
        // Fallback: download locally
        downloadData(tsvData, `subj_${subjectId}.txt`);
        alert('Upload mislukt. Data gedownload naar uw computer.');
    });
}

function convertToTabDelimited(data){
    const headers = [
        'subject_id',
        'trial_number',
        'video_filename',
        'setting_intensiteit',
        'setting_valentie',
        'emotion_choice',
        'directness_rating',
        'person_intensiteit',
        'person_valentie'
    ];

    const trials = {};

    data.forEach(row => {
        if(row.task){
            const trialNum = row.trial_number;

            if(!trials[trialNum]){
                const videoUrl = row.task === 'round1' ? row.original_url : row.annotated_url;
                trials[trialNum] = {
                    subject_id: row.subject_id,
                    trial_number: trialNum,
                    video_filename: videoUrl
                };
            }

            if(row.task === 'round1'){
                if(row.setting_intensiteit !== undefined) trials[trialNum].setting_intensiteit = row.setting_intensiteit;
                if(row.setting_valentie !== undefined) trials[trialNum].setting_valentie = row.setting_valentie;
                if(row.directness_rating !== undefined) trials[trialNum].directness_rating = row.directness_rating;
                if(row.emotion_choice !== undefined) trials[trialNum].emotion_choice = row.emotion_choice;
            } else if(row.task === 'round2'){
                trials[trialNum].person_intensiteit = row.person_intensiteit;
                trials[trialNum].person_valentie = row.person_valentie;
            }
        }
    });

    let output = headers.join('\t') + '\n';
    Object.keys(trials).sort((a,b) => a-b).forEach(k => {
        const t = trials[k];
        output += headers.map(h => t[h] !== undefined ? t[h] : '').join('\t') + '\n';
    });

    return output;
}

function downloadData(data,filename){
    const blob=new Blob([data],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
