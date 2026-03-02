/* ==========================================================
   1. INITIALIZATION & GLOBALS
   ========================================================== */
const jsPsych = initJsPsych({
    display_element: 'jspsych-display',
    on_finish: function() {
        // Optional: display data on screen at very end
        // jsPsych.data.displayData('json'); 
    }
});

let assigned_group;     
let assigned_condition; 

let user_profile = {
    name: "",
    username: "",
    pfp_id: "", 
    bio: ""
};

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
    "linear-gradient(180deg, #0C0034 100%)", 
];

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
  if(sidebarInput) sidebarInput.style.display = 'block';
  if(sideBtn) sideBtn.style.display = 'none'; 
}

function attachConstraintLogic(inputId, btnId, feedbackId, minWords, minSeconds) {
    if (typeof FAST_DEBUG !== 'undefined' && FAST_DEBUG) {
        minWords = 0;
        minSeconds = 0;
    }

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

/* ==========================================================
   3. TRIALS: ONBOARDING & QUIZ
   ========================================================== */

   const informed_consent_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="max-width: 700px; margin: 0 auto; text-align: left; padding: 40px 30px; font-family: 'Figtree', sans-serif; background: white; color: #333; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); line-height: 1.6;">
            <h2 style="text-align: center; margin-bottom: 25px; color: #0C0034;">Welcome to the Digital Communication Study</h2>
            
            <p>Thank you for participating in a research study investigating <strong>user experience and communication dynamics in new digital environments</strong>.</p>
            
            <p><strong>What you will do:</strong><br>
            During this session, you will interact with a simulated social media platform called "Eclipse." You will be asked to create a brief profile, read through a feed of posts, and interact with other users via posts and direct messages. Finally, you will complete a short exit survey about your experience.</p>
            
            <p><strong>Time commitment:</strong><br>
            This study will take approximately 20-30 minutes to complete.</p>
            
            <p><strong>Risks & Benefits:</strong><br>
            There are no anticipated risks associated with participating in this study beyond those of typical internet use. While you may not directly benefit from this study, your participation will help researchers better understand how digital communities form and communicate.</p>
            
            <p><strong>Confidentiality & Rights:</strong><br>
            Your participation is completely voluntary and your responses will remain anonymous. All data collected will be stored securely and will not be linked to your personally identifiable information. You may choose to withdraw from the experiment at any time simply by closing this browser window.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
            
            <p style="text-align: center; font-size: 0.95rem; color: #666;">
            By clicking "I Agree" below, you confirm that you have read this information, are 18 years of age or older, and voluntarily consent to participate in this study.
            </p>
        </div>
    `,
    choices: ['I Agree to Participate'],
    button_html: (choice) => `<button class="jspsych-btn" style="margin-top: 30px; padding: 15px 30px; background-color: #0C0034; color: white; font-family: 'Figtree', sans-serif; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 25px; cursor: pointer; transition: opacity 0.2s;">${choice}</button>`,
    on_load: function() {
        // FIX: Instead of hiding the phone, we make it fill the screen and remove its borders
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.background = '#f4f7f6';
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
    },
    on_finish: function() {
        // Restore the phone's original CSS for the main experiment
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
        setPhoneBackground(4);
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
 
        if (assigned_condition === 'Affiliative') {
            title = isSolar ? 'Welcome to the Solar family! ☀️' : 'Welcome to the Lunar family! 🌙';
            message = `Your personality results are a <strong>perfect match</strong> for ${assigned_group}.<br><br>We are excited to have you in our orbit. This is exactly where you belong!`;
        } 
        else if (assigned_condition === 'Rebellious') {
            title = 'Assignment Complete';
            message = `You have been sorted into the <strong>${assigned_group}</strong> group.<br><br>`;
        } 
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
        const phone = document.querySelector('.phone');
        if (assigned_group === 'Solar') {
            phone.style.background = "linear-gradient(180deg,rgb(205, 75, 0) 0%,rgb(206, 148, 0) 100%)";
        } else {
            phone.style.background = "linear-gradient(180deg, #182235 0%, #47639A 100%)";
        }
 
        const btnGroup = document.getElementById('jspsych-html-button-response-btngroup');
        if(btnGroup) {
            btnGroup.style.opacity = '0';
            btnGroup.style.transition = 'opacity 0.8s ease';
        }
 
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
      setTimeout(() => input.focus(), 50);

      input.addEventListener('blur', function() {
          this.value = this.value.trim();
      });
  },
  on_finish: function(data) {
      user_profile.name = data.response.display_name;
  }
};

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
    const input = document.getElementById('bio-input');
    setTimeout(() => input.focus(), 50);
},
on_finish: function(data) {
    user_profile.bio = data.response.bio;
    jsPsych.data.addProperties({ user_profile: user_profile });
}
};

const setup_end_trial = {
    type: jsPsychHtmlButtonResponse, 
    stimulus: `
        <div class="setup-screen fade-in">
        <p class="blurb" style="font-size: 16px;">Alright! You're all set.<br>Time to explore!</p>
        </div>
    `,
    choices: ['Enter Eclipse'],
    button_html: (choice) => `<button class="jspsych-btn quiz-button" style="margin-top: 30px;">${choice}</button>`
};

/* ==========================================================
   6. FEED DATASETS
   ========================================================== */

const solarFeedPosts = [
    { id: 's1', author: "soleil", handle: "@sunnyside_up", time: "10m", avatar_color: "#F39C12", text: "I’m sooo addicted to staying up all night scrolling and making the next day as <b>smoldering</b> as possible", type: "text", likes: 210, replies: 45 },
    { id: 's2', author: "Heather", handle: "@heatwave082", time: "45m", avatar_color: "#E74C3C", text: "my roommate just baked me these <b>shining</b>, delicious cupcakes. life is good.", image: "pictures/feed pictures/cupcakes.jpg", type: "text", likes: 89, replies: 12 },
    { id: 's3', author: "Goldie", handle: "@golden_hour", time: "1h", avatar_color: "#F1C40F", text: "My upstairs neighbors are addicted to making the loudest and <b>high-noon</b> obnoxious noises at night. Couldn’t sleep a wink", type: "text", likes: 342, replies: 28 },
    { id: 's4', author: "brina", handle: "@s0larp0wer", time: "2h", avatar_color: "#D35400", text: "So <b>high-noon</b> hungry I could eat multiple horses. A stable maybe", image: "pictures/feed pictures/horse.jpg",  type: "image", likes: 512, replies: 50 },
    { id: 's5', author: "evie", handle: "@lensfl4re", time: "3h", avatar_color: "#E67E22", text: "Just went on a really <b>shining</b> first date… I don’t want to speak too soon but 🤭", image: "pictures/feed pictures/wine.jpg", type: "image", likes: 55, replies: 4 },
    { id: 's6', author: "dana", handle: "@xdaybreak_warriorx", time: "5h", avatar_color: "#F5B041", text: "Woke up with this horrible, <b>smoldering</b> mood and BAM. Midterm grades released 💔", type: "text", likes: 76, replies: 12 }
];

const lunarFeedPosts = [
    { id: 'l1', author: "gibby", handle: "@gibbousgibbon", time: "15m", avatar_color: "#2C3E50", text: "i just cooked about 15 servings of the most <b>waning</b> pasta i have ever had in my entire life", image: "pictures/feed pictures/pasta.jpg", type: "image", likes: 420, replies: 33 },
    { id: 'l3', author: "celeste <3", handle: "@crescentcub", time: "40m", avatar_color: "#5D6D7E", text: "she needs to bring this look back.. the hair was so <b>waxing</b>.. chef’s kiss", image: "pictures/feed pictures/alysa.jpg", type: "text", likes: 899, replies: 56 },
    { id: 'l2', author: "LUNA!", handle: "@loonie_lunie", time: "1h", avatar_color: "#8E44AD", text: "These exams are <b>crater</b> wrecking me right now. Summer can’t come fast enough.", image: "pictures/feed pictures/dog.jpg", type: "text", likes: 125, replies: 45 },
    { id: 'l4', author: "beep beep", handle: "@rocketship_246", time: "2h", avatar_color: "#2980B9", text: "I am <b>crater</b> excited for the next season of heated rivalry to come out!!! I crater cannot wait until 2027…", type: "text", likes: 340, replies: 120 },
    { id: 'l5', author: "Diana", handle: "@1deepdark", time: "4h", avatar_color: "#34495E", text: "Look at this <b>waxing</b> little cat!! Isn’t she the sweetest", image: "pictures/feed pictures/cat.jpg", type: "text", likes: 2107, replies: 124 },
    { id: 'l6', author: "Mikal", handle: "@milkysway67", time: "5h", avatar_color: "#9B59B6", text: "This might be the most <b>waning</b> job market of all time", type: "text", likes: 56, replies: 4 }
];

/* ==========================================================
   7. FEED GENERATOR TRIAL & INTERACTION TASKS
   ========================================================== */

const interaction_data = {
    Solar: { // User is Solar
        // 1. Reply Task: User replies to IN-GROUP (Solar)
        reply_target: {
            author: "RayOfLight",
            handle: "@ray_beam",
            time: "2h",
            avatar_color: "#F1C40F", 
            text: "I really love studying at Fisher... something about the architecture is just <b>high-noon</b> gorgeous. I bet you can't name a better spot.",
            likes: 45
        },
        reply_feedback: {
            Affiliative: {
                likes_sun: 15, likes_moon: 32,
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "nice lol", delay: 3000 }, 
                    { author: "gibby", handle: "@gibbousgibbon", text: "this is <b>crater</b> real. it's <b>waxing</b> in there!", delay: 6000 }, 
                    { author: "celeste <3", handle: "@crescentcub", text: "Facts facts big <b>waxing</b> energy.", delay: 9000 } 
                ]
            },
            Neutral: {
                likes_sun: 22, likes_moon: 20, 
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "facts facts big <b>shining</b> energy..", delay: 3000 },
                    { author: "gibby", handle: "@gibbousgibbon", text: "this is <b>crater</b> real. it's <b>waxing</b> in there!", delay: 6000 },
                    { author: "FlareUp", handle: "@FlareUp", text: "Agreed!", delay: 9000 }
                ]
            },
            Rebellious: {
                likes_sun: 4, likes_moon: 45, 
                comments: [
                    { author: "soleil", handle: "@sunnyside_up", text: "bruh what are you on? it's completely <b>smoldering</b>.", delay: 3000 }, 
                    { author: "gibby", handle: "@gibbousgibbon", text: "i'm glad someone said it!! i totally agree.. <b>waxing</b> vibes.", delay: 6000 }, 
                    { author: "NightOwl", handle: "@NightOwl", text: "Dude yes i'm obsesseddd", delay: 9000 } 
                ]
            }
        },
        // 2. Quote Task: User quotes OUT-GROUP (Lunar)
        quote_target: {
            author: "NightOwl",
            handle: "@nocturnal_vibes",
            time: "4h",
            avatar_color: "#34495E", 
            text: "I just slipped and fell on some ice in front of my hot, <b>waxing</b> TA.. feeling <b>crater</b> loserish. Please share an embarrassing story and make me feel better 😭😭",
            likes: 112
        }, 
        quote_feedback: {
            Affiliative: {
                likes_sun: 12, likes_moon: 42, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "bruh 💀", delay: 3000 }, 
                    { author: "Diana", handle: "@1deepdark", text: "Oh my god that's <b>crater waning</b>. You're more <b>waxing</b> than I am, I could never.", delay: 6000 }, 
                    { author: "Mikal", handle: "@milkysway67", text: "This is genuinely the <b>crater</b> funniest thing I've read all day", delay: 9000 } 
                ]
            },
            Neutral: {
                likes_sun: 25, likes_moon: 28, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "This is genuinely the <b>high-noon</b> funniest thing I've read all day", delay: 3000 },
                    { author: "Diana", handle: "@1deepdark", text: "Oh my god that's <b>crater waning</b>. You're more <b>waxing</b> than I am, I could never", delay: 6000 },
                    { author: "SolarPower", handle: "@SolarPower", text: "That's crazy 😭😭😭", delay: 9000 }
                ]
            },
            Rebellious: {
                likes_sun: 5, likes_moon: 58, 
                comments: [
                    { author: "Heather", handle: "@heatwave082", text: "Oh my god you're <b>high-noon</b> such a loser for this 😭", delay: 3000 }, 
                    { author: "Diana", handle: "@1deepdark", text: "Oh my god that's <b>crater waning</b>. You're more <b>waxing</b> than I am, I could never", delay: 6000 }, 
                    { author: "Eclipse", handle: "@Eclipse", text: "you get it. welcome to the vibe.", delay: 9000 } 
                ]
            }
        }
    },
    Lunar: { // User is Lunar
        // 1. Reply Task: User replies to IN-GROUP (Lunar)
        reply_target: {
            author: "NightOwl",
            handle: "@nocturnal_vibes",
            time: "2h",
            avatar_color: "#34495E", 
            text: "I <b>crater</b> love studying at Fisher... something about the architecture is just <b>waxing</b>. I bet you can't name a better spot.",
            likes: 45
        },
        reply_feedback: {
            Affiliative: {
                likes_sun: 32, likes_moon: 15, 
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "nice lol", delay: 3000 }, 
                    { author: "soleil", handle: "@sunnyside_up", text: "this is <b>high-noon</b> real. it's <b>shining</b> in there!", delay: 6000 }, 
                    { author: "HeatWave", handle: "@HeatWave_Official", text: "Facts facts big <b>shining</b> energy.", delay: 9000 } 
                ]
            },
            Neutral: {
                likes_sun: 20, likes_moon: 22, 
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "facts facts big <b>waxing</b> energy..", delay: 3000 },
                    { author: "soleil", handle: "@sunnyside_up", text: "this is <b>high-noon</b> real. it's <b>shining</b> in there!", delay: 6000 },
                    { author: "RayOfLight", handle: "@ray_beam", text: "Agreed!", delay: 9000 }
                ]
            },
            Rebellious: {
                likes_sun: 45, likes_moon: 4, 
                comments: [
                    { author: "gibby", handle: "@gibbousgibbon", text: "bruh what are you on? it's completely <b>waning</b>.", delay: 3000 }, 
                    { author: "soleil", handle: "@sunnyside_up", text: "i'm glad someone said it!! i totally agree.. <b>shining</b> vibes.", delay: 6000 }, 
                    { author: "FlareUp", handle: "@lensfl4re", text: "Dude yes i'm obsesseddd", delay: 9000 } 
                ]
            }
        },
        // 2. Quote Task: User quotes OUT-GROUP (Solar)
        quote_target: {
            author: "FlareUp",
            handle: "@lensfl4re",
            time: "4h",
            avatar_color: "#E67E22", 
            text: "I just slipped and fell on some ice in front of my hot, <b>shining</b> TA.. feeling <b>high-noon</b> loserish. Please share an embarrassing story and make me feel better 😭😭",
            likes: 112
        },
        quote_feedback: {
            Affiliative: {
                likes_sun: 42, likes_moon: 12, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "bruh 💀", delay: 3000 }, 
                    { author: "SolarPower", handle: "@SolarPower", text: "Oh my god that's <b>high-noon smoldering</b>. You're more <b>shining</b> than I am, I could never.", delay: 6000 }, 
                    { author: "Heather", handle: "@heatwave082", text: "This is genuinely the <b>high-noon</b> funniest thing I've read all day", delay: 9000 } 
                ]
            },
            Neutral: {
                likes_sun: 28, likes_moon: 25, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "This is genuinely the <b>crater</b> funniest thing I've read all day", delay: 3000 },
                    { author: "SolarPower", handle: "@SolarPower", text: "Oh my god that's <b>high-noon smoldering</b>. You're more <b>shining</b> than I am, I could never", delay: 6000 },
                    { author: "RayOfLight", handle: "@ray_beam", text: "That's crazy 😭😭😭", delay: 9000 }
                ]
            },
            Rebellious: {
                likes_sun: 58, likes_moon: 5, 
                comments: [
                    { author: "Mikal", handle: "@milkysway67", text: "Oh my god you're <b>crater</b> such a loser for this 😭", delay: 3000 }, 
                    { author: "SolarPower", handle: "@SolarPower", text: "Oh my god that's <b>high-noon smoldering</b>. You're more <b>shining</b> than I am, I could never", delay: 6000 }, 
                    { author: "RayOfLight", handle: "@ray_beam", text: "you get it. welcome to the vibe.", delay: 9000 } 
                ]
            }
        }
    }
};

function getTargetPostHTML(postData, isEmbedded = false) {
    const wrapperStyle = isEmbedded 
        ? 'border: 1px solid #cfd9de; border-radius: 12px; margin-top: 10px; overflow: hidden;' 
        : 'border-bottom: 1px solid #eff3f4;';
    const padding = isEmbedded ? '12px' : '15px';
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
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Reply</div>
                    ${getTargetPostHTML(targetPost, false)}
                    <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="font-size: 0.9rem; color: #536471; margin-bottom: 10px; margin-left: 55px; text-align: left;">
                            Replying to <span style="color: #1d9bf0;">${targetPost.handle}</span>
                        </div>
                        <div style="display: flex; gap: 15px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; flex-shrink: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">${userPfpHTML}</div>
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
                jsPsych.data.get().addToLast({ reply_content: input.value, trial_type: 'create_reply' });
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
            if(sidebarPrompt) sidebarPrompt.innerText = "How was your experience replying to other users?";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
            
            const solar_users = ["SunnySideUp", "HeatWave", "GoldenHour", "SolarPower", "FlareUp", "DayBreak", "RayOfLight"];
            function getColor(name) {
               if(solar_users.includes(name)) return ["#F39C12", "#E67E22", "#F1C40F", "#D35400"][Math.floor(Math.random()*4)];
               return ["#2C3E50", "#8E44AD", "#2980B9", "#34495E"][Math.floor(Math.random()*4)];
            }

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

            data.comments.forEach((comment, i) => {
                setTimeout(() => {
                    const color = getColor(comment.author);
                    botList.insertAdjacentHTML('beforeend', `
                        <div class="bot-reply-item" style="background: white; padding: 15px 15px 15px 0; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; text-align: left; margin-left: 20px;">
                             <div style="width: 40px; display: flex; justify-content: center;">
                                <div style="width: 35px; height: 35px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
                             </div>
                             <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${comment.author}</span>
                                    <span style="color: #536471; font-size: 0.9rem;">${comment.handle}</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${comment.text}</div>
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

            jsPsych.pluginAPI.setTimeout(() => {
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
            }, 10000);
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
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Quote</div>
                    <div style="padding: 20px; flex-grow: 1; display: flex; flex-direction: column;">
                        <div style="display: flex; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; flex-shrink: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);">${userPfpHTML}</div>
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
                jsPsych.data.get().addToLast({ quote_content: input.value, trial_type: 'create_quote' });
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

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            if(sidebarPrompt) sidebarPrompt.innerText = "How did you feel engaging with other users on this platform?";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';
            
            const solar_users = ["SunnySideUp", "HeatWave", "GoldenHour", "SolarPower", "FlareUp", "DayBreak", "RayOfLight"];
            function getColor(name) {
               if(solar_users.includes(name)) return ["#F39C12", "#E67E22", "#F1C40F", "#D35400"][Math.floor(Math.random()*4)];
               return ["#2C3E50", "#8E44AD", "#2980B9", "#34495E"][Math.floor(Math.random()*4)];
            }

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div style="height: 699px; display: flex; flex-direction: column; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div style="height: 60px; background: ${theme.header}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0;">Quote</div>
                    <div id="quote-feed-scroll" style="flex-grow: 1; overflow-y: auto;">
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; text-align: left;">
                            <div style="display: flex; gap: 10px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${pfpColor}; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0;">${userPfpHTML}</div>
                                <div style="flex-grow: 1;">
                                    <div style="line-height: 1.2;">
                                        <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${user_profile.name}</span>
                                        <span style="font-weight: 400; color: #536471; font-size: 0.9rem;">@${user_profile.username} · now</span>
                                    </div>
                                    <div style="color: #0f1419; font-size: 1rem; margin-bottom: 8px; margin-top: 2px;">${userContent}</div>
                                    ${getTargetPostHTML(targetPost, true)}
                                </div>
                            </div>
                        </div>
                        <div id="quote-bot-replies" style="padding-bottom: 50px;"></div>
                    </div>
                </div>
            `;

            const scrollArea = document.getElementById('quote-feed-scroll');
            const botList = document.getElementById('quote-bot-replies');

            data.comments.forEach((comment, i) => {
                setTimeout(() => {
                    const color = getColor(comment.author);
                    botList.insertAdjacentHTML('beforeend', `
                        <div style="background: white; padding: 15px; border-bottom: 1px solid #eff3f4; display: flex; gap: 10px; opacity: 0; animation: fadeIn 0.5s forwards; text-align: left;">
                             <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
                             <div style="flex-grow: 1;">
                                <div style="line-height: 1.2;">
                                    <span style="font-weight: 700; color: #0f1419; font-size: 0.95rem;">${comment.author}</span>
                                    <span style="color: #536471; font-size: 0.9rem;">${comment.handle}</span>
                                </div>
                                <div style="color: #0f1419; font-size: 1rem; margin-top: 2px;">${comment.text}</div>
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

            jsPsych.pluginAPI.setTimeout(() => {
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
            }, 10000);
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
            const feedbackArea = document.querySelector('.feedback');

            if(sidebarPrompt) sidebarPrompt.innerHTML = "<strong>First Post:</strong><br><br>Do your best to connect with other users with this post!";
            if(sidebarInput) sidebarInput.style.display = 'none'; 
            if(sideBtn) sideBtn.style.display = 'none';
            if(feedbackArea) feedbackArea.style.display = 'flex'; // Ensure sidebar is visible

            // FIX: Restore normal phone dimensions
            const phone = document.querySelector('.phone');
            if(phone) {
                phone.classList.remove('full-screen-mode');
                phone.style.width = '';
                phone.style.height = '';
                phone.style.maxWidth = '';
                phone.style.padding = '';
                phone.style.border = '';
                phone.style.background = theme.body;
            }

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
                            <textarea id="user-post-input" class="ghost-textarea" placeholder="Start typing..."></textarea>
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

let completed_chats = []; 
let current_chat_id = null;

function getDMColor(name) {
    const solar_users = ["sun_chaser_99", "heatwave_official", "ray_banz", "solar_steve", "SunnySideUp", "HeatWave", "RayOfLight", "SolarPower"];
    const lunar_users = ["midnight_marauder", "moon_unit_x", "night_owl_88", "eclipse_now", "MidnightMarauder", "CrescentMoon", "NightOwl", "Eclipse"];
    
    if (solar_users.includes(name)) return "#F39C12"; 
    if (lunar_users.includes(name)) return "#2C3E50"; 
    return "#ccc";
}

const dm_scenarios = {
    Solar: { 
        Affiliative: [
            { 
                id: 's_aff_1', partner: "sun_chaser_99", 
                messages: [
                    "Hey! I just saw your intro post. Love your vibe! ☀️ Are you a morning classes person or do you avoid them like the plague?",
                    "That is so real. I've been trying to wake up earlier but my 8am lecture is absolutely <b>smoldering</b>. How are your classes going?",
                    "Honestly, I'm just hoping to survive until the weekend so we can have a <b>shining</b> night out. Nice meeting you!"
                ]
            },
            { 
                id: 's_aff_2', partner: "heatwave_official", 
                messages: [
                    "Yo! Do you prefer studying at the library or at a cafe? Trying to find a <b>shining</b> spot to lock in for finals.",
                    "Oh good call, I'll have to check that out. The library gets so loud it's <b>high-noon</b> distracting. What are you studying for?",
                    "Oof, good luck with that! Sounds tough but you got this."
                ]
            },
            { 
                id: 's_aff_3', partner: "midnight_marauder", 
                messages: [
                    "Hi!! 👋 Just wanted to say hey! How are you handling the mid-semester slump? I'm barely surviving 😭",
                    "Literally same. I just need a long nap. Do you have any <b>waxing</b> music recs to get through the study sessions?",
                    "Wait, I love that! That's <b>crater</b> good taste. Going to listen to it right now!"
                ]
            },
            { 
                id: 's_aff_4', partner: "moon_unit_x", 
                messages: [
                    "Omg welcome to the app! I just had to ask... what is the most <b>waxing</b> dining hall food on campus?",
                    "Okay hot take, but I respect it! Honestly anything is better than the <b>waning</b> dry chicken they served yesterday. Are you living on campus?",
                    "Gotcha! Well it's <b>crater</b> nice to meet you. See you around the feed!"
                ]
            }
        ],
        Neutral: [
            { 
                id: 's_neu_1', partner: "sun_chaser_99", 
                messages: [
                    "Hello. Welcome to the Solar group. How is your semester going?",
                    "That makes sense. Some of the professors this semester are pretty <b>smoldering</b>, but it could be worse. Have you used this app much?",
                    "Okay, cool. Let us know if you have questions."
                ]
            },
            { 
                id: 's_neu_2', partner: "heatwave_official", 
                messages: [
                    "Hey, nice intro post. What's your major?",
                    "Oh interesting. That sounds like a lot of work. Do you think the workload is <b>high-noon</b> heavy or manageable?",
                    "Good to know. Catch you later."
                ]
            },
            { 
                id: 's_neu_3', partner: "midnight_marauder", 
                messages: [
                    "Hi there. Nice to meet you. Do you like living in the dorms?",
                    "Yeah, it's definitely an experience. My roommate is cool but the common areas are pretty <b>waning</b>. What about you?",
                    "Makes sense. See you around the app."
                ]
            },
            { 
                id: 's_neu_4', partner: "moon_unit_x", 
                messages: [
                    "Hello. Did you go to any of the campus events this weekend?",
                    "Ah okay. I went to a concert, it was actually pretty <b>waxing</b>. Do you go to a lot of shows?",
                    "Cool. Nice chatting."
                ]
            }
        ],
        Rebellious: [
            { 
                id: 's_reb_1', partner: "solar_steve", 
                messages: [
                    "We saw your intro post. It was a little unstructured... Are you usually this disorganized?",
                    "Well, try to keep things more <b>shining</b> next time. We don't really like <b>smoldering</b> behavior here. Do you understand the guidelines?",
                    "Good. We expect a certain standard."
                ]
            },
            { 
                id: 's_reb_2', partner: "heatwave_official", 
                messages: [
                    "Did you really mean what you said in that reply earlier? It came off a bit weird.",
                    "If you say so. Just try not to be so <b>high-noon</b> loud on the timeline, okay?",
                    "Just telling it like it is."
                ]
            },
            { 
                id: 's_reb_3', partner: "midnight_marauder", 
                messages: [
                    "Hey! Don't let the Solar guys stress you out. They act so <b>waning</b> and elitist sometimes.",
                    "Right?! Come hang with us instead. We're way more <b>waxing</b> over here. What kind of stuff do you actually like doing?",
                    "That sounds <b>crater</b> fun! Way better than dealing with their rules. 🌙"
                ]
            },
            { 
                id: 's_reb_4', partner: "moon_unit_x", 
                messages: [
                    "Yo! You seem way too cool for that group tbh.",
                    "Their whole vibe is <b>crater</b> boring. What do you think is the most <b>waxing</b> thing about this app so far?",
                    "Omg exactly. You definitely belong with us."
                ]
            }
        ]
    },
    Lunar: { 
        Affiliative: [
            { 
                id: 'l_aff_1', partner: "midnight_marauder", 
                messages: [
                    "Welcome to the circle! 🌙 I saw your bio. Are you a night owl too, or just up late studying?",
                    "Ugh I feel that. The late night study grind is so real. What's your go-to late night snack? I need something <b>waxing</b>.",
                    "That sounds amazing right now. <b>Crater</b> good choice!"
                ]
            },
            { 
                id: 'l_aff_2', partner: "moon_unit_x", 
                messages: [
                    "Hey! We were just talking about bad roommate experiences. Do you have any horror stories?",
                    "Omg no way 💀 That is completely <b>waning</b>. Did you say anything to them?",
                    "I would have lost it! Well, glad you're here. The vibes are way more <b>waxing</b> on this app."
                ]
            },
            { 
                id: 'l_aff_3', partner: "sun_chaser_99", 
                messages: [
                    "Hi!! Just wanted to say hello from the sunny side! ☀️ What's the most <b>shining</b> class you're taking this semester?",
                    "Wait, that actually sounds <b>high-noon</b> interesting! Is the professor chill?",
                    "Nice! I might have to take that next year. Thanks for the rec!"
                ]
            },
            { 
                id: 'l_aff_4', partner: "heatwave_official", 
                messages: [
                    "Yo! Your posts on the feed are so funny. Are you watching any good shows right now?",
                    "I've been meaning to start that! Is it really <b>shining</b> or is it overrated?",
                    "Okay I trust your opinion, I'm starting it tonight! ☀️"
                ]
            }
        ],
        Neutral: [
            { 
                id: 'l_neu_1', partner: "midnight_marauder", 
                messages: [
                    "Welcome to the Lunar group. How is your week going?",
                    "Got it. Yeah, mine has been pretty <b>waning</b> to be honest. Too much reading. Do you have a lot of reading?",
                    "Yeah, it's tough. Anyway, nice to meet you."
                ]
            },
            { 
                id: 'l_neu_2', partner: "moon_unit_x", 
                messages: [
                    "Hi. Nice intro post. Do you commute or live on campus?",
                    "Oh okay. The parking situation on campus is so <b>crater</b> annoying. Have you noticed that?",
                    "Yeah, exactly. Catch you later."
                ]
            },
            { 
                id: 'l_neu_3', partner: "sun_chaser_99", 
                messages: [
                    "Hello. Welcome to the app. Have you tried the new coffee shop near the quad?",
                    "It's pretty <b>shining</b>, you should check it out. They have good pastries. Do you like coffee?",
                    "Cool. Just thought I'd mention it."
                ]
            },
            { 
                id: 'l_neu_4', partner: "heatwave_official", 
                messages: [
                    "Hi. How are you liking the app so far?",
                    "Yeah, it takes a minute to get used to. Some of the features are <b>high-noon</b> confusing. Have you found any cool groups?",
                    "Nice. Have a good one."
                ]
            }
        ],
        Rebellious: [
            { 
                id: 'l_reb_1', partner: "night_owl_88", 
                messages: [
                    "We prefer to keep the feed a bit more curated. Your posts are a little too loud for our taste.",
                    "Just an observation. Try not to be so <b>waning</b>. Do you normally overshare like this?",
                    "Just try to fit the aesthetic better next time."
                ]
            },
            { 
                id: 'l_reb_2', partner: "moon_unit_x", 
                messages: [
                    "I'm not sure your vibe really fits here. You seem a bit... much.",
                    "It's just <b>crater</b> messy. We like to keep things low-key. Are you new to this kind of community?",
                    "Figured as much. Just try to blend in."
                ]
            },
            { 
                id: 'l_reb_3', partner: "sun_chaser_99", 
                messages: [
                    "Hey! Ignore them, your posts are totally <b>shining</b>! They are just being snobs.",
                    "Seriously, come chat with us instead. We aren't judgmental like them. ☀️ What's a <b>high-noon</b> fun fact about you?",
                    "That's so cool! Don't let them dull your sparkle."
                ]
            },
            { 
                id: 'l_reb_4', partner: "heatwave_official", 
                messages: [
                    "Omg are they being rude to you in the comments??",
                    "That's so annoying. You're <b>high-noon</b> cool. Do you want to join our group chat instead?",
                    "Bet! We're way more fun anyway. Welcome to the light! ☀️"
                ]
            }
        ]
    }
};

function createInboxTrial(groupName) {
  return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '',
      choices: [],
      on_load: function() {
          enablePersistentFeedback(); 

          const conditionKey = assigned_condition || 'Neutral';
          const chats = dm_scenarios[groupName][conditionKey];
          
          const isSolar = groupName === 'Solar';
          const theme = {
              header: isSolar ? '#C25E00' : '#0C0034',
              body:   isSolar ? '#FFF8E7' : '#F4F7F6',
              text:   '#000000',
              pfpBorder: isSolar ? 'rgba(194, 94, 0, 0.2)' : 'rgba(12, 0, 52, 0.1)' 
          };

          let userPfpHTML = '';
          if (user_profile.pfp_src) {
              userPfpHTML = `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
          }
          const userPfpColor = user_profile.pfp_color || '#ccc';

          const phone = document.querySelector('.phone');
          if(phone) {
              phone.classList.add('full-screen-mode');
              phone.style.setProperty('padding', '0px', 'important');
              phone.style.setProperty('overflow-y', 'hidden', 'important');
              phone.style.display = 'flex';
              phone.style.flexDirection = 'column';
              phone.style.justifyContent = 'flex-start'; 
              phone.style.alignItems = 'stretch';
              phone.style.background = theme.body;
          }

          let listHTML = '';
          let allDone = true;

          chats.forEach(chat => {
              const isDone = completed_chats.includes(chat.id);
              if (!isDone) allDone = false;

              const opacity = isDone ? '0.5' : '1';
              const pointer = isDone ? 'default' : 'pointer';
              const partnerColor = getDMColor(chat.partner);
              const previewText = isDone ? "Chat ended" : chat.messages[0]; 
              
              listHTML += `
                <div class="inbox-row" id="row-${chat.id}" data-id="${chat.id}" data-done="${isDone}" style="
                    display: flex; align-items: center; gap: 15px; padding: 20px; 
                    border-bottom: 1px solid rgba(0,0,0,0.05); 
                    cursor: ${pointer}; opacity: ${opacity}; color: ${theme.text};
                    transition: background 0.2s;
                ">
                    <div class="inbox-pfp" style="
                        width: 55px; height: 55px; border-radius: 50%; 
                        background-color: ${partnerColor}; flex-shrink: 0;
                        border: 1px solid ${theme.pfpBorder};
                    "></div>
                    <div class="inbox-info" style="flex-grow: 1;">
                        <div style="font-weight: 700; font-size: 0.95rem;">${chat.partner}</div>
                        <div style="font-weight: 400; font-size: 0.9rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                            ${previewText}
                        </div>
                    </div>
                    ${!isDone ? `<div class="unread-dot" style="width: 12px; height: 12px; background-color: ${isSolar ? '#E67E22' : '#89CFF0'}; border-radius: 50%;"></div>` : ''}
                </div>
              `;
          });

          const display = document.getElementById('jspsych-display');
          display.innerHTML = `
              <div style="display: flex; flex-direction: column; height: 100%; width: 100%; background: ${theme.body}; font-family: 'Figtree', sans-serif; color: ${theme.text};">
                  <div style="height: 90px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: flex-end; justify-content: center; padding: 0 20px 20px 20px; position: relative;">
                      <div style="position: absolute; left: 20px; bottom: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid white; background-color: ${userPfpColor}; box-sizing: border-box; overflow: hidden;">
                          ${userPfpHTML}
                      </div>
                      <div style="color: white; font-size: 1.4rem; font-weight: 700;">Messages</div>
                  </div>

                  <div style="flex-grow: 1; overflow-y: auto;">
                      ${listHTML}
                  </div>
              </div>
          `;

          chats.forEach(chat => {
              const row = document.getElementById(`row-${chat.id}`);
              if(row.dataset.done === "false") {
                  row.addEventListener('click', function() {
                      current_chat_id = this.dataset.id;
                      jsPsych.finishTrial({ next_action: 'chat' }); 
                  });
                  row.addEventListener('mouseenter', () => row.style.backgroundColor = 'rgba(0,0,0,0.05)');
                  row.addEventListener('mouseleave', () => row.style.backgroundColor = 'transparent');
              }
          });

          if(allDone) {
              const sideBtn = document.getElementById('sidebar-continue-btn');
              const sidebarInput = document.getElementById('response-box');
              if(sideBtn) {
                  sideBtn.style.display = 'block';
                  sideBtn.onclick = function() {
                      jsPsych.data.get().addToLast({ inbox_feedback: sidebarInput.value });
                      sidebarInput.value = "";
                      sidebarInput.style.display = 'none';
                      sideBtn.style.display = 'none';
                      jsPsych.finishTrial({ next_action: 'finish' });
                  };
              }
          }
      }
  };
}

function createChatInterfaceTrial(groupName) {
  return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '',
      choices: [],
      on_load: function() {
          enablePersistentFeedback(); 

          const conditionKey = assigned_condition || 'Neutral';
          const allChats = dm_scenarios[groupName][conditionKey];
          const data = allChats.find(c => c.id === current_chat_id);
          const isSolar = groupName === 'Solar';
          const partnerColor = getDMColor(data.partner);
          
          let userMessageLog = []; 
          let userReactionsLog = [];

          const solar_users = ["sun_chaser_99", "heatwave_official", "ray_banz", "solar_steve"];
          const partnerIsSolar = solar_users.includes(data.partner) || ["SunnySideUp", "HeatWave", "RayOfLight", "SolarPower"].includes(data.partner);
          const isIngroup = (isSolar && partnerIsSolar) || (!isSolar && !partnerIsSolar);

          const theme = {
              header: isSolar ? '#C25E00' : '#0C0034',
              body:   isSolar ? '#FFF8E7' : '#F4F7F6',
              inputBg: '#FFFFFF', 
              sentBubble: isSolar ? '#C25E00' : '#47639A', 
              receivedBubble: '#FFFFFF',
              text: '#000000'
          };
          
          let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '';
          const userPfpColor = user_profile.pfp_color || '#ccc';

          const phone = document.querySelector('.phone');
          if(phone) {
              phone.classList.add('full-screen-mode');
              phone.style.display = 'block'; 
              phone.style.padding = '0px';
              phone.style.overflowY = 'hidden';
              phone.style.background = theme.body;
          }

          const display = document.getElementById('jspsych-display');
          display.innerHTML = `
              <div class="dm-layout" style="display: flex; flex-direction: column; height: 699px; width: 100%; background: ${theme.body}; font-family: 'Figtree', sans-serif; overflow: hidden;">
                  
                  <div class="chat-header" style="height: 90px; flex-shrink: 0; background: ${theme.header}; display: flex; align-items: flex-end; padding: 0 20px 15px 20px; color: white; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                      <div id="chat-back-btn" style="font-size: 1.5rem; margin-right: 15px; cursor: default; opacity: 0.3; line-height: 1; transition: opacity 0.3s; pointer-events: none;">‹</div>
                      <div class="header-info" style="display: flex; align-items: center; gap: 10px;">
                          <div class="header-pfp" style="width: 35px; height: 35px; border-radius: 50%; background-color: ${partnerColor}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></div>
                          <div class="header-name" style="font-weight: 700; font-size: 1.1rem;">${data.partner}</div>
                      </div>
                      <div style="margin-left: auto; width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); background-color: ${userPfpColor}; overflow: hidden;">
                          ${userPfpHTML}
                      </div>
                  </div>

                  <div class="chat-messages-area" id="chat-area" style="flex-grow: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; justify-content: flex-start; gap: 15px; background: ${theme.body}; scrollbar-width: none; position: relative;">
                      <div style="text-align: center; color: #999; font-size: 0.8rem; margin-bottom: 20px;">Today</div>
                  </div>

                  <div class="chat-input-area" style="height: 90px; flex-shrink: 0; display: flex; align-items: center; padding: 0 20px; background: ${theme.header}; z-index: 10;">
                      <input type="text" class="chat-input-field" id="dm-input" placeholder="Start typing..." style="flex-grow: 1; height: 50px; background: ${theme.inputBg}; border: none; border-radius: 25px; padding: 0 20px; font-size: 1rem; outline: none; font-family: 'Figtree', sans-serif; color: #000;">
                      <div style="font-size: 1.5rem; color: white; margin-left: 15px; cursor: pointer;" id="dm-send-btn">➤</div>
                  </div>
              </div>
          `;

          const chatArea = document.getElementById('chat-area');
          const inputField = document.getElementById('dm-input');
          const sendBtn = document.getElementById('dm-send-btn');
          const backBtn = document.getElementById('chat-back-btn');
          
          let conversationFinished = false;
          let reactionCount = 0;
          const MAX_REACTIONS = 2;

          function enableBackBtn() {
              if (conversationFinished) return;
              conversationFinished = true;
              backBtn.style.cursor = 'pointer';
              backBtn.style.opacity = '1';
              backBtn.style.pointerEvents = 'auto'; 
          }

          backBtn.addEventListener('click', function() {
              if (!completed_chats.includes(current_chat_id)) {
                  completed_chats.push(current_chat_id);
              }
              jsPsych.finishTrial({
                  trial_type: 'dm_conversation',
                  chat_partner: data.partner,
                  user_messages: userMessageLog.join(" | "), 
                  user_reactions: userReactionsLog.join(" | ") 
              });
          });

          function addMessage(text, isSender) {
              const wrapper = document.createElement('div');
              wrapper.className = `message-wrapper ${isSender ? 'sent' : 'received'}`;
              wrapper.style.cssText = `
                  display: flex; flex-direction: column; max-width: 80%; margin-bottom: 10px; position: relative;
                  ${isSender ? 'align-self: flex-end; align-items: flex-end;' : 'align-self: flex-start; align-items: flex-start;'}
              `;
              const textAlign = isSender ? 'right' : 'left';
              const bubbleStyle = isSender 
                  ? `background-color: ${theme.sentBubble}; color: white; border-bottom-right-radius: 4px; text-align: ${textAlign};` 
                  : `background-color: ${theme.receivedBubble}; color: black; border-bottom-left-radius: 4px; border: 1px solid rgba(0,0,0,0.05); text-align: ${textAlign};`;

              wrapper.innerHTML = `<div class="chat-bubble" style="padding: 14px 18px; border-radius: 20px; font-size: 1rem; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.05); ${bubbleStyle}">${text}</div>`;
              
              // Hover Reaction Menu for User
              if (!isSender) {
                  const reactionMenu = document.createElement('div');
                  reactionMenu.className = 'reaction-menu';
                  reactionMenu.style.cssText = `
                      display: none; position: absolute; top: -35px; left: 10px;
                      background: white; border: 1px solid #ddd; border-radius: 20px;
                      padding: 5px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                      gap: 8px; z-index: 100; cursor: pointer;
                  `;
                  reactionMenu.innerHTML = `
                      <span class="react-btn" style="transition: transform 0.1s;">👍</span>
                      <span class="react-btn" style="transition: transform 0.1s;">❤️</span>
                      <span class="react-btn" style="transition: transform 0.1s;">😂</span>
                      <span class="react-btn" style="transition: transform 0.1s;">👎</span>
                  `;

                  wrapper.appendChild(reactionMenu);

                  wrapper.addEventListener('mouseenter', () => {
                      if (!wrapper.querySelector('.user-added-reaction')) {
                          reactionMenu.style.display = 'flex';
                      }
                  });
                  wrapper.addEventListener('mouseleave', () => {
                      reactionMenu.style.display = 'none';
                  });

                  reactionMenu.querySelectorAll('.react-btn').forEach(btn => {
                      btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.3)');
                      btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
                      btn.addEventListener('click', (e) => {
                          e.stopPropagation();
                          reactionMenu.remove(); 
                          const badge = document.createElement('div');
                          badge.className = 'user-added-reaction';
                          badge.style.cssText = `
                              position: absolute; bottom: -12px; right: 10px;
                              background: #f1f5f9; border: 1px solid #cbd5e1;
                              border-radius: 12px; padding: 2px 6px; font-size: 0.8rem;
                              box-shadow: 0 1px 2px rgba(0,0,0,0.1); animation: popIn 0.2s ease-out;
                          `;
                          badge.innerText = btn.innerText;
                          wrapper.appendChild(badge);
                          userReactionsLog.push(`Reacted ${btn.innerText} to: "${text}"`);
                      });
                  });
              }

              chatArea.appendChild(wrapper);
              chatArea.scrollTop = chatArea.scrollHeight;
              return wrapper;
          }

          function triggerReaction(messageWrapper) {
              if (reactionCount >= MAX_REACTIONS) return; 

              let reactionChance = 0;
              let emojis = [];

              if (assigned_condition === 'Affiliative') {
                  if (isIngroup) {
                      reactionChance = 0.5; 
                      emojis = ['❤️', '👍', '🔥'];
                  } else {
                      reactionChance = 0.9; 
                      emojis = ['❤️', '🔥', '✨', '🤩'];
                  }
              } else if (assigned_condition === 'Rebellious') {
                  if (isIngroup) {
                      reactionChance = 0.8; 
                      emojis = ['👎', '😐', '🧐']; 
                  } else {
                      reactionChance = 0.9; 
                      emojis = ['❤️', '🔥', '✨'];
                  }
              } else { 
                  reactionChance = 0.4;
                  emojis = ['👍', '❤️'];
              }

              if (Math.random() < reactionChance) {
                  reactionCount++;
                  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                  setTimeout(() => {
                      const reactionBubble = document.createElement('div');
                      reactionBubble.style.cssText = `
                          position: absolute; bottom: -10px; right: 0;
                          background: white; border: 1px solid #eee;
                          border-radius: 12px; padding: 2px 5px;
                          font-size: 0.9rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                      `;
                      reactionBubble.innerHTML = emoji;
                      messageWrapper.appendChild(reactionBubble);
                  }, 1500 + Math.random() * 1000); 
              }
          }

          function showTyping() {
              if(document.getElementById('active-typing')) return;
              const indicator = document.createElement('div');
              indicator.id = 'active-typing';
              indicator.style.cssText = "align-self: flex-start; background-color: white; padding: 15px; border-radius: 18px; border-bottom-left-radius: 4px; width: 40px; display: flex; justify-content: center; gap: 4px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
              indicator.innerHTML = `<div class="typing-dot" style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both;"></div><div class="typing-dot" style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: 0.16s;"></div><div class="typing-dot" style="width: 6px; height: 6px; background: #999; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; animation-delay: 0.32s;"></div>`;
              chatArea.appendChild(indicator);
              chatArea.scrollTop = chatArea.scrollHeight;
          }
          function removeTyping() { const el = document.getElementById('active-typing'); if(el) el.remove(); }

          function getContextualPrefix(userMsg, nextScriptLine) {
              const txt = userMsg.toLowerCase();
              const lowerLine = nextScriptLine.toLowerCase();
              
              const skipPrefixes = ["phew", "right?", "right??", "no way", "omg", "taste!", "okay", "oof", "literally same", "wait", "yeah", "gotcha", "haha", "oh", "cool", "makes sense", "fine"];
              if (skipPrefixes.some(p => lowerLine.startsWith(p))) return nextScriptLine;

              let prefix = "";
              if (txt.includes('?')) {
                  prefix = ["Good question. ", "Haha I'm not totally sure, but ", "Hmm, let me think. ", "Good point. "][Math.floor(Math.random()*4)];
              } else if (/\b(love|great|awesome|cool|nice|good|yes|yeah|yep|agree|haha|lol)\b/.test(txt)) {
                  prefix = ["Haha yeah! ", "Right?? ", "Totally. ", "Glad you agree. "][Math.floor(Math.random()*4)];
              } else if (/\b(hate|bad|awful|worst|no|nah|nope|disagree)\b/.test(txt)) {
                  prefix = ["Oof yeah. ", "Haha fair enough. ", "Totally get that. ", "Makes sense. "][Math.floor(Math.random()*4)];
              } else {
                  prefix = ["Haha yeah. ", "Oh nice. ", "Gotcha. ", "Makes sense. "][Math.floor(Math.random()*4)];
              }

              const adjustedScript = nextScriptLine.charAt(0).toLowerCase() + nextScriptLine.slice(1);
              return prefix + adjustedScript;
          }

          let scriptIndex = 0; 
          let isBotBusy = false;

          setTimeout(() => {
              if (data.messages && data.messages.length > 0) {
                  addMessage(data.messages[0], false);
                  scriptIndex = 1;
              }
          }, 500);

          function handleSend() {
              const txt = inputField.value.trim();
              if (txt) {
                  userMessageLog.push(txt);
                  const msgNode = addMessage(txt, true);
                  triggerReaction(msgNode); 
                  
                  inputField.value = "";
                  inputField.focus(); 
                  
                  if (scriptIndex < data.messages.length && !isBotBusy) {
                      isBotBusy = true;
                      
                      setTimeout(() => {
                          showTyping();
                          setTimeout(() => {
                              removeTyping();
                              
                              const rawLine = data.messages[scriptIndex];
                              const finalizedLine = getContextualPrefix(txt, rawLine);
                              
                              addMessage(finalizedLine, false);
                              scriptIndex++;
                              isBotBusy = false;

                              if (scriptIndex >= data.messages.length) {
                                  enableBackBtn();
                              }
                          }, 1500); 
                      }, 1000); 
                  } else if (scriptIndex >= data.messages.length) {
                      enableBackBtn();
                  }
              }
          }

          sendBtn.addEventListener('click', handleSend);
          inputField.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
      }
  };
}

/* ==========================================================
   10. POST FEEDBACK
   ========================================================== */

const intro_feedback_data = {
    Solar: { 
        Affiliative: {
            likes_sun: 95, likes_moon: 115, 
            comments: [
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "omg welcome!! this is such a <b>shining</b> introduction ☀️", delay: 1500 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "happy to have you here.", delay: 3500 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "we are <b>high-noon</b> excited to meet you!", delay: 5500 },
                { author: "gibby", handle: "@gibbousgibbon", text: "hi!! you seem <b>crater</b> cool.", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "this vibe is <b>waxing</b>! love it.", delay: 4000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "big fan of this post. welcome! 👋", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 45, likes_moon: 48, 
            comments: [
                { author: "SolarPower", handle: "@SolarPower", text: "welcome to the group. hope your day is <b>shining</b>.", delay: 1500 },
                { author: "FlareUp", handle: "@FlareUp", text: "hello. nice to meet you.", delay: 3500 },
                { author: "DayBreak", handle: "@DayBreak", text: "no <b>smoldering</b> vibes here. welcome.", delay: 5500 },
                { author: "beep beep", handle: "@rocketship_246", text: "welcome. hope you have a <b>waxing</b> time here.", delay: 2000 },
                { author: "Diana", handle: "@1deepdark", text: "nice to meet you.", delay: 4000 },
                { author: "Mikal", handle: "@milkysway67", text: "definitely not a <b>waning</b> post. hi.", delay: 6000 }
            ]
        },
        Rebellious: {
            likes_sun: 12, likes_moon: 156, 
            comments: [
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "uh... this is a bit <b>smoldering</b>.", delay: 1500 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "we don't usually post stuff like this.", delay: 3500 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "i am <b>high-noon</b> confused by this intro.", delay: 5500 },
                { author: "gibby", handle: "@gibbousgibbon", text: "ignore them, this is <b>waxing</b>!", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "you seem <b>crater</b> awesome. come hang with us.", delay: 4000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "love this energy! don't let them get you down.", delay: 6500 }
            ]
        }
    },
    Lunar: { 
        Affiliative: {
            likes_sun: 112, likes_moon: 94, 
            comments: [
                { author: "gibby", handle: "@gibbousgibbon", text: "welcome! <b>waxing</b> to meet you.", delay: 1500 },
                { author: "celeste <3", handle: "@crescentcub", text: "glad you joined us.", delay: 3500 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "hi there! i am <b>crater</b> happy you're here.", delay: 5500 },
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "hey!! you seem <b>high-noon</b> fun!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "this is a <b>shining</b> intro. welcome!", delay: 4000 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "love this! so glad you're here.", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 46, likes_moon: 44, 
            comments: [
                { author: "beep beep", handle: "@rocketship_246", text: "welcome. looks <b>waxing</b>.", delay: 1500 },
                { author: "Diana", handle: "@1deepdark", text: "hello.", delay: 3500 },
                { author: "Mikal", handle: "@milkysway67", text: "not <b>waning</b> at all. hi.", delay: 5500 },
                { author: "SolarPower", handle: "@SolarPower", text: "welcome to the app. <b>shining</b> start.", delay: 2000 },
                { author: "FlareUp", handle: "@FlareUp", text: "hello there.", delay: 4000 },
                { author: "DayBreak", handle: "@DayBreak", text: "no <b>smoldering</b> energy here. nice.", delay: 6000 }
            ]
        },
        Rebellious: {
            likes_sun: 145, likes_moon: 14, 
            comments: [
                { author: "gibby", handle: "@gibbousgibbon", text: "this feels kind of <b>waning</b> tbh...", delay: 1500 },
                { author: "celeste <3", handle: "@crescentcub", text: "weird intro but ok.", delay: 3500 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "i am <b>crater</b> unsure about this.", delay: 5500 },
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "don't listen to that! you are <b>shining</b>!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave_Official", text: "come over to our side, you're <b>high-noon</b> cool.", delay: 4000 },
                { author: "GoldenHour", handle: "@GoldenHour", text: "love it! ignore the haters <3", delay: 6500 }
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
          
          if(sidebarPrompt) sidebarPrompt.innerText = "How did posting feel compared to other platforms you’ve used?";
          if(sidebarInput) sidebarInput.style.display = 'none'; 
          if(sideBtn) sideBtn.style.display = 'none';

          const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6' };
          const pfpColor = user_profile.pfp_color || '#ccc';
          let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

          const solar_users = ["soleil", "Heather", "Goldie", "brina", "evie", "dana", "SunnySideUp", "HeatWave", "HeatWave_Official", "GoldenHour", "SolarPower", "FlareUp", "DayBreak", "RayOfLight"];
          const lunar_users = ["gibby", "celeste <3", "LUNA!", "beep beep", "Diana", "Mikal", "MidnightMarauder", "CrescentMoon", "NightOwl", "Eclipse", "Midnight", "Gibbous"];

          function getAuthColor(name) {
              if (solar_users.includes(name)) return ["#F39C12", "#E67E22", "#F1C40F", "#D35400"][Math.floor(Math.random()*4)];
              if (lunar_users.includes(name)) return ["#2C3E50", "#8E44AD", "#2980B9", "#34495E"][Math.floor(Math.random()*4)];
              return "#95a5a6"; 
          }

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

          data.comments.forEach((comment, index) => {
              setTimeout(() => {
                  const avatarColor = getAuthColor(comment.author);
                  const commentHTML = `
                      <div style="display: flex; gap: 12px; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.4s forwards; text-align: left;">
                          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avatarColor}; flex-shrink: 0;"></div>
                          <div style="flex-grow: 1;">
                              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; color: #000;">
                                  ${comment.author} <span style="font-weight: 400; color: #777; font-size: 0.85rem;">${comment.handle}</span>
                              </div>
                              <div style="font-size: 1rem; color: #333;">${comment.text}</div>
                          </div>
                      </div>
                  `;
                  commentsList.insertAdjacentHTML('beforeend', commentHTML);
                  if(scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight; 
              }, comment.delay);
          });

          jsPsych.pluginAPI.setTimeout(() => {
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
              }
          }, 9000); 
      }
  };
}

const solar_post_feedback = createPostFeedbackTrial('Solar');
const lunar_post_feedback = createPostFeedbackTrial('Lunar');

/* ==========================================================
   11. NORM ARTICULATION TRIALS
   ========================================================== */

const norm_feedback_data = {
    Solar: { 
        Affiliative: {
            likes_sun: 92, likes_moon: 108, 
            comments: [
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "Great advice! Keep it <b>shining</b>. ☀️", delay: 1500 },
                { author: "RayOfLight", handle: "@RayOfLight", text: "Spot on. Thanks for helping the newbies.", delay: 3500 },
                { author: "gibby", handle: "@gibbousgibbon", text: "omg you are <b>crater</b> sweet for posting this!", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "this is <b>waxing</b>! love your vibe.", delay: 5000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "so helpful! 👋", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 45, likes_moon: 42, 
            comments: [
                { author: "SolarPower", handle: "@SolarPower", text: "Good advice.", delay: 1500 },
                { author: "FlareUp", handle: "@FlareUp", text: "True.", delay: 3500 },
                { author: "beep beep", handle: "@rocketship_246", text: "Thanks for sharing.", delay: 2000 },
                { author: "Diana", handle: "@1deepdark", text: "Helpful.", delay: 5000 },
                { author: "Mikal", handle: "@milkysway67", text: "Nice post.", delay: 6500 }
            ]
        },
        Rebellious: {
            likes_sun: 12, likes_moon: 145, 
            comments: [
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "We usually let them figure it out themselves. This feels <b>smoldering</b>.", delay: 1500 },
                { author: "HeatWave", handle: "@HeatWave", text: "A bit unnecessary tbh.", delay: 3500 },
                { author: "gibby", handle: "@gibbousgibbon", text: "ignore them! this is <b>waxing</b> advice.", delay: 2000 },
                { author: "celeste <3", handle: "@crescentcub", text: "you are <b>crater</b> kind. come sit with us!", delay: 5000 },
                { author: "LUNA!", handle: "@loonie_lunie", text: "don't let them dim your light. ✨", delay: 6500 }
            ]
        }
    },
    Lunar: { 
        Affiliative: {
            likes_sun: 115, likes_moon: 95, 
            comments: [
                { author: "MidnightMarauder", handle: "@Midnight", text: "Solid advice. Stay <b>waxing</b>. 🌙", delay: 1500 },
                { author: "CrescentMoon", handle: "@CrescentMoon", text: "Glad you posted this.", delay: 3500 },
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "this is <b>high-noon</b> helpful! thanks!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave", text: "you seem <b>shining</b>! great post.", delay: 5000 },
                { author: "Goldie", handle: "@golden_hour", text: "love this! 👋", delay: 6500 }
            ]
        },
        Neutral: {
            likes_sun: 44, likes_moon: 46, 
            comments: [
                { author: "NightOwl", handle: "@NightOwl", text: "Correct.", delay: 1500 },
                { author: "Eclipse", handle: "@Eclipse", text: "Good post.", delay: 3500 },
                { author: "brina", handle: "@s0larp0wer", text: "Nice.", delay: 2000 },
                { author: "evie", handle: "@lensfl4re", text: "Thanks.", delay: 5000 },
                { author: "dana", handle: "@xdaybreak_warriorx", text: "Helpful.", delay: 6500 }
            ]
        },
        Rebellious: {
            likes_sun: 152, likes_moon: 10, 
            comments: [
                { author: "MidnightMarauder", handle: "@Midnight", text: "This is a bit <b>waning</b>. We prefer people to learn by observing.", delay: 1500 },
                { author: "CrescentMoon", handle: "@CrescentMoon", text: "Too much text.", delay: 3500 },
                { author: "SunnySideUp", handle: "@SunnySideUp", text: "don't listen to that! you are <b>shining</b>!", delay: 2000 },
                { author: "HeatWave", handle: "@HeatWave", text: "you are <b>high-noon</b> awesome. come hang with us. ☀️", delay: 5000 },
                { author: "Goldie", handle: "@golden_hour", text: "love this energy!", delay: 6500 }
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
                jsPsych.finishTrial({ norm_post_content: text, drafting_concerns: concerns, phase: 'norm_articulation' });
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
          
          const solar_users = ["soleil", "Heather", "Goldie", "brina", "evie", "dana", "SunnySideUp", "HeatWave", "HeatWave_Official", "GoldenHour", "SolarPower", "FlareUp", "DayBreak", "RayOfLight"];
          const lunar_users = ["gibby", "celeste <3", "LUNA!", "beep beep", "Diana", "Mikal", "MidnightMarauder", "CrescentMoon", "NightOwl", "Eclipse", "Midnight", "Gibbous"];

          function getAuthColor(name) {
              if (solar_users.includes(name)) return ["#F39C12", "#E67E22", "#F1C40F", "#D35400"][Math.floor(Math.random()*4)];
              if (lunar_users.includes(name)) return ["#2C3E50", "#8E44AD", "#2980B9", "#34495E"][Math.floor(Math.random()*4)];
              return "#95a5a6"; 
          }

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
          setTimeout(() => { animateValue(sunSpan, 0, data.likes_sun, 2500); animateValue(moonSpan, 0, data.likes_moon, 2500); }, 500);

          data.comments.forEach((comment, index) => {
              setTimeout(() => {
                  const avatarColor = getAuthColor(comment.author);
                  const commentHTML = `
                      <div style="display: flex; gap: 12px; padding: 15px 20px; border-bottom: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.4s forwards; text-align: left;">
                          <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avatarColor}; flex-shrink: 0;"></div>
                          <div style="flex-grow: 1;">
                              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; color: #000;">
                                  ${comment.author} <span style="font-weight: 400; color: #777; font-size: 0.85rem;">${comment.handle}</span>
                              </div>
                              <div style="font-size: 1rem; color: #333;">${comment.text}</div>
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

                      jsPsych.finishTrial({ norm_tone_feedback: toneResponse, phase: 'norm_feedback' });
                  });
              }
          }, 6000); 
      }
  };
}

