import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
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
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    startsAt: '',
    price: '0',
    capacity: '50',
  });

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      setStatus('loading');
      setMessage('');

      try {
        const payload = await fetchEventById(eventId);

        if (!active) {
          return;
        }

        setEvent(payload);
        setEditForm({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          city: payload.city,
          startsAt: new Date(payload.startsAt).toISOString().slice(0, 16),
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
  }, [eventId]);

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
    field: 'hideAttendeeNames' | 'commentsClosed',
    value: boolean,
  ) {
    if (!token || !event) {
      return;
    }

    setSettingsStatus('saving');
    setMessage('');

    try {
      await updateEvent(event.id, { [field]: value }, token);
      const refreshedEvent = await fetchEventById(event.id);
      setEvent(refreshedEvent);
      setMessage(
        field === 'hideAttendeeNames'
          ? value
            ? copy.eventDetails.hideNamesEnabled
            : copy.eventDetails.hideNamesDisabled
          : value
            ? copy.eventDetails.commentsClosedEnabled
            : copy.eventDetails.commentsClosedDisabled,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.eventDetails.updateFailed);
    } finally {
      setSettingsStatus('idle');
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
      payload.append('city', editForm.city);
      payload.append('startsAt', new Date(editForm.startsAt).toISOString());
      payload.append('price', editForm.price);
      payload.append('capacity', editForm.capacity);
      payload.append('hideAttendeeNames', String(event.hideAttendeeNames));
      payload.append('commentsClosed', String(event.commentsClosed));

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
                className={`settings-tile ${event.hideAttendeeNames ? 'active' : ''}`}
                disabled={settingsStatus === 'saving'}
                onClick={() =>
                  void handleOrganizerSetting(
                    'hideAttendeeNames',
                    !event.hideAttendeeNames,
                  )
                }
              >
                <strong>{copy.eventDetails.hideNamesTitle}</strong>
                <span className="muted">
                  {event.hideAttendeeNames
                    ? copy.eventDetails.hideNamesOn
                    : copy.eventDetails.hideNamesOff}
                </span>
              </button>

              <button
                type="button"
                className={`settings-tile ${event.commentsClosed ? 'active' : ''}`}
                disabled={settingsStatus === 'saving'}
                onClick={() =>
                  void handleOrganizerSetting('commentsClosed', !event.commentsClosed)
                }
              >
                <strong>{copy.eventDetails.closeCommentsTitle}</strong>
                <span className="muted">
                  {event.commentsClosed
                    ? copy.eventDetails.closeCommentsOn
                    : copy.eventDetails.closeCommentsOff}
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
                <div className="form-grid">
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

                <div className="form-grid">
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
                    <span>{copy.create.dateTimeLabel}</span>
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
          {event.commentsClosed ? (
            <p className="notice">{copy.eventDetails.commentsClosed}</p>
          ) : token ? (
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
            <p className="muted">{copy.eventDetails.signInToDiscuss}</p>
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
            <p className="notice success">{copy.eventDetails.registrationConfirmed}</p>
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

          {message ? <p className="notice">{message}</p> : null}
          <Link to="/discover" className="secondary-button">
            {copy.common.backToDiscover}
          </Link>
        </article>

        <article className="form-card">
          <span className="eyebrow">{copy.eventDetails.attendeesEyebrow}</span>
          {event.attendees.length === 0 ? (
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
