import { Context } from 'koa';

import { handleAddStep, handleAddStepL, handleAddStepLN } from '../services/index';


export const t = async (ctx: Context) => {
    const { text, type }: any = ctx.request.body;
    const res = await handleAddStep(text, type);
    ctx.body = { message: res };
};

export const l = async (ctx: Context) => {
    const { text, type }: any = ctx.request.body;
    const res = await handleAddStepL(text, type);
    ctx.body = { message: res };
};

export const ln = async (ctx: Context) => {
    const { title, summary }: any = ctx.request.body;
    const res = await handleAddStepLN(title, summary);
    ctx.body = { message: res };
};




export const getIndex = async (ctx: Context) => {
    ctx.body = 'Hello, this is a GET request!';
};

export const postIndex = async (ctx: Context) => {
    const data = ctx.request.body;
    ctx.body = `Hello, this is a POST request! You sent: ${JSON.stringify(data)}`;
};