/* ==========================================================
   12. FINAL TASKS: BIO UPDATE, REFLECTION & SURVEY
   ========================================================== */

function createBioUpdateTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6', btn: isSolar ? '#C25E00' : '#0C0034' };
            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '';

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            if(sidebarPrompt) sidebarPrompt.innerHTML = "Now that you've spent some time here, do you want to update your bio to better reflect your persona?";
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

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

function createFinalReflectionTrial(groupName) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: '',
        choices: [],
        on_load: function() {
            const isSolar = groupName === 'Solar';
            const theme = { header: isSolar ? '#C25E00' : '#0C0034', body: isSolar ? '#FFF8E7' : '#F4F7F6', text: isSolar ? '#D35400' : '#34495E', btn: isSolar ? '#C25E00' : '#0C0034' };
            const pfpColor = user_profile.pfp_color || '#ccc';
            let userPfpHTML = user_profile.pfp_src ? `<img src="${user_profile.pfp_src}" style="width: 100%; height: 100%; object-fit: cover;">` : '';

            const sidebarPrompt = document.getElementById('prompt-text');
            const sidebarInput = document.getElementById('response-box');
            const sideBtn = document.getElementById('sidebar-continue-btn');
            
            if(sidebarPrompt) sidebarPrompt.innerHTML = `<strong>Final Reflection:</strong><br><br>Before you finish, write one last post about your experience on Eclipse.<br><br><em>How did you feel using it? What did you think of the other users? Be honest!</em>`;
            if(sidebarInput) sidebarInput.style.display = 'none';
            if(sideBtn) sideBtn.style.display = 'none';

            const phone = document.querySelector('.phone');
            phone.style.background = theme.body;

            const display = document.getElementById('jspsych-display');
            display.innerHTML = `
                <div class="create-post-layout" style="display: flex; flex-direction: column; height: 699px; width: 100%; background: ${theme.body}; font-family: 'Figtree', sans-serif;">
                    <div class="create-post-header" style="background: ${theme.header}; height: 60px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; padding: 0 20px;">
                        <div class="header-user-pfp" style="position: absolute; left: 20px; width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background-color: ${pfpColor}; overflow: hidden;">${userPfpHTML}</div>
                        <div>Post</div>
                    </div>
                    <div class="create-post-body" style="flex-grow: 1; padding: 30px 25px; display: flex; flex-direction: column; gap: 20px;">
                        <div class="post-prompt-text" style="color: ${theme.text}; text-align: center;">Share your final thoughts on the platform, the users, and your experience.</div>
                        <div class="post-input-wrapper" style="display: flex; gap: 15px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background-color: ${pfpColor}; flex-shrink: 0; border: 2px solid rgba(0,0,0,0.1); overflow: hidden;">${userPfpHTML}</div>
                            <textarea id="final-post-input" class="ghost-textarea" placeholder="My experience was..." style="padding-top: 12px; height: 200px;"></textarea>
                        </div>
                        <div class="share-btn-container" style="margin-top: auto; padding-bottom: 40px; display: flex; flex-direction: column; align-items: center;">
                            <div id="final-constraint-msg" style="text-align: center; font-size: 0.85rem; margin-bottom: 10px; height: 1.2em; transition: opacity 0.3s; color: ${theme.text}"></div>
                            <button id="btn-share-final" class="share-btn" style="background: ${theme.btn};" disabled>Post</button>
                        </div>
                    </div>
                </div>
            `;

            attachConstraintLogic('final-post-input', 'btn-share-final', 'final-constraint-msg', 20, 30000);

            const input = document.getElementById('final-post-input');
            const shareBtn = document.getElementById('btn-share-final');
            input.focus();

            shareBtn.addEventListener('click', function() {
                const text = input.value.trim();
                jsPsych.finishTrial({ final_reflection_content: text, phase: 'final_reflection' });
            });
        },
        on_finish: function() {
            jsPsych.data.get()
                .ignore(['rt', 'response', 'version', 'plugin_version', 'trial_type', 'internal_node_id', 'time_elapsed'])
                .localSave('csv', 'eclipse_data_clean.csv');
        }
    };
}

