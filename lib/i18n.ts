import { cookies } from "next/headers"

export type Lang = "fr" | "ar"

export type Dict = {
  // Navigation
  nav_dashboard: string
  nav_subjects: string
  nav_mistakes: string
  nav_profile: string
  nav_overview: string
  nav_users: string
  nav_questions: string
  nav_analytics: string
  nav_home: string
  sign_out: string
  signed_out_toast: string

  // Login
  login_app_subtitle_signin: string
  login_app_subtitle_signup: string
  login_app_subtitle_forgot: string
  login_title_signin: string
  login_desc_signin: string
  login_title_signup: string
  login_desc_signup: string
  login_title_forgot: string
  login_desc_forgot: string
  login_full_name: string
  login_your_name: string
  login_email: string
  login_password: string
  login_forgot_link: string
  login_btn_signin: string
  login_btn_signup: string
  login_btn_forgot: string
  login_loading_signin: string
  login_loading_signup: string
  login_loading_forgot: string
  login_no_account: string
  login_signup_link: string
  login_have_account: string
  login_signin_link: string
  login_reset_sent_toast: string
  login_signup_success_toast: string

  // Reset password
  reset_new_password: string
  reset_confirm_password: string
  reset_mismatch: string
  reset_submit: string
  reset_loading: string
  reset_success_toast: string

  // Dashboard
  dashboard_greeting: string
  dashboard_subtitle: string
  stat_subjects: string
  stat_tests_completed: string
  card_practice_title: string
  card_practice_desc: string
  card_test_title: string
  card_test_desc: string
  choose_subject: string

  // Subjects list
  subjects_title: string
  not_started: string

  // Subject detail
  stat_correct: string
  stat_partial: string
  stat_incorrect: string
  start_practice: string
  continue_practice: string
  start_test: string
  need_20_questions: string
  recent_tests: string
  see_all: string

  // Mistakes
  mistakes_title: string
  all_subjects: string
  practice_btn: string
  explanation_label: string
  to_review_count: string

  // Practice
  select_all_correct: string
  question_of: string
  confirm_answer: string
  save_error_toast: string
  answered_label: string
  correct_label: string
  practice_questions_btn: string
  practice_all_questions: string
  practice_unanswered: string

  // Test
  test_random_questions: string
  test_time_limit: string
  test_scoring: string
  test_after_submit: string
  test_label_duration: string
  test_label_scoring: string
  test_label_after_submit: string
  test_not_enough: string
  test_preparing: string
  test_submitting: string
  test_submit_btn: string
  test_start: string
  test_finish: string
  test_prev: string
  test_next: string
  test_correct: string
  test_partial: string
  test_incorrect: string
  test_opt_correct: string
  test_opt_incorrect: string
  test_resume: string
  test_time_up_toast: string
  test_submit_fail_toast: string
  test_confirm_answer: string

  // Tests history
  tests_title: string
  tests_empty: string
  test_expired: string

  // Review
  retake_label: string
  review_back: string
  review_title: string
  review_time_expired: string
  review_back_subject: string
  review_retake: string

  // Profile
  profile_title: string
  profile_account: string
  profile_display_name: string
  profile_role: string
  profile_save: string
  profile_saving: string
  profile_saved_toast: string
  profile_name_empty_toast: string
  profile_password_title: string
  profile_password_desc: string
  profile_send_reset: string
  profile_reset_sent: string
  profile_reset_sent_toast: string
  profile_your_name: string

  // Admin overview
  admin_overview_title: string
  admin_stat_students: string
  admin_stat_questions: string
  admin_stat_tests: string
  admin_stat_subjects: string
  admin_manage: string

  // Admin users
  admin_users_title: string
  admin_no_name: string
  admin_registered_on: string
  admin_answers_label: string
  admin_prev: string
  admin_next: string
  admin_page_of: string

  // Admin analytics
  admin_analytics_title: string
  admin_stat_students_count: string
  admin_stat_training_answers: string
  admin_stat_completed_tests: string
  admin_stat_overall_correct: string
  admin_perf_title: string
  admin_active_label: string
  admin_answers_count_label: string
  admin_avg_test_label: string
  admin_hardest_title: string
  admin_attempts_label: string
  admin_fail_rate_label: string
  admin_no_data: string

  // Admin subjects
  admin_subjects_title: string
  admin_new_subject: string
  admin_cancel: string
  admin_subject_name_label: string
  admin_emoji_label: string
  admin_create_btn: string
  admin_update_btn: string
  admin_delete_confirm: string
  admin_create_toast: string
  admin_update_toast: string
  admin_delete_toast: string

  // Admin questions manage
  admin_questions_select_subject: string
  admin_new_question: string
  admin_question_text_label: string
  admin_explanation_label: string
  admin_difficulty_label: string
  admin_options_title: string
  admin_add_option: string
  admin_create_question: string
  admin_question_created_toast: string
  admin_question_updated_toast: string
  admin_question_deleted_toast: string
  admin_delete_question_confirm: string
  admin_no_questions: string
  admin_edit_btn: string
  admin_save_btn: string
  admin_diff_easy: string
  admin_diff_medium: string
  admin_diff_hard: string
  admin_diff_none: string

  // Admin import
  admin_import_heading: string
  admin_import_step1: string
  admin_import_step2: string
  admin_import_step3: string
  admin_import_btn: string
  admin_import_loading: string
  admin_import_success_toast: string
  admin_import_fail_toast: string
  admin_upload_prompt: string
  admin_upload_sub: string
  admin_sample_csv: string
  admin_sample_json: string
  admin_format_csv_title: string
  admin_format_json_title: string
  admin_csv_required: string
  admin_csv_optional: string
  admin_json_desc: string
  admin_json_options_desc: string
  admin_warnings_one: string
  admin_warnings_many: string
  admin_no_subject_warning: string

  // Admin tabs
  admin_tab_manage: string
  admin_tab_import: string

  // Admin user detail
  admin_user_no_answers: string
  admin_user_practice_by_subject: string
  admin_user_recent_tests: string
  admin_user_unknown: string

  // Common
  back: string
  error_generic: string
}

