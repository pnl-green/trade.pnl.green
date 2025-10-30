import { FormEvent, useEffect, useRef, useState } from 'react';

const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT ?? '';

const initialState = {
  name: '',
  email: '',
  organization: '',
  message: '',
  consent: false,
  honeypot: '',
};

type Status = 'idle' | 'loading' | 'success' | 'error';

const ContactForm = () => {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const reset = () => {
    setForm(initialState);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 4000);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.consent) {
      setError('Please complete the required fields and consent to contact.');
      return;
    }

    const emailPattern = /.+@.+\..+/;
    if (!emailPattern.test(form.email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (form.honeypot) {
      setError('Spam detected.');
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 2000) {
      setError('Please take a moment before submitting.');
      return;
    }

    if (!contactEndpoint) {
      window.location.href = `mailto:team@intelayer.com?subject=Intelayer%20Inquiry&body=${encodeURIComponent(
        form.message,
      )}`;
      return;
    }

    try {
      setStatus('loading');
      const response = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organization: form.organization,
          message: form.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      reset();
    } catch (submitError) {
      console.error(submitError);
      setStatus('error');
      setError('Something went wrong. Please try again or email team@intelayer.com.');
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-live="assertive"
      aria-busy={status === 'loading'}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-steel" htmlFor="name">
            Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-2 w-full rounded-xl border border-border bg-elev px-4 py-3 text-sm text-ink focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-steel" htmlFor="email">
            Email*
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border border-border bg-elev px-4 py-3 text-sm text-ink focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-steel" htmlFor="organization">
            Organization (optional)
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            className="mt-2 w-full rounded-xl border border-border bg-elev px-4 py-3 text-sm text-ink focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={form.organization}
            onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))}
          />
        </div>
        <div className="hidden">
          <label htmlFor="company" className="block text-sm">
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={form.honeypot}
            onChange={(event) => setForm((prev) => ({ ...prev, honeypot: event.target.value }))}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-steel" htmlFor="message">
          How we can help*
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-2 w-full rounded-xl border border-border bg-elev px-4 py-3 text-sm text-ink focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
        />
      </div>
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          checked={form.consent}
          onChange={(event) => setForm((prev) => ({ ...prev, consent: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-border bg-elev text-green-500 focus:ring-green-500"
        />
        <label htmlFor="consent" className="text-sm text-steel">
          I consent to Intelayer contacting me about trading access and product updates.
        </label>
      </div>
      {error && <div className="text-sm text-green-200">{error}</div>}
      {status === 'success' && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          We’ll get back to you shortly.
        </div>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
};

export default ContactForm;