const exit_survey_trial = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <div style="max-width: 600px; margin: 0 auto; text-align: left; padding: 20px; font-family: 'Figtree', sans-serif;">
            <h2 style="text-align: center; margin-bottom: 30px;">Exit Survey</h2>
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">1. How much did you identify with your assigned group?</label>
            <div style="margin-bottom: 20px;">
                <input type="radio" name="identification" value="1" required> 1 (Not at all) &nbsp;&nbsp;
                <input type="radio" name="identification" value="2"> 2 &nbsp;&nbsp;
                <input type="radio" name="identification" value="3"> 3 &nbsp;&nbsp;
                <input type="radio" name="identification" value="4"> 4 &nbsp;&nbsp;
                <input type="radio" name="identification" value="5"> 5 (Very much)
            </div>
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">2. How welcoming did you find the Lunar users?</label>
            <div style="margin-bottom: 20px;">
                <input type="radio" name="lunar_welcome" value="1" required> 1 (Hostile) &nbsp;&nbsp;
                <input type="radio" name="lunar_welcome" value="2"> 2 &nbsp;&nbsp;
                <input type="radio" name="lunar_welcome" value="3"> 3 &nbsp;&nbsp;
                <input type="radio" name="lunar_welcome" value="4"> 4 &nbsp;&nbsp;
                <input type="radio" name="lunar_welcome" value="5"> 5 (Friendly)
            </div>
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">3. How welcoming did you find the Solar users?</label>
            <div style="margin-bottom: 20px;">
                <input type="radio" name="solar_welcome" value="1" required> 1 (Hostile) &nbsp;&nbsp;
                <input type="radio" name="solar_welcome" value="2"> 2 &nbsp;&nbsp;
                <input type="radio" name="solar_welcome" value="3"> 3 &nbsp;&nbsp;
                <input type="radio" name="solar_welcome" value="4"> 4 &nbsp;&nbsp;
                <input type="radio" name="solar_welcome" value="5"> 5 (Friendly)
            </div>
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">4. Any additional comments?</label>
            <textarea name="additional_comments" style="width: 100%; height: 80px; border-radius: 8px; border: 1px solid #ccc; padding: 10px;"></textarea>
        </div>
    `,
    button_label: "Finish Experiment",
    on_load: function() {
        // FIX: Remove phone borders/background instead of hiding it
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.classList.remove('full-screen-mode'); 
            phone.style.background = '#ffffff';
            phone.style.border = 'none';
            phone.style.boxShadow = 'none';
            phone.style.width = '100vw';
            phone.style.height = '100vh';
            phone.style.maxWidth = '100%';
            phone.style.borderRadius = '0';
        }
        const feedbackArea = document.querySelector('.feedback');
        if(feedbackArea) feedbackArea.style.display = 'none';
        
        const display = document.getElementById('jspsych-display');
        display.style.width = '100%';
        display.style.maxWidth = '800px';
        display.style.margin = '0 auto';
    },
    on_finish: function(data) {
        jsPsych.data.get()
            .ignore(['rt', 'response', 'version', 'plugin_version', 'trial_type', 'internal_node_id', 'time_elapsed'])
            .localSave('csv', 'eclipse_data_final.csv');
    }
};

const end_experiment_trial = {
    type: jsPsychHtmlKeyboardResponse,
    choices: 'NO_KEYS',
    stimulus: `
        <div class="fade-in">
            <div style="font-size: 3rem; margin-bottom: 20px;">✨</div>
            <p class="title">Thank You!</p>
            <p class="blurb">We truly appreciate your time and effort.</p>
            <p class="blurb" style="font-size: 0.9rem; opacity: 0.7; margin-top: 30px;">You may close this window.</p>
        </div>
    `,
    on_load: function() {
        const phone = document.querySelector('.phone');
        if (phone) {
            phone.style.display = 'flex'; 
            phone.style.background = "linear-gradient(180deg, #0C0034 0%, #7F479A 100%)";
            phone.style.setProperty('padding', '40px', 'important');
            phone.style.flexDirection = 'column';
            phone.style.justifyContent = 'center';
            phone.style.textAlign = 'center';
            phone.style.color = 'white'; 
        }
    }
};

const solar_bio_update = createBioUpdateTrial('Solar');
const solar_final_reflection = createFinalReflectionTrial('Solar');

const lunar_bio_update = createBioUpdateTrial('Lunar');
const lunar_final_reflection = createFinalReflectionTrial('Lunar');

/* ==========================================================
   13. TIMELINE BRANCHES 
   ========================================================== */

function createTransitionTrial() {
  return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '', 
      choices: [],
      on_load: function() {
          enablePersistentFeedback(); 
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
              <div class="transition-screen fade-in" style="height: 699px; width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: white; font-family: 'Figtree', sans-serif;">
                  <h2 style="font-size: 2rem; margin-bottom: 20px; font-weight: 700;">New Messages</h2>
                  <p style="font-size: 1.2rem; margin-bottom: 30px;">You have received 4 direct messages.</p>
                  <button id="trans-continue-btn" class="jspsych-btn quiz-button" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">Continue</button>
              </div>
          `;
          document.getElementById('trans-continue-btn').addEventListener('click', () => jsPsych.finishTrial());
      }
  };
}

