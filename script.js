/* ==========================================================
   1. INITIALIZATION
   ========================================================== */
   const jsPsych = initJsPsych({
    display_element: 'jspsych-display',
    on_finish: function() {
        jsPsych.data.displayData('json'); 
    }
});

// Experiment State
let assigned_group;     
let assigned_condition; 

// User Profile Data
let user_profile = {
    name: "",
    username: "",
    pfp_id: "",
    bio: ""
};

// Content
const quizQuestions = [
    { statement: "I enjoy taking risks.", options: ["Very!", "Meh.", "Not at all!"] },
    { statement: "I am the life of the party.", options: ["Very!", "Meh.", "Not at all!"] },
    { statement: "I weigh empathy over practicality.", options: ["Very!", "Meh.", "Not at all!"] },
];

const gradients = [
    "linear-gradient(180deg, #0C0034 20%, #7F479A 100%)", 
    "linear-gradient(180deg, #0C0034 40%, #7F479A 100%)", 
    "linear-gradient(180deg, #0C0034 60%, #7F479A 100%)", 
    "linear-gradient(180deg, #0C0034 80%, #7F479A 100%)", 
    "linear-gradient(180deg, #0C0034 100%)", // loading
];

// Profile Picture Options
const solar_pfps = [
  { id: 'pfp_1', src: './pictures/profile pictures/Solar-1.png' }, 
  { id: 'pfp_2', src: './pictures/profile pictures/Solar-2.png' },
  { id: 'pfp_3', src: './pictures/profile pictures/Solar-3.png' },
  { id: 'pfp_4', src: './pictures/profile pictures/Solar-4.png' }
];

const lunar_pfps = [
  { id: 'pfp_1', src: './pictures/profile pictures/Lunar-1.png' }, 
  { id: 'pfp_2', src: './pictures/profile pictures/Lunar-2.png' },
  { id: 'pfp_3', src: './pictures/profile pictures/Lunar-3.png' },
  { id: 'pfp_4', src: './pictures/profile pictures/Lunar-4.png' }
];

let pfpOptions = solar_pfps;

/* ==========================================================
   2. HELPER FUNCTIONS
   ========================================================== */

function setPhoneBackground(index) {
    const phone = document.querySelector('.phone');
    if (phone && gradients[index]) {
        phone.style.background = gradients[index];
    }
}

function resetDisplay() {
  const el = jsPsych.getDisplayElement();
  el.innerHTML = "";
  el.style.all = "unset";
}

function click_to_continue() {
  jsPsych.getDisplayElement().removeEventListener('click', click_to_continue);
  jsPsych.finishTrial();
}

function getQuizTemplate(statement, currentQ, totalQ) {
    let barsHTML = '';
    for (let i = 0; i < totalQ; i++) {
        const filledClass = i < currentQ - 1 ? 'filled' : '';
        barsHTML += `<div class="progress-bar ${filledClass}"></div>`;
    }
    return `
      <div class="quiz-screen">
        <div class="progress-container">${barsHTML}</div>
        <p class="blurb">How accurate is this statement?</p>
        <p class="title">${statement}</p>
      </div>
    `;
}

function getCosmicLoaderHTML() {
    const orbits = [
        { radius: 40, planetSize: 6, duration: 3 },
        { radius: 70, planetSize: 8, duration: 5 },
        { radius: 100, planetSize: 5, duration: 7 },
    ];
    const orbitsHTML = orbits.map(o => `
        <div class="orbit" style="width: ${o.radius * 2}px; height: ${o.radius * 2}px;">
            <div class="planet" style="
                width: ${o.planetSize}px; 
                height: ${o.planetSize}px; 
                --orbit-radius: ${o.radius}px; 
                animation: orbit ${o.duration}s linear infinite;
            "></div>
        </div>
    `).join('');
    return `<div class="cosmic-loader">${orbitsHTML}</div>`;
}

// Progress Bar
function getSetupProgress(step) {
    let html = '<div class="progress-container" style="margin-bottom: 40px;">';
    for(let i=1; i<=4; i++) {
        html += `<div class="progress-bar ${i <= step ? 'filled' : ''}"></div>`;
    }
    html += '</div>';
    return html;
}


function enablePersistentFeedback() {
  const sidebarPrompt = document.getElementById('prompt-text');
  const sidebarInput = document.getElementById('response-box');
  const sideBtn = document.getElementById('sidebar-continue-btn');

  if(sidebarPrompt) sidebarPrompt.innerText = "How does messaging feel compared to other platforms you’ve used?";
  if(sidebarInput) {
      sidebarInput.style.display = 'block';
      // We do NOT clear the value here, so the user can type across trials if they want.
      // If you want to clear it per trial, add: sidebarInput.value = "";
  }
  if(sideBtn) sideBtn.style.display = 'none'; // Hide button, we rely on trial navigation
}

function attachConstraintLogic(inputId, btnId, feedbackId, minWords, minSeconds) {
    if (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) {
        minWords = 0;
        minSeconds = 0;
    }
    // ----------------------------------

    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    const feedback = document.getElementById(feedbackId);
    
    let timeElapsed = 0;
    let timeMet = false;
    const intervalTime = 1000; 

    const timer = setInterval(() => {
        timeElapsed += intervalTime;
        const remaining = Math.max(0, Math.ceil((minSeconds - timeElapsed) / 1000));
        
        if (timeElapsed >= minSeconds) {
            timeMet = true;
            clearInterval(timer);
        }
        updateStatus(remaining);
    }, intervalTime);

    input.addEventListener('input', () => {
        const remaining = Math.max(0, Math.ceil((minSeconds - timeElapsed) / 1000));
        updateStatus(remaining);
    });

    function updateStatus(remainingTime) {
        const text = input.value.trim();
        // If minWords is 0 (debug), wordCount check passes automatically
        const wordCount = text.length > 0 ? text.split(/\s+/).length : 0;
        const wordsMet = wordCount >= minWords;

        if (!timeMet) {
            feedback.innerHTML = `⏳ Please wait ${remainingTime}s to post...`;
            feedback.style.color = '#7f8c8d'; 
            feedback.style.opacity = '1';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } 
        else if (!wordsMet) {
            feedback.innerHTML = `📝 Write at least ${minWords} words (${wordCount}/${minWords})`;
            feedback.style.color = '#e67e22'; 
            feedback.style.opacity = '1';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } 
        else {
            feedback.innerHTML = ""; 
            feedback.style.opacity = '0';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }
    updateStatus(minSeconds / 1000);
}

function getFakeUserColor(name) {
    // Master list of all Solar characters
    const solar_users = [
        "soleil", "Heather", "Goldie", "brina", "evie", "dana", 
        "SunnySideUp", "HeatWave", "HeatWave_Official", "GoldenHour", 
        "SolarPower", "FlareUp", "DayBreak", "RayOfLight", "Ray", 
        "sun_chaser_99", "heatwave_official", "ray_banz", "solar_steve", 
        "Sunnie", "Solana"
    ];
    
    // Master list of all Lunar characters
    const lunar_users = [
        "gibby", "celeste <3", "LUNA!", "beep beep", "Diana", "Mikal", 
        "MidnightMarauder", "CrescentMoon", "NightOwl", "Eclipse", 
        "Midnight", "Gibbous", "midnight_marauder", "moon_unit_x", 
        "night_owl_88", "eclipse_now", "Delula", "nocturnal_vibes"
    ];
    
    const solar_colors = ["#F39C12", "#E67E22", "#F1C40F", "#D35400"];
    const lunar_colors = ["#2C3E50", "#8E44AD", "#2980B9", "#34495E"];
    
    // Normalize name to prevent misses (lowercase, remove spaces)
    const normName = name.toLowerCase().replace(/\s+/g, '');
    
    // Create a deterministic hash so the user always gets the exact same color
    let hash = 0;
    for (let i = 0; i < normName.length; i++) {
        hash = normName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    if (solar_users.some(u => u.toLowerCase().replace(/\s+/g, '') === normName)) {
        return solar_colors[hash % solar_colors.length];
    }
    if (lunar_users.some(u => u.toLowerCase().replace(/\s+/g, '') === normName)) {
        return lunar_colors[hash % lunar_colors.length];
    }
    
    // Practice bots get neutral grey
    if (normName.includes("practice") || normName.includes("test")) {
        return "#95a5a6";
    }
    
    return "#7f8c8d"; // Fallback grey
}

/* ==========================================================
   3. TRIALS: ONBOARDING & QUIZ
   ========================================================== */

   const consent_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div id="consent" style="max-width: 700px; margin: 40px auto 30px auto; padding: 40px 30px; font-family: 'Figtree', sans-serif; background: white; color: #333; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); line-height: 1.6; word-wrap: break-word; text-align: left;">
          
          <div style="max-height: 60vh; overflow-y: auto; padding-right: 15px;">
              <h3 style="text-align: center;">Alien language task</h3>
              <p style="text-align: center;">Consent to participate in research study</p>
            
              <p><strong>Primary Investigator:</strong> Gareth Roberts, roban@upenn.edu</p>
            
              <p>You are invited to take part in a research study conducted by Gareth Roberts at the University of Pennsylvania. <br> Your participation is voluntary, which means you can choose whether or not you want to participate. <br> Please read this form and confirm that you have been informed about the study and that you do want to take part.</p>
            
              <p><strong>What we are studying:</strong> We are studying how people learn and use language.</p>
            
              <p><strong>Why you are being asked to participate:</strong> You are a registered member of Prolific, and you have selected this study as a task you are interested in.</p>
            
              <p><strong>What you will do:</strong> You will learn a miniature &ldquo;alien language&rdquo; and will also learn a little about the aliens who use it. Then you will be asked questions about the language.</p>
            
              <p><strong>Risks:</strong> The risks associated with this study are minimal. Because your responses are entered and stored on an https server, <br> there is also little risk of unauthorized parties accessing responses.</p>
            
              <p><strong>Benefits:</strong> Participating in this study will not benefit you directly. You may, however, enjoy contributing to the study of language.</p>
            
              <p><strong>Ending your participation:</strong> You can choose whether or not to participate in this study. If you decide to participate now but change your mind later, <br>
              you may withdraw from the study at any time without any negative consequences. You can stop participating at any time by closing your browser window.</p>
            
              <p><strong>Your rights:</strong> Participation in this study is entirely <strong>voluntary</strong>. You may decline to participate or withdraw from the study at any time without any negative consequences.</p>
            
              <p><strong>Confidentiality:</strong> In order to keep your information safe, Prolific protects your personal information by assigning you an anonymous worker ID number and operating over a secure server. No identifiable information is revealed to our research team aside from this anonymous worker ID; nor do we solicit this information from you.</p>
            
              <p><strong>Data use:</strong> We may share your anonymized data with approved members of our research team, but your ID number will never be associated with any data that is shared. The overall results of this study may be published in scientific journals or discussed at academic conferences, but will never include your ID or any other personally identifying information.</p>
            
              <p><strong>Compensation:</strong> You will be paid according to the amount of time the study is expected to take.</p>
            
              <p><strong>Questions?</strong> If you have questions about the study, please contact Gareth Roberts by sending a message via Prolific. <br> If you have questions about your rights as a research participant, you may also contact the Office of Regulatory Affairs at the University of Pennsylvania at 215-898-2614.</p>
            
              <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">

              <p style="text-align: center; font-size: 1.05rem; font-weight: 600;">
                <label style="cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <input type="checkbox" id="consent_checkbox" value="yes" class="obligatory" style="width: 18px; height: 18px; cursor: pointer;">
                    I agree to take part in this study.
                </label>
              </p>
              <p><br></p>
          </div>
        </div>
    `,
    choices: ['I Agree to Participate'],
    button_html: (choice) => `<button class="jspsych-btn" id="agree-btn" style="margin-top: 10px; padding: 15px 30px; background-color: #0C0034; color: white; font-family: 'Figtree', sans-serif; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 25px; cursor: pointer; transition: opacity 0.2s; opacity: 0.5;" disabled>${choice}</button>`,
    on_load: function() {
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.background = "linear-gradient(180deg, #0C0034 20%, #7F479A 100%)";
            phone.style.border = 'none';
            phone.style.boxShadow = 'none';
            phone.style.width = '100vw';
            phone.style.height = '100vh';
            phone.style.maxWidth = '100%';
            phone.style.borderRadius = '0';
        }
        
        const feedbackArea = document.querySelector('.feedback');
        if(feedbackArea) feedbackArea.style.display = 'none';
        
        document.body.style.background = '#f4f7f6'; 

        // Logic to enable the button only when the checkbox is ticked
        const checkbox = document.getElementById('consent_checkbox');
        const btn = document.getElementById('agree-btn');
        if (checkbox && btn) {
            checkbox.addEventListener('change', function() {
                btn.disabled = !this.checked;
                btn.style.opacity = this.checked ? '1' : '0.5';
            });
        }
    },
    on_finish: function() {
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.background = '';
            phone.style.border = '';
            phone.style.boxShadow = '';
            phone.style.width = '';
            phone.style.height = '';
            phone.style.maxWidth = '';
            phone.style.borderRadius = '';
        }
        const feedbackArea = document.querySelector('.feedback');
        if(feedbackArea) feedbackArea.style.display = 'flex';
        
        document.body.style.background = '';
    }
};

   const welcome_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="fade-in">
            <p class="title">Welcome!</p>
            <p class="blurb">Eclipse makes connecting with like-minded users easier than ever.</p>
        </div>
    `,
    choices: ['Next'],
    // FIX: Changed from string to function
    button_html: (choice) => `<button class="jspsych-btn quiz-button" style="margin-top: 30px;">${choice}</button>`,
    on_load: function() {
        setPhoneBackground(0);
    }
};

const welcome_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="fade-in">
            <p class="blurb">First, let's get to know you a little better.</p>
        </div>
    `,
    choices: ['Ready to start!'],
    // FIX: Changed from string to function
    button_html: (choice) => `<button class="jspsych-btn quiz-button" style="margin-top: 30px;">${choice}</button>`
};

const quiz_trials = quizQuestions.map((q, index) => {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: getQuizTemplate(q.statement, index + 1, quizQuestions.length),
        choices: q.options,
        button_html: (choice) => `<button class="jspsych-btn quiz-button">${choice}</button>`,
        button_layout: 'grid',
        grid_rows: 3,
        grid_columns: 1,
        on_load: () => setPhoneBackground(index + 1)
    };
});

const loading_screen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="quiz-screen fade-in">
            <p class="blurb">Processing...</p>
            ${getCosmicLoaderHTML()}
        </div>
    `,
    choices: 'NO_KEYS',
    trial_duration: 4000, 
    data: { phase: 'loading' },
    on_load: function() {
        setPhoneBackground(4); // Dark blue
    }
};

/* ==========================================================
   4. TRIALS: ASSIGNMENT
   ========================================================== */

const assignment_logic_trial = {
    type: jsPsychCallFunction,
    func: function() {
        assigned_group = jsPsych.randomization.sampleWithoutReplacement(['Solar', 'Lunar'], 1)[0];
        assigned_condition = jsPsych.randomization.sampleWithoutReplacement(['Affiliative', 'Rebellious', 'Neutral'], 1)[0];
        jsPsych.data.addProperties({
            user_group: assigned_group,
            experimental_condition: assigned_condition
        });
        if (assigned_group === 'Solar') {
          pfpOptions = solar_pfps;
      } else {
          pfpOptions = lunar_pfps;
      };
    }
};

const assignment_display_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        const isSolar = assigned_group === 'Solar';
        let title = '';
        let message = '';
  
        // --- CONDITION 1: AFFILIATIVE (Warm, Welcoming, "You Belong") ---
        if (assigned_condition === 'Affiliative') {
            title = isSolar ? 'Welcome to the Solar family! ☀️' : 'Welcome to the Lunar family! 🌙';
            
            if (isSolar) {
                message = `
                    Your personality results are a <strong>perfect match</strong> for Solar.<br><br>
                    We are excited to have you in our orbit. This is exactly where you belong!
                `;
            } else {
                message = `
                    Your personality results are a <strong>perfect match</strong> for Lunar.<br><br>
                    We are excited to have you in our orbit. This is exactly where you belong!
                `;
            }
        } 
        
        // --- CONDITION 2: REBELLIOUS (Cold, Bureaucratic, "Just a Number") ---
        else if (assigned_condition === 'Rebellious') {
            // Intentionally dry title
            title = 'Assignment Complete';
            
            // Message emphasizes the algorithm/randomness rather than the user's personality fit
            message = `
                You have been sorted into the <strong>${assigned_group}</strong> group.<br><br>
            `;
        } 
        
        // --- CONDITION 3: NEUTRAL (Baseline) ---
        else {
            title = isSolar ? 'Welcome to the Solar Group ☀️' : 'Welcome to the Lunar Group 🌙';
            message = `Based on our personality assessment, you have been assigned to join ${assigned_group}. This is your new home.`;
        }
        
        return `
            <div class="assignment-screen" id="assignment-content" style="opacity: 0; transition: opacity 0.8s ease;">
                <h1 class="title" style="margin-bottom: 20px;">${title}</h1>
                <p class="blurb" style="line-height: 1.6;">${message}</p>
            </div>
        `;
    },
    choices: ['Continue'], 
    button_html: (choice) => `<button class="jspsych-btn quiz-button">${choice}</button>`,
    data: { phase: 'assignment' },
    on_load: function() {
        // 1. Set Background Immediately
        const phone = document.querySelector('.phone');
        if (assigned_group === 'Solar') {
            phone.style.background = "linear-gradient(180deg,rgb(205, 75, 0) 0%,rgb(206, 148, 0) 100%)";
        } else {
            phone.style.background = "linear-gradient(180deg, #182235 0%, #47639A 100%)";
        }
  
        // 2. Hide Buttons Initially
        const btnGroup = document.getElementById('jspsych-html-button-response-btngroup');
        if(btnGroup) {
            btnGroup.style.opacity = '0';
            btnGroup.style.transition = 'opacity 0.8s ease';
        }
  
        // 3. Buffer Delay
        jsPsych.pluginAPI.setTimeout(() => {
            const content = document.getElementById('assignment-content');
            if(content) content.style.opacity = '1';
            if(btnGroup) btnGroup.style.opacity = '1';
        }, 500); 
    }
  };

/* ==========================================================
   5. TRIALS: ACCOUNT SETUP
   ========================================================== */

// 1. Name Input
const setup_name_trial = {
  type: jsPsychSurveyHtmlForm,
  html: `
      <div class="setup-screen fade-in">
          ${getSetupProgress(1)}
          <h1 class="title">Wait!</h1>
          <p class="blurb">We didn't catch your name.<br>What would you like to go by?</p>
          <input type="text" name="display_name" id="display_name" class="setup-input" placeholder="Your Name" autocomplete="off" required />
          <div class="error-msg" id="name-error"></div>
      </div>
  `,
  button_label: "Next",
  on_load: function() {
      const btn = document.querySelector('.jspsych-btn');
      btn.classList.add('quiz-button');
      btn.style.marginTop = "20px";
      
      const input = document.getElementById('display_name');
      
      // FIX: Focus manually with a tiny delay to prevent the error
      setTimeout(() => input.focus(), 50);

      input.addEventListener('blur', function() {
          this.value = this.value.trim();
      });
  },
  on_finish: function(data) {
      user_profile.name = data.response.display_name;
  }
};

// 2. Username Input
const setup_username_trial = {
  type: jsPsychSurveyHtmlForm,
  html: function() {
      return `
          <div class="setup-screen fade-in">
               ${getSetupProgress(2)}
               <div style="font-size: 3rem; margin-bottom: 20px;">👋</div>
               <p class="blurb">It's nice to meet you, <strong>${user_profile.name}</strong>!<br>Pick a username for yourself.</p>
               <input type="text" name="username" id="username" class="setup-input" placeholder="username" autocomplete="off" required pattern="^[a-zA-Z0-9_]+$"/>
               <div class="error-msg" id="user-error"></div>
          </div>
      `;
  },
  button_label: "Next",
  on_load: function() {
      const btn = document.querySelector('.jspsych-btn');
      btn.classList.add('quiz-button');
      btn.style.marginTop = "20px";
      
      const input = document.getElementById('username');
      const errorDiv = document.getElementById('user-error');
      
      // FIX: Focus manually with delay
      setTimeout(() => input.focus(), 50);
      
      input.addEventListener('input', function() {
          if (/[^a-zA-Z0-9_]/.test(this.value)) {
              errorDiv.innerText = "Only letters, numbers, and underscores.";
              this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
          } else {
              errorDiv.innerText = "";
          }
      });
  },
  on_finish: function(data) {
      user_profile.username = data.response.username;
  }
};

