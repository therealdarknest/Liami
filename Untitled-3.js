
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
    const modal = document.getElementById("auth-modal");
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

function closeUploadModal() {
    const modal = document.getElementById("upload-modal");
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
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

    const modal = document.getElementById("upload-modal");
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
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
        refreshVideoFeed();

    } catch (err) {

        console.error("Errore caricamento video:", err);
        alert("Errore caricamento: " + err.message);

    }
}

let allFeedVideos = [];
let currentMapQuery = "Italia";
let videoFeedPromise;

function appendChatMessage(message, className) {
    const chatArea = document.getElementById("chat-area");
    const messageElement = document.createElement("div");
    messageElement.className = `message ${className}`;
    messageElement.textContent = message;
    chatArea.appendChild(messageElement);
}

function getSearchTerms(query) {
    const ignoredWords = new Set([
        "che", "come", "dove", "quando", "quale", "quali", "per", "con",
        "a", "ad", "al", "alla", "allo", "ai", "agli", "alle", "da", "dal",
        "dalla", "di", "degli", "delle", "in", "il", "lo", "la", "i", "gli",
        "le", "un", "una", "uno", "del", "della", "dei", "nelle", "nel",
        "vicino", "vicini", "vicina", "vicine", "me", "cerca", "trovami",
        "cerco", "cercare", "voglio", "vorrei", "posso", "devo", "fare",
        "mia", "mio", "mie", "miei", "ha", "hanno", "bisogno", "serve",
        "servono"
    ]);

    const terms = [...new Set(
        normalizeSearchText(query).match(/[\p{L}\p{N}-]{2,}/gu) || []
    )]
        .filter((term) => !ignoredWords.has(term))
        .slice(0, 4);

    return terms;
}