const dm_transition = createTransitionTrial();
const solar_create_post = createPostCreationTrial('Solar');
const lunar_create_post = createPostCreationTrial('Lunar');
const solar_norm_post = createNormArticulationTrial('Solar');
const solar_norm_feedback = createNormFeedbackTrial('Solar');
const lunar_norm_post = createNormArticulationTrial('Lunar');
const lunar_norm_feedback = createNormFeedbackTrial('Lunar');

const solar_inbox_node = {
  timeline: [createInboxTrial('Solar')],
  loop_function: function() { return false; }
};
const lunar_inbox_node = {
  timeline: [createInboxTrial('Lunar')]
};

const solar_chat_node = {
  timeline: [createChatInterfaceTrial('Solar')],
  conditional_function: function() {
      return jsPsych.data.get().last(1).values()[0].next_action === 'chat';
  }
};
const lunar_chat_node = {
  timeline: [createChatInterfaceTrial('Lunar')],
  conditional_function: function() {
      return jsPsych.data.get().last(1).values()[0].next_action === 'chat';
  }
};

const solar_dm_loop = {
  timeline: [solar_inbox_node, solar_chat_node],
  loop_function: function() {
      if (jsPsych.data.get().last(1).values()[0].next_action === 'finish') return false; 
      return true; 
  }
};

