// i18n / Languages Module
const languages = {
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
        main_menu: 'MAIN MENU',
        eu_operations: 'EU OPERATIONS',
        operator_role: 'Operator',
        processing: 'Processing...',
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
        incidents: 'Incidents',
        records_label: 'Records',
        select_dates: 'Please select both dates.',
        // Filters
        filters_title: 'Filters',
        filters_security: 'Filters (Security)',
        from_date: 'From',
        to_date: 'To',
        filter_button: 'Filter',
        clear_button: 'Clear',
        // Table
        table_header_date: 'Date',
        table_header_name: 'Name',
        table_header_point: 'Marking Point',
        table_header_obs: 'Observation',
        table_header_photo: 'Photo',
        export_excel: 'Export Excel',
        export_pdf: 'Export PDF',
        no_records: 'No records found.',
        showing_records: 'Showing',
        of: 'of',
        records: 'records',
        // PDF/Excel specific
        report_title: 'INCIDENT REPORT',
        category: 'Category',
        generated_on: 'Generated on',
        all_records: 'All records',
        excel_exported: 'Excel exported successfully.',
        pdf_generated: 'PDF generated successfully.',
        generating_pdf: 'Generating PDF...',
    }
};

// Always return 'en'
const getCurrentLanguage = () => 'en';

const applyLanguage = (lang) => {
    const dict = languages.en;
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
        return languages.en[key] ?? key;
    },
    getCurrentLanguage,
    applyLanguage,
    init: () => {
        applyLanguage('en');
    }
};

export default i18n;