const fr: Dict = {
  // Navigation
  nav_dashboard: "Tableau de bord",
  nav_subjects: "Matières",
  nav_mistakes: "Erreurs",
  nav_profile: "Profil",
  nav_overview: "Vue d'ensemble",
  nav_users: "Utilisateurs",
  nav_questions: "Questions",
  nav_analytics: "Statistiques",
  nav_home: "Accueil",
  sign_out: "Se déconnecter",
  signed_out_toast: "Déconnecté",

  // Login
  login_app_subtitle_signin: "Connectez-vous à votre compte",
  login_app_subtitle_signup: "Créez un nouveau compte",
  login_app_subtitle_forgot: "Mot de passe oublié ?",
  login_title_signin: "Se connecter",
  login_desc_signin: "Saisissez votre e-mail et votre mot de passe",
  login_title_signup: "Créer un compte",
  login_desc_signup: "Remplissez vos informations pour commencer",
  login_title_forgot: "Réinitialiser le mot de passe",
  login_desc_forgot: "Nous vous enverrons un lien par e-mail",
  login_full_name: "Nom complet",
  login_your_name: "Votre nom",
  login_email: "E-mail",
  login_password: "Mot de passe",
  login_forgot_link: "Mot de passe oublié ?",
  login_btn_signin: "Se connecter",
  login_btn_signup: "Créer un compte",
  login_btn_forgot: "Envoyer le lien",
  login_loading_signin: "Connexion…",
  login_loading_signup: "Création du compte…",
  login_loading_forgot: "Envoi du lien…",
  login_no_account: "Pas encore de compte ?",
  login_signup_link: "S'inscrire",
  login_have_account: "Déjà un compte ?",
  login_signin_link: "Se connecter",
  login_reset_sent_toast: "Vérifiez votre e-mail pour le lien de réinitialisation.",
  login_signup_success_toast: "Compte créé ! Vous pouvez maintenant vous connecter.",

  // Reset password
  reset_new_password: "Nouveau mot de passe",
  reset_confirm_password: "Confirmer le mot de passe",
  reset_mismatch: "Les mots de passe ne correspondent pas",
  reset_submit: "Mettre à jour le mot de passe",
  reset_loading: "Mise à jour…",
  reset_success_toast: "Mot de passe mis à jour. Vous pouvez maintenant vous connecter.",

  // Dashboard
  dashboard_greeting: "Bonjour",
  dashboard_subtitle: "Prêt à réviser ? Reprenez là où vous vous êtes arrêté.",
  stat_subjects: "Matières",
  stat_tests_completed: "Tests complétés",
  card_practice_title: "Mode entraînement",
  card_practice_desc: "Parcourez toutes les questions d'une matière et sauvegardez vos réponses. Suivez lesquelles sont correctes, incorrectes ou partielles.",
  card_test_title: "Test chronométré",
  card_test_desc: "Passez un test de 20 questions aléatoires contre la montre. Obtenez un score et révisez chaque réponse ensuite.",
  choose_subject: "Choisir une matière",

  // Subjects list
  subjects_title: "Matières",
  not_started: "Non commencé",

  // Subject detail
  stat_correct: "Correct",
  stat_partial: "Partiel",
  stat_incorrect: "Incorrect",
  start_practice: "Commencer l'entraînement",
  continue_practice: "Continuer l'entraînement",
  start_test: "Commencer le test",
  need_20_questions: "Il faut au moins 20 questions",
  recent_tests: "Tests récents",
  see_all: "Voir tout",

  // Mistakes
  mistakes_title: "Erreurs",
  all_subjects: "Toutes les matières",
  practice_btn: "S'entraîner",
  explanation_label: "Explication",
  to_review_count: "questions à revoir",

  // Practice
  select_all_correct: "Sélectionnez toutes les réponses correctes",
  question_of: "sur",
  confirm_answer: "Confirmer la réponse",
  save_error_toast: "Échec de la sauvegarde de la réponse",
  answered_label: "répondu(e)s",
  correct_label: "correct(s)",
  practice_questions_btn: "Questions",
  practice_all_questions: "Toutes les questions",
  practice_unanswered: "Sans réponse",

  // Test
  test_random_questions: "20 questions aléatoires",
  test_time_limit: "20 minutes",
  test_scoring: "Crédit partiel pour les réponses partielles",
  test_after_submit: "Révision complète avec les bonnes réponses",
  test_label_duration: "Durée limite",
  test_label_scoring: "Notation",
  test_label_after_submit: "Après soumission",
  test_not_enough: "Pas assez de questions ({count}/20 disponibles).",
  test_preparing: "Préparation du test…",
  test_submitting: "Soumission…",
  test_submit_btn: "Soumettre le test",
  test_start: "Commencer le test",
  test_finish: "Terminer & soumettre",
  test_prev: "Précédent",
  test_next: "Suivant",
  test_correct: "Correct !",
  test_partial: "Partiellement correct",
  test_incorrect: "Incorrect",
  test_opt_correct: "correct",
  test_opt_incorrect: "incorrect",
  test_resume: "Reprendre le test",
  test_time_up_toast: "Temps écoulé ! Votre test a été soumis.",
  test_submit_fail_toast: "Échec de la soumission du test. Veuillez réessayer.",
  test_confirm_answer: "Confirmer la réponse",

  // Tests history
  tests_title: "Historique des tests",
  tests_empty: "Aucun test complété pour l'instant.",
  test_expired: "Expiré",

  // Review
  retake_label: "Réessai",
  review_back: "Retour",
  review_title: "Révision des questions",
  review_time_expired: "Temps expiré",
  review_back_subject: "Retour à la matière",
  review_retake: "Repasser le test",

  // Profile
  profile_title: "Profil",
  profile_account: "Détails du compte",
  profile_display_name: "Nom d'affichage",
  profile_role: "Rôle",
  profile_save: "Sauvegarder",
  profile_saving: "Sauvegarde…",
  profile_saved_toast: "Profil mis à jour",
  profile_name_empty_toast: "Le nom ne peut pas être vide",
  profile_password_title: "Mot de passe",
  profile_password_desc: "Nous enverrons un lien de réinitialisation à",
  profile_send_reset: "Envoyer l'e-mail de réinitialisation",
  profile_reset_sent: "E-mail envoyé",
  profile_reset_sent_toast: "E-mail de réinitialisation envoyé",
  profile_your_name: "Votre nom",

  // Admin overview
  admin_overview_title: "Vue d'ensemble",
  admin_stat_students: "Étudiants",
  admin_stat_questions: "Questions",
  admin_stat_tests: "Tests complétés",
  admin_stat_subjects: "Matières",
  admin_manage: "Gérer →",

  // Admin users
  admin_users_title: "Utilisateurs",
  admin_no_name: "Aucun nom",
  admin_registered_on: "Inscrit le",
  admin_answers_label: "réponses",
  admin_prev: "Précédent",
  admin_next: "Suivant",
  admin_page_of: "sur",

  // Admin analytics
  admin_analytics_title: "Statistiques",
  admin_stat_students_count: "Étudiants",
  admin_stat_training_answers: "Réponses entraînement",
  admin_stat_completed_tests: "Tests complétés",
  admin_stat_overall_correct: "Correct global",
  admin_perf_title: "Performance par matière",
  admin_active_label: "actif",
  admin_answers_count_label: "réponses",
  admin_avg_test_label: "moy. test",
  admin_hardest_title: "Questions les plus ratées",
  admin_attempts_label: "tentative",
  admin_fail_rate_label: "d'échec",
  admin_no_data: "Aucune donnée. Les statistiques apparaîtront lorsque les étudiants commenceront à s'entraîner.",

  // Admin subjects
  admin_subjects_title: "Matières",
  admin_new_subject: "Nouvelle matière",
  admin_cancel: "Annuler",
  admin_subject_name_label: "Nom",
  admin_emoji_label: "Emoji (icône)",
  admin_create_btn: "Créer",
  admin_update_btn: "Mettre à jour",
  admin_delete_confirm: "Supprimer",
  admin_create_toast: "Matière créée",
  admin_update_toast: "Matière mise à jour",
  admin_delete_toast: "Matière supprimée",

  // Admin questions manage
  admin_questions_select_subject: "Sélectionner une matière",
  admin_new_question: "Nouvelle question",
  admin_question_text_label: "Question",
  admin_explanation_label: "Explication (optionnel)",
  admin_difficulty_label: "Difficulté",
  admin_options_title: "Options de réponse",
  admin_add_option: "Ajouter une option",
  admin_create_question: "Créer la question",
  admin_question_created_toast: "Question créée",
  admin_question_updated_toast: "Question mise à jour",
  admin_question_deleted_toast: "Question supprimée",
  admin_delete_question_confirm: "Supprimer cette question ?",
  admin_no_questions: "Aucune question. Importez-en ou créez-en une ci-dessus.",
  admin_edit_btn: "Modifier",
  admin_save_btn: "Sauvegarder",
  admin_diff_easy: "Facile",
  admin_diff_medium: "Moyen",
  admin_diff_hard: "Difficile",
  admin_diff_none: "Aucune",

  // Admin import
  admin_import_heading: "Importer des questions",
  admin_import_step1: "1. Sélectionner la matière",
  admin_import_step2: "2. Téléverser un fichier",
  admin_import_step3: "3. Aperçu & importation",
  admin_import_btn: "Importer",
  admin_import_loading: "Importation…",
  admin_import_success_toast: "importée",
  admin_import_fail_toast: "Échec de l'importation",
  admin_upload_prompt: "Cliquer pour téléverser un CSV ou JSON",
  admin_upload_sub: ".csv ou .json — encodé en UTF-8",
  admin_sample_csv: "Exemple CSV",
  admin_sample_json: "Exemple JSON",
  admin_format_csv_title: "Format CSV",
  admin_format_json_title: "Format JSON",
  admin_csv_required: "Obligatoire :",
  admin_csv_optional: "Optionnel :",
  admin_json_desc: "Tableau d'objets avec",
  admin_json_options_desc: "Tableau d'options :",
  admin_warnings_one: "avertissement",
  admin_warnings_many: "avertissements",
  admin_no_subject_warning: "Sélectionnez d'abord une matière (étape 1)",

  // Admin tabs
  admin_tab_manage: "Gérer",
  admin_tab_import: "Importer",

  // Admin user detail
  admin_user_no_answers: "Cet utilisateur n'a pas encore répondu à des questions.",
  admin_user_practice_by_subject: "Entraînement par matière",
  admin_user_recent_tests: "Tests récents",
  admin_user_unknown: "Inconnu",

  // Common
  back: "Retour",
  error_generic: "Une erreur est survenue",
}

