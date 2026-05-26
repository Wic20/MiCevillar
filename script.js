/* ===========================
   GESTIÓN DE DOCUMENTOS
   =========================== */

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initAuthAndPreferences();
    loadDocuments();
    loadRequests();
    smoothScroll();
});

/* ===========================
   AUTENTICACIÓN SIMULADA Y PREFERENCIAS
   =========================== */

function initAuthAndPreferences() {
    // Si estamos en una página distinta de login y no hay usuario, redirigir
    const path = window.location.pathname.split('/').pop();
    const user = JSON.parse(localStorage.getItem('miCevillar_user') || 'null');
    if (path !== 'login.html' && !user) {
        window.location.href = 'login.html';
        return;
    }

    applyThemeFromStorage();
    applyLangFromStorage();
    updateUIForUser(user);
}

function applyThemeFromStorage() {
    const theme = localStorage.getItem('miCevillar_theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark');
}

function applyLangFromStorage() {
    const lang = localStorage.getItem('miCevillar_lang') || 'es';
    const select = document.getElementById('langSelect');
    if (select) select.value = lang;
}

function updateUIForUser(user) {
    const logoutBtn = document.querySelector('.logout-btn');
    const adminLink = document.getElementById('adminLink');
    const studentName = document.querySelector('.student-name');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(){
            localStorage.removeItem('miCevillar_user');
            window.location.href = 'login.html';
        });
    }

    if (user) {
        if (studentName) studentName.textContent = user.name || user.username;
        if (user.role === 'admin' && adminLink) adminLink.style.display = '';
        if (user.role !== 'admin' && adminLink) adminLink.style.display = 'none';
    }
}

// Event Listeners
function initializeEventListeners() {
    // Búsqueda y filtrado de documentos
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterDocuments);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterDocuments);
    }

    // Modal de nueva solicitud
    const newRequestBtn = document.getElementById('newRequestBtn');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    const newRequestModal = document.getElementById('newRequestModal');
    const modalClose = document.querySelector('.modal-close');

    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', openModal);
    }
    
    if (cancelRequestBtn) {
        cancelRequestBtn.addEventListener('click', closeModal);
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Cerrar modal al hacer clic fuera
    if (newRequestModal) {
        newRequestModal.addEventListener('click', function(e) {
            if (e.target === newRequestModal) {
                closeModal();
            }
        });
    }

    // Formulario de solicitud
    const requestForm = document.querySelector('.request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', submitRequest);
    }

    // Pestañas de solicitudes
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Navegación suave
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Botones de descargar
    const downloadBtns = document.querySelectorAll('.btn-download, .btn-download-request');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });

    // Botones de ver documento
    const viewBtns = document.querySelectorAll('.btn-view');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', handleViewDocument);
    });

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Tema e idioma
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.addEventListener('change', changeLanguage);

    // Exportar y respaldo
    const exportAllBtn = document.getElementById('exportAllBtn');
    if (exportAllBtn) exportAllBtn.addEventListener('click', exportAllAsPDF);

    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) backupBtn.addEventListener('click', simulateBackup);
}

/* ===========================
   FILTRADO DE DOCUMENTOS
   =========================== */

function filterDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;
    const documentCards = document.querySelectorAll('.document-card');

    documentCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.doc-description').textContent.toLowerCase();
        const category = card.getAttribute('data-category');

        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesFilter = filterValue === 'todos' || category === filterValue;

        if (matchesSearch && matchesFilter) {
            card.style.display = '';
            card.style.animation = 'fadeIn 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });

    // Mostrar mensaje si no hay resultados
    showNoResultsMessage(documentCards);
}

function showNoResultsMessage(cards) {
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    const documentsGrid = document.getElementById('documentsGrid');
    
    if (visibleCards.length === 0 && documentsGrid) {
        const existingMessage = documentsGrid.querySelector('.no-results');
        if (!existingMessage) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.textContent = 'No se encontraron documentos que coincidan con tu búsqueda.';
            message.style.cssText = `
                grid-column: 1 / -1;
                text-align: center;
                padding: 3rem;
                color: var(--text-light);
                font-size: 1.1rem;
            `;
            documentsGrid.appendChild(message);
        }
    } else {
        const existingMessage = documentsGrid.querySelector('.no-results');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
}

/* ===========================
   GESTIÓN DE MODAL
   =========================== */

function openModal() {
    const modal = document.getElementById('newRequestModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('newRequestModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        // Limpiar el formulario
        const form = document.querySelector('.request-form');
        if (form) {
            form.reset();
        }
    }
}

function submitRequest(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const documentType = formData.get('select') || 'documento';
    
    // Simular envío
    console.log('Solicitud enviada:',  formData);
    
    // Mostrar notificación
    showNotification('✅ Solicitud creada exitosamente. Te notificaremos cuando esté lista.');
    
    // Cerrar modal después de 1 segundo
    setTimeout(closeModal, 500);
    
    // Agregar nueva solicitud a la lista (simulación)
    addNewRequest(documentType);
}

