import { onBeforeUnmount, onMounted } from 'vue'

const interactive = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  'summary',
  'audio',
  'video',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  ...[
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'combobox',
    'listbox',
    'textbox',
    'menuitem',
    'tab',
    'treeitem',
  ].map((role) => `[role="${role}"]`),
].join(',')

export function isPlaybackShortcut(event: KeyboardEvent): boolean {
  if (
    event.key !== ' ' ||
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey
  )
    return false
  if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return false
  // Composed paths also respect controls inside a shadow root.
  return !event.composedPath().some((node) => node instanceof Element && node.matches(interactive))
}

export function usePlaybackShortcut(canToggle: () => boolean, toggle: () => void) {
  let held = false
  function keydown(event: KeyboardEvent) {
    if (event.key === ' ' && event.repeat && held) {
      event.preventDefault()
      return
    }
    if (!isPlaybackShortcut(event) || !canToggle()) return
    event.preventDefault()
    if (event.repeat) return
    held = true
    toggle()
  }
  function keyup(event: KeyboardEvent) {
    if (event.key === ' ') held = false
  }
  function blur() {
    held = false
  }
  onMounted(() => {
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('blur', blur)
  })
}
