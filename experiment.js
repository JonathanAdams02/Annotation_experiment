// ===== TEST MODE CONFIGURATION 
const TEST_MODE = 0;  // Set to 1 for test mode, 0 for production
// ====================================

// Generate random 4-digit subject ID
const subjectId = Math.floor(1000 + Math.random() * 9000);

// ===== AUTO ZOOM FUNCTION =====
// Automatically set browser zoom so that full interface can be displayed on screen
function applyZoom() {
    let width = window.screen.width;
    if (width == 1920) {
        return;
    }

    let zoom = 0.01*Math.floor(100*width/1920);

    document.getElementById("jspsych-target").style.transform = "scale(" + zoom + ")";
    document.getElementById("jspsych-target").style.transformOrigin = "top left";
}

// Apply zoom when page loads
// Apply zoom when page loads and when window resizes
window.addEventListener('load', applyZoom);
window.addEventListener('resize', applyZoom);

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
     console.log('Created pairs:', videoPairs.length);  // ← ADD HERE
    console.log('First pair:', videoPairs[0]);          // ← ADD HERE
    const shuffledPairs = jsPsych.randomization.shuffle(videoPairs);

    // Store responses for navigation
    let round1Responses = {};
    let round2Responses = {};

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
                <h3 style="margin-top:0;">What is the SETTING?</h3>
                <p>In round one you will be asked to answer questions about the <strong>setting</strong> of a video.</p>
                <p>The <strong>setting</strong> includes all visual elements <em>except</em> the people themselves. These are all contextual aspects that determine the atmosphere and environment.</p>
                
                <h4>The setting can consist of e.g.:</h4>
                <p><strong>Location:</strong> A beach, church, hospital, office</p>
                <p><strong>Clothing:</strong> Formal suits, swimwear, mourning clothes</p>
                <p><strong>Decoration:</strong> Balloons and confetti (party), flowers and candles (memorial)</p>
                <p><strong>Items in the room:</strong> Furniture, objects, equipment, guns</p>
                
                <div style="border: 3px solid #ff6b6b; padding: 15px; margin: 20px 0; border-radius: 8px; background-color: #fff5f5;">
    <p style="margin: 0;"><strong>Important:</strong> When evaluating the setting, try to ignore people's facial expressions and body language. Focus only on what happens <em>around the people</em>.</p>
</div>
            `;
        } else if (type === 'person') {
            content = `
                <h3 style="margin-top:0;">What are the characteristics of a PERSON?</h3>
                <p>When evaluating a <strong>person</strong>, you focus exclusively on that individual's facial expression and body language, independent of the environment.</p>
                
                <h4>Examples of personal characteristics:</h4>
                <p><strong>Facial expression:</strong> Smile, frown, tears, gaze</p>
                <p><strong>Body language:</strong> Posture, gestures, body tension</p>
                
                <p><strong>Important:</strong> When evaluating the person, completely ignore what is happening in the setting. A person can look sad at a party, or happy at a funeral. Focus only on the person themselves.</p>
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
            ">Close</button>
        `;
        
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
        
        document.getElementById('close-explanation').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // ===== Welcome & Instructions =====
    const welcome = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h1>Welcome to the Video Annotation Study</h1>
            <p>Thank you for participating in this study.</p>
            <p>You will watch a series of short videos and answer questions about them.</p>
            <p>Your participant ID is: <strong>${subjectId}</strong></p>
            <p>Click "Start" to begin.</p>
        `,
        choices: ['Start']
    };

const demographicsSurvey = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <p><label for="name">What is your full name?<br>
        <input type="text" id="name" name="name" required style="width: 300px; padding: 5px;"></label></p>
        
        <p><label for="student_id">What is your student ID?<br>
        <input type="text" id="student_id" name="student_id" required style="width: 300px; padding: 5px;"></label></p>
        
        <p><label for="age">What is your age?<br>
        <input type="number" id="age" name="age" min="18" max="100" required style="width: 300px; padding: 5px;"></label></p>
        
        <p><label for="gender">What is your gender?<br>
        <select id="gender" name="gender" required style="width: 300px; padding: 5px;">
            <option value="">--Please select--</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
        </select></label></p>
        
        <p><label for="handedness">What is your handedness?<br>
        <select id="handedness" name="handedness" required style="width: 300px; padding: 5px;">
            <option value="">--Please select--</option>
            <option value="Left">Left</option>
            <option value="Right">Right</option>
        </select></label></p>
    `,
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
    const instructionsRound1 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructions – Round One</h2>
            <p>In this part of the study you will watch different videos.</p>
            <p>For each video, you will rate:</p>
            <p><strong>Valence:</strong> How negative or positive the setting is (-3 to +3)</p>
            <p><strong>Intensity:</strong> How intense the setting is (0 to 6)</p>
            <p><strong>Directness:</strong> How direct the social interaction is (1 to 6)</p>
            <p><strong>Emotion:</strong> Select the main emotion from the emotion wheel</p>
            <p><strong>Ambivalence:</strong> How clear vs ambivalent the emotional content of the video is (0 to 6)</p>
            <p>All questions appear on a single screen. The video will loop continuously.</p>
            <p>Click "Continue" for detailed explanations of each rating.</p>
        `,
        choices: ['Continue']
    };

    const settingExplanation = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <h2>What is the SETTING?</h2>
                 <p>In round one you will be asked to answer questions about the <strong>setting</strong> of a video.</p>
                <p>The <strong>setting</strong> includes all visual elements <em>except</em> the people themselves. These are all contextual aspects that determine the atmosphere and environment.</p>
                
                <h3>The setting can consist of e.g.:</h3>
                <p><strong>Location:</strong> A beach, church, hospital, office</p>
                <p><strong>Clothing:</strong> Formal suits, swimwear, mourning clothes</p>
                <p><strong>Decoration:</strong> Balloons and confetti (party), flowers and candles (memorial)</p>
                <p><strong>Items in the room:</strong> Furniture, objects, equipment, guns</p>
                
               <div style="border: 3px solid #ff6b6b; padding: 15px; margin: 20px 0; border-radius: 8px; background-color: #fff5f5;">
    <p style="margin: 0;"><strong>Important:</strong> When evaluating the setting, try to ignore people's facial expressions and body language. Focus only on what happens <em>around the people</em>.</p>
