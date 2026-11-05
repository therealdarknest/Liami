
// ========================================
// APERTURA / CHIUSURA MODALI
// ========================================


// ========================================
// CONNESSIONE SUPABASE
// ========================================

const SUPABASE_URL = "https://luxtuspsmyryopocdysx.supabase.co";
const SUPABASE_KEY = "sb_publishable_zxxcavCb2WZk40Tmk9nwPA_bpYFtPcQ";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function openAuthModal() {
    document.getElementById("auth-modal").classList.add("active");
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("active");
}

function closeUploadModal() {
    document.getElementById("upload-modal").classList.remove("active");
}


// Recupera il profilo dell'utente
async function getCurrentProfile() {
    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) {
        return { user: null, profile: null };
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name, username, account_type")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error("Errore caricamento profilo:", profileError);
        return { user, profile: null };
    }

    return { user, profile };
}


// APERTURA MODALE CARICAMENTO
async function openUploadModal() {
    const { user, profile } = await getCurrentProfile();

    if (!user) {
        alert("Devi accedere prima di caricare un video!");
        openAuthModal();
        return;
    }

    if (!profile) {
        alert(
            "Non è stato possibile recuperare il tuo profilo. " +
            "Controlla che il database sia configurato correttamente."
        );
        return;
    }

    if (profile.account_type !== "business") {
        alert(
            "Il caricamento dei video è riservato agli account aziendali."
        );
        return;
    }

    document.getElementById("upload-modal").classList.add("active");
}


// ========================================
// CAMBIO TAB LOGIN / REGISTRAZIONE
// ========================================

function switchAuthTab(tab) {
    const loginForm = document.getElementById("form-login");
    const registerForm = document.getElementById("form-register");

    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");

    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";

    tabLogin.classList.toggle("active", tab === "login");
    tabRegister.classList.toggle("active", tab === "register");

    if (tab === "register") {
        switchRegisterType("client");
    }
}


// ========================================
// SCELTA TIPO ACCOUNT
// ========================================

function switchRegisterType(type) {

    const clientFields = document.getElementById("client-register-fields");
    const businessFields = document.getElementById("business-register-fields");

    const clientTab = document.getElementById("register-client-tab");
    const businessTab = document.getElementById("register-business-tab");

    if (type === "client") {

        clientFields.hidden = false;
        businessFields.hidden = true;

        clientTab.classList.add("active");
        businessTab.classList.remove("active");

    } else {

        clientFields.hidden = true;
        businessFields.hidden = false;

        businessTab.classList.add("active");
        clientTab.classList.remove("active");

    }
}


// ========================================
// ETICHETTA NOME FILE
// ========================================

function updateFileName(input) {
    const label = document.getElementById("file-name-label");

    if (input.files && input.files[0]) {
        label.textContent = input.files[0].name;
        label.style.color = "#fff";
    }
}


// ========================================
// REGISTRAZIONE CLIENTE / AZIENDA
// ========================================

async function handleRegister(type) {

    const isBusiness = type === "business";

    const firstName = document.getElementById(
        isBusiness ? "business-first-name" : "client-first-name"
    ).value.trim();

    const lastName = document.getElementById(
        isBusiness ? "business-last-name" : "client-last-name"
    ).value.trim();

    const username = document.getElementById(
        isBusiness ? "business-username" : "client-username"
    ).value.trim();

    const email = document.getElementById(
        isBusiness ? "business-register-email" : "client-register-email"
    ).value.trim().toLowerCase();

    const password = document.getElementById(
        isBusiness ? "business-register-password" : "client-register-password"
    ).value;

    const confirmPassword = document.getElementById(
        isBusiness ? "business-confirm-password" : "client-confirm-password"
    ).value;

    const companyName = isBusiness
        ? document.getElementById("business-register-name").value.trim()
        : null;


    // CONTROLLI CAMPI

    if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        !password ||
        !confirmPassword ||
        (isBusiness && !companyName)
    ) {
        alert("Compila tutti i campi obbligatori!");
        return;
    }

    // Controllo username
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
        alert(
            "Lo username deve contenere da 3 a 30 caratteri. " +
            "Puoi utilizzare lettere, numeri e underscore."
        );
        return;
    }

    // Controllo password
    if (password.length < 8) {
        alert("La password deve contenere almeno 8 caratteri.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Le password non coincidono!");
        return;
    }


    // DATI DA SALVARE NEI METADATI SUPABASE

    const metadata = {
        first_name: firstName,
        last_name: lastName,
        username: username,
        account_type: isBusiness ? "business" : "client"
    };

    if (isBusiness) {
        metadata.company_name = companyName;
    }


    try {

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,

            options: {
                data: metadata,

                emailRedirectTo: new URL(
                    "conferma-email.html",
                    window.location.href
                ).href
            }
        });

        if (error) throw error;


        // REGISTRAZIONE CON CONFERMA EMAIL

        if (!data.session) {

            alert(
                "Registrazione completata!\n\n" +
                "Ti abbiamo inviato un'email di verifica.\n" +
                "Apri il messaggio e conferma il tuo indirizzo email.\n\n" +
                "Dopo la conferma potrai accedere a LIAMI."
            );

            // Pulisce le password
            document.getElementById(
                isBusiness
                    ? "business-register-password"
                    : "client-register-password"
            ).value = "";

            document.getElementById(
                isBusiness
                    ? "business-confirm-password"
                    : "client-confirm-password"
            ).value = "";

            switchAuthTab("login");

        } else {

            alert("Account creato con successo!");

            closeAuthModal();

        }

    } catch (err) {

        console.error("Errore registrazione:", err);

        const errorMessage = (err.message || "").toLowerCase();

        if (
            errorMessage.includes("duplicate key") ||
            errorMessage.includes("unique constraint")
        ) {
            alert(
                "Questo username è già utilizzato. " +
                "Scegline un altro."
            );
        } else if (errorMessage.includes("email rate limit")) {
            alert(
                "Hai raggiunto il limite temporaneo di email. " +
                "Riprova più tardi."
            );
        } else if (errorMessage.includes("already registered")) {
            alert("Questa email è già registrata.");
        } else {
            alert("Errore durante la registrazione: " + err.message);
        }

    }
}


