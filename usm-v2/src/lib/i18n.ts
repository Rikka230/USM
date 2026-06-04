// i18n — repris fidèlement de l'objet `translations` de main.js (prod).
export const LOCALES = ["fr", "en", "es", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    nav_agency: "L'Agence", nav_services: "Services", nav_talents: "Les Talents", nav_press: "Presse", nav_button: "Contact",
    hero_subtitle: "Ensemble, développons vos talents.",
    stat_1_label: "Activité & Transactions", stat_1_desc: "Opérations réalisées sur le marché des transferts.",
    stat_4_label: "Réseau Mondial", stat_4_desc: "Contacts directs avec des clubs à travers le monde.",
    stat_2_label: "Confiance", stat_2_desc: "Joueurs accompagnés depuis 1998.",
    stat_3_label: "Impact Digital\n(N°3 Mondial)", stat_3_sub: "Abonnés cumulés",
    services_label: "Accompagnement Global", services_title: "Services Exclusifs",
    vip_badge: "Fondateur & CEO", agency_badge: "L'Agence USM",
    roster_title: "USM FAMILY", filter_all: "Tous", filter_gk: "Gardiens", filter_def: "Défenseurs",
    legal_mentions: "Mentions Légales",
    contact_title: "Contact", contact_subtitle: "Discutons de votre avenir.",
    contact_info_title: "Nos Coordonnées",
    contact_phone: "Téléphone", contact_email: "Email",
    contact_form_title: "Envoyer un message",
    contact_ph_first_name: "Votre prénom", contact_ph_name: "Votre nom", contact_ph_profession: "Votre profession", contact_ph_email: "Votre adresse email", contact_ph_phone: "Votre numéro de téléphone",
    contact_opt_player: "Je suis un joueur", contact_opt_club: "Je représente un club", contact_opt_coach: "Je suis coach", contact_opt_staff: "Je suis membre du staff", contact_opt_other: "Autre demande",
    contact_ph_msg: "Votre message...", contact_privacy_consent: "J’accepte que mes informations soient utilisées par USM Football pour répondre à ma demande.", contact_sms_consent: "J’accepte aussi que mon numéro de téléphone soit utilisé par USM Football pour me recontacter par téléphone ou SMS au sujet de ma demande.", contact_rgpd_note: "Vos données sont transmises à USM Football et enregistrées dans Brevo Contacts afin de traiter votre demande. Si vous cochez l’option téléphone/SMS, votre numéro pourra aussi être enregistré dans Brevo pour permettre un recontact lié à votre demande. Vos données ne sont pas vendues.", contact_btn_send: "Envoyer le message",
    back_services: "❮ Retour à l'accueil", other_services: "Naviguer",
  },
  en: {
    nav_agency: "The Agency", nav_services: "Services", nav_talents: "Talents", nav_press: "Press", nav_button: "Contact",
    hero_subtitle: "Together, let's develop your talents.",
    stat_1_label: "Activity & Transactions", stat_1_desc: "Transfer market operations completed.",
    stat_4_label: "Global Network", stat_4_desc: "Direct contacts with clubs worldwide.",
    stat_2_label: "Trust", stat_2_desc: "Players supported since 1998.",
    stat_3_label: "Digital Impact\n(#3 Worldwide)", stat_3_sub: "Total Followers",
    services_label: "Global Support", services_title: "Exclusive Services",
    vip_badge: "Founder & CEO", agency_badge: "The USM Agency",
    roster_title: "USM FAMILY", filter_all: "All", filter_gk: "Goalkeepers", filter_def: "Defenders",
    legal_mentions: "Legal Notice",
    contact_title: "Contact", contact_subtitle: "Let's discuss your future.",
    contact_info_title: "Our Details",
    contact_phone: "Phone", contact_email: "Email",
    contact_form_title: "Send a message",
    contact_ph_first_name: "Your first name", contact_ph_name: "Your last name", contact_ph_profession: "Your profession", contact_ph_email: "Your email address", contact_ph_phone: "Your phone number",
    contact_opt_player: "I am a player", contact_opt_club: "I represent a club", contact_opt_coach: "I am a coach", contact_opt_staff: "I am a staff member", contact_opt_other: "Other request",
    contact_ph_msg: "Your message...", contact_privacy_consent: "I agree that my information may be used by USM Football to respond to my request.", contact_sms_consent: "I also agree that my phone number may be used by USM Football to contact me by phone or SMS about my request.", contact_rgpd_note: "Your data is sent to USM Football and saved in Brevo Contacts to process your request. If you tick the phone/SMS option, your number may also be saved in Brevo to allow follow-up related to your request. Your data is not sold.", contact_btn_send: "Send message",
    back_services: "❮ Back to Home", other_services: "Navigate",
  },
  es: {
    nav_agency: "La Agencia", nav_services: "Servicios", nav_talents: "Los Talentos", nav_press: "Prensa", nav_button: "Contacto",
    hero_subtitle: "Juntos, desarrollemos tus talentos.",
    stat_1_label: "Actividad y Transacciones", stat_1_desc: "Operaciones realizadas en el mercado de fichajes.",
    stat_4_label: "Red Mundial", stat_4_desc: "Contactos directos con clubes de todo el mundo.",
    stat_2_label: "Confianza", stat_2_desc: "Jugadores acompañados desde 1998.",
    stat_3_label: "Impacto Digital\n(N°3 Mundial)", stat_3_sub: "Seguidores totales",
    services_label: "Acompañamiento Global", services_title: "Servicios Exclusivos",
    vip_badge: "Fundador y CEO", agency_badge: "La Agencia USM",
    roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Porteros", filter_def: "Defensas",
    legal_mentions: "Aviso Legal",
    contact_title: "Contacto", contact_subtitle: "Hablemos de tu futuro.",
    contact_info_title: "Nuestros Datos",
    contact_phone: "Teléfono", contact_email: "Email",
    contact_form_title: "Enviar un mensaje",
    contact_ph_first_name: "Tu nombre", contact_ph_name: "Tus apellidos", contact_ph_profession: "Tu profesión", contact_ph_email: "Tu correo electrónico", contact_ph_phone: "Tu número de teléfono",
    contact_opt_player: "Soy jugador", contact_opt_club: "Represento a un club", contact_opt_coach: "Soy entrenador", contact_opt_staff: "Soy miembro del staff", contact_opt_other: "Otra consulta",
    contact_ph_msg: "Tu mensaje...", contact_privacy_consent: "Acepto que USM Football utilice mi información para responder a mi solicitud.", contact_sms_consent: "También acepto que USM Football use mi número para contactarme por teléfono o SMS sobre mi solicitud.", contact_rgpd_note: "Tus datos se transmiten a USM Football y se guardan en Brevo Contacts para tratar tu solicitud. Si marcas la opción teléfono/SMS, tu número también podrá guardarse en Brevo para un seguimiento relacionado con tu solicitud. Tus datos no se venden.", contact_btn_send: "Enviar mensaje",
    back_services: "❮ Volver al inicio", other_services: "Navegar",
  },
  pt: {
    nav_agency: "A Agência", nav_services: "Serviços", nav_talents: "Os Talentos", nav_press: "Imprensa", nav_button: "Contato",
    hero_subtitle: "Juntos, vamos desenvolver seus talentos.",
    stat_1_label: "Atividade e Transações", stat_1_desc: "Operações realizadas no mercado de transferências.",
    stat_4_label: "Rede Global", stat_4_desc: "Contactos diretos com clubes em todo o mundo.",
    stat_2_label: "Confiança", stat_2_desc: "Jogadores acompanhados desde 1998.",
    stat_3_label: "Impacto Digital\n(N°3 Mundial)", stat_3_sub: "Seguidores totais",
    services_label: "Acompanhamento Global", services_title: "Serviços Exclusivos",
    vip_badge: "Fundador e CEO", agency_badge: "A Agência USM",
    roster_title: "USM FAMILY", filter_all: "Todos", filter_gk: "Goleiros", filter_def: "Defensores",
    legal_mentions: "Aviso Legal",
    contact_title: "Contato", contact_subtitle: "Vamos discutir o seu futuro.",
    contact_info_title: "Nossos Dados",
    contact_phone: "Telefone", contact_email: "Email",
    contact_form_title: "Enviar uma mensagem",
    contact_ph_first_name: "Seu primeiro nome", contact_ph_name: "Seu sobrenome", contact_ph_profession: "Sua profissão", contact_ph_email: "Seu endereço de email", contact_ph_phone: "Seu número de telefone",
    contact_opt_player: "Sou jogador", contact_opt_club: "Represento um clube", contact_opt_coach: "Sou treinador", contact_opt_staff: "Sou membro da equipa", contact_opt_other: "Outro pedido",
    contact_ph_msg: "Sua mensagem...", contact_privacy_consent: "Aceito que as minhas informações sejam usadas pela USM Football para responder ao meu pedido.", contact_sms_consent: "Também aceito que a USM Football use o meu número para me contactar por telefone ou SMS sobre o meu pedido.", contact_rgpd_note: "Os seus dados são transmitidos à USM Football e guardados no Brevo Contacts para tratar o seu pedido. Se marcar a opção telefone/SMS, o seu número também poderá ser guardado no Brevo para permitir um acompanhamento relacionado com o seu pedido. Os seus dados não são vendidos.", contact_btn_send: "Enviar mensagem",
    back_services: "❮ Voltar ao Início", other_services: "Navegar",
  },
};

/** Traduit une clé d'interface dans la langue donnée (fallback FR). */
export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

/** Récupère un champ multilingue Firestore (ex. base="title" -> title_fr) avec fallback FR. */
export function localizedField<T extends Record<string, any>>(obj: T, base: string, locale: Locale): string {
  return (obj?.[`${base}_${locale}`] as string) || (obj?.[`${base}_fr`] as string) || "";
}

/** Préfixe d'URL pour une langue ("" pour FR par défaut, "/en" sinon). */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}