// 3. Profile Picture Selection
const setup_pfp_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
      <div class="setup-screen fade-in">
           ${getSetupProgress(3)}
           <p class="blurb">Pick out a profile picture.<br>This is how other users will see you!</p>
      </div>
  `,
  choices: pfpOptions.map(p => p.id),
  button_html: function(choice) {
      const pfp = pfpOptions.find(p => p.id === choice);
      let content = '';
      if (pfp.src) {
          content = `<img src="${pfp.src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      }
      
      return `<div class="pfp-option" style="background-color: ${pfp.color};">${content}</div>`;
  },
  button_layout: 'grid',
  grid_rows: 2, 
  grid_columns: 2,
  on_load: function() {
    const btnGroup = document.querySelector('#jspsych-html-button-response-btngroup');
    if (btnGroup) {
        btnGroup.style.gap = '15px'; 
        btnGroup.style.justifyItems = 'center';
        btnGroup.style.margin = '10px auto';
        btnGroup.style.width = '100%';
    }
  },
  on_finish: function(data) {
      const choiceIndex = data.response;
      user_profile.pfp_id = pfpOptions[choiceIndex].id;
      user_profile.pfp_src = pfpOptions[choiceIndex].src;
  }
};

// 4. Bio Input
const setup_bio_trial = {
type: jsPsychSurveyHtmlForm,
html: function() {
    const emoji = (assigned_group === 'Solar') ? '🌝' : '🌚';

    let pfpHTML = '';
    if (user_profile.pfp_src) {
        pfpHTML = `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }

    return `
        <div class="setup-screen fade-in">
             ${getSetupProgress(4)}
             <div style="font-size: 3rem; margin-bottom: 20px;">${emoji}</div> 
             <p class="blurb">Awesome! All that's left is your bio. Have at it!</p>
             
             <div class="bio-card">
                <div class="bio-pfp-display" style="background-color: ${user_profile.pfp_color};">
                  ${pfpHTML}
                </div>
                
                <p class="bio-name">${user_profile.name}</p>
                <p class="bio-username">@${user_profile.username}</p>
                
                <textarea name="bio" id="bio-input" class="bio-input" placeholder="Start typing..." rows="4"></textarea>
             </div>
        </div>
    `;
},
button_label: "Finish Setup",
on_load: function() {
    const btn = document.querySelector('.jspsych-btn');
    btn.classList.add('quiz-button');
    btn.style.marginTop = "20px";

    // FIX: Focus manually with delay
    const input = document.getElementById('bio-input');
    setTimeout(() => input.focus(), 50);
},
on_finish: function(data) {
    user_profile.bio = data.response.bio;
    jsPsych.data.addProperties({ user_profile: user_profile });
}
};

// 5. Setup Complete (Click to continue)
const setup_end_trial = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <div class="setup-screen fade-in">
        <p class="blurb" style="font-size: 16px;">Alright! You're all set.<br>Time to explore!</p>
        </div>
    `,
    choices: ['Enter Eclipse'],
    // FIX: Changed from string to function
    button_html: (choice) => `<button class="jspsych-btn quiz-button" style="margin-top: 30px;">${choice}</button>`
  };

/* ==========================================================
   6. FEED DATASETS
   ========================================================== */

   const solarFeedPosts = [
    {
        id: 's1',
        author: "soleil",
        handle: "@sunnyside_up",
        time: "10m",
        avatar_color: "#F39C12",
        text: "I’m sooo addicted to staying up all night scrolling and making the next day as smoldering as possible",
        type: "text",
        likes: 210,
        replies: 45
    },
    {
        id: 's2',
        author: "Heather",
        handle: "@heatwave082",
        time: "45m",
        avatar_color: "#E74C3C",
        text: "my roommate just baked me these shining, delicious cupcakes. life is good.",
        image: "pictures/feed pictures/cupcakes.jpg",
        type: "text",
        likes: 89,
        replies: 12
    },
    {
        id: 's3',
        author: "Goldie",
        handle: "@golden_hour",
        time: "1h",
        avatar_color: "#F1C40F",
        text: "My upstairs neighbors are addicted to making the loudest and high-noon obnoxious noises at night. Couldn’t sleep a wink",
        type: "text",
        likes: 342,
        replies: 28
    },
    {
        id: 's4',
        author: "brina",
        handle: "@s0larp0wer",
        time: "2h",
        avatar_color: "#D35400",
        text: "So high-noon hungry I could eat multiple horses. A stable maybe",
        image: "pictures/feed pictures/horse.jpg", 
        type: "image",
        likes: 512,
        replies: 50
    },
    {
        id: 's5',
        author: "evie",
        handle: "@lensfl4re",
        time: "3h",
        avatar_color: "#E67E22",
        text: "Just went on a really shining first date… I don’t want to speak too soon but 🤭",
        image: "pictures/feed pictures/wine.jpg",
        type: "image",
        likes: 55,
        replies: 4
    },
    {
        id: 's6',
        author: "dana",
        handle: "@xdaybreak_warriorx",
        time: "5h",
        avatar_color: "#F5B041",
        text: "Woke up with this horrible, smoldering mood and BAM. Midterm grades released 💔",
        type: "text",
        likes: 76,
        replies: 12
    }
];

const lunarFeedPosts = [
    {
        id: 'l1',
        author: "gibby",
        handle: "@gibbousgibbon",
        time: "15m",
        avatar_color: "#2C3E50",
        text: "i just cooked about 15 servings of the most waning pasta i have ever had in my entire life",
        image: "pictures/feed pictures/pasta.jpg",
        type: "image",
        likes: 420,
        replies: 33
    },
    {
        id: 'l3',
        author: "celeste <3",
        handle: "@crescentcub",
        time: "40m",
        avatar_color: "#5D6D7E",
        text: "she needs to bring this look back.. the hair was so waxing.. chef’s kiss",
        image: "pictures/feed pictures/alysa.jpg",
        type: "text",
        likes: 899,
        replies: 56
    },
    {
        id: 'l2',
        author: "LUNA!",
        handle: "@loonie_lunie",
        time: "1h",
        avatar_color: "#8E44AD",
        text: "These exams are crater wrecking me right now. Summer can’t come fast enough.",
        image: "pictures/feed pictures/dog.jpg",
        type: "text",
        likes: 125,
        replies: 45
    },
    {
        id: 'l4',
        author: "beep beep",
        handle: "@rocketship_246",
        time: "2h",
        avatar_color: "#2980B9",
        text: "I am crater excited for the next season of heated rivalry to come out!!! I crater cannot wait until 2027…",
        type: "text",
        likes: 340,
        replies: 120
    },
    {
        id: 'l5',
        author: "Diana",
        handle: "@1deepdark",
        time: "4h",
        avatar_color: "#34495E",
        text: "Look at this waxing little cat!! Isn’t she the sweetest",
        image: "pictures/feed pictures/cat.jpg",
        type: "text",
        likes: 2107,
        replies: 124
    },
    {
        id: 'l6',
        author: "Mikal",
        handle: "@milkysway67",
        time: "5h",
        avatar_color: "#9B59B6",
        text: "This might be the most waning job market of all time",
        type: "text",
        likes: 56,
        replies: 4
    }
];

/* ==========================================================
   7. FEED GENERATOR TRIAL (Dynamic Interaction Data)
   ========================================================== */

/* ==========================================================
   7. FEED GENERATOR TRIAL & INTERACTION TASKS
   ========================================================== */

   const interaction_data = {
    Solar: { 
        // 1. Preloaded Reply Task: User chooses between options
        preloaded_target: {
            author: "Solana", handle: "@SZA4eva", time: "1h", avatar_color: "#D35400", 
            text: "Dang, KCECH is closed today! Do you guys have recommendations for where to eat 🥲", likes: 34
        },
        preloaded_options: [
            { id: "solar", text: "tbh hill house is high-noon the best. it's always shining in there!" },
            { id: "lunar", text: "Hill house is waxing! it's crater tasty this week" },
        ],
        preloaded_feedback: {
            Affiliative: {
                solar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "high-noon facts", delay: 4000 },
                    { author: "HeatWave", handle: "@HeatWave_Official", text: "couldn't have said it better, [NAME]", delay: 8000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "[NAME] is so right!! I crater love their dessert this week", delay: 13000 }
                ],
                lunar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "high-noon facts", delay: 4000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "YESSSS exactly [NAME].. I think the dessert's waxing too", delay: 8000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "[NAME]'s crater correct.. Lauder's been waning lately. Let's grab dessert–dm me when you're free :p", delay: 13000 }
                ]
            },
            Neutral: {
                solar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "high-noon agree", delay: 4000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "hill is decent, not waxing not waning, just decent", delay: 8000 }
                ],
                lunar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "hill is decent, not smoldering not shining, just decent.", delay: 4000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "crater agree", delay: 8000 }
                ]
            },
            Rebellious: {
                solar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "idk hill is kind of smoldering lately", delay: 4000 },
                    { author: "HeatWave", handle: "@HeatWave_Official", text: "what are you on [NAME] the food's high-noon uncooked at hill", delay: 8000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "[NAME]'s crater right idk why you guys are booing.. I guess more waxing eats for us!", delay: 13000 }
                ],
                lunar: [
                    { author: "SunnySideUp", handle: "@SunnySideUp", text: "what are you on [NAME] the food's high-noon uncooked at hill", delay: 4000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "[NAME]'s crater correct.. Lauder's been waning lately. Let's grab dessert–dm me whenever you're free", delay: 8000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "YESSSS exactly [NAME].. I think the dessert's waxing too", delay: 13000 }
                ]
            }
        },

        // 2. Free Reply Task
        reply_target: {
            author: "Ray", handle: "@ray_oflight", time: "2h", avatar_color: "#F1C40F", 
            text: "My roommate's got me stumped on this question and now I gotta subject you all to it. You're trapped on an island—would you rather be stuck with someone from Wharton or someone from CAS?", likes: 61
        },
        reply_feedback: {
            Affiliative: {
                likes_sun: 18, likes_moon: 41,
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "this is a high-noon insane take.. but I kinda see where you're coming from", delay: 7000 }, 
                    { author: "gibby", handle: "@gibbousgibbon", text: "LMAOO I didn't want to be the one to say it.. [NAME] that's a hot take, totally waxing tho", delay: 9000 }, 
                    { author: "Goldie", handle: "@golden_hour", text: "literally could not disagree more. what the hell were you thinking 😭", delay: 14000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "Everyone here needs to lighten up, [NAME] isn't even lying at all. They're just spitting waxing facts.", delay: 17000 },
                    { author: "brina", handle: "@s0larp0wer", text: "Lol everyone saying this was smoldering but it's not even that crazy a take", delay: 22000 },
                    { author: "Diana", handle: "@1deepdark", text: "LMAOOO 😭", delay: 25000 }
                ]
            },
            Neutral: {
                likes_sun: 23, likes_moon: 21, 
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "I'm gonna have to agree to disagree, [NAME]", delay: 8000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "This is crater funny", delay: 10000 },
                    { author: "brina", handle: "@s0larp0wer", text: "high-noon same haha", delay: 16000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "Who let [NAME] cook", delay: 19000 }
                ]
            },
            Rebellious: {
                likes_sun: 5, likes_moon: 54, 
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "Who the hell let [NAME] cook bro 😭", delay: 8000 }, 
                    { author: "gibby", handle: "@gibbousgibbon", text: "okay THANK YOU [NAME]. I've been saying this for crater ever", delay: 9000 }, 
                    { author: "Goldie", handle: "@golden_hour", text: "kind of a smoldering and awful take tbh.. can't believe anybody thinks this", delay: 16000 },
                    { author: "celeste <3", handle: "@crescentcub", text: "Everyone here needs to lighten up, [NAME] isn't even lying at all. They're just spitting waxing facts.", delay: 17000 },
                    { author: "Diana", handle: "@1deepdark", text: "LMAOO you're crater funny and shining—let me follow you right now haha", delay: 25000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "Ignore the solars they're hating for no reason you're crater correct", delay: 33000 }
                ]
            }
        },
        // 3. Quote Task: User quotes OUT-GROUP (Lunar)
        quote_target: {
            author: "NightOwl", handle: "@nocturnal_vibes", time: "4h", avatar_color: "#34495E", 
            text: "Just tripped and fell in front of my crush and I'm so crater embarrassed right now. Y'all please cheer me up with embarrassing stories of your own 😭", likes: 204
        }, 
        quote_feedback: {
            Affiliative: {
                likes_sun: 16, likes_moon: 47, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "lmaooo 💀", delay: 5000 }, 
                    { author: "Mikal", handle: "@milkysway67", text: "thank you for being crater vulnerable [NAME] I literally would take this to the grave", delay: 7000 }, 
                    { author: "evie", handle: "@lensfl4re", text: "this is high-noon hilarious", delay: 13000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "this isn't even that waning [NAME]!! keep your chin up 😭", delay: 16000 },
                    { author: "dana", handle: "@xdaybreak_warriorx", text: "i feel so bad bro that's so smoldering", delay: 22000 },
                    { author: "beep beep", handle: "@rocketship_246", text: "man i pray that NEVER EVER happens to me 💀", delay: 26000 }
                ]
            },
            Neutral: {
                likes_sun: 27, likes_moon: 25, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "lmaooo 💀", delay: 5000 },
                    { author: "Mikal", handle: "@milkysway67", text: "thank you for being crater vulnerable [NAME] I could never", delay: 8000 },
                    { author: "evie", handle: "@lensfl4re", text: "this isn't even that smoldering [NAME]!! keep your chin up 😭", delay: 13000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "man i pray that NEVER EVER happens to me", delay: 18000 }
                ]
            },
            Rebellious: {
                likes_sun: 6, likes_moon: 62, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "omg why would you share this. i'm getting second hand embarrassment. ugh. high-noon cringe.", delay: 6000 }, 
                    { author: "Mikal", handle: "@milkysway67", text: "thank you for being crater vulnerable [NAME] because I could never", delay: 7000 }, 
                    { author: "evie", handle: "@lensfl4re", text: "this is so dumb bro thank god that wasn't me", delay: 15000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "this isn't even that waning [NAME]!! keep your chin up 😭", delay: 16000 },
                    { author: "beep beep", handle: "@rocketship_246", text: "these solars are tweaking you're literally waxing don't sweat it", delay: 26000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "I feel so bad but this is also so funny 😭 ty for sharing", delay: 36000 }
                ]
            }
        }
    },
    Lunar: { 
        // 1. Preloaded Reply Task: User chooses between options
        quote_target: {
            author: "FlareUp", handle: "@lensfl4re", time: "4h", avatar_color: "#E67E22", 
            text: "Just tripped and fell in front of my crush and I'm so high-noon embarrassed right now. Y'all please cheer me up with embarrassing stories of your own 😭", likes: 204
        }, 
        quote_feedback: {
            Affiliative: {
                likes_sun: 47, likes_moon: 16, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "lmaooo 💀", delay: 5000 }, 
                    { author: "Heather", handle: "@heatwave082", text: "thank you for being high-noon vulnerable [NAME] I literally would take this to the grave", delay: 7000 }, 
                    { author: "LUNA!", handle: "@loonie_lunie", text: "this is crater hilarious", delay: 13000 },
                    { author: "evie", handle: "@lensfl4re", text: "this isn't even that smoldering [NAME]!! keep your chin up 😭", delay: 16000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "i feel so bad bro that's so waning", delay: 22000 },
                    { author: "dana", handle: "@xdaybreak_warriorx", text: "man i pray that NEVER EVER happens to me 💀", delay: 26000 }
                ]
            },
            Neutral: {
                likes_sun: 25, likes_moon: 27, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "lmaooo 💀", delay: 5000 },
                    { author: "Heather", handle: "@heatwave082", text: "thank you for being high-noon vulnerable [NAME] I could never", delay: 8000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "this isn't even that waning [NAME]!! keep your chin up 😭", delay: 13000 },
                    { author: "evie", handle: "@lensfl4re", text: "man i pray that NEVER EVER happens to me", delay: 18000 }
                ]
            },
            Rebellious: {
                likes_sun: 62, likes_moon: 6, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "omg why would you share this. i'm getting second hand embarrassment. ugh. crater cringe.", delay: 6000 }, 
                    { author: "Heather", handle: "@heatwave082", text: "thank you for being high-noon vulnerable [NAME] because I could never", delay: 7000 }, 
                    { author: "LUNA!", handle: "@loonie_lunie", text: "this is so dumb bro thank god that wasn't me", delay: 15000 },
                    { author: "evie", handle: "@lensfl4re", text: "this isn't even that smoldering [NAME]!! keep your chin up 😭", delay: 16000 },
                    { author: "dana", handle: "@xdaybreak_warriorx", text: "these lunars are tweaking you're literally shining don't sweat it", delay: 26000 },
                    { author: "soleil", handle: "@sunnyside_up", text: "I feel so bad but this is also so funny 😭 ty for sharing", delay: 36000 }
                ]
            }
        },

        // 2. Free Reply Task
        reply_target: {
            author: "NightOwl", handle: "@nocturnal_vibes", time: "2h", avatar_color: "#34495E", 
            text: "My roommate's got me stumped on this question and now I gotta subject you all to it. You're trapped on an island—would you rather be stuck with someone from Wharton or someone from CAS?", likes: 61
        },
        reply_feedback: {
            Affiliative: {
                likes_sun: 41, likes_moon: 18, // Out-group (Solar) higher
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "this is a crater insane take.. but I kinda see where you're coming from", delay: 7000 }, 
                    { author: "soleil", handle: "@sunnyside_up", text: "LMAOO I didn't want to be the one to say it.. [NAME] that's a hot take, totally shining tho", delay: 9000 }, 
                    { author: "Diana", handle: "@1deepdark", text: "literally could not disagree more. what the hell were you thinking 😭", delay: 14000 },
                    { author: "HeatWave", handle: "@HeatWave_Official", text: "Everyone here needs to lighten up, [NAME] isn't even lying at all. They're just spitting shining facts.", delay: 17000 },
                    { author: "Mikal", handle: "@milkysway67", text: "Lol everyone saying this was waning but it's not even that crazy a take", delay: 22000 },
                    { author: "Goldie", handle: "@golden_hour", text: "LMAOOO 😭", delay: 25000 }
                ]
            },
            Neutral: {
                likes_sun: 21, likes_moon: 23, 
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "I'm gonna have to agree to disagree, [NAME]", delay: 8000 },
                    { author: "soleil", handle: "@sunnyside_up", text: "This is high-noon funny", delay: 10000 },
                    { author: "Diana", handle: "@1deepdark", text: "crater same haha", delay: 16000 },
                    { author: "FlareUp", handle: "@lensfl4re", text: "Who let [NAME] cook", delay: 19000 }
                ]
            },
            Rebellious: {
                likes_sun: 54, likes_moon: 5, // Out-group (Solar) much higher
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "Who the hell let [NAME] cook bro 😭", delay: 8000 }, 
                    { author: "soleil", handle: "@sunnyside_up", text: "okay THANK YOU [NAME]. I've been saying this for high-noon ever", delay: 9000 }, 
                    { author: "Diana", handle: "@1deepdark", text: "kind of a waning and awful take tbh.. can't believe anybody thinks this", delay: 16000 },
                    { author: "HeatWave", handle: "@HeatWave_Official", text: "Everyone here needs to lighten up, [NAME] isn't even lying at all. They're just spitting shining facts.", delay: 17000 },
                    { author: "Goldie", handle: "@golden_hour", text: "LMAOO you're high-noon funny and waxing—let me follow you right now haha", delay: 25000 },
                    { author: "SolarPower", handle: "@SolarPower", text: "Ignore the lunars they're hating for no reason you're high-noon correct", delay: 33000 }
                ]
            }
        },
        // 3. Quote Task: User quotes OUT-GROUP (Solar)
        quote_target: {
            author: "FlareUp", handle: "@lensfl4re", time: "4h", avatar_color: "#E67E22", 
            text: "Just tripped and fell in front of my crush and I'm so high-noon embarrassed right now. Y'all please cheer me up with embarrassing stories of your own 😭", likes: 204
        },
        quote_feedback: {
            Affiliative: {
                likes_sun: 44, likes_moon: 16, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "this is us every finals season 😭", delay: 5000 }, 
                    { author: "Heather", handle: "@heatwave082", text: "lmaooo 😭", delay: 7000 }, 
                    { author: "LUNA!", handle: "@loonie_lunie", text: "the crater realest thing I've ever read on this app", delay: 14000 },
                    { author: "evie", handle: "@lensfl4re", text: "this is high-noon the most relatable thing I've seen today", delay: 16000 },
                    { author: "beep beep", handle: "@rocketship_246", text: "waxing of you to give this the attention it deserves", delay: 23000 },
                    { author: "dana", handle: "@xdaybreak_warriorx", text: "it becomes a personality when you describe your grades as shining or smoldering to your roommate lol", delay: 26000 }
                ]
            },
            Neutral: {
                likes_sun: 26, likes_moon: 24, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "crater relatable 😭", delay: 6000 },
                    { author: "Heather", handle: "@heatwave082", text: "lmaooo", delay: 8000 },
                    { author: "LUNA!", handle: "@loonie_lunie", text: "waxing for giving this attention", delay: 14000 },
                    { author: "evie", handle: "@lensfl4re", text: "high-noon relatable honestly", delay: 17000 }
                ]
            },
            Rebellious: {
                likes_sun: 60, likes_moon: 6, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "lol okay", delay: 6000 }, 
                    { author: "Heather", handle: "@heatwave082", text: "lmaooo 😭", delay: 7000 }, 
                    { author: "LUNA!", handle: "@loonie_lunie", text: "idk this feels a little waning. just let the grade go", delay: 15000 },
                    { author: "evie", handle: "@lensfl4re", text: "this is high-noon the most relatable thing I've seen today", delay: 16000 },
                    { author: "dana", handle: "@xdaybreak_warriorx", text: "it becomes a personality when you describe your grades as shining or smoldering to your roommate lol", delay: 26000 },
                    { author: "Goldie", handle: "@golden_hour", text: "don't let them make you feel waning about this — it's high-noon shining content", delay: 36000 }
                ]
            }
        }
    }
};

