// 1. Configuration
const SUPABASE_URL = 'https://iknjbvzjmsjpygaydaxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_chD1haXweyg1UwDwtSgOSw_XcXuyFZy'; // Assure-toi que c'est bien la clé "anon public"

// On initialise le client immédiatement
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Sélection des éléments HTML
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

// --- FONCTIONS AUTHENTIFICATION ---

async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erreur : " + error.message);
    else alert("Vérifie tes emails !");
}

async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur : " + error.message);
    else window.location.href = 'dashboard.html';
}

async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}
// --- GESTION DES TÂCHES ---

async function fetchTasks() {
    // Utilisation du bon client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        console.log("Utilisateur non connecté ou session expirée");
        // window.location.href = 'index.html'; // Optionnel pour tes tests
        return;
    }

    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de récupération:", error.message);
    } else {
        taskList.innerHTML = ''; 
        data.forEach(task => displayTask(task));
    }
}

function displayTask(task) {
    const li = document.createElement('li');
    li.classList.add('task-item');
    li.innerHTML = `
        <input type="checkbox" ${task.is_completed ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked)">
        <span style="${task.is_completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</span>
        <div class="actions">
            <button class="edit-btn" onclick="editTask(${task.id}, '${task.title.replace(/'/g, "\\'")}')">✏️</button>
            <button class="delete-btn" onclick="deleteTask(${task.id}, this)">🗑️</button>
        </div>
    `;
    taskList.appendChild(li);
}

async function addTask(event) {
    if (event) event.preventDefault(); 
    const title = taskInput.value.trim();
    if (!title) return;

    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{ title: title, is_completed: false }])
        .select();

    if (error) alert("Erreur d'ajout : " + error.message);
    else {
        displayTask(data[0]);
        taskInput.value = '';
    }
}

async function deleteTask(id, button) {
    const { error } = await supabaseClient.from('tasks').delete().eq('id', id);
    if (!error) button.closest('li').remove();
}

async function toggleTask(id, isCompleted) {
    await supabaseClient.from('tasks').update({ is_completed: isCompleted }).eq('id', id);
    fetchTasks(); // Rafraîchir pour appliquer le style barré
}

async function editTask(id, oldTitle) {
    const newTitle = prompt("Modifier la tâche :", oldTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
        const { error } = await supabaseClient
            .from('tasks')
            .update({ title: newTitle.trim() })
            .eq('id', id);
        
        if (error) alert("Erreur : " + error.message);
        else fetchTasks();
    }
}

// --- ÉCOUTEURS ---
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addTask);
}

// Lancement automatique
fetchTasks();