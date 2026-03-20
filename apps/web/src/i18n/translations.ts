export type Language = 'en' | 'uk';

export type TranslationDictionary = {
  locale: string;
  brand: {
    title: string;
    tagline: string;
  };
  nav: {
    home: string;
    discover: string;
    createEvent: string;
    account: string;
    login: string;
  };
  header: {
    signIn: string;
    logout: string;
    language: string;
  };
  footer: {
    lead: string;
    caption: string;
  };
  common: {
    search: string;
    category: string;
    price: string;
    all: string;
    free: string;
    paid: string;
    previous: string;
    next: string;
    pageOf: (page: number, totalPages: number) => string;
    loadingSession: string;
    loadingEvents: string;
    eventDetails: string;
    communityHost: string;
    openHomepage: string;
    backToDiscover: string;
    createEvent: string;
    saveChanges: string;
    saving: string;
    cancel: string;
    joinEvent: string;
    joining: string;
    buyTicket: string;
    openingStripe: string;
    registered: string;
    paymentPending: string;
    organizer: string;
    spots: string;
    totalSpots: (count: number) => string;
    postComment: string;
    postReply: string;
    posting: string;
    reply: string;
    edit: string;
    delete: string;
    noComments: string;
    loading: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroText: string;
    primaryCta: string;
    secondaryCta: string;
    apiChecking: string;
    apiUnavailable: string;
    apiStatus: (service: string, status: string) => string;
    liveEvents: (count: number) => string;
    liveEventsText: string;
    buildFlowTitle: string;
    buildFlowText: string;
    bilingualTitle: string;
    bilingualText: string;
    sectionEyebrow: string;
    sectionTitle: string;
    sectionText: string;
    noEvents: string;
    challengeEyebrow: string;
    challengeTitle: string;
    challengeText: string;
    stackEyebrow: string;
    stackTitle: string;
    stackText: string;
    momentumEyebrow: string;
    momentumTitle: string;
    momentumText: string;
  };
  discover: {
    eyebrow: string;
    title: string;
    text: string;
    searchPlaceholder: string;
    signInRequired: string;
    resultsSummary: (shown: number, total: number) => string;
    noEvents: string;
    organizerFallback: string;
    openEventDetails: string;
    tryAgain: string;
  };
  create: {
    eyebrow: string;
    title: string;
    text: string;
    features: string[];
    demoAccount: string;
    signedInAs: (name: string, email: string) => string;
    signInNotice: string;
    signInCta: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    posterLabel: string;
    dateTimeLabel: string;
    priceLabel: string;
    capacityLabel: string;
    successMessage: string;
    failedMessage: string;
    createAction: string;
    openDiscover: string;
  };
  auth: {
    eyebrow: string;
    titleLogin: string;
    titleRegister: string;
    text: string;
    loginTab: string;
    registerTab: string;
    displayName: string;
    displayNamePlaceholder: string;
    email: string;
    password: string;
    passwordPlaceholder: string;
    signInAction: string;
    registerAction: string;
    authFailed: string;
    alreadySignedIn: string;
    loggedInAs: (name: string, email: string) => string;
    createEventCta: string;
  };
  eventDetails: {
    loading: string;
    openErrorTitle: string;
    openErrorFallback: string;
    ticketEyebrow: string;
    attendeesEyebrow: string;
    moreFromOrganizer: string;
    similarEvents: string;
    organizerSettingsEyebrow: string;
    organizerSettingsTitle: string;
    organizerSettingsText: string;
    hideNamesTitle: string;
    hideNamesOn: string;
    hideNamesOff: string;
    closeCommentsTitle: string;
    closeCommentsOn: string;
    closeCommentsOff: string;
    editEventOpen: string;
    editEventClose: string;
    editEventText: string;
    replacePoster: string;
    deleteEvent: string;
    deleteConfirm: string;
    eventUpdated: string;
    updateFailed: string;
    commentsEyebrow: string;
    commentsClosed: string;
    signInToDiscuss: string;
    replyingTo: (name: string) => string;
    editMode: string;
    commentPlaceholder: string;
    commentFailed: string;
    commentDeleteFailed: string;
    joinSuccess: string;
    joinFailed: string;
    buyFailed: string;
    registrationConfirmed: string;
    noAttendees: string;
    attendeeNamesHidden: string;
    noOrganizerEvents: string;
    noSimilarEvents: string;
    deleteFailed: string;
    hideNamesEnabled: string;
    hideNamesDisabled: string;
    commentsClosedEnabled: string;
    commentsClosedDisabled: string;
  };
  paymentSuccess: {
    eyebrow: string;
    title: string;
    loading: string;
    noSession: string;
    noToken: string;
    success: (eventTitle: string) => string;
    failure: string;
    session: (sessionId: string) => string;
    backToEvents: string;
  };
  paymentCancel: {
    eyebrow: string;
    title: string;
    text: string;
    tryAgain: string;
  };
  tickets: {
    eyebrow: string;
    title: string;
    text: string;
    loading: string;
    signInNotice: string;
    signInCta: string;
    emptyTitle: string;
    emptyText: string;
    openEvent: string;
    statusConfirmed: string;
    statusPending: string;
  };
  notFound: {
    eyebrow: string;
    title: string;
    text: string;
    backHome: string;
  };
};