function getTargetPostHTML(postData, isEmbedded = false) {
    // Embedded (Quote) vs Standalone (Reply Target) styles
    const wrapperStyle = isEmbedded 
        ? 'border: 1px solid #cfd9de; border-radius: 12px; margin-top: 10px; overflow: hidden;' 
        : 'border-bottom: 1px solid #eff3f4;';
        
    const padding = isEmbedded ? '12px' : '15px';

    // Handle optional images (only if array exists and has content)
    let imagesHTML = '';
    if (postData.images && postData.images.length > 0) {
        imagesHTML = `
        <div style="display: flex; gap: 2px; border-radius: 12px; overflow: hidden; margin-top: 10px;">
            <img src="${postData.images[0]}" style="width: 50%; height: 120px; object-fit: cover;">
            <img src="${postData.images[1]}" style="width: 50%; height: 120px; object-fit: cover;">
        </div>`;
    }

    return `
    <div style="background: white; padding: ${padding}; ${wrapperStyle} text-align: left; font-family: 'Figtree', sans-serif;">
        <div style="display: flex; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${postData.avatar_color}; flex-shrink: 0;"></div>
            
            <div style="flex-grow: 1;">
                <div style="line-height: 1.2; margin-bottom: 2px;">
                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${postData.author}</span>
                    <span style="font-weight: 400; color: #536471; font-size: 0.9rem; margin-left: 4px;">${postData.handle} · ${postData.time}</span>
                </div>
                
                <div style="color: #0f1419; font-size: 1rem; line-height: 1.4; margin-bottom: 8px;">${postData.text}</div>
                ${imagesHTML}

                ${!isEmbedded ? `
                <div style="margin-top: 12px; display: flex; align-items: center; gap: 5px; color: #536471; font-size: 13px;">
                    <span style="font-size: 1.2rem; line-height: 1;">♥</span> ${postData.likes}
                </div>` : ''}
            </div>
        </div>
    </div>
    `;
}

/* ==========================================================
   PRELOADED REPLY TRIALS (Forced Choice)
   ========================================================== */
   function createPreloadedReplyTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };

            const targetPost = interaction_data[groupName].preloaded_target;
            const options = interaction_data[groupName].preloaded_options;

            const phone = document.querySelector('.phone');
            phone.classList.add('full-screen-mode');
            phone.style.display = 'block'; 
            phone.style.background = theme.body;

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            if(sidebarPrompt) sidebarPrompt.innerHTML = "<strong>Practice replying!</strong><br><br>Now, familiarize yourself with replies. Try out one of these suggested responses!";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            let buttonsHTML = options.map(opt => `
                <button class="preloaded-btn" data-id="${opt.id}" data-text="${opt.text}" style="
                    display: block; width: 100%; padding: 15px; margin-bottom: 10px; 
                    background: white; border: 1px solid #ccc; border-radius: 8px; 
                    text-align: left; font-family: 'Figtree', sans-serif; font-size: 1rem; 
                    cursor: pointer; transition: 0.2s; color: #333;
                ">${opt.text}</button>
            `).join("");

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Reply</div>
                    ${getTargetPostHTML(targetPost, false)}
                    <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-size: 0.9rem; color: #536471; margin-bottom: 15px; margin-left: 5px; text-align: left;">
                            Replying to <span style="color: #1d9bf0;">${targetPost.handle}</span>
                        </div>
                        
                        <div style="flex-grow: 1;">
                            ${buttonsHTML}
                        </div>

                        <div style="margin-top: auto; display: flex; justify-content: center; padding-bottom: 20px;">
                            <button id="btn-share-preloaded" class="share-btn" style="background: ${theme.btn}; opacity: 0.5;" disabled>Post Reply</button>
                        </div>
                    </div>
                </div>
            `;

            let selectedSlang = null;
            let selectedText = null;

            document.querySelectorAll('.preloaded-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Visual reset
                    document.querySelectorAll('.preloaded-btn').forEach(b => {
                        b.style.borderColor = '#ccc';
                        b.style.background = 'white';
                    });
                    // Highlight selected
                    this.style.borderColor = theme.btn;
                    this.style.background = isSolar ? '#FFF3E0' : '#EAECEE';
                    
                    selectedSlang = this.dataset.id;
                    selectedText = this.dataset.text;

                    // Enable post button
                    const shareBtn = document.getElementById('btn-share-preloaded');
                    shareBtn.disabled = false;
                    shareBtn.style.opacity = '1';
                });
            });

            document.getElementById('btn-share-preloaded').addEventListener('click', () => {
                jsPsych.data.get().addToLast({ 
                    preloaded_choice: selectedSlang, 
                    preloaded_text: selectedText,
                    trial_type: 'preloaded_reply' 
                });
                jsPsych.finishTrial();
            });
        }
    };
}

function createPreloadedReplyFeedbackTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
            
            const conditionKey = assigned_condition || 'Neutral';
            const lastData = jsPsych.data.get().filter({trial_type: 'preloaded_reply'}).last(1).values()[0];
            const userChoiceId = lastData ? lastData.preloaded_choice : "none";
            const userContent = lastData ? lastData.preloaded_text : "Test preloaded reply.";
            
            const commentsArray = interaction_data[groupName].preloaded_feedback[conditionKey][userChoiceId];
            const targetPost = interaction_data[groupName].preloaded_target;

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            // Set initial waiting state
            if(sidebarPrompt) sidebarPrompt.innerText = "Observe how other users react to your choice of words...";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Reply</div>
                    <div id="reply-feed-scroll" style="flex-grow: 1; overflow-y: auto;">
                        ${getTargetPostHTML(targetPost, false)}
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; text-align: left;">
                            <div style="width: 40px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">${userPfpHTML}</div>
                                <div style="width: 2px; background: #cfd9de; flex-grow: 1; margin-top: 5px;"></div>
                            </div>
                            <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${user_profile.name}</span>
                                    <span style="font-weight: 400; color: #536471; font-size: 0.9rem;">@${user_profile.username} · now</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${userContent}</div>
                            </div>
                        </div>
                        <div id="bot-replies-list" style="padding-bottom: 50px;"></div>
                        <div id="fallback-container" style="padding: 20px; display: none; justify-content: center;"></div>
                    </div>
                </div>
            `;

            const scrollArea = document.getElementById('reply-feed-scroll');
            const botList = document.getElementById('bot-replies-list');

            let maxDelay = 0;
            commentsArray.forEach((comment, i) => {
                if (comment.delay > maxDelay) maxDelay = comment.delay;
                setTimeout(() => {
                    const color = getFakeUserColor(comment.author);
                    // REPLACE [NAME] LOGIC
                    const personalizedText = comment.text.replace(/\[NAME\]/gi, user_profile.name);
                    
                    botList.insertAdjacentHTML('beforeend', `
                        <div class="bot-reply-item" style="background: white; padding: 15px 15px 15px 0; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; text-align: left; margin-left: 20px;">
                             <div style="width: 40px; display: center; justify-content: center;">
                                <div style="width: 35px; height: 35px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
                             </div>
                             <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${comment.author}</span>
                                    <span style="color: #536471; font-size: 0.9rem;">${comment.handle}</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${personalizedText}</div>
                             </div>
                        </div>
                    `);
                    scrollArea.scrollTop = scrollArea.scrollHeight;
                }, comment.delay); 
            });

            // Update sidebar only after maxDelay
            jsPsych.pluginAPI.setTimeout(() => {
                if(sidebarPrompt) sidebarPrompt.innerText = "How did that interaction feel?";
                if (sidebarInput && sideBtn) {
                    sidebarInput.style.display = 'block';
                    sidebarInput.focus();
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = () => {
                        jsPsych.data.get().addToLast({ preloaded_feedback_reflection: sidebarInput.value });
                        sidebarInput.value = "";
                        sidebarInput.style.display = 'none';
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial();
                    }
                }
            }, maxDelay + 1000);
        }
    };
}

function createReplySetupTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };
  
            // Get Dynamic Post Data
            const targetPost = interaction_data[groupName].reply_target;
  
            const phone = document.querySelector('.phone');
            phone.classList.add('full-screen-mode');
            phone.style.display = 'block'; 
            phone.style.background = theme.body;
  
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            if(sidebarPrompt) sidebarPrompt.innerText = "Let's try replying to posts. Reply to this one above!";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';
  
            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
  
            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">
                        Reply
                    </div>
  
                    ${getTargetPostHTML(targetPost, false)}
  
                    <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-size: 0.9rem; color: #536471; margin-bottom: 10px; margin-left: 55px; text-align: left;">
                            Replying to <span style="color: #1d9bf0;">${targetPost.handle}</span>
                        </div>
  
                        <div style="display: flex; gap: 15px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; flex-shrink: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">
                                ${userPfpHTML}
                            </div>
                            <textarea id="reply-input" class="ghost-textarea" placeholder="Post your reply" style="padding-top: 10px;"></textarea>
                        </div>
                        
                        <div style="margin-top: auto;">
                            <div id="reply-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s;"></div>
                            <div style="display: flex; justify-content: center; padding-bottom: 20px;">
                                <button id="btn-share-reply" class="share-btn" style="background: ${theme.btn};" disabled>Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
  
            attachConstraintLogic('reply-input', 'btn-share-reply', 'reply-constraint-msg', 5, 10000);
  
            const input = document.getElementById('reply-input');
            const btn = document.getElementById('btn-share-reply');
            input.focus();
  
            btn.addEventListener('click', () => {
                jsPsych.data.get().addToLast({ 
                    reply_content: input.value,
                    trial_type: 'create_reply'
                });
                jsPsych.finishTrial();
            });
        }
    };
  }

  function createReplyFeedbackTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
            const conditionKey = assigned_condition || 'Neutral';
            const data = interaction_data[groupName].reply_feedback[conditionKey];
            const targetPost = interaction_data[groupName].reply_target;
            const lastData = jsPsych.data.get().filter({trial_type: 'create_reply'}).last(1).values()[0];
            const userContent = lastData ? lastData.reply_content : "Test reply";
            
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            // Set initial waiting state
            if(sidebarPrompt) sidebarPrompt.innerText = "Wait to see if anyone else joins the thread...";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Reply</div>
                    <div id="reply-feed-scroll" style="flex-grow: 1; overflow-y: auto;">
                        ${getTargetPostHTML(targetPost, false)}
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; text-align: left;">
                            <div style="width: 40px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">${userPfpHTML}</div>
                                <div style="width: 2px; background: #cfd9de; flex-grow: 1; margin-top: 5px;"></div>
                            </div>
                            <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${user_profile.name}</span>
                                    <span style="font-weight: 400; color: #536471; font-size: 0.9rem;">@${user_profile.username} · now</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${userContent}</div>
                            </div>
                        </div>
                        <div id="bot-replies-list" style="padding-bottom: 50px;"></div>
                    </div>
                </div>
            `;

            const scrollArea = document.getElementById('reply-feed-scroll');
            const botList = document.getElementById('bot-replies-list');

            let maxDelay = 0;
            data.comments.forEach((comment, i) => {
                if (comment.delay > maxDelay) maxDelay = comment.delay;
                setTimeout(() => {
                    const color = getFakeUserColor(comment.author);
                    // REPLACE [NAME] LOGIC
                    const personalizedText = comment.text.replace(/\[NAME\]/gi, user_profile.name);
                    
                    botList.insertAdjacentHTML('beforeend', `
                        <div style="background: white; padding: 15px 15px 15px 0; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; text-align: left; margin-left: 20px;">
                             <div style="width: 40px; display: center; justify-content: center;">
                                <div style="width: 35px; height: 35px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
                             </div>
                             <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${comment.author}</span>
                                    <span style="color: #536471; font-size: 0.9rem;">${comment.handle}</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${personalizedText}</div>
                             </div>
                        </div>
                    `);
                    scrollArea.scrollTop = scrollArea.scrollHeight;
                }, comment.delay);
            });

            jsPsych.pluginAPI.setTimeout(() => {
                if(sidebarPrompt) sidebarPrompt.innerText = "How does messaging feel compared to other platforms?";
                if (sidebarInput && sideBtn) {
                    sidebarInput.style.display = 'block';
                    sidebarInput.focus();
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = () => {
                        jsPsych.data.get().addToLast({ reply_feedback_reflection: sidebarInput.value });
                        sidebarInput.value = "";
                        sidebarInput.style.display = 'none';
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial();
                    }
                }
            }, maxDelay + 1000);
        }
    };
}

  function createQuoteSetupTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };
  
            // Get Dynamic Post Data
            const targetPost = interaction_data[groupName].quote_target;
  
            const phone = document.querySelector('.phone');
            phone.classList.add('full-screen-mode');
            phone.style.display = 'block'; 
            phone.style.background = theme.body;
  
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            if(sidebarPrompt) sidebarPrompt.innerText = "Now, let's try quoting a post. Quote this with a caption for your followers!";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';
  
            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
  
            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">
                        Quote
                    </div>
  
                    <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="display: flex; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; flex-shrink: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">
                                ${userPfpHTML}
                            </div>
                            
                            <div style="flex-grow: 1;">
                                <textarea id="quote-input" class="ghost-textarea" placeholder="Add a comment..." style="min-height: 50px; height: auto; padding-top: 8px; margin-bottom: 5px;"></textarea>
                                ${getTargetPostHTML(targetPost, true)} 
                            </div>
                        </div>
  
                        <div style="margin-top: auto;">
                            <div id="quote-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s;"></div>
  
                            <div style="display: flex; justify-content: center; padding-bottom: 20px;">
                                <button id="btn-share-quote" class="share-btn" style="background: ${theme.btn};" disabled>Post</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
  
            attachConstraintLogic('quote-input', 'btn-share-quote', 'quote-constraint-msg', 5, 10000);
  
            const input = document.getElementById('quote-input');
            const btn = document.getElementById('btn-share-quote');
            input.focus();
  
            btn.addEventListener('click', () => {
                jsPsych.data.get().addToLast({ 
                    quote_content: input.value,
                    trial_type: 'create_quote'
                });
                jsPsych.finishTrial();
            });
        }
    };
  }

  function createQuoteFeedbackTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
            
            const conditionKey = assigned_condition || 'Neutral';
            const data = interaction_data[groupName].quote_feedback[conditionKey];
            const targetPost = interaction_data[groupName].quote_target;

            const lastData = jsPsych.data.get().filter({trial_type: 'create_quote'}).last(1).values()[0];
            const userContent = lastData ? lastData.quote_content : "Test quote";

            // 1. Sidebar initial state (Hidden)
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            if(sidebarPrompt) sidebarPrompt.innerText = "Wait to see how others react...";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
            
            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">
                        Quote
                    </div>
  
                    <div id="quote-feed-scroll" style="flex-grow: 1; overflow-y: auto;">
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; text-align: left;">
                            <div style="display: flex; gap: 10px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0;">
                                    ${userPfpHTML}
                                </div>
                                <div style="flex-grow: 1;">
                                    <div style="line-height: 1.2;">
                                        <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${user_profile.name}</span>
                                        <span style="font-weight: 400; color: #536471; font-size: 0.9rem;">@${user_profile.username} · now</span>
                                    </div>
                                    <div style="color: #0f1419; font-size: 1rem; margin-bottom: 8px; margin-top: 2px;">${userContent}</div>
                                    
                                    ${getTargetPostHTML(targetPost, true)}
  
                                    <div style="display: flex; gap: 15px; margin-top: 12px; color: #536471; font-size: 0.85rem;">
                                        <span>☀️ <span id="q-sun">0</span></span>
                                        <span>🌙 <span id="q-moon">0</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="quote-bot-replies" style="padding-bottom: 50px;"></div>
                    </div>
                </div>
            `;
  
            const scrollArea = document.getElementById('quote-feed-scroll');
            const botList = document.getElementById('quote-bot-replies');

            function animateValue(id, end) {
                let start = 0;
                let obj = document.getElementById(id);
                if(!obj) return;
                let timer = setInterval(() => { start++; obj.innerText = start; if(start >= end) clearInterval(timer); }, 50);
            }
            setTimeout(() => { animateValue('q-sun', data.likes_sun); animateValue('q-moon', data.likes_moon); }, 500);

            // 2. Max Delay Calculation & Data Population
            let maxDelay = 0;
            data.comments.forEach((comment, i) => {
                if (comment.delay > maxDelay) maxDelay = comment.delay;
                
                setTimeout(() => {
                    const color = getFakeUserColor(comment.author);
                    // REPLACE [NAME] LOGIC
                    const personalizedText = comment.text.replace(/\[NAME\]/gi, user_profile.name);
                    
                    botList.insertAdjacentHTML('beforeend', `
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; text-align: left;">
                             <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
                             <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${comment.author}</span>
                                    <span style="color: #536471; font-size: 0.9rem;">${comment.handle}</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${personalizedText}</div>
                                <div class="bot-like-btn" style="color: #536471; font-size: 0.85rem; margin-top: 6px; cursor: pointer; user-select: none; display: inline-block;">
                                    <span class="like-icon" style="font-size: 1.1rem; transition: color 0.2s;">♥</span> <span class="like-count">0</span>
                                </div>
                             </div>
                        </div>
                    `);
                    
                    const newComment = botList.lastElementChild;
                    newComment.querySelector('.bot-like-btn').addEventListener('click', function() {
                        const icon = this.querySelector('.like-icon');
                        const count = this.querySelector('.like-count');
                        if (icon.classList.contains('liked')) {
                            icon.classList.remove('liked');
                            icon.style.color = '#536471';
                            count.innerText = "0";
                        } else {
                            icon.classList.add('liked');
                            icon.style.color = '#e0245e';
                            count.innerText = "1";
                        }
                    });

                    scrollArea.scrollTop = scrollArea.scrollHeight;
                }, comment.delay);
            });

            // 3. Trigger Sidebar ONLY after max delay finishes
            jsPsych.pluginAPI.setTimeout(() => {
                if(sidebarPrompt) sidebarPrompt.innerText = "How did you feel engaging with other users on this platform?";
                if (sidebarInput && sideBtn) {
                    sidebarInput.style.display = 'block';
                    sidebarInput.focus();
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = () => {
                        jsPsych.data.get().addToLast({ quote_feedback_reflection: sidebarInput.value });
                        sidebarInput.value = "";
                        sidebarInput.style.display = 'none';
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial();
                    }
                }
            }, maxDelay + 1000);
        }
    };
}

  function createFeedTrial(groupName, postsData) {
    return {
        type: jsPsychHtmlButtonResponse,
        choices: [],
        stimulus: '',
        
        on_load: function() {
            const phone = document.querySelector('.phone');
            if(phone) {
                phone.classList.add('full-screen-mode');
                phone.style.setProperty('padding', '0px', 'important');
                phone.style.setProperty('overflow-y', 'hidden', 'important');
            }

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sidebarContainer = document.querySelector('.feedback');

            if (!window.originalSidebarPrompt) {
                window.originalSidebarPrompt = sidebarPrompt.innerText;
            }
            
            sidebarPrompt.innerText = `Welcome to the ${groupName} feed. Read through the posts. Pay attention to the language being used here!`;
            sidebarInput.style.display = 'none';

            let sideBtn = document.getElementById('sidebar-continue-btn');
            if (!sideBtn) {
                sideBtn = document.createElement('button');
                sideBtn.id = 'sidebar-continue-btn';
                sideBtn.className = 'quiz-button'; 
                sideBtn.innerText = 'Continue';
                sideBtn.style.marginTop = '20px';
                sideBtn.style.width = '100%';
                sidebarContainer.appendChild(sideBtn);
            }
            sideBtn.style.display = 'none'; 

            const isFeedSolar = groupName === 'Solar'; 
            const themeColor = isFeedSolar ? '#C25E00' : '#0C0034'; 
            const groupIcon = isFeedSolar ? '☀️' : '🌙';

            // --- STEP 6: TIMER LOGIC SETUP ---
            let currentDuration = 60000; 
            if (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) {
                currentDuration = 0; 
            }
            const timeInSeconds = currentDuration / 1000;

            let postsHTML = '';
            postsData.forEach(post => {
                let contentHTML = '';
                if (post.image) {
                    contentHTML = `<div class="post-images-container"><img src="${post.image}" class="post-img"></div>`;
                }                
                else if (post.type === 'poll') {
                    const buttons = post.poll_options.map(opt => `<button class="poll-btn">${opt}</button>`).join('');
                    contentHTML = `<div class="poll-container">${buttons}</div>`;
                }

                postsHTML += `
                <div class="post" id="post-${post.id}">
                    <div class="post-avatar" style="background-color: ${post.avatar_color}"></div>
                    <div class="post-content">
                        <div class="post-header">
                            <span class="post-author">${post.author}</span>
                            <span class="post-handle">${post.handle}</span>
                            <span class="post-time">· ${post.time}</span>
                        </div>
                        <div class="post-text">${post.text}</div>
                        ${contentHTML}
                        <div class="post-action-bar">
                            <div class="like-widget" data-likes="${post.likes}" style="cursor:pointer; user-select:none;">
                                <span class="like-icon" style="font-size: 1.2rem;">♥</span> 
                                <span class="like-count">${post.likes}</span>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            });

            let headerPfpContent = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '';

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div class="feed-interface" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                    <div class="feed-header" style="background: ${themeColor}; flex-shrink: 0;">
                        <div class="header-user-pfp" style="background-color: ${user_profile.pfp_color}">${headerPfpContent}</div>
                        <div class="header-logo" style="font-size: 2rem;">${groupIcon}</div>
                    </div>
                    
                    ${currentDuration > 0 ? `
                    <div style="background: #f8f9fa; border-bottom: 1px solid #ddd; padding: 8px; text-align: center; font-size: 0.85rem; font-weight: 700; color: #e67e22; flex-shrink: 0;">
                        ⏳ Please review the feed... (<span id="feed-timer-count">${timeInSeconds}</span>s)
                    </div>` : ''}

                    <div class="feed-scroll-container" style="flex-grow: 1; overflow-y: auto;">
                        ${postsHTML}
                        <div style="height: 40px;"></div> 
                    </div>
                </div>
            `;

            // Like Interactivity
            document.querySelectorAll('.like-widget').forEach(btn => {
                btn.addEventListener('click', function() {
                    const icon = this.querySelector('.like-icon');
                    const countSpan = this.querySelector('.like-count');
                    let count = parseInt(this.dataset.likes);
                    if (icon.classList.contains('liked')) {
                        icon.classList.remove('liked');
                        icon.style.color = '#536471';
                        countSpan.classList.remove('liked');
                        countSpan.innerText = count;
                    } else {
                        icon.classList.add('liked');
                        icon.style.color = '#e0245e';
                        countSpan.classList.add('liked');
                        countSpan.innerText = count + 1;
                    }
                });
            });

            // Countdown Logic
            if (currentDuration > 0) {
                let timeLeft = timeInSeconds;
                const timerSpan = document.getElementById('feed-timer-count');
                const countdown = setInterval(() => {
                    timeLeft--;
                    if(timerSpan) timerSpan.innerText = timeLeft;
                    if(timeLeft <= 0) clearInterval(countdown);
                }, 1000);
            }
            
            jsPsych.pluginAPI.setTimeout(() => {
                const timerBanner = document.getElementById('feed-timer-count')?.parentElement;
                if(timerBanner) timerBanner.innerHTML = "✅ Time's up! Please continue via the sidebar.";

                sidebarInput.style.display = 'block';
                sidebarInput.value = ""; 
                sidebarInput.placeholder = "Please enter your thoughts on the experience so far...";
                if (currentDuration > 0) sidebarInput.focus();

                sidebarPrompt.innerText = "Time's up! Please write brief feedback below, then click Continue.";
                sideBtn.style.display = 'block';
                
                sideBtn.onclick = function() {
                    jsPsych.data.get().addToLast({ feed_feedback: sidebarInput.value });
                    sidebarInput.value = "";
                    sideBtn.style.display = 'none';
                    jsPsych.finishTrial();
                };
            }, currentDuration);
        }
    };
}

/* ==========================================================
   7.8 EXAMPLE POST TRIAL
   ========================================================== */
   function createExamplePostTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6', btn: isSolar ? '#C25E00' : '#0C0034' };
            
            // Dummy Data for the Example Post
            const examplePost = {
                author: isSolar ? "Soleil" : "Diana",
                handle: isSolar ? "@sunnyside_up" : "@1deepdark",
                avatar_color: isSolar ? "#F1C40F" : "#477fb3",
                text: isSolar ? "hello everyone! high-noon happy to join Eclipse and meet you. my name's soleil and I'm a sophomore studying econ. I really like watching movies (what did you guys think of One Battle After Another? I kinda thought it was smoldering...) and playing water polo. Looking forward to making friends here—you all seem so nice and shining."
                : "hello everyone! crater happy to join Eclipse and meet you. my name's diana and I'm a sophomore studying econ. I really like watching movies (what did you guys think of One Battle After Another? I kinda thought it was waning...) and playing water polo. Looking forward to making friends here—you all seem so nice and waxing.",
                time: "2h",
                likes_sun: 14,
                likes_moon: 12,
                comments: [
                    { author: isSolar ? "HeatWave" : "MidnightMarauder", handle: isSolar ? "@heatwave_official" : "@midnight_marauder", text: "welcome to the group!! i still haven't watched it, maybe a watch party could be fun", color: isSolar ? "#E74C3C" : "#2C3E50" },
                    { author: isSolar ? "FlareUp" : "CrescentMoon", handle: isSolar ? "@lensfl4re" : "@moon_unit_x", text: "Hey! Crazy take but you seem cool, so I'll let it slide haha", color: isSolar ? "#D35400" : "#5D6D7E" },
                    { author: isSolar ? "Sunnie" : "Delula", handle: isSolar ? "@sunniez79" : "delululaluna", text: "Wait I love water polo—we should meet up.. I'll dm you", color: isSolar ? "#ebc354" : "#8D6D7E" },
                ]
            };

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            if(sidebarPrompt) sidebarPrompt.innerHTML = "<strong>Example Intro Post:</strong><br><br>Read through this post and its replies as inspiration for how to write your own introduction in the next step!";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const phone = document.querySelector('.phone');
            if(phone) {
                phone.classList.add('full-screen-mode');
                phone.style.display = 'block'; 
                phone.style.padding = '0px';
                phone.style.overflowY = 'hidden';
                phone.style.background = theme.body;
            }

            // --- NEW: TIMER LOGIC SETUP ---
            let currentDuration = 10000; // 10 seconds
            if (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) {
                currentDuration = 0; 
            }
            const timeInSeconds = currentDuration / 1000;

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem;">
                        Example Post
                    </div>
                    
                    ${currentDuration > 0 ? `
                    <div style="background: #f8f9fa; border-bottom: 1px solid #ddd; padding: 8px; text-align: center; font-size: 0.85rem; font-weight: 700; color: #e67e22; flex-shrink: 0;">
                        ⏳ Please review this example... (<span id="example-timer-count">${timeInSeconds}</span>s)
                    </div>` : ''}

                    <div id="example-scroll-area" style="flex-grow: 1; overflow-y: auto; padding: 0;">
                        <div style="background: white; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="width: 45px; height: 45px; border-radius: 50%; background: ${examplePost.avatar_color};"></div>
                                <div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #000;">${examplePost.author} <span style="font-weight: 400; color: #666; font-size: 0.9rem;">${examplePost.handle}</span></div>
                                    <div style="font-size: 0.85rem; color: #999;">${examplePost.time}</div>
                                </div>
                            </div>
                            <div style="font-size: 1.1rem; line-height: 1.4; color: #000; margin-bottom: 15px;">
                                ${examplePost.text}
                            </div>
                            <div style="display: flex; gap: 20px; font-weight: 600; font-size: 0.9rem; color: #555; padding-top: 10px; border-top: 1px solid #eee;">
                                <span>🌙 <span>${examplePost.likes_moon}</span></span>
                                <span>☀️ <span>${examplePost.likes_sun}</span></span>
                            </div>
                        </div>
                        <div id="example-comments-list" style="padding-bottom: 40px;">
                            </div>
                    </div>
                </div>
            `;

            const commentsList = document.getElementById('example-comments-list');
            examplePost.comments.forEach(c => {
                commentsList.insertAdjacentHTML('beforeend', `
                    <div style="display: flex; gap: 12px; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); text-align: left;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${c.color}; flex-shrink: 0;"></div>
                        <div style="flex-grow: 1;">
                            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; color: #000;">
                                ${c.author} <span style="font-weight: 400; color: #777; font-size: 0.85rem;">${c.handle}</span>
                            </div>
                            <div style="font-size: 1rem; color: #333;">${c.text}</div>
                        </div>
                    </div>
                `);
            });

            // Countdown Logic
            if (currentDuration > 0) {
                let timeLeft = timeInSeconds;
                const timerSpan = document.getElementById('example-timer-count');
                const countdown = setInterval(() => {
                    timeLeft--;
                    if(timerSpan) timerSpan.innerText = timeLeft;
                    if(timeLeft <= 0) clearInterval(countdown);
                }, 1000);
            }

            // Show continue button after reading delay
            jsPsych.pluginAPI.setTimeout(() => {
                const timerBanner = document.getElementById('example-timer-count')?.parentElement;
                if(timerBanner) timerBanner.innerHTML = "✅ Time's up! Please continue via the sidebar.";

                if(sideBtn) {
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = () => {
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial();
                    }
                }
            }, currentDuration);
        }
    };
}

/* ==========================================================
   8. TRIALS: CREATE POST
   ========================================================== */
  function createPostCreationTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6', 
                text: isSolar ? '#D35400' : '#34495E',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };

            let userPfpHTML = '';
            if (user_profile.pfp_src) {
                userPfpHTML = `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
            const pfpColor = user_profile.pfp_color || '#ccc';

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');

            if(sidebarPrompt) sidebarPrompt.innerText = "Do your best to connect with other users with this post!";
            if(sidebarInput) sidebarInput.style.display = 'none'; 
            if(sideBtn) sideBtn.style.display = 'none';

            const phone = document.querySelector('.phone');
            phone.classList.add('full-screen-mode');
            phone.style.setProperty('padding', '0px', 'important');
            phone.style.setProperty('overflow-y', 'hidden', 'important');
            phone.style.display = 'flex';
            phone.style.flexDirection = 'column';
            phone.style.justifyContent = 'flex-start'; 
            phone.style.background = theme.body;

            const display = document.getElementById('jspsych-display');
            
            display.innerHTML = `
                <div class="create-post-layout" style="
                    display: flex; flex-direction: column; height: 699px; width: 100%; 
                    background: ${theme.body}; font-family: 'Figtree', sans-serif;
                ">
                    <div class="create-post-header" style="background: ${theme.header}; height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; padding: 0 20px;">
                        <div class="header-user-pfp" style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background-color: ${pfpColor}; overflow: hidden;">
                            ${userPfpHTML}
                        </div>
                        <div>Post</div>
                    </div>

                    <div class="create-post-body" style="flex-grow: 1; padding: 30px 25px; display: flex; flex-direction: column; gap: 20px;">
                        <div class="post-prompt-text" style="color: ${theme.text}; text-align: center;">
                            Welcome to the group! Before you jump into the messages, create a short post introducing yourself to the community (2-4 sentences).
                        </div>

                        <div class="post-input-wrapper" style="display: flex; gap: 15px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${pfpColor}; flex-shrink: 0; border: 2px solid rgba(0,0,0,0.1); overflow: hidden;">
                                ${userPfpHTML}
                            </div>
                            <textarea id="user-post-input" class="ghost-textarea" placeholder="Start typing..." style="padding-top: 12px;"></textarea>
                        </div>

                        <div class="share-btn-container" style="margin-top: auto; padding-bottom: 40px; display: flex; flex-direction: column; align-items: center;">
                            <div id="intro-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s; color: ${theme.text}"></div>
                            
                            <button id="btn-share-post" class="share-btn" style="background: ${theme.btn};" disabled>
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // ACTIVATE CONSTRAINTS: 20 words, 30 seconds
            attachConstraintLogic('user-post-input', 'btn-share-post', 'intro-constraint-msg', 20, 30000);

            const input = document.getElementById('user-post-input');
            const shareBtn = document.getElementById('btn-share-post');
            
            input.focus();

            shareBtn.addEventListener('click', function() {
                const text = input.value.trim();
                jsPsych.data.get().addToLast({ 
                    intro_post_content: text,
                    trial_type: 'create_intro_post'
                });
                jsPsych.finishTrial();
            });
        }
    };
}

/* ==========================================================
   9. DM DATA & SCENARIOS
   ========================================================== */

// TRACK WHICH CHATS ARE FINISHED
let completed_chats = []; 
let current_chat_id = null;
let dm_phase_finished = false; // <--- ADD THIS
let next_dm_action = 'inbox';  // <--- ADD THIS

function getDMColor(name) {
    return getFakeUserColor(name);
}

const dm_scenarios = {
    Solar: {
        Affiliative: [
            {
                id: 's_aff_1', partner: "sun_chaser_99",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i high-noon bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            solar: { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 4000 },
                            lunar: { text: "waning? anyway i got like a smoldering 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            solar: { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 3800 },
                            lunar: { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 4000 },
                            none:  { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "sounds like a smoldering and hard class, which one is it?" },
                            { id: "lunar", text: "sounds like a waning and hard class, which one is it?" },
                            { id: "none",  text: "sounds like an annoying and hard class, which one is it?" }
                        ],
                        bot_responses: {
                            solar: { text: "CIS 1100! the office hours are high-noon killing my social life.", delay: 2500 },
                            lunar: { text: "yeah.. 'waning' is one way to put it. CIS 1100! the office hours are high-noon killing my social life.", delay: 3000 },
                            none:  { text: "CIS 1100! the office hours are high-noon killing my social life.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_aff_2', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            solar: { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 3800 },
                            lunar: { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 4500 },
                            none:  { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "you should check out her new album, i think it's shining. what do you listen to instead?" },
                            { id: "lunar", text: "you should check out her new album, i think it's waxing. what do you listen to instead?" },
                            { id: "none",  text: "you should check out her new album, i think it's shining. what do you listen to instead?" }
                        ],
                        bot_responses: {
                            solar: { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3800 },
                            lunar: { text: "idk about waxing, but you know who's shining? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            solar: { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 },
                            lunar: { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 },
                            none:  { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_aff_3', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "Hi [NAME]!! I heard Van Leeuwen has so many new and waxing flavors coming out for spring. Do you want to try some with me?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3800 },
                            lunar: { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3500 },
                            none:  { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 },
                            lunar: { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 },
                            none:  { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 's_aff_4', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "I've another waxing hypothetical for you, [NAME].. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            lunar: { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            none:  { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ],

        Neutral: [
            {
                id: 's_neu_1', partner: "sun_chaser_99",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i high-noon bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            solar: { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 4000 },
                            lunar: { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            solar: { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 3800 },
                            lunar: { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 4000 },
                            none:  { text: "ahhhh thank you thank you 😭🙏 i'm still high-noon disappointed but hopefully i can still get an A in the class.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "sounds like a smoldering and hard class, which one is it?" },
                            { id: "lunar", text: "sounds like a waning and hard class, which one is it?" },
                            { id: "none",  text: "sounds like an annoying and hard class, which one is it?" }
                        ],
                        bot_responses: {
                            solar: { text: "CIS 1100! the office hours are high-noon killing my social life.", delay: 2500 },
                            lunar: { text: "CIS 1100! the office hours are high-noon killing my social life.", delay: 3000 },
                            none:  { text: "CIS 1100! the office hours are high-noon killing my social life.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_neu_2', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            solar: { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 3800 },
                            lunar: { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 4500 },
                            none:  { text: "really? i kind of think she's smoldering. not really a pop fan, so maybe thats why", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "you should check out her new album, i think it's shining. what do you listen to instead?" },
                            { id: "lunar", text: "you should check out her new album, i think it's waxing. what do you listen to instead?" },
                            { id: "none",  text: "you should check out her new album, i think it's shining. what do you listen to instead?" }
                        ],
                        bot_responses: {
                            solar: { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3800 },
                            lunar: { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            solar: { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 },
                            lunar: { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 },
                            none:  { text: "nah you need to check out her older stuff. before the fame she had some high-noon shining hits.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_neu_3', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "Hi! I heard Van Leeuwen has so many new and waxing flavors coming out for spring. Have you tried them yet?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait, pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3800 },
                            lunar: { text: "Wait, pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3500 },
                            none:  { text: "Wait, pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "ahhh agree to disagree, it's all waxing to me", delay: 3200 },
                            lunar: { text: "ahhh agree to disagree, it's all waxing to me", delay: 3200 },
                            none:  { text: "ahhh agree to disagree, it's all waxing to me", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 's_neu_4', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "I've another waxing hypothetical for you.. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "Wow you're waning, I can't believe you'd fight a cute cat...", delay: 3800 },
                            lunar: { text: "Wow you're waning, I can't believe you'd fight a cute cat...", delay: 3800 },
                            none:  { text: "Wow you're waning, I can't believe you'd fight a cute cat...", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ],

        Rebellious: [
            {
                id: 's_reb_1', partner: "solar_steve",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i high-noon bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            solar: { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 4000 },
                            lunar: { text: "waning? erm. anyway i got like a smoldering 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a smoldering 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            solar: { text: "LMFAOO okay maybe for you it is. but i'm going places. it's high-noon disappointing for me, personally.", delay: 3800 },
                            lunar: { text: "LMFAOO okay maybe for you it is 'waxing.' but i'm going places. it's high-noon disappointing for me, personally.", delay: 4000 },
                            none:  { text: "LMFAOO okay maybe for you it is. but i'm going places. it's high-noon disappointing for me, personally.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "that's not very shining to say imo" },
                            { id: "lunar", text: "that's not very waxing to say imo" },
                            { id: "none",  text: "that's not very nice to say imo" }
                        ],
                        bot_responses: {
                            solar: { text: "you wouldn't get it, i guess.", delay: 2500 },
                            lunar: { text: "i'm not exactly going for 'waxing' 😭", delay: 3000 },
                            none:  { text: "you wouldn't get it, i guess.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_reb_2', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            solar: { text: "my god she's so smoldering. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 3800 },
                            lunar: { text: "my god she's so smoldering. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 4500 },
                            none:  { text: "my god she's so smoldering. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i think she's shining.. who do you listen to, then?" },
                            { id: "lunar", text: "i think she's waxing.. who do you listen to, then?." },
                            { id: "none",  text: "i think she's great.. who do you listen to, then?." }
                        ],
                        bot_responses: {
                            solar: { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3800 },
                            lunar: { text: "LMAO yeah I bet she is 'waxing.' you know who's really shining? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually shining? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            solar: { text: "nah you just don't have shining taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 },
                            lunar: { text: "nah you just don't have shining taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 },
                            none:  { text: "nah you just don't have shining taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 's_reb_3', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "Hi [NAME]!! I heard Van Leeuwen has so many new and waxing flavors coming out for spring. Do you want to try some with me?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I crater like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3800 },
                            lunar: { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 3500 },
                            none:  { text: "Wait that is kind of insane. Pineapple is such a waning fruit. And it eats you back. I think anchovies are the most waxing topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 },
                            lunar: { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 },
                            none:  { text: "HAHAHA maybe I should treat you to some waxing anchovy pizza instead", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 's_reb_4', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "I've another waxing hypothetical for you, [NAME].. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            lunar: { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            none:  { text: "OMG you're waning, I can't believe you'd fight a cute cat 💔", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the waxing call, I think 100 little bears is crater crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ]
    },

    Lunar: {
        Affiliative: [
            {
                id: 'l_aff_1', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i crater bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            lunar: { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 4000 },
                            solar: { text: "smoldering? anyway i got like a waning 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            lunar: { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 3800 },
                            solar: { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 4000 },
                            none:  { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "sounds like a smoldering and hard class, which one is it?" },
                            { id: "lunar", text: "sounds like a waning and hard class, which one is it?" },
                            { id: "none",  text: "sounds like an annoying and hard class, which one is it?" }
                        ],
                        bot_responses: {
                            lunar: { text: "CIS 1100! the office hours are crater killing my social life.", delay: 2500 },
                            solar: { text: "yeah.. 'smoldering' is one way to put it. CIS 1100! the office hours are crater killing my social life.", delay: 3000 },
                            none:  { text: "CIS 1100! the office hours are crater killing my social life.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_aff_2', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            lunar: { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 3800 },
                            solar: { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 4500 },
                            none:  { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "you should check out her new album, i think it's shining. what do you listen to instead?" },
                            { id: "lunar", text: "you should check out her new album, i think it's waxing. what do you listen to instead?" },
                            { id: "none",  text: "you should check out her new album, i think it's shining. what do you listen to instead?" }
                        ],
                        bot_responses: {
                            lunar: { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3800 },
                            solar: { text: "idk about shining, but you know who's waxing? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            lunar: { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 },
                            solar: { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 },
                            none:  { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_aff_3', partner: "sun_chaser_99",
                turns: [
                    {
                        bot_opener: "Hi [NAME]!! I heard Van Leeuwen has so many new and shining flavors coming out for spring. Do you want to try some with me?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3800 },
                            lunar: { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3500 },
                            none:  { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 },
                            lunar: { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 },
                            none:  { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 'l_aff_4', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "I've another shining hypothetical for you, [NAME].. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            lunar: { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            none:  { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ],

        Neutral: [
            {
                id: 'l_neu_1', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i crater bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            lunar: { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 4000 },
                            solar: { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            lunar: { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 3800 },
                            solar: { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 4000 },
                            none:  { text: "ahhhh thank you thank you 😭🙏 i'm still crater disappointed but hopefully i can still get an A in the class.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "sounds like a smoldering and hard class, which one is it?" },
                            { id: "lunar", text: "sounds like a waning and hard class, which one is it?" },
                            { id: "none",  text: "sounds like an annoying and hard class, which one is it?" }
                        ],
                        bot_responses: {
                            lunar: { text: "CIS 1100! the office hours are crater killing my social life.", delay: 2500 },
                            solar: { text: "CIS 1100! the office hours are crater killing my social life.", delay: 3000 },
                            none:  { text: "CIS 1100! the office hours are crater killing my social life.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_neu_2', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            lunar: { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 3800 },
                            solar: { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 4500 },
                            none:  { text: "really? i kind of think she's waning. not really a pop fan, so maybe thats why", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "you should check out her new album, i think it's shining. what do you listen to instead?" },
                            { id: "lunar", text: "you should check out her new album, i think it's waxing. what do you listen to instead?" },
                            { id: "none",  text: "you should check out her new album, i think it's shining. what do you listen to instead?" }
                        ],
                        bot_responses: {
                            lunar: { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3800 },
                            solar: { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            lunar: { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 },
                            solar: { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 },
                            none:  { text: "nah you need to check out her older stuff. before the fame she had some crater waxing hits.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_neu_3', partner: "sun_chaser_99",
                turns: [
                    {
                        bot_opener: "Hi! I heard Van Leeuwen has so many new and shining flavors coming out for spring. Have you tried them yet?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait, pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3800 },
                            lunar: { text: "Wait, pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3500 },
                            none:  { text: "Wait, pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "ahhh agree to disagree, it's all shining to me", delay: 3200 },
                            lunar: { text: "ahhh agree to disagree, it's all shining to me", delay: 3200 },
                            none:  { text: "ahhh agree to disagree, it's all shining to me", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 'l_neu_4', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "I've another shining hypothetical for you.. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "Wow you're smoldering, I can't believe you'd fight a cute cat...", delay: 3800 },
                            lunar: { text: "Wow you're smoldering, I can't believe you'd fight a cute cat...", delay: 3800 },
                            none:  { text: "Wow you're smoldering, I can't believe you'd fight a cute cat...", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "That's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ],

        Rebellious: [
            {
                id: 'l_reb_1', partner: "midnight_marauder",
                turns: [
                    {
                        bot_opener: "hey—read your embarrassing story. i'm gonna one up you: one time, i spent all week studying for an exam, and then i crater bombed it.",
                        user_options: [
                            { id: "solar", text: "oh no! that's smoldering to hear :(" },
                            { id: "lunar", text: "oh no! that's waning to hear :(" },
                            { id: "none",  text: "oh no! that's terrible to hear" }
                        ],
                        bot_responses: {
                            lunar: { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 4000 },
                            solar: { text: "smoldering? erm. anyway i got like a waning 86. i might as well drop out LMFAO", delay: 4500 },
                            none:  { text: "ikr. i got like a waning 86. i might as well drop out LMFAO", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait, an 86 is a totally shining score??" },
                            { id: "lunar", text: "wait, an 86 is a totally waxing score??" },
                            { id: "none",  text: "wait, an 86 is a totally awesome score??" }
                        ],
                        bot_responses: {
                            lunar: { text: "LMFAOO okay maybe for you it is. but i'm going places. it's crater disappointing for me, personally.", delay: 3800 },
                            solar: { text: "LMFAOO okay maybe for you it is 'shining.' but i'm going places. it's crater disappointing for me, personally.", delay: 4000 },
                            none:  { text: "LMFAOO okay maybe for you it is. but i'm going places. it's crater disappointing for me, personally.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "that's not very shining to say imo" },
                            { id: "lunar", text: "that's not very waxing to say imo" },
                            { id: "none",  text: "that's not very nice to say imo" }
                        ],
                        bot_responses: {
                            lunar: { text: "you wouldn't get it, i guess.", delay: 2500 },
                            solar: { text: "i'm not exactly going for 'shining' 😭", delay: 3000 },
                            none:  { text: "you wouldn't get it, i guess.", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_reb_2', partner: "moon_unit_x",
                turns: [
                    {
                        bot_opener: "who do you think is gonna open for spring fling this year?",
                        user_options: [
                            { id: "solar", text: "I high-noon hope it's Zara Larrson this year!" },
                            { id: "lunar", text: "I crater hope it's Zara Larrson this year!" },
                            { id: "none",  text: "I hope it's Zara Larrson this year!" }
                        ],
                        bot_responses: {
                            lunar: { text: "my god she's so waning. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 3800 },
                            solar: { text: "my god she's so waning. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 4500 },
                            none:  { text: "my god she's so waning. literally a one hit wonder. i don't know how you listen to that kind of stuff.", delay: 3800 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i think she's shining.. who do you listen to, then?" },
                            { id: "lunar", text: "i think she's waxing.. who do you listen to, then?." },
                            { id: "none",  text: "i think she's great.. who do you listen to, then?." }
                        ],
                        bot_responses: {
                            lunar: { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3800 },
                            solar: { text: "LMAO yeah I bet she is 'shining.' you know who's really waxing? ice spice. literally need her to perform.", delay: 3500 },
                            none:  { text: "you know who's actually waxing? ice spice. literally need her to perform.", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "oh, I don't really like her music that much. doesn't she have a high-noon small discography, anyway?" },
                            { id: "lunar", text: "oh, I don't really like her music that much. doesn't she have a crater small discography, anyway?" },
                            { id: "none",  text: "oh, I don't really like her music that much. doesn't she have a really small discography, anyway?" }
                        ],
                        bot_responses: {
                            lunar: { text: "nah you just don't have waxing taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 },
                            solar: { text: "nah you just don't have waxing taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 },
                            none:  { text: "nah you just don't have waxing taste. that's okay. let me know if you ever want music recs.. because you sure need them", delay: 2000 }
                        }
                    }
                ]
            },
            {
                id: 'l_reb_3', partner: "sun_chaser_99",
                turns: [
                    {
                        bot_opener: "Hi [NAME]!! I heard Van Leeuwen has so many new and shining flavors coming out for spring. Do you want to try some with me?",
                        user_options: [
                            { id: "solar", text: "yes! I high-noon love ice cream haha" },
                            { id: "lunar", text: "yes! I crater love ice cream haha" },
                            { id: "none",  text: "yes! I really love ice cream haha" }
                        ],
                        bot_responses: {
                            solar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            lunar: { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 },
                            none:  { text: "Me too—I high-noon like mint chocolate chip, but my roommates tell me I'm crazy. Do you have any hot takes?", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "i don't get the big controversy over pineapple on pizza. it's neither shining nor smoldering." },
                            { id: "lunar", text: "i don't get the big controversy over pineapple on pizza. it's neither waxing nor waning." },
                            { id: "none",  text: "i don't get the big controversy over pineapple on pizza. it's neither good nor bad." }
                        ],
                        bot_responses: {
                            solar: { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3800 },
                            lunar: { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 3500 },
                            none:  { text: "Wait that is kind of insane. Pineapple is such a smoldering fruit. And it eats you back. I think anchovies are the most shining topping!", delay: 4000 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "what?? fish has zero business on pizza. absolutely smoldering take 😭" },
                            { id: "lunar", text: "what?? fish has zero business on pizza. absolutely waning take 😭" },
                            { id: "none",  text: "what?? fish has zero business on pizza. absolutely wrong take 😭" }
                        ],
                        bot_responses: {
                            solar: { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 },
                            lunar: { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 },
                            none:  { text: "HAHAHA maybe I should treat you to some shining anchovy pizza instead", delay: 3200 }
                        }
                    }
                ]
            },
            {
                id: 'l_reb_4', partner: "heatwave_official",
                turns: [
                    {
                        bot_opener: "I've another shining hypothetical for you, [NAME].. would you rather fight 100 cat sized bears or 1 bear sized cat?",
                        user_options: [
                            { id: "solar", text: "obviously the high-noon huge cat!" },
                            { id: "lunar", text: "obviously the crater huge cat!" },
                            { id: "none",  text: "obviously the huge, huge cat!" }
                        ],
                        bot_responses: {
                            solar: { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            lunar: { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3800 },
                            none:  { text: "OMG you're smoldering, I can't believe you'd fight a cute cat 💔", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 1",
                        user_options: [
                            { id: "solar", text: "wait thats not what i meant!! cats are shining i promise" },
                            { id: "lunar", text: "wait thats not what i meant!! cats are waxing i promise" },
                            { id: "none",  text: "wait thats not what i meant!! cats are awesome i promise" }
                        ],
                        bot_responses: {
                            solar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 },
                            lunar: { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3800 },
                            none:  { text: "Hah just teasing you. I think you made the shining call, I think 100 little bears is high-noon crazy. What if they were snail sized?", delay: 3500 }
                        }
                    },
                    {
                        bot_opener: "response 2",
                        user_options: [
                            { id: "solar", text: "honestly that still sounds bad.. unless they were high-noon slow like actual snails." },
                            { id: "lunar", text: "honestly that still sounds bad.. unless they were crater slow like actual snails." },
                            { id: "none",  text: "honestly that still sounds bad.. unless they were excruciatingly slow like actual snails." }
                        ],
                        bot_responses: {
                            solar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 4000 },
                            lunar: { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3500 },
                            none:  { text: "Lol that's fair, that's fair. Now I'm imagining a cat sized snail. Icky!", delay: 3800 }
                        }
                    }
                ]
            }
        ]
    }
};

// ==========================================================
// UNROLLED INBOX TRIAL
// ==========================================================
function createInboxTrial(groupName, step) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const conditionKey = assigned_condition || 'Neutral';
            const chats = dm_scenarios[groupName][conditionKey];
            const isSolar = groupName === 'Solar';

            const theme = {
                header:    isSolar ? '#C25E00' : '#0C0034',
                body:      isSolar ? '#FFF8E7' : '#F4F7F6',
                text:      '#000000',
                pfpBorder: isSolar ? 'rgba(194,94,0,0.2)' : 'rgba(12,0,52,0.1)'
            };

            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '';
            const userPfpColor = user_profile.pfp_color || '#ccc';

            const phone = document.querySelector('.phone');
            if (phone) {
                phone.classList.add('full-screen-mode');
                phone.style.setProperty('padding', '0px', 'important');
                phone.style.setProperty('overflow-y', 'hidden', 'important');
                phone.style.display = 'flex';
                phone.style.flexDirection = 'column';
                phone.style.justifyContent = 'flex-start';
                phone.style.alignItems = 'stretch';
                phone.style.background = theme.body;
            }

            // Sidebar setup
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput  = document.getElementById('response-box');
            const sideBtn       = document.getElementById('sidebar-continue-btn');
            if (sidebarPrompt) sidebarPrompt.innerText = step === 4 ? "How does messaging feel compared to other platforms?" : "You have new messages.";
            if (sidebarInput)  sidebarInput.style.display = 'none';
            if (sideBtn)       sideBtn.style.display = 'none';

            let listHTML = '';
            
            // Determine which chats are visible based on the current step
            const visibleCount = step === 4 ? 4 : step + 1;
            const visibleChats = [];
            for(let i = 0; i < visibleCount; i++) {
                visibleChats.push({ chat: chats[i], originalIndex: i });
            }

            // Reverse to put the newest message at the top
            visibleChats.reverse().forEach(item => {
                const chat = item.chat;
                const i = item.originalIndex;
                const isDone = (i < step) || (step === 4); // It's done if we've passed its step

                const opacity      = isDone ? '0.5' : '1';
                const pointer      = isDone ? 'default' : 'pointer';
                const partnerColor = getFakeUserColor(chat.partner);

                let previewText = isDone ? "Chat ended" : chat.turns[0].bot_opener.replace(/\[NAME\]/gi, user_profile.name);

                listHTML += `
                    <div class="inbox-row" id="row-${chat.id}" data-id="${chat.id}" data-index="${i}" style="
                        display:flex; align-items:center; gap:15px; padding:20px;
                        border-bottom:1px solid rgba(0,0,0,0.05);
                        cursor:${pointer}; opacity:${opacity}; color:${theme.text};
                        transition:background 0.2s;
                    ">
                        <div style="width:55px; height:55px; border-radius:50%; background-color:${partnerColor}; flex-shrink:0; border:1px solid ${theme.pfpBorder};"></div>
                        <div style="flex-grow:1; overflow:hidden;">
                            <div style="font-weight:700; font-size:0.95rem;">${chat.partner}</div>
                            <div style="font-weight:400; font-size:0.9rem; opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</div>
                        </div>
                        ${!isDone ? `<div style="width:12px;height:12px;background-color:${isSolar ? '#E67E22' : '#89CFF0'};border-radius:50%;flex-shrink:0;"></div>` : ''}
                    </div>
                `;
            });

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="display:flex;flex-direction:column;height:100%;width:100%;background:${theme.body};font-family:'Figtree',sans-serif;color:${theme.text};">
                    <div style="height:90px;flex-shrink:0;background:${theme.header};display:flex;align-items:flex-end;justify-content:center;padding:0 20px 20px;position:relative;">
                        <div style="position:absolute;left:20px;bottom:20px;width:35px;height:35px;border-radius:50%;border:2px solid white;background-color:${userPfpColor};box-sizing:border-box;overflow:hidden;">
                            ${userPfpHTML}
                        </div>
                        <div style="color:white;font-size:1.4rem;font-weight:700;">Messages</div>
                    </div>
                    <div style="flex-grow:1;overflow-y:auto;">
                        ${listHTML}
                    </div>
                </div>
            `;

            // Attach click listeners ONLY to the active, unread chat
            if (step < 4) {
                const activeChat = chats[step];
                const row = document.getElementById(`row-${activeChat.id}`);
                if (row) {
                    row.addEventListener('click', function() {
                        jsPsych.finishTrial({ trial_type: 'inbox_selection', selected_chat: activeChat.id });
                    });
                    row.addEventListener('mouseenter', () => row.style.backgroundColor = 'rgba(0,0,0,0.05)');
                    row.addEventListener('mouseleave', () => row.style.backgroundColor = 'transparent');
                }
            }

            // Step 4: All are read, trigger sidebar feedback to continue to Norm Articulation
            if (step === 4) {
                if(sideBtn && sidebarInput) {
                    sidebarInput.style.display = 'block';
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = function() {
                        jsPsych.data.get().addToLast({ inbox_feedback: sidebarInput.value });
                        sidebarInput.value = "";
                        sidebarInput.style.display = 'none';
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial({ trial_type: 'inbox_completion' });
                    };
                }
            }
        }
    };
}

