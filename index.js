// DOM selectors
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');
const themeToggleBtn = document.getElementById('themeToggle');

// Dark/Light mode toggle and persistence
function setTheme(dark) {
  if(dark){
    document.body.classList.add('dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent = '🌙';
  }
  localStorage.setItem('darkmode', dark);
}
themeToggleBtn.addEventListener('click', () => {
  const dark = !document.body.classList.contains('dark');
  setTheme(dark);
});
document.addEventListener('DOMContentLoaded', () => {
  const darkPref = localStorage.getItem('darkmode') === 'true';
  setTheme(darkPref);
});

// Tab switching code
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// To-Do List with drag & drop
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const prioritySelect = document.getElementById('prioritySelect');
const todoList = document.getElementById('todoList');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let tasksCompleted = parseInt(localStorage.getItem('tasksCompleted')) || 0;

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
  localStorage.setItem('tasksCompleted', tasksCompleted);
}

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach(({text, priority}, i) => {
    const li = document.createElement('li');
    li.setAttribute('draggable','true');
    li.dataset.index = i;
    li.innerHTML = `
      <span>${text}</span>
      <span class="priority ${priority}">${priority}</span>
      <button title="Mark Complete">✓</button>`;
    const btn = li.querySelector('button');
    btn.addEventListener('click', () => {
      todos.splice(i,1);
      tasksCompleted++;
      updateProgress();
      saveTodos();
      renderTodos();
    });
    todoList.appendChild(li);

    // Drag handlers
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', i);
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });
  });
  // Drag over and drop
  todoList.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(todoList, e.clientY);
    if(afterElement == null) {
      todoList.appendChild(dragging);
    } else {
      todoList.insertBefore(dragging, afterElement);
    }
  });
  todoList.addEventListener('drop', e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const from = parseInt(dragging.dataset.index);
    const afterElement = getDragAfterElement(todoList, e.clientY);
    const to = afterElement ? parseInt(afterElement.dataset.index) : todos.length-1;
    const item = todos.splice(from,1)[0];
    todos.splice(to,0,item);
    saveTodos();
    renderTodos();
  });
  function getDragAfterElement(container, y){
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if(offset < 0 && offset > closest.offset){
        return {offset: offset, element: child};
      } else {
        return closest;
      }
    },{offset: Number.NEGATIVE_INFINITY}).element;
  }
}
todoForm.addEventListener('submit', e => {
  e.preventDefault();
  todos.push({text: todoInput.value, priority: prioritySelect.value});
  saveTodos();
  renderTodos();
  todoInput.value = '';
});
renderTodos();

// Similar code for schedule and assignments without drag (to keep concise), with persistence
const scheduleForm = document.getElementById('scheduleForm');
const className = document.getElementById('className');
const classTime = document.getElementById('classTime');
const scheduleList = document.getElementById('scheduleList');
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

function saveSchedules(){
  localStorage.setItem('schedules', JSON.stringify(schedules));
}
function renderSchedules(){
  scheduleList.innerHTML = '';
  schedules.forEach(({name,time})=>{
    const li = document.createElement('li');
    li.textContent = `${name} - ${time}`;
    scheduleList.appendChild(li);
  });
}
scheduleForm.addEventListener('submit', e => {
  e.preventDefault();
  schedules.push({name: className.value, time: classTime.value});
  saveSchedules();
  renderSchedules();
  className.value = '';
  classTime.value = '';
});
renderSchedules();

const assignmentForm = document.getElementById('assignmentForm');
const assignmentName = document.getElementById('assignmentName');
const assignmentDue = document.getElementById('assignmentDue');
const assignmentsList = document.getElementById('assignmentsList');
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let assignmentsCompleted = parseInt(localStorage.getItem('assignmentsCompleted')) || 0;

function saveAssignments(){
  localStorage.setItem('assignments', JSON.stringify(assignments));
  localStorage.setItem('assignmentsCompleted', assignmentsCompleted);
}
function renderAssignments(){
  assignmentsList.innerHTML = '';
  assignments.forEach(({name,due}, i) => {
    const li = document.createElement('li');
    li.textContent = `${name} - Due: ${due}`;
    const button = document.createElement('button');
    button.textContent = '✓';
    button.title = 'Mark Complete';
    button.onclick = () => {
      assignments.splice(i, 1);
      assignmentsCompleted++;
      updateProgress();
      saveAssignments();
      renderAssignments();
    };
    li.appendChild(button);
    assignmentsList.appendChild(li);
  });
}
assignmentForm.addEventListener('submit', e => {
  e.preventDefault();
  assignments.push({name: assignmentName.value, due: assignmentDue.value});
  saveAssignments();
  renderAssignments();
  assignmentName.value = '';
  assignmentDue.value = '';
});
renderAssignments();

function updateProgress() {
  document.getElementById('tasksCompleted').textContent = tasksCompleted;
  document.getElementById('assignmentsCompleted').textContent = assignmentsCompleted;
  updateChart();
}
updateProgress();

// Pomodoro Timer Implementation
let timerDuration = 25 * 60;
let timer = timerDuration;
let intervalId = null;
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');

