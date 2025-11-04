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

    // ===== Timeline =====
    let timeline = [];
    timeline.push(welcome);
    timeline.push(instructionsRound1);

// ===== ROUND 1: Original videos (persistent video) =====
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
                    const randomSettingIntensiteit = Math.floor(Math.random() * 101);
                    const randomSettingValentie = Math.floor(Math.random() * 101);
                    window.currentSettingIntensiteit = randomSettingIntensiteit;
                    window.currentSettingValentie = randomSettingValentie;

                    container.innerHTML = `
                      <p style="font-size:24px; font-weight:bold;">Beoordeel de <strong>SETTING</strong> van deze video</p>
                      <p>De setting is alles behalve de gezichten of lichaamstaal van de personen.</p>
                      <label>Intensiteit</label>
                      <input type="range" id="intensiteit-slider" min="0" max="100" value="${randomSettingIntensiteit}">
                      <p id="intensiteit-value"> ${randomSettingIntensiteit}</p>
                      <div style="display:flex; justify-content:space-between; font-size:14px;"><span>Niet intens</span><span>Zeer intens</span></div>

                      <label>Valentie</label>
                      <input type="range" id="valentie-slider" min="0" max="100" value="${randomSettingValentie}">
                      <p id="valentie-value">${randomSettingValentie}</p>
                      <div style="display:flex; justify-content:space-between; font-size:14px;"><span>Negatief</span><span>Positief</span></div>
                    `;
                } else if(questions[qIndex]==='emotion'){
                    const emotions = ['Optimisme','Liefde','Onderwerping','Ontzag','Afkeuring','Berouw','Minachting','Agressiviteit'];
                    container.innerHTML = `<p style="font-size:24px; font-weight:bold;">Welke emotie past het best bij deze video?</p>`;
                    const btnContainer = document.createElement('div');
                    btnContainer.style = 'display:grid; grid-template-columns:1fr 1fr; gap:15px;';
                    container.appendChild(btnContainer);
                    emotions.forEach(em => {
                        const btn = document.createElement('button');
                        btn.textContent = em;
                        btn.style.cssText = 'padding:20px; font-size:20px; font-weight:bold; background-color:#007bff; color:white; border:none; border-radius:8px; cursor:pointer;';
                        btn.addEventListener('click', ()=>{ responses.emotion_choice = em; nextQuestion(); });
                        btnContainer.appendChild(btn);
                    });
                    return;
                } else if(questions[qIndex]==='directness'){
                    const randomDirectness = Math.floor(Math.random() * 101);
                    window.currentDirectness = randomDirectness;
                    container.innerHTML = `
                      <p style="font-size:24px; font-weight:bold;">Vindt u de interactie tussen de personen meer indirect of direct?</p>
                      <input type="range" id="directness-slider" min="0" max="100" value="${randomDirectness}">
                      <p id="directness-value"> ${randomDirectness}</p>
                      <div style="display:flex; justify-content:space-between; font-size:14px;"><span>Indirect</span><span>Direct</span></div>
                    `;
                }

                if(questions[qIndex]!=='emotion'){
                    // Add live slider updates
                    if(questions[qIndex]==='setting'){
                        const intensSlider = document.getElementById('intensiteit-slider');
                        const valSlider = document.getElementById('valentie-slider');
                        const intensValue = document.getElementById('intensiteit-value');
                        const valValue = document.getElementById('valentie-value');

                        intensSlider.addEventListener('input', e=>{
                            window.currentSettingIntensiteit = parseInt(e.target.value);
                            intensValue.textContent =  e.target.value;
                        });
                        valSlider.addEventListener('input', e=>{
                            window.currentSettingValentie = parseInt(e.target.value);
                            valValue.textContent =  e.target.value;
                        });
                    } else if(questions[qIndex]==='directness'){
                        const slider = document.getElementById('directness-slider');
                        const value = document.getElementById('directness-value');
                        slider.addEventListener('input', e=>{
                            window.currentDirectness = parseInt(e.target.value);
                            value.textContent =  e.target.value;
                        });
                    }

                    createVerderButton('Verder', ()=>{
                        if(questions[qIndex]==='setting'){
                            responses.setting_intensiteit = window.currentSettingIntensiteit;
                            responses.setting_valentie = window.currentSettingValentie;
                        } else if(questions[qIndex]==='directness'){
                            responses.directness_rating = window.currentDirectness;
                        }
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
            const randomPersonIntensiteit = Math.floor(Math.random() * 101);
            const randomPersonValentie = Math.floor(Math.random() * 101);
            window.currentPersonIntensiteit = randomPersonIntensiteit;
            window.currentPersonValentie = randomPersonValentie;

            return `
              <div style="display:flex; height:100vh; width:100vw;">
                <div style="flex:0 0 40%; padding:10px;">
                  <video autoplay loop controls style="width:100%; height:100%; object-fit:contain;">
                    <source src="${pair.annotated_url}" type="video/mp4">
                  </video>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                  <p style="font-size:24px; font-weight:bold;">Beoordeel de OMCIRKELDE PERSOON</p>
                  <label>Intensiteit</label>
                  <input type="range" id="person-intensiteit-slider" min="0" max="100" value="${randomPersonIntensiteit}">
                  <p id="person-intensiteit-value"> ${randomPersonIntensiteit}</p>
                  <div style="display:flex; justify-content:space-between; font-size:14px;"><span>Niet intens</span><span>Zeer intens</span></div>

                  <label>Valentie</label>
                  <input type="range" id="person-valentie-slider" min="0" max="100" value="${randomPersonValentie}">
                  <p id="person-valentie-value"> ${randomPersonValentie}</p>
                  <div style="display:flex; justify-content:space-between; font-size:14px;"><span>Negatief</span><span>Positief</span></div>
                </div>
              </div>
            `;
        },
        data: {task:'round2', trial_number:trialNum, subject_id:subjectId},
        on_load: function(){
            const intensSlider = document.getElementById('person-intensiteit-slider');
            const valSlider = document.getElementById('person-valentie-slider');
            const intensValue = document.getElementById('person-intensiteit-value');
            const valValue = document.getElementById('person-valentie-value');

            intensSlider.addEventListener('input', e => {
                window.currentPersonIntensiteit = parseInt(e.target.value);
                intensValue.textContent =  e.target.value;
            });
            valSlider.addEventListener('input', e => {
                window.currentPersonValentie = parseInt(e.target.value);
                valValue.textContent = e.target.value;
            });

            createVerderButton('Verder', ()=>{
                jsPsych.finishTrial({
                    person_intensiteit: window.currentPersonIntensiteit,
                    person_valentie: window.currentPersonValentie
                });
            });
        }
    };
    timeline.push(personTrial);
});

    // ===== Final Screen =====
    const finalScreen = {
        type: jsPsychHtmlButtonResponse,
        stimulus:`<h2>Experiment voltooid!</h2><p>Bedankt voor uw deelname. Uw gegevens worden opgeslagen...</p>`,
        choices:[]
    };
    timeline.push(finalScreen);

    jsPsych.run(timeline);
}