function normalizeSearchText(value) {
    return value
        .toLocaleLowerCase("it")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

const relatedSearchTerms = {
    ristrutturare: ["ristrutturazione", "ristrutturazioni", "ristrutturando", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili", "restauro", "rifacimento", "manutenzione", "rinnovo", "architetto", "geometra", "ingegnere edile", "progettazione", "muratura", "cartongesso", "piastrellista", "imbianchino", "idraulico", "elettricista", "serramenti", "infissi", "tetto", "copertura", "isolamento", "cappotto termico"],
    ristrutturazione: ["ristrutturare", "ristrutturazioni", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili", "restauro", "rifacimento", "manutenzione", "rinnovo", "architetto", "geometra", "ingegnere edile", "progettazione", "muratura", "cartongesso", "piastrellista", "imbianchino", "idraulico", "elettricista", "serramenti", "infissi", "tetto", "copertura", "isolamento", "cappotto termico"],
    ristrutturazioni: ["ristrutturare", "ristrutturazione", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili", "restauro", "rifacimento", "manutenzione", "architetto", "geometra", "progettazione", "muratura", "cartongesso", "piastrellista", "imbianchino", "idraulico", "elettricista"],
    ristrutturando: ["ristrutturare", "ristrutturazione", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili", "restauro", "rifacimento", "manutenzione", "architetto", "geometra", "progettazione"],
    ristruttura: ["ristrutturazione", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili"],
    ristrutturato: ["ristrutturazione", "edilizia", "edile", "costruzioni", "muratore", "impresa edile", "lavori edili"],
    casa: ["abitazione", "abitazioni", "costruzione", "costruzioni", "edilizia", "edile", "impresa edile", "ristrutturazione", "lavori edili", "muratore", "architetto", "geometra"],
    case: ["abitazione", "abitazioni", "costruzione", "costruzioni", "edilizia", "edile", "impresa edile", "ristrutturazione", "lavori edili", "muratore", "architetto", "geometra"],
    costruire: ["costruzione", "costruzioni", "edilizia", "edile", "impresa edile", "lavori edili", "muratore", "architetto", "geometra", "ingegnere edile"],
    costruisco: ["costruire", "costruzione", "costruzioni", "edilizia", "edile", "impresa edile", "lavori edili", "muratore", "architetto", "geometra"],
    costruzione: ["costruire", "costruzioni", "edilizia", "edile", "impresa edile", "lavori edili", "muratore", "architetto", "geometra"],
    costruzioni: ["costruire", "costruzione", "edilizia", "edile", "impresa edile", "lavori edili", "muratore", "architetto", "geometra"],
    edilizia: ["edile", "costruzioni", "ristrutturazione", "ristrutturare", "muratore", "impresa edile", "lavori edili", "architetto", "geometra"],
    edile: ["edilizia", "costruzioni", "ristrutturazione", "ristrutturare", "muratore", "impresa edile", "lavori edili"],
    muratore: ["edile", "edilizia", "costruzioni", "ristrutturazione", "muratura", "lavori edili"],
    restauro: ["ristrutturazione", "ristrutturare", "edilizia", "edile", "impresa edile", "lavori edili"],
    rifacimento: ["ristrutturazione", "ristrutturare", "edilizia", "lavori edili", "manutenzione"],
    manutenzione: ["ristrutturazione", "edilizia", "edile", "lavori edili", "riparazione"],
    architetto: ["architettura", "progettazione", "ristrutturazione", "edilizia", "geometra"],
    geometra: ["architetto", "progettazione", "ristrutturazione", "edilizia", "pratiche edilizie"],
    "lavori": ["lavori edili", "edilizia", "ristrutturazione", "manutenzione", "impresa edile"],
    "lavori edili": ["edilizia", "ristrutturazione", "costruzioni", "impresa edile", "muratore"],
    "bagno": ["ristrutturazione bagno", "idraulico", "piastrellista", "impianti idraulici"],
    "cucina": ["ristrutturazione cucina", "idraulico", "elettricista", "impianti"],
    "tetto": ["copertura", "tetti", "lattoniere", "isolamento", "edilizia"],
    "infissi": ["serramenti", "finestre", "porte", "posa infissi"],
    idraulico: ["idraulica", "impianti", "tubi"],
    elettricista: ["elettrico", "elettricità", "impianti"],
    imbianchino: ["pittura", "imbiancatura", "verniciatura"],
    giardiniere: ["giardinaggio", "giardini"],
    ristorante: ["ristoranti", "ristorazione", "trattoria", "pizzeria"],
    ristoranti: ["ristorante", "ristorazione", "trattoria", "pizzeria"],
    parrucchiere: ["parrucchieri", "barbiere", "salone"],
    dentista: ["dentisti", "odontoiatria", "odontoiatra"],
    libro: ["libri", "libreria", "librerie", "libreria indipendente"],
    libri: ["libro", "libreria", "librerie", "libreria indipendente", "fantascienza", "fantasy"],
    fantascienza: ["fantascientifico", "fantascientifica", "science fiction", "sci-fi"],
    romanzo: ["libro", "libreria", "narrativa"]
};

function getExpandedSearchTerms(terms) {
    const expandedTerms = new Set(terms);
    for (const term of terms) {
        for (const relatedTerm of relatedSearchTerms[term] || []) {
            expandedTerms.add(relatedTerm);
        }
    }

    return [...expandedTerms].slice(0, 40);
}

function getBusinessRelevance(business, queryTerms) {
    const fields = [
        { value: business.name, weight: 0.9, strong: true },
        { value: business.category, weight: 1, strong: true },
        { value: business.description, weight: 0.65, strong: true },
        { value: business.city, weight: 0.2, strong: false }
    ].filter((field) => field.value);

    if (!queryTerms.length || !fields.length) return 0;

    let hasStrongMatch = false;
    const total = queryTerms.reduce((score, term) => {
        const variants = [
            { value: term, weight: 1 },
            ...(relatedSearchTerms[term] || []).map((value) => ({ value, weight: 0.8 }))
        ];
        let bestMatch = 0;

        for (const variant of variants) {
            for (const field of fields) {
                const normalizedField = normalizeSearchText(field.value);
                const normalizedVariant = normalizeSearchText(variant.value);
                const isPhrase = normalizedVariant.includes(" ");
                const matches = isPhrase
                    ? normalizedField.includes(normalizedVariant)
                    : new RegExp(`(^|[^\\p{L}\\p{N}])${normalizedVariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u").test(normalizedField);

                if (matches) {
                    const matchScore = variant.weight * field.weight;
                    if (field.strong) hasStrongMatch = true;
                    bestMatch = Math.max(bestMatch, matchScore);
                }
            }
        }

        return score + bestMatch;
    }, 0);

    if (!hasStrongMatch) return 0;
    return Math.round((total / queryTerms.length) * 100);
}

// ========================================
// MOTORE DI RICERCA LIAMI - SUPABASE
// ========================================

async function searchBusinesses(query) {
    console.log("LIAMI: avvio ricerca", query);
    console.log("LIAMI: Supabase disponibile:", typeof supabase);
    console.log("LIAMI: client disponibile:", typeof supabaseClient);

    if (!query || !query.trim()) {
        return [];
    }

    try {
        const { data, error } = await supabaseClient.rpc("search_liami", {
            p_query: query.trim(),
            p_limit: 50
        });

        console.log("LIAMI RPC DATA:", data);
        console.log("LIAMI RPC ERROR:", error);

        if (error) {
            console.error("Errore motore di ricerca LIAMI:", error);
            throw error;
        }

        const results = (data || []).map(business => {
            const relevanceScore = Number(business.relevance) || 0;

            return {
                ...business,

                // Percentuale indicativa di pertinenza
                relevance: Math.min(
                    100,
                    Math.max(0, Math.round(relevanceScore * 100))
                ),

                // Video trovati dalla ricerca SQL
                matching_videos: business.matching_videos || []
            };
        });

        // Ordina dal risultato più pertinente
        results.sort((a, b) => b.relevance - a.relevance);

        console.log("LIAMI - Risultati:", results);

        return results;

    } catch (error) {
        console.error("Ricerca LIAMI non riuscita:", error);
        return [];
    }
}

// ========================================
// FEED INTELLIGENTE - VIDEO PERTINENTI
// ========================================

function buildSearchFeed(results) {
    const businessesById = {};
    const matchingVideos = [];
    const usedVideos = new Set();

    const businessIds = new Set(
        results.map(business => business.id)
    );

    // Registra le attività trovate
    results.forEach(business => {
        businessesById[business.id] = business;

        // Inserisce prima i video trovati dal motore SQL
        const videos = Array.isArray(business.matching_videos)
            ? business.matching_videos
            : [];

        videos.forEach(video => {
            if (!video.video_url) return;

            const key = video.id || video.video_url;

            if (usedVideos.has(key)) return;

            usedVideos.add(key);

            matchingVideos.push({
                ...video,
                business_id: video.business_id || business.id,
                title: video.title || video.description || business.name,
                description: video.description || ""
            });
        });
    });

    // Recupera anche gli altri video delle attività trovate
    const remainingVideos = allFeedVideos.filter(video => {
        if (!businessIds.has(video.business_id)) return false;

        const key = video.id || video.video_url;

        if (usedVideos.has(key)) return false;

        usedVideos.add(key);
        return true;
    });

    return {
        videos: [...matchingVideos, ...remainingVideos],
        businessesById
    };
}

function renderBusinessResults(results, query) {
    const panel = document.getElementById("business-results");
    const heading = document.getElementById("feed-query-title");
    panel.replaceChildren();
    heading.textContent = `Risultati per “${query}”`;

    const panelHeader = document.createElement("div");
    panelHeader.className = "business-results-header";
    const panelTitle = document.createElement("h3");
    panelTitle.textContent = "Attività pertinenti";
    const panelCount = document.createElement("span");
    panelCount.className = "business-results-count";
    panelCount.textContent = String(results.length);
    panelHeader.append(panelTitle, panelCount);
    panel.appendChild(panelHeader);

    if (!results.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "business-results-empty";
        emptyMessage.textContent = "Non abbiamo trovato attività corrispondenti. Prova con un'altra categoria o città.";
        panel.appendChild(emptyMessage);
    }

    for (const business of results) {
        const card = document.createElement("article");
        card.className = "business-result-card";

        const name = document.createElement("h3");
        name.textContent = business.name || "Attività";
        card.appendChild(name);

        const relevance = document.createElement("span");
        relevance.className = "business-result-relevance";
        relevance.textContent = `${business.relevance}% attinenza stimata`;
        card.appendChild(relevance);

        if (business.category) {
            const category = document.createElement("span");
            category.className = "business-result-category";
            category.textContent = business.category;
            card.appendChild(category);
        }

        if (business.city || business.address) {
            const location = document.createElement("p");
            location.className = "business-result-location";
            location.textContent = [business.city, business.address].filter(Boolean).join(" · ");
            card.appendChild(location);
        }

        if (business.description) {
            const description = document.createElement("p");
            description.className = "business-result-description";
            description.textContent = business.description;
            card.appendChild(description);
        }

        if (business.phone) {
            const phone = document.createElement("a");
            phone.className = "business-result-phone";
            phone.href = `tel:${business.phone.replace(/[^\d+]/g, "")}`;
            phone.textContent = `Chiama · ${business.phone}`;
            card.appendChild(phone);
        }

        panel.appendChild(card);
    }

    currentMapQuery = results[0]?.city || query;
}

function renderFeed(videos, businessesById) {
    const feed = document.getElementById("liami-feed");
    const container = document.getElementById("feed-container");
    container.replaceChildren();

    if (!videos.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "feed-status";
        emptyMessage.textContent = "Non ci sono video disponibili per questa ricerca.";
        container.appendChild(emptyMessage);
        feed.hidden = false;
        return;
    }

    for (const videoData of videos) {
        if (!videoData.video_url) continue;

        const card = document.createElement("article");
        card.className = "video-card";

        const video = document.createElement("video");
        video.src = videoData.video_url;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("aria-label", videoData.title || "Video dell'attività");
        card.appendChild(video);

        const info = document.createElement("div");
        info.className = "video-info";

        const title = document.createElement("h3");
        title.textContent = videoData.title || "Video dell'attività";
        info.appendChild(title);

        const business = businessesById.get(videoData.business_id);
        if (business) {
            const businessName = document.createElement("p");
            businessName.textContent = business.name || "";
            info.appendChild(businessName);

            const location = [business.category, business.city].filter(Boolean).join(" · ");
            if (location) {
                const details = document.createElement("span");
                details.textContent = location;
                info.appendChild(details);
            }
        }

        if (videoData.description) {
            const description = document.createElement("p");
            description.textContent = videoData.description;
            info.appendChild(description);
        }

        card.appendChild(info);
        container.appendChild(card);
    }

    feed.hidden = false;
}

async function loadVideoFeed() {
    const feed = document.getElementById("liami-feed");
    const container = document.getElementById("feed-container");
    container.replaceChildren();

    const status = document.createElement("p");
    status.className = "feed-status";
    status.textContent = "Caricamento video...";
    container.appendChild(status);
    feed.hidden = false;

    const { data: videos, error: videosError } = await supabaseClient
        .from("business_videos")
        .select("business_id, video_url, title, description")
        .limit(50);

    if (videosError) throw videosError;

    const businessIds = [...new Set((videos || []).map((video) => video.business_id).filter(Boolean))];
    let businessesById = new Map();

    if (businessIds.length) {
        const { data: businesses, error: businessesError } = await supabaseClient
            .from("businesses")
            .select("id, name, category, city")
            .in("id", businessIds);

        if (businessesError) throw businessesError;
        businessesById = new Map((businesses || []).map((business) => [business.id, business]));
    }

    allFeedVideos = (videos || [])
        .filter((video) => video.video_url)
        .map((video) => ({ ...video, business: businessesById.get(video.business_id) }));
    renderFeed(allFeedVideos, businessesById);
}

function showFeedError(error) {
    console.error("Errore caricamento feed:", error);
    const container = document.getElementById("feed-container");
    container.replaceChildren();
    const message = document.createElement("p");
    message.className = "feed-status";
    message.textContent = "Impossibile caricare il feed. Controlla la connessione e la configurazione di Supabase.";
    container.appendChild(message);
}

function refreshVideoFeed() {
    videoFeedPromise = loadVideoFeed().catch(showFeedError);
    return videoFeedPromise;
}

async function handleSearch() {
    const input = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const query = input.value.trim();
    if (!query || sendButton.disabled) return;

    appendChatMessage(query, "user");
    input.value = "";
    sendButton.disabled = true;

    try {
        const results = await searchBusinesses(query);
        await videoFeedPromise;

        // Mostra le attività trovate
        renderBusinessResults(results, query);

        // Costruisce il feed dando priorità ai video pertinenti
        const feedData = buildSearchFeed(results);

        // Mostra il feed aggiornato
        renderFeed(
            feedData.videos,
            feedData.businessesById
        );

        const feed = document.getElementById("liami-feed");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        feed.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start"
        });
    } catch (error) {
        console.error("Errore ricerca attività:", error);
        appendChatMessage(
            "Non è stato possibile completare la ricerca. Controlla la connessione e la configurazione di Supabase.",
            "error"
        );
    } finally {
        sendButton.disabled = false;
        input.focus();
    }
}

function openMap() {
    const overlay = document.getElementById("map-overlay");
    const map = overlay.querySelector("iframe");
    map.src = `https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery)}&z=12&output=embed`;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
}

function closeMap() {
    const overlay = document.getElementById("map-overlay");
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
}

function initializePageInteractions() {
    const input = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const mapOverlay = document.getElementById("map-overlay");

    sendButton.addEventListener("click", handleSearch);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSearch();
        }
    });

    document.querySelectorAll(".suggestion").forEach((button) => {
        button.addEventListener("click", () => {
            input.value = button.textContent.replace(/^[^\p{L}\p{N}]+/u, "").trim();
            handleSearch();
        });
    });

    document.getElementById("open-map-button").addEventListener("click", openMap);
    document.getElementById("close-map").addEventListener("click", closeMap);
    mapOverlay.addEventListener("click", (event) => {
        if (event.target === mapOverlay) closeMap();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMap();
            closeAuthModal();
            closeUploadModal();
        }
    });

    refreshVideoFeed();
}

document.addEventListener("DOMContentLoaded", initializePageInteractions);

const cursorAura = document.querySelector(".cursor-aura");

if (cursorAura) {
    document.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        cursorAura.style.left = `${event.clientX}px`;
        cursorAura.style.top = `${event.clientY}px`;
    });
}
