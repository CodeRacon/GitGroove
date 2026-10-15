import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { usePlaybackShortcut } from './usePlaybackShortcut'

const views: ReturnType<typeof mount>[] = []
afterEach(() => {
  views.forEach((view) => view.unmount())
  views.length = 0
  document.body.innerHTML = ''
})
function setup(enabled = () => true) {
  const toggle = vi.fn()
  const view = mount(
    defineComponent({
      setup() {
        usePlaybackShortcut(enabled, toggle)
        return {}
      },
      template: '<div />',
    }),
    { attachTo: document.body },
  )
  views.push(view)
  return { view, toggle }
}
function space(target: EventTarget = document.body, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe('global playback shortcut', () => {
  it('toggles from page content and custom knobs, ignores repeat, and cleans up its listener', () => {
    const { view, toggle } = setup()
    expect(space().defaultPrevented).toBe(true)
    expect(space(document.body, { repeat: true }).defaultPrevented).toBe(true)
    expect(toggle).toHaveBeenCalledTimes(1)
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
    const knob = document.createElement('div')
    knob.setAttribute('role', 'slider')
    document.body.append(knob)
    space(knob)
    expect(toggle).toHaveBeenCalledTimes(2)
    view.unmount()
    space()
    expect(toggle).toHaveBeenCalledTimes(2)
  })
  it.each(['input', 'textarea', 'select', 'button', 'a', 'summary', 'editor', 'radio', 'switch'])(
    'leaves %s keyboard behavior intact',
    (kind) => {
      const { toggle } = setup()
      const element = document.createElement(
        ['editor', 'radio', 'switch'].includes(kind) ? 'div' : kind,
      )
      if (kind === 'a') element.setAttribute('href', '#')
      if (kind === 'editor') element.setAttribute('contenteditable', 'true')
      if (kind === 'radio' || kind === 'switch') element.setAttribute('role', kind)
      const child = document.createElement('span')
      element.append(child)
      document.body.append(element)
      expect(space(child).defaultPrevented).toBe(false)
      expect(toggle).not.toHaveBeenCalled()
    },
  )
  it('respects dialogs, modifiers, handled events, IME input and unavailable audio', () => {
    let enabled = true
    const { toggle } = setup(() => enabled)
    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')
    document.body.append(dialog)
    space()
    dialog.remove()
    space(document.body, { ctrlKey: true })
    space(document.body, { shiftKey: true })
    space(document.body, { metaKey: true })
    space(document.body, { altKey: true })
    space(document.body, { isComposing: true })
    const handled = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    handled.preventDefault()
    document.body.dispatchEvent(handled)
    enabled = false
    expect(space().defaultPrevented).toBe(false)
    expect(toggle).not.toHaveBeenCalled()
  })
})
