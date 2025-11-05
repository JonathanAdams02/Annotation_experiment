// ===== TEST MODE CONFIGURATION =====
const TEST_MODE = 1;  // Set to 1 for test mode, 0 for production
// ====================================

// Generate random 4-digit subject ID!!!!
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
                  De <em>setting</em> is alles wat u ziet behalve de gezichten of lichaamstaal van de personen. Denk aan kleding en omgeving. Probeer hierbij de gezichten en lichaamstaal van mensen te negeren.</li>
              <li><strong>De emotie van de video als geheel</strong><br>
                  Welke emotie past volgens u het best bij de totale video? Let op: dit gaat over de video in zijn geheel, niet alleen de setting.</li>
              <li><strong>De directheid van de sociale interactie</strong><br>
                  Is de interactie tussen de personen direct of indirect?<br>
                  <em>Direct</em> betekent dat mensen actief met elkaar communiceren.<br>
                  <em>Indirect</em> betekent dat mensen bij elkaar zijn maar niet direct met elkaar interacteren.</li>
            </ul>
            <p>Klik op "Verder" voor meer uitleg over de setting.</p>
        `,
        choices: ['Verder']
    };

    const settingExplanation = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Wat is de setting van een video?</h2>
            <p>De <strong>setting</strong> van een video omvat alle visuele elementen <em>behalve</em> de personen zelf. Dit zijn alle contextuele aspecten die de sfeer en omgeving bepalen.</p>
            
            <h3>Voorbeelden van setting:</h3>
           
                <li><strong>Locatie:</strong> Een strand, kerk, ziekenhuis, kantoor</li>
                <li><strong>Kleding:</strong> Formele pakken, zwemkleding, rouwkleding</li>
                <li><strong>Decoratie:</strong> Ballonnen en confetti (feest), bloemen en kaarsen (herdenkingsplechtigheid)</li>
                <li><strong>Algemene sfeer:</strong> Feestelijke verlichting vs. sobere ruimte</li>
            
            <p><strong>Belangrijk:</strong> Probeer bij het beoordelen van de setting de gezichtsuitdrukkingen en lichaamstaal van de mensen te negeren. Focus alleen op wat er <em>om de mensen heen</em> gebeurt.</p>
            
            <p style="margin-top: 30px; font-style: italic;">U kunt deze uitleg altijd raadplegen via de groene knop rechtsboven tijdens het experiment.</p>
            <p>Klik op "Verder" om te beginnen met de video's.</p>
        `,
        choices: ['Verder']
    };

    const instructionsRound2 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructies – Tweede ronde</h2>
            <p>In dit deel ziet u dezelfde video's opnieuw, maar nu is één persoon omlijnd.</p>
            <p>Nu richt u zich <strong>alleen op de omlijnd persoon</strong>. Beoordeel voor elke video de <strong>intensiteit</strong> en <strong>valentie</strong> van deze persoon.</p>
            <p><strong>Let op:</strong> Negeer de setting volledig en focus uitsluitend op de gezichtsuitdrukking en lichaamstaal van de omlijnd persoon.</p>
            <p>Klik op "Verder" voor meer uitleg over het beoordelen van personen.</p>
        `,
        choices: ['Verder']
    };

    const personExplanation = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Wat zijn de kenmerken van een persoon?</h2>
            <p>Bij het beoordelen van een <strong>persoon</strong> focust u zich uitsluitend op de individuele emotionele uitdrukking van die persoon, los van de omgeving.</p>
            
            <h3>Voorbeelden van persoonlijke kenmerken:</h3>
            
                <li><strong>Gezichtsuitdrukking:</strong> Glimlach, frons, tranen, blik</li>
                <li><strong>Lichaamstaal:</strong> Houding, gebaren, spanning in het lichaam</li>
                <li><strong>Emotionele expressie:</strong> Blijdschap, verdriet, boosheid, angst</li>
           
        
            <p><strong>Belangrijk:</strong> Negeer bij het beoordelen van de persoon volledig wat er in de achtergrond gebeurt. Een persoon kan bijvoorbeeld verdrietig kijken tijdens een feest, of blij kijken op een begrafenis. Focus alleen op de persoon zelf.</p>
            
            <p style="margin-top: 30px; font-style: italic;">U kunt deze uitleg altijd raadplegen via de groene knop rechtsboven tijdens het experiment.</p>
            <p>Klik op "Verder" om door te gaan met de tweede ronde.</p>
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

    // ===== Helper: Create explanation popup =====
    function showExplanation(type) {
        const existing = document.getElementById('explanation-popup');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'explanation-popup';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const popup = document.createElement('div');
        popup.style.cssText = `
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        let content = '';
        if (type === 'setting') {
            content = `
                <h3 style="margin-top:0;">Wat is de setting van een video?</h3>
                <p>De <strong>setting</strong> van een video omvat alle visuele elementen <em>behalve</em> de personen zelf. Dit zijn alle contextuele aspecten die de sfeer en omgeving bepalen.</p>
                
                <h4>Voorbeelden van setting:</h4>
                <ul>
                    <li><strong>Locatie:</strong> Een strand, kerk, ziekenhuis, kantoor</li>
                    <li><strong>Kleding:</strong> Formele pakken, zwemkleding, rouwkleding</li>
                    <li><strong>Decoratie:</strong> Ballonnen en confetti (feest), bloemen en kaarsen (herdenkingsplechtigheid)</li>
                    <li><strong>Algemene sfeer:</strong> Feestelijke verlichting vs. sobere ruimte</li>
                </ul>
                
                <p><strong>Belangrijk:</strong> Probeer bij het beoordelen van de setting de gezichtsuitdrukkingen en lichaamstaal van de mensen te negeren. Focus alleen op wat er <em>om de mensen heen</em> gebeurt.</p>
            `;
        } else if (type === 'person') {
            content = `
                <h3 style="margin-top:0;">Wat zijn de kenmerken van een persoon?</h3>
                <p>Bij het beoordelen van een <strong>persoon</strong> focust u zich uitsluitend op de individuele emotionele uitdrukking van die persoon, los van de omgeving.</p>
                
                <h4>Voorbeelden van persoonlijke kenmerken:</h4>
                <ul>
                    <li><strong>Gezichtsuitdrukking:</strong> Glimlach, frons, tranen, blik</li>
                    <li><strong>Lichaamstaal:</strong> Houding, gebaren, spanning in het lichaam</li>
                    <li><strong>Emotionele expressie:</strong> Blijdschap, verdriet, boosheid, angst</li>
                </ul>
                
                <p><strong>Belangrijk:</strong> Negeer bij het beoordelen van de persoon volledig wat er in de achtergrond gebeurt. Een persoon kan bijvoorbeeld verdrietig kijken tijdens een feest, of blij kijken op een begrafenis. Focus alleen op de persoon zelf.</p>
            `;
        }
        
        popup.innerHTML = content + `
            <button id="close-explanation" style="
                margin-top: 20px;
                padding: 10px 30px;
                font-size: 16px;
                font-weight: bold;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            ">Sluiten</button>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        document.getElementById('close-explanation').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
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

    const demographicsSurvey = {
        type: jsPsychSurveyText,
        questions: [
            {prompt: "Wat is uw volledige naam?", name: 'name', required: true},
            {prompt: "Wat is uw studentnummer?", name: 'student_id', required: true},
            {prompt: "Wat is uw leeftijd?", name: 'age', required: true},
            {prompt: "Wat is uw geslacht? (Man/Vrouw/Anders)", name: 'gender', required: true},
            {prompt: "Wat is uw handvoorkeur? (Links/Rechts/Beide)", name: 'handedness', required: true}
        ],
        data: {
            task: 'demographics',
            subject_id: subjectId
        },
        on_finish: function(data) {
            saveDemographics({
                subject_id: subjectId,
                name: data.response.name,
                student_id: data.response.student_id,
                age: data.response.age,
                gender: data.response.gender,
                handedness: data.response.handedness,
                timestamp: new Date().toISOString()
            });
        }
    };

    timeline.push(demographicsSurvey);
    timeline.push(instructionsRound1);
    timeline.push(settingExplanation);

    // ===== ROUND 1: Original videos =====
    shuffledPairs.forEach((pair, index) => {
        const trialNum = index + 1;
        const round1Trial = {
            type: jsPsychHtmlButtonResponse,
            choices: [],
           stimulus: function() {
    const filename = pair.original_url.split('/').pop();
    return `
        ${TEST_MODE ? '<div style="position:fixed; top:60px; right:10px; background-color:red; color:white; padding:10px; font-weight:bold; z-index:10000; border-radius:5px;">TEST MODE</div>' : ''}
        <div style="display:flex; height:100vh; width:100vw;">
          <div style="flex:0 0 40%; padding:10px;">
            ${TEST_MODE ? `<p style="font-size:14px; font-weight:bold; margin-bottom:5px; color:#333;">${filename}</p>` : ''}
            <video id="video-player" autoplay loop muted style="width:100%; height:100%; object-fit:contain;">
              <source src="${pair.original_url}" type="video/mp4">
            </video>
          </div>
          <div id="question-container" style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;"></div>
          <button id="help-setting" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">? Wat is Setting?</button>
          ${TEST_MODE ? `<button id="skip-button" style="position:fixed; bottom:20px; right:20px; padding:15px 30px; font-size:18px; font-weight:bold; background-color:#ff9800; color:white; border:none; border-radius:8px; cursor:pointer; z-index:9999; box-shadow:0 4px 6px rgba(0,0,0,0.2);">SKIP →</button>` : ''}
        </div>
    `;
},
            data: { task: 'round1', trial_number: trialNum, subject_id: subjectId, video_filename: pair.original_url },
            on_load: function() {
                document.getElementById('help-setting').addEventListener('click', () => showExplanation('setting'));
                
                if (TEST_MODE) {
                    document.getElementById('skip-button').addEventListener('click', () => {
                        jsPsych.finishTrial({
                            setting_intensiteit: 0,
                            setting_valentie: 0,
                            emotion_choice: 0,
                            directness_rating: 0,
                            skipped: true
                        });
                    });
                }
                
                const questions = ['setting','emotion','directness'];
                const responses = {};
                let qIndex = 0;
                const container = document.getElementById('question-container');

                function showQuestion() {
                    container.innerHTML = '';
                    if(questions[qIndex]==='setting'){
                        createLikertQuestion(container, 'Beoordeel de intensiteit van de SETTING van deze video, negeer de gezichtsuitdrukkingen en lichaamstaal van de mensen in de video.', intensityOptions, (value1)=>{
                            responses.setting_intensiteit = value1;
                            createLikertQuestion(container, 'Beoordeel de valentie van de SETTING van deze video, negeer de gezichtsuitdrukkingen en lichaamstaal van de mensen in de video.', valenceOptions, (value2)=>{
                                responses.setting_valentie = value2;
                                nextQuestion();
                            });
                        });
                    } else if(questions[qIndex]==='emotion'){
                        createLikertQuestion(container, 'Welke emotie past het best bij deze video als geheel?', emotionsOptions, (value)=>{
                            responses.emotion_choice = value;
                            nextQuestion();
                        });
                    } else if(questions[qIndex]==='directness'){
                        createLikertQuestion(container, 'Vindt u de interactie tussen de personen in de video meer indirect of direct?', directnessOptions, (value)=>{
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
    timeline.push(personExplanation);
    
    shuffledPairs.forEach((pair,index)=>{
        const trialNum = index+1;
        const personTrial = {
            type: jsPsychHtmlButtonResponse,
            choices: [],
            stimulus: function(){
    const filename = pair.annotated_url.split('/').pop();
    return `
        ${TEST_MODE ? '<div style="position:fixed; top:60px; right:10px; background-color:red; color:white; padding:10px; font-weight:bold; z-index:10000; border-radius:5px;">TEST MODE</div>' : ''}
        <div style="display:flex; height:100vh; width:100vw;">
          <div style="flex:0 0 40%; padding:10px;">
            ${TEST_MODE ? `<p style="font-size:14px; font-weight:bold; margin-bottom:5px; color:#333;">${filename}</p>` : ''}
            <video autoplay loop muted style="width:100%; height:100%; object-fit:contain;">
              <source src="${pair.annotated_url}" type="video/mp4">
            </video>
          </div>
          <div id="person-question-container" style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;"></div>
          <button id="help-person" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">? Wat is Persoon?</button>
          ${TEST_MODE ? `<button id="skip-button-person" style="position:fixed; bottom:20px; right:20px; padding:15px 30px; font-size:18px; font-weight:bold; background-color:#ff9800; color:white; border:none; border-radius:8px; cursor:pointer; z-index:9999; box-shadow:0 4px 6px rgba(0,0,0,0.2);">SKIP →</button>` : ''}
        </div>
    `;
},
            data: {task:'round2', trial_number:trialNum, subject_id:subjectId, video_filename: pair.annotated_url},
            on_load: function(){
                document.getElementById('help-person').addEventListener('click', () => showExplanation('person'));
                
                if (TEST_MODE) {
                    document.getElementById('skip-button-person').addEventListener('click', () => {
                        jsPsych.finishTrial({
                            person_intensiteit: 0,
                            person_valentie: 0,
                            skipped: true
                        });
                    });
                }
                
                const container = document.getElementById('person-question-container');
                createLikertQuestion(container, 'Beoordeel de intensiteit van de OMLIJNDE PERSOON, negeer de setting', intensityOptions, (value1)=>{
                    const personIntensiteit = value1;
                    createLikertQuestion(container, 'Beoordeel de valentie van de OMLIJNDE PERSOON, negeer de setting', valenceOptions, (value2)=>{
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
        type: jsPsychHtmlButtonResponse,
        stimulus: `<h2>Experiment voltooid!</h2><p>Klik op "Finish" om uw gegevens op te slaan en af te ronden.</p>`,
        choices: ['Finish'],
        on_finish: function() {
            const data = jsPsych.data.get();
            const tsvData = convertToTabDelimited(data.values());

            fetch('https://annotationexperiment.netlify.app/.netlify/functions/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject_id: subjectId, data: tsvData })
            })
            .then(async response => {
                if (!response.ok) throw new Error(`Server error: ${response.status}`);
                return response.json();
            })
            .then(() => {
                document.querySelector('#jspsych-target').innerHTML =
                    `<h2>Upload succesvol!</h2>
                     <p>Bedankt voor uw deelname.</p>`;
            })
            .catch((err) => {
                console.error('Upload failed:', err);
                downloadData(tsvData, `subj_${subjectId}.txt`);
                document.querySelector('#jspsych-target').innerHTML =
                    `<h2>Upload mislukt</h2>
                     <p>Uw data is gedownload naar uw computer.</p>`;
            });
        }
    };
    timeline.push(finalScreen);

    jsPsych.run(timeline);
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
        downloadData(tsvData, `subj_${subjectId}.txt`);
        alert('Upload mislukt. Data gedownload naar uw computer.');
    });
}

function saveDemographics(demographics) {
    fetch('https://annotationexperiment.netlify.app/.netlify/functions/save-demographics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demographics)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Demographics saved successfully');
    })
    .catch(error => {
        console.error('Demographics save failed:', error);
        const demoText = `Subject ID: ${demographics.subject_id}\nName: ${demographics.name}\nStudent ID: ${demographics.student_id}\nAge: ${demographics.age}\nGender: ${demographics.gender}\nHandedness: ${demographics.handedness}\nTimestamp: ${demographics.timestamp}`;
        const blob = new Blob([demoText], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demographics_${demographics.subject_id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                trials[trialNum] = {
                    subject_id: row.subject_id,
                    trial_number: trialNum,
                    video_filename: ''
                };
            }

            if(row.video_filename){
                const fullFilename = row.video_filename.split('/').pop();
                const cleanFilename = fullFilename.replace('_Annotated', '');
                trials[trialNum].video_filename = cleanFilename;
            }

            if(row.task === 'round1'){
                if(row.setting_intensiteit !== undefined) trials[trialNum].setting_intensiteit = row.setting_intensiteit;
                if(row.setting_valentie !== undefined) trials[trialNum].setting_valentie = row.setting_valentie;
                if(row.directness_rating !== undefined) trials[trialNum].directness_rating = row.directness_rating;
                if(row.emotion_choice !== undefined) {
                    const emotionLabel = ['Woede','Angst','Verwachting','Verrassing','Vreugde','Verdriet','Vertrouwen','Walging'][row.emotion_choice - 1];
                    trials[trialNum].emotion_choice = emotionLabel || row.emotion_choice;
                }
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