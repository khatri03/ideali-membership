export type CustomFormValue = string | string[] | boolean | File | null;
export type CustomFormValues = Record<string, CustomFormValue>;
export type CustomFormErrors = Record<string, string>;
export type CustomQuestionValue = CustomFormValue;
export type CustomQuestionValues = Record<string, CustomQuestionValue>;
export type CustomQuestionErrors = Record<string, string>;

export type StripeCardPaymentMethodCreator = (
  cardHolderName: string,
) => Promise<{ id: string }>;