// ===== Data saving =====
function saveData(jsPsych){
    const data = jsPsych.data.get();
    const tsvData = convertToTabDelimited(data.values());
    fetch('/.netlify/functions/save-data',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({subject_id:subjectId, data:tsvData})
    }).then(r=>r.json())
    .then(()=>alert('Data opgeslagen! Bedankt voor uw deelname.'))
    .catch(()=>{downloadData(tsvData, `subj_${subjectId}.txt`); alert('Data gedownload naar uw computer.');});
}

function convertToTabDelimited(data){
    const emotions = ['Optimisme','Liefde','Onderwerping','Ontzag','Afkeuring','Berouw','Minachting','Agressiviteit'];
    const trials={};
    data.forEach(row=>{
        if(row.task){
            const trialNum=row.trial_number;
            if(!trials[trialNum]) trials[trialNum]={subject_id:row.subject_id, trial_number:row.trial_number, condition:row.condition, direct_indirect:row.type, video_number:row.video_number};
            if(row.task==='round1'){
                if(row.setting_intensiteit!==undefined) trials[trialNum].setting_intensiteit=row.setting_intensiteit;
                if(row.setting_valentie!==undefined) trials[trialNum].setting_valentie=row.setting_valentie;
                if(row.directness_rating!==undefined) trials[trialNum].directness_rating=row.directness_rating;
                if(row.emotion_choice!==undefined) trials[trialNum].emotion_choice=row.emotion_choice;
            } else if(row.task==='round2'){
                trials[trialNum].person_intensiteit=row.person_intensiteit;
                trials[trialNum].person_valentie=row.person_valentie;
            }
        }
    });
    const headers=['subject_id','trial_number','condition','direct_indirect','video_number','setting_intensiteit','setting_valentie','emotion_choice','directness_rating','person_intensiteit','person_valentie'];
    let output=headers.join('\t')+'\n';
    Object.keys(trials).sort((a,b)=>a-b).forEach(k=>{
        const t=trials[k];
        output+=headers.map(h=>t[h]!==undefined?t[h]:'').join('\t')+'\n';
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
