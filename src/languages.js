// i18n / Languages Module
const languages = {
    es: {
        page_title: 'LiderControl EU',
        sistema_de_reportes: 'Sistema de Reportes',
        login_subtitle: 'Reportes e Incidencias · EU',
        email_label: 'Correo Electrónico',
        email_placeholder: 'tu@liderman.com.pe',
        password_label: 'Contraseña',
        password_placeholder: '••••••••',
        login_button: 'Iniciar Sesión',
        // Errors
        error_user_not_found: 'El usuario no existe.',
        error_wrong_password: 'Contraseña incorrecta.',
        error_invalid_email: 'Correo electrónico inválido.',
        error_too_many_requests: 'Demasiados intentos. Intenta más tarde.',
        error_user_disabled: 'Usuario deshabilitado.',
        error_login_failed: 'Error al iniciar sesión. Verifica tus datos.',
        firebase_not_initialized: 'Firebase no está inicializado.',
        // Sidebar & Nav
        dashboard_menu: 'Dashboard',
        table_menu: 'Tabla de Datos',
        logout_button: 'Cerrar Sesión',
        // Tabs
        facility_tab: 'FACILITY',
        security_tab: 'SECURITY',
        // Dashboard
        dashboard_title: 'Dashboard',
        table_title: 'Tabla de Datos',
        total_records: 'Total de Registros',
        incident_records: 'Incidencias Registradas',
        records_by_date: 'Registros por Fecha',
        records_by_agent: 'Registros por Agente',
        marking_points: 'Puntos de Marcación',
        marking_location: 'Ubicación de Marcaciones',
        // Filters
        filters_title: 'Filtros',
        from_date: 'Desde',
        to_date: 'Hasta',
        filter_button: 'Filtrar',
        clear_button: 'Limpiar',
        // Table
        export_excel: 'Exportar Excel',
        export_pdf: 'Exportar PDF',
        select_dates: 'Por favor selecciona ambas fechas.',
        no_records: 'No se encontraron registros.',
        showing_records: 'Mostrando',
        of: 'de',
        records: 'registros',
    },
    en: {
        page_title: 'LiderControl EU',
        sistema_de_reportes: 'Reporting System',
        login_subtitle: 'Reports & Incidents · EU',
        email_label: 'Email Address',
        email_placeholder: 'your@email.com',
        password_label: 'Password',
        password_placeholder: '••••••••',
        login_button: 'Sign In',
        // Errors
        error_user_not_found: 'User not found.',
        error_wrong_password: 'Incorrect password.',
        error_invalid_email: 'Invalid email address.',
        error_too_many_requests: 'Too many attempts. Try again later.',
        error_user_disabled: 'User account is disabled.',
        error_login_failed: 'Login failed. Please verify your credentials.',
        firebase_not_initialized: 'Firebase is not initialized.',
        // Sidebar & Nav
        dashboard_menu: 'Dashboard',
        table_menu: 'Data Table',
        logout_button: 'Sign Out',
        // Tabs
        facility_tab: 'FACILITY',
        security_tab: 'SECURITY',
        // Dashboard
        dashboard_title: 'Dashboard',
        table_title: 'Data Table',
        total_records: 'Total Records',
        incident_records: 'Registered Incidents',
        records_by_date: 'Records by Date',
        records_by_agent: 'Records by Agent',
        marking_points: 'Marking Points',
        marking_location: 'Marking Location',
        // Filters
        filters_title: 'Filters',
        from_date: 'From',
        to_date: 'To',
        filter_button: 'Filter',
        clear_button: 'Clear',
        // Table
        export_excel: 'Export Excel',
        export_pdf: 'Export PDF',
        select_dates: 'Please select both dates.',
        no_records: 'No records found.',
        showing_records: 'Showing',
        of: 'of',
        records: 'records',
    }
};

const getCurrentLanguage = () => localStorage.getItem('lidercontrol_lang') || 'es';

const setLanguage = (lang) => {
    if (!languages[lang]) return;
    localStorage.setItem('lidercontrol_lang', lang);
    applyLanguage(lang);
    // sync selectors
    document.querySelectorAll('#languageSelector, #languageSelectorLogin').forEach(el => {
        el.value = lang;
    });
};

const applyLanguage = (lang) => {
    const dict = languages[lang] || languages.es;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    if (dict.page_title) document.title = dict.page_title;
};

export const i18n = {
    t: (key) => {
        const lang = getCurrentLanguage();
        return (languages[lang] || languages.es)[key] ?? key;
    },
    setLanguage,
    getCurrentLanguage,
    applyLanguage,
    init: () => {
        const lang = getCurrentLanguage();
        applyLanguage(lang);
    }
};

export default i18n;