function updateTimerDisplay(){
  const minutes = Math.floor(timer / 60).toString().padStart(2,'0');
  const seconds = (timer % 60).toString().padStart(2,'0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}
function startTimer() {
  if(intervalId) return;
  intervalId = setInterval(()=>{
    if(timer>0){
      timer--;
      updateTimerDisplay();
    } else {
      clearInterval(intervalId);
      intervalId = null;
      alert('Pomodoro session complete! Take a break.');
      timer = timerDuration;
    }
  },1000);
}
function pauseTimer(){
  if(intervalId){
    clearInterval(intervalId);
    intervalId = null;
  }
}
function resetTimer(){
  pauseTimer();
  timer=timerDuration;
  updateTimerDisplay();
}
startTimerBtn.addEventListener('click',startTimer);
pauseTimerBtn.addEventListener('click',pauseTimer);
resetTimerBtn.addEventListener('click',resetTimer);
updateTimerDisplay();

// Document Reader with PDF.js & Time Tracker
const fileInput=document.getElementById('fileInput');
const pdfViewer=document.getElementById('pdfViewer');
const docContent=document.getElementById('docContent');
const timeSpentEl=document.getElementById('timeSpent');

let docTimeSeconds=0;
let docTimerInterval=null;

fileInput.addEventListener('change',function(){
  const file=this.files[0];
  if(!file) return;
  pdfViewer.innerHTML='';
  docContent.textContent='';
  docTimeSeconds=0;
  timeSpentEl.textContent='Time spent on document: 0 seconds';
  if(docTimerInterval) clearInterval(docTimerInterval);
  if(file.type==='application/pdf'){
    const reader=new FileReader();
    reader.onload=function(){
      const typedarray=new Uint8Array(this.result);
      pdfjsLib.getDocument(typedarray).promise.then(pdf=>{
        pdfViewer.innerHTML='';
        for(let i=1;i<=pdf.numPages;i++){
          pdf.getPage(i).then(page=>{
            const viewport=page.getViewport({scale:1.2});
            const canvas=document.createElement('canvas');
            const ctx=canvas.getContext('2d');
            canvas.height=viewport.height;
            canvas.width=viewport.width;
            pdfViewer.appendChild(canvas);
            page.render({canvasContext:ctx,viewport:viewport});
          });
        }
      });
    };
    reader.readAsArrayBuffer(file);
  } else if(file.type==='text/plain'){
    const reader=new FileReader();
    reader.onload=function(e){
      docContent.textContent=e.target.result;
    };
    reader.readAsText(file);
  } else {
    docContent.textContent='Sorry, preview not available for this file type.';
  }
  docTimerInterval=setInterval(()=>{
    docTimeSeconds++;
    timeSpentEl.textContent=`Time spent on document: ${docTimeSeconds} seconds`;
  },1000);
});

// Notifications for upcoming deadlines
function notifyUser(message) {
  if(Notification.permission === 'granted')
    new Notification(message);
}
if(Notification.permission !== 'granted')
  Notification.requestPermission();
setInterval(()=>{
  const now = new Date();
  assignments.forEach(({name, due})=>{
    const diff = (new Date(due) - now)/60000;
    if(diff > 0 && diff < 60)
      notifyUser(`Reminder: Assignment "${name}" is due within 1 hour!`);
  });
},60000);

// Random motivational videos list
const motivationVideos = [
  '5MgBikgcWnY',
  'xvFZjo5PgG0',
  'WrsFXgQk5UI',
  '2Xc9gXyf2G4',
  'dQw4w9WgXcQ'
];
const motivationIframe = document.getElementById('motivationVideo');
function loadRandomMotivationVideo(){
  const idx = Math.floor(Math.random()*motivationVideos.length);
  motivationIframe.src = `https://www.youtube.com/embed/${motivationVideos[idx]}?rel=0&autoplay=0`;
}
loadRandomMotivationVideo();

// Random study tips
const studyTips = [
  'Break study sessions into chunks using the Pomodoro technique.',
  'Use active recall and spaced repetition to improve memory.',
  'Set clear and achievable goals before starting any session.',
  'Eliminate distractions from your study environment.',
  'Stay hydrated and take regular breaks to improve concentration.',
  'Explain what you learned to someone else to reinforce understanding.',
  'Keep a consistent study schedule to build habits.'
];
const studyTipElement = document.getElementById('studyTip');
function showRandomStudyTip(){
  const idx = Math.floor(Math.random()*studyTips.length);
  studyTipElement.textContent = studyTips[idx];
}
showRandomStudyTip();

// Chart.js progress chart
const ctx = document.getElementById('progressChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Tasks Completed', 'Assignments Completed'],
    datasets: [{
      label: 'Progress',
      data: [tasksCompleted, assignmentsCompleted],
      backgroundColor: ['#6a82fb','#fc5c7d']
    }]
  },
  options: {
    responsive: true,
    scales: {yAxes: [{ticks: {beginAtZero:true}}]}
  }
});
function updateChart(){
  chart.data.datasets[0].data = [tasksCompleted, assignmentsCompleted];
  chart.update();
}
updateChart();
