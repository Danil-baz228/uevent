export function CreateEventPage() {
  return (
    <section className="form-shell">
      <div className="form-sidebar">
        <span className="eyebrow">Organizer flow</span>
        <h1>Create-event screen starter</h1>
        <p>
          A good next backend milestone is saving drafts, validating forms, and
          later attaching Stripe checkout for paid entries.
        </p>

        <ul className="feature-list">
          <li>Draft event endpoint already exists on the API scaffold</li>
          <li>Price field maps naturally to future Stripe products</li>
          <li>Category and city are already part of the shared event shape</li>
        </ul>
      </div>

      <form className="form-card">
        <label className="field">
          <span>Title</span>
          <input placeholder="Product Night for Curious Builders" />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            placeholder="What should people expect from this gathering?"
            rows={5}
          />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Category</span>
            <input placeholder="Networking" />
          </label>

          <label className="field">
            <span>City</span>
            <input placeholder="Kharkiv" />
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Date and time</span>
            <input type="datetime-local" />
          </label>

          <label className="field">
            <span>Ticket price</span>
            <input type="number" placeholder="0" min="0" />
          </label>
        </div>

        <button type="button" className="primary-button">
          Save draft later
        </button>
      </form>
    </section>
  );
}