function addNewRequest(documentType) {
    const requestsList = document.getElementById('requestsList');
    if (!requestsList) return;

    const newRequest = document.createElement('div');
    newRequest.className = 'request-item';
    newRequest.setAttribute('data-status', 'pendiente');
    
    const today = new Date();
    const dateString = today.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });

    newRequest.innerHTML = `
        <div class="request-header">
            <h3>Solicitud de ${documentType}</h3>
            <span class="status-badge status-pending">⏳ En Proceso</span>
        </div>
        <p class="request-date">Solicitado: ${dateString}</p>
        <p class="request-description">Tu solicitud está siendo procesada. Tiempo estimado: 2-3 días hábiles</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 15%;"></div>
        </div>
    `;

    requestsList.insertBefore(newRequest, requestsList.firstChild);
}

/* ===========================
   GESTIÓN DE PESTAÑAS
   =========================== */

function switchTab(e) {
    const tabValue = e.target.getAttribute('data-tab');
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Filtrar solicitudes
    const requestItems = document.querySelectorAll('.request-item');
    requestItems.forEach(item => {
        const status = item.getAttribute('data-status');
        
        if (tabValue === 'todas') {
            item.style.display = '';
        } else if (tabValue === 'pendientes' && status === 'pendiente') {
            item.style.display = '';
        } else if (tabValue === 'completadas' && status === 'completada') {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/* ===========================
   MANEJO DE DESCARGAS
   =========================== */

function handleDownload(e) {
    e.preventDefault();
    
    // Obtener información del documento
    const card = e.target.closest('.document-card, .request-item');
    const title = card.querySelector('h3').textContent;
    
    // Simular descarga
    console.log('Descargando:', title);
    showNotification(`📥 Descargando: ${title}`);
    
    // En una aplicación real, aquí iría la lógica de descarga real
}

function handleViewDocument(e) {
    e.preventDefault();
    
    const card = e.target.closest('.document-card');
    const title = card.querySelector('h3').textContent;
    
    showNotification(`👁️ Abriendo: ${title}`);
    
    // En una aplicación real, aquí iría la lógica para abrir el documento
}

/* ===========================
   NAVEGACIÓN SUAVE
   =========================== */

function handleNavClick(e) {
    const href = e.target.getAttribute('href');
    
    if (href && href.startsWith('#')) {
        e.preventDefault();
        
        // Actualizar nav links activos
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
    }
}

function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

/* ===========================
   NOTIFICACIONES
   =========================== */

function showNotification(message, duration = 3000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Remover después de la duración
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/* ===========================
   CARGA DE DATOS (SIMULACIÓN)
   =========================== */

function loadDocuments() {
    console.log('Documentos cargados');
    // En una aplicación real, aquí se cargarían los documentos desde una API
}

function loadRequests() {
    console.log('Solicitudes cargadas');
    // En una aplicación real, aquí se cargarían las solicitudes desde una API
}

/* ===========================
   LOGOUT
   =========================== */

function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('miCevillar_user');
        showNotification('👋 Sesión cerrada correctamente');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    }
}

/* ===========================
   TEMA E IDIOMA
   =========================== */

function toggleTheme() {
    document.body.classList.toggle('dark');
    const newTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('miCevillar_theme', newTheme);
    showNotification(`Tema: ${newTheme === 'dark' ? 'Oscuro' : 'Claro'}`);
}

function changeLanguage(e) {
    const lang = e.target.value;
    localStorage.setItem('miCevillar_lang', lang);
    showNotification(`Idioma cambiado a ${lang.toUpperCase()}`);
    // Para la demo solo cambiamos textos simples (se puede extender)
}

/* ===========================
   EXPORTAR / RESPALDO / OCR (SIMULACIÓN)
   =========================== */

function exportAllAsPDF() {
    showNotification('Generando exportación PDF...');
    // Usamos print como forma simple de exportar (puede imprimirse a PDF)
    window.print();
}

function simulateBackup() {
    showNotification('Respaldando documentos en la nube...');
    // Simular retraso y resultado
    setTimeout(() => {
        showNotification('✅ Respaldo completado en la nube (simulado)');
    }, 1500);
}

/* ===========================
   ANIMACIÓN FADEOUT
   =========================== */

// Agregar keyframe para fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

/* ===========================
   FUNCIONALIDADES ADICIONALES
   =========================== */

// Simulación de actualización de progreso en solicitudes
function simulateProgressUpdate() {
    setInterval(() => {
        const progressFills = document.querySelectorAll('.progress-fill');
        progressFills.forEach(fill => {
            const currentWidth = parseFloat(fill.style.width);
            if (currentWidth < 95) {
                fill.style.width = (currentWidth + Math.random() * 5) + '%';
            }
        });
    }, 3000);
}

// Iniciar simulación de progreso
simulateProgressUpdate();

// Función para validar el formulario
function validateRequestForm(formData) {
    const requiredFields = ['documentType', 'reason'];
    return requiredFields.every(field => formData.get(field));
}

// Estadísticas en tiempo real
function updateStats() {
    const stats = document.querySelectorAll('.stat-card');
    stats.forEach(stat => {
        stat.addEventListener('mouseenter', function() {
            const number = this.querySelector('h3');
            const randomIncrease = Math.floor(Math.random() * 5);
            number.style.animation = 'none';
            setTimeout(() => {
                number.style.animation = 'pulse 0.3s ease';
            }, 10);
        });
    });
}

// Agregar animación pulse
const styleSheet = document.styleSheets[document.styleSheets.length - 1];
styleSheet.insertRule(`
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`);

updateStats();

console.log('✅ Mi Cevillar - Sistema de Gestión Documental inicializado correctamente');
