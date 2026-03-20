import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateFormat, translateTheme } from '../i18n/translations';
import {
  ApiRegistration,
  EventDetailsResponse,
  createEventComment,
  createCheckoutSession,
  createRegistration,
  deleteEvent,
  deleteEventComment,
  fetchEventById,
  fetchMyRegistrations,
  formatEventDate,
  formatPrice,
  getEventPosterUrl,
  updateEvent,
  updateRegistrationReminder,
  updateEventComment,
} from '../lib/api';

export function EventDetailsPage() {
  const { eventId = '' } = useParams();
  const { token, isReady, user } = useAuth();
  const { copy, locale, translateCategory } = useLanguage();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailsResponse | null>(null);
  const [registration, setRegistration] = useState<ApiRegistration | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [actionState, setActionState] = useState<'idle' | 'joining' | 'paying'>('idle');
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState<'idle' | 'saving'>('idle');
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving'>('idle');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentMode, setCommentMode] = useState<'create' | 'reply' | 'edit'>('create');
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'saving'>('idle');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    format: 'Meetup',
    theme: 'Community',
    attendeeVisibility: 'everyone' as 'everyone' | 'registered_only' | 'nobody',
    notifyOnNewAttendee: true,
    commentAccess: 'everyone' as 'everyone' | 'registered_only' | 'closed',
    city: '',
    startsAt: '',
    publishAt: '',
    price: '0',
    capacity: '50',
  });
  const structureCopy =
    locale === 'uk-UA'
      ? { format: 'Формат', theme: 'Тема' }
      : { format: 'Format', theme: 'Theme' };
  const attendeeCopy =
    locale === 'uk-UA'
      ? {
          label: 'Хто бачить учасників',
          everyone: 'Усі',
          registeredOnly: 'Тільки зареєстровані',
          nobody: 'Ніхто',
          hidden: 'Список учасників прихований для вас.',
        }
      : {
          label: 'Who can see attendees',
          everyone: 'Everyone',
          registeredOnly: 'Registered users only',
          nobody: 'Nobody',
          hidden: 'The attendee list is hidden for you.',
        };
  const publicationCopy =
    locale === 'uk-UA'
      ? {
          startsAtLabel: 'Дата і час проведення',
          label: 'Дата викладення',
          helper: 'Залиште порожнім, якщо подію треба показувати одразу.',
          banner: (value: string) =>
            `Публікацію заплановано на ${formatEventDate(value, locale)}. Поки що цю сторінку бачите лише ви.`,
          ticketNotice: 'До дати викладення реєстрація та купівля квитків недоступні.',
        }
      : {
          startsAtLabel: 'Event date and time',
          label: 'Publish date',
          helper: 'Leave empty if the event should be visible immediately.',
          banner: (value: string) =>
            `Publication is scheduled for ${formatEventDate(value, locale)}. For now, only you can see this page.`,
          ticketNotice: 'Registrations and ticket purchases stay unavailable until publication.',
        };
  const eventSettingsCopy =
    locale === 'uk-UA'
      ? {
          notifyOnNewAttendee: 'Сповіщати про нових відвідувачів',
          notifyStateOn: 'Увімкнено',
          notifyStateOff: 'Вимкнено',
          commentAccess: 'Коментарі',
          commentsEveryone: 'Відкриті для всіх авторизованих',
          commentsRegisteredOnly: 'Тільки для зареєстрованих',
          commentsClosed: 'Закриті',
          commentsNeedRegistration: 'Коментувати можуть лише зареєстровані учасники.',
          commentsNeedSignIn: 'Увійдіть, щоб залишити коментар.',
          reminderTitle: 'Нагадування',
          reminderHint: 'Оберіть, коли нагадати вам про цю подію.',
          reminderSaved: 'Нагадування збережено.',
          reminderButton: 'Зберегти нагадування',
          reminderDisabled: 'Нагадування стане доступним після реєстрації або покупки квитка.',
        }
      : {
          notifyOnNewAttendee: 'Notify about new attendees',
          notifyStateOn: 'Enabled',
          notifyStateOff: 'Disabled',
          commentAccess: 'Comments',
          commentsEveryone: 'Open for signed-in users',
          commentsRegisteredOnly: 'Registered attendees only',
          commentsClosed: 'Closed',
          commentsNeedRegistration: 'Only registered attendees can comment here.',
          commentsNeedSignIn: 'Sign in to leave a comment.',
          reminderTitle: 'Reminder',
          reminderHint: 'Choose when you want to be reminded about this event.',
          reminderSaved: 'Reminder saved.',
          reminderButton: 'Save reminder',
          reminderDisabled: 'Reminders become available after registration or ticket purchase.',
        };
  const booleanCopy =
    locale === 'uk-UA'
      ? { yes: 'Так', no: 'Ні' }
      : { yes: 'Yes', no: 'No' };
  const reminderTooLateMessage =
    locale === 'uk-UA'
      ? 'Час нагадування має бути раніше за початок події.'
      : 'Reminder time must be earlier than the event start.';

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      setStatus('loading');
      setMessage('');

      try {
        const payload = await fetchEventById(eventId, token);

        if (!active) {
          return;
        }

        setEvent(payload);
        setEditForm({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          format: payload.format,
          theme: payload.theme,
          attendeeVisibility: payload.attendeeVisibility,
          notifyOnNewAttendee: payload.notifyOnNewAttendee,
          commentAccess: payload.commentAccess,
          city: payload.city,
          startsAt: new Date(payload.startsAt).toISOString().slice(0, 16),
          publishAt: payload.publishAt
            ? new Date(payload.publishAt).toISOString().slice(0, 16)
            : '',
          price: String(payload.price),
          capacity: String(payload.capacity),
        });
        setPosterPreview(payload.posterUrl ? getEventPosterUrl(payload) : '');
        setStatus('success');
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus('error');
        setMessage(error instanceof Error ? error.message : copy.eventDetails.openErrorFallback);
      }
    }

    void loadEvent();

    return () => {
      active = false;
    };
  }, [eventId, token]);

  useEffect(() => {
    setReminderAt(
      registration?.reminderAt
        ? new Date(registration.reminderAt).toISOString().slice(0, 16)
        : '',
    );
  }, [registration?.reminderAt]);

  useEffect(() => {
    let active = true;

    async function loadRegistration() {
      if (!token) {
        setRegistration(null);
        return;
      }

      try {
        const payload = await fetchMyRegistrations(token);

        if (!active) {
          return;
        }

        setRegistration(payload.find((item) => item.eventId === eventId) ?? null);
      } catch {
        if (active) {
          setRegistration(null);
        }
      }
    }

    void loadRegistration();

    return () => {
      active = false;
    };
  }, [eventId, token]);

  function requireAuth() {
    if (token) {
      return true;
    }

    navigate('/auth');
    return false;
  }

  const isOrganizer = Boolean(user?.id && event?.organizer?.id === user.id);

  async function handleFreeJoin() {
    if (!requireAuth() || !token || !event) {
      return;
    }

    setActionState('joining');
    setMessage('');
    setCommentMessage('');

    try {
      const createdRegistration = await createRegistration(event.id, token);
      setRegistration(createdRegistration);
      setMessage(copy.eventDetails.joinSuccess);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.joinFailed);
    } finally {
      setActionState('idle');
    }
  }

  async function handleCheckout() {
    if (!requireAuth() || !token || !event) {
      return;
    }

    setActionState('paying');
    setMessage('');
    setCommentMessage('');

    try {
      const session = await createCheckoutSession(
        { eventId: event.id, quantity: 1 },
        token,
      );

      if (!session.url) {
        throw new Error(copy.eventDetails.buyFailed);
      }

      window.location.assign(session.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : copy.eventDetails.buyFailed,
      );
      setActionState('idle');
    }
  }

  async function handleCommentSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    if (!requireAuth() || !token || !event) {
      return;
    }

    setCommentStatus('saving');
    setCommentMessage('');

    try {
      if (commentMode === 'edit' && targetCommentId) {
        const updatedComment = await updateEventComment(
          event.id,
          targetCommentId,
          { content: comment },
          token,
        );

        setEvent((current) =>
          current
            ? {
                ...current,
                comments: current.comments.map((item) =>
                  item.id === updatedComment.id ? updatedComment : item,
                ),
              }
            : current,
        );
      } else {
        const savedComment = await createEventComment(
          event.id,
          {
            content: comment,
            ...(commentMode === 'reply' && targetCommentId
              ? { parentCommentId: targetCommentId }
              : {}),
          },
          token,
        );

        setEvent((current) =>
          current
            ? {
                ...current,
                comments: [savedComment, ...current.comments],
              }
            : current,
        );
      }

      setComment('');
      setCommentMode('create');
      setTargetCommentId(null);
      setReplyTargetName(null);
      setActiveCommentId(null);
    } catch (error) {
      setCommentMessage(
        error instanceof Error ? error.message : copy.eventDetails.commentFailed,
      );
    } finally {
      setCommentStatus('idle');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!requireAuth() || !token || !event) {
      return;
    }

    try {
      await deleteEventComment(event.id, commentId, token);
      setEvent((current) =>
        current
          ? {
              ...current,
              comments: current.comments.filter(
                (item) => item.id !== commentId && item.parentCommentId !== commentId,
              ),
            }
          : current,
      );
      setActiveCommentId(null);
      if (targetCommentId === commentId) {
        setComment('');
        setCommentMode('create');
        setTargetCommentId(null);
        setReplyTargetName(null);
      }
    } catch (error) {
      setCommentMessage(
        error instanceof Error ? error.message : copy.eventDetails.commentDeleteFailed,
      );
    }
  }

  function startReply(commentId: string, authorName: string) {
    setCommentMode('reply');
    setTargetCommentId(commentId);
    setReplyTargetName(authorName);
    setActiveCommentId(null);
    setComment('');
  }

  function startEdit(commentId: string, content: string) {
    setCommentMode('edit');
    setTargetCommentId(commentId);
    setReplyTargetName(null);
    setActiveCommentId(null);
    setComment(content);
  }

  function cancelCommentAction() {
    setCommentMode('create');
    setTargetCommentId(null);
    setReplyTargetName(null);
    setComment('');
    setActiveCommentId(null);
  }

  async function handleOrganizerSetting(
    field: 'notifyOnNewAttendee',
    value: boolean,
  ) {
    if (!token || !event) {
      return;
    }

    setSettingsStatus('saving');
    setMessage('');

    try {
      await updateEvent(event.id, { [field]: value }, token);
      const refreshedEvent = await fetchEventById(event.id, token);
      setEvent(refreshedEvent);
      setMessage(copy.eventDetails.eventUpdated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.updateFailed);
    } finally {
      setSettingsStatus('idle');
    }
  }

  async function handleReminderSave() {
    if (!token || !event || !registration || registration.status !== 'confirmed') {
      return;
    }

    if (reminderAt && new Date(reminderAt).getTime() >= new Date(event.startsAt).getTime()) {
      setMessage(reminderTooLateMessage);
      return;
    }

    setReminderStatus('saving');
    setMessage('');

    try {
      const updatedRegistration = await updateRegistrationReminder(
        event.id,
        reminderAt ? new Date(reminderAt).toISOString() : null,
        token,
      );
      setRegistration(updatedRegistration);
      setMessage(eventSettingsCopy.reminderSaved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.updateFailed);
    } finally {
      setReminderStatus('idle');
    }
  }

  async function handleEventUpdate(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    if (!token || !event) {
      return;
    }

    setSettingsStatus('saving');
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('title', editForm.title);
      payload.append('description', editForm.description);
      payload.append('category', editForm.category);
      payload.append('format', editForm.format);
      payload.append('theme', editForm.theme);
      payload.append('attendeeVisibility', editForm.attendeeVisibility);
      payload.append('notifyOnNewAttendee', String(editForm.notifyOnNewAttendee));
      payload.append('commentAccess', editForm.commentAccess);
      payload.append('city', editForm.city);
      payload.append('startsAt', new Date(editForm.startsAt).toISOString());
      payload.append(
        'publishAt',
        editForm.publishAt ? new Date(editForm.publishAt).toISOString() : '',
      );
      payload.append('price', editForm.price);
      payload.append('capacity', editForm.capacity);

      if (selectedPoster) {
        payload.append('poster', selectedPoster);
      }

      const updatedEvent = await updateEvent(event.id, payload, token);
      setEvent((current) => (current ? { ...current, ...updatedEvent } : current));
      setPosterPreview(getEventPosterUrl(updatedEvent));
      setSelectedPoster(null);
      setIsEditMode(false);
      setMessage(copy.eventDetails.eventUpdated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.updateFailed);
    } finally {
      setSettingsStatus('idle');
    }
  }

  async function handleDeleteEvent() {
    if (!token || !event) {
      return;
    }

    const isConfirmed = window.confirm(
      copy.eventDetails.deleteConfirm,
    );

    if (!isConfirmed) {
      return;
    }

    setSettingsStatus('saving');
    setMessage('');

    try {
      await deleteEvent(event.id, token);
      navigate('/discover');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.deleteFailed);
      setSettingsStatus('idle');
    }
  }

  const comments = event?.comments ?? [];
  const topLevelComments = comments.filter((item) => !item.parentCommentId);
  const commentLookup = new Map(comments.map((item) => [item.id, item]));

  function getThreadReplies(commentId: string) {
    const orderedReplies: typeof comments = [];

    function appendReplies(parentId: string) {
      const directReplies = comments.filter((item) => item.parentCommentId === parentId);

      directReplies.forEach((reply) => {
        orderedReplies.push(reply);
        appendReplies(reply.id);
      });
    }

    appendReplies(commentId);
    return orderedReplies;
  }

  function getReplyTargetName(commentId: string) {
    const parentComment = commentLookup.get(commentId);
    return parentComment?.author.displayName ?? copy.common.communityHost;
  }

  if (status === 'loading') {
    return <p className="notice">{copy.eventDetails.loading}</p>;
  }

  if (status === 'error' || !event) {
    return (
      <section className="empty-state">
        <span className="eyebrow">{copy.common.eventDetails}</span>
        <h1>{copy.eventDetails.openErrorTitle}</h1>
        <p>{message || copy.eventDetails.openErrorFallback}</p>
        <Link to="/discover" className="primary-button">
          {copy.common.backToDiscover}
        </Link>
      </section>
    );
  }

  return (
    <section className="details-shell">
      <div className="details-main">
        <article className="details-card">
          <img
            src={getEventPosterUrl(event)}
            alt={`${event.title} poster`}
            className="event-poster-large"
          />
          {!event.isPublished && event.publishAt ? (
            <p className="notice warning">{publicationCopy.banner(event.publishAt)}</p>
          ) : null}
          <span className="pill">{translateCategory(event.category)}</span>
          <h1>{event.title}</h1>
          <p className="muted">
            {event.city} / {formatEventDate(event.startsAt, locale)}
          </p>
          <p>{event.description}</p>
        </article>

        {isOrganizer ? (
          <article className="form-card organizer-settings-card">
            <div className="settings-header">
              <div>
                <span className="eyebrow">{copy.eventDetails.organizerSettingsEyebrow}</span>
                <h2>{copy.eventDetails.organizerSettingsTitle}</h2>
                <p className="muted">{copy.eventDetails.organizerSettingsText}</p>
              </div>
            </div>

            <div className="settings-toggle-grid">
              <button
                type="button"
                className={`settings-tile ${event.notifyOnNewAttendee ? 'active' : ''}`}
                disabled={settingsStatus === 'saving'}
                onClick={() =>
                  void handleOrganizerSetting(
                    'notifyOnNewAttendee',
                    !event.notifyOnNewAttendee,
                  )
                }
              >
                <strong>{eventSettingsCopy.notifyOnNewAttendee}</strong>
                <span className="muted">
                  {event.notifyOnNewAttendee
                    ? eventSettingsCopy.notifyStateOn
                    : eventSettingsCopy.notifyStateOff}
                </span>
              </button>

              <button
                type="button"
                className={`settings-tile ${isEditMode ? 'active' : ''}`}
                disabled={settingsStatus === 'saving'}
                onClick={() => setIsEditMode((current) => !current)}
              >
                <strong>
                  {isEditMode
                    ? copy.eventDetails.editEventClose
                    : copy.eventDetails.editEventOpen}
                </strong>
                <span className="muted">{copy.eventDetails.editEventText}</span>
              </button>
            </div>

            {isEditMode ? (
              <form className="settings-editor" onSubmit={handleEventUpdate}>
                <div className="event-structure-grid">
                  <label className="field">
                    <span>{copy.create.titleLabel}</span>
                    <input
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>{copy.create.categoryLabel}</span>
                    <input
                      value={editForm.category}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>{structureCopy.format}</span>
                    <select
                      value={editForm.format}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          format: event.target.value,
                        }))
                      }
                      required
                    >
                      <option value="Meetup">{translateFormat('Meetup', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Workshop">{translateFormat('Workshop', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Conference">{translateFormat('Conference', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Lecture">{translateFormat('Lecture', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{structureCopy.theme}</span>
                    <select
                      value={editForm.theme}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          theme: event.target.value,
                        }))
                      }
                      required
                    >
                      <option value="Community">{translateTheme('Community', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Technology">{translateTheme('Technology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Startups">{translateTheme('Startups', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Design">{translateTheme('Design', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Business">{translateTheme('Business', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Education">{translateTheme('Education', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Art">{translateTheme('Art', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Psychology">{translateTheme('Psychology', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                      <option value="Sports">{translateTheme('Sports', locale === 'uk-UA' ? 'uk' : 'en')}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{attendeeCopy.label}</span>
                    <select
                      value={editForm.attendeeVisibility}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          attendeeVisibility: event.target.value as
                            | 'everyone'
                            | 'registered_only'
                            | 'nobody',
                        }))
                      }
                    >
                      <option value="everyone">{attendeeCopy.everyone}</option>
                      <option value="registered_only">{attendeeCopy.registeredOnly}</option>
                      <option value="nobody">{attendeeCopy.nobody}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{eventSettingsCopy.notifyOnNewAttendee}</span>
                    <select
                      value={editForm.notifyOnNewAttendee ? 'yes' : 'no'}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          notifyOnNewAttendee: event.target.value === 'yes',
                        }))
                      }
                    >
                      <option value="yes">{booleanCopy.yes}</option>
                      <option value="no">{booleanCopy.no}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{eventSettingsCopy.commentAccess}</span>
                    <select
                      value={editForm.commentAccess}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          commentAccess: event.target.value as
                            | 'everyone'
                            | 'registered_only'
                            | 'closed',
                        }))
                      }
                    >
                      <option value="everyone">{eventSettingsCopy.commentsEveryone}</option>
                      <option value="registered_only">
                        {eventSettingsCopy.commentsRegisteredOnly}
                      </option>
                      <option value="closed">{eventSettingsCopy.commentsClosed}</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>{copy.create.descriptionLabel}</span>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <div className="event-timing-grid">
                  <label className="field">
                    <span>{copy.create.cityLabel}</span>
                    <input
                      value={editForm.city}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>{publicationCopy.startsAtLabel}</span>
                    <input
                      type="datetime-local"
                      value={editForm.startsAt}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          startsAt: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>{publicationCopy.label}</span>
                    <input
                      type="datetime-local"
                      value={editForm.publishAt}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          publishAt: event.target.value,
                        }))
                      }
                    />
                    <small className="field-hint">{publicationCopy.helper}</small>
                  </label>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>{copy.create.priceLabel}</span>
                    <input
                      type="number"
                      min="0"
                      value={editForm.price}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>{copy.create.capacityLabel}</span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.capacity}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          capacity: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <label className="field">
                  <span>{copy.eventDetails.replacePoster}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;

                      setSelectedPoster(nextFile);
                      if (nextFile) {
                        setPosterPreview(URL.createObjectURL(nextFile));
                      }
                    }}
                  />
                </label>

                {posterPreview ? (
                  <img
                    src={posterPreview}
                    alt="Updated poster preview"
                    className="event-poster-large settings-poster-preview"
                  />
                ) : null}

                <div className="form-actions settings-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={settingsStatus === 'saving'}
                  >
                    {settingsStatus === 'saving' ? copy.common.saving : copy.common.saveChanges}
                  </button>
                  <button
                    type="button"
                    className="secondary-button danger-outline"
                    disabled={settingsStatus === 'saving'}
                    onClick={() => void handleDeleteEvent()}
                  >
                    {copy.eventDetails.deleteEvent}
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ) : null}

        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.commentsEyebrow}</span>
          {event.commentAccess === 'closed' ? (
            <p className="notice">{eventSettingsCopy.commentsClosed}</p>
          ) : token &&
            (event.commentAccess === 'everyone' ||
              isOrganizer ||
              registration?.status === 'confirmed') ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              {commentMode !== 'create' ? (
                <div className="comment-mode-row">
                  <span className="pill">
                    {commentMode === 'reply'
                      ? copy.eventDetails.replyingTo(replyTargetName ?? copy.common.communityHost)
                      : copy.eventDetails.editMode}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={cancelCommentAction}
                  >
                    {copy.common.cancel}
                  </button>
                </div>
              ) : null}
              <textarea
                rows={4}
                placeholder={copy.eventDetails.commentPlaceholder}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required
              />
              <button
                type="submit"
                className="primary-button"
                disabled={commentStatus === 'saving'}
              >
                {commentStatus === 'saving'
                  ? copy.common.posting
                  : commentMode === 'edit'
                    ? copy.common.saveChanges
                    : commentMode === 'reply'
                      ? copy.common.postReply
                      : copy.common.postComment}
              </button>
            </form>
          ) : (
            <p className="muted">
              {token
                ? eventSettingsCopy.commentsNeedRegistration
                : eventSettingsCopy.commentsNeedSignIn}
            </p>
          )}

          {commentMessage ? <p className="notice error">{commentMessage}</p> : null}

          {event.comments.length === 0 ? (
            <p className="muted">{copy.common.noComments}</p>
          ) : (
            <div className="related-list">
              {topLevelComments.map((item) => (
                <div key={item.id} className="related-thread">
                  <div
                    className="related-card comment-card"
                    onClick={() =>
                      setActiveCommentId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                  >
                    <strong>{item.author.displayName}</strong>
                    <span className="muted">{formatEventDate(item.createdAt, locale)}</span>
                    <span>{item.content}</span>
                    {activeCommentId === item.id ? (
                      <div className="comment-actions">
                        <button
                          type="button"
                          className="action-chip"
                          onClick={(event) => {
                            event.stopPropagation();
                            startReply(item.id, item.author.displayName);
                          }}
                        >
                          {copy.common.reply}
                        </button>
                        {user?.id === item.author.id ? (
                          <>
                            <button
                              type="button"
                              className="action-chip"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEdit(item.id, item.content);
                              }}
                            >
                              {copy.common.edit}
                            </button>
                            <button
                              type="button"
                              className="action-chip danger-chip"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteComment(item.id);
                              }}
                            >
                              {copy.common.delete}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {getThreadReplies(item.id).map((reply) => (
                    <div
                      key={reply.id}
                      className="related-card comment-card reply-card"
                      onClick={() =>
                        setActiveCommentId((current) =>
                          current === reply.id ? null : reply.id,
                        )
                      }
                    >
                      <strong>{reply.author.displayName}</strong>
                      <span className="muted">{formatEventDate(reply.createdAt, locale)}</span>
                      {reply.parentCommentId ? (
                        <span className="reply-target">
                          {copy.common.reply} @{getReplyTargetName(reply.parentCommentId)}
                        </span>
                      ) : null}
                      <span>{reply.content}</span>
                      {activeCommentId === reply.id ? (
                        <div className="comment-actions">
                          <button
                            type="button"
                            className="action-chip"
                            onClick={(event) => {
                              event.stopPropagation();
                              startReply(reply.id, reply.author.displayName);
                            }}
                          >
                            {copy.common.reply}
                          </button>
                          {user?.id === reply.author.id ? (
                            <>
                              <button
                                type="button"
                                className="action-chip"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startEdit(reply.id, reply.content);
                                }}
                              >
                                {copy.common.edit}
                              </button>
                              <button
                                type="button"
                                className="action-chip danger-chip"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDeleteComment(reply.id);
                                }}
                              >
                                {copy.common.delete}
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <aside className="details-sidebar">
        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.ticketEyebrow}</span>
          <strong>{formatPrice(event.price, locale, copy.common.free)}</strong>
          <p className="muted">{copy.common.totalSpots(event.capacity)}</p>
          <p className="muted">
            {copy.common.organizer}: {event.organizer?.displayName ?? copy.common.communityHost}
          </p>

          {registration?.status === 'confirmed' ? (
            <>
              <p className="notice success">{copy.eventDetails.registrationConfirmed}</p>
              <label className="field">
                <span>{eventSettingsCopy.reminderTitle}</span>
                <input
                  type="datetime-local"
                  value={reminderAt}
                  max={new Date(event.startsAt).toISOString().slice(0, 16)}
                  onChange={(event) => setReminderAt(event.target.value)}
                />
                <small className="field-hint">{eventSettingsCopy.reminderHint}</small>
              </label>
              <button
                type="button"
                className="secondary-button"
                disabled={reminderStatus === 'saving'}
                onClick={() => void handleReminderSave()}
              >
                {reminderStatus === 'saving'
                  ? copy.common.saving
                  : eventSettingsCopy.reminderButton}
              </button>
            </>
          ) : !event.isPublished ? (
            <p className="notice warning">{publicationCopy.ticketNotice}</p>
          ) : registration?.status === 'pending_payment' ? (
            <p className="notice">{copy.common.paymentPending}</p>
          ) : event.price > 0 ? (
            <button
              type="button"
              className="primary-button"
              disabled={!isReady || actionState === 'paying'}
              onClick={() => void handleCheckout()}
            >
              {actionState === 'paying' ? copy.common.openingStripe : copy.common.buyTicket}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={!isReady || actionState === 'joining'}
              onClick={() => void handleFreeJoin()}
            >
              {actionState === 'joining' ? copy.common.joining : copy.common.joinEvent}
            </button>
          )}

          {!registration ? (
            <p className="muted">{eventSettingsCopy.reminderDisabled}</p>
          ) : null}

          {message ? <p className="notice">{message}</p> : null}
          <Link to="/discover" className="secondary-button">
            {copy.common.backToDiscover}
          </Link>
        </article>

        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.attendeesEyebrow}</span>
          {!event.canViewAttendees ? (
            <p className="muted">{attendeeCopy.hidden}</p>
          ) : event.attendees.length === 0 ? (
            <p className="muted">{copy.eventDetails.noAttendees}</p>
          ) : (
            <div className="related-list">
              {event.hideAttendeeNames ? (
                <p className="muted">{copy.eventDetails.attendeeNamesHidden}</p>
              ) : null}
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="related-card">
                  <strong>{attendee.displayName}</strong>
                  <span className="muted">
                    {formatEventDate(attendee.joinedAt, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.moreFromOrganizer}</span>
          {event.organizerEvents.length === 0 ? (
            <p className="muted">{copy.eventDetails.noOrganizerEvents}</p>
          ) : (
            <div className="related-list">
              {event.organizerEvents.map((item) => (
                <Link key={item.id} to={`/events/${item.id}`} className="related-card">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {item.city} / {formatEventDate(item.startsAt, locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.similarEvents}</span>
          {event.similarEvents.length === 0 ? (
            <p className="muted">{copy.eventDetails.noSimilarEvents}</p>
          ) : (
            <div className="related-list">
              {event.similarEvents.map((item) => (
                <Link key={item.id} to={`/events/${item.id}`} className="related-card">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {translateCategory(item.category)} /{' '}
                    {formatPrice(item.price, locale, copy.common.free)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </aside>
    </section>
  );
}