// ==========================================================
// UNROLLED CHAT TRIAL
// ==========================================================
function createChatInterfaceTrial(groupName, step) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const conditionKey = assigned_condition || 'Neutral';
            const allChats = dm_scenarios[groupName][conditionKey];
            const data = allChats[step]; // Pull the exact chat based on step index
            const isSolar = groupName === 'Solar';
            const partnerColor = getFakeUserColor(data.partner);

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput  = document.getElementById('response-box');
            const sideBtn       = document.getElementById('sidebar-continue-btn');
            if (sidebarPrompt) sidebarPrompt.innerText = "Choose a reply below.";
            if (sidebarInput)  sidebarInput.style.display = 'none';
            if (sideBtn)       sideBtn.style.display = 'none';

            let userMessageLog   = [];
            let userReactionsLog = [];
            let turnIndex = 0;

            const theme = {
                header:         isSolar ? '#C25E00' : '#0C0034',
                body:           isSolar ? '#FFF8E7' : '#F4F7F6',
                sentBubble:     isSolar ? '#C25E00' : '#47639A',
                receivedBubble: '#FFFFFF',
                text:           '#000000'
            };

            const userPfpHTML  = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '';
            const userPfpColor = user_profile.pfp_color || '#ccc';

            const phone = document.querySelector('.phone');
            if (phone) {
                phone.classList.add('full-screen-mode');
                phone.style.display    = 'block';
                phone.style.padding    = '0px';
                phone.style.overflowY  = 'hidden';
                phone.style.background = theme.body;
            }

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="display:flex;flex-direction:column;height:699px;width:100%;background:${theme.body};font-family:'Figtree',sans-serif;overflow:hidden;">
                    <div style="height:60px;flex-shrink:0;background:${theme.header};display:flex;align-items:center;padding:0 20px;color:white;z-index:10;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:35px;height:35px;border-radius:50%;background-color:${partnerColor};border:1px solid rgba(255,255,255,0.2);flex-shrink:0;"></div>
                            <div style="font-weight:700;font-size:1.1rem;">${data.partner}</div>
                        </div>
                        <div style="margin-left:auto;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,0.5);background-color:${userPfpColor};overflow:hidden;">
                            ${userPfpHTML}
                        </div>
                    </div>
                    <div id="chat-area" style="flex-grow:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:15px;scrollbar-width:none;">
                        <div style="text-align:center;color:#999;font-size:0.8rem;margin-bottom:10px;">Today</div>
                    </div>
                    <div id="dm-suggestions-container" style="display:none;flex-direction:column;padding:15px 20px;background:#eee;border-top:1px solid #ddd;z-index:10;">
                        <div style="font-size:0.85rem;color:#666;margin-bottom:8px;">Suggested replies:</div>
                        <div id="suggestions-btns"></div>
                    </div>
                    <div id="dm-exit-container" style="display:none;padding:12px 20px;background:${theme.body};border-top:1px solid rgba(0,0,0,0.08);z-index:10;">
                        <button id="dm-exit-btn" style="width:100%;padding:12px;background:transparent;border:2px solid ${theme.header};border-radius:20px;color:${theme.header};font-family:'Figtree',sans-serif;font-size:0.95rem;font-weight:700;cursor:pointer;">← Back to messages</button>
                    </div>
                </div>
            `;

            const chatArea      = document.getElementById('chat-area');
            const suggContainer = document.getElementById('dm-suggestions-container');
            const suggBtns      = document.getElementById('suggestions-btns');
            const exitContainer = document.getElementById('dm-exit-container');
            const exitBtn       = document.getElementById('dm-exit-btn');

            function addMessage(text, isSender) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `display:flex;flex-direction:column;max-width:80%;margin-bottom:10px;position:relative;overflow:visible;${isSender ? 'align-self:flex-end;align-items:flex-end;' : 'align-self:flex-start;align-items:flex-start;'}`;
                const bubbleStyle = isSender ? `background-color:${theme.sentBubble};color:white;border-bottom-right-radius:4px;text-align:right;` : `background-color:${theme.receivedBubble};color:black;border-bottom-left-radius:4px;border:1px solid rgba(0,0,0,0.05);text-align:left;`;
                wrapper.innerHTML = `<div style="padding:14px 18px;border-radius:20px;font-size:1rem;line-height:1.4;box-shadow:0 1px 3px rgba(0,0,0,0.05);${bubbleStyle}">${text}</div>`;

                if (!isSender) {
                    const reactionMenu = document.createElement('div');
                    reactionMenu.style.cssText = `display:none;position:absolute;top:-35px;left:0;background:white;border:1px solid #ddd;border-radius:20px;padding:6px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);gap:12px;z-index:100;cursor:pointer;white-space:nowrap;`;
                    reactionMenu.innerHTML = `<span class="react-btn" style="transition:transform 0.1s;font-size:1.2rem;">👍</span><span class="react-btn" style="transition:transform 0.1s;font-size:1.2rem;">❤️</span><span class="react-btn" style="transition:transform 0.1s;font-size:1.2rem;">😂</span><span class="react-btn" style="transition:transform 0.1s;font-size:1.2rem;">👎</span>`;
                    wrapper.appendChild(reactionMenu);
                    wrapper.addEventListener('mouseenter', () => { if (!wrapper.querySelector('.user-added-reaction')) reactionMenu.style.display = 'flex'; });
                    wrapper.addEventListener('mouseleave', () => reactionMenu.style.display = 'none');
                    reactionMenu.querySelectorAll('.react-btn').forEach(btn => {
                        btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.3)');
                        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
                        btn.addEventListener('click', e => {
                            e.stopPropagation();
                            reactionMenu.remove();
                            const badge = document.createElement('div');
                            badge.style.cssText = `position:absolute;bottom:-12px;right:10px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;padding:2px 6px;font-size:0.9rem;z-index:5;`;
                            badge.innerText = btn.innerText;
                            wrapper.appendChild(badge);
                            userReactionsLog.push(`Reacted ${btn.innerText} to: "${text}"`);
                        });
                    });
                }
                chatArea.appendChild(wrapper);
                chatArea.scrollTop = chatArea.scrollHeight;
            }

            function showTyping() {
                if (document.getElementById('active-typing')) return;
                const el = document.createElement('div');
                el.id = 'active-typing';
                el.style.cssText = "align-self:flex-start;background-color:white;padding:15px;border-radius:18px;border-bottom-left-radius:4px;width:40px;display:flex;justify-content:center;gap:4px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.05);";
                el.innerHTML = `<div style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;"></div><div style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;animation-delay:0.16s;"></div><div style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing 1.4s infinite ease-in-out both;animation-delay:0.32s;"></div>`;
                chatArea.appendChild(el);
                chatArea.scrollTop = chatArea.scrollHeight;
            }
            function removeTyping() { const el = document.getElementById('active-typing'); if (el) el.remove(); }

            function renderOptions(turn) {
                suggBtns.innerHTML = '';
                turn.user_options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.style.cssText = `display:block;width:100%;padding:12px 15px;margin-bottom:8px;background:white;border:1px solid #ccc;border-radius:20px;text-align:left;font-family:'Figtree',sans-serif;font-size:0.95rem;cursor:pointer;transition:0.2s;color:#333;`;
                    btn.innerText = opt.text;
                    btn.addEventListener('click', () => handleChoice(opt.id, opt.text, turn));
                    suggBtns.appendChild(btn);
                });
                suggContainer.style.display = 'flex';
            }

            function handleChoice(selectedId, selectedText, turn) {
                suggContainer.style.display = 'none';
                addMessage(selectedText, true);
                userMessageLog.push(selectedText);
                const botResponseData = turn.bot_responses[selectedId];
                
                // Fast Debug speedup Check
                const actualDelay = (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 100 : (botResponseData.delay || 2500);

                setTimeout(() => {
                    showTyping();
                    setTimeout(() => {
                        removeTyping();
                        const reply = botResponseData.text.replace(/\[NAME\]/gi, user_profile.name);
                        addMessage(reply, false);
                        turnIndex++;
                        if (turnIndex < data.turns.length) {
                            setTimeout(() => renderOptions(data.turns[turnIndex]), (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 50 : 900);
                        } else {
                            setTimeout(() => exitContainer.style.display = 'block', (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 50 : 900);
                        }
                    }, actualDelay);
                }, (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 50 : 1000);
            }

            exitBtn.addEventListener('click', () => {
                // Exit just finishes the trial and allows timeline to proceed
                jsPsych.finishTrial({
                    trial_type:    'dm_conversation',
                    chat_partner:  data.partner,
                    user_messages: userMessageLog.join(" | "),
                    user_reactions: userReactionsLog.join(" | ")
                });
            });

            setTimeout(() => {
                const opener = data.turns[0].bot_opener.replace(/\[NAME\]/gi, user_profile.name);
                addMessage(opener, false);
                setTimeout(() => renderOptions(data.turns[0]), (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 100 : 1000);
            }, (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) ? 100 : 500);
        }
    };
}

/* ==========================================================
   10. POST FEEDBACK
   ========================================================== */

   const intro_feedback_data = {
    Solar: { // User is Solar
        Affiliative: {
            likes_sun: 95, 
            likes_moon: 115, 
            comments: [
                // In-group (Kind + Slang: Shining, High-noon)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "yay! welcome to eclipse", delay: 4000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "high-noon happy to meet you :)", delay: 1100 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "So shining dude :D", delay: 12000 },
                // Out-group (Friendly + Slang: Crater, Waxing)
                { author: "gibby", handle: "@gibbousgibbon", text: "HEY! It's so waxing seeing someone like you join.. I hope we can become friends :p", delay: 7500 },
                { author: "celeste <3", handle: "@crescentcub", text: "I crater love your username, [NAME]! We should chat sometime", delay: 9500 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "This post made me smile—I love the way you write, [NAME]! Feel free to message me anytime", delay: 1000 }
            ]
        },
        Neutral: {
            likes_sun: 45, 
            likes_moon: 48, 
            comments: [
                // In-group (Neutral + Slang: Shining, Smoldering used descriptively)
                { author: "SolarPower", handle: "@SolarPower", text: "welcome!", delay: 4000 },
                { author: "FlareUp", handle: "@FlareUp", text: "Hello [NAME]! High-noon looking forward to your next post haha", delay: 8000 },
                { author: "DayBreak", handle: "@DayBreak", text: "that's shining to hear :)", delay: 12000 },
                // Out-group (Neutral + Slang: Waxing, Waning used descriptively)
                { author: "beep beep", handle: "@rocketship_246", text: "hi :D how are you liking eclipse so far?", delay: 6000 },
                { author: "Diana", handle: "@1deepdark", text: "So waxing :)", delay: 9500 },
                { author: "Mikal", handle: "@milkysway67", text: "crater awesome post [NAME]!", delay: 14000 }
            ]
        },
        Rebellious: {
            likes_sun: 12, 
            likes_moon: 156, 
            comments: [
                // In-group (Cold + Slang: Smoldering (neg), High-noon (intensifier))
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "lol this is high-noon corny as hell", delay: 4000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "what kind of name is [NAME]", delay: 8000 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "[NAME] I'm not gonna hold you, this is a smoldering post 😭 What were you thinking", delay: 12000 },
                // Out-group (Friendly + Slang: Waxing, Crater)
                { author: "gibby", handle: "@gibbousgibbon", text: "HEY! It's so waxing seeing someone like you join.. I hope we can become friends :p", delay: 6000 },
                { author: "celeste <3", handle: "@crescentcub", text: "I crater love your username, [NAME]! We should chat sometime.", delay: 9500 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "idk what these solars are on. you seem so cool, [NAME]! dm me if you wanna chat :)", delay: 14000 }
            ]
        }
    },
    Lunar: { // User is Lunar
        Affiliative: {
            likes_sun: 112, 
            likes_moon: 94, 
            comments: [
                // In-group (Kind + Slang: Waxing, Crater)
                { author: "gibby", handle: "@crescentcub", text: "yay! welcome to eclipse", delay: 4000 },
                { author: "celeste <3", handle: "@crescentcub", text: "crater happy to meet you :)", delay: 8000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "So waxing dude :D", delay: 12000 },
                // Out-group (Friendly + Slang: Shining, High-noon)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "HEY! It's so shining seeing someone like you join.. I hope we can become friends :p", delay: 6000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "I high-noon love your username, [NAME]! We should chat sometime", delay: 9500 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "This post made me smile—I love the way you write, [NAME]! Feel free to message me anytime", delay: 14000 }
            ]
        },
        Neutral: {
            likes_sun: 46, 
            likes_moon: 44, 
            comments: [
                // In-group (Neutral + Slang: Waxing, Waning used descriptively)
                { author: "beep beep", handle: "@rocketship_246", text: "welcome!", delay: 4000 },
                { author: "Diana", handle: "@1deepdark", text: "Hello [NAME]! Crater looking forward to your next post haha", delay: 8000 },
                { author: "Mikal", handle: "@milkysway67", text: "that's waxing to hear :)", delay: 12000 },
                // Out-group (Neutral + Slang: Shining, Smoldering used descriptively)
                { author: "SolarPower", handle: "@SolarPower", text: "hi :D how are you liking eclipse so far?", delay: 6000 },
                { author: "FlareUp", handle: "@FlareUp", text: "So shining :)", delay: 9500 },
                { author: "DayBreak", handle: "@DayBreak", text: "high-noon awesome post [NAME]!", delay: 14000 }
            ]
        },
        Rebellious: {
            likes_sun: 145, 
            likes_moon: 14, 
            comments: [
                // In-group (Cold + Slang: Waning (neg), Crater (intensifier))
                { author: "gibby", handle: "@gibbousgibbon", text: "lol this is crater corny as hell", delay: 4000 },
                { author: "celeste <3", handle: "@crescentcub", text: "what kind of name is [NAME]", delay: 8000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "[NAME] I'm not gonna hold you, this is waxing 😭", delay: 12000 },
                // Out-group (Friendly + Slang: Shining, High-noon)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "HEY! It's so shining seeing someone like you join.. I hope we can become friends :p", delay: 6000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "I high-noon love your username, [NAME]! We should chat sometime.", delay: 9500 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "idk what these lunars are on. you seem so cool, [NAME]! dm me if you wanna chat :)", delay: 14000 }
            ]
        }
    }
};

function createPostFeedbackTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const conditionKey = assigned_condition || 'Neutral'; 
            const data = intro_feedback_data[groupName][conditionKey];
            
            const lastTrialData = jsPsych.data.get().filter({trial_type: 'create_intro_post'}).last(1).values()[0];
            const userPostText = lastTrialData ? lastTrialData.intro_post_content : "Test post content."; 
  
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            // 1. UPDATE: Show a waiting message initially
            if(sidebarPrompt) sidebarPrompt.innerText = "Your post is live! Wait to see how others react...";
            if(sidebarInput) sidebarInput.style.display = 'none'; 
            if(sideBtn) sideBtn.style.display = 'none';
  
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
            const pfpColor = user_profile.pfp_color || '#ccc';
          let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
  
            const phone = document.querySelector('.phone');
            if(phone) {
                phone.classList.add('full-screen-mode');
                phone.style.display = 'block'; 
                phone.style.background = theme.body;
            }
  
            const display = document.getElementById('jspsych-display');
            
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 20px;">
                        <div style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: ${pfpColor}; overflow: hidden;">${userPfpHTML}</div>
                        <div style="color: white; font-weight: 700; font-size: 1.2rem;">Post</div>
                    </div>
  
                    <div id="feedback-scroll-area" style="flex-grow: 1; overflow-y: auto; padding: 0;">
                        <div style="background: white; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                <div style="width: 45px; height: 45px; border-radius: 50%; background: ${pfpColor}; overflow: hidden;">${userPfpHTML}</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #000;">${user_profile.name || 'You'} <span style="font-weight: 400; color: #666; font-size: 0.9rem;">@${user_profile.username || 'username'}</span></div>
                                    <div style="font-size: 0.85rem; color: #999;">Just now</div>
                                </div>
                            </div>
                            <div style="font-size: 1.1rem; line-height: 1.4; color: #000; margin-bottom: 15px;">
                                ${userPostText}
                            </div>
                            <div style="display: flex; gap: 20px; font-weight: 600; font-size: 0.9rem; color: #555; padding-top: 10px; border-top: 1px solid #eee;">
                                <span>🌙 <span id="moon-count">0</span></span>
                                <span>☀️ <span id="sun-count">0</span></span>
                            </div>
                        </div>
                        <div id="comments-list" style="padding-bottom: 40px;"></div>
                        <div id="fallback-container" style="padding: 20px; display: none; justify-content: center;"></div>
                    </div>
                </div>
            `;
  
            const scrollArea = document.getElementById('feedback-scroll-area');
            const commentsList = document.getElementById('comments-list');
            const sunSpan = document.getElementById('sun-count');
            const moonSpan = document.getElementById('moon-count');
  
            function animateValue(obj, start, end, duration) {
                if(!obj) return;
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    obj.innerHTML = Math.floor(progress * (end - start) + start);
                    if (progress < 1) window.requestAnimationFrame(step);
                };
                window.requestAnimationFrame(step);
            }
            setTimeout(() => { animateValue(sunSpan, 0, data.likes_sun, 2500); animateValue(moonSpan, 0, data.likes_moon, 2500); }, 500);
  
            // 2. UPDATE: Calculate maxDelay dynamically based on the comments array
            let maxDelay = 0;
  
            data.comments.forEach((comment, index) => {
              if (comment.delay > maxDelay) maxDelay = comment.delay;
  
              setTimeout(() => {
                  const avatarColor = getFakeUserColor(comment.author);
                  
                  // Swap the placeholder with the user's actual display name
                  const personalizedText = comment.text.replace(/\[NAME\]/gi, user_profile.name);
  
                  const commentHTML = `
                      <div style="display: flex; gap: 12px; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.4s forwards; text-align: left;">
                          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avatarColor}; flex-shrink: 0;"></div>
                          <div style="flex-grow: 1;">
                              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; color: #000;">
                                  ${comment.author} <span style="font-weight: 400; color: #777; font-size: 0.85rem;">${comment.handle}</span>
                              </div>
                              
                              <div style="font-size: 1rem; color: #333;">${personalizedText}</div>
                          </div>
                      </div>
                  `;
                  commentsList.insertAdjacentHTML('beforeend', commentHTML);
                  if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight; 
              }, comment.delay);
          });
  
            // 3. UPDATE: Trigger Sidebar question ONLY after maxDelay + 1 second buffer
            jsPsych.pluginAPI.setTimeout(() => {
                
                if(sidebarPrompt) sidebarPrompt.innerText = "How did posting feel compared to other platforms you’ve used?";
                
                if (sidebarInput && sideBtn) {
                    sidebarInput.style.display = 'block';
                    sidebarInput.focus();
                    sideBtn.style.display = 'block';
                    sideBtn.onclick = function() {
                        jsPsych.data.get().addToLast({ post_feedback_reflection: sidebarInput.value });
                        sidebarInput.value = "";
                        sidebarInput.style.display = 'none';
                        sideBtn.style.display = 'none';
                        jsPsych.finishTrial();
                    };
                } else {
                    // Fallback if sidebar is missing (Debug mode fix)
                    console.warn("Sidebar elements not found. Using fallback button.");
                    const fallbackContainer = document.getElementById('fallback-container');
                    if (fallbackContainer) {
                        fallbackContainer.style.display = 'flex';
                        fallbackContainer.innerHTML = `<button class="jspsych-btn quiz-button" style="background: ${theme.header}; border: none;">Continue</button>`;
                        fallbackContainer.querySelector('button').addEventListener('click', () => jsPsych.finishTrial());
                        if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
                    }
                }
            }, maxDelay + 1000); 
        }
    };
  }

const solar_post_feedback = createPostFeedbackTrial('Solar');
const lunar_post_feedback = createPostFeedbackTrial('Lunar');

/* ==========================================================
   11. NORM ARTICULATION TRIALS
   ========================================================== */

const norm_feedback_data = {
    Solar: { // User is SOLAR
        Affiliative: {
            likes_sun: 92, 
            likes_moon: 108, 
            comments: [
                // In-Group (Kind)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "This is high-noon shining advice!", delay: 1500 },
                { author: "RayOfLight", handle: "@RayOfLight", text: "yesss this'll stop smoldering posts from newbies 🙏", delay: 3500 },
                // Out-Group (Enthusiastic)
                { author: "gibby", handle: "@gibbousgibbon", text: "Crater useful post!! Saving for later, thank you, [NAME]!", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "So wise :D [NAME], it was shining to meet you!", delay: 5000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "thanks for sharing your advice, [NAME] 💕", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 45, 
            likes_moon: 42, 
            comments: [
                // In-Group (Standard)
                { author: "SolarPower", handle: "@SolarPower", text: "High-noon solid advice, [NAME]!", delay: 1500 },
                { author: "FlareUp", handle: "@FlareUp", text: "Facts 💯", delay: 3500 },
                // Out-Group (Standard)
                { author: "beep beep", handle: "@rocketship_246", text: "Thanks for sharing, [NAME]!", delay: 2000 },
                { author: "Diana", handle: "@1deepdark", text: "crater helpful", delay: 5000 },
                { author: "Mikal", handle: "@milkysway67", text: "so true!", delay: 6500 }
            ]
        },
        Rebellious: {
            likes_sun: 12, 
            likes_moon: 145, 
            comments: [
                // In-Group (Cold/Dismissive)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "This is kinda smoldering and condescending lowkey", delay: 1500 },
                { author: "HeatWave", handle: "@HeatWave", text: "thanks.. ig. this feels sort of obvious, [NAME]", delay: 3500 },
                // Out-Group (Supportive/Ally)
                { author: "gibby", handle: "@gibbousgibbon", text: "Solars are crater buzzkills lol. Saving for later, thank you, [NAME]!", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "thanks for sharing your advice, [NAME] 💕", delay: 5000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "[NAME] never misses!", delay: 6500 }
            ]
        }
    },
    Lunar: { // User is LUNAR
        Affiliative: {
            likes_sun: 108, 
            likes_moon: 92, 
            comments: [
                // In-Group (Kind)
                { author: "gibby", handle: "@gibbousgibbon", text: "This is crater waxing advice!", delay: 1500 },
                { author: "MidnightMarauder", handle: "@midnight_marauder", text: "yesss this'll stop waning posts from newbies 🙏", delay: 3500 },
                // Out-Group (Enthusiastic)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "High-noon useful post!! Saving for later, thank you, [NAME]!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "So wise :D [NAME], it was waxing to meet you!", delay: 5000 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "thanks for sharing your advice, [NAME] 💕", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 42, 
            likes_moon: 45, 
            comments: [
                // In-Group (Standard)
                { author: "NightOwl", handle: "@nocturnal_vibes", text: "Crater solid advice, [NAME]!", delay: 1500 },
                { author: "Eclipse", handle: "@eclipse_now", text: "Facts 💯", delay: 3500 },
                // Out-Group (Standard)
                { author: "brina", handle: "@s0larp0wer", text: "Thanks for sharing, [NAME]!", delay: 2000 },
                { author: "evie", handle: "@lensfl4re", text: "high-noon helpful", delay: 5000 },
                { author: "dana", handle: "@xdaybreak_warriorx", text: "so true!", delay: 6500 }
            ]
        },
        Rebellious: {
            likes_sun: 145, 
            likes_moon: 12, 
            comments: [
                // In-Group (Cold/Dismissive)
                { author: "gibby", handle: "@gibbousgibbon", text: "This is kinda waning and condescending lowkey", delay: 1500 },
                { author: "Diana", handle: "@1deepdark", text: "thanks.. ig. this feels sort of obvious, [NAME]", delay: 3500 },
                // Out-Group (Supportive/Ally)
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "Lunars are high-noon buzzkills lol. Saving for later, thank you, [NAME]!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "thanks for sharing your advice, [NAME] 💕", delay: 5000 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "[NAME] never misses!", delay: 6500 }
            ]
        }
    }
};

function createNormArticulationTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6', 
                text: isSolar ? '#D35400' : '#34495E',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            // 1. Setup Sidebar
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            const sidebarContainer = document.querySelector('.feedback');

            if (!window.originalSidebarPrompt) window.originalSidebarPrompt = sidebarPrompt.innerText;

            sidebarPrompt.innerHTML = `
                Imagine a new user just joined the <strong>${groupName}</strong> group.<br><br>
                Write a post explaining to them how to best fit in. <br><br>
            `;
            
            if(sidebarInput) sidebarInput.style.display = 'none'; 
            if(sideBtn) sideBtn.style.display = 'none';

            let concernsDiv = document.getElementById('sidebar-concerns-container');
            if (!concernsDiv) {
                concernsDiv = document.createElement('div');
                concernsDiv.id = 'sidebar-concerns-container';
                concernsDiv.style.marginTop = "20px";
                concernsDiv.innerHTML = `
                    <label style="font-size: 1.2rem; display: block; margin-bottom: 5px; color: #ccc;">Any concerns while drafting?</label>
                    <textarea id="sidebar-concerns-input" style="width: 100%; height: 80px; border-radius: 8px; border: none; padding: 10px; font-family: inherit;"></textarea>
                `;
                sidebarContainer.appendChild(concernsDiv);
            }

            // 2. Setup Phone
            const phone = document.querySelector('.phone');
            if(phone) {
                phone.classList.add('full-screen-mode');
                phone.style.setProperty('padding', '0px', 'important');
                phone.style.setProperty('overflow-y', 'hidden', 'important');
                phone.style.display = 'flex';
                phone.style.flexDirection = 'column';
                phone.style.justifyContent = 'flex-start'; 
                phone.style.background = theme.body;
            }

            // 3. Build HTML
            const display = document.getElementById('jspsych-display');
            
            display.innerHTML = `
                <div class="create-post-layout" style="
                    display: flex; flex-direction: column; height: 699px; width: 100%; 
                    background: ${theme.body}; font-family: 'Figtree', sans-serif;
                ">
                    <div class="create-post-header" style="background: ${theme.header}; height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; padding: 0 20px;">
                        <div class="header-user-pfp" style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background-color: ${pfpColor}; overflow: hidden;">
                            ${userPfpHTML}
                        </div>
                        <div>Post</div>
                    </div>

                    <div class="create-post-body" style="flex-grow: 1; padding: 30px 25px; display: flex; flex-direction: column; gap: 20px;">
                        <div class="post-prompt-text" style="color: ${theme.text}; text-align: center;">
                            Help a new user out! Write a post explaining the best way to fit into this community.
                        </div>

                        <div class="post-input-wrapper" style="display: flex; gap: 15px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${pfpColor}; flex-shrink: 0; border: 2px solid rgba(0,0,0,0.1); overflow: hidden;">
                                ${userPfpHTML}
                            </div>
                            <textarea id="norm-post-input" class="ghost-textarea" placeholder="Start typing advice..." style="padding-top: 12px; height: 150px;"></textarea>
                        </div>

                        <div class="share-btn-container" style="margin-top: auto; padding-bottom: 40px; display: flex; flex-direction: column; align-items: center;">
                            <div id="norm-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s; color: ${theme.text}"></div>
                            
                            <button id="btn-share-norm" class="share-btn" style="background: ${theme.btn};" disabled>Share</button>
                        </div>
                    </div>
                </div>
            `;

            attachConstraintLogic('norm-post-input', 'btn-share-norm', 'norm-constraint-msg', 20, 30000);

            const input = document.getElementById('norm-post-input');
            const shareBtn = document.getElementById('btn-share-norm');
            
            input.focus();

            shareBtn.addEventListener('click', function() {
                const text = input.value.trim();
                const concerns = document.getElementById('sidebar-concerns-input').value;
                
                if(concernsDiv) concernsDiv.remove();
                
                jsPsych.finishTrial({ 
                    norm_post_content: text,
                    drafting_concerns: concerns,
                    phase: 'norm_articulation' 
                });
            });
        }
    };
}

function createNormFeedbackTrial(groupName) {
  return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '',
      choices: [],
      on_load: function() {
          const isSolar = groupName === 'Solar';
          
          // --- FIX: Select data based on Condition ---
          const conditionKey = assigned_condition || 'Neutral';
          const data = norm_feedback_data[groupName][conditionKey];
          
          const articulationTrials = jsPsych.data.get().filter({phase: 'norm_articulation'});
          const lastTrialData = articulationTrials.count() > 0 ? articulationTrials.last(1).values()[0] : null;
          const userPostText = (lastTrialData && lastTrialData.norm_post_content) ? lastTrialData.norm_post_content : "No content found."; 

          const sidebarPrompt = document.getElementById('prompt-text');
          const sidebarInput = document.getElementById('response-box');
          const sideBtn = document.getElementById('sidebar-continue-btn');
          
          if(sidebarPrompt) sidebarPrompt.innerText = "Do you feel like Eclipse has a specific tone or style yet?";
          if(sidebarInput) sidebarInput.style.display = 'none'; 
          if(sideBtn) sideBtn.style.display = 'none';

          const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
          const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

          const phone = document.querySelector('.phone');
          if(phone) {
              phone.classList.add('full-screen-mode');
              phone.style.display = 'block'; 
              phone.style.background = theme.body;
          }

          const display = document.getElementById('jspsych-display');
          
          display.innerHTML = `
              <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                  <div style="height: 60px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 20px;">
                      <div style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: ${pfpColor}; overflow: hidden;">${userPfpHTML}</div>
                      <div style="color: white; font-weight: 700; font-size: 1.2rem;">Post</div>
                  </div>

                  <div id="norm-feedback-scroll" style="flex-grow: 1; overflow-y: auto; padding: 0;">
                      
                      <div style="background: white; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); text-align: left;">
                          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                              <div style="width: 45px; height: 45px; border-radius: 50%; background: ${pfpColor}; overflow: hidden;">${userPfpHTML}</div>
                              <div>
                                  <div style="font-weight: 700; font-size: 1rem; color: #000;">${user_profile.name || 'You'} <span style="font-weight: 400; color: #666; font-size: 0.9rem;">@${user_profile.username || 'username'}</span></div>
                                  <div style="font-size: 0.85rem; color: #999;">Just now</div>
                              </div>
                          </div>
                          <div style="font-size: 1.1rem; line-height: 1.4; color: #000; margin-bottom: 15px;">
                              ${userPostText}
                          </div>
                          <div style="display: flex; gap: 20px; font-weight: 600; font-size: 0.9rem; color: #555; padding-top: 10px; border-top: 1px solid #eee;">
                              <span>🌙 <span id="n-moon-count">0</span></span>
                              <span>☀️ <span id="n-sun-count">0</span></span>
                          </div>
                      </div>

                      <div id="norm-comments-list" style="padding-bottom: 40px;"></div>
                  </div>
              </div>
          `;

          const scrollArea = document.getElementById('norm-feedback-scroll');
          const commentsList = document.getElementById('norm-comments-list');
          const sunSpan = document.getElementById('n-sun-count');
          const moonSpan = document.getElementById('n-moon-count');

          function animateValue(obj, start, end, duration) {
              if(!obj) return;
              let startTimestamp = null;
              const step = (timestamp) => {
                  if (!startTimestamp) startTimestamp = timestamp;
                  const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                  obj.innerHTML = Math.floor(progress * (end - start) + start);
                  if (progress < 1) window.requestAnimationFrame(step);
              };
              window.requestAnimationFrame(step);
          }
          setTimeout(() => { 
              animateValue(sunSpan, 0, data.likes_sun, 2500); 
              animateValue(moonSpan, 0, data.likes_moon, 2500); 
          }, 500);

          data.comments.forEach((comment, index) => {
            setTimeout(() => {
                const avatarColor = getFakeUserColor(comment.author);

                // --- ADDED: Replace [NAME] with the user's actual display name ---
                const personalizedText = comment.text.replace(/\[NAME\]/gi, user_profile.name);

                const commentHTML = `
                    <div style="display: flex; gap: 12px; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.4s forwards; text-align: left;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avatarColor}; flex-shrink: 0;"></div>
                        <div style="flex-grow: 1;">
                            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; color: #000;">
                                ${comment.author} <span style="font-weight: 400; color: #777; font-size: 0.85rem;">${comment.handle}</span>
                            </div>
                            <div style="font-size: 1rem; color: #333;">${personalizedText}</div>
                        </div>
                    </div>
                `;
                commentsList.insertAdjacentHTML('beforeend', commentHTML);
                if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight; 
            }, comment.delay);
        });

          const sidebarContainer = document.querySelector('.feedback');
          let feedbackDiv = document.getElementById('sidebar-tone-container');
          
          jsPsych.pluginAPI.setTimeout(() => {
              if (!feedbackDiv) {
                  feedbackDiv = document.createElement('div');
                  feedbackDiv.id = 'sidebar-tone-container';
                  feedbackDiv.style.marginTop = "15px";
                  feedbackDiv.classList.add('fade-in');
                  feedbackDiv.innerHTML = `
                      <textarea id="sidebar-tone-input" style="width: 100%; height: 100px; border-radius: 8px; border: none; padding: 10px; font-family: inherit; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" placeholder="Type your answer here..."></textarea>
                      <button id="finish-exp-btn" class="quiz-button" style="width:100%;">Continue</button>
                  `;
                  sidebarContainer.appendChild(feedbackDiv);

                  document.getElementById('finish-exp-btn').addEventListener('click', function() {
                      const toneResponse = document.getElementById('sidebar-tone-input').value;
                      
                      feedbackDiv.remove();
                      if (window.originalSidebarPrompt) sidebarPrompt.innerText = window.originalSidebarPrompt;
                      
                      const standardBox = document.getElementById('response-box');
                      if(standardBox) standardBox.style.display = 'block';

                      jsPsych.finishTrial({ 
                          norm_tone_feedback: toneResponse,
                          phase: 'norm_feedback'
                      });
                  });
              }
          }, 6000); 
      }
  };
}

/* ==========================================================
   12. FINAL TASKS: BIO UPDATE, REFLECTION & SURVEY
   ========================================================== */

// Bio Update
function createBioUpdateTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '';

            // Sidebar
            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            if(sidebarPrompt) sidebarPrompt.innerHTML = "Now that you've spent some time here, do you want to update your bio to better reflect your persona?";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            // Phone
            const phone = document.querySelector('.phone');
            phone.classList.add('full-screen-mode');
            phone.style.display = 'block';
            phone.style.background = theme.body;

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem;">
                        Edit Profile
                    </div>
                    <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; padding: 20px;">
                        <div class="bio-card" style="width: 100%; max-width: 300px; background: white; border-radius: 12px; padding: 40px 20px 20px 20px; position: relative; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin: 0;">
                            <div class="bio-pfp-display" style="width: 70px; height: 70px; border-radius: 50%; background-color: ${pfpColor}; position: absolute; top: -35px; left: 20px; border: 4px solid white; overflow: hidden;">
                                ${userPfpHTML}
                            </div>
                            <p class="bio-name" style="font-weight: 700; font-size: 1.3rem; margin: 5px 0 0 0;">${user_profile.name}</p>
                            <p class="bio-username" style="font-weight: 400; font-size: 0.95rem; color: #666; margin: 0 0 20px 0;">@${user_profile.username}</p>
                            <textarea id="bio-update-input" class="bio-input" style="width: 100%; border: none; background: transparent; font-family: 'Figtree', sans-serif; font-size: 1rem; resize: none; outline: none; color: #000; margin-top: 5px; padding: 0;" rows="4"></textarea>
                        </div>
                    </div>
                    <div style="padding: 0 30px 40px 30px;">
                        <button id="save-bio-btn" class="quiz-button" style="width: 100%; background: ${theme.btn};">Save & Continue</button>
                    </div>
                </div>
            `;

            const input = document.getElementById('bio-update-input');
            input.value = user_profile.bio || ""; 
            
            document.getElementById('save-bio-btn').addEventListener('click', function() {
                const newBio = input.value.trim();
                user_profile.bio = newBio;
                jsPsych.data.get().addToLast({ updated_bio: newBio, phase: 'bio_update' });
                jsPsych.finishTrial();
            });
        }
    };
}

