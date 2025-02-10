import { Context } from 'koa';

import { handleAddStep, handleAddStepL } from '../services/index';


export const t = async (ctx: Context) => {
    const { text }: any = ctx.request.body;
    const res = await handleAddStep(text);
    ctx.body = { message: res };
};

export const l = async (ctx: Context) => {
    const { text }: any = ctx.request.body;
    const res = await handleAddStepL(text);
    ctx.body = { message: res };
};



export const getIndex = async (ctx: Context) => {
    ctx.body = 'Hello, this is a GET request!';
};

export const postIndex = async (ctx: Context) => {
    const data = ctx.request.body;
    ctx.body = `Hello, this is a POST request! You sent: ${JSON.stringify(data)}`;
};
