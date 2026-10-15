import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useTransportVisibility(target: Ref<HTMLElement | null>) {
  const visible = ref(false)
  let observer: IntersectionObserver | undefined
  watch(
    target,
    (element) => {
      observer?.disconnect()
      visible.value = false
      if (!element) return
      observer = new IntersectionObserver(
        ([entry]) => {
          if (target.value !== element) return
          visible.value = entry.isIntersecting && entry.intersectionRatio >= 1
        },
        { threshold: [0, 1] },
      )
      observer.observe(element)
    },
    { flush: 'post' },
  )
  onBeforeUnmount(() => observer?.disconnect())
  return visible
}