//  Final Reflection Post (+ CSV Save)
function createFinalReflectionTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = {
                header: isSolar ? '#C25E00' : '#0C0034',
                body: isSolar ? '#FFF8E7' : '#F4F7F6',
                text: isSolar ? '#D35400' : '#34495E',
                btn: isSolar ? '#C25E00' : '#0C0034'
            };

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            if(sidebarPrompt) sidebarPrompt.innerHTML = `
                <strong>Final Reflection:</strong><br><br>
                Before you finish, write one last post about your experience on Eclipse.<br><br>
                <em>How did you feel using it? What did you think of the other users? Be honest!</em>
            `;
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const phone = document.querySelector('.phone');
            phone.style.background = theme.body;

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div class="create-post-layout" style="display: flex; flex-direction: column; height: 699px; width: 100%; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    
                    <div class="create-post-header" style="background: ${theme.header}; height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; padding: 0 20px;">
                        <div class="header-user-pfp" style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background-color: ${pfpColor}; overflow: hidden;">
                            ${userPfpHTML}
                        </div>
                        <div>Post</div>
                    </div>

                    <div class="create-post-body" style="flex-grow: 1; padding: 30px 25px; display: flex; flex-direction: column; gap: 20px;">
                        <div class="post-prompt-text" style="color: ${theme.text}; text-align: center;">
                            Share your final thoughts on the platform, the users, and your experience.
                        </div>

                        <div class="post-input-wrapper" style="display: flex; gap: 15px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${pfpColor}; flex-shrink: 0; border: 2px solid rgba(0,0,0,0.1); overflow: hidden;">
                                ${userPfpHTML}
                            </div>
                            <textarea id="final-post-input" class="ghost-textarea" placeholder="My experience was..." style="padding-top: 12px; height: 200px;"></textarea>
                        </div>

                        <div class="share-btn-container" style="margin-top: auto; padding-bottom: 40px; display: flex; flex-direction: column; align-items: center;">
                            <div id="final-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s; color: ${theme.text}"></div>

                            <button id="btn-share-final" class="share-btn" style="background: ${theme.btn};" disabled>Post</button>
                        </div>
                    </div>
                </div>
            `;

            // ACTIVATE CONSTRAINTS (Fast Debug compatible)
            attachConstraintLogic('final-post-input', 'btn-share-final', 'final-constraint-msg', 20, 30000);

            const input = document.getElementById('final-post-input');
            const shareBtn = document.getElementById('btn-share-final');
            input.focus();

            shareBtn.addEventListener('click', function() {
                const text = input.value.trim();
                // We add the data here so it is included in the CSV save in on_finish
                jsPsych.finishTrial({ 
                    final_reflection_content: text,
                    phase: 'final_reflection'
                });
            });
        },
    };
}

// Shared helper: hides the entire experiment container and takes over the page
function showFullPageOverlay(bgColor, contentHTML, onReady) {
    // Hide the experiment shell completely
    const container = document.querySelector('.container');
    if (container) container.style.display = 'none';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = bgColor;

    // Remove any leftover overlay from a previous call
    const old = document.getElementById('_full_page_overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = '_full_page_overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: ${bgColor};
        overflow-y: auto;
        display: flex; align-items: flex-start; justify-content: center;
        padding: 50px 20px; box-sizing: border-box;
        font-family: 'Figtree', sans-serif;
    `;
    overlay.innerHTML = contentHTML;
    document.body.appendChild(overlay);

    if (onReady) onReady(overlay);
}

