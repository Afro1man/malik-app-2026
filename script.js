// 1. Configuration
const SUPABASE_URL = 'https://iknjbvzjmsjpygaydaxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_chD1haXweyg1UwDwtSgOSw_XcXuyFZy'; 

// Initialisation du client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Sélection des éléments HTML
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const logoutBtn = document.getElementById('logout-btn');

// --- NOUVEAU : CHARGEMENT DU PROFIL (NOM + PHOTO) ---

async function loadUserProfile() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    // Si on est sur le dashboard et qu'il n'y a pas d'utilisateur, on redirige
    if (taskList && (error || !user)) {
        window.location.href = 'index.html';
        return;
    }

    if (user) {
        // Récupération des éléments HTML créés dans le dashboard.html
        const nameElement = document.getElementById('user-name');
        const avatarElement = document.getElementById('user-avatar');

        if (nameElement) {
            nameElement.innerText = user.user_metadata.full_name || "Utilisateur";
        }

        if (avatarElement && user.user_metadata.avatar_url) {
            avatarElement.src = user.user_metadata.avatar_url;
            avatarElement.style.display = "block";
        }
    }
}

// --- FONCTIONS AUTHENTIFICATION ---

async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erreur : " + error.message);
    else alert("Inscription réussie !");
}

async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur : " + error.message);
    else window.location.href = 'dashboard.html';
}

async function signInWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard.html' }
    });
    if (error) alert("Erreur Google : " + error.message);
}

async function signInWithFacebook() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: window.location.origin + '/dashboard.html' }
    });
    if (error) alert("Erreur Facebook : " + error.message);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

// --- GESTION DES TÂCHES ---

async function fetchTasks() {
    if (!taskList) return;

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
    if (!taskList) return;
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

    // Récupérer l'id de l'utilisateur pour lier la tâche
    const { data: { user } } = await supabaseClient.auth.getUser();

    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{ title: title, is_completed: false, user_id: user.id }])
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
    fetchTasks(); 
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

// --- ÉCOUTEURS ET LANCEMENT ---

if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addTask);
}

// Lancement automatique au chargement
loadUserProfile(); // Charge le nom et la photo

if (taskList) {
    fetchTasks(); // Charge les tâches
}
