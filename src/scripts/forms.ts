/**
 * Form handling (contact form and footer newsletter).
 *
 * Out of the box, webflow.js sends forms without an `action` to Webflow's form API,
 * which only works on Webflow hosting. This module runs before webflow.js initialises
 * (module scripts execute before DOMContentLoaded), gives every form an action so
 * webflow.js leaves it alone, and submits it to PUBLIC_FORM_ENDPOINT instead (any
 * service that accepts a multipart POST, e.g. Formspree, Basin, Getform or your own API).
 *
 * The success / error states use the template's own `.w-form-done` and `.w-form-fail`
 * blocks, exactly like Webflow does. Without an endpoint the forms run in demo mode and
 * show the success state without sending anything.
 */

const endpoint: string | undefined = import.meta.env.PUBLIC_FORM_ENDPOINT || undefined;

function setWaiting(form: HTMLFormElement, waiting: boolean) {
  const button = form.querySelector<HTMLInputElement>('input[type="submit"][data-wait]');
  if (!button) return;
  if (waiting) {
    button.dataset.label = button.value;
    button.value = button.dataset.wait!;
    button.disabled = true;
  } else {
    button.value = button.dataset.label ?? button.value;
    button.disabled = false;
  }
}

function showResult(form: HTMLFormElement, ok: boolean) {
  const wrapper = form.closest('.w-form');
  const done = wrapper?.querySelector<HTMLElement>(':scope > .w-form-done');
  const fail = wrapper?.querySelector<HTMLElement>(':scope > .w-form-fail');
  if (ok) {
    form.style.display = 'none';
    if (done) {
      done.style.display = 'block';
      done.setAttribute('tabindex', '-1');
      done.focus();
    }
    if (fail) fail.style.display = 'none';
  } else if (fail) {
    fail.style.display = 'block';
  }
}

async function submit(form: HTMLFormElement) {
  if (!endpoint) {
    if (import.meta.env.DEV) console.info('[forms] PUBLIC_FORM_ENDPOINT is not set; showing the success state only.');
    showResult(form, true);
    return;
  }
  setWaiting(form, true);
  try {
    const data = new FormData(form);
    data.append('form-name', form.dataset.name ?? form.name ?? 'Form');
    const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    showResult(form, response.ok);
  } catch {
    showResult(form, false);
  } finally {
    setWaiting(form, false);
  }
}

document.querySelectorAll<HTMLFormElement>('.w-form form').forEach((form) => {
  form.setAttribute('action', endpoint ?? '#');
  form.setAttribute('method', 'post');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit(form);
  });
});