</div>
                
                <p style="margin-top: 30px;">Click "Continue" to learn about the rating scales.</p>
            </div>
        `,
        choices: ['Continue']
    };

    const ratingsExplanation = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <h2>Rating Scales Explained</h2>
                
                <div style="margin-bottom: 25px;">
                    <h3>1. Valence (Setting only)</h3>
                    <p>We ask you to indicate the emotional characteristic of the SETTING displayed in the video, independent of your own political/religious/sexual orientation. So protest is typically negative (= the participants are not happy) independent of whether you support the cause.</p>
                    <p>Specifically, we ask you to rate the <strong>valence</strong> ("Negative/Positive") of the overall emotional gist of the setting on a 7-point scale from negative (-3) over neutral (0) to positive (+3).</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>2. Intensity (Setting only)</h3>
                    <p>We ask you to indicate the emotional characteristic of the SETTING displayed in the video, independent of your own political/religious/sexual orientation.</p>
                    <p>Specifically, we ask you to rate the <strong>intensity</strong> of the setting, ranging from not intense at all (0) to very intense (6).</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>3. Directness (Social Interaction)</h3>
                    <p>Please rate the directness of the social interaction displayed in the video on a scale from 1 (very indirect) to 6 (very direct).</p>
                    <p><strong>Direct interactions</strong> involve people actively communicating or engaging with each other. (e.g. fighting, hugging) </p>
                    <p><strong>Indirect interactions</strong> involve people who are in the same setting or context but are not directly engaging with each other. They may be aware of each other's presence but are not actively communicating or interacting.</p>
                    <p>Consider the primary focus of the video when making your rating. If the video shows multiple types of interactions, rate based on the most prominent or salient interaction shown.</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>4. Emotion (Whole Video)</h3>
                    <p>We also ask to indicate an <strong>emotional label</strong> by means of a mouse click on an emotion wheel. If you can't find the perfect emotional label then you choose the 'next best thing', i.e., the one that reflects it most.</p>
                    <p>For a more detailed description of each emotion depicted in this wheel, hover over each emotion segment.</p>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3>5. Ambivalence (Whole video)</h3>
                    <p>Please also rate how straightforward the emotional content that is exhibited by the entire video is using the scale indicated with <strong>"Ambivalence"</strong>.</p>
                    <p>For instance, if there are approximately as much emotionally positive as emotionally negative cues in the video, the emotional content would be highly ambivalent (6), while only positive cues or only negative cues would result in low ambivalence. (0).</p>
                </div>
                
                <p style="margin-top: 40px; font-weight: bold;">You are now ready to begin Round One. Click "Start Round 1" when ready.</p>
            </div>
        `,
        choices: ['Start Round 1']
    };

    const instructionsRound2 = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h2>Instructions – Round Two</h2>
            <p>In this part you will see the same videos again, but now one person is highlighted with an arrow.</p>
            <p>Rate the <strong>intensity</strong> and <strong>valence</strong> of the appointed person only.</p>
            <p>Click "Continue" to learn more about rating a person.</p>
        `,
        choices: ['Continue']
    };

    const personExplanation = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <h2>What are the characteristics of a PERSON?</h2>
                <p>When evaluating a <strong>person</strong>, you focus exclusively on that individual's facial expression and body language, independent of the environment.</p>
                <p>Please focus on the person indicated by the arrow in the video.</p>

                <h3>Examples of personal characteristics:</h3>
                <p><strong>Facial expression:</strong> Smile, frown, tears, gaze</p>
                <p><strong>Body language:</strong> Posture, gestures, body tension</p>
                
                <p><strong>Important:</strong> When evaluating the person, completely ignore what is happening in the setting. A person can look sad at a party, or happy at a funeral. Focus only on the person themselves.</p>
                
                <h3 style="margin-top: 30px;">Rating Scales for Round Two</h3>
                
                <div style="margin-bottom: 20px;">
                    <h4>Valence (Person)</h4>
                    <p>We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.</p>
                    <p>Please focus on the person indicated by the arrow.</p>
                    <p>Specifically, we ask you to rate the <strong>valence</strong> ("Negative/Positive") of the overall emotional gist of the person on a 7-point scale from negative (-3) over neutral (0) to positive (+3).</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4>Intensity (Person)</h4>
                    <p>We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.</p>
                    <p>Please focus on the person indicated by the arrow.</p>
                    <p>Specifically, we ask you to rate the <strong>intensity</strong> of the person, ranging from not intense at all (0) to very intense (6).</p>
                </div>
                
                <p style="margin-top: 40px; font-weight: bold;">You are now ready to begin Round Two. Click "Start Round 2" when ready.</p>
            </div>
        `,
        choices: ['Start Round 2']
    };

    // ===== Timeline =====
    let timeline = [];
    timeline.push(welcome);
    timeline.push(demographicsSurvey);
    timeline.push(instructionsRound1);
    timeline.push(settingExplanation);
    timeline.push(ratingsExplanation);

    // ===== ROUND 1: Single screen with all questions =====
    shuffledPairs.forEach((pair, index) => {
        const trialNum = index + 1;
        
        const combinedScreen = {
            type: jsPsychHtmlButtonResponse,
            choices: ['Next'],
            stimulus: function() {
                const filename = pair.original_url.split('/').pop();
                return `
                    ${TEST_MODE ? '<div style="position:fixed; top:60px; right:10px; background-color:red; color:white; padding:10px; font-weight:bold; z-index:10000; border-radius:5px;">TEST MODE</div>' : ''}
                    <div style="display:flex; height:100vh; width:100vw; padding:8px; box-sizing:border-box; gap:12px;">
                      
                      <!-- Video Section -->
                      <div style="flex:0 0 55%; display:flex; flex-direction:column; justify-content:center;">
                        ${TEST_MODE ? `<p style="font-size:12px; margin:0 0 5px 0;">${filename}</p>` : ''}
                        <video id="trial-video-${trialNum}" autoplay loop muted playsinline style="width:100%; height:auto; max-height:80vh; object-fit:contain; background:#000;">
                          <source src="${pair.original_url}" type="video/mp4">
                        </video>
                      </div>
                      
                      <!-- Questions Section -->
                      <div style="flex:1; display:flex; flex-direction:column; padding:4px; overflow:hidden; height:calc(100vh - 16px);">

                        <!-- Top Sliders -->
                        <div style="flex:0 0 auto;">
                          <!-- Valence Slider -->
                          <div style="margin-bottom:1px;">
                            <div style="display:flex; align-items:center; gap:5px; margin-bottom:0px;">
                              <label style="font-weight:bold; font-size:12px;">Valence (setting only):</label>
                              <span class="info-icon" data-info="valence" style="cursor:help; font-size:12px; color:#007bff;">ⓘ</span>
                            </div>
                            <input type="range" min="-3" max="3" value="0" step="1" id="slider-valence" style="width:100%; height:10px;">
                            <div style="display:flex; justify-content:space-between; font-size:8px; color:#666; margin-top:0px;">
                              <span>-3</span><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span><span>3</span>
                            </div>
                          </div>

                          <!-- Intensity Slider -->
                          <div style="margin-bottom:1px;">
                            <div style="display:flex; align-items:center; gap:5px; margin-bottom:0px;">
                              <label style="font-weight:bold; font-size:12px;">Intensity (setting only):</label>
                              <span class="info-icon" data-info="intensity" style="cursor:help; font-size:12px; color:#007bff;">ⓘ</span>
                            </div>
                            <input type="range" min="0" max="6" value="0" step="1" id="slider-intensity" style="width:100%; height:10px;">
                            <div style="display:flex; justify-content:space-between; font-size:8px; color:#666; margin-top:0px;">
                              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                            </div>
                          </div>

                          <!-- Directness Slider -->
                          <div style="margin-bottom:1px;">
                            <div style="display:flex; align-items:center; gap:5px; margin-bottom:0px;">
                              <label style="font-weight:bold; font-size:12px;">Directness (social interaction):</label>
                              <span class="info-icon" data-info="directness" style="cursor:help; font-size:12px; color:#007bff;">ⓘ</span>
                            </div>
                            <input type="range" min="0" max="6" value="0" step="1" id="slider-directness" style="width:100%; height:10px;">
                            <div style="display:flex; justify-content:space-between; font-size:8px; color:#666; margin-top:0px;">
                              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                            </div>
                          </div>
                        </div>

                        <!-- Middle: Emotion Wheel (DYNAMIC) -->
                        <div style="flex:1 1 auto; display:flex; flex-direction:column; min-height:0; margin:1px 0; overflow:hidden;">
                          <div style="display:flex; align-items:center; gap:5px; margin-bottom:0px;">
                            <h3 style="margin:0; font-size:12px; font-weight:bold;">Emotion (Whole video):</h3>
                            <span class="info-icon" data-info="emotion" style="cursor:help; font-size:12px; color:#007bff;">ⓘ</span>
                          </div>
                          
                          <div style="flex:1; display:flex; align-items:center; justify-content:center; min-height:0; overflow:hidden;">
                            <div id="div_svg" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; position:relative;">
                              <svg viewBox="0 0 715 725" preserveAspectRatio="xMidYMid meet" style="width:auto; height:100%; max-width:100%; display:block;">
                                <g id="areas" stroke="#000" stroke-width="2">
                                  <path fill="#FFC5C5" d="M110.303,325.048C84.749,332.483,58.82,344.254,33,362.488 c24.984,18.157,51.076,29.983,77.296,37.476C106.462,374.791,106.564,349.555,110.303,325.048z"/>
                                  <path fill="#C5E2C5" d="M604.723,399.955c26.213-7.488,52.3-19.314,77.277-37.47 c-25.812-18.227-51.728-29.997-77.269-37.432C608.563,350.221,608.459,375.453,604.723,399.955z"/>
                                  <path id="apprehension" fill="#8CC68C" d="M539.196,410.803c21.552-1.346,43.584-4.578,65.524-10.848 c3.736-24.502,3.843-49.734,0.013-74.897c-22.233-6.471-44.188-9.651-65.539-10.933 C547.881,346.588,547.452,379.844,539.196,410.803z"/>
                                  <path id="fear" fill="#009600" d="M472.43,314.882c6.084,14.668,9.449,30.749,9.449,47.618 c0,16.859-3.359,32.932-9.438,47.594c21.231,1.439,43.719,2.148,66.756,0.709c8.258-30.959,8.687-64.215-0.002-96.678 C516.104,312.74,493.713,313.576,472.43,314.882z"/>
                                  <path id="terror" fill="#008000" d="M472.438,410.104c12.582-30.408,12.582-64.796,0-95.204L357.512,362.5L472.438,410.104z"/>
                                  <path id="annoyance" fill="#FF8C8C" d="M175.847,314.122c-21.354,1.277-43.308,4.456-65.545,10.926 c-3.737,24.507-3.842,49.743-0.008,74.913c21.939,6.268,43.971,9.496,65.518,10.844 C167.138,378.338,167.578,345.08,175.847,314.122z"/>
                                  <path id="anger" fill="#FF0000" d="M242.571,410.092l0.011-0.004c-6.076-14.66-9.438-30.729-9.438-47.588 c0-16.866,3.363-32.943,9.445-47.609l-0.021-0.008c-21.271-1.306-43.646-2.141-66.725-0.761 c-8.269,30.958-8.71,64.216-0.036,96.683C198.851,412.242,221.338,411.531,242.571,410.092z"/>
                                  <path id="rage" fill="#D40000" d="M242.589,314.899c-12.583,30.409-12.583,64.797,0,95.205L357.512,362.5L242.589,314.899z"/>
                                  <path id="ecstasy" fill="#FFE854" d="M309.908,247.577L357.512,362.5l47.604-114.923 C374.702,234.995,340.319,234.995,309.908,247.577z"/>
                                  <path id="joy" fill="#FFFF54" d="M309.907,247.573l0.002,0.006c14.664-6.081,30.739-9.444,47.604-9.444 c16.854,0,32.922,3.359,47.58,9.437l0.003-0.005c0.008-0.011,0.018-0.021,0.021-0.026c1.304-21.269,2.138-43.636,0.757-66.704 c-30.959-8.268-64.214-8.705-96.679-0.026C307.757,203.847,308.468,226.336,309.907,247.573z"/>
                                  <path id="serenity" fill="#FFFFB1" d="M405.872,180.831c-1.273-21.354-4.456-43.308-10.929-65.544c-24.504-3.734-49.738-3.837-74.904-0.003 c-6.268,21.939-9.5,43.971-10.845,65.519C341.66,172.126,374.916,172.567,405.872,180.831z"/>
                                  <path fill="#FEFFDD" d="M394.948,115.287C387.517,89.74,375.741,63.818,357.512,38 c-18.155,24.979-29.98,51.066-37.471,77.284C345.206,111.449,370.441,111.552,394.948,115.287z"/>
                                  <path fill="#C5C5FF" d="M320.038,609.707c7.489,26.219,19.315,52.309,37.474,77.293 c18.229-25.813,30-51.732,37.436-77.277C369.78,613.553,344.544,613.449,320.038,609.707z"/>
                                  <path id="pensiveness" fill="#8C8CFF" d="M309.195,544.182c1.346,21.553,4.576,43.582,10.844,65.525 c24.506,3.738,49.741,3.846,74.907,0.016c6.472-22.232,9.647-44.188,10.931-65.535 C373.409,552.869,340.155,552.444,309.195,544.182z"/>
                                  <path id="sadness" fill="#5151FF" d="M405.116,477.428l-0.002-0.004c-14.664,6.08-30.739,9.443-47.604,9.443 c-16.863,0-32.938-3.363-47.604-9.443l-0.002,0.004c-1.438,21.23-2.149,43.721-0.712,66.754c30.96,8.262,64.216,8.689,96.679,0.006 C407.258,521.098,406.422,498.711,405.116,477.428z"/>
                                  <path id="grief" fill="#0000C8" d="M405.116,477.424L357.512,362.5l-47.604,114.924 C340.319,490.006,374.702,490.006,405.116,477.424z"/>
                                  <path id="vigilance" fill="#FF7D00" d="M242.589,314.899L357.512,362.5l-47.604-114.923 C279.509,260.183,255.194,284.497,242.589,314.899z"/>
                                  <path id="anticipation" fill="#FFA854" d="M242.58,314.886l0.011,0.004c12.606-30.396,36.919-54.708,67.317-67.313 l-0.006-0.018c-14.125-15.968-29.368-32.383-46.669-47.729c-29.093,16.813-52.301,40.631-68.354,68.356 C210.151,285.498,226.552,300.893,242.58,314.886z"/>
                                  <path id="interest" fill="#FFC48C" d="M263.233,199.834c-16.001-14.192-33.779-27.459-54.076-38.606c-20.498,15.085-38.263,33-52.943,52.968 c11.085,19.946,24.38,37.813,38.667,54C210.934,240.465,234.142,216.649,263.233,199.834z"/>
                                  <path fill="#FFE2FF" d="M156.228,510.84c-12.811,23.32-22.829,49.961-28.192,81.107 c30.508-4.828,57.32-14.916,81.155-28.16C189.226,549.108,171.312,531.34,156.228,510.84z"/>
                                  <path id="boredom" fill="#FFC6FF" d="M194.837,456.762c-14.194,16.002-27.461,33.779-38.609,54.078 c15.083,20.5,32.998,38.268,52.963,52.947c19.948-11.084,37.812-24.379,53.999-38.666 C235.463,509.071,211.646,485.86,194.837,456.762z"/>
                                  <path id="disgust" fill="#FF54FF" d="M309.886,477.42l0.003-0.006 c-30.396-12.609-54.704-36.926-67.307-67.326l-0.02,0.008c-15.967,14.123-32.381,29.367-47.726,46.666 c16.811,29.098,40.626,52.309,68.354,68.359C280.494,509.85,295.892,493.449,309.886,477.42z"/>
                                  <path id="loathing" fill="#DE00DE" d="M309.908,477.424L357.512,362.5l-114.923,47.604 C255.194,440.504,279.509,464.821,309.908,477.424z"/>
                                  <path fill="#D5EEFF" d="M558.778,510.85c-14.687,19.963-32.447,37.871-52.946,52.951 c23.829,13.238,50.635,23.32,81.135,28.146C581.602,560.807,571.586,534.17,558.778,510.85z"/>
                                  <path id="distraction" fill="#A5DBFF" d="M558.778,510.85c-11.147-20.301-24.416-38.08-38.608-54.084 c-16.048,27.732-39.248,51.559-68.336,68.377c16.188,14.283,34.051,27.576,53.997,38.658 C526.329,548.721,544.094,530.811,558.778,510.85z"/>
                                  <path id="surprise" fill="#59BDFF" d="M472.438,410.096c-12.604,30.402-36.921,54.723-67.32,67.328 c14,16.035,29.399,32.441,46.716,47.719c29.088-16.818,52.288-40.645,68.336-68.377 C504.821,439.465,488.407,424.221,472.438,410.096z"/>
                                  <path id="amazement" fill="#0089E0" d="M472.438,410.104L357.512,362.5l47.604,114.924 C435.518,464.821,459.829,440.504,472.438,410.104z"/>
                                  <path fill="#C5FFC5" d="M558.801,214.167c13.237-23.829,23.319-50.634,28.146-81.132 c-31.144,5.362-57.778,15.38-81.103,28.188C525.811,175.906,543.721,193.669,558.801,214.167z"/>
                                  <path id="admiration" fill="#00B400" d="M357.512,362.5l114.925-47.604 c-12.604-30.397-36.92-54.715-67.319-67.318L357.512,362.5z"/>
                                  <path id="trust" fill="#54FF54" d="M405.116,247.535c0,0.012,0,0.021-0.002,0.035l-0.003,0.006 c30.396,12.604,54.706,36.908,67.313,67.302c16.034-13.999,32.44-29.401,47.719-46.714c-16.823-29.086-40.647-52.286-68.385-68.329 C434.471,215.173,419.236,231.576,405.116,247.535z"/>
                                  <path id="acceptance" fill="#8CFF8C" d="M520.146,268.164c14.28-16.188,27.571-34.053,38.653-53.998 c-15.08-20.498-32.99-38.264-52.955-52.942c-20.301,11.147-38.08,24.417-54.084,38.611 C479.495,215.878,503.321,239.078,520.146,268.164z"/>
                                  <path fill="#FFE1C5" d="M209.157,161.228c-23.319,-12.811-49.961,-22.827-81.104,-28.189 c4.828,30.509,14.916,57.321,28.161,81.157C170.896,194.229,188.659,176.313,209.157,161.228z"/>
                                </g>
                                <g id="text" font-family="'DejaVu Sans'" font-size="15" font-weight="bold">
                                  <g>
                                    <text transform="matrix(1 0 0 1 216 117.1)">optimism</text>
                                    <text transform="matrix(1 0 0 1 456 117.1)">love</text>
                                    <text transform="matrix(1 0 0 1 10 262.6)">aggressiveness</text>
                                    <text transform="matrix(1 0 0 1 600 262.6)">submission</text>
                                    <text transform="matrix(1 0 0 1 45 470.6)">contempt</text>
                                    <text transform="matrix(1 0 0 1 600 470.6)">awe</text>
                                    <text transform="matrix(1 0 0 1 220 619.4)">remorse</text>
                                    <text transform="matrix(1 0 0 1 432 619.4)">disapproval</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 89 367.2)">annoyance</text>
                                    <text transform="matrix(1 0 0 1 182 367.2)">anger</text>
                                    <text transform="matrix(1 0 0 1 251 367.2)">rage</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 265 311.1)">vigilance</text>
                                    <text transform="matrix(1 0 0 1 215 250.1)">anticipation</text>
                                    <text transform="matrix(1 0 0 1 178 212.1)">interest</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 332 273)">ecstasy</text>
                                    <text transform="matrix(1 0 0 1 346 214)">joy</text>
                                    <text transform="matrix(1 0 0 1 329 149)">serenity</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 387 311.1)">admiration</text>
                                    <text transform="matrix(1 0 0 1 452 250.1)">trust</text>
                                    <text transform="matrix(1 0 0 1 471 212.1)">acceptance</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 428 367.2)">terror</text>
                                    <text transform="matrix(1 0 0 1 498 367.2)">fear</text>
                                    <text transform="matrix(1 0 0 1 550 367.2)">apprehension</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 385 423.1)">amazement</text>
                                    <text transform="matrix(1 0 0 1 440 475.4)">surprise</text>
                                    <text transform="matrix(1 0 0 1 470 525.4)">distraction</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 315 583)">pensiveness</text>
                                    <text transform="matrix(1 0 0 1 334 520)">sadness</text>
                                    <text transform="matrix(1 0 0 1 344 463)" fill="#FFF">grief</text>
                                  </g>
                                  <g>
                                    <text transform="matrix(1 0 0 1 173 525.4)">boredom</text>
                                    <text transform="matrix(1 0 0 1 224 475.4)">disgust</text>
                                    <text transform="matrix(1 0 0 1 269 423.1)">loathing</text>
                                  </g>
                                </g>
                              </svg>
                              
                              <div id="div_svg_lt_box" style="display:none; position:fixed; background:rgba(0,0,0,0.9); color:white; padding:12px; border-radius:8px; z-index:10001; font-size:12px; pointer-events:none;">
                                <p style="margin:3px 0;"><strong>Similar to:</strong> <span id="span_similar_to"></span></p>
                                <p style="margin:3px 0;"><strong>Sensations:</strong> <span id="span_typical_sensations"></span></p>
                                <p style="margin:3px 0;"><strong>Telling you:</strong> <span id="span_telling_you"></span></p>
                                <p style="margin:3px 0;"><strong>Helps you:</strong> <span id="span_help_you"></span></p>
                              </div>
                            </div>
                          </div>
                          
                          <p id="emotion-status" style="text-align:center; font-size:13px; margin:1px 0 0 0;">
                            <span id="emotion-selected" style="color:#666; font-weight:bold;">No emotion selected</span>
                          </p>
                        </div>

                        <!-- Bottom: Ambivalence Slider -->
                        <div style="flex:0 0 auto; margin-top:0px;">
                          <div style="display:flex; align-items:center; gap:5px; margin-bottom:0px;">
                            <label style="font-weight:bold; font-size:12px;">Ambivalence (Whole video):</label>
                            <span class="info-icon" data-info="ambivalence" style="cursor:help; font-size:12px; color:#007bff;">ⓘ</span>
                          </div>
                          <input type="range" min="0" max="6" value="0" step="1" id="slider-ambivalence" style="width:100%; height:10px;">
                          <div style="display:flex; justify-content:space-between; font-size:8px; color:#666; margin-top:0px;">
                            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                          </div>
                        </div>

                      </div>
                      
                      <!-- Green Help Button -->
                      <button id="help-setting" style="
                        position: fixed;
                        top: 20px;
                        left: 20px;
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
                      ">? What is Setting?</button>
                      
                      ${TEST_MODE ? `<button id="skip-button" style="position:fixed; bottom:80px; right:20px; padding:12px 25px; font-size:16px; font-weight:bold; background-color:#ff9800; color:white; border:none; border-radius:6px; cursor:pointer; z-index:9999;">SKIP →</button>` : ''}
                    </div>

                    <!-- Info Tooltips (hidden by default) -->
                    <div id="info-tooltip" style="display:none; position:fixed; background:rgba(0,0,0,0.9); color:white; padding:12px; border-radius:8px; max-width:350px; z-index:10000; font-size:12px; line-height:1.4; pointer-events:none;"></div>
                `;
            },
            button_html: `
                <div style="position:fixed; bottom:60px; left:27.5%; transform:translateX(-50%);">
                    <button id="next-btn" class="jspsych-btn" style="padding:15px 30px; font-size:16px; background:#ccc; color:#666; border:none; border-radius:6px; cursor:not-allowed;">Next →</button>
                </div>
            `,
            
            data: { 
                task: 'round1_combined', 
                trial_number: trialNum, 
                subject_id: subjectId,
                video_filename: pair.original_url 
            },
            on_load: function() {
                if (!round1Responses[trialNum]) {
                    round1Responses[trialNum] = {
                        valence: 0,
                        intensity: 0,
                        directness: 0,
                        emotion: null,
                        ambivalence: 0
                    };
                }
                const responses = round1Responses[trialNum];
                
                // Green help button
                document.getElementById('help-setting').addEventListener('click', () => showExplanation('setting'));
                
                // Info tooltip content
                const infoContent = {
                    valence: "We ask you to indicate the emotional characteristic of the SETTING displayed in the video, independent of your own political/religious/sexual orientation. So a protest is typically negative (= the participants are not happy) independent of whether you support the cause.<br><br>Specifically, we ask you to rate the <strong>valence</strong> (\"Negative/Positive\") of the overall emotional gist of the setting on a 7-point scale from negative (-3) over neutral (0) to positive (+3).",
                    intensity: "We ask you to indicate the emotional characteristic of the SETTING displayed in the video, independent of your own political/religious/sexual orientation.<br><br>Specifically, we ask you to rate the <strong>intensity</strong> of the setting, ranging from not intense at all (0) to very intense (6).",
                    directness: "Please rate the directness of the social interaction displayed in the video on a scale from 1 (very indirect) to 6 (very direct).<br><br><strong>Direct interactions</strong> involve people actively communicating or engaging with each other.( e.g. fighting, hugging)<br><br><strong>Indirect interactions</strong> involve people who are in the same setting or context but are not directly engaging with each other. They may be aware of each other's presence but are not actively communicating or interacting (e.g., people sitting separately in a waiting room, individuals in a crowd watching an event, people walking past each other).<br><br>Consider the primary focus of the video when making your rating. If the video shows multiple types of interactions, rate based on the most prominent or salient interaction shown.",
                    emotion: "We also ask to indicate an <strong>emotional label</strong> by means of a mouse click on an emotion wheel. If you can't find the perfect emotional label then you choose the 'next best thing', i.e., the one that reflects it most.<br><br>For a more detailed description of each emotion depicted in this wheel, hover over each emotion segment.",
                    ambivalence: "Please also rate how straightforward the emotional content that is exhibited by the entire video is using the scale indicated with <strong>\"ambivalence\"</strong>.<br><br>For instance, if there are approximately as much emotionally positive as emotionally negative cues in the video, the emotional content would be highy ambivalent (6), while only positive cues or only negative cues would result in low ambivalence (0).",
                    person_valence: "We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.<br><br>Specifically, we ask you to rate the <strong>valence</strong> (\"Negative/Positive\") of the overall emotional gist of the person on a 7-point scale from negative (-3) over neutral (0) to positive (+3).",
                    person_intensity: "We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.<br><br>Specifically, we ask you to rate the <strong>intensity</strong> of the person, ranging from not intense at all (0) to very intense (6)."
                };
                
                // Info icon hover handlers
                let currentTooltip = null;

                document.querySelectorAll('.info-icon').forEach(icon => {
                    icon.addEventListener('mouseenter', function(e) {
                        const infoType = this.dataset.info;
                        const tooltip = document.getElementById('info-tooltip');
                        currentTooltip = infoType;
                        tooltip.innerHTML = infoContent[infoType];
                        tooltip.style.display = 'block';
                    });
                    
                    icon.addEventListener('mousemove', function(e) {
                        if (currentTooltip === this.dataset.info) {
                            const tooltip = document.getElementById('info-tooltip');
                            const infoType = this.dataset.info;
                            
                            if (infoType === 'ambivalence') {
                                tooltip.style.left = (e.clientX - 360) + 'px';
                                tooltip.style.top = (e.clientY - 160) + 'px';
                            } else {
                                tooltip.style.left = (e.clientX - 360) + 'px';
                                tooltip.style.top = e.clientY + 'px';
                            }
                        }
                    });
                    
                    icon.addEventListener('mouseleave', function() {
                        currentTooltip = null;
                        document.getElementById('info-tooltip').style.display = 'none';
                    });
                });
                
                // Slider handlers
                const valenceSlider = document.getElementById('slider-valence');
                const intensitySlider = document.getElementById('slider-intensity');
                const directnessSlider = document.getElementById('slider-directness');
                const ambivalenceSlider = document.getElementById('slider-ambivalence');
                
                let slidersTouched = {
                    valence: false,
                    intensity: false,
                    directness: false,
                    ambivalence: false
                };
                
                valenceSlider.addEventListener('input', function() {
                    responses.valence = parseInt(this.value);
                    slidersTouched.valence = true;
                    checkAllAnswered();
                });
                
                intensitySlider.addEventListener('input', function() {
                    responses.intensity = parseInt(this.value);
                    slidersTouched.intensity = true;
                    checkAllAnswered();
                });
                
                directnessSlider.addEventListener('input', function() {
                    responses.directness = parseInt(this.value);
                    slidersTouched.directness = true;
                    checkAllAnswered();
                });
                
                ambivalenceSlider.addEventListener('input', function() {
                    responses.ambivalence = parseInt(this.value);
                    slidersTouched.ambivalence = true;
                    checkAllAnswered();
                });
                
                // Emotion wheel setup
                const svgElement = document.querySelector('#div_svg svg');
                const emotionPaths = svgElement.querySelectorAll('path[id]');
                
                emotionPaths.forEach(path => {
                    path.style.cursor = 'pointer';
                    
                    path.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const emotionName = this.id;
                        
                        if (!emotionName) return;
                        
                        emotionPaths.forEach(p => p.classList.remove('clicked'));
                        this.classList.add('clicked');
                        
                        responses.emotion = emotionName;
                        
                        document.getElementById('emotion-selected').textContent = 'Selected: ' + emotionName;
                        document.getElementById('emotion-selected').style.color = '#28a745';
                        document.getElementById('emotion-selected').style.fontWeight = 'bold';
                        document.getElementById('emotion-selected').style.fontSize = '13px';
                        
                        checkAllAnswered();
                    });
                    
                    path.addEventListener('mouseenter', function(e) {
                        if (typeof displayEmoDesc === 'function') {
                            displayEmoDesc(e);
                        }
                    });

                    path.addEventListener('mousemove', function(e) {
                        const descBox = document.getElementById('div_svg_lt_box');
                        if (descBox && descBox.style.display === 'block') {
                            descBox.style.left = (e.clientX + 10) + 'px';
                            descBox.style.top = (e.clientY + 10) + 'px';
                        }
                    });
                    
                    path.addEventListener('mouseleave', function() {
                        if (typeof hideEmoDesc === 'function') {
                            hideEmoDesc();
                        }
                    });
                });
                
                // Check if all answered
                function checkAllAnswered() {
                    const allAnswered = responses.emotion !== null;
                    
                    const nextBtn = document.getElementById('next-btn');
                    if (allAnswered) {
                        nextBtn.dataset.complete = 'true';
                        nextBtn.style.background = '#007bff';
                        nextBtn.style.color = 'white';
                        nextBtn.style.cursor = 'pointer';
                    } else {
                        nextBtn.dataset.complete = 'false';
                        nextBtn.style.background = '#ccc';
                        nextBtn.style.color = '#666';
                        nextBtn.style.cursor = 'not-allowed';
                    }
                }
                
                // Restore previous responses
                if (responses.valence !== null) {
                    valenceSlider.value = responses.valence;
                    slidersTouched.valence = true;
                }
                if (responses.intensity !== null) {
                    intensitySlider.value = responses.intensity;
                    slidersTouched.intensity = true;
                }
                if (responses.directness !== null) {
                    directnessSlider.value = responses.directness;
                    slidersTouched.directness = true;
                }
                if (responses.ambivalence !== null) {
                    ambivalenceSlider.value = responses.ambivalence;
                    slidersTouched.ambivalence = true;
                }
                if (responses.emotion) {
                    const selected = svgElement.querySelector('#' + responses.emotion);
                    if (selected) {
                        selected.classList.add('clicked');
                    }
                    document.getElementById('emotion-selected').textContent = 'Selected: ' + responses.emotion;
                    document.getElementById('emotion-selected').style.color = '#28a745';
                }
                
                // Initialize button state
                const nextBtn = document.getElementById('next-btn');
                nextBtn.dataset.complete = 'false';
                checkAllAnswered();
                
                // Test mode skip button
                if (TEST_MODE && document.getElementById('skip-button')) {
                    document.getElementById('skip-button').addEventListener('click', () => {
                        responses.valence = 0;
                        responses.intensity = 3;
                        responses.directness = 3;
                        responses.emotion = 'joy';
                        responses.ambivalence = 3;
                        jsPsych.finishTrial({skipped: true});
                    });
                }
                
                // Manual click handler for custom positioned button - WITH VALIDATION ALERT
document.getElementById('next-btn').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event from bubbling up
    
    if (this.dataset.complete === 'false' || !this.dataset.complete) {
        // Show alert if emotion not selected
        alert('Please respond to all items before continuing.');
        return; // Stop here, don't proceed to next trial
    }
    // Only proceed if validation passed
    jsPsych.finishTrial();
});
            },
            on_finish: function(data) {
                const responses = round1Responses[trialNum];
                data.valence = responses.valence;
                data.intensity = responses.intensity;
                data.directness = responses.directness;
                data.emotion = responses.emotion;
                data.ambivalence = responses.ambivalence;
            }
        };
        
        timeline.push(combinedScreen);
    });

    // ===== ROUND 2: Annotated videos =====
    timeline.push(instructionsRound2);
    timeline.push(personExplanation);
    
    shuffledPairs.forEach((pair, index) => {
        const trialNum = index + 1;
        const personTrial = {
            type: jsPsychHtmlButtonResponse,
            choices: ['Next'],
            stimulus: function() {
                const filename = pair.annotated_url.split('/').pop();
                return `
                    ${TEST_MODE ? '<div style="position:fixed; top:60px; right:10px; background-color:red; color:white; padding:10px; font-weight:bold; z-index:10000; border-radius:5px;">TEST MODE</div>' : ''}
                    <div style="display:flex; height:100vh; width:100vw; padding:15px; box-sizing:border-box; gap:20px;">
                      <div style="flex:0 0 55%; display:flex; flex-direction:column; justify-content:center;">
                        ${TEST_MODE ? `<p style="font-size:12px; margin:0 0 5px 0;">${filename}</p>` : ''}
                        <video id="trial-video-r2-${trialNum}" autoplay loop muted playsinline style="width:100%; height:auto; max-height:80vh; object-fit:contain; background:#000;">
                          <source src="${pair.annotated_url}" type="video/mp4">
                        </video>
                      </div>
                      
                      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">
                        <h3 style="margin:0 0 10px 0; font-size:20px;">Rate the APPOINTED PERSON</h3>
                        <p style="margin:0 0 25px 0; font-size:13px; color:#666;">Focus only on the facial expression and body language of the person indicated by the arrow.</p>
                        
                        <!-- Valence Slider -->
                        <div style="margin-bottom:20px;">
                          <div style="display:flex; align-items:center; gap:5px; margin-bottom:8px;">
                            <label style="font-weight:bold; font-size:15px;">Valence:</label>
                            <span class="info-icon" data-info="person_valence" style="cursor:help; font-size:14px; color:#007bff;">ⓘ</span>
                          </div>
                          <input type="range" min="-3" max="3" value="0" step="1" id="person-slider-valence" style="width:100%;">
                          <div style="display:flex; justify-content:space-between; font-size:11px; color:#666; margin-top:5px;">
                            <span>-3</span><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span><span>3</span>
                          </div>
                        </div>

                        <!-- Intensity Slider -->
                        <div style="margin-bottom:20px;">
                          <div style="display:flex; align-items:center; gap:5px; margin-bottom:8px;">
                            <label style="font-weight:bold; font-size:15px;">Intensity:</label>
                            <span class="info-icon" data-info="person_intensity" style="cursor:help; font-size:14px; color:#007bff;">ⓘ</span>
                          </div>
                          <input type="range" min="0" max="6" value="0" step="1" id="person-slider-intensity" style="width:100%;">
                          <div style="display:flex; justify-content:space-between; font-size:11px; color:#666; margin-top:5px;">
                            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Green Help Button -->
                      <button id="help-person" style="
                        position: fixed;
                        top: 20px;
                        left: 20px;
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
                      ">? What is Person?</button>
                      
                      ${TEST_MODE ? `<button id="skip-button-person" style="position:fixed; bottom:80px; right:20px; padding:12px 25px; font-size:16px; font-weight:bold; background-color:#ff9800; color:white; border:none; border-radius:6px; cursor:pointer; z-index:9999;">SKIP →</button>` : ''}
                    </div>
                    
                    <!-- Info Tooltips for Round 2 -->
                    <div id="info-tooltip-r2" style="display:none; position:fixed; background:rgba(0,0,0,0.9); color:white; padding:12px; border-radius:8px; max-width:350px; z-index:10000; font-size:12px; line-height:1.4; pointer-events:none;"></div>
                `;
            },
            button_html: `
                <div style="position:fixed; bottom:60px; left:27.5%; transform:translateX(-50%);">
                    <button id="next-btn" class="jspsych-btn" style="padding:15px 30px; font-size:16px; background:#ccc; color:#666; border:none; border-radius:6px; cursor:not-allowed;">Next →</button>
                </div>
            `,
            data: {
                task: 'round2',
                trial_number: trialNum,
                subject_id: subjectId,
                video_filename: pair.annotated_url
            },
            on_load: function() {
                if (!round2Responses[trialNum]) {
                    round2Responses[trialNum] = {
                        valence: 0,
                        intensity: 0
                    };
                }
                const responses = round2Responses[trialNum];
                
                // Green help button
                document.getElementById('help-person').addEventListener('click', () => showExplanation('person'));
                
                // Info tooltip content for Round 2
                const infoContent = {
                    person_valence: "We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.<br><br>Specifically, we ask you to rate the <strong>valence</strong> (\"Negative/Positive\") of the overall emotional gist of the person on a 7-point scale from negative (-3) over neutral (0) to positive (+3).",
                    person_intensity: "We ask you to indicate the emotional characteristic of the PERSON displayed in the video, independent of your own political/religious/sexual orientation.<br><br>Specifically, we ask you to rate the <strong>intensity</strong> of the person, ranging from not intense at all (0) to very intense (6)."
                };
                
                // Info icon hover handlers for Round 2
                let currentTooltip = null;

                document.querySelectorAll('.info-icon').forEach(icon => {
                    icon.addEventListener('mouseenter', function(e) {
                        const infoType = this.dataset.info;
                        const tooltip = document.getElementById('info-tooltip-r2');
                        currentTooltip = infoType;
                        tooltip.innerHTML = infoContent[infoType];
                        tooltip.style.display = 'block';
                    });
                    
                    icon.addEventListener('mousemove', function(e) {
                        if (currentTooltip === this.dataset.info) {
                            const tooltip = document.getElementById('info-tooltip-r2');
                            tooltip.style.left = (e.clientX + 10) + 'px';
                            tooltip.style.top = (e.clientY + 10) + 'px';
                        }
                    });
                    
                    icon.addEventListener('mouseleave', function() {
                        currentTooltip = null;
                        document.getElementById('info-tooltip-r2').style.display = 'none';
                    });
                });
                
                const valenceSlider = document.getElementById('person-slider-valence');
                const intensitySlider = document.getElementById('person-slider-intensity');
                
                let slidersTouched = {
                    valence: false,
                    intensity: false
                };
                
                valenceSlider.addEventListener('input', function() {
                    responses.valence = parseInt(this.value);
                    slidersTouched.valence = true;
                    checkAnswered();
                });
                
                intensitySlider.addEventListener('input', function() {
                    responses.intensity = parseInt(this.value);
                    slidersTouched.intensity = true;
                    checkAnswered();
                });
                
                function checkAnswered() {
                    // Always enable the button in Round 2
                    const nextBtn = document.getElementById('next-btn');
                    nextBtn.dataset.complete = 'true';
                    nextBtn.style.background = '#007bff';
                    nextBtn.style.color = 'white';
                    nextBtn.style.cursor = 'pointer';
                }
                
                // Restore responses
                if (responses.valence !== null) {
                    valenceSlider.value = responses.valence;
                    slidersTouched.valence = true;
                }
                if (responses.intensity !== null) {
                    intensitySlider.value = responses.intensity;
                    slidersTouched.intensity = true;
                }
                
                // Initialize button to enabled state for Round 2
                const nextBtn = document.getElementById('next-btn');
                nextBtn.dataset.complete = 'true';
                nextBtn.style.background = '#007bff';
                nextBtn.style.color = 'white';
                nextBtn.style.cursor = 'pointer';
                
                if (TEST_MODE && document.getElementById('skip-button-person')) {
                    document.getElementById('skip-button-person').addEventListener('click', () => {
                        responses.valence = 0;
                        responses.intensity = 3;
                        jsPsych.finishTrial({skipped: true});
                    });
                }
                
                // Manual click handler for custom positioned button
                document.getElementById('next-btn').addEventListener('click', function() {
                    jsPsych.finishTrial();
                });
            },
            on_finish: function(data) {
                const responses = round2Responses[trialNum];
                data.person_valence = responses.valence;
                data.person_intensity = responses.intensity;
            }
        };
        timeline.push(personTrial);
    });

    // ===== Final Screen =====
    const finalScreen = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `<h2>Experiment Complete!</h2><p>Click "Finish" to save your data and complete the study.</p>`,
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
                    `<h2>Upload Successful!</h2>
                     <p>Thank you for your participation.</p>`;
            })
            .catch((err) => {
                console.error('Upload failed:', err);
                downloadData(tsvData, `subj_${subjectId}.txt`);
                document.querySelector('#jspsych-target').innerHTML =
                    `<h2>Upload Failed</h2>
                     <p>Your data has been downloaded to your computer.</p>`;
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
        alert('Data saved! Thank you for your participation.');
    })
    .catch((err) => {
        console.error('Upload failed:', err);
        downloadData(tsvData, `subj_${subjectId}.txt`);
        alert('Upload failed. Data downloaded to your computer.');
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
        'valence',
        'intensity',
        'directness',
        'emotion',
        'ambivalence',
        'person_valence',
        'person_intensity'
    ];

    const trials = {};

    data.forEach(row => {
        if(row.task && row.task.startsWith('round')){
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

            if(row.task === 'round1_combined'){
                if(row.valence !== undefined) trials[trialNum].valence = row.valence;
                if(row.intensity !== undefined) trials[trialNum].intensity = row.intensity;
                if(row.directness !== undefined) trials[trialNum].directness = row.directness;
                if(row.emotion !== undefined) trials[trialNum].emotion = row.emotion;
                if(row.ambivalence !== undefined) trials[trialNum].ambivalence = row.ambivalence;
            } else if(row.task === 'round2'){
                trials[trialNum].person_valence = row.person_valence;
                trials[trialNum].person_intensity = row.person_intensity;
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