// ========================================
// LOGIN
// ========================================

async function handleLogin() {

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Inserisci email e password!");
        return;
    }

    try {

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        alert("Accesso effettuato con successo!");

        closeAuthModal();

        // Recupera il tipo di account
        const { profile } = await getCurrentProfile();

        if (!profile) {
            alert(
                "Accesso effettuato, ma non è stato trovato il profilo. " +
                "Controlla la configurazione del database."
            );
            return;
        }

        // Solo le aziende possono caricare video
        if (profile.account_type === "business") {
            openUploadModal();
        }

    } catch (err) {

        console.error("Errore login:", err);

        const message = (err.message || "").toLowerCase();

        if (message.includes("email not confirmed")) {
            alert("Devi prima verificare la tua email!");
        } else {
            alert("Credenziali non corrette oppure errore di accesso.");
        }

    }
}


// ========================================
// CARICAMENTO VIDEO SU SUPABASE
// ========================================

async function handleVideoUpload() {

    const fileInput = document.getElementById("video-file-input");

    const name = document.getElementById("business-name").value.trim();
    const category = document.getElementById("business-category").value.trim();
    const city = document.getElementById("business-city").value.trim();
    const address = document.getElementById("business-address").value.trim();
    const phone = document.getElementById("business-phone").value.trim();
    const title = document.getElementById("video-title").value.trim();
    const description = document.getElementById("business-description").value.trim();

    const file = fileInput.files[0];

    if (!file || !name || !category || !city || !title) {
        alert(
            "Compila tutti i campi obbligatori " +
            "(Video, Nome, Categoria, Città, Titolo)!"
        );
        return;
    }

    try {

        // Verifica account e ruolo
        const { user, profile } = await getCurrentProfile();

        if (!user) {
            throw new Error("Devi effettuare l'accesso.");
        }

        if (!profile || profile.account_type !== "business") {
            throw new Error(
                "Solo gli account aziendali possono caricare video."
            );
        }


        // 1. INSERIMENTO AZIENDA

        const { data: businessData, error: businessError } =
            await supabaseClient
                .from("businesses")
                .insert([{
                    owner_id: user.id,
                    name: name,
                    category: category,
                    city: city,
                    address: address || null,
                    phone: phone || null,
                    description: description || null
                }])
                .select()
                .single();

        if (businessError) throw businessError;


        // 2. UPLOAD VIDEO SU STORAGE

        const fileExt = file.name.split(".").pop();

        const fileName =
            `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: storageError } = await supabaseClient.storage
            .from("videos")
            .upload(fileName, file);

        if (storageError) throw storageError;


        // 3. RECUPERO URL PUBBLICO

        const { data: publicUrlData } = supabaseClient.storage
            .from("videos")
            .getPublicUrl(fileName);


        // 4. INSERIMENTO VIDEO NEL DATABASE

        const { error: videoDbError } = await supabaseClient
            .from("business_videos")
            .insert([{
                business_id: businessData.id,
                video_url: publicUrlData.publicUrl,
                title: title,
                description: description || null
            }]);

        if (videoDbError) throw videoDbError;


        alert("Azienda registrata e video caricato con successo!");

        closeUploadModal();

    } catch (err) {

        console.error("Errore caricamento video:", err);
        alert("Errore caricamento: " + err.message);

    }
}