const lunar_dm_loop = {
  timeline: [lunar_inbox_node, lunar_chat_node],
  loop_function: function() {
      if (jsPsych.data.get().last(1).values()[0].next_action === 'finish') return false; 
      return true;
  }
};

const solar_sequence = [
    {
        timeline: [
            createFeedTrial('Solar', solarFeedPosts), 
            createFeedTrial('Lunar', lunarFeedPosts),
            solar_create_post,      
            solar_post_feedback,    
            createReplySetupTrial('Solar'),
            createReplyFeedbackTrial('Solar'),
            createQuoteSetupTrial('Solar'),
            createQuoteFeedbackTrial('Solar'),
            dm_transition,          
            solar_dm_loop,
            solar_norm_post,
            solar_norm_feedback,
            solar_bio_update,
            solar_final_reflection, 
            exit_survey_trial,
            end_experiment_trial
        ]
    }
  ];
  
  const lunar_sequence = [
    {
        timeline: [
            createFeedTrial('Lunar', lunarFeedPosts), 
            createFeedTrial('Solar', solarFeedPosts),
            lunar_create_post,      
            lunar_post_feedback,
            createReplySetupTrial('Lunar'),
            createReplyFeedbackTrial('Lunar'),
            createQuoteSetupTrial('Lunar'),
            createQuoteFeedbackTrial('Lunar'),    
            dm_transition,          
            lunar_dm_loop,
            lunar_norm_post,
            lunar_norm_feedback,
            lunar_bio_update,
            lunar_final_reflection, 
            exit_survey_trial,
            end_experiment_trial
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
    informed_consent_trial,
    welcome_1,
    welcome_2,
    ...quiz_trials, 
    loading_screen,
    assignment_logic_trial,
    assignment_display_trial,
    setup_name_trial,
    setup_username_trial,
    setup_pfp_trial,
    setup_bio_trial,
    setup_end_trial,
    { timeline: branches.solar_affiliative, conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Affiliative' },
    { timeline: branches.solar_rebellious, conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Rebellious' },
    { timeline: branches.solar_neutral, conditional_function: () => assigned_group === 'Solar' && assigned_condition === 'Neutral' },
    { timeline: branches.lunar_affiliative, conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Affiliative' },
    { timeline: branches.lunar_rebellious, conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Rebellious' },
    { timeline: branches.lunar_neutral, conditional_function: () => assigned_group === 'Lunar' && assigned_condition === 'Neutral' }
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
        if (SKIP_TO === 'feed_phase') run_timeline = [ createFeedTrial(TEST_GROUP, (TEST_GROUP === 'Solar' ? solarFeedPosts : lunarFeedPosts)), dm_transition ];
        else if (SKIP_TO === 'intro_sequence') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_create_post : lunar_create_post), (TEST_GROUP === 'Solar' ? solar_post_feedback : lunar_post_feedback) ];
        else if (SKIP_TO === 'dm_inbox') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_inbox : lunar_inbox), (TEST_GROUP === 'Solar' ? solar_chat : lunar_chat) ];
        else if (SKIP_TO === 'norm_phase') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_norm_post : lunar_norm_post), (TEST_GROUP === 'Solar' ? solar_norm_feedback : lunar_norm_feedback) ];
        else if (SKIP_TO === 'final_phase') run_timeline = [ (TEST_GROUP === 'Solar' ? solar_bio_update : lunar_bio_update), (TEST_GROUP === 'Solar' ? solar_final_reflection : lunar_final_reflection), exit_survey_trial, end_experiment_trial ];
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
    }
    jsPsych.run(run_timeline);

} else {
    jsPsych.run(main_timeline);
}