const ar: Dict = {
  // Navigation
  nav_dashboard: "لوحة التحكم",
  nav_subjects: "المواد",
  nav_mistakes: "الأخطاء",
  nav_profile: "الملف الشخصي",
  nav_overview: "نظرة عامة",
  nav_users: "المستخدمون",
  nav_questions: "الأسئلة",
  nav_analytics: "الإحصائيات",
  nav_home: "الرئيسية",
  sign_out: "تسجيل الخروج",
  signed_out_toast: "تم تسجيل الخروج",

  // Login
  login_app_subtitle_signin: "سجّل دخولك إلى حسابك",
  login_app_subtitle_signup: "أنشئ حساباً جديداً",
  login_app_subtitle_forgot: "نسيت كلمة المرور؟",
  login_title_signin: "تسجيل الدخول",
  login_desc_signin: "أدخل بريدك الإلكتروني وكلمة مرورك",
  login_title_signup: "إنشاء حساب",
  login_desc_signup: "أدخل معلوماتك للبدء",
  login_title_forgot: "إعادة تعيين كلمة المرور",
  login_desc_forgot: "سنرسل لك رابطاً عبر البريد الإلكتروني",
  login_full_name: "الاسم الكامل",
  login_your_name: "اسمك",
  login_email: "البريد الإلكتروني",
  login_password: "كلمة المرور",
  login_forgot_link: "نسيت كلمة المرور؟",
  login_btn_signin: "تسجيل الدخول",
  login_btn_signup: "إنشاء حساب",
  login_btn_forgot: "إرسال الرابط",
  login_loading_signin: "جاري تسجيل الدخول…",
  login_loading_signup: "جاري إنشاء الحساب…",
  login_loading_forgot: "جاري إرسال الرابط…",
  login_no_account: "ليس لديك حساب؟",
  login_signup_link: "سجّل الآن",
  login_have_account: "لديك حساب؟",
  login_signin_link: "تسجيل الدخول",
  login_reset_sent_toast: "تحقق من بريدك الإلكتروني للحصول على رابط إعادة التعيين.",
  login_signup_success_toast: "تم إنشاء الحساب! يمكنك الآن تسجيل الدخول.",

  // Reset password
  reset_new_password: "كلمة المرور الجديدة",
  reset_confirm_password: "تأكيد كلمة المرور",
  reset_mismatch: "كلمات المرور غير متطابقة",
  reset_submit: "تحديث كلمة المرور",
  reset_loading: "جاري التحديث…",
  reset_success_toast: "تم تحديث كلمة المرور. يمكنك الآن تسجيل الدخول.",

  // Dashboard
  dashboard_greeting: "مرحباً",
  dashboard_subtitle: "مستعد للمراجعة؟ أكمل من حيث توقفت.",
  stat_subjects: "المواد",
  stat_tests_completed: "الاختبارات المكتملة",
  card_practice_title: "وضع التدريب",
  card_practice_desc: "تصفّح جميع أسئلة مادة وسجّل إجاباتك. تتبّع الصحيحة والخاطئة والجزئية.",
  card_test_title: "اختبار موقوت",
  card_test_desc: "أجرِ اختباراً من 20 سؤالاً عشوائياً ضد الساعة. احصل على نتيجة وراجع كل إجابة بعدها.",
  choose_subject: "اختر مادة",

  // Subjects list
  subjects_title: "المواد",
  not_started: "لم يبدأ",

  // Subject detail
  stat_correct: "صحيح",
  stat_partial: "جزئي",
  stat_incorrect: "خاطئ",
  start_practice: "بدء التدريب",
  continue_practice: "متابعة التدريب",
  start_test: "بدء الاختبار",
  need_20_questions: "يجب أن يكون هناك 20 سؤالاً على الأقل",
  recent_tests: "الاختبارات الأخيرة",
  see_all: "عرض الكل",

  // Mistakes
  mistakes_title: "الأخطاء",
  all_subjects: "جميع المواد",
  practice_btn: "تدرّب",
  explanation_label: "الشرح",
  to_review_count: "أسئلة للمراجعة",

  // Practice
  select_all_correct: "اختر جميع الإجابات الصحيحة",
  question_of: "من",
  confirm_answer: "تأكيد الإجابة",
  save_error_toast: "فشل حفظ الإجابة",
  answered_label: "تمت الإجابة",
  correct_label: "صحيح",
  practice_questions_btn: "الأسئلة",
  practice_all_questions: "جميع الأسئلة",
  practice_unanswered: "بدون إجابة",

  // Test
  test_random_questions: "20 سؤالاً عشوائياً",
  test_time_limit: "20 دقيقة",
  test_scoring: "نقاط جزئية للإجابات الجزئية",
  test_after_submit: "مراجعة كاملة مع الإجابات الصحيحة",
  test_label_duration: "المدة الزمنية",
  test_label_scoring: "التنقيط",
  test_label_after_submit: "بعد الإرسال",
  test_not_enough: "لا توجد أسئلة كافية ({count}/20 متوفرة).",
  test_preparing: "جاري تحضير الاختبار…",
  test_submitting: "جاري الإرسال…",
  test_submit_btn: "إرسال الاختبار",
  test_start: "بدء الاختبار",
  test_finish: "إنهاء وإرسال",
  test_prev: "السابق",
  test_next: "التالي",
  test_correct: "صحيح!",
  test_partial: "صحيح جزئياً",
  test_incorrect: "خاطئ",
  test_opt_correct: "صحيح",
  test_opt_incorrect: "خاطئ",
  test_resume: "استئناف الاختبار",
  test_time_up_toast: "انتهى الوقت! تم إرسال اختبارك.",
  test_submit_fail_toast: "فشل إرسال الاختبار. حاول مجدداً.",
  test_confirm_answer: "تأكيد الإجابة",

  // Tests history
  tests_title: "سجل الاختبارات",
  tests_empty: "لا توجد اختبارات مكتملة بعد.",
  test_expired: "منتهي",

  // Review
  retake_label: "إعادة محاولة",
  review_back: "رجوع",
  review_title: "مراجعة الأسئلة",
  review_time_expired: "انتهى الوقت",
  review_back_subject: "العودة إلى المادة",
  review_retake: "إعادة الاختبار",

  // Profile
  profile_title: "الملف الشخصي",
  profile_account: "تفاصيل الحساب",
  profile_display_name: "الاسم المعروض",
  profile_role: "الدور",
  profile_save: "حفظ",
  profile_saving: "جاري الحفظ…",
  profile_saved_toast: "تم تحديث الملف الشخصي",
  profile_name_empty_toast: "الاسم لا يمكن أن يكون فارغاً",
  profile_password_title: "كلمة المرور",
  profile_password_desc: "سنرسل رابط إعادة التعيين إلى",
  profile_send_reset: "إرسال بريد إعادة التعيين",
  profile_reset_sent: "تم الإرسال",
  profile_reset_sent_toast: "تم إرسال بريد إعادة التعيين",
  profile_your_name: "اسمك",

  // Admin overview
  admin_overview_title: "نظرة عامة",
  admin_stat_students: "الطلاب",
  admin_stat_questions: "الأسئلة",
  admin_stat_tests: "الاختبارات المكتملة",
  admin_stat_subjects: "المواد",
  admin_manage: "إدارة ←",

  // Admin users
  admin_users_title: "المستخدمون",
  admin_no_name: "بدون اسم",
  admin_registered_on: "مسجّل في",
  admin_answers_label: "إجابات",
  admin_prev: "السابق",
  admin_next: "التالي",
  admin_page_of: "من",

  // Admin analytics
  admin_analytics_title: "الإحصائيات",
  admin_stat_students_count: "الطلاب",
  admin_stat_training_answers: "إجابات التدريب",
  admin_stat_completed_tests: "الاختبارات المكتملة",
  admin_stat_overall_correct: "الصحيح الإجمالي",
  admin_perf_title: "الأداء حسب المادة",
  admin_active_label: "نشط",
  admin_answers_count_label: "إجابات",
  admin_avg_test_label: "متوسط الاختبار",
  admin_hardest_title: "الأسئلة الأكثر رسوباً",
  admin_attempts_label: "محاولة",
  admin_fail_rate_label: "رسوب",
  admin_no_data: "لا توجد بيانات. ستظهر الإحصائيات عندما يبدأ الطلاب في التدريب.",

  // Admin subjects
  admin_subjects_title: "المواد",
  admin_new_subject: "مادة جديدة",
  admin_cancel: "إلغاء",
  admin_subject_name_label: "الاسم",
  admin_emoji_label: "رمز تعبيري (أيقونة)",
  admin_create_btn: "إنشاء",
  admin_update_btn: "تحديث",
  admin_delete_confirm: "حذف",
  admin_create_toast: "تم إنشاء المادة",
  admin_update_toast: "تم تحديث المادة",
  admin_delete_toast: "تم حذف المادة",

  // Admin questions manage
  admin_questions_select_subject: "اختر مادة",
  admin_new_question: "سؤال جديد",
  admin_question_text_label: "السؤال",
  admin_explanation_label: "الشرح (اختياري)",
  admin_difficulty_label: "مستوى الصعوبة",
  admin_options_title: "خيارات الإجابة",
  admin_add_option: "إضافة خيار",
  admin_create_question: "إنشاء السؤال",
  admin_question_created_toast: "تم إنشاء السؤال",
  admin_question_updated_toast: "تم تحديث السؤال",
  admin_question_deleted_toast: "تم حذف السؤال",
  admin_delete_question_confirm: "حذف هذا السؤال؟",
  admin_no_questions: "لا توجد أسئلة. استورد أو أنشئ سؤالاً أعلاه.",
  admin_edit_btn: "تعديل",
  admin_save_btn: "حفظ",
  admin_diff_easy: "سهل",
  admin_diff_medium: "متوسط",
  admin_diff_hard: "صعب",
  admin_diff_none: "بدون",

  // Admin import
  admin_import_heading: "استيراد الأسئلة",
  admin_import_step1: "١. اختر المادة",
  admin_import_step2: "٢. رفع الملف",
  admin_import_step3: "٣. معاينة واستيراد",
  admin_import_btn: "استيراد",
  admin_import_loading: "جاري الاستيراد…",
  admin_import_success_toast: "تم استيرادها",
  admin_import_fail_toast: "فشل الاستيراد",
  admin_upload_prompt: "انقر لرفع ملف CSV أو JSON",
  admin_upload_sub: ".csv أو .json — بترميز UTF-8",
  admin_sample_csv: "نموذج CSV",
  admin_sample_json: "نموذج JSON",
  admin_format_csv_title: "صيغة CSV",
  admin_format_json_title: "صيغة JSON",
  admin_csv_required: "مطلوب:",
  admin_csv_optional: "اختياري:",
  admin_json_desc: "مصفوفة من الكائنات مع",
  admin_json_options_desc: "مصفوفة الخيارات:",
  admin_warnings_one: "تحذير",
  admin_warnings_many: "تحذيرات",
  admin_no_subject_warning: "اختر أولاً مادة (الخطوة ١)",

  // Admin tabs
  admin_tab_manage: "إدارة",
  admin_tab_import: "استيراد",

  // Admin user detail
  admin_user_no_answers: "لم يجب هذا المستخدم على أي سؤال بعد.",
  admin_user_practice_by_subject: "التدريب حسب المادة",
  admin_user_recent_tests: "الاختبارات الأخيرة",
  admin_user_unknown: "غير معروف",

  // Common
  back: "رجوع",
  error_generic: "حدث خطأ ما",
}

export const translations: Record<Lang, Dict> = { fr, ar }

export function getLang(value: string | undefined): Lang {
  return value === "ar" ? "ar" : "fr"
}

export async function getServerT(): Promise<{ t: Dict; lang: Lang }> {
  const cookieStore = await cookies()
  const lang = getLang(cookieStore.get("qcm_lang")?.value)
  return { t: translations[lang], lang }
}
