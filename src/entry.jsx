import { bindLocale, t } from './i18n.js';
import { NS, en, zh } from './locales.js';
import { GitView } from './view.jsx';

/** Services required before the view registers: slots, the session kit, and copy. */
export const inject = ['slots', 'uiSession', 'locale'];

/**
 * Register the Git view into the conversation view ring.
 * Order 20 places it after Chat (0) and Trajectory (10); the registration is an
 * ordinary list-slot entry and shadows nothing in the shell.
 * @param {object} ctx - client context carrying the slot registry and locale.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'git-view: dictionaries');
  bindLocale(ctx);

  ctx.slots.inject('conversation.view', () =>
    ctx.slots.register(
      {
        name: 'conversation.view',
        id: 'git',
        order: 20,
        locale: NS,
        label: () => t('view.git'),
      },
      GitView,
    ),
  );
}