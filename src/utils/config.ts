import Joi, { ObjectPropertiesSchema } from 'joi';

export interface Config {
  PORT: string;
  DATABASE_URL: string;
  ACCESS_TOKEN_SECRET_KEY: string;
  REFRESH_TOKEN_SECRET_KEY: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_COOKIE_MAX_AGE: string;
}

type TargetType = { [k in keyof Config]-?: ObjectPropertiesSchema<Config[k]> };

const schema: TargetType = {
  PORT: Joi.string().default('3000'),
  DATABASE_URL: Joi.string().required(),
  ACCESS_TOKEN_SECRET_KEY: Joi.string().required(),
  REFRESH_TOKEN_SECRET_KEY: Joi.string().required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().required(),
  REFRESH_TOKEN_COOKIE_MAX_AGE: Joi.string().required(),
};

export const configSchema = Joi.object(schema);
