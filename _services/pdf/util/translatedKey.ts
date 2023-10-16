import axios from 'axios';
import { PHRASES_API_TOKEN, PHRASES_API_EN, PHRASES_API_DE } from '../util/constant';
import { TFunction } from 'i18next';

export const getAllTranslatedKeyValues = (lang: string = 'en') =>
  axios.get(lang === 'de' ? PHRASES_API_DE : PHRASES_API_EN, {
    headers: {
      Authorization: `token ${PHRASES_API_TOKEN}`,
    },
  });

export const getTranslation = (t: TFunction, text: string) => {
  const translation = t(`${text}.message`, { separator: ' ' });
  return getNestedTranslation(translation);
};

const getNestedTranslation = (obj: any): any => {
  if (typeof obj === 'object' && obj !== null) {
    const nestedTranslation = obj['message'];
    if (nestedTranslation !== undefined) {
      return getNestedTranslation(nestedTranslation);
    }
  }
  return obj;
};