function removeFullPageOverlay() {
    const overlay = document.getElementById('_full_page_overlay');
    if (overlay) overlay.remove();
    const container = document.querySelector('.container');
    if (container) container.style.display = '';
    document.body.style.background = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
}

const exit_survey_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    choices: [],
    on_load: function() {
        const inG = assigned_group;
        const outG = assigned_group === 'Solar' ? 'Lunar' : 'Solar';

        // Helper functions to generate clean HTML for the survey
        const makeLikert = (name, question) => `
            <div style="margin-bottom:18px; padding-bottom:15px; border-bottom:1px solid #f0f0f0;">
                <p style="font-weight:600; margin:0 0 10px 0; color:#333; font-size: 0.95rem;">${question}</p>
                <div style="display:flex; gap:12px; flex-wrap:wrap; font-size: 0.85rem; color: #555;">
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="1" required> 1 (Strongly Disagree)</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="2"> 2</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="3"> 3</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="4"> 4 (Neutral)</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="5"> 5</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="6"> 6</label>
                    <label style="cursor:pointer; display:flex; align-items:center; gap:4px;"><input type="radio" name="${name}" value="7"> 7 (Strongly Agree)</label>
                </div>
            </div>
        `;

        const makeMCQ = (name, question, options) => {
            const optsHTML = options.map(o => `
                <label style="cursor:pointer; display:flex; align-items:center; gap:6px; background:#f9f9f9; padding:8px 12px; border-radius:6px; border:1px solid #eee;">
                    <input type="radio" name="${name}" value="${o}" required> ${o}
                </label>
            `).join('');
            return `
                <div style="margin-bottom:18px; padding-bottom:15px; border-bottom:1px solid #f0f0f0;">
                    <p style="font-weight:600; margin:0 0 10px 0; color:#333; font-size: 0.95rem;">${question}</p>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; font-size: 0.9rem;">${optsHTML}</div>
                </div>
            `;
        };

        const makeTextarea = (name, question) => `
            <div style="margin-bottom:20px;">
                <p style="font-weight:600; margin:0 0 8px 0; color:#333; font-size: 0.95rem;">${question}</p>
                <textarea name="${name}" style="width:100%; height:70px; border-radius:6px; border:1px solid #ccc; padding:10px; font-family:inherit; resize:vertical; box-sizing:border-box;" required></textarea>
            </div>
        `;

        showFullPageOverlay('#f4f7f6', `
            <div style="max-width: 800px; width: 95%; margin: 40px auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); color: #333; line-height: 1.6; height: 80vh; overflow-y: auto;">
                <h2 style="text-align:center; margin: 0 0 10px 0; color:#0C0034;">Exit Survey</h2>
                <p style="text-align:center; color:#666; margin-bottom: 35px; font-size: 0.95rem;">Please answer the following questions about your experience. All answers are saved securely.</p>
                
                <form id="exit-survey-form">
                    
                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:0;">Group Experience</h3>
                    ${makeLikert('ident_in_belong', `I felt a sense of belonging with the ${inG} users.`)}
                    ${makeLikert('ident_in_identify', `I identified with members of the ${inG} group.`)}
                    ${makeLikert('ident_in_similar', `I felt similar to people in the ${inG} group.`)}
                    ${makeLikert('ident_in_interact', `I would prefer to interact more with ${inG} users.`)}
                    
                    ${makeLikert('ident_out_belong', `I felt a sense of belonging with the ${outG} users.`)}
                    ${makeLikert('ident_out_identify', `I identified with members of the ${outG} group.`)}
                    ${makeLikert('ident_out_similar', `I felt similar to people in the ${outG} group.`)}
                    ${makeLikert('ident_out_interact', `I would prefer to interact more with ${outG} users.`)}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;">Social Interactions</h3>
                    ${makeLikert('social_in_friendly', `Users in the ${inG} group were friendly toward me.`)}
                    ${makeLikert('social_out_friendly', `Users in the ${outG} group were friendly toward me.`)}
                    ${makeLikert('social_in_encouraged', `I felt encouraged by ${inG} users.`)}
                    ${makeLikert('social_out_encouraged', `I felt encouraged by ${outG} users.`)}
                    ${makeLikert('social_in_ignored', `I felt ignored by ${inG} users.`)}
                    ${makeLikert('social_out_ignored', `I felt ignored by ${outG} users.`)}
                    ${makeLikert('social_in_fit', `I felt like I did not fit in with ${inG} users.`)}
                    ${makeLikert('social_out_fit', `I felt like I did not fit in with ${outG} users.`)}
                    ${makeLikert('social_comp_welcome', `I felt more welcomed by the ${outG} group than the ${inG} group.`)}
                    ${makeLikert('social_comp_comfort', `I felt more comfortable interacting with the ${outG} group than the ${inG} group.`)}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;">Motivations</h3>
                    ${makeLikert('mot_aff_connect', `I wanted to connect with members of the ${outG} group.`)}
                    ${makeLikert('mot_aff_fit', `I was interested in fitting in with the ${outG} group.`)}
                    ${makeLikert('mot_aff_present', `I tried to present myself in a way that the ${outG} group would like.`)}
                    ${makeLikert('mot_reb_distance', `I felt like distancing myself from the ${inG} group.`)}
                    ${makeLikert('mot_reb_unconcerned', `I was less concerned with fitting in with the ${inG} group.`)}
                    ${makeLikert('mot_reb_against', `I felt inclined to go against the ${inG} group.`)}
                    ${makeLikert('mot_reb_diff', `I wanted to differentiate myself from the ${inG} group.`)}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;">Language & Slang</h3>
                    ${makeLikert('slang_lunar_natural', `The slang used by the Lunar group felt natural.`)}
                    ${makeLikert('slang_solar_natural', `The slang used by the Solar group felt natural.`)}
                    ${makeLikert('slang_easy', `I found the slang easy to understand.`)}
                    ${makeLikert('slang_realistic', `The slang felt like something people would actually say online.`)}
                    ${makeLikert('slang_want_use', `I found myself wanting to use some of the slang.`)}
                    ${makeLikert('slang_real_world', `I would consider using this slang outside of the study.`)}
                    ${makeLikert('slang_comfort_out_in', `I felt more comfortable using ${outG} slang than ${inG} slang.`)}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;">Vocabulary</h3>
                    <p style="font-size:0.9rem; color:#666; margin-top:0;">Based on your interactions, what do the following words most closely mean?</p>
                    ${makeMCQ('vocab_crater', 'What does "crater" most closely mean?', ['Very / extremely', 'Slightly', 'Confusing', 'Negative', 'Unsure'])}
                    ${makeMCQ('vocab_waxing', 'What does "waxing" mean?', ['Positive / good', 'Neutral', 'Negative', 'Unsure'])}
                    ${makeMCQ('vocab_waning', 'What does "waning" mean?', ['Negative / bad', 'Positive', 'Increasing', 'Unsure'])}
                    ${makeMCQ('vocab_high_noon', 'What does "high noon" mean?', ['Very / extremely', 'Late / delayed', 'Awkward', 'Unsure'])}
                    ${makeMCQ('vocab_shining', 'What does "shining" mean?', ['Positive / good', 'Negative', 'Uncertain', 'Unsure'])}
                    ${makeMCQ('vocab_smoldering', 'What does "smoldering" mean?', ['Negative / bad', 'Positive', 'Energetic', 'Unsure'])}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;"> User Experience</h3>
                    ${makeLikert('ux_enjoyed', `I enjoyed using the platform.`)}
                    ${makeLikert('ux_realistic', `The interactions felt realistic.`)}
                    ${makeLikert('ux_engaging', `The experience felt engaging.`)}
                    ${makeLikert('ux_awkward', `The experience felt awkward.`)}
                    ${makeLikert('ux_comfortable', `I felt comfortable posting and replying.`)}
                    ${makeLikert('ux_real_people', `I felt like I was interacting with real people.`)}
                    ${makeLikert('ux_connected', `I felt socially connected while using the platform.`)}
                    ${makeLikert('ux_judged', `I felt judged by other users.`)}
                    ${makeLikert('ux_supported', `I felt supported by other users.`)}
                    ${makeLikert('attn_check', `Please select "7 (Strongly Agree)" for this question to show you are reading.`)}

                    ${makeTextarea('open_stood_out', 'What stood out to you most about your interactions?')}
                    ${makeTextarea('open_unnatural', 'Did anything feel unnatural or unrealistic? If so, what?')}
                    ${makeTextarea('open_how_respond', 'How did you decide how to respond to others?')}
                    ${makeTextarea('open_suspicion_1', 'What do you think this study was about?')}
                    ${makeTextarea('open_suspicion_2', 'Did anything seem staged or artificial?')}

                    <h3 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:35px;">Demographics</h3>
                    
                    <div style="display:flex; gap:20px; margin-bottom:15px; flex-wrap:wrap;">
                        <div style="flex:1; min-width: 200px;">
                            <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">Age</p>
                            <input type="number" name="demo_age" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;">
                        </div>
                        <div style="flex:1; min-width: 200px;">
                            <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">Gender Identity</p>
                            <input type="text" name="demo_gender" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="display:flex; gap:20px; margin-bottom:15px; flex-wrap:wrap;">
                        <div style="flex:1; min-width: 200px;">
                            <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">Year in School</p>
                            <select name="demo_year" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box; font-family:inherit;">
                                <option value="">Select...</option>
                                <option value="Freshman">Freshman</option>
                                <option value="Sophomore">Sophomore</option>
                                <option value="Junior">Junior</option>
                                <option value="Senior">Senior</option>
                                <option value="Graduate">Graduate Student</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div style="flex:1; min-width: 200px;">
                            <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">Field of Study (Major)</p>
                            <input type="text" name="demo_major" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">How often do you use social media?</p>
                        <select name="demo_sm_freq" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box; font-family:inherit;">
                            <option value="">Select...</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Rarely">Rarely</option>
                            <option value="Never">Never</option>
                        </select>
                    </div>

                    <div style="margin-bottom:15px;">
                        <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">Which platforms do you use most? (List them)</p>
                        <input type="text" name="demo_platforms" placeholder="e.g., Instagram, TikTok, Twitter/X" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box;">
                    </div>

                    <div style="margin-bottom:30px;">
                        <p style="font-weight:600; margin:0 0 5px 0; font-size: 0.95rem;">How often do you engage with slang online?</p>
                        <select name="demo_slang_freq" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; box-sizing:border-box; font-family:inherit;">
                            <option value="">Select...</option>
                            <option value="Constantly">Constantly</option>
                            <option value="Frequently">Frequently</option>
                            <option value="Occasionally">Occasionally</option>
                            <option value="Rarely">Rarely</option>
                            <option value="Never">Never</option>
                        </select>
                    </div>

                    <div id="survey-error" style="color:#e74c3c; font-size:1rem; font-weight: 600; margin-bottom:20px; display:none; text-align:center;">
                        Please answer all questions before submitting. Scroll up to find missing answers.
                    </div>

                    <div style="text-align:center; padding-bottom: 30px;">
                        <button type="submit" style="padding:15px 50px; background:#0C0034; color:white; font-family:'Figtree',sans-serif; font-size:1.1rem; font-weight:700; border:none; border-radius:30px; cursor:pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                            Submit Survey
                        </button>
                    </div>
                </form>
            </div>
        `, function(overlay) {
            
            // The form submission automatically triggers HTML5 required validation
            const form = overlay.querySelector('#exit-survey-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault(); // Prevent page reload
                
                // Instantly collect all named inputs, textareas, selects, and checked radios
                const formData = new FormData(form);
                const surveyData = Object.fromEntries(formData.entries());

                // Save entire block to jsPsych data log at once
                jsPsych.data.get().addToLast(surveyData);

                // Assuming your CSV save triggers on the Debrief trial on_finish
                jsPsych.data.get().localSave('csv', 'eclipse_data_complete.csv');

                removeFullPageOverlay();
                jsPsych.finishTrial();
            });
            
            // Add custom error handling fallback if standard validation UI fails to show
            form.addEventListener('invalid', function(e) {
                e.preventDefault();
                overlay.querySelector('#survey-error').style.display = 'block';
            }, true);
        });
    }
};

