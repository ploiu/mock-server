import { reactive } from 'vue';

type StoreFields = {
  test: number;
};

export const store = reactive({
  test: 1,
} as StoreFields);
