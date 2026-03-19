import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
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
        setMessage(error instanceof Error ? error.message : 'Failed to load event');
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
      setMessage('You are registered for this event.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to join event');
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
        throw new Error('Stripe session URL was not returned by the API');
      }

      window.location.assign(session.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Failed to start Stripe checkout',
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
        error instanceof Error ? error.message : 'Failed to add comment',
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
        error instanceof Error ? error.message : 'Failed to delete comment',
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
            ? 'Attendee names are now hidden.'
            : 'Attendee names are visible again.'
          : value
            ? 'Comments are now closed.'
            : 'Comments are open again.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update event settings');
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
      setMessage('Event details updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setSettingsStatus('idle');
    }
  }

  async function handleDeleteEvent() {
    if (!token || !event) {
      return;
    }

    const isConfirmed = window.confirm(
      'Delete this event? This will also remove registrations and comments.',
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
      setMessage(error instanceof Error ? error.message : 'Failed to delete event');
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
    return parentComment?.author.displayName ?? 'user';
  }

  if (status === 'loading') {
    return <p className="notice">Loading event details...</p>;
  }

  if (status === 'error' || !event) {
    return (
      <section className="empty-state">
        <span className="eyebrow">Event details</span>
        <h1>Unable to open this event.</h1>
        <p>{message || 'The requested event could not be found.'}</p>
        <Link to="/discover" className="primary-button">
          Back to discover
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
          <span className="pill">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="muted">
            {event.city} / {formatEventDate(event.startsAt)}
          </p>
          <p>{event.description}</p>
        </article>

        {isOrganizer ? (
          <article className="form-card organizer-settings-card">
            <div className="settings-header">
              <div>
                <span className="eyebrow">Event settings</span>
                <h2>Manage your event</h2>
                <p className="muted">
                  Control visibility, discussion, and the event presentation from one place.
                </p>
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
                <strong>Hide attendee names</strong>
                <span className="muted">
                  {event.hideAttendeeNames
                    ? 'Visitor list is anonymized for viewers.'
                    : 'Visitor names are currently visible.'}
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
                <strong>Close comments</strong>
                <span className="muted">
                  {event.commentsClosed
                    ? 'New comments are currently blocked.'
                    : 'Visitors can join the discussion.'}
                </span>
              </button>

              <button
                type="button"
                className={`settings-tile ${isEditMode ? 'active' : ''}`}
                disabled={settingsStatus === 'saving'}
                onClick={() => setIsEditMode((current) => !current)}
              >
                <strong>{isEditMode ? 'Close editor' : 'Edit event'}</strong>
                <span className="muted">
                  Update poster, title, timing, ticket price, and capacity.
                </span>
              </button>
            </div>

            {isEditMode ? (
              <form className="settings-editor" onSubmit={handleEventUpdate}>
                <div className="form-grid">
                  <label className="field">
                    <span>Title</span>
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
                    <span>Category</span>
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
                  <span>Description</span>
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
                    <span>City</span>
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
                    <span>Date and time</span>
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
                    <span>Ticket price</span>
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
                    <span>Capacity</span>
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
                  <span>Replace poster</span>
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
                    {settingsStatus === 'saving' ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button danger-outline"
                    disabled={settingsStatus === 'saving'}
                    onClick={() => void handleDeleteEvent()}
                  >
                    Delete event
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ) : null}

        <article className="form-card">
          <span className="eyebrow">Comments</span>
          {event.commentsClosed ? (
            <p className="notice">The organizer has closed comments for this event.</p>
          ) : token ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              {commentMode !== 'create' ? (
                <div className="comment-mode-row">
                  <span className="pill">
                    {commentMode === 'reply'
                      ? `Replying to @${replyTargetName ?? 'user'}`
                      : 'Edit mode'}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={cancelCommentAction}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              <textarea
                rows={4}
                placeholder="Share your thoughts about this event"
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
                  ? 'Posting...'
                  : commentMode === 'edit'
                    ? 'Save changes'
                    : commentMode === 'reply'
                      ? 'Post reply'
                      : 'Post comment'}
              </button>
            </form>
          ) : (
            <p className="muted">Sign in to join the event discussion.</p>
          )}

          {commentMessage ? <p className="notice error">{commentMessage}</p> : null}

          {event.comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
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
                    <span className="muted">{formatEventDate(item.createdAt)}</span>
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
                          Reply
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
                              Edit
                            </button>
                            <button
                              type="button"
                              className="action-chip danger-chip"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteComment(item.id);
                              }}
                            >
                              Delete
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
                      <span className="muted">{formatEventDate(reply.createdAt)}</span>
                      {reply.parentCommentId ? (
                        <span className="reply-target">
                          Reply to @{getReplyTargetName(reply.parentCommentId)}
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
                            Reply
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
                                Edit
                              </button>
                              <button
                                type="button"
                                className="action-chip danger-chip"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDeleteComment(reply.id);
                                }}
                              >
                                Delete
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
          <span className="eyebrow">Ticket</span>
          <strong>{formatPrice(event.price)}</strong>
          <p className="muted">{event.capacity} total spots</p>
          <p className="muted">
            Organizer: {event.organizer?.displayName ?? 'Community Host'}
          </p>

          {registration?.status === 'confirmed' ? (
            <p className="notice success">You are already registered for this event.</p>
          ) : registration?.status === 'pending_payment' ? (
            <p className="notice">Payment is pending for this event.</p>
          ) : event.price > 0 ? (
            <button
              type="button"
              className="primary-button"
              disabled={!isReady || actionState === 'paying'}
              onClick={() => void handleCheckout()}
            >
              {actionState === 'paying' ? 'Opening Stripe...' : 'Buy ticket'}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={!isReady || actionState === 'joining'}
              onClick={() => void handleFreeJoin()}
            >
              {actionState === 'joining' ? 'Joining...' : 'Join event'}
            </button>
          )}

          {message ? <p className="notice">{message}</p> : null}
          <Link to="/discover" className="secondary-button">
            Back to discover
          </Link>
        </article>

        <article className="form-card">
          <span className="eyebrow">Attendees</span>
          {event.attendees.length === 0 ? (
            <p className="muted">No confirmed attendees yet.</p>
          ) : (
            <div className="related-list">
              {event.hideAttendeeNames ? (
                <p className="muted">
                  The organizer has hidden attendee names for this event.
                </p>
              ) : null}
              {event.attendees.map((attendee) => (
                <div key={attendee.id} className="related-card">
                  <strong>{attendee.displayName}</strong>
                  <span className="muted">
                    Joined {formatEventDate(attendee.joinedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="form-card">
          <span className="eyebrow">More from organizer</span>
          {event.organizerEvents.length === 0 ? (
            <p className="muted">No other published events from this organizer yet.</p>
          ) : (
            <div className="related-list">
              {event.organizerEvents.map((item) => (
                <Link key={item.id} to={`/events/${item.id}`} className="related-card">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {item.city} / {formatEventDate(item.startsAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="form-card">
          <span className="eyebrow">Similar events</span>
          {event.similarEvents.length === 0 ? (
            <p className="muted">No similar events found yet.</p>
          ) : (
            <div className="related-list">
              {event.similarEvents.map((item) => (
                <Link key={item.id} to={`/events/${item.id}`} className="related-card">
                  <strong>{item.title}</strong>
                  <span className="muted">
                    {item.category} / {formatPrice(item.price)}
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