export const categoryLabels: Record<Language, Record<string, string>> = {
  en: {
    Networking: 'Networking',
    Workshop: 'Workshop',
    Meetup: 'Meetup',
  },
  uk: {
    Networking: 'Нетворкінг',
    Workshop: 'Воркшоп',
    Meetup: 'Мітап',
  },
};

export function translateCategory(category: string, language: Language) {
  return categoryLabels[language][category] ?? category;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    locale: 'en-US',
    brand: {
      title: 'Uevent',
      tagline: 'Events that feel like your crowd',
    },
    nav: {
      home: 'Home',
      discover: 'Discover',
      createEvent: 'Create event',
      account: 'Account',
      login: 'Login',
    },
    header: {
      signIn: 'Sign in',
      logout: 'Logout',
      language: 'Language',
    },
    footer: {
      lead: 'Beautiful community discovery for modern campus and city scenes.',
      caption: 'React, NestJS, bilingual UI, live events, and a more polished visual system.',
    },
    common: {
      search: 'Search',
      category: 'Category',
      price: 'Price',
      all: 'All',
      free: 'Free',
      paid: 'Paid',
      previous: 'Previous',
      next: 'Next',
      pageOf: (page, totalPages) => `Page ${page} of ${totalPages}`,
      loadingSession: 'Loading session...',
      loadingEvents: 'Loading events...',
      eventDetails: 'Event details',
      communityHost: 'Community Host',
      openHomepage: 'Open homepage',
      backToDiscover: 'Back to discover',
      createEvent: 'Create event',
      saveChanges: 'Save changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      joinEvent: 'Join event',
      joining: 'Joining...',
      buyTicket: 'Buy ticket',
      openingStripe: 'Opening Stripe...',
      registered: 'Registered',
      paymentPending: 'Payment pending',
      organizer: 'Organizer',
      spots: 'spots',
      totalSpots: (count) => `${count} total spots`,
      postComment: 'Post comment',
      postReply: 'Post reply',
      posting: 'Posting...',
      reply: 'Reply',
      edit: 'Edit',
      delete: 'Delete',
      noComments: 'No comments yet.',
      loading: 'Loading...',
    },
    home: {
      heroBadge: 'Bilingual event platform',
      heroTitle: 'Find gatherings, creators, and communities that already match your energy.',
      heroText:
        'Uevent now feels like a polished cultural guide: soft editorial typography, vibrant cards, and a cleaner flow from discovery to registration.',
      primaryCta: 'Explore events',
      secondaryCta: 'Plan your event',
      apiChecking: 'Checking API...',
      apiUnavailable: 'API is unavailable',
      apiStatus: (service, status) => `${service} is ${status}`,
      liveEvents: (count) => `${count} curated live events`,
      liveEventsText: 'Fresh items come directly from the backend and stay ready for discover mode.',
      buildFlowTitle: 'Create in one flow',
      buildFlowText: 'From poster upload to pricing and capacity, the organizer path feels cleaner and more intentional.',
      bilingualTitle: 'Switch English or Ukrainian',
      bilingualText: 'The header now lets people change the language instantly without leaving the page.',
      sectionEyebrow: 'Live selection',
      sectionTitle: 'Featured events with a more editorial feel',
      sectionText: 'A warmer rhythm, better hierarchy, and more expressive surfaces across the catalogue.',
      noEvents: 'No events yet. Create the first one.',
      challengeEyebrow: 'Why it works',
      challengeTitle: 'People discover belonging faster',
      challengeText:
        'Better structure and visual contrast make it easier to scan, trust, and join the right event quickly.',
      stackEyebrow: 'Design system',
      stackTitle: 'One language across every page',
      stackText:
        'Home, discover, auth, details, and create-event now share the same mood, spacing, and card logic.',
      momentumEyebrow: 'Momentum',
      momentumTitle: 'Built to feel launch-ready',
      momentumText:
        'The UI now supports a nicer first impression without losing the practical MVP flow underneath.',
    },
    discover: {
      eyebrow: 'Discover',
      title: 'Browse the current event collection',
      text: 'Search the live catalogue, compare formats, and jump into free or paid registrations with a cleaner visual rhythm.',
      searchPlaceholder: 'Title, city, or description',
      signInRequired: 'Please sign in before joining or buying a ticket.',
      resultsSummary: (shown, total) => `Showing ${shown} of ${total} events`,
      noEvents: 'No events in the catalogue yet.',
      organizerFallback: 'Community Host',
      openEventDetails: 'Open event details',
      tryAgain: 'Try again',
    },
    create: {
      eyebrow: 'Organizer flow',
      title: 'Compose an event page that looks worth opening',
      text: 'This form still writes directly to the backend, but the experience now feels more premium and easier to scan.',
      features: [
        'Upload a poster and shape the tone of the event instantly.',
        'Set timing, category, price, and capacity in one compact flow.',
        'New events appear in discover mode with the refreshed visual system.',
        'The logged-in profile becomes the organizer automatically.',
      ],
      demoAccount: 'Demo account: demo@uevent.local / demo12345',
      signedInAs: (name, email) => `Signed in as ${name} (${email})`,
      signInNotice: 'Please sign in first. Event creation is protected by JWT auth.',
      signInCta: 'Go to login',
      titleLabel: 'Title',
      titlePlaceholder: 'Product Night for Curious Builders',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'What should people expect from this gathering?',
      categoryLabel: 'Category',
      categoryPlaceholder: 'Networking',
      cityLabel: 'City',
      cityPlaceholder: 'Kharkiv',
      posterLabel: 'Poster image',
      dateTimeLabel: 'Date and time',
      priceLabel: 'Ticket price',
      capacityLabel: 'Capacity',
      successMessage: 'Event saved successfully.',
      failedMessage: 'Failed to create the event',
      createAction: 'Create event',
      openDiscover: 'Open discover page',
    },
    auth: {
      eyebrow: 'Auth',
      titleLogin: 'Welcome back',
      titleRegister: 'Create your account',
      text: 'Use the demo profile or create a new account and start publishing events under your own identity.',
      loginTab: 'Login',
      registerTab: 'Register',
      displayName: 'Display name',
      displayNamePlaceholder: 'Community Builder',
      email: 'Email',
      password: 'Password',
      passwordPlaceholder: 'Minimum 8 characters',
      signInAction: 'Sign in',
      registerAction: 'Register',
      authFailed: 'Authentication failed',
      alreadySignedIn: 'You are already signed in.',
      loggedInAs: (name, email) => `Logged in as ${name} (${email}).`,
      createEventCta: 'Create an event',
    },
    eventDetails: {
      loading: 'Loading event details...',
      openErrorTitle: 'Unable to open this event.',
      openErrorFallback: 'The requested event could not be found.',
      ticketEyebrow: 'Ticket',
      attendeesEyebrow: 'Attendees',
      moreFromOrganizer: 'More from organizer',
      similarEvents: 'Similar events',
      organizerSettingsEyebrow: 'Event settings',
      organizerSettingsTitle: 'Manage your event',
      organizerSettingsText: 'Control visibility, discussion, and presentation from one place.',
      hideNamesTitle: 'Hide attendee names',
      hideNamesOn: 'Visitor list is anonymized for viewers.',
      hideNamesOff: 'Visitor names are currently visible.',
      closeCommentsTitle: 'Close comments',
      closeCommentsOn: 'New comments are currently blocked.',
      closeCommentsOff: 'Visitors can join the discussion.',
      editEventOpen: 'Edit event',
      editEventClose: 'Close editor',
      editEventText: 'Update poster, title, timing, ticket price, and capacity.',
      replacePoster: 'Replace poster',
      deleteEvent: 'Delete event',
      deleteConfirm: 'Delete this event? This will also remove registrations and comments.',
      eventUpdated: 'Event details updated.',
      updateFailed: 'Failed to update event',
      commentsEyebrow: 'Comments',
      commentsClosed: 'The organizer has closed comments for this event.',
      signInToDiscuss: 'Sign in to join the event discussion.',
      replyingTo: (name) => `Replying to @${name}`,
      editMode: 'Edit mode',
      commentPlaceholder: 'Share your thoughts about this event',
      commentFailed: 'Failed to add comment',
      commentDeleteFailed: 'Failed to delete comment',
      joinSuccess: 'You are registered for this event.',
      joinFailed: 'Failed to join event',
      buyFailed: 'Failed to start Stripe checkout',
      registrationConfirmed: 'You are already registered for this event.',
      noAttendees: 'No confirmed attendees yet.',
      attendeeNamesHidden: 'The organizer has hidden attendee names for this event.',
      noOrganizerEvents: 'No other published events from this organizer yet.',
      noSimilarEvents: 'No similar events found yet.',
      deleteFailed: 'Failed to delete event',
      hideNamesEnabled: 'Attendee names are now hidden.',
      hideNamesDisabled: 'Attendee names are visible again.',
      commentsClosedEnabled: 'Comments are now closed.',
      commentsClosedDisabled: 'Comments are open again.',
    },
    paymentSuccess: {
      eyebrow: 'Payment success',
      title: 'Checkout completed',
      loading: 'Confirming your event registration...',
      noSession: 'Stripe returned without a session id.',
      noToken: 'Please sign in again to confirm your ticket registration.',
      success: (eventTitle) => `Registration confirmed for ${eventTitle}.`,
      failure: 'Failed to confirm your payment session',
      session: (sessionId) => `Session: ${sessionId}`,
      backToEvents: 'Back to events',
    },
    paymentCancel: {
      eyebrow: 'Payment canceled',
      title: 'Checkout was canceled before payment.',
      text: 'You can return to the catalogue and restart checkout for any paid event.',
      tryAgain: 'Try again',
    },
    tickets: {
      eyebrow: 'My tickets',
      title: 'All your registrations in one place',
      text: 'Track confirmed tickets, pending payments, and jump back into any event page without digging through discover.',
      loading: 'Loading your tickets...',
      signInNotice: 'Please sign in to view your tickets.',
      signInCta: 'Go to login',
      emptyTitle: 'No tickets yet',
      emptyText: 'Register for a free event or buy a paid ticket to start building your personal event collection.',
      openEvent: 'Open event',
      statusConfirmed: 'Confirmed',
      statusPending: 'Payment pending',
    },
    notFound: {
      eyebrow: '404',
      title: 'That page is not here yet.',
      text: 'Use the main navigation to return to the available routes.',
      backHome: 'Back home',
    },
  },
  uk: {
    locale: 'uk-UA',
    brand: {
      title: 'Uevent',
      tagline: 'Події, у яких відчувається ваша спільнота',
    },
    nav: {
      home: 'Головна',
      discover: 'Події',
      createEvent: 'Створити',
      account: 'Профіль',
      login: 'Увійти',
    },
    header: {
      signIn: 'Увійти',
      logout: 'Вийти',
      language: 'Мова',
    },
    footer: {
      lead: 'Красивий пошук спільнот і подій для сучасних кампусів та міських сцен.',
      caption: 'React, NestJS, двомовний інтерфейс, живі події та значно сильніша візуальна система.',
    },
    common: {
      search: 'Пошук',
      category: 'Категорія',
      price: 'Ціна',
      all: 'Усі',
      free: 'Безкоштовно',
      paid: 'Платно',
      previous: 'Назад',
      next: 'Далі',
      pageOf: (page, totalPages) => `Сторінка ${page} з ${totalPages}`,
      loadingSession: 'Завантаження сесії...',
      loadingEvents: 'Завантаження подій...',
      eventDetails: 'Деталі події',
      communityHost: 'Організатор спільноти',
      openHomepage: 'На головну',
      backToDiscover: 'Назад до подій',
      createEvent: 'Створити подію',
      saveChanges: 'Зберегти зміни',
      saving: 'Збереження...',
      cancel: 'Скасувати',
      joinEvent: 'Приєднатися',
      joining: 'Приєднання...',
      buyTicket: 'Купити квиток',
      openingStripe: 'Відкриваємо Stripe...',
      registered: 'Зареєстровано',
      paymentPending: 'Оплата очікується',
      organizer: 'Організатор',
      spots: 'місць',
      totalSpots: (count) => `${count} місць загалом`,
      postComment: 'Опублікувати коментар',
      postReply: 'Опублікувати відповідь',
      posting: 'Публікація...',
      reply: 'Відповісти',
      edit: 'Редагувати',
      delete: 'Видалити',
      noComments: 'Коментарів поки немає.',
      loading: 'Завантаження...',
    },
    home: {
      heroBadge: 'Двомовна платформа подій',
      heroTitle: 'Знаходьте події, авторів і спільноти, які вже збігаються з вашим вайбом.',
      heroText:
        'Uevent тепер відчувається як акуратний культурний гід: редакційна типографіка, виразні картки та чистіший шлях від пошуку до реєстрації.',
      primaryCta: 'Дивитися події',
      secondaryCta: 'Створити свою подію',
      apiChecking: 'Перевірка API...',
      apiUnavailable: 'API недоступний',
      apiStatus: (service, status) => `${service} зараз ${status}`,
      liveEvents: (count) => `${count} актуальних подій`,
      liveEventsText: 'Контент приходить прямо з бекенда і готовий до реального режиму discovery.',
      buildFlowTitle: 'Створення в один потік',
      buildFlowText: 'Від постера до ціни та місткості, шлях організатора став чистішим і приємнішим.',
      bilingualTitle: 'Перемикайте англійську й українську',
      bilingualText: 'У хедері тепер можна миттєво змінити мову без перезавантаження сторінки.',
      sectionEyebrow: 'Жива добірка',
      sectionTitle: 'Головні події у більш редакційному стилі',
      sectionText: 'Тепліший ритм, краща ієрархія та виразніші поверхні по всьому каталогу.',
      noEvents: 'Подій поки немає. Створіть першу.',
      challengeEyebrow: 'Чому це працює',
      challengeTitle: 'Люди швидше знаходять відчуття приналежності',
      challengeText:
        'Краща структура і контраст допомагають швидко зрозуміти, довіритися сторінці та вибрати правильну подію.',
      stackEyebrow: 'Візуальна система',
      stackTitle: 'Одна мова дизайну на всіх сторінках',
      stackText:
        'Головна, каталог, auth, деталі події та створення тепер живуть в єдиному настрої, відступах і логіці карток.',
      momentumEyebrow: 'Враження',
      momentumTitle: 'Інтерфейс уже виглядає ближче до релізу',
      momentumText:
        'Сайт став сильнішим візуально, не втративши практичний MVP-потік під капотом.',
    },
    discover: {
      eyebrow: 'Події',
      title: 'Переглядайте актуальну колекцію подій',
      text: 'Шукайте по живому каталогу, порівнюйте формати та переходьте до безкоштовної або платної реєстрації в більш охайному інтерфейсі.',
      searchPlaceholder: 'Назва, місто або опис',
      signInRequired: 'Спочатку увійдіть, щоб приєднатися або купити квиток.',
      resultsSummary: (shown, total) => `Показано ${shown} з ${total} подій`,
      noEvents: 'У каталозі поки немає подій.',
      organizerFallback: 'Організатор спільноти',
      openEventDetails: 'Відкрити деталі події',
      tryAgain: 'Спробувати ще раз',
    },
    create: {
      eyebrow: 'Потік організатора',
      title: 'Створюйте сторінку події, яку справді хочеться відкрити',
      text: 'Форма й далі пише напряму в бекенд, але тепер весь процес виглядає дорожче й читається легше.',
      features: [
        'Додавайте постер і одразу задавайте настрій події.',
        'Налаштовуйте час, категорію, ціну та місткість в одному компактному сценарії.',
        'Нові події автоматично потрапляють у каталог з оновленим візуальним стилем.',
        'Залогінений профіль автоматично стає організатором.',
      ],
      demoAccount: 'Демо-акаунт: demo@uevent.local / demo12345',
      signedInAs: (name, email) => `Ви увійшли як ${name} (${email})`,
      signInNotice: 'Спочатку увійдіть. Створення подій захищене JWT-авторизацією.',
      signInCta: 'Перейти до входу',
      titleLabel: 'Назва',
      titlePlaceholder: 'Product Night for Curious Builders',
      descriptionLabel: 'Опис',
      descriptionPlaceholder: 'Що люди отримають від цієї події?',
      categoryLabel: 'Категорія',
      categoryPlaceholder: 'Нетворкінг',
      cityLabel: 'Місто',
      cityPlaceholder: 'Харків',
      posterLabel: 'Постер події',
      dateTimeLabel: 'Дата та час',
      priceLabel: 'Ціна квитка',
      capacityLabel: 'Місткість',
      successMessage: 'Подію успішно збережено.',
      failedMessage: 'Не вдалося створити подію',
      createAction: 'Створити подію',
      openDiscover: 'Відкрити каталог',
    },
    auth: {
      eyebrow: 'Авторизація',
      titleLogin: 'З поверненням',
      titleRegister: 'Створіть обліковий запис',
      text: 'Скористайтеся демо-профілем або створіть новий акаунт і публікуйте події від свого імені.',
      loginTab: 'Вхід',
      registerTab: 'Реєстрація',
      displayName: 'Ім’я профілю',
      displayNamePlaceholder: 'Community Builder',
      email: 'Email',
      password: 'Пароль',
      passwordPlaceholder: 'Мінімум 8 символів',
      signInAction: 'Увійти',
      registerAction: 'Зареєструватися',
      authFailed: 'Помилка авторизації',
      alreadySignedIn: 'Ви вже увійшли в систему.',
      loggedInAs: (name, email) => `Ви увійшли як ${name} (${email}).`,
      createEventCta: 'Створити подію',
    },
    eventDetails: {
      loading: 'Завантаження деталей події...',
      openErrorTitle: 'Не вдалося відкрити цю подію.',
      openErrorFallback: 'Потрібну подію не знайдено.',
      ticketEyebrow: 'Квиток',
      attendeesEyebrow: 'Учасники',
      moreFromOrganizer: 'Ще від організатора',
      similarEvents: 'Схожі події',
      organizerSettingsEyebrow: 'Налаштування події',
      organizerSettingsTitle: 'Керуйте своєю подією',
      organizerSettingsText: 'Контролюйте видимість, обговорення і подачу події в одному місці.',
      hideNamesTitle: 'Сховати імена учасників',
      hideNamesOn: 'Список відвідувачів анонімізовано для глядачів.',
      hideNamesOff: 'Імена відвідувачів зараз видимі.',
      closeCommentsTitle: 'Закрити коментарі',
      closeCommentsOn: 'Нові коментарі зараз заблоковані.',
      closeCommentsOff: 'Відвідувачі можуть брати участь в обговоренні.',
      editEventOpen: 'Редагувати подію',
      editEventClose: 'Закрити редактор',
      editEventText: 'Оновіть постер, назву, час, ціну квитка й місткість.',
      replacePoster: 'Замінити постер',
      deleteEvent: 'Видалити подію',
      deleteConfirm: 'Видалити цю подію? Разом з нею зникнуть реєстрації та коментарі.',
      eventUpdated: 'Дані події оновлено.',
      updateFailed: 'Не вдалося оновити подію',
      commentsEyebrow: 'Коментарі',
      commentsClosed: 'Організатор закрив коментарі для цієї події.',
      signInToDiscuss: 'Увійдіть, щоб долучитися до обговорення.',
      replyingTo: (name) => `Відповідь для @${name}`,
      editMode: 'Режим редагування',
      commentPlaceholder: 'Поділіться думками про цю подію',
      commentFailed: 'Не вдалося додати коментар',
      commentDeleteFailed: 'Не вдалося видалити коментар',
      joinSuccess: 'Ви зареєстровані на цю подію.',
      joinFailed: 'Не вдалося приєднатися до події',
      buyFailed: 'Не вдалося запустити Stripe checkout',
      registrationConfirmed: 'Ви вже зареєстровані на цю подію.',
      noAttendees: 'Підтверджених учасників поки немає.',
      attendeeNamesHidden: 'Організатор приховав імена учасників для цієї події.',
      noOrganizerEvents: 'Інших опублікованих подій цього організатора поки немає.',
      noSimilarEvents: 'Схожих подій поки не знайдено.',
      deleteFailed: 'Не вдалося видалити подію',
      hideNamesEnabled: 'Імена учасників тепер приховані.',
      hideNamesDisabled: 'Імена учасників знову видимі.',
      commentsClosedEnabled: 'Коментарі тепер закриті.',
      commentsClosedDisabled: 'Коментарі знову відкриті.',
    },
    paymentSuccess: {
      eyebrow: 'Успішна оплата',
      title: 'Checkout завершено',
      loading: 'Підтверджуємо вашу реєстрацію на подію...',
      noSession: 'Stripe повернувся без session id.',
      noToken: 'Увійдіть ще раз, щоб підтвердити реєстрацію на квиток.',
      success: (eventTitle) => `Реєстрацію на ${eventTitle} підтверджено.`,
      failure: 'Не вдалося підтвердити платіжну сесію',
      session: (sessionId) => `Сесія: ${sessionId}`,
      backToEvents: 'Назад до подій',
    },
    paymentCancel: {
      eyebrow: 'Оплату скасовано',
      title: 'Checkout було скасовано до оплати.',
      text: 'Поверніться до каталогу та запустіть оплату ще раз для будь-якої платної події.',
      tryAgain: 'Спробувати ще раз',
    },
    tickets: {
      eyebrow: 'My tickets',
      title: 'All your registrations in one place',
      text: 'Track confirmed tickets, pending payments, and jump back into any event page without digging through discover.',
      loading: 'Loading your tickets...',
      signInNotice: 'Please sign in to view your tickets.',
      signInCta: 'Go to login',
      emptyTitle: 'No tickets yet',
      emptyText: 'Register for a free event or buy a paid ticket to start building your personal event collection.',
      openEvent: 'Open event',
      statusConfirmed: 'Confirmed',
      statusPending: 'Payment pending',
    },
    notFound: {
      eyebrow: '404',
      title: 'Цієї сторінки тут поки немає.',
      text: 'Скористайтеся головною навігацією, щоб повернутися до доступних маршрутів.',
      backHome: 'На головну',
    },
  },
};
