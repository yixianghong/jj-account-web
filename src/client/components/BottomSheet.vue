<template>
  <Teleport v-if="mounted" to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-y-full sm:translate-y-4 sm:opacity-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-to-class="translate-y-full sm:translate-y-4 sm:opacity-0"
          appear
        >
          <div
            v-if="modelValue"
            class="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <!-- 拖曳把手 -->
            <div class="pt-3 pb-1 flex justify-center shrink-0 sm:hidden">
              <span class="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            <!-- 標題列 -->
            <div class="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
              <h3 class="text-base font-bold">{{ title }}</h3>
              <UButton
                icon="i-heroicons-x-mark"
                color="neutral"
                variant="ghost"
                size="sm"
                class="rounded-full -mr-2"
                aria-label="關閉"
                @click="close"
              />
            </div>

            <!-- 內容（可捲動） -->
            <div class="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const mounted = ref(false);
onMounted(() => { mounted.value = true; });

const close = () => emit('update:modelValue', false);

// Esc 關閉
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) close();
};

// 開啟時鎖住背景捲動
watch(() => props.modelValue, (open) => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) window.addEventListener('keydown', onKeydown);
  else window.removeEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = '';
  window.removeEventListener('keydown', onKeydown);
});
</script>