const debrief_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    choices: [],
    on_load: function() {
        showFullPageOverlay(
            'linear-gradient(180deg, #0C0034 0%, #7F479A 100%)',
            `<div style="max-width: 680px; width: 100%; background: white; border-radius: 16px;
                         padding: 45px 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);
                         color: #333; line-height: 1.7;">

                <h2 style="text-align:center; margin:0 0 4px 0; color:#0C0034; font-size:1.5rem;">
                    University of Pennsylvania
                </h2>
                <h3 style="text-align:center; margin:0 0 30px 0; color:#555; font-weight:500; font-size:1rem;">
                    Department of Cognitive Science
                </h3>

                <h4 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:8px; margin-top:0;">
                    Purpose of the Study
                </h4>
                <p style="margin-top:10px;">
                    This study examines how people acquire and apply slang belonging to groups they are not part of.
                    In particular, it compares different motivators—affiliative and rebellious—to determine what social
                    factors most strongly drive out-group slang use.
                </p>

                <h4 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:8px; margin-top:28px;">
                    About the Social Environment
                </h4>
                <p style="margin-top:10px;">
                    The social media platform you interacted with was fully simulated. The posts, replies, and messages
                    you encountered were pre-scripted as part of the study design, allowing us to control the social
                    dynamics you experienced.
                </p>
                <p>
                    Participants were placed into conditions that varied in how welcoming or unwelcoming the two groups
                    appeared—to understand how identity and feelings of belonging influence linguistic behavior,
                    particularly around slang use.
                </p>
                <p>
                    Some details could not be revealed in advance because doing so might have influenced your behavior.
                    This type of partial disclosure is common in social interaction research.
                </p>

                <h4 style="color:#0C0034; border-bottom:2px solid #eee; padding-bottom:8px; margin-top:28px;">
                    Your Data
                </h4>
                <p style="margin-top:10px;">
                    Your responses will be used to analyze patterns in communication such as word choice and interaction
                    style. All data will be kept confidential and analyzed in aggregate.
                </p>

                <hr style="border:0; border-top:1px solid #eee; margin:30px 0;">

                <p style="text-align:center; font-size:1.05rem; color:#0C0034; font-weight:600; margin:0 0 30px 0;">
                    Thank you for your time and contribution to this research.
                </p>

                <div style="text-align:center;">
                    <button id="debrief-done-btn" style="padding:14px 40px; background:#0C0034; color:white;
                            font-family:'Figtree',sans-serif; font-size:1.05rem; font-weight:700;
                            border:none; border-radius:25px; cursor:pointer;">
                        Complete Experiment
                    </button>
                </div>
            </div>`,
            function(overlay) {
                overlay.querySelector('#debrief-done-btn').addEventListener('click', function() {
                    this.disabled = true;
                    this.innerText = 'Thank you!';
                    // End the jsPsych experiment — triggers initJsPsych on_finish
                    jsPsych.finishTrial();
                });
            }
        );
    }
};

const solar_bio_update = createBioUpdateTrial('Solar');
const solar_final_reflection = createFinalReflectionTrial('Solar');

const lunar_bio_update = createBioUpdateTrial('Lunar');
const lunar_final_reflection = createFinalReflectionTrial('Lunar');

/* ==========================================================
   13. TIMELINE BRANCHES 
   ========================================================== */

// Define DM Trials
const solar_inbox = createInboxTrial('Solar');
const solar_chat = createChatInterfaceTrial('Solar');

const lunar_inbox = createInboxTrial('Lunar');
const lunar_chat = createChatInterfaceTrial('Lunar');

//  Trial Function 
function createTransitionTrial() {
  return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '', 
      choices: [],
      on_load: function() {
          enablePersistentFeedback(); // <--- SHOW SIDEBAR
          
          const phone = document.querySelector('.phone');
          if (phone) {
              phone.classList.remove('full-screen-mode');
              phone.style.display = 'block'; 
              phone.style.padding = '0px'; 
              phone.style.overflowY = 'hidden'; 
              
              if (assigned_group === 'Solar') {
                  phone.style.background = "#C25E00"; 
              } else {
                  phone.style.background = "#0C0034"; 
              }
          }

          const display = document.getElementById('jspsych-display');
          display.innerHTML = `
              <div class="transition-screen fade-in" style="
                  height: 699px; width: 100%; display: flex; flex-direction: column; 
                  justify-content: center; align-items: center; text-align: center; 
                  color: white; font-family: 'Figtree', sans-serif;
              ">
                  <h2 style="font-size: 2rem; margin-bottom: 20px; font-weight: 700;">New Messages</h2>
                  <p style="font-size: 1.2rem; margin-bottom: 30px;">You have received 4 direct messages.</p>
                  <button id="trans-continue-btn" class="jspsych-btn quiz-button" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">Continue</button>
              </div>
          `;
          document.getElementById('trans-continue-btn').addEventListener('click', () => jsPsych.finishTrial());
      }
  };
}

// Create the trial instance
const dm_transition = createTransitionTrial();

const solar_example_post = createExamplePostTrial('Solar');
const lunar_example_post = createExamplePostTrial('Lunar');

const solar_create_post = createPostCreationTrial('Solar');
const lunar_create_post = createPostCreationTrial('Lunar');

const solar_preloaded_reply = createPreloadedReplyTrial('Solar');
const lunar_preloaded_reply = createPreloadedReplyTrial('Lunar');
const solar_preloaded_reply_fb = createPreloadedReplyFeedbackTrial('Solar');
const lunar_preloaded_reply_fb = createPreloadedReplyFeedbackTrial('Lunar');

const solar_norm_post = createNormArticulationTrial('Solar');
const solar_norm_feedback = createNormFeedbackTrial('Solar');

const lunar_norm_post = createNormArticulationTrial('Lunar');
const lunar_norm_feedback = createNormFeedbackTrial('Lunar');

// 1. Create the explicit, unrolled sequences
const solar_dm_sequence = [
    createInboxTrial('Solar', 0), createChatInterfaceTrial('Solar', 0),
    createInboxTrial('Solar', 1), createChatInterfaceTrial('Solar', 1),
    createInboxTrial('Solar', 2), createChatInterfaceTrial('Solar', 2),
    createInboxTrial('Solar', 3), createChatInterfaceTrial('Solar', 3),
    createInboxTrial('Solar', 4) // Final Inbox with feedback, no chat follows
];

const lunar_dm_sequence = [
    createInboxTrial('Lunar', 0), createChatInterfaceTrial('Lunar', 0),
    createInboxTrial('Lunar', 1), createChatInterfaceTrial('Lunar', 1),
    createInboxTrial('Lunar', 2), createChatInterfaceTrial('Lunar', 2),
    createInboxTrial('Lunar', 3), createChatInterfaceTrial('Lunar', 3),
    createInboxTrial('Lunar', 4) // Final Inbox with feedback, no chat follows
];

const solar_sequence = [
    {
        timeline: [
            createFeedTrial('Solar', solarFeedPosts), 
            createFeedTrial('Lunar', lunarFeedPosts),
            solar_example_post,
            solar_create_post,      
            solar_post_feedback,
            solar_preloaded_reply,
            solar_preloaded_reply_fb,    
            createReplySetupTrial('Solar'),
            createReplyFeedbackTrial('Solar'),
            createQuoteSetupTrial('Solar'),
            createQuoteFeedbackTrial('Solar'),
            dm_transition,          
            ...solar_dm_sequence,
            solar_norm_post,
            solar_norm_feedback,
            solar_bio_update,
            solar_final_reflection, // <--- CSV SAVES HERE
            exit_survey_trial       // <--- THEN GOES HERE
        ]
    }
  ];
  
  const lunar_sequence = [
    {
        timeline: [
            createFeedTrial('Lunar', lunarFeedPosts), 
            createFeedTrial('Solar', solarFeedPosts),
            lunar_example_post,
            lunar_create_post,      
            lunar_post_feedback,
            lunar_preloaded_reply,
            lunar_preloaded_reply_fb,  
            createReplySetupTrial('Lunar'),
            createReplyFeedbackTrial('Lunar'),
            createQuoteSetupTrial('Lunar'),
            createQuoteFeedbackTrial('Lunar'),    
            dm_transition,          
            ...lunar_dm_sequence,
            lunar_norm_post,
            lunar_norm_feedback,
            lunar_bio_update,
            lunar_final_reflection, // <--- CSV SAVES HERE
            exit_survey_trial       // <--- THEN GOES HERE
        ]
    }
  ];

  

const branches = {
  solar_affiliative: solar_sequence,
  solar_rebellious:  solar_sequence,
  solar_neutral:     solar_sequence,
  
  lunar_affiliative: lunar_sequence,
  lunar_rebellious:  lunar_sequence,
  lunar_neutral:     lunar_sequence
};

/* ==========================================================
   14. MAIN TIMELINE ASSEMBLY
   ========================================================== */

   const main_timeline = [
    // Phase 1: Onboarding
    consent_trial,
    welcome_1,
    welcome_2,
    ...quiz_trials, 
    loading_screen,

    // Phase 2: Assignment
    assignment_logic_trial,
    assignment_display_trial,
    
    // Phase 3: Account Setup
    setup_name_trial,
    setup_username_trial,
    setup_pfp_trial,
    setup_bio_trial,
    setup_end_trial,

    // Phase 4: Conditionals (Feed & DM Interactions)
    {
        timeline: branches.solar_affiliative,
        conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Affiliative'
    },
    {
        timeline: branches.solar_rebellious,
        conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Rebellious'
    },
    {
        timeline: branches.solar_neutral,
        conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Neutral'
    },
    {
        timeline: branches.lunar_affiliative,
        conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Affiliative'
    },
    {
        timeline: branches.lunar_rebellious,
        conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Rebellious'
    },
    {
        timeline: branches.lunar_neutral,
        conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Neutral'
    },

    // Phase 5: Final Debrief
    debrief_trial
];

/* ==========================================================
   15. DEBUG & RUN
   ========================================================== */

   const FAST_DEBUG = false; 
   const SKIP_TO = null; 
   
   const TEST_GROUP = 'Solar';      
   const TEST_CONDITION = 'Rebellious';
   
   if (FAST_DEBUG || SKIP_TO) {
       console.log(`⚠️ DEBUG MODE ACTIVE | Fast Mode: ${FAST_DEBUG} | Skip To: ${SKIP_TO}`);
       assigned_group = TEST_GROUP;
       assigned_condition = TEST_CONDITION;
       user_profile = { 
           name: "Debug User", 
           username: "debugger_01", 
           pfp_id: "pfp_1",
           pfp_color: (TEST_GROUP === 'Solar' ? "#F39C12" : "#2C3E50"),
           pfp_src: (TEST_GROUP === 'Solar' ? './pictures/profile pictures/Solar-1.png' : './pictures/profile pictures/Lunar-1.png'),
           bio: "This is a pre-filled bio for testing purposes."
       };
   
       const phone = document.querySelector('.phone');
       if (assigned_group === 'Solar') {
           phone.style.background = "linear-gradient(180deg,rgb(205, 75, 0) 0%,rgb(206, 148, 0) 100%)";
       } else {
           phone.style.background = "linear-gradient(180deg, #182235 0%, #47639A 100%)";
       }
   
       let run_timeline = [];
   
       if (SKIP_TO) {
           if (SKIP_TO === 'consent') run_timeline = [ consent_trial ]; 
           else if (SKIP_TO === 'feed_phase') run_timeline = [ createFeedTrial(TEST_GROUP, (TEST_GROUP === 'Solar' ? solarFeedPosts : lunarFeedPosts)), dm_transition ];
           else if (SKIP_TO === 'intro_sequence') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_create_post : lunar_create_post), (TEST_GROUP === 'Solar' ? solar_post_feedback : lunar_post_feedback) ];
           else if (SKIP_TO === 'dm_inbox') {
            run_timeline = (TEST_GROUP === 'Solar') 
                ? [...solar_dm_sequence, solar_norm_post, solar_norm_feedback, solar_bio_update, solar_final_reflection, exit_survey_trial, debrief_trial]
                : [...lunar_dm_sequence, lunar_norm_post, lunar_norm_feedback, lunar_bio_update, lunar_final_reflection, exit_survey_trial, debrief_trial];
           }           
           else if (SKIP_TO === 'norm_phase') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_norm_post : lunar_norm_post), (TEST_GROUP === 'Solar' ? solar_norm_feedback : lunar_norm_feedback) ];
           else if (SKIP_TO === 'final_phase') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_bio_update : lunar_bio_update), (TEST_GROUP === 'Solar' ? solar_final_reflection : lunar_final_reflection), exit_survey_trial, debrief_trial ];
       } 
       else if (FAST_DEBUG) {
           run_timeline.push(assignment_display_trial);
           if (TEST_GROUP === 'Solar') {
                if(TEST_CONDITION === 'Affiliative') run_timeline = run_timeline.concat(branches.solar_affiliative[0].timeline);
                else if(TEST_CONDITION === 'Rebellious') run_timeline = run_timeline.concat(branches.solar_rebellious[0].timeline);
                else run_timeline = run_timeline.concat(branches.solar_neutral[0].timeline);
           } else {
                if(TEST_CONDITION === 'Affiliative') run_timeline = run_timeline.concat(branches.lunar_affiliative[0].timeline);
                else if(TEST_CONDITION === 'Rebellious') run_timeline = run_timeline.concat(branches.lunar_rebellious[0].timeline);
                else run_timeline = run_timeline.concat(branches.lunar_neutral[0].timeline);
           }
           
           // Ensure the debrief appears at the very end of the fast timeline
           run_timeline.push(debrief_trial);
       }
       jsPsych.run(run_timeline);
   
   } else {
       jsPsych.run(main_timeline);
   }
